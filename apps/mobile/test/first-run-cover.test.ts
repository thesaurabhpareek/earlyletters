/// <reference types="node" />
/**
 * The P2 critics' pass fixes (28 Oct 2026, docs/design/reviews/P2_CRITICS_PASS_2026-10-28.md) and P6A's S2:
 * where the small cover sits beside a child's name, the name field's face, and the one primary on "The book is open."
 * The screens are React Native, which Node cannot draw, so the rules are tested as pure functions
 * (components/book/cover-place.logic.ts) and the wiring is pinned in the source, as the other screen tests do. A name
 * set on the cover is in book-cover.test.ts. The keyboard cannot be exercised on the web: D1 on the run sheet.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COVER_MIN_FREE_HEIGHT, coverFitsAboveKeyboard, coverPlace } from '../src/components/book/cover-place.logic';
import { FONT_SCALE, isAccessibilitySize, isLargeText } from '../src/lib/a11y.logic';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
/** Comments are not code. */
const code = (rel: string) => read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(name)) out.push(p);
  }
  return out;
}

/** Window heights (pt) and the free height P2-V measured with the keyboard and its QuickType bar up (S05 Visual, v1.3). */
const PHONES = {
  'iPhone SE': { windowHeight: 667, free: 407 },
  'iPhone 17 Pro': { windowHeight: 874, free: 538 },
  'iPhone Pro Max': { windowHeight: 956, free: 610 },
} as const;

describe('[P2 S1] the cover hides when the keyboard leaves under 480 pt of free height (S05, line 311 and 323)', () => {
  it('the rule is 480 pt, one named constant', () => {
    expect(COVER_MIN_FREE_HEIGHT).toBe(480);
  });

  it('the SE hides the cover; the 17 Pro and the Pro Max keep it while the name is typed', () => {
    const shown = Object.fromEntries(Object.entries(PHONES).map(([name, p]) => [name, coverFitsAboveKeyboard(p.windowHeight, p.windowHeight - p.free)]));
    expect(shown).toEqual({ 'iPhone SE': false, 'iPhone 17 Pro': true, 'iPhone Pro Max': true });
  });

  it('exactly 480 pt free keeps the cover; one point less hides it', () => {
    expect(coverFitsAboveKeyboard(874, 874 - 480)).toBe(true);
    expect(coverFitsAboveKeyboard(874, 874 - 479)).toBe(false);
  });

  it('with the keyboard down the cover always shows, whatever the window', () => {
    for (const windowHeight of [480, 568, 667, 874, 956]) expect(coverFitsAboveKeyboard(windowHeight, 0), String(windowHeight)).toBe(true);
  });

  it('is never the old 640 pt: a 17 Pro with its keyboard up (538 free) is not hidden', () => {
    expect(coverFitsAboveKeyboard(874, 336)).toBe(true);
  });

  it('there is one declaration of the constant, and neither screen keeps its own copy', () => {
    const declared = walk(SRC).filter((f) => /\bCOVER_MIN_FREE_HEIGHT\s*=/.test(readFileSync(f, 'utf8')));
    expect(declared.map((f) => f.slice(SRC.length + 1))).toEqual(['components/book/cover-place.logic.ts']);
    for (const f of ['app/onboarding.tsx', 'components/child/add-child-form.tsx']) {
      expect(code(f), f).toMatch(/useCoverPlace\(\)/);
      expect(code(f), f).not.toMatch(/useKeyboardHeight|useWindowDimensions|showCover/);
    }
  });
});

