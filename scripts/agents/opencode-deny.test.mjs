// Bash permission rules, round 6: the model does not push at all. Every `git ... push ...` is
// denied and there is NO allow rule for push (the workflow's salvage step pushes the branch).
// Branch creation and commits stay allowed.
//
// UNVERIFIED on the real engine. The matcher below is an offline model of opencode's wildcard
// rule (a trailing " *" is optional, `*` crosses spaces, last match wins, backslashes are
// slashes) written from Review C's matcher. How the engine splits compound commands is
// assumed: each segment of a && / || / ; / | chain is evaluated on its own and any deny denies.
// These patterns are a TRIPWIRE. The real controls are branch protection, the workflow's own push,
// and locked journal issues (docs/agents/hardening/integration-notes.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { opencodeConfig, BASH_RULES } from "./run-opencode.mjs";
import { deniedBy } from "./opencode-matcher.mjs";

const denied = deniedBy(Object.entries(opencodeConfig().permission.bash));

test("there is no allow rule for push: the only allow is the catch-all", () => {
  assert.deepEqual(BASH_RULES.filter(([, a]) => a === "allow"), [["*", "allow"]]);
  assert.equal(Object.keys(opencodeConfig().permission.bash)[0], "*");
  for (const [p, a] of BASH_RULES) if (a === "allow") assert.ok(!/push/.test(p), p);
});

test("git push is denied in every shape: agent branches that used to be allowed, chains, substitutions, flags, spacing, wrappers", () => {
  const prefixes = ["git push", "git  push", "git\tpush", "git -C . push", "git --no-pager push", "git -P push", "git --git-dir=.git push", "git --work-tree=. push",
    "git --namespace=x push", "git -c core.sshCommand=x push", "FOO=1 git push", "env git push", "sh -c 'git push", "GIT_SSH_COMMAND=x git push"];
  const tails = ["", " origin", " origin agent/qa/x", " -u origin agent/qa/x", " origin HEAD:develop", " origin 'HEAD:develop'", " --all", " origin ios-v1.0.0"];
  let n = 0;
  for (const p of prefixes) for (const t of tails) { n++; assert.ok(denied(p + t), p + t); }
  assert.equal(n, 112);
});

test("the seven shapes that the old agent/* allow let through are now denied", () => {
  for (const c of [
    "git push origin agent/qa/x; gh pr merge 1",
    "git push origin agent/qa/x && gh pr merge 1",
    "git push origin agent/qa/x $(gh pr merge 1)",
    "git push origin agent/qa/x `gh pr merge 1`",
    "git push origin agent/qa/x | sh",
    "git push origin agent/qa/x refs/heads/develop",
    "git push origin agent/qa/x tag v1",
  ]) assert.ok(denied(c), c);
});

test("flags, refspecs, tags, tabs and other handles after an agent branch are denied", () => {
  for (const c of ["git push origin agent/qa/x -uf", "git push origin agent/qa/x --exec=/tmp/x", "git push origin agent/qa/x --force", "git push origin agent/qa/x --delete",
    "git push origin agent/qa/x --tags", "git push\torigin\tagent/qa/x", "git push origin agent/qa/x:develop", "git push origin agent/qa/x HEAD:refs/tags/v1",
    "git push origin agent/ops/x", "git push origin agent/../develop", "git push origin agent/qa/x --receive-pack=/tmp/x", "git push origin agent/qa/x --mirror",
    "echo x | git push origin agent/qa/x", "git push origin agent/qa/x $REFSPEC", "git push origin agent/qa/x $(cat refspec.txt)",
    "git push origin agent/qa/x", "git push -u origin agent/qa/x", "git push origin agent/product/main-page",
    "git push origin +HEAD:develop", "git push --exec=/tmp/x origin agent/qa/x", "git push --all origin", "git push --mirror", "git push --tags origin", "git push --receive-pack=/tmp/x"]) assert.ok(denied(c), c);
});

test("config injection with -c is denied; branch creation is not", () => {
  for (const c of ["git -c core.sshCommand=x fetch", "git -c user.name=x commit -m y", "git -cfoo=1 status", "git --no-pager -c a=b log"]) assert.ok(denied(c), c);
});

test("allowed: branch creation, commits and ordinary read and write work", () => {
  for (const c of ["git checkout -b agent/qa/x", "git switch -c agent/qa/x", "git branch agent/qa/x", "git checkout agent/qa/x", "git add -A", "git commit -m 'WIP: tidy page'",
    "git commit --amend --no-edit", "git status", "git diff", "git log --oneline", "git fetch origin", "git rebase origin/develop", "git merge origin/develop", "git stash list",
    "gh pr view 1", "gh pr list --state open", "gh pr comment 1 --body 'looks good'", "gh api repos/a/b/pulls/1", "gh api -X GET repos/a/b/pulls", "gh api --method=GET repos/a/b/pulls", "npm test"]) {
    assert.ok(!denied(c), c);
  }
});

test("gh api write verbs: every spelling, quoted or not, lands on deny", () => {
  for (const v of ["PUT", "PATCH", "DELETE", "POST", "put", "patch", "delete", "post"]) {
    for (const f of [`-X ${v}`, `-X  ${v}`, `-X=${v}`, `-X${v}`, `--method ${v}`, `--method  ${v}`, `--method=${v}`]) {
      assert.ok(denied(`gh api ${f} repos/a/b/issues/1`), f);
      assert.ok(denied(`gh -R a/b api repos/a/b/issues/1 ${f}`), `${f} after the path`);
    }
  }
  for (const c of ["gh api -X \"PATCH\" repos/a/b/issues/1", "gh api -X 'PATCH' repos/a/b/issues/1", "gh api --method \"put\" repos/a/b", "gh api --method='delete' repos/a/b", "gh api -X\"POST\" repos/a/b", "gh api repos/a/b --method 'PUT'"]) {
    assert.ok(denied(c), c);
  }
});

test("known bypass, stated honestly: mixed-case verbs such as -XPatch are not caught", () => {
  assert.equal(denied("gh api repos/a/b/issues/1 -XPatch"), false);
});

test("known false positives of the broad rule, stated honestly: any command containing git and push", () => {
  for (const c of ["git commit -m 'document the push to main page'", "git log --grep=push", "git checkout feat/push-fix"]) assert.ok(denied(c), c);
});
