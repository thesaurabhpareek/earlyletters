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

/** One refusal: the edit, and the reason the verifier must give. `what` reads after "refuses an edit that". */
interface Refusal {
  what: string;
  raw: string;
  type: Edit['type'];
  original: string;
  replacement: string;
  reason: RejectReason;
  nth?: number;
  dictionary?: DictionaryTerm[];
}
/** One edit the verifier must still accept, next to the refusals it could be mistaken for. */
type Accepted = Omit<Refusal, 'reason'>;

const check = (c: Accepted) => checkEdit(at(c.raw, c.type, c.original, c.replacement, c.nth ?? 0), ctx(c.raw, 'clean', c.dictionary ? { dictionary: c.dictionary } : {}));

const REMOVALS: Refusal[] = [
  { what: 'puts words in under a filler label', raw: 'um "bau" she said', type: 'filler', original: 'um ', replacement: 'Proudly ', reason: 'removal_only' },
  { what: 'puts words in under a repeat label', raw: 'um "bau" she said', type: 'repeat', original: 'um ', replacement: 'the ', reason: 'removal_only' },
  { what: 'adds a full stop while removing a filler', raw: 'she said um twice', type: 'filler', original: ' um', replacement: '.', reason: 'removal_adds_punctuation' },
  // Engine 6 (R-01 D7) protects every paired quote first, so a filler that eats a paired mark is overlaps_protected;
  // a stray mark the transcriber left unpaired is still a quotation mark, and taking it is changes_quotes.
  { what: 'removes a paired quotation mark with a filler', raw: 'um "bau" she said', type: 'filler', original: 'um "', replacement: '', reason: 'overlaps_protected' },
  { what: 'removes an unpaired quotation mark with a filler', raw: 'um " she said bau', type: 'filler', original: 'um "', replacement: '', reason: 'changes_quotes' },
  { what: 'removes a real word as a filler', raw: 'um she was happy, honestly', type: 'filler', original: 'happy, ', replacement: '', reason: 'not_a_filler' },
  { what: 'removes an adverb as a filler', raw: 'um she was happy, honestly', type: 'filler', original: 'honestly', replacement: '', reason: 'not_a_filler' },
  { what: 'removes a word that is not said twice, as a repeat', raw: 'she was happy', type: 'repeat', original: 'was ', replacement: '', reason: 'not_a_repeat' },
  { what: 'removes a doubled negation, as a repeat', raw: 'I am not not sad', type: 'repeat', original: ' not', replacement: '', reason: 'removes_negation', nth: 1 },
  { what: 'removes a repeated question, as a repeat', raw: 'why? why? because', type: 'repeat', original: 'why? ', replacement: '', reason: 'changes_sentence_type', nth: 1 },
  { what: 'removes emphasis ("very very"), as a repeat', raw: 'she was very very tired', type: 'repeat', original: 'very ', replacement: '', reason: 'repeat_is_emphasis' },
  { what: 'removes a doubled word people say on purpose ("bye bye")', raw: 'bye bye Mumma', type: 'repeat', original: 'bye ', replacement: '', reason: 'repeat_is_emphasis' },
  { what: 'removes a phrase said twice on purpose ("come on, come on")', raw: 'come on, come on, up you get', type: 'repeat', original: 'come on, ', replacement: '', reason: 'repeat_is_emphasis' },
  { what: 'removes a clause that is not said again, as a false start', raw: 'I was tired, so we stayed', type: 'false_start', original: 'I was tired, ', replacement: '', reason: 'false_start_not_repeated' },
  { what: 'removes a negation, as a false start', raw: 'not, not today she said', type: 'false_start', original: 'not, ', replacement: '', reason: 'removes_negation' },
  { what: 'removes a question, as a false start', raw: 'did you? did you see it', type: 'false_start', original: 'did you? ', replacement: '', reason: 'changes_sentence_type' },
  { what: 'removes a complete phrase said twice ("I love you, I love you.")', raw: 'I love you, I love you.', type: 'false_start', original: 'I love you, ', replacement: '', reason: 'false_start_complete_phrase' },
];

const REMOVALS_ACCEPTED: Accepted[] = [
  { what: 'a listed filler', raw: 'um she was happy, honestly', type: 'filler', original: 'um ', replacement: '' },
  { what: 'a real restart with a filler inside it', raw: 'she was, um, she was so happy', type: 'false_start', original: 'she was, um, ', replacement: '' },
];

/** Asha is the child; Usha Devi is a family member whose first name sounds like the child's. */
const FAMILY_NAME_DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia'] },
  { term: 'Usha Devi', kind: 'family', heardAs: [] },
];

