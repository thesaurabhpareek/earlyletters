/// <reference types="node" />
/**
 * BL-1312 (NS-17 language rows, part 1). A language is offered only when the build lists it in
 * EXPO_PUBLIC_SPOKEN_LANGUAGES; the first store build hears English only and promises no other; a compact-tier phone
 * is offered only what a compact model can run. Pure code and eas.json as they are on develop; Fictional Asha family.
 *
 * Mutations these tests were written to catch (each failed a test here when it was made):
 *  M1 languagePickerView ignores `heard` and returns every language (NS-17-R1, FR-LOC-01);
 *  M2 eas.json `production` lists `en,es` (FR-LOC-02, NS-17-R1);
 *  M3 languagesOnHold returns [] while English-only is on (NS-17-R1, NS-17-R10 side);
 *  M4 the compact column of LANGUAGE_MODELS.en emptied (NS-17-R12).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { languageCopy, screenStates } from '@scribe/content';
import { LANGUAGES } from '@scribe/core';
import { alsoSpokenView, languagePickerView } from '../src/components/language/language-picker.logic';
import { showOnboardingLanguageRow } from '../src/components/onboarding/language-row.logic';
import { parseLanguageList, parseServerFeatures } from '../src/lib/capabilities';
import { heardLanguages, hearsOnlyEnglish } from '../src/lib/language/heard-languages';
import { LANGUAGE_MODELS, SPEECH_LANGUAGES, asrModelFor } from '../src/lib/models/catalog';
import { languagesOnHold } from '../src/lib/transcription-queue/language-hold';

const eas = JSON.parse(readFileSync(join(__dirname, '..', 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
const STORE_PROFILES = ['production', 'preview', 'testflight'] as const;
const codes = (list: readonly { code: string }[]) => list.map((l) => l.code);
const strings = (o: unknown): string[] => (typeof o === 'string' ? [o] : o && typeof o === 'object' ? Object.values(o).flatMap(strings) : []);

describe('[NS-17-R1] ungated languages are absent', () => {
  for (const name of STORE_PROFILES) {
    const env = eas.build[name].env ?? {};
    const listed = parseLanguageList(env.EXPO_PUBLIC_SPOKEN_LANGUAGES);
    const englishOnly = parseServerFeatures(env.EXPO_PUBLIC_ENGLISH_ONLY);

    it(`[FR-LOC-01] ${name}: every picker, row and hold reads the build's list, and only English is on it`, () => {
      expect(listed, name).toEqual(['en']);
      // The build as written, and the list alone with the English-only switch off (the stricter switch must not be what saves it).
      for (const only of [englishOnly, false]) {
        const heard = heardLanguages(only, listed);
        const allowed = new Set(['en', ...(listed ?? [])]);
        for (const l of codes(languagePickerView(heard).languages)) expect(allowed.has(l), `${name} picker ${l}`).toBe(true);
        expect(codes(languagePickerView(heard).languages), name).toEqual(['en']);
        expect(hearsOnlyEnglish(heard), name).toBe(true);
        expect(showOnboardingLanguageRow(hearsOnlyEnglish(heard)), `${name} first-run row`).toBe(false);
        expect(alsoSpokenView(heard, 0), `${name} Add row`).toEqual({ section: false, add: false, footer: false });
        // Whatever the person stored, a language the build does not list is never handed to the recogniser.
        expect([...languagesOnHold(only)].sort(), name).toEqual(only ? SPEECH_LANGUAGES.filter((l) => l !== 'en').sort() : []);
      }
    });
  }

  it('[FR-LOC-01] a language shows only when the list names it: each of the six is absent until listed, present once listed', () => {
    for (const l of SPEECH_LANGUAGES.filter((x) => x !== 'en')) {
      expect(codes(languagePickerView(heardLanguages(false, ['en'])).languages), `${l} unlisted`).not.toContain(l);
      expect(codes(languagePickerView(heardLanguages(false, ['en', l])).languages), `${l} listed`).toEqual(['en', l]);
      // A list that names another language never lets this one in.
      const other = SPEECH_LANGUAGES.find((x) => x !== 'en' && x !== l)!;
      expect(codes(languagePickerView(heardLanguages(false, ['en', other])).languages), `${l} beside ${other}`).not.toContain(l);
    }
  });

  it('[FR-LOC-01] English is always heard, even from a list that does not name it, and a code the app does not know is ignored', () => {
    expect(codes(languagePickerView(heardLanguages(false, ['es'])).languages)).toEqual(['en', 'es']);
    expect(codes(languagePickerView(heardLanguages(false, ['xx', 'de'])).languages)).toEqual(['en']);
  });

  it('the picker offers languages the app knows and nothing else (the catalog and the language list agree)', () => {
    expect(codes(LANGUAGES)).toEqual([...SPEECH_LANGUAGES]);
  });
});

describe('[NS-17-R5] another language is one tap from Review', () => {
  const r = screenStates.otherLanguage;

  it('the approved words exist: one link on Review, a hint that says the recording stays', () => {
    expect(r.markLink).toBe('This was in another language');
    expect(r.markHintA11y).toMatch(/recording stays with this letter/i);
    expect(r.setAsideToast).toBe('Words set aside.');
  });

  it('the words never say translate, detect, mixed or wrong, and promise no later language', () => {
    for (const s of strings(r)) {
      expect(s, s).not.toMatch(/translat|transliterat|detect|mixed|broken|wrong|later|soon|coming/i);
    }
  });

  // The one-tap mark is not built: nothing in apps/mobile reads `otherLanguage.markLink`, and no withheld state exists
  // on a draft or letter. Reported as its own row; a todo, not a test that passes by asserting nothing.
  it.todo('[NS-17-R5] Review offers one tap to mark a take as another language: transcript out of view, audio kept, letter waiting');
});

describe('[FR-LOC-02] the first store build hears English only and promises no other', () => {
  it('production lists English alone, with the English-only switch on', () => {
    const env = eas.build.production.env ?? {};
    expect(parseLanguageList(env.EXPO_PUBLIC_SPOKEN_LANGUAGES)).toEqual(['en']);
    expect(parseServerFeatures(env.EXPO_PUBLIC_ENGLISH_ONLY)).toBe(true);
  });

  it('no line in the language copy or the picker promises another language, later or soon', () => {
    for (const s of strings(languageCopy)) {
      expect(s, s).not.toMatch(/\b(later|soon|coming|update|will be|next release)\b/i);
    }
    expect(languageCopy.picker.englishOnly).toBe('This version writes down letters spoken in English.');
  });
});

describe('[NS-17-R12] a compact-tier phone offers only languages that passed on it', () => {
  // What can be tested today: every language a build lists has a model its compact tier can load, so a language that
  // exists only on the full tier is never in a store list. The per-tier gate list itself (a language passed on full
  // and not on compact) has no data or code yet; reported as its own row.
  it('every language the production build lists has a compact model, and the compact choice resolves', () => {
    const listed = parseLanguageList(eas.build.production.env?.EXPO_PUBLIC_SPOKEN_LANGUAGES) ?? [];
    expect(listed.length).toBeGreaterThan(0);
    for (const l of listed) {
      const lang = l as (typeof SPEECH_LANGUAGES)[number];
      expect(LANGUAGE_MODELS[lang].compact.length, `${l} compact`).toBeGreaterThan(0);
      expect(asrModelFor(lang, 'compact').id, l).toBe(LANGUAGE_MODELS[lang].compact[0]);
    }
  });
});
