/**
 * The one gate every app announcement passes (SR-C-02: F04-REQ-040, F04-REQ-041; B2-21 never waived). Pure: no React
 * Native import, so it is unit tested in Node (test/speech-gate.test.ts); lib/a11y.ts `announce()` is built from it.
 *
 * While a take is open, nothing the app says is spoken: a toast, a status line, any `announce()` call is dropped,
 * never queued, so it is not replayed into the take after a pause or a resume either. Without headphones, VoiceOver's
 * voice would otherwise be in the letter.
 *
 * While a recording is playing (TDD 09 rule S2) messages wait and are spoken when playback stops, as before; a waiting
 * message is dropped if a take is on when it comes due.
 */

/**
 * The capture state is a small state machine, one take at a time, keyed by the take's token (Reviews A and B on #523).
 * app/listen.tsx drives it; recorder status polls can only confirm it, never turn it off, and never turn it on after
 * the take has ended.
 *
 *   state      ON?   how it is entered
 *   idle       off   resetCapture() (Listen unmounting, always), closeTake(token) (finalize or abandon resolved)
 *   starting   ON    openTake(): before the audio session and the microphone go live; a new token
 *   live       ON    confirmLive(token) when the recorder reports capturing; resumeTake(token) before record()
 *   pausing    ON    pauseTake(token) before recorder.pause(): iOS can still be writing for a moment
 *   paused     off   pauseConfirmed(token): only from `pausing`, once the person paused AND the recorder has stopped
 *   finishing  ON    finishTake(token): Finish, an interruption, the background, Let it go, until the take is closed
 *
 * A call with a token that is not the open take's does nothing, so a late poll or a late `finally` from an ended take
 * cannot change a newer one, or turn anything back on.
 *
 * Safety net: an ON state expires if Listen's heartbeat has not refreshed it for STALE_CAPTURE_MS (3 s). Listen beats
 * every CAPTURE_HEARTBEAT_MS (500 ms) for as long as it is mounted with a take open, so 3 s is six missed beats: the
 * screen is gone without its reset, or the JS thread is stalled. A stalled JS thread cannot announce anything either
 * (every announcement starts in JS), and the next beat turns the take back on, so expiry never opens a path into a
 * live take; it only ends a silence that a missed reset would otherwise leave on the whole app.
 */
export const STALE_CAPTURE_MS = 3000;
export const CAPTURE_HEARTBEAT_MS = 500;

export type CaptureState = 'idle' | 'starting' | 'live' | 'pausing' | 'paused' | 'finishing';

let state: CaptureState = 'idle';
let openToken: number | null = null;
let lastToken = 0;
let refreshedAt = 0;

const clock = { now: () => Date.now() };

/** Tests only: a fake clock (null restores Date.now). */
export function setCaptureClockForTests(now: (() => number) | null): void {
  clock.now = now ?? (() => Date.now());
}

const isOpen = (token: number | null): token is number => token !== null && token === openToken;
const refresh = () => {
  refreshedAt = clock.now();
};

/** Before the audio session and the microphone go live. Returns the take's token. */
export function openTake(): number {
  lastToken += 1;
  openToken = lastToken;
  state = 'starting';
  refresh();
  return lastToken;
}

/** A recorder status saying "capturing", during this take: confirms ON. Never turns anything off. */
export function confirmLive(token: number | null): void {
  if (!isOpen(token)) return;
  if (state === 'starting') state = 'live';
  refresh();
}

/** Listen's heartbeat while it is mounted: keeps an open take's ON state from expiring. */
export function heartbeat(token: number | null): void {
  if (isOpen(token)) refresh();
}

export function pauseTake(token: number | null): void {
  if (!isOpen(token)) return;
  state = 'pausing';
  refresh();
}

/** The person paused and the recorder has stopped writing: the one way an open take goes off. */
export function pauseConfirmed(token: number | null): void {
  if (isOpen(token) && state === 'pausing') state = 'paused';
}

export function resumeTake(token: number | null): void {
  if (!isOpen(token)) return;
  state = 'live';
  refresh();
}

export function finishTake(token: number | null): void {
  if (!isOpen(token)) return;
  state = 'finishing';
  refresh();
}

/** Finalize or abandon has resolved: off, and the token is dead. */
export function closeTake(token: number | null): void {
  if (!isOpen(token)) return;
  openToken = null;
  state = 'idle';
}

/** Listen unmounting, whatever happened: off, and no take is open. */
export function resetCapture(): void {
  openToken = null;
  state = 'idle';
}

export function captureState(): CaptureState {
  return state;
}

/** Whether the app must stay silent now. */
export function isRecorderCapturing(): boolean {
  if (state === 'idle' || state === 'paused') return false;
  return clock.now() - refreshedAt <= STALE_CAPTURE_MS; // the safety net
}

export type GateDeps = {
  /** Speak now (AccessibilityInfo on iOS and web). */
  speak: (message: string, queue: boolean) => void;
  /** The app's audio session: messages wait while it is `playback`. */
  audioMode: () => 'idle' | 'recording' | 'playback';
  /** setTimeout, injectable for tests. */
  later: (fn: () => void, ms: number) => unknown;
};

/** How long a message waits before checking again whether playback has stopped. */
export const PLAYBACK_RETRY_MS = 1000;

export function createGatedAnnounce(deps: GateDeps): (message: string, opts?: { queue?: boolean }) => void {
  let queued: string[] = [];
  let waiting = false;

  const flush = () => {
    waiting = false;
    if (isRecorderCapturing()) {
      queued = []; // never spoken into a take, and never replayed after it
      return;
    }
    if (deps.audioMode() === 'playback') {
      waiting = true;
      deps.later(flush, PLAYBACK_RETRY_MS);
      return;
    }
    const all = queued;
    queued = [];
    for (const m of all) deps.speak(m, true);
  };

  return (message, opts = {}) => {
    if (!message) return;
    if (isRecorderCapturing()) return; // dropped (B2-21)
    if (deps.audioMode() === 'playback') {
      queued.push(message);
      if (!waiting) {
        waiting = true;
        deps.later(flush, PLAYBACK_RETRY_MS);
      }
      return;
    }
    deps.speak(message, opts.queue ?? true);
  };
}
