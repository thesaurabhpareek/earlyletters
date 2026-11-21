import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { nativeCss, webCss } from '../src/build-css';
import { tokens } from '../src/tokens';

/** Design language v2 additions (issue #1221 T1 to T6). Contrast pairs for the new colours are in tokens.test.ts. */
const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (h: string) => {
  const c = hex(h).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

describe('v2 colour (T1)', () => {
  it('dark surface steps up from the page (surfaceRaised #27231F is deferred: it is bound to brand.colors.paperRaisedDark)', () => {
    expect(tokens.dark.surface).toBe('#1D1A17');
    expect(ratio(tokens.dark.surface, tokens.dark.bg)).toBeGreaterThan(1.05);
    expect(tokens.dark.surfaceRaised).toBe('#201D1A');
  });
  it('highlight is a translucent white edge, and barFallback is the opaque page colour in both schemes', () => {
    expect(tokens.light.highlight).toBe('#FFFFFFB3');
    expect(tokens.dark.highlight).toBe('#FFFFFF14');
    for (const m of ['light', 'dark'] as const) {
      expect(tokens[m].barFallback).toBe(tokens[m].bg);
      expect(tokens[m].barFallback).toMatch(/^#[0-9A-F]{6}$/i); // opaque: Reduce Transparency means no see-through
    }
  });
  it('under Increase Contrast the highlight is drawn at line strength, and that edge is at least 3:1 on every surface', () => {
    for (const m of ['light', 'dark'] as const) {
      expect(tokens.highContrast[m].highlight).toBe(tokens.highContrast[m].line);
      for (const s of ['bg', 'surface', 'surfaceRaised', 'barFallback'] as const) {
        expect(ratio(tokens.highContrast[m].highlight, tokens[m][s]), `${m} ${s}`).toBeGreaterThanOrEqual(3);
      }
    }
  });
  it('the new colours reach the generated CSS in both flavours', () => {
    for (const css of [nativeCss(), webCss()]) {
      expect(css).toContain(`--color-highlight: ${tokens.light.highlight};`);
      expect(css).toContain(`--color-bar-fallback: ${tokens.dark.barFallback};`);
    }
    expect(webCss()).toContain(`--color-highlight: ${tokens.highContrast.light.highlight};`);
  });
});

describe('v2 type (T2)', () => {
  const t = tokens.type;
  it('kicker, cardTitle and timer have the ladder values', () => {
    expect(t.kicker).toMatchObject({ fontFamily: tokens.fontFamily.sansMedium, fontSize: 14, lineHeight: 18, letterSpacing: 0.1, dynamicTypeStyle: 'footnote', maxScale: null });
    expect(t.cardTitle).toMatchObject({ fontFamily: tokens.fontFamily.serifMedium, fontSize: 22, lineHeight: 28, maxScale: 2 });
    expect(t.timer).toMatchObject({ fontSize: 40, lineHeight: 44, dynamicTypeStyle: 'title1', maxScale: 1.6 });
  });
  it('the timer sets tabular figures so digits do not shift each second; kicker text is never capped', () => {
    expect(t.timer.fontVariant).toEqual(['tabular-nums']);
    expect(t.kicker.maxScale).toBeNull();
  });
  it('the paragraph gap is 12 and the reading column caps at 560 pt, lifted at accessibility sizes', () => {
    expect(tokens.letterParagraphGap).toBe(12);
    expect(tokens.readingMeasure.maxWidth).toBe(560);
    expect(tokens.readingColumnWidth(800, 1)).toBe(560);
    expect(tokens.readingColumnWidth(390, 1)).toBe(390);
    expect(tokens.readingColumnWidth(800, tokens.readingMeasure.liftAtScale)).toBe(800); // AX: full width, never narrower
    expect(tokens.readingColumnWidth(800, 3.1)).toBe(800);
  });
});

describe('v2 radius (T3)', () => {
  it('md 18, lg 24, xl 34; the scale still climbs', () => {
    expect(tokens.radius).toMatchObject({ sm: 8, md: 18, lg: 24, xl: 34, pill: 9999 });
    expect(tokens.radius.sm).toBeLessThan(tokens.radius.md);
    expect(tokens.radius.md).toBeLessThan(tokens.radius.lg);
    expect(tokens.radius.lg).toBeLessThan(tokens.radius.xl);
  });
  it('concentric is the container radius minus the inset, never below 4', () => {
    expect(tokens.concentric(24, 8)).toBe(16);
    expect(tokens.concentric(tokens.radius.lg, tokens.space[4])).toBe(8);
    expect(tokens.concentric(18, 16)).toBe(4);
    expect(tokens.concentric(10, 40)).toBe(4);
  });
});

describe('v2 elevation (T4)', () => {
  it('levels 1 to 3 are two layers: a soft ambient layer under a larger key layer, both rising by level', () => {
    for (const l of [1, 2, 3] as const) {
      const e = tokens.elevation[l];
      expect(e.web.split('rgba(').length - 1, `web ${l}`).toBe(2);
      expect(e.ambient.shadowRadius).toBeLessThan(e.shadowRadius);
      expect(e.ambient.shadowOffset.height).toBeLessThan(e.shadowOffset.height);
    }
    expect(tokens.elevation[1].web).toBe('0 1px 2px rgba(43,39,34,0.06), 0 4px 12px rgba(43,39,34,0.05)');
    expect(tokens.elevation[3].shadowRadius).toBeGreaterThan(tokens.elevation[2].shadowRadius);
    expect(tokens.elevation[2].shadowRadius).toBeGreaterThan(tokens.elevation[1].shadowRadius);
  });
  it('level 0 is flat', () => {
    expect(tokens.elevation[0].web).toBe('none');
    expect(tokens.elevation[0].ambient.shadowOpacity).toBe(0);
  });
});

describe('v2 spacing (T5)', () => {
  const l = tokens.layout;
  it('gutter is 16 compact and 20 regular, compact below 390 pt, so iPhone SE 3 (375) keeps 16', () => {
    expect(l.gutter).toEqual({ compact: tokens.space[4], regular: tokens.space[5] });
    expect(l.compactBelowWidth).toBe(390);
    expect(375).toBeLessThan(l.compactBelowWidth);
  });
  it('section gap is space.9 compact and space.10 regular; list rows are 52, never under the 44 pt target', () => {
    expect(l.sectionGap).toEqual({ compact: tokens.space[9], regular: tokens.space[10] });
    expect(l.listRowMin).toBe(52);
    expect(l.listRowMin).toBeGreaterThanOrEqual(tokens.target.min);
  });
  it('the web CSS carries them, and the committed dist/ files match (regenerated)', () => {
    const web = webCss();
    for (const v of ['--gutter-compact: 16px;', '--gutter-regular: 20px;', '--section-gap-regular: 48px;', '--list-row-min: 52px;', '--reading-measure: 560px;', '--radius-md: 18px;']) expect(web).toContain(v);
    expect(readFileSync(join(__dirname, '..', 'dist', 'tokens.web.css'), 'utf8')).toBe(web);
  });
});

describe('v2 motion (T6)', () => {
  const h = tokens.motion.heroEnter;
  it('heroEnter moves content 12 pt over 420 ms, inside the sequence ceiling and slower than a plain entry', () => {
    expect(h).toMatchObject({ dy: 12, durationMs: 420 });
    expect(h.durationMs).toBeLessThanOrEqual(tokens.motion.sequenceMaxMs);
    expect(h.durationMs).toBeGreaterThan(tokens.motion.enter.durationMs);
  });
  it('Reduce Motion turns it into the 200 ms cross-fade with no travel', () => {
    expect(h.reduceMotion).toEqual(tokens.motion.reduceMotion);
    expect(h.reduceMotion.durationMs).toBe(tokens.motion.fadeMs);
  });
});
