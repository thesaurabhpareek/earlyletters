// Tests for tone-lint.mjs. Fixtures only, in a temp folder. No network.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { scanText, stripCode, parseBaseline, compare, aggregate, main } from "./tone-lint.mjs";

const SCRIPT = join(import.meta.dirname, "tone-lint.mjs");
const EM = String.fromCharCode(0x2014);
const EN = String.fromCharCode(0x2013);
const LQ = String.fromCharCode(0x201c);
const ELL = String.fromCharCode(0x2026);
const EMOJI = String.fromCodePoint(0x1f600);

const rules = (text) => scanText(text).hard.map((h) => h.rule);

test("each hard rule fires once with its line number", () => {
  const cases = [
    [`a ${EM} b`, "em-dash"],
    [`a ${EN} b`, "en-dash"],
    [`say ${LQ}hi`, "curly-quote"],
    [`wait${ELL}`, "ellipsis"],
    [`done ${EMOJI}`, "emoji"],
    ["We leverage it", "banned-word"],
  ];
  for (const [text, rule] of cases) {
    const hard = scanText("ok line\n" + text).hard;
    assert.deepEqual(hard.map((h) => [h.line, h.rule]), [[2, rule]], rule);
  }
});

test("clean prose has no hard findings", () => {
  assert.deepEqual(scanText("I checked the build on Tue 10 Nov. It passed.\n").hard, []);
});

test("every banned word and its inflections are caught", () => {
  const words = "leverage robust seamless comprehensive crucial delve ensure streamline holistic utilize empower unlock";
  const found = scanText(words).hard.map((h) => h.token);
  assert.equal(found.length, 12);
  assert.deepEqual(rules("ensures and Ensured and UNLOCKED"), ["banned-word", "banned-word", "banned-word"]);
});

test("a banned word inside a longer word is not flagged", () => {
  assert.deepEqual(rules("The ensemble used a lock and a deliverable."), []);
});

test("fenced code and inline code are ignored", () => {
  const text = ["Plain line.", "```", `code ${EM} leverage`, "```", `inline \`leverage ${EM}\` here`, "~~~", `${EN}`, "~~~"].join("\n");
  assert.deepEqual(scanText(text).hard, []);
});

test("a fence closes only on a matching fence, and findings after it count", () => {
  const text = ["```", "inside", "~~~", `still inside ${EM}`, "```", `outside ${EM}`].join("\n");
  const hard = scanText(text).hard;
  assert.deepEqual(hard.map((h) => h.line), [6]);
});

test("stripCode keeps line numbers", () => {
  assert.equal(stripCode("a\n```\nb\n```\nc").length, 5);
});

test("bold per 1000 words", () => {
  const text = "**one** two three four **five** " + "word ".repeat(95);
  const s = scanText(text).soft;
  assert.equal(s.words, 100);
  assert.equal(s.boldPer1000Words, 20);
});

test("bullet share counts bullet and numbered lines, not blanks or tables", () => {
  const text = ["Intro line.", "", "- a", "- b", "1. c", "| x | y |", "Last line."].join("\n");
  assert.equal(scanText(text).soft.bulletLineShare, 50);
});

test("short sentence share uses five words or fewer", () => {
  const text = "Simple. Fast. Done. This sentence has more than five words in it.";
  const s = scanText(text).soft;
  assert.equal(s.sentences, 4);
  assert.equal(s.shortSentenceShare, 75);
  assert.equal(scanText("Exactly five words in here.").soft.shortSentenceShare, 100);
  assert.equal(scanText("Now six words are in here.").soft.shortSentenceShare, 0);
});

test("abbreviations and decimals do not split sentences", () => {
  const s = scanText("Use a tool, e.g. the linter, on version 3.5 of the page today.").soft;
  assert.equal(s.sentences, 1);
});

test("contrast patterns are counted in prose only", () => {
  const text = [
    "It is not a slogan, it is a rule.",
    "This isn't hype, but a number.",
    "Not only fast, but also right.",
    "| not x, it is y | cell |",
    "`not x, it is y` in code.",
  ].join("\n");
  assert.equal(scanText(text).soft.contrastCount, 2);
});

test("headings and tables do not count as sentences", () => {
  const s = scanText("# Short\n\n| a | b |\n|---|---|\n\nOne real sentence is here for the count.").soft;
  assert.equal(s.sentences, 1);
});

