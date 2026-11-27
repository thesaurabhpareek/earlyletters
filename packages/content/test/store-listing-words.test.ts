/**
 * BL-1337: the store listing words stay true of the submitted build (FR-MKT-08, FR-MKT-09, FR-MKT-11, FR-MKT-16).
 * Requirement rows: docs/product/prd/functions/marketing.md, section 3. Nothing here changes a requirement row.
 *
 * This file is new on purpose: store-listing.test.ts (NS-38-R2, BL-1315) and claims-capabilities.test.ts (RT-REL-03)
 * are edited by other open work, so neither is touched here. Both are read, not imported: their helpers are local.
 *
 * The build is read from apps/mobile/eas.json as data (the content package imports no app code, CODE-R10), in the
 * `production` profile, which is the store build: servers on, so sign-in is required (D-160, D-170).
 *
 * - FR-MKT-08. Every sentence of the description and the promotional text has a claims row below (CLAIMS_ROWS). A row
 *   names the build facts it needs (servers on, our recording backup off, English only) and its source: a row of the
 *   listing audit (docs/store/SCREENSHOT-COPY-AUDIT.md, the claims check of 21 to 23 Nov 2026), a D-id, or a repo file.
 *   The claims inventory (docs/reviews/2026-10-claims-inventory.md, section 3a) quotes the 28 Oct listing, whose lines
 *   are gone, so its rows cannot be matched to today's sentences; the audit is the newest per-line reading. A new
 *   sentence with no row fails, a row whose sentence is gone fails, and a row whose build fact is false fails. The test
 *   proves each line was read against a source and a build fact; it does not prove the source's verdict is right.
 * - FR-MKT-09. What's New names a feature only by a registered clause whose card claim is in the description, names
 *   no feature whose build switch is off in production, and never says coming soon, beta, early access, preview or a
 *   count.
 * - FR-MKT-11. The keyword field holds only words on ALLOWED_KEYWORDS (each with its source) and fails on the
 *   backlog row's words and on a competitor's name, read from docs/research/competitors/us.md section 2.1.
 * - FR-MKT-16. The four public texts that say what leaves the phone (the description's privacy paragraph, screenshot
 *   6's subline, the website's privacy points in site.ts s09, and /support) cite one label file, the one the label
 *   guard reads (scripts/release/label-effect.mjs LABEL_FILE). The label answers they rely on are pinned, so a label
 *   change fails here until those four texts are read again in the same pull request, and none of the four may state
 *   a practice the label in force contradicts.
 *
 * If a test fails on today's words, the content owner changes the words (D-172); the builder does not.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { storeListing } from '../src/store.en';
import { en } from '../src/strings.en';
import { authCopy } from '../src';
import { site as webSite } from '../../../apps/web/src/content/site';
import { supportCopy } from '../../../apps/web/src/lib/support/copy';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

/** Sentences, split as store-listing.test.ts splits them: after . ! or ?, and at each line break. */
const sentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

// ---------------------------------------------------------------------------
// The store build, read from eas.json.
// ---------------------------------------------------------------------------

type Env = Record<string, string>;

function profileEnv(name: string): Env {
  const eas = JSON.parse(read('apps/mobile/eas.json')) as { build: Record<string, { env?: Env }> };
  const env = eas.build[name]?.env;
  if (!env) throw new Error(`apps/mobile/eas.json has no build.${name}.env`);
  return env;
}

const production = profileEnv('production');
const on = (env: Env, key: string) => (env[key] ?? '').trim().toLowerCase() === 'on';

/** Build facts a listing sentence can depend on. Each reads the env the way the app's own switch does. */
type Need = 'servers on' | 'our backup off' | 'English only';
const NEEDS: Readonly<Record<Need, (env: Env) => boolean>> = {
  // capabilities.ts: sign-in and sync follow EXPO_PUBLIC_SERVER_FEATURES; sign-in is required when it is on (D-160).
  'servers on': (env) => on(env, 'EXPO_PUBLIC_SERVER_FEATURES'),
  // Our recording backup (NS-08); the person's own iPhone backup is theirs and true in every build.
  'our backup off': (env) => !on(env, 'EXPO_PUBLIC_BACKUP'),
  // English only by the switch and by the spoken-language list (D-121 item 1, D-125 item 2).
  'English only': (env) =>
    on(env, 'EXPO_PUBLIC_ENGLISH_ONLY') && (env.EXPO_PUBLIC_SPOKEN_LANGUAGES ?? 'en').split(',').map((c) => c.trim()).join(',') === 'en',
};

// ---------------------------------------------------------------------------
// FR-MKT-08: one claims row per listing sentence.
// ---------------------------------------------------------------------------

const AUDIT = 'docs/store/SCREENSHOT-COPY-AUDIT.md';

/** First cells of the listing audit's "Field / section" table: the rows a source may name. */
function auditRows(markdown = read(AUDIT)): string[] {
  const lines = markdown.split('\n');
  const head = lines.findIndex((l) => l.startsWith('| Field / section |'));
  if (head < 0) return [];
  const out: string[] = [];
  for (const line of lines.slice(head + 2)) {
    if (!line.startsWith('|')) break;
    out.push(line.split('|')[1].trim());
  }
  return out;
}

