// Tests for merge-queue.mjs. A fake API is injected: no network, no gh, no real repo state.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { STALE_UNKNOWN_MINUTES, securityLensHits, touchesSecurityLens, namedLenses, SECURITY_LENS_NAMES, SECURITY_LENS_CLASSES, buildQueue, workspaceOf, staleBase, parseReview, parseClaims, parseArgs, formatTable, suiteState, passOverRedSuite, hotFileHits, hotFileGroups, reviewState, touchesNative, clean, TRUSTED_ASSOCIATIONS, filesSince, UNREADABLE, parseCodeowners, protectedPathHits, touchesProtectedPath, classifyPr, CR149_FLAG, cr149FlagOn, evaluateCr149, gitMergeTree, gitModeCheck, readRawModes, SPECIAL_MODES, cr149Verdict, verdictFor } from "./merge-queue.mjs";

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
  ["trace gate", ["scripts/trace.mjs", "scripts/trace.test.mjs", "docs/ops/trace-ns-baseline.txt", "docs/product/prd/14-test-plan.md"]],
];

test("CR-73 security lens: every trigger path class is caught, and ordinary paths are not", () => {
  const hit = CLASS_ROWS.flatMap(([, paths]) => paths);
  for (const [name, paths] of CLASS_ROWS) for (const f of paths) assert.equal(touchesSecurityLens([f]), true, `${name}: ${f}`);
  assert.deepEqual(SECURITY_LENS_CLASSES.map((c) => c.name).sort(), CLASS_ROWS.map(([n]) => n).sort(), "table and test rows cover the same classes");
  assert.ok(hit.length >= 45);
  const miss = ["docs/a.md", "docs/engineering/a.md", "packages/core/src/verifier.ts", "packages/core/src/age.ts", "apps/mobile/src/lib/other.ts", "apps/web/src/lib/a.ts", "compliance-notes.md", "scripts/ops-notes.md", "scripts/agentsx/a.mjs", "scripts/tracer.mjs", "scripts/trace.mjs.bak", "scripts/x/trace.mjs", "foo/scripts/trace.mjs", "apps/docs/ops/trace-ns-baseline.txt", "docs/ops/trace-ns-baseline.md", "docs/product/prd/14-test-plan-notes.md", "docs/product/prd/13-engineering-plan.md", "scripts/x.mjs", "packages/api/src/client.ts", "packages/api/src/serverless.ts", "apps/mobile/src/a.ts", "apps/web/src/app/page.tsx", "packages/emails/src/a.tsx", "supabase-notes.md", "docs/package.json.md"];
  for (const f of miss) assert.equal(touchesSecurityLens([f]), false, f);
  assert.equal(touchesSecurityLens([]), false);
});

test("CR-73 security lens: objects, renames out of a trigger path, and the hit list", () => {
  assert.equal(touchesSecurityLens([{ filename: "docs/a.md" }, { filename: "supabase/x.sql" }]), true);
  assert.equal(touchesSecurityLens([{ filename: "docs/moved.mjs", previous_filename: "scripts/agents/a.mjs" }]), true);
  assert.deepEqual(securityLensHits(["docs/a.md", { filename: "vercel.json" }, ".npmrc", "docs/a.md"]), ["vercel.json", ".npmrc"]);
});

