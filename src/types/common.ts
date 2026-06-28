import type { AxiosInstance } from 'axios';

/* ── Client ── */

/** The HTTP client returned by `SpmClient.getClient` (an axios instance). */
export type SpmHttpClient = AxiosInstance;

/** Retry policy. All fields optional — unset fields fall back to defaults. */
export interface SpmRetryOptions {
  maxRetries?: number;
  backoffBaseMs?: number;
  backoffCapMs?: number;
  retryableStatus?: number[];
  retryableCodes?: string[];
  retryablePatterns?: string[];
}

/** @internal Fully-resolved retry options (defaults merged in). */
export type ResolvedRetryOptions = Required<SpmRetryOptions>;

export interface SpmClientOptions {
  headers?: Record<string, string>;
  /** Base URL override. Falls back to env `SHOPIMIND_CORE_API_BASE`, then `https://core.shopimind.com`. */
  baseUrl?: string;
  /**
   * Allow an `http://` baseUrl pointing at a NON-loopback host. Off by default:
   * a remote http base would ship the `spm-api-key` in cleartext, so it is rejected
   * unless explicitly set (e.g. local dev against an http proxy). Loopback http
   * (localhost / 127.0.0.1 / ::1) is always allowed.
   */
  allowInsecureBaseUrl?: boolean;
  /** Request timeout in ms (default 30000). */
  timeout?: number;
  /** Value injected as `label_source` in POST/PUT bodies (default `"web"`, `null` disables). */
  labelSource?: string | null;
  /** Retry configuration. Pass `false` to disable. Defaults to 3 retries on 408/429/5xx + network errors. */
  retry?: SpmRetryOptions | false;
}

/* ── Bulk ── */

export interface SpmBulkOptions {
  /** Enable chunking (default `false`). */
  chunk?: boolean;
  /** Explicit chunk size. Defaults to the resource's `CHUNK_SIZE` static. */
  chunkSize?: number;
}

/** @internal Bulk options augmented with the resource-provided default chunk size. */
export type InternalBulkOptions = SpmBulkOptions & { defaultChunkSize?: number };

/* ── Envelope ── */

export interface SpmEnvelopeError {
  message: string;
  code: string;
  retryable: boolean;
  attempts: number;
  details?: unknown;
}

/**
 * Standard SDK response envelope. Every method (success or failure) returns
 * this shape — the SDK never throws for HTTP failures.
 */
export interface SpmEnvelope<T = unknown> {
  ok: boolean;
  statusCode: number;
  data: T | null;
  error: SpmEnvelopeError | null;
  /** @internal items sent in this (chunk) request — used by `mergeResponses`. */
  _itemsSent?: number;
}

export interface SpmChunkSummary {
  statusCode: number;
  ok: boolean;
  sent_count: number;
  rejected_count: number;
}

/** Aggregated `data` field returned when `options.chunk: true` is used. */
export interface SpmChunkedData {
  sent_count: number;
  rejected_count: number;
  failed_count: number;
  rejected_items: unknown[];
  chunks: SpmChunkSummary[];
}

export type SpmChunkedEnvelope = SpmEnvelope<SpmChunkedData>;

/* ── Request validator ── */

export interface SpmValidationResult {
  valid: boolean;
  error?: string;
}

export interface SpmValidateRequestOptions {
  clientId: string;
  hmacToken: string;
  body: Record<string, unknown>;
  apiIdentification: string;
  apiPassword: string;
}

/* ── Helpers ── */

export interface SpmExtractedCounts {
  sent: number;
  rejected: number;
  failed: number;
}

export interface SpmFormattedError {
  message: string;
  code: string;
  statusCode: number;
  retryable: boolean;
  attempts: number;
  details?: unknown;
}

export interface SpmHelpersApi {
  chunk<T>(array: T[], size: number): T[][];
  mergeResponses(envelopes: Array<SpmEnvelope | SpmChunkedEnvelope>): SpmChunkedEnvelope;
  extractCounts(envelopeOrData: SpmEnvelope | Record<string, unknown> | null | undefined): SpmExtractedCounts;
  isRetryable(errOrEnvelope: unknown, options?: SpmRetryOptions): boolean;
  formatError(errOrEnvelope: unknown): SpmFormattedError | null;
  unwrapOrThrow<T = unknown>(env: SpmEnvelope, context?: string): T;
}

/* ── Commons ── */

/** Data-source attributes shared by every ingestible entity. */
export interface SpmDataSourceAttributes {
  id_data_source?: number;
  source_label?: string;
}
