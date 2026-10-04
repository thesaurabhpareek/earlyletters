/** The home page in coming-soon mode: document, link previews, icons, sections, share button. */
import { site } from '../src/content/site';
import { expect, test } from './support/fixtures';

test.describe('landing (coming soon)', () => {
  test('title, h1, description and the form are present', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(site.meta.title);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // Exactly one h1, the product name. This is the coming-soon page, not the film.
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(site.brand.name);
    await expect(page.getByText(site.comingSoon.line)).toBeVisible();
    await expect(page.getByText(site.cta.prelaunch.eyebrow).first()).toBeVisible();
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', site.meta.description);
    // The sign-up exists because the build had the (dummy) Resend credentials.
    await expect(page.getByLabel('Your email')).toBeVisible();
    // No App Store badge before launch.
    await expect(page.getByRole('link', { name: /App Store/i })).toHaveCount(0);
  });

  test('Open Graph and Twitter tags describe the page', async ({ page }) => {
    await page.goto('/');
    const meta = (selector: string) => page.locator(selector).first().getAttribute('content');
    expect(await meta('meta[property="og:title"]')).toBe(site.meta.title);
    expect(await meta('meta[property="og:description"]')).toBe(site.meta.description);
    expect(await meta('meta[property="og:type"]')).toBe('website');
    expect(await meta('meta[property="og:site_name"]')).toBe(site.brand.name);
    expect(await meta('meta[property="og:url"]')).toBe('https://earlyletters.com');
    expect(await meta('meta[property="og:locale"]')).toBe('en_US');
    const ogImage = (await meta('meta[property="og:image"]')) ?? '';
    expect(ogImage).toMatch(/^https:\/\/earlyletters\.com\/opengraph-image/);
    expect(await meta('meta[property="og:image:width"]')).toBe('1200');
    expect(await meta('meta[property="og:image:height"]')).toBe('630');
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(await meta('meta[name="twitter:title"]')).toBe(site.meta.title);
    expect(await meta('meta[name="twitter:description"]')).toBe(site.meta.description);
    expect(await meta('meta[name="twitter:image"]')).toMatch(/^https:\/\/earlyletters\.com\/(twitter|opengraph)-image/);
  });

  test('canonical, robots meta, theme colour and viewport', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://earlyletters.com');
    // The home page is indexable: no noindex.
    expect(await page.locator('meta[name="robots"]').count()).toBe(0);
    await expect(page.locator('meta[name="theme-color"]').first()).toHaveAttribute('content', '#161412');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
  });

  test('icons are declared and every one of them loads', async ({ page, request }) => {
    await page.goto('/');
    const hrefs = await page.locator('link[rel~="icon"], link[rel="apple-touch-icon"]').evaluateAll((links) => links.map((l) => (l as HTMLLinkElement).getAttribute('href')));
    expect(hrefs.length).toBeGreaterThanOrEqual(2);
    expect(hrefs.some((h) => h?.includes('icon.svg'))).toBe(true);
    expect(hrefs.some((h) => h?.includes('apple-icon'))).toBe(true);
    for (const href of hrefs) {
      const response = await request.get(href as string);
      expect(response.status(), href as string).toBe(200);
      expect(response.headers()['content-type']).toMatch(/^image\//);
    }
    // /favicon.ico is answered with a permanent redirect to the SVG.
    const favicon = await request.get('/favicon.ico', { maxRedirects: 0 });
    expect(favicon.status()).toBe(308);
    expect(favicon.headers().location).toContain('/icon.svg');
  });

  test('the share image is a real PNG of the right size', async ({ request }) => {
    const response = await request.get('/opengraph-image');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
    const png = await response.body();
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
  });

  test('every section heading, the chapter list and the footer render', async ({ page }) => {
    await page.goto('/');
    for (const headline of [site.scenes.s02.headline, site.scenes.s05.headline, site.scenes.s06.headline, site.scenes.s08.headline, site.scenes.s09.headline, site.scenes.s10.headline, site.scenes.s11.headline]) {
      await expect(page.getByRole('heading', { level: 2, name: headline })).toBeAttached();
    }
    const legal = page.getByRole('navigation', { name: 'Legal' });
    for (const link of site.footer.links) {
      await expect(legal.getByRole('link', { name: link.label })).toHaveAttribute('href', link.href);
    }
    await expect(page.getByRole('link', { name: site.footer.contact }).last()).toHaveAttribute('href', `mailto:${site.footer.contact}`);
  });

  test('the share button copies the plain site address when there is no share sheet', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium specific');
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(page.url() === 'about:blank' ? (process.env.E2E_BASE_URL as string) : page.url()).origin });
    await page.addInitScript(() => {
      // Desktop Chromium has no native share sheet in automation; make that explicit.
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
    });
    await page.goto('/');
    const button = page.getByRole('button', { name: site.comingSoon.shareButton });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByText(site.comingSoon.shareCopied)).toBeVisible();
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    // The plain origin, nothing else: no tracking parameter, no referral id.
    expect(copied).toBe(`${new URL(page.url()).origin}/`);
  });

  test('the share button uses the native share sheet when there is one, with the plain address', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __shared: unknown[] }).__shared = [];
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: (data: unknown) => {
          (window as unknown as { __shared: unknown[] }).__shared.push(data);
          return Promise.resolve();
        },
      });
    });
    await page.goto('/');
    await page.getByRole('button', { name: site.comingSoon.shareButton }).click();
    const shared = await page.evaluate(() => (window as unknown as { __shared: { title: string; text: string; url: string }[] }).__shared);
    expect(shared).toHaveLength(1);
    expect(shared[0].url).toBe(`${new URL(page.url()).origin}/`);
    expect(shared[0].title).toBe(site.comingSoon.shareTitle);
    expect(shared[0].text).toBe(site.comingSoon.shareText);
  });

  test('the page makes no request to any other site and sets no cookie', async ({ page, context }) => {
    const hosts = new Set<string>();
    page.on('request', (request) => {
      if (request.url().startsWith('http')) hosts.add(new URL(request.url()).host);
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect([...hosts]).toEqual([new URL(page.url()).host]);
    expect(await context.cookies()).toEqual([]);
  });
});
