# @shopimind/sdk-js

[![CI](https://github.com/shopimind/sdk-js/actions/workflows/ci.yml/badge.svg)](https://github.com/shopimind/sdk-js/actions/workflows/ci.yml)

Official JavaScript/TypeScript SDK for the **ShopiMind API**. Fully typed, depends only on `axios`, and built so that **no method ever throws on an HTTP error** — every call returns a predictable envelope you inspect.

## Install

```bash
npm i @shopimind/sdk-js
```

Requires Node.js 18+. Ships as ESM with TypeScript types.

## Quick start

```ts
import { SpmClient, SpmCustomers, SpmHelpers } from '@shopimind/sdk-js';

const client = SpmClient.getClient('v1', process.env.SHOPIMIND_API_KEY!);

const res = await SpmCustomers.bulkSave(
  client,
  [{ customer_id: '1', email: 'jane@example.com', first_name: 'Jane' }],
  { chunk: true },
);

if (res.ok) {
  console.log('accepted', res.data); // { sent_count, rejected_count, ... }
} else {
  console.error(res.statusCode, res.error?.message);
}
```

## The response envelope

Every method returns the same shape and **never throws** for `4xx` / `5xx` / network failures:

```ts
interface SpmEnvelope<T> {
  ok: boolean;          // true on HTTP 2xx
  statusCode: number;   // HTTP status, 0 on a network failure
  data: T | null;       // success body, error body on 4xx, or null
  error: { message: string; code: string; retryable: boolean; attempts: number } | null;
}
```

### Reading the payload

The ShopiMind API wraps single/list reads as `{ statusCode, data }`, so the **business payload sits at `res.data.data`**:

```ts
const res = await SpmCustomers.get(client, 'cust_001');
const customer = res.ok ? (res.data as any)?.data : null;
```

Prefer exceptions? `SpmHelpers.unwrapOrThrow` peels that wrapper and throws an `SpmApiError` when the call failed:

```ts
import { SpmHelpers } from '@shopimind/sdk-js';

try {
  const customer = SpmHelpers.unwrapOrThrow(await SpmCustomers.get(client, 'cust_001'));
} catch (e) {
  // e is an SpmApiError carrying statusCode / code / envelope
}
```

## Bulk & chunking

Bulk methods accept `{ chunk: true }` to auto-split large arrays (each resource has its own `CHUNK_SIZE`) and aggregate the per-chunk responses:

```ts
const res = await SpmProducts.bulkSave(client, products, { chunk: true });
// res.data → { sent_count, rejected_count, failed_count, rejected_items, chunks }
```

## Retries

Automatic retry on `408 / 429 / 5xx` and network errors, with exponential backoff + jitter and `Retry-After` support. Non-idempotent writes (`POST` / `PATCH`) are only replayed when you pass an `Idempotency-Key` header. Tune or disable it:

```ts
SpmClient.getClient('v1', key, { retry: { maxRetries: 5 } });
SpmClient.getClient('v1', key, { retry: false });
```

## Client options

```ts
SpmClient.getClient('v1', apiKey, {
  baseUrl,       // default: env SHOPIMIND_CORE_API_BASE, then https://core.shopimind.com
  timeout,       // default 30000 ms
  labelSource,   // origin tag added to ingested data ("web" by default; null disables)
  retry,         // see above
});
```

## Verifying incoming requests

When ShopiMind calls your service, verify the request with the matching scheme:

```ts
import { SpmRequestValidator, SpmWebhookSignature } from '@shopimind/sdk-js';

// CMS connectors (Shopimind-Token + Shopimind-Client-Identifiant headers):
const { valid } = SpmRequestValidator.validateRequest({
  clientId, hmacToken, body, apiIdentification, apiPassword,
});

// Integrations (timestamped HMAC, anti-replay):
const result = SpmWebhookSignature.verifyFromHeaders(rawBody, headers, secret, {
  timestampHeader: 'x-shopimind-timestamp',
  signatureHeader: 'x-shopimind-signature',
});
```

## Resources

Static-method classes mirroring the API — call them as `SpmXxx.method(client, …)`:

`SpmShopConnection`, `SpmCustomers`, `SpmCustomersAddresses`, `SpmCustomersGroups`, `SpmNewsletterSubscribers`, `SpmProducts`, `SpmProductsCategories`, `SpmProductsImages`, `SpmProductsManufacturers`, `SpmProductsVariations`, `SpmOrders`, `SpmOrdersCarriers`, `SpmOrdersStatuses`, `SpmVouchers`, `SpmDataSources`, `SpmIntegrationConfig`, `SpmCustomDataDefinitions`, `SpmCustomDataRecords`, `SpmContacts`, `SpmEvents`, `SpmCarts`, `SpmLists`.

Plus `SpmHelpers` (chunking / merging / counts / error formatting / `unwrapOrThrow`), the two request validators above, and the `SpmApiError` / `SpmClientException` error types.

## License

Source-available, proprietary — see [LICENSE](./LICENSE). You may use and modify the SDK for your own use of the ShopiMind service; redistribution and independent use are not granted.
