/**
 * Export on the phone (C-REQ-017, LEGAL-REQ-034, DATA-REQ-050 to -053, -056).
 * Free in every plan state and fully offline: it reads only the local store
 * and files, never the network or the entitlement (C-NFR-004).
 *
 * Flow: snapshot the store, write the ZIP to the app cache (never backed
 * up), re-read it and check every hash, then hand it to the share sheet. The
 * temporary ZIP is deleted when the share sheet closes, when the person
 * stops, when anything fails, and by `cleanupExports()` on the next visit.
 *
 * Nothing here logs content: errors carry codes and paths only.
 */
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import { Directory, File, FileMode, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ENGINE_VERSION } from '@scribe/core';
import { dateLocale } from '../dates';
import { hasPlus } from '../billing';
import { currentUserId, listChildren, listEntriesForChild, listHiddenChildren, type Entry } from '../store';
import { paperFor, type ExportSnapshot, type SnapshotChild, type SnapshotEntry } from './build.logic';
import { estimateExportBytes, ExportCancelledError, ExportTooLargeError, MAX_EXPORT_BYTES, packExport, type ByteSink, type ExportPhase } from './pack';
import { EXPORT_FORMAT } from './schema';
import { verifyExport, type RandomAccess } from './verify';

export { ExportCancelledError, ExportTooLargeError } from './pack';

export class ExportLowSpaceError extends Error {
  constructor() {
    super('export_low_space');
    this.name = 'ExportLowSpaceError';
  }
}

export class ExportCheckFailedError extends Error {
  /** Paths and codes only. */
  constructor(readonly problems: string[]) {
    super('export_check_failed');
    this.name = 'ExportCheckFailedError';
  }
}

export interface ExportProgress {
  phase: ExportPhase;
  /** 0..1 over the whole export, packing and checking together. */
  fraction: number;
}

export interface ExportResult {
  uri: string;
  fileName: string;
  bytes: number;
  entries: number;
  recordings: number;
  books: number;
  /** Recordings that changed since capture (DATA-REQ-051); included as they are and marked. */
  mismatched: number;
}

const PACK_SHARE = 0.85; // of the progress bar; checking takes the rest
const BUFFER = 1 << 20;

function exportsDir(): Directory {
  return new Directory(Paths.cache, 'exports');
}

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(data: Uint8Array): Promise<string> {
  return hex(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, data as Uint8Array<ArrayBuffer>));
}

const nextTurn = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

function fileState(uri: string | null | undefined): { exists: boolean; size: number | null } {
  if (!uri) return { exists: false, size: null };
  try {
    const f = new File(uri);
    return f.exists ? { exists: true, size: f.size ?? null } : { exists: false, size: null };
  } catch {
    return { exists: false, size: null };
  }
}

/** Everything on this phone that goes into an export: every book (hidden ones too), every letter not deleted. */
export function exportSnapshot(now = new Date()): ExportSnapshot {
  const me = currentUserId();
  const own = (e: Entry) => !e.authorId || !me || e.authorId === me;
  const children: SnapshotChild[] = [
    ...listChildren().map((c) => ({ ...c, hidden: false })),
    ...listHiddenChildren().map((c) => ({ ...c, hidden: true })),
  ];
  const entries: SnapshotEntry[] = children.flatMap((c) =>
    listEntriesForChild(c.id).map((e) => {
      const state = e.captureMode !== 'typed' ? fileState(e.audioUri) : { exists: false, size: null };
      return { ...e, childId: e.childId ?? c.id, own: own(e), audioOnPhone: state.exists, audioSizeOnPhone: state.size };
    }),
  );
  return {
    generatedAt: now.toISOString(),
    appVersion: Constants.expoConfig?.version ?? '0.0.0',
    engineVersion: ENGINE_VERSION,
    locale: dateLocale(),
    plan: hasPlus() ? 'plus' : 'free',
    signedIn: me !== null,
    children,
    entries,
  };
}

/** What the screen shows before export starts ("What is inside" counts). */
export function exportSummary(snapshot = exportSnapshot()): { letters: number; recordings: number; books: number } {
  return {
    letters: snapshot.entries.length,
    recordings: snapshot.entries.filter((e) => e.own && e.audioOnPhone).length,
    books: snapshot.children.length,
  };
}

/** Removes every temporary export. Safe to call any time (screen mount, app start). */
export function cleanupExports(): void {
  try {
    const dir = exportsDir();
    if (dir.exists) dir.delete();
  } catch {
    // Nothing to tidy, or the cache was already cleared by iOS.
  }
}

function deleteQuietly(file: File | null): void {
  try {
    if (file?.exists) file.delete();
  } catch {
    // iOS may have cleared the cache already.
  }
}

