// Settings, Licences: open-source and openly licensed work the app ships or downloads.
// Facts verified 3 Oct 2026 from each LICENSE or OFL file in the repo and the model catalogue
// (apps/mobile/src/lib/models/catalog.ts). Pack attributions are copied word for word from
// packs/text-rules/*.json `attribution`; test/rules.test.ts fails if a pack adds one that is
// missing here. The full list of npm libraries is generated at release (BL request in the report).

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
      title: 'Fonts',
      items: [
        { name: 'Literata', by: 'The Literata Project Authors', licence: 'SIL Open Font License 1.1' },
        { name: 'Mukta', by: 'Girish Dalvi, Ek Type', licence: 'SIL Open Font License 1.1' },
        { name: 'Tiro Devanagari Hindi', by: 'The Indigo Project Authors, Tiro Typeworks', licence: 'SIL Open Font License 1.1' },
      ] as Item[],
    },
    {
      title: 'Writing down your words',
      items: [
        { name: 'whisper.cpp and Whisper models', by: 'Georgi Gerganov and contributors; OpenAI', licence: 'MIT License' },
        { name: 'Silero VAD', by: 'Silero', licence: 'MIT License' },
        { name: 'Belle Whisper large-v3-turbo zh', by: 'BELLE-2 (Hugging Face)', licence: 'Apache License 2.0' },
        { name: 'Whisper Hindi small', by: 'vasista22 (Hugging Face)', licence: 'Apache License 2.0' },
      ] as Item[],
    },
    {
      title: 'Icons',
      items: [{ name: 'Phosphor Icons', by: 'Phosphor Icons', licence: 'MIT License' }] as Item[],
    },
  ],
  /** Language pack data sources, word for word from each pack's `attribution`. */
  packsTitle: 'Language data',
  packs: [
    'Traditional and Simplified character tables derived from OpenCC (https://github.com/BYVoid/OpenCC), Copyright BYVoid and contributors, Apache License 2.0.',
    'Pinyin readings derived from pinyin-data (https://github.com/mozillazg/pinyin-data), Copyright 2016 mozillazg, MIT License, from the Unicode Han Database (Unihan) kMandarin field, Copyright Unicode, Inc., Unicode License v3.',
  ],
  librariesTitle: 'Software libraries',
  // TODO(release): append the generated notices for every bundled npm library (MIT and BSD ask for the notice).
  libraries: 'React Native, Expo and the other libraries in this app are open source, under the MIT, Apache 2.0, BSD and ISC licences.',
} as const;
