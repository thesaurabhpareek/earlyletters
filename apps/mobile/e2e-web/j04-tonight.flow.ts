import { btn, firstRun, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J04] Tonight: the prompt, another thought, a letter waiting to be read back', async ({ app, record }) => {
  const step = journey(record, 'J04', 'tonight-and-prompts', 1, 'J01-14');
  await seeded(app);
  await expect(app.getByText('A THOUGHT TO START WITH')).toBeVisible();
  await step('happy', 'Tonight with a letter waiting', 'With a recording waiting on Review, a quiet card says so above Speak and Type. (Seeded fictional family Asha, 7 months.)');
  const before = await app.locator('body').innerText();
  await btn(app, 'Another thought').click();
  await app.waitForTimeout(400);
  const after = await app.locator('body').innerText();
  expect(after).not.toEqual(before);
  await step('happy', 'Another thought', 'The prompt card swaps for a different one in place. There is no limit and nothing is counted.');
});

test('[J04b] a brand new book on Tonight, day 0', async ({ app, record }) => {
  const step = journey(record, 'J04', 'tonight-and-prompts', 3, 'J04-02');
  await firstRun(app);
  await expect(app.getByText('A THOUGHT TO START WITH')).toBeVisible();
  await step('happy', 'Tonight on day 0', 'A new book: the dateline reads "Asha, 0 days", no waiting card, one prompt chosen for a newborn.');
});

test('[J04c] the usage-sharing ask, in a later session', async ({ app, record }) => {
  const step = journey(record, 'J04', 'tonight-and-prompts', 4, 'J04-02');
  await seeded(app, 'asha', '/', { keepConsent: true });
  await expect(btn(app, "Don't share")).toBeVisible();
  await step('happy', 'A later session: "Help us make it better?"', 'Never in the first session. On a later session with at least one letter, a calm sheet asks once whether to share which screens are opened and when something crashes, never any words, recordings or names. "Don\'t share" and "Share usage" are equal; closing it without choosing asks at most once more. (Shown on a tab screen only, 1.2 seconds after it opens.)');
  await btn(app, "Don't share").click();
  await expect(btn(app, "Don't share")).toBeHidden();
  await step('happy', 'Declined: nothing else changes', 'Saying no ends the asking for good and changes nothing else; it can be changed in Settings, Privacy.');
});
