/// <reference types="node" />
/**
 * D-111 item 4 (founder, 17 Oct 2026): the alpha transcribes English only, and another language needs a
 * native reviewer first. The language picker follows one build switch, `capabilities.englishOnly`
 * (`EXPO_PUBLIC_ENGLISH_ONLY`; capabilities.test.ts pins it per eas.json profile). On: English alone, no
 * search field, and one line from packages/content. Off: every language with search, as before. Both states
 * are tested here, and that a language already stored on the phone is left as it is.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { features, languageCopy } from '@scribe/content';
import { LANGUAGES, searchLanguages } from '@scribe/core';
import { alsoSpokenView, languagePickerView } from '../src/components/language/language-picker.logic';
import { capabilities, setEnglishOnlyForTests } from '../src/lib/capabilities';
import { DEFAULT_SPOKEN, parseSpoken, primaryOf, serializeSpoken, setPrimary } from '../src/lib/language/spoken-language.logic';

const APP = join(__dirname, '..');
const SRC = join(APP, 'src');
const src = (p: string) => readFileSync(join(SRC, p), 'utf8');
const codes = (list: readonly { code: string }[]) => list.map((l) => l.code);

afterEach(() => setEnglishOnlyForTests(null));

describe('[D-111 item 4] flag off: the picker is as before', () => {
  it('offers every language, in the same order, with search and no extra line', () => {
    const view = languagePickerView(false);
    expect(codes(view.languages)).toEqual(codes(LANGUAGES));
    expect(codes(view.languages)).toEqual(['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt']);
    expect(view.search).toBe(true);
    expect(view.note).toBeNull();
  });

  it('search finds what it found before', () => {
    const view = languagePickerView(false);
    for (const q of ['', 'esp', 'hindi', 'हिन्दी', 'chinese', 'arab', 'francais', 'xyz']) {
      expect(codes(searchLanguages(q, view.languages)), q).toEqual(codes(searchLanguages(q)));
    }
    expect(codes(searchLanguages('esp', view.languages))).toEqual(['es']);
  });

  it('is what the build gives when the switch is off', () => {
    setEnglishOnlyForTests(false);
    expect(languagePickerView(capabilities.englishOnly)).toBe(languagePickerView(false));
    setEnglishOnlyForTests(null);
    expect(languagePickerView(capabilities.englishOnly)).toBe(languagePickerView(false));
  });
});

describe('[D-111 item 4] flag on: English only', () => {
  it('offers English alone, with no search field and the one line from packages/content', () => {
    const view = languagePickerView(true);
    expect(codes(view.languages)).toEqual(['en']);
    expect(view.languages[0]).toBe(LANGUAGES.find((l) => l.code === 'en'));
    expect(view.search).toBe(false);
    expect(view.note).toBe(languageCopy.picker.englishOnly);
  });

  it('no other language can be reached through it, by any of its names', () => {
    const view = languagePickerView(true);
    for (const l of LANGUAGES) {
      for (const q of [l.english, l.native, l.code, ...l.aliases]) {
        expect(codes(searchLanguages(q, view.languages)).filter((c) => c !== 'en'), `${l.code} ${q}`).toEqual([]);
      }
    }
  });

  it('is what the build gives when the switch is on, and the same object each time (the picker memos on it)', () => {
    setEnglishOnlyForTests(true);
    expect(languagePickerView(capabilities.englishOnly)).toBe(languagePickerView(true));
    expect(languagePickerView(true)).toBe(languagePickerView(true));
    expect(languagePickerView(true).languages).toBe(languagePickerView(true).languages);
  });
});

describe('[D-111 item 4] the line under the list', () => {
  const line = languageCopy.picker.englishOnly;

  it('lives in packages/content with the other picker words, where the content rules read it', () => {
    expect(features.language.picker.englishOnly).toBe(line);
  });

  it('is one plain sentence that says other languages come later', () => {
    expect(line.trim()).toBe(line);
    expect(line).toMatch(/^[A-Z][^.!?]*\.$/);
    expect(line).toMatch(/\bother languages\b/i);
    expect(line).toMatch(/\blater update\b/i);
  });

  it('promises no date and uses no fear or loss words', () => {
    expect(line).not.toMatch(/\d/);
    expect(line).not.toMatch(
      /\b(soon|shortly|tomorrow|next (week|month|year)|this (week|month|year)|january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|saturday|sunday|q[1-4])\b/i,
    );
    expect(line).not.toMatch(/\b(lose|lost|miss|missing|sorry|unfortunately|can'?t|cannot|only)\b/i);
  });

  it('obeys the character rules: no em or en dash, curly quote, ellipsis or emoji', () => {
    expect(line).not.toMatch(/[\u2013\u2014\u2018\u2019\u201C\u201D\u2026]/);
    expect(line).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

describe('[D-111 item 4] the picker reads the view, and nothing else reads the switch', () => {
  it('language-picker.tsx lists, searches and notes through languagePickerView(capabilities.englishOnly)', () => {
    const picker = src('components/language/language-picker.tsx');
    expect(picker).toMatch(/const view = languagePickerView\(capabilities\.englishOnly\);/);
    expect(picker).toMatch(/searchLanguages\(query, view\.languages\)/);
    expect(picker).toMatch(/\{view\.search \? \(\s*<View[^>]*>\s*<TextField/);
    expect(picker).toMatch(/\{view\.note \? \(\s*<Text[^>]*>\s*\{view\.note\}/);
    // No path left that lists every language whatever the build says.
    expect(picker).not.toMatch(/searchLanguages\(query\)/);
    expect(picker).not.toMatch(/searchLanguages\(''\)/);
  });

  it('both places that choose a language use this picker (Settings and first run)', () => {
    expect(src('app/settings/language.tsx')).toMatch(/<LanguagePicker\b/);
    expect(src('app/onboarding.tsx')).toMatch(/<LanguagePicker\b/);
  });

  it('only capabilities.ts, the picker, the Spoken language screen and the queue\'s language hold (transcription-queue, N2 on #247) mention the switch: no store, sync, rules or pack code reads it', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const n of readdirSync(dir)) {
        const f = join(dir, n);
        if (statSync(f).isDirectory()) walk(f);
        else if (/\.(ts|tsx)$/.test(n)) files.push(f);
      }
    };
    walk(SRC);
    const readers = files.filter((f) => /englishOnly|ENGLISH_ONLY/.test(readFileSync(f, 'utf8'))).map((f) => relative(SRC, f).split('\\').join('/'));
    expect(readers.sort()).toEqual([
      'app/settings/language.tsx',
      'components/language/language-picker.logic.ts',
      'components/language/language-picker.tsx',
      'lib/capabilities.ts',
      'lib/transcription-queue/index.ts',
      'lib/transcription-queue/language-hold.ts',
    ]);
  });
});

describe('[D-111 item 4] Settings, Spoken language: nothing to add means no Add row and no "two more" line', () => {
  it('off: the section, the Add row and the footer line, as before, whatever is listed', () => {
    for (const listed of [0, 1, 2]) expect(alsoSpokenView(false, listed), String(listed)).toEqual({ section: true, add: true, footer: true });
  });

  it('on: no Add row and no footer line; languages already listed stay (with Remove); none listed, no section', () => {
    expect(alsoSpokenView(true, 0)).toEqual({ section: false, add: false, footer: false });
    for (const listed of [1, 2]) expect(alsoSpokenView(true, listed), String(listed)).toEqual({ section: true, add: false, footer: false });
  });

  it('settings/language.tsx follows it, and the chosen language row stays outside it', () => {
    const screen = src('app/settings/language.tsx');
    expect(screen).toMatch(/const also = alsoSpokenView\(capabilities\.englishOnly, spoken\.others\.length\);/);
    expect(screen).toMatch(/\{also\.section \? \(\s*<ListSection title=\{t\.othersTitle\} footer=\{also\.footer \? t\.othersFooter : undefined\}>/);
    expect(screen).toMatch(/\{also\.add \? \(\s*<ListRow title=\{full \? t\.addLanguageFull : t\.addLanguage\}/);
    expect(screen.match(/t\.othersFooter/g)?.length).toBe(1);
    expect(screen.match(/setPicker\('add'\)/g)?.length).toBe(1);
    // The primary row is not behind the switch.
    const primary = screen.slice(screen.indexOf('<ListSection title={t.primaryTitle}'), screen.indexOf('{also.section'));
    expect(primary).toMatch(/<LanguageRow\s+first\s+code=\{primary\.code\}/);
    expect(primary).not.toMatch(/also\.|englishOnly/);
  });
});

describe('[D-111 item 4] a language already stored on the phone is left as it is', () => {
  it('a Spanish choice made on a development build reads back as Spanish with the switch on or off', () => {
    const stored = serializeSpoken(setPrimary(DEFAULT_SPOKEN, 'es', null));
    for (const on of [false, true]) {
      setEnglishOnlyForTests(on);
      expect(primaryOf(parseSpoken(stored)).code, String(on)).toBe('es');
      expect(parseSpoken(stored), String(on)).toEqual({ languages: [{ code: 'es' }, { code: 'en' }] });
    }
  });
});
