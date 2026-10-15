/**
 * Owner: E1 (web platform). The legal pages the site publishes: /privacy and /terms, short pages written in this
 * folder (privacy-copy.ts, terms-copy.ts). Nothing is read from docs/legal: those are the drafts for the app.
 */
import { legalCopy } from './legal-copy';
import { privacyCopy } from './privacy-copy';
import { publisherName } from './publisher';
import { termsCopy } from './terms-copy';
import type { InlineLink, LegalPageCopy } from './types';

export const legalSlugs = ['privacy', 'terms'] as const;
export type LegalSlug = (typeof legalSlugs)[number];

const build: Record<LegalSlug, (publisher: string) => LegalPageCopy> = { privacy: privacyCopy, terms: termsCopy };

export interface LegalPage extends LegalPageCopy {
  slug: LegalSlug;
  href: `/${LegalSlug}`;
  /** Text that becomes a link wherever it appears in a paragraph. */
  links: InlineLink[];
}

export function legalPage(slug: LegalSlug, env: Readonly<Record<string, string | undefined>> = process.env): LegalPage {
  const links: InlineLink[] = [{ text: legalCopy.contact, href: `mailto:${legalCopy.contact}` }];
  if (slug === 'terms') links.push({ text: 'Privacy Policy', href: '/privacy' });
  return { ...build[slug](publisherName(env)), slug, href: `/${slug}`, links };
}

/** "2026-10-15" as "October 15, 2026", the same on every machine. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' });
}

/** Splits a paragraph around the texts that become links, in reading order. */
export function splitLinks(text: string, links: readonly InlineLink[]): (string | InlineLink)[] {
  const parts: (string | InlineLink)[] = [];
  let rest = text;
  while (rest) {
    let next: { at: number; link: InlineLink } | undefined;
    for (const link of links) {
      const at = rest.indexOf(link.text);
      if (at >= 0 && (!next || at < next.at)) next = { at, link };
    }
    if (!next) {
      parts.push(rest);
      break;
    }
    if (next.at > 0) parts.push(rest.slice(0, next.at));
    parts.push(next.link);
    rest = rest.slice(next.at + next.link.text.length);
  }
  return parts;
}
