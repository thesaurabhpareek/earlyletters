/**
 * The voice level on Listen, off React state (listening-cue.md section 2; MOTION 7 rule 1: JS never setState per frame).
 *
 * The recorder's metering goes straight into the aura's shared value from a 50 ms timer; nothing re-renders for it.
 * The screen's own state (the clock, the minute line, the 5 s progress mark, the quiet line) reads the recorder once
 * a second. The aura's frame callback runs only while it has something to draw from frames. Pure; tested in
 * test/listen-meter.test.ts.
 */
import type { AuraState } from './listening-aura';

/** How often the level is read into the aura (20 Hz, MOTION 5b). */
export const METER_MS = 50;
/** How often the screen re-renders from the recorder: the clock shows whole seconds. */
export const CLOCK_MS = 1000;
/** The recorder's silence, and the level when it gives none: the aura then shows its idle breath. */
export const METER_SILENT = -160;
/** A take's length is written to its draft every this often, so a take recovered after a kill has a length. */
export const PROGRESS_MS = 5000;

/** The level in dBFS for the aura: the reading, or silence when there is none (metering off or not reported). */
export function meterDb(metering: number | undefined | null): number {
  return typeof metering === 'number' && Number.isFinite(metering) ? metering : METER_SILENT;
}

/**
 * The 5 s mark to write for a take `durationMs` long, or null when `saved` (the last mark written) is current. Read
 * once a second, so a mark is never missed between two readings (the 50 ms window the 20 Hz reading relied on).
 */
export function progressMark(saved: number, durationMs: number): number | null {
  const mark = Math.floor(durationMs / PROGRESS_MS);
  return mark > saved ? mark : null;
}

/**
 * Whether the aura's frame callback runs: only while it follows the voice (listening) or releases at the end of a
 * take (processing). At rest (ready, idle, paused) it holds still values, and under Reduce Motion the ring steps on
 * its own reaction, so no frame is spent.
 */
export function auraRunsFrames(state: AuraState, reduced: boolean): boolean {
  return !reduced && (state === 'listening' || state === 'processing');
}

/** The glow's opacity at rest, when no frame callback runs: none before a take, dim while paused. */
export function auraRestOpacity(state: AuraState, opacityMin: number): number {
  return state === 'ready' ? 0 : state === 'paused' ? 0.12 : opacityMin;
}
