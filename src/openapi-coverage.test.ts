import { describe, it, expect } from 'vitest';
import { OPENAPI_PATHS, ALLOWLIST, SDK_ENDPOINTS } from './openapi-snapshot.js';

/**
 * Contract test: the SDK surface ⊆ what `client_api` exposes.
 *
 * The SDK's ONLY dependency is `client_api`'s OpenAPI (`/api-json`). This test
 * pins every endpoint the SDK emits against a snapshot of that spec, so a method
 * targeting a route `client_api` does not expose fails CI.
 *
 * The snapshot (OPENAPI_PATHS / ALLOWLIST / SDK_ENDPOINTS) lives in
 * `openapi-snapshot.ts`, shared with the `check:openapi` diff script (H2).
 * Refresh OPENAPI_PATHS from production:
 *   curl -s https://core.shopimind.com/api-json | jq -r '.paths|to_entries[]|.key as $p|.value|keys[]|ascii_upcase+" "+$p'
 */

describe('SDK surface ⊆ client_api OpenAPI', () => {
  it('every SDK endpoint is backed by a client_api route (or explicitly allow-listed)', () => {
    const unbacked = [...new Set(SDK_ENDPOINTS)].filter(
      (e) => !OPENAPI_PATHS.has(e) && !ALLOWLIST.has(e),
    );
    expect(unbacked, `SDK endpoints with no client_api route: ${unbacked.join(' | ')}`).toEqual([]);
  });

  it('the allow-list only contains routes that are genuinely absent from the OpenAPI snapshot', () => {
    // If an allow-listed route later appears in /api-json, remove it from ALLOWLIST.
    const redundant = [...ALLOWLIST].filter((e) => OPENAPI_PATHS.has(e));
    expect(redundant, `Allow-listed routes now in OpenAPI (drop them): ${redundant.join(' | ')}`).toEqual([]);
  });
});
