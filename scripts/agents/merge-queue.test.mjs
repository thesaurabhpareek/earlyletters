// Tests for merge-queue.mjs. A fake API is injected: no network, no gh, no real repo state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQueue, parseReview, parseClaims, parseArgs, formatTable, reviewState, touchesNative, clean } from "./merge-queue.mjs";

const OLD = "c5cfa0cfaa96a0ba97ca5f34629747ab0badf438";
const HEAD = "a83634ced2a5ecf32717bf833f941b892fc660b9";
const NOW = new Date("2026-11-09T12:00:00Z");
const ago = (min) => new Date(NOW - min * 60000).toISOString();
const review = (lens, sha, extra = "", author_association = "MEMBER") => ({ body: `## Review ${lens} at ${sha}: PASS\n${extra}`, author_association });
const run = (id, name, conclusion, status = "completed") => ({ id, name, status, conclusion });
const good = [run(1, "required", "success"), run(2, "compliance-fence", "success"), run(3, "applied migrations unchanged", "success")];
const PROT = { required_status_checks: { contexts: ["applied migrations unchanged", "required", "compliance-fence"] } };

function fake({ comments = [], runs = good, pushedMin = 60, state = "clean", extraPrs = [], calls = [], files = ["docs/x.md"], protection = PROT } = {}) {
  return async (path, opts = {}) => {
    calls.push({ path, method: opts.method });
    const p = path.split("?")[0];
    if (p.endsWith("/pulls")) return [{ number: 7, draft: false, head: { sha: HEAD }, base: { ref: "develop" } }, { number: 8, draft: true, head: { sha: OLD }, base: { ref: "develop" } }, ...extraPrs];
    if (p.includes("/branches/") && p.endsWith("/protection")) { if (!protection) throw new Error("403"); return protection; }
    if (p.endsWith("/pulls/7/files")) return files.map((filename) => ({ filename }));
    if (p.endsWith("/pulls/7")) return { mergeable_state: state };
    if (p.endsWith("/issues/7/comments")) return comments;
    if (p.endsWith(`/commits/${HEAD}/check-runs`)) return { check_runs: runs };
    if (p.endsWith(`/commits/${HEAD}`)) return { commit: { committer: { date: ago(pushedMin) } } };
    throw new Error(`unexpected ${path}`);
  };
}
const verdict = async (opts, quietMinutes = 10) => {
  const rows = await buildQueue({ api: fake(opts), now: NOW, quietMinutes });
  assert.equal(rows.length, 1, "draft PR is skipped");
  return rows[0];
};

test("both reviews at head, checks green, quiet: READY", async () => {
  const r = await verdict({ comments: [review("A", HEAD), review("B", HEAD)] });
  assert.equal(r.verdict, "READY");
  assert.equal(r.head, HEAD);
  assert.equal(r.pushAgeMinutes, 60);
});

test("review at an old sha is STALE-REVIEW", async () => {
  const r = await verdict({ comments: [review("A", OLD), review("B", OLD)] });
  assert.equal(r.verdict, "STALE-REVIEW");
  const half = await verdict({ comments: [review("A", HEAD), review("B", OLD)] });
  assert.equal(half.verdict, "STALE-REVIEW");
});

test("no review at all is NEEDS-REVIEW; a short sha does not count", async () => {
  assert.equal((await verdict({ comments: [] })).verdict, "NEEDS-REVIEW");
  const short = { body: `## Review A at ${HEAD.slice(0, 12)}: PASS` };
  assert.equal((await verdict({ comments: [short, review("B", HEAD)] })).verdict, "NEEDS-REVIEW");
});

