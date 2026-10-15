/**
 * Phone side of "Export what is readable" (recovery-export.logic.ts). Reads the app's own files only,
 * writes one ZIP to the cache (never backed up), hands it to the share sheet and removes it afterwards.
 * Never touches the store, never deletes a recording or the database. Nothing here logs: errors carry
 * no names, paths or content.
 */
import { Directory, File, FileMode, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as SQLite from 'expo-sqlite';
import { copy } from '../copy';
import { planRecoveryExport, writeRecoveryZip, type FoundFile } from './recovery-export.logic';

export type RecoveryExportOutcome = 'shared' | 'nothing' | 'failed';

function listFiles(dir: Directory, source: FoundFile['source']): FoundFile[] {
  const out: FoundFile[] = [];
  try {
    if (!dir.exists) return out;
    for (const item of dir.list()) {
      if (item instanceof File) out.push({ name: item.name, uri: item.uri, bytes: item.size ?? 0, source });
    }
  } catch {
    // An unreadable folder is the same as an empty one here; the other folder may still be readable.
  }
  return out;
}

function foundFiles(): FoundFile[] {
  let sqliteDir: Directory | null = null;
  try {
    sqliteDir = new Directory(SQLite.defaultDatabaseDirectory);
  } catch {
    sqliteDir = null;
  }
  return [...listFiles(Paths.document, 'documents'), ...(sqliteDir ? listFiles(sqliteDir, 'sqlite') : [])];
}

function removeQuietly(file: File | null): void {
  try {
    if (file?.exists) file.delete();
  } catch {
    // The cache may already have been cleared by iOS.
  }
}

/** True if there is anything to export. Cheap: names only. */
export function hasReadableFiles(): boolean {
  return planRecoveryExport(foundFiles()).length > 0;
}

export async function runRecoveryExport(opts: { signal?: { aborted: boolean } } = {}): Promise<RecoveryExportOutcome> {
  const entries = planRecoveryExport(foundFiles());
  if (entries.length === 0) return 'nothing';
  let zip: File | null = null;
  try {
    const dir = new Directory(Paths.cache, 'recovery-export');
    if (dir.exists) dir.delete();
    dir.create({ intermediates: true, idempotent: true });
    zip = new File(dir, `recovery-${new Date().toISOString().slice(0, 10)}.zip`);
    zip.create({ overwrite: true });
    const handle = zip.open(FileMode.WriteOnly);
    try {
      await writeRecoveryZip(entries, {
        readFile: (uri) => new File(uri).bytes(),
        write: (chunk) => handle.writeBytes(chunk),
        readme: copy.errors.launch.readme,
        signal: opts.signal,
        yieldToUi: () => new Promise<void>((r) => setTimeout(r, 0)),
      });
    } finally {
      handle.close();
    }
    if (opts.signal?.aborted) return 'failed';
    if (!(await Sharing.isAvailableAsync())) return 'failed';
    await Sharing.shareAsync(zip.uri, { mimeType: 'application/zip', UTI: 'public.zip-archive' });
    return 'shared';
  } catch {
    return 'failed';
  } finally {
    removeQuietly(zip); // the temporary copy only; the originals are never touched
  }
}
