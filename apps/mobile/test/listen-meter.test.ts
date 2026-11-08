/// <reference types="node" />
/**
 * The voice level on Listen, off React state (listening-cue.md section 2; founder report on TestFlight build 1; device
 * row S1-83). Build 1 polled the recorder through useAudioRecorderState every 50 ms, so the whole screen re-rendered up
 * to 20 times a second, and the level reached the aura only afterwards, in an effect. Now the level goes straight into
 * the aura's shared value, the screen re-renders once a second for its clock, and the aura spends no frame at rest.
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
  PROGRESS_MS,
  auraRestOpacity,
  auraRunsFrames,
  meterDb,
  progressMark,
} from '../src/components/capture/listen-meter.logic';
import type { AuraState } from '../src/components/capture/listening-aura';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const listen = code(src('app/listen.tsx'));
const aura = code(src('components/capture/listening-aura.tsx'));

describe('the level (pure)', () => {
  it('reads at 20 Hz into the aura; the screen itself once a second', () => {
    expect(METER_MS).toBe(50);
    expect(CLOCK_MS).toBe(1000);
    expect(PROGRESS_MS).toBe(5000);
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
    expect(auraRestOpacity('paused', min)).toBe(0.12);
    expect(auraRestOpacity('idle', min)).toBe(min);
  });
});

describe('Listen does not re-render for the voice (source)', () => {
  it('the recorder state is polled once a second, never at 50 ms', () => {
    expect(listen).toMatch(/const status = useAudioRecorderState\(recorder, CLOCK_MS\);/);
    expect(listen.match(/useAudioRecorderState\(/g)).toHaveLength(1);
    expect(listen).not.toMatch(/useAudioRecorderState\(recorder, 50\)/);
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

  it('at rest it sets the still values the callback used to hold every frame', () => {
    expect(aura).toMatch(/if \(!runs\) \{\s*s\.value = 0;\s*idleW\.value = 0;\s*quietMs\.value = 0;\s*scale\.value = 1;\s*opacity\.value = auraRestOpacity\(state, B\.opacityMin\);\s*\}/);
  });
});
