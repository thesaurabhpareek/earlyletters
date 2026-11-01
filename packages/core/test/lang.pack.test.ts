/**
 * Text-rules packs (ADR 0014): every source pack is valid, the bundled
 * English pack matches its JSON, and the validator refuses anything the
 * engine should not read. Packs are data; nothing here can make them code.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  compileRules,
  ENGLISH_PACK,
  LANGUAGE_CODES,
  LANGUAGES,
  PACK_LIMITS,
  defaultChineseScript,
  defaultRegion,
  searchLanguages,
  textRulesPackId,
  toLanguageCode,
  validatePack,
  validatePackJson,
  type LanguageCode,
  type TextRulesPack,
} from '../src';

const DIR = join(__dirname, '../../../packs/text-rules');
const text = (l: string) => readFileSync(join(DIR, `${l}.json`), 'utf8');
const load = (l: LanguageCode) => JSON.parse(text(l)) as TextRulesPack;
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));

describe('source packs', () => {
  it.each(LANGUAGE_CODES.filter((l) => l !== 'en'))('%s.json is a valid pack for its language', (l) => {
    const v = validatePackJson(text(l), { expectLanguage: l });
    expect(v.ok ? [] : v.errors).toEqual([]);
  });

  it('the bundled English pack is valid and identical to packs/text-rules/en.json (regenerate the JSON if this fails)', () => {
    expect(validatePack(clone(ENGLISH_PACK)).ok).toBe(true);
    expect(JSON.parse(text('en'))).toEqual(clone(ENGLISH_PACK));
  });

  it('every downloadable pack stays small (budget: zh under 100 KB, the rest under 16 KB)', () => {
    for (const l of LANGUAGE_CODES.filter((x) => x !== 'en')) {
      const bytes = Buffer.byteLength(JSON.stringify(load(l)));
      expect(bytes, l).toBeLessThan(l === 'zh' ? 100_000 : 16_000);
      expect(bytes).toBeLessThan(PACK_LIMITS.maxBytes);
    }
  });

  it('no non-English pack ships a word table that removes words before a native speaker signs it off', () => {
    for (const l of LANGUAGE_CODES.filter((x) => x !== 'en')) {
      const p = load(l);
      for (const t of [p.fillers, p.meaning, p.repeats, p.phonetic]) expect(t.review.status, l).toBe('draft');
      const R = compileRules(l, p);
      expect(R.can.fillers || R.can.removals || R.can.agreement || R.can.nameSimilarity, l).toBe(false);
    }
  });

  it('Chinese tables: one-to-one conversions only, ambiguous characters left out', () => {
    const p = load('zh');
    const map = (t: { from: string; to: string }) => new Map([...t.from].map((c, i) => [c, [...t.to][i]]));
    const toHans = map(p.scriptVariants!.targets.Hans!);
    const toHant = map(p.scriptVariants!.targets.Hant!);
    expect(toHans.size).toBeGreaterThan(2500);
    expect(toHant.size).toBeGreaterThan(2000);
    expect(toHans.get('們')).toBe('们');
    expect(toHans.get('開')).toBe('开');
    expect(toHans.get('發')).toBe('发');
    expect(toHans.get('乾')).toBeUndefined(); // 干 or 乾 (乾坤): ambiguous
    expect(toHant.get('们')).toBe('們');
    expect(toHant.get('发')).toBeUndefined(); // 發 or 髮
    expect(toHant.get('后')).toBeUndefined(); // 後 or 后
    expect(toHant.get('面')).toBeUndefined(); // 面 or 麵
    expect(Object.values(p.phonetic.syllables!).join('').length).toBe(6763);
    expect(p.attribution.join(' ')).toMatch(/Apache License 2\.0/);
  });
});

describe('validatePack refuses what the engine must not read', () => {
  const es = () => clone(load('es')) as unknown as Record<string, any>;
  const errors = (p: unknown, opts = {}) => {
    const v = validatePack(p, opts);
    return v.ok ? [] : v.errors;
  };

  it.each<[string, (p: Record<string, any>) => void, RegExp]>([
    ['an unknown key at the top', (p) => (p.script_runner = 'x'), /unknown_key/],
    ['an unknown key in a table', (p) => (p.fillers.regex = '.*'), /unknown_key/],
    ['a different kind', (p) => (p.kind = 'speech-model'), /not_text_rules/],
    ['a newer engine than this app', (p) => (p.engine = 99), /engine_too_new/],
    ['a script fact that contradicts the app (Spanish caseless)', (p) => (p.script.cased = false), /does_not_match_language/],
    ['a bidi override hidden in a word', (p) => p.fillers.auto.push('e‮m'), /control_or_bidi/],
    ['a decomposed accent (not NFC)', (p) => p.meaning.negations.push('jamás'), /not_nfc/],
    ['two words in one entry', (p) => p.fillers.auto.push('o sea'), /not_single_word/],
    ['code-like text as a word', (p) => p.fillers.auto.push('__proto__'), /not_single_word/],
    ['a filler that negates', (p) => p.fillers.auto.push('nunca'), /filler_carries_meaning/],
    ['a filler that is a number', (p) => p.fillers.suggest.push('dos'), /filler_carries_meaning/],
    ['a filler that is a family word', (p) => p.fillers.auto.push('mamá'), /filler_carries_meaning/],
    ['a negation as an always-removed repeat', (p) => p.repeats.always.push('no'), /negation_is_never_a_stumble/],
    ['an agreement group across a negation', (p) => p.meaning.agreementGroups.push(['puede', 'no']), /agreement_crosses_negation|agreement_contains_modal/],
    ['a comma that becomes a question', (p) => (p.punctuation.localForms[','] = '?'), /changes_mood/],
    ['a full stop that becomes a comma', (p) => (p.punctuation.localForms['.'] = ','), /full_stop_must_stay_a_sentence_end/],
    ['a letter as a punctuation mark', (p) => (p.punctuation.terminal = 'x'), /not_a_single_mark/],
    ['a question mark as the terminal', (p) => p.punctuation.sentenceEnd.push('?') && (p.punctuation.terminal = '?'), /terminal_sets_mood/],
    ['an apostrophe as a quote', (p) => p.punctuation.quotes.push('’'), /apostrophe_is_not_a_quote/],
    ['dropping a real letter from the final text', (p) => p.normalization.dropFromFinal.push('a'), /not_droppable/],
    ['dropping zero-width non-joiner', (p) => p.normalization.dropFromFinal.push('‌'), /not_droppable/],
    ['a phonetic value that is not plain Latin', (p) => (p.phonetic.romanize['ñ'] = 'ñ'), /value_not_lowercase_latin/],
    ['a rewrite rule that is a pattern', (p) => p.phonetic.rewrite.push({ from: '.*', to: '' }), /not_allowed_value/],
    ['a version that is not semver', (p) => (p.version = '1.0'), /not_semver/],
  ])('%s', (_, mutate, code) => {
    const p = es();
    mutate(p);
    expect(errors(p).join('\n')).toMatch(code);
  });

  it('refuses a pack for another language than the manifest says', () => {
    expect(errors(load('es'), { expectLanguage: 'pt' })).toEqual(['$.language: not_the_expected_language']);
  });

  it('refuses Arabic declared left to right, and a Chinese pack that segments by spaces', () => {
    const ar = clone(load('ar')) as unknown as Record<string, any>;
    ar.script.direction = 'ltr';
    expect(errors(ar).join()).toMatch(/direction: does_not_match_language/);
    const zh = clone(load('zh')) as unknown as Record<string, any>;
    zh.script.segmentation = 'space';
    expect(errors(zh).join()).toMatch(/segmentation: does_not_match_language/);
  });

  it('script variant maps must be one-to-one letters in the BMP', () => {
    const base = () => clone(load('zh')) as unknown as Record<string, any>;
    const a = base();
    a.scriptVariants.targets.Hans = { from: '們發', to: '们' };
    expect(errors(a).join()).toMatch(/lengths_differ/);
    const b = base();
    b.scriptVariants.targets.Hans = { from: '們', to: '們' };
    expect(errors(b).join()).toMatch(/maps_to_itself/);
    const c = base();
    c.scriptVariants.targets.Hans = { from: '𠀀', to: '们' };
    expect(errors(c).join()).toMatch(/outside_bmp/);
    const d = base();
    d.scriptVariants.targets.Latn = { from: 'a', to: 'b' };
    expect(errors(d).join()).toMatch(/not_a_script_of_this_language/);
  });

  it('refuses bytes that are too large or not JSON, before parsing', () => {
    expect(validatePackJson('x'.repeat(PACK_LIMITS.maxBytes + 1))).toEqual({ ok: false, errors: ['$: too_large'] });
    expect(validatePackJson('{"kind":')).toEqual({ ok: false, errors: ['$: not_json'] });
  });

  it('errors are codes with a path, never pack content', () => {
    const p = es();
    p.fillers.auto.push('secreto‮');
    for (const e of errors(p)) expect(e).not.toMatch(/secreto/);
  });
});

describe('safe mode and language facts', () => {
  it('a language whose pack is not on the phone gets script facts only', () => {
    for (const l of LANGUAGE_CODES.filter((x) => x !== 'en')) {
      const R = compileRules(l, null);
      expect(R.packVersion).toBeNull();
      expect(R.can).toEqual({ fillers: false, removals: false, agreement: false, nameSimilarity: false, punctuation: false, house: false, scriptVariants: false });
    }
  });

  it('a pack for the wrong language is ignored rather than misread', () => {
    expect(compileRules('pt', load('es')).packVersion).toBeNull();
  });

  it('a draft punctuation profile is not applied', () => {
    const p = clone(load('zh'));
    p.punctuation.review = { status: 'draft' };
    expect(compileRules('zh', p).can.punctuation).toBe(false);
  });

  it('pack ids, names and defaults', () => {
    expect(textRulesPackId('pt')).toBe('text-rules.pt');
    expect(LANGUAGES.map((l) => l.native)).toEqual(['English', 'हिन्दी', 'Español', '中文', 'Français', 'العربية', 'Português']);
    expect(toLanguageCode('pt-BR')).toBe('pt');
    expect(toLanguageCode('zh_Hant_TW')).toBe('zh');
    expect(toLanguageCode('de')).toBeNull();
    expect(defaultChineseScript('zh-TW')).toBe('Hant');
    expect(defaultChineseScript('zh-Hant-HK')).toBe('Hant');
    expect(defaultChineseScript('zh-HK')).toBe('Hant');
    expect(defaultChineseScript('zh-CN')).toBe('Hans');
    expect(defaultChineseScript('en-US')).toBe('Hans');
    expect(defaultRegion('pt', 'pt-PT')).toBe('pt-PT');
    expect(defaultRegion('pt', 'pt_AO')).toBe('pt-PT');
    expect(defaultRegion('pt', 'pt-BR')).toBe('pt-BR');
    expect(defaultRegion('pt', 'en-US')).toBe('pt-BR');
    expect(defaultRegion('pt', 'en-PT')).toBe('pt-PT'); // an English phone in Lisbon
    expect(defaultChineseScript('en-TW')).toBe('Hant'); // an English phone in Taipei
    expect(defaultChineseScript('zh-Hans-HK')).toBe('Hans');
    expect(defaultRegion('es', 'es-MX')).toBeNull();
  });

  it('search finds a language by English name, its own name, or another spelling, ignoring accents', () => {
    const codes = (q: string) => searchLanguages(q).map((l) => l.code);
    expect(codes('span')).toEqual(['es']);
    expect(codes('espanol')).toEqual(['es']);
    expect(codes('mandarin')).toEqual(['zh']);
    expect(codes('普通话')).toEqual(['zh']);
    expect(codes('繁體')).toEqual([]);
    expect(codes('عربي')).toEqual(['ar']);
    expect(codes('हिंदी')).toEqual(['hi']);
    expect(codes('portugues')).toEqual(['pt']);
    expect(codes('')).toHaveLength(7);
  });
});
