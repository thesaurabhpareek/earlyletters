/**
 * Co-parent sharing over the server's membership functions (PRD V2 F11 sections 6.2 and 11; PRD B
 * F5). The role is always `parent` at v1.0 (B1); the server refuses `contributor` unless its
 * setting says otherwise (F11-REQ-003).
 *
 *  create_child_invite   device-made overload first (20261015020000, F11 D5): the phone sends
 *                        its invite id and sha256(token) and gets the id back; no secret is
 *                        ever in a response. A server that has only the older 3-argument
 *                        overload (20261005000000) answers PGRST202, and the app falls back to
 *                        the server-made token, with the draft id as the idempotency key, so a
 *                        retry is still one invite (G-07). develop has both overloads.
 *  peek_invite           what the invite says before joining: the inviter's sign-off and the
 *                        role, never the child's name (BL-322, S02's 20261015010000). A server
 *                        without it gives an unnamed preview: the screen still asks first.
 *  accept_child_invite   joins, once the person tapped Join. Idempotent for the same person.
 *                        Never changes which book is open (BL-322).
 *  revoke_invite         cancels an open invite (either parent).
 *  leave_child           leaves, keeping or taking out this person's letters (F11-REQ-011).
 *  sync_books            the pending invites of a book, for its parents (`books[].invites`, the
 *                        server's one source for the list, F11-REQ-019); never `child_invites`
 *                        directly, so no hash column can reach the phone (invite-list.logic.ts).
 *
 * Members come from the pull (store `listMembers`, sync_books.members), not from here.
 * Shapes match the S07 family contract (`@scribe/api/server` family.ts), typed by hand.
 *
 * `killSwitches.invites` (invites-switch.ts): while it is on, create, peek, accept and revoke throw
 * the paused error before they send anything, and so does Share again (it creates first). Listing
 * and leaving are not invite calls and are not paused.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { brand } from '@scribe/brand';
import { HEADER_IDEMPOTENCY_KEY } from '@scribe/api';
import { publishInviteAccepted } from '../auth/auth-store';
import { byteaArg, type InviteDraft } from './invite-draft.logic';
import { isMissingFunction } from './invite-errors.logic';
import { inviteUrl } from './invite-link.logic';
import { readPendingInvites, type PendingInviteRow } from './invite-list.logic';
import { readInvitePreview, UNKNOWN_PREVIEW, type InvitePreview } from './invite-preview.logic';
import { stopIfInvitesPaused } from './invites-switch';

export type { InviteDraft } from './invite-draft.logic';
export type { PendingInviteRow } from './invite-list.logic';
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

/** A sign-off is at most 30 characters (the invite and settings fields). */
function signOff(s: string | null | undefined): string | null {
  return s?.trim().slice(0, 30).trim() || null;
}

/**
 * Makes the invite in `draft` for `childId`. The same draft sent again (a retry after a lost
 * answer, a double tap) is the same invite. Throws the server's error otherwise: SCCAP when the
 * book has two parents (F11-REQ-004), SCPAR, SCCON, SCRAT, SCDEL, SCCID; the paused error, with
 * nothing sent, while `killSwitches.invites` is on.
 */
export async function createCoParentInvite(sb: FamilyClient, childId: string, signsAs: string | null, draft: InviteDraft): Promise<CreatedInvite> {
  stopIfInvitesPaused();
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
 * those of accepting: SCINV, SCCAP, SCRAT; paused (nothing sent) while `killSwitches.invites` is on.
 */
export async function peekInvite(sb: FamilyClient, token: string): Promise<InvitePreview> {
  stopIfInvitesPaused();
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
 * book" does, in the join screen). Paused (nothing sent) while `killSwitches.invites` is on.
 */
export async function acceptInvite(sb: FamilyClient, token: string): Promise<string> {
  stopIfInvitesPaused();
  const { data, error } = await sb.rpc('accept_child_invite', { p_token: token });
  if (error) throw error;
  if (typeof data !== 'string') throw Object.assign(new Error('invite_no_child'), { code: 'P0002' });
  publishInviteAccepted(data);
  return data;
}

/** Cancel invite. Paused (nothing sent, the invite stays open) while `killSwitches.invites` is on. */
export async function revokeInvite(sb: FamilyClient, inviteId: string): Promise<void> {
  stopIfInvitesPaused();
  const { error } = await sb.rpc('revoke_invite', { p_invite: inviteId });
  if (error) throw error;
}

/**
 * How "Share again" on the Family tab ended (F11-REQ-019):
 *  - `shared`: the new link went out and the old invite is cancelled, so a forwarded copy of the
 *    old link is never revived;
 *  - `dismissed`: the share sheet was closed without sending, so the old link still works and the
 *    new invite, which nobody has, is cancelled again;
 *  - `old_still_open`: the new link went out but cancelling the old invite failed, so both links
 *    work until the parent cancels one (the screen says so);
 *  - `not_sent`: the share sheet failed, so nothing is known to be sent and nothing is cancelled
 *    (the screen says so).
 * Making the new invite can fail too; that error is thrown, as createCoParentInvite throws it. While
 * `killSwitches.invites` is on that is the paused error, before any draft is sent or any sheet opens.
 */
export type ShareAgainOutcome = 'shared' | 'dismissed' | 'old_still_open' | 'not_sent';

/**
 * Share again: a new link for the same co-parent, then the old invite is cancelled only once the
 * share sheet says the new one was sent. `share` is lib/family/share.ts shareInviteLink on the
 * phone; it gets the link and nothing keeps it.
 */
export async function shareInviteAgain(
  sb: FamilyClient,
  childId: string,
  old: Pick<PendingInviteRow, 'id' | 'signsAs'>,
  draft: InviteDraft,
  share: (url: string) => Promise<'shared' | 'dismissed'>,
): Promise<ShareAgainOutcome> {
  const fresh = await createCoParentInvite(sb, childId, old.signsAs, draft);
  let sent: 'shared' | 'dismissed';
  try {
    sent = await share(fresh.url);
  } catch {
    return 'not_sent';
  }
  if (sent === 'dismissed') {
    // The new link was never sent and is not kept anywhere, so nobody can use it. If cancelling it
    // fails it is one more open invite in the list, which the parent can cancel there.
    if (fresh.id) await revokeInvite(sb, fresh.id).catch(() => undefined);
    return 'dismissed';
  }
  try {
    await revokeInvite(sb, old.id);
  } catch {
    return 'old_still_open';
  }
  return 'shared';
}

/**
 * The pending co-parent invites of a book, newest first, as the server lists them: one `sync_books`
 * call, then `books[].invites` (invite-list.logic.ts). The server's clock marks each `open` or
 * `expired`, and it keeps an expired invite for 14 days; nothing here filters on the phone's clock.
 * Not paused by `killSwitches.invites`: a paused invite is still an invite, and the list keeps it.
 */
export async function listPendingInvites(sb: FamilyClient, childId: string): Promise<PendingInviteRow[]> {
  const { data, error } = await sb.rpc('sync_books');
  if (error) throw error;
  return readPendingInvites(data, childId);
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
