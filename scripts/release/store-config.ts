// Generates apps/mobile/store.config.json (EAS Metadata, `eas metadata:push`) from packages/content and
// apps/mobile/version.json (ADR 0022, D-089; schema https://docs.expo.dev/eas/metadata/schema/, 3 Oct 2026).
//
//   npx tsx scripts/release/store-config.ts           # write the file
//   npx tsx scripts/release/store-config.ts --check   # exit 1 if the committed file is stale
//   npx tsx scripts/release/store-config.ts --assert-shippable  # exit 1 if the listing promises what the build switches off
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
const EAS_PATH = join(ROOT, 'apps', 'mobile', 'eas.json');

/**
 * Listing claims that need server features (sharing with a co-parent). While the production profile
 * builds with EXPO_PUBLIC_SERVER_FEATURES=off, the listing must not make them (guideline 2.3.1, BL-440).
 */
const SERVER_ONLY_CLAIMS: { label: string; pattern: RegExp }[] = [
  { label: 'an invite', pattern: /\binvit(e|es|ed|ing)\b/i },
  { label: 'a co-parent in the same book', pattern: /\bco-parent\b/i },
  { label: 'writing the book together', pattern: /\bwrite it together\b/i },
];

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

/** The value of EXPO_PUBLIC_SERVER_FEATURES in the production build profile (the store lane). */
export function productionServerFeatures(): string | undefined {
  const eas = JSON.parse(readFileSync(EAS_PATH, 'utf8')) as { build?: Record<string, { env?: Record<string, string> }> };
  return eas.build?.production?.env?.EXPO_PUBLIC_SERVER_FEATURES;
}

/** Problems that make the listing unfit to push for a build with the given server switch. Empty means shippable. */
export function listingProblems(
  serverFeatures: string | undefined,
  listing: { description: string; promotionalText: string; subtitle: string } = storeListing,
): string[] {
  if (serverFeatures === 'on') return [];
  const fields: [string, string][] = [
    ['description', listing.description],
    ['promotionalText', listing.promotionalText],
    ['subtitle', listing.subtitle],
  ];
  const problems: string[] = [];
  for (const [field, text] of fields) {
    for (const claim of SERVER_ONLY_CLAIMS) {
      if (claim.pattern.test(text)) {
        problems.push(`storeListing.${field} promises ${claim.label}, but the production build has server features off (BL-440)`);
      }
    }
  }
  return problems;
}

export function renderStoreConfig(version = readAppVersion()): string {
  return `${JSON.stringify(buildStoreConfig(version), null, 2)}\n`;
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const next = renderStoreConfig();
  if (process.argv.includes('--assert-shippable')) {
    const problems = listingProblems(productionServerFeatures());
    if (problems.length > 0) {
      for (const problem of problems) console.error(problem);
      process.exit(1);
    }
    console.log('store listing matches the production build');
  } else if (process.argv.includes('--check')) {
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
