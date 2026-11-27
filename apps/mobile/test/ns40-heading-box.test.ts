/**
 * NS-40-R13 follow-up (review note on #2115, mutant M10). The age gate's AX5 check refuses a capped line
 * (`numberOfLines`, `adjustsFontSizeToFit`), but a heading can also be cut by a box: a fixed `height` or `maxHeight`
 * with `overflow: 'hidden'` on the heading or on a view around it clips the second line at large text, and every
 * other test still passes. This reads the age gate screen and the first-run screen as source (like a11y-ax5.test.ts)
 * and, for every heading (`asHeading` in any form), checks the heading's own tag and every JSX tag still open around it.
 * A heading drawn inside a child component (CoverHeading on the child and signs-as steps) is that component's to guard.
 * Fictional family "Asha"; no person's words are read.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '../src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

type Tag = { name: string; text: string; close: boolean; selfClose: boolean; start: number; end: number };

/** Every JSX tag in `src`, in order. A tag ends at the first `>` outside braces and quotes, so `onPress={() => x}` is
 * read as one attribute. Comparisons such as `a < b` are not tags: a tag starts with `<` then a capital or `/`. */
export function jsxTags(src: string): Tag[] {
  const tags: Tag[] = [];
  // A type argument (`useState<Decision>`, `forwardRef<RNText>`) follows a name or a bracket; an opening JSX tag never
  // does. A closing tag may follow text (`Hi</Text>`), so it is always a tag.
  const open = /(?<![\w$.)\]])<()([A-Z][\w.]*)|<(\/)([A-Z][\w.]*)/g;
  let m: RegExpExecArray | null;
  while ((m = open.exec(src))) {
    let depth = 0;
    let quote: string | null = null;
    let i = m.index + m[0].length;
    for (; i < src.length; i++) {
      const c = src[i];
      if (quote) { if (c === quote && src[i - 1] !== '\\') quote = null; continue; }
      if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0 && src[i - 1] !== '=') break;
    }
    const text = src.slice(m.index, i + 1);
    tags.push({ name: m[2] ?? m[4], text, close: m[3] === '/', selfClose: text.endsWith('/>'), start: m.index, end: i + 1 });
    open.lastIndex = i + 1;
  }
  return tags;
}

/** The tags still open at `at`, outermost first. */
export function openAround(src: string, at: number): Tag[] {
  const stack: Tag[] = [];
  for (const t of jsxTags(src)) {
    if (t.start >= at) break;
    if (t.selfClose) continue;
    if (t.close) {
      const k = stack.map((s) => s.name).lastIndexOf(t.name);
      if (k >= 0) stack.splice(k);
    } else stack.push(t);
  }
  return stack;
}

