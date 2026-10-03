/**
 * Every word on earlyletters.com. Scenes import from here; never hardcode copy.
 *
 * Owner: coordinator (storyboard v0). The content team proposes replacements in
 * docs/web/copy/ and the coordinator merges them here. Content rules
 * (packages/content/VOICE.md, CLAUDE.md) are enforced by test/copy-rules.test.ts:
 * no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt
 * or loss language; never imply software writes; never gender the child.
 *
 * v1.0 truth only (docs/agents/BRIEF-2026-10-03.md): no grandparents writing,
 * no mixing two languages in one letter, no word highlighting, no print, no Android.
 * The child in the film is Meera (founder's choice). Papa writes; Mama is the co-parent.
 */

export const sampleLetter = {
  to: 'Meera',
  from: 'Papa',
  month: 9,
  dateline: 'Month 9, Tuesday night',
  duration: '1:12',
  /** What was said, as said. Shown word by word while "listening". */
  text:
    'Meera, today you found the light switch. On, off, on, off. Fourteen times, I counted. Mama pretended not to notice and then laughed so hard she had to sit down. You looked at us like we were the strange ones. Maybe we are. Anyway. You are asleep now, and the house sounds different. Goodnight, little one.',
  /** The one microphone slip the review scene fixes. Nothing else changes. */
  slip: { heard: 'light snitch', fixed: 'light switch' },
} as const;

export const site = {
  meta: {
    title: 'Early Letters: the baby memory book you fill by talking',
    description:
      'Talk to your child for a minute at the end of the day. Early Letters keeps every word exactly as you said it, with your voice, in a book that grows month by month.',
  },

  brand: {
    name: 'Early Letters',
    line: 'The baby memory book you fill by talking.',
  },

  cta: {
    /** Before the App Store link exists (src/lib/launch.ts decides the mode). */
    prelaunch: {
      eyebrow: 'Coming soon to iPhone',
      button: "Tell me when it's ready",
    },
    live: {
      eyebrow: 'Free on iPhone',
      /** Accessible name for the official badge link. The badge artwork carries its own words. */
      badgeLabel: 'Download Early Letters on the App Store',
    },
  },

  scenes: {
    s01: {
      label: 'Evening',
      dateline: '9:41 pm',
      headline: 'Meera is asleep.',
      support: 'The house is quiet for the first time today.',
    },
    s02: {
      label: 'A minute',
      headline: 'A minute is plenty.',
      support: 'Open Early Letters and tell Meera about today. One sentence counts.',
      appPrompt: 'What made Meera laugh today?',
      appGreeting: 'Good evening',
      appDateline: 'Month 9, Week 2, Tuesday',
      speak: 'Speak',
      type: 'Type',
    },
    s03: {
      label: 'Just talk',
      headline: 'Just talk.',
      support: 'Say it the way you would say it to Meera. Short or long, both belong.',
      appTo: 'To Meera',
      appAudience: 'Only people you invite can read this',
      appDone: 'Done',
      appPause: 'Pause',
    },
    s04: {
      label: 'Exactly as you said it',
      headline: 'Exactly as you said it.',
      support:
        'Transcription happens on your phone and only fixes slips, like a misheard word. We never rewrite your words.',
      appSave: 'Save letter',
      appFixHint: 'Tap a word to check it',
    },
    s05: {
      label: 'Your voice',
      headline: 'Your voice stays with it.',
      support: 'The recording is kept with every letter. One day Meera can hear how you sounded tonight.',
    },
    s06: {
      label: 'The book',
      headline: 'A book that grows by month.',
      support: "Each letter is filed under Meera's age that month and signed with your name. Both parents write in the same book.",
      appTitle: "Meera's Book",
      chapters: [
        { month: 'Month 7', meta: '9 letters, from Papa and Mama' },
        { month: 'Month 8', meta: '11 letters, from Papa and Mama' },
        { month: 'Month 9', meta: '12 letters, from Papa and Mama' },
      ],
      filedChip: 'Filed in Month 9',
    },
    s07: {
      label: 'Years later',
      dateline: 'Years from now',
      headline: 'Said once. Heard for years.',
      support: 'Open any letter and hear it in the voice that said it, with the words right there on the page.',
      appFrom: 'From Papa',
      /** Optional tap-to-hear. Hidden until a released recording exists (see docs/web/STORYBOARD.md). */
      hear: 'Hear this letter',
    },
    s08: {
      label: 'Your language',
      headline: 'Say it in your language.',
      support: 'English, Hindi, Spanish, Mandarin, French, Arabic and Portuguese, each written in its own script.',
      /** Same sentence in each v1.0 language. Needs native-speaker verification (BR1). */
      lines: [
        { lang: 'en', dir: 'ltr', name: 'English', text: 'Today you found the light switch.' },
        { lang: 'hi', dir: 'ltr', name: 'Hindi', text: 'आज तुमने लाइट का स्विच ढूँढ लिया।' },
        { lang: 'es', dir: 'ltr', name: 'Spanish', text: 'Hoy encontraste el interruptor de la luz.' },
        { lang: 'zh', dir: 'ltr', name: 'Mandarin', text: '今天你找到了电灯开关。' },
        { lang: 'fr', dir: 'ltr', name: 'French', text: "Aujourd'hui, tu as trouvé l'interrupteur." },
        { lang: 'ar', dir: 'rtl', name: 'Arabic', text: 'اليوم وجدت مفتاح الضوء.' },
        { lang: 'pt', dir: 'ltr', name: 'Portuguese', text: 'Hoje você encontrou o interruptor da luz.' },
      ],
    },
    s09: {
      label: 'Private',
      headline: 'Private by default.',
      points: [
        'Only the people you invite can read your letters.',
        'No ads. We never sell your data.',
        'Your letters are never used to train models.',
        'Export your whole book, free, any time.',
        'Delete a letter or a recording whenever you like.',
      ],
    },
    s10: {
      label: 'Pricing',
      headline: 'Free to write, read and keep.',
      support:
        'Writing, reading, playing your recordings and export are free, always. Plus is optional, from $3.99 a month, and adds backup for every recording and books for more children.',
    },
    s11: {
      label: 'Start tonight',
      headline: 'Tell Meera about today.',
      supportPrelaunch: 'Early Letters is coming to iPhone. Leave your email and we will write once, when it is ready.',
      supportLive: 'Free on iPhone. Your first letter takes a minute.',
    },
  },

  notify: {
    label: 'Your email',
    placeholder: 'you@example.com',
    button: "Tell me when it's ready",
    note: 'One email when Early Letters is ready. We never share your address.',
    success: 'Thank you. We will write once, when Early Letters is ready.',
    error: 'That did not go through. Please check your email and try again.',
  },

  footer: {
    contact: 'hello@earlyletters.com',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/health-privacy', label: 'Consumer health data' },
      { href: '/subprocessors', label: 'Subprocessors' },
      { href: '/delete-account', label: 'Delete your account' },
    ],
  },
} as const;

export type Site = typeof site;
