#!/usr/bin/env node
// Prints the next free backlog, decision, ADR and supabase/APPLY.md file numbers,
// counting develop AND every open PR, so parallel PRs never pick the same id.
//   node scripts/agents/next-id.mjs        -> {"BL":"BL-441","D":"D-100","ADR":"0023","APPLY":"26"}
// To find ids that open PRs already share: node scripts/agents/id-collisions.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadRoster, repoSlug, ghAll } from "./lib.mjs";
import { nextIds } from "./hardening.mjs";
import { nextApplyFile, definesIds } from "./id-collisions.mjs";

const roster = loadRoster();
const repo = repoSlug(roster);
const read = (p) => (existsSync(join(ROOT, p)) ? readFileSync(join(ROOT, p), "utf8") : "");
const texts = [read("docs/BACKLOG.md"), read("docs/DECISIONS.md")];
const applyTexts = [read("supabase/APPLY.md")];
const backlogDir = join(ROOT, "docs", "backlog");
if (existsSync(backlogDir)) {
  for (const f of readdirSync(backlogDir, { recursive: true })) if (String(f).endsWith(".md")) texts.push(read(join("docs/backlog", String(f))));
}
const adrFiles = existsSync(join(ROOT, "docs", "adr")) ? readdirSync(join(ROOT, "docs", "adr")) : [];
for (const pr of ghAll(`/repos/${repo}/pulls?state=open`, { allowFail: true }) ?? []) {
  for (const f of ghAll(`/repos/${repo}/pulls/${pr.number}/files?per_page=100`, { allowFail: true }) ?? []) {
    if (f.filename.startsWith("docs/adr/")) adrFiles.push(f.filename);
    // Only the files that define ids: a test fixture mentioning "D-999" (#164) once made this print D-1000.
    if (!definesIds(f.filename)) continue;
    const added = (f.patch ?? "").split("\n").filter((l) => l.startsWith("+")).map((l) => l.slice(1)).join("\n");
    if (f.filename === "supabase/APPLY.md") applyTexts.push(added);
    texts.push(added);
  }
}
console.log(JSON.stringify({ ...nextIds(texts, adrFiles), APPLY: nextApplyFile(applyTexts) }));
