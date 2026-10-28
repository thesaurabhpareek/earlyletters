/**
 * J22 Sign-in and Account with server features on (D-100; EXPERIENCE_PASS_2026-10 chapter 7, S52 to S56, package P8a):
 * the real screens of the server-on build (global-setup.ts, `.results/web-dist-server-on`) against a mocked Supabase
 * (support/mock-server.ts).
 *
 * What this proves in a browser: each entry point of the sign-in sheet says what is true for it, in one sentence, under
 * the registered privacy line; "Not now" closes and asks nothing of the server; after the first kept letter the sheet
 * rises over the Book, never in place of Review (5.8 row 5b); email asks only on submit, an offline or failed try says
 * the letters are safe first, the code screen shows the address and a wrong code clears the field; account setup shows
 * the registered Terms and sensitive-data words, the age step only as the gate's question, and a decline the same size
 * as an accept that leaves the person signed in with nothing synced; Account says how you signed in.
 * What it cannot prove: Apple's and Google's sheets, AutoFill offering an address or a code, the iOS sheet and its
 * detents, VoiceOver, Dynamic Type, the native sign-out confirm (react-native-web shows no Alert), or the real server
 * (test/auth-machine.test.ts and supabase/tests). Those are on the phone list (DEVICE_TEST_PLAN S1-06 to S1-08, V-06).
 * Fictional family Asha only; the addresses are example.invalid.
 */
import type { Page } from '@playwright/test';
import { btn, CHILD, firstRun, journey, passAgeGate, selectedTab, tab, typeLetter } from './support/app';
import { allowConsoleError, expect, test } from './support/journey';
import { MAMA, mockServer, type MockServer } from './support/mock-server';

const ON = () => process.env.E2E_WEB_ON_URL!;
const EMAIL = 'mama@example.invalid';
const PRIVACY = 'Only you and the people you invite can read your letters. We never sell them or use them for ads.';
const SAFE = 'Your letters are safe on this phone.';
const BODY = `Your letters come with you to a new phone, and ${CHILD}'s other parent can write in the same book.`;
const TOKEN = 'q8Zr0_Yc-3Jk9LmN2pQ4sT6vW8xZ1aB3cD5eF7gH9iJ';

async function openOn(page: Page, path = '/') {
  await page.goto(`${ON()}${path}`);
  await expect(page.locator('body')).not.toBeEmpty();
}

/** The sheet's words that every entry point shares: the ways in, the registered privacy line and Not now. */
async function expectSheet(page: Page, title: string, body: string) {
  // `.last()`: on the web the page that opened the sheet stays in the tree under it (Account says the same body).
  await expect(page.getByRole('heading', { name: title, exact: true }).last()).toBeVisible();
  await expect(page.getByText(body, { exact: true }).last()).toBeVisible();
  await expect(btn(page, 'Continue with email')).toBeVisible();
  await expect(page.getByText(PRIVACY, { exact: true })).toBeVisible();
  await expect(btn(page, 'Not now')).toBeVisible();
  // No "we" outside the registered privacy line, and no line about "this build".
  const words = (await page.locator('body').innerText()).replace(PRIVACY, '');
  expect(words).not.toMatch(/\bwe\b|in this build/i);
}

/** Email and code through the mocked server. */
async function signInWithEmail(page: Page) {
  await btn(page, 'Continue with email').click();
  await page.getByLabel('Email', { exact: true }).fill(EMAIL);
  await btn(page, 'Send link').click();
  await expect(page.getByText(`A link and a code are on their way to ${EMAIL}.`)).toBeVisible();
  await page.getByLabel('Code', { exact: true }).fill('123456');
}

/** The consent gate as a script: what is missing, and record_policy_act filling it in. */
function consentGate(m: MockServer, start: { terms: boolean; age: boolean; sensitive: boolean }) {
  const gate = { ...start, declined: false };
  m.rpc('my_sync_gate', () => ({
    body: [{ terms_current: gate.terms, age_attested: gate.age, sensitive_data: gate.sensitive, content_allowed: gate.terms && gate.age && gate.sensitive }],
  }));
  m.rpc('policy_actions_needed', () => ({ body: gate.terms ? [] : [{ document: 'terms', version: '1.5.0' }] }));
  m.table('policy_versions', () => ({ body: [{ version: '1.0.0', major: 1, minor: 0, patch: 0 }] }));
  m.table('my_policy_state', () => ({ body: gate.declined ? [{ document: 'sensitive-data', action: 'decline' }] : [] }));
  m.rpc('record_policy_act', (c) => {
    const a = c.body as { p_document: string; p_action: string; p_context: { age_attested?: boolean } };
    if (a.p_document === 'terms' && a.p_action === 'accept') {
      gate.terms = true;
      gate.age = a.p_context.age_attested === true;
    }
    if (a.p_document === 'sensitive-data') {
      gate.sensitive = a.p_action === 'accept';
      gate.declined = a.p_action === 'decline';
    }
    return { body: null };
  });
  return gate;
}

