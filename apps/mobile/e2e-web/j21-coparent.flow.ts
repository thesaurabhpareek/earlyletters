/**
 * J21 Co-parent sharing with server features on (D-100; the TestFlight alpha of D-106): the real
 * screens of the server-on build (global-setup.ts, `.results/web-dist-server-on`) against a mocked
 * Supabase (support/mock-server.ts). The kill path, the same app with the switch off, is J17.
 *
 * What this proves in a browser: "I was invited" is back; before sign-in nothing about the invite
 * is asked of the server or shown; after sign-in the sheet asks first and shows only the inviter's
 * sign-off; nothing joins before Join; a full book is said plainly; the Family tab is live and an
 * invite goes out with only the token's hash on the wire. What it cannot prove: the real server
 * (test/family-e2e.test.ts runs the SQL), universal links, the iOS share sheet, two phones.
 * Fictional family Asha only.
 */
import { createHash } from 'node:crypto';
import type { Page } from '@playwright/test';
import { btn, CHILD, journey, passAgeGate, SIGNS_AS } from './support/app';
import { allowConsoleError, expect, test } from './support/journey';
import { ASHA_BOOK, MAMA, mockServer, PAPA, pgError, stubShareSheet, type MockServer } from './support/mock-server';

const ON = () => process.env.E2E_WEB_ON_URL!;
// A device-made invite token: 43 base64url characters (32 random bytes).
const TOKEN = 'q8Zr0_Yc-3Jk9LmN2pQ4sT6vW8xZ1aB3cD5eF7gH9iJ';
const LINK = `https://earlyletters.com/j#t=${TOKEN}`;

async function openOn(page: Page, path = '/') {
  await page.goto(`${ON()}${path}`);
  await expect(page.locator('body')).not.toBeEmpty();
}

/** Email sign-in through the mocked server, ending back on the sheet that asked for it. */
async function signInWithEmail(page: Page, email: string) {
  await btn(page, 'Continue with email').click();
  await page.getByLabel('Email', { exact: true }).fill(email);
  await btn(page, 'Send link').click();
  await page.getByLabel('Code', { exact: true }).fill('123456');
  await expect(page.getByText('Check your email')).toHaveCount(0, { timeout: 15_000 });
}

const restCalls = (m: MockServer) => m.calls.filter((c) => c.path.startsWith('/rest/'));

