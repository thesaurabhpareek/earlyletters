// Adds the App Review contact, any demo account and the copyright line to apps/mobile/store.config.json inside the release
// workflow only (job `metadata`), from the ASC_REVIEW_CONTACT_JSON secret in $REVIEW. The file on disk in
// CI is thrown away after the push; the committed file never holds these details (ADR 0022, D-089).
//
// Secret shape (EAS Metadata `apple.review`, https://docs.expo.dev/eas/metadata/schema/, 3 Oct 2026):
//   {"firstName","lastName","email","phone","copyright","demoUsername"?,"demoPassword"?,"demoRequired"?,"notes"?}
// `phone` is in international format with a leading "+" (App Store Connect refuses digits only).
// `copyright` (for example "2026 <publisher's legal name>") goes to `apple.copyright`. It is in the secret because the
// individual publisher's name is never in code (packages/brand, D-004).
// A build with server features on has required sign-in (D-157, D-160). Its review path is a dedicated demo account
// (PROPOSED; the founder decides, NX-05), so for that build:
//   - the secret carries `demoUsername` (the demo email address) and `demoPassword` (the password of the mailbox that
//     receives the sign-in code; the app itself has no password sign-in). Both are filled into the notes' {demoEmail} and
//     {demoPassword} and sent as the App Store Connect sign-in fields, with `demoRequired` true;
//   - it must NOT carry `notes`, and not the old `inviteLink` / `inviteExpiry` (the "I was invited" button is hidden in
//     the store build, B12-5);
//   - the notes are `appReviewCopy.notesServersOn` with the two placeholders filled.
// UNVERIFIED: how App Review treats a demo account whose sign-in goes through a mailbox.
// A servers-off build keeps `storeListing.reviewNotes`, so the 5.1.1(ix) positioning (D-004) is always sent.
// The demo credentials exist only in the secret and in the CI copy of store.config.json, never in the repository, a log
// or an error message.
// Errors never echo the secret: a parse failure reports a fixed message, and missing fields are named, not shown.
import { readFileSync, writeFileSync } from 'node:fs';
import { appReviewCopy } from '../../packages/content/src/release/app-review.en';
import { storeListing } from '../../packages/content/src/store.en';
import { productionServerFeatures, STORE_CONFIG_PATH } from './store-config';

const REQUIRED = ['firstName', 'lastName', 'email', 'phone', 'copyright'] as const;

/** Guideline 2.1 and D-004: the reviewer notes live with every other store word in packages/content. */
export const REVIEW_NOTES = storeListing.reviewNotes;

/** Words that describe an on-device build; wrong in the notes of a build with sign-in. */
const NO_SIGN_IN = /\bno (sign-in|sign in|account)\b/i;

/** App Store Connect: Notes for Review hold at most 4,000 bytes. */
const NOTES_MAX_BYTES = 4000;

/**
 * The review notes of a servers-on build: `appReviewCopy.notesServersOn` with the demo email and password filled.
 * Throws a fixed message that never contains either value.
 */
export function serversOnNotes(demoUsername: unknown, demoPassword: unknown): string {
  for (const [name, v] of [['demoUsername', demoUsername], ['demoPassword', demoPassword]] as const) {
    if (typeof v !== 'string' || !v.trim()) {
      throw new Error(`The production build has sign-in (server features on): ASC_REVIEW_CONTACT_JSON is missing ${name}`);
    }
  }
  const email = (demoUsername as string).trim();
  const password = (demoPassword as string).trim();
  if (/\s/.test(email) || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('ASC_REVIEW_CONTACT_JSON demoUsername must be one email address (value not shown)');
  }
  const { demoEmail: emailSlot, demoPassword: passwordSlot } = appReviewCopy.placeholders;
  // Split and join, never a replace pattern: a "$" in a password must stay as typed.
  const notes = appReviewCopy.notesServersOn.split(emailSlot).join(email).split(passwordSlot).join(password);
  if (notes.includes(emailSlot) || notes.includes(passwordSlot)) throw new Error('The servers-on review notes still hold a placeholder after filling');
  if (NO_SIGN_IN.test(notes)) throw new Error('The review notes say there is no sign-in or account, but the production build has server features on (BL-341)');
  if (new TextEncoder().encode(notes).length > NOTES_MAX_BYTES) throw new Error('The filled review notes are over the 4,000 byte limit of App Store Connect');
  return notes;
}

export function withReviewContact(config: Record<string, unknown>, raw: string | undefined, serverFeatures: string | undefined) {
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
  const { copyright, inviteLink, inviteExpiry, demoUsername, demoPassword, ...review } = parsed as Record<string, unknown>;
  const fields: Record<string, unknown> = { ...review, copyright };
  const missing = REQUIRED.filter((k) => typeof fields[k] !== 'string' || !(fields[k] as string).trim());
  if (missing.length) throw new Error(`ASC_REVIEW_CONTACT_JSON is missing ${missing.join(', ')}`);
  if (!/^\+[0-9][0-9 ()-]{6,}$/.test((review.phone as string).trim())) {
    throw new Error('ASC_REVIEW_CONTACT_JSON phone must be international format starting with "+" (value not shown)');
  }
  const apple = (config.apple ?? {}) as Record<string, unknown>;
  if (serverFeatures === 'on') {
    // The review path is a demo account. A custom `notes` or an old invite link is refused, not sent.
    const refused = [['notes', 'notes' in review], ['inviteLink', inviteLink !== undefined], ['inviteExpiry', inviteExpiry !== undefined]].filter(([, on]) => on).map(([k]) => k);
    if (refused.length) {
      throw new Error(`The production build has sign-in (server features on) and is reviewed with a demo account: remove ${refused.join(', ')} from ASC_REVIEW_CONTACT_JSON`);
    }
    const notes = serversOnNotes(demoUsername, demoPassword);
    const username = (demoUsername as string).trim();
    const password = (demoPassword as string).trim();
    return { ...config, apple: { ...apple, copyright, review: { ...review, demoRequired: true, demoUsername: username, demoPassword: password, notes } } };
  }
  if (inviteLink !== undefined || inviteExpiry !== undefined) {
    throw new Error('ASC_REVIEW_CONTACT_JSON has inviteLink or inviteExpiry, but the production build has server features off; remove them (values not shown)');
  }
  const notes = typeof review.notes === 'string' ? review.notes : REVIEW_NOTES;
  const demo = { ...(demoUsername !== undefined ? { demoUsername } : {}), ...(demoPassword !== undefined ? { demoPassword } : {}) };
  return { ...config, apple: { ...apple, copyright, review: { ...review, ...demo, notes } } };
}

if (process.argv[1]?.endsWith('with-review-contact.ts')) {
  const config = JSON.parse(readFileSync(STORE_CONFIG_PATH, 'utf8'));
  writeFileSync(STORE_CONFIG_PATH, `${JSON.stringify(withReviewContact(config, process.env.REVIEW, productionServerFeatures()), null, 2)}\n`);
  console.log('review contact added (values not printed)');
}
