/**
 * embeddings.ts — semantic embedding pipeline.
 *
 * Replaced static configurations with dynamic lookups from the database.
 * Supports OpenAI, Custom, HuggingFace Inference API, and Local in-process pipeline.
 * 
 * Supports per-program overrides when batchId is supplied.
 */

import {
  pipeline,
  FeatureExtractionPipeline,
  env as transformersEnv,
} from '@huggingface/transformers';
import mongoose, { Types } from 'mongoose';
import AiConfig from '../../modules/ai/ai-config.model.js';
import { logger } from '../http/logger.js';

export const MODEL_SLUG = 'mixedbread-ai/mxbai-embed-large-v1';
export const EMBEDDING_DIM = 1024;
/** Retrieval prompt prepended to search queries. Don't add to documents. */
export const QUERY_PROMPT = 'Represent this sentence for searching relevant passages: ';

const HF_API_BASE = 'https://router.huggingface.co/hf-inference/models';
const HF_MAX_RETRIES = 2;
const HF_TIMEOUT_MS = 30_000;
const HF_RETRY_DELAY_MS = 500;

/**
 * Dynamically resolve embedding settings from the active database configuration.
 * Automatically handles fallbacks and default global credentials.
 */
export async function getActiveEmbeddingConfig(batchId: string | null = null) {
  let config: any = null;
  try {
    if (mongoose.connection.readyState === 1) {
      if (batchId && Types.ObjectId.isValid(batchId)) {
        config = await AiConfig.findOne({ batchId, isActive: true });
      }
      if (!config) {
        config = await AiConfig.findOne({ batchId: null, isActive: true });
      }
    }
  } catch (err) {
    logger.warn(`[embeddings] Failed to resolve active AiConfig for embeddings: ${(err as Error).message}`);
  }

  let provider: 'local' | 'huggingface' | 'openai' | 'custom' = 'local';
  let model = MODEL_SLUG;
  let dimensions = EMBEDDING_DIM;
  let baseURL = '';
  let apiKey = '';

  if (config && config.embedding) {
    provider = config.embedding.provider || 'local';
    model = config.embedding.model || MODEL_SLUG;
    dimensions = config.embedding.dimensions || EMBEDDING_DIM;
    baseURL = config.embedding.baseURL || '';
    apiKey = config.getEmbeddingApiKey() || '';
  } else {
    // Legacy environment variable fallback
    const hfKey = (process.env.HUGGINGFACE_API_KEY ?? '').trim();
    if (hfKey) {
      provider = 'huggingface';
      apiKey = hfKey;
    }
  }

  // DO NOT fallback to global credentials (e.g. chat provider keys or baseURLs).
  // Everything must be configured strictly separately.
  if (!apiKey) {
    if (provider === 'openai' || provider === 'custom') {
      apiKey = (process.env.EMBEDDING_API_KEY ?? '').trim();
    } else if (provider === 'huggingface') {
      apiKey = (process.env.EMBEDDING_API_KEY ?? process.env.HUGGINGFACE_API_KEY ?? '').trim();
    }
  }

  if (!baseURL) {
    if (provider === 'openai') {
      baseURL = (process.env.EMBEDDING_BASE_URL ?? 'https://api.openai.com/v1').trim();
    } else if (provider === 'custom') {
      baseURL = (process.env.EMBEDDING_BASE_URL ?? 'http://localhost:11434/v1').trim();
    }
  }

  return { provider, model, dimensions, baseURL, apiKey };
}

/**
 * Call the HF Inference API for a single text.
 */
async function callHfApiEmbedding(text: string, apiKey: string, model: string): Promise<number[]> {
  if (!apiKey) {
    throw new Error('HUGGINGFACE_API_KEY (or embedding specific key) is not set');
  }
  const url = `${HF_API_BASE}/${model}`;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= HF_MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), HF_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true, use_cache: true },
        }),
        signal: controller.signal,
      });
      clearTimeout(t);

      if (!res.ok) {
        const errText = await res.text().catch(() => '<body unreadable>');
        const err = new Error(`HF Inference API ${res.status}: ${errText}`);
        const retryable = res.status === 429 || res.status >= 500;
        if (retryable && attempt < HF_MAX_RETRIES) {
          lastError = err;
          logger.warn(`[embeddings] HF API ${res.status} (attempt ${attempt}/${HF_MAX_RETRIES}) — retrying in ${HF_RETRY_DELAY_MS}ms`);
          await new Promise((r) => setTimeout(r, HF_RETRY_DELAY_MS));
          continue;
        }
        throw err;
      }

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`HF Inference API returned unexpected shape: ${JSON.stringify(data).slice(0, 200)}`);
      }
      const first = data[0];
      if (Array.isArray(first)) {
        if (Array.isArray(first[0])) {
          return normalizeL2(first[0] as number[]);
        }
        return normalizeL2(first as number[]);
      }
      return normalizeL2(data as number[]);
    } catch (err) {
      clearTimeout(t);
      const e = err as Error & { code?: number; name?: string };
      const isAbort = e?.name === 'AbortError' || e?.code === 20;
      if (isAbort && attempt < HF_MAX_RETRIES) {
        lastError = e;
        logger.warn(`[embeddings] HF API call aborted (attempt ${attempt}/${HF_MAX_RETRIES}) — retrying in ${HF_RETRY_DELAY_MS}ms`);
        await new Promise((r) => setTimeout(r, HF_RETRY_DELAY_MS));
        continue;
      }
      throw err;
    }
  }
  throw lastError ?? new Error('HF embedding failed after retries');
}

