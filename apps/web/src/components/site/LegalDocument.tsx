/** Owner: E1 (web platform). One legal document, rendered at build time from docs/legal. Never edits the text. */
import type { Metadata } from 'next';
import { legalDocuments, type LegalSlug } from '@/lib/legal/documents';
import { legalCopy } from '@/lib/legal/legal-copy';
import { loadLegalDocument } from '@/lib/legal/load';
import styles from './Legal.module.css';

export async function LegalDocument({ slug }: { slug: LegalSlug }) {
  const doc = await loadLegalDocument(slug);
  return (
    <article className={styles.prose} lang="en">
      {doc.final ? null : (
        <p className={styles.note} role="note">
          {legalCopy.finalising}
        </p>
      )}
      {doc.hasTitle ? null : <h1>{doc.title}</h1>}
      {/* doc.html has been through rehype-sanitize as the last step of the pipeline (lib/legal/render.ts). */}
      <div className={styles.body} dangerouslySetInnerHTML={{ __html: doc.html }} />
    </article>
  );
}

/** Title and description from the document, canonical URL, and noindex until the status is final. */
export async function legalMetadata(slug: LegalSlug): Promise<Metadata> {
  const doc = await loadLegalDocument(slug);
  return {
    title: doc.title,
    description: legalDocuments[slug].description,
    alternates: { canonical: doc.href },
    robots: doc.final ? undefined : { index: false, follow: true },
  };
}
