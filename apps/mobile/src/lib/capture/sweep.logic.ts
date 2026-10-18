/**
 * Launch sweep plan (TDD 01 3.2.4 and F-02; TDD 03 FM-3; DATA-REQ-048).
 *
 * Pure: takes a snapshot of audio files and rows, returns what to do. The
 * app applies the plan in sweep.ts; tests run it in Node.
 *
 * Rules:
 * - Audio is never deleted here. Every file ends attached to a row, or listed
 *   in Settings > Recordings as a recording without a letter.
 * - A row keeps the listed file at exactly its stored path. Only when that
 *   path is not listed is it matched by file name: iOS moves the app
 *   container on updates, so a stored file:// path goes stale while the file
 *   itself is still in Documents. A stale path is rebased, not lost. When two
 *   folders hold the same name, the name match takes the recorder's folder
 *   (listed last), but never moves a row off a file that is where it says.
 * - A draft still marked `recording` means the app was killed mid-take. If
 *   its file has bytes and plays (or could not be probed), the take is
 *   finalized (hashed, marked ready) and shows on Tonight. If the file is
 *   empty, or an M4A that was not closed may not play (D-085), it is kept
 *   and marked unrecoverable: Settings > Recordings lists it, and Export
 *   keeps the file. Only a recording draft with no file at all (nothing was
 *   captured) is dropped.
 * - A row whose file is missing is reported, never changed or removed. The
 *   one exception is a deleted letter on the shelf: its file goes first when
 *   the person erases it (store.eraseEntry), so a kill between the two steps
 *   leaves a deleted row with no file, which is expected and not reported.
 */

export interface SweepFile {
  uri: string;
  bytes: number;
  /**
   * Whether a duration probe could open the file. null when it was not
   * probed (web, or a file the sweep has no reason to probe). Only a
   * killed take is probed; `false` keeps it out of "finalize".
   */
  playable?: boolean | null;
}

export interface SweepDraft {
  id: string;
  audioUri: string | null;
  state: string;
}

export interface SweepEntry {
  id: string;
  audioUri: string | null;
  /** On the Recently deleted shelf. Its file may already be gone (erase deletes the file first). */
  deleted?: boolean;
}

export interface SweepSnapshot {
  /** Audio files found where recordings live: the recorder's folder and the top of Documents (recordings.ts). */
  files: SweepFile[];
  drafts: SweepDraft[];
  /** Every entry with audio, tombstoned ones included (never treat their files as orphans). */
  entries: SweepEntry[];
  /** File names already listed in `orphan_audio`. */
  reported: string[];
  /** Book to attach orphaned recordings to; null before first run. */
  activeChildId: string | null;
  /** Drafts owned by a live recording session (never touched). */
  skipDraftIds: string[];
}

export type SweepAction =
  | { kind: 'finalize-recording'; draftId: string; uri: string; bytes: number }
  | { kind: 'unrecoverable-recording'; draftId: string; uri: string }
  /** Has bytes but a duration probe could not open it: kept, hashed, marked unrecoverable, listed. */
  | { kind: 'unplayable-recording'; draftId: string; uri: string; bytes: number }
  | { kind: 'drop-empty-recording'; draftId: string }
  | { kind: 'rebase-draft'; draftId: string; uri: string }
  | { kind: 'rebase-entry'; entryId: string; uri: string }
  | { kind: 'reattach'; uri: string; fileName: string; bytes: number; childId: string }
  | { kind: 'report'; fileName: string; bytes: number }
  | { kind: 'missing-audio'; ref: 'draft' | 'entry'; id: string };

/** Every file extension the app counts as a recording (`.aac` is ADR 0027's ADTS). e2e/bin/inspect-container.sh lists the same. */
export const RECORDING_EXTENSIONS = ['m4a', 'mp4', 'aac', 'caf', 'wav', '3gp', 'webm'] as const;

const AUDIO_EXT = new RegExp(`\\.(${RECORDING_EXTENSIONS.join('|')})$`, 'i');

/**
 * The folder expo-audio 57 writes every take to, inside the folder the
 * recorder is given (`directory: 'document'` in recorder.ts, so Documents):
 * - iOS: `<Documents>/ExpoAudio/recording-<UUID><ext>` (ios/AudioUtils.swift,
 *   createRecordingUrl);
 * - Android: `<files>/Audio/recording-<UUID><ext>` (AudioRecorder.kt,
 *   createRecordingFilePath); expo-file-system's Paths.document is `<files>`.
 * `<ext>` is the container's: `.m4a`, or `.aac` for ADTS (ADR 0027).
 * The app never moves the file, so this folder is where the rows point.
 * Check it again when expo-audio is upgraded.
 */
