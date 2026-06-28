import type { SpmChunkedData, SpmEnvelope, SpmEnvelopeError } from '../types/common.js';

/**
 * Aggregate multiple SDK envelopes (typically one per chunk) into a single
 * envelope. `ok` is `true` only if every envelope was `ok`. The aggregated data
 * includes `sent_count`, `rejected_count`, `failed_count`, a flat
 * `rejected_items` array and a per-chunk summary under `chunks`.
 */
export function mergeResponses(envelopes: SpmEnvelope[]): SpmEnvelope<SpmChunkedData> {
  if (!Array.isArray(envelopes) || envelopes.length === 0) {
    return {
      ok: true,
      statusCode: 200,
      data: {
        sent_count: 0, rejected_count: 0, failed_count: 0, rejected_items: [], chunks: [],
      },
      error: null,
    };
  }

  let sentCount = 0;
  let rejectedCount = 0;
  let failedCount = 0;
  const rejectedItems: unknown[] = [];
  const chunks: SpmChunkedData['chunks'] = [];
  const errorDetails: SpmEnvelopeError[] = [];
  let allOk = true;
  let lastStatus = 0;

  for (const env of envelopes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: Record<string, any> = env && env.data && typeof env.data === 'object' ? (env.data as Record<string, any>) : {};
    const chunkSent = Number(body.sent_count || 0);
    const chunkRejected = Number(body.rejected_count || 0);

    sentCount += chunkSent;
    rejectedCount += chunkRejected;
    if (Array.isArray(body.rejected_items)) rejectedItems.push(...body.rejected_items);

    chunks.push({
      statusCode: Number(env.statusCode || 0),
      ok: Boolean(env.ok),
      sent_count: chunkSent,
      rejected_count: chunkRejected,
    });

    if (!env.ok) {
      allOk = false;
      failedCount += Number(env._itemsSent || 0);
      if (env.error) errorDetails.push(env.error);
    }
    lastStatus = Number(env.statusCode || 0) || lastStatus;
  }

  const aggregated: SpmEnvelope<SpmChunkedData> = {
    ok: allOk,
    statusCode: allOk ? lastStatus : (errorDetails[0] as unknown as { statusCode?: number })?.statusCode || lastStatus || 0,
    data: {
      sent_count: sentCount,
      rejected_count: rejectedCount,
      failed_count: failedCount,
      rejected_items: rejectedItems,
      chunks,
    },
    error: null,
  };

  if (!allOk) {
    aggregated.error = {
      message: `${errorDetails.length} chunk(s) failed out of ${envelopes.length}`,
      code: 'PARTIAL_FAILURE',
      retryable: errorDetails.every((e) => e && e.retryable),
      attempts: Math.max(...errorDetails.map((e) => Number(e && e.attempts) || 1), 1),
      details: errorDetails,
    };
  }

  return aggregated;
}
