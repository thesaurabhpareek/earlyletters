// Commit provenance: trailer parsing and the agent share. Synthetic logs only. Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { parseTrailers, classify, parseLog, summarize, logArgs, main } from "./provenance.mjs";

const TRAILERS = "Agent: ops\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_x";
const c = (body, hash = "a".repeat(40)) => ({ hash, subject: "s", date: "2026-10-20T00:00:00Z", body });

test("trailers are read from the last paragraph, keys case-insensitive", () => {
  const t = parseTrailers(`subject\n\nbody\n\nagent: ops\nCO-AUTHORED-BY: x <x@y>`);
  assert.deepEqual(t.map((x) => x.key), ["agent", "co-authored-by"]);
});

test("an Agent: line in prose does not count as a trailer", () => {
  assert.equal(classify(c("s\n\nAgent: ops wrote this\nmore prose\n\nCloses nothing.")).agent, false);
  assert.equal(classify(c("s\n\nAgent: ops\nnot a trailer line")).agent, false, "a mixed final paragraph is prose");
});

test("a commit with all three trailers is fully attributed", () => {
  const r = classify(c(`s\n\n${TRAILERS}`));
  assert.deepEqual([r.agent, r.coAuthoredBy, r.claudeSession, r.agentHandle], [true, true, true, "ops"]);
});

test("a subject-only commit has no trailers", () => {
  const r = classify(c("just a subject"));
  assert.deepEqual([r.agent, r.coAuthoredBy, r.claudeSession], [false, false, false]);
});

test("an Agent: value that is not a handle is flagged malformed, not counted", () => {
  const r = classify(c("s\n\nAgent: Ops Team!"));
  assert.equal(r.agent, false);
  assert.equal(r.agentMalformed, true);
});

test("empty trailer values do not count", () => {
  assert.equal(classify(c("s\n\nAgent:\nClaude-Session:")).claudeSession, false);
});

test("CRLF messages parse", () => {
  assert.equal(classify(c("s\r\n\r\nAgent: ops\r\n")).agent, true);
});

test("parseLog splits records and keeps multi-paragraph bodies", () => {
  const raw = `h1\x1f2026-10-20T00:00:00Z\x1fone\x1fone\n\nAgent: ops\n\x1e\nh2\x1f2026-10-21T00:00:00Z\x1ftwo\x1ftwo\n\x1e`;
  const l = parseLog(raw);
  assert.equal(l.length, 2);
  assert.equal(l[1].hash, "h2");
  assert.equal(classify(l[0]).agent, true);
});

test("summary: 1 of 4 agent commits is 25 percent, per-agent counts add up", () => {
  const s = summarize([c(`s\n\n${TRAILERS}`), c("s\n\nCo-Authored-By: a <a@b>"), c("x"), c("y")]);
  assert.equal(s.total, 4);
  assert.equal(s.agent, 1);
  assert.equal(s.agentSharePct, 25);
  assert.equal(s.coAuthoredBy, 2);
  assert.deepEqual(s.byAgent, { ops: 1 });
});

test("an empty range gives 0 percent, not NaN", () => {
  const s = summarize([]);
  assert.deepEqual([s.total, s.agentSharePct], [0, 0]);
});

test("a date cut-off uses --since, a revision uses a range", () => {
  assert.ok(logArgs("2026-10-19", "origin/develop").includes("--since=2026-10-19"));
  assert.ok(logArgs("abc123", "origin/develop").includes("abc123..origin/develop"));
});

test("the CLI is warn-only: exit 0 with no args, and with an unknown revision", () => {
  const out = [];
  assert.equal(main([], (x) => out.push(x)), 0);
  assert.equal(main(["--since", "no-such-rev-xyz"], (x) => out.push(x)), 0);
  assert.match(out.join("\n"), /WARN: provenance could not read git log/);
});

test("end to end on a synthetic repo: --json reports the real counts", () => {
  const d = execFileSync("mktemp", ["-d"], { encoding: "utf8" }).trim();
  const git = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@e.x", ...a], { cwd: d, encoding: "utf8" });
  git("init", "-q");
  git("commit", "-q", "--allow-empty", "-m", "base");
  git("commit", "-q", "--allow-empty", "-m", `with\n\n${TRAILERS}`);
  git("commit", "-q", "--allow-empty", "-m", "without");
  const out = execFileSync("node", [new URL("./provenance.mjs", import.meta.url).pathname, "--since", "HEAD~2", "--json"], { cwd: d, encoding: "utf8" });
  const s = JSON.parse(out);
  assert.deepEqual([s.total, s.agent, s.agentSharePct], [2, 1, 50]);
});
