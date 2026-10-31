/**
 * The synth behind the film's ambient sound. Web Audio only: two banks of detuned sine and triangle voices on a calm
 * chord, a slow swell on each voice, a slow drift in the filter and the stereo field, a warm low-pass and a soft
 * generated reverb. No audio files, no samples, no AI model (docs/web/ambient-sound.md).
 *
 * Nothing slides in pitch. A chord change fills the idle bank with the new notes while it is silent, then crossfades
 * the two banks over CROSSFADE_SECONDS with equal-power curves, so the ear never hears two pitches glide past each
 * other (no beating). Scroll-driven values (filter, level, reverb, air) move by setTargetAtTime, never by a jump.
 *
 * Browsers refuse sound before a user gesture, so start() must be called from inside a gesture handler: it makes
 * and resumes the context synchronously there (iOS Safari needs exactly that).
 */
import { CROSSFADE_SECONDS, TONE_EVERY_SECONDS, type AmbientParams } from './ambient-map';

type AudioCtor = typeof AudioContext;

export function audioSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return Boolean(w.AudioContext ?? w.webkitAudioContext);
}

/** Seeded noise so the reverb tail is the same every visit. */
function lcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296 - 0.5;
  };
}

/** A soft room: decaying noise, rounded off, with a 30 ms ramp in so the tail itself never clicks. */
function makeImpulse(ctx: BaseAudioContext, seconds = 3.6): AudioBuffer {
  const rate = ctx.sampleRate;
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(2, length, rate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    const rnd = lcg(0x9e3779b1 + c * 7919);
    let low = 0;
    for (let i = 0; i < length; i++) {
      const t = i / rate;
      low += (rnd() * 2 - low) * 0.35; // one-pole smoothing: no hiss in the tail
      data[i] = low * Math.exp(-t * 1.5) * Math.min(1, t / 0.03);
    }
  }
  return buffer;
}

/** Equal-power fade curve, from 0 up to 1 (or 1 down to 0), for setValueCurveAtTime. */
function powerCurve(up: boolean, scale = 1, n = 128): Float32Array {
  const c = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / (n - 1);
    c[i] = scale * (up ? Math.sin((x * Math.PI) / 2) : Math.cos((x * Math.PI) / 2));
  }
  return c;
}

/** Cents that put a note `hz` apart by `offsetHz`: the chorus is a few tenths of a hertz at every pitch, so it beats slowly. */
const centsFor = (hz: number, offsetHz: number): number => 1200 * Math.log2((hz + offsetHz) / hz);

/** One chord's worth of voices. Made when a chord is needed and thrown away once it has faded out, so only one bank (two during a crossfade) ever plays. */
type Bank = {
  gain: GainNode;
  air: GainNode;
  /** Stop the oscillators at context time `at` and let go of everything this bank connected to. */
  dispose: (at: number) => void;
};

type Graph = {
  oscs: OscillatorNode[];
  bank: Bank; // the chord that is playing (or fading in)
  fading: Bank | null; // the chord fading out, during a crossfade
  make: (p: AmbientParams, gain: number, at: number) => Bank;
  chord: number;
  trim: number;
  voicesHz: number[];
  fadingUntil: number; // context time when a running crossfade ends
  lowpass: BiquadFilterNode;
  wet: GainNode;
  level: GainNode;
  fade: GainNode;
};

