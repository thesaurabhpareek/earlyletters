/**
 * Transcription queue runtime (TDD 03 3.5.4; FM-6, FM-9, FM-18). The rules
 * live in machine.ts (pure, tested); this file feeds it events from the
 * store, the app state, the pack system and the engine, and runs one job at
 * a time.
 *
 * Boot wiring (coordinator, `_layout.tsx`): call `startTranscriptionQueue()`
 * once the store is open (after `startPacks()`). It uses the platform pack
 * facade (src/lib/packs) and registers the speech plan as a language
 * resolver there. Review calls `requestWords(draftId)`; if the queue was not
 * started yet it starts itself.
 *
 * Where words go when a job finishes:
 * - the draft still exists: `setDraftTranscript` (raw, set once); Review
 *   cleans it in front of the parent;
 * - the draft was kept as a letter waiting for its words: the raw text is
 *   cleaned through @scribe/core `faithfulClean` in the author's language,
 *   then `setWordsForWaitingEntry` sets raw, edits and final text once.
 * - nobody spoke: a draft gets nothing (Review says so); a waiting letter
 *   gets '' (raw is what the recogniser heard in speech: nothing).
 * Sample words (development builds) are never stored.
 */
import { AppState, type AppStateStatus } from 'react-native';
import { ENGINE_VERSION } from '@scribe/core';
import { ScribeAudio, scribeAudioErrorCode } from '../../../modules/scribe-audio';
import { devShortcutsAllowed } from '../build-env';
import {
  deleteSetting,
  dictionaryFor,
  getChild,
  getDraft,
  getEntry,
  getSetting,
  listChildren,
  listHiddenChildren,
  listWaitingForWords,
  setDraftTranscript,
  setSetting,
  setWordsForWaitingEntry,
  subscribe as subscribeStore,
} from '../store';
import { forgetLetterLanguage, letterLanguage, onAuthorSpeechLanguage, rememberLetterLanguage } from '../models/author-language';
import { SPEECH_LANGUAGES, SPEECH_MODELS, type SpeechLanguage, type SpeechModelId } from '../models/catalog';
import {
  bindSpeechPacks,
  combineProgress,
  ensureSpeechFor,
  installedPathsFor,
  onSpeechPacksBound,
  planFor,
  recordMemoryFailure,
  speechPackHost,
  speechPacksForLanguage,
  type SpeechPackHost,
  type SpeechPackProgress,
} from '../models/speech-packs';
import { releaseContexts, whisperModule } from '../models/whisper-runtime';
import { TranscriberUnavailable, TranscriptionAborted, type TranscribeResult, type Transcriber } from '../transcribe';
import { createSampleTranscriber } from '../transcribe-sample';
import { createWhisperTranscriber } from '../transcribe-whisper';
import { copyForLetter } from '../audio-enhance';
import { cleanSpoken, spokenEditLevel } from './clean';
import { initialQueue, languagesWaiting, nextJob, nextRetryAt, reduce, type Job, type JobFailure, type QueueEvent, type QueueState } from './machine';

export type { Job, JobPhase, QueueState } from './machine';

let state: QueueState = initialQueue();
let started = false;
let stopFns: Array<() => void> = [];
const listeners = new Set<() => void>();
let controller: AbortController | null = null;
let runningJob: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
const packProgress = new Map<string, SpeechPackProgress>();
const askedDownload = new Set<SpeechLanguage>();
const sampleWords = new Map<string, TranscribeResult>();
/** Recordings whose clearer listening copy is due (made only while idle, one at a time). */
const copiesDue = new Set<string>();
let copying: Promise<void> | null = null;

const whisper = createWhisperTranscriber();
const sample = createSampleTranscriber();

// ---------------------------------------------------------------------------
// State and subscriptions (useSyncExternalStore-friendly: the snapshot only changes on dispatch)
// ---------------------------------------------------------------------------

export function wordsState(): QueueState {
  return state;
}

