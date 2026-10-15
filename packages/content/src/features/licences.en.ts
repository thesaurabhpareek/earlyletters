// Settings, Licences: open-source and openly licensed work the app ships or downloads.
// Hand-kept here: the speech models (facts verified 3 Oct 2026 against the model catalogue,
// apps/mobile/src/lib/models/catalog.ts) and the language pack attributions, copied word for word
// from packs/text-rules/*.json `attribution` (test/rules.test.ts fails if a pack adds one that is
// missing here). Every bundled library, font and native module, with its full notice, is read by
// the screen from apps/mobile/src/generated/licences.json, made by scripts/licences/generate.mjs
// (`npm run licences:generate -w @scribe/mobile`, after any dependency change);
// apps/mobile/test/licences.test.ts fails when that file is missing, empty or stale.

interface Item {
  name: string;
  /** Who made it, as their licence file names them. */
  by: string;
  licence: string;
}

export const licences = {
  title: 'Licences',
  rowLabel: 'Licences',
  intro: 'This app is built with the help of open work by many people. Thank you.',
  sections: [
    {
      title: 'Writing down your words',
      items: [
        { name: 'whisper.cpp and Whisper models', by: 'Georgi Gerganov and contributors; OpenAI', licence: 'MIT License' },
        { name: 'Silero VAD', by: 'Silero', licence: 'MIT License' },
        { name: 'Belle Whisper large-v3-turbo zh', by: 'BELLE-2 (Hugging Face)', licence: 'Apache License 2.0' },
        { name: 'Whisper Hindi small', by: 'vasista22 (Hugging Face)', licence: 'Apache License 2.0' },
      ] as Item[],
    },
  ],
  /** Language pack data sources, word for word from each pack's `attribution`. */
  packsTitle: 'Language data',
  packs: [
    'Traditional and Simplified character tables derived from OpenCC (https://github.com/BYVoid/OpenCC), Copyright BYVoid and contributors, Apache License 2.0.',
    'Pinyin readings derived from pinyin-data (https://github.com/mozillazg/pinyin-data), Copyright 2016 mozillazg, MIT License, from the Unicode Han Database (Unihan) kMandarin field, Copyright Unicode, Inc., Unicode License v3.',
  ],
  /** The generated list: every library, font and native module, grouped by licence, each with its notice. */
  librariesTitle: 'Software libraries and fonts',
  librariesIntro: 'Every library, font and native module in this app, grouped by licence. Open one to read its notice as its authors wrote it.',
  /** VoiceOver hint on a library row. */
  noticeHint: 'Shows or hides the licence notice',
} as const;
