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

const BRANCH_RE = /^agent\/([a-z0-9][a-z0-9-]*)\//i;

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
  const labels = labelHandles(pr);
  const branch = branchHandle(pr);
  const bot = botAuthor(pr, appLogins);
  if (labels.length > 1) return { status: "conflict", reasons: [`more than one agent:* label (${labels.join(", ")})`] };
  if (labels.length === 1) {
    if (branch && branch !== labels[0]) return { status: "conflict", reasons: [`label agent:${labels[0]} but branch handle is '${branch}'`] };
    return { status: "agent", agent: labels[0], reasons: [] };
  }
  const why = [branch && `branch prefix agent/${branch}/`, bot && "bot author"].filter(Boolean);
  return why.length ? { status: "unlabelled", agent: branch, reasons: [`${why.join(" and ")} but no agent:* label`] } : { status: "none", reasons: [] };
}

/** For counting: a PR is agent-like if label OR branch prefix OR bot author says so. */
export function isAgentLike(pr, opts) {
  return identityOf(pr, opts).status !== "none";
}
