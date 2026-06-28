import {
  processSave, processBulkSave, processUpdate, processBulkUpdate,
  processDelete, processBulkDelete, processGet, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmProductCategoryData } from '../types/entities.js';

const ENDPOINT = 'products-categories';

export class SpmProductsCategories implements SpmProductCategoryData {
  static readonly CHUNK_SIZE = 100;

  private readonly auth: SpmHttpClient;

  category_id!: number;
  shop_id!: string | null;
  lang!: string;
  name!: string;
  description!: string;
  parent_category_id!: number | null;
  link!: string;
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
      category_id: this.category_id,
      lang: this.lang,
      name: this.name,
      description: this.description,
      parent_category_id: this.parent_category_id,
      link: this.link,
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

  static bulkSave(auth: SpmHttpClient, data: SpmProductCategoryData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, ENDPOINT, data, { defaultChunkSize: SpmProductsCategories.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, data: SpmProductCategoryData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, ENDPOINT, data, { defaultChunkSize: SpmProductsCategories.CHUNK_SIZE, ...(options ?? {}) });
  }

  static delete(auth: SpmHttpClient, categoryId: string | number): Promise<SpmEnvelope> {
    return processDelete(auth, ENDPOINT, categoryId);
  }

  static bulkDelete(auth: SpmHttpClient, categoryIds: Array<string | number>): Promise<SpmEnvelope> {
    return processBulkDelete(auth, `${ENDPOINT}/bulk-delete`, { category_ids: categoryIds });
  }

  static list(auth: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(auth, ENDPOINT, query);
  }
}
