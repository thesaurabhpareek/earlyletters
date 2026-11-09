// Notes for App Review for a production build with server features on (build 12, founder 8 Nov 2026; App Review
// sign-in: proposals/app-review-demo-signin.md option 3, CTO ruling 8 Nov). Sent to Apple only, never shown to families.
//
// Why this is not `storeListing.reviewNotes`: the listing on develop is judged against the production profile in
// apps/mobile/eas.json, which still builds with EXPO_PUBLIC_SERVER_FEATURES=off, and the listing rules (D-121, D-126)
// hold sign-in and sharing out of it. These notes describe the servers-on build only. The release workflow sends them
// when, and only when, the production profile is on (scripts/release/with-review-contact.ts, ops PR A of the proposal);
// the servers-off notes stay in `storeListing.reviewNotes`. When the profile flips and D-121/D-126 are superseded, the
// pull request that flips it may fold these into `storeListing.reviewNotes`.
//
// Placeholders, filled at push time from the ASC_REVIEW_CONTACT_JSON secret and never committed (SEC-R04, IAM-R23):
// - {inviteLink}: a single-use co-parent invite link to the fictional Asha sample book, made by the founder-only seed
//   account. A link, not a typed code: in this build "I was invited" reads only a pasted invite link, and a typed
//   8-character code gets the not-recognised line (app/invite/index.tsx, lib/family/invites.ts p_code_hash null).
// - {inviteExpiry}: the date that link stops working, 7 days after it was made (IAM-R18), written as a date.
//
// Every step names a label the build shows (checked on develop a8bf1576): onboarding.welcome.joinButton,
// family.accept.pasteLabel, accept.signIn, the Terms and age steps, sensitiveConsent.agreeButton, accept.join,
// accept.signsAsLabel, joined `open`, settingsHome.deleteAccountLabel and planLabel. Re-check them against the
// release build before each submission; the Settings regroup (#614) may move rows.
// Fictional family only (CLAUDE.md): Asha. No real name, address, code or link is ever typed here.
import { brand } from '@scribe/brand';

/** Replaced by the invite link before the text reaches Apple. */
const inviteLink = '{inviteLink}';
/** Replaced by the link's last valid day before the text reaches Apple. */
const inviteExpiry = '{inviteExpiry}';

const notesServersOn = `${brand.name} is a memory book that parents fill by talking. A parent speaks or types a short letter to their child. The app never rewrites what a person says. It makes only small marked fixes to the words it writes down (stray sounds, repeated words, a misheard name from the family's own word list, punctuation), and each fix can be put back. The birthday or due date a parent enters is used to file letters by month of age. This is not a health or medical service and gives no health advice.

SIGN-IN IS OPTIONAL
The app works fully on this iPhone without an account. Signing in adds two things: the same book on a parent's other iPhones, and sharing a book with the child's other parent. Sign-in is Sign in with Apple, or a sign-in link and 6-digit code sent by email. There are no passwords, so this submission has no demo user name or password. Please use your own Apple Account with Sign in with Apple.

TO REVIEW SIGN-IN AND SHARING (about 3 minutes)
1. Launch and answer "Are you 18 or older?" with Yes.
2. On the first screen, tap I was invited.
3. Paste this invite link into Invite link, then tap Continue: ${inviteLink}
4. Tap Sign in, then Sign in with Apple.
5. Agree to the Terms, answer the age question, then tap Agree and sync. Sharing a book needs this step.
6. Tap Join the book. You join a sample book for a made-up child, Asha, as the second parent. Everything in it is fictional.
7. Type what Asha calls you, for example Papa, then tap Open the book.
The link works once, until ${inviteExpiry}. You can also skip the link and start your own book.

WHAT A CO-PARENT SEES
Both parents read every letter in the book, each one signed. Recordings stay on the phone that made them in this version, so each parent hears only their own.

DELETING THE ACCOUNT
Settings, Delete account. It shows what happens to each book, then asks you to type delete. The account is deleted 30 days later, and the deletion can be cancelled until then.

PLUS
The first two letters are free. To reach the Plus sheet, keep two letters, then try to keep a third, or open Settings, Plan. Please use a sandbox account.

Contact: ${brand.support.email}`;

export const appReviewCopy = {
  /** The Notes for Review of a production build with server features on. */
  notesServersOn,
  /** The two placeholders the release workflow fills. */
  placeholders: { inviteLink, inviteExpiry },
} as const;
