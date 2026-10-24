/**
 * Books (one row per child) and this person's choices for each (local schema
 * v7, F12-REQ-004). `children` holds what the book is (name, birthday, due date,
 * "Family can read"); `child_member_prefs` holds what the person on this phone
 * chose for it: the signature, reminders, hide and quiet. One account per
 * install (F16 6.2 G), so one prefs row per book. The `Child` read model joins
 * both, so screens see one object as before.
 */
import type { RepoContext } from './context';
import type { Child, NewChild } from './types';

interface ChildRow {
  id: string;
  name: string;
  birthday: string | null;
  due_date: string | null;
  signs_as: string | null;
  reminders_on: number | null;
  family_can_read: number;
  role: string | null;
  created_by_me: number | null;
  quiet_at: string | null;
}

/**
 * The signature and reminder switch come from child_member_prefs. A book with no prefs row yet (one added on
 * build 1 after a rollback, before reconcileKeptColumns has run) reads its kept columns instead, so it never
 * shows an empty signature and its first edit never writes one.
 */
const COLS = `c.id, c.name, c.birthday, c.due_date, COALESCE(p.signs_as, c.signs_as) AS signs_as,
  COALESCE(p.reminders_on, c.reminders_on) AS reminders_on, c.family_can_read, c.role, c.created_by_me, p.quiet_at`;
const FROM = 'children c LEFT JOIN child_member_prefs p ON p.child_id = c.id';

/** Books this person left, or that were deleted on the server, are not listed (their own letters stay on the phone). */
const LISTED = "c.server_state NOT IN ('left', 'deleted')";
/** Hidden for this person, or (support path, F12 6.2 D) for the whole book. */
const HIDDEN = '(p.hidden_at IS NOT NULL OR c.hidden_at IS NOT NULL)';

const fromRow = (r: ChildRow): Child => {
  const c: Child = {
    id: r.id,
    name: r.name,
    birthday: r.birthday,
    dueDate: r.due_date,
    signsAs: r.signs_as ?? '',
    remindersOn: r.reminders_on !== 0,
    familyCanRead: r.family_can_read === 1,
  };
  if (r.quiet_at) c.quiet = true;
  if (r.created_by_me !== null && r.created_by_me !== undefined) c.createdByMe = r.created_by_me === 1;
  if (r.role === 'parent' || r.role === 'contributor') c.role = r.role;
  return c;
};

/** Visible children, oldest book first. */
export function listVisible({ db }: RepoContext): Child[] {
  return db.all<ChildRow>(`SELECT ${COLS} FROM ${FROM} WHERE NOT ${HIDDEN} AND ${LISTED} ORDER BY c.created_at ASC, c.id ASC`).map(fromRow);
}

export function listHidden({ db }: RepoContext): Child[] {
  return db.all<ChildRow>(`SELECT ${COLS} FROM ${FROM} WHERE ${HIDDEN} AND ${LISTED} ORDER BY c.created_at ASC, c.id ASC`).map(fromRow);
}

export function get({ db }: RepoContext, id: string): Child | null {
  const r = db.get<ChildRow>(`SELECT ${COLS} FROM ${FROM} WHERE c.id = ?`, id);
  return r ? fromRow(r) : null;
}

/** This person's choices for a book. Null when the book has no prefs row yet. */
export function prefsOf({ db }: RepoContext, id: string): { signsAs: string; remindersOn: boolean; hidden: boolean; quiet: boolean } | null {
  return prefsRow(db, id);
}

/** The same read for code that holds only a SqlDb (sync/outbox.ts, ownership.ts). */
export function prefsRow(
  db: RepoContext['db'],
  id: string,
): { signsAs: string; remindersOn: boolean; hidden: boolean; quiet: boolean } | null {
  const r = db.get<{ signs_as: string; reminders_on: number; hidden_at: string | null; quiet_at: string | null }>(
    'SELECT signs_as, reminders_on, hidden_at, quiet_at FROM child_member_prefs WHERE child_id = ?', id);
  return r ? { signsAs: r.signs_as, remindersOn: r.reminders_on !== 0, hidden: r.hidden_at !== null, quiet: r.quiet_at !== null } : null;
}

