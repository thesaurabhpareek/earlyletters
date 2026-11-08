'use client';
/**
 * Owner: coordinator. The finished letter becoming a card, shared by S05 (where it forms) and S06
 * (where it starts), so the handoff matches. `card` 0..1 brings in the card surface, its dateline and
 * signature; `playback` drives the player pill (no waveform, no word highlighting).
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { sampleLetter, site } from '@/content/site';
import { PaperLetter } from './PaperLetter';
import styles from './LetterCard.module.css';

const TOTAL = (() => {
  const [m, s] = sampleLetter.duration.split(':').map(Number);
  return m * 60 + s;
})();
const clock = (v: number) => {
  const s = Math.round(Math.max(0, Math.min(1, v)) * TOTAL);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export type LetterCardProps = {
  card: MotionValue<number>;
  player: MotionValue<number>;
  playback?: MotionValue<number>;
};

export function LetterCard({ card, player, playback }: LetterCardProps) {
  return (
    <div className={styles.wrap}>
      <motion.div aria-hidden className={styles.surface} style={{ opacity: card }} />
      <motion.p className={styles.dateline} style={{ opacity: card }}>
        {sampleLetter.dateline}
      </motion.p>
      <PaperLetter final className={styles.letter} />
      <div className={styles.below}>
        <motion.p className={styles.sign} style={{ opacity: card }}>
          {sampleLetter.from}
        </motion.p>
        <Player player={player} playback={playback} />
      </div>
    </div>
  );
}

function Player({ player, playback }: { player: MotionValue<number>; playback?: MotionValue<number> }) {
  const y = useTransform(player, [0, 1], [16, 0]);
  const scaleX = playback ?? 0.04;
  const time = playback ? <LiveClock playback={playback} /> : clock(0);
  return (
    <motion.div className={styles.player} style={{ opacity: player, y }} aria-hidden>
      <span className={styles.play}>
        <svg viewBox="0 0 20 20" fill="currentColor">
          <path d="M6 3.9c0-.8.9-1.3 1.6-.9l9 5.6c.6.4.6 1.4 0 1.8l-9 5.6c-.7.4-1.6-.1-1.6-.9z" />
        </svg>
      </span>
      <span className={styles.from}>{site.scenes.s07.appFrom}</span>
      <span className={styles.track}>
        <motion.span className={styles.fill} style={{ scaleX }} />
      </span>
      <span className={styles.time}>
        {time} / {sampleLetter.duration}
      </span>
    </motion.div>
  );
}

function LiveClock({ playback }: { playback: MotionValue<number> }) {
  const t = useTransform(playback, clock);
  return <motion.span>{t}</motion.span>;
}
