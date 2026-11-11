/**
 * Claims against capabilities (catalog RT-REL-03; retro work package R2-07).
 *
 * Every public claim must be true of the build families get. This test reads the claims on the surfaces people see:
 *  - the App Store listing (`store.en.ts`, every string);
 *  - earlyletters.com: `apps/web/src/content/site.ts` (every string, by dotted path), and every string literal and
 *    JSX text in the rest of `apps/web/src` (support/web-strings.ts, which lists what it skips and why);
 *  - the in-app promise lines a person sees in the production build whatever its switches say (`IN_APP_PROMISES`),
 *    including the Plus sheet (`features.billing`, `en.plus`). Lines a capability hides (sign-in, Family, backup, and
 *    `SWITCHED_LINES`) are not read: the person never sees them.
 * and judges each one against the production profile: `apps/mobile/eas.json` `build.production.env`, read through
 * `apps/mobile/src/lib/capabilities.ts`, the same code the app runs.
 *
 * Not read: `packages/content/src/site.en.ts` and `pages.en.ts`. Nothing that ships imports them (apps/web depends
 * only on @scribe/brand and @scribe/design-tokens); they are read by the content lint tests alone. BL-556 deletes or
 * rewires them. The emails are not read either: no production build sends them.
 *
 * A claim is one match of a rule's pattern in one string. `KNOWN_VIOLATIONS` lists today's false claims, each by the
 * string's key, the rule, the claim's words, the change that removes it (`removedBy`) and why. A second claim in a
 * listed string is a new claim and fails. The test is green today, fails on any new claim, and fails when a listed
 * claim is gone but still listed, so the list only shrinks; its length is capped at today's count. If a production
 * switch turns on (servers, co-parent, backup, other languages), the rows it makes true fail the same way and are
 * removed in that pull request.
 *
 * Inventory: docs/reviews/2026-10-claims-inventory.md (R1-02).
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readdirSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import * as contentExports from '../src';
import { en, features, onboardingStories, permissions, storeListing } from '../src';
import { site as webSite } from '../../../apps/web/src/content/site';
import {
  CLAIMS_LEDGER,
  DENIAL_CLAIMS,
  FREQUENCY_CLAIMS,
  MEDIA_CAPABILITIES,
  MEMORY_LIBRARY_PATHS_WHEN_PRESENT,
  STAYS_ON_PHONE_CLAIMS,
  SURFACING_VERBS,
  type MediaCapability,
} from './support/claims-ledger';
import { get, leaves, type Leaf } from './support/copy-surfaces';
import { staleWebExclusions, stringsIn, webSourceLeaves } from './support/web-strings';

// ---------------------------------------------------------------------------
// The production profile, read from eas.json through capabilities.ts.
// ---------------------------------------------------------------------------

const EAS_JSON = fileURLToPath(new URL('../../../apps/mobile/eas.json', import.meta.url));

type Profile = {
  englishOnly: boolean;
  /** The spoken languages the build hears (lib/language/heard-languages.ts): a language named in a claim must be one. */
  heard: readonly string[];
  signIn: boolean;
  sync: boolean;
  coParent: boolean;
  backup: boolean;
  /**
   * The Memory Library phase switches (NX-39 v2 section 3, R55), read from capabilities.ts. All six are off in every
   * profile today; turning one on is a decision of its own, and the ledger rows that need it then pass.
   */
  photos: boolean;
  mediaMetadata: boolean;
  mediaLibrary: boolean;
  moments: boolean;
  mediaBackground: boolean;
  occasions: boolean;
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
  const { heardLanguagesForBuild, hearsOnlyEnglish } = await import('../../../apps/mobile/src/lib/language/heard-languages');
  const heard = heardLanguagesForBuild();
  profile = {
    // English only by either switch: ENGLISH_ONLY on, or a spoken-language list of English alone (D-125 item 2).
    englishOnly: capabilities.englishOnly || hearsOnlyEnglish(heard),
    heard: [...heard],
    signIn: capabilities.signIn,
    sync: capabilities.sync,
    coParent: capabilities.coParent,
    backup: capabilities.backup,
    photos: capabilities.photos,
    mediaMetadata: capabilities.mediaMetadata,
    mediaLibrary: capabilities.mediaLibrary,
    moments: capabilities.moments,
    mediaBackground: capabilities.mediaBackground,
    occasions: capabilities.occasions,
    wordsExactlyAsSaid: false,
  };
  // Read every surface once (the web source is parsed with the TypeScript compiler); the tests below share it.
  cachedSurfaces(profile);
}, 60_000);

afterAll(() => {
  for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
  Object.assign(process.env, savedEnv);
});

// ---------------------------------------------------------------------------
// The rules: claim patterns and the capability that has to be on for the claim to be true.
// ---------------------------------------------------------------------------

type RuleId =
  | 'languages'
  | 'coParent'
  | 'sync'
  | 'backup'
  | 'exactWords'
  // Memory Library (NX-39 R1, R44, R55): one rule per ledger row, then the denials, the frequency ban and the rest.
  | `ledger${number}`
  | 'denyMetadata'
  | 'denyLibrary'
  | 'denyBackground'
  | 'inBackground'
  | 'readFrequency'
  | 'staysOnPhone'
  | 'surfacing';

type Rule = {
  id: RuleId;
  /** Each match of each pattern is one claim. Patterns carry their own flags; matching adds `g`. */
  claims: readonly RegExp[];
  /** True lines that share words with a claim. Their text is taken out before the claims are matched. */
  truths?: readonly RegExp[];
  trueWhen: (p: Profile) => boolean;
  /**
   * When set, decides each claim on its own instead of trueWhen (D-125 item 2): a language named in a claim is true
   * only if the build hears that language.
   */
  trueFor?: (p: Profile, claim: string) => boolean;
  needs: string;
};

/**
 * The language names that are true of a build that hears the language with this code (packages/core LANGUAGES).
 * Every other name in LANGUAGE_NAMES is never true: the app hears no other language.
 */
export const NAME_TO_CODE: Readonly<Record<string, string>> = {
  hindi: 'hi',
  spanish: 'es',
  chinese: 'zh',
  mandarin: 'zh',
  french: 'fr',
  arabic: 'ar',
  portuguese: 'pt',
};

