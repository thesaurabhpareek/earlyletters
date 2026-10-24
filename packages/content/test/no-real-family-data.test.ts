/**
 * Privacy guard: real family details never go in the repository (CLAUDE.md,
 * "Real family details never go in code, tests or fixtures"). Tests, fixtures
 * and docs use the fictional family "Asha" (nickname "Ashu"), born 2025-04-12.
 *
 * This test reads every tracked file (`git ls-files`) and fails if it finds a
 * real family name or the real birth date in a file's path or contents. The
 * names are the founder's child's name, in any listed spelling or script, and
 * another family member's first name. The guard must not leak what it guards,
 * so it stores only SHA-256 hashes:
 *  - names: hash of a lowercase NFC word token (letters, marks and digits);
 *  - dates: hash of the canonical YYYY-MM-DD form. ISO dates, slash dates
 *    (Y/M/D, M/D/Y, D/M/Y) and written dates ("12 April 2025",
 *    "April 12, 2025") are normalised to that form before hashing.
 *
 * To add a spelling: run
 *   node -e 'console.log(require("crypto").createHash("sha256").update("<token>".toLowerCase().normalize("NFC")).digest("hex"))'
 * and add the hex digest below. Never write the plain value in this file, a
 * commit message, a pull request or a comment.
 *
 * Binary-ish files (images, PDFs, fonts, media, or any file with a NUL byte)
 * are read as latin1, one character per byte. Dates are looked for in all of
 * it; names only in its text-like runs (BINARY_TEXT), since the rest is noise
 * that spells short words by chance. Not covered inside binaries: UTF-16 text
 * (many audio tags, some PDF strings), compressed text (most PDF streams, zip
 * contents), non-Latin spellings stored as UTF-8, and a name in a short run
 * without a NUL byte on each side. Files over 5 MB are skipped.
 *
 * The scan fails when the file list lacks the root CLAUDE.md or this file at
 * its root path (an empty list, or the wrong root), and when a listed file
 * cannot be read (for example outside a sparse checkout). A printed path shows
 * <name> for a guarded name, and # for its digits when it holds the date.
 *
 * Skipped: the contents of package-lock.json (third-party names) and of this
 * file. Every path, theirs included, is still checked.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Real family names: the child's name (Latin spellings, nickname, short form,
 * Arabic and Devanagari script) and another family member's first name.
 */
const NAME_HASHES = new Set([
  '177b773d483d3fe541cd127ca95b62d7099e80651206c6ab7d6aa63eaa3bdc2c',
  'dee25ccf29ed1665c936a0408d7deb6114740652b9957bb90bd008aeeff2ae22',
  '3c38aafb0579dafe18bb584dce2786ccaab6835245f2979af4bb7dd2b6b90775',
  '135916c7098cd3db913f1513826f60a601d834d55b8ce3199fba861d3299ea07',
  '7d084f36695b4a19b1904fd8e1c012b34bf695a4c22989c1997ad3dd32331fff',
  'c3136f593290df45b93c312c18c9c7ab815e9ab4a9fc7101b1eac66db868a200',
]);

/** Real birth date, canonical YYYY-MM-DD. */
const DATE_HASHES = new Set(['6f443d4600db4cc104a04cb56ec4925ab68dc5d3a4b850db32c51540e6d7a730']);

/** This file, by its path from the repository root. */
const SELF = 'packages/content/test/no-real-family-data.test.ts';
const SKIP = new Set(['package-lock.json', SELF]);
const MAX_BYTES = 5 * 1024 * 1024;
/** Images, PDFs, fonts and media: read as latin1, not skipped (the journey record holds ~150 of them). */
const BINARY_EXT = /\.(png|jpe?g|gif|webp|pdf|ttf|otf|woff2?|m4a|wav|mp3|mp4|mov|zip|ico)$/i;
/**
 * Text-like runs in a binary-ish file's latin1 text, the only part searched for names: 12 or more
 * printable characters (ASCII 0x20-0x7e, or a latin1 letter just before one, as in latin1 PDF
 * metadata), or a printable run of any length with a NUL byte on each side (a C string).
 */
const PRINTABLE = '(?:[\\x20-\\x7e]|[\\xc0-\\xd6\\xd8-\\xf6\\xf8-\\xff](?=[\\x20-\\x7e]))';
const BINARY_TEXT = new RegExp(`${PRINTABLE}{12,}|(?<=\\x00)${PRINTABLE}+(?=\\x00)`, 'g');
/** The list proves nothing without these: the root CLAUDE.md, and this file at its root path (so ROOT is the root). */
const LIST_MARKERS = ['CLAUDE.md', SELF];
const NONE = new Set<string>();

