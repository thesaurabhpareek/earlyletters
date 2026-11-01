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

  it('[F09-REQ-003] a letter dated to a month only shows that month, never the stored day', () => {
    const asha = { birthday: '2026-03-13' };
    const month = { ...base, id: 'e4', occurredOn: '2026-06-13', occurredPrecision: 'month' as const };
    expect(shelfRow(month, 'en-US', asha).letterDate).toBe('Sometime in Month 3');
    expect(shelfRow({ ...month, occurredOn: '2026-03-12' }, 'en-US', asha).letterDate).toBe('Before You');
    expect(shelfRow({ ...base, id: 'e5' }, 'en-US', asha).letterDate).toBe('September 29, 2026');
  });
});
