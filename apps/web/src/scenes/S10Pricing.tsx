'use client';
/**
 * S10 "pricing": one quiet frame, a breath before the end. Storyboard row S10; tone night; length 1.5.
 *   0.10-0.30  "Free to write, read and keep." and the line about Plus.   0.86-0.98  They leave.
 */
import { motion, useTransform } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline, Support } from '@/film/Copy';
import { useStage } from '@/film/hooks';
import { site } from '@/content/site';
import { Grain, Vignette } from '@/components/atmosphere';
import stage from '@/film/stage.module.css';

const copy = site.scenes.s10;

export function S10Pricing() {
  return (
    <Scene id="pricing" label={copy.label} tone="night" length={1.5}>
      <PricingStage />
    </Scene>
  );
}

function PricingStage() {
  const { p, resting } = useStage(0.5);
  const opacity = useTransform(p, [0.1, 0.24, 0.86, 0.98], [0, 1, 1, 0]);
  const y = useTransform(p, [0.1, 0.24], [18, 0]);
  const supOpacity = useTransform(p, [0.16, 0.3, 0.86, 0.98], [0, 1, 1, 0]);
  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <div className={stage.copyCenter} style={{ color: 'var(--night-ink)' }}>
        <div>
          <motion.div style={{ opacity, y }}>
            <Headline style={{ fontSize: 'clamp(36px, 5vw, 80px)' }}>{copy.headline}</Headline>
          </motion.div>
          <motion.div style={{ opacity: supOpacity }}>
            <Support>{copy.support}</Support>
          </motion.div>
        </div>
      </div>
      <Vignette strength={1} />
      <Grain tone="night" />
    </div>
  );
}
