/// <reference types="node" />
/**
 * The app-wide recording hold (SR-C-02: F04-REQ-040, F04-REQ-041; B2-21 never waived; RT-REC-09). Every `announce()`
 * in the app (toasts, status lines, timers such as Invite's) passes lib/speech-gate.ts; while the recorder captures it
 * says nothing, and nothing it was asked to say is replayed into the take later. Node cannot load React Native, so the
 * gate runs here with a fake speaker and timer, and the wiring of lib/a11y.ts, the toast and Listen is checked in source.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PLAYBACK_RETRY_MS, createGatedAnnounce, isRecorderCapturing, setRecorderCapturing } from '../src/lib/speech-gate';

const SRC = join(__dirname, '..', 'src');
const src = (p: string) => readFileSync(join(SRC, p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

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

afterEach(() => setRecorderCapturing(false));

describe('RT-REC-09: no app announcement reaches a take', () => {
  it('outside a take a toast is spoken as before', () => {
    const r = rig();
    r.say('Invite cancelled.');
    expect(r.spoken).toEqual(['Invite cancelled.']);
  });

  it('a toast during a take says nothing, and is not replayed after a pause, a resume or the stop', () => {
    const r = rig();
    r.setMode('recording');
    setRecorderCapturing(true);
    r.say('Invite cancelled. Undo.');
    r.say('Your export is ready.');
    r.runTimers();
    expect(r.spoken).toEqual([]);
    setRecorderCapturing(false); // paused, or the take ended
    r.runTimers();
    setRecorderCapturing(true); // resumed
    r.runTimers();
    setRecorderCapturing(false);
    r.setMode('idle');
    r.runTimers();
    expect(r.spoken).toEqual([]);
  });

  it('a message waiting behind playback is dropped, not spoken, if a take is capturing when it comes due', () => {
    const r = rig();
    r.setMode('playback');
    r.say('Letter deleted. Undo available.');
    expect(r.spoken).toEqual([]);
    r.setMode('recording');
    setRecorderCapturing(true);
    r.runTimers();
    setRecorderCapturing(false);
    r.runTimers();
    expect(r.spoken).toEqual([]);
  });

  it('the playback wait still works when no take is capturing (TDD 09 rule S2)', () => {
    const r = rig();
    r.setMode('playback');
    r.say('One.');
    r.say('Two.');
    expect(r.spoken).toEqual([]);
    r.setMode('idle');
    r.runTimers();
    expect(r.spoken).toEqual(['One.', 'Two.']);
  });

  it('the flag is a plain module value Listen sets', () => {
    expect(isRecorderCapturing()).toBe(false);
    setRecorderCapturing(true);
    expect(isRecorderCapturing()).toBe(true);
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

  it('Listen sets the flag from the recorder: before the microphone goes live, on every status, and off only after the recorder stops', () => {
    const l = code(src('app/listen.tsx'));
    expect(l).toMatch(/setRecorderCapturing\(capturing \|\| phase === 'recording'\);\s*announcer\.settle\(\{ phase, capturing \}\);/);
    expect(l).toMatch(/setRecorderCapturing\(true\);\s*const draft = await beginTake\(/);
    expect(l).toMatch(/setRecorderCapturing\(true\);\s*recorder\.record\(\);/);
    expect(l).toMatch(/draft = await finalizeTake\(recorder, id, reason, lastDuration\.current\);\s*\} finally \{\s*setRecorderCapturing\(false\);/);
    expect(l).toMatch(/finalizeTake\(recorder, id, 'dismiss', lastDuration\.current\)\.finally\(\(\) => setRecorderCapturing\(false\)\)/);
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
