/**
 * Licence notices for everything in the iOS app, for the Licenses page
 * (apps/mobile/src/app/settings/licenses.tsx). MIT, BSD, Apache and ISC ask for the notice to ship
 * with the code; this is where the app gets it.
 *
 * The data is src/generated/licences.json, made by `npm run licences:generate -w @scribe/mobile`
 * (scripts/licences/generate.mjs) from package-lock.json and the table of what ships
 * (scripts/licences/components.mjs): the npm packages in the iOS binary (not build tools, web-only
 * or type packages), the native libraries compiled in, the fonts, the icon artwork and the speech
 * models the app downloads. test/licences.test.ts runs the generator's `--check`, so `npm test`
 * fails while that file is missing, stale or edited by hand, or while a shipped package has no theme.
 *
 * What a page should show: each theme in order, its title and line from packages/content
 * (`licences.themes[id]`), then one row per entry (name and licence name); a row opens to its
 * version, copyright lines and full notice. The language pack attribution lines open to the full
 * texts of the licences they name (`packNotice`). Every word of copy comes from packages/content, except
 * each licence's own name and each component's name, version and copyright, which are the authors'.
 * This module parses the JSON when it is first imported, so require it lazily from the Licenses page.
 */
import raw from '../generated/licences.json';

/** `vendored`: third-party code inside another component; `model`: a downloaded speech model; `artwork`: the icon drawings. */
export type NoticeKind = 'library' | 'font' | 'native' | 'data' | 'vendored' | 'model' | 'artwork';

/** The theme ids, in page order (scripts/licences/components.mjs THEMES). */
export type ThemeId = 'speech' | 'recording' | 'look' | 'framework' | 'storage' | 'account' | 'other';

export interface NoticeEntry {
  name: string;
  /** Fonts have none. Native pods resolved at build time show the major version range, e.g. "9.x". */
  version?: string;
  kind: NoticeKind;
  /** SPDX id or expression, e.g. "MIT"; `UNKNOWN` when none is stated. */
  licence: string;
  /** In plain words, e.g. "MIT License". The authors' name for their licence, not product copy. */
  licenceName: string;
  /** The copyright lines read from the notice, or null when it names none. */
  copyright: string | null;
  /** Index into `Notices.texts`, or null when no text exists (flagged `review` by the generator). */
  text: number | null;
  /** Where the text was read from when not the entry's own folder. */
  noticeFrom?: string;
  /** The generator could not confirm the licence or its text; listed so a person looks at it. */
  review?: true;
}

export interface NoticeGroup {
  id: ThemeId;
  entries: NoticeEntry[];
}

export interface Notices {
  /** SHA-256 of the npm packages in the iOS binary the file was made from. */
  dependencyHash: string;
  /** In theme order; entries in name order. */
  themes: NoticeGroup[];
  /** The language pack attributions (packs/text-rules), each with its licence names and the indexes of its full texts. */
  packs: { attribution: string; licences: string[]; texts: number[] }[];
  /** Distinct notice texts, each stored once. */
  texts: string[];
}

/** The generated groups' licence id for "no licence stated" (scripts/licences/lib.mjs UNKNOWN). */
export const UNKNOWN = 'UNKNOWN';

export const notices: Notices = raw as unknown as Notices;

/** A stable key for a row: `name@version`, or the name alone for a font. */
export const noticeKey = (e: NoticeEntry): string => (e.version ? `${e.name}@${e.version}` : e.name);

/** The entry's notice, word for word, or null when there is none. */
export const noticeText = (e: NoticeEntry): string | null => (e.text === null ? null : (notices.texts[e.text] ?? null));

/**
 * The licence names and full texts for one language pack attribution line (packages/content
 * `licences.packs`, word for word from the packs), or null when the generated file has none for it.
 */
export const packNotice = (attribution: string): { licences: string; text: string } | null => {
  const p = notices.packs.find((x) => x.attribution === attribution);
  if (!p) return null;
  return { licences: p.licences.join(', '), text: p.texts.map((i) => notices.texts[i]).join('\n') };
};

/*
 * Licence records (FR-LEG-13, BL-1344). Every speech pack, font, model or image a store build ships has a record
 * before it ships: the licence, the URL it is stated at, the date it was read, and for model weights what the licence
 * allows of the training data (counsel packet Q9). The store listing names only languages whose packs all have one.
 *
 * Where each record lives:
 * - speech models: docs/ops/proposed/model-licences.md (BL-1357, FR-AIS-09), read with `parseModelLicenceRecords`;
 *   test/model-licence-record.test.ts checks those records against the catalog, test/licences.test.ts checks that
 *   every shipped model has one with the fields below.
 * - fonts, images and text-rules packs: `LICENCE_RECORDS` here.
 * test/licences.test.ts lists what ships from the repo (the font folder, apps/mobile/assets, the icon artwork in
 * scripts/licences/components.mjs, packs/text-rules, the catalog) and fails on any asset with no record.
 * Nothing here is shown to a family; the Licenses page reads `notices` above.
 */

