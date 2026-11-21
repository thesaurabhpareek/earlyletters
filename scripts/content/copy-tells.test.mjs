import test from "node:test";
import assert from "node:assert/strict";
import { RULES, stringsIn, compare } from "./copy-tells.mjs";

const hits = (t) => RULES.filter(([, re]) => re.test(t)).map(([r]) => r);

test("flags stiff and stagey lines", () => {
  assert.deepEqual(hits("The download did not finish."), ["uncontracted"]);
  assert.ok(hits("One note from us, then Apple asks.").includes("stage-managed"));
  assert.ok(hits("Your voice, kept").includes("slogan-kept"));
  assert.ok(hits("Please try again.").includes("please-open"));
});

test("leaves plain human lines alone", () => {
  assert.deepEqual(hits("That didn't save. Your recording is still here."), []);
  assert.deepEqual(hits("To make sure it's you, we'll email this address a link."), []);
});

test("extracts string values, not keys or imports", () => {
  const out = stringsIn("x.ts", "import a from 'some-module-name';\nexport const c = { title: 'Say a few words', 'quoted key here': 'Tap Save' };");
  assert.deepEqual(out.map((s) => s.text), ["Say a few words", "Tap Save"]);
});

test("compare reports growth and new entries only", () => {
  const now = new Map([["a\tr", 3], ["b\tr", 1]]);
  const base = new Map([["a\tr", 3]]);
  assert.deepEqual(compare(now, base), [["b\tr", 0, 1]]);
});
