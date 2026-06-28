import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { SpmValidationResult } from '../types/common.js';

export class SpmRequestValidator {
  /**
   * Implode an object into a `key;value;key;value` string used by the connector
   * channel for HMAC validation. Only ROOT keys are sorted; nested levels keep
   * their insertion order — this is the exact algorithm the channel expects, so
   * sorting every level would diverge and reject otherwise-valid nested payloads.
   * `'0'` values are skipped, then all spaces are stripped.
   */
  static implodeRecursive(obj: Record<string, unknown>): string {
    let out = '';

    const walk = (data: unknown): void => {
      if (!data || typeof data !== 'object') return;
      const rec = data as Record<string, unknown>;
      // Nested keys keep their insertion order (only the root is sorted).
      for (const k of Object.keys(rec)) {
        const v = rec[k];
        if (v !== null && typeof v === 'object') {
          walk(v);
        } else if (v !== '0') {
          out += out === '' ? `${k};${v as string}` : `;${k};${v as string}`;
        }
      }
    };

    // Root keys only are sorted.
    const sortedRoot: Record<string, unknown> = {};
    Object.keys(obj).sort().forEach((k) => { sortedRoot[k] = obj[k]; });
    walk(sortedRoot);

    return out.replace(/ /g, '');
  }

  /**
   * Validate the HMAC (`Shopimind-Token` header) of an incoming request.
   * Uses sha256(secret) as key, sha256-HMAC over the imploded body, then
   * compares md5 digests in constant time.
   */
  static validateHmac(requestBody: Record<string, unknown>, requestHmac: string, apiPassword: string): boolean {
    try {
      const parts = String(apiPassword || '').split('.');
      const secret = parts[1] || apiPassword;

      const dataImploded = SpmRequestValidator.implodeRecursive(requestBody || {});
      const secretHash = createHash('sha256').update(String(secret)).digest('hex');
      const hmac = createHmac('sha256', secretHash).update(dataImploded).digest('hex');

      const hmacMd5 = createHash('md5').update(hmac).digest('hex');
      const requestHmacMd5 = createHash('md5').update(String(requestHmac || '')).digest('hex');

      return SpmRequestValidator.timingSafeEqualHex(hmacMd5, requestHmacMd5);
    } catch {
      return false;
    }
  }

  /** Compare `Shopimind-Client-Identifiant` against the configured value (md5). */
  static validateClientId(requestClientId: string, configClientId: string): boolean {
    try {
      const a = createHash('md5').update(String(requestClientId || '')).digest('hex');
      const b = createHash('md5').update(String(configClientId || '')).digest('hex');
      return SpmRequestValidator.timingSafeEqualHex(a, b);
    } catch {
      return false;
    }
  }

  /** Constant-time comparison of two equal-length hex digests. */
  private static timingSafeEqualHex(a: string, b: string): boolean {
    const ab = Buffer.from(a, 'utf8');
    const bb = Buffer.from(b, 'utf8');
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  }

  /**
   * Parse a URL-encoded body with bracket notation (`a[b][c]=1`) into a nested
   * structure. Empty brackets (`a[]=1`) append to arrays.
   */
  static parseFormData(rawBody: string): Record<string, unknown> {
    // Reserved segments: a form-encoded body must not pollute Object.prototype
    // via `__proto__[x]=…` / `constructor[prototype][x]=…`.
    const RESERVED = new Set(['__proto__', 'constructor', 'prototype']);
    const result: Record<string, unknown> = {};
    const params = new URLSearchParams(String(rawBody || ''));

    const entries = Array.from(params.entries());
    for (const [key, value] of entries) {
      const match = key.match(/^([^[]+)(.*)$/);
      if (!match) continue;

      const baseKey = match[1] as string;
      const brackets = match[2] as string;

      if (!brackets) {
        if (RESERVED.has(baseKey)) continue;
        result[baseKey] = value;
        continue;
      }

      const path = [baseKey];
      const bracketRe = /\[([^\]]*)\]/g;
      let m = bracketRe.exec(brackets);
      while (m) {
        path.push(m[1] as string);
        m = bracketRe.exec(brackets);
      }

      // Any key whose path crosses a reserved segment is dropped entirely.
      if (path.some((seg) => RESERVED.has(seg))) continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let cur: any = result;
      for (let j = 0; j < path.length - 1; j += 1) {
        const seg = path[j] as string;
        if (cur[seg] === undefined) {
          const next = path[j + 1] as string;
          cur[seg] = /^\d*$/.test(next) ? [] : {};
        }
        cur = cur[seg];
      }

      const last = path[path.length - 1] as string;
      if (last === '' && Array.isArray(cur)) {
        cur.push(value);
      } else {
        cur[last] = value;
      }
    }
    return result;
  }

  /** One-shot validator combining clientId + HMAC checks. */
  static validateRequest(opts: {
    clientId: string;
    hmacToken: string;
    body: Record<string, unknown>;
    apiIdentification: string;
    apiPassword: string;
  }): SpmValidationResult {
    const {
      clientId, hmacToken, body, apiIdentification, apiPassword,
    } = opts;
    if (!clientId) return { valid: false, error: 'Missing Shopimind-Client-Identifiant header' };
    if (!SpmRequestValidator.validateClientId(clientId, apiIdentification)) {
      return { valid: false, error: 'Invalid client ID' };
    }
    if (!hmacToken) return { valid: false, error: 'Missing Shopimind-Token header' };
    if (!SpmRequestValidator.validateHmac(body, hmacToken, apiPassword)) {
      return { valid: false, error: 'Invalid HMAC token' };
    }
    return { valid: true };
  }
}
