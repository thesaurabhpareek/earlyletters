/** The scroll-to-sound mapping is pure, so it is tested without any audio. See src/film/sound/ambient-map.ts. */
import { describe, expect, it } from 'vitest';
import {
  AMBIENT_DEFAULT_ON,
  CHORDS,
  MASTER_BASE,
  MASTER_MAX,
  STORAGE_KEY,
  CROSSFADE_SECONDS,
  TONE_EVERY_SECONDS,
  ambientParams,
  asTone,
  chordIndexAt,
  energyFromSpeed,
  initialWanted,
  readChoice,
  scrollProgress,
  smoothEnergy,
  toggleView,
  writeChoice,
} from '../src/film/sound/ambient-map';

describe('ambient sound mapping', () => {
  it('is on by default, and the master level stays quiet', () => {
    expect(AMBIENT_DEFAULT_ON).toBe(true);
    expect(MASTER_BASE).toBeGreaterThanOrEqual(0.05);
    expect(MASTER_MAX).toBeLessThanOrEqual(0.4);
    for (const tone of ['night', 'paper', 'dusk'] as const)
      for (const energy of [0, 0.3, 1, 5, -2, NaN]) {
        const g = ambientParams({ energy, progress: 0.5, tone }).masterGain;
        expect(g).toBeGreaterThanOrEqual(MASTER_BASE);
        expect(g).toBeLessThanOrEqual(MASTER_MAX);
      }
  });

  it('turns scroll speed into a soft, bounded energy', () => {
    expect(energyFromSpeed(0)).toBe(0);
    expect(energyFromSpeed(-800)).toBeCloseTo(energyFromSpeed(800));
    expect(energyFromSpeed(300)).toBeLessThan(energyFromSpeed(1500));
    expect(energyFromSpeed(1500)).toBeLessThan(energyFromSpeed(6000));
    expect(energyFromSpeed(1e9)).toBeLessThanOrEqual(1);
  });

  it('rises quickly and falls back slowly, and never overshoots', () => {
    let up = 0;
    for (let i = 0; i < 5; i++) up = smoothEnergy(up, 1, 0.12); // 0.6 s of scrolling
    let down = up;
    for (let i = 0; i < 5; i++) down = smoothEnergy(down, 0, 0.12); // 0.6 s of stillness
    expect(up).toBeGreaterThan(0.6);
    expect(up).toBeLessThanOrEqual(1);
    expect(down).toBeGreaterThan(up * 0.6); // still easing, not snapped back
    let calm = up;
    for (let i = 0; i < 200; i++) calm = smoothEnergy(calm, 0, 0.12); // 24 s
    expect(calm).toBeLessThan(0.01);
    expect(smoothEnergy(0.5, 0.5, 0.12)).toBeCloseTo(0.5);
  });

  it('opens the filter and lifts the level with scroll energy, and eases back to calm', () => {
    const calm = ambientParams({ energy: 0, progress: 0.3, tone: 'night' });
    const busy = ambientParams({ energy: 1, progress: 0.3, tone: 'night' });
    expect(busy.cutoffHz).toBeGreaterThan(calm.cutoffHz + 1000);
    expect(busy.masterGain).toBeGreaterThan(calm.masterGain);
    expect(busy.reverbWet).toBeGreaterThan(calm.reverbWet);
    const mid = ambientParams({ energy: 0.5, progress: 0.3, tone: 'night' });
    expect(mid.cutoffHz).toBeGreaterThan(calm.cutoffHz);
    expect(mid.cutoffHz).toBeLessThan(busy.cutoffHz);
  });

  it('keeps the filter a warm lid: 900 to 1200 Hz at rest, never brighter than about 2.8 kHz', () => {
    for (const tone of ['night', 'paper', 'dusk'] as const) {
      const rest = ambientParams({ energy: 0, progress: 0, tone }).cutoffHz;
      expect(rest).toBeGreaterThanOrEqual(900);
      expect(rest).toBeLessThanOrEqual(1200);
      expect(ambientParams({ energy: 1, progress: 0, tone }).cutoffHz).toBeLessThan(2800);
    }
  });

  it('makes a firm scroll audible but gentle: more air, more reverb, more level, all within bounds', () => {
    for (const tone of ['night', 'paper', 'dusk'] as const) {
      const rest = ambientParams({ energy: 0, progress: 0.3, tone });
      const firm = ambientParams({ energy: 1, progress: 0.3, tone });
      expect(firm.airGain).toBeGreaterThan(rest.airGain);
      expect(firm.airGain).toBeLessThanOrEqual(0.25);
      expect(rest.airGain).toBeGreaterThanOrEqual(0.1);
      expect(firm.reverbWet).toBeGreaterThan(rest.reverbWet);
      expect(firm.masterGain).toBeLessThanOrEqual(0.35);
      // the designed level lift is about 3.3 dB, no more
      expect(20 * Math.log10(firm.masterGain / rest.masterGain)).toBeLessThan(3.5);
    }
  });

  it('lets the scene tone change brightness, air and reverb, but never pitch', () => {
    const at = (tone: 'night' | 'paper' | 'dusk') => ambientParams({ energy: 0, progress: 0.1, tone });
    expect(at('night').cutoffHz).toBeLessThan(at('dusk').cutoffHz);
    expect(at('dusk').cutoffHz).toBeLessThan(at('paper').cutoffHz);
    expect(at('night').airGain).toBeLessThan(at('paper').airGain);
    expect(at('night').reverbWet).toBeGreaterThan(at('paper').reverbWet);
    // Same notes whatever the tone: a tone change never moves a pitch (and so cannot beat).
    expect(at('night').voicesHz).toEqual(at('paper').voicesHz);
    expect(at('night').voicesHz).toEqual(at('dusk').voicesHz);
    expect(at('night').airHz).toBe(at('paper').airHz);
    for (const p of [0, 0.3, 0.6, 0.9])
      expect(ambientParams({ energy: 0, progress: p, tone: 'night' }).voicesHz).toEqual(ambientParams({ energy: 0, progress: p, tone: 'paper' }).voicesHz);
  });

  it('crossfades slowly between chords and rings a quiet chord tone only now and then', () => {
    expect(CROSSFADE_SECONDS).toBeGreaterThanOrEqual(8);
    expect(CROSSFADE_SECONDS).toBeLessThanOrEqual(12);
    expect(TONE_EVERY_SECONDS[0]).toBeGreaterThanOrEqual(20);
    expect(TONE_EVERY_SECONDS[1]).toBeLessThanOrEqual(40);
  });

  it('drifts through the chords as the film goes down, and stays in range', () => {
    expect(chordIndexAt(0)).toBe(0);
    expect(chordIndexAt(1)).toBe(CHORDS.length - 1);
    expect(chordIndexAt(-3)).toBe(0);
    expect(chordIndexAt(9)).toBe(CHORDS.length - 1);
    expect(chordIndexAt(NaN)).toBe(0);
    const seen = [0, 0.3, 0.6, 0.9].map((p) => chordIndexAt(p));
    expect(new Set(seen).size).toBe(CHORDS.length);
    expect([...seen].sort()).toEqual(seen); // never goes backwards as progress grows
    const a = ambientParams({ energy: 0, progress: 0.05, tone: 'night' });
    const b = ambientParams({ energy: 0, progress: 0.6, tone: 'night' });
    expect(a.voicesHz).not.toEqual(b.voicesHz);
  });

  it('keeps every voice in a calm register', () => {
    for (const tone of ['night', 'paper', 'dusk'] as const)
      for (let p = 0; p <= 1; p += 0.1) {
        const r = ambientParams({ energy: 1, progress: p, tone });
        // About an octave up from the first version: nothing under 250 Hz (phone speakers), nothing shrill.
        for (const hz of [...r.voicesHz, r.airHz]) {
          expect(hz).toBeGreaterThan(250);
          expect(hz).toBeLessThan(1300);
        }
        expect(r.airGain).toBeGreaterThanOrEqual(0.1);
        expect(r.airGain).toBeLessThanOrEqual(0.25);
      }
  });

  it('measures progress and reads tones safely', () => {
    expect(scrollProgress(0, 5000, 1000)).toBe(0);
    expect(scrollProgress(2000, 5000, 1000)).toBe(0.5);
    expect(scrollProgress(9000, 5000, 1000)).toBe(1);
    expect(scrollProgress(10, 800, 1000)).toBe(0);
    expect(asTone('paper')).toBe('paper');
    expect(asTone('nonsense')).toBe('night');
    expect(asTone(undefined)).toBe('night');
  });
});