describe('[P6A S2] at accessibility text sizes the cover sits under the heading, not beside it', () => {
  const free = { windowHeight: 874, keyboardHeight: 0 };

  it('beside at the default size, below at accessibility sizes, hidden under the keyboard at either', () => {
    expect(coverPlace({ ...free, accessibilitySize: false })).toBe('beside');
    expect(coverPlace({ ...free, accessibilitySize: true })).toBe('below');
    expect(coverPlace({ windowHeight: 667, keyboardHeight: 260, accessibilitySize: false })).toBe('hidden');
    expect(coverPlace({ windowHeight: 667, keyboardHeight: 260, accessibilitySize: true })).toBe('hidden');
    expect(coverPlace({ windowHeight: 874, keyboardHeight: 336, accessibilitySize: true })).toBe('below');
  });

  it('the switch is the accessibility sizes (AX1 and up), not large text: xxxLarge keeps the cover beside', () => {
    expect(isAccessibilitySize(FONT_SCALE.xxxLarge)).toBe(false);
    expect(isLargeText(FONT_SCALE.xxxLarge)).toBe(true);
    for (const scale of [FONT_SCALE.ax1, FONT_SCALE.ax3, FONT_SCALE.ax5]) expect(isAccessibilitySize(scale)).toBe(true);
    const hook = code('components/child/cover-heading.tsx');
    expect(hook).toMatch(/const accessibilitySize = useIsAccessibilitySize\(\)/);
  });

  it('CoverHeading puts the cover under a full-width heading when it is below, and beside a flex-1 heading otherwise', () => {
    const heading = code('components/child/cover-heading.tsx');
    expect(heading).toMatch(/className=\{place === 'below' \? undefined : 'flex-1'\}/);
    expect(heading).toMatch(/if \(place === 'below'\) \{\s*return \(\s*<View className="gap-4">\s*\{heading\}\s*\{cover\}\s*<\/View>/);
    expect(heading).toMatch(/<View className="flex-row items-start gap-4">\s*\{heading\}\s*\{cover\}/);
    expect(heading).toMatch(/place === 'hidden' \? null/);
    // Decorative: the name is real text in the field and the heading.
    expect(heading).not.toMatch(/accessibilityLabel/);
  });

  it('the name step, the signature step and Add a child all draw their heading and cover through it', () => {
    // Each one is given the place the rule computes, never a fixed one.
    const wrapped = (f: string) => (code(f).match(/<CoverHeading title=\{[^}]+\} headingRef=\{heading\} place=\{coverPlace\}>\s*<BookCover/g) ?? []).length;
    for (const f of ['app/onboarding.tsx', 'components/child/add-child-form.tsx']) expect(code(f), f).toMatch(/const coverPlace = useCoverPlace\(\);/);
    expect(wrapped('app/onboarding.tsx')).toBe(2);
    expect(wrapped('components/child/add-child-form.tsx')).toBe(1);
    // Nothing lays a heading and a cover out in a row by hand any more.
    for (const f of ['app/onboarding.tsx', 'components/child/add-child-form.tsx']) expect(code(f), f).not.toMatch(/<View className="flex-row items-start gap-4">\s*<Text[^>]*variant="title1"/);
  });

  it('the Name field comes straight after the heading and its cover, with nothing between them', () => {
    const form = code('components/child/add-child-form.tsx');
    expect(form).toMatch(/<\/CoverHeading>\s*<TextField\s+ref=\{nameField\}/);
    const first = code('app/onboarding.tsx');
    expect(first).toMatch(/<\/CoverHeading>\s*<View className="gap-3">\s*\{names\.map/);
  });
});

describe('[P2 S3] the name is typed in the book\'s title face', () => {
  it('first run: every name row (the first and the extra ones) sets what is typed in the serif', () => {
    const first = code('app/onboarding.tsx');
    const names = first.slice(first.indexOf('{names.map((n, i) => ('), first.indexOf('{names.length < MAX_FIRST_RUN_CHILDREN &&'));
    expect(names).toMatch(/<TextField[\s\S]*label=\{i === 0 \? o\.child\.nameLabel : o\.child\.nameLabelMore\}\s*face="serif"/);
    // The signature field is not the book's title: it stays in the app's face.
    const signs = first.slice(first.indexOf('ref={signsAsField}'));
    expect(signs.slice(0, signs.indexOf('/>'))).not.toMatch(/face=/);
  });

  it('Add a child: the same field, the same face', () => {
    expect(code('components/child/add-child-form.tsx')).toMatch(/<TextField\s+ref=\{nameField\}\s+label=\{o\.nameLabel\}\s+face="serif"/);
  });
});

describe('[P2 S4] "Write the first one" is the one primary, pinned below the scroll', () => {
  const first = code('app/onboarding.tsx');

  it('only "The book is open." pins its controls; every other step keeps them in the scroll', () => {
    expect(first).toMatch(/const pinned = step === 'finish';/);
    const scroll = first.slice(first.indexOf('<ScrollView'), first.indexOf('</ScrollView>'));
    expect(scroll).toMatch(/\{pinned \? null : controls\}/);
    const after = first.slice(first.indexOf('</ScrollView>'), first.indexOf('</KeyboardAvoidingView>'));
    expect(after).toMatch(/\{pinned \? <View className="px-6 pb-6 pt-3">\{controls\}<\/View> : null\}/);
  });

  it('there is still one button for the step: the footer holds the same controls, not a second primary', () => {
    expect(first.match(/testID="onboarding\.continue"/g)).toHaveLength(1);
    expect(first.match(/const controls = /g)).toHaveLength(1);
    expect(first.match(/\bcontrols\}/g)).toHaveLength(2); // in the scroll or pinned, never both (`pinned` decides)
    expect(first.match(/<Button\b[^>]*size="lg"/g)).toHaveLength(1);
  });
});
