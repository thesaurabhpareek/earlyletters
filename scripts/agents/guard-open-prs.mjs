// Pre-step helper (hole: agent PR flood). Counts open PRs labelled `agent:*` and
// fails when the count is at or above --max. REST only (no GraphQL), paginated,
// and fails closed: an API error, a bad response or hitting the page cap all exit non-zero.
//
//   GH_TOKEN=... node scripts/agents/guard-open-prs.mjs --max 15 --repo owner/name
//
// Exit codes: 0 under the max, 1 at or above the max, 2 cannot decide (fail closed).
// The HTTP layer is injectable: `countAgentPrs({ repo, getPage })`, where
// getPage(url) resolves to { status, json }.
import { fileURLToPath } from "node:url";
import path from "node:path";
import { isMain } from "./main-check.mjs";
import { isAgentLike } from "./identity.mjs";

export const PER_PAGE = 100;
/** 20 pages x 100 = 2000 open PRs. Reaching the cap means we cannot know the count: fail closed. */
export const MAX_PAGES = 20;

/** Default cap. 15 matches the stop gate in the OpenCode lane proposal; the dispatcher's own
 *  roster cap (max_open_agent_prs) is 10 and stops new work earlier. This is the backstop. */
export const DEFAULT_MAX = 15;

export class GuardError extends Error {}

/** True when a PR carries a label whose name starts with `agent:` (case-insensitive). */
export function isAgentPr(pr) {
  return Array.isArray(pr?.labels) && pr.labels.some((l) => typeof l?.name === "string" && l.name.toLowerCase().startsWith("agent:"));
}

/** Count open agent PRs. Throws GuardError if the answer is not trustworthy. */
export async function countAgentPrs({ repo, getPage, maxPages = MAX_PAGES, appLogins = [] }) {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo ?? "")) throw new GuardError(`invalid --repo ${JSON.stringify(repo)} (want owner/name)`);
  let count = 0;
  let seen = 0;
  for (let page = 1; page <= maxPages; page++) {
    const url = `/repos/${repo}/pulls?state=open&per_page=${PER_PAGE}&page=${page}`;
    let res;
    try { res = await getPage(url); } catch (e) { throw new GuardError(`request failed for ${url}: ${e.message}`); }
    if (!res || res.status !== 200) throw new GuardError(`GitHub returned HTTP ${res?.status} for ${url}`);
    if (!Array.isArray(res.json)) throw new GuardError(`unexpected response shape for ${url} (not an array)`);
    for (const pr of res.json) { seen++; if (isAgentPr(pr) || isAgentLike(pr, { appLogins })) count++; } // a label, or a branch/bot signal from a trusted login (AGENTS_BOT_LOGINS)
    if (res.json.length < PER_PAGE) return { count, seen, pages: page };
  }
  throw new GuardError(`pagination cap hit (${maxPages} pages of ${PER_PAGE}); cannot count open PRs, failing closed`);
}

/** Real HTTP layer for the CLI. */
export function httpGetPage(token, base = "https://api.github.com", fetchImpl = globalThis.fetch) {
  return async (url) => {
    const res = await fetchImpl(base + url, {
      headers: { accept: "application/vnd.github+json", "x-github-api-version": "2022-11-28", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    });
    let json = null;
    try { json = await res.json(); } catch { /* leave null: caller fails closed */ }
    return { status: res.status, json };
  };
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) throw new GuardError(`unexpected argument ${argv[i]}`);
    const v = argv[++i];
    if (v === undefined) throw new GuardError(`${argv[i - 1]} needs a value`);
    a[argv[i - 1].slice(2)] = v;
  }
  return a;
}

/** CLI. `getPage` is injectable for tests. */
export async function main(argv = process.argv.slice(2), { out = console, env = process.env, getPage } = {}) {
  try {
    const args = parseArgs(argv);
    const max = Number(args.max ?? DEFAULT_MAX);
    if (!Number.isInteger(max) || max < 1) throw new GuardError(`--max must be a positive integer, got ${JSON.stringify(args.max)}`);
    const repo = args.repo ?? env.GITHUB_REPOSITORY;
    const get = getPage ?? httpGetPage(env.GH_TOKEN || env.GITHUB_TOKEN);
    const { count, pages } = await countAgentPrs({ repo, getPage: get, appLogins: String(env.AGENTS_BOT_LOGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean) });
    if (count >= max) {
      out.error(`guard-open-prs: ${count} open agent:* PRs in ${repo}, at or above the limit of ${max}. Not starting another agent run. Merge or close some, then re-run.`);
      return 1;
    }
    out.log(`guard-open-prs: ${count} open agent:* PRs in ${repo} (limit ${max}, ${pages} page(s) read). OK.`);
    return 0;
  } catch (e) {
    out.error(`guard-open-prs: cannot decide, failing closed: ${e.message}`);
    return 2;
  }
}

let runAsMain;
try { runAsMain = isMain(import.meta.url); } catch (e) { console.error(`guard-open-prs: cannot tell whether this is the entry point, failing closed: ${e.message}`); process.exit(2); }
if (runAsMain) process.exit(await main());
