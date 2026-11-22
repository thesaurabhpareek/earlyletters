// Feature copy (moved from apps/mobile/src/**/copy.ts on 3 Oct 2026). The app keeps a one-line
// re-export in each old file so imports still work. Every string here obeys VOICE.md and is
// checked by test/rules.test.ts.
export { accountDeletionCopy } from './account-deletion.en';
export { appLockLines } from './app-lock.en';
export { authCopy } from './auth.en';
export { backupCopy } from './backup.en';
export { billingCopy } from './billing.en';
export { contentBlocksCopy } from './content-blocks.en';
export { exportCopy } from './export.en';
export { familyCopy } from './family.en';
export { findCopy } from './find.en';
export { languageCopy } from './language.en';
export { licences } from './licences.en';
export { momentsTabCopy } from './moments-tab.en';
export { newDevicePageCopy } from './new-device.en';
export { packsCopy } from './packs.en';
export { photosCopy } from './photos.en';
export { playerCopy } from './player.en';
export { reminderCopy } from './reminders.en';
export { screenStates } from './screen-states.en';
export { speechConsentCopy, speechSettingsCopy } from './speech.en';
export { languageNames, wordsCopy } from './words.en';

import { accountDeletionCopy } from './account-deletion.en';
import { appLockLines } from './app-lock.en';
import { authCopy } from './auth.en';
import { backupCopy } from './backup.en';
import { billingCopy } from './billing.en';
import { contentBlocksCopy } from './content-blocks.en';
import { exportCopy } from './export.en';
import { familyCopy } from './family.en';
import { findCopy } from './find.en';
import { languageCopy } from './language.en';
import { licences } from './licences.en';
import { momentsTabCopy } from './moments-tab.en';
import { newDevicePageCopy } from './new-device.en';
import { packsCopy } from './packs.en';
import { photosCopy } from './photos.en';
import { playerCopy } from './player.en';
import { reminderCopy } from './reminders.en';
import { screenStates } from './screen-states.en';
import { speechConsentCopy, speechSettingsCopy } from './speech.en';
import { languageNames, wordsCopy } from './words.en';

/** Every feature's copy in one object, for the rules test. */
export const features = {
  accountDeletion: accountDeletionCopy,
  appLock: appLockLines,
  auth: authCopy,
  backup: backupCopy,
  billing: billingCopy,
  contentBlocks: contentBlocksCopy,
  export: exportCopy,
  family: familyCopy,
  find: findCopy,
  language: languageCopy,
  licences,
  momentsTab: momentsTabCopy,
  newDevicePage: newDevicePageCopy,
  packs: packsCopy,
  photos: photosCopy,
  player: playerCopy,
  reminders: reminderCopy,
  screenStates,
  speech: speechSettingsCopy,
  speechConsent: speechConsentCopy,
  words: wordsCopy,
  languageNames,
} as const;