test("words like failure, unless, until in the first 15 lines do not change the reading", async () => {
  const noise = Array.from({ length: 15 }, (_, i) => `line ${i}: no failure unless fixed until later`).join("\n");
  const r = await verdict({ comments: [review("A", HEAD, noise), review("B", HEAD, noise)] });
  assert.equal(r.verdict, "READY");
  assert.deepEqual(parseReview(`## Review A at ${HEAD}: PASS\r\nfailure`), { lens: "A", sha: HEAD, word: "PASS" });
  assert.equal(parseReview(`intro\n## Review A at ${HEAD}: PASS`), null, "must be the first line");
  assert.equal(parseReview(`## Review A at ${HEAD}: FAIL`).word, "FAIL");
  assert.equal(parseReview(`## Review A at ${HEAD.toUpperCase()}: PASS`), null);
});

test("head pushed 2 minutes ago is WAIT-QUIET; passes with --quiet-minutes 1", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, pushedMin: 2 })).verdict, "WAIT-QUIET");
  assert.equal((await verdict({ comments, pushedMin: 2 }, 1)).verdict, "READY");
});

test("missing compliance-fence is WAIT-CI", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const r = await verdict({ comments, runs: [run(1, "required", "success"), run(3, "applied migrations unchanged", "success")] });
  assert.equal(r.verdict, "WAIT-CI");
  assert.equal(r.checks["compliance-fence"], "missing");
});

test("queued and in_progress are counted separately; unfinished required is WAIT-CI", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const runs = [run(1, "required", null, "in_progress"), run(2, "compliance-fence", "success"), run(3, "applied migrations unchanged", "success"), run(4, "lint", null, "queued")];
  const r = await verdict({ comments, runs });
  assert.deepEqual([r.verdict, r.checks.queued, r.checks.inProgress], ["WAIT-CI", 1, 1]);
});

test("a failed required check is CI-FAIL; a newer rerun wins over an older failure", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, runs: [run(1, "required", "failure"), run(2, "compliance-fence", "success"), run(3, "applied migrations unchanged", "success")] })).verdict, "CI-FAIL");
  const rerun = [run(1, "required", "failure"), run(5, "required", "success"), run(2, "compliance-fence", "success"), run(3, "applied migrations unchanged", "success")];
  assert.equal((await verdict({ comments, runs: rerun })).verdict, "READY");
});

test("dirty is DIRTY; unstable is allowed; blocked is WAIT-CI", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, state: "dirty" })).verdict, "DIRTY");
  assert.equal((await verdict({ comments, state: "unstable" })).verdict, "READY");
  assert.equal((await verdict({ comments, state: "blocked" })).verdict, "WAIT-CI");
});

test("every request is a GET on a repo path; output never contains Authorization", async () => {
  const calls = [];
  const rows = await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)], calls }), now: NOW });
  assert.ok(calls.length > 0 && calls.every((c) => c.method === "GET" && c.path.startsWith("repos/")));
  const out = formatTable(rows) + JSON.stringify(rows);
  assert.doesNotMatch(out, /authorization|bearer|token/i);
});

test("required contexts come from branch protection; an extra context must be green", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const protection = { required_status_checks: { contexts: ["required", "extra gate"] } };
  const r = await verdict({ comments, protection });
  assert.equal(r.verdict, "WAIT-CI");
  assert.deepEqual(r.required, ["required", "extra gate"]);
});

test("unreadable protection falls back to the three contexts and prints a notice", async () => {
  const notices = [];
  const rows = await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)], protection: null }), now: NOW, notices });
  assert.deepEqual(rows[0].required, ["applied migrations unchanged", "required", "compliance-fence"]);
  assert.equal(rows[0].verdict, "READY");
  assert.match(notices[0], /^notice: branch protection/);
});

const MAC = [run(10, "iOS simulator build (no signing)", "success"), run(11, "store-profile Release launch (testflight env, no seam, 20 s)", "success")];

test("lockfile change with a red iOS build is WATCH-RED naming the check", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const runs = [...good, run(10, "iOS simulator build (no signing)", "failure"), MAC[1]];
  const r = await verdict({ comments, runs, files: ["package-lock.json"] });
  assert.equal(r.verdict, "WATCH-RED iOS simulator build (no signing)");
});

