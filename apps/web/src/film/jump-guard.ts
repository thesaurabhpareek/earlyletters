/**
 * Remembers that the page is being moved on purpose (the Next and Previous buttons), so the arrival tick can stay
 * quiet: one press should give one tap, not one for the press and another when the part arrives. Manual scrolling never
 * sets it, so it keeps its tick. Pure with an injected clock, so it is tested alone (test/jump-guard.test.ts).
 */
export const JUMP_MS = 1900; // the longest jump (Lenis, 1.5 s) plus a little for it to settle

export type JumpGuard = { mark: (ms?: number) => void; active: () => boolean };

export function makeJumpGuard(clock: () => number = () => performance.now()): JumpGuard {
  let until = 0;
  return {
    mark: (ms = JUMP_MS) => {
      until = Math.max(until, clock() + ms);
    },
    active: () => clock() < until,
  };
}

/** The one shared by ScrollNav (marks) and SceneTick (reads). */
export const jumpGuard = makeJumpGuard();
