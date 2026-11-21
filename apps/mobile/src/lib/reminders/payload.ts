import { REMINDER_CATEGORY, REMINDER_INTERRUPTION_LEVEL } from './categories';
import type { PlannedNotification } from './planner';

export const REMINDER_SOURCE = 'scribe.reminders';

/**
 * The content of one scheduled local notification. Split out of scheduler.ts so a test can call it without the
 * native modules (NS-48-R31). The payload is enums only: no key, variant, day, name or text of a letter.
 */
export function reminderContent(p: PlannedNotification): {
  title: string;
  body: string;
  data: { source: string; kind: string };
  sound: false;
  categoryIdentifier: typeof REMINDER_CATEGORY;
  interruptionLevel: typeof REMINDER_INTERRUPTION_LEVEL;
} {
  return {
    title: p.title,
    body: p.body,
    data: { source: REMINDER_SOURCE, kind: p.kind },
    // Silent: the evening nudge often lands near a sleeping baby.
    sound: false,
    // Hidden-preview placeholder lives on the category; level `active` only (NS-32-R10, NS-13-R20).
    categoryIdentifier: REMINDER_CATEGORY,
    interruptionLevel: REMINDER_INTERRUPTION_LEVEL,
  };
}