const PARAM_GLIDE = 0.7; // seconds: time constant of scroll-driven changes
const FADE_IN = 1.4; // seconds: time constant of the first fade-in
const FADE_OUT = 0.18;

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private graph: Graph | null = null;
  private paused = false;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private toneTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly onChange: () => void = () => {}) {}

  /** True only while the context is really running and not paused by the tab going away. */
  get playing(): boolean {
    return Boolean(this.ctx && this.ctx.state === 'running' && !this.paused);
  }

  get state(): string {
    return this.ctx?.state ?? 'none';
  }

  /**
   * Call inside a gesture handler. Makes the context if needed, resumes it right away, builds the graph once and
   * fades it in. Resolves true when the context is running; false when the browser still holds it back.
   */
  async start(initial: AmbientParams): Promise<boolean> {
    if (!audioSupported()) return false;
    const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
    if (!this.ctx || this.ctx.state === 'closed') {
      const Ctor = (w.AudioContext ?? w.webkitAudioContext) as AudioCtor;
      this.ctx = new Ctor({ latencyHint: 'playback' });
      this.graph = null;
      this.ctx.addEventListener('statechange', this.onChange);
    }
    const ctx = this.ctx;
    this.paused = false;
    // Resume first, synchronously inside the gesture; iOS also reports "interrupted" after a call or a lock.
    const resumed = ctx.state === 'running' ? Promise.resolve() : ctx.resume().catch(() => undefined);
    if (!this.graph) {
      this.graph = this.build(ctx, initial);
      this.scheduleTone(TONE_EVERY_SECONDS[0] * 0.4);
    }
    this.fadeTo(1, FADE_IN, 0.05);
    // Chrome can leave resume() pending until a gesture it accepts; do not hang on it.
    await Promise.race([resumed, new Promise<void>((r) => this.later(r, 1500))]);
    this.onChange();
    return this.playing;
  }

  /** Glide to new scroll-driven values, and start a chord crossfade when the chord has changed. Safe to call every tick. */
  update(p: AmbientParams): void {
    const { ctx, graph } = this;
    if (!ctx || !graph || ctx.state === 'closed') return;
    const t = ctx.currentTime;
    graph.lowpass.frequency.setTargetAtTime(p.cutoffHz, t, PARAM_GLIDE);
    graph.level.gain.setTargetAtTime(p.masterGain, t, PARAM_GLIDE);
    graph.wet.gain.setTargetAtTime(p.reverbWet, t, PARAM_GLIDE * 2);
    for (const bank of [graph.bank, graph.fading]) bank?.air.gain.setTargetAtTime(p.airGain, t, PARAM_GLIDE * 2);
    if (p.chord !== graph.chord && t >= graph.fadingUntil) this.crossfadeTo(p);
  }

  /** Make the next chord's bank (silent), then fade the two past each other. The pitch of a playing note never moves. */
  private crossfadeTo(p: AmbientParams): void {
    const { ctx, graph } = this;
    if (!ctx || !graph) return;
    const t = ctx.currentTime;
    const from = graph.bank;
    const to = graph.make(p, 0, t);
    // The outgoing bank fades from its own trim, the incoming one to its own.
    to.gain.gain.setValueCurveAtTime(powerCurve(true, p.bankTrim), t, CROSSFADE_SECONDS);
    from.gain.gain.cancelScheduledValues(t);
    from.gain.gain.setValueCurveAtTime(powerCurve(false, graph.trim), t, CROSSFADE_SECONDS);
    graph.bank = to;
    graph.fading = from;
    graph.chord = p.chord;
    graph.trim = p.bankTrim;
    graph.voicesHz = [...p.voicesHz];
    graph.fadingUntil = t + CROSSFADE_SECONDS + 0.1;
    this.later(() => {
      from.dispose(ctx.currentTime + 0.05);
      if (this.graph === graph && graph.fading === from) graph.fading = null;
    }, (CROSSFADE_SECONDS + 0.4) * 1000);
  }

  /** One very quiet chord tone now and then: 3 s attack, 6 s decay, a note of the chord that is playing, never a tune. */
  private scheduleTone(delaySec: number): void {
    if (this.toneTimer) clearTimeout(this.toneTimer);
    this.toneTimer = setTimeout(() => {
      this.toneTimer = null;
      const { ctx, graph } = this;
      if (!ctx || !graph) return;
      if (!this.paused && ctx.state === 'running') this.playTone(ctx, graph);
      const [lo, hi] = TONE_EVERY_SECONDS;
      this.scheduleTone(lo + Math.random() * (hi - lo));
    }, delaySec * 1000);
  }

  private playTone(ctx: AudioContext, graph: Graph): void {
    const hz = graph.voicesHz[Math.floor(Math.random() * graph.voicesHz.length)];
    const note = hz < 500 && Math.random() < 0.5 ? hz * 2 : hz;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = note;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    // About -38 dBFS peak at the output (path gain about 0.75 x master 0.075). At -30 it lifted the pad by about 3 dB while it rang, which is not "very quiet".
    env.gain.setTargetAtTime(0.2, t, 1.0); // reaches about 95 % at 3 s
    env.gain.setTargetAtTime(0, t + 3, 2.0); // gone by about 12 s after that
    osc.connect(env).connect(graph.lowpass);
    osc.start(t);
    osc.stop(t + 3 + 14);
    osc.onended = () => env.disconnect();
  }

  /** The tab is hidden: fade out quickly, then hold the context. */
  pause(): void {
    const { ctx } = this;
    if (!ctx || ctx.state === 'closed') return;
    this.paused = true;
    this.fadeTo(0, FADE_OUT);
    this.later(() => {
      if (this.paused && this.ctx === ctx && ctx.state === 'running') void ctx.suspend().then(this.onChange, () => undefined);
    }, 700);
    this.onChange();
  }

  /** The tab is back: wake the context and fade in. May stay suspended if the browser wants a gesture first. */
  async resume(): Promise<boolean> {
    const { ctx } = this;
    if (!ctx || ctx.state === 'closed') return false;
    this.paused = false;
    const woke = ctx.resume().catch(() => undefined);
    this.fadeTo(1, FADE_IN, 0.05);
    await Promise.race([woke, new Promise<void>((r) => this.later(r, 1500))]);
    this.onChange();
    return this.playing;
  }

  /** Mute: fade out, then stop everything and release the context. */
  stop(): void {
    const { ctx, graph } = this;
    this.ctx = null;
    this.graph = null;
    this.paused = false;
    if (this.toneTimer) clearTimeout(this.toneTimer);
    this.toneTimer = null;
    if (!ctx) return;
    ctx.removeEventListener('statechange', this.onChange);
    if (ctx.state !== 'closed') {
      if (graph) {
        const t = ctx.currentTime;
        graph.fade.gain.cancelScheduledValues(t);
        graph.fade.gain.setTargetAtTime(0, t, FADE_OUT);
      }
      this.later(() => {
        try {
          graph?.oscs.forEach((o) => o.stop());
        } catch {
          // already stopped
        }
        void ctx.close().catch(() => undefined);
      }, 900);
    }
    this.onChange();
  }

  /** Leaving the page or the component: release now. */
  dispose(): void {
    const { ctx, graph } = this;
    this.ctx = null;
    this.graph = null;
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    if (this.toneTimer) clearTimeout(this.toneTimer);
    this.toneTimer = null;
    if (!ctx) return;
    ctx.removeEventListener('statechange', this.onChange);
    try {
      graph?.fade.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      graph?.oscs.forEach((o) => o.stop(ctx.currentTime + 0.2));
    } catch {
      // already stopped
    }
    if (ctx.state !== 'closed') void ctx.close().catch(() => undefined);
  }

  private later(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      this.timers.delete(id);
      fn();
    }, ms);
    this.timers.add(id);
  }

  private fadeTo(value: number, timeConstant: number, delay = 0): void {
    const { ctx, graph } = this;
    if (!ctx || !graph) return;
    const t = ctx.currentTime;
    const g = graph.fade.gain;
    g.cancelScheduledValues(t);
    // From where it is now (0 on a first start), never from a jump.
    g.setValueAtTime(g.value, t);
    g.setTargetAtTime(value, t + delay, timeConstant);
  }

  private build(ctx: AudioContext, p: AmbientParams): Graph {
    const now = ctx.currentTime;
    const oscs: OscillatorNode[] = [];
    const start = (o: OscillatorNode) => {
      o.start(now);
      oscs.push(o);
      return o;
    };

    const fade = ctx.createGain();
    fade.gain.setValueAtTime(0, now); // silent until the fade-in: no start transient
    const level = ctx.createGain();
    level.gain.setValueAtTime(p.masterGain, now);

    // Keep the very low end out: phone and laptop speakers cannot play it and it only muddies. Then the warm lid.
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 110;
    highpass.Q.value = 0.5;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.Q.value = 0.4;
    lowpass.frequency.setValueAtTime(p.cutoffHz, now);
    // The cutoff breathes by about +/-150 Hz every 33 s.
    const cutLfo = start(ctx.createOscillator());
    cutLfo.frequency.value = 0.03;
    const cutDepth = ctx.createGain();
    cutDepth.gain.value = 150;
    cutLfo.connect(cutDepth).connect(lowpass.frequency);

    const dry = ctx.createGain();
    dry.gain.value = 0.75;
    const wet = ctx.createGain();
    wet.gain.setValueAtTime(p.reverbWet, now);
    const verb = ctx.createConvolver();
    verb.buffer = makeImpulse(ctx);

    highpass.connect(lowpass);
    lowpass.connect(dry).connect(level);
    lowpass.connect(verb).connect(wet).connect(level);
    level.connect(fade).connect(ctx.destination);

    // Four slow swells, one per voice, never in step: a breath every 14 to 21 seconds.
    const lfoRates = [0.047, 0.061, 0.073, 0.052];
    const swells = lfoRates.map((rate) => {
      const lfo = start(ctx.createOscillator());
      lfo.frequency.value = rate;
      const depth = ctx.createGain();
      depth.gain.value = 0.02;
      lfo.connect(depth);
      return depth;
    });

    const hasPanner = typeof ctx.createStereoPanner === 'function';
    const make = (bp: AmbientParams, gain: number, at: number): Bank => {
      const mine: OscillatorNode[] = []; // this bank's own oscillators
      const links: [AudioNode, AudioParam][] = []; // swell connections to let go of
      const begin = (o: OscillatorNode) => {
        o.start(at);
        mine.push(o);
        oscs.push(o);
        return o;
      };
      const bankGain = ctx.createGain();
      bankGain.gain.setValueAtTime(gain, at);
      bankGain.connect(highpass);
      const panBus = (sign: 1 | -1) => {
        const bus = ctx.createGain();
        if (hasPanner) {
          // The bus sits in the stereo field and drifts across it by +/-0.4 every 50 s (0.02 Hz).
          const pan = ctx.createStereoPanner();
          const lfo = begin(ctx.createOscillator());
          lfo.frequency.value = 0.02;
          const depth = ctx.createGain();
          depth.gain.value = 0.4 * sign;
          lfo.connect(depth).connect(pan.pan);
          bus.connect(pan).connect(bankGain);
        } else bus.connect(bankGain);
        return bus;
      };
      const setA = panBus(1); // sine + triangle, slightly detuned
      const setB = panBus(-1); // a second set: other detune, drifting the other way
      bp.voicesHz.forEach((hz, i) => {
        const voiceA = ctx.createGain();
        voiceA.gain.value = 0.17;
        voiceA.connect(setA);
        swells[i].connect(voiceA.gain);
        links.push([swells[i], voiceA.gain]);
        const voiceB = ctx.createGain();
        voiceB.gain.value = 0.07;
        voiceB.connect(setB);
        const other = swells[(i + 1) % swells.length];
        other.connect(voiceB.gain);
        links.push([other, voiceB.gain]);
        // Detune in hertz, a few tenths each way, so no two oscillators beat faster than about 0.7 Hz.
        const spec: [OscillatorType, number, number, GainNode][] = [
          ['sine', -0.14 - 0.02 * i, 1, voiceA],
          ['triangle', 0.16 + 0.02 * i, 0.35, voiceA],
          ['sine', 0.33 - 0.03 * i, 1, voiceB],
          ['triangle', -0.3 + 0.03 * i, 0.3, voiceB],
        ];
        for (const [type, offsetHz, level, dest] of spec) {
          const osc = begin(ctx.createOscillator());
          osc.type = type;
          osc.frequency.setValueAtTime(hz, at);
          osc.detune.value = centsFor(hz, offsetHz);
          const g = ctx.createGain();
          g.gain.value = level;
          osc.connect(g).connect(dest);
        }
      });
      const air = ctx.createGain();
      air.gain.setValueAtTime(bp.airGain, at);
      air.connect(bankGain);
      for (const offsetHz of [-0.2, 0.24]) {
        const osc = begin(ctx.createOscillator());
        osc.type = 'sine';
        osc.frequency.setValueAtTime(bp.airHz, at);
        osc.detune.value = centsFor(bp.airHz, offsetHz);
        const g = ctx.createGain();
        g.gain.value = 0.2;
        osc.connect(g).connect(air);
      }
      const dispose = (when: number) => {
        for (const o of mine) {
          try {
            o.stop(when);
          } catch {
            // already stopped
          }
          const i = oscs.indexOf(o);
          if (i >= 0) oscs.splice(i, 1);
        }
        for (const [from, to] of links) {
          try {
            from.disconnect(to);
          } catch {
            // already let go
          }
        }
        try {
          bankGain.disconnect();
        } catch {
          // already let go
        }
      };
      return { gain: bankGain, air, dispose };
    };

    return { oscs, bank: make(p, p.bankTrim, now), fading: null, make, chord: p.chord, trim: p.bankTrim, voicesHz: [...p.voicesHz], fadingUntil: 0, lowpass, wet, level, fade };
  }
}
