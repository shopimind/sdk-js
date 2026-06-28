import {
  processSave, processBulkSave, processUpdate, processBulkUpdate,
  processDelete, processBulkDelete, processGet, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmVoucherData } from '../types/entities.js';

const ENDPOINT = 'vouchers';

export class SpmVouchers implements SpmVoucherData {
  static readonly CHUNK_SIZE = 50;

  private readonly auth: SpmHttpClient;

  voucher_id!: string;
  shop_id!: string | null;
  lang!: string;
  code!: string;
  description!: string;
  started_at!: string;
  ended_at!: string | null;
  customer_id!: string | null;
  type_voucher!: 'free_shipping' | 'amount_reduction' | 'percentage_reduction';
  value!: number | null;
  minimum_amount!: number;
  currency!: string;
  reduction_tax!: boolean;
  is_used!: boolean;
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
      voucher_id: this.voucher_id,
      lang: this.lang,
      code: this.code,
      description: this.description,
      started_at: this.started_at,
      ended_at: this.ended_at,
      customer_id: this.customer_id,
      type_voucher: this.type_voucher,
      value: this.value,
      minimum_amount: this.minimum_amount,
      currency: this.currency,
      reduction_tax: this.reduction_tax,
      is_used: this.is_used,
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

  static bulkSave(auth: SpmHttpClient, data: SpmVoucherData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, ENDPOINT, data, { defaultChunkSize: SpmVouchers.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, data: SpmVoucherData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, ENDPOINT, data, { defaultChunkSize: SpmVouchers.CHUNK_SIZE, ...(options ?? {}) });
  }

  static delete(auth: SpmHttpClient, voucherId: string): Promise<SpmEnvelope> {
    return processDelete(auth, ENDPOINT, voucherId);
  }

  static bulkDelete(auth: SpmHttpClient, voucherIds: string[]): Promise<SpmEnvelope> {
    return processBulkDelete(auth, `${ENDPOINT}/bulk-delete`, { voucher_ids: voucherIds });
  }

  static list(auth: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(auth, ENDPOINT, query);
  }
}
