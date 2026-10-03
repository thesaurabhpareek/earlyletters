#!/usr/bin/env node
// Runs one agent assignment with OpenCode (MIT) on an open-weight model via
// OpenRouter, with two hard stops the engine itself does not provide:
// a dollar cap per run and a step cap. It writes a result summary in the same
// shape as Claude Code's execution log, so receipts work for both engines.
//
//   node scripts/agents/run-opencode.mjs --agent qa --model openrouter/deepseek/deepseek-v4.1-flash \
//        --budget 2 --max-turns 80 [--variant high] --out "$RUNNER_TEMP/agent-exec.json"
//
// Needs: `opencode` on PATH, OPENROUTER_API_KEY, GH_TOKEN (the agents GitHub App).
import { spawn } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";

/** Permissions: everything an agent needs, minus the actions only the founder takes. */
export function opencodeConfig() {
  const deny = [
    "git push --force*", "git push -f*", "git push origin develop*", "git push origin main*",
    "gh pr merge*", "gh pr close*", "gh pr review*--approve*", "gh issue close*",
    "gh secret*", "gh variable*", "gh repo delete*", "gh repo edit*", "gh api*-X DELETE*", "gh api*--method DELETE*",
  ];
  return {
    $schema: "https://opencode.ai/config.json",
    share: "disabled",
    autoupdate: false,
    provider: { openrouter: { options: { apiKey: "{env:OPENROUTER_API_KEY}" } } },
    permission: {
      edit: "allow",
      webfetch: "allow",
      bash: Object.fromEntries([["*", "allow"], ...deny.map((p) => [p, "deny"])]),
    },
  };
}

/** Fold one JSON event from `opencode run --format json` into the running totals. */
export function tally(totals, event) {
  if (event?.type === "step_finish") {
    const part = event.part ?? event;
    totals.steps += 1;
    if (typeof part.cost === "number") totals.cost += part.cost;
    const t = part.tokens;
    if (t) {
      totals.tokens.input += t.input ?? 0;
      totals.tokens.output += (t.output ?? 0) + (t.reasoning ?? 0);
      totals.tokens.cacheRead += t.cache?.read ?? 0;
    }
  }
  return totals;
}

export function newTotals() {
  return { steps: 0, cost: 0, tokens: { input: 0, output: 0, cacheRead: 0 } };
}

function args() {
  const argv = process.argv.slice(2);
  const opt = (n, d = "") => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d;
  };
  return {
    agent: opt("agent"),
    model: opt("model"),
    budget: Number(opt("budget", "2")),
    maxTurns: Number(opt("max-turns", "80")),
    variant: opt("variant"),
    out: opt("out", join(tmpdir(), "agent-exec.json")),
    prompt: opt("prompt") || `You are the Early Letters agent "${opt("agent")}". Read .agent-run/brief.md now and follow it exactly. It holds your identity, memory, founder instructions, your one assignment for this run, and how to finish.`,
  };
}

async function main() {
  const a = args();
  const cfgPath = join(process.env.RUNNER_TEMP || tmpdir(), "opencode.json");
  writeFileSync(cfgPath, JSON.stringify(opencodeConfig(), null, 2));

  const cmd = ["run", "--format", "json", "--model", a.model, "--auto"];
  if (a.variant) cmd.push("--variant", a.variant);
  cmd.push(a.prompt);

  const started = Date.now();
  const totals = newTotals();
  let subtype = "success";
  const child = spawn("opencode", cmd, {
    env: { ...process.env, OPENCODE_CONFIG: cfgPath },
    stdio: ["ignore", "pipe", "inherit"],
  });

  const stop = (why) => {
    if (subtype === "success") subtype = why;
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 15_000).unref();
  };

  const rl = createInterface({ input: child.stdout });
  rl.on("line", (line) => {
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      return;
    }
    tally(totals, ev);
    // Keep public Actions logs short: step totals and the agent's own text only.
    if (ev.type === "step_finish") console.log(`step ${totals.steps}: $${totals.cost.toFixed(4)} so far`);
    else if (ev.type === "text" && ev.part?.text) console.log(ev.part.text.trim().slice(0, 2000));
    if (totals.cost > a.budget) stop("error_max_budget_usd");
    else if (totals.steps > a.maxTurns) stop("error_max_turns");
    // A paid model that reports no cost would make the cap blind: stop early.
    else if (totals.steps >= 5 && totals.cost === 0 && !a.model.endsWith(":free")) stop("error_cost_not_reported");
  });

  const code = await new Promise((res) => child.on("close", res));
  if (code !== 0 && subtype === "success") subtype = "error_during_execution";

  const result = {
    type: "result",
    engine: "opencode",
    model: a.model,
    subtype,
    total_cost_usd: Number(totals.cost.toFixed(6)),
    num_turns: totals.steps,
    duration_ms: Date.now() - started,
    tokens: totals.tokens,
  };
  mkdirSync(dirname(a.out), { recursive: true });
  writeFileSync(a.out, JSON.stringify([result], null, 2));
  console.log(`run ${subtype}: ${totals.steps} steps, $${totals.cost.toFixed(4)} (cap $${a.budget})`);
  process.exit(subtype === "success" ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
