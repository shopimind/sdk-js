import type { AxiosError, AxiosResponse } from 'axios';
import { DEFAULT_RETRY_OPTIONS, isRetryableError } from './retry.js';
import type { ResolvedRetryOptions, SpmEnvelope } from '../types/common.js';

export function wrapSuccess<T = unknown>(response: AxiosResponse<T>): SpmEnvelope<T> {
  return {
    ok: true,
    statusCode: Number(response.status || 200),
    data: response.data !== undefined ? response.data : null,
    error: null,
  };
}

export function wrapError(error: unknown, retryOptions: ResolvedRetryOptions = DEFAULT_RETRY_OPTIONS): SpmEnvelope {
  const err = error as AxiosError | undefined;
  const status = err && err.response && Number(err.response.status);
  const data = err && err.response && err.response.data !== undefined ? err.response.data : null;
  const code = String((err && err.code) || (status ? `HTTP_${status}` : 'UNKNOWN')).toUpperCase();
  const attempts = Number((err && err.config && err.config.__spmRetryAttempts) || 1);

  return {
    ok: false,
    statusCode: status || 0,
    data,
    error: {
      message: String((err && err.message) || 'Unknown error'),
      code,
      retryable: isRetryableError(error, retryOptions),
      attempts,
    },
  };
}
