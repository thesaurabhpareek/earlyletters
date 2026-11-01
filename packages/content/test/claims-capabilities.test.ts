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
  needs: string;
};

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
    needs: 'languages other than English (EXPO_PUBLIC_ENGLISH_ONLY off)',
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
    RULES.filter((r) => !r.trueWhen(p)).flatMap((r) => claimsOf(r, text).map((claim) => ({ key: path, rule: r.id, claim }))),
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
    expect(profile).toEqual({ englishOnly: true, signIn: false, sync: false, coParent: false, backup: false, wordsExactlyAsSaid: false });
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

describe('the claim rules', () => {
  const offEverything: Profile = { englishOnly: true, signIn: false, sync: false, coParent: false, backup: false, wordsExactlyAsSaid: false };
  const hits = (text: string) => RULES.filter((r) => !r.trueWhen(offEverything) && claimsOf(r, text).length > 0).map((r) => r.id);
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
    const on: Profile = { englishOnly: false, signIn: true, sync: true, coParent: true, backup: true, wordsExactlyAsSaid: false };
    const text = 'Hindi; invite your co-parent; sign in to sync; backed up to iCloud; exactly as you said it';
    expect(RULES.filter((r) => !r.trueWhen(on) && claimsOf(r, text).length > 0).map((r) => r.id)).toEqual(['exactWords']);
  });
});
