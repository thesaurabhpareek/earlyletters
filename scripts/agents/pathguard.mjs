// Path guard for agent PRs (hole H16). Pure function `checkPaths` plus a CLI.
// An agent PR may touch only the paths its lane allows (agents/lanes.json), and
// never the hard-forbidden paths below, whatever the lane says. Fail closed:
// unknown agent, empty diff, odd path or symlink all fail.
// Design and wiring: docs/agents/hardening/pathguard.md.
//
//   node scripts/agents/pathguard.mjs --agent <handle> --base origin/develop --head HEAD
//   node scripts/agents/pathguard.mjs --agent <handle> --files changes.json
//
// A changed file is a string (a path) or { path, oldPath?, status?, mode?, oldMode? }.
// A rename or copy counts as touching BOTH oldPath and path.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { identityOf } from "./identity.mjs";

const LOCKFILES = [
  "package-lock.json", "npm-shrinkwrap.json", "yarn.lock", "pnpm-lock.yaml", "bun.lock",
  "bun.lockb", "deno.lock", "podfile.lock", "gemfile.lock", "cargo.lock", "poetry.lock",
  "composer.lock", "pipfile.lock",
];

// Hard rules: never overridable by a lane. Globs are matched against the lower-cased,
// normalised path, so case-insensitive file systems cannot sneak past.
export const HARD_RULES = [
  { id: "workflows", glob: ".github/**", why: "CI and workflow files (.github/**)" },
  { id: "supabase", glob: "supabase/**", why: "database schema and access rules (supabase/**)" },
  { id: "roster", glob: "agents/roster.json", why: "the agent roster" },
  { id: "lanes", glob: "agents/lanes.json", why: "the lane definitions themselves" },
  { id: "claude-config", glob: ".claude/**", why: "agent identities and settings (.claude/**)" },
  { id: "npmrc", glob: "**/.npmrc", why: "npm config can run code at install (.npmrc)" },
  { id: "gitattributes", glob: "**/.gitattributes", why: "git filters and attributes (.gitattributes)" },
  { id: "husky", glob: ".husky/**", why: "git hooks (.husky/**)" },
  { id: "opencode-config", glob: "opencode.json", why: "the OpenCode runner config (opencode.json)" },
  { id: "agents-md", glob: "AGENTS.md", why: "agent instructions (AGENTS.md)" },
  { id: "git-dir", glob: ".git/**", why: "git internals (.git/**)" },
  { id: "agent-docs", glob: "docs/agents/**", why: "agent harness docs (docs/agents/**)" },
  { id: "manifest", glob: "**/package.json", why: "package manifest (package.json)" },
  { id: "manifest", glob: ".gitmodules", why: "submodule config (.gitmodules)" },
  { id: "decisions", glob: "docs/DECISIONS.md", why: "the decision log" },
  { id: "constitution", glob: "CLAUDE.md", why: "the repo constitution (CLAUDE.md)" },
  { id: "legal", glob: "docs/legal/**", why: "legal text (docs/legal/**)" },
  { id: "content", glob: "packages/content/**", why: "product copy (packages/content/**)" },
  { id: "faithful-edit", glob: "packages/core/src/types.ts", why: "faithful-edit constitution (types.ts)" },
  { id: "faithful-edit", glob: "packages/core/src/verify.ts", why: "faithful-edit constitution (verify.ts)" },
  ...LOCKFILES.map((f) => ({ id: "lockfile", glob: `**/${f}`, why: `lockfile (${f})` })),
];

