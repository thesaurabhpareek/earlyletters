/**
 * The family RPCs against a fake client: one idempotency key per user action
 * (G-07), the leave and remove calls (leave_child, remove_child_member), the
 * peek contract (S02 PR #142), and the error words (SCCAP and friends).
 */
import { describe, expect, it } from 'vitest';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';
import { ActionKeys, actionScope, runAction } from './action-key.logic';
import { counterKeys, fakeRpc } from './family-fake.test-helper';
import { acceptInviteRpc, createInviteRpc, leaveBookRpc, peekInviteRpc, readInvitePeek, removeMemberRpc, revokeInviteRpc } from './family-rpc.logic';
import { FINAL_INVITE_ERRORS, inviteErrorKind, trackedInviteReason } from './invite-errors.logic';

const CHILD = '0190f0a0-0000-7000-8000-000000000001';
const MEMBER = '0190f0a0-0000-7000-8000-0000000000aa';
const TOKEN = '3f2a9c1e5b7d4e8fa1c2d3e4f5a6b7c89d0e1f2a3b4c5d6e7f8091a2b3c4d5e6';
const H = HEADER_IDEMPOTENCY_KEY;

describe('one idempotency key per user action (G-07)', () => {
  it('[G-07] a retry after a lost answer sends the same key; the next action gets a new one', async () => {
    const keys = new ActionKeys(counterKeys());
    const sb = fakeRpc({ create_child_invite: [{ network: true }, { network: true }, { data: TOKEN }, { data: TOKEN }] });
    await expect(createInviteRpc(sb, keys, CHILD, 'Papa')).rejects.toThrow(/network/i);
    await expect(createInviteRpc(sb, keys, CHILD, 'Papa')).rejects.toThrow(/network/i);
    await expect(createInviteRpc(sb, keys, CHILD, 'Papa')).resolves.toBe(TOKEN);
    const [k1, k2, k3] = sb.calls.map((c) => c.headers[H]);
    expect(k1).toBeTruthy();
    expect(k2).toBe(k1);
    expect(k3).toBe(k1);
    // Succeeded: asking again for the same invite is a new action.
    await createInviteRpc(sb, keys, CHILD, 'Papa');
    expect(sb.calls[3]!.headers[H]).not.toBe(k1);
    expect(keys.size).toBe(0);
  });

  it('[G-07] different arguments are a different action, so never the same key (the server answers 22023 to that)', async () => {
    const keys = new ActionKeys(counterKeys());
    const sb = fakeRpc({ create_child_invite: [{ network: true }, { data: TOKEN }] });
    await createInviteRpc(sb, keys, CHILD, 'Papa').catch(() => {});
    await createInviteRpc(sb, keys, CHILD, 'Baba');
    expect(sb.calls[0]!.headers[H]).not.toBe(sb.calls[1]!.headers[H]);
  });

  it('[G-07] a refused call keeps its key: nothing was stored, and a retry of the same action is safe', async () => {
    const keys = new ActionKeys(counterKeys());
    const sb = fakeRpc({ leave_child: [{ error: { code: '40001', message: 'serialization' } }, { data: 'left' }] });
    await leaveBookRpc(sb, keys, CHILD, true).catch(() => {});
    await leaveBookRpc(sb, keys, CHILD, true);
    expect(sb.calls[1]!.headers[H]).toBe(sb.calls[0]!.headers[H]);
  });

  it('every family write sends a key; the read-only peek sends none', async () => {
    const keys = new ActionKeys(counterKeys());
    const sb = fakeRpc({
      peek_invite: { data: { role: 'parent', inviter_signs_as: 'Papa', state: 'open' } },
      accept_child_invite: { data: CHILD },
      create_child_invite: { data: TOKEN },
      revoke_invite: { data: null },
      leave_child: { data: 'left' },
      remove_child_member: { data: 'removed' },
    });
    await peekInviteRpc(sb, TOKEN);
    await acceptInviteRpc(sb, keys, TOKEN);
    await createInviteRpc(sb, keys, CHILD, null);
    await revokeInviteRpc(sb, keys, 'inv-1');
    await leaveBookRpc(sb, keys, CHILD, false);
    await removeMemberRpc(sb, keys, CHILD, MEMBER, false);
    const byFn = Object.fromEntries(sb.calls.map((c) => [c.fn, c.headers[H]]));
    expect(byFn.peek_invite).toBeUndefined();
    for (const fn of ['accept_child_invite', 'create_child_invite', 'revoke_invite', 'leave_child', 'remove_child_member']) {
      expect(byFn[fn], fn).toMatch(/^[0-9a-f-]{36}$/);
    }
    expect(new Set(Object.values(byFn).filter(Boolean)).size).toBe(5);
  });

  it('runAction settles only on success', async () => {
    const keys = new ActionKeys(counterKeys());
    await expect(runAction(keys, 's', async () => Promise.reject(new Error('x')))).rejects.toThrow('x');
    expect(keys.size).toBe(1);
    await runAction(keys, 's', async (k) => k);
    expect(keys.size).toBe(0);
    keys.keyFor('t');
    keys.clear();
    expect(keys.size).toBe(0);
  });

  it('accept scopes carry only a short prefix of the token', () => {
    expect(actionScope.acceptInvite(TOKEN)).toBe(`accept_child_invite|${TOKEN.slice(0, 12)}`);
    expect(actionScope.acceptInvite(TOKEN)).not.toContain(TOKEN);
  });
});

