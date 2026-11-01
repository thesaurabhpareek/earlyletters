/**
 * The synth behind the film's ambient sound: a slow, original melody in raga Bhoopali on a plucked, sitar-like string
 * with meend (slides), over a soft tanpura-style drone and a few sympathetic strings, in a generated room.
 * Web Audio plus our own plucked-string model (pluck.ts) that fills short AudioBuffers at run time on the device.
 * No audio files, no samples, no recordings, no AI model, no third-party music (docs/web/ambient-sound.md).
 *
 * The melody comes from raga.ts: phrases chosen by rules and played with small differences in time, strength and
 * pitch every time. Scroll-driven values (filter, level, reverb, shimmer) move by setTargetAtTime, never by a jump.
 * Every note has its own gain envelope and starts from a faded-in buffer, so nothing clicks; muting fades the master.
 *
 * Browsers refuse sound before a user gesture, so start() must be called from inside a gesture handler: it makes
 * and resumes the context synchronously there (iOS Safari needs exactly that).
 */
import { lerp, type AmbientParams } from './ambient-map';
import { renderPluck, sitarSpec, tanpuraSpec } from './pluck';
import { MELODY_SA_HZ, TONIC_HZ, hzOf, perform, pickPhrase, type Stage } from './raga';

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


/** Small seeded generator (mulberry32), 0..1. The film sound is different on every visit unless a seed is given. */
function makeRand(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MELODY_RATE = 32000; // sample rate the pluck buffers are made at; the browser resamples to the device's
const DRONE_RATE = 24000;
const LOOKAHEAD = 3.5; // seconds of notes scheduled ahead
const PUMP_MS = 250;
// Output design: see docs/web/ambient-sound.md (measured). The master gain (ambient-map.ts) sits after these.
const MELODY_AMP = 1.45;
const DRONE_AMP = 0.3;
const SYMP_SEND = 0.018;
const SYMP_OUT = 1;
/** The drone's cycle: Pa, Sa, Sa, low Sa, one string every 1.55 s (a cycle of 6.2 s). */
const DRONE_STRINGS: { hz: number; pan: number; amp: number }[] = [
  { hz: TONIC_HZ * 1.5, pan: -0.3, amp: 0.8 },
  { hz: TONIC_HZ * 2, pan: 0.2, amp: 1 },
  { hz: TONIC_HZ * 2 * 1.0014, pan: -0.15, amp: 0.9 },
  { hz: TONIC_HZ, pan: 0.3, amp: 0.85 },
];
/** The sympathetic strings: the five notes of the raga, which ring when the melody plays them. */
const SYMPATHETIC_SEMIS = [0, 2, 4, 7, 9];

type Graph = {
  melody: GainNode;
  drone: GainNode;
  sympSend: GainNode;
  lowpass: BiquadFilterNode;
  wet: GainNode;
  level: GainNode;
  fade: GainNode;
  stoppers: Set<AudioBufferSourceNode>;
  oscs: OscillatorNode[];
};

export type NoteLog = { t: number; hz: number; semis: number; to?: number; kan?: number; vel: number; phrase: string; dur: number };
export type EngineOptions = { seed?: number; log?: NoteLog[]; drone?: boolean; melody?: boolean; shimmer?: boolean };

const PARAM_GLIDE = 0.7; // seconds: time constant of scroll-driven changes
const FADE_IN = 1.4; // seconds: time constant of the first fade-in
const FADE_OUT = 0.18;
const FIRST_PHRASE_AT = 7; // seconds after start: the drone is alone first, then the melody begins

export class AmbientEngine {
  private ctx: AudioContext | null = null;
  private graph: Graph | null = null;
  private paused = false;
  private offline = false;
  private timers = new Set<ReturnType<typeof setTimeout>>();
  private pumpTimer: ReturnType<typeof setInterval> | null = null;
  private rand: () => number; // the melody's: its own stream, so the same seed gives the same melody with or without the drone
  private droneRand: () => number;
  private params: AmbientParams | null = null;
  // Scheduler state, all in context time.
  private droneBufs: (AudioBuffer | null)[] = [null, null, null, null];
  private nextDroneAt = 0;
  private droneIndex = 0;
  private nextPhraseAt = 0;
  private pending: { at: number; dur: number; semis: number; to?: number; kan?: number; vel: number; cents: number; phrase: string }[] = [];
  private history: string[] = [];
  private prevStage: Stage | null = null;
  /** The melody is one string: a new pluck ends the note before it, as the player's hand would. */
  private last: { src: AudioBufferSourceNode; gain: GainNode } | null = null;

  constructor(
    private readonly onChange: () => void = () => {},
    private readonly options: EngineOptions = {},
  ) {
    const seed = options.seed ?? ((Date.now() ^ Math.floor(Math.random() * 2 ** 31)) >>> 0);
    this.rand = makeRand(seed);
    this.droneRand = makeRand(seed ^ 0x5bd1e995);
  }

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
      this.ctx.addEventListener('statechange', this.onChange);
    }
    const ctx = this.ctx;
    this.paused = false;
    // Resume first, synchronously inside the gesture; iOS also reports "interrupted" after a call or a lock.
    const resumed = ctx.state === 'running' ? Promise.resolve() : ctx.resume().catch(() => undefined);
    if (!this.graph) {
      this.graph = this.build(ctx, initial);
      this.begin(ctx, initial);
    }
    this.fadeTo(1, FADE_IN, 0.05);
    // Chrome can leave resume() pending until a gesture it accepts; do not hang on it.
    await Promise.race([resumed, new Promise<void>((r) => this.later(r, 1500))]);
    this.onChange();
    return this.playing;
  }

  /**
   * For offline rendering and measurement only: build the graph on any context (an OfflineAudioContext) and
   * schedule `seconds` of music up front. Nothing in the page calls this.
   */
  renderOffline(ctx: BaseAudioContext, initial: AmbientParams, seconds: number): void {
    const c = ctx as unknown as AudioContext;
    this.offline = true;
    this.ctx = c;
    this.graph = this.build(c, initial);
    this.graph.fade.gain.setValueAtTime(1, 0);
    this.begin(c, initial);
    if (this.pumpTimer) clearInterval(this.pumpTimer); // offline, time is not the wall clock
    this.pumpTimer = null;
    this.scheduleAhead(seconds, Infinity);
  }

  private begin(ctx: AudioContext, initial: AmbientParams): void {
    this.params = initial;
    this.nextDroneAt = ctx.currentTime + 0.15;
    this.droneIndex = 0;
    this.nextPhraseAt = ctx.currentTime + FIRST_PHRASE_AT;
    this.pending = [];
    this.history = [];
    this.prevStage = null;
    this.last = null;
    if (this.pumpTimer) clearInterval(this.pumpTimer);
    this.scheduleAhead(LOOKAHEAD, 1);
    this.pumpTimer = setInterval(() => this.scheduleAhead(LOOKAHEAD, 1), PUMP_MS);
  }

  /** Glide to new scroll-driven values. Safe to call every tick. */
  update(p: AmbientParams): void {
    const { ctx, graph } = this;
    if (!ctx || !graph || ctx.state === 'closed') return;
    this.params = p;
    const t = ctx.currentTime;
    graph.lowpass.frequency.setTargetAtTime(p.cutoffHz, t, PARAM_GLIDE);
    graph.level.gain.setTargetAtTime(p.masterGain, t, PARAM_GLIDE);
    graph.wet.gain.setTargetAtTime(p.reverbWet, t, PARAM_GLIDE * 2);
    graph.sympSend.gain.setTargetAtTime(SYMP_SEND * p.shimmer, t, PARAM_GLIDE * 2);
  }

  /**
   * Make and place every drone pluck and melody note that falls before now + horizon. `budget` is how many pluck
   * buffers it may compute in this call (each takes a few milliseconds): live, one per tick, so no tick is long.
   */
  scheduleAhead(horizon: number, budget: number): void {
    const { ctx, graph } = this;
    if (!ctx || !graph || !this.params) return;
    if (this.paused || (ctx.state !== 'running' && !this.offline)) return;
    let left = budget;
    const until = ctx.currentTime + horizon;

    if (this.options.drone !== false) {
      while (this.nextDroneAt < until) {
        const i = this.droneIndex % DRONE_STRINGS.length;
        let buf = this.droneBufs[i];
        if (!buf) {
          if (left <= 0) break;
          left--;
          buf = this.makeBuffer(ctx, renderPluck(tanpuraSpec(DRONE_STRINGS[i].hz, DRONE_RATE, 1000 + i * 77)), DRONE_RATE);
          this.droneBufs[i] = buf;
        }
        this.playDrone(ctx, graph, buf, DRONE_STRINGS[i], Math.max(this.nextDroneAt, ctx.currentTime + 0.02));
        this.droneIndex++;
        this.nextDroneAt += 1.55 + (this.droneRand() - 0.5) * 0.08;
      }
    }

    if (this.options.melody === false) return;
    for (;;) {
      if (this.pending.length === 0 && this.nextPhraseAt < until) this.composeNext(this.nextPhraseAt);
      while (this.pending.length && this.pending[0].at < until && left > 0) {
        const n = this.pending.shift()!;
        left--;
        this.playNote(ctx, graph, n);
      }
      // Another phrase can fall inside the window only when the window is long (offline rendering) or after a stall.
      if (!(this.pending.length === 0 && this.nextPhraseAt < until && left > 0)) break;
    }
  }

  /** Choose and perform the next phrase; its notes wait in `pending`, and the gap after it is set. */
  private composeNext(start: number): void {
    const p = this.params!;
    const { phrase, stage } = pickPhrase(this.history, this.prevStage, p.tone, p.progress, p.register, this.rand);
    this.history = [...this.history, phrase.id].slice(-4);
    this.prevStage = stage;
    const { notes, seconds, alt } = perform(phrase, this.rand);
    for (const n of notes) this.pending.push({ at: start + n.at, dur: n.dur, semis: n.p, to: n.to, kan: n.kan, vel: n.vel, cents: n.cents, phrase: phrase.id + (alt ? '*' : '') });
    // Silence is part of the line: about 1 to 4 s after the last note's nominal end; the note has usually died away 2 to 3 s before that, so the quiet that is heard is about 3 to 7 s, longer after a resting phrase and at night.
    const settle = stage === 'home' || stage === 'answer' ? 1.15 : 1;
    const night = p.tone === 'night' ? 1.15 : 1;
    this.nextPhraseAt = start + seconds + Math.min(4, (1 + this.rand() * 2.6) * p.gapScale * settle * night);
  }

  private makeBuffer(ctx: AudioContext, data: Float32Array, rate: number): AudioBuffer {
    const buf = ctx.createBuffer(1, data.length, rate);
    buf.copyToChannel(data as Float32Array<ArrayBuffer>, 0);
    return buf;
  }

  private pan(ctx: AudioContext, value: number): StereoPannerNode | null {
    if (typeof ctx.createStereoPanner !== 'function') return null;
    const p = ctx.createStereoPanner();
    p.pan.value = value;
    return p;
  }

  private playDrone(ctx: AudioContext, graph: Graph, buf: AudioBuffer, s: { pan: number; amp: number }, at: number): void {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    const amp = DRONE_AMP * s.amp * (1 + (this.droneRand() - 0.5) * 0.2);
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(amp, at + 0.03);
    const pan = this.pan(ctx, s.pan);
    src.connect(g);
    if (pan) g.connect(pan).connect(graph.drone);
    else g.connect(graph.drone);
    this.track(graph, src, [g, pan]);
    src.start(at);
  }

  private track(graph: Graph, src: AudioBufferSourceNode, nodes: (AudioNode | null)[]): void {
    graph.stoppers.add(src);
    src.onended = () => {
      graph.stoppers.delete(src);
      try {
        src.disconnect();
        for (const n of nodes) n?.disconnect();
      } catch {
        // already let go
      }
    };
  }

  /** One sitar note: a fresh plucked string, a short bend at the attack, a kan if asked, a meend if asked. */
  private playNote(ctx: AudioContext, graph: Graph, n: { at: number; dur: number; semis: number; to?: number; kan?: number; vel: number; cents: number; phrase: string }): void {
    const p = this.params!;
    const at = Math.max(n.at, ctx.currentTime + 0.02);
    const hz = hzOf(n.semis + n.cents / 100);
    const bright = lerp(0.45, 0.68, p.register) * lerp(0.92, 1, Math.min(1, n.vel));
    const r = () => this.rand() * 2 - 1;
    // A string that is going to be pulled (meend) is played to ring longer, as a player sustains it.
    const data = renderPluck(sitarSpec(hz, MELODY_RATE, r, bright, n.to !== undefined ? 1.6 : 1));
    const buf = this.makeBuffer(ctx, data, MELODY_RATE);
    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Pitch over time, in semitones from the plucked pitch.
    const pts: [number, number][] = [];
    if (n.kan !== undefined) {
      const k = n.kan - n.semis;
      pts.push([0, k], [0.06, k], [0.11, 0]);
    } else {
      pts.push([0, 0.4], [0.07, 0]); // the string is a hair sharp as it leaves the finger
    }
    if (n.to !== undefined) {
      const hold = Math.max(0.3, Math.min(0.5, n.dur * 0.15));
      const glide = Math.max(0.6, Math.min(1.0, n.dur * 0.3));
      const dist = n.to - n.semis;
      pts.push([hold, 0]);
      for (let i = 1; i <= 16; i++) {
        const x = i / 16;
        pts.push([hold + glide * x, dist * (x * x * (3 - 2 * x))]);
      }
    }
    const rate = src.playbackRate;
    rate.setValueAtTime(Math.pow(2, pts[0][1] / 12), at);
    for (let i = 1; i < pts.length; i++) rate.linearRampToValueAtTime(Math.pow(2, pts[i][1] / 12), at + pts[i][0]);

    const g = ctx.createGain();
    const amp = MELODY_AMP * n.vel * p.velocity;
    g.gain.setValueAtTime(0, at);
    g.gain.linearRampToValueAtTime(amp, at + 0.004);
    if (n.to !== undefined) {
      // Pulling the string keeps it singing: the level is carried up a little through the slide, then it decays again.
      const t0 = at + Math.max(0.3, Math.min(0.5, n.dur * 0.15));
      g.gain.setTargetAtTime(amp * 1.7, t0, 0.35);
      g.gain.setTargetAtTime(amp * 0.9, t0 + 1.0, 1.2);
    }
    const pan = this.pan(ctx, (this.rand() - 0.5) * 0.24);
    src.connect(g);
    if (pan) g.connect(pan).connect(graph.melody);
    else g.connect(graph.melody);
    this.track(graph, src, [g, pan]);
    src.start(at);
    if (this.last) {
      this.last.gain.gain.setTargetAtTime(0, at, 0.045);
      try {
        this.last.src.stop(at + 0.7);
      } catch {
        // already ended
      }
    }
    this.last = { src, gain: g };
    this.options.log?.push({ t: at, hz, semis: n.semis, to: n.to, kan: n.kan, vel: n.vel * p.velocity, phrase: n.phrase, dur: n.dur });
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
    if (this.pumpTimer) clearInterval(this.pumpTimer);
    this.pumpTimer = null;
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
          graph?.stoppers.forEach((s) => s.stop());
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
    if (this.pumpTimer) clearInterval(this.pumpTimer);
    this.pumpTimer = null;
    if (!ctx) return;
    ctx.removeEventListener('statechange', this.onChange);
    try {
      graph?.fade.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
      graph?.oscs.forEach((o) => o.stop(ctx.currentTime + 0.2));
      graph?.stoppers.forEach((s) => s.stop(ctx.currentTime + 0.2));
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

    const fade = ctx.createGain();
    fade.gain.setValueAtTime(0, now); // silent until the fade-in: no start transient
    const level = ctx.createGain();
    level.gain.setValueAtTime(p.masterGain, now);
    // A gentle safety net for the sharp front of a pluck: it only touches the loudest peaks.
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -10;
    comp.knee.value = 8;
    comp.ratio.value = 3;
    comp.attack.value = 0.003;
    comp.release.value = 0.25;

    // Keep the very low end out: phone speakers cannot play it and it only muddies. Then the lid.
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 100;
    highpass.Q.value = 0.5;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.Q.value = 0.4;
    lowpass.frequency.setValueAtTime(p.cutoffHz, now);

    const dry = ctx.createGain();
    dry.gain.value = 0.8;
    const wet = ctx.createGain();
    wet.gain.setValueAtTime(p.reverbWet, now);
    const verb = ctx.createConvolver();
    verb.buffer = makeImpulse(ctx);

    const pre = ctx.createGain(); // everything is summed here
    pre.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(dry).connect(level);
    lowpass.connect(verb).connect(wet).connect(level);
    level.connect(comp).connect(fade).connect(ctx.destination);

    // The sitar's body is a gourd: a broad, nasal lift around 1.5 kHz.
    const melody = ctx.createGain();
    const body = ctx.createBiquadFilter();
    body.type = 'peaking';
    body.frequency.value = 1500;
    body.Q.value = 0.9;
    body.gain.value = 1.5;
    melody.connect(body).connect(pre);

    const drone = ctx.createGain();
    drone.connect(pre);

    // Sympathetic strings: five resonant delay loops tuned to the raga's notes. Each rings when the melody plays its
    // note (or a harmonic of it) and fades in about 2 s. The delay is a whole number of periods, at least 4 ms.
    const sympSend = ctx.createGain();
    sympSend.gain.setValueAtTime(SYMP_SEND * p.shimmer, now);
    const sympOut = ctx.createGain();
    sympOut.gain.value = SYMP_OUT;
    sympOut.connect(pre);
    if (this.options.shimmer !== false) {
      melody.connect(sympSend);
      for (const semis of SYMPATHETIC_SEMIS) {
        const hz = MELODY_SA_HZ * Math.pow(2, semis / 12);
        const m = Math.ceil(0.004 * hz);
        const delay = ctx.createDelay(0.1);
        delay.delayTime.value = m / hz;
        const damp = ctx.createBiquadFilter();
        damp.type = 'lowpass';
        damp.frequency.value = 3500;
        damp.Q.value = -3; // Q is in dB for a biquad low-pass: -3 dB is the flat (Butterworth) shape, so the loop can never gain
        const fb = ctx.createGain();
        fb.gain.value = 0.985;
        sympSend.connect(delay);
        delay.connect(damp).connect(fb).connect(delay);
        const tap = ctx.createGain();
        tap.gain.value = 1 / SYMPATHETIC_SEMIS.length;
        damp.connect(tap).connect(sympOut);
      }
    }
    return { melody, drone, sympSend, lowpass, wet, level, fade, stoppers: new Set(), oscs };
  }
}
