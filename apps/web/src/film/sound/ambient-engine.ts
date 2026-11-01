/**
 * Plays the film's music: one openly licensed recording (tracks.ts), hosted on our own origin, through Web Audio.
 * Nothing is generated and no audio is loaded before the visitor's first gesture: start() makes and resumes the
 * context synchronously inside the gesture (iOS Safari needs exactly that), then fetches and decodes the one chosen
 * track and fades it in. The track comes round again by overlapping its own end with its start (an equal-power
 * crossfade), so there is no seam. Scroll glides the level and the low-pass by setTargetAtTime, never by a jump.
 *
 * Graph: sources (one per loop pass, each with its own fade) -> level (track trim x tone x scroll) -> low-pass ->
 * safety limiter -> fade -> destination. docs/web/ambient-sound.md has the design and the licence register.
 */
import { type AmbientParams } from './ambient-map';
import { dbToGain, type Track } from './tracks';

type AudioCtor = typeof AudioContext;

export function audioSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
  return Boolean(w.AudioContext ?? w.webkitAudioContext);
}

const FADE_IN = 1.2; // seconds (time constant), music coming in
const FADE_OUT = 0.25; // seconds (time constant), mute and hidden tab
const PARAM_GLIDE = 0.35; // seconds (time constant) for scroll-driven changes
/** How far ahead of the audio clock loop passes are scheduled. */
const LOOKAHEAD = 20;

type Graph = {
  level: GainNode;
  lowpass: BiquadFilterNode;
  fade: GainNode;
};

