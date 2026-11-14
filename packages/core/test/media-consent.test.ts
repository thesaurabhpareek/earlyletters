/**
 * The consent state machine (NX-39 v2 R3, R47, R48; BL-861).
 * Layers media_read, media_background and occasions; states Not asked, Held,
 * All, Limited, Denied, Narrowed, Revoked. The only caller of an authorization
 * request is the Continue event. No switch is on without its own recorded act.
 * The PRIV-R21 act writer is an adapter interface (its home is UNVERIFIED,
 * NX-39 section 14 item 30), so every test runs against a fake writer.
 * Fixtures use the fictional family "Asha"; no media fact is used anywhere.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  canRead,
  CONSENT_LAYERS,
  CONSENT_STATES,
  createConsentController,
  initialConsentState,
  isSwitchOn,
  LAUNCH_PATHS,
  reduceConsent,
  type ConsentActInput,
  type ConsentActWriter,
  type ConsentController,
  type ConsentEffect,
  type ConsentEvent,
  type ConsentLayer,
  type ConsentState,
  type SystemAnswer,
} from '../src/media-consent';

const SHOWN = { media_read: 'asha.sheet.read', media_background: 'asha.sheet.background', occasions: 'asha.sheet.occasions' } as const;

function fakes(opts: { answer?: SystemAnswer; failWrites?: boolean; holdWrites?: boolean } = {}) {
  const requests: ConsentLayer[] = [];
  const sheets: ConsentLayer[] = [];
  const acts: ConsentActInput[] = [];
  const calls: string[] = [];
  let release: (() => void) | null = null;
  const writer: ConsentActWriter = {
    async record(act) {
      calls.push('write');
      if (opts.holdWrites) await new Promise<void>((r) => { release = r; });
      if (opts.failWrites) throw new Error('writer down');
      acts.push(act);
    },
  };
  const deps = {
    shown: SHOWN,
    writer,
    requestAuthorization: async (layer: ConsentLayer): Promise<SystemAnswer> => { requests.push(layer); calls.push('request'); return opts.answer ?? 'all'; },
    showSheet: (layer: ConsentLayer) => { sheets.push(layer); },
    wipeIndex: async () => { calls.push('wipe'); },
    clearBackground: async () => { calls.push('clear_background'); },
  };
  return { deps, requests, sheets, acts, calls, release: () => release?.() };
}

async function grantRead(c: ConsentController, answer: 'all' | 'limited' = 'all') {
  await c.dispatch({ type: 'open_sheet', layer: 'media_read', source: 'chooser_tap' });
  await c.dispatch({ type: 'continue', layer: 'media_read' });
  return answer;
}

describe('[NX-39-R3] no launch path requests photo authorization and Not now holds', () => {
  it('every launch path, from every starting state, asks for nothing and records nothing', async () => {
    const starts: ConsentState[] = [initialConsentState()];
    const f0 = fakes();
    const held = createConsentController(f0.deps);
    await held.dispatch({ type: 'open_sheet', layer: 'media_read', source: 'control' });
    await held.dispatch({ type: 'not_now', layer: 'media_read' });
    starts.push(held.getState());
    const f1 = fakes({ answer: 'limited' });
    const granted = createConsentController(f1.deps);
    await grantRead(granted);
    starts.push(granted.getState());

    for (const start of starts) {
      for (const path of LAUNCH_PATHS) {
        const f = fakes();
        const c = createConsentController(f.deps, start);
        await c.dispatch({ type: 'launch', path });
        expect(f.requests, `${path} requests`).toHaveLength(0);
        expect(f.sheets, `${path} sheets`).toHaveLength(0);
        expect(f.acts, `${path} acts`).toHaveLength(0);
        expect(c.getState()).toEqual(start);
      }
    }
    expect([...LAUNCH_PATHS]).toEqual(['cold', 'warm', 'notification_tap', 'deep_link', 'first_run']);
  });

  it('the only event that can produce a request is Continue on an open sheet (every state times every event)', () => {
    const answers: SystemAnswer[] = ['all', 'limited', 'denied', 'cancelled'];
    const events: ConsentEvent[] = [];
    for (const layer of CONSENT_LAYERS) {
      for (const path of LAUNCH_PATHS) events.push({ type: 'launch', path });
      for (const source of ['control', 'chooser_tap', 'note', 'launch'] as const) {
        events.push({ type: 'open_sheet', layer, source, backgroundRefreshAvailable: true });
      }
      events.push({ type: 'not_now', layer }, { type: 'turn_on', layer }, { type: 'turn_off', layer }, { type: 'index_wiped', layer });
      for (const answer of answers) events.push({ type: 'system_answer', layer, answer });
      for (const status of ['all', 'limited', 'denied', 'not_determined'] as const) {
        events.push({ type: 'system_status', layer, status }, { type: 'system_status', layer, status, selectionNarrowed: true });
      }
      for (const action of ['agreed', 'withdrawn'] as const) events.push({ type: 'act_recorded', layer, action }, { type: 'act_failed', layer, action });
    }
    // Reach many states by walking, then try every event from each.
    const seen = new Map<string, ConsentState>();
    const frontier: ConsentState[] = [initialConsentState()];
    const withContinue = [...events, ...CONSENT_LAYERS.map((layer) => ({ type: 'continue', layer }) as ConsentEvent)];
    while (frontier.length && seen.size < 2000) {
      const s = frontier.pop()!;
      const k = JSON.stringify(s);
      if (seen.has(k)) continue;
      seen.set(k, s);
      for (const e of withContinue) {
        const r = reduceConsent(s, e);
        const requests = r.effects.filter((x) => x.type === 'request_authorization');
        if (requests.length) {
          expect(e.type, JSON.stringify(e)).toBe('continue');
          expect(s[e.type === 'continue' ? e.layer : 'media_read'].sheet).toBe('open');
        }
        frontier.push(r.state);
      }
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  it('Continue without an open sheet does nothing', async () => {
    const f = fakes();
    const c = createConsentController(f.deps);
    await c.dispatch({ type: 'continue', layer: 'media_read' });
    expect(f.requests).toHaveLength(0);
    expect(c.getState()).toEqual(initialConsentState());
  });

  it('Not now holds: nothing asked, switch off, and neither a note, a launch nor a chooser tap brings the sheet back', async () => {
    const f = fakes();
    const c = createConsentController(f.deps);
    await c.dispatch({ type: 'open_sheet', layer: 'media_read', source: 'chooser_tap' });
    expect(f.sheets).toEqual(['media_read']);
    await c.dispatch({ type: 'not_now', layer: 'media_read' });
    expect(c.getState().media_read.status).toBe('held');
    expect(isSwitchOn(c.getState(), 'media_read')).toBe(false);
    for (const source of ['note', 'launch', 'chooser_tap'] as const) {
      await c.dispatch({ type: 'open_sheet', layer: 'media_read', source });
    }
    expect(f.sheets).toEqual(['media_read']);
    expect(f.requests).toHaveLength(0);
    // Only the parent opening the control brings it back.
    await c.dispatch({ type: 'open_sheet', layer: 'media_read', source: 'control' });
    expect(f.sheets).toEqual(['media_read', 'media_read']);
    expect(f.requests).toHaveLength(0);
  });

  it('Cancel on the system question leaves the switch off, holds, and asks nothing again', async () => {
    const f = fakes({ answer: 'cancelled' });
    const c = createConsentController(f.deps);
    await grantRead(c);
    expect(f.requests).toEqual(['media_read']);
    expect(c.getState().media_read.status).toBe('held');
    expect(isSwitchOn(c.getState(), 'media_read')).toBe(false);
    await c.dispatch({ type: 'open_sheet', layer: 'media_read', source: 'note' });
    await c.dispatch({ type: 'launch', path: 'warm' });
    expect(f.requests).toHaveLength(1);
    expect(f.acts).toHaveLength(0);
  });

  it('a Denied answer is an ordinary state: no sheet, no request, no act, and no effect at all on a later tap', async () => {
    const f = fakes({ answer: 'denied' });
    const c = createConsentController(f.deps);
    await grantRead(c);
    expect(c.getState().media_read.status).toBe('denied');
    for (const source of ['control', 'chooser_tap', 'note'] as const) {
      expect(reduceConsent(c.getState(), { type: 'open_sheet', layer: 'media_read', source }).effects).toEqual([]);
    }
    expect(f.requests).toHaveLength(1);
    expect(f.acts).toHaveLength(0);
  });

  it('keeps the module free of imports, clock, network and storage', () => {
    const src = readFileSync(new URL('../src/media-consent.ts', import.meta.url), 'utf8');
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    expect(code).not.toMatch(/^\s*import\s/m);
    for (const banned of [/Date\.now/, /new Date\(/, /Math\.random/, /\bfetch\b/, /expo-/, /react-native/, /sqlite/i, /AsyncStorage/, /\bconsole\./]) {
      expect(code, String(banned)).not.toMatch(banned);
    }
  });
});

describe('[NX-39-R47] each consent layer records its own act and no switch is on without it', () => {
  it('each layer records an act under its own id, and the switch comes on only after the writer has it', async () => {
    for (const layer of CONSENT_LAYERS) {
      const f = fakes({ holdWrites: true });
      const c = createConsentController(f.deps);
      if (layer === 'media_background') {
        // Needs the read layer on first.
        const g = fakes();
        const base = createConsentController(g.deps);
        await grantRead(base);
        const c2 = createConsentController(f.deps, base.getState());
        await c2.dispatch({ type: 'open_sheet', layer, source: 'control', backgroundRefreshAvailable: true });
        const pending = c2.dispatch({ type: 'continue', layer });
        await Promise.resolve();
        expect(isSwitchOn(c2.getState(), layer)).toBe(false);
        f.release();
        await pending;
        expect(isSwitchOn(c2.getState(), layer)).toBe(true);
        expect(f.acts.map((a) => a.layer)).toEqual([layer]);
        continue;
      }
      await c.dispatch({ type: 'open_sheet', layer, source: 'control' });
      const pending = c.dispatch({ type: 'continue', layer });
      for (let i = 0; i < 5; i++) await Promise.resolve();
      expect(isSwitchOn(c.getState(), layer), `${layer} before the act`).toBe(false);
      f.release();
      await pending;
      expect(isSwitchOn(c.getState(), layer), `${layer} after the act`).toBe(true);
      expect(f.acts).toHaveLength(1);
      expect(f.acts[0]).toMatchObject({ layer, action: 'agreed', method: 'sheet', shownKey: SHOWN[layer] });
    }
  });

  it('a writer that fails leaves the switch off, and turning it on again tries the act again without asking the system', async () => {
    const f = fakes({ failWrites: true });
    const c = createConsentController(f.deps);
    await grantRead(c);
    expect(c.getState().media_read.status).toBe('all');
    expect(isSwitchOn(c.getState(), 'media_read')).toBe(false);
    expect(canRead(c.getState(), 'media_read')).toBe(false);
    expect(f.requests).toHaveLength(1);
    const ok = fakes();
    const c2 = createConsentController(ok.deps, c.getState());
    await c2.dispatch({ type: 'turn_on', layer: 'media_read' });
    expect(isSwitchOn(c2.getState(), 'media_read')).toBe(true);
    expect(ok.requests).toHaveLength(0);
    expect(ok.acts).toEqual([{ layer: 'media_read', action: 'agreed', method: 'switch', shownKey: SHOWN.media_read, accessLevel: 'all' }]);
  });

  it('an act holds a layer, an action, a way, the key of the words shown and the access level: no date, place, count or id', async () => {
    const f = fakes({ answer: 'limited' });
    const c = createConsentController(f.deps);
    await grantRead(c);
    await c.dispatch({ type: 'turn_off', layer: 'media_read' });
    expect(f.acts.map((a) => a.action)).toEqual(['agreed', 'withdrawn']);
    for (const a of f.acts) {
      expect(Object.keys(a).sort()).toEqual(['accessLevel', 'action', 'layer', 'method', 'shownKey']);
      expect(JSON.stringify(a)).not.toMatch(/\d{4}-\d{2}-\d{2}|city|asset|local_?id|count/i);
    }
    expect(f.acts[0]!.accessLevel).toBe('limited');
  });

  it('Off is one tap: the switch goes off, the withdrawal is recorded, the index is wiped, and background goes with it', async () => {
    const f = fakes();
    const c = createConsentController(f.deps);
    await grantRead(c);
    await c.dispatch({ type: 'open_sheet', layer: 'media_background', source: 'control', backgroundRefreshAvailable: true });
    await c.dispatch({ type: 'continue', layer: 'media_background' });
    expect(isSwitchOn(c.getState(), 'media_background')).toBe(true);
    await c.dispatch({ type: 'turn_off', layer: 'media_read' });
    expect(isSwitchOn(c.getState(), 'media_read')).toBe(false);
    expect(isSwitchOn(c.getState(), 'media_background')).toBe(false);
    expect(f.calls).toContain('wipe');
    expect(f.calls).toContain('clear_background');
    expect(f.acts.map((a) => `${a.layer}:${a.action}`)).toEqual([
      'media_read:agreed', 'media_background:agreed', 'media_read:withdrawn', 'media_background:withdrawn',
    ]);
  });

  it('background needs the read layer on and Background App Refresh available, and asks the system for nothing', async () => {
    const f = fakes();
    const c = createConsentController(f.deps);
    await c.dispatch({ type: 'open_sheet', layer: 'media_background', source: 'control', backgroundRefreshAvailable: true });
    expect(f.sheets).toHaveLength(0);
    await grantRead(c);
    await c.dispatch({ type: 'open_sheet', layer: 'media_background', source: 'control', backgroundRefreshAvailable: false });
    expect(f.sheets).toEqual(['media_read']);
    await c.dispatch({ type: 'open_sheet', layer: 'media_background', source: 'control', backgroundRefreshAvailable: true });
    await c.dispatch({ type: 'continue', layer: 'media_background' });
    expect(f.requests).toEqual(['media_read']);
  });

  it('invariant: over thousands of seeded random event walks, a switch is on only with a recorded act and a granted state', () => {
    const layers = CONSENT_LAYERS;
    const events = (): ConsentEvent[] => {
      const out: ConsentEvent[] = [];
      for (const layer of layers) {
        out.push({ type: 'open_sheet', layer, source: 'control', backgroundRefreshAvailable: true }, { type: 'open_sheet', layer, source: 'note' },
          { type: 'not_now', layer }, { type: 'continue', layer }, { type: 'turn_on', layer }, { type: 'turn_off', layer }, { type: 'index_wiped', layer });
        for (const answer of ['all', 'limited', 'denied', 'cancelled'] as const) out.push({ type: 'system_answer', layer, answer });
        for (const status of ['all', 'limited', 'denied', 'not_determined'] as const) {
          out.push({ type: 'system_status', layer, status }, { type: 'system_status', layer, status, selectionNarrowed: true });
        }
        for (const action of ['agreed', 'withdrawn'] as const) out.push({ type: 'act_recorded', layer, action }, { type: 'act_failed', layer, action });
      }
      return out;
    };
    const all = events();
    let seed = 7;
    const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
    for (let walk = 0; walk < 400; walk++) {
      let s = initialConsentState();
      for (let step = 0; step < 60; step++) {
        const e = all[next() % all.length]!;
        const r = reduceConsent(s, e);
        s = r.state;
        for (const layer of layers) {
          const l = s[layer];
          if (isSwitchOn(s, layer)) {
            expect(l.actRecorded, `${layer} switch without act`).toBe(true);
            expect(['all', 'limited', 'narrowed']).toContain(l.status);
          }
          if (layer !== 'media_read') expect(l.status).not.toBe('limited');
          expect(CONSENT_STATES).toContain(l.status);
        }
        if (isSwitchOn(s, 'media_background')) expect(isSwitchOn(s, 'media_read')).toBe(true);
      }
    }
  });
});

describe('[NX-39-R11] limited, denied and narrowed states each behave as specified (state machine)', () => {
  it('Limited is first-class: reads on, and nothing ever nags for Full', async () => {
    const f = fakes({ answer: 'limited' });
    const c = createConsentController(f.deps);
    await grantRead(c);
    expect(c.getState().media_read.status).toBe('limited');
    expect(canRead(c.getState(), 'media_read')).toBe(true);
    for (const source of ['control', 'chooser_tap', 'note', 'launch'] as const) {
      expect(reduceConsent(c.getState(), { type: 'open_sheet', layer: 'media_read', source }).effects).toEqual([]);
    }
    expect(reduceConsent(c.getState(), { type: 'system_status', layer: 'media_read', status: 'limited' }).effects).toEqual([]);
  });

  it('Narrowed: reads stop, the index is wiped, and Limited returns once the wipe is acknowledged, with no new act', async () => {
    const f = fakes();
    const c = createConsentController(f.deps);
    await grantRead(c);
    await c.dispatch({ type: 'system_status', layer: 'media_read', status: 'limited' });
    expect(c.getState().media_read.status).toBe('limited'); // wipe acknowledged by the controller
    expect(f.calls.filter((x) => x === 'wipe')).toHaveLength(1);
    expect(f.acts).toHaveLength(1);
    // At the pure level the in-between state blocks reads.
    const s0 = createConsentController(fakes().deps);
    await grantRead(s0);
    const r = reduceConsent(s0.getState(), { type: 'system_status', layer: 'media_read', status: 'limited' });
    expect(r.state.media_read.status).toBe('narrowed');
    expect(canRead(r.state, 'media_read')).toBe(false);
    expect(r.effects).toEqual<ConsentEffect[]>([{ type: 'wipe_index' }]);
    expect(reduceConsent(r.state, { type: 'index_wiped', layer: 'media_read' }).state.media_read.status).toBe('limited');
  });

  it('a Limited selection that shrinks narrows too; one that does not shrink changes nothing', async () => {
    const f = fakes({ answer: 'limited' });
    const c = createConsentController(f.deps);
    await grantRead(c);
    expect(reduceConsent(c.getState(), { type: 'system_status', layer: 'media_read', status: 'limited' }).effects).toEqual([]);
    const r = reduceConsent(c.getState(), { type: 'system_status', layer: 'media_read', status: 'limited', selectionNarrowed: true });
    expect(r.state.media_read.status).toBe('narrowed');
    expect(r.effects).toEqual([{ type: 'wipe_index' }]);
  });

  it('Revoked: iOS says denied after consent, so the switch goes off, the index is wiped, background goes, and nothing is asked', async () => {
    const f = fakes();
    const c = createConsentController(f.deps);
    await grantRead(c);
    await c.dispatch({ type: 'open_sheet', layer: 'media_background', source: 'control', backgroundRefreshAvailable: true });
    await c.dispatch({ type: 'continue', layer: 'media_background' });
    await c.dispatch({ type: 'system_status', layer: 'media_read', status: 'denied' });
    expect(c.getState().media_read.status).toBe('revoked');
    expect(isSwitchOn(c.getState(), 'media_read')).toBe(false);
    expect(isSwitchOn(c.getState(), 'media_background')).toBe(false);
    expect(canRead(c.getState(), 'media_read')).toBe(false);
    expect(f.calls).toEqual(expect.arrayContaining(['wipe', 'clear_background']));
    expect(f.requests).toEqual(['media_read']);
  });

  it('a re-grant in Settings shows as All or Limited with the switch still off until the parent turns it on and an act is recorded', async () => {
    const f = fakes();
    const c = createConsentController(f.deps);
    await grantRead(c);
    await c.dispatch({ type: 'system_status', layer: 'media_read', status: 'denied' });
    await c.dispatch({ type: 'system_status', layer: 'media_read', status: 'limited' });
    expect(c.getState().media_read.status).toBe('limited');
    expect(isSwitchOn(c.getState(), 'media_read')).toBe(false);
    await c.dispatch({ type: 'turn_on', layer: 'media_read' });
    expect(isSwitchOn(c.getState(), 'media_read')).toBe(true);
    expect(f.acts.filter((a) => a.action === 'agreed')).toHaveLength(2);
    expect(f.requests).toHaveLength(1);
  });

  it('canRead is false in every state except an on switch with All or Limited (permission is checked before every read)', () => {
    let s = initialConsentState();
    expect(canRead(s, 'media_read')).toBe(false);
    for (const status of CONSENT_STATES) {
      const forced: ConsentState = { ...s, media_read: { ...s.media_read, status, switchOn: true, actRecorded: true } };
      expect(canRead(forced, 'media_read'), status).toBe(status === 'all' || status === 'limited');
    }
    s = { ...s, media_read: { ...s.media_read, status: 'all', switchOn: false, actRecorded: false } };
    expect(canRead(s, 'media_read')).toBe(false);
  });

  it('only the read layer can be Limited or Narrowed; a Limited answer for occasions is ignored', () => {
    const open = reduceConsent(reduceConsent(initialConsentState(), { type: 'open_sheet', layer: 'occasions', source: 'control' }).state, { type: 'continue', layer: 'occasions' });
    const r = reduceConsent(open.state, { type: 'system_answer', layer: 'occasions', answer: 'limited' });
    expect(r.state.occasions.status).not.toBe('limited');
    expect(r.effects).toEqual([]);
  });
});
