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
 * - child_invites is readable by parents of the book only (no token in it).
 *
 * Typed by hand until packages/api carries these contracts.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { brand } from '@scribe/brand';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';
import { publishInviteAccepted } from '../auth/auth-store';
import { idempotencyKey } from '../supabase/client';
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

export async function createCoParentInvite(sb: SupabaseClient, childId: string, signsAs: string | null): Promise<CreatedInvite> {
  const s = signsAs?.trim().slice(0, 30) || null;
  const { data, error } = await sb
    .rpc('create_child_invite', { p_child: childId, p_role: 'parent', p_signs_as: s })
    .setHeader(HEADER_IDEMPOTENCY_KEY, idempotencyKey());
  if (error) throw error;
  if (typeof data !== 'string') throw Object.assign(new Error('invite_no_token'), { code: 'P0002' });
  return { token: data, url: inviteUrl(data, brand.web.origin) };
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
