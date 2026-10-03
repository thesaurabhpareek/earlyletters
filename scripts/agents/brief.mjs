#!/usr/bin/env node
// Builds the run brief an agent reads first: identity, memory pointers, the
// journal excerpt (its own last entries plus founder instructions since), and
// the assignment with everything needed to start without asking.
//
//   node scripts/agents/brief.mjs --agent mobile --mode task --task BL-121 \
//        --journal 12 --run-url <url> --out .agent-run/brief.md
import { mkdirSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  ROOT, loadRoster, ownerMap, parseBacklog, eligibility, primaryOwner, takenIds,
  repoSlug, ghAll, agentOfPR, readText, isFounderComment,
} from "./lib.mjs";

const argv = process.argv.slice(2);
const opt = (n, d = "") => {
  const i = argv.indexOf(`--${n}`);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d;
};
const handle = opt("agent");
const mode = opt("mode", "standing");
const taskId = opt("task");
const prNum = opt("pr");
const reason = opt("reason");
const runUrl = opt("run-url", "local run");
const runId = opt("run-id", process.env.GITHUB_RUN_ID ?? "local");
const outPath = opt("out", join(ROOT, ".agent-run", "brief.md"));

const roster = loadRoster();
const repo = repoSlug(roster);
const agent = roster.agents.find((a) => a.handle === handle);
if (!agent) {
  console.error(`Unknown agent "${handle}". Known: ${roster.agents.map((a) => a.handle).join(", ")}`);
  process.exit(1);
}

// ---------- journal ----------

let journal = opt("journal");
if (!journal) {
  const issues = ghAll(`/repos/${repo}/issues?state=open&labels=journal,agent:${handle}`, { allowFail: true });
  journal = String(issues[0]?.number ?? "");
}
const comments = journal ? ghAll(`/repos/${repo}/issues/${journal}/comments`, { allowFail: true }) : [];
const entries = comments.filter((c) => (c.body ?? "").includes("<!-- journal run:"));
const lastEntryAt = entries.length ? new Date(entries.at(-1).created_at) : new Date(0);
const founderNotes = comments.filter((c) => isFounderComment(c, roster) && new Date(c.created_at) > lastEntryAt);
const recent = entries.slice(-3);

// ---------- assignment ----------

const tasks = parseBacklog(readText(join(ROOT, "docs", "BACKLOG.md")));
const byId = new Map(tasks.map((t) => [t.id, t]));
const owners = ownerMap(roster);
const openPRs = ghAll(`/repos/${repo}/pulls?state=open`, { allowFail: true });
const mine = openPRs.filter((pr) => agentOfPR(pr) === handle);

