/**
 * Story touch decisions as pure functions (FR-03 to FR-06). Numbers come from tokens.motion.story; the swipe distance
 * (a quarter of the width) is from the motion spec. The fling speed is a proposal, UNVERIFIED on device.
 */
import { tokens } from '@scribe/design-tokens';

export type StoryZone = 'back' | 'next';
export type StoryTap = StoryZone | 'none';
export type StorySwipe = 'next' | 'back' | 'settle' | 'ignore';

const { holdMs, edgeZone } = tokens.motion.story;
export const SWIPE_TURN_FRACTION = 0.25;
/** points per second; a flick faster than this turns the card even if it is short. */
export const SWIPE_FLING_VX = 600;

/** The leading `edgeZone` of the card is back; the leading side is the right in right-to-left layouts. */
export function zoneForX(x: number, width: number, rtl: boolean): StoryZone {
  if (!Number.isFinite(x) || !Number.isFinite(width) || width <= 0) return 'next';
  const lead = rtl ? width - x : x;
  return lead < width * edgeZone ? 'back' : 'next';
}

/** Longer than `holdMs` is a hold (pauses); up to and including it is a tap. */
export function classifyPress(pressMs: number): 'tap' | 'hold' {
  return pressMs > holdMs ? 'hold' : 'tap';
}

export function tapDecision(p: { x: number; width: number; rtl: boolean; pressMs: number }): StoryTap {
  return classifyPress(p.pressMs) === 'hold' ? 'none' : zoneForX(p.x, p.width, p.rtl);
}

/** dx and dy are the finger travel in points (negative dx is leftward); vx is optional release speed. */
export function swipeDecision(p: { dx: number; dy: number; vx?: number; width: number; rtl: boolean }): StorySwipe {
  const { dx, dy, width, rtl } = p;
  if (!Number.isFinite(dx) || !Number.isFinite(dy) || !Number.isFinite(width) || width <= 0) return 'ignore';
  if (Math.abs(dy) > Math.abs(dx)) return 'ignore'; // vertical: nothing, there is no dismiss gesture
  const vx = Number.isFinite(p.vx) ? (p.vx as number) : 0;
  const turned = Math.abs(dx) >= width * SWIPE_TURN_FRACTION || (Math.abs(vx) >= SWIPE_FLING_VX && Math.sign(vx) === Math.sign(dx));
  if (!turned) return 'settle';
  const towardsNext = rtl ? dx > 0 : dx < 0;
  return towardsNext ? 'next' : 'back';
}
