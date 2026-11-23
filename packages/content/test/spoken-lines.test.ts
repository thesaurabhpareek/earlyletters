/**
 * BL-1827: two spoken lines. [PER4-014] the Delete row hint says the result, not the label;
 * [PER4-019] with a screen reader on, the ready line says what to double tap.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '../src';

describe('spoken lines (BL-1827)', () => {
  it('[PER4-014] the Delete row hint states the result, not the label', () => {
    const hint = en.book.entryMenu.deleteHint;
    expect(hint).toBe('Asks first. It waits in Recently deleted for 30 days.');
    expect(hint).not.toBe(en.book.entryMenu.deleteButton);
    expect(hint).not.toBe(en.settings.delete.entryConfirm);
  });

  it('[PER4-014] the 30 days in the hint is the shelf length the build uses', () => {
    const src = readFileSync(join(__dirname, '../../../apps/mobile/src/lib/shelf-days.ts'), 'utf8');
    expect(src).toMatch(/SHELF_DAYS = 30\b/);
    expect(en.book.entryMenu.deleteHint).toContain('30 days');
  });

  it('[PER4-019] the screen-reader ready line names the control to double tap', () => {
    expect(en.listen.ready.hintScreenReader).toBe('Double tap Start recording and talk.');
    expect(en.listen.ready.hintScreenReader).toContain(en.listen.ready.startA11y);
  });

  it('[PER4-019] the sighted ready line still names the red circle, and only that line does', () => {
    expect(en.listen.ready.hint).toBe('Tap the red circle and talk.');
    expect(en.listen.ready.hintScreenReader).not.toMatch(/red circle/i);
  });
});
