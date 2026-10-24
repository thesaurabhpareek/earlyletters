/**
 * ADR 0027 checks V3 (decode parity) and V4 (playback), the pure half: the test files V3 names, built from a
 * finished ADTS take, and the numbers V3 asks for, computed from decoded PCM. The Mac half (adts-parity.ts) runs
 * Core Audio on them (adts-coreaudio.swift, which mirrors ScribeAudio's probe and decodePcm16). Frame counting is the
 * app's own (`scanAdts`, apps/mobile/src/lib/capture/adts.ts), and the run is planned by the app's own
 * `openRecordingForRun` and `findSpeech` windows (transcribe-run.ts), exactly as transcribe-whisper.ts calls them.
 *
 * Pure: bytes in, bytes or numbers out. Nothing here reads or writes a file, or logs.
 */
import { AAC_FRAME_SAMPLES, AAC_MAX_BLOCK_BYTES_PER_CHANNEL, AAC_PRIMING_SAMPLES, adtsLengthEvidence, breaksInside, scanAdts, type AdtsScan } from '../apps/mobile/src/lib/capture/adts';
import { RunInputError, findSpeech, openRecordingForRun, type RecordingIo, type WholeFrameCopy } from '../apps/mobile/src/lib/transcribe-run';

/** Source samples a second (our recordings: 48 kHz) and the decoder's output rate (ScribeAudio: 16 kHz). */
export const SOURCE_RATE = 48_000;
export const PCM_RATE = 16_000;
/** One AAC frame at the 16 kHz the decoder returns: 1024 / 3 samples. */
export const FRAME_AT_PCM = (AAC_FRAME_SAMPLES * PCM_RATE) / SOURCE_RATE;
/** A frame_length a mono frame may claim (ADR 0027 `plausibleLength`: 7 + 768 + 4). */
export const MAX_PLAUSIBLE_MONO = 7 + AAC_MAX_BLOCK_BYTES_PER_CHANNEL + 4;
/** A 16-bit RMS above this holds signal; the generated take never falls below it, digital silence is 0. */
export const SIGNAL_RMS = 200;
/** A correlation at least this high, within one frame of lag, means the same audio. */
export const SAME_AUDIO = 0.9;

const frameLengthAt = (b: Uint8Array, at: number) => ((b[at + 3] & 0x03) << 11) | (b[at + 4] << 3) | (b[at + 5] >> 5);

/**
 * Where each whole frame starts, walked along the chain scanAdts proved (reading only each header's frame_length).
 * Throws if the bytes are not ADTS or the walk does not land on scanAdts's `wholeBytes`.
 */
export function frameStarts(bytes: Uint8Array): { starts: number[]; scan: AdtsScan } {
  const scan = scanAdts(bytes);
  if (!scan) throw new Error('not_adts');
  const starts: number[] = [];
  let at = 0;
  while (at < scan.wholeBytes) {
    starts.push(at);
    const len = frameLengthAt(bytes, at);
    if (len < 7) throw new Error('walk_off_chain');
    at += len;
  }
  if (at !== scan.wholeBytes) throw new Error('walk_off_chain');
  return { starts, scan };
}

export interface TestFile {
  name: string;
  /** What the case is, for the report. */
  what: string;
  bytes: Uint8Array;
}

/**
 * V3's truncated files: a finished take cut where a kill can cut it, at three offsets: inside a frame's payload
 * (frame 30 from the end), inside a header (3 bytes into the frame 20 from the end), and right after a whole header
 * (frame 10 from the end). Each must scan as a kill cut. Written for our recorder's frames (7-byte headers, 11 bytes
 * and up): a frame under 9 bytes has no payload byte past 8 to cut inside, and with a CRC (9-byte header) the "after
 * the header" cut lands inside it.
 */
export function truncations(bytes: Uint8Array): TestFile[] {
  const { starts } = frameStarts(bytes);
  if (starts.length < 31) throw new Error('take_too_short');
  const at = (fromEnd: number) => starts[starts.length - fromEnd];
  const len = (fromEnd: number) => frameLengthAt(bytes, at(fromEnd));
  const mid = Math.min(len(30) - 1, Math.max(8, Math.floor(len(30) / 2)));
  return [
    { name: 'cut-mid-frame', what: `cut ${mid} bytes into the frame 30 from the end`, bytes: bytes.slice(0, at(30) + mid) },
    { name: 'cut-mid-header', what: 'cut 3 bytes into the header of the frame 20 from the end', bytes: bytes.slice(0, at(20) + 3) },
    { name: 'cut-after-header', what: 'cut right after the whole header of the frame 10 from the end', bytes: bytes.slice(0, at(10) + 7) },
  ];
}

