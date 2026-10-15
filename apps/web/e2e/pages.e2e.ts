/** /privacy and /terms (short pages, words in src/lib/legal/*-copy.ts), the routes taken off for now, the 404 page and the closed lab. */
import { site } from '../src/content/site';
import { legalCopy } from '../src/lib/legal/legal-copy';
import { formatDate, legalPage, legalSlugs } from '../src/lib/legal/pages';
import { siteCopy } from '../src/lib/legal/site-copy';
import { expect, test } from './support/fixtures';
import { DRAFT_MARKS, INTERNAL_MARKS, NOT_USED_SERVICES, REMOVED_ROUTES } from './support/legal';

test.describe('legal pages', () => {
  for (const slug of legalSlugs) {
    // As the suite builds the site: PUBLISHER_LEGAL_NAME is not set, so the marked placeholder shows.
    const doc = legalPage(slug, {});

    test(`/${slug}: one h1, the date, every section, a way home, the three footer links, indexable`, async ({ page }) => {
      const response = await page.goto(`/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(doc.title);
      await expect(page).toHaveTitle(doc.metaTitle);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://earlyletters.com/${slug}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', doc.metaDescription);
      await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      await expect(page.getByText(`${legalCopy.lastUpdated} ${formatDate(doc.lastUpdated)}`)).toBeVisible();
      await expect(page.locator('main time')).toHaveAttribute('datetime', doc.lastUpdated);
      for (const section of doc.sections) await expect(page.getByRole('heading', { level: 2, name: section.heading })).toBeVisible();
      await expect(page.getByText(`is run by ${legalCopy.publisherPlaceholder}, an individual.`)).toBeVisible();
      await expect(page.locator('main').getByRole('link', { name: site.footer.contact }).first()).toHaveAttribute('href', `mailto:${site.footer.contact}`);
      await expect(page.getByRole('link', { name: legalCopy.backHome })).toHaveAttribute('href', '/');
      // The footer: Privacy, Terms, Contact. Nothing else.
      const footer = page.getByRole('navigation', { name: 'Legal' });
      await expect(footer.getByRole('link')).toHaveCount(site.footer.links.length);
      for (const link of site.footer.links) await expect(footer.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    });

    test(`/${slug} shows no counsel mark, no internal reference and no service the site does not use`, async ({ page, request }) => {
      // The draft marks are checked in everything the server sends; the words in what a visitor reads.
      const html = await (await request.get(`/${slug}`)).text();
      await page.goto(`/${slug}`);
      const text = await page.locator('main').innerText();
      for (const mark of DRAFT_MARKS) {
        expect(html, `${mark.name} in the HTML the server sends for /${slug}`).not.toMatch(mark.pattern);
        expect(text, `${mark.name} in what a visitor reads on /${slug}`).not.toMatch(mark.pattern);
      }
      for (const mark of INTERNAL_MARKS) expect(text, `${mark} on /${slug}`).not.toMatch(mark);
      expect(text, `a service the website does not use, named on /${slug}`).not.toMatch(NOT_USED_SERVICES);
    });
  }

  test('/privacy reads in under three minutes and names exactly the services the site uses', async ({ page }) => {
    await page.goto('/privacy');
    const text = await page.locator('main').innerText();
    expect(text.split(/\s+/).filter(Boolean).length, 'words (200 a minute)').toBeLessThan(600);
    const helps = page.locator('h2#who-helps + p + ul li');
    await expect(helps).toHaveText(['Vercel hosts the website.', 'Resend stores the list and sends our emails.']);
  });

  test('/terms links to /privacy, and the link lands', async ({ page }) => {
    await page.goto('/terms');
    await page.locator('main').getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(legalPage('privacy', {}).title);
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
