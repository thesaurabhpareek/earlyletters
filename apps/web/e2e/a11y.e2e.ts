/**
 * axe-core on every page, in light and dark. axe-core is a dev dependency of @scribe/web (installed from npm; the
 * sandbox could reach the registry, so nothing is vendored). It is injected with page.evaluate, which
 * the site's Content-Security-Policy does not block, so the page under test keeps its real policy.
 *
 * Two passes per page and scheme:
 *  - reduced motion: the finished state of every scene, all rules (WCAG 2.0, 2.1 and 2.2 A and AA, and best practice);
 *  - normal motion: the same, except colour contrast, because text that fills from dim to bright as it is scrolled
 *    is by design below contrast until it is read (motion respects the visitor's reduced-motion setting above).
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { PAGES } from './support/pages';

const axeSource = readFileSync(createRequire(__filename).resolve('axe-core/axe.min.js'), 'utf8');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

type Violation = { id: string; impact: string | null; help: string; nodes: { target: unknown[]; failureSummary?: string }[] };

async function runAxe(page: Page, options: { skipContrast: boolean }): Promise<Violation[]> {
  await page.evaluate(axeSource);
  return page.evaluate(
    async ({ tags, skipContrast }) => {
      const axe = (window as unknown as { axe: { run: (ctx: Document, opts: object) => Promise<{ violations: unknown[] }> } }).axe;
      const result = await axe.run(document, {
        runOnly: { type: 'tag', values: tags },
        rules: skipContrast ? { 'color-contrast': { enabled: false } } : {},
      });
      return result.violations as never;
    },
    { tags: TAGS, skipContrast: options.skipContrast },
  );
}

function describe(violations: Violation[]): string {
  return violations.map((v) => `${v.id} (${v.impact}): ${v.help}\n${v.nodes.slice(0, 4).map((n) => `    ${JSON.stringify(n.target)}`).join('\n')}`).join('\n');
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe, ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    for (const p of PAGES) {
      test.describe(p.name, () => {
        test.use({ strictConsole: p.status === 200 });

        test(`${p.path}: no violations with reduced motion (all rules)`, async ({ page }) => {
          await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: scheme });
          await page.goto(p.path);
          await page.waitForLoadState('networkidle');
          const violations = await runAxe(page, { skipContrast: false });
          expect(violations, describe(violations)).toEqual([]);
        });

        test(`${p.path}: no violations with normal motion (contrast excluded)`, async ({ page }) => {
          await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: scheme });
          await page.goto(p.path);
          await page.waitForLoadState('networkidle');
          const violations = await runAxe(page, { skipContrast: true });
          expect(violations, describe(violations)).toEqual([]);
        });
      });
    }
  });
}

test.describe('the scanner itself', () => {
  test('is wired up: it flags an image without alternative text and a low-contrast line added to a page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/privacy');
    await page.evaluate(() => {
      document.querySelector('main')?.insertAdjacentHTML(
        'beforeend',
        '<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="10" height="10"><p style="color:#ccc;background:#fff">faint</p>',
      );
    });
    const ids = (await runAxe(page, { skipContrast: false })).map((v) => v.id);
    expect(ids).toContain('image-alt');
    expect(ids).toContain('color-contrast');
  });
});

test.describe('axe sees the form states too', () => {
  test('the sign-up form in its error state and its success state', async ({ page, email }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForFunction(() => performance.now() > 1800);
    await page.getByLabel('Your email').fill('asha-at-example.com');
    await page.getByRole('button', { name: 'Keep me informed' }).click();
    await expect(page.locator('form [role="status"]').first()).not.toBeEmpty();
    let violations = await runAxe(page, { skipContrast: false });
    expect(violations, describe(violations)).toEqual([]);

    await page.getByLabel('Your email').fill(email);
    await page.getByRole('button', { name: 'Keep me informed' }).click();
    await expect(page.getByText('Thank you, you are on the list')).toBeVisible();
    violations = await runAxe(page, { skipContrast: false });
    expect(violations, describe(violations)).toEqual([]);
  });
});
