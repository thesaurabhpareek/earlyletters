/**
 * Whisper output to raw transcript (TDD 03 3.5.7, 3.8). Pure: tested in Node
 * (test/transcribe-post.test.ts).
 *
 * whisper.rn is called with `tokenTimestamps: true, maxLen: 1`, so every
 * returned segment is one token with its own times (centiseconds, relative
 * to the chunk audio). The chunk TEXT always comes from `result`, which
 * whisper.rn concatenates in C++ before converting to a JS string: per-token
 * segment texts can split one Devanagari (or other multi-byte) character
 * across two segments, and each half then reaches JS as broken UTF-8.
 * Tokens are used only where they are needed and only when they reproduce
 * `result` exactly:
 * - at a seam (planner overlap in continuous speech), a token belongs to
 *   the chunk whose own range holds its midpoint, so a word both sides
 *   heard is kept once. If the tokens are not trustworthy, the caller
 *   decodes that part again without the overlap instead;
 * - word times for later highlighting (v1.1; not stored yet).
 *
 * Nothing here adds, reorders or rewrites words. Raw is a record of what the
 * recogniser heard in speech; the only things removed are non-speech tags
 * (@scribe/core stripNonSpeech) and the second copy of audio both sides of a
 * seam heard.
 */
import { stripNonSpeech } from '@scribe/core';
import { chunkTimeToSourceMs, type Chunk } from './transcribe-plan';

/** One whisper.rn segment as returned by transcribeData (t0, t1 in centiseconds). */
export interface WhisperSegment {
  text: string;
  t0: number;
  t1: number;
}

/** The parts of a whisper.rn TranscribeResult this module reads. */
export interface ChunkDecode {
  result: string;
  segments: WhisperSegment[];
}

/** A token placed on the recording's own timeline. */
export interface SourceToken {
  text: string;
  startMs: number;
  endMs: number;
}

export interface TimedWord {
  text: string;
  startMs: number;
  endMs: number;
}

export interface ChunkText {
  text: string;
  words: TimedWord[];
  /** Seam chunk whose tokens cannot be trusted: decode `withoutOverlap(chunk)` and use its result instead. */
  redecodeWithoutOverlap: boolean;
}

export const hasSeam = (c: Chunk): boolean => Number.isFinite(c.ownStartMs) || Number.isFinite(c.ownEndMs);

export function collapseSpaces(s: string): string {
  return s.replace(/[ \t\r\n]+/g, ' ').trim();
}

/** Tokens to text exactly as Whisper spelled them (tokens carry their own leading spaces). */
export function tokensText(tokens: Array<{ text: string }>): string {
  return collapseSpaces(tokens.map((t) => t.text).join(''));
}

/** True when per-token texts are whole characters and add up to the C++ result. */
export function tokensTrustworthy(d: ChunkDecode): boolean {
  if (d.segments.some((s) => s.text.includes('�'))) return false;
  return tokensText(d.segments) === collapseSpaces(d.result);
}

/**
 * Tokens of one chunk this chunk is responsible for, mapped to recording
 * time. At an open side (no seam) every token is kept, whatever its time.
 */
export function ownedTokens(chunk: Chunk, segments: WhisperSegment[]): SourceToken[] {
  const out: SourceToken[] = [];
  for (const s of segments) {
    if (!s.text) continue;
    const t0 = Math.max(0, s.t0 * 10);
    const t1 = Math.max(t0, s.t1 * 10);
    const startMs = chunkTimeToSourceMs(chunk, t0);
    const endMs = Math.max(startMs, chunkTimeToSourceMs(chunk, t1));
    const mid = (startMs + endMs) / 2;
    if (mid < chunk.ownStartMs || mid >= chunk.ownEndMs) continue;
    out.push({ text: s.text, startMs, endMs });
  }
  return out;
}

/** The text (and, when tokens are sound, word times) one chunk contributes. */
export function chunkText(chunk: Chunk, d: ChunkDecode): ChunkText {
  const full = collapseSpaces(d.result);
  const sound = tokensTrustworthy(d);
  if (!hasSeam(chunk)) return { text: full, words: sound ? tokensToWords(ownedTokens(chunk, d.segments)) : [], redecodeWithoutOverlap: false };
  if (!sound) return { text: '', words: [], redecodeWithoutOverlap: true };
  const owned = ownedTokens(chunk, d.segments);
  return { text: tokensText(owned), words: tokensToWords(owned), redecodeWithoutOverlap: false };
}

