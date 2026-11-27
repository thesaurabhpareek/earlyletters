/**
 * BL-1337: the store listing words stay true of the submitted build (FR-MKT-08, FR-MKT-09, FR-MKT-11, FR-MKT-16).
 * Requirement rows: docs/product/prd/functions/marketing.md, section 3. Nothing here changes a requirement row.
 *
 * This file is new on purpose: store-listing.test.ts (NS-38-R2, BL-1315) and claims-capabilities.test.ts (RT-REL-03)
 * are edited by other open work, so neither is touched here. Both are read, not imported: their helpers are local.
 *
 * The rows these rules read (one claims row per listing sentence, the What's New clauses and the allowed keywords)
 * live in packages/content/src/store-claims.en.json, beside store.en.ts, so a copy edit moves its row there and never
 * this file. That file is read here as data; the package index does not export it and the app never reads it.
 *
 * The build is read from apps/mobile/eas.json as data, in the `production` profile (with any `extends` folded in by
 * scripts/release/store-flags.mjs resolveProfile), which is the store build: servers on, so sign-in is required
 * (D-160, D-170). The four web texts of FR-MKT-16 are imported from apps/web, as claims-capabilities.test.ts does.
 *
 * - FR-MKT-08. Every sentence of the description and the promotional text has a claims row. A row names the build
 *   facts it needs (servers on, our recording backup off, English only) and its source: a row of the listing audit
 *   (docs/store/SCREENSHOT-COPY-AUDIT.md, the claims check of 21 to 23 Nov 2026), a D-id, or a repo file. The claims
 *   inventory (docs/reviews/2026-10-claims-inventory.md, section 3a) quotes the 28 Oct listing, whose lines are gone,
 *   so its rows cannot be matched to today's sentences; the audit is the newest per-line reading. A new sentence with no
 *   row fails, a row whose sentence is gone fails, and a row whose build fact is false fails. The test proves each line
 *   was read against a source and a build fact; it does not prove the source's verdict is right.
 * - FR-MKT-09. What's New names a feature only by a registered clause whose card claim is in the description, names
 *   no feature whose build switch is off in production, and never says coming soon, beta, early access, preview or a
 *   count.
 * - FR-MKT-11. The keyword field holds only allowed words (each with its source) and fails on the FR row's named
 *   words (the backlog row's eight plus "AI" and "grandparents"), on a price, on the name of a language this build does
 *   not hear (read from packs/text-rules), and on a competitor's name (read from docs/research/competitors/us.md
 *   section 2.1).
 * - FR-MKT-16. The four public texts that say what leaves the phone (the description's privacy paragraph, screenshot
 *   6's subline, the website's privacy points in site.ts s09, and /support) are registered here and read from their
 *   files; none of them cites a label file, so this registry is what ties them to the one the label guard reads
 *   (LABEL_FILE, imported from scripts/release/label-effect.mjs). The label answers they rely on are pinned, so a label
 *   change fails here until those four texts are read again in the same pull request, and none of the four may state
 *   a practice the label in force contradicts.
 *
 * If a test fails on today's words, the content owner changes the words and their rows (D-172); the builder does not.
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { brand } from '@scribe/brand';
import { storeListing } from '../src/store.en';
import { authCopy } from '../src';
import { site as webSite } from '../../../apps/web/src/content/site';
import { supportCopy } from '../../../apps/web/src/lib/support/copy';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = (rel: string) => readFileSync(join(root, rel), 'utf8');

/** A repo script, imported at run time (the scripts are plain .mjs with no type declarations). */
const script = async <T>(rel: string) => (await import(pathToFileURL(join(root, rel)).href)) as T;
const { LABEL_FILE } = await script<{ LABEL_FILE: string }>('scripts/release/label-effect.mjs');
const { resolveProfile } = await script<{ resolveProfile: (build: unknown, name: string) => { env?: Env } | null }>('scripts/release/store-flags.mjs');

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
  const eas = JSON.parse(read('apps/mobile/eas.json')) as { build?: unknown };
  const profile = resolveProfile(eas.build, name);
  if (!profile?.env || Object.keys(profile.env).length === 0) throw new Error(`apps/mobile/eas.json has no build.${name}.env`);
  return profile.env;
}

const production = profileEnv('production');
const on = (env: Env, key: string) => (env[key] ?? '').trim().toLowerCase() === 'on';

/** Build facts a listing sentence can depend on. Each reads the env the way the app's own switch does. */
const NEEDS = {
  // capabilities.ts: sign-in and sync follow EXPO_PUBLIC_SERVER_FEATURES; sign-in is required when it is on (D-160).
  'servers on': (env: Env) => on(env, 'EXPO_PUBLIC_SERVER_FEATURES'),
  // Our recording backup (NS-08); the person's own iPhone backup is theirs and true in every build.
  'our backup off': (env: Env) => !on(env, 'EXPO_PUBLIC_BACKUP'),
  // English only by the switch and by the spoken-language list (D-121 item 1, D-125 item 2).
  'English only': (env: Env) =>
    on(env, 'EXPO_PUBLIC_ENGLISH_ONLY') && (env.EXPO_PUBLIC_SPOKEN_LANGUAGES ?? 'en').split(',').map((c) => c.trim()).join(',') === 'en',
} as const;
type Need = keyof typeof NEEDS;

