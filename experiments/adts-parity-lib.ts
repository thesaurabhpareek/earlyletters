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
import { vadWindows } from '../apps/mobile/src/lib/transcribe-plan';
import { RunInputError, openRecordingForRun, type DecodeRange, type RecordingIo, type WholeFrameCopy } from '../apps/mobile/src/lib/transcribe-run';

/** Source samples a second (our recordings: 48 kHz) and the decoder's output rate (ScribeAudio: 16 kHz). */
export const SOURCE_RATE = 48_000;
export const PCM_RATE = 16_000;
/** One AAC frame at the 16 kHz the decoder returns: 1024 / 3 samples. */
export const FRAME_AT_PCM = (AAC_FRAME_SAMPLES * PCM_RATE) / SOURCE_RATE;
/** A frame_length a mono frame may claim (ADR 0027 `plausibleLength`: 7 + 768 + 4). */
export const MAX_PLAUSIBLE_MONO = 7 + AAC_MAX_BLOCK_BYTES_PER_CHANNEL + 4;

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
 * (frame 10 from the end). Each must scan as a kill cut.
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
 * for every lag in [-maxLag, maxLag], by normalized cross-correlation. `score` is 1 for identical shapes.
 */
export function crossCorrelate(a: Int16Array, b: Int16Array, o: { from: number; length: number; maxLag: number }): { lag: number; score: number } {
  let best = { lag: 0, score: -Infinity };
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
    const score = ea > 0 && eb > 0 ? dot / Math.sqrt(ea * eb) : 0;
    if (score > best.score) best = { lag, score };
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
 * A 16-bit mono WAV at 48 kHz of chirps (300 to 3000 Hz over 200 ms) at irregular onsets, silence between: a tone
 * with a known envelope (V3 allows it in place of speech), whose cross-correlation has one sharp peak. Never a voice.
 */
export function chirpWav(seconds: number, seed = 27): { wav: Uint8Array; onsetsMs: number[] } {
  const n = Math.round(seconds * SOURCE_RATE);
  const samples = new Int16Array(n);
  const rand = seeded(seed);
  const onsetsMs: number[] = [];
  const burst = Math.round(0.2 * SOURCE_RATE);
  for (let t = 0.25 + rand() * 0.5; t * SOURCE_RATE + burst < n; t += 0.45 + rand() * 0.9) {
    const start = Math.round(t * SOURCE_RATE);
    onsetsMs.push(Math.round(t * 1000));
    for (let k = 0; k < burst; k++) {
      const x = k / SOURCE_RATE;
      const phase = 2 * Math.PI * (300 * x + ((3000 - 300) / (2 * 0.2)) * x * x);
      const env = Math.sin((Math.PI * k) / burst);
      samples[start + k] = Math.round(0.3 * 32767 * env * Math.sin(phase));
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
  for (let i = 0; i < n; i++) view.setInt16(44 + i * 2, samples[i], true);
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

/**
 * The input half of the app's transcription job, as transcribe-whisper.ts runs it, up to Whisper: the frame scan,
 * `openRecordingForRun` (length check, whole-frame copy, refusal), then every 5-minute window decoded as
 * `findSpeech` decodes it. Whisper itself is not run (the speech packs are the phone's); refusal is decided before
 * it, and the audio it would hear is what the windows return.
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
    const code = e instanceof RunInputError ? e.reason : String((e as { code?: unknown })?.code ?? (e as Error)?.message ?? 'error');
    return { refused: code, durationMs: null, countedMs, usedCopy, windows: [] };
  }
  const windows: WindowRead[] = [];
  try {
    for (const w of vadWindows(run.durationMs)) {
      const pcm = new Int16Array(await run.decode([{ srcStartMs: w.startMs, srcEndMs: w.endMs, silenceBeforeMs: 0 } satisfies DecodeRange]));
      windows.push({ startMs: w.startMs, endMs: w.endMs, samples: pcm.length, zeroTail: zeroRunAtEnd(pcm) });
    }
  } catch (e) {
    const code = e instanceof RunInputError ? e.reason : String((e as { code?: unknown })?.code ?? (e as Error)?.message ?? 'error');
    return { refused: code, durationMs: run.durationMs, countedMs, usedCopy, windows };
  } finally {
    run.close();
  }
  return { refused: null, durationMs: run.durationMs, countedMs, usedCopy, windows };
}
