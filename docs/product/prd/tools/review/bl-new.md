## Locked pack: the rest of the work (20 Nov 2026)

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

Written 20 Nov 2026 by Karma with the CPO role, docs only, after the requirements were locked (founder, 19 Nov: "I approve all requirements."; record `docs/product/prd/16-council-review-round-2.md`). Every row cites the card rows it satisfies; the card is the source of truth and wins where a row and a card differ. BL-950 and BL-951 are the engineering thread's (#832 follow-ups and NS-01-R17 iCloud progress); this section starts at BL-952. Facts were read on develop `4f89d659` and the open photo and Find stacks; nothing was run on a phone. No row turns a flag on in `production`. Device rows follow ruling D13 (a test install holding only the Asha book). Words marked PROPOSED need the founder's approval before any build outside his family shows them.

How the harness reads this section: a row is eligible when its Status is `ready`, or `blocked` on backlog ids that are all done, and every `Depends on` id is done (`scripts/agents/lib.mjs`). A row blocked on a counsel answer, a founder step or an unmerged PR names it in words, so the dispatcher leaves it alone until a person changes the status.

#### BL-952 Find on the phone, as at most six reviewable PRs (NS-02)
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M15. Size: L.
- Satisfies: NS-02-R1 to NS-02-R50 (`docs/product/prd/02-find.md`), P0 rows first; NS-35-R7 (Find never starts a letter).
- Problem: #798 is +2,511 lines in 37 files, far over the 400-line review limit, and it misses three locked rows: the index rebuild runs as one transaction (R35), the failed view is not announced to VoiceOver (R37), and typing has no debounce.
- Scope: split #798 into at most six PRs behind `EXPO_PUBLIC_BOOK_SEARCH` (off): (1) `letter_search` and `letter_search_rows` made by `ensureSearchIndex`; (2) `searchable_letters` as the one visibility view, with the seal clause slot; (3) `reconcileSearch` inside sync with the proposed budget of section 8; (4) the Find bar and results; (5) rebuild in batches of 200 off the first frame, silent scan fallback on `fts_unavailable` or corrupt; (6) `killSwitches.bookSearch`, the failed-view announcement and the debounce. The index lives in `scribe.db`; it is derived L4 data, never synced, exported or logged.
- Fails on old code: `[NS-02-R24]` (account B's index holds none of A), `[NS-02-R25]` (no query in a URL or route param), `[NS-02-R35]` (rebuild in batches).
- Done when: every P0 row of NS-02 passes, each PR has two counted reviews at its head, and the J-N2 device row exists.

#### BL-953 The stored picture follows ruling T3 (NS-01)
- Status: blocked (BL-931). Mode: agent. Owner: mobile engineer. Milestone: M15. Size: S.
- Satisfies: NS-01-R37a, R37b, R37c; ruling T3.
- Problem: the native writer caps at 4,096 px and quality 0.9, and an upright JPEG is stored at full size with no cap.
- Scope: the stored copy keeps the picked image at its own size up to 4,032 px on the long side, never below 2,550 px when the source is larger, JPEG quality 0.85, metadata stripped. Default for card open item O-1: an upright JPEG under 4,032 px keeps its own encoded pixels with metadata stripped. The camera original is never stored.
- Fails on old code: `[NS-01-R37a]` with a 6,000 px fixture and `[NS-01-R37c]` with an upright 5,000 px JPEG.
- Done when: R37a to R37c pass; the export golden fixture for Asha still matches.

#### BL-954 Undo windows wait for VoiceOver and never leave a dead button (NS-01, NS-06, NS-33)
- Status: blocked (BL-931). Mode: agent. Owner: mobile engineer. Milestone: M15. Size: S.
- Satisfies: NS-01-R38a to R38c, NS-06-A2b, NS-33-R15; ruling T4.
- Problem: the photo Undo toast never times out, but `undoPhotoChange` stops working after 10 seconds, so a dead Undo stays on screen.
- Scope: one shared undo-window helper: open for its stated seconds, or until VoiceOver has finished reading the undo line plus that many seconds, whichever is later; with Switch Control on, until the parent moves on. The toast and the action expire together.
- Fails on old code: `[NS-01-R38b]` (the button is gone when the action has expired).
- Done when: the three rows pass and every undo in the app uses the helper.

#### BL-955 A picked picture survives the app closing before Review (NS-01)
- Status: blocked (BL-931). Mode: agent. Owner: mobile engineer. Milestone: M15. Size: S.
- Satisfies: NS-01-R43.
- Problem: the picked picture is stored with the draft only once Review opens; a kill before that loses it.
- Scope: write the stored copy and the `entry_media` row against the draft as soon as the pick returns; the photo sweep removes an orphan file after a kill between file and row (NS-01-R32 shape).
- Fails on old code: `[NS-01-R43]` with a kill injected after the pick.
- Done when: R43 passes and the sweep test for orphans passes.

#### BL-956 Pictures at large text, in Smart Invert, uncropped, and a light Photos lens (NS-01, NS-37)
- Status: blocked (BL-931, BL-932). Mode: agent. Owner: mobile engineer. Milestone: M15. Size: M.
- Satisfies: NS-01-R39, R40, R42, R48, R53; NS-37-R3 to R8.
- Problem: at large text the thumbnail grows to screen width; there is no Smart Invert opt-out; the thumbnail crops; the lens choice is Buttons in a tab list; the lens decodes full stored copies in a list that is not virtualised.
- Scope: the large-text form the card states (default 88 pt thumbnail above the capture cluster, `design-systems` confirms); `accessibilityIgnoresInvertColors` on every picture; fit, not crop; the lens control as a radio group (`ChoiceGroup` or `ChipGroup`); the lens reads only the 512 px copy in a virtualised list.
- Fails on old code: a layout test at AX5 and a source check that the lens list imports no full-size path.
- Done when: the rows pass and BL-929's sheet has the Photos lens scroll row.

#### BL-957 One length rule for typed words that become part of a letter (NS-01, NS-06, NS-16)
- Status: ready. Mode: agent. Owner: mobile engineer, data architect. Milestone: M15. Size: S.
- Satisfies: NS-01-R54; NS-06-A (label ceiling); NS-16-R1, R6.
- Problem: three counters disagree: the database checks code points, the field's `maxLength` counts UTF-16 units, and `text.ts` counts graphemes. A 30-character name in Devanagari can hit the database limit before the field says so.
- Scope: the app counts graphemes and refuses before save; the database ceiling stays in code points and is set high enough for the grapheme limit in every launch script (photo words 140, place 60, Firsts label 40 graphemes with a 200 code point ceiling, From name 30 characters as built). One helper in `packages/core`.
- Fails on old code: a property test over Devanagari, Arabic and emoji-free CJK fixtures at each limit.
- Done when: the property test passes and each field uses the helper.

#### BL-958 Build profiles carry the new flags, and the free-space check is size plus 50 MB (NS-01, NS-02)
- Status: ready. Mode: agent. Owner: platform. Milestone: M15. Size: S.
- Satisfies: NS-01-R45; the flag rows of NS-01 and NS-02 (on in preview and testflight, off in production).
- Scope: `apps/mobile/eas.json` preview and testflight profiles set `EXPO_PUBLIC_PHOTOS` and `EXPO_PUBLIC_BOOK_SEARCH` on, production leaves them off; `preflight-production.mjs` fails a production build that turns either on before its gates are recorded. The photo free-space check becomes the picked size plus 50 MB.
- Fails on old code: `release-config.test.ts` gains the two flags; `[NS-01-R45]`.
- Done when: the tests pass. Release config is T2: two counted reviews of different lenses.

#### BL-959 Ids are L3 in ADR 0028 and migration 11 (X10)
- Status: blocked (PR #797 merged on develop). Mode: agent. Owner: data architect. Milestone: M15. Size: S.
- Satisfies: NS-36-R4; council finding X10; `DATA_CLASSIFICATION.md` rule 5.
- Scope: `entry_media.entry_id`, `draft_id` and `letter_search_rows.entry_id` are L3 in ADR 0028 and in the #835 migration comment.
- Done when: both say L3 and NS-36-R4 can pass.

#### BL-960 The data inventory home matches what is built (X2)
- Status: ready. Mode: pair. Owner: privacy engineer. Milestone: M15. Size: S.
- Who: `privacy` with `data-architect`; the founder merges anything under `docs/legal/**` (D-125).
- Satisfies: NS-36-R6; council finding X2.
- Problem: `docs/legal/data-policy.md` section 4 is 1.2.0 and still says no audio leaves the phone in v1.0 and calls backup "planned".
- Scope: bring section 4 to Build 12 facts (D-100, D-157, D-159; bucket `entry-audio`), then add the rows the locked cards name (stored copy, the two smaller copies, photo words, place, the Find index, Firsts, seal columns), each with class, store, sync, retention, deletion path, export and log rule, in the same PR in both files.
- Done when: drafted for the founder's merge; every new-data card cites its row.

#### BL-961 A second account never sees the first account's book, and sign-out says so (X4, D1)
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M15. Size: M.
- Satisfies: `[X4-R1]` (cited by every card); ruling D1; NS-01-R29, R30; NS-02-R24; NS-10 second-account rows.
- Scope: after sign-out (local scope, as built) and sign-in as account B on the same phone, B never sees, claims or uploads account A's local letters, pictures, Find index or reminders; sync stops on a mismatch (ADR 0023) and the UI shows A's book to no one but A. The sign-out sheet carries the D1 line as a PROPOSED key from `content` (BL-965).
- Fails on old code: `[X4-R1]` as an integration test over the store with two seeded accounts.
- Done when: `[X4-R1]` passes and the J-N sign-out journey is a device row.

#### BL-962 Letter words stay out of system intelligence and system writing tools (X6, D2, D3)
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M15. Size: S.
- Satisfies: `[X6-R1]`; rulings D2 and D3; NS-01-R49, R50; NS-02-R26; NS-06-A22; NS-21-R12.
- Scope: a source scan that fails on `CSSearchableIndex`, `isEligibleForSearch` or an `AppEntity` built over letters, children or prompts; writing tools off on the Review editor, the Firsts label, picture words, place, typed-day words, the From name and the letter page's words sheet. First find out whether React Native exposes the switch (`writingToolsBehavior` or a native prop); if it does not, record that as a finding on the card and in `docs/agents/cto/RULINGS.md`, not a silent pass.
- Fails on old code: the scan finds no violation today, so the first PR adds a fixture that proves the scan fails on one.
- Done when: the scan runs in `npm test` and the writing-tools finding is recorded either way.

#### BL-963 Home slips: one registry, one fixed order (FRAME-SLIP)
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M15. Size: S.
- Satisfies: `[FRAME-SLIP]`; `00-product-frame.md` slip order; NS-23-R6, R18; NS-11 slip rows.
- Scope: a registry of Home slips in one order: (1) the existing waiting cards in their existing order; (2) the seal-opened line on its day; (3) Save a copy in the birthday week; (4) one past letter. At most one slip shows. The reminder ask sheet and the Plus line are not slips; the photo start is part of the capture cluster. A test fails when an unregistered slip renders. The #721 day-zero card is not registered and leaves #721.
- Fails on old code: the registry test with a stub slip.
- Done when: the test passes and #721 is reconciled or superseded.

#### BL-964 Traceability sees the NS ids (gate G0)
- Status: ready. Mode: agent. Owner: qa engineer. Milestone: M15. Size: S.
- Satisfies: gate G0 (`14-test-plan.md`); council finding F1.
- Problem: `scripts/trace.mjs` matches only `X-REQ-nnn` and `X-NFR-nnn` under `docs/prd/v2`, so no NS row is traceable. #819 (draft) does part of it.
- Scope: rework #819 or replace it: read `docs/product/prd/` as a second source, match `NS-nn-Rnn` and the split and lettered forms (`R9a`, `A2b`, `C28-13`, `B8b`), and the cross-cutting ids `X4-R1`, `X6-R1`, `FRAME-SLIP`; a ratchet that fails when a P0 row in `14-test-plan.md` section 7 has no test title found in the code.
- Fails on old code: `trace.test.mjs` gains a fixture card with one NS row.
- Done when: `node scripts/trace.mjs` lists every P0 row with found or missing, and the ratchet is on in CI.

#### BL-965 Words for the locked pack
- Status: ready. Mode: agent. Owner: content. Milestone: M15. Size: M.
- Satisfies: the content inputs of every locked card (section 19 of each); BRAND.md glossary (CR-25).
- Scope: PROPOSED keys in `packages/content` for: `photosCopy`, `findCopy` (including "No letters with that word." without "yet"), the sign-out sheet (D1), the account-deletion text for pictures (replace `pages.en.ts:240`), the where-it-lives keys naming pictures (NS-01-R32), the sealed-letter deletion line (D6), the earlier-versions line (D8), the NS-16 speaker instruction (D9), reminder copy for the back-off (NS-13), Save a copy (NS-11), one past letter and its switch (NS-23), the new-phone book-level line (NS-10). "Printable", never "print-ready". No fear, guilt, loss or AI-writes language; `{child}` only.
- Fails on old code: the content rules test runs on the new keys.
- Done when: merged as PROPOSED, and the founder's word approvals are listed in one founder step.

#### BL-966 One notification budget, with plan notices outside it (NS-32)
- Status: ready. Mode: agent. Owner: reminders owner. Milestone: M15. Size: M.
- Satisfies: NS-32-R1 to NS-32-R16, including R1b (one notification a day across all books) and R4 (64 pending on iOS).
- Problem: the planner keys notes by kind and date (`planner.ts:313-316`), so a birthday for one child and a month note for another on one day schedule two notifications. #758 is a Memory Library test PR whose registry includes `occasion` (parked NS-31).
- Scope: rework #758 into `lib/reminders/budget.ts` with classes evening, monthAge, birthday, typedDay, plan; plan notices sit outside the budget; at most one notification per local day across books, priority typed day, birthday, month note, evening; at most 60 pending, plan notices kept first; no Memory Library classes.
- Fails on old code: `[NS-32-R1b]` with two books and a birthday and a month note on one day.
- Done when: every NS-32 row passes, including R4 at 64 pending; BL-943 can start.

#### BL-967 Signing out cancels reminders (NS-13)
- Status: ready. Mode: agent. Owner: reminders owner. Milestone: M15. Size: S.
- Satisfies: NS-13-R14.
- Problem: sign-out (`session-provider.tsx:293-307`) never calls `forgetReminders`; only Erase everything does (`erase-everything.ts:84`). A signed-out phone keeps firing reminders.
- Scope: sign-out cancels every pending reminder and clears the plan; signing back in re-plans from settings.
- Fails on old code: `[NS-13-R14]`.
- Done when: R14 passes.

#### BL-968 Firsts: mark a letter as a first, with a short label (NS-06 Part A)
- Status: blocked (BL-939, BL-981). Mode: agent. Owner: mobile engineer, sync owner. Milestone: M15. Size: M.
- Satisfies: NS-06-A1 to NS-06-A25 (`docs/product/prd/06-firsts-sealed-letter-quick-capture.md`).
- Scope: local and server migrations for `first_mark` and `first_label` (at most 40 graphemes, 200 code point ceiling); the server migration also adds both columns to the `entries` content trigger tuple and recreates `book_entries` (latest in `20261015030000_v1_wire_contract_columns.sql`); sync field group `first`; export 1.8.0; the Firsts lens; undo per BL-954; behind `EXPO_PUBLIC_FIRSTS`. No machine ever suggests or detects a first.
- Fails on old code: SQL tests that a non-consented write of `first_label` is refused by the content trigger and that the other parent sees it through `book_entries`.
- Done when: every P0 row of Part A passes and the grants test lists any new function.

#### BL-969 Sealed letters: the server keeps a seal until its day (NS-06 Part B)
- Status: blocked (BL-968, BL-959). Mode: agent. Owner: data architect, sync owner. Milestone: M15. Size: L.
- Satisfies: NS-06-B1 to NS-06-B26, including the two-phone test `[NS-06-B8b]`; ADR 0028 D3 and D3a.
- Scope: `seal_opens_at` (TIMESTAMPTZ, the rule) and `sealed_until` (DATE, display); `book_entries` and the non-author read paths add `seal_opens_at IS NULL OR seal_opens_at <= now() OR author_id = auth.uid()` (`entries_select` is already author-only); content trigger additions; seal publication by option (b) of card section B10.1, the pull clause returning rows whose `seal_opens_at` falls between the last pull and now (option (a) only after pg_cron and pg_net are proven on production); an account deleted before the day deletes the sealed letter (D6, by construction).
- Fails on old code: SQL tests for the non-author read, `book_entries`, the content trigger, and the pull clause window.
- Done when: every server P0 row passes and `sync` has proved the option (b) merge on two phones.

#### BL-970 Sealed letters on the phone: seal, wait, open (NS-06 Part B)
- Status: blocked (BL-969). Mode: agent. Owner: mobile engineer. Milestone: M15. Size: M.
- Satisfies: the phone rows of NS-06 Part B, including B4 (the seal-opened Home slip, registered in BL-963) and B11 (latest seal day the child's 25th birthday, founder default).
- Scope: seal at Keep (the author uploads at Keep); Open now nulls both columns; the sealed letter is hidden from Find, the past-letter slip, Read together, Share and print until its day; no countdown, no count.
- Done when: the phone P0 rows pass and the two-phone device row exists.

#### BL-971 Quick capture doorways, only when ready on that phone (NS-06 Part C)
- Status: blocked (BL-972). Mode: agent. Owner: mobile engineer. Milestone: M15. Size: M.
- Satisfies: NS-06-C1 to NS-06-C11; closed rule 6 of the 19 Nov exec record (no "coming soon" doorway).
- Scope: each doorway the spike recommends, behind `EXPO_PUBLIC_QUICK_CAPTURE`; a doorway shows only when it works on that phone; no remote switch turns one on (the `remoteConfig.doorways` allowlist is withdrawn); every doorway lands in `startCapture` (NS-35). "Nothing leaves your phone" never sits next to a Siri doorway.
- Done when: the P0 rows pass for each doorway shipped.

#### BL-972 Hands-free capture spike (NS-04)
- Status: blocked (BL-935). Mode: pair. Owner: speech engineer. Milestone: M15. Size: M.
- Who: `speech` with `mobile`; time-boxed; branch `exp/hands-free-spike`, never merged.
- Satisfies: NS-04-R1 to NS-04-R9, questions Q1 to Q15, exit lines EX-1 to EX-5.
- Scope: answer the card's questions on a separate bundle id and an Asha-only install; record which paths Apple processes audio for; report against the exit lines. Start date is set in the roadmap.
- Done when: the read-out is merged under `docs/research/` with a go or no-go per doorway.

#### BL-973 Printable book (PDF) (NS-07 C28)
- Status: blocked (BL-933). Mode: agent. Owner: export owner. Milestone: M15. Size: M.
- Satisfies: NS-07-C28-1 to NS-07-C28-19.
- Scope: `lib/export/print-pdf.ts` behind `EXPO_PUBLIC_PRINT_READY`; bundled OFL faces (Noto Serif and the faces that cover the launch scripts), with a licence row; page size 8.5 x 8.5 inches (provisional founder default); stored copies at print size; no fix marks shown as edits; "Printable", never "print-ready". No proof-book spend.
- Fails on old code: a golden PDF text test for the Asha book.
- Done when: the P0 rows pass and the CLO evidence on embedding the fonts is on the card.

#### BL-974 Quiet days stay the author's own (NS-07 C5)
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M15. Size: S.
- Satisfies: NS-07-C5-1 to NS-07-C5-13.
- Scope: quiet marks stay `inBook: false` (`quiet-day.logic.ts`), never seen by the other parent; two phones of one author show one mark (display dedupe, C5-10).
- Done when: the P0 rows pass.

#### BL-975 The privacy label guard (NS-07 G11)
- Status: ready. Mode: agent. Owner: platform. Milestone: M15. Size: S.
- Satisfies: NS-07-G11-1a to NS-07-G11-5; council findings X8 and F11.
- Scope: a script under `scripts/` that fails when (a) a card heading `## NS-` has no `**Label effect.**` line before the next card; (b) a PR changes the label file without a decision in `docs/DECISIONS.md` on the base branch naming the label; (c) a PR adds an SDK, an entitlement or a usage string without a label-file change. The CI job is a proposal under `docs/ops/proposed/` until the founder applies it (D-124).
- Fails on old code: fixtures for each of (a) to (c).
- Done when: the script and its tests merge and the workflow proposal is written.

#### BL-976 Recording backup readiness: reads, sizing and the seventh condition (NS-08)
- Status: blocked (PR #622 merged). Mode: pair. Owner: sync owner, security engineer. Milestone: M15. Size: M.
- Who: `sync` with `security-architect`, `privacy` and `ops`; the founder decides the flip.
- Satisfies: NS-08-R1 to NS-08-R9 (the flip rows R10 to R19 wait for the founder's decision).
- Scope: read the read path and the restore path; rehearse the escrow drill on the scratch slot; the sizing note (19 MB per active family per month, about 52 family-months on Free, prices read with a date); the label and policy diff drafted for counsel; the seventh condition (Storage is not in the nightly dump on Free: decide a backup of the backup). Backup stays off.
- Done when: the readiness note is merged and the founder has the seven conditions with evidence for each.

#### BL-977 Let it go always finishes: the remaining rows (NS-09)
- Status: blocked (BL-925, BL-926). Mode: agent. Owner: mobile engineer, sync owner. Milestone: M15. Size: S.
- Satisfies: NS-09-R9 to NS-09-R17; ruling D7.
- Scope: the failure counter survives a restart (`discard.failures.<draft id>`, R6); `sync` reports what the server does with a let-go held draft, then the server copy is purged once the discard is acknowledged (D7).
- Done when: the rows pass and the `sync` report is on the card.

#### BL-978 A new phone: close the last gap (NS-10)
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M15. Size: M.
- Satisfies: NS-10-R0 to NS-10-R14 (R4 is withdrawn; R4a and R4b replace it).
- Scope: the kill switch at sign-in; retry after a lost `sync_books` answer; one Book-level line when backup is off instead of a line on every letter; `sync` answers whether `sync_pull` serves rows while consent is outstanding. Builds on BL-922.
- Done when: the P0 rows pass and the two-phone device row exists.

#### BL-979 Earlier versions of my own words (NS-12)
- Status: blocked (counsel Q51, Q32, Q48 answered). Mode: agent. Owner: data architect, mobile engineer. Milestone: M15. Size: L.
- Satisfies: NS-12-R1 to NS-12-R8; ruling D8.
- Scope: a read RPC for the author's earlier versions, with its grant in the same migration and a line in `supabase/tests/grants.mjs`; the letter page row (BL-937 list); the author may remove an earlier version; the raw transcript stays immutable; the screen says versions are kept until removed. `data/other-versions.json` in the export holds only phone conflict copies today; the card says what export gains.
- Done when: the P0 rows pass and the grants test is green.

#### BL-980 Someone else speaks: the From name on Review (NS-16)
- Status: blocked (counsel Q45, Q46, Q48, Q54 answered). Mode: agent. Owner: mobile engineer. Milestone: M15. Size: S.
- Satisfies: NS-16-R1 to NS-16-R18; ruling D9.
- Scope: `entries.author_signs_as`, 1 to 30 characters, set on Review only and only before the letter's first upload (insert-only in sync; a later change is ignored today, and the card requires the app to say so); the instruction line to the parent (D9), no consent record; erase and sign-out clear the local name list; Find does not index it (founder default). Behind the PRIV-R20 `child-input` flag, off in production.
- Fails on old code: `[NS-16-R6]` (over 30 characters refused before upload).
- Done when: the P0 rows pass.

#### BL-981 Five-parent studies: photo, Find, share, Firsts
- Status: blocked (BL-931, BL-952). Mode: pair. Owner: user researcher. Milestone: M15. Size: M.
- Who: an interactive session as `user-research`; the founder runs the sessions.
- Satisfies: the study lines of NS-01 section 9, NS-02 section 9, NS-05 section 11, NS-06 Part A.
- Scope: one plan per study, triggered by the build being in TestFlight; hand-sent numbers only, kept by the founder and deleted after 90 days (D5); results as counts in the repo, never quotes or names.
- Done when: each read-out is merged as counts and the card's go line is met or not.

#### BL-982 Typed days in reminders (NS-18)
- Status: blocked (BL-966, BL-943). Mode: agent. Owner: reminders owner. Milestone: M15. Size: S.
- Satisfies: NS-18-R1 to NS-18-R8.
- Scope: settings keys `typedDay.<yyyy-mm-dd>`, never synced or exported (default), deleted the day after delivery, cleared by erase and sign-out; the typed day outranks other notes on its day (NS-13-R29).
- Done when: the P0 rows pass.

#### BL-983 The other parent in the store app (NS-25)
- Status: blocked (PR #827 merged; counsel Q48, Q49, Q53 answered). Mode: agent. Owner: family owner. Milestone: M15. Size: L.
- Satisfies: NS-25-R1 to NS-25-R19; ruling D11; D-161, D-162.
- Scope: the co-parent rows BL-882 to BL-889 merged first; the inviter's 72-hour undo only (D11) until Q53; BRAND.md line 40 corrected; Plus outside one Apple Family follows D-053 (founder default kept). No "coming soon" surface in any build.
- Done when: every P0 row passes on two phones.

#### BL-984 Accessibility floor beyond VoiceOver (NS-33)
- Status: blocked (BL-928). Mode: agent. Owner: mobile engineer. Milestone: M15. Size: M.
- Satisfies: NS-33-R9 to NS-33-R16.
- Scope: Voice Control names match visible labels; Switch Control reaches every action; Smart Invert leaves pictures alone; the recording state never depends on colour alone; Bold Text reaches our three custom fonts (check on a phone first); undo windows through BL-954. No Accessibility Nutrition Label is declared until the device walk passes (founder default).
- Done when: unit rows pass and the device walk rows are in BL-948.

#### BL-985 Quiet this book has a home (F12-REQ-011, NS-22)
- Status: ready. Mode: agent. Owner: mobile engineer. Milestone: M15. Size: S.
- Satisfies: F12-REQ-011 (P0); NS-22-R5 to R7.
- Problem: `setChildQuiet` exists in `store.ts:390` with no UI. Hide lives in Me under the book's page.
- Scope: the Quiet control beside Hide in Me under the book's page, using existing keys; no new words without `content`.
- Fails on old code: a test that the book's page in Me renders the Quiet control.
- Done when: the test passes and BL-948 has its device row.

#### BL-986 Read-along needs word timings on the phone (NS-29, parked)
- Status: deferred (NS-29 is parked). Mode: agent. Owner: speech engineer. Milestone: M15. Size: M.
- Satisfies: the NS-29 decision record.
- Problem: `entries.stt_meta` exists on the server, but the phone does not store it (`transcribe.ts:53`) and the export writes `stt_meta: null` (`build.logic.ts:689`).
- Scope: when NS-29 is taken up, store per-token timings on the phone and export them. Nothing now.

#### BL-987 Engineering facts the cards are waiting on
- Status: ready. Mode: pair. Owner: sync owner, data architect, mobile engineer. Milestone: M15. Size: S.
- Who: each lane answers its own line on the card it names; Karma rules where an answer changes a card.
- Scope: `sync`: today's server behaviour for a let-go held draft (NS-09, D7); whether `sync_pull` serves rows while consent is outstanding (NS-10); that the pull parser tolerates an unknown response key (NS-06 B10.1). `data-architect`: the B10.1 choice (default b); whether `held_drafts` allows nulling a withheld take's words (NS-17). `mobile`: whether expo-notifications sets `hiddenPreviewsBodyPlaceholder` (NS-13-R33); whether Read together keeps the screen awake (NS-24-R9); `Intl.Segmenter` on Hermes (BL-957).
- Done when: each answer is a dated line on its card.