export function subscribeWords(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function wordsJob(id: string): Job | null {
  return state.jobs[id] ?? null;
}

/** Development builds only: the sample words for a draft (never stored). */
export function sampleWordsFor(id: string): TranscribeResult | null {
  return sampleWords.get(id) ?? null;
}

let tick = 0;
/** Changes on every update, including download progress (which is not part of QueueState). */
export function wordsTick(): number {
  return tick;
}

function emit(): void {
  tick += 1;
  listeners.forEach((l) => l());
}

function dispatch(e: QueueEvent): void {
  const next = reduce(state, e);
  if (next === state) return;
  state = next;
  emit();
  pump();
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

/** Starts the queue once. Returns a stop function (tests, hot reload). */
export function startTranscriptionQueue(deps: { packs?: SpeechPackHost } = {}): () => void {
  if (deps.packs) bindSpeechPacks(deps.packs);
  if (started) return stopTranscriptionQueue;
  started = true;

  const onApp = (s: AppStateStatus) => {
    if (s === 'active') {
      askedDownload.clear();
      dispatch({ type: 'foreground', value: true });
      syncLetters();
      refreshReady();
    } else if (s === 'background') {
      dispatch({ type: 'foreground', value: false });
      controller?.abort(); // the job goes back to the queue and starts again on return
      void (runningJob ?? Promise.resolve()).then(() => releaseContexts());
    }
  };
  const app = AppState.addEventListener('change', onApp);
  stopFns.push(() => app.remove());
  stopFns.push(subscribeStore(() => queueMicrotask(syncLetters)));
  stopFns.push(onSpeechPacksBound(() => watchPacks()));
  stopFns.push(onAuthorSpeechLanguage((lang) => void requestSpeechFor(lang)));
  const unresolve = speechPackHost().addLanguageResolver?.(speechPacksForLanguage);
  if (unresolve) stopFns.push(unresolve);
  watchPacks();

  noteInterruptedLaunch();
  state = reduce(state, { type: 'foreground', value: AppState.currentState !== 'background' });
  syncLetters();
  refreshReady();
  return stopTranscriptionQueue;
}

function stopTranscriptionQueue(): void {
  controller?.abort();
  stopFns.forEach((f) => f());
  stopFns = [];
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  started = false;
}

let unwatchPacks: (() => void) | null = null;
function watchPacks(): void {
  unwatchPacks?.();
  unwatchPacks = speechPackHost().onProgress((p) => {
    if (!(p.id in SPEECH_MODELS)) return;
    packProgress.set(p.id, p);
    if (p.phase === 'installed' || p.phase === 'removed') refreshReady();
    else emit();
  });
  refreshReady();
}

// ---------------------------------------------------------------------------
// Public actions
// ---------------------------------------------------------------------------

/** Review: get words for this recording (idempotent; a draft goes before waiting letters). */
export function requestWords(draftId: string): void {
  if (!started) startTranscriptionQueue();
  const d = getDraft(draftId);
  if (!d?.audioUri || d.rawTranscript != null) return;
  const language = rememberLetterLanguage(draftId);
  dispatch({ type: 'enqueue', id: draftId, kind: 'draft', language, capturedAt: d.createdAt });
  void requestSpeechFor(language);
}

/** "Try again" after a failure. */
export function retryWords(id: string): void {
  dispatch({ type: 'retry', id });
}

/** Starts the downloads a language needs (Settings "Download", a language just chosen). */
export async function requestSpeechFor(language: SpeechLanguage, opts: { allowCellularOnce?: boolean } = {}): Promise<void> {
  askedDownload.add(language);
  await ensureSpeechFor(language, opts).catch(() => null);
  refreshReady();
}

/** Download progress (0..1) for a language, or null when nothing is downloading. */
export function speechDownloadProgress(language: SpeechLanguage): number | null {
  return combineProgress(language, packProgress);
}

/** Why a language's download is waiting, if it is: Wi-Fi, space, offline. */
export function speechDownloadHold(language: SpeechLanguage): 'waiting_for_wifi' | 'no_space' | 'offline' | null {
  for (const id of planFor([language]).packs) {
    const p = packProgress.get(id);
    if (!p) continue;
    if (p.phase === 'waiting_for_wifi' || p.failure === 'waiting_for_wifi') return 'waiting_for_wifi';
    if (p.failure === 'no_space') return 'no_space';
    if (p.failure === 'offline') return 'offline';
  }
  return null;
}

/** Latest download state of one pack (Settings). */
export function speechPackProgress(id: SpeechModelId): SpeechPackProgress | null {
  return packProgress.get(id) ?? null;
}

/**
 * Settings "Remove": stops a job that uses the pack, frees the model from
 * memory, deletes the files. Letters recorded afterwards wait for their words.
 */
export async function removeSpeechPack(id: SpeechModelId): Promise<void> {
  const host = speechPackHost();
  const running = state.running ? state.jobs[state.running] : null;
  if (running && planFor([running.language]).packs.includes(id)) controller?.abort();
  await (runningJob ?? Promise.resolve());
  await releaseContexts();
  await host.removePack(id);
  packProgress.delete(id);
  for (const lang of SPEECH_LANGUAGES) if (planFor([lang]).packs.includes(id)) askedDownload.delete(lang);
  refreshReady();
}

// ---------------------------------------------------------------------------
// Syncing with the store and the packs
// ---------------------------------------------------------------------------

/** Waiting letters become jobs; jobs whose recording is gone or already has words are dropped. */
function syncLetters(): void {
  if (!started) return;
  let changed = false;
  const step = (e: QueueEvent) => {
    const next = reduce(state, e);
    if (next !== state) {
      state = next;
      changed = true;
    }
  };
  const children = [...listChildren(), ...listHiddenChildren()];
  const waiting = new Set<string>();
  for (const child of children) {
    for (const entry of listWaitingForWords(child.id)) {
      if (!entry.audioUri) continue;
      waiting.add(entry.id);
      step({ type: 'enqueue', id: entry.id, kind: 'entry', language: letterLanguage(entry.id), capturedAt: entry.capturedAt });
    }
  }
  for (const job of Object.values(state.jobs)) {
    if (job.phase === 'running') continue;
    const stillWanted = waiting.has(job.id) || (job.kind === 'draft' && !!getDraft(job.id));
    if (!stillWanted) step({ type: 'remove', id: job.id });
  }
  if (changed) {
    emit();
    pump();
  }
}

/** Which languages can be transcribed now; starts downloads for languages letters are waiting on. */
function refreshReady(): void {
  let ready: SpeechLanguage[] = [];
  if (whisperModule() && ScribeAudio) ready = SPEECH_LANGUAGES.filter((l) => installedPathsFor(l) !== null);
  else if (devShortcutsAllowed) ready = [...SPEECH_LANGUAGES]; // Expo Go: the sample transcriber stands in
  dispatch({ type: 'packs', ready });
  for (const lang of languagesWaiting(state)) {
    if (!askedDownload.has(lang)) void requestSpeechFor(lang);
  }
  emit();
}

// ---------------------------------------------------------------------------
// Running jobs
// ---------------------------------------------------------------------------

function pump(): void {
  if (state.running || runningJob || copying) return;
  const id = nextJob(state, Date.now());
  if (!id) {
    scheduleRetry();
    makeNextListeningCopy();
    return;
  }
  runningJob = runJob(id).finally(() => {
    runningJob = null;
    pump();
  });
}

/** Listening copies wait for an idle queue in the foreground: words always come first. */
function makeNextListeningCopy(): void {
  if (copying || !state.foreground) return;
  const id = copiesDue.values().next().value as string | undefined;
  if (!id) return;
  copiesDue.delete(id);
  copying = copyForLetter(id).finally(() => {
    copying = null;
    pump();
  });
}

function scheduleRetry(): void {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
  const at = nextRetryAt(state);
  if (at === null) return;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    pump();
  }, Math.max(0, at - Date.now()) + 50);
}

