/**
 * Owner: E1 (web platform). One legal page: the body of a versioned text (lib/legal/documents.ts), as HTML.
 * The words are in content/legal/<doc>/<version>.md, never here.
 */
import type { Metadata } from 'next';
import { legalPage, type LegalSlug } from '@/lib/legal/pages';
import styles from './Legal.module.css';

/** `version` omitted: the current version, as the floating /terms and /privacy show it. */
export function LegalPage({ slug, version }: { slug: LegalSlug; version?: string }) {
  const page = legalPage(slug, version);
  // The HTML is rendered at build from our own file and sanitized (renderLegalHtml).
  return <article className={styles.prose} lang="en" dangerouslySetInnerHTML={{ __html: page.html }} />;
}

export function legalMetadata(slug: LegalSlug, version?: string): Metadata {
  const page = legalPage(slug, version);
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: version ? page.versionHref : page.href },
  };
}
