/**
 * Verifier hardening (BL-064). Every test here is titled with the
 * constitution rule it defends: "The machine may remove and repair. It may
 * never add meaning." The first block is the reproduced TDD 03 section 7.1
 * findings, kept as fixed regressions.
 */
import { describe, expect, it } from 'vitest';
import {
  checkEdit,
  cleanWithProviders,
  faithfulClean,
  JsonModelEditProvider,
  RulePunctuationProvider,
  verifyEdits,
  type DictionaryTerm,
  type Edit,
  type EditLevel,
  type ModelCall,
} from '../src';

// Fictional family; real family details never live in code.
const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia', 'Usha'] },
  { term: 'Ashu', kind: 'nickname', heardAs: ['ah shoe'] },
  { term: 'Mumma', kind: 'family', heardAs: ['mama'] },
  { term: 'chalo', kind: 'word', heardAs: ['shallow'] },
  { term: 'Mira', kind: 'family', heardAs: [] },
];

function edit(raw: string, type: Edit['type'], original: string, replacement: string, nth = 0, source: Edit['source'] = 'model'): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  if (start < 0) throw new Error(`not found: ${original}`);
  return { type, start, end: start + original.length, original, replacement, source };
}

const ctx = (raw: string, level: EditLevel = 'clean') => ({ raw, level, dictionary: DICT, protectedSpans: [] });
/** What verifyEdits says about a single edit: null when applied, else the reject reason. */
const verdict = (raw: string, e: Edit, level: EditLevel = 'clean') => {
  const r = verifyEdits([e], ctx(raw, level));
  return r.accepted.length ? null : r.rejected[0].reason;
};

describe('TDD 03 7.1 regressions: the machine may never add meaning', () => {
  it('never adds a negation: "I can come" -> "I cannot come" (agreement)', () => {
    expect(verdict('I can come.', edit('I can come.', 'agreement', 'can', 'cannot'))).toBe('changes_negation');
  });

  it('never adds a negation: "can" -> "can\'t" (agreement)', () => {
    expect(verdict('I can come.', edit('I can come.', 'agreement', 'can', "can't"))).toBe('changes_negation');
  });

  it('never changes tense: "She is happy" -> "She was happy" (agreement)', () => {
    expect(verdict('She is happy.', edit('She is happy.', 'agreement', 'is', 'was'))).toBe('changes_tense');
  });

  it('never changes tense: "loves" -> "loved" (agreement)', () => {
    expect(verdict('She loves the rain.', edit('She loves the rain.', 'agreement', 'loves', 'loved'))).toBe('changes_tense');
  });

  it('never swaps a person: "I love Daddy" -> "I love Asha" (stt_fix)', () => {
    expect(verdict('I love Daddy.', edit('I love Daddy.', 'stt_fix', 'Daddy', 'Asha'))).toBe('stt_fix_protected_word');
  });

  it('never changes a word through an apostrophe: "We were tired" -> "We we\'re tired" (punctuation)', () => {
    expect(verdict('We were tired.', edit('We were tired.', 'punctuation', 'were', "we're"))).toBe('changes_word');
  });

  it('never changes sentence type: "You did it." -> "You did it?" (punctuation)', () => {
    expect(verdict('You did it.', edit('You did it.', 'punctuation', 'it.', 'it?'))).toBe('changes_sentence_type');
  });

  it('never removes a negation as a false start: "I am not sad today, I am not." minus the first "not"', () => {
    const raw = 'I am not sad today, I am not.';
    expect(verdict(raw, edit(raw, 'false_start', 'not ', ''))).toBe('false_start_not_repeated');
  });
});

