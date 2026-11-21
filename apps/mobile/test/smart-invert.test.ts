/// <reference types="node" />
/**
 * [NS-33-R11] Smart Invert ignores pictures (plan 05, D15; guards NS-01-R41, NS-49-R30, NS-51-R34, NS-52-R28).
 * Source scan, no device: every JSX element that draws a picture sets `accessibilityIgnoresInvertColors`, so a
 * family photograph is never turned into its negative. Covers components added later as well as today's.
 * Status on 0c7c3c6: develop renders no user picture yet (no PhotoFrame, no thumbnail) and has 0 uses of the prop.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = resolve(__dirname, '..');
const SRC = join(APP, 'src');
const PICTURE_TAG = /^(Image|ExpoImage|SvgImage|ImageBackground|Animated\.Image|PhotoFrame|Photo[A-Z]\w*|Thumbnail\w*)$/;
const PROP = 'accessibilityIgnoresInvertColors';

/** Decorative, never a person's picture. Each needs a reason; a stale entry fails the guard below. */
const ALLOWED: Record<string, string> = {
  'src/components/ui/lamp.tsx': 'SvgImage draws the paper grain texture inside the lamp glow, not a picture',
};

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Opening tags of picture elements, read with brace depth so `=>` and `>` inside `{}` do not end a tag early. */
export function pictureTags(source: string): { tag: string; text: string }[] {
  const code = stripComments(source);
  const found: { tag: string; text: string }[] = [];
  const open = /<([A-Za-z][\w.]*)/g;
  for (let m = open.exec(code); m; m = open.exec(code)) {
    if (!PICTURE_TAG.test(m[1])) continue;
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
    expect(offenders(`<PhotoFrame uri={u} />`)).toEqual(['PhotoFrame']);
  });

  it('[NS-33-R11] every allowlisted file still draws a picture element (no stale exemption)', () => {
    for (const f of Object.keys(ALLOWED)) {
      expect(pictureTags(readFileSync(join(APP, f), 'utf8')).length, f).toBeGreaterThan(0);
    }
  });

  // RED TODAY (NS-33-R11 / D15): develop has no PhotoFrame or thumbnail component and 0 uses of the prop.
  // The picture work (Drop B/C) must add PhotoFrame with the prop; that PR removes `.fails` here.
  it.fails('[NS-33-R11] RED: a PhotoFrame component exists and sets the prop (remove .fails when it lands)', () => {
    const frames = all.filter((f) => pictureTags(readFileSync(f, 'utf8')).some((t) => t.tag === 'Image') || /PhotoFrame/.test(readFileSync(f, 'utf8')))
      .filter((f) => /export (function|const) PhotoFrame\b/.test(readFileSync(f, 'utf8')));
    expect(frames.length).toBeGreaterThan(0);
    for (const f of frames) expect(setsProp(readFileSync(f, 'utf8'))).toBe(true);
  });

  it.fails('[NS-33-R11] RED: src uses the prop at least once (0 uses today; remove .fails with the first picture)', () => {
    const uses = all.filter((f) => readFileSync(f, 'utf8').includes(PROP));
    expect(uses.length).toBeGreaterThan(0);
  });
});
