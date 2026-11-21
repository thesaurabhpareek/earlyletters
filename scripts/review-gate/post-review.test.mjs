// Tests for post-review.mjs. Fake api and poster are injected: no network, no gh.
// The fictional family is Asha; no real family data appears here.
import { test } from "node:test";
import assert from "node:assert/strict";
import { postReview, checkFile, parseArgs, Refusal } from "./post-review.mjs";

const HEAD = "a83634ced2a5ecf32717bf833f941b892fc660b9";
const OLD = "c5cfa0cfaa96a0ba97ca5f34629747ab0badf438";
const file = (lens = "A", sha = HEAD, verdict = "PASS", body = "Read the diff for the Asha fixture.\nMust fix: none\n") => `## Review ${lens} at ${sha}: ${verdict}\n${body}`;

function rig({ live = HEAD, state = "open", comments = [], movesTo = null } = {}) {
  const posts = [];
  let reads = 0;
  const api = async (path) => {
    if (path.includes("/comments")) return comments;
    return { state, head: { sha: ++reads > 1 && movesTo ? movesTo : live } };
  };
  const poster = async (path, body) => { posts.push({ path, body }); };
  return { api, poster, posts };
}
const run = (text, opts = {}, post = true) => { const r = rig(opts); return postReview({ pr: 5, text, api: r.api, poster: r.poster, post }).then((x) => ({ ...x, posts: r.posts })); };
const refused = (p, re) => assert.rejects(p, (e) => e instanceof Refusal && re.test(e.message));

test("matching head, no duplicate, --post: one comment posted to the issue comments endpoint", async () => {
  const r = await run(file());
  assert.equal(r.action, "posted");
  assert.equal(r.posts.length, 1);
  assert.equal(r.posts[0].path, "repos/thesaurabhpareek/earlyletters/issues/5/comments");
  assert.ok(r.posts[0].body.startsWith(`## Review A at ${HEAD}: PASS\n`));
});

test("dry run is the default behaviour of postReview and posts nothing", async () => {
  const r = await run(file("B", HEAD, "CHANGES", "Must fix: the Asha fixture is wrong\n"), {}, false);
  assert.equal(r.action, "dry-run");
  assert.equal(r.posts.length, 0);
  assert.equal(parseArgs(["5", "r.md"]).post, false);
  assert.equal(parseArgs(["5", "r.md", "--post"]).post, true);
});

test("header sha not equal to the live head is refused, also when only one char differs", async () => {
  await refused(run(file("A", OLD)), /not the live head/);
  const off = HEAD.slice(0, 39) + "0";
  await refused(run(file("A", off)), /not the live head/);
});

test("a 39-char or 41-char sha, a short sha and an upper-case sha are refused as a header", () => {
  for (const sha of [HEAD.slice(0, 39), HEAD + "0", HEAD.slice(0, 12), HEAD.toUpperCase()]) {
    assert.throws(() => checkFile(file("A", sha)), Refusal);
  }
});

test("same header already on the PR is refused (idempotent), even from another commenter", async () => {
  const dup = [{ body: `## Review A at ${HEAD}: PASS\nolder text`, author_association: "OWNER" }];
  const r = rig({ comments: dup });
  await refused(postReview({ pr: 5, text: file(), api: r.api, poster: r.poster, post: true }), /already exists/);
  assert.equal(r.posts.length, 0);
  // the other lens at the same head is a different header and is allowed
  assert.equal((await run(file("B"), { comments: dup })).action, "posted");
});

test("non-ASCII, em dash, en dash, curly quote and emoji are refused", async () => {
  for (const bad of ["a \u2014 b", "a \u2013 b", "it\u2019s", "\u201cquoted\u201d", "fine \u{1F600}", "caf\u00e9"]) {
    await refused(run(file("A", HEAD, "PASS", `${bad}\nMust fix: none\n`)), /non-ASCII/);
  }
});

test("a lens it cannot read is refused: lens C, no verdict, lowercase verdict, extra words, empty body", () => {
  for (const t of [
    `## Review C at ${HEAD}: PASS\nx`,
    `## Review A at ${HEAD}:\nx`,
    `## Review A at ${HEAD}: pass\nx`,
    `## Review A at ${HEAD}: PASS.\nx`,
    `## Review A at ${HEAD}: APPROVED\nx`,
    `intro\n## Review A at ${HEAD}: PASS\nx`,
    `## Review A at ${HEAD}: PASS`,
    `## Review A at ${HEAD}: PASS\n   \n`,
  ]) assert.throws(() => checkFile(t), Refusal, t);
});

test("header and body cannot disagree: PASS with a named Must fix, PASS WITH NOTES without Must fix: none", () => {
  assert.throws(() => checkFile(file("A", HEAD, "PASS", "Must fix: the Asha fixture\n")), /names something/);
  assert.throws(() => checkFile(file("A", HEAD, "PASS WITH NOTES", "Notes only.\n")), /Must fix: none/);
  assert.equal(checkFile(file("A", HEAD, "PASS WITH NOTES", "Must fix: none\n")).verdict, "PASS WITH NOTES");
});

test("a closed PR is refused; a head that moves just before the write is refused and nothing posts", async () => {
  await refused(run(file(), { state: "closed" }), /not open/);
  const r = rig({ movesTo: OLD });
  await refused(postReview({ pr: 5, text: file(), api: r.api, poster: r.poster, post: true }), /head moved/);
  assert.equal(r.posts.length, 0);
});

test("parseArgs rejects unknown flags and a bad repo", () => {
  assert.throws(() => parseArgs(["5", "r.md", "--merge"]));
  assert.throws(() => parseArgs(["5"]));
  assert.throws(() => parseArgs(["5", "r.md", "--repo", "../x"]));
});
