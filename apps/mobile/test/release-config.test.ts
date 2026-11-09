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
import { parseInviteInput } from '../src/lib/family/invite-link.logic';

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

  describe('a servers-on build is reviewed with Sign in with Apple and a pasted invite link (CTO ruling 8 Nov 2026)', () => {
    // Fictional only (CLAUDE.md): the token is made up and never a real invite; the date is a made-up day.
    const NOW = new Date('2026-11-09T12:00:00Z');
    const TOKEN = 'ashaAshaashaAshaashaAshaashaAshaashaAsha';
    const LINK = `${brand.web.origin}/j#t=${TOKEN}`;
    const on = { ...secret, inviteLink: LINK, inviteExpiry: '2026-11-15' };
    const send = (extra: Record<string, unknown>, now = NOW) => withReviewContact({}, JSON.stringify({ ...on, ...extra }), 'on', now) as unknown as { apple: { review: Record<string, unknown> } };
    const fails = (extra: Record<string, unknown>, now = NOW) => {
      try {
        send(extra, now);
      } catch (e) {
        return (e as Error).message;
      }
      throw new Error('expected a refusal');
    };

    it('sends notesServersOn with the link and the date filled, demoRequired false and no demo credential', () => {
      const r = send({}).apple.review;
      expect(r.demoRequired).toBe(false);
      expect(r).not.toHaveProperty('demoUsername');
      expect(r).not.toHaveProperty('demoPassword');
      expect(r).not.toHaveProperty('inviteLink');
      expect(r).not.toHaveProperty('inviteExpiry');
      expect(r).toMatchObject({ firstName: 'Asha', email: 'review@earlyletters.com' });
      const notes = r.notes as string;
      expect(notes).toBe(appReviewCopy.notesServersOn.split('{inviteLink}').join(LINK).split('{inviteExpiry}').join('15 November 2026'));
      expect(notes).toContain(`Continue: ${LINK}`);
      expect(notes).toContain('until 15 November 2026');
      expect(notes).not.toMatch(/\{invite/);
      expect(notes).toContain('no demo user name or password');
      expect(new TextEncoder().encode(notes).length).toBeLessThanOrEqual(4000);
    });

    it('accepts only a link the app itself reads: the check is the app\'s parseInviteUrl, not a code format', () => {
      expect(parseInviteInput(LINK, brand.web.origin)).toBe(TOKEN);
      expect(() => send({ inviteLink: `https://www.${brand.web.origin.replace('https://', '')}/j#t=${TOKEN}` })).not.toThrow();
      for (const bad of [
        '7K3M9PQR', // a typed 8-character code: this build says "not recognised"
        'ASHA-7K3M-9PQR',
        TOKEN, // a bare token is read by the app, but the notes say "Paste this invite link"
        `${brand.web.origin}/j?t=${TOKEN}`, // the query is never read
        `http://${brand.web.origin.replace('https://', '')}/j#t=${TOKEN}`,
        `https://example.org/j#t=${TOKEN}`,
        `${brand.web.origin}/i/${TOKEN}`,
        `${LINK} and some words`,
        `${brand.web.origin}/j#t=short`,
        '',
        '   ',
      ]) {
        const m = fails({ inviteLink: bad });
        expect(m).toMatch(/inviteLink/);
        if (bad.trim()) expect(m).not.toContain(bad.trim());
        expect(m).not.toContain(TOKEN);
      }
      expect(fails({ inviteLink: undefined })).toMatch(/missing inviteLink/);
      expect(fails({ inviteLink: 12345 })).toMatch(/missing inviteLink/);
    });

    it('checks the expiry date: a real day, not past, no more than 8 days ahead (7 plus a day of slack)', () => {
      expect(send({ inviteExpiry: '2026-11-09' }).apple.review.notes).toContain('until 9 November 2026');
      expect(send({ inviteExpiry: '2026-11-17' }).apple.review.notes).toContain('until 17 November 2026');
      for (const bad of ['', 'tomorrow', '15/11/2026', '2026-11-31', '2026-02-30', '2026-13-01']) expect(fails({ inviteExpiry: bad })).toMatch(/inviteExpiry/);
      expect(fails({ inviteExpiry: '2026-11-08' })).toMatch(/already passed/);
      expect(fails({ inviteExpiry: '2026-11-18' })).toMatch(/more than 8 days away/);
      expect(fails({ inviteExpiry: undefined })).toMatch(/missing inviteExpiry/);
      // never echoes the date or the link
      expect(fails({ inviteExpiry: '2026-11-18' })).not.toContain('2026-11-18');
      expect(fails({ inviteLink: 'nonsense' })).not.toContain(TOKEN);
    });

    it('refuses a shared sign-in credential and a notes override: Sign in with Apple needs neither', () => {
      expect(fails({ demoUsername: 'asha.reviewer@example.org' })).toMatch(/remove demoUsername/);
      expect(fails({ demoPassword: 'fictional-only' })).toMatch(/remove demoPassword/);
      expect(fails({ notes: 'There is no sign-in.' })).toMatch(/remove notes/);
      expect(fails({ demoUsername: 'a', demoPassword: 'b', notes: 'c' })).toMatch(/demoUsername, demoPassword, notes/);
    });

    it('a servers-off build keeps the servers-off notes and refuses a stray invite link', () => {
      const off = withReviewContact({}, JSON.stringify(secret), 'off') as unknown as { apple: { review: Record<string, unknown> } };
      expect(off.apple.review.notes).toBe(REVIEW_NOTES);
      expect(off.apple.review.notes).not.toContain('invite link');
      expect(() => withReviewContact({}, JSON.stringify(on), 'off')).toThrow(/server features off/);
      expect(() => withReviewContact({}, JSON.stringify({ ...secret, notes: 'Custom notes.' }), 'off')).not.toThrow();
    });

    it('fails closed on an unset or odd switch before any of this', () => {
      expect(() => withReviewContact({}, JSON.stringify(on), undefined, NOW)).toThrow(/must be "on" or "off"/);
      expect(() => withReviewContact({}, JSON.stringify(on), 'maybe', NOW)).toThrow(/must be "on" or "off"/);
    });

    it('serversOnNotes leaves no placeholder and keeps the copy it was given', () => {
      const notes = serversOnNotes(LINK, '2026-11-12', NOW);
      expect(notes.replace(LINK, '').replace('12 November 2026', '')).toBe(appReviewCopy.notesServersOn.replace('{inviteLink}', '').replace('{inviteExpiry}', ''));
    });
  });

  it('keeps review notes within the App Store Connect limit (4,000 bytes)', () => {
    expect(new TextEncoder().encode(REVIEW_NOTES).length).toBeLessThanOrEqual(4000);
  });
});
