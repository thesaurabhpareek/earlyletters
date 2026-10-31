// Who is an agent PR? Shared by lib.mjs, pathguard.mjs and guard-open-prs.mjs.
// No imports, so every script can load it on its own.
//
// Three signals, none of which is enough alone to be TRUSTED as an agent:
//   label   `agent:<handle>`  (anyone with triage permission can set it)
//   branch  `agent/<handle>/...` (anyone who can push, or any fork author, can name one)
//   author  a Bot account (login ends in `[bot]`, or is the agents App login)
// Routing still uses the label only (lib.agentOfPR), because a drive-by PR must never
// be treated as an agent PR. The guards use all three and FAIL CLOSED when they
// disagree or when branch or author says "agent" but the label is missing.

const BRANCH_RE = /^agent\/([a-z0-9][a-z0-9-]*)\/[^/\s].*$/i;
const AGENT_PREFIX_RE = /^agent\//i;

const labelName = (l) => (typeof l === "string" ? l : l?.name);

/** Handles named by `agent:*` labels (lower case, unique). */
export function labelHandles(pr) {
  const names = (pr?.labels ?? []).map(labelName).filter((n) => typeof n === "string").map((n) => n.trim());
  return [...new Set(names.filter((n) => /^agent:/i.test(n)).map((n) => n.slice("agent:".length).toLowerCase()))];
}

/** Handle from a head branch of the form `agent/<handle>/<topic>`, or undefined. */
export function branchHandle(pr) {
  const ref = pr?.head?.ref ?? "";
  const m = BRANCH_RE.exec(String(ref).normalize("NFKC"));
  return m ? m[1].toLowerCase() : undefined;
}

/** True when the author is a bot account, or the agents App login. */
export function botAuthor(pr, appLogins = []) {
  const login = String(pr?.user?.login ?? "").toLowerCase();
  if (!login) return false;
  return /\[bot\]$/.test(login) || pr?.user?.type === "Bot" || appLogins.some((a) => String(a).toLowerCase() === login);
}

/**
 * @returns {{status: "none"|"agent"|"unlabelled"|"conflict", agent?: string, reasons: string[]}}
 *   none       no signal: not an agent PR
 *   agent      one label, and no other signal disagrees
 *   unlabelled branch or author says agent but there is no label: fail closed
 *   conflict   two labels, or label and branch handle disagree: fail closed
 */
export function identityOf(pr, { appLogins = [] } = {}) {
  const ref = String(pr?.head?.ref ?? "").normalize("NFKC");
  // A head branch that starts with agent/ but is not agent/<handle>/<topic> is never trusted, label or no label.
  if (AGENT_PREFIX_RE.test(ref) && !BRANCH_RE.test(ref)) return { status: "conflict", reasons: [`branch '${ref}' starts with agent/ but is not agent/<handle>/<topic>`] };
  const labels = labelHandles(pr);
  const branch = branchHandle(pr);
  const bot = botAuthor(pr, appLogins);
  if (labels.length > 1) return { status: "conflict", reasons: [`more than one agent:* label (${labels.join(", ")})`] };
  if (labels.length === 1) {
    if (branch && branch !== labels[0]) return { status: "conflict", reasons: [`label agent:${labels[0]} but branch handle is '${branch}'`] };
    // A bot-authored PR cannot launder a label: its branch must be agent/<same handle>/<topic>.
    if (bot && !branch) return { status: "conflict", reasons: [`bot author with label agent:${labels[0]} but the branch is not agent/${labels[0]}/<topic> (a bot-authored agent PR needs both)`] };
    return { status: "agent", agent: labels[0], reasons: [] };
  }
  const why = [branch && `branch prefix agent/${branch}/`, bot && "bot author"].filter(Boolean);
  return why.length ? { status: "unlabelled", agent: branch, reasons: [`${why.join(" and ")} but no agent:* label`] } : { status: "none", reasons: [] };
}

/**
 * For counting against the open-PR cap. A PR counts if it carries an `agent:*` label, OR if branch
 * or bot signal says "agent" AND the author is one of the trusted logins (AGENTS_BOT_LOGINS).
 * A stranger with an `agent/...` branch and Dependabot never count: counting them lets anyone fill
 * the cap and stop the team (a denial of service). Routing and the guards are unchanged.
 */
export function isAgentLike(pr, opts = {}) {
  if (labelHandles(pr).length > 0) return true;
  if (identityOf(pr, opts).status === "none") return false;
  const login = String(pr?.user?.login ?? "").toLowerCase();
  return Boolean(login) && (opts.appLogins ?? []).some((a) => String(a).toLowerCase() === login);
}
