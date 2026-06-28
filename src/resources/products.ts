import {
  processSave, processBulkSave, processUpdate, processBulkUpdate,
  processDelete, processBulkDelete, processGet, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmProductData } from '../types/entities.js';

const ENDPOINT = 'products';

export class SpmProducts implements SpmProductData {
  static readonly CHUNK_SIZE = 50;

  private readonly auth: SpmHttpClient;

  product_id!: number;
  shop_id!: string | null;
  lang!: string;
  name!: string;
  reference!: string | null;
  ean13!: string | null;
  description!: string;
  description_short!: string | null;
  link!: string;
  image_link!: string | null;
  category_ids!: number[] | null;
  manufacturer_id!: string | null;
  currency!: string;
  price!: number;
  price_discount!: number | null;
  quantity_remaining!: number;
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
      product_id: this.product_id,
      lang: this.lang,
      name: this.name,
      reference: this.reference,
      ean13: this.ean13,
      description: this.description,
      description_short: this.description_short,
      link: this.link,
      image_link: this.image_link,
      category_ids: this.category_ids,
      manufacturer_id: this.manufacturer_id,
      currency: this.currency,
      price: this.price,
      price_discount: this.price_discount,
      quantity_remaining: this.quantity_remaining,
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

  static bulkSave(auth: SpmHttpClient, data: SpmProductData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, ENDPOINT, data, { defaultChunkSize: SpmProducts.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, data: SpmProductData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, ENDPOINT, data, { defaultChunkSize: SpmProducts.CHUNK_SIZE, ...(options ?? {}) });
  }

  static delete(auth: SpmHttpClient, productId: string | number): Promise<SpmEnvelope> {
    return processDelete(auth, ENDPOINT, productId);
  }

  static bulkDelete(auth: SpmHttpClient, productIds: Array<string | number>): Promise<SpmEnvelope> {
    return processBulkDelete(auth, `${ENDPOINT}/bulk-delete`, { product_ids: productIds });
  }

  static list(auth: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(auth, ENDPOINT, query);
  }
}
