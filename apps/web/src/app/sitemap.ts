/**
 * Owner: E1 (web platform). Every address a crawler may index: home, /privacy and /terms, and the permanent pages of the
 * versioned texts (/legal/<doc>/0.9.0). Each legal page carries its own date: "Last updated" for /privacy and /terms, the
 * version's changelog row for a permanent page. No changefreq or priority: crawlers ignore both.
 */
import type { MetadataRoute } from 'next';
import { legalPage, legalSlugs } from '@/lib/legal/pages';
import { siteOrigin } from '@/lib/legal/origin';
import { legalVersionPage } from '@/lib/legal/versions';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteOrigin },
    ...legalSlugs.map((slug) => {
      const page = legalPage(slug);
      return { url: `${siteOrigin}${page.href}`, lastModified: page.lastUpdated };
    }),
    ...legalSlugs.map((slug) => {
      const page = legalVersionPage(slug, '0.9.0');
      return { url: `${siteOrigin}${page.href}`, lastModified: page.published };
    }),
  ];
}
