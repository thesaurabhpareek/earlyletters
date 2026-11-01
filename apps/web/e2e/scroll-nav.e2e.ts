/**
 * The film's Next / Previous buttons, the arrival tick and the rest positions they use. Runs against the film build
 * (E2E_FILM_URL). Covers: the hidden buttons never catch a click at the end (they once sat over the footer's Privacy
 * link and a share icon), the buttons are reachable by keyboard before the film, focus is not lost when Next reaches the
 * last part, one press gives one vibration, reduced motion lands on the top of each part, and arriving at S04 does not
 * shift the layout.
 */
import type { Page } from '@playwright/test';
import { filmUrl } from './support/env';
import { expect, test, waitLikeAPerson } from './support/fixtures';

const NEXT = 'Next part';
const PREVIOUS = 'Previous part';

/** Scroll positions where each part rests (the same rule as src/film/rest-tops-map.ts). */
const restTops = (page: Page) =>
  page.evaluate(() => {
    const vh = document.getElementById('svh-probe')!.offsetHeight;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return [...document.querySelectorAll<HTMLElement>('main > section')].map((el) => {
      const rest = Number.parseFloat(getComputedStyle(el).getPropertyValue('--scene-rest')) || 0.5;
      const top = el.getBoundingClientRect().top + scrollY;
      return reduced ? top : top + rest * Math.max(0, el.offsetHeight - vh);
    });
  });

/** Does the element at each sample point of `selector` belong to it? Returns the points where something else is on top. */
const coveredPoints = (page: Page, selector: string, centreOnly = false) =>
  page.evaluate(([sel, centre]) => {
    const out: string[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(sel)) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;
      const xs = centre ? [r.left + r.width / 2] : [r.left + 3, r.left + r.width / 2, r.right - 3];
      const ys = centre ? [r.top + r.height / 2] : [r.top + 3, r.top + r.height / 2, r.bottom - 3];
      for (const x of xs) {
        for (const y of ys) {
          if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
          const top = document.elementFromPoint(x, y);
          if (!top || !(el === top || el.contains(top) || top.contains(el))) out.push(`${el.getAttribute('aria-label') ?? el.textContent?.trim()} at ${Math.round(x)},${Math.round(y)} is covered by ${top?.tagName}.${top?.className}`);
        }
      }
    }
    return out;
  }, [selector, centreOnly] as const);

const toEnd = async (page: Page) => {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  // The nav fades out and then drops out of hit-testing; give it a moment to be settled.
  await expect(page.getByRole('group', { name: 'Move through the film' })).toBeHidden();
};

for (const size of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone 320', width: 320, height: 568 },
]) {
  test.describe(`at the end of the film, ${size.name}`, () => {
    test.use({ reducedMotion: 'no-preference', viewport: { width: size.width, height: size.height } });

    test('the hidden buttons catch nothing: the footer links and the share icons are what is under the finger', async ({ page }) => {
      await page.goto(filmUrl());
      await waitLikeAPerson(page);
      await toEnd(page);
      expect(await page.locator('footer').evaluate((f) => f.getBoundingClientRect().bottom <= innerHeight + 1)).toBe(true);
      expect(await coveredPoints(page, 'footer a'), 'footer links').toEqual([]);
      expect(await coveredPoints(page, '#start a', true), 'share links (their middles)').toEqual([]);
      // Straight at the Privacy link, the exact complaint.
      const privacy = page.locator('footer a', { hasText: /^Privacy$/ });
      const box = (await privacy.boundingBox())!;
      const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('a')?.textContent?.trim(), [box.x + box.width / 2, box.y + box.height / 2]);
      expect(hit).toBe('Privacy');
      // And the buttons themselves are out of the way for a pointer, the keyboard and a screen reader.
      const nav = page.locator('[aria-label="Move through the film"]');
      await expect(nav).toHaveAttribute('aria-hidden', 'true');
      for (const name of [NEXT, PREVIOUS]) {
        expect(await page.locator(`button[aria-label="${name}"]`).evaluate((b) => getComputedStyle(b).pointerEvents)).toBe('none');
        await expect.poll(() => page.locator(`button[aria-label="${name}"]`).evaluate((b) => getComputedStyle(b).visibility)).toBe('hidden');
      }
    });
  });
}

