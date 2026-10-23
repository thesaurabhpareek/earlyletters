/**
 * Engine 6 building blocks (WP-F06-02, WP-F06-03): the version rule, the
 * commonWords pack table, the F07 save check, and the helpers the R-01
 * guards rest on. The end-to-end R-01 cases live in test/regression/ and the
 * property in verify.r01.fuzz.test.ts.
 *
 * The constitution: the machine may remove and repair. It may never add meaning.
 * Fictional family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkHeardAs,
  compileRules,
  ENGINE_VERSION,
  ENGLISH_PACK,
  ENGLISH_RULES,
  faithfulClean,
  hyphenCompounds,
  hyphenJoined,
  LANG_ENGINE_VERSION,
  normalizeChars,
  quotedSpans,
  replaceKeepingNumbers,
  validatePack,
  verifyEdits,
  type DictionaryTerm,
  type Edit,
  type TextRulesPack,
} from '../src';

const DIR = join(__dirname, '../../../packs/text-rules');
const loadPack = (l: string) => JSON.parse(readFileSync(join(DIR, `${l}.json`), 'utf8')) as TextRulesPack;

function edit(raw: string, type: Edit['type'], original: string, replacement: string, nth = 0): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  return { type, start, end: start + original.length, original, replacement, source: 'model' };
}
const verdict = (raw: string, e: Edit, dictionary: DictionaryTerm[] = []) => {
  const r = verifyEdits([e], { raw, level: 'clean', dictionary, protectedSpans: [] });
  return r.accepted.length ? null : r.rejected[0].reason;
};

describe('[F06-REQ-018] the engine version moves with every behaviour change', () => {
  it('ENGINE_VERSION is 6 and pipeline.ts has a dated changelog line for it', () => {
    expect(ENGINE_VERSION).toBe(6);
    const src = readFileSync(join(__dirname, '../src/pipeline.ts'), 'utf8');
    expect(src).toMatch(new RegExp(`^// ${ENGINE_VERSION} \\(\\d{4}-\\d{2}-\\d{2}\\):`, 'm'));
    expect(src).not.toMatch(/Pending \d/);
  });

  it('a golden file is recorded for this version (CORE-08)', () => {
    expect(() => readFileSync(join(__dirname, `golden/engine-v${ENGINE_VERSION}.json`), 'utf8')).not.toThrow();
  });
});

describe('[F06-REQ-008] meaning.commonWords: a protective pack table (LANG_ENGINE_VERSION 2)', () => {
  it('the bundled English pack carries it, declares engine 2, and stays valid', () => {
    expect(LANG_ENGINE_VERSION).toBe(2);
    expect(ENGLISH_PACK.engine).toBe(2);
    expect(ENGLISH_PACK.meaning.commonWords).toEqual(expect.arrayContaining(['hope', 'will', 'joy', 'grace', 'rose', 'june', 'faith']));
    expect(validatePack(JSON.parse(JSON.stringify(ENGLISH_PACK))).ok).toBe(true);
    expect(ENGLISH_RULES.isCommonWord('Hope')).toBe(true);
    expect(ENGLISH_RULES.isEverydayWord('will')).toBe(true); // a modal, and a common word
    expect(ENGLISH_RULES.isEverydayWord('asha')).toBe(false);
  });

  it('every shipped pack without the table still validates (it is optional)', () => {
    for (const l of ['es', 'fr', 'pt', 'hi', 'ar', 'zh']) expect(validatePack(loadPack(l)).ok, l).toBe(true);
  });

  it('a pack with the table must say engine 2, and its words follow the word-table rules', () => {
    const p = loadPack('es');
    p.meaning.commonWords = ['luz'];
    expect(validatePack(p)).toEqual({ ok: false, errors: ['$.meaning.commonWords: needs_engine_2'] });
    p.engine = 2;
    expect(validatePack(p).ok).toBe(true);
    p.meaning.commonWords = ['Luz'];
    expect(validatePack(p).ok).toBe(false);
  });

  it('is protective, so a draft table already guards (ADR 0014): only refuses more', () => {
    const p = loadPack('es');
    p.engine = 2;
    p.meaning.commonWords = ['luz'];
    expect(p.meaning.review.status).toBe('draft');
    expect(compileRules('es', p).isCommonWord('luz')).toBe(true);
  });
});

describe('[F06-REQ-010] "mm" is offered in Review, never removed by the engine (D-112, 23 Oct 2026)', () => {
  it('the English pack lists "mm" under suggest, not auto', () => {
    expect(ENGLISH_PACK.fillers.auto).not.toContain('mm');
    expect(ENGLISH_PACK.fillers.suggest).toEqual(['mm']);
  });

  it('"Did she sleep? Mm. She did." keeps its answer; the rules offer it; a model may not take it', () => {
    const raw = 'Did she sleep? Mm. She did.';
    const r = faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en' });
    expect(r.text).toBe(raw);
    expect(r.applied).toEqual([]);
    expect(r.suggestions.filter((s) => s.type === 'filler').map((s) => s.original.trim())).toEqual(['Mm.']);
    expect(verdict(raw, edit(raw, 'filler', 'Mm. ', ''))).toBe('not_a_filler');
  });
});

describe('[F06-REQ-008] commonWords after D-112: names rarely meant as the everyday word are not in the seed', () => {
  it('mason, carter, cooper, hunter and rowan are out; hope, will and may stay', () => {
    const words = ENGLISH_PACK.meaning.commonWords ?? [];
    for (const w of ['mason', 'carter', 'cooper', 'hunter', 'rowan']) expect(words, w).not.toContain(w);
    for (const w of ['hope', 'will', 'joy']) expect(words, w).toContain(w); // "may" is guarded as a modal, not here
    expect(words).toHaveLength(135);
  });
});

describe('[F06-REQ-006] quotation marks are compared in order, and an end mark is never doubled (#179 tests-lens review, 23 Oct 2026)', () => {
  it('a swap of one quotation mark for another is refused as changes_quotes (U+201C to U+00AB)', () => {
    const raw = 'She said “bau” today.';
    expect(verdict(raw, edit(raw, 'punctuation', '“bau”', '«bau»'))).toBe('changes_quotes');
    expect(verdict(raw, edit(raw, 'punctuation', '“bau”', '"bau"'))).toBe('changes_quotes'); // straightening is the house rule's, never an edit
    expect(verdict(raw, edit(raw, 'punctuation', 'today', 'today,'))).toBeNull(); // a comma elsewhere is still fine
  });

  it('a repair may not leave a doubled end mark the raw did not have ("no." to "no..")', () => {
    const raw = 'She said no.';
    expect(verdict(raw, edit(raw, 'punctuation', 'no.', 'no..'))).toBe('changes_sentence_type');
    const said = 'She said no';
    expect(verdict(said, edit(said, 'punctuation', 'no', 'no.'))).toBeNull(); // one end mark where there was none
    const dots = 'She said no...';
    expect(verdict(dots, edit(dots, 'punctuation', 'no...', 'no....'))).toBeNull(); // a run already said may stay
  });
});

describe('[F06-REQ-014] a kept filler pair leaves a capital positional for the name-signal test (#179 review N1)', () => {
  const dict: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: [] }];

  it('"uh uh Asho came over today.": Asho to Asha is refused, as engine 5 refused it', () => {
    const raw = 'uh uh Asho came over today.';
    expect(verdict(raw, edit(raw, 'stt_fix', 'Asho', 'Asha'), dict)).toBe('stt_fix_not_heard_as');
  });

  it('after a removed filler the capital is positional too: "um Asho came over today."', () => {
    const raw = 'um Asho came over today.';
    expect(verdict(raw, edit(raw, 'stt_fix', 'Asho', 'Asha'), dict)).toBe('stt_fix_not_heard_as');
  });

  it('mid-sentence the capital is a signal: "Then Asho came over today." is accepted', () => {
    const raw = 'Then Asho came over today.';
    expect(verdict(raw, edit(raw, 'stt_fix', 'Asho', 'Asha'), dict)).toBeNull();
  });
});

describe('[F06-REQ-014] F07 save check for a taught heard-as (F07-REQ-012, F07 7.2 rule 5)', () => {
  const dict: DictionaryTerm[] = [
    { term: 'Asha', kind: 'child', heardAs: ['Usher'] },
    { term: 'Usha', kind: 'family', heardAs: ['Oosha'] },
    { term: 'Mumma', kind: 'family', heardAs: [] },
  ];
  const R = ENGLISH_RULES;
  it.each([
    ['Usher', 'ok'],
    ['Usha', 'collides_with_other_term'],
    ['oosha', 'collides_with_other_term'],
    ['Usha ji', 'collides_with_other_term'],
    ['no', 'carries_meaning'],
    ['ten', 'carries_meaning'],
    ['may', 'carries_meaning'],
    ['her', 'carries_meaning'],
    ['mama', 'kinship_not_for_this_kind'],
    ['hope', 'offer_only'],
    ['  ', 'carries_meaning'],
  ] as const)('heard-as "%s" for the child Asha: %s', (heard, want) => {
    expect(checkHeardAs(dict[0], heard, dict, R)).toBe(want);
  });

  it('a kinship word may be taught to a family term ("mama" for Mumma)', () => {
    expect(checkHeardAs(dict[2], 'mama', dict, R)).toBe('ok');
  });
});

describe('[F06-REQ-005] hyphenated words are one word', () => {
  it('hyphenJoined sees a hyphen on either side of a word, never a dash', () => {
    const s = 'Uh-uh, she said so-so — then mm\u2011hmm.';
    const at = (w: string, nth = 0) => {
      let i = -1;
      for (let k = 0; k <= nth; k++) i = s.indexOf(w, i + 1);
      return [i, i + w.length] as const;
    };
    expect(hyphenJoined(s, ...at('Uh'))).toBe(true);
    expect(hyphenJoined(s, ...at('uh'))).toBe(true);
    expect(hyphenJoined(s, ...at('so', 1))).toBe(true);
    expect(hyphenJoined(s, ...at('then'))).toBe(false); // an em dash is not a joiner
    expect(hyphenJoined(s, ...at('hmm'))).toBe(true); // U+2011 non-breaking hyphen
    expect(hyphenCompounds(s)).toEqual(['uh-uh', 'so-so', 'mm\u2011hmm']);
  });

  it('no punctuation or whitespace edit splits or makes one (found by the F06-REQ-021 property test)', () => {
    const raw = 'Hmm, uh-oh, the soup was so-so and uh uh.';
    expect(verdict(raw, { ...edit(raw, 'paragraph', '', ''), start: 8, end: 8, original: '', replacement: ' ' })).toBe('changes_word');
    expect(verdict(raw, edit(raw, 'punctuation', 'so-so', 'so so'))).toBe('changes_word');
    expect(verdict(raw, edit(raw, 'punctuation', 'uh uh', 'uh-uh'))).toBe('changes_word');
    expect(verdict(raw, edit(raw, 'punctuation', 'uh-oh', 'Uh-oh'))).toBe('case_change_not_sentence_start'); // the hyphen guard allows a case change
  });

  it('a capital on a kept filler is checked as said: "Uh uh" never becomes "Uh Uh" (property test finding)', () => {
    const raw = 'We saw the moon. Uh uh, not now.';
    expect(verdict(raw, edit(raw, 'punctuation', 'u', 'U', 0))).toBe('case_change_not_sentence_start');
    const raw2 = 'um she walked.'; // the rules remove "um", so "She" starts the sentence (RulePunctuationProvider contract)
    expect(verdict(raw2, edit(raw2, 'punctuation', 's', 'S'))).toBeNull();
  });
});

describe('[F06-REQ-016] the house character rule never changes a number or drops an invisible character', () => {
  it('replaceKeepingNumbers keeps a match that would join or split a number', () => {
    expect(replaceKeepingNumbers('slept 2 ,3 hours', /\s+,/g, ',')).toBe('slept 2 ,3 hours');
    expect(replaceKeepingNumbers('she , laughed', /\s+,/g, ',')).toBe('she, laughed');
    expect(replaceKeepingNumbers('2, .5 and a, .', /,\s*([.!?])/g, '$1')).toBe('2, .5 and a.');
  });

  it('normalizeChars: ranges stay ranges, numbers stay numbers, U+FEFF stays', () => {
    expect(normalizeChars('She slept 2 – 3 hours.')).toBe('She slept 2 - 3 hours.');
    expect(normalizeChars('She slept 2 ,3 hours.')).toBe('She slept 2 ,3 hours.');
    expect(normalizeChars('Asha nodded\uFEFF, and smiled')).toBe('Asha nodded\uFEFF, and smiled');
    expect(normalizeChars('I love you — always.')).toBe('I love you, always.'); // unchanged house rule
  });

  it('normalizeChars keeps a soft hyphen (U+00AD) as it keeps U+FEFF: the house rule drops no invisible character (#179 review N3)', () => {
    expect(normalizeChars('Asha­s duck, 2 to 3 hours.')).toBe('Asha­s duck, 2 to 3 hours.');
    expect(normalizeChars('up­—down')).toBe('up­, down');
  });

  it('quotedSpans: U+FEFF before a closing quote does not open the quote to edits (property test finding)', () => {
    const raw = 'Asha said ‘um, up\uFEFF’ and laughed.';
    const at = raw.indexOf('‘');
    expect(quotedSpans(raw)).toContainEqual({ start: at, end: raw.indexOf('’') + 1 });
  });
});
