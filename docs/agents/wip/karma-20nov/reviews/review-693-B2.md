## Review B at 0c2370b6aec9c7a6460f9f82e86a59e176498362: PASS WITH NOTES

Delta review of Lens B after my CHANGES at 12034706. Both must-fix items are fixed and every new claim I checked is true against #520 on develop (73fcc1ea). What is left are nits, one of which contradicts the coordinator's summary (stale "#520 not merged" text still sits in three places).

**What I read and ran** (worktree at the new head; merge-base is still develop 73fcc1ea)
- Head from `gh api` equals 0c2370b6aec9c7a6460f9f82e86a59e176498362. `git diff 12034706 0c2370b6`: two files, `docs/BACKLOG.md` (+19/-11) and `docs/DECISIONS.md` (+1/-1). No code or test file changed, so the 4 pin tests and my earlier mutation result stand; `erase-all.test.ts` still 55 pass at this head.
- `node scripts/agents/check.mjs`: consistent (395 tasks, one more than before). `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs`: 136 pass. `trace.mjs --no-write`: exit 0. `packages/content` claims-capabilities, rules and no-real-family-data: 157 pass.
- Parser (`lib.mjs` parseBacklog): BL-387 status `done` (statusText runs through "BL-782", owners and mode intact). BL-775 and BL-781 `ready`, `eligibility` ok. BL-776 and BL-777 `needs-decision`, not eligible. BL-782 `needs-decision`, mode agent, owner mobile engineer, not eligible; 395 unique ids.
- Ids: `id-collisions.mjs` live shows BL-782 added only by #693 (its one collision line is D-139, #591, unrelated). My scan of every open PR's BACKLOG/DECISIONS patch finds BL-782 only in #693. GitHub search finds BL-782 only in #693 and #692, and #692's mention is a comment saying `next-id.mjs` printed BL-782 then; it defines nothing. `next-id.mjs` in the worktree prints BL-783 (it counts this PR).
- Added lines (19 in the delta, 0 non-ASCII bytes in the whole PR): no dashes, curly quotes, ellipsis, emoji, gendered child words. "Asha" appears once, in BL-782's acceptance, as the fictional family.
- CI at this head: `required` success; tests and content rules, typecheck, database rules, Deno, both compliance-fence runs, migrations unchanged, no-e2e-seam, agent team consistent all success; iOS simulator build skipped; "store-profile Release launch" still in_progress at my last look. A PASS holds only once required CI is green at this exact head; `required` is green now.

**New BL-387 text against #520 on develop**
- "Delete this book is a 30-day hold, restorable": `store.ts` deleteBook comment and `lib/README.md:54`; gone from the phone via Erase now or the day-30 launch purge. True. "Gone from the Book tab, Tonight, Export and the reminders": lists and Export by `LISTED`/`BOOK_NOT_DELETED_SQL`; reminders read `listChildren()` and the store subscription reschedules. True in code, not run on a phone.
- "last in Your letters ... (it was Your data before the #614 regroup)": #614 is merged (e229f2c6) and its parent's `settings/index.tsx` has `sections.data` = "Your data". The row is in Your letters at `index.tsx:152-156`. True.
- "typed word for Delete this book and a confirm alert for Erase everything": `delete-book.tsx` uses `typedWordMatches`; `erase.tsx` uses `eraseConfirmDialog`, no typed word; S1-133 (a) and (d) agree. True.
- Test line: `age-gate-erase.test.ts` and `reminders-erase.test.ts` both exist and were added by #520; `git show --stat 73fcc1ea` touches no `e2e-web` file and not `store.repos.test.ts`, so "#520 adds no erase steps to J03 or J16 and no erase cases to store.repos" is true. "55 cases" is the current count (51 from #520 plus the 4 pins here).

**BL-782's facts**
- `erase.tsx:29` says device owner authentication is deferred to the 1 Dec build by the CTO ruling of 8 Nov (#640 is the app lock). The ruling is in the #520 body (line 67) and in comment 6719788405, and not in `docs/agents/cto/RULINGS.md`: so "in the PR conversation and not in RULINGS.md" is true. #640 is merged (8 Nov, 17:21 UTC). The app lock does hold the authentication code (`lib/app-lock/controller.ts` uses `LocalAuthentication`, including a no-passcode level), so "the same authentication the app lock uses" is real. S1-133 "Not covered" names the deferral. F17 6.2 F step 1 does require owner authentication.

**Notes (none blocks)**
1. Stale "#520 is not merged" text remains, although the summary said it was gone: BACKLOG.md:2880 still ends "exist on `develop` only after it merges" (I checked the line refs it names, `store.ts:1030`, `erase-everything.ts:124`, `erase-all.test.ts:588`, `erase.tsx:80`, all hold at 73fcc1ea, so say "hold at 73fcc1ea"); BL-781's Problem (:2953) says "#520 ... merges first"; BL-781's Requirement (:2954) says "#520 as written still says Your data", which is false now (the merged header and strings say Your letters), and a content agent will read it. DECISIONS.md:1115 still says CCO-6 is "not on develop until it merges" (it is on develop now).
2. BL-782 status is `needs-decision (CPO; deferred ...)` with mode "agent after the ruling", but the repo records no open question for the CPO (the CTO already ruled it to 1 Dec). Say what the CPO is asked to confirm (the 1 Dec slot), or use `deferred (1 Dec build ...)` like BL-586. Both keep the dispatcher off it.
3. BL-782 cites "design 2.12", which is the account-security proposal's design.md, not in the repo (docs/design/COMPONENTS.md 2.12 is "Sheet"). Name it as a Project document, as BL-777 does for content.md. Its "Who:" line is a persona where the neighbouring rows list lanes and reviewers; an authentication change wants a `security` or `ciso` review lane named. "Two taps and an alert" is loose (row, button, alert Erase).
4. Formatting: two blank lines before `#### BL-782`, none before `### Speed, size and release evidence`. D-144's Follow-ups still says "BL-775 to BL-781" then adds BL-782 in the same sentence; fine, but "is the one deferral" is a claim about all follow-ups, so soften it.
5. Carried from my first review, unchanged and not blocking: four "ERASE_ROW ... once merged" placeholders (`where-letters-live.tsx:27`, `:89`, `privacy.tsx:36`, `:139`) and the `[DATA-REQ-024]` tag on a reachability-only pin.

**Not verified**
- Any phone behaviour (the S1-133 check is the founder's and the record says so). Whether dispatch is paused. Whether the Release-launch job passes. `tsc` (relied on CI typecheck: success).

Reviewer: independent of the author (CR-44).
