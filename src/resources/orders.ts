import {
  processSave, processBulkSave, processUpdate, processBulkUpdate,
  processDelete, processBulkDelete, processGet, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmOrderCustomer, SpmOrderData, SpmOrderProduct } from '../types/entities.js';

const ENDPOINT = 'orders';

export class SpmOrders implements SpmOrderData {
  static readonly CHUNK_SIZE = 50;

  private readonly auth: SpmHttpClient;

  order_id!: string;
  shop_id!: string | null;
  lang!: string;
  reference!: string | null;
  carrier_id!: string | null;
  status_id!: string;
  address_delivery_id!: string | null;
  address_invoice_id!: string | null;
  customer!: SpmOrderCustomer;
  products!: SpmOrderProduct[];
  cart_id!: string;
  cart_updated_at!: string;
  amount!: number;
  amount_without_tax!: number;
  shipping_costs!: number;
  shipping_costs_without_tax!: number;
  shipping_number!: string | null;
  currency!: string;
  voucher_used!: string | null;
  voucher_value!: string | null;
  is_confirmed!: boolean;
  created_at!: string;
  updated_at!: string;
  id_data_source?: number;
  source_label?: string;

  constructor(auth: SpmHttpClient) {
    this.auth = auth;
  }

  private payload(): Record<string, unknown> {
    return {
      order_id: this.order_id,
      lang: this.lang,
      reference: this.reference,
      carrier_id: this.carrier_id,
      status_id: this.status_id,
      address_delivery_id: this.address_delivery_id,
      address_invoice_id: this.address_invoice_id,
      customer: this.customer,
      products: this.products,
      cart_id: this.cart_id,
      cart_updated_at: this.cart_updated_at,
      amount: this.amount,
      amount_without_tax: this.amount_without_tax,
      shipping_costs: this.shipping_costs,
      shipping_costs_without_tax: this.shipping_costs_without_tax,
      shipping_number: this.shipping_number,
      currency: this.currency,
      voucher_used: this.voucher_used,
      voucher_value: this.voucher_value,
      is_confirmed: this.is_confirmed,
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

  static bulkSave(auth: SpmHttpClient, data: SpmOrderData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, ENDPOINT, data, { defaultChunkSize: SpmOrders.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, data: SpmOrderData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, ENDPOINT, data, { defaultChunkSize: SpmOrders.CHUNK_SIZE, ...(options ?? {}) });
  }

  static delete(auth: SpmHttpClient, orderId: string): Promise<SpmEnvelope> {
    return processDelete(auth, ENDPOINT, orderId);
  }

  static bulkDelete(auth: SpmHttpClient, orderIds: string[]): Promise<SpmEnvelope> {
    return processBulkDelete(auth, `${ENDPOINT}/bulk-delete`, { order_ids: orderIds });
  }

  static get(auth: SpmHttpClient, orderId: string, fields?: string[]): Promise<SpmEnvelope> {
    return processGet(auth, `${ENDPOINT}/id/${orderId}`, fields ? { fields } : undefined);
  }

  static getByReference(auth: SpmHttpClient, reference: string, fields?: string[]): Promise<SpmEnvelope> {
    return processGet(auth, `${ENDPOINT}/reference/${encodeURIComponent(reference)}`, fields ? { fields } : undefined);
  }

  static list(auth: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(auth, ENDPOINT, query);
  }
}
