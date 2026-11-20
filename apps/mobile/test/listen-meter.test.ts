/// <reference types="node" />
/**
 * The voice level on Listen, off React state (listening-cue.md section 2; founder report on TestFlight build 1; device
 * row S1-83). Build 1 polled the recorder through useAudioRecorderState every 50 ms, so the whole screen re-rendered up
 * to 20 times a second, and the level reached the aura only afterwards, in an effect. Now the level goes straight into
 * the aura's shared value, the screen reads the recorder every 250 ms and re-renders only when the shown second
 * changes (about once a second, never skipping one), and the aura spends no frame at rest.
 * The pure parts run here; the screens' use of them is checked in their source (Node cannot load React Native).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import {
  CLOCK_MS,
  METER_MS,
  METER_SILENT,
  PAUSED_OPACITY,
  PROGRESS_MS,
  auraRestOpacity,
  auraRunsFrames,
  clockChanged,
  meterDb,
  progressMark,
  type ClockStatus,
} from '../src/components/capture/listen-meter.logic';
import { elapsedClock } from '../src/components/capture/listen.logic';
import type { AuraState } from '../src/components/capture/listening-aura';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const listen = code(src('app/listen.tsx'));
const aura = code(src('components/capture/listening-aura.tsx'));

describe('the level (pure)', () => {
  it('reads at 20 Hz into the aura; the clock every 250 ms, under a second so it can never skip one', () => {
    expect(METER_MS).toBe(50);
    expect(CLOCK_MS).toBe(250);
    expect(CLOCK_MS).toBeLessThan(1000);
    expect(PROGRESS_MS).toBe(5000);
  });

  const at = (durationMillis: number, more: Partial<ClockStatus> = {}): ClockStatus => ({
    canRecord: true,
    isRecording: true,
    durationMillis,
    mediaServicesDidReset: false,
    metering: -30,
    url: 'file:///take.m4a',
    ...more,
  });

  it('a reading re-renders only when the shown second or the recorder state changes, never for the level', () => {
    expect(clockChanged(at(1_000), at(1_999))).toBe(false);
    expect(clockChanged(at(1_999), at(2_000))).toBe(true);
    expect(clockChanged(at(1_200), at(1_250, { metering: -5 }))).toBe(false);
    expect(clockChanged(at(1_200), at(1_200, { isRecording: false }))).toBe(true);
    expect(clockChanged(at(1_200), at(1_200, { canRecord: false }))).toBe(true);
    expect(clockChanged(at(1_200), at(1_200, { mediaServicesDidReset: true }))).toBe(true);
    expect(clockChanged(at(1_200), at(1_200, { url: null }))).toBe(true);
  });

  it('over a 10-minute take read by a late-firing 250 ms timer, the clock shows every second once and re-renders about once a second', () => {
    // A repeating JS timer fires a little late each time (to the next frame): up to 16 ms here, never aligned to the
    // take's start. (Review A on #630: at 1000 ms such a timer skips a second every couple of minutes.)
    let shown = at(0);
    let renders = 0;
    const seen = new Set<string>([elapsedClock(0)]);
    let t = 137;
    let k = 0;
    while (t < 600_500) {
      const next = at(t, { metering: -60 + (k % 40) });
      if (clockChanged(shown, next)) {
        // Each change moves the clock one second on, never two.
        expect(Math.floor(next.durationMillis / 1000) - Math.floor(shown.durationMillis / 1000)).toBe(1);
        shown = next;
        renders++;
        seen.add(elapsedClock(t));
      }
      t += CLOCK_MS + ((k * 7) % 17);
      k++;
    }
    expect(seen.size).toBe(601); // 0:00 to 10:00, each shown once
    expect(renders).toBe(600); // one a second, against 20 a second before
  });

  it('a reading passes through; none, or not a number, is silence, so the aura keeps its idle breath', () => {
    expect(meterDb(-23.5)).toBe(-23.5);
    expect(meterDb(0)).toBe(0);
    for (const none of [undefined, null, Number.NaN, Number.POSITIVE_INFINITY]) expect(meterDb(none)).toBe(METER_SILENT);
    expect(METER_SILENT).toBe(-160);
  });

  it('the 5 s progress mark is written once per mark, at a once-a-second reading (never missed between readings)', () => {
    let saved = 0;
    const written: number[] = [];
    // Readings once a second, a little off the whole second, as a timer gives them.
    for (let t = 37; t <= 21_000; t += 1003) {
      const mark = progressMark(saved, t);
      if (mark !== null) {
        saved = mark;
        written.push(t);
      }
    }
    expect(written.map((t) => Math.floor(t / PROGRESS_MS))).toEqual([1, 2, 3, 4]);
    expect(progressMark(4, 24_999)).toBeNull();
    expect(progressMark(0, 4_999)).toBeNull();
  });

  it('the aura runs frames only while it follows the voice or releases at the end, and never under Reduce Motion', () => {
    const states: AuraState[] = ['ready', 'idle', 'listening', 'paused', 'processing'];
    expect(states.filter((s) => auraRunsFrames(s, false))).toEqual(['listening', 'processing']);
    expect(states.filter((s) => auraRunsFrames(s, true))).toEqual([]);
  });

  it('at rest the glow holds still: none before a take, dim while paused, its floor otherwise (as the frame callback set it)', () => {
    const min = tokens.motion.breath.opacityMin;
    expect(auraRestOpacity('ready', min)).toBe(0);
    expect(auraRestOpacity('paused', min)).toBe(PAUSED_OPACITY);
    expect(PAUSED_OPACITY).toBe(0.12);
    expect(auraRestOpacity('idle', min)).toBe(min);
  });
});

describe('Listen does not re-render for the voice (source)', () => {
  it("the recorder state comes from useRecorderClock (re-renders on the shown second), not expo-audio's 50 ms hook", () => {
    expect(listen).toMatch(/const status = useRecorderClock\(recorder\);/);
    expect(listen).not.toMatch(/useAudioRecorderState/);
    const hook = code(src('components/capture/use-recorder-clock.ts'));
    expect(hook).toMatch(/export function useRecorderClock\(recorder: AudioRecorder, interval: number = CLOCK_MS\): RecorderState/);
    expect(hook).toMatch(/setState\(\(prev\) => \(clockChanged\(prev, next\) \? next : prev\)\);/);
    expect(hook).toMatch(/\}, interval\);\s*return \(\) => clearInterval\(read\);/);
  });

  it('an interruption is checked when the recorder stops, not only when the clock moves', () => {
    expect(listen).toMatch(/\}, \[status\.durationMillis, status\.isRecording, phase, recorder\]\);/);
  });

  it("the level is read from the recorder on a 50 ms timer straight into the aura's shared value", () => {
    const meter = listen.slice(listen.indexOf('const read = setInterval('), listen.indexOf('}, [phase, recorder, db]);'));
    expect(meter).toMatch(/metering = recorder\.getStatus\(\)\.metering;/);
    expect(meter).toMatch(/db\.value = meterDb\(metering\);\s*\}, METER_MS\);/);
    expect(meter).toMatch(/clearInterval\(read\);\s*db\.value = METER_SILENT;/);
    // No set-state call in the timer.
    expect(meter).not.toMatch(/\bset(?!Interval)[A-Z]\w*\(/);
    // Only while recording; paused, finishing and ready read nothing.
    expect(listen).toMatch(/db\.value = METER_SILENT;\s*if \(phase !== 'recording'\) return;\s*const read = setInterval\(/);
  });

  it('nothing hangs the level on React state any more (the build 1 effect on status.metering is gone)', () => {
    expect(listen).not.toMatch(/\[status\.metering/);
    expect(listen).not.toMatch(/db\.value = [^;]*status\.metering/);
  });

  it('the 5 s progress write uses the mark, so a once-a-second reading never misses one', () => {
    expect(listen).toMatch(/progressMark\(savedMark\.current, status\.durationMillis\)/);
    expect(listen).not.toMatch(/\(status\.durationMillis - 50\) \/ 5000/);
  });
});

describe('the aura spends no frame at rest (source)', () => {
  it('its frame callback starts only when it runs, and is switched on and off with the state', () => {
    expect(aura).toMatch(/const runs = auraRunsFrames\(state, reduced\);/);
    expect(aura).toMatch(/const frames = useFrameCallback\(\(f\) => \{[\s\S]*\}, runs\);/);
    expect(aura).toMatch(/frames\.setActive\(runs\);/);
  });

  it('the paused glow has one source (PAUSED_OPACITY), in the frame callback and at rest', () => {
    expect(aura).toMatch(/opacity\.value = ready\.value \? 0 : paused\.value \? PAUSED_OPACITY : B\.opacityMin;/);
    expect(aura).not.toMatch(/0\.12/);
  });

  it('at rest it sets the still values the callback used to hold every frame', () => {
    expect(aura).toMatch(/if \(!runs\) \{\s*s\.value = 0;\s*idleW\.value = 0;\s*quietMs\.value = 0;\s*scale\.value = 1;\s*opacity\.value = auraRestOpacity\(state, B\.opacityMin\);\s*\}/);
  });
});