test("native path with macOS checks missing or running is WAIT-CI; green is READY", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, files: ["apps/mobile/app.config.ts"] })).verdict, "WAIT-CI");
  const running = [...good, run(10, "iOS simulator build (no signing)", null, "in_progress"), MAC[1]];
  assert.equal((await verdict({ comments, runs: running, files: ["apps/mobile/ios/Podfile"] })).verdict, "WAIT-CI");
  assert.equal((await verdict({ comments, runs: [...good, ...MAC], files: ["apps/mobile/eas.json"] })).verdict, "READY");
});

test("a PR touching no native path: macOS red or running shows as watch, does not block", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const runs = [...good, run(10, "iOS simulator build (no signing)", null, "queued"), run(11, "store-profile Release launch (testflight env, no seam, 20 s)", "failure")];
  const r = await verdict({ comments, runs, files: ["docs/a.md", "apps/mobile/src/a.ts"] });
  assert.equal(r.verdict, "READY");
  assert.equal(r.watch.length, 2);
  assert.match(formatTable([r]), /WATCH iOS:pending|WATCH iOS:/);
});

test("READY row ends with the exact founder ask at the full head sha", async () => {
  const rows = await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)] }), now: NOW });
  assert.equal(rows[0].founderAsk, `Merge #7 at ${HEAD}`);
  assert.equal(formatTable(rows).split("\n").at(-1), `Merge #7 at ${HEAD}`);
});

test("claims are read from table rows and by-lines; flags parse", async () => {
  const claims = parseClaims("| #7 | ops | 2026-11-09 |\nclaimed #9 by @mobile\nno number here @x\n");
  assert.deepEqual(claims, { 7: "ops", 9: "mobile" });
  const rows = await buildQueue({ api: fake({ comments: [] }), now: NOW, claims });
  assert.equal(rows[0].claim, "ops");
  assert.deepEqual(parseArgs(["--json", "--quiet-minutes", "3", "--only", "ready"]), { json: true, quietMinutes: 3, only: "READY", repo: "thesaurabhpareek/earlyletters", base: "develop", allBases: false });
  assert.throws(() => parseArgs(["--merge"]));
});

test("a PASS from NONE, CONTRIBUTOR or FIRST_TIME_CONTRIBUTOR is ignored; trusted ones count", async () => {
  for (const who of ["NONE", "CONTRIBUTOR", "FIRST_TIME_CONTRIBUTOR", null]) {
    const r = await verdict({ comments: [review("A", HEAD, "", who), review("B", HEAD, "", who)] });
    assert.equal(r.verdict, "NEEDS-REVIEW", String(who));
    assert.deepEqual(r.reviews.untrusted, ["A", "B"]);
    assert.match(formatTable([r]), /note: #7 held back/);
  }
  for (const who of ["OWNER", "MEMBER", "COLLABORATOR"]) {
    assert.equal((await verdict({ comments: [review("A", HEAD, "", who), review("B", HEAD, "", who)] })).verdict, "READY", who);
  }
  const mixed = await verdict({ comments: [review("A", HEAD), review("B", HEAD, "", "NONE")] });
  assert.equal(mixed.verdict, "NEEDS-REVIEW");
  const out = formatTable((await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)] }), now: NOW })));
  assert.doesNotMatch(out, /held back/);
});

const at = (n) => ({ created_at: `2026-11-09T10:0${n}:00Z`, id: n });
const v = (lens, word, n, who = "MEMBER") => ({ body: `## Review ${lens} at ${HEAD}: ${word}\nbody`, author_association: who, ...at(n) });

