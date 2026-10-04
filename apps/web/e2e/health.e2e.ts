/**
 * Every page: loads without console errors or failed requests, fits the screen at phone and desktop widths,
 * and the home page shows its finished state when the visitor prefers reduced motion.
 * (Console, page-error and failed-request checks come from the automatic `problems` fixture.)
 */
import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { PAGES } from './support/pages';

const VIEWPORTS = [
  { name: 'phone 390', width: 390, height: 844 },
  { name: 'desktop 1440', width: 1440, height: 900 },
];

async function overflow(page: Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const wide = [...document.querySelectorAll<HTMLElement>('body *')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.right > root.clientWidth + 1 && getComputedStyle(el).position !== 'fixed';
      })
      .slice(0, 5)
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)} right=${Math.round(el.getBoundingClientRect().right)}`);
    return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth, bodyScrollWidth: document.body.scrollWidth, wide };
  });
}

async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(30);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
}

test.describe('every page loads clean', () => {
  for (const p of PAGES) {
    test.describe(p.name, () => {
      // A 404 page is logged by the browser as a failed resource; that is its job.
      test.use({ strictConsole: p.status === 200 });

      test(`${p.path} answers ${p.status} with no console error, page error or failed request`, async ({ page }) => {
        const response = await page.goto(p.path);
        expect(response?.status()).toBe(p.status);
        await page.waitForLoadState('networkidle');
        await scrollThrough(page);
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('h1')).toHaveCount(1);
        await expect(page).toHaveTitle(/\S/);
      });

      for (const vp of VIEWPORTS) {
        test(`${p.path} has no horizontal overflow at ${vp.name}`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await page.goto(p.path);
          await page.waitForLoadState('networkidle');
          for (const scrolled of [false, true]) {
            if (scrolled) await scrollThrough(page);
            const m = await overflow(page);
            expect(m.scrollWidth, `document ${JSON.stringify(m)}`).toBeLessThanOrEqual(m.clientWidth);
            expect(m.bodyScrollWidth, `body ${JSON.stringify(m)}`).toBeLessThanOrEqual(m.clientWidth);
          }
        });
      }
    });
  }
});

test.describe('reduced motion', () => {
  /** The visible opacity of an element: its own times every ancestor's. */
  const effectiveOpacity = (page: Page) =>
    page.evaluate(() => {
      const sample = [...document.querySelectorAll<HTMLElement>('main h1, main h2, main p, main li, main span')].filter((el) => el.textContent?.trim());
      const dim: string[] = [];
      for (const el of sample) {
        let o = 1;
        for (let node: HTMLElement | null = el; node; node = node.parentElement) o *= Number(getComputedStyle(node).opacity);
        if (o < 0.99) dim.push(`${el.tagName.toLowerCase()} "${el.textContent?.trim().slice(0, 24)}" ${o.toFixed(2)}`);
      }
      return { total: sample.length, dim };
    });

  test.describe('with reduce', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the home page shows every scene finished: all text fully visible, nothing lifted or pinned', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      // No scrolling: nothing waits to be revealed.
      const { total, dim } = await effectiveOpacity(page);
      expect(total).toBeGreaterThan(40);
      expect(dim, 'text still dimmed at the top of the page').toEqual([]);
      const lifted = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('main *')]
          .filter((el) => {
            const t = getComputedStyle(el).transform;
            return t !== 'none' && t !== 'matrix(1, 0, 0, 1, 0, 0)' && el.textContent?.trim();
          })
          .map((el) => `${el.tagName.toLowerCase()} ${getComputedStyle(el).transform}`)
          .slice(0, 5),
      );
      expect(lifted, 'elements still translated or scaled').toEqual([]);
      const sticky = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('main *')].filter((el) => getComputedStyle(el).position === 'sticky').length);
      expect(sticky, 'no pinned scenes').toBe(0);
    });

    test('the sign-up works the same, with no animation delay', async ({ page, mock, email }) => {
      await page.goto('/');
      await page.waitForFunction(() => performance.now() > 1800);
      await page.getByLabel('Your email').fill(email);
      await page.getByRole('button', { name: 'Keep me informed' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Thank you' })).toBeVisible();
      expect(await mock.contact(email)).toBeDefined();
    });
  });

  test.describe('without reduce (the control)', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('the same check does see dimmed text at the top, so the pass above is not vacuous', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
      const { dim } = await effectiveOpacity(page);
      expect(dim.length).toBeGreaterThan(5);
    });
  });
});
