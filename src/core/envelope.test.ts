import { describe, it, expect } from 'vitest';
import type { AxiosError, AxiosResponse } from 'axios';
import { wrapSuccess, wrapError } from './envelope.js';

describe('wrapSuccess', () => {
  it('wraps a 2xx response', () => {
    const env = wrapSuccess({ status: 200, data: { a: 1 } } as AxiosResponse);
    expect(env).toMatchObject({ ok: true, statusCode: 200, data: { a: 1 }, error: null });
  });

  it('coerces undefined data to null', () => {
    const env = wrapSuccess({ status: 204, data: undefined } as unknown as AxiosResponse);
    expect(env.data).toBeNull();
  });
});

describe('wrapError', () => {
  it('wraps an HTTP error: keeps the error body, uppercases the code', () => {
    const env = wrapError({ response: { status: 422, data: { e: 'bad' } }, message: 'm', code: 'x' } as unknown as AxiosError);
    expect(env.ok).toBe(false);
    expect(env.statusCode).toBe(422);
    expect(env.data).toEqual({ e: 'bad' });
    expect(env.error?.code).toBe('X');
  });

  it('derives HTTP_<status> code when error.code is absent', () => {
    const env = wrapError({ response: { status: 404, data: null }, message: 'nf' } as unknown as AxiosError);
    expect(env.error?.code).toBe('HTTP_404');
  });

  it('network failure → statusCode 0, data null, retryable', () => {
    const env = wrapError({ message: 'connection reset', code: 'ECONNRESET' } as unknown as AxiosError);
    expect(env.statusCode).toBe(0);
    expect(env.data).toBeNull();
    expect(env.error?.retryable).toBe(true);
  });
});
