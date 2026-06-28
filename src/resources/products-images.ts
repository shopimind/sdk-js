import {
  processSave, processBulkSave, processUpdate, processBulkUpdate,
  processDelete, processBulkDelete, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmBulkProductImageData, SpmProductImageData } from '../types/entities.js';

const endpointFor = (productId: string | number): string => `products/${productId}/images`;

export class SpmProductsImages {
  static readonly CHUNK_SIZE = 50;

  private readonly auth: SpmHttpClient;

  product_id: string | number;
  image_id!: string;
  lang!: string;
  variation_id!: number | null;
  url!: string;
  is_default!: boolean;
  id_data_source?: number;
  source_label?: string;

  constructor(auth: SpmHttpClient, productId: string | number) {
    this.auth = auth;
    this.product_id = productId;
  }

  private payload(): Record<string, unknown> {
    return {
      image_id: this.image_id,
      lang: this.lang,
      variation_id: this.variation_id,
      url: this.url,
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

  static bulkSave(auth: SpmHttpClient, productId: string | number, data: SpmProductImageData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, endpointFor(productId), data, { defaultChunkSize: SpmProductsImages.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkSaveAll(auth: SpmHttpClient, data: SpmBulkProductImageData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, 'products/images/bulk', data, { defaultChunkSize: SpmProductsImages.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, productId: string | number, data: SpmProductImageData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, endpointFor(productId), data, { defaultChunkSize: SpmProductsImages.CHUNK_SIZE, ...(options ?? {}) });
  }

  static delete(auth: SpmHttpClient, productId: string | number, imageId: string): Promise<SpmEnvelope> {
    return processDelete(auth, endpointFor(productId), imageId);
  }

  static bulkDelete(auth: SpmHttpClient, productId: string | number, imageIds: string[]): Promise<SpmEnvelope> {
    return processBulkDelete(auth, `${endpointFor(productId)}/bulk-delete`, { image_ids: imageIds });
  }
}
