// The dispatcher end to end against a fake `gh` CLI (H2: freezes, honest status,
// honest spend, run traces). No network, no GitHub writes: every case is a
// --dry-run in a temporary copy of the harness with fixture roster and backlog,
// and each case asserts the fake saw only GET requests.
// Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, copyFileSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = "test/repo";
const FOUNDER = "founder-login";
const NOW = Date.now();
const iso = (msFromNow) => new Date(NOW + msFromNow).toISOString();
const day = (daysFromNow) => iso(daysFromNow * 86_400_000).slice(0, 10);
const b64 = (s) => Buffer.from(s).toString("base64");

const ROSTER = {
  version: 1,
  repo: REPO,
  base_branch: "develop",
  founder: FOUNDER,
  trusted_bots: ["claude[bot]"],
  limits: { max_runs_per_day_total: 30, max_parallel: 6, digest_hour_utc: 14, claim_grace_minutes: 20, max_open_agent_prs: 10 },
  engines: { opencode: { version: "1", default_model: "openrouter/x/y", default_budget_usd: 2 } },
  defaults: { engine: "opencode", max_turns: 80, timeout_minutes: 50, daily_runs: 2, wip_limit: 1 },
  departments: { engineering: "000000" },
  agents: [
    { handle: "payments", title: "Payments Engineer", department: "engineering", backlog_owner_names: ["payments engineer"], daily_runs: 2, wip_limit: 1 },
    { handle: "qa", title: "QA Engineer", department: "engineering", backlog_owner_names: ["qa engineer"], daily_runs: 2, wip_limit: 1 },
  ],
};

const BACKLOG = `# Backlog

## M8. Payments

#### BL-900 Plan reminders on the device
- Status: ready. Mode: agent. Owner: payments engineer. Size: S.
- Scope: code in \`apps/mobile/src/lib/billing/\`, copy in \`packages/content/src/billing.ts\`.

#### BL-901 Test plan page
- Status: ready. Mode: agent. Owner: qa engineer. Size: S.
- Scope: \`docs/qa/PLAN.md\`.
`;

const FAKE_GH = `#!/usr/bin/env node
const fs = require("fs");
const dir = process.env.FAKE_GH_DIR;
const a = process.argv.slice(2);
const method = a[a.indexOf("-X") + 1];
const path = a.find((x, i) => i > 0 && x.startsWith("/"));
fs.appendFileSync(dir + "/calls.log", method + " " + path + "\\n");
const routes = JSON.parse(fs.readFileSync(dir + "/routes.json", "utf8"));
for (const r of routes) {
  if ((r.method ?? "GET") === method && new RegExp(r.re).test(path)) { process.stdout.write(JSON.stringify(r.body)); process.exit(0); }
}
process.stdout.write(method === "GET" ? "[]" : "{}");
`;

const user = (login, type = "User") => ({ login, type });
const comment = (body, login = FOUNDER, at = iso(-60_000), type = "User") => ({ body, user: user(login, type), created_at: at, author_association: login === FOUNDER ? "OWNER" : "NONE" });
const state = (s) => `<!-- agents-state:${b64(JSON.stringify(s))} -->`;

