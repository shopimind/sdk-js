import { processRequest, processGet } from '../core/methods.js';
import type { SpmEnvelope, SpmHttpClient } from '../types/common.js';
import type { SpmCreateDataSourceData } from '../types/data-sources.js';

const ENDPOINT = 'data-sources';

/**
 * Data sources — where a shop's data comes from (the default e-commerce
 * connector plus any partner integration feeding it). A source may have a
 * `parent_id` to group child sources under a parent integration. Controller
 * responses are `{ statusCode, data }`, so the payload is at `res.data.data`.
 */
export class SpmDataSources {
  static list(client: SpmHttpClient): Promise<SpmEnvelope> {
    return processGet(client, ENDPOINT);
  }

  static create(client: SpmHttpClient, dto: SpmCreateDataSourceData): Promise<SpmEnvelope> {
    return processRequest(client, 'post', ENDPOINT, dto);
  }

  static update(
    client: SpmHttpClient,
    id: number | string,
    dto: Partial<SpmCreateDataSourceData> & { active?: boolean },
  ): Promise<SpmEnvelope> {
    return processRequest(client, 'put', `${ENDPOINT}/${id}`, dto);
  }

  static delete(client: SpmHttpClient, id: number | string): Promise<SpmEnvelope> {
    return processRequest(client, 'delete', `${ENDPOINT}/${id}`);
  }
}
