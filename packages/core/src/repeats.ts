/**
 * Repeat detection: which immediate repeats the engine removes by itself,
 * which it only offers to the parent, and which it never touches.
 *
 * Doubled words are not always mistakes:
 *   "I told you you were brave"     object "you", then subject "you"
 *   "What it was was magic"         pseudo-cleft
 *   "I gave her her bottle"         object, then possessive
 *   "so so happy", "bye bye", "I love you, I love you"   emphasis and affection
 * So there are three outcomes:
 *   auto      removed by the rules (still verified, still undoable)
 *   suggest   returned as an unapplied Edit; the review screen shows it and
 *             the parent taps to accept (it is then verified like any edit)
 *   keep      nothing happens
 *
 * Every Edit produced here is type 'repeat', removal only, and deletes the
 * SECOND copy plus the gap before it, so the first copy keeps its casing and
 * the verifier's "duplicates the words immediately before" check proves it.
 */
import type { Edit } from './types';
import { frozenSet, FUNCTION_WORDS, nfc, tokens, type Token } from './text';

/** Doubles of these are never grammatical side by side: always removed. */
export const REPEAT_ALWAYS: ReadonlySet<string> = frozenSet([
  'the', 'a', 'an', 'i', 'and', 'to', 'it', 'she', 'he', 'we', 'they', 'of', 'but',
]);

/**
 * Doubles that are sometimes grammatical or emphatic ("so so happy", "my my",
 * "come in in the morning"). Offered to the parent, never removed by default.
 * "had had", "that that" and "her her" are deliberately absent: they are
 * usually grammatical, so even a suggestion would be noise.
 */
export const REPEAT_SUGGEST_ONLY: ReadonlySet<string> = frozenSet([
  'you', 'so', 'is', 'in', 'on', 'at', 'for', 'with', 'from',
  'my', 'your', 'our', 'their', 'his', 'me', 'them', 'us', 'this',
]);

/** Before a doubled "you", these mark the start of a clause (subject position). */
const SUBJECT_LEAD: ReadonlySet<string> = frozenSet([
  'and', 'but', 'so', 'then', 'because', 'cause', 'when', 'while', 'if', 'now', 'today', 'tonight', 'yesterday',
  'also', 'oh', 'okay', 'ok',
]);

/**
 * Verbs that take "you" as an object and then often a clause starting with
 * "you": "I told you you were brave". Not even suggested after these.
 */
const OBJECT_VERBS: ReadonlySet<string> = frozenSet([
  'tell', 'tells', 'told', 'telling', 'promise', 'promised', 'show', 'showed', 'remind', 'reminded', 'ask', 'asked',
  'bet', 'assure', 'assured', 'warn', 'warned', 'teach', 'taught', 'wish', 'let', 'make', 'made', 'thank', 'thanked',
  'give', 'gave', 'love', 'loved', 'see', 'saw', 'hear', 'heard', 'want', 'wanted', 'help', 'helped', 'watch',
  'watched', 'know', 'knew', 'miss', 'missed', 'call', 'called', 'mean', 'meant',
]);

/** "you know", "you see", "you mean" after a doubled "you" are discourse markers. */
const DISCOURSE_AFTER_YOU: ReadonlySet<string> = frozenSet(['know', 'see', 'mean']);

/** Words that open a pseudo-cleft: "What it was was magic", "All I know is is". */
const CLEFT_OPENERS: ReadonlySet<string> = frozenSet([
  'what', 'all', 'thing', 'things', 'problem', 'point', 'truth', 'reason', 'question', 'why', 'how', 'where', 'who',
]);

/**
 * A phrase that ends with one of these cannot be complete, so an immediate
 * repeat of it is a restart: "like a like a little hiccup", "and the and the
 * dog", "I went to I went to the park". Particles that can end a phrase
 * ("come on", "pick up", "her") are deliberately absent.
 */
const DANGLING: ReadonlySet<string> = frozenSet([
  'a', 'an', 'the', 'my', 'your', 'our', 'their', 'his', 'its', 'to', 'of', 'with', 'for', 'from', 'at', 'and', 'but',
  'or', 'because', 'into', 'onto',
]);

const MAX_PHRASE = 4;
/** Between two copies: spaces and commas only. A sentence break means it was said on purpose. */
const SOFT_GAP = /^[\s,]*$/;
/** Inside a phrase: spaces only. */
const TIGHT_GAP = /^\s+$/;
const CLAUSE_BREAK = /[.!?;:,।॥]/;

export type RepeatDecision = 'auto' | 'suggest';