test.describe('keyboard', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });

  test('Next is reached by Tab before any of the film, and Enter moves one part on', async ({ page }) => {
    await page.goto(filmUrl());
    await waitLikeAPerson(page);
    const stops: { label: string; inMain: boolean }[] = [];
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      const s = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        return { label: el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 30), inMain: !!el.closest('main') };
      });
      stops.push(s);
      if (s.label === NEXT) break;
    }
    expect(stops.map((s) => s.label)).toContain(NEXT);
    expect(stops.some((s) => s.inMain), 'Next comes before anything inside the film').toBe(false);
    const [first] = await restTops(page);
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 6000 }).toBeGreaterThan(first - 4);
  });

  test('Next into the last part hands focus on: the sign-up field, never the page body', async ({ page }) => {
    await page.goto(filmUrl());
    await waitLikeAPerson(page);
    const tops = await restTops(page);
    // Reach Next by keyboard like a keyboard user, then stand on the part before the last.
    for (let i = 0; i < 8; i++) {
      await page.keyboard.press('Tab');
      if ((await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))) === NEXT) break;
    }
    await expect(page.locator(`button[aria-label="${NEXT}"]`)).toBeFocused();
    await page.evaluate((y) => window.scrollTo(0, y), tops[tops.length - 2]);
    await page.waitForTimeout(600);
    await expect(page.locator(`button[aria-label="${NEXT}"]`)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#notify-email')).toBeFocused({ timeout: 8000 });
    expect(await page.evaluate(() => document.activeElement?.tagName)).not.toBe('BODY');
    await expect(page.getByRole('group', { name: 'Move through the film' })).toBeHidden();
  });

  test('a mouse press of Next at the same place does not steal focus into the field', async ({ page }) => {
    await page.goto(filmUrl());
    await waitLikeAPerson(page);
    const tops = await restTops(page);
    await page.evaluate((y) => window.scrollTo(0, y), tops[tops.length - 2]);
    await page.waitForTimeout(400);
    await page.locator(`button[aria-label="${NEXT}"]`).click();
    await expect.poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 6000 }).toBeGreaterThan(tops[tops.length - 1] - 8);
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => document.activeElement?.id)).not.toBe('notify-email');
  });
});

test.describe('the arrival tick', () => {
  test.use({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });

  test('one press of Next is one vibration; scrolling by hand to a part still ticks', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __vibes: number }).__vibes = 0;
      Object.defineProperty(navigator, 'vibrate', { configurable: true, value: () => ((window as unknown as { __vibes: number }).__vibes += 1, true) });
    });
    await page.goto(filmUrl());
    await waitLikeAPerson(page);
    const vibes = () => page.evaluate(() => (window as unknown as { __vibes: number }).__vibes);
    const tops = await restTops(page);
    const before = await vibes();
    await page.locator(`button[aria-label="${NEXT}"]`).click();
    await expect.poll(() => page.evaluate(() => Math.round(scrollY)), { timeout: 8000 }).toBeGreaterThan(tops[0] - 6);
    await page.waitForTimeout(1200); // arrival, and anything late
    expect((await vibes()) - before, 'one press, one tap').toBe(1);
    // By hand (a wheel gesture would do the same): arriving at the next part ticks as before. Wait out the press first.
    await page.waitForTimeout(1200);
    const mid = await vibes();
    await page.evaluate((y) => window.scrollTo(0, y - 900), tops[2]);
    await page.waitForTimeout(100);
    await page.evaluate((y) => window.scrollTo(0, y), tops[2]);
    await expect.poll(vibes, { timeout: 4000 }).toBeGreaterThan(mid);
  });
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });

  test('Next lands on the top of each part (the flowing page has no pinned range to rest in)', async ({ page }) => {
    await page.goto(filmUrl());
    await waitLikeAPerson(page);
    const tops = await restTops(page);
    const sectionTops = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('main > section')].map((s) => Math.round(s.getBoundingClientRect().top + scrollY)));
    expect(tops.map(Math.round)).toEqual(sectionTops);
    for (let i = 1; i <= 4; i++) {
      await page.locator(`button[aria-label="${NEXT}"]`).click();
      await expect.poll(() => page.evaluate(() => Math.round(scrollY)), { message: `part ${i}` }).toBe(sectionTops[i]);
    }
  });
});

