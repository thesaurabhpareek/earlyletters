'use client';
/** Stub screen. Replaced by its owner (see docs/web/TEAM.md). Keep the name and props. */
import { sampleLetter, site } from '@/content/site';
import type { TonightScreenProps } from './types';

export function TonightScreen(_: TonightScreenProps) {
  void sampleLetter;
  return <div style={{ padding: '8cqw', fontSize: '4.5cqw', opacity: 0.7 }}>{site.scenes.s02.appGreeting}</div>;
}
