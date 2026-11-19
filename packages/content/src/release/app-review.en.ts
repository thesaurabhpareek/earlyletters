// Notes for App Review for a production build with server features on (build 12). Sent to Apple only, never shown to
// families. PROPOSED: every sentence needs founder approval (the pull request lists them).
//
// Build 12 rulings this follows: D-157 (servers on), D-160 (sign-in is required; co-parent surfaces may show "coming soon"),
// B12-5 (the "I was invited" button is hidden in the store build, so the reviewer is never sent through it).
//
// Why this is not `storeListing.reviewNotes`: those words are for a build with server features off. These notes describe the
// servers-on build only. The release workflow sends them when, and only when, the production profile is on
// (scripts/release/with-review-contact.ts).
//
// Placeholders, filled at push time from the ASC_REVIEW_CONTACT_JSON secret (`demoUsername`, `demoPassword`) and never
// committed (SEC-R04): {demoEmail} and {demoPassword}. They are also the App Store Connect sign-in fields.
// - The app has NO password sign-in (welcome-sign-in.tsx: Sign in with Apple, or an emailed link and 6-digit code). So
//   {demoPassword} is not an app password. These notes call it the password of the mailbox that receives the code for
//   {demoEmail}. That mailbox is a founder step. UNVERIFIED: that such a mailbox exists, that the code reaches it from the
//   production Auth SMTP, and how App Review treats a demo account that signs in through a mailbox.
//
// Every step names a label the build shows (checked on develop 18ff637): authCopy.sheet.email, authCopy.email.label and
// .send, authCopy.code.label and .verify, consent.terms.agree, consent.age.body and .yes, settingsHome.deleteAccountLabel
// and planLabel. Re-check them against the release build before each submission; the Settings regroup may move rows.
// Fictional family only (CLAUDE.md): Asha. No real name, address or sign-in is ever typed here.
import { brand } from '@scribe/brand';

/** Replaced by the demo account's email address before the text reaches Apple. */
const demoEmail = '{demoEmail}';
/** Replaced by the password of that address's mailbox before the text reaches Apple. */
const demoPassword = '{demoPassword}';

const notesServersOn = `${brand.name} is a memory book that parents fill by talking. A parent speaks or types a short letter to their child. The app never rewrites what a person says. It makes only small marked fixes to the words it writes down (stray sounds, repeated words, a misheard name from the family's own word list, punctuation), and each fix can be put back. The birthday or due date a parent enters is used to file letters by month of age. This is not a health or medical service and gives no health advice.

SIGN-IN IS REQUIRED
An account keeps the words of a parent's letters with them on a new phone. Recordings stay on the phone that made them. Sign-in is Sign in with Apple, or a link and a 6-digit code sent by email. There are no passwords in the app.

DEMO ACCOUNT (about 3 minutes)
Email: ${demoEmail}
Password: ${demoPassword}
The password opens the mailbox for that address, where the code arrives. It is not typed into the app. If you prefer, use Sign in with Apple with your own Apple Account instead.
1. On the first screen, tap Sign in with email.
2. Type the email address above in Email, then tap Send link.
3. Open the new email in that mailbox. Type its 6-digit code in Code, then tap Continue. Tapping the link on this iPhone also works.
4. Tap Agree and continue, then answer "Are you 18 or older?" with Yes.
5. Set up a book for a made-up child, for example Asha, and try a short letter by speaking or typing.
Sharing a book with a second parent is not needed to review the app.

DELETING THE ACCOUNT
Settings, Delete account. It shows what happens to each book, then asks you to type delete. The account is deleted 30 days later, and the deletion can be cancelled until then.

PLUS
The first two letters are free. To reach the Plus sheet, keep two letters, then try to keep a third, or open Settings, Plan. Please use a sandbox account.

Contact: ${brand.support.email}`;

export const appReviewCopy = {
  /** The Notes for Review of a production build with server features on. */
  notesServersOn,
  /** The two placeholders the release workflow fills. */
  placeholders: { demoEmail, demoPassword },
} as const;
