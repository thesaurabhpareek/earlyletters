// Tests for merge-queue.mjs. A fake API is injected: no network, no gh, no real repo state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STALE_UNKNOWN_MINUTES, securityLensHits, touchesSecurityLens, namedLenses, SECURITY_LENS_NAMES, SECURITY_LENS_CLASSES, buildQueue, workspaceOf, staleBase, parseReview, parseClaims, parseArgs, formatTable, reviewState, touchesNative, clean } from "./merge-queue.mjs";

const OLD = "c5cfa0cfaa96a0ba97ca5f34629747ab0badf438";
const HEAD = "a83634ced2a5ecf32717bf833f941b892fc660b9";
const NOW = new Date("2026-11-09T12:00:00Z");
const ago = (min) => new Date(NOW - min * 60000).toISOString();
const review = (lens, sha, extra = "", author_association = "MEMBER") => ({ body: `## Review ${lens} at ${sha}: PASS\n${extra}`, author_association });
const run = (id, name, conclusion, status = "completed") => ({ id, name, status, conclusion });
const good = [run(1, "required", "success"), run(2, "compliance-fence", "success"), run(3, "applied migrations unchanged", "success")];
const PROT = { required_status_checks: { contexts: ["applied migrations unchanged", "required", "compliance-fence"] } };

function fake({ changedFiles, comments = [], runs = good, pushedMin = 60, state = "clean", extraPrs = [], calls = [], files = ["docs/x.md"], protection = PROT, behindBy = 0, baseFiles = [], compareFail = false } = {}) {
  return async (path, opts = {}) => {
    calls.push({ path, method: opts.method });
    const p = path.split("?")[0];
    if (p.endsWith("/pulls")) return [{ number: 7, draft: false, head: { sha: HEAD }, base: { ref: "develop" } }, { number: 8, draft: true, head: { sha: OLD }, base: { ref: "develop" } }, ...extraPrs];
    if (p.includes("/branches/") && p.endsWith("/protection")) { if (!protection) throw new Error("403"); return protection; }
    if (p.includes("/compare/")) {
      if (compareFail) throw new Error("502");
      return p.endsWith("...develop") ? { files: baseFiles.map((filename) => ({ filename })) } : { behind_by: behindBy };
    }
    if (p.endsWith("/pulls/7/files")) return files.map((filename) => ({ filename }));
    if (p.endsWith("/pulls/7")) return { mergeable_state: state, changed_files: changedFiles === undefined ? files.length : changedFiles };
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
  assert.deepEqual(parseReview(`## Review A at ${HEAD}: PASS\r\nfailure`), { lens: "A", sha: HEAD, word: "PASS", stated: "PASS" });
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
  const comments = [review("A", HEAD, "Lens: security\n"), review("B", HEAD)];
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

test("CR-73: a READY row ends with a Karma line at the full head sha and asks the founder for nothing", async () => {
  const rows = await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)] }), now: NOW });
  const line = `#7 ready for Karma to merge (CR-73) at ${HEAD}`;
  assert.equal(rows[0].verdict, "READY");
  assert.equal(rows[0].mergeNote, line);
  assert.equal(rows[0].founderAsk, undefined);
  assert.equal(formatTable(rows).split("\n").at(-1), line);
  assert.doesNotMatch(formatTable(rows), /founder|your |paste|approve/i);
});

test("CR-73: the JSON rows keep every key callers read", async () => {
  const [r] = await buildQueue({ api: fake({ comments: [review("A", HEAD), review("B", HEAD)] }), now: NOW });
  for (const k of ["number", "head", "base", "otherBase", "pushAgeMinutes", "reviews", "mergeable_state", "required", "checks", "native", "claim", "verdict", "watch"]) assert.ok(k in r, k);
});

