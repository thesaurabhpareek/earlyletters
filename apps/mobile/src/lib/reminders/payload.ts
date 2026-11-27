import { REMINDER_CATEGORY, REMINDER_INTERRUPTION_LEVEL } from './categories';
import { reminderCopy } from './copy';
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

const NEUTRAL = reminderCopy.neutral;
/** Every value a name-free text can take: `{weekday}` is the one blank a neutral line has, filled with each weekday. */
const filled = (text: string): string[] => (text.includes('{weekday}') ? reminderCopy.weekdays.map((w) => text.replace('{weekday}', w)) : [text]);

/** Builds a set on first use and keeps it, so a missing copy key fails the first check, not the import of the scheduler. */
function memoSet(build: () => string[]): () => ReadonlySet<string> {
  let set: ReadonlySet<string> | undefined;
  return () => (set ??= new Set(build()));
}

/**
 * The `publicTitleOk` allowlist (BL-1009, NS-47-R13): with names off (App lock on included), a lock-screen title is one
 * of these fixed, name-free titles and nothing else. Hand-listed from the neutral copy, never read from a planned note.
 * A ticked day's own name (a `publicTitleOk` day row, NS-46-R36) joins this list only when the planner can title a note
 * with it (BL-1012); today no note does.
 */
export const publicTitles = memoSet(() =>
  [...NEUTRAL.evening.map((v) => v.title), NEUTRAL.monthOpen.title, NEUTRAL.birthday.title, NEUTRAL.birthdays.title, NEUTRAL.typedDay.title, NEUTRAL.libraryDay.title].flatMap(filled),
);
/** The name-free bodies, as for titles: what a body may be with names off. */
export const publicBodies = memoSet(() =>
  [...NEUTRAL.evening.map((v) => v.body), NEUTRAL.lockBody, NEUTRAL.monthOpen.body, NEUTRAL.birthday.body, NEUTRAL.birthdays.body, NEUTRAL.typedDay.body, NEUTRAL.libraryDay.body].flatMap(filled),
);

/** May this title show on a lock screen with names off? */
export const publicTitleOk = (title: string): boolean => publicTitles().has(title);
/** May this body show on a lock screen with names off? */
export const publicBodyOk = (body: string): boolean => publicBodies().has(body);

/** Every kind's stand-in title with names off: the one fixed neutral title, read at first use like the allowlists. */
const fallbackTitle = (): string => NEUTRAL.libraryDay.title;

/**
 * The last check before a note reaches iOS (BL-1009): with names off, a title or body outside the allowlists becomes the
 * neutral line, whatever the planner produced. With names on the note is unchanged. The planner already plans name-free
 * words with names off, so this changes nothing today; it keeps a future copy or planner change from putting a name on
 * a lock screen. The text is compared, never logged or kept.
 */
export function lockScreenSafe(p: PlannedNotification, namesOn: boolean): PlannedNotification {
  if (namesOn || (publicTitleOk(p.title) && publicBodyOk(p.body))) return p;
  return { ...p, title: publicTitleOk(p.title) ? p.title : fallbackTitle(), body: publicBodyOk(p.body) ? p.body : NEUTRAL.lockBody };
}

/**
 * Where a tap on one of our reminders opens the app: the evening nudge, a typed day and a ticked day on Tonight (Home
 * shows the typed day's words there, NS-18-R1, and the day slip is a ticked day's one landing, RV-6), the month and
 * birthday notes on the book. Pure, so the live listener and the cold-start
 * read share one rule. Returns null for anything that is not ours.
 */
export function routeForReminder(data: unknown): '/' | '/book' | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as { source?: unknown; kind?: unknown };
  if (d.source !== REMINDER_SOURCE) return null;
  return d.kind === 'evening' || d.kind === 'typedDay' || d.kind === 'libraryDay' ? '/' : '/book';
}
