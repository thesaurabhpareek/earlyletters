/**
 * J-N18 canary sweep (risk 12 in docs/qa/test-plan-b13/00-MASTER-TEST-PLAN.md, cases A04, A09, A11, A12, C33
 * in file 04). A planted fictional-family canary (Asha: a name, a letter sentence, an address, plus the day,
 * suggestion, album and file canaries of NS-47, NS-49, NS-51, NS-52) goes into every tracker and observer on
 * develop, the validator, the SDK hook and both PostHog adapters. Nothing it plants may appear in what is
 * captured, in a violation report, in a thrown message or in a console line.
 *
 * Blocked on develop (nothing to call): a crash reporter (no Sentry code in packages/analytics), and the
 * NS-49, NS-51 and NS-52 modules themselves. Their analytics slice (the canary as a value of any property) is
 * covered here; their screens are not.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as pkg from '../src';
import {
  createAnalytics, createLazyPostHogAdapter, createLifecycle, createPostHogAdapter, createTrackers, EVENTS, isPiiLike,
  LIFECYCLE_KEYS, memoryStorage, notificationOpenedEvent, posthogBeforeSend, recordingProvider, sanitizeEvent,
  trackNotificationOpened, type Analytics, type RecordingProvider,
} from '../src';

const C = {
  name: 'Asha Zzcanaryfirst', sentence: 'Asha said moon at the Larkspur kitchen window', address: '42 Larkspur Lane Springfield',
  tradition: 'zz-test-tradition', day: 'zz-test-day', suggestion: 'zz-test-suggestion-title', place: 'zz-test-place',
  workout: 'zz-test-workout', album: 'zz-test-album', asset: 'zz-test-asset-id', date: '2031-07-19', file: 'zz-test-file.m4a',
};
const S: string[] = Object.values(C);
const NUMS = [7351924, 48213, 81234567]; // a number, a duration, a byte size
const GROUPS: Record<string, string[]> = {
  'J-N18': ['asha', 'zzcanary', 'larkspur', '7351924'],
  'NS-47-R8': ['zz-test-tradition', 'zz-test-day'],
  'NS-49-R24': ['zz-test-suggestion', 'zz-test-place', 'zz-test-workout'],
  'NS-51-R28': ['zz-test-album', 'zz-test-asset', '2031-07-19'],
  'NS-52-R44': ['zz-test-file', '48213', '81234567'],
};
const ALL = [...new Set(Object.values(GROUPS).flat())];

interface Ctx { analytics: Analytics; provider: RecordingProvider; trace: unknown[] }
type Path = (c: Ctx) => void | Promise<void>;
type TrackerSet = Record<string, (i: never) => unknown>;
const E = (ev: keyof typeof EVENTS, p: string): string => {
  const s = (EVENTS[ev].props as Record<string, { values?: string[] }>)[p];
  return s.values![0];
};

/** One valid input per tracker; the sweep replaces one leaf at a time with each canary. */
const VALID: Record<string, unknown> = {
  trackLetterSaved: { mode: 'spoken', inBook: true, childIndex: 0, role: 'parent', promptKind: null, audioMs: 4000, wordCount: 30, machineEdits: 1, editsReverted: 0, editsRejected: 0, engine: E('letter_saved', 'engine'), fromNotificationWithin2h: false },
  trackCaptureStarted: { mode: 'typed', source: E('capture_started', 'source'), promptKind: null, childIndex: 0, role: 'parent' },
  trackMomentsCard: { action: 'tapped', slot: E('book:moments_card_open', 'slot') },
  trackCaptureDiscarded: { mode: 'spoken', stage: 'review', audioMs: 4000 },
  trackTranscriptionCompleted: { engine: E('transcription_completed', 'engine'), modelId: null, audioMs: 4000, latencyMs: 900, outcome: E('transcription_completed', 'outcome') },
  trackReadTogetherStarted: { childIndex: 0, access: 'free', letters: 3 },
  trackReadTogetherEnded: { reason: 'finished', durationMs: 60000, lettersHeard: 2 },
  trackInviteCreated: { role: 'parent', channel: E('family:invite_create', 'channel'), shared: true, childIndex: 0 },
  trackInviteAccepted: { role: 'parent' },
  trackExportStarted: { letters: 3 },
  trackExportCompleted: { bytes: 5000000, durationMs: 9000 },
  trackExportFailed: { reason: E('keeping:export_fail', 'reason') },
  trackReminderSchedule: { enabled: true, cadence: 'weekly', hour: 20, paused: false },
  trackMachineEditsRejected: [{ edit: { type: E('machine_edit_rejected', 'edit_type'), source: E('machine_edit_rejected', 'source') }, reason: E('machine_edit_rejected', 'reason') }],
  trackAnalyticsOptedIn: { surface: 'settings', now: 2e12, firstLaunchAt: 1e12, firstLetterAt: 1.5e12, firstLetterMode: 'typed', letters: 3, signedIn: true, role: 'parent', cameFromInvite: false },
  trackLanguageSet: { lang: 'pt', action: 'added' },
  trackPackDownload: { packId: 'text-rules.pt', version: 2, stage: 'started', network: E('system:pack_download_update', 'network') },
};

