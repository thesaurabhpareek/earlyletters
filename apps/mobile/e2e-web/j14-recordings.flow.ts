import { journey } from './support/app';
import { expect, seeded, test } from './support/journey';

test('[J14] recordings and spoken language', async ({ app, record }) => {
  const step = journey(record, 'J14', 'recordings-and-language', 1, 'J13-01');
  await seeded(app, 'asha', '/settings');
  await app.getByText('Recordings', { exact: true }).click();
  // S42: a build without backup (every web build) shows the card that is the whole truth, with Export in it, once.
  const card = app.getByTestId('recordings.card');
  await expect(card.getByText('Kept on this phone', { exact: true })).toBeVisible();
  await expect(card.getByText("Recordings are kept on this phone and in your iPhone's own backup, if you use one. Export any time to keep a copy of your own.")).toBeVisible();
  await expect(app.getByText(/Export any time to keep a copy of your own/)).toHaveCount(1);
  await expect(app.getByText(/only on this phone/i)).toHaveCount(0);
  await expect(app.getByText('Not on this phone, 575 MB')).toBeVisible();
  await step('happy', 'Recordings', 'Where the voice lives: on this phone and in the iPhone\'s own backup if there is one, said once. With backup in a build the card follows backup\'s state ("Kept on this phone and backed up" when it is on); those lines wait for counsel (C7), and build 2 has backup off. How transcription works: small fixes, marked, or word for word. The language row reads "English, Not on this phone, 575 MB"; on a phone it ends in "Download" (or "Remove" once it is here) and shows a small ring with "Getting ready, 40%" while it downloads. On web there is no model to fetch.');
});
