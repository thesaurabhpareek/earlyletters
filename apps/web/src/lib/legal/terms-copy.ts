/**
 * Owner: E1 (web platform). Every word on /terms: the terms for the website and its email list only.
 * The app gets its own terms when it launches.
 *
 * Sources: the individual publisher (docs/DECISIONS.md D-004); the list's emails as in privacy-copy.ts.
 * No governing-law section yet: the founder has not said which state's law applies (coordinator, 16 Oct 2026). Add it
 * here, as its own section before "Changes to these terms", once the founder answers.
 * Content rules apply (VOICE.md, test/copy-rules.test.ts): no dashes, curly quotes, ellipsis characters or emoji.
 */
import { brand } from '@scribe/brand';
import { legalCopy } from './legal-copy';
import type { LegalPageCopy, Publisher } from './types';

const NAME = brand.name;
const contact = legalCopy.contact;

export function termsCopy(publisher: Publisher): LegalPageCopy {
  return {
    metaTitle: `${NAME} Terms of Use`,
    metaDescription: `The terms for using the ${NAME} website and its email list.`,
    title: 'Terms of Use',
    lastUpdated: '2026-10-16',
    intro: [
      `These terms cover the ${NAME} website, earlyletters.com, and its email list. By using the website, you agree to them. The ${NAME} app is not out yet. It will have its own terms when it launches.`,
    ],
    sections: [
      {
        id: 'who-we-are',
        heading: 'Who we are',
        blocks: [`${NAME} is run by ${publisher.subject} as an individual, not a company. In these terms, "we" and "us" mean ${publisher.reference}.`],
      },
      {
        id: 'the-website',
        heading: 'About the website',
        blocks: [
          'The website describes an app we are still building. Its features, price and launch date may change, and nothing on the website is an offer to sell you anything.',
        ],
      },
      {
        id: 'the-email-list',
        heading: 'The email list',
        blocks: [
          'Joining the list is free. We send a welcome email when you join and one email when the app is ready. You can leave at any time with the unsubscribe link in any of our emails. Please add only an email address that is yours.',
          'Our Privacy Policy explains how we handle your address.',
        ],
      },
      {
        id: 'using-the-website',
        heading: 'Using the website',
        blocks: [
          'Please use the website lawfully. Do not try to break into it, overload it or interfere with it, and do not add addresses to the list in bulk or by script.',
        ],
      },
      {
        id: 'our-content',
        heading: 'Our content',
        blocks: [
          `The words, images and design of the website, and the ${NAME} name, belong to us. You are welcome to share links to the website. Please ask us before copying or reusing anything else.`,
        ],
      },
      {
        id: 'no-warranty',
        heading: 'No warranty',
        blocks: [
          'The website and the list are provided as they are and as available. The website may change, pause or contain mistakes. To the extent the law allows, we give no warranties about the website or the list, whether stated or implied.',
        ],
      },
      {
        id: 'liability',
        heading: 'Limits on our liability',
        blocks: [
          'To the extent the law allows, we are not liable for any indirect or consequential loss, or for any loss of data or profits, that comes from using the website or the list. Our total liability to you for anything to do with them is limited to 50 US dollars.',
          'Nothing in these terms limits our liability for fraud, gross negligence or willful misconduct, or for anything else the law does not allow us to limit.',
        ],
      },
      {
        id: 'changes',
        heading: 'Changes to these terms',
        blocks: ['We may update these terms. The date at the top shows when they last changed. If you keep using the website after a change, the updated terms apply.'],
      },
      {
        id: 'contact',
        heading: 'Contact',
        blocks: [`Questions about these terms: ${contact}.`],
      },
    ],
  };
}
