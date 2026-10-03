'use client';
/**
 * Owner: ACT3. A bedside reading lamp: conical shade, slim stem, domed base, a pull chain.
 * One hand for the whole film: single weight, round caps and joins, currentColor, no fill,
 * gently irregular curves (no ruler lines). `draw` 0..1 draws it on in the order a hand would:
 * shade, stem, base, then the little chain last.
 */
import { Stroke } from '@/scenes/parts/act3/stroke';
import type { DrawingProps } from './types';

const SHADE =
  'M38.6 30.9 C47.2 26.5 73.8 26.1 82.3 30.3 C74.1 35.1 47.4 35.4 38.6 30.9 C31.2 47.3 22.7 66.1 16.3 82.7 C31.4 91.9 89.6 92.2 104.1 82.1 C97.8 65.7 89.5 47.4 82.3 30.3';
const STEM = 'M60.3 90.4 C60.9 112.2 59.4 141.6 60.4 170.2';
const BASE = 'M35.6 178.6 C37.4 168.4 82.7 167.9 84.8 178.1 C70.1 180.2 49.6 180.4 35.6 178.6';
const CHAIN = 'M75.8 88.6 C76.1 94.2 75.7 99.3 76.2 104.1 M76.3 104.4 C73.4 104.6 73.5 109.6 76.4 109.5 C79.3 109.4 79.1 104.3 76.3 104.4';

export function ReadingLamp({ draw, className, title, strokeWidth = 1.5 }: DrawingProps) {
  return (
    <svg
      viewBox="0 0 120 190"
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
      <Stroke d={SHADE} draw={draw} from={0} to={0.48} />
      <Stroke d={STEM} draw={draw} from={0.42} to={0.66} />
      <Stroke d={BASE} draw={draw} from={0.6} to={0.88} />
      <Stroke d={CHAIN} draw={draw} from={0.84} to={1} />
    </svg>
  );
}
