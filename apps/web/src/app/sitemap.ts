/**
 * Owner: E1 (web platform). Every address a crawler may index: home, /privacy and /terms. The versioned test texts
 * (/legal/<doc>/0.9.0) are deliberately not listed and say noindex (BL-565, review B2 of 8 Nov): they are drafts for the
 * app's testers, and they must not compete with the site's own policy in search. Each legal page carries its own
 * "Last updated" date. No changefreq or priority: crawlers ignore both.
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
