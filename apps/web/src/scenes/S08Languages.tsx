'use client';
/** Owner: SC5. Storyboard: docs/web/STORYBOARD.md scene s08. Stub until the owner lands it. */
import { Scene } from '@/film/Scene';
import { Headline } from '@/film/Copy';
import { site } from '@/content/site';

const copy = site.scenes.s08;

export function S08Languages() {
  return (
    <Scene id="languages" label={copy.label} tone="night" length={2.5}>
      <Headline>{copy.headline}</Headline>
    </Scene>
  );
}
