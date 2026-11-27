/// <reference types="node" />
/**
 * BL-1752: the hairline and the progress lines are tokens (packages/design-tokens: `stroke.hairline`, `progress`), and
 * no screen types them. Like a11y-lint.test.ts, the rules read source text (comments stripped) and load nothing from
 * React Native; each rule has a self-check so it cannot go quiet by accident.
 *
 * Left for the rest of the row (not covered here): icon sizes (DSR-008), gutters and tab tops (DSR-006, CDO-B-003),
 * press opacity, the web date field (DSR-007) and the Read together button weight (CDO-B-051).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';

const SRC = join(__dirname, '..', 'src');
const strip = (t: string) => t.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function walk(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n)) out.push(p);
  }
  return out;
}
const FILES = walk(SRC).map((p) => ({ rel: relative(SRC, p).split('\\').join('/'), text: strip(readFileSync(p, 'utf8')) }));
const source = (rel: string) => {
  const f = FILES.find((x) => x.rel === rel);
  if (!f) throw new Error(`missing ${rel}`);
  return f.text;
};
const hits = (re: RegExp) => FILES.filter((f) => re.test(f.text)).map((f) => f.rel).sort();

/** A typed 0.5 pt stroke: a border width or a line's height or width. The token is `tokens.stroke.hairline`. */
const TYPED_HAIRLINE = /\b(?:border(?:Top|Bottom|Left|Right|Start|End)?Width|height|width)\s*:\s*0?\.5\b/;
/** Two ways to set one line: a `h-px` class with an inline height on the same element (DSR-027). */
const CLASS_AND_INLINE_LINE = /className="[^"]*\bh-px\b[^"]*"[^>]*style=\{\{[^}]*\bheight\b/;
/** A progress line's height or corner typed as a number or a height class. */
const TYPED_PROGRESS = /\bheight\s*:\s*[0-9]+\b|\bborderRadius\s*:\s*[0-9]+\b|\bh-[0-9]+\b/;

const READ_TOGETHER = 'app/read-together.tsx';
const JOIN_ASK = 'components/family/join-ask.tsx';
const EXPORT = 'app/settings/export.tsx';

/** The JSX of the element whose testID or accessibilityRole marks it as a progress line, up to its closing tag. */
function progressBlock(text: string, marker: RegExp): string {
  const at = text.search(marker);
  if (at < 0) throw new Error(`no progress element for ${marker}`);
  const open = text.lastIndexOf('<View', at);
  const close = text.indexOf('</View>', at);
  return text.slice(open, close);
}

describe('BL-1752 semantic token rules (self-checks)', () => {
  it('each rule catches a bad line and passes a good one', () => {
    expect(TYPED_HAIRLINE.test('borderTopWidth: 0.5,')).toBe(true);
    expect(TYPED_HAIRLINE.test("style={{ height: 0.5 }}")).toBe(true);
    expect(TYPED_HAIRLINE.test('borderWidth: tokens.stroke.hairline')).toBe(false);
    expect(TYPED_HAIRLINE.test('opacity: 0.5')).toBe(false);
    expect(CLASS_AND_INLINE_LINE.test('<View className="ml-4 h-px bg-border" style={{ height: 0.5 }} />')).toBe(true);
    expect(CLASS_AND_INLINE_LINE.test('<View className="ml-4 bg-border" style={{ height: tokens.stroke.hairline }} />')).toBe(false);
    expect(TYPED_PROGRESS.test('style={{ height: 2 }}')).toBe(true);
    expect(TYPED_PROGRESS.test('className="h-2 overflow-hidden"')).toBe(true);
    expect(TYPED_PROGRESS.test('style={{ height: P.bar, borderRadius: tokens.radius.pill }}')).toBe(false);
  });
  it('scans the source tree', () => {
    expect(FILES.length).toBeGreaterThan(100);
  });
});

describe('BL-1752 no screen types the hairline or a progress line', () => {
  it('[DSR-026] no file types a 0.5 pt hairline; it comes from tokens.stroke.hairline', () => {
    expect(hits(TYPED_HAIRLINE)).toEqual([]);
  });
  it('[DSR-027] no line is set twice, as a h-px class and an inline height', () => {
    expect(hits(CLASS_AND_INLINE_LINE)).toEqual([]);
  });
  it('[DSR-006] the Read together line, the join sweep and the export bar take their height from tokens.progress', () => {
    const blocks = {
      [READ_TOGETHER]: progressBlock(source(READ_TOGETHER), /testID="readTogether\.progress"/),
      [JOIN_ASK]: progressBlock(source(JOIN_ASK), /accessibilityElementsHidden/),
      [EXPORT]: progressBlock(source(EXPORT), /accessibilityRole="progressbar"/),
    };
    for (const [rel, block] of Object.entries(blocks)) {
      expect(TYPED_PROGRESS.test(block), `${rel} types a progress height or corner`).toBe(false);
      expect(block, rel).toMatch(/\btokens\.progress\b|\bP\.(hairline|sweep|bar)\b/);
    }
  });
  it('[CDO-B-048] the Read together line is drawn in the full progress fill, with no opacity that weakens it', () => {
    const block = progressBlock(source(READ_TOGETHER), /testID="readTogether\.progress"/);
    expect(block).not.toMatch(/\bopacity\s*:/);
    // Screens name the colour (a computed `c[...]` key would hide it from the lamp's status scan), so the name is held
    // to the token's role here: the three lines draw their fill, and their track where they have one, from tokens.progress.
    expect(block).toMatch(new RegExp(`backgroundColor: c\\.${tokens.progress.fill}\\b`));
    for (const rel of [JOIN_ASK, EXPORT]) {
      const marker = rel === EXPORT ? /accessibilityRole="progressbar"/ : /accessibilityElementsHidden/;
      const other = progressBlock(source(rel), marker);
      expect(other, rel).toMatch(new RegExp(`backgroundColor: c\\.${tokens.progress.fill}\\b`));
      expect(other, rel).toMatch(new RegExp(`backgroundColor: c\\.${tokens.progress.track}\\b`));
    }
  });
  it('[CDO-A-016] the export phase line uses the type ramp, and Cancel is a Button label, not a hand-built Text child', () => {
    const text = source(EXPORT);
    expect(text).not.toMatch(/\btext-base\b/);
    expect(text).toMatch(/<Text[^>]*variant="subhead"[^>]*>\s*\{phaseText\}/);
    expect(text).toMatch(/<Button[^>]*label=\{s\.cancelButton\}/);
  });
});