/** Build a temp harness, run dispatch.mjs in it, and return { out, calls }. */
function run({ args = ["--dry-run"], env = {}, routes = [], board, freezeText, localFreeze } = {}) {
  const root = mkdtempSync(join(tmpdir(), "dispatch-test-"));
  mkdirSync(join(root, "scripts", "agents"), { recursive: true });
  for (const f of readdirSync(HERE)) if (f.endsWith(".mjs") && !f.endsWith(".test.mjs")) copyFileSync(join(HERE, f), join(root, "scripts", "agents", f));
  mkdirSync(join(root, "agents"), { recursive: true });
  mkdirSync(join(root, "docs"), { recursive: true });
  writeFileSync(join(root, "agents", "roster.json"), JSON.stringify(ROSTER));
  writeFileSync(join(root, "docs", "BACKLOG.md"), BACKLOG);
  if (localFreeze !== undefined) writeFileSync(join(root, "agents", "freeze.json"), localFreeze);
  const bin = join(root, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "gh"), FAKE_GH);
  chmodSync(join(bin, "gh"), 0o755);
  const all = [
    { re: "/issues\\?state=open&labels=journal", body: [
      { number: 11, html_url: "https://example.test/11", labels: [{ name: "journal" }, { name: "agent:payments" }] },
      { number: 12, html_url: "https://example.test/12", labels: [{ name: "journal" }, { name: "agent:qa" }] },
    ] },
    { re: "/issues\\?state=open&labels=agent-board", body: [{ number: 24, body: board ?? "" }] },
    ...(freezeText !== undefined ? [{ re: "/contents/agents/freeze\\.json\\?ref=develop$", body: { content: b64(freezeText) } }] : []),
    ...routes,
  ];
  writeFileSync(join(root, "routes.json"), JSON.stringify(all));
  writeFileSync(join(root, "calls.log"), "");
  const out = execFileSync(process.execPath, [join(root, "scripts", "agents", "dispatch.mjs"), ...args], {
    encoding: "utf8",
    env: { PATH: `${bin}:${process.env.PATH}`, HOME: root, GITHUB_REPOSITORY: REPO, FAKE_GH_DIR: root, ...env },
  });
  const calls = readFileSync(join(root, "calls.log"), "utf8").split("\n").filter(Boolean);
  return { out, calls, root };
}

const assignmentsOf = (out) => JSON.parse(out.slice(out.lastIndexOf("\n[")));
const onlyReads = (calls) => assert.deepEqual(calls.filter((c) => !c.startsWith("GET ")), [], "a dry run must not write");
const freezeFile = (freezes) => JSON.stringify({ freezes });
const BILLING_FREEZE = { id: "F-1", globs: ["apps/mobile/src/lib/billing/**"], until: day(10), reason: "build 3 is frozen", decided_by: "D-120" };

// ---------- status names the lane and mode ----------

test("a local board-only run names its lane and never claims to wait for engine keys", () => {
  const { out, calls } = run({ args: ["--dry-run", "--local", "--board-only"], env: { AGENTS_LANE: "cloud-4h" } });
  assert.match(out, /Status: \*\*board refresh only, no work assigned; local lane `cloud-4h`\*\*/);
  assert.doesNotMatch(out, /OPENROUTER|needs the/);
  onlyReads(calls);
});

test("the Actions lane without keys says it cannot run agents and why", () => {
  const { out } = run({ args: ["--dry-run"] });
  assert.match(out, /Status: \*\*GitHub Actions lane cannot run agents: waiting for the OPENROUTER_API_KEY secret and the agents GitHub App\*\*/);
});

test("a local assigning run says so", () => {
  const { out } = run({ args: ["--dry-run", "--local", "--top", "1"] });
  assert.match(out, /Status: \*\*assigning work; local lane `local`\*\*/);
});

// ---------- spend ----------

const receipt = (cost, extra = "") => `<!-- receipt run:r1 agent:qa${cost === null ? "" : ` cost:${cost}`} -->\nRun receipt: task BL-901, success. ${extra}`;
const spendRoute = (comments) => ({ re: "/issues/comments\\?since=", body: comments });

test("spend is unknown when any receipt lacks a cost", () => {
  const { out } = run({ routes: [spendRoute([comment(receipt("0.5000")), comment(receipt("unknown", "cost not reported."))])] });
  assert.match(out, /Spend today: \*\*unknown\*\* \(1 of 2 run receipts report no cost; the other 1 add up to \$0\.50\)/);
  assert.doesNotMatch(out, /Estimated spend today/);
});

test("old receipts that wrote 0.0000 with 'cost not reported', or no cost at all, count as unknown", () => {
  const { out } = run({ routes: [spendRoute([comment(receipt("0.0000", "cost not reported.")), comment(receipt(null))])] });
  assert.match(out, /Spend today: \*\*unknown\*\* \(2 of 2 run receipts report no cost; the other 0 add up to \$0\.00\)/);
});

