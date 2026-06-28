import type { SpmEnvelope } from '../types/common.js';
import { SpmApiError } from '../core/api-error.js';

/**
 * Opt-in exception mode: return the business payload, or throw `SpmApiError` if
 * the call failed. Peels the API double-nesting (`res.data.data`).
 *
 * The SDK never throws by itself; use this when you prefer try/catch ergonomics
 * over inspecting `env.ok` at every call site.
 */
export function unwrapOrThrow<T = unknown>(env: SpmEnvelope, context?: string): T {
  if (!env || !env.ok) {
    throw new SpmApiError(env, context);
  }
  const body = env.data as Record<string, unknown> | null;
  if (body && typeof body === 'object' && 'data' in body && 'statusCode' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}
