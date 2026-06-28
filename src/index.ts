// Public surface of @shopimind/sdk-js.
// Classes/objects are exported as VALUES; types via `export type`.

// --- core ---
export { SpmClient } from './core/client.js';
export { SpmClientException } from './core/exception.js';
export { SpmApiError } from './core/api-error.js';
export { SpmRequestValidator } from './core/request-validator.js';
export { SpmWebhookSignature } from './core/webhook-signature.js';
export { SpmHelpers } from './helpers/index.js';

// --- shop connection ---
export { SpmShopConnection } from './resources/shop-connection.js';

// --- customers ---
export { SpmCustomers } from './resources/customers.js';
export { SpmCustomersAddresses } from './resources/customers-addresses.js';
export { SpmCustomersGroups } from './resources/customers-groups.js';

// --- products ---
export { SpmProducts } from './resources/products.js';
export { SpmProductsCategories } from './resources/products-categories.js';
export { SpmProductsImages } from './resources/products-images.js';
export { SpmProductsManufacturers } from './resources/products-manufacturers.js';
export { SpmProductsVariations } from './resources/products-variations.js';

// --- orders ---
export { SpmOrders } from './resources/orders.js';
export { SpmOrdersCarriers } from './resources/orders-carriers.js';
export { SpmOrdersStatuses } from './resources/orders-statuses.js';

// --- vouchers ---
export { SpmVouchers } from './resources/vouchers.js';

// --- newsletter subscribers ---
export { SpmNewsletterSubscribers } from './resources/newsletter-subscribers.js';

// --- data sources & integration config ---
export { SpmDataSources } from './resources/data-sources.js';
export { SpmIntegrationConfig } from './resources/integration-config.js';

// --- custom data ---
export { SpmCustomDataDefinitions } from './resources/custom-data-definitions.js';
export { SpmCustomDataRecords } from './resources/custom-data-records.js';

// --- contacts, events, carts, lists ---
export { SpmContacts } from './resources/contacts.js';
export { SpmEvents } from './resources/events.js';
export { SpmCarts } from './resources/carts.js';
export { SpmLists } from './resources/lists.js';

// --- types ---
export type * from './types/index.js';
