/// <reference types="node" />
/**
 * D-125 item 2: a language unlocks one at a time, in the release whose listing names it. The build-time list
 * `EXPO_PUBLIC_SPOKEN_LANGUAGES` (lib/capabilities.ts) and the English-only switch give one answer,
 * heardLanguagesForBuild (lib/language/heard-languages.ts), which the picker, the Spoken language screen, first run's
 * language row and the queue's language hold read. Today every store and alpha profile writes `en`, so those builds
 * behave exactly as before (config.test.ts and capabilities.test.ts pin eas.json); these tests cover the list itself.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { languageCopy } from '@scribe/content';
import { LANGUAGES } from '@scribe/core';
import { alsoSpokenView, languagePickerView } from '../src/components/language/language-picker.logic';
import { showOnboardingLanguageRow } from '../src/components/onboarding/language-row.logic';
import { parseLanguageList, setEnglishOnlyForTests, setSpokenLanguagesForTests, spokenLanguagesListed } from '../src/lib/capabilities';
import { heardLanguages, heardLanguagesForBuild, hearsOnlyEnglish } from '../src/lib/language/heard-languages';
import { SPEECH_LANGUAGES } from '../src/lib/models/catalog';
import { languagesOnHold } from '../src/lib/transcription-queue/language-hold';

const codes = (list: readonly { code: string }[]) => list.map((l) => l.code);

afterEach(() => {
  setEnglishOnlyForTests(null);
  setSpokenLanguagesForTests(undefined);
});

describe('[D-125 item 2] parseLanguageList: the list as written', () => {
  it('unset or blank is no list', () => {
    for (const raw of [undefined, null, '', ' ', ',', ' , ,']) expect(parseLanguageList(raw), String(raw)).toBeNull();
  });

  it('trims, lower-cases and keeps each code once, in the order written', () => {
    expect(parseLanguageList('en')).toEqual(['en']);
    expect(parseLanguageList(' EN , es,es, Fr ')).toEqual(['en', 'es', 'fr']);
    expect(parseLanguageList('es,,pt')).toEqual(['es', 'pt']);
  });

  it('is unset in this process, so the tests see the build as before', () => {
    expect(process.env.EXPO_PUBLIC_SPOKEN_LANGUAGES).toBeUndefined();
    expect(spokenLanguagesListed()).toBeNull();
  });
});

describe('[D-125 item 2] heardLanguages: what the build hears', () => {
  it('no list and the switch off: every language, as before', () => {
    expect(heardLanguages(false, null)).toBe(SPEECH_LANGUAGES);
  });

  it('the English-only switch wins over any list, so the list can only narrow it', () => {
    for (const listed of [null, ['en'], ['en', 'es'], [...SPEECH_LANGUAGES]]) expect(heardLanguages(true, listed)).toEqual(['en']);
  });

  it('English is always heard, the rest follow the catalog order, and unknown codes are ignored', () => {
    expect(heardLanguages(false, ['en'])).toEqual(['en']);
    expect(heardLanguages(false, ['es'])).toEqual(['en', 'es']);
    expect(heardLanguages(false, ['pt', 'es', 'en'])).toEqual(['en', 'es', 'pt']);
    expect(heardLanguages(false, ['es', 'de', 'xx', 'es-mx'])).toEqual(['en', 'es']);
    expect(heardLanguages(false, ['de'])).toEqual(['en']);
    expect(heardLanguages(false, [...SPEECH_LANGUAGES])).toBe(SPEECH_LANGUAGES);
  });

  it('returns the same frozen array for the same answer, so screens can memo on it', () => {
    const a = heardLanguages(false, ['es', 'fr']);
    expect(heardLanguages(false, ['fr', 'es', 'en'])).toBe(a);
    expect(Object.isFrozen(a)).toBe(true);
    expect(heardLanguages(false, ['en'])).toBe(heardLanguages(true, null));
  });

  it('heardLanguagesForBuild reads both switches', () => {
    expect(heardLanguagesForBuild()).toBe(SPEECH_LANGUAGES);
    setSpokenLanguagesForTests(['en']);
    expect(heardLanguagesForBuild()).toEqual(['en']);
    setSpokenLanguagesForTests(['en', 'es']);
    expect(heardLanguagesForBuild()).toEqual(['en', 'es']);
    setEnglishOnlyForTests(true);
    expect(heardLanguagesForBuild()).toEqual(['en']);
    setEnglishOnlyForTests(null);
    setSpokenLanguagesForTests(null);
    expect(heardLanguagesForBuild()).toBe(SPEECH_LANGUAGES);
  });

  it('the override is for tests only', () => {
    const saved = process.env.VITEST;
    delete process.env.VITEST;
    try {
      expect(() => setSpokenLanguagesForTests(['en', 'es'])).toThrow(/tests only/);
    } finally {
      process.env.VITEST = saved;
    }
    expect(spokenLanguagesListed()).toBeNull();
  });
});

describe('[D-125 item 2] the four readers follow the list', () => {
  it('a list of English alone is the English-only build, everywhere', () => {
    const heard = heardLanguages(false, ['en']);
    expect(languagePickerView(heard)).toBe(languagePickerView(true));
    expect(alsoSpokenView(heard, 0)).toEqual(alsoSpokenView(true, 0));
    expect(alsoSpokenView(heard, 1)).toEqual(alsoSpokenView(true, 1));
    expect(languagesOnHold(heard)).toBe(languagesOnHold(true));
    expect(showOnboardingLanguageRow(hearsOnlyEnglish(heard))).toBe(false);
  });

  it('every language is the build as before, everywhere', () => {
    const heard = heardLanguages(false, null);
    expect(languagePickerView(heard)).toBe(languagePickerView(false));
    expect(alsoSpokenView(heard, 0)).toEqual(alsoSpokenView(false, 0));
    expect(languagesOnHold(heard)).toBe(languagesOnHold(false));
    expect(languagesOnHold(heard)).toEqual([]);
    expect(showOnboardingLanguageRow(hearsOnlyEnglish(heard))).toBe(true);
  });

  it('English and Spanish: the picker lists those two in the usual order, with search and the later-update line', () => {
    const view = languagePickerView(heardLanguages(false, ['es']));
    expect(codes(view.languages)).toEqual(['en', 'es']);
    expect(view.languages[1]).toBe(LANGUAGES.find((l) => l.code === 'es'));
    expect(view.search).toBe(true);
    expect(view.note).toBe(languageCopy.picker.englishOnly);
    expect(languagePickerView(heardLanguages(false, ['es', 'en']))).toBe(view);
  });

  it('English and Spanish: every other language waits, English and Spanish never do', () => {
    const held = languagesOnHold(heardLanguages(false, ['es']));
    expect([...held].sort()).toEqual(['ar', 'fr', 'hi', 'pt', 'zh']);
    expect(held).not.toContain('en');
    expect(held).not.toContain('es');
  });

  it('English and Spanish: Settings offers Add and the footer, and first run shows its language row', () => {
    const heard = heardLanguages(false, ['es']);
    expect(alsoSpokenView(heard, 0)).toEqual({ section: true, add: true, footer: true });
    expect(showOnboardingLanguageRow(hearsOnlyEnglish(heard))).toBe(true);
  });
});
