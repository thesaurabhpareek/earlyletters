'use client';
/**
 * S03 "just-talk", the emotional engine. Storyboard row S03; tone night; length 3.5.
 *
 *   0.00-0.04  Handoff from S02: Speak pressed; the screen turns to Listening.
 *   0.03-0.11  "Just talk." and the support line (beside the phone; above it on phones).
 *   0.08-0.66  The letter is spoken: the glow breathes with a believable voice, its terracotta light
 *              spills into the room, and the words arrive in the phone as heard. On desktop the
 *              current sentence also sits large beside the phone, like a film's captions.
 *   0.66-0.72  The voice stops; the glow settles.
 *   0.70-0.80  The screen turns to paper; 0.76-0.92 the phone grows past the edges of the frame.
 *   0.86-0.96  The room becomes paper and the letter, as heard, settles at reading size (handoff to S04).
 * Reduced motion: the phone on Listening with the words beside it; then the paper letter follows in S04.
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
    <Scene id="just-talk" label={copy.label} tone="night" length={3.5}>
      <TalkStage />
    </Scene>
  );
}

function Caption({ words, from, to, last, text }: { words: MotionValue<number>; from: number; to: number; last: boolean; text: string }) {
  const opacity = useTransform(words, last ? [from - 0.6, from] : [from - 0.6, from, to, to + 0.8], last ? [0, 1] : [0, 1, 1, 0]);
  const y = useTransform(words, [from - 0.6, from], [10, 0]);
  return (
    <motion.p className={styles.caption} style={{ opacity, y }}>
      {text}
    </motion.p>
  );
}

function TalkStage() {
  const { p, resting } = useStage(0.5);
  const { w, h } = useViewport();
  const narrow = w < 900;
  const width = phoneWidthFor(w, h);
  const screenW = width * 0.916;
  const screenH = (screenW * 844) / 390;
  const fill = Math.max(w / screenW, h / screenH) * 1.12;

  const words = useTransform(p, [0.08, 0.66], [0, WORD_COUNT]);
  const level = useTransform(words, (v) => (v >= WORD_COUNT ? 0.08 : voiceLevel(v)));
  const spill = useTransform(level, (v) => 0.2 + 0.65 * v);
  const spillOut = useTransform(p, [0.66, 0.76], [1, 0]);

  const tonight = useTransform(p, [0, 0.04], [1, 0]);
  const listening = useTransform(p, [0.7, 0.78], [1, 0]);
  const paperScreen = useTransform(p, [0.7, 0.8], [0, 1]);
  const grow = useTransform(p, [0.76, 0.92], [1, fill]);
  const phoneY = useTransform(p, narrow ? [0, 0.04, 0.36, 0.46] : [0, 1], narrow ? ['0svh', '13svh', '13svh', '0svh'] : ['0svh', '0svh']);

  const headOpacity = useTransform(p, narrow ? [0.03, 0.1, 0.32, 0.38] : [0.03, 0.1, 0.36, 0.42], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.03, 0.1], [16, 0]);
  const supOpacity = useTransform(p, narrow ? [0.06, 0.12, 0.32, 0.38] : [0.06, 0.12, 0.36, 0.42], [0, 1, 1, 0]);

  const captions = useTransform(p, [0.4, 0.44, 0.68, 0.74], [0, 1, 1, 0]);
  const paper = useTransform(p, [0.86, 0.92], [0, 1]);
  const letterIn = useTransform(p, [0.9, 0.96], [0, 1]);
  const letterY = useTransform(p, [0.9, 0.96], [10, 0]);

  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <motion.div className={stage.layer} style={{ opacity: spillOut }}>
        <LampLight intensity={spill} x="50%" y="52%" size={narrow ? '150vmax' : '95vmax'} warmth="recording" />
      </motion.div>

      <div className={styles.phoneStage}>
        <motion.div style={{ y: phoneY, scale: grow }}>
          <PhoneFrame width={width} scheme="dark">
            <motion.div style={{ position: 'absolute', inset: 0, opacity: listening }}>
              <ListeningScreen level={level} words={words} />
            </motion.div>
            <motion.div style={{ position: 'absolute', inset: 0, opacity: tonight }}>
              <TonightScreen press={ONE_MV} />
            </motion.div>
            <motion.div aria-hidden style={{ position: 'absolute', inset: 0, background: 'var(--paper)', opacity: paperScreen }} />
          </PhoneFrame>
        </motion.div>
      </div>

      <div className={stage.copySide}>
        <motion.div style={{ opacity: headOpacity, y: headY }}>
          <Headline>{copy.headline}</Headline>
        </motion.div>
        <motion.div style={{ opacity: supOpacity }}>
          <Support>{copy.support}</Support>
        </motion.div>
      </div>

      {!narrow ? (
        <motion.div className={styles.captions} style={{ opacity: captions }} aria-hidden>
          {heardSentences.map((s, i) => (
            <Caption key={i} words={words} from={s.from} to={s.to} last={i === heardSentences.length - 1} text={s.text} />
          ))}
        </motion.div>
      ) : null}

      <Vignette strength={1} />
      <Grain tone="night" />

      <motion.div className={styles.paper} style={{ opacity: paper }}>
        <motion.div style={{ opacity: letterIn, y: letterY }}>
          <PaperLetter />
        </motion.div>
      </motion.div>
    </div>
  );
}

