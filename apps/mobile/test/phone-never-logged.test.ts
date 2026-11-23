/**
 * [NS-54-R26] [BL-1901] A phone number never reaches a log line, a crash record or an error message. The rule
 * exists before the first line of phone code (BL-1902). Fictional numbers only (US 555-01XX, UK 07700 900XXX).
 * The analytics sink is packages/analytics/test/phone-never-sent.test.ts.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { decodeLine, findLeaks } from '../e2e-web/support/log-canary';
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

  it('[NS-54-R26] does not flag ordinary console lines (false-positive regression, no allow-list exists)', () => {
    const calm = [
      'retry +1 200', 'delta +1 100,', 'retry +1 300.', 'diff +7 100', 'retry +1 200ms', 'diff +2 1000 lines', 'diff +1 1000 lines', '+1 2026-11-23', 'offset +1 0530', 'duration 100 200 3000', 'serial 123-456-7890',
      '2026-11-23 10:20:30', '2026-11-23T10:20:30.123Z', '2026-11-23T10:20:30+01:00', '2026-11-23T10:20:30+0530', 'at +00:00', 'tz +0530', 'utc offset +1',
      '23/11/2026', '11.23.2026 build', 'started 10:20:30.456', 'Mon Nov 23 2026 10:20:30 GMT+0100',
      'v1.2.3', 'expo 57.0.1', 'version 12.34.56-rc.1', 'build 5', 'build number 1234567', 'runtime 1.0.0 (build 321)',
      'host 192.168.100.100:8081', 'ip 10.0.0.12', 'listening on 127.0.0.1:19006', '[::1]:8081',
      '1763890000000', 'epoch 1763890000', 'ts=1763890000123 level=info', 'time 1763890000.123',
      '0190a000-0000-7000-8000-000000000000', 'id 7b1f2c3d-0000-4000-8000-00000000aaaa', 'job 00000000-0000-4000-8000-0000000000aa done',
      'took 1200 ms', 'took 100 200 ms', 'sync 3 of 12', 'retry 2 of 5 in 400ms', 'counter 100 200 300', 'queue length 1024',
      'size 1048576 bytes', 'file 2.4 MB', 'rss 123 456 KB', 'heap 12 345 678', 'frames 60 fps, dropped 0 of 3600',
      'GET /api/v1/items?limit=100&offset=200 200 OK', 'status 200 in 1.5s', 'HTTP 503', 'SQLSTATE 23505', 'code P0002',
      '%s: 1 2 3 4 5 6 7', 'rect 0 0 390 844', 'layout 20 40 100 200', 'pad 8 16 8 16', 'score +3 2000', 'delta +12 -34',
      '[e2e-boot] Error: database is locked', 'Warning: Each child in a list should have a unique key', 'sha 3a7bd3e2360a3d29eea436fcfb7e44c735d117c42d1c1835420b6b9942dd4f1b',
    ];
    expect(calm.length).toBeGreaterThanOrEqual(50);
    expect(findLeaks(calm).map((l) => calm[l.line])).toEqual([]);
  });

  it('[NS-54-R26] still flags the fictional numbers in a sentence and at the end of a line', () => {
    const planted = ['sent to +12025550147', 'sent to +1 (202) 555-0147 ok', 'call (202) 555-0147.', 'call 202-555-0147', 'call 07700 900123', 'to +44 7700', 'to +1 202', 'to +1 202.', 'to "+44 7700"', 'to +1 2025', 'to +1 (202)', 'to +7 912'];
    expect(findLeaks(planted).map((l) => l.line)).toEqual(planted.map((_, i) => i));
  });

  it('[NS-54-R26] positive control: with the shapes in place, a number inside an ordinary line fails the run', () => {
    expect(findLeaks(['retry +1 200ms', 'diff +2 1000 lines', 'retry to +447700900123 in 400ms']).map((l) => l.line)).toEqual([2]);
  });

  it('[BL-1947] flags a number with URL-encoded spacing, and never throws on a malformed escape', () => {
    const enc = ['GET /verify?to=%2B44%207700%20900123', 'q=%2B1%20202%20555%200147&x=1', 'to=%2B12025550147', 'phone=%28202%29%20555-0147', 'to=%2b44%207700'];
    expect(findLeaks(enc).map((l) => l.line)).toEqual(enc.map((_, i) => i));
    expect(findLeaks(['bad %zz %2 %E0%A4%A tail %', 'ok %2B1 ok', 'a%20b']).map((l) => l.line)).toEqual([]);
    expect(decodeLine('%2B44%207700 %zz %')).toBe('+44 7700 %zz %');
  });

  it('[BL-1947] flags the national form of a registered number by its last 10 digits, without echoing a digit', () => {
    const us = findLeaks(['sent 2025550147', 'sent 1 2025550147', 'q=%32025550147'], [], ['+12025550147']);
    expect(us.map((l) => l.label)).toEqual(['phone:0', 'phone:0', 'phone:0']);
    const uk = findLeaks(['dial 07700900123', 'dial 07700 900123 now', 'id 7700900124'], [], ['+447700900123']);
    expect(uk.map((l) => `${l.label}@${l.line}`)).toEqual(['phone:0@0', 'phone-shape@1']);
    expect(findLeaks(['n 20255501'], [], ['+12025550147'])).toEqual([]);
    expect(hasNumber(JSON.stringify([us, uk]))).toBe(false);
  });

  it('[BL-1947] names the gaps it does not cover, in the canary doc, and does not claim more than it does', () => {
    const src = readFileSync(new URL('../e2e-web/support/log-canary.ts', import.meta.url), 'utf8');
    const gaps = ['+1 202 555', '+91 98765 43210', '+49 151 12345678', '(+44) 7700 900123', '555-0142', '020 7946 0123', '+44 7700 failed', '%2B44+7700+900123', '%252B44%25207700%2520900123'];
    for (const gap of gaps) expect(src, gap).toContain(gap.slice(0, 7));
    expect(src).not.toMatch(/fails? closed/i);
    for (const gap of gaps)
      expect(findLeaks([`x ${gap}`]).map((l) => l.label), gap).toEqual([]);
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
