/**
 * The screen-transition standard (lib/transitions.logic.ts, EXPERIENCE_PASS 5.8, MOTION 5l) and the motion
 * primitives built on it: page turn, card to page, excerpt fade, the stroke tables, and the disabled button. Node
 * cannot load React Native, so the screens' use of the standard is checked in their source.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import { FADE_FRACTION, fadeBox, isRtl, lineHeightFor, overflows } from '../src/components/motion/excerpt-fade.logic';
import { LINE_ART, LINE_ART_NAMES, artHeight, penWidth, strokeProgress } from '../src/components/ui/line-art.data';
import { ROOT_ROUTE_CONTEXT } from '../src/lib/navigation.logic';
import {
  CARD_TO_PAGE,
  HAND_OFF,
  ROUTES,
  SWIPE,
  canCarry,
  carriedHome,
  cardBackMove,
  cardToPageFrame,
  cardWasCut,
  carryFrame,
  createCoverStore,
  clearProgress,
  hiddenBehind,
  veilIn,
  veilOut,
  type Rect,
  fileIntoMonthPlan,
  moveOptions,
  openedAtRoot,
  pageTurnPlan,
  paperTone,
  routeTransitions,
  sheetMotion,
  stepMotion,
  swipeOutcome,
  tabsInStack,
  type Move,
  type RootRoute,
} from '../src/lib/transitions.logic';

const M = tokens.motion;
const MOVES: Move[] = ['none', 'dissolve', 'sheet', 'push', 'cardToPage', 'cut'];
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
  });

  it('R1: first run cuts in under both settings, so it never slides in from a tab on iOS', () => {
    expect(ROUTES.onboarding.move).toBe('cut');
    expect(routeTransitions(false).onboarding).toEqual({ animation: 'none' });
    expect(routeTransitions(true).onboarding).toEqual({ animation: 'none' });
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

describe('first run opens directly (R1)', () => {
  it('a launch with no address, at "/" on the web, on the bare scheme or through a development launcher is at the root', () => {
    for (const url of [null, undefined, '', 'http://localhost:8081/', 'http://localhost:8081/?seed=asha', 'https://example.org', 'scribe://', 'scribe:///', 'exp+scribe://expo-development-client/?url=http%3A%2F%2F192.168.1.2%3A8081']) {
      expect(openedAtRoot(url), String(url)).toBe(true);
    }
  });

  it('any other launch is a link, whatever +native-intent makes of it', () => {
    for (const url of ['https://example.org/i/abc', 'http://localhost:8081/onboarding', 'http://localhost:8081/invite', 'scribe://listen', 'scribe://auth/callback', 'scribe:///book', 'not a url']) {
      expect(openedAtRoot(url), url).toBe(false);
    }
  });

  it('with no book at the root, the tabs are not in the stack; a book, a link or an earlier book puts them in', () => {
    expect(tabsInStack({ hasBook: false, openedAtRoot: true, hadTabs: false })).toBe(false);
    expect(tabsInStack({ hasBook: true, openedAtRoot: true, hadTabs: false })).toBe(true);
    expect(tabsInStack({ hasBook: false, openedAtRoot: false, hadTabs: false })).toBe(true);
    expect(tabsInStack({ hasBook: false, openedAtRoot: true, hadTabs: true })).toBe(true);
  });

  it('over one session the tabs join once and then stay, so no later route loses the room under it', () => {
    let hadTabs = false;
    const seen: boolean[] = [];
    for (const hasBook of [false, false, true, true, false, false]) {
      const tabs = tabsInStack({ hasBook, openedAtRoot: true, hadTabs });
      hadTabs ||= tabs;
      seen.push(tabs);
    }
    expect(seen).toEqual([false, false, true, true, true, true]);
  });

  it('the root layout guards only the tabs, by that rule, read from the store as it changes', () => {
    const layout = read('app/_layout.tsx').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
    const guarded = [...layout.matchAll(/<Stack\.Protected guard=\{(\w+)\}>([\s\S]*?)<\/Stack\.Protected>/g)];
    expect(guarded).toHaveLength(1);
    expect(guarded[0][1]).toBe('tabs');
    expect([...guarded[0][2].matchAll(/name="([^"]+)"/g)].map((m) => m[1])).toEqual(['(tabs)']);
    expect(layout).toMatch(/const tabs = useTabsInStack\(\)/);
    expect(layout).toMatch(/openedAtRoot\(getLinkingURL\(\)\)/);
    expect(layout).toMatch(/useSyncExternalStore\(subscribeToBook, hasBookNow, hasBookNow\)/);
    expect(layout).toMatch(/tabsInStack\(\{ hasBook, openedAtRoot: atRoot, hadTabs \}\)/);
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
    expect(cardToPageFrame(card, screen, 0)).toMatchObject({ x: 16, y: 320, width: 370, height: 148, radius: tokens.radius.md, contentOpacity: 0 });
    expect(cardToPageFrame(card, screen, 1)).toMatchObject({ x: 0, y: 0, width: 402, height: 874, radius: 0, contentOpacity: 1 });
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
  const cardText = { x: 32, y: 336, width: 338, height: 88, lineHeight: 32 };
  const pageText = { x: 32, y: 92, width: 338, height: 214, lineHeight: 32 };

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
      // The rest of the words arrive with the rest of the page, and the card's fade gives way as they begin to.
      expect(k.extraOpacity).toBeCloseTo(f.contentOpacity);
      expect(k.cardFade).toBe(t <= M.cardToPage.contentFrom ? 1 : t >= CARD_TO_PAGE.toneFrom ? 0 : k.cardFade);
    }
  });

  it("the card's fade over its last line is gone before the paper turns to the page's colour, so it is never a pale patch (P5)", () => {
    expect(CARD_TO_PAGE.toneFrom).toBeCloseTo(M.cardToPage.contentFrom + (1 - M.cardToPage.contentFrom) / 2);
    let last = 1;
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      const k = carryFrame(card, cardText, pageText, screen, t);
      // Drawn in the card's surface: only ever over paper of that same surface.
      if (paperTone(t) > 0) expect(k.cardFade, `at ${t}`).toBe(0);
      if (k.cardFade > 0) expect(paperTone(t), `at ${t}`).toBe(0);
      // It gives way steadily as the rest begins to arrive (and comes back the same way on the way back).
      expect(k.cardFade).toBeLessThanOrEqual(last + 1e-12);
      last = k.cardFade;
    }
    expect(paperTone(0)).toBe(0);
    expect(paperTone(CARD_TO_PAGE.toneFrom)).toBe(0);
    expect(paperTone(1)).toBe(1);
    expect(paperTone(1.08)).toBe(1); // a spring's overshoot is clamped
    expect(carryFrame(card, cardText, pageText, screen, (M.cardToPage.contentFrom + CARD_TO_PAGE.toneFrom) / 2).cardFade).toBeCloseTo(0.5);
  });

  it('the carried words are home once within homePt of their place on the page, for the rest of the page to come in (useCardToPagePhase)', () => {
    expect(CARD_TO_PAGE.homePt).toBe(4);
    const travel = Math.hypot(pageText.x - cardText.x, pageText.y - cardText.y);
    expect(carriedHome(cardText, pageText, 0)).toBe(false);
    expect(carriedHome(cardText, pageText, 1 - (CARD_TO_PAGE.homePt + 0.5) / travel)).toBe(false);
    expect(carriedHome(cardText, pageText, 1 - (CARD_TO_PAGE.homePt - 0.5) / travel)).toBe(true);
    expect(carriedHome(cardText, pageText, 1)).toBe(true);
    expect(carriedHome(cardText, pageText, 1.08)).toBe(true);
    // Words that open where the card had them are home from the start.
    expect(carriedHome(cardText, cardText, 0)).toBe(true);
  });

  it("carries only when the page opens in the card's column and type, so the lines wrap the same; otherwise the page fades in whole", () => {
    expect(canCarry(cardText, pageText)).toBe(true);
    expect(canCarry(cardText, { ...pageText, width: 362 })).toBe(false);
    expect(canCarry(undefined, pageText)).toBe(false);
    expect(canCarry(cardText, undefined)).toBe(false);
    expect(canCarry(cardText, { ...pageText, height: 40 })).toBe(false);
    // The same column at another type size (the page at Large Print Reading Size, the card at the default; or a
    // different Dynamic Type step) wraps differently: no carry.
    expect(canCarry(cardText, { ...pageText, lineHeight: lineHeightFor('letterBody', 1, tokens.readingScale.largePrint) })).toBe(false);
    expect(canCarry({ ...cardText, lineHeight: lineHeightFor('letterBody', 0.823) }, pageText)).toBe(false);
    expect(canCarry({ ...cardText, lineHeight: lineHeightFor('letterBody', 1.2) }, { ...pageText, lineHeight: lineHeightFor('letterBody', 1.2) })).toBe(true);
  });

  /** The standard spring the paper grows on, stepped finely (Reanimated solves the same equation): progress by ms. */
  const springAt = (() => {
    const s = M.standard;
    const perMs = 20;
    const dt = 1 / 1000 / perMs;
    const out: number[] = [0];
    let x = 0;
    let v = 0;
    for (let i = 1; i <= 1500 * perMs; i++) {
      v += ((-s.stiffness * (x - 1) - s.damping * v) / s.mass) * dt;
      x += v * dt;
      if (i % perMs === 0) out.push(x);
    }
    return (ms: number) => (ms <= 0 ? 0 : out[Math.min(out.length - 1, Math.floor(ms))]!);
  })();

  /** The move as it plays, ms by ms: the paper's progress and the veil, to the page (after the hold) or back to the card. */
  const timeline = (from: Rect, scr: { width: number; height: number }, way: 'toPage' | 'toCard') => {
    const frames: { t: number; p: number; veil: number }[] = [];
    const lift = clearProgress(from, scr);
    let liftAt: number | null = null;
    for (let t = 0; t <= 1200; t++) {
      if (way === 'toPage') {
        frames.push({ t, p: springAt(t - CARD_TO_PAGE.holdMs), veil: veilIn(t) });
        continue;
      }
      const p = 1 - springAt(t);
      if (liftAt === null && p <= lift) liftAt = t;
      frames.push({ t, p, veil: liftAt === null ? 1 : veilOut(t - liftAt) });
    }
    return frames;
  };

  /** The Book on three phones: its title, two letter cards with a dateline and two lines each, and its light. */
  const PHONES = [
    { name: 'SE', width: 375, height: 667 },
    { name: '17 Pro', width: 402, height: 874 },
    { name: 'Pro Max', width: 440, height: 956 },
  ];
  type Thing = Rect & { what: string; line: boolean };
  const book = (scr: { width: number; height: number }) => {
    const w = scr.width - 32;
    const words = (name: string, top: number): Thing[] => [
      { what: `${name}'s dateline`, x: 32, y: top + 16, width: 160, height: 18, line: true },
      { what: `${name}'s first line`, x: 32, y: top + 40, width: w - 32, height: 32, line: true },
      { what: `${name}'s second line`, x: 32, y: top + 72, width: w - 32, height: 32, line: true },
    ];
    const title: Thing = { what: "the Book's title", x: 16, y: 24, width: 220, height: 44, line: true };
    // The lamp, where its light is strongest (above the title) and at the far corner of the screen.
    const light: Thing[] = [
      { what: 'the lamp above the title', x: scr.width / 2 - 40, y: 0, width: 80, height: 20, line: false },
      { what: 'the lamp at the foot', x: 0, y: scr.height - 40, width: 40, height: 40, line: false },
    ];
    const a = { x: 16, y: 80, width: w, height: 120 };
    const b = { x: 16, y: 212, width: w, height: 120 };
    return [
      { name: 'card a', rect: a, things: [title, ...light, ...words('card b', b.y)] },
      { name: 'card b', rect: b, things: [title, ...light, ...words('card a', a.y)] },
    ];
  };
  const overlap = (r: Rect, o: Rect) => {
    const w = Math.min(r.x + r.width, o.x + o.width) - Math.max(r.x, o.x);
    const h = Math.min(r.y + r.height, o.y + o.height) - Math.max(r.y, o.y);
    return w > 0 && h > 0 ? (w * h) / (r.width * r.height) : 0;
  };
  /** How much of a thing on the Book is still seen: what the veil leaves of it, outside the paper. */
  const seen = (thing: Rect, paper: Rect, veil: number) => (1 - veil) * (1 - overlap(thing, paper));

  it('the Book leaves the way its lamp leaves a lit room: no part of it loses more than half its strength in 50 ms, and the title and the light take the whole 160 ms', () => {
    expect(CARD_TO_PAGE.veilInMs).toBe(M.lamp.leaveMs);
    expect(M.lamp.leaveMs).toBeGreaterThanOrEqual(160);
    for (const scr of PHONES) {
      for (const { name, rect, things } of book(scr)) {
        const frames = timeline(rect, scr, 'toPage');
        for (const thing of things) {
          const s = frames.map((f) => seen(thing, cardToPageFrame(rect, scr, f.p), f.veil));
          let worst = 0;
          for (let t = 0; t + 50 < s.length; t++) worst = Math.max(worst, s[t]! - s[t + 50]!);
          expect(worst, `${scr.name}, ${name} opens: ${thing.what}`).toBeLessThanOrEqual(0.5);
          if (thing.line && !thing.what.startsWith("the Book's")) continue;
          // The title and the light: not gone before the lamp's own leaving time.
          const gone = s.findIndex((v) => v <= 0.001);
          expect(gone, `${scr.name}, ${name} opens: ${thing.what} is gone by`).toBeGreaterThanOrEqual(M.lamp.leaveMs);
        }
      }
    }
  });

  it("no edge of the paper ever meets a line of the Book that can still be read (5 percent or more of it), either way, on any phone", () => {
    const inside = (r: Rect, o: Rect) => r.x >= o.x - 1e-9 && r.y >= o.y - 1e-9 && r.x + r.width <= o.x + o.width + 1e-9 && r.y + r.height <= o.y + o.height + 1e-9;
    let crossings = 0;
    for (const scr of PHONES) {
      for (const { name, rect, things } of book(scr)) {
        for (const way of ['toPage', 'toCard'] as const) {
          for (const f of timeline(rect, scr, way)) {
            const paper = cardToPageFrame(rect, scr, f.p);
            for (const l of things.filter((x) => x.line)) {
              if (overlap(l, paper) === 0 || inside(l, paper)) continue;
              crossings++;
              expect(1 - f.veil, `${scr.name}, ${name}, ${way}: ${l.what} at ${f.t} ms`).toBeLessThanOrEqual(0.05);
            }
          }
        }
      }
    }
    // The sweep did meet the lines (it is not passing for want of crossings).
    expect(crossings).toBeGreaterThan(500);
  });

  it("up to clearProgress every edge of the paper is within clearPt of the card, short of the next card's words", () => {
    for (const scr of PHONES) {
      for (const y of [0, 80, 212, scr.height / 2, scr.height - 140]) {
        const r = { x: 16, y, width: scr.width - 32, height: 120 };
        const f = cardToPageFrame(r, scr, clearProgress(r, scr));
        const grown = Math.max(r.x - f.x, r.y - f.y, f.x + f.width - (r.x + r.width), f.y + f.height - (r.y + r.height));
        expect(grown).toBeLessThanOrEqual(M.cardToPage.clearPt + 1e-9);
        expect(grown).toBeGreaterThan(M.cardToPage.clearPt - 1e-9);
      }
    }
    // The next card's words begin 28 pt past a card's edge (a 12 pt gap, then 16 pt of padding).
    expect(M.cardToPage.clearPt).toBeLessThan(28);
  });

  it('the card holds only while the Book goes, and the whole move, either way, fits the sequence', () => {
    expect(CARD_TO_PAGE.holdMs).toBeLessThan(CARD_TO_PAGE.veilInMs);
    for (const scr of PHONES) {
      for (const { rect } of book(scr)) {
        const there = timeline(rect, scr, 'toPage').findIndex((f) => f.p >= 0.999);
        expect(there).toBeGreaterThan(0);
        expect(there).toBeLessThanOrEqual(M.sequenceMaxMs);
        const back = timeline(rect, scr, 'toCard').findIndex((f) => f.veil === 0);
        expect(back).toBeGreaterThan(0);
        expect(back).toBeLessThanOrEqual(M.sequenceMaxMs);
      }
    }
  });

  it('Reduce Motion, or no carry: nothing moves; a hand-off inside one fadeMs each way, with nothing lost in a rush and the two screens never stacked', () => {
    const lin = (t: number, from: number, ms: number) => Math.min(1, Math.max(0, (t - from) / ms));
    const h = CARD_TO_PAGE.handOff;
    // Either way the leaving screen (the Book under the veil, or the page) goes first, the arriving one comes after it.
    const leaving = (t: number) => 1 - lin(t, 0, h.leaveMs);
    const arriving = (t: number) => lin(t, h.arriveFromMs, h.arriveMs);
    let overlap = 0;
    let shown = 2;
    for (let t = 0; t <= 400; t++) {
      // Nothing loses more than half its strength in 50 ms.
      expect(leaving(t) - leaving(t + 50)).toBeLessThanOrEqual(0.5);
      overlap = Math.max(overlap, Math.min(leaving(t), arriving(t)));
      shown = Math.min(shown, leaving(t) + arriving(t));
    }
    // The two screens' words are never on screen together at more than a quarter of their strength, and in the
    // timeline the dip between them leaves at least two fifths of a screen showing (the web frames read about a
    // third at the deepest point; a dip no deeper than the hand-off needs).
    expect(overlap).toBeLessThanOrEqual(0.25);
    expect(shown).toBeGreaterThanOrEqual(0.4);
    // One fadeMs each way (rule 6): it is all done by then, the arriving screen starting before the leaving one has gone.
    expect(Math.max(h.leaveMs, h.arriveFromMs + h.arriveMs)).toBe(M.fadeMs);
    expect(M.fadeMs).toBeLessThanOrEqual(250);
    expect(h.arriveFromMs).toBeLessThan(h.leaveMs);
    expect(CARD_TO_PAGE.fadeMs).toBe(M.fadeMs);
    expect(CARD_TO_PAGE.veilOutMs).toBe(M.lamp.returnMs);
    expect(veilIn(0)).toBe(0);
    expect(veilOut(0)).toBe(1);
    expect(veilOut(M.lamp.returnMs)).toBe(0);
  });

  it('once Back has begun nothing new starts: no carry is chosen, and a page that has gone starts no way back (source)', () => {
    const src = read('components/motion/card-transition.tsx');
    expect(src).toMatch(/const decide = \(\) => \{\s*if \(closing\.current\) return;/);
    expect(src).toMatch(/measure\(pageView\.current\)\.then\(\(at\) => \{\s*if \(!mounted\.current\) return;/);
    expect(src).toMatch(/\(\) => \(\) => \{\s*mounted\.current = false;/);
  });

  it("the veil is one full-screen layer of the page's paper with no pieces, timed as above (source)", () => {
    const src = read('components/motion/card-transition.tsx');
    expect(src).toContain('<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.bg }, veilStyle]} />');
    expect(src).toContain('const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));');
    // No edges, corners or boxes: nothing that could leave a joint.
    expect(src).not.toMatch(/FadeCorner|veilBox|needsOffscreenAlphaCompositing/);
    expect(src.match(/<FadeEdge /g)).toHaveLength(1); // the card's own fade over its last line
    // To the page: the veil on the lamp's leaving line, the card holding, then the spring.
    expect(src).toContain('veil.value = withTiming(1, { duration: CARD_TO_PAGE.veilInMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never });');
    expect(src).toContain("p.value = withDelay(CARD_TO_PAGE.holdMs, withSpring(1, springConfig('standard')");
    // Back: the veil lifts once the paper is within clearPt of the card, and the route leaves when both are done.
    expect(src).toContain('liftFrom.value = clearProgress(r.card, screen);');
    expect(src).toContain('() => lifting.value === 1 && p.value <= liftFrom.value,');
    expect(src).toContain('veil.value = withTiming(0, { duration: CARD_TO_PAGE.veilOutMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never }');
    expect(src).toContain('closeLeft.current = 2;');
    // The plain fade, both ways: the hand-off on straight lines.
    expect(src.match(/const h = CARD_TO_PAGE\.handOff;/g)).toHaveLength(2);
    expect(src).toContain('veil.value = withTiming(1, { duration: h.leaveMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never });');
    expect(src).toMatch(/fade\.value = withDelay\(\s*h\.arriveFromMs,\s*withTiming\(1, \{ duration: h\.arriveMs, easing: Easing\.linear/);
    expect(src).toContain('fade.value = withTiming(0, { duration: h.leaveMs, easing: Easing.linear, reduceMotion: ReduceMotion.Never });');
    expect(src).toMatch(/veil\.value = withDelay\(\s*h\.arriveFromMs,\s*withTiming\(0, \{ duration: h\.arriveMs, easing: Easing\.linear/);
    expect(src).not.toContain('STANDARD_EASING');
  });

  it('a screen that holds cards for a page hides itself under it, and a page lands screen readers on its opening (P5 contract, source)', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : /\.tsx$/.test(e.name) ? [join(dir, e.name)] : []));
    const screens = walk(SRC).filter((f) => !f.endsWith(join('motion', 'card-transition.tsx')));
    for (const f of screens) {
      const src = readFileSync(f, 'utf8');
      if (src.includes('<CardSource')) expect(src, `${f} spreads useHiddenBehindCardPage()`).toContain('useHiddenBehindCardPage()');
      if (src.includes('<CardToPage')) expect(src, `${f} gives its opening the focus ref`).toMatch(/opening=\{\(focus\)\s*=>[\s\S]*?\bfocus\b/);
    }
  });

  it("the card's fade is drawn only when the card was cut: when the page holds more of the letter than the card showed", () => {
    expect(cardWasCut(cardText, pageText)).toBe(true);
    expect(cardWasCut(cardText, { ...pageText, height: cardText.height })).toBe(false);
  });

  it('while a page is up the Book hides from screen readers, until the last page goes (counted, idempotent)', () => {
    const pages = createCoverStore();
    let heard = 0;
    pages.subscribe(() => heard++);
    expect(pages.get()).toBe(false);
    const first = pages.hold();
    const second = pages.hold();
    expect(pages.get()).toBe(true);
    first();
    first();
    expect(pages.get()).toBe(true);
    second();
    expect(pages.get()).toBe(false);
    expect(heard).toBe(2);
    expect(hiddenBehind(true)).toEqual({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants', 'aria-hidden': true });
    expect(hiddenBehind(false)).toEqual({ accessibilityElementsHidden: false, importantForAccessibility: 'auto', 'aria-hidden': false });
  });

  it('carried, the paper over the card comes and goes with the veil, so the rest of the card leaves and returns with the Book (P5, source)', () => {
    const src = read('components/motion/card-transition.tsx');
    expect(src).toContain('opacity: carrying.value ? veil.value : fade.value, backgroundColor');
    expect(src).toContain('const backgroundColor = interpolateColor(paperTone(p.value), [0, 1], [c.surfaceRaised, c.bg]);');
    // The way back still ends only when the paper is home and the veil has lifted: the paper is gone by then.
    expect(src).toContain('closeLeft.current = 2;');
  });

  it('the page knows where the move is: measuring, moving, settled or closing; carried; the words home (P5, source)', () => {
    const src = read('components/motion/card-transition.tsx');
    expect(src).toMatch(/export function useCardToPagePhase\(\): CardToPagePhase \{\s*return useContext\(CardPageContext\)\.phase;/);
    expect(src).toContain("export type CardToPagePhase = { phase: 'measuring' | 'moving' | 'settled' | 'closing'; carried: boolean; home: boolean };");
    expect(src).toContain('() => carrying.value === 1 && carriedHome(ct.value, pt.value, p.value),');
    expect(src).toMatch(/if \(now && !was\) runOnJS\(setHome\)\(true\);/);
    expect(src).toMatch(/closing\.current = true;\s*setLeaving\(true\);/);
    expect(src).toContain("phase: leaving ? 'closing' : phase,");
    expect(src).toContain("carried: carry && phase !== 'measuring',");
    expect(src).toContain("home: phase !== 'measuring' && (!carry || home),");
  });

  it('a page being turned away leaves the accessibility tree on every platform, the web included (P5, source)', () => {
    const src = read('components/motion/page-turn.tsx');
    expect(src).toContain("importantForAccessibility={leaving ? 'no-hide-descendants' : 'auto'}");
    expect(src).toContain('accessibilityElementsHidden={leaving}');
    expect(src).toContain('aria-hidden={leaving}');
    expect(src).toContain("pointerEvents={leaving ? 'none' : 'auto'}");
  });

  it('the card names its words and the page its opening; the fallback fades paper and words together (source)', () => {
    const src = read('components/motion/card-transition.tsx');
    expect(src).toMatch(/export function CardText\b/);
    expect(src).toMatch(/export function PageOpening\b/);
    // Faded: the content takes the same opacity as the paper (fade.value), so no frame shows paper without words.
    expect(src).toContain('opacity: carrying.value ? cardToPageFrame(from.value, screen, p.value).contentOpacity : fade.value');
  });

  it('screen readers read the letter once and land on the page (source)', () => {
    const src = read('components/motion/card-transition.tsx');
    // The page is modal, and holds the Book hidden for as long as it is up.
    expect(src).toMatch(/<View style=\{StyleSheet\.absoluteFill\} accessibilityViewIsModal aria-modal>/);
    expect(src).toContain('useEffect(() => cardPages.hold(), []);');
    expect(src).toMatch(/export function useHiddenBehindCardPage\(\)/);
    // Focus moves to the page's own element once it has arrived, carried or faded.
    expect(src).toContain("useFocusOnMount(focus, phase === 'settled', 'settled');");
    expect(src).toContain('{opening(focus)}');
    // The carried copies never take the focus ref and are hidden from screen readers; the page's own opening is
    // hidden while a copy stands in for it.
    expect(src.match(/opening\(null\)/g)).toHaveLength(2);
    expect(src).toMatch(/accessibilityElementsHidden\s+importantForAccessibility="no-hide-descendants"\s+aria-hidden/);
    expect(src).toContain("importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}");
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

  // iOS xSmall, Small and Medium reach React Native as these font scales (RCTAccessibilityManager), and Text only
  // caps growth (maxFontSizeMultiplier), so the words render smaller: the line on screen is lineHeight x scale.
  for (const [size, fontScale] of [['xSmall', 0.823], ['Small', 0.882], ['Medium', 0.941]] as const) {
    it(`at the ${size} text size (${fontScale}) two lines clip at exactly two rendered lines, and the fade sits on the second`, () => {
      for (const variant of ['letterBody', 'body', 'title1'] as const) {
        const t = tokens.type[variant];
        const rendered = t.lineHeight * (t.maxScale === null ? fontScale : Math.min(fontScale, t.maxScale));
        const lh = lineHeightFor(variant, fontScale);
        expect(lh, variant).toBeLessThan(t.lineHeight);
        expect((2 * lh) / rendered, `${variant}: lines shown in a two-line clip`).toBeCloseTo(2, 9);
        const box = fadeBox(2, lh, false);
        expect(box.top, `${variant}: fade starts at the top of line 2`).toBeCloseTo(rendered, 9);
        expect(box.top + box.height, `${variant}: and ends at its bottom`).toBeCloseTo(2 * rendered, 9);
        // The words that fill exactly two lines are not cut, and a third line is.
        expect(overflows(2 * rendered, 2, lh)).toBe(false);
        expect(overflows(3 * rendered, 2, lh)).toBe(true);
      }
    });
  }

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
