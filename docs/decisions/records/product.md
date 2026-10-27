# Product

What v1.0 is and is not: scope, family roles, first run, letters and the release split between v1.0 and later versions.

### D-002 Family at v1.0: co-parent and family contributors in the app; web page in v1.1
- **Source:** `docs/DECISIONS.md` D-002 (Decided, founder, 2026-10-03)
- **Decided:** v1.0 ships co-parent and Family (contributor) roles in the iOS app, with invites by link or code, approvals by either parent and per-child sharing. The web contribution page, anonymous web identity and browser audio encryption move to v1.1.
- **Why:** grandparents writing is a core research finding (UR R14); the web page is a second product and removes the riskiest security surface from v1.0 (TDD 04 finding 2).
- **Alternatives:** co-parent only (TDD 10 Q3; rejected by the founder at the time); web page at launch (about 5 more weeks).
- **Door:** two-way: superseded before anything shipped; no family ever used contributor roles
- **Reversal cost:** low: nothing to undo, the later decision already replaced it
- **Revisit when:** none expected: superseded by D-055
- **Review by:** on trigger
- **Status:** superseded by D-055
- **As built:** contributor support stays in the database only (`supabase/migrations/20261003000000_security_and_family.sql`); the app hides it

### D-007 Every child added together in first run is free
- **Source:** `docs/DECISIONS.md` "Earlier founder decisions carried forward" D-007 (Decided, founder, 2026-10-01/02); PRD-REQ-015
- **Decided:** every child added together in first run (twins or any children added then) gets a free book. The reading of PRD 9 Q9 was still to be confirmed (see D-038).
- **Why:** not recorded in the source
- **Door:** two-way: the book-based free allowance was replaced by a letter-based one before launch
- **Reversal cost:** low: no paying family depends on it
- **Revisit when:** none expected: replaced by the membership model
- **Review by:** on trigger
- **Status:** superseded by D-083
- **As built:** not built in the app; the server RPC `create_first_run_children` remains in `supabase/migrations/20261003010000_children_and_entitlements.sql` for v1.1
- **Also:** D-083 says one pool of 2 free letters covers all books, so a second child needs no extra gate

### D-008 A book joined as co-parent does not count as your free book
- **Source:** `docs/DECISIONS.md` "Earlier founder decisions carried forward" D-008 (Decided, founder, 2026-10-01/02); PRD-REQ-015
- **Decided:** a book you join as co-parent does not use up your own free book.
- **Why:** not recorded in the source
- **Door:** two-way: the free allowance is now counted in letters, not books
- **Reversal cost:** low: no family depends on it
- **Revisit when:** none expected: replaced by the membership model
- **Review by:** on trigger
- **Status:** superseded by D-083
- **As built:** not built

### D-010 Digital only in v1; printed books are a future launch
- **Source:** `docs/DECISIONS.md` "Earlier founder decisions carried forward" D-010 (Decided, founder, 2026-10-01/02); PRD K-32
- **Decided:** v1 is digital only; printed books are a later launch.
- **Why:** not recorded in the source
- **Door:** two-way: adding print later is new scope, nothing to undo
- **Reversal cost:** low: print needs its own payment path (ADR 0007 print half), but nothing built today blocks it
- **Revisit when:** customer: families ask for a printed book in research or support; market: a print partner quote fits the price plan
- **Review by:** on trigger
- **Status:** in force
- **As built:** not built; the print half of ADR 0007 is the roadmap

