/**
 * Owner: E1 (web platform). The raw legal text as an HTTP answer: the file's own bytes, as text/markdown; charset=utf-8.
 * Nothing is read as text and written back, so line endings and the last newline cannot change (BL-565).
 */
import { readLegalSource, type LegalDoc } from './documents';

export function legalRawResponse(doc: LegalDoc, version: string): Response {
  const { raw } = readLegalSource(doc, version);
  return new Response(new Uint8Array(raw), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Length': String(raw.length),
      'Cache-Control': 'public, max-age=300',
    },
  });
}
