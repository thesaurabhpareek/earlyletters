'use client';
/** Owner: SC3. Storyboard: docs/web/STORYBOARD.md scene s04. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s04;

export function S04Exact() {
  return (
    <Scene id="exactly" label={copy.label} tone="paper" length={3}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
