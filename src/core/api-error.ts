import type { SpmEnvelope } from '../types/common.js';

/**
 * Thrown by the opt-in `SpmHelpers.unwrapOrThrow` when an envelope is not ok.
 *
 * The SDK itself NEVER throws on HTTP failures (they are encoded in the envelope).
 * This exists only for callers that prefer exception-style ergonomics — e.g. a
 * sync loop that wraps every call in a try/catch.
 */
export class SpmApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly envelope: SpmEnvelope;

  constructor(env: SpmEnvelope, context?: string) {
    const message = env?.error?.message ?? 'unknown error';
    super(context ? `ShopiMind ${context} failed (HTTP ${env?.statusCode ?? 0}): ${message}` : message);
    this.name = 'SpmApiError';
    this.statusCode = env?.statusCode ?? 0;
    this.code = env?.error?.code ?? `HTTP_${env?.statusCode ?? 0}`;
    this.envelope = env;
  }
}
