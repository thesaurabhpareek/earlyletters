/// <reference types="node" />
/**
 * BL-1313 (NS-17 language rows, part 2). Every transcription call passes the author's language code and the
 * transcribe task; nothing translates or transliterates; the interface stays English; a voice-only letter waiting for
 * its words never puts words on the wire; no language code rides on the analytics call the queue makes.
 * Source tests read the app's own files, so a call added later without the code or the task fails here.
 * The held-draft server half (NS-17-R8) is in supabase/tests/held_drafts_write_checks.test.mjs (`npm run test:db`).
 * Fictional Asha family only.
 *
 * Mutations these tests were written to catch (each failed a test here when it was made):
 *  M1 the whisper decode call drops `...DECODE_OPTIONS` (the task) or its `language` (NS-17-R6, FR-LOC-08);
 *  M2 DECODE_OPTIONS.translate set to true (NS-17-R3, NS-17-R6);
 *  M3 a second `.transcribe(` call site added without a language (NS-17-R6);
 *  M4 heldFromWaiting sends the entry's raw_transcript (NS-17-R8, NS-17-R7);
 *  M5 a strings.hi.ts file beside strings.en.ts (FR-LOC-10);
 *  M6 the queue's analytics call gains `language` (FR-LOC-29).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { languageCopy, screenStates } from '@scribe/content';
import { LANGUAGES } from '@scribe/core';
import { SPEECH_LANGUAGES } from '../src/lib/models/catalog';
import { heldFromWaiting, type LocalEntryRow } from '../src/lib/sync/outbox';
import { DECODE_OPTIONS } from '../src/lib/transcribe-run';
import { toWhisperLanguage } from '../src/lib/transcribe-language';

const APP = join(__dirname, '..');
const SRC = join(APP, 'src');
const CONTENT = join(APP, '..', '..', 'packages', 'content', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
const walk = (dir: string, ext: RegExp): string[] =>
  readdirSync(dir).flatMap((n) => {
    const f = join(dir, n);
    return statSync(f).isDirectory() ? walk(f, ext) : ext.test(n) ? [f] : [];
  });
/** Code only: comments and string-free lines would hide a real call, so comments are blanked and the rest kept. */
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('[NS-17-R6] language is chosen, never detected', () => {
  it('the one place that calls a transcriber is the queue, and it passes the letter\'s language', () => {
    const callers = walk(SRC, /\.(ts|tsx)$/).filter((f) => /\.transcribe\(/.test(code(readFileSync(f, 'utf8'))));
    expect(callers.map((f) => relative(SRC, f).split('\\').join('/'))).toEqual(['lib/transcription-queue/index.ts']);
    const call = code(read('lib/transcription-queue/index.ts')).match(/transcriber\.transcribe\(\s*\{([^}]*)\}/);
    expect(call?.[1]).toMatch(/\blanguage: job\.language\b/);
    expect(call?.[1]).not.toMatch(/auto|detect/i);
  });

  it('the recogniser is handed that code and the transcribe task on every decode: no auto, no translate', () => {
    const whisper = code(read('lib/transcribe-whisper.ts'));
    const decodes = whisper.match(/transcribeData\([^;]*;/g) ?? [];
    expect(decodes.length).toBeGreaterThan(0);
    for (const d of decodes) {
      expect(d, d).toMatch(/\.\.\.DECODE_OPTIONS/);
      expect(d, d).toMatch(/\blanguage\b/);
    }
    expect(whisper).toMatch(/const language = toWhisperLanguage\(input\.language\);/);
    expect(whisper).not.toMatch(/detectLanguage|detect_language|language:\s*['"]auto['"]/);
    expect(DECODE_OPTIONS.translate).toBe(false);
  });

  it('the input type makes the language required, so a call cannot leave it out', () => {
    expect(code(read('lib/transcribe.ts'))).toMatch(/\n\s*language: SpeechLanguage;/);
  });

  it('every spoken language maps to its own Whisper code, never to auto-detect', () => {
    for (const l of SPEECH_LANGUAGES) {
      expect(toWhisperLanguage(l), l).toBe(l);
      expect(toWhisperLanguage(`${l}-XX`), l).toBe(l);
    }
  });
});

describe('[FR-LOC-08] one language to a letter, chosen code on every call', () => {
  it('no parent-facing language line says words in two languages are kept as spoken', () => {
    const lines: string[] = [];
    const collect = (o: unknown): void => {
      if (typeof o === 'string') lines.push(o);
      else if (o && typeof o === 'object') Object.values(o).forEach(collect);
    };
    collect(languageCopy);
    collect(screenStates.otherLanguage);
    expect(lines.length).toBeGreaterThan(5);
    for (const l of lines) expect(l, l).not.toMatch(/two languages|both languages|more than one language|kept as spoken|mixed/i);
  });
});

describe('[NS-17-R3] no translation', () => {
  it('nothing in the app turns translate on or imports a translation or transliteration library', () => {
    for (const f of walk(SRC, /\.(ts|tsx)$/)) {
      const s = code(readFileSync(f, 'utf8'));
      expect(s, f).not.toMatch(/\btranslate\s*:\s*true\b/);
      expect(s, f).not.toMatch(/from ['"][^'"]*(translat|transliterat)[^'"]*['"]/i);
    }
    expect(DECODE_OPTIONS.translate).toBe(false);
  });

  it('no screen or route is named for translation', () => {
    const routes = walk(join(SRC, 'app'), /\.(ts|tsx)$/).map((f) => relative(SRC, f));
    expect(routes.filter((r) => /translat|transliterat/i.test(r))).toEqual([]);
  });
});

describe('[FR-LOC-10] the interface is English and the spoken language is a separate setting', () => {
  it('the content package has English strings only: no strings.<locale>.ts beside strings.en.ts', () => {
    const files = readdirSync(CONTENT).filter((n) => /^strings\./.test(n));
    expect(files).toEqual(['strings.en.ts']);
  });

  it('each language is shown in its own name first, with the English name to put under it', () => {
    for (const l of LANGUAGES) {
      expect(l.native.length, l.code).toBeGreaterThan(0);
      expect(l.english.length, l.code).toBeGreaterThan(0);
    }
    expect(LANGUAGES.find((l) => l.code === 'hi')).toMatchObject({ native: 'हिन्दी', english: 'Hindi' });
  });
});

describe('[NS-17-R8] withheld words never on the server (this phone\'s half)', () => {
  const waiting = { id: 'letter-asha', child_id: 'child-asha', kind: 'letter', capture_mode: 'voice', captured_at: '2026-10-19T19:00:00.000Z', occurred_on: '2026-10-19', occurred_precision: 'day', language: 'es', base_direction: 'ltr', prompt_key: null, in_book: 1, engine_version: 1, audio_uri: 'file:///rec/letter-asha.m4a', raw_transcript: 'Asha se rio de la lluvia', final_text: 'Asha se rio de la lluvia' } as unknown as LocalEntryRow;

  it('[NS-17-R7] a voice-only letter waiting for its words is pushed with no words of any kind, whatever the phone holds', () => {
    const held = heldFromWaiting(waiting);
    expect(held).toMatchObject({ kind: 'waiting_letter', raw_transcript: null, final_text: null, typed_text: null, machine_edits: null });
    expect(held.audio_kept_on_device).toBe(true);
  });

  // The explicit mark ("another language") and the server rule that empties words already pushed need a withheld state
  // and a server call that do not exist (held_drafts.raw_transcript is immutable once set). Reported as their own rows.
  it.todo('[NS-17-R8] a held draft pushed with words holds no words on the server after the next push');
  it.todo('[NS-17-R7] a take the author marks as another language is never shown, indexed, shared, printed or exported as words');
});

describe('[FR-LOC-29] no language code, list or model name in analytics, logs, crash reports or email', () => {
  it('the queue\'s one analytics call carries no language', () => {
    const call = code(read('lib/transcription-queue/index.ts')).match(/trackTranscriptionCompleted\(\{([^}]*)\}\)/);
    expect(call?.[1]).toBeTruthy();
    expect(call![1]).not.toMatch(/language|\blang\b|speech\.language/i);
  });

  it('analytics is off in every build profile, so no code goes anywhere today', () => {
    const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
    for (const [name, p] of Object.entries(eas.build)) {
      if (p.env?.EXPO_PUBLIC_ANALYTICS !== undefined) expect(p.env.EXPO_PUBLIC_ANALYTICS, name).toBe('off');
    }
  });

  // The catalogue still names `lang` on language_set and pack_download and a short `model` on transcription_completed,
  // and observers.ts wires the language observer. FR-LOC-29 forbids all three; removing them is the analytics owner's
  // change to packages/analytics, reported as its own row. A todo, not a pin of the conflict.
  it.todo('[FR-LOC-29] the analytics catalogue has no event or property that carries a language code or a model name');
});
