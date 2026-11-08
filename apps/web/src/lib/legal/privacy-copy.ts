/**
 * Owner: E1 (web platform). Every word on /privacy. It covers only what exists today: the website and its email
 * list. The app gets its own policy when it launches.
 *
 * Each claim and the code that makes it true (test/legal.test.ts and e2e/pages.e2e.ts check the ones code can check):
 * - Only the email address goes to Resend, as a contact in one segment: src/lib/notify/provider.ts `subscribe`.
 * - One welcome email on a first sign-up, never twice; one more when the app is ready: provider.ts `sendWelcome`,
 *   site.welcomeEmail ("we will write once more, when it is ready").
 * - Every email has an unsubscribe link; unsubscribing marks the contact unsubscribed, it is not deleted:
 *   provider.ts headers and body link, src/lib/notify/unsubscribe.ts `unsubscribeContact`.
 * - The IP address is held in memory only when someone joins or leaves the list (the rate limiters in handler.ts and
 *   unsubscribe-handler.ts, windows of 10 minutes at most, rate-limit.ts), and never stored or logged (log.ts).
 * - No cookies, no analytics (NEXT_PUBLIC_ANALYTICS is not set and WebAnalytics is not mounted), nothing loaded from
 *   another origin (Content-Security-Policy in next.config.ts). The one thing kept in the browser is the sound choice:
 *   "on" or "off" under the key `el-ambient-sound`, written only when the visitor presses the sound button
 *   (src/film/sound/AmbientSound.tsx `onToggle`), never sent anywhere. The page says so; test/legal.test.ts pins both.
 * - The services: Vercel (hosting, apps/web/vercel.json) and Resend (the list, the emails we send, and mail to the
 *   contact address: Resend receiving is enabled for earlyletters.com, apex MX at priority 9, per the brand review
 *   of 16 Oct 2026). Nothing else.
 *
 * Content rules apply (VOICE.md, test/copy-rules.test.ts): no dashes, curly quotes, ellipsis characters or emoji.
 */
import { brand } from '@scribe/brand';
import { legalCopy } from './legal-copy';
import type { LegalPageCopy, Publisher } from './types';

const NAME = brand.name;
const contact = legalCopy.contact;

/** Every service that handles a visitor's information. Adding one means updating this page first. */
export const serviceProviders = [
  { name: 'Vercel', role: 'hosts the website.' },
  { name: 'Resend', role: 'stores the list and handles our email.' },
] as const;

export function privacyCopy(publisher: Publisher): LegalPageCopy {
  return {
    metaTitle: `${NAME} Privacy Policy`,
    metaDescription: `How the ${NAME} website and its email list handle your information.`,
    title: 'Privacy Policy',
    lastUpdated: '2026-11-01',
    intro: [
      `This policy covers the ${NAME} website, earlyletters.com, and its email list. The ${NAME} app is not out yet. It will have its own privacy policy when it launches.`,
    ],
    sections: [
      {
        id: 'who-we-are',
        heading: 'Who we are',
        blocks: [`${NAME} is run by ${publisher.subject} as an individual, not a company. In this policy, "we" and "us" mean ${publisher.reference}.`],
      },
      {
        id: 'what-we-collect',
        heading: 'What we collect and why',
        blocks: [
          {
            list: [
              'Your email address, if you join the list. We use it to send you a welcome email when you join and one email when the app is ready. We do not ask for your name or anything else.',
              'Your email address and message, if you write to us. We use them to reply.',
              'Technical details of your visit. Our host receives your IP address, browser type and the page you asked for, and uses them to deliver the page and keep the site secure. When you join or leave the list, we hold your IP address in memory for up to 10 minutes to block automated requests. We do not save it.',
            ],
          },
        ],
      },
      {
        id: 'cookies-and-tracking',
        heading: 'Cookies and tracking',
        blocks: [
          {
            list: [
              'We do not use cookies.',
              'We do not use analytics, advertising or tracking tools, and the website loads nothing from other sites.',
            ],
          },
          'If you press the sound button, your browser remembers whether sound is on. It stays in your browser and is never sent to us.',
          'We do not track you, so a Do Not Track signal changes nothing here.',
        ],
      },
      {
        id: 'who-we-share-it-with',
        heading: 'Who we share it with',
        blocks: [
          'Two companies help us run the website and the list:',
          { list: serviceProviders.map((p) => `${p.name} ${p.role}`) },
          'We do not sell or rent your email address, or share it for advertising. We do not share your information with anyone else unless the law requires it.',
        ],
      },
      {
        id: 'how-long',
        heading: 'How long we keep it',
        blocks: [
          'We keep your email address until you ask us to delete it, or until we close the list. If you unsubscribe, we keep the address marked as unsubscribed, only so that we never email you again. We keep emails you send us only as long as we need them to help you.',
        ],
      },
      {
        id: 'your-choices',
        heading: 'Your choices',
        blocks: [
          {
            list: [
              'To stop our emails, use the unsubscribe link. Every email we send has one.',
              `To have your address deleted, email ${contact} from that address. We will delete it and tell you when it is done.`,
              'To see or correct what we hold about you, write to the same address.',
            ],
          },
        ],
      },
      {
        id: 'children',
        heading: 'Children',
        blocks: ['The website and the list are for adults. If we find out that a child gave us an email address, we will delete it.'],
      },
      {
        id: 'changes',
        heading: 'Changes to this policy',
        blocks: ['If we change this policy, we will post the new version here and update the date at the top.'],
      },
      {
        id: 'contact',
        heading: 'Contact',
        blocks: [`Questions about this policy: ${contact}.`],
      },
    ],
  };
}
