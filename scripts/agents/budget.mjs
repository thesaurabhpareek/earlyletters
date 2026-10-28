#!/usr/bin/env node
// Usage budget across lanes (retro H3, AIE-R28, RC7). One budget, so no
// scheduled lane can use the share kept for interactive build work.
// Design and wiring: docs/agents/BUDGET.md. Config: agents/budget.json.
//
// Consumption comes only from run receipts (scripts/agents/receipt.mjs), parsed
// with ledger.mjs, so the marker format lives in one place:
//   <!-- receipt run:<run id> agent:<handle> cost:<usd>|unknown -->
// A receipt names a run, not a lane, so the lane comes from the run id
// (laneOfRun): all digits is a GitHub Actions run (lane `actions`), `local` or
// `local-<n>` is the dispatcher's local default (lane `local`),
// `sched-<YYYYMMDDHHMM>` is the 4-hourly scheduled lane (lane `sched-4h`),
// `sched-prd-<YYYYMMDD>` is the daily PRD run (lane `prd-daily`),
// `sched-<YYYYMMDD>` is the daily docs run (lane `docs-daily`), and
// `<lane>~<anything>` names its lane. Anything else is "unattributed": it counts
// against the shared pool but against no single lane.
//
// Unknown cost is over budget: a lane with any receipt today whose cost is
// unknown may not run again today, and neither may any scheduled lane while
// the pool holds such a receipt. The budget cannot see what it cannot measure,
// so it fails closed.
//
// Pure functions take the config, the usage and `now`; only main() and
// blockedReason() read GitHub, and they only read (GET).
//
//   node scripts/agents/budget.mjs --check                 # validate agents/budget.json, no network
//   node scripts/agents/budget.mjs --lane local            # may this lane run now? exit 0 yes, 3 no
//   node scripts/agents/budget.mjs --lane local --json     # the same, as JSON with usage
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadRoster, repoSlug, ghAll, trustContext, todayUTC } from "./lib.mjs";
import { ledgerRow } from "./ledger.mjs";

export const BUDGET_FILE = join("agents", "budget.json");
export const UNATTRIBUTED = "unattributed";
const LANE_NAME = /^[A-Za-z0-9._-]{1,40}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function loadBudget(root = ROOT) {
  return JSON.parse(readFileSync(join(root, BUDGET_FILE), "utf8"));
}

const isCap = (v) => typeof v === "number" && Number.isFinite(v) && v >= 0;
const isShare = (v) => typeof v === "number" && v >= 0 && v <= 1;

/** Problems with a budget config ([] when valid). Pure. */
export function validateBudget(cfg) {
  const errors = [];
  if (!cfg || typeof cfg !== "object") return ["budget must be a JSON object"];
  if (cfg.version !== 1) errors.push("version must be 1");
  const t = cfg.daily_total ?? {};
  if (!(Number.isInteger(t.runs) && t.runs >= 0)) errors.push("daily_total.runs must be a whole number");
  if (!(typeof t.cost_usd === "number" && t.cost_usd >= 0)) errors.push("daily_total.cost_usd must be a number");
  if (!isShare(cfg.reserved_interactive_share)) errors.push("reserved_interactive_share must be between 0 and 1");
  const lanes = cfg.lanes ?? {};
  if (!Object.keys(lanes).length) errors.push("lanes must name at least one lane");
  for (const [name, l] of Object.entries(lanes)) {
    if (!LANE_NAME.test(name) || name === UNATTRIBUTED) errors.push(`lane "${name}": name must be [A-Za-z0-9._-], at most 40 characters, and not "${UNATTRIBUTED}"`);
    if (l.interactive === true) continue;
    if (!(Number.isInteger(l.runs) && l.runs >= 0)) errors.push(`lane "${name}": runs must be a whole number`);
    if (!(typeof l.cost_usd === "number" && l.cost_usd >= 0)) errors.push(`lane "${name}": cost_usd must be a number`);
  }
  for (const [pname, p] of Object.entries(cfg.profiles ?? {})) {
    if (p.reserved_interactive_share !== undefined && !isShare(p.reserved_interactive_share)) errors.push(`profile "${pname}": reserved_interactive_share must be between 0 and 1`);
    for (const [name, l] of Object.entries(p.lanes ?? {})) {
      if (!lanes[name]) errors.push(`profile "${pname}": lane "${name}" is not in lanes`);
      if (l.runs !== undefined && !(Number.isInteger(l.runs) && l.runs >= 0)) errors.push(`profile "${pname}" lane "${name}": runs must be a whole number`);
      if (l.cost_usd !== undefined && !isCap(l.cost_usd)) errors.push(`profile "${pname}" lane "${name}": cost_usd must be a number`);
    }
  }
  for (const [i, w] of (cfg.profile_windows ?? []).entries()) {
    const where = `profile_windows[${i}]`;
    if (!cfg.profiles?.[w.profile]) errors.push(`${where}: profile "${w.profile}" is not in profiles`);
    if (!DATE.test(String(w.from)) || !DATE.test(String(w.until))) errors.push(`${where}: from and until must be YYYY-MM-DD`);
    else if (!(w.from < w.until)) errors.push(`${where}: from must be before until`);
    if (!String(w.reason ?? "").trim()) errors.push(`${where}: reason is required`);
    if (!/^D-\d{3,}$/.test(String(w.decided_by ?? ""))) errors.push(`${where}: decided_by must be a D-id`);
  }
  return errors;
}

