/**
 * Scoring for the speech experiments and the per-language gate. Pure
 * functions, unit-tested (score.test.ts).
 *
 * Units (R5 4.4 E8, fixed 15 Oct 2026): a word keeps its combining marks, so
 * Devanagari vowel signs and Arabic harakat stay inside the word instead of
 * splitting it (मेरी प्यारी बेटी is three words, not seven letters).
 * Mandarin is scored by character (CER): it has no spaces between words.
 * Arabic is compared without harakat and tatweel, the usual practice for
 * Arabic word error: Whisper writes undiacritised text, so a reference with
 * short vowels would count every vowelled word wrong. The gate still checks
 * separately that the engine never adds or removes a haraka.
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
export const SPECIAL_TOKEN = /^\s*(\[_.*_?\]|\[_[A-Z]+_\d*\]|<\|.*\|>)\s*$/;

export function transcriptText(json: WhisperJson): string {
  // Same guard the app uses, so the experiment measures what users would see.
  return stripNonSpeech(json.transcription.map((s) => s.text).join(' '));
}

/** Words Whisper was unsure of (token probability below `threshold`). */
export function lowConfidenceWords(json: WhisperJson, threshold = 0.4): string[] {
  const out: string[] = [];
  for (const seg of json.transcription) {
    for (const t of seg.tokens ?? []) {
      if (SPECIAL_TOKEN.test(t.text) || !/[\p{L}\p{N}]/u.test(t.text)) continue;
      if (t.p < threshold) out.push(t.text.trim());
    }
  }
  return out;
}

/** A word: starts with a letter or digit, keeps its marks, may hold an apostrophe ("don't", "aujourd'hui"). */
const WORD = /[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:['\u2019][\p{L}\p{M}\p{N}]+)*/gu;
/** Arabic short vowels, shadda, sukun, superscript alef and tatweel: folded away for scoring only. */
const ARABIC_FOLD = /[ً-ٰٟـ]/g;

export type ScoreLanguage = 'en' | 'hi' | 'es' | 'zh' | 'fr' | 'ar' | 'pt' | (string & {});
export type Metric = 'wer' | 'cer';

/** Mandarin by character; every other launch language by word (F05 7.1). */
export function metricFor(language: ScoreLanguage): Metric {
  return language === 'zh' ? 'cer' : 'wer';
}

function fold(s: string, language?: ScoreLanguage): string {
  let t = s.normalize('NFKC').toLowerCase();
  if (language === 'ar') t = t.replace(ARABIC_FOLD, '');
  return t;
}

export function normWords(s: string, language?: ScoreLanguage): string[] {
  return fold(s, language).match(WORD) ?? [];
}

/** Characters that carry meaning: letters with their marks, and digits. Spaces and punctuation are not scored. */
export function normChars(s: string, language?: ScoreLanguage): string[] {
  const out: string[] = [];
  for (const w of normWords(s, language)) {
    // A base character and the marks that follow it are one unit (a Devanagari syllable piece, an accented letter).
    for (const m of w.matchAll(/[\p{L}\p{N}]\p{M}*|\p{M}+|['\u2019]/gu)) if (m[0] !== "'" && m[0] !== '\u2019') out.push(m[0]);
  }
  return out;
}

/** The units a language is scored in. */
export function units(s: string, language: ScoreLanguage): string[] {
  return metricFor(language) === 'cer' ? normChars(s, language) : normWords(s, language);
}

export type AlignOp = { op: 'match' | 'sub'; ref: string; hyp: string } | { op: 'del'; ref: string } | { op: 'ins'; hyp: string };

/** Minimum edit alignment of two unit lists (Levenshtein, deterministic tie order: match/sub, then del, then ins). */
export function align(ref: readonly string[], hyp: readonly string[]): AlignOp[] {
  const n = ref.length;
  const m = hyp.length;
  const d: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = Math.min(d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1), d[i - 1][j] + 1, d[i][j - 1] + 1);
    }
  }
  const ops: AlignOp[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (ref[i - 1] === hyp[j - 1] ? 0 : 1)) {
      ops.push({ op: ref[i - 1] === hyp[j - 1] ? 'match' : 'sub', ref: ref[i - 1], hyp: hyp[j - 1] });
      i -= 1;
      j -= 1;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      ops.push({ op: 'del', ref: ref[i - 1] });
      i -= 1;
    } else {
      ops.push({ op: 'ins', hyp: hyp[j - 1] });
      j -= 1;
    }
  }
  return ops.reverse();
}

/** Edit distance and reference length in the language's units: sum these over clips for a corpus rate. */
export function errorCounts(reference: string, hypothesis: string, language: ScoreLanguage): { errors: number; refUnits: number; hypUnits: number } {
  const r = units(reference, language);
  const h = units(hypothesis, language);
  const errors = align(r, h).filter((o) => o.op !== 'match').length;
  return { errors, refUnits: r.length, hypUnits: h.length };
}

function rateOf(errors: number, refUnits: number, hypUnits: number): number {
  if (refUnits === 0) return hypUnits === 0 ? 0 : 1;
  return errors / refUnits;
}

/** Word error rate of one utterance (edit distance / reference words). Mandarin has no words to count: use `cer`. */
export function wer(reference: string, hypothesis: string, language?: ScoreLanguage): number {
  if (language === 'zh') throw new Error('wer_not_for_zh: Mandarin is scored by character (cer)');
  const r = normWords(reference, language);
  const h = normWords(hypothesis, language);
  return rateOf(align(r, h).filter((o) => o.op !== 'match').length, r.length, h.length);
}

/** Character error rate of one utterance (Mandarin's primary metric). */
export function cer(reference: string, hypothesis: string, language: ScoreLanguage = 'zh'): number {
  const r = normChars(reference, language);
  const h = normChars(hypothesis, language);
  return rateOf(align(r, h).filter((o) => o.op !== 'match').length, r.length, h.length);
}

/**
 * Of the dictionary terms you actually said, how many appear spelled your
 * way (exact case) in the cleaned text, counting repeats.
 */
export function dictionaryAccuracy(expected: string, clean: string, dictionary: DictionaryTerm[]) {
  let hits = 0;
  let total = 0;
  for (const d of dictionary) {
    const re = new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${d.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{M}\\p{N}])`, 'gu');
    const said = (expected.match(re) ?? []).length;
    const got = (clean.match(re) ?? []).length;
    total += said;
    hits += Math.min(said, got);
  }
  return { hits, total };
}

export function scorePhrase(expected: string, raw: string, clean: string, dictionary: DictionaryTerm[], language: ScoreLanguage = 'en') {
  const silent = expected.trim() === '';
  const { hits, total } = dictionaryAccuracy(expected, clean, dictionary);
  const rate = (hyp: string) => {
    const c = errorCounts(expected, hyp, language);
    return rateOf(c.errors, c.refUnits, c.hypUnits);
  };
  return {
    werRaw: silent ? 0 : rate(raw),
    werClean: silent ? 0 : rate(clean),
    dictionaryHits: hits,
    dictionaryTotal: total,
    /** For a silent clip: every word (Mandarin: character) heard was invented. */
    phantomWords: silent ? units(raw, language).length : 0,
  };
}
