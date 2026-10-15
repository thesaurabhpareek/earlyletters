/**
 * Owner: E1 (web platform). What the sitemap lists: only addresses a crawler may index. A legal document that is
 * held back says noindex on its page, so it is not listed; a sitemap never contradicts a page's robots meta.
 * Entries carry url and, for a legal page, the document's own last_updated date. No changefreq or priority:
 * crawlers ignore both, and a listed address with no date is the honest shape for a page without one.
 */
import type { MetadataRoute } from 'next';

export interface SitemapDocument {
  href: string;
  publishable: boolean;
  lastUpdated: string | undefined;
}

export function sitemapEntries(origin: string, docs: readonly SitemapDocument[]): MetadataRoute.Sitemap {
  return [
    { url: origin },
    ...docs
      .filter((doc) => doc.publishable)
      .map((doc) => ({ url: `${origin}${doc.href}`, ...(doc.lastUpdated ? { lastModified: doc.lastUpdated } : {}) })),
    { url: `${origin}/delete-account` },
  ];
}
