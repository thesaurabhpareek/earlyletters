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

test('[J04c] no usage-sharing ask in v1.0, in a later session', async ({ app, record }) => {
  const step = journey(record, 'J04', 'tonight-and-prompts', 4, 'J04-02');
  await seeded(app, 'asha', '/', { keepConsent: true });
  await expect(app.getByText('A THOUGHT TO START WITH')).toBeVisible();
  // The ask used to appear 1.2 s after a tab screen opened; wait well past that.
  await app.waitForTimeout(3000);
  await expect(btn(app, "Don't share")).toHaveCount(0);
  await step('happy', 'A later session: no usage-sharing ask', 'v1.0 collects no data (D-088, "Data Not Collected"), so the "Help us make it better?" sheet never appears and Settings, Privacy has no usage switch. Analytics returns with consent in v1.1.');
});
