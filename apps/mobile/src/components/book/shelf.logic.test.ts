import { describe, expect, it } from 'vitest';
import { firstWords, shelfRow } from './shelf.logic';
import type { Entry } from '@/lib/store';

const base = {
  occurredOn: '2026-09-29',
  captureMode: 'spoken',
  transcriptStatus: null,
  finalText: 'Asha, you laughed at the rain today.',
  deletedAt: '2026-10-03T22:30:00.000Z',
} as unknown as Entry & { deletedAt: string };

describe('shelf rows', () => {
  it('[D-085] shows the first words, the letter date, the deleted day and the erase day 30 days on', () => {
    const v = shelfRow({ ...base, id: 'e1' }, 'en-US');
    expect(v.excerpt).toBe('Asha, you laughed at the rain today.');
    expect(v.letterDate).toBe('September 29, 2026');
    expect(v.erasesDate.endsWith('2026')).toBe(true);
    expect(v.erasesDate).toMatch(/^(November 2|November 3), 2026$/); // 30 days after 3 Oct, in any time zone
  });

  it('cuts long words at a word boundary and never shows a countdown', () => {
    const long = 'Asha laughed '.repeat(30);
    const out = firstWords(long, 40);
    expect(out.length).toBeLessThanOrEqual(40);
    expect(out.endsWith(' ')).toBe(false);
    expect(out).toMatch(/laughed$|Asha$/);
  });

  it('a letter waiting for its words, or a quiet recording, has no excerpt', () => {
    expect(shelfRow({ ...base, id: 'e2', transcriptStatus: 'waiting', finalText: '' }, 'en-US').excerpt).toBeNull();
    expect(shelfRow({ ...base, id: 'e3', finalText: '  ' }, 'en-US').words).toBe('nobodySpoke');
  });
});
