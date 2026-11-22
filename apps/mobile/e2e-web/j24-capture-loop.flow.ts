import type { Page } from '@playwright/test';
import { btn, journey } from './support/app';
import { canary, expect, test } from './support/journey';

/**
 * J24 (BL-410): the capture loop at larger text sizes and in the seven spoken languages, on the seam build only
 * (support/builds.ts, `seam`): `?e2eFontScale=` takes the closed set (AX1 1.786, AX3 2.643, AX5 3.571) and `?e2eLang=` one of
 * en, hi, es, zh, fr, ar, pt. Presentation only. EMULATION EVIDENCE, NOT DEVICE EVIDENCE: Chromium at phone size does
 * not show iOS Dynamic Type, VoiceOver or real script shaping; the device run (docs/qa/DEVICE_TEST_PLAN.md) stays the authority.
 * The web has no speech model, so the loop is the typed path: Write, then "Add to Asha's book".
 */
const SCALES = { AX1: 1.786, AX3: 2.643, AX5: 3.571 } as const;
const LANGS = ['hi', 'es', 'zh', 'fr', 'ar', 'pt'] as const;
/**
 * BL-1643: each test records under its own step ids (steps/J24-NN.json), so no test overwrites another's records.
 * The scale tests record three steps each, the language tests one each: J24-01..09, then J24-10..15.
 */
const SCALE_START = { AX1: 1, AX3: 4, AX5: 7 } as const;
const LANG_START = { hi: 10, es: 11, zh: 12, fr: 13, ar: 14, pt: 15 } as const;
const LETTER = 'You put both hands on the window today and watched the rain.';

const open = (page: Page, q: string) => page.goto(`${process.env.E2E_WEB_SEAM_URL}/?seed=asha&${q}`);

/** The seam's whole effect on the page, plus: nothing on screen is clipped off the sides. */
async function expectNoSideClipping(page: Page) {
  const wide = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(wide, 'the page is not wider than the screen').toBeLessThanOrEqual(1);
}

for (const [name, scale] of Object.entries(SCALES)) {
  test(`[J24] capture loop at ${name}: write, keep, land in the Book (emulation evidence, not device evidence)`, async ({ app, record }) => {
    const step = journey(record, 'J24', `capture-loop-${name.toLowerCase()}`, SCALE_START[name as keyof typeof SCALE_START], 'J07-01');
    await open(app, `e2eFontScale=${scale}`);
    await expect(btn(app, 'Speak')).toBeVisible();
    await expect(btn(app, /^Type/)).toBeVisible();
    await expectNoSideClipping(app);
    await step('happy', `Tonight at ${name} (emulation)`, `The two ways in, Speak and Type, at the ${name} scale on the web emulation. Layout evidence only.`);
    canary(app, LETTER);
    await btn(app, /^Type/).click();
    await app.getByRole('textbox').first().fill(LETTER);
    await expect(btn(app, /^Add to .*book/)).toBeEnabled();
    await expect(btn(app, 'Keep private')).toBeEnabled();
    await step('happy', `Write at ${name} (emulation)`, `The page with a typed letter: both keep buttons are there and enabled at ${name}. Emulation, not a device.`);
    await btn(app, /^Add to .*book/).click();
    await expect(app.getByText("Added to Asha's book.")).toBeVisible();
    await step('happy', `Kept at ${name} (emulation)`, `The letter is added with no Review step, as for any typed letter.`, undefined, { settle: 120 });
  });
}

for (const lang of LANGS) {
  test(`[J24] capture loop with the page in ${lang}: language and direction set, loop still completes (emulation evidence, not device evidence)`, async ({ app, record }) => {
    const step = journey(record, 'J24', `capture-loop-${lang}`, LANG_START[lang], 'J07-01');
    await open(app, `e2eLang=${lang}`);
    await expect(btn(app, /^Type/)).toBeVisible();
    await expect(app.locator('html')).toHaveAttribute('lang', lang);
    await expect(app.locator('html')).toHaveAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    await step('happy', `Tonight, ${lang} (emulation)`, `The page language is ${lang} and its direction is ${lang === 'ar' ? 'right to left' : 'left to right'}; the app words stay English in v1.0 (D-056). Emulation, not a device.`);
    await btn(app, /^Type/).click();
    await app.getByRole('textbox').first().fill(LETTER);
    await btn(app, /^Add to .*book/).click();
    await expect(app.getByText("Added to Asha's book.")).toBeVisible();
  });
}

test('[J24] the seam ignores values outside the closed set (emulation evidence, not device evidence)', async ({ app }) => {
  await open(app, 'e2eFontScale=9&e2eLang=de');
  await expect(app.locator('html')).not.toHaveAttribute('dir', 'rtl');
  await expect(app.locator('html')).not.toHaveAttribute('lang', 'de');
  await expect(btn(app, /^Type/)).toBeVisible();
});

test('[J24] the other builds ignore the seam keys (emulation evidence, not device evidence)', async ({ app }) => {
  await app.goto(`${process.env.E2E_WEB_SEED_URL}/?seed=asha&e2eLang=ar`);
  await expect(btn(app, /^Type/)).toBeVisible();
  await expect(app.locator('html')).not.toHaveAttribute('dir', 'rtl');
});
