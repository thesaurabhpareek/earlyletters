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
  compileRules,
  END_MARKS,
  ENGLISH_RULES,
  faithfulClean,
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

/** Every code point of a Unicode class, listed here from Unicode itself, never read from src. */
function everyCodePoint(re: RegExp): string[] {
  const out: string[] = [];
  for (let cp = 0; cp <= 0x10ffff; cp++) if ((cp < 0xd800 || cp > 0xdfff) && re.test(String.fromCodePoint(cp))) out.push(String.fromCodePoint(cp));
  return out;
}

/* ---------- 1. words joined through an invisible character ---------- */

/** Every invisible character the engine knows (meaning.ts: default-ignorable code points and bidi controls). */
const INVISIBLES = everyCodePoint(/^[\p{Default_Ignorable_Code_Point}\p{Bidi_Control}]$/u);
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
    expect(INVISIBLES).toEqual(expect.arrayContaining(TRIED));
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

/** Every Unicode quotation mark, from Unicode itself. */
const QUOTES = everyCodePoint(/^\p{Quotation_Mark}$/u);
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

  it('negative cases: a whole hyphenated word, or a word beside a spaced hyphen, may still be fixed', () => {
    const hyphenated = 'Mary-Anne came over.';
    expect(verdict(hyphenated, edit(hyphenated, 'stt_fix', 'Mary-Anne', 'Mary-Ann'), [{ term: 'Mary-Ann', kind: 'child', heardAs: ['Mary-Anne'] }])).toBeNull();
    const spaced = 'We met Usher - then we left.';
    expect(verdict(spaced, edit(spaced, 'stt_fix', 'Usher', 'Asha'), [{ term: 'Asha', kind: 'child', heardAs: ['Usher'] }])).toBeNull();
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