function assignmentSection() {
  const lines = [];
  if (mode === "task") {
    const t = byId.get(taskId);
    lines.push(`**Do backlog task ${taskId}.** Follow "How a scheduled run uses this file" and the Definition of Done at the top of \`docs/BACKLOG.md\`.`);
    lines.push(`Branch: \`<type>/<area>-${taskId.toLowerCase()}-<slug>\` from \`${roster.base_branch}\`. PR title: \`${taskId}: <title>\`. In the same PR, set this task's status line to \`in-review (PR #n)\`.`);
    lines.push("", "The task, verbatim from `docs/BACKLOG.md`:", "", "```markdown", t ? t.block : `(${taskId} not found in docs/BACKLOG.md: stop and say so in your journal)`, "```");
  } else if (mode === "maintain") {
    const pr = openPRs.find((p) => String(p.number) === String(prNum));
    lines.push(`**Fix your PR #${prNum}** (${pr?.title ?? "title unknown"}). Why it needs you: ${reason || "see the PR"}.`);
    if (pr) lines.push(`Work on its branch: \`git fetch origin ${pr.head.ref} && git checkout ${pr.head.ref}\`, commit, \`git push\`. Do not open a new PR.`);
    const prComments = pr ? [
      ...ghAll(`/repos/${repo}/pulls/${prNum}/reviews`, { allowFail: true }),
      ...ghAll(`/repos/${repo}/issues/${prNum}/comments`, { allowFail: true }),
    ].filter((c) => isFounderComment(c, roster) || (c.body ?? "").includes("<!-- red-team:")) : [];
    for (const c of prComments.slice(-5)) lines.push("", `From ${c.user?.login}:`, "", quote(c.body));
    lines.push("", "For failing checks, read the logs with `gh run list --branch <branch>` and `gh run view <id> --log-failed`.");
  } else if (mode === "review") {
    const pr = openPRs.find((p) => String(p.number) === String(prNum));
    lines.push(`**Review PR #${prNum}** by \`${pr ? agentOfPR(pr) : "unknown"}\`: ${pr?.title ?? ""}. Head commit \`${pr?.head?.sha ?? "?"}\`.`);
    lines.push("Follow section 6 of the operating model. Read the diff with `gh pr diff " + prNum + "`. Your review body must start with `<!-- red-team:" + (pr?.head?.sha ?? "<sha>") + " -->`.");
  } else if (mode === "digest") {
    lines.push("**Write today's founder digest** (operating model section 7).");
    lines.push("Sources: the issue labelled `agent-board`, open PRs (`gh pr list`), PRs merged in the last day (`gh pr list --state merged --search \"merged:>=<yesterday>\"`), agent journals (label `journal`), and `needs-decision` tasks in `docs/BACKLOG.md`.");
    lines.push("Close the previous open `digest` issue after posting the new one.");
  } else {
    lines.push("**Your queue is empty: do a standing duty.** Take the first standing duty in your charter that is not already covered by an open PR of yours; if one is, continue that PR on its branch instead of opening another.");
    lines.push(`Your open PRs: ${mine.map((p) => `#${p.number} ${p.title}`).join("; ") || "none"}.`);
    if (agent.kind === "planner") lines.push("", ...plannerContext());
  }
  return lines;
}

function plannerContext() {
  const taken = takenIds(openPRs);
  const lines = ["Queue depth by agent (eligible backlog tasks not already taken):", "", "| Agent | Backlog owner names | Ready now |", "|---|---|---|"];
  for (const a of roster.agents) {
    if (!a.backlog_owner_names.length) continue;
    const n = tasks.filter((t) => primaryOwner(t, owners) === a.handle && !taken.has(t.id) && eligibility(t, byId).ok).length;
    lines.push(`| \`${a.handle}\` | ${a.backlog_owner_names.join(", ")} | ${n} |`);
  }
  const inbox = ghAll(`/repos/${repo}/issues?state=open&labels=inbox`, { allowFail: true })
    .concat(ghAll(`/repos/${repo}/issues?state=open&labels=idea`, { allowFail: true }))
    .filter((i) => !i.pull_request && isFounderComment(i, roster));
  lines.push("", `Founder inbox issues to triage: ${inbox.map((i) => `#${i.number} ${i.title}`).join("; ") || "none"}.`);
  lines.push("Agents with 0 ready tasks need well-scoped new tasks (numbering rules at the top of the backlog). Agents with no backlog owner names work from standing duties and need nothing from you.");
  return lines;
}

function quote(text) {
  return (text ?? "").trim().split("\n").map((l) => `> ${l}`).join("\n");
}

function latestBrief() {
  const dir = join(ROOT, "docs", "agents");
  const briefs = readdirSync(dir).filter((f) => /^BRIEF-.*\.md$/.test(f)).sort();
  return briefs.length ? `docs/agents/${briefs.at(-1)}` : undefined;
}

// Other sessions (the founder's build thread and its agents) claim files in
// docs/agents/BOARD.md on develop. Their live claims are off limits.
function otherThreadsSection() {
  let text;
  try { text = readText(join(ROOT, "docs", "agents", "BOARD.md")); } catch { return []; }
  const rows = (text.split(/^## Active claims/m)[1] ?? "").split(/^## /m)[0]
    .split("\n").filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l) && !/\|\s*Agent\s*\|/.test(l))
    .map((l) => l.split("|").map((c) => c.trim()))
    .filter((c) => c.length > 5 && !/^done/i.test(c[5]) && !/merge only/i.test(c[3]));
  const lines = ["## Other threads working in this repo", "",
    "The founder's build thread and its agents claim files in `docs/agents/BOARD.md` (rules: `docs/agents/COORDINATION.md`). Do not edit files under a live claim; if your assignment needs them, say so in your journal and PR body and stop or take your next item."];
  lines.push("", rows.length
    ? rows.map((c) => `- ${c[1]}: ${c[3]} (since ${c[4]})`).join("\n")
    : "No live claims right now.", "");
  return lines;
}

// ---------- write ----------

const brief = latestBrief();
const doc = [
  `# Run brief: ${agent.title} (\`${handle}\`)`,
  "",
  `Run: ${runUrl}. Run id: \`${runId}\`. Mode: **${mode}**. Written ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC.`,
  `Journal issue: #${journal || "missing"}. Repository: ${repo}. Base branch: \`${roster.base_branch}\`.`,
  "",
  "## Read first, in this order",
  "",
  "1. `CLAUDE.md` (the repo rules and the constitution).",
  "2. `docs/agents/OPERATING_MODEL.md` (how the team works; hard limits in section 8).",
  `3. \`.claude/agents/${handle}.md\` (your charter: who you are and what you own).`,
  `4. \`agents/${handle}/MEMORY.md\` (your long-term memory).`,
  ...(brief ? [`5. \`${brief}\` (latest founder decisions).`] : []),
  "",
  "## Founder instructions since your last run",
  "",
  founderNotes.length
    ? founderNotes.map((c) => `${c.created_at.slice(0, 16).replace("T", " ")} UTC:\n\n${quote(c.body)}`).join("\n\n")
    : "None.",
  "",
  "## Your last journal entries",
  "",
  recent.length ? recent.map((c) => quote(c.body.replace(/<!--[^>]*-->/g, "").trim())).join("\n\n") : "None yet. This is your first run.",
  "",
  "## Your assignment",
  "",
  ...assignmentSection(),
  "",
  ...otherThreadsSection(),
  "## Finish the run",
  "",
  `1. Labels on every PR you open or update: \`agent:${handle}\` and \`from:agent\` (\`gh pr edit <n> --add-label agent:${handle},from:agent\`).`,
  `2. Commit messages end with \`Agent: ${handle}\`.`,
  `3. Post exactly one journal entry: write it to a file and run \`gh issue comment ${journal || "<journal>"} --body-file <file>\`. Its first line is \`<!-- journal run:${runId} agent:${handle} -->\` and it follows section 5 of the operating model.`,
  "4. Do one assignment only, then stop. A receipt with cost and duration is added after you finish.",
  "",
].join("\n");

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, doc);
console.log(`wrote ${outPath} (${doc.length} chars, ${founderNotes.length} founder notes, ${recent.length} past entries)`);
