// End-to-end lane test (retro package H4, IMP-18): 92 fixture tests passed while
// the lane did nothing for weeks, because no test ran the steps together. This
// one does, offline, against fake-github.mjs, using the real scripts unchanged:
//
//   claim    dispatch.mjs --local --top 1 --claim          (the local lane)
//   brief    brief.mjs for the assignment
//   journal  the agent's stub and completed entry, posted with the exact
//            command and marker the brief gives it
//   receipt  receipt.mjs with an execution log
//   release  dispatch.mjs --local --board-only --release <handle>
//
// verify() checks only what the lane leaves behind (board state and text, the
// brief file, journal comments). The mutation tests skip each step in turn and
// require verify() to blame that step, so a missing step can never pass.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, loadRoster, parseBacklog, readText, readState, journalTitle } from "./lib.mjs";
import { wantedLabels, journalBody } from "./bootstrap.mjs";
import { createFakeGitHub } from "./fake-github.mjs";

const run = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = "fake-owner/fake-repo";
const AGENT = "qa";
const DEVELOP = "1234567890abcdef1234567890abcdef12345678";
const COST = 0.4321;
const STEPS = ["claim", "brief", "journal", "receipt", "release"];

const roster = loadRoster();
const TASK = parseBacklog(readText(join(ROOT, "docs", "BACKLOG.md")))[0];
const BOARD_MD = "# Board\n\n## Active claims\n\n| Agent | Branch | Files | Since | Status |\n|---|---|---|---|---|\n\n## Done\n";

/** A repo the bootstrap has already run on: labels and one journal per agent. */
function seed(fake) {
  for (const l of wantedLabels(roster)) fake.db.labels.push(l);
  for (const a of roster.agents) {
    fake.addIssue({ title: journalTitle(a), body: journalBody(a, roster, REPO), labels: ["journal", `agent:${a.handle}`] });
  }
}

async function node(fake, script, args, extraEnv = {}) {
  const { stdout } = await run(process.execPath, [join(HERE, script), ...args], {
    cwd: ROOT, env: fake.env({ AGENTS_LANE: "e2e", ...extraEnv }), timeout: 60_000, maxBuffer: 16 * 1024 * 1024,
  });
  return stdout;
}

async function ghShim(fake, args) {
  const { stdout } = await run(join(fake.shimDir, "gh"), args, { env: fake.env(), timeout: 20_000 });
  return stdout.trim() ? JSON.parse(stdout) : null;
}

const board = (fake) => fake.issuesLabelled("agent-board")[0];

