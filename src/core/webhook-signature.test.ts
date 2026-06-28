import { describe, it, expect } from 'vitest';
import { SpmWebhookSignature } from './webhook-signature.js';

const SECRET = 'whsec_test';
const BODY = '{"event":"installed","id":42}';
const FIXED_MS = 1_700_000_000_000;
const TS = String(Math.floor(FIXED_MS / 1000)); // '1700000000'
const now = () => FIXED_MS;

describe('SpmWebhookSignature', () => {
  it('sign → verify round-trips', () => {
    const sig = SpmWebhookSignature.sign(BODY, SECRET, TS);
    expect(SpmWebhookSignature.verify(BODY, TS, sig, SECRET, { now })).toEqual({ ok: true });
  });

  it('rejects a tampered body', () => {
    const sig = SpmWebhookSignature.sign(BODY, SECRET, TS);
    const r = SpmWebhookSignature.verify(`${BODY} `, TS, sig, SECRET, { now });
    expect(r).toEqual({ ok: false, reason: 'signature_mismatch' });
  });

  it('rejects a wrong secret', () => {
    const sig = SpmWebhookSignature.sign(BODY, SECRET, TS);
    expect(SpmWebhookSignature.verify(BODY, TS, sig, 'other', { now }).ok).toBe(false);
  });

  it('rejects an expired timestamp', () => {
    const oldTs = String(Math.floor(FIXED_MS / 1000) - 10_000);
    const sig = SpmWebhookSignature.sign(BODY, SECRET, oldTs);
    expect(SpmWebhookSignature.verify(BODY, oldTs, sig, SECRET, { now }).reason).toBe('timestamp_out_of_tolerance');
  });

  it('rejects a far-future timestamp', () => {
    const futureTs = String(Math.floor(FIXED_MS / 1000) + 1000);
    const sig = SpmWebhookSignature.sign(BODY, SECRET, futureTs);
    expect(SpmWebhookSignature.verify(BODY, futureTs, sig, SECRET, { now }).reason).toBe('timestamp_out_of_tolerance');
  });

  it('rejects a non-numeric timestamp', () => {
    expect(SpmWebhookSignature.verify(BODY, '0x10', 'aa', SECRET, { now }).reason).toBe('invalid_timestamp');
  });

  it('verifyFromHeaders reads the named headers', () => {
    const sig = SpmWebhookSignature.sign(BODY, SECRET, TS);
    const headers = { 'x-shopimind-timestamp': TS, 'x-shopimind-signature': sig };
    expect(
      SpmWebhookSignature.verifyFromHeaders(BODY, headers, SECRET, {
        timestampHeader: 'x-shopimind-timestamp',
        signatureHeader: 'x-shopimind-signature',
        now,
      }),
    ).toEqual({ ok: true });
  });

  it('verifyFromHeaders fails on missing headers', () => {
    expect(
      SpmWebhookSignature.verifyFromHeaders(BODY, {}, SECRET, {
        timestampHeader: 'x-shopimind-timestamp',
        signatureHeader: 'x-shopimind-signature',
        now,
      }),
    ).toEqual({ ok: false, reason: 'missing_signature_headers' });
  });
});
