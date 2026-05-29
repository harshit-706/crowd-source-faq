/**
 * backfillEmbeddings — Regenerate all FAQ and CommunityPost embeddings
 * using OpenAI's embedding API.
 *
 * Required env vars:
 *   MONGODB_URI     — MongoDB connection string
 *   OPENAI_API_KEY  — OpenAI API key
 *   EMBEDDING_MODEL — model name (default: text-embedding-3-small)
 *
 * Usage:
 *   npm run backfill:embeddings
 *
 * IMPORTANT: After changing EMBEDDING_MODEL, you MUST:
 *   1. Run this script to regenerate all stored embeddings
 *   2. Update numDimensions in your MongoDB Atlas vector index:
 *        text-embedding-3-small → 1536
 *        text-embedding-3-large → 3072
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import OpenAI from 'openai';
import { generateEmbedding } from '../utils/embeddings.js';

const BATCH_SIZE = 20; // OpenAI batch embed limit

const FAQ_COLLECTION = 'yaksha_faq_faqs';
const COMM_COLLECTION = 'yaksha_faq_communityposts';

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set. Add it to your .env file.');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not set.');
    process.exit(1);
  }

  const model = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
  const expectedDims = { 'text-embedding-3-small': 1536, 'text-embedding-3-large': 3072, 'text-embedding-ada-002': 1536 };
  console.log(`Model: ${model} (vectors will be ${expectedDims[model] || 1536}-dim)`);
  console.log('Connecting to MongoDB...\n');

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  const faqColl = db.collection(FAQ_COLLECTION);
  const commColl = db.collection(COMM_COLLECTION);

  // ── Helper: normalize a vector to unit length ──────────────────────────────
  const normalize = (vec) => {
    const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return vec.map((v) => v / mag);
  };

  // ── Helper: process a batch of docs one-by-one (fallback if batch fails) ───
  const processOneByOne = async (docs, textSelector) => {
    const results = [];
    for (const doc of docs) {
      try {
        const embedding = await generateEmbedding(textSelector(doc));
        const coll = doc.question !== undefined ? faqColl : commColl;
        await coll.updateOne({ _id: doc._id }, { $set: { embedding } });
        results.push({ _id: doc._id, error: null });
      } catch (e) {
        results.push({ _id: doc._id, error: e.message });
      }
    }
    return results;
  };

  // ── Helper: process a batch using OpenAI batch endpoint ────────────────────
  const processBatch = async (docs, textSelector) => {
    const texts = docs.map(textSelector);
    try {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await client.embeddings.create({ model, input: texts });
      const vectors = response.data.map((item) => normalize(item.embedding));

      await Promise.allSettled(
        docs.map((doc, i) => {
          const coll = doc.question !== undefined ? faqColl : commColl;
          return coll.updateOne({ _id: doc._id }, { $set: { embedding: vectors[i] } });
        })
      );
      return docs.map((d) => ({ _id: d._id, error: null }));
    } catch (err) {
      console.warn(`  Batch failed (${err.message}), falling back to one-by-one...`);
      return processOneByOne(docs, textSelector);
    }
  };

  // ── Backfill FAQs ───────────────────────────────────────────────────────────
  console.log('[1/2] Backfilling FAQ embeddings...');
  let faqProcessed = 0;
  let faqErrors = 0;
  let faqBatch = [];

  const faqCursor = faqColl.find({ embedding: { $exists: true, $ne: null } }).lean().cursor();
  for await (const faq of faqCursor) {
    faqBatch.push(faq);
    if (faqBatch.length >= BATCH_SIZE) {
      const results = await processBatch(faqBatch, (d) =>
        `Section: ${d.category}. Question: ${d.question}. Answer: ${d.answer}`
      );
      for (const r of results) { r.error ? faqErrors++ : faqProcessed++; }
      faqBatch = [];
      process.stdout.write(`\r    ${faqProcessed} done${faqErrors ? ` | ${faqErrors} errors` : ''}   `);
    }
  }
  if (faqBatch.length) {
    const results = await processBatch(faqBatch, (d) =>
      `Section: ${d.category}. Question: ${d.question}. Answer: ${d.answer}`
    );
    for (const r of results) { r.error ? faqErrors++ : faqProcessed++; }
  }
  console.log(`\n    ✓ ${faqProcessed} FAQs updated${faqErrors ? `, ${faqErrors} errors` : ''}`);

  // ── Backfill Community Posts ────────────────────────────────────────────────
  console.log('[2/2] Backfilling Community Post embeddings...');
  let commProcessed = 0;
  let commErrors = 0;
  let commBatch = [];

  const commCursor = commColl.find({ embedding: { $exists: true, $ne: null } }).lean().cursor();
  for await (const post of commCursor) {
    commBatch.push(post);
    if (commBatch.length >= BATCH_SIZE) {
      const results = await processBatch(commBatch, (d) =>
        `Question: ${d.title}. Description: ${d.body}`
      );
      for (const r of results) { r.error ? commErrors++ : commProcessed++; }
      commBatch = [];
      process.stdout.write(`\r    ${commProcessed} done${commErrors ? ` | ${commErrors} errors` : ''}   `);
    }
  }
  if (commBatch.length) {
    const results = await processBatch(commBatch, (d) =>
      `Question: ${d.title}. Description: ${d.body}`
    );
    for (const r of results) { r.error ? commErrors++ : commProcessed++; }
  }
  console.log(`\n    ✓ ${commProcessed} posts updated${commErrors ? `, ${commErrors} errors` : ''}`);

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log('\n✅ Backfill complete!');
  console.log(`   FAQs:       ${faqProcessed} success${faqErrors ? `, ${faqErrors} errors` : ''}`);
  console.log(`   Community:  ${commProcessed} success${commErrors ? `, ${commErrors} errors` : ''}`);
  console.log(`\n⚠️  Update your MongoDB Atlas vector index now:`);
  console.log(`   Cluster → Atlas Search → Edit index → set numDimensions to ${expectedDims[model] || 1536}\n`);

  await mongoose.disconnect();
  process.exit(faqErrors + commErrors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err.message);
  process.exit(1);
});