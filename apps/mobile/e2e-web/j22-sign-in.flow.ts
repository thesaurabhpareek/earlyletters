/**
 * J22 Sign-in and Account with server features on (D-100; EXPERIENCE_PASS_2026-10 chapter 7, S52 to S56, package P8a):
 * the real screens of the server-on build (global-setup.ts, `.results/web-dist-server-on`) against a mocked Supabase
 * (support/mock-server.ts).
 *
 * What this proves in a browser: each entry point of the sign-in sheet says what is true for it, in one sentence, under
 * the registered privacy line; "Not now" closes and asks nothing of the server; after the first kept letter the sheet
 * rises over the Book, never in place of Review (5.8 row 5b); email asks only on submit, an offline or failed try says
 * the letters are safe first, the code screen shows the address and a wrong code clears the field, and after five wrong
 * codes typing waits for 15 minutes (Playwright's clock) while the email's link, a new email and Not now still work; account setup shows
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
const OTHER = 'papa@example.invalid';
const WRONG = "That code didn't match. Check the newest email, or send a new one.";
/** While the pause holds, one line: errors.code_paused, then the ways in that still work (code.pausedOtherWays). */
const PAUSED = 'Your letters are safe. You can try a code again in 15 minutes. The link in the newest email still works, and so do the other ways to sign in.';
const RESENT = 'A new email is on its way.';
const RESEND_WAIT = 'You can send another in a minute.';
const BAD_CODE = { status: 403, body: { code: 'otp_expired', error_code: 'otp_expired', msg: 'Token has expired or is invalid' } };
const MIN = 60_000;

async function openOn(page: Page, path = '/') {
  await page.goto(`${ON()}${path}`);
  await expect(page.locator('body')).not.toBeEmpty();
}

/** The sheet's words that every entry point shares: the ways in, the registered privacy line and Not now. */
async function expectSheet(page: Page, title: string, body: string) {
  // `.last()`: on the web the page that opened the sheet stays in the tree under it (Account says the same body).
  await expect(page.getByRole('heading', { name: title, exact: true }).last()).toBeVisible();
  await expect(page.getByText(body, { exact: true }).last()).toBeVisible();
  await expect(btn(page, 'Sign in with email')).toBeVisible();
  await expect(page.getByText(PRIVACY, { exact: true })).toBeVisible();
  await expect(btn(page, 'Not now')).toBeVisible();
  // No "we" outside the registered privacy line, and no line about "this build".
  const words = (await page.locator('body').innerText()).replace(PRIVACY, '');
  expect(words).not.toMatch(/\bwe\b|in this build/i);
}

/** Email and code through the mocked server. */
async function signInWithEmail(page: Page) {
  await btn(page, 'Sign in with email').click();
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
  await btn(app, 'Sign in with email').click();
  await expect(app.getByRole('heading', { name: 'Sign in with email' })).toBeVisible();
  await expect(app.getByText('A link and a code arrive by email. No password to remember.')).toBeVisible();
  await app.getByLabel('Email', { exact: true }).fill('mama@example');
  await expect(app.getByText("That email doesn't look quite right.")).toHaveCount(0);
  await step('happy', 'Sign in with email', 'One field with the email keyboard and AutoFill, the help under it, and Send link outlined until the text looks like an address. Nothing is wrong while the person types (S53).');

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
  await expect(app.getByText("Your letters are safe. Another email can't be sent just yet. Wait a few minutes, then try again.")).toBeVisible();
  await step('unhappy', 'Too many emails', 'The letters are safe first, then the cause and a way forward, in the person\'s words, not the system\'s. It names no length the app cannot know and no provider the build may not offer (SIGN-01).');

  m.auth('otp', () => null);
  await btn(app, 'Send link').click();
  await expect(app.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await expect(app.getByText(`A link and a code are on their way to ${EMAIL}.`)).toBeVisible();
  await expect(btn(app, 'Continue')).toBeDisabled();
  // No book on this phone yet, so no "safe on this phone" line: there are no letters here (lens A1).
  await expect(app.getByText(SAFE, { exact: true })).toHaveCount(0);
  await expect(btn(app, 'Not now')).toBeVisible();
  await step('happy', 'Check your email', 'The address the email went to is on screen. Tap the link on this phone, or type the code: a full code goes on its own; Continue stays for VoiceOver and Switch Control (S54). Not now sits top right.');

  m.auth('verify', () => ({ status: 403, body: { code: 'otp_expired', error_code: 'otp_expired', msg: 'Token has expired or is invalid' } }));
  await app.getByLabel('Code', { exact: true }).fill('111111');
  await expect(app.getByText("That code didn't match. Check the newest email, or send a new one.")).toBeVisible();
  await expect(app.getByLabel('Code', { exact: true })).toHaveValue('');
  await expect(app.getByLabel('Code', { exact: true })).toBeFocused();
  const verifies = () => m.calls.filter((c) => c.path === '/auth/v1/verify');
  expect(verifies(), 'a full-length code is asked once, with no tap').toHaveLength(1);
  await step('unhappy', 'A wrong code', 'Six digits went on their own; the wrong code clears and the field takes focus again, with the line beside a mark. No shake, no red.');

  await btn(app, 'Trouble signing in?').click();
  await expect(app.getByText(/^Nothing yet\? Wait a minute, then check Spam/)).toBeVisible();
  await step('happy', 'Trouble signing in?', 'The help line opens in place: where the email may be, and the other ways in.');

  m.auth('verify', () => null);
  await app.getByLabel('Code', { exact: true }).fill('123456');
  await expect(app.getByRole('heading', { name: 'No book here yet' })).toBeVisible({ timeout: 15_000 });
  expect(verifies(), 'each full-length code is asked once').toHaveLength(2);
  await expect(btn(app, 'Try another way')).toBeVisible();
  await step('unhappy', 'No book here yet', 'Signed in, but this account has no book: the sheet asks whether another way was used last time. "Start a book" closes onto the lit welcome (5.8 row 13).');

  await btn(app, 'Start a book').click();
  await expect(btn(app, 'Begin the book')).toBeVisible();
});

