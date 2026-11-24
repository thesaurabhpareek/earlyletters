#!/usr/bin/env node
/**
 * NSC-01 (BL-1045): a SHA-256 pin on every native source under apps/mobile/modules. The manifest
 * modules/REVIEWED.sha256 lists each file with the hash it had when security-architect read it, and names the
 * reviewed head. Any edit, addition or removal under modules/ makes test/native-sources.test.ts fail until the
 * manifest changes in a PR that security-architect reads. The name scan in photos-device.test.ts stays as the second
 * line: it is beaten by shadowing and run-time names (N-B3d), a hash is not.
 *
 *   node scripts/native-sources.mjs --check             # exit 1 on any difference (what CI runs through the test)
 *   node scripts/native-sources.mjs --write <headSha>   # rewrite the manifest AFTER the reviewer has read the change
 *
 * Pure functions take the directory, so a test can run them on a fixture tree.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MANIFEST_NAME = 'REVIEWED.sha256';
const IGNORED = new Set([MANIFEST_NAME, '.DS_Store']);
const HEADER = [
  '# Native sources security-architect has read (NSC-01, BL-1045). Format: sha256sum, two spaces, path under modules/.',
  '# Do not edit by hand. After the reviewer has read a change: node scripts/native-sources.mjs --write <head sha>.',
];

/** Every file under `dir` (posix paths relative to it, sorted), without the manifest (nothing else is skipped: a folder named build must not hide source). */
export function listSources(dir) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (IGNORED.has(e.name)) continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.isFile()) out.push(relative(dir, p).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/** `{ path: sha256 hex }` for every source under `dir`, over the raw bytes (line endings count). */
export function hashSources(dir) {
  return Object.fromEntries(listSources(dir).map((f) => [f, createHash('sha256').update(readFileSync(join(dir, f))).digest('hex')]));
}

/** The manifest text: `{ head, files }`. `head` is null and `files` empty when it does not parse (fails closed). */
export function parseManifest(text) {
  const files = {};
  let head = null;
  for (const line of String(text ?? '').split('\n')) {
    const h = /^#\s*reviewed-head:\s*([0-9a-f]{40})\s*$/.exec(line);
    if (h) head = h[1];
    const m = /^([0-9a-f]{64}) {2}(\S.*)$/.exec(line);
    if (m) files[m[2]] = m[1];
  }
  return { head, files };
}

/** One line per difference between the pinned and the actual sources; empty when they match and the head is named. */
export function manifestProblems(manifestText, actual) {
  const { head, files } = parseManifest(manifestText);
  const out = [];
  if (!head) out.push('the manifest does not name a reviewed head (a line "# reviewed-head: <40 hex>")');
  if (!Object.keys(files).length) out.push('the manifest pins no file');
  for (const f of Object.keys(actual)) {
    if (!(f in files)) out.push(`added, not reviewed: ${f}`);
    else if (files[f] !== actual[f]) out.push(`changed since review: ${f}`);
  }
  for (const f of Object.keys(files)) if (!(f in actual)) out.push(`removed, still pinned: ${f}`);
  return out;
}

export function renderManifest(head, actual) {
  return `${[...HEADER, `# reviewed-head: ${head}`, ...Object.entries(actual).map(([f, h]) => `${h}  ${f}`)].join('\n')}\n`;
}

const MODULES = join(dirname(fileURLToPath(import.meta.url)), '..', 'modules');
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [flag, head] = process.argv.slice(2);
  const actual = hashSources(MODULES);
  if (flag === '--write') {
    if (!/^[0-9a-f]{40}$/.test(head ?? '')) {
      console.error('usage: native-sources.mjs --write <40-hex head sha the reviewer read>');
      process.exit(2);
    }
    writeFileSync(join(MODULES, MANIFEST_NAME), renderManifest(head, actual));
    console.log(`pinned ${Object.keys(actual).length} files at ${head}`);
  } else {
    const problems = manifestProblems(readFileSync(join(MODULES, MANIFEST_NAME), 'utf8'), actual);
    for (const p of problems) console.error(p);
    process.exit(problems.length ? 1 : 0);
  }
}