/** The profile in force at `now`: the first window with from <= now < until (00:00 UTC), else "normal". */
export function activeProfile(cfg, now) {
  const t = new Date(now).getTime();
  for (const w of cfg.profile_windows ?? []) {
    const from = Date.parse(`${w.from}T00:00:00Z`);
    const until = Date.parse(`${w.until}T00:00:00Z`);
    if (cfg.profiles?.[w.profile] && t >= from && t < until) return { name: w.profile, window: w };
  }
  return { name: "normal", window: null };
}

/** The config with the active (or named) profile applied. Pure. */
export function effective(cfg, now, profileName) {
  const prof = profileName
    ? { name: profileName, window: null }
    : activeProfile(cfg, now);
  const p = prof.name === "normal" ? {} : cfg.profiles?.[prof.name];
  if (!p) throw new Error(`budget profile "${prof.name}" is not in agents/budget.json`);
  const lanes = {};
  for (const [name, l] of Object.entries(cfg.lanes)) lanes[name] = { ...l, ...(p.lanes?.[name] ?? {}) };
  const share = p.reserved_interactive_share ?? cfg.reserved_interactive_share;
  const total = cfg.daily_total;
  return {
    profile: prof.name,
    window: prof.window,
    share,
    total,
    // What all scheduled (non-interactive) lanes may use together.
    // Rounded to 6 places before flooring: 1 - 0.8 is 0.19999999999999996 in floating point.
    pool: { runs: Math.floor(Math.round(total.runs * (1 - share) * 1e6) / 1e6), cost_usd: Math.round(total.cost_usd * (1 - share) * 100) / 100 },
    lanes,
  };
}

/** Which lane a receipt's run id belongs to. Pure. */
export function laneOfRun(runId, cfg) {
  const id = String(runId ?? "");
  const lanes = cfg.lanes ?? {};
  const named = id.match(/^([A-Za-z0-9._-]{1,40})~/);
  if (named) return lanes[named[1]] ? named[1] : UNATTRIBUTED;
  if (/^\d+$/.test(id) && lanes.actions) return "actions";
  if (/^local(-\d+)?$/.test(id) && lanes.local) return "local";
  // Scheduled prompts (PR #328, docs/agents/lanes/*.prompt.md): the 4-hourly lane stamps
  // sched-<UTC YYYYMMDDHHMM> and sets AGENTS_LANE=sched-4h; the docs run stamps sched-<UTC YYYYMMDD>;
  // the PRD run stamps sched-prd-<UTC YYYYMMDD> (checked first, before the generic sched- shapes).
  if (/^sched-prd-\d{8}$/.test(id)) return lanes["prd-daily"] ? "prd-daily" : UNATTRIBUTED;
  if (/^sched-\d{12}$/.test(id) && lanes["sched-4h"]) return "sched-4h";
  if (/^sched-\d{8}$/.test(id) && lanes["docs-daily"]) return "docs-daily";
  return UNATTRIBUTED;
}

const blank = () => ({ runs: 0, cost_usd: 0, unknown: 0 });
const add = (u, cost) => {
  u.runs++;
  if (cost === undefined) u.unknown++;
  else u.cost_usd = Math.round((u.cost_usd + cost) * 1e4) / 1e4;
};

