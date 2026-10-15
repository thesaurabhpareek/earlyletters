/**
 * Every refusal path of the verifier (packages/core/src/verify.ts), one case
 * per RejectReason, so a reason that stops being reachable or starts being
 * given for the wrong thing is noticed. The constitution: the machine may
 * remove and repair, never add meaning (DATA-REQ-040). Fictional family only.
 */
import { describe, expect, it } from 'vitest';
import { checkEdit, compileRules, verifyEdits, type DictionaryTerm, type Edit, type EditLevel, type RejectReason, type VerifyContext } from '../src';

const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia', 'Usha'] },
  { term: 'Mumma', kind: 'family', heardAs: ['mama'] },
  { term: 'Neela', kind: 'family', heardAs: [] },
];

function at(raw: string, type: Edit['type'], original: string, replacement: string, nth = 0, source: Edit['source'] = 'model'): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  if (start < 0) throw new Error(`fixture: "${original}" not in "${raw}"`);
  return { type, start, end: start + original.length, original, replacement, source };
}

const ctx = (raw: string, level: EditLevel = 'clean', over: Partial<VerifyContext> = {}): VerifyContext => ({ raw, level, dictionary: DICT, protectedSpans: [], ...over });

/** The single-edit verdict through the whole gate (checkEdit plus verifyEdits' own checks). */
function verdict(raw: string, e: Edit, level: EditLevel = 'clean', over: Partial<VerifyContext> = {}): RejectReason | null {
  const r = verifyEdits([e], ctx(raw, level, over));
  return r.accepted.length ? null : r.rejected[0].reason;
}

