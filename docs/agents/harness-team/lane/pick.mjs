#!/usr/bin/env node
// Picks the lane's one target per run from coverage numbers. Plain code: the
// model never chooses its own work, and no issue, PR or comment text is read.
//
//   node pick.mjs --repo <checkout> [--exclude <src path>]...   prints {workspace, file, uncovered, pct} or {}
//
// Reads <workspace>/coverage/coverage-summary.json (vitest v8 json-summary,
// written by `npm run test:coverage`; scripts/coverage/preset.ts sets the reporter).
import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { WORKSPACES, NEVER } from "./gate.mjs";

export const MIN_LINES = 20; // too small to be worth a PR
export const MAX_LINES = 400; // too big for a small model's context in one go

/** Rank eligible files by uncovered lines, most first; ties by path for a stable pick. */
export function rank(summaries, { exclude = [] } = {}) {
  const rows = [];
  for (const [ws, summary] of Object.entries(summaries)) {
    for (const [file, m] of Object.entries(summary)) {
      if (file === "total" || !m?.lines) continue;
      if (!file.startsWith(`${ws}/src/`) || !file.endsWith(".ts") || file.endsWith(".d.ts")) continue;
      if (NEVER.some((r) => r.test(file)) || exclude.includes(file)) continue;
      const { total, covered } = m.lines;
      if (total < MIN_LINES || total > MAX_LINES) continue;
      const uncovered = total - covered;
      if (uncovered <= 0) continue;
      rows.push({ workspace: ws, file, uncovered, pct: m.lines.pct });
    }
  }
  return rows.sort((a, b) => b.uncovered - a.uncovered || a.file.localeCompare(b.file));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const repo = argv[argv.indexOf("--repo") + 1] ?? ".";
  const exclude = argv.flatMap((a, i) => (a === "--exclude" ? [argv[i + 1]] : []));
  const summaries = {};
  for (const ws of WORKSPACES) {
    const p = join(repo, ws, "coverage", "coverage-summary.json");
    if (!existsSync(p)) continue;
    const raw = JSON.parse(readFileSync(p, "utf8"));
    // vitest writes absolute paths; make them repository-relative.
    summaries[ws] = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k === "total" ? k : relative(repo, k), v]));
  }
  console.log(JSON.stringify(rank(summaries, { exclude })[0] ?? {}));
}