// ---------------------------------------------------------------------------
// The claims file: rows the content owner edits beside the copy.
// ---------------------------------------------------------------------------

const CLAIMS_FILE = 'packages/content/src/store-claims.en.json';

/** A source: `audit:<row>` (a row of the listing audit), `D-nnn` (a decision of record) or a repo path. */
type Row = { say: string; needs?: readonly Need[]; source: string };
type Feature = { clause: string; claim: string; flag: string | null };
type Claims = { claims: Row[]; whatsNewFrames: string[]; whatsNewFeatures: Feature[]; keywords: Record<string, string> };

const PLACEHOLDERS: Readonly<Record<string, string>> = {
  'brand.name': brand.name,
  'brand.web.terms': brand.web.terms,
  'brand.web.privacy': brand.web.privacy,
};

/** The claims file, checked for shape, with its brand placeholders filled. Throws on anything it cannot read. */
function loadClaims(json: string): Claims {
  const bad = (why: string): never => {
    throw new Error(`${CLAIMS_FILE}: ${why}`);
  };
  const text = (v: unknown, where: string): string => (typeof v === 'string' && v.trim() !== '' ? v : bad(`${where} is not a sentence`));
  const fill = (v: unknown, where: string) => text(v, where).replace(/\{([\w.]+)\}/g, (m, key: string) => PLACEHOLDERS[key] ?? bad(`${where}: unknown placeholder ${m}`));
  const list = (v: unknown, where: string): unknown[] => (Array.isArray(v) ? v : bad(`${where} is not a list`));
  /** A misspelled key would be read as missing (a "neds" row loses its build fact), so every key must be known. */
  const keysOf = (v: unknown, where: string, known: readonly string[]): Record<string, unknown> => {
    const o = v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : bad(`${where || 'the file'} is not an object`);
    for (const k of Object.keys(o)) if (!known.includes(k)) bad(`${where ? `${where}: ` : ''}unknown key ${JSON.stringify(k)}`);
    return o;
  };
  const data = keysOf(JSON.parse(json), '', ['about', 'claims', 'whatsNewFrames', 'whatsNewFeatures', 'keywords']);
  const claims = list(data.claims, 'claims').map((r, i): Row => {
    const row = keysOf(r, `claims[${i}]`, ['say', 'needs', 'source']);
    const needList = row.needs === undefined ? undefined : list(row.needs, `claims[${i}].needs`);
    if (needList && needList.length === 0) bad(`claims[${i}].needs is empty`);
    const needs = needList?.map((n) => (typeof n === 'string' && Object.hasOwn(NEEDS, n) ? (n as Need) : bad(`claims[${i}]: unknown build fact ${JSON.stringify(n)}`)));
    return { say: fill(row.say, `claims[${i}].say`), ...(needs ? { needs } : {}), source: text(row.source, `claims[${i}].source`) };
  });
  const whatsNewFrames = list(data.whatsNewFrames, 'whatsNewFrames').map((f, i) => fill(f, `whatsNewFrames[${i}]`));
  const whatsNewFeatures = list(data.whatsNewFeatures, 'whatsNewFeatures').map((f, i): Feature => {
    const row = keysOf(f, `whatsNewFeatures[${i}]`, ['clause', 'claim', 'flag']);
    const flag = row.flag === null ? null : text(row.flag, `whatsNewFeatures[${i}].flag`);
    return { clause: text(row.clause, `whatsNewFeatures[${i}].clause`), claim: text(row.claim, `whatsNewFeatures[${i}].claim`), flag };
  });
  const kw = data.keywords && typeof data.keywords === 'object' && !Array.isArray(data.keywords) ? (data.keywords as Record<string, unknown>) : bad('keywords is not a map');
  const keywords = Object.fromEntries(Object.entries(kw).map(([w, src]) => [w, text(src, `keywords.${w}`)]));
  return { claims, whatsNewFrames, whatsNewFeatures, keywords };
}

