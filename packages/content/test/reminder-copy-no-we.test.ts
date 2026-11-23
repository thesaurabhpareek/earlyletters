// [BL-474] No "we" or "our" in reminder and notification copy. The council ruled that a lock-screen line speaks to
// the parent about the book, not as a "we" making a promise (VOICE.md, "How to write a notification").
// Scope is the one definition of lock-screen text in test/support/notification-scope.ts, so a new family is
// covered when it is listed there. The ruled exceptions list starts empty: add a key only with a recorded ruling.
import { describe, expect, it } from 'vitest';
import { en, features } from '../src';
import { NOTIFICATION_PATH } from './support/notification-scope';

type Leaf = { path: string; text: string };
function leaves(value: unknown, path = ''): Leaf[] {
  if (typeof value === 'string') return [{ path, text: value }];
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, `${path}[${i}]`));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, path ? `${path}.${k}` : k));
  }
  return [];
}

/** Ruled exceptions: leaf paths allowed to say "we". Empty on purpose (BL-474). */
export const REMINDER_WE_RULED: ReadonlySet<string> = new Set<string>([]);

// CMO-18 ruling: the first-person words "we" and "our" only. \bwe\b already covers we'll, we're, we've and we'd.
// "us" and "ours" are not banned: "let us know" style lines are not a we making a promise.
const WE = /\b(?:we|our)\b/i;

export function weOffenders(all: Leaf[], ruled: ReadonlySet<string> = REMINDER_WE_RULED): string[] {
  return all
    .filter((l) => NOTIFICATION_PATH.test(l.path) && !ruled.has(l.path) && WE.test(l.text))
    .map((l) => `${l.path}: ${l.text}`);
}

const ALL: Leaf[] = [...leaves(en, 'en'), ...leaves(features, 'features')].map((l) => ({
  ...l,
  path: l.path.replace(/^en\./, ''),
}));

describe('[BL-474] reminder and notification copy never says "we"', () => {
  it('scans real notification strings (the scope is not empty)', () => {
    const scanned = ALL.filter((l) => NOTIFICATION_PATH.test(l.path));
    expect(scanned.length).toBeGreaterThan(30);
    expect(scanned.some((l) => l.path.startsWith('features.reminders.neutral.evening'))).toBe(true);
    expect(scanned.some((l) => l.path.startsWith('notifications.evening'))).toBe(true);
  });

  it('has no "we" or "our" in today\'s reminder and notification copy', () => {
    expect(weOffenders(ALL)).toEqual([]);
  });

  it('goes red when "we will keep it" is planted in a reminder string', () => {
    const planted: Leaf[] = [
      { path: 'features.reminders.neutral.evening[1].body', text: 'Say it out loud and we will keep it.' },
    ];
    expect(weOffenders(planted)).toHaveLength(1);
    expect(weOffenders([{ path: 'notifications.evening[1].body', text: "We'll keep it safe." }])).toHaveLength(1);
    expect(weOffenders([{ path: 'notifications.evening[1].body', text: 'Our book is open.' }])).toHaveLength(1);
  });

  it('does not flag a line with no we or our, or the word "ours" (the ruling names we and our only)', () => {
    const quiet: Leaf[] = [
      { path: 'notifications.evening[1].body', text: 'How did it go?' },
      { path: 'notifications.evening[2].body', text: 'The book is ours to open.' },
    ];
    expect(weOffenders(quiet)).toEqual([]);
  });

  it('starts with no ruled exceptions', () => {
    expect([...REMINDER_WE_RULED]).toEqual([]);
  });
});
