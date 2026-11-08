/**
 * App lock behaviour that runs in Node with the native edges stubbed (Review A on #640):
 * - F17-REQ-015: with the lock on and "Names in notifications" on, the planned reminders hold no child name (Asha), and
 *   turning the lock off brings the stored choice back unchanged.
 * - The live take: onActiveTakeChange fires true when a take begins and false once it is kept, not on pause; a
 *   listener that throws never stops the take; and a lock that falls due during a take waits for it, through the
 *   real controller.
 * - The lock layer stays mounted from the unlock to the end of its fade (layer.logic.ts).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  drafts: new Map<string, { id: string; audioUri: string | null; state: string }>(),
  nextDraft: 0,
  appStateListener: null as null | ((s: string) => void),
}));

vi.mock('../src/lib/store', () => ({
  getSetting: (k: string) => h.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
  currentUserId: () => null,
  listChildren: () => [],
  listEntriesForChild: () => [],
  createRecordingDraft: (input: { audioUri: string | null }) => {
    const d = { id: `draft-${++h.nextDraft}`, audioUri: input.audioUri, state: 'recording' };
    h.drafts.set(d.id, d);
    return d;
  },
  getDraft: (id: string) => h.drafts.get(id) ?? null,
  finalizeDraftAudio: (id: string, patch: { state: string }) => {
    const d = h.drafts.get(id);
    if (d) d.state = patch.state;
  },
  setDraftAudioHash: () => {},
}));
vi.mock('../src/lib/audio-mode', () => ({ setAudioMode: async () => {}, getAudioMode: () => 'idle' }));
vi.mock('expo-audio', () => ({ AudioQuality: { HIGH: 96 }, IOSOutputFormat: { MPEG4AAC: 'aac ' }, setAudioModeAsync: async () => {} }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n), CryptoDigestAlgorithm: { SHA256: 'SHA-256' }, digest: async () => new ArrayBuffer(32) }));
vi.mock('expo-file-system', () => ({ File: class {} }));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, l: (s: string) => void) => {
      h.appStateListener = l;
      return { remove: () => {} };
    },
  },
}));
vi.mock('expo-local-authentication', () => ({
  SecurityLevel: { NONE: 0, SECRET: 1, BIOMETRIC_STRONG: 3 },
  getEnrolledLevelAsync: async () => 3,
  supportedAuthenticationTypesAsync: async () => [2],
  hasHardwareAsync: async () => true,
  authenticateAsync: async () => ({ success: true }),
}));

const { readPrefs, lockScreenNamesOn, writePrefs } = await import('../src/lib/reminders/prefs');
const { planReminders } = await import('../src/lib/reminders/planner');
const { zonedToEpoch, parseIsoDate } = await import('../src/lib/reminders/tz');
const { writeAppLock } = await import('../src/lib/app-lock/prefs');
const recorder = await import('../src/lib/capture/recorder');
const controller = await import('../src/lib/app-lock/controller');
const { fadeDone, LAYER_HIDDEN, layerMounted, layerStep, resetCoverOpacity } = await import('../src/components/app-lock/layer.logic');

const LA = 'America/Los_Angeles';
const asha = { id: 'child-asha', name: 'Asha', birthday: '2026-03-08', included: true };

function planned() {
  const d = parseIsoDate('2026-10-05')!;
  return planReminders({
    now: zonedToEpoch({ ...d, hh: 12, mm: 0 }, LA),
    timeZone: LA,
    children: [asha],
    lastSaveAt: null,
    lastForegroundAt: null,
    prefs: { ...readPrefs(), enabled: true, cadence: 'everyEvening' },
  });
}
const mentionsAsha = (ns: { title: string; body: string }[]) => ns.some((n) => `${n.title} ${n.body}`.includes('Asha'));

function fakeRecorder() {
  return {
    uri: null as string | null,
    prepareToRecordAsync: vi.fn(async () => {}),
    record: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(async () => {}),
    getStatus: () => ({ durationMillis: 1_000 }),
  };
}
type Rec = Parameters<typeof recorder.beginTake>[0];

beforeEach(() => {
  h.settings.clear();
  h.drafts.clear();
});

describe('names in notifications while the lock is on (F17-REQ-015)', () => {
  it('lock off and names on: the reminders may name Asha (the control case)', () => {
    writePrefs({ namesOnLockScreen: true });
    expect(readPrefs().namesOnLockScreen).toBe(true);
    expect(mentionsAsha(planned())).toBe(true);
  });

  it('lock on and names on: no planned reminder holds the name', () => {
    writePrefs({ namesOnLockScreen: true });
    writeAppLock({ enabled: true });
    expect(lockScreenNamesOn()).toBe(false);
    expect(readPrefs().namesOnLockScreen).toBe(false);
    const ns = planned();
    expect(ns.length).toBeGreaterThan(0);
    expect(mentionsAsha(ns)).toBe(false);
  });

  it('turning the lock off brings the stored choice back unchanged', () => {
    writePrefs({ namesOnLockScreen: true });
    writeAppLock({ enabled: true });
    expect(h.settings.get('notifications.lockScreenNames')).toBe('on');
    writeAppLock({ enabled: false });
    expect(h.settings.get('notifications.lockScreenNames')).toBe('on');
    expect(lockScreenNamesOn()).toBe(true);
    expect(mentionsAsha(planned())).toBe(true);
  });
});

describe('onActiveTakeChange (lib/capture/recorder.ts)', () => {
  it('fires true on begin, nothing on pause, false once the take is kept, each once', async () => {
    const seen: boolean[] = [];
    const off = recorder.onActiveTakeChange((live) => seen.push(live));
    const rec = fakeRecorder();
    const draft = await recorder.beginTake(rec as unknown as Rec, { childId: 'child-asha', promptKey: null });
    expect(seen).toEqual([true]);
    rec.pause();
    expect(seen).toEqual([true]);
    await recorder.finalizeTake(rec as unknown as Rec, draft.id, 'user', 1_000);
    await vi.waitFor(() => expect(seen).toEqual([true, false]));
    off();
  });

  it('fires false when a take is abandoned', async () => {
    const seen: boolean[] = [];
    const off = recorder.onActiveTakeChange((live) => seen.push(live));
    const rec = fakeRecorder();
    const draft = await recorder.beginTake(rec as unknown as Rec, { childId: 'child-asha', promptKey: null });
    await recorder.abandonTake(rec as unknown as Rec, draft.id);
    expect(seen).toEqual([true, false]);
    off();
  });

  it('a listener that throws never stops the take', async () => {
    const off = recorder.onActiveTakeChange(() => {
      throw new Error('listener failed');
    });
    const rec = fakeRecorder();
    const draft = await recorder.beginTake(rec as unknown as Rec, { childId: 'child-asha', promptKey: null });
    expect(rec.record).toHaveBeenCalledTimes(1);
    expect(recorder.activeTakeId()).toBe(draft.id);
    off();
    await recorder.finalizeTake(rec as unknown as Rec, draft.id, 'user', 1_000);
    await vi.waitFor(() => expect(recorder.activeTakeId()).toBeNull());
  });
});

describe('a lock that falls due during a take waits for it (real controller)', () => {
  it('locks only once the take is kept', async () => {
    h.settings.set('appLock.enabled', 'on');
    h.settings.set('appLock.grace', 'oneMinute');
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    controller.startAppLock();
    expect(controller.getAppLockState().locked).toBe(true); // cold start
    expect(await controller.unlock()).toBe('ok');
    expect(controller.getAppLockState().locked).toBe(false);

    await vi.waitFor(() => expect(recorder.activeTakeId()).toBeNull()); // no take left from the tests above
    const rec = fakeRecorder();
    const draft = await recorder.beginTake(rec as unknown as Rec, { childId: 'child-asha', promptKey: null });
    expect(controller.getAppLockState().recording).toBe(true);
    rec.pause(); // paused is still a take
    h.appStateListener!('inactive');
    h.appStateListener!('background');
    now += 120_000;
    h.appStateListener!('active');
    expect(controller.getAppLockState()).toMatchObject({ locked: false, due: true });

    await recorder.finalizeTake(rec as unknown as Rec, draft.id, 'background', 1_000);
    await vi.waitFor(() => expect(controller.getAppLockState().recording).toBe(false));
    expect(controller.getAppLockState()).toMatchObject({ locked: true, due: false, recording: false });
    expect(h.drafts.get(draft.id)?.state).not.toBe('recording'); // the take was kept, not dropped
    vi.restoreAllMocks();
  });
});

describe('the lock layer stays mounted through the unlock fade (layer.logic.ts)', () => {
  it('unlocking while the system sheet still has the app inactive, then active: mounted until the fade ends', () => {
    let l = layerStep(LAYER_HIDDEN, { show: true, locked: true }); // locked, cover up
    l = layerStep(l, { show: true, locked: false }); // unlocked; still inactive behind the sheet
    expect(layerMounted(l)).toBe(true);
    l = layerStep(l, { show: false, locked: false }); // active: the cover comes down
    expect(l.leaving).toBe(true);
    expect(layerMounted(l)).toBe(true); // never unmounted for a render before the fade
    l = layerStep(l, { show: false, locked: false }); // any re-render during the fade
    expect(layerMounted(l)).toBe(true);
    l = fadeDone(l);
    expect(layerMounted(l)).toBe(false);
  });

  it('a cover that was never locked (back within the grace) goes at once', () => {
    let l = layerStep(LAYER_HIDDEN, { show: true, locked: false });
    l = layerStep(l, { show: false, locked: false });
    expect(layerMounted(l)).toBe(false);
  });

  it('the cover coming back mid-fade is up again at once', () => {
    let l = layerStep(LAYER_HIDDEN, { show: true, locked: true });
    l = layerStep(l, { show: false, locked: false });
    l = layerStep(l, { show: true, locked: false });
    expect(l).toEqual({ show: true, wasLocked: false, leaving: false });
  });
});

describe('a cover that comes back during the unlock fade is fully opaque (Review A at e2120225)', () => {
  it('cancels the running fade and sets the opacity back to 1', () => {
    // Mid-fade: an animation is running and the layer is part-transparent.
    const opacity = { value: 0.4, animating: true };
    const cancel = vi.fn((o: { value: number }) => {
      (o as typeof opacity).animating = false;
    });
    resetCoverOpacity(opacity, cancel);
    expect(cancel).toHaveBeenCalledWith(opacity);
    expect(opacity.animating).toBe(false);
    expect(opacity.value).toBe(1);
  });
});

describe('reloadAppLock never runs during a take (real controller)', () => {
  it('is a no-op while a take is live, and applies once it is kept', async () => {
    await vi.waitFor(() => expect(recorder.activeTakeId()).toBeNull());
    h.settings.set('appLock.enabled', 'on');
    controller.reloadAppLock();
    expect(await controller.unlock()).toBe('ok');
    const rec = fakeRecorder();
    const draft = await recorder.beginTake(rec as unknown as Rec, { childId: 'child-asha', promptKey: null });
    h.settings.set('appLock.enabled', 'off');
    controller.reloadAppLock();
    expect(controller.getAppLockState()).toMatchObject({ enabled: true, recording: true });
    await recorder.finalizeTake(rec as unknown as Rec, draft.id, 'user', 1_000);
    await vi.waitFor(() => expect(controller.getAppLockState().recording).toBe(false));
    controller.reloadAppLock();
    expect(controller.getAppLockState()).toMatchObject({ enabled: false, locked: false });
  });
});
