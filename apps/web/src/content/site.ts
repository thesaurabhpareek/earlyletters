/**
 * Every word on earlyletters.com. Scenes import from here; never hardcode copy.
 *
 * Owner: coordinator. Content rules (packages/content/VOICE.md, CLAUDE.md) are enforced by
 * test/copy-rules.test.ts: no em or en dashes, curly quotes, ellipsis characters or emoji; no fear,
 * guilt or loss language; never imply software writes; never gender the child.
 *
 * v1.0 truth only (docs/agents/BRIEF-2026-10-03.md; claims audit in docs/web/copy/BR1-audit.md):
 * no grandparents writing, no mixing two languages in one letter, no word highlighting, no print,
 * no Android, no backup promise. The child in the film is Meera (founder's choice). Papa writes;
 * Mama is the co-parent. The public name comes from packages/brand (CLAUDE.md).
 *
 * In-app strings shown inside the phone are the app's own words, copied from
 * packages/content/src/strings.en.ts (keys noted beside each).
 */
import { brand } from '@scribe/brand';

const NAME = brand.name;

/**
 * The film's one letter. `heard` is what the microphone caught; joining every segment's
 * `becomes` (or its text when there is none) gives `text`. Each change is an edit the app's
 * constitution allows (packages/core/src/types.ts EditType): a misheard name from the family
 * dictionary (stt_fix, the type's own example), a filler, a false start. Nothing is added.
 */
export const sampleLetter = {
  to: 'Meera',
  from: 'Papa',
  month: 9,
  dateline: 'Month 9, Tuesday night',
  duration: '1:12',
  text:
    'Meera, today you found the light switch. On, off, on, off. Fourteen times, I counted. Mama pretended not to notice and then laughed so hard she had to sit down. You looked at us like we were the strange ones. Maybe we are. Anyway. You are asleep now, and the house sounds different. Goodnight, little one.',
  heard: [
    { text: 'Mirror', becomes: 'Meera', kind: 'name' },
    { text: ', ' },
    { text: 'um, ', becomes: '', kind: 'filler' },
    {
      text: 'today you found the light switch. On, off, on, off. Fourteen times, I counted. Mama pretended not to notice and then laughed so hard she had to sit down. You looked at us',
    },
    { text: ', you looked at us', becomes: '', kind: 'false_start' },
    {
      text: ' like we were the strange ones. Maybe we are. Anyway. You are asleep now, and the house sounds different. Goodnight, little one.',
    },
  ],
} as const;

export type HeardSegment = { text: string; becomes?: string; kind?: 'name' | 'filler' | 'false_start' };

