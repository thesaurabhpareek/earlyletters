/**
 * Owner: E1 (web platform). Words around the legal documents (never the documents themselves).
 * Proposed for src/content/site.ts; the coordinator moves them. Content rules apply (VOICE.md).
 * The public name comes from packages/brand, never typed here.
 */
import { brand } from '@scribe/brand';

export const legalCopy = {
  backHome: `Back to ${brand.name}`,
  /** Shown while a document's status is not final. Exact text from the brief. */
  finalising: 'This document is being finalised.',
  labels: {
    contents: 'Contents',
    table: 'Table, scrolls sideways',
  },
} as const;