/** A source: `audit:<row>` (a row of the listing audit), `D-nnn` (a decision of record) or a repo path. */
type Row = { say: string; needs?: readonly Need[]; source: string };

// The audit says the plain description lines (the opening paragraph, "A minute is plenty", "Names spelled your way")
// passed the content rules and say nothing the build does not do, and gives them no row, so they cite the audit file.
// The closing audience line has no audit row either; it cites the file too, and its truth is not checked here.
const PLAIN = AUDIT;
const [promise1, promise2] = sentences(en.trust.promise);
const [voice1, voice2] = sentences(en.trust.voice);

const CLAIMS_ROWS: readonly Row[] = [
  // Promotional text.
  { say: 'Tell your child about today.', source: 'audit:Promotional text' },
  { say: 'A minute is plenty.', source: 'audit:Promotional text' },
  { say: 'It stays in your words.', source: 'audit:Promotional text' },
  { say: 'Every word we change is marked, and your original recording is kept unchanged.', source: 'audit:Promotional text' },
  // Opening.
  { say: `${brand.name}: letters to your child, in your own words and voice.`, source: 'D-139' },
  { say: 'Tell your child one thing about today.', source: PLAIN },
  { say: 'The first laugh, the long night, the song you made up in the car.', source: PLAIN },
  { say: 'It becomes a letter in your own words, with your voice kept beside it.', source: PLAIN },
  { say: 'Years from now, your child can read it, and hear how you sounded when you said it.', source: PLAIN },
  // IT STAYS IN YOUR WORDS.
  { say: 'IT STAYS IN YOUR WORDS', source: 'audit:IT STAYS IN YOUR WORDS' },
  { say: 'Your words are written down on your phone, and the app only fixes small slips, like an um, a repeat or a name spelled your way.', source: 'audit:IT STAYS IN YOUR WORDS' },
  { say: 'It never adds a word.', source: 'audit:IT STAYS IN YOUR WORDS' },
  { say: 'Every word we change is marked, and you can put any of them back.', source: 'audit:IT STAYS IN YOUR WORDS' },
  { say: 'We never rewrite your words, shorten them or write for you.', source: 'audit:IT STAYS IN YOUR WORDS' },
  { say: 'A word can be misheard, so have a quick read before you keep a letter.', source: 'audit:IT STAYS IN YOUR WORDS' },
  { say: 'Letters you type stay as you typed them.', source: 'audit:IT STAYS IN YOUR WORDS' },
  // YOUR VOICE, KEPT.
  { say: 'YOUR VOICE, KEPT', source: 'audit:YOUR VOICE, KEPT' },
  { say: "Every letter you speak keeps its recording, on your phone and in your iPhone's own backup if you use one.", needs: ['our backup off'], source: 'audit:YOUR VOICE, KEPT' },
  { say: voice1, source: 'D-061' },
  { say: voice2, source: 'D-061' },
  // READ TOGETHER AT BEDTIME.
  { say: 'READ TOGETHER AT BEDTIME', source: 'audit:READ TOGETHER AT BEDTIME' },
  { say: 'Open Read together and go through the book one letter at a time, oldest first.', source: 'audit:READ TOGETHER AT BEDTIME' },
  { say: 'Listen to the letters you spoke, with the words on the screen.', source: 'audit:READ TOGETHER AT BEDTIME' },
  { say: 'Typed letters are there too, for you to read aloud.', source: 'audit:READ TOGETHER AT BEDTIME' },
  // A MINUTE IS PLENTY.
  { say: 'A MINUTE IS PLENTY', source: PLAIN },
  { say: "Some nights it's a sentence, some nights a long letter.", source: PLAIN },
  { say: 'Stuck for words?', source: PLAIN },
  { say: "There's a question to start with.", source: PLAIN },
  { say: 'If today was quiet, tap "Not much today" and that\'s enough.', source: PLAIN },
  { say: 'Nothing keeps score.', source: PLAIN },
  // A BOOK THAT GROWS BY MONTH.
  { say: 'A BOOK THAT GROWS BY MONTH', source: 'audit:A BOOK THAT GROWS BY MONTH' },
  { say: "Each letter goes into your child's month of age, so the book reads in order.", source: 'audit:A BOOK THAT GROWS BY MONTH' },
  { say: 'Expecting?', source: 'audit:A BOOK THAT GROWS BY MONTH' },
  { say: 'Start before the birth, in a part of the book called Before You.', source: 'audit:A BOOK THAT GROWS BY MONTH' },
  { say: 'Twins or more each get their own book.', source: 'audit:A BOOK THAT GROWS BY MONTH' },
  // NAMES SPELLED YOUR WAY.
  { say: 'NAMES SPELLED YOUR WAY', source: PLAIN },
  { say: 'Add the names and home words you use, like a nickname or the name of a stuffed rabbit, so we spell them your way.', source: PLAIN },
  // PRIVATE BY DEFAULT.
  { say: 'PRIVATE BY DEFAULT', source: 'audit:PRIVATE BY DEFAULT' },
  { say: promise1, source: 'D-061' },
  { say: promise2, source: 'D-061' },
  { say: 'You sign in to keep your book.', needs: ['servers on'], source: 'audit:PRIVATE BY DEFAULT' },
  { say: "If you agree to sync, the words of your letters and your child's name and dates are kept on our servers so they reach a new phone.", needs: ['servers on'], source: 'audit:PRIVATE BY DEFAULT' },
  { say: 'Recordings stay on the phone that made them.', needs: ['our backup off'], source: 'audit:PRIVATE BY DEFAULT' },
  { say: 'Keep any letter just for you, out of the book.', source: 'audit:PRIVATE BY DEFAULT' },
  { say: 'Delete one and it waits in Recently deleted for 30 days.', source: 'audit:PRIVATE BY DEFAULT' },
  // REMINDERS, ONLY IF YOU WANT THEM.
  { say: 'REMINDERS, ONLY IF YOU WANT THEM', source: 'audit:REMINDERS' },
  { say: 'Reminders are off until you turn them on.', source: 'audit:REMINDERS' },
  { say: 'You pick the days and the time, and none comes after 9:30 at night.', source: 'audit:REMINDERS' },
  // TAKE IT WITH YOU.
  { say: 'TAKE IT WITH YOU', source: 'audit:TAKE IT WITH YOU' },
  { say: 'Export your book any time, for free: your letters, your recordings and a PDF of the book.', source: 'audit:TAKE IT WITH YOU' },
  // IN ENGLISH.
  { say: 'IN ENGLISH', needs: ['English only'], source: 'audit:IN ENGLISH' },
  { say: 'This version writes down letters spoken in English.', needs: ['English only'], source: 'audit:IN ENGLISH' },
  { say: 'The speech model is a one-time download, on Wi-Fi unless you turn on cellular data, 575 MB on most iPhones and smaller on some, and you choose when it starts.', source: 'audit:IN ENGLISH' },
  { say: 'Until it is ready, your recordings are kept and the words follow.', source: 'audit:IN ENGLISH' },
  // PLUS.
  { say: 'PLUS', source: 'audit:PLUS' },
  { say: 'Your first two letters are free, so you can see how it feels.', source: 'audit:PLUS' },
  { say: 'To keep adding letters, choose Plus: $4.99 a month with the first month free, or $49.99 a year with the first 2 months free.', source: 'packages/content/src/pricing.ts' },
  { say: 'The free months are for people new to Plus.', source: 'audit:PLUS' },
  { say: "One plan covers every child's book and works with Family Sharing.", source: 'audit:PLUS' },
  { say: 'A new letter past the free two waits until you decide.', source: 'audit:PLUS' },
  { say: 'Every letter you have kept stays yours to read, play and export, with or without Plus.', source: 'audit:PLUS' },
  { say: 'Payment is charged to your Apple Account.', source: 'audit:PLUS' },
  { say: 'Plus renews automatically unless you turn off renewal at least 24 hours before the end of the current period.', source: 'audit:PLUS' },
  { say: 'Manage or cancel any time in your Apple Account settings.', source: 'audit:PLUS' },
  // Closing and legal links.
  { say: 'For parents of babies and young children, from the first weeks to the first years.', source: PLAIN },
  { say: `Terms of Service: ${brand.web.terms}`, source: 'audit:Terms and Privacy URLs' },
  { say: `Privacy Policy: ${brand.web.privacy}`, source: 'audit:Terms and Privacy URLs' },
];

