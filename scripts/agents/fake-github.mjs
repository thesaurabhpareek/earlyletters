// A fake GitHub REST API for offline harness tests (retro package H4, IMP-18).
//
// The harness scripts reach GitHub only through `gh api` (lib.mjs `gh`), run as
// a child process. So the fake has two parts, and needs no change to any script:
//   1. an in-process HTTP server that holds issues, comments, labels, pulls and
//      branches in memory and answers the REST paths the harness uses;
//   2. a `gh` shim, written to a temporary folder that tests put first on PATH,
//      which turns `gh api -X <method> <path> [--input -] [-F k=@file] [-f k=v]`
//      into a request to that server.
// Every request is logged. A path the fake does not know answers 404 and is
// listed in `unhandled`, so a test notices when a script starts calling
// something new. The shim refuses to run without FAKE_GH_URL, so it can never
// fall through to the real GitHub.
//
// The server runs on the test's event loop: spawn the scripts with an async
// API (`execFile` with a callback or promise), never `execFileSync`, or the
// server cannot answer and the run hangs.
import { createServer } from "node:http";
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SHIM = `
const { readFileSync } = require("node:fs");
const base = process.env.FAKE_GH_URL;
if (!base) { process.stderr.write("fake gh: FAKE_GH_URL is not set; refusing to run\\n"); process.exit(70); }
const args = process.argv.slice(2);
if (args[0] !== "api") { process.stderr.write("fake gh: only 'gh api' is supported, got " + args[0] + "\\n"); process.exit(64); }
let method, path, input = false; const fields = {};
for (let i = 1; i < args.length; i++) {
  const a = args[i];
  if (a === "-X" || a === "--method") method = args[++i];
  else if (a === "-H" || a === "--header") i++;
  else if (a === "--input") { if (args[++i] !== "-") { process.stderr.write("fake gh: --input supports only -\\n"); process.exit(64); } input = true; }
  else if (a === "-F" || a === "--field" || a === "-f" || a === "--raw-field") {
    const kv = args[++i]; const eq = kv.indexOf("=");
    const k = kv.slice(0, eq); let v = kv.slice(eq + 1);
    if ((a === "-F" || a === "--field") && v.startsWith("@")) v = readFileSync(v.slice(1), "utf8");
    fields[k] = v;
  } else if (a.startsWith("-")) { process.stderr.write("fake gh: unsupported flag " + a + "\\n"); process.exit(64); }
  else if (path === undefined) path = a;
  else { process.stderr.write("fake gh: unexpected argument " + a + "\\n"); process.exit(64); }
}
let body;
if (input) body = readFileSync(0, "utf8");
else if (Object.keys(fields).length) body = JSON.stringify(fields);
method = method || (body !== undefined ? "POST" : "GET");
const url = base + (path.startsWith("/") ? path : "/" + path);
const headers = { "content-type": "application/json", "x-fake-login": process.env.FAKE_GH_LOGIN || "" };
fetch(url, { method, headers, body }).then(async (res) => {
  const text = await res.text();
  if (res.status >= 400) { process.stderr.write("gh: HTTP " + res.status + " " + text + "\\n"); process.exit(1); }
  process.stdout.write(text);
}).catch((e) => { process.stderr.write("fake gh: " + e.message + "\\n"); process.exit(1); });
`;

/**
 * createFakeGitHub({ repo, founder, developSha, contents, now })
 *   repo: "owner/name" the scripts will use (pass it as GITHUB_REPOSITORY)
 *   founder: login that plays the founder (author_association OWNER)
 *   contents: { "path/in/repo": "text" } served by the contents API
 *   now: () => Date, the clock for created_at (default: real time)
 */
