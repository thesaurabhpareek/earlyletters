/**
 * Engine 8 (24 Oct 2026): refusals only, the follow-up to the #257 reviews.
 * Each test names a shape that engine 7 accepted and engine 8 refuses, or a
 * fair edit beside one that both engines accept. Engine 8 accepts no single
 * edit that engine 7 refused: the single-edit differential in the PR finds 0
 * edits accepted by engine 8 alone, and every engine 7 golden case reads the
 * same (golden.test.ts).
 *
 * The constitution: the machine may remove and repair. It may never add meaning.
 * Fictional family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import * as verifyModule from '../src/verify';
import {
  BETWEEN_MARKS,
  checkEdit,
  cleanRulesOnly,
  compileRules,
  END_MARKS,
  ENGLISH_RULES,
  faithfulClean,
  isInvisible,
  protectedSpansFor,
  QUOTE_BRIDGES,
  verifyEdits,
  type DictionaryTerm,
  type Edit,
  type EditType,
  type LanguageRules,
  type TextRulesPack,
} from '../src';

const DIR = join(__dirname, '../../../packs/text-rules');
const loadPack = (l: string) => JSON.parse(readFileSync(join(DIR, `${l}.json`), 'utf8')) as TextRulesPack;
function vetted(l: string): TextRulesPack {
  const p = loadPack(l);
  for (const k of ['fillers', 'meaning', 'repeats', 'phonetic'] as const) p[k].review = { status: 'native-reviewed', by: 'test' };
  return p;
}

/** One edit's verdict from verifyEdits, which checks it in context too; checkEdit alone (Review's offers) must agree. */
function verdict(raw: string, e: Edit, dictionary: DictionaryTerm[] = [], rules: LanguageRules = ENGLISH_RULES): string | null {
  const ctx = { raw, level: 'clean' as const, dictionary, protectedSpans: protectedSpansFor(raw, dictionary, [], rules), rules };
  const r = verifyEdits([e], ctx);
  const reason = r.accepted.length ? null : r.rejected[0].reason;
  expect(checkEdit(e, ctx), `checkEdit agrees with verifyEdits: ${JSON.stringify(raw)}`).toBe(reason);
  return reason;
}
const at = (type: EditType, raw: string, start: number, original: string, replacement: string): Edit => {
  expect(raw.slice(start, start + original.length)).toBe(original);
  return { type, start, end: start + original.length, original, replacement, source: 'model' };
};
function edit(raw: string, type: EditType, original: string, replacement: string, nth = 0): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  return at(type, raw, start, original, replacement);
}
const hex = (c: string) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`;

/** Every code point for which `has` holds. */
function everyCodePoint(has: (ch: string) => boolean): string[] {
  const out: string[] = [];
  for (let cp = 0; cp <= 0x10ffff; cp++) if ((cp < 0xd800 || cp > 0xdfff) && has(String.fromCodePoint(cp))) out.push(String.fromCodePoint(cp));
  return out;
}

/* ---------- 1. words joined through an invisible character ---------- */

/**
 * Every invisible character the engine knows, read from the engine itself (isInvisible, meaning.ts), so a
 * code point added there by hand is swept too (round 2, lens B F3). The test below also checks that it
 * holds every default-ignorable code point and bidi control Unicode lists, so it can never narrow.
 */
const INVISIBLES = everyCodePoint(isInvisible);
const UNICODE_INVISIBLES = everyCodePoint((c) => /^[\p{Default_Ignorable_Code_Point}\p{Bidi_Control}]$/u.test(c));
/** The eleven #257 review A tried by hand. */
const TRIED = ['\u200E', '\u200F', '\u202E', '\u200B', '\u200C', '\u200D', '\u2066', '\u061C', '\uFEFF', '\u00AD', '\u2060'];

describe('[F06-REQ-003] engine 8: no edit joins two words through an invisible character (seed 20261015 run 81642)', () => {
  it('run 81642: the space after U+200D in Arabic "kataba" (with its vowel marks) is refused by verifyEdits and checkEdit, shipped and vetted pack', () => {
    // kataba, U+200D, a space, then "al-walad risala!" ("the boy wrote a letter"): deleting the space made one word of two.
    const raw = '\u0643\u064E\u062A\u064E\u0628\u064E\u200D \u0627\u0644\u0648\u0644\u062F \u0631\u0633\u0627\u0644\u0629!';
    const e: Edit = { type: 'paragraph', start: 7, end: 8, original: ' ', replacement: '', source: 'model' };
    for (const pack of [loadPack('ar'), vetted('ar')]) {
      const rules = compileRules('ar', pack);
      expect(verdict(raw, e, [], rules)).toBe('changes_word');
      expect(faithfulClean(raw, { level: 'clean', dictionary: [], rules, modelEdits: [e] }).text).toContain('\u200D \u0627');
      expect(faithfulClean(raw, { level: 'clean', dictionary: [], rules, ruleEdits: [e] }).text).toContain('\u200D \u0627');
    }
  });

  it('every invisible character the engine knows, at a word end or a word start: the space beside it may not go, as paragraph or punctuation', () => {
    expect(INVISIBLES.length).toBeGreaterThan(4000);
    expect(INVISIBLES).toEqual(expect.arrayContaining([...UNICODE_INVISIBLES, ...TRIED]));
    const accepted: string[] = [];
    const ctx = (raw: string) => ({ raw, level: 'clean' as const, dictionary: [], protectedSpans: [], rules: ENGLISH_RULES });
    for (const inv of INVISIBLES) {
      // "Asha" + inv + " slept well." (the space after it) and "Asha " + inv + "slept well." (the space before it).
      const shapes = [
        ['end', `Asha${inv} slept well.`, 4 + inv.length],
        ['start', `Asha ${inv}slept well.`, 4],
      ] as const;
      for (const [side, raw, i] of shapes) {
        for (const type of ['paragraph', 'punctuation'] as const) {
          const e: Edit = { type, start: i, end: i + 1, original: ' ', replacement: '', source: 'model' };
          const v = verifyEdits([e], ctx(raw));
          const reason = v.accepted.length ? null : v.rejected[0].reason;
          if (reason !== checkEdit(e, ctx(raw))) accepted.push(`${hex(inv)} ${side} ${type}: checkEdit disagrees`);
          if (reason !== 'changes_word' && reason !== 'splits_word') accepted.push(`${hex(inv)} ${side} ${type}: ${reason}`);
        }
      }
    }
    expect(accepted).toEqual([]);
  });

  it('through the pipeline as well, as a model edit and as a rule edit, for the eleven review A tried', () => {
    for (const inv of TRIED) {
      for (const raw of [`Asha${inv} slept well.`, `Asha ${inv}slept well.`]) {
        const i = raw.indexOf(' ');
        for (const type of ['paragraph', 'punctuation'] as const) {
          const e = at(type, raw, i, ' ', '');
          for (const opts of [{ modelEdits: [e] }, { ruleEdits: [e] }]) {
            const r = faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en', ...opts });
            expect(r.applied.some((x) => x.start === i && x.original === ' '), `${hex(inv)} ${type}`).toBe(false);
          }
        }
      }
    }
  });

  it('every edit type that can carry the join refuses it: filler, repeat, false start and name fix, as well as paragraph and punctuation', () => {
    const z = '\u200B';
    const filler = `Asha${z} um slept well.`;
    expect(verdict(filler, at('filler', filler, 5, ' um ', ''))).toBe('changes_word');
    const repeat = `She saw${z} the the duck.`;
    expect(verdict(repeat, at('repeat', repeat, 8, ' the ', ''))).toBe('changes_word');
    const restart = `I think${z} we went we went home.`;
    expect(verdict(restart, at('false_start', restart, 8, ' we went ', ''))).toBe('changes_word');
    const name = `We met${z} Usher today.`;
    const dict: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }];
    expect(verdict(name, at('stt_fix', name, 7, ' Usher', 'Asha'), dict)).toBe('changes_word');
  });

  it('nor may an edit start or end inside a word as it is seen: no space put into "Asha" U+200B "slept", no "um" taken out of "Asha" U+200B "um"', () => {
    const joined = 'Asha\u200Bslept well.';
    expect(verdict(joined, at('paragraph', joined, 5, '', ' '))).toBe('splits_word');
    expect(verdict(joined, at('paragraph', joined, 4, '', ' '))).toBe('splits_word');
    expect(verdict(joined, at('punctuation', joined, 5, '', ' '))).toBe('changes_word');
    const glued = 'Asha\u200Bum slept well.';
    expect(verdict(glued, at('filler', glued, 5, 'um', ''))).toBe('splits_word');
  });

  it('the same check steps a code point at a time: a space deleted between two words written outside the BMP (Adlam) is refused', () => {
    const raw = 'We saw \u{1E900}\u{1E901} \u{1E902} today.';
    const i = raw.indexOf(' \u{1E902}');
    expect(verdict(raw, at('paragraph', raw, i, ' ', ''))).toBe('changes_word'); // engine 7 read half a surrogate pair and accepted it
    expect(verdict(raw, at('punctuation', raw, i, ' ', ''))).toBe('changes_word'); // refused in engine 7 too (its word window)
  });

  it('negative cases: fair edits beside an invisible character are still accepted', () => {
    const raw = 'Um, Asha\u200B slept well';
    expect(verdict(raw, edit(raw, 'filler', 'Um, ', ''))).toBeNull();
    expect(verdict(raw, at('punctuation', raw, raw.length, '', '.'))).toBeNull();
    expect(faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en' }).text).toBe('Asha\u200B slept well'); // the filler goes, the space stays
    const bom = '\uFEFFasha slept.';
    expect(verdict(bom, at('punctuation', bom, 1, 'a', 'A'))).toBeNull();
    const spaces = 'Asha\u200B  slept.';
    expect(verdict(spaces, at('paragraph', spaces, 5, '  ', ' '))).toBeNull();
    const name = 'We met Usher\u200F today.';
    expect(verdict(name, edit(name, 'stt_fix', 'Usher', 'Asha'), [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }])).toBeNull();
  });
});

/* ---------- 2. the marks that sit between two end marks ---------- */

/** Every Unicode quotation mark, from Unicode itself, never read from src. */
const QUOTES = everyCodePoint((c) => /^\p{Quotation_Mark}$/u.test(c));
/** The sixteen end marks, written out: a mark dropped from END_MARKS fails the table below (#257 review A, plant P3). */
const ENDS = ['.', '!', '?', '\u3002', '\uFF01', '\uFF1F', '\u061F', '\u0964', '\u0965', '\u203D', '\u2047', '\u2048', '\u2049', '\u203C', '\u2E2E', '\u2026'];
/** The fifteen quotation marks engine 7 read as walls (#257 review A counted 14; its list names these 15). */
const WALLS_IN_ENGINE_7 = ['\u2018', '\u201A', '\u201B', '\u2E42', '\u301D', '\u301E', '\u301F', '\uFE41', '\uFE42', '\uFE43', '\uFE44', '\uFF02', '\uFF07', '\uFF62', '\uFF63'];
const put = (raw: string, mark: string) => at('punctuation', raw, raw.length, '', mark);

describe('[F06-REQ-004] engine 8: an end mark put behind any quotation mark still touches the mark said before it (#257 review A, section 1)', () => {
  it('every Unicode quotation mark: "She said no." plus the mark plus "." is refused, with or without an opening U+201A', () => {
    expect(QUOTES.length).toBe(30);
    const accepted: string[] = [];
    for (const q of QUOTES) {
      for (const raw of [`She said no.${q}`, `She said \u201Ano.${q}`]) {
        if (verdict(raw, put(raw, '.')) !== 'changes_sentence_type') accepted.push(`${hex(q)} in ${JSON.stringify(raw)}`);
      }
    }
    expect(accepted).toEqual([]);
  });

  it('every end mark the engine knows: "She said no" plus the mark plus ".", and the same behind a closing quotation mark, are refused', () => {
    const accepted: string[] = [];
    for (const m of ENDS) {
      for (const raw of [`She said no${m}`, `She said \u201Cno${m}\u201D`, `She said \u201Ano${m}\u2018`]) {
        if (verdict(raw, put(raw, '.')) !== 'changes_sentence_type') accepted.push(`${hex(m)} in ${JSON.stringify(raw)}`);
      }
    }
    expect(accepted).toEqual([]);
    expect([...END_MARKS].sort()).toEqual([...ENDS].sort());
  });

  it('the fifteen engine 7 read as walls: a mark moved across one stays refused, the first mark said stays, the later one may go', () => {
    expect([...QUOTE_BRIDGES].sort()).toEqual([...WALLS_IN_ENGINE_7].sort());
    for (const q of WALLS_IN_ENGINE_7) {
      const raw = `She said no.${q}. Then she slept.`;
      const i = raw.indexOf(q);
      expect(verdict(raw, at('punctuation', raw, i, `${q}.`, `.${q}`)), hex(q)).toBe('changes_sentence_type'); // engine 7 refused it too
      expect(verdict(raw, at('punctuation', raw, i - 1, '.', '')), hex(q)).toBe('changes_sentence_type'); // engine 7 accepted it
      expect(verdict(raw, at('punctuation', raw, i + 1, '.', '')), hex(q)).toBeNull();
    }
  });

  it('the fifteen as walls too: behind "no." and one of them, the first of two marks said after it stands (round 2: fails if they are read only as bridges)', () => {
    // As bridges alone, the first "." after the quotation mark would be a later mark of the run before it, and each
    // edit below would be accepted, as the plain widening measured (1,320 edits on the spliced differential); as walls,
    // engine 7's reading, it is the first mark of its own run. The bare-pair check of ruling 2 does not decide these:
    // the raw already has a bare pair after the quotation mark.
    const accepted: string[] = [];
    for (const q of WALLS_IN_ENGINE_7) {
      const raw = `She said no.${q}.. Then she slept.`;
      const i = raw.indexOf(q) + q.length;
      const edits: Array<[string, Edit]> = [
        ['moved across', at('punctuation', raw, i - 1, `${q}.`, `.${q}`)],
        ['changed to U+2026', at('punctuation', raw, i, '.', '\u2026')],
        ['deleted', at('punctuation', raw, i, '.', '')],
      ];
      for (const [what, e] of edits) if (verdict(raw, e) !== 'changes_sentence_type') accepted.push(`${hex(q)}: the first "." after it ${what}`);
      if (verdict(raw, at('punctuation', raw, i + 1, '.', '')) !== null) accepted.push(`${hex(q)}: the later "." may not go`);
    }
    expect(accepted).toEqual([]);
  });

  it('two fair edits together: a trailing filler removed and a "." put behind U+2018 are refused together, as behind U+201D', () => {
    for (const close of ['\u2018', '\u201D']) {
      const raw = `She said \u201Ano.${close} um`;
      const edits = [at('filler', raw, raw.length - 3, ' um', ''), put(raw, '.')];
      const r = verifyEdits(edits, { raw, level: 'clean', dictionary: [], protectedSpans: [] });
      expect(r.accepted.map((e) => e.type), close).toEqual(['filler']);
      expect(r.rejected.map((x) => x.reason), close).toEqual(['changes_sentence_type']);
      expect(faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en', modelEdits: [put(raw, '.')] }).text).not.toMatch(/\.\D?\.$/u);
    }
  });

  it('negative case: a "." after a closing quotation mark with no end mark before it is still a fair final mark', () => {
    for (const q of QUOTES) {
      const raw = `She said no${q}`;
      expect(verdict(raw, put(raw, '.')), hex(q)).toBeNull();
    }
  });
});

/* ---------- 3. a heard-as inside a hyphenated word ---------- */

describe('[F06-REQ-009] engine 8: a name fix or agreement replaces a whole word, never part of a hyphenated one (seed 2 run 84272)', () => {
  it('rules only: a taught heard-as "uh" leaves "Uh-uh" (no) as said, and a taught "mm" leaves "Mm-hmm" (yes)', () => {
    const usha: DictionaryTerm[] = [{ term: 'Usha', kind: 'family', heardAs: ['uh'] }];
    const no = faithfulClean('Did you want more? Uh-uh, she said.', { level: 'clean', dictionary: usha, language: 'en' });
    expect(no.text).toBe('Did you want more? Uh-uh, she said.'); // engine 7: "Usha-Usha, she said."
    expect(no.rejected.map((x) => `${x.edit.type}:${x.reason}`)).toEqual(['stt_fix:splits_word', 'stt_fix:splits_word']);
    const may: DictionaryTerm[] = [{ term: 'May', kind: 'child', heardAs: ['mm'] }];
    expect(faithfulClean('Mm-hmm, Asha nodded.', { level: 'clean', dictionary: may, language: 'en' }).text).toBe('Mm-hmm, Asha nodded.'); // engine 7: "May-hmm"
  });

  it('from a model too: "Mm" of "Mm-hmm" to "May", "hmm" to "May", and the article of "A-ha" to "An" are refused', () => {
    const raw = 'Mm-hmm, Asha nodded.';
    const may: DictionaryTerm[] = [{ term: 'May', kind: 'child', heardAs: ['mm', 'hmm'] }];
    expect(verdict(raw, edit(raw, 'stt_fix', 'Mm', 'May'), may)).toBe('splits_word');
    expect(verdict(raw, edit(raw, 'stt_fix', 'hmm', 'May'), may)).toBe('splits_word');
    const aha = 'A-ha, she said.';
    expect(verdict(aha, edit(aha, 'agreement', 'A', 'An'))).toBe('splits_word');
  });

  it('a letter change inside a hyphenated word stays refused, from the rules too: "Usher-ji" never "Asha-ji", "Grandma-Usher" never "Grandma-Asha"', () => {
    const asha: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }];
    for (const raw of ['We met Usher-ji today.', 'We met Grandma-Usher today.', 'We met Usher\u2011ji today.']) {
      expect(verdict(raw, edit(raw, 'stt_fix', 'Usher', 'Asha'), asha), raw).toBe('splits_word');
      expect(faithfulClean(raw, { level: 'clean', dictionary: asha, language: 'en' }).text, raw).toContain('Usher');
    }
  });

  it('round 2 (lens A N4): a whole part in another case, every letter kept, may still be fixed: "asha-ji" to "Asha-ji", as in engine 7', () => {
    const asha: DictionaryTerm[] = [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }];
    for (const [raw, fixed] of [['We met asha-ji today.', 'We met Asha-ji today.'], ['We met asha\u2011ji today.', 'We met Asha\u2011ji today.'], ['Hi grandma-asha.', 'Hi grandma-Asha.']]) {
      expect(verdict(raw, edit(raw, 'stt_fix', 'asha', 'Asha'), asha), raw).toBeNull();
      expect(faithfulClean(raw, { level: 'clean', dictionary: asha, language: 'en' }).text, raw).toBe(fixed);
    }
    // The case-only branch still keeps an everyday word and a filler as said ("hope-filled", "uh-uh" with a term "Uh").
    const hope = 'It was a hope-filled day.';
    expect(verdict(hope, edit(hope, 'stt_fix', 'hope', 'Hope'), [{ term: 'Hope', kind: 'child', heardAs: [] }])).toBe('stt_fix_protected_word');
    const no = 'Did you want more? uh-uh, she said.';
    expect(verdict(no, edit(no, 'stt_fix', 'uh', 'Uh'), [{ term: 'Uh', kind: 'family', heardAs: [] }])).toBe('stt_fix_protected_word');
  });

  it('negative cases: a whole hyphenated word, or a word beside a spaced hyphen, may still be fixed', () => {
    const hyphenated = 'Mary-Anne came over.';
    expect(verdict(hyphenated, edit(hyphenated, 'stt_fix', 'Mary-Anne', 'Mary-Ann'), [{ term: 'Mary-Ann', kind: 'child', heardAs: ['Mary-Anne'] }])).toBeNull();
    const spaced = 'We met Usher - then we left.';
    expect(verdict(spaced, edit(spaced, 'stt_fix', 'Usher', 'Asha'), [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }])).toBeNull();
  });
});

/* ---------- rulings on #262 (24 Oct 2026) ---------- */

describe('[F06-REQ-015] engine 8 (ruling on #262): a capital is raised only where a removal in the same set made a sentence start, never past a kept filler', () => {
  const hope: DictionaryTerm[] = [{ term: 'Hope', kind: 'child', heardAs: [] }];
  const capital = (raw: string, i: number): Edit => at('punctuation', raw, i, raw[i], raw[i].toUpperCase());

  it('seed 20261003 run 14032: "S" after a kept "Um," is refused on its own (verifyEdits; checkEdit leaves raised capitals to it)', () => {
    const raw = 'Um, so-so, Asha laughed at the the duck today.';
    const r = verifyEdits([{ ...capital(raw, 4), source: 'rule' }], { raw, level: 'clean', dictionary: [], protectedSpans: [] });
    expect(r.rejected.map((x) => x.reason)).toEqual(['case_change_not_sentence_start']);
  });

  it('a locked filler and a model capital: "Um, hope is here." stays, never "Um, Hope is here." (the child\'s name)', () => {
    const raw = 'Um, hope is here.';
    const r = faithfulClean(raw, { level: 'clean', dictionary: hope, language: 'en', locked: ['Um'], modelEdits: [capital(raw, 4)] });
    expect(r.text).toBe('Um, hope is here.');
    expect(r.rejected.map((x) => `${x.edit.type}:${x.reason}`)).toEqual(['filler:overlaps_protected', 'punctuation:case_change_not_sentence_start']);
  });

  it('the rules\' own sentence case after a locked filler: cleanRulesOnly leaves "um, so we went home" lower case', async () => {
    const r = await cleanRulesOnly({ raw: 'um, so we went home', level: 'clean', dictionary: [], locked: ['um'] }, { language: 'en' });
    expect(r.text).toBe('um, so we went home.'); // engine 7: "um, So we went home."
  });

  it('still allowed: the filler removed in the same set makes the next word the sentence start, and it may be raised', async () => {
    const raw = 'Um, hope is here.';
    expect(faithfulClean(raw, { level: 'clean', dictionary: hope, language: 'en', modelEdits: [capital(raw, 4)] }).text).toBe('Hope is here.');
    const both = verifyEdits([edit(raw, 'filler', 'Um, ', ''), capital(raw, 4)], { raw, level: 'clean', dictionary: hope, protectedSpans: [] });
    expect(both.rejected).toEqual([]);
    expect((await cleanRulesOnly({ raw: 'um, so we went home', level: 'clean', dictionary: [] }, { language: 'en' })).text).toBe('So we went home.');
  });
});

describe('[F06-REQ-004] engine 8 (ruling on #262): no mark is moved inside a quote to sit beside the mark said there', () => {
  it('every Unicode quotation mark: "no." + mark + "." may not become "no.." + mark; the later mark may still go', () => {
    const accepted: string[] = [];
    for (const q of QUOTES) {
      const raw = `She said no.${q}. Then she slept.`;
      const i = raw.indexOf(`${q}.`);
      if (verdict(raw, at('punctuation', raw, i, `${q}.`, `.${q}`)) !== 'changes_sentence_type') accepted.push(`${hex(q)} moved`);
      if (verdict(raw, at('punctuation', raw, i + q.length, '.', '')) !== null) accepted.push(`${hex(q)} later mark kept`);
    }
    expect(accepted).toEqual([]); // engine 7 accepted the move behind the 15 marks it bridged (U+201D among them)
  });

  it('through the pipeline the quoted words were already protected; the verifier alone, as for Review\'s offers, now refuses it too', () => {
    const raw = 'She said \u201Cno.\u201D. Then she slept.';
    const i = raw.indexOf('\u201D.');
    const move = at('punctuation', raw, i, '\u201D.', '.\u201D');
    expect(faithfulClean(raw, { level: 'clean', dictionary: [], language: 'en', modelEdits: [move] }).applied).toEqual([]);
    const ctx = { raw, level: 'clean' as const, dictionary: [], protectedSpans: [] };
    expect(checkEdit(move, ctx)).toBe('changes_sentence_type'); // engine 7: null
  });
});

describe('[F07-REQ-012] engine 8 (ruling on #262): a name fix never replaces a word the engine classes as a filler', () => {
  const usha: DictionaryTerm[] = [{ term: 'Usha', kind: 'family', heardAs: ['uh'] }];

  it('a taught heard-as "uh" leaves a lone "uh" to the filler rules: "Uh, she came over." never becomes "Usha, she came over."', () => {
    const raw = 'Uh, she came over.';
    expect(verdict(raw, edit(raw, 'stt_fix', 'Uh', 'Usha'), usha)).toBe('stt_fix_protected_word');
    expect(faithfulClean(raw, { level: 'clean', dictionary: usha, language: 'en' }).text).toBe('she came over.'); // engine 7: "Usha, she came over."
    expect(faithfulClean('She came over, uh, today.', { level: 'clean', dictionary: usha, language: 'en' }).text).not.toContain('Usha');
  });

  it('an offered filler too: a taught "mm" leaves the answer "Mm." as said', () => {
    const may: DictionaryTerm[] = [{ term: 'May', kind: 'child', heardAs: ['mm'] }];
    expect(faithfulClean('Did she sleep? Mm. She did.', { level: 'clean', dictionary: may, language: 'en' }).text).toBe('Did she sleep? Mm. She did.');
  });

  it('round 2 (lens A N3): nor in another case: a family term "Um" never turns "She was, um, tired." into "She was, Um, tired."', () => {
    const um: DictionaryTerm[] = [{ term: 'Um', kind: 'family', heardAs: [] }];
    const raw = 'She was, um, tired.';
    expect(verdict(raw, edit(raw, 'stt_fix', 'um', 'Um'), um)).toBe('stt_fix_protected_word'); // engine 7 accepted it
    expect(faithfulClean(raw, { level: 'clean', dictionary: um, language: 'en' }).text).not.toContain('Um'); // the filler rule takes it
  });

  it('negative case: a heard-as that is a word, not a filler sound, is still applied', () => {
    const raw = 'We met Usher today.';
    expect(verdict(raw, edit(raw, 'stt_fix', 'Usher', 'Asha'), [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }])).toBeNull();
  });
});

/* ---------- 5. the verifier's exports ---------- */

describe('[F06-REQ-017] engine 8: the verifier exports no RegExp an importer could recompile (#257 review A, section 4)', () => {
  it('END_MARKS, BETWEEN_MARKS and QUOTE_BRIDGES are frozen lists of strings, and verify.ts exports no RegExp', () => {
    for (const list of [END_MARKS, BETWEEN_MARKS, QUOTE_BRIDGES]) {
      expect(Object.isFrozen(list)).toBe(true);
      expect(() => (list as string[]).push('x')).toThrow(TypeError);
      for (const s of list) expect(typeof s).toBe('string');
    }
    for (const [name, value] of Object.entries(verifyModule)) expect(value instanceof RegExp, name).toBe(false);
  });

  it('a copy of a list changes nothing: the verifier reads its own sets', () => {
    const copy = [...END_MARKS];
    copy.length = 0;
    const raw = 'Asha slept\u3002';
    expect(verdict(raw, put(raw, '.'))).toBe('changes_sentence_type');
  });
});
