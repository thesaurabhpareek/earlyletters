import type { Page } from '@playwright/test';
import { accountDeletionCopy as del, authCopy, en } from '@scribe/content';
import { btn, CHILD, journey, SIGNS_AS } from './support/app';
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
  // Regroup (settings-ia.md 3, CCO-9): the header card says where the book is kept; the Plan row sits under it.
  await expect(app.getByTestId('settings.headerCard').getByText('On this phone', { exact: true })).toBeVisible();
  await expect(app.getByTestId('settings.plan').getByText('Plan', { exact: true })).toBeVisible();
  await expect(app.getByText('Your letters', { exact: true })).toBeVisible();
  await expect(app.getByText('Privacy and security', { exact: true })).toBeVisible();
  await expect(app.getByTestId('settings.appLock')).toBeVisible();
  await step('happy', 'Settings', 'A header card (the name the parent signs as, and On this phone), then the Plan row right under it (the plan status, or in alpha the alpha note), then five groups: Children; Writing (Spoken language, Your words, Reminders, Appearance); Your letters (Where your letters live, Export your book, Recently deleted, Storage, and, on a phone that has never signed in, Erase everything on this phone); Privacy and security (App lock, Privacy); Help and legal (Help, If you are struggling, Legal); then About. No Account or Delete account rows with server features off. The short privacy line is on Privacy now, and the early-version note is About\'s footer, word for word, with no heading of its own, so About says "early" once; then the sign-off "Made with care in California". On web there is no installed build number, so Version shows the version alone.');

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
  await expect(app.getByText('Are you or your baby in danger right now?', { exact: true })).toBeVisible();
  await expect(app.getByText('Lines in other countries', { exact: true })).toBeVisible();
  await expect(app.getByText('Nothing on this page is recorded or sent.', { exact: true })).toBeVisible();
  await step('happy', 'If you are struggling', 'Always available, never behind a flag, one tap from Settings: its own page with the emergency line first, then the lines for the phone\'s own region, each with Call and Text (a region with no lines held shows "Call your local emergency number." and Find a free helpline near you), then Lines in other countries and "Nothing on this page is recorded or sent." No drawing, no light, no motion.');
  await app.getByText('Lines in other countries', { exact: true }).click();
  await expect(app.getByText('United Kingdom', { exact: true })).toBeVisible();
  await expect(app.getByText('Find a free helpline near you', { exact: true })).toBeVisible();
  await step('happy', 'Lines in other countries', 'Every region held (United States, Canada, United Kingdom, Australia, New Zealand, India), each with its emergency number and its lines, then the directory.');
  await app.goBack();
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
  await expect(app.getByRole('heading', { level: 1, name: authCopy.account.signedOutTitle, exact: true })).toBeVisible();
  await expect(app.getByTestId('settings.plan')).toBeVisible();
  // Signed out there is no account here to delete, so the row waits for sign-in (#358 review; settings-home.test.ts
  // runs the row's condition for signed in, signed out and server features off).
  await expect(btn(app, /^Delete account/)).toHaveCount(0);
  await expect(app.getByTestId('settings.about.beta').getByText(EARLY_BODY)).toBeVisible();
  await expect(app.getByText(EARLY, { exact: true })).toHaveCount(0);
  await step('happy', 'Settings, server features on', 'With sign-in in the build, the header card says Not signed in and opens Account, with the Plan row right under it, as in every build (CCO-9). Delete account, in its own section above Help, shows only once the person is signed in, so it is not here while signed out. The early-version note is still only under About.');
});

