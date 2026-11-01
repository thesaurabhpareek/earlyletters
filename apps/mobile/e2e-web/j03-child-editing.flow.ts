import { btn, dateInput, dayOffset, firstRun, journey, passAgeGate, startOnboarding, toChildStep } from './support/app';
import { expect, test } from './support/journey';
import type { Page } from '@playwright/test';

/** Settings > Asha's book, from Tonight. */
async function openChildSettings(app: Page, name: string) {
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  // The row on Settings home (a hidden "Asha" on the Book's cover under the stack also matches by text).
  await app.getByRole('button', { name, exact: true }).click();
  await expect(app.getByText(/Birthday|Due date/).first()).toBeVisible();
}

test('[J03b] correct a name, a signature and a birthday after first run', async ({ app, record }) => {
  const step = journey(record, 'J03', 'children-and-books', 20, 'J03-07');
  await firstRun(app, 'Asha');
  await openChildSettings(app, 'Asha');
  await step('happy', 'Child settings: every detail row opens', 'Name, birthday and "Sign my letters to Asha as" each open to change. Before this they were read-only.');

  await app.getByText('Name', { exact: true }).click();
  const name = app.getByRole('textbox', { name: 'Name' });
  await name.fill('   ');
  await expect(app.getByText('Add a name to save.')).toBeVisible();
  await expect(btn(app, 'Save')).toBeDisabled();
  await step('unhappy', 'An empty name', 'Save stays off and a line says why: "Add a name to save." A book can never lose its name.');

  await name.fill('B'.repeat(80));
  expect((await name.inputValue()).length).toBe(60);
  await expect(app.getByText('Up to 60 characters.')).toBeVisible();
  await step('unhappy', 'A very long name', 'The field stops at 60 and says so softly; nothing is cut without a word.');

  await name.fill('  Asha Rose ');
  await btn(app, 'Save').click();
  await expect(app.getByText('Asha Rose', { exact: true }).last()).toBeVisible();
  await step('happy', 'Name changed (trimmed)', 'The new name shows in the row and in the title. Letters already written are not touched.');

  await app.getByText(/^Sign my letters to Asha Rose as/).click();
  const sign = app.getByRole('textbox', { name: /Sign my letters to Asha Rose as/ });
  await sign.fill('');
  await expect(app.getByText('Add what Asha Rose calls you to save.')).toBeVisible();
  await expect(btn(app, 'Save')).toBeDisabled();
  await step('unhappy', 'An empty signature', 'Save stays off with a line saying what is missing.');
  await sign.fill('Papa');
  await expect(app.getByText('Letters already written keep their signature.')).toBeVisible();
  await btn(app, 'Save').click();
  await expect(app.getByText('Papa', { exact: true })).toBeVisible();
  await step('happy', 'Signature changed', 'New letters are signed Papa. Letters already written keep the signature they were written with.');

  await app.getByText('Birthday', { exact: true }).first().click();
  await dateInput(app, 'Birthday').fill(dayOffset(3));
  await expect(app.getByText('Choose today or an earlier day.')).toBeVisible();
  await expect(btn(app, 'Save')).toBeDisabled();
  await step('unhappy', 'A birthday in the future', 'Refused in words; Save stays off.');
  await dateInput(app, 'Birthday').fill(dayOffset(-210));
  await btn(app, 'Save').click();
  await expect(app.getByText('Birthday').first()).toBeVisible();
  await step('happy', 'Birthday corrected', 'A baby who was saved as born today is now about seven months old; letters are filed by the true age from here on.');
});

test('[J03c] a due date becomes a birthday', async ({ app, record }) => {
  const step = journey(record, 'J03', 'children-and-books', 30, 'J03-07');
  await passAgeGate(app);
  await startOnboarding(app);
  await toChildStep(app);
  await app.getByRole('textbox').first().fill('Asha');
  await app.getByText('Not here yet', { exact: true }).click();
  await dateInput(app, 'Due date').fill(dayOffset(10));
  await btn(app, 'Continue').click();
  await app.getByText('Mama', { exact: true }).click();
  await btn(app, 'Sign my letters').click();
  await btn(app, /Write the first one/).click();
  await expect(app.getByRole('heading', { level: 1 })).toBeVisible();

  await openChildSettings(app, 'Asha');
  await expect(app.getByText('Due date').first()).toBeVisible();
  await expect(app.getByText("Asha's birthday")).toHaveCount(0);
  await step('happy', 'Before the due date: no offer', 'While the due date is still ahead, settings show the due date and nothing else is asked.');

  // Twenty days on, the due date has gone by.
  await app.clock.setFixedTime(new Date(Date.now() + 20 * 864e5));
  await app.reload();
  // The reload keeps the route: still on Asha's settings.
  await expect(app.getByText(/Birthday|Due date/).first()).toBeVisible();
  const card = app.getByTestId('child.bornCard');
  await expect(card.getByText("Asha's birthday")).toBeVisible();
  await expect(card.getByText('Add it when you are ready.')).toBeVisible();
  await expect(app.getByText(/was born/)).toHaveCount(0);
  await step('happy', 'After the due date: a gentle card', 'One quiet card: "Asha\'s birthday. Add it when you are ready." with "Set the birthday" and "Hide". A passed due date can be hard news, so it never says Asha was born, never celebrates and never counts days. It is never a notification and never on Tonight.');

  await card.getByRole('button', { name: 'Hide' }).click();
  await expect(app.getByTestId('child.bornCard')).toHaveCount(0);
  await step('happy', 'The card, hidden', '"Hide" puts the card away on this phone until the Due date row is opened again.');
  await app.getByText('Due date', { exact: true }).first().click();
  await expect(app.getByTestId('child.bornCard')).toBeVisible();
  await btn(app, 'Cancel').click();

  await app.getByTestId('child.bornCard.set').click();
  await expect(btn(app, 'Set the birthday')).toBeDisabled();
  await dateInput(app, "Asha's birthday").fill(dayOffset(5, new Date(Date.now() + 20 * 864e5)));
  await expect(app.getByText('Choose today or an earlier day.')).toBeVisible();
  await expect(btn(app, 'Set the birthday')).toBeDisabled();
  await step('unhappy', 'A birthday that has not come yet', 'Refused in words; the button stays off. Letters written before the birthday stay in Before You.');

  await dateInput(app, "Asha's birthday").fill(dayOffset(10 - 20 + 2));
  await btn(app, 'Set the birthday').click();
  await expect(app.getByTestId('child.bornCard')).toHaveCount(0);
  await expect(app.getByText('Due date')).toBeHidden();
  await expect(app.getByText('Birthday').first()).toBeVisible();
  await step('happy', 'Birthday set', 'The due date is replaced by the birthday; the card is gone. The child and every letter keep their place.');
});
