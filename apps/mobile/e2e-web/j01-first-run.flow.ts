import { btn, dateInput, dayOffset, firstRun, journey, nameField, passAgeGate, startOnboarding, toChildStep } from './support/app';
import { expect, test } from './support/journey';

test('[J01] first run: the age question, the promise, the child, the signature, the first letter', async ({ app, record }) => {
  const step = journey(record, 'J01', 'first-run', 1, 'J00-open');
  await expect(app.getByText('Are you 18 or older?')).toBeVisible();
  // S01: the question, Yes, No and Continue, and nothing else: no line explaining why we ask.
  await expect(app.getByText('We ask everyone the same question.')).toHaveCount(0);
  await expect(app.getByRole('radio', { name: 'Yes' })).not.toBeChecked();
  await expect(app.getByRole('radio', { name: 'No' })).not.toBeChecked();
  await step('happy', 'The age question', 'The first screen is the launch screen\'s room: the lamp, the opening quotation pair and one neutral question, with nothing preselected. Continue waits, drawn as an outline, until the person picks Yes or No.');
  await expect(btn(app, 'Continue')).toBeDisabled();

  await app.getByRole('radio', { name: 'Yes' }).click();
  await expect(app.getByRole('radio', { name: 'Yes' })).toBeChecked();
  await step('happy', 'Yes is chosen', 'The person taps Yes. It fills softly with a check, and Continue turns on. Only a yes/no flag is stored on the phone, never an age.');
  await btn(app, 'Continue').click();

  await expect(btn(app, 'Begin the book')).toBeVisible();
  await expect(app.getByText('The baby memory book you fill by talking.')).toBeVisible();
  await expect(app.getByText('Your first two letters are free.')).toBeVisible();
  // S03: the stacked lockup is the one logo (an image named for VoiceOver); the name is never typed on the screen.
  await expect(app.getByRole('img').first()).toBeVisible();
  await step('happy', 'Welcome', 'The light rises from the gate: the stacked lockup, one serif line of what the book is, one line about the voice, and "Your first two letters are free." (D-082). One button: Begin the book. ("I already have a book" and "I was invited" sit under it in builds with sign-in; this build has server features off, so both are hidden.)');
  await expect(btn(app, 'I was invited')).toHaveCount(0);
  await expect(btn(app, 'I already have a book')).toHaveCount(0);
  await startOnboarding(app);

  // S04: a small fix, shown. The marks come from the real engine (test/promise-sample.test.ts).
  await expect(app.getByText('For example')).toBeVisible();
  await expect(app.getByTestId('promise.mark')).toHaveCount(2);
  await expect(app.getByText('We can mishear')).toHaveCount(0);
  await step('happy', 'The promise', 'One promise and one sample: "Exactly as you said it." over a sentence the engine has fixed, with its two small fixes struck through the Review way. The voice is kept on this phone, and the book is private by default.');
  await app.getByTestId('promise.mark').first().click();
  await expect(app.getByText('Put back.')).toBeVisible();
  await expect(app.getByTestId('promise.mark')).toHaveCount(1);
  await app.getByTestId('promise.undo').click();
  await expect(app.getByTestId('promise.mark')).toHaveCount(2);
  await expect(app.getByText('Word for word marks every small fix. Tap one to put it back.')).toBeVisible();

  await toChildStep(app);
  await expect(btn(app, 'Continue')).toBeDisabled();
  await expect(app.getByText('Add a name to continue.')).toBeVisible();
  await expect(app.getByText('You can add a nickname later.')).toHaveCount(0);
  await step('unhappy', 'Child step with no name', 'Nothing typed yet. Continue waits, and a quiet line above it says why: "Add a name to continue." The book cover beside the heading is blank. An empty name can never be saved.', undefined, { settle: 700 });

  // S05: a tap on the waiting Continue raises the reason with its warning mark and moves focus to the empty field.
  await btn(app, 'Continue').click({ force: true });
  await expect(app.getByTestId('onboarding.reason.raised')).toBeVisible();
  await expect(nameField(app)).toBeFocused();

  const long = 'A'.repeat(90);
  await nameField(app).fill(long);
  const kept = await nameField(app).inputValue();
  expect(kept.length).toBe(60);
  await expect(app.getByText('A name can have up to 60 characters.')).toBeVisible();
  await step('unhappy', 'A very long name stops at 60 characters, and says so', 'The person pastes 90 letters. The field keeps the first 60 and a quiet line explains the limit, so nothing is cut without a word. The cover sets the name in three lines and fades it, never an ellipsis.', 'J01-05');

  await nameField(app).fill('Asha');
  // The cover draws the name on its front (and, unseen until it opens, on its flyleaf).
  await expect(app.getByText('Asha', { exact: true }).first()).toBeVisible();
  await expect(btn(app, 'Continue')).toBeDisabled();
  await expect(app.getByText("Choose Asha's birthday to continue.")).toBeVisible();
  await expect(dateInput(app, 'Birthday')).toHaveValue('');
  await expect(app.getByText("We sort letters by Asha's month of age.")).toHaveCount(0);
  await step('unhappy', 'Name entered, no birthday chosen yet', 'The cover takes the name as typed. The date block arrives with the first letter, empty: on a phone it says "Choose a date", and "Born today" is a chip beside it. Continue waits, with a line saying what is needed. A seven-month-old can no longer be saved as "0 days" by an unseen default.', 'J01-05');

  const tomorrow = dateInput(app, 'Birthday');
  await tomorrow.fill(dayOffset(1));
  await expect(btn(app, 'Continue')).toBeDisabled();
  await expect(app.getByText('Choose today or an earlier day.')).toBeVisible();
  await step('unhappy', 'A birthday in the future', 'On the web the date can be typed; a day after today is refused in words (on a phone the picker simply does not offer it).', 'J01-05');

  await dateInput(app, 'Birthday').fill(dayOffset(-210));
  await expect(btn(app, 'Continue')).toBeEnabled();
  await step('happy', 'An older baby: the birthday is chosen', 'The person picks the real birthday (about seven months ago). Continue turns on. Letters will be filed by the baby\'s true age.', 'J01-05');

  await app.getByText('Not here yet', { exact: true }).click();
  await expect(btn(app, 'Continue')).toBeDisabled();
  await expect(app.getByText('Choose the due date to continue.')).toBeVisible();
  await expect(app.getByText('Letters written before the birth go in Before You.')).toBeVisible();
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
  await expect(app.getByText("Another child's name")).toBeVisible();
  await step('unhappy', 'A second name left empty', 'Twins or more: a second row ("Another child\'s name") and a second cover fanned behind the first. An empty second field keeps Continue waiting, and the line says to fill it in or remove it.', 'J01-07');
  await app.getByRole('button', { name: /^Remove/ }).click();

  await btn(app, 'Continue').click();
  await expect(app.getByText('What does Asha call you?')).toBeVisible();
  await expect(btn(app, 'Sign my letters')).toBeDisabled();
  await expect(app.getByText('This is how your letters will be signed.')).toHaveCount(0);
  await step('happy', 'What does Asha call you?', 'The name the child will call this parent, which signs every letter. The cover from the last step waits at the top right for its signature. Sign my letters waits until something is chosen or typed.', 'J01-07');

  await app.getByText('Mama', { exact: true }).click();
  await expect(app.getByText('From Mama').first()).toBeVisible();
  await step('happy', 'Signature chosen', 'Tapping a suggestion fills the field and signs the cover: "From Mama" on its foot line, the one preview of the signature.');

  await app.getByText('Spoken language').click();
  await expect(app.getByText('Choose a language')).toBeVisible();
  await expect(app.getByRole('radio')).toHaveCount(7);
  await step('happy', 'Choose the spoken language', 'A sheet lists the seven languages letters can be spoken in, each in its own script, with one check. Choosing one only stores it: nothing downloads from this sheet (D-087).');
  await app.getByRole('button', { name: 'Close' }).click();

  await btn(app, 'Sign my letters').click();
  await expect(app.getByText('The book is open.')).toBeVisible();
  await expect(app.getByText('Get your words ready')).toBeVisible();
  await expect(btn(app, 'Download on Wi-Fi')).toBeVisible();
  await expect(btn(app, 'Not now')).toBeVisible();
  await expect(app.getByText(/One download of \d+(\.\d)? (MB|GB), on Wi-Fi\./)).toBeVisible();
  await expect(app.getByText(/You can do this later in Settings/)).toHaveCount(0);
  await step('happy', 'The book is open, and one ask about the speech download', 'The cover opens to its flyleaf, signed "From Mama", and the light comes up. One line, then one quiet card: "Get your words ready", the real size for this phone, a bordered "Download on Wi-Fi" and "Not now". The one filled button is "Write the first one". Nothing downloads until the person taps. The download itself is native and cannot run on web; on a phone this needs a real iPhone check.');
  await btn(app, 'Not now').click();
  await expect(app.getByText('Your voice is kept either way.', { exact: true })).toBeVisible();
  await expect(btn(app, 'Download on Wi-Fi')).toHaveCount(0);
  await step('happy', 'Not now is a calm answer', 'The card folds to one line: "Your voice is kept either way." The first Review will offer the same button if words are waiting.');

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
  await expect(btn(app, 'Begin the book')).toBeVisible();
});

test('[J01d] twins: the title and the reason agree in number (S06)', async ({ app }) => {
  await passAgeGate(app);
  await startOnboarding(app);
  await toChildStep(app);
  await nameField(app).fill('Asha');
  await app.getByRole('button', { name: /Add another child/ }).click();
  await nameField(app, 1).fill('Nila');
  await btn(app, 'Born today').click();
  await btn(app, 'Continue').click();
  await expect(app.getByText('What do Asha and Nila call you?')).toBeVisible();
  await expect(app.getByText('Add what Asha and Nila call you to continue.')).toBeVisible();
});
