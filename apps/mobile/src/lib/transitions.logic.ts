/**
 * The screen-transition standard: how the app moves between rooms after first run, so the journey reads as one
 * house (EXPERIENCE_PASS 5.8; MOTION 5l). Pure and tested (test/transitions.test.ts). `routeTransitions` is the
 * one table of presentation and animation per root route; lib/motion.ts exports it and the root layout reads it
 * for its Stack.Screen options, typing no duration. Every number is a motion token.
 *
 * The rules (5.8):
 *   1. The lamp never cuts: an unlit room covering a lit one fades its lamp over leaveMs and brings it back over
 *      returnMs (useUnlitRoom, components/ui/lamp.tsx); tabs settle from one tab's light to the next (persistKey
 *      "tabs"). Only the first lit room of a session arrives slowly.
 *   2. Content never re-enters on a return.
 *   3. Controls are there from the first frame of every transition.
 *   4. Native first: tabs swap with no animation; pushes, sheets and alerts are the platform's. We add opacity on
 *      top (the lamp, a dissolve, content entering) and three custom moves: file into month (5e), card to page (5f)
 *      and the page turn.
 *   5. Short and interruptible: under sequenceMaxMs, except the save-to-Book hand-off (about 1.2 s, under the 2 s
 *      hardCeilingMs); a tap lands on the end state.
 *   6. Reduce Motion: every custom move is one fadeMs cross-fade; the lamp jumps to its level; native pushes and
 *      sheets follow the system's own reduced transition; nothing we control slides.
 */
import { tokens } from '@scribe/design-tokens';

const M = tokens.motion;

/**
 * How a route comes on screen, by what the move means:
 *   dissolve    the room changes and you stay where you are (Listen, Review, Read together): a cross-dissolve
 *   sheet       a page held over the room (Write, sign-in, invites, the purchase confirmation): the platform's rise
 *   push        one step further, the way back at the left edge (Settings, a letter until P5): the platform's push
 *   cardToPage  the tapped card grows into its page (MOTION 5f, CardToPage), drawn by the page itself
 *   none        the tab root
 */
export type Move = 'none' | 'dissolve' | 'sheet' | 'push' | 'cardToPage';
export type Presentation = 'modal' | 'fullScreenModal' | 'transparentModal';

/** One row of the table: the 5.8 rows it carries, how the route is presented and the move that brings it on. */
type Row = { rows: readonly (number | string)[]; presentation?: Presentation; move: Move };

/** Root stack routes (src/app/_layout.tsx). Rows are EXPERIENCE_PASS 5.8's. */
export const ROUTES = {
  '(tabs)': { rows: [6], move: 'none' },
  onboarding: { rows: [], move: 'none' },
  listen: { rows: [1, 2, 3], presentation: 'fullScreenModal', move: 'dissolve' },
  // Full screen (was a page sheet), so Listen dissolves into Review with no change of shape (row 4).
  review: { rows: [4, 5], presentation: 'fullScreenModal', move: 'dissolve' },
  write: { rows: [3, '5a'], presentation: 'modal', move: 'sheet' },
  'read-together': { rows: [8], presentation: 'fullScreenModal', move: 'dissolve' },
  // Row 7 is card to page. It switches here (move 'cardToPage') when the letter page mounts CardToPage (P5);
  // until then the page keeps the platform push, so nothing appears without motion.
  'letter/[id]': { rows: [7], move: 'push' },
  settings: { rows: [9], move: 'push' },
  '(auth)': { rows: [10], presentation: 'modal', move: 'sheet' },
  invite: { rows: [10], presentation: 'modal', move: 'sheet' },
  'plus/confirmed': { rows: [10], presentation: 'modal', move: 'sheet' },
} as const satisfies Record<string, Row>;

export type RootRoute = keyof typeof ROUTES;

/** The part of expo-router's native-stack options the table sets. */
export type RouteOptions = {
  presentation?: Presentation;
  animation?: 'fade' | 'none';
  /** iOS: honoured for a fade on a push; a modal cross-dissolves at the platform's own length (accepted, 5.1). */
  animationDuration?: number;
  contentStyle?: { backgroundColor: 'transparent' };
};