/** Is this one claim true of the profile? */
const claimTrue = (r: Rule, p: Profile, claim: string) => (r.trueFor ? r.trueFor(p, claim) : r.trueWhen(p));

/**
 * Languages by their English names: the ISO 639-1 names of the widely spoken languages, and the names a parent uses
 * for them (Mandarin, Cantonese, Farsi, Tagalog, Bangla). Matched with a capital, so "polish your words" is not
 * Polish. English is left out: it is the language production has.
 */
export const LANGUAGE_NAMES = [
  'Afrikaans', 'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Assamese', 'Azerbaijani', 'Bangla', 'Basque', 'Belarusian',
  'Bengali', 'Bosnian', 'Bulgarian', 'Burmese', 'Cantonese', 'Catalan', 'Chinese', 'Croatian', 'Czech', 'Danish',
  'Dutch', 'Estonian', 'Farsi', 'Filipino', 'Finnish', 'French', 'Galician', 'Georgian', 'German', 'Greek', 'Gujarati',
  'Haitian Creole', 'Hausa', 'Hebrew', 'Hindi', 'Hungarian', 'Icelandic', 'Igbo', 'Indonesian', 'Irish', 'Italian',
  'Japanese', 'Javanese', 'Kannada', 'Kazakh', 'Khmer', 'Korean', 'Kurdish', 'Kyrgyz', 'Lao', 'Latvian', 'Lithuanian',
  'Macedonian', 'Malay', 'Malayalam', 'Maltese', 'Mandarin', 'Maori', 'Marathi', 'Mongolian', 'Nepali', 'Norwegian',
  'Odia', 'Oriya', 'Pashto', 'Persian', 'Polish', 'Portuguese', 'Punjabi', 'Romanian', 'Russian', 'Samoan', 'Serbian',
  'Sindhi', 'Sinhala', 'Slovak', 'Slovenian', 'Somali', 'Spanish', 'Swahili', 'Swedish', 'Tagalog', 'Tajik', 'Tamil',
  'Telugu', 'Thai', 'Tibetan', 'Tigrinya', 'Turkish', 'Turkmen', 'Ukrainian', 'Urdu', 'Uyghur', 'Uzbek', 'Vietnamese',
  'Welsh', 'Xhosa', 'Yiddish', 'Yoruba', 'Zulu',
] as const;

const NUMBER_WORDS = 'two|three|four|five|six|seven|eight|nine|ten|eleven|twelve';

