/// <reference types="node" />
/**
 * BL-322 app part: an invite asks before it joins and never switches the open
 * book by itself (security review H2, gap G-02; F11 6.2 B step 6). The join
 * flow (join.logic.ts) is driven here against a fake RPC exactly as the screen
 * drives it: render the phase, run the one effect it asks for.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';
import { brand } from '@scribe/brand';
// The worktree's own copy (the shared node_modules link may point at another checkout).
import { familyCopy } from '../../../../../packages/content/src/features/family.en';
import { classifyIncomingUrl } from '../auth/links.logic';
import { ActionKeys } from './action-key.logic';
import { inviteDestination, planIncomingLink } from './entry.logic';
import { counterKeys, fakeRpc, type Answer } from './family-fake.test-helper';
import { acceptInviteRpc, peekInviteRpc } from './family-rpc.logic';
import { inviteErrorKind } from './invite-errors.logic';
import { canOpenJoinedBook, failedAction, JOIN_START, joinEffect, joinNeeds, joinReducer, type JoinState } from './join.logic';
import { createPendingInviteStore, PENDING_INVITE_KEY, type KeychainLike } from './pending-invite.store';

const APP = join(__dirname, '..', '..', '..');
const src = (p: string) => readFileSync(join(APP, 'src', p), 'utf8');
const TOKEN = '3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6';
const CHILD = '0190f0a0-0000-7000-8000-000000000001';

function fakeKeychain(): KeychainLike & { items: Map<string, string> } {
  const items = new Map<string, string>();
  return {
    items,
    getItem: async (k) => items.get(k) ?? null,
    setItem: async (k, v) => void items.set(k, v),
    removeItem: async (k) => void items.delete(k),
  };
}

/**
 * Runs effects until the flow waits for the person (or the account). Returns
 * the state it stopped in. Mirrors app/invite/index.tsx: the effect of each
 * phase, nothing more.
 */
async function settle(start: JoinState, script: Record<string, Answer | Answer[]>, opts: { keys?: ActionKeys; cleared?: { n: number } } = {}) {
  const sb = fakeRpc(script);
  const keys = opts.keys ?? new ActionKeys(counterKeys());
  let s = start;
  for (let i = 0; i < 10; i++) {
    const effect = joinEffect(s);
    if (effect === 'peek') {
      s = await peekInviteRpc(sb, TOKEN).then(
        (peek) => joinReducer(s, { type: 'peeked', peek }),
        (e) => joinReducer(s, { type: 'peek_failed', error: inviteErrorKind(e) }),
      );
    } else if (effect === 'accept') {
      s = await acceptInviteRpc(sb, keys, TOKEN).then(
        (childId) => joinReducer(s, { type: 'accepted', childId }),
        (e) => joinReducer(s, { type: 'accept_failed', error: inviteErrorKind(e) }),
      );
    } else {
      if (effect === 'clear_token' && opts.cleared) opts.cleared.n++;
      break;
    }
  }
  return { state: s, calls: sb.calls };
}

const OPEN_PEEK: Answer = { data: { role: 'parent', inviter_signs_as: 'Papa', state: 'open' } };

