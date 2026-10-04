/** Owner: E1 (web platform). The film and the legal pages are open; the lab and the API are not for crawlers. */
import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/legal/origin';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/lab', '/api', '/unsubscribe'] }],
    sitemap: `${siteOrigin}/sitemap.xml`,
  };
}
