'use client';
/** Owner: coordinator. Composes the film: skip link, header, scenes, the phone pill, footer. */
import { MotionConfig } from 'motion/react';
import { useEffect } from 'react';
import { scenes } from '@/scenes';
import { CtaPill, Header, SkipLink } from '@/components/cta/Header';
import { useToneAt } from '@/components/cta/useTone';
import { Footer } from '@/components/site/Footer';
import { SmoothScroll } from './SmoothScroll';
import { AmbientSound } from './sound/AmbientSound';
import { ScrollNav } from './ScrollNav';
import { SceneTick } from './SceneTick';
import { ScrollProgress } from './ScrollProgress';

/** Paints the page behind the stages in the tone at the bottom edge, so the iOS toolbar strip matches. */
function PageTone() {
  const tone = useToneAt('bottom');
  useEffect(() => {
    document.documentElement.dataset.tone = tone;
  }, [tone]);
  return null;
}

export function Film() {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <div id="svh-probe" aria-hidden style={{ position: 'fixed', top: 0, left: 0, width: 0, height: '100svh', pointerEvents: 'none', visibility: 'hidden' }} />
        <PageTone />
        <SkipLink />
        <Header />
        <main>
          {scenes.map((SceneComponent, i) => (
            <SceneComponent key={i} />
          ))}
        </main>
        <CtaPill />
        <AmbientSound />
        <ScrollNav />
        <SceneTick />
        <ScrollProgress />
        <Footer />
      </SmoothScroll>
    </MotionConfig>
  );
}
