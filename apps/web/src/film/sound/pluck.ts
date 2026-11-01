/**
 * A plucked string, computed in plain TypeScript: Karplus-Strong (a delay line with a filtered-noise burst and a
 * lossy loop filter) plus a "jawari" stage. Pure and deterministic given a seed, so it is unit-tested and measured
 * without any Web Audio. The engine (ambient-engine.ts) calls it to fill a short AudioBuffer at run time, on the
 * visitor's device. Nothing is recorded, sampled or downloaded: the buffer is made from numbers.
 *
 * Model, and what each part is for (details and sources in docs/web/ambient-sound.md):
 *  1. Excitation: noise, rounded by a one-pole low-pass, then a comb that removes the harmonics which have a node at
 *     the pluck point (pluck close to the bridge = bright and nasal). Karplus and Strong 1983; Jaffe and Smith 1983.
 *  2. Loop: y[n] = rho * (w*y[n-N] + (1-w)*y[n-N-1]), a two-point average that makes high partials die first (as
 *     in a real string), tuned with a first-order all-pass so the pitch is right to well under a cent at the fundamental.
 *  3. Jawari: the sitar and tanpura bridges are slightly convex, so the swinging string touches the bridge and the
 *     string's length changes with every swing; this brings out a bright series of overtones, and as the vibration
 *     weakens the contact point moves and the buzz carries on (CV Raman's observations of the tanpura; the tanpura
 *     article on Wikipedia; Siddiq 2012, who models the nonlinear collision and finds complex partial envelopes and
 *     descending formants). Here: a soft-clipped copy of the amplitude-normalised string, high-passed so it adds
 *     upper partials only, mixed back on a curve that rises over a few tenths of a second and falls slowly, and that
 *     follows the string's fading with a lag so the buzz carries on after the string has weakened. That shape, and
 *     its timings, are OUR design choice, not a measurement of a real sitar: no source read gives them. Measured
 *     (docs/web/ambient-sound.md): it keeps the 2 to 6 kHz band alive much longer; it does NOT reliably bloom (rise)
 *     after the pick; on some pitches it does and on others it does not.
 */

export type PluckSpec = {
  hz: number;
  /** Sample rate of the buffer to make. */
  rate: number;
  seconds: number;
  /** Time for the fundamental to fall 60 dB. */
  t60: number;
  /** 0..1: how bright the burst and the loop are. */
  bright: number;
  /** Where the string is plucked, as a fraction of its length (0.08 near the bridge, 0.2 nearer the middle). */
  pluckAt: number;
  /** Jawari: strength of the buzz layer relative to the string (0..1.5), and the drive of the saturator. */
  buzz: number;
  drive: number;
  /** Seconds for the buzz to bloom to its peak, and the time constant it fades with after that. */
  bloom: number;
  buzzFall: number;
  /** How slowly the buzz follows the string's fading, seconds: the buzz carries on after the string has weakened. */
  buzzHold?: number;
  /** Extra softening of the first instant, seconds (0 for a sharp sitar pluck, more for a tanpura). */
  soften: number;
  seed: number;
};

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 2147483648 - 1; // -1..1
  };
}

/** A soft saturator: the Pade approximant of tanh (exact enough here, and several times cheaper than Math.tanh). */
function softClip(x: number): number {
  if (x > 3) return 1;
  if (x < -3) return -1;
  const x2 = x * x;
  return (x * (27 + x2)) / (27 + 9 * x2);
}

