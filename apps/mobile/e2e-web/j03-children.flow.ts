import { btn, dateInput, journey, passAgeGate, startOnboarding, toChildStep } from './support/app';
import { expect, test } from './support/journey';

test('[J03] more than one child: twins in first run, the switcher, settings, and the Plus gate for another book', async ({ app, record }) => {
  const step = journey(record, 'J03', 'children-and-books', 1, 'J01-06');
  await passAgeGate(app);
  await startOnboarding(app);
  await toChildStep(app);
  await app.getByRole('textbox').first().fill('Asha');
  await btn(app, 'Born today').click();
  await app.getByRole('button', { name: /Add another child/ }).click();
  await app.getByRole('textbox').nth(1).fill('Nila');
  await step('happy', 'Two names in first run', 'Twins or more: each name gets a field and a remove button. All books made here are free; they share the date.');
  await btn(app, 'Continue').click();
  await expect(app.getByText(/call you/)).toBeVisible();
  await step('happy', 'One signature for both', 'The title asks what both children call the parent, so one signature covers every book made here.');
  await app.getByText('Mama', { exact: true }).click();
  await btn(app, 'Sign my letters').click();
  await expect(app.getByText('The book is open.')).toBeVisible();
  await step('happy', 'The book is open, for two', 'The closing screen names both children.');
  await btn(app, /Write the first one/).click();
  await expect(app.getByRole('heading', { level: 1 })).toBeVisible();

  await app.getByText('Book', { exact: true }).last().click();
  await expect(app.getByText(/'s book/).first()).toBeVisible();
  await step('happy', 'The Book tab, empty, with a child switcher', 'The first book is open. A small switcher at the top left lets the person move between the two books.');
  await app.getByRole('button', { name: /Asha/ }).first().click();
  await expect(app.getByText(/Nila/).first()).toBeVisible();
  await step('happy', 'Whose book? sheet', 'A sheet lists every book on this phone with the current one marked. Choosing one switches Tonight, Book and writing to that child.');
  await app.getByRole('button', { name: 'Close' }).first().click({ force: true });
  await expect(app.getByText('Whose book?')).toBeHidden();

  await app.getByRole('button', { name: 'Settings' }).click();
  await expect(app.getByText('Add a child').last()).toBeVisible();
  await step('happy', 'Settings, with both children listed', 'Each child has a row; "Add a child" sits below them.');
  // The row on Settings home (a hidden "Asha" on the Book's cover under the stack also matches by text).
  await app.getByRole('button', { name: 'Asha', exact: true }).click();
  await expect(app.getByText(/Birthday|Due date/).first()).toBeVisible();
  await expect(btn(app, 'Hide this book')).toBeVisible();
  await expect(app.getByText("Hiding Asha's book quiets every reminder and message about Asha. Nothing is deleted.")).toBeVisible();
  await step('happy', 'One child\'s settings', 'Name, date, signature, a reminders switch, and the co-parent row ("Coming soon"). The "Family can read" switch is hidden in v1.0 because it cannot be turned on. "Hide this book" is offered because there is more than one, in the plain text colour: nothing is deleted (its confirm dialog is native and does not appear on web).');
  await app.goBack();
  await app.getByText('Add a child', { exact: true }).last().click();
  await expect(app.getByText('Who is this book for?')).toBeVisible();
  await expect(app.getByText('Another book is part of Plus')).toHaveCount(0);
  // S47: nothing is chosen for the person. No date until a name is in, the primary waits with its reason in words.
  await expect(app.locator('input[type="date"]')).toHaveCount(0);
  await expect(btn(app, 'Add this book')).toBeDisabled();
  await expect(app.getByText('Add a name to continue.')).toBeVisible();
  await step('happy', 'Another book is free', 'Starting a book for another child opens the same step as first run, with no Plus gate (D-082, D-083): the first two letters are one pool across every book, and the gate is at Keep, not here. Nothing is chosen for the person: "Add this book" waits, and the line above it says why.');
  await app.getByRole('textbox').first().fill('Ravi');
  await expect(dateInput(app, 'Birthday')).toHaveValue('');
  await expect(app.getByText("Choose Ravi's birthday to continue.")).toBeVisible();
  await expect(btn(app, "Add Ravi's book")).toBeDisabled();
  await step('happy', 'Add a child starts with no date', 'The birthday starts empty, so a seven-month-old is never saved as a newborn by a default nobody saw. "Born today" is a chip beside the date, one tap. The small book cover takes the name.');
  await btn(app, 'Born today').click();
  await expect(btn(app, "Add Ravi's book")).toBeEnabled();
  await expect(app.getByText("Choose Ravi's birthday to continue.")).toHaveCount(0);
  await app.goBack();
  await expect(app.getByText('Add a child').last()).toBeVisible();
  await step('happy', 'Back to Settings', 'Leaving the page adds nothing and goes back.');
});
