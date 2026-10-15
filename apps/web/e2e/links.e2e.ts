/**
 * Link check. Starting from every page (and the sitemap), follows every internal link until none are new:
 * each must answer 200 and each #fragment must exist on its target page. External links are never fetched
 * (the suite makes no outside request): they are only checked for shape (https, and noopener when they open a tab).
 */
import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { PAGES } from './support/pages';

type Link = { href: string; text: string; target: string | null; rel: string | null };

const PRIMARY = 'https://earlyletters.com';

async function linksOf(page: Page): Promise<Link[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].map((a) => ({
      href: a.getAttribute('href') as string,
      text: (a.textContent ?? '').trim() || a.getAttribute('aria-label') || '',
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
    })),
  );
}

test('every internal link on every page leads somewhere that exists, and every fragment resolves', async ({ page, request, baseURL }) => {
  test.setTimeout(120_000);
  const origin = new URL(baseURL as string).origin;
  const queue: string[] = [...new Set(PAGES.filter((p) => p.status === 200).map((p) => p.path))];
  const seen = new Set<string>();
  const failures: string[] = [];
  const external = new Map<string, Link>();
  const mail = new Set<string>();
  const fragments: { from: string; path: string; hash: string }[] = [];
  let internalLinks = 0;

  while (queue.length) {
    const path = queue.shift() as string;
    if (seen.has(path)) continue;
    seen.add(path);
    const response = await page.goto(path);
    if (response?.status() !== 200) {
      failures.push(`${path} answered ${response?.status()}`);
      continue;
    }
    for (const link of await linksOf(page)) {
      const href = link.href.trim();
      if (!href) {
        failures.push(`${path}: empty href on "${link.text}"`);
        continue;
      }
      if (href.startsWith('mailto:')) {
        mail.add(href);
        continue;
      }
      if (href.startsWith('tel:') || href.startsWith('javascript:')) {
        failures.push(`${path}: unexpected ${href.split(':')[0]}: link "${link.text}"`);
        continue;
      }
      // Our own address (the primary domain) counts as internal, checked on this server.
      const url = new URL(href.startsWith(PRIMARY) ? href.slice(PRIMARY.length) || '/' : href, `${origin}${path.split('#')[0]}`);
      if (url.origin !== origin) {
        external.set(href, link);
        continue;
      }
      internalLinks += 1;
      const target = `${url.pathname}${url.search}`;
      if (url.hash) fragments.push({ from: path, path: target, hash: url.hash.slice(1) });
      if (!seen.has(target) && !queue.includes(target)) queue.push(target);
    }
  }

  // Fragments: the element must exist on the page they point to.
  for (const f of fragments) {
    await page.goto(f.path);
    const found = f.hash === 'top' ? true : (await page.locator(`[id="${f.hash.replace(/"/g, '')}"]`).count()) > 0;
    if (!found) failures.push(`${f.from}: #${f.hash} does not exist on ${f.path}`);
  }

  // Never-fetched external links: https only, and a new tab must not hand over window.opener.
  for (const [href, link] of external) {
    if (!/^https:\/\//.test(href)) failures.push(`external link is not https: ${href}`);
    if (link.target === '_blank' && !/noopener/.test(link.rel ?? '')) failures.push(`external link opens a tab without rel=noopener: ${href}`);
  }
  for (const href of mail) expect(href, 'mailto shape').toMatch(/^mailto:[^@\s?]+@[^@\s?]+\.[a-z]{2,}(\?subject=[^&\s]+)?$/i);

  // And the same, for what a crawler would fetch.
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const [, loc] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) if (!seen.has(new URL(loc).pathname)) failures.push(`sitemap address not reached from the pages: ${loc}`);

  expect(failures, failures.join('\n')).toEqual([]);
  expect(internalLinks, 'the crawl found links').toBeGreaterThan(20);
  expect(seen.size).toBeGreaterThanOrEqual(PAGES.filter((p) => p.status === 200).length);
  test.info().annotations.push({
    type: 'link-check',
    description: `${seen.size} pages, ${internalLinks} internal links, ${fragments.length} fragments, ${external.size} external (not fetched): ${[...external.keys()].join(', ') || 'none'}`,
  });
});

test('every link has a name a person can use: text or an aria-label, and no "click here"', async ({ page }) => {
  for (const p of PAGES.filter((x) => x.status === 200)) {
    await page.goto(p.path);
    for (const link of await linksOf(page)) {
      expect(link.text, `${p.path} link to ${link.href}`).not.toBe('');
      expect(link.text.toLowerCase(), `${p.path} link to ${link.href}`).not.toMatch(/^(click here|here|read more|link)$/);
    }
  }
});
