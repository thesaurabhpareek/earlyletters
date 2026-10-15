// Tests for the documentation scripts. Run: node --test scripts/docs/
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { expoRoutes, migrations, workflows, RENDERERS } from "./facts.mjs";
import { fillBlocks, frontmatter, globToRegExp, matchesAny } from "./lib.mjs";
import { check as refCheck } from "./reference.mjs";
import { check as decCheck, decisionIds, parseRecords, renderIndex, validate, records } from "./decisions.mjs";

function repo(files) {
  const root = mkdtempSync(join(tmpdir(), "docs-"));
  for (const [p, t] of Object.entries(files)) {
    mkdirSync(dirname(join(root, p)), { recursive: true });
    writeFileSync(join(root, p), t);
  }
  return root;
}

const RECORD = (id, over = {}) => {
  const f = {
    Source: "`docs/DECISIONS.md` (Decided, founder, 2026-10-03)",
    Decided: "Something.",
    Why: "Because.",
    Door: "two-way",
    "Reversal cost": "low: a code change",
    "Revisit when": "scale: past 10,000 families; law: a state privacy law",
    Status: "in force",
    "As built": "`apps/mobile/src/lib/store.ts`",
    ...over,
  };
  return [`### ${id} Title of ${id}`, ...Object.entries(f).filter(([, v]) => v !== null).map(([k, v]) => `- **${k}:** ${v}`), ""].join("\n");
};

// ---------- lib ----------

test("frontmatter reads scalars and lists", () => {
  const { data, body } = frontmatter("---\ntitle: Mobile app\ncovers: [apps/mobile/**, packages/core/**]\n---\n# Hi\n");
  assert.equal(data.title, "Mobile app");
  assert.deepEqual(data.covers, ["apps/mobile/**", "packages/core/**"]);
  assert.equal(body, "# Hi\n");
});

test("globs", () => {
  assert.ok(globToRegExp("apps/mobile/**").test("apps/mobile/src/app/listen.tsx"));
  assert.ok(globToRegExp("supabase/migrations/*.sql").test("supabase/migrations/2026_x.sql"));
  assert.ok(!globToRegExp("supabase/migrations/*.sql").test("supabase/migrations/a/b.sql"));
  assert.ok(matchesAny("docs/adr/0001-x.md", ["docs/adr/**"]));
});

test("fillBlocks replaces only named blocks and keeps unknown ones visible", () => {
  const t = "a\n<!-- facts:x -->\nold\n<!-- /facts:x -->\nb\n<!-- facts:y -->\n<!-- /facts:y -->\n";
  const out = fillBlocks(t, (n) => (n === "x" ? "NEW" : undefined));
  assert.match(out, /<!-- facts:x -->\nNEW\n<!-- \/facts:x -->/);
  assert.match(out, /unknown facts block "y"/);
});

// ---------- facts ----------

test("expo routes: groups and index collapse; layouts and specials are labelled", () => {
  const root = repo({
    "apps/mobile/src/app/_layout.tsx": "",
    "apps/mobile/src/app/(tabs)/index.tsx": "",
    "apps/mobile/src/app/(tabs)/book.tsx": "",
    "apps/mobile/src/app/settings/privacy.tsx": "",
    "apps/mobile/src/app/+not-found.tsx": "",
    "apps/mobile/src/app/listen.logic.ts": "",
    "apps/mobile/src/app/_shared/x.tsx": "",
  });
  const r = Object.fromEntries(expoRoutes(root).map((x) => [x.file.replace("apps/mobile/src/app/", ""), x]));
  assert.equal(r["(tabs)/index.tsx"].route, "/");
  assert.equal(r["(tabs)/book.tsx"].route, "/book");
  assert.equal(r["settings/privacy.tsx"].route, "/settings/privacy");
  assert.equal(r["_layout.tsx"].kind, "layout");
  assert.equal(r["+not-found.tsx"].kind, "special");
  assert.equal(r["listen.logic.ts"], undefined);
  assert.equal(r["_shared/x.tsx"], undefined);
});

