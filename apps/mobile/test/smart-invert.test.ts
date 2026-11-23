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
const PICTURE_TAG = /^(Image|ExpoImage|SvgImage|ImageBackground|Animated\.Image|PhotoFrame|Photo[A-Z]\w*|Thumbnail\w*|PictureCard|Avatar)$/;
/**
 * Names this guard does not hold to the prop at the call site. A prop on a custom component does nothing by itself, so
 * PhotoFrame is exempt only because the guard below reads photo-frame.tsx and requires every Image and the blank box in
 * it to carry the prop.
 */
const SELF_PROTECTING = new Set(['PhotoFrame']);
/**
 * BL-1443: the only way a name that looks like a picture passes without the prop. It replaces the old `Button$` suffix
 * rule, which let any name ending in Button through. Each entry needs a reason; a stale entry fails the guard below.
 */
const NOT_A_PICTURE: Record<string, string> = {
  PhotoStartButton: 'a text button with an icon glyph, not a person\'s photograph',
};
/**
 * BL-1443: an image is found by where it is imported from, so `import { Image as Pic } from 'react-native'`,
 * `import FastImage from 'react-native-fast-image'` and `const Pic = Image` are all pictures under their new names.
 * `default` means the default import.
 */
const IMAGE_SOURCES: Record<string, string[]> = {
  'react-native': ['Image', 'ImageBackground'],
  'expo-image': ['Image', 'ImageBackground'],
  'react-native-svg': ['Image'],
  'react-native-fast-image': ['default', 'FastImage'],
};
/**
 * BL-1443 decision: bare PictureCard and Avatar call sites are checked (the stricter default, CTO ruling wave 9). Today
 * src has neither component; one added later must carry the prop at every call site until it is allowlisted here.
 */
const PROP = 'accessibilityIgnoresInvertColors';

/** Local names bound to an image component: imported from an image source (with aliases), or `const X = <image name>`. */
export function imageNames(source: string): Set<string> {
  const code = stripComments(source);
  const names = new Set<string>();
  for (const m of code.matchAll(/import\s+([^;]*?)\s+from\s+['"]([^'"]+)['"]/g)) {
    const wanted = IMAGE_SOURCES[m[2]];
    if (!wanted) continue;
    const clause = m[1];
    const def = /^([A-Za-z_$][\w$]*)\s*(,|$)/.exec(clause);
    if (def && wanted.includes('default')) names.add(def[1]);
    const ns = /\*\s+as\s+([A-Za-z_$][\w$]*)/.exec(clause);
    if (ns) for (const w of wanted) if (w !== 'default') names.add(`${ns[1]}.${w}`);
    const braces = /\{([^}]*)\}/.exec(clause);
    if (braces) {
      for (const part of braces[1].split(',')) {
        const [imported, local] = part.trim().replace(/^type\s+/, '').split(/\s+as\s+/);
        if (imported && wanted.includes(imported)) names.add((local ?? imported).trim());
      }
    }
  }
  for (let grew = true; grew; ) {
    grew = false;
    // BL-1841: `const Pic = styled(Image)` and `styled(Image, opts)` wrap an image and are still a picture.
    for (const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*styled\(\s*([A-Za-z_$][\w$.]*)\s*[,)]/g)) {
      if (names.has(m[2]) && !names.has(m[1])) {
        names.add(m[1]);
        grew = true;
      }
    }
    for (const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([A-Za-z_$][\w$.]*)\s*;/g)) {
      if (names.has(m[2]) && !names.has(m[1])) {
        names.add(m[1]);
        grew = true;
      }
    }
  }
  return names;
}
const picturePredicate = (source: string) => {
  const imported = imageNames(source);
  return (name: string) => (PICTURE_TAG.test(name) || imported.has(name)) && !SELF_PROTECTING.has(name) && !NOT_A_PICTURE[name];
};

/** Decorative, never a person's picture. Each needs a reason; a stale entry fails the guard below. */
const ALLOWED: Record<string, string> = {
  'src/components/ui/lamp.tsx': 'SvgImage draws the paper grain texture inside the lamp glow, not a picture',
};