// CLI behaviour.
function fixture(files, baseline) {
  const dir = mkdtempSync(join(tmpdir(), "tone-lint-"));
  for (const [name, body] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), body);
  }
  const bl = join(dir, "baseline.txt");
  if (baseline !== undefined) writeFileSync(bl, baseline);
  return { dir, bl };
}
const run = (args, cwd) => spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: "utf8" });

test("--check exits 1 on a hard finding with no baseline entry, 0 when listed", () => {
  const { dir, bl } = fixture({ "docs/a.md": `bad ${EM} dash\n` });
  try {
    const r = run(["docs", "--check", "--baseline", bl], dir);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /NEW .*docs\/a\.md em-dash U\+2014/);
    assert.equal(run(["docs", "--update-baseline", "--baseline", bl], dir).status, 0);
    assert.equal(run(["docs", "--check", "--baseline", bl], dir).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("--check exits 1 when a listed finding was fixed (stale entry)", () => {
  const { dir, bl } = fixture({ "docs/a.md": `bad ${EM} dash\n` });
  try {
    run(["docs", "--update-baseline", "--baseline", bl], dir);
    writeFileSync(join(dir, "docs/a.md"), "clean now.\n");
    const r = run(["docs", "--check", "--baseline", bl], dir);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /STALE/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a second occurrence of a listed finding is new", () => {
  const { dir, bl } = fixture({ "docs/a.md": `one ${EM} dash\n` });
  try {
    run(["docs", "--update-baseline", "--baseline", bl], dir);
    writeFileSync(join(dir, "docs/a.md"), `one ${EM} dash\ntwo ${EM} dash\n`);
    const r = run(["docs", "--check", "--baseline", bl], dir);
    assert.equal(r.status, 1);
    assert.match(r.stdout, /2 found, 1 listed/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("soft metrics never fail --check", () => {
  const bold = Array.from({ length: 40 }, (_, i) => `- **b${i}** x.`).join("\n");
  const { dir, bl } = fixture({ "docs/a.md": bold + "\nIt is not X, it is Y.\n" }, "");
  try {
    assert.equal(run(["docs", "--check", "--baseline", bl], dir).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("--update-baseline refuses to grow an existing baseline and leaves it unchanged", () => {
  const { dir, bl } = fixture({ "docs/a.md": "clean.\n" }, "");
  try {
    writeFileSync(join(dir, "docs/a.md"), `new ${EM} dash\n`);
    const before = readFileSync(bl, "utf8");
    const r = run(["docs", "--update-baseline", "--baseline", bl], dir);
    assert.equal(r.status, 1);
    assert.match(r.stderr, /refusing to grow/);
    assert.equal(readFileSync(bl, "utf8"), before);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a single-file run does not report other files' baseline entries as stale", () => {
  const { dir, bl } = fixture({ "docs/a.md": `x ${EM} y\n`, "docs/b.md": "clean.\n" });
  try {
    run(["docs", "--update-baseline", "--baseline", bl], dir);
    assert.equal(run(["docs/b.md", "--check", "--baseline", bl], dir).status, 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("--json output parses and lists findings per file", () => {
  const { dir, bl } = fixture({ "docs/a.md": `x ${EM} y\n` });
  try {
    const r = run(["docs", "--json", "--check", "--baseline", bl], dir);
    const j = JSON.parse(r.stdout);
    assert.equal(j.files[0].hard[0].rule, "em-dash");
    assert.equal(j.check.fresh.length, 1);
    assert.equal(r.status, 1);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the lint only writes with --update-baseline", () => {
  const { dir, bl } = fixture({ "docs/a.md": `x ${EM} y\n` });
  try {
    run(["docs", "--check", "--baseline", bl], dir);
    run(["docs", "--json"], dir);
    assert.throws(() => readFileSync(bl, "utf8"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("usage errors exit 2", () => {
  const out = [];
  const io = { out: (s) => out.push(s), err: (s) => out.push(s) };
  assert.equal(main(["--nope"], io), 2);
  assert.equal(main(["/no/such/path/here"], io), 2);
});

test("parseBaseline, aggregate and compare agree", () => {
  const base = parseBaseline("# c\ndocs/a.md em-dash U+2014 2\n");
  const cur = aggregate([{ file: "docs/a.md", hard: [{ rule: "em-dash", token: "U+2014" }] }]);
  const v = compare(cur, base, ["docs/a.md"], []);
  assert.equal(v.fresh.length, 0);
  assert.equal(v.stale.length, 1);
  assert.throws(() => parseBaseline("docs/a.md em-dash"));
});
