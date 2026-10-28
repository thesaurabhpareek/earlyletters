#!/usr/bin/env node
// Scores a reviewer's findings on the calibration set against key.json.
//
// Usage: node agents/evals/calibration/score.mjs <findings.json> [--slack N] [--fp-min major] [--json]
//   findings.json: one review {patch, verdict, findings:[{file,line,end_line?,severity}]} or an array of them.
//
// Why match on file and line, not wording: a reviewer may describe the same defect in any words; what
// proves it found the defect is that it pointed at the place. A finding matches a seeded defect when the
// file is the same and [line, end_line ?? line] overlaps [start - slack, end + slack] (slack default 2).
// False positives are findings that match no seeded defect, counted only at severity >= --fp-min (default
// "major"): a nit on a clean patch is not a wrong block. Several findings on one defect count once.
// A missing patch is reported and left out of the totals, so a partial run cannot look perfect.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const loadKey = () => JSON.parse(readFileSync(join(HERE, "key.json"), "utf8"));

const norm = (f) => String(f ?? "").replace(/^\.?\//, "").replace(/^[ab]\//, "");

export function matches(finding, defect, slack = 2) {
  if (norm(finding.file) !== norm(defect.file)) return false;
  const a = Number(finding.line);
  const b = Number(finding.end_line ?? finding.line);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  return lo <= defect.end + slack && hi >= defect.start - slack;
}

export function scoreReview(review, key, { slack = 2, fpMin = "major" } = {}) {
  const entry = key.patches[review.patch];
  if (!entry) throw new Error(`unknown patch "${review.patch}"`);
  if (!key.verdicts.includes(review.verdict)) throw new Error(`verdict must be one of ${key.verdicts.join(" | ")}, got "${review.verdict}"`);
  const rank = (s) => {
    const i = key.severities.indexOf(s);
    if (i < 0) throw new Error(`unknown severity "${s}"`);
    return i; // 0 = blocker, the most severe
  };
  const fpRank = rank(fpMin);
  const found = new Set();
  let falsePositives = 0;
  for (const f of review.findings ?? []) {
    const hit = entry.defects.filter((d) => matches(f, d, slack));
    for (const d of hit) found.add(d.id);
    if (!hit.length && rank(f.severity) <= fpRank) falsePositives++;
  }
  return {
    patch: review.patch,
    defects: entry.defects.length,
    found: found.size,
    missed: entry.defects.filter((d) => !found.has(d.id)).map((d) => d.id),
    falsePositives,
    verdict: review.verdict,
    expected: entry.verdict,
    verdictCorrect: review.verdict === entry.verdict,
  };
}

export function scoreAll(reviews, key, opts) {
  const rows = [];
  const seen = new Set();
  for (const r of reviews) {
    if (seen.has(r.patch)) throw new Error(`patch "${r.patch}" appears twice`);
    seen.add(r.patch);
    rows.push(scoreReview(r, key, opts));
  }
  const missingPatches = Object.keys(key.patches).filter((p) => !seen.has(p));
  const defects = rows.reduce((n, r) => n + r.defects, 0);
  const found = rows.reduce((n, r) => n + r.found, 0);
  return {
    rows,
    missingPatches,
    recall: defects ? found / defects : null,
    falsePositives: rows.reduce((n, r) => n + r.falsePositives, 0),
    verdictAccuracy: rows.length ? rows.filter((r) => r.verdictCorrect).length / rows.length : null,
    cleanShipped: rows.filter((r) => r.expected === "ship" && r.verdict === "ship").length,
    cleanTotal: rows.filter((r) => r.expected === "ship").length,
  };
}

const pct = (x) => (x === null ? "n/a" : `${(x * 100).toFixed(0)}%`);

export function format(res) {
  const lines = ["patch                       verdict (key)            found/seeded  false pos"];
  for (const r of res.rows) {
    lines.push(`${r.patch.padEnd(27)} ${`${r.verdict} (${r.expected})`.padEnd(24)} ${`${r.found}/${r.defects}`.padEnd(13)} ${r.falsePositives}${r.verdictCorrect ? "" : "   WRONG VERDICT"}`);
  }
  if (res.missingPatches.length) lines.push(`not reviewed (left out of totals): ${res.missingPatches.join(", ")}`);
  lines.push(`recall of seeded defects: ${pct(res.recall)}`, `false positives: ${res.falsePositives}`, `verdict accuracy: ${pct(res.verdictAccuracy)} (clean patches shipped: ${res.cleanShipped}/${res.cleanTotal})`);
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const opt = (name, dflt) => { const i = args.indexOf(name); return i < 0 ? dflt : args.splice(i, 2)[1]; };
  const slack = Number(opt("--slack", 2));
  const fpMin = opt("--fp-min", "major");
  const asJson = args.includes("--json");
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) { console.error("usage: score.mjs <findings.json> [--slack N] [--fp-min severity] [--json]"); process.exit(2); }
  try {
    const data = JSON.parse(readFileSync(file, "utf8"));
    const res = scoreAll(Array.isArray(data) ? data : [data], loadKey(), { slack, fpMin });
    console.log(asJson ? JSON.stringify(res, null, 2) : format(res));
  } catch (e) {
    console.error(`score: ${e.message}`);
    process.exit(2);
  }
}
