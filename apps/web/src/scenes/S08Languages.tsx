'use client';
/**
 * S08 "languages". Storyboard row S08; tone night; length 2.5.
 *
 *   0.00-0.04  Handoff from S07: night, empty.
 *   0.04-0.12  "Say it in your language." and the support line, at the top; they hold to 0.90.
 *   0.12-0.89  One sentence, seven times: English, Hindi, Spanish, Mandarin, French, Arabic, Portuguese,
 *              each in a typeface made for its script. Each arrives, holds, and gives way to the next;
 *              Arabic, written right to left, arrives from the right.
 *   0.90-0.98  Everything leaves (handoff to S09: night, empty).
 * Reduced motion: the seven lines as a calm stacked list.
 */
import { motion, useTransform, type MotionValue } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline, Support } from '@/film/Copy';
import { useStage } from '@/film/hooks';
import { site } from '@/content/site';
import { Grain, NightSky, Vignette } from '@/components/atmosphere';
import { arabicSerif, chineseSerif, devanagariSerif } from './parts/act3/fonts';
import stage from '@/film/stage.module.css';
import styles from './S08Languages.module.css';

const copy = site.scenes.s08;
const START = 0.12;
const STEP = 0.11;
const fontFor = (lang: string) =>
  lang.startsWith('hi') ? devanagariSerif.className : lang.startsWith('zh') ? chineseSerif.className : lang.startsWith('ar') ? arabicSerif.className : '';

export function S08Languages() {
  return (
    <Scene id="languages" label={copy.label} tone="night" length={2.5}>
      <LanguagesStage />
    </Scene>
  );
}

function Line({ p, i, last, line }: { p: MotionValue<number>; i: number; last: boolean; line: (typeof copy.lines)[number] }) {
  const s = START + i * STEP;
  const rtl = line.dir === 'rtl';
  const opacity = useTransform(p, last ? [s, s + 0.03, 0.9, 0.96] : [s, s + 0.03, s + STEP - 0.025, s + STEP], [0, 1, 1, 0]);
  const y = useTransform(p, last ? [s, s + 0.03] : [s, s + 0.03, s + STEP - 0.025, s + STEP], last ? [18, 0] : [18, 0, 0, -14]);
  const x = useTransform(p, [s, s + 0.035], rtl ? [28, 0] : [0, 0]);
  return (
    <motion.div className={styles.line} style={{ opacity, y, x }}>
      <span className={styles.lang}>{line.name}</span>
      <span lang={line.lang} dir={line.dir} className={[styles.text, fontFor(line.lang), styles[line.lang.slice(0, 2)] ?? ''].join(' ')}>
        {line.text}
      </span>
    </motion.div>
  );
}

function LanguagesStage() {
  const { p, resting } = useStage(0.5);
  const headOpacity = useTransform(p, [0.04, 0.12, 0.9, 0.97], [0, 1, 1, 0]);
  const headY = useTransform(p, [0.04, 0.12], [16, 0]);

  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <NightSky />
      <motion.div className={styles.copy} style={{ opacity: headOpacity, y: headY }}>
        <Headline>{copy.headline}</Headline>
        <Support>{copy.support}</Support>
      </motion.div>
      {resting ? (
        <ul className={styles.list}>
          {copy.lines.map((l) => (
            <li key={l.lang}>
              <span className={styles.lang}>{l.name}</span>
              <span lang={l.lang} dir={l.dir} className={[styles.text, fontFor(l.lang), styles[l.lang.slice(0, 2)] ?? ''].join(' ')}>
                {l.text}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className={styles.lines}>
          {copy.lines.map((l, i) => (
            <Line key={l.lang} p={p} i={i} last={i === copy.lines.length - 1} line={l} />
          ))}
        </div>
      )}
      <Vignette strength={1} />
      <Grain tone="night" />
    </div>
  );
}
