import { describe, it, expect } from 'vitest';
import { SpmHelpers } from './index.js';
import type { SpmEnvelope } from '../types/common.js';

const env = (over: Partial<SpmEnvelope> & { data?: unknown }): SpmEnvelope => ({
  ok: true, statusCode: 200, data: null, error: null, ...over,
} as SpmEnvelope);

describe('SpmHelpers.chunk', () => {
  it('splits into batches and guards bad input', () => {
    expect(SpmHelpers.chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(SpmHelpers.chunk([1, 2], 0)).toEqual([]);
  });
});

describe('SpmHelpers.mergeResponses', () => {
  it('aggregates counts and is ok only if every chunk is ok', () => {
    const merged = SpmHelpers.mergeResponses([
      env({ ok: true, data: { sent_count: 2, rejected_count: 1 } }),
      env({ ok: true, data: { sent_count: 3, rejected_count: 0 } }),
    ]);
    expect(merged.ok).toBe(true);
    expect(merged.data?.sent_count).toBe(5);
    expect(merged.data?.rejected_count).toBe(1);
    expect(merged.data?.chunks.length).toBe(2);
  });

  it('marks PARTIAL_FAILURE and sums failed items of failed chunks', () => {
    const merged = SpmHelpers.mergeResponses([
      env({ ok: true, data: { sent_count: 1 } }),
      env({
        ok: false, statusCode: 500, data: null, error: { message: 'x', code: 'HTTP_500', retryable: true, attempts: 1 }, _itemsSent: 4,
      } as SpmEnvelope),
    ]);
    expect(merged.ok).toBe(false);
    expect(merged.data?.failed_count).toBe(4);
    expect(merged.error?.code).toBe('PARTIAL_FAILURE');
  });
});

describe('SpmHelpers.extractCounts', () => {
  it('reads counts from an envelope or a raw body', () => {
    expect(SpmHelpers.extractCounts(env({ data: { sent_count: 2, rejected_count: 1, failed_count: 0 } }))).toEqual({ sent: 2, rejected: 1, failed: 0 });
    expect(SpmHelpers.extractCounts({ sent_count: 7 })).toEqual({ sent: 7, rejected: 0, failed: 0 });
  });
});

describe('SpmHelpers.isRetryable / formatError', () => {
  it('isRetryable is false for ok envelopes, uses error.retryable otherwise', () => {
    expect(SpmHelpers.isRetryable(env({ ok: true }))).toBe(false);
    expect(SpmHelpers.isRetryable({ ok: false, error: { retryable: true } })).toBe(true);
  });

  it('formatError returns null for ok, structured object for failures', () => {
    expect(SpmHelpers.formatError(env({ ok: true }))).toBeNull();
    const f = SpmHelpers.formatError({ ok: false, statusCode: 500, error: { message: 'boom', code: 'HTTP_500', retryable: true, attempts: 2 } });
    expect(f).toMatchObject({ message: 'boom', code: 'HTTP_500', statusCode: 500, retryable: true, attempts: 2 });
  });
});
