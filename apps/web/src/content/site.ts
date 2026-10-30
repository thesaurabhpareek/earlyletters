/**
 * Every word on earlyletters.com. Scenes import from here; never hardcode copy.
 *
 * Owner: coordinator. Content rules (packages/content/VOICE.md, CLAUDE.md) are enforced by
 * test/copy-rules.test.ts: no em or en dashes, curly quotes, ellipsis characters or emoji; no fear,
 * guilt or loss language; never imply software writes; never gender the child.
 *
 * v1.0 truth only (docs/agents/BRIEF-2026-10-03.md; claims audit in docs/web/copy/BR1-audit.md):
 * no grandparents writing, no mixing two languages in one letter, no word highlighting, no print,
 * no Android, no backup promise. The child in the film is Asha, the fictional family every test and fixture uses (CLAUDE.md). Papa writes;
 * Mama is the co-parent. The public name comes from packages/brand (CLAUDE.md).
 *
 * In-app strings shown inside the phone are the app's own words, copied from
 * packages/content/src/strings.en.ts (keys noted beside each).
 */
import { brand } from '@scribe/brand';
import { plusPricing } from './pricing';

const NAME = brand.name;

/**
 * How to get an invite into the app when the /j page cannot copy it: from the message, where the whole link still is
 * (F11-U02). One wording for every such case, so they never drift apart.
 */
const INVITE_BY_HAND = `Go back to the message, press and hold the link and copy it. Then open ${NAME}, tap "I was invited" and paste it.`;

/**
 * The film's one letter. `heard` is what the microphone caught; joining every segment's
 * `becomes` (or its text when there is none) gives `text`. Each change is an edit the app's
 * constitution allows (packages/core/src/types.ts EditType): a misheard name from the family
 * dictionary (stt_fix, the type's own example), a filler, a false start. Nothing is added.
 */
