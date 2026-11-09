/** Owner: E1 (web platform). The permanent page of version 0.9.0 of a legal text: /legal/terms/0.9.0 and /legal/privacy/0.9.0. */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalDocument, legalDocumentMetadata } from '@/components/site/LegalDocument';
import { isLegalDoc, legalDocs } from '@/lib/legal/documents';

const VERSION = '0.9.0';

// Built once at `next build`; only the two documents exist, anything else is a 404.
export const dynamic = 'error';
export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocs.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: { params: Promise<{ doc: string }> }): Promise<Metadata> {
  const { doc } = await params;
  if (!isLegalDoc(doc)) notFound();
  return legalDocumentMetadata(doc, VERSION);
}

export default async function Page({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!isLegalDoc(doc)) notFound();
  return <LegalDocument doc={doc} version={VERSION} />;
}
