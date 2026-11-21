// Keeps docs/agents/exec/CONSULT-MATRIX.md equal to the routing table in COUNCIL.md section 4.
// Run: node --test scripts/agents/consult-matrix.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

/** Rows of the first table after a heading that matches `heading`, as arrays of trimmed cells. */
export function tableAfter(text, heading) {
  const start = text.search(heading);
  assert.ok(start >= 0, `heading ${heading} not found`);
  const rows = [];
  let inTable = false;
  for (const line of text.slice(start).split("\n").slice(1)) {
    if (/^\|/.test(line)) {
      inTable = true;
      const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
      if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
      rows.push(cells);
    } else if (inTable) break;
  }
  return rows;
}

const council = tableAfter(read("docs/agents/exec/COUNCIL.md"), /^## 4\. Routing/m);
const matrix = tableAfter(read("docs/agents/exec/CONSULT-MATRIX.md"), /^## The matrix/m);

test("the council routing table has the rows this test expects", () => {
  assert.deepEqual(council[0], ["If the question is about", "Owner", "Always consult"]);
  assert.ok(council.length >= 2, "no rows found in COUNCIL.md section 4");
});

test("the matrix has the same rows as COUNCIL.md section 4, in the same order, with no extra", () => {
  assert.equal(matrix.length, council.length, "row count differs");
  council.forEach((row, i) => assert.deepEqual(matrix[i], row, `row ${i} differs`));
});

test("the Consulted line is described in the matrix and in the proposed template text", () => {
  const m = read("docs/agents/exec/CONSULT-MATRIX.md");
  const p = read("docs/ops/proposed/pr-template-consulted-line.md");
  for (const [name, t] of [["matrix", m], ["proposal", p]]) {
    assert.match(t, /Consulted:/, `${name} has no Consulted line`);
    assert.match(t, /none needed/, `${name} has no none-needed form`);
    assert.match(t, /not (a|counsel)/i, `${name} does not say the line is not a sign-off`);
  }
  assert.match(p, /\.github\/pull_request_template\.md/);
});

test("the proposal does not claim a ruling is made", () => {
  for (const f of ["docs/agents/exec/CONSULT-MATRIX.md", "docs/ops/proposed/pr-template-consulted-line.md"]) {
    const t = read(f);
    assert.match(t, /Karma ruling/);
    assert.doesNotMatch(t, /ruled by Karma|Karma ruled|per CR-6\d/i, f);
  }
});
