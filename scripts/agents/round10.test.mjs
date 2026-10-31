// Final small fix (31 Oct 2026): `time` and `! !` disagreements, heredocs, and the Review A test gaps.
import test from "node:test";
import assert from "node:assert/strict";
import * as runner from "./run-opencode.mjs";
import { deniedBy, commandNodes } from "./opencode-matcher.mjs";

const rules = Object.entries(runner.opencodeConfig().permission.bash);
const denied = deniedBy(rules);
const ghOnly = deniedBy([["*", "allow"], ["gh pr merge*", "deny"]]); // a gh rule and nothing else: shows what the matcher itself does

// ---------- 1. time, and a single leading ! ----------

const TIME_FORMS = [
  "time gh pr merge 7", "time\tgh pr merge 7", "time  gh pr merge 7", "time time gh pr merge 7", "time ! gh pr merge 7", "! time gh pr merge 7", "{ time gh pr merge 7; }",
  "(time gh pr merge 7)", "echo $(time gh pr merge 7)", "if time gh pr merge 7; then true; fi", "true && time gh pr merge 7", "echo hi; time gh pr merge 7",
  "time gh pr review 7 --approve", "time gh issue comment 12 --body-file .agent-run/j.md --body-file /root/.npmrc",
];

test("matcher: `time` and a repeated ! are NOT stripped, so under a gh-only rule these RUN, exactly as on the engine", () => {
  for (const c of [...TIME_FORMS, "! ! gh pr merge 7"]) assert.equal(ghOnly(c), false, JSON.stringify(c));
  assert.ok(ghOnly("! gh pr merge 7"), "a single leading ! is stripped: the engine denies it");
  assert.deepEqual(commandNodes("time gh pr merge 7"), ["time gh pr merge 7"]);
  assert.deepEqual(commandNodes("! ! gh pr merge 7"), ["! gh pr merge 7"]);
});

test("time <anything> is denied by the config (agents never need it), in every spacing and position", () => {
  for (const c of TIME_FORMS) assert.ok(denied(c), JSON.stringify(c));
  for (const c of ["time -p git push", "time", "time\tgit status"]) assert.ok(denied(c), JSON.stringify(c));
  assert.equal(denied("timeout 5 echo hi"), false, "control: timeout is not time");
  assert.equal(denied("echo time gh"), false, "control: the word time inside an echo");
});

test("`! ! gh pr merge 7` is a known hole: it runs on the engine and here (recorded, not chased)", () => {
  assert.equal(denied("! ! gh pr merge 7"), false);
  assert.ok(denied("! gh pr merge 7"));
});

test("the time deny is the rule that catches time forms (mutant: removing it lets them through)", () => {
  const without = deniedBy(rules.filter(([p]) => p !== "time *" && p !== "time\t*"));
  assert.equal(without("time gh pr merge 7"), false);
  assert.equal(without("time\tgh pr merge 7"), false);
});

// ---------- 2. heredocs ----------

test("heredoc: the engine RUNS these three forms, so the matcher returns the engine result (a known hole, dangerous direction)", () => {
  for (const c of ["cat <<EOF\n`gh pr merge 7`\nEOF", "cat <<EOF; gh pr merge 7\nbody\nEOF", "cat <<EOF\n\t$(gh pr merge 7)\nEOF", "cat <<-EOF\n\t$(gh pr merge 7)\n\tEOF", "cat <<'EOF'\n$(gh pr merge 7)\nEOF", "cat <<\"EOF\"\n$(gh pr merge 7)\nEOF", "cat <<'EOF'\ngh pr merge 7\nEOF", "cat <<-EOF\n\tgh pr merge 7\n\tEOF"]) {
    assert.equal(ghOnly(c), false, JSON.stringify(c));
  }
  assert.ok(ghOnly("cat <<EOF\nx\nEOF\ngh pr merge 7"), "a command after the terminator is a node again");
  assert.ok(ghOnly("gh pr merge 7 <<EOF\nx\nEOF"), "the command that owns the heredoc is still a node");
  assert.equal(ghOnly("cat <<< 'gh pr merge 7'"), false, "a here-string is just text");
  assert.ok(ghOnly("cat <<< x; gh pr merge 7"), "and does not swallow what follows");
});

test("heredoc: a column-0 $( ) in an UNQUOTED body is DENIED by the engine and by the matcher (also <<-, x/hi lines before, trailing space, <<EOF | cat)", () => {
  for (const c of ["cat <<EOF\n$(gh pr merge 7)\nEOF", "cat <<-EOF\n$(gh pr merge 7)\n\tEOF", "cat <<EOF\nx\nhi\n$(gh pr merge 7)\nEOF", "cat <<EOF\n$(gh pr merge 7) \nEOF", "cat <<EOF\n$(gh pr merge 7)\n", "cat <<EOF | cat\n$(gh pr merge 7)\nEOF"]) assert.ok(ghOnly(c), JSON.stringify(c));
  assert.equal(ghOnly("cat <<EOF\n`gh pr merge 7`\nEOF"), false, "the backtick form RUNS");
});