test('[J22b] DR-12 B: the reminder card after the first letter; Keep the book on the first save of session 2, over the Book', async ({ app, record }) => {
  // SET-01, SET-02 (docs/reviews/2026-10-31/setup.md). This journey used to show the sheet after the first letter, which
  // was the bug: the first ask slot is the reminder card (F13-REQ-023), and Keep the book waits for session 2 or letter 2.
  test.setTimeout(150_000);
  const step = journey(record, 'J22', 'sign-in', 20, 'J07-03');
  await app.clock.install();
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  await openOn(app);
  await firstRun(app);
  await typeLetter(app, 'You put both hands on the window today and watched the rain.');
  await expect(app.getByText(`Added to ${CHILD}'s book.`)).toBeVisible();
  await expect(app.getByRole('heading', { name: 'A gentle nudge, now and then?' })).toBeVisible({ timeout: 8000 });
  await expect(app.getByRole('heading', { name: `Keep ${CHILD}'s book on any phone` })).toHaveCount(0);
  await expect(btn(app, 'Yes, evenings')).toBeVisible();
  await expect(btn(app, 'Pick a time')).toBeVisible();
  await step('happy', 'After the first letter: the reminder card', 'The first ask after the first letter is the reminder card over the Book (C-REQ-001 Rev, F13-REQ-023). The account sheet does not open (DR-12 B).');

  await btn(app, 'No reminders').click();
  await expect(app.getByText('You can write whenever you like.')).toBeVisible();
  await expect(app.getByRole('heading', { name: 'A gentle nudge, now and then?' })).toHaveCount(0);
  await app.clock.fastForward(4000);
  await expect(app.getByRole('heading', { name: `Keep ${CHILD}'s book on any phone` }), 'one ask per session').toHaveCount(0);
  expect(m.serverCalls(), 'the card asks nothing of the server').toEqual([]);

  // Session 2, the next day: a relaunch.
  const now = await app.evaluate(() => Date.now());
  await app.clock.setSystemTime(now + 25 * 60 * MIN);
  await app.reload();
  await expect(btn(app, /^Type/)).toBeVisible({ timeout: 15_000 });
  await typeLetter(app, 'You laughed at the dog all through breakfast.');
  await expect(app.getByText(`Added to ${CHILD}'s book.`)).toBeVisible();
  await expect(app.getByRole('heading', { name: `Keep ${CHILD}'s book on any phone` })).toBeVisible({ timeout: 8000 });
  await expectSheet(app, `Keep ${CHILD}'s book on any phone`, BODY);
  await expect(app.getByRole('heading', { name: 'Read it back' })).toHaveCount(0);
  await expect(app.getByRole('heading', { name: 'A gentle nudge, now and then?' })).toHaveCount(0);
  await step('happy', 'Keep the book on any phone', 'On the first save of session 2 the sheet rises over the Book, 600 ms after the Book is on screen, so the letter is seen in its month first (5.8 row 5b, DR-12 B). It is about this book, so its cover sits beside the title.');

  await btn(app, 'Not now').click();
  await expect(selectedTab(app, 'Book')).toBeVisible({ timeout: 6000 });
  await expect(app.getByText('You laughed at the dog all through breakfast.')).toBeVisible();
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
  await btn(app, 'Keep in this account').click();
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
  const acts = () => m.rpcCalls('record_policy_act').map((c) => `${(c.body as { p_document: string }).p_document}:${(c.body as { p_action: string }).p_action}`);
  expect(acts()).toEqual(['terms:accept', 'sensitive-data:decline']);
  await step('happy', 'Kept on this phone, still signed in', 'The decline is recorded and the person stays signed in with sync off; Account offers "Agree and sync" for later. Nothing synced.');

  await app.getByText('Agree and sync').click();
  await expect(app.getByText('If you keep it on this phone, syncing and sharing stay off.').last()).toBeVisible();
  await expect(app.getByText(/^Letters can hold private things, like health details about you or Asha\./).last()).toBeVisible();
  await expect(btn(app, 'Keep on this phone')).toBeVisible();
  expect(acts(), 'opening the step records nothing').toEqual(['terms:accept', 'sensitive-data:decline']);
  await step('happy', 'Agree and sync, later', 'From Account, "Agree and sync" opens the sensitive-data step with every registered line; nothing is recorded until the person answers there (LEGAL-REQ-006).');

  // `.last()`: the Account row of the same name stays in the tree under the sheet on the web.
  await btn(app, 'Agree and sync').last().click();
  await expect(app.getByRole('heading', { name: 'Keep your letters in this account?' })).toBeVisible({ timeout: 15_000 });
  expect(acts()).toEqual(['terms:accept', 'sensitive-data:decline', 'sensitive-data:accept']);
  await btn(app, 'Keep in this account').click();
  await expect(app.getByText('Sync and sharing')).toBeVisible({ timeout: 15_000 });
  await expect(app.getByText('On', { exact: true })).toBeVisible();
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

/** From the welcome to the code step through the mocked server. */
async function toCodeStep(page: Page) {
  await openOn(page);
  await passAgeGate(page);
  await btn(page, 'I already have a book').click();
  await btn(page, 'Sign in with email').click();
  await sendTo(page, EMAIL);
}

/** From the email step: an address as typed, Send link, and the code step for it (the step trims what was typed). */
async function sendTo(page: Page, typed: string) {
  await page.getByLabel('Email', { exact: true }).fill(typed);
  await btn(page, 'Send link').click();
  await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible();
  await expect(page.getByText(`A link and a code are on their way to ${typed.trim()}.`, { exact: true })).toBeVisible();
}

/** Wrong codes, one after another; each clears the field. The fifth for one address starts the pause. */
async function wrongCodes(page: Page, codes: string[]) {
  const field = page.getByLabel('Code', { exact: true });
  for (const code of codes) {
    await field.fill(code);
    await expect(page.getByText(WRONG).or(page.getByText(PAUSED))).toBeVisible();
    await expect(field).toHaveValue('');
  }
}

async function expectPaused(page: Page, why: string) {
  await expect(page.getByText(PAUSED, { exact: true }), why).toBeVisible();
  await expect(page.getByText(WRONG), why).toHaveCount(0);
  await expect(page.getByLabel('Code', { exact: true }), why).not.toBeEditable();
  await expect(btn(page, 'Continue'), why).toBeDisabled();
  // A new email stays offered: its link signs in, and sending it never ends or shortens the pause (lens A2).
  await expect(btn(page, 'Send a new email'), why).toBeVisible();
}

async function expectNotPaused(page: Page, why: string) {
  await expect(page.getByText(PAUSED, { exact: true }), why).toHaveCount(0);
  await expect(page.getByLabel('Code', { exact: true }), why).toBeEditable();
}

const codesAsked = (m: MockServer) => m.calls.filter((c) => c.path === '/auth/v1/verify');
const emailsSent = (m: MockServer) => m.calls.filter((c) => c.path === '/auth/v1/otp');

test('[J22g] the code step: Not now top right closes and asks nothing; the letters are safe only with a book here (P8a critics S2, lens A1, A3)', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J22', 'sign-in', 70, 'J22-07');
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  await toCodeStep(app);
  // A fresh install: no letters on this phone, so nothing is said about them.
  await expect(app.getByText(SAFE, { exact: true })).toHaveCount(0);
  // Not now is in the header, above the field, so the number pad never covers it (lens A3; the phone check is S1-27 (h)).
  const notNow = await btn(app, 'Not now').boundingBox();
  const field = await app.getByLabel('Code', { exact: true }).boundingBox();
  expect(notNow!.y + notNow!.height).toBeLessThanOrEqual(field!.y);
  const before = m.serverCalls().length;
  await btn(app, 'Not now').click();
  await expect(btn(app, 'Begin the book')).toBeVisible();
  expect(m.serverCalls().length, 'Not now asks nothing of the server').toBe(before);
  await step('unhappy', 'Not now, from the code step', 'Not now, top right where the number pad never covers it, closes the whole sheet onto the welcome as it was, as on the first step (S52\'s rule). Nothing changes on this phone.');

  // With Asha's book on this phone, the one thing that is true whatever the email does.
  await openOn(app, '/?seed=asha');
  await openOn(app, '/settings/account?seed=asha');
  await btn(app, 'Sign in').click();
  await btn(app, 'Sign in with email').click();
  await sendTo(app, EMAIL);
  await expect(app.getByText(SAFE, { exact: true })).toBeVisible();
  await step('happy', 'Waiting for the email, with a book here', 'Under the code field, only when this phone holds a book: "Your letters are safe on this phone." A fresh install has no letters to be safe, so it says nothing there.');
  await btn(app, 'Not now').click();
  await expect(app.getByRole('heading', { name: 'Not signed in' })).toBeVisible();
});

test('[J22h] five wrong codes: typing waits, the line says the email\'s link and Apple or Google still work, and a new email stays (P8a critics S1, lens A2)', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J22', 'sign-in', 80, 'J22-08');
  allowConsoleError(app, /status of 403/);
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  m.auth('verify', () => BAD_CODE);
  await toCodeStep(app);
  await wrongCodes(app, ['111111', '222222', '333333', '444444']);
  await expectNotPaused(app, 'four wrong codes');
  await wrongCodes(app, ['555555']);
  await expectPaused(app, 'the fifth wrong code');
  // Within the email's first minute "Send a new email" waits, as it does at any time, with its own line.
  await expect(btn(app, 'Send a new email')).toBeDisabled();
  await expect(app.getByText(RESEND_WAIT)).toBeVisible();
  await expect(btn(app, 'Use a different email')).toBeEnabled();
  await expect(btn(app, 'Not now')).toBeEnabled();
  expect(codesAsked(m), 'five codes asked, then nothing more').toHaveLength(5);
  expect(emailsSent(m), 'only the first email').toHaveLength(1);
  await step('unhappy', 'Paused after five wrong codes', 'Typing a code waits for 15 minutes. One line, read as one: the letters are safe, when a code can be tried again, and that the link in the newest email and Apple or Google still sign in. "Send a new email", another address and Not now still work.');
});

