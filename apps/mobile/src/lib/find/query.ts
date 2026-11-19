/**
 * What a typed query means (NS-02-R3, R6, R7, R8). Pure: no database, no React Native. The SQLite index
 * (fts-index.ts) and the scan that stands in for it (scan-index.ts) both read their rules from here, so the two agree
 * on every fixture (NS-02-R19).
 *
 * - Words path: fewer than 3 characters does nothing (R3). Case is ignored and Latin accents are folded, so "cafe"
 *   finds "café" (R7); other scripts are matched as written, so a Devanagari or Arabic word finds itself (R8). Every
 *   word must appear, in any order, and the last word matches as a prefix while the parent is still typing (R6).
 * - Substring path: a query with a Han, Hiragana, Katakana or Hangul character has no word breaks to match on, so one
 *   character is enough and each space-separated piece is looked for as written inside the letter (R3, F09-U24).
 * Nothing here writes, rewrites or suggests: the query is only compared with the parent's own words.
 */

/** Characters needed before a words query runs (NS-02-R3). PROPOSED: revisited per language when a pack passes its gate. */
export const MIN_QUERY_CHARS = 3;

const CJK = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;
const TOKEN = /[\p{L}\p{N}\p{M}]+/gu;

export type PreparedQuery =
  /** Nothing to look for yet: too short, only spaces or only marks. The screen shows its idle line and nothing else. */
  | { kind: 'none' }
  /** Folded tokens. All must match; the last matches as a prefix. */
  | { kind: 'words'; terms: string[] }
  /** Space-separated pieces, lower-cased, each looked for as written inside the words. */
  | { kind: 'substring'; terms: string[] };

/** Case and Latin accents folded; every other script is left as written (a Devanagari vowel sign is not an accent). */
export function foldText(s: string): string {
  return s
    .normalize('NFD')
    .replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
    .normalize('NFC')
    .toLowerCase();
}

export interface Token {
  /** The token as written in the text. */
  text: string;
  /** Offsets in the original string (UTF-16 units). */
  start: number;
  end: number;
}

/** Word-like runs (letters, digits and their marks), the way the index cuts words. */
export function tokenize(text: string): Token[] {
  const out: Token[] = [];
  for (const m of text.matchAll(TOKEN)) out.push({ text: m[0], start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
  return out;
}

const codePoints = (s: string): number => [...s].length;

export function prepareQuery(raw: string): PreparedQuery {
  const q = raw.normalize('NFC').trim();
  if (!q) return { kind: 'none' };
  if (CJK.test(q)) {
    const terms = q.toLowerCase().split(/\s+/u).filter(Boolean);
    return terms.length ? { kind: 'substring', terms } : { kind: 'none' };
  }
  if (codePoints(q.replace(/\s+/gu, '')) < MIN_QUERY_CHARS) return { kind: 'none' };
  const terms = tokenize(q).map((t) => foldText(t.text));
  return terms.length ? { kind: 'words', terms } : { kind: 'none' };
}

/** The FTS5 MATCH expression for a words query: every term quoted (so no operator can leak in), the last a prefix. */
export function ftsMatchString(terms: readonly string[]): string {
  return terms.map((t, i) => `"${t.replace(/"/g, '""')}"${i === terms.length - 1 ? '*' : ''}`).join(' ');
}

/** The pieces of a letter's searchable text. `extra` is the parent-typed label, photo words and place (sources.ts). */
export interface Searchable {
  body: string;
  extra: string;
}

function hasAllWords(terms: readonly string[], texts: readonly string[]): boolean {
  const tokens = texts.flatMap((t) => tokenize(t).map((k) => foldText(k.text)));
  return terms.every((term, i) => (i === terms.length - 1 ? tokens.some((k) => k.startsWith(term)) : tokens.includes(term)));
}

/** Whether a letter matches. The scan path uses this as its rule and the tests use it as the oracle for the index. */
export function matches(q: PreparedQuery, row: Searchable): boolean {
  if (q.kind === 'none') return false;
  const texts = [row.body, row.extra].filter(Boolean);
  if (q.kind === 'words') return hasAllWords(q.terms, texts);
  const hay = texts.join('\n').toLowerCase();
  return q.terms.every((t) => hay.includes(t));
}

/** Which text a result should quote: the words when they hold the match, otherwise the typed photo words or place. */
export function snippetSource(q: PreparedQuery, row: Searchable): 'body' | 'extra' {
  if (q.kind === 'none' || !row.extra) return 'body';
  if (matches(q, { body: row.body, extra: '' })) return 'body';
  if (matches(q, { body: '', extra: row.extra })) return 'extra';
  // The terms are split between the two. Quote the part that holds the words the parent looked for.
  const inBody = q.terms.some((t) => matches({ ...q, terms: [t] } as PreparedQuery, { body: row.body, extra: '' }));
  return inBody ? 'body' : 'extra';
}
