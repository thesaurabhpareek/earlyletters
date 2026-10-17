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

const COLS = `c.id, c.name, c.birthday, c.due_date, p.signs_as, p.reminders_on, c.family_can_read, c.role, c.created_by_me, p.quiet_at`;
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

/** Writes this person's signature and reminder choice for a book, creating the prefs row if needed. */
export function upsertPrefs(db: RepoContext['db'], id: string, p: { signsAs: string; remindersOn: boolean }, now: string): void {
  db.run(
    `INSERT INTO child_member_prefs (child_id, signs_as, reminders_on, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(child_id) DO UPDATE SET signs_as = excluded.signs_as, reminders_on = excluded.reminders_on, updated_at = excluded.updated_at`,
    id, p.signsAs, p.remindersOn ? 1 : 0, now,
  );
}

export function insert(ctx: RepoContext, id: string, input: NewChild): void {
  const now = ctx.now();
  ctx.db.run(
    'INSERT INTO children (id, name, birthday, due_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    id, input.name, input.birthday, input.dueDate, now, now,
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
