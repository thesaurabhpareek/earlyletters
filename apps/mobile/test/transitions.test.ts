/**
 * The screen-transition standard (lib/transitions.logic.ts, EXPERIENCE_PASS 5.8, MOTION 5l) and the motion
 * primitives built on it: page turn, card to page, excerpt fade, the stroke tables, and the disabled button. Node
 * cannot load React Native, so the screens' use of the standard is checked in their source.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import { FADE_FRACTION, fadeBox, isRtl, lineHeightFor, overflows } from '../src/components/motion/excerpt-fade.logic';
import { LINE_ART, LINE_ART_NAMES, artHeight, penWidth, strokeProgress } from '../src/components/ui/line-art.data';
import { ROOT_ROUTE_CONTEXT } from '../src/lib/navigation.logic';
import {
  HAND_OFF,
  ROUTES,
  SWIPE,
  canCarry,
  cardBackMove,
  cardToPageFrame,
  carryFrame,
  fileIntoMonthPlan,
  moveOptions,
  pageTurnPlan,
  routeTransitions,
  sheetMotion,
  stepMotion,
  swipeOutcome,
  type Move,
  type RootRoute,
} from '../src/lib/transitions.logic';

const M = tokens.motion;
const MOVES: Move[] = ['none', 'dissolve', 'sheet', 'push', 'cardToPage'];
const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const ROUTE_NAMES = Object.keys(ROUTES) as RootRoute[];

describe('routeTransitions: one table for every route (EXPERIENCE_PASS 5.8)', () => {
  it('every root route has a row and a move', () => {
    for (const route of Object.keys(ROOT_ROUTE_CONTEXT)) expect(ROUTES, route).toHaveProperty(route);
    for (const r of Object.values(ROUTES)) expect(MOVES).toContain(r.move);
  });

  it('rows 1, 4 and 8: Listen, Review and Read together are full screen and dissolve, on the route token', () => {
    const t = routeTransitions(false);
    for (const route of ['listen', 'review', 'read-together'] as const) {
      expect(t[route], route).toEqual({ presentation: 'fullScreenModal', animation: 'fade', animationDuration: M.route.dissolveMs });
    }
  });

  it('row 4: Review is full screen, not a page sheet, so Listen hands to it with no change of shape', () => {
    expect(ROUTES.review.presentation).toBe('fullScreenModal');
    expect(ROUTES.listen.presentation).toBe(ROUTES.review.presentation);
  });

  it('native first: Write and the sign-in, invite and purchase sheets rise as the platform does; Settings pushes; tabs swap', () => {
    const t = routeTransitions(false);
    for (const route of ['write', '(auth)', 'invite', 'plus/confirmed'] as const) expect(t[route], route).toEqual({ presentation: 'modal' });
    expect(t.settings).toEqual({});
    expect(t['(tabs)']).toEqual({});
    expect(t.onboarding).toEqual({});
  });

  it('row 7: the letter keeps the platform push until its page mounts CardToPage (P5), so nothing appears without motion', () => {
    expect(ROUTES['letter/[id]'].move).toBe('push');
    expect(routeTransitions(false)['letter/[id]']).toEqual({});
    expect(moveOptions('cardToPage', false)).toEqual({ presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } });
    expect(moveOptions('cardToPage', true)).toEqual(moveOptions('cardToPage', false)); // CardToPage cross-fades itself
  });

  it('Reduce Motion (rule 6): our dissolves become one fadeMs cross-fade; native pushes and sheets keep the system transition', () => {
    const t = routeTransitions(true);
    for (const route of ['listen', 'review', 'read-together'] as const) expect(t[route].animationDuration, route).toBe(M.fadeMs);
    expect(t.write).toEqual({ presentation: 'modal' });
    expect(t.settings).toEqual({});
    expect(sheetMotion(true)).toEqual({ kind: 'fade', durationMs: M.fadeMs }); // our own sheet: nothing slides
    expect(pageTurnPlan('next', true)).toMatchObject({ outDx: 0, inDx: 0, outMs: M.fadeMs, inMs: M.fadeMs });
    expect(stepMotion(true)).toEqual({ leave: { dy: 0, durationMs: M.fadeMs }, arrive: { dy: 0, durationMs: M.fadeMs, staggerMs: 0 } });
  });

  it('every duration in the table is a token and fits the sequence', () => {
    for (const r of [false, true]) {
      for (const name of ROUTE_NAMES) {
        const d = routeTransitions(r)[name].animationDuration;
        if (d !== undefined) expect([M.fadeMs, M.route.dissolveMs], name).toContain(d);
      }
    }
    expect(M.route.dissolveMs).toBeLessThanOrEqual(M.sequenceMaxMs);
  });

  it('the root layout reads the table for every route and types no presentation, animation or duration', () => {
    const layout = read('app/_layout.tsx').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    expect(layout).toMatch(/useRouteTransitions\(\)/);
    for (const route of ROUTE_NAMES) {
      const access = /^[a-z]+$/.test(route) ? `routes.${route}` : `routes['${route}']`;
      expect(layout, route).toContain(access);
    }
    expect(layout).not.toMatch(/presentation:|animation:|animationDuration/);
  });

  it('tabs keep the native swap (row 6): the tab layout adds no transition; the lamp carries the change', () => {
    const tabs = read('app/(tabs)/_layout.tsx');
    expect(tabs).not.toMatch(/sceneStyleInterpolator|transitionSpec|animation:/);
  });

  it('the Sheet reads its motion from the standard', () => {
    const s = M.standard;
    expect(sheetMotion(false)).toEqual({ kind: 'spring', stiffness: s.stiffness, damping: s.damping, mass: s.mass });
    expect(read('components/ui/sheet.tsx')).toMatch(/useSheetMotion\(\)/);
  });
});

describe('inside a screen', () => {
  it('first run steps: words leave up 8 pt over exitMs and the next rise in', () => {
    expect(stepMotion(false)).toEqual({ leave: { dy: -8, durationMs: M.exitMs }, arrive: { dy: 8, durationMs: M.enter.durationMs, staggerMs: M.staggerMs } });
  });

  it('the saved moment files the letter in order and the modal leaves by the end of the sequence (MOTION 5e)', () => {
    const p = fileIntoMonthPlan(false);
    expect(p).toMatchObject({ scaleTo: M.file.scale, chipAtMs: M.file.chipAtMs, moveAtMs: M.file.moveAtMs, dy: M.file.dy, dismissAtMs: M.sequenceMaxMs, arrivalWashMs: M.newMarkMs });
    expect(p.chipAtMs).toBeLessThan(p.moveAtMs!);
    expect(p.moveAtMs!).toBeLessThan(p.dismissAtMs);
  });

  it('row 5: Review fades out and the Book is on screen on the new letter in about 1.1 s, under the 2 s ceiling', () => {
    const p = fileIntoMonthPlan(false);
    expect(p.leaveMs).toBe(M.fadeMs);
    expect(p.bookAtMs).toBe(M.sequenceMaxMs + M.fadeMs);
    expect(p.bookAtMs).toBeLessThanOrEqual(1200);
    expect(p.bookAtMs).toBeLessThan(M.hardCeilingMs);
    expect(p.bookLampMs).toBe(M.lamp.returnMs);
    expect(fileIntoMonthPlan(true).bookLampMs).toBe(0);
  });

  it('Reduce Motion: the chip and its line fade in, nothing travels, and the line can be read for as long', () => {
    const r = fileIntoMonthPlan(true);
    expect(r).toMatchObject({ scaleTo: 1, moveAtMs: null, dy: 0, chipFadeMs: M.fadeMs, washStatic: true });
    expect(r.dismissAtMs).toBe(fileIntoMonthPlan(false).dismissAtMs);
  });

  it('a page turn leaves 24 pt toward where it is going and arrives from the other side', () => {
    expect(pageTurnPlan('next', false)).toMatchObject({ outDx: -24, outMs: M.exitMs, inDx: 24, inMs: M.fadeMs });
    expect(pageTurnPlan('back', false)).toMatchObject({ outDx: 24, outMs: M.exitMs, inDx: -24, inMs: M.fadeMs });
    expect(Math.abs(pageTurnPlan('next', false).outDx)).toBe(M.pageTurn.dx);
  });

  it('the words hand off: the old page is gone early, the new one starts as the old is half gone, all inside the sequence', () => {
    const p = pageTurnPlan('next', false);
    expect(p.fadeOutMs).toBe(Math.round(M.exitMs * (1 - HAND_OFF)));
    expect(p.fadeOutMs).toBeLessThan(p.outMs);
    expect(p.inDelayMs).toBe(Math.round(p.fadeOutMs / 2));
    expect(p.inDelayMs + p.inMs).toBeLessThanOrEqual(M.sequenceMaxMs);
    expect(pageTurnPlan('next', true)).toMatchObject({ fadeOutMs: M.fadeMs, inDelayMs: 0 }); // Reduce Motion: a plain cross-fade
  });

  it('a swipe turns the page past a quarter of the width or when flung, and settles back otherwise', () => {
    const w = 402;
    expect(SWIPE).toEqual({ fraction: 0.25, velocity: 600 });
    expect(swipeOutcome(-w * 0.3, 0, w)).toBe('next');
    expect(swipeOutcome(w * 0.3, 0, w)).toBe('back');
    expect(swipeOutcome(-20, -900, w)).toBe('next');
    expect(swipeOutcome(20, 900, w)).toBe('back');
    expect(swipeOutcome(-40, -100, w)).toBeNull();
  });
});

describe('card to page (MOTION 5f)', () => {
  const screen = { width: 402, height: 874 };
  const card = { x: 16, y: 320, width: 370, height: 148 };

  it('starts exactly on the card with its corners, and ends as the whole screen with square corners', () => {
    expect(cardToPageFrame(card, screen, 0)).toMatchObject({ x: 16, y: 320, width: 370, height: 148, radius: tokens.radius.md, contentOpacity: 0, dim: 0 });
    const end = cardToPageFrame(card, screen, 1);
    expect(end).toMatchObject({ x: 0, y: 0, width: 402, height: 874, radius: 0, contentOpacity: 1 });
    expect(1 - end.dim).toBeCloseTo(M.cardToPage.behindDim);
  });

  it("the page's own words arrive only from 60 percent of the way, and a spring's overshoot is clamped", () => {
    expect(cardToPageFrame(card, screen, M.cardToPage.contentFrom).contentOpacity).toBe(0);
    expect(cardToPageFrame(card, screen, 0.8).contentOpacity).toBeCloseTo(0.5);
    expect(cardToPageFrame(card, screen, 1.08)).toEqual(cardToPageFrame(card, screen, 1));
  });

  it('back shrinks into the card while it is on screen, and fades when it is gone or was never measured', () => {
    expect(cardBackMove(card, screen)).toBe('shrink');
    expect(cardBackMove({ ...card, y: -400 }, screen)).toBe('fade');
    expect(cardBackMove(undefined, screen)).toBe('fade');
  });

  // The card's words: dateline and two lines at 32 from the edge; on the page the same column opens 92 from the top.
  const cardText = { x: 32, y: 336, width: 338, height: 88 };
  const pageText = { x: 32, y: 92, width: 338, height: 214 };

  it("the card's own words are carried, never redrawn: they start exactly where they were and end where the page puts them", () => {
    const start = carryFrame(card, cardText, pageText, screen, 0);
    // The rest may show only down to the card's own bottom edge, and not yet: it is still clear.
    expect(start).toMatchObject({ x: 32, y: 336, excerpt: 88, extra: 320 + 148 - (336 + 88), extraOpacity: 0, cardFade: 1 });
    const end = carryFrame(card, cardText, pageText, screen, 1);
    expect(end).toMatchObject({ x: 32, y: 92, excerpt: 88, extra: 214 - 88, extraOpacity: 1, cardFade: 0 });
  });

  it('at every frame the excerpt is whole (never an empty card or page), and only the rest fades in, inside the paper', () => {
    for (let i = 0; i <= 50; i++) {
      const t = i / 50;
      const k = carryFrame(card, cardText, pageText, screen, t);
      const f = cardToPageFrame(card, screen, t);
      expect(k.excerpt).toBe(cardText.height);
      // The carried words sit inside the paper, and the rest never draws past its bottom edge.
      expect(k.x).toBeGreaterThanOrEqual(f.x - 1e-9);
      expect(k.y).toBeGreaterThanOrEqual(f.y - 1e-9);
      expect(k.x + pageText.width).toBeLessThanOrEqual(f.x + f.width + 1e-9);
      expect(k.y + k.excerpt + k.extra).toBeLessThanOrEqual(f.y + f.height + 1e-9);
      // The rest of the words arrive with the rest of the page, and the card's fade gives way to them.
      expect(k.extraOpacity).toBeCloseTo(f.contentOpacity);
      expect(k.cardFade + k.extraOpacity).toBeCloseTo(1);
    }
  });

  it("carries only when the page opens in the card's column, so the lines wrap the same; otherwise the page fades in whole", () => {
    expect(canCarry(cardText, pageText)).toBe(true);
    expect(canCarry(cardText, { ...pageText, width: 362 })).toBe(false);
    expect(canCarry(undefined, pageText)).toBe(false);
    expect(canCarry(cardText, undefined)).toBe(false);
    expect(canCarry(cardText, { ...pageText, height: 40 })).toBe(false);
  });

  it('the card names its words and the page its opening; the fallback fades paper and words together (source)', () => {
    const src = readFileSync(join(__dirname, '..', 'src', 'components', 'motion', 'card-transition.tsx'), 'utf8');
    expect(src).toMatch(/export function CardText\b/);
    expect(src).toMatch(/export function PageOpening\b/);
    // Faded: the content takes the same opacity as the paper (fade.value), so no frame shows paper without words.
    expect(src).toContain('opacity: carrying.value ? cardToPageFrame(from.value, screen, p.value).contentOpacity : fade.value');
  });
});

describe('excerpt fade', () => {
  it('fades the last 40 percent of the last visible line, at the end the line runs toward', () => {
    expect(FADE_FRACTION).toBe(0.4);
    expect(fadeBox(2, 32, false)).toEqual({ top: 32, height: 32, widthPct: 40, side: 'right' });
    expect(fadeBox(2, 32, true).side).toBe('left');
  });

  it('knows right-to-left text by its first strong letter (Arabic is one of the seven languages)', () => {
    expect(isRtl('اليوم ضحكت')).toBe(true);
    expect(isRtl('Asha laughed')).toBe(false);
    expect(isRtl('2024: اليوم')).toBe(true);
    expect(isRtl('आज आशा हँसी')).toBe(false);
  });

  it('line height follows Dynamic Type up to the style cap, and Reading Size multiplies it', () => {
    expect(lineHeightFor('letterBody')).toBe(32);
    expect(lineHeightFor('letterBody', 2)).toBe(64); // letter text is never capped
    expect(lineHeightFor('title1', 3)).toBeCloseTo(34 * 1.8); // capped at its maxScale
    expect(lineHeightFor('letterBody', 1, tokens.readingScale.largePrint)).toBeCloseTo(32 * 1.45);
  });

  it('only words that run past their lines get the fade', () => {
    expect(overflows(64, 2, 32)).toBe(false);
    expect(overflows(96, 2, 32)).toBe(true);
  });

  it('no excerpt or cover sets numberOfLines, the prop that draws an ellipsis glyph', () => {
    for (const f of ['components/motion/excerpt-fade.tsx', 'components/book/book-cover.tsx']) expect(read(f).replace(/\/\*[\s\S]*?\*\//g, ''), f).not.toMatch(/numberOfLines=|ellipsizeMode=/);
  });
});

describe('stroke tables (the website drawings, ported)', () => {
  it('the app keeps its drawings and gains the website moon, lamp, window and reading lamp', () => {
    expect(LINE_ART_NAMES.sort()).toEqual(['envelope', 'envelopeOpen', 'lamp', 'moon', 'page', 'readingLamp', 'together', 'window']);
  });

  it('every stroke draws inside the drawing time, in order, with a measured length', () => {
    for (const name of LINE_ART_NAMES) {
      for (const s of LINE_ART[name].strokes) {
        expect(s.from, name).toBeGreaterThanOrEqual(0);
        expect(s.to, name).toBeLessThanOrEqual(1);
        expect(s.from, name).toBeLessThan(s.to);
        expect(s.length, name).toBeGreaterThan(0);
      }
      expect(Math.max(...LINE_ART[name].strokes.map((s) => s.to)), name).toBe(1);
    }
  });

  it('the moon is the website crescent, one continuous line, with no sparkle', () => {
    expect(LINE_ART.moon.strokes).toHaveLength(1);
    expect(LINE_ART.moon.strokes[0].d.match(/M/g)).toHaveLength(1);
  });

  it('a stroke has drawn nothing before its window and all of it after', () => {
    const s = { from: 0.4, to: 0.6 };
    expect(strokeProgress(s, 0.2)).toBe(0);
    expect(strokeProgress(s, 0.5)).toBeCloseTo(0.5);
    expect(strokeProgress(s, 0.9)).toBe(1);
  });

  it('the pen is the same 1.75 pt on screen at any size, and each drawing keeps its own shape', () => {
    expect(penWidth('page', 160)).toBeCloseTo(1.75);
    expect(penWidth('window', 124) * (124 / LINE_ART.window.viewBox[2])).toBeCloseTo(1.75);
    expect(artHeight('page', 168)).toBe(126);
    expect(artHeight('moon', 168)).toBe(126); // the crescent keeps the old moon's 4:3 box
  });
});

describe('the disabled button', () => {
  it('a filled button that is not ready is an outline (controlBorder, no fill), never the pale fill', () => {
    const b = read('components/ui/button.tsx').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(b).toMatch(/const DISABLED_FILLED = 'border border-input bg-transparent'/);
    expect(b).toMatch(/disabled && filled && DISABLED_FILLED/);
    expect(b).not.toMatch(/disabled && filled && 'bg-muted'/);
  });
});