test("CR-229: a PR that changes the trace gate's own files needs the security lens, and a rename out of one still counts", async () => {
  for (const f of ["scripts/trace.mjs", "scripts/trace.test.mjs", "docs/ops/trace-ns-baseline.txt", "docs/product/prd/14-test-plan.md"]) {
    const r = await verdict({ comments: both(), files: [f] });
    assert.equal(r.verdict, "NEEDS-REVIEW", f);
    assert.equal(r.reason, "security lens missing", f);
    assert.deepEqual(r.securityHits, [f]);
    assert.equal((await verdict({ comments: both("", LENS("security")), files: [f] })).verdict, "READY", `${f} with the lens`);
  }
  assert.deepEqual(securityLensHits([{ filename: "docs/ops/old-baseline.txt", previous_filename: "docs/ops/trace-ns-baseline.txt" }]), ["docs/ops/old-baseline.txt"]);
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
  assert.match(out, /^#7 ready for Karma to merge \(CR-73\) at [0-9a-f]{40}$/m);
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
  assert.match(out, /^#7 ready for Karma to merge \(CR-73\) at [0-9a-f]{40}$/m);
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
  assert.match(formatTable([r]), /^#\d+ ready for Karma to merge \(CR-73/m);
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

test("AIE-G20: suiteState reads the newest run of the suite check, or - if none", () => {
  assert.equal(suiteState([]), "-");
  assert.equal(suiteState(good), "-");
  assert.equal(suiteState([run(5, "tests and content rules", "failure"), run(9, "tests and content rules", "success")]), "success");
  assert.equal(suiteState([run(5, "tests and content rules", "success"), run(9, "tests and content rules", null, "in_progress")]), "pending");
  assert.equal(suiteState([run(5, "tests and content rules", "failure")]), "failure");
});

test("AIE-G20: PASS over a red suite prints a note and a suite column; json gains suite", async () => {
  const comments = [review("A", HEAD), review("B", HEAD)];
  const red = await verdict({ comments, runs: [...good, run(4, "tests and content rules", "failure")] });
  assert.equal(red.suite, "failure");
  assert.equal(passOverRedSuite(red), true);
  const out = formatTable([red]);
  assert.match(out, /suite/);
  assert.match(out, /note: #7 PASS over a red suite \(AIE-G20\)/);
  const green = await verdict({ comments, runs: [...good, run(4, "tests and content rules", "success")] });
  assert.equal(passOverRedSuite(green), false);
  assert.doesNotMatch(formatTable([green]), /red suite/);
  const none = await verdict({ comments });
  assert.equal(none.suite, "-");
  assert.equal(none.verdict, "READY", "the suite column is a report, it never changes the verdict");
  assert.equal(passOverRedSuite({ reviews: { A: false, B: false }, suite: "failure" }), false, "no counted PASS, no note");
});

test("AIE-G21: hotFileHits finds hot files, renames included", () => {
  assert.deepEqual(hotFileHits(["docs/agents/CLAIMS.md", "docs/BACKLOG.md", "docs/content/map/a.json", "docs/other.md", { filename: "x.md", previous_filename: "docs/agents/exec/RULINGS.md" }, "docs/agents/cto/RULINGS.md"]),
    ["docs/agents/CLAIMS.md", "docs/BACKLOG.md", "docs/content/map/a.json", "docs/agents/exec/RULINGS.md", "docs/agents/cto/RULINGS.md"]);
  assert.deepEqual(hotFileHits(["docs/agents/CLAIMS.md.bak", "apps/docs/BACKLOG.md"]), []);
});

test("AIE-G21: hotFileGroups names PRs that share a hot file, lowest number first; one PR or other bases do not", () => {
  const ab = { A: true, B: true };
  const mk = (number, hotFiles, extra = {}) => ({ number, hotFiles, reviews: ab, verdict: "WAIT-QUIET", ...extra });
  const rows = [mk(30, ["docs/agents/CLAIMS.md"]), mk(12, ["docs/agents/CLAIMS.md", "docs/content/map/a.json"]), mk(21, ["docs/content/map/b.json"]),
    mk(40, ["docs/BACKLOG.md"]), mk(41, ["docs/BACKLOG.md"], { otherBase: true }), mk(42, ["docs/BACKLOG.md"], { reviews: { A: true, B: false }, verdict: "NEEDS-REVIEW" })];
  assert.deepEqual(hotFileGroups(rows), [{ file: "docs/agents/CLAIMS.md", prs: [12, 30] }, { file: "docs/content/map/*", prs: [12, 21] }]);
  assert.deepEqual(hotFileGroups([mk(40, ["docs/BACKLOG.md"], { reviews: { A: false, B: false }, verdict: "READY" }), mk(50, ["docs/BACKLOG.md"], { reviews: { A: false, B: false }, verdict: "READY" })]), [{ file: "docs/BACKLOG.md", prs: [40, 50] }]);
  const full = (r) => ({ head: HEAD, base: "develop", pushAgeMinutes: 30, mergeable_state: "clean", required: [], checks: { queued: 0, inProgress: 0, macos: {} }, watch: [], claim: "", suite: "-", ...r, reviews: { ...r.reviews, blocked: {}, untrusted: [], staleLenses: [] } });
  const out = formatTable(rows.map(full));
  assert.match(out, /note: #12, #30 all change docs\/agents\/CLAIMS\.md \(AIE-G21\): merge #12 first/);
  assert.equal(hotFileGroups([mk(1, [])]).length, 0);
});

test("AIE-G21: buildQueue records hotFiles for a reviewed PR even when CI is not green, with GET calls only", async () => {
  const calls = [];
  const r = await verdict({ comments: [review("A", HEAD), review("B", HEAD)], runs: [good[0]], files: ["docs/BACKLOG.md", "docs/x.md"], calls });
  assert.deepEqual(r.hotFiles, ["docs/BACKLOG.md"]);
  assert.equal(r.verdict, "WAIT-CI");
  assert.ok(calls.every((c) => c.method === "GET"));
});

// BL-1537: reviewState is a verdict reader, not an instruction reader (no founder marker needed or wanted).
test("counted-review trust rule (BL-1537): line-1 header, agent marker on line 2, OWNER MEMBER COLLABORATOR only, PASS words only", () => {
  const mk = (body, author_association, n = 1) => ({ body, author_association, created_at: `2026-11-24T00:00:0${n}Z`, id: n });
  const hdr = (lens, word = "PASS") => `## Review ${lens} at ${HEAD}: ${word}`;
  // Accepted: header on line 1, agent marker on line 2, no founder marker, from each trusted association.
  for (const who of ["OWNER", "MEMBER", "COLLABORATOR"]) {
    assert.equal(reviewState([mk(`${hdr("A")}\n<!-- agent:karma -->\nLens: security`, who)], HEAD).A, true, who);
  }
  // Not counted: no line-1 header (a founder marker or the agent marker on line 1 pushes it down).
  assert.equal(reviewState([mk(`<!-- agent:karma -->\n${hdr("A")}`, "OWNER")], HEAD).A, false);
  assert.equal(reviewState([mk(`<!-- founder -->\n${hdr("A")}`, "OWNER")], HEAD).A, false);
  // Not counted: an association outside the three; it is listed as untrusted, never as a pass.
  for (const who of ["CONTRIBUTOR", "FIRST_TIME_CONTRIBUTOR", "NONE", undefined]) {
    const s = reviewState([mk(hdr("A"), who)], HEAD);
    assert.equal(s.A, false, String(who));
    assert.deepEqual(s.untrusted, ["A"], String(who));
  }
  // Not counted: a verdict word that is not PASS or PASS WITH NOTES with a Must fix: none line.
  for (const word of ["BLOCKED", "CHANGES", "PASS.", "pass"]) assert.equal(reviewState([mk(hdr("A", word), "OWNER")], HEAD).A, false, word);
  assert.equal(reviewState([mk(`${hdr("A", "PASS WITH NOTES")}\nnotes`, "OWNER")], HEAD).A, false, "no Must fix: none line");
  // The pinned list itself.
  assert.deepEqual(TRUSTED_ASSOCIATIONS, ["OWNER", "MEMBER", "COLLABORATOR"]);
});

// BL-1570: the CR-149 checks as pure functions. One test per rule; each names the rule it proves. No verdict uses them yet.
const CODEOWNERS = readFileSync(new URL("../../.github/CODEOWNERS", import.meta.url), "utf8");
const rulesFor = (path, files = [path], owners = CODEOWNERS) => protectedPathHits(files, owners).find((h) => h.path === path)?.rules ?? [];

test("CR-149 rule 1, shared file: filesSince returns the files both the PR and develop changed since the merge base", () => {
  assert.deepEqual(filesSince(["apps/mobile/src/a.ts", "docs/x.md"], [{ filename: "docs/x.md" }, { filename: "packages/core/src/b.ts" }]), ["docs/x.md"]);
  assert.deepEqual(filesSince([{ filename: "docs/x.md" }], [{ filename: "docs/y.md" }]), [], "no shared file: no overlap");
});

test("CR-149 rule 1, rename on one side counts on both sides (filename and previous_filename)", () => {
  // The PR renames a file that develop edited under its old name.
  assert.deepEqual(filesSince([{ filename: "docs/new.md", previous_filename: "docs/old.md" }], [{ filename: "docs/old.md" }]), ["docs/old.md"]);
  // Develop renamed a file that the PR edits under its old name.
  assert.deepEqual(filesSince([{ filename: "docs/old.md" }], [{ filename: "docs/new.md", previous_filename: "docs/old.md" }]), ["docs/old.md"]);
});

test("CR-149 rule 1 fails closed: an input that cannot prove no overlap counts as overlap", () => {
  const capped = Object.assign([{ filename: "docs/y.md" }], { capped: true });
  for (const [a, b] of [[null, []], [[], undefined], [[{ filename: "docs/x.md" }], capped], [[{ filename: 7 }], []], [[{}], []], [[""], []]]) {
    assert.deepEqual(filesSince(a, b), [UNREADABLE]);
  }
});

test("CR-149 rule 4, CODEOWNERS path: packages/core/src/verify.ts is protected through the CODEOWNERS file text (correction 1, BL-1569)", () => {
  assert.ok(rulesFor("packages/core/src/verify.ts").includes("CODEOWNERS /packages/core/src/verify.ts"));
  assert.equal(touchesProtectedPath(["packages/core/src/verify.ts"], CODEOWNERS), true);
  // A path added to CODEOWNERS later is covered with no change to the script, including unanchored and ** patterns.
  const later = `${CODEOWNERS}\n/apps/mobile/src/components/keepsake/ @owner\n*.pem @owner\ndocs/**/draft-*.md @owner\n`;
  assert.deepEqual(rulesFor("apps/mobile/src/components/keepsake/row.tsx", undefined, later), ["CODEOWNERS /apps/mobile/src/components/keepsake/"]);
  assert.deepEqual(rulesFor("apps/web/certs/a.pem", undefined, later), ["CODEOWNERS *.pem"]);
  assert.deepEqual(rulesFor("docs/ops/deep/draft-plan.md", undefined, later), ["CODEOWNERS docs/**/draft-*.md"]);
  assert.equal(touchesProtectedPath(["apps/mobile/src/components/keepsake/row.tsx"], CODEOWNERS), false, "not owned before the line was added");
  // The `*` catch-all line is not an entry of its own (correction 1), so an ordinary app file is not protected.
  assert.equal(parseCodeowners("*  @owner\n/**  @owner\n").error, "CODEOWNERS has no entry beyond the catch-all");
  assert.ok(!parseCodeowners(CODEOWNERS).patterns.some((x) => x.pattern === "*"), "the catch-all is not an entry of its own");
  assert.equal(touchesProtectedPath(["apps/mobile/src/components/letter/row.tsx", "docs/ops/notes.md"], CODEOWNERS), false);
  // Fail closed: missing text, or a pattern GitHub does not support, protects every path.
  assert.deepEqual(rulesFor("docs/ops/notes.md", undefined, null), ["CODEOWNERS text missing"]);
  assert.ok(rulesFor("docs/ops/notes.md", undefined, "!docs/ @owner\n")[0].startsWith("CODEOWNERS pattern not supported"));
});

test("CR-149 rule 4 and CR-70: a .env file anywhere in the tree is protected", () => {
  for (const p of [".env", "apps/mobile/.env.development", "apps/web/.env.local", "infra/.env.d/staging.json"]) assert.ok(rulesFor(p).includes(".env file"), p);
});

test("CR-149 rule 4: a lockfile anywhere is protected, not only the root package-lock.json", () => {
  for (const p of ["package-lock.json", "apps/web/package-lock.json", "tools/pnpm-lock.yaml", "yarn.lock"]) assert.ok(rulesFor(p).includes("lockfile"), p);
});

test("CR-149 rule 4: any package.json change counts as a dependency change (no patch is given, so none is proved safe)", () => {
  for (const p of ["package.json", "apps/web/package.json", "packages/core/package.json"]) assert.ok(rulesFor(p).includes("package.json dependency change"), p);
});

test("CR-149 rule 4 and CR-74: a native path (NATIVE_PATHS) is protected, through either name of a rename", () => {
  assert.ok(rulesFor("apps/mobile/ios/Scribe/AppDelegate.swift").includes("native path (CR-74)"));
  assert.ok(rulesFor("apps/mobile/patches/expo-av.patch").includes("native path (CR-74)"));
  const moved = [{ filename: "apps/mobile/src/lib/delegate.ts", previous_filename: "apps/mobile/ios/Scribe/Delegate.swift" }];
  assert.ok(rulesFor("apps/mobile/ios/Scribe/Delegate.swift", moved).includes("native path (CR-74)"));
  assert.equal(touchesProtectedPath(moved, CODEOWNERS), true);
  assert.ok(rulesFor("apps/mobile/IOS/Scribe/AppDelegate.swift").includes("native path (CR-74)"), "case-insensitive checkout");
});

test("CR-149 rule 4: a migration is protected, under supabase/migrations and any other migrations folder", () => {
  assert.ok(rulesFor("supabase/migrations/20261124000000_x.sql").includes("migration"));
  assert.ok(rulesFor("packages/api/migrations/0001.sql").includes("migration"));
});

test("CR-149 rule 4 and CR-70: the CR-70 list beyond CODEOWNERS (auth, billing, legal, build inputs) is protected", () => {
  for (const p of ["apps/mobile/src/lib/auth/apple.ts", "apps/mobile/src/app/(auth)/sign-in/email.tsx", "apps/mobile/src/lib/billing/gates.ts",
    "apps/mobile/src/lib/db/schema.ts", "scripts/release/cut.mjs", "apps/mobile/src/lib/build-env.ts", "docs/legal/terms.md", "docs/DECISIONS.md"]) {
    assert.ok(rulesFor(p).includes("CR-70 path"), p);
  }
});

test("CR-149 rule 4 fails closed: an unreadable list, entry or path counts as protected", () => {
  for (const files of [null, "apps/x.ts", [], Object.assign(["docs/x.md"], { capped: true }), [{}], [{ filename: 3 }], ["../etc/passwd"], ["/abs/x.ts"], ["a\\b.ts"], ["apps/./x.ts"]]) {
    assert.equal(touchesProtectedPath(files, CODEOWNERS), true, JSON.stringify(files));
  }
});

test("CR-149 class, docs-only PR: every changed path is Markdown or text outside agent and CI folders", () => {
  assert.equal(classifyPr([{ filename: "docs/ops/proposed/merge-queue-docs-file-overlap.md" }, "README.md", "docs/notes.txt"]), "docs");
  assert.equal(classifyPr([".claude/agents/ops.md"]), "source", "an agent identity file is an instruction, not docs");
  assert.equal(classifyPr(["docs/x.md", "docs/x.json"]), "source");
});

test("CR-149 class, test-only PR: every changed path is a test file or sits in a test folder", () => {
  assert.equal(classifyPr(["apps/mobile/test/asks-keep-book-store.test.ts", "apps/mobile/e2e-web/j13-reminders.flow.ts", "scripts/agents/merge-queue.test.mjs"]), "test");
  assert.equal(classifyPr([".github/workflows/tests/run.yml"]), "source", "a workflow is never a test");
});

test("CR-149 class, source PR: anything else, from paths only; mixed, renamed out of source or unreadable is source", () => {
  assert.equal(classifyPr(["apps/mobile/src/lib/dates.ts"]), "source");
  assert.equal(classifyPr(["apps/mobile/test/a.test.ts", "docs/a.md"]), "source", "test plus docs is neither test-only nor docs-only");
  assert.equal(classifyPr([{ filename: "apps/mobile/test/a.test.ts", previous_filename: "apps/mobile/src/a.ts" }]), "source");
  for (const files of [null, [], [{}], ["../docs/a.md"], Object.assign(["docs/a.md"], { capped: true })]) assert.equal(classifyPr(files), "source", JSON.stringify(files));
});

test("CR-149 rule 4 and CR-70 (Review B): auth, account and deletion files hit by substring, camelCase and compound names included", () => {
  for (const p of ["apps/mobile/src/lib/backup/token-vault.ts", "apps/mobile/src/app/settings/account.tsx",
    "apps/mobile/src/lib/account-deletion/use-account-deletion.ts", "apps/mobile/src/components/settings/delete-account.logic.ts",
    "apps/mobile/src/hooks/useAuth.ts", "apps/web/src/lib/authClient.ts", "apps/mobile/src/providers/AuthProvider.tsx",
    "apps/mobile/src/lib/signInWithApple.ts", "apps/web/src/lib/magic-link.ts", "apps/mobile/src/lib/SessionStore.ts",
    "apps/mobile/src/lib/otpEntry.ts", "apps/mobile/src/lib/secureStorage.ts", "apps/mobile/src/lib/sign_out.ts", "apps/web/src/lib/tokenCache.ts",
    "apps/web/src/lib/vault.ts", "apps/mobile/src/lib/deleteAll.ts", "apps/mobile/src/lib/KeychainStore.ts", "apps/mobile/src/lib/oauthCallback.ts",
    "apps/mobile/src/lib/Paywall.tsx", "apps/mobile/src/lib/useEntitlement.ts", "apps/mobile/src/lib/restorePurchase.ts", "apps/mobile/src/lib/passkeyPrompt.ts",
    "apps/mobile/src/lib/paymentSheet.ts", "apps/mobile/src/lib/subscriptionStatus.ts", "apps/mobile/src/lib/iapReceipt.ts", "apps/mobile/src/lib/PlusBadge.tsx",
    "apps/web/src/lib/securityHeaders.ts", "apps/web/src/lib/supabaseClient.ts", "apps/web/src/lib/privacyNotice.ts", "apps/web/src/lib/termsVersion.ts",
    "apps/web/src/lib/legalLinks.ts", "apps/mobile/src/lib/consentGate.ts"]) {
    assert.ok(rulesFor(p).includes("CR-70 path"), p);
  }
});

test("CR-149 rule 4 and CR-70 (Review B): files protected only by what they read are covered by their folder, since a name rule cannot see content", () => {
  // Both read auth.getSession but their names say nothing; the backup and analytics folders are listed whole.
  for (const p of ["apps/mobile/src/lib/backup/runtime.ts", "apps/mobile/src/lib/analytics/forget-retired.ts"]) assert.ok(rulesFor(p).includes("CR-70 path"), p);
  // .well-known decides which app a sign-in link opens.
  assert.ok(rulesFor("apps/web/src/app/.well-known/apple-app-site-association/route.ts").includes("CR-70 path"));
});

test("CR-149 rule 4 and CR-70 (Review A): .gitmodules, .gitattributes and the standing merge delegation decision are protected", () => {
  for (const p of [".gitmodules", ".gitattributes", "apps/mobile/.gitattributes", "docs/ops/proposed/standing-merge-delegation-decision.md"]) {
    assert.ok(rulesFor(p).includes("CR-70 path"), p);
  }
});

test("CR-149 rule 4: a leading **/ CODEOWNERS pattern matches at any depth, not only at the root", () => {
  const later = `${CODEOWNERS}\n**/logs @owner\n`;
  assert.deepEqual(rulesFor("apps/web/deep/logs/today.json", undefined, later), ["CODEOWNERS **/logs"]);
  assert.deepEqual(rulesFor("logs/today.json", undefined, later), ["CODEOWNERS **/logs"]);
  assert.equal(touchesProtectedPath(["apps/web/deep/logs/today.json"], CODEOWNERS), false, "not owned before the line was added");
});

test("CR-149 rule 1: filesSince compares names without case (fail closed: more overlap)", () => {
  assert.deepEqual(filesSince(["Docs/A.md"], [{ filename: "docs/a.md" }]), ["Docs/A.md"]);
  assert.deepEqual(filesSince([{ filename: "docs/b.md", previous_filename: "DOCS/a.md" }], ["docs/A.md"]), ["DOCS/a.md"]);
});

test("CR-149 class: .txt and .mdx are docs only under docs/, and a .txt a check or build reads is source anywhere", () => {
  assert.equal(classifyPr(["docs/ops/trace-ns-baseline.txt"]), "source", "scripts/trace.mjs --check reads it (CR-227)");
  for (const p of ["docs/agents/tone-baseline.txt", "docs/ops/action-pins-allowlist.txt", "docs/store/notes-for-review-1.0.txt",
    "docs/ops/well-known/security.txt", "docs/requirements.txt", "docs/CMakeLists.txt", "requirements.txt", "native/CMakeLists.txt",
    "apps/web/public/robots.txt", "apps/web/src/content/page.mdx"]) {
    assert.equal(classifyPr([p]), "source", p);
  }
  assert.equal(classifyPr(["docs/notes.txt", "docs/guide.mdx", "apps/web/README.md"]), "docs");
});

test("CR-149 rule 4 and CR-70 (Review B, second pass): erase, invite, deep-link and app-lock files are protected by name or folder", () => {
  for (const p of ["apps/mobile/src/lib/erase-everything.ts", "apps/mobile/src/lib/capture/erase.ts", "apps/mobile/src/app/settings/erase.tsx",
    "apps/mobile/src/components/settings/wipe.logic.ts", "apps/mobile/src/lib/resilience/recovery-export.ts", "packages/api/src/analytics-forget.ts",
    "apps/mobile/src/app/+native-intent.tsx", "apps/mobile/src/lib/family/entry.logic.ts", "packages/core/src/invite.ts",
    "apps/mobile/src/lib/family/invites.ts", "apps/mobile/src/lib/family/invite-link.logic.ts", "apps/mobile/src/lib/family/pending-invite.ts",
    "apps/mobile/src/lib/family/device-invite.ts", "apps/mobile/src/app/invite/[code].tsx", "apps/web/src/app/j/page.tsx",
    "apps/mobile/src/lib/app-lock/gate.ts", "apps/mobile/src/components/app-lock/Shield.tsx", "apps/mobile/src/app/settings/app-lock.tsx",
    "docs/ops/backup/backup-role.sql", "docs/ops/well-known/security.txt",
    "apps/mobile/src/lib/loginForm.ts", "apps/mobile/src/lib/logout.ts", "apps/web/src/lib/signupForm.ts", "apps/web/src/lib/password.ts",
    "apps/web/src/lib/secretStore.ts", "apps/web/src/lib/credentials.ts", "apps/web/src/lib/jwt.ts", "apps/web/src/lib/crypto.ts",
    "apps/web/src/lib/apiKey.ts", "apps/web/src/lib/privateKey.ts", "apps/mobile/src/lib/deepLink.ts", "apps/mobile/src/lib/biometricPrompt.ts",
    "apps/mobile/src/lib/faceId.ts"]) {
    assert.ok(rulesFor(p).includes("CR-70 path"), p);
  }
});

test("CR-149 rule 4: a path with a non-ASCII character is unknown, so protected and source (a zero-width or full-width letter cannot dodge the name rule)", () => {
  for (const p of ["apps/mobile/src/lib/a\u200buth.ts", "apps/mobile/src/lib/\uff41uth.ts", "apps/mobile/src/lib/S\u0130GN.ts"]) {
    assert.ok(touchesProtectedPath([p], CODEOWNERS), JSON.stringify(p));
    assert.equal(classifyPr([p.replace("apps/mobile/src/lib/", "docs/").replace(/\.ts$/, ".md")]), "source", JSON.stringify(p));
  }
});

test("CR-149 rule 4: an empty or comment-only CODEOWNERS text fails closed", () => {
  for (const text of ["", "\n\n", "# owners\n"]) assert.deepEqual(rulesFor("docs/ops/notes.md", undefined, text), ["CODEOWNERS text empty"], JSON.stringify(text));
  assert.deepEqual(rulesFor("docs/ops/notes.md", undefined, "*  @owner\n"), ["CODEOWNERS has no entry beyond the catch-all"], "a read cut short after the `*` line fails closed");
});

test("CR-149 rule 4 and CR-70 (Review B, third pass): logic folders are protected whole, since a name list is never complete", () => {
  // Signed-document and pack trust, session ownership, consent records and the notify routes' logic live in these
  // folders; listing the folders whole stops the next file with a plain name slipping through.
  for (const p of ["packages/api/src/integrity.ts", "packages/api/src/canonical.ts", "apps/mobile/src/lib/remote/apply.ts",
    "apps/mobile/src/lib/packs/engine.ts", "apps/web/src/lib/notify/unsubscribe.ts", "apps/web/src/lib/notify/readme.md",
    "apps/mobile/src/lib/sync/handover.ts", "apps/mobile/src/lib/first-run/gate.logic.ts", "apps/mobile/src/components/family/JoinSheet.tsx",
    "apps/mobile/src/lib/agreements.logic.ts", "apps/mobile/src/lib/age-gate.logic.ts", "apps/mobile/src/lib/photos/housekeeping.ts"]) {
    assert.ok(rulesFor(p).includes("CR-70 path"), p);
  }
  // A well-known file with a plain name is still protected by its folder, with or without the leading dot.
  for (const p of ["docs/ops/well-known/apple-app-site-association", "apps/web/public/.well-known/assetlinks.json"]) assert.ok(rulesFor(p).includes("CR-70 path"), p);
  // Future names in the security vocabulary hit by substring, outside the protected folders.
  for (const n of ["Unlock", "passcode", "hashPin", "nonce", "ssoButton", "mfaStep", "totp", "permissions", "roles", "adminPanel", "rlsNote",
    "csrf", "cors", "escrow", "ownership", "signedUrl", "presign", "cookieBanner", "trustBadge", "identity", "middleware", "agreementRow", "AgeGate"]) {
    assert.ok(rulesFor(`apps/mobile/src/components/x/${n}.tsx`).includes("CR-70 path"), n);
  }
});

test("CR-149 rule 4 and CR-70 (Review B, fourth pass): seams, the root layout, core rules, routes, emails and scripts are protected, each pinned by a real path", () => {
  for (const p of ["apps/mobile/src/dev/e2e-seams.ts", "apps/mobile/src/dev/e2e-web-seam-load.ts", "apps/mobile/src/dev/kill-drill.ts",
    "apps/mobile/src/dev/kill-drill.logic.ts", "apps/mobile/src/app/_layout.tsx", "packages/core/src/frozen.ts", "packages/core/src/family-rules.ts",
    "packages/core/src/model-edits.ts", "packages/core/src/protect.ts", "packs/text-rules/en.json", "apps/mobile/storekit/EarlyLetters.storekit",
    "apps/mobile/tsconfig.json", "apps/mobile/shims/decode-uri-component.js", "packages/api/src/envelope.ts", "packages/api/src/kill-switches.ts",
    "apps/web/CLAUDE.md", "apps/web/AGENTS.md", "docs/ops/proposed/migrations-applied/early-letters.txt", "apps/mobile/src/app/settings/children/new.tsx",
    "apps/mobile/src/app/onboarding.tsx", "apps/web/src/app/layout.tsx", "apps/web/src/app/robots.ts", "apps/web/src/content/pricing.ts",
    "packages/emails/src/templates/LetterEmail.tsx", "scripts/review-gate/decide.mjs", "scripts/guards/founder-ask.mjs", "scripts/trace.mjs",
    ".gitignore", ".nvmrc", "LICENSE", "apps/mobile/vitest.config.ts", "apps/mobile/src/env.d.ts", "apps/mobile/web-preview/sqlite-worker-channel.js"]) {
    assert.ok(rulesFor(p).includes("CR-70 path"), p);
  }
  // Real files that only the word rule protects today (Review A, fourth pass).
  for (const p of ["apps/mobile/src/components/consent/consent-ask.tsx", "apps/mobile/src/components/settings/children/delete-book.tsx",
    "apps/mobile/src/components/settings/backup.tsx", "apps/web/src/components/unsubscribe/form.tsx", "apps/mobile/src/components/settings/plus.tsx",
    "apps/mobile/src/components/welcome-sign-in.tsx"]) {
    assert.ok(rulesFor(p).includes("CR-70 path"), p);
  }
});

test("CR-149 rule 4: every word in the security vocabulary is pinned by its own path outside the protected folders", () => {
  const words = ["auth","sign-in","sign-out","sign-up","log-in","log-out","session","token","vault","account","delet","erase","wipe","purge","forget","recover","restore","export","backup","invite","native-intent","deep-link","app-lock","biometric","face-id","password","secret","cred","jwt","crypt","key","agreement","age-gate","integrity","canonical","signature","signed","verif","hmac","unsubscribe","rate-limit","same-origin","unlock","passcode","hash","nonce","sso","mfa","totp","permission","role","admin","rls","csrf","cors","escrow","owner","presign","cookie","trust","identity","middleware","magic","otp","keychain","secure-stor","passkey","billing","payment","purchase","subscription","paywall","entitlement","iap","plus","security","supabase","privacy","terms","legal","consent"];
  for (const w of words) assert.ok(rulesFor(`apps/mobile/src/components/x/${w}-row.tsx`).includes("CR-70 path"), w);
});

test("CR-149 rule 4 (fail closed by default): every tracked file the rule misses sits under a known-safe place, so a new security folder cannot slip through unseen", () => {
  // The protected list is a deny list. This walks the real tree: a tracked file that gets no hit must be docs, a test,
  // a media asset, a UI component outside the protected folders, an experiment or one of the few named safe files.
  // A new file anywhere else fails here until someone adds it to the protected list or, after review, to SAFE.
  const SAFE = [/^docs\//, /(?:^|\/)(?:test|tests|__tests__|fixtures)\//, /\.test\.[a-z]+$/, /(?:^|\/)e2e-web\/(?:flows|subflows)\//, /(?:^|\/)e2e-web\/[^/]*\.flow\.ts$/, /(?:^|\/)e2e(?:-web)?\/[^/]*\.(?:md|txt)$/, /\.e2e\.ts$/,
    /^apps\/mobile\/src\/components\/(?:asks|book|capture|content-blocks|find|language|motion|platform|player|resilience|speech|tonight|ui)\//,
    /^apps\/web\/src\/(?:components|scenes|film)\//, /(?:^|\/)(?:assets|public)\/[^?#]*\.(?:png|jpe?g|gif|webp|avif|svg|ico|ttf|otf|woff2?|mp3|m4a|wav|mp4|webm)$/i,
    /(?:^|\/)readme\.md$/i,
    /^apps\/mobile\/components\.json$/, /^apps\/mobile\/src\/generated\/licences\.json$/, /^apps\/mobile\/src\/global\.css$/, /^apps\/mobile\/src\/uniwind-types\.d\.ts$/];
  // Pin SAFE itself: a widened entry would let these unprotected-by-name paths through unseen.
  for (const p of ["apps/mobile/src/newthing/x.ts", "packages/newpkg/src/x.ts", "apps/web/public/sw.js", "apps/web/public/_headers",
    "apps/mobile/e2e/scripts/reset-prod.js", "apps/mobile/e2e/newdir/x.js", "apps/mobile/src/components/handover/x.tsx", "apps/mobile/src/components/onboarding/x.tsx", "apps/mobile/src/components/settings/x.ts", "apps/mobile/assets/x.json", "x.ts", "apps/web/src/newdir/x.ts", "apps/mobile/e2e/seed.js", "apps/mobile/e2e/flows/E2E-02.yaml", "experiments/x.ts"]) {
    assert.ok(!SAFE.some((re) => re.test(p)), `SAFE must not admit ${p}`);
  }
  const owners = readFileSync(new URL("../../.github/CODEOWNERS", import.meta.url), "utf8");
  const tracked = execFileSync("git", ["ls-files"], { cwd: new URL("../..", import.meta.url), encoding: "utf8" }).split("\n").filter(Boolean);
  assert.ok(tracked.length > 1000, "git ls-files must list the tree");
  const unseen = tracked.filter((f) => protectedPathHits([f], owners).length === 0 && !SAFE.some((re) => re.test(f)));
  assert.deepEqual(unseen, [], "add each path to CR70_EXTRA_PATHS in merge-queue.mjs, or to SAFE here once a security review agrees it is safe");
});

test("CR-149 rule 4 and CR-70 (Review B, fifth pass): e2e scripts, sign-in and billing components, non-media public files and allowlists are protected", () => {
  for (const p of ["apps/mobile/e2e/scripts/lib-guard.js", "apps/mobile/e2e/scripts/ensure-user.js", "apps/mobile/e2e/bin/run-suite.sh",
    "apps/mobile/e2e/bin/run-p0-nightly.sh", "apps/mobile/e2e/bin/run-coparent.sh", "apps/mobile/e2e/scripts/reset-prod.js", "apps/mobile/e2e-web/support/x.ts",
    "apps/web/e2e/playwright.config.ts", "apps/mobile/e2e/config.yaml", "apps/mobile/src/components/onboarding/new-phone-screens.tsx", "apps/mobile/src/components/onboarding/outage-screen.tsx",
    "apps/mobile/src/components/onboarding/region-refused-screen.tsx", "apps/mobile/src/components/onboarding/handover.tsx",
    "apps/mobile/src/components/settings/plan.logic.ts", "apps/mobile/src/components/child/child-store.ts", "docs/ops/action-pins-allowlist.txt",
    "docs/qa/skip-allowlist.json", "docs/ops/deny-list.txt", "docs/ops/block_list.txt", "apps/mobile/e2e/flows/E2E-02-first-run.yaml", "apps/mobile/e2e/subflows/go-back.yaml", "experiments/edit-compare.ts", "experiments/setup.sh", "docs/store/compliance/data-safety-google-play.md", "docs/store/listing/en-GB.md", "apps/web/public/sw.js", "apps/web/public/_headers", "apps/web/public/export-format/v1.schema.json"]) {
    assert.ok(rulesFor(p).includes("CR-70 path"), p);
  }
  for (const p of ["apps/web/public/og/card.png", "apps/mobile/assets/fonts/x.woff2"]) assert.ok(!rulesFor(p).includes("CR-70 path"), p);
});

test("CR-70: folders that CODEOWNERS also names are protected by the code list too, so a trimmed CODEOWNERS cannot drop them", () => {
  const minimal = "*  @owner\ndocs/zzz-unused.md  @owner\n";
  for (const p of ["packages/content/src/x.ts", "packages/brand/colors.json", "docs/analytics/events.md", "agents/cto.md", ".claude/settings.json"]) {
    assert.ok(rulesFor(p, [p], minimal).includes("CR-70 path"), p);
  }
});

test("CR-149 rule 1 and 4: an entry with only an old name, or a blank or non-string name, is unreadable, never an empty change", () => {
  for (const f of [{ previous_filename: "docs/a.md" }, { filename: null, previous_filename: "docs/a.md" }, { filename: "", previous_filename: "docs/a.md" },
    { filename: "docs/a.md", previous_filename: "" }, { filename: "docs/a.md", previous_filename: 7 }, ""]) {
    assert.ok(touchesProtectedPath([f], CODEOWNERS), JSON.stringify(f));
    assert.equal(classifyPr([f]), "source", JSON.stringify(f));
  }
  assert.deepEqual(rulesFor("docs/a.md", [{ filename: "docs/a.md", previous_filename: null }]), []);
});

// ---------------------------------------------------------------------------------------------------------------------
// CR-149 wiring behind a flag (BL-1571). fake149 wraps fake() and answers only the three reads CR-149 adds: the base
// branch sha, CODEOWNERS at a sha and compare <head>...<sha>. Every other path goes to fake(), so existing tests see
// nothing new.
// ---------------------------------------------------------------------------------------------------------------------
const DEV1 = "1111111111111111111111111111111111111111";
const DEV2 = "2222222222222222222222222222222222222222";
const DEV3 = "3333333333333333333333333333333333333333";
const b64 = (text) => ({ encoding: "base64", content: Buffer.from(text).toString("base64").replace(/(.{60})/g, "$1\n") });
function fake149({ shas = [DEV1], owners = b64(CODEOWNERS), devFiles = {}, defaultDevFiles, throwOn = null, ...opts } = {}) {
  const calls = opts.calls ?? [];
  const inner = fake({ ...opts, calls });
  let reads = 0;
  return async (path, o = {}) => {
    const p = path.split("?")[0];
    if (throwOn && throwOn.test(p)) { calls.push({ path, method: o.method }); throw new Error("502"); }
    if (/\/branches\/develop$/.test(p)) {
      calls.push({ path, method: o.method });
      const sha = shas[Math.min(reads++, shas.length - 1)];
      return sha === undefined ? {} : { commit: { sha } };
    }
    if (p.endsWith("/contents/.github/CODEOWNERS")) { calls.push({ path, method: o.method }); return typeof owners === "function" ? owners(/[?&]ref=([0-9a-f]{40})/.exec(path)?.[1]) : owners; }
    const m = /\/compare\/([0-9a-f]{40})\.\.\.([0-9a-f]{40})$/.exec(p);
    if (m) {
      calls.push({ path, method: o.method });
      const list = devFiles[m[2]] ?? defaultDevFiles ?? (opts.baseFiles ?? []).map((filename) => ({ filename }));
      return { files: list.map((f) => (typeof f === "string" ? { filename: f } : f)) };
    }
    return inner(path, o);
  };
}
const both149 = () => [review("A", HEAD), review("B", HEAD)];
/** A PR the strict rule sends to NEEDS-UPDATE: both passes, green, behind by 3 with develop's files in a shared workspace. */
const stale149 = (files, baseFiles) => ({ comments: both149(), files, behindBy: 3, baseFiles });
const DOCS_PR = stale149(["docs/ops/notes.md"], ["docs/ops/other.md"]);
const TEST_PR = stale149(["apps/mobile/test/foo.test.ts"], ["apps/mobile/src/components/books/Other.tsx"]);
const SOURCE_PR = stale149(["apps/mobile/src/components/books/Card.tsx"], ["apps/mobile/src/components/books/Other.tsx"]);
function treeStub(answer = "clean") {
  const seen = [];
  const fn = async (baseSha, head) => { seen.push([baseSha, head]); return typeof answer === "function" ? answer(baseSha, head) : answer; };
  fn.seen = seen;
  return fn;
}
const run149 = async (opts, { mergeTree = treeStub(), cr149 = true, quietMinutes = 10, notices = [] } = {}) => {
  const calls = opts.calls ?? [];
  const rows = await buildQueue({ api: fake149({ ...opts, calls }), now: NOW, quietMinutes, cr149, mergeTree, notices });
  assert.equal(rows.length, 1);
  return { r: rows[0], calls, mergeTree };
};

test("CR-149 flag: only the exact string 1 turns it on; everything else, and no env, is off", () => {
  assert.equal(CR149_FLAG, "MERGE_QUEUE_CR149");
  assert.equal(cr149FlagOn({ MERGE_QUEUE_CR149: "1" }), true);
  for (const v of ["", "0", "true", "yes", "TRUE", " 1", "1 ", "on", undefined]) assert.equal(cr149FlagOn({ MERGE_QUEUE_CR149: v }), false, String(v));
  assert.equal(cr149FlagOn({}), false);
  assert.equal(cr149FlagOn(undefined), false);
  assert.equal(cr149FlagOn(null), false);
});

test("CR-149 flag: the flag is read in one place only, main(), which passes cr149 to buildQueue", () => {
  const src = readFileSync(new URL("./merge-queue.mjs", import.meta.url), "utf8");
  // process.env appears twice: main() reads the flag, and GIT_ENV copies the environment for the local git reads
  // (FU-17b, grafts off). GIT_ENV never reads the flag, and nothing else reads process.env.
  assert.equal(src.match(/process\.env/g).length, 2);
  assert.match(src, /cr149: cr149FlagOn\(process\.env\)/);
  assert.match(src, /const GIT_ENV = \{ \.\.\.process\.env, GIT_GRAFT_FILE: "[^"]+", GIT_TERMINAL_PROMPT: "0" \};/);
  assert.equal(src.match(/\[CR149_FLAG\]/g).length, 1, "one lookup of the flag, in cr149FlagOn");
});

test("CR-149 flag off (default): a stale-base PR is NEEDS-UPDATE exactly, with no new call, no new field and no CR-149 note", async () => {
  for (const cr149 of [undefined, false, "1"]) {
    const calls = [];
    const mergeTree = treeStub();
    const rows = await buildQueue({ api: fake149({ ...DOCS_PR, calls }), now: NOW, mergeTree, ...(cr149 === undefined ? {} : { cr149 }) });
    const r = rows[0];
    assert.equal(r.verdict, "NEEDS-UPDATE", String(cr149));
    assert.equal(r.mergeNote, undefined);
    assert.equal("cr149" in r, false);
    assert.ok(!calls.some((c) => /\/branches\/develop$/.test(c.path.split("?")[0]) || c.path.includes("/contents/") || /\/compare\/[0-9a-f]{40}\.\.\.[0-9a-f]{40}/.test(c.path)), "no CODEOWNERS, branch-sha or sha compare call");
    assert.equal(mergeTree.seen.length, 0, "merge-tree never runs with the flag off");
    assert.doesNotMatch(formatTable(rows), /CR-149/);
  }
  // The same calls and the same table as fake() alone: nothing CR-149 adds is reached.
  const a = [];
  const b = [];
  const ra = await buildQueue({ api: fake({ ...DOCS_PR, calls: a }), now: NOW });
  const rb = await buildQueue({ api: fake149({ ...DOCS_PR, calls: b }), now: NOW });
  assert.deepEqual(b.map((c) => c.path), a.map((c) => c.path));
  assert.equal(formatTable(rb), formatTable(ra));
});

test("CR-149 flag on: a docs-only PR with no overlap, a clean merge-tree, no protected path and a stable sha is READY CR-149", async () => {
  const { r, calls, mergeTree } = await run149(DOCS_PR);
  assert.equal(r.verdict, "READY CR-149 (no overlap, merge-tree clean, docs)");
  assert.equal(r.mergeNote, `#7 ready for Karma to merge (CR-73, relaxed by CR-149) at ${HEAD}; checked against develop ${DEV1}: re-read develop just before merging and re-run this queue if it moved`);
  assert.deepEqual([r.cr149.ok, r.cr149.class, r.cr149.baseSha, r.cr149.rereads, r.cr149.met], [true, "docs", DEV1, 0, ["rule 3", "rule 4", "rule 1", "rule 2", "rule 5"]]);
  assert.deepEqual(mergeTree.seen, [[DEV1, HEAD]]);
  assert.ok(calls.some((c) => c.path === `repos/thesaurabhpareek/earlyletters/contents/.github/CODEOWNERS?ref=${DEV1}`));
  assert.ok(calls.some((c) => c.path === `repos/thesaurabhpareek/earlyletters/compare/${HEAD}...${DEV1}`));
  assert.ok(calls.every((c) => c.method === "GET" && c.path.startsWith("repos/")));
  const out = formatTable([r]);
  assert.ok(out.includes(`note: #7 CR-149 (flag on): base behind by 3 in docs/ops, but no file overlap, merge-tree clean against develop ${DEV1}, checks green and two reviews at head, no protected path; class docs`));
  assert.ok(out.split("\n").includes(r.mergeNote));
  assert.doesNotMatch(out, /founder|your |paste|approve/i);
});

test("CR-149 flag on: a test-only PR is READY CR-149 (test); a source PR is told to run its tests and tsc on the scratch merge", async () => {
  assert.equal((await run149(TEST_PR)).r.verdict, "READY CR-149 (no overlap, merge-tree clean, test)");
  assert.equal(touchesProtectedPath(["apps/mobile/src/components/books/Card.tsx"], CODEOWNERS), false, "fixture path is not protected");
  const { r } = await run149(SOURCE_PR);
  assert.equal(r.verdict, "READY CR-149 (no overlap, merge-tree clean, source: run its tests and tsc on the scratch merge first)");
  assert.match(r.mergeNote, /relaxed by CR-149\) at a83634ced2a5ecf32717bf833f941b892fc660b9; checked against develop 1{40}: .*; run its tests and tsc on the scratch merge first$/);
  assert.match(formatTable([r]), /class source/);
  // --only READY keeps matching: the filter accepts "READY " as a prefix.
  assert.ok(r.verdict.startsWith("READY "));
  assert.equal(cr149Verdict("weird"), cr149Verdict("source"), "an unknown class is source");
});

test("CR-149 rule 1: an overlapping file, or a develop rename whose old name is the PR's file, keeps NEEDS-UPDATE naming rule 1", async () => {
  const shared = await run149({ ...DOCS_PR, defaultDevFiles: ["docs/ops/other.md", "docs/ops/notes.md"] });
  assert.equal(shared.r.verdict, "NEEDS-UPDATE");
  assert.equal(shared.r.cr149.failed, "rule 1: file overlap docs/ops/notes.md");
  assert.equal(shared.r.mergeNote, undefined);
  assert.equal(shared.mergeTree.seen.length, 0, "rule 2 is not reached");
  assert.match(formatTable([shared.r]), /note: #7 CR-149 \(flag on\) kept the strict rule: rule 1: file overlap docs\/ops\/notes\.md/);
  const renamed = await run149({ ...DOCS_PR, defaultDevFiles: [{ filename: "docs/ops/renamed.md", previous_filename: "docs/ops/notes.md" }] });
  assert.equal(renamed.r.verdict, "NEEDS-UPDATE");
  assert.match(renamed.r.cr149.failed, /^rule 1: /);
});

test("CR-149 rule 1 fails closed: a develop list of 300 files may be cut off, and a missing list, are overlap", async () => {
  const many = Array.from({ length: 300 }, (_, i) => `docs/ops/f${i}.md`);
  const cut = await run149({ ...DOCS_PR, defaultDevFiles: many });
  assert.equal(cut.r.verdict, "NEEDS-UPDATE");
  assert.equal(cut.r.cr149.failed, `rule 1: file overlap ${UNREADABLE}`);
  const ok299 = await run149({ ...DOCS_PR, defaultDevFiles: many.slice(0, 299) });
  assert.equal(ok299.r.verdict, "READY CR-149 (no overlap, merge-tree clean, docs)", "299 files is a full list");
  const noList = await run149({ ...DOCS_PR, throwOn: /\/compare\/[0-9a-f]{40}\.\.\.[0-9a-f]{40}$/ });
  assert.equal(noList.r.verdict, "NEEDS-UPDATE");
  assert.match(noList.r.cr149.failed, /^rule 1: file overlap \(unreadable input\)/);
});

test("CR-149 rule 2: a merge-tree conflict, or one that could not run, keeps NEEDS-UPDATE naming rule 2", async () => {
  const conflict = await run149(DOCS_PR, { mergeTree: treeStub("conflict") });
  assert.equal(conflict.r.verdict, "NEEDS-UPDATE");
  assert.equal(conflict.r.cr149.failed, "rule 2: merge-tree conflict");
  for (const answer of ["error", "CLEAN", null, () => { throw new Error("spawn"); }]) {
    const e = await run149(DOCS_PR, { mergeTree: treeStub(answer) });
    assert.equal(e.r.verdict, "NEEDS-UPDATE", String(answer));
    assert.equal(e.r.cr149.failed, "rule 2: merge-tree could not run");
  }
});

test("CR-149 rule 4: a CR-70 path, a path only CODEOWNERS names, and an unreadable CODEOWNERS keep NEEDS-UPDATE naming rule 4", async () => {
  const agents = await run149({ ...stale149(["scripts/agents/x.mjs"], ["scripts/agents/y.mjs"]), comments: [review("A", HEAD, "Lens: security\n"), review("B", HEAD)] });
  assert.equal(agents.r.verdict, "NEEDS-UPDATE");
  assert.equal(agents.r.cr149.failed, "rule 4: protected path scripts/agents/x.mjs (CR-70 path, CODEOWNERS /scripts/agents/)");
  // docs/ops/owned/ is protected only by a CODEOWNERS line read at the develop sha.
  const owned = stale149(["docs/ops/owned/x.md"], ["docs/ops/other.md"]);
  assert.equal((await run149(owned)).r.verdict, "READY CR-149 (no overlap, merge-tree clean, docs)", "not owned in the real file");
  const byOwners = await run149({ ...owned, owners: b64(`${CODEOWNERS}\n/docs/ops/owned/ @owner\n`) });
  assert.equal(byOwners.r.verdict, "NEEDS-UPDATE");
  assert.equal(byOwners.r.cr149.failed, "rule 4: protected path docs/ops/owned/x.md (CODEOWNERS /docs/ops/owned/)");
  for (const owners of [null, {}, { encoding: "none", content: "" }, { encoding: "base64", content: "" }, { encoding: "base64", content: 7 }]) {
    const u = await run149({ ...DOCS_PR, owners });
    assert.equal(u.r.verdict, "NEEDS-UPDATE", JSON.stringify(owners));
    assert.match(u.r.cr149.failed, /^rule 4: protected path docs\/ops\/notes\.md \(CODEOWNERS text (missing|empty)\)$/);
  }
  const thrown = await run149({ ...DOCS_PR, throwOn: /\/contents\// });
  assert.match(thrown.r.cr149.failed, /^rule 4: .*CODEOWNERS text missing/);
});

test("CR-149 rule 5: develop moves once, so rules 4, 1 and 2 run again on the new sha, and a clean new state still passes", async () => {
  const { r, calls, mergeTree } = await run149({ ...DOCS_PR, shas: [DEV1, DEV2, DEV2] });
  assert.equal(r.verdict, "READY CR-149 (no overlap, merge-tree clean, docs)");
  assert.deepEqual([r.cr149.baseSha, r.cr149.rereads], [DEV2, 1]);
  assert.deepEqual(mergeTree.seen, [[DEV1, HEAD], [DEV2, HEAD]]);
  for (const sha of [DEV1, DEV2]) {
    assert.ok(calls.some((c) => c.path.endsWith(`/compare/${HEAD}...${sha}`)), `compare at ${sha}`);
    assert.ok(calls.some((c) => c.path.endsWith(`CODEOWNERS?ref=${sha}`)), `CODEOWNERS at ${sha}`);
  }
  assert.match(r.mergeNote, new RegExp(`checked against develop ${DEV2}:`));
  assert.match(formatTable([r]), /; re-run 1 time after develop moved/);
});

test("CR-149 rule 5: develop moving on every read is NEEDS-UPDATE, kept moving; a move that brings an overlap fails rule 1", async () => {
  const moving = await run149({ ...DOCS_PR, shas: [DEV1, DEV2, DEV3, DEV1, DEV2] });
  assert.equal(moving.r.verdict, "NEEDS-UPDATE");
  assert.equal(moving.r.cr149.failed, "rule 5: develop kept moving");
  assert.equal(moving.mergeTree.seen.length, 3, "the first run and two re-runs");
  const overlap = await run149({ ...DOCS_PR, shas: [DEV1, DEV2, DEV2], devFiles: { [DEV1]: ["docs/ops/other.md"], [DEV2]: ["docs/ops/other.md", "docs/ops/notes.md"] } });
  assert.equal(overlap.r.verdict, "NEEDS-UPDATE");
  assert.equal(overlap.r.cr149.failed, "rule 1: file overlap docs/ops/notes.md");
  assert.equal(overlap.r.cr149.baseSha, DEV2);
});

test("CR-149 rule 5: the re-run checks rules 4 and 2 again, so a protected path or a conflict that only the new sha has fails", async () => {
  const owned = { ...DOCS_PR, shas: [DEV1, DEV2, DEV2] };
  // CODEOWNERS gains an entry for the PR's folder only at the new sha.
  const ownedLater = await run149({ ...owned, owners: (ref) => b64(ref === DEV2 ? `${CODEOWNERS}\n/docs/ops/ @owner\n` : CODEOWNERS) });
  assert.equal(ownedLater.r.verdict, "NEEDS-UPDATE");
  assert.equal(ownedLater.r.cr149.failed, "rule 4: protected path docs/ops/notes.md (CODEOWNERS /docs/ops/)");
  assert.equal(ownedLater.r.cr149.baseSha, DEV2);
  const conflictLater = await run149(owned, { mergeTree: treeStub((sha) => (sha === DEV2 ? "conflict" : "clean")) });
  assert.equal(conflictLater.r.verdict, "NEEDS-UPDATE");
  assert.equal(conflictLater.r.cr149.failed, "rule 2: merge-tree conflict");
  assert.equal(conflictLater.r.cr149.baseSha, DEV2);
});

test("CR-149: only PRs into develop are relaxed; a PR into main keeps NEEDS-UPDATE with no CR-149 reads", async () => {
  const calls = [];
  const api = fake149({ ...DOCS_PR, calls });
  const main = async (path, o) => {
    const p = path.split("?")[0];
    if (p.endsWith("/pulls")) return [{ number: 7, draft: false, head: { sha: HEAD }, base: { ref: "main" } }];
    if (p.includes("/compare/main...")) return { behind_by: 3 };
    if (p.endsWith("...main")) return { files: [{ filename: "docs/ops/other.md" }] };
    if (p.endsWith("/branches/main/protection")) return PROT;
    return api(path, o);
  };
  const [r] = await buildQueue({ api: main, now: NOW, quietMinutes: 10, cr149: true, mergeTree: treeStub(), base: "main" });
  assert.equal(r.verdict, "NEEDS-UPDATE");
  assert.equal(r.cr149, undefined);
  assert.ok(!calls.some((c) => /\/branches\/[^/]+$|CODEOWNERS|\/compare\/[0-9a-f]{40}\.\.\.[0-9a-f]{40}$/.test(c.path.split("?")[0])), "no CR-149 read for a PR into main");
});

test("CR-149 rule 4: the two CR-229 paths (the NS register and the trace baseline) are protected", async () => {
  for (const f of ["docs/product/prd/14-test-plan.md", "docs/ops/trace-ns-baseline.txt"]) {
    assert.ok(protectedPathHits([f], CODEOWNERS).some((h) => h.rules.includes("CR-70 path")), f);
    const dir = f.slice(0, f.lastIndexOf("/"));
    // Both are on the security-lens list too (CR-229), so the reviews name that lens to reach the CR-149 step at all.
    const r = (await run149({ ...stale149([f], [`${dir}/other.md`]), comments: [review("A", HEAD), review("B", HEAD, "Lens: security\n")] })).r;
    assert.equal(r.verdict, "NEEDS-UPDATE", f);
    assert.match(r.cr149.failed, new RegExp(`^rule 4: protected path ${f.replace(/[.]/g, "\\.")} \\(CR-70 path`), f);
  }
});

test("CR-149: an unreadable develop sha, or one that is not 40 hex, keeps NEEDS-UPDATE", async () => {
  for (const shas of [[undefined], ["abc"], ["ab".repeat(20).toUpperCase()], [`${DEV1}0`], [7]]) {
    const { r, mergeTree } = await run149({ ...DOCS_PR, shas });
    assert.equal(r.verdict, "NEEDS-UPDATE", JSON.stringify(shas));
    assert.equal(r.cr149.failed, "rule 5: develop sha unreadable");
    assert.equal(mergeTree.seen.length, 0);
  }
  const reread = await run149({ ...DOCS_PR, shas: [DEV1, undefined] });
  assert.equal(reread.r.cr149.failed, "rule 5: develop sha unreadable on the re-read");
  const thrown = await run149({ ...DOCS_PR, throwOn: /\/branches\/develop$/ });
  assert.equal(thrown.r.verdict, "NEEDS-UPDATE");
  // evaluateCr149 refuses a head that is not 40 hex before any call.
  const calls = [];
  const res = await evaluateCr149({ get: async (p) => { calls.push(p); return {}; }, repo: "o/r", base: "develop", head: "abc", prFiles: ["docs/x.md"], mergeTree: treeStub() });
  assert.deepEqual([res.ok, res.rule, calls.length], [false, "rule 5", 0]);
});

test("CR-149: an API throw inside the evaluation is a failed rule, not READY, and the rest of the queue still builds", async () => {
  const extraPrs = [{ number: 9, draft: false, head: { sha: OLD }, base: { ref: "develop" } }];
  const inner = fake149({ ...DOCS_PR, extraPrs });
  const api = async (path, o) => {
    const p = path.split("?")[0];
    if (/\/(?:pulls|issues)\/9\//.test(p) || p.endsWith("/pulls/9")) return p.endsWith("/files") || p.endsWith("/comments") ? [] : { mergeable_state: "clean", changed_files: 0 };
    if (p.includes(OLD)) return p.endsWith("/check-runs") ? { check_runs: [] } : { commit: { committer: { date: ago(60) } } };
    if (p.includes("/contents/") || /\/compare\/[0-9a-f]{40}\.\.\.[0-9a-f]{40}$/.test(p)) throw new Error("gh api failed");
    return inner(path, o);
  };
  const rows = await buildQueue({ api, now: NOW, cr149: true, mergeTree: treeStub() });
  assert.deepEqual(rows.map((r) => [r.number, r.verdict]), [[7, "NEEDS-UPDATE"], [9, "NEEDS-REVIEW"]]);
  assert.equal(rows[0].cr149.ok, false);
  assert.match(rows[0].cr149.failed, /^rule 4: /);
  // A get that throws on every call, straight into evaluateCr149: a failed rule, never ok.
  const res = await evaluateCr149({ get: async () => { throw new Error("x"); }, repo: "o/r", base: "develop", head: HEAD, prFiles: ["docs/x.md"], mergeTree: treeStub() });
  assert.deepEqual([res.ok, res.failed], [false, "rule 5: develop sha unreadable"]);
  const half = await evaluateCr149({ get: async (p) => { if (p.includes("/branches/")) return { commit: { sha: DEV1 } }; throw new Error("x"); }, repo: "o/r", base: "develop", head: HEAD, prFiles: ["docs/x.md"], mergeTree: treeStub() });
  assert.equal(half.ok, false);
});

test("CR-149 flag on: a relaxed PR that is not quiet yet is WAIT-QUIET; verdicts before NEEDS-UPDATE keep their place", async () => {
  const young = await run149({ ...DOCS_PR, pushedMin: 2 });
  assert.equal(young.r.verdict, "WAIT-QUIET");
  assert.equal(young.r.cr149.ok, true);
  assert.equal(young.r.mergeNote, undefined);
  for (const [extra, want] of [[{ state: "dirty" }, "DIRTY"], [{ runs: [good[0]] }, "WAIT-CI"], [{ comments: [review("A", HEAD)] }, "NEEDS-REVIEW"], [{ compareFail: true }, "NEEDS-REVIEW"]]) {
    const { r, mergeTree } = await run149({ ...DOCS_PR, ...extra });
    assert.equal(r.verdict, want, JSON.stringify(extra));
    assert.equal("cr149" in r, false, "the evaluation runs only where the strict rule says NEEDS-UPDATE");
    assert.equal(mergeTree.seen.length, 0);
  }
  // Not behind in a shared workspace: the strict READY, untouched.
  const fresh = await run149({ ...DOCS_PR, behindBy: 0 });
  assert.equal(fresh.r.verdict, "READY");
  assert.equal(fresh.r.mergeNote, `#7 ready for Karma to merge (CR-73) at ${HEAD}`);
  // verdictFor alone: a cr149 that is not exactly ok true keeps NEEDS-UPDATE.
  const row = { reviews: { A: true, B: true, blocked: {}, staleLenses: [] }, checks: { required: "success", macos: {} }, required: ["required"], mergeable_state: "clean", pushAgeMinutes: 60, staleBase: { behindBy: 1, shared: ["docs"] } };
  for (const cr149 of [undefined, { ok: false }, { ok: "true", class: "docs" }, { ok: 1, class: "docs" }]) assert.equal(verdictFor({ ...row, cr149 }, 10), "NEEDS-UPDATE", JSON.stringify(cr149));
  assert.equal(verdictFor({ ...row, cr149: { ok: true, class: "docs" } }, 10), "READY CR-149 (no overlap, merge-tree clean, docs)");
});

test("CR-149: formatTable prints the relaxed note and the failed note, and cleans what came from the API", async () => {
  const ok = (await run149(DOCS_PR)).r;
  const bad = (await run149({ ...DOCS_PR, defaultDevFiles: [{ filename: "docs/ops/notes.md" }] })).r;
  const out = formatTable([ok, { ...bad, number: 8 }]);
  assert.match(out, /note: #7 CR-149 \(flag on\): base behind by 3 in docs\/ops, but no file overlap, merge-tree clean against develop 1{40}, checks green and two reviews at head, no protected path; class docs/);
  assert.match(out, /note: #8 CR-149 \(flag on\) kept the strict rule: rule 1: file overlap docs\/ops\/notes\.md/);
  // A relaxed row does not also get the "update the branch" note; a row that kept the strict rule still does.
  assert.doesNotMatch(out, /note: #7 base is behind develop by 3 commits that touch/);
  assert.match(out, /note: #8 base is behind develop by 3 commits that touch docs\/ops: update the branch/);
  const dirty = { ...bad, number: 8, cr149: { ...bad.cr149, failed: "rule 1: file overlap \u001b[31mdocs/x.md\u0007" } };
  assert.doesNotMatch(formatTable([dirty]), /[\u001b\u0007]/);
  assert.match(formatTable([dirty]), /kept the strict rule: rule 1: file overlap docs\/x\.md$/m);
});

test("CR-149 rule 2 default (gitMergeTree): refuses an argument that is not 40 hex without running git, reads only the exit code", async () => {
  const ran = [];
  // merge-tree prints the tree id; the mode check that follows (diff-tree) prints nothing, an empty diff.
  const run = (cmd, args, opts, cb) => { ran.push({ cmd, args, opts }); cb(null, args[1] === "merge-tree" ? `${DEV3}\n` : "", "noise"); };
  for (const [a, b] of [["abc", HEAD], [HEAD, "--output=/tmp/x"], [HEAD.toUpperCase(), HEAD], [HEAD, `${HEAD} --foo`], [undefined, HEAD], [HEAD, null]]) {
    assert.equal(await gitMergeTree(a, b, { run }), "error", `${a} ${b}`);
  }
  assert.equal(ran.length, 0, "git never runs on a bad argument");
  assert.equal(await gitMergeTree(DEV1, HEAD, { run }), "clean");
  assert.deepEqual([ran[0].cmd, ran[0].args], ["git", ["--no-replace-objects", "merge-tree", "--write-tree", "--no-messages", DEV1, HEAD]]);
  assert.equal(ran[0].opts.timeout, 60000);
  assert.ok(ran[0].opts.maxBuffer > 0 && !ran[0].opts.shell);
  assert.deepEqual([ran[1].cmd, ran[1].args], ["git", ["--no-replace-objects", "diff-tree", "-r", "-z", "--raw", "--no-renames", "--ignore-submodules=none", DEV1, DEV3]], "FU-17a: the mode check runs on the tree merge-tree wrote");
  assert.ok(ran[1].opts.timeout > 0 && !ran[1].opts.shell);
  const exit = (err, stdout = `${DEV3}\nconflict info\n`) => (cmd, args, opts, cb) => cb(err, args[1] === "merge-tree" ? stdout : "", "");
  assert.equal(await gitMergeTree(DEV1, HEAD, { run: exit(Object.assign(new Error("x"), { code: 1 })) }), "conflict");
  // git 2.43 exits 1 for a commit it cannot find too, with no tree id on stdout: that is "could not run", not a conflict.
  assert.equal(await gitMergeTree(DEV1, HEAD, { run: exit(Object.assign(new Error("x"), { code: 1 }), "") }), "error");
  assert.equal(await gitMergeTree(DEV1, HEAD, { run: exit(null, "") }), "error", "exit 0 without a tree id is not clean");
  assert.equal(await gitMergeTree(DEV1, HEAD, { run: exit(null, "not a tree\n") }), "error");
  for (const err of [{ code: 128 }, { code: 129 }, { code: 1, killed: true }, { code: null, signal: "SIGTERM" }, { code: "ENOENT" }, { code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" }]) {
    assert.equal(await gitMergeTree(DEV1, HEAD, { run: exit(Object.assign(new Error("x"), err)) }), "error", JSON.stringify(err));
  }
  assert.equal(await gitMergeTree(DEV1, HEAD, { run: () => { throw new Error("spawn"); } }), "error");
});

test("CR-149 rule 2 default (gitMergeTree): real git on this checkout's own HEAD merged with itself is clean; a missing commit is error", async () => {
  const self = execFileSync("git", ["rev-parse", "HEAD"], { cwd: new URL("../..", import.meta.url), encoding: "utf8" }).trim();
  assert.match(self, /^[0-9a-f]{40}$/);
  assert.equal(await gitMergeTree(self, self), "clean");
  assert.equal(await gitMergeTree("0".repeat(40), self), "error");
});

// FU-17a: CR-70's mode check. The files API shows no file mode, so a symlink or a submodule is found on the merge itself.
const RAW = (src, dst, status, path) => `:${src} ${dst} ${"a".repeat(40)} ${"b".repeat(40)} ${status}\0${path}\0`;

test("FU-17a: readRawModes finds mode 120000 or 160000 on either side of any entry, and fails closed on output it cannot read", () => {
  assert.deepEqual([...SPECIAL_MODES].sort(), ["120000", "160000"]);
  assert.equal(readRawModes(""), "ok", "an empty diff has nothing to refuse");
  assert.equal(readRawModes(RAW("000000", "100644", "A", "docs/a.md") + RAW("100644", "100755", "M", "scripts/x.sh")), "ok");
  for (const [src, dst, status] of [["000000", "120000", "A"], ["120000", "000000", "D"], ["100644", "120000", "T"], ["120000", "100644", "T"], ["000000", "160000", "A"], ["160000", "000000", "D"], ["160000", "160000", "M"], ["120000", "120000", "M"]]) {
    assert.equal(readRawModes(RAW("100644", "100644", "M", "docs/a.md") + RAW(src, dst, status, "link")), "special", `${src} ${dst} ${status}`);
  }
  // A rename read with --no-renames is a delete and an add: a symlink on the old path still counts.
  assert.equal(readRawModes(RAW("120000", "000000", "D", "old") + RAW("000000", "100644", "A", "new")), "special");
  for (const bad of [
    "junk\0path\0",
    `:100644 100644 ${"a".repeat(40)} ${"b".repeat(40)} M\0\0`, // header with an empty path
    `:100644 100644 ${"a".repeat(40)} ${"b".repeat(40)} M\0`, // header and no path
    `:100644 100644 ${"a".repeat(40)} ${"b".repeat(40)} R100\0old\0new\0`, // a rename record: --no-renames never prints one
    `:10064 100644 ${"a".repeat(40)} ${"b".repeat(40)} M\0a\0`,
    `:100644 100644 ${"a".repeat(39)} ${"b".repeat(40)} M\0a\0`,
    "docs/a.md\0",
    undefined,
    null,
  ]) {
    assert.equal(readRawModes(bad), "error", JSON.stringify(bad));
  }
});

test("FU-17a: gitModeCheck runs diff-tree on 40-hex arguments only, through execFile with no shell, and any failure is error", async () => {
  const ran = [];
  const out = (err, stdout) => (cmd, args, opts, cb) => { ran.push({ cmd, args, opts }); cb(err, stdout, "noise"); };
  for (const [a, b] of [["abc", DEV3], [DEV1, "--output=/tmp/x"], ["A".repeat(40), DEV3], [undefined, DEV3], [DEV1, null]]) {
    assert.equal(await gitModeCheck(a, b, { run: out(null, "") }), "error", `${a} ${b}`);
  }
  assert.equal(ran.length, 0, "git never runs on a bad argument");
  assert.equal(await gitModeCheck(DEV1, DEV3, { run: out(null, "") }), "ok");
  assert.deepEqual([ran[0].cmd, ran[0].args], ["git", ["--no-replace-objects", "diff-tree", "-r", "-z", "--raw", "--no-renames", "--ignore-submodules=none", DEV1, DEV3]]);
  assert.ok(!ran[0].opts.shell && ran[0].opts.maxBuffer > 0 && ran[0].opts.timeout > 0);
  assert.equal(await gitModeCheck(DEV1, DEV3, { run: out(null, RAW("000000", "120000", "A", "l")) }), "special");
  assert.equal(await gitModeCheck(DEV1, DEV3, { run: out(Object.assign(new Error("x"), { code: 128 }), "") }), "error");
  assert.equal(await gitModeCheck(DEV1, DEV3, { run: out(null, "garbage") }), "error");
  assert.equal(await gitModeCheck(DEV1, DEV3, { run: () => { throw new Error("spawn"); } }), "error");
  // Wired into gitMergeTree: a clean merge whose tree has a symlink is "special", and a mode check that fails is "error".
  const both = (diff) => (cmd, args, opts, cb) => cb(diff instanceof Error && args[1] === "diff-tree" ? diff : null, args[1] === "merge-tree" ? `${DEV3}\n` : diff instanceof Error ? "" : diff, "");
  assert.equal(await gitMergeTree(DEV1, HEAD, { run: both(RAW("000000", "160000", "A", "vendor/x")) }), "special");
  assert.equal(await gitMergeTree(DEV1, HEAD, { run: both(Object.assign(new Error("x"), { code: 128 })) }), "error");
  assert.equal(await gitMergeTree(DEV1, HEAD, { run: both("not raw") }), "error");
});

test("FU-17a: real git, a scratch repo: a merge that adds a symlink or a submodule is special, a plain file merge is clean", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mq-fu17a-"));
  try {
    const g = (...args) => execFileSync("git", ["-c", "user.name=Asha", "-c", "user.email=asha@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: dir, encoding: "utf8" }).trim();
    g("init", "-q", "-b", "main");
    writeFileSync(join(dir, "a.txt"), "a\n");
    g("add", "a.txt");
    g("commit", "-q", "-m", "base");
    const base = g("rev-parse", "HEAD");
    const branch = (name, fn) => { g("checkout", "-q", "-b", name, base); fn(); g("commit", "-q", "-m", name); return g("rev-parse", "HEAD"); };
    const plain = branch("plain", () => { writeFileSync(join(dir, "b.txt"), "b\n"); g("add", "b.txt"); });
    const link = branch("link", () => { symlinkSync("a.txt", join(dir, "l")); g("add", "l"); });
    const sub = branch("sub", () => g("update-index", "--add", "--cacheinfo", `160000,${base},vendor/x`));
    const typeChange = branch("typechange", () => { g("rm", "-q", "a.txt"); symlinkSync("b", join(dir, "a.txt")); g("add", "a.txt"); });
    g("checkout", "-q", "main");
    const mt = (h) => gitMergeTree(base, h, { cwd: dir });
    assert.equal(await mt(plain), "clean");
    assert.equal(await mt(link), "special", "a new symlink");
    assert.equal(await mt(sub), "special", "a new submodule (gitlink)");
    assert.equal(await mt(typeChange), "special", "a file turned into a symlink");
    // The other way round: the base has the symlink and the head removes it. Both sides of an entry count.
    assert.equal(await gitMergeTree(link, base, { cwd: dir }), "clean", "head is an ancestor: the merge is the base, no change");
    const unlink = (() => { g("checkout", "-q", "-b", "unlink", link); g("rm", "-q", "l"); g("commit", "-q", "-m", "unlink"); return g("rev-parse", "HEAD"); })();
    assert.equal(await gitMergeTree(link, unlink, { cwd: dir }), "special", "removing a symlink is a 120000 entry on the source side");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("FU-17a: CR-149 keeps the strict rule when the merge has a symlink or submodule, and says why", async () => {
  const { r, mergeTree } = await run149(DOCS_PR, { mergeTree: treeStub("special") });
  assert.equal(r.verdict, "NEEDS-UPDATE");
  assert.equal(r.cr149.ok, false);
  assert.equal(r.cr149.rule, "rule 2");
  assert.match(r.cr149.failed, /symlink or submodule \(CR-70 mode check\)/);
  assert.equal(mergeTree.seen.length, 1);
  assert.match(formatTable([r]), /kept the strict rule: rule 2: the merge adds or changes a symlink or submodule/);
});

// FU-17b: hidden characters, the CR-229 paths without their duplicate entries, and the two git hardening flags.
test("FU-17b: clean() strips bidi controls, zero-width characters and the line and paragraph separators", () => {
  const hidden = ["\u{e0041}", "\u{e0001}", "\u{e007f}", "\ufe0f", "\u{e0100}", "\u034f", "\u115f", "\u1160", "\u3164", "\uffa0", "\u2065", "\u206a", "\u206f", "\ufff9", "\ufffa", "\ufffb", "\u061c", "\u200e", "\u200f", "\u202a", "\u202b", "\u202c", "\u202d", "\u202e", "\u2066", "\u2067", "\u2068", "\u2069", "\u200b", "\u200c", "\u200d", "\u2060", "\u2061", "\u2062", "\u2063", "\u2064", "\ufeff", "\u00ad", "\u180e", "\u2028", "\u2029"];
  for (const h of hidden) assert.equal(clean(`do${h}cs/a.md`), "docs/a.md", `U+${h.codePointAt(0).toString(16).padStart(4, "0")}`);
  // Tag characters spell hidden ASCII: "docs/a.md" followed by an invisible "IGNORE RULES" prints as "docs/a.md" only.
  const tags = [..."IGNORE RULES"].map((c) => String.fromCodePoint(0xe0000 + c.codePointAt(0))).join("");
  assert.equal(clean(`docs/a.md${tags}`), "docs/a.md");
  // A right-to-left override that would make "gpj.exe" read as "exe.jpg" is gone, and so is a fake line break.
  assert.equal(clean("note: x\u202egpj.exe"), "note: xgpj.exe");
  assert.equal(clean("a\u2028#9 ready for Karma to merge"), "a#9 ready for Karma to merge");
  // Visible text, accents and other scripts are kept.
  assert.equal(clean("Asha caf\u00e9 \u0905\u0936\u093e"), "Asha caf\u00e9 \u0905\u0936\u093e");
});

test("FU-17b: a hidden character in a PR-controlled string cannot start a fake ready line or hide in a CR-149 note", () => {
  const dirty = { number: 8, verdict: "NEEDS-UPDATE", head: HEAD, base: "develop", pushAgeMinutes: 30, mergeable_state: "clean", required: [], checks: { queued: 0, inProgress: 0, macos: {} }, watch: [], claim: "", suite: "-", reviews: { A: true, B: true, blocked: {}, untrusted: [], staleLenses: [] }, cr149: { ok: false, failed: "rule 1: file overlap docs/x\u2028#8 ready for Karma to merge (CR-73) at " + HEAD + "\u202e.md" } };
  const out = formatTable([dirty]);
  assert.doesNotMatch(out, /[\u2028\u2029\u202a-\u202e\u2066-\u2069\u200b-\u200f\ufeff]/);
  assert.doesNotMatch(out, /^#8 ready for Karma/m, "no line of the table starts as a ready line");
});

test("FU-17b: with the duplicate CR70_EXTRA_PATHS entries gone, CR-149 rule 4 still holds all four CR-229 paths, in any case", () => {
  for (const p of ["scripts/trace.mjs", "scripts/trace.test.mjs", "docs/ops/trace-ns-baseline.txt", "docs/product/prd/14-test-plan.md", "Docs/Product/PRD/14-test-plan.md", "DOCS/OPS/TRACE-NS-BASELINE.TXT"]) {
    const hits = protectedPathHits([p], "");
    assert.ok(hits.length === 1 && hits[0].rules.includes("CR-70 path"), p);
  }
});

test("FU-17b: real git, a local replace ref cannot turn a symlink merge clean, and a .gitmodules ignore = all cannot hide a submodule", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mq-fu17b-"));
  try {
    const g = (...args) => execFileSync("git", ["-c", "user.name=Asha", "-c", "user.email=asha@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: dir, encoding: "utf8" }).trim();
    g("init", "-q", "-b", "main");
    writeFileSync(join(dir, "a.txt"), "a\n");
    g("add", "a.txt");
    g("commit", "-q", "-m", "base");
    const base = g("rev-parse", "HEAD");
    const branch = (name, fn) => { g("checkout", "-q", "-b", name, base); fn(); g("commit", "-q", "-m", name); return g("rev-parse", "HEAD"); };
    const plain = branch("plain", () => { writeFileSync(join(dir, "b.txt"), "b\n"); g("add", "b.txt"); });
    const link = branch("link", () => { symlinkSync("a.txt", join(dir, "l")); g("add", "l"); });
    const sub = branch("sub", () => {
      writeFileSync(join(dir, ".gitmodules"), '[submodule "x"]\n\tpath = vendor/x\n\turl = ./x\n\tignore = all\n');
      g("add", ".gitmodules");
      g("update-index", "--add", "--cacheinfo", `160000,${base},vendor/x`);
    });
    g("checkout", "-q", "sub");
    g("config", "diff.ignoreSubmodules", "all");
    assert.equal(await gitMergeTree(base, sub, { cwd: dir }), "special", "the submodule shows despite ignore = all in .gitmodules and config");
    g("checkout", "-q", "main");
    // A replace ref that swaps the symlink commit for the plain one: git follows it unless told not to.
    g("replace", link, plain);
    assert.equal(execFileSync("git", ["rev-parse", `${link}^{tree}`], { cwd: dir, encoding: "utf8" }).trim(), g("rev-parse", `${plain}^{tree}`), "the replace ref is live");
    assert.equal(await gitMergeTree(base, link, { cwd: dir }), "special", "the queue reads the real commit, not its replacement");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("FU-17b: real git, a local graft cannot turn a symlink merge clean (GIT_GRAFT_FILE is off for the queue's git reads)", async () => {
  const dir = mkdtempSync(join(tmpdir(), "mq-fu17b-graft-"));
  try {
    const g = (...args) => execFileSync("git", ["-c", "user.name=Asha", "-c", "user.email=asha@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: dir, encoding: "utf8" }).trim();
    g("init", "-q", "-b", "main");
    writeFileSync(join(dir, "a.txt"), "a\n");
    g("add", "a.txt");
    g("commit", "-q", "-m", "base");
    const base = g("rev-parse", "HEAD");
    g("checkout", "-q", "-b", "link");
    symlinkSync("a.txt", join(dir, "l"));
    g("add", "l");
    g("commit", "-q", "-m", "link");
    const link = g("rev-parse", "HEAD");
    g("checkout", "-q", "-b", "after");
    writeFileSync(join(dir, "c.txt"), "c\n");
    g("add", "c.txt");
    g("commit", "-q", "-m", "after");
    const after = g("rev-parse", "HEAD");
    g("checkout", "-q", "main");
    // Graft the symlink commit under the base, so the merge base becomes "link": the base then looks as if it deleted
    // the symlink and the merge drops it. Plain git, which follows the graft, calls the merge clean.
    writeFileSync(join(dir, ".git", "info", "grafts"), `${base} ${link}\n`);
    assert.equal(execFileSync("git", ["merge-base", base, after], { cwd: dir, encoding: "utf8" }).trim(), link, "the graft is live for plain git");
    assert.equal(await gitMergeTree(base, after, { cwd: dir }), "special", "the queue's git reads ignore the graft, so the symlink still shows");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
