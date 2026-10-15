/**
 * Owner: E1 (web platform). Words around the two legal pages (the pages themselves are privacy-copy.ts and
 * terms-copy.ts). Content rules apply (VOICE.md; test/copy-rules.test.ts reads this file).
 * The public name comes from packages/brand and the contact address from src/content/site.ts, never typed here.
 */
import { brand } from '@scribe/brand';
import { site } from '../../content/site';

export const legalCopy = {
  backHome: `Back to ${brand.name}`,
  lastUpdated: 'Last updated:',
  /**
   * Shown where the publisher's legal name goes until PUBLISHER_LEGAL_NAME is set at build (lib/legal/publisher.ts).
   * The name itself never goes in code (docs/DECISIONS.md D-004).
   */
  publisherPlaceholder: '[Publisher legal name]',
  contact: site.footer.contact,
} as const;
