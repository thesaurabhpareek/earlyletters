/**
 * The restructured home page: the scroll nudge, share with a fellow parent, the pricing block, the languages grid,
 * and a check that no stale claim is on the page. The 15 cases of docs/web/HOME_LAYOUT_PROPOSAL.md section 6 (numbered
 * in the titles), plus the stale-claim cases. Case 14 (axe on `/` and `/signup/thanks`) is run by a11y.e2e.ts;
 * the copy rules by test/copy-rules.test.ts.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Page } from '@playwright/test';
import { site } from '../src/content/site';
import { expect, test, waitLikeAPerson } from './support/fixtures';

const nudge = (page: Page) => page.locator('a[href="#early-access"]').filter({ hasText: site.nudge.label });
const scrollTo = (page: Page, y: number) => page.evaluate((v) => window.scrollTo(0, v), y);
const signup = (page: Page) =>
  page.evaluate(() => {
    const s = document.getElementById('early-access')!;
    const r = s.getBoundingClientRect();
    return { top: r.top + scrollY, height: r.height, viewportTop: r.top };
  });
const activeId = (page: Page) => page.evaluate(() => document.activeElement?.id ?? '');

test.describe('scroll nudge (desktop, fine pointer)', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });

  test('1. is absent at load and appears after scrolling 60 percent of a screen', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await expect(nudge(page)).toBeHidden();
    await scrollTo(page, 300); // 33 percent
    await page.waitForTimeout(400);
    await expect(nudge(page)).toBeHidden();
    await scrollTo(page, 620); // 69 percent
    await expect(nudge(page)).toBeVisible();
    await expect(nudge(page)).toHaveAccessibleName(site.nudge.aria);
  });

  test('2. goes away when the sign-up arrives, and when the email field has focus', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await scrollTo(page, 700);
    await expect(nudge(page)).toBeVisible();
    const s = await signup(page);
    await scrollTo(page, s.top + (s.height - 900) * 0.5);
    await expect(nudge(page)).toBeHidden();
    // Back up the page it returns; focusing the field hides it again.
    await scrollTo(page, 700);
    await expect(nudge(page)).toBeVisible();
    await page.locator('#notify-email').focus({ timeout: 5000 });
    await expect(nudge(page)).toBeHidden();
  });

  test('3. a click scrolls to #early-access, leaves the URL alone and focuses the email field', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await scrollTo(page, 700);
    await expect(nudge(page)).toBeVisible();
    const before = await page.evaluate(() => scrollY);
    await nudge(page).click();
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 8000 }).toBeGreaterThan(before + 2000);
    await expect.poll(() => activeId(page), { timeout: 8000 }).toBe('notify-email');
    const s = await signup(page);
    expect(s.viewportTop).toBeLessThan(900); // the section has arrived
    expect(s.viewportTop + s.height).toBeGreaterThan(0);
    expect(new URL(page.url()).hash).toBe('');
    await expect(page.getByRole('heading', { level: 2, name: site.scenes.s11.headline })).toBeVisible();
  });

  test('5. with reduced motion the chevron does not animate and the scroll is instant', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await scrollTo(page, 700);
    await expect(nudge(page)).toBeVisible();
    expect(await nudge(page).locator('svg').evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    const before = await page.evaluate(() => scrollY);
    await nudge(page).click();
    // Instant: no waiting for a smooth scroll to run its course.
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 1500 }).toBeGreaterThan(before + 2000);
  });

  test('6. keyboard: the first Tab after the brand link reaches it, Enter activates it, and it is hidden when not showing', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    // At the top it is not in the tab order at all.
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.getAttribute('href'))).not.toBe('#early-access');
    await page.reload();
    await waitLikeAPerson(page);
    await scrollTo(page, 700);
    await expect(nudge(page)).toBeVisible();
    await page.keyboard.press('Tab'); // the brand link
    await page.keyboard.press('Tab'); // the nudge, first element after the header
    await expect(nudge(page)).toBeFocused();
    const before = await page.evaluate(() => scrollY);
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 8000 }).toBeGreaterThan(before + 2000);
    await expect(nudge(page)).toBeHidden();
  });

  test('8. sends no request and stores nothing', async ({ page, context }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await page.waitForLoadState('networkidle');
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await scrollTo(page, 700);
    await expect(nudge(page)).toBeVisible();
    await nudge(page).click();
    await expect.poll(() => activeId(page), { timeout: 8000 }).toBe('notify-email');
    expect(requests).toEqual([]);
    expect(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie])).toEqual([0, 0, '']);
    expect(await context.cookies()).toEqual([]);
  });
});

test.describe('scroll nudge (phone, touch)', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('4. a tap scrolls and focuses the heading, not the email field', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await scrollTo(page, 800);
    await expect(nudge(page)).toBeVisible();
    await expect(nudge(page)).toContainText(site.nudge.label); // labelled on phones
    const before = await page.evaluate(() => scrollY);
    await nudge(page).tap();
    await expect.poll(() => page.evaluate(() => scrollY), { timeout: 8000 }).toBeGreaterThan(before + 2000);
    await expect.poll(() => activeId(page), { timeout: 8000 }).toBe('start-title');
    expect(await activeId(page)).not.toBe('notify-email');
  });

  test('7. is at least 44 by 44, inside the screen, and never over the form, the note or the footer links', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    let seen = 0;
    for (let y = 0; y < total; y += 160) {
      await scrollTo(page, y);
      await page.waitForTimeout(90);
      const box = await nudge(page).boundingBox();
      // "Showing" is the state, not the fade: a pill that has been told to hide is mid-fade for 240 ms.
      const showing = (await nudge(page).getAttribute('data-show')) !== null;
      if (!showing || !box) continue;
      seen += 1;
      expect(box.height).toBeGreaterThanOrEqual(44);
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(box.y + box.height).toBeLessThanOrEqual(844);
      const hits = await page.evaluate((b) => {
        const targets = [...document.querySelectorAll<HTMLElement>('form, form p, footer a')];
        return targets
          .map((t) => ({ t, r: t.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && r.height > 0 && r.left < b.x + b.width && r.right > b.x && r.top < b.y + b.height && r.bottom > b.y)
          .map(({ t }) => t.tagName + ':' + (t.textContent ?? '').slice(0, 30));
      }, box);
      expect(hits, `at scroll ${y}`).toEqual([]);
    }
    expect(seen).toBeGreaterThan(5);
    // Safe areas: the position is built from the insets (a real notch cannot be emulated here, so the source is checked).
    const css = readFileSync(join(__dirname, '../src/components/landing/ScrollNudge.module.css'), 'utf8');
    expect(css).toMatch(/bottom:[^;]*env\(safe-area-inset-bottom/);
    expect(css).toMatch(/right:[^;]*env\(safe-area-inset-right/);
    expect(css).toMatch(/min-height:\s*44px/);
  });
});

test.describe('share with a fellow parent', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
  const shareButton = (page: Page) => page.getByRole('button', { name: site.comingSoon.shareButton });

  test('9. is a quiet 44px control and shares only the plain address: native sheet, copy, or a manual field', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => {
      (window as unknown as { __shared: unknown[] }).__shared = [];
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: (d: unknown) => ((window as unknown as { __shared: unknown[] }).__shared.push(d), Promise.resolve()),
      });
    });
    await page.goto('/');
    await expect(shareButton(page)).toBeVisible();
    expect((await shareButton(page).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    // It sits under the sign-up note, below the form.
    const order = await page.evaluate(() => {
      const note = document.querySelector('form p')!;
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.includes('fellow parent'))!;
      return Boolean(note.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(order).toBe(true);
    await shareButton(page).click();
    const shared = await page.evaluate(() => (window as unknown as { __shared: { title: string; text: string; url: string }[] }).__shared);
    expect(shared).toHaveLength(1);
    expect(shared[0]).toEqual({ title: site.comingSoon.shareTitle, text: site.comingSoon.shareText, url: `${new URL(page.url()).origin}/` });
    expect(shared[0].url).not.toMatch(/[?#]/);
    expect(shared[0].text).toMatch(/coming soon to iPhone/i);
  });

  test('9. with no share sheet it copies the plain address and says so', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
    await page.goto('/');
    await shareButton(page).click();
    await expect(page.getByRole('status').filter({ hasText: site.comingSoon.shareCopied })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(`${new URL(page.url()).origin}/`);
  });

  test('9. with the clipboard denied it shows the address in a selected field', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
      Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new DOMException('no', 'NotAllowedError')) }, configurable: true });
    });
    await page.goto('/');
    await shareButton(page).click();
    await expect(page.getByText(site.comingSoon.shareManual)).toBeVisible();
    const field = page.getByLabel(site.comingSoon.shareFieldLabel);
    await expect(field).toHaveValue(`${new URL(page.url()).origin}/`);
    await expect(field).toBeFocused();
    const sel = await field.evaluate((el: HTMLInputElement) => [el.selectionStart, el.selectionEnd, el.value.length]);
    expect(sel).toEqual([0, sel[2], sel[2]]);
  });

  test('10. appears on /signup/thanks between the message and the way home, and not on /signup/sorry', async ({ page }) => {
    await page.goto('/signup/thanks');
    await expect(shareButton(page)).toBeVisible();
    const order = await page.evaluate(() => {
      const body = document.querySelector('main p')!;
      const b = [...document.querySelectorAll('button')].find((x) => x.textContent?.includes('fellow parent'))!;
      const home = document.querySelector('main a')!;
      return [Boolean(body.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING), Boolean(b.compareDocumentPosition(home) & Node.DOCUMENT_POSITION_FOLLOWING)];
    });
    expect(order).toEqual([true, true]);
    await page.goto('/signup/sorry');
    await expect(shareButton(page)).toHaveCount(0);
  });

  test('11. has no social buttons, counters or tracking links anywhere on the page', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).href));
    expect(hrefs.filter((h) => /twitter\.com\/intent|facebook\.com\/sharer|wa\.me|linkedin\.com\/share|x\.com\/intent|t\.me\/share/.test(h))).toEqual([]);
    const text = (await page.locator('body').textContent()) ?? '';
    expect(text).not.toMatch(/\b\d+\s+(people|parents|shares)\b|shared \d+/i);
  });
});

test.describe('pricing block', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const [label, viewport] of [['1440', { width: 1440, height: 900 }], ['390', { width: 390, height: 844 }]] as const) {
    test(`12. at ${label}: a heading, two plan cards, a list, the reassurance and no overflow`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      const price = page.locator('#price');
      await expect(price.getByRole('heading', { level: 2, name: site.scenes.s10.headline })).toBeAttached();
      const lists = price.locator('ul');
      await expect(lists).toHaveCount(2);
      await expect(lists.nth(0).locator('li')).toHaveCount(2);
      await expect(lists.nth(1).locator('li')).toHaveCount(2);
      await expect(price.getByText(site.scenes.s10.reassurance)).toBeVisible();
      await expect(price.getByText(site.scenes.s10.fine)).toBeVisible();
      for (const p of site.scenes.s10.plans) {
        const card = lists.nth(0).locator('li').filter({ hasText: p.name });
        await expect(card).toContainText(p.price);
        await expect(card).toContainText(p.trial);
        // The period is its own block under the price, never beside it.
        const stacked = await card.evaluate((el, amount) => {
          const priceEl = [...el.querySelectorAll('p')].find((x) => x.textContent === amount)!;
          const next = priceEl.nextElementSibling as HTMLElement;
          return next.getBoundingClientRect().top >= priceEl.getBoundingClientRect().bottom - 1 && getComputedStyle(next).display === 'block';
        }, p.price);
        expect(stacked).toBe(true);
      }
      // Equal weight: the two cards are the same size.
      const boxes = await lists.nth(0).locator('li > div').evaluateAll((els) => els.map((e) => [Math.round(e.getBoundingClientRect().width), Math.round(e.getBoundingClientRect().height)]));
      expect(boxes[0]).toEqual(boxes[1]);
      // No paragraph longer than 40 words.
      const longest = await price.locator('p').evaluateAll((ps) => Math.max(...ps.map((p) => (p.textContent ?? '').trim().split(/\s+/).length)));
      expect(longest).toBeLessThanOrEqual(40);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    });
  }
});

test.describe('languages grid', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });

  test('13. seven cards, three then four across with no empty cell, Arabic right to left', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#languages ul > li');
    await expect(cards).toHaveCount(7);
    const rects = await cards.evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ l: r.left, r: r.right, t: Math.round(r.top) })));
    const rows = [...new Set(rects.map((r) => r.t))];
    expect(rows).toHaveLength(2);
    const first = rects.filter((r) => r.t === rows[0]);
    const second = rects.filter((r) => r.t === rows[1]);
    expect([first.length, second.length]).toEqual([3, 4]);
    expect(Math.abs(second[0].l - first[0].l)).toBeLessThan(1.5);
    expect(Math.abs(second[3].r - first[2].r)).toBeLessThan(1.5);
    await expect(page.locator('#languages [lang="ar"]')).toHaveAttribute('dir', 'rtl');
  });
});

test.describe('no JavaScript', () => {
  // The site's policy blocks the script chunks, which the browser reports as failed requests: expected with script off.
  test.use({ javaScriptEnabled: false, strictConsole: false });

  test('15. the page renders, the nudge and the share control are not shown, and the sign-up still posts', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(site.brand.name);
    await expect(nudge(page)).toBeHidden();
    await expect(page.getByRole('button', { name: site.comingSoon.shareButton })).toBeHidden();
    const form = page.locator('form[action="/api/notify"]');
    await expect(form).toHaveAttribute('method', /post/i);
    await expect(form.locator('input[name="email"]')).toBeAttached();
  });
});

test.describe('no stale claims on the page', () => {
  test.use({ reducedMotion: 'reduce' });

  test('the rendered home page says nothing that is not true for v1.0', async ({ page }) => {
    await page.goto('/');
    const text = ((await page.locator('body').textContent()) ?? '').replace(/\s+/g, ' ');
    for (const stale of [
      /backs up/i, /back up/i, /backup/i, /whole family/i, /after the free sessions/i, /both parents/i, /same book/i,
      /people you invite/i, /\$3\.99/, /\$29\.99/, /\$2\.50/, /treasure every milestone/i,
    ]) {
      expect(text, String(stale)).not.toMatch(stale);
    }
    expect(text).toContain('$4.99');
    expect(text).toContain('$49.99');
    expect(text).toContain('1-month free trial');
    expect(text).toContain('2-month free trial');
    expect(text).toContain(site.scenes.s10.fine);
    expect(text).toContain(site.scenes.s06.exampleLabel);
  });
});