/** V3 damage (a): the sync byte of the frame 20 from the end zeroed, so 19 whole frames follow the damage. */
export function damageSync(bytes: Uint8Array, fromEnd = 20): TestFile & { damagedAt: number; damagedFrame: number } {
  const { starts } = frameStarts(bytes);
  const i = starts.length - fromEnd;
  const out = bytes.slice();
  out[starts[i]] = 0x00;
  return { name: 'damage-sync', what: `the sync byte of the frame ${fromEnd} from the end zeroed`, bytes: out, damagedAt: starts[i], damagedFrame: i };
}

/**
 * V3 damage (b): the frame_length of the frame 10 from the end set to a possible but wrong value, one that lands
 * inside the next frame (its true length plus half the next frame's), so a reader that follows it loses the sync.
 */
export function damageLength(bytes: Uint8Array, fromEnd = 10): TestFile & { damagedAt: number; damagedFrame: number; trueLength: number; claimedLength: number } {
  const { starts } = frameStarts(bytes);
  const i = starts.length - fromEnd;
  const at = starts[i];
  const trueLength = frameLengthAt(bytes, at);
  const nextLength = frameLengthAt(bytes, starts[i + 1]);
  const claimedLength = Math.min(MAX_PLAUSIBLE_MONO, trueLength + Math.max(1, Math.floor(nextLength / 2)));
  if (claimedLength === trueLength) throw new Error('no_wrong_length_possible');
  const out = bytes.slice();
  out[at + 3] = (out[at + 3] & 0xfc) | ((claimedLength >> 11) & 0x03);
  out[at + 4] = (claimedLength >> 3) & 0xff;
  out[at + 5] = (out[at + 5] & 0x1f) | ((claimedLength & 0x07) << 5);
  return {
    name: 'damage-length',
    what: `the frame_length of the frame ${fromEnd} from the end set to ${claimedLength} (true ${trueLength})`,
    bytes: out,
    damagedAt: at,
    damagedFrame: i,
    trueLength,
    claimedLength,
  };
}

/** Little-endian PCM16 bytes as samples. */
export function pcm16(bytes: Uint8Array): Int16Array {
  const out = new Int16Array(Math.floor(bytes.length / 2));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  for (let i = 0; i < out.length; i++) out[i] = view.getInt16(i * 2, true);
  return out;
}

/**
 * The lag (in samples) that best lines `b` up with `a`: `b[i + lag]` against `a[i]` over `a[from, from + length)`,
 * for every lag in [-maxLag, maxLag], by normalized cross-correlation. `score` is 1 for identical shapes. Both are
 * null when no lag has signal on both sides (silence, or no overlap): then nothing can be said.
 */
export function crossCorrelate(a: Int16Array, b: Int16Array, o: { from: number; length: number; maxLag: number }): { lag: number | null; score: number | null } {
  let best: { lag: number | null; score: number | null } = { lag: null, score: null };
  const end = Math.min(a.length, o.from + o.length);
  for (let lag = -o.maxLag; lag <= o.maxLag; lag++) {
    let dot = 0;
    let ea = 0;
    let eb = 0;
    for (let i = o.from; i < end; i++) {
      const j = i + lag;
      if (j < 0 || j >= b.length) continue;
      dot += a[i] * b[j];
      ea += a[i] * a[i];
      eb += b[j] * b[j];
    }
    if (ea === 0 || eb === 0) continue;
    const score = dot / Math.sqrt(ea * eb);
    if (best.score === null || score > best.score) best = { lag, score };
  }
  return best;
}

/** Root mean square of `pcm[from, to)`. */
export function rms(pcm: Int16Array, from = 0, to = pcm.length): number {
  let s = 0;
  const end = Math.min(to, pcm.length);
  for (let i = Math.max(0, from); i < end; i++) s += pcm[i] * pcm[i];
  return end > from ? Math.sqrt(s / (end - Math.max(0, from))) : 0;
}

/** How many samples at the end of `pcm` are exactly zero (ScribeAudio zero-fills a read that stops early). */
export function zeroRunAtEnd(pcm: Int16Array): number {
  let n = 0;
  for (let i = pcm.length - 1; i >= 0 && pcm[i] === 0; i--) n++;
  return n;
}

