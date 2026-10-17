import { btn, firstRun, journey, typeLetter } from './support/app';
import { expect, seeded, test } from './support/journey';

/** The words of the seeded draft (src/dev/asha-seed.ts ASHA_REVIEW_RAW): the person's own, as spoken. */
const SEEDED_WORDS = /Asha, um, today you you held the spoon/;

test('[J04] Tonight: one question, another thought, a card for the waiting letter', async ({ app, record }) => {
  const step = journey(record, 'J04', 'tonight-and-prompts', 1, 'J01-14');
  await seeded(app);
  await expect(btn(app, 'Speak')).toBeVisible();
  // One question on screen: the prompt. No subtitle, no caps label (its words are now only the prompt's hint).
  await expect(app.getByText('A thought to start with', { exact: false })).toHaveCount(0);
  await expect(app.getByText(/to know about today\?/)).toHaveCount(0);
  // The dateline is read without its separator ("Asha, 7 months"); the card shows the first words and its action.
  await expect(app.getByLabel(/^Asha, 7 months/)).toBeVisible();
  await expect(app.getByText(SEEDED_WORDS)).toBeVisible();
  await expect(app.getByText('Read it back', { exact: true })).toBeVisible();
  await expect(app.getByRole('button', { name: /Asha, um, today you you held the spoon.*Read it back\.$/ })).toHaveCount(1);
  await step('happy', 'Tonight with a letter waiting', 'One question: the prompt, large, on the lamp-lit paper. Under it, the recording waiting on Review has its own card: the day it was made and its length, the first words as spoken, and "Read it back". (Seeded fictional family Asha, 7 months.)');
  const before = await app.locator('body').innerText();
  await btn(app, 'Another thought').click();
  await app.waitForTimeout(500);
  const after = await app.locator('body').innerText();
  expect(after).not.toEqual(before);
  await step('happy', 'Another thought', 'The prompt leaves and a different one rises in its place. There is no limit and nothing is counted.');
});

test('[J04b] a brand new book on Tonight, day 0', async ({ app, record }) => {
  const step = journey(record, 'J04', 'tonight-and-prompts', 3, 'J04-02');
  await firstRun(app);
  await expect(btn(app, 'Speak')).toBeVisible();
  await expect(app.getByText('Read it back', { exact: true })).toHaveCount(0);
  await step('happy', 'Tonight on day 0', 'A new book: the dateline reads "Asha, 0 days", no card, one prompt chosen for a newborn.');
});

test('[J04c] no usage-sharing ask in v1.0, in a later session', async ({ app, record }) => {
  const step = journey(record, 'J04', 'tonight-and-prompts', 4, 'J04-02');
  await seeded(app, 'asha', '/', { keepConsent: true });
  await expect(btn(app, 'Speak')).toBeVisible();
  // The ask used to appear 1.2 s after a tab screen opened; wait well past that.
  await app.waitForTimeout(3000);
  await expect(btn(app, "Don't share")).toHaveCount(0);
  await step('happy', 'A later session: no usage-sharing ask', 'v1.0 collects no data (D-088, "Data Not Collected"), so the "Help us make it better?" sheet never appears and Settings, Privacy has no usage switch. Analytics returns with consent in v1.1.');
});

