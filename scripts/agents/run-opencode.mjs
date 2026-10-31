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

/**
 * Bash rules, in order. opencode takes the LAST rule that matches (verified against opencode 1.18.34
 * by Review B on 25 commands; the offline matcher in opencode-matcher.mjs models it).
 *
 * Order: the catch-all allow, then every deny, then a few narrow allows for the comment commands
 * the brief tells the agent to run (file names such as `closed.md` would otherwise trip the broad
 * `gh*issue*close*` deny; a body file under .agent-run/ or /tmp/, tripwire wording: this holds for a single body flag only), then read allows (`--json`, `--search`, `--label` on pr/issue
 * view and list, so mergeStateStatus or `--label release` run), then re-denies for anything that could ride along on those allows.
 *
 * TRIPWIRE, NOT A BOUNDARY. Globs cannot close quoting (`g"i"t push` still gets through), spacing
 * tricks outside the ones listed, variables, command substitution, `sh -c`, a script the model wrote,
 * odd-case verbs such as `-XpAtCh` (upper, lower and Capitalised verbs ARE denied), or `curl`, `wget`, `printenv` and
 * `/proc/self/environ`. The gh and git patterns are anchored at the start of a command, so they catch only the bare form: `env gh`,
 * `FOO=1 gh`, `command gh`, `exec`, `nohup`, `timeout`, `eval`, `xargs`, `sh -c`, `\gh` and `/usr/bin/gh` are NOT caught and are not chased.
 * The engine matches shell-grammar command nodes (separators | ; & && || newline outside quotes; $( ), backticks, ( ) and { } as
 * separate commands; quotes are not split), so a re-deny containing a separator never fires. The round 8 patterns were ENGINE-VERIFIED on
 * opencode 1.18.34 for the cases the red team ran (see integration-notes.md, "Round 9 additions"). The
 * real controls live elsewhere: withholding GH_TOKEN and OPENROUTER_API_KEY from the model step,
 * branch protection on develop and main, a separate write job that does the push (H15), and
 * locked journal issues. See docs/agents/hardening/integration-notes.md. Do not rely on this list.
 *
 * Whitespace (round 7): the engine ran `gh pr  merge` (two spaces) and it was NOT denied, so the gh
 * denies use `*` between words, which crosses spaces and tabs. The cost is over-blocking: any command
 * line that has these words in this order is denied, even inside a quoted title. That is accepted.
 *
 * Push: the model does not push at all and there is no allow rule for it. The deny is anchored to
 * command position (`git push*`, `git -C x push`, `git  push`) and to the places a command can start
 * (after `&&`, `;`, `|`, `$(`, a backtick, a newline, an env prefix, `env`, `sh -c`), so that
 * `git commit -m 'push notes'` and `gh pr create --title "git push guard"` are no longer denied.
 */
const SMUGGLE = ["$", "`", ";", "&", "|", ">", "<", "\n", "(", "{"];
const SENSITIVE = ["/proc/", "environ", "hosts.yml", ".ssh", "/etc/", "id_rsa", ".netrc", ".config/gh", ".git/config", ".env"];
const WRAPPERS = ["env", "exec", "command", "sudo", "xargs", "nohup", "time", "timeout", "nice", "stdbuf", "setsid", "eval", "sh", "bash", "zsh", "dash"];

const QUOTE_FORMS = ["-X", "--method"].flatMap((f) => [" ", "  ", "=", ""].flatMap((sep) => ['"', "'"].map((q) => `gh*api*${f}${sep}${q}*`)));

/** gh api with a write verb: any text between the flag and the verb (spaces, tabs, `=`), upper, lower or capitalised verb. */
export function ghApiWritePatterns() {
  const out = [];
  for (const verb of ["DELETE", "PUT", "PATCH", "POST"]) {
    for (const v of new Set([verb, verb.toLowerCase(), verb[0] + verb.slice(1).toLowerCase()])) {
      out.push(`gh*api*-X*${v}*`, `gh*api*--method*${v}*`);
    }
  }
  return out;
}

