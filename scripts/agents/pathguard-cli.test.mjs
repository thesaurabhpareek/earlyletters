// pathguard CLI: required identity flags (--branch/--author, or --agent with --offline),
// per-commit checking, size and count caps, merge commits. Real git repositories in temp dirs.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "pathguard.mjs");
const git = (d, ...a) => { const r = spawnSync("git", a, { cwd: d, encoding: "utf8" }); if (r.status !== 0) throw new Error(`git ${a.join(" ")}: ${r.stderr}`); return r.stdout; };
const LANES = { lanes: { docs: { agent: "product", allow: ["docs/**"] } } };

function repo() {
  const d = mkdtempSync(path.join(tmpdir(), "pgc-"));
  git(d, "init", "-q", "-b", "develop");
  git(d, "config", "user.email", "t@example.com");
  git(d, "config", "user.name", "t");
  git(d, "config", "commit.gpgsign", "false");
  mkdirSync(path.join(d, "docs"));
  writeFileSync(path.join(d, "docs/a.md"), "base\n");
  writeFileSync(path.join(d, "lanes.test.json"), JSON.stringify(LANES));
  git(d, "add", "-A");
  git(d, "commit", "-q", "-m", "base");
  git(d, "checkout", "-q", "-b", "agent/product/x");
  return d;
}
const commit = (d, msg = "c") => { git(d, "add", "-A"); git(d, "commit", "-q", "-m", msg); };
const cli = (d, ...args) => spawnSync(process.execPath, [SCRIPT, "--lanes", path.join(d, "lanes.test.json"), "--cwd", d, ...args], { encoding: "utf8" });
const ID = ["--branch", "agent/product/x", "--author", "claude[bot]", "--author-type", "Bot"];
const GIT = ["--base", "develop", "--head", "HEAD"];
const withRepo = (fn) => { const d = repo(); try { fn(d); } finally { rmSync(d, { recursive: true, force: true }); } };

test("identity flags: --labels without --branch or --author exits 2 (was exit 0 'not an agent PR')", () => {
  withRepo((d) => {
    writeFileSync(path.join(d, "docs/a.md"), "x\n"); commit(d);
    for (const args of [["--labels", "bug"], ["--labels", "bug", "--branch", "fix/x"], ["--labels", "bug", "--author", "someone"], ["--labels", "agent:product"]]) {
      const r = cli(d, ...args, ...GIT);
      assert.equal(r.status, 2, args.join(" ") + r.stdout);
      assert.match(r.stderr, /--branch and --author/);
    }
    assert.equal(cli(d, "--labels", "bug", "--branch", "fix/x", "--author", "someone", ...GIT).status, 0, "no signal with both flags: out of scope");
    assert.equal(cli(d, "--labels", "agent:product", ...ID, ...GIT).status, 0, "agreeing identity passes");
  });
});

test("identity flags: --agent alone exits 2; --agent with --offline is allowed without them", () => {
  withRepo((d) => {
    writeFileSync(path.join(d, "docs/a.md"), "x\n"); commit(d);
    const bare = cli(d, "--agent", "product", ...GIT);
    assert.equal(bare.status, 2);
    assert.match(bare.stderr, /--offline/);
    assert.equal(cli(d, "--agent", "product", "--branch", "agent/product/x", ...GIT).status, 2, "one of the two is not enough");
    assert.equal(cli(d, "--agent", "product", "--offline", ...GIT).status, 0);
    assert.equal(cli(d, "--agent", "product", "--branch", "agent/product/x", "--author", "claude[bot]", ...GIT).status, 0, "both given, no --offline needed");
  });
});

test("identity flags: --agent checks identity against branch and author when they are present", () => {
  withRepo((d) => {
    writeFileSync(path.join(d, "docs/a.md"), "x\n"); commit(d);
    const r = cli(d, "--agent", "product", "--offline", "--branch", "agent/ops/x", ...GIT);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /branch handle is 'ops'/);
  });
});

test("per commit: a forbidden path added in one commit and reverted in the next is caught (the net diff is clean)", () => {
  withRepo((d) => {
    mkdirSync(path.join(d, ".github"));
    writeFileSync(path.join(d, ".github/evil.yml"), "on: push\n");
    writeFileSync(path.join(d, "docs/a.md"), "changed\n");
    commit(d, "add");
    git(d, "rm", "-q", ".github/evil.yml");
    commit(d, "revert");
    const r = cli(d, "--agent", "product", "--offline", ...GIT);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /\.github\/evil\.yml/);
  });
});

test("caps: 10 commits pass, 11 fail", () => {
  withRepo((d) => {
    for (let i = 0; i < 10; i++) { writeFileSync(path.join(d, "docs/a.md"), `v${i}\n`); commit(d, `c${i}`); }
    assert.equal(cli(d, "--agent", "product", "--offline", ...GIT).status, 0);
    writeFileSync(path.join(d, "docs/a.md"), "v10\n"); commit(d, "c10");
    const r = cli(d, "--agent", "product", "--offline", ...GIT);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /11 commits/);
    assert.equal(cli(d, "--agent", "product", "--offline", "--max-commits", "20", ...GIT).status, 0, "flag raises the cap");
  });
});

test("caps: 40 files pass, 41 fail", () => {
  withRepo((d) => {
    mkdirSync(path.join(d, "docs/many"));
    for (let i = 0; i < 40; i++) writeFileSync(path.join(d, `docs/many/f${i}.md`), "x\n");
    commit(d);
    assert.equal(cli(d, "--agent", "product", "--offline", ...GIT).status, 0);
    writeFileSync(path.join(d, "docs/many/f40.md"), "x\n"); commit(d, "one more");
    const r = cli(d, "--agent", "product", "--offline", ...GIT);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /41 files/);
  });
});

test("caps: total size over the limit fails (flag --max-bytes)", () => {
  withRepo((d) => {
    writeFileSync(path.join(d, "docs/big.md"), "x".repeat(3000)); commit(d);
    assert.equal(cli(d, "--agent", "product", "--offline", ...GIT).status, 0, "default is 5 MB");
    const r = cli(d, "--agent", "product", "--offline", "--max-bytes", "2000", ...GIT);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /too large/);
  });
});

test("a merge commit in the range fails", () => {
  withRepo((d) => {
    writeFileSync(path.join(d, "docs/a.md"), "mine\n"); commit(d, "mine");
    git(d, "checkout", "-q", "-b", "side", "develop");
    writeFileSync(path.join(d, "docs/b.md"), "side\n"); commit(d, "side");
    git(d, "checkout", "-q", "agent/product/x");
    git(d, "merge", "-q", "--no-ff", "-m", "merge side", "side");
    const r = cli(d, "--agent", "product", "--offline", ...GIT);
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stderr, /merge commit/);
  });
});
