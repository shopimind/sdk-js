import type { Method } from 'axios';
import { wrapSuccess, wrapError } from './envelope.js';
import { DEFAULT_RETRY_OPTIONS } from './retry.js';
import { chunk } from '../helpers/chunk.js';
import { mergeResponses } from '../helpers/mergeResponses.js';
import type {
  InternalBulkOptions, ResolvedRetryOptions, SpmEnvelope, SpmHttpClient,
} from '../types/common.js';

function getRetryOptions(httpClient: SpmHttpClient): ResolvedRetryOptions {
  return (httpClient && httpClient.__spmRetryOptions) || DEFAULT_RETRY_OPTIONS;
}

async function runRequest<T = unknown>(
  httpClient: SpmHttpClient,
  method: Method,
  endpoint: string,
  body?: unknown,
  itemsSent?: number,
): Promise<SpmEnvelope<T>> {
  try {
    const response = await httpClient.request<T>({ method, url: endpoint, data: body });
    return wrapSuccess<T>(response);
  } catch (error) {
    const env = wrapError(error, getRetryOptions(httpClient)) as SpmEnvelope<T>;
    if (itemsSent !== undefined) env._itemsSent = itemsSent;
    return env;
  }
}

/**
 * Lowest-level wrapper: run an arbitrary axios request config and convert the
 * result/error into the standard SDK envelope. Never throws.
 */
export async function processRequestWithConfig<T = unknown>(
  httpClient: SpmHttpClient,
  config: Parameters<SpmHttpClient['request']>[0],
): Promise<SpmEnvelope<T>> {
  try {
    const response = await httpClient.request<T>(config);
    return wrapSuccess<T>(response);
  } catch (error) {
    return wrapError(error, getRetryOptions(httpClient)) as SpmEnvelope<T>;
  }
}

/** Generic single-request helper — sends `data` as-is (no array wrapping). */
export async function processRequest<T = unknown>(
  httpClient: SpmHttpClient,
  method: Method,
  endpoint: string,
  data?: unknown,
  headers?: Record<string, string>,
): Promise<SpmEnvelope<T>> {
  return processRequestWithConfig<T>(httpClient, {
    method, url: endpoint, data, ...(headers ? { headers } : {}),
  });
}

export async function processGet<T = unknown>(
  httpClient: SpmHttpClient,
  endpoint: string,
  params?: unknown,
): Promise<SpmEnvelope<T>> {
  return processRequestWithConfig<T>(httpClient, { method: 'get', url: endpoint, params });
}

export async function processSave<T = unknown>(httpClient: SpmHttpClient, endpoint: string, data: unknown): Promise<SpmEnvelope<T>> {
  return runRequest<T>(httpClient, 'post', endpoint, [data], 1);
}

export async function processUpdate<T = unknown>(httpClient: SpmHttpClient, endpoint: string, data: unknown): Promise<SpmEnvelope<T>> {
  return runRequest<T>(httpClient, 'put', endpoint, [data], 1);
}

export async function processDelete<T = unknown>(httpClient: SpmHttpClient, endpoint: string, id: string | number): Promise<SpmEnvelope<T>> {
  return runRequest<T>(httpClient, 'delete', `${endpoint}/${id}`, undefined, 1);
}

/** Shared bulk helper handling the optional chunking in a single place. */
async function processBulk(
  httpClient: SpmHttpClient,
  method: 'post' | 'put',
  endpoint: string,
  data: unknown,
  options: InternalBulkOptions = {},
): Promise<SpmEnvelope> {
  const wantsChunk = Boolean(options.chunk);
  const isArray = Array.isArray(data);

  if (!wantsChunk || !isArray) {
    return runRequest(httpClient, method, endpoint, data, isArray ? (data as unknown[]).length : undefined);
  }

  const size = Math.max(1, Number(options.chunkSize) || Number(options.defaultChunkSize) || 50);
  const batches = chunk(data as unknown[], size);
  if (batches.length === 0) {
    return {
      ok: true,
      statusCode: 200,
      data: {
        sent_count: 0, rejected_count: 0, failed_count: 0, rejected_items: [], chunks: [],
      },
      error: null,
    };
  }

  const results: SpmEnvelope[] = [];
  for (let i = 0; i < batches.length; i += 1) {
    const batch = batches[i] as unknown[];
    // eslint-disable-next-line no-await-in-loop
    const env = await runRequest(httpClient, method, endpoint, batch, batch.length);
    results.push(env);
  }
  return mergeResponses(results);
}

export async function processBulkSave(httpClient: SpmHttpClient, endpoint: string, data: unknown, options?: InternalBulkOptions): Promise<SpmEnvelope> {
  return processBulk(httpClient, 'post', endpoint, data, options);
}

export async function processBulkUpdate(httpClient: SpmHttpClient, endpoint: string, data: unknown, options?: InternalBulkOptions): Promise<SpmEnvelope> {
  return processBulk(httpClient, 'put', endpoint, data, options);
}

export async function processBulkDelete(httpClient: SpmHttpClient, endpoint: string, data: unknown, options?: InternalBulkOptions): Promise<SpmEnvelope> {
  return processBulk(httpClient, 'post', endpoint, data, options);
}

/** Drops "empty" keys (null/undefined/''/0/false/[]) from a body before sending. */
export function compactDefined(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (v === null || v === undefined || v === '' || v === 0 || v === false) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
