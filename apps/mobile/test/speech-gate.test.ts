/// <reference types="node" />
/**
 * The app-wide recording hold (SR-C-02: F04-REQ-040, F04-REQ-041; B2-21 never waived; RT-REC-09). Every `announce()`
 * in the app (toasts, status lines, timers such as Invite's) passes lib/speech-gate.ts; while a take is on it says
 * nothing, and nothing it was asked to say is replayed into the take later. The capture state is a state machine keyed
 * to the take's token (Reviews A and B on #523). Node cannot load React Native, so the gate runs here with a fake
 * speaker, timer and clock, and the wiring of lib/a11y.ts, the toast and Listen is checked in source.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CAPTURE_HEARTBEAT_MS,
  PLAYBACK_RETRY_MS,
  STALE_CAPTURE_MS,
  captureState,
  closeTake,
  confirmLive,
  createGatedAnnounce,
  finishTake,
  heartbeat,
  isRecorderCapturing,
  openTake,
  pauseConfirmed,
  pauseTake,
  resetCapture,
  resumeTake,
  setCaptureClockForTests,
  setRecorderProbe,
} from '../src/lib/speech-gate';
import { startTake, type StartDeps } from '../src/components/capture/listen.logic';

const SRC = join(__dirname, '..', 'src');
const src = (p: string) => readFileSync(join(SRC, p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

let now = 0;
const tick = (ms: number) => {
  now += ms;
};

function rig() {
  const spoken: string[] = [];
  const timers: (() => void)[] = [];
  let mode: 'idle' | 'recording' | 'playback' = 'idle';
  const say = createGatedAnnounce({
    speak: (m) => void spoken.push(m),
    audioMode: () => mode,
    later: (fn, ms) => {
      expect(ms).toBe(PLAYBACK_RETRY_MS);
      timers.push(fn);
    },
  });
  const runTimers = () => {
    while (timers.length) timers.shift()!();
  };
  return { spoken, say, runTimers, setMode: (m: typeof mode) => void (mode = m) };
}

beforeEach(() => {
  now = 1_000_000;
  setCaptureClockForTests(() => now);
});
afterEach(() => {
  resetCapture();
  setCaptureClockForTests(null);
});

describe('RT-REC-09: no app announcement reaches a take', () => {
  it('outside a take a toast is spoken as before', () => {
    const r = rig();
    r.say('Invite cancelled.');
    expect(r.spoken).toEqual(['Invite cancelled.']);
  });

  it('a toast during a take says nothing, and is not replayed after a pause, a resume or the stop', () => {
    const r = rig();
    r.setMode('recording');
    const take = openTake();
    confirmLive(take);
    r.say('Invite cancelled. Undo.');
    r.say('Your export is ready.');
    r.runTimers();
    expect(r.spoken).toEqual([]);
    pauseTake(take);
    pauseConfirmed(take); // paused: the app may speak, but nothing from before is replayed
    r.runTimers();
    resumeTake(take);
    r.runTimers();
    finishTake(take);
    closeTake(take);
    r.setMode('idle');
    r.runTimers();
    expect(r.spoken).toEqual([]);
  });

  it('a message waiting behind playback is dropped, not spoken, if a take is on when it comes due', () => {
    const r = rig();
    r.setMode('playback');
    r.say('Letter deleted. Undo available.');
    expect(r.spoken).toEqual([]);
    r.setMode('recording');
    const take = openTake();
    r.runTimers();
    closeTake(take);
    r.runTimers();
    expect(r.spoken).toEqual([]);
  });

  it('the playback wait still works when no take is on (TDD 09 rule S2)', () => {
    const r = rig();
    r.setMode('playback');
    r.say('One.');
    r.say('Two.');
    expect(r.spoken).toEqual([]);
    r.setMode('idle');
    r.runTimers();
    expect(r.spoken).toEqual(['One.', 'Two.']);
  });
});

describe('the capture state machine (Reviews A and B on #523)', () => {
  it('starting, live, pausing and finishing are ON; idle and a confirmed pause are off', () => {
    expect(isRecorderCapturing()).toBe(false);
    const take = openTake();
    expect([captureState(), isRecorderCapturing()]).toEqual(['starting', true]);
    confirmLive(take);
    expect([captureState(), isRecorderCapturing()]).toEqual(['live', true]);
    pauseTake(take);
    expect([captureState(), isRecorderCapturing()]).toEqual(['pausing', true]);
    pauseConfirmed(take);
    expect([captureState(), isRecorderCapturing()]).toEqual(['paused', false]);
    resumeTake(take);
    expect([captureState(), isRecorderCapturing()]).toEqual(['live', true]);
    finishTake(take);
    expect([captureState(), isRecorderCapturing()]).toEqual(['finishing', true]);
    closeTake(take);
    expect([captureState(), isRecorderCapturing()]).toEqual(['idle', false]);
  });

  it('[Review A race] a status poll during a start in progress cannot turn it off before the microphone is live', () => {
    const r = rig();
    const take = openTake();
    // Polls that say "not recording yet": none of the calls a poll can make turns the state off.
    confirmLive(null);
    heartbeat(take);
    pauseConfirmed(take); // only from `pausing`, which only the person's pause enters
    expect([captureState(), isRecorderCapturing()]).toEqual(['starting', true]);
    r.say('Invite cancelled.'); // the first moment of the take
    confirmLive(take); // the recorder is live
    r.say('Your export is ready.');
    expect(r.spoken).toEqual([]);
  });

  it('[Review B race] a late isRecording:true poll after finish cannot turn it back on', () => {
    const r = rig();
    const take = openTake();
    confirmLive(take);
    finishTake(take);
    closeTake(take); // finalize resolved
    confirmLive(take); // the late poll
    heartbeat(take);
    resumeTake(take);
    pauseTake(take);
    finishTake(take);
    expect([captureState(), isRecorderCapturing()]).toEqual(['idle', false]);
    r.say('Letter kept.');
    expect(r.spoken).toEqual(['Letter kept.']);
  });

  it('[Review B] unmount after finish (or mid-take) always forces off, and a late poll does not reopen it', () => {
    const take = openTake();
    confirmLive(take);
    finishTake(take);
    resetCapture(); // Listen unmounts before finalize resolves
    expect(isRecorderCapturing()).toBe(false);
    confirmLive(take);
    closeTake(take); // the late finally: a no-op
    expect([captureState(), isRecorderCapturing()]).toEqual(['idle', false]);
    // Mid-take unmount, no finish at all.
    const next = openTake();
    confirmLive(next);
    resetCapture();
    expect(isRecorderCapturing()).toBe(false);
  });

  it('late calls from an older take never touch a newer take', () => {
    const first = openTake();
    closeTake(first);
    const second = openTake();
    confirmLive(second);
    closeTake(first);
    pauseTake(first);
    expect([captureState(), isRecorderCapturing()]).toEqual(['live', true]);
  });

  it(`[Karma ruling, flipped] time alone never lifts the silence: an ON state stale for over ${STALE_CAPTURE_MS} ms stays silent`, () => {
    expect(STALE_CAPTURE_MS).toBe(3000);
    expect(CAPTURE_HEARTBEAT_MS).toBe(500);
    const r = rig();
    const take = openTake();
    confirmLive(take);
    for (let i = 0; i < 20; i++) {
      tick(CAPTURE_HEARTBEAT_MS);
      heartbeat(take);
      expect(isRecorderCapturing()).toBe(true);
    }
    // A JS stall far past the limit, with no probe registered: the gate cannot ask, so it stays ON.
    tick(STALE_CAPTURE_MS * 10);
    expect(isRecorderCapturing()).toBe(true);
    // The timer that fell due during the stall (Invite's setTimeout) fires first: dropped.
    r.say('Invite cancelled.');
    expect(r.spoken).toEqual([]);
  });
});

describe('[Karma ruling] when the heartbeat is stale the gate asks the recorder, and fails closed', () => {
  afterEach(() => setRecorderProbe(null));
  const stale = () => tick(STALE_CAPTURE_MS + 1);
  /** Ask the gate first (the stale check may move the state), then read the state. */
  const askThenState = () => {
    const on = isRecorderCapturing();
    return [captureState(), on];
  };

  it('stale plus recording stays ON', () => {
    setRecorderProbe(() => true);
    const take = openTake();
    confirmLive(take);
    stale();
    expect(isRecorderCapturing()).toBe(true);
    finishTake(take); // even on the way out, a recorder still writing keeps it ON
    stale();
    expect(isRecorderCapturing()).toBe(true);
  });

  it('stale plus unknown stays ON: no probe, a null answer, or a probe that throws', () => {
    const take = openTake();
    finishTake(take);
    stale();
    for (const p of [null, () => null, () => { throw new Error('released'); }] as const) {
      setRecorderProbe(p);
      expect(isRecorderCapturing()).toBe(true);
    }
  });

  it('stale plus not recording stays ON while the take is starting or live (the microphone may be about to go on)', () => {
    setRecorderProbe(() => false);
    const take = openTake();
    stale();
    expect(askThenState()).toEqual(['starting', true]);
    confirmLive(take);
    stale();
    expect(askThenState()).toEqual(['live', true]);
  });

  it('stale plus not recording with the take closed goes OFF; a finished take whose close was missed is closed', () => {
    const r = rig();
    setRecorderProbe(() => false);
    const take = openTake();
    confirmLive(take);
    closeTake(take);
    stale();
    expect(askThenState()).toEqual(['idle', false]);
    // The missed-close case: finished, the recorder says it stopped, the close never came.
    const next = openTake();
    confirmLive(next);
    finishTake(next);
    stale();
    expect(askThenState()).toEqual(['idle', false]);
    confirmLive(next); // a late poll cannot reopen it
    expect(isRecorderCapturing()).toBe(false);
    r.say('Letter kept.');
    expect(r.spoken).toEqual(['Letter kept.']);
  });

  it('stale plus not recording while pausing becomes paused, and a resume still turns the take back ON', () => {
    setRecorderProbe(() => false);
    const take = openTake();
    confirmLive(take);
    pauseTake(take);
    stale();
    expect(askThenState()).toEqual(['paused', false]);
    resumeTake(take);
    expect(askThenState()).toEqual(['live', true]);
  });
});

