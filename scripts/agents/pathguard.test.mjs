// Tests for pathguard.mjs. Run: node --test scripts/agents/pathguard.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { agentFromLabels, checkPaths, normalizePath, parseRawZ, main, HARD_RULES } from "./pathguard.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, "pathguard.mjs");
const REAL_LANES = JSON.parse(readFileSync(path.join(HERE, "..", "..", "agents", "lanes.json"), "utf8"));
const lanes = {
  lanes: {
    "backlog-hygiene": { agent: "product", allow: ["docs/BACKLOG.md", "docs/FOUNDER_TASKS.md"] },
    "ops-docs": { agent: "ops", allow: ["docs/ops/**"] },
  },
  scripts_allow: { ops: ["scripts/release/**", "scripts/agents/**"] },
};
const run = (files, agent = "product", l = lanes) => checkPaths({ agent, files, lanes: l });
const rules = (r) => r.violations.map((x) => x.rule);

test("the real agents/lanes.json matches the backlog-hygiene charter", () => {
  const l = REAL_LANES.lanes["backlog-hygiene"];
  assert.equal(l.agent, "product");
  assert.deepEqual([...l.allow].sort(), ["docs/BACKLOG.md", "docs/FOUNDER_TASKS.md"]);
});

test("allowed paths pass", () => {
  const r = run(["docs/BACKLOG.md", "docs/FOUNDER_TASKS.md"]);
  assert.equal(r.ok, true);
  assert.equal(r.checked, 2);
});

test("a path outside the lane fails with the path named", () => {
  const r = run(["docs/BACKLOG.md", "docs/ROADMAP.md"]);
  assert.equal(r.ok, false);
  assert.deepEqual(rules(r), ["outside-lane"]);
  assert.equal(r.violations[0].path, "docs/ROADMAP.md");
});

// One test per forbidden prefix. Lanes that would allow the path must still lose.
const permissive = { lanes: { all: { agent: "product", allow: ["**"] } }, scripts_allow: { product: ["scripts/**"] } };
const FORBIDDEN = [
  [".github/workflows/agents.yml", "workflows"],
  [".github/CODEOWNERS", "workflows"],
  ["supabase/migrations/0001_x.sql", "supabase"],
  ["supabase/tests/a.test.ts", "supabase"],
  ["agents/roster.json", "roster"],
  ["agents/lanes.json", "lanes"],
  [".claude/agents/ops.md", "claude-config"],
  ["docs/agents/OPERATING_MODEL.md", "agent-docs"],
  ["package.json", "manifest"],
  ["apps/mobile/package.json", "manifest"],
  [".gitmodules", "manifest"],
  ["docs/DECISIONS.md", "decisions"],
  ["CLAUDE.md", "constitution"],
  ["docs/legal/privacy.md", "legal"],
  ["packages/content/src/prompts.ts", "content"],
  ["packages/content/VOICE.md", "content"],
  ["packages/core/src/types.ts", "faithful-edit"],
  ["packages/core/src/verify.ts", "faithful-edit"],
  ["package-lock.json", "lockfile"],
  ["apps/mobile/package-lock.json", "lockfile"],
  ["yarn.lock", "lockfile"],
  ["pnpm-lock.yaml", "lockfile"],
  ["apps/mobile/ios/Podfile.lock", "lockfile"],
  ["scripts/agents/dispatch.mjs", "scripts"],
  [".npmrc", "npmrc"],
  ["apps/mobile/.npmrc", "npmrc"],
  [".gitattributes", "gitattributes"],
  [".husky/pre-commit", "husky"],
  ["opencode.json", "opencode-config"],
  ["AGENTS.md", "agents-md"],
  [".git/config", "git-dir"],
  ["sub/.git", "git-dir"],
  [".yarnrc.yml", "yarnrc"],
  [".pnpmfile.cjs", "pnpmfile"],
  ["bunfig.toml", "bunfig"],
  ["opencode.jsonc", "opencode-config"],
  [".opencode/agent/x.md", "opencode-config"],
];
for (const [p, rule] of FORBIDDEN) {
  test(`forbidden: ${p}`, () => {
    for (const l of [lanes, permissive]) {
      const r = run([p], "product", l);
      assert.equal(r.ok, false, `${p} must fail`);
      assert.ok(rules(r).includes(rule), `${p} -> ${rules(r)}`);
    }
  });
}

test("every hard rule has a test above", () => {
  const covered = new Set(FORBIDDEN.map((x) => x[1]));
  for (const r of HARD_RULES) assert.ok(covered.has(r.id), `no test for ${r.id}`);
});

