#!/usr/bin/env node
// BL-1480 (CR-74 follow-up): before a release candidate tag builds, the newest `iOS compile` run on develop must be a
// completed success on a commit at or after the merge base of the tagged commit and develop. Run as the first job of
// release-ios.yml (proposal: docs/ops/proposed/release-ios-launch-gate.md). The workflow file is not edited here.
// Usage: node scripts/release/launch-gate.mjs --repo <owner/name> --sha <tagged commit>
// Needs `gh` with a token that can read Actions runs (permissions: actions: read) and a full-history checkout.
// Reads run ids, shas, conclusions and times only: no run log, no secret, nothing a person wrote.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";

const run = promisify(execFile);
const WORKFLOW = "ios-compile.yml";
const WORKFLOW_PATH = `.github/workflows/${WORKFLOW}`;
const SHA = /^[0-9a-f]{40}$/;
const REPO = /^[\w.-]+\/[\w.-]+$/;

const fail = (reason) => ({ ok: false, message: `Release candidate tag refused: ${reason}. Run the "iOS compile" workflow on develop (workflow_dispatch), wait for it to finish green, then push a new rc tag number (tags never move).` });
const failTag = (reason) => ({ ok: false, message: `Release candidate tag refused: ${reason}. Run the "iOS compile" workflow (workflow_dispatch) on the release branch at the commit to be tagged, wait for it to finish green, then push a new rc tag number on that commit (tags never move).` });

/** Pure. runs: workflow runs of ios-compile.yml on develop. isAncestor(mergeBase, sha) is true when sha is the merge base or a descendant of it. */
export function decideLaunchGate({ runs, mergeBase, isAncestor }) {
  if (!SHA.test(mergeBase ?? "")) return fail("the merge base of the tagged commit and develop could not be read");
  const develop = (Array.isArray(runs) ? runs : []).filter((r) => r && r.event !== "pull_request" && (r.head_branch === undefined || r.head_branch === "develop"));
  const newest = develop.reduce((a, r) => (!a || r.created_at > a.created_at || (r.created_at === a.created_at && r.id > a.id) ? r : a), null);
  const none = "no iOS compile run on develop at or after the merge base " + mergeBase.slice(0, 9);
  if (!newest) return fail(none);
  let after;
  try { after = isAncestor(mergeBase, newest.head_sha) === true; } catch { return fail("the order of the newest run's commit and the merge base could not be read"); }
  if (!after) return fail(none);
  const id = `run ${newest.id} on ${String(newest.head_sha).slice(0, 9)}`;
  if (newest.status !== "completed") return fail(`${id} is ${newest.status}, not finished`);
  if (newest.conclusion !== "success") return fail(`${id} concluded ${newest.conclusion ?? "with no result"}`);
  return { ok: true, message: `launch gate open: ${id} concluded success (merge base ${mergeBase.slice(0, 9)})` };
}

/**
 * BL-1594. Pure. Proves the tagged commit itself, not only the tip of develop: a completed, successful `iOS compile`
 * run whose head_sha is exactly the tagged sha. runs: workflow runs as the Actions API returns them. Only a
 * workflow_dispatch run counts: a pull_request run builds the merge ref, not its head_sha, and can be green with the
 * compile job skipped by the paths filter. A run's path must be exactly .github/workflows/ios-compile.yml; a run with no
 * path, or a path that only ends in ios-compile.yml, does not count. When several runs checked the same sha, the newest
 * by created_at decides, the higher id on a tie; a run with no readable time fails closed. A runs value that is not an
 * array is read as no runs.
 * Not wired into any workflow yet (proposal: docs/ops/proposed/release-ios-launch-gate.md, "Tag equals checked commit").
 */
export function decideTagCheckedRun({ tagSha, runs }) {
  if (typeof tagSha !== "string" || !SHA.test(tagSha)) return failTag("the tagged commit could not be read");
  const same = (Array.isArray(runs) ? runs : []).filter((r) => r && r.head_sha === tagSha && r.event === "workflow_dispatch" && r.path === WORKFLOW_PATH);
  if (same.some((r) => typeof r.created_at !== "string" || r.created_at === "")) return failTag(`a run on the tagged commit ${tagSha.slice(0, 9)} has no start time`);
  const newest = same.reduce((a, r) => (!a || r.created_at > a.created_at || (r.created_at === a.created_at && r.id > a.id) ? r : a), null);
  if (!newest) return failTag(`no iOS compile run checked the tagged commit ${tagSha.slice(0, 9)}`);
  const id = `run ${newest.id} on ${tagSha.slice(0, 9)}`;
  if (newest.status !== "completed") return failTag(`${id} is ${newest.status}, not finished`);
  if (newest.conclusion !== "success") return failTag(`${id} concluded ${newest.conclusion ?? "with no result"}`);
  return { ok: true, message: `tagged commit checked: ${id} concluded success` };
}

/** IO wrapper with injectable readers; any read error fails closed. */
export async function gate({ listRuns, mergeBase, isAncestor }) {
  try {
    const runs = await listRuns();
    const mb = await mergeBase();
    const known = new Map();
    for (const r of runs) if (r?.head_sha && !known.has(r.head_sha)) known.set(r.head_sha, await isAncestor(mb, r.head_sha));
    return decideLaunchGate({ runs, mergeBase: mb, isAncestor: (_, sha) => known.get(sha) });
  } catch (e) {
    return fail(`a read failed (${String(e?.message ?? e).split("\n")[0].slice(0, 80)})`);
  }
}

async function main() {
  const arg = (n) => { const i = process.argv.indexOf(n); return i < 0 ? undefined : process.argv[i + 1]; };
  const repo = arg("--repo");
  const sha = arg("--sha");
  if (!REPO.test(repo ?? "") || !SHA.test(sha ?? "")) { console.error("usage: launch-gate.mjs --repo <owner/name> --sha <40 hex>"); process.exit(2); }
  const git = async (...a) => (await run("git", a)).stdout.trim();
  const r = await gate({
    listRuns: async () => JSON.parse((await run("gh", ["api", `repos/${repo}/actions/workflows/${WORKFLOW}/runs?branch=develop&per_page=30`])).stdout).workflow_runs,
    mergeBase: () => git("merge-base", sha, "origin/develop"),
    isAncestor: async (mb, s) => run("git", ["merge-base", "--is-ancestor", mb, s]).then(() => true, (e) => { if (e.code === 1) return false; throw e; }),
  });
  console.log(r.message);
  if (!r.ok) { console.log(`::error::${r.message}`); process.exit(1); }
}

/**
 * BL-1574. True when this file is the script node was asked to run. Built with pathToFileURL so a path that needs URL
 * escaping (a space, a percent sign) still matches, and through realpath because the loader resolves symlinks in
 * import.meta.url (macOS /tmp is one). A missing or unreadable argv[1] is not this script. A false here means main()
 * never runs and the job exits 0, so the test runs the copied script from a path with a space and through a symlink.
 */
export function isEntry(argv1, url) {
  if (typeof argv1 !== "string" || argv1 === "") return false;
  let real;
  try { real = realpathSync(argv1); } catch { real = argv1; }
  return url === pathToFileURL(real).href || url === pathToFileURL(argv1).href;
}
if (isEntry(process.argv[1], import.meta.url)) main();
