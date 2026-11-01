/**
 * Settings, Recordings (EXPERIENCE_PASS_2026-10 S42, package P6): the card at the top and the language row, pure so
 * test/settings-p6b.test.ts runs them in Node. app/settings/recordings.tsx draws them.
 *
 * The card says where recordings are kept, from backup's own state (lib/backup gate and backupView, the same view the
 * Settings home row reads):
 *   a build without backup       "Kept on this phone" + onPhoneBody (it already says Export, so no footer)
 *   backup off, or signed out    "Kept on this phone" + onPhoneBodyBackupOff, footer exportFooter
 *   backup on                    "Kept on this phone and backed up" + backedUpBody, footer exportFooter, and one row,
 *                                "Back up my recordings", that opens it
 * The two backup lines are disclosure text that counsel approves before anything shows them (C7, D-102), so until
 * C7_CLEARED is switched on a build with backup keeps today's card (onPhoneTitle + onPhoneBody). Build 2 ships with
 * backup off, where that card is the whole truth. None of them ever says the recordings are only on this phone.
 *
 * The language row is actionable when the model is missing: its trailing word says what a tap does ("Download", or
 * "Remove" once it is here), and while it downloads a small determinate ring shows "Getting ready, 40%".
 */
import { backupCopy, speechSettingsCopy } from '@scribe/content';
import { copy, fill } from '@/lib/copy';

/**
 * Held for counsel (C7, D-102): `settings.recordings.onPhoneBodyBackupOff`, `backedUpTitle` and `backedUpBody` show
 * nothing until counsel approves them. The switch is this one line.
 */
export const C7_CLEARED = false;

/** Backup's status kinds that mean the person has it off (the Settings home row reads them as Off). */
const OFF = new Set(['off', 'needs_consent']);

export type RecordingsCard = { title: string; body: string; footer: string | null; backupRow: string | null };

export function recordingsCard(input: { inBuild: boolean; status: string | null; c7Cleared?: boolean }): RecordingsCard {
  const r = copy.settings.recordings;
  const cleared = input.c7Cleared ?? C7_CLEARED;
  if (!input.inBuild || !cleared) return { title: r.onPhoneTitle, body: r.onPhoneBody, footer: null, backupRow: null };
  // Signed out (no view yet), unavailable, off or waiting for consent: our backup can keep them, it does not yet.
  if (input.status === null || input.status === 'unavailable' || OFF.has(input.status)) {
    return { title: r.onPhoneTitle, body: r.onPhoneBodyBackupOff, footer: r.exportFooter, backupRow: null };
  }
  return { title: r.backedUpTitle, body: r.backedUpBody, footer: r.exportFooter, backupRow: backupCopy.title };
}

export type SpeechRowState =
  | { kind: 'here'; mb: number }
  | { kind: 'downloading'; fraction: number }
  | { kind: 'waitingForWifi'; mb: number }
  | { kind: 'noSpace'; mb: number }
  | { kind: 'absent'; mb: number }
  /** The web design preview: files cannot be read, so the row shows the size and offers nothing. */
  | { kind: 'unknown'; mb: number };

export type SpeechRow = { subtitle: string; action: 'download' | 'remove' | null; trailing: string | null; percent: number | null; hint: string | undefined };

export function speechRow(state: SpeechRowState): SpeechRow {
  const s = speechSettingsCopy;
  switch (state.kind) {
    case 'here':
      return { subtitle: fill(s.ready, { n: state.mb }), action: 'remove', trailing: s.confirmButton, percent: null, hint: s.removeHint };
    case 'downloading': {
      const percent = Math.max(0, Math.min(100, Math.floor(state.fraction * 100)));
      return { subtitle: fill(s.downloading, { n: percent }), action: null, trailing: null, percent, hint: undefined };
    }
    case 'waitingForWifi':
      return { subtitle: fill(s.waitingForWifi, { n: state.mb }), action: null, trailing: null, percent: null, hint: undefined };
    case 'noSpace':
      return { subtitle: fill(s.noSpace, { n: state.mb }), action: null, trailing: null, percent: null, hint: undefined };
    case 'absent':
      return { subtitle: fill(s.absent, { n: state.mb }), action: 'download', trailing: s.downloadButton, percent: null, hint: s.downloadHint };
    default:
      return { subtitle: fill(s.absent, { n: state.mb }), action: null, trailing: null, percent: null, hint: undefined };
  }
}
