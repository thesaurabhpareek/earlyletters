/**
 * R-01 open verifier items closed by WP-F06-02 (F06 section 7.1).
 * The machine may remove and repair. It may never add meaning.
 *
 *  - D4  (F06-REQ-003): an invisible direction mark or joiner added, removed
 *        or moved by a machine edit.
 *  - D7  (F06-REQ-006): fillers inside curly single quotes and low-high
 *        quotes (and every other Unicode quotation style) removed.
 *  - D9  (F06-REQ-007): `agreement` turning a plural noun into a singular
 *        through the generic -s, -es, -ies rule.
 *
 * Fixtures use the fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compileRules,
  faithfulClean,
  quotationMarkCount,
  quotedSpans,
  verifyEdits,
  type DictionaryTerm,
  type Edit,
  type EditLevel,
  type LanguageRules,
  type TextRulesPack,
} from '../src';

const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia', 'Usha'] },
  { term: 'Mumma', kind: 'family', heardAs: ['mama'] },
];

function edit(raw: string, type: Edit['type'], original: string, replacement: string, nth = 0, source: Edit['source'] = 'model'): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  if (start < 0) throw new Error(`not found: ${original}`);
  return { type, start, end: start + original.length, original, replacement, source };
}

const verdict = (raw: string, e: Edit, rules?: LanguageRules, level: EditLevel = 'clean') => {
  const r = verifyEdits([e], { raw, level, dictionary: DICT, protectedSpans: [], rules });
  return r.accepted.length ? null : r.rejected[0].reason;
};

const clean = (raw: string) => faithfulClean(raw, { level: 'clean', dictionary: DICT });

/* ---------- D4: invisible characters ---------- */

const INVISIBLES: Array<[string, string]> = [
  ['U+200E LEFT-TO-RIGHT MARK', '\u200E'],
  ['U+200F RIGHT-TO-LEFT MARK', '\u200F'],
  ['U+202E RIGHT-TO-LEFT OVERRIDE', '\u202E'],
  ['U+200B ZERO WIDTH SPACE', '\u200B'],
  ['U+200C ZERO WIDTH NON-JOINER', '\u200C'],
  ['U+200D ZERO WIDTH JOINER', '\u200D'],
  ['U+2066 LEFT-TO-RIGHT ISOLATE', '\u2066'],
  ['U+061C ARABIC LETTER MARK', '\u061C'],
  ['U+FEFF ZERO WIDTH NO-BREAK SPACE', '\uFEFF'],
];

describe('[F06-REQ-003] never adds, removes or moves an invisible character: R-01 D4', () => {
  it.each(INVISIBLES)('[F06-REQ-003] refuses %s inserted right after a word as punctuation', (_name, ch) => {
    const raw = 'Asha laughed at the duck.';
    expect(verdict(raw, edit(raw, 'punctuation', 'laughed', `laughed${ch}`))).toBe('changes_invisible');
  });

  it.each(INVISIBLES)('[F06-REQ-003] refuses %s inserted inside a word as punctuation', (_name, ch) => {
    const raw = 'Asha laughed at the duck.';
    expect(verdict(raw, edit(raw, 'punctuation', 'laughed', `laug${ch}hed`))).toBe('changes_invisible');
  });

  it('[F06-REQ-003] refuses removing a direction mark that was said-as-written in raw', () => {
    const raw = 'Asha\u200F laughed at the duck';
    expect(verdict(raw, edit(raw, 'punctuation', 'Asha\u200F', 'Asha'))).toBe('changes_invisible');
    expect(verdict(raw, edit(raw, 'punctuation', 'Asha\u200F laughed', 'Asha laughed'))).toBe('changes_invisible');
  });

  it('[F06-REQ-003] refuses moving a direction mark, or swapping one for another', () => {
    const raw = 'Asha\u200F, laughed at the duck';
    expect(verdict(raw, edit(raw, 'punctuation', 'Asha\u200F,', 'Asha,\u200F'))).toBe('changes_invisible');
    expect(verdict(raw, edit(raw, 'punctuation', 'Asha\u200F,', 'Asha\u200E,'))).toBe('changes_invisible');
  });

  it('[F06-REQ-003] refuses a zero width no-break space smuggled in as a paragraph edit', () => {
    const raw = 'Asha laughed. Then she slept.';
    expect(verdict(raw, edit(raw, 'paragraph', ' ', '\uFEFF\n'))).toBe('changes_invisible');
  });

  it('[F06-REQ-003] refuses a removal or dictionary fix that takes an invisible character with it', () => {
    const raw = 'um\u200B she laughed at the duck';
    expect(verdict(raw, edit(raw, 'filler', 'um\u200B ', '', 0, 'rule'))).toBe('changes_invisible');
    const raw2 = 'then Usha\u200D ate peas';
    expect(verdict(raw2, edit(raw2, 'stt_fix', 'Usha\u200D', 'Asha', 0, 'rule'))).toBe('changes_invisible');
  });

  it('[F06-REQ-003] control: punctuation next to an invisible character that keeps it in place is accepted', () => {
    const raw = 'Asha laughed\u200F';
    expect(verdict(raw, edit(raw, 'punctuation', 'laughed\u200F', 'laughed\u200F.'))).toBeNull();
    const raw2 = 'asha\u200F laughed';
    expect(verdict(raw2, edit(raw2, 'punctuation', 'asha', 'Asha'))).toBeNull();
  });

  it('[F06-REQ-003] end to end: the rules leave every invisible character where it was', () => {
    const raw = 'Um, Asha\u200F laughed at the\u200D duck.';
    const out = clean(raw);
    expect([...out.text].filter((c) => c === '\u200F' || c === '\u200D')).toEqual(['\u200F', '\u200D']);
  });
});

