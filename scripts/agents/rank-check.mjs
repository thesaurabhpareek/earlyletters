#!/usr/bin/env node
// Checks docs/backlog/RANK.md, the one file that orders the agent queue
// (docs/agents/OPERATING_MODEL.md, "Backlog rank"). Run by check.mjs in CI.
//
//   node scripts/agents/rank-check.mjs
//
// Errors: a row that is not `| rank | BL-nnn | tier | why |`, a duplicate id, ranks that
// are not 1..N once each, a tier outside T0..T3 and an id that is not in docs/BACKLOG.md.
// Warnings only: a ranked row whose task is done or superseded (a stale rank, harmless because
// the dispatcher skips done rows; the product agent prunes it on the next recompute), and a
// ready agent row with no rank (unranked rows still run, in file order).
import { join } from "node:path";
import { ROOT, parseBacklog, readText, loadRank, RANK_TIERS } from "./lib.mjs";

const STALE = new Set(["done", "superseded"]);

/** Pure check: `rows` and `shapeErrors` from parseRank, `tasks` from parseBacklog. */
export function checkRankRows(rows, tasks, shapeErrors = []) {
  const errors = [...shapeErrors];
  const warnings = [];
  const byId = new Map(tasks.map((t) => [t.id, t]));

  const seen = new Map();
  for (const r of rows) {
    const where = `RANK.md line ${r.line} (${r.id})`;
    if (seen.has(r.id)) errors.push(`${where}: duplicate id, first ranked on line ${seen.get(r.id)}`);
    else seen.set(r.id, r.line);
    if (!RANK_TIERS.includes(r.tier)) errors.push(`${where}: unknown tier "${r.tier}", use one of ${RANK_TIERS.join(", ")}`);
    const t = byId.get(r.id);
    if (!t) errors.push(`${where}: ${r.id} is not in docs/BACKLOG.md`);
    else if (STALE.has(t.status)) warnings.push(`${where}: stale rank, ${r.id} is ${t.status}; the product agent prunes it on the next recompute`);
  }

  const ranks = rows.map((r) => r.rank).sort((a, b) => a - b);
  const dupRanks = [...new Set(ranks.filter((n, i) => i && n === ranks[i - 1]))];
  if (dupRanks.length) errors.push(`RANK.md: rank used more than once: ${dupRanks.join(", ")}`);
  const missing = [];
  for (let n = 1; n <= ranks.length; n++) if (!ranks.includes(n)) missing.push(n);
  if (missing.length) errors.push(`RANK.md: ranks must be 1..${ranks.length} with no gaps; missing ${missing.slice(0, 10).join(", ")}${missing.length > 10 ? ", ..." : ""}`);

  const unranked = tasks.filter((t) => t.status === "ready" && t.mode === "agent" && !seen.has(t.id)).map((t) => t.id);
  if (unranked.length) {
    warnings.push(`${unranked.length} ready agent rows have no rank (they run after the ranked rows, in file order): ${unranked.slice(0, 10).join(", ")}${unranked.length > 10 ? ", ..." : ""}`);
  }
  return { errors, warnings };
}

export function checkRank(root = ROOT) {
  const { rows, errors: shape } = loadRank(root);
  const tasks = parseBacklog(readText(join(root, "docs", "BACKLOG.md")));
  const res = checkRankRows(rows, tasks, shape);
  return { ...res, summary: { ranked: rows.length } };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors, warnings, summary } = checkRank();
  for (const w of warnings) console.log(`warning: ${w}`);
  for (const e of errors) console.log(`error: ${e}`);
  console.log(`${summary.ranked} ranked rows.`);
  if (errors.length) process.exit(1);
  console.log("backlog rank is consistent");
}