test("migrations: applied flag, tables, views, functions, definer count; comments ignored", () => {
  const root = repo({
    ".github/migrations-applied.txt": "# header\n001_a.sql\n",
    "supabase/migrations/001_a.sql": "create table public.entries (id uuid);\n-- create table public.fake (x int);\ncreate or replace view book_entries as select 1;",
    "supabase/migrations/002_b.sql": "create or replace function public.purge_due() returns void language sql security definer as $$ select 1 $$;",
  });
  const [a, b] = migrations(root);
  assert.deepEqual([a.applied, a.tables, a.views], [true, ["entries"], ["book_entries"]]);
  assert.deepEqual([b.applied, b.functions, b.definer], [false, ["purge_due"], 1]);
});

test("workflows: inline and block triggers", () => {
  const root = repo({
    ".github/workflows/ci.yml": "name: CI\non:\n  pull_request:\n  push:\n    branches: [develop]\njobs: {}\n",
    ".github/workflows/x.yml": "name: X\non: [workflow_dispatch, schedule]\n",
  });
  const w = Object.fromEntries(workflows(root).map((x) => [x.file, x.triggers]));
  assert.deepEqual(w["ci.yml"], ["pull_request", "push"]);
  assert.deepEqual(w["x.yml"], ["workflow_dispatch", "schedule"]);
});

// ---------- reference.mjs ----------

const PAGE = (extra = "") => `---\ntitle: Data\nowner: reference-docs\ncovers: [supabase/migrations/**]\nverified_at: abc1234\nverified_on: 2026-10-15\n---\n# Data\n${extra}`;

test("reference check: stale pages, drifted facts, frontmatter errors, uncovered areas, missing index", () => {
  const root = repo({
    "docs/reference/data.md": PAGE("<!-- facts:edge-functions -->\nold\n<!-- /facts:edge-functions -->\n"),
    "docs/reference/bad.md": "---\ntitle: Bad\nowner: someone\n---\n",
    "supabase/functions/purge-worker/index.ts": "",
  });
  const r = refCheck(root, { changed: () => ["supabase/migrations/003.sql", "apps/mobile/x.ts"] });
  assert.deepEqual(r.stale.map((s) => [s.page, s.changed]), [["docs/reference/data.md", ["supabase/migrations/003.sql"]]]);
  assert.deepEqual(r.drift, ["docs/reference/data.md"]);
  assert.ok(r.errors.some((e) => /bad\.md: frontmatter is missing covers, verified_at, verified_on/.test(e)));
  assert.ok(r.errors.some((e) => /bad\.md: owner must be reference-docs/.test(e)));
  assert.ok(r.errors.some((e) => /docs\/README\.md/.test(e)));
  assert.deepEqual(r.uncovered, ["supabase/functions/purge-worker/index.ts"]);
});

test("reference check: a current page is clean, and an unknown commit is an error", () => {
  const root = repo({ "docs/README.md": "# Docs\n", "docs/reference/data.md": PAGE() });
  assert.deepEqual(refCheck(root, { changed: () => [] }), { pages: 1, errors: [], drift: [], stale: [], uncovered: [] });
  const r = refCheck(root, { changed: () => null });
  assert.ok(r.errors.some((e) => /abc1234 is not a commit/.test(e)));
});

test("every facts renderer runs on an empty repo", () => {
  const root = repo({ "README.md": "" });
  for (const [name, fn] of Object.entries(RENDERERS)) assert.equal(typeof fn(root), "string", name);
});

// ---------- decisions.mjs ----------

test("decision ids: headings, index rows and ranges", () => {
  const ids = decisionIds("| D-001 | x |\n| D-006 to D-009 | y |\n### D-020 Title\n### D-020 Again\n");
  assert.deepEqual([...ids].sort(), ["D-001", "D-006", "D-007", "D-008", "D-009", "D-020"]);
});

