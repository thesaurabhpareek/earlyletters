import { btn, journey } from './support/app';
import { expect, seeded, test } from './support/journey';
import { MAMA, mockServer } from './support/mock-server';

const EARLY = 'Early version';
const EARLY_BODY = /is an early version, and it can make mistakes\. Some things may change\. Export a copy of your letters now and then\./;

test('[J16] settings: home, privacy, appearance, help, licenses, about', async ({ app, record }) => {
  const step = journey(record, 'J16', 'settings-and-help', 1, 'J15-02');
  await seeded(app, 'asha', '/settings');
  await expect(app.getByText('Version', { exact: true })).toBeVisible();
  // S40: the early-version note sits only under About, as its footer, after the version row; the privacy line once.
  const about = app.getByTestId('settings.about.beta');
  await expect(about.getByText(EARLY, { exact: true })).toBeVisible();
  await expect(about.getByText(EARLY_BODY)).toBeVisible();
  await expect(app.getByText(EARLY, { exact: true })).toHaveCount(1);
  await expect(app.getByText('Private by default. Never sold, never used for ads.')).toHaveCount(1);
  const versionBox = await app.getByText('Version', { exact: true }).boundingBox();
  const noteBox = await about.boundingBox();
  expect(noteBox!.y).toBeGreaterThan(versionBox!.y);
  await step('happy', 'Settings', 'Every destination one tap away: Plan, children, spoken language, reminders, appearance, privacy, export, Recently deleted, recordings, storage, help, If you are struggling, legal, Licenses and version. No Account or Delete account rows with server features off. The short privacy line is said once, under Your data, and the "Early version" note is About\'s footer, word for word, not the first thing on the page.');

  await app.getByText('Privacy', { exact: true }).first().click();
  await expect(app.getByText('What we never do', { exact: false })).toBeVisible();
  await step('happy', 'Privacy', 'No usage switch in v1.0 (it collects no data), what is never done (ads, selling data, training models), and links to the full policies.');
  await app.goBack();

  await app.getByText('Appearance', { exact: true }).first().click();
  await expect(app.getByText('Reading size')).toBeVisible();
  await step('happy', 'Appearance', 'Theme (Match this phone, Light, Dark) and reading size with a live sample line.');
  await app.getByText('Large print', { exact: true }).click();
  await step('happy', 'Large print reading size', 'The sample line grows to the largest size.');
  await app.goBack();

  // S40: a row that pushes its own page, never an accordion inside the list.
  await app.getByText('If you are struggling', { exact: true }).click();
  await expect(app.getByText('The early months can be very hard.', { exact: false })).toBeVisible();
  await expect(app.getByRole('link', { name: /National Maternal Mental Health Hotline/ })).toBeVisible();
  await expect(app.getByRole('link', { name: /988 Lifeline/ })).toBeVisible();
  await expect(app.getByRole('link', { name: /Postpartum Support International/ })).toBeVisible();
  await expect(app.getByText('If you or your baby are in danger right now, call 911.')).toBeVisible();
  await step('happy', 'If you are struggling', 'Always available, never behind a flag, one tap from Settings: its own page with the three free, confidential lines (each row starts a call) and the 911 line, word for word. No drawing, no light, no motion.');
  await app.goBack();

  await app.getByText('Licenses', { exact: true }).click();
  await expect(app.getByText('This app is built with the help of open work by many people. Thank you.')).toBeVisible();
  await expect(app.getByText('Language data', { exact: true })).toBeVisible();
  await step('happy', 'Licenses', 'Its own page: the speech models and icons, the language data word for word, then every bundled library, font and vendored file grouped by licence. A row opens its notice, one at a time.');
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
  await expect(app.getByTestId('settings.about.beta').getByText(EARLY, { exact: true })).toBeVisible();
  await expect(app.getByText(EARLY, { exact: true })).toHaveCount(1);
  await step('happy', 'Settings, server features on', 'With sign-in in the build, Account sits at the top of the first section (S40). Delete account, in its own section above Help, shows only once the person is signed in, so it is not here while signed out. The early-version note is still only under About.');
});
