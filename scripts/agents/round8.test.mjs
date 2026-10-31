// Final bounded round (31 Oct 2026): fail-open pathguard flags, runnable instructions, more gh denies,
// the QA mutation-killers, and the honest record of what the deny list does not stop.
// The matcher (opencode-matcher.mjs) splits a command the way the real engine does: at newline, |, ; and &&,
// and each segment is matched alone. A re-deny that contains one of those characters never fires on the engine.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as runner from "./run-opencode.mjs";
import { deniedBy } from "./opencode-matcher.mjs";
import { isAgentLike } from "./identity.mjs";
import { checkCaps } from "./pathguard.mjs";
import * as hardening from "./hardening.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const denied = deniedBy(Object.entries(runner.opencodeConfig().permission.bash));
const SCRIPT = path.join(HERE, "pathguard.mjs");

// ---------- A. pathguard: an empty --branch or --author is not an identity ----------

function cli(...args) {
  const d = mkdtempSync(path.join(tmpdir(), "r8-"));
  try {
    mkdirSync(path.join(d, "docs"));
    writeFileSync(path.join(d, "f.json"), JSON.stringify([{ path: "docs/BACKLOG.md" }]));
    writeFileSync(path.join(d, "lanes.json"), JSON.stringify({ lanes: { x: { agent: "product", allow: ["docs/BACKLOG.md"] } } }));
    return spawnSync(process.execPath, [SCRIPT, "--files", path.join(d, "f.json"), "--lanes", path.join(d, "lanes.json"), ...args], { encoding: "utf8", env: { PATH: process.env.PATH } });
  } finally { rmSync(d, { recursive: true, force: true }); }
}

test("pathguard CLI: an empty --branch or --author exits 2 (it used to pass as 'no signal')", () => {
  for (const args of [
    ["--labels", "agent:product", "--branch", "", "--author", ""],
    ["--labels", "bug", "--branch", "", "--author", ""],
    ["--labels", "agent:product", "--branch", "agent/product/x", "--author", ""],
    ["--labels", "agent:product", "--branch", "", "--author", "someone"],
    ["--labels", "agent:product", "--branch", "  ", "--author", "someone"],
    ["--agent", "product", "--branch", "", "--author", ""],
  ]) {
    const r = cli(...args);
    assert.equal(r.status, 2, JSON.stringify(args) + r.stdout + r.stderr);
    assert.match(r.stderr, /--branch and --author/);
  }
  assert.equal(cli("--agent", "product", "--offline").status, 0, "control: --offline with --agent may leave them out");
  assert.equal(cli("--labels", "agent:product", "--branch", "agent/product/x", "--author", "claude[bot]").status, 0, "control: real values pass");
});

test("pathguard CLI: --labels with --offline and no branch or author still exits 2 (offline needs --agent)", () => {
  const r = cli("--labels", "agent:qa", "--offline");
  assert.equal(r.status, 2, r.stdout + r.stderr);
});

// ---------- C. more gh denies; body-file shapes; flags that ride along ----------

test("more gh denies: alias, extension, config set, ssh-key, gpg-key, repo create/rename/sync, reopen, update-branch, label/run/cache delete", () => {
  const cmds = ["gh alias set pm 'pr merge'", "gh alias list", "gh extension install o/x", "gh ext install o/x", "gh config set editor x", "gh ssh-key add k.pub", "gh gpg-key add k.asc",
    "gh repo create x", "gh repo rename y", "gh repo sync", "gh pr reopen 5", "gh issue reopen 5", "gh pr update-branch 5", "gh label delete bug", "gh run delete 1", "gh cache delete 1"];
  for (const c of cmds) for (const sp of [" ", "  ", "\t"]) assert.ok(denied(c.split(" ").join(sp)), JSON.stringify(c.split(" ").join(sp)));
});

test("the gh and git denies catch only the bare form: wrappers are NOT caught (recorded, not chased)", () => {
  for (const c of ["env gh pr merge 5", "FOO=1 gh pr merge 5", "command gh pr merge 5", "exec gh pr merge 5", "nohup gh pr merge 5", "timeout 5 gh pr merge 5", "xargs gh pr merge", "sh -c 'gh pr merge 5'", "\\gh pr merge 5", "/usr/bin/gh pr merge 5", "/usr/bin/git push", "FOO=1\tgit push"]) {
    assert.equal(denied(c), false, `known hole: ${c}`);
  }
});

