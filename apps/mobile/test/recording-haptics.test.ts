/// <reference types="node" />
/**
 * Haptics around a take (MOTION 6; founder report on TestFlight build 1; device row S1-82). One tick to start, one
 * to stop, and nothing between them: iOS mutes haptics while the session records (expo-audio never allows them), and
 * if one ever played the microphone would hear it. Node cannot load React Native, so the screens are checked in their
 * source, as listen.test.ts does. The pure check is `hapticsInTake`, run on the source with comments removed.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { startTake, type MicPermission, type StartDeps } from '../src/components/capture/listen.logic';
import { createStartTick } from '../src/components/capture/start-tick.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const listen = code(src('app/listen.tsx'));
const logic = code(src('components/capture/listen.logic.ts'));
/** Listen's one start haptic: handed to listen.logic startTake, which plays it before the session goes live. */
const PRESS = "pressHaptic: () => startTick.press(() => haptic('press'))";
const tonight = code(src('app/(tabs)/index.tsx'));

/** The body of `const <name> = ...` up to the next top-level `const ` in the component (two-space indent). */
function body(c: string, name: string): string {
  const from = c.indexOf(`  const ${name} = `);
  if (from < 0) throw new Error(`no ${name}`);
  const next = c.indexOf('\n  const ', from + 1);
  return c.slice(from, next < 0 ? undefined : next);
}

/**
 * Every haptic Listen can play, by where it sits: a call `haptic(...)` or a Button's `haptic=` prop. Each must be
 * outside the take: the start only as startTake's pressHaptic (which startTake plays before the gate opens and the
 * session goes live, pinned below), the stop after finalizeTake, Let it go after the stop. A missing anchor fails.
 */
function hapticsInTake(c: string): string[] {
  const bad: string[] = [];
  // A Button with a haptic prop plays on press: Pause, Finish and Let it go are pressed during the take.
  if (/\shaptic=/.test(c)) bad.push('a Button haptic prop');
  for (const m of c.matchAll(/haptic\('(\w+)'\)/g)) {
    const at = m.index!;
    const before = c.slice(0, at);
    // The component-level function it sits in (its nested consts are indented further).
    const fn = /^\n {2}const (\w+) = /.exec(before.slice(before.lastIndexOf('\n  const ')))?.[1] ?? '?';
    const f = body(c, fn);
    const i = f.indexOf(m[0]);
    // Each anchor must be found: a missing one is a failure, never a pass (indexOf -1 would make "after" vacuous).
    const found = (anchor: string) => {
      const k = f.indexOf(anchor);
      if (k < 0) bad.push(`no ${anchor} in ${fn}`);
      return k;
    };
    // Start: only as startTake's pressHaptic, which startTake plays before the session (pinned below).
    if (fn === 'start') {
      const k = found(PRESS);
      if (k >= 0 && i === k + PRESS.indexOf("haptic('press')")) continue;
    }
    if (fn === 'endTake' && i > found('finalizeTake(')) continue; // after it ends (await finalizeTake, or inside finishWithin)
    if (fn === 'discard' && i > found('abandonTake(') && i > found("setAudioMode('idle')")) continue; // after it stops
    bad.push(`${m[0]} in ${fn}`);
  }
  return bad;
}

describe('no haptic while the recorder is recording (MOTION 6)', () => {
  it('every haptic on Listen is before the session starts or after it ends', () => {
    expect(hapticsInTake(listen)).toEqual([]);
  });

  it('pause and resume are silent: they happen inside the take', () => {
    expect(body(listen, 'togglePause')).not.toMatch(/haptic/);
  });

  it('the check catches a haptic inside the take (the build 1 pause tick, a Finish prop, a tick after record)', () => {
    const tick = listen.replace('  const togglePause = () => {\n', "  const togglePause = () => {\n    haptic('tap');\n");
    expect(hapticsInTake(tick)).toEqual(["haptic('tap') in togglePause"]);
    expect(hapticsInTake(listen.replace('onPress={finish}', 'onPress={finish} haptic="press"'))).toEqual(['a Button haptic prop']);
    const late = listen.replace(PRESS, 'pressHaptic: () => {}').replace('    takeId.current = out.draftId;\n', "    takeId.current = out.draftId;\n    haptic('press');\n");
    expect(late).not.toBe(listen);
    expect(hapticsInTake(late)).toEqual([`no ${PRESS} in start`, "haptic('press') in start"]);
  });
});