function leafVariants(v: unknown): unknown[] {
  if (typeof v === 'string') return S;
  if (typeof v === 'number') return NUMS;
  if (Array.isArray(v)) return v.flatMap((x, i) => leafVariants(x).map((y) => v.map((z, j) => (j === i ? y : z))));
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => leafVariants(x).map((y) => ({ ...v, [k]: y })));
  return [];
}

function exerciseTrackers(c: Ctx, make: (c: Ctx) => TrackerSet = (x) => createTrackers(x.analytics) as unknown as TrackerSet) {
  const t = make(c);
  for (const [name, valid] of Object.entries(VALID)) {
    for (const input of [valid, ...leafVariants(valid)]) {
      try { c.trace.push(t[name](input as never)); } catch (e) { c.trace.push(String((e as Error).message)); }
    }
  }
}

/** A valid property set for one event: first enum value, true, the minimum. */
function validProps(name: keyof typeof EVENTS): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, p] of Object.entries(EVENTS[name].props) as [string, { type: string; values?: string[]; min?: number; optional?: boolean }][]) {
    if (!p.optional) out[k] = p.type === 'enum' ? p.values![0] : p.type === 'bool' ? true : p.min!;
  }
  return out;
}

const names = Object.keys(EVENTS) as (keyof typeof EVENTS)[];

const REAL: Path[] = [
  (c) => exerciseTrackers(c),
  (c) => { // direct track(): canary as every property value, as a key, and as the event name
    for (const n of names) {
      const v = validProps(n);
      c.trace.push(c.analytics.track(n, v as never));
      for (const k of Object.keys(v)) for (const x of [...S, ...NUMS]) c.trace.push(c.analytics.track(n, { ...v, [k]: x } as never));
      for (const x of S) {
        c.trace.push(c.analytics.track(n, { ...v, [x]: true } as never), c.analytics.track(x as never, v as never));
        c.trace.push(sanitizeEvent(n, { ...v, [x]: C.name }), sanitizeEvent(x, v));
      }
      const hook = posthogBeforeSend((x) => c.trace.push(x));
      c.trace.push(hook({ event: n, properties: { ...v, $set: { name: C.name }, $device_name: `${C.name}'s iPhone`, $locale: C.address, note: C.sentence, [C.tradition]: 1 }, $set: { n: C.name }, $set_once: { n: C.name } }));
    }
  },
  (c) => {
    const see = pkg.createAuthObserver(c.analytics, { hasLocalLetters: () => true, onUnder18: () => c.trace.push('under18') });
    for (const x of S) {
      for (const s of [{ status: 'signingIn', method: x }, { status: 'awaitingCode', sentAt: 1 }, { status: 'awaitingCode', sentAt: 1, error: x }, { status: 'signedOut', error: x }, { status: 'checkingConsent', method: x }, { status: 'ready' }, { status: 'signingOut', reason: x }, { status: 'signedOut' }]) see(s as never);
    }
  },
  (c) => {
    const see = pkg.createLanguageObserver(c.analytics);
    see(['en']);
    for (const x of S) { see(['en', x]); see([x, 'en']); see(['en']); }
  },
  (c) => {
    for (const x of S) {
      const see = pkg.createPackObserver(c.analytics, () => x as never);
      for (const phase of ['downloading', 'failed', 'installed', 'removed']) see({ id: x, version: 7351924, phase, failure: x } as never);
    }
  },
  (c) => {
    const see = pkg.createPlanObserver(c.analytics);
    see({ state: E('plus:plan_update', 'to_state'), period: null, ownership: null, environment: 'production', checked: true } as never);
    for (const x of S) { see({ state: x, period: x, ownership: x, environment: 'production', checked: true } as never); see({ state: E('plus:plan_update', 'to_state'), period: null, ownership: null, environment: 'production', checked: true } as never); }
  },
  (c) => {
    const see = pkg.createReminderObserver(c.analytics);
    see({ enabled: true, paused: false, cadence: 'weekly', time: { hour: 20, minute: 0 } });
    for (const x of S) { see({ enabled: true, paused: false, cadence: x, time: { hour: 7351924, minute: 48213 } } as never); see({ enabled: true, paused: false, cadence: 'weekly', time: { hour: 20, minute: 0 } }); }
  },
  (c) => {
    for (const x of S) for (const d of [{ kind: 'evening', variant: x, title: x, body: x }, { kind: x, variant: 7351924 }, { kind: 'evening', variant: 7351924, userInfo: { name: x } }, x]) {
      c.trace.push(notificationOpenedEvent(d), trackNotificationOpened(c.analytics, d));
    }
  },
  async (c) => {
    for (const x of S) {
      const lc = createLifecycle({ analytics: c.analytics, storage: memoryStorage({ [LIFECYCLE_KEYS.firstLaunchAt]: x, [LIFECYCLE_KEYS.lastActiveAt]: x }), now: () => 7351924 });
      await lc.launch({ ttfiMs: 7351924, source: x as never });
      await lc.foreground(x as never);
      await lc.background();
    }
  },
  async (c) => { // through the PostHog adapters; the SDK stand-in sees exactly what the SDK would
    const ph = { optIn: () => {}, optOut: () => {}, identify: () => {}, flush: () => {}, reset: () => {}, capture: (e: string, p: unknown) => void c.trace.push({ e, p }) };
    for (const provider of [createPostHogAdapter(ph), createLazyPostHogAdapter({ create: () => ph, onError: (...a) => c.trace.push(a) }), createLazyPostHogAdapter({ create: () => { throw new Error(C.name); }, onError: (...a) => c.trace.push(a) })]) {
      const a = createAnalytics({ provider, randomId: () => 'anon-adapter-id', flushIntervalMs: 0, onViolation: (v) => c.trace.push(v) });
      await a.init(); await a.grant();
      exerciseTrackers({ ...c, analytics: a });
      await a.flush();
    }
  },
];

