// Tests for smoke.mjs. Offline: a fake GitHub (fake-github.mjs) or an injected
// reader, temporary folders for files. The key property: smoke never writes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, loadRoster } from "./lib.mjs";
import { runSmoke } from "./smoke.mjs";
import { createFakeGitHub } from "./fake-github.mjs";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = "fake-owner/fake-repo";
const SHA = "abcdefabcdefabcdefabcdefabcdefabcdefabcd";
const roster = { ...loadRoster(), repo: REPO };

function tempRoot(files) {
  const root = mkdtempSync(join(tmpdir(), "smoke-"));
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, rel)), { recursive: true });
    writeFileSync(join(root, rel), text);
  }
  return root;
}

/** A reader that records every call; it accepts a path only. */
function spyGet(answers) {
  const calls = [];
  const get = (...args) => {
    calls.push(args);
    return answers[args[0]];
  };
  return { get, calls };
}
const healthy = { [`/repos/${REPO}`]: { full_name: REPO }, [`/repos/${REPO}/branches/develop`]: { commit: { sha: SHA } } };
const byName = (r) => Object.fromEntries(r.checks.map((c) => [c.name, c]));

test("CLI against the fake GitHub: passes and sends only GET requests", async () => {
  const fake = createFakeGitHub({ repo: REPO, founder: roster.founder, developSha: SHA });
  await fake.start();
  try {
    const { stdout } = await run(process.execPath, [join(HERE, "smoke.mjs"), "--json"], { cwd: ROOT, env: fake.env(), timeout: 60_000 });
    const result = JSON.parse(stdout);
    assert.equal(result.ok, true, stdout);
    assert.equal(result.repo, REPO);
    assert.equal(byName(result)["develop head"].detail, SHA);
    assert.ok(fake.requests.length >= 2);
    assert.deepEqual(fake.writes(), []);
    assert.deepEqual(fake.unhandled, []);
  } finally {
    await fake.close();
  }
});

test("CLI exits 1 when the repository does not answer", async () => {
  const fake = createFakeGitHub({ repo: REPO, founder: roster.founder });
  await fake.start();
  try {
    await assert.rejects(
      run(process.execPath, [join(HERE, "smoke.mjs")], { cwd: ROOT, env: fake.env({ GITHUB_REPOSITORY: "fake-owner/missing" }), timeout: 60_000 }),
      (e) => e.code === 1 && /smoke: FAILED/.test(e.stdout),
    );
    assert.deepEqual(fake.writes(), []);
  } finally {
    await fake.close();
  }
});

test("absent freeze, budget and prompt-lint files are skipped, not failed", () => {
  const root = tempRoot({});
  try {
    const { get, calls } = spyGet(healthy);
    const r = runSmoke({ root, roster, get, run: () => assert.fail("prompt-lint must not run") });
    assert.equal(r.ok, true);
    const c = byName(r);
    assert.equal(c["agents/freeze.json"].status, "skip");
    assert.equal(c["agents/budget.json"].status, "skip");
    assert.equal(c["prompt-lint"].status, "skip");
    assert.ok(calls.every((args) => args.length === 1), "the reader only ever gets a path");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a freeze file that does not parse fails; a good budget file passes", () => {
  const root = tempRoot({ "agents/freeze.json": "{ not json", "agents/budget.json": '{"lanes":{}}' });
  try {
    const r = runSmoke({ root, roster, get: spyGet(healthy).get });
    assert.equal(r.ok, false);
    assert.equal(byName(r)["agents/freeze.json"].status, "fail");
    assert.equal(byName(r)["agents/budget.json"].status, "ok");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("missing develop sha or repository fails", () => {
  const root = tempRoot({});
  try {
    const noBranch = runSmoke({ root, roster, get: spyGet({ [`/repos/${REPO}`]: { full_name: REPO } }).get });
    assert.equal(noBranch.ok, false);
    assert.equal(byName(noBranch)["develop head"].status, "fail");
    const nothing = runSmoke({ root, roster, get: spyGet({}).get });
    assert.equal(byName(nothing).repository.status, "fail");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("prompt-lint runs in lint mode on every lane prompt and its exit code decides", () => {
  const root = tempRoot({
    "scripts/agents/prompt-lint.mjs": "process.exit(0)\n",
    "docs/agents/lanes/b.prompt.md": "x\n",
    "docs/agents/lanes/a.prompt.md": "x\n",
    "docs/agents/lanes/notes.md": "not a prompt\n",
  });
  try {
    const seen = [];
    const pass = runSmoke({ root, roster, get: spyGet(healthy).get, run: (cmd, args, cwd) => { seen.push({ args, cwd }); return { code: 0, output: "" }; } });
    assert.equal(byName(pass)["prompt-lint"].status, "ok");
    assert.deepEqual(seen[0].args.slice(1), ["docs/agents/lanes/a.prompt.md", "docs/agents/lanes/b.prompt.md"]);
    assert.ok(!seen[0].args.includes("--preflight"));
    assert.equal(seen[0].cwd, root);
    const failing = runSmoke({ root, roster, get: spyGet(healthy).get, run: () => ({ code: 1, output: "a.prompt.md:3 date\n" }) });
    assert.equal(failing.ok, false);
    assert.match(byName(failing)["prompt-lint"].detail, /exit 1: a\.prompt\.md:3 date/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("prompt-lint really runs when present (default runner)", () => {
  const root = tempRoot({
    "scripts/agents/prompt-lint.mjs": "process.exit(process.argv.length === 3 ? 0 : 1)\n",
    "docs/agents/lanes/only.prompt.md": "x\n",
  });
  try {
    assert.equal(byName(runSmoke({ root, roster, get: spyGet(healthy).get }))["prompt-lint"].status, "ok");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