// A fixed or capped box, or a clip, in a style object or a class (Uniwind maps line-clamp-* to numberOfLines). Classes
// are read anywhere in the tag, so className, contentContainerClassName and a class chosen in an expression all count,
// with any variant prefix (`ios:`, `dark:`) or `!`. minHeight, min-h-*, lineHeight and maxWidth are fine: they never cut
// a line. A JSX prop such as `height={56}` on a drawn mark is not a style key and is not matched; `numberOfLines={0}`
// is no cap and is not matched either.
const CLASS = (body: string) => new RegExp(`(?:^|[\\s"'\`{(])(?:[\\w-]+:)*!?(?:${body})`);
const BOX = [
  { what: 'a fixed height', re: /(^|[^A-Za-z])height\s*:/ },
  { what: 'a maxHeight', re: /(^|[^A-Za-z])maxHeight\s*:/ },
  { what: 'an aspectRatio', re: /(^|[^A-Za-z])aspectRatio\s*:/ },
  { what: "overflow: 'hidden'", re: /overflow\s*:\s*['"]hidden['"]/ },
  { what: 'a height or size class', re: CLASS('max-h-|h-|size-|aspect-') },
  { what: 'a clip class', re: CLASS('overflow-(?:hidden|clip)|line-clamp-') },
  { what: 'a capped line', re: /numberOfLines=\{(?!0\})|numberOfLines=["']|adjustsFontSizeToFit|ellipsizeMode/ },
  { what: 'a capped type size', re: /maxFontSizeMultiplier|allowFontScaling=\{false\}/ },
];

/** A heading tag: `asHeading` bare or with any value. */
export const isHeading = (t: Tag) => !t.close && /\sasHeading(?=[\s=/>])/.test(t.text);

export function boxFindings(src: string): string[] {
  const out: string[] = [];
  const tags = jsxTags(src);
  for (const h of tags.filter(isHeading)) {
    for (const t of [...openAround(src, h.start), h]) {
      for (const b of BOX) if (b.re.test(t.text)) out.push(`${b.what} on <${t.name}> around the heading at ${h.start}`);
    }
  }
  return out;
}

const FILES = { gate: 'components/gate/age-gate-screen.tsx', firstRun: 'app/onboarding.tsx' } as const;
const headings = (src: string) => jsxTags(src).filter(isHeading);
/** The heading whose text holds `marker`, or undefined. */
const headingOf = (src: string, marker: string) => {
  const at = src.indexOf(marker);
  return at < 0 ? undefined : headings(src).filter((t) => t.end <= at).at(-1);
};
/** `src` with `find` replaced by `put` at its first match after `from`. */
const replaceAfter = (src: string, from: number, find: string, put: string) => {
  const at = src.indexOf(find, from);
  expect(at, find).toBeGreaterThan(-1);
  return src.slice(0, at) + put + src.slice(at + find.length);
};

describe('[NS-40-R13] the gate and finale headings sit in no box that can clip them at large text', () => {
  it('finds every heading it guards: the age question and the stop line; the welcome, promise and finale', () => {
    const gate = read(FILES.gate);
    expect(headings(gate).some((t) => /ref=\{question\}/.test(t.text)), 'age question').toBe(true);
    const stopAt = gate.indexOf('testID="gate.stop"');
    expect(stopAt, 'stop view').toBeGreaterThan(0);
    expect(headings(gate).some((t) => t.start > stopAt), 'stop line').toBe(true);
    const firstRun = read(FILES.firstRun);
    // The marker is each heading's own text, so a heading that loses `asHeading` is no longer found and this fails.
    for (const marker of ['{o.welcome.subtitle}', '{o.promise.title}', 'joinLastTwoWords(o.finish.title)']) {
      const h = headingOf(firstRun, marker);
      expect(h, marker).toBeDefined();
      expect(firstRun.slice(h!.end, firstRun.indexOf(marker)).trim().replace(/^\{$/, ''), `${marker} is that heading's text`).toBe('');
    }
  });

  for (const [label, rel] of Object.entries(FILES)) {
    it(`${label}: no fixed height, maxHeight or clip on a heading or on any view around it`, () => {
      expect(boxFindings(read(rel))).toEqual([]);
    });
  }

  it('mutant: the M10 box (height 68, overflow hidden) on the stop heading, a class box and a capped finale are each caught', () => {
    const gate = read(FILES.gate);
    const stopAt = gate.indexOf('testID="gate.stop"');
    const stopHeading = headings(gate).find((t) => t.start > stopAt)!;
    const boxed = gate.slice(0, stopHeading.start) + "<View style={{ height: 68, overflow: 'hidden' }}>" + gate.slice(stopHeading.start, stopHeading.end);
    // Close the added view right after the heading's own closing tag, so the heading is inside it.
    const rest = gate.slice(stopHeading.end);
    const closeAt = rest.indexOf('</Text>') + '</Text>'.length;
    const m10 = boxed + rest.slice(0, closeAt) + '</View>' + rest.slice(closeAt);
    expect(boxFindings(m10)).toEqual(expect.arrayContaining([expect.stringMatching(/fixed height/), expect.stringMatching(/overflow/)]));
    expect(boxFindings(gate.replace('testID="gate.stop"', 'testID="gate.stop" style={{ maxHeight: 200 }}'))).not.toEqual([]);
    expect(boxFindings(gate.replace('testID="gate.stop"', 'testID="gate.stop" className="h-40"'))).not.toEqual([]);
    const fr = read(FILES.firstRun);
    const finale = headingOf(fr, 'joinLastTwoWords(o.finish.title)')!;
    // The finale's own wrapper, found from the finale heading backwards, not the first gap-3 in the file.
    const wrapperAt = fr.lastIndexOf('className="gap-3"', finale.start);
    expect(wrapperAt).toBeGreaterThan(fr.indexOf('{o.promise.title}'));
    for (const cls of ['max-h-24', 'ios:h-20', '!size-40', 'line-clamp-2', 'overflow-hidden']) {
      expect(boxFindings(replaceAfter(fr, wrapperAt, 'className="gap-3"', `className="gap-3 ${cls}"`)), cls).not.toEqual([]);
    }
    expect(boxFindings(replaceAfter(fr, finale.start, 'asHeading={1}', 'asHeading={1} numberOfLines={2}'))).not.toEqual([]);
    expect(boxFindings(replaceAfter(fr, finale.start, 'asHeading={1}', 'asHeading={1} maxFontSizeMultiplier={1.2}'))).not.toEqual([]);
    // The welcome heading written bare (`asHeading`) is still a heading, and its cap is still caught.
    const welcome = headingOf(fr, '{o.welcome.subtitle}')!;
    expect(boxFindings(replaceAfter(fr, welcome.start, 'asHeading={1}', 'asHeading numberOfLines={2}'))).not.toEqual([]);
  });

  it('a box that is closed before the heading, a minHeight and a drawn mark height are not findings', () => {
    const src = `<View><View style={{ height: 1 }} /><View style={{ height: 2 }}></View><QuotePair height={56} /><View className="min-h-11" style={{ minHeight: 44, lineHeight: 30 }}><Text asHeading={1} numberOfLines={0}>Hi</Text></View></View>`;
    expect(boxFindings(src)).toEqual([]);
    expect(openAround(src, src.indexOf('<Text')).map((t) => t.name)).toEqual(['View', 'View']);
  });

  it('the scanner reads an arrow function in a prop, a > in a string and a type argument as part of one tag', () => {
    const src = `const r = useRef<View>(null);\n<View onLayout={(e) => (e.x > 1 ? a : b)} accessibilityLabel="a > b" className={big ? 'h-16' : 'p-2'}><Text asHeading>Hi</Text></View>`;
    expect(jsxTags(src).map((t) => t.name)).toEqual(['View', 'Text', 'Text', 'View']);
    expect(openAround(src, src.indexOf('<Text')).map((t) => t.name)).toEqual(['View']);
    expect(boxFindings(src)).toEqual([expect.stringMatching(/height or size class on <View>/)]);
  });
});
