/// <reference types="node" />
/**
 * NS-33 (docs/product/prd/11-foundations.md, locked 20 Nov 2026), the accessibility floor: headings. Spec:
 * docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md sections 3 and 4 (BL-927). Read as source text, like
 * tab-bar.test.ts: nothing here loads React Native.
 *
 * Rows covered: R1 (the letter page's dateline is its level 1 heading) and R2 (Me's heading is the tab label).
 * On iOS React Native reads no heading level, so "level 1" is checked as: the first heading in the file, and the only
 * `asHeading={1}`. Where VoiceOver lands and the rotor order are phone checks (V1, V2).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
/** Source without comments. */
const code = (t: string) => t.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** The JSX element that opens at `at`, up to the end of its opening tag. */
function openingTag(src: string, at: number): string {
  let depth = 0;
  for (let i = at; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '>' && depth === 0) return src.slice(at, i + 1);
  }
  return src.slice(at);
}

const HEADING = /asHeading|role="heading"|accessibilityRole="header"|variant="h1"/;

describe('NS-33 headings', () => {
  it('[NS-33-R1] letter page heading', () => {
    const page = code(read('app/letter/[id].tsx'));
    const id = page.indexOf("'letter.dateline'");
    expect(id, 'the dateline keeps its testID').toBeGreaterThan(-1);
    const start = page.lastIndexOf('<Text', id);
    const tag = openingTag(page, start);
    expect(tag).toMatch(/variant="letterDateline"/);
    // 1. The dateline is a level 1 heading, with its spoken label unchanged.
    expect(tag).toMatch(/\basHeading=\{1\}/);
    expect(tag).toMatch(/accessibilityLabel=\{spokenDateline\}/);
    // 2. It is the only level 1 heading on the page, and no heading comes before it.
    expect(page.match(/asHeading=\{1\}/g) ?? []).toHaveLength(1);
    expect(page.slice(0, start)).not.toMatch(HEADING);
    // 3. Text still turns a numeric asHeading into the heading role (the iOS Header trait) and aria-level (web).
    const text = code(read('components/ui/text.tsx'));
    expect(text).toMatch(/asHeading\?: boolean \| 1 \| 2 \| 3/);
    expect(text).toMatch(/const heading = asHeading \|\|/);
    expect(text).toMatch(/role=\{role \?\? \(heading \? 'heading'/);
    expect(text).toMatch(/aria-level=\{typeof asHeading === 'number' \? String\(asHeading\)/);
  });

  it('[NS-33-R2] Me heading matches tab', () => {
    const layout = code(read('app/(tabs)/_layout.tsx'));
    const at = layout.indexOf('name="you"');
    expect(at).toBeGreaterThan(-1);
    const end = layout.indexOf('/>', layout.indexOf('}}', at));
    const block = layout.slice(at, end);
    // One key for the tab label and the bar title: the header falls back to `title` when no headerTitle is set.
    expect(block).toMatch(/title: t\.you,/);
    expect(block).toMatch(/tabBarButton: button\(t\.you\)/);
    expect(block).toMatch(/headerShown: true/);
    expect(block).not.toMatch(/headerTitle\b/);
  });
});
