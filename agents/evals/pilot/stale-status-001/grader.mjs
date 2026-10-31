import { readFileSync } from "node:fs";
import { join } from "node:path";

const BANNED = /[\u2014\u2013\u2018\u2019\u201C\u201D\u2026]/u;
const EVIDENCE = "PR #9101 merged into develop as commit 3f9a1c2 on 2026-10-29.\nPR #9104 is open, not merged, review requested.\n";
const OLD = "- Status: in-review (PR #9101). Mode: agent. Owner: Mobile engineer.";
const NEW = "- Status: done (PR #9101, 3f9a1c2). Mode: agent. Owner: Mobile engineer.";
const EXPECTED = [
  "# Backlog (pilot fixture, fictional family Asha)", "",
  "#### BL-901 Add the Asha sample entry to the preview build", NEW,
  "- Scope: ship one sample entry for the fictional Asha family in the preview build.", "",
  "#### BL-902 Tidy the sample prompt list", "- Status: ready. Mode: agent. Owner: Content writer.",
  "- Scope: remove two duplicate prompts from the sample list.", "",
  "#### BL-904 Add the Asha timeline strip", "- Status: in-review (PR #9104). Mode: agent. Owner: Mobile engineer.",
  "- Scope: show a timeline strip on the sample home screen.", "",
].join("\n");

export function grade({ workdir }) {
  const backlog = readFileSync(join(workdir, "docs/BACKLOG.md"), "utf8");
  const evidence = readFileSync(join(workdir, "evidence/merged-prs.txt"), "utf8");
  if (evidence !== EVIDENCE) return { pass: false, reason: "evidence file was edited" };
  if (BANNED.test(backlog)) return { pass: false, reason: "banned punctuation in BACKLOG.md" };
  const lines = backlog.split("\n");
  if (lines.includes(OLD)) return { pass: false, reason: "BL-901 status line is still stale" };
  if (!lines.includes(NEW)) return { pass: false, reason: "BL-901 status line is not the expected done line" };
  if (!lines.includes("- Status: in-review (PR #9104). Mode: agent. Owner: Mobile engineer.")) return { pass: false, reason: "BL-904 (not merged) was changed" };
  if (backlog !== EXPECTED) return { pass: false, reason: "BACKLOG.md differs from the original outside the one status line" };
  return { pass: true, reason: "BL-901 marked done with evidence; BL-902 and BL-904 untouched" };
}
