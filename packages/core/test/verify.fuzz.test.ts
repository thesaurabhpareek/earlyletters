/**
 * Property test for the verifier (BL-064, TDD 03 section 7.2).
 *
 * A seeded generator plays a hostile model: it proposes random edit lists
 * (word swaps, tense and modal moves, negations, contractions, name swaps,
 * mood marks, quotes, case flips, random deletions under every label, plus
 * some honest repairs) over a corpus of sentences about the fictional
 * family "Asha". Whatever the verifier lets through, the resulting text must:
 *   1. contain no word that was not said, in no new order: the final words
 *      are a subsequence of the raw words, where a word may only change to
 *      its number/person agreement form or to a dictionary term;
 *   2. keep every negation, number, kinship word, "?" and "!" that was said
 *      once (a doubled one may legitimately lose its stumble copy).
 *
 * No dependency: a small PRNG (mulberry32) with a fixed seed in CI. The
 * nightly job sets SCRIBE_FUZZ_SEED to a random value; a failure prints the
 * seed and the case so it can be replayed exactly.
 */
import { describe, expect, it } from 'vitest';
import {
  applyEdits,
  checkEdit,
  faithfulClean,
  KINSHIP,
  numbersOf,
  protectedSpans,
  tokens,
  verifyEdits,
  type DictionaryTerm,
  type Edit,
  type EditType,
} from '../src';

const SEED = Number(process.env.SCRIBE_FUZZ_SEED ?? 20261003);
const RUNS = Number(process.env.SCRIBE_FUZZ_RUNS ?? 10000);

// Fictional family only.
const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia', 'Usha'] },
  { term: 'Ashu', kind: 'nickname', heardAs: ['ah shoe'] },
  { term: 'Mumma', kind: 'family', heardAs: ['mama'] },
  { term: 'chalo', kind: 'word', heardAs: ['shallow'] },
];

const CORPUS = [
  'Asha can walk now and she is so proud of it.',
  'I am not sad today, I am not.',
  "She doesn't like the bath but she loves the duck.",
  'Um, she was, she was so happy when Daddy came home.',
  'You did it! You crawled all the way to Mumma.',
  'Did you see the moon tonight? She pointed at it twice.',
  'We were tired, we were really tired, but we went to the park.',
  'She has two teeth and a third one is coming.',
  'Nani sang to her and she never cried once.',
  'I will always remember the way you laughed at the the dog.',
  'Asia said "bau" to the cat and then she laughed.',
  'Its tail was wagging and it\'s the first time she saw it.',
  'She could not sleep, uh, so we walked for an hour.',
  'Today you you held the spoon by yourself.',
  'Papa read the book three times and she wanted more.',
  'she walked today it was amazing',
  'No, she would not let go of my finger.',
  'We may go to the sea in March with Ashu.',
  'She ate 1,000 peas, or it felt like it.',
  'I love you, I love you so much.',
  'it was like a like a little hiccup and then she slept',
  'Her cousin Isha came and they played until 3:30.',
  'chalo, time for bath, she is not wanting to go na.',
  'Hmm. She have a cold but she is still smiling.',
  'Dada says she walks like him.',
];

/* ---------- PRNG ---------- */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- the invariant's own definitions (independent of src/meaning.ts) ---------- */

const lw = (s: string) => s.toLowerCase().replace(/’/g, "'");
const wordsOf = (s: string) => tokens(s).map((t) => lw(t.word));

const AGREE: string[][] = [
  ['is', 'are', 'am'], ['was', 'were'], ['has', 'have'], ['do', 'does'], ['go', 'goes'],
  ["isn't", "aren't"], ["wasn't", "weren't"], ["hasn't", "haven't"], ["doesn't", "don't"], ['a', 'an'],
];
function agrees(a: string, b: string): boolean {
  if (AGREE.some((g) => g.includes(a) && g.includes(b))) return true;
  const [s, l] = a.length <= b.length ? [a, b] : [b, a];
  return s.length >= 3 && (l === `${s}s` || l === `${s}es` || (s.endsWith('y') && l === `${s.slice(0, -1)}ies`));
}

const TERMS = new Set(DICT.map((d) => lw(d.term)));

const NOT_A_NAME = new Set([
  'i', 'me', 'my', 'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its', 'we', 'us', 'our', 'they', 'them', 'their',
  'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'on', 'at', 'is', 'was', 'can', 'will',
  'one', 'two', 'three', 'twice', 'once', 'first', 'third',
]);
/** A raw word a dictionary term may stand in for: not a pronoun, function word, negation, number or kinship word. */
function mayBecomeName(w: string): boolean {
  if (HEARD.has(w) || TERMS.has(w)) return true;
  return !NOT_A_NAME.has(w) && !NEG(w) && !KINSHIP.has(w) && !/\d/.test(w);
}