interface Source {
  audioUri: string;
  durationMs: number | null;
  childId: string | undefined;
}

function sourceFor(job: Job): Source | null {
  const d = getDraft(job.id);
  if (d) return d.audioUri && d.rawTranscript == null ? { audioUri: d.audioUri, durationMs: d.audioDurationMs, childId: d.childId } : null;
  const e = getEntry(job.id);
  if (e && e.transcriptStatus === 'waiting' && e.audioUri) return { audioUri: e.audioUri, durationMs: e.audioDurationMs ?? null, childId: e.childId };
  return null;
}

async function transcriberFor(language: SpeechLanguage): Promise<Transcriber | null> {
  if ((await whisper.availability(language)) === null) return whisper;
  if (!(whisperModule() && ScribeAudio) && devShortcutsAllowed) return sample;
  return null;
}

/**
 * A large model killed by the system (jetsam) ends the app with no error to
 * catch. A marker written while a job runs and found at the next launch
 * counts as one memory failure; two move the phone to the compact tier
 * (tiers.ts, TDD 03 5.2).
 */
const RUNNING_MARKER = 'speech.jobRunning';

function noteInterruptedLaunch(): void {
  if (getSetting(RUNNING_MARKER)) {
    recordMemoryFailure();
    deleteSetting(RUNNING_MARKER);
  }
}

