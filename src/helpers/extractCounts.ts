/**
 * Extract `sent_count`, `rejected_count`, `failed_count` from an envelope or a
 * raw API body. Robust to both shapes (SDK envelope vs. direct body).
 */
export function extractCounts(envelopeOrData: unknown): { sent: number; rejected: number; failed: number } {
  if (!envelopeOrData || typeof envelopeOrData !== 'object') {
    return { sent: 0, rejected: 0, failed: 0 };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obj = envelopeOrData as Record<string, any>;
  const d = obj.data && typeof obj.data === 'object' ? obj.data : obj;
  return {
    sent: Number(d.sent_count || 0),
    rejected: Number(d.rejected_count || 0),
    failed: Number(d.failed_count || 0),
  };
}
