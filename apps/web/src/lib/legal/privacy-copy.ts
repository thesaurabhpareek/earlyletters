/**
 * Owner: E1 (web platform). Every word on /privacy. It covers only what exists today: the website and the
 * launch-notice list. The app gets its own policy when it launches.
 *
 * Each claim and the code that makes it true (test/legal.test.ts and e2e/pages.e2e.ts check the ones code can check):
 * - Only the email address goes to Resend, as a contact in one segment: src/lib/notify/provider.ts `subscribe`.
 * - One welcome email on a first sign-up, never twice; one more when the app is ready: provider.ts `sendWelcome`,
 *   site.welcomeEmail ("we will write once more, when it is ready").
 * - Every email has an unsubscribe link; unsubscribing marks the contact unsubscribed, it is not deleted:
 *   provider.ts headers and body link, src/lib/notify/unsubscribe.ts `unsubscribeContact`.
 * - The IP address is held in memory for rate limiting, windows of 10 minutes at most, never stored or logged:
 *   src/lib/notify/rate-limit.ts, handler.ts, unsubscribe-handler.ts, log.ts.
 * - No cookies, no browser storage, no analytics (NEXT_PUBLIC_ANALYTICS is not set and WebAnalytics is not mounted),
 *   nothing loaded from another origin (Content-Security-Policy in next.config.ts), self-hosted fonts (@fontsource).
 * - The services: Vercel (hosting, apps/web/vercel.json) and Resend (the list and the emails). Nothing else.
 *   Mail sent to the contact address arrives through the domain's mail setup (Resend receiving or Porkbun forwarding,
 *   docs/ops/WEBSITE_RUNBOOK.md DNS table, marked Inferred there), so the page names no provider for it.
 *
 * Content rules apply (VOICE.md, test/copy-rules.test.ts): no dashes, curly quotes, ellipsis characters or emoji.
 */
import { brand } from '@scribe/brand';
import { legalCopy } from './legal-copy';
import type { LegalPageCopy } from './types';

const NAME = brand.name;
const contact = legalCopy.contact;

/** Every service that handles a visitor's information. Adding one means updating this page first. */
export const serviceProviders = [
  { name: 'Vercel', role: 'hosts the website.' },
  { name: 'Resend', role: 'stores the list and sends our emails.' },
] as const;

export function privacyCopy(publisher: string): LegalPageCopy {
  return {
    metaTitle: `${NAME} Privacy Policy`,
    metaDescription: `How the ${NAME} website and its launch-notice list handle your information.`,
    title: 'Privacy Policy',
    lastUpdated: '2026-10-16',
    intro: [
      `This policy covers the ${NAME} website, earlyletters.com, and its launch-notice list. The ${NAME} app is not out yet. It will have its own privacy policy when it launches.`,
    ],
    sections: [
      {
        id: 'who-runs-this',
        heading: 'Who runs this',
        blocks: [`${NAME} is run by ${publisher}, an individual. In this policy, "we" and "us" mean that person. You can reach us at ${contact}.`],
      },
      {
        id: 'what-we-collect',
        heading: 'What we collect and why',
        blocks: [
          {
            list: [
              'Your email address, if you join the list. We use it to send you one short welcome email now and one email when the app is ready. We do not ask for your name or anything else.',
              'Your message, if you email us. We use it to answer you.',
              'The usual details of a visit. Like every website, ours receives your IP address, your browser type and the page you asked for. Our host uses them to deliver the page and keep the site secure. To slow down automated sign-ups, our code also holds your IP address in memory for up to 10 minutes. It is not saved.',
            ],
          },
        ],
      },
      {
        id: 'what-we-do-not-do',
        heading: 'What we do not do',
        blocks: [
          {
            list: [
              'We do not use cookies.',
              'We do not use analytics, advertising or tracking tools, and the website loads nothing from other companies. Even our fonts are stored on our own site.',
              'We do not sell or rent your email address, and we never share it for advertising.',
              'Our code never writes your email address or IP address to a log.',
            ],
          },
          'Because nothing here tracks you, there is nothing for a Do Not Track signal to switch off.',
        ],
      },
      {
        id: 'who-helps',
        heading: 'Who helps us run this',
        blocks: [
          'Two companies help us run the website and the list:',
          { list: serviceProviders.map((p) => `${p.name} ${p.role}`) },
          'Emails you send us reach us through our email service. We do not share your information with anyone else, unless the law requires it.',
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