/** Final words are raw words in order, each kept, agreed, or a dictionary term covering 1 to 3 raw words. */
function isFaithful(raw: string[], fin: string[]): boolean {
  const memo = new Map<number, boolean>();
  const go = (i: number, j: number): boolean => {
    if (j === fin.length) return true;
    if (i === raw.length) return false;
    const key = i * 1000 + j;
    if (memo.has(key)) return memo.get(key)!;
    let ok = go(i + 1, j); // a removed raw word
    if (!ok && (raw[i] === fin[j] || agrees(raw[i], fin[j]))) ok = go(i + 1, j + 1);
    if (!ok && TERMS.has(fin[j])) {
      for (let k = 1; k <= 3 && !ok && i + k <= raw.length && mayBecomeName(raw[i + k - 1]); k++) ok = go(i + k, j + 1);
    }
    memo.set(key, ok);
    return ok;
  };
  return go(0, 0);
}

const NEG = (w: string) => ['not', 'no', 'never', 'cannot', 'nobody', 'nothing', 'none'].includes(w) || w.endsWith("n't");
const HEARD = new Set(DICT.flatMap((d) => d.heardAs.map(lw)));

function onceOnly(items: string[]): boolean {
  return new Set(items).size === items.length;
}

function checkInvariants(raw: string, text: string): string | null {
  const rw = wordsOf(raw);
  const fw = wordsOf(text);
  if (!isFaithful(rw, fw)) return 'added_or_swapped_word';
  const rn = rw.filter(NEG);
  if (onceOnly(rn) && fw.filter(NEG).length !== rn.length) return 'negation_changed';
  const rnum = numbersOf(raw);
  if (onceOnly(rnum) && numbersOf(text).join('|') !== rnum.join('|')) return 'number_changed';
  const kin = (ws: string[]) => ws.filter((w) => KINSHIP.has(w) && !HEARD.has(w));
  if (onceOnly(kin(rw)) && kin(fw).join('|') !== kin(rw).join('|')) return 'kinship_changed';
  for (const mark of ['?', '!']) if (text.split(mark).length !== raw.split(mark).length) return `mood_${mark}_changed`;
  return null;
}

/* ---------- the hostile model ---------- */

const MODEL_TYPES: EditType[] = ['filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement'];
const POOL = [
  'not', "n't", 'never', 'no', 'cannot', 'was', 'were', 'is', 'had', 'did', 'could', 'would', 'might', 'should',
  'loved', 'walked', 'she', 'he', 'they', 'her', 'him', 'Asha', 'Ashu', 'Mumma', 'Daddy', 'Nani', 'two', 'three',
  'very', 'happy', 'sad', 'the', 'a', 'and', "we're", "it's", "she'll", 'Will', 'May',
];
const TENSE: Record<string, string> = {
  is: 'was', are: 'were', was: 'is', has: 'had', have: 'had', does: 'did', do: 'did', can: 'could', will: 'would',
  may: 'might', walk: 'walked', walks: 'walked', loves: 'loved', laughed: 'laughs', went: 'goes', says: 'said',
};

