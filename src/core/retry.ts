import './axios-augmentation.js';
import type { AxiosError, AxiosInstance } from 'axios';
import type { ResolvedRetryOptions, SpmRetryOptions } from '../types/common.js';

export const DEFAULT_RETRY_OPTIONS: ResolvedRetryOptions = {
  maxRetries: 3,
  backoffBaseMs: 1000,
  backoffCapMs: 10000,
  retryableStatus: [408, 429, 500, 502, 503, 504],
  retryableCodes: ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'ENETUNREACH', 'ENOTFOUND', 'EAI_AGAIN'],
  retryablePatterns: [
    'timeout',
    'timed out',
    'connection refused',
    'connection reset',
    'could not resolve host',
    'network is unreachable',
    'failed to connect',
  ],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function computeBackoff(
  attempt: number,
  { backoffBaseMs, backoffCapMs }: Pick<ResolvedRetryOptions, 'backoffBaseMs' | 'backoffCapMs'>,
): number {
  const base = backoffBaseMs * 2 ** (attempt - 1);
  const jitter = Math.floor(Math.random() * 500);
  return Math.min(base + jitter, backoffCapMs);
}

const IDEMPOTENT_METHODS = new Set(['get', 'head', 'options', 'put', 'delete']);

/**
 * GET/HEAD/OPTIONS/PUT/DELETE are idempotent → safe to replay. POST/PATCH are
 * NOT: only replay them when the caller supplied an idempotency key, otherwise a
 * retry could duplicate an already-committed write.
 */
function hasIdempotencyKey(headers: unknown): boolean {
  if (!headers || typeof headers !== 'object') return false;
  const h = headers as { has?: (name: string) => boolean } & Record<string, unknown>;
  if (typeof h.has === 'function') return h.has('Idempotency-Key') || h.has('X-Idempotency-Key');
  return Object.keys(h).some((k) => {
    const lk = k.toLowerCase();
    return lk === 'idempotency-key' || lk === 'x-idempotency-key';
  });
}

function isRetryableRequest(config: { method?: string; headers?: unknown }): boolean {
  const method = String(config.method || 'get').toLowerCase();
  if (IDEMPOTENT_METHODS.has(method)) return true;
  return hasIdempotencyKey(config.headers);
}

/** Honour a `Retry-After` header (seconds or HTTP date) when present. */
function retryAfterMs(error: AxiosError): number | null {
  const headers = error.response && (error.response.headers as Record<string, unknown> | undefined);
  const ra = headers ? headers['retry-after'] : undefined;
  if (ra == null || ra === '') return null;
  const secs = Number(ra);
  if (Number.isFinite(secs)) return Math.max(0, secs * 1000);
  const date = Date.parse(String(ra));
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now());
}

export function isRetryableError(error: unknown, opts: ResolvedRetryOptions): boolean {
  if (!error) return false;
  const err = error as AxiosError;
  const status = err.response && err.response.status;
  if (status && opts.retryableStatus.indexOf(Number(status)) !== -1) return true;
  const code = String(err.code || '').toUpperCase();
  if (code && opts.retryableCodes.indexOf(code) !== -1) return true;
  const msg = String(err.message || '').toLowerCase();
  return opts.retryablePatterns.some((p) => msg.includes(p));
}

/**
 * Install an axios response interceptor that retries retryable errors
 * (408/429/5xx + network errors) with exponential backoff + jitter. Tracks the
 * attempt count on `config.__spmRetryAttempts` so the envelope can expose it.
 */
export function installRetryInterceptor(client: AxiosInstance, userOptions: SpmRetryOptions = {}): void {
  const opts: ResolvedRetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...userOptions };

  client.interceptors.response.use(
    (response) => {
      const attempts = response.config && response.config.__spmRetryAttempts
        ? response.config.__spmRetryAttempts + 1
        : 1;
      if (response.config) response.config.__spmRetryAttempts = attempts;
      return response;
    },
    async (error: AxiosError) => {
      const config = error && error.config;
      if (!config) return Promise.reject(error);

      const attempts = Number(config.__spmRetryAttempts || 0);

      if (!isRetryableError(error, opts)) {
        config.__spmRetryAttempts = attempts + 1;
        return Promise.reject(error);
      }
      // Never replay a non-idempotent write without an idempotency key.
      if (!isRetryableRequest(config)) {
        config.__spmRetryAttempts = attempts + 1;
        return Promise.reject(error);
      }
      if (attempts >= opts.maxRetries) {
        config.__spmRetryAttempts = attempts + 1;
        return Promise.reject(error);
      }

      config.__spmRetryAttempts = attempts + 1;
      const delay = retryAfterMs(error) ?? computeBackoff(attempts + 1, opts);
      await sleep(delay);
      return client.request(config);
    },
  );
}