### D-013 US App Store first, iOS only at launch, every pattern Android-portable
- **Source:** `docs/DECISIONS.md` "Earlier founder decisions carried forward" D-013 (Decided, founder, 2026-10-01/02); PRD section 1
- **Decided:** launch on the US App Store first, iOS only, with every pattern portable to Android.
- **Why:** not recorded in the source
- **Door:** two-way: adding storefronts or Android is additive
- **Reversal cost:** low: new storefronts need their own legal and price review, but nothing to undo
- **Revisit when:** market: launching outside the US; platform: Android work starts (D-059 parks Google Play to v1.1)
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/modules/scribe-store/android/src/main/java/expo/modules/scribestore/ScribeStoreModule.kt` (Android stub); `apps/mobile/src/components/platform`

### D-014 Multiple children, one book each; additional books are Plus; L1 to L4 data classes; analytics volume accepted
- **Source:** `docs/DECISIONS.md` "Earlier founder decisions carried forward" D-014 (Decided, founder, 2026-10-01/02); PRD K-12, 7.10, K-01
- **Decided:** a family can have several children, each with one book; additional books are Plus; data is classified L1 to L4; the analytics event volume is accepted.
- **Why:** not recorded in the source
- **Door:** two-way: book structure, classification and the Plus gate are code and policy today
- **Reversal cost:** low: the "additional books are Plus" part is already replaced; one book per child becomes harder to change once families have books
- **Revisit when:** customer: families ask for more than one book per child (for example a shared sibling book)
- **Review by:** on trigger
- **Status:** amended by D-083
- **As built:** `packages/core/src/child.ts`; `docs/legal/DATA_CLASSIFICATION.md`
- **Also:** D-083 makes books free (one pool of 2 free letters across all books); the L1 to L4 classes and one book per child stand

### D-043 v1.0 entry: one welcome screen then the 18+ gate; 4-story intro in v1.1
- **Source:** `docs/DECISIONS.md` D-043 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** v1.0 opens on one static welcome screen, then the 18+ gate, then first run. The 4-story intro (A-REQ-003 to -011) moves to v1.1 behind the existing remote variant switch.
- **Why:** 11 requirements and an animation budget for a screen most people skip (TDD 10 section 2); frees mobile time for family and Plus.
- **Door:** two-way: the intro can be switched on later through the remote variant switch
- **Reversal cost:** low: code and copy only
- **Revisit when:** customer: first-run completion or comprehension is low in the C1 beta
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/app/onboarding.tsx`; `packages/content/src/stories.en.ts`