/**
 * Usage per lane on `day` (YYYY-MM-DD, UTC) from ledger receipt rows
 * ({ kind: "receipt", run, at, cost_usd }). cost_usd undefined means unknown.
 * Each run id counts once. `scheduled` sums every non-interactive lane plus
 * unattributed receipts; `all` sums everything. Pure.
 */
export function usageFromRows(rows, cfg, day) {
  const lanes = {};
  const scheduled = blank();
  const all = blank();
  const seen = new Set();
  for (const r of rows ?? []) {
    if (r?.kind !== "receipt" || !String(r.at ?? "").startsWith(day)) continue;
    const key = `${r.run} ${r.agent}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const lane = laneOfRun(r.run, cfg);
    add((lanes[lane] ??= blank()), r.cost_usd);
    add(all, r.cost_usd);
    if (!cfg.lanes?.[lane]?.interactive) add(scheduled, r.cost_usd);
  }
  return { day, lanes, scheduled, all };
}

/**
 * Usage from raw issue comments, trusted receipts only (ledger.mjs rules: the
 * founder, trusted bots, and github-actions[bot] for receipts). Older receipts
 * that wrote 0.0000 with "cost not reported" count as unknown, as on the board.
 */
export function usageFromComments(comments, trust, cfg, day) {
  const rows = [];
  for (const c of comments ?? []) {
    const row = ledgerRow(c, trust, "comment");
    if (row?.kind !== "receipt") continue;
    if (/cost not reported/.test(c.body ?? "")) row.cost_usd = undefined;
    rows.push(row);
  }
  return usageFromRows(rows, cfg, day);
}

const money = (n) => `$${n.toFixed(2)}`;

/**
 * May `lane` start one more run now? Pure.
 *   opts = { config, usage, now, profile?, pending? }
 * `pending` is { runs, cost_usd } already approved this tick but not yet
 * receipted (the run counts; its cost is not known yet, so 0 is added).
 * Returns { ok, lane, profile, reason, remaining }.
 */
export function canRun(lane, { config, usage, now, profile, pending } = {}) {
  const eff = effective(config, now, profile);
  const out = (ok, reason, remaining = null) => ({ ok, lane, profile: eff.profile, reason, remaining });
  const l = eff.lanes[lane];
  if (!l) return out(false, `lane "${lane}" is not in agents/budget.json, so it has no budget`);
  if (l.interactive) {
    return out(true, `interactive lane: never blocked; scheduled lanes yield ${Math.round(eff.share * 100)}% of the daily total to it`);
  }
  const p = { runs: pending?.runs ?? 0, cost_usd: pending?.cost_usd ?? 0 };
  const mine = usage?.lanes?.[lane] ?? blank();
  const sched = usage?.scheduled ?? blank();
  const all = usage?.all ?? blank();
  const tag = eff.profile === "normal" ? "" : ` (${eff.profile} profile)`;

  if (mine.unknown) return out(false, `lane ${lane}: ${mine.unknown} run(s) today with unknown cost; unknown cost counts as over budget`);
  if (sched.unknown) return out(false, `scheduled pool: ${sched.unknown} run(s) today with unknown cost; unknown cost counts as over budget`);
  if (mine.runs + p.runs >= l.runs) return out(false, `lane ${lane}: ${mine.runs + p.runs} of ${l.runs} runs used today${tag}`);
  if (mine.cost_usd + p.cost_usd >= l.cost_usd) return out(false, `lane ${lane}: ${money(mine.cost_usd + p.cost_usd)} of ${money(l.cost_usd)} spent today${tag}`);
  if (sched.runs + p.runs >= eff.pool.runs) return out(false, `scheduled lanes: ${sched.runs + p.runs} of ${eff.pool.runs} runs used today; the other ${Math.round(eff.share * 100)}% is kept for interactive build work${tag}`);
  if (sched.cost_usd + p.cost_usd >= eff.pool.cost_usd) return out(false, `scheduled lanes: ${money(sched.cost_usd + p.cost_usd)} of ${money(eff.pool.cost_usd)} spent today; the rest is kept for interactive build work${tag}`);
  // Interactive work may run past its share; when the day's total is used, scheduled lanes yield.
  if (all.unknown) return out(false, `daily total: ${all.unknown} run(s) today with unknown cost; unknown cost counts as over budget`);
  if (all.runs + p.runs >= eff.total.runs) return out(false, `daily total: ${all.runs + p.runs} of ${eff.total.runs} runs used today, interactive work included${tag}`);
  if (all.cost_usd + p.cost_usd >= eff.total.cost_usd) return out(false, `daily total: ${money(all.cost_usd + p.cost_usd)} of ${money(eff.total.cost_usd)} spent today, interactive work included${tag}`);
  return out(true, "within budget", {
    runs: Math.min(l.runs - mine.runs, eff.pool.runs - sched.runs, eff.total.runs - all.runs) - p.runs,
    cost_usd: Math.round(Math.min(l.cost_usd - mine.cost_usd, eff.pool.cost_usd - sched.cost_usd, eff.total.cost_usd - all.cost_usd) * 100) / 100 - p.cost_usd,
  });
}

// ---------- dispatcher hook (same contract as pause.blockedReason) ----------
//   ctx = { state, now, runId, LOCAL, env, roster, repo, ghAll }
// Wire it as the last check before an assignment, so "" means the run is
// assigned; this module then counts it as pending for the rest of the tick.

const tick = { key: "", usage: null, pending: {} };

/** Why this lane may not take this work now, or "" when it may. Reads receipts once per tick. */
export function blockedReason(ctx, agent, work, { config, laneOf } = {}) {
  if (!agent || !work) return "";
  let cfg;
  try {
    cfg = config ?? loadBudget();
  } catch (e) {
    return `budget: agents/budget.json unreadable (${e.message}); no run until it parses`;
  }
  const errors = validateBudget(cfg);
  if (errors.length) return `budget: agents/budget.json invalid (${errors[0]})`;
  const lane = laneOf ? laneOf(ctx) : laneFromCtx(ctx);
  const day = todayUTC(new Date(ctx.now));
  const key = `${ctx.repo} ${day} ${ctx.runId}`;
  if (tick.key !== key) {
    const comments = ctx.ghAll(`/repos/${ctx.repo}/issues/comments?since=${day}T00:00:00Z&sort=created`, { allowFail: true }) ?? [];
    tick.key = key;
    tick.usage = usageFromComments(comments, trustContext(ctx.roster ?? {}, ctx.env ?? {}), cfg, day);
    tick.pending = {};
  }
  const verdict = canRun(lane, { config: cfg, usage: tick.usage, now: ctx.now, pending: { runs: tick.pending[lane] ?? 0 } });
  if (!verdict.ok) return `budget: ${verdict.reason}`;
  tick.pending[lane] = (tick.pending[lane] ?? 0) + 1;
  return "";
}

/** Same rule as lane.mjs laneName, without importing the board module. */
function laneFromCtx(ctx) {
  if (!ctx.LOCAL) return "actions";
  const raw = String(ctx.env?.AGENTS_LANE ?? "").trim();
  return raw.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "local";
}

/** Test hook: forget the per-tick cache. */
export function _resetTick() {
  tick.key = "";
  tick.usage = null;
  tick.pending = {};
}

// ---------- CLI (read-only) ----------

function main() {
  const argv = process.argv.slice(2);
  const opt = (n, d = "") => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d;
  };
  const cfg = loadBudget();
  const errors = validateBudget(cfg);
  for (const e of errors) console.log(`error: ${e}`);
  if (errors.length) process.exit(1);
  if (argv.includes("--check")) {
    const eff = effective(cfg, new Date());
    console.log(`budget is valid; profile ${eff.profile}; scheduled pool ${eff.pool.runs} runs and ${money(eff.pool.cost_usd)} a day of ${eff.total.runs} runs and ${money(eff.total.cost_usd)}`);
    return;
  }
  const lane = opt("lane");
  if (!lane) {
    console.log("usage: budget.mjs --check | --lane <name> [--json] [--profile <name>]");
    process.exit(2);
  }
  const roster = loadRoster();
  const repo = repoSlug(roster);
  const now = new Date();
  const day = todayUTC(now);
  const comments = ghAll(`/repos/${repo}/issues/comments?since=${day}T00:00:00Z&sort=created`, { allowFail: true }) ?? [];
  const usage = usageFromComments(comments, trustContext(roster, process.env), cfg, day);
  const verdict = canRun(lane, { config: cfg, usage, now, profile: opt("profile") || undefined });
  if (argv.includes("--json")) console.log(JSON.stringify({ ...verdict, usage }, null, 2));
  else console.log(`${verdict.ok ? "may run" : "may not run"}: ${verdict.reason}`);
  process.exit(verdict.ok ? 0 : 3);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