test('[J21] invitee: "I was invited", a generic landing before sign-in, then ask before joining', async ({ app, record }) => {
  const step = journey(record, 'J21', 'co-parent-sharing', 1, 'J01-02');
  const m = await mockServer(app, { user: PAPA, email: 'papa@example.invalid' });
  m.rpc('peek_invite', () => ({ body: { inviter: 'Mama', role: 'parent' } }));
  m.rpc('accept_child_invite', () => ({ body: ASHA_BOOK }));
  m.table('children', () => ({ body: { name: CHILD } }));
  await openOn(app);
  await passAgeGate(app);
  await expect(btn(app, 'I was invited')).toBeVisible();
  await step('happy', 'Welcome, with "I was invited"', 'With server features on the door is back (D-100 amends D-087): Begin the book, and a quiet "I was invited" for a parent whose partner already started one.');

  await btn(app, 'I was invited').click();
  await expect(app.getByText('Join a book')).toBeVisible();
  await step('happy', 'Paste the invite', 'The link from the message is pasted here. The clipboard is read only from what is pasted, never on its own (A-REQ-029). Build 2 invites are links only, so a typed code is not read.');

  await app.getByLabel('Invite link').fill(`Hi, it's Mama. Join me for ${CHILD}: ${LINK}`);
  await btn(app, 'Continue').click();
  await expect(app.getByText('You were invited to a book')).toBeVisible();
  await expect(app.getByText('You each write from your own phone, in the same book.')).toBeVisible();
  await expect(app.getByText('Mama')).toHaveCount(0);
  await expect(app.getByText(CHILD)).toHaveCount(0);
  expect(restCalls(m), 'nothing is asked of the server before sign-in').toEqual([]);
  await step('happy', 'Invited, not signed in', 'A generic line and Sign in. Nothing about the invite is known yet, so nothing is shown and nothing is asked of the server (BL-322): the token waits in the Keychain (A-REQ-028).');

  await btn(app, 'Sign in').click();
  await signInWithEmail(app, 'papa@example.invalid');
  await expect(app.getByText('Join this book as a parent?')).toBeVisible();
  await expect(app.getByText('Invited by Mama')).toBeVisible();
  await expect(app.getByText(CHILD)).toHaveCount(0);
  expect(m.rpcCalls('peek_invite')).toHaveLength(1);
  expect(m.rpcCalls('peek_invite')[0].body).toEqual({ p_token: TOKEN });
  expect(m.rpcCalls('accept_child_invite'), 'nothing joins before Join').toHaveLength(0);
  await step('happy', 'Ask before joining', 'Signed in, the sheet looks first (peek_invite) and shows only who sent it, by the name the child calls them. Never the child\'s name. Nothing joins until Join is tapped; Not now forgets the link (BL-322, security review H2).');

  await btn(app, 'Join the book').click();
  await expect(app.getByText(`You're in ${CHILD}'s book`)).toBeVisible();
  await expect(app.getByTestId('invite.joined.cover')).toBeVisible();
  await expect(app.getByText("Your letters and Mama's sit side by side, each signed.")).toBeVisible();
  await expect(app.getByTestId('invite.joined').getByText(`${CHILD}'s book is on its way to this phone.`)).toBeVisible();
  expect(m.rpcCalls('accept_child_invite')).toHaveLength(1);
  await step('happy', 'Joined', 'One accept, after the tap. The book\'s cover appears for the first time, with the child\'s name, and opens to the flyleaf: the name is seen here first (BL-322). The book comes with the next sync, under a thin bar with no count; the open book does not change by itself (only "Open the book" opens it). Here sync is held, so it says the book is on its way.', undefined, { settle: 900 });

  // Close before the book arrives, with sync held (critics' pass S2): no dead end. The welcome says the book has not
  // reached this phone yet, offers Try again, and "Begin the book" stays. (J21i shows the quiet wait while sync runs.)
  await btn(app, 'Close').click();
  await expect(app.getByTestId('onboarding.joinWait').getByText(`${CHILD}'s book has not reached this phone yet.`)).toBeVisible();
  await expect(app.getByTestId('onboarding.joinWait.retry')).toBeVisible();
  await expect(btn(app, 'Begin the book')).toBeVisible();
  // J21g takes ids 6 and 7 (the P8b critics cite them), so this step takes the next free id.
  const stepClosed = journey(record, 'J21', 'co-parent-sharing', 8, 'J21-05');
  await stepClosed('unhappy', 'Closed before the book came, sync held', 'The joined sheet closes onto first run\'s welcome. Here sync cannot bring the book, so there is no dead end: the welcome says the book has not reached this phone yet, offers Try again (a sync), and keeps "Begin the book". While sync is running it says the book is on its way and hides "Begin the book" for up to 30 s (J21i); once the book is here, the welcome hands over to the Book.');
});

/** Asha's book as sync_pull sends it to the joined parent (Papa). */
const AT = '2026-10-20T09:00:00.000Z';
const ASHA_META = {
  role: 'parent',
  name: CHILD,
  nickname: null,
  date_of_birth: '2026-03-20',
  birthday_md: null,
  due_date: null,
  family_can_read: false,
  created_by_me: false,
  my_signs_as: 'Papa',
  include_in_reminders: true,
  members: [
    { profile_id: MAMA, role: 'parent', is_me: false, joined_at: AT, signs_as: 'Mama' },
    { profile_id: PAPA, role: 'parent', is_me: true, joined_at: AT, signs_as: 'Papa' },
  ],
};
const pulled = (withBook: boolean) => ({
  reset: false,
  epoch: 1,
  epoch_started_at: AT,
  books: withBook ? [{ id: ASHA_BOOK, access: 'parent', repull: false, meta_hash: 'm1', meta: ASHA_META, rows: [], cursor: null, more: false }] : [],
  gone: [],
  more: false,
});

/**
 * A fresh install joins while sync runs and answers, but the book is not in the pull until `server.hasBook` is set.
 * Ends on the joined view, the book still on its way.
 */