### D-055 Family at launch: co-parent only; contributors and the web page later
- **Source:** `docs/DECISIONS.md` D-055 (Decided, founder, 2026-10-03; supersedes D-002)
- **Decided:** at launch only a co-parent can write in a book; contributors and the web page come later. The database keeps contributors; the app hides that path.
- **Why:** not recorded in the source beyond the founder brief (decision 5)
- **Door:** one-way after launch: free today; once two parents share books, the sharing model holds both parents' letters
- **Reversal cost:** medium: changing roles after families share books needs a migration of live memberships and new copy
- **Revisit when:** customer: grandparents or other family ask to write; platform: v1.1 server release starts
- **Review by:** on trigger
- **Status:** parked: co-parent sharing itself sits behind the server switch, off in every v1.0 build profile (PR #54, D-085)
- **As built:** `apps/mobile/src/lib/capabilities.ts`, `apps/mobile/src/lib/family/coming-soon.logic.ts`, `apps/mobile/eas.json` (`EXPO_PUBLIC_SERVER_FEATURES` off)
- **Also:** BRIEF-20261003-5

### D-057 What the machine may do to words: unchanged constitution; typed text never rewritten
- **Source:** `docs/DECISIONS.md` D-057 (Decided, founder, 2026-10-03)
- **Decided:** the constitution is unchanged: the machine fixes spelling, script and punctuation, removes "um" and stumbles and makes tiny agreement slips, and never rewords. Typed text keeps the keyboard's own autocorrect for the chosen language and is never rewritten.
- **Why:** not recorded in the source beyond the founder brief (decision 7) and the constitution in CLAUDE.md
- **Door:** one-way: the public promise "we never rewrite" is on the website, store listing and in the app, and every stored edit is kept and reversible on that basis
- **Reversal cost:** high: letters kept under the promise stay bound by it, and breaking it breaks families' trust
- **Revisit when:** none expected: this is the constitution
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/core/src/verify.ts`, `packages/core/src/types.ts`, `packages/content/test/rules.test.ts`
- **Also:** BRIEF-20261003-7

### D-059 Deferred to v1.1: Hindi-English mode, safety classifier, word highlight, family hearing recordings, Android, web page
- **Source:** `docs/DECISIONS.md` D-059 (Decided, founder, 2026-10-03; answers D-032 and D-034)
- **Decided:** Hindi-English mode, the safety classifier (a static "If you are struggling" row ships instead), word highlighting in Read together, family members hearing each other's recordings (no audio upload in v1.0), Google Play and Android, and the web contribution page are v1.1.
- **Why:** not recorded in the source beyond the founder brief (decision 9)
- **Door:** two-way: each deferred item is additive
- **Reversal cost:** low: bringing any item forward is new work, nothing to undo
- **Revisit when:** customer: C1 beta families ask for one of these items; team: a second engineer joins
- **Review by:** on trigger
- **Status:** amended by D-073
- **As built:** `apps/mobile/src/app/settings/index.tsx` (static support row); `packages/content/src/strings.en.ts`
- **Also:** BRIEF-20261003-9. D-073 moved encrypted backup of the owner's recordings into v1.0; D-085 then took it out of v1.0 again; family listening stays v1.1.

### D-069 At most two parents per book
- **Source:** `docs/DECISIONS.md` D-069 (Recommended, 2026-10-03; founder OK needed); D-099 (Decided, delegated by founder, 2026-10-15; confirms D-069), PR #122 (merged 15 Oct 2026)
- **Decided:** the server refuses a third parent, and either parent can see and remove family members. It ships as a server check before any non-founder data exists.
- **Why:** pm-2 finding (as cited in the source).
- **Door:** one-way after launch: once books have two parents, loosening or tightening the cap changes who can read live letters
- **Reversal cost:** medium: a migration and access-rule change on live memberships
- **Revisit when:** customer: families ask for a third parent or guardian; law: counsel advice on guardianship
- **Review by:** on trigger
- **Status:** in force: decided by D-099 (delegated by founder, 15 Oct); D-100 puts co-parent sharing in v1.0, so the server check ships with it
- **As built:** `supabase/migrations/20261005000000_family_cap_language_idempotency.sql`
- **Also:** D-099 (its server check and SCCAP `parents_full` are parked for v1.1 with G-02 and G-17)

### D-073 Recordings backup in v1.0; sharing in v1.1
- **Source:** `docs/DECISIONS.md` D-073 (Decided, founder, evening of 2026-10-03; supersedes D-032)
- **Decided:** encrypted backup of recordings ships in v1.0. Family members hearing each other's recordings is v1.1.
- **Why:** not recorded in the source; it answers CONSISTENCY_AUDIT F-2
- **Door:** one-way after launch: once recordings are backed up on our service, families depend on that copy and its keys
- **Reversal cost:** high: after launch, withdrawing backup means returning or deleting stored recordings and telling families
- **Revisit when:** cost: no storage budget is set (the founder should set one before backup ships; the cost doc's only trigger is Supabase Pro from $25 a month when real letters go on a server); law: counsel on server-held keys (LEGAL-REQ-022(a))
- **Review by:** on trigger
- **Status:** amended by D-085: D-100 (founder, 13 and 15 Oct) removes D-085's amendment for v1.0, so recording backup ships in v1.0 again; D-102 sets recoverable keys
- **As built:** not built on `develop`; the backup client and server are open PRs #150 and #151

### D-084 Quiet-day marks carry no sentence
- **Source:** `docs/DECISIONS.md` D-084 (Decided, delegated by the founder to the CTO, 2026-10-04; debate Q-013)
- **Decided:** "Not much today" stores a mark with no text, shown as "A quiet day" with the date, unsigned. The old sentence is removed and blanked in existing rows. Quiet days never count toward free letters and never appear in the printed book or Read together. A recording with no words counts as a letter when kept. The "Dear {child}," ghost placeholder is removed.
- **Why:** the constitution: every word the Book shows was said by a person.
- **Door:** two-way: the mark carries no text, so a later change is copy and code
- **Reversal cost:** low: the blanked sentences were machine text, not anyone's words
- **Revisit when:** none expected: follows the constitution
- **Review by:** on trigger
- **Status:** in force
- **As built:** `apps/mobile/src/lib/db/repos/entries.ts`, `apps/mobile/src/lib/db/repos/ledger.ts` (PR #92)

### D-085 Delete, recovery and backup in v1.0
- **Source:** `docs/DECISIONS.md` D-085 (Decided, delegated by the founder to the CTO, 2026-10-04; debate Q-014); PR #98
- **Decided:** deleting a letter asks first, then moves it to a Recently deleted shelf for 30 days with Restore and Erase now; the purge removes the file, then the row. Recordings stay in the iPhone backup. Settings shows "Last export" and a nudge to save a copy. Backup through our own service is not in v1.0, because it needs sign-in and a server; backup claims come out of the listing, website and Plus copy until it ships.
- **Why:** backup through our own service needs sign-in and a server, which v1.0 does not have.
- **Door:** one-way after launch: an erased letter cannot be recovered, and what "delete" means is fixed once families have deleted things
- **Reversal cost:** medium: the shelf length and copy are code, but every erase already done is permanent
- **Revisit when:** customer: families ask to restore after 30 days; law: counsel sets a different deletion window (counsel sign-off on the 30 day wording is still needed)
- **Review by:** on trigger
- **Status:** amended by D-100: its "amends D-073 for v1.0" clause no longer applies, because recording backup ships in v1.0
- **As built:** `apps/mobile/src/app/settings/recently-deleted.tsx`, `apps/mobile/src/lib/capture/erase.ts`, `apps/mobile/src/app/settings/export.tsx`

### D-086 Words for the app's edits
- **Source:** `docs/DECISIONS.md` D-086 (Decided, delegated by the founder to the CTO, 2026-10-04; debate Q-013); PR #103
- **Decided:** the feature is "Word for word". The app removes stray sounds, repeats and restarts, fixes a misheard name, adds punctuation and marks every fix, each reversible. "Exactly as said" is one tap with a Settings default. Typed text is never touched. "Lightly tidied", "Tidying" and "Does this sound like you?" are removed. Other languages get native-speaker translation, never machine rewriting.
- **Why:** not recorded in the source
- **Door:** two-way: names and Review behaviour are copy and code; every edit stays stored and reversible
- **Reversal cost:** low: copy and code
- **Revisit when:** customer: C1 beta families misread what the app changed
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/content/src/features/words.en.ts`, `apps/mobile/src/app/review.tsx` (the name itself is D-074)

### D-087 First run, setup and permissions
- **Source:** `docs/DECISIONS.md` D-087 (Decided, delegated by the founder to the CTO, 2026-10-04; debate Q-015); PR #104
- **Decided:** the birth date is required with no default and is read back; name, date and signature are editable, saved letters never change; a due date becomes a birthday through a card shown at most twice; the speech model downloads only after an explicit choice with the size shown; deep links are an allowlist and nothing records from a link; the screen stays awake only while recording and during Read together; helplines keep the US list; "I was invited" and the disabled "Family can read" switch are hidden in v1.0.
- **Why:** not recorded in the source
- **Door:** two-way: defaults and screens are code
- **Reversal cost:** low: code and copy
- **Revisit when:** customer: first-run drop-off at the speech download in the C1 beta; law: the 988 language line passes a primary-source check
- **Review by:** on trigger
- **Status:** amended by D-100: "I was invited" shows again and the Family tab is live
- **As built:** `apps/mobile/src/lib/models/speech-consent.ts`, `apps/mobile/src/app/+native-intent.tsx`, `apps/mobile/src/lib/resilience/keep-awake.ts`

### R-001 v1.0 is the on-device release already built
- **Source:** issue #127 item 1 (founder-delegated, 14 Oct 2026, posted by the agent-harness session); Project doc `claude/Early-Letters-Coordination.md` (platform thread, 15 Oct: founder answer "On-device v1.0, server in v1.1"; release-engineering thread, 15 Oct); Project doc `infra/cost-decisions-2026-10-03.md` (founder, 3 Oct: co-parent sharing, sign-in and sync moved to v1.1, shipped as PR #54); comment on PR #124 (15 Oct, 06:39 UTC)
- **Decided:** v1.0 is the on-device build that already exists (D-085, `capabilities.ts`), on the release lane with the freeze on Mon 26 Oct. No sign-in, sync, co-parent sharing or server backup in v1.0.
- **Why:** the on-device build exists and has a release lane; the TestFlight workflow and runbook are merged (#100); #127 says the build is on TestFlight, but the Project coordination doc says no build had run on a phone as of 15 Oct (FT-01 Apple enrolment pending); PRD V2's own estimate for the server scope is submission in the week of 3 May 2027 at about 40% confidence; the server path carries open security work (BL-347, H2, H3, issue #119). Shipping on-device gets families using the product about six months earlier at lower privacy risk (#127).
- **Alternatives:** option B: server features on in v1.0 and the date moves (D-100, D-101), which the founder chose.
- **Door:** one-way after launch: the release families install fixes where their letters live (on the phone) and the privacy label it ships with
- **Reversal cost:** medium: before submission it is a build switch; after launch, moving to server features needs sign-in, a data upload path and new legal text
- **Revisit when:** customer: C1 beta families say they cannot use it without sharing; team: the v1.1 security gates (BL-347, BL-330, BL-322, BL-331, issue #119) are closed
- **Review by:** on trigger
- **Status:** superseded by D-100: D-100 (founder, 13 Oct, confirmed 15 Oct; merged in PR #128 on 16 Oct) chose option B, server features on in v1.0, and supersedes the on-device-only assumption. Kept for history: the sources disagreed on 15 Oct until the log recorded option B.
- **As built:** `apps/mobile/src/lib/capabilities.ts`, `apps/mobile/eas.json` (`EXPO_PUBLIC_SERVER_FEATURES` off in every profile on this branch)

### R-002 PRD V2's server scope becomes the next release
- **Source:** issue #127 item 1, second part (founder-delegated, 14 Oct 2026); Project doc `claude/Early-Letters-Coordination.md` (item 2)
- **Decided:** the server scope in PRD V2 (#124: sign-in, sync, co-parent sharing, recording backup, reminder emails; M14 and M15) becomes the release after v1.0. Its quality bar, specs and May 2027 plan stay, retitled.
- **Why:** it follows from R-001; nothing in PRD V2 is lost (#127).
- **Door:** two-way: planning and document titles only
- **Reversal cost:** low: re-tagging requirements in PRD V2
- **Revisit when:** customer: same as R-001
- **Review by:** on trigger
- **Status:** superseded by D-101: D-100 puts the server scope in v1.0 and D-101 keeps the full scope with the date moved (both merged in PR #128 on 16 Oct). Kept for history: the sources disagreed on 15 Oct until the log recorded option B.
- **As built:** `docs/backlog/future/06-coparent-sharing-v1-1.md`

### D-100 Server features are on in v1.0 (option B)
- **Source:** `docs/DECISIONS.md` D-100 (Decided, founder, 2026-10-13, PRD V2 M14; confirmed by the founder in the build thread, 15 Oct 2026); PR #128 (merged 16 Oct 2026)
- **Decided:** the release build profiles set `EXPO_PUBLIC_SERVER_FEATURES=on`. Sign-in, sync, co-parent sharing (at most two parents, D-069), encrypted backup of the owner's recordings (D-073) and the subscription status report with reminder emails (D-080) ship in v1.0. The switch in `apps/mobile/src/lib/capabilities.ts` stays as the kill path. Gate: nobody outside the family signs in before BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322 and BL-349 merge and pass one shared security review (PRD V2 09 R-17); migrations reach staging, then production, through CI; legal pages describing a server product are live before sign-in.
- **Why:** not recorded in the source. The log says the founder chose it from three options offered.
- **Alternatives:** on-device only (R-001, issue #127); on-device plus an anonymous status endpoint.
- **Door:** one-way after launch: once families sign in and their letters and recordings sit on our server, the release carries live data, escrowed keys (D-102) and a privacy label of "Data Collected"
- **Reversal cost:** high after outside users sign in: their server data has to be kept, exported or deleted under the Privacy Policy; low before then, because the switch in `capabilities.ts` is the kill path
- **Revisit when:** team: the R-17 security gate items are not merged and reviewed before outside testers sign in; law: counsel has not answered the server-product packet (#163) before outside testers sign in
- **Review by:** on trigger
- **Status:** in force: reverses commit c1764f9 and supersedes the on-device-only assumption behind D-085 to D-088, D-095 and #118 where they conflict (R-001, R-002, R-003); the exact submission date (mid-January or May 2027) is still open per the log
- **As built:** not built on `develop`: `apps/mobile/eas.json` still has `EXPO_PUBLIC_SERVER_FEATURES` off in every profile; the switch is `apps/mobile/src/lib/capabilities.ts`; the alpha profiles are in open PR #145
- **Also:** R-016 (the register's record of option B before #128 merged)

### D-101 Full v1.0 scope; the date moves
- **Source:** `docs/DECISIONS.md` D-101 (Decided, founder, 2026-10-13, after critique round 1, PRD V2 M15); PR #128 (merged 16 Oct 2026)
- **Decided:** v1.0 keeps every P0 work package, including recording backup and co-parent sharing; only the P1 extras in PRD V2 `08-delivery.md` section 6.4 are cut. The date follows the merge budget. As planned on 15 Oct: submission in the week of Mon 3 May 2027, about 40% confidence. This replaces ROADMAP 2.1's 2 Nov target.
- **Why:** not recorded in the source
- **Alternatives:** cut the scope to fit November; raise review capacity (the options the log lists).
- **Door:** two-way: a scope and date plan, before any submission
- **Reversal cost:** low: re-planning `08-delivery.md`; no store or user commitment yet
- **Revisit when:** team: merges fall behind the merge budget in PRD V2 `08-delivery.md` section 2.2; customer: the alpha (D-106) shows the P0 scope is not needed for v1.0
- **Review by:** on trigger
- **Status:** in force
- **As built:** `docs/prd/v2/08-delivery.md`
- **Also:** supersedes R-002 (server scope as the next release)

### D-105 PRD V2 is the product spec of record
- **Source:** `docs/DECISIONS.md` D-105 (Decided, founder, 3 and 13 Oct 2026; takes effect when PR #124 merges); PR #124 (merged 16 Oct 2026)
- **Decided:** `docs/prd/v2/` replaces `docs/prd/PRD.md` 1.3 as the requirements of record. Existing requirement IDs keep their meaning. Where V2 and a LEGAL-REQ disagree on a legal duty, counsel decides; no founder decision retires a legal duty by itself.
- **Why:** not recorded in the source
- **Door:** two-way: which document is the spec
- **Reversal cost:** low: a document pointer; requirement IDs are unchanged
- **Revisit when:** none expected: a later PRD version would replace it the same way
- **Review by:** on trigger
- **Status:** in force: PR #124 merged on 16 Oct 2026
- **As built:** `docs/prd/v2/`

### D-113 Co-parent build 2: Leave hidden until left books are listed; the invite text keeps the name
- **Source:** `docs/DECISIONS.md` D-113 (Delegated call by the coordinator, founder may reverse, 23 Oct 2026); review of PRs #165 and #184 (#184 merged 23 Oct 2026)
- **Decided:** (1) Leave is hidden in build 2: no Leave row, none on a child's settings screen, and `/invite/leave` says it is coming. (2) Before build 3, books a phone has left are listed under "Letters to {child}" with read, export and delete, and Leave comes back with that (BL-444). (3) The invite share text keeps the child's name, because the parent writes and sends it; the server's peek never reveals the name before joining.
- **Why:** after leaving, the book list hides the book, so the leaver's letters stay on the phone but no screen lists, exports or deletes them. For item 3, the parent writes the text on their own device and sends it to someone they chose; if it is forwarded, the name goes with it.
- **Door:** two-way: a flag and copy, until BL-444 ships
- **Reversal cost:** low: code; the server side already keeps a leaver's letters
- **Revisit when:** technology: BL-444 (left books listed) is built, which returns Leave
- **Review by:** on trigger
- **Status:** in force; amended in effect by D-116 for what the server keeps of a leaver's letters
- **As built:** `apps/mobile/src/lib/family/entry.logic.ts` (`LEAVE_BOOK_OFFERED`), `packages/content/src/features/family.en.ts`; BL-444 not built
- **Also:** relies on D-111 item 8; D-116
