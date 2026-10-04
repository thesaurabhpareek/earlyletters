import { journey } from './support/app';
import { allowConsoleError, allowPageError, expect, seeded, test } from './support/journey';

// Fault injection: the app defines no error boundary of its own. To see what a person would see if a screen threw,
// the page makes Intl.PluralRules throw (Review pluralises its count of tidy-ups). This is the closest honest state
// to a crash and is labelled so in the step note; it is not a path a person can take.
test('[J20] a screen throws while rendering (fault injected)', async ({ app, record }) => {
  const step = journey(record, 'J20', 'crash', 1, 'J19-01');
  allowConsoleError(app, /./);
  allowPageError(app, /injected fault/);
  await seeded(app);
  await app.evaluate(() => {
    const Real = Intl.PluralRules;
    (Intl as unknown as { PluralRules: unknown }).PluralRules = function (...a: unknown[]) {
      throw new Error('injected fault');
      return new (Real as unknown as new (...x: unknown[]) => object)(...a);
    };
  });
  await app.getByText('Read it back').first().click();
  await app.waitForTimeout(1500);
  await step('unhappy', 'A screen crashes (fault injected)', 'The app registers no error boundary of its own, and the page is left blank: no message, no way back (the text list is empty on purpose). Reached only by injecting a fault (Intl.PluralRules made to throw before opening Review); no normal action gets here. Worth a calm, designed fallback screen before launch.');
  await expect(app.getByText('Read it back')).toHaveCount(0);
});
