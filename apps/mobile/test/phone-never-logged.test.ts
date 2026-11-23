/**
 * [NS-54-R26] [BL-1901] A phone number never reaches a log line, a crash record or an error message. The rule
 * exists before the first line of phone code (BL-1902). Fictional numbers only (US 555-01XX, UK 07700 900XXX).
 * The analytics sink is packages/analytics/test/phone-never-sent.test.ts.
 */
import { describe, expect, it, vi } from 'vitest';
import { findLeaks } from '../e2e-web/support/log-canary';
import { authErrorKind } from '../src/lib/auth/errors.logic';
import { safeErrorCode, storedLastError } from '../src/lib/backup/contract';
import { createFaultLog, createFaultStore, installGlobalErrorHandlers, type ErrorUtilsLike, type RejectionTrackerLike } from '../src/lib/resilience/global-errors.logic';

const FULL = ['+12025550147', '+1 202 555 0147', '(202) 555-0147', '+447700900123', '+44 7700 900123', '07700 900123'];
const PARTIAL = ['+44 7700', '+1 202'];
const REGISTERED = '+12025550147';
const hasNumber = (s: string) => /0147|900123|202 ?555|7700/.test(s.replace(/[^\d ]/g, ''));

describe('[NS-54-R26] the log canary sees a phone number', () => {
  it('[NS-54-R26] flags a full number in any common shape, in a log line', () => {
    for (const n of FULL) expect(findLeaks([`sent code to ${n}`]).map((l) => l.label), n).toEqual(['phone-shape']);
  });

  it('[NS-54-R26] flags a country-code prefix with its first group (a partial number)', () => {
    for (const n of PARTIAL) expect(findLeaks([`verify ${n}`]).map((l) => l.label), n).toEqual(['phone-shape']);
  });

  it('[NS-54-R26] flags a registered number by its last four digits, the part a mask shows', () => {
    expect(findLeaks(['number ends 0147'], [], [REGISTERED]).map((l) => l.label)).toEqual(['phone:0']);
    expect(findLeaks(['masked ***0147'], [], [REGISTERED]).length).toBe(1);
    expect(findLeaks(['number ends 1470', 'id 20147x'], [], [REGISTERED])).toEqual([]);
  });

  it('[NS-54-R26] does not flag dates, times, offsets, epoch times, versions or addresses', () => {
    const calm = ['2026-11-23 10:20:30', 'at +00:00', 'tz +0530', '1763890000000', 'v1.2.3 build 5', 'host 192.168.100.100:8081', '[e2e-boot] Error: database is locked'];
    expect(findLeaks(calm)).toEqual([]);
  });

  it('[NS-54-R26] reports a label and a position, never the number', () => {
    const leaks = findLeaks(['ok', `to ${FULL[0]} failed`, 'ends 0147'], [], [REGISTERED]);
    expect(leaks.map((l) => `${l.label}@${l.line}`)).toEqual(['phone-shape@1', 'phone:0@2']);
    expect(hasNumber(JSON.stringify(leaks))).toBe(false);
  });

  it('[NS-54-R26] positive control: a fake send flow that logs the number fails the canary; one that logs only an outcome passes', () => {
    const run = (log: (m: string) => void, n: string) => {
      log(`[verify] requested`);
      log(`[verify] ${n.length > 0 ? 'sent' : 'failed'}`);
    };
    const clean: string[] = [];
    for (const n of FULL) run((m) => clean.push(m), n);
    expect(findLeaks(clean, [], FULL)).toEqual([]);
    const leaky: string[] = [];
    for (const n of FULL) run((m) => leaky.push(m.replace('sent', `sent to ${n}`)), n);
    expect(findLeaks(leaky, [], FULL).length).toBe(FULL.length);
  });
});

function harness(dev: boolean) {
  let handler: ((e: unknown, fatal?: boolean) => void) | undefined = vi.fn();
  const eu: ErrorUtilsLike = { getGlobalHandler: () => handler, setGlobalHandler: (h) => void (handler = h) };
  let reject: ((id: number, r: unknown) => void) | undefined;
  const hermes: RejectionTrackerLike = { enablePromiseRejectionTracker: (o) => void (reject = o.onUnhandled) };
  const log = createFaultLog();
  const store = createFaultStore();
  const warn = vi.fn();
  installGlobalErrorHandlers({ errorUtils: eu, hermes, dev, record: log.push, onFatal: store.set, warn, now: () => 1 });
  return { fire: (e: unknown, f?: boolean) => handler?.(e, f), reject: (id: number, r: unknown) => reject?.(id, r), log, store, warn };
}

describe('[NS-54-R26] a crash record and a dev log line hold no phone number', () => {
  it('[NS-54-R26] a throw, a fatal throw and a rejection that quote a number leave only a class code, an id and a time', () => {
    for (const dev of [false, true]) {
      const h = harness(dev);
      for (const n of FULL) {
        const err = new TypeError(`bad number ${n}`);
        (err as Error & { phone?: string }).phone = n;
        err.stack = `TypeError: bad number ${n}\n    at send (verify/${n}.js:1:1)`;
        h.fire(err, false);
        h.fire(err, true);
        if (!dev) h.reject(7, err);
        h.fire(n, true);
      }
      const shown = JSON.stringify([h.log.list(), h.store.get(), h.warn.mock.calls]);
      expect(findLeaks([shown], [], FULL), `dev=${dev}`).toEqual([]);
      expect(Object.keys(h.log.list()[0]).sort()).toEqual(['at', 'code', 'id', 'kind']);
      expect(h.warn).toHaveBeenCalledTimes(dev ? 3 * FULL.length : 0);
    }
  });

  it('[NS-54-R26] positive control: a handler that records the message turns the canary red', () => {
    const rec = { kind: 'fatal', code: 'type_error', id: 1, at: 1, message: new TypeError(`bad number ${FULL[0]}`).message };
    expect(findLeaks([JSON.stringify(rec)], [], FULL).length).toBe(1);
  });
});

describe('[NS-54-R26] an error message holds no phone number', () => {
  it('[NS-54-R26] the auth error kinds are a closed set, whatever an error quotes', () => {
    for (const n of FULL) {
      for (const e of [new Error(`sms to ${n} failed`), { message: n, status: 429 }, { error: n }, n]) {
        for (const ctx of ['code', 'send', 'provider'] as const) {
          const kind = authErrorKind(e, ctx);
          expect(typeof kind).toBe('string');
          expect(findLeaks([kind], [], FULL), `${ctx}:${kind}`).toEqual([]);
        }
      }
    }
  });

  it('[NS-54-R26] a stored last error keeps only codes the contract names, so a number quoted by a server is dropped', () => {
    for (const n of FULL) {
      expect(findLeaks([storedLastError(n), storedLastError(`P0002:${n}`), safeErrorCode(n)], [], FULL), n).toEqual([]);
    }
  });

  it('[NS-54-R26] positive control: an error that keeps the quoted text turns the canary red', () => {
    const keepsText = (e: Error) => e.message;
    expect(findLeaks([keepsText(new Error(`sms to ${FULL[3]} failed`))], [], FULL).length).toBe(1);
  });
});
