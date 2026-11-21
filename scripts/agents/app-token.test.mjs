// Tests for the agent token helper. Fakes only: no network, no GitHub writes.
// Run: node --test scripts/agents/app-token.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, createVerify } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT } from "./lib.mjs";
import {
  LANES, APP_PERMISSIONS, FORBIDDEN, unionPermissions, appConfig, makeJwt, installationToken, resolveToken, FALLBACK_WARNING,
} from "./app-token.mjs";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const PEM = privateKey.export({ type: "pkcs1", format: "pem" });
const NOW = Date.UTC(2026, 9, 28, 12, 0, 0);
const REPO = "asha-family/earlyletters";

function fakeGitHub({ installStatus = 200, tokenStatus = 200 } = {}) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, method: init.method, headers: init.headers, body: init.body ? JSON.parse(init.body) : undefined });
    if (url.endsWith("/installation")) {
      return { ok: installStatus === 200, status: installStatus, json: async () => ({ id: 4242 }) };
    }
    if (url.endsWith("/app/installations/4242/access_tokens")) {
      const body = JSON.parse(init.body);
      return { ok: tokenStatus === 201 || tokenStatus === 200, status: tokenStatus, json: async () => ({ token: "ghs_faketoken", expires_at: "2026-10-28T13:00:00Z", permissions: body.permissions }) };
    }
    return { ok: false, status: 404, json: async () => ({}) };
  };
  return { calls, fetchImpl };
}

test("app JWT is RS256, backdated 60 s, valid under 10 minutes, issued by the App", () => {
  const jwt = makeJwt({ iss: "Iv23.client", privateKey: PEM, now: NOW });
  const [h, b, s] = jwt.split(".");
  assert.deepEqual(JSON.parse(Buffer.from(h, "base64url")), { alg: "RS256", typ: "JWT" });
  const claims = JSON.parse(Buffer.from(b, "base64url"));
  assert.equal(claims.iss, "Iv23.client");
  assert.equal(claims.iat, NOW / 1000 - 60);
  assert.ok(claims.exp - NOW / 1000 <= 600, "at most 10 minutes ahead");
  assert.ok(createVerify("RSA-SHA256").update(`${h}.${b}`).verify(publicKey, Buffer.from(s, "base64url")));
});

test("appConfig prefers the client id, accepts the app id, and repairs one-line keys", () => {
  assert.equal(appConfig({}), undefined);
  assert.equal(appConfig({ AGENTS_APP_ID: "1" }), undefined, "no key");
  assert.equal(appConfig({ AGENTS_APP_PRIVATE_KEY: PEM }), undefined, "no issuer");
  assert.equal(appConfig({ AGENTS_APP_ID: "123", AGENTS_APP_PRIVATE_KEY: PEM }).iss, "123");
  assert.equal(appConfig({ AGENTS_APP_ID: "123", AGENTS_APP_CLIENT_ID: "Iv23.c", AGENTS_APP_PRIVATE_KEY: PEM }).iss, "Iv23.c");
  const oneLine = PEM.replace(/\n/g, "\\n");
  assert.equal(appConfig({ AGENTS_APP_ID: "1", AGENTS_APP_PRIVATE_KEY: oneLine }).privateKey, PEM);
});

test("installation token is narrowed to one repository and one lane's permissions", async () => {
  const gh = fakeGitHub({ tokenStatus: 201 });
  const t = await installationToken({ iss: "123", privateKey: PEM, repo: REPO, lane: "reviewer", fetchImpl: gh.fetchImpl, now: NOW });
  assert.equal(t.token, "ghs_faketoken");
  assert.deepEqual(gh.calls.map((c) => [c.method, c.url]), [
    ["GET", "https://api.github.com/repos/asha-family/earlyletters/installation"],
    ["POST", "https://api.github.com/app/installations/4242/access_tokens"],
  ]);
  assert.match(gh.calls[0].headers.Authorization, /^Bearer [\w-]+\.[\w-]+\.[\w-]+$/);
  assert.deepEqual(gh.calls[1].body, { repositories: ["earlyletters"], permissions: LANES.reviewer });
  assert.equal(gh.calls[1].body.permissions.contents, "read", "reviewers cannot push");
});

test("resolveToken uses the App when configured", async () => {
  const gh = fakeGitHub({ tokenStatus: 201 });
  const env = { AGENTS_APP_CLIENT_ID: "Iv23.c", AGENTS_APP_PRIVATE_KEY: PEM, GH_TOKEN: "founder-token" };
  const r = await resolveToken({ env, repo: REPO, lane: "worker", fetchImpl: gh.fetchImpl, now: NOW });
  assert.equal(r.source, "app");
  assert.equal(r.token, "ghs_faketoken");
  assert.deepEqual(r.warnings, []);
});

