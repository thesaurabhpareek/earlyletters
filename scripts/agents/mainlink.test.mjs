// Started through a symlink, the CLI scripts must still run (they used to exit 0 and print nothing: fail open).
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, symlinkSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMain } from "./main-check.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = mkdtempSync(path.join(tmpdir(), "mainlink-"));
const link = (name) => { const l = path.join(dir, `link-${name}`); if (!existsSync(l)) symlinkSync(path.join(here, name), l); return l; };
const run = (script, args) => spawnSync("node", [script, ...args], { encoding: "utf8", env: { PATH: process.env.PATH } });

test("pathguard started through a symlink gives the same result as started directly (a violating input: no --branch)", () => {
  const args = ["--labels", "agent:x"];
  const direct = run(path.join(here, "pathguard.mjs"), args);
  const linked = run(link("pathguard.mjs"), args);
  assert.notEqual(direct.status, 0);
  assert.equal(linked.status, direct.status);
  assert.ok(linked.stderr.length > 0, "an error is printed, not silence");
});

test("guard-open-prs started through a symlink fails closed like the direct start (no repo)", () => {
  const direct = run(path.join(here, "guard-open-prs.mjs"), []);
  const linked = run(link("guard-open-prs.mjs"), []);
  assert.notEqual(direct.status, 0);
  assert.equal(linked.status, direct.status);
  assert.ok(linked.stderr.length > 0);
});

test("every script with a main check resolves symlinks (no raw comparison left)", () => {
  for (const f of readdirSync(here).filter((x) => x.endsWith(".mjs") && !x.endsWith(".test.mjs") && x !== "main-check.mjs")) {
    const src = readFileSync(path.join(here, f), "utf8");
    assert.ok(!/import\.meta\.url\s*===/.test(src), `${f} compares import.meta.url to argv[1] directly`);
    assert.ok(!/path\.resolve\(process\.argv\[1\]\)/.test(src), `${f} compares a non-realpath argv[1]`);
  }
});

test("isMain: true for the real path and a symlink, false for another file, throws when it cannot decide", () => {
  const real = path.join(here, "pathguard.mjs");
  const url = new URL(`file://${real}`).href;
  assert.equal(isMain(url, real), true);
  assert.equal(isMain(url, link("pathguard.mjs")), true);
  assert.equal(isMain(url, path.join(here, "lib.mjs")), false);
  assert.equal(isMain(url, undefined), false);
  assert.throws(() => isMain(url, path.join(dir, "does-not-exist.mjs")));
});
