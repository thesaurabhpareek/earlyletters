/**
 * Owner: E1 (web platform). Every word on /delete-account (D-042: a static page plus an email route
 * for v1.0; the full web sign-in flow, LEGAL-REQ-030, ships before Android).
 *
 * Sources, so counsel can check each claim:
 * - In-app steps and the 30-day undo: docs/legal/DELETION_AND_EXPORT_SPEC.md 2.6 (DATA-REQ-019, -022, -026).
 * - Timelines and what is kept: docs/legal/privacy-policy.md sections 10 and 14.
 * - Email route: LEGAL-REQ-031 and privacy-policy.md section 14 (we send a sign-in link before we act).
 *
 * COUNSEL MUST CONFIRM (also listed in the E1 report):
 * 1. The 31, 38 and 45 day figures match the final Privacy Policy section 10. LEGAL-REQ-031 says
 *    backups age out within 35 days of the hard delete, which is a different count than "38 days of your request".
 * 2. The retention list under `kept`. "7 years" for transaction records and "2 years" for support emails are
 *    marked "proposed" in the Privacy Policy. Google Play wants every retained category disclosed (CR-091).
 * 3. "We reply within 10 business days" (Privacy Policy section 20) versus "acknowledged within 10 days" (LEGAL-REQ-031).
 * 4. That deletion started by email gets the same 30-day undo as in the app (DATA-REQ-027 says it uses the same
 *    functions, except under-13 data, which may skip the grace period if counsel requires it).
 * 5. Google Play (before Android): the page must show the developer name as listed on Play. packages/brand
 *    keeps `publisher.legalName` as a placeholder, so this page does not show a developer name yet.
 * 6. LEGAL-REQ-030 says the page links to /privacy-choices. That page does not exist; this page links to the
 *    Privacy Policy section on your choices instead.
 *
 * Content rules apply (VOICE.md): no dashes, curly quotes, ellipses or emoji; calm, no pressure.
 * The public names come from packages/brand and the contact address from src/content/site.ts.
 */
import { brand } from '@scribe/brand';
import { site } from '@/content/site';

const contact = site.footer.contact;
const subject = 'Delete my account';

export const deleteAccountCopy = {
  metaTitle: `Delete your ${brand.name} account`,
  metaDescription: `How to delete your ${brand.name} account, what is removed and what happens next.`,

  title: `Delete your ${brand.name} account`,
  intro: `This page is for ${brand.storeName}. You can delete your account in the app, or by email if you cannot open it. Deleting your account removes your letters, recordings and photos.`,

  inApp: {
    heading: 'Delete it in the app',
    lead: 'The quickest way is on your iPhone.',
    steps: [
      { title: 'Open Settings', body: 'In the app, tap Settings, then Your data.' },
      { title: 'Choose Delete account', body: 'You will see what happens to each book you are in.' },
      {
        title: 'Export first, if you like',
        body: 'Export everything gives you every letter and recording, free. You can also carry on without it.',
      },
      {
        title: 'Plus is not cancelled for you',
        body: 'If you have Plus, the app tells you here. Deleting your account does not cancel it. Billing continues through Apple until you cancel in your Apple Account subscriptions. We never hold up your deletion for it.',
      },
      {
        title: 'Confirm',
        body: 'If you signed in more than a day ago, the app asks you to sign in again, with your passcode, Face ID or an email code. Then you type to confirm.',
      },
      {
        title: 'Note the date',
        body: 'The app shows the date your account will be deleted, 30 days from now.',
      },
    ],
  },

  next: {
    heading: 'What happens next',
    items: [
      'You have 30 days to change your mind. Your account stays until the date the app showed. Sign in before then and choose Cancel, and your letters and books come back.',
      'After that, we remove your information from our live database and storage within 31 days of your request, from our database backups within 38 days, and from our service providers within 45 days.',
    ],
  },

  removed: {
    heading: 'What is removed',
    items: [
      'Your letters, recordings and photos, from every book, including a book you share with a co-parent. That book stays with your co-parent.',
      'A book where you are the only parent is deleted with everything in it, including family letters. Each family member is offered a copy of their own letters first.',
      'Letters you wrote to someone else\'s book are removed from it.',
      'The link between your account and your App Store purchases, and your Sign in with Apple connection.',
      'If you turned analytics on, the app asks our analytics service to delete what was sent. Analytics are not linked to your account, so deleting by email cannot reach them.',
      'Copies your family already saved or played on their own phones stay with them.',
    ],
  },

  kept: {
    heading: 'What we keep, and why',
    lead: 'A few records stay after you delete your account. None of them hold your letters or recordings.',
    items: [
      'Records that show you agreed to our Terms and policies, for the life of your account plus 3 years. After deletion they no longer show your name or email.',
      'Purchase records, only as tax and accounting rules require. We expect up to 7 years, for transaction records only. Apple also keeps its own purchase records, as the store.',
      'Activity records, such as "a letter was deleted", with no content, for 24 months. After deletion they no longer show who you are.',
      'The emails you send us about your request, for 2 years after your last message.',
    ],
  },

  email: {
    heading: 'Cannot open the app?',
    body: [
      `Email ${contact} from the address on your account, with the subject "${subject}".`,
      'Please leave out letters, recordings and details about your child. We only need to know it is you.',
      'We reply within 10 business days. To make sure it is you, we send a sign-in link to that address before we start. The same 30 days to change your mind apply.',
    ],
    address: contact,
    button: 'Email us to delete your account',
    href: `mailto:${contact}?subject=${encodeURIComponent(subject)}`,
  },

  other: {
    heading: 'Other requests',
    body: 'To download your book, correct something or ask what we hold, see your choices in our',
    linkLabel: 'Privacy Policy',
    href: '/privacy#14-your-choices-and-rights',
    after: '.',
  },
} as const;
