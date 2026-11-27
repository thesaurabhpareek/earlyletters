/**
 * NS-40-R13 follow-up (review note on #2115, mutant M10). The age gate's AX5 check refuses a capped line
 * (`numberOfLines`, `adjustsFontSizeToFit`), but a heading can also be cut by a box: a fixed `height` or `maxHeight`
 * with `overflow: 'hidden'` on the heading or on a view around it clips the second line at large text, and every
 * other test still passes. This reads the age gate screen and the first-run screen as source (like a11y-ax5.test.ts)
 * and, for every page heading (`asHeading={1}`), checks the heading's own tag and every JSX tag still open around it.
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
  // A type argument (`useState<Decision>`, `forwardRef<RNText>`) follows a name or a bracket; a JSX tag never does.
  const open = /(?<![\w$.)\]])<(\/?)([A-Z][\w.]*)/g;
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
    tags.push({ name: m[2], text, close: m[1] === '/', selfClose: text.endsWith('/>'), start: m.index, end: i + 1 });
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

// A fixed or capped box, or a clip, in a style object or a NativeWind class. minHeight, lineHeight and maxWidth are
// fine: they never cut a line. A JSX prop such as `height={56}` on a drawn mark is not a style key and is not matched.
const BOX = [
  { what: 'a fixed height', re: /(^|[^A-Za-z])height\s*:/ },
  { what: 'a maxHeight', re: /(^|[^A-Za-z])maxHeight\s*:/ },
  { what: "overflow: 'hidden'", re: /overflow\s*:\s*['"]hidden['"]/ },
  { what: 'a height class', re: /className=[^>]*["'\s`](max-h-|h-)[\w[\]./-]+/ },
  { what: 'overflow-hidden', re: /overflow-hidden/ },
  { what: 'a capped line', re: /numberOfLines|adjustsFontSizeToFit|ellipsizeMode/ },
];

export function boxFindings(src: string): string[] {
  const out: string[] = [];
  const tags = jsxTags(src);
  for (const h of tags.filter((t) => !t.close && /asHeading=\{1\}/.test(t.text))) {
    for (const t of [...openAround(src, h.start), h]) {
      for (const b of BOX) if (b.re.test(t.text)) out.push(`${b.what} on <${t.name}> around the heading at ${h.start}`);
    }
  }
  return out;
}

const FILES = { gate: 'components/gate/age-gate-screen.tsx', firstRun: 'app/onboarding.tsx' } as const;
const headings = (src: string) => jsxTags(src).filter((t) => !t.close && /asHeading=\{1\}/.test(t.text));

describe('[NS-40-R13] the gate and finale headings sit in no box that can clip them at large text', () => {
  it('finds the headings it guards: the age question and the stop line, and the first-run finale', () => {
    const gate = read(FILES.gate);
    expect(headings(gate).length).toBeGreaterThanOrEqual(2);
    expect(headings(gate).some((t) => /ref=\{question\}/.test(t.text))).toBe(true);
    const stopAt = gate.indexOf('testID="gate.stop"');
    expect(stopAt).toBeGreaterThan(0);
    expect(headings(gate).some((t) => t.start > stopAt)).toBe(true);
    const firstRun = read(FILES.firstRun);
    const finaleAt = firstRun.indexOf('joinLastTwoWords(o.finish.title)');
    expect(finaleAt).toBeGreaterThan(0);
    expect(headings(firstRun).some((t) => t.start < finaleAt && t.end > finaleAt - 200)).toBe(true);
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
    expect(boxFindings(fr.replace('className="gap-3"', 'className="gap-3 max-h-24 overflow-hidden"'))).not.toEqual([]);
    expect(boxFindings(fr.replace('variant="hero" asHeading={1}', 'variant="hero" asHeading={1} numberOfLines={2}'))).not.toEqual([]);
  });

  it('a box that is closed before the heading, a minHeight and a drawn mark height are not findings', () => {
    const src = `<View><View style={{ height: 1 }} /><View style={{ height: 2 }}></View><QuotePair height={56} /><View style={{ minHeight: 44, lineHeight: 30 }}><Text asHeading={1}>Hi</Text></View></View>`;
    expect(boxFindings(src)).toEqual([]);
    expect(openAround(src, src.indexOf('<Text')).map((t) => t.name)).toEqual(['View', 'View']);
  });
});