/** Convert a small glob (`*`, `**`, `?`) to an anchored RegExp. Input is matched lower-case. */
export function globToRegExp(glob) {
  let re = "";
  const g = glob.toLowerCase();
  for (let i = 0; i < g.length; i++) {
    const c = g[i];
    if (c === "*") {
      if (g[i + 1] === "*") {
        i++;
        if (g[i + 1] === "/") { i++; re += "(?:.*/)?"; } else re += ".*";
      } else re += "[^/]*";
    } else if (c === "?") re += "[^/]";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}
const matches = (globs, p) => globs.some((g) => globToRegExp(g).test(p));

/**
 * Normalise a path for comparison. Returns { ok, norm, reason }.
 * Rejects NUL/control characters, absolute paths, drive letters and any `..` segment
 * (git never emits one, so one means someone is trying something).
 */
export function normalizePath(raw) {
  if (typeof raw !== "string" || raw === "") return { ok: false, reason: "empty path" };
  if (/[\u0000-\u001f\u007f]/.test(raw)) return { ok: false, reason: "control character in path" };
  const p = raw.normalize("NFKC").replace(/\\/g, "/");
  if (p.startsWith("/") || /^[a-zA-Z]:/.test(p)) return { ok: false, reason: "absolute path" };
  const segs = [];
  for (const s0 of p.split("/")) {
    if (s0 === "..") return { ok: false, reason: "'..' segment in path" };
    if (s0 === "" || s0 === ".") continue;
    // Windows ignores trailing dots and spaces ("CLAUDE.md. " is CLAUDE.md there).
    const s = s0.replace(/[. ]+$/, "");
    if (s === "") return { ok: false, reason: "path segment of only dots or spaces" };
    segs.push(s);
  }
  if (segs.length === 0) return { ok: false, reason: "empty path" };
  return { ok: true, norm: segs.join("/").toLowerCase() };
}

/**
 * Agent identity from PR labels. Label order is attacker-influenceable (anyone with
 * triage permission), so we never pick one: exactly one `agent:*` label gives an agent,
 * none means "not an agent PR" (out of scope), more than one is rejected.
 * @returns {{status: "none"|"one"|"many", agent?: string, labels: string[]}}
 */
export function agentFromLabels(labels) {
  const found = [...new Set((labels ?? []).map((l) => String(l).trim()).filter((l) => /^agent:/i.test(l)).map((l) => l.toLowerCase()))];
  if (found.length === 0) return { status: "none", labels: found };
  if (found.length > 1) return { status: "many", labels: found };
  return { status: "one", agent: found[0].slice("agent:".length), labels: found };
}

/** Lanes applying to an agent. */
export function lanesFor(agent, lanes) {
  const out = [];
  for (const [name, l] of Object.entries(lanes?.lanes ?? {})) if (l?.agent === agent) out.push({ name, ...l });
  return out;
}

const isLinkOrSubmodule = (m) => m === "120000" || m === "160000";

/**
 * @param {{agent: string, files: Array<string|object>, lanes: object}} args
 * @returns {{ok: boolean, violations: Array<{path: string, side: string, rule: string, reason: string}>, checked: number}}
 */
export function checkPaths({ agent, files, lanes }) {
  const violations = [];
  const v = (p, side, rule, reason) => violations.push({ path: String(p), side, rule, reason });
  const list = Array.isArray(files) ? files : [];
  if (typeof agent !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(agent)) {
    return { ok: false, checked: 0, violations: [{ path: "", side: "-", rule: "agent", reason: `invalid agent handle ${JSON.stringify(agent)}` }] };
  }
  if (list.length === 0) {
    return { ok: false, checked: 0, violations: [{ path: "", side: "-", rule: "empty-diff", reason: "the diff has no changed files (wrong base/head? an agent PR must change something)" }] };
  }
  const myLanes = lanesFor(agent, lanes);
  const laneAllow = myLanes.flatMap((l) => l.allow ?? []);
  const scriptsAllow = lanes?.scripts_allow?.[agent] ?? [];
  if (myLanes.length === 0 && scriptsAllow.length === 0) {
    v("", "-", "no-lane", `agent '${agent}' has no lane in agents/lanes.json, so it may change nothing`);
  }

  for (const f of list) {
    const e = typeof f === "string" ? { path: f } : f ?? {};
    const sides = [["new", e.path, e.mode]];
    if (e.oldPath !== undefined && e.oldPath !== null) sides.push(["old", e.oldPath, e.oldMode]);
    else if (/^[RC]/.test(e.status ?? "")) v(e.path, "old", "bad-path", "rename or copy without its source path");
    for (const [side, raw, mode] of sides) {
      const n = normalizePath(raw);
      if (!n.ok) { v(raw ?? "", side, "bad-path", n.reason); continue; }
      const p = n.norm;
      if (isLinkOrSubmodule(mode)) v(raw, side, "symlink", "symlink or submodule entry (could point outside its lane)");
      const hard = HARD_RULES.find((r) => globToRegExp(r.glob).test(p));
      if (hard) { v(raw, side, hard.id, `${side} path is forbidden for agents: ${hard.why}`); continue; }
      if (p === "scripts" || p.startsWith("scripts/")) {
        if (p.startsWith("scripts/agents/") || !matches(scriptsAllow, p)) {
          v(raw, side, "scripts", `${side} path is under scripts/** and not on the script allowlist for '${agent}'`);
        }
      } else if (!matches(laneAllow, p)) {
        v(raw, side, "outside-lane", `${side} path is outside the lane of '${agent}'`);
      }
    }
  }
  return { ok: violations.length === 0, checked: list.length, violations };
}

/** Human message for a result. */
export function formatResult(agent, r) {
  if (r.ok) return `pathguard: ok, ${r.checked} changed file(s) all inside the lane of '${agent}'.`;
  const lines = [`pathguard: FAIL for agent '${agent}', ${r.violations.length} violation(s):`];
  for (const x of r.violations) lines.push(`  - [${x.rule}] ${x.path || "(none)"}: ${x.reason}`);
  lines.push("Fix: remove those changes from the PR, or ask the founder to change agents/lanes.json.");
  return lines.join("\n");
}

/** Parse `git diff --raw -z` output into file entries (handles renames and copies). */
export function parseRawZ(out) {
  const parts = out.split("\0");
  const files = [];
  for (let i = 0; i < parts.length; i++) {
    const m = /^:(\d{6}) (\d{6}) [0-9a-f]+ [0-9a-f]+ ([A-Z])\d*$/.exec(parts[i]);
    if (!m) continue;
    const [, oldMode, mode, status] = m;
    if (status === "R" || status === "C") {
      files.push({ status, oldPath: parts[i + 1], path: parts[i + 2], oldMode, mode });
      i += 2;
    } else {
      // A deletion reports mode 000000 as the new mode: keep the old one.
      files.push({ status, path: parts[i + 1], oldMode, mode: status === "D" ? oldMode : mode });
      i += 1;
    }
  }
  return files;
}

export function gitChanged(base, head, cwd) {
  const r = spawnSync("git", ["diff", "--raw", "-z", "-M", "--no-abbrev", `${base}...${head}`], { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`git diff failed: ${(r.stderr || "").trim() || r.status}`);
  return parseRawZ(r.stdout);
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (!k.startsWith("--")) throw new Error(`unexpected argument ${k}`);
    const val = argv[++i];
    if (val === undefined) throw new Error(`${k} needs a value`);
    a[k.slice(2)] = val;
  }
  return a;
}

/** CLI. Exit 0 ok, 1 violations, 2 cannot decide (fails closed). */
export function main(argv = process.argv.slice(2), out = console) {
  let args;
  try { args = parseArgs(argv); } catch (e) { out.error(`pathguard: ${e.message}`); return 2; }
  if (args.agent && args.labels !== undefined) { out.error("pathguard: give --agent or --labels, not both"); return 2; }
  if (!args.agent && args.labels === undefined) { out.error("pathguard: --agent <handle> or --labels <a,b,...> is required"); return 2; }
  if (args.labels !== undefined) {
    const labels = args.labels.split(",");
    // Identity does not rest on labels: a branch prefix agent/<handle>/ or a bot author counts too.
    const logins = String(args["app-logins"] ?? process.env.AGENTS_BOT_LOGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const ident = identityOf({ labels, head: { ref: args.branch ?? "" }, user: { login: args.author ?? "", type: args["author-type"] ?? "" } }, { appLogins: logins });
    if (ident.status === "conflict" || ident.status === "unlabelled") { out.error(`pathguard: FAIL, agent identity is inconsistent: ${ident.reasons.join("; ")}. Fail closed: fix the labels or the branch name.`); return 1; }
    const id = agentFromLabels(labels);
    if (id.status === "none") { out.log("pathguard: no agent:* label, not an agent PR; out of scope for this check (human review and branch protection apply)."); return 0; }
    if (id.status === "many") { out.error(`pathguard: FAIL, more than one agent:* label (${id.labels.join(", ")}). Label order can be changed by anyone with triage permission, so no lane is chosen. Remove all but one.`); return 1; }
    args.agent = id.agent;
  }
  try {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const lanes = JSON.parse(readFileSync(args.lanes ?? path.join(here, "..", "..", "agents", "lanes.json"), "utf8"));
    let files;
    if (args.files) {
      const j = JSON.parse(readFileSync(args.files, "utf8"));
      files = Array.isArray(j) ? j : j.files;
    } else {
      files = gitChanged(args.base ?? "origin/develop", args.head ?? "HEAD", args.cwd);
    }
    const r = checkPaths({ agent: args.agent, files, lanes });
    (r.ok ? out.log : out.error)(formatResult(args.agent, r));
    return r.ok ? 0 : 1;
  } catch (e) {
    out.error(`pathguard: cannot decide, failing closed: ${e.message}`);
    return 2;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main());
