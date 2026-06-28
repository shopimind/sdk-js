import { processRequest, processGet } from '../core/methods.js';
import type { SpmEnvelope, SpmHttpClient } from '../types/common.js';
import type { SpmCreateListData, SpmUpdateListData } from '../types/lists.js';

const ENDPOINT = 'lists';

/** Lists & segments. */
export class SpmLists {
  static list(client: SpmHttpClient, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, ENDPOINT, query);
  }

  static get(client: SpmHttpClient, idShopList: number | string, fields?: string[]): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/${idShopList}`, fields ? { fields } : undefined);
  }

  static create(client: SpmHttpClient, dto: SpmCreateListData): Promise<SpmEnvelope> {
    return processRequest(client, 'post', ENDPOINT, dto);
  }

  static update(client: SpmHttpClient, idShopList: number | string, dto: SpmUpdateListData): Promise<SpmEnvelope> {
    return processRequest(client, 'patch', `${ENDPOINT}/${idShopList}`, dto);
  }

  static delete(client: SpmHttpClient, idShopList: number | string): Promise<SpmEnvelope> {
    return processRequest(client, 'delete', `${ENDPOINT}/${idShopList}`);
  }

  static listContacts(client: SpmHttpClient, idList: number | string, query?: Record<string, unknown>): Promise<SpmEnvelope> {
    return processGet(client, `${ENDPOINT}/${idList}/contacts`, query);
  }
}
