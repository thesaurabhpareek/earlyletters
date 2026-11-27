/**
 * The phone-is-full state at Finish (words only). The recording is kept, so the copy reassures and never offers to
 * let it go. The general content rules reach these keys through ADDED in test/support/copy-surfaces.ts.
 */
import { describe, expect, it } from 'vitest';
import { en } from '../src/strings.en';

describe('listen.phoneFull', () => {
  const p = en.listen.phoneFull;
  it('has a title, a body and a keep button', () => {
    expect(p.title).toBe('This phone is full');
    expect(p.body.length).toBeGreaterThan(0);
    expect(p.keep.length).toBeLessThanOrEqual(22);
  });
  it('says the recording is kept and uses only parent words', () => {
    expect(p.body).toMatch(/kept/);
    expect(`${p.title} ${p.body} ${p.keep}`).not.toMatch(/\b(take|draft|entry|pack|transcript|let it go|lost?|AI)\b/i);
  });
});
