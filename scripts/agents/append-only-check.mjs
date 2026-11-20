#!/usr/bin/env node
// Append-only record doc check (HV2-B35, owner: chief-of-staff). Flags a PR diff that deletes
// or rewrites lines in a record doc listed in docs/agents/append-only.json (rulings, build
// records). Added lines are fine; a changed line counts as a deletion because its old text is gone.
//
// Usage:
//   node scripts/agents/append-only-check.mjs                          diff origin/develop...HEAD
//   node scripts/agents/append-only-check.mjs --base <ref> --head <ref>
//   node scripts/agents/append-only-check.mjs --list <path>            default docs/agents/append-only.json
//
// Exit codes: 0 no deletion in a listed file, 1 a deletion found, 2 the check itself could not run
// (bad list, bad ref, git failed). A failure to run is never a pass.
//
// Not wired into CI: that needs a change under .github/, which is a founder path. Until then a
// reviewer or an author runs it by hand. The diff comes from `git diff base...head` (three dots:
// changes on head since the merge base). Read-only: the only command run is `git diff`.
// Diff text is untrusted data (a PR author wrote it): it is only parsed, and printed after
// control characters are stripped.
import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const DEFAULT_LIST = join(ROOT, "docs", "agents", "append-only.json");
const REF_RE = /^[A-Za-z0-9_][A-Za-z0-9._\/@{}~^-]*$/;

const clean = (v) => String(v ?? "").replace(/[\u0000-\u001f\u007f-\u009f]/g, "");

/** Read and validate the list file text. Returns an array of repo-relative paths. */
export function parseList(text) {
  let j;
  try { j = JSON.parse(text); } catch { throw new Error("append-only list is not valid JSON"); }
  const files = j?.files;
  if (!Array.isArray(files) || files.length === 0) throw new Error("append-only list needs a non-empty files array");
  for (const f of files) {
    if (typeof f !== "string" || !/^[A-Za-z0-9._\/-]+$/.test(f) || f.startsWith("/") || f.split("/").some((p) => p === ".." || p === "")) {
      throw new Error(`append-only list has a bad path: ${clean(JSON.stringify(f))}`);
    }
  }
  return [...new Set(files)];
}

/**
 * Parse a unified diff (any context size) and return findings for listed files:
 * { file, kind: "lines" | "file-deleted" | "renamed-away" | "binary", count, samples: [{ line, text }] }.
 * Hunk headers give exact line counts, so a deleted line that itself starts with "--" is not
 * mistaken for a file header.
 */
export function checkDiff(diff, listed) {
  const set = new Set(listed);
  const findings = new Map();
  const note = (file, kind, extra = {}) => {
    const key = `${file}\0${kind}`;
    const f = findings.get(key) ?? { file, kind, count: 0, samples: [] };
    if (extra.line !== undefined) { f.count++; if (f.samples.length < 5) f.samples.push({ line: extra.line, text: clean(extra.text).slice(0, 100) }); }
    findings.set(key, f);
  };
  let oldPath = null;
  let oldRem = 0, newRem = 0, oldLine = 0;
  for (const raw of String(diff ?? "").replace(/\r/g, "").split("\n")) {
    if (oldRem > 0 || newRem > 0) {
      const c = raw[0];
      if (c === "\\") continue;
      if (c === "-" && oldRem > 0) { if (oldPath && set.has(oldPath)) note(oldPath, "lines", { line: oldLine, text: raw.slice(1) }); oldRem--; oldLine++; continue; }
      if (c === "+" && newRem > 0) { newRem--; continue; }
      if ((c === " " || raw === "") && oldRem > 0 && newRem > 0) { oldRem--; newRem--; oldLine++; continue; }
      oldRem = newRem = 0; // malformed hunk: fall through and read the line as a header
    }
    let m;
    if (raw.startsWith("diff --git ")) { oldPath = /^diff --git a\/(\S+) b\/\S+$/.exec(raw)?.[1] ?? null; continue; }
    if ((m = /^rename from (.+)$/.exec(raw))) { oldPath = m[1]; if (set.has(oldPath)) note(oldPath, "renamed-away"); continue; }
    if ((m = /^--- (?:a\/(.+)|\/dev\/null)$/.exec(raw))) { oldPath = m[1] ?? null; continue; }
    if (raw.startsWith("deleted file mode") && oldPath && set.has(oldPath)) { note(oldPath, "file-deleted"); continue; }
    if ((m = /^@@ -(\d+)(?:,(\d+))? \+\d+(?:,(\d+))? @@/.exec(raw))) {
      oldLine = Number(m[1]);
      oldRem = m[2] === undefined ? 1 : Number(m[2]);
      newRem = m[3] === undefined ? 1 : Number(m[3]);
      continue;
    }
    if (/^Binary files /.test(raw) && oldPath && set.has(oldPath)) note(oldPath, "binary");
  }
  return [...findings.values()];
}

export function formatFindings(findings) {
  if (findings.length === 0) return "append-only check: ok, no deletions in listed record docs";
  const out = ["append-only check: FAIL, a listed record doc lost lines. Write a new dated section instead of editing."];
  for (const f of findings) {
    const what = { lines: `${f.count} line(s) deleted or rewritten`, "file-deleted": "file deleted", "renamed-away": "file renamed away", binary: "binary change" }[f.kind];
    out.push(`  ${f.file}: ${what}`);
    for (const s of f.samples) out.push(`    old line ${s.line}: ${s.text}`);
  }
  return out.join("\n");
}

function gitDiff(base, head) {
  return new Promise((resolve, reject) => {
    execFile("git", ["diff", "--no-color", "--no-ext-diff", "--unified=0", "--find-renames", `${base}...${head}`, "--"], { maxBuffer: 256 * 1024 * 1024, cwd: ROOT }, (err, stdout) => {
      if (err) return reject(new Error(`git diff ${base}...${head} failed (are both refs fetched?)`));
      resolve(stdout);
    });
  });
}

export function parseArgs(argv) {
  const o = { base: "origin/develop", head: "HEAD", list: DEFAULT_LIST };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--base") o.base = argv[++i];
    else if (a === "--head") o.head = argv[++i];
    else if (a === "--list") o.list = argv[++i];
    else throw new Error(`unknown argument ${a}`);
  }
  for (const r of [o.base, o.head]) if (!REF_RE.test(String(r))) throw new Error("--base and --head must be plain git refs");
  if (!o.list) throw new Error("--list needs a path");
  return o;
}

/** Returns the exit code. `diff` (a string) replaces git, for tests. */
export async function main(argv = process.argv.slice(2), { diff, out = console.log, err = console.error } = {}) {
  try {
    const o = parseArgs(argv);
    const listed = parseList(readFileSync(o.list, "utf8"));
    const text = diff ?? (await gitDiff(o.base, o.head));
    const findings = checkDiff(text, listed);
    (findings.length ? err : out)(formatFindings(findings));
    return findings.length ? 1 : 0;
  } catch (e) {
    err(`append-only check could not run: ${clean(e.message)}`);
    return 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().then((code) => process.exit(code));
}
