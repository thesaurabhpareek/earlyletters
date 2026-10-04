/** The sign-up with a keyboard only: reach the field, type, reach the button, press Enter. And focus is always visible. */
import type { Page } from '@playwright/test';
import { site } from '../src/content/site';
import { expect, notifyApi, test, waitLikeAPerson } from './support/fixtures';

const n = site.notify;

/** A short description of what has focus, or null when nothing but the page does. */
async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    return { tag: el.tagName.toLowerCase(), id: el.id, name: el.getAttribute('name'), label: el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 40), type: el.getAttribute('type') };
  });
}

/** Presses Tab until `stop` says the target has focus. Returns everything that was focused on the way. */
async function tabTo(page: Page, stop: (f: NonNullable<Awaited<ReturnType<typeof focused>>>) => boolean, max = 60) {
  const path: NonNullable<Awaited<ReturnType<typeof focused>>>[] = [];
  for (let i = 0; i < max; i++) {
    await page.keyboard.press('Tab');
    const f = await focused(page);
    if (!f) continue;
    path.push(f);
    if (stop(f)) return path;
  }
  throw new Error(`never reached the target in ${max} Tab presses; saw ${JSON.stringify(path.map((p) => p.tag + '#' + p.id))}`);
}

test.describe('keyboard path through the form', () => {
  test('Tab reaches the email field, then the button; Enter submits; the hidden trap is never in the way', async ({ page, mock, email }) => {
    await page.goto('/');
    await waitLikeAPerson(page);

    const toField = await tabTo(page, (f) => f.id === 'notify-email');
    // Every stop on the way is a real control (a link, button or the field), never the hidden honeypot.
    for (const stop of toField) {
      expect(['a', 'button', 'input']).toContain(stop.tag);
      expect(stop.id).not.toBe('notify-company');
    }

    await page.keyboard.type(email);
    await expect(page.getByLabel(n.label)).toHaveValue(email);

    await page.keyboard.press('Tab');
    const button = await focused(page);
    expect(button?.tag).toBe('button');
    expect(button?.label).toBe(n.quietButton);

    await page.keyboard.press('Enter');
    await expect(page.getByText(n.success)).toBeVisible();
    expect(await mock.contact(email)).toBeDefined();
  });

  test('Enter inside the field submits too', async ({ page, mock, email }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await page.getByLabel(n.label).focus();
    await page.keyboard.type(email);
    await page.keyboard.press('Enter');
    await expect(page.getByText(n.success)).toBeVisible();
    expect(await mock.contact(email)).toBeDefined();
  });

  test('Shift+Tab from the button goes back to the field, and the error message is reachable by the field description', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    await page.getByLabel(n.label).focus();
    await page.keyboard.press('Tab');
    expect((await focused(page))?.tag).toBe('button');
    await page.keyboard.press('Shift+Tab');
    expect((await focused(page))?.id).toBe('notify-email');
    // The hint and the live message are tied to the field for screen readers.
    const describedBy = await page.getByLabel(n.label).getAttribute('aria-describedby');
    expect(describedBy?.split(' ')).toHaveLength(2);
    for (const id of describedBy!.split(' ')) await expect(page.locator(`[id="${id}"]`)).toBeAttached();
  });

  test('focus is always visible: every control on the home page changes its look when focused', async ({ page }) => {
    await page.goto('/');
    await waitLikeAPerson(page);
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      const result = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        // What the element and its two nearest ancestors look like (a field's ring or underline is often drawn by its row).
        const look = () =>
          [el, el.parentElement, el.parentElement?.parentElement]
            .filter((n): n is HTMLElement => Boolean(n))
            .map((n) => {
              const s = getComputedStyle(n);
              return [s.outlineStyle, s.outlineWidth, s.outlineColor, s.boxShadow, s.borderBottomColor, s.borderBottomWidth, s.textDecorationLine, s.color].join('|');
            })
            .join('||');
        const focusedLook = look();
        el.blur();
        const blurredLook = look();
        el.focus();
        return { id: el.id || `${el.tagName.toLowerCase()}:${(el.textContent ?? '').trim().slice(0, 20)}`, visible: focusedLook !== blurredLook };
      });
      if (!result) break;
      if (seen.includes(result.id)) break; // wrapped around
      seen.push(result.id);
      expect(result.visible, `no visible focus indicator on ${result.id}`).toBe(true);
    }
    expect(seen.length).toBeGreaterThan(3);
  });
});

test.describe('keyboard on the other pages', () => {
  test('the unsubscribe confirm page: Tab to the button, Enter confirms', async ({ page, request, mock, email, clientIp }) => {
    await notifyApi(request, clientIp, email);
    const html = (await mock.emailsTo(email))[0].html;
    const path = /https:\/\/earlyletters\.com(\/unsubscribe\?t=[^"&\s<]+)/.exec(html)![1];
    await page.goto(path);
    const stops = await tabTo(page, (f) => f.tag === 'button');
    expect(stops.at(-1)?.label).toBe(site.unsubscribe.button);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: site.unsubscribe.doneTitle })).toBeVisible();
    expect((await mock.contact(email))?.unsubscribed).toBe(true);
  });

  test('the legal pages: the first Tab stop is the way back home', async ({ page }) => {
    await page.goto('/privacy');
    await page.keyboard.press('Tab');
    const f = await focused(page);
    expect(f?.tag).toBe('a');
    expect(f?.label).toContain(site.brand.name);
  });
});
