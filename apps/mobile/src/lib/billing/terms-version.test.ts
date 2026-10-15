/**
 * [F14-REQ-011] The Subscription Terms version shown changes when the terms document, the words next
 * to Apple's plan buttons or the acknowledgment change (D-081). When docs/legal/subscription-terms.md
 * changes, this test fails until SUBSCRIPTION_TERMS_DOC_VERSION and _SHA256 are updated with it.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { billingCopy } from '@scribe/content';
import { describe, expect, it } from 'vitest';
import { SUBSCRIPTION_TERMS_DOC_SHA256, SUBSCRIPTION_TERMS_DOC_VERSION, termsShownVersion, termsVersionOf } from './terms-version';

const DOC = join(__dirname, '..', '..', '..', '..', '..', 'docs', 'legal', 'subscription-terms.md');

describe('[F14-REQ-011] the Subscription Terms version shown', () => {
  it('pins the terms document: its version and SHA-256 match the file', () => {
    const text = readFileSync(DOC, 'utf8');
    expect(createHash('sha256').update(text).digest('hex')).toBe(SUBSCRIPTION_TERMS_DOC_SHA256);
    expect(text).toMatch(new RegExp(`^version: ${SUBSCRIPTION_TERMS_DOC_VERSION.replace(/\./g, '\\.')}$`, 'm'));
  });

  it('changes when billingCopy.store.renewal changes, or any acknowledgment line', () => {
    const base = termsVersionOf({ store: billingCopy.store, ack: billingCopy.ack });
    expect(termsShownVersion()).toBe(base);
    expect(termsVersionOf({ store: { ...billingCopy.store, renewal: `${billingCopy.store.renewal} ` }, ack: billingCopy.ack })).not.toBe(base);
    expect(termsVersionOf({ store: billingCopy.store, ack: { ...billingCopy.ack, cancelBy: 'x' } })).not.toBe(base);
  });

  it('reads as the document version plus two fingerprints, with no person or purchase in it', () => {
    expect(termsShownVersion()).toMatch(/^1\.4\.0\+[0-9a-f]{8}\.[0-9a-f]{8}$/);
  });
});
