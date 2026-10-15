/**
 * What the suite expects of the legal pages, computed from the same sources the site is built from: the documents
 * in docs/legal and the gate in src/lib/legal/publishable.ts. The mode comes from E2E_LEGAL_PAGES, which global-setup
 * passes to the build as LEGAL_PAGES (holding unless set to unlink).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { site } from '../../src/content/site';
import { legalDocuments, legalSlugs, type LegalSlug } from '../../src/lib/legal/documents';
import { splitFrontmatter } from '../../src/lib/legal/frontmatter';
import { decidePublishable, filterFooterLinks, resolveLegalPagesMode, type FooterLink, type LegalPagesMode } from '../../src/lib/legal/publishable';

const LEGAL_DIR = join(__dirname, '../../../../docs/legal');

export function legalPagesMode(): LegalPagesMode {
  return resolveLegalPagesMode({ LEGAL_PAGES: process.env.E2E_LEGAL_PAGES });
}

export type LegalExpectation = { slug: LegalSlug; href: string; title: string; publishable: boolean; blockers: string[] };

/** Read from docs/legal and decided by the gate: what the page for this document must show. */
export function legalExpectation(slug: LegalSlug): LegalExpectation {
  const info = legalDocuments[slug];
  const { data, body } = splitFrontmatter(readFileSync(join(LEGAL_DIR, info.file), 'utf8'));
  return { slug, href: info.href, title: data.title ?? info.description, ...decidePublishable(data.status, body) };
}

export function heldHrefs(): Set<string> {
  return new Set(legalSlugs.map(legalExpectation).filter((doc) => !doc.publishable).map((doc) => doc.href));
}

/** The legal links every footer must show in this run's mode. */
export function expectedFooterLinks(): FooterLink[] {
  return filterFooterLinks(site.footer.links, legalPagesMode(), heldHrefs());
}

/**
 * The marks of a counsel draft, written out here on their own rather than imported from the gate, so this check holds
 * even if the gate's list were edited: the audit question is whether a visitor can ever see one of these.
 */
export const DRAFT_MARKS: { name: string; pattern: RegExp }[] = [
  { name: 'a placeholder token such as {PUBLISHER_LEGAL_NAME}', pattern: /\{[A-Z_]+\}/ },
  { name: 'a counsel tag [CN-', pattern: /\[CN-/ },
  { name: 'a counsel tag [HN-', pattern: /\[HN-/ },
  { name: 'a counsel note [COUNSEL', pattern: /\[COUNSEL/ },
  { name: 'a todo tag [TODO', pattern: /\[TODO/ },
  { name: 'a todo call TODO(', pattern: /TODO\(/ },
  { name: 'the drafting notice', pattern: /Drafting notice/ },
  { name: 'the notes for counsel appendix', pattern: /Appendix A\. Notes for counsel/ },
  { name: 'COUNSEL MUST CONFIRM', pattern: /COUNSEL MUST CONFIRM/ },
];
