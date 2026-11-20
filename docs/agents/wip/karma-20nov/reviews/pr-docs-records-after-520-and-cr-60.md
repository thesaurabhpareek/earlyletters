## What and why

Records the founder's answers of 8 Nov 2026 and the follow-ups that two rulings promise. Docs only: no code, no `docs/legal/**`, no `.github/**`, no migration.

- **`docs/DECISIONS.md`: D-144** (index row and entry), "Erase everything ships with its four lines; the 0.9.0 texts go to versioned addresses only". It separates what the founder decided from what is Karma's or open:
  - **Founder's answers**, the three option labels he chose, word for word: "Ship with the three edits (Recommended)", "Keep it, in quiet text (Recommended)", "Versioned URLs only (Recommended)".
  - **Decided by the founder:** (1) #520 ships with the four lines and the three edits, with the final strings from `packages/content/src/strings.en.ts` at its head 3ae9eab2 copied exactly (`body`, `onThisPhone`, `freeLetters`, `backups`, and the two other edited lines `failed` and `plusStays`); (2) the free-letters sentence stays, in quiet text; (3) the 0.9.0 texts at versioned addresses only.
  - **Karma's, not the founder's:** #616 and #652 are merged to `develop`. That merge rests on his selection of that option (a paraphrase of the option list, not a quote) alone: D-132 does not cover it, because it lists `docs/legal/**` as not delegated and #616 changes `docs/legal/beta/*.md` and `docs/legal/POLICY_VERSIONING.md`. He may ask for a revert. The website deploy is held as a recommendation (CR-60 has the reasons). A later change to these strings goes back to him (Karma's reading of D-132). The entry names no build or date for the release of Erase everything, because nothing in the repo gives one.
  - **Open, not decided:** whether the four lines may be used in the store listing, website or other public copy (the marketing seat's condition is app only; the founder has not decided it, as CCO-6 says).
  - **Fact, not a decision:** counsel has not read "We hold no copy", "Nothing is sent anywhere" or the Terms 8.1 question.
  - Relates to D-083, D-103, D-138; amends nothing. Owner: founder; Karma. The index Status cell carries the same split. Its follow-ups line says BL-387 stays `ready` while #520 is open and Karma marks it done in the merge follow-up.
- **`docs/BACKLOG.md`: BL-775 to BL-781**, one new sub-section ("Follow-ups from the 8 Nov 2026 rulings") placed before "Speed, size and release evidence", in the audit section's row shape with Given/When/Then:
  - BL-775 a failed Erase everything that the person keeps using should erase only what existed when it began (S1: it can lose a word; the row says why it is not S0; the current behaviour is pinned at `erase-all.test.ts:588` in #520)
  - BL-776 a person with one book cannot reach Recently deleted after a cold start (CPO to rule before 1 Dec; the redirect is read in code, not run on a phone)
  - BL-777 the VoiceOver line `doneA11y` says more than the screen (CPrivO and CDesO to rule)
  - BL-778 delete or document `LEGAL_CONTENT_DIR` (`apps/web/src/lib/legal/documents.ts:49`) before the 0.9.0 pages are deployed (Mode `pair` so the dispatcher does not take the website thread's change); acceptance is scoped to `git grep LEGAL_CONTENT_DIR -- apps .github`, or the override kept, documented and pinned by a test
  - BL-779 a written route for withdraw sync, see/export/correct and deleting TestFlight feedback by email; BL-551 and BL-237 are linked, not duplicated; the chapter 08 request matrix, DSR-R02 and DSR-R05 are cited
  - BL-780 counsel asks for `docs/legal/COUNSEL_PACKET.md` (the founder merges `docs/legal`): the two absolutes, Terms 8.1, and D-083's Keychain count, which the packet does not mention; numbered after #598's Q58 to Q74
  - BL-781 the claims inventory (`docs/reviews/2026-10-claims-inventory.md`, kept by the CMO) records the four lines, used in the app only for now, with `erase-all.test.ts` as proof (path: Settings > Your letters > Erase everything on this phone, after the #614 regroup)
  - BL-387 (the row PR #520 builds) stays `ready` while #520 is open, so BL-775 and BL-781 stay `blocked (BL-387)`; Karma marks BL-387 done in the merge follow-up, which frees them.
  - Status lines carry their ids: `blocked (BL-387)` for BL-775 and BL-781 (BL-387 is the row PR #520 builds), `needs-decision (CCO-6; ...)` for BL-776 and BL-777, `needs-founder (FT-18; ...)` for BL-780. Owners are roster names (BL-778 is `platform`; its Who line says it is the web lane's change).
- **`docs/agents/cto/RULINGS.md` CR-60, four small fixes, nothing else:** "deleting TestFlight feedback" added to the missing-route sentence; the Debate line no longer puts a phrase in quotation marks as if he had said it ("he chose to deploy the website"); the re-hash instruction also lists `apps/web/e2e/legal-versions.e2e.ts` (lines 18 and 19, verified) and the hash table in #616's description; and a note that `POLICY_VERSIONING.md` line 69 says a version number is never reused even for a leaked draft, so the keep-0.9.0 rule rests on #616's own note and not on the policy file.

Ids: BL-775 to BL-781 and D-144 are the next free numbers counting `develop` and every open PR on 8 Nov (`node scripts/agents/next-id.mjs` prints BL-775 and D-144). D-141 to D-143 are named in open PRs #638 and #664 (the Feedback entry and the renumbering of the second D-139 in #591), so D-144 skips them. Open PR #576 holds D-140.

Merge notes: the D-144 index row and the entry sit next to #576's D-140 row and entry (both at the end of the index table and the end of the file), so whichever merges second needs a trivial conflict resolution that keeps both. The new BACKLOG sub-section sits well away from #684 (which appends before the Appendix), #599, #587 and #621. CCO-6 and the files named for BL-775 to BL-777 are in #520 and exist on `develop` only after it merges; those rows say so.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments): not run in full; the groups below that read the three edited files were run
- [ ] `npm run test:db` passes: not run (docs only)
- [ ] `npm run typecheck` passes, including `apps/mobile`: not run (docs only)
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here (no tests changed)

Run, all on this branch, after the second review fixes: `apps/mobile` `qa-release-catalog.test.ts` and `billing-plan.test.ts` (50 passed; the latter reads CR-60); `packages/content` whole suite (13 files, 309 passed); `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs "compliance/**/*.test.mjs"` (159 passed, including the `lib.test.mjs` check that every backlog Owner is a roster name or the web lane); `node scripts/agents/check.mjs` (consistent, 394 backlog tasks); `node scripts/trace.mjs --no-write` (exit 0); `parseBacklog` reads BL-775 to BL-781 with the intended status, owner and blockers. Added lines carry no byte at or above 0x80. `apps/mobile/test/capabilities.test.ts` has one failure (an `expo config` call fails in this environment); it fails the same way without this change.

Not verified: that the quoted strings still match #520's head if that PR moves (read at 3ae9eab2); BL-776's cold-start path on a phone (read in code only); BL-779's claim about what Apple allows for TestFlight feedback (the row tells the author to read Apple's current documentation first); BL-777's statement that plan reminders stay (CCO-6's word, not re-checked); that FT-18 is the founder task the coordinator meant by the status ids (it is the closest: it sends counsel the packet).

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (docs only)
- [ ] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment: n/a
- [ ] Gates use `decide()` or `decideKeepLetter()`: n/a
- [x] Copy lives in `packages/content`: no copy added; the D-144 quotes are exact copies of strings that live there
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file: no database change
- [x] The public product name comes only from `packages/brand`: no name hardcoded

## Screenshots

n/a

Generated with [Claude Code](https://claude.com/claude-code)
https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
