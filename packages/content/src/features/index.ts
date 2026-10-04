// Feature copy (moved from apps/mobile/src/**/copy.ts on 3 Oct 2026). The app keeps a one-line
// re-export in each old file so imports still work. Every string here obeys VOICE.md and is
// checked by test/rules.test.ts.
export { accountDeletionCopy } from './account-deletion.en';
export { authCopy } from './auth.en';
export { billingCopy } from './billing.en';
export { contentBlocksCopy } from './content-blocks.en';
export { exportCopy } from './export.en';
export { familyCopy } from './family.en';
export { languageCopy } from './language.en';
export { licences } from './licences.en';
export { packsCopy } from './packs.en';
export { playerCopy } from './player.en';
export { reminderCopy } from './reminders.en';
export { speechSettingsCopy } from './speech.en';
export { languageNames, wordsCopy } from './words.en';

import { accountDeletionCopy } from './account-deletion.en';
import { authCopy } from './auth.en';
import { billingCopy } from './billing.en';
import { contentBlocksCopy } from './content-blocks.en';
import { exportCopy } from './export.en';
import { familyCopy } from './family.en';
import { languageCopy } from './language.en';
import { licences } from './licences.en';
import { packsCopy } from './packs.en';
import { playerCopy } from './player.en';
import { reminderCopy } from './reminders.en';
import { speechSettingsCopy } from './speech.en';
import { languageNames, wordsCopy } from './words.en';

/** Every feature's copy in one object, for the rules test. */
export const features = {
  accountDeletion: accountDeletionCopy,
  auth: authCopy,
  billing: billingCopy,
  contentBlocks: contentBlocksCopy,
  export: exportCopy,
  family: familyCopy,
  language: languageCopy,
  licences,
  packs: packsCopy,
  player: playerCopy,
  reminders: reminderCopy,
  speech: speechSettingsCopy,
  words: wordsCopy,
  languageNames,
} as const;
