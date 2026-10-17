import { btn, journey } from './support/app';
import { expect, seeded, test } from './support/journey';
import type { Page } from '@playwright/test';

const tab = (app: Page, name: string) => app.getByText(name, { exact: true }).last();

/** Saturday 17 October 2026 on this machine's clock, at an evening hour (greeting "Good evening") or a morning one. */
const EVENING = new Date(2026, 9, 17, 19, 30);
const MORNING = new Date(2026, 9, 17, 9, 30);

/** Tonight's lamp level: the opacity of the layer that holds its gradient (the breath sits on a wrapper above it). */
const lampLevel = (app: Page) =>
  app.evaluate(() => {
    const svg = document.querySelector('radialGradient')?.closest('svg');
    const layer = svg?.parentElement;
    return layer ? Number(getComputedStyle(layer).opacity) : null;
  });

/** The colour a piece of text is drawn in. */
const colorOf = (app: Page, text: string | RegExp) => app.getByText(text).first().evaluate((el) => getComputedStyle(el).color);

test('[J08] a quiet day: "Not much today" keeps a mark with no words', async ({ app, record }) => {
  const step = journey(record, 'J08', 'quiet-day', 1, 'J04-01');
  await app.clock.setFixedTime(EVENING);
  await seeded(app);
  await expect(btn(app, 'Not much today')).toBeVisible();
  await step('happy', 'A day with little to say', 'Under Speak and Type sits a quiet link: "Not much today". Its hint says "Marks today without writing anything."');
  await app.waitForTimeout(1500);
  const lit = await lampLevel(app);
  await btn(app, 'Not much today').click();
  await expect(app.getByText('A quiet day, kept.')).toBeVisible();
  await expect(btn(app, 'Undo')).toBeVisible();
  // The line is in the reading colour, the greeting's own `text`, never success green (S33).
  expect(await colorOf(app, 'A quiet day, kept.')).toBe(await colorOf(app, /^Good evening, Mama\.$/));
  // Lights down: in the evening the lamp eases to 70 percent of its level over 1.2 s.
  await app.waitForTimeout(1600);
  expect(lit).toBeCloseTo(1, 2);
  expect(await lampLevel(app)).toBeCloseTo(0.7, 2);
  await step('happy', 'Kept, with no guilt', 'The link gives way to the Moon and one line, "A quiet day, kept.", with Undo beside it, and in the evening the lamp lowers to 70 percent: lights down. The app stores a mark for the day with no words at all: it never writes a sentence for the person. The mark is not counted as a letter.');
  await tab(app, 'Book').click();
  await expect(app.getByText(/'s book/).first()).toBeVisible();
  await expect(app.getByText('A quiet day')).toBeVisible();
  // No sentence, no signature, no count: the template line of older builds is gone.
  await expect(app.getByText(/ordinary day|Just Asha, and us/)).toHaveCount(0);
  await step('happy', 'A quiet day in the Book', 'The Book shows one small row, "A quiet day", with the date: muted, unsigned, not a card and not a button into a letter. It is never counted, printed or read in Read together, and it hides on any day that has a letter.');
});

test('[J08b] Undo restores the link and the lamp; a second tap the same day adds nothing', async ({ app, record }) => {
  const step = journey(record, 'J08', 'quiet-day', 4, 'J08-02');
  await app.clock.setFixedTime(EVENING);
  await seeded(app);
  await app.waitForTimeout(1500);
  await btn(app, 'Not much today').click();
  await expect(btn(app, 'Undo')).toBeVisible();
  await app.waitForTimeout(1600);
  expect(await lampLevel(app)).toBeCloseTo(0.7, 2);
  await btn(app, 'Undo').click();
  await expect(btn(app, 'Not much today')).toBeVisible();
  await expect(app.getByText('A quiet day, kept.')).toHaveCount(0);
  await app.waitForTimeout(1600);
  expect(await lampLevel(app)).toBeCloseTo(1, 2);
  await step('unhappy', 'Undo on the kept line', 'Undo takes the mark back at once: the quiet link returns, the lamp comes back up, and nothing is left behind.');
  await tab(app, 'Book').click();
  await expect(app.getByText('A quiet day')).toHaveCount(0);
  await tab(app, 'Tonight').click();
  await btn(app, 'Not much today').click();
  await expect(app.getByText('A quiet day, kept.')).toBeVisible();
  await tab(app, 'Book').click();
  await expect(app.getByText('A quiet day')).toHaveCount(1);
  // Leaving Tonight takes the line away; the mark stays, and a second tap adds nothing.
  await tab(app, 'Tonight').click();
  await expect(btn(app, 'Not much today')).toBeVisible();
  await btn(app, 'Not much today').click();
  await tab(app, 'Book').click();
  await expect(app.getByText('A quiet day')).toHaveCount(1);
});

test('[J08d] in the morning the light stays; with Reduce Motion the evening light goes down at once', async ({ app }) => {
  await app.clock.setFixedTime(MORNING);
  await seeded(app);
  await app.waitForTimeout(1500);
  await btn(app, 'Not much today').click();
  await expect(app.getByText('A quiet day, kept.')).toBeVisible();
  await app.waitForTimeout(1600);
  expect(await lampLevel(app)).toBeCloseTo(1, 2);

  await app.emulateMedia({ reducedMotion: 'reduce' });
  await app.clock.setFixedTime(EVENING);
  await app.reload();
  await expect(btn(app, 'Not much today')).toBeVisible();
  // The morning's mark is today's: the evening room opens with its lights already down.
  expect(await lampLevel(app)).toBeCloseTo(0.7, 2);
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