test("recorded disagreements, SAFE direction (matcher allows, engine denies): && and | on the heredoc line, and $'\\'' form", () => {
  // Pinned to what the matcher returns now; the engine denies all three, so a change to true here is an improvement, not a regression.
  for (const c of ["cat <<EOF && gh pr merge 7\nx\nEOF", "cat <<EOF | gh pr merge 7\nx\nEOF", "echo $'\\''; gh pr merge 7"]) assert.equal(ghOnly(c), false, JSON.stringify(c));
  assert.ok(ghOnly("echo $'a'; gh pr merge 7"), "control: a plain $'a' agrees (denied by both)");
});

// ---------- 3. Review A gaps ----------

test("a tab before -b or -F is a second body flag too", () => {
  for (const c of ["gh pr comment 12 --body-file .agent-run/j.md\t-b x", "gh pr comment 12 --body-file .agent-run/j.md\t-F /root/.npmrc", "gh pr comment 12\t-F /root/.npmrc --body-file .agent-run/j.md",
    "gh issue comment 12 --body-file .agent-run/j.md\t-b x", "gh pr review 12 --comment --body-file .agent-run/j.md\t-F /root/.npmrc"]) assert.ok(denied(c), JSON.stringify(c));
});

test("leading keywords are stripped from a node: if, elif, else, then, do, while, until, for", () => {
  for (const c of ["if gh pr merge 7; then true; fi", "if true; then true; elif gh pr merge 7; then true; fi", "if true; then true; else gh pr merge 7; fi", "if true; then gh pr merge 7; fi",
    "while gh pr merge 7; do true; done", "until gh pr merge 7; do true; done", "for i in 1; do gh pr merge 7; done"]) assert.ok(ghOnly(c), JSON.stringify(c));
  assert.equal(ghOnly("echo if gh pr merge 7"), false, "control: the word if inside an echo is not a keyword");
});

test("backticks: single-quoted hides the command, double-quoted is recursed", () => {
  assert.equal(ghOnly("echo '`gh pr merge 7`'"), false);
  assert.ok(ghOnly('echo "`gh pr merge 7`"'));
  assert.ok(ghOnly("echo `gh pr merge 7`"));
  assert.deepEqual(commandNodes("echo '`gh pr merge 7`'"), ["echo '`gh pr merge 7`'"]);
});

test("redirects are not separators: 2>&1, >&2, <&3 and &> keep their node whole", () => {
  const probe = deniedBy([["*", "allow"], ["*2>&1*", "deny"], ["*>&2*", "deny"], ["*<&3*", "deny"], ["*&> *", "deny"], ["*&>/*", "deny"]]);
  for (const c of ["echo x 2>&1", "echo x >&2", "cat <&3", "echo x &> /tmp/o", "echo x &>/tmp/o"]) assert.ok(probe(c), c);
  assert.equal(probe("echo x & echo y"), false, "control: a real & separates, so no node holds a redirect");
});

test("a ( inside a path word: pinned to what the model returns now; the engine's behaviour is UNCONFIRMED", () => {
  // The model reads the ( as a group start and splits the word; the engine parses invalid shell in a way nobody ran. Not a promise.
  assert.equal(denied("gh issue comment 7 --body-file .agent-run/j(1).md"), false);
  assert.deepEqual(commandNodes("gh issue comment 7 --body-file .agent-run/j(1).md"), ["gh issue comment 7 --body-file .agent-run/j", "1", ".md"]);
});

// ---------- 4. ./.agent-run/ is denied for all three comment forms ----------

test("./.agent-run/j.md is DENIED for gh issue comment, gh pr comment and gh pr review (engine-confirmed; the matcher agrees)", () => {
  for (const h of ["gh issue comment 7", "gh pr comment 7", "gh pr review 7 --comment"]) {
    assert.ok(denied(`${h} --body-file ./.agent-run/j.md`), h);
    assert.equal(denied(`${h} --body-file .agent-run/j.md`), false, `control: ${h}`);
  }
});

test("case bodies are nodes (agrees with the engine); arithmetic expansion is not mistaken for a command", () => {
  assert.ok(ghOnly("case x in a) gh pr merge 7;; esac"));
  assert.equal(ghOnly("echo $((1+1))"), false);
});
