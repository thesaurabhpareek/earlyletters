import { btn } from './support/app';
import { expect, test } from './support/journey';

/** DIAGNOSTIC ONLY (BL-2009, BL-2019 investigation branch, never merged). Prints what the page shows. */
const dump = async (app: import('@playwright/test').Page, label: string) => {
  const text = await app.locator('body').innerText().catch((e) => `innerText failed: ${e}`);
  console.log(`[DIAG ${label}] url=${app.url()}\n[DIAG ${label}] text=${text.replace(/\s+/g, ' ').slice(0, 1200)}`);
};

test('[DIAG] store build with ?seed=asha', async ({ app }) => {
  test.skip(test.info().repeatEachIndex > 0, 'once is enough');
  const errs: string[] = [];
  app.on('pageerror', (e) => errs.push(`pageerror: ${e.message}\n${(e.stack ?? '').slice(0, 1500)}`));
  app.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(`console.${m.type()}: ${m.text().slice(0, 1500)}`); });
  await app.goto(`${process.env.E2E_WEB_STORE_URL}/?seed=asha`);
  await app.waitForTimeout(8000);
  await dump(app, 'store-seed');
  console.log(`[DIAG store-seed] errors (${errs.length}):\n${errs.join('\n---\n')}`);
  await app.goto(`${process.env.E2E_WEB_STORE_URL}/`);
  await app.waitForTimeout(5000);
  await dump(app, 'store-plain');
  expect(true).toBe(true);
});

test('[DIAG] seam build: Keep past two letters at AX5', async ({ app }) => {
  test.skip(test.info().repeatEachIndex > 0, 'once is enough');
  await app.goto(`${process.env.E2E_WEB_SEAM_URL}/?seed=asha&e2eFontScale=3.571`);
  await app.getByText('Read it back').first().click();
  await btn(app, 'Got it').click().catch((e) => console.log(`[DIAG seam] no Got it: ${e.message.split('\n')[0]}`));
  await btn(app, /^Add to .*book/).click();
  await app.waitForTimeout(4000);
  await dump(app, 'seam-keep');
  expect(true).toBe(true);
});
