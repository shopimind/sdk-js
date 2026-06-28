import {
  describe, it, expect, afterEach,
} from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { SpmClient } from './client.js';

afterEach(() => {
  delete process.env.SHOPIMIND_CORE_API_BASE;
});

describe('SpmClient.getClient — baseURL resolution', () => {
  it('uses options.baseUrl + version, trimming trailing slashes', () => {
    const c = SpmClient.getClient('v1', 'k', { baseUrl: 'https://example.com///' });
    expect(c.defaults.baseURL).toBe('https://example.com/v1/');
  });

  it('falls back to env SHOPIMIND_CORE_API_BASE', () => {
    process.env.SHOPIMIND_CORE_API_BASE = 'https://env.example';
    const c = SpmClient.getClient('v1', 'k');
    expect(c.defaults.baseURL).toBe('https://env.example/v1/');
  });

  it('defaults to the production base URL', () => {
    const c = SpmClient.getClient('v1', 'k');
    expect(c.defaults.baseURL).toBe('https://core.shopimind.com/v1/');
  });

  it('applies the default timeout', () => {
    expect(SpmClient.getClient('v1', 'k').defaults.timeout).toBe(30000);
    expect(SpmClient.getClient('v1', 'k', { timeout: 5000 }).defaults.timeout).toBe(5000);
  });

  it('rejects an http baseUrl to a remote host (api key would leak in clear)', () => {
    expect(() => SpmClient.getClient('v1', 'k', { baseUrl: 'http://evil.example' })).toThrowError(/http/i);
  });

  it('allows http on loopback and any host with allowInsecureBaseUrl', () => {
    expect(() => SpmClient.getClient('v1', 'k', { baseUrl: 'http://localhost:8080' })).not.toThrow();
    expect(() => SpmClient.getClient('v1', 'k', { baseUrl: 'http://127.0.0.1' })).not.toThrow();
    expect(() => SpmClient.getClient('v1', 'k', { baseUrl: 'http://proxy.internal', allowInsecureBaseUrl: true })).not.toThrow();
  });

  it('rejects a malformed baseUrl', () => {
    expect(() => SpmClient.getClient('v1', 'k', { baseUrl: 'not a url' })).toThrowError(/baseUrl/);
  });

  it('does not follow redirects (avoids leaking spm-api-key cross-origin)', () => {
    expect(SpmClient.getClient('v1', 'k').defaults.maxRedirects).toBe(0);
  });
});

describe('SpmClient.getClient — auth header', () => {
  it('sends the api key as the spm-api-key header', async () => {
    const c = SpmClient.getClient('v1', 'secret', { baseUrl: 'http://localhost', labelSource: null });
    const mock = new MockAdapter(c);
    mock.onGet('ping').reply(200, {});
    await c.get('ping');
    expect(mock.history.get[0]?.headers?.['spm-api-key']).toBe('secret');
  });
});

describe('SpmClient.getClient — label_source injection', () => {
  it('injects label_source on POST bodies, except excluded endpoints', async () => {
    const c = SpmClient.getClient('v1', 'k', { baseUrl: 'http://localhost', labelSource: 'web' });
    const mock = new MockAdapter(c);
    mock.onPost('products').reply(200, {});
    mock.onPost('custom-data-records/5').reply(200, {});

    await c.request({ method: 'post', url: 'products', data: [{ a: 1 }] });
    await c.request({ method: 'post', url: 'custom-data-records/5', data: [{ a: 1 }] });

    expect(JSON.parse(mock.history.post[0]!.data)).toEqual([{ a: 1, label_source: 'web' }]);
    // custom-data-records is excluded → body untouched
    expect(JSON.parse(mock.history.post[1]!.data)).toEqual([{ a: 1 }]);
  });

  it('does not inject when labelSource is null', async () => {
    const c = SpmClient.getClient('v1', 'k', { baseUrl: 'http://localhost', labelSource: null });
    const mock = new MockAdapter(c);
    mock.onPost('products').reply(200, {});
    await c.request({ method: 'post', url: 'products', data: [{ a: 1 }] });
    expect(JSON.parse(mock.history.post[0]!.data)).toEqual([{ a: 1 }]);
  });
});
