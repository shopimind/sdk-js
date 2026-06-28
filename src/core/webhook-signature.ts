import { createHmac, timingSafeEqual } from 'node:crypto';

export interface SpmWebhookVerifyResult {
  ok: boolean;
  reason?: string;
}

export interface SpmWebhookVerifyOptions {
  /** Anti-replay window in seconds (default 300). */
  toleranceSeconds?: number;
  /** Injectable clock (ms) for tests; defaults to Date.now. */
  now?: () => number;
}

export interface SpmWebhookHeaderOptions extends SpmWebhookVerifyOptions {
  /** Header carrying the unix-seconds timestamp (e.g. 'x-shopimind-timestamp'). */
  timestampHeader: string;
  /** Header carrying the hex HMAC signature (e.g. 'x-shopimind-signature'). */
  signatureHeader: string;
}

/**
 * Timestamped webhook signature: HMAC-SHA256 over `${timestamp}.${rawBody}`,
 * compared in constant time, with an asymmetric anti-replay window (lenient toward
 * the past, strict toward the future).
 *
 * It lives in the SDK so every consumer verifies inbound calls the same way.
 * Header-agnostic — bind it to your own header names via {@link verifyFromHeaders}.
 *
 * The connector-channel imploded-body scheme lives in {@link SpmRequestValidator}.
 */
export class SpmWebhookSignature {
  static readonly DEFAULT_TOLERANCE_SECONDS = 300;

  /** Compute the hex signature of `${timestamp}.${rawBody}`. */
  static sign(rawBody: string, secret: string, timestamp: number | string): string {
    return createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  }

  /** Verify a signature, given the timestamp + hex signature already extracted. */
  static verify(
    rawBody: string,
    timestamp: string,
    signatureHex: string,
    secret: string,
    opts: SpmWebhookVerifyOptions = {},
  ): SpmWebhookVerifyResult {
    if (!timestamp || !signatureHex) return { ok: false, reason: 'missing_signature' };
    // Strict parse (digits only): rejects '0x..', '1e9', whitespace, etc.
    if (!/^[0-9]+$/.test(timestamp)) return { ok: false, reason: 'invalid_timestamp' };
    const ts = Number(timestamp);
    if (!Number.isFinite(ts)) return { ok: false, reason: 'invalid_timestamp' };

    const tolerance = opts.toleranceSeconds ?? SpmWebhookSignature.DEFAULT_TOLERANCE_SECONDS;
    const nowSec = Math.floor((opts.now ? opts.now() : Date.now()) / 1000);
    const forwardSkew = Math.min(60, tolerance);
    const delta = nowSec - ts; // > 0: past ; < 0: future
    if (delta > tolerance || delta < -forwardSkew) {
      return { ok: false, reason: 'timestamp_out_of_tolerance' };
    }

    const expectedHex = SpmWebhookSignature.sign(rawBody, secret, timestamp);
    const provided = Buffer.from(signatureHex, 'hex');
    const expected = Buffer.from(expectedHex, 'hex');
    if (provided.length === 0 || provided.length !== expected.length) {
      return { ok: false, reason: 'signature_mismatch' };
    }
    return timingSafeEqual(provided, expected) ? { ok: true } : { ok: false, reason: 'signature_mismatch' };
  }

  /** Verify directly from a header bag, given which headers carry the ts + signature. */
  static verifyFromHeaders(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>,
    secret: string,
    opts: SpmWebhookHeaderOptions,
  ): SpmWebhookVerifyResult {
    const ts = SpmWebhookSignature.headerValue(headers, opts.timestampHeader);
    const sig = SpmWebhookSignature.headerValue(headers, opts.signatureHeader);
    if (!ts || !sig) return { ok: false, reason: 'missing_signature_headers' };
    return SpmWebhookSignature.verify(rawBody, ts, sig, secret, opts);
  }

  private static headerValue(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | undefined {
    const v = headers[name.toLowerCase()] ?? headers[name];
    return Array.isArray(v) ? v[0] : v;
  }
}