export type ShippedAssetKind = 'font' | 'image' | 'text-pack' | 'speech-model';

/** One thing a store build ships. `id` is a repo path for a file, the components.mjs name for artwork, the catalog id for a model. */
export interface ShippedAsset {
  kind: ShippedAssetKind;
  id: string;
  /** Text packs only: the pack's `attribution` lines, each of which needs a third-party record. */
  attribution?: readonly string[];
}

/** Licence id for content made for the product, with no third-party licence. Its `url` is the repo path it is made from. */
export const FIRST_PARTY = 'first-party';

export interface LicenceRecord {
  kind: Exclude<ShippedAssetKind, 'speech-model'>;
  name: string;
  /** Asset ids this record covers: an exact id, or a prefix (a folder ending in `/`, a file stem ending in `-`). */
  covers: readonly string[];
  /** Text packs only: a word the attribution line it covers contains (as components.mjs PACK_NOTICES matches it). */
  match?: string;
  /** SPDX id, or FIRST_PARTY. */
  licence: string;
  /** Where the licence is stated; for FIRST_PARTY, the repo path the asset is made from. */
  url: string;
  /** YYYY-MM-DD the licence text was read. */
  dateRead: string;
  /** The copy of the licence text that was read, when it was read from the repo rather than the URL. */
  readFrom?: string;
}

const FONT_DIR = 'packages/design-tokens/fonts/';
const THIRD_PARTY_DIR = 'scripts/licences/third-party/';

/**
 * The records for fonts, images and text packs. The third-party texts were read on the date given from the copy in
 * `readFrom`, which the repo holds word for word from upstream (scripts/licences/components.mjs `source`; the font
 * folder's OFL files). Adding an asset without adding its record here fails test/licences.test.ts.
 */
export const LICENCE_RECORDS: readonly LicenceRecord[] = [
  { kind: 'font', name: 'Literata', covers: [`${FONT_DIR}Literata-`], licence: 'OFL-1.1', url: 'https://github.com/google/fonts/tree/main/ofl/literata', dateRead: '2026-11-27', readFrom: `${FONT_DIR}OFL-Literata.txt` },
  { kind: 'font', name: 'Mukta', covers: [`${FONT_DIR}Mukta-`], licence: 'OFL-1.1', url: 'https://github.com/google/fonts/tree/main/ofl/mukta', dateRead: '2026-11-27', readFrom: `${FONT_DIR}OFL-Mukta.txt` },
  { kind: 'font', name: 'Tiro Devanagari Hindi', covers: [`${FONT_DIR}TiroDevanagariHindi-`], licence: 'OFL-1.1', url: 'https://github.com/google/fonts/tree/main/ofl/tirodevanagarihindi', dateRead: '2026-11-27', readFrom: `${FONT_DIR}OFL-TiroDevanagariHindi.txt` },
  { kind: 'image', name: 'App icon and splash (the brand mark)', covers: ['apps/mobile/assets/brand/'], licence: FIRST_PARTY, url: 'packages/brand/registry.ts', dateRead: '2026-11-27' },
  { kind: 'image', name: 'Phosphor Icons artwork', covers: ['Phosphor Icons artwork'], licence: 'MIT', url: 'https://github.com/phosphor-icons/core/blob/main/LICENSE', dateRead: '2026-11-27', readFrom: `${THIRD_PARTY_DIR}phosphor-core.txt` },
  { kind: 'text-pack', name: 'Text rules written for the product', covers: ['packs/text-rules/'], licence: FIRST_PARTY, url: 'packs/text-rules', dateRead: '2026-11-27' },
  { kind: 'text-pack', name: 'OpenCC character tables', covers: ['packs/text-rules/zh.json'], match: 'OpenCC', licence: 'Apache-2.0', url: 'https://github.com/BYVoid/OpenCC/blob/master/LICENSE', dateRead: '2026-11-27', readFrom: `${THIRD_PARTY_DIR}opencc.txt` },
  { kind: 'text-pack', name: 'pinyin-data readings', covers: ['packs/text-rules/zh.json'], match: 'pinyin-data', licence: 'MIT', url: 'https://github.com/mozillazg/pinyin-data/blob/master/LICENSE', dateRead: '2026-11-27', readFrom: `${THIRD_PARTY_DIR}pinyin-data.txt` },
  { kind: 'text-pack', name: 'Unihan kMandarin data', covers: ['packs/text-rules/zh.json'], match: 'pinyin-data', licence: 'Unicode-3.0', url: 'https://www.unicode.org/license.txt', dateRead: '2026-11-27', readFrom: `${THIRD_PARTY_DIR}unicode-v3.txt` },
];

/** Repo-relative path of the model licence record. The one line to change when the file moves to docs/legal/ (D-172). */
export const MODEL_LICENCE_RECORD_PATH = 'docs/ops/proposed/model-licences.md';

