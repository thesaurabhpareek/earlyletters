// Which comments count as founder instructions. Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { isFounderComment } from "./lib.mjs";

test("machine posts from the founder's account are not founder instructions", () => {
  const roster = { founder: "founder" };
  const by = (body) => ({ user: { login: "founder" }, body });
  assert.equal(isFounderComment(by("Please split this PR."), roster), true);
  assert.equal(isFounderComment(by("<!-- receipt run:1 agent:qa cost:unknown --> Run receipt"), roster), false);
  assert.equal(isFounderComment(by("<!-- journal run:1 agent:qa -->\n**Mode:** task"), roster), false);
  assert.equal(isFounderComment(by("<!-- red-team:abc -->\nVerdict: ship"), roster), false);
  assert.equal(isFounderComment(by("<!-- handoff-reply from:qa status:done -->\nDone."), roster), false);
  assert.equal(isFounderComment({ user: { login: "someone" }, body: "do this" }, roster), false);
});