async function joinWhileSyncRuns(app: Page, server: { hasBook: boolean }) {
  const m = await mockServer(app, { user: PAPA, email: 'papa@example.invalid' });
  m.rpc('peek_invite', () => ({ body: { inviter: 'Mama', role: 'parent' } }));
  m.rpc('accept_child_invite', () => ({ body: ASHA_BOOK }));
  m.table('children', () => ({ body: { name: CHILD } }));
  m.rpc('sync_push', () => ({ body: { results: [], paused: false, stopped: false } }));
  m.rpc('sync_pull', () => ({ body: pulled(server.hasBook) }));
  m.rpc('sync_books', () => ({ body: { epoch: 1, first_run_open: false, books: server.hasBook ? [{ id: ASHA_BOOK, role: 'parent', name: CHILD, members: [], invites: [] }] : [] } }));
  await openOn(app);
  await passAgeGate(app);
  await btn(app, 'I was invited').click();
  await app.getByLabel('Invite link').fill(LINK);
  await btn(app, 'Continue').click();
  await btn(app, 'Sign in').click();
  await signInWithEmail(app, 'papa@example.invalid');
  await btn(app, 'Join the book').click();
  await expect(app.getByTestId('invite.joined').getByText(`${CHILD}'s book is on its way to this phone.`)).toBeVisible();
  return m;
}

test('[J21i] invitee: Close before the book arrives while sync runs: the welcome says it is on its way, with no "Begin the book"', async ({ app }) => {
  await joinWhileSyncRuns(app, { hasBook: false });
  await btn(app, 'Close').click();
  await expect(app.getByTestId('onboarding.joinWait').getByText(`${CHILD}'s book is on its way to this phone.`)).toBeVisible();
  await expect(btn(app, 'Begin the book')).toHaveCount(0);
  await expect(app.getByTestId('onboarding.joinWait.retry')).toHaveCount(0);
});

test('[J21j] invitee: the quiet wait runs out at 30 s (Try again and "Begin the book" come back), Try again starts it over, and a retry that finds the book hands over to the Book', async ({ app }) => {
  // The page's clock is ours, so 30 s pass in a moment (critics' pass S2; components/family/join-wait.tsx).
  await app.clock.install();
  const server = { hasBook: false };
  await joinWhileSyncRuns(app, server);
  await btn(app, 'Close').click();
  const wait = app.getByTestId('onboarding.joinWait');
  const onItsWay = wait.getByText(`${CHILD}'s book is on its way to this phone.`);
  const notYet = wait.getByText(`${CHILD}'s book has not reached this phone yet.`);
  const retry = app.getByTestId('onboarding.joinWait.retry');
  await expect(onItsWay).toBeVisible();
  await expect(btn(app, 'Begin the book')).toHaveCount(0);

  // 20 s in: still quiet.
  await app.clock.fastForward(20_000);
  await expect(onItsWay).toBeVisible();
  await expect(btn(app, 'Begin the book')).toHaveCount(0);
  await expect(retry).toHaveCount(0);

  // Past 30 s since the join: the welcome wakes, with no dead end.
  await app.clock.fastForward(15_000);
  await expect(notYet).toBeVisible();
  await expect(retry).toBeVisible();
  await expect(btn(app, 'Begin the book')).toBeVisible();

  // Try again runs a sync, and the quiet wait starts over: 30 s more before it wakes again.
  await retry.click();
  await expect(onItsWay).toBeVisible();
  await expect(btn(app, 'Begin the book')).toHaveCount(0);
  await expect(retry).toHaveCount(0);
  await app.clock.fastForward(20_000);
  await expect(onItsWay).toBeVisible();
  await app.clock.fastForward(15_000);
  await expect(notYet).toBeVisible();

  // The book is on the server now: Try again brings it, and the welcome hands over to the Book.
  server.hasBook = true;
  await retry.click();
  await expect(app).toHaveURL(/\/book/, { timeout: 15_000 });
  await expect(app.getByText(`${CHILD}'s book`).first()).toBeVisible();
});