test.describe('"Exactly as you said it": the letter box and the note under it', () => {
  for (const size of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'phone', width: 412, height: 915 },
  ]) {
    test(`do not change size or position while the fixes close up lines, ${size.name}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: size, reducedMotion: 'no-preference', hasTouch: size.width < 500 });
      const page = await context.newPage();
      await page.goto(filmUrl());
      await waitLikeAPerson(page);
      const section = await page.evaluate(() => {
        const el = document.getElementById('exactly')!;
        return { top: el.getBoundingClientRect().top + scrollY, travel: el.offsetHeight - document.getElementById('svh-probe')!.offsetHeight };
      });
      const read = () =>
        page.evaluate(() => {
          const box = document.querySelector<HTMLElement>('[data-s04-box]')!;
          const note = document.querySelector<HTMLElement>('[data-s04-note]')!;
          const live = box.querySelector<HTMLElement>(':scope > div:last-child')!;
          // Layout numbers (not affected by the stage's transforms): the box, the note's place under it, and the live letter's own top.
          return { box: box.offsetHeight, note: note.offsetTop, liveTop: live.offsetTop, liveHeight: live.offsetHeight };
        });
      const step = async (progress: number) => {
        const target = section.top + section.travel * progress;
        for (let y = Math.max(0, target - 600); y <= target; y += 150) {
          await page.evaluate((v) => window.scrollTo(0, v), y);
          await page.waitForTimeout(16);
        }
        await page.evaluate((v) => window.scrollTo(0, v), target);
        await page.waitForTimeout(500);
      };
      await step(0.1); // the letter as heard, before any fix
      const before = await read();
      await step(0.75); // every fix made (the scene's rest)
      const after = await read();
      await context.close();
      expect(after.box, 'the box holds its height').toBe(before.box);
      expect(after.note, 'the note stays where it was').toBe(before.note);
      expect(after.liveTop, 'the letter hangs from the same top edge').toBe(before.liveTop);
      expect(after.liveHeight, 'and the fixes did close it up inside the box (a line or more)').toBeLessThan(before.liveHeight);
    });
  }
});

test.describe('"Talk like you normally do." (S03)', () => {
  for (const [width, height] of [
    [1024, 768],
    [1280, 720],
    [1440, 900],
  ]) {
    test(`the headline and its line stay clear of the phone at ${width}x${height}, in no more than two lines`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      await page.goto(filmUrl());
      await waitLikeAPerson(page);
      const target = (await restTops(page))[2];
      for (let y = Math.max(0, target - 900); y <= target; y += 150) {
        await page.evaluate((v) => window.scrollTo(0, v), y);
        await page.waitForTimeout(16);
      }
      await page.waitForTimeout(800);
      const m = await page.evaluate(() => {
        const scene = document.getElementById('just-talk')!;
        const h = scene.querySelector('h2')!;
        const support = h.parentElement!.nextElementSibling as HTMLElement;
        const phone = scene.querySelector<HTMLElement>('[class*="phoneStage"] > div')!.getBoundingClientRect();
        const words = (el: Element) => {
          // The right-most edge of the text itself, not of its box.
          const range = document.createRange();
          range.selectNodeContents(el);
          return Math.max(...[...range.getClientRects()].map((r) => r.right));
        };
        const lineHeight = Number.parseFloat(getComputedStyle(h).lineHeight);
        return { phoneLeft: phone.left, headRight: words(h), supportRight: words(support), lines: Math.round(h.getBoundingClientRect().height / lineHeight) };
      });
      expect(m.headRight, 'headline right edge vs phone').toBeLessThan(m.phoneLeft);
      expect(m.supportRight, 'support right edge vs phone').toBeLessThan(m.phoneLeft);
      expect(m.lines).toBeLessThanOrEqual(2);
      await context.close();
    });
  }
});
