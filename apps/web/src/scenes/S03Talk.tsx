'use client';
/**
 * S03 "just-talk", the emotional engine. Storyboard row S03; tone night to paper; length 3.9.
 *
 *   0.00-0.04  Handoff from S02: Speak pressed; the screen turns to Listening.
 *   0.03-0.11  "Just talk." and the support line (beside the phone; above it on phones).
 *   0.08-0.66  The letter is spoken: the glow breathes with a believable voice, its terracotta light
 *              spills into the room, and the words arrive in the phone as heard. The current sentence
 *              sits large in Literata beside the phone (above it on phones), like a film's captions.
 *   0.66-0.80  The voice stops; the last line holds. 0.74-0.82 a paper sheet rises inside the screen
 *              carrying the letter at 1/fill scale.
 *   0.82-0.94  The camera pushes in: the phone grows past the frame, its chrome fades, and the letter
 *              lands at exactly S04's reading size and place. Never a blank frame.
 * Reduced motion: the phone on Listening with the words beside it.
 */
import { motion, motionValue, useTransform, type MotionValue } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline, Support } from '@/film/Copy';
import { PaperLetter } from '@/film/PaperLetter';
import { phoneWidthFor, useStage, useViewport } from '@/film/hooks';
import { heardSentences, voiceLevel, WORD_COUNT } from '@/film/letter';
import { site } from '@/content/site';
import { ListeningScreen, PhoneFrame, TonightScreen } from '@/components/app-ui';
import { Grain, LampLight, Vignette } from '@/components/atmosphere';
import stage from '@/film/stage.module.css';
import styles from './S03Talk.module.css';

const copy = site.scenes.s03;
const ONE_MV = motionValue(1);

export function S03Talk() {
  return (
    <Scene id="just-talk" label={copy.label} tone="night" length={3.9} rest={0.3} toneStops={[{ at: 0.86, tone: 'paper' }]}>
      <TalkStage />
    </Scene>
  );
}

function Caption({ words, from, to, last, text }: { words: MotionValue<number>; from: number; to: number; last: boolean; text: string }) {
  const opacity = useTransform(words, last ? [from - 0.6, from] : [from - 0.6, from, to, to + 0.8], last ? [0, 1] : [0, 1, 1, 0]);
  const y = useTransform(words, [from - 0.6, from], [10, 0]);
  return (
    <motion.p className={[styles.caption, last ? styles.captionLast : ''].join(' ')} style={{ opacity, y }}>
      {text}
    </motion.p>
  );
}

function TalkStage() {
  const { p, resting } = useStage(0.3);
  const { w, h } = useViewport();
  const narrow = w < 1100;
  const width = phoneWidthFor(w, h);
  const screenW = width * 0.916;
  const screenH = (screenW * 844) / 390;
  const fill = Math.max(w / screenW, h / screenH) * 1.08;

  const words = useTransform(p, [0.08, 0.66], [0, WORD_COUNT]);
  const level = useTransform(words, (v) => (v >= WORD_COUNT ? 0.08 : voiceLevel(v)));
  const spill = useTransform(level, (v) => 0.2 + 0.65 * v);
  const spillOut = useTransform(p, [0.7, 0.8], [1, 0]);

  const tonight = useTransform(p, [0, 0.04], [1, 0]);
  const sheetY = useTransform(p, [0.74, 0.82], ['100%', '0%']);
  const grow = useTransform(p, [0.82, 0.94], [1, fill]);
  const chrome = useTransform(p, [0.84, 0.9], [1, 0]);
  const phoneY = useTransform(p, narrow ? [0, 0.04, 0.72, 0.8] : [0, 1], narrow ? ['0svh', '9svh', '9svh', '0svh'] : ['0svh', '0svh']);

  const headOpacity = useTransform(p, narrow ? [0.03, 0.1, 0.32, 0.38] : [0.03, 0.1, 0.36, 0.42], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.03, 0.1], [16, 0]);
  const supOpacity = useTransform(p, narrow ? [0.06, 0.12, 0.32, 0.38] : [0.06, 0.12, 0.36, 0.42], [0, 1, 1, 0]);

  const captions = useTransform(p, [0.4, 0.44, 0.78, 0.84], [0, 1, 1, 0]);
  const cleanup = useTransform(p, [0.92, 0.96], [0, 1]);

  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <motion.div className={stage.layer} style={{ opacity: spillOut }}>
        <LampLight intensity={spill} x="50%" y="52%" size={narrow ? '150vmax' : '95vmax'} warmth="recording" />
      </motion.div>

      <div className={styles.phoneStage}>
        <motion.div style={{ y: phoneY, scale: grow }}>
          <PhoneFrame width={width} scheme="dark" chrome={chrome}>
            <ListeningScreen level={level} words={words} />
            <motion.div style={{ position: 'absolute', inset: 0, opacity: tonight }}>
              <TonightScreen press={ONE_MV} />
            </motion.div>
            <motion.div className={styles.sheet} style={{ y: sheetY }} aria-hidden>
              <div className={styles.sheetLetter} style={{ width: `calc(min(100vw - 2 * var(--gutter), 31 * clamp(19px, 1.75vw, 26px)) )`, transform: `translate(-50%, -50%) scale(${1 / fill})` }}>
                <PaperLetter />
              </div>
            </motion.div>
          </PhoneFrame>
        </motion.div>
      </div>

      <div className={[stage.copySide, styles.copy].join(' ')}>
        <motion.div style={{ opacity: headOpacity, y: headY }}>
          <Headline>{copy.headline}</Headline>
        </motion.div>
        <motion.div style={{ opacity: supOpacity }}>
          <Support>{copy.support}</Support>
        </motion.div>
      </div>

      <motion.div className={styles.captions} style={{ opacity: captions }} aria-hidden>
        {heardSentences.map((s, i) => (
          <Caption key={i} words={words} from={s.from} to={s.to} last={i === heardSentences.length - 1} text={s.text} />
        ))}
      </motion.div>

      <Vignette strength={1} />
      <Grain tone="night" />

      <motion.div className={styles.paper} style={{ opacity: cleanup }}>
        <PaperLetter />
      </motion.div>
    </div>
  );
}
