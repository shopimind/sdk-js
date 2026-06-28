import { describe, it, expect } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { SpmClient } from '../core/client.js';
import { SpmDataSources } from './data-sources.js';
import { SpmCustomDataRecords } from './custom-data-records.js';
import { SpmCustomDataDefinitions } from './custom-data-definitions.js';
import { SpmOrders } from './orders.js';
import { SpmEvents } from './events.js';
import { SpmCustomers } from './customers.js';
import { SpmNewsletterSubscribers } from './newsletter-subscribers.js';

function setup() {
  const c = SpmClient.getClient('v1', 'k', { baseUrl: 'http://localhost', labelSource: null, retry: false });
  return { c, mock: new MockAdapter(c) };
}

describe('SpmDataSources', () => {
  it('list → GET data-sources ; create → POST body as-is', async () => {
    const { c, mock } = setup();
    mock.onGet('data-sources').reply(200, { statusCode: 200, data: [{ id_data_source: 1 }] });
    mock.onPost('data-sources').reply(200, {});
    const env = await SpmDataSources.list(c);
    expect(mock.history.get[0]!.url).toBe('data-sources');
    expect((env.data as { data: unknown }).data).toEqual([{ id_data_source: 1 }]);

    await SpmDataSources.create(c, { label: 'POS' });
    expect(JSON.parse(mock.history.post[0]!.data)).toEqual({ label: 'POS' });
  });
});

describe('SpmCustomDataRecords.bulkSave', () => {
  it('POSTs the raw array to …/:definitionId and propagates chunking', async () => {
    const { c, mock } = setup();
    mock.onPost('custom-data-records/9').reply(200, { sent_count: 1 });
    await SpmCustomDataRecords.bulkSave(c, 9, [{ a: 1 }, { a: 2 }], { chunk: true, chunkSize: 1 });
    expect(mock.history.post.length).toBe(2); // split in 2 chunks
    expect(mock.history.post[0]!.url).toBe('custom-data-records/9');
    expect(JSON.parse(mock.history.post[0]!.data)).toEqual([{ a: 1 }]); // raw array, single item
  });
});

describe('SpmCustomDataDefinitions.update', () => {
  it('uses PATCH …/:id/extend', async () => {
    const { c, mock } = setup();
    mock.onPatch('custom-data-definitions/3/extend').reply(200, {});
    await SpmCustomDataDefinitions.update(c, 3, { description: 'x' });
    expect(mock.history.patch[0]!.url).toBe('custom-data-definitions/3/extend');
  });
});

describe('SpmOrders routing', () => {
  it('get → orders/id/:id ; getByReference → orders/reference/:enc', async () => {
    const { c, mock } = setup();
    mock.onGet(/orders\/.*/).reply(200, {});
    await SpmOrders.get(c, '1001');
    await SpmOrders.getByReference(c, 'A/100');
    expect(mock.history.get[0]!.url).toBe('orders/id/1001');
    expect(mock.history.get[1]!.url).toBe('orders/reference/A%2F100');
  });
});

describe('SpmEvents', () => {
  it('trigger → POST events/trigger/:enc(codeName)', async () => {
    const { c, mock } = setup();
    mock.onPost(/events\/trigger\/.*/).reply(200, {});
    await SpmEvents.trigger(c, 'pos loyalty', { contact: { email: 'a@b.c' } });
    expect(mock.history.post[0]!.url).toBe('events/trigger/pos%20loyalty');
  });

  it('create returns a non-ok envelope on 409 WITHOUT throwing', async () => {
    const { c, mock } = setup();
    mock.onPost('events').reply(409, { message: 'already exists' });
    const env = await SpmEvents.create(c, { name: 'x', code_name: 'x' });
    expect(env.ok).toBe(false);
    expect(env.statusCode).toBe(409);
  });
});

describe('SpmCustomers.bulkSave', () => {
  it('POSTs customers and chunks at CHUNK_SIZE', async () => {
    const { c, mock } = setup();
    expect(SpmCustomers.CHUNK_SIZE).toBe(50);
    mock.onPost('customers').reply(200, { sent_count: 1 });
    await SpmCustomers.bulkSave(c, [{ customer_id: '1' }, { customer_id: '2' }] as never, { chunk: true, chunkSize: 1 });
    expect(mock.history.post.length).toBe(2);
    expect(mock.history.post[0]!.url).toBe('customers');
  });
});

describe('SpmNewsletterSubscribers.bulkSave', () => {
  it('POSTs newsletter-subscribers and chunks', async () => {
    const { c, mock } = setup();
    mock.onPost('newsletter-subscribers').reply(200, { sent_count: 1 });
    await SpmNewsletterSubscribers.bulkSave(c, [{ email: 'a@b.c' }, { email: 'd@e.f' }] as never, { chunk: true, chunkSize: 1 });
    expect(mock.history.post.length).toBe(2);
    expect(mock.history.post[0]!.url).toBe('newsletter-subscribers');
  });
});
