/// <reference types="node" />
/**
 * NS-33-R4 (docs/product/prd/11-foundations.md, locked 20 Nov 2026): at the largest text size on an iPhone SE 3, no text
 * on Home, Review, the Book or the letter page is cut, and no control is under 44 pt. Spec:
 * docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md section 5 (BL-927). Read as source text, like tab-bar.test.ts:
 * nothing here loads React Native.
 *
 * The scan reads the four route files and every file each one imports from `@/components/`, one level deep, skipping
 * `.logic` files. It proves what code can: a line limit only below accessibility sizes, no shrink-to-fit or ellipsis
 * mode, no fixed type, and letter text never capped (D-027). Widths, overlap and split words are the AX5 walk on the
 * phone (X1). The Book's inline bar (BL-928 (d)) lands with or after #798 and has its own test then.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
/** Source without comments. */
const code = (t: string) => t.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const ROUTES = ['app/(tabs)/index.tsx', 'app/review.tsx', 'app/(tabs)/book.tsx', 'app/letter/[id].tsx'];

/** `@/components/x` to its file under src, or null when it is not a source file here. */
function resolve(spec: string): string | null {
  const base = spec.replace(/^@\//, '');
  for (const p of [`${base}.tsx`, `${base}.ts`, `${base}/index.tsx`, `${base}/index.ts`]) if (existsSync(join(SRC, p))) return p;
  return null;
}

/** The route files and their direct `@/components/` imports, without `.logic` files. */
function scanned(): string[] {
  const files = new Set<string>(ROUTES);
  for (const route of ROUTES) {
    const src = code(readFileSync(join(SRC, route), 'utf8'));
    for (const m of src.matchAll(/from\s+'(@\/components\/[^']+)'/g)) {
      if (/\.logic$/.test(m[1])) continue;
      const file = resolve(m[1]);
      if (file && !/\.logic\.tsx?$/.test(file)) files.add(file);
    }
  }
  return [...files];
}

/** Every JSX opening tag of `name` in `src`, up to its closing `>`, with braces balanced. */
function tags(src: string, name: string): string[] {
  const out: string[] = [];
  const open = new RegExp(`<${name}\\b`, 'g');
  for (let m = open.exec(src); m; m = open.exec(src)) {
    let depth = 0;
    let i = m.index;
    for (; i < src.length; i++) {
      const ch = src[i];
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
      else if (ch === '>' && depth === 0 && src[i - 1] !== '=') break;
    }
    out.push(src.slice(m.index, i + 1));
  }
  return out;
}

const FILES = scanned();
const read = (p: string) => code(readFileSync(join(SRC, p), 'utf8'));

describe('NS-33-R4 at accessibility sizes', () => {
  it('scans the four screens and what they draw', () => {
    for (const route of ROUTES) expect(FILES).toContain(route);
    // The scan reaches the shared parts these screens draw text with, so an import rename cannot empty it.
    expect(FILES).toContain('components/ui/text.tsx');
    expect(FILES.length).toBeGreaterThan(ROUTES.length + 5);
  });

  it('[NS-33-R4] no text on the four screens is cut at accessibility sizes', () => {
    const found: string[] = [];
    for (const file of FILES) {
      const src = read(file);
      // Names set from the accessibility-size hooks in this file.
      const sizes = new Set([...src.matchAll(/const (\w+) = (?:useIsAccessibilitySize|useIsLargeText)\(\)/g)].map((m) => m[1]));
      for (const m of src.matchAll(/numberOfLines=\{([^}]*)\}/g)) {
        const ok = /^(\w+) \? undefined : \d+$/.exec(m[1].trim());
        if (!ok || !sizes.has(ok[1])) found.push(`${file}: numberOfLines={${m[1]}}`);
      }
      for (const bad of [/\badjustsFontSizeToFit\b/, /\bellipsizeMode\b/, /allowFontScaling=\{false\}/]) {
        if (bad.test(src)) found.push(`${file}: ${bad.source}`);
      }
      // D-027: a person's words are never capped, so letterBody and signature text set no maxFontSizeMultiplier.
      for (const tag of tags(src, 'Text')) {
        if (/variant="(letterBody|signature)"/.test(tag) && /maxFontSizeMultiplier/.test(tag)) found.push(`${file}: capped ${tag.slice(0, 60)}`);
      }
    }
    expect(found).toEqual([]);
  });

  it('[NS-33-R4] no control under 44 pt on the four screens', () => {
    // A guard: it passes on develop. Button and IconButton minimums are pinned in design-system-gaps.test.ts (4).
    const found: string[] = [];
    for (const file of FILES) {
      const src = read(file);
      for (const tag of tags(src, 'IconButton')) if (/size="sm"/.test(tag)) found.push(`${file}: IconButton sm`);
      if (/<Chip\b/.test(src)) found.push(`${file}: Chip`);
    }
    expect(found).toEqual([]);
  });

  it('Review keeps the whole fix row one button at every size', () => {
    const review = read('app/review.tsx');
    const row = review.slice(review.indexOf('function FixRow'), review.indexOf('const WORDS_TEST_ID'));
    expect(row).toMatch(/const stacked = useIsAccessibilitySize\(\)/);
    expect(row).toMatch(/numberOfLines=\{stacked \? undefined : 1\}/);
    // One Pressable, the same label, hint and state, whichever layout draws.
    expect(row.match(/<Pressable\b/g) ?? []).toHaveLength(1);
    expect(row).toMatch(/accessibilityLabel=\{detail \? `\$\{label\}, \$\{detail\}` : label\}/);
    expect(row).toMatch(/accessibilityState=\{\{ expanded: open \}\}/);
    expect(row).toMatch(/min-h-12/);
  });
});