describe('ambient sound choice', () => {
  const store = (initial: Record<string, string> = {}) => {
    const data = { ...initial };
    return { getItem: (k: string) => data[k] ?? null, setItem: (k: string, v: string) => void (data[k] = v), data };
  };

  it('starts on by default, follows a remembered choice, and never auto-starts with reduced motion', () => {
    expect(initialWanted(null, false)).toBe(true);
    expect(initialWanted(null, false, false)).toBe(false);
    expect(initialWanted(false, false)).toBe(false);
    expect(initialWanted(true, false, false)).toBe(true);
    expect(initialWanted(null, true)).toBe(false);
    expect(initialWanted(true, true)).toBe(false);
  });

  it('remembers the choice and survives storage that throws', () => {
    const s = store();
    expect(readChoice(s)).toBeNull();
    writeChoice(s, false);
    expect(s.data[STORAGE_KEY]).toBe('off');
    expect(readChoice(s)).toBe(false);
    writeChoice(s, true);
    expect(readChoice(s)).toBe(true);
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readChoice(broken)).toBeNull();
    expect(() => writeChoice(broken, true)).not.toThrow();
    expect(readChoice(null)).toBeNull();
    expect(readChoice(store({ [STORAGE_KEY]: 'junk' }))).toBeNull();
  });

  it('shows "on" only while the sound is really playing', () => {
    expect(toggleView(true, true)).toBe('on');
    expect(toggleView(true, false)).toBe('blocked');
    expect(toggleView(false, false)).toBe('off');
    expect(toggleView(false, true)).toBe('on');
  });
});
