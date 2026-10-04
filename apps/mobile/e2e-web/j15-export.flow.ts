import { btn, firstRun, journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J15] export with letters', async ({ app, record }) => {
  const step = journey(record, 'J15', 'export', 1, 'J14-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Export your book', { exact: true }).click();
  await expect(app.getByText('Export everything')).toBeVisible();
  await expect(app.getByText('Not exported yet')).toBeVisible();
  await expect(app.getByText('Save a copy of your book in Files or iCloud Drive. It is yours to keep.')).toBeVisible();
  await step('happy', 'Export your book', 'A "Last export" row ("Not exported yet" until a copy has been prepared) with one plain nudge to save a copy in Files or iCloud Drive; no notifications and no reminder. What is inside (every letter as text, every recording, a printable book per child, a data file with the words as heard, every tidy-up and the final text) and that nothing is sent anywhere. (Seeded fictional family Asha.)');
  await app.getByText('Export everything', { exact: true }).click();
  await expect(app.getByText('The export did not finish')).toBeVisible();
  await step('unhappy', 'The export did not finish', 'On a phone Export builds a ZIP in the cache and opens the iOS share sheet. The web build has no file system, so it lands on the honest failure card with "Export again". The card says the phone needs more free space (the web has none to give).');
});

test('[J15b] export with nothing to export', async ({ app, record }) => {
  const step = journey(record, 'J15', 'export', 3, 'J15-01');
  await firstRun(app);
  await app.getByText('Book', { exact: true }).last().click();
  await app.getByRole('button', { name: 'Settings' }).click();
  await app.getByText('Export your book', { exact: true }).click();
  await expect(btn(app, 'Export everything')).toBeDisabled();
  await step('unhappy', 'Export with an empty book', 'Nothing has been written yet, so "Export everything" is switched off (greyed) and the page still says what an export would hold. There is no empty-export error to reach.');
});
