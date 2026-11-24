/**
 * BL-1954 (PER4-014): the Delete row on a letter speaks its own hint, `book.entryMenu.deleteHint`, not the confirm
 * button's label. The hint is read to VoiceOver only; a sighted person sees the same row as before.
 * Reads the screen source, like letter-top-bar.test.ts: the row's props are the contract, not a rendered tree.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { copy } from '../src/lib/copy';

const src = readFileSync(join(__dirname, '..', 'src', 'app', 'letter', '[id].tsx'), 'utf8');

/** The ListRow that opens the confirm sheet for an editable letter: the one titled with the Delete button and hinted. */
function deleteRowBlock(): string {
  const rows = src.split('<ListRow').slice(1).map((r) => r.split('</ListSection>')[0] ?? '');
  const row = rows.find((r) => r.includes('copy.book.entryMenu.deleteButton') && r.includes('accessibilityHint'));
  return row ?? '';
}

describe('letter Delete row hint (BL-1954)', () => {
  it('the new line exists and differs from the confirm label', () => {
    expect(copy.book.entryMenu.deleteHint.length).toBeGreaterThan(0);
    expect(copy.book.entryMenu.deleteHint).not.toBe(copy.settings.delete.entryConfirm);
  });

  it('the Delete row hint is book.entryMenu.deleteHint', () => {
    expect(deleteRowBlock()).toContain('accessibilityHint={copy.book.entryMenu.deleteHint}');
  });

  it('the Delete row no longer reads the confirm label as its hint', () => {
    expect(deleteRowBlock()).not.toContain('copy.settings.delete.entryConfirm');
  });

  it('the confirm sheet still uses the confirm label for its button', () => {
    expect(src).toContain('confirmLabel={copy.settings.delete.entryConfirm}');
  });
});
