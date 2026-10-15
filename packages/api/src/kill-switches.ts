/**
 * The kill-switch vocabulary (ADR 0016 5.1, F19 6.5; R2 AR-12). `true` means
 * the feature is stopped. Each one only stops a server-dependent feature:
 * there is no switch for recording, typing, saving, reading, playback or
 * export (LEGAL-REQ-040), and none can turn a feature on.
 *
 * A leaf module (no imports), so Edge Functions import it directly for the
 * server-side switch (`KILL_SWITCHES` function secret, same names).
 */
export const KILL_SWITCH_KEYS = [
  /** Upload and download of letters. Local writing and reading continue. */
  'sync',
  /** Creating and redeeming co-parent invites. */
  'invites',
  /** Photo upload and signed photo URLs. */
  'photos',
  /** New pack downloads (installed packs keep working). */
  'packDownloads',
  /** Server content blocks (the packaged copy is used instead). */
  'serverContent',
  /**
   * New uploads of the owner's encrypted recordings (F08 6.5 A; R2 AR-12).
   * What is backed up stays backed up and restorable; nothing local changes.
   */
  'backupUploads',
  /**
   * Restores through the recovery key, on the phone and in the `escrow`
   * function (F08 6.5 C9). The function also reads its own project's switch,
   * so it can be stopped without any phone.
   */
  'escrow',
  /** The subscription status report (D-080). Phone reminders keep working (F14 6.6). */
  'statusReport',
] as const;
export type KillSwitchKey = (typeof KILL_SWITCH_KEYS)[number];

/** Switches added on 15 Oct 2026 (M14). Older signed configs omit them and parse as off. */
export const M14_KILL_SWITCH_KEYS: readonly KillSwitchKey[] = ['backupUploads', 'escrow', 'statusReport'];

/**
 * Server side: `KILL_SWITCHES=invites,statusReport` in a function's secrets
 * stops that feature in the function itself, without a phone and without a
 * redeploy [A: a changed secret applies to the next invocation; checked on
 * the first staging deploy]. Unknown names are ignored; empty means none.
 */
export function parseKillSwitchList(raw: string | null | undefined): Set<KillSwitchKey> {
  const out = new Set<KillSwitchKey>();
  for (const part of (raw ?? '').split(',')) {
    const k = part.trim();
    if ((KILL_SWITCH_KEYS as readonly string[]).includes(k)) out.add(k as KillSwitchKey);
  }
  return out;
}
