/**
 * Owner: E1 (web platform). The raw text of version 0.9.0, unchanged: /legal/terms/0.9.0.md and /legal/privacy/0.9.0.md.
 * The bytes are the file's own (frontmatter, line endings and last newline included): policy_versions.content_sha256
 * is the sha256 of exactly these bytes, and test/legal-served.test.ts checks it.
 */
import { isLegalDoc, legalDocs } from '@/lib/legal/documents';
import { legalRawResponse } from '@/lib/legal/serve';

const VERSION = '0.9.0';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocs.map((doc) => ({ doc }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!isLegalDoc(doc)) return new Response('Not found', { status: 404 });
  return legalRawResponse(doc, VERSION);
}
