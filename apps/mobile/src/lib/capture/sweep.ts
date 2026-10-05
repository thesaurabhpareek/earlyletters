/**
 * Launch sweep (TDD 01 F-02, 3.2.4; TDD 03 FM-3; DATA-REQ-048). Runs once per
 * process after the first frame, never awaited by launch (A-REQ-002).
 *
 * Takes one synchronous snapshot of audio files and rows, plans with the
 * pure planLaunchSweep, then applies: finishes takes interrupted by a kill,
 * rebases paths after an app update, re-attaches stray recordings to the
 * active book as drafts (they show on Tonight), and reports the rest in
 * Settings > Recordings. A take a kill cut off is probed first: one that will
 * not play is kept and listed, not shown as ready (D-085). The sweep never
 * deletes audio. After it, the 30 day shelf purge runs (erase.ts), never
 * while a take is being recorded. Returns counts only.
 */
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import {
  audioRows,
  deleteDraft,
  finalizeDraftAudio,
  getActiveChildId,
  getDraft,
  listOrphanAudio,
  reattachOrphanAudio,
  rebaseAudioUri,
  reportOrphanAudio,
} from '../store';
import { purgeShelfAtLaunch } from './erase';
import { probePlayable } from './probe';
import { activeTakeId, hashAudioFile } from './recorder';
import { fileNameOf, isAudioFile, planLaunchSweep, type SweepAction, type SweepFile } from './sweep.logic';

export type SweepReport = Record<SweepAction['kind'], number>;

let started: Promise<SweepReport | null> | null = null;

interface FoundFile extends SweepFile {
  createdAt: string;
}

function listRecordings(): FoundFile[] {
  const out: FoundFile[] = [];
  for (const item of Paths.document.list()) {
    if (!(item instanceof File) || !isAudioFile(item.uri)) continue;
    const t = item.creationTime ?? item.modificationTime ?? Date.now();
    out.push({ uri: item.uri, bytes: item.size ?? 0, createdAt: new Date(t).toISOString() });
  }
  return out;
}

export function runLaunchSweep(): Promise<SweepReport | null> {
  if (Platform.OS === 'web') return Promise.resolve(null); // web preview has no recordings on disk
  started ??= sweep().catch(() => null);
  return started;
}

async function sweep(): Promise<SweepReport> {
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
      case 'drop-empty-recording':
        // Nothing was captured: the row points at no file. Re-check before removing it.
        if (getDraft(a.draftId)?.state === 'recording') deleteDraft(a.draftId);
        break;
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
    }
  }
  // The shelf purge never runs in the middle of a recording.
  if (!activeTakeId()) {
    try {
      purgeShelfAtLaunch();
    } catch {
      // try again at the next launch; nothing is half erased (file first, then row)
    }
  }
  return report;
}
