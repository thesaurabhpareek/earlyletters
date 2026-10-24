/// <reference types="node" />
/**
 * D-111 item 4; review N2 on #247 and round 2 on #260. The machine never hears a recording in a language the person
 * did not choose. While the English-only switch is on, a recording noted in another language (a choice stored before
 * the switch) is never handed to the recogniser: it waits for its language, never fails, asks for no download, and
 * the person is told. Every other job proceeds. The stored choice is never changed, so in a build with the switch off
 * the recording proceeds in its own language. Words heard before the switch keep their own language.
 *
 * Behaviour, not source text: the real queue (transcription-queue/index.ts and machine.ts) runs here with a fake
 * recogniser and an in-memory store; native modules, packs and analytics are stood in. Fictional Asha family only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { features, languageCopy } from '@scribe/content';
import { SPEECH_LANGUAGES, type SpeechLanguage } from '../src/lib/models/catalog';
import { initialQueue, nextJob, nextRetryAt, reduce, type Job, type QueueEvent, type QueueState } from '../src/lib/transcription-queue/machine';
import { languagesOnHold, waitingForLanguageNote } from '../src/lib/transcription-queue/language-hold';

// ---------------------------------------------------------------------------
// Stand-ins: an in-memory store, a fake recogniser, packs that are all installed
// ---------------------------------------------------------------------------

interface FakeDraft { id: string; childId: string; audioUri: string | null; audioDurationMs: number; rawTranscript: string | null; createdAt: string }
interface FakeEntry { id: string; childId: string; audioUri: string | null; audioDurationMs: number; capturedAt: string; transcriptStatus: 'waiting' | 'ready'; finalText: string | null }

const fake = vi.hoisted(() => {
  const settings = new Map<string, string>();
  const drafts = new Map<string, any>();
  const entries = new Map<string, any>();
  const heard: { id: string; language: string }[] = [];
  const asked: string[] = [];
  const downloads: string[] = [];
  return { settings, drafts, entries, heard, asked, downloads, autoStart: true };
});

vi.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) } }));
vi.mock('../modules/scribe-audio', () => ({ ScribeAudio: {} }));
vi.mock('../src/lib/build-env', () => ({ devShortcutsAllowed: false }));
vi.mock('../src/lib/capture/adts-file', () => ({ removeWholeFrameCopies: () => {} }));
vi.mock('../src/lib/audio-enhance', () => ({ copyForLetter: async () => {} }));
vi.mock('../src/lib/analytics/track', () => ({ trackTranscriptionCompleted: () => {} }));
vi.mock('../src/lib/language', () => ({ getSpokenLanguages: () => ({ languages: [] }) }));
vi.mock('../src/lib/read-it-back', () => ({ flagReadItBack: () => {} }));
vi.mock('../src/lib/transcribe-sample', () => ({ createSampleTranscriber: () => ({ id: 'sample', isSample: true, availability: async () => 'native-module-missing', transcribe: async () => { throw new Error('no sample'); } }) }));
vi.mock('../src/lib/models/whisper-runtime', () => ({ whisperModule: () => ({}), releaseContexts: async () => {} }));
vi.mock('../src/lib/models/speech-consent', () => ({
  migrateSpeechConsent: () => {},
  setSpeechDownloadChoice: () => {},
  speechAutoStartAllowed: () => fake.autoStart,
}));
vi.mock('../src/lib/models/speech-packs', () => ({
  bindSpeechPacks: () => {},
  combineProgress: () => null,
  ensureSpeechFor: async (language: string) => {
    fake.downloads.push(language);
    return { ok: true };
  },
  installedPathsFor: () => ({ asr: '/packs/asr.bin', vad: '/packs/vad.bin', asrId: 'whisper-large-v3-turbo-q5_0' }),
  onSpeechPacksBound: () => () => {},
  planFor: () => ({ packs: [], asr: {}, bytes: 0 }),
  recordMemoryFailure: () => {},
  speechPackHost: () => ({ onProgress: () => () => {}, packPath: () => '/packs/x', removePack: async () => {} }),
  speechPacksForLanguage: () => [],
}));
// The fake recogniser: records every recording it is handed, and in which language.
vi.mock('../src/lib/transcribe-whisper', () => ({
  createWhisperTranscriber: () => ({
    id: 'whisper',
    isSample: false,
    availability: async (language: string) => {
      fake.asked.push(language);
      return null;
    },
    transcribe: async (input: { audioUri: string; language: string }) => {
      fake.heard.push({ id: input.audioUri.replace('file:///rec/', '').replace('.m4a', ''), language: input.language });
      return { raw: 'Asha laughed at the rain', words: [], language: input.language, transcriber: 'whisper', outcome: 'ok', meta: {} };
    },
  }),
}));
vi.mock('../src/lib/store', () => ({
  getSetting: (k: string) => fake.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void fake.settings.set(k, v),
  deleteSetting: (k: string) => void fake.settings.delete(k),
  subscribe: () => () => {},
  listChildren: () => [{ id: 'child-asha', name: 'Asha', birthday: '2026-03-01', signsAs: 'Mama' }],
  listHiddenChildren: () => [],
  getChild: () => ({ id: 'child-asha', name: 'Asha', birthday: '2026-03-01', signsAs: 'Mama' }),
  dictionaryFor: () => [],
  getDraft: (id: string) => fake.drafts.get(id) ?? null,
  getEntry: (id: string) => fake.entries.get(id) ?? null,
  listWaitingForWords: (childId: string) => [...fake.entries.values()].filter((e) => e.childId === childId && e.transcriptStatus === 'waiting'),
  setDraftTranscript: (id: string, raw: string) => {
    const d = fake.drafts.get(id);
    if (d && d.rawTranscript == null) d.rawTranscript = raw;
  },
  setWordsForWaitingEntry: (id: string, w: { finalText: string }) => {
    const e = fake.entries.get(id);
    if (e && e.transcriptStatus === 'waiting') Object.assign(e, { transcriptStatus: 'ready', finalText: w.finalText });
  },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LINE = languageCopy.waitingForLanguage;
const uri = (id: string) => `file:///rec/${id}.m4a`;

function addDraft(id: string, language: SpeechLanguage, rawTranscript: string | null = null): void {
  const d: FakeDraft = { id, childId: 'child-asha', audioUri: uri(id), audioDurationMs: 30_000, rawTranscript, createdAt: '2026-10-20T19:00:00.000Z' };
  fake.drafts.set(id, d);
  fake.settings.set(`speech.letterLanguage.${id}`, language);
}

function addWaitingLetter(id: string, language: SpeechLanguage): void {
  const e: FakeEntry = { id, childId: 'child-asha', audioUri: uri(id), audioDurationMs: 30_000, capturedAt: '2026-10-19T19:00:00.000Z', transcriptStatus: 'waiting', finalText: null };
  fake.entries.set(id, e);
  fake.settings.set(`speech.letterLanguage.${id}`, language);
}

/** Lets every pending promise and timer of the queue run (the recogniser is async). */
async function settle(): Promise<void> {
  for (let i = 0; i < 25; i++) await new Promise((r) => setTimeout(r, 0));
}

