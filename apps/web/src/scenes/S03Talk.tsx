'use client';
/** Owner: SC2. Storyboard: docs/web/STORYBOARD.md scene s03. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s03;

export function S03Talk() {
  return (
    <Scene id="just-talk" label={copy.label} tone="night" length={3.5}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
