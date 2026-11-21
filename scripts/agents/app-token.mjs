// Agent GitHub token: the agents GitHub App's installation token when the App
// is configured, otherwise the caller's own token with a clear warning.
// Spec: docs/agents/GITHUB_APP.md (H1, IMP-06).
//
//   node scripts/agents/app-token.mjs --lane worker              # prints a token on stdout
//   node scripts/agents/app-token.mjs --lane worker --dry-run    # prints the plan, no network
//   node scripts/agents/app-token.mjs --lane reader --require-app
//   node scripts/agents/app-token.mjs --lane worker --github-env # Actions: mask it, write GH_TOKEN to $GITHUB_ENV
//
// Reads AGENTS_APP_CLIENT_ID or AGENTS_APP_ID (the JWT issuer; GitHub
// recommends the client id), AGENTS_APP_PRIVATE_KEY (PEM text) or
// --key-file, and GITHUB_REPOSITORY or --repo. Falls back to GH_TOKEN, then
// GITHUB_TOKEN. Never prints the key; prints the token only on stdout.
// Exit codes: 0 token printed (or dry run), 1 App required but unavailable,
// 2 bad arguments, 3 no token at all.
import { createSign } from "node:crypto";
import { readFileSync, appendFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Least privilege per lane. Each token is narrowed to one lane's permissions
// and to this repository only. The App itself is granted the union
// (APP_PERMISSIONS), which the manifest in GITHUB_APP.md must equal.
export const LANES = Object.freeze({
  // The dispatcher: reads PRs, checks and runs; writes the board issue and labels.
  dispatch: { contents: "read", issues: "write", pull_requests: "read", checks: "read", actions: "read", metadata: "read" },
  // An agent run that writes code: pushes a branch, opens its PR, writes its journal.
  worker: { contents: "write", issues: "write", pull_requests: "write", checks: "read", actions: "read", metadata: "read" },
  // A red-team or steward review: reads the code, posts a review and a journal entry. No pushes.
  reviewer: { contents: "read", issues: "write", pull_requests: "write", checks: "read", metadata: "read" },
  // Status pages, smoke checks, the ledger: read only.
  reader: { contents: "read", issues: "read", pull_requests: "read", checks: "read", actions: "read", metadata: "read" },
});

// Never granted to the App: these would let an agent change its own guards,
// settings, secrets or deployments.
export const FORBIDDEN = Object.freeze([
  "administration", "workflows", "secrets", "environments", "deployments", "actions_variables",
  "repository_hooks", "members", "organization_administration", "organization_secrets", "pages",
]);

const RANK = { read: 1, write: 2 };

export function unionPermissions(lanes = LANES) {
  const out = {};
  for (const perms of Object.values(lanes)) {
    for (const [k, v] of Object.entries(perms)) if (!out[k] || RANK[v] > RANK[out[k]]) out[k] = v;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

export const APP_PERMISSIONS = Object.freeze(unionPermissions());

/** The App settings from the environment, or undefined when it is not configured. */
export function appConfig(env = process.env, keyText) {
  const iss = String(env.AGENTS_APP_CLIENT_ID || env.AGENTS_APP_ID || "").trim();
  const raw = keyText ?? env.AGENTS_APP_PRIVATE_KEY ?? "";
  // Keys pasted into one-line variables often carry literal "\n".
  const privateKey = String(raw).includes("\\n") ? String(raw).replace(/\\n/g, "\n") : String(raw);
  if (!iss || !privateKey.trim()) return undefined;
  return { iss, privateKey };
}

const b64url = (v) => Buffer.from(typeof v === "string" ? v : JSON.stringify(v)).toString("base64url");

/** An RS256 app JWT: issued 60 s in the past for clock drift, valid 9 minutes (GitHub allows at most 10). */
export function makeJwt({ iss, privateKey, now = Date.now() }) {
  const t = Math.floor(now / 1000);
  const head = b64url({ alg: "RS256", typ: "JWT" });
  const body = b64url({ iat: t - 60, exp: t + 540, iss });
  const sig = createSign("RSA-SHA256").update(`${head}.${body}`).sign(privateKey).toString("base64url");
  return `${head}.${body}.${sig}`;
}

function lanePermissions(lane) {
  const perms = LANES[lane];
  if (!perms) throw new Error(`unknown lane "${lane}"; use one of ${Object.keys(LANES).join(", ")}`);
  return perms;
}

/**
 * Mint an installation token for one lane, limited to this repository.
 * `fetchImpl` is injected so tests never touch the network.
 */
export async function installationToken({ iss, privateKey, repo, lane, fetchImpl = globalThis.fetch, apiUrl = "https://api.github.com", now }) {
  const permissions = lanePermissions(lane);
  const [owner, name] = String(repo ?? "").split("/");
  if (!owner || !name) throw new Error(`repository must be owner/name, got "${repo ?? ""}"`);
  const jwt = makeJwt({ iss, privateKey, now });
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${jwt}`, "User-Agent": "early-letters-agents" };
  const inst = await fetchImpl(`${apiUrl}/repos/${owner}/${name}/installation`, { method: "GET", headers });
  if (!inst.ok) throw new Error(`the agents App is not installed on ${repo} or the key is wrong (GET installation: HTTP ${inst.status})`);
  const { id } = await inst.json();
  const res = await fetchImpl(`${apiUrl}/app/installations/${id}/access_tokens`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ repositories: [name], permissions }),
  });
  if (!res.ok) throw new Error(`could not create an installation token for lane ${lane} (HTTP ${res.status})`);
  const out = await res.json();
  if (!out?.token) throw new Error("GitHub returned no token");
  return { token: out.token, expiresAt: out.expires_at, permissions: out.permissions ?? permissions };
}

export const FALLBACK_WARNING =
  "warning: the agents GitHub App is not in use, so this run posts as whoever owns the fallback token (today the founder's account). " +
  "The harness labels those posts \"unverified author\" and never treats them as founder instructions. " +
  "Set AGENTS_APP_CLIENT_ID (or AGENTS_APP_ID) and AGENTS_APP_PRIVATE_KEY to post as the App (docs/agents/GITHUB_APP.md).";

/**
 * Decide and fetch the token. Returns
 *   { source: "app" | "fallback" | "none" | "dry-run", token?, lane, permissions, warnings[] }
 * In dry-run nothing is fetched and no token is returned.
 */
export async function resolveToken({ env = process.env, repo, lane = "worker", keyText, dryRun = false, requireApp = false, fetchImpl, apiUrl, now } = {}) {
  const permissions = lanePermissions(lane);
  const warnings = [];
  const app = appConfig(env, keyText);
  const fallbackName = env.GH_TOKEN ? "GH_TOKEN" : env.GITHUB_TOKEN ? "GITHUB_TOKEN" : "";

  if (dryRun) {
    const plan = app ? `App installation token for lane ${lane} on ${repo || "(repository unknown)"}` : fallbackName ? `fallback to ${fallbackName}` : "no token";
    if (!app) warnings.push(FALLBACK_WARNING);
    return { source: "dry-run", plan, lane, permissions, warnings };
  }

  if (app) {
    try {
      const t = await installationToken({ ...app, repo, lane, fetchImpl, apiUrl, now });
      return { source: "app", token: t.token, expiresAt: t.expiresAt, lane, permissions: t.permissions, warnings };
    } catch (err) {
      // Never echo the key; the error messages above carry only status codes.
      warnings.push(`warning: the agents App is configured but its token failed: ${err.message}`);
      if (requireApp) return { source: "none", lane, permissions, warnings };
    }
  } else if (requireApp) {
    warnings.push("error: --require-app was given but the agents App is not configured (AGENTS_APP_CLIENT_ID or AGENTS_APP_ID, and AGENTS_APP_PRIVATE_KEY).");
    return { source: "none", lane, permissions, warnings };
  }

  if (fallbackName) {
    warnings.push(FALLBACK_WARNING);
    return { source: "fallback", token: env[fallbackName], fallbackName, lane, permissions, warnings };
  }
  warnings.push("warning: no agents App and no GH_TOKEN or GITHUB_TOKEN; gh will use its own stored login, which is not an agent identity.");
  return { source: "none", lane, permissions, warnings };
}

// ---------- CLI ----------

function parseArgs(argv) {
  const o = { lane: "worker", dryRun: false, requireApp: false, githubEnv: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--lane") o.lane = argv[++i];
    else if (a === "--repo") o.repo = argv[++i];
    else if (a === "--key-file") o.keyFile = argv[++i];
    else if (a === "--dry-run") o.dryRun = true;
    else if (a === "--require-app") o.requireApp = true;
    else if (a === "--github-env") o.githubEnv = true;
    else throw new Error(`unknown argument ${a}`);
  }
  return o;
}

async function main() {
  let o;
  try {
    o = parseArgs(process.argv.slice(2));
    lanePermissions(o.lane);
  } catch (err) {
    console.error(err.message);
    process.exit(2);
  }
  const repo = o.repo || process.env.GITHUB_REPOSITORY || "thesaurabhpareek/earlyletters";
  const keyText = o.keyFile ? readFileSync(o.keyFile, "utf8") : undefined;
  const r = await resolveToken({ env: process.env, repo, lane: o.lane, keyText, dryRun: o.dryRun, requireApp: o.requireApp });
  for (const w of r.warnings) console.error(w);
  if (r.source === "dry-run") {
    console.log(JSON.stringify({ plan: r.plan, lane: r.lane, permissions: r.permissions }, null, 2));
    return;
  }
  if (!r.token) process.exit(o.requireApp ? 1 : 3);
  console.error(`agent token: ${r.source === "app" ? `agents App, lane ${r.lane}, expires ${r.expiresAt ?? "in 1 hour"}` : `fallback ${r.fallbackName}`}`);
  if (o.githubEnv && process.env.GITHUB_ENV) {
    console.log(`::add-mask::${r.token}`);
    appendFileSync(process.env.GITHUB_ENV, `GH_TOKEN=${r.token}\nAGENT_TOKEN_SOURCE=${r.source}\n`);
    return;
  }
  process.stdout.write(`${r.token}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
