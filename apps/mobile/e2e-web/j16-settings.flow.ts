import { btn, journey } from './support/app';
import { expect, seeded, test } from './support/journey';
import { MAMA, mockServer } from './support/mock-server';

// The "Early version" heading is gone (founder, 8 Nov 2026; CLO-5): the registered note says "early" once.
const EARLY = 'Early version';
const SIGN_OFF = 'Made with care in California';
const EARLY_BODY = /is an early version, and it can make mistakes\. Some things may change\. Export a copy of your letters now and then\./;

test('[J16] settings: home, privacy, appearance, help, licenses, about', async ({ app, record }) => {
  const step = journey(record, 'J16', 'settings-and-help', 1, 'J15-02');
  await seeded(app, 'asha', '/settings');
  await expect(app.getByText('Version', { exact: true })).toBeVisible();
  // S40: the early-version note sits only under About, as its footer, after the version row; the privacy line once.
  const about = app.getByTestId('settings.about.beta');
  await expect(about.getByText(EARLY_BODY)).toBeVisible();
  await expect(app.getByText(EARLY, { exact: true })).toHaveCount(0);
  // The sign-off is the last line, under the note (CDesO-2).
  await expect(app.getByTestId('settings.signOff')).toHaveText(SIGN_OFF);
  const signOffBox = await app.getByTestId('settings.signOff').boundingBox();
  // CPrivO-5: the short privacy line moved to Settings, Privacy (its last line).
  await expect(app.getByText('Private by default. Never sold, never used for ads.')).toHaveCount(0);
  const versionBox = await app.getByText('Version', { exact: true }).boundingBox();
  const noteBox = await about.boundingBox();
  expect(noteBox!.y).toBeGreaterThan(versionBox!.y);
  expect(signOffBox!.y).toBeGreaterThan(noteBox!.y);
  await step('happy', 'Settings', 'Every destination one tap away: Plan, children, spoken language, Your words, reminders, appearance, privacy, export, Recently deleted, Where your letters live, storage, help, If you are struggling, legal, Licenses and version. No Account or Delete account rows with server features off. The short privacy line is on Privacy now, and the early-version note is About\'s footer, word for word, with no heading of its own, so About says "early" once; then the sign-off "Made with care in California". On web there is no installed build number, so Version shows the version alone.');

  await app.getByText('Privacy', { exact: true }).first().click();
  // CPrivO-5: the promise word for word at the top, no icons; facts, then what you can do, then the documents.
  await expect(app.getByTestId('privacy.promise')).toBeVisible();
  await expect(app.getByText('What we never do', { exact: false })).toHaveCount(0);
  await expect(app.getByText('Anyone who can unlock this iPhone can open the book.', { exact: true })).toBeVisible();
  await expect(app.getByText('Private by default. Never sold, never used for ads.')).toHaveCount(1);
  await step('happy', 'Privacy', 'The promise word for word at the top, with no icon. Where your book is kept (on this phone, not sent to us; iPhone backup includes your recordings, if iCloud Backup is on; speech written down on this phone; no usage or crash reports), Who can see it (anyone who can unlock this iPhone; Names in notifications; notifications never show the words), What you can do (Export, Recently deleted; no account in this version), then the Privacy Policy and Terms, and the short privacy line last.');
  await app.goBack();

  await app.getByText('Appearance', { exact: true }).first().click();
  await expect(app.getByText('Reading size')).toBeVisible();
  await step('happy', 'Appearance', 'Theme (Match this phone, Light, Dark) and reading size with a live sample line.');
  await app.getByText('Large print', { exact: true }).click();
  await step('happy', 'Large print reading size', 'The sample line grows to the largest size.');
  await app.goBack();

  // S40: a row that pushes its own page, never an accordion inside the list.
  await app.getByText('If you are struggling', { exact: true }).click();
  await expect(app.getByText('The early months ask a lot of anyone.', { exact: false })).toBeVisible();
  await expect(app.getByText('In danger right now?', { exact: true })).toBeVisible();
  await expect(app.getByText('Lines in other countries', { exact: true })).toBeVisible();
  await expect(app.getByText('Nothing on this page is recorded or sent.', { exact: true })).toBeVisible();
  await step('happy', 'If you are struggling', 'Always available, never behind a flag, one tap from Settings: its own page with the emergency line first, then the lines for the phone\'s own region, each with Call and Text (a region with no lines held shows "Call your local emergency number." and Find a free helpline near you), then Lines in other countries and "Nothing on this page is recorded or sent." No drawing, no light, no motion.');
  await app.getByText('Lines in other countries', { exact: true }).click();
  await expect(app.getByText('United Kingdom', { exact: true })).toBeVisible();
  await expect(app.getByText('Find a free helpline near you', { exact: true })).toBeVisible();
  await step('happy', 'Lines in other countries', 'Every region held (United States, Canada, United Kingdom, Ireland, Australia, New Zealand, India), each with its emergency number and its lines, then the directory.');
  await app.goBack();
  await app.goBack();

  await app.getByText('Licenses', { exact: true }).click();
  await expect(app.getByText('This app is built with the help of open work by many people. Thank you.')).toBeVisible();
  await expect(app.getByText('Language data', { exact: true })).toBeVisible();
  await step('happy', 'Licenses', 'Its own page: what ships in the app, grouped by what it does (Speech, Recording and audio, Look and feel, App framework, Storage and data, Signing in, Everything else), each with one line on what it is for, and the language data word for word after Speech. A row opens to its version, copyright and full license, one at a time.');
});

test('[J16b] settings with server features on, signed out: Account, and no Delete account', async ({ app, record }) => {
  const step = journey(record, 'J16', 'settings-and-help', 20, 'J16-01');
  await mockServer(app, { user: MAMA });
  await app.goto(`${process.env.E2E_WEB_ON_URL}/?seed=asha`);
  await expect(app.locator('body')).not.toBeEmpty();
  await app.goto(`${process.env.E2E_WEB_ON_URL}/settings?seed=asha`);
  await expect(btn(app, /^Account/)).toBeVisible();
  // Signed out there is no account here to delete, so the row waits for sign-in (#358 review; settings-home.test.ts
  // runs the row's condition for signed in, signed out and server features off).
  await expect(btn(app, /^Delete account/)).toHaveCount(0);
  await expect(app.getByTestId('settings.about.beta').getByText(EARLY_BODY)).toBeVisible();
  await expect(app.getByText(EARLY, { exact: true })).toHaveCount(0);
  await step('happy', 'Settings, server features on', 'With sign-in in the build, Account sits at the top of the first section (S40). Delete account, in its own section above Help, shows only once the person is signed in, so it is not here while signed out. The early-version note is still only under About.');
});
