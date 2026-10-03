#!/usr/bin/env node
// Posts the run receipt on the agent's journal after every run, whatever
// happened: mode, outcome, turns, minutes and estimated cost, plus a note if
// the agent did not write its own journal entry. The dispatcher sums these
// receipts into "Estimated spend today" on the board.
//
//   node scripts/agents/receipt.mjs --agent mobile --journal 12 --mode task \
//        --task BL-121 --outcome success --execution-file <path> --run-url <url>
import { existsSync, readFileSync, appendFileSync } from "node:fs";
import { loadRoster, repoSlug, gh, ghAll } from "./lib.mjs";

const argv = process.argv.slice(2);
const opt = (n, d = "") => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d;
};
const handle = opt("agent");
const journal = opt("journal");
const runId = opt("run-id", process.env.GITHUB_RUN_ID ?? "local");
const runUrl = opt("run-url");
const target = [opt("mode"), opt("task"), opt("pr") ? `#${opt("pr")}` : ""].filter(Boolean).join(" ");

/** Pull cost, turns and duration out of the Claude Code execution log. */
export function summarize(path) {
  if (!path || !existsSync(path)) return {};
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
  const list = Array.isArray(data) ? data : [data];
  const result = [...list].reverse().find((m) => m?.type === "result") ?? {};
  return {
    model: result.model,
    cost: typeof result.total_cost_usd === "number" ? result.total_cost_usd : undefined,
    turns: result.num_turns,
    minutes: typeof result.duration_ms === "number" ? Math.round(result.duration_ms / 60000) : undefined,
    subtype: result.subtype,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const roster = loadRoster();
  const repo = repoSlug(roster);
  const s = summarize(opt("execution-file"));
  const outcome = opt("outcome", "unknown");
  // "unknown" (not 0) when the engine reported no cost, so the board never
  // shows an interactive or failed run as free.
  const cost = s.cost !== undefined ? s.cost.toFixed(4) : "unknown";

  let wroteEntry = false;
  if (journal) {
    const comments = ghAll(`/repos/${repo}/issues/${journal}/comments`, { allowFail: true });
    wroteEntry = comments.some((c) => (c.body ?? "").includes(`<!-- journal run:${runId} agent:${handle}`));
  }
  const parts = [
    `<!-- receipt run:${runId} agent:${handle} cost:${cost} -->`,
    `Run receipt: ${target || "run"}${s.model ? ` on ${s.model.replace(/^openrouter\//, "")}` : ""}, ${outcome}${s.subtype && s.subtype !== "success" ? ` (${s.subtype})` : ""}.`,
    [s.turns !== undefined ? `${s.turns} turns` : null, s.minutes !== undefined ? `${s.minutes} min` : null,
      s.cost !== undefined ? `$${s.cost.toFixed(2)} estimated` : "cost not reported"].filter(Boolean).join(", ") + ".",
    runUrl ? `[Run log](${runUrl}).` : "",
    wroteEntry ? "" : "\n**No journal entry was written this run.** The next run of this agent should check what happened before starting new work.",
  ].filter(Boolean);
  const body = parts.join(" ").replace(" \n", "\n");

  if (journal) gh(`/repos/${repo}/issues/${journal}/comments`, { method: "POST", body: { body }, allowFail: true });
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${body}\n`);
  console.log(body);
}
