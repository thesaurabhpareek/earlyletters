/// <reference types="node" />
/**
 * Licence records (FR-LEG-13, BL-1344). Every speech pack, font, model or image a store build ships has a record
 * before it ships: the licence, the URL it is stated at, the date it was read, and for model weights what the licence
 * allows of the training data (counsel packet Q9). The store listing names only languages whose packs all have one.
 *
 * Why this lives under test/ and not src/: only tests read it, and the records name licence URLs (github.com,
 * www.unicode.org) that are not app requests. In src/ they would ship in the app bundle and break the BL-414 network
 * allowlist (test/network-allowlist.test.ts reads src, app.config.ts, modules and shims, never test/). The Licenses
 * page reads src/lib/licences.ts, which this file does not change.
 *
 * Where each record lives:
 * - speech models: docs/ops/proposed/model-licences.md (BL-1357, FR-AIS-09), read with `parseModelLicenceRecords`;
 *   test/model-licence-record.test.ts checks those records against the catalog, test/licences.test.ts checks that
 *   every shipped model has one with the fields below.
 * - fonts, images and text-rules packs: `LICENCE_RECORDS` here.
 * test/licences.test.ts lists what ships from the repo (the font folder, every image the app imports from its own
 * source or a workspace package, apps/mobile/assets, the icon artwork in scripts/licences/components.mjs,
 * packs/text-rules, the catalog) and fails on any asset with no record.
 * Fonts and icons that come inside npm packages are covered by the npm notices (src/generated/licences.json), not here.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

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
  /**
   * Asset ids this record covers: an exact id, or a file stem ending in `-` (a font family's files). First-party
   * records name each file, so a third-party file dropped into the same folder has no record.
   */
  covers: readonly string[];
  /** Text packs only: a word the attribution line it covers contains. Each covered pack must have such a line. */
  match?: string;
  /** SPDX id, or FIRST_PARTY. */
  licence: string;
  /** Where the licence is stated; for FIRST_PARTY, the repo path the asset is made from. */
  url: string;
  /** YYYY-MM-DD the licence text was read. */
  dateRead: string;
  /** The copy of the licence text that was read, when it was read from the repo rather than the URL. */
  readFrom?: string;
  /** What the repo could not show about this record; a person must still check it. */
  unverified?: string;
}

const FONT_DIR = 'packages/design-tokens/fonts/';
const THIRD_PARTY_DIR = 'scripts/licences/third-party/';
const BRAND_DIR = 'apps/mobile/assets/brand/';
const BRAND_FILES = ['android-foreground', 'android-monochrome', 'favicon', 'icon', 'icon-dark', 'icon-tinted', 'splash', 'splash-dark'].map((n) => `${BRAND_DIR}${n}.png`);
const FIRST_PARTY_PACKS = ['ar', 'en', 'es', 'fr', 'hi', 'pt', 'zh'].map((c) => `packs/text-rules/${c}.json`);

/**
 * The records for fonts, images and text packs. The third-party texts were read on the date given from the copy in
 * `readFrom`, which the repo holds word for word from upstream (scripts/licences/components.mjs `source`; the font
 * folder's OFL files). Adding an asset without adding its record here fails test/licences.test.ts.
 */
