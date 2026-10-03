'use client';
/**
 * Owner: ACT3. A small pair of shoes, set neatly side by side the way they are left by a bed
 * at night: rounded toes, a strap with one button. Side view, the second shoe a little further back.
 * Same hand as every drawing: single weight, round caps, currentColor, gentle irregularity.
 * `draw` 0..1 draws the near shoe, then the far one.
 */
import { Stroke } from '@/scenes/parts/act3/stroke';
import type { DrawingProps } from './types';

/** Near shoe, toe to the right. Sole, toe, vamp, collar, heel in one line. */
const NEAR =
  'M21.8 66.4 C36.2 68.3 58.4 68.5 72.6 66.5 C78.7 65.7 79.6 57.6 73.5 54.4 C65.9 50.3 56.7 47.4 49.3 43.5 C45.8 41.5 41.3 44.9 35.9 45.4 C30.1 45.9 25.3 44.1 22.5 44.9 C19.3 50.3 19.5 60.6 21.8 66.4';
const NEAR_SOLE = 'M23.4 62.3 C37.6 64.1 57.8 64.3 75.6 62.1';
const NEAR_STRAP = 'M41.1 45.2 C43.7 50.9 45.4 56.6 45.7 60.9';
const NEAR_BUTTON = 'M45.3 55.4 C43.9 55.5 43.9 57.8 45.4 57.7 C46.8 57.6 46.7 55.3 45.3 55.4';

/** Far shoe: same hand, nudged right and up so the pair reads as two, side by side. */
const FAR =
  'M83.9 60.9 C97.6 62.6 118.8 62.9 132.4 61.1 C138.2 60.2 139.1 52.6 133.4 49.6 C126.1 45.6 117.4 42.9 110.3 39.2 C107 37.4 102.6 40.5 97.5 41 C92 41.4 87.4 39.8 84.6 40.5 C81.6 45.7 81.7 55.4 83.9 60.9';
const FAR_SOLE = 'M85.4 57 C98.9 58.7 118.2 58.9 135.3 56.8';
const FAR_STRAP = 'M102.6 40.8 C105 46.3 106.7 51.6 107 55.6';

export function Shoes({ draw, className, title, strokeWidth = 1.5 }: DrawingProps) {
  return (
    <svg
      viewBox="0 0 160 76"
      className={className}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title ? <title>{title}</title> : null}
      <Stroke d={FAR} draw={draw} from={0.34} to={0.8} />
      <Stroke d={FAR_SOLE} draw={draw} from={0.72} to={0.9} />
      <Stroke d={FAR_STRAP} draw={draw} from={0.84} to={1} />
      <Stroke d={NEAR} draw={draw} from={0} to={0.5} />
      <Stroke d={NEAR_SOLE} draw={draw} from={0.42} to={0.62} />
      <Stroke d={NEAR_STRAP} draw={draw} from={0.56} to={0.7} />
      <Stroke d={NEAR_BUTTON} draw={draw} from={0.68} to={0.76} />
    </svg>
  );
}
