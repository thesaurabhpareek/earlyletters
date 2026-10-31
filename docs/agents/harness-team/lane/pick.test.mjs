import { test } from "node:test";
import assert from "node:assert/strict";
import { rank } from "./pick.mjs";

const L = (total, covered) => ({ lines: { total, covered, pct: Math.round((covered / total) * 100) } });

test("picks the eligible file with the most uncovered lines", () => {
  const r = rank({
    "packages/api": { total: L(1000, 900), "packages/api/src/a.ts": L(100, 90), "packages/api/src/b.ts": L(200, 150) },
    "packages/analytics": { "packages/analytics/src/c.ts": L(60, 20) },
  });
  assert.equal(r[0].file, "packages/api/src/b.ts");
  assert.equal(r[0].uncovered, 50);
});

test("never picks tests, type files, tiny or huge files, excluded or never-list files", () => {
  const r = rank({
    "packages/api": {
      "packages/api/test/x.test.ts": L(100, 0),
      "packages/api/src/t.d.ts": L(100, 0),
      "packages/api/src/tiny.ts": L(10, 0),
      "packages/api/src/huge.ts": L(5000, 0),
      "packages/api/src/done.ts": L(50, 50),
      "packages/api/src/taken.ts": L(100, 0),
    },
    "packages/brand": { "packages/brand/index.ts": L(100, 0) },
  }, { exclude: ["packages/api/src/taken.ts"] });
  assert.deepEqual(r, []);
});
