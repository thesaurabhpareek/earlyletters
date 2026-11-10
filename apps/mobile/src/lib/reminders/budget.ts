/**
 * The notification budget: one place for the numbers every local notification class shares, and the registry each
 * class joins (NX-39 v2 R26, R27, R61; BL-869). Pure TypeScript, no React Native.
 *
 * Nothing here is a new number. Each value below was already in the code:
 *  - iOS keeps 64 pending local notifications; the planner stays under it at 60 (planner.ts, `maxNotifications`);
 *  - the plan reminders (lib/billing) hold at most 4 (`MAX_PLAN_NOTIFICATIONS`), so the two groups together are the 64;
 *  - reminders stay quiet from 21:30 to 07:00 (K6; `DEFAULT_WINDOW` in planner.ts is built from this).
 *
 * The shared cap is not a number yet. The code has a cadence (off, weekly, fewTimes, everyEvening) and no numeric
 * weekly cap, and the default stays the cadence the parent chose. The founder sets the number (NX-39 F6); until a
 * decision replaces `weeklyCount`, it is null and nothing counts against it.
 *
 * Every class registers here. A class belongs to a group, and a group owns its pending slots: a new class shares its
 * group's slots, so adding one cannot raise the total (`addNotificationClass` throws on a class that would bring its
 * own). No class is derived from the library (R27): the type says `false`, and the registry refuses `true`.
 */

/** iOS keeps at most this many pending local notifications per app. */
export const IOS_PENDING_LIMIT = 64;

/** What the evening, month, birthday and (later) occasion notes share; the planner's default `maxNotifications`. */
export const SHARED_PENDING_CEILING = 60;

/** The plan reminders' own slots (lib/billing/plan-reminders.logic.ts `MAX_PLAN_NOTIFICATIONS`, tested equal). */
export const PLAN_PENDING_CEILING = 4;

/** Local minutes of the day. Nothing fires from `startMinutes` until `endMinutes` the next morning. */
export const QUIET_WINDOW = { startMinutes: 21 * 60 + 30, endMinutes: 7 * 60 } as const;

/** The shared cap on how many reminders a week may bring. Not decided: the founder sets it (NX-39 F6). */
export const SHARED_CAP = {
  /** null: no numeric cap; the cadence the parent chose is the cap. */
  weeklyCount: null as number | null,
  defaultIs: 'parent-cadence',
  decidedBy: 'NX-39 F6 (founder)',
} as const;

export type NotificationClassId = 'evening' | 'monthAge' | 'birthday' | 'plan' | 'occasion';
export type NotificationGroup = 'reminders' | 'plan';

export interface NotificationClass {
  id: NotificationClassId;
  /** Which group's slots the class shares. */
  group: NotificationGroup;
  /** `planned`: registered and not built or not switched on. */
  status: 'live' | 'planned';
  phase: 'built' | 'P4a';
  /** Always false (R27): no notification is derived from the photo library. */
  derivedFromLibrary: false;
}

export const NOTIFICATION_CLASSES: readonly NotificationClass[] = [
  { id: 'evening', group: 'reminders', status: 'live', phase: 'built', derivedFromLibrary: false },
  { id: 'monthAge', group: 'reminders', status: 'live', phase: 'built', derivedFromLibrary: false },
  { id: 'birthday', group: 'reminders', status: 'live', phase: 'built', derivedFromLibrary: false },
  { id: 'plan', group: 'plan', status: 'live', phase: 'built', derivedFromLibrary: false },
  // P4a: a day the parent typed. Joins the reminders group and counts against its 60; off until EXPO_PUBLIC_OCCASIONS.
  { id: 'occasion', group: 'reminders', status: 'planned', phase: 'P4a', derivedFromLibrary: false },
];

const GROUP_CEILING: Readonly<Record<NotificationGroup, number>> = { reminders: SHARED_PENDING_CEILING, plan: PLAN_PENDING_CEILING };

/**
 * The most pending notifications the registered classes can hold: each group that has a class counts once, whatever
 * the number of classes in it. With a group given, that group's slots only.
 */
export function pendingCeiling(classes: readonly NotificationClass[], group?: NotificationGroup): number {
  const groups = new Set(classes.map((c) => c.group));
  return [...groups].filter((g) => group === undefined || g === group).reduce((sum, g) => sum + (GROUP_CEILING[g] ?? Number.POSITIVE_INFINITY), 0);
}

/** The registry with one more class. It shares its group's slots; a class for a group nobody owns would raise the total. */
export function addNotificationClass(classes: readonly NotificationClass[], next: NotificationClass): readonly NotificationClass[] {
  if (classes.some((c) => c.id === next.id)) throw new Error(`notification class ${next.id} is already registered`);
  if ((next.derivedFromLibrary as boolean) !== false) throw new Error(`notification class ${next.id} is derived from the library (NX-39 R27)`);
  if (!classes.some((c) => c.group === next.group)) throw new Error(`notification class ${next.id} names group ${next.group}: a class cannot raise the total`);
  return [...classes, next];
}
