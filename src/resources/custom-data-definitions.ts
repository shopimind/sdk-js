import { processRequest, processGet } from '../core/methods.js';
import type { SpmEnvelope, SpmHttpClient } from '../types/common.js';
import type {
  SpmCreateCustomDataDefinitionData,
  SpmExtendCustomDataDefinitionData,
  SpmFieldOverrideItem,
  SpmFieldOverrideQuery,
} from '../types/custom-data.js';

const ENDPOINT = 'custom-data-definitions';

/** Custom data definitions — the schemas for custom objects attached to a shop. */
export class SpmCustomDataDefinitions {
  static list(client: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, ENDPOINT, query);
  }

  static get(client: SpmHttpClient, id: number | string): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/${id}`);
  }

  static create(client: SpmHttpClient, dto: SpmCreateCustomDataDefinitionData): Promise<SpmEnvelope> {
    return processRequest(client, 'post', ENDPOINT, dto);
  }

  /** Mutation is exposed only via the `extend` route (no plain PUT). */
  static update(client: SpmHttpClient, id: number | string, dto: SpmExtendCustomDataDefinitionData): Promise<SpmEnvelope> {
    return processRequest(client, 'patch', `${ENDPOINT}/${id}/extend`, dto);
  }

  /** Alias of {@link SpmCustomDataDefinitions.update} reflecting the route name. */
  static extend(client: SpmHttpClient, id: number | string, dto: SpmExtendCustomDataDefinitionData): Promise<SpmEnvelope> {
    return processRequest(client, 'patch', `${ENDPOINT}/${id}/extend`, dto);
  }

  static activate(client: SpmHttpClient, id: number | string): Promise<SpmEnvelope> {
    return processRequest(client, 'patch', `${ENDPOINT}/${id}/activate`);
  }

  static deactivate(client: SpmHttpClient, id: number | string): Promise<SpmEnvelope> {
    return processRequest(client, 'patch', `${ENDPOINT}/${id}/deactivate`);
  }

  static delete(client: SpmHttpClient, id: number | string): Promise<SpmEnvelope> {
    return processRequest(client, 'delete', `${ENDPOINT}/${id}`);
  }

  static listOverrides(client: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/overrides`, query);
  }

  static updateOverrides(client: SpmHttpClient, query: SpmFieldOverrideQuery, overrides: SpmFieldOverrideItem[]): Promise<SpmEnvelope> {
    const qs = query
      ? `?target_system_schema=${encodeURIComponent(query.target_system_schema)}&system_field_name=${encodeURIComponent(query.system_field_name)}`
      : '';
    return processRequest(client, 'put', `${ENDPOINT}/overrides${qs}`, { overrides });
  }
}
