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
 */
import type { SpeechLanguage } from '../models/catalog';

export type JobKind = 'draft' | 'entry';

export type JobPhase = 'queued' | 'waiting_for_pack' | 'running' | 'done' | 'failed';

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
  progress: { done: number; total: number } | null;
  outcome?: 'ok' | 'no_speech';
  failure?: JobFailure;
}

export interface QueueState {
  jobs: Record<string, Job>;
  running: string | null;
  /** Languages whose speech packs are installed on this phone. */
  ready: SpeechLanguage[];
  foreground: boolean;
}

export type QueueEvent =
  | { type: 'enqueue'; id: string; kind: JobKind; language: SpeechLanguage; capturedAt: string }
  | { type: 'packs'; ready: SpeechLanguage[] }
  | { type: 'start'; id: string }
  | { type: 'progress'; id: string; done: number; total: number }
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
  return { jobs: {}, running: null, ready: [], foreground: true };
}

const isReady = (s: QueueState, lang: SpeechLanguage) => s.ready.includes(lang);
const waitingPhase = (s: QueueState, lang: SpeechLanguage): JobPhase => (isReady(s, lang) ? 'queued' : 'waiting_for_pack');

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
    case 'packs': {
      const next: QueueState = { ...s, ready: [...new Set(e.ready)].sort() };
      const jobs: Record<string, Job> = {};
      for (const [id, j] of Object.entries(s.jobs)) {
        jobs[id] = j.phase === 'queued' || j.phase === 'waiting_for_pack' ? { ...j, phase: waitingPhase(next, j.language) } : j;
      }
      return { ...next, jobs };
    }
    case 'start': {
      const j = s.jobs[e.id];
      if (!j || s.running || j.phase === 'done' || j.phase === 'running') return s;
      return put(s, { ...j, phase: 'running', progress: null, failure: undefined }, e.id);
    }
    case 'progress': {
      const j = s.jobs[e.id];
      if (!j || j.phase !== 'running') return s;
      return put(s, { ...j, progress: { done: Math.max(0, e.done), total: Math.max(0, e.total) } });
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
      isReady(s, j.language) &&
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
    if (j.phase === 'failed' && j.retryAt !== null && j.attempts < MAX_AUTO_ATTEMPTS && isReady(s, j.language)) {
      at = at === null ? j.retryAt : Math.min(at, j.retryAt);
    }
  }
  return at;
}

/**
 * A speech download that failed tries again by itself, further apart each
 * time, while the app is open (F05-U29: 1 minute up to 6 hours). Only
 * failures that can clear without the person: a manifest not published yet,
 * a host error, a download that did not check out, a full volume that was
 * freed, a pause lifted. Waiting for Wi-Fi resumes in the pack engine; no
 * space waits for the next launch or a tap; an app that is too old and a
 * download the person stopped never retry on their own.
 */
export const DOWNLOAD_RETRY_DELAYS_MS: readonly number[] = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 6 * 60 * 60_000];

const RETRYABLE_DOWNLOAD_FAILURES: ReadonlySet<string> = new Set([
  'no_manifest',
  'not_in_manifest',
  'download_failed',
  'hash_mismatch',
  'storage_error',
  'downloads_paused',
  'offline',
]);

export function isRetryableDownloadFailure(reason: string): boolean {
  return RETRYABLE_DOWNLOAD_FAILURES.has(reason);
}

/** Delay before automatic attempt `attempt` (1 = the first retry); the last delay repeats. */
export function downloadRetryDelayMs(attempt: number): number {
  const i = Math.max(0, Math.min(DOWNLOAD_RETRY_DELAYS_MS.length - 1, Math.floor(attempt) - 1));
  return DOWNLOAD_RETRY_DELAYS_MS[i];
}

/** Languages that have jobs waiting for their packs (the runtime starts those downloads). */
export function languagesWaiting(s: QueueState): SpeechLanguage[] {
  return [...new Set(Object.values(s.jobs).filter((j) => j.phase === 'waiting_for_pack').map((j) => j.language))].sort();
}
