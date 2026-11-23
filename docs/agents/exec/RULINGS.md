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
- Standing caveat for every founder line quoted in this log: each is a chat line, relayed to this session by the coordinator or Karma, not read from the founder's own message and not signed. Nothing here is a signature. All council seats run from one account and one model family, as CR-70 states, so the seats are not independent reviewers of each other.
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
- Ruling: (1) the constraint: any lock-screen title or body for a days, month-note or birthday reminder carries no child name, no age, no month number and nothing that tells the three kinds apart (E82; names off is the default). (2) the decision: the neutral lock-screen body is "Whenever you have a minute." for the day, the month note and the birthday reminder. This is PROPOSED wording, decided by the council and approved by the founder as the exec decision (a chat line, relayed, unsigned); parent-facing words stay PROPOSED until approved in the app. It supersedes the 20 Nov single string. Carve-out, confirmed by Karma as CTO on 21 Nov 2026: the names-ON bodies, which the parent controls through the D-025 switch (default names-off), keep `{child}`. This ruling is about the neutral body shown with names off, and about what nothing may put on a lock screen without the parent's switch. The hidden-preview placeholder stays the longer sentence in the Days WORDS document. The title "Something for the book today" stays PROPOSED and is not decided here. (3) the string change is a separate content PR, a lane that is yet to be started; until it merges the key keeps its current value in the code. The content rules test (no "note", no "push" in the glossary) still applies to it, and counsel confirms that no fact about the child shows.
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
- State read through the REST API on 21 Nov 2026 and again after merging origin/develop into this branch: #1117, #1215 and #873 are already merged and #799 is closed and was not merged. So the four items are done and this entry records them. The founder's chat approval (relayed, unsigned) covered those merges. It does not cover any future legal merge: `docs/legal/**` merges otherwise stay founder-only (CR-73, D-125), and nothing in this entry or in CR-144 locks one. Not checked: the reviews and checks on those four at their merged heads. None of the four is on the D-125 item 7 list; counsel's answers gate the first binary, not these PRs.
- Door: two-way
- Way back: revert the PR.
- Revisit when: counsel reads the wording of the backup clock and the picture-export promise.
- Signed: Chief Legal Officer (Claude role, not a lawyer), with the Chief Compliance Officer (Claude role, not counsel)

### CR-74 note: what the founder has and has not said about it (21 Nov 2026, recorded by Karma's session)
- CR-74 merged as #1352 under the founder's earlier chat line, relayed on 21 Nov 2026: "Do all waiting for me. I approve." CR-74 gave Karma's reading of that line "for him to confirm or correct".
- He has not reviewed CR-74's wording separately. His later line quoted in the approval entry above is about the ten items and the six Moments questions, not about CR-74, and this log does not treat it as a confirmation of CR-74.
- CR-74 is unchanged and stays in Karma's log, which is append-only.
- Door: two-way. Way back: one line from the founder, as CR-74 says.
- Recorded by: Karma (CTO)

