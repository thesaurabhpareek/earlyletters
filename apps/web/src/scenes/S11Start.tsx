'use client';
/** Owner: SC6. Storyboard: docs/web/STORYBOARD.md scene s11. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s11;

export function S11Start() {
  return (
    <Scene id="start" label={copy.label} tone="night" length={1.5}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