test('[J22] "I already have a book": the sheet, Not now, email, a wrong code, and no book here yet', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J22', 'sign-in', 1, 'J01-02');
  allowConsoleError(app, /status of (?:403|429)|ERR_INTERNET_DISCONNECTED/);
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  // "No book here yet" asks whether this account belongs to any book (a count, no rows).
  m.table('child_members', () => ({ body: [], headers: { 'content-range': '*/0' } }));
  await openOn(app);
  await passAgeGate(app);
  await btn(app, 'I already have a book').click();
  await expectSheet(app, 'Welcome back', 'Sign in the same way as last time to see every letter.');
  await step('happy', 'Sign in, "Welcome back"', 'The welcome\'s "I already have a book": one title, one sentence (sign in the same way, so no second account is made), the ways in, the registered privacy line and Not now. No book on this phone yet, so no cover (S52).');

  await btn(app, 'Not now').click();
  await expect(btn(app, 'Begin the book')).toBeVisible();
  expect(m.serverCalls(), 'Not now asks nothing of the server').toEqual([]);
  await step('unhappy', 'Not now', 'Not now closes the sheet onto the welcome as it was. Nothing is asked of the server and nothing on this phone changes (local-first).');

  await btn(app, 'I already have a book').click();
  await btn(app, 'Continue with email').click();
  await expect(app.getByRole('heading', { name: 'Continue with email' })).toBeVisible();
  await expect(app.getByText('A link and a code arrive by email. No password to remember.')).toBeVisible();
  await app.getByLabel('Email', { exact: true }).fill('mama@example');
  await expect(app.getByText("That email doesn't look quite right.")).toHaveCount(0);
  await step('happy', 'Continue with email', 'One field with the email keyboard and AutoFill, the help under it, and Send link outlined until the text looks like an address. Nothing is wrong while the person types (S53).');

  await btn(app, 'Send link').click();
  await expect(app.getByText("That email doesn't look quite right.")).toBeVisible();
  await step('unhappy', 'An address that does not look right', 'Said on submit only, under the field, with a mark beside the words; it goes as soon as the person types again.');

  m.auth('otp', () => ({ abort: true, body: undefined }));
  await app.getByLabel('Email', { exact: true }).fill(EMAIL);
  await expect(app.getByText("That email doesn't look quite right.")).toHaveCount(0);
  await btn(app, 'Send link').click();
  await expect(app.getByText(`${SAFE} Sign in once you are back online.`)).toBeVisible();
  await step('unhappy', 'Offline', 'The line says the letters are safe before anything else, then what to do (VOICE, the Error row).');

  m.auth('otp', () => ({ status: 429, body: { code: 'over_email_send_rate_limit', error_code: 'over_email_send_rate_limit', msg: 'email rate limit exceeded' } }));
  await btn(app, 'Send link').click();
  await expect(app.getByText('Sign-in emails are paused for an hour. Use Apple or Google, or try again later.')).toBeVisible();
  await step('unhappy', 'Too many emails', 'The cause and a way forward, in the person\'s words, not the system\'s.');

  m.auth('otp', () => null);
  await btn(app, 'Send link').click();
  await expect(app.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await expect(app.getByText(`A link and a code are on their way to ${EMAIL}.`)).toBeVisible();
  await expect(btn(app, 'Continue')).toBeDisabled();
  await step('happy', 'Check your email', 'The address the email went to is on screen. Tap the link on this phone, or type the code: a full code goes on its own; Continue stays for VoiceOver and Switch Control (S54).');

  m.auth('verify', () => ({ status: 403, body: { code: 'otp_expired', error_code: 'otp_expired', msg: 'Token has expired or is invalid' } }));
  await app.getByLabel('Code', { exact: true }).fill('111111');
  await expect(app.getByText("That code didn't match. Check the newest email, or send a new one.")).toBeVisible();
  await expect(app.getByLabel('Code', { exact: true })).toHaveValue('');
  await expect(app.getByLabel('Code', { exact: true })).toBeFocused();
  await step('unhappy', 'A wrong code', 'Six digits went on their own; the wrong code clears and the field takes focus again, with the line beside a mark. No shake, no red.');

  await btn(app, 'Trouble signing in?').click();
  await expect(app.getByText(/^Nothing yet\? Wait a minute, then check Spam/)).toBeVisible();
  await step('happy', 'Trouble signing in?', 'The help line opens in place: where the email may be, and the other ways in.');

  m.auth('verify', () => null);
  await app.getByLabel('Code', { exact: true }).fill('123456');
  await expect(app.getByRole('heading', { name: 'No book here yet' })).toBeVisible({ timeout: 15_000 });
  await expect(btn(app, 'Try another way')).toBeVisible();
  await step('unhappy', 'No book here yet', 'Signed in, but this account has no book: the sheet asks whether another way was used last time. "Start a book" closes onto the lit welcome (5.8 row 13).');

  await btn(app, 'Start a book').click();
  await expect(btn(app, 'Begin the book')).toBeVisible();
});