/** A fresh app launch: the queue module, its state and the build switch as a build with `englishOnly` would have them. */
async function launch(englishOnly: boolean) {
  vi.resetModules();
  const caps = await import('../src/lib/capabilities');
  caps.setEnglishOnlyForTests(englishOnly);
  const queue = await import('../src/lib/transcription-queue');
  const stop = queue.startTranscriptionQueue();
  stops.push(() => {
    stop();
    caps.setEnglishOnlyForTests(null);
  });
  return queue;
}

const stops: (() => void)[] = [];

beforeEach(() => {
  fake.settings.clear();
  fake.drafts.clear();
  fake.entries.clear();
  fake.heard.length = 0;
  fake.asked.length = 0;
  fake.downloads.length = 0;
  fake.autoStart = true;
  fake.settings.set('speech.language', 'es'); // a Spanish choice stored before the switch
});

afterEach(() => {
  while (stops.length) stops.pop()!();
});

// ---------------------------------------------------------------------------
// The queue with a fake recogniser
// ---------------------------------------------------------------------------

describe('[D-111 item 4] switch on: a recording in another language waits for its language', () => {
  it('is never handed to the recogniser, never fails, downloads nothing, and the notice is flagged', async () => {
    const queue = await launch(true);
    addDraft('draft-es', 'es');
    queue.requestWords('draft-es');
    await settle();

    expect(fake.heard).toEqual([]);
    expect(fake.asked).toEqual([]); // not even asked whether it could run
    expect(fake.downloads).toEqual([]); // a yes to downloads is given, still nothing for a language on hold
    const job = queue.wordsJob('draft-es');
    expect(job?.phase).toBe('waiting_for_language');
    expect(job?.attempts).toBe(0);
    expect(job?.failure).toBeUndefined();
    expect(queue.wordsState().running).toBeNull();
    expect(queue.waitingForLanguageNote(job)).toBe(LINE);
    expect(fake.drafts.get('draft-es')?.rawTranscript).toBeNull(); // nothing written to raw
  });

  it('names its own language, never English, and the stored choice is unchanged', async () => {
    const queue = await launch(true);
    addDraft('draft-es', 'es');
    queue.requestWords('draft-es');
    await settle();
    expect(queue.languageFor('draft-es')).toBe('es');
    expect(fake.settings.get('speech.language')).toBe('es');
    expect(fake.settings.get('speech.letterLanguage.draft-es')).toBe('es');
  });

  it('every other job proceeds: English drafts and waiting letters are heard in English, the others keep waiting', async () => {
    addWaitingLetter('letter-hi', 'hi');
    addWaitingLetter('letter-en', 'en');
    const queue = await launch(true); // syncLetters queues the waiting letters at start
    addDraft('draft-es', 'es');
    addDraft('draft-en', 'en');
    queue.requestWords('draft-es');
    queue.requestWords('draft-en');
    await settle();

    expect(fake.heard.map((h) => `${h.id}:${h.language}`).sort()).toEqual(['draft-en:en', 'letter-en:en']);
    expect(fake.drafts.get('draft-en')?.rawTranscript).toBe('Asha laughed at the rain');
    expect(fake.entries.get('letter-en')?.transcriptStatus).toBe('ready');
    for (const id of ['draft-es', 'letter-hi']) {
      expect(queue.wordsJob(id)?.phase, id).toBe('waiting_for_language');
      expect(queue.waitingForLanguageNote(queue.wordsJob(id)), id).toBe(LINE);
    }
    expect(queue.waitingForLanguageNote(queue.wordsJob('draft-en'))).toBeNull();
    expect(fake.entries.get('letter-hi')?.transcriptStatus).toBe('waiting');
    expect(fake.asked).not.toContain('es');
    expect(fake.asked).not.toContain('hi');
  });

  it('an English recording: heard in English, no notice', async () => {
    fake.settings.set('speech.language', 'en');
    const queue = await launch(true);
    addDraft('draft-en', 'en');
    queue.requestWords('draft-en');
    await settle();
    expect(fake.heard).toEqual([{ id: 'draft-en', language: 'en' }]);
    expect(queue.waitingForLanguageNote(queue.wordsJob('draft-en'))).toBeNull();
  });

  it('no hot loop: a "Try again" or a new launch never starts it', async () => {
    const queue = await launch(true);
    addDraft('draft-es', 'es');
    queue.requestWords('draft-es');
    queue.retryWords('draft-es'); // only failed or quiet takes retry; this one is neither
    queue.requestWords('draft-es'); // idempotent
    await settle();
    expect(fake.heard).toEqual([]);
    expect(fake.asked).toEqual([]);
    expect(queue.wordsJob('draft-es')?.phase).toBe('waiting_for_language');
  });
});

