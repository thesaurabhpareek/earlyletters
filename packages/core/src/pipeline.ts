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
import { dictionaryEdits, protectedSpans } from './protect';
import { fillerEdits, repeatEdits } from './rules';
import { applyEdits, verifyEdits } from './verify';
import { normalizeChars } from './text';

/**
 * Bump when cleaning behaviour changes. Stored on every entry so any
 * entry can be re-derived with the exact engine that produced it.
 */
export const ENGINE_VERSION = 1;

export interface CleanOptions {
  level: EditLevel;
  dictionary: DictionaryTerm[];
  /** Phrases the parent locked in review. */
  locked?: string[];
  /** Edits proposed by a model, if experiment 3 shows one is needed. */
  modelEdits?: Edit[];
  modelFlags?: Flag[];
}

export function faithfulClean(raw: string, opts: CleanOptions): CleanResult {
  const { level, dictionary, locked = [] } = opts;

  // Dictionary fixes are verified against quotes and locked phrases only;
  // the dictionary terms themselves are their targets.
  const lockedAndQuoted = protectedSpans(raw, [], locked);
  const allProtected = protectedSpans(raw, dictionary, locked);

  const dict = dictionaryEdits(raw, dictionary);
  const rules: Edit[] = level === 'clean' ? [...fillerEdits(raw), ...repeatEdits(raw)] : [];
  const model = (opts.modelEdits ?? []).map((e) => ({ ...e, source: 'model' as const }));

  const dictResult = verifyEdits(dict, { raw, level, dictionary, protectedSpans: lockedAndQuoted });
  const restResult = verifyEdits([...dictResult.accepted, ...rules, ...model], {
    raw,
    level,
    dictionary,
    // dictionary fixes already accepted must not be blocked by term spans they create
    protectedSpans: allProtected.filter((p) => !dictResult.accepted.some((d) => d.start === p.start)),
  });

  const applied = restResult.accepted;
  const rejected = [...dictResult.rejected, ...restResult.rejected];

  return {
    text: normalizeChars(applyEdits(raw, applied)).trim(),
    applied,
    rejected,
    flags: opts.modelFlags ?? [],
    modelChangeRatio: restResult.modelChangeRatio,
  };
}

/**
 * Revert one machine edit: re-derive the text from raw without it.
 * Used by the review screen's "tap an underline to undo".
 */
export function withoutEdit(raw: string, applied: Edit[], index: number): { text: string; applied: Edit[] } {
  const remaining = applied.filter((_, i) => i !== index);
  return { text: normalizeChars(applyEdits(raw, remaining)).trim(), applied: remaining };
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
export function segments(raw: string, applied: Edit[]): Segment[] {
  const sorted = applied.map((e, i) => ({ e, i })).sort((a, b) => a.e.start - b.e.start);
  const out: Segment[] = [];
  let pos = 0;
  for (const { e, i } of sorted) {
    if (e.start > pos) out.push({ text: raw.slice(pos, e.start), edit: null });
    out.push({ text: e.replacement, edit: i });
    pos = e.end;
  }
  if (pos < raw.length) out.push({ text: raw.slice(pos), edit: null });
  return out.map((s) => ({ ...s, text: normalizeChars(s.text) }));
}