export const sampleLetter = {
  to: 'Asha',
  from: 'Papa',
  month: 9,
  dateline: 'Month 9, Tuesday night',
  duration: '1:12',
  text:
    'Asha, today you found the light switch. On, off, on, off. Fourteen times, I counted. Mama pretended not to notice and then laughed so hard she had to sit down. You looked at us like we were the strange ones. Maybe we are. Anyway. You are asleep now, and the house sounds different. Goodnight, little one.',
  heard: [
    { text: 'Usher', becomes: 'Asha', kind: 'name' },
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
    description: `Tell your child about today, out loud. ${NAME} keeps every word exactly as you said it, and your voice with it.`,
  },

  brand: {
    name: NAME,
    line: 'The baby memory book you fill by talking.',
    tagline: brand.tagline,
  },

  skip: 'Skip the film',

  comingSoon: {
    line: 'A baby book you fill by talking. Tell your child about today, and it stays exactly as you said it.',
    trust: 'Your letters stay on your phone, and only the people you invite ever see them.',
    shareButton: 'Share with friends and family',
    howTitle: 'How it works',
    writeToUs: 'Write to us any time:',
    shareCopied: 'Link copied',
    shareHeading: 'Know a parent who would love this?',
    shareWhatsapp: 'WhatsApp',
    shareMessages: 'Messages',
    shareEmail: 'Email',
    shareTitle: `${NAME}, the baby memory book`,
    shareText: `${NAME}, a baby book you fill by talking. A minute at the end of the day, kept exactly as you said it.`,
  },

  cta: {
    /** Before the App Store link exists (src/lib/launch.ts decides the mode). */
    prelaunch: {
      eyebrow: 'Coming soon to iPhone',
      button: 'Tell me at launch',
      pill: 'Tell me at launch',
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
      headline: 'Asha is asleep.',
      support: 'The house is quiet for the first time today. You are tired, and there is one thing you want to remember.',
    },
    s02: {
      label: 'A minute',
      headline: 'A minute is plenty.',
      support: `No blank page, no homework. Open ${NAME}, tell Asha one thing about today, and put the phone down.`,
      /** strings.en.ts tonight.greeting.night with {name} = Papa */
      appGreeting: 'The house is quiet, Papa.',
      /** tonight.subtitle */
      appSubtitle: 'What do you want Asha to know about today?',
      /** tonight.promptLabel */
      appPromptLabel: 'A thought to start with',
      appPrompt: 'What made Asha laugh today?',
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
      support: 'Say it the way you would say it to Asha. Pause, laugh, lose your thread. None of it has to be tidy.',
      appTo: 'To Asha',
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
      support: "Your phone listens and clears the ums and false starts. If it mishears Asha's name, it fixes that too. It never adds a word, and every fix can be put back.",
      /** review.title, review.changesLabel with {count} = 3, review.trustLine, review.undoEditButton */
      appTitle: 'Read it back',
      appChanges: '3 small fixes',
      appTrust: 'We only fixed what got in the way of your words. Nothing added.',
      appPutBack: 'Put it back',
    },
    s05: {
      label: 'Your voice',
      headline: 'Your voice stays with it.',
      support: 'Every letter you speak keeps its recording. One day Asha can hear how tired, and how happy, you sounded tonight.',
      /** tonight.states.savedLetter */
      appKept: 'Signed and kept.',
    },
    s06: {
      label: 'The book',
      headline: 'A book that grows by month.',
      support: "Each letter goes under the month Asha was that age, signed with your name. You and Mama add to the same book.",
      appTitle: "Asha's Book",
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
      support: 'Years from now, press play and there you are, with the words right on the page beside you.',
      appFrom: 'From Papa',
      /** Optional tap-to-hear. Hidden until a released recording exists (docs/web/STORYBOARD.md). */
      hear: 'Hear this letter',
    },
    s08: {
      label: 'Your language',
      headline: 'Say it in your language.',
      support: 'Your phone understands English, Hindi, Spanish, Mandarin, French, Arabic and Portuguese, and keeps each one in its own script.',
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
        'Only the people you invite can see your letters.',
        'No ads, and we never sell your data.',
        'Your letters are never used to train AI.',
        'Export your letters any time. They are yours.',
        'Delete a letter or a recording whenever you like.',
      ],
    },
    s10: {
      label: 'Pricing',
      headline: 'Two letters free. Then Plus.',
      // The whole offer as one sentence: it names the plans for screen readers (the plans group is labelled with it)
      // and is what test/pricing.test.ts holds to the constants in pricing.ts.
      support: `${plusPricing.monthly.price} a month with a ${plusPricing.monthly.trialMonths}-month free trial, or ${plusPricing.annual.price} a year with a ${plusPricing.annual.trialMonths}-month free trial.`,
      free: {
        name: 'Free',
        title: 'Your first two letters',
        note: 'Enough to see if it feels right.',
      },
      plus: {
        name: 'Plus',
        title: 'When you want to keep going',
        plans: [
          { name: 'Monthly', price: plusPricing.monthly.price, per: 'a month', trial: `${plusPricing.monthly.trialMonths} month free` },
          { name: 'Yearly', price: plusPricing.annual.price, per: 'a year', trial: `${plusPricing.annual.trialMonths} months free` },
        ],
        trialNote: 'to start',
        includes: [
          'Add letters as often as you like',
          'Every recording safely backed up',
          'Read together, after the free sessions',
          'One price for every child in the family',
          'The whole family can add letters',
        ],
      },
      promise: 'Every letter you have made stays yours to read, play and export, whatever you choose.',
    },
    s11: {
      label: 'Start tonight',
      headline: 'Tell Asha about today.',
      supportPrelaunch: `${NAME} is coming to iPhone in the US. Leave your email and we will tell you when it is ready.`,
      supportLive: 'On iPhone in the US. Your first two letters are free, and a letter takes a minute.',
    },
  },

  notify: {
    label: 'Your email',
    placeholder: 'you@example.com',
    hint: 'Just your email address, nothing else.',
    note: `A welcome email now, and one more when ${NAME} is ready. We never sell your address or share it for advertising, and every email has an unsubscribe link.`,
    button: 'Tell me at launch',
    /** The single, quiet sign-up on the home page (components/landing). */
    quietButton: 'Save my place',
    sending: 'Sending',
    successTitle: 'Thank you, you are on the list.',
    successBody: `A short hello is on its way, and we will write once more when ${NAME} is ready.`,
    success: `Thank you, you are on the list. A short hello is on its way, and we will write once more when ${NAME} is ready.`,
    /** Shown when the address is already on the list (the server says so; components/cta/NotifyForm.tsx). */
    alreadyTitle: 'You are already on the list.',
    alreadyBody: `Nothing more to do. We will write when ${NAME} is ready.`,
    already: `You are already on the list. Nothing more to do. We will write when ${NAME} is ready.`,
    error: 'That email does not look quite right. Could you check it and try again?',
    rateLimited: 'Please give it a minute, then try once more.',
    server: 'That did not go through on our side. Please try again in a moment.',
    empty: 'Please add your email address first.',
    network: 'We could not reach the internet just now. Please check your connection and try once more.',
    sendingStatus: 'Sending your address.',
    retry: 'Try again',
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
    letterTo: 'To Asha',
    letterMeta: 'Month 9, Tuesday night',
    letterFrom: 'From Papa',
    /** Must stay the opening of sampleLetter.text (checked in test/welcome-email.test.ts): the email shows only words the sample letter really holds. */
    letterExcerpt: 'Asha, today you found the light switch. On, off, on, off. Fourteen times, I counted.',
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

  /**
   * The page behind the link in a sign-in or confirm-your-email message (app/auth/confirm/page.tsx; PRD V2 F02 6.3
   * step 3b). It shows only when the app did not open the link: on a laptop, in a mail app's own browser, or to a
   * mail scanner. It signs nobody in and confirms nothing; the person types the code from the same email into the
   * app. The product says "sign-in link", never anything else (F02 6.3).
   */
  authConfirm: {
    title: 'Finish signing in',
    line: 'Finish on your iPhone.',
    body: `Open ${NAME} on your iPhone and type the code from the same email. That signs you in, or confirms your email if you are new.`,
    onPhone: 'Already on your iPhone? Tap below, then type the code.',
    open: `Open ${NAME}`,
    expired: 'If the app says the code has expired, tap "Send a new email".',
    notYou: 'If you did not ask for this email, you can ignore it. Nothing changes.',
    home: `Back to ${NAME}`,
  },

  /**
   * The page behind a co-parent invite link, https://earlyletters.com/j#t=<token> (app/j/page.tsx; PRD V2 F11 6.3
   * step 1). It shows only when the app did not open the link: no app on this phone, a laptop, or a mail or chat
   * app's own browser. It joins nothing; the person copies the link and pastes it into the app's "I was invited".
   * No child or inviter name, because the page knows neither. When the copy cannot work (the browser refused, or a
   * chat or mail app's own browser dropped the fragment), the words send the person back to the message, where the
   * whole link still is (F11-U02). The steps show only beside a working Copy button; `noScript` is all a browser with
   * JavaScript off shows in their place, since that page can neither read the invite nor copy it.
   */
  invite: {
    title: 'An invite to share a book',
    line: 'Someone invited you to share a book.',
    body: `This invite opens in ${NAME} on an iPhone.`,
    steps: ['Tap "Copy the invite".', `Open ${NAME} and tap "I was invited".`, 'Paste the invite.'],
    onComputer: `On a computer? Open this link on the iPhone that has ${NAME}.`,
    copy: 'Copy the invite',
    copied: `Copied. Now open ${NAME} and tap "I was invited".`,
    copyFailed: `This browser would not copy it. ${INVITE_BY_HAND}`,
    missing: `This page opened without its invite. ${INVITE_BY_HAND}`,
    noScript: INVITE_BY_HAND,
    notYou: 'If you were not expecting an invite, you can ignore it. Nothing changes.',
    home: `Back to ${NAME}`,
  },

  footer: {
    contact: 'hello@earlyletters.com',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: 'mailto:hello@earlyletters.com', label: 'Contact' },
    ],
  },
} as const;

export type Site = typeof site;