const EMAIL = 'mama@example.invalid';
const DAY = 24 * 60 * 60 * 1000;
const REQUEST = '0199e4a2-7b3c-7d10-8a1b-3c4d5e6f7a8b';
const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Email and code through the mocked server (as J22's sign-in flows do), from the sheet's first screen. */
async function signInWithEmail(page: Page) {
  await btn(page, authCopy.sheet.email).click();
  await page.getByLabel(authCopy.email.label, { exact: true }).fill(EMAIL);
  await btn(page, authCopy.email.send).click();
  await expect(page.getByText(authCopy.code.sentToEmail.replace('{email}', EMAIL))).toBeVisible();
  await page.getByLabel(authCopy.code.label, { exact: true }).fill('123456');
}

test('[J16c] settings signed in: Delete account, what happens, the typed word, scheduled, then Cancel deletion', async ({ app, record }) => {
  // BL-481 group 2 (CR-171): S64 against the mocked server. The request and the cancel go to the mock only, never a real server.
  test.setTimeout(120_000);
  const step = journey(record, 'J16', 'settings-and-help', 30, 'J16-20');
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  // The account lists this phone's book once it is kept in the account (the claim asks with no book listed, as in J22c).
  let book: string | null = null;
  let kept = false;
  m.rpc('sync_books', () => ({
    body: {
      epoch: 1,
      first_run_open: false,
      books: kept && book ? [{ id: book, role: 'parent', name: CHILD, members: [{ role: 'parent', is_me: true, signs_as: SIGNS_AS }], invites: [] }] : [],
    },
  }));
  // The open request, as deletion_requests holds it for this account: none until the request, none again after the cancel.
  const scheduledFor = new Date(Date.now() + 30 * DAY).toISOString();
  let open: { id: string; status: string; scheduled_for: string } | null = null;
  m.table('deletion_requests', () => ({ body: open ? [open] : [] }));
  m.rpc('request_account_deletion', () => {
    open = { id: REQUEST, status: 'scheduled', scheduled_for: scheduledFor };
    return { body: [{ request_id: REQUEST, scheduled_for: scheduledFor }] };
  });
  m.rpc('cancel_account_deletion', () => {
    open = null;
    return { body: true };
  });

  await app.goto(`${process.env.E2E_WEB_ON_URL}/?seed=asha`);
  await expect(app.locator('body')).not.toBeEmpty();
  await app.goto(`${process.env.E2E_WEB_ON_URL}/settings?seed=asha`);
  await expect(app.getByTestId('settings.signedOutCard')).toBeVisible();
  await expect(app.getByText(en.settingsHome.deleteAccountLabel, { exact: true })).toHaveCount(0);
  // The book's id on this phone, from its Settings row's address, so the account can list the same book.
  await app.getByText(CHILD, { exact: true }).first().click();
  await expect(app).toHaveURL(/\/settings\/children\/[0-9a-f-]{36}/);
  book = /\/settings\/children\/([0-9a-f-]{36})/.exec(app.url())![1];
  await app.goBack();
  await expect(app.getByTestId('settings.signedOutCard')).toBeVisible();

  // Sign in from Settings, and keep this phone's letters in the account.
  await app.getByTestId('settings.signIn').click();
  await signInWithEmail(app);
  await expect(app.getByRole('heading', { name: authCopy.claim.title })).toBeVisible({ timeout: 15_000 });
  await btn(app, authCopy.claim.keep).click();
  kept = true;
  await expect(app.getByTestId('settings.headerCard')).toBeVisible({ timeout: 15_000 });
  const row = app.getByText(en.settingsHome.deleteAccountLabel, { exact: true });
  await expect(row).toBeVisible();
  expect(m.rpcCalls('request_account_deletion'), 'nothing is asked before the person asks').toHaveLength(0);
  await step('happy', 'Settings, signed in: Delete account', 'Signed in, the header card names the account and Delete account shows in its own section above Help, in the destructive colour, with a chevron (S64). Signed out it is not there (J16b). Against a mocked server.');

  await row.click();
  await expect(app.getByRole('heading', { name: del.what.heading })).toBeVisible({ timeout: 15_000 });
  await expect(app.getByText(del.what.intro, { exact: true })).toBeVisible();
  await expect(app.getByText(new RegExp(`^${escape(del.what.deletedNone.replace('{child}', CHILD).replace(/\.$/, ''))}`))).toBeVisible();
  await expect(app.getByText(del.what.copies, { exact: true })).toBeVisible();
  await expect(app.getByTestId('deleteAccount.exportFirst')).toBeVisible();
  await expect(app.getByTestId('deleteAccount.continue')).toBeEnabled();
  await step('happy', 'What happens', 'Step 1 of 2: the intro, one line for the book (a sole parent\'s book is deleted, with this person\'s letters in it), what happens on this phone, the copies line, "Keep a copy first" with Export everything, then Continue, enabled once every book\'s line is on the page.');

  await app.getByTestId('deleteAccount.continue').click();
  await expect(app.getByRole('heading', { name: del.confirm.heading })).toBeVisible();
  await expect(app.getByLabel(del.confirm.typeLabel, { exact: true })).toBeVisible();
  await expect(app.getByTestId('deleteAccount.confirm.button')).toBeDisabled();
  await expect(btn(app, del.confirm.back)).toBeVisible();
  await step('happy', 'Delete your account?', 'Step 2 of 2: the heading, the date the account would be deleted on, and the field to type delete. Delete account waits, outlined, until the word is typed; Keep my account is the quiet way back.');

  // Keep my account goes back to step 1 and asks nothing of the server.
  await btn(app, del.confirm.back).click();
  await expect(app.getByRole('heading', { name: del.what.heading })).toBeVisible();
  expect(m.rpcCalls('request_account_deletion')).toHaveLength(0);
  await app.getByTestId('deleteAccount.continue').click();

  await app.getByLabel(del.confirm.typeLabel, { exact: true }).fill(del.confirm.typeWord);
  await expect(app.getByTestId('deleteAccount.confirm.button')).toBeEnabled();
  await step('happy', 'The word typed', 'With delete typed, Delete account is filled in the destructive colour and can be pressed.');

  await app.getByTestId('deleteAccount.confirm.button').click();
  await expect(app.getByTestId('deleteAccount.scheduled')).toBeVisible({ timeout: 15_000 });
  await expect(app.getByTestId('deleteAccount.scheduled').getByText(del.scheduled.heading, { exact: true })).toBeVisible();
  await expect(app.getByText(del.scheduled.emailNote, { exact: true })).toBeVisible();
  await expect(app.getByTestId('deleteAccount.cancel')).toBeVisible();
  await expect(app.getByTestId('deleteAccount.signOut')).toBeVisible();
  expect(m.rpcCalls('request_account_deletion'), 'one request, after the press').toHaveLength(1);
  expect(m.rpcCalls('request_account_deletion')[0].body).toMatchObject({ p_source: 'ios' });
  await step('happy', 'Deletion scheduled', 'One request reached the server, and the page swaps in place: Deletion scheduled, the date, the line that a confirmation is on its way, Cancel deletion and Sign out of this phone. No export here.');

  await app.getByTestId('deleteAccount.cancel').click();
  await expect(app.getByText(del.scheduled.cancelled, { exact: true })).toBeVisible({ timeout: 15_000 });
  expect(m.rpcCalls('cancel_account_deletion')).toHaveLength(1);
  await expect(app).toHaveURL(/\/settings(\?[^/]*)?$/);
  await expect(app.getByText(en.settingsHome.deleteAccountLabel, { exact: true })).toBeVisible();
  await step('unhappy', 'Deletion cancelled', 'The person changes their mind: Cancel deletion asks the server once, the page goes back to Settings, and the toast says the letters and books are back, just as they were.', undefined, { settle: 120 });
});
