/**
 * The kill-switch vocabulary (ADR 0016 5.1, F19 6.5; R2 AR-12; ADR 0029). `true`
 * means the feature is hidden or stopped. A switch can hide a feature, whether it
 * needs the server or lives only on the phone (`photoMoments`, `videos`,
 * `libraryDays`); it never turns one on, and none can stop recording, typing,
 * saving, reading, playback, sweep, Erase or export (LEGAL-REQ-040). A config
 * signed before a key existed lacks it and reads as not paused (E21, CR-69 A5).
 *
 * A leaf module (no imports), so Edge Functions import it directly for the
 * server-side switch (`KILL_SWITCHES` function secret, same names).
 */
export const KILL_SWITCH_KEYS = [
  /** Upload and download of letters. Local writing and reading continue. */
  'sync',
  /** Creating and redeeming co-parent invites. */
  'invites',
  /** Adding pictures. Nothing uploads under Variant A (E38, ADR 0029). */
  'photos',
  /** New pack downloads (installed packs keep working). */
  'packDownloads',
  /** Server content blocks (the packaged copy is used instead). */
  'serverContent',
  /**
   * New uploads of the owner's encrypted recordings (F08 6.5 A; R2 AR-12).
   * What is backed up stays backed up and restorable; nothing local changes.
   * On the server: `app.backup_enabled` (SCBKO while off).
   */
  'backupUploads',
  /**
   * Restores through the recovery key, on the phone and in the `escrow`
   * function (F08 6.5 C9). On the server: `app.escrow_enabled` and the escrow
   * project's `ESCROW_SWITCH` secret, so it can be stopped without any phone.
   */
  'escrow',
  /** The subscription status report (D-080). Phone reminders keep working (F14 6.6). */
  'statusReport',
  /** Picking from the photo library for a letter (NS-51). Hides the index at next launch. Phone only. */
  'photoMoments',
  /** Video, and the several-pictures limit (NS-52). Phone only. */
  'videos',
  /**
   * First-run and account sign-in (NS-41-R25, O-19): the outage screen shows with the local
   * start. A signed-in session is never ended, refreshed differently or blocked.
   */
  'signIn',
  /**
   * The days library, Browse and the ask slip (NS-46-R28): hidden at the next focus, pending
   * library notes cancelled. Typed days and reminders stay. Read as `!== true`, not through `mayRun`.
   */
  'libraryDays',
  /**
   * Find in the Book (NS-02). Hides the Find action; the on-device index and the letters are untouched. It only
   * ever hides: the build flag `EXPO_PUBLIC_BOOK_SEARCH` is the only thing that turns Find on. Phone only, no server part.
   */
  'bookSearch',
  /**
   * Signing a letter as someone else (NS-16, BL-980). Hides the From card on Review, so a new letter signs as the
   * parent, as before. A letter already signed keeps its stored name, and the build flag `EXPO_PUBLIC_SIGN_AS_OTHER`
   * is the only thing that turns the card on. Phone only, no server part.
   */
  'signAsOther',
] as const;
export type KillSwitchKey = (typeof KILL_SWITCH_KEYS)[number];

/** Switches added on 15 Oct 2026 (M14). Older signed configs omit them and parse as off. */
export const M14_KILL_SWITCH_KEYS: readonly KillSwitchKey[] = ['backupUploads', 'escrow', 'statusReport'];

/**
 * Switches added for the new scope (E38, CL-111, CR-69 A5). Not in the M14 list: an older
 * signed config omits them and they parse as off, the same way. Additive only (API-R11).
 */
export const NEW_SCOPE_KILL_SWITCH_KEYS: readonly KillSwitchKey[] = ['photoMoments', 'videos', 'signIn', 'libraryDays', 'bookSearch'];

/**
 * Server side for our JSON functions: `KILL_SWITCHES=invites,statusReport`
 * in the main project's function secrets stops that feature in the function
 * itself, without a phone and without a redeploy [A: a changed secret
 * applies to the next invocation; checked on the first staging deploy].
 * Unknown names are ignored; empty means none. (Backup and escrow use their
 * own server switches; see scripts/packs/lib.ts SERVER_ENFORCED_KILL_SWITCHES.)
 */
export function parseKillSwitchList(raw: string | null | undefined): Set<KillSwitchKey> {
  const out = new Set<KillSwitchKey>();
  for (const part of (raw ?? '').split(',')) {
    const k = part.trim();
    if ((KILL_SWITCH_KEYS as readonly string[]).includes(k)) out.add(k as KillSwitchKey);
  }
  return out;
}
