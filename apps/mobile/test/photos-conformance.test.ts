/**
 * BL-1445: the photo frame reads the design tokens (conformance F-12, F-15 to F-20, F-25, F-26). Each test names the mutant
 * that must fail it. Source scans follow the repo's convention for components that cannot render in vitest.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { photosCopy } from '@scribe/content';
import { LETTER_PICTURE_AX_MAX_PT, LETTER_PICTURE_COLUMN_RATIO, LETTER_PICTURE_WINDOW_RATIO, THUMB_AX_MAX_HEIGHT_PT, THUMB_MAX_HEIGHT_PT, letterPictureSize, lensThumbSize } from '../src/lib/photos/surface';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

describe('[BL-1445] frame and sizes come from tokens', () => {
  it('the frame is stroke.control wide in mediaFrame; no raw border width or c.line (mutant: borderWidth: 1)', () => {
    const f = read('components/photos/photo-frame.tsx');
    expect(f).toMatch(/borderWidth: tokens\.stroke\.control/);
    expect(f).toMatch(/borderColor: c\.mediaFrame/);
    expect(f).not.toMatch(/borderWidth: \d/);
    expect(f).not.toMatch(/c\.line/);
    expect(tokens.stroke.control).toBe(1);
  });
  it('every picture size is the token, and the letter picture AX cap is 88 not 120 (mutant: 120 back in surface.ts)', () => {
    expect([THUMB_MAX_HEIGHT_PT, THUMB_AX_MAX_HEIGHT_PT, LETTER_PICTURE_AX_MAX_PT, LETTER_PICTURE_COLUMN_RATIO, LETTER_PICTURE_WINDOW_RATIO]).toEqual([
      tokens.picture.thumbMaxPt, tokens.picture.thumbAxMaxPt, tokens.picture.letterAxMaxPt, tokens.picture.letterColumnRatio, tokens.picture.letterWindowRatio,
    ]);
    expect(LETTER_PICTURE_AX_MAX_PT).toBe(88);
    expect(letterPictureSize({ columnWidth: 300, windowHeight: 667, aspect: 1, largeText: true }).height).toBe(88);
    const s = read('lib/photos/surface.ts');
    expect(s).not.toMatch(/=\s*(160|88|120|0\.75|0\.4);/);
  });
  it('the lens thumbnail shows the whole picture: 72 pt on the long side, any proportion; stacked at AX with a 160 pt cap (mutant: square 72 by 72)', () => {
    expect(lensThumbSize({ aspect: 2, largeText: false })).toEqual({ width: 72, height: 36 });
    expect(lensThumbSize({ aspect: 0.5, largeText: false })).toEqual({ width: 36, height: 72 });
    expect(lensThumbSize({ aspect: 1, largeText: false })).toEqual({ width: 72, height: 72 });
    expect(lensThumbSize({ aspect: 0, largeText: false })).toEqual({ width: 72, height: 72 });
    expect(lensThumbSize({ aspect: 1.5, largeText: true })).toEqual({ stacked: true, maxHeight: 160, aspect: 1.5 });
  });
  it('the lens card passes fit contain, the sm radius and drops the thumbnail when the file is gone (mutant: cover; or an empty frame kept)', () => {
    const l = read('components/photos/photos-lens.tsx');
    expect(l).toMatch(/fit="contain"/);
    expect(l).toMatch(/radius="sm"/);
    expect(l).toMatch(/photo=\{missing \? undefined : \{ label, thumb \}\}/);
    expect(l).not.toMatch(/THUMB_PT/);
  });
});

describe('[BL-1445] one ErrorLine, 56 pt rows, the add group', () => {
  it('the photo copy of ErrorLine is gone and every photo screen uses the shared one (mutant: restore the copy)', () => {
    expect(existsSync(join(SRC, 'components/photos/error-line.tsx'))).toBe(false);
    for (const f of ['pending-photo-thumb', 'photo-start', 'letter-photo']) {
      const s = read(`components/photos/${f}.tsx`);
      expect(s).toMatch(/import \{ ErrorLine \} from '@\/components\/ui\/error-line';/);
      expect(s).not.toMatch(/from '\.\/error-line'/);
    }
  });
  it('letter page rows are lg (56 pt) buttons, none md (mutant: size="md")', () => {
    const s = read('components/photos/letter-photo.tsx');
    expect(s).not.toMatch(/size="md"/);
    expect(tokens.target.primary).toBe(56);
  });
  it('the add group has a level 2 heading in a PROPOSED content key, on the letter page only, and holds Change, not Remove (mutant: heading on Review; Remove inside)', () => {
    const s = read('components/photos/letter-photo.tsx');
    expect(s).toMatch(/asHeading=\{2\}/);
    expect(s).toMatch(/photos\.book\.letter\.addGroup/);
    expect(s.match(/\{draft \? null : <AddGroupHeading \/>\}/g)?.length).toBe(2);
    const group = /testID="letter\.photo\.group">([\s\S]*?)<\/View>/.exec(s)?.[1] ?? '';
    expect(group).toMatch(/letter\.photo\.change/);
    expect(group).not.toMatch(/letter\.photo\.remove|editWords/);
    expect(photosCopy.book.letter.addGroup).toBe('Add to this letter');
    const content = readFileSync(join(__dirname, '..', '..', '..', 'packages', 'content', 'src', 'features', 'photos.en.ts'), 'utf8');
    expect(content).toMatch(/PROPOSED, needs word approval\n\s+addGroup:/);
  });
  it('the missing-file box is framed in mediaFrame at stroke.control (mutant: plain unframed view)', () => {
    const s = read('components/photos/letter-photo.tsx');
    const box = /testID="letter\.photo\.missing"/.exec(s);
    expect(box).not.toBeNull();
    expect(s).toMatch(/borderWidth: tokens\.stroke\.control, borderColor: c\.mediaFrame/);
    expect(photosCopy.book.letter.missing).toBe('Not on this phone anymore');
  });
});