/** Buffers the many small ZIP chunks into 1 MiB writes. */
function fileSink(file: File): ByteSink & { close(): void } {
  const handle = file.open(FileMode.WriteOnly);
  let buffer = new Uint8Array(BUFFER);
  let used = 0;
  const flush = () => {
    if (used > 0) handle.writeBytes(buffer.subarray(0, used));
    used = 0;
  };
  return {
    write(chunk) {
      if (chunk.length >= BUFFER) {
        flush();
        handle.writeBytes(chunk);
        return;
      }
      if (used + chunk.length > BUFFER) flush();
      buffer.set(chunk, used);
      used += chunk.length;
    },
    close() {
      flush();
      handle.close();
      buffer = new Uint8Array(0);
    },
  };
}

function fileReader(file: File): RandomAccess & { close(): void } {
  const handle = file.open(FileMode.ReadOnly);
  return {
    size: handle.size ?? file.size ?? 0,
    read(offset, length) {
      handle.offset = offset;
      return handle.readBytes(length);
    },
    close: () => handle.close(),
  };
}

async function renderPdf(html: string, locale: string): Promise<Uint8Array> {
  const paper = paperFor(locale);
  const { uri } = await Print.printToFileAsync({
    html,
    width: paper.width,
    height: paper.height,
    margins: { top: 54, bottom: 54, left: 58, right: 58 },
  });
  const pdf = new File(uri);
  try {
    return await pdf.bytes();
  } finally {
    deleteQuietly(pdf);
  }
}

/**
 * Makes the export and checks it. Resolves with the ZIP in the app cache;
 * pass it to `shareExport`. Throws ExportCancelledError, ExportTooLargeError,
 * ExportLowSpaceError or ExportCheckFailedError; the partial file is always
 * removed first.
 */
export async function runExport(opts: { onProgress?: (p: ExportProgress) => void; signal?: { aborted: boolean } } = {}): Promise<ExportResult> {
  cleanupExports();
  const snapshot = exportSnapshot();
  const estimate = estimateExportBytes(snapshot);
  if (estimate > MAX_EXPORT_BYTES) throw new ExportTooLargeError();
  try {
    if (Paths.availableDiskSpace < estimate * 1.1 + 50_000_000) throw new ExportLowSpaceError();
  } catch (e) {
    if (e instanceof ExportLowSpaceError) throw e; // unknown free space: carry on and let the write decide
  }

  const dir = exportsDir();
  dir.create({ intermediates: true, idempotent: true });
  const fileName = `${EXPORT_FORMAT}-${snapshot.generatedAt.slice(0, 10)}.zip`;
  const file = new File(dir, fileName);
  file.create({ overwrite: true });

  let sink: (ByteSink & { close(): void }) | null = null;
  try {
    sink = fileSink(file);
    const packed = await packExport(snapshot, {
      readFile: (uri) => new File(uri).bytes(),
      sha256,
      renderPdf: (html) => renderPdf(html, snapshot.locale),
      sink,
      signal: opts.signal,
      yieldToUi: nextTurn,
      onProgress: (p) => opts.onProgress?.({ phase: p.phase, fraction: p.fraction * PACK_SHARE }),
    });
    sink.close();
    sink = null;

    const reader = fileReader(file);
    let check;
    try {
      check = await verifyExport(
        reader,
        packed.manifest,
        packed.manifestSha256,
        sha256,
        (f) => opts.onProgress?.({ phase: 'checking', fraction: PACK_SHARE + f * (1 - PACK_SHARE) }),
        opts.signal,
      );
    } finally {
      reader.close();
    }
    if (opts.signal?.aborted) throw new ExportCancelledError();
    if (!check.ok) throw new ExportCheckFailedError(check.problems);

    return {
      uri: file.uri,
      fileName,
      bytes: packed.bytesWritten,
      entries: packed.manifest.counts.entries,
      recordings: packed.manifest.counts.audio,
      books: packed.manifest.counts.books,
      mismatched: packed.mismatched.length,
    };
  } catch (e) {
    try {
      sink?.close();
    } catch {
      // already closed
    }
    deleteQuietly(file);
    throw e;
  }
}

/**
 * Opens the share sheet (Save to Files, AirDrop, Mail). The temporary ZIP is
 * deleted when the sheet closes, whatever the person chose (DATA-REQ-056).
 */
export async function shareExport(result: Pick<ExportResult, 'uri'>, dialogTitle?: string): Promise<void> {
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(result.uri, { mimeType: 'application/zip', UTI: 'public.zip-archive', dialogTitle });
    }
  } finally {
    deleteQuietly(new File(result.uri));
  }
}
