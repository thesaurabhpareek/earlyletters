/**
 * Account deletion, pure logic (no React Native): what happens to each book,
 * the two-step flow, the typed confirmation and the server status.
 * Rules: DELETION_AND_EXPORT_SPEC 2.3 and 2.6.1 (equals rule: a book with a
 * co-parent stays with them; a sole parent's book goes with the account),
 * PRD C-REQ-019 (export first, subscription notice, 30-day undo, type to confirm).
 */
import { accountDeletionCopy as c } from './copy';

/** A book as `sync_books()` describes it (20261004100000_sync_engine.sql, section 8b). */
export interface SyncBook {
  id: string;
  name: string;
  role: 'parent' | 'contributor';
  members: { role: 'parent' | 'contributor'; is_me: boolean; signs_as: string | null }[] | null;
}

export type BookImpact =
  | { kind: 'stays'; childId: string; child: string; coParent: string; myLetters: number }
  | { kind: 'deleted'; childId: string; child: string; myLetters: number; family: number }
  | { kind: 'contributor'; childId: string; child: string; myLetters: number };

export function bookImpacts(books: SyncBook[], myLetters: (childId: string) => number): BookImpact[] {
  return books.map((b) => {
    const members = b.members ?? [];
    const n = Math.max(0, myLetters(b.id));
    if (b.role === 'contributor') return { kind: 'contributor', childId: b.id, child: b.name, myLetters: n };
    const otherParent = members.find((m) => m.role === 'parent' && !m.is_me);
    if (otherParent) {
      const coParent = otherParent.signs_as?.trim() ? otherParent.signs_as.trim() : c.what.coParentFallback;
      return { kind: 'stays', childId: b.id, child: b.name, coParent, myLetters: n };
    }
    return { kind: 'deleted', childId: b.id, child: b.name, myLetters: n, family: members.filter((m) => m.role === 'contributor').length };
  });
}

const fillIn = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (m, k) => (k in v ? String(v[k]) : m));

/** The plain lines of "What happens", one or two per book, then the copies note. */
export function impactLines(impacts: BookImpact[]): string[] {
  if (!impacts.length) return [c.what.noBooks];
  const lines: string[] = [];
  for (const i of impacts) {
    if (i.kind === 'stays') {
      const t = i.myLetters === 0 ? c.what.staysNone : i.myLetters === 1 ? c.what.staysOne : c.what.staysMany;
      lines.push(fillIn(t, { child: i.child, coParent: i.coParent, count: i.myLetters }));
    } else if (i.kind === 'deleted') {
      const t = i.myLetters === 0 ? c.what.deletedNone : i.myLetters === 1 ? c.what.deletedOne : c.what.deletedMany;
      lines.push(fillIn(t, { child: i.child, count: i.myLetters }));
      if (i.family > 0) lines.push(c.what.deletedFamily);
    } else {
      lines.push(fillIn(c.what.contributor, { child: i.child }));
    }
  }
  lines.push(c.what.copies);
  return lines;
}

/** The typed confirmation: the word, any case, spaces around it ignored. */
export function confirmationMatches(typed: string): boolean {
  return typed.trim().toLowerCase() === c.confirm.typeWord;
}

export const GRACE_DAYS = 30;

/** When a request made now would be carried out (the server sets the real value). */
export function expectedDeletionDate(now: Date): string {
  return new Date(now.getTime() + GRACE_DAYS * 86_400_000).toISOString();
}

/** Local calendar day (YYYY-MM-DD) of an instant, for lib/dates longDate. */
export function localDay(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export type ServerStatus =
  | { state: 'none' }
  | { state: 'scheduled' | 'held'; requestId: string; scheduledFor: string }
  | { state: 'executing'; requestId: string };

/** The caller's open account request (deletion_requests is readable for your own rows only). */
export function parseStatus(rows: unknown): ServerStatus {
  const r = Array.isArray(rows) ? (rows[0] as { id?: unknown; status?: unknown; scheduled_for?: unknown } | undefined) : undefined;
  if (!r || typeof r.id !== 'string') return { state: 'none' };
  if (r.status === 'executing') return { state: 'executing', requestId: r.id };
  if ((r.status === 'scheduled' || r.status === 'held') && typeof r.scheduled_for === 'string') {
    return { state: r.status, requestId: r.id, scheduledFor: r.scheduled_for };
  }
  return { state: 'none' };
}

/**
 * The screen's steps. `review` (what happens, export, subscription) then
 * `confirm` (typed word) then the request; `scheduled` shows the date and
 * Cancel; `executing` only explains.
 */
export type Step = 'loading' | 'review' | 'confirm' | 'scheduled' | 'executing';

export function stepFor(status: ServerStatus | null, wanted: 'review' | 'confirm'): Step {
  if (status === null) return 'loading';
  if (status.state === 'executing') return 'executing';
  if (status.state === 'scheduled' || status.state === 'held') return 'scheduled';
  return wanted;
}

/** Whether to show the subscription step (DATA-REQ-022): any Plus that will renew, or unknown. */
export function showSubscriptionNotice(plan: { status: string; willAutoRenew: boolean | null }): boolean {
  if (plan.status === 'none' || plan.status === 'expired' || plan.status === 'revoked' || plan.status === 'refunded') return false;
  return plan.willAutoRenew !== false;
}