test('[J04d] two recordings kept, then the app relaunched: two cards', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J04', 'tonight-and-prompts', 5, 'J04-03');
  await firstRun(app);
  for (let take = 0; take < 2; take++) {
    await btn(app, /^Speak/).click();
    await expect(app.getByText('Listening.')).toBeVisible();
    await app.waitForTimeout(1500);
    await btn(app, 'Finish').click();
    await expect(app.getByRole('heading', { name: 'Read it back' })).toBeVisible();
    await btn(app, 'Close').click();
    await expect(btn(app, 'Speak')).toBeVisible();
  }
  await app.reload();
  await expect(btn(app, 'Speak')).toBeVisible();
  // The web build has no speech model, so both takes are still waiting for their words.
  await expect(app.getByText('A recording, waiting for its words.')).toHaveCount(2);
  await expect(app.getByText('Open', { exact: true })).toHaveCount(2);
  // Each card stands alone: no total anywhere on Tonight.
  await expect(app.getByText(/\b2 (letters|recordings|drafts)\b/i)).toHaveCount(0);
  // Each is one button that says what it is and what it does.
  await expect(app.getByRole('button', { name: /A recording, waiting for its words\. Open\.$/ })).toHaveCount(2);
  await step('happy', 'Two takes after a relaunch', 'Both recordings are on Tonight, each on its own card with its day and length, newest first, and "Open". Nothing says how many. (The web build has no speech model, so the words have not come yet; a phone writes them down. A browser keeps a take only in memory, so this flow does not open one after the reload; on a phone the file is on disk.)');
});

test('[J04e] a letter typed and closed mid-sentence: its first words and "Pick it up"', async ({ app, record }) => {
  const step = journey(record, 'J04', 'tonight-and-prompts', 6, 'J04-01');
  await seeded(app);
  await btn(app, /^Type/).click();
  await app.getByRole('textbox').first().fill('You found your toes this morning and');
  await expect(app.getByText('Saved on this phone')).toBeVisible();
  await btn(app, 'Close').click();
  await expect(btn(app, 'Speak')).toBeVisible();
  await expect(app.getByText('You found your toes this morning and')).toBeVisible();
  await expect(app.getByText('Pick it up', { exact: true })).toBeVisible();
  await expect(app.getByRole('button', { name: /^A letter you started, .*You found your toes this morning and\. Pick it up\.$/ })).toHaveCount(1);
  // The seeded recording keeps its own card beside it.
  await expect(app.getByText(SEEDED_WORDS)).toBeVisible();
  await step('unhappy', 'A typed letter left mid-sentence', 'Closing keeps the words. Tonight shows them on their own card, newest first, with "Pick it up"; the recording waiting on Review keeps its card below (J07-05).');
  await app.getByText('Pick it up', { exact: true }).click();
  await expect(app.getByRole('textbox').first()).toHaveValue('You found your toes this morning and');
  await step('happy', 'Picking it up', 'The page reopens with the words exactly as left.');
});

test('[J04f] a letter held at the Keep step waits on Tonight', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J04', 'tonight-and-prompts', 8, 'J04-01');
  // A free phone: two letters are kept, the third is held at the Keep step (D-082). Typed, so no recording has to
  // load in a browser.
  await firstRun(app);
  await typeLetter(app, 'You held the spoon by yourself today.');
  await expect(btn(app, 'Speak')).toBeVisible({ timeout: 8000 });
  await typeLetter(app, 'You laughed at the rain.');
  await expect(btn(app, 'Speak')).toBeVisible({ timeout: 8000 });
  await btn(app, /^Type/).click();
  await app.getByRole('textbox').first().fill('You waved at the dog on the corner.');
  await btn(app, 'Save').click();
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText("Keep adding to Asha's book")).toBeVisible();
  await expect(app.getByText('This one waits on this phone, on Tonight, exactly as it is, for as long as you like.')).toBeVisible();
  await btn(app, 'Keep it here for now').click();
  await expect(btn(app, 'Speak')).toBeVisible();
  await expect(app.getByText('You waved at the dog on the corner.')).toBeVisible();
  // Until local schema v8 (#182) gives the draft its `held` field, a held typed letter is a typed draft ("Pick it
  // up"); with it, "Waiting to be kept." and "Keep it" (S09). Either way it is one card, with the words as typed.
  await expect(app.getByRole('button', { name: /You waved at the dog on the corner\./ })).toHaveCount(1);
  await step('happy', 'The held letter on Tonight', 'The Keep sheet said the letter waits on Tonight, and it does: its own card with the words as typed. With the held-drafts schema (#182) the card says "Waiting to be kept." and "Keep it".');
});
