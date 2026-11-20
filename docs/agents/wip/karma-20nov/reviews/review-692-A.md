## Review A at 718513c78112ee715a945270a251c5068102e395: PASS WITH NOTES

Lens A (facts, ids, mechanics) on PR 692, docs only: 3 files, +104 -2 (DECISIONS.md D-144, BACKLOG.md BL-775 to BL-781, cto/RULINGS.md CR-60). Head confirmed by gh api as 718513c7. Worktree at that sha; develop moved from the merge base 6ca2491a to 461b9645 (2 commits, no overlap with these files).

### What I ran
- Strings: extracted strings.en.ts from pull/520/head (3ae9eab2, unmoved) and compared the six strings quoted in D-144 (body, onThisPhone, freeLetters, backups, failed, plusStays) by script against copy.settings.erase: 6 of 6 byte-identical. The quoted fragments in BL-775/777/780 (failed tail, doneA11y, Terms 8.1 phrase, 0.9.0 Privacy phrases) are exact substrings of their sources.
- Ids: pulled the file patches of all 142 other open PRs (REST) and scanned added lines for D-138..150 and BL-770..800. D-144 is referenced only by #664 as "printed by next-id.mjs, free" (not allocated). BL-775 to BL-781 appear nowhere; highest used elsewhere is BL-774 (#684). D-140 (#576), D-141/D-142/D-143 holds (#638, #664) confirmed. develop max is D-139 and BL-603. id-collisions.mjs lists #692 with no collision (its only COLLISION is the old D-139 in #591).
- node --test scripts/agents/*.test.mjs scripts/trace.test.mjs "compliance/**/*.test.mjs": 159 pass. check.mjs: consistent, 394 tasks. trace.mjs --no-write: exit 0. I parsed the new rows with parseBacklog/ownerMap: owners resolve (mobile, content, ops, legal; "web lane" is the declared external owner, same as other rows).
- apps/mobile billing-plan + qa-release-catalog: 50 pass. packages/content: 13 files, 309 pass. capabilities.test.ts: 1 fail (`expo config` fails in a hard-linked worktree), unrelated to docs, same as the PR body says; I did not run it on develop.
- Banned characters: 0 non-ASCII bytes on added lines, no "..." or " -- ", git diff --check clean.
- merge-tree: clean against origin/develop, #520 head, #684, #621. Conflicts against #576: DECISIONS.md only, two hunks (index row and entry, D-140 vs D-144), keep-both is right. #599 and #587 conflict with develop on their own, so not caused by this PR.
- CI at this head: 10 check runs, all success (required, typecheck, tests and content rules, database rules, Deno, B-8, compliance-fence, migrations unchanged, install, agent team consistent). mergeable_state clean. A PASS holds only while required CI stays green at this exact head.

### Row-by-row facts (all read at file:line)
- BL-775: store.ts:1030 eraseEverythingLocal, erase-everything.ts:124 resumeEraseAtLaunch (not store.ts), erase-all.test.ts:588 all match #520's head; behaviour described is what the code does (mark kept, every row then present removed).
- BL-776: develop book.tsx:318 and index.tsx:203 redirect to /onboarding, settings/index.tsx:52, privacy.tsx:138, letter/[id].tsx:549 are right at 6ca2491a as the row says; onboarding.tsx has no Settings route. #520's own body (line 185) admits the sole-book kill and relaunch step is not in S1-133.
- BL-777: erase.tsx:80 announces doneA11y; S1-133 (h) reads it back. The row leaves "plan reminders stay" unchecked: I checked it. forgetReminders cancels only source scribe.reminders; plan reminders use scribe.plan, and S1-133 (f) says they stay. True.
- BL-778: LEGAL_CONTENT_DIR is read at documents.ts:49 and appears nowhere else in tracked files except CR-60 and the new row. True.
- BL-779: underage-account.md, stuck-deletion.md exist; no runbook for the other routes; BL-551 ops_open_account_deletion is in no migration; DSR-R02 and DSR-R05 say what the row says (including the support-mailbox log); 0.9.0 Privacy sections 7, 9, 10 and Terms 10.1 contain the quoted promises, and 45 days.
- BL-780: COUNSEL_PACKET 1.5.0, last question Q57, no keychain/erase/8.1-reset entry (grep empty); Terms 4.1.0 8.1 sentence and D-083 Keychain ask are as quoted; strings.en.ts:1283 footer holds at the merge base (it is :1294 on current develop).
- BL-781: inventory path exists, S12 contains "Erase everything" UI not opened; CMO keeps the registry per COUNCIL.md.
- CR-60: word diff is exactly the four fixes. e2e hash lines 18 and 19 are the two sha256 pins and equal the served files and #616's table; POLICY_VERSIONING.md line 69 says what CR-60 now says; #616's note (line 65 of its body) matches the parenthetical.

### Must-fix
None.

### Should-fix (not blocking)
1. D-144 item 2, "approved for the app only", sits under "Decision (the founder's, except item 4)". CCO-6 says that limit is the marketing seat's condition and "the founder has not decided it". D-144's own "Not decided here" is correct. Suggest: "(the founder's, except item 2's limit, which is CCO-6's condition, and the hold in item 4)". D-132 lets Karma merge entries that record his own words, so the attribution matters.
2. "ships in build 12" (index row and Founder's words) is in neither CCO-6 nor #520's body (those say after the 9 Nov go/no-go, before 1 Dec). #688 calls build 12 the first public store build, so it is plausible, but I cannot confirm it was in the question he answered. Confirm from the session or drop the words.
3. BL-780 says #598 "holds Q61 to Q74". #598 also proposes Q58 to Q60 (TestFlight questions), so "next free Q" is Q75 until #598 lands. Say Q58 to Q74.
4. BL-775 is S2 while the legend (BACKLOG.md:2530) puts "can lose a word" at S0. One line on why S2 (person-started erase, warned on that page, store build only, nothing ships before 9 Nov) would pre-empt the question.

### Nits
- BL-778 says "no test would notice". CR-60's post-deploy `curl | sha256sum` checks (#616 step 6) would; mention them.
- BL-779 could cite chapter 08's request matrix and DSR-R01 (it already names record_policy_act support_assisted for withdraw consent and "a runbook" for correction) and the 10-business-day receipt confirmation in its Deadlines table.
- BL-776 line numbers: settings/index.tsx is :56 on current develop (after #614); the row cites 6ca2491a, so it is honest.
- Who lines use `design` and `web`, not roster handles (two other rows already do; Who is not parsed).

### Not verified
- The three option labels as the founder typed them (session only; only "Versioned URLs only (Recommended)" appears elsewhere, in CR-60).
- BL-776 on a phone (code read only, as the row says). Apple's TestFlight feedback rules. Hosting-project env vars (could not see Vercel settings).
- capabilities.test.ts failure on develop. No device step needed for a docs PR; S1-133 exists only on #520.

Reviewer: independent of the author (CR-44).
