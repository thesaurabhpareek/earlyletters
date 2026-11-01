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
 * version, copyright lines and full notice. Every word of copy comes from packages/content, except
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