describe('shape of the edit itself', () => {
  it('out_of_bounds: a span before the start, past the end, or inside out', () => {
    const raw = 'Asha laughed.';
    const bad = (start: number, end: number): Edit => ({ type: 'filler', start, end, original: '', replacement: '', source: 'model' });
    expect(checkEdit(bad(-1, 2), ctx(raw))).toBe('out_of_bounds');
    expect(checkEdit(bad(0, raw.length + 1), ctx(raw))).toBe('out_of_bounds');
    expect(checkEdit(bad(5, 3), ctx(raw))).toBe('out_of_bounds');
  });

  it('original_mismatch: the edit must quote the raw text exactly, offsets included', () => {
    const raw = 'Usha laughed.';
    const e: Edit = { type: 'stt_fix', start: 0, end: 4, original: 'Asha', replacement: 'Asha', source: 'model' };
    expect(checkEdit(e, ctx(raw))).toBe('original_mismatch');
    const shifted = { ...at(raw, 'stt_fix', 'Usha', 'Asha'), start: 1, end: 5 };
    expect(checkEdit(shifted, ctx(raw))).toBe('original_mismatch');
  });

  it('type_not_allowed_at_level: verbatim keeps only dictionary fixes and punctuation', () => {
    const raw = 'um she was, she was so happy and she have the the duck';
    const refused: Array<[Edit['type'], string, string]> = [
      ['filler', 'um ', ''],
      ['false_start', 'she was, ', ''],
      ['repeat', 'the ', ''],
      ['agreement', 'have', 'has'],
      ['paragraph', ' ', '\n\n'],
    ];
    for (const [type, original, replacement] of refused) {
      expect(checkEdit(at(raw, type, original, replacement), ctx(raw, 'verbatim')), type).toBe('type_not_allowed_at_level');
    }
    expect(checkEdit(at(raw, 'punctuation', 'duck', 'duck.'), ctx(raw, 'verbatim'))).toBeNull();
    expect(checkEdit(at('Usha ran', 'stt_fix', 'Usha', 'Asha'), ctx('Usha ran', 'verbatim'))).toBeNull();
  });

  it('[ADR-0014] not_vetted_for_language: a language without a signed-off pack refuses removals and agreement', () => {
    const pt = compileRules('pt', null);
    expect(pt.can).toMatchObject({ fillers: false, removals: false, agreement: false });
    const raw = 'um ela ela estava feliz';
    const edits: Array<[Edit['type'], string, string]> = [
      ['filler', 'um ', ''],
      ['repeat', 'ela ', ''],
      ['false_start', 'ela ', ''],
      ['agreement', 'estava', 'estavam'],
    ];
    for (const [type, original, replacement] of edits) {
      expect(checkEdit(at(raw, type, original, replacement), ctx(raw, 'clean', { rules: pt })), type).toBe('not_vetted_for_language');
    }
    // Punctuation and paragraph breaks are not vetted tables: still allowed to be checked on their merits.
    expect(checkEdit(at(raw, 'punctuation', 'feliz', 'feliz.'), ctx(raw, 'clean', { rules: pt }))).toBeNull();
    expect(checkEdit(at(raw, 'paragraph', ' ', '\n\n'), ctx(raw, 'clean', { rules: pt }))).toBeNull();
  });

  it('splits_word: a removal may not start or end inside a word', () => {
    const raw = 'Asha hummed a tune';
    expect(checkEdit(at(raw, 'filler', 'mmed', ''), ctx(raw))).toBe('splits_word');
    expect(checkEdit(at(raw, 'repeat', 'a hu', ''), ctx(raw))).toBe('splits_word');
  });

  it('changes_word: a removal may not glue the words around it together', () => {
    const raw = 'today you you held the spoon';
    const glue: Edit = { ...at(raw, 'repeat', ' you', '', 1), replacement: '' };
    // removing "you " (with its trailing space) leaves "you" and "held" apart; removing " you" between
    // "you" and " held" is fine too; gluing happens when both neighbours are letters:
    const e: Edit = { type: 'repeat', start: 9, end: 14, original: ' you ', replacement: '', source: 'model' };
    expect(raw.slice(e.start, e.end)).toBe(' you ');
    expect(checkEdit(e, ctx(raw))).toBe('changes_word');
    expect(checkEdit(glue, ctx(raw))).toBeNull();
  });

  it('overlaps_protected: nothing touches a quoted or locked span, whatever the edit type', () => {
    const raw = 'She said "um bau" and um laughed';
    const quoted = { start: raw.indexOf('"'), end: raw.indexOf('"', raw.indexOf('"') + 1) + 1 };
    expect(checkEdit(at(raw, 'filler', 'um ', ''), ctx(raw, 'clean', { protectedSpans: [quoted] }))).toBe('overlaps_protected');
    expect(checkEdit(at(raw, 'punctuation', 'bau', 'bau.'), ctx(raw, 'clean', { protectedSpans: [quoted] }))).toBe('overlaps_protected');
    expect(checkEdit(at(raw, 'filler', 'um ', '', 1), ctx(raw, 'clean', { protectedSpans: [quoted] }))).toBeNull();
  });

  it('paragraph_not_whitespace: a paragraph edit may move only whitespace', () => {
    const raw = 'She slept. Then she woke.';
    expect(checkEdit(at(raw, 'paragraph', ' ', '\n\n'), ctx(raw))).toBeNull();
    expect(checkEdit(at(raw, 'paragraph', ' ', ' and '), ctx(raw))).toBe('paragraph_not_whitespace');
    expect(checkEdit(at(raw, 'paragraph', ' Then', '\n\n'), ctx(raw))).toBe('paragraph_not_whitespace');
  });
});

