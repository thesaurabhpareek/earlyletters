/**
 * Where recordings live on this phone. One answer, for every part of the
 * app that must see all of them: the launch sweep (sweep.ts), erase
 * (erase.ts) and "Export what is readable" (resilience/recovery-export.ts).
 *
 * Two folders, listed in this order:
 * 1. The top of Documents: older layouts, and recordings a backup restore
 *    puts back by file name.
 * 2. The recorder's own folder, `Documents/ExpoAudio` on iOS and
 *    `<files>/Audio` on Android (sweep.logic.ts recorderFolder). Every take
 *    is written here. It comes last so it wins a same-name clash in the
 *    sweep's by-name map (it is where the recorder put the file).
 *
 * Not recursive, on purpose: Documents also holds the database (`SQLite/`)
 * and the speech models (`models/`), and on Android the packs and remote
 * folders; none of them hold recordings. Caches is not listed: the recorder
 * has written to Documents (`directory: 'document'`) since its first commit
 * on 2 Oct 2026, so no build ever left a take there.
 *
 * Nothing here logs, and nothing here reads what a recording holds.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { fileNameOf, isAudioFile, recorderFolder } from './sweep.logic';

/** The folders that hold recordings, top of Documents first, then the recorder's folder. */
export function recordingFolders(): Directory[] {
  const documents = Paths.document;
  return [documents, new Directory(documents, recorderFolder(Platform.OS))];
}

/**
 * Every recording in those folders, in one synchronous pass. A folder that
 * does not exist yet (no take has been recorded) counts as empty. A folder
 * that exists but cannot be listed throws: the caller must not plan on half
 * a snapshot, where a take it cannot see would look like no take at all.
 */
export function listRecordingFiles(): File[] {
  const out: File[] = [];
  for (const dir of recordingFolders()) {
    if (!dir.exists) continue;
    for (const item of dir.list()) {
      if (item instanceof File && isAudioFile(item.uri)) out.push(item);
    }
  }
  return out;
}

/**
 * The file a stored path names, and a file of the same name in each
 * recording folder. After iOS moves the app's container, a stored path
 * names the old one while the recording sits in this one; the sweep pairs
 * them by name, so erasing must remove that file too, or the next sweep
 * would find it with no row and bring it back as a draft.
 */
export function filesForRecording(uri: string): File[] {
  const out = [new File(uri)];
  const name = fileNameOf(uri);
  if (!isAudioFile(name) || name.includes('/')) return out;
  for (const dir of recordingFolders()) out.push(new File(dir, name));
  return out;
}
