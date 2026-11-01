// node --test scripts/agents/decisions-check.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseDecisions, amendTargets, checkAmended, checkCapacity, checkDuplicates, patchIds, run } from "./decisions-check.mjs";

const here = (f) => fileURLToPath(new URL(f, import.meta.url));
const FX = readFileSync(here("./fixtures/decisions-check.fixture.md"), "utf8");
const P557 = { name: "pr557", text: readFileSync(here("./fixtures/decisions-check.pr557.diff"), "utf8") };
const OTHER = { name: "other", text: readFileSync(here("./fixtures/decisions-check.other.diff"), "utf8") };
const SCRIPT = here("./decisions-check.mjs");
const cli = (...a) => spawnSync(process.execPath, [SCRIPT, ...a], { encoding: "utf8" });

test("D-121 amends D-100, D-101, D-102; only the unmarked rows are flagged", () => {
  const p = parseDecisions(FX);
  assert.deepEqual(amendTargets(p.entries.find((e) => e.id === "D-121")), ["D-100", "D-101", "D-102"]);
  assert.deepEqual(checkAmended(p).map((f) => `${f.id}<-${f.by}`), ["D-100<-D-121", "D-101<-D-121"]);
});

test("a marker for a different amender does not count", () => {
  const text = FX.replace("(amended by D-121 for the first binary)", "(amended by D-099)");
  assert.equal(checkAmended(parseDecisions(text)).length, 3);
});

test("capacity is silent until the field is adopted, then flags post-freeze entries without it", () => {
  const noField = parseDecisions(FX.replace(/- \*\*Capacity:\*\*.*\n/, ""));
  assert.deepEqual(checkCapacity(noField), []);
  assert.deepEqual(checkCapacity(noField, { adopted: true }).map((f) => f.id), ["D-140", "D-141"]);
  assert.deepEqual(checkCapacity(parseDecisions(FX)).map((f) => f.id), ["D-140"]);
});

test("entries on or before the freeze day are not flagged", () => {
  const ids = checkCapacity(parseDecisions(FX), { adopted: true }).map((f) => f.id);
  assert.ok(!ids.includes("D-130") && !ids.includes("D-137"));
});

test("patchIds reads added rows and headings only", () => {
  assert.deepEqual(patchIds(P557.text), ["D-138"]);
  assert.deepEqual(patchIds(OTHER.text), ["D-138", "D-139"]);
  assert.deepEqual(patchIds("-| D-001 | removed |\n context D-002"), []);
});

test("the D-138 collision: PR 557 and a second patch both add it", () => {
  const f = checkDuplicates(parseDecisions(FX), [P557, OTHER]);
  assert.deepEqual(f.map((x) => [x.kind, x.id]), [["COLLISION", "D-138"]]);
  assert.match(f[0].message, /pr557, other/);
});

test("a patch that adds an id the file already has collides with the file", () => {
  const f = checkDuplicates(parseDecisions(FX), [{ name: "p", text: "+### D-137 again\n" }]);
  assert.deepEqual(f.map((x) => [x.kind, x.id]), [["COLLISION", "D-137"]]);
});

test("duplicate rows are found, and an (update) heading is not a duplicate", () => {
  const text = FX + "\n| D-137 | again | x | Yes | 2026-11-01 |\n\n### D-137 (update)\n- note\n";
  const f = checkDuplicates(parseDecisions(text));
  assert.deepEqual(f.map((x) => x.message.replace(/\(lines.*/, "").trim()), ["D-137 has 2 index rows"]);
});

test("cli: advisory exit 0, --strict exit 1, patch collision always exit 1, usage error 2", () => {
  const file = here("./fixtures/decisions-check.fixture.md");
  assert.equal(cli("--file", file).status, 0);
  assert.equal(cli("--file", file, "--strict").status, 1);
  const c = cli("--file", file, "--patch", here("./fixtures/decisions-check.pr557.diff"), "--patch", here("./fixtures/decisions-check.other.diff"));
  assert.equal(c.status, 1);
  assert.match(c.stdout, /COLLISION: D-138/);
  assert.equal(cli("--bogus").status, 2);
  assert.equal(cli("--file", "/no/such/file").status, 2);
});

test("the real log parses: D-100, D-101 and D-121 each have a row and an entry", () => {
  const p = parseDecisions(readFileSync(here("../../docs/DECISIONS.md"), "utf8"));
  for (const id of ["D-100", "D-101", "D-121"]) {
    assert.ok(p.rows.some((r) => r.id === id), `row ${id}`);
    assert.ok(p.entries.some((e) => e.id === id), `entry ${id}`);
  }
  assert.ok(run({ text: "" }).length === 0);
});