describe('removals: filler, repeat, false start', () => {
  it('removal_only, removal_adds_punctuation and changes_quotes guard the shape of every removal', () => {
    const raw = 'um "bau" she said, um, twice';
    expect(checkEdit(at(raw, 'filler', 'um ', 'Proudly '), ctx(raw))).toBe('removal_only');
    expect(checkEdit(at(raw, 'filler', ' um', '.', 0), ctx(raw))).toBe('removal_adds_punctuation');
    expect(checkEdit(at(raw, 'filler', 'um "', ''), ctx(raw))).toBe('changes_quotes');
    expect(checkEdit(at(raw, 'repeat', 'um ', 'the '), ctx(raw))).toBe('removal_only');
  });

  it('not_a_filler: only listed hesitation sounds go, and only as whole words', () => {
    const raw = 'um she was happy, honestly';
    expect(checkEdit(at(raw, 'filler', 'happy, ', ''), ctx(raw))).toBe('not_a_filler');
    expect(checkEdit(at(raw, 'filler', 'honestly', ''), ctx(raw))).toBe('not_a_filler');
    expect(checkEdit(at(raw, 'filler', 'um ', ''), ctx(raw))).toBeNull();
  });

  it('not_a_repeat, removes_negation, changes_sentence_type and repeat_is_emphasis for repeats', () => {
    expect(checkEdit(at('she was happy', 'repeat', 'was ', ''), ctx('she was happy'))).toBe('not_a_repeat');
    expect(checkEdit(at('I am not not sad', 'repeat', ' not', '', 1), ctx('I am not not sad'))).toBe('removes_negation');
    expect(checkEdit(at('why? why? because', 'repeat', 'why? ', '', 1), ctx('why? why? because'))).toBe('changes_sentence_type');
    expect(checkEdit(at('she was very very tired', 'repeat', 'very ', ''), ctx('she was very very tired'))).toBe('repeat_is_emphasis');
    expect(checkEdit(at('bye bye Mumma', 'repeat', 'bye ', ''), ctx('bye bye Mumma'))).toBe('repeat_is_emphasis');
    expect(checkEdit(at('come on, come on, up you get', 'repeat', 'come on, ', ''), ctx('come on, come on, up you get'))).toBe('repeat_is_emphasis');
  });

  it('false_start_not_repeated, removes_negation, changes_sentence_type and false_start_complete_phrase for false starts', () => {
    expect(checkEdit(at('I was tired, so we stayed', 'false_start', 'I was tired, ', ''), ctx('I was tired, so we stayed'))).toBe('false_start_not_repeated');
    expect(checkEdit(at('not, not today she said', 'false_start', 'not, ', ''), ctx('not, not today she said'))).toBe('removes_negation');
    expect(checkEdit(at('did you? did you see it', 'false_start', 'did you? ', ''), ctx('did you? did you see it'))).toBe('changes_sentence_type');
    expect(checkEdit(at('I love you, I love you.', 'false_start', 'I love you, ', ''), ctx('I love you, I love you.'))).toBe('false_start_complete_phrase');
    expect(checkEdit(at('she was, um, she was so happy', 'false_start', 'she was, um, ', ''), ctx('she was, um, she was so happy'))).toBeNull();
  });
});

