/**
 * The verifier: code that decides which proposed edits are allowed.
 *
 * Every edit, from a rule or a model, passes through here. A model can
 * propose anything; only edits that provably remove or repair (never add
 * meaning) are applied. See PRD v2 section 16.3.
 */
import type { DictionaryTerm, Edit, EditLevel, EditType, RejectReason, RejectedEdit, Span } from './types';
import { FILLERS, FUNCTION_WORDS, lettersOnly, tokens, words } from './text';
import { isDictionaryTerm, overlaps } from './protect';

/** Starting values. Tune on real recordings (PRD v2 section 24, experiment 2). */
export const CEILING_RATIO = 0.15;
export const CEILING_MIN_WORDS = 3;
export const FALSE_START_LOOKAHEAD = 8;

const LEVEL_TYPES: Record<EditLevel, ReadonlySet<EditType>> = {
  clean: new Set(['filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement', 'paragraph']),
  verbatim: new Set(['stt_fix', 'punctuation']),
};

/** Same-meaning grammatical variants that do not share a prefix. */
const IRREGULAR_PAIRS: ReadonlyArray<ReadonlySet<string>> = [
  new Set(['is', 'are', 'was', 'were', 'am', 'be', 'been']),
  new Set(['has', 'have', 'had']),
  new Set(['do', 'does', 'did', 'done']),
  new Set(['go', 'goes', 'went', 'gone']),
  new Set(['a', 'an']),
];

function sameStem(a: string, b: string): boolean {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x === y) return true;
  if (IRREGULAR_PAIRS.some((s) => s.has(x) && s.has(y))) return true;
  let i = 0;
  while (i < x.length && i < y.length && x[i] === y[i]) i++;
  return i >= 3 && i >= Math.min(x.length, y.length) - 1;
}

function sentenceIndex(raw: string, pos: number): number {
  return (raw.slice(0, pos).match(/[.!?](\s|$)/g) ?? []).length;
}

export interface VerifyContext {
  raw: string;
  level: EditLevel;
  dictionary: DictionaryTerm[];
  protectedSpans: Span[];
}

/** Check one edit in isolation. Returns null if it is acceptable. */
export function checkEdit(e: Edit, ctx: VerifyContext): RejectReason | null {
  const { raw } = ctx;
  if (e.start < 0 || e.end > raw.length || e.start > e.end) return 'out_of_bounds';
  if (raw.slice(e.start, e.end) !== e.original) return 'original_mismatch';
  if (!LEVEL_TYPES[ctx.level].has(e.type)) return 'type_not_allowed_at_level';

  // Dictionary corrections from our own rules are allowed to land on a
  // mis-cased name; everything else must stay clear of protected spans.
  if (ctx.protectedSpans.some((p) => overlaps(p, e))) return 'overlaps_protected';

  switch (e.type) {
    case 'filler': {
      if (e.replacement.trim() !== '' && !/^[\s,.]*$/.test(e.replacement)) return 'removal_only';
      // Only words on the filler list may be removed under this label.
      const removed = words(e.original);
      if (removed.length === 0 || !removed.every((w) => FILLERS.has(w))) return 'not_a_filler';
      break;
    }

    case 'repeat': {
      if (e.replacement.trim() !== '' && !/^[\s,.]*$/.test(e.replacement)) return 'removal_only';
      // The removed words must duplicate the words immediately before or after.
      const removed = words(e.original);
      const before = words(raw.slice(0, e.start)).slice(-removed.length);
      const after = words(raw.slice(e.end)).slice(0, removed.length);
      const same = (a: string[]) => a.length === removed.length && a.every((w, i) => w === removed[i]);
      if (removed.length === 0 || !(same(before) || same(after))) return 'not_a_repeat';
      break;
    }

    case 'false_start': {
      if (e.replacement.trim() !== '' && !/^[\s,.]*$/.test(e.replacement)) return 'removal_only';
      // Every word removed must reappear right after: "she was, she was so".
      const removed = words(e.original);
      const ahead = words(raw.slice(e.end)).slice(0, removed.length + FALSE_START_LOOKAHEAD);
      if (removed.length === 0 || !removed.every((w) => ahead.includes(w))) return 'false_start_not_repeated';
      break;
    }

    case 'stt_fix': {
      const rep = e.replacement.trim();
      const isTerm = ctx.dictionary.some((d) => d.term === rep);
      if (!isTerm) return 'stt_fix_not_dictionary';
      break;
    }

    case 'punctuation':
      if (lettersOnly(e.original) !== lettersOnly(e.replacement)) return 'punctuation_changed_letters';
      break;

    case 'agreement': {
      const o = tokens(e.original);
      const r = tokens(e.replacement);
      if (o.length !== 1 || r.length !== 1) return 'agreement_not_single_word';
      if (!sameStem(o[0].word, r[0].word)) return 'agreement_stem_mismatch';
      break;
    }

    case 'paragraph':
      if (e.original.trim() !== '' || e.replacement.trim() !== '') return 'paragraph_not_whitespace';
      break;
  }

  // Belt and braces: no edit may introduce a content word that was not
  // already in the span it replaces (agreement is governed by its stem rule).
  if (e.type !== 'agreement' && e.type !== 'stt_fix') {
    const before = new Set(words(e.original));
    for (const w of words(e.replacement)) {
      if (before.has(w)) continue;
      if (FUNCTION_WORDS.has(w) || isDictionaryTerm(w, ctx.dictionary)) continue;
      return 'inserted_content_word';
    }
  }
  return null;
}

