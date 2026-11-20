import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J14] where your letters live, your words and spoken language', async ({ app, record }) => {
  const step = journey(record, 'J14', 'recordings-and-language', 1, 'J13-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Where your letters live', { exact: true }).click();
  // settings-ia.md 4; CCO-8 and CPrivO-4: where the book is kept, and three plain recovery lines; nothing says a
  // backup or an export brings the book back.
  await expect(app.getByTestId('whereLive.onPhone')).toBeVisible();
  await expect(app.getByText('Your letters and recordings are kept on this iPhone.', { exact: true })).toBeVisible();
  await expect(app.getByText('Includes your recordings, if iCloud Backup is on.', { exact: true })).toBeVisible();
  await expect(app.getByText('Not in this version', { exact: true })).toBeVisible();
  await expect(app.getByText('An export is a copy to open and keep. We hold no copy.', { exact: true })).toBeVisible();
  await expect(app.getByText(/only on this phone|brings the book/i)).toHaveCount(0);
  await expect(app.getByText('Not on this phone, 575 MB')).toHaveCount(0);
  await step('happy', 'Where your letters live', 'On this phone: letters and recordings are kept on this iPhone. If you get a new phone: iPhone backup (includes your recordings, if iCloud Backup is on; How to check opens Apple\'s page), Export your book (Save a copy any time, or the last export date), Encrypted backup (Not in this version). Footer: an export is a copy to open and keep, and we hold no copy. No language rows and no switch here.');
  await app.goBack();

  await app.getByText('Your words', { exact: true }).click();
  await expect(app.getByText('Small fixes, marked', { exact: true })).toBeVisible();
  await expect(app.getByText('Exactly as said', { exact: true })).toBeVisible();
  await expect(app.getByText('Either way, we never rewrite your words.', { exact: true })).toBeVisible();
  await step('happy', 'Your words', 'Two named choices for new letters, each with its own line, and an example the real engine cleaned, with the words a small fix took out struck through. Either way, we never rewrite your words.');
  await app.goBack();

  await app.getByText('Storage', { exact: true }).click();
  await expect(app.getByText('Not on this phone, 575 MB')).toBeVisible();
  await step('happy', 'Storage, languages', 'Language download lives only here: the language row reads "English, Not on this phone, 575 MB"; on a phone it ends in "Download" (or "Remove" once it is here) and shows a small ring with "Getting ready, 40%" while it downloads. On web there is no model to fetch.');
});
