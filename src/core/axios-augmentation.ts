// Augments axios types with the internal fields the SDK stores on the client
// instance and on request configs. Imported (for side effect) by `client.ts`
// and `retry.ts` so the augmentation is always part of the compilation graph.
import type { ResolvedRetryOptions } from '../types/common.js';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** Number of attempts performed for this request (set by the retry interceptor). */
    __spmRetryAttempts?: number;
  }
  interface AxiosInstance {
    /** Effective retry policy for this client, or `null` when retries are disabled. */
    __spmRetryOptions?: ResolvedRetryOptions | null;
  }
}

export {};
