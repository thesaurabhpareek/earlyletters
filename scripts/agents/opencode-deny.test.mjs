// Bash permission rules, round 5 shape: ONE broad deny for anything with `push` in a git command,
// then an allow for `git push origin agent/*` only (opencode takes the LAST matching rule).
//
// UNVERIFIED on the real engine. The matcher below is an offline model of opencode's wildcard
// rule (a trailing " *" is optional, `*` crosses spaces, last match wins, backslashes are
// slashes) written from Review C's matcher. How the engine splits compound commands is
// assumed: each segment of a && / || / ; / | chain is evaluated on its own and any deny denies.
// These patterns are a TRIPWIRE. The real controls are branch protection, a write job that does
// the push, and locked journal issues (docs/agents/hardening/integration-notes.md).
import { test } from "node:test";
import assert from "node:assert/strict";
import { opencodeConfig } from "./run-opencode.mjs";

const norm = (x) => x.replaceAll("\\", "/");
const toRe = (o) => {
  let l = norm(o).replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".");
  if (l.endsWith(" .*")) l = l.slice(0, -3) + "( .*)?";
  return new RegExp("^" + l + "$", "s");
};
const RULES = Object.entries(opencodeConfig().permission.bash).map(([g, action]) => ({ re: toRe(g), action }));
const decide = (seg) => { let a = "allow"; for (const r of RULES) if (r.re.test(norm(seg))) a = r.action; return a; };
const denied = (cmd) => cmd.split(/&&|\|\||;|\|/).map((s) => s.trim()).filter(Boolean).some((seg) => decide(seg) === "deny");

test("quoted, double-spaced, tabbed and option-prefixed pushes all land on deny", () => {
  for (const c of [
    "git push origin 'HEAD:develop'", "git push origin \"develop\"", "git push origin HEAD:'develop'", "git  push origin HEAD:develop", "git\tpush origin HEAD:develop",
    "git -c core.sshCommand=x push", "git -c core.sshCommand=x push origin agent/qa/x", "git --namespace=x push origin HEAD:develop", "git --exec-path=/x push origin agent/qa/x",
    "git --config-env=core.sshCommand=X push origin agent/qa/x", "git -C . -c a=b push origin HEAD:develop", "git --no-pager push origin develop", "git -P push origin main",
    "git push origin HEAD:refs/tags/ios-v1.0.0", "git push origin ios-v1.0.0", "git push origin HEAD:refs/heads/Develop", "git push --force-with-lease",
    "git push", "git push origin", "git push -u origin", "git push --all", "git push --mirror", "git push --tags", "git push --receive-pack=/tmp/x origin agent/qa/a",
    "git push origin feat/maintenance", "git push origin test/injection-lane", "git push origin HEAD", "git push -u origin HEAD",
    "git --git-dir=.git push origin main", "git --work-tree=. push --force origin x", "git push origin :foo", "git push origin --delete foo", "git push origin +develop",
  ]) assert.ok(denied(c), c);
});

test("allowed: git push origin agent/<handle>/<topic> and the -u form", () => {
  for (const c of ["git push origin agent/qa/hardening", "git push -u origin agent/product/main-page", "git push origin agent/qa/develop-notes", "git push origin agent/ops/tags", "git push origin agent/ops/all-the-things"]) {
    assert.ok(!denied(c), c);
  }
});

test("force, delete, refspec and protected-branch tokens after an allowed agent branch still land on deny", () => {
  for (const c of ["git push origin agent/qa/x --force", "git push origin agent/qa/x -f", "git push origin agent/qa/x --delete", "git push origin agent/qa/x +HEAD:develop",
    "git push origin agent/qa/x HEAD:develop", "git push origin agent/qa/x develop", "git push origin agent/qa/x main", "git push origin agent/qa/x && git push origin develop"]) {
    assert.ok(denied(c), c);
  }
});

test("known bypass, stated honestly: shell indirection and quoting inside the allowed prefix are not caught", () => {
  for (const c of ["git push origin agent/qa/x $REFSPEC", "git push origin agent/qa/x $(cat refspec.txt)"]) {
    assert.equal(denied(c), false, `${c} is a known hole: branch protection and the write job are the control`);
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

test("allowed: reads and a GET are not blocked", () => {
  for (const c of ["gh api repos/a/b/pulls/1", "gh api -X GET repos/a/b/pulls", "gh api --method=GET repos/a/b/pulls", "gh pr view 1", "gh pr list --state open", "git status", "git log --oneline",
    "gh pr comment 1 --body 'POST and PUT are verbs'"]) assert.ok(!denied(c), c);
});

test("known false positives of the broad rule, stated honestly: any git command containing 'push' or ' -c '", () => {
  for (const c of ["git commit -m 'document the push to main page'", "git log --grep=push", "git checkout feat/push-fix", "git commit -c HEAD"]) assert.ok(denied(c), c);
});
