/** Logical points inside a 390-wide PhoneFrame screen (an inline-size container). */
export const u = (pt: number) => `${((pt / 390) * 100).toFixed(3)}cqw`;
export const MUTED = 'color-mix(in srgb, currentColor 66%, transparent)';
export const FAINT = 'color-mix(in srgb, currentColor 14%, transparent)';

import { motionValue } from 'motion/react';
/** A MotionValue that is always 0, for optional animation props. */
export const ZERO = motionValue(0);