describe('substitutions: stt_fix, agreement, punctuation', () => {
  it('stt_fix: not_dictionary, protected_word and not_heard_as', () => {
    expect(checkEdit(at('the mango fell', 'stt_fix', 'mango', 'banana'), ctx('the mango fell'))).toBe('stt_fix_not_dictionary');
    expect(checkEdit(at('I love her', 'stt_fix', 'her', 'Asha'), ctx('I love her'))).toBe('stt_fix_protected_word');
    expect(checkEdit(at('then Neela came', 'stt_fix', 'Neela', 'Asha'), ctx('then Neela came'))).toBe('stt_fix_protected_word');
    expect(checkEdit(at('see the moon', 'stt_fix', 'moon', 'Mumma'), ctx('see the moon'))).toBe('stt_fix_not_heard_as');
    expect(checkEdit(at('then Ah Sha La La ran', 'stt_fix', 'Ah Sha La La', 'Asha'), ctx('then Ah Sha La La ran'))).toBe('stt_fix_not_heard_as');
    expect(checkEdit(at('Usher ran to me', 'stt_fix', 'Usher', 'Asha'), ctx('Usher ran to me'))).toBe('stt_fix_not_heard_as');
    expect(checkEdit(at('then Usher ran', 'stt_fix', 'Usher', 'Asha'), ctx('then Usher ran'))).toBeNull();
    expect(checkEdit(at('then Usha ran', 'stt_fix', 'Usha', 'Asha'), ctx('then Usha ran'))).toBeNull();
  });

  it('[ADR-0014] stt_fix in an uncased script accepts learned mishearings only', () => {
    const hi = compileRules('hi', null);
    expect(hi.can.nameSimilarity).toBe(false);
    const dict: DictionaryTerm[] = [{ term: 'आशा', kind: 'child', heardAs: ['आसा'] }];
    expect(checkEdit(at('फिर आसा हँसी', 'stt_fix', 'आसा', 'आशा'), ctx('फिर आसा हँसी', 'clean', { rules: hi, dictionary: dict }))).toBeNull();
    expect(checkEdit(at('फिर आषा हँसी', 'stt_fix', 'आषा', 'आशा'), ctx('फिर आषा हँसी', 'clean', { rules: hi, dictionary: dict }))).toBe('stt_fix_not_heard_as');
  });

  it('agreement: not_single_word, stem_mismatch, changes_negation, changes_modal, changes_tense, changes_word', () => {
    expect(checkEdit(at('She have, I think, two', 'agreement', 'have,', 'has'), ctx('She have, I think, two'))).toBe('agreement_not_single_word');
    expect(checkEdit(at('She have two', 'agreement', 'have two', 'has two'), ctx('She have two'))).toBe('agreement_not_single_word');
    expect(checkEdit(at('Have she two?', 'agreement', 'Have', 'has'), ctx('Have she two?'))).toBe('agreement_stem_mismatch');
    expect(checkEdit(at('She is happy', 'agreement', 'happy', 'joyful'), ctx('She is happy'))).toBe('agreement_stem_mismatch');
    expect(checkEdit(at('I can come', 'agreement', 'can', 'cannot'), ctx('I can come'))).toBe('changes_negation');
    expect(checkEdit(at('I can come', 'agreement', 'can', 'could'), ctx('I can come'))).toBe('changes_modal');
    expect(checkEdit(at('She loves rain', 'agreement', 'loves', 'loved'), ctx('She loves rain'))).toBe('changes_tense');
    expect(checkEdit(at('We were tired', 'agreement', 'were', "we're"), ctx('We were tired'))).toBe('changes_word');
    expect(checkEdit(at('She have two', 'agreement', 'have', 'has'), ctx('She have two'))).toBeNull();
  });

  it('punctuation: changed_letters, changes_word, changes_sentence_type, changes_quotes, changes_number', () => {
    expect(checkEdit(at('her favourite colour', 'punctuation', 'colour', 'color'), ctx('her favourite colour'))).toBe('punctuation_changed_letters');
    expect(checkEdit(at('some one came', 'punctuation', 'some one', 'someone'), ctx('some one came'))).toBe('changes_word');
    expect(checkEdit(at('You did it.', 'punctuation', 'it.', 'it?'), ctx('You did it.'))).toBe('changes_sentence_type');
    expect(checkEdit(at('Wow! She stood', 'punctuation', 'Wow!', 'Wow.'), ctx('Wow! She stood'))).toBe('changes_sentence_type');
    expect(checkEdit(at('she said bau', 'punctuation', 'bau', '"bau"'), ctx('she said bau'))).toBe('changes_quotes');
    expect(checkEdit(at('She ate 1,000 peas', 'punctuation', '1,000', '1.000'), ctx('She ate 1,000 peas'))).toBe('changes_number');
    expect(checkEdit(at('she walked home', 'punctuation', 'home', 'home.'), ctx('she walked home'))).toBeNull();
  });

  it('case_change_not_allowed: only a first letter, only in a lowercase word, only lowered where it was positional', () => {
    expect(checkEdit(at('my iPad fell', 'punctuation', 'iPad', 'Ipad'), ctx('my iPad fell'))).toBe('case_change_not_allowed');
    expect(checkEdit(at('OK then', 'punctuation', 'OK', 'ok'), ctx('OK then'))).toBe('case_change_not_allowed');
    expect(checkEdit(at('we saw Asha', 'punctuation', 'Asha', 'asha'), ctx('we saw Asha'))).toBe('case_change_not_allowed');
    expect(checkEdit(at('so I can', 'punctuation', 'I', 'i'), ctx('so I can'))).toBe('case_change_not_allowed');
    expect(checkEdit(at('She walked. Then she ran', 'punctuation', 'walked. Then', 'walked, then'), ctx('She walked. Then she ran'))).toBeNull();
  });

  it('case_change_not_sentence_start: a capital raised mid-sentence is refused by the whole-list pass', () => {
    expect(verdict('I will go.', at('I will go.', 'punctuation', 'will', 'Will'))).toBe('case_change_not_sentence_start');
    expect(checkEdit(at('I will go.', 'punctuation', 'will', 'Will'), ctx('I will go.'))).toBeNull(); // alone it looks fine; the list pass decides
  });
});

