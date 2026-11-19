/// <reference types="node" />
/**
 * BL-572 (APP-07, APP-12). Two rules of the transcription queue:
 * 1. Nothing is transcribed while a take is being recorded. A job running when a take opens stops (it goes back to
 *    the queue and never counts as a failure), the model leaves memory, and the job runs again once the take is kept
 *    or discarded. The queue learns this from the capture layer itself (capture/busy.ts, fed by audio-mode.ts and
 *    recorder.ts), never from the Listen screen.
 * 2. Only an end of the app while it was active with the large model running, or a model that will not load, counts
 *    toward the move to the compact model. A swipe-away (the app switcher makes the app inactive first) never does.
 *
 * Behaviour: the real queue (index.ts, machine.ts, kill-marker.ts) runs with a fake recogniser and an in-memory
 * store; a "kill" is a relaunch of the module with the settings left as they were. Fictional Asha family only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pickTier } from '../src/lib/models/tiers';

const fake = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  drafts: new Map<string, any>(),
  heard: [] as string[],
  memoryFailures: 0,
  released: 0,
  /** How the next transcribe call behaves. */
  mode: 'ok' as 'ok' | 'hold' | 'hang' | 'load_failed',
  /** Resolves a held job. */
  finish: null as null | (() => void),
  appState: 'active' as string,
  appListeners: new Set<(s: string) => void>(),
}));

vi.mock('react-native', () => ({
  AppState: {
    get currentState() {
      return fake.appState;
    },
    addEventListener: (_: string, l: (s: string) => void) => {
      fake.appListeners.add(l);
      return { remove: () => fake.appListeners.delete(l) };
    },
  },
}));
vi.mock('../modules/scribe-audio', () => ({ ScribeAudio: {} }));
vi.mock('../src/lib/build-env', () => ({ devShortcutsAllowed: false }));
vi.mock('../src/lib/capture/adts-file', () => ({ removeWholeFrameCopies: () => {} }));
vi.mock('../src/lib/audio-enhance', () => ({ copyForLetter: async () => {} }));
vi.mock('../src/lib/analytics/track', () => ({ trackTranscriptionCompleted: () => {} }));
vi.mock('../src/lib/language', () => ({ getSpokenLanguages: () => ({ languages: [] }) }));
vi.mock('../src/lib/read-it-back', () => ({ flagReadItBack: () => {} }));
vi.mock('../src/lib/transcribe-sample', () => ({ createSampleTranscriber: () => ({ id: 'sample', isSample: true, availability: async () => 'native-module-missing', transcribe: async () => { throw new Error('no sample'); } }) }));
vi.mock('../src/lib/models/whisper-runtime', () => ({
  whisperModule: () => ({}),
  releaseContexts: async () => {
    fake.released += 1;
  },
}));
vi.mock('../src/lib/models/speech-consent', () => ({ migrateSpeechConsent: () => {}, setSpeechDownloadChoice: () => {}, speechAutoStartAllowed: () => false }));
vi.mock('../src/lib/models/speech-packs', () => ({
  bindSpeechPacks: () => {},
  combineProgress: () => null,
  speechDownloadMotion: () => ({ progress: null, stage: null }),
  ensureSpeechFor: async () => ({ ok: true }),
  installedPathsFor: () => ({ asr: '/packs/asr.bin', vad: '/packs/vad.bin', asrId: 'whisper-large-v3-turbo-q5_0' }),
  onSpeechPacksBound: () => () => {},
  planFor: () => ({ packs: [], asr: {}, bytes: 0 }),
  recordMemoryFailure: () => {
    fake.memoryFailures += 1;
  },
  speechPackHost: () => ({ onProgress: () => () => {}, packPath: () => '/packs/x', removePack: async () => {} }),
  speechPacksForLanguage: () => [],
}));
vi.mock('../src/lib/transcribe-whisper', () => ({
  createWhisperTranscriber: () => ({
    id: 'whisper',
    isSample: false,
    availability: async () => null,
    transcribe: (input: { audioUri: string; language: string }, hooks: { signal?: AbortSignal }) => {
      const id = input.audioUri.replace('file:///rec/', '').replace('.aac', '');
      const result = { raw: 'Asha laughed at the rain', words: [], language: input.language, transcriber: 'whisper', outcome: 'ok', meta: {} };
      if (fake.mode === 'load_failed') return Promise.reject(new Error('model_load_failed'));
      // A kill: the app ends mid-job, so nothing after this line ever runs (not even the abort).
      if (fake.mode === 'hang') return new Promise(() => {});
      if (fake.mode === 'hold') {
        return new Promise((resolve, reject) => {
          hooks.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          fake.finish = () => {
            fake.heard.push(id);
            resolve(result);
          };
        });
      }
      fake.heard.push(id);
      return Promise.resolve(result);
    },
  }),
}));
vi.mock('../src/lib/store', () => ({
  getSetting: (k: string) => fake.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void fake.settings.set(k, v),
  deleteSetting: (k: string) => void fake.settings.delete(k),
  subscribe: () => () => {},
  listChildren: () => [],
  listHiddenChildren: () => [],
  getChild: () => ({ id: 'child-asha', name: 'Asha', birthday: '2026-03-01', signsAs: 'Mama' }),
  dictionaryFor: () => [],
  getDraft: (id: string) => fake.drafts.get(id) ?? null,
  getEntry: () => null,
  listWaitingForWords: () => [],
  setDraftTranscript: (id: string, raw: string) => {
    const d = fake.drafts.get(id);
    if (d && d.rawTranscript == null) d.rawTranscript = raw;
  },
  setWordsForWaitingEntry: () => {},
}));