const sha = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');
const pad = (n: string | number) => String(n).padStart(2, '0');
const iso = (y: string | number, m: string | number, d: string | number) => `${y}-${pad(m)}-${pad(d)}`;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const monthOf = (word: string) => MONTHS.indexOf(word.slice(0, 3).toLowerCase()) + 1;
const MONTH_RE = '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';

/** Every date-like substring, as canonical YYYY-MM-DD candidates. */
export function dateCandidates(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\b/g)) out.push(iso(m[1], m[2], m[3]));
  for (const m of text.matchAll(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/g)) out.push(iso(m[3], m[1], m[2]), iso(m[3], m[2], m[1]));
  for (const m of text.matchAll(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?${MONTH_RE}\\.?,?\\s+(\\d{4})\\b`, 'gi'))) {
    out.push(iso(m[3], monthOf(m[2]), m[1]));
  }
  for (const m of text.matchAll(new RegExp(`\\b${MONTH_RE}\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, 'gi'))) {
    out.push(iso(m[3], monthOf(m[1]), m[2]));
  }
  return out;
}

/** Lowercase NFC word tokens, plus a copy with combining marks removed. */
export function tokens(text: string): string[] {
  const out: string[] = [];
  for (const m of text.normalize('NFC').matchAll(/[\p{L}\p{M}\p{N}]+/gu)) {
    const t = m[0].toLowerCase();
    out.push(t);
    const bare = t.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
    if (bare !== t) out.push(bare);
  }
  return out;
}

export function findings(text: string, names = NAME_HASHES, dates = DATE_HASHES): string[] {
  const hits = new Set<string>();
  for (const t of new Set(tokens(text))) if (names.has(sha(t))) hits.add('real family name');
  for (const d of dateCandidates(text)) if (dates.has(sha(d))) hits.add('real birth date');
  return [...hits];
}

/**
 * Findings in a file's contents. A text file is read as UTF-8 and every word counts. A binary-ish
 * file (BINARY_EXT, or any file with a NUL byte) is read as latin1, one character per byte: dates
 * are looked for in all of it, names only in its text-like runs (BINARY_TEXT).
 */
export function contentFindings(file: string, bytes: Buffer, names = NAME_HASHES, dates = DATE_HASHES): string[] {
  if (!BINARY_EXT.test(file)) {
    const text = bytes.toString('utf8');
    if (!text.includes('\0')) return findings(text, names, dates);
  }
  const text = bytes.toString('latin1');
  const runs = (text.match(BINARY_TEXT) ?? []).join('\n');
  return [...new Set([...findings(runs, names, NONE), ...findings(text, NONE, dates)])];
}

/** A path as it may be printed: a guarded name becomes <name>, and digits become # when it holds the guarded date. */
function shown(path: string, names: Set<string>, dates: Set<string>): string {
  const out = path.normalize('NFC').replace(/[\p{L}\p{M}\p{N}]+/gu, (w) => (tokens(w).some((t) => names.has(sha(t))) ? '<name>' : w));
  return dateCandidates(path).some((d) => dates.has(sha(d))) ? out.replace(/\d/g, '#') : out;
}

/**
 * Every finding, as "<path>: <kind>", never the value. `read` returns a file's bytes, or null to
 * skip it on purpose (over MAX_BYTES), and throws when the file cannot be read. Throws when the list
 * lacks a LIST_MARKERS entry or a listed file cannot be read: the scan would prove less than it says.
 */
export function scan(files: string[], read: (file: string) => Buffer | null, names = NAME_HASHES, dates = DATE_HASHES): string[] {
  const absent = LIST_MARKERS.filter((m) => !files.includes(m));
  if (absent.length) {
    throw new Error(`The file list (${files.length} files) lacks ${absent.join(' and ')}: it is empty or not the repository root's, so the scan would prove nothing.`);
  }
  const bad: string[] = [];
  const unread: string[] = [];
  for (const f of files) {
    const hits = findings(f, names, dates).map((kind) => `${kind} in the path`);
    if (!SKIP.has(f)) {
      let bytes: Buffer | null = null;
      try {
        bytes = read(f);
      } catch {
        unread.push(shown(f, names, dates));
      }
      if (bytes) hits.push(...contentFindings(f, bytes, names, dates));
    }
    if (hits.length) bad.push(`${shown(f, names, dates)}: ${hits.join(', ')}`);
  }
  if (unread.length) {
    const rest = bad.length ? ` Findings in the rest: ${bad.join('; ')}` : '';
    throw new Error(
      `The scan is incomplete: ${unread.length} listed file(s) could not be read (a sparse checkout, a file deleted in the working tree, or a submodule): ${unread.slice(0, 10).join(', ')}.${rest}`,
    );
  }
  return bad;
}

