/// <reference types="node" />
/**
 * NS-16 (BL-980) Review's From name, follow-ups from the reviews of #2179 (review B note 3: the `useState` initialiser's
 * `getSetting` was unwrapped; review B "Not verified": a pause landing while Review is open; review A note 2: the
 * slot's owner was parsed twice). The hook runs on the mini-react stand-in, so its state and its config subscription
 * behave as in React; the store's settings are a Map that can be made to throw. Fictional Asha family only.
 *
 * Mutants this file was written to catch: the typed-name read unwrapped again (a store that throws breaks Review's
 * render), the hook not subscribing to `subscribeRemoteConfig` (a pause that lands while Review is open is not drawn
 * until something else draws Review again), the subscription not undone when Review closes, and `forgetDraftFromName`
 * parsing the slot itself again.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactStandIn, renderHook } from './helpers/mini-react';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  /** Keys whose read throws, as a store that cannot be read does. */
  failing: new Set<string>(),
}));
vi.mock('react', () => reactStandIn);
vi.mock('@/lib/store', () => ({
  getSetting: (k: string) => {
    if (h.failing.has(k)) throw new Error('store cannot be read');
    return h.settings.get(k) ?? null;
  },
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
  deleteSetting: (k: string) => void h.settings.delete(k),
  getEntry: () => null,
}));

const { setSignAsOtherForTest, setSignAsOtherRemoteForTest, useFromName } = await import('../src/lib/capture/sign-as-other');
const { draftNameIsFor, draftNameOwner, serializeDraftName, SIGN_AS_DRAFT_SETTING, SIGN_AS_RECENT_SETTING } = await import(
  '../src/lib/capture/sign-as-other.logic'
);

/** A signed config on the phone whose kill switches a test can change, and the listeners Review subscribed. */
function remote() {
  const r = {
    killSwitches: { signAsOther: false } as Record<string, unknown>,
    listeners: new Set<() => void>(),
    reads: 0,
    subscribes: 0,
    load: () => ({
      getRemoteConfig: () => {
        r.reads += 1;
        return { killSwitches: r.killSwitches };
      },
      subscribeRemoteConfig: (fn: () => void) => {
        r.subscribes += 1;
        r.listeners.add(fn);
        return () => void r.listeners.delete(fn);
      },
    }),
    /** A new signed config is in use (lib/remote tells its subscribers). */
    land(killSwitches: Record<string, unknown>) {
      r.killSwitches = killSwitches;
      for (const fn of [...r.listeners]) fn();
    },
  };
  return r;
}

const D1 = '0199a5b0-0000-7000-8000-000000000001';

beforeEach(() => {
  h.settings.clear();
  h.failing.clear();
  setSignAsOtherForTest(true);
});
afterEach(() => {
  setSignAsOtherForTest(null);
  setSignAsOtherRemoteForTest(null);
});

describe('[NS-16] Review reads the typed name fail-safe (review B note 3 on #2179)', () => {
  it('[NS-16] a store that cannot be read gives no typed name and Review still draws, signing as the parent', () => {
    const r = remote();
    setSignAsOtherRemoteForTest(r.load);
    h.failing.add(SIGN_AS_DRAFT_SETTING);
    h.failing.add(SIGN_AS_RECENT_SETTING);
    const run = renderHook(() => useFromName({ draftId: D1, keptEntryId: null })); // mutant: the unwrapped read throws here
    expect(run.result.current.offered).toBe(true);
    expect(run.result.current.typed).toBe('');
    expect(run.result.current.recent).toEqual([]);
    expect(run.result.current.shown('Mama')).toBe('Mama');
    expect(run.result.current.signatureFor('Mama')).toEqual({ ok: true, authorSignsAs: 'Mama', other: null });
    run.unmount();
  });

  it('[NS-16] control: a store that can be read gives the name typed for this draft', () => {
    setSignAsOtherRemoteForTest(remote().load);
    h.settings.set(SIGN_AS_DRAFT_SETTING, serializeDraftName(D1, 'Nani'));
    const run = renderHook(() => useFromName({ draftId: D1, keptEntryId: null }));
    expect(run.result.current.typed).toBe('Nani');
    expect(run.result.current.shown('Mama')).toBe('Nani');
    run.unmount();
  });
});

