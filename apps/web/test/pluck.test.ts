/** The plucked-string model is pure, so it is tested without any audio device. See src/film/sound/pluck.ts. */
import { describe, expect, it } from 'vitest';
import { renderPluck, sitarSpec, tanpuraSpec, type PluckSpec } from '../src/film/sound/pluck';

const RATE = 32000;
function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2147483648 - 1;
  };
}
const base = (hz: number, over: Partial<PluckSpec> = {}): PluckSpec => ({ ...sitarSpec(hz, RATE, seeded(3), 0.55), ...over });

/** Pitch by autocorrelation with a parabolic peak, over [t0, t0 + 0.25 s]. */
function pitchOf(x: Float32Array, hz: number, t0 = 0.25): number {
  const n = Math.floor(RATE * 0.25);
  const s = Math.floor(RATE * t0);
  const lo = Math.floor(RATE / (hz * 1.12));
  const hi = Math.ceil(RATE / (hz * 0.89));
  const ac = (lag: number) => {
    let a = 0;
    for (let i = 0; i < n; i++) a += x[s + i] * x[s + i + lag];
    return a;
  };
  let best = lo;
  let bv = -Infinity;
  for (let l = lo; l <= hi; l++) {
    const v = ac(l);
    if (v > bv) {
      bv = v;
      best = l;
    }
  }
  const y0 = ac(best - 1);
  const y1 = ac(best);
  const y2 = ac(best + 1);
  const off = (0.5 * (y0 - y2)) / (y0 - 2 * y1 + y2);
  return RATE / (best + off);
}
const cents = (a: number, b: number) => 1200 * Math.log2(a / b);
const rmsDb = (x: Float32Array, t: number, len = 0.1) => {
  const s = Math.floor(RATE * t);
  const n = Math.floor(RATE * len);
  let a = 0;
  for (let i = 0; i < n; i++) a += x[s + i] ** 2;
  return 10 * Math.log10(a / n + 1e-20);
};
/** Energy at 1.5 to 5 kHz (Goertzel bins every 100 Hz) in a window. */
function upperEnergy(x: Float32Array, t: number, len = 0.1): number {
  const s = Math.floor(RATE * t);
  const n = Math.floor(RATE * len);
  let tot = 0;
  for (let f = 1500; f <= 5000; f += 100) {
    const w = (2 * Math.PI * f) / RATE;
    const c = 2 * Math.cos(w);
    let q1 = 0;
    let q2 = 0;
    for (let i = 0; i < n; i++) {
      const q0 = c * q1 - q2 + x[s + i];
      q2 = q1;
      q1 = q0;
    }
    tot += q1 * q1 + q2 * q2 - c * q1 * q2;
  }
  return tot / (n * n);
}

describe('plucked string model', { timeout: 30_000 }, () => {
  it('is in tune across the melody range: within 4 cents without the buzz, 10 cents with it', () => {
    for (const hz of [220, 293.66, 440, 587.33, 739.99, 987.77]) {
      expect(Math.abs(cents(pitchOf(renderPluck(base(hz, { buzz: 0 })), hz), hz)), `${hz} Hz clean`).toBeLessThan(4);
      expect(Math.abs(cents(pitchOf(renderPluck(base(hz)), hz), hz)), `${hz} Hz buzzing`).toBeLessThan(10);
    }
  });

  it('is in tune for the drone strings too', () => {
    for (const hz of [146.83, 220.25, 293.66]) {
      const x = renderPluck(tanpuraSpec(hz, 24000, 5));
      const n = 6000;
      const s = 12000;
      const ac = (lag: number) => {
        let a = 0;
        for (let i = 0; i < n; i++) a += x[s + i] * x[s + i + lag];
        return a;
      };
      let best = Math.floor(24000 / (hz * 1.1));
      let bv = -Infinity;
      for (let l = best; l <= Math.ceil(24000 / (hz * 0.9)); l++) if (ac(l) > bv) ((bv = ac(l)), (best = l));
      const y0 = ac(best - 1);
      const y1 = ac(best);
      const y2 = ac(best + 1);
      const f = 24000 / (best + (0.5 * (y0 - y2)) / (y0 - 2 * y1 + y2));
      expect(Math.abs(cents(f, hz))).toBeLessThan(10);
    }
  });

  it('is deterministic for a seed and different for another', () => {
    const a = renderPluck(base(330, { seed: 1 }));
    const b = renderPluck(base(330, { seed: 1 }));
    const c = renderPluck(base(330, { seed: 2 }));
    expect(Array.from(a.slice(0, 2000))).toEqual(Array.from(b.slice(0, 2000)));
    expect(Array.from(a.slice(0, 2000))).not.toEqual(Array.from(c.slice(0, 2000)));
  });

  it('is finite, peak-normalised, starts and ends at (nearly) zero so a note cannot click, and decays', () => {
    for (const spec of [base(247), base(587, { buzz: 1.5 }), { ...tanpuraSpec(146.83, 24000, 1) }]) {
      const x = renderPluck(spec);
      let peak = 0;
      let bad = 0;
      for (const v of x) {
        if (!Number.isFinite(v)) bad++;
        peak = Math.max(peak, Math.abs(v));
      }
      expect(bad).toBe(0);
      expect(peak).toBeCloseTo(1, 5);
      expect(Math.abs(x[0])).toBeLessThan(0.02);
      expect(Math.abs(x[x.length - 1])).toBeLessThan(1e-3);
    }
    const x = renderPluck(base(330));
    expect(rmsDb(x, 3) - rmsDb(x, 0.3)).toBeLessThan(-20);
  });

  it('rings for seconds (about 4 s to fall 60 dB for the whole sound), not a click', () => {
    const x = renderPluck(base(330));
    expect(rmsDb(x, 2) - rmsDb(x, 0.1)).toBeGreaterThan(-45);
    expect(rmsDb(x, 2) - rmsDb(x, 0.1)).toBeLessThan(-15);
  });

  it('the jawari layer adds upper partials that carry on after the attack', () => {
    const clean = renderPluck(base(330, { buzz: 0, seed: 9 }));
    const buzzy = renderPluck(base(330, { buzz: 1.2, seed: 9 }));
    for (const t of [0.3, 0.6, 1.0]) expect(upperEnergy(buzzy, t)).toBeGreaterThan(upperEnergy(clean, t) * 3);
  });

  it('the buzz keeps the upper partials alive: from 0.06 s to 0.5 s they fall at least 6 dB less than without it, at every pitch', () => {
    for (const hz of [247, 330, 440, 587, 740]) {
      const fall = (x: Float32Array) => 10 * Math.log10(upperEnergy(x, 0.5) / upperEnergy(x, 0.06));
      const buzzy = renderPluck(base(hz, { seed: 4 }));
      const clean = renderPluck(base(hz, { seed: 4, buzz: 0 }));
      expect(fall(buzzy) - fall(clean), `${hz} Hz`).toBeGreaterThan(6);
    }
  });

  it('is cheap enough to make on a phone in one go: a sitar note is under 200 k samples', () => {
    expect(renderPluck(base(330)).length).toBeLessThan(200_000);
  });
});
