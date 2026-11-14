#!/usr/bin/env node
// Keeps docs/reference/ true to the code. Owner: the reference-docs agent.
//
//   node scripts/docs/reference.mjs --check          # what is stale or wrong (the daily worklist)
//   node scripts/docs/reference.mjs --write          # refresh every generated facts block
//   node scripts/docs/reference.mjs --check --json   # same, as JSON
//
// A reference page is docs/reference/*.md with frontmatter:
//   title, owner, covers: [globs], verified_at: <commit sha>, verified_on: YYYY-MM-DD
// "Stale" means a file matching `covers` changed after `verified_at`: the prose
// may be wrong, so the owner re-reads those changes and updates the page.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RENDERERS } from "./facts.mjs";
import { ROOT, blockNames, changedSince, fillBlocks, frontmatter, matchesAny, today } from "./lib.mjs";

export const REQUIRED = ["title", "owner", "covers", "verified_at", "verified_on"];

/** Code areas that need a reference page. Each must be matched by some page's `covers`. */
export const AREAS = [
  "apps/mobile/src/app/_layout.tsx",
  "apps/mobile/src/lib/store.ts",
  "apps/mobile/app.config.ts",
  "apps/mobile/eas.json",
  "packages/core/src/index.ts",
  "packages/api/src/index.ts",
  "packages/content/src/index.ts",
  "supabase/migrations/20260930000000_scribe_core.sql",
  "supabase/functions/purge-worker/index.ts",
  ".github/workflows/ci.yml",
  "agents/roster.json",
  "packs/README.md",
];

export function pages(root = ROOT) {
  const dir = join(root, "docs", "reference");
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort()
    .map((f) => {
      const path = `docs/reference/${f}`;
      const text = readFileSync(join(root, path), "utf8");
      return { path, text, ...frontmatter(text) };
    });
}

/** Everything wrong or stale. Pure apart from reading files and git. */
export function check(root = ROOT, { changed = (sha) => changedSince(sha, root), render = (n) => RENDERERS[n]?.(root) } = {}) {
  const errors = [];
  const stale = [];
  const drift = [];
  const all = pages(root);
  for (const p of all) {
    const missing = REQUIRED.filter((k) => !p.data[k] || (Array.isArray(p.data[k]) && !p.data[k].length));
    if (missing.length) errors.push(`${p.path}: frontmatter is missing ${missing.join(", ")}`);
    if (p.data.owner && p.data.owner !== "reference-docs") errors.push(`${p.path}: owner must be reference-docs`);
    for (const n of blockNames(p.text)) if (!RENDERERS[n]) errors.push(`${p.path}: unknown facts block "${n}"`);
    if (fillBlocks(p.text, render) !== p.text) drift.push(p.path);
    const files = changed(p.data.verified_at);
    if (files === null && p.data.verified_at) errors.push(`${p.path}: verified_at ${p.data.verified_at} is not a commit in this repository`);
    const hits = (files ?? []).filter((f) => matchesAny(f, p.data.covers));
    if (hits.length) stale.push({ page: p.path, verified_at: p.data.verified_at, changed: hits });
  }
  const covered = (f) => all.some((p) => matchesAny(f, p.data.covers));
  const uncovered = AREAS.filter((f) => existsSync(join(root, f)) && !covered(f));
  if (!existsSync(join(root, "docs", "README.md"))) errors.push("docs/README.md (the docs index) is missing");
  return { pages: all.length, errors, drift, stale, uncovered };
}

export function write(root = ROOT) {
  const touched = [];
  for (const p of pages(root)) {
    const next = fillBlocks(p.text, (n) => RENDERERS[n]?.(root));
    if (next !== p.text) {
      writeFileSync(join(root, p.path), next);
      touched.push(p.path);
    }
  }
  return touched;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--write")) {
    const t = write();
    console.log(t.length ? `refreshed facts in: ${t.join(", ")}` : "facts blocks already current");
  }
  if (argv.includes("--check") || !argv.includes("--write")) {
    const r = check();
    if (argv.includes("--json")) {
      console.log(JSON.stringify({ date: today(), ...r }, null, 2));
    } else {
      console.log(`${r.pages} reference pages.`);
      for (const e of r.errors) console.log(`error: ${e}`);
      for (const d of r.drift) console.log(`error: ${d}: generated facts are out of date (run --write)`);
      for (const s of r.stale) console.log(`stale: ${s.page} (verified at ${s.verified_at}): ${s.changed.length} covered files changed, e.g. ${s.changed.slice(0, 5).join(", ")}`);
      for (const u of r.uncovered) console.log(`uncovered: ${u} is in no page's covers`);
      if (!r.errors.length && !r.drift.length && !r.stale.length && !r.uncovered.length) console.log("reference docs are current");
    }
    const strict = argv.includes("--strict");
    if (r.errors.length || r.drift.length || (strict && (r.stale.length || r.uncovered.length))) process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