test("scripts/** is forbidden unless on the agent's allowlist; scripts/agents never", () => {
  assert.equal(run(["scripts/release/tag.mjs"], "product").ok, false);
  assert.equal(run(["scripts/release/tag.mjs"], "ops").ok, true);
  assert.equal(run(["scripts/other/x.mjs"], "ops").ok, false);
  const r = run(["scripts/agents/dispatch.mjs"], "ops");
  assert.equal(r.ok, false);
  assert.deepEqual(rules(r), ["scripts"]);
});

test("an allowlist cannot unlock a hard-forbidden path", () => {
  const l = { lanes: { x: { agent: "product", allow: [".github/**", "CLAUDE.md"] } }, scripts_allow: {} };
  assert.equal(run([".github/workflows/a.yml", "CLAUDE.md"], "product", l).ok, false);
});

// Renames and deletions.
test("rename OUT of an allowed path to another allowed-looking path is blocked on the old side only if old is forbidden", () => {
  const r = run([{ status: "R", oldPath: "docs/BACKLOG.md", path: "docs/ROADMAP.md" }]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.violations.map((x) => [x.side, x.path]), [["new", "docs/ROADMAP.md"]]);
});

test("rename INTO an allowed path from a forbidden path is blocked (old side)", () => {
  const r = run([{ status: "R", oldPath: ".github/workflows/agents.yml", path: "docs/BACKLOG.md" }]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.violations.map((x) => [x.side, x.rule]), [["old", "workflows"]]);
});

test("rename from an allowed path to a forbidden path is blocked (new side)", () => {
  const r = run([{ status: "R", oldPath: "docs/BACKLOG.md", path: "CLAUDE.md" }]);
  assert.equal(r.ok, false);
  assert.deepEqual(r.violations.map((x) => [x.side, x.rule]), [["new", "constitution"]]);
});

test("rename out of an allowed path into the lane's other file passes only if both are allowed", () => {
  assert.equal(run([{ status: "R", oldPath: "docs/BACKLOG.md", path: "docs/FOUNDER_TASKS.md" }]).ok, true);
});

test("rename whose old path is only outside the lane is blocked (old path is checked)", () => {
  const r = run([{ status: "R", oldPath: "docs/ROADMAP.md", path: "docs/BACKLOG.md" }]);
  assert.equal(r.ok, false);
  assert.equal(r.violations[0].side, "old");
});

test("rename or copy without a source path fails closed", () => {
  assert.equal(run([{ status: "R", path: "docs/BACKLOG.md" }]).ok, false);
});

test("deleting a forbidden or out-of-lane file is a touch", () => {
  assert.equal(run([{ status: "D", path: "supabase/migrations/0001_x.sql" }]).ok, false);
  assert.equal(run([{ status: "D", path: "docs/ROADMAP.md" }]).ok, false);
  assert.equal(run([{ status: "D", path: "docs/BACKLOG.md" }]).ok, true);
});

// Path tricks.
test("'..' traversal is rejected, never resolved", () => {
  for (const p of ["docs/BACKLOG.md/../../.github/workflows/a.yml", "../outside", "docs/../CLAUDE.md"]) {
    const r = run([p]);
    assert.equal(r.ok, false, p);
    assert.ok(rules(r).includes("bad-path"), p);
  }
});

test("absolute paths, drive letters, NUL and control characters are rejected", () => {
  for (const p of ["/etc/passwd", "C:/x", "C:\\x", "docs/BACKLOG.md\u0000.png", "docs/\nBACKLOG.md", ""]) {
    assert.equal(run([p]).ok, false, JSON.stringify(p));
  }
});

test("case-insensitive file systems: case variants of forbidden paths fail", () => {
  for (const p of ["claude.md", "Claude.MD", ".GITHUB/Workflows/a.yml", "Supabase/migrations/x.sql", "AGENTS/Roster.json", "Package-Lock.JSON", "PACKAGES/CORE/SRC/TYPES.TS"]) {
    const r = run([p], "product", permissive);
    assert.equal(r.ok, false, p);
  }
});

test("case variants of an allowed path are matched case-insensitively (same file on macOS and Windows)", () => {
  assert.equal(run(["docs/backlog.md"]).ok, true);
});

test("backslash, dot-segment, double-slash and trailing-dot spellings are normalised", () => {
  for (const p of [".github\\workflows\\a.yml", "./.github/workflows/a.yml", ".github//workflows/a.yml", "CLAUDE.md.", "CLAUDE.md ", "docs/./legal/x.md"]) {
    assert.equal(run([p], "product", permissive).ok, false, p);
  }
});

