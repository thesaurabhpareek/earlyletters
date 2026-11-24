/**
 * Which surfaces a setup ask must never land on (BL-1985, BL-1784: no ask during recording, Review or export).
 * Phone memory only: nothing is stored, logged or sent, and a new process starts with nothing busy.
 *
 * - `recording`: set by Listen from the start of a take until it is kept or let go (recording, paused, finishing).
 * - `export`: set by Export while a book is being packed.
 * Review is not on the list: the ask is decided at the save and shown after the Book lands.
 *
 * Readers: `askAfterSave` (through its `surfaceBusy` input, passed by Review), the delayed asks (`fireDelayedAsk`
 * in ./index, re-read when the timer fires), and the analytics consent sheet (`analyticsAskDueNow`).
 */
export type BusySurface = 'recording' | 'export';

const busy = new Set<BusySurface>();

/** A screen says a surface has started (`on` true) or ended (`on` false). Safe to call twice with the same value. */
export function setSurfaceBusy(surface: BusySurface, on: boolean): void {
  if (on) busy.add(surface);
  else busy.delete(surface);
}

/** True while a take is recording or an export runs. */
export function surfaceBusy(): boolean {
  return busy.size > 0;
}
