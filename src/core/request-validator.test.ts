import { describe, it, expect } from 'vitest';
import { createHash, createHmac } from 'node:crypto';
import { SpmRequestValidator } from './request-validator.js';

describe('SpmRequestValidator.implodeRecursive', () => {
  it('sorts keys, removes spaces, skips "0" values', () => {
    expect(SpmRequestValidator.implodeRecursive({ b: 'x y', a: '1', z: '0' })).toBe('a;1;b;xy');
  });

  it('sorts the ROOT only — nested keys keep insertion order (connector-channel parity)', () => {
    // Root is sorted (a before b); the nested object {d,c} is NOT re-sorted —
    // matches the live NestJS shopAction signer + CMS connectors (root-only sort).
    expect(SpmRequestValidator.implodeRecursive({ b: '2', a: { d: '4', c: '3' } })).toBe('d;4;c;3;b;2');
  });
});

describe('SpmRequestValidator.validateHmac', () => {
  it('accepts a correct HMAC and rejects a wrong one', () => {
    const body = { a: '1', b: '2' };
    const apiPassword = 'prefix.secret';
    const imploded = SpmRequestValidator.implodeRecursive(body);
    const secretHash = createHash('sha256').update('secret').digest('hex');
    const expected = createHmac('sha256', secretHash).update(imploded).digest('hex');

    expect(SpmRequestValidator.validateHmac(body, expected, apiPassword)).toBe(true);
    expect(SpmRequestValidator.validateHmac(body, 'deadbeef', apiPassword)).toBe(false);
  });
});

describe('SpmRequestValidator.validateClientId', () => {
  it('compares via md5', () => {
    expect(SpmRequestValidator.validateClientId('abc', 'abc')).toBe(true);
    expect(SpmRequestValidator.validateClientId('abc', 'xyz')).toBe(false);
  });
});

describe('SpmRequestValidator.parseFormData', () => {
  it('parses PHP bracket notation into nested structures', () => {
    expect(SpmRequestValidator.parseFormData('a[b]=1&c=2')).toEqual({ a: { b: '1' }, c: '2' });
    expect(SpmRequestValidator.parseFormData('a[]=1&a[]=2')).toEqual({ a: ['1', '2'] });
  });

  it('does not pollute Object.prototype (reserved keys ignored)', () => {
    SpmRequestValidator.parseFormData('__proto__[polluted]=yes');
    SpmRequestValidator.parseFormData('constructor[prototype][p2]=yes2');
    SpmRequestValidator.parseFormData('a[__proto__][p3]=yes3');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const probe = {} as any;
    expect(probe.polluted).toBeUndefined();
    expect(probe.p2).toBeUndefined();
    expect(probe.p3).toBeUndefined();
  });
});

describe('SpmRequestValidator.validateRequest', () => {
  it('fails fast on a missing client id', () => {
    expect(SpmRequestValidator.validateRequest({
      clientId: '', hmacToken: 't', body: {}, apiIdentification: 'id', apiPassword: 'p',
    })).toEqual({ valid: false, error: 'Missing Shopimind-Client-Identifiant header' });
  });
});
