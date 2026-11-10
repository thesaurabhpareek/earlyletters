/// <reference types="node" />
/**
 * QE-02 (S3, QE hunt of 8 Nov 2026): after a fix was put back, "Put back. Undo" stayed on the sheet through Change
 * words and after Done. Undo there changed the fixes under the person's own words, so nothing on screen moved. Now the
 * line shows only while the letter with its fixes is on the sheet, and Change words clears it. Pure rule here; the
 * screen's use of it is checked in its source (Node cannot load React Native). Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { putBackNoteShows } from '../src/components/capture/review-view.logic';

const screen = readFileSync(join(__dirname, '..', 'src', 'app', 'review.tsx'), 'utf8');

describe('putBackNoteShows', () => {
  it('shows after a put back, on the letter with its fixes', () => {
    expect(putBackNoteShows({ restored: true, editing: false, userText: null })).toBe(true);
  });

  it('never while changing the words', () => {
    expect(putBackNoteShows({ restored: true, editing: true, userText: null })).toBe(false);
    expect(putBackNoteShows({ restored: true, editing: true, userText: 'Asha, tonight you laughed at the rain.' })).toBe(false);
  });

  it('never once the words are the person\'s own, including an empty page', () => {
    expect(putBackNoteShows({ restored: true, editing: false, userText: 'Asha, tonight you laughed at the rain.' })).toBe(false);
    expect(putBackNoteShows({ restored: true, editing: false, userText: '' })).toBe(false);
  });

  it('never with nothing put back', () => {
    for (const editing of [true, false]) for (const userText of [null, 'Asha']) expect(putBackNoteShows({ restored: false, editing, userText })).toBe(false);
  });
});

describe('Review wires it', () => {
  it('the line is drawn through the rule, not from `restored` alone', () => {
    expect(screen).toMatch(/\{putBackNoteShows\(\{ restored: !!restored, editing, userText \}\) && \(\s*<View[^>]*>\s*<Text[^>]*>\{pendingCopy\.review\.putBack\}<\/Text>/);
    expect(screen).not.toMatch(/\{restored && \(/);
  });

  it('Change words clears the put-back line before editing starts, so it does not return after Done', () => {
    const at = screen.indexOf('testID="review.edit"');
    const press = screen.slice(at, screen.indexOf('</Button>', at));
    expect(press).toMatch(/setRestored\(null\);\s*setEditing\(true\);/);
  });
});
