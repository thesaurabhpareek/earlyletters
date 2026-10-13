/**
 * The faithful-clean pipeline: raw transcript in, cleaned text plus a full,
 * reversible record of every machine edit out.
 *
 * Order: dictionary corrections -> fillers -> repeats -> (optional) model
 * edits -> verifier -> apply -> character normalization.
 *
 * The raw transcript is never modified. Everything here is pure and
 * deterministic for the same inputs, so results are reproducible years later.
 */
import type { CleanResult, DictionaryTerm, Edit, EditLevel, Flag } from './types';
import { fillerEdits, repeatEdits, repeatSuggestionEdits } from './rules';
import { overlaps } from './protect';
import { applyEdits, checkEdit, verifyEdits } from './verify';
import { compileRules, type LanguageRules } from './lang/engine';
import { dictionaryEditsFor, protectedSpansFor } from './lang/dictionary';
import { scriptEdits } from './lang/script';
import type { LanguageCode, ScriptCode, TextRulesPack } from './lang/types';

/**
 * Bump when cleaning behaviour changes. Stored on every entry so any
 * entry can be re-derived with the exact engine that produced it.
 */
export const ENGINE_VERSION = 5;
// 2 (2026-10-02): phrase restarts ("like a like a") and subject "you you"
//   collapse; "in in", "so so" become suggestions; "what it was was" kept.
// 3 (2026-10-03): verifier hardening (BL-064, TDD 03 7.1). Refuses edits that
//   change negation, tense, modals, contractions, numbers, quotes, sentence
//   type (? !), names or pronouns outside the dictionary, mid-sentence
//   capitals, and removals that are emphasis or a complete phrase said twice.
//   Rules-only output for every existing fixture is unchanged.
// 4 (2026-10-03): languages (ADR 0014). Words keep their combining marks
//   (Devanagari vowel signs, Arabic harakat, decomposed accents), so a
//   punctuation edit can no longer swap मैं for में, si for sí or add
//   harakat; full-width and Arabic ? ! count as mood marks; « » 「 」 『 』
//   quotes are protected. Rules come from the entry's language pack;
//   English output is unchanged (golden master over the fuzz corpus).
// 5 (2026-10-04): Unicode safety (CORE-01, PMOB-01), on top of 4. Words
//   compare in NFC, so a decomposed accent repaired to its precomposed form
//   is accepted and a dropped accent is not. Any edit boundary that cuts a
//   letter from its marks (before a vowel sign, after a virama, inside a
//   surrogate pair) is refused as splits_word. Devanagari negations (नहीं,
//   नही, मत, ना, न) are guarded. Dictionary terms no longer match the start
//   of a longer Indic word. ZWJ and ZWNJ stay inside a word. Pinned by
//   test/golden.test.ts (CORE-08).

export interface CleanOptions {
  level: EditLevel;
  dictionary: DictionaryTerm[];
  /** Phrases the parent locked in review. */
  locked?: string[];
  /**
   * Extra deterministic edits from rule providers in this package (e.g.
   * RulePunctuationProvider). Verified like every other edit.
   */
  ruleEdits?: Edit[];
  /** Edits proposed by a model, if experiment 3 shows one is needed. */
  modelEdits?: Edit[];
  modelFlags?: Flag[];
  /**
   * The entry's spoken language (ADR 0014). Default English. Every word
   * table, sentence mark and the tokenizer come from this language's rules.
   */
  language?: LanguageCode;
  /**
   * That language's text-rules pack, already checked by validatePack. Only
   * its vetted tables are used. Without a pack, a language other than
   * English runs in punctuation-safe mode: dictionary fixes, punctuation
   * and paragraphs only.
   */
  pack?: TextRulesPack | null;
  /** The author's chosen script (Chinese: 'Hans' or 'Hant'). Characters are converted only when this is set. */
  script?: ScriptCode;
  /** Already compiled rules; overrides language, pack and script. */
  rules?: LanguageRules;
}

/** The language rules for a clean call: compiled once per pack and script, then cached. */
export function rulesFor(opts: Pick<CleanOptions, 'language' | 'pack' | 'script' | 'rules'>): LanguageRules {
  if (opts.rules) return opts.rules;
  return compileRules(opts.language ?? opts.pack?.language ?? 'en', opts.pack ?? null, opts.script ? { script: opts.script } : {});
}

