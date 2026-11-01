/**
 * Script conversion and Unicode normalisation (ADR 0014).
 *
 * normalizeScript is NOT a new edit type. A character converted to the
 * author's chosen script is a `punctuation` edit: punctuation already means
 * "the same letters, written differently" (case is the precedent: a -> A is
 * a different code point, the same letter). 發 and 发 are one character in
 * two orthographic standards; Unicode's Unihan data records them as
 * variants of each other. The verifier proves it the same way it proves a
 * case change: letter for letter, every changed character must be the
 * pack's mapping toward the author's script, and the words around it must
 * be the same words in that script. Keeping the closed EditType set means
 * no change to stored edits, the review screen's edit labels or the
 * analytics catalogue; `describeEdit` tells the review screen when a
 * punctuation edit is really a script conversion so it can say so.
 *
 * NFC is not an edit either: canonically equivalent text is the same text.
 * It belongs at the transcription boundary (toNFC before raw is stored);
 * the engine then compares in NFC and never changes the form of the output.
 */
import type { Edit, Span } from '../types';
import { overlaps } from '../protect';
import type { LanguageRules } from './engine';

/** NFC, for recogniser output before it becomes the immutable raw transcript. */
export function toNFC(text: string): string {
  return text.normalize('NFC');
}

/** True when the text is already NFC. */
export function isNFC(text: string): boolean {
  return text === text.normalize('NFC');
}

/**
 * Edits that write each character in the author's chosen script, grouped
 * per run of changed characters. Rule edits, verified like any other.
 * Characters inside protected spans (quotes, locked phrases, dictionary
 * terms) are left exactly as they are.
 */
export function scriptEdits(raw: string, rules: LanguageRules, keepOut: Span[] = []): Edit[] {
  if (!rules.can.scriptVariants) return [];
  const edits: Edit[] = [];
  let runStart = -1;
  let original = '';
  let replacement = '';
  const flush = (end: number) => {
    if (runStart < 0) return;
    const span = { start: runStart, end };
    if (!keepOut.some((k) => overlaps(k, span))) edits.push({ type: 'punctuation', ...span, original, replacement, source: 'rule' });
    runStart = -1;
    original = '';
    replacement = '';
  };
  for (let i = 0; i < raw.length; ) {
    const ch = String.fromCodePoint(raw.codePointAt(i)!);
    const to = rules.variantOf(ch);
    if (to !== undefined) {
      if (runStart < 0) runStart = i;
      original += ch;
      replacement += to;
    } else {
      flush(i);
    }
    i += ch.length;
  }
  flush(raw.length);
  return edits;
}

export type EditKind = Edit['type'] | 'script';

/**
 * What an applied edit did, for the review screen's label: a punctuation
 * edit whose letters changed is a script conversion. Everything else is its
 * own type.
 */
export function describeEdit(e: Edit, rules: LanguageRules): EditKind {
  if (e.type !== 'punctuation') return e.type;
  return rules.sameLettersAcrossScripts(e.original, e.replacement) &&
    [...e.original].some((ch, i) => rules.variantOf(ch) !== undefined && [...e.replacement][i] === rules.variantOf(ch))
    ? 'script'
    : 'punctuation';
}
