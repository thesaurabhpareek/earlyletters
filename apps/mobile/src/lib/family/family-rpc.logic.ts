/**
 * The family RPCs, over the smallest client shape they need, so Node tests
 * run them against a fake (family-rpc.test.ts). invites.ts passes the real
 * supabase-js client.
 *
 * Contracts (typed by hand until packages/api carries the family contracts,
 * WP-F11-04, S07):
 * - peek_invite(p_token) -> {role, inviter_signs_as, state} (S02, migration
 *   20261015000000, BL-322 server part). Never the child's name, birthday,
 *   book id or expiry. state is 'open', or 'joined' when this person already
 *   accepted this invite. Refuses exactly where accept would: SCINV (expired,
 *   used, revoked, not found, already a member), SCCAP (the book already has
 *   two parents; detail is the limit), SCRAT, SCANO, 28000.
 * - accept_child_invite(p_token) -> child id; idempotent for the same person.
 * - create_child_invite(p_child, 'parent', p_signs_as) -> token, once.
 * - revoke_invite(p_invite).
 * - leave_child(p_child, p_keep_in_book) -> 'left' | 'not_member'; the last
 *   parent of a book gets SCLPG.
 * - remove_child_member(p_child, p_member, p_set_aside) -> 'removed' |
 *   'not_member'; a parent is never removed this way (42501).
 *
 * Every write sends the action's idempotency key (G-07, action-key.logic.ts).
 * The server reads it on create_child_invite today; the others are idempotent
 * by result and ignore it, and sending it keeps the client on ADR 0017.
 */
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';
import { actionScope, runAction, type ActionKeys } from './action-key.logic';

export interface RpcResult {
  data: unknown;
  error: unknown;
}

/** What supabase-js `rpc()` returns: a thenable builder with `setHeader`. */
export interface RpcBuilder extends PromiseLike<RpcResult> {
  setHeader(name: string, value: string): RpcBuilder;
}

export interface RpcClient {
  rpc(fn: string, args?: Record<string, unknown>): RpcBuilder;
}

/** The longest sign-off name the app shows or sends (child_invites.signs_as, profiles.signs_as). */
export const SIGNS_AS_SHOWN_MAX = 30;

/** What an invite says before the person agrees to join. Never the child's name. */
export interface InvitePeek {
  role: 'parent' | 'contributor';
  /** The name the inviter signs their letters with in that book, or null when they never set one. */
  inviterSignsAs: string | null;
  /** 'joined': this person already accepted this invite (a second device, or a lost answer). */
  state: 'open' | 'joined';
}

/** The server's answer, read defensively: anything odd reads as an open parent invite with no name. */
export function readInvitePeek(data: unknown): InvitePeek {
  const row = (Array.isArray(data) ? data[0] : data) as { role?: unknown; inviter_signs_as?: unknown; state?: unknown } | null | undefined;
  const raw = typeof row?.inviter_signs_as === 'string' ? row.inviter_signs_as.replace(/\s+/g, ' ').trim().slice(0, SIGNS_AS_SHOWN_MAX) : '';
  return {
    role: row?.role === 'contributor' ? 'contributor' : 'parent',
    inviterSignsAs: raw || null,
    state: row?.state === 'joined' ? 'joined' : 'open',
  };
}

function noData(what: string): Error {
  return Object.assign(new Error(what), { code: 'P0002' });
}

/** Read only: never joins, writes nothing, needs no key. */
export async function peekInviteRpc(sb: RpcClient, token: string): Promise<InvitePeek> {
  const { data, error } = await sb.rpc('peek_invite', { p_token: token });
  if (error) throw error;
  if (data == null) throw noData('invite_no_preview');
  return readInvitePeek(data);
}

export async function acceptInviteRpc(sb: RpcClient, keys: ActionKeys, token: string): Promise<string> {
  return runAction(keys, actionScope.acceptInvite(token), async (key) => {
    const { data, error } = await sb.rpc('accept_child_invite', { p_token: token }).setHeader(HEADER_IDEMPOTENCY_KEY, key);
    if (error) throw error;
    if (typeof data !== 'string') throw noData('invite_no_child');
    return data;
  });
}

/** Returns the raw token, once. `signsAs` is trimmed and capped; empty means none. */
export async function createInviteRpc(sb: RpcClient, keys: ActionKeys, childId: string, signsAs: string | null): Promise<string> {
  const s = signsAs?.trim().slice(0, SIGNS_AS_SHOWN_MAX) || null;
  return runAction(keys, actionScope.createInvite(childId, s), async (key) => {
    const { data, error } = await sb.rpc('create_child_invite', { p_child: childId, p_role: 'parent', p_signs_as: s }).setHeader(HEADER_IDEMPOTENCY_KEY, key);
    if (error) throw error;
    if (typeof data !== 'string') throw noData('invite_no_token');
    return data;
  });
}

export async function revokeInviteRpc(sb: RpcClient, keys: ActionKeys, inviteId: string): Promise<void> {
  await runAction(keys, actionScope.revokeInvite(inviteId), async (key) => {
    const { error } = await sb.rpc('revoke_invite', { p_invite: inviteId }).setHeader(HEADER_IDEMPOTENCY_KEY, key);
    if (error) throw error;
  });
}

/** Leave a book. `keepInBook` false takes this person's letters out of it (they stay theirs). */
export async function leaveBookRpc(sb: RpcClient, keys: ActionKeys, childId: string, keepInBook: boolean): Promise<'left' | 'not_member'> {
  return runAction(keys, actionScope.leave(childId, keepInBook), async (key) => {
    const { data, error } = await sb.rpc('leave_child', { p_child: childId, p_keep_in_book: keepInBook }).setHeader(HEADER_IDEMPOTENCY_KEY, key);
    if (error) throw error;
    return data === 'not_member' ? 'not_member' : 'left';
  });
}

/** A parent removes a family member (contributor). Never a parent: the server answers 42501. */
export async function removeMemberRpc(sb: RpcClient, keys: ActionKeys, childId: string, memberId: string, setAside: boolean): Promise<'removed' | 'not_member'> {
  return runAction(keys, actionScope.removeMember(childId, memberId, setAside), async (key) => {
    const { data, error } = await sb
      .rpc('remove_child_member', { p_child: childId, p_member: memberId, p_set_aside: setAside })
      .setHeader(HEADER_IDEMPOTENCY_KEY, key);
    if (error) throw error;
    return data === 'not_member' ? 'not_member' : 'removed';
  });
}
