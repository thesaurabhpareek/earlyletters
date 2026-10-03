'use client';
/**
 * Owner: E4 (app UI). Faithful web replicas of the real Early Letters screens
 * (apps/mobile), used inside <PhoneFrame>. Presentational only. Sized with
 * container query units (cqw) so they scale with the frame.
 *
 * CONTRACT (scenes depend on these names and props; keep them stable):
 * every animation prop is an optional MotionValue<number> driven by the scene.
 * Without it, the screen renders its resting state.
 */
import type { MotionValue } from 'motion/react';
import { sampleLetter, site } from '@/content/site';

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

const stub = (name: string) => ({ padding: '8cqw', fontSize: '4.5cqw', opacity: 0.7, fontFamily: 'var(--font-sans)' }) as const;

export function TonightScreen(_: TonightScreenProps) {
  return <div style={stub('Tonight')}>{site.scenes.s02.appGreeting}. {site.scenes.s02.appPrompt}</div>;
}
export function ListeningScreen(_: ListeningScreenProps) {
  return <div style={stub('Listening')}>{site.scenes.s03.appTo}</div>;
}
export function ReviewScreen(_: ReviewScreenProps) {
  return <div style={stub('Review')}>{sampleLetter.text.slice(0, 120)}</div>;
}
export function LetterScreen(_: LetterScreenProps) {
  return <div style={stub('Letter')}>{site.scenes.s07.appFrom}</div>;
}
export function BookScreen(_: BookScreenProps) {
  return <div style={stub('Book')}>{site.scenes.s06.appTitle}</div>;
}
