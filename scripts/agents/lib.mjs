// Shared helpers for the agent dispatcher, brief builder and receipts.
// Plain Node 22 and the `gh` CLI. No npm dependencies, so the dispatcher job
// starts in seconds and never needs `npm ci`.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

// ---------- roster ----------

export function loadRoster(root = ROOT) {
  const raw = JSON.parse(readFileSync(join(root, "agents", "roster.json"), "utf8"));
  const d = raw.defaults ?? {};
  const agents = raw.agents.map((a, i) => {
    const engine = a.engine ?? d.engine ?? "opencode";
    const e = raw.engines?.[engine] ?? {};
    return {
      kind: "worker",
      backlog_owner_names: [],
      ...a,
      engine,
      model: a.model ?? e.default_model,
      max_turns: a.max_turns ?? d.max_turns,
      timeout_minutes: a.timeout_minutes ?? d.timeout_minutes,
      daily_runs: a.daily_runs ?? d.daily_runs,
      wip_limit: a.wip_limit ?? d.wip_limit,
      max_budget_usd: a.max_budget_usd ?? e.default_budget_usd,
      effort: a.effort ?? d.effort ?? "",
      priority: i,
    };
  });
  return { ...raw, agents };
}

export function ownerMap(roster) {
  const map = new Map();
  for (const a of roster.agents) {
    for (const n of a.backlog_owner_names) map.set(n.trim().toLowerCase(), a.handle);
  }
  return map;
}

// ---------- backlog ----------

const BL_RE = /\bBL-\d{3}\b/g;

