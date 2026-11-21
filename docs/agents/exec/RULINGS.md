# Executive rulings log

Rulings by the council executives other than the CTO (Karma's are in `docs/agents/cto/RULINGS.md`). The protocol is `docs/agents/exec/COUNCIL.md`, section 5. Each entry uses the format in Karma's skill, section 11, and the role code with the next number for that role (`CLO-1`, `CFO-1`). Before numbering, check this file, any open PRs that touch it, and the Project docs `infra/exec-rulings-*`. The founder can overrule any entry in one line, recorded as a new entry that supersedes the old one. Newest last.

### CPO-1 Keep is the commit verb in the PRD (31 Oct 2026, CPO via the platform session)
- Question: F06-REQ-043 says actions say "Save"; the decisions say the parent taps Keep. Which does the spec say?
- Tier and type: T1; clear
- Options considered: keep the requirement as written and change the app; amend the requirement to Keep; leave both and record the conflict
- Ruling: amend F06-REQ-043, F06 section 6.2 ("Save to {child}'s book", "Save just for me"), `F14-plus.md:165` ("taps Save") and add a superseded note on DISPOSITION-C DX-08 (`:87`). The amended P0 row names its test and work package, so the RR-3 ratchet (D-123) still passes.
- Why: D-083 has the parent tap Keep and counts letters kept; D-109's effects say "keeps it on Write"; the app already follows them. A requirement row fixed against a decision of record is the CPO's (CPO skill section 4). Nomenclature audit R-B, PR #422.
- Door: two-way
- Way back: revert the PRD rows.
- Revisit when: a device test shows parents read Keep wrongly at the gate.

### CDO-1 One approval enum, no `withdrawn` (31 Oct 2026, CDO via the platform session)
- Question: the API's sync enum accepts `withdrawn`, which core, the database check and DATA_CLASSIFICATION do not. Keep it?
- Tier and type: T1; complicated
- Options considered: leave it; add `withdrawn` to the database and core; drop it from the API and import core's `APPROVALS`
- Ruling: after the API owner confirms nothing sends it, drop `withdrawn` from `packages/api/src/server/sync.ts:84` and import core's `APPROVALS`, with a test that core, the API and the database check match. Analytics builds its approval enum from core too, so `kept_aside` becomes `set_aside` (audit R-G).
- Why: the API accepts a value the database refuses (`supabase/migrations/20261003000000_security_and_family.sql:396`), and the word collides with consent withdrawal (D-128). No emitter found by grep; intent UNVERIFIED, and production rows UNVERIFIED (production sits at migration 2).
- Door: two-way
- Way back: restore the literal enum.
- Revisit when: the API owner shows a sender.

### CPrivO-1 Sharing claims held from submission (31 Oct 2026, CPrivO via the platform session)
- Question: the store source still says "Private to your family", "Invite your co-parent" and "Only you and the people you invite can read your book". Can a submission carry them?
- Tier and type: T1; clear
- Options considered: allow them; hold them until the store fix lands; rewrite them here
- Ruling: no submission carries `store.en.ts:28,54,60` until the store fix lands (BL-440, now carried by `fix/comms-validation-2026-10-31`). Verify step: the rule test in `rules.test.ts`. The CCO also checks "delete everything, any time, from Settings" against the build before submission (no erase-all control found; UNVERIFIED).
- Why: the first store build has no sharing (D-121, D-126); guideline 2.3.1(a).
- Door: two-way
- Way back: lift the hold in one line here.
- Revisit when: the store fix merges.

### CLO-1 Two pieces of legal draft hygiene (31 Oct 2026, CLO via the platform session; not legal advice)
- Question: the Subscription Terms on `develop` show superseded prices, and the Terms say "a member's access". What happens to them before counsel?
- Tier and type: T1; clear
- Options considered: publish as is; fix the text now; hold publication and route to counsel
- Ruling: `docs/legal/subscription-terms.md` is never published from `develop` while it shows $3.99 and $29.99 (`:32-33`); the D-082 text is reconciled with counsel before submission. In the Terms, "a member's access" (`terms-of-service.md:157`) becomes "a person's access" until counsel picks one defined term. The founder merges both (D-125).
- Why: a subscriber reading the old price and being charged the new one is a refund and a complaint. Audit NA-08, NA-29.
- Door: two-way
- Way back: revert the line.
- Revisit when: counsel answers Q8.

### CCO-1 The listing can't say "exactly as you said it" (31 Oct 2026, CCO via the platform session; not counsel)
- Question: how do we keep D-125 item 9 from drifting back into the store copy?
- Tier and type: T1; clear
- Options considered: rely on review; a checklist line; a rules test
- Ruling: `packages/content/test/rules.test.ts` fails if `storeListing` contains "exactly as you said it", until counsel clears the phrase at T30.
- Why: D-125 item 9 holds the phrase from the listing; guideline 2.3.1(a). A test enforces it; a checklist relies on memory.
- Door: two-way
- Way back: delete the test line when counsel clears it.
- Revisit when: counsel answers Q16.

### CCO-2 The fence corrections and the per-branch required check (31 Oct 2026, CCO via the compliance session; not counsel)
- Question: does the change that makes `compliance-fence` required on `develop`, keeps it advisory on `main`, and corrects the fence's documentation (CR-32) keep the compliance programme's evidence true?
- Ruling: yes.
  - The fence's rules and checker are unchanged.
  - The README and workflow now describe what actually runs: the fence runs from the default branch `develop`, is required there, and is advisory on `main` until a `FENCE.json` exists there.
  - This is evidence for register CR-121 and D-131 changes being gated, not a new obligation.
- Way back: CR-32's.
- Chief Compliance Officer (Claude role, not counsel)

### CCO-4 PR #161's export reads of the consent record pass the compliance fence (31 Oct 2026, CCO via session_01JQRV3b)
- Question: PR #161 (BL-323, export schema 1.3.0) adds `supabase/tests/export_reads.test.mjs`, which names `policy_acceptances` (the fence scans only `supabase/**` for content markers), so the fence's `cco_review` tier asks for a CCO approval on head e7349e9. Does the change meet the CCO checklist in `compliance/README.md`?
- Tier and type: T1; clear
- Options considered: approve; hold until counsel answers a question about access rights; ask the founder about the export README wording
- Ruling: approve e7349e9. Checklist, item by item:
  - Sign-up checks table unchanged: the diff touches no gate, age-signal, auth or invite file.
  - No new collection: the phone reads the person's own existing `policy_acceptances` and `my_policy_state` rows (DATA_CLASSIFICATION classifies every column, L2 except `locale` L3) into their own export, never `profile_id`, `subject_hash` or `pseudonymised_at`. The class's export rule allows a person's own L2 and L3, and the temporary ZIP already has its row ("Export ZIPs in app temp").
  - No legal or platform fact is relied on.
  - No promise changes. In-app copy changes: the export README in `packages/content/src/features/export.en.ts` gains a section, and the comment above `offlineNote` changes (its text does not). The new section adds no promise: it describes a record the privacy policy already discloses (the retention table's "Consent and policy-acceptance records ... to show what you agreed to", and the Account row's "the consents you gave or withdrew, and when"). Its last sentence is about export behaviour and is backed by tests (`export-server-records.test.ts`, `export_reads.test.mjs`). Terms, Privacy Policy and store text are untouched.
  - No new door path; no geo result, so DB-IP attribution does not apply.
- Why: two counted reviews passed at e7349e9 (Review A correctness, Review B privacy, PR #161 comments), and the database test proves own rows only. No legal judgment gates this approval. LEGAL-REQ-034 is an engineering requirement we set, derived from the access-rights review (its source line names CR-014 and CR-022), and #161 only adds to an export that had no consent history at all; it removes nothing. Whether any right-of-access law asks for more is not ruled here and is not in the counsel packet. Open items, none blocking:
  - An offline export carries no consent history, because the record lives on the server. That is a gap against LEGAL-REQ-034's "works offline from local data", filed as BL-528 with an owner, not a counsel question.
  - `support_assisted` acts skip the `context` key allowlist: handoff to data-architect before support records its first act.
  - Claims register entries for the new README section, for "The export is made on this phone" now sitting beside a signed-in server read, and for Privacy Policy section 14's "every letter you wrote" beside an export that leaves out Recently deleted letters (BL-388, CR-35).
  - The privacy policy's Account row names consents given or withdrawn, while the record also holds declines and acknowledgements: handoff to `legal` to name them; policy text goes through the founder.
  - The server-built export (DATA-REQ-054) is not built yet.
- Door: two-way
- Way back: revert PR #161; the export falls back to schema 1.2.0.
- Revisit when: BL-528 is decided. #161 merged at e7349e9 (4651256), the head this approval covers.
- Signed: Chief Compliance Officer (Claude role, not counsel)

### CLO-3 The Privacy Policy line for the sign-up country check, and counsel Q57 (1 Nov 2026, 05:19 UTC, CLO via the compliance session; not legal advice)
- Question: the founder said "add in privacy policy, assign chief legal officer to work and update docs with cto" (D-136). What text, where, and how does it reach counsel?
- Tier and type: T1 for the drafting; the promise itself is the founder's (D-136)
- Options considered: a new policy version on its own PR; a line in the 3.0.0 draft already on #163; wait until the hook ships.
- Ruling: added to the 3.0.0 draft on #163 (commit dc1f4fc): section 2 (the IP is also used to work out the country), section 5 (the purpose), section 12 (what we refuse, that the IP is not kept, daily counts by result with the country code for refusals only, kept two years, DB-IP named, and that a wrong lookup can be raised without being asked where you are), and a "which builds" line that the part takes effect when the check ships. COUNSEL_PACKET 1.5.0 adds Q57 (the country block, no name screening, the D-131 EAR list, and the label reading). Both stay a founder merge (D-125).
- Why: a separate PR would collide with #163, which rewrites the same files and versions. 3.0.0 already says a part takes effect only when its feature ships, so the line is true before the hook is on. Return: one founder merge carries it. Risk: low; counsel reviews the wording in Q57.
- Door: two-way
- Way back: remove the four edits from the draft before it is published.
- Revisit when: counsel answers Q57, or the blocked list changes in a way the general wording no longer covers.
- Signed: Chief Legal Officer (Claude role, not a lawyer)

### CPrivO-2 The country check does not change the App Privacy label (1 Nov 2026, 05:19 UTC, CPrivO via the compliance session; not counsel)
- Question: once the sign-up hook works out a country from the IP address, do we declare Coarse Location?
- Tier and type: T1; complicated
- Options considered: declare Coarse Location; declare nothing and say why; ask counsel first and hold the hook.
- Ruling: declare nothing. Apple's "collect" is transmitting data off the device "in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time" (developer.apple.com/app-store/app-privacy-details, read 1 Nov 2026). The hook uses the country in memory to answer the sign-up and keeps only unlinked daily counts by result, with the country code for refused sign-ups only (`20261031000000_compliance_gates.sql`, #424). Counsel is asked to confirm in Q57 (e). If the hook ever stores the country with an account, this flips to Coarse Location, linked.
- Why: the label must match what the code keeps. Data minimisation already keeps the IP and the per-person country out of storage.
- Door: two-way
- Way back: add the row in App Store Connect and in `docs/legal/app-store-privacy-labels.md`.
- Revisit when: #424 changes what it stores, or counsel answers Q57.
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CCO-5 No name screening for v1.0, with a check on escalation and a match runbook (1 Nov 2026, 05:19 UTC, CCO with the CLO and Karma, via the compliance session; not counsel)
- Question: the founder said "decide on name screening against restricted-party lists, with counsel (the default is none); Decide with compliance, legal, cto and finish" (D-137). Do we screen names against the SDN List or other restricted-party lists?
- Tier and type: T3 delegated by the founder; complicated
- Options considered: screen every sign-up name against the SDN List; batch-screen stored emails and display names, and re-screen when OFAC updates its lists; screen only when a report or escalation gives a reason, with a match runbook; do nothing beyond the Terms and the country block.
- Ruling: the third. No sweep of names. Support checks a name in OFAC's Sanctions List Search when a report or escalation gives a reason, and a possible match follows `docs/ops/runbooks/sanctions-match.md` (suspend, never delete, counsel the same day, a report within 10 business days if counsel says one is due). BL-552 builds the suspend path before any sign-in outside the family. Counsel confirms in Q57.
- Why: OFAC recommends "a risk-based approach" with "the company's size and sophistication" as a factor (A Framework for OFAC Compliance Commitments, read 1 Nov 2026), and the Enforcement Guidelines (31 CFR 501 Appendix A, General Factor E and the small-business provision, read by the challenger 1 Nov 2026) weigh such a programme. A sweep would collect legal names, and dates of birth to clear false matches, that the product never needs. Sign-in by email link often gives no name at all, so a sweep of what we hold would mostly match nothing and still produce false positives. Return: no new personal data, a defined response when it matters. Risk accepted: one undetected listed person is still a violation under OFAC's strict-liability standard, mitigated, not removed.
- Debate (independent challenger, 1 Nov 2026): (1) OFAC FAQ 445, cited first, belongs to the cyber-related program (E.O. 13694): accepted, re-cited to the Framework and the Enforcement Guidelines. (2) Liability is strict and covers free services (31 CFR 510.201(b)(1) as an example), and Apple-only payments do not remove it: accepted, D-137 now says so. (3) Cheaper middle options were missed: accepted in part; the escalation check is adopted, and the batch screen of stored names is rejected for the reasons above. (4) No procedure for a match, and missing triggers (value between people, the web page outside the US, OFAC guidance or enforcement on consumer apps): accepted; the runbook, BL-552 and the triggers are added. The challenger's note on a 2019 Apple settlement was secondary-source only and is not relied on.
- Door: two-way
- Way back: start screening at sign-up; the runbook and BL-552 still apply.
- Revisit when: any D-137 trigger, or counsel answers Q57.
- Signed: Chief Compliance Officer (Claude role, not counsel), with the Chief Legal Officer (Claude role, not a lawyer) and Karma

### CCO-6 PR #520 (Erase everything, Delete this book) passes the compliance fence (8 Nov 2026, CCO via Karma's session; not counsel)
- Question: PR #520 changes `apps/mobile/src/lib/age-gate.ts`, a `cco_review` path: the age-gate hook now listens for settings changes, so the 18+ question comes back at once after Erase everything. The PR also adds Delete this book and Erase everything on a phone that has never signed in, with four in-app lines that read as promises. Does it meet the CCO checklist in `compliance/README.md`?
- Tier and type: T2 (data deletion, a user-visible promise, a fenced path); complicated.
- Options considered: approve at the head that carries this ruling; hold until counsel reads the absolutes; approve without the four lines.
- Ruling: approve the head of PR #520 that carries this ruling, which is the head named on the `## CCO approval at <sha>` line. Checklist, item by item:
  - Sign-up checks table unchanged. The gate's decision logic (`decideGate`, `answerGate`) is untouched. The hook only moves the decision away from "pass" when settings are cleared, and the move to "pass" stays with the gate screen. After Erase everything the 18+ question comes back at once, as on first run. A running 24-hour stop is kept (`store.ts:1042-1046`); a stopped phone cannot open Settings, so an erase cannot be started from it. `apps/mobile/test/age-gate-erase.test.ts` pins the hook, and the 24-hour stop cases in `apps/mobile/test/erase-all.test.ts` pin that a running stop survives an erase.
  - No new collection. Four device-only settings keys, none sent anywhere, none L4: `book.deletedAt.<child id>` L3 and `book.erasing.<child id>` L3 (the key holds a book id: DATA_CLASSIFICATION 1.1 rules 1 and 5, the same reading as `readTogether.sessions.<book id>` in 4.5), `erase.everything.pending` L2, `db.secureDeleteVacuumAt` L2. Minimisation reason: three of the keys exist only to carry out a deletion the person asked for (hold a deleted book for 30 days, finish an interrupted erase) and are removed when it ends; `db.secureDeleteVacuumAt` only records that the one-time database rebuild has run, holds a time and nothing else, is written on every phone's first open (`store.ts`, `vacuumOnceForSecureDelete`) and is removed by Erase everything so the rebuild runs once more. The class rows in DATA_CLASSIFICATION 4.5 and the privacy policy corrections are issue #654 and go through `legal` and the founder, so item 2 of the checklist is met here by this record and not by repository rows yet. This is an engineering reading; counsel or the CDO confirms.
  - Platform facts relied on, read by Karma on 8 Nov 2026 from developer.apple.com/app-store/review/guidelines (the page's "Last Updated" line was not seen by me): 5.1.1(v), "If your app supports account creation, you must also offer account deletion within the app", which, on an engineering reading, does not apply to a build with no account creation (servers off) and, in a server build, is met by the Delete account row of D-129, not by Erase everything (counsel must confirm); 2.3.1(a), marketing your app in a misleading way is grounds for removal. The staged listing (`docs/store/app-store-staged-1.0-proposal.md:52`) says "delete everything, any time, from Settings": that is true only if #520 is in the store build, and must come out of the listing if it is not. The two rows for `references/checked-facts.md` are for the `regulatory-affairs` lane, because that file is a fenced path; until they exist the sources are recorded here, which is how item 3 of the checklist is met for now. One further fact the backups line leans on is not verified: what Apple does with an iCloud Backup made after an erase. The line claims only that the erase does not change a backup already made.
  - Promises. The founder answered two questions in the session on 8 Nov 2026 (D-132 keeps what users are promised with him): ship the four lines (the body with "We hold no copy.", "This happens on this phone only. Nothing is sent anywhere.", "Your free letters start again." in the store build only, and the backups line) with three edits (the backups line names exports already saved; the failed line says a late retry also erases what was written in between; one line in the store build, shown only while Plus will renew and not on a Family Sharing phone, that erasing does not cancel Plus), and keep the free-letters sentence in the quiet text style. The option he chose was described to him as shipping now with counsel reading the absolutes in parallel; the council's own default had been to hold the PR. Counsel has not answered, and the two asks below are not yet in `COUNSEL_PACKET.md`; they are being added. The counsel gate in `compliance/README.md` therefore rests on the founder's answer alone, and this ruling is its only record in the repository. A `DECISIONS.md` entry recording his answers follows in a docs PR (D-132 lets Karma merge entries that record the founder's own words) and is not part of this PR. Counsel's brief gets: "We hold no copy" and "Nothing is sent anywhere" (absolutes), and a Terms 8.1 sentence on whether Erase everything resets the free count (D-083 asked counsel about the Keychain count; `COUNSEL_PACKET.md` has no entry). Both lines are true wherever the row can show, which is only a phone that has never signed in (`localDeletionAllowed`, `store.ts`), and `erase-all.test.ts` proves the erase makes no network call. Not approved: reusing "We hold no copy" for a signed-in erase (F17-REQ-026, not built); adding any analytics event for an erase; and using any of the four lines in the store listing, the website or other public copy (the marketing seat's condition; the founder has not decided it).
  - No new door path; no geo result, so DB-IP attribution does not apply.
- Why: Reviews A and B and green CI at the head named on the approval line are conditions of posting that line, not facts of this text; the approval is not posted before they exist. Checklist items 2 and 3 are met by substitution, as set out above. Evidence is unit tests and no device run: "works on a phone" stays a Gap until the founder walks S1-133. The council run of 8 Nov (privacy, legal, compliance, finance, business, marketing, design and product seats) found the four lines true where the row can show (the privacy, legal, compliance and marketing seats said so; the free-letters line is true only where a limit exists, which is the store build, and until an old backup is restored). The seats split on two points. On the absolutes "We hold no copy" and "Nothing is sent anywhere": privacy and compliance said ship now, legal said hold until counsel reads them, marketing said in the app only and never in the store listing or the website. On the free-letters sentence: privacy, legal and product keep it; business, marketing and design cut it. The founder chose to ship and to keep the sentence.
- Open, not blocking, and not yet in the backlog (Karma adds the rows after the merge): a failed erase that the person keeps using erases anything written before the next launch (words now, a code follow-up that erases only what existed when the mark was written); a sole-book person cannot reach Recently deleted after a cold start until a new book exists (for the CPO to rule before 1 Dec); the VoiceOver announcement `doneA11y`, "Everything on this phone is erased.", is a string from the account-security proposal (content.md 4.11, a Project document; it is in no registered map) that says more than the screen does, because the speech model, plan reminders and saved exports stay (for the CPrivO and the CDesO to rule).
- Door: two-way with cost. Data deletion cannot be undone for the person who uses it; the code can be reverted.
- Way back: revert PR #520; the Erase everything row, the Delete this book screens and the four settings keys go, and the age-gate hook returns to its previous behaviour.
- Revisit when: the founder walks S1-133 on a phone; counsel answers the absolutes and the Terms 8.1 question; the signed-in erase (F17-REQ-026) is built.
- Signed: Chief Compliance Officer (Claude role, not counsel)

### CPO-10 A person with one book keeps the 30-day promise: onboarding shows the existing Recently deleted row while a deleted book waits (BL-776) (9 Nov 2026, CPO in the council round of 9 Nov, filed by Karma's session)
- Filed by Karma's session from the CPO's council answer of 9 Nov 2026 (`council-9nov/cpo.md`, outside this repository; the twelve seats each answered the status note, and the CPO's answer is the only source for this ruling). Fields marked (CPO) come from that answer. Fields marked (filer) are the filing session's, not the CPO's.
- Why CPO-10: CPO-2 and CPO-3 are cited in code, and CPO-2, CPO-3 and CPO-6 to CPO-9 in open PRs, and none of them is in a file of the log (CPO-2 is the app-lock ruling, F1, cited in `onboarding.tsx`, `app.config.ts` and the app-lock code), so I took CPO-10, which no file or open PR uses. Checked on 9 Nov 2026: `develop` and the patches of the 158 open PRs hold no CPO-10 or above. Not checked: the Project docs (`infra/exec-rulings-*`), which this session cannot read, so the number is unverified against them. (filer)
- Question (filer, from the BL-776 row; the restart behaviour was read in code on `develop` and has not been run on a phone): a person who deletes the only book and then restarts the app lands on first run, and nothing there leads to Recently deleted, so the 30-day undo window cannot be used. Which of the three options in the row: (a) onboarding shows a quiet way to Recently deleted while a deleted book is waiting, (b) the delete step says what to do after a restart, (c) Delete this book is not offered on the only book?
- Tier and type (filer): T2 (a user-visible promise); complicated.
- Options considered: (a), (b) and (c) as written in the row.
- Ruling (CPO): option (a). "Onboarding shows the existing Recently deleted row while a deleted book waits. No new line. The CDesO places it." Acceptance: delete the only book, cold start, Restore brings it back.
- Why (CPO): the 30-day promise holds with one book. The answer gives no reason that separates (a) from (b) or (c).
- Condition (filer, from the BL-776 row and CCO-6): the row sends any new line to the founder (D-132 keeps what users are promised with him). The CPO says no new line is needed, and the Recently deleted row's words exist today. If the CDesO's placement turns out to need a word that does not exist, that word goes to the founder before it is built.
- Other views in the round (filer's summary of the council notes, outside this repository): the CDesO proposed a toast with Undo on the delete until the CPO rules, and gave no written view of where the row should sit; the product manager's default for build 12 was option (c), no Delete this book on the only book, with (a) later. The CPO ruled (a), and when it is built is not decided here. The CDesO places the row on the screen; the CPO's ruling is the product choice and does not decide the design. The CTO view is mine: (a) is a build change with no data change, and I agree.
- Door (filer): two-way with cost: a build change can be reverted, but until it is built a person who deletes their only book meets the gap.
- No D- id (filer): executive rulings are recorded in this log (COUNCIL section 5), so no D- id will be made for this. The BL-776 row says a D- id is assigned at the ruling; this entry is that ruling, and the row becomes ready when this entry merges (the product agent's edit, in PR #715).
- Way back (filer): revert the build PR.
- Revisit when (filer): the acceptance walk fails on a phone, or the CDesO's placement needs a new word.
- Signed: Chief Product Officer (Claude role) for the ruling; filed by Karma

## Batch 3 (21 Nov, council)

These entries sit after PR #1377 on purpose. #1377 is not merged, so this section is a separate trailing block to avoid a conflict. Numbers continue past the highest id I found per seat on `develop`, in the open #1377 and in citations under `docs/` (CPO-19, CDesO-13, CPrivO-13, CDO-21, CLO-20, CCO-15, CISO-2). Not checked: other open PRs that touch this file and the Project docs. If a number collides at merge, renumber the later one. Each seat is a Claude role (COUNCIL section 1), none is counsel, and every claim about a law is UNVERIFIED because no source was read for it in this session. Evidence is the review files for PRs #1414, #1417, #1421 and #1435, the spec `docs/product/prd/28-moments-tab.md` (v3, PROPOSED) and the audit `docs/engineering/audits/2026-11-21-cross-account-stores.md` (PR #1427, head `ad05420f34a50d2f0ead5a6b5e384d29d2472213`).

The second of #1377 and #1454 to merge resolves a text conflict at the end of this file; keep both blocks.

Reading rule for M1 to M9 and M10: the Moments tab is PROPOSED and off behind a flag. Each ruling fixes a build default so the draft PRs can finish. Each default is a PROPOSED value in `packages/core/src/moments/rules.ts` (with `MOMENTS_RULES_VERSION` bumped) or a named constant carrying an `ASSUMED:` comment, so one grep finds them for the G4 card sort and the PR 3b harness, which may change any of them. None changes what a person is promised, scope or dates, so none is founder-only. The spec text is not edited here: the `product` agent writes the erratum lines named below.

### CPO-19 M1: a day with an even number of sessions takes the earlier middle session (21 Nov 2026, CPO with CDesO, CDO and Karma)
- Question: for tile 1 (spec 7.3, R281(c)) a day with 2 or 4 sessions has two middle sessions. Earlier or later? (#1417 `collage.ts`, `Math.floor((n-1)/2)`.)
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CDesO (the grid reads in time order, so earlier leads), CDO (must be one deterministic rule on every phone), Karma.
- Verdict: RULED.
- Ruling: the earlier middle session. Inside it, the candidate nearest that session's middle, ties to the earlier time then the lower id.
- Reason: a two-session day is the common busy day, so this is the common case. Neither choice is more true to the day, and the earlier one is the one a parent lived first. What matters is that two phones agree, and this rule is a pure function of the input.
- Evidence: review A of #1417 (assumptions list); the test at `collage.test.ts` pins it; spec 7.3 is silent.
- Door: two-way. Way back: change the index expression and the golden; no stored data depends on it.
- Founder-only: no.
- Next: builder of #1417 adds one `ASSUMED:` line and keeps the test; `product` adds a one-line erratum to 7.3.
- Signed: Chief Product Officer (Claude role)

### CPO-20 M2: at most one video tile, also among fallbacks (21 Nov 2026, CPO with CDesO)
- Question: when a tile is replaced (iCloud-only, MT-P6-R17), may the replacement be a second video?
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CDesO, CDO.
- Verdict: RULED.
- Ruling: never. A card shows at most one video tile, whatever the path. If only videos remain, the card has fewer tiles.
- Reason: 7.3 says "at most one video tile" with no exception, and a card of two moving pictures reads as a different product from the one the layouts describe.
- Evidence: review A of #1417; spec 7.3 and R41/R44.
- Door: two-way. Way back: drop the cap on the fallback pass. Founder-only: no.
- Next: none beyond the `ASSUMED:` line.
- Signed: Chief Product Officer (Claude role)

### CPO-21 M3: the longest-gap rule uses virtual edges, with tests (21 Nov 2026, CPO with CDO and CDesO)
- Question: "the picture at the middle of the longest remaining gap" (7.3): are the day's first start and last end edges of a gap?
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CDO (determinism), CDesO (spread across the day), Karma.
- Verdict: RULED.
- Ruling: yes. The edges are the earliest candidate start and the latest candidate end of that day (never midnight), so a one-session day still gets a spread tile. Ties: the longer gap, then the earlier time, then the lower id. Two goldens are owed: the longest gap is an edge, and two equal gaps.
- Reason: without edges a one-session day has no gap at all and tiles 2 to 4 would be an arbitrary fill. The spec intent is "the rest by spread".
- Evidence: review A of #1417, three survivors (gap tie, `dayStart`, `hiEdge`) that no test pins.
- Door: two-way. Way back: remove the edges and the goldens. Founder-only: no.
- Next: #1417 adds the goldens and kills the three survivors; `product` writes the 7.3 erratum.
- Signed: Chief Product Officer (Claude role)

### CPO-22 M4: when a day has an attached and a hearted picture, tile 1 is the attached one (21 Nov 2026, CPO with CDesO)
- Question: R281(c) says "tile 1 is a heart, else the middle"; 7.3 lists attached pictures before hearted ones. Which leads?
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CDesO, CPrivO (explicit teaching), CDO.
- Verdict: RULED.
- Ruling: the order of 7.3 wins. An attached picture (the parent put it in a letter for this day) is tile 1, a heart is next, and R281(c) is read as "among pictures not already attached". The reason line RSN-HEART still follows its own precedence and is not changed by this.
- Reason: attaching is a stronger and more deliberate act than a heart, and 7.3 is the section that states the order. The spec must not say two things.
- Evidence: review A of #1417 (not marked by the builder); spec 7.3 and NS-53-R41, R44.
- Door: two-way. Way back: swap the first two passes. Founder-only: no.
- Next: `product` writes the R281(c) and R41 erratum so both read the same.
- Signed: Chief Product Officer (Claude role)

### CPO-23 M5: under the span predicate a busy day needs 4 candidates (21 Nov 2026, CPO with CDO)
- Question: #1421 gates the span predicate on `BUSY_HOURS_COUNT` (4). R281(a) says a busy day counts `BUSY_DAY` (5). The 7.2a golden is 4 candidates in one session spanning 2 h 05, which qualify (1 h 40 does not).
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CDO (the harness measures junk rate, so one named field), Karma.
- Verdict: RULED.
- Ruling: 4 under the span predicate, held in its own rules field so it has one home in `rules.ts`. `BUSY_DAY` 5 stays for the sessions-only reading. The PR 3b harness and the G4 sort may move either value.
- Reason: a golden is a worked example the spec states in numbers, and the builder matches it. R281(a) is the looser prose. Four candidates in one long session (2 h or more) is a plausible busy day, so this is the choice that shows more days, and the junk bar (at most 3 in 10 before any use of "Not this one") is what checks it.
- Evidence: review A of #1421 (assumption 2); spec 7.2a golden and R281(a).
- Door: two-way. Way back: one value. Founder-only: no.
- Next: `product` rewrites R281(a) so the count is stated for each predicate; #1421 renames to the PR 1 field.
- Signed: Chief Product Officer (Claude role)

### CPO-24 M6: a video is its own candidate and does not break a picture chain (21 Nov 2026, CPO with CDO)
- Question: a video is never folded into a picture group. But `near.ts` makes a video between two pictures break their chain. Intended?
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CDO, CDesO.
- Verdict: RULED.
- Ruling: a video is always its own candidate and is never merged. The picture chain is computed over pictures only, so a video between two near pictures does not split them. A burst id on a video is ignored.
- Reason: the chain break was a side effect nobody chose, and it would count one moment as two candidates, pushing a quiet day over the busy bar.
- Evidence: review A of #1421 (assumption 3 and the surviving mutant at `exclude.ts:41`); 7.3 "a video is not merged into a group".
- Door: two-way. Way back: revert the chain change. Founder-only: no.
- Next: #1421 adds the two tests (video with a burst id; video between two near pictures).
- Signed: Chief Product Officer (Claude role)

### CDO-21 M7: a missing capture date crosses the native bridge as NaN (21 Nov 2026, CDO with Karma)
- Question: how does a missing `creationDate` reach core? #1421 drops `0` or `NaN`.
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): Karma (bridge), CPrivO (no new field).
- Verdict: RULED.
- Ruling: the native layer writes NaN into the Float64 time column for a missing date. Core drops any time that is not finite or is 0 or less, and the contract line says so. No separate "has date" column.
- Reason: a baby book has no real picture dated at or before the epoch, and a reset camera clock produces exactly that, so dropping it is right. NaN cannot collide with a real value. One sentinel keeps the contract to one line.
- Evidence: review A of #1421 (note 4); `exclude.ts:38`.
- Door: two-way. Way back: add a column. Founder-only: no.
- Next: #1421 adds one test each for Infinity and a negative date; PR 9 contract states it; G1a-L confirms the date behaviour on a device (UNVERIFIED).
- Signed: Chief Data Officer (Claude role)

### CPrivO-13 M8: drop the HIDDEN and NOT_USER_LIBRARY subtype bits (21 Nov 2026, CPrivO with CISO, CDO and Karma)
- Question: #1421 `AssetColumns` carries HIDDEN and NOT_USER_LIBRARY bits, which imply reading `isHidden` and `sourceType`, outside the closed `READ_SET_V1` (NS-53-R37). Drop or allow? And who owns the bit values?
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CISO (the scan fails the build on any other property name), CDO, Karma.
- Verdict: RULED.
- Ruling: drop both bits. Hidden is excluded because the fetch never sets `includeHiddenAssets`; non-user-library by the fetch's explicit source option. Those are fetch options, not property reads, so the set does not widen. Core keeps only date, screenshot, recording, animation and panorama checks. The `SUBTYPE` and `KIND_*` values have one owner, `columns.ts`, and PR 9 imports them.
- Reason: this collects less and keeps the closed set closed. Widening READ_SET_V1 is a founder approval (R37 OPEN, O-15), and I do not ask for it when the fetch already does the job.
- Evidence: review A of #1421 (note 2); spec 7.1 and R37. Whether Apple's fetch options behave as the spec says is UNVERIFIED (a G1a-L item).
- Door: two-way. Way back: widen the set, which needs the founder. Founder-only: only the READ_SET_V1 approval itself, which this ruling does not touch.
- What moves: hidden and source exclusion move from core to the fetch options, which the spec states (7.1) but whose behaviour is UNVERIFIED. G1a-L must confirm it on a device before the Moments flag goes on. Errata owed by `product`: 7.1 (core no longer sees these bits) and R38 (its list of what core drops loses hidden and non-user-library).
- Next: #1421 removes the bits and their tests; the scan of R37 stays as written. Dropping the bits removes a layer, so a test or scan must prove the fetch never sets `includeHiddenAssets` and does pass the source option explicitly (`includeAssetSourceTypes`, whose default is UNVERIFIED).
- Signed: Chief Privacy Officer (Claude role, not counsel), with CISO (Claude role, not an auditor)

### CPO-25 M9: place and rotation defaults (21 Nov 2026, CPO with CPrivO, CDO and CDesO)
- Question: #1414 and #1417 carry unmarked defaults. Which stand?
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CPrivO (place is a sensitive read), CDO, CDesO.
- Verdict: RULED, each a PROPOSED default.
- Ruling: (a) a tie for home gives no home and so no place line. (b) The share denominator counts placed candidates only (it shows fewer lines, never more). (c) A stay needs at least 2 days with a gap of 0 days. (d) `majorityShare` 0.5, strict. (e) `minPicturesAtPlace` 3, which matches the Asha golden of 3 and 3. (f) `maxRun` 7, and a longer run is dropped whole. (g) `ROTATE_K` 5, which has no spec or review source (P6 says only that the card sort sets it): it is a PROPOSED default to be set by the card sort, not derived from anything, and `tiles` 4 (4 matches the 2 by 2 layout of 7.3). All go into `rules.ts` as PROPOSED values with the version bumped, and the rotation text `localDate|bookId` is fixed as the contract two phones share, with a test that varies `bookId`.
- Reason: every choice leans to showing less when unsure, which is the abstain-over-guess posture of R204. The values carry no promise. The card sort has the numbers' real answer.
- Evidence: reviews A of #1414 (notes 4 and 5, assumptions) and #1417 (notes 1 and 7, assumptions).
- Door: two-way. Way back: edit the values; a version bump invalidates nothing stored. Founder-only: no.
- Next: #1435 gains the rules fields; #1414 and #1417 take them from `MOMENTS_RULES`; `ASSUMED:` lines everywhere. Reconcile the two table types so `PlaceIndex` is the one shape (review of #1414).
- Signed: Chief Product Officer (Claude role)

### CPrivO-14 M10: the fixture that holds a coordinate leaves `src` (21 Nov 2026, CPrivO with CISO)
- Question: `place-fixture.ts` in `packages/core/src` has `lat` and `lon` fields and is bundled by Metro. R61 and the scans of R43 and R202 read `packages/core/src/moments`.
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CISO, Karma.
- Verdict: RULED.
- Ruling: move it to `packages/core/test/moments/`. Nothing in `src` takes a coordinate. If a dev harness needs a source, it gets pre-computed cell ids with no coordinate. Add the import-graph assertion that no file in `src` imports from `test` (required, because the header comment claims one exists). Keep one hash function (the duplicate in a test-only file is fine).
- Reason: R61 says no coordinate field on a model, route, log or fixture. A coordinate in app code is a surface that the scan would have to allow-list, and an allow-list is weaker than a move.
- Evidence: review A of #1414 (note 1); spec R61, R228.
- Door: two-way. Way back: move it back and write the allow-list entry. Founder-only: no.
- Next: #1414 moves the file in the same PR (it stays over the 400-line gate, which is Karma's `size:accepted` call and not this ruling).
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-15 C1 (audit F5): analytics consent and id are per person (21 Nov 2026, CPrivO with CLO, CCO, CISO and CDO)
- Question: analytics consent and the random id live in the settings table, per phone. On a shared phone, account B inherits A's yes and the same id. Per person, or per phone?
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CLO and CCO (consent is the person's own, not the phone's; law not read this session, UNVERIFIED, counsel to confirm), CISO, CDO (a rotated id breaks linkage across people), Karma.
- Verdict: RULED as a build gate, with no promise changed. Analytics is off in v1.0 and no SDK is in the bundle, so nothing is live.
- Ruling: per person. At every user change and at sign-out, in the same place as `joinWait.clear()` in `publishAuth`, analytics consent goes back to unanswered and the id is rotated. The reset clears the stored consent in the settings table (`lib/analytics/index.ts:46-50`), not only memory, and the test reads the table. No analytics SDK may ship before that is built and tested. Nothing here changes any words a person reads.
- Reason: it keeps less and asks again, so it only tightens the opt-in promise. A yes given by one person on a shared phone is not a yes from the next.
- Evidence: audit F5; review B of #1427 (accurate, latent); `lib/analytics/index.ts:46-110`.
- Decision rights: internal behaviour that keeps less, latent (no SDK), and not a user promise under CR-73.
- Door: two-way. Way back: remove the reset. Founder-only: no for the build gate. If the founder wants a per-phone choice, or the policy says otherwise, that is his.
- Next: one backlog row, ready only when an analytics SDK is on the plan (`product`); `security-architect` adds the test through `publishAuth`.
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CISO-2 C2 (audit F6): a pending invite token is cleared at sign-out only if a signed-in session had read it (21 Nov 2026, CISO with CPrivO, CLO and CPO)
- Question: a saved invite token survives sign-out and a user change for up to 14 days, and the server treats it as a single-use bearer not bound to a person. Keep, clear when a session had read it, or shorten the cap?
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CPrivO, CLO (the invite is the inviter's offer, not a right of the next account), CPO (A-REQ-028: it survives sign-in and a kill), Karma.
- Verdict: RULED for the middle path. The 14-day cap is not touched and is founder-only.
- Ruling: clear the token at sign-out or user change only when a signed-in session had already read it. The "had read it" mark is persisted with the token, in the same Keychain item (for example the id of the signed-in user whose session read it). Develop stores only `{token, receivedAt}` (`pending-invite.ts:10-27`) and reads it once, at `invite/index.tsx:96` or in the launch watcher, so a mark held in memory would be lost on a kill and relaunch and the leak would stay. The clear runs next to `joinWait.clear()` (`auth-store.ts:123`), on sign-out and on any user change. "Open the link, then sign in" still works, and so does a kill and relaunch. A token nobody read in a signed-in session stays. Default if asked about the cap: keep 14 days, unchanged.
- Accepted residue: a token saved while A is signed in, before any screen has read it, then A signs out and B signs in and reads it: it is unread, so it stays, which is the intended open-link-then-sign-in path. The clear is an async Keychain call fired from the synchronous `publishAuth`, and `clearPendingInvite` swallows a locked Keychain (`pending-invite.ts:39-45`), so a failed clear is fail-open and the 14 days still bounds it.
- Decision rights: internal behaviour that keeps less. It is not a user promise under CR-73, and the cap (A-REQ-028) is untouched.
- Reason: this closes the one case that is a leak, "A saw the preview, signs out, B taps". It does not make the invite shorter-lived for anyone who has not yet signed in, so the A-REQ-028 promise holds.
- Evidence: audit F6; review B of #1427; `lib/family/pending-invite.ts:9-45`; `accept_child_invite` (single use, expiry).
- Door: two-way. Way back: remove the clear. Founder-only: the cap (A-REQ-028 is a promise).
- Next: a fix PR from `sync` or `mobile`, test first, through `publishAuth`. The test must cover kill and relaunch between the read and the sign-out, and a user change with no null step in between. CDesO has no new word to write.
- Signed: CISO (Claude role, not an auditor), with the Chief Privacy Officer (Claude role, not counsel)

### CISO-3 C3 (audit F8 to F11): fix F8 now, accept F9 to F11 (21 Nov 2026, CISO with CPrivO and CPO)
- Question: what to do with the four lower findings.
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CPrivO, CPO, Karma.
- Verdict: RULED.
- Ruling: F8 fix now, one concern: key the new-device report `inFlight` by the user id the call was asked for, and check that the access token read inside `reportOnce` after its await belongs to that same user, so B's report can never carry A's token and B does not lose its new-device email because A's report was in flight (`report.ts:24-47`). F9 accept: one install id per phone is by design, and the privacy data map gets one row saying an operator can link two accounts on one phone (a public policy sentence, if any, goes to counsel and the founder). F10 accept: a draft id and a 5 second window, no words. F11 accept: an unowned local book is offered to the first account that signs in (A-REQ-015); `product` adds a check that the claim is an explicit choice and never automatic. Recorded as an accepted exposure of the phone's first holder, not as "no person data": `bookVisibleTo` returns true for an unowned book to any signed-in user (`account-scope.logic.ts:35-37`), so a second person who signs in first sees the pre-account book (child name, letters) before any claim choice. Sync stays off until the claim, so nothing leaves the phone. It is A-REQ-015 by design and not fixed here. F2 to F4 stay queued as in the audit.
- Reason: F8 is the only one that suppresses a security notice for a real person. The others are intended or carry no person data.
- Evidence: audit F8 to F11; review B of #1427 confirms the file and line cites. F11 behaviour was not run.
- Door: two-way. Way back: revert the keying. Founder-only: no.
- Next: one fix PR (`sync` or `mobile`) with a failing test first.
- Signed: CISO (Claude role, not an auditor)

### Hand-back table, batch 3

| Q | Verdict | Next action | Unblocks |
|---|---|---|---|
| M1 earlier middle session | RULED CPO-19 | #1417 `ASSUMED:` line; product erratum to 7.3 | #1417 |
| M2 one video, also on fallback | RULED CPO-20 | none | #1417 |
| M3 virtual edges | RULED CPO-21 | #1417 two goldens | #1417 |
| M4 attached before heart | RULED CPO-22 | product erratum R281(c), R41 | #1417 |
| M5 count 4 under span | RULED CPO-23 | product rewrites R281(a); #1421 uses the PR 1 field | #1421 |
| M6 video never breaks a chain | RULED CPO-24 | #1421 two tests | #1421 |
| M7 missing date is NaN | RULED CDO-21 | PR 9 contract line | #1421 |
| M8 drop two subtype bits | RULED CPrivO-13 | #1421 removes bits; test the fetch options; G1a-L confirms | #1421 |
| M9 place and rotation defaults | RULED CPO-25 | #1435 gains the rules fields | #1414, #1417, #1435 |
| M10 fixture out of `src` | RULED CPrivO-14 | #1414 moves the file | #1414 |
| C1 analytics per person | RULED CPrivO-15 | a row, gated on an SDK | none (latent) |
| C2 invite token | RULED CISO-2 (mark stored in the Keychain item; cap stays, founder-only) | fix PR; test covers kill and relaunch | none; #1427 is docs |
| C3 F8 to F11 | RULED CISO-3 (F11 recorded as accepted exposure) | F8 fix PR keyed by requested user and token user | #1428 and #1427 are not blocked |
