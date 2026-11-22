// Moments (NS-53): the closed lists the engine, the app and later the push planner share.
// Pure TypeScript, no platform import (CODE-R10). Per Q-3 these stay in moments/ and are
// exported once from core; none reaches SQL or analytics in the first release (R282, R116),
// so none belongs in the parity-checked ../domain.ts.

/** Spec 6.2 sources S1 to S7. S5 (pictures already picked) and S7 (the library) are the picture sources. */
export const SOURCE_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'] as const;
export type SourceId = (typeof SOURCE_IDS)[number];

/** Spec 6.3: up to four slots, in this order. */
export const SLOTS = ['today', 'lookBack', 'pictures', 'question'] as const;
export type Slot = (typeof SLOTS)[number];

/** Spec 6.4 card kinds (PROPOSED names). K-PICK is not a card (Home owns drafts). */
export const CARD_KINDS = [
  'K-DAY',
  'K-BIRTH',
  'K-AGE',
  'K-YEAR-LETTER',
  'K-YEAR-PICTURES',
  'K-PROMPT',
  'K-LIB',
] as const;
export type CardKind = (typeof CARD_KINDS)[number];

/** Spec 5.1 AccessState. */
export const ACCESS_STATES = ['notDetermined', 'full', 'limited', 'denied', 'restricted', 'off'] as const;
export type AccessState = (typeof ACCESS_STATES)[number];

/** Spec 5.1: media kinds the library window can hold. */
export const MEDIA_KINDS = ['image', 'video'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** The three closed kinds of machine line a card may carry (R201). */
export const MACHINE_LINE_KINDS = ['reason', 'place', 'holiday'] as const;
export type MachineLineKind = (typeof MACHINE_LINE_KINDS)[number];