test('[J22j] the pause lifts on its own at 15 minutes: the field comes back and the paused line goes (lens B1)', async ({ app, record }) => {
  test.setTimeout(180_000);
  const step = journey(record, 'J22', 'sign-in', 81);
  allowConsoleError(app, /status of 403/);
  await app.clock.install();
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  m.auth('verify', () => BAD_CODE);
  await toCodeStep(app);
  await wrongCodes(app, ['111111', '222222', '333333', '444444']);
  // The fifth wrong code happens between these two readings of the page's clock, so the pause ends between them plus 15 minutes.
  const first = await app.evaluate(() => Date.now());
  await wrongCodes(app, ['555555']);
  await expectPaused(app, 'at once');
  const last = await app.evaluate(() => Date.now());
  const jumpTo = async (at: number) => app.clock.fastForward(Math.max(1, at - (await app.evaluate(() => Date.now()))));

  await jumpTo(first + 15 * MIN - 3_000);
  await expectPaused(app, '3 s before the pause can end');
  await jumpTo(last + 15 * MIN + 3_000);
  await expectNotPaused(app, '3 s after the pause has ended');
  await expect(app.getByText(/try a code again/), 'the stale paused line is gone').toHaveCount(0);
  await expect(app.getByText(WRONG)).toHaveCount(0);
  await expect(app.getByText(SAFE, { exact: true }), 'still no book on this phone').toHaveCount(0);
  await expect(btn(app, 'Send a new email')).toBeEnabled();
  await expect(app.getByText(RESEND_WAIT)).toHaveCount(0);
  await step('happy', 'The pause has ended', 'Fifteen minutes after the fifth wrong code the field takes a code again and the paused line goes, with nothing to tap (no countdown on screen).');

  await wrongCodes(app, ['666666']);
  await expect(app.getByText(WRONG)).toBeVisible();
  await expectNotPaused(app, 'a sixth wrong code is an ordinary wrong code');
  expect(codesAsked(m)).toHaveLength(6);
});

