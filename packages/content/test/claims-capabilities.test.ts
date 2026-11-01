/**
 * Claims against capabilities (catalog RT-REL-03; SR-B-01, IMP-67; retro work package R2-07).
 *
 * Every public claim must be true of the build families get. This test reads the claims on three surfaces:
 *  - the App Store listing (`store.en.ts`, every string);
 *  - the website copy in this package (`site.en.ts`, every exported string);
 *  - the in-app promise lines a person sees in the production build whatever its switches say (`IN_APP_PROMISES`).
 *    Lines on screens that a capability hides (sign-in, Family, backup) are not read: the screen is not there.
 * and judges each one against the production profile: `apps/mobile/eas.json` `build.production.env`, read through
 * `apps/mobile/src/lib/capabilities.ts`, the same code the app runs.
 *
 * `KNOWN_VIOLATIONS` lists today's false claims, each with its key, the rule it breaks and why. The copy changes are
 * founder decisions and other pull requests (#437, #439), so this test changes no copy. It is green today, fails on
 * any new contradiction, and fails when a listed one is fixed but still listed: remove the row, so the list shrinks.
 * If a production switch turns on (servers, co-parent, backup, other languages), the rows it makes true fail the same
 * way and are removed in that pull request.
 *
 * Inventory: docs/reviews/2026-10-claims-inventory.md (R1-02). Out of scope here, for a follow-up: `pages.en.ts`
 * (the hosted /about, /why, /contact and /delete-account pages) and the emails, which no production build sends.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { en, features, onboardingStories, permissions, site, storeListing } from '../src';
import { get, leaves, type Leaf } from './support/copy-surfaces';

// ---------------------------------------------------------------------------
// The production profile, read from eas.json through capabilities.ts.
// ---------------------------------------------------------------------------

const EAS_JSON = fileURLToPath(new URL('../../../apps/mobile/eas.json', import.meta.url));

type Profile = {
  englishOnly: boolean;
  signIn: boolean;
  sync: boolean;
  coParent: boolean;
  backup: boolean;
  /**
   * Not a build switch, a fact of the edit engine: the default Word for word view removes ums and repeats, and the
   * speech model can mishear, so "every word exactly as you said it" is not true of the words (D-086; D-133 item 2,
   * PR #439). It turns true in no profile, so a claim of it is always a violation.
   */
  wordsExactlyAsSaid: false;
};

let profile: Profile;
const savedEnv = { ...process.env };