/* ---------- D7: every quotation style ---------- */

const QUOTE_STYLES: Array<[string, string, string]> = [
  ['curly single quotes used as a pair (U+2018 U+2019)', '\u2018', '\u2019'],
  ['low-high quotes (U+201E U+201C)', '\u201E', '\u201C'],
  ['low-high quotes (U+201E U+201D)', '\u201E', '\u201D'],
  ['low single quotes (U+201A U+2018)', '\u201A', '\u2018'],
  ['single guillemets (U+2039 U+203A)', '\u2039', '\u203A'],
  ['reversed guillemets (U+00BB U+00AB)', '\u00BB', '\u00AB'],
  ['double prime quotes (U+301D U+301E)', '\u301D', '\u301E'],
  ['half-width corner brackets (U+FF62 U+FF63)', '\uFF62', '\uFF63'],
  ['straight single quotes used as a pair', "'", "'"],
];

describe('[F06-REQ-006] every quotation style is protected and counted: R-01 D7', () => {
  it.each(QUOTE_STYLES)('[F06-REQ-006] keeps a filler inside %s', (_name, open, close) => {
    const raw = `Asha said ${open}um, not now${close} and went to sleep.`;
    const out = clean(raw);
    // The words stay as said. (English still straightens curly marks after the edits: R-01 D14, WP-F06-05.)
    expect(out.text).toContain('um, not now');
    expect(out.applied.filter((e) => e.type === 'filler')).toEqual([]);
  });

  it('[F06-REQ-006] keeps a filler and a repeat inside curly single quotes that contain an apostrophe', () => {
    const raw = 'She said \u2018um, I don\u2019t want the the duck\u2019 and laughed.';
    const out = clean(raw);
    expect(out.text).toContain('um, I don');
    expect(out.text).toContain('want the the duck');
    expect(out.applied).toEqual([]);
  });

  it('[F06-REQ-006] never fixes a name inside low-high quotes', () => {
    const raw = 'Mumma sang \u201EUsha come home\u201C at bedtime.';
    const out = clean(raw);
    expect(out.text).toContain('Usha come home');
    expect(out.applied.filter((e) => e.type === 'stt_fix')).toEqual([]);
  });

  it('[F06-REQ-006] a model edit inside curly single quotes is refused as protected', () => {
    const raw = 'She said \u2018me want duck\u2019 at the door.';
    expect(verdict(raw, edit(raw, 'agreement', 'want', 'wants'))).toBe('overlaps_protected');
  });

  it('[F06-REQ-006] quotedSpans finds every style, and an apostrophe inside a word opens or closes nothing', () => {
    for (const [, open, close] of QUOTE_STYLES) {
      const raw = `Asha said ${open}hi${close} today`;
      const at = raw.indexOf(open);
      expect(quotedSpans(raw), `${open}${close}`).toContainEqual({ start: at, end: at + open.length + 2 + close.length });
    }
    expect(quotedSpans('Asha\u2019s duck and Mumma\u2019s cup')).toEqual([]);
    expect(quotedSpans("Asha's duck and Mumma's cup")).toEqual([]);
  });

  it('[F06-REQ-006] quotationMarkCount counts every Unicode quotation mark but not an apostrophe inside a word', () => {
    expect(quotationMarkCount('\u2018hi\u2019 \u201Ehi\u201C \u201Ahi\u2018 \u2039hi\u203A \u301Dhi\u301E \uFF62hi\uFF63')).toBe(12);
    expect(quotationMarkCount('Asha\u2019s duck, it\u2019s Mumma\'s')).toBe(0);
  });

  it.each([
    ['\u201A', '\u2018'],
    ['\u301D', '\u301E'],
    ['\uFF62', '\uFF63'],
    ['\u2018', '\u2019'],
  ])('[F06-REQ-006] a punctuation edit may not add quotation marks %s %s', (open, close) => {
    const raw = 'Asha said hi to the duck';
    expect(verdict(raw, edit(raw, 'punctuation', 'hi', `${open}hi${close}`))).toBe('changes_quotes');
  });

  it('[F06-REQ-006] control: an apostrophe inside a word still allows a filler removal and a punctuation fix', () => {
    const out = clean('Um, Asha\u2019s duck is here');
    expect(out.text.startsWith('Asha')).toBe(true);
    const raw = 'it\u2019s fine';
    expect(verdict(raw, edit(raw, 'punctuation', 'it\u2019s', "it's"))).toBeNull();
  });
});