test('[J21e] invitee: a typed code is not read, and the link still works', async ({ app }) => {
  await mockServer(app, { user: PAPA });
  await openOn(app);
  await passAgeGate(app);
  await btn(app, 'I was invited').click();
  // Build 2 invites are links only: a code is not read, nothing is sent, and the field stays for the link.
  await app.getByLabel('Invite link').fill('7K3M-9QXZ');
  await btn(app, 'Continue').click();
  await expect(app.getByText("That doesn't look like an invite link. Check the message and try again.")).toBeVisible();
  await expect(app.getByLabel('Invite link')).toBeVisible();
  await app.getByLabel('Invite link').fill(LINK);
  await btn(app, 'Continue').click();
  await expect(app.getByText('You were invited to a book')).toBeVisible();
});

test('[J21f] invitee: a server that does not answer is said plainly, and Try again keeps the link', async ({ app }) => {
  allowConsoleError(app, /status of 503/);
  const m = await mockServer(app, { user: PAPA });
  let down = true;
  m.rpc('peek_invite', () => (down ? { status: 503, body: { message: 'Service Unavailable' } } : { body: { inviter: 'Mama', role: 'parent' } }));
  await openOn(app);
  await passAgeGate(app);
  await btn(app, 'I was invited').click();
  await app.getByLabel('Invite link').fill(LINK);
  await btn(app, 'Continue').click();
  await btn(app, 'Sign in').click();
  await signInWithEmail(app, 'papa@example.invalid');
  await expect(app.getByText('That did not work this time. Try again.')).toBeVisible();
  down = false;
  await btn(app, 'Try again').click();
  await expect(app.getByText('Invited by Mama')).toBeVisible();
  expect(m.rpcCalls('peek_invite')).toHaveLength(2);
});

/**
 * A joiner on a fresh install whose book comes down with the first pull after the join: sync's own sync_pull,
 * answered by the mock with the book once accept_child_invite has run. Ends on the joined view, with the book here.
 */
async function joinWithTheBookArriving(app: Page) {
  const m = await mockServer(app, { user: PAPA, email: 'papa@example.invalid' });
  let accepted = false;
  m.rpc('peek_invite', () => ({ body: { inviter: 'Mama', role: 'parent' } }));
  m.rpc('accept_child_invite', () => {
    accepted = true;
    return { body: ASHA_BOOK };
  });
  m.table('children', () => ({ body: { name: CHILD } }));
  // The Family tab's pending list after the join: this parent's book, no invites.
  m.rpc('sync_books', () => ({ body: { epoch: 1, first_run_open: false, books: accepted ? [{ id: ASHA_BOOK, role: 'parent', name: CHILD, members: [], invites: [] }] : [] } }));
  m.rpc('sync_pull', () => ({ body: pulled(accepted) }));
  await openOn(app);
  await passAgeGate(app);
  await btn(app, 'I was invited').click();
  await app.getByLabel('Invite link').fill(LINK);
  await btn(app, 'Continue').click();
  await btn(app, 'Sign in').click();
  await signInWithEmail(app, 'papa@example.invalid');
  await btn(app, 'Join the book').click();
  // The welcome under the sheet does not take the joiner away when the book arrives (S59; welcome-handoff.logic.ts).
  await expect(app.getByTestId('invite.joined.cover')).toBeVisible();
  await expect(btn(app, 'Open the book')).toBeEnabled({ timeout: 20_000 });
  await expect(app.getByTestId('invite.joined.cover')).toBeVisible();
  return m;
}

test('[J21g] invitee: once the book is on this phone, "Open the book" lands on the Book', async ({ app, record }) => {
  const step = journey(record, 'J21', 'co-parent-sharing', 6);
  await joinWithTheBookArriving(app);
  await expect(app.getByLabel(`What does ${CHILD} call you?`)).toHaveValue('Papa');
  await step('happy', 'Joined, the book is here', 'The cover has opened to the flyleaf. What the child calls this parent in the book is filled in with the inviter\'s suggestion and can be changed; "Open the book" is the one way the open book changes.', undefined, { settle: 900 });
  await btn(app, 'Open the book').click();
  await expect(app.getByText(`${CHILD}'s book`).first()).toBeVisible();
  await expect(app).toHaveURL(/\/book/);
  await step('happy', 'The Book, lit for the second parent', 'The sheet closes onto the welcome, which hands over to the Book and leaves first run behind; the Book is on this book, and its light rises from unlit over 1.2 s, the one slow arrival outside first run (5.8 row 12).', undefined, { settle: 1400 });

  // First run is gone from under the tabs: every other room stays where the person goes (lens B on #314).
  const stays = async (where: RegExp) => {
    await expect(app).toHaveURL(where);
    await app.waitForTimeout(800);
    await expect(app).toHaveURL(where);
  };
  await app.getByText('Tonight', { exact: true }).last().click();
  await stays(/:\d+\/(\?[^/]*)?$/);
  await app.getByText('Family', { exact: true }).last().click();
  await stays(/\/family/);
  // Settings is the gear on the Book.
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await stays(/\/settings/);
});

