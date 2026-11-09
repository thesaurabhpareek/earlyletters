/// <reference types="node" />
/**
 * Write's footer at large text (design seat defect 2 and design-systems row 1, council of 9 Nov 2026; S1-165).
 * "Add to Asha's book", "Keep private" and, in a store build, the standing Plus line (#668) were pinned under the page
 * at every text size. From AX3 the footer is taller than the room above the keyboard, so "Add to the book" could leave
 * the screen. Review and Tonight already move their footer into the scroll from accessibility sizes up
 * (lib/review-layout.logic.ts `footerPlacement`); Write now uses the same rule. The Plus line sits under the buttons, so
 * VoiceOver reads it last. No new words, and the buttons and the Plus line's rule are unchanged.
 *
 * Node cannot load React Native, so the rules run here and the screen's use of them is checked in its source (as
 * test/draft-card.test.ts does for Tonight). What the footer measures at AX3 and AX5 with the keyboard up is a phone's
 * to say (S1-165). Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FONT_SCALE, isAccessibilitySize } from '../src/lib/a11y.logic';
import { footerPlacement } from '../src/lib/review-layout.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const write = code('app/write.tsx');

/** The text between two needles of the source, failing loudly when either is missing. */
const between = (from: string, to: string, after = 0) => {
  const a = write.indexOf(from, after);
  expect(a, from).toBeGreaterThan(-1);
  const b = write.indexOf(to, a);
  expect(b, to).toBeGreaterThan(a);
  return write.slice(a, b);
};

describe('[S1-165] the rule: pinned at the default size, inline from AX1 up', () => {
  it('every text size Apple has: pinned below accessibility sizes, inline at AX1, AX3 and AX5', () => {
    for (const [name, scale] of Object.entries(FONT_SCALE)) {
      const ax = name.startsWith('ax');
      expect(footerPlacement(isAccessibilitySize(scale)), name).toBe(ax ? 'inline' : 'pinned');
    }
    expect(footerPlacement(isAccessibilitySize(FONT_SCALE.ax3))).toBe('inline');
    expect(footerPlacement(isAccessibilitySize(FONT_SCALE.ax5))).toBe('inline');
  });
});

describe('[S1-165] Write uses the rule Review and Tonight use', () => {
  it('reads the size with the hook the screen already had and asks footerPlacement (source)', () => {
    expect(write).toMatch(/import \{ footerPlacement \} from '@\/lib\/review-layout\.logic';/);
    expect(write).toMatch(/const large = useIsAccessibilitySize\(\);/);
    expect(write).toContain("const inlineFooter = footerPlacement(large) === 'inline';");
  });

  it('the footer is defined once and drawn in exactly one place at a time: in the scroll when inline, after it when pinned (source)', () => {
    expect(write.match(/const footer = \(/g)).toHaveLength(1);
    expect(write.match(/\{inlineFooter \? footer : null\}/g)).toHaveLength(1);
    expect(write.match(/\{inlineFooter \? null : footer\}/g)).toHaveLength(1);
    expect(write.match(/testID="write\.keep\.book"/g)).toHaveLength(1);
    expect(write.match(/testID="write\.keep\.private"/g)).toHaveLength(1);
    expect(write.match(/<PlusLine \/>/g)).toHaveLength(1);

    const scrollEnds = write.indexOf('</ScrollView>');
    const inlineAt = write.indexOf('{inlineFooter ? footer : null}');
    const pinnedAt = write.indexOf('{inlineFooter ? null : footer}');
    // inline: after the page itself, inside the scroll, so the last thing in it
    expect(inlineAt).toBeGreaterThan(write.indexOf('<TextField'));
    expect(inlineAt).toBeLessThan(scrollEnds);
    // pinned: after the scroll, still inside the keyboard-avoiding view, so it rides above the keyboard as before
    expect(pinnedAt).toBeGreaterThan(scrollEnds);
    expect(pinnedAt).toBeLessThan(write.indexOf('</KeyboardAvoidingView>'));
  });

  it('pinned keeps its classes exactly (hairline, background, padding); inline is Review\'s shell (source)', () => {
    expect(write).toContain("className={inlineFooter ? 'gap-1 pt-2' : 'gap-1 border-t border-border bg-background px-5 pb-2 pt-3'}");
  });

  it('the Plus line is the last thing in the footer, so VoiceOver reads the buttons first and it last (source)', () => {
    const footer = between('const footer = (', 'const status =');
    const book = footer.indexOf('testID="write.keep.book"');
    const quiet = footer.indexOf('testID="write.keep.private"');
    const plus = footer.indexOf('<PlusLine />');
    expect(book).toBeGreaterThan(-1);
    expect(book).toBeLessThan(quiet);
    expect(quiet).toBeLessThan(plus);
    // nothing but the Plus line's own wrapper closes the footer after it
    expect(footer.slice(plus)).toMatch(/^<PlusLine \/>\s*<\/View>\s*\) : null\}\s*<\/View>\s*\);\s*$/);
  });

  it('no new words and no new behaviour: the same buttons, labels, press handlers and Plus rule (source)', () => {
    const footer = between('const footer = (', 'const status =');
    expect(footer).toContain('<Button size="lg" fullWidth label={addButtonLabel(child.name)} onPress={() => keep(true)} disabled={empty} testID="write.keep.book" />');
    expect(footer).toContain('<Button variant="quiet" fullWidth label={copy.review.destination.privateButton} onPress={() => keep(false)} disabled={empty} testID="write.keep.private" />');
    expect(footer).toContain('{showPlusLine ? (');
    // no words of its own: no text between tags anywhere in the footer
    expect(footer).not.toMatch(/>\s*[A-Za-z][^<>{}]*</);
  });
});

describe('[S1-165] inline, the page follows the last line typed, not the buttons below it', () => {
  it('the field\'s own size change scrolls to the end only while the footer is pinned (source)', () => {
    expect(write).toMatch(/const onContentSizeChange = \(\) => \{\s*if \(!inlineFooter && followCaretToEnd\(/);
  });

  it('the scroll\'s size change places the page by pageEndOffset, only while inline and only when writing on at the end (source)', () => {
    const handler = between('const onScrollContentSizeChange =', 'offerAnother');
    expect(handler).toMatch(/if \(!inlineFooter \|\| !followCaretToEnd\(\{ selectionEnd: selectionEnd\.current, length: session\.latest\(\)\.length \}\)\) return;/);
    expect(handler).toMatch(/pageEndOffset\(\{ contentHeight, footerHeight: footerHeight\.current, viewportHeight: viewportHeight\.current \}\)/);
    expect(handler).toMatch(/if \(y !== null\) scroll\.current\?\.scrollTo\(\{ y, animated: false \}\);/);
    // never to the very end of the content, which is the buttons
    expect(handler).not.toMatch(/scrollToEnd/);
    expect(write).toMatch(/<ScrollView[^>]*onContentSizeChange=\{onScrollContentSizeChange\}/);
  });

  it('the viewport and the footer are measured into refs, never state: a layout does not render Write (source)', () => {
    expect(write).toMatch(/const viewportHeight = useRef\(0\);\s*const footerHeight = useRef\(0\);/);
    expect(write).toMatch(/viewportHeight\.current = e\.nativeEvent\.layout\.height;/);
    expect(write).toMatch(/footerHeight\.current = e\.nativeEvent\.layout\.height;/);
  });
});
