/**
 * The share row, on the two pages a native form post lands on (these are built in every site mode; the film's own
 * copy under the sign-up form is the same component, placement "start"). Checks the six channels and what each one
 * sends, the copied link, the native share sheet, the tap size, and that counting sends nothing it should not.
 */
import { site } from '../src/content/site';
import { expect, test } from './support/fixtures';
import { shareLink } from '../src/components/site/ShareRow';

const c = site.comingSoon;
// The row shares the public address, never the page's own origin (a preview or the www host).
const LINK = shareLink(''); // the build used for e2e never sets NEXT_PUBLIC_SITE_URL (global-setup)
const PAGES = [
  { path: '/signup/thanks', placement: 'thanks' },
  { path: '/signup/already', placement: 'already' },
];

for (const { path, placement } of PAGES) {
  test.describe(`share row on ${path}`, () => {
    test('six app links, a copy button, each with a name and a 44px tap target', async ({ page }) => {
      await page.goto(path);
      const row = page.getByTestId('share-row');
      await expect(row).toBeVisible();
      await expect(row.getByText(c.shareHeading)).toBeVisible();
      const link = LINK;
      const message = `${c.shareText} ${link}`;
      const expected: Record<string, string> = {
        [c.shareWhatsapp]: `https://wa.me/?text=${encodeURIComponent(message)}`,
        [c.shareMessages]: `sms:?&body=${encodeURIComponent(message)}`,
        [c.shareEmail]: `mailto:?subject=${encodeURIComponent(c.shareTitle)}&body=${encodeURIComponent(message)}`,
        [c.shareFacebook]: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
        [c.shareTelegram]: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(c.shareText)}`,
        [c.shareX]: `https://x.com/intent/post?text=${encodeURIComponent(c.shareText)}&url=${encodeURIComponent(link)}`,
      };
      for (const [label, href] of Object.entries(expected)) {
        const a = row.getByRole('link', { name: `${c.shareVia} ${label}` });
        await expect(a).toHaveAttribute('href', href);
        const box = await a.boundingBox();
        expect(box?.height, label).toBeGreaterThanOrEqual(44);
        expect(box?.width, label).toBeGreaterThanOrEqual(44);
        if (href.startsWith('https:')) {
          await expect(a).toHaveAttribute('target', '_blank');
          expect(await a.getAttribute('rel')).toContain('noopener');
        }
      }
      const copy = row.getByRole('button', { name: c.shareCopy });
      const box = await copy.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    });

    test('copy link puts the plain address on the clipboard and says so', async ({ page, context, browserName }) => {
      test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium specific');
      await page.addInitScript(() => Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }));
      await page.goto(path);
      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(page.url()).origin });
      const row = page.getByTestId('share-row');
      await expect(row.getByRole('button', { name: c.shareMore })).toHaveCount(0);
      await row.getByRole('button', { name: c.shareCopy }).click();
      await expect(row.getByRole('status')).toHaveText(c.shareCopied);
      await expect(row.getByRole('button', { name: c.shareCopied })).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(LINK);
    });

    test('when the browser will not copy, the address is shown to copy by hand', async ({ page }) => {
      await page.addInitScript(() =>
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: () => Promise.reject(new Error('denied')) },
        }),
      );
      await page.goto(path);
      const row = page.getByTestId('share-row');
      await row.getByRole('button', { name: c.shareCopy }).click();
      await expect(row.getByTestId('share-copy-failed')).toContainText(LINK);
      await expect(row.getByRole('status')).toHaveText(`${c.shareCopyFailed} ${LINK}`);
    });

    test('More opens the native share sheet with the plain address when the browser has one', async ({ page }) => {
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
      await page.goto(path);
      await page.getByTestId('share-row').getByRole('button', { name: c.shareMore }).click();
      const shared = await page.evaluate(() => (window as unknown as { __shared: { title: string; text: string; url: string }[] }).__shared);
      expect(shared).toEqual([{ title: c.shareTitle, text: c.shareText, url: LINK }]);
    });

    test(`taps are counted as share_click with the channel and "${placement}" only, and only when analytics is on`, async ({ page }) => {
      // Analytics is off in this build, so the click must leave no queue behind and make no request.
      await page.goto(path);
      const requests: string[] = [];
      page.on('request', (r) => requests.push(r.url()));
      await page.getByTestId('share-row').getByRole('button', { name: c.shareCopy }).click();
      expect(await page.evaluate(() => (window as unknown as { va?: unknown }).va)).toBeUndefined();
      expect(requests.filter((u) => /vercel|_vercel|va\.js/.test(u))).toEqual([]);
    });

    test('keeps within a 320px screen with no sideways scroll and 44px taps', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto(path);
      const row = page.getByTestId('share-row');
      await expect(row).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      for (const a of await row.getByRole('link').all()) {
        const box = await a.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    });

    test.describe('with scripts off', () => {
      test.use({ javaScriptEnabled: false, strictConsole: false }); // a script preload is refused by the CSP with scripts off
      test('the six app links are still there, sharing the public address', async ({ page }) => {
        await page.goto(path);
        const row = page.getByTestId('share-row');
        await expect(row.getByRole('link')).toHaveCount(6);
        await expect(row.getByRole('link', { name: `${c.shareVia} ${c.shareFacebook}` })).toHaveAttribute(
          'href',
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(LINK)}`,
        );
        await expect(row.getByRole('button')).toHaveCount(0);
      });
    });
  });
}
