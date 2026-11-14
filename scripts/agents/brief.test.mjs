// brief.mjs end to end against a fake `gh` (no network, no GitHub writes).
// Run: node --test scripts/agents/brief.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, readFileSync, chmodSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, delimiter } from "node:path";
import { loadRoster, ROOT } from "./lib.mjs";
import { BRIEF_BUDGET } from "./memory.mjs";

const HANDLE = "mobile";
const LESSON = "Zebra-crossing fixture rule: brief tests keep their own unique lesson text.";

// A fake gh: answers `gh api ... <path>` from a JSON map of path prefix to body.
// Pages after the first are empty, so ghAll stops. Writes are refused.
function fakeGh(dir, routes) {
  writeFileSync(join(dir, "routes.json"), JSON.stringify(routes));
  const src = `#!${process.execPath}
const fs = require("node:fs");
const args = process.argv.slice(2);
if (args.includes("POST") || args.includes("PATCH") || args.includes("PUT") || args.includes("DELETE")) { console.error("write refused"); process.exit(1); }
const path = args.at(-1);
const routes = JSON.parse(fs.readFileSync(${JSON.stringify(join(dir, "routes.json"))}, "utf8"));
if (/[?&]page=([2-9]|\\d\\d)/.test(path)) { process.stdout.write("[]"); process.exit(0); }
const hit = Object.keys(routes).find((k) => path.startsWith(k));
process.stdout.write(JSON.stringify(hit ? routes[hit] : []));
`;
  const bin = join(dir, "gh");
  writeFileSync(bin, src);
  chmodSync(bin, 0o755);
}

function runBrief(comments) {
  const dir = mkdtempSync(join(tmpdir(), "brief-"));
  const repo = loadRoster().repo;
  fakeGh(dir, { [`/repos/${repo}/issues/12/comments`]: comments });
  const out = join(dir, "brief.md");
  try {
    execFileSync(process.execPath, [join(ROOT, "scripts", "agents", "brief.mjs"), "--agent", HANDLE, "--mode", "standing", "--journal", "12", "--out", out], {
      env: { ...process.env, PATH: `${dir}${delimiter}${process.env.PATH}`, GITHUB_REPOSITORY: repo },
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
    return readFileSync(out, "utf8");
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

const founder = loadRoster().founder;
const journal = (learned, created_at, login = founder) => ({
  created_at, user: { login, type: "User" }, author_association: login === founder ? "OWNER" : "NONE",
  body: `<!-- journal run:r1 agent:${HANDLE} -->\n**Mode:** standing\n**Did:** x\n**Learned:** ${learned}\n**Founder:** none`,
});

test("a Learned line in the journal reaches the next brief, inside the size budget", () => {
  assert.ok(!readFileSync(join(ROOT, "agents", HANDLE, "MEMORY.md"), "utf8").includes("Zebra-crossing"), "fixture lesson must be new");
  const brief = runBrief([journal(LESSON, "2026-10-27T10:00:00Z")]);
  assert.match(brief, /## Carry into memory\n[\s\S]*- \(2026-10-27\) Zebra-crossing fixture rule/);
  assert.match(brief, /memory\.mjs carry --agent mobile/);
  assert.match(brief, /## Your memory, in short/);
  assert.match(brief, /## Decisions since your last run\n\nLogged on or after 2026-10-27/);
  const start = brief.indexOf("## Carry into memory");
  const end = brief.indexOf("## Finish the run");
  assert.ok(start > 0 && end > start);
  assert.ok(end - start <= BRIEF_BUDGET, `memory sections are ${end - start} chars`);
  for (const [file, heading] of [["docs/agents/LESSONS.md", "## Lessons from other runs"], ["agents/lessons/REGISTRY.md", "## Error classes to watch"]]) {
    if (!existsSync(join(ROOT, file))) assert.ok(!brief.includes(heading), `${file} is absent, so no section`);
  }
});

test("a Learned line from an untrusted author never reaches the brief", () => {
  const brief = runBrief([journal(LESSON, "2026-10-27T10:00:00Z", "someone-else")]);
  assert.ok(!brief.includes("Zebra-crossing"));
  assert.match(brief, /## Newest decisions/, "no trusted entry means no last run");
});
