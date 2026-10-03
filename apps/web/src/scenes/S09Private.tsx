'use client';
/** Owner: SC6. Storyboard: docs/web/STORYBOARD.md scene s09. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s09;

export function S09Private() {
  return (
    <Scene id="private" label={copy.label} tone="night" length={2}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