type Listing = { promotionalText: string; description: string };
const listingSentences = (l: Listing) => [...sentences(l.promotionalText), ...sentences(l.description)];
const realListing: Listing = { promotionalText: storeListing.promotionalText, description: storeListing.description };

/** Listing sentences with no claims row (a sentence said twice needs one row only). */
function unrowed(l: Listing, rows: readonly Row[] = CLAIMS_ROWS): string[] {
  const known = new Set(rows.map((r) => r.say));
  return listingSentences(l).filter((s) => !known.has(s));
}

/** Rows whose build facts are false in this env, as "sentence: needs fact". */
function rowsFalseIn(env: Env, rows: readonly Row[] = CLAIMS_ROWS): string[] {
  return rows.flatMap((r) => (r.needs ?? []).filter((n) => !NEEDS[n](env)).map((n) => `${r.say}: needs ${n}`));
}

const DECISIONS = read('docs/DECISIONS.md');

/** Why a row's source does not resolve, or null when it does. */
function unresolvedSource(source: string, audit = auditRows()): string | null {
  const a = /^audit:(.+)$/.exec(source);
  if (a) return audit.some((row) => row === a[1] || row.startsWith(`${a[1]} `)) ? null : `no "${a[1]}" row in ${AUDIT}`;
  const d = /^D-(\d+)$/.exec(source);
  if (d) return new RegExp(`^\\| D-${d[1]} \\|`, 'm').test(DECISIONS) ? null : 'not in docs/DECISIONS.md';
  return existsSync(join(root, source)) ? null : 'no such file';
}

