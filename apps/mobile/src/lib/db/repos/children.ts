/** Books (one row per child). Per-child preferences are columns here. */
import type { RepoContext } from './context';
import type { Child, NewChild } from './types';

interface ChildRow {
  id: string;
  name: string;
  birthday: string | null;
  due_date: string | null;
  signs_as: string;
  reminders_on: number;
  family_can_read: number;
  role: string | null;
  created_by_me: number | null;
}

const COLS = 'id, name, birthday, due_date, signs_as, reminders_on, family_can_read, role, created_by_me';

/** Books this person left, or that were deleted on the server, are not listed (their own letters stay on the phone). */
const LISTED = "server_state NOT IN ('left', 'deleted')";

const fromRow = (r: ChildRow): Child => {
  const c: Child = {
    id: r.id,
    name: r.name,
    birthday: r.birthday,
    dueDate: r.due_date,
    signsAs: r.signs_as,
    remindersOn: r.reminders_on === 1,
    familyCanRead: r.family_can_read === 1,
  };
  if (r.created_by_me !== null && r.created_by_me !== undefined) c.createdByMe = r.created_by_me === 1;
  if (r.role === 'parent' || r.role === 'contributor') c.role = r.role;
  return c;
};

/** Visible children, oldest book first. */
export function listVisible({ db }: RepoContext): Child[] {
  return db.all<ChildRow>(`SELECT ${COLS} FROM children WHERE hidden_at IS NULL AND ${LISTED} ORDER BY created_at ASC, id ASC`).map(fromRow);
}

export function listHidden({ db }: RepoContext): Child[] {
  return db.all<ChildRow>(`SELECT ${COLS} FROM children WHERE hidden_at IS NOT NULL AND ${LISTED} ORDER BY created_at ASC, id ASC`).map(fromRow);
}

export function get({ db }: RepoContext, id: string): Child | null {
  const r = db.get<ChildRow>(`SELECT ${COLS} FROM children WHERE id = ?`, id);
  return r ? fromRow(r) : null;
}

export function insert(ctx: RepoContext, id: string, input: NewChild): void {
  const now = ctx.now();
  ctx.db.run(
    'INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id, input.name, input.birthday, input.dueDate, input.signsAs, now, now,
  );
}

/** Applies `patch` over the stored row. Returns false when the child does not exist. */
export function update(ctx: RepoContext, id: string, patch: Partial<Omit<Child, 'id'>>): boolean {
  const c = get(ctx, id);
  if (!c) return false;
  const n = { ...c, ...patch };
  ctx.db.run(
    `UPDATE children SET name = ?, birthday = ?, due_date = ?, signs_as = ?, reminders_on = ?, family_can_read = ?, updated_at = ?
     WHERE id = ?`,
    n.name, n.birthday, n.dueDate, n.signsAs, n.remindersOn ? 1 : 0, n.familyCanRead ? 1 : 0, ctx.now(), id,
  );
  return true;
}

/** "Hide this book" (PRD B F2.4): stops prompts for this child; restorable. */
export function hide(ctx: RepoContext, id: string): void {
  const now = ctx.now();
  ctx.db.run('UPDATE children SET hidden_at = ?, updated_at = ? WHERE id = ?', now, now, id);
}

export function unhide(ctx: RepoContext, id: string): void {
  ctx.db.run('UPDATE children SET hidden_at = NULL, updated_at = ? WHERE id = ?', ctx.now(), id);
}
