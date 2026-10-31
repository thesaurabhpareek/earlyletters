'use client';
/**
 * S10 "pricing": one quiet frame, a breath before the end. Storyboard row S10; tone night; length 1.5.
 *   0.10-0.30  "Two letters free. Then Plus." and the line about Plus.   0.86-0.98  They leave.
 */
import { useLayoutEffect, useRef, useState } from 'react';
import { motion, useTransform } from 'motion/react';
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { PricingPlans } from '@/components/site/PricingPlans';
import { useStage } from '@/film/hooks';
import { site } from '@/content/site';
import { Grain, LampLight, Vignette } from '@/components/atmosphere';
import stage from '@/film/stage.module.css';

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
  // On a short phone the whole block (headline and both plans) is taller than the screen. Scale it to fit
  // rather than cut anything: measured against the stage height, leaving room for the header.
  const boxRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const avail = (el.closest('[data-live]') as HTMLElement | null)?.clientHeight ?? window.innerHeight;
      const need = el.offsetHeight;
      const next = need > 0 ? Math.max(0.58, Math.min(1, (avail - 176) / need)) : 1;
      setFit((f) => (Math.abs(f - next) < 0.005 ? f : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);
  return (
    <div className={stage.frame} data-resting={resting || undefined}>
      <LampLight intensity={0.25} x="50%" y="64%" size="85vmax" warmth="lamp" />
      <div className={stage.copyCenter} style={{ color: 'var(--night-ink)' }}>
        <div ref={boxRef} style={{ maxWidth: '52rem', transform: fit < 1 ? `scale(${fit})` : undefined, transformOrigin: 'center center' }}>
          <motion.div style={{ opacity, y }}>
            <Headline style={{ fontSize: 'clamp(36px, 5vw, 80px)' }}>{copy.headline}</Headline>
          </motion.div>
          <motion.div style={{ opacity: supOpacity }}>
            <PricingPlans />
          </motion.div>
        </div>
      </div>
      <Vignette strength={1} />
      <Grain tone="night" />
    </div>
  );
}
