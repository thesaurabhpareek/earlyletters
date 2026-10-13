/// <reference types="node" />
/**
 * Release identity (ADR 0022, D-089): the version comes only from version.json, build numbers only from
 * EAS, and the EAS Metadata file matches packages/content.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import appConfig from '../app.config';
import {
  buildStoreConfig,
  FIRST_VERSION,
  listingProblems,
  productionServerFeatures,
  readAppVersion,
  renderStoreConfig,
  STORE_CONFIG_PATH,
} from '../../../scripts/release/store-config';
import { storeListing } from '../../../packages/content/src/store.en';
import { REVIEW_NOTES, withReviewContact } from '../../../scripts/release/with-review-contact';

const APP = join(__dirname, '..');
const config = () => appConfig({ config: {} } as Parameters<typeof appConfig>[0]);

describe('version and build number', () => {
  it('takes the marketing version from version.json only', () => {
    const { version } = JSON.parse(readFileSync(join(APP, 'version.json'), 'utf8'));
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(config().version).toBe(version);
    expect(readFileSync(join(APP, 'app.config.ts'), 'utf8')).not.toMatch(/version:\s*['"]\d/);
  });

  it('never sets a build number by hand; EAS remote versioning owns it', () => {
    const c = config();
    expect(c.ios?.buildNumber).toBeUndefined();
    expect(c.android?.versionCode).toBeUndefined();
    const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8'));
    expect(eas.cli.appVersionSource).toBe('remote');
    expect(eas.build.production.autoIncrement).toBe(true);
  });
});

describe('store.config.json (EAS Metadata)', () => {
  it('is up to date with packages/content and version.json', () => {
    expect(readFileSync(STORE_CONFIG_PATH, 'utf8')).toBe(renderStoreConfig());
  });

  it('never carries reviewer contact or demo credentials', () => {
    expect(JSON.parse(readFileSync(STORE_CONFIG_PATH, 'utf8')).apple.review).toBeUndefined();
  });

  it('has no release notes and no phased release for the first version', () => {
    const c = buildStoreConfig(FIRST_VERSION);
    expect(c.apple.info['en-US']).not.toHaveProperty('releaseNotes');
    expect(c.apple.release).toEqual({ automaticRelease: false, phasedRelease: false });
  });

  it('refuses a later version without release notes, and uses them when present', () => {
    expect(() => buildStoreConfig('1.1.0')).toThrow(/release notes for 1\.1\.0/);
    const withNotes = { ...storeListing, releaseNotes: { '1.1.0': 'Small fixes.' } };
    const c = buildStoreConfig('1.1.0', withNotes);
    expect(c.apple.info['en-US']).toMatchObject({ releaseNotes: 'Small fixes.' });
    expect(c.apple.release.phasedRelease).toBe(true);
  });

  it('keeps the category out of Health and Medical (D-004)', () => {
    expect(buildStoreConfig(readAppVersion()).apple.categories).toEqual(['LIFESTYLE']);
  });

  it('reads the server switch from the production build profile', () => {
    expect(['on', 'off', undefined]).toContain(productionServerFeatures());
  });

  it('refuses sharing promises while server features are off, and allows them when on (BL-440)', () => {
    const sharing = { ...storeListing, description: 'Invite your co-parent. WRITE IT TOGETHER.' };
    const plain = { ...storeListing, description: 'Talk for a minute. It becomes a letter.', promotionalText: 'Kept as you said it.' };
    expect(listingProblems('off', sharing).length).toBeGreaterThanOrEqual(3);
    expect(listingProblems(undefined, sharing).length).toBeGreaterThan(0);
    expect(listingProblems('on', sharing)).toEqual([]);
    expect(listingProblems('off', plain)).toEqual([]);
  });
});

describe('App Review contact (added in CI only)', () => {
  const contact = { firstName: 'Asha', lastName: 'Reviewer', email: 'review@earlyletters.com', phone: '+1 555 0100', demoRequired: false };

  it('adds the contact and default notes without touching the listing', () => {
    const base = buildStoreConfig(FIRST_VERSION);
    const out = withReviewContact(base, JSON.stringify(contact)) as { apple: { review: unknown; info: unknown } };
    expect(out.apple.review).toMatchObject({ ...contact, notes: REVIEW_NOTES });
    expect(out.apple.info).toEqual(base.apple.info);
  });

  it('fails loudly when the secret is missing or incomplete', () => {
    expect(() => withReviewContact({}, undefined)).toThrow(/not set/);
    expect(() => withReviewContact({}, JSON.stringify({ firstName: 'A' }))).toThrow(/lastName, email, phone/);
  });

  it('keeps review notes within the App Store Connect limit (4,000 bytes)', () => {
    expect(new TextEncoder().encode(REVIEW_NOTES).length).toBeLessThanOrEqual(4000);
  });
});
