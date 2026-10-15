/**
 * Owner: E1 (web platform). Words around the legal documents (never the documents themselves).
 * Proposed for src/content/site.ts; the coordinator moves them. Content rules apply (VOICE.md).
 * The public name comes from packages/brand and the contact address from src/content/site.ts, never typed here.
 */
import { brand } from '@scribe/brand';
import { site } from '../../content/site';

export const legalCopy = {
  backHome: `Back to ${brand.name}`,
  /** The page a legal address shows while its document is not publishable (lib/legal/publishable.ts). */
  holding: {
    line: 'This page is being finished with our lawyers and will be here before the app is.',
    questions: 'Questions:',
    contact: site.footer.contact,
  },
  labels: {
    contents: 'Contents',
    table: 'Table, scrolls sideways',
    /** The line under a document's title, from its front matter: "Version 1.4.0. Effective date: 1 November 2026." */
    version: 'Version',
    effectiveDate: 'Effective date',
  },
} as const;
