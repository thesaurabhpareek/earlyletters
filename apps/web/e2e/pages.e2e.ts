/** /privacy and /terms (short pages, words in src/lib/legal/*-copy.ts), /delete-account, the routes taken off for now, the 404 page and the closed lab. */
import { brand } from '@scribe/brand';
import { site } from '../src/content/site';
import { deleteAccountCopy, deleteAccountMailto } from '../src/lib/legal/delete-account-copy';
import { legalCopy } from '../src/lib/legal/legal-copy';
import { formatDate, legalPage, legalSlugs } from '../src/lib/legal/pages';
import { siteCopy } from '../src/lib/legal/site-copy';
import { expect, test } from './support/fixtures';
import { DRAFT_MARKS, INTERNAL_MARKS, NOT_USED_SERVICES, REMOVED_ROUTES } from './support/legal';

test.describe('legal pages', () => {
  for (const slug of legalSlugs) {
    // As the suite builds the site: PUBLISHER_LEGAL_NAME is not set, so the pages say "run by its founder".
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
      await expect(page.getByText(`is run by ${legalCopy.publisherFallback.subject} as an individual, not a company.`)).toBeVisible();
      await expect(page.getByText(`"we" and "us" mean ${legalCopy.publisherFallback.reference}.`)).toBeVisible();
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
      // No placeholder of any kind ever renders: nothing in square or curly brackets.
      expect(text, `a bracketed placeholder on /${slug}`).not.toMatch(/[[\]{}]/);
    });
  }

  test('/privacy reads in under three minutes and names exactly the services the site uses', async ({ page }) => {
    await page.goto('/privacy');
    const text = await page.locator('main').innerText();
    expect(text.split(/\s+/).filter(Boolean).length, 'words (200 a minute)').toBeLessThan(600);
    const helps = page.locator('h2#who-we-share-it-with + p + ul li');
    await expect(helps).toHaveText(['Vercel hosts the website.', 'Resend stores the list and handles our email.']);
  });

  test('/terms links to /privacy, and the link lands', async ({ page }) => {
    await page.goto('/terms');
    await page.locator('main').getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(legalPage('privacy', {}).title);
  });
});

test.describe('/delete-account (BL-2128)', () => {
  const c = deleteAccountCopy;

  test('one h1, every key of the draft on the page, a way home, noindex', async ({ page }) => {
    const response = await page.goto('/delete-account');
    expect(response?.status()).toBe(200);
    expect(new URL(brand.web.deleteAccount).pathname).toBe('/delete-account');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(c.title);
    await expect(page).toHaveTitle(c.metaTitle);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://earlyletters.com/delete-account');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', c.metaDescription);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const main = page.locator('main');
    await expect(main.getByText(c.intro)).toBeVisible();
    for (const s of [c.inApp, c.next, c.removed, c.kept, c.email, c.other]) {
      await expect(page.getByRole('heading', { level: 2, name: s.heading })).toBeVisible();
    }
    await expect(main.getByText(c.inApp.lead)).toBeVisible();
    await expect(main.locator('ol > li')).toHaveText(c.inApp.steps.map((s) => `${s.lead} ${s.body}`));
    for (const item of [...c.next.items, ...c.removed.items, ...c.kept.items, ...c.email.items]) {
      await expect(main.locator('li', { hasText: item })).toHaveCount(1);
    }
    await expect(main.getByText(c.kept.lead)).toBeVisible();
    await expect(main.getByText(c.email.websiteList)).toBeVisible();
    await expect(main.getByText(c.other.body)).toBeVisible();
    await expect(main.getByRole('link', { name: c.email.button })).toHaveAttribute('href', deleteAccountMailto);
    await expect(main.getByRole('link', { name: legalCopy.contact }).first()).toHaveAttribute('href', `mailto:${legalCopy.contact}`);
    await expect(main.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', c.other.href);
    await expect(page.getByRole('link', { name: legalCopy.backHome })).toHaveAttribute('href', '/');
  });

  test('shows no counsel mark or internal reference, and loads nothing from another origin and no analytics', async ({ page, request }) => {
    const html = await (await request.get('/delete-account')).text();
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.goto('/delete-account');
    await page.waitForLoadState('networkidle');
    const text = await page.locator('main').innerText();
    for (const mark of DRAFT_MARKS) {
      expect(html, `${mark.name} in the HTML the server sends for /delete-account`).not.toMatch(mark.pattern);
      expect(text, `${mark.name} in what a visitor reads on /delete-account`).not.toMatch(mark.pattern);
    }
    for (const mark of INTERNAL_MARKS) expect(text, `${mark} on /delete-account`).not.toMatch(mark);
    // Apple is named on purpose (billing through Apple and Sign in with Apple): CR-193 D-15 allows a name the Privacy text
    // names, and /legal/privacy/0.9.0 names Apple. Every other service on the list stays off the page.
    expect(text.replace(/\bApple\b/g, ''), 'a service the website does not use, named on /delete-account').not.toMatch(NOT_USED_SERVICES);
    expect(text, 'a bracketed placeholder on /delete-account').not.toMatch(/[[\]{}]/);
    const own = new URL(page.url()).origin;
    expect(requests.filter((u) => !u.startsWith(own) && !u.startsWith('data:')), 'requests to another origin').toEqual([]);
    expect(requests.filter((u) => /_vercel\/insights|va\.vercel-scripts|analytics/i.test(u)), 'analytics requests').toEqual([]);
  });

  test('is not linked from the footer, the home page or the other legal pages', async ({ page }) => {
    expect(site.footer.links.map((l) => l.href)).not.toContain('/delete-account');
    for (const from of ['/', '/privacy', '/terms']) {
      await page.goto(from);
      await expect(page.locator('a[href="/delete-account"]'), `a link to /delete-account on ${from}`).toHaveCount(0);
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
