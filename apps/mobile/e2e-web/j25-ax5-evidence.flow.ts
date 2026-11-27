import type { Page } from '@playwright/test';
import { btn, journey } from './support/app';
import { expect, test } from './support/journey';

/**
 * J25 (BL-409, LEGAL-REQ-051): one AX5 screenshot each of Review, a letter, Settings and the Plus gate, on the seam build
 * (support/builds.ts). EMULATION EVIDENCE, NOT DEVICE EVIDENCE: Chromium at phone size shows layout at the 3.571 scale, not
 * iOS Dynamic Type or VoiceOver; the device run (docs/qa/DEVICE_TEST_PLAN.md) stays the authority. Each step also records
 * the accessibility tree (role, name, order) in its step JSON; with A11Y_STRICT=1 an unnamed control fails the step.
 */
const AX5 = 3.571;
const SEAM = (path: string, kind: string) => `${process.env.E2E_WEB_SEAM_URL}${path}?seed=${kind}&e2eFontScale=${AX5}`;

async function noSideClipping(page: Page) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide, 'the page is not wider than the screen').toBeLessThanOrEqual(1);
}

test('[J25] Review at AX5 (emulation evidence, not device evidence)', async ({ app, record }) => {
  const step = journey(record, 'J25', 'ax5-evidence', 1, 'J06-01');
  await app.goto(SEAM('/', 'asha-plus'));
  await app.getByText('Read it back').first().click();
  await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
  await noSideClipping(app);
  await step('happy', 'Review at AX5 (emulation)', 'The Review page at the largest text size on the web emulation. Layout evidence only.');
});

test('[J25] a letter at AX5 (emulation evidence, not device evidence)', async ({ app, record }) => {
  const step = journey(record, 'J25', 'ax5-evidence', 2);
  await app.goto(SEAM('/', 'asha'));
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByText(/rained all morning/).first().click();
  await expect(app.getByText('Spoken', { exact: false }).or(app.getByText('Typed', { exact: false })).first()).toBeVisible();
  await noSideClipping(app);
  await step('happy', 'A letter at AX5 (emulation)', 'The letter page at the largest text size on the web emulation. Layout evidence only.');
});

test('[J25] Settings at AX5 (emulation evidence, not device evidence)', async ({ app, record }) => {
  const step = journey(record, 'J25', 'ax5-evidence', 3);
  await app.goto(SEAM('/settings', 'asha'));
  await expect(app.getByTestId('settings.plan')).toBeVisible();
  await noSideClipping(app);
  await step('happy', 'Settings at AX5 (emulation)', 'Settings at the largest text size on the web emulation. Layout evidence only.');
});

test('[J25] the Plus gate at AX5 (emulation evidence, not device evidence)', async ({ app, record }) => {
  // Known failure on develop: BL-2009, the same cause as J06e (a free phone past its first two letters comes from the seed
  // hook, which the reading says does not run on the store build; not confirmed). Remove this line when BL-2009 is fixed:
  // a pass turns the job red.
  test.fail(true, 'Known failure BL-2009: remove this line in the PR that fixes it');
  const step = journey(record, 'J25', 'ax5-evidence', 4);
  await app.goto(SEAM('/', 'asha')); // a free phone past its first two letters, as in J06e
  await app.getByText('Read it back').first().click();
  await btn(app, 'Got it').click();
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText("Keep adding to Asha's book")).toBeVisible();
  await noSideClipping(app);
  await step('happy', 'The Plus gate at AX5 (emulation)', 'The sheet that says the letter waits on this phone, at the largest text size on the web emulation. Layout evidence only.');
});

// DIAGNOSTIC ONLY (BL-2019 investigation branch, never merged): on a failure, print the page.
test.afterEach(async ({ app }, info) => {
  if (info.status === info.expectedStatus) return;
  const text = await app.locator('body').innerText().catch((e) => `innerText failed: ${e}`);
  const cards = await app.getByTestId('book.card').count().catch(() => -1);
  console.log(`[DIAG ${info.title} #${info.repeatEachIndex}] url=${app.url()} bookCards=${cards} ms=${info.duration}\n[DIAG text] ${text.replace(/\s+/g, ' ').slice(0, 1500)}`);
});
