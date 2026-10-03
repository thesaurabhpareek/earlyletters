'use client';
/** Owner: SC5. Storyboard: docs/web/STORYBOARD.md scene s07. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s07;

export function S07Years() {
  return (
    <Scene id="years-later" label={copy.label} tone="dusk" length={3}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
