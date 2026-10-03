/**
 * Launch sweep plan (TDD 01 3.2.4 and F-02; TDD 03 FM-3; DATA-REQ-048).
 *
 * Pure: takes a snapshot of audio files and rows, returns what to do. The
 * app applies the plan in sweep.ts; tests run it in Node.
 *
 * Rules:
 * - Audio is never deleted here. Every file ends attached to a row, or listed
 *   in Settings > Recordings as a recording without a letter.
 * - Files are matched to rows by file name, not by full URI: iOS moves the
 *   app container on updates, so a stored file:// path goes stale while the
 *   file itself is still in Documents. A stale path is rebased, not lost.
 * - A draft still marked `recording` means the app was killed mid-take. If
 *   its file has bytes, the take is finalized (hashed, marked ready) and
 *   shows on Tonight. If the file is empty it is kept and marked
 *   unrecoverable. Only a recording draft with no file at all (nothing was
 *   captured) is dropped.
 * - A row whose file is missing is reported, never changed or removed.
 */

export interface SweepFile {
  uri: string;
  bytes: number;
}

export interface SweepDraft {
  id: string;
  audioUri: string | null;
  state: string;
}

export interface SweepEntry {
  id: string;
  audioUri: string | null;
}

export interface SweepSnapshot {
  /** Audio files found where the recorder writes (Documents). */
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
  | { kind: 'drop-empty-recording'; draftId: string }
  | { kind: 'rebase-draft'; draftId: string; uri: string }
  | { kind: 'rebase-entry'; entryId: string; uri: string }
  | { kind: 'reattach'; uri: string; fileName: string; bytes: number; childId: string }
  | { kind: 'report'; fileName: string; bytes: number }
  | { kind: 'missing-audio'; ref: 'draft' | 'entry'; id: string };

const AUDIO_EXT = /\.(m4a|mp4|aac|caf|wav|3gp|webm)$/i;

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

export function planLaunchSweep(s: SweepSnapshot): SweepAction[] {
  const actions: SweepAction[] = [];
  const files = new Map<string, SweepFile>();
  for (const f of s.files) if (isAudioFile(f.uri)) files.set(fileNameOf(f.uri), f);
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
    const file = files.get(name);
    if (d.state === 'recording') {
      if (!file) actions.push({ kind: 'drop-empty-recording', draftId: d.id });
      else if (file.bytes > 0) actions.push({ kind: 'finalize-recording', draftId: d.id, uri: file.uri, bytes: file.bytes });
      else actions.push({ kind: 'unrecoverable-recording', draftId: d.id, uri: file.uri });
      continue;
    }
    if (!file) actions.push({ kind: 'missing-audio', ref: 'draft', id: d.id });
    else if (file.uri !== d.audioUri) actions.push({ kind: 'rebase-draft', draftId: d.id, uri: file.uri });
  }

  for (const e of s.entries) {
    if (!e.audioUri) continue;
    const name = fileNameOf(e.audioUri);
    claimed.add(name);
    const file = files.get(name);
    if (!file) actions.push({ kind: 'missing-audio', ref: 'entry', id: e.id });
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
