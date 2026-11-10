/// <reference types="node" />
/**
 * The log canary harness (NX-39 v2 R30, R50; OBS-R10; LEGAL-REQ-014; BL-862).
 *
 * A fake city, asset id, date and file path that appear nowhere in the product, fed through the media pipeline; then
 * every place a person's data must never reach is searched for them: logs (console and stdout/stderr), breadcrumbs,
 * crash payloads and the analytics queue. Any hit fails. A hit is found in the value as written and in the ways code
 * commonly rewrites a string (lower case, URL-encoded, JSON-escaped, base64, a date reformatted), so "we never log it"
 * cannot pass by logging it differently.
 *
 * What is real here and what is a stand-in, said plainly:
 *  - console, process.stdout and process.stderr are the real ones, hooked;
 *  - the analytics queue is the real @scribe/analytics client with a recording provider (see log-canary.test.ts);
 *  - the app has no breadcrumb API and no crash reporter yet (Sentry is not installed, opt-in crash reporting is not
 *    built), so `breadcrumbs` and `crashPayloads` are sinks the test hands to the code under test as stand-ins. When
 *    a reporter lands, its scrubber is wired into `buildCrashPayload` and the same scan runs on it.
 * Fixtures use the fictional family "Asha"; the values are made up and unique so no other string can match by chance.
 */
import { vi } from 'vitest';

export const CANARY = {
  city: 'Zzyzx Canary Falls',
  cityKey: 'zzyzx-canary-falls',
  assetId: 'ASHA-CANARY-7F3A9C21-5B4D/L0/001',
  /** An instant in a year no fixture uses. */
  instant: '2031-07-19T04:23:17.000Z',
  path: 'file:///var/mobile/Containers/Data/Application/ASHA-CANARY-0042/tmp/asha-canary-0042.heic',
} as const;

const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64').replace(/=+$/, '');

/** Every string a hit may take: each canary value as written and rewritten. Distinctive fragments are included. */
export function needles(): string[] {
  const d = new Date(CANARY.instant);
  const values = [
    CANARY.city,
    CANARY.cityKey,
    CANARY.assetId,
    CANARY.instant,
    CANARY.path,
    'Zzyzx',
    'ASHA-CANARY',
    '7F3A9C21',
    '2031-07-19',
    String(d.getTime()),
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
    d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }),
    '07/19/2031',
    '19/07/2031',
    'asha-canary-0042.heic',
  ];
  const out = new Set<string>();
  for (const v of values) {
    out.add(v);
    out.add(v.toLowerCase());
    out.add(encodeURIComponent(v));
    out.add(JSON.stringify(v).slice(1, -1));
    out.add(b64(v));
    out.add(Buffer.from(v, 'utf8').toString('hex'));
  }
  // Base64 shifts with alignment: also look for it at all three offsets, so a canary glued to other text is still found.
  for (const v of values) for (const pad of ['a', 'ab']) out.add(b64(pad + v).slice(4));
  return [...out].filter((n) => n.length >= 5);
}

export type Hit = { sink: 'logs' | 'breadcrumbs' | 'crashPayloads' | 'analytics'; needle: string };

export class CanarySinks {
  readonly logs: string[] = [];
  readonly breadcrumbs: unknown[] = [];
  readonly crashPayloads: string[] = [];
  readonly analytics: unknown[] = [];
  private restores: (() => void)[] = [];

  /** Hook console, stdout and stderr. Call `restore()` in afterEach. */
  install(): this {
    for (const m of ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const) {
      const spy = vi.spyOn(console, m).mockImplementation((...args: unknown[]) => {
        this.logs.push(args.map((a) => stringify(a)).join(' '));
      });
      this.restores.push(() => spy.mockRestore());
    }
    for (const stream of [process.stdout, process.stderr]) {
      const spy = vi.spyOn(stream, 'write').mockImplementation(((chunk: unknown) => {
        this.logs.push(stringify(chunk));
        return true;
      }) as typeof stream.write);
      this.restores.push(() => spy.mockRestore());
    }
    return this;
  }

  restore(): void {
    for (const r of this.restores.splice(0)) r();
  }

  /** The stand-in for a crash reporter's breadcrumb call. */
  addBreadcrumb(crumb: unknown): void {
    this.breadcrumbs.push(crumb);
  }

  /**
   * The stand-in for what a crash reporter would send for an error: name, message, stack, own properties and cause,
   * all serialised. This is deliberately the worst case: nothing scrubbed.
   */
  buildCrashPayload(error: unknown): string {
    const payload = stringify(error);
    this.crashPayloads.push(payload);
    return payload;
  }

