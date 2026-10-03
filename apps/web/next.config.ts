import type { NextConfig } from 'next';

// Owner: E1 (web platform). Headers, the /lab switch and the build setup.
// NEXT_DIST_DIR lets parallel agents run their own dev servers without sharing .next.

const isProd = process.env.NODE_ENV === 'production';

/**
 * /lab holds the scene test pages. In production they answer 404 unless ENABLE_LAB=1.
 * This is read when the config loads, which for a deploy is `next build`: set ENABLE_LAB=1 in the
 * environment of the build (not only at runtime) to publish the lab, for example on a preview.
 */
const labEnabled = !isProd || process.env.ENABLE_LAB === '1';

/**
 * Content-Security-Policy that works with static rendering.
 * Next's own inline scripts (the page data) need 'unsafe-inline'. A nonce would remove that, but the Next 16
 * guide says a nonce forces every page to render per request, which would end static pages and CDN caching
 * (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md, "Without Nonces").
 * The experimental SRI option is the documented static alternative; revisit it when it leaves experimental.
 * No third-party origins yet: fonts are self-hosted, analytics and the form are same-origin.
 * Development adds 'unsafe-eval' (React debugging) and websockets (hot reload); production does not.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isProd ? '' : ' ws: wss:'}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ['upgrade-insecure-requests'] : []),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Two years. No `preload`: that is a one-way listing the founder should choose (hstspreload.org).
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Camera, microphone and location stay off. The contribution page (v1.1) will need microphone for itself only.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Older browsers; frame-ancestors above is the modern equivalent.
  { key: 'X-Frame-Options', value: 'DENY' },
];

// Links that carry a token never leak their address through Referer (docs/tdd/04-security-identity.md 3.1.6).
const tokenLinkPaths = ['/a', '/i', '/j', '/r'];

/**
 * One address for the site: earlyletters.com. The other names people may type or have bookmarked answer with a
 * permanent redirect (308) to the same path and query on the primary domain. The rule only matches these host
 * names, so earlyletters.com itself, preview URLs and local development are never redirected. It takes effect
 * once the domain is attached to the Vercel project and its DNS points there (docs/ops/WEBSITE_RUNBOOK.md 4).
 * The apple-app-site-association file is served only from the primary domain, which is why it is not exempt here.
 */
const PRIMARY_HOST = 'earlyletters.com';
const REDIRECT_HOSTS = ['www.earlyletters.com', 'earlyletters.app', 'www.earlyletters.app'];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  distDir: process.env.NEXT_DIST_DIR || '.next',
  transpilePackages: ['@scribe/brand', '@scribe/design-tokens'],

  async redirects() {
    return REDIRECT_HOSTS.map((host) => ({
      source: '/:path*',
      has: [{ type: 'host' as const, value: host }],
      destination: `https://${PRIMARY_HOST}/:path*`,
      permanent: true,
    }));
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Later rules override earlier ones for the same header key.
      ...tokenLinkPaths.map((path) => ({
        source: `${path}/:rest*`,
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }],
      })),
    ];
  },

  async rewrites() {
    return {
      // Checked before pages and files, so the lab page cannot win. The destination does not exist, so the
      // visitor sees the 404 page and the address bar keeps /lab/... .
      beforeFiles: labEnabled ? [] : [{ source: '/lab/:path*', destination: '/lab-is-not-published' }],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