export const LICENCE_RECORDS: readonly LicenceRecord[] = [
  { kind: 'font', name: 'Literata', covers: [`${FONT_DIR}Literata-`], licence: 'OFL-1.1', url: 'https://github.com/google/fonts/tree/main/ofl/literata', dateRead: '2026-11-27', readFrom: `${FONT_DIR}OFL-Literata.txt` },
  { kind: 'font', name: 'Mukta', covers: [`${FONT_DIR}Mukta-`], licence: 'OFL-1.1', url: 'https://github.com/google/fonts/tree/main/ofl/mukta', dateRead: '2026-11-27', readFrom: `${FONT_DIR}OFL-Mukta.txt` },
  { kind: 'font', name: 'Tiro Devanagari Hindi', covers: [`${FONT_DIR}TiroDevanagariHindi-`], licence: 'OFL-1.1', url: 'https://github.com/google/fonts/tree/main/ofl/tirodevanagarihindi', dateRead: '2026-11-27', readFrom: `${FONT_DIR}OFL-TiroDevanagariHindi.txt` },
  {
    kind: 'image',
    name: 'App icon and splash (the brand mark)',
    covers: BRAND_FILES,
    licence: FIRST_PARTY,
    url: 'packages/brand/registry.ts',
    dateRead: '2026-11-27',
    unverified: 'who holds the rights in the mark (an assignment from its maker) is not in the repo',
  },
  {
    kind: 'image',
    name: 'Lamp film grain texture',
    covers: ['packages/design-tokens/textures/grain.png'],
    licence: FIRST_PARTY,
    // Generated, not drawn: build-grain.ts writes it from tokens.atmosphere.grain with a seeded generator, and
    // packages/design-tokens/test/grain.test.ts checks the file against that output.
    url: 'packages/design-tokens/src/build-grain.ts',
    dateRead: '2026-11-27',
  },
  { kind: 'image', name: 'Phosphor Icons artwork', covers: ['Phosphor Icons artwork'], licence: 'MIT', url: 'https://github.com/phosphor-icons/core/blob/main/LICENSE', dateRead: '2026-11-27', readFrom: `${THIRD_PARTY_DIR}phosphor-core.txt` },
  { kind: 'text-pack', name: 'Text rules written for the product', covers: FIRST_PARTY_PACKS, licence: FIRST_PARTY, url: 'packs/text-rules', dateRead: '2026-11-27' },
  { kind: 'text-pack', name: 'OpenCC character tables', covers: ['packs/text-rules/zh.json'], match: 'OpenCC', licence: 'Apache-2.0', url: 'https://github.com/BYVoid/OpenCC/blob/master/LICENSE', dateRead: '2026-11-27', readFrom: `${THIRD_PARTY_DIR}opencc.txt` },
  { kind: 'text-pack', name: 'pinyin-data readings', covers: ['packs/text-rules/zh.json'], match: 'pinyin-data', licence: 'MIT', url: 'https://github.com/mozillazg/pinyin-data/blob/master/LICENSE', dateRead: '2026-11-27', readFrom: `${THIRD_PARTY_DIR}pinyin-data.txt` },
  { kind: 'text-pack', name: 'Unihan kMandarin data', covers: ['packs/text-rules/zh.json'], match: 'Unihan', licence: 'Unicode-3.0', url: 'https://www.unicode.org/license.txt', dateRead: '2026-11-27', readFrom: `${THIRD_PARTY_DIR}unicode-v3.txt` },
];

/** Repo-relative path of the model licence record. The one line to change when the file moves to docs/legal/ (D-172). */
export const MODEL_LICENCE_RECORD_PATH = 'docs/ops/proposed/model-licences.md';

/** The model record fields FR-LEG-13 needs, by the names docs/ops/proposed/model-licences.md uses. */
export const MODEL_RECORD_FIELDS = { licence: 'Licence', url: 'Licence URL', dateRead: 'Date read', allows: 'Training-data terms (counsel Q9)' } as const;

/**
 * Models whose Q9 field still reads `open` that the store listing may name today: exactly the models the current
 * English listing already ships (LANGUAGE_MODELS.en on both tiers, and the voice detector). `open` is not an answer:
 * the listing gate accepts it for these and fails for any other model, so a listing that names a language whose
 * models are not on this list (Hindi, today) fails until counsel answers Q9 for them. Adding a model here is an
 * exec and counsel decision, never a test fix; test/licences.test.ts pins this list to the English set.
 */
export const Q9_OPEN_SHIPPED: readonly string[] = ['speech-model.silero-vad-v6.2.0', 'speech-model.whisper-large-v3-turbo-q5_0', 'speech-model.whisper-small-q5_1'];

/** True when a Q9 field is still `open` (the record's own word for "counsel has not answered"). */
export const isQ9Open = (value: string): boolean => /^open\b/i.test(value.trim());

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
const covers = (r: LicenceRecord, id: string) => r.covers.some((c) => id === c || (c.endsWith('-') && id.startsWith(c)));

