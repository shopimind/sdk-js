import { describe, it, expect } from 'vitest';

/**
 * Contract test: the SDK surface ⊆ what `client_api` exposes.
 *
 * The SDK's ONLY dependency is `client_api`'s OpenAPI (`/api-json`). This test
 * pins every endpoint the SDK emits against a snapshot of that spec, so a method
 * targeting a route `client_api` does not expose fails CI.
 *
 * Refresh OPENAPI_PATHS from production:
 *   curl -s https://core.shopimind.com/api-json | jq -r '.paths|to_entries[]|.key as $p|.value|keys[]|ascii_upcase+" "+$p'
 */

// --- Snapshot of client_api OpenAPI (Shopimind API v1.0) ---
const OPENAPI_PATHS = new Set<string>([
  'GET /v1/carts',
  'GET /v1/contact-consent-history',
  'GET /v1/contact-messages-reject',
  'GET /v1/contacts',
  'GET /v1/contacts/all',
  'GET /v1/contacts/{id_contact}/custom-data-definitions',
  'GET /v1/contacts/{id_contact}/lists',
  'GET /v1/contacts/{id_contact}/tags',
  'GET /v1/custom-data-definitions',
  'POST /v1/custom-data-definitions',
  'GET /v1/custom-data-definitions/{id_definition}',
  'DELETE /v1/custom-data-definitions/{id_definition}',
  'PATCH /v1/custom-data-definitions/{id_definition}/activate',
  'PATCH /v1/custom-data-definitions/{id_definition}/deactivate',
  'PATCH /v1/custom-data-definitions/{id_definition}/extend',
  'GET /v1/custom-data-definitions/overrides',
  'PUT /v1/custom-data-definitions/overrides',
  'GET /v1/custom-data-records/{id_definition}',
  'POST /v1/custom-data-records/{id_definition}',
  'DELETE /v1/custom-data-records/{id_definition}',
  'PATCH /v1/custom-data-records/{id_definition}/{id}',
  'POST /v1/custom-data-records/{id_definition}/bulk-delete',
  'GET /v1/customers',
  'POST /v1/customers',
  'PUT /v1/customers',
  'GET /v1/customers/{customer_id}',
  'DELETE /v1/customers/{customer_id}',
  'POST /v1/customers/bulk-delete',
  'GET /v1/customers/{customer_id}/groups',
  'GET /v1/customers/{customer_id}/addresses',
  'POST /v1/customers/{customer_id}/addresses',
  'PUT /v1/customers/{customer_id}/addresses',
  'DELETE /v1/customers/{customer_id}/addresses/{address_id}',
  'POST /v1/customers/{customer_id}/addresses/bulk-delete',
  'POST /v1/customers/addresses/bulk',
  'GET /v1/customers-groups',
  'POST /v1/customers-groups',
  'PUT /v1/customers-groups',
  'DELETE /v1/customers-groups/{group_id}',
  'POST /v1/customers-groups/bulk-delete',
  'POST /v1/newsletter-subscribers',
  'PUT /v1/newsletter-subscribers',
  'GET /v1/data-sources',
  'POST /v1/data-sources',
  'PUT /v1/data-sources/{id}',
  'DELETE /v1/data-sources/{id}',
  'GET /v1/events',
  'POST /v1/events',
  'PATCH /v1/events',
  'GET /v1/events/{id_event}',
  'DELETE /v1/events/{id_event}',
  'GET /v1/events/histories',
  'POST /v1/events/trigger/{code_name}',
  'GET /v1/integration-config',
  'PUT /v1/integration-config',
  'GET /v1/lists',
  'POST /v1/lists',
  'GET /v1/lists/{id_shop_list}',
  'PATCH /v1/lists/{id_shop_list}',
  'DELETE /v1/lists/{id_shop_list}',
  'GET /v1/lists/{id_list}/contacts',
  'GET /v1/orders',
  'POST /v1/orders',
  'PUT /v1/orders',
  'GET /v1/orders/id/{order_id}',
  'GET /v1/orders/reference/{reference}',
  'DELETE /v1/orders/{order_id}',
  'POST /v1/orders/bulk-delete',
  'GET /v1/orders-carriers',
  'POST /v1/orders-carriers',
  'PUT /v1/orders-carriers',
  'DELETE /v1/orders-carriers/{carrier_id}',
  'POST /v1/orders-carriers/bulk-delete',
  'GET /v1/orders-statuses',
  'POST /v1/orders-statuses',
  'PUT /v1/orders-statuses',
  'DELETE /v1/orders-statuses/{status_id}',
  'POST /v1/orders-statuses/bulk-delete',
  'GET /v1/products',
  'POST /v1/products',
  'PUT /v1/products',
  'DELETE /v1/products/{product_id}',
  'POST /v1/products/bulk-delete',
  'POST /v1/products/{product_id}/images',
  'PUT /v1/products/{product_id}/images',
  'DELETE /v1/products/{product_id}/images/{image_id}',
  'POST /v1/products/{product_id}/images/bulk-delete',
  'POST /v1/products/images/bulk',
  'POST /v1/products/{product_id}/variations',
  'PUT /v1/products/{product_id}/variations',
  'DELETE /v1/products/{product_id}/variations/{variation_id}',
  'POST /v1/products/{product_id}/variations/bulk-delete',
  'POST /v1/products/variations/bulk',
  'GET /v1/products-categories',
  'POST /v1/products-categories',
  'PUT /v1/products-categories',
  'DELETE /v1/products-categories/{category_id}',
  'POST /v1/products-categories/bulk-delete',
  'GET /v1/products-manufacturers',
  'POST /v1/products-manufacturers',
  'PUT /v1/products-manufacturers',
  'DELETE /v1/products-manufacturers/{manufacturer_id}',
  'POST /v1/products-manufacturers/bulk-delete',
  'POST /v1/shop/connection',
  'GET /v1/vouchers',
  'POST /v1/vouchers',
  'PUT /v1/vouchers',
  'DELETE /v1/vouchers/{voucher_id}',
  'POST /v1/vouchers/bulk-delete',
]);