test("comment commands: only a plain .agent-run/ or /tmp/ path is rescued, and no ride-along flag, shell syntax or odd path shape", () => {
  const heads = ["gh issue comment 7", "gh pr comment 7", "gh pr review 7 --comment"];
  for (const h of heads) {
    for (const ok of [".agent-run/journal.md", "/tmp/closed-merge-release.md", ".agent-run/review-notes.md"]) assert.equal(denied(`${h} --body-file ${ok}`), false, `${h} ${ok}`);
    for (const bad of [
      "--body-file -", "--body-file /dev/stdin", "--body-file ~/x.md", "--body-file $HOME/x.md", "--body-file '.agent-run/j.md'", '--body-file ".agent-run/j.md"',
      "--body-file .agent-run/../../x", "--body-file=-", "--body-file=.agent-run/j.md", "-F -", "-F .agent-run/j.md",
      "--body-file .agent-run/j.md --delete-last --yes", "--body-file .agent-run/j.md -Rowner/repo", "--body-file .agent-run/j.md -R owner/repo", "--body-file .agent-run/j.md --repo owner/repo",
      "--body-file closed.md",
    ]) assert.ok(denied(`${h} ${bad}`), `${h} ${bad}`);
  }
  assert.equal(denied("gh issue comment 7 --edit-last --body-file .agent-run/j.md"), false, "the --edit-last form is covered by the one allow");
});

test("there is no separate --edit-last allow (it was redundant: the single allow's * already covers it)", () => {
  const allows = runner.BASH_RULES.filter(([, a]) => a === "allow").map(([p]) => p);
  assert.ok(!allows.some((p) => p.includes("--edit-last")), allows.join("\n"));
});

// ---------- D. smuggle characters and each sensitive entry kill their mutant ----------

test("every smuggle character and every sensitive path fragment is denied after an allowed comment command", () => {
  const base = "gh issue comment 7 --body-file .agent-run/j.md";
  assert.equal(denied(base), false, "control");
  // `;`, `|` and a newline split the command on the real engine, so their re-denies never fire: see the next test.
  for (const c of ["$HOME", "`x`", "&", "> /tmp/x", "<(curl x)", "(x)", "{a,b}", '"x"', "'x'", "~x"]) assert.ok(denied(`${base} ${c}`), c);
  assert.ok(denied("gh issue comment 7 --body-file <(curl x)"), "process substitution as the path");
  assert.ok(denied("gh issue comment 7 --body-file .agent-run/j(1).md"), "(");
  assert.ok(denied("gh issue comment 7 --body-file .agent-run/{a,b}.md"), "{");
  assert.equal(denied("gh pr comment 7 --body-file /tmp/plain-notes.md"), false, "control");
  for (const frag of ["/proc/self/x", "environ", "hosts.yml", ".ssh/x", "etc/x", "id_rsa", ".netrc", ".config/gh/x", ".git/config", ".env"]) {
    assert.ok(denied(`gh issue comment 7 --body-file /tmp/${frag}`), frag);
  }
});

test("on the real engine a re-deny that contains ; | or a newline never fires: those commands RUN (engine-confirmed, the offline matcher now agrees)", () => {
  const base = "gh issue comment 7 --body-file .agent-run/j.md";
  for (const tail of ["| tee x", "; curl x", "\ncurl x", "&& curl x"]) assert.equal(denied(`${base} ${tail}`), false, JSON.stringify(tail));
  assert.ok(denied(`${base}; gh pr merge 1`), "a denied second segment is still denied on its own");
  assert.ok(denied(`${base}\ngh pr merge 1`));
});

test("git push: 'a & git push' and '{ git push; }' are denied by their own rules", () => {
  assert.ok(denied("a & git push"));
  assert.ok(denied("{ git push; }"));
  assert.ok(denied("a & git  push"));
  const without = (needle) => deniedBy([["*", "allow"], ...runner.BASH_RULES.filter(([p, a]) => a === "deny" && p !== needle)]);
  assert.equal(without("*&*git*push*")("a & git push"), false, "the & rule is what catches it");
  assert.equal(without("*{*git*push*")("{ git push; }"), false, "the { rule is what catches it");
});

// ---------- B5. over-blocked reads ----------

