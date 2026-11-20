## Review B at 2a33acab50be3c20aef591025ad2dfcf9f7b50e3: PASS WITH NOTES

Delta review of lens B against my first review at 718513c7 (CHANGES). Head confirmed with gh api as 2a33acab (one commit on 718513c7). `git diff 718513c7 2a33acab`: docs/BACKLOG.md and docs/DECISIONS.md only; CR-60 and RULINGS.md untouched. I still cannot see the 8 Nov session.

### My two must-fix items
1. Attribution in D-144: fixed. The heading is now "Founder's answers" and says they are option labels, not free text. The entry splits into "Decided by the founder" (the strings and quiet-text sentence, versioned URLs), "Karma's, not the founder's" (merge of #616/#652 on the paraphrased selection and D-132; the deploy hold; the reading of D-132 that wording changes go back to him), "Open, not decided" (public use of the four lines, which CCO-6 calls the marketing seat's condition and says the founder has not decided; signed-in reuse; the CR-60 open points and doneA11y) and "Fact, not a decision" (counsel has not read the absolutes, sourced to CCO-6). The index Status cell now says the merge and the hold are Karma's and public use is open. I found no remaining place where the founder is credited with the app-only limit, the counsel fact, the merge or the hold. The entry also no longer restates CR-60's reasons ("CR-60 has the reasons and the one-line release"), which closes my old note 6.
2. BL-778 acceptance: fixed and satisfiable. `git grep LEGAL_CONTENT_DIR -- apps .github` at this head returns only `apps/web/src/lib/legal/documents.ts:49`. The new second criterion (a test fails if the override points at different bytes) is checkable. `apps/web/package.json` build is plain `next build` and `vercel.json` has no build step, so "checks no hash" holds.

### Other delta claims I checked
- Six quoted strings: still byte-identical to `copy.settings.erase`. #520 has moved since (head is now a28a64e2, was 3ae9eab2); I re-compared all six at the new head and they match.
- BL-779's request-matrix sentence matches chapter 08 rows (delete account: link to account address; export/access and correction by email, correction "through a runbook"; withdraw consent `record_policy_act` `support_assisted`); BL-237's open remainder is the `privacy_requests` log with a dated spreadsheet acceptable, as stated.
- BL-780: #598 does carry Q58, Q59, Q60 and Q61 to Q74, so "proposes Q58 to Q74" is right. FT-18 exists and is open.
- Review handles `design-systems`, `privacy`, `security`, `compliance-engineer` are roster handles.
- Dispatcher parse (lib.mjs): BL-775 and BL-781 "blocked by BL-387"; BL-776/777 needs-decision; BL-780 needs-founder, mode human; BL-778 and BL-779 ready/agent/primary `ops`. `node scripts/agents/check.mjs` consistent (394 tasks); `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs` 136 pass; trace exit 0; PRD lint clean on both files.
- Content rules on the delta: zero bytes at or above 0x80, no banned words, no real family detail. `packages/content` vitest 13 files / 309 pass; mobile billing-plan + qa-release-catalog 50 pass.
- Mergeability: `git merge-tree --write-tree origin/develop <sha>` clean.
- CI at this head: 11 check runs, all completed; every one success except one `compliance-fence` run marked cancelled, which a second `compliance-fence` run and the `required` check supersede (both success). A PASS holds only while required CI stays green at this exact head.

### Notes (not blocking)
1. Decided item 1 says it ships "in the build that follows build 11". That is a release-timing claim under his name that nothing in the repo corroborates (the only build number elsewhere is CR-60's title). "In the next build" would be safe.
2. The index row and item 3 say the 0.9.0 texts "are published at versioned addresses only", but nothing is live while the deploy is held. "Are to be published" (the earlier "go to") is more exact.
3. The six strings sit under the founder's decisions "copied exactly", yet the code comment calls `failed`, `backups` and `plusStays` the council's wording (founder decision of 8 Nov). Fine with Karma's reading line; could say he accepted the council's wording by choosing the option.
4. The pin "PR head 3ae9eab2" is stale now that #520 is at a28a64e2. Still true for the strings (checked), so say "last read at" or update the sha.
5. BL-778 Owner is now `platform`, which makes it dispatchable to `ops` (verified) for a change in `apps/web`, a file the website thread owns; `web lane` was an external lane so the dispatcher never assigned it (HARNESS.md:121). The Who line explains the choice and the harness is off (D-127), so no effect today. If the intent is that a person does it, Mode `pair` would say so.
6. BL-387 is `ready` and #520 does not change its status. BL-775 and BL-781 stay blocked until someone sets BL-387 to done (fail closed, fine), and BL-387 itself stays dispatchable meanwhile (pre-existing).
7. Still open from my first pass and not changed: "Proceed? Yes" is unqualified while the deploy is held (D-030 pattern); D-144 says nothing about when counsel's reading is due for the store binary (D-125 item 7: written answer or founder-signed deferral); three answers under one ID. FT-18 on BL-780 is the 9 Oct "send counsel the package" step, a loose fit for merging `docs/legal`.

### Not verified
The session: that he chose the three labels, what each option said, and that he also selected merge-and-deploy; the "counsel in parallel" description (from CCO-6, Karma's own record, which D-144 and CCO-6 now cite for each other). BL-776 on a phone; BL-779's TestFlight/Apple claim (the row says unread); typecheck, test:db and the full npm test (docs only).

Reviewer: independent of the author (CR-44).
