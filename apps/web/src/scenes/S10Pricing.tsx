'use client';
/**
 * S10 "pricing": one quiet frame, a breath before the end. Storyboard row S10; tone night; length 1.5.
 *   0.10-0.30  The free offer, then Plus in plain words and its two plans.   0.86-0.98  They leave.
 * The block is a real responsive layout (S10Pricing.module.css, PricingPlans.module.css), not a scaled one:
 * it fits from a 320 x 568 phone to a wide desktop and stays clear of the floating sign-up button.
 */
import { motion, useTransform } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { PricingPlans } from '@/components/site/PricingPlans';
import { useStage } from '@/film/hooks';
import { site } from '@/content/site';
import { Grain, LampLight, Vignette } from '@/components/atmosphere';
import stage from '@/film/stage.module.css';
import styles from './S10Pricing.module.css';

const copy = site.scenes.s10;

export function S10Pricing() {
  return (
    <Scene id="pricing" label={copy.label} tone="night" length={1.5} rest={0.5}>
      <PricingStage />
    </Scene>
  );
}

function PricingStage() {
  const { p, resting } = useStage(0.5);
  const opacity = useTransform(p, [0.1, 0.24, 0.86, 0.98], [0, 1, 1, 0]);
  const y = useTransform(p, [0.1, 0.24], [18, 0]);
  const supOpacity = useTransform(p, [0.16, 0.3, 0.86, 0.98], [0, 1, 1, 0]);
  const supY = useTransform(p, [0.16, 0.3], [12, 0]);
  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <LampLight intensity={0.25} x="50%" y="64%" size="85vmax" warmth="lamp" />
      <div className={styles.column}>
        <div className={styles.inner}>
          <motion.div style={{ opacity, y }}>
            <Headline>{copy.headline}</Headline>
          </motion.div>
          <motion.div className={styles.plans} style={{ opacity: supOpacity, y: supY }}>
            <PricingPlans />
          </motion.div>
        </div>
      </div>
      <Vignette strength={1} />
      <Grain tone="night" />
    </div>
  );
}
