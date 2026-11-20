## What and why

The requirement-row half of the hygiene pass after build 11, split out of #715 so the backlog edits can merge on their own. Docs only: five files under `docs/prd/v2/features/`. OPERATING_MODEL section 8 says agents do not edit `docs/prd/` and propose changes in a PR body, so **this PR merges only after the CPO confirms the list below on the PR; if the CPO does not, close it.** The CPO's 9 Nov council answer (outside the repository, in no executive-log entry) reads "PRD and backlog hygiene: RULED, mine to write". No existing requirement's meaning or priority changes, and F17-REQ-026, F09-REQ-005, F09-REQ-006, F20-REQ-002 and F20-REQ-003 are not edited. Nothing here is a decision.

Requirement ids served: F17 6.2 A (C-REQ-016), F09-REQ-005, F09-REQ-006, F20-REQ-002, F20-REQ-005, F05-REQ-021.

**What the two reviews of #715 changed in these files:**
- F09 Q8 and the 6.2 note no longer blame #674 for two differences it did not cause. At 6ca2491a^ the open-month card was already gone (removed by the experience pass P5, #222, d14dbaab) and `book.earlierMonth.cta` had never been built. #674 made two: the count line moved into the Months sheet, and months read "7 months". Options (b) and (c) are reworded so they do what they say.
- F09-REQ-038 states what the code does under Reduce Motion: the jump keeps its fade (`(tabs)/book.tsx` uses `ReduceMotion.Never`); only the inline bar switches at once. F09-REQ-035 to 037 say "not run on a phone".
- F05-REQ-053 and this body no longer say that S1-15a step 7 names Settings > Recordings. It names Settings > Storage (the English row); the Recordings wording is in the parent S1-15. F05-REQ-052 gains #712 (the action word in the row's label, AX5, Voice Control) and S1-97b's note that a waiting recording starts a stopped download again. F20-REQ-022 gains #713 (outlined Call and Text, S1-150 (g)) and BL-405's FT-36 rule.
- F20: "counsel is not asked to read the lines" is gone. It is OPEN for the CCO and the founder: F20-REQ-003 is a [Counsel] row, COUNSEL_PACKET Q25 is live, Q22 says US only.
- F17: the edits are marked Proposed, the note no longer says the table was not rewritten, "Delete your account" is "Delete account" (the built label), the 6.2 A row says Export your book, and the backup row is in its code order (before Storage). The wording a public page must carry stays the founder's (BL-783, BL-501).
- A one-line legend in F09, F20 and F05 says a Proposed P cell is a proposal with no priority and is not counted as P0.

## Proposed PRD changes (for the CPO to confirm)

| File | Change | Kind |
|---|---|---|
| `F17-settings-privacy.md` | 6.2 A home row: Your data renamed Your letters; Delete your account noted as its own row; one dated note under the table | Path and name to match the built app (Proposed) |
| `F17-settings-privacy.md` | 6.2 E step 1, 6.2 F, 6.2 G step 2: Settings path | Same (Proposed); G step 2 is public-page wording and is the founder's (BL-783) |
| `F09-book.md` | Line 102: group name in the entry-point table | Rename |
| `F15-export.md` | Line 9: group name in Depends on | Rename |
| `F09-book.md` | F09-REQ-034 to F09-REQ-038, Q8, a status note under 6.2, a legend line | New Proposed rows and a question; no existing row edited |
| `F20-help-safety.md` | F20-REQ-022, a D-087 conflict note, a legend line | New Proposed row and a note |
| `F05-transcription.md` | F05-REQ-052, F05-REQ-053, a legend line | New Proposed rows |

The backlog PR (#715) cites F20-REQ-022 at BL-405; the two PRs merge independently, and until this one merges `trace.mjs` lists that id as cited but undefined (report mode).

## Rulings and approvals listed

- **Founder:** F09 Q8 (with the CPO); the D-087 amendment and the regional help words (F20-REQ-022); BL-405 (D-087, FT-36); whether the 0.9.0 deploy waits for BL-551 (BL-779); the POLICY_VERSIONING reading in BL-783; the one new VoiceOver hint #661 added (`speech.stopHint`); release scope for #674 and BL-782; any new failed-line words (BL-775) and any new word the BL-776 placement needs (D-144).
- **CPO:** confirm the Proposed PRD list above; priority of F09-REQ-034 to 038, F20-REQ-022, F05-REQ-052 and 053; whether F04 gets a row for Another thought on Write; whether a stop should hold while a recording waits (F05-REQ-052).
- **CDesO:** places the BL-776 row; rules BL-659.
- **CCO and founder:** whether counsel reads the regional help lines (F20, Q22, Q25).
- **CPrivO and CDesO:** BL-777.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here (no tests changed)

Run on this branch (PRD files only) after merging `develop`:
- `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs` and `node scripts/agents/check.mjs`: as for #715.
- `node scripts/trace.mjs --no-write`: 846 IDs defined (838 on `develop`, 8 added), P0 unchanged at 773 because the new rows say Proposed, 0 defined in two specs; the 5 "cited but undefined" are the same as on `develop` plus none new.
- `packages/content` vitest: 15 files, 367 tests pass.
- Added lines grepped for bytes of 0x80 and above and for three-dot runs: none. Only Asha, Mama and Papa appear. Nothing under `docs/legal/`.

Not verified: every row is read from code and the device plan; none has run on a phone (S1-95, S1-151, S1-150, S1-97b, S1-15a, S1-15b, S1-152, S1-142 are all unrun). The Project documents and the council notes are not in the repo.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (docs only)
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not applicable)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts` (not applicable)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no copy changed; F09-REQ-037 flags that the Book page words sit in `apps/mobile/src/components/book/copy.ts`)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (none touched)
- [x] The public product name comes only from `packages/brand`

PROPOSED WORDING: none new. The rows quote strings already on `develop`.

## Screenshots

n/a (docs only)

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
