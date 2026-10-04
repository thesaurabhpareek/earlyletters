/**
 * Phonetic keys for names the parent has taught (ADR 0014). One key per
 * name, comparable across scripts: Devanagari and Arabic are romanized by
 * table, Chinese by toneless pinyin, Latin by each language's spelling
 * rewrites. Keys only ever SUGGEST a dictionary term; nothing is applied
 * without the parent, and caseless scripts never get similarity fixes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileRules, ENGLISH_RULES, soundAlikeTerms, soundKey, type DictionaryTerm, type LanguageCode, type TextRulesPack } from '../src';

const DIR = join(__dirname, '../../../packs/text-rules');
const rules = (l: LanguageCode) => compileRules(l, JSON.parse(readFileSync(join(DIR, `${l}.json`), 'utf8')) as TextRulesPack);

describe('phoneticKey: the same name in two scripts meets at one key', () => {
  it.each<[LanguageCode, string, string]>([
    ['hi', 'मीरा', 'Mira'],
    ['hi', 'आशा', 'Asha'],
    ['hi', 'प्रिया', 'Priya'],
    ['hi', 'कमल', 'Kamal'],
    ['hi', 'ज़ोया', 'Zoya'],
    ['ar', 'ميرا', 'Mira'],
    ['ar', 'محمد', 'Mohammed'],
    ['ar', 'عمر', 'Omar'],
    ['ar', 'أحمد', 'Ahmed'],
    ['ar', 'نور', 'Noor'],
    ['ar', 'ياسمين', 'Yasmin'],
    ['zh', '米拉', 'Mila'],
    ['zh', '米拉', 'Mǐlā'],
    ['zh', '米拉', '蜜拉'],
    ['zh', '開心', '开心'],
    ['es', 'Lucía', 'Lucia'],
    ['es', 'Guillermo', 'Giyermo'],
    ['es', 'Jimena', 'Gimena'],
    ['fr', 'Chloé', 'Chloe'],
    ['fr', 'Philippe', 'Filipe'],
    ['pt', 'Lívia', 'Livia'],
    ['pt', 'Mariazinha', 'Mariazina'],
  ])('%s: %s ~ %s', (l, a, b) => {
    const R = rules(l);
    expect(R.phoneticKey(a)).not.toBe('');
    expect(R.phoneticKey(a)).toBe(R.phoneticKey(b));
  });

  it.each<[LanguageCode, string, string]>([
    ['hi', 'आशा', 'आरती'],
    ['ar', 'زيد', 'عمر'],
    ['zh', '米拉', '米娜'],
    ['es', 'Lucía', 'Laura'],
  ])('%s: %s and %s stay apart', (l, a, b) => {
    const R = rules(l);
    expect(R.phoneticKey(a)).not.toBe(R.phoneticKey(b));
  });

  it('Hindi schwa: no inherent vowel at the end of a word, one after a bare consonant inside it', () => {
    const R = rules('hi');
    expect(R.romanize('राम')).toBe('ram');
    expect(R.romanize('कमल')).toBe('kamal');
    expect(R.romanize('हिंदी')).toBe('hindi');
    expect(R.romanize('क्या')).toBe('kya');
  });

  it('Chinese: Traditional characters are read through their Simplified form', () => {
    const R = rules('zh');
    expect(R.romanize('媽媽')).toBe('mama');
    expect(R.romanize('妈妈')).toBe('mama');
  });

  it('suggestions only: a homophone is offered for teaching, the term itself is not offered for itself', () => {
    const DICT: DictionaryTerm[] = [{ term: 'मीरा', kind: 'child', heardAs: [] }, { term: 'Mira', kind: 'child', heardAs: [] }];
    expect(soundAlikeTerms('मिरा', DICT, rules('hi')).map((d) => d.term)).toEqual(['मीरा', 'Mira']);
    expect(soundAlikeTerms('मीरा', DICT, rules('hi')).map((d) => d.term)).toEqual(['Mira']);
  });

  it('English: the engine sound key is exactly the legacy soundKey', () => {
    for (const w of ['Usher', 'Asha', 'Mira', 'Mira', 'ah shoe', 'Ashu', 'Ashok', 'Arya', 'moon', 'Isha', 'Aisha', 'Christopher', 'Xavier']) {
      expect(ENGLISH_RULES.soundKey(w), w).toBe(soundKey(w));
    }
  });

  it('caseless scripts never take the similarity path, even with a vetted phonetic table', () => {
    for (const l of ['hi', 'ar', 'zh'] as const) {
      const p = JSON.parse(readFileSync(join(DIR, `${l}.json`), 'utf8')) as TextRulesPack;
      for (const k of ['meaning', 'phonetic'] as const) p[k].review = { status: 'native-reviewed' };
      expect(compileRules(l, p).can.nameSimilarity, l).toBe(false);
    }
  });
});
