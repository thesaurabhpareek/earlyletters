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
import { nfc, type Token } from './text';
import { ENGLISH_RULES, type LanguageRules } from './lang/engine';
import { REPEAT_ALWAYS, REPEAT_SUGGEST_ONLY } from './lang/english-tables';

/*
 * The English tables (REPEAT_ALWAYS, REPEAT_SUGGEST_ONLY, SUBJECT_LEAD,
 * OBJECT_VERBS, DISCOURSE_AFTER_YOU, CLEFT_OPENERS, DANGLING) live in
 * lang/english-tables.ts and reach this file through the language rules
 * (rules.repeat), so every language uses the same decision logic with its
 * own vetted tables. A language whose repeat table is not signed off has
 * empty tables here: nothing is removed or suggested.
 */
export { REPEAT_ALWAYS, REPEAT_SUGGEST_ONLY };

export type RepeatDecision = 'auto' | 'suggest';

export interface RepeatFinding {
  edit: Edit;
  decision: RepeatDecision;
}

export function findRepeats(raw: string, rules: LanguageRules = ENGLISH_RULES): RepeatFinding[] {
  const R = rules;
  if (!R.can.removals) return [];
  const SOFT_GAP = R.softGap;
  const TIGHT_GAP = R.tightGap;
  const toks = R.tokens(raw);
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
  for (let n = R.repeat.maxPhrase; n >= 2; n--) {
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
        continues && R.repeat.dangling.has(a[n - 1]) ? 'auto' : a.every((w) => R.isFunctionWord(w)) ? 'suggest' : null;
      if (decision) push(toks[i + n - 1], toks[i + 2 * n - 1], decision);
    }
  }

  for (let i = 1; i < toks.length; i++) {
    const w = lw[i];
    if (w !== lw[i - 1]) continue;
    const between = gap(toks[i - 1], toks[i]);
    if (!SOFT_GAP.test(between)) continue;
    const decision = singleDecision(raw, toks, lw, i, between, R);
    if (decision) push(toks[i - 1], toks[i], decision);
  }
  return out.sort((x, y) => x.edit.start - y.edit.start);
}

/** Decide for a doubled single word at toks[i-1], toks[i]. */
function singleDecision(raw: string, toks: Token[], lw: string[], i: number, between: string, R: LanguageRules): RepeatDecision | null {
  const w = lw[i];
  const T = R.repeat;
  if (T.always.has(w)) return 'auto';

  if (T.cleftWords.has(w)) {
    // "she was was walking" is a stumble; "what it was was magic" is grammar.
    const sentence = sentenceWordsBefore(raw, toks, lw, i - 1, R);
    return sentence.some((x) => T.cleftOpeners.has(x)) ? null : 'auto';
  }

  if (T.subjectWords.has(w)) {
    const prev = i >= 2 ? lw[i - 2] : null;
    if (prev && T.objectVerbs.has(prev)) return null; // "I told you you were brave"
    const atClauseStart = i < 2 || R.clauseBreak.test(raw.slice(toks[i - 2].end, toks[i - 1].start)) || T.clauseLeads.has(prev!);
    const next = lw[i + 1];
    const discourse = next !== undefined && T.discourseAfter.has(next);
    // A stumble leads on to a verb in the same sentence; "You you!" alone may be pointing and laughing.
    const continues = next !== undefined && R.softGap.test(raw.slice(toks[i].end, toks[i + 1].start));
    // "today you you held the spoon": both copies would be the subject.
    if (atClauseStart && continues && !discourse && R.tightGap.test(between)) return 'auto';
    return 'suggest';
  }

  return T.suggest.has(w) ? 'suggest' : null;
}

/** Lowercased words from the start of the sentence up to (not including) toks[upto]. */
function sentenceWordsBefore(raw: string, toks: Token[], lw: string[], upto: number, R: LanguageRules): string[] {
  let s = upto;
  while (s > 0 && !R.sentenceEndRe.test(raw.slice(toks[s - 1].end, toks[s].start))) s--;
  return lw.slice(s, upto);
}
