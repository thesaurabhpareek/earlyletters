import { btn, firstRun, journey, passAgeGate, startOnboarding, toChildStep } from './support/app';
import { expect, test } from './support/journey';

test('[J01] first run: the age question, the promise, the child, the signature, the first letter', async ({ app, record }) => {
  const step = journey(record, 'J01', 'first-run', 1, 'J00-open');
  await expect(app.getByText('Are you 18 or older?')).toBeVisible();
  await step('happy', 'The age question', 'The first screen is one neutral question, with nothing preselected. Continue stays off until the person picks Yes or No.');
  await expect(btn(app, 'Continue')).toBeDisabled();

  await app.getByRole('radio', { name: 'Yes' }).click();
  await step('happy', 'Yes is chosen', 'The person taps Yes. Continue turns on. Only a yes/no flag is stored on the phone, never an age.');
  await btn(app, 'Continue').click();

  await expect(app.getByText('Begin the book')).toBeVisible();
  await step('happy', 'Welcome', 'The envelope, the name, one line of what the book is. Two buttons: begin, or "I was invited".');
  await startOnboarding(app);
  await step('happy', 'The promise', 'What the app does with words (tidies, never rewrites), that the voice is kept on the phone, that it can mishear, and that it is private by default.');
  await toChildStep(app);
  await expect(btn(app, 'Continue')).toBeDisabled();
  await step('unhappy', 'Child step with no name', 'Nothing typed yet. Continue is disabled, so an empty name can never be saved (there is no error message on this step, the button is simply off).');

  const long = 'A'.repeat(90);
  await app.getByRole('textbox').first().fill(long);
  const kept = await app.getByRole('textbox').first().inputValue();
  expect(kept.length).toBe(60);
  await step('unhappy', 'A very long name is cut at 60 characters', 'The person pastes 90 letters. The field keeps the first 60 and stops, so a name can never break the layout of the book. No warning is shown.', 'J01-05');

  await app.getByRole('textbox').first().fill('Asha');
  await step('happy', 'Name entered, birthday is today', 'The name is in. The birthday defaults to today; on a phone the date is a compact picker (the web build shows it as a plain date pill and cannot open the iOS picker).', 'J01-05');

  await app.getByText('Not here yet', { exact: true }).click();
  await step('happy', 'Not born yet: due date instead', 'Choosing "Not here yet" turns the date into a due date. The picker only allows dates up to 305 days ahead; a future birthday is not selectable on a phone (not testable on web, where the picker does not open).');
  await app.getByText('Birthday', { exact: true }).first().click();

  await app.getByRole('button', { name: /Add another child/ }).click();
  await step('happy', 'Add another child (twins or more)', 'A second name field appears, each with a remove button. Every book made in first run is free.', 'J01-07');
  await app.getByRole('button', { name: /^Remove/ }).click();

  await btn(app, 'Continue').click();
  await expect(app.getByText('What does Asha call you?')).toBeVisible();
  await expect(btn(app, 'Sign my letters')).toBeDisabled();
  await step('happy', 'What does Asha call you?', 'The name the child will call this parent, which signs every letter. Sign my letters is off until something is chosen or typed.', 'J01-07');

  await app.getByText('Mama', { exact: true }).click();
  await step('happy', 'Signature chosen', 'Tapping a suggestion fills the field and previews the signature in script.');

  await app.getByText('Spoken language').click();
  await expect(app.getByText('Choose a language')).toBeVisible();
  await step('happy', 'Choose the spoken language', 'A sheet lists the languages letters can be spoken in. Choosing one only starts that language\'s downloads (the download itself is native and cannot run on web).');
  await app.getByRole('button', { name: 'Close' }).click();

  await btn(app, 'Sign my letters').click();
  await expect(app.getByText('The book is open.')).toBeVisible();
  await step('happy', 'The book is open', 'A page with one line. The only action is to write the first letter.');

  await btn(app, /Write the first one/).click();
  await expect(app.getByRole('heading', { level: 1 })).toBeVisible();
  await step('happy', 'Tonight, for the first time', 'The home tab: a greeting with the signature name, one gentle prompt, Speak and Type side by side, and "Not much today" for quiet days.');
});

test('[J01b] the whole first run in one helper still lands on Tonight', async ({ app }) => {
  await firstRun(app);
  await expect(app.getByRole('heading', { level: 1 })).toBeVisible(); // the greeting changes with the hour
});

test('[J01c] the age gate answer survives a restart', async ({ app }) => {
  await passAgeGate(app);
  await app.reload();
  await expect(app.getByText('Begin the book')).toBeVisible();
});
