import {
  processSave, processBulkSave, processUpdate, processBulkUpdate,
  processDelete, processBulkDelete, processGet, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmCustomerGroupData } from '../types/entities.js';

const ENDPOINT = 'customers-groups';

export class SpmCustomersGroups implements SpmCustomerGroupData {
  static readonly CHUNK_SIZE = 100;

  private readonly auth: SpmHttpClient;

  group_id!: string;
  shop_id!: string | null;
  lang!: string;
  name!: string;
  created_at!: string;
  updated_at!: string;
  id_data_source?: number;
  source_label?: string;

  constructor(auth: SpmHttpClient) {
    this.auth = auth;
  }

  private payload(): Record<string, unknown> {
    return {
      group_id: this.group_id,
      lang: this.lang,
      name: this.name,
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

  static bulkSave(auth: SpmHttpClient, data: SpmCustomerGroupData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, ENDPOINT, data, { defaultChunkSize: SpmCustomersGroups.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, data: SpmCustomerGroupData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, ENDPOINT, data, { defaultChunkSize: SpmCustomersGroups.CHUNK_SIZE, ...(options ?? {}) });
  }

  static delete(auth: SpmHttpClient, groupId: string): Promise<SpmEnvelope> {
    return processDelete(auth, ENDPOINT, groupId);
  }

  static bulkDelete(auth: SpmHttpClient, groupIds: string[]): Promise<SpmEnvelope> {
    return processBulkDelete(auth, `${ENDPOINT}/bulk-delete`, { group_ids: groupIds });
  }

  static list(auth: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(auth, ENDPOINT, query);
  }
}