/* ---------- D9: agreement is a closed table ---------- */

const DIR = join(__dirname, '../../../packs/text-rules');
const loadPack = (l: string) => JSON.parse(readFileSync(join(DIR, `${l}.json`), 'utf8')) as TextRulesPack;

describe('[F06-REQ-007] agreement is a closed table of verb and article pairs: R-01 D9', () => {
  it.each([
    ['We saw the babies.', 'babies', 'baby'],
    ['We saw the dogs.', 'dogs', 'dog'],
    ['Asha has two daughters.', 'daughters', 'daughter'],
    ['We saw two dog.', 'dog', 'dogs'],
    ['Asha has two cousins.', 'cousins', 'cousin'],
    ['She walk to me.', 'walk', 'walks'],
    ['She watch the birds.', 'watch', 'watches'],
    ['She carry the bag.', 'carry', 'carries'],
  ])('[F06-REQ-007] refuses "%s": %s -> %s (not in the closed table)', (raw, from, to) => {
    expect(verdict(raw, edit(raw, 'agreement', from, to))).toBe('agreement_stem_mismatch');
  });

  it('[F06-REQ-007] Spanish hijas -> hija is refused with the draft pack and with a vetted pack', () => {
    const raw = 'Asha tiene dos hijas.';
    const e = edit(raw, 'agreement', 'hijas', 'hija');
    expect(verdict(raw, e, compileRules('es', loadPack('es')))).toBe('not_vetted_for_language');
    const vetted = loadPack('es');
    for (const k of ['fillers', 'meaning', 'repeats', 'phonetic'] as const) vetted[k].review = { status: 'native-reviewed', by: 'test' };
    expect(verdict(raw, e, compileRules('es', vetted))).not.toBeNull();
  });

  it('[F06-REQ-007] a pack generic -s rule never reaches the verifier, and a kinship noun in a group is still refused', () => {
    const forged = loadPack('es');
    for (const k of ['fillers', 'meaning', 'repeats', 'phonetic'] as const) forged[k].review = { status: 'native-reviewed', by: 'test' };
    forged.meaning.agreementInflections = [{ add: 's' }];
    forged.meaning.agreementGroups = [['es', 'son'], ['hija', 'hijas']];
    const R = compileRules('es', forged);
    expect(R.can.agreement).toBe(true);
    const raw = 'Asha tiene dos hijas y perros.';
    expect(verdict(raw, edit(raw, 'agreement', 'perros', 'perro'), R)).toBe('agreement_stem_mismatch');
    expect(verdict(raw, edit(raw, 'agreement', 'hijas', 'hija'), R)).toBe('agreement_stem_mismatch');
  });

  it.each([
    ['She have two teeth.', 'have', 'has'],
    ['They is here.', 'is', 'are'],
    ['She were tired.', 'were', 'was'],
    ['She go out.', 'go', 'goes'],
    ["She don't want it.", "don't", "doesn't"],
    ['She got a apple.', 'a', 'an'],
  ])('[F06-REQ-007] control: listed pair "%s": %s -> %s is accepted', (raw, from, to) => {
    expect(verdict(raw, edit(raw, 'agreement', from, to))).toBeNull();
  });
});