test('[J22k] the pause stands through a new email, another address and back, and is kept per address (lens A2, B2)', async ({ app }) => {
  test.setTimeout(180_000);
  allowConsoleError(app, /status of 403/);
  await app.clock.install();
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  m.auth('verify', () => BAD_CODE);
  await toCodeStep(app);
  await wrongCodes(app, ['111111', '222222', '333333', '444444', '555555']);
  await expectPaused(app, 'the fifth wrong code');

  // A minute on, a new email: it goes, and the pause holds (the error state was cleared by the send; the pause is not).
  await app.clock.fastForward(MIN + 1_000);
  await btn(app, 'Send a new email').click();
  await expect(app.getByText(RESENT)).toBeVisible();
  expect(emailsSent(m)).toHaveLength(2);
  await expectPaused(app, 'after a new email to the same address');

  // Use a different email, then the same address again, typed with a space and capitals: the same list, so the pause holds.
  await btn(app, 'Use a different email').click();
  await sendTo(app, ' Mama@Example.invalid');
  expect(emailsSent(m)).toHaveLength(3);
  await expectPaused(app, 'the same address from the email step');

  // Another address has its own list: nothing of the first address's five is counted for it.
  await btn(app, 'Use a different email').click();
  await sendTo(app, OTHER);
  await expectNotPaused(app, 'another address');
  await wrongCodes(app, ['666666']);
  await expect(app.getByText(WRONG)).toBeVisible();
  await expectNotPaused(app, 'another address after one wrong code');
  expect(codesAsked(m), 'nothing was asked for the first address while paused').toHaveLength(6);
});

