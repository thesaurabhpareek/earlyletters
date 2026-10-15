/**
 * Owner: E1 (web platform). Every word on /terms: the terms for the website and its launch-notice list only.
 * The app gets its own terms when it launches.
 *
 * Sources: the individual publisher (docs/DECISIONS.md D-004); California law as in the draft app Terms, section 24
 * (docs/legal/terms-of-service.md), for the legal reviewer to confirm; the list's emails as in privacy-copy.ts.
 * Content rules apply (VOICE.md, test/copy-rules.test.ts): no dashes, curly quotes, ellipsis characters or emoji.
 */
import { brand } from '@scribe/brand';
import { legalCopy } from './legal-copy';
import type { LegalPageCopy } from './types';

const NAME = brand.name;
const contact = legalCopy.contact;

export function termsCopy(publisher: string): LegalPageCopy {
  return {
    metaTitle: `${NAME} Terms of Use`,
    metaDescription: `The terms for using the ${NAME} website and its launch-notice list.`,
    title: 'Terms of Use',
    lastUpdated: '2026-10-15',
    intro: [
      `These terms cover the ${NAME} website, earlyletters.com, and its launch-notice list. By using the website, you agree to them. The ${NAME} app is not out yet. It will have its own terms when it launches, and those terms will cover the app.`,
    ],
    sections: [
      {
        id: 'who-runs-this',
        heading: 'Who runs this',
        blocks: [`${NAME} is run by ${publisher}, an individual. In these terms, "we" and "us" mean ${publisher}.`],
      },
      {
        id: 'the-website',
        heading: 'About the website',
        blocks: [
          'The website tells you about the app before it launches. It describes what we plan to build. The app, its features, its price and its launch date may change, and nothing on the website is an offer to sell you anything.',
        ],
      },
      {
        id: 'the-list',
        heading: 'The launch-notice list',
        blocks: [
          'Joining the list is free. We send one short welcome email when you join and one email when the app is ready. You can leave at any time with the unsubscribe link in any of our emails. Please add only an email address that is yours.',
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
          'The website and the list are provided as they are and as available. The website is for an app that is not out yet, so it may change, pause or contain mistakes. To the extent the law allows, we give no warranties about the website or the list, whether stated or implied.',
        ],
      },
      {
        id: 'liability',
        heading: 'Limits on our liability',
        blocks: [
          'To the extent the law allows, we are not liable for any indirect or consequential loss, or for any loss of data or profits, that comes from using the website or the list. Our total liability to you for anything to do with them is limited to 50 US dollars. Some places do not allow these limits, so they may not apply to you.',
        ],
      },
      {
        id: 'governing-law',
        heading: 'Governing law',
        blocks: [
          'These terms are governed by the laws of the State of California, without regard to its conflict of law rules. If you live somewhere else, you keep any rights your local law gives you that cannot be waived.',
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
