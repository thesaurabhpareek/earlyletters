#!/usr/bin/env node
// Saves unfinished work after an agent run, whatever stopped it (a spend or
// step cap, a timeout, an error, a provider limit). Anything left uncommitted
// or unpushed goes to a branch on GitHub, and the agent's journal records where,
// so the next run continues from it instead of starting over.
//
//   node scripts/agents/salvage.mjs --agent qa --journal 7 --run-id 123 --reason error_max_budget_usd
//
// Needs GH_TOKEN with push rights (the agent's GitHub App token). Never fails
// the job: if there is nothing to save or no token, it says so and exits 0.
import { execFileSync } from "node:child_process";
import { loadRoster, repoSlug, gh } from "./lib.mjs";

const PROTECTED = new Set(["develop", "main", "HEAD"]);

/**
 * Decide what to do from the working tree's state. Pure, so it can be tested.
 * state: { dirty, branch, unpushed, handle, runId }
 */
export function salvagePlan({ dirty, branch, unpushed, handle, runId }) {
  if (!dirty && !unpushed) return { action: "none" };
  const target = PROTECTED.has(branch) || !branch ? `agent/${handle}/wip-${runId}` : branch;
  return { action: "save", branch: target, commit: dirty, newBranch: target !== branch };
}

function git(args, opts = {}) {
  return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}

function tryGit(args) {
  try {
    return git(args);
  } catch {
    return null;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (n, d = "") => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d;
  };
  const handle = opt("agent");
  const journal = opt("journal");
  const runId = opt("run-id", process.env.GITHUB_RUN_ID ?? "local");
  const reason = opt("reason", "stopped");

  if (!process.env.GH_TOKEN) {
    console.log("salvage: no GitHub token for this run, nothing pushed");
    process.exit(0);
  }

  const dirty = (tryGit(["status", "--porcelain", "--", ".", ":(exclude).agent-run"]) ?? "") !== "";
  const branch = tryGit(["rev-parse", "--abbrev-ref", "HEAD"]) ?? "HEAD";
  let unpushed = 0;
  if (tryGit(["rev-parse", "--abbrev-ref", "@{u}"])) {
    unpushed = Number(tryGit(["rev-list", "--count", "@{u}..HEAD"]) ?? 0);
  } else if (!PROTECTED.has(branch)) {
    unpushed = Number(tryGit(["rev-list", "--count", "origin/develop..HEAD"]) ?? 0);
  }

  const plan = salvagePlan({ dirty, branch, unpushed: unpushed > 0, handle, runId });
  if (plan.action === "none") {
    console.log("salvage: nothing unsaved");
    process.exit(0);
  }

  try {
    tryGit(["config", "--unset-all", "http.https://github.com/.extraheader"]);
    execFileSync("gh", ["auth", "setup-git"], { stdio: "inherit" });
    if (plan.newBranch) git(["checkout", "-b", plan.branch]);
    if (plan.commit) {
      git(["add", "-A", "--", ".", ":(exclude).agent-run"]);
      git(["commit", "-m", `WIP: ${handle} run ${runId} stopped (${reason})\n\nSaved automatically so the next run can continue.\n\nAgent: ${handle}`]);
    }
    git(["push", "-u", "origin", plan.branch]);
  } catch (err) {
    console.log(`salvage: could not save (${(err.stderr || err.message || "").toString().trim()})`);
    process.exit(0);
  }

  const roster = loadRoster();
  const repo = repoSlug(roster);
  const url = `https://github.com/${repo}/tree/${plan.branch}`;
  const body = [
    `<!-- journal run:${runId} agent:${handle} salvage -->`,
    `**Mode:** run stopped early (${reason}).`,
    `**Did:** unfinished work saved automatically to [\`${plan.branch}\`](${url}).`,
    "**Next:** continue from that branch before starting anything new.",
  ].join("\n");
  if (journal) gh(`/repos/${repo}/issues/${journal}/comments`, { method: "POST", body: { body }, allowFail: true });
  console.log(`salvage: saved to ${plan.branch}`);
}
