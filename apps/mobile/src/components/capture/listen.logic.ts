/**
 * Listen's pure parts (EXPERIENCE_PASS_2026-10 S11, S12, S13 and section 5.8 rows 1 to 4, package P4). No React
 * Native import, so they are unit tested in Node (test/listen.test.ts); app/listen.tsx draws them.
 *
 * One room, five moments (S11, S12):
 *
 *   phase      what is on screen
 *   ready      Listening at rest: "To {child}", the audience line, the prompt if the take started from one, the red
 *              circle at rest with no aura (it is the start control, "Start recording"), "Tap the red circle and
 *              talk.", Close at the top right. No clock. The microphone is not touched until the tap (S12).
 *   asking     the same room while iOS asks for the microphone and the take starts (after the tap on Speak or on the
 *              circle); no Close and no hint in this short moment, since there is nothing to tap
 *   recording  the aura moves with the voice; the clock in `headline`, tabular, textMuted (a recording screen is not a
 *              timer); "Listening." and its hint; Pause and Finish; Let it go
 *   paused     the same, the aura at rest; "Paused."; Keep talking and Finish
 *   finishing  the take is being kept; the aura releases (breath.releaseMs) as Review dissolves in (5.8 row 4)
 *
 * Controls never move between moments (MOTION principle 2, 5.8 rule 3): Pause and Finish hold their place from the
 * first frame (disabled before a take exists) and Let it go keeps its slot even when it is not offered.
 *
 * Three causes, three screens (S13). `startBlocker` runs before the microphone: permission off, then a full phone.
 * `startFailure` names a start that threw: a take already running ends as an interruption and is kept; otherwise,
 * with permission granted, the microphone is busy (a call or another app holds the audio session), never "off".
 */
import { roomToRecord } from '@/lib/capture/free-space';
import type { StopReason } from '@/lib/capture/recorder';

/** A start that cannot go ahead (S13): the microphone is off, in use, or the phone is full. */
export type MicProblem = 'denied' | 'busy' | 'full';

/** The moments of the room itself (S11, S12). */
export type RoomPhase = 'ready' | 'asking' | 'recording' | 'paused' | 'finishing';

export type ListenPhase = RoomPhase | MicProblem;

export function isMicProblem(phase: ListenPhase): phase is MicProblem {
  return phase === 'denied' || phase === 'busy' || phase === 'full';
}

/** "1:05": the running clock while recording. Whole seconds, rounded down, so it never runs ahead of the take. */
export function elapsedClock(ms: number): string {
  const s = Math.max(0, Math.floor((Number.isFinite(ms) ? ms : 0) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export type AuraLook = 'ready' | 'listening' | 'paused' | 'processing';

/** What the room shows in each moment (S11, S12). */
export function listenRoom(phase: RoomPhase): {
  /**
   * Close at the top right: only at rest, before anything has started. Not while iOS asks or the take is starting,
   * so no take can begin behind a closed screen (a take that does is still kept: listen.tsx finalizes it).
   */
  close: boolean;
  /** The red circle is the start control ("Start recording"), and nothing is recording. */
  startControl: boolean;
  aura: AuraLook;
  /** The clock: only once a take exists. */
  clock: boolean;
  /** The line under the circle. */
  line: 'readyHint' | 'listening' | 'paused' | 'none';
  /** Pause and Finish can be pressed (they are on screen in every moment, disabled before a take). */
  controls: boolean;
  /** "Let it go" is offered (its slot is kept either way). */
  discard: boolean;
} {
  const before = phase === 'ready' || phase === 'asking';
  return {
    close: phase === 'ready',
    startControl: phase === 'ready',
    aura: before ? 'ready' : phase === 'recording' ? 'listening' : phase === 'paused' ? 'paused' : 'processing',
    clock: !before,
    line: phase === 'ready' ? 'readyHint' : phase === 'asking' ? 'none' : phase === 'paused' ? 'paused' : 'listening',
    controls: phase === 'recording' || phase === 'paused',
    discard: phase === 'recording' || phase === 'paused' || phase === 'finishing',
  };
}

/** Before the microphone goes live (S13): permission off first, then a phone with no room for a take. */
export function startBlocker(s: { granted: boolean; freeBytes: number | null }): MicProblem | null {
  if (!s.granted) return 'denied';
  if (!roomToRecord(s.freeBytes)) return 'full';
  return null;
}

/**
 * A start that threw (S13). A take that already began ends as an interruption and is kept (Review says why). Before
 * that, with permission granted or unknown, the microphone is busy: a call, Siri, an alarm or another app holds the
 * audio session, which Settings cannot fix, so it never says the microphone is off.
 */
export function startFailure(s: { takeBegun: boolean; granted: boolean | null }): 'interrupted' | 'denied' | 'busy' {
  if (s.takeBegun) return 'interrupted';
  return s.granted === false ? 'denied' : 'busy';
}

/** The app came back to the front (S13): with permission now on, "The microphone is off" gives way to idle Listening. */
export function afterForeground(phase: ListenPhase, granted: boolean): ListenPhase {
  return phase === 'denied' && granted ? 'ready' : phase;
}

/** Why a take stopped early, as Review's `stopped` param (S14). Finish and Close need no line. */
export type StoppedParam = 'background' | 'interruption';

/** Review's params after a take ends: the draft, and why it stopped when that was not the person's own Finish. */
export function reviewParams(draftId: string, reason: StopReason): { draftId: string; stopped?: StoppedParam } {
  return reason === 'background' || reason === 'interruption' ? { draftId, stopped: reason } : { draftId };
}

/** The prompt line on Listen (S11): only when the take started from a prompt, and only one that exists. */
export function promptLine(promptKey: string | null | undefined, prompts: readonly { key: string; text: string }[]): string | null {
  if (!promptKey) return null;
  return prompts.find((p) => p.key === promptKey)?.text ?? null;
}
