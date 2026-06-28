import { processGet } from '../core/methods.js';
import type { SpmEnvelope, SpmHttpClient } from '../types/common.js';

const ENDPOINT = 'carts';

/**
 * Carts — read-only access to shop carts (in-progress, abandoned, converted).
 * The public API exposes no write route for carts; push orders via `SpmOrders`.
 */
export class SpmCarts {
  static list(client: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, ENDPOINT, query);
  }
}
