/**
 * Licence notices for every bundled library, font and vendored file, for the Licenses page
 * (EXPERIENCE_PASS_2026-10, package P6: apps/mobile/src/app/settings/licenses.tsx). MIT, BSD,
 * Apache and ISC ask for the notice to ship with the code; this is where the app gets it.
 *
 * The data is src/generated/licences.json, made by `npm run licences:generate -w @scribe/mobile`
 * after any dependency change (scripts/licences/generate.mjs). test/licences.test.ts fails when
 * that file is missing, empty or stale against package-lock.json.
 *
 * What a page should show: each group's `name` as a heading (largest group first), each entry's
 * name and version, and its notice (`noticeText`) word for word. An entry with no text was
 * published without a licence file: show its name and licence only. The speech models, the
 * Phosphor icon artwork credit and the language pack attributions are not here; they stay
 * hand-kept in packages/content (`licences.sections`, `licences.packs`), as do the headings and
 * every other word of copy. Several hundred entries and about 570 KB of text: use a virtualised
 * list and open one notice at a time.
 */
import raw from '../generated/licences.json';

/** `vendored`: third-party code adapted into our own file (shims/), credited to the package it came from. */
export type NoticeKind = 'library' | 'font' | 'native' | 'data' | 'vendored';

export interface NoticeEntry {
  name: string;
  /** npm packages, native modules and vendored files have one; fonts do not. */
  version?: string;
  kind: NoticeKind;
  /** Index into `Notices.texts`, or null when the package is published without a licence file. */
  text: number | null;
  /** Where the text was read from when not the entry's own folder: a sibling in the same repository, or the package vendored code came from. */
  noticeFrom?: string;
}

export interface NoticeGroup {
  /** SPDX id or expression, e.g. "MIT" or "(MIT OR CC0-1.0)". */
  id: string;
  /** In plain words, e.g. "MIT License". The authors' name for their licence, not product copy. */
  name: string;
  entries: NoticeEntry[];
}

export interface Notices {
  /** SHA-256 of the production dependency set the file was made from (the freshness test recomputes it). */
  dependencyHash: string;
  /** Largest group first; entries in name order. */
  licences: NoticeGroup[];
  /** Distinct notice texts, each stored once. */
  texts: string[];
}

export const notices: Notices = raw as unknown as Notices;

/** A stable key for a row: `name@version`, or the name alone for a font. */
export const noticeKey = (e: NoticeEntry): string => (e.version ? `${e.name}@${e.version}` : e.name);

/** The entry's notice, word for word, or null when its package ships none. */
export const noticeText = (e: NoticeEntry): string | null => (e.text === null ? null : (notices.texts[e.text] ?? null));
