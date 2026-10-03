/**
 * Chunk planner for on-device transcription (TDD 03 3.5.3). Pure: no React
 * Native, tested in Node (test/transcribe-plan.test.ts).
 *
 * Input: speech spans from voice activity detection (Silero VAD through
 * whisper.rn), in milliseconds of the recording. Output: chunks of at most
 * `maxChunkMs` of audio, each sent to Whisper in its own `transcribeData`
 * call with the family dictionary prompt. One call per chunk matters:
 * whisper.rn forces `no_context = true` and does not carry the initial
 * prompt past the first 30 s window, so a single long call would spell
 * names right only in the first half minute.
 *
 * Rules:
 * - Only speech goes to Whisper. Silence before, between and after speech
 *   is not sent, so the recogniser has nothing to invent words from.
 *   Pauses up to `keepPauseMs` stay exactly as recorded (they carry
 *   sentence breaks); longer pauses are replaced by `shortenedPauseMs` of
 *   digital silence, the same approach whisper.cpp takes with its own VAD.
 * - Chunks are cut in pauses: when the next span does not fit, the cut
 *   goes at the longest pause in the second half of the chunk.
 * - A single run of speech longer than a chunk (no pause the VAD could
 *   find) is split evenly with `overlapMs` of shared audio on each side of
 *   every cut. Each part owns the words whose midpoint falls on its side of
 *   the cut (`ownStartMs`, `ownEndMs`), so a word heard twice in the overlap
 *   is kept once and a word on the cut is kept by exactly one part.
 * - Deterministic: the same spans always give the same chunks.
 */

export interface SpeechSpan {
  startMs: number;
  endMs: number;
}

/** One contiguous range of the recording decoded into a chunk. */
export interface ChunkPiece {
  srcStartMs: number;
  srcEndMs: number;
  /** Digital silence placed before this piece, standing in for a long pause (0 for the first piece). */
  silenceBeforeMs: number;
}

export interface Chunk {
  index: number;
  pieces: ChunkPiece[];
  /**
   * Source time this chunk speaks for. A side is open (-Infinity or
   * Infinity) unless it is a seam inside continuous speech, where the
   * neighbouring chunk overlaps this one.
   */
  ownStartMs: number;
  ownEndMs: number;
  /** Length of the audio sent to Whisper: pieces plus inserted silence. */
  audioMs: number;
  /** Speech in this chunk according to the VAD (for the words-per-second check). */
  speechMs: number;
}

export interface PlanOptions {
  /** Upper bound on the audio in one Whisper call (Whisper's window is 30 s). */
  maxChunkMs: number;
  /** Audio shared across a cut inside continuous speech, on each side. */
  overlapMs: number;
  /** Pauses up to this length are kept as recorded. */
  keepPauseMs: number;
  /** Longer pauses become this much silence. */
  shortenedPauseMs: number;
}

export const PLAN_DEFAULTS: PlanOptions = {
  maxChunkMs: 28_000,
  overlapMs: 500,
  keepPauseMs: 1_500,
  shortenedPauseMs: 600,
};

/** Clamp to the recording, drop empty spans, sort, merge spans that overlap. Touching spans stay separate (a cut point in a short pause). */
export function normalizeSpans(spans: SpeechSpan[], durationMs: number): SpeechSpan[] {
  const end = Math.max(0, durationMs);
  const clean = spans
    .map((s) => ({ startMs: Math.max(0, Math.round(s.startMs)), endMs: Math.min(end, Math.round(s.endMs)) }))
    .filter((s) => Number.isFinite(s.startMs) && Number.isFinite(s.endMs) && s.endMs > s.startMs)
    .sort((a, b) => a.startMs - b.startMs || a.endMs - b.endMs);
  const out: SpeechSpan[] = [];
  for (const s of clean) {
    const last = out[out.length - 1];
    if (last && s.startMs < last.endMs) last.endMs = Math.max(last.endMs, s.endMs);
    else out.push({ ...s });
  }
  return out;
}

/**
 * VAD runs over the recording in windows (a long letter is never decoded
 * whole). A span cut by a window edge is one run of speech, not a pause:
 * join spans that touch at a window boundary so the planner never cuts
 * there without overlap.
 */
export function joinAtBoundaries(spans: SpeechSpan[], boundariesMs: number[], toleranceMs = 40): SpeechSpan[] {
  const out: SpeechSpan[] = [];
  for (const s of spans) {
    const last = out[out.length - 1];
    const touching =
      last &&
      s.startMs - last.endMs <= toleranceMs &&
      boundariesMs.some((b) => Math.abs(last.endMs - b) <= toleranceMs && Math.abs(s.startMs - b) <= toleranceMs);
    if (last && touching) last.endMs = Math.max(last.endMs, s.endMs);
    else out.push({ ...s });
  }
  return out;
}

const len = (s: SpeechSpan) => s.endMs - s.startMs;

/**
 * Plans the Whisper calls for one recording. Returns [] when there is no
 * speech: the caller must then return an empty transcript and never run
 * Whisper (TDD 03 3.5.7 rule 1).
 */
