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

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const listen = code(src('app/listen.tsx'));
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
 * outside the take: before the session starts recording, or after it has ended.
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
    if (fn === 'start' && i < found("setAudioMode('recording')")) continue; // before the session
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
    const late = listen.replace("    if (tick) haptic('press');\n", '').replace('    takeId.current = draft.id;\n', "    takeId.current = draft.id;\n    haptic('press');\n");
    expect(hapticsInTake(late)).toEqual(["haptic('press') in start"]);
  });
});

describe('one start tick, not two', () => {
  it("Speak plays the start tick, then opens Listen, which starts the microphone without a second one", () => {
    expect(tonight).toMatch(/<Button size="capture" icon=\{MicrophoneIcon\} label=\{t\.speakButton\} haptic="press" onPress=\{\(\) => start\('spoken'\)\} \/>/);
    expect(tonight).toMatch(/if \(mode === 'spoken'\) armListenStart\(\);/);
    // Listen knows Speak opened it (consumeListenStart) and its first start plays no tick.
    expect(listen).toMatch(/const speakTicked = useRef\(tapped\.current\);/);
    const start = body(listen, 'start');
    expect(start.match(/haptic\(/g)).toHaveLength(1);
    expect(start).toMatch(/if \(tick\) haptic\('press'\);/);
  });

  it("only the first start is Speak's: the circle and Try again, even after a blocked first start, play the tick", () => {
    const start = body(listen, 'start');
    // Cleared before any early return (no child, microphone off, phone full), so a retry is never silent.
    expect(start).toMatch(/const start = async \(\) => \{\s*const tick = !speakTicked\.current;\s*speakTicked\.current = false;\s*if \(!child\) return;/);
    expect(start.indexOf('speakTicked.current = false')).toBeLessThan(start.indexOf('startBlocker('));
    expect(listen).toMatch(/onPress=\{begin\}/);
    expect(listen).toMatch(/tryAgain: begin/);
  });

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
