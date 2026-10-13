/**
 * Co-parent invites over the server functions in migration 20261003000000
 * (PRD B F5, B-REQ-007, TDD 04 3.4.2). At launch the role is always 'parent'
 * (BRIEF decision 5); the database also supports 'contributor', which the app
 * hides.
 *
 * - create_child_invite(p_child, p_role, p_signs_as) returns the raw token
 *   once; only its hash is stored. Parent of a live book only, consent
 *   required, 20 per book and per parent per day (SCPAR, SCCON, SCRAT).
 * - accept_child_invite(p_token) returns the child id; retries by the same
 *   person are idempotent (SCINV for every other reason).
 * - revoke_invite(p_invite) for the inviting book's parents.
 * - peek_invite(p_token) (db-fix, G-13): what the invite says before the
 *   person agrees, never the child's name. Ask before joining (G-02).
 * - leave_child(p_child, p_keep_in_book) and remove_child_member(p_child,
 *   p_member, p_set_aside) (migration 20261005000000).
 * - child_invites is readable by parents of the book only (no token in it).
 *
 * Typed by hand until packages/api carries these contracts.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { brand } from '@scribe/brand';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';
import { publishInviteAccepted } from '../auth/auth-store';
import { actionKeys, isRetryableWrite } from '../supabase/client';
import { withActionKey } from '../supabase/idempotency.logic';
import { isMissingFunction } from './invite-errors.logic';
import { readInvitePreview, type InvitePreview } from './invite-preview.logic';

export type { InvitePreview } from './invite-preview.logic';
import { inviteUrl } from './invite-link.logic';

export interface CreatedInvite {
  token: string;
  url: string;
}

export interface PendingInviteRow {
  id: string;
  signsAs: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface BookMember {
  profileId: string;
  role: 'parent' | 'contributor';
  /** What the child calls them, or their display name; null when neither is set. */
  label: string | null;
  isYou: boolean;
}

/**
 * One idempotency key per invite the person asked for (book, role and
 * signature), reused when they tap "Try again" after a lost answer (G-07).
 * A replay gives a fresh token for the same invite (APPLY.md file 12).
 */
export function inviteActionScope(childId: string, signsAs: string | null): string {
  return `create_child_invite:${childId}:parent:${signsAs ?? ''}`;
}

export async function createCoParentInvite(sb: SupabaseClient, childId: string, signsAs: string | null): Promise<CreatedInvite> {
  const s = signsAs?.trim().slice(0, 30) || null;
  const data = await withActionKey(
    actionKeys,
    inviteActionScope(childId, s),
    async (key) => {
      const res = await sb.rpc('create_child_invite', { p_child: childId, p_role: 'parent', p_signs_as: s }).setHeader(HEADER_IDEMPOTENCY_KEY, key);
      if (res.error) throw res.error;
      return res.data as unknown;
    },
    isRetryableWrite,
  );
  if (typeof data !== 'string') throw Object.assign(new Error('invite_no_token'), { code: 'P0002' });
  return { token: data, url: inviteUrl(data, brand.web.origin) };
}

/**
 * Never joins. Errors are the same as accepting (SCINV expired, used, revoked,
 * not found, already a member; SCCAP; SCRAT). A server without peek_invite
 * yet answers with a generic preview, so asking first never depends on it.
 */
export async function peekInvite(sb: SupabaseClient, token: string): Promise<InvitePreview> {
  const { data, error } = await sb.rpc('peek_invite', { p_token: token });
  if (error) {
    if (isMissingFunction(error)) return { inviter: null, role: 'parent', known: false };
    throw error;
  }
  return readInvitePreview(data);
}

export async function acceptInvite(sb: SupabaseClient, token: string): Promise<string> {
  const { data, error } = await sb.rpc('accept_child_invite', { p_token: token });
  if (error) throw error;
  if (typeof data !== 'string') throw Object.assign(new Error('invite_no_child'), { code: 'P0002' });
  publishInviteAccepted(data);
  return data;
}

export async function revokeInvite(sb: SupabaseClient, inviteId: string): Promise<void> {
  const { error } = await sb.rpc('revoke_invite', { p_invite: inviteId });
  if (error) throw error;
}

/** Open co-parent invites for a book (parents only see any). */
export async function listPendingInvites(sb: SupabaseClient, childId: string): Promise<PendingInviteRow[]> {
  const { data, error } = await sb
    .from('child_invites')
    .select('id, role, signs_as, created_at, expires_at, accepted_at, revoked_at')
    .eq('child_id', childId)
    .eq('role', 'parent')
    .is('accepted_at', null)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id as string,
    signsAs: (r.signs_as as string | null) ?? null,
    createdAt: r.created_at as string,
    expiresAt: r.expires_at as string,
  }));
}

/** Members of a book with their signature; empty when the book is not on the server yet. */
export async function listBookMembers(sb: SupabaseClient, childId: string, myId: string): Promise<BookMember[]> {
  const { data, error } = await sb
    .from('child_members')
    .select('profile_id, role, joined_at, profiles(display_name, signs_as)')
    .eq('child_id', childId)
    .order('joined_at', { ascending: true });
  if (error) throw error;
  type Row = { profile_id: string; role: 'parent' | 'contributor'; profiles: { display_name: string | null; signs_as: string | null } | null };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    profileId: r.profile_id,
    role: r.role,
    label: r.profiles?.signs_as?.trim() || r.profiles?.display_name?.trim() || null,
    isYou: r.profile_id === myId,
  }));
}

/** Name of a book the person just joined, for the welcome line. Null when not readable yet. */
export async function bookName(sb: SupabaseClient, childId: string): Promise<string | null> {
  const { data } = await sb.from('children').select('name').eq('id', childId).maybeSingle();
  return (data as { name?: string } | null)?.name ?? null;
}

/**
 * Leave a book (any member). `keepLettersInBook` false takes this person's
 * letters out of the book (they stay theirs, never deleted). The only parent
 * of a book gets SCLPG; the Family screen offers leaving only when a co-parent
 * exists. 'not_member' when already gone (a retry).
 */
export async function leaveBook(sb: SupabaseClient, childId: string, keepLettersInBook: boolean): Promise<'left' | 'not_member'> {
  const { data, error } = await sb.rpc('leave_child', { p_child: childId, p_keep_in_book: keepLettersInBook });
  if (error) throw error;
  return data === 'not_member' ? 'not_member' : 'left';
}

/**
 * A parent removes a family member (never a parent: 42501). Their letters
 * stay unless `setAside`. 'not_member' when already gone.
 */
export async function removeMember(sb: SupabaseClient, childId: string, memberId: string, setAside: boolean): Promise<'removed' | 'not_member'> {
  const { data, error } = await sb.rpc('remove_child_member', { p_child: childId, p_member: memberId, p_set_aside: setAside });
  if (error) throw error;
  return data === 'not_member' ? 'not_member' : 'removed';
}
