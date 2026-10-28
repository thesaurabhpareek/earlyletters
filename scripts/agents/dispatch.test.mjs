// End-to-end wiring test for dispatch.mjs (RB-29). dispatch.mjs runs on import, so the test
// runs it as a child process against a fake `gh` on PATH that serves canned REST answers and
// logs every call. It proves two things the module tests cannot: that dispatch.mjs actually
// calls the robustness hooks, and that dry-run never writes to GitHub.
// Fixture family: none; PR content is generic.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, chmodSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const SHA = "a".repeat(40);
const NOW = new Date().toISOString();

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "dispatch-test-"));
  const routes = [
    [/\/pulls\?state=open/, [{
      number: 901, title: "[mobile] test", draft: false, state: "open", created_at: NOW, updated_at: NOW,
      labels: [{ name: "agent:mobile" }, { name: "from:agent" }], user: { login: "bot", type: "Bot" },
      head: { sha: SHA, ref: "agent/mobile/x" }, base: { ref: "develop" },
    }]],
    // A file emptied by the PR: the +0,0 hunk is the signature of the PR #297 incident.
    [/\/pulls\/901\/files/, [{ filename: "docs/notes.md", status: "modified", additions: 0, deletions: 30, changes: 30, patch: "@@ -1,30 +0,0 @@\n-a" }]],
    [/\/pulls\/901\/commits/, [{ sha: SHA, parents: [{}], commit: { message: "docs: edit\n\nno trailers here", author: { date: NOW } } }]],
    [/\/commits\/a{40}$/, { commit: { committer: { date: NOW }, message: "x" } }],
  ];
  writeFileSync(join(dir, "routes.json"), JSON.stringify(routes.map(([re, body]) => [re.source, body])));
  const fake = join(dir, "gh");
  writeFileSync(fake, `#!/usr/bin/env node
const fs = require("fs");
const a = process.argv.slice(2);
const method = a[a.indexOf("-X") + 1];
const path = a[a.length - 1].replace(/^--input$/, "");
const p = a.filter((x) => x.startsWith("/repos/"))[0] || "";
fs.appendFileSync(${JSON.stringify(join(dir, "calls.log"))}, method + " " + p + "\\n");
let out = [];
for (const [re, body] of JSON.parse(fs.readFileSync(${JSON.stringify(join(dir, "routes.json"))}, "utf8"))) if (new RegExp(re).test(p)) { out = body; break; }
process.stdout.write(JSON.stringify(out));
`);
  chmodSync(fake, 0o755);
  return dir;
}

function run(dir, extra = {}) {
  const r = spawnSync(process.execPath, [join(HERE, "dispatch.mjs"), "--dry-run", "--local", "--board-only"], {
    encoding: "utf8",
    env: { PATH: `${dir}:${process.env.PATH}`, HOME: process.env.HOME, GITHUB_REPOSITORY: "o/r", ...extra },
  });
  assert.equal(r.status, 0, r.stderr);
  const log = existsSync(join(dir, "calls.log")) ? readFileSync(join(dir, "calls.log"), "utf8") : "";
  return { out: r.stdout, calls: log.split("\n").filter(Boolean) };
}

test("RB-29: default switches report diff sanity, provenance, SLA and stale on the board, and change no assignment", () => {
  const { out } = run(fixture());
  assert.match(out, /## Robustness checks/);
  assert.match(out, /Diff sanity \(warn only\): 1 agent PR/);
  assert.match(out, /#901 \(`mobile`\): docs\/notes\.md: emptied/);
  assert.match(out, /Provenance \(warn only, never blocks\): 1 of the open agent PRs/);
  assert.match(out, /Handoff SLA: 0 ok, 0 escalate/);
  assert.match(out, /Stale PRs \(report only/);
  assert.doesNotMatch(out, /maintain #901/);
});

test("RB-29: AGENTS_GATES=enforce sends the agent back to fix an emptied file", () => {
  const { out } = run(fixture(), { AGENTS_GATES: "enforce" });
  assert.match(out, /maintain #901/);
});

test("RB-29: every switch off removes its line and the gate no longer enforces", () => {
  const { out } = run(fixture(), { AGENTS_GATES: "off", AGENTS_PROVENANCE: "off", AGENTS_SLA: "off", AGENTS_STALE: "off" });
  assert.doesNotMatch(out, /Diff sanity|Provenance \(|Handoff SLA|Stale PRs/);
  assert.match(out, /AGENTS_GATES=off/);
});

test("RB-29: dry-run makes no GitHub write", () => {
  const { calls } = run(fixture(), { AGENTS_GATES: "enforce" });
  assert.ok(calls.length > 0);
  assert.deepEqual(calls.filter((c) => !c.startsWith("GET ")), []);
});
