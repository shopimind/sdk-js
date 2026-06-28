import { processGet } from '../core/methods.js';
import type { SpmEnvelope, SpmHttpClient } from '../types/common.js';
import type { SpmContactGetParams } from '../types/contacts.js';

const ENDPOINT = 'contacts';

/** Contacts — read-only access to Shopimind's marketing contacts. */
export class SpmContacts {
  /** Retrieve a contact by exactly one identifier. GET `contacts?<identifier>=…`. */
  static get(client: SpmHttpClient, params: SpmContactGetParams): Promise<SpmEnvelope> {
    return processGet(client, ENDPOINT, params);
  }

  static list(client: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/all`, query);
  }

  static listLists(client: SpmHttpClient, idContact: number | string): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/${idContact}/lists`);
  }

  static listTags(client: SpmHttpClient, idContact: number | string): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/${idContact}/tags`);
  }

  static listCustomDataDefinitions(client: SpmHttpClient, idContact: number | string): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/${idContact}/custom-data-definitions`);
  }

  static listConsentHistory(client: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, 'contact-consent-history', query);
  }

  static listMessagesReject(client: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, 'contact-messages-reject', query);
  }
}
