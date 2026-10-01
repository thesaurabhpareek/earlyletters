/**
 * Scoring for the speech experiments. Pure functions, unit-tested.
 */
import { stripNonSpeech, type DictionaryTerm } from '@scribe/core';

export interface WhisperToken {
  text: string;
  p: number;
}
export interface WhisperSegment {
  text: string;
  tokens?: WhisperToken[];
}
export interface WhisperJson {
  transcription: WhisperSegment[];
}

/** Whisper's special tokens look like [_BEG_], [_TT_123], <|en|>. */
const SPECIAL = /^\s*(\[_.*_?\]|\[_[A-Z]+_\d*\]|<\|.*\|>)\s*$/;

export function transcriptText(json: WhisperJson): string {
  // Same guard the app uses, so the experiment measures what users would see.
  return stripNonSpeech(json.transcription.map((s) => s.text).join(' '));
}

/** Words Whisper was unsure of (token probability below `threshold`). */
export function lowConfidenceWords(json: WhisperJson, threshold = 0.4): string[] {
  const out: string[] = [];
  for (const seg of json.transcription) {
    for (const t of seg.tokens ?? []) {
      if (SPECIAL.test(t.text) || !/[\p{L}\p{N}]/u.test(t.text)) continue;
      if (t.p < threshold) out.push(t.text.trim());
    }
  }
  return out;
}

export function normWords(s: string): string[] {
  return (s.toLowerCase().normalize('NFKC').match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu) ?? []);
}

/** Word error rate: word-level edit distance / reference length. */
export function wer(reference: string, hypothesis: string): number {
  const r = normWords(reference);
  const h = normWords(hypothesis);
  if (r.length === 0) return h.length === 0 ? 0 : 1;
  const prev = Array.from({ length: h.length + 1 }, (_, j) => j);
  for (let i = 1; i <= r.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= h.length; j++) {
      const up = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (r[i - 1] === h[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[h.length] / r.length;
}

/**
 * Of the dictionary terms you actually said, how many appear spelled your
 * way (exact case) in the cleaned text, counting repeats.
 */
export function dictionaryAccuracy(expected: string, clean: string, dictionary: DictionaryTerm[]) {
  let hits = 0;
  let total = 0;
  for (const d of dictionary) {
    const re = new RegExp(`(?<![\\p{L}\\p{N}])${d.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'gu');
    const said = (expected.match(re) ?? []).length;
    const got = (clean.match(re) ?? []).length;
    total += said;
    hits += Math.min(said, got);
  }
  return { hits, total };
}

export function scorePhrase(expected: string, raw: string, clean: string, dictionary: DictionaryTerm[]) {
  const silent = expected.trim() === '';
  const { hits, total } = dictionaryAccuracy(expected, clean, dictionary);
  return {
    werRaw: silent ? 0 : wer(expected, raw),
    werClean: silent ? 0 : wer(expected, clean),
    dictionaryHits: hits,
    dictionaryTotal: total,
    /** For a silent clip: every word heard was invented. */
    phantomWords: silent ? normWords(raw).length : 0,
  };
}
