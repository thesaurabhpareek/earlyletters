/**
 * NS-38-R2 and NS-38-R3: the App Store listing describes the build, and the store name has one source.
 * The build state is read from apps/mobile/eas.json as data (the content package imports no app code, CODE-R10).
 * Each rule is a function that returns the sentences it refuses, so a mutant (a listing with one bad sentence added)
 * can prove the rule would catch it. If a test fails, fix the listing words, not the test.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { storeListing } from '../src/store.en';

const root = fileURLToPath(new URL('../../../', import.meta.url));

type Profile = { name: string; serverFeatures: boolean; spoken: string[] };

function readProfiles(): Profile[] {
  const eas = JSON.parse(readFileSync(join(root, 'apps/mobile/eas.json'), 'utf8')) as {
    build: Record<string, { distribution?: string; env?: Record<string, string> }>;
  };
  // The profiles whose build can reach the store: the TestFlight and production ones, and the staging alpha (preview).
  return ['preview', 'testflight', 'production'].map((name) => {
    const env = eas.build[name]?.env ?? {};
    return {
      name,
      serverFeatures: env.EXPO_PUBLIC_SERVER_FEATURES === 'on',
      spoken: (env.EXPO_PUBLIC_SPOKEN_LANGUAGES ?? 'en').split(',').map((c) => c.trim()),
    };
  });
}

/** The listing fields a person reads on the page, as sentences. The review notes go to Apple only and are not here. */
type Listing = { promotionalText: string; description: string; whatsNewV1: string; keywords: string; captions: string[] };
const listingText = (l: Listing): string[] =>
  [l.promotionalText, l.description, l.whatsNewV1, l.keywords, ...l.captions]
    .join('\n')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((x) => x.trim())
    .filter(Boolean);

const real: Listing = {
  promotionalText: storeListing.promotionalText,
  description: storeListing.description,
  whatsNewV1: storeListing.whatsNewV1,
  keywords: storeListing.keywords,
  captions: [...storeListing.screenshotCaptions],
};

// Always forbidden (NS-38-R2, FS-1): the sentence would promise what the build does not do.
const ALWAYS: RegExp[] = [
  /\bno (account|sign-?up|log-?in)\b/i,
  /\bwithout (an )?(account|sign-?up|log-?in)\b.*\bneeded\b/i,
  /\bshare (it |them |the book )?with your family\b/i,
  /\bco-?parent/i,
  /\bback(ed)? ?up\b(?! (if|of)\b)/i,
  /\baccessible to everyone\b/i,
  /\binstant(ly)?\b/i,
  /\b\d+(\.\d+)?\s?%/,
  /\baccura(te|cy)\b/i,
  /\b(AI|artificial intelligence)\b/,
];
// Only for a build with server features off: nothing may promise an account, sync or sign-in.
const NEEDS_SERVERS: RegExp[] = [/\bsign(ed)?[- ]?in\b/i, /\bsync(s|ed|ing)?\b/i, /(?<!without )\b(create|make|your|an) account\b/i];
// Only for a build with server features on, where sign-in is required (D-160): a sentence that makes the account optional.
const ACCOUNT_IS_OPTIONAL: RegExp[] = [/\bwithout (an )?account\b/i, /\bwith or without (an )?account\b/i];
/**
 * PENDING words wait for the founder and are held here, not edited. None now: FP-1 ("Without an account, your book stays
 * on your phone.") was replaced by the servers-on sentences below (exec rulings 23 Nov 2026, item 8a).
 */
const PENDING_WORDS: string[] = [];
/**
 * The store listing describes the production build, which has servers on and sign-in required (D-160, D-170). These two
 * sentences name sign-in and sync, so a servers-off build (TestFlight) would refuse them under NEEDS_SERVERS; the
 * listing is not what a servers-off build ships, so they are exempt from that one rule only. The test below fails when
 * a sentence is gone, so this list cannot go stale.
 */