/**
 * Call OpenAI or OpenAI-compatible embeddings API.
 */
async function callOpenAiEmbedding(text: string, apiKey: string, model: string, baseURL: string, dimensions?: number): Promise<number[]> {
  if (!apiKey) {
    throw new Error('API Key is required for OpenAI/Custom embedding provider');
  }
  const base = baseURL.replace(/\/$/, '');
  const url = `${base}/embeddings`;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), HF_TIMEOUT_MS);

  try {
    const body: Record<string, unknown> = {
      input: text,
      model,
    };
    
    // Pass dimensions parameter only if configured AND model is text-embedding-3
    if (dimensions && (model.includes('text-embedding-3') || dimensions !== 1024)) {
      body.dimensions = dimensions;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      const errText = await res.text().catch(() => '<body unreadable>');
      throw new Error(`OpenAI-compatible Embedding API ${res.status}: ${errText}`);
    }

    const data = await res.json() as { data?: { embedding?: number[] }[] };
    const vec = data.data?.[0]?.embedding;
    if (!Array.isArray(vec)) {
      throw new Error(`Embedding API returned unexpected shape: ${JSON.stringify(data).slice(0, 200)}`);
    }

    return normalizeL2(vec);
  } catch (err) {
    clearTimeout(t);
    throw err;
  }
}

function normalizeL2(vec: number[]): number[] {
  let sumSq = 0;
  for (const v of vec) sumSq += v * v;
  const norm = Math.sqrt(sumSq);
  if (norm === 0) return vec;
  return vec.map(v => v / norm);
}

// ── In-process local pipeline (fallback) ───────────────────────────────
const cachedEmbedders = new Map<string, FeatureExtractionPipeline>();
let isWarmed = false;

async function getEmbedder(modelName: string): Promise<FeatureExtractionPipeline> {
  let embedder = cachedEmbedders.get(modelName);
  if (!embedder) {
    transformersEnv.cacheDir = './.cache/transformers';
    transformersEnv.allowLocalModels = true;
    embedder = await pipeline(
      'feature-extraction',
      modelName,
      { dtype: 'fp32' },
    ) as FeatureExtractionPipeline;
    cachedEmbedders.set(modelName, embedder);
    isWarmed = true;
  }
  return embedder;
}

/** Warm up the in-process embedding pipeline. */
export const warmEmbedder = async (): Promise<void> => {
  const { provider, model } = await getActiveEmbeddingConfig();
  if (provider !== 'local') return;
  await getEmbedder(model);
};

/**
 * Generate an embedding for a DOCUMENT (FAQ, post, etc.).
 */
export const generateEmbedding = async (text: string, options?: { batchId?: string | null }): Promise<number[]> => {
  const { provider, model, dimensions, baseURL, apiKey } = await getActiveEmbeddingConfig(options?.batchId);

  if (provider === 'huggingface') {
    return callHfApiEmbedding(text, apiKey, model);
  }
  
  if (provider === 'openai' || provider === 'custom') {
    return callOpenAiEmbedding(text, apiKey, model, baseURL, dimensions);
  }

  // Fallback to local in-process ONNX pipeline
  const embedder = await getEmbedder(model);
  const output = await embedder(text, {
    pooling: 'cls',
    normalize: true,
  });
  return Array.from(output.data as Float32Array | number[]);
};

/**
 * Generate an embedding for a SEARCH QUERY.
 */
export const generateQueryEmbedding = async (query: string, options?: { batchId?: string | null }): Promise<number[]> => {
  return generateEmbedding(QUERY_PROMPT + query, options);
};

/** Re-export for diagnostic scripts. True if a warm in-process pipeline exists. */
export const __isWarmed = (): boolean => isWarmed;