test("records parse fields and stop at a higher heading", () => {
  const recs = parseRecords(`# Area\n\n${RECORD("D-001")}\n## Notes\n- **Door:** ignored\n`, "f.md");
  assert.equal(recs.length, 1);
  assert.equal(recs[0].fields.Door, "two-way");
  assert.equal(recs[0].fields["Revisit when"], "scale: past 10,000 families; law: a state privacy law");
});

test("validation: door, reversal cost, triggers, status reference, review date", () => {
  const known = new Set(["D-001", "D-002"]);
  const ok = parseRecords(RECORD("D-001"), "f.md")[0];
  assert.deepEqual(validate(ok, known), []);
  const bad = parseRecords(
    RECORD("D-002", { Door: "revolving", "Reversal cost": "cheap", "Revisit when": "someday", Status: "superseded by D-999", "Review by": "soon", Why: null }),
    "f.md",
  )[0];
  const p = validate(bad, known).join("\n");
  for (const re of [/missing \*\*Why/, /Door must start/, /Reversal cost must start/, /Revisit when must name/, /points to D-999/, /Review by must be/]) assert.match(p, re);
  const later = parseRecords(RECORD("D-001", { Door: "one-way after launch: once real families use it", "Revisit when": "none expected" }), "f.md")[0];
  assert.deepEqual(validate(later, known), []);
});

test("decision check: missing records, Also coverage, duplicates, unknown D-ids, due reviews, index drift", () => {
  const root = repo({
    "docs/DECISIONS.md": "| D-001 | a |\n| D-002 | b |\n| D-003 | c |\n",
    "docs/adr/0013-apple.md": "# ADR 0013\n",
    "docs/decisions/records/product.md": [
      RECORD("D-001", { Also: "D-002", "Review by": "2026-10-01" }),
      RECORD("D-001"),
      RECORD("D-050"),
      RECORD("R-001"),
    ].join("\n"),
  });
  const r = decCheck(root, "2026-10-15");
  assert.deepEqual(r.missing, ["ADR-0013", "D-003"]);
  assert.ok(r.errors.some((e) => /duplicate record/.test(e)));
  assert.ok(r.errors.some((e) => /D-050: not in docs\/DECISIONS\.md/.test(e)));
  assert.deepEqual(r.due, ["D-001 (review by 2026-10-01)"]);
  assert.equal(r.drift, true);
});

test("index: sections for one-way doors, one-way after launch, R- records and areas", () => {
  const root = repo({
    "docs/decisions/records/brand.md": RECORD("D-004", { Door: "one-way: bundle id cannot change" }),
    "docs/decisions/records/data.md": RECORD("R-001", { Door: "one-way after launch" }),
  });
  const md = renderIndex(records(root), "2026-10-15");
  const section = (name) => md.split(`## ${name}`)[1].split("\n## ")[0];
  assert.match(section("One-way doors in force"), /D-004/);
  assert.match(section("Two-way today, one-way after launch"), /R-001/);
  assert.match(section("Awaiting a D-id"), /R-001/);
  assert.match(md, /## brand/);
  assert.match(md, /2 decisions\. Door types: 1 one-way, 0 two-way, 1 one-way after launch/);
});

test("decision check: as-built paths that no longer exist are reported", () => {
  const root = repo({
    "docs/DECISIONS.md": "| D-001 | a |\n",
    "apps/mobile/src/lib/store.ts": "",
    "docs/decisions/records/product.md": RECORD("D-001", { "As built": "`apps/mobile/src/lib/store.ts`, `apps/mobile/src/lib/gone.ts`, `supabase/migrations/*.sql`, not built elsewhere" }),
  });
  assert.deepEqual(decCheck(root, "2026-10-15").gone, ["D-001: apps/mobile/src/lib/gone.ts"]);
});
