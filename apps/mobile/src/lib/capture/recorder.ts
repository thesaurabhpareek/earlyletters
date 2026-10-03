/**
 * Recorder session (TDD 01 3.4, TDD 03 3.2; LEGAL-REQ-011; DATA-REQ-046, -048).
 *
 * The take is never lost:
 * - beginTake prepares the recorder, writes the draft row (state
 *   `recording`, with the file path) and only then starts the microphone.
 * - finalizeTake stops the recorder, hashes the file (SHA-256) and marks the
 *   draft `ready` in one statement. It runs on Finish, app background, an
 *   audio interruption and screen dismiss, and is idempotent per draft, so
 *   two of those firing together stop and save once.
 * - The only path that deletes audio is the parent's confirmed Discard.
 *
 * Fsync: expo-file-system has no fsync. AVAudioRecorder closes the file on
 * stop, which hands it to the OS; the hash recorded here is re-checked by the
 * DATA-REQ-046 scrub. Residual risk noted in TDD 01 3.4 rule 4.
 */
import type { AudioRecorder } from 'expo-audio';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { setAudioMode } from '../audio-mode';
import {
  createRecordingDraft,
  finalizeDraftAudio,
  getDraft,
  setDraftAudioHash,
  type Draft,
  type DraftState,
} from '../store';

export type StopReason = 'user' | 'background' | 'interruption' | 'dismiss';

let activeTake: string | null = null;
const finalizing = new Map<string, Promise<Draft | null>>();

/** The draft a live recording session owns (the launch sweep never touches it). */
export function activeTakeId(): string | null {
  return activeTake;
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** File size, or null when the file is missing or the platform cannot read it (web preview). */
export function audioFileBytes(uri: string | null | undefined): number | null {
  if (!uri) return null;
  try {
    const f = new File(uri);
    return f.exists ? (f.size ?? 0) : null;
  } catch {
    return null;
  }
}

/** SHA-256 (hex) and size of an audio file; null when it cannot be read. Never throws. */
export async function hashAudioFile(uri: string | null | undefined): Promise<{ sha256: string; bytes: number } | null> {
  if (!uri) return null;
  try {
    const f = new File(uri);
    if (!f.exists) return null;
    const data = await f.bytes();
    const digest = await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data);
    return { sha256: hex(digest), bytes: data.byteLength };
  } catch {
    return null;
  }
}

/**
 * Prepare, write the draft row, then record. The row exists before the
 * microphone is live, so a kill at any point leaves a row the launch sweep
 * can find. Throws if the recorder cannot start (caller shows the denied or
 * error state); the draft, if written, is finalized as whatever exists.
 */
export async function beginTake(recorder: AudioRecorder, input: { childId: string; promptKey: string | null }): Promise<Draft> {
  await recorder.prepareToRecordAsync();
  const draft = createRecordingDraft({ childId: input.childId, promptKey: input.promptKey, audioUri: recorder.uri ?? null });
  activeTake = draft.id;
  try {
    recorder.record();
  } catch (e) {
    await finalizeTake(recorder, draft.id, 'interruption', 0);
    throw e;
  }
  return draft;
}

/**
 * Stop and keep. Safe to call more than once and from several triggers; the
 * first call does the work and the rest await it. `knownDurationMs` is the
 * last elapsed time the screen saw (the recorder resets it on stop).
 */
export function finalizeTake(recorder: AudioRecorder | null, draftId: string, reason: StopReason, knownDurationMs: number): Promise<Draft | null> {
  const running = finalizing.get(draftId);
  if (running) return running;
  // Read everything synchronously before the first await: on dismiss the
  // recorder object is released right after this call starts.
  let durationMs = knownDurationMs;
  let uri: string | null = null;
  try {
    durationMs = Math.max(knownDurationMs, recorder?.getStatus().durationMillis ?? 0);
    uri = recorder?.uri ?? null;
  } catch {}
  const stopping = recorder ? recorder.stop().catch(() => {}) : Promise.resolve();

  const job = (async () => {
    await stopping;
    await setAudioMode('idle').catch(() => {});
    const draft = getDraft(draftId);
    if (!draft) return null; // discarded meanwhile
    let after: string | null = null;
    try {
      after = recorder?.uri ?? null; // some platforms (web) only know the file after stop
    } catch {}
    const fileUri = draft.audioUri ?? uri ?? after;
    const hash = await hashAudioFile(fileUri);
    const bytes = hash?.bytes ?? audioFileBytes(fileUri);
    const state: DraftState = bytes === 0 ? 'unrecoverable' : 'ready';
    finalizeDraftAudio(draftId, { audioUri: fileUri, durationMs, sha256: hash?.sha256 ?? null, bytes, state });
    void reason; // the reason is for the caller's UI; it is never stored or sent (no telemetry before consent)
    return getDraft(draftId);
  })();
  finalizing.set(draftId, job);
  job.finally(() => {
    if (activeTake === draftId) activeTake = null;
  });
  return job;
}

/** Ends a session that the parent discarded (the file is deleted by the caller after confirmation). */
export async function abandonTake(recorder: AudioRecorder, draftId: string): Promise<void> {
  if (activeTake === draftId) activeTake = null;
  finalizing.set(draftId, Promise.resolve(null));
  await recorder.stop().catch(() => {});
  await setAudioMode('idle').catch(() => {});
}

/**
 * Before a spoken letter commits (DATA-REQ-048): the file must exist and be
 * hashed. Drafts finalized without a hash (old installs, a failed read) are
 * hashed now. On platforms that cannot read files (web preview) the save
 * goes ahead with a null hash, as before.
 */
export async function ensureAudioHash(draft: Draft): Promise<{ exists: boolean; sha256: string | null; bytes: number | null }> {
  if (!draft.audioUri) return { exists: true, sha256: null, bytes: null };
  if (draft.audioSha256) return { exists: audioFileBytes(draft.audioUri) !== null || !canReadFiles(draft.audioUri), sha256: draft.audioSha256, bytes: draft.audioBytes };
  const hash = await hashAudioFile(draft.audioUri);
  if (hash) {
    setDraftAudioHash(draft.id, hash.sha256, hash.bytes);
    return { exists: true, ...hash };
  }
  return { exists: !canReadFiles(draft.audioUri), sha256: null, bytes: null };
}

/** file:// URIs are readable on iOS and Android; the web preview cannot read files, so existence is unknown there. */
function canReadFiles(uri: string): boolean {
  return Platform.OS !== 'web' && uri.startsWith('file:');
}
