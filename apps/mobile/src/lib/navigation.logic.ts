/**
 * One back/close idiom per navigation context (QA journey critique, "_journey": five idioms).
 * Pure and tested (test/navigation-idioms.test.ts); the root layout, ModalHeader and BackButton
 * follow this table.
 *
 *   tab root        large title, no back, no close
 *   push            the native header: chevron back (+ the large or inline title). Settings, Letter.
 *   flow step       an in-screen step of one route (onboarding): the same chevron + "Back" as a push,
 *                   drawn by BackButton so it matches the native one
 *   modal           a screen presented over the app (Write, Review, Listening, Read together, invite,
 *                   sign-in): "Close" in the top RIGHT corner, drawn by ModalHeader
 *   sheet           a bottom sheet (ui/sheet.tsx): the same "Close", top right, in the sheet header
 * Never: "Close" at the top left, a circular X, or a Close at the bottom of the page.
 */
export type NavContext = 'tab-root' | 'push' | 'flow-step' | 'modal' | 'sheet';
export type Idiom = 'none' | 'native-back' | 'back-button' | 'close-top-right';

export const IDIOM: Record<NavContext, Idiom> = {
  'tab-root': 'none',
  push: 'native-back',
  'flow-step': 'back-button',
  modal: 'close-top-right',
  sheet: 'close-top-right',
};

/** Root stack routes (src/app/_layout.tsx) and the context each one is in. */
export const ROOT_ROUTE_CONTEXT = {
  '(tabs)': 'tab-root',
  onboarding: 'flow-step',
  write: 'modal',
  listen: 'modal',
  review: 'modal',
  'read-together': 'modal',
  'letter/[id]': 'push',
  '(auth)': 'modal',
  invite: 'modal',
  settings: 'push',
} as const satisfies Record<string, NavContext>;

/** expo-router presentation for a context: modals and sheets are presented, pushes and flows are not. */
export function presentationFor(ctx: NavContext): 'push' | 'modal' {
  return ctx === 'modal' || ctx === 'sheet' ? 'modal' : 'push';
}

/** Smallest the Close and Back controls may be (HIG 44 pt; tokens.target.min). */
export const HEADER_TARGET = 44;

/**
 * A pushed route that is its own stack (Settings) has a first screen with no native back: iOS draws none on a
 * stack's root, and the root stack's header is hidden (TestFlight build 1: "No cross or back button in settings").
 * That screen gets the same chevron back, drawn by the navigation library's HeaderBackButton in the native header,
 * when the stack it was pushed onto can go back. Every later screen keeps the native back to the screen before it.
 */
export function needsOuterBack(indexInStack: number, parentCanGoBack: boolean): boolean {
  return indexInStack === 0 && parentCanGoBack;
}

/** The part of a navigation route the back label reads (react-navigation's state shape). */
export type RouteLike = { name: string; state?: { index?: number; routes: readonly RouteLike[] } };

/**
 * The back label, as iOS writes it: the title of the screen it goes back to. From the tabs, the focused tab's title
 * (`titles`, keyed by tab route name); anywhere else, or a tab we do not know, the fallback ("Back").
 */
export function outerBackLabel(previous: RouteLike | undefined, titles: Readonly<Record<string, string>>, fallback: string): string {
  if (!previous || previous.name !== '(tabs)') return fallback;
  // The tab navigator's state is filled in lazily: with none yet, the first tab (index) is the one showing.
  const tabs = previous.state;
  const focused = tabs ? tabs.routes[tabs.index ?? 0]?.name : 'index';
  return (focused && titles[focused]) || fallback;
}
