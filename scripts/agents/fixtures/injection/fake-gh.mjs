#!/usr/bin/env node
// Stand-in for the `gh` CLI, used only by injection.test.mjs. lib.mjs calls
//   gh api -X <METHOD> -H <accept> <path> [--input -]
// This reads a scenario file (FAKE_GH_SCENARIO) of the form
//   { "routes": [ { "match": "<regex on path+query>", "json": <value> } ] }
// and answers the first route that matches. A GET with no match prints nothing
// (lib.mjs reads that as null). Arrays are paginated like GitHub (per_page,
// page), so tests can model the 1,000 item cap of ghAll. Every call is
// appended to FAKE_GH_LOG so a test can prove a run wrote nothing.
import { readFileSync, appendFileSync } from "node:fs";

const args = process.argv.slice(2);
const method = args[args.indexOf("-X") + 1] ?? "GET";
const path = args.find((a, i) => i > 0 && a.startsWith("/")) ?? "";
let stdin = "";
if (args.includes("--input")) { try { stdin = readFileSync(0, "utf8"); } catch { /* none */ } }
appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify({ method, path, body: stdin }) + "\n");

if (method !== "GET") {
  process.stdout.write(JSON.stringify({ number: 1, html_url: "https://example.invalid/1" }));
  process.exit(0);
}
const { routes } = JSON.parse(readFileSync(process.env.FAKE_GH_SCENARIO, "utf8"));
for (const r of routes) {
  if (!new RegExp(r.match).test(path)) continue;
  let out = r.json;
  const per = Number(/per_page=(\d+)/.exec(path)?.[1] ?? 0);
  const page = Number(/[?&]page=(\d+)/.exec(path)?.[1] ?? 1);
  if (Array.isArray(out) && per) out = out.slice((page - 1) * per, page * per);
  process.stdout.write(JSON.stringify(out));
  process.exit(0);
}
