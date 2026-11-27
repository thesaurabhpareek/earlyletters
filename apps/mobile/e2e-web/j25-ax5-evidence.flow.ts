import type { Page } from '@playwright/test';
import { journey, tapWhenStill } from './support/app';
import { expect, test } from './support/journey';

/**
 * J25 (BL-409, LEGAL-REQ-051): one AX5 screenshot each of Review, a letter and Settings, on the seam build
 * (support/builds.ts). No Plus gate here (CR-240, BL-2009): the seam build is a development build, which alpha.ts makes an
 * alpha build where no letter is held, so the gate never shows, and B-9 refuses the seam in a production build. The Plus gate
 * at AX5 is device evidence: docs/qa/DEVICE_TEST_PLAN.md V-06, on a production-profile build.
 * EMULATION EVIDENCE, NOT DEVICE EVIDENCE: Chromium at phone size shows layout at the 3.571 scale, not iOS Dynamic Type or
 * VoiceOver; the device run (docs/qa/DEVICE_TEST_PLAN.md) stays the authority. Each step also records
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
  await tapWhenStill(app.getByText(/rained all morning/).first());
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
