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

### Founder approval of the exec decisions of 21 Nov 2026 (21 Nov 2026, recorded by Karma's session)
- What he said, as relayed to this session by Karma, verbatim: "Decide for all 10 with exec team. I approve their decision. Same for 6 moments questions."
- What it covers: the ten open items the product, data, legal and hosted-migration packs of 21 Nov 2026 put to him (GAP-04, F-21, F-08d, the two classification rows, the new-device email hold, the lock-screen rule, the whole-app label claim, the picture-discard rule, the mirror host, the hosted catch-up, and the four legal PRs), and the six Moments questions. Each entry below names the item it records and quotes this approval once, by pointing here. The six Moments decisions are recorded in the Moments spec set (`docs/product/prd/28-moments-tab.md`, `docs/product/moments-tab/FREEZE-CHECKLIST.md`) in a separate PR, and `CPO-17` below points to them.
- Tier and type: T3 delegated by the founder; clear
- Limits, as before: the council still never decides money, an account, a secret, a hosted apply, a store build or its submission, or legal text on its own. Where an entry needs his hands (a secret, an account, a merge of `docs/legal/**`), the entry says so and records the item as approved, not done. Words a parent reads stay PROPOSED content keys until he reads them in the app.
- Door: two-way. He can overrule any entry in one line, recorded as a new entry that supersedes it.
- Way back: a new entry that names the one it replaces.
- Recorded by: Karma (CTO), from the founder's words as relayed

### CDO-19 Classes for two local settings: `reminders.onSince` is L2, `app.lastPlannedVersion` is L1 (21 Nov 2026, CDO via the 21 Nov packs; not counsel; founder-approved, see the approval entry above)
- Question: BL-943 and BL-966C each add a setting kept on the phone. What class does the data inventory give them?
- Tier and type: T1; clear
- Options considered: leave both unclassified until the inventory PR; L2 for both; L2 for `reminders.onSince` and L1 for `app.lastPlannedVersion`
- Ruling: `reminders.onSince` is L2 (a local date, YYYY-MM-DD, that says when reminders were last turned on, not what anyone said). `app.lastPlannedVersion` is L1 (an app version string). Both stay on the phone, are not synced or exported, are never logged, and `reminders.onSince` clears with `reminders.*` (NS-13-R14). Each PR that adds one carries its inventory row. The `docs/legal/DATA_CLASSIFICATION.md` edit itself stays a founder-merge docs PR (D-125): this entry rules the class and edits no legal file. Not covered here: `scribe.auth.deviceId` and the new-device tables, which are new personal data with a retention clock (CPrivO proposes, the founder decides, counsel confirms Q9, Q11 and Q14).
- Why: both classes are already written in `docs/product/prd/09-capture.md:220` and `docs/product/prd/tools/review/eng/B-mobile-client.md:98,105` and in the two briefs; neither adds a category of personal data, a promise or a retention clock.
- Door: two-way
- Way back: change the row; no data moves.
- Revisit when: either value is ever synced, logged or sent.
- Signed: Chief Data Officer (Claude role, not counsel)

### CDO-20 Hosted migrations: one staging catch-up, pepper first, production only after staging is green (21 Nov 2026, CDO via the 21 Nov packs; founder-approved in principle, see the approval entry above)
- Question: `.github/migrations-applied.txt` lists only files 1 and 2 and `supabase/APPLY.md` marks files 3 to 38 pending. How do they reach the hosted projects?
- Tier and type: T3 delegated by the founder; complicated
- Options considered: apply file by file as each is needed; one catch-up run of everything on `develop`, staging first; apply to production first
- Ruling: approved in principle. Staging first, as one catch-up run of APPLY files 3 to 38 in filename order. The consent pepper (`app.consent_pepper`, APPLY Step 6) is set first, because files 14 and 30 need it (file 30 refuses without it). Before the run, the "Before counts" queries for files 22, 23 and 33 are read (a CHECK fails on bad rows for 23, and file 33 needs the photo-path count to be 0). Each APPLY check query is run after, and the smoke test must pass. Production gets a `db-v*` tag only after staging is green, on a commit on `main`. Exposed schemas stay `public` only. `NEW_DEVICE_EMAIL` stays off (CPrivO-8).
- What is not done: the pepper is a secret and the apply is an account action, so both are the founder's hands. Status: approved, awaiting pepper and apply. Hosted state is UNVERIFIED: the Supabase `list_migrations` call was not available to the seat, so what each project holds is read from the repository only. Run `select version from supabase_migrations.schema_migrations order by 1` on each project before approving the run.
- Why: files 1 to 25 have to land together on a new project (file 25 holds the explicit grants, without which sign-in, consent and sync answer 42501), CI applies from the tip of `develop` in filename order, and a servers-on build against a server missing files 3 to 17 fails at sign-in and sync.
- Door: one-way for files 26, 33, 34 and 35 (forward-fix only), two-way for the rest (APPLY has rollback sections)
- Way back: forward-fix migrations; the rollback sections of APPLY for files 4 to 16.
- Revisit when: the founder has the pepper set, or `list_migrations` shows the hosted state differs from the repository's assumption.
- Signed: Chief Data Officer (Claude role, not counsel)

