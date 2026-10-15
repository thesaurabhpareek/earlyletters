/**
 * Owner: E1 (web platform). One legal document, rendered at build time from docs/legal. Never edits the text.
 * A document that is not publishable (lib/legal/publishable.ts) is not rendered at all: its address shows the
 * holding page instead, in both LEGAL_PAGES modes, so a linked address never answers 404.
 */
import type { Metadata } from 'next';
import { legalDocuments, type LegalSlug } from '@/lib/legal/documents';
import { loadLegalDocument } from '@/lib/legal/load';
import { LegalHolding } from './LegalHolding';
import styles from './Legal.module.css';

export async function LegalDocument({ slug }: { slug: LegalSlug }) {
  const doc = await loadLegalDocument(slug);
  if (!doc.publishable) return <LegalHolding title={doc.title} />;
  return (
    <article className={styles.prose} lang="en">
      {doc.hasTitle ? null : <h1>{doc.title}</h1>}
      {/* doc.html has been through rehype-sanitize as the last step of the pipeline (lib/legal/render.ts). */}
      <div className={styles.body} dangerouslySetInnerHTML={{ __html: doc.html }} />
    </article>
  );
}

/** Title and description from the document, canonical URL, and noindex while the document is held back. */
export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const doc = await loadLegalDocument(slug);
  return {
    title: doc.title,
    description: legalDocuments[slug].description,
    alternates: { canonical: doc.href },
    robots: doc.publishable ? undefined : { index: false, follow: true },
  };
}