/** Run the lane, skipping the named steps. Returns what a checker may look at. */
async function runLane(skip = new Set()) {
  const fake = createFakeGitHub({ repo: REPO, founder: roster.founder, developSha: DEVELOP, contents: { "docs/agents/BOARD.md": BOARD_MD } });
  await fake.start();
  const tmp = mkdtempSync(join(tmpdir(), "lane-e2e-"));
  seed(fake);
  const journal = fake.issuesLabelled(`agent:${AGENT}`).find((i) => i.labels.some((l) => l.name === "journal")).number;
  const obs = { fake, tmp, journal, briefPath: join(tmp, "brief.md"), runId: "local-unclaimed" };
  try {
    if (!skip.has("claim")) {
      const out = await node(fake, "dispatch.mjs", ["--local", "--top", "1", "--claim"], { ONLY_AGENT: AGENT, FORCE_TASK: TASK.id });
      obs.assignments = JSON.parse(out.slice(out.indexOf("\n[") + 1));
      obs.afterClaim = { state: readState(board(fake)?.body), text: board(fake)?.body ?? "" };
      obs.runId = obs.afterClaim.state.claims?.[AGENT]?.run ?? obs.runId;
    }
    if (!skip.has("brief")) {
      await node(fake, "brief.mjs", ["--agent", AGENT, "--mode", "task", "--task", TASK.id, "--journal", String(journal), "--run-id", obs.runId, "--out", obs.briefPath]);
    }
    if (!skip.has("journal")) {
      // Act as the agent: take the marker and the post command from the brief.
      const brief = existsSync(obs.briefPath) ? readFileSync(obs.briefPath, "utf8") : "";
      const marker = brief.match(/`(<!-- journal run:\S+ agent:\S+ -->)`/)?.[1] ?? `<!-- journal run:${obs.runId} agent:${AGENT} -->`;
      const postPath = brief.match(/`gh api -X POST (\S+) -F body=@<file>`/)?.[1] ?? `repos/${REPO}/issues/${journal}/comments`;
      const stub = join(tmp, "stub.md");
      writeFileSync(stub, `${marker}\nStarted ${TASK.id}. Stub; completed at the end.\n`);
      const posted = await ghShim(fake, ["api", "-X", "POST", postPath, "-F", `body=@${stub}`]);
      const done = join(tmp, "entry.md");
      writeFileSync(done, `${marker}\n**Outcome:** opened nothing; e2e fixture run.\n**Learned:** The e2e lane test drives every step against a fake GitHub.\n`);
      await ghShim(fake, ["api", "-X", "PATCH", `repos/${REPO}/issues/comments/${posted.id}`, "-F", `body=@${done}`]);
    }
    if (!skip.has("receipt")) {
      const exec = join(tmp, "execution.json");
      writeFileSync(exec, JSON.stringify([{ type: "system" }, { type: "result", subtype: "success", total_cost_usd: COST, num_turns: 7, duration_ms: 300_000, model: "claude-sonnet-5-5" }]));
      await node(fake, "receipt.mjs", ["--agent", AGENT, "--journal", String(journal), "--mode", "task", "--task", TASK.id, "--outcome", "success", "--execution-file", exec, "--run-id", obs.runId]);
    }
    if (!skip.has("release")) {
      await node(fake, "dispatch.mjs", ["--local", "--board-only", "--release", AGENT]);
    }
    obs.final = { state: readState(board(fake)?.body), text: board(fake)?.body ?? "" };
    return obs;
  } finally {
    await fake.close();
  }
}

/** Every way the lane can be incomplete, as { step, msg }. Empty means the lane ran end to end. */
function verify(obs) {
  const fails = [];
  const fail = (step, msg) => fails.push({ step, msg });
  const { fake, journal, runId } = obs;
  const row = (text) => text.split("\n").find((l) => l.includes(`\`${AGENT}\``) && l.startsWith("|")) ?? "";

  // claim
  const a = obs.assignments ?? [];
  if (a.length !== 1 || a[0].agent !== AGENT || a[0].mode !== "task" || a[0].task !== TASK.id || a[0].journal !== String(journal)) {
    fail("claim", `dispatcher printed ${JSON.stringify(a)}, wanted one task ${TASK.id} for ${AGENT} with journal ${journal}`);
  }
  const claimed = obs.afterClaim?.state.claims?.[AGENT];
  if (!claimed || claimed.task !== TASK.id || claimed.source !== "local" || !/^local-\d+$/.test(claimed.run)) fail("claim", `board state after claim: ${JSON.stringify(claimed)}`);
  if (!row(obs.afterClaim?.text ?? "").includes(`starting: task ${TASK.id}`)) fail("claim", "board row does not say the agent is starting the task");
  if (obs.final.state.runs?.[AGENT] !== 1) fail("claim", `runs today for ${AGENT} is ${obs.final.state.runs?.[AGENT]}, wanted 1`);
  if (!obs.final.state.lanes?.e2e) fail("claim", "the e2e lane tick is not recorded");

  // brief
  const brief = existsSync(obs.briefPath) ? readFileSync(obs.briefPath, "utf8") : "";
  if (!brief) fail("brief", "no brief was written");
  else {
    if (!brief.includes(`**Do backlog task ${TASK.id}.**`) || !brief.includes(TASK.title)) fail("brief", "brief does not carry the task");
    if (!brief.includes(`Journal issue: #${journal}.`)) fail("brief", "brief names the wrong journal");
    if (!brief.includes(`\`<!-- journal run:${runId} agent:${AGENT} -->\``)) fail("brief", "brief journal marker does not carry the claim's run id");
    if (!brief.includes(`repos/${REPO}/issues/${journal}/comments`)) fail("brief", "brief post command names the wrong journal");
  }

  // journal
  const comments = fake.commentsOn(journal);
  const entries = comments.filter((c) => c.body.startsWith(`<!-- journal run:${runId} agent:${AGENT} -->`));
  if (entries.length !== 1) fail("journal", `${entries.length} journal entries for run ${runId}, wanted 1`);
  else if (!entries[0].body.includes("**Outcome:**") || entries[0].user.login !== roster.founder) fail("journal", "journal entry was not completed by the lane identity");

  // receipt
  const receipts = comments.filter((c) => c.body.startsWith(`<!-- receipt run:${runId} agent:${AGENT} cost:${COST.toFixed(4)} -->`));
  if (receipts.length !== 1) fail("receipt", `${receipts.length} receipts for run ${runId} with cost ${COST}, wanted 1`);
  else if (/No journal entry was written/.test(receipts[0].body)) fail("receipt", "receipt says no journal entry was written");
  else if (!receipts[0].body.includes(`task ${TASK.id}`)) fail("receipt", "receipt does not name the task");

  // release
  if (obs.final.state.claims?.[AGENT]) fail("release", `claim still held: ${JSON.stringify(obs.final.state.claims[AGENT])}`);
  if (/working:/.test(row(obs.final.text))) fail("release", "board still shows the agent working");
  if (!obs.final.text.includes(`Estimated spend today: **$${COST.toFixed(2)}** from 1 run receipts`)) fail("release", "final board spend does not count the receipt");

  if (fake.unhandled.length) fail("any", `scripts called paths the fake does not serve: ${fake.unhandled.join(", ")}`);
  return fails;
}

