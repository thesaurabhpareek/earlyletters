// Tests for guard-open-prs.mjs (offline: the HTTP layer is injected).
import test from "node:test";
import assert from "node:assert/strict";
import { countAgentPrs, isAgentPr, main, httpGetPage, GuardError, PER_PAGE, MAX_PAGES, DEFAULT_MAX } from "./guard-open-prs.mjs";

const agentPr = (n) => ({ number: n, labels: [{ name: "agent:ops" }, { name: "from:agent" }] });
const humanPr = (n) => ({ number: n, labels: [{ name: "bug" }] });
const pager = (pages, calls = []) => async (url) => {
  calls.push(url);
  const n = Number(/[?&]page=(\d+)/.exec(url)[1]);
  const p = pages[n - 1];
  return p === undefined ? { status: 200, json: [] } : typeof p === "function" ? p() : { status: 200, json: p };
};
const sink = () => { const m = { log: [], error: [] }; return { m, out: { log: (s) => m.log.push(s), error: (s) => m.error.push(s) } }; };

test("isAgentPr: prefix match on label name only", () => {
  assert.equal(isAgentPr(agentPr(1)), true);
  assert.equal(isAgentPr({ labels: [{ name: "Agent:Product" }] }), true);
  assert.equal(isAgentPr(humanPr(1)), false);
  assert.equal(isAgentPr({ title: "agent:ops fix", labels: [] }), false);
  assert.equal(isAgentPr({ labels: [{ name: "from:agent" }] }), false);
  assert.equal(isAgentPr({}), false);
  assert.equal(isAgentPr(null), false);
});

test("counts agent PRs on one page and stops", async () => {
  const calls = [];
  const r = await countAgentPrs({ repo: "o/r", getPage: pager([[agentPr(1), humanPr(2), agentPr(3)]], calls) });
  assert.equal(r.count, 2);
  assert.equal(r.seen, 3);
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^\/repos\/o\/r\/pulls\?state=open&per_page=100&page=1$/);
});

test("paginates across full pages", async () => {
  const full = Array.from({ length: PER_PAGE }, (_, i) => (i % 2 ? agentPr(i) : humanPr(i)));
  const calls = [];
  const r = await countAgentPrs({ repo: "o/r", getPage: pager([full, full, [agentPr(1)]], calls) });
  assert.equal(r.count, 50 + 50 + 1);
  assert.equal(calls.length, 3);
});

test("an exactly-full last page triggers one more request (empty page ends it)", async () => {
  const full = Array.from({ length: PER_PAGE }, (_, i) => humanPr(i));
  const calls = [];
  const r = await countAgentPrs({ repo: "o/r", getPage: pager([full], calls) });
  assert.equal(r.count, 0);
  assert.equal(calls.length, 2);
});

test("fails closed when the pagination cap is hit", async () => {
  const full = Array.from({ length: PER_PAGE }, (_, i) => humanPr(i));
  await assert.rejects(countAgentPrs({ repo: "o/r", getPage: async () => ({ status: 200, json: full }) }), /pagination cap hit/);
  await assert.rejects(countAgentPrs({ repo: "o/r", maxPages: 2, getPage: async () => ({ status: 200, json: full }) }), GuardError);
});

test("MAX_PAGES requests are made before the cap error", async () => {
  const full = Array.from({ length: PER_PAGE }, (_, i) => humanPr(i));
  let n = 0;
  await assert.rejects(countAgentPrs({ repo: "o/r", getPage: async () => { n++; return { status: 200, json: full }; } }));
  assert.equal(n, MAX_PAGES);
});

test("fails closed on HTTP error, thrown error, and bad shape", async () => {
  await assert.rejects(countAgentPrs({ repo: "o/r", getPage: async () => ({ status: 403, json: { message: "rate limit" } }) }), /HTTP 403/);
  await assert.rejects(countAgentPrs({ repo: "o/r", getPage: async () => { throw new Error("ECONNRESET"); } }), /ECONNRESET/);
  await assert.rejects(countAgentPrs({ repo: "o/r", getPage: async () => ({ status: 200, json: { not: "array" } }) }), /not an array/);
  await assert.rejects(countAgentPrs({ repo: "o/r", getPage: async () => undefined }), /HTTP undefined/);
});

