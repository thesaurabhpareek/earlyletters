/**
 * Gaps found by the 11 Nov 2026 verifier attack run (Ultra API credit job J3; Project doc
 * infra/credit-reports-verified-2026-11-19.md). Each case below was ACCEPTED by verifyEdits and changed
 * what a parent said. The constitution: the machine may remove and repair, never add meaning.
 * Every case here must be refused, and the controls at the end must stay accepted.
 * Fictional family only.
 */
import { describe, expect, it } from 'vitest';
import { verifyEdits, type DictionaryTerm, type Edit, type EditLevel, type VerifyContext } from '../src';

const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia', 'Usha'] },
  { term: 'Mumma', kind: 'family', heardAs: ['mama'] },
];

function at(raw: string, type: Edit['type'], original: string, replacement: string, nth = 0): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  if (start < 0) throw new Error(`fixture: "${original}" not in "${raw}"`);
  return { type, start, end: start + original.length, original, replacement, source: 'model' };
}

const ctx = (raw: string, level: EditLevel = 'clean'): VerifyContext => ({ raw, level, dictionary: DICT, protectedSpans: [] });
const accepted = (raw: string, e: Edit): boolean => verifyEdits([e], ctx(raw)).accepted.length === 1;

type Case = [raw: string, type: Edit['type'], original: string, replacement: string, nth?: number];

const mustRefuse = (title: string, cases: Case[]) =>
  describe(title, () => {
    for (const [raw, type, original, replacement, nth] of cases) {
      it(`${type} "${original}" -> "${replacement}" in "${raw}"`, () => {
        expect(accepted(raw, at(raw, type, original, replacement, nth ?? 0))).toBe(false);
      });
    }
  });

mustRefuse('a break or comma put after a negation changes what was said', [
  ["Mumma said don't stop singing to Asha.", 'punctuation', "don't stop", "don't, stop"],
  ['Daddy said no more cookies for Asha today.', 'punctuation', 'no more', 'no. More'],
  ['Asha did not want the banana.', 'punctuation', 'not want', 'not. Want'],
  ['Nani said never mind the mess.', 'punctuation', 'never mind', 'never. Mind'],
  ["I can't wait for Dada to come.", 'punctuation', "can't wait", "can't. Wait"],
  ['Papa says Asha will not stop dancing.', 'punctuation', 'not stop', 'not, stop'],
  ['Asha did not want it', 'paragraph', ' ', '\n\n', 2],
]);

mustRefuse('a mark removed after a negation joins two things the parent kept apart', [
  ['Asha did not. Eat the peas.', 'punctuation', 'not. Eat', 'not eat'],
]);

mustRefuse('a separator between two numbers is the parent\'s', [
  ['Papa fed her 2. 5 minutes later she slept.', 'punctuation', '.', ''],
  ['She slept 3, 4 hours today.', 'punctuation', ',', ''],
  ['Asha ate 2 3 grapes.', 'punctuation', ' ', '. ', 2],
]);

mustRefuse('only ordinary marks are punctuation: no emoji, no small-form marks, no ellipsis, no mark with nothing before it', [
  ['Asha clapped her hands.', 'punctuation', '.', '❗'],
  ['Daddy came home and Asha giggled', 'punctuation', 'giggled', 'giggled❗'],
  ['Did Asha eat her dinner.', 'punctuation', '.', '﹖'],
  ['Is Dada home?', 'punctuation', '?', '?❓'],
  ['Asha waved bye.', 'punctuation', '.', '…'],
  ['Asha smiled at Daddy', 'punctuation', '', '.'],
  ['Asha looked up and ate the banana.', 'punctuation', 'and ate', 'and… ate'],
]);

mustRefuse('a comma before a name or kinship word is how a parent calls to them', [
  ["Let's eat, Nani.", 'punctuation', 'eat, Nani', 'eat Nani'],
]);

mustRefuse('a word said twice for emphasis, a call or a count is not a false start', [
  ['It was very, very big.', 'false_start', 'very, ', ''],
  ['Say bye, bye to Nani.', 'false_start', 'bye, ', ''],
  ['Daddy, Daddy, look at Asha roll!', 'false_start', 'Daddy, ', ''],
  ['I love you, I love you so much.', 'false_start', 'I love you, ', ''],
  ['Asha wants one, one more cookie.', 'false_start', 'one, ', ''],
  ['Nani gave her two, two little socks.', 'false_start', 'two, ', ''],
  ['Asha clapped 5, 5 times.', 'false_start', '5, ', ''],
]);

mustRefuse('a sentence said twice is meant', [
  ['Mumma asked, do you love me? I do. I do.', 'repeat', 'I do. ', ''],
]);

describe('a repeat cannot be justified by a repeat that is also removed', () => {
  it('"the the" loses one word, never both', () => {
    const raw = 'Asha saw the the dog today.';
    const r = verifyEdits([at(raw, 'repeat', 'the ', '', 0), at(raw, 'repeat', 'the ', '', 1)], ctx(raw));
    expect(r.accepted.length).toBeLessThanOrEqual(1);
  });
});

describe('controls: honest repairs stay accepted', () => {
  const ok: Case[] = [
    ['She was was giggling at Daddy.', 'repeat', 'was ', ''],
    ['Papa said she is she is the best baby.', 'repeat', 'she is ', ''],
    ['Asha saw the the dog today.', 'repeat', 'the ', ''],
    ['No I did not like it', 'punctuation', 'No I', 'No, I'],
    ['Asha saw the dog', 'punctuation', 'dog', 'dog.'],
    ['She slept for 3 hours', 'punctuation', 'hours', 'hours.'],
    ['Asha did not want it', 'punctuation', 'it', 'it.'],
  ];
  for (const [raw, type, original, replacement, nth] of ok) {
    it(`${type} "${original}" -> "${replacement}" in "${raw}"`, () => {
      expect(accepted(raw, at(raw, type, original, replacement, nth ?? 0))).toBe(true);
    });
  }
});
