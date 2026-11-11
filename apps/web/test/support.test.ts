/**
 * /support: the words, the route and the sitemap entry. Owner: content with E1 (web platform).
 * Characters and voice are checked by copy-rules.test.ts, which reads src/lib/support.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { supportCopy } from '../src/lib/support/copy';

const WEB = fileURLToPath(new URL('..', import.meta.url));
const text = [supportCopy.title, ...supportCopy.intro, ...supportCopy.sections.flatMap((s) => [s.heading, ...s.blocks])].join('\n');

describe('/support', () => {
  it('names the support address from packages/brand, once, with no other address', () => {
    expect(supportCopy.intro.join(' ')).toContain(brand.support.email);
    expect(text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)).toEqual([brand.support.email]);
  });

  it('keeps the two approved promises, and promises no response time', () => {
    expect(text).toContain('A person reads every message.');
    expect(text).toContain('You never need to send a letter or a recording to get help.');
    expect(text).not.toMatch(/\b(within|hours?|days?|24|48|instantly|immediately)\b/i);
  });

  it('has unique section ids and no empty section', () => {
    const ids = supportCopy.sections.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const s of supportCopy.sections) expect(s.blocks.length).toBeGreaterThan(0);
  });

  it('is a static route at /support', () => {
    const src = readFileSync(join(WEB, 'src/app/(legal)/support/page.tsx'), 'utf8');
    expect(src).toContain("export const dynamic = 'error'");
    expect(src).toContain('supportMetadata');
  });

  it('is in the sitemap with its own date', () => {
    const src = readFileSync(join(WEB, 'src/app/sitemap.ts'), 'utf8');
    expect(src).toContain('${siteOrigin}/support');
    expect(src).toContain('supportCopy.lastUpdated');
  });

  it('is the store listing support page', async () => {
    const { storeListing } = await import('../../../packages/content/src/store.en');
    expect(storeListing.supportUrl).toBe(`${brand.web.origin}/support`);
  });
});