/** The model record fields FR-LEG-13 needs, by the names docs/ops/proposed/model-licences.md uses. */
export const MODEL_RECORD_FIELDS = { licence: 'Licence', url: 'Licence URL', dateRead: 'Date read', allows: 'Training-data terms (counsel Q9)' } as const;

/** Model records keyed by catalog id: one `## speech-model.<name>` heading, then a `| Field | Value |` table. */
export type ModelLicenceRecords = Map<string, Map<string, string>>;

export function parseModelLicenceRecords(markdown: string): ModelLicenceRecords {
  const records: ModelLicenceRecords = new Map();
  let current: Map<string, string> | null = null;
  for (const line of markdown.split('\n')) {
    const heading = /^## (speech-model\.\S+)\s*$/.exec(line);
    if (heading) {
      current = new Map();
      records.set(heading[1], current);
      continue;
    }
    if (line.startsWith('## ')) {
      current = null;
      continue;
    }
    if (!current || !line.startsWith('|')) continue;
    const cells = line.trim().slice(1, -1).split('|');
    const field = cells[0].trim();
    const value = cells.slice(1).join('|').trim();
    if (field === 'Field' || /^-+$/.test(field)) continue;
    current.set(field, value);
  }
  return records;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const covers = (r: LicenceRecord, id: string) => r.covers.some((c) => id === c || ((c.endsWith('/') || c.endsWith('-')) && id.startsWith(c)));

function recordFieldProblems(id: string, r: { licence?: string; url?: string; dateRead?: string }): string[] {
  const out: string[] = [];
  if (!r.licence) out.push(`${id}: record has no licence`);
  if (!r.url) out.push(`${id}: record has no URL`);
  if (r.licence !== FIRST_PARTY && !DATE.test(r.dateRead ?? '')) out.push(`${id}: record has no date read (YYYY-MM-DD)`);
  return out;
}

/**
 * Every way a shipped asset falls short of FR-LEG-13. Empty means each one has a complete record: a model its
 * record with licence, URL, date read and training-data terms; a text pack a record for each attribution line (and a
 * first-party record for its own rules); any other asset one record that covers it.
 */
export function licenceRecordProblems(assets: readonly ShippedAsset[], records: readonly LicenceRecord[], models: ModelLicenceRecords): string[] {
  const problems: string[] = [];
  for (const a of assets) {
    if (a.kind === 'speech-model') {
      const m = models.get(a.id);
      if (!m) {
        problems.push(`${a.id}: no licence record`);
        continue;
      }
      problems.push(...recordFieldProblems(a.id, { licence: m.get(MODEL_RECORD_FIELDS.licence), url: m.get(MODEL_RECORD_FIELDS.url), dateRead: m.get(MODEL_RECORD_FIELDS.dateRead) }));
      if (!m.get(MODEL_RECORD_FIELDS.allows)) problems.push(`${a.id}: record does not say what the licence allows of the training data (Q9)`);
      continue;
    }
    const mine = records.filter((r) => r.kind === a.kind && covers(r, a.id));
    const own = mine.filter((r) => !r.match);
    if (own.length === 0) problems.push(`${a.id}: no licence record`);
    for (const r of own) problems.push(...recordFieldProblems(a.id, r));
    for (const line of a.attribution ?? []) {
      const third = mine.filter((r) => r.match && line.includes(r.match));
      if (third.length === 0) problems.push(`${a.id}: no licence record for attribution "${line.slice(0, 40)}"`);
      for (const r of third) problems.push(...recordFieldProblems(`${a.id} (${r.name})`, r));
    }
  }
  return problems;
}

/** The English names a store listing would use for each spoken-letter language (catalog SPEECH_LANGUAGES). Internal, not copy. */
export const LANGUAGE_NAMES: Readonly<Record<string, readonly string[]>> = {
  en: ['English'],
  hi: ['Hindi'],
  es: ['Spanish', 'Espanol'],
  zh: ['Chinese', 'Mandarin', 'Cantonese'],
  fr: ['French', 'Francais'],
  ar: ['Arabic'],
  pt: ['Portuguese', 'Portugues'],
};

/** The language codes a listing text names, by whole word. */
export function languagesNamed(text: string): string[] {
  return Object.entries(LANGUAGE_NAMES)
    .filter(([, names]) => names.some((n) => new RegExp(`\\b${n}\\b`, 'i').test(text)))
    .map(([code]) => code);
}

/**
 * FR-LEG-13's listing rule: each language the listing names, with every problem its packs have. `packsFor` gives a
 * language's shipped assets (its recognisers on both tiers, the voice detector, its text-rules pack).
 */
export function listedLanguageProblems(listing: string, packsFor: (code: string) => readonly ShippedAsset[], records: readonly LicenceRecord[], models: ModelLicenceRecords): string[] {
  return languagesNamed(listing).flatMap((code) => {
    const packs = packsFor(code);
    if (packs.length === 0) return [`${code}: the listing names it and it has no pack`];
    return licenceRecordProblems(packs, records, models).map((p) => `${code}: ${p}`);
  });
}
