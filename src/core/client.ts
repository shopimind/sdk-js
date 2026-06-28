import './axios-augmentation.js';
import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { installRetryInterceptor, DEFAULT_RETRY_OPTIONS } from './retry.js';
import { SpmClientException } from './exception.js';
import type { ResolvedRetryOptions, SpmClientOptions } from '../types/common.js';

const DEFAULT_BASE_URL = 'https://core.shopimind.com';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

/**
 * Validate the base URL: it must be a well-formed http(s) URL. An `http://` URL
 * pointing at a REMOTE host is rejected (the `spm-api-key` would travel in clear),
 * unless `allowInsecureBaseUrl` is set or the host is loopback (local dev).
 */
function assertSafeBaseUrl(raw: string, allowInsecure: boolean): void {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new SpmClientException(`SpmClient: invalid baseUrl (${raw})`);
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') {
    throw new SpmClientException(`SpmClient: unsupported baseUrl scheme (${u.protocol})`);
  }
  if (u.protocol === 'http:' && !LOOPBACK_HOSTS.has(u.hostname) && !allowInsecure) {
    throw new SpmClientException(
      `SpmClient: http baseUrl pointing at a remote host (${u.hostname}) — the API key would leak in clear. ` +
        'Use https, a loopback host, or allowInsecureBaseUrl:true (dev only).',
    );
  }
}

// `label_source` is a *data-sync* concept: it tags ingested customers /
// products / orders / vouchers with their origin. It must NOT be injected into
// config / admin / records bodies — those controllers validate their payloads
// strictly and would reject the extra `label_source` field. Matched with
// `url.includes(ep)`.
const EXCLUDED_LABEL_SOURCE_ENDPOINTS = [
  'shop/connection',
  'data-sources',
  'custom-data-definitions',
  'custom-data-records',
  'events',
  'lists',
  'custom-stats',
  'contacts',
  'carts',
];

export class SpmClient {
  /**
   * Build an HTTP client pre-configured for Shopimind API calls.
   *
   * @param apiVersion API version segment (e.g. `'v1'`).
   * @param apiKey     Shopimind API key (sent as the `spm-api-key` header).
   * @param options    See {@link SpmClientOptions}.
   */
  static getClient(apiVersion: string, apiKey: string, options: SpmClientOptions = {}): AxiosInstance {
    const headers = options.headers || {};
    const timeout = typeof options.timeout === 'number' ? options.timeout : 30000;
    const labelSource = options.labelSource === undefined ? 'web' : options.labelSource;

    const envOverride = process.env.SHOPIMIND_CORE_API_BASE;
    const rawBase = options.baseUrl || envOverride || DEFAULT_BASE_URL;
    assertSafeBaseUrl(rawBase, options.allowInsecureBaseUrl ?? false);
    const baseUrl = `${rawBase.replace(/\/+$/, '')}/${apiVersion}/`;

    const defaultHeaders = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'spm-api-key': apiKey,
    };

    const instance = axios.create({
      baseURL: baseUrl,
      headers: { ...defaultHeaders, ...headers },
      timeout,
      // Do not follow redirects: on a cross-origin redirect, custom headers (incl.
      // `spm-api-key`) could be relayed and leak the key.
      maxRedirects: 0,
      // Size caps (guards against memory DoS from a huge response/body).
      maxContentLength: 25 * 1024 * 1024,
      maxBodyLength: 25 * 1024 * 1024,
    });

    if (labelSource !== null) {
      instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
        if (!config.data) return config;
        const method = (config.method || '').toLowerCase();
        if (method !== 'post' && method !== 'put') return config;

        const url = config.url || '';
        const isExcluded = EXCLUDED_LABEL_SOURCE_ENDPOINTS.some((ep) => url.includes(ep));
        if (isExcluded) return config;

        if (Array.isArray(config.data)) {
          config.data = config.data.map((item) => (
            item && typeof item === 'object' ? { ...item, label_source: labelSource } : item
          ));
        } else if (typeof config.data === 'object') {
          config.data = { ...config.data, label_source: labelSource };
        }
        return config;
      });
    }

    // Retry is enabled by default (3 retries on 408/429/5xx + network errors).
    // Pass `retry: false` to disable, or a partial object to override fields.
    if (options.retry !== false) {
      const retryOptions: ResolvedRetryOptions = options.retry && typeof options.retry === 'object'
        ? { ...DEFAULT_RETRY_OPTIONS, ...options.retry }
        : DEFAULT_RETRY_OPTIONS;
      instance.__spmRetryOptions = retryOptions;
      installRetryInterceptor(instance, retryOptions);
    } else {
      instance.__spmRetryOptions = null;
    }

    return instance;
  }
}
