// Adds the App Review contact, any demo account and the copyright line to apps/mobile/store.config.json inside the release
// workflow only (job `metadata`), from the ASC_REVIEW_CONTACT_JSON secret in $REVIEW. The file on disk in
// CI is thrown away after the push; the committed file never holds these details (ADR 0022, D-089).
//
// Secret shape (EAS Metadata `apple.review`, https://docs.expo.dev/eas/metadata/schema/, 3 Oct 2026):
//   {"firstName","lastName","email","phone","copyright","demoUsername"?,"demoPassword"?,"demoRequired"?,"notes"?}
// `phone` is in international format with a leading "+" (App Store Connect refuses digits only).
// `copyright` (for example "2026 <publisher's legal name>") goes to `apple.copyright`. It is in the secret because the
// individual publisher's name is never in code (packages/brand, D-004).
// A build with server features on has sign-in (D-100). Its review path is Sign in with Apple, with no shared sign-in
// credential (proposals/app-review-demo-signin.md option 3, CTO ruling 8 Nov 2026), so for that build:
//   - the secret carries `inviteLink` (a single-use co-parent invite link to the fictional Asha sample book, made fresh
//     before each submission) and `inviteExpiry` (YYYY-MM-DD, the day the link stops working, at most 7 days after it
//     was made, IAM-R18); it must NOT carry `demoUsername`, `demoPassword` or `notes`;
//   - the notes are `appReviewCopy.notesServersOn` with the link and the date filled in;
//   - `demoRequired` is false;
//   - the link is checked with the app's own `parseInviteUrl`: in this build "I was invited" reads only a pasted invite
//     link, and a typed code gets the not-recognised line, so a code (or any text that is not a link the app accepts)
//     is refused here instead of in front of the reviewer.
// A servers-off build keeps `storeListing.reviewNotes`, so the 5.1.1(ix) positioning (D-004) is always sent.
// The link is a bearer secret (it signs a person into a book): it exists only in the secret and in the CI copy of
// store.config.json, never in the repository, a log or an error message.
// Errors never echo the secret: a parse failure reports a fixed message, and missing fields are named, not shown.
import { readFileSync, writeFileSync } from 'node:fs';
import { brand } from '../../packages/brand';
import { appReviewCopy } from '../../packages/content/src/release/app-review.en';
import { storeListing } from '../../packages/content/src/store.en';
import { parseInviteUrl } from '../../apps/mobile/src/lib/family/invite-link.logic';
import { productionServerFeatures, STORE_CONFIG_PATH } from './store-config';

const REQUIRED = ['firstName', 'lastName', 'email', 'phone', 'copyright'] as const;

/** Guideline 2.1 and D-004: the reviewer notes live with every other store word in packages/content. */
export const REVIEW_NOTES = storeListing.reviewNotes;

/** Words that describe an on-device build; wrong in the notes of a build with sign-in. */
const NO_SIGN_IN = /\bno (sign-in|sign in|account)\b/i;

/** App Store Connect: Notes for Review hold at most 4,000 bytes. */
const NOTES_MAX_BYTES = 4000;
const DAY_MS = 86_400_000;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A real calendar day, `YYYY-MM-DD`, as milliseconds at 00:00 UTC; null when it is not one. */
function dayOf(iso: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(t);
  return d.getUTCFullYear() === Number(m[1]) && d.getUTCMonth() === Number(m[2]) - 1 && d.getUTCDate() === Number(m[3]) ? t : null;
}

/**
 * The review notes of a servers-on build: `appReviewCopy.notesServersOn` with the invite link and its last valid day.
 * Throws a fixed message that never contains the link or the date.
 */
