// Creates the GitHub objects the agent team needs, idempotently: labels,
// one journal issue per agent, and the agent board issue. Safe to run on
// every dispatcher tick; it only writes what is missing.
//
//   node scripts/agents/bootstrap.mjs            # create anything missing
//   node scripts/agents/bootstrap.mjs --dry-run  # list what would be created
import { loadRoster, repoSlug, gh, ghAll, labelNames, journalTitle } from "./lib.mjs";

export const BOARD_TITLE = "Agent board";

export function wantedLabels(roster) {
  const labels = [
    { name: "from:agent", color: "ededed", description: "Opened by an Early Letters agent" },
    { name: "journal", color: "c5def5", description: "An agent's journal: identity, memory and founder instructions" },
    { name: "agent-board", color: "0e8a16", description: "Live status of the agent team" },
    { name: "report", color: "bfdadc", description: "Recurring report written by an agent" },
    { name: "digest", color: "bfdadc", description: "Daily founder digest" },
    { name: "needs:founder", color: "d93f0b", description: "Blocked on a founder decision or account step" },
    { name: "review:red-team-ok", color: "0e8a16", description: "Red team: ship" },
    { name: "review:changes-needed", color: "b60205", description: "Red team: fix first" },
    { name: "approve-migration", color: "5319e7", description: "Founder approval for a supabase or auth change (D-041)" },
    { name: "backlog", color: "c2e0c6", description: "Mirrors a docs/BACKLOG.md task" },
    { name: "inbox", color: "fbca04", description: "Founder bug or idea, not yet in the backlog" },
    { name: "idea", color: "a2eeef", description: "Founder idea" },
    { name: "handoff", color: "5319e7", description: "A message from one agent to others (docs/agents/AGENT-COMMS.md)" },
    { name: "rfc", color: "5319e7", description: "Proposed change to an engineering standard; every steward replies" },
  ];
  for (const a of roster.agents) {
    labels.push({
      name: `agent:${a.handle}`,
      color: roster.departments?.[a.department] ?? "ededed",
      description: `${a.title} (${a.department})`.slice(0, 100),
    });
    labels.push({ name: `from:${a.handle}`, color: "ededed", description: `Handoff sent by ${a.handle}`.slice(0, 100) });
    labels.push({ name: `to:${a.handle}`, color: roster.departments?.[a.department] ?? "ededed", description: `Handoff waiting for ${a.handle}`.slice(0, 100) });
  }
  return labels;
}

export function journalBody(agent, roster, repo = roster.repo) {
  const blob = `https://github.com/${repo}/blob/${roster.base_branch}`;
  return [
    `**${agent.title}** (\`${agent.handle}\`), ${agent.department}.`,
    "",
    `- Charter: [\`.claude/agents/${agent.handle}.md\`](${blob}/.claude/agents/${agent.handle}.md)`,
    `- Memory: [\`agents/${agent.handle}/MEMORY.md\`](${blob}/agents/${agent.handle}/MEMORY.md)`,
    `- Rules: [\`docs/agents/OPERATING_MODEL.md\`](${blob}/docs/agents/OPERATING_MODEL.md)`,
    `- Pull requests: label \`agent:${agent.handle}\``,
    "",
    "Each run, this agent reads its recent entries here and posts one new entry plus a run receipt.",
    `**To instruct this agent, comment here.** Only comments from @${roster.founder} are read as instructions; everything else is ignored.`,
  ].join("\n");
}

export function ensureLabels(repo, roster, { dryRun = false } = {}) {
  const have = new Set(ghAll(`/repos/${repo}/labels`).map((l) => l.name));
  const created = [];
  for (const l of wantedLabels(roster)) {
    if (have.has(l.name)) continue;
    created.push(l.name);
    if (!dryRun) gh(`/repos/${repo}/labels`, { method: "POST", body: l, allowFail: true });
  }
  return created;
}

/** Map handle -> journal issue, creating any that are missing. */
export function ensureJournals(repo, roster, { dryRun = false } = {}) {
  const open = ghAll(`/repos/${repo}/issues?state=open&labels=journal`);
  const byHandle = new Map();
  for (const issue of open) {
    const label = labelNames(issue).find((n) => n.startsWith("agent:"));
    if (label) byHandle.set(label.slice(6), issue);
  }
  const created = [];
  for (const a of roster.agents) {
    if (byHandle.has(a.handle)) continue;
    created.push(a.handle);
    if (dryRun) continue;
    const issue = gh(`/repos/${repo}/issues`, {
      method: "POST",
      body: { title: journalTitle(a), body: journalBody(a, roster, repo), labels: ["journal", `agent:${a.handle}`] },
    });
    byHandle.set(a.handle, issue);
  }
  return { byHandle, created };
}

export function findBoard(repo) {
  return ghAll(`/repos/${repo}/issues?state=open&labels=agent-board`)[0];
}

export function ensureBoard(repo, { dryRun = false } = {}) {
  const board = findBoard(repo);
  if (board || dryRun) return { board, created: !board };
  const issue = gh(`/repos/${repo}/issues`, {
    method: "POST",
    body: {
      title: BOARD_TITLE,
      body: "The dispatcher rewrites this issue every tick. See `docs/agents/OPERATING_MODEL.md`.",
      labels: ["agent-board"],
    },
  });
  return { board: issue, created: true };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes("--dry-run");
  const roster = loadRoster();
  const repo = repoSlug(roster);
  const labels = ensureLabels(repo, roster, { dryRun });
  const { created: journals } = ensureJournals(repo, roster, { dryRun });
  const { created: board } = ensureBoard(repo, { dryRun });
  const verb = dryRun ? "would create" : "created";
  console.log(`${verb} ${labels.length} labels${labels.length ? `: ${labels.join(", ")}` : ""}`);
  console.log(`${verb} ${journals.length} journals${journals.length ? `: ${journals.join(", ")}` : ""}`);
  console.log(`${verb} board: ${board ? "yes" : "no"}`);
}
