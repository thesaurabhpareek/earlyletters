/**
 * Shared helpers for the per-language R-01 regression suite (F06-REQ-019,
 * WP-F06-04). One file per launch language; each proves, for the R-01
 * defects that apply to its script, that the engine refuses the meaning
 * change, plus one legitimate edit it still accepts as a control.
 *
 * The constitution: the machine may remove and repair. It may never add
 * meaning. Fixtures use the fictional family "Asha" only.
 *
 * "shipped" is the pack as it ships (word tables draft, ADR 0014 section 3);
 * "vetted" is a copy whose word tables are raised to native-reviewed, which
 * is what a pack looks like once a native speaker signs it off (R-08).
 * Each non-English file needs that sign-off before its pack is published
 * (F06-REQ-019); the sign-off is recorded by a human, not by these tests.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  compileRules,
  faithfulClean,
  verifyEdits,
  type CleanResult,
  type DictionaryTerm,
  type Edit,
  type EditLevel,
  type LanguageCode,
  type LanguageRules,
  type RejectReason,
  type ScriptCode,
  type TextRulesPack,
} from '../../src';

const DIR = join(__dirname, '../../../../packs/text-rules');

export const loadPack = (l: LanguageCode): TextRulesPack => JSON.parse(readFileSync(join(DIR, `${l}.json`), 'utf8')) as TextRulesPack;

/** The pack once a native speaker signs its word tables off. */
export function vettedPack(l: LanguageCode, patch: (p: TextRulesPack) => void = () => {}): TextRulesPack {
  const p = loadPack(l);
  for (const k of ['fillers', 'meaning', 'repeats', 'phonetic'] as const) p[k].review = { status: 'native-reviewed', by: 'test' };
  patch(p);
  return p;
}

export type PackMode = 'shipped' | 'vetted';
export const PACK_MODES: PackMode[] = ['shipped', 'vetted'];

export function packFor(l: LanguageCode, mode: PackMode): TextRulesPack {
  return mode === 'vetted' ? vettedPack(l) : loadPack(l);
}

export function rules(l: LanguageCode, pack: TextRulesPack | null, script?: ScriptCode): LanguageRules {
  return compileRules(l, pack, script ? { script } : {});
}

/** The `nth` (0-based) occurrence of `original` in `raw`, as a proposed edit. */
export function edit(raw: string, type: Edit['type'], original: string, replacement: string, nth = 0, source: Edit['source'] = 'model'): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  if (start < 0) throw new Error(`not found: ${original}`);
  return { type, start, end: start + original.length, original, replacement, source };
}

/** An insertion of `text` right after the `nth` occurrence of `after`. */
export function insertAfter(raw: string, type: Edit['type'], after: string, text: string, nth = 0): Edit {
  const e = edit(raw, type, after, after, nth);
  return { ...e, start: e.end, original: '', replacement: text };
}

/** null when the verifier accepts the edit, else its reason. */
export function verdict(raw: string, e: Edit, R: LanguageRules, dictionary: DictionaryTerm[] = [], level: EditLevel = 'clean'): RejectReason | null {
  const r = verifyEdits([e], { raw, level, dictionary, protectedSpans: [], rules: R });
  return r.accepted.length ? null : r.rejected[0].reason;
}

/** The app path: faithfulClean in the letter's language with its pack (apps/mobile cleanSpoken). */
export function clean(
  raw: string,
  language: LanguageCode,
  pack: TextRulesPack | null,
  opts: { level?: EditLevel; dictionary?: DictionaryTerm[]; script?: ScriptCode; modelEdits?: Edit[] } = {},
): CleanResult {
  return faithfulClean(raw, {
    level: opts.level ?? 'clean',
    dictionary: opts.dictionary ?? [],
    language,
    pack,
    script: opts.script,
    modelEdits: opts.modelEdits,
  });
}

/** Direction marks, joiners and other invisible characters a hostile edit might add (R-01 D4). */
export const INVISIBLES = ['\u200E', '\u200F', '\u202E', '\u200B', '\u200C', '\u200D', '\u2066', '\u061C', '\uFEFF'] as const;

/** Two dictionary entries where one's heard-as is the other's name (R-01 D13). */
export function twoNames(child: string, other: string): DictionaryTerm[] {
  return [
    { term: child, kind: 'child', heardAs: [other] },
    { term: other, kind: 'family', heardAs: [] },
  ];
}
