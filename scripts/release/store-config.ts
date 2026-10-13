// Generates apps/mobile/store.config.json (EAS Metadata, `eas metadata:push`) from packages/content and
// apps/mobile/version.json (ADR 0022, D-089; schema https://docs.expo.dev/eas/metadata/schema/, 3 Oct 2026).
//
//   npx tsx scripts/release/store-config.ts           # write the file
//   npx tsx scripts/release/store-config.ts --check   # exit 1 if the committed file is stale
//
// Never edit store.config.json by hand: edit packages/content/src/store.en.ts and rerun.
// The App Review contact and demo account are NOT in this file. The release workflow adds them at push
// time from the ASC_REVIEW_CONTACT_JSON secret, so no personal details or credentials reach the repo.
// EAS Metadata cannot upload screenshots: they come from scripts/brand/screenshots.mts, uploaded by hand.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storeListing } from '../../packages/content/src/store.en';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const STORE_CONFIG_PATH = join(ROOT, 'apps', 'mobile', 'store.config.json');
const VERSION_PATH = join(ROOT, 'apps', 'mobile', 'version.json');

/** The first version has no What's New field in App Store Connect and cannot use phased release. */
export const FIRST_VERSION = '1.0.0';

/** App Store Connect category ids for the categories the listing may use (D-004: never Health or Medical). */
const CATEGORY_IDS: Record<string, string> = { Lifestyle: 'LIFESTYLE' };

type Listing = typeof storeListing & { releaseNotes?: Record<string, string> };

export function readAppVersion(): string {
  return (JSON.parse(readFileSync(VERSION_PATH, 'utf8')) as { version: string }).version;
}

export function buildStoreConfig(version: string, listing: Listing = storeListing) {
  const category = CATEGORY_IDS[listing.primaryCategory];
  if (!category) throw new Error(`No App Store Connect category id for "${listing.primaryCategory}"`);
  const first = version === FIRST_VERSION;
  const releaseNotes = listing.releaseNotes?.[version];
  if (!first && !releaseNotes) {
    throw new Error(`No release notes for ${version}: add storeListing.releaseNotes['${version}'] in packages/content (D-089)`);
  }
  return {
    configVersion: 0,
    apple: {
      info: {
        'en-US': {
          title: listing.appName,
          subtitle: listing.subtitle,
          description: listing.description,
          keywords: listing.keywords.split(','),
          ...(first ? {} : { releaseNotes }),
          promoText: listing.promotionalText,
          marketingUrl: listing.marketingUrl,
          supportUrl: listing.supportUrl,
          privacyPolicyUrl: listing.privacyPolicyUrl,
        },
      },
      categories: [category],
      // Manual release always; phased release for every update (Apple offers it only for updates).
      release: { automaticRelease: false, phasedRelease: !first },
    },
  };
}

export function renderStoreConfig(version = readAppVersion()): string {
  return `${JSON.stringify(buildStoreConfig(version), null, 2)}\n`;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const next = renderStoreConfig();
  if (process.argv.includes('--check')) {
    let current = '';
    try {
      current = readFileSync(STORE_CONFIG_PATH, 'utf8');
    } catch {
      // missing counts as stale
    }
    if (current !== next) {
      console.error('apps/mobile/store.config.json is stale: run npx tsx scripts/release/store-config.ts');
      process.exit(1);
    }
  } else {
    writeFileSync(STORE_CONFIG_PATH, next);
    console.log(`wrote ${STORE_CONFIG_PATH}`);
  }
}
