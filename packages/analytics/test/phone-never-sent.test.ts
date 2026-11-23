/**
 * [NS-54-R26] [BL-1901] A phone number never reaches analytics, a violation report, a thrown message, a console
 * line or a crash event. Written before the first line of phone code (BL-1902) so the rule exists first.
 *
 * Fictional numbers only, from ranges set aside for drama and examples: US 555-01XX, UK 07700 900XXX. The six-digit
 * "code" is invented too. A fake send flow carries them through every path; nothing may find them on the wire.
 * Positive controls (planted leaks) must turn the scan red, so a scan that cannot see is caught.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAnalytics, EVENTS, isPiiLike, posthogBeforeSend, reduceExceptionEvent, recordingProvider, sanitizeEvent } from '../src';

const E164 = ['+12025550147', '+447700900123'];
const SPACED = ['+1 202 555 0147', '(202) 555-0147', '+44 7700 900123', '07700 900123'];
const PARTIAL = ['+44', '+1 202', '+44 7700', '7700 900', '0147', '0123', '***47'];
const CODE = '428913';
const PLANTS = [...E164, ...SPACED, ...PARTIAL, CODE];
/** What a scan looks for in anything that left the app. Raw forms and digits-only forms of each full number. */
const FRAGMENTS = ['12025550147', '447700900123', '2025550147', '7700900123', '7700 900', '202 555', '202) 555', '555 0147', '555-0147', '900123', '0147', '+44', CODE];
const squash = (s: string) => s.replace(/[^\d+]/g, '');
const found = (text: string) => FRAGMENTS.filter((f) => text.includes(f) || squash(text).includes(squash(f)));

const validProps = (name: keyof typeof EVENTS): Record<string, string | number | boolean> => {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, p] of Object.entries(EVENTS[name].props) as [string, { type: string; values?: string[]; min?: number; optional?: boolean }][]) {
    if (!p.optional) out[k] = p.type === 'enum' ? p.values![0] : p.type === 'bool' ? true : p.min!;
  }
  return out;
};
const names = Object.keys(EVENTS) as (keyof typeof EVENTS)[];

/** The fake send flow: a number is typed, a code is requested, it fails and is retried. Every step tries to carry it. */
async function fakeSendFlow(analytics: ReturnType<typeof createAnalytics>, trace: unknown[], leak?: (n: string) => void) {
  for (const n of PLANTS) {
    leak?.(n);
    for (const name of names) {
      const v = validProps(name);
      trace.push(analytics.track(name, v as never));
      for (const k of Object.keys(v)) trace.push(analytics.track(name, { ...v, [k]: n } as never));
      trace.push(analytics.track(name, { ...v, phone: n, number: n, [`p${n.replace(/\W/g, '')}`]: true } as never));
      trace.push(sanitizeEvent(name, { ...v, phone: n }));
      trace.push(analytics.track(n as never, v as never));
    }
    const hook = posthogBeforeSend((x) => trace.push(x));
    trace.push(hook({ event: 'screen_viewed', properties: { $current_url: `app://verify-phone?number=${n}`, $screen_name: n, $set: { phone: n }, $set_once: { phone: n }, phone: n } }));
  }
}

async function sweep(leak?: (n: string) => void, consent = true) {
  const logs: string[] = [];
  const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
    vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void logs.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '))));
  const provider = recordingProvider();
  const trace: unknown[] = [];
  const reports: unknown[] = [];
  const analytics = createAnalytics({ provider, randomId: () => 'anon-phone-id', flushIntervalMs: 0, onViolation: (v) => reports.push(v) });
  try {
    await analytics.init();
    if (consent) await analytics.grant();
    await fakeSendFlow(analytics, trace, leak);
    await analytics.flush();
  } finally { spies.forEach((s) => s.mockRestore()); }
  const wire = provider.captured();
  const text = JSON.stringify({ calls: provider.calls, trace, reports, counts: analytics.violationCounts(), logs });
  return { wire, text, logs, hits: found(text), shaped: wire.flatMap((e) => Object.values(e.properties).filter((v) => typeof v === 'string' && isPiiLike(v))) };
}

afterEach(() => vi.restoreAllMocks());