const SUBSTITUTIONS: Refusal[] = [
  { what: 'replaces a word with one that is not in the dictionary', raw: 'the mango fell', type: 'stt_fix', original: 'mango', replacement: 'banana', reason: 'stt_fix_not_dictionary' },
  { what: 'replaces a pronoun with the child\'s name', raw: 'I love her', type: 'stt_fix', original: 'her', replacement: 'Asha', reason: 'stt_fix_protected_word' },
  { what: 'replaces another dictionary name with the child\'s name', raw: 'then Neela came', type: 'stt_fix', original: 'Neela', replacement: 'Asha', reason: 'stt_fix_protected_word' },
  // verify.ts:291 (isTermWord): one word of a multi-word family name is that person, not a mishearing.
  { what: 'replaces one word of a family member\'s two-word name with the child\'s name', raw: 'then Usha came', type: 'stt_fix', original: 'Usha', replacement: 'Asha', reason: 'stt_fix_protected_word', dictionary: FAMILY_NAME_DICT },
  { what: 'turns a lowercase common word into a name', raw: 'see the moon', type: 'stt_fix', original: 'moon', replacement: 'Mumma', reason: 'stt_fix_not_heard_as' },
  { what: 'replaces more than three words with a name', raw: 'then Ah Sha La La ran', type: 'stt_fix', original: 'Ah Sha La La', replacement: 'Asha', reason: 'stt_fix_not_heard_as' },
  { what: 'changes a capital that is only there because the sentence starts', raw: 'Usher ran to me', type: 'stt_fix', original: 'Usher', replacement: 'Asha', reason: 'stt_fix_not_heard_as' },
  { what: 'replaces a word with a comma inside it', raw: 'She have, I think, two', type: 'agreement', original: 'have,', replacement: 'has', reason: 'agreement_not_single_word' },
  { what: 'repairs two words at once', raw: 'She have two', type: 'agreement', original: 'have two', replacement: 'has two', reason: 'agreement_not_single_word' },
  { what: 'changes the case of the word it repairs', raw: 'Have she two?', type: 'agreement', original: 'Have', replacement: 'has', reason: 'agreement_stem_mismatch' },
  { what: 'swaps a word for a synonym', raw: 'She is happy', type: 'agreement', original: 'happy', replacement: 'joyful', reason: 'agreement_stem_mismatch' },
  { what: 'adds a negation', raw: 'I can come', type: 'agreement', original: 'can', replacement: 'cannot', reason: 'changes_negation' },
  { what: 'changes a modal (can to could)', raw: 'I can come', type: 'agreement', original: 'can', replacement: 'could', reason: 'changes_modal' },
  { what: 'changes the tense (loves to loved)', raw: 'She loves rain', type: 'agreement', original: 'loves', replacement: 'loved', reason: 'changes_tense' },
  { what: 'turns a word into a contraction (were to we\'re)', raw: 'We were tired', type: 'agreement', original: 'were', replacement: "we're", reason: 'changes_word' },
  { what: 'changes a letter (colour to color)', raw: 'her favourite colour', type: 'punctuation', original: 'colour', replacement: 'color', reason: 'punctuation_changed_letters' },
  { what: 'joins two words (some one to someone)', raw: 'some one came', type: 'punctuation', original: 'some one', replacement: 'someone', reason: 'changes_word' },
  { what: 'turns a statement into a question', raw: 'You did it.', type: 'punctuation', original: 'it.', replacement: 'it?', reason: 'changes_sentence_type' },
  { what: 'removes an exclamation', raw: 'Wow! She stood', type: 'punctuation', original: 'Wow!', replacement: 'Wow.', reason: 'changes_sentence_type' },
  { what: 'adds quotation marks', raw: 'she said bau', type: 'punctuation', original: 'bau', replacement: '"bau"', reason: 'changes_quotes' },
  { what: 'changes a number (1,000 to 1.000)', raw: 'She ate 1,000 peas', type: 'punctuation', original: '1,000', replacement: '1.000', reason: 'changes_number' },
  { what: 'changes case inside a word (iPad)', raw: 'my iPad fell', type: 'punctuation', original: 'iPad', replacement: 'Ipad', reason: 'case_change_not_allowed' },
  { what: 'lowers an all-capitals word (OK)', raw: 'OK then', type: 'punctuation', original: 'OK', replacement: 'ok', reason: 'case_change_not_allowed' },
  { what: 'lowers the capital of a name mid-sentence', raw: 'we saw Asha', type: 'punctuation', original: 'Asha', replacement: 'asha', reason: 'case_change_not_allowed' },
  { what: 'lowers the pronoun I', raw: 'so I can', type: 'punctuation', original: 'I', replacement: 'i', reason: 'case_change_not_allowed' },
];