const ROOT = join(__dirname, '../../..');

function trackedFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0')
    .filter(Boolean);
}

/** A tracked file's bytes, or null when it is over MAX_BYTES. Throws when it cannot be read. */
function readTracked(file: string): Buffer | null {
  const path = join(ROOT, file);
  return statSync(path).size > MAX_BYTES ? null : readFileSync(path);
}

describe('no real family details in tracked files', () => {
  it('the guard recognises the fictional family as safe', () => {
    expect(findings('Asha (Ashu) was born 2025-04-12, on 12 April 2025.')).toEqual([]);
    expect(findings('आशा, آشا, Nina, Tara, Neela')).toEqual([]);
  });

  describe('the scan, proved with an invented token hashed the way a real name is', () => {
    // Not anyone's name or birthday: made up for these tests, hashed as the header says.
    const PLANT = new Set([sha('Plantedname'.toLowerCase().normalize('NFC'))]);
    const PLANT_DATE = new Set([sha('1999-09-09')]);
    const tree = (files: Record<string, Buffer>) => (f: string) => {
      if (!(f in files)) throw new Error(`ENOENT: ${f}`);
      return files[f];
    };
    const base = { 'CLAUDE.md': Buffer.from('# CLAUDE.md\n') };
    const list = (...more: string[]) => [...LIST_MARKERS, ...more];

    it('catches a name or a date that is in a path, and prints the path without it', () => {
      const read = tree({
        ...base,
        'docs/plantedname-notes.md': Buffer.from('Asha slept.\n'),
        'docs/plantedname-both.md': Buffer.from('Plantedname\n'),
        'docs/1999-09-09-notes.md': Buffer.from('Asha woke.\n'),
      });
      expect(scan(list('docs/plantedname-notes.md', 'docs/plantedname-both.md', 'docs/1999-09-09-notes.md'), read, PLANT, PLANT_DATE)).toEqual([
        'docs/<name>-notes.md: real family name in the path',
        'docs/<name>-both.md: real family name in the path, real family name',
        'docs/####-##-##-notes.md: real birth date in the path',
      ]);
    });

    it('catches a name in a text-like run of a binary-ish file, read as latin1', () => {
      // A latin1 PDF field: under UTF-8 the accented byte would split the token.
      const pdf = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]),
        Buffer.from('<< /Author (Plant\u00e9dname) >>\n', 'latin1'),
      ]);
      expect(findings(pdf.toString('utf8'), PLANT)).toEqual([]);
      // A C string: a short run with a NUL byte on each side.
      const bin = Buffer.from([0x01, 0xff, 0x00, ...Buffer.from('Plantedname'), 0x00, 0x89]);
      const read = tree({ ...base, 'docs/letter.pdf': pdf, 'data/cache.bin': bin });
      expect(scan(list('docs/letter.pdf', 'data/cache.bin'), read, PLANT)).toEqual([
        'docs/letter.pdf: real family name',
        'data/cache.bin: real family name',
      ]);
    });

    it('ignores a word in a binary that is not in a text-like run, and reads text files as before', () => {
      // 11 printable bytes with no NUL on either side: treated as noise, so a name here is missed.
      const noise = Buffer.from([0x89, ...Buffer.from('Plantedname'), 0x1f, 0x8b]);
      expect(contentFindings('docs/photo.png', noise, PLANT)).toEqual([]);
      expect(contentFindings('docs/notes.txt', Buffer.from('Plantedname'), PLANT)).toEqual(['real family name']);
    });

    it('fails on an empty list, a list from the wrong root, or a listed file it cannot read', () => {
      expect(() => scan([], tree(base), PLANT)).toThrow(`lacks CLAUDE.md and ${SELF}`);
      // Listed from a folder that has its own CLAUDE.md: this file's root path is missing.
      expect(() => scan(['CLAUDE.md', 'test/no-real-family-data.test.ts'], tree(base), PLANT)).toThrow(`lacks ${SELF}:`);
      // Outside a sparse checkout, or deleted in the working tree.
      expect(() => scan(list('docs/outside-the-cone.md'), tree(base), PLANT)).toThrow('1 listed file(s) could not be read');
    });
  });

  it('no tracked file has a real family name or the real birth date in its path or contents', () => {
    // The message names the file and the kind of detail, never the value.
    expect(scan(trackedFiles(), readTracked), 'Replace with the fictional family "Asha" / 2025-04-12 (CLAUDE.md)').toEqual([]);
  }, 60_000);
});
