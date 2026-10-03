'use client';
/** Stub screen. Replaced by its owner (see docs/web/TEAM.md). Keep the name and props. */
import { sampleLetter, site } from '@/content/site';
import type { ReviewScreenProps } from './types';

export function ReviewScreen(_: ReviewScreenProps) {
  void sampleLetter;
  return <div style={{ padding: '8cqw', fontSize: '4.5cqw', opacity: 0.7 }}>{sampleLetter.dateline}</div>;
}
