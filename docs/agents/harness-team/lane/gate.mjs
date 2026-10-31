#!/usr/bin/env node
// Lane gate for the unattended test-writing lane (design: ../02-runtime-and-lane.md).
// Plain code, no model, no network. It decides whether a lane change may be
// published. It runs twice: in the lane after the model step, and again as the
// required `lane-guard` check on the pull request, so a broken lane cannot
// skip it.
//
//   node gate.mjs --repo <checkout> --base <sha> --target <workspace>:<src path>
//
// Exit 0 when the change passes, 1 when it fails (reasons on stdout as JSON).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Workspaces the lane may write tests for. Not packages/core (the constitution
// lives in its src and its tests guard it), not packages/content (copy rules,
// "fix the copy, not the test"), not apps/mobile for now (native glue needs
// mocks a small model gets wrong; add after the kill criterion's trial).
// packages/brand is out too: its code is index.ts, the one place the public name lives.
export const WORKSPACES = Object.freeze(["packages/api", "packages/analytics", "packages/design-tokens", "packages/emails"]);

// The only files the lane may create: one new test file in the workspace's lane folder.
export const ALLOWED = /^packages\/(api|analytics|design-tokens|emails)\/test\/lane\/[a-z0-9][a-z0-9-]{0,60}\.lane\.test\.ts$/;

// Never, whatever ALLOWED says (defence in depth if ALLOWED is ever widened).
export const NEVER = [
  /^\.github\//, /^supabase\//, /^scripts\//, /^agents\//, /^\.claude\//, /^docs\//, /^packs\//,
  /^CLAUDE\.md$/, /^packages\/core\//, /^packages\/content\//, /^packages\/brand\//,
  /(^|\/)\.env/, /\.pem$/, /\.key$/, /(^|\/)package(-lock)?\.json$/, /(^|\/)vitest[^/]*\.config\./,
  /(^|\/)tsconfig[^/]*\.json$/, /migrations?\//,
];

export const LIMITS = Object.freeze({ maxFiles: 1, maxLines: 300, minExpects: 3 });

const SECRET = /(gh[pousr]_[A-Za-z0-9]{20,}|github_pat_|sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|xox[abp]-)/;
// Things a test written to pass, or to escape, would reach for.
const FORBIDDEN_CODE = [
  [/\.(only|skip|todo|fails)\s*\(/, "focused, skipped or expected-to-fail test"],
  [/\bprocess\.env\b/, "reads the environment"],
  [/\b(child_process|node:child_process|worker_threads|node:net|node:http|node:https|node:dgram|node:dns)\b/, "process or network module"],
  [/\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b/, "network call"],
  [/\b(writeFile|appendFile|rm|rmdir|unlink|mkdir)(Sync)?\s*\(/, "writes the file system"],
  [/\beval\s*\(|\bnew Function\s*\(/, "dynamic code"],
  [/\bvi\.setConfig\b|\btestTimeout\b/, "changes the test runner"],
];

/** Imports a lane test may use: vitest, and the workspace's own src through a relative path. */
export function badImports(text) {
  const out = [];
  for (const m of text.matchAll(/\b(?:import|from|require\s*\(|import\s*\()\s*["']([^"']+)["']/g)) {
    const spec = m[1];
    if (spec === "vitest") continue;
    if (/^(\.\.\/)+src(\/[A-Za-z0-9_.\-/]+)?$/.test(spec)) continue;
    out.push(spec);
  }
  return out;
}

/**
 * Check one proposed change. `changes` is [{status, path}] from
 * `git diff --name-status --no-renames base`, plus untracked files as "A".
 * `read(path)` returns a new file's text.
 */
export function check({ changes, target, read }) {
  const fail = [];
  const [ws, src] = String(target ?? "").split(":");
  if (!WORKSPACES.includes(ws)) fail.push(`target workspace ${ws || "(none)"} is not in the lane`);
  if (!changes.length) fail.push("no change");
  if (changes.length > LIMITS.maxFiles) fail.push(`${changes.length} files changed; the lane allows ${LIMITS.maxFiles}`);
  for (const c of changes) {
    if (c.status !== "A") fail.push(`${c.path}: ${c.status === "M" ? "modified" : c.status === "D" ? "deleted" : `status ${c.status}`}; the lane only adds files`);
    if (NEVER.some((r) => r.test(c.path))) fail.push(`${c.path}: a path the lane may never touch`);
    if (!ALLOWED.test(c.path)) fail.push(`${c.path}: outside <workspace>/test/lane/*.lane.test.ts`);
    if (ws && !c.path.startsWith(`${ws}/`)) fail.push(`${c.path}: not in the target workspace ${ws}`);
    if (c.status !== "A") continue;
    const text = read(c.path);
    const lines = text.split("\n").length;
    if (lines > LIMITS.maxLines) fail.push(`${c.path}: ${lines} lines; the lane allows ${LIMITS.maxLines}`);
    if (/[^\x09\x0a\x0d\x20-\x7e]/.test(text)) fail.push(`${c.path}: non-ASCII characters (content rules ban dashes, curly quotes, ellipses and emoji; the lane bans all of it)`);
    if (SECRET.test(text)) fail.push(`${c.path}: looks like a credential`);
    for (const [re, why] of FORBIDDEN_CODE) if (re.test(text)) fail.push(`${c.path}: ${why}`);
    const bad = badImports(text);
    if (bad.length) fail.push(`${c.path}: imports outside vitest and the workspace's src: ${bad.join(", ")}`);
    const expects = (text.match(/\bexpect\s*\(/g) ?? []).length;
    const tests = (text.match(/\b(it|test)\s*\(/g) ?? []).length;
    if (expects < LIMITS.minExpects) fail.push(`${c.path}: ${expects} expect() calls; at least ${LIMITS.minExpects}`);
    if (tests && expects < tests) fail.push(`${c.path}: ${tests} tests but ${expects} expect() calls; every test must assert`);
    if (src && !text.includes(src.replace(/^.*\/src\//, "src/").replace(/\.ts$/, ""))) fail.push(`${c.path}: does not import the target ${src}`);
  }
  return { ok: fail.length === 0, fail };
}

function changesIn(repo, base) {
  const git = (...a) => execFileSync("git", ["-C", repo, ...a], { encoding: "utf8" });
  const tracked = git("diff", "--name-status", "--no-renames", base).split("\n").filter(Boolean)
    .map((l) => { const [status, path] = l.split("\t"); return { status: status[0], path }; });
  const untracked = git("ls-files", "--others", "--exclude-standard").split("\n").filter(Boolean)
    .map((path) => ({ status: "A", path }));
  return [...tracked, ...untracked];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (n) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : undefined; };
  const repo = opt("repo") ?? ".";
  const res = check({ changes: changesIn(repo, opt("base") ?? "HEAD"), target: opt("target"), read: (p) => readFileSync(join(repo, p), "utf8") });
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.ok ? 0 : 1);
}
