## What and why

Product's backlog pass after the 29 commits between d26335da and 6cd2223b (build 11), merged with `develop` (95df5c41) and revised after two CHANGES reviews. Docs only, and only `docs/BACKLOG.md`: no code, no migration, no decision entry, no requirement document. The requirement-row hunks that were first in this PR moved to their own PR, because OPERATING_MODEL section 8 says agents do not edit `docs/prd/` and propose changes in a PR body; they wait there for the CPO to confirm. This PR records what `develop` holds in the backlog and says who must rule. Nothing here is a decision.

Requirement ids served: BL-387, BL-405, BL-560, BL-659, BL-660, BL-670, BL-675, BL-676, BL-775 to BL-783.

**What the reviews changed:**
- BL-776 is `ready`, Mode `pair`, citing CPO-10 (merged in #723, `docs/agents/exec/RULINGS.md`): option (a), the existing Recently deleted row, no new line, no D- id. Mode is pair because the CDesO places the row before mobile builds, and `eligibility()` would otherwise dispatch it at once. Its Requirement and Acceptance are CPO-10's (delete the only book, cold start, Restore brings it back). The earlier request to "record BL-776 as a D- id" is withdrawn: CPO-10 says none will be made.
- BL-777: the CPrivO and CDesO rule in the executive log, then the founder approves the words (D-144); no D- id. LEGAL-REQ-051 is described as what it is (WCAG 2.2 AA, its manual VoiceOver script covers deletion), with LEGAL-REQ-044 for the claim point. `erase.tsx:80` is now `:84`.
- Rows read against `develop`: BL-778 is `done in code (#710, ae15e212)`; BL-779's runbook landed in #711, so it is now `needs-founder` (the rehearsal), Mode `human`, Size XS; BL-405 is `needs-decision` because #675 contradicts its Done-when; BL-775 stays `ready` and the "CPO confirms the rule" clause is gone (the founder approves new failed-line words before merge, D-144). Milestone `M14` is replaced by `M9` (privacy, deletion, disclosures) on BL-778, 779, 780, 783, where open #599 alone uses `M14`.
- Release scope and dates are the founder's: removed "planned Tue 10 Nov", "the CPO's build 12 call" and "the founder or the CPO may pull it into build 12". "BL-659 was picked as option (b)" now says #674 built (b), no ruling is on file, and #599 leaves it to the CDesO. Every statement that rests on the CPO's 9 Nov council answer now says that answer is outside the repository and in no executive-log entry.
- "#614 shipped with no backlog id" is replaced: open #599 defines it as BL-633.

References point forward: the rows for BL-405, BL-659 to BL-676 and the #661, #662, #675 and #614 notes cite requirement rows that exist only in #726 (the PRD PR); each says so. Until #726 merges, `trace.mjs` lists five of them as cited but undefined (report mode, it does not fail).

The PRD hunks (F05, F09, F15, F17, F20 rows) are in the PRD PR: `docs/prd-hygiene-after-build-11`. They were reviewed here twice; the reviewers' findings on them were fixed there.

## Rulings and approvals listed

- **Founder:** F09 Q8 (with the CPO); the D-087 amendment and the regional help words (F20-REQ-022); BL-405 (D-087, FT-36); whether the 0.9.0 deploy waits for BL-551 (BL-779); the POLICY_VERSIONING reading in BL-783; the one new VoiceOver hint #661 added (`speech.stopHint`); release scope for #674 and BL-782; any new failed-line words (BL-775) and any new word the BL-776 placement needs (D-144).
- **CPO:** confirm the Proposed PRD list above; priority of F09-REQ-034 to 038, F20-REQ-022, F05-REQ-052 and 053; whether F04 gets a row for Another thought on Write; whether a stop should hold while a recording waits (F05-REQ-052).
- **CDesO:** places the BL-776 row; rules BL-659.
- **CCO and founder:** whether counsel reads the regional help lines (F20, Q22, Q25).
- **CPrivO and CDesO:** BL-777.

## Id collision note (#707)

Open draft #707 re-defines BL-775 to BL-783 with other meanings, but `develop` already holds those ids (#692, #693 and #694 on 8 Nov; CPO-10, #710 and #711 cite them). `id-collisions.mjs` lists all nine. This PR defines no BL or D id; it annotates the `develop` rows and uses their meanings. #707's author should renumber to `node scripts/agents/next-id.mjs` (BL-816 today) and update its packets and plan. Not edited here. #707 and this branch merge cleanly as text, which would give two BL-775 headings.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here (no tests changed)

Run on this branch (BACKLOG.md only) after merging `develop`:
- `node scripts/agents/check.mjs`: agent team is consistent (396 backlog tasks). `eligibility()` read for BL-405 (needs-decision), 775 (ready, agent), 776 (ready, pair), 777 (needs-decision), 778 (done), 779 (needs-founder, human), 780, 781 (ready, agent), 782 (deferred), 783: only 775 and 781 are dispatchable.
- `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs`: 136 pass, 0 fail.
- `node scripts/trace.mjs --no-write`: report mode; with only the backlog change, five ids are cited but undefined that develop does not list: F05-REQ-052, F05-REQ-053, F09-REQ-034, F09-REQ-038 and F20-REQ-022. They are the Proposed rows in #726 (PRD rows, held for the CPO), and each backlog line that cites one says "proposed in PR #726, not on develop until it merges". `docs/TRACE.md` is not regenerated.
- `packages/content` vitest: 15 files, 367 tests pass (includes `claims-capabilities.test.ts`, the one test that reads the backlog).
- Added lines grepped for bytes of 0x80 and above and for three-dot runs: none. Only Asha, Mama and Papa appear. Nothing under `docs/legal/`.

Not verified: all acceptance text is read from code and the device rows, and none of it has run on a phone. The Project documents and the council notes are not in the repo. Whether the BL-779 runbook covers its four acceptance cases is read from its headings, not walked.

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
