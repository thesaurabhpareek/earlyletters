import { journey } from './support/app';
import { allowConsoleError, allowPageError, expect, seeded, test } from './support/journey';

// Fault injection: to see what a person would see if a screen threw, the page makes Intl.PluralRules throw (Review
// pluralises its count of tidy-ups). This is the closest honest state to a crash and is labelled so in the step note;
// it is not a path a person can take.
test('[J20] a screen throws while rendering (fault injected)', async ({ app, record }) => {
  const step = journey(record, 'J20', 'crash', 1, 'J19-01');
  allowConsoleError(app, /./);
  allowPageError(app, /injected fault/);
  await seeded(app);
  await app.evaluate(() => {
    const w = window as unknown as { __RealPluralRules?: unknown };
    const Real = Intl.PluralRules;
    w.__RealPluralRules = Real;
    (Intl as unknown as { PluralRules: unknown }).PluralRules = function () {
      throw new Error('injected fault');
    };
  });
  await app.getByText('Read it back').first().click();

  // The root error boundary: calm words, two ways forward, nothing technical.
  await expect(app.getByText('Something went wrong on our side')).toBeVisible();
  await expect(app.getByText(/safe on this phone/)).toBeVisible();
  await expect(app.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(app.getByRole('button', { name: 'Go to Tonight' })).toBeVisible();
  await expect(app.getByText(/injected fault|stack|at Object|Error:/i)).toHaveCount(0);
  const bg = await app.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(251, 248, 243)'); // the page colour (token bg), never white
  await step('unhappy', 'A screen crashes (fault injected)', 'The root error boundary shows a calm screen instead of a blank page: "Something went wrong on our side. Your letters and recordings are safe on this phone." with Try again and Go to Tonight. No error text, code or stack is shown or logged. Reached only by injecting a fault (Intl.PluralRules made to throw before opening Review); no normal action gets here.');

  // Go to Tonight works even though the screen that threw is still broken.
  await app.getByRole('button', { name: 'Go to Tonight' }).click();
  await expect(app.getByRole('button', { name: 'Speak' })).toBeVisible();
});

test('[J20] the book cannot be opened at launch (fault injected)', async ({ app, record }) => {
  const step = journey(record, 'J20', 'crash', 2, 'J20-01');
  allowConsoleError(app, /./);
  const base = process.env.E2E_WEB_SEED_URL;
  // Preview-only switch (src/lib/resilience/launch-fault.web.ts): the first open of the database fails, Try again works.
  await app.goto(`${base}/?seed=asha&fault=launch-once`);
  await expect(app.getByText('We could not open your book just now')).toBeVisible();
  await expect(app.getByText(/safe on this phone/)).toBeVisible();
  await expect(app.getByText(/nothing will be unless you choose it/i)).toBeVisible();
  await expect(app.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(app.getByRole('button', { name: "Export what's readable" })).toBeVisible();
  // Nothing on this screen deletes, resets or rebuilds anything.
  await expect(app.getByRole('button', { name: /delete|reset|erase|start over|remove/i })).toHaveCount(0);
  await step('unhappy', 'The book cannot be opened (fault injected)', 'If opening the database or updating it throws, a recovery screen replaces the app: the letters are safe on the phone, nothing is removed, and there are two actions: Try again and Export what\'s readable. No delete, reset or rebuild exists here. Reached only by a preview-only switch (?fault=launch-once); on a phone it follows a failed database open or update.');

  await app.getByRole('button', { name: 'Try again' }).click();
  await expect(app.getByRole('button', { name: 'Speak' }).or(app.getByText('Begin the book')).first()).toBeVisible();
});
