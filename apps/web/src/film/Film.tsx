'use client';
/** Owner: coordinator. Composes the film: skip link, header, scenes, the phone pill, footer. */
import { MotionConfig } from 'motion/react';
import { scenes } from '@/scenes';
import { CtaPill, Header, SkipLink } from '@/components/cta/Header';
import { Footer } from '@/components/site/Footer';

export function Film() {
  return (
    <MotionConfig reducedMotion="user">
      <SkipLink />
      <Header />
      <main>
        {scenes.map((SceneComponent) => (
          <SceneComponent key={SceneComponent.name} />
        ))}
      </main>
      <CtaPill />
      <Footer />
    </MotionConfig>
  );
}