export function serversOnNotes(inviteLink: unknown, inviteExpiry: unknown, now: Date): string {
  if (typeof inviteLink !== 'string' || !inviteLink.trim()) {
    throw new Error('The production build has sign-in (server features on): ASC_REVIEW_CONTACT_JSON is missing inviteLink');
  }
  if (typeof inviteExpiry !== 'string' || !inviteExpiry.trim()) {
    throw new Error('The production build has sign-in (server features on): ASC_REVIEW_CONTACT_JSON is missing inviteExpiry');
  }
  const link = inviteLink.trim();
  // The reviewer pastes this text into "I was invited": it must be one link the app itself reads (https, our site, /j, token
  // in the fragment). A typed 8-character code is not one; the app answers it with the not-recognised line.
  if (/\s/.test(link) || parseInviteUrl(link, brand.web.origin) === null) {
    throw new Error('ASC_REVIEW_CONTACT_JSON inviteLink must be one invite link the app accepts, https://<our site>/j#t=<token>; a typed code is not read by this build (value not shown)');
  }
  const day = dayOf(inviteExpiry.trim());
  if (day === null) throw new Error('ASC_REVIEW_CONTACT_JSON inviteExpiry must be a date written YYYY-MM-DD (value not shown)');
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (day < today) throw new Error('ASC_REVIEW_CONTACT_JSON inviteExpiry has already passed: make a fresh invite link (value not shown)');
  if (day > today + 8 * DAY_MS) throw new Error('ASC_REVIEW_CONTACT_JSON inviteExpiry is more than 7 days away, but an invite link lasts 7 days (IAM-R18): check the date (value not shown)');
  const d = new Date(day);
  const written = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  const { inviteLink: linkSlot, inviteExpiry: expirySlot } = appReviewCopy.placeholders;
  const notes = appReviewCopy.notesServersOn.split(linkSlot).join(link).split(expirySlot).join(written);
  if (notes.includes(linkSlot) || notes.includes(expirySlot)) throw new Error('The servers-on review notes still hold a placeholder after filling');
  if (NO_SIGN_IN.test(notes)) throw new Error('The review notes say there is no sign-in or account, but the production build has server features on (BL-341)');
  if (new TextEncoder().encode(notes).length > NOTES_MAX_BYTES) throw new Error('The filled review notes are over the 4,000 byte limit of App Store Connect');
  return notes;
}

export function withReviewContact(config: Record<string, unknown>, raw: string | undefined, serverFeatures: string | undefined, now: Date = new Date()) {
  if (serverFeatures !== 'on' && serverFeatures !== 'off') {
    throw new Error('EXPO_PUBLIC_SERVER_FEATURES in the production profile must be "on" or "off"; anything else is refused (fail closed)');
  }
  if (!raw) throw new Error('ASC_REVIEW_CONTACT_JSON is not set');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('ASC_REVIEW_CONTACT_JSON is not valid JSON (value not shown)');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('ASC_REVIEW_CONTACT_JSON must be a JSON object (value not shown)');
  }
  const { copyright, inviteLink, inviteExpiry, ...review } = parsed as Record<string, unknown>;
  const fields: Record<string, unknown> = { ...review, copyright };
  const missing = REQUIRED.filter((k) => typeof fields[k] !== 'string' || !(fields[k] as string).trim());
  if (missing.length) throw new Error(`ASC_REVIEW_CONTACT_JSON is missing ${missing.join(', ')}`);
  if (!/^\+[0-9][0-9 ()-]{6,}$/.test((review.phone as string).trim())) {
    throw new Error('ASC_REVIEW_CONTACT_JSON phone must be international format starting with "+" (value not shown)');
  }
  const apple = (config.apple ?? {}) as Record<string, unknown>;
  if (serverFeatures === 'on') {
    // Sign in with Apple, no shared credential: a demo user name or password in the secret is refused, not sent.
    const refused = ['demoUsername', 'demoPassword', 'notes'].filter((k) => k in review);
    if (refused.length) {
      throw new Error(`The production build has sign-in (server features on) and is reviewed with Sign in with Apple and an invite link: remove ${refused.join(', ')} from ASC_REVIEW_CONTACT_JSON`);
    }
    const notes = serversOnNotes(inviteLink, inviteExpiry, now);
    return { ...config, apple: { ...apple, copyright, review: { ...review, demoRequired: false, notes } } };
  }
  if (inviteLink !== undefined || inviteExpiry !== undefined) {
    throw new Error('ASC_REVIEW_CONTACT_JSON has inviteLink or inviteExpiry, but the production build has server features off; remove them (values not shown)');
  }
  const notes = typeof review.notes === 'string' ? review.notes : REVIEW_NOTES;
  return { ...config, apple: { ...apple, copyright, review: { ...review, notes } } };
}

if (process.argv[1]?.endsWith('with-review-contact.ts')) {
  const config = JSON.parse(readFileSync(STORE_CONFIG_PATH, 'utf8'));
  writeFileSync(STORE_CONFIG_PATH, `${JSON.stringify(withReviewContact(config, process.env.REVIEW, productionServerFeatures()), null, 2)}\n`);
  console.log('review contact added (values not printed)');
}
