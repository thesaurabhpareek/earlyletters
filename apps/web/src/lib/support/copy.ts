/**
 * Owner: content. Every word on /support. PROPOSED: the founder approves each line before it ships (the pull request
 * lists them). This version is true of the app in both profiles of the store build, servers off (develop today) and
 * servers on (Build 12), because packages/content/test/claims-capabilities.test.ts judges every string in apps/web/src
 * against the production profile in eas.json, and a sign-in or account line fails it while servers are off. The
 * sign-in help and account deletion sections are staged in the pull request body and join this file in the pull
 * request that flips the profile (#698, #769).
 * - Recordings stay on the phone that made them: authCopy.sheet.bodies.first_letter (servers on), and true of a
 *   servers-off build, which keeps everything on the phone.
 * - The first two letters are free: en.onboarding.welcome.freeLine.
 * - The privacy promise, shortened to its first two claims (en.trust.promise; the website's banned-word rule keeps the
 *   third out).
 * No response time is promised, because no process in the repo keeps one. Nothing about co-parent sharing, backup of
 * recordings, other languages or Android.
 * The address comes from packages/brand (brand.support.email), the public name from brand.name, never typed here.
 * Content rules apply (VOICE.md, test/copy-rules.test.ts reads this file).
 */
import { brand } from '@scribe/brand';
import type { LegalPageCopy } from '../legal/types';

const email = brand.support.email;

export const supportCopy = {
  metaTitle: `Support | ${brand.name}`,
  metaDescription: `Help with ${brand.name}. Write to ${email}. A person reads every message.`,
  title: 'Support',
  // Required by LegalPageCopy. Not shown and not in the sitemap: /support is not linked from any page yet (e2e links test).
  lastUpdated: '2026-11-11',
  intro: [
    `Write to us at ${email}. A person reads every message. You never need to send a letter or a recording to get help.`,
  ],
  sections: [
    {
      id: 'recordings',
      heading: 'Your recordings',
      blocks: ['Recordings are kept on the phone that made them.'],
    },
    {
      id: 'plus',
      heading: 'Plus',
      blocks: ['Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free.'],
    },
    {
      id: 'privacy',
      heading: 'Privacy',
      blocks: ['Your letters and recordings are private. We never sell them and never use them for ads.'],
    },
  ],
} as const satisfies LegalPageCopy;