describe('[NS-54-R26] the phone number never reaches analytics', () => {
  it('[NS-54-R26] a number, a partial number and a code planted in every property, key, event name and SDK field reach nothing', async () => {
    const r = await sweep();
    expect(r.wire.length, 'the sweep must exercise real captures, not an empty run').toBeGreaterThan(100);
    expect(r.hits).toEqual([]);
    expect(r.shaped).toEqual([]);
    expect(r.text).not.toContain('$set');
  });

  it('[NS-54-R26] with no consent nothing is captured, queued or logged, whatever is planted', async () => {
    const r = await sweep(undefined, false);
    expect(r.wire).toEqual([]);
    expect(r.hits).toEqual([]);
  });

  it('[NS-54-R26] the allowlist drops an event for a full number in an unlisted property, and names no value', () => {
    for (const n of [...E164, ...SPACED]) {
      const r = sanitizeEvent('book_opened', { ...validProps('book_opened'), phone: n });
      expect(r.props, n).toBeNull();
      expect(r.violations.map((v) => v.kind)).toEqual(['pii_like_value']);
      expect(found(JSON.stringify(r))).toEqual([]);
    }
  });

  it('[NS-54-R26] a partial number or a code as an unlisted property is dropped as unknown, never sent', () => {
    for (const n of [...PARTIAL, CODE]) {
      const r = sanitizeEvent('book_opened', { ...validProps('book_opened'), phone: n });
      expect(r.props ?? {}, n).not.toHaveProperty('phone');
      expect(found(JSON.stringify(r))).toEqual([]);
    }
  });

  it('[NS-54-R26] no event in the catalogue has a free-text property that could carry a number', () => {
    for (const name of names) {
      for (const [k, p] of Object.entries(EVENTS[name].props) as [string, { type: string; values?: string[] }][]) {
        expect(['enum', 'int', 'bool'], `${name}.${k}`).toContain(p.type);
        for (const v of p.values ?? []) expect(isPiiLike(v) || /^\+?\d{4,}$/.test(v), `${name}.${k}=${v}`).toBe(false);
      }
    }
  });

  it('[NS-54-R26] positive control: a tracker that writes the number to the console turns the scan red', async () => {
    const r = await sweep((n) => console.warn('code sent to', n));
    expect(r.hits).toEqual(expect.arrayContaining(['12025550147', '7700 900', CODE]));
  });

  it('[NS-54-R26] positive control: a send that hands the number to the provider around the validator turns the scan red', async () => {
    const provider = recordingProvider();
    provider.capture('code_sent', { to: E164[0] });
    expect(found(JSON.stringify(provider.captured()))).toContain('12025550147');
  });

  it('[NS-54-R26] positive control: a violation report that echoes the value turns the scan red', () => {
    expect(found(JSON.stringify({ kind: 'pii_like_value', event: 'book_opened', property: SPACED[0] }))).toContain('202 555');
  });
});

/** A crash event as the SDK builds it: the message, the stack and the caller's own properties all try to carry the number. */
const crashWith = (n: string) => {
  // Code identifiers and file names come from our build, not from data: a bare four-digit tail as a function name is not a leak path.
  const id = [...E164, ...SPACED].includes(n) ? n : 'x';
  return {
  event: '$exception',
  properties: {
    distinct_id: 'anon-phone-id',
    $app_version: '1.0.0',
    $exception_level: 'error',
    $exception_message: `could not send a code to ${n}`,
    $exception_values: [`bad number ${n}`],
    $exception_steps: [{ message: `verify ${n}` }],
    phone: n,
    $current_url: `app://verify-phone?number=${n}`,
    $exception_list: [{
      type: `PhoneError${n}`,
      value: `could not send a code to ${n}`,
      mechanism: { handled: false, type: 'onerror', synthetic: false },
      stacktrace: { type: 'raw', frames: [
        { platform: 'hermes', filename: `/data/user/0/verify/${id}/app.bundle`, function: `sendTo${id}`, lineno: 3, colno: 4, in_app: true, context_line: n, vars: { phone: n } },
        { platform: 'hermes', filename: `${id}.js`, function: id, lineno: 9, colno: 1, in_app: true },
      ] },
    }],
  },
  };
};

describe('[NS-54-R26] the phone number never reaches a crash event', () => {
  const sdk = ['$app_version', '$exception_level', '$exception_list'];
  it('[NS-54-R26] a number in the message, class name, path, function name, vars or a caller property is gone from the reduced event', () => {
    for (const n of PLANTS) {
      const out = reduceExceptionEvent(crashWith(n), sdk);
      expect(out, n).not.toBeNull();
      expect(found(JSON.stringify(out)), n).toEqual([]);
    }
  });

  it('[NS-54-R26] positive control: an event passed through untouched turns the scan red', () => {
    expect(found(JSON.stringify(crashWith(E164[0])))).toContain('12025550147');
  });
});
