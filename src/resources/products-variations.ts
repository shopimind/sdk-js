import {
  processSave, processBulkSave, processUpdate, processBulkUpdate,
  processDelete, processBulkDelete, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmBulkProductVariationData, SpmProductVariationData } from '../types/entities.js';

const endpointFor = (productId: string | number): string => `products/${productId}/variations`;

export class SpmProductsVariations {
  static readonly CHUNK_SIZE = 50;

  private readonly auth: SpmHttpClient;

  product_id: string | number;
  variation_id!: number;
  name!: string;
  lang!: string;
  reference!: string | null;
  ean13!: string | null;
  link!: string;
  image_link!: string | null;
  price!: number;
  price_discount!: number | null;
  quantity_remaining!: number;
  is_default!: boolean;
  id_data_source?: number;
  source_label?: string;

  constructor(auth: SpmHttpClient, productId: string | number) {
    this.auth = auth;
    this.product_id = productId;
  }

  private payload(): Record<string, unknown> {
    return {
      variation_id: this.variation_id,
      name: this.name,
      lang: this.lang,
      reference: this.reference,
      ean13: this.ean13,
      link: this.link,
      image_link: this.image_link,
      price: this.price,
      price_discount: this.price_discount,
      quantity_remaining: this.quantity_remaining,
      is_default: this.is_default,
    };
  }

  save(): Promise<SpmEnvelope> {
    const data = this.payload();
    if (this.id_data_source !== undefined) data.id_data_source = this.id_data_source;
    if (this.source_label !== undefined) data.source_label = this.source_label;
    return processSave(this.auth, endpointFor(this.product_id), data);
  }

  update(): Promise<SpmEnvelope> {
    return processUpdate(this.auth, endpointFor(this.product_id), compactDefined({
      ...this.payload(),
      id_data_source: this.id_data_source,
      source_label: this.source_label,
    }));
  }

  static bulkSave(auth: SpmHttpClient, productId: string | number, data: SpmProductVariationData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, endpointFor(productId), data, { defaultChunkSize: SpmProductsVariations.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkSaveAll(auth: SpmHttpClient, data: SpmBulkProductVariationData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, 'products/variations/bulk', data, { defaultChunkSize: SpmProductsVariations.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, productId: string | number, data: SpmProductVariationData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, endpointFor(productId), data, { defaultChunkSize: SpmProductsVariations.CHUNK_SIZE, ...(options ?? {}) });
  }

  static delete(auth: SpmHttpClient, productId: string | number, variationId: string | number): Promise<SpmEnvelope> {
    return processDelete(auth, endpointFor(productId), variationId);
  }

  static bulkDelete(auth: SpmHttpClient, productId: string | number, variationIds: Array<string | number>): Promise<SpmEnvelope> {
    return processBulkDelete(auth, `${endpointFor(productId)}/bulk-delete`, { variation_ids: variationIds });
  }
}
