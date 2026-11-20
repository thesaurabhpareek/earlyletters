/**
 * The launch flip kit is OFF in the build the suite makes (no NEXT_PUBLIC_APP_STORE_URL): the live site must be exactly
 * what it was. No QR, no download badge, no App Store link, and the email form is still the one action. Owner: E3.
 */
import { site } from '../src/content/site';
import { expect, test } from './support/fixtures';
import { filmUrl } from './support/env';

test.describe('launch flip kit, off', () => {
  for (const [name, url] of [['coming-soon home', () => '/'], ['film home', () => filmUrl()]] as const) {
    test(`${name}: no QR, no badge, no App Store link`, async ({ page }) => {
      await page.goto(url());
      await expect(page.locator('[data-store-qr]')).toHaveCount(0);
      await expect(page.locator('a[href*="apps.apple.com"]')).toHaveCount(0);
      await expect(page.getByText(site.cta.live.qrHint)).toHaveCount(0);
      await expect(page.getByRole('link', { name: site.cta.live.badgeLabel })).toHaveCount(0);
      await expect(page.getByRole('textbox', { name: /email/i }).first()).toBeAttached();
    });
  }
});