beforeAll(async () => {
  const eas = JSON.parse(readFileSync(EAS_JSON, 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
  const env = eas.build.production?.env;
  if (!env) throw new Error('apps/mobile/eas.json has no build.production.env');
  for (const key of Object.keys(process.env)) if (key.startsWith('EXPO_PUBLIC_')) delete process.env[key];
  Object.assign(process.env, env);
  vi.resetModules();
  // capabilities.ts reads its switches when it loads, so it is loaded after the env is set.
  const { capabilities } = await import('../../../apps/mobile/src/lib/capabilities');
  profile = {
    englishOnly: capabilities.englishOnly,
    signIn: capabilities.signIn,
    sync: capabilities.sync,
    coParent: capabilities.coParent,
    backup: capabilities.backup,
    wordsExactlyAsSaid: false,
  };
});

afterAll(() => {
  for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
  Object.assign(process.env, savedEnv);
});

// ---------------------------------------------------------------------------
// The rules: a claim pattern and the capability that has to be on for the claim to be true.
// ---------------------------------------------------------------------------

type RuleId = 'languages' | 'coParent' | 'sync' | 'backup' | 'exactWords';

type Rule = { id: RuleId; claims: RegExp; trueWhen: (p: Profile) => boolean; needs: string };

const RULES: readonly Rule[] = [
  {
    id: 'languages',
    // Any spoken language but English, the seven-language count, or the bilingual keywords.
    claims: /\b(hindi|spanish|mandarin|chinese|french|arabic|portuguese|bilingual|multilingual|seven languages|7 languages)\b/i,
    trueWhen: (p) => !p.englishOnly,
    needs: 'languages other than English (EXPO_PUBLIC_ENGLISH_ONLY off)',
  },
  {
    id: 'coParent',
    // Inviting anyone, or a second parent writing in the book.
    claims: /\bco-?parents?\b|\bother parent\b|\bboth parents\b|\btwo parents\b|\bwrite (it )?together\b|\bsame book\b|\binvit(e|ed|es|ing)\b/i,
    trueWhen: (p) => p.coParent,
    needs: 'co-parent (EXPO_PUBLIC_SERVER_FEATURES on)',
  },
  {
    id: 'sync',
    // An account, sync or our servers holding letters.
    claims: /\bsync(s|ed|ing)?\b|\bsign(s|ed)? in\b|\bour servers?\b|\bnext phone\b/i,
    trueWhen: (p) => p.sync && p.signIn,
    needs: 'sign-in and sync (EXPO_PUBLIC_SERVER_FEATURES on)',
  },
  {
    id: 'backup',
    // Our own recording backup. "Your iPhone's own backup" is the person's, and is true in every build.
    claims: /\bbacked up\b|\bbacks? up\b|\bbacking up\b|\bour (own |encrypted )?backups?\b|\bencrypted backup\b|\brecording backup\b/i,
    trueWhen: (p) => p.backup,
    needs: 'recording backup (EXPO_PUBLIC_BACKUP on)',
  },
  {
    id: 'exactWords',
    claims: /\bexactly as you said\b|\bevery word (kept )?exactly\b|\bjust as you said\b/i,
    trueWhen: (p) => p.wordsExactlyAsSaid,
    needs: 'words kept exactly as said, which the default Word for word view does not do (D-133)',
  },
];

// ---------------------------------------------------------------------------
// The surfaces.
// ---------------------------------------------------------------------------

/**
 * In-app lines that promise something and are shown in the production build whatever its switches say: first run,
 * the packaged story deck, the privacy lines, the language picker, the microphone purpose string and the Recordings
 * card. Paths are under `{ en, features, permissions }`; a path that no longer resolves fails the test below.
 */
const IN_APP_PROMISES = [
  'en.onboarding.welcome.subtitle',
  'en.onboarding.welcome.body',
  'en.onboarding.welcome.freeLine',
  'en.onboarding.promise',
  'en.trust.promise',
  'en.trust.short',
  'en.trust.voice',
  'en.trust.firstRecording',
  'en.settings.recordings.onPhoneTitle',
  'en.settings.recordings.onPhoneBody',
  'features.language.picker',
  'features.language.waitingForLanguage',
  'permissions',
] as const;

const IN_APP_ROOT = { en, features, permissions } as const;

function surfaces(): Leaf[] {
  const store = leaves(storeListing, 'store');
  const web = leaves(site, 'site');
  const inApp = IN_APP_PROMISES.flatMap((path) => leaves(get(IN_APP_ROOT, path), path));
  // The packaged deck is the fallback the app shows with no signed server bundle; keyed by card id, which never moves.
  const stories = onboardingStories.flatMap((card) =>
    (['headline', 'line'] as const).map((field) => ({ path: `stories.${card.id}.${field}`, text: card[field] })),
  );
  return [...store, ...web, ...inApp, ...stories];
}

type Violation = { key: string; rule: RuleId };

function violations(p: Profile): Violation[] {
  return surfaces().flatMap(({ path, text }) =>
    RULES.filter((r) => !r.trueWhen(p) && r.claims.test(text)).map((r) => ({ key: path, rule: r.id })),
  );
}

// ---------------------------------------------------------------------------
// Today's false claims in the production profile. Remove a row in the pull request that makes it true.
// ---------------------------------------------------------------------------

type KnownViolation = Violation & { reason: string };

const KNOWN_VIOLATIONS: readonly KnownViolation[] = [
  // Seven languages. The store listing already says English only (D-121); the bilingual keywords left it with it.
  { key: 'site.faq[6].a', rule: 'languages', reason: 'FAQ lists seven spoken languages; production is English only (D-111 item 4, D-121 item 1).' },
  { key: 'features.language.picker.none', rule: 'languages', reason: 'Picker says letters can be spoken in seven languages; production offers English alone (D-121).' },

  // "Write it together" and the co-parent lines. Co-parent needs the server switch, off in production (D-121, D-126).
  { key: 'site.benefits[3].title', rule: 'coParent', reason: '"Write it together": no co-parent in production.' },
  { key: 'site.benefits[3].body', rule: 'coParent', reason: '"Invite your co-parent to the same book": no invite in production.' },
  { key: 'site.family.title', rule: 'coParent', reason: '"Two parents, one book": no co-parent in production.' },
  { key: 'site.family.body', rule: 'coParent', reason: '"Today, you and your co-parent write in the same book": not today in production.' },
  { key: 'site.privacy.points[0]', rule: 'coParent', reason: 'Says the co-parent can read the book if invited; production cannot invite.' },
  { key: 'site.privacy.points[6]', rule: 'coParent', reason: 'Speaks of inviting someone to a book; production cannot invite.' },
  { key: 'site.faq[0].a', rule: 'coParent', reason: 'Says the other parent can read letters once invited; production cannot invite.' },
  { key: 'site.faq[3].a', rule: 'coParent', reason: 'Says a book is shared by you and your co-parent; not in production.' },
  { key: 'site.faq[4].q', rule: 'coParent', reason: 'Asks whether the co-parent needs an iPhone, implying co-parent exists in production.' },
  { key: 'site.faq[5].a', rule: 'coParent', reason: 'Plus sharing with a co-parent in the same book; no co-parent in production.' },

  // "Only you and the people you invite": nobody can be invited in production.
  { key: 'stories.story.private.v1.line', rule: 'coParent', reason: '"Only you and the people you invite": the packaged first-run card promises invites production lacks.' },

  // Sign-in and sync: the server switch is off in production.
  { key: 'site.faq[0].a', rule: 'sync', reason: 'Says letters sync to our servers when you sign in; production has no sign-in or sync.' },
  { key: 'site.faq[10].a', rule: 'sync', reason: '"Your letters come with you when you sign in": production has no sign-in.' },

  // "Exactly as you said it" (D-133 item 2, PR #439): the default view removes ums and repeats.
  { key: 'site.og.description', rule: 'exactWords', reason: 'Carries brand.tagline "Exactly as you said it."; the tagline is the brand lane follow-up in D-133.' },
  { key: 'site.hero.subhead', rule: 'exactWords', reason: '"Every word kept exactly as you said it": not true of the words (D-133).' },
  { key: 'site.benefits[0].title', rule: 'exactWords', reason: '"Exactly as you said it" benefit title (D-133).' },
  { key: 'en.onboarding.promise.title', rule: 'exactWords', reason: 'First-run headline; D-133 says the store build uses the true line.' },
  { key: 'stories.story.exact.v2.headline', rule: 'exactWords', reason: 'Packaged first-run card headline "Exactly as you said it." (D-133).' },
];

const id = (v: Violation) => `${v.key} [${v.rule}]`;

// ---------------------------------------------------------------------------
// The tests.
// ---------------------------------------------------------------------------

describe('public claims match the production profile (RT-REL-03, SR-B-01, IMP-67)', () => {
  it('reads the production profile from eas.json through capabilities.ts', () => {
    // The profile the claims are judged against. If a switch here changes on purpose, update this line and remove the
    // KNOWN_VIOLATIONS rows the change makes true.
    expect(profile).toEqual({ englishOnly: true, signIn: false, sync: false, coParent: false, backup: false, wordsExactlyAsSaid: false });
  });

  it('reads every in-app promise path', () => {
    const missing = IN_APP_PROMISES.filter((path) => leaves(get(IN_APP_ROOT, path), path).length === 0);
    expect(missing, 'IN_APP_PROMISES paths that no longer resolve to copy').toEqual([]);
  });

  it('makes no new claim the production build cannot keep', () => {
    const known = new Set(KNOWN_VIOLATIONS.map(id));
    const fresh = violations(profile)
      .filter((v) => !known.has(id(v)))
      .map((v) => `${id(v)}: needs ${RULES.find((r) => r.id === v.rule)!.needs}`);
    expect(fresh, 'new claims that contradict the production profile: fix the copy, do not add a row').toEqual([]);
  });

  it('lists only violations that still exist, so the list shrinks', () => {
    const found = new Set(violations(profile).map(id));
    const fixed = KNOWN_VIOLATIONS.filter((v) => !found.has(id(v))).map(id);
    expect(fixed, 'these are fixed (or the key moved): remove them from KNOWN_VIOLATIONS').toEqual([]);
  });

  it('gives every known violation a one-line reason and lists it once', () => {
    for (const v of KNOWN_VIOLATIONS) {
      expect(v.reason.trim(), id(v)).not.toBe('');
      expect(v.reason, id(v)).not.toMatch(/\n/);
    }
    expect(new Set(KNOWN_VIOLATIONS.map(id)).size).toBe(KNOWN_VIOLATIONS.length);
  });
});

describe('the claim rules', () => {
  const offEverything: Profile = { englishOnly: true, signIn: false, sync: false, coParent: false, backup: false, wordsExactlyAsSaid: false };
  const hits = (text: string) => RULES.filter((r) => !r.trueWhen(offEverything) && r.claims.test(text)).map((r) => r.id);

  it('catches each kind of claim the production build cannot keep', () => {
    expect(hits('Speak your letters in English, Hindi or Spanish.')).toEqual(['languages']);
    expect(hits('diary,bilingual,keepsake')).toEqual(['languages']);
    expect(hits('Write it together.')).toEqual(['coParent']);
    expect(hits('Only you and the people you invite can read your book.')).toEqual(['coParent']);
    expect(hits('Your letters sync when you sign in.')).toEqual(['sync']);
    expect(hits('Recordings are backed up in our encrypted backup.')).toEqual(['backup']);
    expect(hits('Every word kept exactly as you said it.')).toEqual(['exactWords']);
  });

  it('leaves the true lines alone', () => {
    expect(hits("The original recording stays with each letter, on your phone and in your iPhone's own backup if you use one.")).toEqual([]);
    expect(hits('This version works in English.')).toEqual([]);
    expect(hits('Open the book at bedtime and read together.')).toEqual([]);
    expect(hits('There is no account to create and no server copy of letters.')).toEqual([]);
  });

  it('drops a rule once its capability is on', () => {
    const on: Profile = { englishOnly: false, signIn: true, sync: true, coParent: true, backup: true, wordsExactlyAsSaid: false };
    const text = 'Hindi; invite your co-parent; sign in to sync; backed up; exactly as you said it';
    expect(RULES.filter((r) => !r.trueWhen(on) && r.claims.test(text)).map((r) => r.id)).toEqual(['exactWords']);
  });
});
