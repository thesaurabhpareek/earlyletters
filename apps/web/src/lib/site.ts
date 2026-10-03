import { brand } from '@scribe/brand';

/**
 * Site-level facts. The product name is never written here: it comes from
 * @scribe/brand. Domain and mailbox are fixed by D-005 and the brief.
 * TODO(founder, BL-100): once packages/brand/index.ts carries the real
 * domain and support email, read both from `brand.publisher` instead.
 */
export const SITE_URL = 'https://earlyletters.com';
export const CONTACT_EMAIL = 'hello@earlyletters.com';

/** Placeholder until the founder chooses how the publisher is named (D-004). */
export const PUBLISHER_PLACEHOLDER = '[Publisher name]';

/** Waitlist endpoint. null = not wired yet; the form renders but does not send. */
export const WAITLIST_ENDPOINT: string | null = null; // TODO(founder): first-party endpoint, no third-party embed.

export const name = brand.name;

export const mainNav = [
  { href: '/about', label: 'About' },
  { href: '/why', label: `Why ${brand.name}` },
  { href: '/contact', label: 'Contact' },
] as const;
