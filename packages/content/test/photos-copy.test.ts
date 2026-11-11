// NS-01 (photo with a letter): the words for the photo surfaces. The general rules (dashes, curly quotes, ellipsis,
// emoji) are enforced for every `features` leaf by rules.test.ts; these are the photo-specific ones.
import { describe, expect, it } from 'vitest';
import { photosCopy } from '../src';

function leaves(o: unknown, path = 'photos'): { path: string; text: string }[] {
  if (typeof o === 'string') return [{ path, text: o }];
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}
const ALL = leaves(photosCopy);

describe('[NS-01-R25] the photo strings obey the content rules', () => {
  it('[NS-01-R25] has no dash, curly quote, ellipsis character or emoji', () => {
    for (const l of ALL) {
      expect(l.text, l.path).not.toMatch(/[–—‘’“”…]/);
      expect(l.text, l.path).not.toMatch(/\p{Extended_Pictographic}/u);
    }
  });
  it('[NS-01-R25] never says memory, moment or album, and never implies a machine writes', () => {
    for (const l of ALL) {
      expect(l.text, l.path).not.toMatch(/\b(memory|memories|moment|moments|album)\b/i);
      expect(l.text, l.path).not.toMatch(/\b(AI|auto|automatic|smart|generated|suggest\w*|caption\w*|describe\w*)\b/i);
    }
  });
  it('[NS-01-R25] uses {child} and never a name, and only the placeholders it fills', () => {
    for (const l of ALL) for (const m of l.text.matchAll(/\{(\w+)\}/g)) expect(['child', 'date']).toContain(m[1]);
    expect(photosCopy.capture.ready).toContain('{child}');
  });
  it('[NS-01-R25] keeps the Home button to 22 characters or fewer and names a photo', () => {
    expect(photosCopy.capture.startButton.length).toBeLessThanOrEqual(22);
    expect(photosCopy.capture.startButton).toMatch(/photo/i);
  });
  it('[NS-01-R9] the fixed label is exactly "Photo with this letter"', () => {
    expect(photosCopy.a11y.photoWithLetter).toBe('Photo with this letter');
  });
  it('[NS-01-R11] no lens string counts pictures or carries a digit', () => {
    for (const l of leaves(photosCopy.book.lens, 'lens')) expect(l.text, l.path).not.toMatch(/\d|\bphotos? (this|each)\b/i);
    expect(photosCopy.book.photos.a11yTile).not.toMatch(/\d|\bof\b \w+ photos/i);
  });
  it('[NS-01-R23] no string offers the camera', () => {
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/take a photo now|camera/i);
  });
  it('[NS-01-R24] the lens has no "add" string; adding lives on the letter page only', () => {
    for (const l of leaves(photosCopy.book.lens, 'lens')) expect(l.text, l.path).not.toMatch(/\badd\b/i);
    expect(photosCopy.book.letter.addPhoto).toMatch(/this letter/);
  });
});
