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
import { btn, CHILD, journey, passAgeGate } from './support/app';
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
  await expect(app.getByText('Join the family book')).toBeVisible();
  await step('happy', 'Paste the invite', 'The link from the message is pasted here. The clipboard is read only from what is pasted, never on its own (A-REQ-029).');

  await app.getByLabel('Invite link').fill(`Hi, it's Mama. Join me for ${CHILD}: ${LINK}`);
  await btn(app, 'Continue').click();
  await expect(app.getByText('You were invited to a book')).toBeVisible();
  await expect(app.getByText('Mama')).toHaveCount(0);
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
  await expect(app.getByText(`${CHILD}'s book is on its way to this phone.`)).toBeVisible();
  expect(m.rpcCalls('accept_child_invite')).toHaveLength(1);
  await step('happy', 'Joined', 'One accept, after the tap. The book comes with the next sync; the open book does not change by itself (only "Open the book" opens it). Here sync is held, so it says the book is on its way.');
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
  await expect(app.getByText('Write this book together')).toBeVisible();
  await expect(app.getByText('Coming soon')).toHaveCount(0);
  await step('happy', 'Family tab, one parent', 'The live tab: who writes to the book (you), and "Write this book together" while the book has one parent. Before sign-in, the invite sheet asks for sign-in first and comes back to the invite.');

  await btn(app, 'Invite a co-parent').click();
  await expect(app.getByText(`Invite ${CHILD}'s co-parent`)).toBeVisible();
  await btn(app, 'Sign in').click();
  await signInWithEmail(app, 'mama@example.invalid');
  // This phone already holds letters, so the claim screen asks whose they are (BL-347, #139).
  await btn(app, 'Keep them here').click();
  await expect(app.getByLabel(`What does ${CHILD} call them?`)).toBeVisible();
  await app.getByLabel(`What does ${CHILD} call them?`).fill('Papa');
  await step('happy', 'Invite a co-parent', 'What the child calls them signs their letters. The invite is for this book only; the link works once, for 7 days.');

  await btn(app, 'Share invite link').click();
  await expect(app.getByText('Invite ready. It shows on the Family tab until they join.')).toBeVisible();
  const shared = (await app.evaluate(() => (window as unknown as { __shared: { text?: string; url?: string }[] }).__shared)) ?? [];
  const message = JSON.stringify(shared);
  const token = /\/j#t=([A-Za-z0-9_-]{43})/.exec(message)?.[1];
  expect(token, 'the share sheet got a link with a device-made token').toBeTruthy();
  const sent = m.rpcCalls('create_child_invite');
  expect(sent).toHaveLength(1);
  expect(JSON.stringify(sent[0].body)).not.toContain(token!);
  expect((sent[0].body as { p_token_hash: string }).p_token_hash).toBe(`\\x${createHash('sha256').update(token!, 'utf8').digest('hex')}`);
  await step('happy', 'Invite shared', 'The phone made the invite: its id, a 32-byte token for the link, and the token\'s SHA-256, which is all the server receives (F11 D5, B-NFR-002). The link goes to the share sheet and is never stored or shown again.');

  await btn(app, 'Close').click();
  await expect(app.getByText(/Invited, open until/)).toBeVisible();
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