describe('meaning guards: negation, tense, modals, words, numbers', () => {
  it.each([
    ["She doesn't sleep.", "doesn't", 'does', 'changes_negation'],
    ['She never cries.', 'never', 'ever', 'changes_negation'],
    ['I can come.', 'can', 'could', 'changes_modal'],
    ['I will go.', 'will', 'would', 'changes_modal'],
    ['She may come.', 'may', 'might', 'changes_modal'],
    ['She has a cold.', 'has', 'had', 'changes_tense'],
    ['She does it.', 'does', 'did', 'changes_tense'],
    ['They walk home.', 'walk', 'walked', 'changes_tense'],
    ['They walk home.', 'walk', 'walking', 'changes_tense'],
    ['She goes out.', 'goes', 'went', 'changes_tense'],
    ['She is two.', 'two', 'too', 'agreement_stem_mismatch'],
    ['He hugged me.', 'He', 'She', 'agreement_stem_mismatch'],
    ['I saw it.', 'it', 'its', 'agreement_stem_mismatch'],
    ['She have it.', 'have', 'has?', 'agreement_not_single_word'],
  ])('agreement "%s": %s -> %s is %s', (raw, from, to, reason) => {
    expect(verdict(raw, edit(raw, 'agreement', from, to))).toBe(reason);
  });

  it.each([
    ['The dog wagged its tail.', 'its', "it's", 'changes_word'],
    ['some one came over', 'some one', 'someone', 'changes_word'],
    ['the dogs bowl', 'dogs', "dog's", 'changes_word'],
    ['She ate 1,000 peas.', '1,000', '1.000', 'changes_number'],
    ['We left at 3:30 today.', '3:30', '3.30', 'changes_number'],
    ['She did it! Wow.', 'it!', 'it.', 'changes_sentence_type'],
    ['she walked home', 'home', 'home?', 'changes_sentence_type'],
    ['she walked home', 'home', 'home!', 'changes_sentence_type'],
    ['Is it raining? Yes.', 'raining?', 'raining.', 'changes_sentence_type'],
    ['she said yes', 'said yes', 'said "yes"', 'changes_quotes'],
    ['She walked to Paris.', 'Paris', 'paris', 'case_change_not_allowed'],
    ['she loves her iPad', 'iPad', 'IPad', 'case_change_not_allowed'],
    ['She said OK.', 'OK', 'Ok', 'case_change_not_allowed'],
    ['I said hi', 'I', 'i', 'case_change_not_allowed'],
  ])('punctuation "%s": %s -> %s is %s', (raw, from, to, reason) => {
    expect(verdict(raw, edit(raw, 'punctuation', from, to))).toBe(reason);
  });

  it('a capital may not land mid-sentence ("will" -> "Will" makes a name)', () => {
    expect(verdict('I will go.', edit('I will go.', 'punctuation', 'will', 'Will'))).toBe('case_change_not_sentence_start');
    expect(verdict('we may go in march', edit('we may go in march', 'punctuation', 'march', 'March'))).toBe('case_change_not_sentence_start');
  });

  it('cannot slip an apostrophe into a word through a partial span', () => {
    const raw = 'were tired';
    const e: Edit = { type: 'punctuation', start: 1, end: 2, original: 'e', replacement: "'e", source: 'model' };
    expect(verdict(raw, e)).toBe('changes_word');
  });

  it('a removal may not cut a word in half', () => {
    const raw = 'she has as much';
    const e: Edit = { type: 'repeat', start: 5, end: 7, original: 'as', replacement: '', source: 'model' };
    expect(checkEdit(e, ctx(raw))).toBe('splits_word');
    const p: Edit = { type: 'paragraph', start: 7, end: 7, original: '', replacement: '\n\n', source: 'model' };
    expect(checkEdit(p, ctx('she walked home'))).toBe('splits_word');
  });

  it('a removal may drop punctuation but never add any', () => {
    const raw = 'she um walked';
    expect(verdict(raw, edit(raw, 'filler', ' um', '.'))).toBe('removal_adds_punctuation');
  });

  it('no substitution may add a word that was not in its span, function words included', () => {
    const raw = 'she walked';
    const e: Edit = { type: 'paragraph', start: 3, end: 4, original: ' ', replacement: ' did not ', source: 'model' };
    expect(verdict(raw, e)).toBe('paragraph_not_whitespace');
    const f: Edit = { type: 'filler', start: 3, end: 4, original: ' ', replacement: ' not ', source: 'model' };
    expect(verdict(raw, f)).toBe('removal_only');
    const g: Edit = { type: 'punctuation', start: 3, end: 4, original: ' ', replacement: ' ', source: 'model' };
    expect(verdict(raw, g)).toBeNull();
  });
});