describe('[NS-16][G-18] a pause that lands while Review is open applies at once', () => {
  it('[NS-16][G-18] the pause landing hides the control, keeps the typed name, and what is drawn is what Keep writes', () => {
    const r = remote();
    setSignAsOtherRemoteForTest(r.load);
    const run = renderHook(() => useFromName({ draftId: D1, keptEntryId: null }));
    expect(run.result.current.offered).toBe(true);
    run.result.current.setTyped('Nani');
    expect(run.result.current.typed).toBe('Nani');
    const before = run.renders;

    r.land({ signAsOther: true }); // mutant: no subscription, so Review keeps drawing the control
    expect(run.renders).toBeGreaterThan(before);
    const from = run.result.current;
    expect(from.offered).toBe(false);
    expect(from.paused).toBe(true);
    expect(from.typed).toBe('Nani'); // a pause never takes away a name already typed (G-18)
    expect(from.shown('Mama')).toBe('Nani');
    expect(from.signatureFor('Mama')).toEqual({ ok: true, authorSignsAs: 'Nani', other: 'Nani' });
    from.setTyped('Dada'); // the hidden control cannot change the slot
    expect(h.settings.get(SIGN_AS_DRAFT_SETTING)).toBe(serializeDraftName(D1, 'Nani'));

    r.land({ signAsOther: false }); // lifted while still open: the control comes back
    expect(run.result.current.offered).toBe(true);
    expect(run.result.current.paused).toBe(false);
    run.unmount();
  });

  it('[NS-16] a refresh that does not change the pause draws nothing again', () => {
    const r = remote();
    setSignAsOtherRemoteForTest(r.load);
    const run = renderHook(() => useFromName({ draftId: D1, keptEntryId: null }));
    const before = run.renders;
    r.land({ signAsOther: false, bookSearch: true });
    expect(run.renders).toBe(before);
    run.unmount();
  });

  it('[NS-16] Review closing stops listening', () => {
    const r = remote();
    setSignAsOtherRemoteForTest(r.load);
    const run = renderHook(() => useFromName({ draftId: D1, keptEntryId: null }));
    expect(r.subscribes).toBe(1);
    expect(r.listeners.size).toBe(1);
    run.unmount();
    expect(r.listeners.size).toBe(0); // mutant: the unsubscribe is dropped
  });

  it('[NS-16][G-18] the flag off: the config is neither read nor heard, and a pause never turns the control on', () => {
    const r = remote();
    setSignAsOtherRemoteForTest(r.load);
    setSignAsOtherForTest(false);
    const run = renderHook(() => useFromName({ draftId: D1, keptEntryId: null }));
    r.land({ signAsOther: true });
    r.land({ signAsOther: false });
    expect(run.result.current.offered).toBe(false);
    expect(run.result.current.paused).toBe(false);
    expect(r.subscribes).toBe(0);
    expect(r.reads).toBe(0);
    run.unmount();
  });

  it('[NS-16] fail-open: a reader with no subscribe, or one whose subscribe throws, still draws from the config it reads', () => {
    setSignAsOtherRemoteForTest(() => ({ getRemoteConfig: () => ({ killSwitches: { signAsOther: false } }) }));
    const plain = renderHook(() => useFromName({ draftId: D1, keptEntryId: null }));
    expect(plain.result.current.offered).toBe(true);
    plain.unmount();

    setSignAsOtherRemoteForTest(() => ({
      getRemoteConfig: () => ({ killSwitches: { signAsOther: true } }),
      subscribeRemoteConfig: () => {
        throw new Error('no remote yet');
      },
    }));
    const throwing = renderHook(() => useFromName({ draftId: D1, keptEntryId: null }));
    expect(throwing.result.current.offered).toBe(false);
    expect(throwing.result.current.paused).toBe(true);
    throwing.unmount();
  });
});

describe('[NS-16] one reading of whose slot it is (review A note 2 on #2179)', () => {
  it('[NS-16] draftNameOwner names the draft only for a readable slot with a string draftId', () => {
    for (const raw of [null, undefined, '', 'not json', 'null', '5', '"A"', '[]', '{}', '{"draftId":["A"]}', '{"draftId":5}']) {
      expect(draftNameOwner(raw), String(raw)).toBeNull();
      if (raw !== undefined) expect(draftNameIsFor(raw, 'A'), String(raw)).toBe(false);
    }
    expect(draftNameOwner('{"draftId":"A"}')).toBe('A');
    expect(draftNameOwner('{"draftId":"A","name":5}')).toBe('A');
    expect(draftNameIsFor(serializeDraftName('A', 'Nani'), 'A')).toBe(true);
    expect(draftNameIsFor(serializeDraftName('B', 'Nani'), 'A')).toBe(false);
  });

  it('[NS-16] forgetDraftFromName reads the slot through draftNameOwner and does not parse it itself', () => {
    const drafts = readFileSync(join(__dirname, '..', 'src', 'lib', 'db', 'repos', 'drafts.ts'), 'utf8');
    const body = drafts.slice(drafts.indexOf('export function forgetDraftFromName'));
    const fn = body.slice(0, body.indexOf('\n}\n'));
    expect(fn).toContain('draftNameOwner(');
    expect(fn).not.toContain('JSON.parse');
  });
});
