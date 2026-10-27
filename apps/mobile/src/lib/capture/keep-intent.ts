/**
 * A typed letter keeps from Write with one tap (EXPERIENCE_PASS_2026-10 S20, 5.8 row 5a, package P4b).
 *
 * Write's "Add to {child}'s book" and "Keep private" arm a keep for that draft, then hand over to Review, which runs
 * its one Keep step (the M17 gate and the save, D-082, D-103) at once and plays the saved moment, or opens the Plus
 * sheet. Review never shows "Read it back" for it. There is one Keep step in the app, so the gate cannot drift
 * between two copies of it.
 *
 * Only a tap arms it, for that draft, and only for a moment: a link, a restored screen or a second Review never
 * keeps anything by itself (the same rule as Listen's start, lib/resilience/start-intent.ts). Pure and in memory;
 * nothing is stored. Tested in Node (test/review-write.test.ts, and the one-tap keep end to end in
 * test/review-keep-from-write.test.ts).
 */
export const KEEP_ARM_WINDOW_MS = 5000;

type Armed = { draftId: string; inBook: boolean; at: number };

let armed: Armed | null = null;

/** Write, on the person's tap: keep this draft into the book (true) or privately (false). */
export function armKeep(draftId: string, inBook: boolean, now: number = Date.now()): void {
  armed = { draftId, inBook, at: now };
}

/** Review's first frame: whether a keep is armed for this draft right now, without spending it. */
export function peekKeep(draftId: string | null | undefined, now: number = Date.now()): { inBook: boolean } | null {
  const a = armed;
  if (!a || !draftId || a.draftId !== draftId) return null;
  return now - a.at >= 0 && now - a.at <= KEEP_ARM_WINDOW_MS ? { inBook: a.inBook } : null;
}

/** Review, once mounted: the destination the person chose for this draft a moment ago, once; else null. */
export function consumeKeep(draftId: string | null | undefined, now: number = Date.now()): { inBook: boolean } | null {
  const a = armed;
  armed = null;
  if (!a || !draftId || a.draftId !== draftId) return null;
  return now - a.at >= 0 && now - a.at <= KEEP_ARM_WINDOW_MS ? { inBook: a.inBook } : null;
}

/** Tests only. */
export function resetKeep(): void {
  armed = null;
}
