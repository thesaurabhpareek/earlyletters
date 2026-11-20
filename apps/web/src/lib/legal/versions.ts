/**
 * Owner: E1 (web platform). The permanent page of a versioned legal text: /legal/<doc>/<version>. The words are the
 * markdown in content/legal (documents.ts); nothing is written in code. The floating /terms and /privacy are separate
 * pages (pages.ts, terms-copy.ts, privacy-copy.ts) and show none of this.
 */
import { readLegalSource, renderLegalHtml, type LegalDoc } from './documents';

export interface LegalVersionPage {
  doc: LegalDoc;
  version: string;
  /** The permanent address of this version's page, and of its raw file. */
  href: string;
  rawHref: string;
  metaTitle: string;
  metaDescription: string;
  /** The body as HTML (frontmatter removed). It starts with the h1 and the line "Version 0.9.0, a test version." */
  html: string;
  /** The date of the version's own changelog row, ISO (YYYY-MM-DD). */
  published: string;
}

export function legalVersionHref(doc: LegalDoc, version: string): string {
  return `/legal/${doc}/${version}`;
}

export function legalVersionPage(doc: LegalDoc, version: string): LegalVersionPage {
  const { meta, body } = readLegalSource(doc, version);
  const row = new RegExp(`^\\| ${version.replaceAll('.', '\\.')} \\| (\\d{4}-\\d{2}-\\d{2}) \\|`, 'm').exec(body);
  if (!row) throw new Error(`${doc} ${version}: the changelog has no row for this version.`);
  const href = legalVersionHref(doc, version);
  return {
    doc,
    version,
    href,
    rawHref: `${href}.md`,
    metaTitle: meta.title,
    metaDescription: `${meta.title}, version ${version}. For family testers of the TestFlight builds.`,
    html: renderLegalHtml(body),
    published: row[1],
  };
}