/**
 * Writes this person's signature and reminder choice for a book, creating the prefs row if needed.
 * The same two values are mirrored into `children.signs_as` and `children.reminders_on`, which v7 keeps
 * so that a v6 build opening this file after a rollback still lists its books with the current signature
 * (review L on #166). They are read only to bring back what that build wrote (reconcileKeptColumns, and
 * COLS for a book with no prefs row). The mirror goes with the columns once MOB-09 ships.
 */
export function upsertPrefs(db: RepoContext['db'], id: string, p: { signsAs: string; remindersOn: boolean }, now: string): void {
  db.run(
    `INSERT INTO child_member_prefs (child_id, signs_as, reminders_on, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(child_id) DO UPDATE SET signs_as = excluded.signs_as, reminders_on = excluded.reminders_on, updated_at = excluded.updated_at`,
    id, p.signsAs, p.remindersOn ? 1 : 0, now,
  );
  db.run('UPDATE children SET signs_as = ?, reminders_on = ? WHERE id = ?', p.signsAs, p.remindersOn ? 1 : 0, id);
}

export function insert(ctx: RepoContext, id: string, input: NewChild): void {
  const now = ctx.now();
  // signs_as is written here as well: the column is NOT NULL on every file since v1, and v7 keeps it.
  ctx.db.run(
    'INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, input.name, input.birthday, input.dueDate, input.signsAs, now, now,
  );
  upsertPrefs(ctx.db, id, { signsAs: input.signsAs, remindersOn: true }, now);
}

/** Applies `patch` over the stored row. Returns false when the child does not exist. */
export function update(ctx: RepoContext, id: string, patch: Partial<Omit<Child, 'id'>>): boolean {
  const c = get(ctx, id);
  if (!c) return false;
  const n = { ...c, ...patch };
  const now = ctx.now();
  ctx.db.run(
    'UPDATE children SET name = ?, birthday = ?, due_date = ?, family_can_read = ?, updated_at = ? WHERE id = ?',
    n.name, n.birthday, n.dueDate, n.familyCanRead ? 1 : 0, now, id,
  );
  if (n.signsAs !== c.signsAs || n.remindersOn !== c.remindersOn || prefsRow(ctx.db, id) === null) {
    upsertPrefs(ctx.db, id, { signsAs: n.signsAs, remindersOn: n.remindersOn }, now);
  }
  return true;
}

function setPrefTime(ctx: RepoContext, id: string, column: 'hidden_at' | 'quiet_at', on: boolean): void {
  const now = ctx.now();
  ctx.db.run(
    `INSERT INTO child_member_prefs (child_id, ${column}, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(child_id) DO UPDATE SET ${column} = excluded.${column}, updated_at = excluded.updated_at`,
    id, on ? now : null, now,
  );
}

/** "Hide this book" for this person (F12-REQ-005 Rev): stops prompts for this child; restorable. */
export function hide(ctx: RepoContext, id: string): void {
  setPrefTime(ctx, id, 'hidden_at', true);
}

export function unhide(ctx: RepoContext, id: string): void {
  setPrefTime(ctx, id, 'hidden_at', false);
}

/** "Quiet this book" for this person (F12-REQ-011): letters untouched; no reason asked; reversible. */
export function setQuiet(ctx: RepoContext, id: string, quiet: boolean): void {
  setPrefTime(ctx, id, 'quiet_at', quiet);
}

/** A book and its prefs row side by side. The kept columns and updated_at are NOT NULL since v1; p_* are null when there is no prefs row. */
interface KeptRow {
  id: string;
  k_signs: string;
  k_reminders: number;
  k_hidden: string | null;
  k_at: string;
  p_id: string | null;
  p_signs: string | null;
  p_reminders: number | null;
  p_hidden: string | null;
  p_at: string | null;
}

