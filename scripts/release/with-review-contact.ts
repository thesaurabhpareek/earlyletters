// Adds the App Review contact, any demo account and the copyright line to apps/mobile/store.config.json inside the release
// workflow only (job `metadata`), from the ASC_REVIEW_CONTACT_JSON secret in $REVIEW. The file on disk in
// CI is thrown away after the push; the committed file never holds these details (ADR 0022, D-089).
//
// Secret shape (EAS Metadata `apple.review`, https://docs.expo.dev/eas/metadata/schema/, 3 Oct 2026):
//   {"firstName","lastName","email","phone","copyright","demoUsername"?,"demoPassword"?,"demoRequired"?,"notes"?}
// `phone` is in international format with a leading "+" (App Store Connect refuses digits only).
// `copyright` (for example "2026 <publisher's legal name>") goes to `apple.copyright`. It is in the secret because the
// individual publisher's name is never in code (packages/brand, D-004).
// A build with server features on has sign-in (D-100), so App Review needs a working demo account (guideline 2.1):
// the secret must then carry `demoUsername` and `demoPassword` (Asha only), and the notes must not say there is no sign-in.
// `notes` defaults to the review notes below, so the 5.1.1(ix) positioning (D-004) is always sent.
// Errors never echo the secret: a parse failure reports a fixed message, and missing fields are named, not shown.
import { readFileSync, writeFileSync } from 'node:fs';
import { storeListing } from '../../packages/content/src/store.en';
import { productionServerFeatures, STORE_CONFIG_PATH } from './store-config';

const REQUIRED = ['firstName', 'lastName', 'email', 'phone', 'copyright'] as const;

/** Guideline 2.1 and D-004: the reviewer notes live with every other store word in packages/content. */
export const REVIEW_NOTES = storeListing.reviewNotes;

/** Words that describe an on-device build; wrong in the notes of a build with sign-in. */
const NO_SIGN_IN = /\bno (sign-in|sign in|account)\b/i;

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
  const { copyright, ...review } = parsed as Record<string, unknown>;
  const fields: Record<string, unknown> = { ...review, copyright };
  const missing = REQUIRED.filter((k) => typeof fields[k] !== 'string' || !(fields[k] as string).trim());
  if (missing.length) throw new Error(`ASC_REVIEW_CONTACT_JSON is missing ${missing.join(', ')}`);
  if (!/^\+[0-9][0-9 ()-]{6,}$/.test((review.phone as string).trim())) {
    throw new Error('ASC_REVIEW_CONTACT_JSON phone must be international format starting with "+" (value not shown)');
  }
  const notes = typeof review.notes === 'string' ? review.notes : REVIEW_NOTES;
  if (serverFeatures === 'on') {
    const demo = ['demoUsername', 'demoPassword'].filter((k) => typeof review[k] !== 'string' || !(review[k] as string).trim());
    if (demo.length) throw new Error(`The production build has sign-in (server features on): ASC_REVIEW_CONTACT_JSON is missing ${demo.join(', ')}`);
    if (NO_SIGN_IN.test(notes)) throw new Error('The review notes say there is no sign-in or account, but the production build has server features on (BL-341)');
  }
  const apple = (config.apple ?? {}) as Record<string, unknown>;
  const reviewOut = serverFeatures === 'on' ? { ...review, demoRequired: true, notes } : { ...review, notes };
  return { ...config, apple: { ...apple, copyright, review: reviewOut } };
}

if (process.argv[1]?.endsWith('with-review-contact.ts')) {
  const config = JSON.parse(readFileSync(STORE_CONFIG_PATH, 'utf8'));
  writeFileSync(STORE_CONFIG_PATH, `${JSON.stringify(withReviewContact(config, process.env.REVIEW, productionServerFeatures()), null, 2)}\n`);
  console.log('review contact added (values not printed)');
}
