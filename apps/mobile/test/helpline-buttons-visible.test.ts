/// <reference types="node" />
/**
 * Call and Text on "If you are struggling" and "Lines in other countries" keep a visible shape (WCAG 1.4.11 Non-text
 * Contrast). They were `secondary` buttons: an accentSoft fill on the flat
 * card (the `muted` surface), 1.08:1 in light and 1.33:1 in dark, so the shape disappeared on the page people open on
 * their worst nights. They are now `outline` buttons: the control edge (`input`, which is controlBorder) on that same
 * surface. The colours are read from the design tokens and from the real class names in card.tsx and button.tsx, so
 * a change of the card's tone or of the outline's edge fails here. No hex literal belongs to this card.
 *
 * Words and behaviour are not touched: the labels, the VoiceOver labels and hints, and the tel: and sms: targets are
 * pinned in test/settings-help.test.ts and test/struggling-regions.test.ts, and re-checked below.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { colorVars } from '../../../packages/design-tokens/src/build-css';
import { HELPLINES } from '@scribe/content';
import { lineActions } from '../src/components/settings/struggling.logic';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const code = (rel: string) => read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** WCAG 2.x contrast of two #RRGGBB colours. */
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (h: string) => {
  const [r, g, b] = rgb(h).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The colour name a class like `bg-muted` or `border-input` stands for, in one mode. */
const colourOf = (cls: string, mode: 'light' | 'dark', hc = false) => {
  const vars = colorVars(mode, hc);
  const name = cls.replace(/^(bg|border|text)-/, '');
  const v = vars[name];
  if (!v) throw new Error(`no colour token for class ${cls}`);
  return v;
};

/** The class a variant of the real component hands out. */
const variantClass = (file: string, variant: string): string => {
  const m = new RegExp(`\\b${variant}:\\s*'([^']+)'`).exec(read(file));
  if (!m) throw new Error(`${variant} not found in ${file}`);
  return m[1];
};

const card = code('components/settings/helpline-card.tsx');
const cardFill = variantClass('components/ui/card.tsx', 'flat'); // 'bg-muted'
const outline = variantClass('components/ui/button.tsx', 'outline'); // 'border border-input bg-transparent'
const secondary = variantClass('components/ui/button.tsx', 'secondary'); // 'bg-secondary'

describe('[WCAG 1.4.11] Call and Text keep a visible shape on the flat helpline card', () => {
  it('the card is the flat variant, so its fill is the muted surface', () => {
    expect(card).toMatch(/<Card variant="flat"/);
    expect(cardFill).toBe('bg-muted');
  });

  it('why not secondary: its accentSoft fill is under 1.5:1 against that surface in light and in dark (1.08 and 1.33)', () => {
    expect(secondary).toBe('bg-secondary');
    for (const mode of ['light', 'dark'] as const) {
      expect(ratio(colourOf(secondary, mode), colourOf(cardFill, mode)), mode).toBeLessThan(1.5);
    }
    expect(ratio(colourOf(secondary, 'light'), colourOf(cardFill, 'light'))).toBeCloseTo(1.08, 2);
    expect(ratio(colourOf(secondary, 'dark'), colourOf(cardFill, 'dark'))).toBeCloseTo(1.33, 2);
  });

  it('the outline edge is the control-border token and is at least 3:1 against the card in light, dark and Increase Contrast', () => {
    expect(outline).toMatch(/\bborder border-input\b/);
    expect(outline).toMatch(/\bbg-transparent\b/); // it leaves the card's own fill: nothing is added to the surface
    for (const mode of ['light', 'dark'] as const) {
      for (const hc of [false, true]) {
        expect(ratio(colourOf('border-input', mode, hc), colourOf(cardFill, mode, hc)), `${mode}${hc ? ' high contrast' : ''}`).toBeGreaterThanOrEqual(3);
      }
    }
    expect(ratio(colourOf('border-input', 'light'), colourOf(cardFill, 'light'))).toBeCloseTo(3.36, 2);
    expect(ratio(colourOf('border-input', 'dark'), colourOf(cardFill, 'dark'))).toBeCloseTo(4.27, 2);
  });

  it('whatever variant the card uses draws a shape (a fill or an edge) of at least 3:1 against the card, in light, dark and Increase Contrast', () => {
    const used = /size="sm"\s+variant="(\w+)"/.exec(card)?.[1];
    expect(used).toBeTruthy();
    const classes = variantClass('components/ui/button.tsx', used!).split(/\s+/);
    // The colours the variant paints: its fill (bg-*, unless transparent) and its edge (a border-* colour).
    const paint = classes.filter((c) => (/^bg-/.test(c) && c !== 'bg-transparent') || (/^border-/.test(c) && c !== 'border'));
    expect(paint.length, `${used} paints nothing`).toBeGreaterThan(0);
    for (const mode of ['light', 'dark'] as const) {
      for (const hc of [false, true]) {
        const best = Math.max(...paint.map((c) => ratio(colourOf(c, mode, hc), colourOf(cardFill, mode, hc))));
        expect(best, `${used}, ${mode}${hc ? ' high contrast' : ''}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('Increase Contrast reaches the outline edge: the provider sets --color-input from the high-contrast controlBorder', () => {
    // The 12.98:1 and 14.94:1 figures above come from the token table. This pins the line that applies them on a phone.
    expect(code('components/ui/provider.tsx')).toMatch(/'--color-input':\s*hc\.controlBorder/);
  });

  it('the outline label stays readable on the card (4.5:1), in both modes', () => {
    expect(read('components/ui/button.tsx')).toMatch(/outline: 'text-foreground'/);
    for (const mode of ['light', 'dark'] as const) {
      expect(ratio(colourOf('text-foreground', mode), colourOf(cardFill, mode)), mode).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('HelplineCard draws Call and Text as outline buttons, and nothing on the card is a secondary button', () => {
    expect(card).toMatch(/size="sm"\s+variant="outline"/);
    expect(card).not.toMatch(/variant="secondary"/);
    // The two pages draw their lines through HelplineCard, so neither brings a pale button of its own.
    for (const f of ['app/settings/struggling.tsx', 'app/settings/struggling-elsewhere.tsx']) {
      const page = code(f);
      expect(page, f).not.toMatch(/variant="secondary"/);
    }
  });

  it('colour comes from the tokens only: no hex, rgb or hsl literal on the card', () => {
    expect(card).not.toMatch(/#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?)\(/);
    expect(card).not.toMatch(/\bstyle=\{/);
  });
});

describe('words and behaviour of Call and Text are unchanged', () => {
  it('the card still passes the same label, VoiceOver label, hints, press and test ids', () => {
    expect(card).toMatch(/label=\{a\.label\}/);
    expect(card).toMatch(/accessibilityLabel=\{a\.a11y\}/);
    expect(card).toMatch(/accessibilityHint=\{a\.kind === 'call' \? callHint : copy\.helpLinks\.textHint\}/);
    expect(card).toMatch(/onPress=\{\(\) => open\(a\.target\)\}/);
    expect(card).toMatch(/testID=\{`struggling\.\$\{line\.id\}\.\$\{a\.kind\}`\}/);
  });

  it('every held line still gives Call (tel:) and, where it has a text number, Text (sms:)', () => {
    const lines = HELPLINES.flatMap((r) => r.lines);
    expect(lines.length).toBeGreaterThan(0);
    for (const line of lines) {
      const actions = lineActions(line);
      const call = actions.find((a) => a.kind === 'call');
      expect(call?.target.url ?? '', line.id).toMatch(/^tel:/);
      const text = actions.find((a) => a.kind === 'text');
      if (text) expect(text.target.url, line.id).toMatch(/^sms:/);
    }
  });
});
