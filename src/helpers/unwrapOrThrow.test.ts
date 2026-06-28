import { describe, it, expect } from 'vitest';
import { SpmHelpers } from './index.js';
import { SpmApiError } from '../core/api-error.js';
import type { SpmEnvelope } from '../types/common.js';

const okEnv = (data: unknown): SpmEnvelope => ({ ok: true, statusCode: 200, data, error: null });
const failEnv: SpmEnvelope = {
  ok: false,
  statusCode: 422,
  data: null,
  error: { message: 'bad request', code: 'HTTP_422', retryable: false, attempts: 1 },
};

describe('SpmHelpers.unwrapOrThrow', () => {
  it('returns the payload on success', () => {
    expect(SpmHelpers.unwrapOrThrow(okEnv({ id: 1 }))).toEqual({ id: 1 });
  });

  it('peels the API double-nesting (res.data.data)', () => {
    expect(SpmHelpers.unwrapOrThrow(okEnv({ statusCode: 200, data: [{ x: 1 }] }))).toEqual([{ x: 1 }]);
  });

  it('throws SpmApiError on a failed envelope, carrying status + code', () => {
    expect(() => SpmHelpers.unwrapOrThrow(failEnv, 'createX')).toThrow(SpmApiError);
    try {
      SpmHelpers.unwrapOrThrow(failEnv, 'createX');
    } catch (e) {
      expect(e).toBeInstanceOf(SpmApiError);
      expect((e as SpmApiError).statusCode).toBe(422);
      expect((e as SpmApiError).code).toBe('HTTP_422');
      expect((e as SpmApiError).message).toContain('createX');
    }
  });
});