test('[J22b] the first kept letter: the sheet rises over the Book, never in place of Review', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J22', 'sign-in', 20, 'J07-03');
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  await openOn(app);
  await firstRun(app);
  await typeLetter(app, 'You put both hands on the window today and watched the rain.');
  await expect(app.getByText(`Added to ${CHILD}'s book.`)).toBeVisible();
  await expect(app.getByRole('heading', { name: `Keep ${CHILD}'s book on any phone` })).toBeVisible({ timeout: 8000 });
  await expectSheet(app, `Keep ${CHILD}'s book on any phone`, BODY);
  await expect(app.getByRole('heading', { name: 'Read it back' })).toHaveCount(0);
  await step('happy', 'Keep the book on any phone', 'After the first kept letter the sheet rises over the Book, 600 ms after the Book is on screen, so the letter is seen in its month first (5.8 row 5b). It is about this book, so its cover sits beside the title.');

  await btn(app, 'Not now').click();
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
  await expect(app.getByText('You put both hands on the window today and watched the rain.')).toBeVisible();
  expect(m.serverCalls(), 'Not now asks nothing of the server').toEqual([]);
  await step('unhappy', 'Not now, on the Book', 'Not now leaves the person on the Book with the new letter, as it was. The ask is made once (PRD-REQ-001).');
});

test('[J22c] Account: signed out, then in from Settings, with the age step and whose letters these are', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J22', 'sign-in', 30);
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  consentGate(m, { terms: true, age: false, sensitive: true });
  m.rpc('sync_books', () => ({ body: { epoch: 1, first_run_open: false, books: [] } }));
  await openOn(app, '/?seed=asha');
  await openOn(app, '/settings/account?seed=asha');
  await expect(app.getByRole('heading', { name: 'Not signed in' })).toBeVisible();
  await expect(app.getByText(BODY, { exact: true })).toBeVisible();
  await step('happy', 'Account, signed out', 'The small closed cover, "Not signed in", the sign-in sheet\'s own sentence and Sign in (S56).');

  await btn(app, 'Sign in').click();
  await expectSheet(app, 'Sign in', BODY);
  await step('happy', 'Sign in, from Account', 'The same sheet, about this book: what signing in makes true, in one sentence.');

  await signInWithEmail(app);
  await expect(app.getByRole('heading', { name: 'Are you 18 or older?' })).toBeVisible({ timeout: 15_000 });
  const yes = app.getByRole('radio', { name: 'Yes' });
  const no = app.getByRole('radio', { name: 'No' });
  await expect(yes).toHaveAttribute('aria-checked', 'false');
  await expect(no).toHaveAttribute('aria-checked', 'false');
  await expect(btn(app, 'Continue')).toBeDisabled();
  await expect(app.getByText('One quick question')).toHaveCount(0);
  await expect(app.getByText('We ask everyone the same question.')).toHaveCount(0);
  await step('happy', 'The age step', 'When Terms are current without the attestation, the gate\'s own question: the question, Yes and No with nothing selected, and Continue. Nothing else (LEGAL-REQ-002, PRD-REQ-019).');

  await yes.click();
  await btn(app, 'Continue').click();
  await expect(app.getByRole('heading', { name: 'Keep your letters in this account?' })).toBeVisible({ timeout: 15_000 });
  expect(m.rpcCalls('record_policy_act')).toHaveLength(1);
  await btn(app, 'Keep them here').click();
  await expect(app.getByText('Signed in with email')).toBeVisible({ timeout: 15_000 });
  await expect(app.getByText(EMAIL)).toBeVisible();
  await expect(app.getByText('Sync and sharing')).toBeVisible();
  await expect(app.getByText('Sign out', { exact: true })).toBeVisible();
  await step('happy', 'Account, signed in', 'How the person signed in, with its mark and the address; Sync and sharing; Devices; and Sign out as a plain row, not red: nothing is deleted. The confirm is native (not on the web).');
});

