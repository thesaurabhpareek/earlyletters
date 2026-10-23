/**
 * Engine 6 building blocks (WP-F06-02, WP-F06-03): the version rule, the
 * commonWords pack table, the F07 save check, and the helpers the R-01
 * guards rest on. The end-to-end R-01 cases live in test/regression/ and the
 * property in verify.r01.fuzz.test.ts. Engine 7 (the #179 follow-up on end
 * marks and the verifier's windows) is pinned at the end of this file.
 *
 * The constitution: the machine may remove and repair. It may never add meaning.
 * Fictional family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  checkEdit,
  checkHeardAs,
  cleanRulesOnly,
  compileRules,
  ENGINE_VERSION,
  ENGLISH_PACK,
  ENGLISH_RULES,
  faithfulClean,
  hyphenCompounds,
  hyphenJoined,
  LANG_ENGINE_VERSION,
  normalizeChars,
  punctuationEdits,
  quotedSpans,
  replaceKeepingNumbers,
  validatePack,
  verifyEdits,
  type DictionaryTerm,
  type Edit,
  type LanguageRules,
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
  it('ENGINE_VERSION is 7 and pipeline.ts has a dated changelog line for it', () => {
    expect(ENGINE_VERSION).toBe(7);
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
    // A run already said stays as said and never grows (engine 7, #179 follow-up); an edit beside it that adds no mark is fine.
    expect(verdict(dots, edit(dots, 'punctuation', 'no...', 'no....'))).toBe('changes_sentence_type');
    expect(verdict(dots, edit(dots, 'punctuation', 'said', 'said,'))).toBeNull();
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

  it('[F06-REQ-014] "mm Asho came over today.": a name fix after an offered filler is positional too (#179 re-check N5)', () => {
    const raw = 'mm Asho came over today.';
    expect(verdict(raw, edit(raw, 'stt_fix', 'Asho', 'Asha'), dict)).toBe('stt_fix_not_heard_as');
    const comma = 'Mm, Asho came over today.';
    expect(verdict(comma, edit(comma, 'stt_fix', 'Asho', 'Asha'), dict)).toBe('stt_fix_not_heard_as');
  });
});

describe('[F06-REQ-010] a repeat or false start made only of filler sounds is refused (#179 re-check N6)', () => {
  it('[F06-REQ-010] "mm mm Asho said no." keeps both sounds: a repeat or false start may not take one "mm" (#179 re-check N6)', () => {
    const raw = 'mm mm Asho said no.';
    expect(verdict(raw, edit(raw, 'repeat', 'mm ', ''))).toBe('repeat_is_emphasis');
    expect(verdict(raw, edit(raw, 'false_start', 'mm ', ''))).toBe('false_start_complete_phrase');
    expect(verdict(raw, edit(raw, 'filler', 'mm ', ''))).toBe('not_a_filler'); // the filler label refuses it already
    const um = 'um um so we went';
    expect(verdict(um, edit(um, 'repeat', 'um ', ''))).toBe('repeat_is_emphasis'); // auto fillers too
    const restart = 'she was, um, she was so happy';
    expect(verdict(restart, edit(restart, 'false_start', 'she was, um, ', ''))).toBeNull(); // a filler inside a real restart goes with it
    const r = faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en', modelEdits: [edit(raw, 'repeat', 'mm ', ''), edit(raw, 'false_start', 'mm ', '')] });
    expect(r.text).toBe(raw);
  });
});

describe('[F06-REQ-006] an end mark put next to one already said (#179 re-check, Note D)', () => {
  it('[F06-REQ-006] "She said no." plus an inserted "." is refused like "no." to "no.." (#179 re-check Note D)', () => {
    const raw = 'She said no.';
    const insert: Edit = { type: 'punctuation', start: raw.length, end: raw.length, original: '', replacement: '.', source: 'model' };
    expect(verdict(raw, insert)).toBe('changes_sentence_type');
    expect(faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en', modelEdits: [insert] }).text).toBe(raw);
    const open = 'She said no';
    const period: Edit = { type: 'punctuation', start: open.length, end: open.length, original: '', replacement: '.', source: 'model' };
    expect(verdict(open, period)).toBeNull(); // the honest repair: one end mark where there was none
    const dots = 'She said no...';
    const more: Edit = { type: 'punctuation', start: dots.length, end: dots.length, original: '', replacement: '.', source: 'model' };
    expect(verdict(dots, more)).toBe('changes_sentence_type'); // a run already said never grows (engine 7, #179 follow-up)
    expect(faithfulClean(dots, { level: 'clean', dictionary: [], language: 'en', modelEdits: [more] }).text).toBe(dots);
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

/* ---------- engine 7: the #179 follow-up (23 Oct 2026) ---------- */

