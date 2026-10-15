'use client';
/** Owner: coordinator. Composes the film: skip link, header, scenes, the phone pill, footer. */
import { MotionConfig } from 'motion/react';
import { scenes } from '@/scenes';
import { CtaPill, Header, SkipLink } from '@/components/cta/Header';
import { Footer } from '@/components/site/Footer';
import type { FooterLink } from '@/lib/legal/publishable';

/** `footerLinks` comes from the server page (lib/legal/links.ts): the legal links after the gate. */
export function Film({ footerLinks }: { footerLinks?: readonly FooterLink[] }) {
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
      <Footer links={footerLinks} />
    </MotionConfig>
  );
}
