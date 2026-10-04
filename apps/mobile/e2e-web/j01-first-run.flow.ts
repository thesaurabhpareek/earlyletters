import { btn, dateInput, dayOffset, firstRun, journey, passAgeGate, startOnboarding, toChildStep } from './support/app';
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
  await expect(app.getByText('Add a name to continue.')).toBeVisible();
  await step('unhappy', 'Child step with no name', 'Nothing typed yet. Continue is off and a line above it says why: "Add a name to continue." An empty name can never be saved.', undefined, { settle: 700 });

  const long = 'A'.repeat(90);
  await app.getByRole('textbox').first().fill(long);
  const kept = await app.getByRole('textbox').first().inputValue();
  expect(kept.length).toBe(60);
  await expect(app.getByText('A name can have up to 60 characters.')).toBeVisible();
  await step('unhappy', 'A very long name stops at 60 characters, and says so', 'The person pastes 90 letters. The field keeps the first 60 and a quiet line explains the limit, so nothing is cut without a word. The limit is the same one the book and the server use.', 'J01-05');

  await app.getByRole('textbox').first().fill('Asha');
  await expect(btn(app, 'Continue')).toBeDisabled();
  await expect(app.getByText("Choose Asha's birthday to continue.")).toBeVisible();
  await expect(dateInput(app, 'Birthday')).toHaveValue('');
  await step('unhappy', 'Name entered, no birthday chosen yet', 'The birthday is not filled in for the person: the date row is empty (on a phone it says "Choose a date") and Continue waits, with a line saying what is needed. A seven-month-old can no longer be saved as "0 days" by an unseen default. "Born today" is one tap for a newborn.', 'J01-05');

  const tomorrow = dateInput(app, 'Birthday');
  await tomorrow.fill(dayOffset(1));
  await expect(btn(app, 'Continue')).toBeDisabled();
  await expect(app.getByText('A birthday is a day that has already come. Choose today or earlier.')).toBeVisible();
  await step('unhappy', 'A birthday in the future', 'On the web the date can be typed; a day after today is refused in words (on a phone the picker simply does not offer it).', 'J01-05');

  await dateInput(app, 'Birthday').fill(dayOffset(-210));
  await expect(btn(app, 'Continue')).toBeEnabled();
  await step('happy', 'An older baby: the birthday is chosen', 'The person picks the real birthday (about seven months ago). Continue turns on. Letters will be filed by the baby\'s true age.', 'J01-05');

  await app.getByText('Not here yet', { exact: true }).click();
  await expect(btn(app, 'Continue')).toBeDisabled();
  await expect(app.getByText('Choose the due date to continue.')).toBeVisible();
  await step('unhappy', 'Not born yet: due date not chosen', 'Choosing "Not here yet" turns the date into a due date, which is not filled in either. Continue waits and says why.');
  await dateInput(app, 'Due date').fill(dayOffset(400));
  await expect(btn(app, 'Continue')).toBeDisabled();
  await expect(app.getByText('Choose a due date from today up to ten months ahead.')).toBeVisible();
  await step('unhappy', 'A due date too far ahead', 'A due date can be at most 305 days away, the same range the phone picker offers.');
  await dateInput(app, 'Due date').fill(dayOffset(60));
  await expect(btn(app, 'Continue')).toBeEnabled();
  await app.getByText('Birthday', { exact: true }).first().click();

  await app.getByRole('button', { name: /Add another child/ }).click();
  await expect(btn(app, 'Continue')).toBeDisabled();
  await expect(app.getByText('Fill in or remove this name to continue.')).toBeVisible();
  await step('unhappy', 'A second name left empty', 'Twins or more: an empty second field keeps Continue off, and the line says to fill it in or remove it.', 'J01-07');
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
  await expect(btn(app, 'Not much today')).toBeVisible();
});

test('[J01c] the age gate answer survives a restart', async ({ app }) => {
  await passAgeGate(app);
  await app.reload();
  await expect(app.getByText('Begin the book')).toBeVisible();
});
