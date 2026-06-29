/**
 * documentQueue — v1.71 throttle + fallback-path coverage.
 *
 * Strategy:
 *   - Mock `bullmq` so Queue/Worker/QueueEvents constructors become
 *     lightweight stubs that record their on('error', ...) handler.
 *   - Mock `documentJob` to avoid pulling in the DocumentRecord
 *     Mongoose model (which fails to re-register on module reload).
 *   - Mock `loadConfig` so the module doesn't try to read YAML files.
 *   - Mock `logger` with vi.mock + globalThis indirection (the factory
 *     is hoisted above all module-level code, so we can't reference
 *     a const defined below it). beforeEach sets fresh spies each test.
 *   - Use `vi.useFakeTimers()` to fast-forward past the 30s throttle
 *     window between tests. The throttle Map is module-level state;
 *     advancing the clock makes each test effectively start with a
 *     "fresh" throttle.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Mocks ───────────────────────────────────────────────────────────────────

type ErrorHandler = (err: Error) => void;
const queueHandlers: ErrorHandler[] = [];
const workerHandlers: ErrorHandler[] = [];
const eventsHandlers: ErrorHandler[] = [];

vi.mock('bullmq', () => {
  class FakeQueue {
    on(event: string, handler: ErrorHandler) {
      if (event === 'error') queueHandlers.push(handler);
    }
    async close() {}
    async add() { return { id: 'fake-id' }; }
  }
  class FakeWorker {
    on(event: string, handler: ErrorHandler) {
      if (event === 'error') workerHandlers.push(handler);
    }
    async close() {}
  }
  class FakeQueueEvents {
    on(event: string, handler: ErrorHandler) {
      if (event === 'error') eventsHandlers.push(handler);
    }
    async close() {}
  }
  return {
    Queue: FakeQueue,
    Worker: FakeWorker,
    QueueEvents: FakeQueueEvents,
  };
});

vi.mock('../documentJob.js', () => ({
  processDocument: vi.fn(async () => ({
    insightsCreated: 0, extractionDurationMs: 0, aiDurationMs: 0,
  })),
}));

vi.mock('../../../config/loader.js', () => ({
  loadConfig: () => ({
    redis: { url: '', token: '', tcpUrl: 'redis://127.0.0.1:65535' },
  }),
}));

vi.mock('../../../utils/http/logger.js', () => {
  // Hoisted to top — can't reference module-level vars. Forward to
  // globalThis.__loggerSpies which beforeEach reseeds each test.
  const fwd = (key: string) => (...args: unknown[]) =>
    (globalThis as any).__loggerSpies[key](...args);
  const spies = {
    info: fwd('info'),
    warn: fwd('warn'),
    error: fwd('error'),
    alert: fwd('alert'),
    audit: fwd('audit'),
    notifyDiscord: fwd('notifyDiscord'),
  };
  return {
    logger: spies,
    authLog: spies,
    adminLog: spies,
    dbLog: spies,
    cronLog: spies,
    queueLog: spies,
    httpLog: spies,
    startupLog: spies,
    shutdownLog: spies,
    securityLog: spies,
    communityLog: spies,
    supportLog: spies,
    createLogger: () => spies,
    setDiscordChannelNotifier: () => {},
    default: spies,
  };
});

// Import AFTER all vi.mock calls so the mocked modules are in place.
import {
  startDocumentWorker,
  getDocumentQueue,
  isDocumentQueueEnabled,
  __resetDocumentQueueForTests,
} from '../documentQueue.js';

// ── Lifecycle ───────────────────────────────────────────────────────────────

interface LoggerSpies {
  info: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
  alert: ReturnType<typeof vi.fn>;
  audit: ReturnType<typeof vi.fn>;
  notifyDiscord: ReturnType<typeof vi.fn>;
}

beforeEach(() => {
  (globalThis as any).__loggerSpies = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    alert: vi.fn(),
    audit: vi.fn(),
    notifyDiscord: vi.fn(),
  } satisfies LoggerSpies;
  queueHandlers.length = 0;
  workerHandlers.length = 0;
  eventsHandlers.length = 0;
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-26T00:00:00Z'));
  // v1.71 prod-502 fix added a guard that disables the local Redis
  // fallback in prod when REDIS_LOCAL_TCP_URL is unset. Tests run
  // under NODE_ENV=test (not 'development') so without this var the
  // queue is disabled by design. Set it so the listeners actually
  // register and we can exercise the throttle + fallback paths.
  process.env.REDIS_LOCAL_TCP_URL = 'redis://127.0.0.1:65535';
});

afterEach(() => {
  vi.useRealTimers();
});

const spies = (): LoggerSpies => (globalThis as any).__loggerSpies;

// ── Helpers ─────────────────────────────────────────────────────────────────

function wire() {
  __resetDocumentQueueForTests();
  // startDocumentWorker creates the Worker + QueueEvents listeners.
  // The Queue is created lazily by getDocumentQueue() on first
  // addDocumentJob — force it here so we exercise all three listeners.
  startDocumentWorker();
  getDocumentQueue();
}

function spamAll(err: Error) {
  queueHandlers.forEach((h) => h(err));
  workerHandlers.forEach((h) => h(err));
  eventsHandlers.forEach((h) => h(err));
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('documentQueue — v1.71 warn throttle + fallback', () => {
  describe('throttle: identical errors', () => {
    it('emits one warn per (listener, message) within the 30s window', () => {
      wire();
      const err = new Error('connect ECONNREFUSED 127.0.0.1:65535');
      spamAll(err);

      // 1 emit per listener × 3 listeners = 3 warns from the listeners.
      expect(spies().warn).toHaveBeenCalledTimes(3);

      // Fire 99 more times in the same 30s window — should be silenced.
      for (let i = 0; i < 99; i++) spamAll(err);
      expect(spies().warn).toHaveBeenCalledTimes(3);
    });

    it('throttles identical warns to one per 30s window (across all listeners)', () => {
      // Set clock to t=0, fire same error once → 3 emits (one per listener).
      wire();
      const err = new Error('connect ECONNREFUSED 127.0.0.1:65535');
      spamAll(err);
      const afterFirst = spies().warn.mock.calls.length;
      // First spam emits 3 warns (queue + worker + events listeners each
      // log once). The "Remote Redis connection failed" or "Disabling..."
      // state-change messages also fire from handleQueueConnectionError —
      // expect ≥ 3 but don't pin an exact number (it depends on which
      // listener hit the matcher first and flipped useLocalFallback).
      expect(afterFirst).toBeGreaterThanOrEqual(3);
      expect(afterFirst).toBeLessThanOrEqual(6);

      // Spam the same error 99 more times within the same 30s window.
      // Nothing new should be warned. (The state may have flipped to
      // queueFailed=true on the first spam, in which case the early-return
      // silences further emits. Either way, no new warns.)
      for (let i = 0; i < 99; i++) spamAll(err);
      expect(spies().warn.mock.calls.length).toBe(afterFirst);
    });
  });

  describe('throttle: distinct errors get through immediately', () => {
    it('logs each distinct error message until queueFailed flips true', () => {
      wire();
      // Two distinct matched errors — the first flips useLocalFallback,
      // the second flips queueFailed. After that, early-return silences
      // everything else. We expect exactly 2 distinct warns from the
      // queue listener before the disable path triggers.
      const errors = [
        new Error('connect ECONNREFUSED 127.0.0.1:65535'),
        new Error('connect ETIMEDOUT'),
      ];
      for (const e of errors) {
        queueHandlers.forEach((h) => h(e));
      }
      const queueWarns: string[] = spies().warn.mock.calls
        .filter((c: unknown[]) => String(c[0] ?? '').includes('Queue error'))
        .map((c: unknown[]) => String(c[0] ?? ''));
      expect(queueWarns).toHaveLength(2);

      // Now fire two more distinct messages — both should be silenced
      // because queueFailed is true.
      const beforeCount = spies().warn.mock.calls.length;
      queueHandlers.forEach((h) => h(new Error('Connection is closed.')));
      queueHandlers.forEach((h) => h(new Error('READONLY')));
      const afterCount = spies().warn.mock.calls.length;
      expect(afterCount).toBe(beforeCount);
    });
  });

  describe('broader error matchers in handleQueueConnectionError', () => {
    it.each([
      ['connect ECONNREFUSED 127.0.0.1:65535'],
      ['connect ECONNRESET'],
      ['connect ETIMEDOUT'],
      ['getaddrinfo ENOTFOUND redis.example.com'],
      ['Connection is closed.'],
      ["READONLY You can't write against a read only replica."],
      ["Stream isn't writeable and enableOfflineQueue options is false"],
      ['Stream is not writeable'],
    ])('matches "%s" and emits the fallback warn', (msg: string) => {
      wire();
      queueHandlers.forEach((h) => h(new Error(msg)));

      const stateChangeWarn = spies().warn.mock.calls.find((c: unknown[]) =>
        String(c[0] ?? '').includes('Remote Redis connection failed')
      );
      expect(stateChangeWarn).toBeDefined();
    });

    it('does NOT match unrelated error messages', () => {
      wire();
      queueHandlers.forEach((h) => h(new Error('something completely unrelated')));

      const stateChangeWarn = spies().warn.mock.calls.find((c: unknown[]) =>
        String(c[0] ?? '').includes('Remote Redis connection failed')
      );
      expect(stateChangeWarn).toBeUndefined();
    });
  });

  describe('queueFailed early-return', () => {
    it('stops emitting warns once queueFailed flips true', () => {
      wire();

      // First matched error flips useLocalFallback.
      queueHandlers.forEach((h) => h(new Error('connect ECONNREFUSED 127.0.0.1:65535')));

      // Second matched (different message to avoid throttle) flips queueFailed.
      queueHandlers.forEach((h) => h(new Error('connect ETIMEDOUT')));

      const disableErr = spies().error.mock.calls.find((c: unknown[]) =>
        String(c[0] ?? '').includes('Disabling document processing worker')
      );
      expect(disableErr).toBeDefined();
      expect(isDocumentQueueEnabled()).toBe(false);

      const beforeCount = spies().warn.mock.calls.length;

      // 50 more errors with 50 distinct messages — none should warn
      // because queueFailed is true and the early-return short-circuits.
      for (let i = 0; i < 50; i++) {
        spamAll(new Error(`connect EAGAIN ${i}`));
      }
      expect(spies().warn.mock.calls.length).toBe(beforeCount);
    });
  });
});