const SERVERS_ON_SENTENCES = [
  'You sign in to keep your book.',
  "If you agree to sync, the words of your letters and your child's name and dates are kept on our servers so they reach a new phone.",
];
const LANGUAGE_NAMES: Record<string, string> = { es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', hi: 'Hindi', zh: 'Chinese|Mandarin', en: 'English' };

/** Sentences the rule refuses for this build state. */
function violations(listing: Listing, profile: Profile): string[] {
  const refused = [...ALWAYS];
  if (!profile.serverFeatures) refused.push(...NEEDS_SERVERS);
  else refused.push(...ACCOUNT_IS_OPTIONAL);
  for (const [code, names] of Object.entries(LANGUAGE_NAMES)) {
    if (!profile.spoken.includes(code)) refused.push(new RegExp(`\\b(${names})\\b`, 'i'));
  }
  return listingText(listing).filter(
    (sentence) =>
      !PENDING_WORDS.includes(sentence) &&
      !(!profile.serverFeatures && SERVERS_ON_SENTENCES.includes(sentence)) &&
      refused.some((re) => re.test(sentence)),
  );
}

describe('[NS-38-R2] the listing describes the build', () => {
  const profiles = readProfiles();

  it('reads the three store-facing build profiles from eas.json', () => {
    expect(profiles.map((p) => p.name)).toEqual(['preview', 'testflight', 'production']);
    expect(profiles.find((p) => p.name === 'production')?.serverFeatures).toBe(true);
    expect(profiles.find((p) => p.name === 'testflight')?.serverFeatures).toBe(false);
  });

  for (const profile of profiles) {
    it(`says nothing the ${profile.name} build does not do`, () => {
      expect(violations(real, profile)).toEqual([]);
    });
  }

  it('holds each pending sentence only while it is still in the listing', () => {
    for (const sentence of [...PENDING_WORDS, ...SERVERS_ON_SENTENCES]) expect(listingText(real)).toContain(sentence);
  });

  const production = profiles.find((p) => p.name === 'production')!;
  const testflight = profiles.find((p) => p.name === 'testflight')!;

  // Mutants: one bad sentence added to the real listing must be refused. A rule that passes these without a refusal is dead.
  const mutants: Array<[string, string, Profile]> = [
    ['no account', 'No account needed.', production],
    ['an optional account', 'Use it with or without an account.', production],
    ['no sign-up', 'There is no sign-up.', production],
    ['no login', 'Open it with no login.', production],
    ['share with family', 'Share with your family in a tap.', production],
    ['backed up', 'Your recordings are backed up for you.', production],
    ['a language the build does not transcribe', 'Speak in Spanish and it writes it down.', production],
    ['accessible to everyone', 'It is accessible to everyone.', production],
    ['instant', 'Instant letters.', production],
    ['an accuracy figure', 'It is 98% right.', production],
    ['AI', 'Made with AI.', production],
    ['sign-in in a servers-off build', 'Sign in on any phone.', testflight],
    ['sync in a servers-off build', 'Your book will sync everywhere.', testflight],
  ];
  for (const [label, sentence, profile] of mutants) {
    it(`[mutant] refuses a listing that adds: ${label}`, () => {
      const mutated = { ...real, description: `${real.description}\n${sentence}` };
      expect(violations(mutated, profile)).toContain(sentence);
    });
  }

  it('[mutant] a keyword or caption is read like any other sentence', () => {
    expect(violations({ ...real, captions: [...real.captions, 'No account, ever.'] }, production)).toContain('No account, ever.');
  });
});

describe('[NS-38-R3] store name from brand', () => {
  it('is brand.storeName, "{name}: Baby Journal", and the subtitle keeps a straight apostrophe', () => {
    expect(storeListing.appName).toBe(brand.storeName);
    expect(storeListing.subtitle).toBe(brand.subtitle);
    expect(brand.storeName).toBe(`${brand.name}: Baby Journal`);
    expect(brand.subtitle).not.toMatch(/[‘’]/);
    expect(brand.storeName.length).toBeLessThanOrEqual(30);
  });

  /** Source files (not tests, not docs) that type the store name or the subtitle instead of importing them. */
  function typedElsewhere(files: Map<string, string>): string[] {
    return [...files].filter(([, text]) => text.includes(brand.storeName) || text.includes(brand.subtitle)).map(([f]) => f);
  }
  function sources(dir: string, out = new Map<string, string>()): Map<string, string> {
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'test' || entry === '__tests__') continue;
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) sources(full, out);
      else if (/\.(ts|tsx|js|json)$/.test(entry) && !/\.test\./.test(entry)) out.set(full.slice(root.length), readFileSync(full, 'utf8'));
    }
    return out;
  }

  it('is typed in no source file but packages/brand/index.ts', () => {
    const files = new Map<string, string>();
    for (const dir of ['packages/content/src', 'apps/mobile/src', 'packages/api/src', 'packages/emails']) sources(join(root, dir), files);
    expect(typedElsewhere(files)).toEqual([]);
  });

  it('[mutant] a file that types the name is caught', () => {
    expect(typedElsewhere(new Map([['packages/content/src/x.ts', `export const n = "${brand.storeName}";`]]))).toEqual(['packages/content/src/x.ts']);
  });
});

describe('[BL-1855] the Plus paragraph does not say where a held letter waits', () => {
  const sentence = 'A new letter past the free two waits until you decide.';
  const mirrors = ['apps/mobile/store.config.json', 'docs/store/app-store.md'];
  it('keeps the sentence without a place, in the source and in each mirror', () => {
    expect(storeListing.description).toContain(sentence);
    for (const f of mirrors) expect(readFileSync(join(root, f), 'utf8'), f).toContain(sentence);
  });
  it('never says "on your phone" for a held letter, because the servers-on build syncs', () => {
    expect(storeListing.description).not.toMatch(/waits on your phone/);
    for (const f of mirrors) expect(readFileSync(join(root, f), 'utf8'), f).not.toMatch(/waits on your phone/);
  });
  it('holds the store limits', () => {
    expect(storeListing.promotionalText.length).toBeLessThanOrEqual(170);
    expect(storeListing.description.length).toBeLessThanOrEqual(4000);
    expect(storeListing.keywords.length).toBeLessThanOrEqual(100);
    expect(storeListing.subtitle.length).toBeLessThanOrEqual(30);
  });
});