describe('an invite asks before it joins (BL-322, G-02)', () => {
  it('[BL-322] with a token and a ready account it peeks, then waits on the question: no accept without a tap', async () => {
    const s0 = joinReducer(JOIN_START, { type: 'loaded', hasToken: true, accountReady: true });
    expect(s0.phase).toBe('peeking');
    const { state, calls } = await settle(s0, { peek_invite: OPEN_PEEK, accept_child_invite: { data: CHILD } });
    expect(state).toEqual({ phase: 'ask', inviter: 'Papa' });
    expect(calls.map((c) => c.fn)).toEqual(['peek_invite']);
    expect(joinEffect(state)).toBeNull();
  });

  it('[BL-322] only the Join tap accepts; the joined book is not opened', async () => {
    const asked: JoinState = { phase: 'ask', inviter: 'Papa' };
    const tapped = joinReducer(asked, { type: 'join_tapped' });
    const { state, calls } = await settle(tapped, { accept_child_invite: { data: CHILD } });
    expect(calls.map((c) => c.fn)).toEqual(['accept_child_invite']);
    expect(state).toEqual({ phase: 'joined', childId: CHILD });
    // The book opens on the person's tap only, and only once it is on this phone.
    expect(canOpenJoinedBook(state, true, false)).toBe(false);
    expect(canOpenJoinedBook(state, false, true)).toBe(false);
    expect(canOpenJoinedBook(state, true, true)).toBe(true);
    expect(canOpenJoinedBook(asked, true, true)).toBe(false);
  });

  it('[BL-322] Not now joins nothing and drops the token', async () => {
    const cleared = { n: 0 };
    const s = joinReducer({ phase: 'ask', inviter: null }, { type: 'not_now_tapped' });
    const { state, calls } = await settle(s, { accept_child_invite: { data: CHILD } }, { cleared });
    expect(state.phase).toBe('declined');
    expect(calls).toEqual([]);
    expect(cleared.n).toBe(1);
  });

  it('[BL-322] the question shows the inviter sign-off from peek_invite, and a neutral line without one', () => {
    expect(familyCopy.accept.askTitle).toBe('Join this book as a parent?');
    expect(familyCopy.accept.invitedBy.replace('{inviter}', 'Papa')).toBe('Invited by Papa.');
    expect(familyCopy.accept.invitedByUnknown).not.toMatch(/\{child\}/);
    // No child name before joining: none of the ask lines can carry it.
    for (const k of ['askTitle', 'invitedBy', 'invitedByUnknown', 'askBody', 'join', 'notNow'] as const) expect(familyCopy.accept[k]).not.toContain('{child}');
  });

  it('[BL-322] nothing is preselected: both choices are equal buttons and only events from taps move on', () => {
    const view = src('components/family/join-ask.tsx');
    expect(view.match(/variant="outline"/g)).toHaveLength(2);
    expect(view).not.toMatch(/autoFocus|defaultValue|selected/);
    // Neither "account ready" nor a repeated peek answer can make the ask phase accept.
    const asked: JoinState = { phase: 'ask', inviter: 'Papa' };
    expect(joinReducer(asked, { type: 'account', ready: true })).toBe(asked);
    expect(joinReducer(asked, { type: 'peeked', peek: { role: 'parent', inviterSignsAs: 'Papa', state: 'open' } })).toBe(asked);
    expect(joinReducer(asked, { type: 'accepted', childId: CHILD })).toBe(asked);
  });

  it('[BL-322] the invite screen never switches the open book by itself', () => {
    const screen = src('app/invite/index.tsx');
    const calls = screen.match(/setActiveChildId\(/g) ?? [];
    expect(calls).toHaveLength(1);
    // The one call sits in the tap handler, not in an effect.
    const handler = screen.slice(screen.indexOf('const openJoinedBook'), screen.indexOf('const submitPaste'));
    expect(handler).toContain('setActiveChildId(joinedId)');
    for (const effect of screen.split('useEffect(').slice(1)) expect(effect.split('\n  }, [')[0]).not.toContain('setActiveChildId');
    expect(src('components/family/join-ask.tsx')).not.toContain('setActiveChildId');
  });

  it('waits for sign-in and consent before peeking, and goes back if the session is lost', () => {
    const s = joinReducer(JOIN_START, { type: 'loaded', hasToken: true, accountReady: false });
    expect(s.phase).toBe('account');
    expect(joinEffect(s)).toBeNull();
    const ready = joinReducer(s, { type: 'account', ready: true });
    expect(ready.phase).toBe('peeking');
    expect(joinReducer({ phase: 'ask', inviter: 'Papa' }, { type: 'account', ready: false }).phase).toBe('account');
  });

  it('no token: paste first; a bad paste says so; a good one moves on', () => {
    const p = joinReducer(JOIN_START, { type: 'loaded', hasToken: false, accountReady: true });
    expect(p).toEqual({ phase: 'paste', notRecognised: false });
    expect(joinReducer(p, { type: 'pasted', ok: false, accountReady: true })).toEqual({ phase: 'paste', notRecognised: true });
    expect(joinReducer(p, { type: 'pasted', ok: true, accountReady: true }).phase).toBe('peeking');
  });

  it('already joined with this invite (second device, lost answer): opens nothing new, returns the same book', async () => {
    const { state, calls } = await settle({ phase: 'peeking' }, { peek_invite: { data: { role: 'parent', inviter_signs_as: null, state: 'joined' } }, accept_child_invite: { data: CHILD } });
    expect(calls.map((c) => c.fn)).toEqual(['peek_invite', 'accept_child_invite']);
    expect(state).toEqual({ phase: 'joined', childId: CHILD });
  });
});

describe('errors before and after the tap', () => {
  it('[F11-REQ-026] a book with two parents: calm words, the token dropped, no retry', async () => {
    const cleared = { n: 0 };
    const { state, calls } = await settle({ phase: 'peeking' }, { peek_invite: { error: { code: 'SCCAP', message: 'this book already has the most parents allowed', details: '2' } } }, { cleared });
    expect(state).toMatchObject({ phase: 'failed', error: 'book_full', stage: 'peek' });
    expect(cleared.n).toBe(1);
    expect(failedAction('book_full')).toBe('paste_again');
    expect(joinReducer(state, { type: 'try_again_tapped' })).toBe(state);
    expect(calls).toHaveLength(1);
    expect(familyCopy.errors.book_full).toBe('This book already has two parents. Ask the person who invited you.');
    expect(familyCopy.create.fullNote).toBe("{child}'s book has two parents.");
  });

  it('[F11-REQ-026] SCCAP at accept (a race after the peek) is the same calm line', async () => {
    const { state } = await settle({ phase: 'joining', inviter: 'Papa' }, { accept_child_invite: { error: { code: 'SCCAP', message: 'full', details: '2' } } });
    expect(state).toMatchObject({ phase: 'failed', error: 'book_full', stage: 'accept' });
  });

  it('[G-07] a lost answer after Join: Try again sends the same key, and the join happens once', async () => {
    const keys = new ActionKeys(counterKeys());
    const first = await settle({ phase: 'joining', inviter: 'Papa' }, { accept_child_invite: { network: true } }, { keys });
    expect(first.state).toMatchObject({ phase: 'failed', error: 'network', stage: 'accept' });
    expect(joinEffect(first.state)).toBeNull(); // the token is kept
    const again = joinReducer(first.state, { type: 'try_again_tapped' });
    expect(again.phase).toBe('joining');
    const second = await settle(again, { accept_child_invite: { data: CHILD } }, { keys });
    expect(second.state.phase).toBe('joined');
    expect(second.calls[0]!.headers[HEADER_IDEMPOTENCY_KEY]).toBe(first.calls[0]!.headers[HEADER_IDEMPOTENCY_KEY]);
  });

  it('expired, used, cancelled and not found drop the token and offer another invite', async () => {
    for (const message of ['invite expired', 'invite already used', 'invite revoked', 'invite not found']) {
      const cleared = { n: 0 };
      const { state } = await settle({ phase: 'peeking' }, { peek_invite: { error: { code: 'SCINV', message } } }, { cleared });
      expect(state.phase, message).toBe('failed');
      expect(cleared.n, message).toBe(1);
      expect(joinReducer(state, { type: 'paste_again_tapped' }).phase).toBe('paste');
    }
  });

  it('a network error on the peek keeps the token and asks again on Try again', async () => {
    const { state } = await settle({ phase: 'peeking' }, { peek_invite: { network: true } });
    expect(state).toMatchObject({ phase: 'failed', error: 'network', stage: 'peek' });
    expect(joinEffect(state)).toBeNull();
    expect(joinReducer(state, { type: 'try_again_tapped' })).toEqual({ phase: 'peeking' });
  });
});

describe('joining needs the gate, sign-in, Terms and consent, in that order (F11-REQ-006)', () => {
  it('[F11-REQ-006] the order is fixed', () => {
    expect(joinNeeds({ gatePassed: false, hasToken: true, signedIn: true, canSync: true })).toBe('gate');
    expect(joinNeeds({ gatePassed: true, hasToken: false, signedIn: true, canSync: true })).toBe('token');
    expect(joinNeeds({ gatePassed: true, hasToken: true, signedIn: false, canSync: false })).toBe('sign_in');
    expect(joinNeeds({ gatePassed: true, hasToken: true, signedIn: true, canSync: false })).toBe('consent');
    expect(joinNeeds({ gatePassed: true, hasToken: true, signedIn: true, canSync: true })).toBe('ready');
  });

  it('[F11-REQ-006] a fresh install opened from a link, then No at the gate: the Keychain holds no invite token', async () => {
    // The link reaches a fresh install (server features on): +native-intent keeps the token before any screen.
    const link = classifyIncomingUrl(`${brand.web.origin}/i/${TOKEN}`, { origin: brand.web.origin, scheme: brand.scheme });
    const plan = planIncomingLink(link, { serverFeatures: true, gateStopped: false, path: `/i/${TOKEN}` });
    expect(plan.keepInviteToken).toBe(true);
    const keychain = fakeKeychain();
    const pending = createPendingInviteStore(keychain);
    await pending.save(TOKEN);
    expect(keychain.items.has(PENDING_INVITE_KEY)).toBe(true);
    expect(joinNeeds({ gatePassed: false, hasToken: true, signedIn: false, canSync: false })).toBe('gate');
    // The gate's No branch clears the stored invite (lib/age-gate.ts answerAgeGate) through this same store.
    const gate = src('lib/age-gate.ts');
    const noBranch = gate.slice(gate.indexOf('export function answerAgeGate'), gate.indexOf('export function reopenAgeGate'));
    expect(noBranch).toMatch(/else\s*\{[^}]*clearPendingInvite\(\)/);
    expect(src('lib/family/pending-invite.ts')).toMatch(/export const clearPendingInvite = store\.clear/);
    await pending.clear();
    expect(keychain.items.size).toBe(0);
    expect(await pending.read()).toBeNull();
  });

  it('[F11-REQ-006] a link that arrives while the gate is stopped is never kept', () => {
    const link = classifyIncomingUrl(`${brand.web.origin}/i/${TOKEN}`, { origin: brand.web.origin, scheme: brand.scheme });
    expect(planIncomingLink(link, { serverFeatures: true, gateStopped: true, path: `/i/${TOKEN}` }).keepInviteToken).toBe(false);
  });

  it('the pending store drops a damaged or stale value', async () => {
    const keychain = fakeKeychain();
    const pending = createPendingInviteStore(keychain);
    keychain.items.set(PENDING_INVITE_KEY, '{not json');
    expect(await pending.read()).toBeNull();
    expect(keychain.items.size).toBe(0);
    await pending.save('short');
    expect(keychain.items.size).toBe(0);
    await pending.save(TOKEN, 0);
    expect(await pending.read(15 * 24 * 60 * 60 * 1000)).toBeNull();
  });
});

describe('works with the server-features switch off and on', () => {
  it('off: the join route is coming soon and a link keeps nothing; on: the real flow', () => {
    expect(inviteDestination('invite_join', false)).toBe('coming_soon');
    expect(inviteDestination('invite_join', true)).toBe('flow');
    const link = classifyIncomingUrl(`${brand.web.origin}/i/${TOKEN}`, { origin: brand.web.origin, scheme: brand.scheme });
    expect(planIncomingLink(link, { serverFeatures: false, gateStopped: false, path: '/i' }).keepInviteToken).toBe(false);
    const screen = src('app/invite/index.tsx');
    expect(screen).toMatch(/inviteDestination\('invite_join', serverFeaturesEnabled\(\)\) === 'flow' \? <JoinBook \/> : <InviteComingSoon \/>/);
    const tab = src('app/(tabs)/family.tsx');
    expect(tab).toMatch(/capabilities\.coParent \? <FamilyShared \/> : <FamilySoon \/>/);
  });

  it('the Family tab offers only what canDo allows: leave_child and remove_child_member, never removing a parent', () => {
    const tab = src('app/(tabs)/family.tsx');
    expect(tab).toContain("canDo('own', 'invite_coparent', book)");
    expect(tab).toContain("canDo('own', 'leave', book)");
    expect(tab).toMatch(/leaveBook\(client, active\.id, keepInBookFor\(choice\)\)/);
    expect(tab).toMatch(/if \(!client \|\| m\.role === 'parent'\) return/);
    expect(src('lib/family/invites.ts')).toMatch(/leaveBookRpc|removeMemberRpc/);
  });
});
