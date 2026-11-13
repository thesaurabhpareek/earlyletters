/**
 * NX-30a-R9: the tab titles are single words, and they live here, not in the layout.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '../src';

describe('tab titles', () => {
  it('[NX-30a-R9] tab titles are single words from copy.tabs', () => {
    // Founder, 11 Nov 2026: Home, Book, Me. The keys keep the route names (tonight is index.tsx, you is you.tsx); Family is never a tab.
    expect(Object.keys(en.tabs)).toEqual(['tonight', 'book', 'you']);
    expect(Object.values(en.tabs)).toEqual(['Home', 'Book', 'Me']);
    for (const label of Object.values(en.tabs)) expect(label).toMatch(/^[A-Z][a-z]+$/);
    const layout = readFileSync(join(__dirname, '../../../apps/mobile/src/app/(tabs)/_layout.tsx'), 'utf8');
    for (const label of Object.values(en.tabs)) expect(layout).not.toMatch(new RegExp(`title: ['"\`]${label}['"\`]`));
    expect(layout).toMatch(/title: t\.you,/);
  });
});
