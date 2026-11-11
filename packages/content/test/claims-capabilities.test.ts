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
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { en, features, onboardingStories, permissions, storeListing } from '../src';
import { site as webSite } from '../../../apps/web/src/content/site';
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

type RuleId = 'languages' | 'coParent' | 'sync' | 'backup' | 'exactWords';

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
];

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
  const inApp = IN_APP_PROMISES.flatMap((path) => leaves(get(IN_APP_ROOT, path), path)).filter(
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
    RULES.flatMap((r) => claimsOf(r, text).filter((claim) => !claimTrue(r, p, claim)).map((claim) => ({ key: path, rule: r.id, claim }))),
  );
}

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
];

/**
 * Today's count. Lower it when rows go; never raise it: a new false claim is fixed in the copy, not listed. It was 17 before
 * PR #698 (servers on made the sign-in, sync and co-parent rows true); the two left are exactWords, true in no profile.
 * STORE_BUILD_CLAIMS below says which claims the store build may make and why.
 */
const KNOWN_VIOLATIONS_CAP = 2;

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
    // Build 12 (founder, 8 Nov 2026) is servers on: sign-in, sync and co-parent are true; backup stays off.
    expect(profile).toEqual({ englishOnly: true, heard: ['en'], signIn: true, sync: true, coParent: true, backup: false, wordsExactlyAsSaid: false });
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
    const fresh = beyond(claims(profile), KNOWN_VIOLATIONS).map((c) => `${c}: needs ${RULES.find((r) => c.includes(`[${r.id}]`))!.needs}`);
    expect(fresh, 'new claims that contradict the production profile: fix the copy, do not add a row').toEqual([]);
  });

  it('lists only claims that still exist, so the list shrinks', () => {
    const fixed = beyond(KNOWN_VIOLATIONS, claims(profile));
    expect(fixed, 'these are fixed (or the key moved): remove them from KNOWN_VIOLATIONS').toEqual([]);
  });

  it('caps the list at today\'s count', () => {
    expect(KNOWN_VIOLATIONS.length).toBeLessThanOrEqual(KNOWN_VIOLATIONS_CAP);
  });

  it('names, for every known violation, the change that removes it and why', () => {
    const bad = KNOWN_VIOLATIONS.flatMap((v) => {
      const why = unresolved(v.removedBy);
      return why ? [`${id(v)}: removedBy ${v.removedBy ?? '(none)'} ${why}`] : [];
    });
    expect(bad, 'each row needs removedBy: an open #n, a live BL-n or a D-n').toEqual([]);
    for (const v of KNOWN_VIOLATIONS) {
      expect(v.reason.trim(), id(v)).not.toBe('');
      expect(v.reason, id(v)).not.toMatch(/\n/);
    }
  });
});

/**
 * What the store build (the `production` profile, App Store) may claim, and why (PR #698 turned servers on; the cap of
 * KNOWN_VIOLATIONS fell from 17 to 2 because sign-in, sync and co-parent claims became true). One row per rule. `allowed`
 * is what the test expects of the profile; `why` is the fact that makes it so. A row changes only with the fact.
 *
 * The co-parent row is the one that needs care. `capabilities.coParent` follows the server switch alone. The invite flow
 * is a separate thing: inviting and joining are offered only in alpha builds once #720 and #737 land (`inviteDestination`
 * and `planIncomingLink` take the alpha flag; BL-882), so the store build can have the switch on and no flow. A claim
 * such as "Write it together" or "Only you and the people you invite" is true only if a person can do it, so the
 * co-parent claims are allowed exactly when the flow exists in the store build, not when the switch is on.
 */
const STORE_BUILD_CLAIMS: Readonly<Record<RuleId, { allowed: boolean | 'with the invite flow'; why: string }>> = {
  languages: { allowed: false, why: 'The first store build hears English only (D-121 item 1): no other language is named, and "more languages come later" is the one true line.' },
  coParent: { allowed: 'with the invite flow', why: 'True only while the store build can invite and join. Alpha-only invites (#720, #737) make every co-parent claim false in the store build.' },
  sync: { allowed: true, why: 'Servers are on in production (Build 12, founder, 8 Nov 2026): sign-in and sync work against scribe-prod.' },
  backup: { allowed: false, why: 'EXPO_PUBLIC_BACKUP is off in production until the restore drill passes (T27).' },
  exactWords: { allowed: false, why: 'The default view removes ums and repeats and the speech model can mishear (D-086, D-133 item 2): never true in any profile.' },
};

/**
 * Does the store build have the co-parent flow? `destination` is `inviteDestination(entry, true, false)` (servers on,
 * alpha off); `keepsInviteToken` is `planIncomingLink(invite, { serverFeatures: true, alpha: false }).keepInviteToken`.
 * Sending an invite and receiving one (the link) must both work for "invite your co-parent" to be true.
 */
