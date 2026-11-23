// [NS-42-R7] The consent manifest: the SHA-256 of each consent text the phone shows, checked in and compared with
// the live copy, so changing a sentence without regenerating the manifest fails here (BL-577, FS-21).
// Regenerate on purpose: UPDATE_CONSENT_MANIFEST=1 npm test -w @scribe/content
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONSENT_LOCALE, CONSENT_SHOWN_IDS, consentShownText } from '../src';

const FILE = join(__dirname, '..', 'generated', 'consent-manifest.json');
const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const live = () => ({
  locale: CONSENT_LOCALE,
  entries: Object.fromEntries(CONSENT_SHOWN_IDS.map((id) => [id, sha(consentShownText(id))])),
});

if (process.env.UPDATE_CONSENT_MANIFEST === '1') writeFileSync(FILE, JSON.stringify(live(), null, 2) + '\n');

describe('consent manifest', () => {
  it('[NS-42-R7] manifest hashes equal the hashes of the words the sheets show', () => {
    expect(JSON.parse(readFileSync(FILE, 'utf8'))).toEqual(live());
  });
  it('a child name never enters a hash input', () => {
    for (const id of CONSENT_SHOWN_IDS) expect(consentShownText(id)).not.toMatch(/Asha/);
  });
  it('the shown locale is a language tag, not a constant in the phone', () => {
    expect(CONSENT_LOCALE).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
  });
});
