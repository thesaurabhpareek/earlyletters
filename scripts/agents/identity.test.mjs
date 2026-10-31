// Tests for identity.mjs and its three users (pathguard CLI, guard-open-prs, dispatcher cap),
// plus the extra hard-forbidden paths. Finding A and C of the red-team review.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { identityOf, isAgentLike, branchHandle, botAuthor } from "./identity.mjs";
import { countAgentPrs } from "./guard-open-prs.mjs";
import { checkPaths, HARD_RULES } from "./pathguard.mjs";
import { agentOfPR, agentLikePR } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, "pathguard.mjs");
const pr = (o = {}) => ({ labels: [], head: { ref: "fix/x" }, user: { login: "stranger", type: "User" }, ...o });

test("identityOf: label, branch prefix and bot author are three separate signals", () => {
  assert.equal(identityOf(pr()).status, "none");
  assert.deepEqual(identityOf(pr({ labels: [{ name: "agent:qa" }] })), { status: "agent", agent: "qa", reasons: [] });
  assert.equal(identityOf(pr({ labels: [{ name: "agent:qa" }], head: { ref: "agent/qa/trace" } })).status, "agent");
  assert.equal(identityOf(pr({ head: { ref: "agent/qa/trace" } })).status, "unlabelled");
  assert.equal(identityOf(pr({ user: { login: "claude[bot]", type: "Bot" } })).status, "unlabelled");
  assert.equal(identityOf(pr({ user: { login: "agents-app", type: "User" } }), { appLogins: ["agents-app"] }).status, "unlabelled");
  assert.equal(identityOf(pr({ labels: [{ name: "agent:qa" }], head: { ref: "agent/ops/x" } })).status, "conflict");
  assert.equal(identityOf(pr({ labels: [{ name: "agent:qa" }, { name: "agent:ops" }] })).status, "conflict");
});

test("identityOf: look-alike branches and users are not agent signals", () => {
  for (const ref of ["agents/qa/x", "agent-qa/x", "feat/agent/qa/x", "agent//x", "Xagent/qa/x"]) assert.equal(branchHandle(pr({ head: { ref } })), undefined, ref);
  assert.equal(branchHandle(pr({ head: { ref: "AGENT/QA/x" } })), "qa", "case does not hide it");
  assert.equal(botAuthor(pr({ user: { login: "robot", type: "User" } })), false);
  assert.equal(isAgentLike(pr({ labels: [{ name: "from:agent" }] })), false);
});

test("dispatcher: routing stays label-only, but the open-PR cap counts an unlabelled agent-branch PR", () => {
  const drive = pr({ head: { ref: "agent/qa/x" } });
  assert.equal(agentOfPR(drive), undefined, "a drive-by branch name never routes");
  assert.equal(agentLikePR(drive), true, "but it counts against the cap");
  assert.equal(agentLikePR(pr({ user: { login: "claude[bot]", type: "Bot" } })), true);
  assert.equal(agentLikePR(pr()), false);
});

test("guard-open-prs: the count includes branch-prefix and bot-author PRs without a label", async () => {
  const page = [
    pr({ labels: [{ name: "agent:ops" }] }),
    pr({ head: { ref: "agent/qa/a" } }),
    pr({ user: { login: "claude[bot]", type: "Bot" } }),
    pr({ head: { ref: "agent-ish/x" } }),
    pr(),
  ];
  const r = await countAgentPrs({ repo: "o/r", getPage: async () => ({ status: 200, json: page }) });
  assert.equal(r.count, 3);
  assert.equal(r.seen, 5);
});

function cli(...args) {
  const d = mkdtempSync(path.join(tmpdir(), "idt-"));
  try {
    mkdirSync(path.join(d, "docs"));
    writeFileSync(path.join(d, "f.json"), JSON.stringify([{ path: "docs/BACKLOG.md" }]));
    writeFileSync(path.join(d, "lanes.json"), JSON.stringify({ lanes: { x: { agent: "product", allow: ["docs/BACKLOG.md"] } } }));
    return spawnSync(process.execPath, [SCRIPT, "--files", path.join(d, "f.json"), "--lanes", path.join(d, "lanes.json"), ...args], { encoding: "utf8", env: { PATH: process.env.PATH } });
  } finally { rmSync(d, { recursive: true, force: true }); }
}

test("pathguard CLI: a branch prefix or a bot author with no label fails closed (was exit 0 'not an agent PR')", () => {
  const byBranch = cli("--labels", "bug", "--branch", "agent/product/x");
  assert.equal(byBranch.status, 1, byBranch.stdout + byBranch.stderr);
  assert.match(byBranch.stderr, /branch prefix agent\/product\/ but no agent:\* label/);
  const byBot = cli("--labels", "bug", "--author", "claude[bot]", "--author-type", "Bot");
  assert.equal(byBot.status, 1);
  assert.match(byBot.stderr, /bot author but no agent:\* label/);
});

test("pathguard CLI: a label and a branch handle that disagree fail closed; agreement passes; no signal is out of scope", () => {
  assert.equal(cli("--labels", "agent:product", "--branch", "agent/ops/x").status, 1);
  assert.equal(cli("--labels", "agent:product", "--branch", "agent/product/x").status, 0);
  const none = cli("--labels", "bug", "--branch", "fix/typo", "--author", "someone");
  assert.equal(none.status, 0);
  assert.match(none.stdout, /not an agent PR/);
});

test("hard rules: config and tooling files are forbidden whatever the lane says, in any case and with trailing dots", () => {
  const lanes = { lanes: { all: { agent: "product", allow: ["**"] } }, scripts_allow: {} };
  const paths = [".npmrc", ".gitattributes", ".husky/pre-commit", ".husky/_/husky.sh", "opencode.json", "AGENTS.md", ".claude/settings.json", ".git/config", "apps/mobile/.npmrc", "sub/.gitattributes"];
  for (const p of paths) {
    for (const variant of [p, p.toUpperCase(), `${p}.`, `${p}. `, p.replace(/\//g, "\\")]) {
      const r = checkPaths({ agent: "product", files: [variant], lanes });
      assert.equal(r.ok, false, variant);
    }
  }
  assert.ok(HARD_RULES.some((r) => r.glob === ".git/**"));
  assert.equal(checkPaths({ agent: "product", files: ["docs/ok.md"], lanes }).ok, true, "control");
  assert.equal(checkPaths({ agent: "product", files: ["docs/npmrc-notes.md", "docs/git-attributes.md", "docs/AGENTS-overview.md"], lanes }).ok, true, "look-alike names are fine");
});
