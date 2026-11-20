/**
 * Settings > Where your letters live (settings-ia.md 4; design.md 2.7; SETTINGS_AND_ACCOUNT.md 7): which lines show,
 * pure so test/where-live.test.ts runs every build in Node. app/settings/where-letters-live.tsx draws them.
 *
 * Rulings it keeps:
 * - CCO-8: no line says the iPhone backup brings the book back until the device restore drill passes. The backup row
 *   says only that it includes the recordings (D-033), and the footer drops content's opening sentence.
 * - CPrivO-4: an export is a copy, never a restore; nothing here says an export brings the book back.
 * - Exec Q4, D-126: our encrypted backup is "Not in this version", never "coming".
 * - "We hold no copy." (CTO ruling, 8 Nov 2026, on reviews A and B of #639) shows only where nothing can have reached
 *   us: a build without sync, or a sync status of exactly 'off'. Never while the status is 'on', 'unknown' (not read
 *   yet, offline) or 'signed_out' (a parent may have synced, then signed out).
 * - The synced "on our servers" line only while the status is 'on'. Otherwise the plain on-this-iPhone line, which is
 *   true in every state: it says where the book is, never that it is nowhere else.
 */
import { copy, fill } from '@/lib/copy';

/** The same Settings key export.tsx writes when a copy is handed to the share sheet (D-085). */
export const LAST_EXPORT_SETTING = 'lastExportedAt';

/** Apple's own page on iCloud Backup, with the steps to see whether it is on (read 8 Nov 2026). */
export const APPLE_ICLOUD_BACKUP_HELP = 'https://support.apple.com/108366';

export type WhereLive = {
  onPhone: string;
  exportLine: string;
  backup: 'notInThisVersion' | 'row';
  footer: string | null;
  nudge: string | null;
};

export type SyncStatus = 'on' | 'off' | 'unknown' | 'signed_out';

export function whereLive(input: { sync: boolean; syncStatus: SyncStatus; backupInBuild: boolean; lastExport: string | null; dayDate: (iso: string) => string }): WhereLive {
  const w = copy.whereLive;
  const synced = input.sync && input.syncStatus === 'on';
  const nothingSent = !input.sync || input.syncStatus === 'off';
  return {
    onPhone: synced ? w.onPhoneSynced : w.onPhone,
    exportLine: input.lastExport ? fill(copy.settings.export.lastExport, { date: input.dayDate(input.lastExport) }) : w.exportEmpty,
    backup: input.backupInBuild ? 'row' : 'notInThisVersion',
    footer: nothingSent ? w.footer : null,
    nudge: input.lastExport ? null : copy.settings.export.exportNudge,
  };
}