const SUBSTITUTIONS_ACCEPTED: Accepted[] = [
  { what: 'a capitalised near-sounding name mid-sentence', raw: 'then Usher ran', type: 'stt_fix', original: 'Usher', replacement: 'Asha' },
  { what: 'a learned mishearing', raw: 'then Usha ran', type: 'stt_fix', original: 'Usha', replacement: 'Asha' },
  { what: 'the whole two-word family name, put back in its own case', raw: 'then usha devi came', type: 'stt_fix', original: 'usha devi', replacement: 'Usha Devi', dictionary: FAMILY_NAME_DICT },
  { what: 'a near-sounding name that is not part of any dictionary term', raw: 'then Usher came', type: 'stt_fix', original: 'Usher', replacement: 'Asha', dictionary: FAMILY_NAME_DICT },
  { what: 'a one-word agreement repair', raw: 'She have two', type: 'agreement', original: 'have', replacement: 'has' },
  { what: 'a full stop where there was none', raw: 'she walked home', type: 'punctuation', original: 'home', replacement: 'home.' },
  { what: 'a positional capital lowered when two sentences join', raw: 'She walked. Then she ran', type: 'punctuation', original: 'walked. Then', replacement: 'walked, then' },
];

describe('removals: filler, repeat, false start', () => {
  it.each(REMOVALS)('$type refuses an edit that $what ($reason)', (c) => {
    expect(check(c)).toBe(c.reason);
  });

  it.each(REMOVALS_ACCEPTED)('$type still accepts $what', (c) => {
    expect(check(c)).toBeNull();
  });
});

describe('substitutions: stt_fix, agreement, punctuation', () => {
  it.each(SUBSTITUTIONS)('$type refuses an edit that $what ($reason)', (c) => {
    expect(check(c)).toBe(c.reason);
  });

  it.each(SUBSTITUTIONS_ACCEPTED)('$type still accepts $what', (c) => {
    expect(check(c)).toBeNull();
  });

  it('[ADR-0014] stt_fix in an uncased script accepts learned mishearings only', () => {
    const hi = compileRules('hi', null);
    expect(hi.can.nameSimilarity).toBe(false);
    const dict: DictionaryTerm[] = [{ term: 'आशा', kind: 'child', heardAs: ['आसा'] }];
    expect(checkEdit(at('फिर आसा हँसी', 'stt_fix', 'आसा', 'आशा'), ctx('फिर आसा हँसी', 'clean', { rules: hi, dictionary: dict }))).toBeNull();
    expect(checkEdit(at('फिर आषा हँसी', 'stt_fix', 'आषा', 'आशा'), ctx('फिर आषा हँसी', 'clean', { rules: hi, dictionary: dict }))).toBe('stt_fix_not_heard_as');
  });

  it('case_change_not_sentence_start: a capital raised mid-sentence is refused by the whole-list pass', () => {
    expect(verdict('I will go.', at('I will go.', 'punctuation', 'will', 'Will'))).toBe('case_change_not_sentence_start');
    expect(checkEdit(at('I will go.', 'punctuation', 'will', 'Will'), ctx('I will go.'))).toBeNull(); // alone it looks fine; the list pass decides
  });
});

describe('verifyEdits: the checks that need the other edits', () => {
  it('overlaps_other_edit: an overlapping edit, or one at the same start, loses to the earlier accepted one', () => {
    // "um um" with only a space between is a spoken answer and no filler under engine 6 (R-01 D6),
    // so the fillers sit apart; the overlapping edit is a comma the model wants after the first one.
    const raw = 'um so um we went';
    const first = at(raw, 'filler', 'um ', '', 0, 'rule');
    const same = { ...at(raw, 'filler', 'um ', '', 0) };
    const overlapping: Edit = { type: 'punctuation', start: 2, end: 3, original: ' ', replacement: ', ', source: 'model' };
    expect(checkEdit(overlapping, ctx(raw))).toBeNull(); // alone it is a fair edit; only the overlap refuses it
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
    // One repair per sentence is allowed, so each sits in its own sentence; six of nineteen words is past the ceiling.
    // Each repair is a pair from the closed agreement table (engine 6, R-01 D9), so only the ceiling can refuse it.
    const raw = 'um she have one. she have two. she have three. she have four. she have five. she have six.';
    const rule = at(raw, 'filler', 'um ', '', 0, 'rule');
    const model = [0, 1, 2, 3, 4, 5].map((n) => at(raw, 'agreement', 'have', 'has', n));
    for (const e of model) expect(checkEdit(e, ctx(raw))).toBeNull(); // alone each is a fair repair
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
