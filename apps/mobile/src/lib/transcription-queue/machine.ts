/**
 * Transcription queue state machine (TDD 03 3.5.4, FM-6 to FM-9, FM-18).
 * Pure: no React Native, tested in Node (test/transcription-queue.test.ts).
 *
 * Rules:
 * - One job at a time, in order. A draft open in Review goes first (someone
 *   is looking at it); letters waiting for their words follow, oldest first.
 * - A job runs only when its language's speech packs are installed. Until
 *   then it waits (`waiting_for_pack`); the recording is already safe.
 * - Nothing runs while the app is in the background (no background work,
 *   PRD 7.7). A job stopped by backgrounding goes back to the queue without
 *   counting as a failure, and starts again on return.
 * - A failure retries by itself after 30 s, then after 5 min, then waits
 *   for the next launch or the parent's "Try again". It never loops.
 * - Enqueueing is idempotent: the same recording is never queued twice, and
 *   a recording whose words were set is never transcribed again (raw is set
 *   once, DATA-REQ-040).
 * - A language this build does not hear yet (`onHold`: every language but
 *   English while the English-only switch is on, D-111 item 4) is never
 *   handed to the recogniser: its jobs wait (`waiting_for_language`), are
 *   never started, never retried, never failed and ask for no download. The
 *   recording is kept; in a build that hears the language, the job runs in
 *   that language as any other.
 */
import type { SpeechLanguage } from '../models/catalog';
import { RunInputError } from '../transcribe-run';

export type JobKind = 'draft' | 'entry';

export type JobPhase = 'queued' | 'waiting_for_pack' | 'waiting_for_language' | 'running' | 'done' | 'failed';

export type JobFailure = 'file_missing' | 'decode_failed' | 'model_load_failed' | 'transcribe_failed' | 'unsupported';

export interface Job {
  /** Draft id; the letter keeps the same id when it is saved (DATA-REQ-044). */
  id: string;
  kind: JobKind;
  language: SpeechLanguage;
  /** ISO timestamp of the recording: the queue order. */
  capturedAt: string;
  phase: JobPhase;
  /** Failed runs counted towards the automatic retry limit (interruptions are not counted). */
  attempts: number;
  /** When a failed job may run again by itself (ms since epoch); null: only on the next launch or a manual retry. */
  retryAt: number | null;
  /** Parts done of total; `fraction` (0..1) when the recogniser reports within a part. */
  progress: { done: number; total: number; fraction?: number } | null;
  outcome?: 'ok' | 'no_speech';
  failure?: JobFailure;
}

export interface QueueState {
  jobs: Record<string, Job>;
  running: string | null;
  /** Languages whose speech packs are installed on this phone. */
  ready: SpeechLanguage[];
  /** Languages this build does not hear yet (language-hold.ts): their jobs wait and never run. */
  onHold: SpeechLanguage[];
  foreground: boolean;
}

export type QueueEvent =
  | { type: 'enqueue'; id: string; kind: JobKind; language: SpeechLanguage; capturedAt: string }
  | { type: 'packs'; ready: SpeechLanguage[] }
  | { type: 'onHold'; languages: SpeechLanguage[] }
  | { type: 'start'; id: string }
  | { type: 'progress'; id: string; done: number; total: number; fraction?: number }
  | { type: 'finish'; id: string; outcome: 'ok' | 'no_speech' }
  | { type: 'fail'; id: string; failure: JobFailure; now: number }
  | { type: 'interrupt'; id: string }
  | { type: 'retry'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'foreground'; value: boolean };

export const RETRY_DELAYS_MS: readonly number[] = [30_000, 5 * 60_000];
/** Automatic attempts per launch; after these, only "Try again" or the next launch. */
export const MAX_AUTO_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

export function initialQueue(): QueueState {
  return { jobs: {}, running: null, ready: [], onHold: [], foreground: true };
}

const isReady = (s: QueueState, lang: SpeechLanguage) => s.ready.includes(lang);
const isOnHold = (s: QueueState, lang: SpeechLanguage) => s.onHold.includes(lang);
/** Ready and not on hold: the only languages a job may run in. */
const canRun = (s: QueueState, lang: SpeechLanguage) => isReady(s, lang) && !isOnHold(s, lang);
const waitingPhase = (s: QueueState, lang: SpeechLanguage): JobPhase =>
  isOnHold(s, lang) ? 'waiting_for_language' : isReady(s, lang) ? 'queued' : 'waiting_for_pack';
const isWaiting = (j: Job) => j.phase === 'queued' || j.phase === 'waiting_for_pack' || j.phase === 'waiting_for_language';

/** Waiting jobs take the phase the new state gives their language; running, done and failed jobs keep theirs. */
function rephase(next: QueueState): QueueState {
  const jobs: Record<string, Job> = {};
  for (const [id, j] of Object.entries(next.jobs)) jobs[id] = isWaiting(j) ? { ...j, phase: waitingPhase(next, j.language) } : j;
  return { ...next, jobs };
}

function put(s: QueueState, job: Job, running: string | null = s.running): QueueState {
  return { ...s, running, jobs: { ...s.jobs, [job.id]: job } };
}

