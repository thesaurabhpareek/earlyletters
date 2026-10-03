/** Owner: E1 (web platform). Which legal documents the site publishes, and where each one lives in the repo. */
import { brand } from '@scribe/brand';

export const legalSlugs = ['privacy', 'terms', 'health-privacy', 'subprocessors'] as const;
export type LegalSlug = (typeof legalSlugs)[number];

export interface LegalDocumentInfo {
  slug: LegalSlug;
  href: `/${LegalSlug}`;
  /** File name under docs/legal/. The Markdown there is the single source of truth; this site never edits it. */
  file: string;
  /** Neutral summary for search and sharing. Not legal text. */
  description: string;
}

export const legalDocuments: Record<LegalSlug, LegalDocumentInfo> = {
  privacy: {
    slug: 'privacy',
    href: '/privacy',
    file: 'privacy-policy.md',
    description: `The ${brand.name} Privacy Policy.`,
  },
  terms: {
    slug: 'terms',
    href: '/terms',
    file: 'terms-of-service.md',
    description: `The ${brand.name} Terms of Service.`,
  },
  'health-privacy': {
    slug: 'health-privacy',
    href: '/health-privacy',
    file: 'consumer-health-data-notice.md',
    description: `The ${brand.name} Consumer Health Data Privacy Policy.`,
  },
  subprocessors: {
    slug: 'subprocessors',
    href: '/subprocessors',
    file: 'subprocessors.md',
    description: `The service providers that help run ${brand.name}.`,
  },
};
