#!/usr/bin/env node
// Lints scheduled-lane prompts so they hold procedure only, and runs the
// preflight each lane does before it acts (retro package R1-04).
//
// A prompt fails when it carries:
//   - a calendar date or year anywhere but its one "Reviewed on:" line
//   - a decision id (D-123) anywhere but that line; decisions live in docs/DECISIONS.md
//   - an issue or PR number (#123) on a line that talks about decisions, scope or freezes
//   - the name of a connector other than GitHub
// and when the "Reviewed on:" line is missing or malformed.
//
//   node scripts/agents/prompt-lint.mjs docs/agents/lanes/*.prompt.md
//   node scripts/agents/prompt-lint.mjs --preflight docs/agents/lanes/agent-lane.prompt.md --reviewed-through D-119
//
// Exit codes: 0 clean; 1 lint errors; 2 preflight stop (stale prompt, pasted
// copy differs from develop, or no dates file of record); 64 usage.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const MONTH = "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";
const DATE_PATTERNS = [
  /\b\d{4}-\d{2}-\d{2}\b/,
  /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
  new RegExp(`\\b\\d{1,2}(?:st|nd|rd|th)?\\s+${MONTH}\\b`),
  new RegExp(`\\b${MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?\\b`),
  /\b20\d\d\b/,
];
const DECISION_ID = /\bD-\d{2,4}\b/;
const ISSUE_REF = /(?:^|[^\w&])#\d+\b/;
const DECISION_WORDS = /\b(?:decision|decisions|decided|in force|supersed\w*|approved|scope|freeze\w*|frozen)\b/i;
// Connector names as they appear in scheduled task settings. Case-sensitive on
// purpose: repository paths such as `supabase/` stay allowed.
export const CONNECTORS = [
  "Supabase", "Vercel", "Gmail", "PayPal", "Square", "Figma", "Notion", "Resend",
  "Google Drive", "Google Calendar", "Google Sheets", "Google Docs", "Google Slides",
  "Google_Drive", "Google_Calendar", "Google_Sheets", "Google_Docs", "Google_Slides",
  "Wispr Flow", "Wispr_Flow", "Claude_Docs", "Claude Docs", "Claude_Code_Remote", "Slack", "Stripe",
];
const CONNECTOR_RE = new RegExp(`\\b(?:${CONNECTORS.map((c) => c.replace(/ /g, "\\s+")).join("|")})\\b|\\bmcp__\\w+`);
export const REVIEWED_RE = /^Reviewed on: (\d{4}-\d{2}-\d{2}), through (D-\d{2,4})\s*$/;

/** Returns a list of { line, rule, text } problems; empty means clean. */
export function lintPrompt(text) {
  const problems = [];
  const lines = text.split("\n");
  const reviewed = lines.map((l, i) => [l.trim(), i + 1]).filter(([l]) => l.startsWith("Reviewed on:"));
  if (reviewed.length !== 1) problems.push({ line: 0, rule: "reviewed-on", text: `needs exactly one "Reviewed on: YYYY-MM-DD, through D-###" line, found ${reviewed.length}` });
  else if (!REVIEWED_RE.test(reviewed[0][0])) problems.push({ line: reviewed[0][1], rule: "reviewed-on", text: 'must read "Reviewed on: YYYY-MM-DD, through D-###"' });

  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (line.startsWith("Reviewed on:")) return;
    const at = i + 1;
    if (DATE_PATTERNS.some((re) => re.test(line))) problems.push({ line: at, rule: "date", text: line });
    if (DECISION_ID.test(line)) problems.push({ line: at, rule: "decision-id", text: line });
    if (ISSUE_REF.test(line) && DECISION_WORDS.test(line)) problems.push({ line: at, rule: "issue-as-decision", text: line });
    if (CONNECTOR_RE.test(line)) problems.push({ line: at, rule: "connector", text: line });
  });
  return problems;
}

/** The highest D-id in the index rows of docs/DECISIONS.md ("| D-119 | ..."). */
export function newestDecisionId(decisionsText) {
  let max = 0;
  for (const m of decisionsText.matchAll(/^\|\s*D-(\d+)\s*\|/gm)) max = Math.max(max, Number(m[1]));
  return max ? `D-${max}` : "";
}

/** Path of the dates file of record, from a line naming it, or "". */
export function datesFileOfRecord(...texts) {
  for (const text of texts) {
    for (const line of text.split("\n")) {
      if (!/dates file of record|^\|\s*Dates\b/i.test(line)) continue;
      const m = line.match(/`([^`\s]+\.(?:md|json|ya?ml|csv))`/);
      if (m) return m[1];
    }
  }
  return "";
}

const num = (id) => Number(String(id).replace(/^D-/, ""));

/**
 * Preflight for a lane run. `pasted` is the D-id from the "Reviewed on" line of
 * the prompt text the scheduled task actually holds.
 * Returns { ok, reasons[], newest, datesFile }.
 */
export function preflight({ promptText, decisionsText, coordinationText = "", pasted, exists = () => true }) {
  const reasons = [];
  const problems = lintPrompt(promptText);
  if (problems.length) reasons.push(`the prompt on develop fails the lint (${problems.length} problems)`);
  const m = promptText.split("\n").map((l) => l.trim()).find((l) => REVIEWED_RE.test(l))?.match(REVIEWED_RE);
  const onDevelop = m ? m[2] : "";
  const newest = newestDecisionId(decisionsText);
  if (!newest) reasons.push("no decision ids found in docs/DECISIONS.md");
  if (!/^D-\d+$/.test(pasted ?? "")) reasons.push("the scheduled prompt has no readable Reviewed on line");
  else {
    if (onDevelop && num(pasted) !== num(onDevelop)) reasons.push(`the scheduled prompt was reviewed through ${pasted} but the copy on develop says ${onDevelop}: paste the develop copy`);
    if (newest && num(newest) > num(pasted)) reasons.push(`${newest} is newer than the prompt's review (through ${pasted}): the founder or coordinator re-reviews the prompt first`);
  }
  const datesFile = datesFileOfRecord(decisionsText, coordinationText);
  if (!datesFile) reasons.push("no dates file of record is named in docs/DECISIONS.md or docs/agents/COORDINATION.md");
  else if (!exists(datesFile)) reasons.push(`the dates file of record ${datesFile} is missing on develop`);
  return { ok: reasons.length === 0, reasons, newest, datesFile };
}

function main(argv) {
  const root = resolve(process.env.REPO_ROOT ?? process.cwd());
  const read = (p) => readFileSync(join(root, p), "utf8");
  if (argv[0] === "--preflight") {
    const file = argv[1];
    const i = argv.indexOf("--reviewed-through");
    if (!file || i < 0) { console.error("usage: prompt-lint.mjs --preflight <prompt.md> --reviewed-through D-###"); return 64; }
    const coord = existsSync(join(root, "docs/agents/COORDINATION.md")) ? read("docs/agents/COORDINATION.md") : "";
    const r = preflight({ promptText: read(file), decisionsText: read("docs/DECISIONS.md"), coordinationText: coord, pasted: argv[i + 1], exists: (p) => existsSync(join(root, p)) });
    console.log(JSON.stringify(r));
    return r.ok ? 0 : 2;
  }
  if (!argv.length) { console.error("usage: prompt-lint.mjs <prompt.md>... | --preflight <prompt.md> --reviewed-through D-###"); return 64; }
  let bad = 0;
  for (const file of argv) {
    for (const p of lintPrompt(read(file))) { bad++; console.log(`${file}:${p.line}: ${p.rule}: ${p.text}`); }
  }
  return bad ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
