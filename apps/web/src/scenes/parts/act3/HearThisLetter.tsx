'use client';
/**
 * The optional "Hear this letter" control (storyboard S07). Hidden until a recorded letter with a voice
 * release exists; then it plays /audio/letter.m4a on tap (never autoplay). Returns nothing until then.
 */
export const HEAR_AVAILABLE = false;

export function HearThisLetter() {
  if (!HEAR_AVAILABLE) return null;
  return null;
}
