/**
 * The paths whose strings are lock-screen notifications. One definition, read by rules.test.ts (exclamation
 * budget) and rules-drift.test.ts (length, exclamation and coverage), so a new notification family is added
 * here once and every notification rule sees it (NS-48-R28).
 */
/**
 * Pending (NS-46 to NS-49): the `days`, `culture` and `ntc` families do not exist yet. When one lands with
 * lock-screen text, add its path here in the same PR; rules-drift.test.ts fails on an unlisted lookalike.
 * features.billing.reminders is the plan reminder text (billing.en.ts, G-15).
 */
export const NOTIFICATION_PATH =
  /^(?:[\w.]*\bnotifications\.|features\.reminders\.(?:neutral|together)\.|features\.billing\.reminders\.|features\.photos\.suggestions\.)/;