test("spend is a dollar figure only when every trusted receipt reports a cost; outsiders are ignored", () => {
  const { out } = run({ routes: [spendRoute([
    comment(receipt("0.5000")), comment(receipt("0.7500")),
    comment(receipt("99.0000"), "outsider"), comment(receipt("unknown"), "outsider"),
  ])] });
  assert.match(out, /Estimated spend today: \*\*\$1\.25\*\* from 2 run receipts\./);
});

test("runs assigned today with no receipts make spend unknown, not $0.00", () => {
  const today = new Date(NOW).toISOString().slice(0, 10);
  const { out } = run({ board: state({ day: today, runs: { qa: 1 }, claims: {} }) });
  assert.match(out, /Spend today: \*\*unknown\*\* \(1 run assigned, no run receipts yet\)/);
});

test("no runs and no receipts is honestly $0.00", () => {
  const { out } = run();
  assert.match(out, /Estimated spend today: \*\*\$0\.00\*\* from 0 run receipts\./);
});

// ---------- freezes ----------

test("a task naming a frozen path is refused with the freeze reason", () => {
  const { out, calls } = run({ args: ["--dry-run", "--local", "--top", "2"], freezeText: freezeFile([BILLING_FREEZE]) });
  const a = assignmentsOf(out);
  assert.ok(!a.some((x) => x.agent === "payments"), "payments must not be assigned BL-900");
  assert.ok(a.some((x) => x.agent === "qa" && x.task === "BL-901"), "unfrozen work still runs");
  assert.match(out, /idle: frozen: task BL-900: `apps\/mobile\/src\/lib\/billing\/` is frozen until \d{4}-\d{2}-\d{2} by D-120 \(build 3 is frozen\)/);
  assert.match(out, /## Freezes\n\n- F-1: `apps\/mobile\/src\/lib\/billing\/\*\*` until/);
  onlyReads(calls);
});

test("a founder-forced task is refused too while the freeze holds", () => {
  const { out } = run({
    args: ["--dry-run", "--local", "--top", "1"],
    env: { ONLY_AGENT: "payments", FORCE_TASK: "BL-900" },
    freezeText: freezeFile([BILLING_FREEZE]),
  });
  assert.deepEqual(assignmentsOf(out), []);
  assert.match(out, /idle: frozen: task BL-900/);
});

test("an expired freeze is ignored", () => {
  const { out } = run({ args: ["--dry-run", "--local", "--top", "1"], env: { ONLY_AGENT: "payments" }, freezeText: freezeFile([{ ...BILLING_FREEZE, until: day(-1) }]) });
  assert.deepEqual(assignmentsOf(out).map((x) => [x.agent, x.task]), [["payments", "BL-900"]]);
  assert.doesNotMatch(out, /## Freezes/);
});

test("the freeze file on develop wins over the checkout's copy", () => {
  const { out } = run({
    args: ["--dry-run", "--local", "--top", "1"], env: { ONLY_AGENT: "payments" },
    freezeText: freezeFile([BILLING_FREEZE]), localFreeze: freezeFile([]),
  });
  assert.deepEqual(assignmentsOf(out), []);
});

test("the checkout's copy is used when develop has no freeze file, and the board says so", () => {
  const { out } = run({ args: ["--dry-run", "--local", "--top", "1"], env: { ONLY_AGENT: "payments" }, localFreeze: freezeFile([BILLING_FREEZE]) });
  assert.deepEqual(assignmentsOf(out), []);
  assert.match(out, /read from the local checkout/);
});

test("an invalid freeze file fails closed for task work and is flagged on the board", () => {
  const { out } = run({ args: ["--dry-run", "--local", "--top", "1"], env: { ONLY_AGENT: "qa" }, freezeText: freezeFile([{ globs: ["docs/**"], until: day(3), reason: "x" }]) });
  assert.deepEqual(assignmentsOf(out), []);
  assert.match(out, /idle: freeze file invalid, so task work is refused/);
  assert.match(out, /Freeze file invalid \(task and maintain work refused\):.*decided_by/);
});

test("maintain work on a PR that changes a frozen path is refused", () => {
  const pr = { number: 5, title: "billing fix", draft: false, created_at: iso(-86_400_000), updated_at: iso(-86_400_000), user: user(FOUNDER), labels: [{ name: "agent:payments" }], head: { sha: "abc1234", ref: "fix/billing" }, base: { ref: "develop" } };
  const { out, calls } = run({
    args: ["--dry-run", "--local", "--top", "1"], env: { ONLY_AGENT: "payments" },
    freezeText: freezeFile([{ ...BILLING_FREEZE, globs: ["supabase/migrations/**"] }]),
    routes: [
      { re: "/pulls\\?state=open", body: [pr] },
      { re: "/pulls/5$", body: { mergeable: false } },
      { re: "/pulls/5/files", body: [{ filename: "supabase/migrations/20261101000000_x.sql" }] },
    ],
  });
  assert.deepEqual(assignmentsOf(out), []);
  assert.match(out, /idle: frozen: maintain #5: `supabase\/migrations\/20261101000000_x\.sql` is frozen/);
  onlyReads(calls);
});

// ---------- run traces ----------

test("a released run is done only with a journal entry and a receipt; otherwise the board says no trace", () => {
  const at = iso(-30 * 60_000);
  const today = new Date(NOW).toISOString().slice(0, 10);
  const board = state({ day: today, runs: { payments: 1, qa: 1 }, claims: {
    payments: { mode: "task", task: "BL-900", pr: "", at, run: "local-1", source: "local" },
    qa: { mode: "task", task: "BL-901", pr: "", at, run: "local-1", source: "local" },
  } });
  const after = iso(-10 * 60_000);
  const { out, calls } = run({
    args: ["--dry-run", "--local", "--board-only", "--release", "payments,qa"],
    board,
    routes: [
      { re: "/issues/11/comments\\?since=", body: [
        comment("<!-- journal run:sess-1 agent:payments -->\nDid: things.", FOUNDER, after),
        comment("<!-- receipt run:sess-1 agent:payments cost:unknown -->\nRun receipt.", FOUNDER, after),
      ] },
      { re: "/issues/12/comments\\?since=", body: [
        comment("<!-- journal run:sess-2 agent:qa -->\nDid: things.", FOUNDER, after),
        comment("<!-- receipt run:sess-2 agent:qa cost:0.1 -->\nfake", "outsider", after),
        comment("<!-- receipt run:sess-0 agent:qa cost:0.1 -->\nolder run", FOUNDER, iso(-60 * 60_000)),
      ] },
    ],
  });
  assert.match(out, /## Finished runs \(48 hours\)/);
  assert.match(out, /- `payments` task BL-900, claimed .* UTC, released: done/);
  assert.match(out, /- `qa` task BL-901, claimed .* UTC, released: \*\*no trace \(no receipt\)\*\*/);
  onlyReads(calls);
});

test("a timed-out claim with nothing on the journal is no trace", () => {
  const today = new Date(NOW).toISOString().slice(0, 10);
  const board = state({ day: today, runs: { qa: 1 }, claims: { qa: { mode: "task", task: "BL-901", at: iso(-3 * 3_600_000), source: "local" } } });
  const { out } = run({ args: ["--dry-run", "--local", "--board-only"], board });
  assert.match(out, /- `qa` task BL-901, claimed .* UTC, timed out: \*\*no trace \(no journal entry, no receipt\)\*\*/);
});

test("a no-trace result is checked again on the next tick, so a late receipt counts", () => {
  const today = new Date(NOW).toISOString().slice(0, 10);
  const at = iso(-3 * 3_600_000);
  const board = state({ day: today, runs: {}, claims: {}, traces: [
    { agent: "qa", mode: "task", task: "BL-901", at, ended: iso(-3_600_000), how: "released", result: "no trace (no receipt)" },
  ] });
  const { out } = run({
    args: ["--dry-run", "--local", "--board-only"], board,
    routes: [{ re: "/issues/12/comments\\?since=", body: [
      comment("<!-- journal run:s agent:qa -->\nx", FOUNDER, iso(-2 * 3_600_000)),
      comment("<!-- receipt run:s agent:qa cost:unknown -->\nx", FOUNDER, iso(-30 * 60_000)),
    ] }],
  });
  assert.match(out, /- `qa` task BL-901, claimed .* UTC, released: done/);
});