describe('one start tick, not two', () => {
  it("Speak plays the start tick, then opens Listen, whose start goes through createStartTick", () => {
    expect(tonight).toMatch(/<Button size="capture" icon=\{MicrophoneIcon\} label=\{t\.speakButton\} haptic="press" onPress=\{\(\) => start\('spoken'\)\} \/>/);
    expect(tonight).toMatch(/if \(mode === 'spoken'\) armListenStart\(\);/);
    // Listen knows Speak opened it (consumeListenStart, read once) and hands that to the tick rule.
    expect(listen).toMatch(/const startTick = useRef\(createStartTick\(tapped\.current\)\)\.current;/);
    const start = body(listen, 'start');
    expect(start.match(/haptic\(/g)).toHaveLength(1);
    expect(start).toContain(PRESS);
    // A start that ends without a take resets it, so Try again is the parent's own tick.
    expect(start).toMatch(/if \(out\.kind === 'blocked'\) \{\s*startTick\.reset\(\);[^\n]*\n\s*return setPhase\(out\.problem\);/);
    expect(body(listen, 'startFromTap')).toMatch(/start\(primed\)\.catch\(async \(\) => \{\s*startTick\.reset\(\);/);
    // The primer is part of the same start: no reset there.
    expect(start).toMatch(/if \(out\.kind === 'primer'\) return setPhase\('primer'\);/);
    expect(listen).toMatch(/onPress=\{begin\}/);
    expect(listen).toMatch(/tryAgain: begin/);
    expect(listen).toMatch(/const continueAfterPrimer = \(\) => startFromTap\(true\);/);
  });

  it('startTake plays the start haptic once, before the gate opens and the session goes live', () => {
    const fn = logic.slice(logic.indexOf('export async function startTake('), logic.indexOf('\n}\n', logic.indexOf('export async function startTake(')));
    const press = fn.indexOf('d.pressHaptic();');
    expect(press).toBeGreaterThanOrEqual(0);
    expect(fn.match(/d\.pressHaptic\(\)/g)).toHaveLength(1);
    for (const later of ['d.openTake()', 'd.setRecordingMode()', 'd.begin()']) {
      expect(fn.indexOf(later), later).toBeGreaterThan(press);
    }
  });
});

/** One take started through listen.logic startTake, with the screen's tick rule: what the parent feels, in order. */
describe('one tick per take, counting Speak (startTake with the tick rule)', () => {
  type Perm = MicPermission;
  const granted: Perm = { granted: true, status: 'granted' } as Perm;
  const undetermined: Perm = { granted: false, status: 'undetermined' } as Perm;
  const denied: Perm = { granted: false, status: 'denied' } as Perm;

  /** A Listen screen: `speak` when Speak opened it (and played its own tick). Returns a start like the screen's. */
  function screen(speak: boolean, perms: { now: Perm[]; asked?: Perm }) {
    const felt: string[] = speak ? ['tick (Speak)'] : [];
    const tick = createStartTick(speak);
    let n = 0;
    const deps = (): StartDeps => ({
      alive: () => true,
      getPermission: async () => perms.now[Math.min(n++, perms.now.length - 1)],
      requestPermission: async () => perms.asked ?? granted,
      freeBytes: () => null,
      pressHaptic: () => tick.press(() => felt.push('tick')),
      setRecordingMode: async () => void felt.push('session live'),
      setIdleMode: async () => {},
      openTake: () => 1,
      closeTake: () => {},
      onToken: () => {},
      begin: async () => ({ id: 'take-asha' }),
      keepOrphan: () => {},
    });
    const start = async (primed: boolean) => {
      const out = await startTake(deps(), primed);
      if (out.kind === 'blocked') tick.reset();
      return out.kind;
    };
    return { felt, start };
  }

  it('Speak, then the take: one tick, before the session', async () => {
    const s = screen(true, { now: [granted] });
    expect(await s.start(false)).toBe('live');
    expect(s.felt).toEqual(['tick (Speak)', 'session live']);
  });

  it('fresh install: Speak, the primer, Continue: still one tick for the take', async () => {
    const s = screen(true, { now: [undetermined], asked: granted });
    expect(await s.start(false)).toBe('primer'); // Listen's automatic start stops at the primer
    expect(await s.start(true)).toBe('live'); // Continue
    expect(s.felt).toEqual(['tick (Speak)', 'session live']);
  });

  it("opened another way: the circle plays the take's one tick, and with the primer it is Continue's", async () => {
    const a = screen(false, { now: [granted] });
    expect(await a.start(false)).toBe('live');
    expect(a.felt).toEqual(['tick', 'session live']);
    const b = screen(false, { now: [undetermined], asked: granted });
    expect(await b.start(false)).toBe('primer');
    expect(await b.start(true)).toBe('live');
    expect(b.felt).toEqual(['tick', 'session live']);
  });

  it("Speak, the microphone off, then Try again once it is on: Try again is the parent's own tap and plays the tick", async () => {
    const s = screen(true, { now: [denied, granted], asked: denied });
    expect(await s.start(false)).toBe('blocked');
    expect(await s.start(false)).toBe('live');
    expect(s.felt).toEqual(['tick (Speak)', 'tick', 'session live']);
  });
});

describe('the stop tick, and the check itself', () => {
  it('stop plays one tick, after the session ends', () => {
    const end = body(listen, 'endTake');
    expect(end.match(/haptic\(/g)).toHaveLength(1);
    const stop = end.indexOf('finalizeTake(');
    expect(stop).toBeGreaterThanOrEqual(0);
    expect(end.indexOf("haptic('press')")).toBeGreaterThan(stop);
  });

  it('a missing anchor fails the check rather than passing it', () => {
    const renamed = listen.replace(/finalizeTake\(recorder, id, reason/, 'saveTake(recorder, id, reason');
    expect(hapticsInTake(renamed)).toContain('no finalizeTake( in endTake');
    const early = listen.replace('  const endTake = async (reason: StopReason) => {\n', "  const endTake = async (reason: StopReason) => {\n    haptic('press');\n");
    expect(early).not.toBe(listen);
    expect(hapticsInTake(early)).toContain("haptic('press') in endTake");
  });
});
