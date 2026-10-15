// Lessons of 3 to 15 Oct turned into tests. Run: node --test 'scripts/agents/*.test.mjs'
import { test } from "node:test";
import assert from "node:assert/strict";
import { needsIndependentReview, nextIds } from "./hardening.mjs";

test("D-041 review covers database, workflows and auth code, whoever wrote the PR", () => {
  assert.equal(needsIndependentReview(["supabase/migrations/20261004_x.sql"]), true);
  assert.equal(needsIndependentReview([".github/workflows/release-ios.yml"]), true);
  assert.equal(needsIndependentReview(["apps/mobile/src/lib/auth/session-provider.tsx"]), true);
  assert.equal(needsIndependentReview(["apps/mobile/src/app/(auth)/sign-in/verify.tsx"]), true);
  assert.equal(needsIndependentReview(["docs/support/help/signing-in.md"]), false, "a help article about signing in is not auth code");
  assert.equal(needsIndependentReview(["packages/content/src/store.en.ts", "docs/BACKLOG.md"]), false);
  assert.equal(needsIndependentReview([]), false);
});

test("next ids count every open PR, so parallel PRs never collide", () => {
  const develop = "#### BL-434 Last task\n| D-088 | x |\n";
  const openPr = "+#### BL-440 New\n+| D-099 | delegated |\n";
  assert.deepEqual(nextIds([develop, openPr], ["0017-api.md", "docs/adr/0022-release.md", "0101-ui.md"]),
    { BL: "BL-441", D: "D-100", ADR: "0023" });
  assert.deepEqual(nextIds([""], []), { BL: "BL-001", D: "D-001", ADR: "0001" });
});
