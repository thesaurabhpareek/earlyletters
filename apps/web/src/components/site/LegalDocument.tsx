/**
 * Owner: E1 (web platform). The permanent page of a versioned legal text: the body of content/legal/<doc>/<version>.md
 * as HTML (lib/legal/versions.ts). The words are in the markdown, never here. /terms and /privacy are LegalPage.tsx.
 */
import type { Metadata } from 'next';
import type { LegalDoc } from '@/lib/legal/documents';
import { legalVersionPage } from '@/lib/legal/versions';
import styles from './Legal.module.css';
import textStyles from './LegalDocument.module.css';

export function LegalDocument({ doc, version }: { doc: LegalDoc; version: string }) {
  const page = legalVersionPage(doc, version);
  // The HTML is rendered at build from our own file and sanitized (renderLegalHtml).
  return <article className={`${styles.prose} ${textStyles.text}`} lang="en" dangerouslySetInnerHTML={{ __html: page.html }} />;
}

export function legalDocumentMetadata(doc: LegalDoc, version: string): Metadata {
  const page = legalVersionPage(doc, version);
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: page.href },
  };
}
