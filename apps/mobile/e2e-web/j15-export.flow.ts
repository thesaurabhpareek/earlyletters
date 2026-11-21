import { btn, firstRun, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J15] export with letters', async ({ app, record }) => {
  const step = journey(record, 'J15', 'export', 1, 'J14-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Export your book', { exact: true }).click();
  await expect(app.getByText('Export everything')).toBeVisible();
  await expect(app.getByText('Not exported yet')).toBeVisible();
  await expect(app.getByText('Save a copy of your book in Files or iCloud Drive. It is yours to keep.')).toBeVisible();
  // S43: the book's own cover at the top; the line is about the export only; the old paragraph is gone.
  await expect(app.getByTestId('export.cover')).toBeVisible();
  await expect(app.getByText('The export is made on this phone. It goes only where you send it.')).toBeVisible();
  await expect(app.getByText(/Download every letter and recording, any time, free/)).toHaveCount(0);
  await expect(app.getByText('Every letter, as text')).toBeVisible();
  await step('happy', 'Export your book', 'The book\'s own cover at the top, so the person sees what they will get. A "Last export" row ("Not exported yet" until a copy has been prepared) with one plain nudge to save a copy in Files or iCloud Drive; no notifications and no reminder. What is inside, each with its glyph: every letter as text, every recording, a printable book per child, a data file with the words as heard, every small fix and the final text. The export is made on this phone and goes only where it is sent. (Seeded fictional family Asha.)');
  await app.getByText('Export everything', { exact: true }).click();
  const failed = app.getByTestId('export.failed');
  await expect(failed.getByText('The export did not finish')).toBeVisible();
  await expect(app.getByText('Export again', { exact: true })).toBeVisible();
  await step('unhappy', 'The export did not finish', 'On a phone Export builds a ZIP in the cache and opens the iOS share sheet. The web build has no file system, so it lands on the honest failure card, with the warning mark, and "Export again". Every failure names its cause and has an action that can work: a book too big for one file leads to "Write to us" instead (a phone check).');
});

test('[J15b] export with nothing to export', async ({ app, record }) => {
  const step = journey(record, 'J15', 'export', 3, 'J15-01');
  await firstRun(app);
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Export your book', { exact: true }).click();
  await expect(btn(app, 'Export everything')).toBeDisabled();
  await expect(app.getByText('You can export once the book has a letter.')).toBeVisible();
  await step('unhappy', 'Export with an empty book', 'Nothing has been written yet, so "Export everything" waits, in the outline style, under the line "You can export once the book has a letter." The page still says what an export would hold. There is no empty-export error to reach.');
});
