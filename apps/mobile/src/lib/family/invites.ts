/**
 * Co-parent sharing over the server's membership functions (PRD V2 F11 sections 6.2 and 11; PRD B
 * F5). The role is always `parent` at v1.0 (B1); the server refuses `contributor` unless its
 * setting says otherwise (F11-REQ-003).
 *
 *  create_child_invite   device-made overload first (S02's 20261015020000, F11 D5): the phone
 *                        sends its invite id and sha256(token) and gets the id back; no secret
 *                        is ever in a response. A server without that overload (develop's
 *                        20261005000000) answers PGRST202, and the app falls back to the
 *                        server-made token, with the draft id as the idempotency key, so a
 *                        retry is still one invite (G-07).
 *  peek_invite           what the invite says before joining: the inviter's sign-off and the
 *                        role, never the child's name (BL-322, S02's 20261015010000). A server
 *                        without it gives an unnamed preview: the screen still asks first.
 *  accept_child_invite   joins, once the person tapped Join. Idempotent for the same person.
 *                        Never changes which book is open (BL-322).
 *  revoke_invite         cancels an open invite (either parent).
 *  leave_child           leaves, keeping or taking out this person's letters (F11-REQ-011).
 *  child_invites         open invites of a book, for its parents (RLS); never the hash columns.
 *
 * Members come from the pull (store `listMembers`, sync_books.members), not from here.
 * Shapes match the S07 family contract (`@scribe/api/server` family.ts, pending); typed by hand
 * until that merges (request to S07 in the PR).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { brand } from '@scribe/brand';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';
import { publishInviteAccepted } from '../auth/auth-store';
import { byteaArg, type InviteDraft } from './invite-draft.logic';
import { isMissingFunction } from './invite-errors.logic';
import { inviteUrl } from './invite-link.logic';
import { readInvitePreview, UNKNOWN_PREVIEW, type InvitePreview } from './invite-preview.logic';

export type { InviteDraft } from './invite-draft.logic';
export type { InvitePreview } from './invite-preview.logic';

/** The parts of supabase-js these calls use (the Node end-to-end test passes a PGlite stand-in). */
export type FamilyClient = Pick<SupabaseClient, 'rpc' | 'from'>;

export interface CreatedInvite {
  /** The invite's id on the server; null when an older server made it (it does not return the id). */
  id: string | null;
  /** The link to share: https://<brand host>/j#t=<token> (the token in the fragment, B-NFR-002). Never stored, logged or tracked. */
  url: string;
  /** `device`: the phone made the token (D5). `server`: an older server made it. */
  madeBy: 'device' | 'server';
}

export interface PendingInviteRow {
  id: string;
  signsAs: string | null;
  createdAt: string;
  expiresAt: string;
}

/** A sign-off is at most 30 characters (the invite and settings fields). */
function signOff(s: string | null | undefined): string | null {
  return s?.trim().slice(0, 30).trim() || null;
}

/**
 * Makes the invite in `draft` for `childId`. The same draft sent again (a retry after a lost
 * answer, a double tap) is the same invite. Throws the server's error otherwise: SCCAP when the
 * book has two parents (F11-REQ-004), SCPAR, SCCON, SCRAT, SCDEL, SCCID.
 */
