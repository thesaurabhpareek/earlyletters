// Adds the App Review contact and demo account to apps/mobile/store.config.json inside the release
// workflow only (job `metadata`), from the ASC_REVIEW_CONTACT_JSON secret in $REVIEW. The file on disk in
// CI is thrown away after the push; the committed file never holds these details (ADR 0022, D-089).
//
// Secret shape (EAS Metadata `apple.review`, https://docs.expo.dev/eas/metadata/schema/, 3 Oct 2026):
//   {"firstName","lastName","email","phone","demoUsername","demoPassword","demoRequired","notes"?}
// `notes` defaults to the review notes below, so the 5.1.1(ix) positioning (D-004) is always sent.
import { readFileSync, writeFileSync } from 'node:fs';
import { storeListing } from '../../packages/content/src/store.en';
import { STORE_CONFIG_PATH } from './store-config';

const REQUIRED = ['firstName', 'lastName', 'email', 'phone'] as const;

/** Guideline 2.1 and D-004: the reviewer notes live with every other store word in packages/content. */
export const REVIEW_NOTES = storeListing.reviewNotes;

export function withReviewContact(config: Record<string, unknown>, raw: string | undefined) {
  if (!raw) throw new Error('ASC_REVIEW_CONTACT_JSON is not set');
  const review = JSON.parse(raw) as Record<string, unknown>;
  const missing = REQUIRED.filter((k) => typeof review[k] !== 'string' || !(review[k] as string).trim());
  if (missing.length) throw new Error(`ASC_REVIEW_CONTACT_JSON is missing ${missing.join(', ')}`);
  const apple = (config.apple ?? {}) as Record<string, unknown>;
  return { ...config, apple: { ...apple, review: { notes: REVIEW_NOTES, ...review } } };
}

if (process.argv[1]?.endsWith('with-review-contact.ts')) {
  const config = JSON.parse(readFileSync(STORE_CONFIG_PATH, 'utf8'));
  writeFileSync(STORE_CONFIG_PATH, `${JSON.stringify(withReviewContact(config, process.env.REVIEW), null, 2)}\n`);
  console.log('review contact added (values not printed)');
}
