// Round 4 deny patterns (finding D), checked with the same offline matcher as
// opencode-contract.test.mjs. UNVERIFIED on the real engine: these are glob tests, not
// recordings. opencode matches the whole command string (and each segment of a compound)
// against the globs; how it treats a `--no-pager` prefix or odd spacing was not run here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { DENY_PATTERNS } from "./run-opencode.mjs";

const globToRe = (g) => new RegExp("^" + g.split("*").map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$", "s");
const denied = (cmd) => cmd.split(/&&|\|\||;|\|/).map((s) => s.trim()).some((seg) => DENY_PATTERNS.some((g) => globToRe(g).test(seg)));

test("bare pushes with no refspec are denied", () => {
  for (const c of ["git push", "git push origin", "git push -u", "git push -u origin", "git push --set-upstream origin", "git -C . push", "git --no-pager push"]) assert.ok(denied(c), c);
});

test("--all, --mirror, --tags, --follow-tags and tag refs are denied", () => {
  for (const c of ["git push --all", "git push origin --all", "git push --mirror origin", "git push origin --tags", "git push --follow-tags origin HEAD",
    "git push origin refs/tags/ios-v1.0.0", "git push origin tag ios-v1.0.0"]) assert.ok(denied(c), c);
});

test("heads/develop and heads/main without refs/ are denied", () => {
  for (const c of ["git push origin HEAD:heads/develop", "git push origin HEAD:heads/main", "git push origin heads/main", "git push origin feat/x:heads/develop"]) assert.ok(denied(c), c);
});

test("global options before push do not hide it", () => {
  for (const c of ["git --no-pager push origin HEAD:develop", "git -P push origin develop", "git --git-dir=.git push origin main",
    "git --work-tree=. push --force origin x", "git --git-dir=/x push", "git --no-pager push --delete origin x"]) assert.ok(denied(c), c);
});

test("helper programs are denied", () => {
  for (const c of ["git push --receive-pack=/tmp/x origin agent/qa/a", "git push --receive-pack /tmp/x origin agent/qa/a", "git push --exec=/tmp/x origin agent/qa/a"]) assert.ok(denied(c), c);
});

test("gh api write verbs are denied in every spelling", () => {
  for (const v of ["PUT", "PATCH", "DELETE", "POST", "put", "patch", "delete", "post"]) {
    for (const f of [`-X ${v}`, `-X  ${v}`, `-X=${v}`, `-X${v}`, `--method ${v}`, `--method  ${v}`, `--method=${v}`]) {
      assert.ok(denied(`gh api ${f} repos/a/b/issues/1`), f);
      assert.ok(denied(`gh -R a/b api repos/a/b/issues/1 ${f}`), `${f} after the path`);
    }
  }
});

test("allowed: a feature branch push in every plain form", () => {
  for (const c of [
    "git push origin agent/qa/hardening", "git push -u origin agent/product/main-page", "git push -u origin HEAD", "git push origin HEAD",
    "git push origin agent/qa/develop-notes", "git push origin feat/maintenance", "git push origin docs/mainline-notes", "git push origin fix/developer-docs",
    "git push origin test/injection-lane", "git push origin agent/ops/tag-notes", "git push origin agent/ops/all-the-things", "git push origin agent/ops/tags",
    "git --no-pager log --oneline", "git status", "git commit -m 'push --all the way'",
  ]) assert.ok(!denied(c), c);
});

test("allowed: gh reads and a GET are not blocked", () => {
  for (const c of ["gh api repos/a/b/pulls/1", "gh api -X GET repos/a/b/pulls", "gh api --method=GET repos/a/b/pulls", "gh pr view 1", "gh pr list --state open",
    "gh pr comment 1 --body 'POST and PUT are verbs'"]) assert.ok(!denied(c), c);
});