describe('meaning guards: names and pronouns only through the dictionary', () => {
  it.each([
    ['he hugged her', 'her', 'Asha'],
    ['she ran to him', 'him', 'Asha'],
    ['then Mama came', 'Mama', 'Mira'],
    ['then Nani came', 'Nani', 'Asha'],
    ['Ashu laughed', 'Ashu', 'Asha'],
    ['two of them', 'two', 'Asha'],
    ['not now', 'not', 'Asha'],
  ])('"%s": %s -> %s is refused', (raw, from, to) => {
    expect(verdict(raw, edit(raw, 'stt_fix', from, to))).toBe('stt_fix_protected_word');
  });

  it('refuses a name that does not sound like the term', () => {
    expect(verdict('Then Ashok ran.', edit('Then Ashok ran.', 'stt_fix', 'Ashok', 'Asha'))).toBe('stt_fix_not_heard_as');
    expect(verdict('Then Arya ran.', edit('Then Arya ran.', 'stt_fix', 'Arya', 'Asha'))).toBe('stt_fix_not_heard_as');
    expect(verdict('Then Maya ran.', edit('Then Maya ran.', 'stt_fix', 'Maya', 'Mira'))).toBe('stt_fix_not_heard_as');
    // an ordinary word is taken as said unless the parent taught the mishearing
    expect(verdict('see the moon', edit('see the moon', 'stt_fix', 'moon', 'Mumma'))).toBe('stt_fix_not_heard_as');
    expect(verdict('the mirror said hi', edit('the mirror said hi', 'stt_fix', 'mirror', 'Mira'))).toBe('stt_fix_not_heard_as');
    // a capital that only marks a sentence start says nothing about a name
    expect(verdict('Usher ran to me', edit('Usher ran to me', 'stt_fix', 'Usher', 'Asha'))).toBe('stt_fix_not_heard_as');
  });

  it('accepts learned mishearings, case variants, and close sounds', () => {
    expect(verdict('Asia laughed', edit('Asia laughed', 'stt_fix', 'Asia', 'Asha'))).toBeNull();
    expect(verdict('mama laughed', edit('mama laughed', 'stt_fix', 'mama', 'Mumma'))).toBeNull(); // taught by the parent
    expect(verdict('then asha laughed', edit('then asha laughed', 'stt_fix', 'asha', 'Asha'))).toBeNull();
    expect(verdict('Then Usher ran', edit('Then Usher ran', 'stt_fix', 'Usher', 'Asha'))).toBeNull();
    expect(verdict('then Mira said hi', edit('then Mira said hi', 'stt_fix', 'Mira', 'Mira'))).toBeNull();
  });
});

describe('meaning guards: removals remove only what was not meant', () => {
  it.each([
    ['No no no, very very tired.', ' very', 'repeat_is_emphasis'],
    ['bye bye Mumma', ' bye', 'repeat_is_emphasis'],
    ['Come on, come on, you can do it.', ', come on', 'repeat_is_emphasis'],
    ['Well done, well done.', ', well done', 'repeat_is_emphasis'],
    ['I am not not going.', ' not', 'removes_negation'],
    ['No, no, stop.', ', no', 'removes_negation'],
  ])('repeat in "%s" removing "%s" is %s', (raw, original, reason) => {
    expect(verdict(raw, edit(raw, 'repeat', original, ''))).toBe(reason);
  });

  it.each([
    ['I love you, I love you.', 'I love you, ', 'false_start_complete_phrase'],
    ['She was tired, she was tired.', 'She was tired, ', 'false_start_complete_phrase'],
    ['she was, she is so happy', 'she was, ', 'false_start_not_repeated'],
    ['I was tired, she was so happy.', 'I was tired, ', 'false_start_not_repeated'],
    ['Not, not now please', 'Not, ', 'removes_negation'],
    ['Really? really, she did that', 'Really? ', 'changes_sentence_type'],
  ])('false start in "%s" removing "%s" is %s', (raw, original, reason) => {
    expect(verdict(raw, edit(raw, 'false_start', original, ''))).toBe(reason);
  });
});

