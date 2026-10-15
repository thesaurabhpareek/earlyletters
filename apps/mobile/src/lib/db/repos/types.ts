/**
 * Local domain types for the device store. Moved here from store.ts so the
 * repositories can use them without importing the facade; store.ts
 * re-exports every name, so screens keep importing from '@/lib/store'.
 *
 * The shared enums move to @scribe/core (CORE-02, WS-06); when they land,
 * these unions become re-exports of the core ones.
 */
import type { Edit, EditLevel } from '@scribe/core';
import type { EntrySyncState } from '../../sync/types';

export type EntryKind = 'note' | 'letter' | 'not_much';
export type CaptureMode = 'spoken' | 'typed' | 'mixed';
export type TranscriptStatus = 'waiting' | null;

export interface Entry {
  id: string;
  kind: EntryKind;
  occurredOn: string; // YYYY-MM-DD, local
  capturedAt: string; // ISO timestamp
  captureMode: CaptureMode;
  editLevel: EditLevel;
  promptKey: string | null;
  engineVersion: number;
  rawTranscript: string;
  machineEdits: Edit[];
  finalText: string;
  inBook: boolean;
  soundsLikeMe: boolean | null;
  /** Book this entry belongs to. Defaults to the active child on save. */
  childId?: string;
  /** Author's account id; null until sign-in exists (all local entries are the phone owner's). */
  authorId?: string;
  /** Signature at save time ("Papa"), so a later rename never rewrites old letters. */
  authorSignsAs?: string;
  /** Local file URI of the AAC M4A recording (ADR 0005), kept in the app's document directory. */
  audioUri?: string | null;
  audioDurationMs?: number | null;
  /** SHA-256 (hex) of the audio file, computed when recording stopped (DATA-REQ-046). */
  audioSha256?: string | null;
  audioBytes?: number | null;
  /**
   * 'waiting': a spoken letter kept without words yet (transcriber not ready).
   * `rawTranscript` and `finalText` are '' until the words are set once
   * (setWordsForWaitingEntry). null: the letter has its words.
   */
  transcriptStatus?: TranscriptStatus;
  /** Upload state on this phone (sync/types.ts): local, pending ("Not sent yet"), synced, rejected, held, gone. */
  syncState?: EntrySyncState;
  /** Family review state from the server (not_needed, pending, added, set_aside); null before sync. */
  approval?: string | null;
}

/** Single-child view of the active child (kept for existing callers). */
export interface Family {
  childName: string;
  childBirthday: string | null; // YYYY-MM-DD
  signsAs: string; // what the child calls this parent
  childDueDate?: string | null; // YYYY-MM-DD while expecting
}

export interface Child {
  id: string;
  name: string;
  birthday: string | null; // YYYY-MM-DD
  dueDate: string | null; // YYYY-MM-DD, set while expecting
  signsAs: string; // what this child calls the current user
  remindersOn: boolean;
  familyCanRead: boolean;
  /** From sync: true when this account started the book, false when it joined it. Absent for a book only on this phone. */
  createdByMe?: boolean;
  /** From sync: this account's role in the book. Absent for a book only on this phone. */
  role?: 'parent' | 'contributor';
}

export interface NewChild {
  name: string;
  birthday: string | null;
  dueDate: string | null;
  signsAs: string;
}

export interface Member {
  id: string;
  signsAs: string;
  role: 'parent' | 'contributor';
  status: 'active' | 'invited';
}

/**
 * recording: the mic was live when this row was last written (created when
 * recording starts); ready: audio closed and hashed, or a typed draft;
 * unrecoverable: the file is empty, kept for the parent to decide.
 */
export type DraftState = 'recording' | 'ready' | 'unrecoverable';

/** An unfinished capture. Written when recording starts, so a crash or a closed sheet loses nothing. */
export interface Draft {
  id: string;
  childId: string;
  captureMode: CaptureMode;
  promptKey: string | null;
  createdAt: string;
  audioUri: string | null;
  audioDurationMs: number | null;
  /** Immutable once set: the transcript exactly as heard (or typed). */
  rawTranscript: string | null;
  /** Typed text being written (Write screen autosave). */
  typedText: string | null;
  state: DraftState;
  audioSha256: string | null;
  audioBytes: number | null;
  /** Set when the launch sweep recovered this take after a kill, or re-attached a stray file. */
  recoveredAt: string | null;
}

export interface OrphanAudio {
  fileName: string;
  bytes: number | null;
  foundAt: string;
}