/** Parse docs/BACKLOG.md into task records. Unknown fields are left undefined. */
export function parseBacklog(text) {
  const lines = text.split("\n");
  const tasks = [];
  let cur = null;
  let section = "";
  const flush = (end) => {
    if (cur) {
      cur.block = lines.slice(cur.start, end).join("\n").trimEnd();
      tasks.push(cur);
    }
    cur = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^## /.test(line)) {
      flush(i);
      section = line.replace(/^## /, "").trim();
      continue;
    }
    const h = line.match(/^#### (BL-\d{3})\s+(.*)$/);
    if (h) {
      flush(i);
      cur = { id: h[1], title: h[2].trim(), section, start: i, line: i + 1 };
      continue;
    }
    if (cur && /^- Status:/.test(line)) parseStatusLine(cur, line);
  }
  flush(lines.length);
  return tasks;
}

function parseStatusLine(task, line) {
  const body = line.replace(/^- /, "");
  const status = body.match(/Status:\s*(.+?)\.\s+(?:Mode:|Owner:|Milestone:|Depends on:|Size:|$)/);
  task.statusText = status ? status[1].trim() : (body.match(/Status:\s*([^.]*)/)?.[1] ?? "").trim();
  task.status = task.statusText.split(/[\s(]/)[0].toLowerCase();
  const mode = body.match(/Mode:\s*([a-z]+)/i);
  task.mode = mode ? mode[1].toLowerCase() : undefined;
  const owner = body.match(/Owner:\s*([^.]+)\./);
  task.owners = owner ? owner[1].split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : [];
  const dep = body.match(/Depends on:\s*([^.]+)\./);
  task.dependsOn = dep ? [...dep[1].matchAll(BL_RE)].map((m) => m[0]) : [];
  const paren = task.statusText.match(/\(([^)]*)\)/);
  task.blockers = task.status === "blocked" && paren ? parseBlockers(paren[1]) : [];
}

/** Blockers count only when the parenthetical is nothing but backlog ids. */
function parseBlockers(text) {
  const ids = [...text.matchAll(BL_RE)].map((m) => m[0]);
  const rest = text.replace(BL_RE, "").replace(/[\s,;&]|and/g, "");
  return ids.length && rest === "" ? ids : null; // null = blocked on something else
}

export function primaryOwner(task, owners) {
  for (const o of task.owners ?? []) if (owners.has(o)) return owners.get(o);
  return undefined;
}

/**
 * Is this task one an agent may start now? `byId` maps id to task.
 * Returns { ok, reason }.
 */
export function eligibility(task, byId) {
  if (task.mode !== "agent") return { ok: false, reason: `mode ${task.mode ?? "unknown"}` };
  const done = (id) => byId.get(id)?.status === "done";
  if (task.status === "blocked") {
    if (!task.blockers) return { ok: false, reason: "blocked on a non-backlog item" };
    const open = task.blockers.filter((id) => !done(id));
    if (open.length) return { ok: false, reason: `blocked by ${open.join(", ")}` };
  } else if (task.status !== "ready") {
    return { ok: false, reason: `status ${task.status}` };
  }
  const deps = task.dependsOn.filter((id) => !done(id));
  if (deps.length) return { ok: false, reason: `depends on ${deps.join(", ")}` };
  return { ok: true };
}

/** Backlog ids already being worked on, from open PR branches and titles. */
export function takenIds(openPRs) {
  const taken = new Set();
  for (const pr of openPRs) {
    for (const s of [pr.head?.ref ?? "", pr.title ?? ""]) {
      for (const m of s.matchAll(/bl-(\d{3})/gi)) taken.add(`BL-${m[1]}`);
    }
  }
  return taken;
}

export function queueFor(handle, tasks, owners, taken, claimed = new Set()) {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return tasks.filter(
    (t) =>
      primaryOwner(t, owners) === handle &&
      !taken.has(t.id) &&
      !claimed.has(t.id) &&
      eligibility(t, byId).ok,
  );
}

// ---------- board state (hidden JSON in the board issue body) ----------

const STATE_RE = /<!-- agents-state:([A-Za-z0-9+/=]+) -->/;

export function readState(body) {
  const m = (body ?? "").match(STATE_RE);
  if (!m) return {};
  try {
    return JSON.parse(Buffer.from(m[1], "base64").toString("utf8"));
  } catch {
    return {};
  }
}

export function writeState(state) {
  return `<!-- agents-state:${Buffer.from(JSON.stringify(state)).toString("base64")} -->`;
}

// ---------- GitHub via the gh CLI (REST only) ----------

export function repoSlug(roster) {
  return process.env.GITHUB_REPOSITORY || roster.repo;
}

export function gh(path, { method = "GET", body, allowFail = false } = {}) {
  const args = ["api", "-X", method, "-H", "Accept: application/vnd.github+json", path];
  if (body !== undefined) args.push("--input", "-");
  try {
    const out = execFileSync("gh", args, {
      input: body === undefined ? undefined : JSON.stringify(body),
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim() ? JSON.parse(out) : null;
  } catch (err) {
    if (allowFail) return null;
    const msg = (err.stderr || err.message || "").toString().trim();
    throw new Error(`gh ${method} ${path} failed: ${msg}`);
  }
}

/** GET every page of a list endpoint (max 1,000 items). */
export function ghAll(path, { allowFail = false } = {}) {
  const out = [];
  const sep = path.includes("?") ? "&" : "?";
  for (let page = 1; page <= 10; page++) {
    const res = gh(`${path}${sep}per_page=100&page=${page}`, { allowFail });
    if (!res) break;
    const items = Array.isArray(res) ? res : res.items ?? res.workflow_runs ?? res.jobs ?? [];
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
}

export function labelNames(item) {
  return (item.labels ?? []).map((l) => (typeof l === "string" ? l : l.name));
}

export function agentOfPR(pr) {
  const label = labelNames(pr).find((n) => n.startsWith("agent:"));
  return label ? label.slice("agent:".length) : undefined;
}

export function journalTitle(agent) {
  return `Agent journal: ${agent.title} (${agent.handle})`;
}

export function readText(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

export function todayUTC(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function isFounderComment(c, roster) {
  return c?.user?.login === roster.founder || c?.author_association === "OWNER";
}

/**
 * A standing duty is worth a new run only if something it reads has changed:
 * the integration branch moved, or the founder wrote to the agent since.
 */
export function standingChanged(prev, developSha, founderNoteCount) {
  if (!prev?.develop) return true;
  return prev.develop !== developSha || founderNoteCount > 0;
}

// ---------- trust: whose text counts as an agent or founder message ----------
//
// The repository is public. Anyone can comment, so a marker such as
// `<!-- red-team:<sha> -->` or `<!-- handoff ... -->` counts only when a
// trusted identity wrote it: the founder, the agents GitHub App (matched by
// its client id, or by its bot login), or a bot named in roster.trusted_bots.
// Everything else is information, never an instruction or a verdict.

export function trustContext(roster, env = process.env) {
  const bots = new Set(roster.trusted_bots ?? ["claude[bot]"]);
  for (const b of String(env.AGENTS_BOT_LOGINS ?? "").split(",")) if (b.trim()) bots.add(b.trim());
  return { founder: roster.founder, appClientId: String(env.AGENTS_APP_CLIENT_ID ?? ""), bots };
}

export function isTrusted(c, trust) {
  const login = c?.user?.login ?? "";
  if (!login) return false;
  if (login === trust.founder || c.author_association === "OWNER") return true;
  if (c.user.type !== "Bot") return false;
  const app = c.performed_via_github_app;
  if (trust.appClientId && app?.client_id && String(app.client_id) === trust.appClientId) return true;
  return trust.bots.has(login);
}

// ---------- handoffs: how agents talk to each other ----------
//
// A handoff is an issue labelled `handoff`, `from:<handle>` and one
// `to:<handle>` label per recipient. Its body starts with
//   <!-- handoff from:<handle> to:<h1>,<h2> kind:<question|request|rfc|fyi> -->
// A recipient answers with a comment that starts with
//   <!-- handoff-reply from:<handle> status:<answered|done|declined|blocked> -->
// Spec: docs/agents/AGENT-COMMS.md.

export const HANDOFF_KINDS = ["question", "request", "rfc", "fyi"];
export const REPLY_STATUSES = ["answered", "done", "declined", "blocked"];

const HANDOFF_RE = /<!--\s*handoff\s+from:([a-z0-9-]+)\s+to:([a-z0-9,-]+)\s+kind:([a-z]+)\s*-->/;
const REPLY_RE = /<!--\s*handoff-reply\s+from:([a-z0-9-]+)\s+status:([a-z]+)\s*-->/;

export function parseHandoff(body) {
  const m = (body ?? "").match(HANDOFF_RE);
  if (!m) return undefined;
  return { from: m[1], to: m[2].split(",").filter(Boolean), kind: m[3] };
}

export function parseReply(body) {
  const m = (body ?? "").match(REPLY_RE);
  return m ? { from: m[1], status: m[2] } : undefined;
}

/** Recipients of a handoff issue, from its labels, falling back to the marker. */
export function handoffTargets(issue) {
  const fromLabels = labelNames(issue).filter((n) => n.startsWith("to:")).map((n) => n.slice(3));
  return fromLabels.length ? fromLabels : parseHandoff(issue.body)?.to ?? [];
}

/**
 * Which recipients still owe a reply. A recipient owes one until it posts a
 * trusted reply newer than the latest trusted non-reply message (the issue
 * itself, or a follow-up from the sender or the founder). Untrusted comments
 * never reopen or close anything.
 */
export function pendingTargets(issue, comments, trust) {
  const targets = handoffTargets(issue);
  const trusted = comments.filter((c) => isTrusted(c, trust));
  const pending = [];
  for (const t of targets) {
    let lastOther = new Date(issue.created_at);
    let lastReply;
    for (const c of trusted) {
      const at = new Date(c.created_at);
      const r = parseReply(c.body);
      if (r && r.from === t) lastReply = { at, status: r.status };
      else if (!r) lastOther = at > lastOther ? at : lastOther; // other recipients' replies do not reopen yours
    }
    if (!lastReply || lastReply.at < lastOther) pending.push(t);
  }
  return pending;
}

/** A handoff can be closed once every recipient has replied and the last reply is `minAgeMs` old. */
export function handoffSettled(issue, comments, trust, now = new Date(), minAgeMs = 48 * 3600_000) {
  if (!isTrusted(issue, trust)) return false;
  if (pendingTargets(issue, comments, trust).length) return false;
  const replies = comments.filter((c) => isTrusted(c, trust) && parseReply(c.body));
  const statuses = replies.map((c) => parseReply(c.body).status);
  if (statuses.includes("blocked")) return false;
  const last = replies.at(-1);
  return !!last && now - new Date(last.created_at) >= minAgeMs;
}

// ---------- steward reviews ----------

/** Minimal glob: `**` any path, `*` any run inside one segment, `?` one character. */
export function globToRegExp(glob) {
  let re = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === "*" && glob[i + 1] === "*") {
      re += glob[i + 2] === "/" ? "(?:.*/)?" : ".*";
      i += glob[i + 2] === "/" ? 2 : 1;
    } else if (ch === "*") re += "[^/]*";
    else if (ch === "?") re += "[^/]";
    else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${re}$`);
}

export function matchingPaths(files, globs) {
  const res = (globs ?? []).map(globToRegExp);
  return files.filter((f) => res.some((r) => r.test(f)));
}

export function stewardMarker(handle, sha) {
  return `<!-- steward:${handle}:${sha} -->`;
}

/** The trusted steward verdict for this head commit, or undefined. */
export function stewardVerdict(comments, handle, sha, trust) {
  const c = comments.find((x) => isTrusted(x, trust) && (x.body ?? "").includes(stewardMarker(handle, sha)));
  if (!c) return undefined;
  return (c.body.match(/Verdict:\s*([a-z ]+)/i)?.[1] ?? "").trim().toLowerCase() || "posted";
}
