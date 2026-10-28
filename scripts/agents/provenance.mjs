// Commit provenance (owner: ops, RB-13). Reports which commits carry the trailers
// `Agent:`, `Co-Authored-By:` and `Claude-Session:`, and the agent-attributed share.
// Why: without the `Agent:` trailer the agent share of delivery cannot be measured,
// and unmeasured AI output hides instability (DORA). Warn-only by design: the CLI
// always exits 0 and never blocks a push or a merge. Design: docs/agents/hardening/provenance.md.
// CLI: node scripts/agents/provenance.mjs --since <rev|YYYY-MM-DD> [--ref <ref>] [--json]
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** Agent handles are lowercase kebab case, as in agents/roster.json. */
const HANDLE = /^[a-z][a-z0-9-]*$/;
const RS = "\x1e";
const US = "\x1f";

/**
 * Trailers of one commit message: the key/value lines of the LAST paragraph, and only
 * if every line there is `Key: value` (or a continuation). Prose that merely contains
 * "Agent: x" higher up must not count, or the share would be inflated.
 */
export function parseTrailers(message) {
  const paras = String(message ?? "").replace(/\r\n/g, "\n").trim().split(/\n\s*\n/);
  if (paras.length < 2) return [];
  const lines = paras[paras.length - 1].split("\n");
  const out = [];
  for (const line of lines) {
    const m = /^([A-Za-z][A-Za-z0-9-]*):[ \t]*(.*)$/.exec(line);
    if (m) out.push({ key: m[1].toLowerCase(), value: m[2].trim() });
    else if (/^[ \t]+\S/.test(line) && out.length) out[out.length - 1].value += " " + line.trim();
    else return [];
  }
  return out;
}

/** Provenance flags for one commit. */
export function classify(commit) {
  const t = parseTrailers(commit.body);
  const val = (k) => t.filter((x) => x.key === k && x.value).map((x) => x.value);
  const agents = val("agent");
  const validAgent = agents.find((v) => HANDLE.test(v));
  return {
    hash: commit.hash,
    subject: commit.subject,
    date: commit.date,
    agent: Boolean(validAgent),
    agentHandle: validAgent ?? null,
    agentMalformed: agents.length > 0 && !validAgent,
    coAuthoredBy: val("co-authored-by").length > 0,
    claudeSession: val("claude-session").length > 0,
  };
}

/** Parse the output of `git log --format=%H%x1f%aI%x1f%s%x1f%B%x1e`. */
export function parseLog(raw) {
  return String(raw ?? "").split(RS).map((r) => r.replace(/^\n+/, "")).filter((r) => r.trim()).map((r) => {
    const [hash, date, subject, ...rest] = r.split(US);
    return { hash: hash.trim(), date, subject, body: rest.join(US) };
  });
}

/** Totals and shares over a list of commits. Share is 0 for an empty list, never NaN. */
export function summarize(commits) {
  const rows = commits.map(classify);
  const n = rows.length;
  const count = (f) => rows.filter(f).length;
  const share = (c) => (n ? Math.round((c / n) * 1000) / 10 : 0);
  const agent = count((r) => r.agent);
  const byAgent = {};
  for (const r of rows) if (r.agentHandle) byAgent[r.agentHandle] = (byAgent[r.agentHandle] ?? 0) + 1;
  return {
    total: n,
    agent,
    coAuthoredBy: count((r) => r.coAuthoredBy),
    claudeSession: count((r) => r.claudeSession),
    agentMalformed: count((r) => r.agentMalformed),
    agentSharePct: share(agent),
    coAuthoredByPct: share(count((r) => r.coAuthoredBy)),
    claudeSessionPct: share(count((r) => r.claudeSession)),
    byAgent,
    commits: rows,
  };
}

/** A date (YYYY-MM-DD...) is a time cut-off; anything else is a revision, meaning `rev..ref`. */
export function logArgs(since, ref = "HEAD") {
  const fmt = `--format=%H${US}%aI${US}%s${US}%B${RS}`;
  return /^\d{4}-\d{2}-\d{2}/.test(since)
    ? ["log", ref, `--since=${since}`, fmt]
    : ["log", `${since}..${ref}`, fmt];
}

export function readCommits(since, ref, cwd) {
  return parseLog(execFileSync("git", logArgs(since, ref), { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
}

/** Human report; commits missing the Agent trailer are warned about, never failed. */
export function formatReport(s, since) {
  const mark = (b) => (b ? "yes" : "NO ");
  const lines = [`Provenance since ${since}: ${s.total} commits`];
  for (const r of s.commits) lines.push(`  ${r.hash.slice(0, 8)}  agent:${mark(r.agent)} co-author:${mark(r.coAuthoredBy)} session:${mark(r.claudeSession)}  ${r.subject}`);
  lines.push(
    `Agent trailer:   ${s.agent}/${s.total} (${s.agentSharePct}%)`,
    `Co-Authored-By:  ${s.coAuthoredBy}/${s.total} (${s.coAuthoredByPct}%)`,
    `Claude-Session:  ${s.claudeSession}/${s.total} (${s.claudeSessionPct}%)`,
  );
  if (s.agentMalformed) lines.push(`WARN: ${s.agentMalformed} commit(s) have an Agent: trailer that is not a roster-style handle.`);
  if (s.total && s.agent < s.total) lines.push(`WARN: ${s.total - s.agent} commit(s) have no Agent: trailer (warn-only; not blocking).`);
  return lines.join("\n");
}

export function main(argv, out = console.log) {
  const get = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const since = get("--since");
  if (!since) { out("usage: node scripts/agents/provenance.mjs --since <rev|YYYY-MM-DD> [--ref <ref>] [--json]"); return 0; }
  try {
    const s = summarize(readCommits(since, get("--ref") ?? "HEAD"));
    out(argv.includes("--json") ? JSON.stringify(s, null, 2) : formatReport(s, since));
  } catch (e) {
    // Warn-only: an unreadable log (shallow clone, unknown rev) must not fail a pipeline.
    out(`WARN: provenance could not read git log: ${String(e.message).split("\n")[0]}`);
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