test("resolveToken falls back to GH_TOKEN, then GITHUB_TOKEN, with the warning", async () => {
  const gh = fakeGitHub();
  const a = await resolveToken({ env: { GH_TOKEN: "t1", GITHUB_TOKEN: "t2" }, repo: REPO, fetchImpl: gh.fetchImpl });
  assert.deepEqual([a.source, a.token, a.fallbackName], ["fallback", "t1", "GH_TOKEN"]);
  assert.ok(a.warnings.includes(FALLBACK_WARNING));
  assert.match(FALLBACK_WARNING, /unverified author/);
  const b = await resolveToken({ env: { GITHUB_TOKEN: "t2" }, repo: REPO, fetchImpl: gh.fetchImpl });
  assert.deepEqual([b.source, b.token], ["fallback", "t2"]);
  const c = await resolveToken({ env: {}, repo: REPO, fetchImpl: gh.fetchImpl });
  assert.equal(c.source, "none");
  assert.equal(c.token, undefined);
  assert.equal(gh.calls.length, 0, "no App, no network");
});

test("an App that fails falls back with a warning that never contains the key", async () => {
  const gh = fakeGitHub({ installStatus: 404 });
  const env = { AGENTS_APP_ID: "123", AGENTS_APP_PRIVATE_KEY: PEM, GH_TOKEN: "t1" };
  const r = await resolveToken({ env, repo: REPO, fetchImpl: gh.fetchImpl, now: NOW });
  assert.equal(r.source, "fallback");
  assert.ok(r.warnings.some((w) => /not installed .* HTTP 404/.test(w)));
  const keyBody = PEM.split("\n")[1];
  assert.ok(r.warnings.every((w) => !w.includes(keyBody)), "key never echoed");
  const strict = await resolveToken({ env, repo: REPO, fetchImpl: gh.fetchImpl, requireApp: true, now: NOW });
  assert.equal(strict.source, "none");
  assert.equal(strict.token, undefined, "--require-app never falls back to the founder's token");
  const unset = await resolveToken({ env: { GH_TOKEN: "t1" }, repo: REPO, fetchImpl: gh.fetchImpl, requireApp: true });
  assert.equal(unset.token, undefined);
});

test("dry run makes no network call and returns no token", async () => {
  const gh = fakeGitHub();
  const r = await resolveToken({ env: { AGENTS_APP_ID: "1", AGENTS_APP_PRIVATE_KEY: PEM }, repo: REPO, lane: "dispatch", dryRun: true, fetchImpl: gh.fetchImpl });
  assert.equal(r.source, "dry-run");
  assert.equal(r.token, undefined);
  assert.match(r.plan, /App installation token for lane dispatch/);
  assert.equal(gh.calls.length, 0);
  const fb = await resolveToken({ env: { GH_TOKEN: "t" }, repo: REPO, dryRun: true, fetchImpl: gh.fetchImpl });
  assert.equal(fb.plan, "fallback to GH_TOKEN");
});

test("unknown lanes are refused", async () => {
  await assert.rejects(resolveToken({ env: {}, repo: REPO, lane: "admin" }), /unknown lane "admin"/);
});

test("lanes are least privilege: only workers push, readers write nothing, nothing forbidden anywhere", () => {
  for (const [lane, perms] of Object.entries(LANES)) {
    for (const k of Object.keys(perms)) assert.ok(!FORBIDDEN.includes(k), `${lane} asks for ${k}`);
    assert.equal(perms.contents === "write", lane === "worker", `${lane} contents`);
  }
  assert.ok(Object.values(LANES.reader).every((v) => v === "read"));
  assert.deepEqual(APP_PERMISSIONS, unionPermissions());
});

test("the manifest in GITHUB_APP.md grants exactly the union of the lanes and no webhook", () => {
  const doc = readFileSync(join(ROOT, "docs", "agents", "GITHUB_APP.md"), "utf8");
  const block = doc.match(/```json\n([\s\S]*?)\n```/);
  assert.ok(block, "a json block");
  const manifest = JSON.parse(block[1]);
  assert.deepEqual(manifest.default_permissions, APP_PERMISSIONS);
  for (const k of FORBIDDEN) assert.equal(manifest.default_permissions[k], undefined, k);
  assert.equal(manifest.public, false);
  assert.equal(manifest.hook_attributes?.active, false);
  assert.deepEqual(manifest.default_events ?? [], []);
  assert.ok(manifest.url);
  for (const name of ["AGENTS_APP_ID", "AGENTS_APP_CLIENT_ID", "AGENTS_APP_PRIVATE_KEY", "AGENTS_BOT_LOGINS"]) assert.match(doc, new RegExp(name));
});

test("CLI dry run prints the plan and never a token", () => {
  const out = execFileSync(process.execPath, [join(ROOT, "scripts", "agents", "app-token.mjs"), "--lane", "reader", "--dry-run", "--repo", REPO], {
    env: { PATH: process.env.PATH, GH_TOKEN: "secret-fallback" }, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
  });
  const plan = JSON.parse(out);
  assert.equal(plan.lane, "reader");
  assert.ok(!out.includes("secret-fallback"));
});