export interface VerifyResult {
  accepted: Edit[];
  rejected: RejectedEdit[];
  modelChangeRatio: number;
}

/**
 * Verify a list of edits. Rule edits should be passed first: on overlap,
 * the earlier accepted edit wins.
 */
export function verifyEdits(edits: Edit[], ctx: VerifyContext): VerifyResult {
  const accepted: Edit[] = [];
  const rejected: RejectedEdit[] = [];
  const agreementPerSentence = new Map<number, number>();

  for (const e of edits) {
    const reason = checkEdit(e, ctx);
    if (reason) {
      rejected.push({ edit: e, reason });
      continue;
    }
    if (accepted.some((a) => overlaps(a, e) || (a.start === e.start && a.end === e.end))) {
      rejected.push({ edit: e, reason: 'overlaps_other_edit' });
      continue;
    }
    if (e.type === 'agreement') {
      const s = sentenceIndex(ctx.raw, e.start);
      const n = agreementPerSentence.get(s) ?? 0;
      if (n >= 1) {
        rejected.push({ edit: e, reason: 'agreement_limit_per_sentence' });
        continue;
      }
      agreementPerSentence.set(s, n + 1);
    }
    accepted.push(e);
  }

  // Change ceiling, applied to model edits as a whole: if the model touched
  // too much, discard all of its edits and keep only the deterministic ones.
  const totalWords = Math.max(1, words(ctx.raw).length);
  const modelWords = accepted
    .filter((e) => e.source === 'model')
    .reduce((n, e) => n + Math.max(words(e.original).length, words(e.replacement).length, 1), 0);
  const allowed = Math.max(Math.ceil(CEILING_RATIO * totalWords), CEILING_MIN_WORDS);
  if (modelWords > allowed) {
    const keep = accepted.filter((e) => e.source !== 'model');
    for (const e of accepted) if (e.source === 'model') rejected.push({ edit: e, reason: 'change_ceiling_exceeded' });
    return { accepted: keep.sort(byStart), rejected, modelChangeRatio: 0 };
  }

  return { accepted: accepted.sort(byStart), rejected, modelChangeRatio: modelWords / totalWords };
}

function byStart(a: Edit, b: Edit): number {
  return a.start - b.start;
}

/** Apply already-verified, non-overlapping edits to the raw text. */
export function applyEdits(raw: string, edits: Edit[]): string {
  let out = raw;
  for (const e of [...edits].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
  }
  return out;
}
