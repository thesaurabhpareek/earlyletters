#!/usr/bin/env node
// Start-of-session smoke check for a real harness run (retro package H4, IMP-18).
// Read-only: it sends GET requests and reads files, and never writes to GitHub
// or to disk. Run it before a lane takes a claim; a failure means stop.
//
//   node scripts/agents/smoke.mjs           # human-readable lines
//   node scripts/agents/smoke.mjs --json    # one JSON object
//
// Checks: the roster parses; the repository answers; the base branch has a head
// sha; agents/freeze.json and agents/budget.json parse when present (H2 and H3
// add them); prompt-lint passes on docs/agents/lanes/*.prompt.md when both exist
// (#328 adds them). A file that is not there yet is "skip", not "fail".
// Exit code: 0 when nothing failed, 1 otherwise.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadRoster, repoSlug, gh } from "./lib.mjs";

const SHA = /^[0-9a-f]{40}$/;

function jsonFile(root, rel) {
  const path = join(root, rel);
  if (!existsSync(path)) return { name: rel, status: "skip", detail: "not present on this branch" };
  try {
    JSON.parse(readFileSync(path, "utf8"));
    return { name: rel, status: "ok", detail: "parses" };
  } catch (e) {
    return { name: rel, status: "fail", detail: `does not parse: ${e.message}` };
  }
}

function promptLint(root, run) {
  const script = join(root, "scripts", "agents", "prompt-lint.mjs");
  const dir = join(root, "docs", "agents", "lanes");
  const prompts = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".prompt.md")).sort() : [];
  if (!existsSync(script) || !prompts.length) return { name: "prompt-lint", status: "skip", detail: "prompt-lint.mjs or lane prompts not present" };
  // Lint mode only (no --preflight): it reads the prompt files and prints problems.
  const r = run(process.execPath, [script, ...prompts.map((f) => join("docs", "agents", "lanes", f))], root);
  return r.code === 0
    ? { name: "prompt-lint", status: "ok", detail: `${prompts.length} lane prompt(s) clean` }
    : { name: "prompt-lint", status: "fail", detail: `exit ${r.code}: ${r.output.trim().split("\n").slice(0, 5).join(" | ")}` };
}

function runNode(cmd, args, cwd) {
  try {
    const output = execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { code: 0, output };
  } catch (e) {
    return { code: e.status ?? 1, output: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
}

/**
 * Run every check. `get` is the only way out to GitHub and takes a path only,
 * so this function cannot send anything but a GET.
 */
export function runSmoke({ root = ROOT, roster, repo, get, run = runNode } = {}) {
  const checks = [];
  let r = roster;
  if (!r) {
    try {
      r = loadRoster(root);
      checks.push({ name: "roster", status: "ok", detail: `${r.agents.length} agents` });
    } catch (e) {
      checks.push({ name: "roster", status: "fail", detail: `agents/roster.json: ${e.message}` });
    }
  }
  const slug = repo ?? (r ? repoSlug(r) : undefined);
  const read = get ?? ((path) => gh(path, { allowFail: true }));
  const base = r?.base_branch ?? "develop";

  if (!slug) checks.push({ name: "repository", status: "fail", detail: "no repository (GITHUB_REPOSITORY or roster.repo)" });
  else {
    const info = read(`/repos/${slug}`);
    checks.push(info?.full_name
      ? { name: "repository", status: "ok", detail: info.full_name }
      : { name: "repository", status: "fail", detail: `${slug} did not answer (network, auth or name)` });
    const sha = read(`/repos/${slug}/branches/${base}`)?.commit?.sha ?? "";
    checks.push(SHA.test(sha)
      ? { name: `${base} head`, status: "ok", detail: sha }
      : { name: `${base} head`, status: "fail", detail: `no head sha for ${base}` });
  }
  checks.push(jsonFile(root, "agents/freeze.json"));
  checks.push(jsonFile(root, "agents/budget.json"));
  checks.push(promptLint(root, run));
  return { ok: checks.every((c) => c.status !== "fail"), repo: slug, checks };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = runSmoke();
  if (process.argv.includes("--json")) console.log(JSON.stringify(result, null, 2));
  else {
    for (const c of result.checks) console.log(`${c.status.padEnd(4)} ${c.name}: ${c.detail}`);
    console.log(result.ok ? "smoke: ok" : "smoke: FAILED, do not start a run");
  }
  process.exit(result.ok ? 0 : 1);
}
