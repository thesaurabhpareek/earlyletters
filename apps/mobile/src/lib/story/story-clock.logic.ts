/**
 * The first-run story clock: a pure state machine, no timers, no React Native, no Reanimated.
 * A hook (later PR) feeds it `tick(dtMs)` from one frame clock and the pause and resume events from AppState, the
 * screen-reader and Reduce Motion subscriptions, a held press and route focus. Spec: FIRST-RUN-MOTION-SPEC-10nov
 * section 5; feasibility 4.4.
 *
 * Rules, each with a test in apps/mobile/test/story-clock.test.ts:
 * - Time only moves while no pause reason is set. Time away (background) is never counted: the tick that follows a
 *   return is one ordinary frame, and a single tick moves at most one card, dropping any carry-over.
 * - The last card fills and stops. Nothing here ends the story by itself; the person presses a button.
 * - Next, Back and Skip are valid in every state. Back on card 0 restarts card 0 (FR-04), it never exits.
 */
import { tokens } from '@scribe/design-tokens';

export type PauseReason = 'hold' | 'background' | 'voiceOver' | 'reduceMotion' | 'blur';
export type StoryDone = 'finished' | 'skipped';

export interface StoryClockState {
  readonly index: number;
  readonly count: number;
  /** Time spent on the current card, 0 to dwellMs. */
  readonly elapsedMs: number;
  /** Reasons currently holding the clock, in a stable order. */
  readonly pauses: readonly PauseReason[];
  readonly status: 'running' | 'done';
}

export type StoryClockEvent =
  | { type: 'tick'; dtMs: number }
  | { type: 'pause'; reason: PauseReason }
  | { type: 'resume'; reason: PauseReason }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'skip' };

export interface StoryClockResult {
  readonly state: StoryClockState;
  /** Set once, on the event that ends the story. */
  readonly done?: StoryDone;
}

const ORDER: readonly PauseReason[] = ['hold', 'background', 'voiceOver', 'reduceMotion', 'blur'];
const DWELL_MS = tokens.motion.story.dwellMs;

/** `startPaused` is for reasons already true when the story opens (Reduce Motion, VoiceOver). */
export function initialStoryClock(count: number, startPaused: readonly PauseReason[] = []): StoryClockState {
  const n = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  return { index: 0, count: n, elapsedMs: 0, pauses: ORDER.filter((r) => startPaused.includes(r)), status: 'running' };
}

const isLast = (s: StoryClockState) => s.index >= s.count - 1;

/** True when time is allowed to run a card into the next one on its own. */
export function isAutoAdvancing(s: StoryClockState): boolean {
  return s.status === 'running' && s.pauses.length === 0 && s.count > 0 && !isLast(s);
}

const finish = (s: StoryClockState, done: StoryDone): StoryClockResult => ({ state: { ...s, status: 'done' }, done });

export function storyClock(s: StoryClockState, e: StoryClockEvent): StoryClockResult {
  if (s.status === 'done') return { state: s };
  switch (e.type) {
    case 'tick': {
      if (s.pauses.length > 0 || s.count === 0 || !Number.isFinite(e.dtMs) || e.dtMs <= 0) return { state: s };
      const total = s.elapsedMs + e.dtMs;
      if (total < DWELL_MS) return { state: { ...s, elapsedMs: total } };
      if (isLast(s)) return { state: { ...s, elapsedMs: DWELL_MS } };
      return { state: { ...s, index: s.index + 1, elapsedMs: 0 } };
    }
    case 'pause':
      return s.pauses.includes(e.reason) ? { state: s } : { state: { ...s, pauses: ORDER.filter((r) => r === e.reason || s.pauses.includes(r)) } };
    case 'resume':
      return s.pauses.includes(e.reason) ? { state: { ...s, pauses: s.pauses.filter((r) => r !== e.reason) } } : { state: s };
    case 'next':
      return isLast(s) ? finish(s, 'finished') : { state: { ...s, index: s.index + 1, elapsedMs: 0 } };
    case 'back':
      return { state: { ...s, index: Math.max(0, s.index - 1), elapsedMs: 0 } };
    case 'skip':
      return finish(s, 'skipped');
  }
}