const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** Opening tags of picture elements, read with brace depth so `=>` and `>` inside `{}` do not end a tag early. */
export function pictureTags(source: string, wanted: (name: string) => boolean = picturePredicate(source)): { tag: string; text: string }[] {
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

/**
 * BL-1841: a custom Avatar or PictureCard only protects a picture if it passes the prop on to the image it draws; a prop
 * set on the call site does nothing inside it. Read from the component's own source (no device): it must draw at least one
 * image and every image it draws must carry the prop (not `={false}`). Problems are returned as text.
 */
export function forwardProblems(source: string): string[] {
  const tags = pictureTags(source, (n) => !SELF_PROTECTING.has(n) && !NOT_A_PICTURE[n] && !/^(PictureCard|Avatar)$/.test(n) && picturePredicate(source)(n));
  const bad = tags.filter((t) => !setsProp(t.text)).map((t) => t.tag);
  return [...(tags.length ? [] : ['draws no image']), ...bad];
}
const DEFINES_CUSTOM = /\bexport\s+(?:default\s+)?(?:function|const)\s+(PictureCard|Avatar)\b/;

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

  // BL-1443: the guard reads import sources and an explicit allowlist, not tag names and a suffix.
  const aliased = readFileSync(join(APP, 'test/fixtures/smart-invert/aliased-image-without-prop.fixture.txt'), 'utf8');
  const aliasedOk = readFileSync(join(APP, 'test/fixtures/smart-invert/aliased-image-with-prop.fixture.txt'), 'utf8');

  it('[NS-33-R11] an aliased or third-party image without the prop fails the scan', () => {
    expect(offenders(aliased)).toEqual(['Pic', 'ExpoPic', 'FastImage', 'Snap', 'ImageBackground']);
  });

  it('[NS-33-R11] the same aliased images pass once each sets the prop', () => {
    expect(offenders(aliasedOk)).toEqual([]);
  });

  it('[NS-33-R11] mutant: a tag-name-only scan (the old guard) misses the aliased images, the import-source scan does not', () => {
    const byNameOnly = (src: string) => pictureTags(src, (n) => PICTURE_TAG.test(n)).filter((t) => !setsProp(t.text)).map((t) => t.tag);
    expect(byNameOnly(aliased)).toEqual(['ImageBackground']); // five images, the old guard sees one
    expect(offenders(aliased)).toHaveLength(5);
  });

  it('[NS-33-R11] import sources: react-native, expo-image, svg and fast-image, with aliases, namespaces and const aliases', () => {
    expect([...imageNames(aliased)].sort()).toEqual(['ExpoPic', 'FastImage', 'Image', 'ImageBackground', 'Pic', 'Snap']);
    expect([...imageNames("import * as RN from 'react-native';")]).toEqual(['RN.Image', 'RN.ImageBackground']);
    expect(offenders("import * as RN from 'react-native';\n<RN.Image source={s} />")).toEqual(['RN.Image']);
    expect([...imageNames("import { View, Text as T } from 'react-native';")]).toEqual([]); // not images
    expect(offenders("import { Image } from 'some-other-package';\n<Pane />")).toEqual([]);
  });

  it('[NS-33-R11] a name ending in Button is not exempt by its suffix: only the explicit allowlist passes', () => {
    expect(offenders('<PhotoStartButton onPress={f} />')).toEqual([]); // allowlisted, with a reason
    expect(offenders('<PhotoSaveButton uri={u} />')).toEqual(['PhotoSaveButton']); // same suffix, not on the list
    expect(offenders('<ThumbnailButton uri={u} />')).toEqual(['ThumbnailButton']);
  });

  it('[NS-33-R11] every allowlisted name has a reason and still appears in src (no stale entry)', () => {
    const text = all.map((f) => readFileSync(f, 'utf8')).join('\n');
    for (const [name, why] of Object.entries(NOT_A_PICTURE)) {
      expect(why.length, name).toBeGreaterThan(10);
      expect(text.includes(`<${name}`) || text.includes(`function ${name}`) || text.includes(`const ${name}`), name).toBe(true);
    }
  });

  it('[NS-33-R11] bare PictureCard and Avatar call sites are checked (BL-1443 stricter default)', () => {
    expect(offenders('<PictureCard uri={u} />')).toEqual(['PictureCard']);
    expect(offenders('<Avatar uri={u} />')).toEqual(['Avatar']);
    expect(offenders(`<PictureCard uri={u} ${PROP} />`)).toEqual([]);
    expect(offenders(`<Avatar uri={u} ${PROP} />`)).toEqual([]);
  });
  // BL-1841: three gaps the reviews of #1635 named.
  const FIX = (n: string) => readFileSync(join(APP, 'test/fixtures/smart-invert', n), 'utf8');

  it('[NS-33-R11] a custom Avatar or PictureCard in src forwards the prop to the image it draws', () => {
    const bad = all.filter((f) => DEFINES_CUSTOM.test(readFileSync(f, 'utf8')))
      .flatMap((f) => forwardProblems(readFileSync(f, 'utf8')).map((p) => `${rel(f)}: ${p}`));
    expect(bad).toEqual([]); // vacuous while src has neither component: the planted cases below show the check bites
  });

  it('[NS-33-R11] positive control: a planted Avatar and PictureCard that drop the prop fail, ones that forward it pass', () => {
    expect(forwardProblems(FIX('avatar-drops-prop.fixture.txt'))).toEqual(['Image']);
    expect(forwardProblems(FIX('picturecard-drops-prop.fixture.txt'))).toEqual(['Image', 'ExpoPic']);
    expect(forwardProblems(FIX('avatar-forwards-prop.fixture.txt'))).toEqual([]);
    expect(forwardProblems("export function Avatar() { return null; }")).toEqual(['draws no image']);
    expect(DEFINES_CUSTOM.test(FIX('avatar-drops-prop.fixture.txt'))).toBe(true);
  });

  it('[NS-33-R11] an image wrapped with styled(Image) is a picture, so it needs the prop', () => {
    const wrapped = FIX('styled-image-without-prop.fixture.txt');
    expect([...imageNames(wrapped)].sort()).toEqual(['Image', 'Photo2', 'Pic', 'Tall']);
    expect(offenders(wrapped)).toEqual(['Pic', 'Tall', 'Photo2']);
    expect(offenders(wrapped.replace(/<(Pic|Tall|Photo2) /g, `<$1 ${PROP} `))).toEqual([]);
    expect(offenders("import { View } from 'react-native';\nconst Box = styled(View);\n<Box />")).toEqual([]); // not an image
  });

  it('[NS-33-R11] positive control: an svg Image without the prop is flagged, the Svg root is not', () => {
    const svg = FIX('svg-image-without-prop.fixture.txt');
    expect([...imageNames(svg)]).toEqual(['SvgPic']);
    expect(offenders(svg)).toEqual(['SvgPic']);
    expect(offenders(svg.replace('<SvgPic ', `<SvgPic ${PROP} `))).toEqual([]);
  });
});
