import type { SpmFormattedError } from '../types/common.js';

/**
 * Serialise an error or a failed envelope into a plain object suitable for
 * structured logs. Returns `null` for success envelopes / falsy input.
 */
export function formatError(errOrEnvelope: unknown): SpmFormattedError | null {
  if (!errOrEnvelope) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = errOrEnvelope as Record<string, any>;

  if (obj.ok === true) return null;

  if (obj.error && typeof obj.error === 'object') {
    const e = obj.error;
    return {
      message: String(e.message || 'Unknown error'),
      code: String(e.code || 'UNKNOWN'),
      statusCode: Number(obj.statusCode || 0),
      retryable: Boolean(e.retryable),
      attempts: Number(e.attempts || 1),
      details: e.details,
    };
  }

  const status = obj.response && Number(obj.response.status);
  const code = String(obj.code || (status ? `HTTP_${status}` : 'UNKNOWN')).toUpperCase();

  return {
    message: String(obj.message || 'Unknown error'),
    code,
    statusCode: status || 0,
    retryable: false,
    attempts: 1,
  };
}
