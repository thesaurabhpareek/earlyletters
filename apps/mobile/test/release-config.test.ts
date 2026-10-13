/// <reference types="node" />
/**
 * Release identity (ADR 0022, D-089): the version comes only from version.json, build numbers only from
 * EAS, and the EAS Metadata file matches packages/content.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import appConfig from '../app.config';
import { buildStoreConfig, FIRST_VERSION, readAppVersion, renderStoreConfig, STORE_CONFIG_PATH } from '../../../scripts/release/store-config';
import { storeListing } from '../../../packages/content/src/store.en';

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
});