test("backlog has a task to force", () => {
  assert.ok(TASK?.id, "docs/BACKLOG.md has no tasks");
});

test("lane runs end to end: claim, brief, journal, receipt, release", async () => {
  const obs = await runLane();
  try {
    assert.deepEqual(verify(obs), []);
    // Every GitHub call went to the fake, through the shim.
    assert.ok(obs.fake.requests.length > 10);
    assert.ok(obs.fake.requests.every((r) => r.path.startsWith(`/repos/${REPO}`)));
    // The board issue was created by the dispatcher on the fake, not seeded.
    assert.equal(obs.fake.issuesLabelled("agent-board").length, 1);
    // Write traffic is exactly the lane's: board create and updates, the
    // journal entry and its completion, and the receipt. No label, journal,
    // PR or handoff writes.
    const writes = obs.fake.writes().map((r) => `${r.method} ${r.path.replace(/\d+/g, "N")}`);
    assert.deepEqual([...new Set(writes)].sort(), [
      "PATCH /repos/fake-owner/fake-repo/issues/N",
      "PATCH /repos/fake-owner/fake-repo/issues/comments/N",
      "POST /repos/fake-owner/fake-repo/issues",
      "POST /repos/fake-owner/fake-repo/issues/N/comments",
    ]);
  } finally {
    rmSync(obs.tmp, { recursive: true, force: true });
  }
});

for (const step of STEPS) {
  test(`mutation: skipping "${step}" fails the lane check`, async () => {
    const obs = await runLane(new Set([step]));
    try {
      const fails = verify(obs);
      assert.ok(fails.some((f) => f.step === step), `skipping ${step} was not caught: ${JSON.stringify(fails)}`);
    } finally {
      rmSync(obs.tmp, { recursive: true, force: true });
    }
  });
}

test("fake gh refuses to run without a fake server", async () => {
  const fake = createFakeGitHub({ repo: REPO, founder: roster.founder });
  await fake.start();
  try {
    const env = { ...fake.env() };
    delete env.FAKE_GH_URL;
    await assert.rejects(run(join(fake.shimDir, "gh"), ["api", `/repos/${REPO}`], { env }), (e) => e.code === 70);
  } finally {
    await fake.close();
  }
});
