'use client';
/**
 * S05 "your-voice". Storyboard row S05; tone paper; length 2.
 *
 *   0.00-0.04  Handoff from S04: paper, the finished letter, centred.
 *   0.06-0.18  The player rises under the letter: From Papa, 0:00 / 1:12.
 *   0.16-0.70  It plays with scroll (no waveform, no word highlighting).
 *   0.18-0.28  The letter steps down; "Your voice stays with it." and the support line arrive above.
 *   0.58-0.66  The words leave; the letter returns to the centre.
 *   0.64-0.94  The letter becomes a card: surface, dateline and signature come in as it shrinks to 0.6.
 *   0.94-1.00  Handoff to S06: the card, centred, at 0.6.
 * Reduced motion: the card with its player and the headline.
 */
import { useRef } from 'react';
import { motion, useTransform } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline, Support } from '@/film/Copy';
import { LetterCard } from '@/film/LetterCard';
import { useStage, useViewport } from '@/film/hooks';
import { useLetterFit } from '@/film/fit';
import { site } from '@/content/site';
import { Grain, PaperTexture, Vignette } from '@/components/atmosphere';
import stage from '@/film/stage.module.css';
import styles from './S05Voice.module.css';

const copy = site.scenes.s05;
export const CARD_SCALE = 0.6;
/** What hangs under the letter's own box: the signature and the player (the `below` strip of LetterCard). */
const hangBelow = (letter: HTMLElement) => {
  const below = letter.firstElementChild?.lastElementChild;
  return below instanceof HTMLElement ? below.offsetHeight : 0;
};

export function S05Voice() {
  return (
    <Scene id="your-voice" label={copy.label} tone="paper" length={2.4} rest={0.45}>
      <VoiceStage />
    </Scene>
  );
}

function VoiceStage() {
  const { p, resting } = useStage(0.45);
  const { w, h } = useViewport();
  const narrow = w < 900;

  const player = useTransform(p, [0.06, 0.18], [0, 1]);
  const playback = useTransform(p, [0.16, 0.7], [0, 1]);
  const card = useTransform(p, [0.64, 0.8], [0, 1]);
  const down = narrow ? h * 0.06 : h * 0.09;
  const y = useTransform(p, [0.18, 0.28, 0.58, 0.66], [0, down, down, 0]);
  const frameRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);
  // On a short phone the letter, with its player, will not fit between the words and the sign-up pill at the
  // usual 0.86. Then it settles earlier, smaller and higher, and stays clear of both until it becomes the card.
  const fit = useLetterFit({ frame: frameRef, words: wordsRef, letter: letterRef, hang: hangBelow, maxScale: 0.86, w, h });
  const tight = fit !== null;
  const yTight = useTransform(p, [0.03, 0.1, 0.64, 0.94], [0, fit?.y ?? 0, fit?.y ?? 0, 0]);
  const scaleTight = useTransform(p, [0.03, 0.1, 0.64, 0.94], [1, fit?.scale ?? 1, fit?.scale ?? 1, CARD_SCALE]);
  const scale = useTransform(p, [0.18, 0.28, 0.58, 0.66, 0.68, 0.94], [1, 0.86, 0.86, 1, 1, CARD_SCALE]);

  const headOpacity = useTransform(p, [0.2, 0.28, 0.56, 0.62], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.2, 0.28], [16, 0]);
  const supOpacity = useTransform(p, [0.24, 0.32, 0.56, 0.62], [0, 1, 1, 0]);

  return (
    <div ref={frameRef} className={stage.frame} data-resting={resting || undefined}>
      <PaperTexture />
      <div className={styles.cardStage}>
        <motion.div ref={letterRef} style={{ y: tight ? yTight : y, scale: tight ? scaleTight : scale }}>
          <LetterCard card={card} player={player} playback={playback} />
        </motion.div>
      </div>
      <div ref={wordsRef} className={styles.copy}>
        <motion.div style={{ opacity: headOpacity, y: headY }}>
          <Headline>{copy.headline}</Headline>
        </motion.div>
        <motion.div style={{ opacity: supOpacity }}>
          <Support>{copy.support}</Support>
        </motion.div>
      </div>
      <Vignette tone="paper" strength={0.8} />
      <Grain tone="paper" />
    </div>
  );
}
