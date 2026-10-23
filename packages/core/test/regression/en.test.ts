/**
 * R-01 regression suite, English (F06-REQ-019). Latin script: D3, D4, D6,
 * D7, D10, D12, D13, D14, plus the cases found while closing them. English
 * is the bundled pack, so "shipped" and "vetted" are the same here, and it
 * is the language every alpha letter is cleaned in at level clean.
 *
 * Fictional family only.
 */
import { describe, expect, it } from 'vitest';
import {
  applyEdits,
  checkHeardAs,
  ENGLISH_RULES,
  faithfulClean,
  normalizeChars,
  punctuationEdits,
  type DictionaryTerm,
} from '../../src';
import { edit, insertAfter, INVISIBLES, twoNames, verdict } from './harness';

const R = ENGLISH_RULES;
const DICT: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }];
const clean = (raw: string, dictionary: DictionaryTerm[] = DICT) => faithfulClean(raw, { level: 'clean', dictionary, language: 'en' });

describe('[F06-REQ-019] English: R-01 cases are refused, a legitimate edit is accepted', () => {
  it('[F06-REQ-002] never changes a letter or its accent: R-01 D3 (decomposed accent dropped or swapped)', () => {
    const raw = 'We went to the café with Asha.';
    expect(verdict(raw, edit(raw, 'punctuation', 'café', 'cafe'), R)).toBe('punctuation_changed_letters');
    expect(verdict(raw, edit(raw, 'punctuation', 'café', 'cafè'), R)).toBe('punctuation_changed_letters');
  });

  it.each(INVISIBLES.map((c) => [`U+${c.codePointAt(0)!.toString(16).toUpperCase()}`, c]))(
    '[F06-REQ-003] never adds an invisible character: R-01 D4 (%s after a word)',
    (_name, ch) => {
      const raw = 'Asha laughed at the duck.';
      expect(verdict(raw, insertAfter(raw, 'punctuation', 'laughed', ch), R)).toBe('changes_invisible');
    },
  );

  it.each([
    ['Did you want more? Uh-uh, she said.', 'Uh-uh'],
    ['Uh uh, not now, Asha.', 'Uh uh'],
    ['Mm-hmm, Asha nodded.', 'Mm-hmm'],
    ['Mm hmm, Asha nodded.', 'Mm hmm'],
    ['Mm-mm, not that one.', 'Mm-mm'],
    ['Hmm, uh-oh, she dropped it.', 'uh-oh'],
  ])('[F06-REQ-005] never drops a spoken yes or no: R-01 D6 ("%s" keeps %s)', (raw, kept) => {
    const out = clean(raw);
    expect(out.text).toContain(kept);
    expect(out.applied.some((e) => e.original.includes('-'))).toBe(false);
  });

  it('[F06-REQ-005] a model may not take part of a hyphenated word under any removal label: R-01 D6', () => {
    const raw = 'Did you want more? Uh-uh, she said. It was so-so.';
    expect(verdict(raw, edit(raw, 'filler', 'Uh-uh, ', ''), R)).toBe('not_a_filler');
    expect(verdict(raw, edit(raw, 'filler', '-uh', ''), R)).toBe('not_a_filler');
    expect(verdict(raw, edit(raw, 'repeat', '-so', ''), R)).toBe('splits_word');
    expect(verdict(raw, edit(raw, 'false_start', 'so-', ''), R)).toBe('splits_word');
  });

  it('[F06-REQ-005] control: a filler with a pause mark is still removed (uh, uh, I forgot)', () => {
    expect(clean('Uh, uh, I forgot.').text).toBe('I forgot.');
    expect(clean('Um, Asha slept at last.').text).toBe('Asha slept at last.');
  });

  it.each([
    ['curly single quotes', '‘', '’'],
    ['low-high quotes', '„', '“'],
  ])("[F06-REQ-006] never edits the child's quoted words: R-01 D7 (filler inside %s)", (_name, open, close) => {
    const out = clean(`Asha said ${open}um, up${close} twice.`);
    expect(out.text).toContain('um, up');
    expect(out.applied).toEqual([]);
  });

  it.each([
    ['Hope', 'I hope you sleep well, Hope.', 'I hope you sleep well, Hope.'],
    ['Will', 'We will see, Will.', 'We will see, Will.'],
    ['May', 'Tomorrow we may go out with May.', 'Tomorrow we may go out with May.'],
    ['Grace', 'She said grace before dinner.', 'She said grace before dinner.'],
    ['Bean', 'Asha ate a bean today.', 'Asha ate a bean today.'],
  ])('[F06-REQ-008] a common word that matches a name stays as said: R-01 D10 (child named %s)', (term, raw, want) => {
    const dict: DictionaryTerm[] = [...DICT, { term, kind: term === 'Bean' ? 'nickname' : 'child', heardAs: [] }];
    const out = clean(raw, dict);
    expect(out.text).toBe(want);
    expect(out.applied.filter((e) => e.type === 'stt_fix')).toEqual([]);
  });

  it('[F06-REQ-008] a model case fix of a name word is refused, whatever its source: R-01 D10', () => {
    const dict: DictionaryTerm[] = [{ term: 'Will', kind: 'nickname', heardAs: [] }];
    const raw = 'We will see.';
    expect(verdict(raw, edit(raw, 'stt_fix', 'will', 'Will'), R, dict)).toBe('stt_fix_protected_word');
    expect(verdict(raw, edit(raw, 'stt_fix', 'will', 'Will', 0, 'rule'), R, dict)).toBe('stt_fix_protected_word');
  });

  it('[F06-REQ-008] control: a lowercase name that is not an everyday word is still spelled the family way', () => {
    expect(clean('Today asha and Usher played.').text).toBe('Today Asha and Asha played.');
  });

  it('[F06-REQ-010] only the letter language fillers are removed: R-01 D12 control (English removes um)', () => {
    expect(clean('She said um yes.').text).toBe('She said yes.');
  });

  it('[F06-REQ-014] one family name never becomes another: R-01 D13', () => {
    const dict = twoNames('Asha', 'Usha');
    expect(clean('Usha came over today.', dict).text).toBe('Usha came over today.');
    const raw = 'Usha came over today.';
    expect(verdict(raw, edit(raw, 'stt_fix', 'Usha', 'Asha'), R, dict)).toBe('stt_fix_protected_word');
    expect(verdict(raw, edit(raw, 'stt_fix', 'Usha', 'Asha', 0, 'rule'), R, dict)).toBe('stt_fix_protected_word');
  });

  it('[F06-REQ-014] a name inside a longer heard-as is not swapped either: R-01 D13', () => {
    const dict: DictionaryTerm[] = [
      { term: 'Asha ji', kind: 'child', heardAs: ['Usha ji'] },
      { term: 'Usha', kind: 'family', heardAs: [] },
    ];
    expect(clean('Then Usha ji sang.', dict).text).toBe('Then Usha ji sang.');
  });

  it('[F06-REQ-014] F07 save check refuses a heard-as that is another name (F07-REQ-012)', () => {
    const dict = twoNames('Asha', 'Usha');
    expect(checkHeardAs(dict[0], 'Usha', dict, R)).toBe('collides_with_other_term');
    expect(checkHeardAs(dict[0], 'Usher', dict, R)).toBe('ok');
  });

  it('[F06-REQ-017] a taught mishearing never erases a negation, a number or a modal (found 15 Oct)', () => {
    const noa: DictionaryTerm[] = [{ term: 'Noa', kind: 'child', heardAs: ['no'] }];
    expect(clean('No, she did not cry. I said no.', noa).text).toBe('No, she did not cry. I said no.');
    const raw = 'I said no.';
    expect(verdict(raw, edit(raw, 'stt_fix', 'no', 'Noa', 0, 'rule'), R, noa)).toBe('stt_fix_protected_word');
    const ten: DictionaryTerm[] = [{ term: 'Tenzin', kind: 'child', heardAs: ['ten'] }];
    expect(clean('She counted to ten.', ten).text).toBe('She counted to ten.');
    const may: DictionaryTerm[] = [{ term: 'Maya', kind: 'child', heardAs: ['may'] }];
    expect(clean('We may go out.', may).text).toBe('We may go out.');
  });

  it('[F06-REQ-017] a kinship word is taught only to a self or family term (F07 7.2 rule 5)', () => {
    const child: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['mama'] }];
    expect(clean('Asha hugged mama.', child).text).toBe('Asha hugged mama.');
    const family: DictionaryTerm[] = [{ term: 'Mumma', kind: 'family', heardAs: ['mama'] }];
    expect(clean('Asha hugged mama.', family).text).toBe('Asha hugged Mumma.');
  });

  it('[F06-REQ-016] a dash between numbers stays a range, never a list (found 15 Oct)', () => {
    expect(clean('Asha slept 2 – 3 hours.').text).toBe('Asha slept 2 - 3 hours.');
    expect(clean('It took 10 — 15 minutes.').text).toBe('It took 10 - 15 minutes.');
    expect(normalizeChars('Between 3–4 pm.')).toBe('Between 3-4 pm.');
    expect(normalizeChars('I love you — always.')).toBe('I love you, always.');
  });

  it.fails('[F06-REQ-016] OPEN R-01 D14 (WP-F06-05, founder Q1): an em dash changes with no stored edit', () => {
    // Fails today on purpose: the house character rule still runs after the verified edits.
    // When WP-F06-05 lands this assertion passes, it.fails fails, and the case moves to it().
    const raw = 'I wanted — no, I needed it.';
    const out = clean(raw);
    expect(out.text).toBe(applyEdits(raw, out.applied).trim());
  });

  it('[F06-REQ-015] the punctuation provider adds no "." after a full-width or Arabic end mark (3 Oct finding)', () => {
    for (const raw of ['她睡了。', '她睡了？', 'هل نامت؟']) {
      expect(punctuationEdits({ raw, level: 'clean', dictionary: [] }).filter((e) => e.replacement === '.')).toEqual([]);
    }
    expect(punctuationEdits({ raw: 'asha slept', level: 'clean', dictionary: [] }).map((e) => e.replacement)).toEqual(['A', '.']);
  });

  it('[F06-REQ-019] control: an honest English clean still removes fillers and stumbles', () => {
    expect(clean('Um, Asha found the the duck.').text).toBe('Asha found the duck.');
  });
});
