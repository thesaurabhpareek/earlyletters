// node --test scripts/agents/id-collisions.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { addedIds, developIds, findCollisions, nextApplyFile, selectPrs, definesIds, report } from "./id-collisions.mjs";

const here = (f) => fileURLToPath(new URL(f, import.meta.url));
const SCRIPT = here("./id-collisions.mjs");
const APPLY26 = here("./id-collisions.apply26.fixture.json");
const ADR0023 = here("./id-collisions.adr0023.fixture.json");
const load = (f) => JSON.parse(readFileSync(f, "utf8"));
const run = (fx) => findCollisions({ develop: developIds(fx.develop.files, fx.develop.adrFiles), prs: fx.prs });

test("the real APPLY.md File 26 clash: #306 and #311 both add File 26", () => {
  const r = run(load(APPLY26));
  assert.deepEqual(r.collisions, [{ kind: "APPLY", id: "26", prs: [306, 311], onDevelop: false }]);
  assert.deepEqual(r.added, [
    { pr: 306, title: load(APPLY26).prs[0].title, ids: ["File 26"] },
    { pr: 311, title: load(APPLY26).prs[1].title, ids: ["File 26"] },
  ]);
  assert.deepEqual(r.unchecked, []);
});

test("the real ADR 0023 clash: #139, #146 and #150 each add an ADR 0023", () => {
  const r = run(load(ADR0023));
  assert.deepEqual(r.collisions, [{ kind: "ADR", id: "0023", prs: [139, 146, 150], onDevelop: false }]);
});

test("next-id's APPLY number counts develop and open PRs: 26 is taken by #306, so the next is 27", () => {
  const fx = load(APPLY26);
  const develop = fx.develop.files["supabase/APPLY.md"];
  assert.equal(nextApplyFile([develop]), "26");
  const added = fx.prs[0].files[0].patch.split("\n").filter((l) => l.startsWith("+")).map((l) => l.slice(1)).join("\n");
  assert.equal(nextApplyFile([develop, added]), "27");
  assert.equal(nextApplyFile([""]), "1");
  // Old sections are headed by a migration timestamp, not a file number.
  assert.equal(nextApplyFile(["## File 20261004000000_plus_on_device_only.sql (Plus checked on the device)"]), "1");
});

test("an id a PR adds that develop already has is a collision with develop", () => {
  const develop = developIds({ "docs/DECISIONS.md": "| D-118 | Asha's website name | Decided |\n### D-118 x\n" }, ["docs/adr/0027-x.md"]);
  const prs = [
    { number: 1, files: [{ filename: "docs/DECISIONS.md", status: "modified", patch: "@@ -1 +1,2 @@\n+| D-118 | another call | Delegated |\n+| D-120 | new | Delegated |" }] },
    { number: 2, files: [{ filename: "docs/adr/0027-other.md", status: "added" }] },
  ];
  const r = findCollisions({ develop, prs });
  assert.deepEqual(r.collisions, [
    { kind: "D", id: "D-118", prs: [1], onDevelop: true },
    { kind: "ADR", id: "0027", prs: [2], onDevelop: true },
  ]);
  assert.match(report(r), /COLLISION decision D-118: added by #1 but already on develop/);
});

test("editing an existing row, or mentioning an id, is not adding it", () => {
  const files = [
    { filename: "docs/DECISIONS.md", status: "modified", patch: "-| D-099 | old text | Decided |\n+| D-099 | old text; superseded by D-100 | Decided |" },
    { filename: "docs/BACKLOG.md", status: "modified", patch: "+Depends on BL-444 and D-111.\n+#### BL-446 New task [High]\n+| BL-447 | Deferred task | v1.1 |" },
    { filename: "scripts/docs/docs.test.mjs", status: "modified", patch: "+const id = 'D-999';" },
    { filename: "supabase/APPLY.md", status: "modified", patch: "+Apply after File 25 (`20261023060000`).\n+| 2 | `20261001000000_scribe_hardening.sql` | Applied |" },
  ];
  const { ids } = addedIds(files);
  assert.deepEqual([...ids.D], []);
  assert.deepEqual([...ids.BL].sort(), [446, 447]);
  assert.deepEqual([...ids.APPLY], [2]);
  assert.equal(definesIds("scripts/docs/docs.test.mjs"), false);
  assert.equal(definesIds("docs/backlog/future/02-family-circle.md"), true);
});

test("a renamed ADR counts only when its number changes; a missing patch is reported, not guessed", () => {
  const r = addedIds([
    { filename: "docs/adr/0024-owner-backup-v1.md", status: "renamed", previous_filename: "docs/adr/0023-owner-backup-v1.md" },
    { filename: "docs/adr/0025-sync.md", status: "renamed", previous_filename: "docs/adr/0025-sync-protocol.md" },
    { filename: "docs/adr/0026-x.md", status: "modified" },
    { filename: "supabase/APPLY.md", status: "modified" },
  ]);
  assert.deepEqual([...r.ids.ADR], [24]);
  assert.deepEqual(r.unchecked, ["supabase/APPLY.md"]);
});

test("only PRs that can land on develop are compared: into develop, or stacked on one", () => {
  const pr = (number, base, head) => ({ number, base: { ref: base }, head: { ref: head } });
  const all = [pr(1, "develop", "a"), pr(2, "a", "b"), pr(3, "b", "c"), pr(4, "main", "web"), pr(5, "old-branch", "d")];
  assert.deepEqual(selectPrs(all).map((p) => p.number), [1, 2, 3]);
});

test("the CLI reads a fixture, prints the clash and exits 1, and --json gives the same result", () => {
  let out = "";
  let code = 0;
  try {
    execFileSync(process.execPath, [SCRIPT, "--fixture", APPLY26], { encoding: "utf8" });
  } catch (err) {
    code = err.status;
    out = err.stdout;
  }
  assert.equal(code, 1);
  assert.match(out, /COLLISION APPLY\.md File 26: added by #306, #311\./);
  const json = (() => {
    try {
      execFileSync(process.execPath, [SCRIPT, "--fixture", ADR0023, "--json"], { encoding: "utf8" });
    } catch (err) {
      return JSON.parse(err.stdout);
    }
  })();
  assert.deepEqual(json.collisions.map((c) => c.id), ["0023"]);
});

test("a stacked PR does not clash with its own parent: ids an ancestor adds belong to the ancestor", () => {
  const develop = developIds({ "docs/DECISIONS.md": "### D-100 x\n" }, []);
  const add = (id) => ({ filename: "docs/DECISIONS.md", status: "modified", patch: `@@ -1 +1,2 @@\n+### ${id} new` });
  const prs = [
    { number: 164, files: [add("D-130")] },
    // #167 is stacked on #164 and compared with develop, so its diff repeats #164's D-130.
    { number: 167, parent: 164, files: [add("D-130"), add("D-131")] },
    // #168 is stacked on #167: it repeats both ancestors' ids.
    { number: 168, parent: 167, files: [add("D-130"), add("D-131"), add("D-132")] },
    // An unrelated PR that really does add D-131 still clashes with #167.
    { number: 200, files: [add("D-131")] },
  ];
  const r = findCollisions({ develop, prs });
  assert.deepEqual(r.collisions, [{ kind: "D", id: "D-131", prs: [167, 200], onDevelop: false }]);
  assert.deepEqual(r.added.map((a) => [a.pr, a.ids]), [[164, ["D-130"]], [167, ["D-131"]], [168, ["D-132"]], [200, ["D-131"]]]);
});
