/**
 * Listening starts only from a tap (founder-visible rule: a link must never turn the microphone on).
 *
 * Tonight's Speak button calls `armListenStart()` just before it opens /listen. The Listen screen calls
 * `consumeListenStart()` on mount: true only if a tap armed it a moment ago. Anything else that reaches
 * /listen (the scribe://listen link, a restored screen, a stale route) gets false and shows the ready
 * state, where the person taps Start. Pure and in memory: nothing is stored.
 */
export const LISTEN_ARM_WINDOW_MS = 5000;

let armedAt: number | null = null;

export function armListenStart(now: number = Date.now()): void {
  armedAt = now;
}

/** True once per arming, and only within the window. */
export function consumeListenStart(now: number = Date.now()): boolean {
  const at = armedAt;
  armedAt = null;
  return at !== null && now - at >= 0 && now - at <= LISTEN_ARM_WINDOW_MS;
}

/** Tests only. */
export function resetListenStart(): void {
  armedAt = null;
}