export function recorderFolder(os: string): string {
  return os === 'android' ? 'Audio' : 'ExpoAudio';
}

export function fileNameOf(uri: string): string {
  const clean = uri.split(/[?#]/)[0].replace(/\/+$/, '');
  try {
    return decodeURIComponent(clean.slice(clean.lastIndexOf('/') + 1));
  } catch {
    return clean.slice(clean.lastIndexOf('/') + 1);
  }
}

export function isAudioFile(uri: string): boolean {
  return AUDIO_EXT.test(fileNameOf(uri));
}

/**
 * Erase guard (erase.ts): whether a file may belong to another draft or
 * letter, so erasing one letter must leave it on the phone.
 * `candidate` is the erased letter's stored path (`storedUri`) or a file of
 * the same name in a recording folder; `others` are the stored paths of every
 * other draft and letter, deleted ones included (they can still be restored).
 * - Another row whose stored path is exactly the candidate owns it.
 * - A same-name file in a recording folder may be another same-name row's
 *   (the sweep pairs a row by name when its path is stale), so it stays.
 * - The erased letter's own stored file stays only if another row of that
 *   name has no file at its own path, so the sweep would pair it with this one.
 */
export function belongsToAnotherRow(candidate: string, storedUri: string, others: readonly string[], exists: (uri: string) => boolean): boolean {
  const name = fileNameOf(candidate);
  return others.some((u) => u === candidate || (fileNameOf(u) === name && (candidate !== storedUri || !exists(u))));
}

export function planLaunchSweep(s: SweepSnapshot): SweepAction[] {
  const actions: SweepAction[] = [];
  const atPath = new Map<string, SweepFile>();
  /** By file name; the later listing (the recorder's folder) wins a clash. */
  const files = new Map<string, SweepFile>();
  for (const f of s.files) {
    if (!isAudioFile(f.uri)) continue;
    atPath.set(f.uri, f);
    files.set(fileNameOf(f.uri), f);
  }
  /** A row's file: the one listed at exactly its stored path, else one of the same name. */
  const fileFor = (uri: string) => atPath.get(uri) ?? files.get(fileNameOf(uri));
  const claimed = new Set<string>();
  const skip = new Set(s.skipDraftIds);

  for (const d of s.drafts) {
    if (!d.audioUri) {
      if (d.state === 'recording' && !skip.has(d.id)) actions.push({ kind: 'drop-empty-recording', draftId: d.id });
      continue;
    }
    const name = fileNameOf(d.audioUri);
    claimed.add(name);
    if (skip.has(d.id)) continue;
    const file = fileFor(d.audioUri);
    if (d.state === 'recording') {
      if (!file) actions.push({ kind: 'drop-empty-recording', draftId: d.id });
      else if (file.bytes > 0 && file.playable === false) actions.push({ kind: 'unplayable-recording', draftId: d.id, uri: file.uri, bytes: file.bytes });
      else if (file.bytes > 0) actions.push({ kind: 'finalize-recording', draftId: d.id, uri: file.uri, bytes: file.bytes });
      else actions.push({ kind: 'unrecoverable-recording', draftId: d.id, uri: file.uri });
      continue;
    }
    if (!file) actions.push({ kind: 'missing-audio', ref: 'draft', id: d.id });
    else if (file.uri !== d.audioUri) actions.push({ kind: 'rebase-draft', draftId: d.id, uri: file.uri });
  }

  for (const e of s.entries) {
    if (!e.audioUri) continue;
    claimed.add(fileNameOf(e.audioUri));
    const file = fileFor(e.audioUri);
    if (!file) {
      if (!e.deleted) actions.push({ kind: 'missing-audio', ref: 'entry', id: e.id });
    }
    else if (file.uri !== e.audioUri) actions.push({ kind: 'rebase-entry', entryId: e.id, uri: file.uri });
  }

  const reported = new Set(s.reported);
  for (const [name, f] of files) {
    if (claimed.has(name)) continue;
    if (s.activeChildId) actions.push({ kind: 'reattach', uri: f.uri, fileName: name, bytes: f.bytes, childId: s.activeChildId });
    else if (!reported.has(name)) actions.push({ kind: 'report', fileName: name, bytes: f.bytes });
  }
  return actions;
}
