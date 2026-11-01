/**
 * Erase everything on this phone (BL-387; F17 6.2 F step 1; DATA-REQ-024, F14-REQ-026; D-083, D-103), the app's
 * part around store.ts `eraseEverythingLocal`. Signed out only: a phone that has signed in is refused and nothing
 * changes (F17-REQ-026 is a different flow, not built here).
 *
 * Order, and why:
 *  1. Analytics stops and forgets its ids, sending nothing (it is off in v1.0; this keeps the promise if it is on).
 *  2. The store marks the erase pending, removes every recording file (letters, deleted letters, drafts and strays
 *     in both recording folders), every listening copy, every temporary whole-frame copy and every export ZIP, then
 *     every row of every table, settings included.
 *  3. The Keychain: the free-letter count (D-083: Erase everything starts the count again, `clearLedger`) and any
 *     invite link kept from before. After the rows, so a relaunch in between cannot raise the count again from
 *     letters still present (letter-ledger.ts takes the largest of the three).
 *  4. Our reminders, scheduled and shown, so no note with a child's name stays in Notification Center.
 *  5. The pending mark goes. The age question and first run come next, because their settings are gone.
 * A kill at any point leaves the mark; `resumeEraseAtLaunch` (root layout, before any screen reads the store)
 * finishes the same steps, all of which are safe to repeat.
 *
 * Kept, on purpose (F17 6.2 F step 3): speech models (`Documents/models`) and language packs, which hold no personal
 * data and are large; Settings > Languages and speech removes them. Nothing here uses the network.
 */
import { Directory, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { stopAnalyticsForErase } from './analytics';
import { sweepListeningCopies } from './audio-enhance';
import { clearLedger } from './billing/letter-ledger';
import { removeWholeFrameCopies } from './capture/adts-file';
import { eraseAudioFile } from './capture/erase';
import { listRecordingFiles } from './capture/recordings';
import { clearPendingInvite } from './family/pending-invite';
import { forgetReminders } from './reminders/scheduler';
import { eraseEverythingLocal, eraseEverythingPending, finishEraseEverything, ledgerDb } from './store';

export type EraseEverythingResult = 'erased' | 'incomplete' | 'signed_in';

/** Cache folders that can hold a copy of letters: an export ZIP (export/device.ts) and "Export what is readable". */
const CACHE_COPIES = ['exports', 'recovery-export'] as const;

/**
 * Every recording file, listening copy, temporary copy and export left on the phone after each row's own erase.
 * A recording that will not go throws, so the rows stay for the next try (the sweep would otherwise find the file
 * with no row and bring it back as a draft).
 */
export function eraseDeviceFiles(): void {
  if (Platform.OS === 'web') return; // the web preview keeps no recordings or exports on disk (sweep.ts, erase.ts)
  for (const f of listRecordingFiles()) if (f.exists) f.delete();
  removeWholeFrameCopies(0);
  sweepListeningCopies(); // copies with no draft or letter row: run again after the rows go (finish)
  for (const name of CACHE_COPIES) {
    try {
      const dir = new Directory(Paths.cache, name);
      if (dir.exists) dir.delete();
    } catch {
      // iOS may clear Caches itself; a copy here is never read back by the app.
    }
  }
}

/** Steps 3 to 5. Each is safe to repeat. */
async function finish(): Promise<void> {
  sweepListeningCopies(); // no rows are left, so every listening copy goes
  await clearLedger(ledgerDb());
  await clearPendingInvite();
  await forgetReminders();
  finishEraseEverything();
}

/** Settings > Your data > Erase everything on this phone, after the typed confirm. */
export async function eraseEverything(): Promise<EraseEverythingResult> {
  if (!eraseEverythingPending()) {
    try {
      await stopAnalyticsForErase();
    } catch {
      // Analytics off or not started: nothing to stop.
    }
  }
  const r = eraseEverythingLocal(eraseAudioFile, eraseDeviceFiles);
  if (r !== 'erased') return r;
  await finish();
  return 'erased';
}

let resumed: Promise<EraseEverythingResult | null> | null = null;

/**
 * At launch, before any screen reads the store: an Erase everything a kill cut short is finished. The files and rows
 * go synchronously, inside this call, so the first frame already reads an empty store (and the age question); the
 * Keychain and notification steps follow. Null when no erase was pending. Once per process.
 */
export function resumeEraseAtLaunch(): Promise<EraseEverythingResult | null> {
  if (resumed) return resumed;
  let pending = false;
  try {
    pending = eraseEverythingPending();
  } catch {
    pending = false; // the store could not be read; the launch recovery screen handles that
  }
  if (!pending) {
    resumed = Promise.resolve(null);
    return resumed;
  }
  const r = eraseEverythingLocal(eraseAudioFile, eraseDeviceFiles);
  resumed = r === 'erased' ? finish().then(() => 'erased' as const, () => 'incomplete' as const) : Promise.resolve(r);
  return resumed;
}