test("CR-73: the agent board no longer tells the founder to review or unblock PRs", () => {
  const src = readFileSync(new URL("./dispatch.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(src, /PRs ready for your review|PRs blocked on you/);
  assert.match(src, /ready for Karma to merge \(CR-73\)/);
});

const LENS = (name) => `Lens: ${name}\n`;
const secFiles = ["scripts/agents/merge-queue.mjs"];
const both = (extraA = "", extraB = "", assocB = "MEMBER") => [review("A", HEAD, extraA), review("B", HEAD, extraB, assocB)];

/** One row per path class in the CR-73 list: [class name, example paths that must hit]. */
const CLASS_ROWS = [
  [".github", [".github/workflows/ci.yml", ".github/CODEOWNERS"]], ["scripts/agents", ["scripts/agents/dispatch.mjs"]], ["docs/agents", ["docs/agents/cto/RULINGS.md"]], ["compliance", ["compliance/privacy.md"]],
  ["scripts/release", ["scripts/release/cut.mjs"]], ["scripts/ops", ["scripts/ops/x.sh"]], ["scripts/packs", ["scripts/packs/p.mjs"]], ["scripts/insights", ["scripts/insights/i.mjs"]], ["scripts/founder", ["scripts/founder/f.mjs"]],
  ["api keys", ["packages/api/src/keys.ts"]], ["api server", ["packages/api/src/server/a.ts"]], ["emails generated", ["packages/emails/generated/a.html"]],
  ["app.config build inputs", ["apps/mobile/src/lib/build-env.ts", "apps/mobile/src/lib/permission-copy.ts", "apps/mobile/src/lib/privacy-manifest.ts", "packages/design-tokens/fonts/index.ts"]],
  ["metro", ["apps/mobile/metro.config.js"]], ["store config", ["apps/mobile/store.config.json"]], ["mobile scripts", ["apps/mobile/scripts/preflight-lib.mjs"]],
  ["eas.json", ["apps/mobile/eas.json"]], ["app.config", ["apps/mobile/app.config.ts"]], ["native modules", ["apps/mobile/modules/x/y.swift"]], ["version.json", ["apps/mobile/version.json"]],
  [".npmrc", [".npmrc"]], [".yarnrc", [".yarnrc", ".yarnrc.yml"]], [".easignore", ["apps/mobile/.easignore"]], [".eas", [".eas/build/a.yml", "apps/mobile/.eas/x"]], ["patches", ["patches/a.patch"]],
  ["babel", ["babel.config.js", "apps/mobile/babel.config.js", ".babelrc"]], [".env", [".env.production", "apps/web/.env.local"]], ["lockfile", ["package-lock.json"]],
  ["package.json", ["package.json", "packages/core/package.json", "apps/mobile/package.json"]], ["next.config", ["apps/web/next.config.ts", "apps/web/next.config.mjs"]], ["vercel.json", ["vercel.json", "apps/web/vercel.json"]],
  ["web scripts", ["apps/web/scripts/a.mjs"]], ["web api", ["apps/web/src/app/api/x/route.ts"]], ["supabase", ["supabase/migrations/1.sql", "supabase/tests/grants.mjs"]],
  ["engine files", ["packages/core/src/verify.ts", "packages/core/src/meaning.ts", "packages/core/src/types.ts", "packages/core/src/pipeline.ts", "packages/core/src/plan.ts"]],
];

test("CR-73 security lens: every trigger path class is caught, and ordinary paths are not", () => {
  const hit = CLASS_ROWS.flatMap(([, paths]) => paths);
  for (const [name, paths] of CLASS_ROWS) for (const f of paths) assert.equal(touchesSecurityLens([f]), true, `${name}: ${f}`);
  assert.deepEqual(SECURITY_LENS_CLASSES.map((c) => c.name).sort(), CLASS_ROWS.map(([n]) => n).sort(), "table and test rows cover the same classes");
  assert.ok(hit.length >= 45);
  const miss = ["docs/a.md", "docs/engineering/a.md", "packages/core/src/verifier.ts", "packages/core/src/age.ts", "apps/mobile/src/lib/other.ts", "apps/web/src/lib/a.ts", "compliance-notes.md", "scripts/ops-notes.md", "scripts/agentsx/a.mjs", "scripts/trace.mjs", "scripts/x.mjs", "packages/api/src/client.ts", "packages/api/src/serverless.ts", "apps/mobile/src/a.ts", "apps/web/src/app/page.tsx", "packages/emails/src/a.tsx", "supabase-notes.md", "docs/package.json.md"];
  for (const f of miss) assert.equal(touchesSecurityLens([f]), false, f);
  assert.equal(touchesSecurityLens([]), false);
});

test("CR-73 security lens: objects, renames out of a trigger path, and the hit list", () => {
  assert.equal(touchesSecurityLens([{ filename: "docs/a.md" }, { filename: "supabase/x.sql" }]), true);
  assert.equal(touchesSecurityLens([{ filename: "docs/moved.mjs", previous_filename: "scripts/agents/a.mjs" }]), true);
  assert.deepEqual(securityLensHits(["docs/a.md", { filename: "vercel.json" }, ".npmrc", "docs/a.md"]), ["vercel.json", ".npmrc"]);
});

test("CR-73 security lens: a trigger-path PR with two passes and no security lens named is NEEDS-REVIEW, security lens missing", async () => {
  const r = await verdict({ comments: both(), files: secFiles });
  assert.equal(r.verdict, "NEEDS-REVIEW");
  assert.equal(r.reason, "security lens missing");
  assert.equal(r.mergeNote, undefined);
  const out = formatTable([r]);
  assert.match(out, /NEEDS-REVIEW/);
  assert.match(out, /note: #7 security lens missing/);
  assert.doesNotMatch(out, /ready for Karma/);
});

test("CR-73 security lens: a counted review that names security or security-architect clears it", async () => {
  for (const name of ["security", "security-architect", "Security", "`security`"]) {
    const r = await verdict({ comments: both(LENS(name)), files: secFiles });
    assert.equal(r.verdict, "READY", name);
    assert.equal(r.reason, undefined);
  }
  assert.equal((await verdict({ comments: both("", `Notes\n- Lens: red-team, security-architect\nMust fix: none\n`), files: secFiles })).verdict, "READY");
});

test("CR-73 security lens: a named lens must be a counted review at head from a trusted commenter", async () => {
  const want = "NEEDS-REVIEW";
  assert.equal((await verdict({ comments: both("", LENS("security"), "NONE"), files: secFiles })).verdict, "NEEDS-REVIEW", "untrusted B is not even a pass");
  const stranger = { body: `Lens: security\nlooks fine`, author_association: "MEMBER" };
  assert.equal((await verdict({ comments: [...both(), stranger], files: secFiles })).verdict, want, "not a review comment");
  const stale = [review("A", OLD, LENS("security")), review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments: stale, files: secFiles })).verdict, want, "older sha");
  for (const word of ["insecurity", "security-ish", "not security", "securityteam"]) assert.equal((await verdict({ comments: both(LENS(word)), files: secFiles })).verdict, want, word);
  const failing = [review("A", HEAD), { body: `## Review B at ${HEAD}: PASS\nLens: security\nMust fix: the key\n`, author_association: "MEMBER" }];
  assert.notEqual((await verdict({ comments: failing, files: secFiles })).verdict, "READY");
});

