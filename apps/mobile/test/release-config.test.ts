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
import { REVIEW_NOTES, serversOnNotes, withReviewContact } from '../../../scripts/release/with-review-contact';
import { appReviewCopy } from '../../../packages/content/src/release/app-review.en';
import { brand } from '../../../packages/brand';

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

describe('TestFlight submit profiles (founder, 8 Nov 2026)', () => {
  it('adds every preview-record build to the internal group "Family", and leaves production alone', () => {
    const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8'));
    for (const profile of ['testflight', 'preview']) {
      expect(eas.submit[profile].ios.groups).toEqual(['Family']);
      expect(eas.submit[profile].ios.ascAppId).toMatch(/^\d+$/);
      expect(eas.submit[profile].ios).not.toHaveProperty('appleTeamId');
    }
    expect(eas.submit.production.ios?.groups).toBeUndefined();
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
  const secret = { ...contact, copyright: '2026 Asha Reviewer' };

  it('adds the contact, default notes and copyright without touching the listing', () => {
    const base = buildStoreConfig(FIRST_VERSION);
    const out = withReviewContact(base, JSON.stringify(secret), 'off') as unknown as { apple: { review: Record<string, unknown>; info: unknown; copyright: unknown } };
    expect(out.apple.review).toMatchObject({ ...contact, notes: REVIEW_NOTES });
    expect(out.apple.review.copyright).toBeUndefined();
    expect(out.apple.copyright).toBe('2026 Asha Reviewer');
    expect(out.apple.info).toEqual(base.apple.info);
  });

  it('fails loudly when the secret is missing or incomplete', () => {
    expect(() => withReviewContact({}, undefined, 'off')).toThrow(/not set/);
    expect(() => withReviewContact({}, JSON.stringify({ firstName: 'A' }), 'off')).toThrow(/lastName, email, phone, copyright/);
  });

  it('never echoes a malformed secret', () => {
    const raw = 'firstName: Asha Reviewer, phone 555 0100';
    let message = '';
    try {
      withReviewContact({}, raw, 'off');
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).toMatch(/not valid JSON/);
    expect(message).not.toContain('Asha');
    expect(message).not.toContain('555');
    expect(() => withReviewContact({}, '[1]', 'off')).toThrow(/JSON object/);
  });

  it('requires an international phone number with a leading plus', () => {
    expect(() => withReviewContact({}, JSON.stringify({ ...secret, phone: '5550100' }), 'off')).toThrow(/starting with "\+"/);
    expect(() => withReviewContact({}, JSON.stringify({ ...secret, phone: '+1 (555) 010-0100' }), 'off')).not.toThrow();
  });

  describe('a servers-on build is reviewed with a dedicated demo account (D-160: sign-in is required)', () => {
    // Fictional only (CLAUDE.md): made-up address and password, never a real account.
    const EMAIL = 'asha.reviewer@example.org';
    const PASSWORD = 'fictional$&only-1';
    const on = { ...secret, demoUsername: EMAIL, demoPassword: PASSWORD };
    const send = (extra: Record<string, unknown>) => withReviewContact({}, JSON.stringify({ ...on, ...extra }), 'on') as unknown as { apple: { review: Record<string, unknown> } };
    const fails = (extra: Record<string, unknown>) => {
      try {
        send(extra);
      } catch (e) {
        return (e as Error).message;
      }
      throw new Error('expected a refusal');
    };

    it('sends notesServersOn with the email and password filled, and the demo account as the sign-in fields', () => {
      const r = send({}).apple.review;
      expect(r).toMatchObject({ firstName: 'Asha', email: 'review@earlyletters.com', demoRequired: true, demoUsername: EMAIL, demoPassword: PASSWORD });
      const notes = r.notes as string;
      expect(notes).toBe(appReviewCopy.notesServersOn.split('{demoEmail}').join(EMAIL).split('{demoPassword}').join(PASSWORD));
      expect(notes).toContain(`Email: ${EMAIL}`);
      expect(notes).toContain(`Password: ${PASSWORD}`);
      expect(notes).not.toMatch(/\{demo/);
      expect(notes).not.toContain('I was invited');
      expect(new TextEncoder().encode(notes).length).toBeLessThanOrEqual(4000);
    });

    it('keeps the placeholders in the committed copy, never a credential', () => {
      expect(appReviewCopy.notesServersOn).toContain('{demoEmail}');
      expect(appReviewCopy.notesServersOn).toContain('{demoPassword}');
      expect(appReviewCopy.notesServersOn).not.toContain(EMAIL);
    });

    it('names the missing field and never echoes either value', () => {
      expect(fails({ demoUsername: undefined })).toMatch(/missing demoUsername/);
      expect(fails({ demoPassword: undefined })).toMatch(/missing demoPassword/);
      expect(fails({ demoPassword: '  ' })).toMatch(/missing demoPassword/);
      for (const bad of ['not an address', 'two words@example.org', 'a@b']) {
        const m = fails({ demoUsername: bad });
        expect(m).toMatch(/demoUsername/);
        expect(m).not.toContain(bad);
      }
      expect(fails({ demoUsername: 'nonsense' })).not.toContain(PASSWORD);
    });

    it('refuses the old invite-link path and a notes override', () => {
      expect(fails({ inviteLink: `${brand.web.origin}/j#t=ashaAshaashaAsha` })).toMatch(/remove inviteLink/);
      expect(fails({ inviteExpiry: '2026-11-15' })).toMatch(/remove inviteExpiry/);
      expect(fails({ notes: 'There is no sign-in.' })).toMatch(/remove notes/);
      expect(fails({ notes: 'c', inviteLink: 'x' })).toMatch(/notes, inviteLink/);
    });

    it('a servers-off build keeps the servers-off notes and refuses a stray invite link', () => {
      const off = withReviewContact({}, JSON.stringify(secret), 'off') as unknown as { apple: { review: Record<string, unknown> } };
      expect(off.apple.review.notes).toBe(REVIEW_NOTES);
      expect(() => withReviewContact({}, JSON.stringify({ ...secret, inviteLink: 'x' }), 'off')).toThrow(/server features off/);
      expect(() => withReviewContact({}, JSON.stringify({ ...secret, notes: 'Custom notes.' }), 'off')).not.toThrow();
    });

    it('fails closed on an unset or odd switch before any of this', () => {
      expect(() => withReviewContact({}, JSON.stringify(on), undefined)).toThrow(/must be "on" or "off"/);
      expect(() => withReviewContact({}, JSON.stringify(on), 'maybe')).toThrow(/must be "on" or "off"/);
    });

    it('serversOnNotes leaves no placeholder and keeps the copy it was given', () => {
      const notes = serversOnNotes(EMAIL, PASSWORD);
      expect(notes.replace(EMAIL, '').replace(PASSWORD, '')).toBe(appReviewCopy.notesServersOn.replace('{demoEmail}', '').replace('{demoPassword}', ''));
    });
  });

  it('keeps review notes within the App Store Connect limit (4,000 bytes)', () => {
    expect(new TextEncoder().encode(REVIEW_NOTES).length).toBeLessThanOrEqual(4000);
  });
});