test('[J22l] Not now waits while a code is being checked, and changes nothing: the pause is there when the person comes back (lens B3)', async ({ app }) => {
  test.setTimeout(120_000);
  allowConsoleError(app, /status of 403/);
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  let release = () => {};
  const held = new Promise<void>((done) => (release = done));
  m.auth('verify', () => (codesAsked(m).length === 5 ? { ...BAD_CODE, hold: held } : BAD_CODE));
  await toCodeStep(app);
  await wrongCodes(app, ['111111', '222222', '333333', '444444']);
  await app.getByLabel('Code', { exact: true }).fill('555555');
  // The fifth code is with the server: Not now and the other ways off this step wait for it.
  await expect(btn(app, 'Not now')).toBeDisabled();
  await expect(btn(app, 'Use a different email')).toBeDisabled();
  await expect(btn(app, 'Send a new email')).toBeDisabled();
  release();
  await expectPaused(app, 'the held fifth code came back wrong');
  await expect(btn(app, 'Not now')).toBeEnabled();

  await btn(app, 'Not now').click();
  await expect(btn(app, 'Begin the book')).toBeVisible();
  await btn(app, 'I already have a book').click();
  await btn(app, 'Sign in with email').click();
  await sendTo(app, EMAIL);
  await expectPaused(app, 'after Not now and back to the same address');
  expect(codesAsked(m)).toHaveLength(5);
});

test('[J22i] the invite sheet\'s gate says why in its own words, and nothing above Agree and sync after a decline (P8a critics S4)', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J22', 'sign-in', 90);
  const m = await mockServer(app, { user: MAMA, email: EMAIL });
  consentGate(m, { terms: false, age: false, sensitive: false });
  await openOn(app, '/?seed=asha');
  await tab(app, 'Family').click();
  await btn(app, 'Invite a co-parent').click();
  await btn(app, 'Sign in').click();
  await signInWithEmail(app);
  await expect(app.getByRole('heading', { name: 'Before your book syncs' })).toBeVisible({ timeout: 15_000 });
  await btn(app, 'Not now').last().click();
  // `.last()`: on the web the Family tab's card, with the same sentence, stays in the tree under the sheet.
  const finish = app.getByRole('button', { name: 'Finish setting up', exact: true }).last();
  await expect(app.getByText('Finish setting up your account to invite someone.').last()).toBeVisible({ timeout: 15_000 });
  await expect(finish).toBeVisible();
  await expect(app.getByText('Not set up yet')).toHaveCount(0);
  await step('unhappy', 'Invite, setup not finished', 'The invite sheet says why in its own words, as the Family tab\'s card does: "Finish setting up your account to invite someone." Account keeps "Not set up yet" as its row value.');

  await finish.click();
  await btn(app, 'Agree and continue').click();
  await btn(app, 'Keep on this phone').click();
  await expect(btn(app, 'Agree and sync')).toBeVisible({ timeout: 15_000 });
  await expect(app.getByText('If you keep it on this phone, syncing and sharing stay off.')).toHaveCount(0);
  await step('unhappy', 'Invite, after a decline', 'Nothing above "Agree and sync": the decline was the person\'s own choice, and the step it opens shows every registered line before anything is recorded.');
});
