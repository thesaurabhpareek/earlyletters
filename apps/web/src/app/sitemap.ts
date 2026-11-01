/**
 * Owner: E1 (web platform). Every address a crawler may index: home, /privacy and /terms. Each legal page carries its
 * own "Last updated" date. No changefreq or priority: crawlers ignore both.
 */
import type { MetadataRoute } from 'next';
import { legalPage, legalSlugs } from '@/lib/legal/pages';
import { siteOrigin } from '@/lib/legal/origin';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteOrigin },
    ...legalSlugs.map((slug) => {
      const page = legalPage(slug);
      return { url: `${siteOrigin}${page.href}`, lastModified: page.lastUpdated };
    }),
  ];
}