const HI = compileRules('hi', loadPack('hi'));
const ZH = compileRules('zh', loadPack('zh'));
const AR = compileRules('ar', loadPack('ar'));
const at = (pos: number, replacement: string, original = ''): Edit => ({
  type: 'punctuation',
  start: pos,
  end: pos + original.length,
  original,
  replacement,
  source: 'model',
});
const atEnd = (raw: string, replacement: string) => at(raw.length, replacement);
/** One edit's verdict from verifyEdits, which checks it in context too; checkEdit alone (used for Review's offers) must agree. */
const verdictIn = (rules: LanguageRules, raw: string, e: Edit) => {
  const ctx = { raw, level: 'clean' as const, dictionary: [], protectedSpans: [], rules };
  const r = verifyEdits([e], ctx);
  const reason = r.accepted.length ? null : r.rejected[0].reason;
  expect(checkEdit(e, ctx), 'checkEdit agrees with verifyEdits on one edit').toBe(reason);
  return reason;
};
const v7 = (raw: string, e: Edit) => verdictIn(ENGLISH_RULES, raw, e);

describe('[F06-REQ-004] engine 7: no end mark next to one already said, whichever mark it is (#179 re-check Note E)', () => {
  it.each([
    ['en', 'Asha slept. Was there more?', '.'],
    ['en', 'Asha laughed. You did it!', '.'],
    ['en', 'Did she sleep?', '?'],
    ['en', 'She said no.', '!'],
    ['en', 'Wow!!', '.'],
    ['en', 'Asha waited\u2026', '.'],
    ['hi', 'आशा आज बहुत हँसी।', '.'],
    ['hi', 'आशा आज बहुत हँसी।', '।'],
    ['hi', 'आशा आज बहुत हँसी॥', '.'],
    ['zh', '她睡了。', '.'],
    ['zh', '她睡了？', '.'],
    ['zh', '她睡了！', '.'],
    ['zh', '她睡了。', '。'],
    ['ar', 'آشا نامت؟', '.'],
  ] as const)('%s "%s" plus "%s" is refused; the text keeps the mark that was said', (lang, raw, mark) => {
    const rules = lang === 'hi' ? HI : lang === 'zh' ? ZH : lang === 'ar' ? AR : ENGLISH_RULES;
    const e = atEnd(raw, mark);
    expect(verdictIn(rules, raw, e)).toBe('changes_sentence_type');
    expect(faithfulClean(raw, { level: 'clean', dictionary: [], rules, modelEdits: [e] }).text).toBe(rules.normalizeFinal(raw));
  });

  it('a "." put before the mark, or the mark replaced by itself plus another, is the same pair and is refused', () => {
    const raw = 'Was there more?';
    const q = raw.indexOf('?');
    expect(v7(raw, at(q, '.'))).toBe('changes_sentence_type'); // "more.?"
    expect(v7(raw, at(q, '?.', '?'))).toBe('changes_sentence_type'); // "more?."
    expect(v7(raw, edit(raw, 'punctuation', 'more?', 'more?.'))).toBe('changes_sentence_type');
  });

  it('a mark behind spaces, closing quotes or an invisible character still touches', () => {
    for (const raw of ['She said "no?"', 'She said \u201Cno.\u201D', 'She said no.\u200B', 'Was there more? ']) {
      expect(v7(raw, atEnd(raw, '.')), raw).toBe('changes_sentence_type');
    }
    const hi = 'आशा ने कहा "हाँ।"';
    expect(verdictIn(HI, hi, atEnd(hi, '।'))).toBe('changes_sentence_type');
  });

  it('a mark inside brackets ends the bracketed words only: the sentence around them takes its own (#249 review F1, N1)', () => {
    for (const raw of ['She said (no!)', 'We went home (it rained!)', 'We went home (it was late.)']) {
      expect(v7(raw, atEnd(raw, '.')), raw).toBeNull();
    }
  });

  it('negative cases: one end mark where none was, after a word, is still accepted', () => {
    expect(v7('Was there more', atEnd('Was there more', '.'))).toBeNull();
    expect(verdictIn(HI, 'आशा आज बहुत हँसी', atEnd('आशा आज बहुत हँसी', '।'))).toBeNull();
    expect(verdictIn(ZH, '她睡了', atEnd('她睡了', '。'))).toBeNull();
    expect(v7('Was there more? Asha slept', atEnd('Was there more? Asha slept', '.'))).toBeNull(); // a word stands between
    const raw = 'Asha slept. was there more?';
    expect(v7(raw, edit(raw, 'punctuation', 'w', 'W'))).toBeNull(); // a capital after a mark adds none
  });

  it("removing the extra mark of a doubled pair is a fair punctuation edit; the mark that stands is the speaker's", () => {
    // The recogniser wrote both marks here; the "?" (or ？, ।) the speaker said is what survives.
    const en = 'Was there more?.';
    expect(v7(en, edit(en, 'punctuation', '?.', '?'))).toBeNull();
    expect(faithfulClean(en, { level: 'clean', dictionary: [], language: 'en', modelEdits: [edit(en, 'punctuation', '?.', '?')] }).text).toBe('Was there more?');
    expect(v7(en, edit(en, 'punctuation', '?.', '.'))).toBe('changes_sentence_type'); // the "?" may never go
    const zh = '她睡了？.';
    expect(verdictIn(ZH, zh, edit(zh, 'punctuation', '？.', '？'))).toBeNull();
    expect(verdictIn(ZH, zh, edit(zh, 'punctuation', '？.', '.'))).toBe('changes_sentence_type');
    const hi = 'आशा हँसी।.';
    expect(verdictIn(HI, hi, edit(hi, 'punctuation', '।.', '।'))).toBeNull();
  });

  it.each([
    ['hi', 'आशा हँसी।.', '।'],
    ['zh', '她睡了。.', '。'],
    ['en', 'Asha waited\u2026.', '\u2026'],
    ['en', 'Asha slept\u3002.', '\u3002'],
  ] as const)('%s "%s": only the later mark of a touching pair may go; the first, "%s", stands (#249 review N2)', (lang, raw, said) => {
    const rules = lang === 'hi' ? HI : lang === 'zh' ? ZH : ENGLISH_RULES;
    const pair = `${said}.`;
    const at0 = raw.indexOf(pair);
    // The later mark: alone, or with the pair in the span.
    expect(verdictIn(rules, raw, at(at0 + said.length, '', '.'))).toBeNull();
    expect(verdictIn(rules, raw, edit(raw, 'punctuation', pair, said))).toBeNull();
    // The first mark: removed, or swapped for the later one.
    expect(verdictIn(rules, raw, at(at0, '', said))).toBe('changes_sentence_type');
    expect(verdictIn(rules, raw, edit(raw, 'punctuation', pair, '.'))).toBe('changes_sentence_type');
    expect(verdictIn(rules, raw, edit(raw, 'punctuation', pair, '..'))).toBe('changes_sentence_type');
  });

  it('a "?" or "!" said first stands too, held by the mood check as well, and so does each "!" of "!!"', () => {
    const raw = 'Was there more?. It was.';
    expect(v7(raw, at(raw.indexOf('.'), '', '.'))).toBeNull();
    expect(v7(raw, at(raw.indexOf('?'), '', '?'))).toBe('changes_sentence_type');
    expect(v7('Wow!!', at(4, '', '!'))).toBe('changes_sentence_type'); // every "!" is the speaker's mood, the later one too
  });
});

