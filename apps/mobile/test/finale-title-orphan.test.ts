// BL-419 (council ruling): the finale heading never leaves one word alone on the last line.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { joinLastTwoWords } from '../src/components/onboarding/finale-title.logic';

const N = String.fromCharCode(0xa0);

describe('[BL-419] finale title orphan', () => {
  it('joins the last two words with a no-break space', () => {
    expect(joinLastTwoWords('The book is open.')).toBe(`The book is${N}open.`);
  });
  it('leaves one word, empty and already-joined text alone', () => {
    expect(joinLastTwoWords('Open')).toBe('Open');
    expect(joinLastTwoWords('')).toBe('');
    expect(joinLastTwoWords(`a${N}b`)).toBe(`a${N}b`);
  });
  it('only the last gap changes; ASCII source', () => {
    const src = readFileSync(join(__dirname, '../src/components/onboarding/finale-title.logic.ts'), 'utf8');
    expect(/[^\x00-\x7f]/.test(src)).toBe(false);
    expect(joinLastTwoWords('a b c d')).toBe(`a b c${N}d`);
  });
  it('the onboarding finish title renders through it and stays hero', () => {
    const s = readFileSync(join(__dirname, '../src/app/onboarding.tsx'), 'utf8');
    expect(s).toContain('joinLastTwoWords(o.finish.title)');
    expect(s).toMatch(/variant="hero" asHeading=\{1\} className="text-center">\s*\{joinLastTwoWords/);
  });
});