test('[J21h] invitee: Close on the joined sheet, with the book here, hands over to the Book (no joined light: only Open leaves the mark)', async ({ app }) => {
  await joinWithTheBookArriving(app);
  await btn(app, 'Close').click();
  // First run is over once a book is on this phone: the welcome hands over to the Book (5.8 row 12), with no mark.
  await expect(app.getByText(`${CHILD}'s book`).first()).toBeVisible();
  await expect(app).toHaveURL(/\/book/);
});

test('[J21b] invitee: a book that already has two parents is said plainly', async ({ app, record }) => {
  const step = journey(record, 'J21', 'co-parent-sharing', 10, 'J21-03');
  allowConsoleError(app, /status of 400/);
  const m = await mockServer(app, { user: PAPA });
  m.rpc('peek_invite', () => pgError('SCCAP', 'this book already has the most parents allowed', '2'));
  await openOn(app);
  await passAgeGate(app);
  await btn(app, 'I was invited').click();
  await app.getByLabel('Invite link').fill(LINK);
  await btn(app, 'Continue').click();
  await btn(app, 'Sign in').click();
  await signInWithEmail(app, 'papa@example.invalid');
  await expect(app.getByText('This book already has two parents. Ask the person who invited you.')).toBeVisible();
  expect(m.rpcCalls('accept_child_invite')).toHaveLength(0);
  await step('unhappy', 'The book is full', 'At most two parents per book (D-069). The server says SCCAP and the sheet says so in one calm line; the link is forgotten and nothing is retried (F11-REQ-026).');
});