/**
 * Real `client_api` routes the SDK serves but NOT yet documented in `/api-json`.
 * Allow-listed until client_api documents them. Currently EMPTY: data-sources,
 * integration-config and shop/connection are now exposed in the OpenAPI.
 */
const ALLOWLIST = new Set<string>([]);

/**
 * Every endpoint the SDK emits, as "VERB /v1/<template>" with client_api's param
 * names. Keep in sync when adding/changing a resource method — the test proves
 * each one is backed by client_api (OPENAPI_PATHS) or explicitly allow-listed.
 */
const SDK_ENDPOINTS: string[] = [
  // customers
  'POST /v1/customers', 'PUT /v1/customers', 'DELETE /v1/customers/{customer_id}',
  'POST /v1/customers/bulk-delete', 'GET /v1/customers/{customer_id}', 'GET /v1/customers',
  'GET /v1/customers/{customer_id}/groups',
  // customers-addresses
  'POST /v1/customers/{customer_id}/addresses', 'PUT /v1/customers/{customer_id}/addresses',
  'POST /v1/customers/addresses/bulk', 'DELETE /v1/customers/{customer_id}/addresses/{address_id}',
  'POST /v1/customers/{customer_id}/addresses/bulk-delete', 'GET /v1/customers/{customer_id}/addresses',
  // customers-groups
  'POST /v1/customers-groups', 'PUT /v1/customers-groups', 'DELETE /v1/customers-groups/{group_id}',
  'POST /v1/customers-groups/bulk-delete', 'GET /v1/customers-groups',
  // newsletter-subscribers
  'POST /v1/newsletter-subscribers', 'PUT /v1/newsletter-subscribers',
  // products
  'POST /v1/products', 'PUT /v1/products', 'DELETE /v1/products/{product_id}',
  'POST /v1/products/bulk-delete', 'GET /v1/products',
  // products-categories
  'POST /v1/products-categories', 'PUT /v1/products-categories', 'DELETE /v1/products-categories/{category_id}',
  'POST /v1/products-categories/bulk-delete', 'GET /v1/products-categories',
  // products-images
  'POST /v1/products/{product_id}/images', 'PUT /v1/products/{product_id}/images',
  'POST /v1/products/images/bulk', 'DELETE /v1/products/{product_id}/images/{image_id}',
  'POST /v1/products/{product_id}/images/bulk-delete',
  // products-manufacturers
  'POST /v1/products-manufacturers', 'PUT /v1/products-manufacturers',
  'DELETE /v1/products-manufacturers/{manufacturer_id}', 'POST /v1/products-manufacturers/bulk-delete',
  'GET /v1/products-manufacturers',
  // products-variations
  'POST /v1/products/{product_id}/variations', 'PUT /v1/products/{product_id}/variations',
  'POST /v1/products/variations/bulk', 'DELETE /v1/products/{product_id}/variations/{variation_id}',
  'POST /v1/products/{product_id}/variations/bulk-delete',
  // orders
  'POST /v1/orders', 'PUT /v1/orders', 'DELETE /v1/orders/{order_id}', 'POST /v1/orders/bulk-delete',
  'GET /v1/orders/id/{order_id}', 'GET /v1/orders/reference/{reference}', 'GET /v1/orders',
  // orders-carriers
  'POST /v1/orders-carriers', 'PUT /v1/orders-carriers', 'DELETE /v1/orders-carriers/{carrier_id}',
  'POST /v1/orders-carriers/bulk-delete', 'GET /v1/orders-carriers',
  // orders-statuses
  'POST /v1/orders-statuses', 'PUT /v1/orders-statuses', 'DELETE /v1/orders-statuses/{status_id}',
  'POST /v1/orders-statuses/bulk-delete', 'GET /v1/orders-statuses',
  // vouchers
  'POST /v1/vouchers', 'PUT /v1/vouchers', 'DELETE /v1/vouchers/{voucher_id}',
  'POST /v1/vouchers/bulk-delete', 'GET /v1/vouchers',
  // carts
  'GET /v1/carts',
  // contacts
  'GET /v1/contacts', 'GET /v1/contacts/all', 'GET /v1/contacts/{id_contact}/lists',
  'GET /v1/contacts/{id_contact}/tags', 'GET /v1/contacts/{id_contact}/custom-data-definitions',
  'GET /v1/contact-consent-history', 'GET /v1/contact-messages-reject',
  // lists
  'GET /v1/lists', 'GET /v1/lists/{id_shop_list}', 'POST /v1/lists', 'PATCH /v1/lists/{id_shop_list}',
  'DELETE /v1/lists/{id_shop_list}', 'GET /v1/lists/{id_list}/contacts',
  // events
  'POST /v1/events', 'PATCH /v1/events', 'GET /v1/events', 'GET /v1/events/histories',
  'GET /v1/events/{id_event}', 'DELETE /v1/events/{id_event}', 'POST /v1/events/trigger/{code_name}',
  // custom-data-definitions
  'GET /v1/custom-data-definitions', 'GET /v1/custom-data-definitions/{id_definition}',
  'POST /v1/custom-data-definitions', 'PATCH /v1/custom-data-definitions/{id_definition}/extend',
  'PATCH /v1/custom-data-definitions/{id_definition}/activate',
  'PATCH /v1/custom-data-definitions/{id_definition}/deactivate',
  'DELETE /v1/custom-data-definitions/{id_definition}', 'GET /v1/custom-data-definitions/overrides',
  'PUT /v1/custom-data-definitions/overrides',
  // custom-data-records
  'POST /v1/custom-data-records/{id_definition}', 'GET /v1/custom-data-records/{id_definition}',
  'PATCH /v1/custom-data-records/{id_definition}/{id}', 'DELETE /v1/custom-data-records/{id_definition}',
  'POST /v1/custom-data-records/{id_definition}/bulk-delete',
  // data-sources
  'GET /v1/data-sources', 'POST /v1/data-sources', 'PUT /v1/data-sources/{id}', 'DELETE /v1/data-sources/{id}',
  // integration-config
  'GET /v1/integration-config', 'PUT /v1/integration-config',
  // shop-connection (used by connectors)
  'POST /v1/shop/connection',
];

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