/** The git rules. Exported so the contract test can exclude exactly these (and nothing else that mentions push). */
export const GIT_DENY = [
  // exact legacy forms (lib.test.mjs asserts them)
  "git push --force*", "git push -f*", "git push origin develop*", "git push origin main*",
  // git push, anchored to command position (not "any command that mentions push"), in any spacing:
  "git push*", "git  *push*", "git\t*push*",
  "git -*push*", "git*-C*push*",               // global options before the subcommand
  "git send-pack*", "git  *send-pack*", "git\t*send-pack*", "git -*send-pack*",
  // push after something else: a chain, a substitution, a subshell, a new line, an env prefix, a wrapper
  "*&&*git*push*", "*&*git*push*", "*;*git*push*", "*|*git*push*", "*(*git*push*", "*`*git*push*", "*{*git*push*", "*\ngit*push*", "*=* git*push*",
  ...WRAPPERS.map((w) => `${w} *git*push*`),
  // git config injection (`git -c k=v ...`, `git --no-pager -c k=v ...`)
  "git -c*", "git  *-c*", "git\t*-c*", "git*-c *=*", "git*-c\t*=*",
];

const GH_DENY = [
  "gh pr merge*", "gh secret*",
  // merges, closes, approvals, edits (any spacing; also with `gh -R owner/repo` before the subcommand)
  "gh*pr*merge*", "gh*pr*close*", "gh*pr*review*", "gh*pr*edit*", "gh*pr*ready*", "gh*pr*--admin*", "gh*pr*reopen*", "gh*pr*update-branch*",
  "gh*issue*close*", "gh*issue*edit*", "gh*issue*delete*", "gh*issue*transfer*", "gh*issue*lock*", "gh*issue*reopen*",
  // secrets, settings, repo admin, workflow control, egress through gh
  "gh*secret*", "gh*variable*", "gh*repo*delete*", "gh*repo*edit*", "gh*repo*archive*", "gh*repo*create*", "gh*repo*rename*", "gh*repo*sync*", "gh*ruleset*",
  "gh auth*", "gh  *auth*", "gh\t*auth*", "gh \t*auth*",
  "gh alias*", "gh  *alias*", "gh\t*alias*", "gh \t*alias*",
  "gh*extension*", "gh ext*", "gh  ext*", "gh\text*", "gh*config*set*", "gh*ssh-key*", "gh*gpg-key*",
  "gh*label*delete*", "gh*run*delete*", "gh*cache*delete*",
  // a body file on a comment or review is denied unless an allow below rescues its path
  "gh issue comment*--body-file*", "gh pr comment*--body-file*", "gh pr review*--body-file*",
  "gh*workflow*run*", "gh*workflow*enable*", "gh*workflow*disable*", "gh*run*rerun*", "gh*run*cancel*",
  "gh*release*", "gh*gist*",
  // gh api writes: explicit verbs, quoted spellings, implicit POST (field flags, also after a tab), graphql, sensitive paths
  ...ghApiWritePatterns(), ...QUOTE_FORMS,
  "gh*api* -f*", "gh*api*\t-f*", "gh*api* -F*", "gh*api*\t-F*", "gh*api*--field*", "gh*api*--raw-field*", "gh*api*--input*",
  // anchored so a comment body that mentions graphql is not blocked (W2 suggestion; not run live)
  "gh api*graphql*", "gh*-R*api*graphql*", "gh*--repo*api*graphql*", "gh  *api*graphql*", "gh\t*api*graphql*",
  "gh*api*protection*", "gh*api*rulesets*", "gh*api*/actions/secrets*", "gh*api*/actions/variables*",
  "gh*api*/actions/runners*", "gh*api*/hooks*", "gh*api*/keys*", "gh*api*/collaborators*",
  "gh*api*/merges*", "gh*api*/git/refs*", "gh*api*/pulls/*/merge*", "gh*api*/settings*",
];

// `time <anything>` runs on the engine without matching any gh or git pattern (the node text starts with "time"), so it is denied.
// Agents never need it. (`time -p git push` is also denied by GIT_DENY's wrapper rule.)
const TIME_DENY = ["time *", "time\t*"];

const DENY_BEFORE_GIT = [...TIME_DENY, ...GH_DENY, ...GIT_DENY];

