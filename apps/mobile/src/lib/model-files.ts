/**
 * Where Whisper model files live (ADR 0001): Application Support/models,
 * excluded from iCloud backup, through the local ScribeFiles module
 * (modules/scribe-files). Without the module (Expo Go, web, Android for now)
 * it falls back to Documents/models, the previous location, and says so.
 *
 * TODO(android): put models in Context.noBackupFilesDir (excluded from Auto
 * Backup) with an Android side for ScribeFiles before the Android release.
 *
 * Recordings are deliberately NOT excluded from backup: they stay in
 * Documents so the user's own iCloud device backup includes them
 * (docs/DECISIONS.md D-033, recommended, awaiting founder OK; TDD 01 OQ-5).
 * TODO(D-033): if the founder decides otherwise, exclude audio in
 * capture/recorder.ts and fix the copy.
 */
import { Directory, Paths } from 'expo-file-system';
import { ScribeFiles } from '../../modules/scribe-files';

export interface ModelsDirectory {
  dir: Directory;
  /** True when the directory is in Application Support and excluded from backup. */
  backupExcluded: boolean;
}

export function modelsDirectory(): ModelsDirectory {
  if (ScribeFiles) {
    try {
      return { dir: new Directory(ScribeFiles.modelsDirectory()), backupExcluded: true };
    } catch {
      // fall through: never block transcription on the backup flag
    }
  }
  return { dir: new Directory(Paths.document, 'models'), backupExcluded: false };
}

/** Marks a downloaded model file excluded from backup (no-op without the native module). */
export function excludeFromBackup(uri: string): boolean {
  try {
    ScribeFiles?.setExcludedFromBackup(uri, true);
    return !!ScribeFiles;
  } catch {
    return false;
  }
}