/** Make the string's sound as mono samples, peak-normalised to 1, with a short fade in and a long fade out. */
export function renderPluck(spec: PluckSpec): Float32Array {
  const { hz, rate, seconds, t60, bright, pluckAt, buzz, drive, bloom, buzzFall, soften, seed } = spec;
  const M = Math.floor(rate * seconds);
  const out = new Float32Array(M);
  const L = rate / hz;
  const w = 0.62 + 0.36 * Math.min(1, Math.max(0, bright)); // weight of the newer sample: 0.62 darkest, 0.98 brightest
  const w0 = (2 * Math.PI * hz) / rate;
  // Phase delay of the two-point average at the fundamental.
  const tau1 = Math.atan2((1 - w) * Math.sin(w0), w + (1 - w) * Math.cos(w0)) / w0;
  const N = Math.max(2, Math.floor(L - tau1 - 0.5));
  const d = L - N - tau1; // fractional delay the all-pass must supply, in [0.5, 1.5)
  const a = Math.sin(((1 - d) * w0) / 2) / Math.sin(((1 + d) * w0) / 2);
  const rho = Math.pow(10, (-3 * (N + tau1 + d)) / (rate * Math.max(0.2, t60)));

  // 1. Excitation.
  const rnd = rng(seed);
  const len = N + 2;
  const ex = new Float64Array(len);
  const tone = 0.12 + 0.86 * bright; // one-pole coefficient: low = rounder burst
  let lp = 0;
  for (let i = 0; i < len; i++) {
    lp += (rnd() - lp) * tone;
    ex[i] = lp;
  }
  const k = Math.max(1, Math.round(pluckAt * len));
  let mean = 0;
  for (let i = 0; i < len; i++) {
    const v = ex[i] - (i >= k ? ex[i - k] : 0) * 0.9;
    out[i] = v;
    mean += v;
  }
  mean /= len;
  let rms = 0;
  for (let i = 0; i < len; i++) {
    out[i] -= mean;
    rms += out[i] * out[i];
  }
  const g0 = 1 / Math.sqrt(rms / len + 1e-12);
  for (let i = 0; i < len; i++) out[i] *= g0 * 0.5;

  // 2. The loop. The first N + 1 samples are the burst; every later one is made from the ones a period back.
  let vPrev = 0;
  let yPrev = 0;
  for (let n = 0; n < M; n++) {
    let v: number;
    if (n < len) v = out[n];
    else v = rho * (w * out[n - N] + (1 - w) * out[n - N - 1]);
    if (n >= len) {
      const y = a * v + vPrev - a * yPrev;
      out[n] = y;
      yPrev = y;
    } else yPrev = v;
    vPrev = v;
  }

  // 3. Jawari. A layer of buzz made from the string's own motion: normalise by a slow envelope (so the buzz keeps its
  // strength as the note decays), saturate hard with a slight asymmetry, keep only what is above a few times the pitch
  // (the grazing adds upper partials, not a fatter fundamental), and let it bloom in and fall away slowly.
  const release = Math.exp(-1 / (rate * 0.05));
  const slowRelease = Math.exp(-1 / (rate * Math.max(0.05, spec.buzzHold ?? 0.05)));
  let env = 0;
  let slow = 0;
  const b = Math.min(1.5, Math.max(0, buzz));
  const bias = 0.22;
  const hpA = Math.exp((-2 * Math.PI * Math.max(900, 3 * hz)) / rate);
  const flat = softClip(drive * bias);
  let hpY = 0;
  let satPrev = 0;
  let soft1 = 0;
  const bloomN = Math.floor(bloom * rate);
  const fallStep = Math.exp(-1 / (rate * buzzFall));
  let down = 1;
  const soft = Math.max(0, soften);
  for (let n = 0; n < M; n++) {
    const x = out[n];
    const ax = Math.abs(x);
    env = ax > env ? ax : env * release + ax * (1 - release);
    slow = ax > slow ? ax : slow * slowRelease + ax * (1 - slowRelease);
    const u = x / (env + 1e-4);
    const sat = softClip(drive * (u + bias)) - flat;
    hpY = hpA * (hpY + sat - satPrev);
    satPrev = sat;
    // Rises over `bloom` (cosine), then falls with time constant `buzzFall` (one multiply per sample).
    let gain = down;
    if (n < bloomN) gain = 0.5 - 0.5 * Math.cos((Math.PI * n) / bloomN);
    else down *= fallStep;
    let y = x + b * gain * hpY * slow;
    if (soft > 0 && n < soft * 6 * rate) {
      const t = n / rate;
      // A rounded start: low-pass that opens over the first moments.
      const c = 1 - Math.exp(-(0.05 + t / soft) * 0.6);
      soft1 += (y - soft1) * Math.min(1, c);
      y = soft1;
    }
    out[n] = y;
  }

  // Fades: 1.5 ms in (no click at a note's start), a long cosine out (no click where the buffer ends).
  const fin = Math.max(2, Math.floor(rate * 0.0015));
  for (let i = 0; i < fin && i < M; i++) out[i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fin);
  const fout = Math.min(M, Math.floor(rate * Math.min(0.6, seconds * 0.2)));
  for (let i = 0; i < fout; i++) out[M - 1 - i] *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fout);
  let peak = 0;
  for (let i = 0; i < M; i++) peak = Math.max(peak, Math.abs(out[i]));
  const s = peak > 0 ? 1 / peak : 1;
  for (let i = 0; i < M; i++) out[i] *= s;
  return out;
}

/** A sitar main-string pluck: bright, nasal (plucked near the bridge), buzz that blooms in about a third of a second. */
export function sitarSpec(hz: number, rate: number, rand: () => number, bright: number, sustain = 1): PluckSpec {
  return {
    hz,
    rate,
    seconds: 4.4 + 1.3 * (sustain - 1),
    t60: (6.2 + 1.4 * rand()) * sustain,
    bright: Math.min(1, Math.max(0, bright)),
    pluckAt: 0.085 + 0.03 * (rand() + 1) * 0.5,
    buzz: 1.0 + 0.1 * rand(),
    drive: 5,
    bloom: 0.38 + 0.08 * rand(),
    buzzFall: 1.6,
    buzzHold: 0.6,
    soften: 0,
    seed: Math.floor((rand() + 1) * 1e9),
  };
}

/** A tanpura string: long, soft start, and a buzz that blooms slowly over a second or so, the "singing" overtones. */
export function tanpuraSpec(hz: number, rate: number, seed: number): PluckSpec {
  return {
    hz,
    rate,
    seconds: 9,
    t60: 9,
    bright: 0.7,
    pluckAt: 0.12,
    buzz: 0.9,
    drive: 5,
    bloom: 1.1,
    buzzFall: 3.2,
    buzzHold: 1.5,
    soften: 0.02,
    seed,
  };
}
