/**
 * Owner: E1 (web platform). Home, the legal documents that are publishable, and the deletion page.
 * A document that is held back (lib/legal/publishable.ts) says noindex on its page, so it is not listed here:
 * the sitemap never contradicts a page's robots meta. The shape of each entry is in lib/legal/sitemap.ts.
 */
import type { MetadataRoute } from 'next';
import { legalSlugs } from '@/lib/legal/documents';
import { loadLegalDocument } from '@/lib/legal/load';
import { siteOrigin } from '@/lib/legal/origin';
import { sitemapEntries } from '@/lib/legal/sitemap';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const legal = await Promise.all(legalSlugs.map((slug) => loadLegalDocument(slug)));
  return sitemapEntries(siteOrigin, legal);
}
