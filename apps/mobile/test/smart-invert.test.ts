/// <reference types="node" />
/**
 * [NS-33-R11] Smart Invert ignores pictures (plan 05, D15; guards NS-01-R41, NS-49-R30, NS-51-R34, NS-52-R28).
 * Source scan, no device: every JSX element that draws a picture sets `accessibilityIgnoresInvertColors`, so a
 * family photograph is never turned into its negative. Covers components added later as well as today's.
 * PhotoFrame (#838) is the one wrapper that draws a person's picture; it is read below and must set the prop itself.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = resolve(__dirname, '..');
const SRC = join(APP, 'src');
const PICTURE_TAG = /^(Image|ExpoImage|SvgImage|ImageBackground|Animated\.Image|PhotoFrame|Photo[A-Z]\w*|Thumbnail\w*)$/;
/**
 * Names this guard does not hold to the prop at the call site. A prop on a custom component does nothing by itself, so
 * PhotoFrame is exempt only because the guard below reads photo-frame.tsx and requires every Image and the blank box in
 * it to carry the prop. A name ending in Button is a control, not a picture (PhotoStartButton is a text button with an
 * icon glyph); its icon is not a person's photograph.
 */
const SELF_PROTECTING = new Set(['PhotoFrame']);
const isPictureTag = (name: string) => PICTURE_TAG.test(name) && !SELF_PROTECTING.has(name) && !/Button$/.test(name);
const PROP = 'accessibilityIgnoresInvertColors';

/** Decorative, never a person's picture. Each needs a reason; a stale entry fails the guard below. */
const ALLOWED: Record<string, string> = {
  'src/components/ui/lamp.tsx': 'SvgImage draws the paper grain texture inside the lamp glow, not a picture',
};

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Opening tags of picture elements, read with brace depth so `=>` and `>` inside `{}` do not end a tag early. */
export function pictureTags(source: string, wanted: (name: string) => boolean = isPictureTag): { tag: string; text: string }[] {
  const code = stripComments(source);
  const found: { tag: string; text: string }[] = [];
  const open = /<([A-Za-z][\w.]*)/g;
  for (let m = open.exec(code); m; m = open.exec(code)) {
    if (!wanted(m[1])) continue;
    let depth = 0;
    let i = m.index + m[0].length;
    for (; i < code.length; i++) {
      const ch = code[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0) break;
    }
    found.push({ tag: m[1], text: code.slice(m.index, i + 1) });
  }
  return found;
}

/** A picture tag passes only with the prop on, not `={false}`. */
export const setsProp = (text: string) => new RegExp(`\\b${PROP}(?!\\s*=\\s*\\{\\s*false\\s*\\})(\\s|=|/|>)`).test(text);

export function offenders(source: string): string[] {
  return pictureTags(source).filter((t) => !setsProp(t.text)).map((t) => t.tag);
}

/**
 * PhotoFrame protects every picture it draws: at least one Image, every Image carries the prop, and so does the blank
 * box it draws while the screen is covered (a View with role image). Read from the real source, not trusted.
 */
export function frameProblems(source: string): string[] {
  const images = pictureTags(source, (n) => n === 'Image');
  const blanks = pictureTags(source, (n) => n === 'View').filter((t) => /accessibilityRole="image"/.test(t.text));
  const bad = [...images, ...blanks].filter((t) => !setsProp(t.text)).map((t) => t.tag);
  return [...(images.length ? [] : ['no Image']), ...(blanks.length ? [] : ['no blank box']), ...bad];
}

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return files(p);
    return /\.tsx$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : [];
  });
}
const rel = (p: string) => relative(APP, p).split('\\').join('/');

describe('[NS-33-R11] Smart Invert ignores pictures', () => {
  const all = files(SRC);

  it('[NS-33-R11] every picture element in src sets accessibilityIgnoresInvertColors', () => {
    const bad = all.filter((f) => !ALLOWED[rel(f)]).flatMap((f) => offenders(readFileSync(f, 'utf8')).map((t) => `${rel(f)} <${t}>`));
    expect(bad).toEqual([]);
  });

  it('[NS-33-R11] positive control: the scan flags a planted Image without the prop', () => {
    const planted = readFileSync(join(APP, 'test/fixtures/smart-invert/image-without-prop.fixture.txt'), 'utf8');
    expect(offenders(planted)).toEqual(['Image']);
  });

  it('[NS-33-R11] positive control: the scan passes an Image that sets the prop, and rejects ={false}', () => {
    expect(offenders(`<Image source={s} onLoad={() => 1} ${PROP} />`)).toEqual([]);
    expect(offenders(`<Image source={s} ${PROP}={true} />`)).toEqual([]);
    expect(offenders(`<Image source={s} ${PROP}={false} />`)).toEqual(['Image']);
    expect(offenders(`<PhotoThing uri={u} />`)).toEqual(['PhotoThing']); // a PhotoFrame call needs no prop: the frame is checked itself (below)
  });

  it('[NS-33-R11] every allowlisted file still draws a picture element (no stale exemption)', () => {
    for (const f of Object.keys(ALLOWED)) {
      expect(pictureTags(readFileSync(join(APP, f), 'utf8')).length, f).toBeGreaterThan(0);
    }
  });

  // PhotoFrame landed with the picture work (#838), so the two former RED tests run for real.
  it('[NS-33-R11] a PhotoFrame component exists and sets the prop', () => {
    const frames = all.filter((f) => pictureTags(readFileSync(f, 'utf8')).some((t) => t.tag === 'Image') || /PhotoFrame/.test(readFileSync(f, 'utf8')))
      .filter((f) => /export (function|const) PhotoFrame\b/.test(readFileSync(f, 'utf8')));
    expect(frames.length).toBeGreaterThan(0);
    for (const f of frames) expect(setsProp(readFileSync(f, 'utf8'))).toBe(true);
  });

  it('[NS-33-R11] src uses the prop at least once', () => {
    const uses = all.filter((f) => readFileSync(f, 'utf8').includes(PROP));
    expect(uses.length).toBeGreaterThan(0);
  });

  it('[NS-33-R11] PhotoFrame is self-protecting: its source puts the prop on every Image and on the blank box', () => {
    const src = readFileSync(join(SRC, 'components', 'photos', 'photo-frame.tsx'), 'utf8');
    expect(frameProblems(src)).toEqual([]);
  });

  it('[NS-33-R11] the guard still catches: a bare Image, a PhotoFrame whose Image or blank box lacks the prop, and a new Photo element', () => {
    expect(offenders('<Image source={s} />')).toEqual(['Image']);
    expect(offenders('<PhotoThing uri={u} />')).toEqual(['PhotoThing']);
    expect(offenders('<PhotoFrame uri={u} />')).toEqual([]); // exempt only because the frame itself is checked above
    expect(offenders('<PhotoStartButton onPress={f} />')).toEqual([]); // a control, not a picture
    const real = readFileSync(join(SRC, 'components', 'photos', 'photo-frame.tsx'), 'utf8');
    expect(frameProblems(real.replace(/\s*accessibilityIgnoresInvertColors\n/, '\n'))).toEqual(['Image']); // the Image loses it
    expect(frameProblems(real.replace('accessible accessibilityIgnoresInvertColors accessibilityRole', 'accessible accessibilityRole'))).toEqual(['View']); // the blank box loses it
    expect(frameProblems(real.replace(/accessibilityIgnoresInvertColors/g, 'accessibilityIgnoresInvertColors={false}'))).toEqual(['Image', 'View']);
    expect(frameProblems('export function PhotoFrame() { return null; }')).toEqual(['no Image', 'no blank box']);
  });
});
