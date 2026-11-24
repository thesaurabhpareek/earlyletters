/**
 * Owner: E1 (web platform). Every word on /delete-account (BL-2128, FR-MSG-34, D-042).
 *
 * The words are the counsel draft `docs/legal/delete-account-page.md` (1.1.0, draft-for-counsel), unchanged: each `##`
 * heading there is a key here, in the same order, and test/delete-account.test.ts fails if a word differs. Change the
 * draft first, then this file. Only the three tokens are filled, as the other legal pages fill them: {brand.name} and
 * {brand.storeName} from packages/brand, {contact} from legalCopy.contact (site.footer.contact).
 *
 * Not live yet: CR-193 (D-15) holds the page off `main` until the exec reading of this text is recorded and CR-187 is
 * applied, so the route is noindex and absent from the sitemap. Content rules apply (VOICE.md; test/copy-rules.test.ts
 * reads this file).
 */
import { brand } from '@scribe/brand';
import { legalCopy } from './legal-copy';

const NAME = brand.name;
const STORE_NAME = brand.storeName;
const contact = legalCopy.contact;

export const deleteAccountCopy = {
  metaTitle: `Delete your ${NAME} account`,
  metaDescription: `How to delete your ${NAME} account, what is removed, and what we keep.`,
  title: `Delete your ${NAME} account`,
  intro: `This page is for ${STORE_NAME}. You can delete your account by email. Where your build of the app has the Delete account control, you can also delete it there (the early test builds hide it unless it is switched on). Deleting your account removes your letters and your account from our servers.`,
  inApp: {
    heading: 'Delete it in the app, where your build has the control',
    lead: 'If Settings, Your data shows Delete account, this is the quickest way. If it does not, use the email steps below.',
    steps: [
      { lead: 'Open Settings.', body: 'Tap Settings, then Your data.' },
      { lead: 'Choose Delete account.', body: 'You will see what happens to each book you are in.' },
      { lead: 'Export first, if you like.', body: 'Export everything gives you every letter and the recordings on this phone, free.' },
      {
        lead: 'Plus is not cancelled for you.',
        body: 'Deleting your account does not cancel Plus. Apple keeps billing until you cancel in your Apple Account subscriptions. You can delete your account either way.',
      },
      { lead: 'Confirm.', body: 'Type delete to confirm.' },
      { lead: 'Note the date.', body: 'The app shows the date your account will be deleted, 30 days from now.' },
    ],
  },
  next: {
    heading: 'What happens next',
    items: [
      'You have 30 days to change your mind. Sign in before the date the app showed and choose Cancel, and everything comes back.',
      'After that, we erase your information from our live systems within 31 days of your request (except the kept book entry above), from our backups within 38 days, and from our service providers within 45 days. Our email provider keeps each email it sends for 30 days.',
      'When the 30 days end, every device signed in to your account is signed out.',
    ],
  },
  removed: {
    heading: 'What is removed',
    items: [
      'Your letters, from every book, including a book you share with a co-parent. That book stays with your co-parent.',
      'Any book where you are the only parent, with everything in it, except the letters of someone who left that book earlier (below).',
      "If someone left a book, or their joining was undone, before you deleted it, their letters stay theirs. We keep the book's entry with the child's name, birth date and due date to label those letters, clear its nickname, photo and other details, and delete it when nothing of theirs is left.",
      'If you used recording backup, your encrypted recordings and the keys that open them.',
      'Your account, your sign-in methods and your Sign in with Apple connection.',
      'Copies your co-parent already exported, and letters already on their phone, stay with them.',
    ],
  },
  kept: {
    heading: 'What we keep, and why',
    lead: 'None of these hold your letters or recordings.',
    items: [
      'Records of what you agreed to, for 3 years, without your name or email.',
      'Activity logs, and the log of each use of the recovery key, for 24 months, without your name or email.',
      'A record that the deletion happened, for 3 years.',
      'Security logs, for 12 months.',
      'Emails you send us about your request, for 2 years after your last message.',
    ],
  },
  email: {
    heading: 'Cannot open the app?',
    items: [
      `Email ${contact} from the address on your account, with the subject "Delete my account".`,
      'Please leave out letters, recordings and details about your child. We only need to know it is you.',
      'We reply within 10 business days. We send a code to that address to confirm it is you before we start. The same 30 days to change your mind apply.',
    ],
    button: 'Email us to delete your account',
    subject: 'Delete my account',
    // The draft gives this closing paragraph no label; the key name is ours, the words are the draft's.
    websiteList: 'If you only gave us your email on our website, use the unsubscribe link in any email from us, or write to the same address with the subject "Delete my email address".',
  },
  other: {
    heading: 'Other requests',
    body: 'To download your book, correct something or ask what we hold, see your choices in our Privacy Policy.',
    href: '/privacy#10-your-rights',
  },
} as const;

/** The draft's headings, in its order: the keys above. */
export type DeleteAccountKey = keyof typeof deleteAccountCopy;

/** The mail the button opens: the contact address and the subject the draft gives, encoded for a mailto link. */
export const deleteAccountMailto = `mailto:${contact}?subject=${encodeURIComponent(deleteAccountCopy.email.subject)}`;
