/**
 * Launch sweep (TDD 01 F-02, 3.2.4; TDD 03 FM-3; DATA-REQ-048). Runs once per
 * process after the first frame, never awaited by launch (A-REQ-002).
 *
 * Takes one synchronous snapshot of audio files (where expo-audio writes
 * them, `Documents/ExpoAudio`, and the top of Documents: recordings.ts) and
 * rows, plans with the pure planLaunchSweep, then applies: finishes takes
 * interrupted by a kill, rebases paths after an app update (a row's stored
 * path names the old container; the file is matched by name in this one),
 * re-attaches stray recordings to the active book as drafts (they show on
 * Tonight), and reports the rest in Settings > Recordings. A take a kill cut
 * off is probed first: one that will not play is kept and listed, not shown
 * as ready (D-085). The one recording it deletes is a let-go draft's: a
 * draft left `discarding` (a kill mid Let it go, or a file that would not
 * delete) loses its file, then its row (BL-923). After it, the 30 day shelf
 * purge runs (erase.ts), also when the listing failed (erasing needs no
 * snapshot), never while a take is being recorded. Returns counts only.
 */
import { Platform } from 'react-native';
import {
  audioRows,
  deleteDraft,
  finalizeDraftAudio,
  finishDiscard,
  getActiveChildId,
  getDraft,
  listOrphanAudio,
  reattachOrphanAudio,
  rebaseAudioUri,
  reportOrphanAudio,
} from '../store';
import { removeWholeFrameCopies } from './adts-file';
import { purgeShelfAtLaunch } from './erase';
import { letItGo } from './let-it-go.logic';
import { probePlayable } from './probe';
import { activeTakeId, hashAudioFile } from './recorder';
import { erasableFiles, filesForRecording, listRecordingFiles } from './recordings';
import { fileNameOf, planLaunchSweep, type SweepAction, type SweepFile } from './sweep.logic';

export type SweepReport = Record<SweepAction['kind'], number>;

let started: Promise<SweepReport | null> | null = null;

interface FoundFile extends SweepFile {
  createdAt: string;
}

/** Throws when a folder that exists cannot be listed; the sweep then changes nothing this launch. */
function listRecordings(): FoundFile[] {
  return listRecordingFiles().map((item) => {
    const t = item.creationTime ?? item.modificationTime ?? Date.now();
    return { uri: item.uri, bytes: item.size ?? 0, createdAt: new Date(t).toISOString() };
  });
}

export function runLaunchSweep(): Promise<SweepReport | null> {
  if (Platform.OS === 'web') return Promise.resolve(null); // web preview has no recordings on disk
  started ??= sweep().catch(() => null);
  return started;
}

async function sweep(): Promise<SweepReport> {
  try {
    return await reconcile();
  } finally {
    purgeShelf();
    try {
      removeWholeFrameCopies(); // copies a transcription run left when the app was killed (an hour old or more)
    } catch {
      // try again next launch
    }
  }
}

/** The 30 day shelf purge. Erasing needs no snapshot, so it runs even when the listing failed; never during a recording. */
function purgeShelf(): void {
  if (activeTakeId()) return;
  try {
    purgeShelfAtLaunch();
  } catch {
    // try again at the next launch; nothing is half erased (file first, then row)
  }
}

async function reconcile(): Promise<SweepReport> {
  // One synchronous snapshot: nothing can record between these reads.
  const files = listRecordings();
  const rows = audioRows();
  const skipDraftIds = [activeTakeId()].filter((x): x is string => !!x);
  // Probe only the takes a kill cut off (rare), never a live one.
  const cut = new Set(rows.drafts.filter((d) => d.state === 'recording' && d.audioUri && !skipDraftIds.includes(d.id)).map((d) => fileNameOf(d.audioUri!)));
  for (const f of files) if (f.bytes > 0 && cut.has(fileNameOf(f.uri))) f.playable = await probePlayable(f.uri);
  const actions = planLaunchSweep({
    files,
    ...rows,
    reported: listOrphanAudio().map((o) => o.fileName),
    activeChildId: getActiveChildId(),
    skipDraftIds,
  });
  const createdAt = new Map(files.map((f) => [f.uri, f.createdAt]));
  const report = {} as SweepReport;

  for (const a of actions) {
    report[a.kind] = (report[a.kind] ?? 0) + 1;
    switch (a.kind) {
      case 'finalize-recording': {
        const hash = await hashAudioFile(a.uri);
        finalizeDraftAudio(a.draftId, { audioUri: a.uri, sha256: hash?.sha256 ?? null, bytes: hash?.bytes ?? a.bytes, state: 'ready', recovered: true });
        break;
      }
      case 'unrecoverable-recording':
        finalizeDraftAudio(a.draftId, { audioUri: a.uri, sha256: null, bytes: 0, state: 'unrecoverable', recovered: true });
        break;
      case 'unplayable-recording': {
        // Bytes on disk but the file will not open: keep it, hash it (Export carries it), list it.
        const hash = await hashAudioFile(a.uri);
        finalizeDraftAudio(a.draftId, { audioUri: a.uri, sha256: hash?.sha256 ?? null, bytes: hash?.bytes ?? a.bytes, state: 'unrecoverable', recovered: true });
        break;
      }
      case 'drop-empty-recording': {
        // Nothing was captured: the row points at no file. Re-check before removing it: still a take being
        // recorded, and no file of its name on disk (a listing can miss one: Android lists an unreadable folder
        // as empty). A take whose file is there is left as it is for the next launch to finish.
        const d = getDraft(a.draftId);
        if (d?.state === 'recording' && !(d.audioUri && filesForRecording(d.audioUri).some((f) => f.exists))) deleteDraft(a.draftId);
        break;
      }
      case 'rebase-draft':
        rebaseAudioUri('drafts', a.draftId, a.uri);
        break;
      case 'rebase-entry':
        rebaseAudioUri('entries', a.entryId, a.uri);
        break;
      case 'reattach': {
        const hash = await hashAudioFile(a.uri);
        reattachOrphanAudio(a.fileName, {
          childId: a.childId,
          audioUri: a.uri,
          createdAt: createdAt.get(a.uri) ?? new Date().toISOString(),
          sha256: hash?.sha256 ?? null,
          bytes: hash?.bytes ?? a.bytes,
          state: (hash?.bytes ?? a.bytes) === 0 ? 'unrecoverable' : 'ready',
        });
        break;
      }
      case 'report':
        reportOrphanAudio(a.fileName, a.bytes);
        break;
      case 'missing-audio':
        // Reported by count only (no content, no ids leave the phone). The row is left exactly as it is.
        break;
      case 'finish-discard':
        finishLetGo(a.draftId);
        break;
    }
  }
  return report;
}

/**
 * Let it go stopped after its first step (BL-923; let-it-go.logic.ts): the recording goes where it is now, then the
 * row. Never a file another draft or letter may own (erase.ts's rule), a letter kept under the same id included. A
 * file that still will not delete keeps the row, marked and off every list, for the next launch. The mark is read
 * again first: a pull may have brought the draft back (sync/merge.ts applyHeldRows), and then nothing is touched.
 */
function finishLetGo(id: string): void {
  letItGo(id, getDraft(id)?.audioUri, {
    beginDiscard: () => getDraft(id)?.state === 'discarding', // step 1 was taken before the app stopped
    deleteFile: (uri) => {
      const { drafts, entries } = audioRows();
      const others = [...drafts.filter((d) => d.id !== id), ...entries].flatMap((r) => (r.audioUri ? [r.audioUri] : []));
      for (const f of erasableFiles(uri, others)) f.delete();
    },
    finishDiscard,
  });
}
