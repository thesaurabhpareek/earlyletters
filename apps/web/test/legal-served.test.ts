/**
 * [BL-565] The bytes the site serves at /legal/<doc>/0.9.0.md are the bytes whose sha256 the app records in
 * policy_versions.content_sha256 (docs/legal/POLICY_VERSIONING.md 7.2 and 9.2). If one byte changes, these fail:
 * a change is a new version at a new path, never an edit of 0.9.0.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { legalDocs, readLegalSource } from '../src/lib/legal/documents';
import { legalRawResponse } from '../src/lib/legal/serve';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

/** The same values as packages/content/test/legal-beta.test.ts (PR 616, BL-565) and its APPLY step 8.2 table. */
const PINNED = {
  terms: 'dfa303a731edd0fe5a68e05157587e260b00ea55b286cd57512156d0da0e6af1',
  privacy: '4ec16856b2527cfdc7987f7cb8018fd1ab095b4ecf6093d0fcfcecf4f990cfe4',
} as const;

describe('[BL-565] the served 0.9.0 text', () => {
  for (const doc of legalDocs) {
    it(`${doc}: the file on disk hashes to the published value`, () => {
      expect(sha256(readFileSync(join(WEB, 'content/legal', doc, '0.9.0.md')))).toBe(PINNED[doc]);
    });

    it(`${doc}: the answer at /legal/${doc}/0.9.0.md is those bytes, as text/markdown; charset=utf-8`, async () => {
      const res = legalRawResponse(doc, '0.9.0');
      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
      const bytes = new Uint8Array(await res.arrayBuffer());
      expect(sha256(bytes)).toBe(PINNED[doc]);
      expect(res.headers.get('content-length')).toBe(String(bytes.length));
      // No changed line endings, no changed last newline.
      const text = Buffer.from(bytes).toString('latin1');
      expect(text).not.toContain('\r');
      expect(text.endsWith('\n') && !text.endsWith('\n\n')).toBe(true);
    });

    it(`${doc}: both addresses exist as routes for 0.9.0 and name that version`, () => {
      const dir = join(WEB, 'src/app/(legal)/legal/[doc]');
      const page = readFileSync(join(dir, '0.9.0/page.tsx'), 'utf8');
      const raw = readFileSync(join(dir, '0.9.0.md/route.ts'), 'utf8');
      expect(page).toContain("const VERSION = '0.9.0'");
      expect(raw).toContain("const VERSION = '0.9.0'");
      expect(raw).toContain('legalRawResponse(doc, VERSION)');
      expect(existsSync(join(WEB, 'content/legal', doc, '0.9.0.md'))).toBe(true);
    });
  }

  it('a version that does not exist is not served', () => {
    expect(() => legalRawResponse('terms', '9.9.9')).toThrow();
    expect(() => legalRawResponse('terms', '../0.9.0')).toThrow();
  });
});

describe('[BL-778] nothing in the hosting settings can change which text is served', () => {
  // The sha256 pins above run in CI. The hosting build runs no test, so a setting made only in the hosting project
  // would swap the served text unseen. The folder the pages read therefore takes no input from the environment.
  const readsEnvironment = /process\s*(\.\s*env|\[)|import\.meta\.env|\bgetenv\b/;

  it('the files that locate and read the legal texts never read the environment', () => {
    for (const file of ['documents.ts', 'serve.ts', 'versions.ts']) {
      expect(readFileSync(join(WEB, 'src/lib/legal', file), 'utf8'), file).not.toMatch(readsEnvironment);
    }
  });

  it('the bytes the pages read are the committed files, which are the pinned ones', () => {
    for (const doc of legalDocs) {
      const committed = readFileSync(join(WEB, 'content/legal', doc, '0.9.0.md'));
      const read = readLegalSource(doc, '0.9.0');
      expect(Buffer.compare(read.raw, committed)).toBe(0);
      expect(sha256(read.raw)).toBe(PINNED[doc]);
    }
  });
});
