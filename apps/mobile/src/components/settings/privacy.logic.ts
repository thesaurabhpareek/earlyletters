/**
 * Settings > Privacy: which lines a build shows (CPrivO-5; proposals/privacy-settings.md 3 and 4;
 * SETTINGS_AND_ACCOUNT.md 11). Pure, so test/privacy-page.test.ts runs every build's variant in Node.
 *
 * - Where your book is kept (CTO ruling, 8 Nov 2026, on reviews A and B of #631):
 *   P2 `keptOnPhone` ("...They are not sent to us.") only where nothing can have reached us: a build without sync, or
 *   a sync status of exactly 'off'. P2b `keptSynced` only while the status is 'on'. While the status is 'unknown'
 *   (not read yet, offline) or 'signed_out' (a parent may have synced, then signed out), no location line at all:
 *   neither is known to be true. Then the iPhone backup line (CCO-8 wording, same as Where your letters live), P3
 *   `speechOnPhone` always, and P4 `noReports` only where the build has no analytics switch.
 * - The sync row only in a build with sync; the analytics switch only in a build with analytics (D-095).
 * - P9 `noAccount` only in a build with no sign-in; Delete account only where the account can be deleted (D-129).
 */
export type PrivacyFact = 'keptOnPhone' | 'keptSynced' | 'speechOnPhone' | 'noReports';
export type SyncStatus = 'on' | 'off' | 'unknown' | 'signed_out';

export type PrivacyPage = {
  facts: PrivacyFact[];
  syncRow: boolean;
  analyticsSwitch: boolean;
  noAccountLine: boolean;
  deleteAccountRow: boolean;
};

export function privacyPage(input: { sync: boolean; syncStatus: SyncStatus; analytics: boolean; accountDeletion: boolean; signIn: boolean }): PrivacyPage {
  const facts: PrivacyFact[] = [];
  if (!input.sync || input.syncStatus === 'off') facts.push('keptOnPhone');
  else if (input.syncStatus === 'on') facts.push('keptSynced');
  facts.push('speechOnPhone');
  if (!input.analytics) facts.push('noReports');
  return {
    facts,
    syncRow: input.sync,
    analyticsSwitch: input.analytics,
    noAccountLine: !input.signIn,
    deleteAccountRow: input.accountDeletion,
  };
}