describe('legitimate repairs are still accepted', () => {
  it.each([
    ['She have two teeth.', 'have', 'has'],
    ['They is here.', 'is', 'are'],
    ['I is here.', 'is', 'am'],
    ['She were tired.', 'were', 'was'],
    ['She do it.', 'do', 'does'],
    ["She don't want it.", "don't", "doesn't"],
    ["They isn't here.", "isn't", "aren't"],
    ['She go out.', 'go', 'goes'],
    ['She walk to me.', 'walk', 'walks'],
    ['She watch the birds.', 'watch', 'watches'],
    ['She carry the bag.', 'carry', 'carries'],
    ['We saw two dog.', 'dog', 'dogs'],
    ['She got a apple.', 'a', 'an'],
  ])('agreement "%s": %s -> %s', (raw, from, to) => {
    expect(verdict(raw, edit(raw, 'agreement', from, to))).toBeNull();
  });

  it('fillers, including a filler said as its own sentence', () => {
    const out = faithfulClean('So um, she uh walked to the door. Hmm.', { level: 'clean', dictionary: DICT });
    expect(out.text).toBe('So she walked to the door.');
    expect(out.rejected).toEqual([]);
  });

  it('real false starts, with fillers between and with a negation inside the phrase', () => {
    for (const [raw, original] of [
      ['she was, she was so happy', 'she was, '],
      ['she was, um, she was so happy', 'she was, um, '],
      ["I can't, I can't find it", "I can't, "],
      ['we went to the, we went to the park', 'we went to the, '],
    ]) {
      expect(checkEdit(edit(raw, 'false_start', original, ''), ctx(raw)), raw).toBeNull();
    }
  });

  it('accidental repeats of function words and restarts', () => {
    for (const [raw, original] of [
      ['She was was happy.', ' was'],
      ['the the dog', ' the'],
      ['it was like a like a little hiccup', ' like a'],
      ['she is she is', ' she is'],
    ]) {
      expect(verdict(raw, edit(raw, 'repeat', original, '')), raw).toBeNull();
    }
  });

  it('punctuation added where none was, sentence case, and "i" -> "I"', () => {
    expect(verdict('she walked home', edit('she walked home', 'punctuation', 'home', 'home.'))).toBeNull();
    expect(verdict('she walked,', edit('she walked,', 'punctuation', ',', '.'))).toBeNull();
    expect(verdict('she walked today it was amazing', edit('she walked today it was amazing', 'punctuation', 'today it', 'today. It'))).toBeNull();
    expect(verdict('so i can', edit('so i can', 'punctuation', 'i', 'I'))).toBeNull();
    expect(verdict("then i'm off", edit("then i'm off", 'punctuation', 'i', 'I'))).toBeNull();
    // merging two sentences lowers a capital that was only positional
    expect(verdict('She walked. Then she ran', edit('She walked. Then she ran', 'punctuation', 'walked. Then', 'walked, then'))).toBeNull();
    // curly to straight apostrophe is the same word
    expect(verdict('it’s fine', edit('it’s fine', 'punctuation', 'it’s', "it's"))).toBeNull();
  });

  it('sentence case lands on the first word that survives a filler or a false start', async () => {
    const run = async (raw: string, reply: object) => {
      const model: ModelCall = async () => JSON.stringify(reply);
      return cleanWithProviders({ raw, level: 'clean', dictionary: DICT }, [new RulePunctuationProvider(), new JsonModelEditProvider(model)]);
    };
    const a = await run('um so we went to the park', { edits: [] });
    expect(a.text).toBe('So we went to the park.');
    const b = await run('she was, she was so happy', { edits: [{ type: 'false_start', original: 'she was, ', replacement: '' }] });
    expect(b.text).toBe('She was so happy.');
    expect(b.rejected).toEqual([]);
  });

  it('a capital that relied on a refused removal is refused too', () => {
    const raw = 'very very tired';
    const removal = edit(raw, 'repeat', 'very ', ''); // emphasis: refused
    const cap: Edit = { type: 'punctuation', start: 5, end: 6, original: 'v', replacement: 'V', source: 'model' };
    const r = verifyEdits([removal, cap], ctx(raw));
    expect(r.accepted).toEqual([]);
    expect(r.rejected.map((x) => x.reason).sort()).toEqual(['case_change_not_sentence_start', 'repeat_is_emphasis']);
  });
});

describe('end to end: a hostile model changes nothing the rules would not', () => {
  it('every 7.1 attack in one reply leaves the rules-only text untouched', async () => {
    const raw = 'I can come and she is happy. She loves Daddy. We were tired. You did it. I am not sad today, I am not';
    const reply = {
      edits: [
        { type: 'agreement', original: 'can', replacement: 'cannot' },
        { type: 'agreement', original: 'is', replacement: 'was' },
        { type: 'agreement', original: 'loves', replacement: 'loved' },
        { type: 'stt_fix', original: 'Daddy', replacement: 'Asha' },
        { type: 'punctuation', original: 'were', replacement: "we're" },
        { type: 'punctuation', original: 'did it.', replacement: 'did it?' },
        { type: 'false_start', original: 'not sad', occurrence: 1, replacement: '' },
      ],
    };
    const model: ModelCall = async () => JSON.stringify(reply);
    const rules = await cleanWithProviders({ raw, level: 'clean', dictionary: DICT }, [new RulePunctuationProvider()]);
    const both = await cleanWithProviders({ raw, level: 'clean', dictionary: DICT }, [
      new RulePunctuationProvider(),
      new JsonModelEditProvider(model),
    ]);
    expect(both.text).toBe(rules.text);
    expect(both.applied.filter((e) => e.source === 'model')).toEqual([]);
  });
});
