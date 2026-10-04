/**
 * Owner: E1 (web platform). Home, the four legal documents and the deletion page.
 * Legal pages carry the document's own last_updated date. Documents that are not final are still listed;
 * their pages say noindex until their status is final (see components/site/LegalDocument.tsx).
 */
import type { MetadataRoute } from 'next';
import { legalSlugs } from '@/lib/legal/documents';
import { loadLegalDocument } from '@/lib/legal/load';
import { siteOrigin } from '@/lib/legal/origin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const legal = await Promise.all(legalSlugs.map((slug) => loadLegalDocument(slug)));
  return [
    { url: siteOrigin, changeFrequency: 'monthly', priority: 1 },
    ...legal.map((doc) => ({
      url: `${siteOrigin}${doc.href}`,
      lastModified: doc.lastUpdated,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    })),
    { url: `${siteOrigin}/delete-account`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
