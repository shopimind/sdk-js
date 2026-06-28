import { describe, it, expect } from 'vitest';
import * as sdk from './index.js';

// All 27 classes must be present as runtime values (functions). Catches a class
// accidentally exported as a type (undefined at runtime under verbatimModuleSyntax).
const CLASSES = [
  'SpmClient', 'SpmClientException', 'SpmApiError', 'SpmRequestValidator', 'SpmWebhookSignature',
  'SpmShopConnection', 'SpmCustomers', 'SpmCustomersAddresses', 'SpmCustomersGroups',
  'SpmProducts', 'SpmProductsCategories', 'SpmProductsImages', 'SpmProductsManufacturers', 'SpmProductsVariations',
  'SpmOrders', 'SpmOrdersCarriers', 'SpmOrdersStatuses', 'SpmVouchers', 'SpmNewsletterSubscribers',
  'SpmDataSources', 'SpmIntegrationConfig', 'SpmCustomDataDefinitions', 'SpmCustomDataRecords',
  'SpmContacts', 'SpmEvents', 'SpmCarts', 'SpmLists',
] as const;

describe('public exports', () => {
  it('exposes the 27 classes as functions + SpmHelpers as an object (28 total)', () => {
    const mod = sdk as unknown as Record<string, unknown>;
    for (const name of CLASSES) {
      expect(typeof mod[name], name).toBe('function');
    }
    expect(typeof sdk.SpmHelpers).toBe('object');
    expect(CLASSES.length + 1).toBe(28);
  });

  it('SpmHelpers exposes its 6 helper functions', () => {
    for (const fn of ['chunk', 'mergeResponses', 'extractCounts', 'isRetryable', 'formatError', 'unwrapOrThrow'] as const) {
      expect(typeof sdk.SpmHelpers[fn]).toBe('function');
    }
  });
});
