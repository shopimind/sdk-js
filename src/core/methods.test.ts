import { describe, it, expect } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { SpmClient } from './client.js';
import {
  processGet, processBulkSave, processSave, compactDefined,
} from './methods.js';
import type { SpmChunkedData } from '../types/common.js';

function makeClient() {
  const c = SpmClient.getClient('v1', 'k', { baseUrl: 'http://localhost', labelSource: null, retry: false });
  return { c, mock: new MockAdapter(c) };
}

describe('methods — never throw on HTTP failures', () => {
  it('200 → ok:true with the body', async () => {
    const { c, mock } = makeClient();
    mock.onGet('x').reply(200, { hello: 1 });
    const env = await processGet(c, 'x');
    expect(env).toMatchObject({ ok: true, statusCode: 200, data: { hello: 1 } });
  });

  it('404 / 409 / 500 → ok:false, no throw, data = error body', async () => {
    for (const status of [404, 409, 500]) {
      const { c, mock } = makeClient();
      mock.onGet('x').reply(status, { error: 'nope' });
      // eslint-disable-next-line no-await-in-loop
      const env = await processGet(c, 'x');
      expect(env.ok).toBe(false);
      expect(env.statusCode).toBe(status);
      expect(env.data).toEqual({ error: 'nope' });
      expect(env.error?.code).toBe(`HTTP_${status}`);
    }
  });

  it('network error → ok:false, statusCode 0, data null', async () => {
    const { c, mock } = makeClient();
    mock.onGet('x').networkError();
    const env = await processGet(c, 'x');
    expect(env.ok).toBe(false);
    expect(env.statusCode).toBe(0);
    expect(env.data).toBeNull();
  });

  it('preserves the double-nesting (res.data.data)', async () => {
    const { c, mock } = makeClient();
    mock.onGet('x').reply(200, { statusCode: 200, data: { id: 42 } });
    const env = await processGet<{ statusCode: number; data: { id: number } }>(c, 'x');
    expect(env.data?.data.id).toBe(42);
  });

  it('processSave wraps the body in an array', async () => {
    const { c, mock } = makeClient();
    mock.onPost('x').reply(200, {});
    await processSave(c, 'x', { a: 1 });
    expect(JSON.parse(mock.history.post[0]!.data)).toEqual([{ a: 1 }]);
  });
});

describe('methods — bulk chunking', () => {
  it('no chunk → one request, raw array body', async () => {
    const { c, mock } = makeClient();
    mock.onPost('items').reply(200, { sent_count: 3 });
    await processBulkSave(c, 'items', [1, 2, 3]);
    expect(mock.history.post.length).toBe(1);
    expect(JSON.parse(mock.history.post[0]!.data)).toEqual([1, 2, 3]);
  });

  it('chunk:true → splits by chunkSize and aggregates a chunked envelope', async () => {
    const { c, mock } = makeClient();
    mock.onPost('items').reply(200, { sent_count: 1, rejected_count: 0 });
    const env = await processBulkSave(c, 'items', [1, 2, 3], { chunk: true, chunkSize: 1 });
    expect(mock.history.post.length).toBe(3);
    expect(env.ok).toBe(true);
    const data = env.data as SpmChunkedData;
    expect(data.sent_count).toBe(3);
    expect(data.chunks.length).toBe(3);
  });

  it('chunked partial failure → ok:false, PARTIAL_FAILURE, failed_count of the failed chunk', async () => {
    const { c, mock } = makeClient();
    mock.onPost('items').replyOnce(200, { sent_count: 1 }).onPost('items').replyOnce(500, {});
    const env = await processBulkSave(c, 'items', [1, 2], { chunk: true, chunkSize: 1 });
    expect(env.ok).toBe(false);
    expect((env.data as SpmChunkedData).failed_count).toBe(1);
    expect(env.error?.code).toBe('PARTIAL_FAILURE');
  });
});

describe('compactDefined', () => {
  it('drops null/undefined/empty/0/false and empty arrays (PHP !empty parity)', () => {
    expect(compactDefined({
      a: 1, b: null, c: undefined, d: '', e: 0, f: false, g: [], h: 'x',
    })).toEqual({ a: 1, h: 'x' });
  });
});