test("fullwidth and compatibility Unicode spellings are normalised (NFKC)", () => {
  assert.equal(run(["\uFF23LAUDE.md"], "product", permissive).ok, false);
  assert.equal(normalizePath("\uFF0Egithub/x").ok, true);
});

test("symlink and submodule entries are blocked even at an allowed path", () => {
  const a = run([{ path: "docs/BACKLOG.md", mode: "120000" }]);
  assert.equal(a.ok, false);
  assert.deepEqual(rules(a), ["symlink"]);
  assert.equal(run([{ path: "docs/FOUNDER_TASKS.md", mode: "160000" }]).ok, false);
  assert.equal(run([{ status: "R", oldPath: "docs/BACKLOG.md", oldMode: "120000", path: "docs/FOUNDER_TASKS.md", mode: "100644" }]).ok, false);
  assert.equal(run([{ path: "docs/BACKLOG.md", mode: "100644" }]).ok, true);
});

test("empty diff, empty file list, and bad input fail closed", () => {
  assert.deepEqual(rules(run([])), ["empty-diff"]);
  assert.equal(checkPaths({ agent: "product", files: undefined, lanes }).ok, false);
  assert.equal(checkPaths({ agent: "product", files: ["docs/BACKLOG.md"], lanes: undefined }).ok, false);
  assert.equal(checkPaths({ agent: "../x", files: ["docs/BACKLOG.md"], lanes }).ok, false);
  assert.equal(checkPaths({ agent: undefined, files: ["docs/BACKLOG.md"], lanes }).ok, false);
});

test("an agent without a lane may change nothing", () => {
  const r = run(["docs/BACKLOG.md"], "qa");
  assert.equal(r.ok, false);
  assert.ok(rules(r).includes("no-lane"));
});

test("all violations are reported, not just the first", () => {
  const r = run(["CLAUDE.md", ".github/a.yml", "docs/ROADMAP.md", "docs/BACKLOG.md"]);
  assert.equal(r.violations.length, 3);
});

test("parseRawZ reads renames, copies, deletes and modes", () => {
  const z = [":100644 100644 aaa bbb R100", "docs/BACKLOG.md", "docs/X.md", ":100644 000000 aaa 000 D", "a.txt", ":100644 120000 aaa bbb T", "docs/L.md", ""].join("\0");
  assert.deepEqual(parseRawZ(z), [
    { status: "R", oldPath: "docs/BACKLOG.md", path: "docs/X.md", oldMode: "100644", mode: "100644" },
    { status: "D", path: "a.txt", oldMode: "100644", mode: "100644" },
    { status: "T", path: "docs/L.md", oldMode: "100644", mode: "120000" },
  ]);
});

// CLI against a real temporary git repository.
function git(cwd, ...args) {
  const r = spawnSync("git", args, { cwd, encoding: "utf8" });
  assert.equal(r.status, 0, `git ${args.join(" ")}: ${r.stderr}`);
}
function cli(cwd, ...args) {
  const lanesFile = path.join(cwd, "lanes.test.json");
  // --agent callers say --offline (no PR identity to check); --labels callers must give --branch and --author.
  const extra = args.includes("--agent") && !args.includes("--labels") ? ["--offline"] : [];
  return spawnSync("node", [SCRIPT, "--lanes", lanesFile, "--cwd", cwd, ...extra, ...args], { encoding: "utf8" });
}
function repo() {
  const d = mkdtempSync(path.join(tmpdir(), "pathguard-"));
  git(d, "init", "-q", "-b", "develop");
  git(d, "config", "user.email", "t@example.com");
  git(d, "config", "user.name", "t");
  git(d, "config", "commit.gpgsign", "false");
  mkdirSync(path.join(d, "docs"));
  mkdirSync(path.join(d, ".github"));
  writeFileSync(path.join(d, "docs/BACKLOG.md"), "# Backlog\n".repeat(20));
  writeFileSync(path.join(d, ".github/CODEOWNERS"), "* @asha-owner\n".repeat(10));
  writeFileSync(path.join(d, "lanes.test.json"), JSON.stringify(lanes));
  git(d, "add", "-A");
  git(d, "commit", "-q", "-m", "base");
  git(d, "checkout", "-q", "-b", "feat/x");
  return d;
}
const commit = (d) => { git(d, "add", "-A"); git(d, "commit", "-q", "-m", "change"); };

