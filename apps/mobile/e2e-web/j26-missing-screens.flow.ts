import { brand } from '@scribe/brand';
import { en, languageCopy } from '@scribe/content';
import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

/**
 * J26 (BL-410, missing screens): Settings, Spoken language and Settings, Legal (the Terms of Service and Privacy Policy
 * rows, and Licenses). Every word the flow looks for comes from @scribe/content and @scribe/brand, so a copy change moves
 * the test with the app. Selectors started from the J23 flow in closed PR #1399 (head bea7ff04), which was never run.
 *
 * Not captured here, on purpose: Storage (its page needs expo-file-system, which throws on web; see support/build-index.mjs
 * and j14-recordings.flow.ts), Help (a row that opens the mail app, with no page of its own), and the Terms and Privacy
 * documents themselves (the rows open the website in the in-app browser, so there is no in-app page to capture).
 */
const h = en.settingsHome;

// KNOWN FAILING ON WEB, run 24 Nov 2026 on develop 5d955777: the page shows "This page didn't open" because `usePacks`
// reads `FileSystem.Paths.document`, which throws on web (support/build-index.mjs says the same of this screen and
// Storage). It is a web-build limit, not an iPhone defect. `test.fail` keeps the real expectations in the suite and turns
// red the day the screen renders on web, so the marker is then removed. No backlog row owns it yet (the mobile agent should).
test.fail('[J26] Spoken language', async ({ app, record }) => {
  const step = journey(record, 'J26', 'missing-screens', 1, 'J16-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText(h.languageLabel, { exact: true }).click();
  await expect(app.getByText(languageCopy.primaryTitle, { exact: false })).toBeVisible();
  await expect(app.getByText(languageCopy.keyboardTitle, { exact: false })).toBeVisible();
  await step('happy', languageCopy.title, 'The language the parent speaks in, with the characters and spelling choices where they apply, and the typing note.');
});

test('[J26b] Legal: Terms of Service, Privacy Policy and Licenses', async ({ app, record }) => {
  const step = journey(record, 'J26', 'missing-screens', 2, 'J16-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText(h.legalLabel, { exact: true }).click();
  await expect(app.getByText(h.termsLabel, { exact: true })).toBeVisible();
  await expect(app.getByText(h.privacyPolicyLabel, { exact: true })).toBeVisible();
  await expect(app.getByText(h.licencesLabel, { exact: true })).toBeVisible();
  await step('happy', h.legalLabel, `One page with three rows: ${h.termsLabel} and ${h.privacyPolicyLabel} (they open ${brand.web.terms} and ${brand.web.privacy} in the in-app browser) and ${h.licencesLabel}.`);
});
