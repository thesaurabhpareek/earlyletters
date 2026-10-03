'use client';
/**
 * Owner: ACT3. Scene 07 "years-later", the emotional peak. Storyboard row S07; tone dusk; length 3.
 *
 * Nobody is shown. A reading lamp, a small pair of shoes by a bed: the room says a child lives here,
 * the light says a parent is sitting with them. The phone plays the same letter, in the same voice.
 *
 * Timeline over progress p (one timeline for every size; only the layout differs, in CSS):
 *   0.00-0.03  Dusk, centre empty (handoff from S06: dusk, the book gone).
 *   0.03-0.13  "Years from now" arrives alone, top left (desktop) or top (phone).
 *   0.06-0.30  The room draws itself: floor, bed, nightstand. Lamp 0.12-0.30, shoes 0.22-0.36.
 *   0.28-0.42  The lamp comes on: warm pool of light from the shade; edges deepen.
 *   0.40-0.56  The phone rises into the lamp light with the letter open; the room steps back and dims.
 *   0.44-0.90  Playback runs (scrubber and time), small motion inside the phone, far from the words.
 *   0.54-0.62  Headline in; support 0.60-0.68; both hold in clear space until 0.86.
 *   0.86-0.97  Night falls: words, phone, room and light go out; the night layer comes up.
 *   0.97-1.00  Night, centre empty (handoff to S08).
 * Reduced motion: no pinning; one composed frame (p held at 0.72): words, phone playing, room, lamp on.
 */
import { motion, useTransform } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Dateline, Headline, Support } from '@/film/Copy';
import { site } from '@/content/site';
import { PhoneFrame } from '@/components/app-ui/PhoneFrame';
import { LetterScreen } from '@/components/app-ui/screens/Letter';
import { LampLight, Vignette } from '@/components/atmosphere';
import { Room } from './parts/act3/Room';
import { HearThisLetter } from './parts/act3/HearThisLetter';
import { useStage } from './parts/act3/stage';
import { useViewport } from './parts/act3/viewport';
import styles from './S07Years.module.css';

const copy = site.scenes.s07;

function phoneWidth(w: number, h: number) {
  if (w < 768) {
    const reserve = Math.min(340, Math.max(250, h * 0.4));
    return Math.round(Math.max(150, Math.min(300, w * 0.64, (h - reserve) / 2.09)));
  }
  return Math.round(Math.max(240, Math.min(330, (h - 180) / 2.09)));
}

export function S07Years() {
  return (
    <Scene id="years-later" label={copy.label} tone="dusk" length={3}>
      <YearsStage />
    </Scene>
  );
}

function YearsStage() {
  const { p, resting } = useStage(0.72);
  const { w, h } = useViewport();

  const datelineOpacity = useTransform(p, [0.03, 0.13, 0.86, 0.94], [0, 1, 1, 0]);
  const datelineY = useTransform(p, [0.03, 0.13], [10, 0]);

  const roomDraw = useTransform(p, [0.06, 0.3], [0, 1]);
  const lampDraw = useTransform(p, [0.12, 0.3], [0, 1]);
  const shoesDraw = useTransform(p, [0.22, 0.36], [0, 1]);
  const roomOpacity = useTransform(p, [0.4, 0.56, 0.86, 0.95], [1, 0.3, 0.3, 0]);
  const roomScale = useTransform(p, [0.4, 0.56], [1, 0.94]);
  const roomY = useTransform(p, [0.38, 0.56], ['calc(var(--room-lift) * 1)', 'calc(var(--room-lift) * 0)']);

  const lamp = useTransform(p, [0.28, 0.42, 0.84, 0.95], [0, 1, 1, 0]);
  const glow = useTransform(p, [0.42, 0.58, 0.84, 0.95], [0, 0.75, 0.75, 0]);
  const vignette = useTransform(p, [0.28, 0.45], [0.35, 1]);

  const phoneY = useTransform(p, [0.4, 0.56, 0.86, 0.96], ['105%', '0%', '0%', '6%']);
  const phoneOpacity = useTransform(p, [0.4, 0.46, 0.86, 0.95], [0, 1, 1, 0]);
  const playback = useTransform(p, [0.44, 0.9], [0.06, 0.78]);

  const headOpacity = useTransform(p, [0.54, 0.62, 0.86, 0.93], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.54, 0.62], [14, 0]);
  const supportOpacity = useTransform(p, [0.6, 0.68, 0.86, 0.93], [0, 1, 1, 0]);
  const supportY = useTransform(p, [0.6, 0.68], [10, 0]);

  const night = useTransform(p, [0.84, 0.97], [0, 1]);

  return (
    <div className={styles.frame} data-resting={resting || undefined}>
      <Vignette strength={vignette} />

      <motion.div className={styles.roomSlot} style={{ opacity: roomOpacity, scale: roomScale, y: roomY }}>
        <div className={styles.lampLight}>
          <LampLight intensity={lamp} x="16%" y="44%" size="190%" warmth="lamp" />
        </div>
        <div className={styles.room}>
          <Room draw={roomDraw} lampDraw={lampDraw} shoesDraw={shoesDraw} />
        </div>
      </motion.div>

      <div className={styles.glow}>
        <LampLight intensity={glow} x="50%" y="55%" size="120%" warmth="dusk" />
      </div>

      <motion.div className={styles.phoneSlot} style={{ y: phoneY, opacity: phoneOpacity }}>
        <PhoneFrame width={phoneWidth(w, h)} scheme="light" className={styles.phone}>
          <LetterScreen playback={playback} />
        </PhoneFrame>
      </motion.div>

      <div className={styles.copy}>
        <motion.div style={{ opacity: datelineOpacity, y: datelineY }}>
          <Dateline style={{ opacity: 1 }}>
            <span className={styles.when}>{copy.dateline}</span>
          </Dateline>
        </motion.div>
        <motion.div style={{ opacity: headOpacity, y: headY }}>
          <Headline style={{ fontSize: 'var(--s07-head)' }}>{copy.headline}</Headline>
        </motion.div>
        <motion.div style={{ opacity: supportOpacity, y: supportY }}>
          <Support style={{ opacity: 0.86 }}>{copy.support}</Support>
          <HearThisLetter />
        </motion.div>
      </div>

      <motion.div className={styles.night} style={{ opacity: night }} aria-hidden />
    </div>
  );
}
