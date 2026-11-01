/**
 * What every loading, empty, error and not-found state has in common (QA journey critique,
 * "_journey": six treatments for the same job). Pure and tested (state-screen.logic.test.ts);
 * state-screen.tsx draws it.
 *
 * One shape: a quiet picture, a heading, one plain sentence, and the way forward as a
 * full-width button at the bottom of the screen (the thumb zone), with at most one quiet
 * second option beneath it. Never a dead end, never red, never a spinner, never a count of
 * what is missing. Loading breathes (the slowest loop we have) instead of spinning.
 *
 * EXPERIENCE_PASS (S13, S23, S37, S49): the block is centred with 20 pt gutters, the title is
 * `title2`, and the picture is one of three slots: a line drawing, a Phosphor glyph in a 72 pt
 * accentSoft circle (the microphone is off), or any drawing the screen brings (the book cover, the
 * held letter). In the hard moments nothing moves but a 200 ms fade: only loading breathes.
 */
import { tokens } from '@scribe/design-tokens';
import type { LineArtName } from '@/components/ui/line-art.data';

export type StateKind = 'empty' | 'error' | 'notFound' | 'loading';

export type StateSpec = {
  /** Default drawing; a screen may pass its own. */
  art: LineArtName;
  /** What VoiceOver does when it appears: calm, never an interruption. */
  live: 'polite' | 'none';
  /** The region is working: accessibilityState.busy. */
  busy: boolean;
  /** May carry a primary (filled, full width) action. Loading never does: it is working, not asking. */
  allowsPrimary: boolean;
};

export const STATE_SPEC: Record<StateKind, StateSpec> = {
  empty: { art: 'page', live: 'none', busy: false, allowsPrimary: true },
  error: { art: 'envelope', live: 'polite', busy: false, allowsPrimary: true },
  notFound: { art: 'page', live: 'none', busy: false, allowsPrimary: true },
  loading: { art: 'moon', live: 'polite', busy: true, allowsPrimary: false },
};

export type StateAction = { label: string; onPress: () => void; testID?: string };

/**
 * The action layout, as data: one primary (full width, 56 pt, pinned to the bottom of a screen) and
 * the rest quiet at 44 pt. Extra options beyond one primary are always quiet, so a second choice
 * never competes with the one primary on the screen.
 */
export function actionLayout(kind: StateKind, primary?: StateAction, others: readonly StateAction[] = []) {
  // A loading state may still offer a way out (Type instead while the language downloads), always quiet.
  if (!STATE_SPEC[kind].allowsPrimary) return { primary: null, quiet: [...(primary ? [primary] : []), ...others] as StateAction[] };
  // No primary given: the first of `others` is promoted, the rest stay quiet.
  if (!primary && others.length > 0) return { primary: others[0], quiet: others.slice(1) as StateAction[] };
  return { primary: primary ?? null, quiet: [...others] as StateAction[] };
}

/** The screen-level layout every state shares (S13, S49): centred, 20 pt gutters, the title in title2. */
export const STATE_LAYOUT = {
  gutter: tokens.space[5],
  align: 'center',
  title: 'title2',
  body: 'body',
  /** A Phosphor glyph sits in a soft circle: Light weight, textMuted on accentSoft. */
  glyph: { circle: 72, size: 40, weight: 'light' },
  /** The drawing's width on a whole-screen state. */
  artWidth: 168,
} as const;

export type StateVisual = { slot: 'drawing' | 'glyph' | 'art'; art: LineArtName; breathes: boolean; drawsOn: boolean };

/**
 * Which picture a state shows: the screen's own drawing first, then a glyph, then a line drawing (the kind's
 * default when none is named). Only loading breathes; no state draws its line on (the hard moments hold still).
 */
export function stateVisual(kind: StateKind, o: { art?: LineArtName; glyph?: unknown; drawing?: unknown } = {}): StateVisual {
  const art = o.art ?? STATE_SPEC[kind].art;
  const slot = o.drawing ? 'drawing' : o.glyph ? 'glyph' : 'art';
  return { slot, art, breathes: kind === 'loading' && slot === 'art', drawsOn: false };
}

/** Role props for the block, so every state announces itself the same way. */
export function stateA11y(kind: StateKind): { accessibilityLiveRegion?: 'polite'; accessibilityState?: { busy: boolean } } {
  const s = STATE_SPEC[kind];
  return {
    ...(s.live === 'polite' ? { accessibilityLiveRegion: 'polite' as const } : {}),
    ...(s.busy ? { accessibilityState: { busy: true } } : {}),
  };
}