/** Sentences that make an account optional. "Apple Account" is Apple's, where Plus is managed. */
const ACCOUNTLESS = [/\bwithout (an )?account\b/i, /\bno account\b/i, /\bwith or without (an )?account\b/i, /\baccount (is )?optional\b/i];
const accountless = (l: Listing) =>
  listingSentences(l).filter((s) => ACCOUNTLESS.some((re) => re.test(s.replace(/\bApple Account\b/g, ''))));

describe('[FR-MKT-08] every description line is true of the sign-in-required store build', () => {
  it('[FR-MKT-08] reads the production profile: servers on, so sign-in is required (D-160, D-170)', () => {
    expect(NEEDS['servers on'](production)).toBe(true);
  });

  it('[FR-MKT-08] every sentence of the description and the promotional text has a claims row', () => {
    expect(unrowed(realListing), 'a listing sentence with no claims row: the content owner adds its row with a source').toEqual([]);
  });

  it('[FR-MKT-08] every claims row is still in the listing, so the rows move with the words', () => {
    const said = new Set(listingSentences(realListing));
    expect(CLAIMS_ROWS.filter((r) => !said.has(r.say)).map((r) => r.say), 'rows whose sentence is gone: remove or reword the row').toEqual([]);
    expect(new Set(CLAIMS_ROWS.map((r) => r.say)).size, 'one row per sentence').toBe(CLAIMS_ROWS.length);
  });

  it('[FR-MKT-08] every claims row holds in the production profile', () => {
    expect(rowsFalseIn(production), 'a listing line whose build fact is false in the store build').toEqual([]);
  });

  it('[FR-MKT-08] every claims row names a source that resolves', () => {
    expect(auditRows().length, `${AUDIT} has its Field / section table`).toBeGreaterThan(5);
    const bad = CLAIMS_ROWS.flatMap((r) => {
      const why = unresolvedSource(r.source);
      return why ? [`${r.say} (${r.source}): ${why}`] : [];
    });
    expect(bad).toEqual([]);
  });

  it('[FR-MKT-08] no line makes the account optional: the only accountless path left is the outage start', () => {
    // The old "Without an account, your book stays on your phone." was replaced by the servers-on sentences (exec
    // rulings 23 Nov 2026, item 8a). The one way to start without signing in is the outage screen's local start, which
    // shows only when sign-in cannot be reached; the listing does not describe an outage, so it names no accountless path.
    expect(storeListing.description).not.toContain('Without an account, your book stays on your phone.');
    expect(accountless(realListing)).toEqual([]);
    expect(authCopy.outage.startLocal).toBe('Start on this phone');
  });

  it('[FR-MKT-08] [mutant] a description line with no claims row is caught', () => {
    const planted = 'Now with a shared family album.';
    expect(unrowed({ ...realListing, description: `${realListing.description}\n${planted}` })).toEqual([planted]);
  });

  it('[FR-MKT-08] [mutant] a row whose build fact is false is caught', () => {
    expect(rowsFalseIn({ ...production, EXPO_PUBLIC_BACKUP: 'on' })).toContain('Recordings stay on the phone that made them.: needs our backup off');
    expect(rowsFalseIn({ ...production, EXPO_PUBLIC_SERVER_FEATURES: 'off' })).toContain('You sign in to keep your book.: needs servers on');
    expect(rowsFalseIn({ ...production, EXPO_PUBLIC_SPOKEN_LANGUAGES: 'en,es' })).toContain('IN ENGLISH: needs English only');
  });

  it('[FR-MKT-08] [mutant] an accountless line is caught, and an Apple Account line is not', () => {
    const l = { ...realListing, description: `${realListing.description}\nWithout an account, your book stays on your phone.` };
    expect(accountless(l)).toEqual(['Without an account, your book stays on your phone.']);
    expect(accountless({ ...realListing, description: 'Manage it in your Apple Account.' })).toEqual([]);
  });

  it('[FR-MKT-08] [mutant] a source that names no audit row, decision or file is caught', () => {
    expect(unresolvedSource('audit:NO SUCH SECTION')).not.toBeNull();
    expect(unresolvedSource('D-99999')).not.toBeNull();
    expect(unresolvedSource('docs/no-such-file.md')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// FR-MKT-09: What's New.
// ---------------------------------------------------------------------------

/** A What's New sentence that names no feature: the version line. */
const WHATS_NEW_FRAMES = [`This is the first version of ${brand.name}.`];

/**
 * The features What's New may name, each by its clause and the description heading that carries its enabled claim.
 * `flag` is the build switch that must be on in production, or null for a v1.0 core feature with no switch.
 */
const WHATS_NEW_FEATURES: readonly { clause: RegExp; claim: string; flag: string | null }[] = [
  { clause: /^talk or type a letter to your child$/i, claim: 'IT STAYS IN YOUR WORDS', flag: null },
  { clause: /^keep your voice with it$/i, claim: 'YOUR VOICE, KEPT', flag: null },
  { clause: /^read together at bedtime$/i, claim: 'READ TOGETHER AT BEDTIME', flag: null },
  { clause: /^export your book any time$/i, claim: 'TAKE IT WITH YOU', flag: null },
];

/**
 * Features whose card has a build switch, or none yet in any store build, with the words that would name them
 * (marketing.md section 3a intent lines). While the switch is off, What's New may not use these words.
 */
const SWITCHED_FEATURES: readonly { card: string; words: RegExp; isOn: (env: Env) => boolean }[] = [
  { card: 'NS-01 photo with a letter', words: /\b(?:picture|photo)s?\b/i, isOn: (env) => on(env, 'EXPO_PUBLIC_PHOTOS') },
  { card: 'NS-02 Find', words: /\bfind\b|\bsearch\b/i, isOn: (env) => on(env, 'EXPO_PUBLIC_BOOK_SEARCH') },
  { card: 'NS-08 recording backup', words: /\bback(?:ed|s)? ?up\b|\bcloud\b/i, isOn: (env) => on(env, 'EXPO_PUBLIC_BACKUP') },
  { card: 'NS-24 read the year back', words: /\b(?:a|the) year of letters\b|\bread (?:a|the) year\b/i, isOn: (env) => on(env, 'EXPO_PUBLIC_READ_THE_YEAR') },
  { card: 'Moments tab (Q-X1-12)', words: /\bmoments\b/i, isOn: (env) => on(env, 'EXPO_PUBLIC_MOMENTS_TAB') },
  // No store build has these: co-parent has no entry point in any store build (D-161, D-162), and NS-05 and NS-06 have
  // no build switch yet, so nothing turns them on.
  { card: 'NS-25 both parents', words: /\bboth parents\b|\bco-?parent|\binvit/i, isOn: () => false },
  { card: 'NS-05 send one letter', words: /\bsend one letter\b|\bshare\b/i, isOn: () => false },
  { card: 'NS-06 A firsts', words: /\bfirsts\b|\bas a first\b/i, isOn: () => false },
  { card: 'NS-06 B sealed letter', words: /\bseal(?:ed)?\b|\bfor a day you choose\b/i, isOn: () => false },
  { card: 'NS-06 C quick capture', words: /\block screen\b/i, isOn: () => false },
];

/** Never in What's New (FR-MKT-09; D-060, App Review 2.2 and 2.3.12): no promise of later, no beta, no count. */
const WHATS_NEW_NEVER: readonly RegExp[] = [
  /\bcoming soon\b|\bsoon\b|\bcoming\b/i,
  /\bbeta\b/i,
  /\bearly access\b|\bearly version\b/i,
  /\bpreview\b/i,
  /\d/,
  /\b(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|dozens?|hundreds?)\b/i,
];

/** What's New problems for this build: forbidden words, unregistered clauses, off features, missing claims. */
function whatsNewProblems(text: string, env: Env, description = storeListing.description): string[] {
  const out: string[] = [];
  for (const re of WHATS_NEW_NEVER) if (re.test(text)) out.push(`never: ${re}`);
  for (const f of SWITCHED_FEATURES) if (!f.isOn(env) && f.words.test(text)) out.push(`switch off: ${f.card}`);
  for (const sentence of sentences(text)) {
    if (WHATS_NEW_FRAMES.includes(sentence)) continue;
    const clauses = sentence
      .replace(/[.!?]$/, '')
      .split(/,\s*(?:and\s+)?|\s+and\s+/)
      .map((c) => c.trim())
      .filter(Boolean);
    for (const clause of clauses) {
      const feature = WHATS_NEW_FEATURES.find((f) => f.clause.test(clause));
      if (!feature) out.push(`no registered feature: ${clause}`);
      else if (feature.flag && !on(env, feature.flag)) out.push(`switch off: ${clause}`);
      else if (!sentences(description).includes(feature.claim)) out.push(`no claim in the description: ${feature.claim}`);
    }
  }
  return out;
}

describe("[FR-MKT-09] What's New names a feature only through its enabled claim", () => {
  it("[FR-MKT-09] today's What's New passes for the production build", () => {
    expect(whatsNewProblems(storeListing.whatsNewV1, production)).toEqual([]);
  });

  it('[FR-MKT-09] every registered feature has its claim heading in the description', () => {
    const heads = new Set(sentences(storeListing.description));
    expect(WHATS_NEW_FEATURES.filter((f) => !heads.has(f.claim)).map((f) => f.claim)).toEqual([]);
  });

  const mutants: Array<[string, string]> = [
    ['coming soon', 'Pictures in letters are coming soon.'],
    ['beta', 'This is our beta.'],
    ['early access', 'Early access for the first families.'],
    ['preview', 'A preview of Read together.'],
    ['a count', 'Three new ways to keep a letter.'],
    ['a digit', 'Export your book any time, 2 ways.'],
    ['a feature whose switch is off', 'Add a picture to a letter.'],
    ['a feature no store build has', 'Write the book with both parents.'],
    ['an unregistered clause', 'Talk or type a letter to your child, and tag a friend.'],
  ];
  for (const [label, line] of mutants) {
    it(`[FR-MKT-09] [mutant] refuses a What's New with ${label}`, () => {
      expect(whatsNewProblems(`${storeListing.whatsNewV1} ${line}`, production).length).toBeGreaterThan(0);
    });
  }

  it("[FR-MKT-09] [mutant] a feature's words pass once its switch is on, and only then", () => {
    const line = 'Find a letter by a word in it.';
    expect(whatsNewProblems(line, production)).toContain('switch off: NS-02 Find');
    expect(whatsNewProblems(line, { ...production, EXPO_PUBLIC_BOOK_SEARCH: 'on' })).not.toContain('switch off: NS-02 Find');
  });
});

// ---------------------------------------------------------------------------
// FR-MKT-11: the keyword field.
// ---------------------------------------------------------------------------

const STAGED = 'docs/store/app-store-staged-1.0-proposal.md keyword row (31 Oct 2026)';
const AUDITED = `${AUDIT} Keywords row`;

/** The only keywords the field may hold, each with where it comes from. A new word needs its row here first. */
const ALLOWED_KEYWORDS: Readonly<Record<string, string>> = {
  diary: STAGED,
  keepsake: STAGED,
  memory: 'D-139 item 2: the keyword field carries "memory" so that search still matches',
  book: 'D-139 item 2: the keyword field carries "book" so that search still matches',
  voice: 'D-139 item 1: letters to your child, in your own words and voice',
  newborn: STAGED,
  toddler: STAGED,
  child: 'D-139 item 1: letters to your child',
  parenting: AUDITED,
  audio: STAGED,
  recorder: AUDITED,
  bedtime: 'the description heading READ TOGETHER AT BEDTIME',
  mom: STAGED,
  dad: STAGED,
  mama: AUDITED,
};

/** The backlog row's words (BL-1337 scope item 3). "photo book" is matched with and without its space. */
const FORBIDDEN_KEYWORDS = ['kids', 'milestone', 'tracker', 'photo book', 'album', 'smart', 'share', 'backup'] as const;

const COMPETITORS_DOC = 'docs/research/competitors/us.md';

/**
 * Competitor and other-app names from the App Store table in docs/research/competitors/us.md section 2.1: the name
 * before the first ":" or " - " of each listed app. Two listings put a generic phrase first ("Baby Book: Dujourbaby",
 * "Baby Book : Folio"), so the part after it is the name. Apple's own app is listed as "Journal", which is a common word
 * the store name already uses (D-139), so it is "Apple Journal". The list holds the apps that table profiles; a rival
 * named only elsewhere in the research is not read.
 */
export function competitorNames(markdown = read(COMPETITORS_DOC)): string[] {
  const start = markdown.indexOf('### 2.1 ');
  if (start < 0) return [];
  const section = markdown.slice(start, markdown.indexOf('\n## ', start + 1));
  const names: string[] = [];
  for (const m of section.matchAll(/^\| \[([^\]]+)\]\([^)]*\) \(([^)]*)\)/gm)) {
    const parts = m[1].split(/\s*:\s*|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
    let name = parts[0];
    if (/^baby book$/i.test(name) && parts[1]) name = parts[1];
    if (/^Apple Inc\.?$/.test(m[2].trim())) name = `Apple ${name}`;
    names.push(name);
    // "Tinybeans Private Family Album" (Tinybeans USA Ltd): a title that opens with the seller's brand names it too.
    const brandWord = m[1].split(/\s+/)[0];
    if (name.includes(' ') && brandWord.toLowerCase() === m[2].trim().split(/\s+/)[0].toLowerCase()) names.push(brandWord);
  }
  return [...new Set(names)];
}

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Keyword field problems: words off the allowed list, the forbidden words, competitor names, the 100-byte limit. */
function keywordProblems(field: string, competitors: readonly string[] = competitorNames()): string[] {
  const out: string[] = [];
  const words = field.split(',').map((w) => w.trim());
  if (Buffer.byteLength(field, 'utf8') > 100) out.push('over 100 bytes');
  for (const w of words) if (!(w in ALLOWED_KEYWORDS)) out.push(`not allowed: ${w}`);
  // Apple matches keywords in combination, so a forbidden phrase or a two-word name is also refused across two words.
  const singles = words.map(squash);
  const pairs = words.flatMap((a, i) => words.flatMap((b, j) => (i === j ? [] : [squash(`${a}${b}`)])));
  for (const f of FORBIDDEN_KEYWORDS) {
    const k = squash(f);
    if (singles.some((w) => w.includes(k)) || (f.includes(' ') && pairs.includes(k))) out.push(`forbidden: ${f}`);
  }
  for (const name of competitors) {
    const k = squash(name);
    if (singles.includes(k) || pairs.includes(k)) out.push(`competitor: ${name}`);
  }
  return out;
}

describe('[FR-MKT-11] the keyword field holds only an allowed list of true words', () => {
  it('[FR-MKT-11] reads the competitor names from the research table', () => {
    const names = competitorNames();
    expect(names.length).toBeGreaterThan(30);
    expect(names).toEqual(expect.arrayContaining(['Qeepsake', 'Tinybeans', 'FamilyAlbum', 'Day One', 'Apple Journal', 'Dujourbaby', 'Folio']));
  });

  it("[FR-MKT-11] today's keyword field passes", () => {
    expect(keywordProblems(storeListing.keywords)).toEqual([]);
  });

  it('[FR-MKT-11] every allowed word has a source, and none is forbidden or a competitor name', () => {
    for (const [word, source] of Object.entries(ALLOWED_KEYWORDS)) {
      expect(source.trim(), word).not.toBe('');
      expect(word, 'one word, lower case, no space').toMatch(/^[a-z]+$/);
      expect(keywordProblems(word), word).toEqual([]);
    }
    expect(existsSync(join(root, 'docs/store/app-store-staged-1.0-proposal.md'))).toBe(true);
    expect(DECISIONS).toMatch(/^\| D-139 \|/m);
  });

  const forbiddenMutants: Array<[string, string]> = [
    ['kids', 'kids'],
    ['milestone', 'milestones'],
    ['tracker', 'tracker'],
    ['photo book', 'photobook'],
    ['photo book across two words', 'photo,book'],
    ['album', 'album'],
    ['smart', 'smart'],
    ['share', 'share'],
    ['backup', 'backup'],
    ['a competitor name', 'qeepsake'],
    ['a two-word competitor name across two words', 'tiny,voices'],
  ];
  for (const [label, planted] of forbiddenMutants) {
    it(`[FR-MKT-11] [mutant] refuses a field with ${label}`, () => {
      const problems = keywordProblems(`${planted},diary`);
      expect(problems.some((p) => p.startsWith('forbidden') || p.startsWith('competitor'))).toBe(true);
    });
  }

  it('[FR-MKT-11] [mutant] refuses a word outside the allowed list, such as AI, grandparents, a price or a language', () => {
    for (const w of ['ai', 'grandparents', 'free', 'spanish', 'scrapbook']) expect(keywordProblems(`diary,${w}`)).toContain(`not allowed: ${w}`);
  });

  it('[FR-MKT-11] [mutant] refuses a field over 100 bytes', () => {
    expect(keywordProblems(`${storeListing.keywords},diary`)).toContain('over 100 bytes');
  });
});

// ---------------------------------------------------------------------------
// FR-MKT-16: a label change moves every public privacy line.
// ---------------------------------------------------------------------------

/** The label file, as the label guard names it (scripts/release/label-effect.mjs exports LABEL_FILE). */
function guardLabelFile(source = read('scripts/release/label-effect.mjs')): string {
  const m = /export const LABEL_FILE = '([^']+)';/.exec(source);
  if (!m) throw new Error('LABEL_FILE not found in scripts/release/label-effect.mjs');
  return m[1];
}

const privacyParagraph = (description: string): string => {
  const lines = description.split('\n');
  const at = lines.indexOf('PRIVATE BY DEFAULT');
  return at < 0 ? '' : lines[at + 1] ?? '';
};
const sixth = storeListing.screenshots.find((s) => s.id === '06-privacy');

/** The four texts FR-MKT-16 moves with the label, each with its file and the label file it answers to. */
const LABEL_TEXTS: readonly { id: string; file: string; label: string; text: string }[] = [
  { id: 'store description privacy paragraph', file: 'packages/content/src/store.en.ts', label: 'docs/legal/app-store-privacy-labels.md', text: privacyParagraph(storeListing.description) },
  { id: 'screenshot 6 subline', file: 'packages/content/src/store.en.ts', label: 'docs/legal/app-store-privacy-labels.md', text: sixth ? `${sixth.caption} ${sixth.subline}` : '' },
  { id: 'website privacy points (site.ts s09)', file: 'apps/web/src/content/site.ts', label: 'docs/legal/app-store-privacy-labels.md', text: webSite.scenes.s09.points.join(' ') },
  {
    id: '/support',
    file: 'apps/web/src/lib/support/copy.ts',
    label: 'docs/legal/app-store-privacy-labels.md',
    text: supportCopy.sections.filter((s) => s.id === 'recordings' || s.id === 'privacy').flatMap((s) => s.blocks).join(' '),
  },
];

/** The "Collected?" answer of each data type in section 3.2 of the label file, by "Category / Data type". */
export function labelAnswers(markdown: string): Record<string, string> {
  const start = markdown.indexOf('### 3.2 Data types');
  if (start < 0) return {};
  const section = markdown.slice(start, markdown.indexOf('\n### ', start + 1));
  const out: Record<string, string> = {};
  for (const line of section.split('\n')) {
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length < 3 || cells[0] === 'Category' || /^-+$/.test(cells[0])) continue;
    out[`${cells[0]} / ${cells[1]}`] = cells[2].replace(/\*\*/g, '');
  }
  return out;
}

