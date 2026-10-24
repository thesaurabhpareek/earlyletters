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
 * are decoded as latin1, one character per byte, so text inside them (PDF
 * metadata, audio tags) is still scanned. The scan fails unless the file list
 * includes CLAUDE.md, so an empty or wrong list cannot pass silently.
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

const SKIP = new Set(['package-lock.json', 'packages/content/test/no-real-family-data.test.ts']);
const MAX_BYTES = 5 * 1024 * 1024;
/** Images, PDFs, fonts and media: decoded as latin1, not skipped (the journey record holds ~150 of them). */
const BINARY_EXT = /\.(png|jpe?g|gif|webp|pdf|ttf|otf|woff2?|m4a|wav|mp3|mp4|mov|zip|ico)$/i;

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

/** The text to scan: UTF-8, or latin1 (one character per byte) for a binary-ish file. */
export function decode(file: string, bytes: Buffer): string {
  if (!BINARY_EXT.test(file)) {
    const text = bytes.toString('utf8');
    if (!text.includes('\0')) return text;
  }
  return bytes.toString('latin1');
}

/**
 * Every finding, as "<path>: <kind>", never the value. `read` returns a file's
 * bytes, or null when it cannot be read. Throws when the list does not include
 * CLAUDE.md: an empty or wrong file list proves nothing.
 */
export function scan(files: string[], read: (file: string) => Buffer | null, names = NAME_HASHES, dates = DATE_HASHES): string[] {
  if (!files.includes('CLAUDE.md')) {
    throw new Error(`The file list (${files.length} files) does not include CLAUDE.md, so the scan would prove nothing.`);
  }
  const bad: string[] = [];
  for (const f of files) {
    const hits = findings(f, names, dates).map((kind) => `${kind} in the path`);
    const bytes = SKIP.has(f) ? null : read(f);
    if (bytes) hits.push(...findings(decode(f, bytes), names, dates));
    if (hits.length) bad.push(`${f}: ${hits.join(', ')}`);
  }
  return bad;
}

const ROOT = join(__dirname, '../../..');

function trackedFiles(): string[] {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\0')
    .filter(Boolean);
}

function readTracked(file: string): Buffer | null {
  const path = join(ROOT, file);
  try {
    return statSync(path).size > MAX_BYTES ? null : readFileSync(path);
  } catch {
    return null; // deleted in the working tree, or a submodule
  }
}

describe('no real family details in tracked files', () => {
  it('the guard recognises the fictional family as safe', () => {
    expect(findings('Asha (Ashu) was born 2025-04-12, on 12 April 2025.')).toEqual([]);
    expect(findings('आशा, آشا, Nina, Tara, Neela')).toEqual([]);
  });

  describe('the scan, proved with an invented token hashed the way a real name is', () => {
    // Not anyone's name: made up for these tests, hashed as the header says.
    const PLANT = new Set([sha('Plantedname'.toLowerCase().normalize('NFC'))]);
    const tree = (files: Record<string, Buffer>) => (f: string) => files[f] ?? null;
    const claude = Buffer.from('# CLAUDE.md\n');

    it('catches a name that is only in a path', () => {
      const read = tree({ 'CLAUDE.md': claude, 'docs/plantedname-notes.md': Buffer.from('Asha slept.\n') });
      expect(scan(['CLAUDE.md', 'docs/plantedname-notes.md'], read, PLANT)).toEqual([
        'docs/plantedname-notes.md: real family name in the path',
      ]);
    });

    it('catches a name inside a binary-ish file, decoded as latin1', () => {
      // PDF metadata is often latin1: the accented byte splits the token under UTF-8, not under latin1.
      const pdf = Buffer.concat([
        Buffer.from([0x25, 0x50, 0x44, 0x46, 0x0a, 0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x00, 0xff]),
        Buffer.from('\n<< /Author (Plant\u00e9dname) >>\n', 'latin1'),
      ]);
      expect(findings(pdf.toString('utf8'), PLANT)).toEqual([]);
      const read = tree({ 'CLAUDE.md': claude, 'docs/letter.pdf': pdf, 'data/cache.bin': pdf });
      expect(scan(['CLAUDE.md', 'docs/letter.pdf', 'data/cache.bin'], read, PLANT)).toEqual([
        'docs/letter.pdf: real family name',
        'data/cache.bin: real family name',
      ]);
    });

    it('fails when the file list is empty or does not include CLAUDE.md', () => {
      expect(() => scan([], tree({}), PLANT)).toThrow(/does not include CLAUDE\.md/);
      expect(() => scan(['README.md'], tree({ 'README.md': Buffer.from('Plantedname') }), PLANT)).toThrow(/CLAUDE\.md/);
    });
  });

  it('no tracked file has a real family name or the real birth date in its path or contents', () => {
    // The message names the file and the kind of detail, never the value.
    expect(scan(trackedFiles(), readTracked), 'Replace with the fictional family "Asha" / 2025-04-12 (CLAUDE.md)').toEqual([]);
  }, 60_000);
});
