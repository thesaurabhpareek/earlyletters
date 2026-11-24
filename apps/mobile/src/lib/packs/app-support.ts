/**
 * Application Support folders for downloaded data (packs, cached signed
 * documents), excluded from iCloud and computer backups (ADR 0001, ADR 0016;
 * Apple's data storage guidance: re-downloadable data must not be backed up).
 *
 * iOS container layout: Documents and Library sit side by side, so
 * Application Support is `<container>/Library/Application Support`. The
 * backup flag is set through the local ScribeFiles module when it exists
 * (dev and release builds); in Expo Go or on web the folder still works and
 * `backupExcluded` says it is not excluded.
 */
import { Directory, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { ScribeFiles } from '../../../modules/scribe-files';

export interface AppSupportDir {
  /** Only `uri` is read by callers; on web it is a stand-in, not a real folder. */
  dir: Pick<Directory, 'uri'>;
  backupExcluded: boolean;
}

export function appSupportDir(name: 'packs' | 'remote'): AppSupportDir {
  // BL-2174: expo-file-system throws on web as soon as `Paths` is read, which blanked Spoken language and Storage.
  // No folder is created and nothing is excluded from backup; the uri is a label for an in-memory stand-in.
  if (Platform.OS === 'web') return { dir: { uri: `memory:///${name}` }, backupExcluded: false };
  let dir: Directory;
  if (Platform.OS === 'ios') {
    const container = Paths.document.parentDirectory;
    dir = new Directory(container, 'Library', 'Application Support', name);
  } else {
    // TODO(android): Context.noBackupFilesDir through ScribeFiles before the Android release.
    dir = new Directory(Paths.document, name);
  }
  try {
    dir.create({ intermediates: true, idempotent: true });
  } catch {
    // An existing folder is fine; a real failure surfaces on first write.
  }
  let backupExcluded = false;
  try {
    if (ScribeFiles) {
      ScribeFiles.setExcludedFromBackup(dir.uri, true);
      backupExcluded = ScribeFiles.isExcludedFromBackup(dir.uri);
    }
  } catch {
    backupExcluded = false;
  }
  return { dir, backupExcluded };
}
