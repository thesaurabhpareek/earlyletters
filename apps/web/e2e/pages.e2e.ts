/**
 * Legal pages (the document, or its holding page while the gate in src/lib/legal/publishable.ts holds it back),
 * the delete-account page, the 404 page and the closed lab.
 */
import { site } from '../src/content/site';
import { deleteAccountCopy } from '../src/lib/legal/delete-account-copy';
import { legalCopy } from '../src/lib/legal/legal-copy';
import { legalDocuments, legalSlugs } from '../src/lib/legal/documents';
import { siteCopy } from '../src/lib/legal/site-copy';
import { expect, test } from './support/fixtures';
import { DRAFT_MARKS, expectedFooterLinks, legalExpectation, legalPagesMode } from './support/legal';

test.describe(`legal pages (LEGAL_PAGES=${legalPagesMode()})`, () => {
  for (const slug of legalSlugs) {
    const doc = legalExpectation(slug);

    test(`/${slug} answers 200 with one h1, a back link, the footer and ${doc.publishable ? 'the document' : 'the holding page'}`, async ({ page }) => {
      const response = await page.goto(`/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
      await expect(page).toHaveTitle(/\S/);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://earlyletters.com/${slug}`);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', legalDocuments[slug].description);
      await expect(page.getByRole('link', { name: legalCopy.backHome })).toHaveAttribute('href', '/');
      // The footer shows the legal links this mode allows: all of them, or none to a document that is held back.
      const footer = page.getByRole('navigation', { name: 'Legal' });
      const links = expectedFooterLinks();
      await expect(footer.getByRole('link')).toHaveCount(links.length);
      for (const link of links) await expect(footer.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);

      if (doc.publishable) {
        // The document body is real, not an empty shell, and the page may be indexed.
        expect((await page.locator('main').innerText()).length).toBeGreaterThan(1500);
        await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
      } else {
        // The holding page: the document's name, one calm line, where to write, nothing from the draft. Not indexed.
        expect(doc.blockers.length, 'the gate names why the document is held back').toBeGreaterThan(0);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText(doc.title);
        await expect(page.getByText(legalCopy.holding.line)).toBeVisible();
        await expect(page.locator('main').getByRole('link', { name: site.footer.contact })).toHaveAttribute('href', `mailto:${site.footer.contact}`);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
        expect((await page.locator('main').innerText()).length).toBeLessThan(600);
      }
    });

    test(`/${slug} never shows a mark of a counsel draft`, async ({ page, request }) => {
      // Both what the server sends and what a visitor reads, whichever page the gate chose.
      const html = await (await request.get(`/${slug}`)).text();
      await page.goto(`/${slug}`);
      const text = await page.locator('body').innerText();
      for (const mark of DRAFT_MARKS) {
        expect(text, `${mark.name} in what a visitor reads on /${slug}`).not.toMatch(mark.pattern);
        expect(html, `${mark.name} in the HTML the server sends for /${slug}`).not.toMatch(mark.pattern);
      }
    });
  }

  test('the document HTML is sanitised: no script, no inline handler, no javascript: link', async ({ page }) => {
    for (const slug of legalSlugs) {
      await page.goto(`/${slug}`);
      const body = await page.locator('main').innerHTML();
      expect(body, slug).not.toMatch(/<script/i);
      expect(body, slug).not.toMatch(/\son[a-z]+\s*=/i);
      expect(body, slug).not.toMatch(/href="\s*javascript:/i);
    }
  });
});

test.describe('delete-account page', () => {
  const c = deleteAccountCopy;

  test('renders the steps, what is removed and kept, and the email route', async ({ page }) => {
    const response = await page.goto('/delete-account');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(c.metaTitle);
    await expect(page.getByRole('heading', { level: 1, name: c.title })).toBeVisible();
    for (const heading of [c.inApp.heading, c.next.heading, c.removed.heading, c.kept.heading, c.email.heading, c.other.heading]) {
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: c.email.button })).toHaveAttribute('href', c.email.href);
    expect(c.email.href).toMatch(/^mailto:[^?]*@earlyletters\.com/);
    await expect(page.getByRole('link', { name: c.other.linkLabel })).toHaveAttribute('href', c.other.href);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', c.metaDescription);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://earlyletters.com/delete-account');
  });

  test('is indexable (it is not a draft legal document) and is a static page', async ({ page, request }) => {
    await page.goto('/delete-account');
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    const res = await request.get('/delete-account');
    expect(res.headers()['x-nextjs-cache'] ?? res.headers()['cache-control']).toBeTruthy();
  });
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
