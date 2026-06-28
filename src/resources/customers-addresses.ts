import {
  processSave, processBulkSave, processUpdate, processBulkUpdate,
  processDelete, processBulkDelete, processGet, compactDefined,
} from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmBulkCustomerAddressData, SpmCustomerAddressData } from '../types/entities.js';

const endpointFor = (customerId: string): string => `customers/${customerId}/addresses`;

export class SpmCustomersAddresses {
  static readonly CHUNK_SIZE = 50;

  private readonly auth: SpmHttpClient;

  customer_id: string;
  address_id!: number;
  first_name!: string;
  last_name!: string;
  primary_phone!: string | null;
  secondary_phone!: string | null;
  company!: string | null;
  address_line_1!: string;
  address_line_2!: string | null;
  postal_code!: string;
  city!: string;
  country!: string;
  is_active!: boolean;
  id_data_source?: number;
  source_label?: string;

  constructor(auth: SpmHttpClient, customerId: string) {
    this.auth = auth;
    this.customer_id = customerId;
  }

  private payload(): Record<string, unknown> {
    return {
      address_id: this.address_id,
      first_name: this.first_name,
      last_name: this.last_name,
      primary_phone: this.primary_phone,
      secondary_phone: this.secondary_phone,
      company: this.company,
      address_line_1: this.address_line_1,
      address_line_2: this.address_line_2,
      postal_code: this.postal_code,
      city: this.city,
      country: this.country,
      is_active: this.is_active,
    };
  }

  save(): Promise<SpmEnvelope> {
    const data = this.payload();
    if (this.id_data_source !== undefined) data.id_data_source = this.id_data_source;
    if (this.source_label !== undefined) data.source_label = this.source_label;
    return processSave(this.auth, endpointFor(this.customer_id), data);
  }

  update(): Promise<SpmEnvelope> {
    return processUpdate(this.auth, endpointFor(this.customer_id), compactDefined({
      ...this.payload(),
      id_data_source: this.id_data_source,
      source_label: this.source_label,
    }));
  }

  static bulkSave(auth: SpmHttpClient, customerId: string, data: SpmCustomerAddressData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, endpointFor(customerId), data, { defaultChunkSize: SpmCustomersAddresses.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkSaveAll(auth: SpmHttpClient, data: SpmBulkCustomerAddressData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(auth, 'customers/addresses/bulk', data, { defaultChunkSize: SpmCustomersAddresses.CHUNK_SIZE, ...(options ?? {}) });
  }

  static bulkUpdate(auth: SpmHttpClient, customerId: string, data: SpmCustomerAddressData[], options?: SpmBulkOptions): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkUpdate(auth, endpointFor(customerId), data, { defaultChunkSize: SpmCustomersAddresses.CHUNK_SIZE, ...(options ?? {}) });
  }

  static delete(auth: SpmHttpClient, customerId: string, addressId: string): Promise<SpmEnvelope> {
    return processDelete(auth, endpointFor(customerId), addressId);
  }

  static bulkDelete(auth: SpmHttpClient, customerId: string, addressIds: string[]): Promise<SpmEnvelope> {
    return processBulkDelete(auth, `${endpointFor(customerId)}/bulk-delete`, { address_ids: addressIds });
  }

  static list(auth: SpmHttpClient, customerId: string, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(auth, endpointFor(customerId), query);
  }
}
