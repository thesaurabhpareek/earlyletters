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
  // Regroup (settings-ia.md 3, CCO-9): the header card opens Plan in this build, and says where the book is kept.
  await expect(app.getByTestId('settings.headerCard').getByText('On this phone', { exact: true })).toBeVisible();
  await expect(app.getByText('Your letters', { exact: true })).toBeVisible();
  await expect(app.getByText('Privacy and security', { exact: true })).toBeVisible();
  await step('happy', 'Settings', 'A header card (the name the parent signs as, On this phone, and the plan status; in alpha the alpha note under it) that opens Plan, then five groups: Children; Writing; Your letters; Privacy and security; Help and legal (Help, If you are struggling, Legal); then About. No Account or Delete account rows with server features off. The short privacy line is said once, under Privacy and security, and the "Early version" note is About\'s footer, word for word, not the first thing on the page.');

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

  // Licenses sits on the Legal page with the Terms and the Privacy Policy (settings-ia.md 3).
  await app.getByText('Legal', { exact: true }).click();
  await expect(app.getByText('Terms of Service', { exact: true })).toBeVisible();
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
  // The header card opens Account with sign-in in the build, and a Plan row sits right under it (CCO-9).
  await expect(app.getByTestId('settings.headerCard').getByText('Not signed in', { exact: true })).toBeVisible();
  await expect(app.getByTestId('settings.plan')).toBeVisible();
  // Signed out there is no account here to delete, so the row waits for sign-in (#358 review; settings-home.test.ts
  // runs the row's condition for signed in, signed out and server features off).
  await expect(btn(app, /^Delete account/)).toHaveCount(0);
  await expect(app.getByTestId('settings.about.beta').getByText(EARLY, { exact: true })).toBeVisible();
  await expect(app.getByText(EARLY, { exact: true })).toHaveCount(1);
  await step('happy', 'Settings, server features on', 'With sign-in in the build, the header card says Not signed in and opens Account, with a Plan row right under it (CCO-9). Delete account, in its own section above Help, shows only once the person is signed in, so it is not here while signed out. The early-version note is still only under About.');
});