/** The same part with its audio trimmed to exactly the range it owns (no overlap, open sides). */
export function withoutOverlap(chunk: Chunk): Chunk {
  const first = chunk.pieces[0];
  const last = chunk.pieces[chunk.pieces.length - 1];
  const start = Math.max(first.srcStartMs, Number.isFinite(chunk.ownStartMs) ? chunk.ownStartMs : first.srcStartMs);
  const end = Math.min(last.srcEndMs, Number.isFinite(chunk.ownEndMs) ? chunk.ownEndMs : last.srcEndMs);
  return {
    index: chunk.index,
    pieces: [{ srcStartMs: start, srcEndMs: Math.max(start, end), silenceBeforeMs: 0 }],
    ownStartMs: -Infinity,
    ownEndMs: Infinity,
    audioMs: Math.max(0, end - start),
    speechMs: Math.max(0, end - start),
  };
}

/** Chunk text as it may enter raw: non-speech tags removed (never words inside speech). */
export function speechOnly(text: string): string {
  return collapseSpaces(stripNonSpeech(text));
}

/** Joins chunk texts in order with one space. Empty chunks add nothing. */
export function joinChunks(texts: string[]): string {
  return collapseSpaces(texts.filter((t) => t.trim().length > 0).join(' '));
}

/**
 * Words with recording times from tokens: a token that starts with a space
 * starts a new word; one without extends the previous word (sub-word
 * pieces). Punctuation attaches to the word before it without moving its
 * end time.
 */
export function tokensToWords(tokens: SourceToken[]): TimedWord[] {
  const words: TimedWord[] = [];
  for (const t of tokens) {
    const piece = t.text.trim();
    if (!piece) continue;
    const last = words[words.length - 1];
    const hasLetters = /[\p{L}\p{N}\p{M}]/u.test(piece);
    const startsWord = /^\s/.test(t.text) || !last;
    if (last && (!startsWord || !hasLetters)) {
      last.text += piece;
      if (hasLetters) last.endMs = Math.max(last.endMs, t.endMs);
      continue;
    }
    words.push({ text: piece, startMs: t.startMs, endMs: t.endMs });
  }
  return words;
}

/**
 * Units of speech for the loop check: words, except that each Han, kana or
 * Hangul character counts on its own (Mandarin has no spaces; one character
 * is about one syllable).
 */
const UNIT_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]|[\p{L}\p{N}\p{M}']+/gu;
const SYLLABIC_RE = /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]$/u;

export function speechUnits(text: string): string[] {
  return text.toLowerCase().match(UNIT_RE) ?? [];
}

/**
 * A decode that got stuck repeating itself (TDD 03 3.5.7 rule 3): any 1 to 4
 * unit phrase said 4 or more times back to back, or more units per second
 * of speech than people say (words: 5.5 per second; characters: 9 per
 * second, E). The caller decodes the chunk once more; if that loops too,
 * the first text is kept (it may be real: "bye bye bye bye").
 */
export function looksLikeLoop(text: string, speechMs: number, opts = { minRepeats: 4, maxWordsPerSecond: 5.5, maxCharsPerSecond: 9 }): boolean {
  const words = speechUnits(text);
  const syllabic = words.filter((w) => SYLLABIC_RE.test(w)).length;
  const limit = syllabic > words.length / 2 ? opts.maxCharsPerSecond : opts.maxWordsPerSecond;
  if (words.length >= 6 && speechMs > 0 && words.length / (speechMs / 1000) > limit) return true;
  for (let n = 1; n <= 4; n++) {
    for (let start = 0; start + n * opts.minRepeats <= words.length; start++) {
      let reps = 1;
      while (start + (reps + 1) * n <= words.length && sameRun(words, start, start + reps * n, n)) reps += 1;
      if (reps >= opts.minRepeats) return true;
    }
  }
  return false;
}

function sameRun(words: string[], a: number, b: number, n: number): boolean {
  for (let k = 0; k < n; k++) if (words[a + k] !== words[b + k]) return false;
  return true;
}