/**
 * The label answers in force when the four texts were last read together (27 Nov 2026, label file 2.2.0). When any
 * answer changes, this test fails: read the four LABEL_TEXTS against the new label, change the ones it makes untrue
 * (through the content owner), and move this pin, all in the same pull request.
 */
const PINNED_ANSWERS_SHA256 = '645cf3ec3710d6d72e5e9cad0347dd4f740b11acfba568f9ab608b71c96ac1d7';

const answersDigest = (answers: Record<string, string>) =>
  createHash('sha256')
    .update(JSON.stringify(Object.entries(answers).sort(([a], [b]) => a.localeCompare(b))))
    .digest('hex');

/**
 * Practices a text may not state while the label says the data is not collected. Read from the answers, so a label
 * that turns to Yes lifts the rule only for its own data type.
 */
function contradictions(texts: readonly { id: string; text: string }[], answers: Record<string, string>): string[] {
  const notCollected = (key: string) => /^No\b/.test(answers[key] ?? '');
  const rules: { when: boolean; says: RegExp; why: string }[] = [
    {
      when: notCollected('User Content / Audio Data'),
      says: /\brecordings?\b[^.]*\b(?:our servers?|the cloud|backed up|uploaded|sent to us|we keep)\b|\b(?:back(?:s|ed)? up|upload)\b[^.]*\brecordings?\b/i,
      why: 'Audio Data is not collected: no recording leaves the phone',
    },
    {
      when: notCollected('User Content / Photos or Videos'),
      says: /\b(?:photos?|pictures?|videos?)\b[^.]*\b(?:our servers?|the cloud|backed up|uploaded|synced)\b/i,
      why: 'Photos or Videos is not collected',
    },
    {
      // Other User Content is collected (letter text syncs): no text may say the letters never leave the phone.
      when: !notCollected('User Content / Other User Content'),
      says: /\bletters?\b[^.]*\b(?:never leaves?|only on (?:your|this) phone|stays? on (?:your|this) phone)\b|\bnothing leaves\b/i,
      why: 'Other User Content is collected: letter text syncs to our servers',
    },
    {
      when: /^No\b/.test(answers['Usage Data / Product Interaction, Advertising Data, Other Usage Data'] ?? ''),
      says: /\bwe (?:track|measure|collect analytics)\b|\banalytics\b/i,
      why: 'Usage Data is not collected',
    },
  ];
  return texts.flatMap((t) => rules.filter((r) => r.when && r.says.test(t.text)).map((r) => `${t.id}: ${r.why}`));
}

