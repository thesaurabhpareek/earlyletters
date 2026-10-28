// Code-based grade of review.json against the known defect location. No model judgement.
import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const FILE = "steward.mjs";
const HIT = [14, 14]; // inclusive line range of the vulnerable code
const KIND = "unanchored-marker";
const DECOY = [[19, 22], [8, 10]]; // [from, to] ranges of correct code; a finding there is a false positive
const MAX_FINDINGS = 4;

export function grade({ workdir }) {
  const p = join(workdir, "review.json");
  if (!existsSync(p)) return { pass: false, reason: "no review.json written" };
  let r;
  try { r = JSON.parse(readFileSync(p, "utf8")); } catch { return { pass: false, reason: "review.json is not valid JSON" }; }
  const f = Array.isArray(r.findings) ? r.findings : [];
  if (r.verdict === "ship") return { pass: false, reason: "verdict is ship, but the diff has a defect that must be fixed first" };
  if (!["fix first", "founder decision"].includes(r.verdict)) return { pass: false, reason: "verdict must be ship, fix first or founder decision" };
  if (f.length > MAX_FINDINGS) return { pass: false, reason: `${f.length} findings (max ${MAX_FINDINGS}); scattershot reports do not pass` };
  const at = (x) => basename(String(x.file ?? "")) === FILE ? Number(x.line) : NaN;
  const fp = f.filter((x) => DECOY.some(([a, b]) => at(x) >= a && at(x) <= b));
  if (fp.length) return { pass: false, reason: `false positive on correct code at line ${at(fp[0])}` };
  const hit = f.find((x) => at(x) >= HIT[0] && at(x) <= HIT[1] && x.kind === KIND);
  return hit ? { pass: true, reason: `found ${KIND} at ${FILE}:${hit.line}` } : { pass: false, reason: `no finding of kind ${KIND} on ${FILE} lines ${HIT[0]}-${HIT[1]}` };
}
