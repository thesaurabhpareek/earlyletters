/// <reference types="node" />
/**
 * Recently deleted, after the experience pass (EXPERIENCE_PASS S38, S39, S63; package P5): one joined date line, no
 * countdown, and no Erase now in a sync build until the server erase exists. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { monthDay, shelfActions, shelfDateLine, shelfRow } from '../src/components/book/shelf.logic';
import type { Entry } from '../src/lib/store';

const src = (f: string) => readFileSync(join(__dirname, '../src', f), 'utf8');
const d = en.settings.delete;
const deleted = {
  id: 'e1',
  occurredOn: '2026-09-29',
  captureMode: 'spoken',
  transcriptStatus: null,
  finalText: 'Asha, you laughed at the rain today, and then you laughed at the dog, and then at nothing at all.',
  // Noon UTC, so the deleted day is October 13 in every time zone from UTC-11 to UTC+11.
  deletedAt: '2026-10-13T12:00:00.000Z',
} as unknown as Entry & { deletedAt: string };

describe('the shelf card date line (S38)', () => {
  it('joins the two dates in one line: "Deleted October 13. Kept here until November 12."', () => {
    const v = shelfRow(deleted, 'en-US');
    expect(shelfDateLine(v, d)).toBe('Deleted October 13. Kept here until November 12.');
    expect(shelfDateLine(shelfRow(deleted, 'en-GB'), d)).toBe('Deleted 13 October. Kept here until 12 November.');
  });

  it('never reads as already done, and never counts down', () => {
    expect(d.erasesOn).toBe('Kept here until {date}');
    const line = shelfDateLine(shelfRow(deleted, 'en-US'), d);
    expect(line).not.toMatch(/\b(?:erased on|days? left|in \d+ days?|\d+ days)\b/i);
    expect(line).not.toMatch(/[{}]/);
  });

  it('holds every word of the letter for the two-line fade and the accessibility label; the stored letter is never cut', () => {
    const v = shelfRow(deleted, 'en-US');
    expect(v.fullText).toBe(deleted.finalText);
    expect(shelfRow({ ...deleted, transcriptStatus: 'waiting', finalText: '' } as typeof deleted).fullText).toBeNull();
  });

  it('formats a day and month from the device English locale, without the year', () => {
    expect(monthDay('2026-11-12', 'en-US')).toBe('November 12');
    expect(monthDay('2026-11-12', 'en-IN')).toBe('12 November');
    expect(monthDay('2026-11-12', 'fr-FR')).toBe('12 November'); // UI is English only: en-GB house style
  });
});

describe('Erase now (S39, S63)', () => {
  it('is offered on a phone that does not sync', () => {
    expect(shelfActions({ sync: false })).toEqual({ restore: true, eraseNow: true });
  });

  it('is not offered in a sync build without the server erase, and comes back only once it exists', () => {
    expect(shelfActions({ sync: true })).toEqual({ restore: true, eraseNow: false });
    expect(shelfActions({ sync: true, serverErase: false }).eraseNow).toBe(false);
    expect(shelfActions({ sync: true, serverErase: true }).eraseNow).toBe(true);
  });

  it('the shelf reads the build capability and hides the button with it (source)', () => {
    const screen = src('app/settings/recently-deleted.tsx');
    expect(screen).toMatch(/shelfActions\(\{ sync: capabilities\.sync \}\)/);
    expect(screen).toMatch(/\{eraseNow \? <Button variant="destructive"/);
  });
});

describe('the shelf screen (S38, source)', () => {
  const screen = src('app/settings/recently-deleted.tsx');

  it('fills {child} in "Back in Asha\'s book." and carries "Open"; after Erase now, "Letter erased." with no action', () => {
    expect(d.restoredToast).toBe("Back in {child}'s book.");
    expect(screen).toMatch(/fill\(d\.restoredToast, \{ child: /);
    expect(screen).toMatch(/action: \{ label: d\.openButton/);
    expect(screen).toMatch(/toast\.show\(\{ message: d\.erasedToast \}\)/);
  });

  it('shows the person\'s words in the letter face with the fade, never an ellipsis, and no repeated heading when empty', () => {
    expect(screen).toMatch(/<ExcerptFade text=\{words\} lines=\{2\} variant="letterBody"/);
    expect(screen).not.toMatch(/numberOfLines=/);
    expect(screen).toMatch(/<StateScreen kind="empty" art="page" title=\{d\.shelfEmpty\} \/>/);
    expect(screen).not.toMatch(/<EmptyState title=\{d\.recentlyDeleted\}/);
  });

  it('the confirm sheets have no header Close: "Keep it" and a swipe down are the ways out (S35)', () => {
    expect(src('components/book/confirm-sheet.tsx')).toMatch(/<Sheet open=\{open\} onClose=\{onKeep\} title=\{title\} hideClose>/);
  });
});
