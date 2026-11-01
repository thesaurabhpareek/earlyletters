import { PROMPTS } from '@scribe/content';
import { CHILD, SIGNS_AS, btn, dateInput, dayOffset, firstRun, journey, nameField, passAgeGate, startOnboarding, tab, toChildStep, typeLetter, noRemindersAfterFirstLetter } from './support/app';
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
  // The dateline is read without its separator ("Asha, 7 months"); the card shows the first words and its action. The seed
  // dates the birthday 214 days before now, so the age is 6 months in some runs (31 Jan to 27 Feb) and 7 in the rest.
  await expect(app.getByLabel(/^Asha, [67] months/)).toBeVisible();
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
  // A typed letter keeps from Write with one tap and lands on the Book (P4b), so each one comes back to Tonight.
  await typeLetter(app, 'You held the spoon by yourself today.');
  await noRemindersAfterFirstLetter(app); // the first letter's one ask (DR-12 B)
  await tab(app, 'Tonight').click();
  await expect(btn(app, 'Speak')).toBeVisible({ timeout: 8000 });
  await typeLetter(app, 'You laughed at the rain.');
  await tab(app, 'Tonight').click();
  await expect(btn(app, 'Speak')).toBeVisible({ timeout: 8000 });
  await btn(app, /^Type/).click();
  await app.getByRole('textbox').first().fill('You waved at the dog on the corner.');
  await btn(app, /^Add to .*book/).click();
  await expect(app.getByText("Keep adding to Asha's book")).toBeVisible();
  await expect(app.getByText('This letter waits on Tonight, on this phone, exactly as it is. Keep it whenever you like.')).toBeVisible();
  await btn(app, 'Keep it here for now').click();
  await expect(btn(app, 'Speak')).toBeVisible();
  await expect(app.getByText('You waved at the dog on the corner.')).toBeVisible();
  // "Keep it here for now" marks the draft held (store.holdDraft, P6a), so its one card says "Waiting to be kept." and
  // "Keep it" (S09), with the words as typed; j06 asserts those words.
  await expect(app.getByRole('button', { name: /You waved at the dog on the corner\./ })).toHaveCount(1);
  await step('happy', 'The held letter on Tonight', 'The Keep sheet said the letter waits on Tonight, and it does: its own card, with the words as typed, says "Waiting to be kept." and "Keep it".');
});

test('[J04g] a book that is not born yet: the dateline names the child and the prompts are for the weeks of waiting', async ({ app, record }) => {
  test.setTimeout(120_000);
  const step = journey(record, 'J04', 'tonight-and-prompts', 9, 'J04-02');
  // First run with "Not here yet" and a due date 60 days ahead: a child with a due date and no birthday.
  await passAgeGate(app);
  await startOnboarding(app);
  await toChildStep(app);
  await nameField(app).fill(CHILD);
  await app.getByText('Not here yet', { exact: true }).click();
  await dateInput(app, 'Due date').fill(dayOffset(60));
  await btn(app, 'Continue').click();
  await app.getByText(SIGNS_AS, { exact: true }).click();
  await btn(app, 'Sign my letters').click();
  await btn(app, /Write the first one/).click();
  await expect(btn(app, 'Speak')).toBeVisible();

  // The dateline names the child and uses Review's words for these letters ("To Asha, Before You"); it is read without the dot.
  await expect(app.getByLabel(/^Asha, Before You$/)).toBeVisible();
  await expect(app.getByText('Asha \u00b7 Before You', { exact: true })).toBeVisible();
  // Not the day's date alone, and no count of weeks or days.
  await expect(app.getByText(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),/)).toHaveCount(0);
  await expect(app.getByText(/\b\d+ (days?|weeks?)\b/)).toHaveCount(0);

  // Fourteen presses of "Another thought": every prompt is one of the eight written for the weeks before the birth,
  // none is about hands, the first day home or visitors, and no press shows the prompt that was on screen.
  const before = PROMPTS.filter((p) => p.band === 'before').map((p) => p.text.replace(/\{child\}/g, CHILD));
  expect(before.length).toBeGreaterThanOrEqual(6);
  const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const shown = app.getByText(new RegExp(`^(${before.map(escape).join('|')})$`));
  const seen: string[] = [];
  for (let press = 0; press < 14; press++) {
    await expect(shown).toHaveCount(1);
    const text = (await shown.innerText()).trim();
    seen.push(text);
    if (press === 0) await step('happy', 'Tonight before the birth', 'The dateline reads "Asha", the dot, "Before You", the words Review uses for these letters. The prompt is one of eight written for the weeks of waiting (the name, the home, what is hoped for), not a question about hands or the first day home. (A due date 60 days ahead, no birthday.)');
    await btn(app, 'Another thought').click();
    // the old prompt leaves (160 ms) and the new one rises in; wait for it to be the only one on screen
    await expect(app.getByText(text, { exact: true })).toHaveCount(0);
    await expect(shown).toHaveCount(1);
  }
  seen.forEach((text, i) => {
    expect(text).not.toMatch(/hands|first day home|look like today|came to meet|face do while sleeping|calms/i);
    if (i > 0) expect(text, `press ${i}`).not.toBe(seen[i - 1]);
  });
  expect(new Set(seen).size).toBeGreaterThan(3);
  await step('happy', 'Another thought, before the birth', 'Fourteen presses: each shows a different prompt from the eight, never the one that was on screen, and never a newborn one. Nothing is counted.');
});
