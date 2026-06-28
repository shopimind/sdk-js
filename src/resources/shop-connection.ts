import { processBulkSave } from '../core/methods.js';
import type { SpmEnvelope, SpmHttpClient } from '../types/common.js';
import type { SpmShopConnectionData } from '../types/entities.js';

export class SpmShopConnection {
  /** Persist the shop connection configuration. POST `shop/connection`. */
  static saveConfiguration(httpClient: SpmHttpClient, data: SpmShopConnectionData): Promise<SpmEnvelope> {
    return processBulkSave(httpClient, 'shop/connection', data);
  }
}