const CLAIMS = loadClaims(read(CLAIMS_FILE));
const CLAIMS_ROWS = CLAIMS.claims;

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

  it('[FR-MKT-08] the claims file is data for this test only: the package index does not export it and no source imports it', () => {
    expect(CLAIMS_ROWS.length).toBeGreaterThan(50);
    const src = join(root, 'packages/content/src');
    const files = readdirSync(src, { recursive: true, encoding: 'utf8' }).filter((f) => /\.tsx?$/.test(f));
    expect(files.length).toBeGreaterThan(10);
    expect(files.filter((f) => readFileSync(join(src, f), 'utf8').includes('store-claims'))).toEqual([]);
  });

  it('[FR-MKT-08] every sentence of the description and the promotional text has a claims row', () => {
    expect(unrowed(realListing), `a listing sentence with no claims row: the content owner adds its row with a source in ${CLAIMS_FILE}`).toEqual([]);
  });

  it('[FR-MKT-08] every claims row is still in the listing, so the rows move with the words', () => {
    const said = new Set(listingSentences(realListing));
    expect(CLAIMS_ROWS.filter((r) => !said.has(r.say)).map((r) => r.say), `rows whose sentence is gone: remove or reword the row in ${CLAIMS_FILE}`).toEqual([]);
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
    expect(authCopy.outage.startLocal.trim()).not.toBe('');
  });

  it('[FR-MKT-08] [mutant] a description line with no claims row is caught', () => {
    const planted = 'Now with a shared family album.';
    expect(unrowed({ ...realListing, description: `${realListing.description}\n${planted}` })).toContain(planted);
  });

  it('[FR-MKT-08] [mutant] a one-word copy edit is caught until its row in the claims file moves with it', () => {
    const was = sentences(realListing.description).find((x) => x.split(' ').length > 4) ?? '';
    const now = was.replace(' ', ' truly ');
    const edited = { ...realListing, description: realListing.description.replace(was, now) };
    expect(now).not.toBe(was);
    expect(edited.description).not.toBe(realListing.description);
    expect(unrowed(edited)).toContain(now);
    const rows = CLAIMS_ROWS.map((r) => (r.say === was ? { ...r, say: now } : r));
    expect(unrowed(edited, rows)).not.toContain(now);
  });

  it('[FR-MKT-08] [mutant] the claims file refuses a row with an unknown build fact or placeholder', () => {
    const row = (r: object) => JSON.stringify({ claims: [r], whatsNewFrames: [], whatsNewFeatures: [], keywords: {} });
    expect(() => loadClaims(row({ say: 'A line.', needs: ['servers maybe'], source: AUDIT }))).toThrow(/unknown build fact/);
    expect(() => loadClaims(row({ say: '{brand.nickname} is here.', source: AUDIT }))).toThrow(/unknown placeholder/);
    expect(() => loadClaims(row({ say: 'A line.' }))).toThrow(/source is not a sentence/);
  });

  it('[FR-MKT-08] [mutant] the claims file refuses a key it does not know, so a misspelled "needs" cannot drop a build fact', () => {
    const file = (o: object) => JSON.stringify({ claims: [], whatsNewFrames: [], whatsNewFeatures: [], keywords: {}, ...o });
    expect(() => loadClaims(file({ claims: [{ say: 'A line.', neds: ['servers on'], source: AUDIT }] }))).toThrow(/claims\[0\]: unknown key "neds"/);
    expect(() => loadClaims(file({ whatsNewFeatures: [{ clause: 'a clause', claim: 'A claim', flag: null, flg: 'X' }] }))).toThrow(/whatsNewFeatures\[0\]: unknown key "flg"/);
    expect(() => loadClaims(file({ keyword: {} }))).toThrow(/unknown key "keyword"/);
    expect(() => loadClaims(file({ claims: [{ say: 'A line.', needs: ['toString'], source: AUDIT }] }))).toThrow(/unknown build fact "toString"/);
    expect(() => loadClaims(file({ claims: [{ say: 'A line.', needs: [], source: AUDIT }] }))).toThrow(/claims\[0\]\.needs is empty/);
    expect(loadClaims(file({ about: 'A note.', claims: [{ say: 'A line.', needs: ['servers on'], source: AUDIT }] })).claims).toEqual([{ say: 'A line.', needs: ['servers on'], source: AUDIT }]);
  });

  it('[FR-MKT-08] [mutant] a row whose build fact is false is caught', () => {
    const rows = (n: Need): Row[] => [{ say: 'A planted line.', needs: [n], source: AUDIT }];
    expect(rowsFalseIn({ ...production, EXPO_PUBLIC_BACKUP: 'on' }, rows('our backup off'))).toEqual(['A planted line.: needs our backup off']);
    expect(rowsFalseIn({ ...production, EXPO_PUBLIC_SERVER_FEATURES: 'off' }, rows('servers on'))).toEqual(['A planted line.: needs servers on']);
    expect(rowsFalseIn({ ...production, EXPO_PUBLIC_SPOKEN_LANGUAGES: 'en,es' }, rows('English only'))).toEqual(['A planted line.: needs English only']);
    expect(rowsFalseIn(production, [...rows('our backup off'), ...rows('servers on'), ...rows('English only')])).toEqual([]);
  });

  it('[FR-MKT-08] [mutant] an accountless line is caught, and an Apple Account line is not', () => {
    const l = { ...realListing, description: `${realListing.description}\nWithout an account, your book stays on your phone.` };
    expect(accountless(l)).toContain('Without an account, your book stays on your phone.');
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

/**
 * Features whose card has a build switch, or none yet in any store build, with the words that would name them
 * (marketing.md section 3a intent lines). While the switch is off, What's New may not use these words. Each switch is
 * read the way the app reads it.
 */
const SWITCHED_FEATURES: readonly { card: string; words: RegExp; isOn: (env: Env) => boolean }[] = [
  { card: 'NS-01 photo with a letter', words: /\b(?:picture|photo)s?\b/i, isOn: (env) => on(env, 'EXPO_PUBLIC_PHOTOS') },
  { card: 'NS-02 Find', words: /\bfind\b|\bsearch\b/i, isOn: (env) => on(env, 'EXPO_PUBLIC_BOOK_SEARCH') },
  { card: 'NS-08 recording backup', words: /\bback(?:ed|s)? ?up\b|\bcloud\b/i, isOn: (env) => on(env, 'EXPO_PUBLIC_BACKUP') },
  // readTheYearOn (apps/mobile/src/components/book/read-year.logic.ts): only "1" is on, not "on".
  { card: 'NS-24 read the year back', words: /\b(?:a|the) year of letters\b|\bread (?:a|the) year\b/i, isOn: (env) => env.EXPO_PUBLIC_READ_THE_YEAR === '1' },
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
function whatsNewProblems(text: string, env: Env, description = storeListing.description, features: readonly Feature[] = CLAIMS.whatsNewFeatures): string[] {
  const out: string[] = [];
  for (const re of WHATS_NEW_NEVER) if (re.test(text)) out.push(`never: ${re}`);
  for (const f of SWITCHED_FEATURES) if (!f.isOn(env) && f.words.test(text)) out.push(`switch off: ${f.card}`);
  for (const sentence of sentences(text)) {
    if (CLAIMS.whatsNewFrames.includes(sentence)) continue;
    const clauses = sentence
      .replace(/[.!?]$/, '')
      .split(/,\s*(?:and\s+)?|\s+and\s+/)
      .map((c) => c.trim())
      .filter(Boolean);
    for (const clause of clauses) {
      const feature = features.find((f) => f.clause.toLowerCase() === clause.toLowerCase());
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
    expect(CLAIMS.whatsNewFeatures.length).toBeGreaterThan(0);
    const heads = new Set(sentences(storeListing.description));
    expect(CLAIMS.whatsNewFeatures.filter((f) => !heads.has(f.claim)).map((f) => f.claim)).toEqual([]);
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

  it('[FR-MKT-09] [mutant] read the year back is on only at "1", as the app reads its switch', () => {
    const line = 'Read the year back at bedtime.';
    expect(whatsNewProblems(line, { ...production, EXPO_PUBLIC_READ_THE_YEAR: 'on' })).toContain('switch off: NS-24 read the year back');
    expect(whatsNewProblems(line, { ...production, EXPO_PUBLIC_READ_THE_YEAR: '1' })).not.toContain('switch off: NS-24 read the year back');
  });

  it('[FR-MKT-09] [mutant] a registered clause with a build switch passes only while that switch is on', () => {
    const features = [...CLAIMS.whatsNewFeatures, { clause: 'find any letter', claim: 'TAKE IT WITH YOU', flag: 'EXPO_PUBLIC_EXAMPLE' }];
    expect(whatsNewProblems('Find any letter.', production, storeListing.description, features)).toContain('switch off: Find any letter');
    expect(whatsNewProblems('Find any letter.', { ...production, EXPO_PUBLIC_EXAMPLE: 'on' }, storeListing.description, features)).not.toContain('switch off: Find any letter');
  });
});

// ---------------------------------------------------------------------------
// FR-MKT-11: the keyword field.
// ---------------------------------------------------------------------------

/** The only keywords the field may hold, each with where it comes from. A new word needs its row in the claims file. */
const ALLOWED_KEYWORDS = CLAIMS.keywords;

/**
 * FR-MKT-11's named words (marketing.md section 3): the backlog row's eight plus "grandparents", matched inside a word
 * ("grandparent" also refuses "grandparents"), and "photo book" with and without its space.
 */
const FORBIDDEN_KEYWORDS = ['kids', 'milestone', 'tracker', 'photo book', 'album', 'smart', 'share', 'grandparent', 'backup'] as const;
/** FR-MKT-11's "AI", matched as a whole word only, so it refuses "AI" and "A.I." but not "daily" or "email". */
const FORBIDDEN_WHOLE_WORDS = ['ai'] as const;
/** FR-MKT-11's prices: a digit, a currency sign, or a word that names a price. */
const PRICE_SIGN = /\d|[$\u00a2-\u00a5\u20ac\u20b9]/;
const PRICE_WORD = /^(?:free|prices?|cheap|discounts?|sales?|trials?|deals?)$/;

const COMPETITORS_DOC = 'docs/research/competitors/us.md';
const PACKS_DIR = 'packs/text-rules';

/**
 * Competitor and other-app names from the App Store table in docs/research/competitors/us.md section 2.1: the name
 * before the first ":" or " - " of each listed app. Two listings put a generic phrase first ("Baby Book: Dujourbaby",
 * "Baby Book : Folio"), so the part after it is the name. Apple's own app is listed as "Journal", which is a common word
 * the store name already uses (D-139), so it is "Apple Journal". The list holds the apps that table profiles; a rival
 * named only elsewhere in the research is not read.
 */
function competitorNames(markdown = read(COMPETITORS_DOC)): string[] {
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

const squash = (s: string) => s.normalize('NFD').toLowerCase().replace(/[^a-z0-9]/g, '');

/** The language packs the app knows: code, English name and native name (packs/text-rules/<code>.json). */
function languagePacks(): { code: string; names: string[] }[] {
  return readdirSync(join(root, PACKS_DIR))
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const pack = JSON.parse(read(`${PACKS_DIR}/${f}`)) as { language: string; name: { english: string; native: string } };
      return { code: pack.language, names: [pack.name.english, ...pack.name.english.split(/\s+/), pack.name.native] };
    });
}

/** What this build hears, as heard-languages.ts reads its two switches: English only wins, an unset list hears all. */
function heardCodes(env: Env, codes: readonly string[]): string[] {
  if (on(env, 'EXPO_PUBLIC_ENGLISH_ONLY')) return ['en'];
  const listed = (env.EXPO_PUBLIC_SPOKEN_LANGUAGES ?? '').split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);
  return listed.length === 0 ? [...codes] : codes.filter((c) => c === 'en' || listed.includes(c));
}

/** Names of the languages this build does not hear yet, squashed (a name in another script squashes to nothing). */
function unshippedLanguageNames(env: Env): string[] {
  const packs = languagePacks();
  const heard = new Set(heardCodes(env, packs.map((p) => p.code)));
  return [...new Set(packs.filter((p) => !heard.has(p.code)).flatMap((p) => p.names.map(squash)).filter((n) => n.length >= 3))];
}

/** Keyword field problems: words off the allowed list, the named words, prices, languages, competitors, 100 bytes. */
function keywordProblems(field: string, competitors: readonly string[] = competitorNames(), languages: readonly string[] = unshippedLanguageNames(production)): string[] {
  const out: string[] = [];
  const words = field.split(',').map((w) => w.trim());
  if (Buffer.byteLength(field, 'utf8') > 100) out.push('over 100 bytes');
  for (const w of words) if (!(w in ALLOWED_KEYWORDS)) out.push(`not allowed: ${w}`);
  // Apple matches keywords in combination, so a forbidden phrase or a two-word name is also refused across two words.
  const singles = words.map(squash);
  const pairs = words.flatMap((a, i) => words.flatMap((b, j) => (i === j ? [] : [squash(`${a}${b}`)])));
  const tokens = words.flatMap((w) => w.split(/[\s-]+/).map(squash)).filter(Boolean);
  for (const f of FORBIDDEN_KEYWORDS) {
    const k = squash(f);
    if (singles.some((w) => w.includes(k)) || (f.includes(' ') && pairs.includes(k))) out.push(`forbidden: ${f}`);
  }
  for (const f of FORBIDDEN_WHOLE_WORDS) if (tokens.includes(f) || singles.includes(f)) out.push(`forbidden: ${f}`);
  for (const w of words) if (PRICE_SIGN.test(w) || w.split(/[\s-]+/).some((t) => PRICE_WORD.test(squash(t)))) out.push(`price: ${w}`);
  for (const name of languages) if (singles.includes(name) || tokens.includes(name) || pairs.includes(name)) out.push(`language: ${name}`);
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

  it('[FR-MKT-11] reads the language names from the packs, and the production build hears English alone', () => {
    expect(heardCodes(production, languagePacks().map((p) => p.code))).toEqual(['en']);
    expect(unshippedLanguageNames(production)).toEqual(expect.arrayContaining(['spanish', 'espanol', 'hindi', 'french', 'francais', 'chinese']));
    expect(unshippedLanguageNames(production)).not.toContain('english');
  });

  it("[FR-MKT-11] today's keyword field passes", () => {
    expect(keywordProblems(storeListing.keywords)).toEqual([]);
  });

  it('[FR-MKT-11] every allowed word has a source, and none is a named word, a price, a language or a competitor name', () => {
    expect(Object.keys(ALLOWED_KEYWORDS).length).toBeGreaterThan(5);
    for (const [word, source] of Object.entries(ALLOWED_KEYWORDS)) {
      expect(source.trim(), word).not.toBe('');
      expect(word, 'one word, lower case, no space').toMatch(/^[a-z]+$/);
      expect(keywordProblems(word), word).toEqual([]);
    }
    expect(existsSync(join(root, 'docs/store/app-store-staged-1.0-proposal.md'))).toBe(true);
    expect(DECISIONS).toMatch(/^\| D-139 \|/m);
  });

  const forbiddenMutants: Array<[string, string, string]> = [
    ['kids', 'kids', 'forbidden: kids'],
    ['milestone', 'milestones', 'forbidden: milestone'],
    ['tracker', 'tracker', 'forbidden: tracker'],
    ['photo book', 'photobook', 'forbidden: photo book'],
    ['photo book across two words', 'photo,book', 'forbidden: photo book'],
    ['album', 'album', 'forbidden: album'],
    ['smart', 'smart', 'forbidden: smart'],
    ['share', 'share', 'forbidden: share'],
    ['backup', 'backup', 'forbidden: backup'],
    ['AI', 'AI', 'forbidden: ai'],
    ['ai in lower case', 'ai', 'forbidden: ai'],
    ['A.I.', 'A.I.', 'forbidden: ai'],
    ['AI inside a two-word keyword', 'ai diary', 'forbidden: ai'],
    ['grandparents', 'grandparents', 'forbidden: grandparent'],
    ['grandparent', 'grandparent', 'forbidden: grandparent'],
    ['a price with a currency sign', '$4.99', 'price: $4.99'],
    ['a price without a sign', '49.99', 'price: 49.99'],
    ['a price in euros', '\u20ac5', 'price: \u20ac5'],
    ['the word free', 'free', 'price: free'],
    ['the word trial', 'trial', 'price: trial'],
    ['a language this build does not hear', 'spanish', 'language: spanish'],
    ['a language by its own name', 'espanol', 'language: espanol'],
    ['one word of a two-word language name', 'mandarin', 'language: mandarin'],
    ['a competitor name', 'qeepsake', 'competitor: Qeepsake'],
    ['a two-word competitor name across two words', 'tiny,voices', 'competitor: Tiny Voices'],
  ];
  for (const [label, planted, problem] of forbiddenMutants) {
    it(`[FR-MKT-11] [mutant] refuses a field with ${label}`, () => {
      expect(keywordProblems(`${planted},diary`)).toContain(problem);
    });
  }

  it('[FR-MKT-11] [mutant] "ai" is a whole word: daily, email and mail are not refused as AI', () => {
    for (const w of ['daily', 'email', 'mail', 'aim']) {
      const problems = keywordProblems(`diary,${w}`);
      expect(problems, w).not.toContain('forbidden: ai');
      expect(problems, w).toContain(`not allowed: ${w}`);
    }
  });

  it('[FR-MKT-11] [mutant] a language name passes the language rule once the build hears that language, and only then', () => {
    const hearsSpanish = { ...production, EXPO_PUBLIC_ENGLISH_ONLY: 'off', EXPO_PUBLIC_SPOKEN_LANGUAGES: 'en,es' };
    expect(keywordProblems('spanish', competitorNames(), unshippedLanguageNames(hearsSpanish))).not.toContain('language: spanish');
    expect(keywordProblems('hindi', competitorNames(), unshippedLanguageNames(hearsSpanish))).toContain('language: hindi');
  });

  it('[FR-MKT-11] [mutant] refuses a word outside the allowed list, such as a scrapbook or a lullaby', () => {
    for (const w of ['scrapbook', 'lullaby', 'journey']) expect(keywordProblems(`diary,${w}`)).toContain(`not allowed: ${w}`);
  });

  it('[FR-MKT-11] [mutant] refuses a field over 100 bytes', () => {
    const word = Object.keys(ALLOWED_KEYWORDS)[0];
    const field = Array.from({ length: Math.ceil(101 / (word.length + 1)) + 1 }, () => word).join(',');
    expect(Buffer.byteLength(field, 'utf8')).toBeGreaterThan(100);
    expect(keywordProblems(field)).toContain('over 100 bytes');
    expect(keywordProblems(storeListing.keywords)).not.toContain('over 100 bytes');
  });
});

// ---------------------------------------------------------------------------
// FR-MKT-16: a label change moves every public privacy line.
// ---------------------------------------------------------------------------

const privacyParagraph = (description: string): string => {
  const lines = description.split('\n');
  const at = lines.indexOf('PRIVATE BY DEFAULT');
  return at < 0 ? '' : lines[at + 1] ?? '';
};
const sixth = storeListing.screenshots.find((s) => s.id === '06-privacy');

type LabelText = { id: string; file: string; text: string };

/** The four texts FR-MKT-16 moves with the label, each read from its file. All four answer to LABEL_FILE. */
const LABEL_TEXTS: readonly LabelText[] = [
  { id: 'store description privacy paragraph', file: 'packages/content/src/store.en.ts', text: privacyParagraph(storeListing.description) },
  { id: 'screenshot 6 subline', file: 'packages/content/src/store.en.ts', text: sixth ? `${sixth.caption} ${sixth.subline}` : '' },
  { id: 'website privacy points (site.ts s09)', file: 'apps/web/src/content/site.ts', text: webSite.scenes.s09.points.join(' ') },
  {
    id: '/support',
    file: 'apps/web/src/lib/support/copy.ts',
    text: supportCopy.sections.filter((s) => s.id === 'recordings' || s.id === 'privacy').flatMap((s) => s.blocks).join(' '),
  },
];

/** The "Collected?" answer of each data type in section 3.2 of the label file, by "Category / Data type". */
function labelAnswers(markdown: string): Record<string, string> {
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
 * Wordings that put a thing off the phone: our servers, the cloud or a named cloud, a backup, an upload or a sync, an
 * account or "with us", a new, next or another phone, coming back or being restored, or leaving the phone. A sentence
 * that names the thing and one of these states the practice.
 */
const OFF_PHONE = [
  String.raw`(?:our|secure|remote) (?:\w+ )?servers?`,
  String.raw`the cloud`,
  String.raw`online`,
  String.raw`icloud|google drive|dropbox`,
  String.raw`(?:our|a|the) (?:\w+ )?backups?`,
  String.raw`backed up`,
  String.raw`uploaded`,
  String.raw`sent to us`,
  String.raw`we (?:keep|store|save|hold)`,
  String.raw`sync(?:s|ed|ing)?`,
  String.raw`synchroni[sz](?:e|es|ed|ing)`,
  String.raw`(?:to|in|on|with) (?:your|an|the|our) (?:\w+ ){0,2}account`,
  String.raw`(?:stored|kept|saved|held|stays?|safe) with us`,
  String.raw`(?:a|your|the|any) new (?:phone|iphone|device)s?`,
  String.raw`(?:another|any other|every|all your) (?:phone|iphone|device)s?`,
  String.raw`(?:your|a|the) next (?:phone|iphone|device)s?`,
  String.raw`follows? you`,
  String.raw`comes? back`,
  String.raw`restor(?:e|es|ed|ing)`,
  String.raw`(?:leaves?|leaving|left) (?:the|your|this) phone`,
  String.raw`off (?:the|your|this) phone`,
].join('|');
/** Verbs that put the thing named after them off the phone ("we back up your recordings", "sync your photos"). */
const OFF_PHONE_VERB = String.raw`sync(?:s|ed|ing)?|back(?:s|ed)? up|upload(?:s|ed|ing)?|sends?`;

/**
 * "We" holding the thing named after it ("we store your recordings", "we keep a copy of every recording"). Up to two
 * words may sit between "we" and the verb ("we really do store"), unless one of them denies it: "we never store your
 * recordings" and "we don't keep them" state no practice. Only this branch reads a denial; the other two refuse "we
 * never upload your recordings" too, which errs on the safe side. A sentence that ends by keeping the thing on the
 * phone ("we keep your recordings on the phone that made them") states no practice either (see ON_THE_PHONE).
 */
const WE_HOLD = String.raw`\bwe(?:'ll|'d)?\s+(?:(?!(?:never|not|no|don't|won't|cannot|can't)(?![\w']))[\w']+\s+){0,2}(?:keep|store|save|hold|copy)s?\b(?:\s+[^\s.]+){0,4}?\s+`;
/**
 * The words that keep the thing on the phone, read in the we-branch only and only right after the thing, closing the
 * sentence: "we keep your recordings on the phone that made them." Anything after the phone ("and back them up") or
 * before it ("so you can play them on your phone") leaves the line refused.
 */
const ON_THE_PHONE = String.raw`(?!\s+(?:only\s+)?on (?:this|your|the) phone(?: that made (?:them|it))?\s*(?:[.!?;]|$))`;

/** A sentence that says the thing leaves the phone, as a regex over one sentence (no period in between). */
const leavesThePhone = (thing: string) =>
  new RegExp(
    String.raw`\b(?:${thing})\b[^.]*\b(?:${OFF_PHONE})\b|\b(?:${OFF_PHONE_VERB})\b(?:\s+[^\s.]+){0,3}?\s+(?:${thing})\b|${WE_HOLD}(?:${thing})\b${ON_THE_PHONE}`,
    'i',
  );

/**
 * Practices a text may not state while the label says the data is not collected. Read from the answers, so a label
 * that turns to Yes lifts the rule only for its own data type.
 */
function contradictions(texts: readonly { id: string; text: string }[], answers: Record<string, string>): string[] {
  const notCollected = (key: string) => /^No\b/.test(answers[key] ?? '');
  const rules: { when: boolean; says: RegExp; why: string }[] = [
    {
      when: notCollected('User Content / Audio Data'),
      says: leavesThePhone(String.raw`recordings?|audio|voice(?: notes?| memos?| recordings?)?`),
      why: 'Audio Data is not collected: no recording leaves the phone',
    },
    {
      when: notCollected('User Content / Photos or Videos'),
      says: leavesThePhone(String.raw`photos?|pictures?|videos?`),
      why: 'Photos or Videos is not collected',
    },
    {
      // Other User Content is collected (letter text syncs): no text may say the letters or the book never leave the phone.
      when: !notCollected('User Content / Other User Content'),
      says: /\b(?:letters?|book)\b[^.]*\b(?:never leaves?|only on (?:your|this) phone|stays? on (?:your|this) phone)\b|\bnothing leaves\b/i,
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

/** The four texts with one sentence added to one of them, as a copy edit would add it. */
const withPlanted = (id: string, sentence: string): LabelText[] => LABEL_TEXTS.map((t) => (t.id === id ? { ...t, text: `${t.text} ${sentence}` } : t));

describe('[FR-MKT-16] a privacy label change moves every public privacy line in one release', () => {
  const answers = labelAnswers(read(LABEL_FILE));

  it('[FR-MKT-16] the four texts are registered here, read from their files and checked against the label file the label guard reads', () => {
    expect(LABEL_FILE).toBe('docs/legal/app-store-privacy-labels.md');
    expect(existsSync(join(root, LABEL_FILE)), LABEL_FILE).toBe(true);
    expect(Object.keys(answers).length, `${LABEL_FILE} has its section 3.2 table`).toBeGreaterThan(5);
    expect(LABEL_TEXTS.map((t) => t.id)).toEqual(['store description privacy paragraph', 'screenshot 6 subline', 'website privacy points (site.ts s09)', '/support']);
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
    expect(answersDigest(answers), `the label answers in ${LABEL_FILE} changed: re-read ${LABEL_TEXTS.map((t) => t.id).join(', ')} and move PINNED_ANSWERS_SHA256 in the same pull request`).toBe(PINNED_ANSWERS_SHA256);
  });

  it('[FR-MKT-16] no one of the four texts states a practice the label in force contradicts', () => {
    expect(contradictions(LABEL_TEXTS, answers)).toEqual([]);
  });

  it('[FR-MKT-16] [mutant] a changed label answer moves the digest', () => {
    expect(answersDigest({ ...answers, 'User Content / Audio Data': 'Yes' })).not.toBe(answersDigest(answers));
  });

  const AUDIO = 'Audio Data is not collected: no recording leaves the phone';
  const PHOTOS = 'Photos or Videos is not collected';
  const SITE = 'website privacy points (site.ts s09)';
  const STORE = 'store description privacy paragraph';
  const audioMutants: Array<[string, string]> = [
    [SITE, 'Your recordings sync to your new phone.'],
    [SITE, 'Your recordings are saved to your account.'],
    [SITE, 'Your recordings are backed up to our servers.'],
    ['/support', 'Recordings are saved to your account and reach a new phone.'],
    ['/support', 'Recordings are stored with us so they come back on a new phone.'],
    ['/support', 'We back up your recordings every night.'],
    [STORE, 'Recordings leave the phone only to reach your new iPhone.'],
    [STORE, 'We sync your recordings too.'],
    [STORE, 'We store your recordings safely.'],
    [SITE, 'We keep a copy of every recording.'],
    ['/support', 'Your voice is kept on our servers.'],
    [SITE, 'Recordings are kept online.'],
    [STORE, 'Your recordings follow you to your next phone.'],
    ['/support', 'Recordings come back if you lose your phone.'],
    ['/support', 'Recordings are restored when you sign in again.'],
    [SITE, 'Recordings are kept in iCloud.'],
    [STORE, 'Your voice notes go to our backup.'],
    [SITE, 'We really do store your recordings.'],
    ['/support', "We'll keep your recordings."],
    [SITE, 'Recordings reach your next phone.'],
    [SITE, 'Your recordings follow you everywhere.'],
    ['/support', 'We copy your recordings.'],
    [STORE, 'Recordings are kept on our secure servers.'],
    [SITE, 'Recordings are stored on secure servers.'],
    ['/support', 'Recordings go into a nightly backup.'],
    [SITE, 'Your recordings are safe with us.'],
    ['/support', `Recordings are saved to your ${brand.name} account.`],
    [STORE, 'We keep your recordings on the phone and on our servers.'],
    [SITE, 'We keep your recordings on your phone and back them up nightly.'],
    ['/support', 'We keep your recordings safe, not just on your phone.'],
    [STORE, 'We store your recordings so you can play them on your phone.'],
    [SITE, 'We keep your recordings, so you can free up space on your phone.'],
  ];
  for (const [id, planted] of audioMutants) {
    it(`[FR-MKT-16] [mutant] ${id} saying "${planted}" is refused while Audio Data is not collected`, () => {
      const texts = withPlanted(id, planted);
      expect(contradictions(texts, answers)).toContain(`${id}: ${AUDIO}`);
      expect(contradictions(texts, { ...answers, 'User Content / Audio Data': 'Yes' })).not.toContain(`${id}: ${AUDIO}`);
    });
  }

  const trueAudioLines = [
    'We never store your recordings.',
    'We do not keep your recordings.',
    'We would never ever store your recordings.',
    'We no longer store your recordings.',
    "We don't keep your recordings.",
    "We won't store your recordings.",
    'We cannot store your recordings.',
    "We can't keep your recordings.",
    'We keep your recordings only on this phone.',
    'We keep your recordings on the phone that made them.',
    'We keep it simple. Recordings stay on this phone.',
    'We keep it short. Your recordings are private.',
    'We back up nothing. Recordings stay on this phone.',
    'Recordings are kept on the phone that made them.',
    'Keep your recordings on this phone.',
    'Your voice stays on this phone.',
  ];
  for (const planted of trueAudioLines) {
    it(`[FR-MKT-16] [mutant] "${planted}" is not refused: it keeps the recording on the phone`, () => {
      expect(contradictions(withPlanted(SITE, planted), answers)).toEqual([]);
    });
  }

  const photoMutants: Array<[string, string]> = [
    [SITE, 'Your photos sync to your new phone.'],
    ['/support', 'Pictures are saved to your account.'],
    ['/support', 'We upload your videos so they reach another phone.'],
    [SITE, 'We store your photos safely.'],
  ];
  for (const [id, planted] of photoMutants) {
    it(`[FR-MKT-16] [mutant] ${id} saying "${planted}" is refused while Photos or Videos is not collected`, () => {
      const texts = withPlanted(id, planted);
      expect(contradictions(texts, answers)).toContain(`${id}: ${PHOTOS}`);
      expect(contradictions(texts, { ...answers, 'User Content / Photos or Videos': 'Yes' })).not.toContain(`${id}: ${PHOTOS}`);
    });
  }

  it('[FR-MKT-16] [mutant] a text that says letters or the book never leave the phone is refused while letter text is collected', () => {
    expect(contradictions([{ id: 'screenshot 6 subline', text: 'Your letters never leave your phone.' }], answers)).toEqual(['screenshot 6 subline: Other User Content is collected: letter text syncs to our servers']);
    expect(contradictions([{ id: 'screenshot 6 subline', text: 'Your book stays on your phone.' }], answers)).toEqual(['screenshot 6 subline: Other User Content is collected: letter text syncs to our servers']);
  });
});