### CPrivO-8 `NEW_DEVICE_EMAIL` stays off until the fill call ships, the claim check is done and the pending table is cleared (21 Nov 2026, CPrivO via the 21 Nov packs; not counsel; founder-approved, see the approval entry above)
- Question: the new-device email sender, its hardening and the fill function are merged and dark. When may anyone turn the flag on?
- Tier and type: T1; clear
- Options considered: allow it on staging now; hold until the conditions below; delete the feature
- Ruling: nobody sets `NEW_DEVICE_EMAIL=on` on the function, or `EXPO_PUBLIC_NEW_DEVICE_EMAIL=on` in any build, until (1) the app call for fill has shipped, (2) the hosted JWT claim check is done and on file, (3) the pending table is cleared, and (4) the device-table class rows are in `docs/legal/DATA_CLASSIFICATION.md` and the label document and the founder has read the email and page words. The flag stays out of `eas.json` and the store profiles (gate G6). The flip itself is later and is the founder's (a hosted secret, hosted migrations, an account, user-facing words). Verify step: the store-flags test and the sender's 200-and-no-rows dark test.
- Why: a live sender queues pending rows that hold session ids (L3) before the fill path drains them. Collecting nothing until the promise is true is the seat's call.
- Door: two-way
- Way back: lift the hold in one line here once the founder records the flip.
- Revisit when: all four conditions hold, or counsel answers Q9, Q11 and Q14.
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-9 A lock screen shows no name, age or kind of day; the neutral body is "Whenever you have a minute." (21 Nov 2026, CPrivO via the 21 Nov packs; not counsel; the wording is a founder-approved exec decision, see the approval entry above)
- Question: what must a day, month-note or birthday reminder show on a locked phone, and what is the one neutral body (F-08d)? `days.lock.body.neutral` ("A day you chose to mark. A few words, if you like.") is untrue once the month note and the birthday reuse it.
- Tier and type: T2 (user-visible words; changes a string the 20 Nov ruling fixed); clear
- Options considered: keep the 20 Nov string for all three; one new string true for all three; a different string per kind
- Ruling: (1) the constraint: any lock-screen title or body for a days, month-note or birthday reminder carries no child name, no age, no month number and nothing that tells the three kinds apart (E82; names off is the default). (2) the decision: the neutral lock-screen body is "Whenever you have a minute." for the day, the month note and the birthday reminder. This is a founder-approved exec decision and it supersedes the 20 Nov single string. The hidden-preview placeholder stays the longer sentence in the Days WORDS document. The title "Something for the book today" stays PROPOSED and is not decided here. (3) the string change is a separate content PR, a lane that is yet to be started; until it merges the key keeps its current value in the code. The content rules test (no "note", no "push" in the glossary) still applies to it, and counsel confirms that no fact about the child shows.
- Why: a lock screen is read by people the parent did not choose. Showing less is the seat's; the wording is the founder's, and he has now approved it.
- Door: two-way
- Way back: a new entry with another string; one content key.
- Revisit when: a device test shows a parent cannot tell the reminder is theirs.
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-10 No whole-app "Data Not Collected" claim while Moments exists (21 Nov 2026, CPrivO via the 21 Nov packs; not counsel; founder-approved, see the approval entry above)
- Question: may a store build, label draft or web page say "Data Not Collected" for the whole app while production builds have server features on and Moments reads the photo library?
- Tier and type: T1; clear
- Options considered: allow it; a claim per data type; hold the claim
- Ruling: no store copy, label draft or website line says "Data Not Collected" for the whole app. A per-type line may say "Photos or Videos: not collected", and only while no picture leaves the phone and the closed-bucket migration (APPLY file 33) is applied. The privacy policy's "servers off" line and the `capabilities.ts` header are corrected before any servers-on build links them. The label of record is still decided with counsel (Q1 and Q8).
- Why: `eas.json` production has server features on (per the privacy lens; read again before the claim is used); guideline 2.3.1(a); the same-build rule for promises.
- Door: two-way
- Way back: lift the hold when the build lists match the claim.
- Revisit when: counsel answers Q1 and Q8.
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-11 A pending photo is discarded on every change of the signed-in person, a plain account switch included (21 Nov 2026, CPrivO via the 21 Nov packs; not counsel; founder-approved, see the approval entry above)
- Question: when the person using the phone changes, what happens to a picture a parent has chosen but not yet kept?
- Tier and type: T1; clear
- Options considered: discard only on sign-out and Erase everything; discard on every change of the session user; keep it for the next person
- Ruling: the pending photo is discarded on every change of the session user, including a plain account switch. This matches what merged PR #1340 builds. No pending picture ever crosses from one signed-in person to the next.
- Why: a chosen picture is a child's picture (L4) and belongs to the person who chose it. Keeping less is the seat's.
- Door: two-way
- Way back: a new entry; the discard is one call in the session change.
- Revisit when: a device test shows a person losing a picture they meant to keep across a refresh of their own session (a refresh for the same person is not a change).
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CPO-16 GAP-04: no taught-names screen in 1.0 (21 Nov 2026, CPO via the 21 Nov packs; founder-approved, see the approval entry above)
- Question: `docs/design/DESIGN-GAPS-21nov.md:25` asks for a screen where a parent teaches, edits and removes names the speech step should spell correctly. No design and no route exists. Is it in 1.0?
- Tier and type: T3 delegated by the founder (scope); complicated
- Options considered: build the screen for 1.0; no screen in 1.0, with a 1.1 candidate after real mishearings show up
- Ruling: no taught-names screen in 1.0. The engine keeps its protections (FR-AIS-34, `packages/core/src/lang/dictionary.ts`): the dictionary seeds only from names the parent already typed (the child's name and the From names). design-systems draws nothing for it. The PATH-12 and E80 design lines read "no screen". The built page keeps its name, "Your words" (`docs/design/specs/09-YOUR-WORDS-21nov.md`). GAP-03 is separate and stays the CPO's.
- Why: a names screen adds a place where a child's name (L4) is typed and stored, which the device-only store schema has no table for, and it is a scope change for 1.0.
- Door: two-way
- Way back: a new entry; a 1.1 row.
- Revisit when: real recordings show names being misheard often enough to need it.
- Signed: Chief Product Officer (Claude role)

### CPO-17 The six Moments questions are decided by the council and approved by the founder (21 Nov 2026, CPO via the 21 Nov packs; founder-approved, see the approval entry above)
- Question: the founder said "Same for 6 moments questions". What was decided, and where is it written?
- Tier and type: T3 delegated by the founder; complicated
- Ruling: the six are recorded as decided by the council and approved by him in the Moments spec set (`docs/product/prd/28-moments-tab.md`, `docs/product/moments-tab/FREEZE-CHECKLIST.md`), in a separate PR. In one line each: (1) Moments is the second of four tabs (Home, Moments, Book, Me) and Home stays the landing tab; (2) the first Moments release reads the photo library in 1.0 (places and occasions in, faces and naming people out), the G6 production-flags guard is amended in the PR that adds the PHAsset use and its usage strings, and gates G1 to G11 apply before store submission, not before coding; (3) only the person's own photo metadata (date and place) is used, and no machine-written scene, face or people label is shown or stored as the family's words; (4) the picture copies stay in the iPhone backup as ADR 0028 D1 says and the policy discloses it; (5) no library-timed push and no Moments email in 1.0, both off; (6) no whole-app "Data Not Collected" claim (CPrivO-10). Words a parent reads stay PROPOSED.
- Why: each follows the default the spec already followed, with the constitution winning where a machine label would add meaning.
- Door: two-way for 1, 3, 5 and 6; one-way with cost for 2 once the usage strings are in a store build
- Way back: a new entry; the spec set's dated lines.
- Revisit when: counsel answers the library questions, or the first store build shows the tab order failing in a walk.
- Signed: Chief Product Officer (Claude role), with the Chief Privacy Officer (Claude role, not counsel)

### CDesO-10 F-21: 1.0 says plainly that a picture has no description of its own, and makes no accessibility claim for pictures (21 Nov 2026, CDesO via the 21 Nov packs; not counsel; founder-approved, see the approval entry above)
- Question: NS-01-R50 hides the photo words and place fields in every production build, because iOS writing tools cannot be turned off per field. Spec 01 section 8 calls the typed words "the only text alternative". May 1.0 say plainly that a picture has no per-picture description in production, and say nothing about picture accessibility?
- Tier and type: T2 (what users are told); clear
- Options considered: claim the typed words as the description; say plainly there is none and claim nothing; hold the photos
- Ruling: 1.0 says plainly that it has no per-picture description in production, and makes no accessibility claim for pictures (no "accessible" or "described" wording on the store page, the website or in the app for pictures) until the native setting ships and has been tested on a device. VoiceOver reads the fixed phrase and then the letter's own words; the app never generates a description (the constitution). The wording stays PROPOSED and goes through the content lane. Striking "only" in spec 01 section 8 follows this ruling in a separate docs PR.
- Why: the hidden-field default is the constitution winning and needs no ruling; a claim that the product cannot back is what guideline 2.3.1(a) calls misleading.
- Door: two-way
- Way back: a new entry once the native setting ships and a device test passes.
- Revisit when: the native setting ships.
- Signed: Chief Design Officer (Claude role), with the Chief Privacy Officer (Claude role, not counsel)

### CFO-14 BL-414 mirror host: not now (21 Nov 2026, CFO via the 21 Nov packs; not an accountant; founder-approved, see the approval entry above)
- Question: should a second hostname and bucket for the model-download mirror be set up now?
- Tier and type: T3 delegated by the founder (money, an account); complicated
- Options considered: set up the mirror now; not now, keep the failover code, revisit after the first store build
- Ruling: not now. The failover code stays in the app. Revisit after the first store build. A second hostname and bucket cost money, need an account, and add a new processor line to `docs/legal/DATA_CLASSIFICATION.md` section 4.8 and to the privacy policy, so setting it up is the founder's hands and a legal-file merge.
- Why: the first build does not need the second host to work; the cost and the new processor line buy resilience nobody has needed yet.
- Door: two-way
- Way back: a new entry; the code is already there.
- Revisit when: the first store build is out, or a download failure is seen.
- Signed: Chief Financial Officer (Claude role, not an accountant), with the Chief Privacy Officer (Claude role, not counsel)

### CLO-19 Four legal PRs: merge order and one wording (21 Nov 2026, CLO and CCO via the 21 Nov packs; not lawyers; founder-approved, see the approval entry above)
- Question: four open PRs touch legal files (#1215, #1117, #799, #873). What happens to each, and what rule follows from "no model name as the author"?
- Tier and type: T3 delegated by the founder (legal text, D-125); complicated
- Options considered: merge all as they are; merge in the order below with the conditions; close all
- Ruling: (1) #1215 (export spec 4.2, the picture copy is a re-encoded JPEG, not the original) merges after reviews at its current head. (2) #1117 is reworded so the revision row reads "prepared by the Chief Legal Officer (a Claude role, not a lawyer) for counsel review", then merges after reviews at its head. (3) #873 (the data inventory) merges after reviews at its new head; it names the nightly encrypted backup and folds in #799's row. (4) #799 closes after #873 merges and is not merged. (5) The founder's rule, as relayed by Karma: "no model name as the author of a doc". Its scope is the authorship lines of documents. The 45 "(Claude role)" sign-offs stay: they name the role first and keep the honest disclosure.
- Why: #873 feeds the privacy label, the privacy policy and the subprocessor list; #799 is superseded by it, and merging both would collide.
- State read through the REST API when this entry was written (21 Nov 2026): #1215 and #873 are already merged (22:10 and 22:08 UTC), #799 is closed and was not merged, and #1117 is open at head 7b1f03c2. So items (1), (3) and (4) are done and this entry records them as approved; item (2) and the authorship rule are still to do. Not checked: whether #1215 and #873 had reviews at their merged heads, and the reviews and checks on #1117. Karma's merge gate (CR-70) reads those. None of the four is on the D-125 item 7 list; counsel's answers gate the first binary, not these PRs.
- Door: two-way
- Way back: revert the PR.
- Revisit when: counsel reads the wording of the backup clock and the picture-export promise.
- Signed: Chief Legal Officer (Claude role, not a lawyer), with the Chief Compliance Officer (Claude role, not counsel)

### CR-74 reading confirmed by the founder (21 Nov 2026, recorded by Karma's session)
- `docs/agents/cto/RULINGS.md` CR-74 gave Karma's reading of the founder's words "Do all waiting for me. I approve." (approval to stop holding merges on the macOS wait where the risk allows) "for him to confirm or correct".
- He has now said, verbatim, as relayed: "Decide for all 10 with exec team. I approve their decision. Same for 6 moments questions." This is recorded here as his confirmation of Karma's reading of CR-74, as Karma relayed it. CR-74 is unchanged and stays in Karma's log, which is append-only.
- Door: two-way. Way back: one line from the founder, as CR-74 says.
- Recorded by: Karma (CTO)

### CR-144 Standing delegation, 21 Nov 2026 (21 Nov 2026, Karma, recorded in the exec log because it binds every council seat)
- Why CR-144: develop shows CR-131 as the highest CR number cited (CR-999 is a test fixture) and open PRs cite up to CR-143, so CR-144 is the next free number. Not checked: the Project docs `infra/exec-rulings-*`, which this session cannot read.
- The founder's words, as relayed to this session by the coordinator, verbatim (two messages, see 1 to 4 and 5): "Yes lock those decisions and when ever you need a decision do exec review with all and based on that lock that decision to continue working. Do as much as you can in parallel agents. Have atleast 20 agent threads in parallel all time."
- Ruling:
  1. The decisions recorded in this log on 21 Nov 2026 (the approval entry, CDO-19, CDO-20, CPrivO-8 to CPrivO-11, CPO-16, CPO-17, CDesO-10, CFO-14, CLO-19 and the CR-74 note) are LOCKED. Only a new entry can supersede one.
  2. When Karma needs a decision that would otherwise go to the founder, Karma runs an exec review with all the council seats of COUNCIL section 4 (CPO, CDesO, CMO, CBO, CFO, CLO, CCO, CPrivO, CISO, CDO, CAIO, with Karma as CTO). The verdict is recorded as a ruling with each seat's input in one or two lines and any dissent, locked, and work continues.
  3. This does not cover what needs the founder's own hands or is outside what a ruling can do: secrets and credentials (for example the consent pepper); account actions (hosted migration apply, the store, Apple, Expo, Vercel, domains); spending money; changing the constitution in `CLAUDE.md`; and publishing legal text that counsel must see before it goes live. For these Karma prepares everything and the founder only executes. The founder-only list in CR-73 stands.
  4. Karma keeps at least 20 agent threads running in parallel, within the one-concern-per-PR and review rules (CR-70).
  5. The founder also said on 21 Nov 2026, verbatim as relayed: "Run any command needed yourself with CTO. Don't ask me to do such things you can find a way yourself with CTO approval." So Karma runs any command needed (git, gh, scripts, local resets of the main checkout) himself under CTO approval and does not hand such tasks to the founder. The limits in 3 are unchanged: nothing that needs the founder's own secrets or accounts (the consent pepper, hosted apply, store, Apple, Expo, Vercel, domains), no spending money, no change to the constitution, no publishing of legal text counsel must see. Never a force-push, never rewriting anyone else's history, never a push to `develop` or `main`.
- Door: two-way. Way back: one line from the founder, recorded as a new entry.
- Revisit when: the founder says so, or a locked decision is found to rest on a fact that was wrong.
- Signed: Karma (CTO)
