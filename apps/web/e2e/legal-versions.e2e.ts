/**
 * The permanent pages of the versioned legal texts (/legal/<doc>/0.9.0), their raw files (/legal/<doc>/0.9.0.md) and the
 * proof that /terms and /privacy are still the website's own pages (BL-565; founder decision, 8 Nov 2026: versioned only).
 * The words of the texts are in content/legal; the words of /terms and /privacy are in src/lib/legal/*-copy.ts (pages.e2e.ts).
 */
import { createHash } from 'node:crypto';
import { brand } from '@scribe/brand';
import { site } from '../src/content/site';
import { readLegalSource } from '../src/lib/legal/documents';
import { legalCopy } from '../src/lib/legal/legal-copy';
import { legalSlugs } from '../src/lib/legal/pages';
import { legalVersionPage } from '../src/lib/legal/versions';
import { expect, test } from './support/fixtures';
import { DRAFT_MARKS, INTERNAL_MARKS } from './support/legal';

/** sha256 of the raw 0.9.0 files: the values in PR 616 (the table for APPLY step 8.2) and packages/content legal-beta.test.ts. */
const PUBLISHED_SHA256 = {
  terms: 'dfa303a731edd0fe5a68e05157587e260b00ea55b286cd57512156d0da0e6af1',
  privacy: '4ec16856b2527cfdc7987f7cb8018fd1ab095b4ecf6093d0fcfcecf4f990cfe4',
} as const;

const TITLE = { terms: 'Terms of Service', privacy: 'Privacy Policy' } as const;

test.describe('versioned legal pages', () => {
  for (const slug of legalSlugs) {
    const path = `/legal/${slug}/0.9.0`;
    const doc = legalVersionPage(slug, '0.9.0');

    test(`${path}: one h1, "Version 0.9.0, a test version." under it, every section, a way home, the three footer links, noindex`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${brand.name} ${TITLE[slug]}`);
      await expect(page.locator('main article > h1 + p')).toHaveText('Version 0.9.0, a test version.');
      await expect(page).toHaveTitle(doc.metaTitle);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://earlyletters.com${path}`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
      // Every "## " heading of the text, in order.
      const headings = [...readLegalSource(slug, '0.9.0').body.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
      expect(headings.length).toBeGreaterThan(10);
      await expect(page.locator('main h2')).toHaveText(headings);
      await expect(page.getByText('Early Letters is run by its founder ("we", "us").')).toBeVisible();
      await expect(page.locator('main').getByRole('link', { name: site.footer.contact }).first()).toHaveAttribute('href', `mailto:${site.footer.contact}`);
      await expect(page.getByRole('link', { name: legalCopy.backHome })).toHaveAttribute('href', '/');
      // The footer: Privacy, Terms, Contact. Nothing else.
      const footer = page.getByRole('navigation', { name: 'Legal' });
      await expect(footer.getByRole('link')).toHaveCount(site.footer.links.length);
      for (const link of site.footer.links) await expect(footer.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    });

    test(`${path} shows no counsel mark, no internal reference and no bracketed blank, and not the frontmatter`, async ({ page, request }) => {
      // The draft marks are checked in everything the server sends; the internal marks in what a visitor reads.
      const html = await (await request.get(path)).text();
      await page.goto(path);
      const text = await page.locator('main').innerText();
      for (const mark of DRAFT_MARKS) {
        expect(html, `${mark.name} in the HTML the server sends for ${path}`).not.toMatch(mark.pattern);
        expect(text, `${mark.name} in what a visitor reads on ${path}`).not.toMatch(mark.pattern);
      }
      for (const mark of INTERNAL_MARKS) expect(text, `${mark} on ${path}`).not.toMatch(mark);
      expect(text, `a bracketed placeholder on ${path}`).not.toMatch(/[[\]{}]/);
      expect(html).not.toMatch(/draft-for-counsel|document: |source: docs\//);
    });

    test(`${path}.md serves the raw file: text/markdown, utf-8, the published sha256`, async ({ request }) => {
      const res = await request.get(`${path}.md`);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toBe('text/markdown; charset=utf-8');
      expect(res.headers()['x-robots-tag']).toBe('noindex, nofollow');
      const bytes = await res.body();
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(PUBLISHED_SHA256[slug]);
      expect(bytes.toString('utf8').startsWith('---\n')).toBe(true);
      expect(bytes.includes(13), 'no carriage return').toBe(false);
    });
  }

  test('/legal/privacy/0.9.0 names the providers in its table', async ({ page }) => {
    await page.goto('/legal/privacy/0.9.0');
    const rows = page.locator('main table').first().locator('tbody tr td:first-child');
    await expect(rows).toHaveText(['Supabase', 'GitHub (planned)', 'Cloudflare R2', 'Resend', 'Vercel']);
  });

  test('/legal/terms/0.9.0 links to the 0.9.0 Privacy Policy, and the link lands', async ({ page }) => {
    await page.goto('/legal/terms/0.9.0');
    const link = page.locator('main').getByRole('link', { name: 'https://earlyletters.com/legal/privacy/0.9.0' });
    // A link to our own address stays on the origin that serves it (a preview or a local build stays on itself).
    await expect(link).toHaveAttribute('href', '/legal/privacy/0.9.0');
    // Opened by address, not clicked: the link is a plain page load, and the strict fixture (every request routed) makes
    // Chromium abort the cross-document page-turn transition (globals.css) as a page error. A visitor sees no fault.
    await page.goto((await link.getAttribute('href'))!);
    await expect(page).toHaveURL(/\/legal\/privacy\/0\.9\.0$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${brand.name} Privacy Policy`);
  });

  test('a version or a document that does not exist answers 404', async ({ request }) => {
    for (const path of ['/legal/terms/0.9.1', '/legal/terms/0.9.1.md', '/legal/other/0.9.0', '/legal/other/0.9.0.md', '/legal/terms']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });

  // RULE (founder decision, 8 Nov 2026): the live /terms and /privacy stay the website's own pages; the 0.9.0 texts are
  // published only at their versioned addresses.
  for (const slug of legalSlugs) {
    test(`/${slug} is still the website's own page: "Last updated", no version line, no link to the 0.9.0 text`, async ({ page }) => {
      await page.goto(`/${slug}`);
      await expect(page.getByText(`${legalCopy.lastUpdated}`)).toBeVisible();
      const text = await page.locator('main').innerText();
      expect(text).not.toContain('Version 0.9.0, a test version.');
      expect(text).not.toContain('has not had a full legal review');
      await expect(page.locator(`main a[href^="/legal/"]`)).toHaveCount(0);
    });
  }
});
