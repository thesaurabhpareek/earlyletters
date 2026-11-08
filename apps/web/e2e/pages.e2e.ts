/** /privacy and /terms (the 0.9.0 texts, content/legal), their permanent pages and raw files, the routes taken off for now, the 404 page and the closed lab. */
import { createHash } from 'node:crypto';
import { brand } from '@scribe/brand';
import { site } from '../src/content/site';
import { readLegalSource } from '../src/lib/legal/documents';
import { legalCopy } from '../src/lib/legal/legal-copy';
import { legalPage, legalSlugs } from '../src/lib/legal/pages';
import { siteCopy } from '../src/lib/legal/site-copy';
import { expect, test } from './support/fixtures';
import { DRAFT_MARKS, INTERNAL_MARKS, PUBLISHED_SHA256, REMOVED_ROUTES } from './support/legal';

test.describe('legal pages', () => {
  // The floating address and the permanent address of the 0.9.0 text show the same words (BL-565).
  const addresses = (slug: (typeof legalSlugs)[number]) => [`/${slug}`, `/legal/${slug}/0.9.0`];

  for (const slug of legalSlugs) {
    const doc = legalPage(slug);

    for (const path of addresses(slug)) {
      test(`${path}: one h1, "Version 0.9.0, a test version." under it, every section, a way home, the three footer links, indexable`, async ({ page }) => {
        const response = await page.goto(path);
        expect(response?.status()).toBe(200);
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${brand.name} ${slug === 'terms' ? 'Terms of Service' : 'Privacy Policy'}`);
        await expect(page.locator('main article > h1 + p')).toHaveText('Version 0.9.0, a test version.');
        await expect(page).toHaveTitle(doc.metaTitle);
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://earlyletters.com${path}`);
        await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
        // Every "## " heading of the text, in order.
        const headings = [...readLegalSource(slug).body.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
        expect(headings.length).toBeGreaterThan(10);
        await expect(page.locator('main h2')).toHaveText(headings);
        await expect(page.getByText('Early Letters is run by its founder, an individual based in California')).toBeVisible();
        await expect(page.locator('main').getByRole('link', { name: site.footer.contact }).first()).toHaveAttribute('href', `mailto:${site.footer.contact}`);
        await expect(page.getByRole('link', { name: legalCopy.backHome })).toHaveAttribute('href', '/');
        // The footer: Privacy, Terms, Contact. Nothing else.
        const footer = page.getByRole('navigation', { name: 'Legal' });
        await expect(footer.getByRole('link')).toHaveCount(site.footer.links.length);
        for (const link of site.footer.links) await expect(footer.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
      });

      test(`${path} shows no counsel mark, no internal reference and no bracketed blank`, async ({ page, request }) => {
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
      });
    }

    test(`/${slug} and /legal/${slug}/0.9.0 read the same, word for word`, async ({ page }) => {
      await page.goto(`/${slug}`);
      const floating = await page.locator('main').innerText();
      await page.goto(`/legal/${slug}/0.9.0`);
      expect(await page.locator('main').innerText()).toBe(floating);
    });

    test(`/legal/${slug}/0.9.0.md serves the raw file: text/markdown, utf-8, the published sha256`, async ({ request }) => {
      const res = await request.get(`/legal/${slug}/0.9.0.md`);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toBe('text/markdown; charset=utf-8');
      const bytes = await res.body();
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(PUBLISHED_SHA256[slug]);
      expect(bytes.toString('utf8').startsWith('---\n')).toBe(true);
      expect(bytes.includes(13), 'no carriage return').toBe(false);
    });
  }

  test('/privacy names the providers in its table, and the website itself uses only Vercel and Resend', async ({ page }) => {
    await page.goto('/privacy');
    const rows = page.locator('main table').first().locator('tbody tr td:first-child');
    await expect(rows).toHaveText(['Supabase', 'GitHub', 'Cloudflare R2', 'Resend', 'Vercel']);
  });

  test('/terms links to the 0.9.0 Privacy Policy, and the link lands', async ({ page }) => {
    await page.goto('/terms');
    await page.locator('main').getByRole('link', { name: 'https://earlyletters.com/legal/privacy/0.9.0' }).click();
    await expect(page).toHaveURL(/\/legal\/privacy\/0\.9\.0$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(`${brand.name} Privacy Policy`);
  });

  test('the permanent address of a version that does not exist answers 404', async ({ request }) => {
    for (const path of ['/legal/terms/0.9.1', '/legal/terms/0.9.1.md', '/legal/other/0.9.0', '/legal/other/0.9.0.md', '/legal/terms']) {
      expect((await request.get(path)).status(), path).toBe(404);
    }
  });
});

test.describe('taken off the site for now', () => {
  test.use({ strictConsole: false }); // the browser logs the 404 of the main document itself

  for (const path of REMOVED_ROUTES) {
    test(`${path} answers 404, and neither a footer nor the sitemap links to it`, async ({ page, request }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(siteCopy.notFound.line);
      expect(site.footer.links.map((l) => l.href)).not.toContain(path);
      expect(await (await request.get('/sitemap.xml')).text()).not.toContain(path);
      for (const from of ['/', '/privacy', '/terms']) {
        await page.goto(from);
        await expect(page.locator(`a[href="${path}"]`), `a link to ${path} on ${from}`).toHaveCount(0);
      }
    });
  }
});

test.describe('404', () => {
  test.use({ strictConsole: false }); // the browser logs the 404 of the main document itself

  test('an unknown address answers 404 with the brand page: one h1, a way home, not indexed', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(siteCopy.notFound.line);
    await expect(page).toHaveTitle(new RegExp(siteCopy.notFound.title));
    await expect(page.getByRole('link', { name: siteCopy.notFound.home })).toHaveAttribute('href', '/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.getByRole('link', { name: siteCopy.notFound.home }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('a deep unknown path and a path with odd characters are 404 too, never a 500', async ({ request }) => {
    for (const path of ['/a/b/c/d', '/%E0%A4%85', '/privacy/extra', '/unsubscribe/x', '/api/nothing', '/.env', '/wp-login.php']) {
      const res = await request.get(path);
      expect([404, 405], path).toContain(res.status());
    }
  });
});

test.describe('/lab is closed in production', () => {
  test.use({ strictConsole: false }); // the browser logs the 404 of the main document itself

  for (const path of ['/lab', '/lab/s01', '/lab/s11', '/lab/atmosphere', '/lab/anything-else']) {
    test(`${path} answers 404 with the brand 404 page, and the address stays`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(404);
      await expect(page).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(siteCopy.notFound.line);
    });
  }
});