/** A seeded generator (mulberry32), so a generated take is the same on every run. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A 16-bit mono WAV at 48 kHz with signal in every moment, to the last sample (V3 allows a tone with a known
 * envelope in place of speech; never a voice). A bed of sweeps (300 to 3000 Hz, a 2.3 s period, its level drifting
 * on a 3.7 s cycle) runs the whole length, so the frames V3 damages near the end always hold audio to compare
 * (review of #282: chirps alone left the last half second silent). Chirps (300 to 3000 Hz over 200 ms) at irregular
 * onsets ride on it, the last one cut off by the end, and give the cross-correlation one sharp peak.
 */
export function chirpWav(seconds: number, seed = 27): { wav: Uint8Array; onsetsMs: number[] } {
  const n = Math.round(seconds * SOURCE_RATE);
  const samples = new Float64Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SOURCE_RATE;
    const f = 300 + 2700 * ((t % 2.3) / 2.3);
    phase += (2 * Math.PI * f) / SOURCE_RATE;
    samples[i] = 0.12 * (0.65 + 0.35 * Math.sin((2 * Math.PI * t) / 3.7)) * Math.sin(phase);
  }
  const rand = seeded(seed);
  const onsetsMs: number[] = [];
  const burst = Math.round(0.2 * SOURCE_RATE);
  for (let t = 0.25 + rand() * 0.5; t * SOURCE_RATE < n; t += 0.45 + rand() * 0.9) {
    const start = Math.round(t * SOURCE_RATE);
    onsetsMs.push(Math.round(t * 1000));
    for (let k = 0; k < burst && start + k < n; k++) {
      const x = k / SOURCE_RATE;
      const ph = 2 * Math.PI * (300 * x + ((3000 - 300) / (2 * 0.2)) * x * x);
      samples[start + k] += 0.3 * Math.sin((Math.PI * k) / burst) * Math.sin(ph);
    }
  }
  const wav = new Uint8Array(44 + n * 2);
  const view = new DataView(wav.buffer);
  const tag = (o: number, s: string) => {
    for (let i = 0; i < 4; i++) wav[o + i] = s.charCodeAt(i);
  };
  tag(0, 'RIFF');
  view.setUint32(4, 36 + n * 2, true);
  tag(8, 'WAVE');
  tag(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SOURCE_RATE, true);
  view.setUint32(28, SOURCE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  tag(36, 'data');
  view.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) view.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), true);
  return { wav, onsetsMs };
}

/**
 * How a decoded length (at the source rate) stands against the counted frames: within one frame, or within one
 * frame once Apple's assumed 2112 samples of priming are taken off (TN2258), or neither.
 */
export function lengthAgainstFrames(lengthFrames: number, countedFrames: number): { gap: number; within: 'one-frame' | 'one-frame-after-priming' | 'no' } {
  const counted = countedFrames * AAC_FRAME_SAMPLES;
  const gap = counted - lengthFrames;
  if (Math.abs(gap) <= AAC_FRAME_SAMPLES) return { gap, within: 'one-frame' };
  if (Math.abs(gap - AAC_PRIMING_SAMPLES) <= AAC_FRAME_SAMPLES) return { gap, within: 'one-frame-after-priming' };
  return { gap, within: 'no' };
}

export interface WindowRead {
  startMs: number;
  endMs: number;
  samples: number;
  /** Exact zeros at the end of what came back. */
  zeroTail: number;
}

export interface PlannedRun {
  /** `decoder_short`, `break_inside`, `duration_invalid`, or the decoder's own error code; null when planned. */
  refused: string | null;
  durationMs: number | null;
  countedMs: number | null;
  /** Whether the run read a copy of the whole frames (only for a kill-cut tail). */
  usedCopy: boolean;
  windows: WindowRead[];
}

/** An error's code, never its message (a helper's message can hold a path). */
export function codeOf(e: unknown): string {
  if (e instanceof RunInputError) return e.reason;
  const code = (e as { code?: unknown } | null)?.code;
  return typeof code === 'string' && /^[A-Za-z0-9_]+$/.test(code) ? code : 'error';
}

/**
 * The input half of the app's transcription job, as transcribe-whisper.ts runs it, up to Whisper: the frame scan,
 * `openRecordingForRun` (length check, whole-frame copy, refusal), then the app's own `findSpeech` with a voice
 * detector that finds nothing, so every 5-minute window is decoded exactly as the app decodes it. Whisper itself is
 * not run (the speech packs are the phone's); refusal is decided before it, and the audio it would hear is what the
 * windows return.
 */
