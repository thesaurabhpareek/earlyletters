#!/usr/bin/env node
// Checks that the agent team is consistent: every roster agent has a charter
// and a memory file, charters match the roster, and every backlog owner role
// maps to an agent. Runs in CI (.github/workflows/agents-check.yml).
//
//   node scripts/agents/check.mjs
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadRoster, ownerMap, parseBacklog, readText } from "./lib.mjs";

const CLAUDE_MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-4-5-20251001"]);
const OPENCODE_MODEL = /^openrouter\/[a-z0-9~-]+\/[a-z0-9.:-]+$/;
const KINDS = new Set(["worker", "reviewer", "planner", "digest", "steward"]);

export function check(root = ROOT) {
  const errors = [];
  const warnings = [];
  const roster = loadRoster(root);
  const seen = new Set();

  for (const a of roster.agents) {
    const where = `agent "${a.handle}"`;
    if (!/^[a-z][a-z0-9-]{1,30}$/.test(a.handle)) errors.push(`${where}: handle must be lowercase letters, digits and dashes`);
    if (seen.has(a.handle)) errors.push(`${where}: duplicate handle`);
    seen.add(a.handle);
    if (!roster.departments?.[a.department]) errors.push(`${where}: department "${a.department}" is not in roster.departments`);
    if (!roster.engines?.[a.engine]) errors.push(`${where}: engine "${a.engine}" is not defined in roster.engines`);
    else if (a.engine === "claude-code" && !CLAUDE_MODELS.has(a.model)) errors.push(`${where}: model "${a.model}" is not one of ${[...CLAUDE_MODELS].join(", ")}`);
    else if (a.engine === "opencode" && !OPENCODE_MODEL.test(a.model ?? "")) errors.push(`${where}: OpenCode model "${a.model}" must look like openrouter/<maker>/<model>`);
    if (!KINDS.has(a.kind)) errors.push(`${where}: kind "${a.kind}" is not one of ${[...KINDS].join(", ")}`);
    for (const k of ["daily_runs", "wip_limit", "max_turns", "timeout_minutes"]) {
      if (!Number.isInteger(a[k]) || a[k] < 0) errors.push(`${where}: ${k} must be a whole number`);
    }
    if (!(typeof a.max_budget_usd === "number" && a.max_budget_usd > 0)) errors.push(`${where}: max_budget_usd must be a positive number (set it on the agent or as the engine default)`);
    if (a.effort && !["low", "medium", "high", "xhigh", "max"].includes(a.effort)) errors.push(`${where}: effort "${a.effort}" is not low, medium, high, xhigh or max`);
    if (a.kind === "steward") {
      if (!Array.isArray(a.review_paths) || !a.review_paths.length || !a.review_paths.every((g) => typeof g === "string" && g && !g.startsWith("/"))) {
        errors.push(`${where}: a steward needs review_paths, a non-empty list of repo-relative globs`);
      }
    } else if (a.review_paths) {
      warnings.push(`${where}: review_paths is only used for kind "steward"`);
    }
    if (a.timeout_minutes > 350) errors.push(`${where}: timeout_minutes must stay under the 6-hour job limit`);

    const charterPath = join(root, ".claude", "agents", `${a.handle}.md`);
    if (!existsSync(charterPath)) {
      errors.push(`${where}: missing charter .claude/agents/${a.handle}.md`);
    } else {
      const fm = frontmatter(readFileSync(charterPath, "utf8"));
      if (fm.name !== a.handle) errors.push(`${where}: charter frontmatter name is "${fm.name}"`);
      if (!fm.description) errors.push(`${where}: charter has no description`);
      else if (fm.description.length > 200) warnings.push(`${where}: charter description is ${fm.description.length} characters; keep it under 200 to save context`);
      if (fm.model && fm.model !== "inherit") {
        errors.push(`${where}: charter model must be "inherit"; the roster chooses the model for automated runs`);
      }
    }
    const memPath = join(root, "agents", a.handle, "MEMORY.md");
    if (!existsSync(memPath)) errors.push(`${where}: missing agents/${a.handle}/MEMORY.md`);
    else {
      const n = readFileSync(memPath, "utf8").split("\n").length;
      if (n > 150) warnings.push(`${where}: MEMORY.md is ${n} lines; the limit is 120`);
    }
  }

  if (roster.trusted_bots && !(Array.isArray(roster.trusted_bots) && roster.trusted_bots.every((b) => /\[bot\]$/.test(b)))) {
    errors.push("trusted_bots must be a list of bot logins ending in [bot]");
  }

  // Engineering chapters name an owner; it must be an agent on the roster.
  const engDir = join(root, "docs", "engineering");
  if (existsSync(engDir)) {
    for (const f of readdirSync(engDir).filter((n) => /^\d\d-.*\.md$/.test(n))) {
      const owner = frontmatter(readFileSync(join(engDir, f), "utf8")).owner;
      if (!owner) errors.push(`docs/engineering/${f}: frontmatter has no owner`);
      else if (!seen.has(owner)) errors.push(`docs/engineering/${f}: owner "${owner}" is not an agent on the roster`);
    }
  }

  const owners = ownerMap(roster);
  const tasks = parseBacklog(readText(join(root, "docs", "BACKLOG.md")));
  const unknown = new Set();
  for (const t of tasks) {
    for (const o of t.owners ?? []) if (o !== "founder" && !owners.has(o)) unknown.add(o);
  }
  for (const o of unknown) warnings.push(`backlog owner "${o}" maps to no agent; add it to an agent's backlog_owner_names`);

  const daily = roster.agents.reduce((s, a) => s + a.daily_runs, 0);
  const cap = roster.limits.max_runs_per_day_total;
  return { errors, warnings, summary: { agents: roster.agents.length, tasks: tasks.length, dailyRunsSum: daily, cap } };
}

function frontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const out = {};
  if (!m) return out;
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (kv) out[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors, warnings, summary } = check();
  for (const w of warnings) console.log(`warning: ${w}`);
  for (const e of errors) console.log(`error: ${e}`);
  console.log(`${summary.agents} agents, ${summary.tasks} backlog tasks, daily runs ${summary.dailyRunsSum} requested against a cap of ${summary.cap}.`);
  if (errors.length) process.exit(1);
  console.log("agent team is consistent");
}
