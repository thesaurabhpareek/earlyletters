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
import { LANGUAGES, MIN_STATUS, statusAtLeast, type Review } from '@scribe/core';
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

describe('[BL-1968] the App Review notes in the store words say sign-in is required', () => {
  const notes = storeListing.reviewNotes;

  it('says nothing like "no account" or "no server copy": the store build has sign-in and sync (D-160, D-170)', () => {
    expect(notes).not.toMatch(/\bno (sign-in|sign in|account)\b/i);
    expect(notes).not.toMatch(/no server copy|keeps everything on the phone/i);
  });

  it('passes the release workflow refusal for a servers-on build (NO_SIGN_IN)', () => {
    const source = readFileSync(join(root, 'scripts/release/with-review-contact.ts'), 'utf8');
    const literal = /const NO_SIGN_IN = \/(.+)\/(\w*);/.exec(source);
    expect(literal, 'NO_SIGN_IN in with-review-contact.ts').not.toBeNull();
    expect(new RegExp(literal![1], literal![2]).test(notes)).toBe(false);
  });

  it('says sign-in is required and recordings stay on the phone, as the servers-on notes do', () => {
    expect(notes).toMatch(/Signing in is required/);
    expect(notes).toMatch(/Recordings stay on the phone that made them/);
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

/**
 * NS-17-R4 and FR-LOC-22 (BL-1315): the listing names a spoken language only once that language ships in the store build,
 * and store metadata is en-US alone at 1.0. The shipped list is not typed here. It is read from the pack registry
 * (packs/text-rules/*.json) and the production profile in apps/mobile/eas.json: a language ships when the production build
 * hears it (EXPO_PUBLIC_ENGLISH_ONLY, EXPO_PUBLIC_SPOKEN_LANGUAGES, read as lib/language/heard-languages.ts reads them) and
 * every table of its pack meets the engine's bar (MIN_STATUS), with each native-reviewed table signed by a role and a date.
 * A language either test refuses is named in the failure, so the content owner can word the line (D-172); the fix is in
 * the words or in the pack and build, never in this test.
 */
type Pack = { code: string; names: string[]; signed: boolean };

function readPacks(): Pack[] {
  const dir = join(root, 'packs/text-rules');
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const pack = JSON.parse(readFileSync(join(dir, f), 'utf8')) as Record<string, unknown> & {
        language: string;
        name: { english: string; native: string };
      };
      const tables = (Object.keys(MIN_STATUS) as Array<keyof typeof MIN_STATUS>).filter((k) => pack[k] !== undefined);
      const signed = tables.every((k) => {
        const review = (pack[k] as { review?: Review }).review;
        if (!review || !statusAtLeast(review.status, MIN_STATUS[k])) return false;
        return review.status !== 'native-reviewed' || (Boolean(review.by?.trim()) && /^\d{4}-\d{2}-\d{2}$/.test(review.date ?? ''));
      });
      // Every name a listing could use for the language: the pack's own names and the picker's search aliases.
      const aliases = LANGUAGES.find((l) => l.code === pack.language)?.aliases ?? [];
      // The length floor applies only to words split from the English name ("Mandarin Chinese"), so a short word
      // there cannot match by chance; a whole name, native or alias, counts at any length (Chinese is two characters).
      const words = pack.name.english.split(/\s+/).filter((n) => n.length > 2);
      const names = [pack.name.english, ...words, pack.name.native, ...aliases].filter((n) => n.trim().length > 0);
      return { code: pack.language, names: [...new Set(names)], signed };
    });
}

/** What the production (store) build hears: English alone when English-only is on, else English plus the listed codes. */
function heardByStoreBuild(codes: string[]): string[] {
  const env = (JSON.parse(readFileSync(join(root, 'apps/mobile/eas.json'), 'utf8')) as {
    build: Record<string, { env?: Record<string, string> }>;
  }).build.production?.env ?? {};
  if (env.EXPO_PUBLIC_ENGLISH_ONLY === 'on') return ['en'];
  const listed = env.EXPO_PUBLIC_SPOKEN_LANGUAGES?.trim();
  if (!listed) return codes;
  const picked = listed.split(',').map((c) => c.trim());
  return codes.filter((c) => c === 'en' || picked.includes(c));
}

/** The shipped languages: heard by the store build, and its pack signed. English is the bundled pack and always heard. */
const shippedOf = (packs: Pack[], heard: string[]): Set<string> =>
  new Set(packs.filter((p) => p.signed && heard.includes(p.code)).map((p) => p.code));

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const UNSPACED_SCRIPT = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u;
/**
 * A name in a script written without spaces between words (Han, kana, Thai) has no word edge to look for, so it matches
 * wherever it appears. Every other name must stand as a whole word in any script: letters or marks on either side make
 * it part of another word.
 */
const nameRe = (name: string) =>
  UNSPACED_SCRIPT.test(name)
    ? new RegExp(escapeRe(name), 'iu')
    : new RegExp(`(?<![\\p{L}\\p{M}])${escapeRe(name)}(?![\\p{L}\\p{M}])`, 'iu');

/**
 * Unspaced words that contain a language name or alias but name no language. Such a word is blanked out before the
 * names are looked for, so the alias inside it does not count. Han has no spaces, so the same characters can also be
 * the end of one word and the start of another (another word ending in the first character, then the alias): the word
 * is blanked only at the start of the text, after a character that is not Han, or after one of a closed set of
 * characters that end no word with its first character. Anywhere else the alias still counts. Add a word or a
 * character only when it names no language: anything not listed is refused, which is the safe side for a store
 * listing. Escapes keep this file ASCII.
 */
const NOT_LANGUAGE_NAMES = [
  '\u5916\u56fd\u8bed', // "foreign language", simplified; holds the zh alias guoyu
  '\u5916\u570b\u8a9e', // "foreign language", traditional; holds the zh alias guoyu
];
const SAFE_BEFORE = [
  '\u6301', // "hold", as in "support"
  '\u5b66', '\u5b78', // "learn", simplified and traditional
  '\u4e60', '\u7fd2', // "practise", simplified and traditional
  '\u8bb2', '\u8b1b', // "speak", simplified and traditional
  '\u8bf4', '\u8aaa', // "say", simplified and traditional
  '\u7684', // possessive particle
  '\u548c', '\u4e0e', '\u8207', '\u53ca', // "and"
  '\u7528', // "use"
];
const notLanguageNameRe = new RegExp(
  `(?:(?<!\\p{Script=Han})|(?<=[${SAFE_BEFORE.join('')}]))(?:${NOT_LANGUAGE_NAMES.map(escapeRe).join('|')})`,
  'gu',
);
// The blank is a Han letter that is in no language name today (U+4E00, "one"), so a Latin name written against the word
// is read as it was before: part of the text around it, not a whole word. A space would make it a whole word.
const BLANK = '\u4e00';

/** Each sentence that names a language that does not ship, with the language code. */
function namesUnshipped(sentences: string[], packs: Pack[], shipped: Set<string>): string[] {
  const out: string[] = [];
  for (const sentence of sentences) {
    const read = sentence.replace(notLanguageNameRe, BLANK);
    for (const pack of packs) {
      if (!shipped.has(pack.code) && pack.names.some((n) => nameRe(n).test(read))) out.push(`${pack.code}: ${sentence}`);
    }
  }
  return out;
}

/** Every listing field a person reads, in the source and in the EAS Metadata file that is pushed, as sentences. */
function storeSentences(): string[] {
  const config = JSON.parse(readFileSync(join(root, 'apps/mobile/store.config.json'), 'utf8')) as {
    apple: { info: Record<string, Record<string, unknown>> };
  };
  const pushed = Object.values(config.apple.info).flatMap((fields) =>
    Object.values(fields).flatMap((v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? v.map(String) : [])),
  );
  const source = [
    storeListing.appName,
    storeListing.subtitle,
    ...listingText(real),
    ...storeListing.screenshots.map((s) => s.subline),
  ];
  return [...source, ...listingText({ ...real, description: pushed.join('\n'), captions: [] })];
}

describe('[NS-17-R4] the listing names only shipped languages', () => {
  const packs = readPacks();
  const shipped = shippedOf(packs, heardByStoreBuild(packs.map((p) => p.code)));

  it('[NS-17-R4] reads the shipped list from the pack registry and the store build, with English in it', () => {
    expect(packs.length).toBeGreaterThan(1);
    expect(packs.map((p) => p.code)).toContain('en');
    expect([...shipped]).toContain('en');
  });

  it('[NS-17-R4] the listing names no language whose pack does not ship in the build', () => {
    expect(namesUnshipped(storeSentences(), packs, shipped)).toEqual([]);
  });

  it('[NS-17-R4] the listing names each language that ships', () => {
    const text = storeSentences().join('\n');
    const unnamed = packs.filter((p) => shipped.has(p.code) && !p.names.some((n) => nameRe(n).test(text))).map((p) => p.code);
    expect(unnamed).toEqual([]);
  });

  it('[NS-17-R4] [mutant] a planted Spanish line is refused while Spanish does not ship', () => {
    const planted = 'Speak in Spanish too.';
    expect(shipped.has('es')).toBe(false);
    expect(namesUnshipped([...storeSentences(), planted], packs, shipped)).toEqual([`es: ${planted}`]);
  });

  it('[NS-17-R4] [mutant] a language name in the keywords or a caption is read like any other sentence', () => {
    expect(namesUnshipped(['diary,keepsake,french'], packs, shipped)).toEqual(['fr: diary,keepsake,french']);
    expect(namesUnshipped(['Letters in Mandarin.'], packs, shipped)).toEqual(['zh: Letters in Mandarin.']);
  });

  it('[NS-17-R4] [mutant] a two-character native name inside unspaced text is refused (Chinese)', () => {
    const planted = 'Now in \u4e2d\u6587 too.'; // the zh pack's native name, written as escapes to keep this file ASCII
    expect(shipped.has('zh')).toBe(false);
    expect(namesUnshipped([planted], packs, shipped)).toEqual([`zh: ${planted}`]);
    expect(namesUnshipped(['\u6211\u4eec\u7684\u4e2d\u6587\u4fe1'], packs, shipped)).toHaveLength(1);
  });

  it('[NS-17-R4] [mutant] a Han word that only contains a language alias is not a language name ("foreign language")', () => {
    // Simplified and traditional "foreign language" hold the zh alias guoyu ("\u56fd\u8bed", "\u570b\u8a9e") but name no
    // language, so they pass; the alias standing on its own, or beside such a word, is still refused.
    const en = new Set(['en']);
    const pass = [
      '\u652f\u6301\u5916\u56fd\u8bed', // "supports foreign languages", simplified
      '\u652f\u6301\u5916\u570b\u8a9e', // the same, traditional
      '\u5916\u56fd\u8bed', // the word alone
      '\u5b66\u4e60\u5916\u56fd\u8bed', // "learn foreign languages"
    ];
    for (const line of pass) expect(namesUnshipped([line], packs, en)).toEqual([]);
    const refused = [
      '\u652f\u6301\u56fd\u8bed', // the simplified alias alone
      '\u652f\u6301\u570b\u8a9e', // the traditional alias alone
      '\u5916\u56fd\u8bed\u548c\u56fd\u8bed', // the word, then the alias
      '\u5916\u56fd\u8bed\u548c\u4e2d\u6587', // the word, then the native name
      // A word ending in the same first character, then the alias, reads the same: "in addition", "besides", "overseas".
      '\u53e6\u5916\u56fd\u8bed',
      '\u53e6\u5916\u570b\u8a9e',
      '\u6b64\u5916\u56fd\u8bed',
      '\u6d77\u5916\u56fd\u8bed',
    ];
    for (const line of refused) expect(namesUnshipped([line], packs, en)).toEqual([`zh: ${line}`]);
    // The blank is not a word edge: a Latin name written against the word is read as before.
    expect(namesUnshipped(['french\u5916\u56fd\u8bed'], packs, en)).toEqual([]);
  });

  it('[NS-17-R4] [mutant] the same line passes once Spanish ships, so the rule reads the shipped list', () => {
    const esSigned = packs.map((p) => (p.code === 'es' ? { ...p, signed: true } : p));
    expect(namesUnshipped(['Speak in Spanish too.'], esSigned, shippedOf(esSigned, ['en', 'es']))).toEqual([]);
    // A signed pack is not enough: the store build has to hear the language too.
    expect(namesUnshipped(['Speak in Spanish too.'], esSigned, shippedOf(esSigned, ['en']))).toHaveLength(1);
  });

  it('[NS-17-R4] [mutant] a word that only contains a language name is not a language name', () => {
    expect(namesUnshipped(['A frenchy toast.'], packs, shipped)).toEqual([]);
  });
});

/**
 * FR-LOC-22 store metadata locales. The source of a locale's store words is `packages/content/src/store.<locale>.ts`
 * (`store.en.ts` is en-US), and the pushed file is `apps/mobile/store.config.json`, whose `apple.info` keys are the
 * locales. A locale other than en-US is accepted only when its language ships (as above) and its source file carries
 * the native parent-reviewer's sign-off in the pack review shape, `review: { by: '<role>', date: 'YYYY-MM-DD' }`.
 */
type LocaleFile = { locale: string; text: string };
const EN_US = 'en-US';
const localeOfFile = (f: string) => (f === 'store.en.ts' ? EN_US : /^store\.([A-Za-z]{2,3}(?:-[A-Za-z0-9]+)*)\.ts$/.exec(f)?.[1]);
const signedReview = /\breview:\s*\{\s*by:\s*(['"])[^'"\n]+\1\s*,\s*date:\s*(['"])\d{4}-\d{2}-\d{2}\2\s*,?\s*\}/;

function readLocaleFiles(): LocaleFile[] {
  const dir = join(root, 'packages/content/src');
  return readdirSync(dir)
    .map((f) => ({ f, locale: localeOfFile(f) }))
    .filter((x): x is { f: string; locale: string } => Boolean(x.locale))
    .map(({ f, locale }) => ({ locale, text: readFileSync(join(dir, f), 'utf8') }));
}

function pushedLocales(): string[] {
  const config = JSON.parse(readFileSync(join(root, 'apps/mobile/store.config.json'), 'utf8')) as {
    apple: { info: Record<string, unknown> };
  };
  return Object.keys(config.apple.info);
}

/** Each locale the rule refuses, with why. en-US is the approved English listing and needs no further sign-off. */
function localeViolations(files: LocaleFile[], pushed: string[], shipped: Set<string>): string[] {
  const out: string[] = [];
  const reviewed = new Set<string>();
  for (const { locale, text } of files) {
    if (locale === EN_US) continue;
    const language = locale.split('-')[0].toLowerCase();
    if (!shipped.has(language)) out.push(`${locale}: language ${language} does not ship in the build`);
    else if (!signedReview.test(text)) out.push(`${locale}: no reviewer role and date`);
    else reviewed.add(locale);
  }
  for (const locale of pushed) {
    if (locale !== EN_US && !reviewed.has(locale)) out.push(`${locale}: pushed without a shipped, reviewed source file`);
  }
  return out;
}

describe('[FR-LOC-22] store metadata is en-US only at 1.0', () => {
  const packs = readPacks();
  const shipped = shippedOf(packs, heardByStoreBuild(packs.map((p) => p.code)));
  const version = (JSON.parse(readFileSync(join(root, 'apps/mobile/version.json'), 'utf8')) as { version: string }).version;

  it('[FR-LOC-22] every store locale but en-US ships its language and carries a reviewer role and date', () => {
    expect(localeViolations(readLocaleFiles(), pushedLocales(), shipped)).toEqual([]);
  });

  it('[FR-LOC-22] at 1.0 the only store words are en-US, in the source and in the pushed file', () => {
    if (!/^1\.0\./.test(version)) return;
    expect(readLocaleFiles().map((f) => f.locale)).toEqual([EN_US]);
    expect(pushedLocales()).toEqual([EN_US]);
  });

  const review = "review: { by: 'native speaker and parent, es-MX', date: '2026-12-01' },";
  it('[FR-LOC-22] [mutant] a locale file for a language that does not ship is refused, even with a review', () => {
    expect(localeViolations([{ locale: 'es-MX', text: review }], [EN_US], shipped)).toEqual(['es-MX: language es does not ship in the build']);
  });

  it('[FR-LOC-22] [mutant] a shipped language without a reviewer role and date is refused', () => {
    const withEs = new Set([...shipped, 'es']);
    expect(localeViolations([{ locale: 'es-MX', text: "review: { by: '', date: '2026-12-01' }," }], [EN_US], withEs)).toEqual([
      'es-MX: no reviewer role and date',
    ]);
    expect(localeViolations([{ locale: 'es-MX', text: "review: { by: 'native speaker' }," }], [EN_US], withEs)).toHaveLength(1);
  });

  it('[FR-LOC-22] [mutant] a shipped, reviewed locale is accepted, so the rule is not a blanket refusal', () => {
    const withEs = new Set([...shipped, 'es']);
    expect(localeViolations([{ locale: 'es-MX', text: review }], [EN_US, 'es-MX'], withEs)).toEqual([]);
  });

  it('[FR-LOC-22] [mutant] a locale pushed to the store with no source file is refused', () => {
    expect(localeViolations([], [EN_US, 'fr-FR'], shipped)).toEqual(['fr-FR: pushed without a shipped, reviewed source file']);
  });
});
