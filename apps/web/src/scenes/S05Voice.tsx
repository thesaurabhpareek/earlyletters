'use client';
/** Owner: SC3. Storyboard: docs/web/STORYBOARD.md scene s05. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s05;

export function S05Voice() {
  return (
    <Scene id="your-voice" label={copy.label} tone="paper" length={2}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