export const site = {
  meta: {
    title: `${NAME}: the baby memory book you fill by talking`,
    description: `Talk to your child for a minute at the end of the day. ${NAME} keeps every word exactly as you said it, with your voice, in a book that grows month by month.`,
  },

  brand: {
    name: NAME,
    line: 'The baby memory book you fill by talking.',
    tagline: brand.tagline,
  },

  skip: 'Skip the film',

  comingSoon: {
    line: 'A calm place to keep and treasure every milestone. The baby memory book you fill by talking, with every word kept exactly as you said it, in your voice.',
    trust: 'Private by design. Your letters stay on your phone, and we never rewrite your words.',
    shareButton: 'Share with friends and family',
    howTitle: 'How it works',
    writeToUs: 'Write to us any time:',
    shareCopied: 'Link copied',
    shareTitle: `${NAME}, the baby memory book`,
    shareText: 'The baby memory book you fill by talking. Every word kept exactly as you said it, private on your phone.',
  },

  cta: {
    /** Before the App Store link exists (src/lib/launch.ts decides the mode). */
    prelaunch: {
      eyebrow: 'Coming soon to iPhone',
      button: "Keep me informed",
      pill: "Keep me informed",
    },
    live: {
      eyebrow: 'On iPhone',
      /** Accessible name for the official badge link. The badge artwork carries its own words. */
      badgeLabel: `Download ${NAME} on the App Store`,
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
      support: `Open ${NAME} and tell Meera about today. One sentence counts.`,
      /** strings.en.ts tonight.greeting.night with {name} = Papa */
      appGreeting: 'The house is quiet, Papa.',
      /** tonight.subtitle */
      appSubtitle: 'What do you want Meera to know about today?',
      /** tonight.promptLabel */
      appPromptLabel: 'A thought to start with',
      appPrompt: 'What made Meera laugh today?',
      /** tonight.newPromptButton */
      appAnother: 'Another thought',
      appDateline: 'Month 9, Week 2, Tuesday',
      speak: 'Speak',
      type: 'Type',
      /** tonight.notMuchButton */
      notMuch: 'Not much today',
      /** The app's three tabs (DESIGN_LANGUAGE 12). */
      appTabs: ['Tonight', 'Book', 'Family'],
    },
    s03: {
      label: 'Just talk',
      headline: 'Just talk.',
      support: 'Say it the way you would say it to Meera. Pauses are fine.',
      appTo: 'To Meera',
      /** tonight.states.listening, listeningHint */
      appListening: 'Listening.',
      appHint: 'Say it however it comes.',
      /** tonight.states.stopButton */
      appDone: 'Finish',
      appPause: 'Pause',
    },
    s04: {
      label: 'Exactly as you said it',
      headline: 'Exactly as you said it.',
      support:
        'Transcription runs on your phone by default and only clears the ums and misheard names. We never rewrite your words.',
      /** review.title, review.changesLabel with {count} = 3, review.trustLine, review.undoEditButton */
      appTitle: 'Read it back',
      appChanges: '3 small fixes',
      appTrust: 'We only fixed what got in the way of your words. Nothing added.',
      appPutBack: 'Put it back',
    },
    s05: {
      label: 'Your voice',
      headline: 'Your voice stays with it.',
      support: 'The recording is kept with every letter you speak. One day Meera can hear how you sounded tonight.',
      /** tonight.states.savedLetter */
      appKept: 'Signed and kept.',
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
      support: 'Open a spoken letter and hear it in the voice that said it, with the words right there on the page.',
      appFrom: 'From Papa',
      /** Optional tap-to-hear. Hidden until a released recording exists (docs/web/STORYBOARD.md). */
      hear: 'Hear this letter',
    },
    s08: {
      label: 'Your language',
      headline: 'Say it in your language.',
      support: 'English, Hindi, Spanish, Mandarin, French, Arabic and Portuguese, each written in its own script.',
      /**
       * The same sentence in each v1.0 language (first verification pass: docs/web/copy/BR1-audit.md s2).
       * Every line needs a native speaker's sign-off before launch. Portuguese is Brazilian (voce).
       */
      lines: [
        { lang: 'en', dir: 'ltr', name: 'English', text: 'Today you found the light switch.' },
        { lang: 'hi', dir: 'ltr', name: 'Hindi', text: 'आज तुमने लाइट का स्विच ढूँढ लिया।' },
        { lang: 'es', dir: 'ltr', name: 'Spanish', text: 'Hoy encontraste el interruptor de la luz.' },
        { lang: 'zh-Hans', dir: 'ltr', name: 'Mandarin', text: '今天你找到了灯的开关。' },
        { lang: 'fr', dir: 'ltr', name: 'French', text: "Aujourd'hui, tu as trouvé l'interrupteur." },
        { lang: 'ar', dir: 'rtl', name: 'Arabic', text: 'اليوم أنت وجدت مفتاح الضوء.' },
        { lang: 'pt-BR', dir: 'ltr', name: 'Portuguese', text: 'Hoje você encontrou o interruptor da luz.' },
      ],
    },
    s09: {
      label: 'Private',
      headline: 'Private by default.',
      points: [
        'Your letters are shared only with the people you invite.',
        'No ads. We never sell your data.',
        'Your letters are never used to train models.',
        'Every letter you have made stays yours to export, any time.',
        'Delete a letter or a recording whenever you like.',
      ],
    },
    s10: {
      label: 'Pricing',
      headline: 'Two letters free. Then Plus.',
      support:
        'Your first two letters are free, so you can try it. After that, Plus membership lets you keep adding letters. $3.99 a month with a 1-month free trial, or $29.99 a year with a 2-month free trial. Every letter you have made stays yours to read, play and export, even if you stop.',
    },
    s11: {
      label: 'Start tonight',
      headline: 'Tell Meera about today.',
      supportPrelaunch: `${NAME} is coming to iPhone in the US. Leave your email and we will write once, when it is ready.`,
      supportLive: 'On iPhone in the US. Your first two letters are free, and a letter takes a minute.',
    },
  },

  notify: {
    label: 'Your email',
    placeholder: 'you@example.com',
    hint: 'Just your email address, nothing else.',
    note: `One email when ${NAME} is ready. We never share your address, and every email has an unsubscribe link.`,
    button: "Keep me informed",
    /** The single, quiet sign-up on the home page (components/landing). */
    quietButton: 'Keep me informed',
    sending: 'Sending',
    success: `Thank you, you are on the list. Look out for a short hello from us, and we will write once more, when ${NAME} is ready.`,
    error: 'That did not go through. Please check your email and try again.',
    rateLimited: 'Please give it a minute, then try once more.',
    server: 'That did not go through on our side. Please try again in a moment.',
    honeypotLabel: 'Company',
    /** The pages a native form post lands on (app/signup). */
    thanksTitle: 'Thank you.',
    sorryTitle: 'That did not go through.',
    home: `Back to ${NAME}`,
  },

  /** The one short hello sent when someone leaves their address (lib/notify/welcome-email.ts). */
  welcomeEmail: {
    subject: `You are on the list for ${NAME}`,
    preheader: 'One short hello now. One email when it is ready.',
    kicker: 'Welcome',
    headline: 'You are on the list.',
    intro: `${NAME} is the baby memory book you fill by talking. It is coming to iPhone in the US, and we will write once more, when it is ready.`,
    letterLabel: 'What a letter looks like',
    letterTo: 'To Meera',
    letterMeta: 'Month 9, Tuesday night',
    letterFrom: 'From Papa',
    /** Must stay the opening of sampleLetter.text (checked in test/welcome-email.test.ts): the email shows only words the sample letter really holds. */
    letterExcerpt: 'Meera, today you found the light switch. On, off, on, off. Fourteen times, I counted.',
    letterNote: 'A minute of talking. Every word kept exactly as it was said.',
    promisesTitle: 'What we are building',
    promises: [
      'Every word kept exactly as you said it.',
      'Your voice kept with each letter.',
      'Private by design. No ads, and we never sell your data.',
    ],
    closing: 'Until then, there is nothing you need to do.',
    signoff: `The ${NAME} team`,
    footerLine: `${NAME} is coming to iPhone in the US.`,
    why: 'You are receiving this because this address was entered at earlyletters.com. If that was not you, reply to this email and we will remove it.',
    unsubscribePrefix: 'Not for you?',
    unsubscribeLabel: 'Unsubscribe',
  },

  /** The unsubscribe page (app/unsubscribe/page.tsx), reached from the link in every email. */
  unsubscribe: {
    title: 'Stop these emails?',
    body: 'We will not write to this address again. If you change your mind, you can leave your email on the website any time.',
    button: 'Unsubscribe',
    doneTitle: 'You are unsubscribed.',
    doneBody: 'We will not write to you again. Thank you for stopping by.',
    invalidTitle: 'That link did not work.',
    invalidBody: 'It may be old or incomplete. Write to hello@earlyletters.com and we will remove your address ourselves.',
    error: 'That did not go through on our side. Please try again in a moment.',
    home: `Back to ${NAME}`,
  },

  footer: {
    contact: 'hello@earlyletters.com',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: '/health-privacy', label: 'Consumer health data' },
      { href: '/subprocessors', label: 'Subprocessors' },
      { href: '/delete-account', label: 'Delete your data' },
    ],
  },
} as const;

export type Site = typeof site;