describe("[F06-REQ-006] engine 7: the verifier's windows at the edges of a letter (#179 follow-up, wordWindow)", () => {
  it('a space or line break deleted between two end marks makes a new pair and is refused, as in engine 6 (#249 review N3)', () => {
    const del = (raw: string, gap: string, type: Edit['type']): Edit => {
      const i = raw.indexOf(`.${gap}.`) + 1;
      return { type, start: i, end: i + gap.length, original: gap, replacement: '', source: 'model' };
    };
    for (const raw of ['She said no. .', 'Asha said no. . Then she slept.']) {
      for (const type of ['punctuation', 'paragraph'] as const) expect(v7(raw, del(raw, ' ', type)), `${raw} ${type}`).toBe('changes_sentence_type');
    }
    const lines = 'She said no.\n\n.';
    expect(v7(lines, del(lines, '\n\n', 'paragraph'))).toBe('changes_sentence_type'); // engine 6 accepted this one
    // Negative: whitespace edits that bring no two marks together.
    expect(v7('She said  no.', { type: 'paragraph', start: 8, end: 10, original: '  ', replacement: ' ', source: 'model' })).toBeNull();
    expect(v7('She said no..', { type: 'paragraph', start: 12, end: 12, original: '', replacement: ' ', source: 'model' })).toBeNull(); // apart, not together
  });

  it('at the start of a letter: a mark put before a run that opens it is refused; a capital there is fine', () => {
    const raw = '...and then Asha slept.';
    expect(v7(raw, at(0, '.'))).toBe('changes_sentence_type');
    expect(v7(raw, edit(raw, 'punctuation', 'a', 'A'))).toBeNull();
    expect(v7('asha slept.', at(0, 'A', 'a'))).toBeNull();
  });

  it('at the end of a letter: the mark two closers away is seen, beyond the old two-character window', () => {
    const raw = 'Asha said "Mumma said \'no.\'"';
    expect(v7(raw, atEnd(raw, '.'))).toBe('changes_sentence_type');
    const open = 'Asha said "Mumma said \'no\'"';
    expect(v7(open, atEnd(open, '.'))).toBeNull();
  });

  it('a run said elsewhere in the sentence never excuses a new pair: "Yes..no." stays, "no." may not become "no.."', () => {
    const raw = 'Yes..no.';
    expect(v7(raw, edit(raw, 'punctuation', 'no.', 'no..'))).toBe('changes_sentence_type');
    expect(v7(raw, atEnd(raw, '.'))).toBe('changes_sentence_type');
    const open = 'Yes..no';
    expect(v7(open, atEnd(open, '.'))).toBeNull(); // one mark where none was; the run before "no" is apart from it
  });

  it.each([
    ['Yes', '.', null],
    ['Yes?', '.', 'changes_sentence_type'],
    ['Yes!', '!', 'changes_sentence_type'],
    ['Yes.', '.', 'changes_sentence_type'],
    ['Yes...', '.', 'changes_sentence_type'],
    ['?', '.', 'changes_sentence_type'],
  ] as const)('a one-word letter "%s" plus "%s": %s', (raw, mark, want) => {
    expect(v7(raw, atEnd(raw, mark))).toBe(want);
  });

  it('a one-word letter keeps its other fair repairs: sentence case, and a filler said as its own sentence', () => {
    expect(v7('yes', at(0, 'Y', 'y'))).toBeNull();
    expect(faithfulClean('Um.', { level: 'clean', dictionary: [], language: 'en' }).text).toBe('');
  });

  it('the word window steps by code point: punctuation cannot split a word written outside the BMP (Adlam)', () => {
    const raw = 'We saw \u{1E900}\u{1E901}\u{1E902} today.';
    expect(v7(raw, at(raw.indexOf('\u{1E901}'), ' '))).toBe('changes_word');
    expect(v7('We saw abc today.', at(8, ' '))).toBe('changes_word'); // the same edit in Latin, refused before and after
    expect(v7(raw, at(raw.indexOf(' today'), ','))).toBeNull(); // a comma after the word is still fine
  });
});

