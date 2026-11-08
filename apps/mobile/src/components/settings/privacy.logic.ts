/**
 * Settings > Privacy: which lines a build shows (CPrivO-5; proposals/privacy-settings.md 3 and 4;
 * SETTINGS_AND_ACCOUNT.md 11). Pure, so test/privacy-page.test.ts runs every build's variant in Node.
 *
 * - Where your book is kept: P2 `keptOnPhone` whenever sync is not on (every build 1 profile), P2b `keptSynced` only
 *   while sync is on; P3 `speechOnPhone` always; P4 `noReports` only where the build has no analytics switch.
 * - The sync row only in a build with sync; the analytics switch only in a build with analytics (D-095).
 * - P9 `noAccount` only in a build with no sign-in; Delete account only where the account can be deleted (D-129).
 */
export type PrivacyFact = 'keptOnPhone' | 'keptSynced' | 'speechOnPhone' | 'noReports';

export type PrivacyPage = {
  facts: PrivacyFact[];
  syncRow: boolean;
  analyticsSwitch: boolean;
  noAccountLine: boolean;
  deleteAccountRow: boolean;
};

export function privacyPage(input: { sync: boolean; syncOn: boolean; analytics: boolean; accountDeletion: boolean; signIn: boolean }): PrivacyPage {
  const facts: PrivacyFact[] = [input.sync && input.syncOn ? 'keptSynced' : 'keptOnPhone', 'speechOnPhone'];
  if (!input.analytics) facts.push('noReports');
  return {
    facts,
    syncRow: input.sync,
    analyticsSwitch: input.analytics,
    noAccountLine: !input.signIn,
    deleteAccountRow: input.accountDeletion,
  };
}