describe('wiring: every announcement passes the gate', () => {
  it('lib/a11y announce() is the gate (no queue of its own), and the toast speaks only through announce()', () => {
    const a11y = code(src('lib/a11y.ts'));
    expect(a11y).toMatch(/const gated = createGatedAnnounce\(\{ speak, audioMode: getAudioMode, later: \(fn, ms\) => setTimeout\(fn, ms\) \}\);/);
    expect(a11y).toMatch(/export function announce\(message: string, opts: \{ queue\?: boolean \} = \{\}\): void \{\s*if \(!message \|\| Platform\.OS === 'android'\) return;\s*gated\(message, opts\);\s*\}/);
    expect(a11y).not.toMatch(/flushQueued|let queued/);
    const toast = code(src('components/ui/toast.tsx'));
    expect(toast).toMatch(/\bannounce\(/);
    expect(toast).not.toMatch(/AccessibilityInfo\.announce/);
  });

  it('Listen drives the state machine by token; polls only confirm; unmount always resets', () => {
    const l = code(src('app/listen.tsx'));
    // Polls: confirm ON for the open take, or confirm the person's pause; nothing else.
    expect(l).toMatch(/if \(capturing\) confirmLive\(takeToken\.current\);\s*else if \(phase === 'paused'\) pauseConfirmed\(takeToken\.current\);\s*announcer\.settle\(\{ phase, capturing \}\);/);
    // The heartbeat runs for as long as the screen is mounted.
    expect(l).toMatch(/setInterval\(\(\) => heartbeat\(takeToken\.current\), CAPTURE_HEARTBEAT_MS\)/);
    // The probe the stale check asks: this recorder's native state, cleared with the screen.
    expect(l).toMatch(/setRecorderProbe\(\(\) => \{\s*try \{\s*return recorder\.isRecording;\s*\} catch \{\s*return null;\s*\}\s*\}\);/);
    expect(l).toMatch(/clearInterval\(id\);\s*setRecorderProbe\(null\);/);
    // ON before the audio session and the microphone go live.
    // The start path (listen.logic startTake) gets the gate's own openTake and closeTake, and keeps the token.
    expect(l).toMatch(/openTake,\s*closeTake,\s*onToken: \(token\) => \{\s*takeToken\.current = token;\s*\},/);
    expect(l).toMatch(/pauseTake\(takeToken\.current\);\s*recorder\.pause\(\);/);
    expect(l).toMatch(/resumeTake\(takeToken\.current\);\s*recorder\.record\(\);/);
    // Off only when the take ends, keyed to its token.
    expect(l).toMatch(/finishTake\(token\);\s*setPhase\('finishing'\);[\s\S]{0,200}draft = await finalizeTake\(recorder, id, reason, lastDuration\.current\);\s*\} finally \{\s*closeTake\(token\);/);
    expect(l).toMatch(/finishTake\(token\);\s*try \{\s*if \(id\) await abandonTake\(recorder, id\);[\s\S]{0,120}\} finally \{\s*closeTake\(token\);/);
    // Unmount: always off, last thing in the cleanup.
    expect(l).toMatch(/void finalizeTake\(recorder, id, 'dismiss', lastDuration\.current\);\s*\}\s*resetCapture\(\);\s*\},/);
    // Nothing in Listen sets the flag by value any more.
    expect(l).not.toMatch(/setRecorderCapturing/);
  });

  it('no screen calls AccessibilityInfo.announce* directly, except the ones that cannot be on screen during a take', () => {
    // Each exception, and why no take can be running while it speaks:
    const ALLOWED: Record<string, string> = {
      'lib/a11y.ts': 'the gate itself',
      'components/resilience/plain-screen.tsx': 'replaces the whole app after a launch failure; it renders without the app, so no take exists',
      'components/gate/age-gate-screen.tsx': 'before onboarding: there is no child yet, so Listen cannot open',
      'components/child/plus-gate.tsx': 'payments-owned; a note after a tap on that screen. Follow-up for payments: route it through announce()',
    };
    const files: string[] = [];
    const walk = (d: string) => {
      for (const f of readdirSync(d)) {
        const p = join(d, f);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f)) files.push(p);
      }
    };
    walk(SRC);
    const direct = files.filter((f) => /AccessibilityInfo\.announceForAccessibility/.test(code(readFileSync(f, 'utf8')))).map((f) => relative(SRC, f).split('\\').join('/'));
    expect(direct.sort()).toEqual(Object.keys(ALLOWED).sort());
  });
});

