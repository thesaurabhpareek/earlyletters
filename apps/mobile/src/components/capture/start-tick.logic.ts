/**
 * The start haptic on Listen (MOTION 6): one tick per take, counting Speak's. Pure; tested in
 * test/recording-haptics.test.ts with listen.logic `startTake`.
 *
 * - Opened by Speak: Speak's Button played the tick, so the start it opens plays none. The primer on a fresh install
 *   is part of that same start, so Continue plays none either.
 * - A start that ends without a take (a blocker such as the microphone off or a full phone, or a failure) is over:
 *   the next start (Try again, the circle) is the parent's own tap and plays the tick.
 * - Opened any other way: the circle (or Continue after the primer) plays it.
 */
export function createStartTick(openedBySpeak: boolean) {
  let ticked = openedBySpeak;
  return {
    /** `startTake`'s pressHaptic: play the tick unless Speak already did for this start. */
    press(play: () => void): void {
      if (!ticked) play();
      ticked = false;
    },
    /** The start ended without a take: the next start is a new tap. */
    reset(): void {
      ticked = false;
    },
  };
}
