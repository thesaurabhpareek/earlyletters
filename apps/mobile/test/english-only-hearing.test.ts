/// <reference types="node" />
/**
 * D-111 item 4, review N2 on #247: the language picker offers English only in the alpha profiles, but each
 * recording is heard in the language noted for it, and a non-English choice stored before the switch (a `.preview`
 * install made without it) would still reach the recogniser. While the switch is on, such a recording is heard in
 * English, and the person is told on Review and the letter page. The stored choice is never changed, so with the
 * switch off the person's language is heard again. English stored: no notice. Letters whose words were set before
 * the guard are left as they are.
 *
 * The rule (hearing.logic.ts) is pure; the shared function the queue's call sites use (hearing.ts) runs here on a
 * real store (node:sqlite). The queue and the two screens load React Native, so their wiring is pinned by source.
 * Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({ openNativeDb: () => { throw new Error('native opener must not run in tests'); } }));

import { features, languageCopy } from '@scribe/content';
import { capabilities, setEnglishOnlyForTests } from '../src/lib/capabilities';
import {
  AUTHOR_LANGUAGE_KEY,
  authorSpeechLanguage,
  forgetLetterLanguage,
  letterLanguage,
  noteHeardInEnglish,
  rememberLetterLanguage,
  setAuthorSpeechLanguage,
  wasHeardInEnglish,
} from '../src/lib/models/author-language';
import { SPEECH_LANGUAGES } from '../src/lib/models/catalog';
import * as store from '../src/lib/store';
import { heardInEnglishNoteFor, hearing } from '../src/lib/transcription-queue/hearing';
import { heardInEnglishNote, hearingFor } from '../src/lib/transcription-queue/hearing.logic';

const SRC = join(__dirname, '..', 'src');
const src = (p: string) => readFileSync(join(SRC, p), 'utf8');
const OTHERS = SPEECH_LANGUAGES.filter((l) => l !== 'en');
const LINE = languageCopy.heardInEnglish;

afterEach(() => setEnglishOnlyForTests(null));

describe('[D-111 item 4] the rule: switch on, another stored language is heard in English and the person is told', () => {
  it('switch on and a stored language other than English: English, with the notice flagged', () => {
    expect(OTHERS).toEqual(['hi', 'es', 'zh', 'fr', 'ar', 'pt']);
    for (const noted of OTHERS) {
      expect(hearingFor(noted, true), noted).toEqual({ language: 'en', heardInEnglish: true });
      expect(heardInEnglishNote(hearingFor(noted, true).heardInEnglish, true), noted).toBe(LINE);
    }
  });

  it('switch off: the stored language, exactly as before, and no notice', () => {
    for (const noted of SPEECH_LANGUAGES) {
      expect(hearingFor(noted, false), noted).toEqual({ language: noted, heardInEnglish: false });
      expect(heardInEnglishNote(hearingFor(noted, false).heardInEnglish, false), noted).toBeNull();
    }
  });

  it('English stored: English, and no notice, with the switch on or off', () => {
    for (const on of [true, false]) {
      expect(hearingFor('en', on), String(on)).toEqual({ language: 'en', heardInEnglish: false });
      expect(heardInEnglishNote(hearingFor('en', on).heardInEnglish, on), String(on)).toBeNull();
    }
  });

  it('words already heard in English stay English (Review cleans them so); the notice shows only while the switch is on', () => {
    for (const noted of SPEECH_LANGUAGES) {
      for (const on of [true, false]) expect(hearingFor(noted, on, true), `${noted} ${on}`).toEqual({ language: 'en', heardInEnglish: true });
    }
    expect(heardInEnglishNote(true, true)).toBe(LINE);
    expect(heardInEnglishNote(true, false)).toBeNull();
    expect(heardInEnglishNote(false, true)).toBeNull();
    expect(heardInEnglishNote(false, false)).toBeNull();
  });

  it('follows the build switch, capabilities.englishOnly', () => {
    setEnglishOnlyForTests(true);
    expect(hearingFor('es', capabilities.englishOnly)).toEqual({ language: 'en', heardInEnglish: true });
    setEnglishOnlyForTests(false);
    expect(hearingFor('es', capabilities.englishOnly)).toEqual({ language: 'es', heardInEnglish: false });
    setEnglishOnlyForTests(null);
    expect(hearingFor('es', capabilities.englishOnly)).toEqual({ language: 'es', heardInEnglish: false });
  });
});

describe('[D-111 item 4] hearing(id), the one function the call sites share, on a real store', () => {
  let close: () => void = () => {};
  beforeAll(() => {
    const h = nodeDb();
    close = h.close;
    store.closeStore();
    store.openStore({ open: () => ({ db: h.db, close: () => {} }) });
  });
  afterAll(() => {
    store.closeStore();
    close();
  });

  const recording = (n: number) => `0192f0a0-0000-7000-8000-00000000000${n}`;

  it('a Spanish choice stored on the phone: heard in English with the switch on, in Spanish with it off; the choice is never changed', () => {
    setAuthorSpeechLanguage('es');
    const id = recording(1);
    expect(rememberLetterLanguage(id)).toBe('es');

    setEnglishOnlyForTests(true);
    expect(hearing(id)).toEqual({ language: 'en', heardInEnglish: true });
    // Nothing was written: the person's choice and the recording's own language are still Spanish.
    expect(store.getSetting(AUTHOR_LANGUAGE_KEY)).toBe('es');
    expect(authorSpeechLanguage()).toBe('es');
    expect(letterLanguage(id)).toBe('es');

    setEnglishOnlyForTests(false);
    expect(hearing(id)).toEqual({ language: 'es', heardInEnglish: false });
    expect(heardInEnglishNoteFor(id)).toBeNull();
  });

  it('the notice shows once the words were heard in English, and only while the switch is on', () => {
    setAuthorSpeechLanguage('es');
    const id = recording(2);
    rememberLetterLanguage(id);
    setEnglishOnlyForTests(true);
    expect(heardInEnglishNoteFor(id)).toBeNull(); // no words yet
    noteHeardInEnglish(id); // the queue does this with the words
    expect(wasHeardInEnglish(id)).toBe(true);
    expect(heardInEnglishNoteFor(id)).toBe(LINE);

    // Its words are English, so with the switch off later it is still read and cleaned as English, with no notice.
    setEnglishOnlyForTests(false);
    expect(hearing(id)).toEqual({ language: 'en', heardInEnglish: true });
    expect(heardInEnglishNoteFor(id)).toBeNull();
    // The person's choice is still Spanish: new recordings are heard in Spanish again.
    const next = recording(3);
    rememberLetterLanguage(next);
    expect(hearing(next)).toEqual({ language: 'es', heardInEnglish: false });
  });

  it('English stored: English and no notice', () => {
    setAuthorSpeechLanguage('en');
    const id = recording(4);
    rememberLetterLanguage(id);
    for (const on of [true, false]) {
      setEnglishOnlyForTests(on);
      expect(hearing(id), String(on)).toEqual({ language: 'en', heardInEnglish: false });
      expect(heardInEnglishNoteFor(id), String(on)).toBeNull();
    }
  });

  it('a recording never noted follows the stored choice, through the same guard', () => {
    setAuthorSpeechLanguage('hi');
    const id = recording(5);
    setEnglishOnlyForTests(true);
    expect(hearing(id)).toEqual({ language: 'en', heardInEnglish: true });
    setEnglishOnlyForTests(false);
    expect(hearing(id)).toEqual({ language: 'hi', heardInEnglish: false });
  });

  it('a letter whose words were set before the guard is left as it is: no note, so no notice', () => {
    setAuthorSpeechLanguage('fr');
    const id = recording(6);
    rememberLetterLanguage(id);
    forgetLetterLanguage(id); // what the queue does when a letter's words are set
    setEnglishOnlyForTests(true);
    expect(wasHeardInEnglish(id)).toBe(false);
    expect(heardInEnglishNoteFor(id)).toBeNull();
  });

  it('the note holds no words and no language: one key per recording, value "1"', () => {
    const id = recording(7);
    noteHeardInEnglish(id);
    expect(store.getSetting(`speech.heardInEnglish.${id}`)).toBe('1');
  });
});

describe('[D-111 item 4] the queue decides the language in one place (source pins: index.ts loads React Native)', () => {
  const queue = src('lib/transcription-queue/index.ts');
  const shared = src('lib/transcription-queue/hearing.ts');

  it('requestWords (Review) queues the draft in hearing(draftId).language, after noting the recording language', () => {
    expect(queue).toMatch(/rememberLetterLanguage\(draftId\);\s*const \{ language \} = hearing\(draftId\);\s*dispatch\(\{ type: 'enqueue', id: draftId, kind: 'draft', language,/);
  });

  it('syncLetters queues each letter waiting for its words in hearing(entry.id).language', () => {
    expect(queue).toMatch(/step\(\{ type: 'enqueue', id: entry\.id, kind: 'entry', language: hearing\(entry\.id\)\.language,/);
  });

  it('runJob hands the recogniser the heard language and passes the flag on with the words', () => {
    expect(queue).toMatch(/const heard = hearing\(id\);\s*const language = heard\.heardInEnglish \? heard\.language : job\.language;\s*const transcriber = await transcriberFor\(language\);/);
    expect(queue).toMatch(/\{ audioUri: source\.audioUri, durationMs: source\.durationMs, dictionary, language \}/);
    expect(queue).toMatch(/deliver\(id, res, transcriber\.isSample, heard\.heardInEnglish\);/);
    expect(queue).toMatch(/planFor\(\[language\]\)\.asr\[language\]/);
  });

  it('no call site reads the stored language around the guard', () => {
    expect(queue).not.toMatch(/\bletterLanguage\(/);
    expect(queue).not.toMatch(/language: job\.language/);
    expect(queue).not.toMatch(/transcriberFor\(job\.language\)/);
    expect(queue).toMatch(/return state\.jobs\[id\]\?\.language \?\? hearing\(id\)\.language;/);
  });

  it('the note is left before the words, for a draft and for a waiting letter, and only when words were heard', () => {
    expect(queue).toMatch(/if \(raw\) \{\s*if \(heardInEnglish\) noteHeardInEnglish\(id\);[^\n]*\n\s*setDraftTranscript\(id, raw\);/);
    expect(queue).toMatch(/if \(late\.finalText && heardInEnglish\) noteHeardInEnglish\(id\);\s*setWordsForWaitingEntry\(id,/);
    expect(queue.match(/noteHeardInEnglish\(id\)/g)?.length).toBe(2);
  });

  it('hearing.ts feeds the rule the noted language, the switch and the note, and writes nothing', () => {
    expect(shared).toMatch(/return hearingFor\(letterLanguage\(id\), capabilities\.englishOnly, wasHeardInEnglish\(id\)\);/);
    expect(shared).toMatch(/return heardInEnglishNote\(wasHeardInEnglish\(id\), capabilities\.englishOnly\);/);
    expect(shared).not.toMatch(/setAuthorSpeechLanguage|rememberLetterLanguage|setSetting|deleteSetting|noteHeardInEnglish/);
  });
});

describe('[D-111 item 4] Review and the letter page tell the person', () => {
  it('Review shows the line with the words (spoken, not sample), in the app\'s small muted style', () => {
    const review = src('app/review.tsx');
    expect(review).toMatch(/draft && !typed && !isSample && phase === 'ready' \? heardInEnglishNoteFor\(draft\.id\) : null/);
    expect(review).toMatch(/\{heardNote && \(\s*<Text variant="subhead" tone="muted" testID="review\.heardInEnglish">\s*\{heardNote\}/);
  });

  it('the letter page shows it under how the letter was made, for a spoken letter with words', () => {
    const page = src('app/letter/[id].tsx');
    expect(page).toMatch(/const heardNote = spoken && words === 'words' \? heardInEnglishNoteFor\(entry\.id\) : null;/);
    expect(page).toMatch(/\{heardNote \? \(\s*<Text variant="footnote" tone="muted" className="pl-6" testID="letter\.heardInEnglish">\s*\{heardNote\}/);
  });
});

describe('[D-111 item 4] the line itself', () => {
  it('lives in packages/content next to the picker line, where the content rules read it', () => {
    expect(features.language.heardInEnglish).toBe(LINE);
  });

  it('is two short plain sentences: heard in English, and other languages come in a later update (the picker\'s own words)', () => {
    expect(LINE.trim()).toBe(LINE);
    const sentences = LINE.split(/(?<=\.)\s+/);
    expect(sentences).toHaveLength(2);
    for (const s of sentences) expect(s).toMatch(/^[A-Z][^.!?]*\.$/);
    expect(sentences[0]).toMatch(/\bheard in English\b/);
    expect(sentences[1]).toBe(languageCopy.picker.englishOnly);
  });

  it('promises no date, uses no fear, loss or machine-writing words, and genders nobody', () => {
    expect(LINE).not.toMatch(/\d/);
    expect(LINE).not.toMatch(/\b(soon|shortly|tomorrow|next (week|month|year)|this (week|month|year))\b/i);
    expect(LINE).not.toMatch(/\b(lose|lost|miss|missing|sorry|unfortunately|can'?t|cannot|only|wrong|error|failed)\b/i);
    expect(LINE).not.toMatch(/\b(AI|smart|magic|generat\w*|rewrit\w*|polish\w*|improv\w*|correct\w*|translat\w*)\b/i);
    expect(LINE).not.toMatch(/\b(he|she|him|her|his|hers|son|daughter|boy|girl)\b/i);
  });

  it('obeys the character rules: no em or en dash, curly quote, ellipsis or emoji', () => {
    expect(LINE).not.toMatch(/[–—‘’“”…]/);
    expect(LINE).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