function recordFieldProblems(id: string, r: { licence?: string; url?: string; dateRead?: string }): string[] {
  const out: string[] = [];
  if (!r.licence) out.push(`${id}: record has no licence`);
  if (!r.url) out.push(`${id}: record has no URL`);
  if (r.licence !== FIRST_PARTY && !DATE.test(r.dateRead ?? '')) out.push(`${id}: record has no date read (YYYY-MM-DD)`);
  return out;
}

export interface RecordCheckOptions {
  /**
   * When given, a model whose Q9 field is `open` passes only if it is on this list (the listing gate passes
   * Q9_OPEN_SHIPPED). Left out, the check asks only that the Q9 field is filled in, open or answered.
   */
  q9OpenAllowed?: readonly string[];
}

/**
 * Every way a shipped asset falls short of FR-LEG-13. Empty means each one has a complete record: a model its
 * record with licence, URL, date read and a Q9 field (and, with `q9OpenAllowed`, Q9 answered or the model on that
 * list); a text pack a record for each attribution line, each third-party record it is covered by named in one of
 * those lines, and a first-party record for its own rules; any other asset one record that covers it.
 */
export function licenceRecordProblems(assets: readonly ShippedAsset[], records: readonly LicenceRecord[], models: ModelLicenceRecords, options: RecordCheckOptions = {}): string[] {
  const problems: string[] = [];
  for (const a of assets) {
    if (a.kind === 'speech-model') {
      const m = models.get(a.id);
      if (!m) {
        problems.push(`${a.id}: no licence record`);
        continue;
      }
      problems.push(...recordFieldProblems(a.id, { licence: m.get(MODEL_RECORD_FIELDS.licence), url: m.get(MODEL_RECORD_FIELDS.url), dateRead: m.get(MODEL_RECORD_FIELDS.dateRead) }));
      const allows = m.get(MODEL_RECORD_FIELDS.allows);
      if (!allows) problems.push(`${a.id}: record does not say what the licence allows of the training data (Q9)`);
      else if (options.q9OpenAllowed && isQ9Open(allows) && !options.q9OpenAllowed.includes(a.id)) {
        problems.push(`${a.id}: training-data terms (Q9) are open, and it is not one of the models the listing already ships`);
      }
      continue;
    }
    const mine = records.filter((r) => r.kind === a.kind && covers(r, a.id));
    const own = mine.filter((r) => !r.match);
    if (own.length === 0) problems.push(`${a.id}: no licence record`);
    for (const r of own) problems.push(...recordFieldProblems(a.id, r));
    const lines = a.attribution ?? [];
    for (const line of lines) {
      const third = mine.filter((r) => r.match && line.includes(r.match));
      if (third.length === 0) problems.push(`${a.id}: no licence record for attribution "${line.slice(0, 40)}"`);
      for (const r of third) problems.push(...recordFieldProblems(`${a.id} (${r.name})`, r));
    }
    // A third-party source the pack is built from must stay credited: dropping its words from the attribution fails.
    for (const r of mine.filter((x) => x.match && !lines.some((line) => line.includes(x.match!)))) {
      problems.push(`${a.id}: no attribution line names ${r.match} (${r.name})`);
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
 * language's shipped assets (its recognisers on both tiers, the voice detector, its text-rules pack). A model whose
 * Q9 is open fails unless it is on `q9OpenAllowed` (Q9_OPEN_SHIPPED by default).
 */
export function listedLanguageProblems(
  listing: string,
  packsFor: (code: string) => readonly ShippedAsset[],
  records: readonly LicenceRecord[],
  models: ModelLicenceRecords,
  q9OpenAllowed: readonly string[] = Q9_OPEN_SHIPPED,
): string[] {
  return languagesNamed(listing).flatMap((code) => {
    const packs = packsFor(code);
    if (packs.length === 0) return [`${code}: the listing names it and it has no pack`];
    return licenceRecordProblems(packs, records, models, { q9OpenAllowed }).map((p) => `${code}: ${p}`);
  });
}

/*
 * Images the app imports. Metro bundles an image only when code requires it, and Expo's config plugins read the
 * image paths in app.config.ts, so the inventory follows those references instead of guessing folders: the app's
 * own source and every workspace package it depends on (directly or through another workspace package).
 */
const IMAGE = /\.(png|jpe?g|gif|webp|svg|heic)$/i;
const IMAGE_REF = '[^\'"`]+\\.(?:png|jpe?g|gif|webp|svg|heic)';
const SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs)$/;
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'test', 'tests', '__tests__', '__fixtures__', '.expo', 'ios', 'android']);

