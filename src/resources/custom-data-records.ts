import { processBulkSave, processRequest, processGet } from '../core/methods.js';
import type {
  SpmBulkOptions, SpmChunkedEnvelope, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';
import type { SpmCustomDataRecord } from '../types/custom-data.js';

const ENDPOINT = 'custom-data-records';

/**
 * Custom data records — the rows stored against a custom data definition.
 * Processing is asynchronous server-side (Kafka): a 200 means the batch was
 * accepted, not yet persisted.
 */
export class SpmCustomDataRecords {
  static readonly CHUNK_SIZE = 20;

  /** Upsert records for a definition. Body is the raw array (max 20/request). */
  static bulkSave(
    client: SpmHttpClient,
    definitionId: number | string,
    records: SpmCustomDataRecord[],
    options?: SpmBulkOptions,
  ): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(client, `${ENDPOINT}/${definitionId}`, records, { defaultChunkSize: SpmCustomDataRecords.CHUNK_SIZE, ...(options ?? {}) });
  }

  static list(client: SpmHttpClient, definitionId: number | string, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/${definitionId}`, query);
  }

  /** Partial update of a single record. PATCH `…/:definitionId/:recordId`. */
  static update(
    client: SpmHttpClient,
    definitionId: number | string,
    recordId: number | string,
    data: Record<string, unknown>,
  ): Promise<SpmEnvelope> {
    return processRequest(client, 'patch', `${ENDPOINT}/${definitionId}/${recordId}`, data);
  }

  static delete(client: SpmHttpClient, definitionId: number | string, recordId: number | string): Promise<SpmEnvelope> {
    return processRequest(client, 'delete', `${ENDPOINT}/${definitionId}?id=${encodeURIComponent(recordId)}`);
  }

  /** Bulk-delete by auto-increment ids (raw array body, max 20/request). */
  static bulkDelete(
    client: SpmHttpClient,
    definitionId: number | string,
    recordIds: Array<number | string>,
    options?: SpmBulkOptions,
  ): Promise<SpmEnvelope | SpmChunkedEnvelope> {
    return processBulkSave(client, `${ENDPOINT}/${definitionId}/bulk-delete`, recordIds, { defaultChunkSize: SpmCustomDataRecords.CHUNK_SIZE, ...(options ?? {}) });
  }
}
