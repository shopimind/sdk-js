import { processRequest, processGet } from '../core/methods.js';
import type { SpmEnvelope, SpmHttpClient } from '../types/common.js';
import type { SpmIntegratorConfigValues } from '../types/data-sources.js';

const ENDPOINT = 'integration-config';

/**
 * Integrator-owned config — values an integration sets PER SHOP via its own API
 * key (not the merchant). They resolve at render as `{integration.<key>}`. Only
 * fields declared `owner: "integrator"` in the integration's config_schema.
 */
export class SpmIntegrationConfig {
  /** Read this integration's config values for the shop. GET `integration-config`. */
  static get(client: SpmHttpClient): Promise<SpmEnvelope<{ statusCode: number; data: SpmIntegratorConfigValues }>> {
    return processGet(client, ENDPOINT);
  }

  /** Upsert integrator-owned config values for the shop. PUT `integration-config`. */
  static set(client: SpmHttpClient, values: Record<string, string | number | boolean>): Promise<SpmEnvelope> {
    return processRequest(client, 'put', ENDPOINT, values);
  }
}