export function coParentFlowInStoreBuild(destination: (entry: string) => string, keepsInviteToken: boolean): boolean {
  return destination('invite_new') === 'flow' && destination('invite_link') === 'flow' && keepsInviteToken;
}

/** Why the capability and the flow disagree, or null when the tie holds. */
export function coParentTie(capabilityCoParent: boolean, flowInStoreBuild: boolean): string | null {
  if (capabilityCoParent === flowInStoreBuild) return null;
  return capabilityCoParent
    ? 'capabilities.coParent is true but the store build has no invite flow (alpha only): co-parent claims would ship in a build that cannot keep them. Make the capability depend on the flow, or keep the claims out.'
    : 'the store build has the invite flow but capabilities.coParent is false: the true co-parent lines are being treated as false. Update the capability.';
}

describe('what the store build may claim (RT-REL-03; PR #698)', () => {
  const rule = (id: RuleId) => RULES.find((r) => r.id === id)!;

  async function storeFlow(): Promise<boolean> {
    const entry = await import('../../../apps/mobile/src/lib/family/entry.logic');
    // The alpha flag is the third argument once #720 and #737 land; before that it is ignored and the flow reads as present.
    const destination = entry.inviteDestination as unknown as (e: never, serverFeatures: boolean, alpha?: boolean) => string;
    const plan = entry.planIncomingLink as unknown as (l: { kind: 'invite'; token: string }, o: Record<string, unknown>) => { keepInviteToken: boolean };
    const keeps = plan({ kind: 'invite', token: 't' }, { serverFeatures: true, alpha: false, gateStopped: false, path: '/' }).keepInviteToken;
    return coParentFlowInStoreBuild((e) => destination(e as never, true, false), keeps);
  }

  it('claims co-parent in the store build only while the store build has the invite flow', async () => {
    expect(coParentTie(profile.coParent, await storeFlow())).toBeNull();
  });

  it('fails when the capability is on and the invite flow is alpha only, and the other way round', () => {
    const alphaOnly = (e: string) => (e === 'invite_new' || e === 'invite_link' ? 'coming_soon' : 'flow');
    expect(coParentFlowInStoreBuild(alphaOnly, false)).toBe(false);
    expect(coParentTie(true, coParentFlowInStoreBuild(alphaOnly, false))).toMatch(/no invite flow/);
    // Sending works but a link keeps no token: half a flow is no flow.
    expect(coParentFlowInStoreBuild(() => 'flow', false)).toBe(false);
    expect(coParentFlowInStoreBuild((e) => (e === 'invite_new' ? 'flow' : 'coming_soon'), true)).toBe(false);
    expect(coParentFlowInStoreBuild(() => 'flow', true)).toBe(true);
    expect(coParentTie(false, true)).toMatch(/treated as false/);
    expect(coParentTie(true, true)).toBeNull();
    expect(coParentTie(false, false)).toBeNull();
  });

  it('judges the store build rule by rule against the table of what it may claim', async () => {
    const flow = await storeFlow();
    for (const r of RULES) {
      const row = STORE_BUILD_CLAIMS[r.id];
      expect(row.why.trim(), r.id).not.toBe('');
      const expected = row.allowed === 'with the invite flow' ? flow : row.allowed;
      // trueWhen is the rule's switch; a rule with a per-claim judge (languages) is true of "more come later" lines only.
      expect(r.trueWhen(profile), `${r.id}: ${row.why}`).toBe(expected);
    }
    expect(Object.keys(STORE_BUILD_CLAIMS).sort()).toEqual(RULES.map((r) => r.id).sort());
  });

  it('keeps the only listed false claims to the exact-words rule, the one no build can keep', () => {
    // The cap fell from 17 to 2 when servers went on. What is left is exactWords: false in every profile and not tied to
    // any switch. Any other row means a claim the store build cannot keep, which is fixed in the copy, not listed.
    expect(KNOWN_VIOLATIONS.filter((v) => v.rule !== 'exactWords')).toEqual([]);
    expect(rule('exactWords').trueWhen(profile)).toBe(false);
    expect(KNOWN_VIOLATIONS_CAP).toBe(2);
  });
});

describe('the claim rules', () => {
  const offEverything: Profile = { englishOnly: true, heard: ['en'], signIn: false, sync: false, coParent: false, backup: false, wordsExactlyAsSaid: false };
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
    const on: Profile = { englishOnly: false, heard: ['en', 'hi', 'es', 'zh', 'fr', 'ar', 'pt'], signIn: true, sync: true, coParent: true, backup: true, wordsExactlyAsSaid: false };
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
