/**
 * Owner: E1 (web platform). The legal pages the site publishes. The words are the versioned texts in content/legal
 * (documents.ts): /terms and /privacy show the current version, /legal/<doc>/<version> is its permanent page and
 * /legal/<doc>/<version>.md the raw file. Nothing is written in code any more.
 */
import { currentVersion, readLegalSource, renderLegalHtml, type LegalDoc } from './documents';

export const legalSlugs = ['privacy', 'terms'] as const satisfies readonly LegalDoc[];
export type LegalSlug = (typeof legalSlugs)[number];

export interface LegalPage {
  slug: LegalSlug;
  version: string;
  /** The floating address, which always shows the current version. */
  href: `/${LegalSlug}`;
  /** The permanent address of this version's page, and of its raw file. */
  versionHref: string;
  rawHref: string;
  metaTitle: string;
  metaDescription: string;
  /** The body as HTML (frontmatter removed). It starts with the h1 and the line "Version 0.9.0, a test version." */
  html: string;
  /** The date of the version's own changelog row, ISO (YYYY-MM-DD). */
  published: string;
}

export function legalVersionHref(slug: LegalSlug, version: string): string {
  return `/legal/${slug}/${version}`;
}

export function legalPage(slug: LegalSlug, version: string = currentVersion): LegalPage {
  const { meta, body } = readLegalSource(slug, version);
  const row = new RegExp(`^\\| ${version.replaceAll('.', '\\.')} \\| (\\d{4}-\\d{2}-\\d{2}) \\|`, 'm').exec(body);
  if (!row) throw new Error(`${slug} ${version}: the changelog has no row for this version.`);
  return {
    slug,
    version,
    href: `/${slug}`,
    versionHref: legalVersionHref(slug, version),
    rawHref: `${legalVersionHref(slug, version)}.md`,
    metaTitle: meta.title,
    metaDescription: `${meta.title}, version ${version}. For family testers of the TestFlight builds.`,
    html: renderLegalHtml(body),
    published: row[1],
  };
}
