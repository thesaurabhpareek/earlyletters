/**
 * The Family tab's pending invites, read from the server's own list (F11-REQ-019; review A on #138,
 * comment 6370591557): `sync_books().books[].invites`, which packages/api/src/server/family.ts names
 * as the one source ("Do not select `child_invites` directly"). The server decides which rows there
 * are and how each is marked, on its own clock: not accepted and not cancelled, `open` until it
 * expires, then `expired` for 14 days, then gone. Parents only (null for anyone else). It never
 * sends a hash column, and the app never reads `child_invites` itself.
 *
 * Pure (no React Native), tested in Node (test/family-switch.test.ts) and against the real SQL
 * (test/family-e2e.test.ts).
 */
import type { SyncBooksResponse } from '@scribe/api/server';

/** One pending invite as the member list shows it. */
export interface PendingInviteRow {
  id: string;
  /** What the inviter suggested the child calls them; null when they left it empty. */
  signsAs: string | null;
  createdAt: string;
  expiresAt: string;
  /** As the server marks it (its clock, not the phone's): `open`, or `expired` for up to 14 days. */
  status: 'open' | 'expired';
}

type BookInvite = NonNullable<SyncBooksResponse['books'][number]['invites']>[number];

const isString = (v: unknown): v is string => typeof v === 'string' && v.length > 0;

function readInvite(raw: unknown): PendingInviteRow | null {
  if (!raw || typeof raw !== 'object') return null;
  const i = raw as Partial<Record<keyof BookInvite, unknown>>;
  // v1.0 invites co-parents only (B1); a contributor invite, if a server ever lists one, is not shown.
  if (i.role !== 'parent') return null;
  if (!isString(i.id) || !isString(i.created_at) || !isString(i.expires_at)) return null;
  if (!Number.isFinite(Date.parse(i.expires_at))) return null;
  if (i.status !== 'open' && i.status !== 'expired') return null;
  const signsAs = typeof i.signs_as === 'string' ? i.signs_as.trim().slice(0, 30).trim() || null : null;
  return { id: i.id, signsAs, createdAt: i.created_at, expiresAt: i.expires_at, status: i.status };
}

/**
 * The pending invites of one book from a `sync_books` answer, in the server's order (newest first).
 * A book the answer does not list, or one whose `invites` is null (not a parent), has none; a row
 * that does not read is skipped. An answer with no `books` list at all is not a list: it throws, so
 * the screen keeps what it shows instead of clearing it.
 */
export function readPendingInvites(data: unknown, childId: string): PendingInviteRow[] {
  const books = data && typeof data === 'object' ? (data as { books?: unknown }).books : undefined;
  if (!Array.isArray(books)) throw new Error('sync_books_unreadable');
  const book = books.find((b): b is { invites?: unknown } => !!b && typeof b === 'object' && (b as { id?: unknown }).id === childId);
  const invites = book?.invites;
  if (!Array.isArray(invites)) return [];
  return invites.flatMap((r) => {
    const row = readInvite(r);
    return row ? [row] : [];
  });
}

/** Rows that still work: they count against the invite card and offer Cancel invite (an expired link already stopped). */
export function openInvites(rows: readonly PendingInviteRow[]): PendingInviteRow[] {
  return rows.filter((r) => r.status === 'open');
}