export async function planRun(io: RecordingIo, uri: string, bytes: Uint8Array, storedMs: number | null, makeCopy: (wholeBytes: number) => Promise<WholeFrameCopy>): Promise<PlannedRun> {
  const adts = scanAdts(bytes);
  let usedCopy = false;
  const facts = adts ? { evidence: adtsLengthEvidence(adts), tail: adts.wholeBytes > 0 ? adts.tail : ('none' as const), breakInside: breaksInside(adts) } : null;
  const countedMs = facts ? facts.evidence.countedMs : null;
  let run;
  try {
    run = await openRecordingForRun(io, uri, storedMs, facts, async () => {
      usedCopy = true;
      return makeCopy(adts?.wholeBytes ?? 0);
    });
  } catch (e) {
    return { refused: codeOf(e), durationMs: null, countedMs, usedCopy, windows: [] };
  }
  const windows: WindowRead[] = [];
  try {
    await findSpeech(run.durationMs, {
      decodeWindow: async (startMs, endMs) => {
        const buf = await run.decode([{ srcStartMs: startMs, srcEndMs: endMs, silenceBeforeMs: 0 }]);
        const pcm = new Int16Array(buf);
        windows.push({ startMs, endMs, samples: pcm.length, zeroTail: zeroRunAtEnd(pcm) });
        return buf;
      },
      detectSpeech: async () => [],
    });
  } catch (e) {
    return { refused: codeOf(e), durationMs: run.durationMs, countedMs, usedCopy, windows };
  } finally {
    run.close();
  }
  return { refused: null, durationMs: run.durationMs, countedMs, usedCopy, windows };
}

export type DamageReading = 'refused' | 'short-not-refused' | 'read-past' | 'stops-silently' | 'mismatch' | 'cannot-tell' | 'helper-failed';

/**
 * ADR 0027's reading of a damaged file (V3), from what Core Audio did:
 * - the helper crashed or timed out on it: that is itself an answer to report;
 * - a short or unreadable probe is fine when the run is refused (as the app refuses it), and a finding when not;
 * - at full length, a read that returned nothing with Core Audio's own length unread (`earlyStops`, the helper's
 *   count, the primary evidence) means Core Audio stops silently: the native early-stop check (S08) goes in first;
 * - otherwise the audio past the damage is compared with the undamaged take's, from four frames past the damage (the
 *   ADR's 85 ms tolerance) and within four frames of lag (a decoder that drops the damaged frame shifts what follows),
 *   but only where the undamaged take has signal (`referenceRms` at least SIGNAL_RMS) over enough samples: exact zeros
 *   there mean a silent stop, a correlation of SAME_AUDIO or more means read past, anything else is a mismatch. Where
 *   the undamaged take is silent or the span too short, this file cannot tell, and says so.
 */
export function damageReading(o: {
  helperFailed: string | null;
  probeOk: boolean;
  fullLength: boolean;
  refused: string | null;
  earlyStops: number;
  referenceRms: number | null;
  comparable: boolean;
  pastAllZero: boolean;
  score: number | null;
}): { reading: DamageReading; text: string; failure: boolean; decided: boolean } {
  if (o.helperFailed) return { reading: 'helper-failed', text: `the Core Audio helper failed on this file (${o.helperFailed}): report it, it is itself a V3 answer`, failure: true, decided: true };
  if (!o.probeOk || !o.fullLength) {
    return o.refused
      ? { reading: 'refused', text: `short or unreadable, and the run is refused (${o.refused}), as ADR 0027 wants`, failure: false, decided: true }
      : { reading: 'short-not-refused', text: 'short or unreadable, and the run was not refused: report it', failure: true, decided: true };
  }
  if (o.earlyStops > 0) {
    return { reading: 'stops-silently', text: 'FULL LENGTH, A READ STOPPED EARLY: Core Audio stops silently at the damage; the native early-stop check (S08) goes in before the flip', failure: true, decided: true };
  }
  if (!o.comparable || o.referenceRms === null || o.referenceRms < SIGNAL_RMS) {
    return { reading: 'cannot-tell', text: 'cannot tell: the undamaged take is silent (or too short) past the damage, so there is nothing to compare; use a take with signal to its end', failure: false, decided: false };
  }
  if (o.pastAllZero) {
    return { reading: 'stops-silently', text: 'FULL LENGTH, ZEROS PAST THE DAMAGE where the undamaged take has signal: Core Audio stops silently; the native early-stop check (S08) goes in before the flip', failure: true, decided: true };
  }
  if (o.score !== null && o.score >= SAME_AUDIO) return { reading: 'read-past', text: 'full length, the right audio past the damage: read past', failure: false, decided: true };
  return { reading: 'mismatch', text: 'full length, audio past the damage that does not match the undamaged take: report it', failure: true, decided: true };
}
