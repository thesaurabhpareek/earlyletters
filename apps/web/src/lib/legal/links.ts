/**
 * Owner: E1 (web platform). The footer's legal links after the gate (publishable.ts). Server only: it reads
 * docs/legal through the loader. The footer takes the list as a prop, so the film (a client component) shows the
 * same links without any server code of its own.
 */
import { site } from '@/content/site';
import { legalSlugs } from './documents';
import { loadLegalDocument } from './load';
import { filterFooterLinks, resolveLegalPagesMode, type FooterLink } from './publishable';

export async function footerLinks(): Promise<FooterLink[]> {
  const mode = resolveLegalPagesMode(process.env);
  if (mode === 'holding') return [...site.footer.links];
  const docs = await Promise.all(legalSlugs.map((slug) => loadLegalDocument(slug)));
  const held = new Set(docs.filter((doc) => !doc.publishable).map((doc) => doc.href));
  return filterFooterLinks(site.footer.links, mode, held);
}
