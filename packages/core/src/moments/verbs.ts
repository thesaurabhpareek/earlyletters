// Spec 7.4 (v3, D6): the teaching verbs are a closed set of FIVE. "Leave out this picture" and
// "Use this album" are dropped (R56, R57). Nothing else teaches the engine: a tap, dismissal,
// scroll or dwell never adjusts ranking, qualifying, rotation or reasons (R54).

export const VERBS = ['nameDay', 'notNow', 'notThisOne', 'hideDay', 'keepClose'] as const;
export type Verb = (typeof VERBS)[number];

/** What a verb writes to the phone. Every one stores a local day key, and no picture or album id. */
export type VerbFact = {
  /** `nameDay` also stores the parent's own words; every verb stores the day key. */
  readonly storesLabel: boolean;
  /** `notNow` lasts until the next local day; the rest last until the parent undoes them. */
  readonly untilTomorrow: boolean;
  /** Each verb has an Undo (R54). */
  readonly undo: true;
};

export const VERB_FACTS: Readonly<Record<Verb, VerbFact>> = {
  nameDay: { storesLabel: true, untilTomorrow: false, undo: true },
  notNow: { storesLabel: false, untilTomorrow: true, undo: true },
  notThisOne: { storesLabel: false, untilTomorrow: false, undo: true },
  hideDay: { storesLabel: false, untilTomorrow: false, undo: true },
  keepClose: { storesLabel: false, untilTomorrow: false, undo: true },
};

/** R55: up to 60 typed characters, stored on the phone with the day key. */
export const LABEL_MAX_CHARS = 60;

export function isVerb(value: unknown): value is Verb {
  return typeof value === 'string' && (VERBS as readonly string[]).includes(value);
}
