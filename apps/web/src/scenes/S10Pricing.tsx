'use client';
/** Owner: SC6. Storyboard: docs/web/STORYBOARD.md scene s10. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s10;

export function S10Pricing() {
  return (
    <Scene id="pricing" label={copy.label} tone="paper" length={1.5}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
