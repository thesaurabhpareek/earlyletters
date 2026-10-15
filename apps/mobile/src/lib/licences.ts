/**
 * The notices Settings > Licences shows for every bundled library, font and native module:
 * src/generated/licences.json, made by `npm run licences:generate -w @scribe/mobile` after any
 * dependency change (scripts/licences/generate.mjs). test/licences.test.ts fails when that file
 * is missing, empty or stale against package-lock.json. Each text is the authors' own notice,
 * shown word for word; nothing here is product copy (the headings come from packages/content).
 */
import raw from '../generated/licences.json';

/** `vendored`: third-party code adapted into our own file (shims/), credited to the package it came from. */
export type NoticeKind = 'library' | 'font' | 'native' | 'data' | 'vendored';

export interface NoticeEntry {
  name: string;
  /** npm packages and native modules have one; fonts do not. */
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
  /** In plain words, e.g. "MIT License". */
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
