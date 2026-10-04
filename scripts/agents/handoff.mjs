#!/usr/bin/env node
// Agent-to-agent messages. Agents use this instead of hand-writing markers,
// so every handoff and reply has the labels and first line the dispatcher
// reads. Spec: docs/agents/AGENT-COMMS.md.
//
//   node scripts/agents/handoff.mjs open --from data-steward --to privacy,legal \
//        --kind request --title "Retention for invite hashes" --body-file /tmp/h.md
//   node scripts/agents/handoff.mjs reply --issue 123 --from privacy \
//        --status done --body-file /tmp/r.md
//   node scripts/agents/handoff.mjs list --agent privacy
import { readFileSync } from "node:fs";
import {
  loadRoster, repoSlug, gh, ghAll, trustContext, isTrusted, pendingTargets,
  HANDOFF_KINDS, REPLY_STATUSES,
} from "./lib.mjs";

/** Build the issue for a new handoff. Pure, so it is tested. */
export function buildHandoff({ from, to, kind, title, body }, handles) {
  const errors = [];
  if (!handles.has(from)) errors.push(`unknown sender "${from}"`);
  if (!to.length) errors.push("at least one recipient is required (--to)");
  for (const t of to) if (!handles.has(t)) errors.push(`unknown recipient "${t}"`);
  if (to.includes(from)) errors.push("an agent cannot hand off to itself");
  if (!HANDOFF_KINDS.includes(kind)) errors.push(`kind must be one of ${HANDOFF_KINDS.join(", ")}`);
  if (!title?.trim()) errors.push("a title is required");
  if (!body?.trim()) errors.push("a body is required: context, the ask, and what done looks like");
  if (errors.length) return { errors };
  const labels = ["handoff", `from:${from}`, ...to.map((t) => `to:${t}`)];
  if (kind === "rfc") labels.push("rfc");
  return {
    errors,
    issue: {
      title: `[handoff] ${from} to ${to.join(", ")}: ${title.trim()}`.slice(0, 250),
      body: `<!-- handoff from:${from} to:${to.join(",")} kind:${kind} -->\n${body.trim()}\n`,
      labels,
    },
  };
}

/** Build a reply comment. Pure, so it is tested. */
export function buildReply({ from, status, body }, handles) {
  const errors = [];
  if (!handles.has(from)) errors.push(`unknown sender "${from}"`);
  if (!REPLY_STATUSES.includes(status)) errors.push(`status must be one of ${REPLY_STATUSES.join(", ")}`);
  if (!body?.trim()) errors.push("a body is required");
  return errors.length ? { errors } : { errors, body: `<!-- handoff-reply from:${from} status:${status} -->\n${body.trim()}\n` };
}

function main() {
  const [cmd, ...argv] = process.argv.slice(2);
  const opt = (n, d = "") => {
    const i = argv.indexOf(`--${n}`);
    return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d;
  };
  const roster = loadRoster();
  const repo = repoSlug(roster);
  const handles = new Set(roster.agents.map((a) => a.handle));
  const fail = (errs) => {
    for (const e of errs) console.error(`error: ${e}`);
    process.exit(1);
  };
  const bodyText = () => (opt("body-file") ? readFileSync(opt("body-file"), "utf8") : opt("body"));

  if (cmd === "open") {
    const to = opt("to").split(",").map((s) => s.trim()).filter(Boolean);
    const { errors, issue } = buildHandoff({ from: opt("from"), to, kind: opt("kind", "request"), title: opt("title"), body: bodyText() }, handles);
    if (errors.length) fail(errors);
    const created = gh(`/repos/${repo}/issues`, { method: "POST", body: issue });
    console.log(`opened handoff #${created.number}: ${created.html_url}`);
  } else if (cmd === "reply") {
    const num = opt("issue").replace(/^#/, "");
    if (!/^\d+$/.test(num)) fail(["--issue <number> is required"]);
    const { errors, body } = buildReply({ from: opt("from"), status: opt("status"), body: bodyText() }, handles);
    if (errors.length) fail(errors);
    const c = gh(`/repos/${repo}/issues/${num}/comments`, { method: "POST", body: { body } });
    console.log(`replied on #${num}: ${c.html_url}`);
  } else if (cmd === "list") {
    const who = opt("agent");
    const trust = trustContext(roster, process.env);
    const open = ghAll(`/repos/${repo}/issues?state=open&labels=handoff`).filter((i) => !i.pull_request && isTrusted(i, trust));
    for (const i of open) {
      const pending = pendingTargets(i, ghAll(`/repos/${repo}/issues/${i.number}/comments`), trust);
      if (who && !pending.includes(who) && !i.labels.some((l) => l.name === `from:${who}`)) continue;
      console.log(`#${i.number}\t${pending.length ? `waiting on ${pending.join(",")}` : "all replied"}\t${i.title}`);
    }
  } else {
    fail(["usage: handoff.mjs open|reply|list (see the header of this file)"]);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
