import { DEFAULT_RETRY_OPTIONS, isRetryableError } from '../core/retry.js';
import type { ResolvedRetryOptions, SpmRetryOptions } from '../types/common.js';

/**
 * Determine whether an error or a failed envelope should be retried. Accepts
 * either an axios-style error or an SDK envelope with `envelope.error`. Returns
 * `false` on success envelopes.
 */
export function isRetryable(errOrEnvelope: unknown, options?: Partial<SpmRetryOptions>): boolean {
  if (!errOrEnvelope) return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = errOrEnvelope as Record<string, any>;

  if (obj.ok === true) return false;

  if (obj.error && typeof obj.error === 'object' && typeof obj.error.retryable === 'boolean') {
    return obj.error.retryable;
  }

  const opts: ResolvedRetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...(options || {}) };
  return isRetryableError(errOrEnvelope, opts);
}
