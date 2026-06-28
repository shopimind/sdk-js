import {
  describe, it, expect, vi, afterEach,
} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import type { AxiosError } from 'axios';
import {
  DEFAULT_RETRY_OPTIONS, isRetryableError, computeBackoff,
} from './retry.js';
import { SpmClient } from './client.js';
import { processGet, processRequest } from './methods.js';

const err = (partial: Partial<AxiosError>): AxiosError => partial as AxiosError;

describe('isRetryableError', () => {
  it('retries 408/429/5xx but NOT 409/4xx', () => {
    for (const s of [408, 429, 500, 502, 503, 504]) {
      expect(isRetryableError(err({ response: { status: s } as never }), DEFAULT_RETRY_OPTIONS)).toBe(true);
    }
    expect(isRetryableError(err({ response: { status: 409 } as never }), DEFAULT_RETRY_OPTIONS)).toBe(false);
    expect(isRetryableError(err({ response: { status: 404 } as never }), DEFAULT_RETRY_OPTIONS)).toBe(false);
  });

  it('retries known network codes and message patterns', () => {
    expect(isRetryableError(err({ code: 'ETIMEDOUT' }), DEFAULT_RETRY_OPTIONS)).toBe(true);
    expect(isRetryableError(err({ message: 'connection refused' }), DEFAULT_RETRY_OPTIONS)).toBe(true);
    expect(isRetryableError(err({ message: 'totally fine' }), DEFAULT_RETRY_OPTIONS)).toBe(false);
  });
});

describe('computeBackoff', () => {
  it('grows with the attempt and is capped', () => {
    const first = computeBackoff(1, DEFAULT_RETRY_OPTIONS);
    expect(first).toBeGreaterThanOrEqual(1000);
    expect(first).toBeLessThan(1500); // 1000 base + <500 jitter
    expect(computeBackoff(50, DEFAULT_RETRY_OPTIONS)).toBe(DEFAULT_RETRY_OPTIONS.backoffCapMs);
  });
});

describe('retry interceptor (integration)', () => {
  afterEach(() => vi.useRealTimers());

  it('retries a retryable 503 then succeeds', async () => {
    vi.useFakeTimers();
    const c = SpmClient.getClient('v1', 'k', { baseUrl: 'http://localhost', labelSource: null, retry: { maxRetries: 2 } });
    const mock = new MockAdapter(c);
    mock.onGet('x').replyOnce(503).onGet('x').replyOnce(200, { ok: 1 });

    const p = processGet(c, 'x');
    await vi.runAllTimersAsync();
    const env = await p;

    expect(env.ok).toBe(true);
    expect(env.error).toBeNull();
  });

  it('does NOT replay a POST (non-idempotent) without an idempotency key', async () => {
    vi.useFakeTimers();
    const c = SpmClient.getClient('v1', 'k', { baseUrl: 'http://localhost', labelSource: null, retry: { maxRetries: 3 } });
    const mock = new MockAdapter(c);
    mock.onPost('x').reply(503);

    const p = processRequest(c, 'post', 'x', { a: 1 });
    await vi.runAllTimersAsync();
    const env = await p;

    expect(env.ok).toBe(false);
    expect(mock.history.post.length).toBe(1); // single attempt, no replay
  });

  it('replays a POST that carries an idempotency key', async () => {
    vi.useFakeTimers();
    const c = SpmClient.getClient('v1', 'k', { baseUrl: 'http://localhost', labelSource: null, retry: { maxRetries: 2 } });
    const mock = new MockAdapter(c);
    mock.onPost('x').replyOnce(503).onPost('x').replyOnce(200, { ok: 1 });

    const p = processRequest(c, 'post', 'x', { a: 1 }, { 'Idempotency-Key': 'abc' });
    await vi.runAllTimersAsync();
    const env = await p;

    expect(env.ok).toBe(true);
    expect(mock.history.post.length).toBe(2);
  });
});