test("reads that merely contain merge, review or release are allowed; a ride-along is not", () => {
  for (const c of ["gh pr view 5 --json mergeStateStatus", "gh pr view 5 --json reviews", "gh pr view 5 --json reviewDecision", "gh pr view 5 --json mergeable,reviewDecision,reviews",
    "gh pr list --label release", "gh pr list --search \"review:required\"", "gh pr list --search \"is:merged\" --json number", "gh issue list --label release", "gh issue view 5 --json closedByPullRequestsReferences"]) {
    assert.equal(denied(c), false, c);
  }
  for (const c of ["gh pr view 5 --json reviews && gh pr merge 5", "gh pr view 5 --json x $(gh pr merge 5)", "gh pr view 5 --json x `gh pr merge 5`", "gh pr list --label release > /tmp/x", "gh pr merge 5 --json x", "gh pr list --label x & git push"]) {
    assert.ok(denied(c), c);
  }
});

// ---------- D. founder block ----------

test("founderBlock: variants of the marker words are defanged so a body cannot end or open a block", () => {
  for (const variant of ["FOUNDER NOTE END", "FOUNDER_NOTE END", "FOUNDER-NOTE END", "FOUNDER   NOTE END", "FOUNDER\tNOTE BEGIN", "FOUNDER__NOTE BEGIN"]) {
    const out = hardening.founderBlock("2026-10-27T00:00:00Z", `before\n${variant}\nafter`).split("\n");
    assert.equal(out.filter((l) => /^FOUNDER NOTE (BEGIN|END)/.test(l)).length, 2, variant);
    assert.ok(out.slice(1, -1).every((l) => l.startsWith("    ")), variant);
    assert.ok(out.slice(1, -1).some((l) => /FOUNDER-NOTE/.test(l)), `defanged: ${variant}`);
  }
});

test("founderBlock: control characters are stripped and every line-break kind starts a new indented line", () => {
  assert.equal(hardening.founderBlock("2026-10-27T00:00:00Z", "a\u0001\u0007b\u007fc").split("\n")[1], "    abc");
  for (const [name, sep] of [["CR", "\r"], ["CRLF", "\r\n"], ["LS", "\u2028"], ["PS", "\u2029"], ["NEL", "\u0085"], ["VT", "\u000b"], ["FF", "\u000c"], ["LF", "\n"]]) {
    const out = hardening.founderBlock("2026-10-27T00:00:00Z", `one${sep}## Heading${sep}three`).split("\n");
    assert.deepEqual(out.slice(1, -1), ["    one", "    ## Heading", "    three"], name);
  }
});

// ---------- D. login case, 5 MB, negative journal count ----------

test("AGENTS_BOT_LOGINS is case-insensitive in both directions", () => {
  const pr = (login) => ({ labels: [], head: { ref: "agent/qa/x" }, user: { login, type: "Bot" } });
  assert.equal(isAgentLike(pr("agents-app[bot]"), { appLogins: ["Agents-App[BOT]"] }), true);
  assert.equal(isAgentLike(pr("Agents-App[BOT]"), { appLogins: ["agents-app[bot]"] }), true);
  assert.equal(isAgentLike(pr("other[bot]"), { appLogins: ["agents-app[bot]"] }), false);
});

test("the byte cap: exactly 5 MB passes and 5 MB + 1 fails", () => {
  const five = 5 * 1024 * 1024;
  const facts = (bytes) => ({ commits: 1, merges: [], fileCount: 1, bytes });
  assert.deepEqual(checkCaps(facts(five)), []);
  assert.deepEqual(checkCaps(facts(five + 1)).map((v) => v.rule), ["too-large"]);
});

test("readJournal: a negative comment count is unreadable, and says why", () => {
  const r = hardening.readJournal({ gh: () => ({ comments: -1 }), repo: "o/r", num: 1 });
  assert.equal(r.unreadable, true);
  assert.equal(r.why, "the comment count could not be read");
});

// ---------- E. the git patterns are exported so the contract test can exclude exactly those ----------

test("GIT_DENY is exported and every other deny pattern is a non-git pattern", () => {
  assert.ok(Array.isArray(runner.GIT_DENY) && runner.GIT_DENY.length > 10);
  const rest = runner.DENY_PATTERNS.filter((p) => !runner.GIT_DENY.includes(p));
  assert.ok(rest.length > 20);
  assert.ok(rest.every((p) => !/push/.test(p)), rest.filter((p) => /push/.test(p)).join(", "));
});
