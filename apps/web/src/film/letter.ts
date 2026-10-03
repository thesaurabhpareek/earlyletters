/**
 * Owner: coordinator. The film's one letter, broken into the pieces scenes animate:
 * the words as heard (for listening), sentences (for captions), and a believable voice level.
 * Pure functions; no React.
 */
import { sampleLetter, type HeardSegment } from '@/content/site';

const segments = sampleLetter.heard as readonly HeardSegment[];

/** What the microphone caught, before any fix. */
export const heardText = segments.map((s) => s.text).join('');

/** Words as heard, each with its trailing punctuation, in order. */
export const heardWords: string[] = heardText.split(/\s+/).filter(Boolean);
export const WORD_COUNT = heardWords.length;

/** Sentences as heard, with the index of their first word and the word after their last. */
export const heardSentences: { text: string; from: number; to: number }[] = (() => {
  const out: { text: string; from: number; to: number }[] = [];
  let start = 0;
  heardWords.forEach((w, i) => {
    if (/[.!?]$/.test(w)) {
      out.push({ text: heardWords.slice(start, i + 1).join(' '), from: start, to: i + 1 });
      start = i + 1;
    }
  });
  if (start < heardWords.length) out.push({ text: heardWords.slice(start).join(' '), from: start, to: heardWords.length });
  return out;
})();

/** A small deterministic hash in 0..1 for word i, so every visit looks the same. */
const hash = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Voice level 0..1 at a fractional word position (0..WORD_COUNT). Syllable-like bumps inside each
 * word, a dip between words, longer quiet after commas and full stops: how a tired parent talks.
 */
export function voiceLevel(pos: number): number {
  if (pos <= 0 || pos >= WORD_COUNT) return 0.04;
  const i = Math.floor(pos);
  const f = pos - i;
  const word = heardWords[i];
  const syllables = Math.max(1, Math.round(word.replace(/[^a-z]/gi, '').length / 3.2));
  const bump = Math.pow(Math.abs(Math.sin(Math.PI * f * syllables)), 0.8);
  const loud = 0.55 + 0.45 * hash(i);
  // Words that end a clause trail off; the gap after them stays quiet.
  const tail = /[.!?]$/.test(word) ? 0.25 : /,$/.test(word) ? 0.5 : 1;
  const fade = f > 0.75 ? 1 - (f - 0.75) * 4 * (1 - tail) : 1;
  return Math.max(0.04, Math.min(1, bump * loud * fade));
}
