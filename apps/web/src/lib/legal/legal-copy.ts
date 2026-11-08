/**
 * Owner: E1 (web platform). Words around the two legal pages (the pages themselves are the texts in content/legal).
 * Content rules apply (VOICE.md; test/copy-rules.test.ts reads this file).
 * The public name comes from packages/brand and the contact address from src/content/site.ts, never typed here.
 */
import { brand } from '@scribe/brand';
import { site } from '../../content/site';

export const legalCopy = {
  backHome: `Back to ${brand.name}`,
  contact: site.footer.contact,
} as const;