test('[J21c] inviter: the Family tab is live, and an invite goes out with only its hash on the wire', async ({ app, record }) => {
  const step = journey(record, 'J21', 'co-parent-sharing', 20);
  await stubShareSheet(app);
  const m = await mockServer(app, { user: MAMA, email: 'mama@example.invalid' });
  const invites: Record<string, unknown>[] = [];
  let book: string | null = null;
  m.rpc('create_child_invite', (c) => {
    const args = c.body as Record<string, unknown>;
    book = String(args.p_child);
    invites.push({ id: args.p_invite_id, role: 'parent', signs_as: args.p_signs_as ?? null, created_at: '2026-10-15T09:00:00.000Z', expires_at: '2026-10-22T09:00:00.000Z', status: 'open' });
    return { body: args.p_invite_id };
  });
  // The pending list is the server's own: sync_books().books[].invites, never a select on child_invites.
  m.rpc('sync_books', () => ({ body: { epoch: 1, first_run_open: false, books: book ? [{ id: book, role: 'parent', name: CHILD, members: [], invites }] : [] } }));
  await openOn(app, '/?seed=asha');
  await app.getByText('Family', { exact: true }).last().click();
  await expect(app.getByText(`Who writes to ${CHILD}`)).toBeVisible();
  await expect(app.getByText(`From ${SIGNS_AS}`)).toBeVisible();
  await expect(app.getByText('Write this book together')).toBeVisible();
  await expect(app.getByText('Shared only with the other parent, if you invite them.')).toBeVisible();
  await expect(app.getByText('Coming soon')).toHaveCount(0);
  await expect(app.getByText(/@|example\.invalid/)).toHaveCount(0);
  await step('happy', 'Family tab, one parent', 'The one lit room, low and still. "Who writes to Asha", and the people as signatures, "From Mama" with "You" under it: no avatar, no initials, no email address, nothing counted. While the book has one parent, the invite card with the closed cover, and the privacy line says who the book is shared with, never who can read it (S57, review A1). Before sign-in, the invite sheet asks for sign-in first and comes back to the invite.');

  await btn(app, 'Invite a co-parent').click();
  await expect(app.getByText(`Invite ${CHILD}'s co-parent`)).toBeVisible();
  await expect(app.getByText('You were invited to a book')).toHaveCount(0);
  await btn(app, 'Sign in').click();
  await signInWithEmail(app, 'mama@example.invalid');
  // This phone already holds letters, so the claim screen asks whose they are (BL-347, #139).
  await btn(app, 'Keep in this account').click();
  await expect(app.getByLabel(`What does ${CHILD} call them?`)).toBeVisible();
  await app.getByLabel(`What does ${CHILD} call them?`).fill('Papa');
  await expect(app.getByText('From Papa').first()).toBeVisible();
  await step('happy', 'Invite a co-parent', 'The sheet carries the book\'s cover: the invite is into this book. What the child calls them, in the letter face with the same ideas as first run, signs their letters, and the cover\'s foot line reads "From Papa" once the typing pauses. The invite is for this book only; the link works once, for 7 days.');

  await btn(app, 'Share invite link').click();
  // The share sheet has closed: the invite sheet closes with it, and the Family tab says where the invite waits.
  await expect(app.getByText('The invite waits on the Family tab until they join.')).toBeVisible();
  await expect(app.getByText(`Invite ${CHILD}'s co-parent`)).toHaveCount(0);
  const shared = (await app.evaluate(() => (window as unknown as { __shared: { text?: string; url?: string }[] }).__shared)) ?? [];
  const message = JSON.stringify(shared);
  const token = /\/j#t=([A-Za-z0-9_-]{43})/.exec(message)?.[1];
  expect(token, 'the share sheet got a link with a device-made token').toBeTruthy();
  const sent = m.rpcCalls('create_child_invite');
  expect(sent).toHaveLength(1);
  expect(JSON.stringify(sent[0].body)).not.toContain(token!);
  expect((sent[0].body as { p_token_hash: string }).p_token_hash).toBe(`\\x${createHash('sha256').update(token!, 'utf8').digest('hex')}`);
  expect(message, 'the link carries no child name (BL-348)').not.toMatch(new RegExp(`/j#t=[^"\\s]*${CHILD}`));
  await expect(app.getByText(/Invited, open until/)).toBeVisible();
  await expect(app.getByText('Your co-parent')).toBeVisible();
  await step('happy', 'Invite shared', 'The phone made the invite: its id, a 32-byte token for the link, and the token\'s SHA-256, which is all the server receives (F11 D5, B-NFR-002). The link, which carries no name, goes to the share sheet and is never stored or shown again; the person sends it. When the share sheet closes the sheet closes too, and the tab says where the invite waits, with the pending row in place.');

  await expect(btn(app, 'Cancel invite')).toBeVisible();
  await expect(btn(app, 'Invite a co-parent')).toHaveCount(0);
  expect(m.calls.filter((c) => c.path === '/rest/v1/child_invites'), 'the list comes from sync_books only').toEqual([]);
  await step('happy', 'Invite open', 'The member list shows the open invite with the day it stops working, Share again and Cancel invite (F11-REQ-019). The invite card steps aside while an invite is open.');
});

test('[J21d] a child\'s settings: "Write this book together" opens the invite, and there is no "Family can read"', async ({ app, record }) => {
  const step = journey(record, 'J21', 'co-parent-sharing', 30);
  await mockServer(app, { user: MAMA });
  await openOn(app, '/?seed=asha');
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText(CHILD, { exact: true }).first().click();
  await expect(app.getByText('Write this book together')).toBeVisible();
  await expect(app.getByText(/Family can read/)).toHaveCount(0);
  await expect(app.getByText('Sharing a book with a co-parent is coming in a later update.')).toHaveCount(0);
  await app.getByText('Write this book together').click();
  await expect(app.getByText(`Invite ${CHILD}'s co-parent`)).toBeVisible();
  await step('happy', 'From a child\'s settings', 'With the switch on the row opens the invite itself. "Family can read" (the family-contributor switch) stays hidden: contributors are not in v1.0 (B1).');
});