export function reduce(s: QueueState, e: QueueEvent): QueueState {
  switch (e.type) {
    case 'enqueue': {
      const existing = s.jobs[e.id];
      if (existing) {
        // Same recording: never a second job.
        if (existing.kind === 'draft' && e.kind === 'entry') {
          // The draft was kept as a letter waiting for its words: the same job now serves the letter.
          // A draft job that already finished ran without a letter to receive its words; run it again.
          if (existing.phase !== 'done') return put(s, { ...existing, kind: 'entry' });
          return put(s, { ...existing, kind: 'entry', phase: waitingPhase(s, existing.language), outcome: undefined });
        }
        return s;
      }
      return put(s, {
        id: e.id,
        kind: e.kind,
        language: e.language,
        capturedAt: e.capturedAt,
        phase: waitingPhase(s, e.language),
        attempts: 0,
        retryAt: null,
        progress: null,
      });
    }
    case 'packs':
      return rephase({ ...s, ready: [...new Set(e.ready)].sort() });
    case 'onHold':
      return rephase({ ...s, onHold: [...new Set(e.languages)].sort() });
    case 'start': {
      const j = s.jobs[e.id];
      // A language on hold is never handed to the recogniser, whoever asks.
      if (!j || s.running || j.phase === 'done' || j.phase === 'running' || isOnHold(s, j.language)) return s;
      return put(s, { ...j, phase: 'running', progress: null, failure: undefined }, e.id);
    }
    case 'progress': {
      const j = s.jobs[e.id];
      if (!j || j.phase !== 'running') return s;
      const progress: NonNullable<Job['progress']> = { done: Math.max(0, e.done), total: Math.max(0, e.total) };
      if (e.fraction !== undefined && Number.isFinite(e.fraction)) {
        // Never moves backwards (a part decoded again, a loop retry): the bar only rises.
        progress.fraction = Math.max(j.progress?.fraction ?? 0, Math.min(1, Math.max(0, e.fraction)));
      }
      return put(s, { ...j, progress });
    }
    case 'finish': {
      const j = s.jobs[e.id];
      if (!j) return s;
      return put(s, { ...j, phase: 'done', outcome: e.outcome, progress: null, failure: undefined, retryAt: null }, s.running === e.id ? null : s.running);
    }
    case 'fail': {
      const j = s.jobs[e.id];
      if (!j) return s;
      const attempts = j.attempts + 1;
      const delay = RETRY_DELAYS_MS[attempts - 1];
      return put(
        s,
        { ...j, phase: 'failed', attempts, failure: e.failure, progress: null, retryAt: delay === undefined ? null : e.now + delay },
        s.running === e.id ? null : s.running,
      );
    }
    case 'interrupt': {
      const j = s.jobs[e.id];
      if (!j) return s;
      const phase = j.phase === 'running' ? waitingPhase(s, j.language) : j.phase;
      return put(s, { ...j, phase, progress: null }, s.running === e.id ? null : s.running);
    }
    case 'retry': {
      const j = s.jobs[e.id];
      // Try again after a failure, or after "No talking in this one" (a quiet take can be listened to once more).
      const quiet = j?.phase === 'done' && j.outcome === 'no_speech';
      if (!j || (j.phase !== 'failed' && !quiet)) return s;
      return put(s, { ...j, phase: waitingPhase(s, j.language), attempts: 0, retryAt: null, failure: undefined, outcome: undefined });
    }
    case 'remove': {
      if (!s.jobs[e.id]) return s;
      const jobs = { ...s.jobs };
      delete jobs[e.id];
      return { ...s, jobs, running: s.running === e.id ? null : s.running };
    }
    case 'foreground':
      return { ...s, foreground: e.value };
  }
}

/** The job to run now, or null. Drafts first, then oldest recording; ties by id (deterministic). */
export function nextJob(s: QueueState, now: number): string | null {
  if (s.running || !s.foreground) return null;
  const runnable = Object.values(s.jobs).filter(
    (j) =>
      canRun(s, j.language) &&
      (j.phase === 'queued' || (j.phase === 'failed' && j.retryAt !== null && j.retryAt <= now && j.attempts < MAX_AUTO_ATTEMPTS)),
  );
  runnable.sort(
    (a, b) =>
      (a.kind === 'draft' ? 0 : 1) - (b.kind === 'draft' ? 0 : 1) ||
      (a.capturedAt < b.capturedAt ? -1 : a.capturedAt > b.capturedAt ? 1 : 0) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  return runnable[0]?.id ?? null;
}

/** Earliest time a failed job may retry by itself, to schedule a wake-up; null when nothing is due. */
export function nextRetryAt(s: QueueState): number | null {
  let at: number | null = null;
  for (const j of Object.values(s.jobs)) {
    if (j.phase === 'failed' && j.retryAt !== null && j.attempts < MAX_AUTO_ATTEMPTS && canRun(s, j.language)) {
      at = at === null ? j.retryAt : Math.min(at, j.retryAt);
    }
  }
  return at;
}

/** Languages that have jobs waiting for their packs (the runtime starts those downloads). */
export function languagesWaiting(s: QueueState): SpeechLanguage[] {
  return [...new Set(Object.values(s.jobs).filter((j) => j.phase === 'waiting_for_pack').map((j) => j.language))].sort();
}

/**
 * The job failure for an error, by code only (never by its text, LEGAL-REQ-014). ScribeAudio errors carry
 * `ERR_SCRIBE_AUDIO_*` codes; a recording whose length cannot be trusted (RunInputError, review L9) is a
 * decode failure: the job shows Try again and Type instead, and a waiting letter keeps waiting.
 */
export function jobFailureOf(e: unknown): JobFailure {
  const code = (e as { code?: unknown } | null)?.code;
  if (code === 'ERR_SCRIBE_AUDIO_FILE_MISSING') return 'file_missing';
  if (code === 'ERR_SCRIBE_AUDIO_DECODE') return 'decode_failed';
  if (code === 'ERR_SCRIBE_AUDIO_UNSUPPORTED') return 'unsupported';
  if (e instanceof RunInputError) return 'decode_failed';
  if (e instanceof Error && e.message === 'model_load_failed') return 'model_load_failed';
  return 'transcribe_failed';
}