export function moveOptions(move: Move, reduced: boolean): RouteOptions {
  switch (move) {
    case 'dissolve':
      return { animation: 'fade', animationDuration: reduced ? M.fadeMs : M.route.dissolveMs };
    case 'cardToPage':
      // CardToPage draws the growth itself (and its own 200 ms cross-fade under Reduce Motion).
      return { presentation: 'transparentModal', animation: 'none', contentStyle: { backgroundColor: 'transparent' } };
    case 'sheet':
    case 'push':
    case 'none':
      // Native first: the platform's own rise and push, and its own reduced transition under Reduce Motion.
      return {};
  }
}

/** routeTransitions[route]: the Stack.Screen options for presentation and animation, for the Reduce Motion setting. */
export function routeTransitions(reduced: boolean): Record<RootRoute, RouteOptions> {
  const out = {} as Record<RootRoute, RouteOptions>;
  for (const [name, row] of Object.entries(ROUTES) as [RootRoute, Row][]) {
    out[name] = { ...(row.presentation ? { presentation: row.presentation } : {}), ...moveOptions(row.move, reduced) };
  }
  return out;
}

/**
 * Words on two screens must never sit on top of each other mid-move (a plain cross-fade of two text-heavy screens
 * reads as a mess). The page turn hands off: the leaving words are gone by HAND_OFF of the way, and the arriving
 * ones start as the old are half gone.
 */
export const HAND_OFF = 0.35;

/* ------------------------------------------------------------------ */
/* Sheets (ui/sheet.tsx, our own sheet, so rule 6 applies)             */
/* ------------------------------------------------------------------ */

export type SheetMotion =
  | { kind: 'spring'; stiffness: number; damping: number; mass: number }
  /** Reduce Motion: the sheet does not travel; it and its scrim fade in and out over fadeMs. */
  | { kind: 'fade'; durationMs: number };

export function sheetMotion(reduced: boolean): SheetMotion {
  const s = M.standard;
  return reduced ? { kind: 'fade', durationMs: M.fadeMs } : { kind: 'spring', stiffness: s.stiffness, damping: s.damping, mass: s.mass };
}

/* ------------------------------------------------------------------ */
/* Inside a screen                                                     */
/* ------------------------------------------------------------------ */

/** A first-run step change: what leaves, what arrives. */
export function stepMotion(reduced: boolean) {
  return reduced
    ? { leave: { dy: 0, durationMs: M.fadeMs }, arrive: { dy: 0, durationMs: M.fadeMs, staggerMs: 0 } }
    : { leave: { dy: -M.enter.dy, durationMs: M.exitMs }, arrive: { dy: M.enter.dy, durationMs: M.enter.durationMs, staggerMs: M.staggerMs } };
}

/**
 * Review (or Write) to the saved moment to the Book (MOTION 5e, S21, 5.8 rows 5 and 5a), as a timeline in ms from
 * the commit: the saved moment inside Review until sequenceMaxMs, then Review fades out over fadeMs as the Book
 * comes forward on the new letter (its lamp returning over returnMs), then the 1.6 s wash. About 1.1 s to the Book,
 * under the 2 s ceiling; a tap lands there at once. Under Reduce Motion the chip and its line arrive with one fade and
 * nothing travels; Review leaves at the same moment, so the line can be read for as long, and the wash is static.
 */
export function fileIntoMonthPlan(reduced: boolean) {
  const f = M.file;
  const leave = { dismissAtMs: M.sequenceMaxMs, leaveMs: M.fadeMs, bookAtMs: M.sequenceMaxMs + M.fadeMs, bookLampMs: M.lamp.returnMs, arrivalWashMs: M.newMarkMs };
  if (reduced) return { scaleTo: 1, chipAtMs: 0, chipFadeMs: M.fadeMs, moveAtMs: null, dy: 0, ...leave, bookLampMs: 0, washStatic: true } as const;
  return { scaleTo: f.scale, chipAtMs: f.chipAtMs, chipFadeMs: M.fadeMs, moveAtMs: f.moveAtMs, dy: f.dy, ...leave, washStatic: false } as const;
}

/** Read together: which way the page goes (S30). */
export type PageDirection = 'next' | 'back';