describe('[F06-REQ-015] engine 7: the engine never puts an end mark next to one already said (#179 follow-up)', () => {
  const rulesOnly = (raw: string) => cleanRulesOnly({ raw, dictionary: [], level: 'clean' }, { language: 'en' });

  it.each([
    ['She said no. um', 'She said no.'],
    ['Was there more? um', 'Was there more?'],
    ['You did it! uh', 'You did it!'],
    ['She said "no." um', 'She said "no."'],
    ['Asha waited... um', 'Asha waited...'],
  ])('the rules-only clean of "%s" removes the filler and adds no mark: "%s"', async (raw, want) => {
    const r = await rulesOnly(raw);
    expect(r.text).toBe(want);
    expect(r.applied.map((e) => e.type)).toEqual(['filler']);
    expect(r.rejected.map((x) => `${x.edit.type}:${x.reason}`)).toEqual(['punctuation:changes_sentence_type']);
  });

  it.each([
    ['She said no, um', 'She said no.'],
    ['Asha slept um', 'Asha slept.'],
    ['Was there more? Asha slept', 'Was there more? Asha slept.'],
  ])('negative cases: "%s" still gets its one final mark: "%s"', async (raw, want) => {
    const r = await rulesOnly(raw);
    expect(r.text).toBe(want);
    expect(r.rejected).toEqual([]);
  });

  it("the English provider's edits go the same way through faithfulClean: the removal stands, the \".\" is refused", () => {
    const raw = 'Asha slept. Was there more? um';
    const r = faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en', ruleEdits: punctuationEdits({ raw, dictionary: [], level: 'clean' }) });
    expect(r.text).toBe('Asha slept. Was there more?');
    expect(r.applied.map((e) => [e.type, e.original, e.replacement])).toEqual([['filler', ' um', '']]);
  });

  it('verifyEdits checks the edits together, from a rule or a model: each is fair alone, the pair is not', () => {
    const raw = 'Was there more? um';
    const filler: Edit = { type: 'filler', start: 15, end: 18, original: ' um', replacement: '', source: 'rule' };
    expect(v7(raw, filler)).toBeNull();
    for (const source of ['rule', 'model'] as const) {
      const period: Edit = { ...atEnd(raw, '.'), source };
      expect(v7(raw, period)).toBeNull(); // alone, "um." is a fair final mark
      const r = verifyEdits([filler, period], { raw, level: 'clean', dictionary: [], protectedSpans: [] });
      expect(r.accepted).toEqual([filler]);
      expect(r.rejected).toEqual([{ edit: period, reason: 'changes_sentence_type' }]);
    }
    // Order does not matter: the edit that adds the mark is the one refused.
    const r = verifyEdits([atEnd(raw, '.'), filler], { raw, level: 'clean', dictionary: [], protectedSpans: [] });
    expect(r.accepted).toEqual([filler]);
  });

  it('a removal that would bring two said marks together is refused, whatever its label; the rules take the mark with the filler', () => {
    const raw = 'She said no. um.';
    expect(v7(raw, edit(raw, 'filler', ' um', ''))).toBe('changes_sentence_type'); // "no.."
    expect(v7(raw, edit(raw, 'filler', 'um', ''))).toBe('changes_sentence_type'); // "no. ."
    expect(v7(raw, edit(raw, 'filler', ' um.', ''))).toBeNull();
    expect(faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en' }).text).toBe('She said no.');
  });

  it.each([
    ['Asha waited\u2026 um.', 'Asha waited...'],
    ['She said no.\u200B um.', 'She said no.\u200B'],
  ])('the app path: a filler said as its own sentence after an ellipsis character or an invisible goes with its own end mark: "%s"', (raw, want) => {
    // Engine 6 removed "um" alone and left its "." next to the speaker's mark ("waited....").
    const r = faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en' });
    expect(r.text).toBe(want);
    expect(r.applied.map((e) => [e.type, e.original])).toEqual([['filler', ' um.']]);
  });

  it('negative cases: a filler that is not its own sentence leaves the end mark where it was', () => {
    const app = (raw: string) => faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en' }).text;
    expect(app('She said no, um.')).toBe('She said no.'); // the "." ends the speaker's sentence
    expect(app('She said "no" um.')).toBe('She said "no".'); // no end mark before the quote closes
    expect(app('Asha waited\u2026 um, then slept.')).toBe('Asha waited... then slept.');
    expect(app('She slept. Um. Then she woke.')).toBe('She slept. Then she woke.'); // as in engine 6
  });
});

describe('[F06-REQ-004] engine 7: a removal never changes how a sentence ends (#249 review F1)', () => {
  const app = (raw: string) => faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en' }).text;

  it.each([
    // A mark inside quotes or brackets belongs to those words; the sentence around them is still open.
    ['Did she say "no." um?', 'Did she say "no." um?'],
    ['Did she say "no!" um?', 'Did she say "no!" um?'],
    ['Did you see it (it was huge!) um?', 'Did you see it (it was huge!)?'],
    ['Did you wait\u2026 um?', 'Did you wait... um?'],
    ['We went home (it rained!) um.', 'We went home (it rained!).'],
    ['We went home (it was late.) um.', 'We went home (it was late.).'],
    ['She said (no!) um.', 'She said (no!).'], // engine 6's output, restored
    ['Asha looked up and asked "more?" um. Then she laughed.', 'Asha looked up and asked "more?" um. Then she laughed.'],
    ['She said "no?" um.', 'She said "no?" um.'],
    ['She said \u201Cno.\u201D um.', 'She said "no." um.'],
    ['आशा ने कहा "हाँ।" um.', 'आशा ने कहा "हाँ।" um.'],
    // Already on develop, the same class: the "?" went with the filler.
    ['Did you wait... um?', 'Did you wait... um?'],
    ['Did she say no. um?', 'Did she say no. um?'],
  ])('the app path keeps every "?" and "!" and the end of the sentence around: "%s"', (raw, want) => {
    const text = app(raw);
    expect(text).toBe(want);
    expect(ENGLISH_RULES.moodMarks(text)).toBe(ENGLISH_RULES.moodMarks(raw));
  });

  it.each([
    ['U+E0100 (a variation selector)', '\u{E0100}'],
    ['U+E0001 (a language tag)', '\u{E0001}'],
  ])('an invisible character outside the BMP between two marks still touches: %s (#249 review B-N1)', async (_name, invisible) => {
    const raw = `She said no.${invisible} um`;
    const r = await cleanRulesOnly({ raw, dictionary: [], level: 'clean' }, { language: 'en' });
    expect(r.text).toBe(`She said no.${invisible}`); // the filler goes; no "." is put after the invisible
    expect(v7(`She said no.${invisible}`, atEnd(`She said no.${invisible}`, '.'))).toBe('changes_sentence_type');
  });

  it('the rules-only clean keeps the "." the sentence around a bracket takes (#249 review N1)', async () => {
    const r = await cleanRulesOnly({ raw: 'We went home (it rained!) um', dictionary: [], level: 'clean' }, { language: 'en' });
    expect(r.text).toBe('We went home (it rained!).');
  });

  it('the verifier backstop: no filler, repeat or false start takes a "?" or "!" in any script, from a rule or a model', () => {
    const cases: Array<[string, Edit['type'], string]> = [
      ['Did she say "no." um?', 'filler', ' um?'],
      ['Did you wait... um?', 'filler', ' um?'],
      ['Did she sleep? Hmm? She did.', 'filler', ' Hmm?'], // a filler question of its own keeps its "?" too
      ['Asha asked \u300Cmore\uFF1F\u300D um\uFF1F', 'filler', ' um\uFF1F'],
      ['Did she say no\u061F um\u061F', 'filler', ' um\u061F'],
    ];
    for (const [raw, type, original] of cases) {
      for (const source of ['rule', 'model'] as const) {
        expect(v7(raw, { ...edit(raw, type, original, ''), source }), `${raw} ${source}`).toBe('changes_sentence_type');
      }
    }
  });

  it('the verifier backstop: an end mark goes with a removal only in a sentence of its own after a finished one', () => {
    // Refused: the mark ends a sentence the removal leaves behind.
    expect(v7('We went home (it rained!) um.', edit('We went home (it rained!) um.', 'filler', ' um.', ''))).toBe('changes_sentence_type');
    expect(v7('आशा (हँसी!) um।', edit('आशा (हँसी!) um।', 'filler', ' um।', ''))).toBe('changes_sentence_type');
    expect(v7('We went home the the.', edit('We went home the the.', 'repeat', ' the.', ''))).toBe('changes_sentence_type'); // engine 6 accepted it
    expect(v7('Then she was. she was so happy', edit('Then she was. she was so happy', 'false_start', ' she was.', ''))).toBe('changes_sentence_type');
    // Accepted: a whole sentence of its own goes with its mark, and the sentence before keeps its own (F06 section 4.1).
    expect(v7('We went home (it rained!) um.', edit('We went home (it rained!) um.', 'filler', ' um', ''))).toBeNull();
    expect(v7('She walked to the door. Hmm.', edit('She walked to the door. Hmm.', 'filler', ' Hmm.', ''))).toBeNull();
    expect(v7('आशा हँसी। um।', edit('आशा हँसी। um।', 'filler', ' um।', ''))).toBeNull();
    expect(v7('she was. she was so happy', edit('she was. she was so happy', 'false_start', 'she was. ', ''))).toBeNull();
    expect(app('So um, she uh walked to the door. Hmm.')).toBe('So she walked to the door.');
    expect(app('Um. She slept.')).toBe('She slept.');
  });
});