/** Image specifiers that code requires or imports: `require('x.png')`, `import x from 'x.png'`, `import('x.png')`. */
export function imageSpecifiers(source: string): string[] {
  const re = new RegExp(`(?:\\brequire\\s*\\(\\s*|\\bimport\\s*\\(\\s*|\\bfrom\\s+|\\bimport\\s+)['"\`](${IMAGE_REF})['"\`]`, 'g');
  return [...source.matchAll(re)].map((m) => m[1]);
}

/** Image paths written in a config file as relative path strings (`'./assets/brand/icon.png'`). */
export function configImagePaths(source: string): string[] {
  return [...source.matchAll(new RegExp(`['"\`](\\.{1,2}/${IMAGE_REF})['"\`]`, 'g'))].map((m) => m[1]);
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return SKIP_DIRS.has(n) ? [] : sourceFiles(p);
    return SOURCE.test(n) && !/\.(test|spec)\.[cm]?[jt]sx?$/.test(n) ? [p] : [];
  });
}

/** Workspace packages by name, from packages/*\/package.json. */
function workspacePackages(repo: string): Map<string, { dir: string; deps: string[] }> {
  const out = new Map<string, { dir: string; deps: string[] }>();
  for (const n of readdirSync(join(repo, 'packages'))) {
    const dir = join(repo, 'packages', n);
    let pkg: { name?: string; dependencies?: Record<string, string>; peerDependencies?: Record<string, string> };
    try {
      pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
    } catch {
      continue;
    }
    if (pkg.name) out.set(pkg.name, { dir, deps: Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }) });
  }
  return out;
}

/**
 * Every image file a store build of apps/mobile can bundle, as repo paths: each image required or imported by the
 * app's source or by any workspace package it depends on, each image path in app.config.ts, and every other image in a
 * folder that holds one of those (a file dropped next to a shipped image is one require away from shipping).
 */
export function appImageFiles(repo: string): string[] {
  const app = join(repo, 'apps', 'mobile');
  const workspaces = workspacePackages(repo);
  const appPkg = JSON.parse(readFileSync(join(app, 'package.json'), 'utf8')) as { dependencies?: Record<string, string> };
  const reached = new Set<string>();
  const queue = Object.keys(appPkg.dependencies ?? {}).filter((d) => workspaces.has(d));
  while (queue.length) {
    const name = queue.shift()!;
    if (reached.has(name)) continue;
    reached.add(name);
    queue.push(...workspaces.get(name)!.deps.filter((d) => workspaces.has(d)));
  }
  const resolve = (from: string, spec: string): string | null => {
    if (spec.startsWith('.')) return join(dirname(from), spec);
    if (spec.startsWith('@/assets/')) return join(app, 'assets', spec.slice('@/assets/'.length));
    if (spec.startsWith('@/')) return join(app, 'src', spec.slice(2));
    const ws = [...workspaces.keys()].find((n) => spec === n || spec.startsWith(`${n}/`));
    return ws ? join(workspaces.get(ws)!.dir, spec.slice(ws.length + 1)) : null;
  };
  const found = new Set<string>();
  const roots = [join(app, 'src'), ...[...reached].map((n) => workspaces.get(n)!.dir)];
  for (const file of roots.flatMap(sourceFiles)) {
    for (const spec of imageSpecifiers(readFileSync(file, 'utf8'))) {
      const p = resolve(file, spec);
      if (p) found.add(p);
    }
  }
  const config = join(app, 'app.config.ts');
  for (const spec of configImagePaths(readFileSync(config, 'utf8'))) found.add(join(app, spec));
  for (const dir of new Set([...found].map((p) => dirname(p)))) {
    for (const n of readdirSync(dir)) if (IMAGE.test(n) && statSync(join(dir, n)).isFile()) found.add(join(dir, n));
  }
  return [...found].map((p) => relative(repo, p).split('\\').join('/')).sort();
}