test("CR-73 security lens: a PR with no trigger path is unchanged, and it stays a report that never merges", async () => {
  assert.equal((await verdict({ comments: both(), files: ["docs/a.md", "packages/core/src/a.ts"] })).verdict, "READY");
  const calls = [];
  await buildQueue({ api: fake({ comments: both(), files: secFiles, calls }), now: NOW });
  assert.ok(calls.every((c) => c.method === "GET"));
});

test("CR-73 security lens: other verdicts keep their place ahead of it", async () => {
  assert.equal((await verdict({ comments: both(), files: secFiles, state: "dirty" })).verdict, "DIRTY");
  assert.equal((await verdict({ comments: [review("A", HEAD)], files: secFiles })).verdict, "NEEDS-REVIEW");
  assert.equal((await verdict({ comments: both(), files: secFiles, runs: [good[0]] })).verdict, "WAIT-CI");
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

test("PASS WITH NOTES meets a lens (CR-63) only with a Must fix: none line; PASS. and near misses do not", async () => {
  const pwn = (lens, n, extra = "Must fix: none.") => ({ body: `## Review ${lens} at ${HEAD}: PASS WITH NOTES\n\n${extra}\nNotes: a later cleanup.`, author_association: "MEMBER", ...at(n) });
  assert.equal((await verdict({ comments: [pwn("A", 1), v("B", "PASS", 2)] })).verdict, "READY");
  assert.equal((await verdict({ comments: [pwn("A", 1), pwn("B", 2, "**Must fix:** none")] })).verdict, "READY");
  for (const word of ["PASS.", "pass", "PASS WITH NOTE", "pass with notes", "PASS WITH NOTES.", "PASSWITH NOTES"]) {
    assert.equal(reviewState([v("A", word, 1)], HEAD).A, false, word);
  }
  // the other ways reviews have said it also count
  for (const said of ["No Must.", "- There is no must-fix.", "Nothing must be fixed before merge."]) assert.equal(reviewState([pwn("A", 1, said)], HEAD).A, true, said);
  // no "Must fix: none" line: not met, and the reason shows
  const bare = reviewState([pwn("A", 1, "Notes only.")], HEAD);
  assert.equal(bare.A, false);
  assert.match(bare.blocked.A, /no "Must fix: none" line/);
  // a Must fix line that names something takes the pass away, even next to a "none" line, and for plain PASS too
  assert.equal(reviewState([pwn("A", 1, "Must fix: none.\n- Must fix: the remove() guard")], HEAD).A, false);
  assert.equal(reviewState([{ body: `## Review A at ${HEAD}: PASS\nMust fix: 1. the guard`, author_association: "MEMBER", ...at(1) }], HEAD).A, false);
  // plain PASS with no Must fix line still counts
  assert.equal(reviewState([v("A", "PASS", 1)], HEAD).A, true);
  // a later CHANGES at head still blocks a lens that had PASS WITH NOTES
  assert.equal((await verdict({ comments: [pwn("A", 1), v("B", "PASS", 2), v("A", "CHANGES", 3)] })).verdict, "BLOCKED-REVIEW");
  // PASS WITH NOTES at an older sha is stale, not a pass
  assert.deepEqual(reviewState([{ ...review("A", OLD), body: `## Review A at ${OLD}: PASS WITH NOTES\nMust fix: none.`, ...at(1) }], HEAD).staleLenses, ["A"]);
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
  assert.match(out, /#7 ready for Karma to merge \(CR-73\) at /);
  assert.doesNotMatch(out, /#9 ready for Karma/);
  const main = await buildQueue({ api: multiBase({ comments }), now: NOW, base: "main" });
  assert.deepEqual(main.map((r) => [r.number, r.verdict, !!r.mergeNote]), [[9, "READY", true]]);
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

test("[BL-1480] a build path is native: the five build inputs and apps/mobile/patches/ hold a PR on the macOS checks", () => {
  const added = ["apps/mobile/metro.config.js", "apps/mobile/store.config.json", "apps/mobile/version.json", "apps/mobile/src/lib/privacy-manifest.ts", "apps/mobile/src/lib/permission-copy.ts", "apps/mobile/patches/expo+57.patch"];
  for (const f of added) {
    assert.equal(touchesNative([f]), true, f);
    assert.equal(touchesNative([{ filename: "docs/moved.md", previous_filename: f }]), true, `${f} (rename out)`);
  }
  for (const f of ["apps/mobile/ios/Podfile", "apps/mobile/modules/x/y.swift", "apps/mobile/app.config.ts", "apps/mobile/eas.json", "package-lock.json"]) assert.equal(touchesNative([f]), true, f);
  // Near misses stay out: a sibling file name, another app's file of the same name, a nested copy.
  for (const f of ["apps/mobile/metro.config.js.md", "apps/mobile/src/lib/privacy-manifest.test.ts", "apps/mobile/src/lib/permission-copy-notes.ts", "apps/web/version.json", "apps/mobile/src/version.json", "apps/mobile/patchesx/a", "docs/apps/mobile/store.config.json", "apps/mobile/src/lib/build-env.ts"]) assert.equal(touchesNative([f]), false, f);
});

test("[BL-1480] every native path but the generated ios/ folder is also on the security-lens list (the lens list is wider)", () => {
  const samples = ["apps/mobile/modules/x/y.swift", "apps/mobile/app.config.ts", "apps/mobile/eas.json", "package-lock.json", "apps/mobile/metro.config.js", "apps/mobile/store.config.json", "apps/mobile/version.json", "apps/mobile/src/lib/privacy-manifest.ts", "apps/mobile/src/lib/permission-copy.ts"];
  for (const f of samples) assert.equal(touchesSecurityLens([f]), true, f);
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

test("mergeability unknown on an old head is STALE-UNKNOWN: no Merge ask, listed in its own group", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const old = STALE_UNKNOWN_MINUTES + 5;
  const r = (await buildQueue({ api: fake({ comments, state: "unknown", pushedMin: old }), now: NOW }))[0];
  assert.equal(r.verdict, "STALE-UNKNOWN");
  assert.equal(r.mergeNote, undefined);
  const out = formatTable([r]);
  assert.match(out, /stale-unknown \(1\)/);
  assert.match(out, new RegExp(`#7 base develop, last push 7 days ago, head ${HEAD}`));
  assert.doesNotMatch(out, /ready for Karma/);
  assert.doesNotMatch(out.split("\n")[1] ?? "", /#7/, "no row for it in the main table");
});

test("--all-bases: an old other-base PR with unknown mergeability is parked as STALE-UNKNOWN, a clean one stays READY", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const all = await buildQueue({ api: multiBase({ comments }), now: NOW, allBases: true });
  const wrapped = async (path, o) => {
    const v = await multiBase({ comments })(path, o);
    if (path.split("?")[0].endsWith("/pulls/9")) return { ...v, mergeable_state: "unknown" };
    if (path.split("?")[0].endsWith("/commits/" + HEAD)) return { commit: { committer: { date: ago(STALE_UNKNOWN_MINUTES * 2) } } };
    return v;
  };
  const rows = await buildQueue({ api: wrapped, now: NOW, allBases: true });
  assert.deepEqual(all.map((r) => r.verdict), ["READY", "OTHER-BASE"]);
  assert.deepEqual(rows.map((r) => [r.number, r.verdict]), [[7, "READY"], [9, "STALE-UNKNOWN"]]);
  const out = formatTable(rows);
  assert.match(out, /#7 ready for Karma to merge \(CR-73\) at /);
  assert.doesNotMatch(out, /#9 ready for Karma/);
});

test("a fresh PR with unknown mergeability is not STALE-UNKNOWN, and an unknown push date is not stale", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, state: "unknown", pushedMin: 60 })).verdict, "WAIT-CI");
  assert.equal((await verdict({ comments, state: "unknown", pushedMin: STALE_UNKNOWN_MINUTES - 1 })).verdict, "WAIT-CI");
  const api = fake({ comments, state: "unknown" });
  const w = async (path, o) => (path.endsWith(`/commits/${HEAD}`) ? { commit: { committer: { date: "not a date" } } } : api(path, o));
  assert.equal((await buildQueue({ api: w, now: NOW }))[0].verdict, "WAIT-CI");
});

test("a clean old PR is not STALE-UNKNOWN", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  assert.equal((await verdict({ comments, state: "clean", pushedMin: STALE_UNKNOWN_MINUTES * 3 })).verdict, "READY");
});

test("CR-73 security lens: only the security names clear it; red-team and correctness alone do not", async () => {
  assert.deepEqual([...SECURITY_LENS_NAMES].sort(), ["security", "security-architect"]);
  for (const name of ["red-team", "correctness", "red-team, correctness", "Review A", "ops"]) {
    const r = await verdict({ comments: both(LENS(name)), files: secFiles });
    assert.equal(r.verdict, "NEEDS-REVIEW", name);
    assert.equal(r.reason, "security lens missing", name);
  }
});

test("CR-73 security lens: a Lens line inside a code fence or a quoted line is not a lens", async () => {
  assert.deepEqual(namedLenses("```\nLens: security\n```\n"), []);
  assert.deepEqual(namedLenses("~~~md\nLens: security\n~~~\nLens: correctness"), ["correctness"]);
  assert.deepEqual(namedLenses("> Lens: security\n>Lens: security-architect"), []);
  assert.deepEqual(namedLenses("```\nLens: security\n"), [], "an unclosed fence hides the rest");
  assert.deepEqual(namedLenses("```js\nx\n```\nLens: security"), ["security"]);
  for (const body of ["```\nLens: security\n```", "> Lens: security", "Quoting the PR:\n> Lens: security-architect"]) {
    const r = await verdict({ comments: both(body + "\n"), files: secFiles });
    assert.equal(r.verdict, "NEEDS-REVIEW", body);
  }
});

test("CR-73 security lens: a file list that does not match changed_files is NEEDS-REVIEW, file list incomplete", async () => {
  const comments = both(LENS("security"));
  const r = await verdict({ comments, files: ["docs/a.md"], changedFiles: 2 });
  assert.equal(r.verdict, "NEEDS-REVIEW");
  assert.equal(r.reason, "file list incomplete");
  assert.equal(r.mergeNote, undefined);
  assert.match(formatTable([r]), /note: #7 file list incomplete/);
  assert.equal((await verdict({ comments, files: ["docs/a.md"], changedFiles: 1 })).verdict, "READY");
  assert.equal((await verdict({ comments, files: ["docs/a.md"], changedFiles: null })).reason, "file list incomplete", "no count to compare is not READY");
});

test("CR-73 security lens: a file listing that stops at the page cap is NEEDS-REVIEW, file list incomplete", async () => {
  const notices = [];
  const api = fake({ comments: both(LENS("security")), changedFiles: 3000 });
  const w = async (path, o) => (path.split("?")[0].endsWith("/pulls/7/files") ? Array.from({ length: 100 }, (_, i) => ({ filename: `docs/f${i}.md` })) : api(path, o));
  const r = (await buildQueue({ api: w, now: NOW, notices }))[0];
  assert.equal(r.verdict, "NEEDS-REVIEW");
  assert.equal(r.reason, "file list incomplete");
});

test("CR-73 security lens: padding the file list with harmless files cannot hide a trigger path", async () => {
  const comments = both();
  const api = fake({ comments, changedFiles: 101 });
  const w = async (path, o) => (path.split("?")[0].endsWith("/pulls/7/files") ? Array.from({ length: 100 }, (_, i) => ({ filename: `docs/f${i}.md` })) : api(path, o));
  assert.notEqual((await buildQueue({ api: w, now: NOW }))[0].verdict, "READY");
});

test("CR-73 security lens: fences follow CommonMark, so a shorter or different fence line does not close one", async () => {
  assert.deepEqual(namedLenses("````\n```\nLens: security\n````\n"), [], "a 3-backtick line inside a 4-backtick fence does not close it");
  assert.deepEqual(namedLenses("````\n```\n````\nLens: security"), ["security"], "a 4-backtick line closes it");
  assert.deepEqual(namedLenses("```md\nLens: security\n"), [], "an info string opens a fence");
  assert.deepEqual(namedLenses("```md\nx\n``` text\nLens: security\n```\n"), [], "a closing fence takes no text after it");
  assert.deepEqual(namedLenses("~~~\n```\nLens: security\n~~~\nLens: correctness"), ["correctness"], "another character does not close it");
  assert.deepEqual(namedLenses("   ```\nx\n   ```  \nLens: security"), ["security"], "indent of 3 and trailing blanks are fine");
  const r = await verdict({ comments: both("````\n```\nLens: security\n````\n"), files: secFiles });
  assert.equal(r.verdict, "NEEDS-REVIEW");
  assert.equal(r.reason, "security lens missing");
});

test("CR-73 security lens: an HTML comment block or a line indented four spaces is not a lens", () => {
  assert.deepEqual(namedLenses("<!--\nLens: security\n-->\nLens: correctness"), ["correctness"]);
  assert.deepEqual(namedLenses("<!-- Lens: security -->\n"), []);
  assert.deepEqual(namedLenses("x <!-- a\nLens: security\n"), [], "an unclosed comment hides the rest");
  assert.deepEqual(namedLenses("    Lens: security\n"), []);
  assert.deepEqual(namedLenses("\tLens: security\n"), []);
  assert.deepEqual(namedLenses("  - Lens: security\n"), ["security"]);
  assert.deepEqual(namedLenses("   Lens: security-architect\n"), ["security-architect"]);
});

const stalePr = { comments: [review("A", HEAD), review("B", HEAD)], files: ["apps/mobile/src/a.ts"] };

test("stale base: behind with a shared workspace is NEEDS-UPDATE with the reason, no Karma line", async () => {
  const r = await verdict({ ...stalePr, behindBy: 3, baseFiles: ["apps/mobile/src/b.ts", "docs/x.md"] });
  assert.equal(r.verdict, "NEEDS-UPDATE");
  assert.equal(r.mergeNote, undefined);
  assert.deepEqual(r.staleBase, { behindBy: 3, shared: ["apps/mobile"] });
  const out = formatTable([r]);
  assert.match(out, /note: #7 base is behind develop by 3 commits that touch apps\/mobile: update the branch, wait for required, and get fresh reviews \(a new commit voids both\)/);
  assert.doesNotMatch(out, /ready for Karma/);
});

test("stale base: behind with no shared workspace stays READY and prints a note with the count", async () => {
  const r = await verdict({ ...stalePr, behindBy: 5, baseFiles: ["packages/core/src/a.ts", "apps/web/x.ts"] });
  assert.equal(r.verdict, "READY");
  assert.match(formatTable([r]), /note: #7 base is behind develop by 5 commits, none in a workspace this PR touches; still ready/);
  assert.match(formatTable([r]), /ready for Karma/);
});

test("stale base: not behind is READY with no base note", async () => {
  const r = await verdict({ ...stalePr, behindBy: 0, baseFiles: ["apps/mobile/src/b.ts"] });
  assert.equal(r.verdict, "READY");
  assert.doesNotMatch(formatTable([r]), /base is behind/);
});

test("stale base: a compare failure is NEEDS-REVIEW with a reason, never READY", async () => {
  const r = await verdict({ ...stalePr, compareFail: true });
  assert.equal(r.verdict, "NEEDS-REVIEW");
  assert.equal(r.reason, "base compare failed");
  assert.equal(r.mergeNote, undefined);
  assert.match(formatTable([r]), /note: #7 base compare failed/);
  const api = fake({ ...stalePr, behindBy: 2 });
  for (const bad of [{ behind_by: "2" }, {}, null]) {
    const w = async (path, o) => (path.includes("/compare/") ? bad : api(path, o));
    assert.equal((await buildQueue({ api: w, now: NOW }))[0].reason, "base compare failed", JSON.stringify(bad));
  }
  const cut = async (path, o) => (path.endsWith("...develop") ? { files: Array.from({ length: 300 }, (_, i) => ({ filename: `docs/f${i}.md` })) } : api(path, o));
  assert.equal((await buildQueue({ api: cut, now: NOW }))[0].verdict, "NEEDS-REVIEW", "300 files may be cut off");
  const noFiles = async (path, o) => (path.endsWith("...develop") ? {} : api(path, o));
  assert.equal((await buildQueue({ api: noFiles, now: NOW }))[0].verdict, "NEEDS-REVIEW");
});

test("stale base: workspaceOf and staleBase are pure and data-driven", () => {
  const cases = [["apps/mobile/src/a.ts", "apps/mobile"], ["packages/core/src/a.ts", "packages/core"], ["supabase/migrations/1.sql", "supabase"], ["scripts/x.mjs", "scripts"], ["docs/engineering/a.md", "docs/engineering"], ["docs/DECISIONS.md", "docs"], ["package-lock.json", "(root)"], [".github/a.yml", ".github"]];
  for (const [path, ws] of cases) assert.equal(workspaceOf(path), ws, path);
  assert.deepEqual(staleBase({ behindBy: 0, prFiles: ["scripts/a"], baseFiles: ["scripts/b"] }), { behindBy: 0, shared: [] });
  assert.deepEqual(staleBase({ behindBy: 2, prFiles: [{ filename: "docs/n.md", previous_filename: "supabase/a.sql" }], baseFiles: ["supabase/b.sql", "scripts/c"] }), { behindBy: 2, shared: ["supabase"] });
});

test("stale base: other verdicts keep their place, and the check makes only GET calls", async () => {
  assert.equal((await verdict({ ...stalePr, behindBy: 3, baseFiles: ["apps/mobile/x"], state: "dirty" })).verdict, "DIRTY");
  assert.equal((await verdict({ ...stalePr, behindBy: 3, baseFiles: ["apps/mobile/x"], pushedMin: 1 })).verdict, "NEEDS-UPDATE");
  assert.equal((await verdict({ ...stalePr, behindBy: 3, baseFiles: ["apps/mobile/x"], runs: [good[0]] })).verdict, "WAIT-CI");
  const calls = [];
  await buildQueue({ api: fake({ ...stalePr, behindBy: 3, baseFiles: ["apps/mobile/x"], calls }), now: NOW });
  assert.ok(calls.some((c) => c.path.includes("/compare/")) && calls.every((c) => c.method === "GET"));
});
