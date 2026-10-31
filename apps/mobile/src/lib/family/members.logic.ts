/**
 * The Family tab's shared-book states (PRD V2 F11 sections 6.2 A and D; F11-REQ-001, -004, -011,
 * -019, -023). Pure, tested in test/invite-link.test.ts; the screen passes in the book, its members
 * from the last pull (store `listMembers`) and its open invites.
 */
import { bookIsFull, canDo, type BookState } from '@scribe/core/src/family-rules';

export interface MemberLike {
  id: string;
  signsAs: string;
  role: 'parent' | 'contributor';
}

export interface FamilyTabState {
  /** Parents of the book, the viewer included (1 for a book only on this phone). */
  parents: number;
  /** The other parent(s), as the last pull listed them. */
  coParents: MemberLike[];
  /** "Write this book together": only while a second parent can still join and no invite is open. */
  showInviteCard: boolean;
  /** F11-REQ-004: the book has two parents; inviting is not offered. */
  full: boolean;
  /** F11-REQ-011: leave is offered only with a co-parent (a sole parent deletes the book instead). */
  canLeave: boolean;
}

export function familyTabState(input: {
  /** The viewer's role in the book; undefined for a book only on this phone (no account yet). */
  role?: 'parent' | 'contributor';
  members: readonly MemberLike[];
  openInvites: number;
  maxParents?: number;
}): FamilyTabState {
  const coParents = input.members.filter((m) => m.role === 'parent');
  const book: BookState = { parents: 1 + coParents.length, maxParents: input.maxParents };
  const role = input.role ?? 'parent'; // a book only on this phone is the viewer's own
  const canInvite = canDo(role, 'invite_coparent', book);
  return {
    parents: book.parents,
    coParents,
    showInviteCard: canInvite && input.openInvites === 0,
    full: bookIsFull(book),
    canLeave: input.role !== undefined && canDo(role, 'leave_book', book),
  };
}

// ── "{signsAs} has left {child}'s book." once (F11-REQ-023) ───────────────

export interface SeenCoParent {
  id: string;
  signsAs: string;
}

/** Per-book setting holding the co-parents this phone last showed. Ids and sign-offs only. */
export const SEEN_CO_PARENTS_PREFIX = 'family.seenCoParents.';
export const seenCoParentsKey = (childId: string) => `${SEEN_CO_PARENTS_PREFIX}${childId}`;

export function decodeSeen(raw: string | null): SeenCoParent[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.flatMap((x) => {
      const o = x as { id?: unknown; signsAs?: unknown };
      return typeof o?.id === 'string' && typeof o.signsAs === 'string' ? [{ id: o.id, signsAs: o.signsAs }] : [];
    });
  } catch {
    return [];
  }
}

export function encodeSeen(list: readonly MemberLike[] | readonly SeenCoParent[]): string {
  return JSON.stringify(list.map((m) => ({ id: m.id, signsAs: m.signsAs })));
}

/**
 * Co-parents this phone showed before who are gone from the book now: one neutral note each, then
 * the seen list is replaced, so the note never shows again. Only for a book the server lists for
 * this person (`onServer`): a book only on this phone, or one this person left, has no members to
 * compare, and must never announce that someone left.
 */
export function leftSince(seen: readonly SeenCoParent[], current: readonly MemberLike[], onServer: boolean): SeenCoParent[] {
  if (!onServer) return [];
  const now = new Set(current.filter((m) => m.role === 'parent').map((m) => m.id));
  return seen.filter((s) => !now.has(s.id));
}
