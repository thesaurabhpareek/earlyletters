/**
 * Every word on earlyletters.com. Scenes import from here; never hardcode copy.
 *
 * Owner: coordinator. Content rules (packages/content/VOICE.md, CLAUDE.md) are enforced by
 * test/copy-rules.test.ts: no em or en dashes, curly quotes, ellipsis characters or emoji; no fear,
 * guilt or loss language; never imply software writes; never gender the child.
 *
 * v1.0 truth only (docs/agents/BRIEF-2026-10-03.md; claims audit in docs/web/copy/BR1-audit.md):
 * no grandparents writing, no mixing two languages in one letter, no word highlighting, no print,
 * no Android, no backup promise. The child in the film is the founder's daughter, named here on the founder's own decision (D-118, 28 Oct 2026, "for now"); tests, fixtures and docs still use the fictional family (CLAUDE.md). Papa writes;
 * Mama is the co-parent. The public name comes from packages/brand (CLAUDE.md).
 *
 * In-app strings shown inside the phone are the app's own words, copied from
 * packages/content/src/strings.en.ts (keys noted beside each).
 */
import { brand } from '@scribe/brand';
import { annualSavings, plusPricing } from './pricing';

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
  to: 'Meera',
  from: 'Papa',
  month: 9,
  dateline: 'Month 9, Tuesday night',
  duration: '1:12',
  text:
    'Meera, today you found the light switch. On, off, on, off. Fourteen times, I counted. Mama pretended not to notice and then laughed so hard she had to sit down. You looked at us like we were the strange ones. Maybe we are. Anyway. You are asleep now, and the house sounds different. Goodnight, little one.',
  heard: [
    { text: 'Maria', becomes: 'Meera', kind: 'name' },
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
    description: `Say a few words to your child about today. ${NAME} keeps them in your own words and your own voice.`,
  },

  brand: {
    name: NAME,
    line: 'The baby memory book you fill by talking.',
    tagline: brand.tagline,
  },

  skip: 'Skip the film',

  comingSoon: {
    line: 'A baby book you fill by talking. Say what happened today, out loud, and it stays in your own words.',
    // Re-check at the first release with sync or backup (1.0.x): "stay on your iPhone" is true for the first build only (D-121).
    trust: 'Your letters and recordings stay on your iPhone, and none of it is sent to us.',
    shareButton: 'Share with a friend',
    howTitle: 'How it works',
    writeToUs: 'Write to us any time:',
    shareCopied: 'Link copied',
    shareCopyFailed: 'This browser would not copy. Here is the address:',
    shareHeading: 'Know another tired parent?',
    shareWhatsapp: 'WhatsApp',
    shareMessages: 'Messages',
    shareEmail: 'Email',
    shareFacebook: 'Facebook',
    shareTelegram: 'Telegram',
    shareX: 'X',
    shareCopy: 'Copy link',
    shareMore: 'More',
    shareVia: 'Share via',
    shareTitle: `${NAME}, the baby memory book`,
    shareText: `${NAME}, a baby book you fill by talking. A few words at the end of the day, said out loud.`,
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
      headline: 'Meera is asleep.',
      support: 'The house has gone quiet. You are still turning the day over.',
    },
    s02: {
      label: 'A minute',
      headline: 'A minute is plenty.',
      support: `Open ${NAME} and tell Meera one thing about today. Then put the phone down.`,
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
      label: 'Talking',
      headline: 'Talk to Meera the way you do.',
      support: 'A half-finished sentence is fine. So is laughing in the middle of one.',
      appTo: 'To Meera',
      /** tonight.states.listening, listeningHint */
      appListening: 'Listening.',
      appHint: 'Say it however it comes.',
      /** tonight.states.stopButton */
      appDone: 'Finish',
      appPause: 'Pause',
    },
    s04: {
      label: 'Your words',
      headline: 'It stays in your words.',
      support: 'Ums and repeats come out. Nothing is added, and every fix can be put back.',
      /** review.title, review.changesLabel with {count} = 3, review.trustLine, review.undoEditButton */
      appTitle: 'Read it back',
      appChanges: '3 small fixes',
      appTrust: 'We only fixed what got in the way of your words. Nothing added.',
      appPutBack: 'Put it back',
    },
    s05: {
      label: 'Your voice',
      headline: 'Your voice comes with it.',
      support: 'Each spoken letter keeps its original recording, unchanged, tired end-of-day voice and all.',
      /** tonight.states.savedLetter */
      appKept: 'Signed and kept.',
    },
    s06: {
      label: 'The book',
      headline: 'Month by month.',
      support: "Each letter is filed under the month Meera was when you said it, with your name on it.",
      appTitle: "Meera's Book",
      chapters: [
        { month: 'Month 7', meta: '9 letters' },
        { month: 'Month 8', meta: '11 letters' },
        { month: 'Month 9', meta: '12 letters' },
      ],
      filedChip: 'Filed in Month 9',
    },
    s07: {
      label: 'Years later',
      dateline: 'Years from now',
      headline: 'Back to that Tuesday night.',
      support: 'Press play and there is your voice, with the words on the page beside it.',
      appFrom: 'From Papa',
      /** Optional tap-to-hear. Hidden until a released recording exists (docs/web/STORYBOARD.md). */
      hear: 'Hear this letter',
    },
    s08: {
      label: 'Languages',
      headline: 'Starting in English.',
      support: 'More languages follow one at a time, each after a native speaker has checked it.',
      /**
       * The same sentence in each v1.0 language (first verification pass: docs/web/copy/BR1-audit.md s2).
       * Every line needs a native speaker's sign-off before launch. Portuguese is Brazilian (voce).
       */
      // English only until a native reviewer is on record for each other language (D-115, D-125 item 2).
      lines: [
        { lang: 'en', dir: 'ltr', name: 'English', text: 'Today you found the light switch.' },
      ],
    },
    s09: {
      label: 'Private',
      headline: 'Kept on your iPhone.',
      points: [
        'Letters and recordings stay on your iPhone. We never receive them.',
        'No ads. We never sell your data.',
        'Your letters are never used to train AI.',
        'Export your letters whenever you want.',
        'Delete any letter, any time.',
      ],
    },
    s10: {
      label: 'Pricing',
      headline: 'Your first two letters are free.',
      // Said plainly, to a tired parent: what is free, then what Plus is for.
      lede: 'Enough to tell whether it suits you. Plus is for the letters after those.',
      // The whole offer as one sentence: it names the plans for screen readers (the plans group is labelled with it)
      // and is what test/pricing.test.ts holds to the constants in pricing.ts.
      support: `${plusPricing.monthly.price} a month with a ${plusPricing.monthly.trialMonths}-month free trial, or ${plusPricing.annual.price} a year with a ${plusPricing.annual.trialMonths}-month free trial.`,
      plus: {
        name: 'Plus',
        // The free trial leads each card; the price follows it.
        plans: [
          { name: 'Monthly', trial: `${plusPricing.monthly.trialMonths} month free`, then: 'then', price: plusPricing.monthly.price, per: 'a month', note: '' },
          { name: 'Yearly', trial: `${plusPricing.annual.trialMonths} months free`, then: 'then', price: plusPricing.annual.price, per: 'a year', note: `Save ${annualSavings.price} a year` },
        ],
        includes: [
          'Add letters as often as you like',
          'One price for every child in the family',
        ],
      },
      promise: 'Every letter you have made stays yours to read, play and export, with or without Plus.',
    },
    s11: {
      label: 'Start tonight',
      headline: 'Tell Meera about today.',
      supportPrelaunch: `${NAME} is coming to iPhone in the US. Leave your email and we will let you know.`,
      supportLive: 'On iPhone in the US. Your first two letters are free, and each takes about a minute.',
    },
  },

  notify: {
    label: 'Your email',
    placeholder: 'you@example.com',
    hint: 'Your email address is all we ask for.',
    note: `You will get a short hello, then one email when ${NAME} is ready. We never sell your address or share it for advertising. Every email has an unsubscribe link.`,
    button: 'Tell me at launch',
    /** The single, quiet sign-up on the home page (components/landing). */
    quietButton: 'Save my place',
    sending: 'Saving',
    successTitle: 'Thank you, you are on the list.',
    successBody: `There is a hello waiting in your inbox. You will hear from us once more, at launch.`,
    success: `Thank you, you are on the list. There is a hello waiting in your inbox. You will hear from us once more, at launch.`,
    /** Shown when the address is already on the list (the server says so; components/cta/NotifyForm.tsx). */
    alreadyTitle: 'You are already on the list.',
    alreadyBody: `We already have your address. You will hear from us at launch.`,
    already: `You are already on the list. We already have your address. You will hear from us at launch.`,
    error: 'That email does not look quite right. Could you check it and try again?',
    rateLimited: 'Give it a minute and try again.',
    server: 'Something went wrong on our side. Try again in a moment.',
    empty: 'Add your email address first.',
    network: 'We could not connect just now. Check your connection and try again.',
    sendingStatus: 'Saving your place on the list.',
    retry: 'Try again',
    honeypotLabel: 'Company',
    /** The pages a native form post lands on (app/signup). */
    thanksTitle: 'All set.',
    sorryTitle: 'That did not go through.',
    home: `Back to ${NAME}`,
  },

  /** The one short hello sent when someone leaves their address (lib/notify/welcome-email.ts). */
  welcomeEmail: {
    subject: `You are on the list for ${NAME}`,
    preheader: 'One letter from the book, and what happens next.',
    kicker: 'Welcome',
    headline: 'You are on the list.',
    intro: `${NAME} is the baby memory book you fill by talking. It is coming to iPhone in the US. You will hear from us once more, at launch.`,
    letterLabel: 'What a letter looks like',
    letterTo: 'To Meera',
    letterMeta: 'Month 9, Tuesday night',
    letterFrom: 'From Papa',
    /** Must stay the opening of sampleLetter.text (checked in test/welcome-email.test.ts): the email shows only words the sample letter really holds. */
    letterExcerpt: 'Meera, today you found the light switch. On, off, on, off. Fourteen times, I counted.',
    letterNote: "About a minute of talking. Every word is Papa's own.",
    promisesTitle: 'What we promise',
    promises: [
      'We never rewrite your words.',
      'Each letter you speak keeps its original recording, unchanged.',
      'Your letters and recordings stay on your iPhone. No ads, and we never sell your data.',
    ],
    closing: 'Until then, there is nothing you need to do.',
    signoff: `The ${NAME} team`,
    footerLine: `${NAME} is coming to iPhone in the US.`,
    why: 'You are getting this because someone entered this address at earlyletters.com. If that was not you, reply to this email and we will remove it.',
    unsubscribePrefix: 'Not for you?',
    unsubscribeLabel: 'Unsubscribe',
  },

  /** The unsubscribe page (app/unsubscribe/page.tsx), reached from the link in every email. */
  unsubscribe: {
    title: 'Stop these emails?',
    body: 'We will not write to this address again. If you change your mind, you can sign up again on the website.',
    button: 'Unsubscribe',
    doneTitle: 'You are unsubscribed.',
    doneBody: 'We will not write to you again. Take care.',
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
    body: `Open ${NAME} on your iPhone and type the code from this email. It signs you in, or confirms your email if you are new.`,
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

  /** The film's quiet ambient sound and its one button. Labels stay under 23 characters. */
  sound: {
    on: 'Sound on',
    off: 'Sound off',
    start: 'Tap to start sound',
  },

  /** The two quiet buttons that move one part of the film at a time. Labels are for screen readers and tooltips. */
  scrollNav: {
    next: 'Next part',
    previous: 'Previous part',
    /** The word under the first screen's line, so a new visitor knows to scroll. */
    cue: 'Scroll',
  },

  footer: {
    /** The website's own footer line. Held out of public copy: the brand tagline waits on counsel (D-125). */
    tagline: 'In your own words.',
    contact: 'hello@earlyletters.com',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
      { href: 'mailto:hello@earlyletters.com', label: 'Contact' },
    ],
  },
} as const;

export type Site = typeof site;
