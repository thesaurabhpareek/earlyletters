/** The built home page states the Plus prices and trial lengths from src/content/pricing.ts, and never the old ones. */
import { plusPricing } from '../src/content/pricing';
import { site } from '../src/content/site';
import { expect, test } from './support/fixtures';

test.describe('pricing (coming soon)', () => {
  test('the pricing section states both prices and trial lengths, and not the old prices', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#price');
    await expect(section.getByRole('heading', { level: 2 })).toHaveText(site.scenes.s10.headline);
    for (const plan of Object.values(plusPricing)) {
      await expect(section).toContainText(plan.price);
      await expect(section).toContainText(`${plan.trialMonths}-month free trial`);
    }
    await expect(section).not.toContainText('$3.99');
    await expect(section).not.toContainText('$29.99');
  });
});
