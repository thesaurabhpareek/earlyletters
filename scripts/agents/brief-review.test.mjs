// The red-team review brief names who wrote the PR, also when it has no agent label.
// Run: node --test scripts/agents/brief-review.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const BRIEF = fileURLToPath(new URL("./brief.mjs", import.meta.url));

// A fake `gh` that serves one open PR and an empty answer for everything else.
function reviewBrief(pr) {
  const dir = mkdtempSync(join(tmpdir(), "brief-review-"));
  const fake = join(dir, "gh");
  writeFileSync(fake, `#!/bin/sh\ncase "$*" in\n  *pulls?state=open*) printf '%s' '${JSON.stringify([pr])}' ;;\n  *) printf '[]' ;;\nesac\n`);
  chmodSync(fake, 0o755);
  const out = join(dir, "brief.md");
  execFileSync(process.execPath, [BRIEF, "--agent", "red-team", "--mode", "review", "--pr", String(pr.number), "--journal", "1", "--out", out], {
    env: { ...process.env, PATH: `${dir}:${process.env.PATH}` },
    stdio: ["ignore", "pipe", "pipe"],
  });
  return readFileSync(out, "utf8");
}

const PR = { number: 30, title: "A change", head: { sha: "a".repeat(40), ref: "x" }, user: { login: "founder-login" }, labels: [] };

test("review brief: a PR with no agent label is named by its author, not undefined", () => {
  const doc = reviewBrief(PR);
  assert.match(doc, /\*\*Review PR #30\*\* by `founder-login`/);
  assert.ok(!doc.includes("`undefined`"));
});

test("review brief: an agent label still wins over the author", () => {
  const doc = reviewBrief({ ...PR, labels: [{ name: "agent:mobile" }] });
  assert.match(doc, /\*\*Review PR #30\*\* by `mobile`/);
});
