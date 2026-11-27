import { brand } from '@scribe/brand';
import { PROMPTS, en, languageCopy, packsCopy } from '@scribe/content';
import { CHILD, btn, currentMonthOpener, journey, monthOpener } from './support/app';
import { expect, seeded, test } from './support/journey';

/**
 * J26 (BL-410, missing screens): Settings, Spoken language and Settings, Legal (the Terms of Service and Privacy Policy
 * rows, and Licenses). Every word the flow looks for comes from @scribe/content and @scribe/brand, so a copy change moves
 * the test with the app. Selectors started from the J23 flow in closed PR #1399 (head bea7ff04), which was never run.
 *
 * Then three states of Tonight and the Book that need a seeded family (src/dev/asha-seed.ts, web preview only): Tonight
 * before the birth (`asha-unborn`), Tonight with a second draft waiting (`asha-drafts`) and a long Book (`asha-long`).
 *
 * Not captured here, on purpose: Help (a row that opens the mail app, with no page of its own), and the Terms and Privacy
 * documents themselves (the rows open the website in the in-app browser, so there is no in-app page to capture). The
 * lock-screen notification, the interruption states and the short, silent and model-missing end states are device
 * captures (BL-279): a browser has no lock screen, no call to interrupt a take and no speech model.
 */
const h = en.settingsHome;

test('[J26] Spoken language', async ({ app, record }) => {
  const step = journey(record, 'J26', 'missing-screens', 1, 'J16-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText(h.languageLabel, { exact: true }).click();
  await expect(app.getByText(languageCopy.primaryTitle, { exact: false })).toBeVisible();
  await expect(app.getByText(languageCopy.keyboardTitle, { exact: false })).toBeVisible();
  await step('happy', languageCopy.title, 'The language the parent speaks in, with the characters and spelling choices where they apply, and the typing note.');
});

test('[J26] Storage', async ({ app, record }) => {
  const step = journey(record, 'J26', 'missing-screens', 3, 'J16-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText(h.storageLabel, { exact: true }).click();
  await expect(app.getByText(packsCopy.downloadedTitle, { exact: true })).toBeVisible();
  await expect(app.getByText(packsCopy.empty, { exact: true })).toBeVisible();
  await step('happy', packsCopy.title, 'What is downloaded on this phone. On web nothing is, so the page shows the empty line.');
});

test('[J26b] Legal: Terms of Service, Privacy Policy and Licenses', async ({ app, record }) => {
  const step = journey(record, 'J26', 'missing-screens', 2, 'J16-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText(h.legalLabel, { exact: true }).click();
  await expect(app.getByText(h.termsLabel, { exact: true })).toBeVisible();
  await expect(app.getByText(h.privacyPolicyLabel, { exact: true })).toBeVisible();
  await expect(app.getByText(h.licencesLabel, { exact: true })).toBeVisible();
  await step('happy', h.legalLabel, `One page with three rows: ${h.termsLabel} and ${h.privacyPolicyLabel} (they open ${brand.web.terms} and ${brand.web.privacy} in the in-app browser) and ${h.licencesLabel}.`);
});

const t = en.tonight;
const readItBack = t.afterSave.reviewButton;

test('[J26c] Tonight before the birth', async ({ app, record }) => {
  const step = journey(record, 'J26', 'missing-screens', 4, 'J04-01');
  await seeded(app, 'asha-unborn');
  await expect(btn(app, t.speakButton)).toBeVisible();
  // The dateline names the stage: "Asha · Before You", read aloud without the dot.
  await expect(app.getByLabel(`${CHILD}, ${en.book.beforeYouChapter}`, { exact: true })).toBeVisible();
  // The prompt is one of the set written for a book before the birth (no hands, no first day home).
  const before = PROMPTS.filter((p) => p.band === 'before' && !p.retired).map((p) => p.text.split('{child}').join(CHILD));
  expect(before.length).toBeGreaterThan(0);
  await expect
    .poll(async () => {
      const body = await app.locator('body').innerText();
      return before.some((line) => body.includes(line));
    })
    .toBe(true);
  // Nothing is written yet, so nothing waits.
  await expect(app.getByText(readItBack, { exact: true })).toHaveCount(0);
  await step('happy', 'Tonight before the birth', `A book whose child is not born yet (a due date ten weeks away, no birthday): the dateline reads "${CHILD} · ${en.book.beforeYouChapter}" and the one prompt comes from the set written for before the birth. Speak and Type as on any night. (Seeded fictional family Asha.)`);
});

test('[J26d] Tonight with a second draft waiting', async ({ app, record }) => {
  const step = journey(record, 'J26', 'missing-screens', 5, 'J04-01');
  await seeded(app, 'asha-drafts');
  await expect(btn(app, t.speakButton)).toBeVisible();
  // Two recordings with their words ready, each its own card with "Read it back"; the seed's words (src/dev/asha-seed.ts).
  await expect(app.getByText(readItBack, { exact: true })).toHaveCount(2);
  const today = app.getByRole('button', { name: new RegExp(`Asha, um, today you you held the spoon.*${readItBack}\\.$`) });
  const yesterday = app.getByRole('button', { name: new RegExp(`Asha, you sat in the laundry basket.*${readItBack}\\.$`) });
  await expect(today).toHaveCount(1);
  await expect(yesterday).toHaveCount(1);
  // Newest first.
  expect((await today.boundingBox())!.y).toBeLessThan((await yesterday.boundingBox())!.y);
  // Each card stands alone: no total anywhere on Tonight.
  await expect(app.getByText(/\b2 (letters|recordings|drafts)\b/i)).toHaveCount(0);
  await step('happy', 'Tonight with a second draft waiting', `Two recordings waiting on Review, each on its own card with its day, its length, the first words as spoken and "${readItBack}", newest first. Nothing says how many. (Seeded fictional family Asha.)`);
});

test('[J26e] a long Book', async ({ app, record }) => {
  const step = journey(record, 'J26', 'missing-screens', 6, 'J09-02');
  await seeded(app, 'asha-long');
  await app.getByText(en.tabs.book, { exact: true }).last().click();
  await expect(currentMonthOpener(app)).toBeVisible();
  // The book runs well past one screen: the tallest scrolling area holds more than two more screens (as record measures it).
  const extra = await app.evaluate(() => {
    let best = 0;
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.clientHeight > 200) best = Math.max(best, el.scrollHeight - el.clientHeight);
    }
    return best;
  });
  expect(extra).toBeGreaterThan(2 * app.viewportSize()!.height);
  await step('happy', 'A long Book', 'Thirty letters over seven months: the cover band, then chapter after chapter, newest first. Full length capture shows every chapter. (Seeded fictional family Asha.)');
  // Deep in the book an older chapter opens the same way.
  const deep = monthOpener(app, 2);
  await app.mouse.move(201, 600);
  for (let i = 0; i < 40 && !(await deep.isVisible()); i++) {
    await app.mouse.wheel(0, 600);
    await app.waitForTimeout(150);
  }
  await expect(deep).toBeVisible();
});
