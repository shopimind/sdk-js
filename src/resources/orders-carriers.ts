import {
  processSave, processBulkSave, processUpdate, processBulkUpdate,
  processDelete, processBulkDelete, processGet, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmOrderCarrierData } from '../types/entities.js';

const ENDPOINT = 'orders-carriers';

export class SpmOrdersCarriers implements SpmOrderCarrierData {
  static readonly CHUNK_SIZE = 100;

  private readonly auth: SpmHttpClient;

  carrier_id!: string;
  shop_id!: string | null;
  name!: string;
  is_active!: boolean;
  created_at!: string;
  updated_at!: string;
  id_data_source?: number;
  source_label?: string;

  constructor(auth: SpmHttpClient) {
    this.auth = auth;
  }

  private payload(): Record<string, unknown> {
    return {
      carrier_id: this.carrier_id,
      name: this.name,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  save(): Promise<SpmEnvelope> {
    const data = this.payload();
    if (this.shop_id) data.shop_id = this.shop_id;
    if (this.id_data_source !== undefined) data.id_data_source = this.id_data_source;
    if (this.source_label !== undefined) data.source_label = this.source_label;
    return processSave(this.auth, ENDPOINT, data);
  }

  update(): Promise<SpmEnvelope> {
    return processUpdate(this.auth, ENDPOINT, compactDefined({
      ...this.payload(),
      shop_id: this.shop_id,
      id_data_source: this.id_data_source,
      source_label: this.source_label,
    }));
  }

  static bulkSave(auth: SpmHttpClient, data: SpmOrderCarrierData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, ENDPOINT, data, { defaultChunkSize: SpmOrdersCarriers.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, data: SpmOrderCarrierData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, ENDPOINT, data, { defaultChunkSize: SpmOrdersCarriers.CHUNK_SIZE, ...(options ?? {}) });
  }

  static delete(auth: SpmHttpClient, carrierId: string): Promise<SpmEnvelope> {
    return processDelete(auth, ENDPOINT, carrierId);
  }

  static bulkDelete(auth: SpmHttpClient, carrierIds: string[]): Promise<SpmEnvelope> {
    return processBulkDelete(auth, `${ENDPOINT}/bulk-delete`, { carrier_ids: carrierIds });
  }

  static list(auth: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(auth, ENDPOINT, query);
  }
}
