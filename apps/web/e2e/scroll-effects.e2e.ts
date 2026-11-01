/**
 * Scroll-linked motion on the home page: every section after the hero is told the same way as the first scenes
 * (a pinned scene whose blocks fill in as you scroll, handing off to the next), not just the first few.
 * With reduced motion every section is plain and fully visible. Layout, copy and sign-up are covered elsewhere.
 */
import type { Page } from '@playwright/test';
import { expect, test, waitLikeAPerson } from './support/fixtures';

/** Every direct section of <main>, in order: the hero, then each scene. */
const sections = (page: Page) =>
  page.evaluate(() => {
    const out: { id: string; label: string; sticky: boolean; top: number; height: number; stage: number }[] = [];
    for (const s of document.querySelectorAll<HTMLElement>('main > section')) {
      const r = s.getBoundingClientRect();
      const stage = [...s.querySelectorAll<HTMLElement>('*')].find((e) => getComputedStyle(e).position === 'sticky');
      out.push({
        id: s.id,
        label: s.getAttribute('aria-labelledby') ?? '',
        sticky: Boolean(stage),
        top: r.top + scrollY,
        height: r.height,
        stage: stage ? stage.getBoundingClientRect().height : 0,
      });
    }
    return out;
  });

/** The visible opacity of an element: its own times every ancestor's. */
const effectiveOpacity = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const el = document.querySelector<HTMLElement>(sel);
    if (!el) return -1;
    let o = 1;
    for (let node: HTMLElement | null = el; node; node = node.parentElement) o *= Number(getComputedStyle(node).opacity);
    return o;
  }, selector);

test.describe('scroll effects, desktop', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });

  test('every section after the hero is a pinned scene, so no part of the page is a plain scroll', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await expect.poll(async () => (await sections(page)).filter((s) => s.sticky).length).toBeGreaterThanOrEqual(9);
    const list = await sections(page);
    expect(list.length).toBeGreaterThanOrEqual(10);
    // The hero recedes (HeroStage); every other section holds the screen: a sticky stage one screen tall.
    const [hero, ...scenes] = list;
    expect(hero.sticky).toBe(false);
    for (const s of scenes) {
      expect(s.sticky, `section ${s.label || s.id} is not a pinned scene`).toBe(true);
      expect(s.stage, `stage of ${s.label || s.id}`).toBe(900);
      expect(s.height, `${s.label || s.id} holds the screen for longer than one screen`).toBeGreaterThan(900 * 1.9);
    }
  });

  test('each later scene is scrubbed: its headline is dim before the scene, bright while it holds, and the hero recedes', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await expect.poll(async () => (await sections(page)).filter((s) => s.sticky).length).toBeGreaterThanOrEqual(9);
    const later = ['minute-title', 'voice-title', 'book-title', 'lang-title', 'private-title', 'price-title', 'start-title'];
    const list = await sections(page);
    for (const labelledBy of later) {
      const s = list.find((x) => x.label === labelledBy);
      expect(s, labelledBy).toBeDefined();
      const travel = s!.height - 900;
      // Just before the scene is pinned its content has not arrived.
      await page.evaluate((y) => window.scrollTo(0, y), s!.top - 450);
      await expect.poll(() => effectiveOpacity(page, `#${labelledBy}`), { message: `${labelledBy} before its scene`, timeout: 6000 }).toBeLessThan(0.35);
      // Halfway through the hold it is fully there.
      await page.evaluate((y) => window.scrollTo(0, y), s!.top + travel * 0.5);
      await expect.poll(() => effectiveOpacity(page, `#${labelledBy}`), { message: `${labelledBy} while pinned`, timeout: 6000 }).toBeGreaterThan(0.95);
    }
    // The hero: still whole at the top, receding as you leave it.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => effectiveOpacity(page, '#hero-title'), { timeout: 6000 }).toBeGreaterThan(0.95);
    await page.evaluate(() => window.scrollTo(0, 700));
    await expect.poll(() => effectiveOpacity(page, '#hero-title'), { timeout: 6000 }).toBeLessThan(0.6);
  });

  test('the last scene stays: the sign-up is fully visible at the bottom of the page', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(page.getByLabel('Your email')).toBeVisible();
    await expect.poll(() => effectiveOpacity(page, '#notify-email'), { timeout: 6000 }).toBeGreaterThan(0.95);
  });
});

test.describe('scroll effects, phone', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('a scene that fits the screen is pinned; the rest still rise into place, and nothing overflows sideways', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await expect.poll(async () => (await sections(page)).filter((s) => s.sticky).length).toBeGreaterThanOrEqual(5);
    const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    expect(m.sw).toBeLessThanOrEqual(m.cw);
    // A block far below the fold is not yet there: the page is scrubbed here too, not a plain scroll.
    expect(await effectiveOpacity(page, '#start-title')).toBeLessThan(0.35);
  });
});

test.describe('scroll effects, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('every section is a plain, finished section: nothing pinned, lifted or dim, at any scroll position', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    for (const y of [0, 2500, 5000, 99999]) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(250);
      const state = await page.evaluate(() => {
        const bad: string[] = [];
        for (const s of document.querySelectorAll<HTMLElement>('main > section')) {
          for (const el of s.querySelectorAll<HTMLElement>('*')) {
            const cs = getComputedStyle(el);
            if (cs.position === 'sticky') bad.push(`sticky ${el.className}`);
            if (el.textContent?.trim() && cs.transform !== 'none' && cs.transform !== 'matrix(1, 0, 0, 1, 0, 0)') bad.push(`transform ${el.tagName} ${cs.transform}`);
            if (el.children.length === 0 && el.textContent?.trim()) {
              let o = 1;
              for (let n: HTMLElement | null = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
              if (o < 0.99) bad.push(`dim ${el.tagName} "${el.textContent.trim().slice(0, 20)}" ${o.toFixed(2)}`);
            }
          }
        }
        return bad.slice(0, 6);
      });
      expect(state, `at scroll ${y}`).toEqual([]);
    }
    // Every section's own heading is on screen-able and not hidden.
    for (const id of ['minute-title', 'exact-title', 'voice-title', 'book-title', 'lang-title', 'private-title', 'price-title', 'start-title']) {
      await expect(page.locator(`#${id}`)).toBeVisible();
    }
  });
});