test("CLI: in-lane edit exits 0", () => {
  const d = repo();
  try {
    writeFileSync(path.join(d, "docs/BACKLOG.md"), "# Backlog\n".repeat(20) + "- Status: done\n");
    commit(d);
    const r = cli(d, "--agent", "product", "--base", "develop", "--head", "HEAD");
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout, /ok, 1 changed/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("CLI: git rename out of an allowed path is caught on BOTH paths (old and new)", () => {
  const d = repo();
  try {
    git(d, "mv", "docs/BACKLOG.md", ".github/BACKLOG.md");
    commit(d);
    const r = cli(d, "--agent", "product", "--base", "develop", "--head", "HEAD");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /\[workflows\] \.github\/BACKLOG\.md/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("CLI: rename of a forbidden file into the lane is caught by its old path", () => {
  const d = repo();
  try {
    git(d, "mv", ".github/CODEOWNERS", "docs/FOUNDER_TASKS.md");
    commit(d);
    const r = cli(d, "--agent", "product", "--base", "develop", "--head", "HEAD");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /\[workflows\] \.github\/CODEOWNERS: old path/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("CLI: a symlink committed at an allowed path is caught", () => {
  const d = repo();
  try {
    rmSync(path.join(d, "docs/BACKLOG.md"));
    symlinkSync("../.github/CODEOWNERS", path.join(d, "docs/BACKLOG.md"));
    commit(d);
    const r = cli(d, "--agent", "product", "--base", "develop", "--head", "HEAD");
    assert.equal(r.status, 1);
    assert.match(r.stderr, /\[symlink\]/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("CLI: empty diff exits non-zero; bad base fails closed with 2", () => {
  const d = repo();
  try {
    assert.equal(cli(d, "--agent", "product", "--base", "develop", "--head", "HEAD").status, 1);
    const r = cli(d, "--agent", "product", "--base", "nope", "--head", "HEAD");
    assert.equal(r.status, 2);
    assert.match(r.stderr, /failing closed/);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("CLI: --files JSON input, and usage errors", () => {
  const d = repo();
  try {
    const f = path.join(d, "changes.json");
    writeFileSync(f, JSON.stringify(["docs/BACKLOG.md", "CLAUDE.md"]));
    const r = cli(d, "--agent", "product", "--files", f);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /\[constitution\] CLAUDE\.md/);
    writeFileSync(f, JSON.stringify({ files: [{ path: "docs/BACKLOG.md" }] }));
    assert.equal(cli(d, "--agent", "product", "--files", f).status, 0);
    assert.equal(cli(d, "--files", f).status, 2);
    assert.equal(cli(d, "--agent", "product", "--files", path.join(d, "missing.json")).status, 2);
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test("main() is callable with injected output", () => {
  const msgs = [];
  const out = { log: (m) => msgs.push(m), error: (m) => msgs.push(m) };
  const code = main(["--agent"], out);
  assert.equal(code, 2);
});

test("agentFromLabels: none, one, many; order and case do not matter", () => {
  assert.equal(agentFromLabels(["bug", "from:agent"]).status, "none");
  assert.equal(agentFromLabels([]).status, "none");
  assert.equal(agentFromLabels(undefined).status, "none");
  assert.deepEqual(agentFromLabels(["bug", "agent:ops"]), { status: "one", agent: "ops", labels: ["agent:ops"] });
  assert.equal(agentFromLabels(["Agent:Ops", "agent:ops"]).status, "one");
  assert.equal(agentFromLabels(["agent:ops", "agent:product"]).status, "many");
  assert.equal(agentFromLabels(["agent:product", "x", "agent:ops"]).status, "many");
  assert.deepEqual(agentFromLabels(["agent:ops", "agent:product"]).labels.sort(), agentFromLabels(["agent:product", "agent:ops"]).labels.sort());
});

test("CLI --labels: two agent labels fail closed in either order; none is out of scope", () => {
  const d = repo();
  try {
    writeFileSync(path.join(d, "docs/BACKLOG.md"), "# Backlog\n".repeat(20) + "x\n");
    commit(d);
    for (const labels of ["agent:product,agent:ops", "agent:ops,agent:product"]) {
      const r = cli(d, "--labels", labels, "--branch", "fix/x", "--author", "someone", "--base", "develop", "--head", "HEAD");
      assert.equal(r.status, 1, labels);
      assert.match(r.stderr, /more than one agent:\* label/);
    }
    const none = cli(d, "--labels", "bug,from:agent", "--branch", "fix/x", "--author", "someone", "--base", "develop", "--head", "HEAD");
    assert.equal(none.status, 0);
    assert.match(none.stdout, /not an agent PR/);
    const one = cli(d, "--labels", "bug,agent:product", "--branch", "agent/product/x", "--author", "claude[bot]", "--base", "develop", "--head", "HEAD");
    assert.equal(one.status, 0, one.stderr);
    assert.equal(cli(d, "--labels", "agent:product", "--agent", "product").status, 2);
  } finally { rmSync(d, { recursive: true, force: true }); }
});
