'use client';
/** Owner: coordinator. Composes the film. */
import { MotionConfig } from 'motion/react';
import { scenes } from '@/scenes';
import { Header } from '@/components/cta/Header';
import { Footer } from '@/components/site/Footer';

export function Film() {
  return (
    <MotionConfig reducedMotion="user">
      <Header />
      <main>
        {scenes.map((SceneComponent) => (
          <SceneComponent key={SceneComponent.name} />
        ))}
      </main>
      <Footer />
    </MotionConfig>
  );
}
