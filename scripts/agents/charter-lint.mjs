#!/usr/bin/env node
// Charter lint: agent charters point at decisions, they never restate them.
// A charter that copies a price, a date or a decision's words goes stale the
// day the decision changes (retro panel 02 finding 3: the payments charter kept
// superseded prices and "no server sees a purchase" after D-080 and D-100).
//
// Rules for `.claude/agents/*.md`:
//   price          no dollar amounts or "N.NN a month" (cite the D-id instead)
//   date           no calendar dates ("3 Oct", "Oct 3, 2026", "2026-10-03")
//   decision-text  no run of 8 or more words copied from a docs/DECISIONS.md index row
//   retired        no pointers to retired sources ("the latest BRIEF", "BRIEF decision 3",
//                  the `approve-migration` label retired by D-117)
//   cite           every charter names `docs/DECISIONS.md`
//
// It also checks harness docs (docs/agents/**, .claude/agents/*, agents/**/*.md,
// docs/engineering/*.md): every `scripts/agents/<name>.mjs` they cite must exist on
// the branch. A line that marks the file "(planned)" is allowed.
//
//   node scripts/agents/charter-lint.mjs          lint this checkout
//   import { lintCharters, missingScriptCitations } from "./charter-lint.mjs"   (check.mjs)
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "..");

// Charters that still fail and cannot be fixed yet, with the reason. Findings in
// these files are warnings, not errors. Shrink this list; never grow it without
// a reason a reviewer can check. A listed file that passes is reported so the
// entry gets removed.
export const BASELINE = {
  ".claude/agents/ai-eng-lead.md": "open PRs #167 and #168 change this file",
  ".claude/agents/analytics.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/chief-of-staff.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/compliance-engineer.md": "open PRs #167 and #168 change this file",
  ".claude/agents/content.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/data-architect.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/data-steward.md": "open PRs #167 and #168 change this file",
  ".claude/agents/decision-science.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/design-systems.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/legal.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/marketing.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/mobile.md": "open PR #112 changes this file",
  ".claude/agents/ops.md": "open PR #112 changes this file",
  ".claude/agents/payments.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/principal-architect.md": "open PRs #112, #167 and #168 change this file",
  ".claude/agents/privacy.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/product.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/qa.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/red-team.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/security-architect.md": "open PRs #167 and #168 change this file",
  ".claude/agents/security.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/speech.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/support.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
  ".claude/agents/sync.md": "updated by the H5 charters PR (docs/harness-charters-d100)",
};