// Narrow allows, after the denies. A plain path under .agent-run/ or /tmp/ is rescued (for a single body flag only: a tripwire, not a
// guarantee about the path; real gh uses the LAST body flag, so two are denied); a relative path such as
// `closed.md` stays over-blocked. Glob characters (* and ?) in a path cannot be denied by a glob rule: stated in the notes.
const COMMENT_HEADS = ["gh issue comment", "gh pr comment", "gh pr review"];
const BODY_PREFIXES = [".agent-run/", "/tmp/"];
const BODY_FLAGS = ["--body", " -b", "\t-b", " -F", "\t-F"];
const COMMENT_ALLOWS = BODY_PREFIXES.flatMap((p) => [
  `gh issue comment * --body-file ${p}*`, `gh pr comment * --body-file ${p}*`, `gh pr review * --comment --body-file ${p}*`,
]);
// Reads that merely contain merge, review or release (mergeStateStatus, reviewDecision, --label release).
const READ_HEADS = ["gh pr view", "gh pr list", "gh issue view", "gh issue list"];
const READ_ALLOWS = [
  "gh pr view*--json*", "gh pr list*--json*", "gh pr list*--search*", "gh pr list*--label*",
  "gh issue view*--json*", "gh issue list*--json*", "gh issue list*--search*", "gh issue list*--label*",
];
/** Re-denies, last: nothing may ride along on an allowed command. (; | and a newline split the command on the engine, so those never fire.) */
const COMMENT_REDENY = [
  ...COMMENT_HEADS.flatMap((h) => [
    ...SMUGGLE.map((c) => `${h}*${c}*`), ...['"', "'", "~", ".."].map((c) => `${h}*--body-file*${c}*`), ...SENSITIVE.map((c) => `${h}*${c}*`),
    `${h}*-R*`, `${h}*--repo*`, `${h}*--delete-last*`, `${h}*--body-file -*`, `${h}*--body-file=*`, `${h}*--body-file /dev/*`, `${h}* -F*`,
    // real gh uses the LAST body flag, so a second one defeats the first: deny any two of --body(-file), -b, -F
    ...BODY_FLAGS.flatMap((x) => BODY_FLAGS.map((y) => `${h}*${x}*${y}*`)),
  ]),
  "gh pr review*--approve*", "gh pr review* -a *", "gh pr review*\t-a*", "gh pr review* -a\t*",
  ...READ_HEADS.flatMap((h) => SMUGGLE.map((c) => `${h}*${c}*`)),
];

/** The ordered bash rules as [pattern, action] pairs, catch-all first. */
export const BASH_RULES = [
  ["*", "allow"],
  ...DENY_BEFORE_GIT.map((p) => [p, "deny"]),
  ...COMMENT_ALLOWS.map((p) => [p, "allow"]),
  ...READ_ALLOWS.map((p) => [p, "allow"]),
  ...COMMENT_REDENY.map((p) => [p, "deny"]),
];

/** Every pattern that is denied, in rule order (for tests that list them). */
export const DENY_PATTERNS = BASH_RULES.filter(([, a]) => a === "deny").map(([p]) => p);

/** Permissions: everything an agent needs, minus the actions only the founder takes. */
export function opencodeConfig() {
  return {
    $schema: "https://opencode.ai/config.json",
    share: "disabled",
    autoupdate: false,
    provider: { openrouter: { options: { apiKey: "{env:OPENROUTER_API_KEY}" } } },
    permission: {
      edit: "allow",
      webfetch: "allow",
      bash: Object.fromEntries(BASH_RULES), // key order is rule order: last match wins
    },
  };
}

/**
 * Environment names the opencode child (and so the model's bash tool) may see.
 * Everything else, including every other secret on the runner, is dropped.
 *
 * Kept on purpose, and the residual risk: OPENROUTER_API_KEY (the config reads it
 * through {env:...}; the engine cannot call the model without it) and GH_TOKEN
 * (gh reads it for every API call; `gh pr create` and git over HTTPS need it).
 * A model with a shell can still print these two. Mitigations that live elsewhere:
 * the OpenRouter key must carry its own dollar budget, the App token is short lived
 * and scoped to this repo, and webfetch egress is the open hole to watch.
 * Writing the key into the config file instead would only move it onto disk.
 */