/**
 * [Review B nit, Karma on #523] The screen closing while a start is under way (the iOS microphone prompt included)
 * never leaves the app silent: the real start path (listen.logic `startTake`) with the real gate, and each await held
 * open so the screen can close at exactly that point.
 */
describe('the screen closes during a start: the gate always ends idle', () => {
  function deferred<T>() {
    let resolve!: (v: T) => void;
    const promise = new Promise<T>((r) => (resolve = r));
    return { promise, resolve };
  }
  const settle = () => new Promise((res) => setTimeout(res, 0));

  function startRig(o: { status: string; granted: boolean }) {
    const calls: string[] = [];
    let alive = true;
    const prompt = deferred<{ granted: boolean; status: string }>();
    const mode = deferred<void>();
    const begin = deferred<{ id: string }>();
    let token: number | null = null;
    const deps: StartDeps = {
      alive: () => alive,
      getPermission: async () => ({ granted: o.granted, status: o.status }),
      requestPermission: () => {
        calls.push('prompt');
        return prompt.promise;
      },
      freeBytes: () => null,
      pressHaptic: () => void calls.push('haptic'),
      setRecordingMode: () => {
        calls.push('recordingMode');
        return mode.promise;
      },
      setIdleMode: async () => void calls.push('idleMode'),
      openTake: () => {
        calls.push('openTake');
        return openTake();
      },
      closeTake: (t) => {
        calls.push('closeTake');
        closeTake(t);
      },
      onToken: (t) => {
        token = t;
      },
      begin: () => {
        calls.push('begin');
        return begin.promise;
      },
      keepOrphan: (id) => void calls.push(`keep:${id}`),
    };
    /** The screen closes; `withReset` is Listen's layout cleanup (resetCapture), off to prove the path closes alone. */
    const close = (withReset: boolean) => {
      alive = false;
      if (withReset) resetCapture();
    };
    return { deps, calls, prompt, mode, begin, close, token: () => token };
  }

  it('closed while the iOS prompt is up: openTake never runs, and the gate is idle', async () => {
    const r = startRig({ status: 'undetermined', granted: false });
    const out = startTake(r.deps, true); // Continue on the primer
    await settle();
    expect(r.calls).toEqual(['prompt']);
    r.close(true); // the screen closes with the prompt still up
    r.prompt.resolve({ granted: true, status: 'granted' }); // the person allows after all
    expect(await out).toEqual({ kind: 'gone' });
    expect(r.calls).toEqual(['prompt']); // no haptic, no session, no gate, no take
    expect([captureState(), isRecorderCapturing()]).toEqual(['idle', false]);
  });

  it('closed while the audio session starts: the gate it opened is closed and the session put back', async () => {
    const r = startRig({ status: 'granted', granted: true });
    const out = startTake(r.deps, false);
    await settle();
    expect(r.calls).toEqual(['haptic', 'openTake', 'recordingMode']); // the haptic plays before the session
    expect(isRecorderCapturing()).toBe(true);
    r.close(false);
    r.mode.resolve();
    expect(await out).toEqual({ kind: 'gone' });
    expect(r.calls).toEqual(['haptic', 'openTake', 'recordingMode', 'closeTake', 'idleMode']);
    expect([captureState(), isRecorderCapturing()]).toEqual(['idle', false]);
  });

  it('a take that opens late is closed at once, then kept', async () => {
    const r = startRig({ status: 'granted', granted: true });
    const out = startTake(r.deps, false);
    r.mode.resolve();
    await settle();
    expect(r.calls.at(-1)).toBe('begin');
    r.close(false); // even with the unmount reset missed, the start path closes its own token
    r.begin.resolve({ id: 'draft-asha-1' });
    expect(await out).toEqual({ kind: 'gone' });
    expect(r.calls.slice(-2)).toEqual(['closeTake', 'keep:draft-asha-1']);
    expect([captureState(), isRecorderCapturing()]).toEqual(['idle', false]);
    confirmLive(r.token()); // a late poll for that take cannot reopen it
    expect(isRecorderCapturing()).toBe(false);
  });

  it('a start that stays open goes live with the gate ON', async () => {
    const r = startRig({ status: 'granted', granted: true });
    const out = startTake(r.deps, false);
    r.mode.resolve();
    r.begin.resolve({ id: 'draft-asha-2' });
    expect(await out).toEqual({ kind: 'live', token: r.token(), draftId: 'draft-asha-2' });
    expect([captureState(), isRecorderCapturing()]).toEqual(['starting', true]);
  });

  it('the first tap while iOS has not asked shows the primer and opens nothing', async () => {
    const r = startRig({ status: 'undetermined', granted: false });
    expect(await startTake(r.deps, false)).toEqual({ kind: 'primer' });
    expect(r.calls).toEqual([]);
    expect(isRecorderCapturing()).toBe(false);
  });
});
