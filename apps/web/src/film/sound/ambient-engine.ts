/**
 * The synth behind the film's ambient sound. Web Audio only: a few detuned sine and triangle oscillators on a calm
 * chord, a slow swell on each voice, a warm low-pass and a soft generated reverb. No audio files, no samples, no AI
 * model (docs/web/ambient-sound.md). Everything moves by setTargetAtTime, never by a jump, so nothing zippers or clicks.
 *
 * Browsers refuse sound before a user gesture, so start() must be called from inside a gesture handler: it makes
 * and resumes the context synchronously there (iOS Safari needs exactly that).
 */
import { type AmbientParams } from './ambient-map';

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

type Graph = {
  oscs: OscillatorNode[];
  voiceOscs: OscillatorNode[][]; // per chord voice: [sine, triangle]
  airOscs: OscillatorNode[];
  air: GainNode;
  lowpass: BiquadFilterNode;
  wet: GainNode;
  level: GainNode;
  fade: GainNode;
};

const NOTE_GLIDE = 3.5; // seconds: time constant of a chord change
const PARAM_GLIDE = 0.7; // seconds: time constant of scroll-driven changes
const FADE_IN = 1.4; // seconds: time constant of the first fade-in
const FADE_OUT = 0.18;

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private graph: Graph | null = null;
  private paused = false;
  private timers = new Set<ReturnType<typeof setTimeout>>();

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
    if (!this.graph) this.graph = this.build(ctx, initial);
    this.fadeTo(1, FADE_IN, 0.05);
    // Chrome can leave resume() pending until a gesture it accepts; do not hang on it.
    await Promise.race([resumed, new Promise<void>((r) => this.later(r, 1500))]);
    this.onChange();
    return this.playing;
  }

  /** Glide to new scroll-driven values. Safe to call every tick. */
  update(p: AmbientParams): void {
    const { ctx, graph } = this;
    if (!ctx || !graph || ctx.state === 'closed') return;
    const t = ctx.currentTime;
    graph.lowpass.frequency.setTargetAtTime(p.cutoffHz, t, PARAM_GLIDE);
    graph.level.gain.setTargetAtTime(p.masterGain, t, PARAM_GLIDE);
    graph.wet.gain.setTargetAtTime(p.reverbWet, t, PARAM_GLIDE * 2);
    graph.air.gain.setTargetAtTime(p.airGain, t, PARAM_GLIDE * 2);
    p.voicesHz.forEach((hz, i) => graph.voiceOscs[i].forEach((o) => o.frequency.setTargetAtTime(hz, t, NOTE_GLIDE)));
    graph.airOscs.forEach((o) => o.frequency.setTargetAtTime(p.airHz, t, NOTE_GLIDE));
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
    const fade = ctx.createGain();
    fade.gain.setValueAtTime(0, now); // silent until the fade-in: no start transient
    const level = ctx.createGain();
    level.gain.setValueAtTime(p.masterGain, now);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.Q.value = 0.4;
    lowpass.frequency.setValueAtTime(p.cutoffHz, now);

    const dry = ctx.createGain();
    dry.gain.value = 0.75;
    const wet = ctx.createGain();
    wet.gain.setValueAtTime(p.reverbWet, now);
    const verb = ctx.createConvolver();
    verb.buffer = makeImpulse(ctx);

    lowpass.connect(dry).connect(level);
    lowpass.connect(verb).connect(wet).connect(level);
    level.connect(fade).connect(ctx.destination);

    const oscs: OscillatorNode[] = [];
    const voiceOscs: OscillatorNode[][] = [];
    const lfoRates = [0.047, 0.061, 0.073, 0.052]; // Hz: a breath every 14 to 21 seconds, never in step

    p.voicesHz.forEach((hz, i) => {
      const voice = ctx.createGain();
      voice.gain.value = 0.2;
      voice.connect(lowpass);
      const pair: OscillatorNode[] = [];
      (['sine', 'triangle'] as const).forEach((type, k) => {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(hz, now);
        osc.detune.value = (k === 0 ? -5 : 6) + i; // a few cents apart: a slow chorus
        const g = ctx.createGain();
        g.gain.value = k === 0 ? 1 : 0.35;
        osc.connect(g).connect(voice);
        osc.start(now);
        oscs.push(osc);
        pair.push(osc);
      });
      voiceOscs.push(pair);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = lfoRates[i % lfoRates.length];
      const depth = ctx.createGain();
      depth.gain.value = 0.07;
      lfo.connect(depth).connect(voice.gain);
      lfo.start(now);
      oscs.push(lfo);
    });

    const air = ctx.createGain();
    air.gain.setValueAtTime(p.airGain, now);
    air.connect(lowpass);
    const airOscs = [-4, 5].map((cents) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(p.airHz, now);
      osc.detune.value = cents;
      const g = ctx.createGain();
      g.gain.value = 0.2;
      osc.connect(g).connect(air);
      osc.start(now);
      oscs.push(osc);
      return osc;
    });

    return { oscs, voiceOscs, airOscs, air, lowpass, wet, level, fade };
  }
}