test("a failure on a later page fails the whole count", async () => {
  const full = Array.from({ length: PER_PAGE }, () => agentPr(1));
  await assert.rejects(countAgentPrs({ repo: "o/r", getPage: pager([full, () => ({ status: 502, json: null })]) }), /HTTP 502/);
});

test("rejects a bad repo string (no path injection)", async () => {
  for (const repo of ["", undefined, "o", "o/r/extra", "o/r?x=1", "../x/y", "o/r#"]) {
    await assert.rejects(countAgentPrs({ repo, getPage: async () => ({ status: 200, json: [] }) }), /invalid --repo/, String(repo));
  }
});

test("main: below max exits 0, at max exits 1, above exits 1", async () => {
  const mk = (n) => pager([Array.from({ length: n }, (_, i) => agentPr(i))]);
  let s = sink();
  assert.equal(await main(["--max", "15", "--repo", "o/r"], { out: s.out, getPage: mk(14) }), 0);
  assert.match(s.m.log[0], /14 open agent:\* PRs/);
  s = sink();
  assert.equal(await main(["--max", "15", "--repo", "o/r"], { out: s.out, getPage: mk(15) }), 1);
  assert.match(s.m.error[0], /15 open agent:\* PRs in o\/r, at or above the limit of 15/);
  s = sink();
  assert.equal(await main(["--max", "15", "--repo", "o/r"], { out: s.out, getPage: mk(40) }), 1);
});

test("main: human PRs do not count toward the max", async () => {
  const s = sink();
  const code = await main(["--max", "2", "--repo", "o/r"], { out: s.out, getPage: pager([[humanPr(1), humanPr(2), humanPr(3), agentPr(4)]]) });
  assert.equal(code, 0);
});

test("main: bad arguments and API failure exit 2", async () => {
  const ok = pager([[]]);
  for (const argv of [["--max", "0", "--repo", "o/r"], ["--max", "x", "--repo", "o/r"], ["--max", "5"], ["--max"], ["stray"]]) {
    const s = sink();
    assert.equal(await main(argv, { out: s.out, env: {}, getPage: ok }), 2, argv.join(" "));
    assert.match(s.m.error[0], /failing closed/);
  }
  const s = sink();
  assert.equal(await main(["--max", "5", "--repo", "o/r"], { out: s.out, getPage: async () => ({ status: 500, json: null }) }), 2);
});

test("--max defaults to 15 (explicit, equal to the stop gate) when omitted", async () => {
  assert.equal(DEFAULT_MAX, 15);
  const mk = (n) => pager([Array.from({ length: n }, (_, i) => agentPr(i))]);
  assert.equal(await main(["--repo", "o/r"], { out: sink().out, getPage: mk(14) }), 0);
  assert.equal(await main(["--repo", "o/r"], { out: sink().out, getPage: mk(15) }), 1);
});

test("main: repo falls back to GITHUB_REPOSITORY", async () => {
  const s = sink();
  assert.equal(await main(["--max", "5"], { out: s.out, env: { GITHUB_REPOSITORY: "o/r" }, getPage: pager([[]]) }), 0);
});

test("httpGetPage: sends bearer token, REST url, parses status and json", async () => {
  let seen;
  const f = async (url, init) => { seen = { url, init }; return { status: 200, json: async () => [1] }; };
  const r = await httpGetPage("tok", "https://api.example.test", f)("/repos/o/r/pulls?page=1");
  assert.deepEqual(r, { status: 200, json: [1] });
  assert.equal(seen.url, "https://api.example.test/repos/o/r/pulls?page=1");
  assert.equal(seen.init.headers.authorization, "Bearer tok");
  assert.ok(!seen.url.includes("graphql"));
  const noJson = await httpGetPage("", "https://x.test", async () => ({ status: 200, json: async () => { throw new Error("bad"); } }))("/a");
  assert.equal(noJson.json, null);
});
