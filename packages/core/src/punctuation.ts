/**
 * Deterministic punctuation repair, no model.
 *
 * Two rules only:
 *  1. Sentence case: the first word of the text, and the first word after
 *     sentence-ending punctuation, gets a capital first letter.
 *  2. Terminal punctuation: if the text does not end a sentence, add a
 *     period (or turn a trailing comma, semicolon or colon into one).
 *
 * Every edit is type 'punctuation' and changes no letters (case aside), so
 * the verifier's letters-only check proves it adds nothing. It never touches
 * quoted words, locked phrases or dictionary terms: the family's spelling
 * wins, even a lowercase one like "chalo" at the start of a sentence.
 * It does not guess sentence breaks inside run-on speech; that needs a
 * model and goes through JsonModelEditProvider instead.
 */
import type { Edit, Span } from './types';
import type { EditProposal, EditProvider, EditRequest } from './edit-provider';
import { FILLERS, tokens } from './text';
import { dictionaryEdits, overlaps, protectedSpans } from './protect';

/** Sentence enders, including the Devanagari danda. */
const TERMINAL = /[.!?।॥]/;
const BREAK_BEFORE = /[.!?।॥]["')\]]*\s+$/;

export function punctuationEdits(req: EditRequest): Edit[] {
  const { raw, dictionary, locked = [] } = req;
  const toks = tokens(raw);
  if (toks.length === 0) return [];

  // Spans no punctuation edit may touch: quotes, locked phrases, dictionary
  // terms in any case (a mis-cased name is fixed by stt_fix, not here).
  const variants = dictionary.flatMap((d) => [d.term, ...d.heardAs]).filter((v) => v.trim());
  const keepOut: Span[] = [
    ...protectedSpans(raw, dictionary, locked),
    ...dictionaryEdits(raw, dictionary),
    ...variants.flatMap((v) => caseInsensitiveSpans(raw, v)),
  ];
  const blocked = (s: Span) => keepOut.some((k) => overlaps(k, s));
  const removed = req.removed ?? [];
  const gone = (s: Span) => removed.some((r) => r.start <= s.start && s.end <= r.end);

  const edits: Edit[] = [];
  const seen = new Set<number>();

  for (let i = 0; i < toks.length; i++) {
    const startsSentence = i === 0 || BREAK_BEFORE.test(raw.slice(toks[i - 1].end, toks[i].start));
    if (!startsSentence) continue;
    // Capitalise the first word that survives: skip fillers the clean rules
    // will remove ("um so we went" -> "So we went") and any word inside a
    // span other edits delete (a false start).
    let j = i;
    while (j < toks.length && (gone(toks[j]) || (req.level === 'clean' && FILLERS.has(toks[j].word.toLowerCase())))) j++;
    const t = toks[j];
    if (!t || seen.has(t.start)) continue;
    seen.add(t.start);
    const first = t.word[0];
    const upper = first.toUpperCase();
    if (upper === first) continue; // already capital, a digit, or a caseless script
    if (/\p{Lu}/u.test(t.word)) continue; // mixed case like "iPad": leave it
    const span = { start: t.start, end: t.start + first.length };
    if (blocked(span)) continue;
    edits.push({ type: 'punctuation', ...span, original: first, replacement: upper, source: 'rule' });
  }

  const terminal = terminalEdit(raw, toks[toks.length - 1].end);
  if (terminal && !blocked(terminal)) edits.push(terminal);
  return edits;
}

function terminalEdit(raw: string, lastWordEnd: number): Edit | null {
  const tail = raw.slice(lastWordEnd).trimEnd();
  if (TERMINAL.test(tail)) return null;
  const dangling = tail.match(/[,;:]+$/);
  if (dangling) {
    const start = lastWordEnd + tail.length - dangling[0].length;
    return { type: 'punctuation', start, end: lastWordEnd + tail.length, original: dangling[0], replacement: '.', source: 'rule' };
  }
  // Insert after any closing quote or bracket: she said "bau" -> she said "bau".
  const at = lastWordEnd + tail.length;
  return { type: 'punctuation', start: at, end: at, original: '', replacement: '.', source: 'rule' };
}

function caseInsensitiveSpans(text: string, term: string): Span[] {
  const re = new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'giu');
  return [...text.matchAll(re)].map((m) => ({ start: m.index!, end: m.index! + m[0].length }));
}

/** Deterministic sentence case and terminal punctuation as an EditProvider. */
export class RulePunctuationProvider implements EditProvider {
  readonly id = 'rule-punctuation';
  readonly source = 'rule' as const;

  async propose(req: EditRequest): Promise<EditProposal> {
    return { edits: punctuationEdits(req), flags: [], rejected: [], invalid: [] };
  }
}