test("veto: newest trusted verdict per lens at head decides", async () => {
  assert.equal((await verdict({ comments: [v("A", "PASS", 1), v("B", "PASS", 2), v("A", "BLOCKED", 3)] })).verdict, "BLOCKED-REVIEW");
  assert.equal((await verdict({ comments: [v("A", "BLOCKED", 1), v("A", "PASS", 2), v("B", "PASS", 3)] })).verdict, "READY");
  assert.equal((await verdict({ comments: [v("A", "PASS", 1), v("B", "PASS", 2), v("B", "CHANGES", 5)] })).verdict, "BLOCKED-REVIEW");
  const cr = await verdict({ comments: [{ ...review("A", OLD), ...at(1) }, v("B", "PASS", 2), v("A", "CHANGES", 3)] });
  assert.equal(cr.verdict, "BLOCKED-REVIEW", "CHANGES at head with an older PASS is not met");
  assert.match(formatTable([cr]), /note: #7 review not met, newest at head: A=CHANGES/);
  // array order is used when created_at and id are absent
  assert.equal((await verdict({ comments: [review("A", HEAD), review("B", HEAD), { body: `## Review A at ${HEAD}: BLOCKED`, author_association: "OWNER" }] })).verdict, "BLOCKED-REVIEW");
});

test("PASS WITH NOTES and PASS. are not met (chosen: only the exact word PASS)", async () => {
  assert.equal((await verdict({ comments: [v("A", "PASS WITH NOTES", 1), v("B", "PASS", 2)] })).verdict, "BLOCKED-REVIEW");
  assert.equal(reviewState([v("A", "PASS.", 1)], HEAD).A, false);
});

test("an untrusted BLOCKED does not veto a trusted PASS", async () => {
  assert.equal((await verdict({ comments: [v("A", "PASS", 1), v("B", "PASS", 2), v("A", "BLOCKED", 3, "NONE")] })).verdict, "READY");
});

test("the exact poc sequence from the review: PASS, PASS, A BLOCKED, B CHANGES", () => {
  const c = (b) => ({ body: b, author_association: "MEMBER" });
  const s = reviewState([c(`## Review A at ${HEAD}: PASS`), c(`## Review B at ${HEAD}: PASS`), c(`## Review A at ${HEAD}: BLOCKED\nissues`), c(`## Review B at ${HEAD}: CHANGES`)], HEAD);
  assert.equal(s.A, false);
  assert.equal(s.B, false);
  assert.deepEqual(s.blocked, { A: "BLOCKED", B: "CHANGES" });
  for (const b of [`## review A at ${HEAD}: PASS`, ` ## Review A at ${HEAD}: PASS`, `## Review A  at ${HEAD}: PASS`, `\uFEFF## Review A at ${HEAD}: PASS`]) assert.equal(parseReview(b), null);
});

function multiBase(opts) {
  const base = fake(opts);
  return async (path, o) => {
    const p = path.split("?")[0];
    if (p.endsWith("/pulls")) return [{ number: 7, draft: false, head: { sha: HEAD }, base: { ref: "develop" } }, { number: 9, draft: false, head: { sha: HEAD }, base: { ref: "main" } }];
    if (p.endsWith("/pulls/9")) return base(path.replace("/pulls/9", "/pulls/7"), o);
    if (p.includes("/issues/9/")) return base(path.replace("/issues/9/", "/issues/7/"), o);
    if (p.endsWith("/pulls/9/files")) return base(path.replace("/pulls/9/", "/pulls/7/"), o);
    return base(path, o);
  };
}

test("default lists develop only; --all-bases shows OTHER-BASE with no Merge ask", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const rows = await buildQueue({ api: multiBase({ comments }), now: NOW });
  assert.deepEqual(rows.map((r) => r.number), [7]);
  const all = await buildQueue({ api: multiBase({ comments }), now: NOW, allBases: true });
  assert.deepEqual(all.map((r) => [r.number, r.verdict]), [[7, "READY"], [9, "OTHER-BASE"]]);
  const out = formatTable(all);
  assert.match(out, /Merge #7 at /);
  assert.doesNotMatch(out, /Merge #9/);
  const main = await buildQueue({ api: multiBase({ comments }), now: NOW, base: "main" });
  assert.deepEqual(main.map((r) => [r.number, r.verdict, !!r.founderAsk]), [[9, "READY", true]]);
});

test("ANSI and control characters are stripped from check names, base and claim holders", async () => {
  assert.equal(clean("a\u001b[31mred\u001b[0m\u0007b\n"), "aredb");
  const claims = parseClaims("| #7 | ops\u001b[2J | x |");
  assert.equal(claims[7], "ops");
  const runs = [...good, run(9, "evil\u001b[31m\u0007 check", "success")];
  const rows = await buildQueue({ api: fake({ comments: [], runs }), now: NOW });
  const out = formatTable(rows) + JSON.stringify(rows);
  assert.doesNotMatch(out, /[\u0000-\u0008\u000b-\u001f]/.source ? /\u001b|\u0007/ : /x/);
  const mac = [...good, run(10, "iOS simulator build\u001b[31m (x)", "failure")];
  const wr = await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)], runs: mac, files: ["package-lock.json"] }), now: NOW });
  assert.doesNotMatch(JSON.stringify(wr) + formatTable(wr), /\u001b/);
});

