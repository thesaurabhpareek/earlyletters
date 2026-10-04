/**
 * Owner: E1 (web platform). Every word on /delete-account. The URL is fixed (D-042, D-063).
 *
 * v1.0 is on the phone only: no account, no sync, no server holding letters. So this page says how to
 * delete what is on the phone and how to remove an email address from the "tell me when it is ready"
 * list. The account flow (sign-in, 30-day account deletion, backup clocks) comes back with the server
 * version and the earlier text is in git history.
 *
 * Sources: privacy-policy.md sections 7 and 9; the 30-day Recently deleted undo is `settings.delete.entryBody`
 * in packages/content. Counsel questions live in docs/legal/COUNSEL_PACKET.md (Q34 for the email list).
 *
 * Content rules apply (VOICE.md): no dashes, curly quotes, ellipses or emoji; calm, no pressure.
 * The public names come from packages/brand and the contact address from src/content/site.ts.
 */
import { brand } from '@scribe/brand';
import { site } from '@/content/site';

const contact = site.footer.contact;
const subject = 'Delete my email address';

export const deleteAccountCopy = {
  metaTitle: `Delete your ${brand.name} data`,
  metaDescription: `How to delete your ${brand.name} letters from your phone, and how to remove your email address from our list.`,

  title: `Delete your ${brand.name} data`,
  intro: `${brand.storeName} has no account. Your letters, recordings and child details are on your phone, and we do not have them. This page shows how to delete them, and how to remove your email address if you signed up on our website.`,

  inApp: {
    heading: 'Delete it on your phone',
    lead: 'Everything is in your hands, on your iPhone.',
    steps: [
      { title: 'Export first, if you like', body: 'In Settings, Export everything gives you every letter and recording, free. You can also carry on without it.' },
      { title: 'Delete a letter', body: 'Open the letter and choose Delete. It stays in Recently deleted for 30 days so you can undo it, then it is erased.' },
      { title: 'Delete everything', body: 'Delete the app. That removes everything it keeps on your phone.' },
      {
        title: 'Plus is not cancelled for you',
        body: 'If you have Plus, deleting the app does not cancel it. Billing continues through Apple until you cancel in your Apple Account subscriptions.',
      },
    ],
  },

  next: {
    heading: 'What happens next',
    items: [
      'A deleted letter is erased from your phone after 30 days, or at once if you delete the app.',
      'An old iPhone backup may keep a copy until your phone replaces it. That backup is in your own Apple Account.',
    ],
  },

  removed: {
    heading: 'What is removed',
    items: [
      'Your letters, recordings and child details, from your phone.',
      'Nothing on our side, because the app does not send them to us.',
      'Copies you exported or shared stay with the people you sent them to.',
    ],
  },

  kept: {
    heading: 'What we keep, and why',
    lead: 'Very little, and none of it is your letters or recordings.',
    items: [
      'Your email address, only if you signed up on our website, until you unsubscribe or ask us to delete it.',
      'Emails you send us, only as long as we need them to help you.',
    ],
  },

  email: {
    heading: 'Remove your email address',
    body: [
      'Use the unsubscribe link in any email from us, or write to us and we will delete your address.',
      `Email ${contact} with the subject "${subject}". Please leave out letters and details about your child.`,
      'We aim to reply within 10 business days.',
    ],
    address: contact,
    button: 'Email us to delete my address',
    href: `mailto:${contact}?subject=${encodeURIComponent(subject)}`,
  },

  other: {
    heading: 'Other requests',
    body: 'To ask what we hold or correct something, see your choices in our',
    linkLabel: 'Privacy Policy',
    href: '/privacy#9-your-rights',
    after: '.',
  },
} as const;