export async function createCoParentInvite(sb: FamilyClient, childId: string, signsAs: string | null, draft: InviteDraft): Promise<CreatedInvite> {
  const s = signOff(signsAs);
  const device = await sb.rpc('create_child_invite', {
    p_invite_id: draft.id,
    p_child: childId,
    p_role: 'parent',
    p_token_hash: byteaArg(draft.tokenHash),
    p_code_hash: null, // codes wait for invite-redeem (WP-F11-02, DR-13); link-only invites until then
    p_signs_as: s,
  });
  if (!device.error) {
    if (device.data !== draft.id) throw Object.assign(new Error('invite_id_mismatch'), { code: 'P0002' });
    return { id: draft.id, url: inviteUrl(draft.token, brand.web.origin), madeBy: 'device' };
  }
  if (!isMissingFunction(device.error)) throw device.error;

  // An older server: it makes the token and returns it once. The draft id is the idempotency key,
  // so a retry of this same request returns the same invite with a fresh token (APPLY.md file 12).
  const server = await sb.rpc('create_child_invite', { p_child: childId, p_role: 'parent', p_signs_as: s }).setHeader(HEADER_IDEMPOTENCY_KEY, draft.id);
  if (server.error) throw server.error;
  if (typeof server.data !== 'string') throw Object.assign(new Error('invite_no_token'), { code: 'P0002' });
  return { id: null, url: inviteUrl(server.data, brand.web.origin), madeBy: 'server' };
}

/**
 * What the invite says, before joining. Signed in only (the server's `require_user`); works
 * before consent, so the person decides before agreeing to anything. Never joins. Errors are
 * those of accepting: SCINV, SCCAP, SCRAT.
 */
export async function peekInvite(sb: FamilyClient, token: string): Promise<InvitePreview> {
  const { data, error } = await sb.rpc('peek_invite', { p_token: token });
  if (error) {
    if (isMissingFunction(error)) return UNKNOWN_PREVIEW;
    throw error;
  }
  return readInvitePreview(data);
}

/**
 * Joins the book, after the person tapped Join (BL-322). Returns the book's id. Asks sync to
 * bring the book to this phone; it never makes the book the open one (only a tap on "Open the
 * book" does, in the join screen).
 */
export async function acceptInvite(sb: FamilyClient, token: string): Promise<string> {
  const { data, error } = await sb.rpc('accept_child_invite', { p_token: token });
  if (error) throw error;
  if (typeof data !== 'string') throw Object.assign(new Error('invite_no_child'), { code: 'P0002' });
  publishInviteAccepted(data);
  return data;
}

export async function revokeInvite(sb: FamilyClient, inviteId: string): Promise<void> {
  const { error } = await sb.rpc('revoke_invite', { p_invite: inviteId });
  if (error) throw error;
}

/** Exactly these columns, never `*` and never the hash columns (S07 family contract). */
const PENDING_COLUMNS = 'id, role, signs_as, created_at, expires_at, accepted_at, revoked_at';

/** Open co-parent invites for a book, newest first (parents of the book only see any). */
export async function listPendingInvites(sb: FamilyClient, childId: string, now: Date = new Date()): Promise<PendingInviteRow[]> {
  const { data, error } = await sb
    .from('child_invites')
    .select(PENDING_COLUMNS)
    .eq('child_id', childId)
    .eq('role', 'parent')
    .is('accepted_at', null)
    .is('revoked_at', null)
    .gt('expires_at', now.toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  type Row = { id: string; signs_as: string | null; created_at: string; expires_at: string };
  return ((data ?? []) as Row[]).map((r) => ({ id: r.id, signsAs: r.signs_as ?? null, createdAt: r.created_at, expiresAt: r.expires_at }));
}

/**
 * Leaves a book (F11-REQ-011). `keepLettersInBook` false takes every letter this person wrote in
 * that book out of it, in the same transaction; they stay theirs, never deleted. The only parent
 * of a live book gets SCLPG. 'not_member' when already gone (a retry after a lost answer).
 */
export async function leaveBook(sb: FamilyClient, childId: string, keepLettersInBook: boolean): Promise<'left' | 'not_member'> {
  const { data, error } = await sb.rpc('leave_child', { p_child: childId, p_keep_in_book: keepLettersInBook });
  if (error) throw error;
  return data === 'not_member' ? 'not_member' : 'left';
}

/** Name of a book the person just joined, for the joined line. Null when not readable yet. */
export async function bookName(sb: FamilyClient, childId: string): Promise<string | null> {
  const { data } = await sb.from('children').select('name').eq('id', childId).maybeSingle();
  return (data as { name?: string } | null)?.name ?? null;
}