describe('[FR-MKT-16] a privacy label change moves every public privacy line in one release', () => {
  const labelFile = guardLabelFile();
  const answers = labelAnswers(read(labelFile));

  it('[FR-MKT-16] the four texts cite the same label file, the one the label guard reads', () => {
    expect(LABEL_TEXTS.map((t) => t.id)).toEqual(['store description privacy paragraph', 'screenshot 6 subline', 'website privacy points (site.ts s09)', '/support']);
    expect(new Set(LABEL_TEXTS.map((t) => t.label))).toEqual(new Set([labelFile]));
    for (const t of LABEL_TEXTS) {
      expect(existsSync(join(root, t.file)), t.file).toBe(true);
      expect(t.text.trim(), `${t.id} is read`).not.toBe('');
    }
  });

  it('[FR-MKT-16] reads the label answers the texts rely on', () => {
    expect(answers['User Content / Audio Data']).toMatch(/^No until backup ships/);
    expect(answers['User Content / Other User Content']).toBe('Yes');
    expect(answers['User Content / Photos or Videos']).toBe('No');
  });

  it('[FR-MKT-16] the label answers match the pin: a label change fails until the four texts are read again', () => {
    expect(answersDigest(answers), `the label answers in ${labelFile} changed: re-read ${LABEL_TEXTS.map((t) => t.id).join(', ')} and move PINNED_ANSWERS_SHA256 in the same pull request`).toBe(PINNED_ANSWERS_SHA256);
  });

  it('[FR-MKT-16] no one of the four texts states a practice the label in force contradicts', () => {
    expect(contradictions(LABEL_TEXTS, answers)).toEqual([]);
  });

  it('[FR-MKT-16] [mutant] a changed label answer moves the digest', () => {
    expect(answersDigest({ ...answers, 'User Content / Audio Data': 'Yes' })).not.toBe(answersDigest(answers));
  });

  it('[FR-MKT-16] [mutant] a text that says recordings leave the phone is refused while Audio Data is not collected', () => {
    const planted = [...LABEL_TEXTS, { id: '/support', text: 'Your recordings are backed up to our servers.' }];
    expect(contradictions(planted, answers)).toContain('/support: Audio Data is not collected: no recording leaves the phone');
    expect(contradictions(planted, { ...answers, 'User Content / Audio Data': 'Yes' })).toEqual([]);
  });

  it('[FR-MKT-16] [mutant] a text that says letters never leave the phone is refused while letter text is collected', () => {
    const planted = [{ id: 'screenshot 6 subline', text: 'Your letters never leave your phone.' }];
    expect(contradictions(planted, answers)).toEqual(['screenshot 6 subline: Other User Content is collected: letter text syncs to our servers']);
  });
});