export function planChunks(spansIn: SpeechSpan[], durationMs: number, options: Partial<PlanOptions> = {}): Chunk[] {
  const o: PlanOptions = { ...PLAN_DEFAULTS, ...options };
  if (o.maxChunkMs <= 2 * o.overlapMs + 1_000) throw new Error('plan_options_invalid');
  const spans = normalizeSpans(spansIn, durationMs);
  const gapCost = (gap: number) => (gap <= o.keepPauseMs ? gap : o.shortenedPauseMs);
  const gap = (k: number) => spans[k].startMs - spans[k - 1].endMs;
  /** Audio length of spans[i..j) packed into one chunk. */
  const audioLen = (i: number, j: number) => {
    let total = 0;
    for (let k = i; k < j; k++) total += len(spans[k]) + (k > i ? gapCost(gap(k)) : 0);
    return total;
  };

  const chunks: Chunk[] = [];
  const push = (c: Omit<Chunk, 'index'>) => chunks.push({ index: chunks.length, ...c });

  let i = 0;
  while (i < spans.length) {
    const span = spans[i];
    if (len(span) > o.maxChunkMs) {
      splitLongSpan(span, o).forEach(push);
      i += 1;
      continue;
    }
    let j = i + 1;
    while (j < spans.length && len(spans[j]) <= o.maxChunkMs && audioLen(i, j + 1) <= o.maxChunkMs) j += 1;
    const closedEarly = j < spans.length && len(spans[j]) <= o.maxChunkMs;
    if (closedEarly && j - i >= 2) {
      // Cut at the longest pause in the second half of the chunk (ties go to the later pause).
      let best = j;
      let bestGap = gap(j);
      for (let k = j - 1; k > i; k--) {
        if (audioLen(i, k) < o.maxChunkMs / 2) break;
        if (gap(k) > bestGap) {
          best = k;
          bestGap = gap(k);
        }
      }
      j = best;
    }
    push(packedChunk(spans.slice(i, j), o));
    i = j;
  }
  return chunks;
}

function packedChunk(group: SpeechSpan[], o: PlanOptions): Omit<Chunk, 'index'> {
  const pieces: ChunkPiece[] = [];
  let audioMs = 0;
  let speechMs = 0;
  for (let k = 0; k < group.length; k++) {
    const s = group[k];
    speechMs += len(s);
    const last = pieces[pieces.length - 1];
    if (last) {
      const g = s.startMs - last.srcEndMs;
      if (g <= o.keepPauseMs) {
        audioMs += g + len(s);
        last.srcEndMs = s.endMs; // the pause stays as recorded, inside one piece
        continue;
      }
      pieces.push({ srcStartMs: s.startMs, srcEndMs: s.endMs, silenceBeforeMs: o.shortenedPauseMs });
      audioMs += o.shortenedPauseMs + len(s);
      continue;
    }
    pieces.push({ srcStartMs: s.startMs, srcEndMs: s.endMs, silenceBeforeMs: 0 });
    audioMs += len(s);
  }
  return { pieces, ownStartMs: -Infinity, ownEndMs: Infinity, audioMs, speechMs };
}

/** Even parts with `overlapMs` shared on each side of every interior cut. */
function splitLongSpan(span: SpeechSpan, o: PlanOptions): Omit<Chunk, 'index'>[] {
  const total = len(span);
  const n = Math.ceil(total / (o.maxChunkMs - 2 * o.overlapMs));
  const cuts = Array.from({ length: n + 1 }, (_, k) => (k === n ? span.endMs : span.startMs + Math.round((k * total) / n)));
  const parts: Omit<Chunk, 'index'>[] = [];
  for (let k = 0; k < n; k++) {
    const src = { start: Math.max(span.startMs, cuts[k] - o.overlapMs), end: Math.min(span.endMs, cuts[k + 1] + o.overlapMs) };
    parts.push({
      pieces: [{ srcStartMs: src.start, srcEndMs: src.end, silenceBeforeMs: 0 }],
      ownStartMs: k === 0 ? -Infinity : cuts[k],
      ownEndMs: k === n - 1 ? Infinity : cuts[k + 1],
      audioMs: src.end - src.start,
      speechMs: src.end - src.start,
    });
  }
  return parts;
}

/** Maps a time in a chunk's audio back to the recording. Inserted silence maps to the start of the piece after it. */
export function chunkTimeToSourceMs(chunk: Chunk, tMs: number): number {
  let pos = 0;
  for (const p of chunk.pieces) {
    pos += p.silenceBeforeMs;
    if (tMs < pos) return p.srcStartMs;
    const pieceLen = p.srcEndMs - p.srcStartMs;
    if (tMs < pos + pieceLen) return p.srcStartMs + Math.max(0, tMs - pos);
    pos += pieceLen;
  }
  const last = chunk.pieces[chunk.pieces.length - 1];
  return last ? last.srcEndMs : 0;
}

/** Total samples (16 kHz mono) in a chunk's audio: what the decoder must produce. */
export function chunkSampleCount(chunk: Chunk, sampleRate = 16_000): number {
  return chunk.pieces.reduce(
    (n, p) => n + msToSamples(p.silenceBeforeMs, sampleRate) + msToSamples(p.srcEndMs - p.srcStartMs, sampleRate),
    0,
  );
}

export function msToSamples(ms: number, sampleRate = 16_000): number {
  return Math.max(0, Math.round((ms * sampleRate) / 1000));
}

/** Windows (ms) over which VAD runs, so a long letter is never decoded whole. */
export function vadWindows(durationMs: number, windowMs = 5 * 60_000): Array<{ startMs: number; endMs: number }> {
  const out: Array<{ startMs: number; endMs: number }> = [];
  for (let s = 0; s < durationMs; s += windowMs) out.push({ startMs: s, endMs: Math.min(durationMs, s + windowMs) });
  return out;
}