export function faithfulClean(raw: string, opts: CleanOptions): CleanResult {
  const { level, dictionary, locked = [] } = opts;
  const R = rulesFor(opts);

  // Dictionary fixes are verified against quotes and locked phrases only;
  // the dictionary terms themselves are their targets.
  const lockedAndQuoted = protectedSpansFor(raw, [], locked, R);
  const allProtected = protectedSpansFor(raw, dictionary, locked, R);

  const dict = dictionaryEditsFor(raw, dictionary, R);
  const rules: Edit[] = [
    ...(level === 'clean' ? [...fillerEdits(raw, R), ...repeatEdits(raw, R)] : []),
    ...scriptEdits(raw, R, allProtected),
    ...(opts.ruleEdits ?? []).map((e) => ({ ...e, source: 'rule' as const })),
  ];
  const model = (opts.modelEdits ?? []).map((e) => ({ ...e, source: 'model' as const }));

  const dictResult = verifyEdits(dict, { raw, level, dictionary, protectedSpans: lockedAndQuoted, rules: R });
  const restCtx = {
    raw,
    level,
    dictionary,
    // dictionary fixes already accepted must not be blocked by term spans they create
    protectedSpans: allProtected.filter((p) => !dictResult.accepted.some((d) => d.start === p.start)),
    rules: R,
  };
  const restResult = verifyEdits([...dictResult.accepted, ...rules, ...model], restCtx);

  const applied = restResult.accepted;
  const rejected = [...dictResult.rejected, ...restResult.rejected];

  // Offered, not applied: only ones the verifier would accept right now and
  // that do not collide with an applied edit (an accepted one drops out here).
  // Fillers that may carry meaning ("mm" for yes) are offered the same way.
  const offered = level === 'clean' ? [...repeatSuggestionEdits(raw, R), ...fillerEdits(raw, R, true)].sort((a, b) => a.start - b.start) : [];
  const suggestions = offered.filter(
    (s) => checkEdit(s, restCtx) === null && !applied.some((a) => overlaps(a, s) || a.start === s.start),
  );

  return {
    text: R.normalizeFinal(applyEdits(raw, applied)).trim(),
    applied,
    rejected,
    flags: opts.modelFlags ?? [],
    modelChangeRatio: restResult.modelChangeRatio,
    suggestions,
  };
}

/**
 * Options that apply the suggestions the parent tapped. They go in as rule
 * edits, so they are verified again with everything else; nothing bypasses
 * verifyEdits.
 */
export function acceptSuggestions(opts: CleanOptions, accepted: Edit[]): CleanOptions {
  return { ...opts, ruleEdits: [...(opts.ruleEdits ?? []), ...accepted.map((e) => ({ ...e, source: 'rule' as const }))] };
}

/**
 * Revert one machine edit: re-derive the text from raw without it.
 * Used by the review screen's "tap an underline to undo".
 */
export function withoutEdit(raw: string, applied: Edit[], index: number, rules?: LanguageRules): { text: string; applied: Edit[] } {
  const remaining = applied.filter((_, i) => i !== index);
  return { text: finalText(raw, remaining, rules), applied: remaining };
}

/** The text a parent sees for these applied edits: the review screen's display text, language-aware. */
export function finalText(raw: string, applied: Edit[], rules?: LanguageRules): string {
  return (rules ?? rulesFor({})).normalizeFinal(applyEdits(raw, applied)).trim();
}

/** A run of display text; `edit` is set when the run is a machine edit's result. */
export interface Segment {
  text: string;
  /** Index into `applied`, or null for the person's untouched words. */
  edit: number | null;
}

/**
 * Split the cleaned text into the person's own words and the machine's
 * edits, so the review screen can underline every change. Joining the
 * segments' text always equals faithfulClean(...).text (before trim).
 * A pure deletion becomes an empty-text segment placed where the words were.
 */
export function segments(raw: string, applied: Edit[], rules?: LanguageRules): Segment[] {
  const R = rules ?? rulesFor({});
  const sorted = applied.map((e, i) => ({ e, i })).sort((a, b) => a.e.start - b.e.start);
  const out: Segment[] = [];
  let pos = 0;
  for (const { e, i } of sorted) {
    if (e.start > pos) out.push({ text: raw.slice(pos, e.start), edit: null });
    out.push({ text: e.replacement, edit: i });
    pos = e.end;
  }
  if (pos < raw.length) out.push({ text: raw.slice(pos), edit: null });
  return out.map((s) => ({ ...s, text: R.normalizeFinal(s.text) }));
}
