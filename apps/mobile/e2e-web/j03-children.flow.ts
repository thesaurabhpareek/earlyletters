import { btn, journey, passAgeGate, startOnboarding, toChildStep } from './support/app';
import { expect, test } from './support/journey';

test('[J03] more than one child: twins in first run, the switcher, settings, and the Plus gate for another book', async ({ app, record }) => {
  const step = journey(record, 'J03', 'children-and-books', 1, 'J01-06');
  await passAgeGate(app);
  await startOnboarding(app);
  await toChildStep(app);
  await app.getByRole('textbox').first().fill('Asha');
  await app.getByRole('button', { name: /Add another child/ }).click();
  await app.getByRole('textbox').nth(1).fill('Dev');
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
  await expect(app.getByText(/Dev/).first()).toBeVisible();
  await step('happy', 'Whose book? sheet', 'A sheet lists every book on this phone with the current one marked. Choosing one switches Tonight, Book and writing to that child.');
  await app.getByRole('button', { name: 'Close' }).first().click({ force: true });
  await expect(app.getByText('Whose book?')).toBeHidden();

  await app.getByRole('button', { name: 'Settings' }).click();
  await expect(app.getByText('Add a child').last()).toBeVisible();
  await step('happy', 'Settings, with both children listed', 'Each child has a row; "Add a child" sits below them.');
  await app.getByText('Asha', { exact: true }).first().click();
  await expect(app.getByText(/Birthday|Due date/).first()).toBeVisible();
  await step('happy', 'One child\'s settings', 'Name, date, signature, a reminders switch, the co-parent row ("Soon") and a "Family can read" switch that stays off in v1.0. Hide this book is offered because there is more than one (its confirm dialog is native and does not appear on web).');
  await app.goBack();
  await app.getByText('Add a child', { exact: true }).last().click();
  await expect(app.getByText('Who is this book for?')).toBeVisible();
  await expect(app.getByText('Another book is part of Plus')).toHaveCount(0);
  await step('happy', 'Another book is free', 'Starting a book for another child opens the same page as the first, with no Plus gate (D-082, D-083): the first two letters are one pool across every book, and the gate is at Keep, not here.');
  await app.goBack();
  await expect(app.getByText('Add a child').last()).toBeVisible();
  await step('happy', 'Back to Settings', 'Leaving the page changes nothing and goes back.');
});
