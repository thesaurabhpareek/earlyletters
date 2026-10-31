import { test } from "node:test";
import assert from "node:assert/strict";
import { check, badImports } from "./gate.mjs";

const GOOD = `import { describe, it, expect } from "vitest";
import { verifyManifest } from "../../src/keys";

describe("verifyManifest edges", () => {
  it("rejects an empty manifest", () => {
    expect(() => verifyManifest("")).toThrow();
  });
  it("rejects a manifest with no signature", () => {
    expect(verifyManifest("{}")).toBe(false);
  });
  it("accepts nothing it cannot parse", () => {
    expect(verifyManifest("not json")).toBe(false);
  });
});
`;
const target = "packages/api:packages/api/src/keys.ts";
const path = "packages/api/test/lane/keys-edges.lane.test.ts";
const run = (changes, files = {}) => check({ changes, target, read: (p) => files[p] ?? GOOD });

test("one new lane test in the target workspace passes", () => {
  const r = run([{ status: "A", path }]);
  assert.deepEqual(r, { ok: true, fail: [] });
});

test("modifying, deleting or adding outside the lane folder fails", () => {
  assert.equal(run([{ status: "M", path }]).ok, false);
  assert.equal(run([{ status: "D", path: "packages/api/test/keys.test.ts" }]).ok, false);
  assert.equal(run([{ status: "A", path: "packages/api/test/keys2.test.ts" }]).ok, false);
});

test("the never list holds even for a lane-shaped name", () => {
  for (const p of [".github/workflows/x.yml", "supabase/migrations/1.sql", "packages/core/test/lane/a.lane.test.ts", "packages/content/test/lane/a.lane.test.ts", "CLAUDE.md", "packages/api/package.json"]) {
    assert.equal(run([{ status: "A", path: p }]).ok, false, p);
  }
});

test("two files, a workspace outside the lane, or another workspace fail", () => {
  assert.equal(run([{ status: "A", path }, { status: "A", path: path.replace("keys-edges", "more") }]).ok, false);
  assert.equal(check({ changes: [{ status: "A", path }], target: "packages/core:packages/core/src/verify.ts", read: () => GOOD }).ok, false);
  assert.equal(run([{ status: "A", path: "packages/emails/test/lane/x.lane.test.ts" }]).ok, false);
});

test("tests that cannot fail, escape, or phone home fail", () => {
  const cases = {
    skip: GOOD.replace('it("rejects an empty', 'it.skip("rejects an empty'),
    only: GOOD.replace('describe("verify', 'describe.only("verify'),
    env: GOOD + "\nconst k = process.env.AGENTS_LLM_API_KEY;\n",
    net: GOOD + '\nawait fetch("https://example.invalid/" + 1);\n',
    child: GOOD.replace('from "vitest";', 'from "vitest";\nimport { execSync } from "node:child_process";'),
    fs: GOOD + '\nimport { writeFileSync } from "node:fs";\nwriteFileSync("x", "y");\n',
    dash: GOOD.replace("empty manifest", "empty manifest — really"),
    secret: GOOD + "\n// ghp_abcdefghijklmnopqrstuvwxyz0123\n",
    weak: 'import { it, expect } from "vitest";\nimport { a } from "../../src/keys";\nit("a", () => {});\nit("b", () => {});\nit("c", () => { expect(a).toBeDefined(); });\n',
    notarget: GOOD.replace("../../src/keys", "../../src/other"),
  };
  for (const [name, text] of Object.entries(cases)) {
    const r = run([{ status: "A", path }], { [path]: text });
    assert.equal(r.ok, false, name);
  }
});

test("imports are limited to vitest and the workspace src", () => {
  assert.deepEqual(badImports('import x from "vitest"; import y from "../../src/a/b";'), []);
  assert.deepEqual(badImports('import x from "@scribe/core"; import y from "../../../core/src/verify";'), ["@scribe/core", "../../../core/src/verify"]);
});