export function createFakeGitHub({ repo, founder, developSha = "0".repeat(40), contents = {}, now = () => new Date() } = {}) {
  const db = {
    labels: [],
    issues: [], // issues and the board; PRs live in `pulls`
    comments: [],
    pulls: [],
    branches: { develop: developSha, main: developSha },
    contents: { ...contents },
  };
  const requests = [];
  const unhandled = [];
  let nextNumber = 1;
  let nextComment = 1000;

  const who = (login) => {
    const l = login || founder;
    return {
      user: { login: l, type: /\[bot\]$/.test(l) ? "Bot" : "User" },
      author_association: l === founder ? "OWNER" : "NONE",
    };
  };
  const label = (n) => (typeof n === "string" ? { name: n } : n);
  const htmlUrl = (n) => `https://github.invalid/${repo}/issues/${n}`;

  function addIssue({ title, body = "", labels = [], login, state = "open" }) {
    const at = now().toISOString();
    const issue = { number: nextNumber++, title, body, labels: labels.map(label), state, created_at: at, updated_at: at, ...who(login) };
    issue.html_url = htmlUrl(issue.number);
    db.issues.push(issue);
    return issue;
  }
  function addComment(issueNumber, { body, login }) {
    const at = now().toISOString();
    const c = { id: nextComment++, issue_number: issueNumber, body, created_at: at, updated_at: at, ...who(login) };
    c.html_url = `${htmlUrl(issueNumber)}#issuecomment-${c.id}`;
    db.comments.push(c);
    return c;
  }
  function page(list, q) {
    const per = Number(q.get("per_page") ?? 30);
    const p = Number(q.get("page") ?? 1);
    return list.slice((p - 1) * per, p * per);
  }
  const since = (list, q) => (q.get("since") ? list.filter((c) => c.updated_at >= q.get("since")) : list);

  function route(method, path, q, body, login) {
    const prefix = `/repos/${repo}`;
    if (path === prefix && method === "GET") return [200, { full_name: repo, default_branch: "main", private: false }];
    if (!path.startsWith(`${prefix}/`)) return undefined;
    const p = path.slice(prefix.length);
    let m;
    if (p === "/labels" && method === "GET") return [200, page(db.labels, q)];
    if (p === "/labels" && method === "POST") {
      if (db.labels.some((l) => l.name === body.name)) return [422, { message: "already_exists" }];
      db.labels.push({ name: body.name, color: body.color, description: body.description });
      return [201, db.labels.at(-1)];
    }
    if (p === "/issues" && method === "GET") {
      const want = (q.get("labels") ?? "").split(",").filter(Boolean);
      const state = q.get("state") ?? "open";
      const list = db.issues
        .filter((i) => state === "all" || i.state === state)
        .filter((i) => want.every((w) => i.labels.some((l) => l.name === w)));
      return [200, page(list, q)];
    }
    if (p === "/issues" && method === "POST") return [201, addIssue({ ...body, login })];
    if (p === "/issues/comments" && method === "GET") {
      const list = since(db.comments, q).sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id - b.id);
      return [200, page(list, q)];
    }
    if ((m = p.match(/^\/issues\/comments\/(\d+)$/))) {
      const c = db.comments.find((x) => x.id === Number(m[1]));
      if (!c) return [404, { message: "Not Found" }];
      if (method === "GET") return [200, c];
      if (method === "PATCH") {
        if (c.user.login !== (login || founder)) return [403, { message: "only the author can edit" }];
        Object.assign(c, { body: body.body, updated_at: now().toISOString() });
        return [200, c];
      }
    }
    if ((m = p.match(/^\/issues\/(\d+)$/))) {
      const issue = db.issues.find((i) => i.number === Number(m[1]));
      if (!issue) return [404, { message: "Not Found" }];
      if (method === "GET") return [200, issue];
      if (method === "PATCH") {
        for (const k of ["title", "body", "state", "state_reason"]) if (k in body) issue[k] = body[k];
        if (body.labels) issue.labels = body.labels.map(label);
        issue.updated_at = now().toISOString();
        return [200, issue];
      }
    }
    if ((m = p.match(/^\/issues\/(\d+)\/comments$/))) {
      const n = Number(m[1]);
      if (!db.issues.some((i) => i.number === n) && !db.pulls.some((x) => x.number === n)) return [404, { message: "Not Found" }];
      if (method === "GET") return [200, page(since(db.comments.filter((c) => c.issue_number === n), q), q)];
      if (method === "POST") return [201, addComment(n, { body: body.body, login })];
    }
    if (p === "/pulls" && method === "GET") {
      const state = q.get("state") ?? "open";
      return [200, page(db.pulls.filter((x) => state === "all" || x.state === state), q)];
    }
    if ((m = p.match(/^\/pulls\/(\d+)\/(files|reviews)$/)) && method === "GET") return [200, page([], q)];
    if ((m = p.match(/^\/branches\/(.+)$/)) && method === "GET") {
      const sha = db.branches[decodeURIComponent(m[1])];
      return sha ? [200, { name: m[1], commit: { sha } }] : [404, { message: "Branch not found" }];
    }
    if ((m = p.match(/^\/contents\/(.+)$/)) && method === "GET") {
      const text = db.contents[decodeURIComponent(m[1])];
      return text === undefined ? [404, { message: "Not Found" }] : [200, { encoding: "base64", content: Buffer.from(text).toString("base64") }];
    }
    if (p === "/events" && method === "GET") return [200, page([], q)];
    if ((m = p.match(/^\/commits\/[0-9a-f]+\/check-runs$/)) && method === "GET") return [200, { total_count: 0, check_runs: [] }];
    if (/^\/actions\/workflows\/[^/]+\/runs$/.test(p) && method === "GET") return [200, { total_count: 0, workflow_runs: [] }];
    return undefined;
  }

  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (d) => { raw += d; });
    req.on("end", () => {
      const u = new URL(req.url, "http://fake");
      const login = req.headers["x-fake-login"] || "";
      let body = {};
      try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
      const entry = { method: req.method, path: u.pathname, query: u.search, login: login || founder, body: raw ? body : undefined };
      requests.push(entry);
      let out;
      try { out = route(req.method, u.pathname, u.searchParams, body, login); } catch (e) { out = [500, { message: e.message }]; }
      if (!out) {
        unhandled.push(`${req.method} ${u.pathname}${u.search}`);
        out = [404, { message: "Not Found (fake GitHub has no route for this)" }];
      }
      res.writeHead(out[0], { "content-type": "application/json" });
      res.end(JSON.stringify(out[1]));
    });
  });

  let shimDir;
  let url;
  return {
    db,
    requests,
    unhandled,
    get url() { return url; },
    get shimDir() { return shimDir; },
    addIssue,
    addComment,
    /** Start the server and write the `gh` shim. Resolves to the base URL. */
    async start() {
      await new Promise((ok) => server.listen(0, "127.0.0.1", ok));
      url = `http://127.0.0.1:${server.address().port}`;
      shimDir = mkdtempSync(join(tmpdir(), "fake-gh-"));
      writeFileSync(join(shimDir, "gh"), `#!${process.execPath}\n${SHIM}`);
      chmodSync(join(shimDir, "gh"), 0o755);
      return url;
    },
    async close() {
      await new Promise((ok) => server.close(ok));
      if (shimDir) rmSync(shimDir, { recursive: true, force: true });
    },
    /**
     * Environment for a child process: the shim first on PATH, the fake repo,
     * and every variable that changes harness behaviour cleared, so the host
     * shell (or a GitHub Actions runner) cannot leak into the test.
     */
    env(extra = {}) {
      const base = { ...process.env };
      for (const k of Object.keys(base)) {
        if (/^(GH_|GITHUB_|AGENTS_|ONLY_AGENT$|FORCE_|HAS_)/.test(k)) delete base[k];
      }
      return { ...base, PATH: `${shimDir}:${process.env.PATH}`, FAKE_GH_URL: url, GITHUB_REPOSITORY: repo, ...extra };
    },
    issue(n) { return db.issues.find((i) => i.number === n); },
    commentsOn(n) { return db.comments.filter((c) => c.issue_number === n); },
    issuesLabelled(name) { return db.issues.filter((i) => i.labels.some((l) => l.name === name)); },
    writes() { return requests.filter((r) => r.method !== "GET"); },
  };
}
