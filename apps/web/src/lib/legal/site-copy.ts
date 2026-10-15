/**
 * Owner: E1 (web platform). Words for the footer and the 404 page. Proposed for src/content/site.ts,
 * where the coordinator moves them. The footer links (Privacy, Terms, Contact) live in site.footer.
 * The public name and tagline come from packages/brand, never typed here.
 */
import { brand } from '@scribe/brand';

export const siteCopy = {
  footer: {
    legalNavLabel: 'Legal',
    tagline: brand.tagline,
  },
  notFound: {
    title: 'Page not found',
    line: 'We could not find that page.',
    home: `Back to ${brand.name}`,
  },
} as const;