test("--repo is validated", () => {
  for (const bad of ["a", "a/b/c", "a/b;rm", "a b/c", "../x", "a/b\u001b[0m"]) assert.throws(() => parseArgs(["--repo", bad]), /--repo/, bad);
  assert.equal(parseArgs(["--repo", "o.w-n_1/re.po-1"]).repo, "o.w-n_1/re.po-1");
  assert.equal(parseArgs(["--all-bases"]).allBases, true);
  assert.equal(parseArgs(["--base", "main"]).base, "main");
});

test("rename out of a native path is caught through previous_filename", async () => {
  assert.equal(touchesNative([{ filename: "docs/moved.m", previous_filename: "apps/mobile/ios/Podfile" }]), true);
  assert.equal(touchesNative([{ filename: "docs/a.md", previous_filename: "docs/b.md" }]), false);
  const api = fake({ comments: [review("A", HEAD), review("B", HEAD)] });
  const wrapped = async (path, o) => (path.includes("/pulls/7/files") ? [{ filename: "docs/m", previous_filename: "apps/mobile/modules/x.swift" }] : api(path, o));
  assert.equal((await buildQueue({ api: wrapped, now: NOW }))[0].verdict, "WAIT-CI", "native rule applies, macOS checks missing");
});

test("an unparsable or missing head commit date is not quiet", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  for (const date of ["not a date", undefined]) {
    const api = fake({ comments });
    const w = async (path, o) => (path.endsWith(`/commits/${HEAD}`) ? { commit: { committer: { date } } } : api(path, o));
    const r = (await buildQueue({ api: w, now: NOW }))[0];
    assert.equal(r.verdict, "WAIT-QUIET", String(date));
    assert.equal(r.pushAgeMinutes, null);
  }
});

test("hitting the 30-page cap warns instead of stopping silently", async () => {
  const notices = [];
  const full = Array.from({ length: 100 }, (_, i) => ({ body: `c${i}` }));
  const api = fake({ comments: full });
  const w = async (path, o) => (path.includes("/issues/7/comments") ? full : api(path, o));
  await buildQueue({ api: w, now: NOW, notices });
  assert.ok(notices.some((n) => /pagination cap of 30 pages/.test(n)));
});

test("a head that moved between the list and the detail call is not trusted (WAIT-CI)", async () => {
  const api = fake({ comments: [review("A", HEAD), review("B", HEAD)] });
  const w = async (path, o) => (path.endsWith("/pulls/7") ? { mergeable_state: "clean", head: { sha: OLD } } : api(path, o));
  assert.equal((await buildQueue({ api: w, now: NOW }))[0].verdict, "WAIT-CI");
});
