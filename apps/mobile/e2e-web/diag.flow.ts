import { expect, test } from './support/journey';

/** DIAGNOSTIC ONLY (store-build seed crash, from the #2193 report; never merged). Prints what the page shows and every error. */
const run = async (app: import('@playwright/test').Page, label: string, url: string) => {
  const errs: string[] = [];
  app.on('pageerror', (e) => errs.push(`pageerror: ${e.name}: ${e.message}\n${(e.stack ?? '').slice(0, 2500)}`));
  app.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') errs.push(`console.${m.type()}: ${m.text().slice(0, 3000)}`);
  });
  await app.goto(url);
  await app.waitForTimeout(8000);
  const text = await app.locator('body').innerText().catch((e) => `innerText failed: ${e}`);
  console.log(`[DIAG ${label}] url=${app.url()}\n[DIAG ${label}] text=${text.replace(/\s+/g, ' ').slice(0, 600)}\n[DIAG ${label}] errors (${errs.length}):\n${errs.join('\n---\n')}\n[DIAG ${label}] end`);
};

for (const seed of ['asha', 'asha-plus', 'asha-unborn', 'asha-waiting']) {
  test(`[DIAG] store build ?seed=${seed}`, async ({ app }) => {
    await run(app, `store-${seed}`, `${process.env.E2E_WEB_STORE_URL}/?seed=${seed}`);
    expect(true).toBe(true);
  });
}

test('[DIAG] store build, no seed', async ({ app }) => {
  await run(app, 'store-none', `${process.env.E2E_WEB_STORE_URL}/`);
  expect(true).toBe(true);
});

test('[DIAG] seed build ?seed=asha (control)', async ({ app }) => {
  await run(app, 'seed-asha', `${process.env.E2E_WEB_SEED_URL}/?seed=asha`);
  expect(true).toBe(true);
});