function fuzzEdits(raw: string, rnd: () => number): Edit[] {
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)];
  const toks = tokens(raw);
  const edits: Edit[] = [];
  const n = 1 + Math.floor(rnd() * 6);
  const mk = (type: EditType, start: number, end: number, replacement: string): Edit => ({
    type, start, end, original: raw.slice(start, end), replacement, source: 'model',
  });
  for (let k = 0; k < n && toks.length; k++) {
    const t = pick(toks);
    const i = toks.indexOf(t);
    const span = Math.min(toks.length - i, 1 + Math.floor(rnd() * 3));
    const last = toks[i + span - 1];
    const type = pick(MODEL_TYPES);
    switch (Math.floor(rnd() * 12)) {
      case 0: // replace a word or phrase with pool words
        edits.push(mk(type, t.start, last.end, Array.from({ length: 1 + Math.floor(rnd() * 2) }, () => pick(POOL)).join(' ')));
        break;
      case 1: // tense, modal or negation move on one word
        edits.push(mk(type, t.start, t.end, TENSE[lw(t.word)] ?? (rnd() < 0.5 ? `${t.word}n't` : `not ${t.word}`)));
        break;
      case 2: // contraction or apostrophe inside a word, at a random letter
        {
          const at = t.start + 1 + Math.floor(rnd() * Math.max(1, t.word.length - 1));
          edits.push(mk(pick(['punctuation', type] as EditType[]), at, at, "'"));
        }
        break;
      case 3: // join or split words
        if (i + 1 < toks.length) edits.push(mk('punctuation', t.end, toks[i + 1].start, ''));
        else edits.push(mk('punctuation', t.start + 1, t.start + 1, ' '));
        break;
      case 4: // sentence type: add or swap ? and !
        {
          const m = /[.!?]/.exec(raw.slice(t.end));
          if (m) edits.push(mk('punctuation', t.end + m.index, t.end + m.index + 1, pick(['?', '!', '.', '?!'])));
          else edits.push(mk('punctuation', t.end, t.end, pick(['?', '!'])));
        }
        break;
      case 5: // quotes
        edits.push(mk('punctuation', t.start, last.end, `"${raw.slice(t.start, last.end)}"`));
        break;
      case 6: // case flip of a random letter
        {
          const at = t.start + Math.floor(rnd() * t.word.length);
          const ch = raw[at];
          edits.push(mk('punctuation', at, at + 1, ch === ch.toUpperCase() ? ch.toLowerCase() : ch.toUpperCase()));
        }
        break;
      case 7: // delete a word or phrase under a removal label
        edits.push(mk(pick(['filler', 'repeat', 'false_start'] as EditType[]), t.start, last.end, ''));
        break;
      case 8: // delete with the following gap, the shape real removals take
        edits.push(mk(pick(['filler', 'repeat', 'false_start'] as EditType[]), t.start, toks[i + span]?.start ?? last.end, ''));
        break;
      case 9: // name or pronoun to a dictionary term
        edits.push(mk('stt_fix', t.start, last.end, pick(DICT).term));
        break;
      case 10: // arbitrary character span, arbitrary replacement
        {
          const a = Math.floor(rnd() * raw.length);
          const b = Math.min(raw.length, a + Math.floor(rnd() * 8));
          edits.push(mk(type, a, b, pick(['', ' ', '.', ',', pick(POOL), raw.slice(b, b + 3)])));
        }
        break;
      default: // an honest repair, so the verifier has something to accept
        if (rnd() < 0.5) edits.push(mk('punctuation', raw.trimEnd().length, raw.trimEnd().length, '.'));
        else if (/^[a-z]/.test(raw)) edits.push(mk('punctuation', 0, 1, raw[0].toUpperCase()));
        else {
          const w = lw(t.word);
          const pair = ({ have: 'has', has: 'have', walk: 'walks', is: 'are', were: 'was' } as Record<string, string>)[w];
          if (pair) edits.push(mk('agreement', t.start, t.end, pair));
        }
    }
  }
  return edits;
}

describe('verifier property: random model edits never add or swap meaning', () => {
  it(`holds for ${RUNS} generated edit lists (seed ${SEED})`, () => {
    const rnd = mulberry32(SEED);
    let proposed = 0;
    let accepted = 0;
    for (let run = 0; run < RUNS; run++) {
      const raw = CORPUS[Math.floor(rnd() * CORPUS.length)];
      const edits = fuzzEdits(raw, rnd);
      proposed += edits.length;
      const ctx = { raw, level: 'clean' as const, dictionary: DICT, protectedSpans: protectedSpans(raw, DICT) };

      const v = verifyEdits(edits, ctx);
      accepted += v.accepted.length;
      for (const e of v.accepted) expect(checkEdit(e, ctx), `seed ${SEED} run ${run}`).toBeNull();
      const text = applyEdits(raw, v.accepted);
      const broke = checkInvariants(raw, text);
      if (broke) {
        throw new Error(`seed ${SEED} run ${run}: ${broke}\nraw:  ${raw}\ntext: ${text}\nedits: ${JSON.stringify(v.accepted)}`);
      }

      // The same edits through the full pipeline, with the deterministic rules.
      const clean = faithfulClean(raw, { level: 'clean', dictionary: DICT, modelEdits: edits });
      const broke2 = checkInvariants(raw, clean.text);
      if (broke2) {
        throw new Error(`seed ${SEED} run ${run} (pipeline): ${broke2}\nraw:  ${raw}\ntext: ${clean.text}\nedits: ${JSON.stringify(clean.applied)}`);
      }
    }
    // Not vacuous: the generator proposes plenty, and honest repairs get through.
    expect(proposed).toBeGreaterThan(RUNS * 2);
    expect(accepted).toBeGreaterThan(RUNS / 10);
  });

  it('the invariant itself catches the TDD 03 7.1 attacks (checker sanity)', () => {
    expect(checkInvariants('I can come.', 'I cannot come.')).toBe('added_or_swapped_word');
    expect(checkInvariants('She is happy.', 'She was happy.')).toBe('added_or_swapped_word');
    expect(checkInvariants('I love Daddy.', 'I love Asha.')).toBe('added_or_swapped_word');
    expect(checkInvariants('I love Daddy and Isha.', 'I love Daddy and Asha.')).toBeNull(); // a near-sounding name: see soundsLike
    expect(checkInvariants('We were tired.', "We we're tired.")).toBe('added_or_swapped_word');
    expect(checkInvariants('You did it.', 'You did it?')).toBe('mood_?_changed');
    expect(checkInvariants('I am not sad today.', 'I am sad today.')).toBe('negation_changed');
    expect(checkInvariants('She has two teeth.', 'She has teeth.')).toBe('number_changed');
    expect(checkInvariants('Um, she has a ball.', 'She have a ball.')).toBeNull();
  });
});
