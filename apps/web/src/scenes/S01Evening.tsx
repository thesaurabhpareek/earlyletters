'use client';
/** Owner: SC1. Storyboard: docs/web/STORYBOARD.md scene s01. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s01;

export function S01Evening() {
  return (
    <Scene id="evening" label={copy.label} tone="night" length={3}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
