/**
 * Co-parent invites and membership over the server functions (PRD B F5,
 * B-REQ-007, TDD 04 3.4.2; F11 sections 6 and 7). At launch the role is
 * always 'parent' (BRIEF decision 5); the database also supports
 * 'contributor', which the app never creates (F11 D4).
 *
 * The RPC calls and their contracts live in family-rpc.logic.ts (pure, tested
 * with a fake client). This file passes the real supabase-js client, keeps one
 * idempotency key per user action for the app session (G-07), and adds the
 * table reads (child_invites, child_members, children).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { brand } from '@scribe/brand';
import { publishInviteAccepted } from '../auth/auth-store';
import { idempotencyKey } from '../supabase/client';
import { ActionKeys } from './action-key.logic';
import {
  acceptInviteRpc,
  createInviteRpc,
  leaveBookRpc,
  peekInviteRpc,
  removeMemberRpc,
  revokeInviteRpc,
  type InvitePeek,
  type RpcClient,
} from './family-rpc.logic';
import { inviteUrl } from './invite-link.logic';

export type { InvitePeek } from './family-rpc.logic';

/** One key per user action, for this app session (action-key.logic.ts). */
export const familyActionKeys = new ActionKeys(idempotencyKey);

const rpc = (sb: SupabaseClient) => sb as unknown as RpcClient;

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
  /** ISO time they joined the book. */
  joinedAt: string | null;
}

export async function createCoParentInvite(sb: SupabaseClient, childId: string, signsAs: string | null): Promise<CreatedInvite> {
  const token = await createInviteRpc(rpc(sb), familyActionKeys, childId, signsAs);
  return { token, url: inviteUrl(token, brand.web.origin) };
}

/** What the invite says before joining (BL-322). Joins nothing. */
export async function peekInvite(sb: SupabaseClient, token: string): Promise<InvitePeek> {
  return peekInviteRpc(rpc(sb), token);
}

/** Joins. Only after the person tapped Join (lib/family/join.logic.ts). Never opens the book. */
export async function acceptInvite(sb: SupabaseClient, token: string): Promise<string> {
  const childId = await acceptInviteRpc(rpc(sb), familyActionKeys, token);
  publishInviteAccepted(childId);
  return childId;
}

export async function revokeInvite(sb: SupabaseClient, inviteId: string): Promise<void> {
  await revokeInviteRpc(rpc(sb), familyActionKeys, inviteId);
}

/** leave_child: any member leaves; `keepInBook` false takes their letters out (they stay theirs). */
export async function leaveBook(sb: SupabaseClient, childId: string, keepInBook: boolean): Promise<'left' | 'not_member'> {
  return leaveBookRpc(rpc(sb), familyActionKeys, childId, keepInBook);
}

/** remove_child_member: a parent removes a family member (never a parent). */
export async function removeMember(sb: SupabaseClient, childId: string, memberId: string, setAside: boolean): Promise<'removed' | 'not_member'> {
  return removeMemberRpc(rpc(sb), familyActionKeys, childId, memberId, setAside);
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
  type Row = {
    profile_id: string;
    role: 'parent' | 'contributor';
    joined_at: string | null;
    profiles: { display_name: string | null; signs_as: string | null } | null;
  };
  return ((data ?? []) as unknown as Row[]).map((r) => ({
    profileId: r.profile_id,
    role: r.role,
    label: r.profiles?.signs_as?.trim() || r.profiles?.display_name?.trim() || null,
    isYou: r.profile_id === myId,
    joinedAt: r.joined_at ?? null,
  }));
}

/** Name of a book the person just joined, for the welcome line. Null when not readable yet. */
export async function bookName(sb: SupabaseClient, childId: string): Promise<string | null> {
  const { data } = await sb.from('children').select('name').eq('id', childId).maybeSingle();
  return (data as { name?: string } | null)?.name ?? null;
}
