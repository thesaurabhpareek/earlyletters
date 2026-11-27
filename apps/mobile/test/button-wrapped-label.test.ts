/**
 * A wrapped Button label keeps the pill up to two lines and takes `radius.xl` from the third (COMPONENTS 2.1, 0.1;
 * council ruling CDesO-14, BL-490). `rounded-full` on a full-width button three or more lines tall at accessibility
 * sizes drew a tall oval (the P8a and P6c critics' AX5 shots), on the sign-in sheet, the 404 and Delete account.
 *
 * The rule is pure (components/ui/button.logic.ts) and runs here in Node. How Button learns the line count is pinned
 * against the source, since Node does not render React Native: the label Text reports `onTextLayout`'s line count
 * through TextLinesContext, and Button puts the corner in its style after the pill class.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { PILL_MAX_LINES, WRAPPED_LABEL_RADIUS, wrappedLabelRadius } from '../src/components/ui/button.logic';

const UI = join(__dirname, '..', 'src', 'components', 'ui');
const read = (f: string) => readFileSync(join(UI, f), 'utf8');

describe('[BL-490] [COMPONENTS 2.1] a wrapped label keeps a radius, not an oval', () => {
  it('one and two lines keep the pill (no override)', () => {
    expect(PILL_MAX_LINES).toBe(2);
    expect(wrappedLabelRadius(1)).toBeUndefined();
    expect(wrappedLabelRadius(2)).toBeUndefined();
  });

  it('three lines and more take radius.xl, the radius design systems named', () => {
    expect(WRAPPED_LABEL_RADIUS).toBe(tokens.radius.xl);
    for (const lines of [3, 4, 6, 12]) expect(wrappedLabelRadius(lines), `${lines} lines`).toBe(tokens.radius.xl);
  });

  it('the named radius is a real corner, not the pill, and smaller than half the shortest three-line button', () => {
    expect(WRAPPED_LABEL_RADIUS).toBeLessThan(tokens.radius.pill);
    // Shortest three-line Button at the default text size: `sm` (py-2, 8 pt top and bottom) with labelSmall lines.
    const shortest = 3 * tokens.type.labelSmall.lineHeight + 2 * 8;
    expect(WRAPPED_LABEL_RADIUS).toBeLessThan(shortest / 2);
    // And it is the corner a two-line `lg` pill already has (py-3, 12 pt), so the third line does not jump the shape.
    expect(WRAPPED_LABEL_RADIUS).toBe((2 * tokens.type.label.lineHeight + 2 * 12) / 2);
  });

  it('Button counts its label lines and puts the corner in its style after the pill class', () => {
    const src = read('button.tsx');
    const button = src.slice(src.indexOf('function Button('), src.indexOf('export type IconButtonProps'));
    expect(button).toMatch(/const \[labelLines, setLabelLines\] = React\.useState\(1\);/);
    expect(button).toMatch(/const radius = wrappedLabelRadius\(labelLines\);/);
    expect(button).toMatch(/<TextLinesContext\.Provider value=\{setLabelLines\}>/);
    // The override sits in style (which wins over className), before the caller's own style.
    expect(button).toMatch(/style=\{\[\{ minHeight: BUTTON_MIN_HEIGHT\[size\] \}, radius != null && \{ borderRadius: radius \}, press\.animatedStyle, style\]\}/);
    expect(src).toMatch(/'shrink-0 flex-row items-center justify-center gap-2 rounded-full'/);
  });

  it('a Text inside a Button reports how many lines it drew, and still calls its own onTextLayout', () => {
    const src = read('text.tsx');
    const plain = src.slice(src.indexOf('function PlainText('));
    expect(plain).toMatch(/const reportLines = React\.useContext\(TextLinesContext\);/);
    expect(plain).toMatch(/reportLines\(e\.nativeEvent\.lines\.length\);\s*props\.onTextLayout\?\.\(e\);/);
    // After the spread, so a caller's onTextLayout cannot switch the report off.
    expect(plain.indexOf('onTextLayout={')).toBeGreaterThan(plain.indexOf('{...props}'));
  });
});