async function sweep(paths: Path[], consent = true) {
  const logs: string[] = [];
  const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) => vi.spyOn(console, m).mockImplementation((...a: unknown[]) => void logs.push(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '))));
  const provider = recordingProvider();
  const trace: unknown[] = [];
  const reports: unknown[] = [];
  const analytics = createAnalytics({ provider, randomId: () => 'anon-sweep-id', flushIntervalMs: 0, onViolation: (v) => reports.push(v) });
  try {
    await analytics.init();
    if (consent) await analytics.grant();
    for (const p of paths) await p({ analytics, provider, trace });
    await analytics.flush();
  } finally { spies.forEach((s) => s.mockRestore()); }
  const wire = provider.captured();
  const text = JSON.stringify({ calls: provider.calls, trace, reports, counts: analytics.violationCounts(), logs }).toLowerCase();
  const shaped = wire.flatMap((e) => Object.values(e.properties).filter((v) => typeof v === 'string' && isPiiLike(v)));
  return { text, wire, shaped, queue: analytics.queueLength(), hits: (frags: string[]) => frags.filter((f) => text.includes(f)) };
}

afterEach(() => vi.restoreAllMocks());

describe('canary sweep (J-N18)', () => {
  it('[J-N18] the sweep covers every tracker, every observer and the lifecycle on develop', () => {
    expect(Object.keys(createTrackers({ track: () => 'queued' })).sort()).toEqual(Object.keys(VALID).sort());
    expect(Object.keys(pkg).filter((k) => /^create\w*Observer$/.test(k)).sort()).toEqual(['createAuthObserver', 'createLanguageObserver', 'createPackObserver', 'createPlanObserver', 'createReminderObserver']);
    expect(typeof pkg.createLifecycle).toBe('function');
  });

  it('[J-N18] the Asha canary reaches no analytics path: capture, reports, thrown messages, console, SDK payload', async () => {
    const r = await sweep(REAL);
    expect(r.wire.length, 'the sweep must exercise real captures, not an empty run').toBeGreaterThan(200);
    expect(r.hits(GROUPS['J-N18'])).toEqual([]);
    expect(r.shaped, 'nothing shaped like a UUID, email, date, URL or token on the wire').toEqual([]);
    expect(r.text).not.toContain('$set');
    expect(r.text).not.toContain("iphone");
  });

  for (const id of ['NS-47-R8', 'NS-49-R24', 'NS-51-R28', 'NS-52-R44']) {
    it(`[${id}] canary finds nothing (analytics slice)`, async () => {
      expect((await sweep(REAL)).hits(GROUPS[id])).toEqual([]);
    });
  }

  it('[J-N18] with no consent nothing is captured or queued, and nothing is logged, whatever is planted', async () => {
    const r = await sweep(REAL, false);
    expect(r.wire).toEqual([]);
    expect(r.queue).toBe(0);
    expect(r.hits(ALL)).toEqual([]);
  });

  it('[J-N18] positive control: a tracker that logs its input turns the sweep red', async () => {
    const leaky: Path = (c) => exerciseTrackers(c, (x) => { const t = createTrackers(x.analytics) as unknown as TrackerSet; return { ...t, trackLetterSaved: (i) => { console.warn('saved', JSON.stringify(i)); return t.trackLetterSaved(i); } }; });
    expect((await sweep([leaky])).hits(ALL)).toEqual(expect.arrayContaining(['asha', 'zz-test-tradition', '7351924']));
  });

  it('[J-N18] positive control: a tracker that writes to the provider around the validator turns the sweep red', async () => {
    const leaky: Path = (c) => exerciseTrackers(c, (x) => ({ ...(createTrackers(x.analytics) as unknown as TrackerSet), trackInviteAccepted: (i: never) => void x.provider.capture('family:invite_accept', { role: (i as { role: string }).role }) }));
    const r = await sweep([leaky]);
    expect(r.hits(ALL)).toEqual(expect.arrayContaining(['asha', 'zz-test-album', 'zz-test-file']));
  });

  it('[J-N18] positive control: a violation report that echoes a key turns the sweep red', async () => {
    const r = await sweep([(c) => void c.trace.push({ kind: 'unknown_property', event: 'letter_saved', property: C.name })]);
    expect(r.hits(ALL)).toContain('asha');
  });
});
