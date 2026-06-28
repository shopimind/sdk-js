import {
  processSave, processBulkSave, processUpdate, processBulkUpdate, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmNewsletterSubscriberData } from '../types/entities.js';

const ENDPOINT = 'newsletter-subscribers';

export class SpmNewsletterSubscribers implements SpmNewsletterSubscriberData {
  static readonly CHUNK_SIZE = 50;

  private readonly auth: SpmHttpClient;

  shop_id!: string | null;
  email!: string;
  is_subscribed!: boolean;
  first_name!: string;
  last_name!: string;
  postal_code!: string;
  lang!: string;
  updated_at!: string;

  constructor(auth: SpmHttpClient) {
    this.auth = auth;
  }

  private payload(): Record<string, unknown> {
    return {
      email: this.email,
      is_subscribed: this.is_subscribed,
      first_name: this.first_name,
      last_name: this.last_name,
      postal_code: this.postal_code,
      lang: this.lang,
      updated_at: this.updated_at,
    };
  }

  save(): Promise<SpmEnvelope> {
    const data = this.payload();
    if (this.shop_id) data.shop_id = this.shop_id;
    return processSave(this.auth, ENDPOINT, data);
  }

  update(): Promise<SpmEnvelope> {
    return processUpdate(this.auth, ENDPOINT, compactDefined({
      ...this.payload(),
      shop_id: this.shop_id,
    }));
  }

  static bulkSave(auth: SpmHttpClient, data: SpmNewsletterSubscriberData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, ENDPOINT, data, { defaultChunkSize: SpmNewsletterSubscribers.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, data: SpmNewsletterSubscriberData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, ENDPOINT, data, { defaultChunkSize: SpmNewsletterSubscribers.CHUNK_SIZE, ...(options ?? {}) });
  }
}
