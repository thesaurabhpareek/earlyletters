/// <reference types="node" />
/**
 * [NX-39-R30] a fake city, id and date never appear in any log, analytics event or crash report (BL-862; OBS-R10,
 * LEGAL-REQ-014, SEC-ML-5).
 *
 * Three parts. First the harness proves it can see a leak: the canary, written to each sink in each encoding, must be
 * found (positive controls), and a clean run must come back empty (negative control). Then the one stage that exists
 * today, a forced native error, runs through the real boundary and must leave no hit in logs, breadcrumbs, crash
 * payloads or the real analytics client. Last, a gate: P2b (moments) and P2c (the background top-up) may not be on in
 * any build profile while a canary stage is still pending.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createAnalytics, memoryStorage, recordingProvider } from '@scribe/analytics';
import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';
import { MediaNativeError, toNativeErrorCode } from '../src/lib/media/native-error';
import { CANARY, CANARY_STAGES, canaryGateViolations, CanarySinks, nativeErrorWithCanary, needles } from './support/log-canary';
import { scanTree } from './support/media-scan';

let sinks: CanarySinks | null = null;
afterEach(() => {
  sinks?.restore();
  sinks = null;
});
const fresh = () => (sinks = new CanarySinks().install());

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

describe('[NX-39-R30] the harness can see a leak (positive controls)', () => {
  const written: [string, string][] = [
    ['the city', CANARY.city],
    ['the city in lower case', CANARY.city.toLowerCase()],
    ['the city key', CANARY.cityKey],
    ['the asset id', CANARY.assetId],
    ['the instant', CANARY.instant],
    ['the date alone', '2031-07-19'],
    ['the date as epoch milliseconds', String(Date.parse(CANARY.instant))],
    ['the date spelled out', 'July 19, 2031'],
    ['the path', CANARY.path],
    ['the file name', 'asha-canary-0042.heic'],
    ['the city URL-encoded', encodeURIComponent(CANARY.city)],
    ['the path URL-encoded', encodeURIComponent(CANARY.path)],
    ['the city in base64', b64(CANARY.city)],
    ['the asset id in base64', b64(CANARY.assetId)],
    ['the city in hex', Buffer.from(CANARY.city).toString('hex')],
    ['the city inside JSON', JSON.stringify({ a: { city: CANARY.city } })],
    ['a fragment of the id', '7F3A9C21'],
  ];

  it.each(written)('finds %s written to the log', (_label, text) => {
    const s = fresh();
    console.log('asha', text);
    expect(s.hits().map((h) => h.sink)).toContain('logs');
  });

  it.each(['log', 'info', 'warn', 'error', 'debug'] as const)('finds a canary in console.%s', (m) => {
    const s = fresh();
    console[m](`asha ${CANARY.city}`);
    expect(s.hits().some((h) => h.sink === 'logs')).toBe(true);
  });

  it('finds a canary written straight to stdout or stderr', () => {
    const s = fresh();
    process.stderr.write(`asha ${CANARY.assetId}\n`);
    expect(s.hits().some((h) => h.sink === 'logs')).toBe(true);
    s.restore();
    const t = fresh();
    process.stdout.write(`asha ${CANARY.path}\n`);
    expect(t.hits().some((h) => h.sink === 'logs')).toBe(true);
  });

  it('finds a canary in a log line made from an error (message, stack, cause and own properties)', () => {
    const s = fresh();
    console.error(nativeErrorWithCanary());
    expect(s.hits().length).toBeGreaterThan(0);
    expect(new Set(s.hits().map((h) => h.sink))).toEqual(new Set(['logs']));
    const cause = new Error('outer', { cause: new Error(CANARY.city) });
    s.restore();
    const t = fresh();
    console.warn(cause);
    expect(t.hits().length).toBeGreaterThan(0);
  });

  it('finds a canary in a breadcrumb, a crash payload and an analytics queue entry', () => {
    const s = fresh();
    s.addBreadcrumb({ category: 'media', message: `kept ${CANARY.city}` });
    expect(s.hits().map((h) => h.sink)).toEqual(expect.arrayContaining(['breadcrumbs']));
    const t = fresh();
    t.buildCrashPayload(nativeErrorWithCanary());
    expect(new Set(t.hits().map((h) => h.sink))).toEqual(new Set(['crashPayloads']));
    const u = fresh();
    u.analytics.push({ event: 'error_shown', properties: { code: CANARY.assetId } });
    expect(new Set(u.hits().map((h) => h.sink))).toEqual(new Set(['analytics']));
  });

  it('finds a canary behind a cycle and in a nested object', () => {
    const s = fresh();
    const a: Record<string, unknown> = { deep: { deeper: [{ city: CANARY.city }] } };
    a.self = a;
    s.addBreadcrumb(a);
    expect(s.hits().length).toBeGreaterThan(0);
  });

  it('comes back empty on a clean run (negative control)', () => {
    const s = fresh();
    console.log('media_error', 'permission_denied');
    console.warn('letter saved', { words: 120 });
    s.addBreadcrumb({ category: 'media', message: 'cancelled' });
    s.buildCrashPayload(new MediaNativeError('timeout'));
    s.analytics.push({ event: 'error_shown', properties: { code: 'save_failed' } });
    expect(s.hits()).toEqual([]);
  });

  it('searches for at least 60 distinct strings, none shorter than 5 characters', () => {
    const n = needles();
    expect(new Set(n).size).toBe(n.length);
    expect(n.length).toBeGreaterThanOrEqual(60);
    expect(n.every((x) => x.length >= 5)).toBe(true);
  });

  it('mutation check: a boundary that logs the raw error is caught, the real one is not', () => {
    const leaky = (s: CanarySinks, err: unknown) => {
      console.warn('media failed', err);
      s.addBreadcrumb({ category: 'media', message: (err as Error).message });
      s.buildCrashPayload(err);
    };
    const s = fresh();
    leaky(s, nativeErrorWithCanary());
    expect(new Set(s.hits().map((h) => h.sink))).toEqual(new Set(['logs', 'breadcrumbs', 'crashPayloads']));
  });
});

describe('[NX-39-R30] a forced native error leaves no canary in any sink', () => {
  const errors = () => [nativeErrorWithCanary(), nativeErrorWithCanary({ code: 3072 }), nativeErrorWithCanary({ code: 3164 }), new Error(`${CANARY.path} ${CANARY.city}`), `${CANARY.assetId}`, { message: CANARY.city }];

  it('through the real boundary: log line, breadcrumb, crash payload and the real analytics client', async () => {
    const s = fresh();
    const provider = recordingProvider();
    const analytics = createAnalytics({ provider, storage: memoryStorage(), randomId: () => '00000000-0000-4000-8000-000000000001', flushIntervalMs: 0 });
    await analytics.init();
    await analytics.grant();
    for (const err of errors()) {
      let wrapped: MediaNativeError | null = null;
      try {
        try {
          throw err;
        } catch (e) {
          throw new MediaNativeError(toNativeErrorCode(e));
        }
      } catch (out) {
        wrapped = out as MediaNativeError;
      }
      console.warn('media_error', wrapped.code);
      s.addBreadcrumb({ category: 'media', message: wrapped.code });
      s.buildCrashPayload(wrapped);
      // The analytics client is handed the closed code as the one property it could carry, and then a hostile value.
      // @ts-expect-error not a catalogued code: the client must drop it, whatever it holds
      analytics.track('error_shown', { code: wrapped.code });
      // @ts-expect-error a canary smuggled into a property
      analytics.track('error_shown', { code: CANARY.city });
      // @ts-expect-error an unknown property
      analytics.track('error_shown', { code: 'save_failed', place: CANARY.cityKey });
    }
    await analytics.flush();
    s.analytics.push(...provider.captured());
    expect(provider.captured().every((e) => JSON.stringify(e).indexOf('Zzyzx') === -1)).toBe(true);
    expect(s.hits()).toEqual([]);
    expect(s.logs.length).toBe(errors().length);
  });

  it('and the same error with no boundary does leak (so the zero above means something)', () => {
    const s = fresh();
    console.warn('media_error', nativeErrorWithCanary());
    s.buildCrashPayload(nativeErrorWithCanary());
    expect(s.hits().length).toBeGreaterThan(0);
  });

  it('media code in the tree makes no console, breadcrumb or tracking call at all, and every catch goes through the boundary', () => {
    const { scanned, findings } = scanTree();
    expect(scanned.length).toBeGreaterThan(0);
    expect(findings.filter((f) => f.rule === 'catch-leak').map((f) => `${f.file}:${f.line}`)).toEqual([]);
    const calls: string[] = [];
    for (const file of scanned) {
      const text = readFileSync(join(__dirname, '..', file), 'utf8');
      calls.push(...loggingCalls(file, text));
    }
    expect(calls).toEqual([]);
    // Positive control for the call finder.
    expect(loggingCalls('x.ts', "console.log(1); logger.warn(2); Sentry.addBreadcrumb({}); track('error_shown', {}); analytics.track('x', {}); process.stderr.write('x');")).toHaveLength(6);
    expect(loggingCalls('x.ts', 'const a = items.map((i) => i.id); export const second = a[1];')).toEqual([]);
  });
});

/** Calls to console, a logger, a breadcrumb API, tracking or a stream write, by name. */
function loggingCalls(file: string, text: string): string[] {
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const out: string[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isCallExpression(n)) {
      const callee = n.expression.getText(sf);
      if (/^(?:console|logger|log|Sentry)\b/.test(callee) || /\b(?:addBreadcrumb|captureException|captureMessage|track\w*|stdout\.write|stderr\.write)$/.test(callee) || /^track\w*$/.test(callee)) {
        out.push(`${file}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1} ${callee}`);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

describe('[NX-39-R30] the canary is a gate for P2b and P2c', () => {
  const eas = JSON.parse(readFileSync(join(__dirname, '..', 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };

  it('lists the six stages, with only the forced native error built today', () => {
    expect(CANARY_STAGES.map((s) => s.name)).toEqual(['scan', 'index', 'attach', 'export', 'erase', 'forced_native_error']);
    expect(CANARY_STAGES.filter((s) => s.implemented).map((s) => s.name)).toEqual(['forced_native_error']);
    for (const s of CANARY_STAGES) expect(s.builtBy.trim(), s.name).not.toBe('');
  });

  it('keeps moments and the background top-up off in every build profile while a stage is pending', () => {
    expect(canaryGateViolations(eas.build)).toEqual([]);
  });

  it('positive control: the gate fails when a profile turns either switch on with a stage pending, and not once all are built', () => {
    const profiles = { production: { env: { EXPO_PUBLIC_MOMENTS: 'on' } }, testflight: { env: { EXPO_PUBLIC_MOMENTS_BACKGROUND: ' ON ' } }, preview: { env: { EXPO_PUBLIC_MOMENTS: 'off' } } };
    expect(canaryGateViolations(profiles)).toHaveLength(2);
    expect(canaryGateViolations(profiles).join('\n')).toMatch(/production: EXPO_PUBLIC_MOMENTS is on/);
    const allBuilt = CANARY_STAGES.map((s) => ({ ...s, implemented: true }));
    expect(canaryGateViolations(profiles, allBuilt)).toEqual([]);
  });
});
