import type { MotionValue } from 'motion/react';

/** CONTRACT for app screens. Every animation prop is an optional MotionValue<number>
 * driven by a scene; without it, the screen renders its resting state. */
export type TonightScreenProps = { /** 0..1: Speak button press. */ press?: MotionValue<number> };
export type ListeningScreenProps = {
  /** 0..1 smoothed voice level for the breathing glow. */
  level?: MotionValue<number>;
  /** Number of words of sampleLetter.text revealed (0..wordCount). */
  words?: MotionValue<number>;
};
export type ReviewScreenProps = { /** 0 = slip underlined, 1 = slip fixed. */ fix?: MotionValue<number> };
export type LetterScreenProps = { /** 0..1 playback position. No word highlighting (v1.1). */ playback?: MotionValue<number> };
export type BookScreenProps = { /** 0..1 the new letter settling into Month 9. */ arrive?: MotionValue<number> };
