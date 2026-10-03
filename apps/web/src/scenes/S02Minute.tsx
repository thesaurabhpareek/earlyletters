'use client';
/** Owner: SC1. Storyboard: docs/web/STORYBOARD.md scene s02. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s02;

export function S02Minute() {
  return (
    <Scene id="a-minute" label={copy.label} tone="night" length={2.5}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