### CR-144 Standing delegation, 21 Nov 2026 (21 Nov 2026, Karma, recorded in the exec log because it binds every council seat)
- Why CR-144: develop shows CR-131 as the highest CR number cited (CR-999 is a test fixture) and the open PRs read at that time cited up to CR-143, so CR-144 was the next free number (a later open PR, #1415, took CR-145). Not checked: the Project docs `infra/exec-rulings-*`, which this session cannot read.
- The founder's words, as relayed to this session by the coordinator, verbatim (two messages, see 1 to 4 and 5): "Yes lock those decisions and when ever you need a decision do exec review with all and based on that lock that decision to continue working. Do as much as you can in parallel agents. Have atleast 20 agent threads in parallel all time."
- Ruling:
  1. The decisions recorded in this log on 21 Nov 2026 (the approval entry, CDO-19, CDO-20, CPrivO-8 to CPrivO-11, CPO-16, CPO-17, CDesO-10, CFO-14, CLO-19 and the CR-74 note) are LOCKED. Only a new entry can supersede one.
  2. When Karma needs a decision that would otherwise go to the founder, Karma runs an exec review with all the council seats of COUNCIL section 4 (CPO, CDesO, CMO, CBO, CFO, CLO, CCO, CPrivO, CISO, CDO, CAIO, with Karma as CTO). The verdict is recorded as a ruling with each seat's input in one or two lines and any dissent, locked, and work continues.
  3. This does not cover the founder-only list of CR-73, which stands whole: what users are promised, scope and dates, `docs/DECISIONS.md` entries that are not his recorded words, one-way doors, the `approve-migration` label, money, accounts and secrets (for example the consent pepper), hosted migrations, store builds and submission (Apple, Expo, Vercel, domains), legal text (including legal text counsel must see before it goes live) and the constitution in `CLAUDE.md`. For these Karma prepares everything and the founder only executes. Docs of this kind merge only as CR-73 and D-125 say.
  4. Karma keeps at least 20 agent threads running in parallel, within the one-concern-per-PR and review rules (CR-70).
  5. The founder also said on 21 Nov 2026, verbatim as relayed: "Run any command needed yourself with CTO. Don't ask me to do such things you can find a way yourself with CTO approval." So Karma runs any command needed (git, gh, scripts, local resets of the main checkout) himself under CTO approval and does not hand such tasks to the founder. The limits in 3 are unchanged: nothing that needs the founder's own secrets or accounts (the consent pepper, hosted apply, store, Apple, Expo, Vercel, domains), no spending money, no change to the constitution, no publishing of legal text counsel must see. Never a force-push, never rewriting anyone else's history, never a push to `develop` or `main`. Non-bypass: nothing here lifts the permission system and its denials, CODEOWNERS, branch protection, the compliance fence (CR-27), the counted-review gates or any CR-73 founder-only path. A denied call is reported, not worked around. "Local resets of the main checkout" applies to Karma's own session only.
- Door: two-way. Way back: one line from the founder, recorded as a new entry.
- Revisit when: the founder says so, or a locked decision is found to rest on a fact that was wrong.
- Signed: Karma (CTO)


### Council batch 1 verdicts, 21 Nov 2026: the next seven entries
- These seven entries record the six verdicts of the council's first batch of 21 Nov 2026 (BL-421, BL-1486, BL-460, the photo claims, the photos-flag conditions, BL-412). They are locked under CR-144 (standing delegation), not approved by the founder one by one. Every seat ran from one account and one model family (CR-70), and each seat's input is the same session in a different voice, not an independent review. Each is two-way until its door line says otherwise, and the founder can overrule any in one line. The council's working file is outside this repository.
- Numbers: renumbered from the working ids to the next free ones after checking develop and the patches of the open PRs on 21 Nov 2026 (CR-145 is taken by #1415, so the two Karma entries here are CR-146 and CR-147; CMO-1 to CMO-16 are used, so the claims entry is CMO-17). Not checked: the Project docs `infra/exec-rulings-*`.

### CDesO-11 BL-421 is superseded; the Book keeps the per-card signature (21 Nov 2026, CDesO via Karma's exec review; with CPO)
- Question: close BL-421 (month placeholder line, voice play glyph, author only when more than one writes) against the newer Book design, and should a one-writer book drop the signature?
- Tier and type: T1; clear
- Options considered: close as superseded and keep the signature; close and drop the signature in one-writer books; build the three asks
- Ruling: close as superseded. Ask 1 is gone (BOOK_PAGE.md line 62: opener has no sentence); ask 2 is refused by BOOK_PAGE.md line 81 ("never a play button, the card is the one target"); ask 3 is refused by BOOK_PAGE.md line 63 and IA-FINAL row 6. Every letter card keeps "From {signsAs}".
- Why: the signature feeds the VoiceOver card label (`letter-card.tsx:101`) and matches the page's own signature (IA-FINAL row 4). It does not feed the card-to-page carry (MOTION.md line 107: only the dateline and words are carried). Co-parent surfaces are alpha-only (D-162), so dropping it for one writer would unsign every 1.0 card and shift cards when a second writer arrives.
- Door: two-way
- Way back: reopen under a new BL with a design spec.
- Revisit when: the co-parent screens (BL-886) reach a store build.
- Signed: Chief Design Officer (Claude role)

### CDesO-12 Keep "Add to this letter" until the "This letter" list is built (21 Nov 2026, CDesO via Karma's exec review; with CPO and CTO)
- Question: does the #1365 heading `book.letter.addGroup` still hold now that IA-FINAL replaces the group with a "This letter" list and renames "Close this letter until a day" to "Hide until a day"?
- Tier and type: T1; clear
- Options considered: keep until the list exists; rename the heading now; build the list now
- Ruling: keep. The heading is true while the group holds only add rows and renders only with the photos flag, which no profile sets. Replace the group with the "This letter" list when a second non-photo row has a build. The list's heading words are PROPOSED content keys, founder to approve. The rename to "Hide until a day" lands with the seal row (counsel Q107, default not built); the old name exists in no code.
- Why: IA-FINAL lines 205, 216, 516, 527; CONFORMANCE F-20 ("wrap in the group when the second action lands"); packet Q107. Building a shell for off rows is gold-plating before the gate.
- Door: two-way
- Way back: one component and one key.
- Revisit when: photos, firsts or the seal first go on in a build.
- Signed: Chief Design Officer (Claude role)

### CPO-18 BL-460 points 1 and 5: fix the retry flicker now; leave the later-step join as it is for 1.0 (21 Nov 2026, CPO via Karma's exec review; with CDesO and CTO)
- Question: what should the join wait do when the joined sheet is closed at a later first-run step, and when Try again flickers?
- Tier and type: T1; clear
- Options considered: extend the wait and hand-over to every first-run step; close-as-open on later steps; leave point 1 and fix point 5 only
- Ruling: point 5 is built: a retry-in-flight state holds the stalled view and the Try again button shows the existing busy state; no new words. Point 1 is recorded as left as it is for 1.0 because the join door shows only in alpha builds (D-162). When the co-parent screens put the door into a store build (BL-886), the intended behaviour is that Close on a later step takes the same road as Open once the book is here, and a quiet line plus a waiting Continue shows on whichever step is in front while it is on its way. CDesO checks that design before that build.
- Why: `invite/index.tsx:169`, `join-wait.logic.ts:75-77`, `welcome-handoff.logic.ts`, `button.tsx:14-17`; D-162.
- Door: two-way
- Way back: remove the flag; point 1 stays recorded.
- Revisit when: BL-886 is scheduled.
- Signed: Chief Product Officer (Claude role)

### CPrivO-12 Photo claims in 1.0: CPrivO-10 stands; the listing says nothing about pictures; hold list (21 Nov 2026, CPrivO via Karma's exec review; with CLO, CMO, CCO and CDesO; not counsel)
- Question: is the locked "no whole-app Data Not Collected claim" complete, and what may the 1.0 store listing claim about photos?
- Tier and type: T1 (holds); clear
- Options considered: add to CPrivO-10; leave it; allow a per-type claim now
- Ruling: CPrivO-10 stands and is supplemented. While `EXPO_PUBLIC_PHOTOS` is off, the listing, screenshots, website, email and in-app strings say nothing about pictures. The per-type "Photos or Videos: not collected" answer stays held until APPLY file 33 is applied, and then only with counsel's read (packet Q1, Q8, Q43). Held in every build: "Data Not Collected" for the whole app; picture feature claims; "never leave your phone", "private", "secure", "encrypted" or "we never see" for pictures; any backup claim for pictures beyond the policy line; "accessible" or "described" for pictures (CDesO-10); the bare policy sentence "We do not collect ... photos" once the flag is on. Notes for Review names the dormant picture module and the flag.
- Why: CPrivO-10; D-157, D-160; label doc 2.2.0 and `app-store-connect-1.0.md` line 65; `notes-for-review-1.0.txt` lines 22 to 24; PRIVACY-CONTRADICTIONS C-2 to C-9; packet line 393. Apple rules [U]; counsel must confirm every reading.
- Door: two-way
- Way back: lift a hold when the build lists match the claim.
- Revisit when: file 33 is applied, counsel answers Q43, or the flag is scheduled.
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CMO-17 The claims inventory gains the held picture sentences (21 Nov 2026, CMO via Karma's exec review)
- Question: how does marketing treat pictures in the 1.0 listing and site?
- Tier and type: T1; clear
- Options considered: mention pictures as coming soon; say nothing; say nothing and register the held sentences
- Ruling: say nothing about pictures in any 1.0 surface; add each held sentence in CPrivO-12 as a row in the claims inventory marked "false or unverified for this build". Screenshots come from the release build.
- Why: same-build rule; guideline 2.3.1(a) as cited in the repo [U]; D-161 ("nothing says coming soon").
- Door: two-way
- Way back: set a row to true with its evidence.
- Revisit when: the photo flag is scheduled.
- Signed: Chief Marketing Officer (Claude role)

### CR-146 Conditions before `EXPO_PUBLIC_PHOTOS` is on in any store build (21 Nov 2026, Karma via the exec review; with CPrivO, CLO, CCO, CISO, CDO, CDesO, CMO)
- Question: what must be true before the photos flag is on in any store build?
- Tier and type: T2 (release config and data); complicated
- Options considered: the Moments gate set only; the NS-01 requirement rows only; one combined table
- Ruling: the twelve-row table below, copied into `docs/release/<x.y.z>.md` for the build that carries photos. No `eas.json` profile sets the flag until a PR cites that table with every row green, with two lens reviews. Whether and when photos ship is the founder's; rows 1, 4, 8, 9, 10 and 11 need his hands or approval.
- The table (every date PROPOSED; every row needs a dated line under `docs/release/<x.y.z>.md`):

| # | Condition | Evidence | Owner | Founder's hands? |
|---|---|---|---|---|
| 1 | Hosted migration `20261110000000_photo_bucket_closed.sql` (APPLY file 33) applied; founder checks `entries.photo_path` rows are zero first (the migration's own note) | `photo_bucket_closed.test.mjs` green; read-back after apply: insert into `entry-photos` refused (42501), a non-null `photo_path` refused (SCPHO). NS-01-R61: "Required before `EXPO_PUBLIC_PHOTOS` is on in `production`" | CDO and CISO prepare; founder applies (`approve-migration`, CI tag run, D-041). CDO-20 already orders the hosted catch-up | Yes (account action) |
| 2 | `child-photos` bucket: confirm no client path writes a child photo, or close it the same way | Read of the bucket policies and a grep of mobile code; one line in the release doc | CISO with CDO | No (a read); a closing migration would be the founder's apply |
| 3 | Pictures follow delete, restore and purge (brief P-5, R1a to R1c): letter erase, 30-day purge, Erase everything, sign-out; launch sweep | Tests green; device row D-3 (backup flag read-back and restore with attached pictures; MEDIA_THREAT_MODEL row P9, G7 in the Moments register) | mobile, data-architect, qa | Device run on his phone |
| 4 | Export carries pictures: BL-868 (deletion and export spec: stored stripped copy only) merged by the founder, then BL-933 (export 1.7.0) | Export test with a picture; spec line matches code | data-architect and legal draft; founder merges BL-868 (legal text, D-125) | Yes (merge) |
| 5 | DATA_CLASSIFICATION rows match the head: `entry_media`, folders, caches, derivative copies (the planned `-512` and `-1280` rows must read "built" when BL-932 lands), and the data-map row | Dated line with a commit (the Moments G11c wording) | CDO, data-architect | Founder-merge docs PR (CDO-19 pattern) |
| 6 | Kill switch `killSwitches.photos` pauses the surfaces and cannot turn them on; data rights work with the flag off (NS-01-R19) | Test plus kill-harness media points (BRIEF-KILL-MEDIA) | mobile, qa, CISO | No |
| 7 | Security read of the `scribe-photo` module and picker path: no network call, metadata stripped, no path or photo word in logs (NS-01-R51 canary), writing tools off on photo words and place (NS-01-R50: those fields not shown in any `production` profile unless the native setting exists, with the source test) | Dated line with a commit | CISO, security-architect | No |
| 8 | AX5 and Increase Contrast device pass of every photo surface (BL-1485); findings filed as rows. Spec 01 edits (BL-1484: radius `sm`, `thumbMissing`) and strike "only" in spec 01 section 8 (CDesO-10) | Written pass result in the PR; spec lines changed | design-systems, qa | Yes (his phone) |
| 9 | Privacy label answer for the build, matched to the binary and the production profile (Moments G11d wording: label, policy, usage strings, Notes for Review and privacy manifest all match) | Dated line with a commit; counsel's read on the per-type reading | CPrivO, legal, CCO | Yes (console answer) |
| 10 | Legal text published in the same build: policy backup line (MR-1), policy line 45 reworded (C-2), Terms 4.2.0 and in-app disclosures 3.5.0 (C-9: parent confirms they may use the pictures they add, including other people's children) | Merged `docs/legal` text, counsel's written read or the founder's recorded acceptance of the residual | legal drafts; counsel must confirm; founder merges | Yes (D-125) |
| 11 | Counsel Q-items answered or consciously defaulted: Q43 and Q54 (picture lines absent until read; label unchanged), BL-841's brief (CB-1 to CB-27, including the picture label read and Q79), Q129(c) (backup wording), Q45 only if a picture can leave by share. Not needed for this flag: Q107 (seal) and G8, G9 and G11b (Moments place data) | Written answer with a name and date, or the founder's recorded default | CLO prepares; founder sends | Yes (counsel is his) |
| 12 | Store paperwork and claims: Notes for Review names the picture module and the flag; screenshots and listing say what the build does; claims inventory rows for every picture sentence marked true for this build; no accessibility claim for pictures (CDesO-10) | Rows in the claims inventory; the Moments G6 content-rule scan on picture strings | CMO, CCO | Founder approves listing |

- Why: NS-01-R19, R50, R51, R61; CR-62 and CR-64; ADR 0028; BL-870, BL-868, BL-933, BL-1484, BL-1485; MR-1 (21 Nov); COUNSEL_PACKET Q43, Q54, Q129; FREEZE-CHECKLIST G5, G7, G11c, G11d.
- Door: two-way
- Way back: edit the table by a new entry.
- Revisit when: the flag is scheduled, or counsel answers.
- Signed: Karma (CTO)

### CR-147 raw_transcript is immutable on the phone too: a set-once trigger with one scoped bypass for the pull (21 Nov 2026, Karma via the exec review; with CDO, CISO and CAIO)
- Question: how do we enforce "raw_transcript is immutable" on the phone, given that `takeProvenance` replaces a phone's own non-empty raw with the server's in ADR 0025 row C?
- Tier and type: T2 (database and sync); complicated
- Options considered: A, trigger plus no replacement (breaks row C, changes D-111 item 10); B, narrow audited bypass; C, set-once trigger with the pull documented as the exception, unenforced
- Ruling: B. Local triggers `BEFORE UPDATE OF raw_transcript` on `entries` and `drafts` that abort a change of a set value; the only bypass is a row-scoped `settings('raw_takeover')` entry set and cleared inside `takeProvenance` in the same transaction, and `takeProvenance` names the column only when the value differs. Scope is `raw_transcript` only; `captured_at`, `author_id`, `child_id` and `engine_version` have legitimate local writers and stay unguarded now, with a follow-up row for data-architect. Detail: two set-once triggers on `raw_transcript`, both `BEFORE UPDATE OF raw_transcript`, one on `entries` (bypass only for the row whose id is in `settings('raw_takeover')`) and one on `drafts` (no bypass); the bypass is scoped to one entry id inside `takeProvenance`, set and cleared in the same transaction; a source-scan test pins that no other code names `raw_takeover`; `settings` holds no `raw_takeover` key after any sync. Tests fail on the old code, and the whole two-phone sync table (row C cases) stays green. Scope is `raw_transcript` only. This is not a change to the constitution: it adds the missing local enforcement and keeps D-111 item 10 and row C as decided. If the founder wants no local writer at all (Option A), that amends D-111 item 10 and ADR 0025 row C and is his.
- Why: `entries_guard_immutable` (`20260930000000_scribe_core.sql:195-207`); `merge.ts:267-290` and `:630`; ADR 0025 section 9 row C; D-111 item 10; DATA-REQ-040; `sync-two-phone` tests at lines 1439, 1470, 1505 of `sync-two-phone.test.ts`; `engine.ts:119`, `:301` (an abort retries the whole pull). Risk: a wrong trigger wedges sync (likelihood 2, impact 4); return: the constitution's local line becomes true and machine-checked.
- Door: two-way with cost
- Way back: a later local migration drops the two triggers; delete the flag writes.
- Revisit when: a second writer of own rows ships to a store build, or counsel changes DATA-REQ-040's scope.
- Signed: Karma (CTO)

## Batch 3 (21 Nov, council)

These entries sit after the entries PR #1377 landed, in a separate trailing block. Numbers continue past the highest id per seat on `develop` (checked again after #1377 merged: no id in this section collides) and in citations under `docs/` (CPO-19, CDesO-13, CPrivO-13, CDO-21, CLO-20, CCO-15, CISO-2). Not checked: other open PRs that touch this file and the Project docs. If a number collides at merge, renumber the later one. Each seat is a Claude role (COUNCIL section 1), none is counsel, and every claim about a law is UNVERIFIED because no source was read for it in this session. Evidence is the review files for PRs #1414, #1417, #1421 and #1435, the spec `docs/product/prd/28-moments-tab.md` (v3, PROPOSED) and the audit `docs/engineering/audits/2026-11-21-cross-account-stores.md` (PR #1427, head `ad05420f34a50d2f0ead5a6b5e384d29d2472213`).

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
- Ruling: per person. At every user change and at sign-out, in the same place as `joinWait.clear()` in `publishAuth`, analytics consent goes back to unanswered and the id is rotated. The reset clears the stored consent in the settings table (`apps/mobile/src/lib/analytics/index.ts:46-51`), not only memory, and the test reads the table. No analytics SDK may ship before that is built and tested. Nothing here changes any words a person reads.
- Reason: it keeps less and asks again, so it only tightens the opt-in promise. A yes given by one person on a shared phone is not a yes from the next.
- Evidence: audit F5; review B of #1427 (accurate, latent); `apps/mobile/src/lib/analytics/index.ts:46-110`.
- Decision rights: internal behaviour that keeps less, latent (no SDK), and not a user promise under CR-73.
- Door: two-way. Way back: remove the reset. Founder-only: no for the build gate. If the founder wants a per-phone choice, or the policy says otherwise, that is his.
- Next: one backlog row, ready only when an analytics SDK is on the plan (`product`); `security-architect` adds the test through `publishAuth`.
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CISO-2 C2 (audit F6): a pending invite token is cleared at sign-out only if a signed-in session had read it (21 Nov 2026, CISO with CPrivO, CLO and CPO)
- Question: a saved invite token survives sign-out and a user change for up to 14 days, and the server treats it as a single-use bearer not bound to a person. Keep, clear when a session had read it, or shorten the cap?
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CPrivO, CLO (the invite is the inviter's offer, not a right of the next account), CPO (A-REQ-028: it survives sign-in and a kill), Karma.
- Verdict: RULED for the middle path. The 14-day cap is not touched and is founder-only.
- Ruling: clear the token at sign-out or user change only when a signed-in session had already read it. The "had read it" mark is persisted with the token, in the same Keychain item (for example the id of the signed-in user whose session read it). Develop stored only `{token, receivedAt}` (`apps/mobile/src/lib/family/pending-invite.ts`, lines 10-27 at the ruling's head; #1456 has since added the reader mark, now at lines 15-50) and reads it once, at `apps/mobile/src/app/invite/index.tsx:96` or in the launch watcher, so a mark held in memory would be lost on a kill and relaunch and the leak would stay. The clear runs next to `joinWait.clear()` (`apps/mobile/src/lib/auth/auth-store.ts:132`), on sign-out and on any user change. "Open the link, then sign in" still works, and so does a kill and relaunch. A token nobody read in a signed-in session stays. Default if asked about the cap: keep 14 days, unchanged.
- Accepted residue: a token saved while A is signed in, before any screen has read it, then A signs out and B signs in and reads it: it is unread, so it stays, which is the intended open-link-then-sign-in path. The clear is an async Keychain call fired from the synchronous `publishAuth`, and `clearPendingInvite` swallows a locked Keychain (`apps/mobile/src/lib/family/pending-invite.ts:61-72`), so a failed clear is fail-open and the 14 days still bounds it.
- Decision rights: internal behaviour that keeps less. It is not a user promise under CR-73, and the cap (A-REQ-028) is untouched.
- Reason: this closes the one case that is a leak, "A saw the preview, signs out, B taps". It does not make the invite shorter-lived for anyone who has not yet signed in, so the A-REQ-028 promise holds.
- Evidence: audit F6; review B of #1427; `apps/mobile/src/lib/family/pending-invite.ts:9-72`; `accept_child_invite` (single use, expiry).
- Door: two-way. Way back: remove the clear. Founder-only: the cap (A-REQ-028 is a promise).
- Next: a fix PR from `sync` or `mobile`, test first, through `publishAuth`. The test must cover kill and relaunch between the read and the sign-out, and a user change with no null step in between. CDesO has no new word to write.
- Signed: CISO (Claude role, not an auditor), with the Chief Privacy Officer (Claude role, not counsel)

### CISO-3 C3 (audit F8 to F11): fix F8 now, accept F9 to F11 (21 Nov 2026, CISO with CPrivO and CPO)
- Question: what to do with the four lower findings.
- Seats consulted (their views are the council's reasoning, not sourced from repo docs unless a cite follows): CPrivO, CPO, Karma.
- Verdict: RULED.
- Ruling: F8 fix now, one concern: key the new-device report `inFlight` by the user id the call was asked for, and check that the access token read inside `reportOnce` after its await belongs to that same user, so B's report can never carry A's token and B does not lose its new-device email because A's report was in flight (`apps/mobile/src/lib/auth/new-device/report.ts:29-52`). F9 accept: one install id per phone is by design, and the privacy data map gets one row saying an operator can link two accounts on one phone (a public policy sentence, if any, goes to counsel and the founder). F10 accept: a draft id and a 5 second window, no words. F11 accept: an unowned local book is offered to the first account that signs in (A-REQ-015); `product` adds a check that the claim is an explicit choice and never automatic. Recorded as an accepted exposure of the phone's first holder, not as "no person data": `bookVisibleTo` returns true for an unowned book to any signed-in user (`apps/mobile/src/lib/auth/account-scope.logic.ts:34-37`), so a second person who signs in first sees the pre-account book (child name, letters) before any claim choice. Sync stays off until the claim, so nothing leaves the phone. It is A-REQ-015 by design and not fixed here. F2 to F4 stay queued as in the audit.
- Reason: F8 is the only one that suppresses a security notice for a real person. F9 and F10 are intended by design, and F10 carries no words. F11 is intended by design (A-REQ-015) but is an accepted exposure of the phone's first holder, as the Ruling records: the pre-account book is shown to the first account that signs in.
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

### CCO-7 PR #1448 (compliance gates migration, a re-cut of #424) passes the compliance fence for merge into develop only (Sat 21 Nov 2026, CCO via Karma's session; not counsel)
- Question: PR #1448 adds the sign-up compliance gates as files: migration `20261121030000_compliance_gates.sql` (`hook_before_user_created`, `ops.restricted_jurisdictions`, `geo_ip_ranges`, `compliance_check_counts`, `regulatory_watch`), their tests and grants, `supabase/APPLY.md` File 39 and the compliance scripts. Does it meet the CCO checklist in `compliance/README.md`, and for what?
- Tier and type: T2 (database, a fenced path, a sign-up door); complicated.
- Options considered: approve for merge into develop with the hook off and a list of conditions before anything is enabled or applied; hold the PR until every checklist line has its evidence; approve without conditions.
- Ruling: approve the head of PR #1448 named on the `## CCO approval at <sha>` line, for merge into `develop` only. The hook stays off. Nothing is applied to a hosted project and the hook is not enabled until the conditions below hold. Checklist, line by line:
  - Sign-up checks table: the hook is row 4 and the PR adds the door's code and tests. Cannot verify on a device or a local stack whether GoTrue rolls back the block count when the hook refuses a sign-up (File 39 step 4). This is a condition, not a finding.
  - New personal data needs a DATA_CLASSIFICATION row: NOT MET, and I accept it as a condition before the hook is enabled, not before the files merge. The tables hold a day, a check, an outcome and, for a block, a country code; the IP is read in memory only; the tables stay empty until the hook is on. BL-555 adds the rows and the two-year retention entry before File 39 is applied.
  - Legal and platform facts with a source and a date: met for the sanctions and export rows (`checked-facts.md`, read 31 Oct 2026, primary sources). The Syria rescission date is secondary-sourced.
  - No promise change without the founder: met. No Terms, Privacy, listing or app copy is edited. The Privacy Policy line about IP use (D-136) is still unpublished, so the hook cannot be enabled before it is.
  - No new door path without a row and a test: met. The web page stays deferred (D-055).
  - DB-IP attribution link: NOT MET, and there is no screen for it yet (BL-553). A condition before the hook is enabled.
  - Blocked places: KP, IR, CU, SY, RU and BY at country level, as the seed holds. D-131 (31 Oct 2026) records the founder's words and settles Iran and Cuba as blocked; only counsel's confirmation (Q57) is open. No name screening (CCO-5, D-137, a delegated default until counsel confirms). A change to the list stays the founder's.
- Conditions, all before the hook is enabled or File 39 is applied to a hosted project: BL-553 (the app handles the 403 refusal and carries the DB-IP link), BL-554 (the regulatory watch is scheduled), BL-555 (DATA_CLASSIFICATION rows, register entry, claims rows), the local-stack check of the block count, the Privacy Policy IP disclosure approved by the founder, an ops alert on geo stale, unknown and error counts, and BL-552 (a suspend path) before any sign-in outside the family. Counsel's answer to Q57 is requested before the sign-up check is switched on.
- Why: the files change no behaviour while the hook is off, and merging them keeps the work from drifting from `develop`. Evidence at the head: two counted reviews (Review A with the database lens, Review B with the tests lens, both PASS at this head), `npm run test:db` 55 files, `compliance/scripts` tests 9 of 9, and a mutation that moved one grant made `explicit_grants` fail. Evidence that is missing: counsel's answer, a device or local-stack run, and CI at the head before the approval is posted.
- Door: two-way with cost. Merging is a revert away; applying File 39 to a hosted project and enabling the hook are the founder's steps and are not covered by this ruling.
- Way back: revert PR #1448. The migration file, its tests and File 39 go, and develop returns to the state before it.
- Revisit when: any condition above is met, counsel answers Q57, or the blocked list changes.
- Signed: Chief Compliance Officer (Claude role, not counsel)

### CR-149 The merge queue's NEEDS-UPDATE rule is relaxed for PRs that share no files with develop (22 Nov 2026, Karma via the council; with ops, security and QA)
- Question: develop moves faster than required CI finishes, so the strict NEEDS-UPDATE rule (#1356) keeps sending PRs back for a branch update that CI never lets them finish. Which PRs may merge without that update?
- Tier and type: T1 process ruling; amends the merge gate of #1356 and CR-73 for this one rule; complicated
- Options considered: keep the strict workspace rule; file-level overlap plus a clean `git merge-tree` for every PR; the same, but only for docs-only and test-only PRs, with CR-70 paths kept strict
- Ruling: I relax the rule for a PR that meets all of these:
  1. No file in common with the files changed on develop since the PR's merge base (a rename counts on both sides).
  2. `git merge-tree --write-tree` against current develop is clean.
  3. The required checks are green at the PR's head, and two counted reviews are on that head.
  4. The PR touches no CR-70 path (auth, billing, the analytics allowlist, `supabase/**`, `.github/**`, `scripts/agents/**`, `.claude/**`, `agents/roster.json`, `docs/agents/**`, and also `apps/mobile/src/lib/db/**`, `packages/analytics/**`, `app.config.ts`, `eas.json` and `CODEOWNERS`, wherever they sit in the tree), no lockfile, no `package.json` dependency change, no native file and no migration. A native file is any path in `NATIVE_PATHS` of `scripts/agents/merge-queue.mjs` (CR-74): `apps/mobile/ios/**`, `apps/mobile/modules/**`, `apps/mobile/app.config.*`, `apps/mobile/eas.json` and the root `package-lock.json`.
  5. The merge is sha-pinned, and I re-read the develop sha just before I merge and run the overlap and merge-tree checks again if it moved.
  - A source PR (not test-only, not docs-only; I decide that from the changed paths, never from a label or a title) also needs its own tests and `tsc` to pass on the scratch merge.
  - Any other PR keeps the strict workspace rule.
  - I apply this by hand until a PR teaches `scripts/agents/merge-queue.mjs` to do it, behind a flag so the strict rule comes back by flipping the flag.
- Why: measured on 22 Nov, develop took 46 commits in 3 hours (about one every 4 minutes), and required CI takes 35 minutes or more with 50 to 70 runs queued. The strict rule livelocked nine PRs that had two passes and green checks. Eight of the nine shared no files with develop's new commits, and all nine merged cleanly in `git merge-tree`. Council: ops recommended file-level overlap plus merge-tree; security (CISO lens) wanted CR-70 paths kept strict and only docs-only and test-only PRs relaxed; QA said test-only and docs-only are safe, and source PRs need a full-suite run on the merged result. Rule 4 keeps security's line, and the extra source-PR check is QA's.
- Misses accepted: a semantic conflict between files that do not overlap, and whole-repo suites and end-to-end runs that only CI runs. Develop's own CI is the backstop.
- First use: #1381 (`apps/mobile/test/asks-keep-book-store.test.ts`), #1384 (`apps/mobile/test/app-lock-cover-render.test.ts`), #1452 (`apps/mobile/e2e-web/j13-reminders.flow.ts`) and #1444 (`docs/ops/proposed/merge-queue-docs-file-overlap.md`), merged 22 Nov. Each was a test-only or docs-only proposal with zero overlap, a clean merge-tree and the required checks green.
- Door: two-way
- Way back: if develop goes red twice in one day because of a PR merged under this rule, I return to the strict rule and pause merging under this one.
- Revisit when: `scripts/agents/merge-queue.mjs` implements it, or after 48 hours, whichever is first.
- Signed: Karma (CTO)

## Batch 4 (22 Nov, council)

This section is a separate trailing block. Ids continue past the highest per seat on `develop` at the head this branch was cut from (CPO-25, CDO-21), checked by grep in `docs/`; not checked: other open PRs that touch this file. If a number collides at merge, renumber the later one. Each seat is a Claude role (COUNCIL section 1), none is counsel. The council ruled on Q-R25, Q-R24 and Q-X first (CPO-26, CPO-27, CDO-22) and then, in the same batch, on Q-3c, Q-PR8 and Q-9a (CPO-28, CDO-23, CPrivO-16, CPO-29). Evidence: the spec `docs/product/prd/28-moments-tab.md` (PROPOSED; R24, R25, R253, 6.2 S6, section 7.3a), PR #1469 section 7.3b (errata E-4-2, E-4-4, E-4-5), the Moments Review A and B notes on PR #1447, and `packages/core/src/prompts.ts` (`kindFor`: `hardStretch` gives `hard`). No law or outside-world fact is relied on. Each ruling fixes a build default for the PROPOSED Moments tab behind its flag; none changes what a person is promised, scope or dates, so none is founder-only. The spec text is not edited here: the `product` agent writes the erratum lines quoted below (into 7.3b, replacing the "council pending" status of E-4-2, E-4-4 and E-4-5).

### CPO-26 Q-R25 (E-4-2): in a hard stretch the Moments question takes Home's kind, `hard` (22 Nov 2026, CPO with CDesO, CCO and CPrivO)
- Question: R25 says `gap` and `hard` can never be chosen as the question kind. R24 and 6.2 S6 say the question uses only the kind Home uses. In a hard stretch Home's kind is `hard` (`kindFor` returns `hard` when `hardStretch` is set). Which reading stands? The code (#1447) passes `hardStretch` on the hard state, matching Home.
- Seats consulted: CDesO (two tabs asking two different things on the same hard day is the worse tone: a bright "what made you laugh" next to Home's gentle prompt reads as not listening), CCO (tone rules: no fear, guilt or loss language; the `hard` prompts already pass the content rules, as Home shows them), CPrivO (the kind is derived on the phone from a mark the parent made; nothing new is read or stored; the rule must not be recorded or counted, R253 pattern).
- Verdict: RULED.
- Ruling: R24 and 6.2 S6 win. The question uses Home's kind in every state. In a hard stretch that is `hard`; in a quiet book or the normal state it is `opening`. `gap` is never chosen (no `daysSinceLastEntry`, so the engine cannot reach it). `excludeKeys` still holds Home's key, so the two tabs never show the same prompt.
- Reason: R25 was written for the normal state and the word "never" was too wide. Following Home keeps one tone per phone per day and needs no new rule. The harm to avoid is a cheerful prompt on a hard day, not a hard prompt on one.
- Spec erratum, exact wording (replace the E-4-2 row's Reads and Status; edits R25 and 6.2 S6 "Never" cell): "R25 reads: the question is chosen with `selectPrompt` using the kind Home uses on this phone today. Outside a hard stretch that is `opening`; in a hard stretch it is `hard`, the same as Home. The kind `gap` is never chosen. A `hard` prompt is never chosen outside a hard stretch. Status: RULED (CPO-26), PROPOSED." The S6 "Never" cell reads "A `gap` prompt; a `hard` prompt outside a hard stretch".
- Owed: #1447 adds one test that separates a quiet book (kind `opening`) from a hard stretch (kind `hard`); Review A found the mutant `hardStretch: input.state !== 'normal'` survives today.
- Door: two-way. Way back: reword R25 back to "never `hard`" and pass `hardStretch: false` in the question call; no stored data depends on it.
- Founder-only: no.
- Signed: Chief Product Officer (Claude role)

### CPO-27 Q-R24 (E-4-5): in a hard stretch or a quiet book no library pictures card shows; the door stays (22 Nov 2026, CPO with CDesO, CPrivO, CCO and CISO)
- Question: R24 bars the look back (S4) and bright Today hits in a hard stretch or quiet book. The engine still builds a library pictures card (S7) and the question then. Is a pictures card wanted, or must it be suppressed?
- Seats consulted: CPrivO (R253, already in the spec as P0, says a quiet, hidden, hard-stretch or expecting-only book, or any visible book on the phone that is, shows no library card, no Recent list, no place line, no year-ago card and no occasion collage; a picture card that appears when a parent has paused a book is the leak R253 exists to stop; and the rule must leave no trace in analytics, push or logs), CDesO (a parent in a hard stretch should meet an unchanged calm tab with the question and the door, not a collage of a child that day; a card that does not render needs no apology line, R14), CCO (tone: celebrating what exists is for a parent who chose it; a surprise picture on a hard day is not that), CISO (no new surface: suppress before the fetch, so no library read happens for a suppressed state; UNVERIFIED on a device).
- Verdict: RULED.
- Ruling: suppress. In a hard stretch or a quiet book the pictures slot shows no S7 card, no Recent list, no place line, no year-ago picture card and no occasion collage. The picker door ("Choose pictures" per R253's own reword) stays, since the parent chooses to use it. The question stays under CPO-26. R253 is the authority and the stricter whole-phone reading stands: the engine suppresses when any visible book on the phone is in such a state, and the engine must be given that flag by `buildMoments` (PR 9), because #1447 sees one book. Until PR 9 lands, #1447 suppresses for the book it is given and the whole-phone input is a named gap.
- Reason: the spec already decided this in R253; E-4-5 asked because R24's text was narrower. R24 is read with R253. Showing is irreversible once seen; hiding costs one card on a day the parent did not want it.
- Spec erratum, exact wording (replace the E-4-5 row's Reads and Status; edits R24): "R24 is read with R253. In a hard stretch or a quiet book, and on any phone where a visible book is in one, Moments shows no library pictures card and none of the library surfaces named in R253. The picker door stays. The question still shows, under R25. Status: RULED (CPO-27), PROPOSED; the whole-phone flag comes from `buildMoments` (PR 9)."
- Owed: #1447 drops the S7 card when `hardStretch` or the book is quiet, with a test (a planted library day with the state hard: no pictures card; the door row remains) and one mutant; PR 9 passes the whole-phone flag and a test with two books.
- Build default (22 Nov 2026, from the review notes on #1471; RULED, within the CPO seat's rights, reversible, flagged for the CPO to confirm): the ruling above does not say what happens to pictures the parent picked themselves (S5) in a hard stretch. Default: library-derived pictures (S7 and the library surfaces named in R253) are suppressed; parent-picked S5 pictures stay visible, because the parent chose them, and R253's list names library surfaces only. Way back: suppress S5 too, one line and its test. Nothing stored. This is not a reversal of CPO-27 and does not touch R253.
- Door: two-way. Way back: remove the suppression line and its test; nothing stored.
- Founder-only: no. A founder who wants pictures shown on a hard day would be changing R253, a P0 privacy row, and that is his.
- Signed: Chief Product Officer (Claude role)

### CDO-22 Q-X (E-4-4): every candidate passes the exclude list before `momentsFor` (22 Nov 2026, CDO with CPrivO and CISO)
- Question: ratify the `buildMoments` contract that every candidate (look back, picture, Today hit) passes the exclude list (Not this one, Hide this day, excluded days) before `momentsFor` sees it, as a build rule for PR 8 and PR 9.
- Seats consulted: CPrivO (a hidden or excluded day must never surface through any source; R29 says a hidden day never leaks into any other surface), CISO (one gate, tested with a planted day, beats a check in each source; fail closed), CDO (the exclude list is local day keys and local letter ids only, cleared by Turn off, Erase and sign-out per R29).
- Verdict: RULED.
- Ruling: ratified as a build rule. `buildMoments` filters every candidate by the exclude list before calling `momentsFor`. `momentsFor` takes already-filtered candidates and still checks again any candidate that carries a date, by that date. A day is dropped by day, never by picture id (E-4-7). `pictures.source` is validated to S5 or S7 at run time. A candidate whose day cannot be worked out is dropped, not shown (ASSUMED, fail closed). The PR proves it with a planted hidden day and a planted excluded day, and one mutant that removes the filter.
- Reason: two gates (before and inside) cost one comparison and mean a missed call in `buildMoments` cannot show a hidden day.
- Spec erratum, exact wording (replace the E-4-4 row's Status): "RULED (CDO-22), PROPOSED: this is a build rule for PR 8 and PR 9. The text above stands, plus: a candidate whose day cannot be worked out is dropped."
- Door: two-way. Way back: delete the second check in `momentsFor`; the first stays.
- Founder-only: no.
- Signed: Chief Data Officer (Claude role)

### CPO-28 Q-3c: add a pure row 3c for `buildMoments`, so PR 15 is not oversized (22 Nov 2026, CPO with Karma (CTO) and CDO)
- Question: the 19.4 table has no row for `buildMoments` and `signalForDay` (`plan.ts`; `BuildInput` per `docs/product/moments-tab/ARCHITECTURE-BRIEF.md` section 5.1). Its contract items (every candidate passes the exclude list first, a `placeId` run-time allow-list, the `lookBack` to `look_back` mapping test) would otherwise land in PR 15 (`use-moments`, 350 lines, already about 9 files). Add a row?
- Seats consulted: Karma (a pure function with golden tests reviews well alone; PR 15 has hooks, kill switches and ACC state and cannot carry it), CDO (the exclude-list rule of CDO-22 needs a home with its planted-day test).
- Verdict: RULED.
- Ruling: add a new row `3c` to 19.4. What: `buildMoments` and `signalForDay` in `packages/core/src/moments/plan.ts`, pure, total and deterministic for a seed; the CDO-22 exclude filter first; a run-time allow-list for `placeId` (a place id not in the injected table is dropped, never shown); `pictures.source` validated to S5 or S7; the one mapping function `lookBack` to `look_back` with its both-ways test; the whole-phone calm flag input of CPO-27; goldens on `asha-lib-v1`. Owner `mobile`. Size about 300 changed lines. Depends on 2, 3, 5 and 4a and 4b, so it merges after #1446 and #1447. PR 15 then depends on 3c, 4, 8 and 9 (3c replaces 3 and 2 in its list). It is one new item, so the count of 41 becomes 42.
- Reason: one concern per PR and a ten-minute review. The function is pure, so it can be built before the store and the native module exist.
- Spec erratum, exact wording (a new row in 19.4 after row 3b, and an edit to row 15's last column): "3c | `buildMoments`, `signalForDay` (`plan.ts`): exclude list first, `placeId` allow-list, source check, slot-name mapping test, goldens | `mobile` | 300 | about 6 | 2, 3, 5, 4a, 4b" and row 15 "Depends on: 3c, 4, 8, 9". Status: RULED (CPO-28), PROPOSED.
- Door: two-way. Way back: fold 3c back into PR 15 (and mark it `size:accepted`), or split further.
- Founder-only: no (a plan row, no scope or date change).
- Signed: Chief Product Officer (Claude role)

### CDO-23 Q-PR8 (data): what the `moments.json` store holds, where it is erased, how long it lives (22 Nov 2026, CDO with CPrivO, CISO and Karma)
- Question: PR 8 (`moments.json`, clear, `eraseDeviceFiles`, schema tests, `DATA_CLASSIFICATION.md` 4.6 rows, the ADR 0032 amendment; R221, R250) needs data rulings before a builder starts.
- Seats consulted: CPrivO (see CPrivO-16 for the label class and the export choice), CISO (store is a file, excluded from backup, no member that can name a picture or an album, R247), Karma (the plain write rule of R221).
- Verdict: RULED for the build; the export route is FOUNDER (see CPrivO-16).
- Ruling:
  1. Contents are exactly the R221 members: a day key (local ISO date, no zone), typed day labels, hidden place keys, the home-place correction, an opaque local owner id, and `v`. No picture, album or asset identifier, no coordinate, no place name the engine computed.
  2. Retention: kept until the parent removes it in Me, or Turn off Moments, Erase everything or sign-out wipes it (R29, R65, R249). No time limit, because it is the parent's own mark and a timer would silently drop their choice.
  3. Erase paths: Erase everything and sign-out delete the file through `eraseDeviceFiles`, with a test for each. Deleting a book removes that book's rows (the home-place correction is one value per book) in the same step, with a test. Backup: the file is excluded from backup and the exclusion is read back in a test (the precedent in ADR 0032).
  4. A book deleted from another device: moments.json is not synced, so the phone may keep rows for a book that no longer exists. Default: on launch, rows whose book is gone are removed, and the owner id check of R221 drops the file for a different account. UNVERIFIED: whether the sync pull on this phone reliably shows a deleted book; PR 8 records it as a named gap with a test on what the code can see, and the founder-visible plain sentence must not claim more than that.
  5. Rows in `DATA_CLASSIFICATION.md` 4.6 and the ADR 0032 amendment (status stays Proposed) ship in the PR 8 diff, with a deletion test per field, as R250 requires. The device-store row in `docs/legal/data-policy.md` 4.4 is legal text: recommended, not written here (CPrivO-16).
  6. A higher `v` than the app knows reads as empty and writes nothing; a corrupt file is deleted without a message (R221). No analytics, log or crash report records a label, a key or that a clear happened.
- Reason: every item is already in R221, R249, R250 and the R29 and R65 wipe rules; this ruling fixes the gaps (retention, book deletion, other-device deletion) with the safe default of deleting on the phone.
- Erratum (22 Nov 2026, from the review notes on #1471; recorded by Karma): item 4 and the owner id check assume a claim step for a `local` owner. As merged in #1481 the store keeps a `local` moments file at sign-in and in `cleanupAtLaunch` (mirroring the days store). No claim step exists yet, so a file with a `local` owner is orphaned until one is built (NS-47-R7, E73). Named gap, not a data-protection claim: the plain sentence must not say a `local` file is claimed or cleared by sign-in.
- Door: two-way until PR 8 ships; after it, a retention change is a migration of a small file. Way back: bump `v` and rewrite the file.
- Founder-only: the export route only.
- Signed: Chief Data Officer (Claude role)

### CPrivO-16 Q-PR8 (privacy): typed labels are L4 and stay on the phone; export route A is the default, route B is the founder's (22 Nov 2026, CPrivO with CDO, CLO and CCO; not counsel)
- Question: are typed day and place labels L4 device-only, and are they in "Export everything" (route A: no, said plainly; route B: yes, as a labelled section)?
- Seats consulted: CDO (the data is small, local, parent-typed, never synced), CLO (the "export everything" promise reads as every entry the parent authored, with audio and photos, per `docs/legal/ENGINEERING_REQUIREMENTS.md` section on export; whether a typed label is within a portability right is UNVERIFIED and is a counsel question), CCO (the same, UNVERIFIED; no new claim may say "all your data" while route A holds).
- Verdict: RULED for the class; FOUNDER for the export route, with a default.
- Ruling: typed day labels and typed place labels are L4, device only, never synced, never in a backup, never in analytics, logs or crash reports, as reviewed on #1393 (not re-read in this session; the read is `docs/product/moments-tab/EXPORT-DUTY-READ.md`). The export route is a promise about what a person gets back, so it is the founder's. Recommendation and default: route A. Until the founder answers, PR 8 builds route A: no export, and the plain sentence of R250 says the labels stay on this phone. Reason: a label is a parent's own typed words about a day, which argues for route B on fairness; but route B adds a new section to the export file, a new test of the export contract and a claim, and a person who loses the phone loses the label either way. Route B is cheap to add later (a section in the ZIP), route A is cheap to start, so the default is the way that is easy to reverse and holds nothing back from a person who asks.
- Owed: no copy anywhere may say "everything" about the export while route A holds without the labels exception being read by `content` and the CLO seat (UNVERIFIED claim risk).
- Erratum (22 Nov 2026, from the review notes on #1471; recorded by Karma): the export read this entry rests on is `docs/product/moments-tab/EXPORT-DUTY-READ.md` (it is not under `docs/legal/`). Read it for what it says: it finds no duty the written spec enforces; it leans route B (an engineering lean, because of the backup point in its section 3); it wants counsel to read the narrowed wording if route A holds; and it keeps label typing dark (no label typing UI ships) until counsel has read it. The default above (route A) therefore carries that condition: no label typing ships until counsel has read the narrowed wording, whichever route the founder picks. The lean and the default differ and the choice stays the founder's (Q-LABELS-EXPORT). No FOUNDER item changes.
- Door: two-way (route B can be added). Way back: add a labelled section to the export ZIP and its test.
- Founder question: Q-LABELS-EXPORT. Route A (default) or route B. Founder-only: yes.
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CPO-29 Q-9a: PR 9a may start its pure TypeScript surface before the G1a-L read-out, with limits (22 Nov 2026, CPO with Karma (CTO) and CISO)
- Question: the spec gates PR 9 on the G1a-L device read-out; the planner recommends 9a not start before it. May 9a (access status, request, TS surface, `nullSource`, and `fixtureSource`) start now?
- Seats consulted: Karma (the TS interface and `nullSource` call no native code and are small; a rewrite after the read-out costs a few lines), CISO (the risk is a native read of the library before the unknowns are known, and 9a has none of that), CPO (CPO-17 item 2 says gates G1 to G11 apply before store submission, not before coding, so they are release gates, not gates on starting code; the table's last column for row 9 is the gate for merging the native fetch).
- Verdict: RULED.
- Ruling: yes, with limits. 9a may start now and may merge to develop. It holds: the `MomentsSource` interface and access-state types per R220's closed list of functions, `nullSource`, the mapping from the native access status to the app's access states (no prompt, no request wired), and `fixtureSource` only as a test helper outside `src` (a fixture that holds a coordinate stays out of `src`, CPrivO-14). It must not hold: any call to the native module, the columnar fetch, a native module file, a permission string, or anything that reads a library; those are 9b and wait for the G1a-L read-out. The flag stays off and nothing imports 9a on a code path a person reaches. If G1a-L changes a shape (for example whether location is readable under Limited), 9a is revised in the same PR as the change.
- Reason: no bridge is touched and no data is read, so there is no privacy risk to wait out; waiting would idle the mobile agent for about a week (an estimate, not measured).
- Spec erratum, exact wording (row 9 of 19.4, last column): "9a: none (pure TS, no native call); 9b: G1a-L read-out; G3 and G3-x to merge". Status: RULED (CPO-29), PROPOSED.
- Erratum (22 Nov 2026, from the review notes on #1471; recorded by Karma): (a) the source of "release gates" above is CPO-17 item 2 (21 Nov), not a header ruling. (b) The ruling lists `fixtureSource` in 9a, but PRD 19.4 row 9 puts it in 9b (columnar fetch and `fixtureSource`). It was built as a test helper outside `src` in merged #1477, which is what this ruling asked of it and which keeps a fixture with a coordinate out of `src`. Read the ruling as: `fixtureSource` is a test helper outside `src`, and 19.4 keeps its row-9 placement in 9b for the production-side surface. The limits above are unchanged.
- Door: two-way. Way back: revert 9a; nothing depends on it until 9b and PR 15.
- Founder-only: no.
- Signed: Chief Product Officer (Claude role)

### Hand-back table, batch 4

| Q | Verdict | Next action | Unblocks |
|---|---|---|---|
| Q-R25 question kind in a hard stretch | RULED CPO-26 (Home's kind; `hard` only in a hard stretch; never `gap`) | product erratum R25 and S6; #1447 quiet-versus-hard test | #1447 |
| Q-R24 pictures card in hard or quiet | RULED CPO-27 (suppress; door stays; R253 governs) | product erratum R24; #1447 suppression and test; PR 9 whole-phone flag | #1447, PR 9 |
| Q-X exclude list before `momentsFor` | RULED CDO-22 (build rule, fail closed) | product erratum E-4-4; PR 8 and 9 tests | PR 8, PR 9 |
| Q-3c row for `buildMoments` | RULED CPO-28 (new pure row 3c, mobile, about 300 lines, after #1446 and #1447; PR 15 depends on 3c) | product adds row 3c and edits row 15 | PR 15 |
| Q-PR8 store, erase, retention | RULED CDO-23 (R221 members only; kept until removed; erase, book delete and sign-out wipe; other-device deletion UNVERIFIED, named gap); class RULED CPrivO-16 | builder starts PR 8; DATA_CLASSIFICATION 4.6 rows and ADR 0032 amendment in the diff | PR 8 |
| Q-LABELS-EXPORT labels in export | FOUNDER, recommend route A (no export, said plainly), default route A | founder picks A or B | none (PR 8 builds A) |
| Q-9a PR 9a before G1a-L | RULED CPO-29 (yes for pure TS and `nullSource`; no native call; fixtureSource test-only) | product edits row 9 gate | PR 9a |

Founder-only items in this batch: Q-LABELS-EXPORT (route A or B for typed labels in "Export everything"; the `docs/legal/data-policy.md` 4.4 device-store row is legal text and is recommended only). A reversal of CPO-27 would change R253 and is the founder's.

## Batch 5: claim step, design council, analytics (22 Nov 2026, recorded by the product agent for Karma)

Recorded from the council notes and review verdicts named in each entry. None of these entries is a founder decision, and `docs/DECISIONS.md` is not touched. Where a point could not be read in the repository it is marked [UNVERIFIED].

### CPO-30 Q1 to Q3 (claim step): no new claim screen for a phone with only days or moments files; the first sign-in that is not a claim deletes `local` silently (22 Nov 2026, CPO with CPrivO and CDO; council round a727f25081a7a28a6)
- Question: the claim step of NS-47-R7 and E73 was written for the letters files. (Q1) What happens on a phone that holds only a days or moments `local` file and no letters? (Q2) Does "Not my account" delete the `local` file? (Q3) Does Moments follow the same rule?
- Seats consulted: CPO, CPrivO, CDO (council round of 22 Nov 2026; the council note is outside the repository, so its wording is quoted from the work queue of Karma's session, not from a file here).
- Verdict: RULED for the build default. Extending the claim screen is the founder's, because it would be new words a parent reads.
- Ruling:
  1. Q1: no new claim screen for a days-only or moments-only phone. E73 as written stands: the first sign-in that is not a claim deletes the `local` file silently. That is the build default.
  2. Q2: "Not my account" does NOT delete the `local` file. It declines the claim step and leaves the phone as it was. Sign-out must skip clearing `local`; this is a code change.
  3. Q3: Moments follows E73 and item 2. `adoptLocal` runs only on an explicit "Keep in this account". A failed adoption leaves the claim unconfirmed and the `local` file untouched (as built at the head of #1529, c8935ddb; review notes on #1529 asked for this after a first head confirmed the claim and then deleted `local`).
  4. ADR 0032 item 4 (the stale "kept, orphaned" wording) is edited by the builder in #1529, and NS-51 gets a mirror row NS-51-R43 of NS-47-R7. This supersedes the named gap in the errata under CDO-23 once #1529 merges.
- Evidence: #1476 (merged; family notice keeps the user captured before the await, BL-1500 and BL-1501); #1523 (merged; boot sweep of stale takeover keys); #1529 (OPEN, not merged: it is queued, and every statement about its behaviour in this entry is a statement about its open head, not about develop). #1481 (merged) kept a `local` moments file at sign-in, which is the record this ruling replaces. Record against record: ADR 0032 item 4 and the days code keep `local`, while E73, A4 and CL-147 delete it; this ruling follows E73 for the first non-claim sign-in and keeps `local` on sign-out and on decline.
- Door: two-way until #1529 merges. Way back: revert #1529. Deletion of a `local` file is device-only data and cannot be undone after the fact.
- Founder-only: extending the claim screen (new words). Nothing else.
- Signed: Chief Product Officer (Claude role)

### CPrivO-17 Q1 to Q3 (claim step, privacy): the council ruling on the claim step, privacy seat (22 Nov 2026, CPrivO; council round a727f25081a7a28a6; not counsel)
- Question: the claim step of NS-47-R7 and E73 for the days and moments `local` files (Q1 to Q3 as in CPO-30).
- Verdict: RULED for the build default, as recorded in CPO-30.
- Ruling: exactly the council's rulings in CPO-30 items 1 to 3: no new claim screen for a days-only or moments-only phone; E73 as written (silent delete at the first sign-in that is not a claim) is the build default; "Not my account" does not delete the `local` file; the sign-out path skips clearing `local`; Moments follows E73 and that rule. Nothing is added here.
- Evidence: the council note, outside the repository, quoted from Karma's work queue [UNVERIFIED wording]. Seat-specific wording by CPrivO is not in the visible source.
- Founder-only: extending the claim screen (new words).
- Signed: Chief Privacy Officer (Claude role, not counsel)

### CDO-24 Q1 to Q3 (claim step, data): owner key, adoption and the `local` file lifecycle (22 Nov 2026, CDO with CPO and CPrivO)
- Question: data read of CPO-30.
- Verdict: RULED for the build default.
- Ruling: the owner key is the first 16 hex of the SHA-256 of the user id (as built in #1529, `local-claim.ts`; this entry does not restate the code). Sign-in sets the owner of both device-only stores; `setOwner` deletes a `local` file nobody adopted; `adoptLocal` rewrites `local` to the key on the write queue and runs only after an explicit Keep, before `confirmAccountClaim`. Sign-out puts the stores back to `local` and keeps a `local` file. A `local` write running at sign-out is not deleted behind it. A failed adoption leaves the claim unconfirmed and `local` untouched. `leave()` on the family notice takes the owner as a required argument, so a stale leave for user A cannot clear user B's waiting line.
- Evidence: #1529 (open; head c8935ddb; 11 mutants each killed by a named test, per the PR body and later head note). Not verified here: a device run; the erase-all baseline failures (the PR body reports 9 files and 79 tests failing on clean develop).
- Door: two-way until #1529 merges.
- Founder-only: no.
- Signed: Chief Data Officer (Claude role)

### CDesO-13 Q1 and Q2 (BL-419, BL-423): the finale keeps `hero`, with a no-break space; the first-letter row stays "Write the first one" and does not open the recorder (22 Nov 2026, CDesO with CPO; council round a15d8150b380fc987, no conflicts)
- Question: (Q1) BL-419: what does the finale display, and how is the single-word last line fixed? (Q2) BL-423: keep the row's words, and may the first tap open the recorder?
- Verdict: RULED.
- Ruling:
  1. Q1: the BL-419 finale keeps the `hero` display. The row's "display" value is a mistake. The orphan (one word alone on the last line) is fixed at render time by a no-break space joining the last two words.
  2. Q2: BL-423 keeps "Write the first one". Two taps are accepted. The recorder is NOT auto-opened, because that would skip the primer (NS-39-R10) and start capture without it, which is a scope and consent change. The row's Done-when becomes: "Tonight shows Speak as the first thing, with no card in front". "Tell {child} something" would be new parent-facing copy and needs founder or content approval; it is not adopted.
- Evidence: the council round named above (note outside the repository; quoted from Karma's work queue) [UNVERIFIED wording]. N13 builds the finale orphan fix in its own PR. The BACKLOG rows for BL-419 and BL-423 are edited by the backlog PR, not here.
- Door: two-way. Way back: a founder-approved line and a primer-aware recorder entry.
- Founder-only: new copy only.
- Signed: Chief Design Officer (Claude role)

### CPO-31 Q3 (BL-891): retire BL-891 as superseded by NS-38 to NS-45; one banner line on NX-40 (22 Nov 2026, CPO with CDesO; same council round as CDesO-13)
- Question: is BL-891 still needed?
- Verdict: RULED for BL-891. OPEN for BL-892 to BL-897.
- Ruling: BL-891 is retired as superseded by NS-38 to NS-45. NX-40 gets a one-line banner saying so, and the NX-40 file is kept, because BL-892 and BL-893 cite it.
- OPEN: BL-892 to BL-897 may also be superseded. [UNVERIFIED] Nobody has checked; it is a separate check by the product agent.
- Evidence: the council round named in CDesO-13. The docs PR for the banner is N13's (docs/nx-40-superseded-banner).
- Door: two-way. Way back: reopen the row.
- Founder-only: no.
- Signed: Chief Product Officer (Claude role)

### CDO-25 #1533 (Moments analytics): Karma's rulings on the five author questions, with open questions (22 Nov 2026, Karma (CTO); T1, reversible, nothing wired, flag off)
- Question: #1533 adds `moments_card_impressed` and `moments_card_tapped`, each with one closed property `slot` (`look_back` | `question`). Five questions from the author went to review.
- Seats consulted: review A (analytics) and review B (privacy lens), both PASS WITH NOTES at d694ee06. This is a Karma ruling; no CDO or CPrivO co-signature is claimed.
- Verdict: RULED (Karma) for items 1 to 5. OPEN for items 6 and 7. #1533 itself is open, not merged.
- Ruling:
  1. Event names stay snake_case. Product amends the spec 28 section 18 names to match the catalogue.
  2. The once-per-slot-per-day cap is a P0 test in the wiring PR, not in #1533.
  3. The registry test allows only the two exact `moments_` names. Whether `moment_shown`, which still exists in the catalogue, is kept is decided in that test's PR. [UNVERIFIED: not decided here.]
  4. The `ids.ts` and `registry.ts` rows land with the wiring PR; #1533's body says so.
  5. PRD-REQ-016 is accepted as the requirement.
- OPEN 6 (CDO and CPrivO input, before wiring): should `child_count_bucket` (including "none") ride on Moments impression events? Review B noted that it rides on every event today.
- OPEN 7 (counsel and CPrivO): the App Store privacy label wording, Linked versus Not linked, and the policy wording for these events. Not decided in this log.
- Evidence: reviews A and B on #1533 at d694ee06; the `^moment_` forbidden pattern does not match `moments_` (review B). Founder-only: the label wording is legal and store text.
- Door: two-way. Way back: remove the two catalogue names.
- Signed: Karma (CTO)


## Batch 6 (22 Nov, founder standing approval: decide blocked rows with the exec team)

Authority, in the founder's own words: "All blocked I approve. Just decide with executive team and whatever their recommendation is I approve." Each entry below is the council's ruling on one blocked or needs-decision backlog row, read against the row, `develop`, the decisions and the merged PRs. It is a chat line relayed by Karma, not a signature, and it covers only what is inside the council's decision rights (technical, process and product-scope calls for scope the founder already approved, all reversible). The founder can overrule any entry in one line, recorded as a new entry that supersedes it. Anything the council marked [UNVERIFIED] stays marked here. Words a parent reads stay PROPOSED until a store build. The ids are the next free number per role at the time of writing. The 24 rulings that are Karma's own (CTO role) are not in this file: they are recorded as CR-150 to CR-173 at the end of `docs/agents/cto/RULINGS.md`, and the entries here that mention them cite those CR numbers. Every ruling here or there that sets a row in `supabase/`, `.github/`, scripts, ops, compliance or keys paths `ready` still needs the counted security-lens review under CR-70 and CR-73 before it merges. Rows the council judged already done or stale, and rows that hit a founder-only limit, are not repeated here: they are in the status report. This batch records 83 rulings; 82 are RULED and 1 is OPEN: founder (BL-777, because it would change wording that D-144 reserves to the founder). Where a ruled row carries a part that is counsel's or the founder's, the entry says so on its Open line and that part is not ruled.

### Hard limits not covered

The standing approval does not reach secrets and credentials, account actions (Apple, Expo, Supabase hosted migration apply, Vercel, domains, stores), spending money, the constitution in `CLAUDE.md`, legal text counsel must see (`docs/legal/**`, terms, privacy policy, consent text), `docs/DECISIONS.md` entries, store builds and submission, or anything that needs the founder's hands or device. No entry below bypasses CODEOWNERS, branch protection, the CCO fence or the counted-review gates. The single action the founder owes for each such row is in the founder action list in the status report.

**Sign-in, account and deletion**

### CCO-16 BL-475 Sign-in code step words: five claims (22 Nov 2026, CCO, CPrivO, CMO, CDesO; CLO for point 5)
- Verdict: RULED.
- Ruling: Points 1 to 4 ruled. "Your letters are still on this phone." is true on the sign-in, failed sign-in and sign-out path (A-REQ-033); record claims row A2 as verified. The "newest link works" line (NS-41-R9) stays as the locked card words; `otp_expiry` is 900 and the hosted value is [UNVERIFIED]. Points 3 and 4 are built as shipped. Point 5 (`sensitiveConsent.declineHelp`) is counsel's registered text and is not ruled here.
- Evidence: `packages/content/src/features/auth.en.ts:5-11,99,106,202-232`; `docs/product/prd/19-from-download-to-first-letter.md:730,732`; `supabase/config.toml:75`; claims inventory rows 121-122.
- Way back: re-open the claims row; no code change to undo.
- Status the row takes: `Status: partly done (points 1, 3 and 4 shipped in code; point 2 accepted, NS-41-R9; the remaining docs PR sets claims rows A2 and A3 and fixes the stale comment; point 5 is counsel, packet Q48). Mode: agent. Owner: content.`
- Founder-only: no. OPEN: counsel for point 5 (`sensitiveConsent.declineHelp`, packet Q48); not ruled here.

### CISO-4 BL-477 The wrong-code pause stays in memory (22 Nov 2026, CISO, CPrivO, CPO)
- Verdict: RULED.
- Ruling: Option (a). The pause stays in memory and a restart clears it; the server limits hold. The locked card NS-41-R9 does not say the pause survives a restart, and the locked pack wins over A-REQ-027's "on the device" (CR-66). Persisting would need a key, and the address is never stored. The per-IP verify limit number is [UNVERIFIED] against Supabase.
- Evidence: `apps/mobile/src/lib/auth/pending.ts:7-18`; `docs/product/prd/19-from-download-to-first-letter.md:730,732`; `docs/product/prd/18-errata-after-lock.md:295` (E77); `docs/prd/v2/features/F02-account.md:210`.
- Way back: add a persisted count keyed by a non-address value later, with CPrivO's read.
- Status the row takes: `Status: ready (council ruling: memory only; one docs PR by the product manager reads A-REQ-027 as "while the app stays open", citing NS-41-R9). Mode: agent. Owner: product manager.`
- Founder-only: no.

### CCO-17 BL-487 Age step "No" keeps the 24-hour closure as built (22 Nov 2026, CCO, CLO, CDesO, CPO)
- Verdict: RULED.
- Ruling: Option (a), keep as built. An account that says it is under 18 is treated like any other answer: LEGAL-REQ-002 sets the 24-hour closure and the locked cards keep a local stop flag with nothing sent (NS-40-R3, R8, CL-130). The guard is the confirming Continue and "I answered by mistake". A second confirm would be a new registered line, which is counsel's. QA records once whether read, play and Save a copy stay reachable during the closure; if not, that is the defect. Whether any account is affected is [UNVERIFIED].
- Evidence: `apps/mobile/src/app/(auth)/sign-in/consent.tsx:304-326`; `apps/mobile/src/lib/auth/machine.logic.ts:94-99,166`; `docs/legal/ENGINEERING_REQUIREMENTS.md:29-35`; `docs/product/prd/GAP-LOG.md:641` (CL-130).
- Way back: counsel can add the confirm later; one registered line.
- Status the row takes: `Status: ready (council ruling: option (a), keep as built; S55 acceptance records why an existing account holder is treated like a new install; QA records whether read and Save a copy stay reachable during the closure). Mode: agent. Owner: qa engineer, design systems.`
- Founder-only: no.

### CDesO-14 BL-490 Sign-in sheet departures and phone-only checks (22 Nov 2026, CDesO, CPO, CTO (QA))
- Verdict: RULED.
- Ruling: Drop the two `tap` haptics on the provider buttons (S52 says no haptic; the only first-run haptic is the first Keep, NS-44-R12). A wrapped label keeps a pill up to two lines and takes a smaller radius beyond that; design systems names the radius. Points 2 and 4 become device-plan rows in S1-27. Whether the sheet shape is the same screen under account-first sign-in is [UNVERIFIED].
- Evidence: `apps/mobile/src/lib/auth/ui.tsx:202,263`; `docs/design/EXPERIENCE_PASS_2026-10.md:1293`; `docs/design/e2e/E-foundations-and-system-states/DESIGN.md:780,942`; `apps/mobile/src/components/ui/button.tsx:48,204`.
- Way back: restore the haptic calls; one PR.
- Status the row takes: `Status: ready (council ruling: drop the two tap haptics; wrapped label takes a smaller radius, owner names it; points 2 and 4 become S1-27 rows). Mode: agent. Owner: design systems, mobile engineer, qa engineer.`
- Founder-only: no.

### CISO-5 BL-491 Delete account: decisions left open by the critics' pass (22 Nov 2026, CISO, CLO, CPrivO, CDesO, CPO)
- Verdict: RULED.
- Ruling: Points 2, 4 and 6 ruled: the Export leaving out the person's own letters is accepted (BL-446 holds the fix); design systems applies the four S64 spec rows; a sole parent's letters stay unreachable while a request is open and Cancel restores them. Council block S1 ruled points 1, 3 and 5 as well; they are recorded here as recommendations only, because point 1 departs from step 5 of counsel's legal spec and points 3 and 5 are deletion terms, which the council cannot decide for counsel. As recommendations:  for 1.0 the typed word is the gate (a departure from step 5 of counsel's `DELETION_AND_EXPORT_SPEC.md`, with the 30-day undo, the scheduled email and App lock as compensating controls); today's held-intro line (names "photos") ships; a cancel-specific failure line is a PROPOSED key. All three go to the counsel relay, not into a store build, until counsel has read them.
- Evidence: `docs/legal/DELETION_AND_EXPORT_SPEC.md:200,202`; `apps/mobile/src/components/settings/delete-account.logic.ts:14-16,63-66`; `packages/content/src/features/account-deletion.en.ts:18-19,42,107`; `docs/design/reviews/P6C_P8C_CRITICS_PASS_2026-10-30.md:47,234-245`.
- Way back: restore the old spec rows; revisit point 1 if device owner authentication is built (BL-782).
- Status the row takes: `Status: ready (council ruling: points 2, 4 and 6; points 1, 3 and 5 are recommendations and PROPOSED words for the counsel relay). Mode: pair. Owner: design systems (point 4), content (point 5), legal (relay).`
- Founder-only: yes. OPEN: counsel and founder for points 1, 3 and 5 (a departure from a counsel-owned legal spec and two deletion-term lines); one action: merge the counsel-reviewed legal PR when it exists.

### CPrivO-18 BL-448 Deletion words and docs agree with the S64 page (22 Nov 2026, CPrivO, CCO, CLO, CMO, CDesO)
- Verdict: RULED.
- Ruling: Points 1, 2, 6 and the content parts of 3 ruled. Fail closed: remove the two "export" lines from the book-deletion email unless that screen offers Save a copy; remove or hold the unbacked lines in `pages.en.ts` and correct the path (Delete account is its own section). Fix the three QA doc lines to say the app stays signed in. Points 4 and 5 (the register row, Privacy Policy line and `DELETION_AND_EXPORT_SPEC.md` 2.6.1) are `docs/legal/**`: recommendation only (the built S64 wins on "Sign out of this phone" and section placement; Export and Continue are both outline). Deploying the site to `main` stays held (CR-60).
- Evidence: `packages/content/src/emails/account.en.ts:43-52,108,112,188`; `packages/content/src/pages.en.ts:199,223`; BL-783; `docs/qa/DEVICE_TEST_PLAN.md:503`.
- Way back: revert the content PR.
- Status the row takes: `Status: ready (points 1, 2, 3 content and 6 by council ruling; points 4 and 5 move to BL-783 and the counsel relay). Mode: agent. Owner: content (emails, pages), qa engineer (run sheets).`
- Founder-only: yes. OPEN: counsel and founder merge for points 4 and 5 (legal text).

### CLO-21 BL-501 Settings path words while Delete account is hidden (22 Nov 2026, CLO, CPrivO, CMO, CCO)
- Verdict: RULED.
- Ruling: Narrowed to what is not counsel's. With the row on in the store build, the three email lines, the runbook line and their tests stand. Fix the path in `pages.en.ts:199,223` ("Settings, then Your data, then Delete account") to the app's real path in one content PR; it removes a false direction and adds no promise. The Terms and policy drafts and `ENGINEERING_REQUIREMENTS.md:225` are `docs/legal/**` and ride BL-783. Deploying the site stays held (CR-60).
- Evidence: `packages/content/src/emails/account.en.ts:51,152,253`; `packages/content/test/server-surfaces-account-deletion.test.ts:153,165,166`; `docs/ops/runbooks/incident-notification.md:54`; `apps/mobile/src/app/settings/index.tsx:116-122`.
- Way back: revert the content PR.
- Status the row takes: `Status: ready (council ruling: email and runbook lines stand with the row on; fix the pages.en.ts path and its pinned lines; legal drafts ride BL-783). Mode: agent. Owner: content.`
- Founder-only: no, except: legal drafts stay with counsel (BL-783).

### CPrivO-19 BL-486 No server guard for a book made during a deletion request (22 Nov 2026, CPrivO, CDO, CTO (data architect, sync), CLO (words))
- Verdict: RULED.
- Ruling: Option (b), accept and say so; no migration. The data architect and sync owner first prove on the real SQL what the day-30 purge does with a book made or joined after the request. If it is deleted, the confirm step carries one calm PROPOSED line (a deletion term that counsel reads before a store build); if not, the line is corrected. Karma's tie-break between CPrivO (a is more protective) and CTO (cost and hosted apply out of proportion): (b).
- Evidence: `supabase/migrations/20261015000000_v1_gate_membership_sync_hardening.sql:778-826`; `20261023020000_purge_legal_holds.sql:299-336`; `apps/mobile/test/account-deletion-two-phone.test.ts:235,253-256`; BL-493 (PR #1514).
- Way back: add the guard migration later; it is additive.
- Status the row takes: `Status: ready (council ruling: option (b), accept and say so; data architect and sync owner write the purge test first; the confirm-step line is PROPOSED, counsel reads it). Mode: pair.`
- Founder-only: no.

### CDesO-15 BL-776 Recently deleted reachable after a cold start: placement ruled (22 Nov 2026, CDesO (placement), CPO, CPrivO)
- Verdict: RULED.
- Ruling: CPO-10 already ruled option (a). Placement: the existing Recently deleted row sits on the first screen first run shows on a cold start, below the primary action, as a quiet text row using the existing key `settings.delete.recentlyDeleted`. It shows only while `listDeletedBooks().length > 0` and the phone has no visible book; it opens the existing shelf route and the way back returns to first run. No new word. A new install sees nothing. Whether the Settings stack mounts from first run is untried: the builder reports it back and device walk S1-153 row (a) settles it [UNVERIFIED on a phone]. A new word would go to the founder first (D-132).
- Evidence: CPO-10 (`docs/agents/exec/RULINGS.md`); `docs/design/screens/DELETE_THIS_BOOK.md:105-125`; `packages/content/src/strings.en.ts:877`; D-160; PRs 715, 723.
- Way back: revert the build PR.
- Status the row takes: `Status: ready (CDesO placement ruled: first screen of first run, below the primary action; existing key only). Mode: agent. Depends on: none.`
- Founder-only: no.

### CPrivO-20 BL-777 VoiceOver line after Erase everything (22 Nov 2026, CPrivO, CDesO, CCO, CMO)
- Verdict: OPEN: founder.
- Ruling: Council recommendation: replace `copy.settings.erase.doneA11y` with "Your books, letters, recordings and settings are erased from this phone." (names only what was erased; matches the screen body), pinned in a content test and read back in S1-133. It is NOT recorded as RULED: D-144 says a later change to its lines goes back to the founder, and the standing approval is a relayed chat line, not a recorded decision on D-144. Until the founder answers, the existing key stays.
- Evidence: `apps/mobile/src/app/settings/erase.tsx:84`; D-144 item 1 and its "Open" list; CCO-6; LEGAL-REQ-051 and -044.
- Way back: one content key.
- Status the row takes: `Status: needs-founder (recommended line above, PROPOSED; D-144 wording is the founder's). Mode: agent. Owner: content, mobile engineer.`
- Founder-only: yes. OPEN: founder. One action: reply "yes" to the line above or give a different line (D-144 item 1).

### CPrivO-21 BL-528 Offline export carries a copy of the consent record (22 Nov 2026, CPrivO, CDO, CCO, CTO)
- Verdict: RULED.
- Ruling: Option (a), kept small. After each successful signed-in read keep on the phone only the person's own rows with the columns the export already reads (`ACT_COLUMNS`, `STATE_COLUMNS`, never `profile_id` or `subject_hash`), class L3, stamped with when read. An offline export carries it and says when it was read; with no copy the existing `unavailable` stands. Delete it on sign-out, account deletion and Erase everything. Options (b) and (c) edit LEGAL-REQ-034 (legal text) and are not taken. The data-map line goes to `docs/ops/proposed/`, as CR-145 did for BL-1464. Medium, not a release gate.
- Evidence: `apps/mobile/src/lib/export/server-records.logic.ts:1-22`; `docs/legal/ENGINEERING_REQUIREMENTS.md:296`; CPrivO-11, CPrivO-16; CR-145.
- Way back: delete the local copy and its write; the export reverts to `unavailable` offline.
- Status the row takes: `Status: ready (council ruling: option (a), own rows only, L3, deleted with sign-out, account deletion and Erase everything; the data-map line goes to docs/ops/proposed/). Mode: agent. Owner: export owner, privacy engineer.`
- Founder-only: no.

### CDesO-16 BL-1441 Refused Apple or Google sign-up on first-run Welcome (22 Nov 2026, CDesO, CPO, CCO; CLO (words held))
- Verdict: RULED.
- Ruling: The design already exists; only wiring is missing. A refusal from either provider on the first-run Welcome shows the refused-region screen (E-S04.refused-region, NS-40-R9, R14): one line, Terms and Get in touch, no Try again, no reason, nothing stored. Wire it through the existing `region_refused` mapping with a test per provider and a check that no analytics call carries the reason. The words are PROPOSED and held for counsel and the founder, so it reaches users only through a store build.
- Evidence: `docs/design/e2e/E-foundations-and-system-states/DESIGN.md:57,201,269,699,943`; `packages/content/src/features/auth.en.ts:202-232`; `apps/mobile/src/components/onboarding/region-refused-screen.tsx`.
- Way back: revert the wiring PR.
- Status the row takes: `Status: ready (council ruling: reuse E-S04.refused-region for Apple and Google refusals on the Welcome; words PROPOSED and held for counsel). Mode: agent. Owner: mobile engineer.`
- Founder-only: no, except: words stay with counsel and the founder.


**Words and copy**

### CMO-18 BL-474 No "we" or "our" in notification copy (22 Nov 2026, CMO, CDesO, CPrivO)
- Verdict: RULED.
- Ruling: Notification copy says no "we" or "our": a lock screen is read by people the parent did not choose. The two named lines are already reworded, so the work left is a content rule that fails on `\bwe\b` and `\bour\b` in the notification and reminder keys and one VOICE.md surface-rule line.
- Evidence: `packages/content/src/features/reminders.en.ts:18`; `packages/content/test/rules.test.ts:270,1069,1248`; PR #447.
- Way back: delete the rule line.
- Status the row takes: `Status: ready (council ruling: no "we" in notification copy; the two lines are already reworded; add the rules.test.ts guard and one VOICE.md line). Mode: agent. Owner: content.`
- Founder-only: no.

### CDesO-17 BL-925 Words for a recording that could not be let go (N-07) (22 Nov 2026, CDesO (content), CPrivO, CLO (one key), CPO)
- Verdict: RULED.
- Ruling: Option A for four of five keys, locked under CR-144 as PROPOSED and replaceable by the founder; they reach users only through a store build (CR-145 precedent): `en.review.letGoPending`, `en.listen.letGoStuck`, `en.listen.removeNowButton`, `en.listen.removeNowA11yHint`. `en.listen.discardBodyNoUndo` is held until counsel rules the K2 case ("cannot be brought back" may be untrue for a draft held on the server); `discardBody` stays in use. BL-926 is unblocked; BL-977 switches the two screens only after the held key is cleared.
- Evidence: `packages/content/src/strings.en.ts:305-321,401`; `docs/content/words-packet-20nov.md` Part 1 rows 1 to 5; PRs #866, #832.
- Way back: replace the keys; each is one content key.
- Status the row takes: `Status: done (council ruling: four keys approved as PROPOSED under CR-144; discardBodyNoUndo held for counsel K2; BL-926 is unblocked)`
- Founder-only: no, except: `discardBodyNoUndo` stays held for counsel (K2).

### CPO-32 BL-926 Review says so when Let it go did not finish (N-07) (22 Nov 2026, CPO, CDesO, CTO)
- Verdict: RULED.
- Ruling: The line already exists as a PROPOSED key (`strings.en.ts:390`, option A, with `ns09-copy.test.ts`). The code does not need approval, only a store build does. The builder reads the `letItGo` result, shows the key once, announces it to VoiceOver and keeps Review usable. See the BL-925 entry.
- Evidence: `apps/mobile/src/app/review.tsx:417`; `packages/content/src/strings.en.ts:390-400`; `apps/mobile/test/ns09-let-go-source.test.ts:7`.
- Way back: revert the build PR.
- Status the row takes: `Status: ready (builds on the PROPOSED key at strings.en.ts:390; the founder's word approval, BL-925, gates the store build, not the code). Mode: agent.`
- Founder-only: no.

### CPO-33 BL-977 Let it go always finishes: remaining rows (22 Nov 2026, CPO and content (words), CTO, data architect)
- Verdict: RULED.
- Ruling: Keep blocked on the chain BL-925 (words) then BL-926 then this row; Depends on names BL-926 only. The server half of D7 is already in tests (#1074), so only the `sync` report and the counter remain.
- Evidence: BL-925, BL-926; PRs #866, #1074, #1140, #1141.
- Way back: none needed.
- Status the row takes: `Status: blocked (BL-926, which waits on BL-925 words; the server purge test is in, PR #1074). Mode: agent. Depends on: BL-926.`
- Founder-only: no.

### CDesO-18 BL-1557 Two Moments strings (22 Nov 2026, CDesO (owns the words), CMO (voice), CPrivO, CPO)
- Verdict: RULED.
- Ruling: A words question, not a hard limit: not legal text, makes no promise, and the strings sit behind a flag that is off. RSN-HEART becomes "Pictures you marked as favorites" (Apple's term; whether the Favorites flag is readable under Limited access is [UNVERIFIED], NS-53-R290, BM-18). RSN-MONTHDAY becomes "The day of the month {child} was born". Content applies the change to `moments-tab.en.ts` and spec 6.4a and runs the rules tests; the CMO voice check is the one required read; the founder's in-app read is an optional veto, not a gate.
- Evidence: `docs/product/prd/28-moments-tab.md` 6.4a line 297, R290, BM-18; `packages/content/src/features/moments-tab.en.ts:38,42`; WRITING-GUIDE lines 160, 412; PR #1479.
- Way back: revert the two strings in one commit.
- Status the row takes: `Status: ready (council-ruled strings: "Pictures you marked as favorites", "The day of the month {child} was born"; content applies; founder may veto at first in-app read). Mode: agent.`
- Founder-only: no.

### CPO-34 BL-1469 Servers-off Welcome stops naming Plus (22 Nov 2026, CPO, CMO, CBO, CDesO, CPrivO)
- Verdict: RULED.
- Ruling: Option (b). NS-44-R1 is a locked P0 card (no Plus name at any step of first run) and is newer than the 1 Nov F5 line; under CR-66 the card wins. The F5 intent survives in Me, Plus and at the Keep gate. Keep the allowance and drop the Plus sentence, for example "Your first two letters are free. Reading, listening and your copy stay free." (PROPOSED; content may offer a better line). Change `billing-f5-lines.test.ts` and its source in the same PR and flip the `it.fails` for NS-44-R1 to a plain `it`. No price or plan change. Karma's tie-break between CMO/CBO: (b).
- Evidence: `packages/content/src/strings.en.ts:75`; `apps/mobile/src/app/onboarding.tsx:399-400`; `apps/mobile/test/ns41-44-first-run-no-surprise.test.ts:106-123`; `docs/product/prd/19-from-download-to-first-letter.md:1371,1414,1437`.
- Way back: revert the line and the test; the founder can restore F5 in one line.
- Status the row takes: `Status: ready (council ruling: option (b); the servers-off Welcome line drops the Plus sentence; F5's test and source change in the same PR; the new words are PROPOSED). Mode: agent. Owner: content, mobile engineer.`
- Founder-only: no.


**Invite codes, co-parent and remote push**

### CDesO-19 BL-524 Typed-code app copy, including `codes_paused` (22 Nov 2026, CDesO and content, CMO, CPrivO, CTO)
- Verdict: RULED.
- Ruling: Do not wait for the client. Write the keys first with no screen using them, covering every answer the endpoint can give (`SCINV` details, `rate_limited` with `codes_paused` pointing the person to ask for the link). Words follow WRITING-GUIDE and the rules test; they are council-locked, not founder-approved, replaceable, and reach users only when BL-445's flag flips.
- Evidence: `packages/api/src/envelope.ts:113`; `supabase/functions/invite-redeem/handler.ts:166`; `docs/design/e2e/D-family-sharing-reminders/DESIGN.md:1057`; `docs/DECISIONS.md` D-120 effects.
- Way back: delete the unused keys.
- Status the row takes: `Status: ready (first step of BL-445; words only, no screen uses them until BL-445's flag flips). Mode: agent.`
- Founder-only: no.

### CPO-35 BL-546 Remote push foundation is parked with the co-parent work (22 Nov 2026, CPO, CISO, CPrivO, CTO)
- Verdict: RULED.
- Ruling: Stays blocked and the old reason ("servers are off in v1.0") is wrong since D-157. Remote push exists only for the co-parent letter push (F11, M14); D-162 keeps co-parent entry points out of a store build until BL-882 to BL-889; FR-MSG-17 needs a named APNs key holder, consent text, an opt-out and a label read. Parked; nobody adds `aps-environment` or a token request in another task. The APNs key is a founder account action when scheduled.
- Evidence: D-121, D-157, D-162; `docs/design/NOTIFICATIONS.md:36`; `docs/product/prd/FUNCTION-TRACE.md:3178`.
- Way back: reopen when BL-882 to BL-889 are scheduled.
- Status the row takes: `Status: blocked (parked with the co-parent work, BL-882 to BL-889, D-162; needs a named APNs key holder, consent text and a label read first, FR-MSG-17). Mode: agent.`
- Founder-only: no.


**Moments and the photo library**

### CPO-36 BL-1019 NS-51 photo moments row is carried by Moments (22 Nov 2026, CPO, CPrivO, CISO, CTO)
- Verdict: RULED.
- Ruling: Do not dispatch. Its content is carried by BL-1434, BL-1435 and BL-1436 (read set NS-53-R37); CPO-17 and D-165 put the library read in 1.0 through the Moments tab. Keep it blocked, not closed, because NS-51-R5, R24, R26 and R29 map to it in the P0 map; CPO re-homes those four, then Karma flips it to superseded. The BL-1001 reversal and counsel on Photos access ride with Moments gates G2 and G3 already queued.
- Evidence: CPO-17; D-165; `docs/product/prd/28-moments-tab.md` (RV-19, NS-53-R37); `docs/product/P0-TO-BL-20nov.md:520,532`.
- Way back: reopen the row.
- Status the row takes: `Status: blocked (superseded in design by BL-1434, BL-1435 and BL-1436 under CPO-17 and D-165; CPO re-homes NS-51-R5, R24, R26 and R29 in the P0 map, then this flips to superseded)`
- Founder-only: no.

### CPO-37 BL-849 Memory Library specs stay parked (22 Nov 2026, CPO, CDesO, CPrivO)
- Verdict: RULED.
- Ruling: Keep parked so no agent dispatches it. The Memory Library P1 to P4 specs overlap the Moments design (PRD 28), which owns the card, permission and hidden-choice surfaces; folding them into COMPONENTS.md would make two design sources. CDesO reconciles once the first Moments screens (BL-1436 PRs 13 to 17) land, then closes or cuts the row.
- Evidence: `docs/product/prd/17-engineering-project-plan.md:250`; `docs/product/prd/28-moments-tab.md` (RV-07, RV-18); PRs #746, #751.
- Way back: set the row ready again.
- Status the row takes: `Status: deferred (parked: Memory Library P1 to P4 overlap the Moments tab design, NS-53; CDesO reconciles when BL-1436 PRs 13 to 17 land, then this row is closed or cut down)`
- Founder-only: no.

### CPO-38 BL-860 Decisions logic row stays parked (22 Nov 2026, CPO, CDO, CPrivO, CTO)
- Verdict: RULED.
- Ruling: Keep parked. `moments.v1.json` (PR #1481) holds day keys and hide and keep-close choices, device-only, excluded from backup, with no photo key; `buildMoments` (#1528) replaces the NX-39 engine. Building `decisions.ts` now would duplicate it. Recommendation: Karma closes PR #754 as superseded with the reason posted; CPO re-points or closes the row when BL-1433 finishes.
- Evidence: PR #1481 body; PR #754 (open); PR #1528; `docs/product/prd/17-engineering-project-plan.md:250`.
- Way back: reopen the row.
- Status the row takes: `Status: deferred (parked: the Moments store, PR #1481, and buildMoments, PR #1528, replace the NX-39 decisions design; PR #754 to be closed as superseded; CPO re-points or closes when BL-1433 finishes)`
- Founder-only: no.

### CPO-39 BL-874 P2a date-range chooser stays parked (22 Nov 2026, CPO, CPrivO, CISO, CLO)
- Verdict: RULED.
- Ruling: Keep parked. The first library surface is the Moments tab and Apple's picker door; PRD 28 has no album chooser. A date-range chooser is a second library surface with a parallel permission story and a second native module pass (BL-878). The counsel items (CB-2, CB-5, CB-15) ride with Moments gate G2.
- Evidence: BL-1436 (PR 17); `docs/product/prd/28-moments-tab.md`; `docs/product/prd/17-engineering-project-plan.md:250`.
- Way back: reopen after Moments ships if parents ask.
- Status the row takes: `Status: deferred (parked: Moments, NS-53, is the first library surface; a date-range chooser is a later row after it ships and counsel CB-2, CB-5, CB-15 answers)`
- Founder-only: no.

### CPO-40 BL-875 P2c background top-up is deferred (22 Nov 2026, CPO, CISO, CPrivO, CTO)
- Verdict: RULED.
- Ruling: Deferred, not blocked. The locked Moments spec has no `PHPhotoLibraryChangeObserver` and no background mode (NS-51-R29); freshness comes from a scan on focus and foreground. Its gates (device spikes BL-871, BL-872; counsel CB-19, CB-20, CB-27) are device and counsel items nothing in the first release needs.
- Evidence: `docs/product/prd/28-moments-tab.md:632,1064`; BL-871, BL-872.
- Way back: set ready with a new row if the founder asks for background freshness.
- Status the row takes: `Status: deferred (after the first Moments release; NS-53 has no background mode, NS-51-R29). Depends on: BL-853.`
- Founder-only: no.

### CPO-41 BL-853 P2b "Suggest days" is superseded by Moments (22 Nov 2026, CPO, CDesO, CPrivO, CTO)
- Verdict: RULED.
- Ruling: Park as superseded in design. The 1.0 library read is NS-53 (CPO-17). Spec 28 reverses the card rules this row is built on (RV-07, RV-18), and the module, index and screens are in BL-1435 and BL-1436 under their own stores (CDO-23). Do not start it; the product agent maps each NX-39 R-id still wanted (R3, R11, R15 to R20, R42, R45) to an NS-53 row so none is dropped silently.
- Evidence: `docs/product/prd/28-moments-tab.md:100,111,162`; CPO-17; CDO-23; `docs/product/prd/17-engineering-project-plan.md:250`.
- Way back: reinstate the row.
- Status the row takes: `Status: superseded (in design by NS-53 Moments, spec 28, CPO-17; surfaces are in BL-1433, BL-1435 and BL-1436; product agent maps each NX-39 R-id before this closes).`
- Founder-only: no.

### CPO-42 BL-876 Ledger page and Hidden choices page are superseded by Moments (22 Nov 2026, CPO, CDesO, CPrivO)
- Verdict: RULED.
- Ruling: Superseded in design: KM4 in spec 28 keeps the Hidden choices list and the hide controls, and BL-1436 PR 21 builds them. The NX-39 ledger page and "Forget the list" belong to the old design. Do not start it; the product agent carries NX-39-R49's plain line into PR 21's rows if still wanted.
- Evidence: `docs/product/prd/28-moments-tab.md:162` (KM4); `docs/product/moments-tab/HARNESS-REPLAN-HYBRID.md:53`; BL-1436 PR 21.
- Way back: reinstate the row.
- Status the row takes: `Status: superseded (by BL-1436 PR 21, Me list with Hidden choices and Turn off; product agent carries NX-39-R49 across).`
- Founder-only: no.

### CPO-43 BL-880 Acceptability harness stays parked (22 Nov 2026, CPO, CPrivO, CDO)
- Verdict: RULED.
- Ruling: Keep parked with BL-859, which Moments replaced with `buildMoments`. The founder-phone step is a device row no agent can do; the Moments gates file their own row if they want an aggregate-shape read on a real phone. No founder action now.
- Evidence: BL-859 (blocked, parked); PR #1528; `docs/product/prd/17-engineering-project-plan.md:250`.
- Way back: reopen.
- Status the row takes: `Status: deferred (parked with BL-859; Moments gates carry any founder-phone read; mode human)`
- Founder-only: no.

### CPO-44 BL-1436 Moments umbrella stays blocked; O-50 ruled, O-48 not (22 Nov 2026, CPO, CDesO, CPrivO, CISO, CTO)
- Verdict: RULED.
- Ruling: Keep the umbrella blocked and do not dispatch it as one XL row. O-50 (names and month numbers in Moments push and email): the stricter reading, no child name and no month number on any Moments push or email setting; it matches CPO-17 item 5 (no library-timed push and no Moments email in 1.0) and unblocks PR 23 on O-50. O-48 (value proposition and first-run promise) stays a founder-and-counsel item (what a user is promised): D-165 keeps the pair unpublished until counsel answers and the words stay PROPOSED. O-61 is Karma's under CR-73, not the founder's (see BL-1475). Recommend Karma splits the row into per-PR child rows.
- Evidence: `docs/product/moments-tab/FREEZE-CHECKLIST.md:50,52,216,218,229`; CPO-17; D-165; BL-1433, BL-1435, BL-1447, BL-1451; PRs #1479, #1481, #1482, #1477.
- Way back: restore the stricter-reading default later by a new ruling if the founder wants names in notes.
- Status the row takes: `Status: blocked (umbrella; split into per-PR child rows: PRs 13 and 14 after BL-1433's PR 12, PRs 15 to 17 and 19 after BL-1435, PR 22 after BL-1451; O-50 ruled as the stricter reading so PR 23 is unblocked on it; O-48 words stay PROPOSED until counsel answers)`
- Founder-only: yes. OPEN: founder and counsel for O-48 (what users are promised); not ruled here.

### CPrivO-22 BL-1410 Metadata scan on every picture send-out is a standing condition (22 Nov 2026, CPrivO, CISO, QA, CTO)
- Verdict: RULED.
- Ruling: Not a work row. Keep it non-dispatchable; it closes when the BL-933 (picture export) and BL-939 (one-letter share) PRs each carry the byte test (bytes equal `entry_media.sha256`, no metadata segment, a planted located picture turns it red) and cite this id.
- Evidence: `docs/BACKLOG.md` BL-1410 gate line, BL-933, BL-939.
- Way back: none.
- Status the row takes: `Status: blocked (condition only: closes when the BL-933 and BL-939 PRs each carry the test; not dispatched alone). Depends on: BL-933.`
- Founder-only: no.

### CISO-6 BL-1408 Picture file protection class: unblock via BL-1045 (22 Nov 2026, CISO, CTO, security-architect)
- Verdict: RULED.
- Ruling: The blocker BL-1045 is `proposed`, size S, waits on nothing, and `modules/REVIEWED.sha256` does not exist on develop. Karma sets BL-1045 ready and BL-1408 follows. The NSC-01 review gate stands and security-architect reads it. Class stays `completeUntilFirstUserAuthentication`, not `complete` (P8). Device row D-2 stays the founder's phone.
- Evidence: `docs/security/MEDIA_THREAT_MODEL.md` P8, G-3, D-2; BL-1045.
- Way back: set BL-1045 back to proposed.
- Status the row takes: `Status: blocked (BL-1045 only, which Karma sets ready; the NSC-01 review gate stands; D-2 is the founder's device row). Mode: agent. Depends on: BL-1045`
- Founder-only: no.

### CISO-7 BL-1413 Writing Tools off on letter fields: unblock via BL-1045 (22 Nov 2026, CISO, CAIO, CTO, CDesO)
- Verdict: RULED.
- Ruling: BL-1045 (native-module review gate, NSC-01) is a small row waiting on nothing; Karma sets it ready and this row follows. The gate is not skipped: a native setting waits on NSC-01 and a security-architect read. It serves the constitution (a phone feature must not rewrite a letter), is never presented as a feature, and changes no words. ADR 0039 is PROPOSED and needs Karma's acceptance in the same sequence.
- Evidence: `docs/tdd/new-scope/security.md:17,20,50,54` (NSC-01, NSC-05); `apps/mobile/src/lib/photos/words-setting.ts:2-3`; BL-1045.
- Way back: set BL-1045 back to proposed.
- Status the row takes: `Status: blocked (BL-1045 only; BL-1045 is set ready by this ruling). Mode: agent.`
- Founder-only: no.

### CPrivO-23 BL-1415 Account deletion leaves pictures and recordings on the phone, said plainly (22 Nov 2026, CPrivO, CDO, CLO (consulted, not counsel), CTO)
- Verdict: RULED.
- Ruling: Already answered by the locked design: J-C21 (NS-45-R5, K4) shows "pictures and recordings stay on each phone until that phone is erased". Staying is intended and said plainly, so no user promise changes. QA runs D-7b on an Asha test account to confirm the code matches; BL-965 carries the deletion text for pictures. Do not call `eraseDeviceFiles` from account deletion. If D-7b shows files do go, the delete words must change and that becomes a founder item.
- Evidence: `docs/design/e2e/C-keeping-and-trust/DESIGN.md:345-349` (J-C21); BL-965; `docs/security/MEDIA_THREAT_MODEL.md` P12, G-9, D-7b.
- Way back: one call and one key.
- Status the row takes: `Status: blocked (the D-7b device result only; the answer is recorded: the files stay, the delete screen says so per J-C21, BL-965 carries the words). Mode: pair. Depends on: none`
- Founder-only: no, except: the D-7b device result is the founder's phone or a simulator; a different result becomes a founder item.


**Days, reminders and Home slips**

### CPO-45 BL-534 No prompt repeats within 365 days is a 1.0.1 item (22 Nov 2026, CPO, CTO, CDO)
- Verdict: RULED.
- Ruling: Not in 1.0: the selector keeps `AVOID_RECENT = 10`. The row stays as the 1.0.1 build: a per-author, per-child local history as a new local migration, `selectPrompt` avoiding keys shown in the last 365 days, with the exhausted-pool rule written first. It needs a local schema step and 1.0 already carries local migrations 11 and 12 (CR-62, CR-64); Moments also calls `selectPrompt`, so the history is designed once for both callers. A repeat prompt is a quality gap, not harm.
- Evidence: `packages/core/src/prompts.ts:93,138`; `docs/design/NOTIFICATIONS.md:19`; `docs/agents/harness-v2/RELEASE-PATH-ORDER.md:98`; D-130 freeze text in the row.
- Way back: pull it into 1.0 if a store candidate has room and the migration number is free.
- Status the row takes: `Status: deferred (1.0.1; council ruling: keep AVOID_RECENT = 10 for 1.0; build the 365-day history after 1.0 with the exhausted-pool rule first). Mode: agent. Owner: mobile engineer. Depends on: BL-530 (done).`
- Founder-only: no.

### CPO-46 BL-538 Pause for a while is not in 1.0 (22 Nov 2026, CPO, CDesO)
- Verdict: RULED.
- Ruling: Defer; do not build a timed pause. S34 removed "Pause all reminders" as a duplicate of the master switch; a timed pause is a new setting, new state that must survive time-zone changes, and new words. Nothing in the locked pack asks for it. Reopen only if parents ask after launch.
- Evidence: `docs/product/prd/GAP-LOG.md` (no pause row); grep of `packages/content/src` and `apps/mobile/src` finds only remote kill switches named "pause".
- Way back: set the row ready again.
- Status the row takes: `Status: deferred (after 1.0, FUTURE; council ruling: no timed pause for 1.0; reopen on parent demand). Mode: agent. Owner: reminders owner. Size: S.`
- Founder-only: no.

### CPO-47 BL-1011 Calendar engine: computed dates now, copied tables as n/r (22 Nov 2026, CPO, CLO and CCO (source rights), CDO, CTO)
- Verdict: RULED.
- Ruling: Release the part that needs no counsel. Rule dates are computed (fixed, nth weekday, Easter by the computus) and checked against a sourced, dated oracle table; no third-party table is copied (DL-4, NS-46-R12). Build `days.ts`, `daysDueOn(rows, today)` with an injected today, the oracle with authority and read-on date per row (a row with no authority fails the build) and one age function. Any row whose date would be copied ships as the literal `n/r` until counsel answers Q113 (FR-CMP-31).
- Evidence: `docs/product/prd/21-days-cultural-photos-home.md:274,285`; `docs/product/prd/functions/compliance.md:313,334`; BL-1002 (PR #1029).
- Way back: delete the module; nothing is user-visible until the Days flag turns on.
- Status the row takes: `Status: ready (computed rule dates only, DL-4; any copied-source row ships as n/r until counsel answers Q113). Mode: agent. Depends on: none.`
- Founder-only: no.

### CPO-48 BL-1013 Days page and Browse: blocked on code, not on words (22 Nov 2026, CPO, CDesO, CPrivO)
- Verdict: RULED.
- Ruling: Stays blocked only on code: BL-1010 (partly done) and BL-1012. "Founder words G3" is not a blocker for coding: words stay PROPOSED keys and the founder's reading gates the store build only. The consent line on this page is consent text, so counsel's read gates its flag (as BL-1010 says).
- Evidence: BL-1010, BL-1012 status lines; `docs/agents/exec/RULINGS.md` (words stay PROPOSED).
- Way back: restore the old status line.
- Status the row takes: `Status: blocked (BL-1010, BL-1012; the words stay PROPOSED, so the founder's G3 reading gates the store build, not the code). Mode: agent.`
- Founder-only: no, except: the consent line is counsel's.

### CPO-49 BL-1016 NS-48 recency layers: BL-537 is no longer a dependency (22 Nov 2026, CPO, CTO)
- Verdict: RULED.
- Ruling: The NS-13 back-off BL-537 described is built and merged (PR 1248; `BACKOFF_LAST_DAY = 35` at `planner.ts:169`; stop after day 35; anchor `onSince`), and applies to the evening class only. Drop BL-537 from Depends on. BL-1004 is done (PR 1032). Words wait for G3 as the row says.
- Evidence: `apps/mobile/src/lib/reminders/planner.ts:31-32,169,339-365`; PR 1248; `docs/product/prd/11-foundations.md:19,38`.
- Way back: re-add a dependency if NS-13 semantics change.
- Status the row takes: `Status: ready. Mode: agent. Depends on: BL-1004 (done). BL-537 is superseded by the built NS-13 back-off (PR 1248).`
- Founder-only: no.

### CPO-50 BL-1320 Days ticks and quiet days: BL-537 superseded by BL-943 (22 Nov 2026, CPO, CDO, CDesO, CTO)
- Verdict: RULED.
- Ruling: The "deferred BL-537 decision" is moot: BL-537 is covered by the NS-13 back-off in BL-943 (PR #1248 merged). Record BL-537 as superseded by BL-943 and remove it from Depends on. Still blocking: BL-963 (ready, not built) and BL-965 (partly done). The row is ready when BL-963 is done and BL-965's days words exist.
- Evidence: BL-537, BL-943, BL-966, BL-963, BL-965; `docs/product/P0-SPLIT-PLAN-21nov.md:113`.
- Way back: restore BL-537 as a dependency.
- Status the row takes: `Status: blocked (BL-963 and BL-965; BL-537 is superseded by BL-943, PR #1248, and is no longer a dependency). Mode: agent. Depends on: BL-966, BL-963, BL-965.`
- Founder-only: no.

### CPO-51 BL-1321 Days words and the line before a first tick (22 Nov 2026, CPO, CDesO and content, CTO)
- Verdict: RULED.
- Ruling: Same finding as BL-1016: BL-537 is superseded by the built NS-13 back-off (PR 1248), so the split plan's "waits on the deferred BL-537 decision" step is void for this row and for BL-1319, BL-1320 and BL-1322. Still gating: BL-963 (ready) and BL-965 (partly done; its words are PROPOSED). The words may not say last year or again or show what the parent wrote on that day before.
- Evidence: `docs/product/P0-SPLIT-PLAN-21nov.md:113`; `apps/mobile/src/lib/reminders/planner.ts:169`.
- Way back: restore the dependency.
- Status the row takes: `Status: blocked (BL-963 and BL-965; BL-537 is superseded by the built NS-13 back-off, PR 1248). Mode: agent. Depends on: BL-966 (done), BL-963, BL-965.`
- Founder-only: no.

### CPO-52 BL-1322 Days library file and listing words: start tests-first now (22 Nov 2026, CPO, CDO, CPrivO, CMO)
- Verdict: RULED.
- Ruling: BL-537 is not a real dependency: the row's four ids (NS-46-R46, NS-46-R48, NS-50-R8, FR-DAY-20) never use it; the block came from a batch-wide rule in the split plan. Drop it. The row is tests-first (a test per id, title starting with its id), so it can start now. The listing line in R46 is a public claim: it stays PROPOSED, the default pending the founder (Q-FD-19) is used, and CMO and CCO check it against the claims inventory.
- Evidence: `docs/product/prd/21-days-cultural-photos-home.md:308,310,1092`; `docs/product/P0-SPLIT-PLAN-21nov.md:113`; `docs/product/prd/23-dependency-map-and-plan.md:291`.
- Way back: restore the dependency.
- Status the row takes: `Status: ready (tests first; BL-537 is not a dependency of these four ids). Mode: agent. Depends on: BL-966, BL-963, BL-965.`
- Founder-only: no.

### CPO-53 BL-1324 Days notification words: ready (22 Nov 2026, CPO, CDesO and content, CPrivO, CTO)
- Verdict: RULED.
- Ruling: Same BL-537 ruling as BL-1320: BL-537 is superseded by BL-943 (PR #1248) and drops out. BL-966's core is merged (budget registry, one note a day, 60 pending, names-off lock screen), so the only other dependency is met. Ready: tests first, then code or words only where a test fails, one PR.
- Evidence: `apps/mobile/src/lib/reminders/budget.ts`; PRs #1088, #1089, #1174, #1172, #1075, #1248.
- Way back: set blocked again.
- Status the row takes: `Status: ready (BL-966 core merged; BL-537 is superseded by BL-943, PR #1248). Mode: agent. Depends on: none.`
- Founder-only: no.

### CPO-54 BL-1007 Day-only reminder gate: dispatch dark (22 Nov 2026, CPO, CPrivO and CLO (consent line), CTO)
- Verdict: RULED.
- Ruling: Q-FD-20 and Q-FD-21 are CLOSED (GAP-LOG CL-026), so the behaviour is decided and BL-966 is done. The code (a day-only gate beside `prefs.enabled`, one `next-ask`-style door at the first tick) needs no counsel to build. The sentence before the first tick, the "Your iPhone will ask" line and the Reminders-off line stay PROPOSED; counsel (G2) and the founder's words approval (G3) gate any build that turns the Days surface on. Dispatch the code dark.
- Evidence: `docs/product/prd/GAP-LOG.md:537` (CL-026); `docs/product/prd/21-days-cultural-photos-home.md:77-78,293`; `docs/design/e2e/D-family-sharing-reminders/DESIGN.md:174,179`; `docs/product/READINESS-20nov.md:271`.
- Way back: revert the gate.
- Status the row takes: `Status: ready. Mode: agent. Depends on: BL-966 (done). Words PROPOSED; Days surface stays off until counsel (G2) and the founder's words approval (G3).`
- Founder-only: no, except: the consent sentence is counsel's.

### CPO-55 BL-946 One past letter on Home: depends on BL-937 and BL-963 (22 Nov 2026, CPO, CDesO, CPrivO)
- Verdict: RULED.
- Ruling: BL-931 is done and BL-952 is effectively done for this row; the real dependencies are BL-937 and BL-963 (both `ready`; BL-963 is counted as this row's first PR in plan 17). Keep the P0 test NS-23-R8 first. The switch label stays the founder's words (PROPOSED key), which gates the flag, not the build.
- Evidence: `docs/product/prd/17-engineering-project-plan.md:186`; BL-963, BL-937.
- Way back: flag and switch default.
- Status the row takes: `Status: blocked (BL-937 and BL-963, both ready). Mode: agent. Depends on: BL-937, BL-963.`
- Founder-only: no.

### CDesO-20 BL-937 "This letter" list waits for a second non-photo row (22 Nov 2026, CDesO, CPO, CTO)
- Verdict: RULED.
- Ruling: Do not dispatch now. CDesO-12 keeps "Add to this letter" until a second non-photo row has a build (building the list for rows that are off is gold-plating before the gate). Trigger to set ready: any of Firsts, the seal, or Save a copy's letter-page row reaches a store build. The list's heading words are PROPOSED for the founder.
- Evidence: `docs/BACKLOG.md:3631-3637`; CDesO-12; BL-928.
- Way back: one component and one key (CDesO-12 way back).
- Status the row takes: `Status: deferred (CDesO-12: replace the group with the "This letter" list when a second non-photo row has a build; BL-928's letter page parts are merged, so nothing else blocks it)`
- Founder-only: no.

### CPO-56 BL-942 Save a copy of the year: Me action now, slip after BL-963 (22 Nov 2026, CPO, CDesO, CTO)
- Verdict: RULED.
- Ruling: Narrow the blocker: BL-931 slices #834 to #840 are merged and BL-952 (Find) is not used by Save a copy. Only BL-963 (Home slip registry; the registry test fails on an unregistered slip) is real. The Me screen half can start now; the Home slip waits for BL-963. Flag `EXPO_PUBLIC_SAVE_A_COPY` stays off in production; words stay PROPOSED until the founder reads them in the app; no notification.
- Evidence: `docs/BACKLOG.md:3666-3672`; `git log origin/develop --grep BL-931`; `docs/product/prd/17-engineering-project-plan.md`.
- Way back: restore the old status line.
- Status the row takes: `Status: blocked (BL-963, the Home slip registry, for the slip half only; the Me action can start). Mode: agent. Depends on: BL-963`
- Founder-only: no.


**Pictures, share, sealed letters and accessibility**

### CPO-57 BL-939 Share one letter: trim the blocker to BL-937 and fix the scope to E14 (22 Nov 2026, CPO, CTO, CPrivO and CLO (picture arm), security-architect read)
- Verdict: RULED.
- Ruling: Trim the blocker to BL-937 (BL-931 done; BL-952 slices 1 to 7 of 8 merged and the eighth does not touch a one-letter share; principal-architect says in the PR if a shared file exists). Correct the row to erratum E14: the card wins, the shared text is the wrapper (date, words, signature) with no footer, brand name or link (NS-05-R16b), and the optional picture is gated by counsel Q45 and the security-architect read. The founder's words approval and the production flag stay out of this build step.
- Evidence: `docs/product/prd/18-errata-after-lock.md:22` (E14); `docs/product/prd/05-share-one-letter.md:36`; PRs 892, 893.
- Way back: flag off.
- Status the row takes: `Status: blocked (BL-937 only; BL-931 done, BL-952 slice 8 not needed). Mode: agent. Depends on: BL-937. Scope to be corrected to erratum E14 (wrapper text, no recording, no footer).`
- Founder-only: no.

### CDesO-21 BL-956 Pictures at large text: shrink scope, split on BL-932 (22 Nov 2026, CDesO, CTO, design-systems)
- Verdict: RULED.
- Ruling: BL-931 slices are merged. Smart Invert is already built (#1097), so shrink the scope. The large-text 88 pt thumbnail, fit-not-crop and the lens as a `ChoiceGroup` can ship first; the 512 px read waits for BL-932 (two derivatives), which should be set ready (no derivative code exists on develop).
- Evidence: `docs/BACKLOG.md:3759-3766`; #834 to #840, #1097; `accessibilityIgnoresInvertColors` in `photo-frame.tsx`.
- Way back: restore the old scope.
- Status the row takes: `Status: blocked (BL-932 for the 512 px lens read only; Smart Invert is done in #1097; the large-text, fit-not-crop and radio-group parts can start). Mode: agent. Depends on: BL-932`
- Founder-only: no.

### CPO-58 BL-1018 NS-52 variant A: blocker rewritten (22 Nov 2026, CPO, CPrivO, CISO, CDO, CTO)
- Verdict: RULED.
- Ruling: Keep blocked but rewrite the blocker. Cleared: #835 merged; Q-PM-2 and Q-PM-3 are founder-answered with the default accepted (CL-047, CL-048: 6 pictures and 2 videos, 60 s, 100 MB, local only, free). Reclassified: counsel's label read (CR-146 row 11, Q43, Q54) gates turning the flag on in a store build, not the code. Still real: BL-1001, BL-933, BL-961, and the `expo-video` and transcode dependency review through BL-878. The Moments one-picture default (BL-1472, O-62) means this row is not on the first-release path.
- Evidence: `docs/BACKLOG.md:4207-4214`; `docs/product/prd/27-photo-moments-and-media.md:54-55`; CR-146 rows 3, 4, 11; BL-933, BL-961, BL-878, BL-868, BL-1472.
- Way back: restore the old blocker text.
- Status the row takes: `Status: blocked (BL-1001 record, BL-933, BL-961, and the expo-video dependency review through BL-878; Q-PM-2 and Q-PM-3 are answered; counsel's label read gates the flag in a store build, not the code). Mode: agent. Depends on: BL-1001, BL-933, BL-961`
- Founder-only: no.

### CPO-59 BL-973 Printable book (PDF) waits for BL-933 (22 Nov 2026, CPO, CDesO, CLO (font licence evidence))
- Verdict: RULED.
- Ruling: Stays blocked until BL-933 (now ready). The CLO evidence on embedding the fonts must be on the card before done; the word is "Printable", never "print-ready"; no proof-book spend (money is the founder's). The 8.5 by 8.5 page size is a provisional founder default and stays.
- Evidence: `docs/BACKLOG.md` BL-973 scope; BL-933.
- Way back: none needed.
- Status the row takes: `Status: blocked (BL-933, now ready). Mode: agent.`
- Founder-only: no.

### CPrivO-24 BL-980 Someone else speaks: build behind a flag, off in production (22 Nov 2026, CPrivO, CLO, CCO (flag condition), CPO, CTO)
- Verdict: RULED.
- Ruling: The counsel questions (Q45, Q46, Q48, Q54) gate turning the feature on, not writing it; the card says so, and CPO-17 applies the same rule (gates before store submission, not before coding). Ready behind `EXPO_PUBLIC_SIGN_AS_OTHER`, off in every production profile (the g6 production-flags test must list it); the instruction line is a PROPOSED key; no consent record; Find does not index the name. The new synced column's migration file is written but the hosted apply is the founder's. Turning the flag on is a separate FOUNDER-LIMIT later.
- Evidence: `docs/product/prd/09-capture.md:715,767`; `docs/legal/COUNSEL_PACKET.md:80-118`; CPO-17; CR-146 row 11.
- Way back: flag off; revert.
- Status the row takes: `Status: ready (behind EXPO_PUBLIC_SIGN_AS_OTHER, off in production; counsel Q45, Q46, Q48, Q54 and the hosted migration apply gate the flip, not the code). Mode: agent.`
- Founder-only: no, except: the hosted migration apply and the counsel answers are the founder's.

### CDesO-22 BL-984 Accessibility floor: unblock BL-928 first (22 Nov 2026, CDesO, CTO)
- Verdict: RULED.
- Ruling: Stays blocked on BL-928; its own blocker BL-927 is done (#867), so Karma flips BL-928 to ready. The "undo windows through BL-954" item can be split to the end of the row. No Accessibility Nutrition Label is declared until the device walk passes (founder default stands; the walk is the founder's phone, BL-948).
- Evidence: BL-927 (PR #867); `git log 6813ab2f7`.
- Way back: restore the old status line.
- Status the row takes: `Status: blocked (BL-928, which is ready now that BL-927 is done). Mode: agent.`
- Founder-only: no.


**Analytics and consent**

### CPO-60 BL-895 Stories outcome event is deferred (22 Nov 2026, CPO, CDO, CPrivO, CTO)
- Verdict: RULED.
- Ruling: Defer with its parents BL-892 and BL-893. The story intro is not in the app (no `FIRST_RUN_INTRO` switch), NX-40's FD-1 default is "off in production, ships in 1.0.1", and D-163 supersedes D-124 item 3 (the basis this row cites) for the production build only, so the event shape is re-read against BL-1238 before anyone builds it.
- Evidence: `docs/roadmap/next/03-requirements/NX-40-first-run-and-sign-in.md:191`; D-163; `packages/analytics/src/catalog.ts:270`.
- Way back: set ready once BL-893 ships.
- Status the row takes: `Status: deferred (1.0.1 with BL-892 and BL-893; re-read against D-163 and BL-1238 before building). Depends on: BL-893.`
- Founder-only: no.

### CPO-61 BL-892 Story intro scaffolding is deferred (22 Nov 2026, CPO (requirement hygiene and backlog order only), CDesO, CTO)
- Verdict: RULED.
- Ruling: Defer, do not build now. FD-1 is answered by records already in force: D-043 moves the four-story intro to v1.1, plan 17 keeps BL-892 to BL-895 out of the current waves, and NX-40 FD-1's default is off in production. This ruling changes no release content; it records that backlog order already puts it after the current waves. FD-2 stays Karma's earlier ruling.
- Evidence: D-043; `docs/product/prd/17-engineering-project-plan.md:261`; `docs/roadmap/next/03-requirements/NX-40-first-run-and-sign-in.md:155,191-192`.
- Way back: when the founder wants the intro in a build, set the row ready.
- Status the row takes: `Status: deferred (D-043 puts the story intro in v1.1; plan 17 keeps BL-892 to BL-895 out of the current waves; NX-40 FD-1 default is off in production; #764 is merged, so it can start when the founder asks)`
- Founder-only: no.

### CPrivO-25 BL-1252 Deletion coverage for installs that never said yes: split (22 Nov 2026, CPrivO, CDO, CTO; analytics engineer reviews)
- Verdict: RULED.
- Ruling: Split the row. The phone half (a) to (c) needs only BL-1239 (ready) and the analytics-engineer review on `consent.ts`. The function half (d) and (e) waits on BL-1061 (needs BL-1060, a drill on a throwaway PostHog project, an account step, FH-1) and BL-1062 (withdrawal route, waiting on the founder's FD-4, counsel and `approve-migration` through BL-1133). Karma sets BL-1061 and BL-1062 from `proposed` only when their founder steps are named done. Withdrawal wording stays counsel's.
- Evidence: BL-1239, BL-1060, BL-1061, BL-1062, BL-1133; D-163 item 5; `docs/analytics/instrumentation/ENGINEERING-REQUIREMENTS-21nov.md` (ER-A17, FH list).
- Way back: re-merge the two rows.
- Status the row takes: `Status: blocked (BL-1239 for the phone half a to c, which becomes its own ready row once BL-1239 merges; function half d and e moves to a new row blocked on BL-1061 and BL-1062, which wait on founder steps FH-1 and FD-4).`
- Founder-only: no, except: FH-1 and FD-4 are the founder's.

### CPrivO-26 BL-1266 Settings off switch ruled; disclosure stays a placeholder (22 Nov 2026, CPrivO, CDesO, CTO, CLO (counsel on the disclosure))
- Verdict: RULED.
- Ruling: FH-11 (the Settings switch and place) ruled as "Settings, Privacy, one switch that turns usage counts off and on", the row's own scope; it is required by `collect_by_default`. FH-4 (the disclosure wording) is consent text counsel must see: the founder writes it and counsel reads it. The row builds it as a `CONTENT-NEEDED` placeholder, so FH-4 does not block the build, only turning the flag on in production (FH-7, the founder's `eas.json` flip). What blocks the row is BL-1238 (policy-aware gate, `ready`).
- Evidence: `docs/analytics/instrumentation/ENGINEERING-REQUIREMENTS-21nov.md:149,214,222,225`; BL-1238; D-163.
- Way back: remove the switch and the placeholder key.
- Status the row takes: `Status: blocked (BL-1238; the Settings, Privacy switch is ruled, the disclosure stays a CONTENT-NEEDED placeholder until the founder writes it and counsel reads it, FH-4). Mode: agent. Depends on: BL-1238.`
- Founder-only: no, except: FH-4 (disclosure and Decline lines) is the founder's and counsel's; FH-7 is the founder's flip.

### CPrivO-27 BL-1267 Ask sequencer under ask_first: FH-4 is not a dependency (22 Nov 2026, CPrivO, CDO, CTO (analytics engineer))
- Verdict: RULED.
- Ruling: The scope and done-when are pure logic (`analyticsAskDue` false under `collect_by_default`; the two-offer cap holds under `ask_first`; a dismissed sheet is not a yes) and use the existing sheet. New or changed wording stays counsel's and the founder's. The real blocker is BL-1238, which waits on BL-1236, BL-1237 and BL-1239 (all ready).
- Evidence: `docs/analytics/instrumentation/ENGINEERING-REQUIREMENTS-21nov.md:151`; `apps/mobile/src/components/consent/analytics-consent-sheet.tsx`; `apps/mobile/src/lib/analytics/index.ts`.
- Way back: revert the logic.
- Status the row takes: `Status: blocked (BL-1238 and its ready chain BL-1236, BL-1237, BL-1239; FH-4 wording does not gate this row). Mode: agent. Depends on: BL-1238.`
- Founder-only: no.


**Process, release and quality**

### CPO-62 BL-930 NFR rows 42 and 216 reworded to what the hand-offs can meet (22 Nov 2026, CPO, CDesO, CTO, QA lens)
- Verdict: RULED.
- Ruling: Approve the draft in `docs/qa/NS-34-TARGETS.md` (PR #880) and let product write it into `docs/prd/v2/06-nfr.md`. FOUNDER 1: stand-in sample counts (200 taps for Speak, 20 runs for each other design row 1 to 6, each marked stand-in) until the perf markers land. FOUNDER 2: "Review to the Book after Keep" leaves the 900 ms list and is held to the 2,000 ms save hand-off bound. FOUNDER 3: keep the Low Power Mode clause (the card wins) with one shared guard as its own row, through the native module gate BL-878 before `expo-battery`. CONFIRM 2: reading (b): decoration is a loop and follows every clause; progress indicators and the voice-following light are exempt from "opacity only" but stop under Reduce Motion and Low Power Mode. Council-locked under the founder's delegation, not his own words; he can replace them in one line.
- Evidence: `docs/qa/NS-34-TARGETS.md`; `docs/agents/checkins/qa-bl-930.md`; PR #880; `docs/prd/v2/06-nfr.md` section 0; CPO-1 (precedent).
- Way back: revert the two rows in `06-nfr.md`.
- Status the row takes: `Status: ready (council rulings on CONFIRM 2 and FOUNDER 1 to 3 recorded as a CPO ruling; an interactive session as product edits docs/prd/v2/06-nfr.md; the Low Power Mode guard is a separate row behind BL-878). Mode: pair.`
- Founder-only: no.

### CPO-63 BL-971 Quick capture doorways stay blocked on BL-972 (22 Nov 2026, CPO, CAIO and speech, CTO)
- Verdict: RULED.
- Ruling: Keep blocked: BL-972 (hands-free spike) waits on BL-935 (pilot kit), which is `ready`. Doorways stay off until each works on that phone. Suggest the dispatcher starts BL-935. No founder item.
- Evidence: BL-972, BL-935.
- Way back: none needed.
- Status the row takes: `Status: blocked (BL-972 spike, which waits on BL-935, which is ready). Mode: agent. Depends on: BL-972.`
- Founder-only: no.



**Design backlog exec review, 22 Nov 2026**

Source: Karma's exec review of the design backlog recommendations, recorded in `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged; #1621 and persona fold-in #1628 are the inputs). Every legal judgment below is a role's view, not advice: counsel must confirm. In every entry below the Door, Way back and Revisit when lines are derived by Karma, because the review did not state them (copy text and gates are two-way before release). Why lines are Karma's reasoning from the review unless they cite a source. Any default that says "derived by Karma" is Karma's, not the review's. Founder items are listed as FOUNDER and are not rulings. Latest spec: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 and the design ticket section of `docs/BACKLOG.md`. Cross-cutting rule from the review: defaults that edit legal-adjacent text need a founder merge (D-125 item 5), and silence means the status quo text ships.

Source items not recorded here (see DESIGN-BACKLOG.md section 13): BL-1801, BL-1767, BL-1787, the BL-1730, BL-1731 and BL-1829 defaults, BL-1807 routing, device gate tiering (BL-1700), and the NEEDS EVIDENCE rows.

### CPO-64 BL-1724 Home Plus line: the plain version (22 Nov 2026, CPO and CBO via the exec review session)
- Verdict: RULED.
- Ruling: BL-1724 uses the shortest line already true: the letter waits, nothing is lost. No price, no link, no urgency. This replaces the earlier default "content rewords to a quiet pointer". Counsel must confirm that "nothing is lost" is true; no question number is assigned for BL-1724 (Q40 belongs to BL-1806, the free-slot Delete line). The evidence is UNVERIFIED here.
- Why: the CPO and CBO ruled the plain version (review). That a pointer naming Plus or linking is a different line is Karma's summary.
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged). Source for "nothing is lost": UNVERIFIED.
- Door: two-way (derived by Karma)
- Way back: restore the earlier default line (derived by Karma).
- Revisit when: the 27 Nov 2026 gate passes or counsel answers (derived by Karma).
- Founder-only: the amended wording ships only after a founder merge (D-125 item 5). On silence, the status quo text ships. FOUNDER: a pointer that names Plus or links to it. Default: the plain line, after his merge.

### CPO-65 Drop order for the pre-1 Dec cut (22 Nov 2026, CPO and CDesO via the exec review session)
- Verdict: RULED.
- Ruling: BL-1716 (offline) is dropped first. BL-1717 (interruptions) stays, as a short device script in the SE 3 sitting. BL-1790 (Back at AX5) moves out of the drop order. BL-1709 stays ahead of BL-1723 and BL-1720.
- Why: ordering is the CPO's and CDesO's call (review). That Back is a way out of a screen is Karma's reasoning.
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: reorder the rows in `docs/BACKLOG.md` (derived by Karma).
- Revisit when: the 27 Nov 2026 gate passes (derived by Karma).
- Founder-only: no. NEEDS EVIDENCE: who runs the SE 3 sitting (no operator is named; CTO and qa). FOUNDER: the SE 3 operator and the 27 Nov gate date. No default stated by the review.

### CDesO-23 BL-1798 Large print floor in Read together (22 Nov 2026, CDesO via the exec review session)
- Verdict: RULED.
- Ruling: Build a floor in Read together now. A floor raises readable size and caps nothing, so D-027 is untouched. Build after BL-1791, size it at the sitting, and offer the Aa sheet in Read together. Off the founder list.
- Why: the CDesO rules it (review); a floor is not a cap.
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged); D-027.
- Door: two-way (derived by Karma)
- Way back: remove the floor, one PR (derived by Karma).
- Revisit when: the sitting shows the size is wrong (derived by Karma).
- Founder-only: no.

### CDesO-24 BL-1796 Take-start cue (22 Nov 2026, CDesO and CPO via the exec review session)
- Verdict: RULED.
- Ruling: A VoiceOver announcement "Listening" that finishes before the mic opens, plus the existing haptic. No sound while the mic is live. Tone stays a Paper sounds option. First 1.0.x.
- Why: CDesO and CPO ruled it (review). The reason a live-mic sound would be recorded is Karma's inference.
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: remove the announcement, one PR (derived by Karma).
- Revisit when: a device test shows the announcement is late or clipped (derived by Karma).
- Founder-only: no.

### CDesO-25 BL-1836 Magic Tap and the safe stop (22 Nov 2026, CDesO via the exec review session)
- Verdict: RULED.
- Ruling: Magic Tap pauses and resumes, which resolves the conflict with BL-1796. Finish stays a visible button. No Voice Control claim until tested.
- Why: the CDesO rules it (review).
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: remove the Magic Tap handler, one PR (derived by Karma).
- Revisit when: Voice Control is tested on a device (derived by Karma).
- Founder-only: "Long silence ends the take" is a new capture feature, not a ruling. FOUNDER with CAIO and CPO. No default stated by the review.

### CLO-22 BL-1805 "For good" held out of new builds (22 Nov 2026, CLO via the exec review session; not counsel)
- Verdict: RULED.
- Ruling: hold "for good" on Erase now out of new builds. The replacement is the Erase everything line "Erased from this phone. Backups and exports you already saved are not changed." The wording is the founder's, and the trace of the server copy is open (NEEDS EVIDENCE: mobile and data; does Erase now remove the server copy on a signed-in phone). Counsel Q51 must confirm.
- Why: the CLO rules the hold (review). That "for good" may overpromise is Karma's reasoning.
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: restore the old words (derived by Karma).
- Revisit when: counsel answers Q51 or the server-copy trace returns (derived by Karma).
- Founder-only: the wording. The amended line ships only after a founder merge (D-125 item 5); on silence, the status quo text ships.

### CLO-23 BL-1799 "Each letter signed" held out of the listing (22 Nov 2026, CLO via the exec review session; not counsel)
- Verdict: RULED.
- Ruling: fail-closed hold on the phrase "each one signed" in store text about the first build. The line at `docs/store/app-store.md:136` ("Both parents read every letter in the book, each one signed.", under WHAT A CO-PARENT SEES) must not ship. Correct `packages/content/BRAND.md` line 40, which also says co-parent "at v1.0", false for the first build; counsel must confirm that it is false for the first build.
- Why: the CLO rules the hold (review). That the first build has no sharing is D-121 and D-126.
- Evidence: `docs/store/app-store.md:136`; `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: lift the hold in one line here (derived by Karma).
- Revisit when: counsel answers or the 27 Nov 2026 gate passes (derived by Karma).
- Founder-only: the wording. The amended text and the BRAND.md fix ship only after a founder merge (D-125 item 5); on silence, the status quo text ships.

### CLO-24 Invite residue: fail closed if the site is unlaunched (22 Nov 2026, CLO via the exec review session; not counsel)
- Verdict: RULED.
- Ruling: for the whole invite residue (the /j page, the share message, the website film and the "in an update" text): if the site is unlaunched, fail-closed hold. If it is live, qualify or remove the line. CMO and CLO share it. BL-1821 and BL-1832 to 1834 leave the pre-1 Dec list (alpha only). Counsel must confirm.
- Why: invites in a mixed build are mostly settled by D-126, D-161 and D-162 (review).
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: lift the hold or restore the line (derived by Karma).
- Revisit when: the site's launch state is confirmed (derived by Karma).
- Founder-only: no. NEEDS EVIDENCE: whether the site is live.

### CPrivO-28 BL-1742 Photos primer swipe-down (22 Nov 2026, CPO and CPrivO via the exec review session)
- Verdict: RULED, pending founder confirmation.
- Ruling: swipe-down persists nothing, never triggers Apple's alert, and never returns unprompted. Re-entry is a tap on the door row. Only "Not now" records a decline. Counsel must confirm.
- Why: CPO and CPrivO ruled it (review). It edits NS-53-G05 and NS-53-R73, so the founder confirms.
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: restore the previous swipe behaviour (derived by Karma).
- Revisit when: counsel clears the primer lines (derived by Karma).
- Founder-only: FOUNDER: confirm the edit to NS-53-G05 and NS-53-R73. No default stated by the review.

### CPrivO-29 Photo flag: five gates (22 Nov 2026, CPrivO via the exec review session)
- Verdict: RULED.
- Ruling: the photo flag turns on only when all five hold: (1) counsel-cleared primer lines; (2) a network-egress test showing no library data leaves the phone; (3) photos out of sync and out of our backup; (4) Export includes pictures or says it does not (BL-1830); (5) device rows. This replaces the earlier gate "words cleared".
- Why: the CPrivO rules the gate list (review).
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: change the gate list in one line here (derived by Karma).
- Revisit when: the 27 Nov 2026 gate passes or counsel answers (derived by Karma).
- Founder-only: the flag date. FOUNDER: the date, with one explicit line that if the gates are not closed by then, 1.0 ships with the library read off (this shrinks 1.0 against CPO-17 and D-165). Default: the flag stays off.

### CPrivO-30 BL-1830 Export writes photos as null: fail closed (22 Nov 2026, CPrivO via the exec review session)
- Verdict: RULED.
- Ruling: no photo flag while Export says "everything" and writes photos as null. Counsel must confirm.
- Why: the CPrivO's rule (review); it is also gate 4 of CPrivO-29.
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: lift the hold once Export includes pictures or says it does not (derived by Karma).
- Revisit when: BL-1830 merges (derived by Karma).
- Founder-only: no.

### CPrivO-31 Label wording: "we do not receive" (22 Nov 2026, CPrivO via the exec review session)
- Verdict: RULED, conditional.
- Ruling: no sentence says "nothing leaves the phone". The wording "we do not receive" is allowed only if the network-egress test (CPrivO-29 gate 2) and the geocoder check pass. NEEDS EVIDENCE: whether reverse geocoding for Moments places sends coordinates to Apple (CISO, mobile). Counsel must confirm.
- Why: the CPrivO's wording rule (review); the CISO and mobile check on the geocoder is named in the review. Any other seat is proposed. The host also sees the IP address (Q12).
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: revert the wording (derived by Karma).
- Revisit when: the egress test and geocoder check return, or counsel answers (derived by Karma).
- Founder-only: no.

### CCO-18 BL-1835 Age gate left as is (22 Nov 2026, CPrivO and CLO via the exec review session, CCO seat proposed; not counsel)
- Verdict: RULED.
- Ruling: leave the age gate as built. No "Are you sure?" after No. The 24-hour stop stays (D-026; LEGAL-REQ-002, as in CCO-17). Fact about the build (D-026): the age stop is local only, so reinstalling the app clears it. This goes into the register, and counsel Q45 and Q46 decide whether that is acceptable; this is not a ruling. Counsel must confirm the ruling.
- Why: the review names CPrivO, CLO and counsel for this item; the CCO seat is proposed, as is any other seat not in the source. Consistent with CCO-17 (Karma's note).
- Evidence: `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-002); `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` section 13 (PR #1631, once merged).
- Door: two-way (derived by Karma)
- Way back: counsel can add a confirm later (derived by Karma).
- Revisit when: counsel answers Q45 and Q46 (derived by Karma).
- Founder-only: no.

### CCO-19 PR #1676 sync_pull and sync_books withhold content without consent: passes the compliance fence (CCO-review tier) for merge into develop (23 Nov 2026, CCO via Karma's session on the founder's explicit go; not counsel)
- Ruling: PR #1676 passes the compliance fence for merge into `develop`. Checklist read at head 2f8c875b: no new personal data is collected; no user-facing promise changed; no new door path; nothing stores or logs an IP, birth date, age range, name or user content. The closed `sync_books` answer keeps the child's name and each member's `role`, `is_me` and `signs_as`, so the account-deletion screen can tell "stays with the co-parent" from "deleted with the account" (T7-23). Both independent reviews passed it; the security-lens Review B judged that shape acceptable.
- Why the fence caught it: the diff names `policy_acceptances` and `record_policy_act` only in `supabase/tests/sync_pull_consent.test.mjs`, in the lines that withdraw and re-accept consent. The migration replaces `sync_pull` and `sync_books` and changes neither that table nor that function (read in the merged diff at 29ea7945).
- Evidence: `supabase/migrations/20261123100000_sync_pull_consent_gate.sql`; `supabase/tests/sync_pull_consent.test.mjs`; `apps/mobile/test/sync-two-phone.test.ts`; `packages/api/src/server/sync.ts`; `supabase/APPLY.md` File 46; reviews at 2f8c875b (both PASS); the CCO comment on the PR.
- Way back: a new migration that tightens the closed shape (`other_parent_signs_as` plus a contributor count, BL-1920), never an edit of the applied one.
- Open: counsel has not read this call. It is a delegated default until counsel confirms; BL-1920 asks counsel's reading.
- Signed: Chief Compliance Officer (Claude role, not counsel)

### FOUNDER items from this review (not rulings; his under CR-73)
Silence on 27 Nov 2026 means the status quo text (D-125 item 5). The review dates only that silence rule; the gate date itself is a founder item.
1. First-run order and the public timing promise, after the BL-1705 reading. Default: steps stay, promise reworded to speaking-time.
2. Public wording: handed-over signature line and BRAND fix, free-slot line (BL-1806), free list (BL-1767), synthetic voice line (with counsel; a true line ships, not silence), sign-in line (BL-1803), Erase line, 90-day pledge. Default: the amended defaults, each only after his merge.
3. Photo flag date (see CPrivO-29). Default: the flag stays off.
4. The SE 3 operator, the 27 Nov gate date, the counsel engagement date. If counsel is not engaged, every "wait for counsel" default is open-ended until a date is named.
5. Signed-in wipe (BL-1804, deferred; an L build, not for 1 Dec), long-silence stop, tappable "From Mama" option (default to owner, typed name, fixed after Keep; as an option, not a default). App-lock grace: offer on first turn-on, default one minute (CISO check).