  /** Everything every sink holds, found against every needle. */
  hits(): Hit[] {
    const out: Hit[] = [];
    const sinks: [Hit['sink'], string][] = [
      ['logs', this.logs.join('\n')],
      ['breadcrumbs', this.breadcrumbs.map((b) => stringify(b)).join('\n')],
      ['crashPayloads', this.crashPayloads.join('\n')],
      ['analytics', this.analytics.map((a) => stringify(a)).join('\n')],
    ];
    for (const [sink, text] of sinks) for (const needle of needles()) if (text.includes(needle)) out.push({ sink, needle });
    return out;
  }
}

/** A string for anything: errors with every own property, cause and stack; objects, arrays, maps and sets walked; cycles cut. */
export function stringify(value: unknown, seen = new WeakSet<object>()): string {
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) return Buffer.from(value).toString('utf8');
  if (value === null || typeof value !== 'object') return String(value);
  if (seen.has(value)) return '[cycle]';
  seen.add(value);
  if (value instanceof Error) {
    const own = Object.getOwnPropertyNames(value).map((k) => `${k}=${stringify((value as unknown as Record<string, unknown>)[k], seen)}`);
    return `${value.name}: ${value.message}\n${own.join('\n')}`;
  }
  if (Array.isArray(value)) return `[${value.map((v) => stringify(v, seen)).join(',')}]`;
  if (value instanceof Map) return `Map{${[...value].map(([k, v]) => `${stringify(k, seen)}=>${stringify(v, seen)}`).join(',')}}`;
  if (value instanceof Set) return `Set{${[...value].map((v) => stringify(v, seen)).join(',')}}`;
  return `{${Reflect.ownKeys(value).map((k) => `${String(k)}:${stringify((value as Record<PropertyKey, unknown>)[k], seen)}`).join(',')}}`;
}

/**
 * A native error as the platform would raise it, with the canary in every place text can sit: message, stack,
 * `userInfo`, `cause`, a URL and a nested error. This is the forced error of the pipeline (NX-39 R30).
 */
export function nativeErrorWithCanary(over: { name?: string; code?: string | number; domain?: string } = {}): Error {
  const text = `The operation couldn't be completed. (PHPhotosErrorDomain error 3300.) ${CANARY.path} id ${CANARY.assetId} taken ${CANARY.instant} in ${CANARY.city}`;
  const cause = new Error(`inner ${CANARY.city} ${CANARY.assetId}`);
  return Object.assign(new Error(text, { cause }), {
    name: over.name ?? 'NSError',
    code: over.code ?? 3300,
    domain: over.domain ?? 'PHPhotosErrorDomain',
    userInfo: { NSFilePath: CANARY.path, PHLocalIdentifier: CANARY.assetId, NSLocalizedDescription: text },
    url: `https://example.invalid/?p=${encodeURIComponent(CANARY.path)}`,
    nested: { city: CANARY.city, when: CANARY.instant },
  });
}

/**
 * The stages of the canary run (NX-39 R30): a fixture library with the canary values goes through each and every sink
 * is searched. A stage is `implemented` when the code it exercises exists. None of scan, index, attach, export and erase
 * exists yet (no media code is built), so they are pending, and the gate below keeps P2b and P2c off until they pass.
 */
export const CANARY_STAGES: readonly { name: string; implemented: boolean; builtBy: string }[] = [
  { name: 'scan', implemented: false, builtBy: 'BL-874 / BL-853' },
  { name: 'index', implemented: false, builtBy: 'BL-877' },
  { name: 'attach', implemented: false, builtBy: 'BL-847 / BL-848' },
  { name: 'export', implemented: false, builtBy: 'BL-868' },
  { name: 'erase', implemented: false, builtBy: 'BL-847 / BL-877' },
  { name: 'forced_native_error', implemented: true, builtBy: 'BL-862 (lib/media/native-error.ts)' },
];

/** The eas.json variables that switch on P2b (moments) and P2c (the background top-up): both are gated by the canary (R30). */
export const CANARY_GATED_SWITCHES = ['EXPO_PUBLIC_MOMENTS', 'EXPO_PUBLIC_MOMENTS_BACKGROUND'] as const;

/** The profiles that turn a gated switch on while a canary stage is still pending: each is a failure. */
export function canaryGateViolations(
  profiles: Record<string, { env?: Record<string, string> }>,
  stages: readonly { name: string; implemented: boolean }[] = CANARY_STAGES,
): string[] {
  const pending = stages.filter((s) => !s.implemented).map((s) => s.name);
  if (pending.length === 0) return [];
  return Object.entries(profiles).flatMap(([profile, p]) =>
    CANARY_GATED_SWITCHES.filter((v) => (p.env?.[v] ?? '').trim().toLowerCase() === 'on').map((v) => `${profile}: ${v} is on while the canary stages ${pending.join(', ')} are pending`),
  );
}
