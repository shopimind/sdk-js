import {
  processSave, processBulkSave, processUpdate, processBulkUpdate,
  processDelete, processBulkDelete, processGet, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmCustomerData } from '../types/entities.js';

const ENDPOINT = 'customers';

export class SpmCustomers implements SpmCustomerData {
  static readonly CHUNK_SIZE = 50;

  private readonly auth: SpmHttpClient;

  customer_id!: string;
  shop_id!: string | null;
  email!: string;
  phone_number!: string | null;
  first_name!: string;
  last_name!: string;
  birth_date!: string | null;
  is_opt_in!: boolean;
  is_newsletter_subscribed!: boolean;
  lang!: string;
  group_ids!: string[] | null;
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
      customer_id: this.customer_id,
      email: this.email,
      phone_number: this.phone_number,
      first_name: this.first_name,
      last_name: this.last_name,
      birth_date: this.birth_date,
      is_opt_in: this.is_opt_in,
      is_newsletter_subscribed: this.is_newsletter_subscribed,
      lang: this.lang,
      group_ids: this.group_ids,
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

  static bulkSave(auth: SpmHttpClient, data: SpmCustomerData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, ENDPOINT, data, { defaultChunkSize: SpmCustomers.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, data: SpmCustomerData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, ENDPOINT, data, { defaultChunkSize: SpmCustomers.CHUNK_SIZE, ...(options ?? {}) });
  }

  static delete(auth: SpmHttpClient, customerId: string): Promise<SpmEnvelope> {
    return processDelete(auth, ENDPOINT, customerId);
  }

  static bulkDelete(auth: SpmHttpClient, customerIds: string[]): Promise<SpmEnvelope> {
    return processBulkDelete(auth, `${ENDPOINT}/bulk-delete`, { customer_ids: customerIds });
  }

  static get(auth: SpmHttpClient, id: string, fields?: string[]): Promise<SpmEnvelope> {
    return processGet(auth, `${ENDPOINT}/${id}`, fields ? { fields } : undefined);
  }

  static list(auth: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(auth, ENDPOINT, query);
  }

  static listGroups(auth: SpmHttpClient, customerId: string, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(auth, `${ENDPOINT}/${customerId}/groups`, query);
  }
}
