import { btn, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

const tab = (app: import('@playwright/test').Page, name: string) => app.getByText(name, { exact: true }).last();

test('[J08] a quiet day: "Not much today" keeps a mark with no words', async ({ app, record }) => {
  const step = journey(record, 'J08', 'quiet-day', 1, 'J04-01');
  await seeded(app);
  await expect(btn(app, 'Not much today')).toBeVisible();
  await step('happy', 'A day with little to say', 'Under Speak and Type sits a quiet link: "Not much today". Its hint says "Marks today without writing anything."');
  await btn(app, 'Not much today').click();
  await expect(app.getByText('Kept. Rest well.')).toBeVisible();
  await expect(btn(app, 'Undo')).toBeVisible();
  await step('happy', 'Kept, with no guilt', 'One line of warmth and an Undo replace the link. The app stores a mark for the day with no words at all: it never writes a sentence for the person. The mark is not counted as a letter.');
  await tab(app, 'Book').click();
  await expect(app.getByText(/'s book/).first()).toBeVisible();
  await expect(app.getByText('A quiet day')).toBeVisible();
  // No sentence, no signature, no count: the template line of older builds is gone.
  await expect(app.getByText(/ordinary day|Just Asha, and us/)).toHaveCount(0);
  await step('happy', 'A quiet day in the Book', 'The Book shows one small row, "A quiet day", with the date: muted, unsigned, not a card and not a button into a letter. It is never counted, printed or read in Read together, and it hides on any day that has a letter.');
});

test('[J08b] a second tap the same day adds nothing, and Undo removes the mark', async ({ app, record }) => {
  const step = journey(record, 'J08', 'quiet-day', 4, 'J08-02');
  await seeded(app);
  await btn(app, 'Not much today').click();
  await expect(btn(app, 'Undo')).toBeVisible();
  await btn(app, 'Undo').click();
  await expect(btn(app, 'Not much today')).toBeVisible();
  await step('unhappy', 'Undo on the kept line', 'Undo takes the mark back at once: the quiet link returns and nothing is left behind.');
  await tab(app, 'Book').click();
  await expect(app.getByText('A quiet day')).toHaveCount(0);
  await tab(app, 'Tonight').click();
  await btn(app, 'Not much today').click();
  await expect(app.getByText('Kept. Rest well.')).toBeVisible();
  await tab(app, 'Book').click();
  await expect(app.getByText('A quiet day')).toHaveCount(1);
});

test('[J08c] marks saved by older builds: the old sentence is never shown, and a mark can be removed', async ({ app, record }) => {
  const step = journey(record, 'J08', 'quiet-day', 5, 'J08-03');
  await seeded(app, 'asha-marks');
  await tab(app, 'Book').click();
  await expect(app.getByText('Month 6')).toBeVisible();
  // Two old marks exist: one on a day with a letter (hidden), one on a day without (listed).
  await expect(app.getByText('A quiet day')).toHaveCount(1);
  await expect(app.getByText(/ordinary day|Just Asha, and us/)).toHaveCount(0);
  await expect(app.getByText(/\d+ letters?/).first()).toBeVisible();
  await step('happy', 'An older quiet day, shown as a mark', 'A "Not much today" saved by an older build holds a template sentence in the old row. The Book ignores that text and shows the same small "A quiet day" row; on a day that already has a letter no mark is listed. Counts say letters only. (Seeded fictional family Asha, with older-build rows.)');
  // Long press (touch emulation) or the row's remove action; the web build exposes it as a long press.
  await app.getByText('A quiet day').click({ delay: 900 });
  await expect(app.getByText('Removed.')).toBeVisible();
  await expect(app.getByText('A quiet day')).toHaveCount(0);
  await step('unhappy', 'Remove this mark, with Undo', 'Long-press (or the VoiceOver action "Remove this mark") removes the mark and shows "Removed." with Undo, which stays until tapped or closed.');
  await btn(app, 'Undo').click();
  await expect(app.getByText('A quiet day')).toHaveCount(1);
});
