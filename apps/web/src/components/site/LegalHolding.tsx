/**
 * Owner: E1 (web platform). What a legal address shows while its document is not publishable (lib/legal/publishable.ts):
 * the document's name, one calm line, and where to write. Nothing from the draft is rendered. The page says noindex
 * (components/site/LegalDocument.tsx legalMetadata) and is left out of the sitemap.
 */
import { legalCopy } from '@/lib/legal/legal-copy';
import styles from './Legal.module.css';

export function LegalHolding({ title }: { title: string }) {
  const { line, questions, contact } = legalCopy.holding;
  return (
    <article className={styles.prose} lang="en" data-holding="">
      <h1>{title}</h1>
      <p>{line}</p>
      <p>
        {questions} <a href={`mailto:${contact}`}>{contact}</a>
      </p>
    </article>
  );
}
