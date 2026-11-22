#!/usr/bin/env node
// Test title cite rules C-01, C-02 and C-10 (CHECKS-AND-BALANCES.md section 2), report only.
// Reads test files as text (no TypeScript parse) and prints `file:line rule message`.
//
//   node scripts/qa/title-cites.mjs [--check] [--root <dir>]
//
// Exit 0 in report mode. With --check, exit 1 when anything is reported (not wired in CI:
// failing a PR needs the BL-964 ratchet and the founder's G0 decision).
//
//   C-02 title form: row ids go in their own brackets, `[NS-01-R4][NX-39-R14] ...`. Never in
//        parentheses, never bare, never a comma list inside one bracket.
//   C-01 a row cited by two or more tests carries the set comment on exactly one file line:
//        `// NS-09-R3 is proven by this set together, each citing it: <file>:<line> (...) and ...`
//        Whether one cite proves the whole row is a human review rule; only the form is checked.
//   C-10 a title in a stand-in file (name has e2e, pglite, stand-in) cites a row only with
//        `[stand-in]` in the title (trace counts such a row partial). The file-name list is a
//        recommendation, marked STAND_IN_FILE below.
// Prints paths and ids only, never title text beyond the id.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { walk, testTitles, nsIds, nsBracketed } from '../trace.mjs';

export const STAND_IN_FILE = /(?:e2e|pglite|stand-?in)/i;
const SET_COMMENT = /^[ \t]*\/\/[ \t]*(\S+)[ \t]+is proven by this set together\b/gm;
const BRACKET = /\[([^\]\n]*)\]/g;
const isTestFile = (p) => /\.test\.[cm]?[jt]sx?$/.test(p);

/** Problems in one file: [{ line, rule, message }], plus the cites it gives each row. */
export function checkSource(src, file = 'x.test.ts') {
  const problems = [];
  const cites = [];
  for (const t of testTitles(src, nsIds)) {
    const bracketed = new Set(nsBracketed(t.title));
    // A bracket that holds two ids is a comma list; one id with other words is still a single cite.
    for (const m of t.title.matchAll(BRACKET)) {
      if (nsIds(m[1]).length > 1) problems.push({ line: t.line, rule: 'C-02', message: `comma list in one bracket: use one bracket per id (${nsIds(m[1]).join(' ')})` });
    }
    const inBrackets = new Set();
    for (const m of t.title.matchAll(BRACKET)) for (const id of nsIds(m[1])) inBrackets.add(id);
    // Ids outside any bracket: in parentheses, or bare.
    const outside = t.title.replace(BRACKET, ' ');
    for (const id of nsIds(outside)) {
      if (inBrackets.has(id)) continue;
      const at = outside.indexOf(id);
      const open = outside.lastIndexOf('(', at) > outside.lastIndexOf(')', at);
      problems.push({ line: t.line, rule: 'C-02', message: `${id} ${open ? 'in parentheses' : 'without brackets'}: trace cannot see it, write [${id}]` });
    }
    if (!t.skipped) for (const id of bracketed) cites.push({ id, line: t.line });
    if (STAND_IN_FILE.test(path.basename(file)) && bracketed.size && !/\[stand-in\]/i.test(t.title)) {
      problems.push({ line: t.line, rule: 'C-10', message: `stand-in file cites ${[...bracketed].join(' ')} without [stand-in]` });
    }
  }
  const setComments = [];
  for (const m of src.matchAll(SET_COMMENT)) setComments.push({ id: m[1], line: src.slice(0, m.index).split('\n').length });
  return { problems, cites, setComments };
}

/** Whole-repo check: per-file problems plus the C-01 rule across files. */
export function checkFiles(files, repo) {
  const out = [];
  const byId = new Map();
  const comments = new Map();
  for (const f of files) {
    const shown = path.relative(repo, f).split(path.sep).join('/');
    const r = checkSource(fs.readFileSync(f, 'utf8'), f);
    for (const p of r.problems) out.push({ file: shown, ...p });
    for (const c of r.cites) (byId.get(c.id) ?? byId.set(c.id, []).get(c.id)).push({ file: shown, line: c.line });
    for (const c of r.setComments) comments.set(c.id, (comments.get(c.id) ?? 0) + 1);
  }
  for (const [id, at] of byId) {
    const n = comments.get(id) ?? 0;
    if (at.length > 1 && n !== 1) {
      out.push({ file: at[0].file, line: at[0].line, rule: 'C-01', message: `${id} is cited by ${at.length} tests and has ${n} set comments (needs exactly 1)` });
    }
  }
  return out.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.rule.localeCompare(b.rule));
}

export function main(argv = process.argv.slice(2), log = console.log) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const i = argv.indexOf('--root');
  const repo = path.resolve(i >= 0 ? argv[i + 1] : path.join(here, '..', '..'));
  const files = ['apps', 'packages', 'scripts', 'supabase'].flatMap((d) => walk(path.join(repo, d), isTestFile));
  const found = checkFiles(files, repo);
  for (const p of found) log(`${p.file}:${p.line} ${p.rule} ${p.message}`);
  log(`title-cites: ${found.length} to look at in ${files.length} test files${argv.includes('--check') ? '' : ' (report only)'}`);
  return argv.includes('--check') && found.length ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) process.exitCode = main();
