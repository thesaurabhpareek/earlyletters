/**
 * Pure tests for the spoken-language setting. Lives beside its module
 * because the language agent owns only src/lib/language; the coordinator
 * may move it to apps/mobile/test/ (vitest.config.ts includes only the test
 * folder). Until then it runs with a config that includes this folder.
 */
import { describe, expect, it } from 'vitest';
import {
  addLanguage,
  bcp47Of,
  DEFAULT_SPOKEN,
  formatBytes,
  letterInputProps,
  MAX_LANGUAGES,
  parseSpoken,
  reconcilePrimary,
  removeLanguage,
  serializeSpoken,
  setPrimary,
  updateLanguage,
  withDefaults,
} from './spoken-language.logic';

describe('spoken languages setting', () => {
  it('defaults to English and survives anything stored', () => {
    expect(parseSpoken(null)).toEqual(DEFAULT_SPOKEN);
    expect(parseSpoken('not json')).toEqual(DEFAULT_SPOKEN);
    expect(parseSpoken('{"languages":[]}')).toEqual(DEFAULT_SPOKEN);
    expect(parseSpoken('{"languages":[{"code":"de"},{"code":"hi"},{"code":"hi"},{"code":"zh","script":"Latn"}]}')).toEqual({
      languages: [{ code: 'hi' }, { code: 'zh' }],
    });
  });

  it('round-trips through the settings string', () => {
    const s = { languages: [{ code: 'zh' as const, script: 'Hant' as const }, { code: 'pt' as const, region: 'pt-PT' }] };
    expect(parseSpoken(serializeSpoken(s))).toEqual(s);
  });

  it('a primary plus up to two more; the primary is changed, never removed', () => {
    let s = DEFAULT_SPOKEN;
    s = addLanguage(s, 'hi', 'en-IN');
    s = addLanguage(s, 'es', 'en-US');
    s = addLanguage(s, 'fr', 'en-US');
    expect(s.languages.map((l) => l.code)).toEqual(['en', 'hi', 'es']);
    expect(s.languages).toHaveLength(MAX_LANGUAGES);
    expect(removeLanguage(s, 'en')).toBe(s);
    expect(removeLanguage(s, 'hi').languages.map((l) => l.code)).toEqual(['en', 'es']);
  });

  it('changing the primary keeps the old one when there is room', () => {
    const s = setPrimary(addLanguage(DEFAULT_SPOKEN, 'hi', null), 'pt', 'pt-PT');
    expect(s.languages).toEqual([{ code: 'pt', region: 'pt-PT' }, { code: 'en' }, { code: 'hi' }]);
    expect(setPrimary(s, 'hi', null).languages.map((l) => l.code)).toEqual(['hi', 'pt', 'en']);
  });

  it('per-author defaults from the device locale: Taiwan and Hong Kong write Traditional; Portugal spells pt-PT', () => {
    expect(withDefaults('zh', 'zh-Hant-TW')).toEqual({ code: 'zh', script: 'Hant' });
    expect(withDefaults('zh', 'en-HK')).toEqual({ code: 'zh', script: 'Hant' });
    expect(withDefaults('zh', 'zh-CN')).toEqual({ code: 'zh', script: 'Hans' });
    expect(withDefaults('pt', 'en-PT')).toEqual({ code: 'pt', region: 'pt-PT' });
    expect(withDefaults('pt', 'pt-BR')).toEqual({ code: 'pt', region: 'pt-BR' });
    expect(withDefaults('ar', 'ar-EG')).toEqual({ code: 'ar' }); // no dialect setting: dialect text is never normalised
  });

  it('the speech engine primary (set by onboarding) moves to the front', () => {
    const s = addLanguage(DEFAULT_SPOKEN, 'hi', null);
    expect(reconcilePrimary(s, 'hi', null).languages.map((l) => l.code)).toEqual(['hi', 'en']);
    expect(reconcilePrimary(s, 'zh', 'zh-TW').languages[0]).toEqual({ code: 'zh', script: 'Hant' });
    expect(reconcilePrimary(s, null, null)).toBe(s);
  });

  it('script and spelling are per author and change only that language', () => {
    const s = updateLanguage({ languages: [{ code: 'zh', script: 'Hans' }, { code: 'pt', region: 'pt-BR' }] }, 'zh', { script: 'Hant' });
    expect(s.languages).toEqual([{ code: 'zh', script: 'Hant' }, { code: 'pt', region: 'pt-BR' }]);
    expect(bcp47Of(s.languages[0])).toBe('zh-Hant');
    expect(bcp47Of(s.languages[1])).toBe('pt-BR');
    expect(bcp47Of({ code: 'hi' })).toBe('hi');
  });

  it('typed letter text: the keyboard autocorrects, Arabic is right to left', () => {
    expect(letterInputProps('en')).toMatchObject({ autoCorrect: true, spellCheck: true, style: { writingDirection: 'ltr', textAlign: 'left' } });
    expect(letterInputProps('ar').style).toEqual({ writingDirection: 'rtl', textAlign: 'right' });
  });

  it('sizes read the way people read them', () => {
    expect(formatBytes(5083)).toBe('5 KB');
    expect(formatBytes(62158)).toBe('62 KB');
    expect(formatBytes(1_400_000)).toBe('1.4 MB');
    expect(formatBytes(574_000_000)).toBe('574 MB');
  });
});
