// Settings, Licences: open-source and openly licensed work the app ships or downloads.
// The list itself is generated: apps/mobile/src/generated/licences.json, made by
// `npm run licences:generate -w @scribe/mobile` from package-lock.json and the table of what ships
// in the iOS app (scripts/licences/components.mjs), and read through apps/mobile/src/lib/licences.ts.
// This file holds only the words around it: the page intro, one title and line per theme (the
// theme ids are components.mjs THEMES), and the language pack attributions, copied word for word
// from packs/text-rules/*.json `attribution` (test/rules.test.ts fails if a pack adds one that is
// missing here).

export const licences = {
  // US spelling on screen (D-087); the object and file keep their names so imports stay stable.
  title: 'Licenses',
  rowLabel: 'Licenses',
  intro: 'This app is built with the help of open work by many people. Thank you.',
  /** One group per theme, in this order (scripts/licences/components.mjs THEMES); each title has one line on what it is for. */
  themes: {
    speech: { title: 'Speech', line: 'Listens to your recording on this phone and sets down your words as you said them.' },
    recording: { title: 'Recording and audio', line: 'Records your voice and plays it back.' },
    look: { title: 'Look and feel', line: 'Type, icons, color, motion and touch.' },
    framework: { title: 'App framework', line: 'React Native and Expo, the screens and moving between them.' },
    storage: { title: 'Storage and data', line: 'The database, files, exports and encryption.' },
    account: { title: 'Signing in', line: 'Sign in with Apple, Google or a passkey, and your account.' },
    other: { title: 'Everything else', line: 'Reminders and the small building blocks the rest relies on.' },
  },
  /** Language pack data sources, word for word from each pack's `attribution`. */
  packsTitle: 'Language data',
  packsLine: 'Tables for Chinese characters and their readings.',
  packs: [
    'Traditional and Simplified character tables derived from OpenCC (https://github.com/BYVoid/OpenCC), Copyright BYVoid and contributors, Apache License 2.0.',
    'Pinyin readings derived from pinyin-data (https://github.com/mozillazg/pinyin-data), Copyright 2016 mozillazg, MIT License, from the Unicode Han Database (Unihan) kMandarin field, Copyright Unicode, Inc., Unicode License v3.',
  ],
  // The notices themselves come from apps/mobile/src/lib/licences.ts (generated), not from copy.
  libraries: 'React Native, Expo and the other libraries in this app are open source. Each one is listed below with its license.',
  /** Under a row, when it is open: its version, then its copyright lines and full license text. */
  version: 'Version {version}',
  /** For an entry whose package states no license (none today; the generator flags it for review). */
  licenceUnknown: 'License not stated',
  /** For an entry published without a license text (none today; the generator flags it for review). */
  noText: 'No license text was published with this one.',
} as const;