const MARKER = 'speech.jobRunning';

function addDraft(id: string): void {
  fake.drafts.set(id, { id, childId: 'child-asha', audioUri: `file:///rec/${id}.aac`, audioDurationMs: 120_000, rawTranscript: null, createdAt: '2026-11-08T19:00:00.000Z' });
  fake.settings.set(`speech.letterLanguage.${id}`, 'en');
}

async function settle(): Promise<void> {
  for (let i = 0; i < 25; i++) await new Promise((r) => setTimeout(r, 0));
}

const stops: (() => void)[] = [];

/** A fresh app launch with the settings (and any marker) the last run left. */
async function launch() {
  vi.resetModules();
  fake.appListeners.clear(); // the last run is gone, with its listeners
  const busy = await import('../src/lib/capture/busy');
  const queue = await import('../src/lib/transcription-queue');
  stops.push(queue.startTranscriptionQueue());
  return { queue, busy };
}

function appGoes(s: string): void {
  fake.appState = s;
  [...fake.appListeners].forEach((l) => l(s));
}

beforeEach(() => {
  fake.settings.clear();
  fake.drafts.clear();
  fake.heard.length = 0;
  fake.memoryFailures = 0;
  fake.released = 0;
  fake.mode = 'ok';
  fake.finish = null;
  fake.appState = 'active';
  fake.appListeners.clear();
});

afterEach(() => {
  while (stops.length) stops.pop()!();
});