function failureOf(e: unknown): JobFailure {
  const code = scribeAudioErrorCode(e);
  if (code === 'ERR_SCRIBE_AUDIO_FILE_MISSING') return 'file_missing';
  if (code === 'ERR_SCRIBE_AUDIO_DECODE') return 'decode_failed';
  if (code === 'ERR_SCRIBE_AUDIO_UNSUPPORTED') return 'unsupported';
  if (e instanceof Error && e.message === 'model_load_failed') return 'model_load_failed';
  return 'transcribe_failed';
}

async function runJob(id: string): Promise<void> {
  const job = state.jobs[id];
  if (!job) return;
  const source = sourceFor(job);
  if (!source) {
    dispatch({ type: 'remove', id });
    return;
  }
  const transcriber = await transcriberFor(job.language);
  if (!transcriber) {
    refreshReady();
    return;
  }
  dispatch({ type: 'start', id });
  if (state.running !== id) return;
  const ctrl = new AbortController();
  controller = ctrl;
  if (transcriber === whisper) setSetting(RUNNING_MARKER, '1');
  try {
    const child = source.childId ? getChild(source.childId) : null;
    const dictionary = child ? dictionaryFor({ childName: child.name, childBirthday: child.birthday, signsAs: child.signsAs }) : [];
    const res = await transcriber.transcribe(
      { audioUri: source.audioUri, durationMs: source.durationMs, dictionary, language: job.language },
      { signal: ctrl.signal, onProgress: (p) => dispatch({ type: 'progress', id, done: p.done, total: p.total }) },
    );
    if (ctrl.signal.aborted) throw new TranscriptionAborted();
    deliver(id, res, dictionary, job.language, transcriber.isSample);
    if (!transcriber.isSample) copiesDue.add(id);
    dispatch({ type: 'finish', id, outcome: res.outcome });
  } catch (e) {
    if (e instanceof TranscriptionAborted || ctrl.signal.aborted) {
      dispatch({ type: 'interrupt', id });
    } else if (e instanceof TranscriberUnavailable) {
      dispatch({ type: 'interrupt', id });
      refreshReady();
    } else {
      const failure = failureOf(e);
      if (failure === 'model_load_failed') recordMemoryFailure();
      dispatch({ type: 'fail', id, failure, now: Date.now() });
    }
  } finally {
    if (controller === ctrl) controller = null;
    deleteSetting(RUNNING_MARKER);
  }
}

function deliver(id: string, res: TranscribeResult, dictionary: ReturnType<typeof dictionaryFor>, language: SpeechLanguage, isSample: boolean): void {
  if (isSample) {
    sampleWords.set(id, res);
    return;
  }
  if (getDraft(id)) {
    if (res.raw) setDraftTranscript(id, res.raw); // raw set once; Review cleans it with the parent
    return;
  }
  const entry = getEntry(id);
  if (entry && entry.transcriptStatus === 'waiting') {
    const clean = cleanSpoken(res.raw, dictionary, language);
    setWordsForWaitingEntry(id, {
      rawTranscript: res.raw,
      machineEdits: clean.applied,
      finalText: clean.text.trim(),
      editLevel: spokenEditLevel(language),
      engineVersion: ENGINE_VERSION,
    });
    forgetLetterLanguage(id);
  }
}

/** The language Review names while words wait: the recording's own (the author's when it was never noted). */
export function languageFor(id: string): SpeechLanguage {
  return state.jobs[id]?.language ?? letterLanguage(id);
}
