/**
 * The paths whose strings are lock-screen notifications. One definition, read by rules.test.ts (exclamation
 * budget) and rules-drift.test.ts (length, exclamation and coverage), so a new notification family is added
 * here once and every notification rule sees it (NS-48-R28).
 */
export const NOTIFICATION_PATH =
  /^(?:[\w.]*\bnotifications\.|features\.reminders\.(?:neutral|together)\.|features\.photos\.suggestions\.)/;