export const ENV_ALLOWLIST = [
  "PATH", "HOME", "USER", "LOGNAME", "SHELL", "LANG", "LC_ALL", "TERM", "TZ", "TMPDIR", "CI",
  "RUNNER_TEMP", "OPENCODE_CONFIG",
  "HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY", "https_proxy", "http_proxy", "no_proxy",
  "SSL_CERT_FILE", "NODE_EXTRA_CA_CERTS", "GIT_SSL_CAINFO",
  "OPENROUTER_API_KEY", "GH_TOKEN",
];

/**
 * Pure: build the child environment from a source env. `extra` is applied last and wins.
 *
 * OPENCODE_DISABLE_PROJECT_CONFIG is verified present in opencode-ai 1.18.34 (read from
 * the shipped binary). Config order there is global, then OPENCODE_CONFIG, then repo
 * opencode.json(c) files and .opencode directories, so WITHOUT this flag a file in the
 * checkout overrides our permissions. With it, those and repo AGENTS.md discovery are
 * skipped; the brief is read explicitly by the prompt, so that loss is acceptable.
 */
export function buildChildEnv(source, extra = {}) {
  const env = {};
  for (const k of ENV_ALLOWLIST) if (typeof source[k] === "string") env[k] = source[k];
  return { ...env, OPENCODE_DISABLE_PROJECT_CONFIG: "1", ...extra };
}

/**
 * Pure: should the run stop now? Steps are reported only after they finish, so one
 * step of overshoot cannot be avoided; projecting with the dearest step seen so far
 * stops before the likely next breach instead of after it.
 */
export function stopReason(totals, { budget, maxTurns, model }) {
  if (totals.cost >= budget || totals.cost + (totals.maxStepCost ?? 0) > budget) return "error_max_budget_usd";
  if (totals.steps >= maxTurns) return "error_max_turns";
  // A paid model that reports no cost would make the cap blind: stop early.
  if (totals.steps >= 5 && totals.cost === 0 && !model.endsWith(":free")) return "error_cost_not_reported";
  return null;
}

/**
 * Signal the child and everything it spawned. The child is started as a process group
 * leader (detached), so a negative pid reaches the group; falls back to the child alone.
 */
export function killTree(child, signal, killFn = process.kill) {
  if (child.pid) {
    try {
      killFn(-child.pid, signal);
      return;
    } catch {
      // group gone or not a group leader: fall through to the direct child
    }
  }
  try {
    child.kill(signal);
  } catch {
    // already exited
  }
}

/** Build the stop function: SIGTERM the group now, SIGKILL after a grace period. */
export function makeStopper(child, state, { killFn = process.kill, setTimer = setTimeout, graceMs = 15_000 } = {}) {
  return (why) => {
    if (state.subtype === "success") state.subtype = why;
    killTree(child, "SIGTERM", killFn);
    const t = setTimer(() => killTree(child, "SIGKILL", killFn), graceMs);
    t?.unref?.();
    return t;
  };
}

/** Fold one JSON event from `opencode run --format json` into the running totals. */
export function tally(totals, event) {
  if (event?.type === "step_finish") {
    const part = event.part ?? event;
    totals.steps += 1;
    if (typeof part.cost === "number") {
      totals.cost += part.cost;
      totals.maxStepCost = Math.max(totals.maxStepCost ?? 0, part.cost);
    }
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
  return { steps: 0, cost: 0, maxStepCost: 0, tokens: { input: 0, output: 0, cacheRead: 0 } };
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
  // detached: the child leads its own process group, so a stop reaches shells and
  // tools the model started. Project config is disabled through the env, not the cwd.
  const child = spawn("opencode", cmd, {
    env: buildChildEnv(process.env, { OPENCODE_CONFIG: cfgPath }),
    stdio: ["ignore", "pipe", "inherit"],
    detached: true,
  });

  const state = { subtype: "success" };
  const stop = makeStopper(child, state);
  for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => stop("error_during_execution"));

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
    const why = stopReason(totals, a);
    if (why) stop(why);
  });

  const code = await new Promise((res) => child.on("close", res));
  if (state.subtype !== "success") killTree(child, "SIGKILL"); // sweep stragglers in the group
  let subtype = state.subtype;
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