/** Equal-power fade curves, built once. */
const CURVE_POINTS = 64;
const FADE_UP = Float32Array.from({ length: CURVE_POINTS }, (_, i) => Math.sin((i / (CURVE_POINTS - 1)) * Math.PI * 0.5));
const FADE_DOWN = Float32Array.from({ length: CURVE_POINTS }, (_, i) => Math.cos((i / (CURVE_POINTS - 1)) * Math.PI * 0.5));

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private graph: Graph | null = null;
  private paused = false;
  private failed = false;
  private loading = false;
  private buffer: AudioBuffer | null = null;
  private abort: AbortController | null = null;
  private pump: ReturnType<typeof setInterval> | null = null;
  private nextStart = 0;
  private firstPass = true;
  private sources: AudioBufferSourceNode[] = [];
  private readonly timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    private readonly onChange: () => void = () => {},
    private readonly track: Track,
  ) {}

  /** True only while the context is really running, the track has not failed to load and the tab has not paused it. */
  get playing(): boolean {
    return Boolean(this.ctx && this.ctx.state === 'running' && !this.paused && !this.failed);
  }

  get state(): string {
    return this.ctx?.state ?? 'none';
  }

  /**
   * Call inside a gesture handler. Makes the context if needed, resumes it right away, builds the graph once and
   * starts loading the track (a second call retries after a failed load). Resolves true when the context is running.
   */
  async start(initial: AmbientParams): Promise<boolean> {
    if (!audioSupported()) return false;
    // iPhone Safari mutes Web Audio while the ringer switch is on silent, unless the page declares itself media
    // playback (Safari 16.4+). Without this the page "plays" and nobody hears it.
    try {
      const nav = navigator as unknown as { audioSession?: { type: string } };
      if (nav.audioSession) nav.audioSession.type = 'playback';
    } catch {
      /* unsupported: nothing to do */
    }
    const w = window as unknown as { AudioContext?: AudioCtor; webkitAudioContext?: AudioCtor };
    if (!this.ctx || this.ctx.state === 'closed') {
      const Ctor = (w.AudioContext ?? w.webkitAudioContext) as AudioCtor;
      this.ctx = new Ctor({ latencyHint: 'playback' });
      this.graph = null;
      this.buffer = null;
      this.ctx.addEventListener('statechange', this.onChange);
    }
    const ctx = this.ctx;
    this.paused = false;
    // Resume first, synchronously inside the gesture; iOS also reports "interrupted" after a call or a lock.
    const resumed = ctx.state === 'running' ? Promise.resolve() : ctx.resume().catch(() => undefined);
    this.graph ??= this.build(ctx, initial);
    if (!this.buffer && !this.loading) void this.load(ctx);
    // Chrome can leave resume() pending until a gesture it accepts; do not hang on it.
    await Promise.race([resumed, new Promise<void>((r) => this.later(r, 1500))]);
    this.onChange();
    return this.playing;
  }

  /** Fetch and decode the chosen track (first file the browser can play), then begin the loop and fade in. */
  private async load(ctx: AudioContext): Promise<void> {
    this.loading = true;
    this.failed = false;
    const abort = new AbortController();
    this.abort = abort;
    try {
      const probe = typeof Audio === 'undefined' ? null : new Audio();
      const playable = this.track.files.filter((f) => !probe || probe.canPlayType(f.type) !== '');
      let decoded: AudioBuffer | null = null;
      for (const file of playable.length ? playable : this.track.files) {
        try {
          const res = await fetch(file.src, { signal: abort.signal, credentials: 'omit' });
          if (!res.ok) continue;
          decoded = await ctx.decodeAudioData(await res.arrayBuffer());
          break;
        } catch {
          if (abort.signal.aborted) return;
        }
      }
      if (abort.signal.aborted || this.ctx !== ctx) return;
      if (!decoded) throw new Error('track could not be loaded');
      this.buffer = decoded;
      this.beginLoop(ctx, decoded);
      if (!this.paused) this.fadeTo(1, FADE_IN, 0.05);
    } catch {
      if (this.ctx === ctx) this.failed = true;
    } finally {
      this.loading = false;
      if (this.ctx === ctx) this.onChange();
    }
  }

  private build(ctx: AudioContext, p: AmbientParams): Graph {
    const level = ctx.createGain();
    level.gain.value = dbToGain(this.track.gainDb) * p.masterGain;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = p.cutoffHz;
    lowpass.Q.value = -3; // dB: flat, no resonance bump
    // A safety net only: it should never act at the designed level, but a loud track plus a firm scroll must not clip.
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -4;
    limiter.knee.value = 3;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    const fade = ctx.createGain();
    fade.gain.value = 0; // silent until the track is loaded
    level.connect(lowpass).connect(limiter).connect(fade).connect(ctx.destination);
    return { level, lowpass, fade };
  }

  /** Schedule the first pass and keep scheduling passes while the audio clock runs. */
  private beginLoop(ctx: AudioContext, buffer: AudioBuffer): void {
    this.nextStart = ctx.currentTime + 0.05;
    this.firstPass = true;
    this.schedulePasses(ctx, buffer);
    if (this.pump) clearInterval(this.pump);
    this.pump = setInterval(() => this.schedulePasses(ctx, buffer), 1000);
  }

  private schedulePasses(ctx: AudioContext, buffer: AudioBuffer): void {
    const graph = this.graph;
    if (!graph || this.ctx !== ctx || ctx.state === 'closed') return;
    const dur = buffer.duration;
    // The crossfade is at most a third of the track, and never zero.
    const xf = Math.max(0.05, Math.min(this.track.crossfadeSeconds, dur / 3));
    while (this.nextStart < ctx.currentTime + LOOKAHEAD) {
      const at = this.nextStart;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      const env = ctx.createGain();
      if (this.firstPass) {
        env.gain.setValueAtTime(1, at); // the master fade brings the first pass in
      } else {
        env.gain.setValueAtTime(0, at);
        env.gain.setValueCurveAtTime(FADE_UP, at, xf);
      }
      env.gain.setValueCurveAtTime(FADE_DOWN, at + dur - xf, xf);
      src.connect(env).connect(graph.level);
      src.start(at);
      src.stop(at + dur + 0.05);
      src.onended = () => {
        this.sources = this.sources.filter((s) => s !== src);
        try {
          env.disconnect();
        } catch {
          /* already gone */
        }
      };
      this.sources.push(src);
      this.firstPass = false;
      this.nextStart = at + dur - xf;
    }
  }

  /** Scroll, progress and tone: glide the level and the low-pass. Nothing jumps. */
  update(p: AmbientParams): void {
    const { ctx, graph } = this;
    if (!ctx || !graph || ctx.state === 'closed') return;
    const t = ctx.currentTime;
    graph.lowpass.frequency.setTargetAtTime(p.cutoffHz, t, PARAM_GLIDE);
    graph.level.gain.setTargetAtTime(dbToGain(this.track.gainDb) * p.masterGain, t, PARAM_GLIDE);
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
    if (this.buffer) this.fadeTo(1, FADE_IN, 0.05);
    await Promise.race([woke, new Promise<void>((r) => this.later(r, 1500))]);
    this.onChange();
    return this.playing;
  }

  /** Mute: fade out, then stop everything and release the context. */
  stop(): void {
    const { ctx, graph } = this;
    const sources = this.sources;
    this.release();
    if (!ctx) return;
    ctx.removeEventListener('statechange', this.onChange);
    if (ctx.state !== 'closed') {
      if (graph) {
        const t = ctx.currentTime;
        graph.fade.gain.cancelScheduledValues(t);
        graph.fade.gain.setTargetAtTime(0, t, FADE_OUT);
      }
      this.later(() => {
        for (const s of sources) {
          try {
            s.stop();
          } catch {
            // already stopped
          }
        }
        void ctx.close().catch(() => undefined);
      }, 900);
    }
    this.onChange();
  }

  /** Leaving the page or the component: release now. */
  dispose(): void {
    const { ctx, graph } = this;
    const sources = this.sources;
    this.release();
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    if (!ctx) return;
    ctx.removeEventListener('statechange', this.onChange);
    try {
      graph?.fade.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      for (const s of sources) s.stop(ctx.currentTime + 0.2);
    } catch {
      // already stopped
    }
    if (ctx.state !== 'closed') void ctx.close().catch(() => undefined);
  }

  private release(): void {
    this.abort?.abort();
    this.abort = null;
    if (this.pump) clearInterval(this.pump);
    this.pump = null;
    this.ctx = null;
    this.graph = null;
    this.buffer = null;
    this.sources = [];
    this.paused = false;
    this.failed = false;
    this.loading = false;
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
}