describe('verifyEdits: the checks that need the other edits', () => {
  it('overlaps_other_edit: an overlapping edit, or one at the same start, loses to the earlier accepted one', () => {
    const raw = 'um um so we went';
    const first = at(raw, 'filler', 'um ', '', 0, 'rule');
    const same = { ...at(raw, 'filler', 'um ', '', 0) };
    const overlapping: Edit = { type: 'filler', start: 0, end: 6, original: 'um um ', replacement: '', source: 'model' };
    const r = verifyEdits([first, same, overlapping], ctx(raw));
    expect(r.accepted).toEqual([first]);
    expect(r.rejected.map((x) => x.reason)).toEqual(['overlaps_other_edit', 'overlaps_other_edit']);
  });

  it('an insertion and a removal at the same offset have no defined order: the second is refused', () => {
    const raw = 'she walked um home';
    const remove = at(raw, 'filler', 'um ', '');
    const insert: Edit = { type: 'punctuation', start: remove.start, end: remove.start, original: '', replacement: ',', source: 'model' };
    const r = verifyEdits([insert, remove], ctx(raw));
    expect(r.accepted.map((e) => e.type)).toEqual(['punctuation']);
    expect(r.rejected[0].reason).toBe('overlaps_other_edit');
  });

  it('agreement_limit_per_sentence: one agreement repair per sentence, the rest refused', () => {
    const raw = 'She have two and she have three. They is here.';
    const first = at(raw, 'agreement', 'have', 'has', 0);
    const second = at(raw, 'agreement', 'have', 'has', 1);
    const other = at(raw, 'agreement', 'is', 'are');
    const r = verifyEdits([first, second, other], ctx(raw));
    expect(r.accepted).toEqual([first, other]);
    expect(r.rejected).toEqual([{ edit: second, reason: 'agreement_limit_per_sentence' }]);
  });

  it('change_ceiling_exceeded: a model that touches too much loses every one of its edits, the rules keep theirs', () => {
    // One repair per sentence is allowed, so each sits in its own sentence; six of thirteen words is past the ceiling.
    const raw = 'um she walk. she talk. she run. she eat. she sing. she jump.';
    const rule = at(raw, 'filler', 'um ', '', 0, 'rule');
    const model = ['walk', 'talk', 'run', 'eat', 'sing', 'jump'].map((w) => at(raw, 'agreement', w, `${w}s`));
    const r = verifyEdits([rule, ...model], ctx(raw));
    expect(r.accepted).toEqual([rule]);
    expect(r.rejected).toHaveLength(6);
    expect(r.rejected.every((x) => x.reason === 'change_ceiling_exceeded')).toBe(true);
    expect(r.modelChangeRatio).toBe(0);
  });

  it('modelChangeRatio counts the words the model touched over the words said', () => {
    const raw = 'she have two teeth and a third one is coming soon';
    const r = verifyEdits([at(raw, 'agreement', 'have', 'has')], ctx(raw));
    expect(r.accepted).toHaveLength(1);
    expect(r.modelChangeRatio).toBeCloseTo(1 / 11, 6);
    expect(verifyEdits([], ctx(raw)).modelChangeRatio).toBe(0);
  });

  it('a refused edit never shadows a later good one at another offset', () => {
    const raw = 'um she have two';
    const r = verifyEdits([at(raw, 'filler', 'she ', ''), at(raw, 'agreement', 'have', 'has')], ctx(raw));
    expect(r.rejected.map((x) => x.reason)).toEqual(['not_a_filler']);
    expect(r.accepted.map((e) => e.type)).toEqual(['agreement']);
  });
});
