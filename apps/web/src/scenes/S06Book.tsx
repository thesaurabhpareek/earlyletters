'use client';
/** Owner: SC4. Storyboard: docs/web/STORYBOARD.md scene s06. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s06;

export function S06Book() {
  return (
    <Scene id="the-book" label={copy.label} tone="paper" length={3}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