/**
 * After a rollback to build 1 (the kill path, docs/release/AUTOMATION.md 2.10; review of #166): build 1 is a
 * v6 build. It finds this file newer, leaves the schema alone, and reads and writes a book's kept columns
 * (`children.signs_as`, `children.reminders_on`, `children.hidden_at`) directly, never `child_member_prefs`.
 * This brings what the person set there into the prefs row, so nothing set on build 1 is lost or stuck.
 * store.ts runs it once per open, in one transaction, before anything reads or writes a book.
 *
 * Which value is later is told by write order, not by the clock: every write of this build and of v7 sets the
 * prefs value and its kept column together (upsertPrefs mirrors; nothing here sets `children.hidden_at`, which
 * migration 7 emptied). So a kept column that differs from its prefs value, or a `children.hidden_at` that is
 * set, was written after the prefs value, by build 1. The updated_at columns cannot decide it: a hide or quiet
 * moves the prefs row's time without the signature changing, and a pull or a rename moves the book's.
 * - No prefs row (a book added on build 1): one is made from the kept columns.
 * - Signature or reminder switch differs: the kept value goes into the prefs row. An empty signature is not a
 *   value a person set (the editor refuses one; it is the column default), so it never replaces a set one:
 *   the prefs value is written back to the kept column instead.
 * - `children.hidden_at` set (hidden on build 1): the book is hidden for this person (a prefs hide time it
 *   already had stays) and the column is emptied, as migration 7 did, so "Show this book again" works.
 * When the prefs row changes, its updated_at becomes the later of its own and the book's (build 1 stamps the
 * book on every write), so it never goes back. Letters, the book's own columns and the sync queue are not
 * touched: build 1 queued its own prefs ops when this phone was signed in.
 * Returns how many books changed (no values leave this function: nothing is logged).
 */
export function reconcileKeptColumns(db: RepoContext['db']): number {
  const rows = db.all<KeptRow>(
    `SELECT c.id, c.signs_as AS k_signs, c.reminders_on AS k_reminders, c.hidden_at AS k_hidden, c.updated_at AS k_at,
       p.child_id AS p_id, p.signs_as AS p_signs, p.reminders_on AS p_reminders, p.hidden_at AS p_hidden, p.updated_at AS p_at
     FROM ${FROM}
     WHERE p.child_id IS NULL OR c.hidden_at IS NOT NULL OR c.signs_as IS NOT p.signs_as OR c.reminders_on IS NOT p.reminders_on`,
  );
  for (const r of rows) {
    if (r.p_id === null) {
      db.run(
        'INSERT INTO child_member_prefs (child_id, signs_as, reminders_on, hidden_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        r.id, r.k_signs, r.k_reminders, r.k_hidden, r.k_at,
      );
    } else {
      const pSigns = r.p_signs ?? '';
      const signs = r.k_signs.trim() !== '' ? r.k_signs : pSigns;
      const hidden = r.k_hidden !== null ? r.p_hidden ?? r.k_hidden : r.p_hidden;
      if (signs !== pSigns || r.k_reminders !== r.p_reminders || hidden !== r.p_hidden) {
        // ISO text from toISOString() on every build, so the later time is the larger string.
        const at = r.p_at !== null && r.p_at > r.k_at ? r.p_at : r.k_at;
        db.run(
          'UPDATE child_member_prefs SET signs_as = ?, reminders_on = ?, hidden_at = ?, updated_at = ? WHERE child_id = ?',
          signs, r.k_reminders, hidden, at, r.id,
        );
      }
      // The kept columns mirror the prefs row again (an empty kept signature takes the set one back).
      if (signs !== r.k_signs) db.run('UPDATE children SET signs_as = ? WHERE id = ?', signs, r.id);
    }
    if (r.k_hidden !== null) db.run('UPDATE children SET hidden_at = NULL WHERE id = ?', r.id);
  }
  return rows.length;
}