export interface RepeatFinding {
  edit: Edit;
  decision: RepeatDecision;
}

export function findRepeats(raw: string): RepeatFinding[] {
  const toks = tokens(raw);
  // NFC, so a precomposed and a decomposed copy of the same word are one word.
  const lw = toks.map((t) => nfc(t.word).toLowerCase());
  const out: RepeatFinding[] = [];
  const gap = (a: Token, b: Token) => raw.slice(a.end, b.start);
  const taken = (start: number, end: number) => out.some((f) => f.edit.start < end && start < f.edit.end);
  const push = (first: Token, second: Token, decision: RepeatDecision) => {
    if (taken(first.end, second.end)) return;
    out.push({
      edit: { type: 'repeat', start: first.end, end: second.end, original: raw.slice(first.end, second.end), replacement: '', source: 'rule' },
      decision,
    });
  };

  // Phrases first (longest wins), so "like a like a" is one edit, not two.
  for (let n = MAX_PHRASE; n >= 2; n--) {
    for (let i = 0; i + 2 * n <= toks.length; i++) {
      const a = lw.slice(i, i + n);
      const b = lw.slice(i + n, i + 2 * n);
      if (!a.every((w, k) => w === b[k])) continue;
      if (new Set(a).size < 2) continue; // "bye bye bye bye" is one word, said with love
      const inside = (k: number) => k % n !== n - 1; // gap k is between toks[i+k] and toks[i+k+1]
      let ok = true;
      for (let k = 0; k < 2 * n - 1 && ok; k++) {
        const g = gap(toks[i + k], toks[i + k + 1]);
        ok = inside(k) ? TIGHT_GAP.test(g) : SOFT_GAP.test(g);
      }
      if (!ok) continue;
      // The restart must lead somewhere in the same sentence.
      const next = toks[i + 2 * n];
      const continues = next !== undefined && SOFT_GAP.test(gap(toks[i + 2 * n - 1], next));
      const decision: RepeatDecision | null =
        continues && DANGLING.has(a[n - 1]) ? 'auto' : a.every((w) => FUNCTION_WORDS.has(w)) ? 'suggest' : null;
      if (decision) push(toks[i + n - 1], toks[i + 2 * n - 1], decision);
    }
  }

  for (let i = 1; i < toks.length; i++) {
    const w = lw[i];
    if (w !== lw[i - 1]) continue;
    const between = gap(toks[i - 1], toks[i]);
    if (!SOFT_GAP.test(between)) continue;
    const decision = singleDecision(raw, toks, lw, i, between);
    if (decision) push(toks[i - 1], toks[i], decision);
  }
  return out.sort((x, y) => x.edit.start - y.edit.start);
}

/** Decide for a doubled single word at toks[i-1], toks[i]. */
function singleDecision(raw: string, toks: Token[], lw: string[], i: number, between: string): RepeatDecision | null {
  const w = lw[i];
  if (REPEAT_ALWAYS.has(w)) return 'auto';

  if (w === 'was') {
    // "she was was walking" is a stumble; "what it was was magic" is grammar.
    const sentence = sentenceWordsBefore(raw, toks, lw, i - 1);
    return sentence.some((x) => CLEFT_OPENERS.has(x)) ? null : 'auto';
  }

  if (w === 'you') {
    const prev = i >= 2 ? lw[i - 2] : null;
    if (prev && OBJECT_VERBS.has(prev)) return null; // "I told you you were brave"
    const atClauseStart = i < 2 || CLAUSE_BREAK.test(raw.slice(toks[i - 2].end, toks[i - 1].start)) || SUBJECT_LEAD.has(prev!);
    const next = lw[i + 1];
    const discourse = next !== undefined && DISCOURSE_AFTER_YOU.has(next);
    // A stumble leads on to a verb in the same sentence; "You you!" alone may be pointing and laughing.
    const continues = next !== undefined && SOFT_GAP.test(raw.slice(toks[i].end, toks[i + 1].start));
    // "today you you held the spoon": both copies would be the subject.
    if (atClauseStart && continues && !discourse && /^\s+$/.test(between)) return 'auto';
    return 'suggest';
  }

  return REPEAT_SUGGEST_ONLY.has(w) ? 'suggest' : null;
}

/** Lowercased words from the start of the sentence up to (not including) toks[upto]. */
function sentenceWordsBefore(raw: string, toks: Token[], lw: string[], upto: number): string[] {
  let s = upto;
  while (s > 0 && !/[.!?।॥]/.test(raw.slice(toks[s - 1].end, toks[s].start))) s--;
  return lw.slice(s, upto);
}