describe('[D-111 item 4] switch off: the stored language, exactly as before', () => {
  it('a Spanish recording is handed to the recogniser in Spanish, with no notice', async () => {
    const queue = await launch(false);
    addDraft('draft-es', 'es');
    queue.requestWords('draft-es');
    await settle();
    expect(fake.heard).toEqual([{ id: 'draft-es', language: 'es' }]);
    expect(fake.downloads).toEqual(['es']); // the download a yes allows, as before
    expect(queue.waitingForLanguageNote(queue.wordsJob('draft-es'))).toBeNull();
    expect(queue.wordsState().onHold).toEqual([]);
  });

  it('a recording that waited in a build with the switch on proceeds in its own language in a build without it, nothing lost', async () => {
    addWaitingLetter('letter-es', 'es');
    await launch(true);
    await settle();
    expect(fake.heard).toEqual([]);
    expect(fake.entries.get('letter-es')?.transcriptStatus).toBe('waiting');
    while (stops.length) stops.pop()!();

    await launch(false); // a later build that hears Spanish, same phone, same store
    await settle();
    expect(fake.heard).toEqual([{ id: 'letter-es', language: 'es' }]);
    expect(fake.entries.get('letter-es')?.transcriptStatus).toBe('ready');
  });
});

describe('[D-111 item 4] words heard before the switch keep their own language (L1)', () => {
  it('a draft whose Spanish words were set before the switch: languageFor gives Spanish, so Review cleans it under its own rules', async () => {
    const queue = await launch(true);
    addDraft('draft-es-heard', 'es', 'Asha se rio de la lluvia');
    queue.requestWords('draft-es-heard'); // words are set: nothing is queued
    await settle();
    expect(queue.wordsJob('draft-es-heard')).toBeNull();
    expect(queue.languageFor('draft-es-heard')).toBe('es');
    expect(fake.drafts.get('draft-es-heard')?.rawTranscript).toBe('Asha se rio de la lluvia');
    expect(fake.heard).toEqual([]);
  });

  it('a letter whose words were set before the switch is left as it is: never queued, never heard again', async () => {
    fake.entries.set('letter-es-heard', { id: 'letter-es-heard', childId: 'child-asha', audioUri: uri('letter-es-heard'), audioDurationMs: 30_000, capturedAt: '2026-10-18T19:00:00.000Z', transcriptStatus: 'ready', finalText: 'Asha se rio de la lluvia' });
    const queue = await launch(true);
    await settle();
    expect(queue.wordsJob('letter-es-heard')).toBeNull();
    expect(fake.entries.get('letter-es-heard')?.finalText).toBe('Asha se rio de la lluvia');
    expect(fake.heard).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// The pure parts
// ---------------------------------------------------------------------------

describe('[D-111 item 4] the hold and the machine', () => {
  it('on: every language but English is on hold; off: none', () => {
    expect([...languagesOnHold(true)]).toEqual(SPEECH_LANGUAGES.filter((l) => l !== 'en'));
    expect([...languagesOnHold(true)]).toEqual(['hi', 'es', 'zh', 'fr', 'ar', 'pt']);
    expect([...languagesOnHold(false)]).toEqual([]);
  });

  const run = (events: QueueEvent[], from: QueueState = initialQueue()) => events.reduce(reduce, from);
  const all: QueueEvent = { type: 'packs', ready: [...SPEECH_LANGUAGES] };
  const hold: QueueEvent = { type: 'onHold', languages: [...languagesOnHold(true)] };

  it('a job on hold is never next, never starts and never fails; it runs once the hold is lifted', () => {
    let s = run([all, hold, { type: 'enqueue', id: 'r-es', kind: 'entry', language: 'es', capturedAt: '2026-10-01T09:00:00Z' }]);
    expect(s.jobs['r-es'].phase).toBe('waiting_for_language');
    expect(nextJob(s, Date.now())).toBeNull();
    expect(reduce(s, { type: 'start', id: 'r-es' })).toBe(s);
    s = reduce(s, { type: 'onHold', languages: [] });
    expect(s.jobs['r-es'].phase).toBe('queued');
    expect(nextJob(s, Date.now())).toBe('r-es');
  });

  it('a pack update keeps a job on hold on hold, and an English job beside it runs', () => {
    let s = run([hold, { type: 'enqueue', id: 'r-zh', kind: 'draft', language: 'zh', capturedAt: '2026-10-01T09:00:00Z' }, { type: 'enqueue', id: 'r-en', kind: 'entry', language: 'en', capturedAt: '2026-10-02T09:00:00Z' }]);
    expect(s.jobs['r-zh'].phase).toBe('waiting_for_language');
    expect(s.jobs['r-en'].phase).toBe('waiting_for_pack');
    s = reduce(s, all);
    expect(s.jobs['r-zh'].phase).toBe('waiting_for_language');
    expect(nextJob(s, Date.now())).toBe('r-en'); // the draft on hold does not go first
  });

  it('a failed job whose language is put on hold is not retried by itself, and wakes nothing', () => {
    let s = run([all, { type: 'enqueue', id: 'r-fr', kind: 'entry', language: 'fr', capturedAt: '2026-10-01T09:00:00Z' }, { type: 'start', id: 'r-fr' }]);
    s = reduce(s, { type: 'fail', id: 'r-fr', failure: 'transcribe_failed', now: 0 });
    expect(nextJob(s, 60_000)).toBe('r-fr'); // due for its automatic retry
    s = reduce(s, hold);
    expect(nextJob(s, 60_000)).toBeNull();
    expect(nextRetryAt(s)).toBeNull();
  });

  it('with nothing on hold the machine is as before: no job ever waits for its language', () => {
    const s = run([all, ...SPEECH_LANGUAGES.map((l, i): QueueEvent => ({ type: 'enqueue', id: `r-${l}`, kind: 'entry', language: l, capturedAt: `2026-10-0${i + 1}T09:00:00Z` }))]);
    expect(Object.values(s.jobs).map((j) => j.phase)).toEqual(SPEECH_LANGUAGES.map(() => 'queued'));
  });

  it('the notice is for a job waiting for its language and nothing else', () => {
    const job = (phase: Job['phase']) => ({ phase });
    expect(waitingForLanguageNote(job('waiting_for_language'))).toBe(LINE);
    for (const phase of ['queued', 'waiting_for_pack', 'running', 'done', 'failed'] as const) expect(waitingForLanguageNote(job(phase)), phase).toBeNull();
    expect(waitingForLanguageNote(null)).toBeNull();
  });
});

describe('[D-111 item 4] the line itself', () => {
  it('lives in packages/content next to the picker line, where the content rules read it', () => {
    expect(features.language.waitingForLanguage).toBe(LINE);
  });

  it('is two short plain sentences: the recording waits for its language, and other languages come in a later update', () => {
    expect(LINE.trim()).toBe(LINE);
    const sentences = LINE.split(/(?<=\.)\s+/);
    expect(sentences).toHaveLength(2);
    for (const s of sentences) expect(s).toMatch(/^[A-Z][^.!?]*\.$/);
    expect(sentences[0]).toMatch(/\bwaiting for its language\b/);
    expect(sentences[1]).toBe(languageCopy.picker.englishOnly);
  });

  it('names no language, promises no date, and uses no loss, gap, machine-writing or gendered words', () => {
    expect(LINE).not.toMatch(/\b(English|Hindi|Spanish|Chinese|Mandarin|French|Arabic|Portuguese)\b/);
    expect(LINE).not.toMatch(/\d/);
    expect(LINE).not.toMatch(/\b(soon|shortly|tomorrow|next (week|month|year)|this (week|month|year))\b/i);
    expect(LINE).not.toMatch(/\b(lose|lost|miss|missing|sorry|unfortunately|can'?t|cannot|only|wrong|error|failed|yet)\b/i);
    expect(LINE).not.toMatch(/\b(AI|smart|magic|generat\w*|rewrit\w*|polish\w*|improv\w*|correct\w*|translat\w*)\b/i);
    expect(LINE).not.toMatch(/\b(he|she|him|her|his|hers|son|daughter|boy|girl)\b/i);
  });
});
