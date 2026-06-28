import { processRequest, processGet } from '../core/methods.js';
import type { SpmEnvelope, SpmHttpClient } from '../types/common.js';
import type { SpmCreateEventData, SpmTriggerEventPayload, SpmUpdateEventData } from '../types/events.js';

const ENDPOINT = 'events';

/**
 * Events — external event types and their firings. `create` declares an event
 * *type*; `trigger` fires an *instance* of it.
 */
export class SpmEvents {
  static create(client: SpmHttpClient, dto: SpmCreateEventData): Promise<SpmEnvelope> {
    return processRequest(client, 'post', ENDPOINT, dto);
  }

  static update(client: SpmHttpClient, dto: SpmUpdateEventData): Promise<SpmEnvelope> {
    return processRequest(client, 'patch', ENDPOINT, dto);
  }

  static list(client: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, ENDPOINT, query);
  }

  static listHistories(client: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/histories`, query);
  }

  static get(client: SpmHttpClient, idEvent: number | string, fields?: string[]): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/${idEvent}`, fields ? { fields } : undefined);
  }

  static delete(client: SpmHttpClient, idEvent: number | string): Promise<SpmEnvelope> {
    return processRequest(client, 'delete', `${ENDPOINT}/${idEvent}`);
  }

  /** Fire an event instance by its `code_name`. POST `events/trigger/:code_name`. */
  static trigger(client: SpmHttpClient, codeName: string, payload: SpmTriggerEventPayload): Promise<SpmEnvelope> {
    return processRequest(client, 'post', `${ENDPOINT}/trigger/${encodeURIComponent(codeName)}`, payload);
  }
}