export function pageTurnPlan(direction: PageDirection, reduced: boolean) {
  const dx = reduced ? 0 : M.pageTurn.dx;
  const sign = direction === 'next' ? -1 : 1;
  // A hand-off, not a pile-up: the old words are gone early and the new ones start as the old are half gone.
  const fadeOutMs = reduced ? M.fadeMs : Math.round(M.exitMs * (1 - HAND_OFF));
  return {
    /** The page on screen moves to `outDx` over `outMs`, its words fading over `fadeOutMs`. */
    outDx: dx === 0 ? 0 : sign * dx,
    outMs: reduced ? M.fadeMs : M.exitMs,
    fadeOutMs,
    /** The next page arrives from `inDx` (the other side) on `standard`, fading in over `inMs` after `inDelayMs`. */
    inDx: dx === 0 ? 0 : -sign * dx,
    inMs: M.fadeMs,
    inDelayMs: reduced ? 0 : Math.round(fadeOutMs / 2),
  };
}

/** A swipe turns the page when it travels a quarter of the width or is flung; otherwise the page settles back. */
export const SWIPE = { fraction: 0.25, velocity: 600 } as const;

export function swipeOutcome(dx: number, vx: number, width: number): PageDirection | null {
  'worklet';
  if (dx <= -width * SWIPE.fraction || vx <= -SWIPE.velocity) return 'next';
  if (dx >= width * SWIPE.fraction || vx >= SWIPE.velocity) return 'back';
  return null;
}

/* ------------------------------------------------------------------ */
/* Card to page (MOTION 5f)                                            */
/* ------------------------------------------------------------------ */

export type Rect = { x: number; y: number; width: number; height: number };

/**
 * Where the growing paper is at `progress` (0: exactly over the tapped card; 1: the whole screen), with its corner
 * radius going from `radius.md` to 0, when the page's own content shows, and how much the list behind is dimmed.
 * The paper is one empty view, so its frame and radius may move (MOTION 7's card exception); the page's content
 * is never scaled: it fades in, full size, from contentFrom of the way.
 */
export function cardToPageFrame(card: Rect, screen: { width: number; height: number }, progress: number) {
  'worklet';
  const p = Math.min(1, Math.max(0, progress));
  const from = M.cardToPage.contentFrom;
  return {
    x: card.x * (1 - p),
    y: card.y * (1 - p),
    width: card.width + (screen.width - card.width) * p,
    height: card.height + (screen.height - card.height) * p,
    radius: tokens.radius.md * (1 - p),
    contentOpacity: Math.min(1, Math.max(0, (p - from) / (1 - from))),
    /** How much the list behind is dimmed: 0 at the start, 1 - behindDim at the end. */
    dim: (1 - M.cardToPage.behindDim) * p,
  };
}

/**
 * The words the card and the page share (the dateline and the opening lines) are carried, never redrawn: one block
 * of text, laid out once at the page's column, moves from where it sat on the card to where it sits on the page,
 * with the paper. They need the same column, or the lines would wrap differently and the words would jump.
 */
export function canCarry(cardText: Rect | undefined, pageText: Rect | undefined): boolean {
  return !!cardText && !!pageText && Math.abs(cardText.width - pageText.width) <= 1 && pageText.height >= cardText.height - 1;
}

/**
 * Where the carried block is at `progress`, and how much of it shows:
 * - `x`, `y`: its top left, from the card's text to the page's, on the same curve as the paper;
 * - `excerpt`: the height of the lines the card showed, always fully visible (the card's own words never leave);
 * - `extra`: how much of the rest shows below them, never past the paper's bottom edge;
 * - `extraOpacity`: the rest of the words fade in from contentFrom of the way (and out first on the way back);
 * - `cardFade`: the card's own fade over the end of its last line, which gives way as the rest arrives.
 */
export function carryFrame(card: Rect, cardText: Rect, pageText: Rect, screen: { width: number; height: number }, progress: number) {
  'worklet';
  const f = cardToPageFrame(card, screen, progress);
  const p = Math.min(1, Math.max(0, progress));
  const x = cardText.x + (pageText.x - cardText.x) * p;
  const y = cardText.y + (pageText.y - cardText.y) * p;
  const excerpt = cardText.height;
  const extra = Math.min(Math.max(0, pageText.height - excerpt), Math.max(0, f.y + f.height - (y + excerpt)));
  return { x, y, excerpt, extra, extraOpacity: f.contentOpacity, cardFade: 1 - f.contentOpacity };
}

/** Back reverses the growth only while the card is still on screen; otherwise the page fades (MOTION 5f). */
export function cardBackMove(card: Rect | undefined, screen: { width: number; height: number }): 'shrink' | 'fade' {
  if (!card) return 'fade';
  const visible = card.y + card.height > 0 && card.y < screen.height && card.x + card.width > 0 && card.x < screen.width;
  return visible ? 'shrink' : 'fade';
}