describe('Family uses leave_child and remove_child_member (BL-322, F11-REQ-011)', () => {
  it('[F11-REQ-011] leave sends p_keep_in_book from the choice', async () => {
    const keys = new ActionKeys(counterKeys());
    const sb = fakeRpc({ leave_child: [{ data: 'left' }, { data: 'not_member' }] });
    expect(await leaveBookRpc(sb, keys, CHILD, false)).toBe('left');
    expect(sb.calls[0]).toMatchObject({ fn: 'leave_child', args: { p_child: CHILD, p_keep_in_book: false } });
    expect(await leaveBookRpc(sb, keys, CHILD, true)).toBe('not_member');
    expect(sb.calls[1]!.args).toEqual({ p_child: CHILD, p_keep_in_book: true });
  });

  it('[F11-REQ-011] the only parent of a book gets SCLPG, said as "you are the only parent"', async () => {
    const keys = new ActionKeys(counterKeys());
    const sb = fakeRpc({ leave_child: { error: { code: 'SCLPG', message: 'last parent' } } });
    const e = await leaveBookRpc(sb, keys, CHILD, true).catch((x: unknown) => x);
    expect(inviteErrorKind(e)).toBe('last_parent');
  });

  it('[B-REQ-010] remove sends p_member and p_set_aside; a parent is refused with 42501', async () => {
    const keys = new ActionKeys(counterKeys());
    const sb = fakeRpc({ remove_child_member: [{ data: 'removed' }, { error: { code: '42501', message: 'a parent leaves a book only by their own choice' } }] });
    expect(await removeMemberRpc(sb, keys, CHILD, MEMBER, false)).toBe('removed');
    expect(sb.calls[0]).toMatchObject({ fn: 'remove_child_member', args: { p_child: CHILD, p_member: MEMBER, p_set_aside: false } });
    const e = await removeMemberRpc(sb, keys, CHILD, 'parent-id', false).catch((x: unknown) => x);
    expect(inviteErrorKind(e)).toBe('not_allowed');
  });

  it('create always asks for a parent invite with a trimmed, capped sign-off (F11 D4)', async () => {
    const keys = new ActionKeys(counterKeys());
    const sb = fakeRpc({ create_child_invite: { data: TOKEN } });
    await createInviteRpc(sb, keys, CHILD, `  ${'P'.repeat(40)}  `);
    await createInviteRpc(sb, keys, CHILD, '   ');
    expect(sb.calls[0]!.args).toEqual({ p_child: CHILD, p_role: 'parent', p_signs_as: 'P'.repeat(30) });
    expect(sb.calls[1]!.args).toEqual({ p_child: CHILD, p_role: 'parent', p_signs_as: null });
  });
});

describe('peek_invite contract (S02, migration 20261015000000)', () => {
  it('[BL-322] reads role, the inviter sign-off and state, and nothing about the child', async () => {
    const sb = fakeRpc({ peek_invite: { data: { role: 'parent', inviter_signs_as: '  Papa  ', state: 'open', child_name: 'Asha' } } });
    const peek = await peekInviteRpc(sb, TOKEN);
    expect(peek).toEqual({ role: 'parent', inviterSignsAs: 'Papa', state: 'open' });
    expect(JSON.stringify(peek)).not.toContain('Asha');
    expect(sb.calls[0]).toMatchObject({ fn: 'peek_invite', args: { p_token: TOKEN } });
  });

  it('reads odd answers defensively', () => {
    expect(readInvitePeek({ role: 'contributor', inviter_signs_as: null, state: 'joined' })).toEqual({ role: 'contributor', inviterSignsAs: null, state: 'joined' });
    expect(readInvitePeek([{ role: 'parent', inviter_signs_as: 'Mama', state: 'open' }]).inviterSignsAs).toBe('Mama');
    expect(readInvitePeek({ role: 'x', inviter_signs_as: 42, state: 'weird' })).toEqual({ role: 'parent', inviterSignsAs: null, state: 'open' });
    expect(readInvitePeek(null)).toEqual({ role: 'parent', inviterSignsAs: null, state: 'open' });
    expect(readInvitePeek({ inviter_signs_as: `A${' '.repeat(5)}B${'c'.repeat(60)}` }).inviterSignsAs).toHaveLength(30);
  });

  it('peek errors are the same as accept: SCINV, SCCAP, SCRAT, SCANO, 28000', async () => {
    const cases: Array<[string, string, string]> = [
      ['SCINV', 'invite expired', 'expired'],
      ['SCINV', 'invite already used', 'used'],
      ['SCINV', 'invite revoked', 'revoked'],
      ['SCINV', 'invite not found', 'not_found'],
      ['SCINV', 'already a member of this book', 'already_member'],
      ['SCCAP', 'this book already has the most parents allowed', 'book_full'],
      ['SCRAT', 'rate limited', 'rate_limited'],
      ['SCANO', 'anonymous', 'signed_out'],
      ['28000', 'not signed in', 'signed_out'],
    ];
    for (const [code, message, kind] of cases) {
      const sb = fakeRpc({ peek_invite: { error: { code, message } } });
      const e = await peekInviteRpc(sb, TOKEN).catch((x: unknown) => x);
      expect(inviteErrorKind(e), `${code} ${message}`).toBe(kind);
    }
  });
});

describe('SCCAP is mapped end to end (F11-REQ-026)', () => {
  it('[F11-REQ-026] SCCAP from create or accept is book_full, final, and never retried', () => {
    const e = { code: 'SCCAP', message: 'this book already has the most parents allowed', details: '2' };
    expect(inviteErrorKind(e)).toBe('book_full');
    expect(FINAL_INVITE_ERRORS).toContain('book_full');
  });

  it('[F11-REQ-026] analytics only ever sees reasons its catalogue lists', () => {
    expect(trackedInviteReason('book_full')).toBe('unknown');
    expect(trackedInviteReason('last_parent')).toBe('unknown');
    expect(trackedInviteReason('expired')).toBe('expired');
  });
});