const MONTH = "(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*";
const RULES = [
  {
    rule: "price",
    re: /\$\s?\d|\b\d+\.\d{2}\s+(?:a|per|\/)\s*(?:month|year|mo|yr)\b|\b\d+(?:\.\d{2})?\s?(?:USD|dollars)\b/i,
    why: "restated price; prices live in docs/DECISIONS.md (cite the D-id)",
  },
  {
    rule: "date",
    re: new RegExp(`\\b\\d{1,2}\\s+${MONTH}\\b|\\b${MONTH}\\s+\\d{1,2}(?:,\\s*|\\s+)\\d{4}\\b|\\b20\\d\\d-\\d\\d-\\d\\d\\b`),
    why: "restated date; dates live in docs/DECISIONS.md or the plan of record (cite the D-id)",
  },
  {
    rule: "retired",
    re: /latest\s+`?docs\/agents\/BRIEF|BRIEF-\*|\bBRIEF\s+(?:decision|coordination)|\bBrief decision\b/i,
    why: "points at the 3 Oct brief; D-051 onward record its decisions and later D-ids amend them (cite the D-id)",
  },
  {
    rule: "retired",
    re: /approve-migration/,
    why: "the `approve-migration` label is retired (D-117); cite D-117 for the merge rule",
  },
];

const SHINGLE = 8;
const words = (s) => s.toLowerCase().replace(/`/g, "").replace(/[^a-z0-9$.%-]+/g, " ").replace(/(?<!\d)\.|\.(?!\d)/g, " ").split(/\s+/).filter(Boolean);

/** Index rows of docs/DECISIONS.md as [{ id, text }]. */
export function decisionRows(text) {
  const out = [];
  for (const line of String(text ?? "").split("\n")) {
    const m = line.match(/^\|\s*(D-\d{3}(?:\s+to\s+D-\d{3})?)\s*\|\s*([^|]+)\|/);
    if (m) out.push({ id: m[1], text: m[2].trim() });
  }
  return out;
}

function shingleIndex(rows) {
  const index = new Map();
  for (const { id, text } of rows) {
    const w = words(text);
    for (let i = 0; i + SHINGLE <= w.length; i++) {
      const key = w.slice(i, i + SHINGLE).join(" ");
      if (!index.has(key)) index.set(key, id);
    }
  }
  return index;
}

/**
 * Lint one charter's text. Returns [{ line, rule, why, text }].
 * `decisions` is the text of docs/DECISIONS.md (optional: the decision-text rule is skipped without it).
 */
export function lintCharter(text, decisions = "") {
  const findings = [];
  const lines = String(text).split("\n");
  const index = shingleIndex(decisionRows(decisions));
  let inFront = lines[0] === "---";
  lines.forEach((raw, i) => {
    if (i > 0 && inFront && raw === "---") { inFront = false; return; }
    if (inFront && i > 0 && !/^description:/.test(raw)) return;
    for (const r of RULES) if (r.re.test(raw)) findings.push({ line: i + 1, rule: r.rule, why: r.why, text: raw.trim() });
    if (index.size) {
      const w = words(raw);
      for (let j = 0; j + SHINGLE <= w.length; j++) {
        const id = index.get(w.slice(j, j + SHINGLE).join(" "));
        if (id) {
          findings.push({ line: i + 1, rule: "decision-text", why: `copies the words of ${id}; cite ${id} instead`, text: raw.trim() });
          break;
        }
      }
    }
  });
  if (!/docs\/DECISIONS\.md/.test(text)) findings.push({ line: 0, rule: "cite", why: "never names docs/DECISIONS.md; add it under \"You read first\"", text: "" });
  return findings;
}

/** Lint every charter under root. Returns { errors, warnings } as printable strings. */
export function lintCharters(root = DEFAULT_ROOT, { baseline = BASELINE } = {}) {
  const errors = [];
  const warnings = [];
  const dir = join(root, ".claude", "agents");
  if (!existsSync(dir)) return { errors, warnings };
  const decPath = join(root, "docs", "DECISIONS.md");
  const decisions = existsSync(decPath) ? readFileSync(decPath, "utf8") : "";
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".md")).sort()) {
    const rel = `.claude/agents/${f}`;
    const found = lintCharter(readFileSync(join(dir, f), "utf8"), decisions);
    const known = baseline[rel];
    for (const x of found) {
      const msg = `${rel}${x.line ? `:${x.line}` : ""}: charter-lint ${x.rule}: ${x.why}`;
      (known ? warnings : errors).push(known ? `${msg} (baselined: ${known})` : msg);
    }
    if (known && !found.length) warnings.push(`${rel}: passes charter-lint; remove it from BASELINE in scripts/agents/charter-lint.mjs`);
  }
  return { errors, warnings };
}

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (n.endsWith(".md")) out.push(p);
  }
  return out;
}

/** Harness docs that cite `scripts/agents/<name>.mjs` files missing on this branch. */
export function missingScriptCitations(root = DEFAULT_ROOT) {
  const files = [
    ...walk(join(root, "docs", "agents")),
    ...walk(join(root, ".claude", "agents")),
    ...walk(join(root, "agents")),
    ...walk(join(root, "docs", "engineering")).filter((p) => !p.includes(`${join("docs", "engineering", "research")}`)),
  ];
  const errors = [];
  for (const p of files) {
    readFileSync(p, "utf8").split("\n").forEach((line, i) => {
      if (/\(planned\)/i.test(line)) return;
      for (const m of line.matchAll(/scripts\/agents\/([A-Za-z0-9_./-]+\.mjs)\b/g)) {
        if (!existsSync(join(root, "scripts", "agents", m[1]))) {
          errors.push(`${relative(root, p)}:${i + 1}: cites scripts/agents/${m[1]}, which does not exist on this branch (write "(planned)" on the line if it is not built yet)`);
        }
      }
    });
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors, warnings } = lintCharters();
  const cites = missingScriptCitations();
  for (const w of warnings) console.log(`warning: ${w}`);
  for (const e of [...errors, ...cites]) console.log(`error: ${e}`);
  if (errors.length || cites.length) process.exit(1);
  console.log("charters cite decisions; every cited script exists");
}