test('[J22d] account setup: Terms, then sensitive data declined at the same size, signed in with nothing synced', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J22', 'sign-in', 40, 'J22-31');
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  consentGate(m, { terms: false, age: false, sensitive: false });
  await openOn(app, '/?seed=asha');
  await openOn(app, '/settings/account?seed=asha');
  await btn(app, 'Sign in').click();
  await signInWithEmail(app);
  await expect(app.getByRole('heading', { name: 'Before your book syncs' })).toBeVisible({ timeout: 15_000 });
  await expect(
    app.getByText('Your letters stay private to you and the family you invite. We never sell them, use them for ads or use them to train machine learning models.'),
  ).toBeVisible();
  await expect(app.getByText('By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy.')).toBeVisible();
  for (const doc of ['Terms of Service', 'Privacy Policy', 'Consumer Health Data Privacy Policy']) await expect(app.getByRole('link', { name: doc, exact: true })).toBeVisible();
  await step('happy', 'Terms', 'The registered words as they are, each document a row that opens in the in-app browser, and the agree line right above "Agree and continue" (LEGAL-REQ-001).');

  await btn(app, 'Agree and continue').click();
  await expect(btn(app, 'Keep on this phone')).toBeVisible({ timeout: 15_000 });
  const agree = await btn(app, 'Agree and sync').boundingBox();
  const keep = await btn(app, 'Keep on this phone').boundingBox();
  expect(keep!.width).toBeCloseTo(agree!.width, 0);
  expect(keep!.height).toBeCloseTo(agree!.height, 0);
  await expect(app.getByText('If you keep it on this phone, syncing and sharing stay off.')).toBeVisible();
  await expect(app.getByText('You can change this any time in Settings, Privacy.')).toBeVisible();
  await step('happy', 'Sensitive data', 'Every registered line, then "Agree and sync" and "Keep on this phone" at the same height and width: a no as easy as a yes (LEGAL-REQ-006).');

  await btn(app, 'Keep on this phone').click();
  await expect(app.getByText('Signed in with email')).toBeVisible({ timeout: 15_000 });
  await expect(app.getByText('Off, kept on this phone')).toBeVisible();
  await expect(app.getByText('Agree and sync')).toBeVisible();
  expect(m.rpcCalls('sync_push'), 'nothing syncs after a decline').toHaveLength(0);
  expect(m.rpcCalls('sync_pull'), 'nothing syncs after a decline').toHaveLength(0);
  await step('happy', 'Kept on this phone, still signed in', 'The decline is recorded and the person stays signed in with sync off; Account offers "Agree and sync" for later. Nothing synced.');
});

test('[J22e] from the Family tab: sign in to invite', async ({ app, record }) => {
  const step = journey(record, 'J22', 'sign-in', 50);
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  await openOn(app, '/?seed=asha');
  await tab(app, 'Family').click();
  await btn(app, 'Invite a co-parent').click();
  await btn(app, 'Sign in').click();
  await expectSheet(app, 'Sign in to invite a co-parent', 'You both sign in, each on your own phone.');
  await step('happy', 'Sign in to invite', 'From the Family tab\'s invite: you both sign in, each on your own phone. About this book, so its cover sits beside the title.');
  await btn(app, 'Not now').click();
  expect(m.serverCalls(), 'Not now asks nothing of the server').toEqual([]);
});

test('[J22f] from an invite: sign in to join the book', async ({ app, record }) => {
  const step = journey(record, 'J22', 'sign-in', 60, 'J21-02');
  await mockServer(app, { user: MAMA, email: EMAIL });
  await openOn(app);
  await passAgeGate(app);
  await btn(app, 'I was invited').click();
  await app.getByLabel('Invite link').fill(`https://earlyletters.com/j#t=${TOKEN}`);
  await btn(app, 'Continue').click();
  await btn(app, 'Sign in').click();
  await expectSheet(app, 'Sign in to join the book', 'You each write from your own phone, in the same book.');
  await step('happy', 'Sign in to join', 'From an invite: "the book", since a book has at most two parents. Nothing about the invite is shown before sign-in (BL-322).');
});
