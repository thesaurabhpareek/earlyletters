'use client';
/**
 * Owner: ACT3. An envelope with a letter. Same hand as every drawing.
 *
 * Props (DrawingProps plus one optional prop, reported to the coordinator):
 * - `draw` 0..1: draws the envelope on (body, side folds, flap, letter).
 * - `open` 0..1 (optional MotionValue): 1 = flap up and the letter peeking out, 0 = sealed.
 *   From 1 to 0.5 the letter slides down inside; from 0.5 to 0 the flap folds closed over its hinge.
 *   Absent = closed (the resting state).
 * Only transform, opacity and pathLength animate.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { useId } from 'react';
import { Stroke } from '@/scenes/parts/act3/stroke';
import type { DrawingProps } from './types';

export type EnvelopeProps = DrawingProps & { open?: MotionValue<number> };

const BODY = 'M15.2 40.6 C55.4 39.6 104.8 39.8 145.1 40.3 C145.8 64.2 145.4 88.9 145.6 111.8 C105.1 112.7 55.2 112.5 14.6 112.1 C14.2 88.6 14.9 63.9 15.2 40.6';
const FOLDS = 'M15.4 111.3 C30.8 100.4 45.6 90.1 59.3 80.6 M145.1 111.4 C129.8 100.6 114.7 90.3 101.1 80.8';
/** The flap, drawn closed: hinge along the top edge, point down. Flipped (scaleY -1) it stands open. */
const FLAP = 'M15.6 40.7 C37.4 55.1 58.6 69.2 80.1 82.6 C101.4 69.1 123.1 54.9 144.9 40.6';
/** The letter inside: a sheet with three lines of writing. */
const SHEET = 'M30.2 64.1 C30.1 50.6 30.4 37.2 30.6 23.8 C63.7 23.3 96.4 23.4 129.6 23.9 C129.8 37.3 129.7 50.8 129.5 64.3';
const WRITING = 'M42.4 34.6 C62.1 34.1 88.6 34.3 112.3 34.8 M42.6 44.2 C66.4 43.8 91.7 44 117.6 44.4 M42.5 53.6 C58.2 53.3 73.6 53.4 88.4 53.8';

export function Envelope({ draw, open, className, title, strokeWidth = 1.5 }: EnvelopeProps) {
  const clipId = useId().replace(/:/g, '');
  return (
    <svg
      viewBox="0 -6 160 124"
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
      <defs>
        {/* The letter shows only above the envelope's top edge; inside, the envelope hides it. */}
        <clipPath id={clipId}>
          <rect x="0" y="-40" width="160" height="80" />
        </clipPath>
      </defs>
      {open ? (
        <OpenParts open={open} draw={draw} clipId={clipId} />
      ) : null}
      <Stroke d={BODY} draw={draw} from={0} to={0.5} />
      <Stroke d={FOLDS} draw={draw} from={0.42} to={0.66} />
      {open ? null : <Stroke d={FLAP} draw={draw} from={0.6} to={0.86} />}
    </svg>
  );
}

function OpenParts({ open, draw, clipId }: { open: MotionValue<number>; draw?: MotionValue<number>; clipId: string }) {
  // Letter: fully out at open 1, fully inside (clipped away) at open 0.5.
  const sheetY = useTransform(open, [0.5, 1], [44, 0]);
  const sheetOpacity = useTransform(open, [0.5, 0.56], [0, 1]);
  // Flap: open (scaleY -1, standing up) to closed (scaleY 1) across open 0.5 to 0.
  const flapScale = useTransform(open, [0, 0.5], [1, -1]);
  return (
    <>
      <g clipPath={`url(#${clipId})`}>
        <motion.g style={{ y: sheetY, opacity: sheetOpacity }}>
          <Stroke d={SHEET} draw={draw} from={0.62} to={0.86} />
          <Stroke d={WRITING} draw={draw} from={0.78} to={1} />
        </motion.g>
      </g>
      <motion.g style={{ scaleY: flapScale, originX: 0.5, originY: 0 }}>
        <Stroke d={FLAP} draw={draw} from={0.56} to={0.8} />
      </motion.g>
    </>
  );
}