const RULES: readonly Rule[] = [
  {
    id: 'languages',
    claims: [
      // Any language but English, by name.
      new RegExp(`\\b(?:${LANGUAGE_NAMES.join('|')})\\b`),
      // Any language at all, or a count of them: "your home language", "in any language", "7 languages",
      // "seven spoken languages", "other languages", and the bilingual keywords.
      new RegExp(
        `\\b(?:home|native|mother|heritage|own|every|any|other|several|many|multiple|\\d+|${NUMBER_WORDS})(?: spoken)? languages?\\b|\\bspoken languages\\b|\\b(?:bi|multi|tri)lingual\\b`,
        'i',
      ),
    ],
    // A line that says more languages come later is true of every build.
    truths: [/\b(?:other|more) languages (?:are coming|follow)\b/gi],
    trueWhen: (p) => !p.englishOnly,
    // A named language: only one the build hears. Any language at all, or a count: only a build that hears more than
    // English, as before.
    trueFor: (p, claim) => {
      const name = (LANGUAGE_NAMES as readonly string[]).find((n) => n.toLowerCase() === claim);
      if (name === undefined) return !p.englishOnly;
      const code = NAME_TO_CODE[claim];
      return code !== undefined && p.heard.includes(code);
    },
    needs: 'the named language in EXPO_PUBLIC_SPOKEN_LANGUAGES, or languages other than English (EXPO_PUBLIC_ENGLISH_ONLY off)',
  },
  {
    id: 'coParent',
    // Inviting anyone, or a second parent writing in the book.
    claims: [/\bco-?parents?\b|\bother parent\b|\bboth parents\b|\btwo parents\b|\bwrite (it )?together\b|\bsame book\b|\binvit(e|ed|es|ing|ations?)\b/i],
    trueWhen: (p) => p.coParent,
    needs: 'co-parent (EXPO_PUBLIC_SERVER_FEATURES on)',
  },
  {
    id: 'sync',
    // An account, sync, the cloud, or our servers holding letters.
    claims: [
      /\bsync(s|ed|ing)?\b|\bsign(s|ed|ing)?[- ]in\b|\blog(s|ged|ging)?[- ]in\b|\baccounts?\b|\bcloud\b|\bour servers?\b|\bnext phone\b|\b(all|any|every) (of )?your devices\b|\bevery device\b/i,
    ],
    // "No account" is the true line; an Apple Account is Apple's, where a subscription is managed.
    truths: [/\bno account\b/gi, /\bwithout an account\b/gi, /\bApple Account\b/g],
    trueWhen: (p) => p.sync && p.signIn,
    needs: 'sign-in and sync (EXPO_PUBLIC_SERVER_FEATURES on)',
  },
  {
    id: 'backup',
    // Our own recording backup, or iCloud. "Your iPhone's own backup" is the person's, and is true in every build.
    claims: [/\bbacked up\b|\bbacks? up\b|\bbacking up\b|\bour (own |encrypted )?backups?\b|\bencrypted backup\b|\brecording backup\b|\bicloud\b|\bcloud backups?\b/i],
    truths: [/\byour iPhone's own backup\b/gi],
    trueWhen: (p) => p.backup,
    needs: 'recording backup (EXPO_PUBLIC_BACKUP on)',
  },
  {
    id: 'exactWords',
    claims: [/\bexactly as you said\b|\bevery word (kept )?exactly\b|\bjust as you said\b/i],
    trueWhen: (p) => p.wordsExactlyAsSaid,
    needs: 'words kept exactly as said, which the default Word for word view does not do (D-133)',
  },
  ...mediaRules(),
];

/**
 * The Memory Library rules (BL-863). Every rule is made from data in support/claims-ledger.ts:
 *  - one `ledgerN` rule per ledger row that has a pattern, true only when a capability the row needs is on;
 *  - three denial rules, true only while the capability that would falsify them is OFF ("never read a photo's
 *    location" is a claim that stops being true the day the build reads one);
 *  - `inBackground`, true only when mediaBackground is on (the denial lines are taken out first);
 *  - `readFrequency`, `staysOnPhone` and `surfacing`, true in no profile (`staysOnPhone` can be registered, below).
 */
function mediaRules(): Rule[] {
  const ledger: Rule[] = CLAIMS_LEDGER.flatMap((row) =>
    row.pattern === null || row.needs === null
      ? []
      : [
          {
            id: `ledger${row.n}` as const,
            claims: [row.pattern],
            trueWhen: (p: Profile) => row.needs!.some((c) => p[c]),
            needs: `${row.needs.join(' or ')} (${row.phase}; ledger row ${row.n}, proof ${row.proof})`,
          },
        ],
  );
  return [
    ...ledger,
    { id: 'denyMetadata', claims: DENIAL_CLAIMS.metadata, trueWhen: (p) => !p.mediaMetadata && !p.mediaLibrary, needs: 'the build to read no date or place from a photo (mediaMetadata and mediaLibrary off)' },
    { id: 'denyLibrary', claims: DENIAL_CLAIMS.library, trueWhen: (p) => !p.mediaLibrary && !p.moments, needs: 'the build to read no photo library (mediaLibrary and moments off)' },
    { id: 'denyBackground', claims: DENIAL_CLAIMS.background, trueWhen: (p) => !p.mediaBackground, needs: 'the build to have no background read (mediaBackground off)' },
    {
      id: 'inBackground',
      claims: [/\bin the background\b/i, /\bwhen (?:the app is |it is |it's )?closed\b/i, /\bwhile [^.]{0,30}\bis closed\b/i],
      truths: DENIAL_CLAIMS.background,
      trueWhen: (p) => p.mediaBackground,
      needs: 'the background top-up (EXPO_PUBLIC_MOMENTS_BACKGROUND on, founder ruling on UIBackgroundModes)',
    },
    { id: 'readFrequency', claims: FREQUENCY_CLAIMS, trueWhen: () => false, needs: 'nothing: no string states how often the app looks, iOS decides (R44, CPO-9)' },
    { id: 'staysOnPhone', claims: STAYS_ON_PHONE_CLAIMS, trueWhen: () => false, needs: 'a line in PROMISE_REGISTRY with a counsel version (R1)' },
    { id: 'surfacing', claims: SURFACING_VERBS, trueWhen: () => false, needs: 'nothing: the app never says it found, noticed or knows (R17, R55)' },
  ];
}

const global = (re: RegExp) => new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);

/** The claims of one rule in one string: each match, lower-cased, in order. */
function claimsOf(rule: Rule, text: string): string[] {
  const rest = (rule.truths ?? []).reduce((t, truth) => t.replace(global(truth), ' '), text);
  return rule.claims.flatMap((re) => [...rest.matchAll(global(re))].map((m) => m[0].toLowerCase()));
}

// ---------------------------------------------------------------------------
// The surfaces.
// ---------------------------------------------------------------------------

/**
 * In-app lines that promise something and are shown in the production build whatever its switches say: first run,
 * the packaged story deck, the privacy lines, the language picker, the microphone purpose string, the Recordings
 * card and the Plus sheet. Paths are under `{ en, features, permissions }`; a path that no longer resolves fails the
 * test below.
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
  'en.plus',
  'features.billing',
  'features.language.picker',
  'features.language.waitingForLanguage',
  'permissions',
] as const;

/**
 * Lines inside an IN_APP_PROMISES subtree that the app shows only when a capability is on. Read only in a profile
 * with that capability; a path here that no longer resolves fails the test below.
 */
const SWITCHED_LINES: Readonly<Record<string, { shownWhen: (p: Profile) => boolean; why: string }>> = {
  'features.billing.keepGate.heldNoteSynced': {
    shownWhen: (p) => p.sync && p.signIn,
    why: 'plus-gate.logic.ts shows it only signed in with sync on, and only once SYNCED_HELD_NOTE_CLEARED is true',
  },
  'features.language.picker.none': {
    shownWhen: (p) => !p.englishOnly,
    why: 'the "no match" line under a search; English only, the picker has no search field and lists English (language-picker.logic.ts)',
  },
};

const IN_APP_ROOT = { en, features, permissions } as const;

function surfaces(p: Profile): Leaf[] {
  const store = leaves(storeListing, 'store');
  const webContent = leaves(webSite, 'web.site');
  const webSource = webSourceLeaves();
  // Content paths a Memory Library change will add. Read as soon as they resolve, so a new surface is never invisible.
  const memoryLibrary = MEMORY_LIBRARY_PATHS_WHEN_PRESENT.flatMap((path) => leaves(get(IN_APP_ROOT, path), path));
  const inApp = [...IN_APP_PROMISES.flatMap((path) => leaves(get(IN_APP_ROOT, path), path)), ...memoryLibrary].filter(
    (leaf) => !(leaf.path in SWITCHED_LINES) || SWITCHED_LINES[leaf.path].shownWhen(p),
  );
  // The packaged deck is the fallback the app shows with no signed server bundle; keyed by card id, which never moves.
  const stories = onboardingStories.flatMap((card) =>
    (['headline', 'line'] as const).map((field) => ({ path: `stories.${card.id}.${field}`, text: card[field] })),
  );
  return [...store, ...webContent, ...webSource, ...inApp, ...stories];
}

type Claim = { key: string; rule: RuleId; claim: string };

const surfaceCache = new Map<Profile, Leaf[]>();
const cachedSurfaces = (p: Profile) => surfaceCache.get(p) ?? surfaceCache.set(p, surfaces(p)).get(p)!;

function claims(p: Profile): Claim[] {
  return cachedSurfaces(p).flatMap(({ path, text }) =>
    RULES.flatMap((r) =>
      claimsOf(r, text)
        .filter((claim) => !claimTrue(r, p, claim) && !registered(path, r.id))
        .map((claim) => ({ key: path, rule: r.id, claim })),
    ),
  );
}

/**
 * The claims registry (PRIV-R17, NX-39 R1): lines the "stays on this phone" rule lets through, each with the version
 * counsel read. Empty: no such line is registered, so any surface that says it fails. A row is added only in the pull
 * request that carries counsel's written version, never to quiet this test.
 */
const PROMISE_REGISTRY: readonly { key: string; rule: 'staysOnPhone'; counselVersion: string }[] = [];
const registered = (key: string, rule: RuleId) => PROMISE_REGISTRY.some((r) => r.key === key && r.rule === rule && r.counselVersion.trim() !== '');

// ---------------------------------------------------------------------------
// Today's false claims in the production profile. Remove a row in the pull request that makes it true.
// ---------------------------------------------------------------------------

/**
 * `removedBy` names the change that will remove the claim, by fixing the copy or by turning the capability on:
 *  - `#n`, an open pull request (checked open with `gh` when the row was written; the test cannot reach GitHub);
 *  - `BL-n`, a backlog item in docs/BACKLOG.md that is not done or superseded;
 *  - `D-n`, a decision row in docs/DECISIONS.md that schedules the fix.
 */
type KnownViolation = Claim & { removedBy: string; reason: string };

const KNOWN_VIOLATIONS: readonly KnownViolation[] = [
  // "Exactly as you said it" in the store build's first run (D-133 decision 2). PR #502 changes both lines.
  { key: 'en.onboarding.promise.title', rule: 'exactWords', claim: 'exactly as you said', removedBy: '#502', reason: 'First-run headline; D-133 says the store build uses the true line.' },
  { key: 'stories.story.exact.v2.headline', rule: 'exactWords', claim: 'exactly as you said', removedBy: '#502', reason: 'Packaged first-run card headline "Exactly as you said it." (D-133).' },

  // "Only you and the people you invite": nobody can be invited in production.
  { key: 'stories.story.private.v1.line', rule: 'coParent', claim: 'invite', removedBy: 'BL-557', reason: 'The packaged first-run card promises invites production lacks.' },

  // The website's /j invite page and /auth/confirm page: only a build with server features sends links to them.
  { key: 'web.site.authConfirm.title', rule: 'sync', claim: 'signing in', removedBy: 'BL-558', reason: '"Finish signing in": production has no sign-in.' },
  { key: 'web.site.invite.title', rule: 'coParent', claim: 'invite', removedBy: 'BL-558', reason: '"An invite to share a book": production cannot invite.' },
  { key: 'web.site.invite.line', rule: 'coParent', claim: 'invited', removedBy: 'BL-558', reason: '"Someone invited you to share a book": production cannot invite.' },
  { key: 'web.site.invite.body', rule: 'coParent', claim: 'invite', removedBy: 'BL-558', reason: 'Says the invite opens in the app; production has no invites.' },
  { key: 'web.site.invite.steps[0]', rule: 'coParent', claim: 'invite', removedBy: 'BL-558', reason: 'Step "Copy the invite": production has no invites.' },
  { key: 'web.site.invite.steps[1]', rule: 'coParent', claim: 'invited', removedBy: 'BL-558', reason: 'Step "I was invited": a door production hides (BL-391).' },
  { key: 'web.site.invite.steps[2]', rule: 'coParent', claim: 'invite', removedBy: 'BL-558', reason: 'Step "Paste the invite": production has no invites.' },
  { key: 'web.site.invite.copy', rule: 'coParent', claim: 'invite', removedBy: 'BL-558', reason: 'Button "Copy the invite": production has no invites.' },
  { key: 'web.site.invite.copied', rule: 'coParent', claim: 'invited', removedBy: 'BL-558', reason: 'Points to "I was invited", which production hides.' },
  { key: 'web.site.invite.copyFailed', rule: 'coParent', claim: 'invited', removedBy: 'BL-558', reason: 'Points to "I was invited", which production hides.' },
  { key: 'web.site.invite.missing', rule: 'coParent', claim: 'invite', removedBy: 'BL-558', reason: '"This page opened without its invite": production has no invites.' },
  { key: 'web.site.invite.missing', rule: 'coParent', claim: 'invited', removedBy: 'BL-558', reason: 'Points to "I was invited", which production hides.' },
  { key: 'web.site.invite.noScript', rule: 'coParent', claim: 'invited', removedBy: 'BL-558', reason: 'Points to "I was invited", which production hides.' },
  { key: 'web.site.invite.notYou', rule: 'coParent', claim: 'invite', removedBy: 'BL-558', reason: '"If you were not expecting an invite": production has no invites.' },
];

/** Today's count. Lower it when rows go; never raise it: a new false claim is fixed in the copy, not listed. */
const KNOWN_VIOLATIONS_CAP = 17;

/**
 * The lines that say "stays on your phone" today (found by the staysOnPhone rule, NX-39 R1, BL-863). The ledger lists
 * that sentence as one that must never be said, because the iPhone backup, an iCloud download and an export all move
 * the words off the phone. They live in the store listing, the website and the microphone purpose string, which this
 * task does not change (no content is edited here, and the founder and counsel own those words), so they are held in
 * their own list with their own cap rather than in KNOWN_VIOLATIONS, whose cap stays at 17. Same rules: every row names
 * the change that removes it, a row whose line is gone fails until it is deleted, and the cap only goes down. A row is
 * never added: a new "stays on your phone" fails, and is removed from the copy or registered with a counsel version
 * in PROMISE_REGISTRY. #747 carries BL-867 (the claims registry and the register rows) that decides these.
 */
const STAYS_ON_PHONE_HELD: readonly KnownViolation[] = [
  'store.description',
  'store.screenshots[5].caption',
  'store.screenshotCaptions[5]',
  'permissions.microphone',
  'web.site.comingSoon.trust',
  'web.site.scenes.s09.points[0]',
  'web.site.welcomeEmail.promises[2]',
].map((key) => ({
  key,
  rule: 'staysOnPhone' as const,
  claim: key.startsWith('web.') ? 'stay on your iphone' : key === 'permissions.microphone' ? 'stay on this phone' : 'stays on your phone',
  removedBy: '#747',
  reason: 'Says the words stay on the phone; backup, iCloud download and export move them (ledger: never to be said). Held for BL-867.',
}));

/** Today's count of held "stays on your phone" lines. Lower it when rows go; never raise it. */
const STAYS_ON_PHONE_HELD_CAP = 7;

const ALL_KNOWN: readonly KnownViolation[] = [...KNOWN_VIOLATIONS, ...STAYS_ON_PHONE_HELD];

const ALL_MEDIA_OFF = { photos: false, mediaMetadata: false, mediaLibrary: false, moments: false, mediaBackground: false, occasions: false } as const;

const id = (c: Claim) => `${c.key} [${c.rule}] "${c.claim}"`;

/** The ids in `a` beyond their count in `b` (multiset difference). */
function beyond(a: readonly Claim[], b: readonly Claim[]): string[] {
  const left = new Map<string, number>();
  for (const c of b) left.set(id(c), (left.get(id(c)) ?? 0) + 1);
  return a.flatMap((c) => {
    const n = left.get(id(c)) ?? 0;
    if (n > 0) {
      left.set(id(c), n - 1);
      return [];
    }
    return [id(c)];
  });
}

const BACKLOG = readFileSync(fileURLToPath(new URL('../../../docs/BACKLOG.md', import.meta.url)), 'utf8');
const DECISIONS = readFileSync(fileURLToPath(new URL('../../../docs/DECISIONS.md', import.meta.url)), 'utf8');

/** Why `removedBy` does not resolve, or null when it does. */
export function unresolved(removedBy: string | undefined, backlog = BACKLOG, decisions = DECISIONS): string | null {
  if (!removedBy) return 'missing';
  if (/^#\d+$/.test(removedBy)) return null;
  const bl = /^BL-(\d+)$/.exec(removedBy);
  if (bl) {
    const lines = backlog.split('\n');
    const at = lines.findIndex((l) => new RegExp(`^(#### |- \\*\\*)BL-${bl[1]}\\b`).test(l));
    if (at < 0) return 'not in docs/BACKLOG.md';
    const block = [lines[at]];
    for (const line of lines.slice(at + 1)) {
      if (/^(#{2,4} |- \*\*BL-)/.test(line)) break;
      block.push(line);
    }
    if (/Status: (done|superseded)\b/i.test(block.join('\n'))) return 'done or superseded in docs/BACKLOG.md';
    return null;
  }
  const d = /^D-(\d+)$/.exec(removedBy);
  if (d) return new RegExp(`^\\| D-${d[1]} \\|`, 'm').test(decisions) ? null : 'not in docs/DECISIONS.md';
  return 'not #n, BL-n or D-n';
}

// ---------------------------------------------------------------------------
// The tests.
// ---------------------------------------------------------------------------

describe('public claims match the production profile (RT-REL-03)', () => {
  it('reads the production profile from eas.json through capabilities.ts', () => {
    // The profile the claims are judged against. If a switch here changes on purpose, update this line and remove the
    // KNOWN_VIOLATIONS rows the change makes true.
    expect(profile).toEqual({ englishOnly: true, heard: ['en'], signIn: false, sync: false, coParent: false, backup: false, ...ALL_MEDIA_OFF, wordsExactlyAsSaid: false });
  });

  it('reads every in-app promise path, every switched line and every web exclusion', () => {
    const missing = IN_APP_PROMISES.filter((path) => leaves(get(IN_APP_ROOT, path), path).length === 0);
    expect(missing, 'IN_APP_PROMISES paths that no longer resolve to copy').toEqual([]);
    const switched = Object.keys(SWITCHED_LINES).filter((path) => typeof get(IN_APP_ROOT, path) !== 'string');
    expect(switched, 'SWITCHED_LINES paths that no longer resolve to a string').toEqual([]);
    expect(staleWebExclusions(), 'WEB_NOT_READ paths that no longer exist').toEqual([]);
  });

  it('reads the copy earlyletters.com renders, not only the content package', () => {
    const keys = cachedSurfaces(profile).map((l) => l.path);
    expect(keys.filter((k) => k.startsWith('web.site.scenes.')).length).toBeGreaterThan(50);
    expect(keys.some((k) => k.startsWith('web:scenes/S04Exact.tsx'))).toBe(true);
    expect(keys.some((k) => k.startsWith('web:lib/legal/privacy-copy.ts'))).toBe(true);
    expect(keys.some((k) => k.startsWith('features.billing.'))).toBe(true);
    expect(keys.some((k) => k.startsWith('site.')), 'site.en.ts is not shipped, so it is not read').toBe(false);
  });

  it('makes no new claim the production build cannot keep', () => {
    const fresh = beyond(claims(profile), ALL_KNOWN).map((c) => `${c}: needs ${RULES.find((r) => c.includes(`[${r.id}]`))!.needs}`);
    expect(fresh, 'new claims that contradict the production profile: fix the copy, do not add a row').toEqual([]);
  });

  it('lists only claims that still exist, so the list shrinks', () => {
    const fixed = beyond(ALL_KNOWN, claims(profile));
    expect(fixed, 'these are fixed (or the key moved): remove them from KNOWN_VIOLATIONS').toEqual([]);
  });

  it('caps the list at today\'s count', () => {
    expect(KNOWN_VIOLATIONS.length).toBeLessThanOrEqual(KNOWN_VIOLATIONS_CAP);
    expect(STAYS_ON_PHONE_HELD.length).toBeLessThanOrEqual(STAYS_ON_PHONE_HELD_CAP);
    expect(PROMISE_REGISTRY.length, 'a registry row needs counsel text; none exists yet').toBe(0);
  });

  it('names, for every known violation, the change that removes it and why', () => {
    const bad = ALL_KNOWN.flatMap((v) => {
      const why = unresolved(v.removedBy);
      return why ? [`${id(v)}: removedBy ${v.removedBy ?? '(none)'} ${why}`] : [];
    });
    expect(bad, 'each row needs removedBy: an open #n, a live BL-n or a D-n').toEqual([]);
    for (const v of ALL_KNOWN) {
      expect(v.reason.trim(), id(v)).not.toBe('');
      expect(v.reason, id(v)).not.toMatch(/\n/);
    }
  });
});

describe('the claim rules', () => {
  const offEverything: Profile = { englishOnly: true, heard: ['en'], signIn: false, sync: false, coParent: false, backup: false, ...ALL_MEDIA_OFF, wordsExactlyAsSaid: false };
  const falseIn = (r: Rule, p: Profile, text: string) => claimsOf(r, text).filter((c) => !claimTrue(r, p, c));
  const hits = (text: string) => RULES.filter((r) => falseIn(r, offEverything, text).length > 0).map((r) => r.id);
  const claimed = (rule: RuleId, text: string) => claimsOf(RULES.find((r) => r.id === rule)!, text);

  it('catches each kind of claim the production build cannot keep', () => {
    expect(hits('Speak your letters in English, Hindi or Spanish.')).toEqual(['languages']);
    expect(hits('diary,bilingual,keepsake')).toEqual(['languages']);
    expect(hits('Write it together.')).toEqual(['coParent']);
    expect(hits('Only you and the people you invite can read your book.')).toEqual(['coParent']);
    expect(hits('Send an invitation to the other parent.')).toEqual(['coParent']);
    expect(hits('Your letters sync when you sign in.')).toEqual(['sync']);
    expect(hits('Recordings are backed up in our encrypted backup.')).toEqual(['backup']);
    expect(hits('Every word kept exactly as you said it.')).toEqual(['exactWords']);
  });

  it('catches any language but English, named or not', () => {
    expect(claimed('languages', 'Speak in Tamil, Gujarati or German.')).toEqual(['tamil', 'gujarati', 'german']);
    expect(claimed('languages', 'Talk in your home language.')).toEqual(['home language']);
    expect(claimed('languages', 'Say it in any language.')).toEqual(['any language']);
    expect(claimed('languages', 'Seven spoken languages, and 12 languages soon.')).toEqual(['seven spoken languages', '12 languages']);
    expect(claimed('languages', 'All spoken languages welcome.')).toEqual(['spoken languages']);
    expect(claimed('languages', 'Talk in your own language.')).toEqual(['own language']);
    expect(LANGUAGE_NAMES).toContain('Tamil');
  });

  it('catches accounts, the cloud and iCloud', () => {
    expect(hits('Create an account to keep your book.')).toEqual(['sync']);
    expect(hits('Your letters live in the cloud.')).toEqual(['sync']);
    expect(hits('Letters follow you to all your devices.')).toEqual(['sync']);
    expect(hits('Log in on your next phone.')).toEqual(['sync']);
    expect(hits('Recordings are saved to iCloud.')).toEqual(['backup']);
  });

  it('leaves the true lines alone', () => {
    expect(hits("The original recording stays with each letter, on your phone and in your iPhone's own backup if you use one.")).toEqual([]);
    expect(hits('This version works in English.')).toEqual([]);
    expect(hits('More languages follow one at a time, each after a native speaker has checked it.')).toEqual([]);
    expect(hits('Other languages are coming in a later update.')).toEqual([]);
    expect(hits('Open the book at bedtime and read together.')).toEqual([]);
    expect(hits('There is no account to create and no server copy of letters.')).toEqual([]);
    expect(hits('Cancel any time in your Apple Account subscriptions.')).toEqual([]);
    expect(hits('We never polish your words.')).toEqual([]);
  });

  it('counts claims one by one, so a second claim in a listed string is new', () => {
    const listed: Claim[] = [{ key: 'k', rule: 'coParent', claim: 'co-parent' }];
    const once: Claim[] = claimed('coParent', 'Invite your co-parent.').map((claim) => ({ key: 'k', rule: 'coParent', claim }));
    expect(beyond(once, listed)).toEqual(['k [coParent] "invite"']);
    const twice: Claim[] = claimed('coParent', 'Your co-parent, and their co-parent.').map((claim) => ({ key: 'k', rule: 'coParent', claim }));
    expect(beyond(twice, listed)).toEqual(['k [coParent] "co-parent"']);
  });

  it('reads JSX text and template literals from web source, and skips comments and imports', () => {
    const source = [
      "import x from './S08Languages';",
      '/** Exactly as you said it. */',
      'const a = `Open ${NAME} in Hindi`;',
      'export const S = () => <p className="x">Write it <b>together</b> with your co-parent</p>;',
    ].join('\n');
    const strings = stringsIn('Fake.tsx', source);
    expect(strings).toEqual(['Open   in Hindi', 'x', 'Write it', 'together', 'with your co-parent']);
  });

  it('resolves removedBy only to a live backlog item, a decision or a pull request', () => {
    const backlog = '#### BL-900 Open thing\n- Status: ready.\n\n#### BL-901 Old thing\n- Status: done (abc).\n- **BL-902 Bullet.** Owner: x.\n';
    const decisions = '| D-200 | A decision | Decided |\n';
    expect(unresolved('BL-900', backlog, decisions)).toBeNull();
    expect(unresolved('BL-902', backlog, decisions)).toBeNull();
    expect(unresolved('BL-901', backlog, decisions)).toMatch(/done/);
    expect(unresolved('BL-999', backlog, decisions)).toMatch(/not in/);
    expect(unresolved('D-200', backlog, decisions)).toBeNull();
    expect(unresolved('D-201', backlog, decisions)).toMatch(/not in/);
    expect(unresolved('#437', backlog, decisions)).toBeNull();
    expect(unresolved(undefined, backlog, decisions)).toBe('missing');
    expect(unresolved('soon', backlog, decisions)).toMatch(/not #n/);
  });

  it('drops a rule once its capability is on', () => {
    const on: Profile = { englishOnly: false, heard: ['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt'], signIn: true, sync: true, coParent: true, backup: true, ...ALL_MEDIA_OFF, wordsExactlyAsSaid: false };
    const text = 'Hindi; invite your co-parent; sign in to sync; backed up to iCloud; exactly as you said it';
    expect(RULES.filter((r) => falseIn(r, on, text).length > 0).map((r) => r.id)).toEqual(['exactWords']);
  });

  it('judges each named language on its own: true only for a language the build hears (D-125 item 2)', () => {
    const languages = RULES.find((r) => r.id === 'languages')!;
    const enEs: Profile = { ...offEverything, englishOnly: false, heard: ['en', 'es'] };
    expect(falseIn(languages, enEs, 'Speak in Spanish.')).toEqual([]);
    expect(falseIn(languages, enEs, 'Speak in English, Spanish, Hindi or Mandarin.')).toEqual(['hindi', 'mandarin']);
    // A language the app never hears is false in every build, the full one included.
    const every: Profile = { ...enEs, heard: ['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt'] };
    expect(falseIn(languages, every, 'Speak in Tamil or German.')).toEqual(['tamil', 'german']);
    expect(falseIn(languages, every, 'Hindi, Chinese, Mandarin, French, Arabic, Portuguese, Spanish')).toEqual([]);
    // English alone, by either switch: every named language is false, as before.
    expect(falseIn(languages, offEverything, 'Speak in Spanish.')).toEqual(['spanish']);
    expect(falseIn(languages, { ...offEverything, englishOnly: true, heard: ['en', 'es'] }, 'Talk in your home language.')).toEqual(['home language']);
    // Counts and "any language" are true only once the build hears more than English.
    expect(falseIn(languages, enEs, 'Talk in your home language.')).toEqual([]);
  });

  it('maps every served language name to a code the app has, and no other', () => {
    for (const [name, code] of Object.entries(NAME_TO_CODE)) {
      expect(LANGUAGE_NAMES.map((n) => n.toLowerCase()), name).toContain(name);
      expect(['hi', 'es', 'zh', 'fr', 'ar', 'pt'], name).toContain(code);
    }
  });
});

// ---------------------------------------------------------------------------
// Memory Library (NX-39 v2 R1, R44, R55; BL-863). Nothing here adds content: it fixes, before any library code or
// copy exists, which sentences may be said and when.
// ---------------------------------------------------------------------------

describe('[NX-39-R55] a claim ships only with its capability and its proof, and no frequency claim ships at all', () => {
  const off: Profile = { englishOnly: true, heard: ['en'], signIn: false, sync: false, coParent: false, backup: false, ...ALL_MEDIA_OFF, wordsExactlyAsSaid: false };
  const ruleOf = (id: RuleId) => RULES.find((r) => r.id === id)!;
  const falseIn = (p: Profile, text: string) => RULES.filter((r) => claimsOf(r, text).some((c) => !claimTrue(r, p, c))).map((r) => r.id);
  /** The ledger sentence as a person would see it, with the placeholder filled. */
  const said = (sentence: string) => sentence.replace(/\{app\}/g, 'The app');

  it('reads every phase switch from capabilities.ts, all off in the production profile', () => {
    for (const cap of MEDIA_CAPABILITIES) expect(profile[cap], cap).toBe(false);
    expect(Object.keys(profile).filter((k) => k in ALL_MEDIA_OFF).sort()).toEqual([...MEDIA_CAPABILITIES].sort());
  });

  it('has one ledger row per trust sentence, numbered 1 to 24, each with a phase, a proof and the capability it needs', () => {
    expect(CLAIMS_LEDGER.map((r) => r.n)).toEqual(Array.from({ length: 24 }, (_, i) => i + 1));
    for (const row of CLAIMS_LEDGER) {
      expect(row.sentence.trim(), `row ${row.n}`).not.toBe('');
      expect(row.proof.trim(), `row ${row.n}`).not.toBe('');
      expect(['P0', 'P1', 'P2a', 'P2b', 'P2c', 'P3', 'P4a']).toContain(row.phase);
      if (row.needs !== null) for (const c of row.needs) expect(MEDIA_CAPABILITIES, `row ${row.n}`).toContain(c);
      // A row with no capability is a rule of the product and makes no pattern; every other row has one.
      expect(row.pattern === null, `row ${row.n}`).toBe(row.needs === null || row.n === 24);
    }
  });

  it('fails each ledger sentence while its capability is off, and passes it once a capability it needs is on', () => {
    for (const row of CLAIMS_LEDGER) {
      if (row.pattern === null || row.needs === null) continue;
      const rule = `ledger${row.n}` as RuleId;
      const text = said(row.inContext ?? row.sentence);
      expect(falseIn(off, text), `row ${row.n} off`).toContain(rule);
      for (const cap of row.needs) {
        expect(falseIn({ ...off, [cap]: true }, text), `row ${row.n} with ${cap}`).not.toContain(rule);
      }
      // A capability the row does not need does not make it true.
      for (const cap of MEDIA_CAPABILITIES.filter((c) => !row.needs!.includes(c))) {
        expect(falseIn({ ...off, [cap]: true }, text), `row ${row.n} with only ${cap}`).toContain(rule);
      }
    }
  });

  it('fails a claim in the first sentence of a store listing, the website and a notification alike (the text, not the surface, is judged)', () => {
    expect(falseIn(off, 'Add a photo from Apple\'s own sheet.')).toEqual(['ledger1']);
    expect(falseIn(off, 'Photos in your export have no location.')).toEqual(['ledger23']);
    expect(falseIn({ ...off, photos: true }, 'Photos in your export have no location.')).toEqual([]);
  });

  it('fails the denial claims while the capability that falsifies them is on, and passes them while it is off', () => {
    const denials: [RuleId, string, MediaCapability[]][] = [
      ['denyMetadata', "We never read a photo's location.", ['mediaMetadata', 'mediaLibrary']],
      ['denyMetadata', 'It does not use a photo\'s date.', ['mediaMetadata', 'mediaLibrary']],
      ['denyLibrary', 'We do not look at your library.', ['mediaLibrary', 'moments']],
      ['denyLibrary', 'The rest of your library is not read.', ['mediaLibrary', 'moments']],
      ['denyBackground', 'It is never read in the background.', ['mediaBackground']],
      ['denyBackground', 'Nothing runs in the background.', ['mediaBackground']],
    ];
    for (const [rule, text, caps] of denials) {
      expect(falseIn(off, text), `${text} (off)`).toEqual([]);
      for (const cap of caps) expect(falseIn({ ...off, [cap]: true }, text), `${text} with ${cap}`).toEqual([rule]);
    }
  });

  it('judges "in the background" and "when closed" as a claim of the background top-up, not as a denial', () => {
    expect(falseIn(off, 'It also checks in the background.')).toEqual(['inBackground']);
    expect(falseIn(off, 'It may check when the app is closed.')).toEqual(['inBackground']);
    expect(falseIn({ ...off, mediaBackground: true }, 'It also checks in the background.')).toEqual([]);
    // The denial line must not be read twice: it is not also an "in the background" claim.
    expect(falseIn({ ...off, mediaBackground: true }, 'It is never read in the background.')).toEqual(['denyBackground']);
  });

  it('fails every frequency and freshness line in every profile, even with every switch on', () => {
    const allOn: Profile = { ...off, photos: true, mediaMetadata: true, mediaLibrary: true, moments: true, mediaBackground: true, occasions: true, englishOnly: false, signIn: true, sync: true, coParent: true, backup: true };
    for (const text of [
      'It looks two or three times a day.',
      'Checks 2 to 3 times a day.',
      'We look a few times a day.',
      'Looks three times a day.',
      'It checks every day.',
      'Your days are always up to date.',
      'Looks twice a day.',
    ]) {
      for (const p of [off, { ...off, mediaBackground: true }, allOn]) expect(falseIn(p, text), text).toContain('readFrequency');
    }
    // The parent's own yearly date is not a read frequency.
    expect(falseIn(off, 'Every year')).toEqual([]);
  });

  it('fails "stays on your phone" and "nothing is sent to us" unless the registry has the line', () => {
    for (const text of ['Your photos stay on your phone.', 'The book stays on this phone.', 'Nothing is sent to us.', 'Nothing leaves your iPhone.']) {
      expect(falseIn(off, text), text).toEqual(['staysOnPhone']);
      expect(falseIn({ ...off, photos: true, mediaMetadata: true, mediaLibrary: true, moments: true }, text), text).toEqual(['staysOnPhone']);
    }
    expect(registered('store.description', 'staysOnPhone')).toBe(false);
    // A registry row counts only with its counsel version.
    const registry = [{ key: 'k', rule: 'staysOnPhone' as const, counselVersion: 'v1' }, { key: 'blank', rule: 'staysOnPhone' as const, counselVersion: ' ' }];
    const via = (key: string) => registry.some((r) => r.key === key && r.rule === 'staysOnPhone' && r.counselVersion.trim() !== '');
    expect(via('k')).toBe(true);
    expect(via('blank')).toBe(false);
  });

  it('fails "found", "noticed" and "knows" about photos and trips', () => {
    for (const text of ['We found 12 photos from your trip.', 'The app noticed a few moments.', 'It knows where you went.', 'It knows your photos.']) {
      expect(falseIn({ ...off, mediaLibrary: true, moments: true }, text), text).toEqual(['surfacing']);
    }
    expect(falseIn(off, 'We found the page you were looking for.')).toEqual([]);
  });

  it('leaves today\'s true lines alone', () => {
    for (const text of [
      "The original recording stays with each letter, on your phone and in your iPhone's own backup if you use one.",
      'Choose the days you want a reminder for.',
      'Reminders stay quiet from 9:30 PM to 7 AM.',
      'It never writes anything for you.',
      'Every year',
      'Keep the app on your phone up to date with the App Store.'.replace('up to date with', 'current via'),
    ]) {
      expect(falseIn(off, text), text).toEqual([]);
    }
  });

  it('matches no ledger pattern, denial, frequency or surfacing rule anywhere in today\'s surfaces', () => {
    // The production test above already fails on any of them; this names the rule ids so a loosened pattern is visible.
    const ids = new Set(claims(profile).map((c) => c.rule));
    const media = [...ids].filter((r) => /^ledger|^deny|^inBackground$|^readFrequency$|^surfacing$/.test(r));
    expect(media).toEqual([]);
  });

  it('lists every content path of the read set that exists, and reads the memory library paths as soon as they appear', () => {
    const present = MEMORY_LIBRARY_PATHS_WHEN_PRESENT.filter((path) => leaves(get(IN_APP_ROOT, path), path).length > 0);
    // Today none exists. When one does, surfaces() has already read it; this line is the reminder to move it into IN_APP_PROMISES.
    expect(present, 'move these into IN_APP_PROMISES in the pull request that adds them').toEqual([]);
    const withFake = { ...IN_APP_ROOT, en: { ...en, memoryLibrary: { ask: { reads: 'It checks 3 times a day.' } } } };
    const read = MEMORY_LIBRARY_PATHS_WHEN_PRESENT.flatMap((path) => leaves(get(withFake, path), path));
    expect(read).toEqual([{ path: 'en.memoryLibrary', text: 'It checks 3 times a day.' }].map((l) => ({ path: `${l.path}.ask.reads`, text: l.text })));
  });

  it('fails if a memoryLibrary subtree or file exists in packages/content and is not in the read set', () => {
    const listed = [...IN_APP_PROMISES, ...MEMORY_LIBRARY_PATHS_WHEN_PRESENT] as readonly string[];
    const covered = (path: string) => listed.some((l) => path === l || path.startsWith(`${l}.`) || l.startsWith(`${path}.`));
    expect(unlistedSubtrees(contentExports, /^memoryLibrary$/i, listed)).toEqual([]);
    // Positive controls: an unlisted subtree is found at any depth, a listed one is not.
    const fake = { en: { deep: { memoryLibrary: { a: 'x' } } }, features: { memoryLibrary: { a: 'y' } } };
    expect(unlistedSubtrees(fake, /^memoryLibrary$/i, ['features.memoryLibrary'])).toEqual(['en.deep.memoryLibrary']);
    expect(covered('features.memoryLibrary.ask')).toBe(true);
    expect(covered('en.memoryLibrary')).toBe(true);
    expect(covered('en.library')).toBe(false);
    const files = readdirSync(fileURLToPath(new URL('../src', import.meta.url)), { recursive: true, encoding: 'utf8' }).filter((f) => /memory-?library/i.test(f));
    expect(files, 'a memoryLibrary copy file must be read by this test: add its export path to MEMORY_LIBRARY_PATHS_WHEN_PRESENT').toEqual([]);
    expect(ruleOf('readFrequency').trueWhen(off)).toBe(false);
  });
});

/** Dotted paths of every object key matching `name`, at any depth, that no entry of `listed` covers. */
function unlistedSubtrees(root: unknown, name: RegExp, listed: readonly string[], path = '', seen = new Set<unknown>()): string[] {
  if (!root || typeof root !== 'object' || seen.has(root)) return [];
  seen.add(root);
  return Object.entries(root as Record<string, unknown>).flatMap(([k, v]) => {
    const here = path ? `${path}.${k}` : k;
    const hit = name.test(k) && !listed.some((l) => here === l || here.startsWith(`${l}.`));
    return [...(hit ? [here] : []), ...unlistedSubtrees(v, name, listed, here, seen)];
  });
}

