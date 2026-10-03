'use client';
/**
 * Owner: ACT3. Scene 07's still life: a nightstand with the reading lamp, a small pair of shoes on the
 * floor, the corner of a bed with its blanket. Nobody in it; the objects and the light say who lives here.
 * Box coordinates 400 x 220 (aspect-ratio set by the parent), everything in the film's one hand.
 */
import type { MotionValue } from 'motion/react';
import { ReadingLamp } from '@/components/drawings/ReadingLamp';
import { Shoes } from '@/components/drawings/Shoes';
import { Stroke } from './stroke';
import styles from './Room.module.css';

const FLOOR = 'M6 210.4 C70 209.6 150 210.9 214 210.2 M226.5 210.1 C290 209.5 350 210.8 394 210';
const NIGHTSTAND =
  'M16.5 128.6 C45 127.4 85 127.9 113.8 128.9 M21.4 129.3 C21.8 155 21.3 182 21.9 209.2 M108.6 129.4 C108.1 156 108.8 183 108.3 209.4 M22.4 158.4 C50 157.6 80 158.8 107.8 158.1';
const KNOB = 'M65 140.9 C63.3 140.9 63.3 144.2 65 144.2 C66.7 144.2 66.7 140.9 65 140.9';
const BED =
  'M399 95.6 C350 94.2 290 95.6 236.4 97.8 C231.6 120 233.8 148 230.9 172.4 C262 176.8 300 171.2 330 175.1 C356 178.4 380 173.9 399 175.4';
const BED_FOLD = 'M262.4 99.6 C266.1 121 262.9 146 267.6 171.4';
const BED_LEG = 'M240.6 176.8 C240.9 188 240.2 198 240.8 209.2';

export function Room({ draw, lampDraw, shoesDraw }: { draw?: MotionValue<number>; lampDraw?: MotionValue<number>; shoesDraw?: MotionValue<number> }) {
  return (
    <div className={styles.room} aria-hidden>
      <svg viewBox="0 0 400 220" className={styles.lines} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <Stroke d={FLOOR} draw={draw} from={0} to={0.4} />
        <Stroke d={BED} draw={draw} from={0.12} to={0.62} />
        <Stroke d={BED_FOLD} draw={draw} from={0.5} to={0.7} />
        <Stroke d={BED_LEG} draw={draw} from={0.55} to={0.72} />
        <Stroke d={NIGHTSTAND} draw={draw} from={0.3} to={0.86} />
        <Stroke d={KNOB} draw={draw} from={0.84} to={1} />
      </svg>
      <ReadingLamp className={styles.lamp} draw={lampDraw} strokeWidth={1.6} />
      <Shoes className={styles.shoes} draw={shoesDraw} strokeWidth={1.7} />
    </div>
  );
}