describe('[BL-572] the queue waits while a take records', () => {
  it('a take that opens during a job stops it, frees the model, never counts it as a failure, and the job runs again after', async () => {
    const { queue, busy } = await launch();
    fake.mode = 'hold';
    addDraft('draft-a');
    queue.requestWords('draft-a');
    await settle();
    expect(queue.wordsState().running).toBe('draft-a');

    busy.noteRecordingSession(true); // audio-mode.ts: the session switched to recording, before the recorder is prepared
    await settle();
    expect(queue.wordsState().running).toBeNull();
    expect(queue.wordsJob('draft-a')?.phase).toBe('queued');
    expect(queue.wordsJob('draft-a')?.attempts).toBe(0);
    expect(fake.released).toBeGreaterThanOrEqual(1); // the model left memory
    expect(fake.heard).toEqual([]);

    // recorder.ts: the take is live, then kept; the session goes back to idle. Still waiting until both are done.
    busy.noteLiveTake('draft-b');
    busy.noteRecordingSession(false);
    await settle();
    expect(queue.wordsState().running).toBeNull();

    fake.mode = 'ok';
    busy.noteLiveTake(null);
    await settle();
    expect(fake.heard).toEqual(['draft-a']);
    expect(queue.wordsJob('draft-a')?.phase).toBe('done');
    expect(fake.memoryFailures).toBe(0);
  });

  it('nothing starts while a take is open, including a paused one', async () => {
    const { queue, busy } = await launch();
    busy.noteRecordingSession(true);
    busy.noteLiveTake('draft-live');
    addDraft('draft-a');
    queue.requestWords('draft-a');
    await settle();
    expect(fake.heard).toEqual([]);
    expect(queue.wordsJob('draft-a')?.phase).toBe('queued');

    busy.noteRecordingSession(false);
    busy.noteLiveTake(null);
    await settle();
    expect(fake.heard).toEqual(['draft-a']);
  });

  it('a queue started while a take is already open waits too', async () => {
    vi.resetModules();
    const busy = await import('../src/lib/capture/busy');
    busy.noteRecordingSession(true);
    const queue = await import('../src/lib/transcription-queue');
    stops.push(queue.startTranscriptionQueue());
    addDraft('draft-a');
    queue.requestWords('draft-a');
    await settle();
    expect(fake.heard).toEqual([]);
    busy.noteRecordingSession(false);
    await settle();
    expect(fake.heard).toEqual(['draft-a']);
  });
});

describe('[BL-572] only a memory kill or a model that will not load moves the phone to the compact model', () => {
  it('two swipe-aways during jobs leave a 6 GB phone on the full model', async () => {
    for (const draft of ['draft-a', 'draft-b']) {
      const { queue } = await launch();
      fake.mode = 'hang';
      addDraft(draft);
      queue.requestWords(draft);
      await settle();
      expect(fake.settings.get(MARKER)).toBe('foreground');
      appGoes('inactive'); // the app switcher
      expect(fake.settings.get(MARKER)).toBe('away');
      fake.appState = 'active'; // swiped away: the next launch starts active
    }
    await launch();
    expect(fake.memoryFailures).toBe(0);
    expect(fake.settings.has(MARKER)).toBe(false);
    expect(pickTier({ totalMemoryBytes: 6e9, memoryFailures: fake.memoryFailures })).toBe('full');
  });

  it('two ends while active with the model running count, and move the phone to the compact model', async () => {
    for (const draft of ['draft-a', 'draft-b']) {
      const { queue } = await launch();
      fake.mode = 'hang';
      addDraft(draft);
      queue.requestWords(draft);
      await settle();
      expect(fake.settings.get(MARKER)).toBe('foreground'); // then jetsam: no event reaches the app
    }
    await launch();
    expect(fake.memoryFailures).toBe(2);
    expect(pickTier({ totalMemoryBytes: 6e9, memoryFailures: fake.memoryFailures })).toBe('compact');
  });

  it('back from the app switcher, the marker says active again', async () => {
    const { queue } = await launch();
    fake.mode = 'hang';
    addDraft('draft-a');
    queue.requestWords('draft-a');
    await settle();
    appGoes('inactive');
    appGoes('active');
    expect(fake.settings.get(MARKER)).toBe('foreground');
  });

  it('a marker from a build before BL-572 does not count; a model that will not load still does', async () => {
    fake.settings.set(MARKER, '1');
    const { queue } = await launch();
    expect(fake.memoryFailures).toBe(0);
    expect(fake.settings.has(MARKER)).toBe(false);

    fake.mode = 'load_failed';
    addDraft('draft-a');
    queue.requestWords('draft-a');
    await settle();
    expect(fake.memoryFailures).toBe(1);
  });
});
