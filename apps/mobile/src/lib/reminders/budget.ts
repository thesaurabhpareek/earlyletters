/**
 * The notification budget (NS-32, CR-69 A1, E13, CL-115): one file for the class registry and the chooser. Pure
 * TypeScript, no React Native, nothing stored, nothing sent.
 *
 * - 60 pending local notifications in TOTAL (`TOTAL_MAX`). iOS keeps 64; we plan 60. Plan notices (at most
 *   `PLAN_MAX` = 4, owned by `payments`) are kept first INSIDE the 60, and the budgeted notes give way. This replaces
 *   the old 60 plus 4.
 * - At most one budgeted notification a local day: `chooseOnePerDay` keeps the highest rank. Ranks: a day the parent
 *   typed 1, birthday 2, `libraryDay` 3 (a ranked source inside the `typedDay` group, NOT a class), month 4, evening 5.
 * - Every class has a registry row (group, priority, owner). There is no `occasion` class, by design (NS-32-R5).
 *   A class added to a group cannot raise the total (`addNotificationClass`).
 */

/** iOS keeps at most this many pending local notifications per app. Informational: we plan `TOTAL_MAX`. */
export const IOS_PENDING_LIMIT = 64;

/** The most pending notifications of every class together, plan notices included. */
export const TOTAL_MAX = 60;

/** The most plan notices (trial and renewal), counted inside `TOTAL_MAX`. Equals `MAX_PLAN_NOTIFICATIONS` in lib/billing. */
export const PLAN_MAX = 4;

export const CLASS_IDS = ['plan', 'typedDay', 'birthday', 'monthAge', 'evening'] as const;
export type NotificationClassId = (typeof CLASS_IDS)[number];

/** `plan` is outside the one-a-day budget and goes first; `budgeted` classes share one note a day. */
export type NotificationGroup = 'plan' | 'budgeted';

export interface NotificationClass {
  id: NotificationClassId;
  group: NotificationGroup;
  /** Lower wins. 0 for plan notices (never chosen against, kept first). */
  priority: number;
  /** The seat that owns the class's code. */
  owner: 'payments' | 'mobile';
}

export const NOTIFICATION_CLASSES: readonly NotificationClass[] = [
  { id: 'plan', group: 'plan', priority: 0, owner: 'payments' },
  { id: 'typedDay', group: 'budgeted', priority: 1, owner: 'mobile' },
  { id: 'birthday', group: 'budgeted', priority: 2, owner: 'mobile' },
  { id: 'monthAge', group: 'budgeted', priority: 4, owner: 'mobile' },
  { id: 'evening', group: 'budgeted', priority: 5, owner: 'mobile' },
];

/**
 * What a budgeted note comes from. `libraryDay` is a ranked source inside the `typedDay` group (NS-46-R29), so it has a
 * rank and no registry row. Ranks are the priorities above, with 3 between birthday and month.
 */
export const SOURCE_RANK = { typedDay: 1, birthday: 2, libraryDay: 3, monthAge: 4, evening: 5 } as const;
export type NoteSource = keyof typeof SOURCE_RANK;

/** The registry row for a class; an unregistered id throws, so a class cannot slip in unlisted (NS-32-R2). */
export function classRow(id: string, classes: readonly NotificationClass[] = NOTIFICATION_CLASSES): NotificationClass {
  const row = classes.find((c) => c.id === id);
  if (!row) throw new Error(`notification class ${id} is not in the registry`);
  return row;
}

/** The class a source belongs to (`libraryDay` rides on `typedDay`). */
export function classOfSource(source: NoteSource): NotificationClassId {
  return source === 'libraryDay' ? 'typedDay' : source;
}

export interface BudgetCandidate {
  source: NoteSource;
  /** Local calendar date, YYYY-MM-DD: the one-a-day key. */
  date: string;
}

/**
 * At most one note a local day: for each date the candidate with the best (lowest) rank. Within one rank the earlier
 * candidate in the input wins, so the caller's order (for example by id) decides a tie and the result is stable.
 * A source whose class is not registered throws (NS-32-R2). Output is ordered by date.
 */
export function chooseOnePerDay<T extends BudgetCandidate>(candidates: readonly T[], classes: readonly NotificationClass[] = NOTIFICATION_CLASSES): T[] {
  const best = new Map<string, T>();
  for (const c of candidates) {
    classRow(classOfSource(c.source), classes);
    const held = best.get(c.date);
    if (!held || SOURCE_RANK[c.source] < SOURCE_RANK[held.source]) best.set(c.date, c);
  }
  return [...best.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, v]) => v);
}

/**
 * How many budgeted notes may stay pending when `planPending` plan notices are pending. Plan notices come first, up to
 * `PLAN_MAX`, and the rest of the `TOTAL_MAX` is the budgeted notes' (NS-32-R4b, R7).
 */
export function budgetedSlots(planPending: number): number {
  const plan = Math.max(0, Math.min(Math.floor(planPending) || 0, PLAN_MAX));
  return TOTAL_MAX - plan;
}

/**
 * The most that can be pending with these classes: one total for every group, however many classes there are. A group
 * with no class adds nothing; the total never exceeds `TOTAL_MAX`.
 */
export function pendingCeiling(classes: readonly NotificationClass[] = NOTIFICATION_CLASSES): number {
  return classes.length === 0 ? 0 : TOTAL_MAX;
}

/** The registry with one more class. It shares its group's slots; an unknown group or a repeated id throws (NS-32-R15). */
export function addNotificationClass(classes: readonly NotificationClass[], next: NotificationClass): readonly NotificationClass[] {
  if (classes.some((c) => c.id === next.id)) throw new Error(`notification class ${next.id} is already registered`);
  if (!classes.some((c) => c.group === next.group)) throw new Error(`notification class ${next.id} names group ${next.group}: a class cannot raise the total`);
  return [...classes, next];
}
