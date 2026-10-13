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
