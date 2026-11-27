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

#### CR-149 correction 1 (23 Nov 2026, drafted by `ops` under BL-1569 for Karma to approve; PROPOSED until Karma signs)
- This block is added and the rule lines above are left as written, because this log only grows (`docs/agents/append-only.json`). It does not decide anything: Karma and the exec team rule on it.
- Reading of rule 4: "a CR-70 path" means the CR-70 founder-only path list as CR-73 narrowed it (`docs/agents/cto/RULINGS.md`, "### CR-70" and "### CR-73"), plus every path with its own entry in `.github/CODEOWNERS` (not the `*` catch-all line, which covers the whole repo). Both lists are as amended by CR-176. Where the two differ, CODEOWNERS wins, as CR-70 says. The shorter list in parentheses in rule 4 is a summary and not the whole list.
- CODEOWNERS paths on 23 Nov 2026, read from `.github/CODEOWNERS` on `develop` that day: `packages/core/src/verify.ts`, `packages/core/src/meaning.ts`, `packages/core/src/types.ts`, `packages/core/src/pipeline.ts`, `CLAUDE.md`, `packages/core/src/plan.ts`, `packages/content/`, `packages/brand/`, `packages/analytics/src/`, `docs/analytics/`, `supabase/migrations/`, `supabase/tests/`, `agents/`, `.claude/`, `scripts/agents/`, `docs/agents/`, `compliance/` and `.github/`. If the file has changed since, the file wins over this line.
- Example: a PR that changes `packages/core/src/verify.ts` (the constitution's gate) is not named in the parenthetical list of rule 4, and it is still not eligible for the relaxation, because CODEOWNERS names it.
- `scripts/agents/merge-queue.mjs` does not read CODEOWNERS today. BL-1570 adds the checks as pure functions with no change to any verdict, and BL-1571 wires them in behind a flag that is off by default. Until both land, Karma applies this reading by hand when a PR touches a CODEOWNERS path. Once they land, the script reads the list from CODEOWNERS at run time, so a path added to CODEOWNERS later is covered without a change to this log.
- What we learned on 23 Nov: a PR that changes `docs/agents/**` is a CR-70 path and so cannot use the relaxed path, and develop's churn in `docs/agents/BOARD.md` and `docs/agents/CLAIMS.md` sent such a PR back to NEEDS-UPDATE twice in one afternoon (#1745 needed two develop merges, each voiding both reviews; the only files develop changed under `docs/agents/` in that time were `BOARD.md` and `CLAIMS.md`, with no overlap with the PR's one line).
- PROPOSED, for Karma and the exec team to rule on (not decided here): rule 4's relaxation might consider a `docs/agents/**` PR whose only overlap with develop is the hot append-only files (`BOARD.md`, `CLAIMS.md`), since those merge cleanly by design. It would still need the security-lens review. Whether to do this, and for which files, is theirs to decide.
- Signed: none yet. Karma signs this block, or rules otherwise.

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
- Ruling: PR #1676 passes the compliance fence for merge into `develop`. The approval is bound to head 2f8c875b and would be void on any new push; the merged sha is 29ea7945. The founder's go on 23 Nov covered posting the line and merging; it was not a ruling on the child-name question. Checklist read at head 2f8c875b: no new personal data is collected; no user-facing promise changed; no new door path; nothing stores or logs an IP, birth date, age range, name or user content. The closed `sync_books` answer keeps the child's name and each member's `role`, `is_me` and `signs_as`, so the account-deletion screen can tell "stays with the co-parent" from "deleted with the account" (T7-23).
- Why the fence caught it: the diff names `policy_acceptances` and `record_policy_act` only in `supabase/tests/sync_pull_consent.test.mjs`, in the lines that withdraw and re-accept consent. The migration replaces `sync_pull` and `sync_books` (`create or replace function`) and also restates their execute grants (revoke from public and anon, grant to authenticated); it changes neither that table nor that function (read in the merged diff at 29ea7945).
- Evidence: `supabase/migrations/20261123100000_sync_pull_consent_gate.sql`; `supabase/tests/sync_pull_consent.test.mjs`; `apps/mobile/test/sync-two-phone.test.ts`; `packages/api/src/server/sync.ts`; `supabase/APPLY.md` File 46; both independent reviews at 2f8c875b passed. What the security-lens Review B said: at 2f8c875b it confirmed the closed shape is unchanged from 0ad7ff84 and that the gate fails closed; the earlier Review B at 0ad7ff84 judged the name and members acceptable because only a current member, who already knows them, receives them; the CCO comment on the PR.
- Departs from `compliance/README.md`: that file says the CCO does not approve until counsel's answer or the founder's recorded default exists. This ruling rests on a delegated default with no founder entry in `docs/DECISIONS.md`. It holds only until counsel answers, and the delegated default is Karma's under CR-176.
- Door: two-way (derived by Karma)
- Way back: a new migration, never an edit of the applied one. BL-1920's tighter shape (`other_parent_signs_as` plus a contributor count) narrows what is returned; it does not reverse the gate.
- Open: counsel has not read this call; BL-1920 asks counsel's reading. Counsel should also see that each member's `signs_as` is the co-parent's own sign-off (a second person's data). The recipient is a member of the book, so the open question is presenting it after consent is withdrawn, not first disclosure.
- Revisit when: counsel answers BL-1920.
- Founder-only: no.
- Signed: Chief Compliance Officer (Claude role, not counsel)

### FOUNDER items from this review (not rulings; his under CR-73)
Silence on 27 Nov 2026 means the status quo text (D-125 item 5). The review dates only that silence rule; the gate date itself is a founder item.
1. First-run order and the public timing promise, after the BL-1705 reading. Default: steps stay, promise reworded to speaking-time.
2. Public wording: handed-over signature line and BRAND fix, free-slot line (BL-1806), free list (BL-1767), synthetic voice line (with counsel; a true line ships, not silence), sign-in line (BL-1803), Erase line, 90-day pledge. Default: the amended defaults, each only after his merge.
3. Photo flag date (see CPrivO-29). Default: the flag stays off.
4. The SE 3 operator, the 27 Nov gate date, the counsel engagement date. If counsel is not engaged, every "wait for counsel" default is open-ended until a date is named.
5. Signed-in wipe (BL-1804, deferred; an L build, not for 1 Dec), long-silence stop, tappable "From Mama" option (default to owner, typed name, fixed after Keep; as an option, not a default). App-lock grace: offer on first turn-on, default one minute (CISO check).

### CLO-2 Terms 4.0.0, clauses 13.1 and 14.6: founder approval recorded, conditions before publication (31 Oct 2026, CLO via the platform session; not legal advice)
- Question: the founder approved Terms 13.1 (co-parent writing leaves the free-for-as-long-as-we-operate list) and 14.6 (app reminders name no price; future reminder emails described as "not sent yet") on 31 Oct and asked the CLO and CCO to align. Does anything have to change before merge?
- Tier and type: T1; clear. Consulted: CCO (CCO-3 below). CPrivO not needed: no data terms changed.
- Options considered: revert both clauses; merge as drafted; merge as drafted with conditions before publication
- Ruling: aligned. Merged in #447 as `draft-for-counsel` on the founder's approval (D-125 item 5). Before any of this text is published or binds a user: (1) the sentence "Apple's receipt shows the amount you were charged" (Terms 14.6 and the Subscription Terms) is checked on the TestFlight sandbox pass, or cut; (2) counsel reads 13.1 under COUNSEL_PACKET Q14, because 13.3 makes whatever 13.1 lists permanent for existing users; (3) the reminder emails in 14.6 never start until 14.6 is rewritten, as the clause itself says.
- Why: the narrower 13.1 list is less open-ended exposure in the founder's own name than the old "unlimited free writing" promise, which D-082 already ended. 14.6 had promised a price in app reminders that D-083 keeps out, so the old text was untrue. An unpublished draft is a two-way door; publication is not.
- Door: two-way until published
- Way back: restore the co-parent line in 13.1, or cut 14.6's email paragraph to "We do not email you about Plus yet" (`docs/legal/CHANGES-2026-10-31.md`)
- Counsel needed: yes, Q14 and Q8, before publication
- Revisit when: counsel answers Q14 or Q8, or the sandbox pass runs.

### CCO-3 Approving Terms 14.6 does not close the California renewal-notice gap for build 1 (31 Oct 2026, CCO via the platform session; not counsel)
- Question: with 14.6 approved, does the first store build meet California's automatic renewal law?
- Tier and type: T1 for the record; the fix is FOUNDER (it changes what the release shows), and he has approved route (i)
- Rule: Cal. Bus. & Prof. Code 17602 (2025 code, last amended Stats. 2024 ch. 515, read 31 Oct 2026 via https://law.justia.com/codes/california/code-bpc/division-7/part-3/chapter-1/article-9/section-17602/; leginfo did not load). (b)(1) covers a free trial "lasting for more than 31 days"; (b)(2) an initial term "of one year or longer"; (h)(1) an annual reminder; (a)(3) an acknowledgment with the offer terms. Applies: Unknown, counsel must confirm, chiefly whether the duty falls on us while Apple is merchant of record.
- Facts: D-121 ships Plus in build 1; `plus.annual` has a 2-month free offer and a one-year term (StoreKit file). No notice from us names the amount (D-083; no email under D-121). Whether Apple's messages carry it in the windows is Unverified.
- Evidence: none that we comply. Status: Gap.
- Ruling: register row stays Gap; the submission gate (1 Dec) holds until route (i) is built and checked. The founder approved this PR on 21 Nov 2026 (his words in the Claude chat: "Approve #454, #1387, #1408, #1410 and #1416.", recorded by Karma on the PR), and Karma reads that as approval as written, so route (i) is chosen, not defaulted: a narrow D-083 exception so the long-trial reminder, the annual reminder, the in-app note and the purchase confirmation show StoreKit's `Product.displayPrice` and period (the amount comes from Apple, never typed), then Terms 14.6 changes once more. Route (ii), counsel's written view that Apple's messages are enough, was the alternative and is not taken. If he meant route (ii), he says so and this ruling changes. Counsel still confirms whether the duty falls on us (Q8).
- Debate: CLO objected that D-083 kept prices out of app copy so a typed price can never drift. Answer: `displayPrice` is Apple's localized string for that buyer, so nothing is typed and nothing can drift. Route (ii) waits on counsel, who is not yet engaged (W0-13).
- Door: two-way
- Revisit when: counsel answers Q8, or the founder says he meant route (ii).

### CCO-20 PR #1463 age gate way back holds outside the 24h window: passes the compliance fence (CCO-review tier) for merge into develop (23 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: RULED.
- Ruling: `answeredByMistake` returns at once unless the 24 hours have passed (`windowPassed`). It only narrows when the way back works. It cannot clear a stop or pass the gate. The 18+ gate, the 24-hour closure (D-026; LEGAL-REQ-002; CCO-17, CCO-18) and the stored data are unchanged. No new data, no copy, no promise changes.
- Evidence: `apps/mobile/src/components/gate/age-gate-screen.tsx:119-131`; `apps/mobile/src/lib/age-gate.logic.ts:35-42`; `apps/mobile/src/lib/age-gate.ts:59`; `apps/mobile/test/age-gate-screen.test.ts:106-120` (source-regex pins: they prove the guard text and order, not runtime behaviour). CCO review at f09bd3e6869751cdc25eeca07591302d1ea11b3a; approval line posted on PR #1463.
- Way back: revert one line and its two tests.
- Founder-only: no. Counsel must confirm the 24-hour way back itself (packet Q5, Q45, Q46); not decided here. Exec-team counsel has not read this call; it is a delegated default until counsel confirms.
- Signed: Chief Compliance Officer (Claude role, not counsel)

### Batch note: the 24 Nov 2026 council batch (decision pack D-1 to D-33)
The entries in this batch (three stacked PRs) record each role's own ruling on the decision pack, in the role's words. Karma's rulings that cite them are CR-187 to CR-201 in `docs/agents/cto/RULINGS.md`; where Karma reconciled two roles, the CR entry says so and rules. Every role is a Claude role, not a licensed professional. Under D-172 "counsel must confirm" means the exec team's own read; no licensed lawyer has read any of it. Facts not read this session carry the role's UNVERIFIED mark.

### CPO-72 Interface calls BL-371, BL-376, BL-396, BL-1836 (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED (CPO lines only; the CDesO owns BL-428, BL-454, BL-1620, BL-1653, BL-2020 and the CPO concurs).
- Ruling: BL-371 keeps Undo as the toast per S36 and the row's Done-when is edited; the person has the toast and a 30-day Recently deleted shelf behind it. BL-376 keeps "no Record again on a no-speech letter". BL-396 retires the root large-title clause for 1.0. BL-1836: Magic Tap pauses and resumes (CDesO-25); "long silence ends the take" is NOT wanted in 1.0. The CPO reads this as a new auto-stop in capture, not the stop D-169 item 5 keeps ("the long-silence stop as specced"); CAIO to confirm they are different things. No new customer words unless content brings them and `rules.test.ts` plus WRITING-GUIDE.md pass; fix the copy, not the test; the absence line must not count gaps; the owner "founder" on BL-1620 is void under CR-176.
- Evidence: BACKLOG BL-371, BL-376, BL-396, BL-1836 rows; `docs/design/EXPERIENCE_PASS_2026-10.md` lines 962-969 (S36); D-169 item 5. Not read: WRITING-GUIDE.md (UNVERIFIED for the word calls).
- Door: two-way. Condition: every new or changed line passes `npm test` in `packages/content`. Challenger: CDesO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-73 Consent-record deferrals BL-573, BL-577, BL-579, BL-580 (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED.
- Ruling: close BL-579 as moot (the agree line at sign-in, BL-575, covers it; first run has no account to attach a record to). Build the dedicated re-consent sheet (BL-573) in 1.0.1; testers can re-accept through the existing sheet. Supersede or shrink BL-580 to the signed-in older account (the root age gate runs before sign-in). Re-point BL-1166, BL-1167, BL-1339, BL-1340 and BL-1364 away from BL-579 to the built BL-575 and BL-577, and lift the CR-47 deferral of BL-577 so the consent builder is the single path: records written in a servers-on build cannot be fixed later. The 9 Nov go/no-go was never recorded, so the trigger is passed by D-157 and D-170.
- Evidence: BACKLOG lines 2676-2750 and 6089-6745; CR-47; D-157. Not read: `consent.ts`, `machine.logic.ts`; the claim that BL-577 is built is UNVERIFIED.
- Door: two-way. Way back: reopen BL-579 if the exec read of the Terms finds a pre-account acceptance is needed.
- Condition: CLO and CPrivO confirm no Terms promise says "before any account". Counsel must confirm; no licensed lawyer has read this. Challenger: CPrivO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-74 Erase everything resets the free count; delete-account intro, product view (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED for the product lines; the legal text and the CLO-22 hold are the CLO's with CCO and CPrivO.
- Ruling: that Erase everything resets the free count is NOT A QUESTION: D-083, D-103 and D-144 item 1 already say so. The open piece is one plain sentence in Terms 8.1, which today says the count is kept so reinstalling does not reset it and is silent on Erase. The Erase now line drops "for good": "Erased from this phone. Backups and exports you already saved are not changed." Lift the CLO-22 hold once the CLO confirms the signed-in path (BL-1854) removes only this phone's copy and says so. Keep "We hold no copy." and "Nothing is sent anywhere." only where `localDeletionAllowed`. Delete-account intro: adopt the CDO-6 sentence (another parent's letters are not deleted with the book; the name and dates are kept only to label them), matching D-116. Never "your letters stay yours", never "nothing is left".
- Evidence: D-083, D-103, D-144 item 1, D-116; D-169 item 5; CLO-22; `packages/content/src/strings.en.ts` lines 964, 984-990, 1505. UNVERIFIED: the pack's claim that the Q51, Q32 and Q48 answers are recorded; BL-979 stays blocked until they are found.
- Door: wording two-way; published Terms or policy text is slower to retract. Condition: the words pass `rules.test.ts`; counsel must confirm (exec read under D-172). Challenger: CLO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-75 Moments and photo behaviour, six rows (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED for BL-1742, BL-1472, BL-1744, BL-1487, BL-1491; BL-1951 is NOT A QUESTION (the alternative is CANNOT RULE).
- Ruling: BL-1742: confirm CPrivO-28; swipe down on the Photos primer persists nothing, only "Not now" records a decline. BL-1951: keep the words as typed when a photo commit ends failed, unreadable or no_space, with one calm line from `packages/content`; CANNOT RULE "drop the words with the picture" (the constitution allows removal only through the edit types in `packages/core/src/types.ts`; D-116). BL-1472 (O-62): the first Moments door ships with one picture; the six-picture set is deferred. BL-1744 (O-22): a Moments link or notification lands on Moments at scroll 0, For you, nothing highlighted; evening lands on Home. BL-1487: drop the lens thumb frame on a load error if the card height does not jump (CONFORMANCE F-27). BL-1491: home place is one value per book id (R249); edit 17.1 and the MomentsFile type before the file ships.
- Evidence: BACKLOG rows for the six; CPrivO-28, CPO-58; `docs/design/moments-motion-spec.md` line 100; `docs/product/prd/28-moments-tab.md` R249, O-62; CONFORMANCE-21nov.md line 171.
- Door: two-way (all dark behind flags); the BL-1491 file shape is the one hard-to-reverse part. Condition: all of it stays off in every store profile (D-11). Challenger: CPrivO, CDesO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-76 Store-cut gate list for sign-in and abuse rows, CPO view (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED as the product position; the CISO leads and rules the control and the CPO does not override a security call.
- Ruling: gate the store cut on BL-595's server-side per-address wrong-code limit, BL-581 (stray accounts) and BL-583. Defer BL-1041 (Turnstile) to 1.0.1 with named triggers. Record the CR-47 trigger as passed (D-157, D-170). Supersede BL-596 (the alpha allowlist is moot, D-170) and fold its CAPTCHA part and BL-248 into a later row. BL-587: delete the alpha staging data and say so in DECISIONS.md.
- Why: BL-595 reads "8-digit codes plus CAPTCHA on the code request, or a server-side limit on wrong codes per address"; CAPTCHA is one of two ways, not a second requirement. Turnstile is a new subprocessor and a label change, about 380 lines across 10 files, and breaks every email sign-in if switched on before the code exists. Strongest counter-argument: a bot that burns the 100 emails an hour blocks a new parent on launch day. Trigger to bring Turnstile forward: observed email-budget exhaustion or a bot pattern in the first week, with the Resend custom SMTP limit raised first. If the CISO reads the exposure as worse, the CISO's call stands.
- Evidence: BACKLOG lines 2776-2795, 2755, 2916, 4416; AUTH_SETTINGS.md rows 4, 5, 16, 17; D-157, D-170; CR-184. Not read: BL-583, BL-600 (UNVERIFIED).
- Door: mostly two-way; adding a subprocessor changes the label and is slow to undo. Condition: the console values are a physical row in `docs/release/FOUNDER_QUEUE.md`. Challenger: CISO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-77 Product-accuracy read of five legal-text and classification edits (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED as the CPO's read; the CLO, CCO and CPrivO accept legal text.
- Ruling: BL-1993: replace "waits on your phone" in Terms 8.1 with the current held-letter meaning ("Waiting to be kept." in the app), no other 8.1 change; with sync a held letter is no longer only on the phone. BL-1994: add the two L2 rows to the view table. BL-1239: accept the existing DATA_CLASSIFICATION rows plus one row for the install id and SDK queue; analytics stays off in production (D-163, CR-186). BL-527: accept LNG-04, LNG-09, LNG-12 and LNG-18 and record that no licensed lawyer has read them. BL-1188: say in plain words that an issued access token lives out its 15 minutes after a session ends; no shorter lifetime for 1.0.
- Check: "We only fix small slips, like an um, a repeat or a misheard word, and mark each one" is true to the verifier: `EditType` has `stt_fix` whose replacement must be a dictionary term. If `stt_fix` ever widens, the sentence changes first.
- Evidence: BACKLOG 10618, 10627, 6223, 2524, 5668; `docs/legal/terms-of-service.md` line 98; `packages/core/src/types.ts` lines 12-19; AUTH_SETTINGS row 8. Not read: DATA_CLASSIFICATION rows 802-805, APPLY.md File 36 (UNVERIFIED).
- Door: two-way before publish. Condition: counsel must confirm; the CISO reads the BL-1188 lifetime claim. Challenger: CLO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-78 No phone number and no SMS in the first store build (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED for the first store build; NEEDS EVIDENCE for anything after.
- Ruling: no phone number and no SMS in the first store build, and no phone data collected anywhere. LEGAL-REQ-012 stands unchanged; BL-1909 does not relax it now. BL-1898 (vendor, sender, spend cap) is deferred. BL-1896 stays open until each price and limit is read from a vendor page. BL-1897 and the BL-1899 drafts may proceed because they collect nothing. The CPO did not adopt "no SMS in 1.0 or 1.0.x" and did not adopt "approve an optional field now"; the CPO's reason is that the recorded founder direction prefers a verified phone in future, so a ban across 1.0.x would override it without evidence.
- Strongest counter-argument: accounts are on (D-170) and sender registration has a long lead time. Answer: the long-lead rows need no relaxation and start now; once numbers are stored the door is one-way.
- Evidence: `docs/legal/ENGINEERING_REQUIREMENTS.md` line 117; `docs/research/sms-phone-auth-spike.md` lines 14-15 (no vendor price, country list, fraud tool or retention read); PRD 29; CR-180; D-171. Whether a phone number is "directly relevant to the core functionality" (Apple 5.1.1(v)) is the CCO's; counsel must confirm.
- Door: two-way while no number is stored; one-way once stored. Condition: nothing in the first build mentions a phone number. Challenger: CISO, with the CFO on any cap.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-79 Photo library read stays off for 1.0 (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: NOT A QUESTION (D-169 item 3); recorded now.
- Ruling: 1.0 ships with the photo library read off. The gates cannot close in three days: gate 5 and the G1a-L spike need a device (BL-1434 is Mode pair), the egress test is not built, and Export still writes photos as null. Keep the flag dark (no `EXPO_PUBLIC_PHOTOS` or MOMENTS entry in `apps/mobile/eas.json`). Build only Export fail-closed (CPrivO-30). Close the four primer lines as PROPOSED under PRIV-R21 using "we do not receive", never "nothing leaves the phone". Remove the unused photo strings and fix the four store docs (BL-1858). This shrinks 1.0 against CPO-17 item 2, and follows from CPO-17 itself.
- Evidence: D-169 item 3; CPrivO-29; `apps/mobile/src/lib/photos/flag.ts`; CPO-17. UNVERIFIED: whether Export fail-closed is merged.
- Door: two-way (flag). Condition: privacy-policy line 45 and `pages.en.ts` photo lines stay true only while the flag is off; the D-12 Moments legal drafts stay unpublished for the same reason.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-80 Moments legal drafts, PR body only (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED.
- Ruling: draft the Moments Privacy line, the Terms and Privacy lines for pictures and the `en.plus.legal` position in PR bodies now, and publish nothing until BL-1434 G1a-L reports and the flags are decided. Approve the `moments.json` wipe-list line and the two DATA_CLASSIFICATION 4.6 / data-policy 4.4 rows, and merge them with BL-1493 part 1: the wipe-list line closes a real gap (DATA-REQ-023 names no device files). Leave the `en.plus.legal` key unchanged and record that; add "dated, key retired" notes to the stale dated docs now.
- Evidence: BACKLOG 7020, 8168, 8364, 7644; `docs/product/prd/28-moments-tab.md` line 934. Not read: `DELETION_AND_EXPORT_SPEC.md` line 254; the `en.plus.legal` key was not found by grep (UNVERIFIED).
- Door: two-way (nothing published). Condition: counsel must confirm the wording; the wipe test (BL-1493 part 2) lands with it. Challenger: CPrivO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-81 Age signal as the first 1.0.1 lane (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED for the lane; NEEDS EVIDENCE for the deadline.
- Ruling: BL-1030 and BL-1031 are the first 1.0.1 lane after the sign-in must-haves, as a memory-only module (NSC-13: one of three strings, nothing stored), starting with BL-1045 and BL-1046 so the build starts the day the Mac with Xcode 26.2 and the App ID capability exist. The CCO reads CR-004 and CR-005 before the 1 Dec cut, not after.
- Why the date worries the CPO: the register (written by a Claude role, sources Secondary) says Texas SB 2420 is in effect now and Apple has required the Declared Age Range handling for Texas users since 4 June 2026 (CR-004 reads "Yes for any app distributed in Texas", status Gap); California AB 1043 starts 1 Jan 2027. If that reading is right, the 1 Dec build is the first exposed. ROADMAP risk 13 says "[U] Unknown".
- Evidence: `docs/legal/compliance-register.md` lines 20, 59, 60; D-121 and D-125 item 7; COUNSEL_PACKET lines 87-88; `docs/tdd/new-scope/security.md` line 61. The statutes and Apple's page were not read (UNVERIFIED). Cheapest check: the CCO reads SB 2420, AB 1043 and Apple's Declared Age Range page and writes one line: "applies to a first build with an 18+ gate, yes or no, from which date".
- Door: two-way until shipped. Condition: the Mac, Xcode and entitlement console are physical acts for `docs/release/FOUNDER_QUEUE.md`; the module never stores a range, bound or date. Counsel must confirm. Challenger: CCO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-82 Dead dependencies BL-502, BL-939, BL-946 (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED for BL-502; BL-1635 is corrected, because the pack's "council already ruled" is not what the log says.
- Ruling: BL-502: re-point from the superseded BL-485 to BL-1040 and BL-1044 and set both ready. D-128 puts the withdrawal control and its server function before any friend outside the family signs in, and CR-184 puts "outside sign-in" at the first external tester or store build, so these two rows gate the store cut and any external group. BL-1044 is not built (`withdraw_sensitive_data` appears only in `sensitive-row.ts`). BL-939 and BL-946: CPO-57 trims BL-939 to BL-937 only; CPO-55 has BL-946 on BL-937 and BL-963; CDesO-20 defers BL-937 until a second non-photo row has a build. BL-937 is a held dependency, not a dead one: set it ready as the first PR of BL-939, as CPO-55 treats BL-963 for BL-946. Neither is in the 1 Dec cut that the CPO can find (UNVERIFIED), so they sequence after it.
- Evidence: BACKLOG 2319, 2093, 4409, 4437, 8728, 3683, 3732, 3629, 3669, 3849; D-128; CPO-55, CPO-57, CDesO-20; CR-184.
- Door: two-way. Condition: Karma confirms the cut is "outside sign-in" under CR-184 and adds BL-1040 and BL-1044 to the cut list or states why not. Challenger: CPrivO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-83 Localisation position: English only in the first binary (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED: approve the PROPOSED position.
- Ruling: the first binary promises English only, in the app and in speech. Seven languages are the plan (D-056), each switching on in a later 1.0.x after a native reviewer signs and a recorded test passes. The listing, Settings and website say nothing new: no language list, no "coming soon" row. Retire BL-411's line "English app, seven spoken languages". Any language typed into a letter is kept as written, a statement about keeping words, not transcribing them. The unlock order stays an internal plan.
- Evidence: `docs/product/proposed/localisation-position-v1-2026-11-23.md`; D-125 item 2, D-056; `apps/mobile/eas.json` lines 51, 66, 81 (`EXPO_PUBLIC_ENGLISH_ONLY` on).
- Door: two-way. Condition: the AX5 check for ar, hi and zh is simulated under D-172 and labelled "simulated"; no listing may say it passed on a device. Counsel must confirm any promise text. Challenger: CLO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-84 Export: recently deleted letters only on the tick (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED.
- Ruling: Export everything includes recently deleted letters only when the person ticks "Include recently deleted"; the default is off. Then split ZIP64, orphan recordings and tombstoned letters into their own rows. A person who deleted a letter meant to take it out of her book; a tick keeps the words reachable without forcing them. The spec and code already say so; what is ruled is that CR-35's "settle with the CPrivO before BL-388" is settled.
- Evidence: `docs/legal/DELETION_AND_EXPORT_SPEC.md` line 314; `apps/mobile/src/lib/export/pack.ts` line 232; CR-35; BL-388. `strings.en.ts` line 1451 ("Every letter and recording, free, any time") is slightly contradicted by a deleted-but-unticked letter.
- Door: two-way. Condition: the tick-box words are new customer words (CDesO and content write them; `rules.test.ts`); Privacy Policy section 14 ("every letter you wrote") and the export help line need a read so "every" stays true; counsel must confirm. Challenger: CPrivO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-85 Storage line for a recording that will not delete: use the approved key (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED (corrects the pack): do not approve "A recording is still being removed".
- Ruling: the Storage state line is `listen.letGoStuck`, "A recording you let go is still on this phone.", with the Remove now button (`listen.removeNowButton`). CDesO-17 approved it as PROPOSED, replaceable. BL-1446's quoted line is the older card wording (E28, E67); "still being removed" reads like progress, while the approved line says what is true. Plain, no count, no list. Amend BL-1446's scope to name the key, then ready the build.
- Evidence: BACKLOG line 7105; `strings.en.ts` lines 324-329, 409; CDesO-17; PRD 18 line 36, PRD 22 line 150. `settings/storage.tsx` not re-read (UNVERIFIED).
- Door: two-way (one content key). Condition: `rules.test.ts` passes; `discardBodyNoUndo` stays held per CDesO-17. CANNOT RULE any waiver of the content rules test. Challenger: CPrivO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-86 Duplicate-line trigger on sign-in spec 12: the wide trigger (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED.
- Ruling: show the duplicate line ("You might already have a book here...") to every person who is new on this phone after any provider return (Apple, Google or email), with no account lookup, for one extra tap. The narrow trigger leaves the Apple-relay-then-email gap and a second, empty book, the "where are my letters" failure the PRD ranks first. The wide trigger reveals nothing about which addresses have accounts.
- Strongest counter-argument: a new parent sees "You might already have a book" as the first screen after sign-in. Answer: it is a line, not a gate, with two equal buttons; the CDesO reads the sentence for calm. Revisit trigger: testers saying it confuses them (tester notes, since analytics is off).
- Evidence: `docs/design/specs/12-WAYS-TO-SIGN-IN-AND-PHONE-STEPS.md` section 5; PRD 29 lines 95 (NS-54-R16) and 200 (S6); BL-1942. UNVERIFIED: whether an email sign-in reaches this screen; whether Google always returns a real address.
- Door: two-way. Condition: the CISO reads the wide trigger for the lookup point; card text edits go as a PROPOSED edit in the PR body. Challenger: CISO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-87 Reminder cadence and bedtime question (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED.
- Ruling: BL-536 ships in 1.1, after the notification catalogue (BL-297) and the five-parent check (BL-547), not in 1.0.1. The shipped reminder card stays. The sleep question stores a child's rhythm in rough bands and earns its place only if real parents want it, which cannot be measured with analytics off. Way back: bring it to 1.0.1 if testers ask for a different time or cadence. For BL-428: `planner.ts` already stops after day 35 (`BACKOFF_LAST_DAY` 35) while BL-537 still says "deferred 1.1", a stale row.
- Evidence: BACKLOG BL-536, BL-537, BL-297; `docs/design/NOTIFICATIONS.md` line 100 (K1); `apps/mobile/src/lib/reminders/planner.ts` lines 31-35, 177; D-172.
- Door: two-way. Condition: no cadence words ship without content and `rules.test.ts`. Challenger: CDesO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-88 Marketing phone mock tabs: Home, Book, Me (24 Nov 2026, CPO via Karma's session; not a licensed professional)
- Verdict: RULED.
- Ruling: change the marketing phone mock tabs to Home, Book, Me (one array, `apps/web/src/content/site.ts` line 138, `appTabs: ['Tonight', 'Book', 'Family']`), whether or not earlyletters.com is live and whatever SITE_MODE is. The line is false either way (D-161: Family is never a tab) and a public site promising a Family tab is a claim the build cannot keep (D-126, D-162). The web lane makes the change; the CMO owns the claim.
- Evidence: `apps/web/src/content/site.ts` lines 125-140; `apps/web/src/components/app-ui/screens/Tonight.tsx` line 110; D-161; `apps/mobile/src/app/(tabs)/_layout.tsx` lines 84-94. Whether the site is live and what SITE_MODE is set to in Vercel: UNVERIFIED, not needed.
- Door: two-way (redeploy). Condition: the app-ui mock's other screens show no Family screen; web e2e and tests pass; the D-118 child-name exception in `site.ts` is untouched. Challenger: CMO.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CLO-25 BL-454: retire `settings.neverRewrite`, confirm the held card shows raw words (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED.
- Ruling: point 1: retire `settings.neverRewrite`; it is rendered nowhere in `apps/mobile/src` and the claim "we never rewrite your words" already ships as the last sentence of `settings.tidyHelp`. Do not place it in a screen: a new Settings line is a new registered promise. Point 2: confirm "the held card shows the raw transcript" as designed; showing the stored raw words adds no meaning and claims no edit.
- Evidence: BACKLOG BL-454; `packages/content/src/strings.en.ts` line 1051 (`neverRewrite`) and line 873 (`tidyHelp`); `packages/core/src/types.ts` lines 12-19. The pack's line number 854 is stale. UNVERIFIED: whether `docs/legal/in-app-disclosures.md` lists the key.
- Door: two-way (restore from git). Conditions: the retire PR deletes the key and any test pin together, leaves `tidyHelp` untouched and runs `rules.test.ts` unchanged; if the disclosures file lists the key, bump its version in the same PR.
- Counsel must confirm: that retiring a registered line needs only a version bump.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-26 Consent-record deferrals (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED.
- Ruling: close BL-579 as superseded, on one condition: the phone's local agreement record must name versions that exist (BL-1973). BL-573 (the dedicated re-consent sheet) goes to 1.0.1, because under the D-7 ruling production gets 1.0.0 as `initial` with no 0.9.0 rows, so no production account holds an older version to re-consent from. Shrink BL-580 to a signed-in account that later says it is under 18. Lift the CR-47 deferral of BL-577 so BL-1166, BL-1167, BL-1339, BL-1340 and BL-1364 can start, re-pointing their Depends to the built BL-575 and BL-577; BL-1339 and BL-1364 still wait for the BL-1359 migration. CR-47 deferred BL-577 only because of the freeze and its own reason ("records written in build 2 cannot be fixed later") argues for lifting it now.
- Evidence: BACKLOG BL-573 to BL-580 (lines 2676-2760); CR-47; `docs/legal/POLICY_VERSIONING.md` section 6; LEGAL-REQ-001, -002; `strings.en.ts` lines 1635-1636; `machine.logic.ts` lines 196-199; `docs/ops/proposed/policy-1-0-0-rows.md` section 1. Not read: `consent.ts`, `gate.logic.ts`.
- Door: two-way; but a consent row written with the wrong version string stays wrong, which is why the BL-1973 condition matters.
- Conditions: (1) BL-1973 re-points the local constants (`agreements.logic.ts`, now "4.1.0" and "3.0.0") to the published 1.0.0 versions before a store build; (2) if production ever holds a 0.9.0 row before 1.0.0 (UNVERIFIED; the read-back query in FOUNDER_QUEUE row 5 checks it), 1.0.0 is `major`, re-consent is required and BL-573 becomes a 1.0 gate again; (3) the promise "If we learn that an account belongs to someone under 18, we will close it" (Terms 2.1) cannot be kept for the "learn later" case until BL-551 or BL-580 exists (see CLO-28 condition 4).
- Counsel must confirm: that the tick box plus the sign-in agree line bind (the draft's own mark S-15), and that "close" in Terms 2.1 is satisfied by BL-580 or BL-551.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-27 Erase everything and delete-account words; the CLO-22 hold lifts in two steps (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED for the words and the hold; NEEDS EVIDENCE for BL-979.
- Ruling: (a) lift the CLO-22 hold in two steps, recorded as a new D-entry "decided by Karma and the exec team under D-168" that names D-144 and D-169 item 2 without editing them (CR-176 item 2). Step 1: change `strings.en.ts:964` (`bookEraseNowBody`, "erased for good") to "Every letter and recording in it is erased from this phone. Backups and exports you already saved are not changed." Step 2: remove the `EXPO_PUBLIC_SERVER_ERASE` row and the flag read once step 1 has merged (BL-1987). (b) Keep D-144's four Erase everything lines as worded, and keep "We hold no copy." and "Nothing is sent anywhere." only where `localDeletionAllowedFor(owner)` is true. (c) Add one sentence to Terms 8.1: "Erasing everything on this phone starts the count again." in the draft `terms-of-service.md` and `terms-1.0.0.md`. (d) Adopt the CDO-6 sentence for the Delete account intro as recorded in BL-1857, and the held-request line "We're still finishing your request. We'll email you at the address on your account when it's done." with Cancel kept.
- Why: "for good" overpromises when backups and saved exports are untouched and a signed-in erase leaves a server tombstone; "Erased from this phone" is true on every path. Terms 8.1 today says the count survives reinstall, which Erase everything contradicts (D-083, D-144 item 2).
- Evidence: `strings.en.ts` lines 928, 964, 984-993, 1505; `scripts/release/store-flags.mjs` line 27; `apps/mobile/src/lib/capabilities.ts` line 218; BL-1805, BL-1854, BL-1857, BL-979; D-144, D-169 items 2 and 5; CLO-22; `docs/legal/COUNSEL_PACKET.md` line 106 (Q51). Not read: `erase-all.test.ts`; the server-tombstone trace is code reading only (UNVERIFIED on a device). D-172 superseded the counsel decision date only (item 4); the 27 Nov photo gate date stands.
- Door: wording two-way; the Terms 8.1 sentence and the Privacy deletion text are one-way once published.
- Conditions: (1) the replacement line passes `rules.test.ts` as is; if it fails, fix the copy; (2) NEEDS EVIDENCE: `strings.en.ts:1505` ("An export is a copy to open and keep. We hold no copy.") is not gated by `localDeletionAllowed`; on a signed-in phone it can read as "we hold no copy of your letters", which is false when sync is on; if the footer shows signed in, reword to "We keep no copy of this export."; (3) Privacy and Terms state the server clock for Erase now on a signed-in phone before step 2 ships; (4) a device-sheet row for a signed-in Erase now read-back (physical); (5) the Terms 8.1 sentence publishes only through the D-7 route.
- BL-979 (blocked on Q51, Q32, Q48): NEEDS EVIDENCE. Searched both rulings logs: no answer to Q51, Q32 or Q48 is recorded. CLO position on Q51 only: approve listing the kept records in Privacy 7 and the delete page, and settle the key-unwrap log period; packet Q51 notes D-021 says 12 months and the drafts say 24, the default is 24 (counsel must confirm). Q32 and Q48 are the CCO and CPrivO lane.
- Counsel must confirm: Q51 as above; that "Erased from this phone" is not misleading on a signed-in phone; the Terms 8.1 sentence; the held-request line when a legal hold is the cause (BL-447).
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-28 Production policy rows: no 0.9.0; the four 1.0.0 drafts are not accepted yet (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED (no 0.9.0 in production); NEEDS EVIDENCE (accept the 1.0.0 drafts).
- Ruling: (1) the 0.9.0 test texts do not go to the production `policy_versions`. They stay frozen, served at their versioned addresses as the record of what testers accepted, and every correction ships as 0.9.1 for TestFlight and into the 1.0.0 drafts. Gate G7 stays "not met" for 0.9.0 and is satisfied for production by 1.0.0 once part 2 holds. (2) The CLO cannot accept the four store drafts yet: about 30 open marks (grep counts 28 EXEC-TEAM COUNSEL Q and 7 FOUNDER marks across the four files; six sites are the same two placeholders) and the CLO has not read all 551 lines against the build. (3) The sha256 for the published bytes is retaken by platform (ops) at the release tag.
- Per file now: `sensitive-data-1.0.0`: re-base first (its SD-1 mark quotes "share it with the family you choose" but `strings.en.ts:1114` now reads "To sync your book across your phones", so its quoted body and in-app hash are stale). `subscription-terms-1.0.0`: smallest, two marks plus the address placeholder; not inserted anyway (key `auto-renewal-terms`, no code reads it). `terms-1.0.0` and `privacy-1.0.0`: not acceptable as they stand.
- Why: a legal text is one-way once published; `[legal name]` and `[mailing address]` appear in `terms-1.0.0.md` lines 34, 187, 196, `privacy-1.0.0.md` lines 38, 164 and `subscription-terms-1.0.0.md` line 96, and the CLO skill (section 8) records Apple's minimum custom-EULA terms as requiring the developer's name and address (UNVERIFIED: Apple page not read). The pack's "terms 4.2.0, privacy 3.1.0, labels 2.3.0" does not match the files: the drafts' frontmatter says 1.0.0 for all four, `app-store-privacy-labels.md` is at 2.2.0 and no labels file sits in `drafts/store-1.0/`.
- Evidence: `docs/legal/drafts/store-1.0/`; `docs/ops/proposed/policy-1-0-0-rows.md` sections 1, 2, 4, 5; `docs/release/FOUNDER_QUEUE.md` lines 48, 59, 75-103; `docs/legal/POLICY_VERSIONING.md` section 2.4 (line 69); D-138, D-144, D-172; CR-60.
- Door: NOT two-way for the published row.
- Conditions before any 1.0.0 row is inserted (the insert is physical, FOUNDER_QUEUE row 6): (1) every `[EXEC-TEAM COUNSEL Q]` mark resolved or removed with a recorded ruling, banner and bracketed notes stripped; (2) placeholders filled: the legal name is the Apple seller name (D-004) and the mailing address needs the PO box (BL-367, physical, overdue); until it exists no 1.0.0 text goes live; (3) the privacy drafts' "we will do it by hand" sentences (lines 108, 128, 140) follow CR-187; (4) Terms 2.1 "we will close it" is backed by BL-551 or reworded to what we can do; (5) the 38-day backup figure in privacy draft line 108 is true only if backups exist (D-159 "Open": whether the three jobs are built and running was not stated); (6) Terms 8.1 carries the D-3 count sentence and the D-8 held-letter sentence; (7) `agreements.logic.ts` constants and the pin test point at 1.0.0 (BL-1973); (8) `initial` versus `major` follows the production read-back (CLO-26 condition 2).
- Counsel must confirm: every open mark; that publishing 1.0.0 as `initial` is right when staging testers hold 0.9.0.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-29 Small legal-text and classification edits BL-1993, BL-1994, BL-1239, BL-527, BL-1188 (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED.
- Ruling: BL-1994: approve; add `occurred_precision` and `base_direction` as L2 rows to the `book_entries` view table, nothing else. BL-1239: accept the existing rows 802 to 805 plus one SDK-queue row for the on-device store, drafted by privacy. BL-1188: approve the plain statement that a sign-in already issued works for up to 15 minutes after the session ends, no shorter lifetime for 1.0. BL-527: accept LNG-04, LNG-09 and LNG-12 as proposed; accept LNG-18 only after the CAIO confirms the "misheard word" scope; record on the row that no licensed lawyer has read any of them. BL-1993: approve, with this sentence, not the "current held-letter meaning" the pack leaves unspecified: "A letter you cannot keep yet stays as a draft, unchanged, until you keep it or delete it." No other change to 8.1 in this row (the D-3 sentence goes in through its own entry).
- Why for BL-1993: the old sentence says "waits on your phone, unchanged, for as long as you like". A held draft can sync to the server (`held.upsert`, `sync/engine.ts` lines 218-221; `strings.en.ts` line 315), so "on your phone" is not always true, and "for as long as you like" is an open-ended promise. Why for LNG-18: "We only fix small slips, like an um, a repeat or a misheard word" sits next to `stt_fix`, which replaces only with a dictionary term (`packages/core/src/types.ts` line 16); if "misheard word" suggests any word is fixed, the line over-claims.
- Evidence: `docs/legal/terms-of-service.md` line 98; `terms-1.0.0.md` line 98; `DATA_CLASSIFICATION.md` lines 108-114, 649, 682, 800-806; migration `20261015030000_v1_wire_contract_columns.sql` lines 843-844; `supabase/config.toml` line 42; `docs/reviews/2026-10-31/COUNSEL_LOCKED.md`. UNVERIFIED: the hosted project's real token lifetime; that no SDK-queue row exists yet.
- Door: two-way before publish; one-way after.
- Conditions: BL-1188 states 15 minutes only if the hosted setting is 900 (read AUTH_SETTINGS row for `jwt_expiry` and the hosted value). The BL-527 PR changes `packages/content`, the disclosures file and its pins in one PR with a version bump. CAIO read of LNG-18: confirm "a misheard word" matches what `stt_fix` does, or narrow to "a misheard name from your list".
- Counsel must confirm: every row above; the "15 minutes" statement is a factual claim about the platform, not a legal conclusion.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-30 Analytics, insights and crash: guardrails and the vendor paperwork (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED (guardrails); NEEDS EVIDENCE (PostHog's own terms and DPA, unread).
- Ruling: (BL-1128) F-1 yes as a product choice, but accepting a vendor's terms is an exec-review class (CLO skill section 5): PostHog is not a subprocessor in `docs/legal/subprocessors.md` yet and no event is sent until the CLO reads the terms and DPA and the subprocessor row exists. F-2: EU region if offered, chosen before the first event (US-only launch, D-013; the CLO sees no legal reason to prefer US; counsel must confirm). F-3: treat the pseudonymous id as Linked, the conservative label answer. F-10: keep the free plan per D-159, with the risk written down by the CFO and CISO. (BL-1115) no objection to counts at k of at least 10 from existing tables. (BL-1607) no objection to a coarse `child_count_bucket`. (BL-1633) no objection to weekly insights from matured cohorts. (BL-1147) no crash SDK before 1.0; `crash.ts` has `enabled: false`; the crash consent line follows the scrubber and tests.
- One legal defect to fix before any turn-on: `analyticsConsent.detail` says "Nothing is shared unless you say yes" (`strings.en.ts:1131`) and the body says "when something crashes" (`:1130`) while crash capture is off. D-163's second instruction says page-view, click and impression analytics are "not opt in", and D-170 left that open; if behavior becomes not-opt-in, "unless you say yes" is untrue. The sheet, the Settings switch and the behavior must tell one story, or no analytics turns on (already the BL-2003 gate).
- Evidence: `docs/analytics/instrumentation/data-architect.md` lines 236-248; `packages/analytics/src/crash.ts`; D-159, D-163, D-170; CR-185, CR-186; `docs/legal/subprocessors.md` (no PostHog row). Not read: PostHog terms, DPA, retention or region pages (UNVERIFIED).
- Door: two-way while analytics stays off (CR-186); one-way in effect once events leave the phone.
- Conditions: no entry text, transcript, audio or child name in any event, log or crash report; closed allowlist; no autocapture, no replay (D-163 item 5). Metabase is AGPL (F-7): internal-only, and counsel must confirm that reading before it is run.
- Counsel must confirm: the "not opt in" basis, the Linked reading, the DPA, and the AGPL reading.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-31 No phone number and no SMS in 1.0 or 1.0.x (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED.
- Ruling: no phone number and no SMS sign-in in 1.0 or in 1.0.x. LEGAL-REQ-012 stays as written. BL-1897 closes as "not applicable to 1.0"; BL-1909 (the relaxation) and BL-1900 (the policy text) are deferred; BL-1898 is deferred and no vendor account or spend is opened. Re-run CR-062 (TCPA) as "not applicable" because no text is sent. The CLO takes the inflight analyst's ruling over blocked-2's.
- Why: LEGAL-REQ-012 lists "phone number" under "Never collected" and the register marks it a P0 field allowlist; D-171 leaves a phone number undecided; CR-180 puts the Google and phone rows after 1.0. The spike read no vendor price or rule. Once numbers are stored the door is closed in practice. "Revisit with BL-1896 read from vendor pages" is the way back.
- Evidence: `docs/legal/ENGINEERING_REQUIREMENTS.md` lines 115-120; `docs/legal/compliance-register.md` line 121 (CR-062); `docs/research/sms-phone-auth-spike.md` sections 1-4; D-171. Not read: DELETION_AND_EXPORT_SPEC 2.6 and 4.2.
- Door: two-way if no phone data is collected. Conditions: no schema column, migration or Edge Function for a phone number lands in 1.0 or 1.0.x; the data-map diff check (LEGAL-REQ-012 test) keeps enforcing it; if a phone factor is ever proposed it returns as a new exec review with vendor terms read first, then the CFO's cap.
- Counsel must confirm: the TCPA "not applicable" reading while no SMS is sent (statute not read).
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-32 Photo library read stays off for 1.0 (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED (partly NOT A QUESTION: D-169 item 3).
- Ruling: 1.0 ships with the photo library read off. Gate 2 (egress test) and the primer-line reading are not green, so the flag stays unset in every store profile. Build only Export fail-closed (photos written as null and the export says so). Close BL-1838's four primer lines as PROPOSED, using "we do not receive", never "nothing leaves the phone" (CPrivO-31). Do BL-1858's cleanup: remove unused photo strings and fix the four store docs.
- Evidence: D-169 item 3; CPrivO-29, -30, -31; CR-146; `apps/mobile/eas.json` (no `EXPO_PUBLIC_PHOTOS` or MOMENTS key); BL-1830, BL-1838, BL-1858. UNVERIFIED: whether Export fail-closed is merged; whether the `scribe-photo` module's Photos purpose string ships in the Info.plist while the flag is off (an unexplained permission string is also an App Review risk).
- Door: two-way (flag). Conditions: no store text, label row or Privacy line mentions picking pictures from the library while the flag is off; if the Info.plist check shows a Photos purpose string, remove it from the 1.0 build or record the reason.
- Counsel must confirm: the "we do not receive" wording when the flag turns on.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-33 Moments legal drafts: draft now, publish nothing (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED.
- Ruling: BL-1389's Privacy and Terms lines for pictures, and BL-1578's `en.plus.legal` decision, stay in the PR body until BL-1434 G1a-L reports and the flags are decided. BL-1542: approve the wipe-list line and two table rows to merge with BL-1493 part 1, on the content of CDO-23. For `en.plus.legal`: leave the key unchanged and record that decision; add "dated, key retired in #383" notes to dated docs now. The wipe-list wording describes a real device file and can be true now; photo and Moments features are dark in every store build, so no published text should describe them.
- Evidence: BACKLOG BL-1389, BL-1493, BL-1542, BL-1578; CDO-23 including its Erratum; `DATA_CLASSIFICATION.md` (no `moments.json` row yet); `packages/content/src` (no `en.plus.legal` key by grep). UNVERIFIED: the key's current name and location, which the BL-1578 PR must show.
- Door: two-way (nothing published). Conditions: the wipe-list line follows CDO-23's Erratum: it may say Erase everything and sign-out delete the file through `eraseDeviceFiles` (CDO-23 item 3) but must not say a `local` owner file is claimed or cleared at sign-in; the rows say what the file holds (a day key, typed labels, hidden place keys, the home-place correction, an opaque owner id) and never a picture, album id, coordinate or computed place name.
- Counsel must confirm: that the device-store row in `data-policy.md` 4.4 and the Privacy line are accurate once the flags decide.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-34 Static legal pages before submission (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED (partly NOT A QUESTION: D-042).
- Ruling: yes to `/delete-account` (D-042 says "Proceed: yes"), yes to a separate `/subscription-terms` (the billing config and emails already link a subscription-terms document), and yes to `/privacy-choices` as a small factual page. Un-remove `/delete-account` from `REMOVED_ROUTES` in `apps/web/e2e/support/legal.ts:25` on the branch that builds it. None deploys to `main` until the exec reading of its text is recorded and the CR-187 condition is applied.
- Why: D-042 rests on Google Play's requirement; for an iOS-only first build the delete page is good practice and a link target, not an Apple requirement (UNVERIFIED: Apple's rules not read). `/privacy-choices` is an optional store URL (`docs/store/readiness.md` line 104). A store URL once submitted is a promise.
- The condition that matters: `docs/legal/delete-account-page.md` (1.1.0, draft-for-counsel) lines 26, 74-82 say "You can delete your account by email", "We reply within 10 business days" and "before we start", and the deletion clock follows. That is the hand-started promise CR-187 retires; the page cannot go live on that copy until BL-551 exists or the copy is reworded.
- Evidence: D-042; `apps/web/e2e/support/legal.ts` lines 15-25; `apps/web/src/app/(legal)`; `delete-account-page.md` lines 1-90; `docs/store/readiness.md` lines 104, 351, 377; BL-243, BL-512; `docs/ops/runbooks/data-requests-by-email.md` section 9. The e2e `INTERNAL_MARKS` bans "counsel", "draft" and ids on pages.
- Door: mostly two-way; the submitted store URL is not. Conditions: page copy follows CR-187; deploys with the D-14 web release only after the exec read; no page names Apple, Google or other vendors that `NOT_USED_SERVICES` lists unless the Privacy text does.
- Counsel must confirm: the page's retention lines (kept records, the 45-day provider clock) and Apple's expectation for a deletion URL.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-35 Age-gate behaviour: hold the new sentence, reachability yes (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED.
- Ruling: (BL-426) add the compliance-register line now, doc only: the stop lives in local settings and uses the device clock, and reinstalling clears it (CCO-18 records the reinstall fact). Do the Keychain evaluation as a doc. Hold "If you answered by mistake, come back tomorrow." out of the build until the CCO and CLO read it with Q45 and Q46. (BL-1785) yes: read, play and Save a copy stay reachable during the 24-hour closure; every other surface stays closed (no recording, no new letter, no sign-in, no sync); the test starts from a phone that already holds a book.
- Why: the "I answered by mistake" button works only after the window has passed (`age-gate-screen.tsx` lines 119-131), so the sentence would explain a real rule, but it is a new registered line at a legal gate and CCO-18 says the bypass question is open. CCO-17, which the CLO co-signed, says unreachable read and Save a copy is the defect; Export and delete are never gated behind new terms (POLICY_VERSIONING section 6 item 4).
- Evidence: `strings.en.ts` lines 1622-1630; `age-gate-screen.tsx` lines 119-131, 189; LEGAL-REQ-002; CCO-17, CCO-18; BL-426, BL-561, BL-1785, BL-2008. UNVERIFIED: the root layout behavior on a device.
- Door: two-way. Conditions: the BL-1785 change touches an age-gate path, so it takes the CCO review and the compliance fence (CR-27); LEGAL-REQ-002's own words say an ineligible user "never gets first run, recording, a local book": the carve-out applies only to a phone that already held a book before the answer, and the test pins it.
- Counsel must confirm: that read-only and Save a copy during the closure is consistent with LEGAL-REQ-002 for someone who is in fact under 18 (Texas SB 2420 not read).
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-36 Platform age signal: build lane yes, must-have call needs the primary text (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED (build lane); NEEDS EVIDENCE (must-have call).
- Ruling: build the platform age signal as a 1.0.1 lane, memory-only, after BL-1045 and BL-1046, with the module returning one of three strings only (NSC-13 as amended). Whether it is a 1.0.1 must-have is NEEDS EVIDENCE: the CCO reads the primary text of AB 1043 and records who it binds, what it asks of an app developer and the effective date, by Tue 1 Dec as the pack asks. If it binds developers from 1 Jan 2027, 1.0.1 ships before that date. The repo's only sources for the date and duties are secondary (BENCHMARK.md row 27; compliance-register CR-005, "all Secondary"), and the CLO will not state what AB 1043 requires from memory.
- Evidence: `docs/legal/BENCHMARK.md` line 49; `docs/legal/compliance-register.md` line 60; LEGAL-REQ-002; `docs/tdd/new-scope/security.md` line 61; COUNSEL_PACKET lines 87-88. Not read: ROADMAP risk 13, BL-1030, BL-1031, `apps/mobile/modules/` (UNVERIFIED whether any module exists).
- Door: two-way until shipped. Conditions: in memory only; never logged, stored, sent or put in analytics; an under-18 category is ineligible. Physical follow-ups: a Mac with Xcode 26.2, the App ID capability and the entitlement approval (queue rows).
- Counsel must confirm: the date and the duty.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-37 sync_books: accept the child name, file the tighter shape (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED.
- Ruling: accept the child's name in the closed `sync_books` shape as built, because the recipient is already a member of that book and knows the name. Do not widen it. File one row for the tighter shape: `other_parent_signs_as` plus a contributor count, replacing every member's `signs_as`.
- Why: the first disclosure of the name was already made to this person as a member; the open question is only presenting it after consent is withdrawn (CCO-19, Open). The store build has no way to invite or join another parent (D-162; Terms 4.3 draft), so the co-parent case is unreachable by interface in 1.0.
- Evidence: CCO-19 (lines 1444-1458); BL-1920; `terms-1.0.0.md` line 64. Not read in detail: `packages/api/src/server/sync.ts` and the migration. UNVERIFIED: whether the name is ever copied into a log line.
- Door: two-way (a new migration narrows it; never edit the applied one). Conditions: the child name stays out of logs, analytics and crash reports; if the return stays, a test pins that a former member gets nothing beyond the closed shape.
- Counsel must confirm: that returning the name to a member after withdrawal is acceptable (BL-1920's own question).
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-38 Localisation position: no objection, with limits (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED.
- Ruling: approve the PROPOSED localisation position as an internal position: the app's words are English at 1.0, a parent can speak and type English, and a letter in any script is kept as written. No store line promises seven languages. Keep the website answer "English first. More languages follow one at a time, each after a native speaker has checked it." as it is, with no order and no dates in any public text. Retire the BL-411 scope line "English app, seven spoken languages". "Words are never translated, by anyone" is an absolute that is true of the build as described; the CMO keeps it in the claims register with its evidence.
- Evidence: `docs/product/proposed/localisation-position-v1-2026-11-23.md` sections 1-4. Not read: `localisation-fixtures.test.ts`, `site.en.ts`, D-111 item 4, D-121 item 1, D-125 item 2.
- Door: two-way. Conditions: no public text names an order of languages or a date; Hindi stays unshipped until Q9 (speech training data terms) is read by the exec team.
- Counsel must confirm: Q9 for any Hindi model; nothing else.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-39 Export: recently deleted letters only on the tick (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED.
- Ruling: recently deleted letters are in the export only when "Include recently deleted" is ticked, and the default is off, matching the spec's own table and the code. The export screen and the README in the ZIP must not say "every letter" without the qualifier, and the tick must exist in the interface before the 1.0 export is claimed complete.
- Why: a person who deleted a letter chose to remove it; handing it over by default can surface what they meant to remove. A tick keeps the right to see and export it, which Privacy 10 promises for the data we hold during the 30 days.
- Evidence: `DELETION_AND_EXPORT_SPEC.md` lines 310-314; `apps/mobile/src/lib/export/pack.ts` line 232, `schema.ts` line 357; CR-35; BL-388; `packages/content/src/features/export.en.ts` lines 12, 99-112. UNVERIFIED: whether the tick control exists in the UI.
- Door: two-way. Condition: if the tick is not built for 1.0, the export copy says what it contains ("Every letter in your book") and Privacy says a deleted letter can be requested by email during its 30 days, so the promise matches the build.
- Counsel must confirm: that the 30-day Recently deleted period is within the access right.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-40 Refused-region screen words (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: RULED.
- Ruling: approve the neutral refused-region words as written: title "{app} can't be set up from here.", body "If you think this is wrong, get in touch.", and the two quiet actions "Terms" and "Get in touch". They name no reason, place or rule. The approval is for the words, not for turning the check on.
- Why: the line states a result without a reason, the safest posture for a geo refusal and for a mistaken one; it carries no promise of a reply time.
- Evidence: `packages/content/src/features/auth.en.ts` lines 205-215; CDesO-16, CLO-3; BL-1026, BL-1441; `privacy-1.0.0.md` line 154 (the sign-up country check is not built). UNVERIFIED: that a reachable "Get in touch" address and the sanctions-match runbook cover a mistaken refusal.
- Door: two-way before ship. Conditions: no "Try again", no reason, no place, nothing stored on the phone, no analytics call that carries the reason (CDesO-16); "Get in touch" opens a mailbox someone reads; the Privacy text about the country check (CLO-3) stays true because the screen is unreachable until the check ships; the lines pass `rules.test.ts` as written.
- Counsel must confirm: that a neutral refusal is adequate for the sanctions and export rules CCO-5 covers.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-41 Position on CR-187: no hand-started deletion promise until BL-551 exists (24 Nov 2026, CLO via Karma's session; not a lawyer, not legal advice)
- Verdict: concur, with three extensions; 0.9.0 may stay until 0.9.1 on stated conditions.
- Read: `docs/legal/beta/terms-0.9.0.md` line 114 ("email hello@earlyletters.com ... and we will do it by hand"); `privacy-0.9.0.md` lines 104 ("we will start the deletion by hand", then the 30, 31, 38 and 45 day clock), 127 (withdraw sync "by hand") and 131; `docs/ops/runbooks/data-requests-by-email.md` status paragraph and section 9 (Route 1 "cannot be run at all", BL-551 in no migration; nothing in the runbook has been run on a live project; its own first reply: "We cannot start a deletion by email yet. We will write to you again by <date, no later than day 45>"); `docs/ops/runbooks/underage-account.md` step 4; BL-551, BL-2025; the BL-1887 notice section 1.3; `docs/legal/TESTFLIGHT_TESTERS.md` line 122; CR-60, CR-184, CR-185, CR-186.
- Why concur: today the text promises an act the operator's own runbook says cannot be done; that mismatch gets quoted back in a complaint (UNVERIFIED primary: FTC and California deception rules not read). The honest sentence is also the cheaper one to keep.
- Extensions: (1) cover the whole "by hand" family, not only deletion. Not runnable today: delete an account (Route 1), "we offer to delete what was synced" (Privacy 9), close an under-18 account by deleting it (Privacy 8, Terms 2.1), delete TestFlight feedback for an anonymous tester, remove an address from the email list. Withdraw sync (Route 2) and see, export, correct (Route 3) are written but never run. Rule: until a route has been rehearsed once on a fictional family (runbook section 10), the tester text promises only "we confirm your request and write back within 45 days". (2) Fix the deletion clock: Privacy 0.9.0 section 7's 31, 38 and 45 days are false for the email route; 0.9.1 ties the clock to a deletion started in the app. (3) Say it in every tester-facing place at once: Terms 10.1, Privacy 7, 8, 9, 10; the BL-1887 notice 1.3; `TESTFLIGHT_TESTERS.md` 5.2 (BL-2026); the delete-account page copy; and the 1.0.0 drafts (`privacy-1.0.0.md` lines 108, 128, 140). Where the Delete account row is on, say so (CR-186).
- Proposed 0.9.1 wording (ASCII; counsel must confirm): Terms 10.1: "You can stop testing or ask us to delete your account at any time, and you can leave a book when that is available in the app. To ask, email hello@earlyletters.com from the address on your account. We confirm your request and write back within 45 days. If your test build shows Delete account in Settings, you can start the deletion there yourself." Privacy 7, account line: "Email us from the address on your account and we will confirm your request and write back within 45 days. If your test build shows Delete account in Settings, you can start it there instead. The days below count from the day a deletion starts." Privacy 9 and 10: replace "we will do it by hand" with "we will confirm your request and write back within 45 days".
- Can 0.9.0 stay live until 0.9.1: yes, on four conditions; whether it is live at all is UNVERIFIED (CR-60 held the deploy to `main`; check `https://earlyletters.com/legal/terms/0.9.0` and `git ls-tree` on `main`). 0.9.0 is hash-pinned and its version number is never reused (POLICY_VERSIONING line 69): it is superseded by 0.9.1 and stays served at its own address as the record of what was accepted. If the 0.9.0 pages have not been deployed, keep them held and deploy 0.9.0 and 0.9.1 together; the consent record may point at 0.9.0 (BL-564 dead-link defect if the address 404s). The exposure while the people with accounts are the named household (CR-184) is low; it grows at the first external tester, a public link or the first store build, each already needing the deletion drill (CR-178 item 5, D-170 item 4), and 0.9.1 joins that list.
- Conditions: (1) no servers-on build reaches anyone outside the household before 0.9.1 is merged and its staging `policy_versions` row applied (physical, queue row, CR-185 item 1, BL-1867's start gate); (2) until BL-551 exists, hello@ requests get the runbook's closed-route reply; (3) the Delete account row is on wherever the build has the staging purge worker secrets; (4) the 1.0.0 drafts get the same reword before their rows are inserted (CLO-28 condition 3).
- Counsel must confirm: that the wording is accurate for a hand-written reply route, the "days count from the day a deletion starts" reading (the runbook says the same clock question needs counsel, its section 0), and the deception reading.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CPrivO-32 BL-371: Undo toast stays; confirm, shelf and purge unchanged (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED, with conditions.
- Ruling: keep Undo as a toast on the Book (S36, A11Y-F03) and edit the row's Done-when to match. The privacy substance is not the Undo shape; it is the confirm, the 30-day Recently deleted shelf with Restore and the real purge, and those stay as written. A toast that disappears loses nothing, because Restore stays in Settings, Your data, Recently deleted for 30 days. Way back: build the full-width button later; it adds no collection.
- Evidence: BL-371 (lines 1078-1084); `DELETION_AND_EXPORT_SPEC.md` lines 86-106; `EXPERIENCE_PASS_2026-10.md` line 969; `BENCHMARK.md` line 169. S36 and A11Y-F03 sources beyond those citations: UNVERIFIED.
- Door: two-way. Conditions: (1) the rewritten Done-when keeps the confirm with Keep it as default, the Recently deleted list with Restore and erase date, and the tests in `store.entries.test.ts` and `sweep.test.ts` for the 31-day purge of text, versions and audio; (2) deleted letters stay out of Book, Tonight, Read together and search; (3) the toast text passes WRITING-GUIDE and `rules.test.ts` (no "gone forever" style fear lines).
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-33 Consent-record deferrals: consent is enforced by the server (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED.
- Ruling: agree with the pack on the shape. Close BL-579 as moot and re-point the five dependent rows to the built sign-in agree line (BL-575) and BL-577. Do not lift the CR-47 deferral of BL-579 itself. BL-573 (dedicated pre-account Terms record) goes to 1.0.1. BL-580 shrinks to the signed-in older account. Reason: consent is enforced by the server, not only the screen: `can_write_content()` and the pull gate refuse content without sensitive-data consent, terms and age attestation (`20261123100000_sync_pull_consent_gate.sql` lines 405-420, `content_gate_state`). A second consent sheet adds no protection in 1.0.
- Evidence: the pull gate migration; CPrivO-8, CR-176, CR-184. Not read (UNVERIFIED): `consent*`, `gate.logic.ts`, `machine.logic.ts:199`, POLICY_VERSIONING section 6, Terms 1.0.0 draft 2.1, `underage-account.md`.
- Door: two-way. Conditions: (1) before the store cut, a test (or the existing consent-builder test, named in the ruling) shows a user who has not accepted the current terms cannot write content or pull it; (2) the older-account path (BL-580) still closes an account found to be under 18 using the existing `under_18_closure` reason (CR-40 area); (3) legal text change stays with the CLO. Counsel must confirm that an agree line at sign-in is a sufficient record of terms acceptance and age attestation for a service holding a child's data (packet Q2, Q4).
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-34 Erase everything and delete-account words; the hold lifts on three checks (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED, in parts (wording yes, Terms 8.1 sentence yes, hold lifts only on the evidence below).
- Ruling: clear "Erased from this phone. Backups and exports you already saved are not changed." without "for good". Keep "We hold no copy." and "Nothing is sent anywhere." only where `localDeletionAllowed` is true (today a phone that never signed in; once a phone has synced those two sentences are false and must not show). Adopt the CDO-6 sentence (another parent's letters are not deleted with the book; the name and dates are kept only to label them; D-116; `privacy-0.9.0.md` line 106 already says it). Held deletion shows "We're still finishing your request. We'll email you at the address on your account when it's done." with Cancel kept. The Terms 8.1 sentence that Erase everything resets the free count: yes, in one sentence; it is the Keychain count (`privacy-1.0.0.md` line 101: one number, no letter, name or date, never leaves the phone, survives app deletion), a disclosure of existing behaviour that collects nothing new.
- Conditions for lifting the CLO-22 hold: (1) `erase-all.test.ts` proves no network call (the pack says it does; not read); (2) the deletion drill still gates any outside sign-in (CR-178 item 5, CR-184) and BL-979 waits for it; (3) the "Backups and exports you already saved are not changed" line stays, because iPhone backups and saved exports are outside our reach (Q17 area). No "for good" anywhere.
- Evidence: `privacy-0.9.0.md` lines 104-106; `privacy-1.0.0.md` line 101; `data-policy.md` line 217; runbook `data-requests-by-email.md` line 140; CR-176, CR-186. Not read (UNVERIFIED): `strings.en.ts` Erase lines, `erase-all.test.ts`, `account-deletion/logic.ts:104`; whether Q32, Q48, Q51 answers are recorded.
- Door: wording two-way; once Terms and Privacy publish, slower to retract. Counsel must confirm that "We hold no copy" is accurate for a phone that never signed in but has used analytics or support email (true with analytics off; say it only while true).
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-35 Moments and photo behaviour, six rows (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED per line.
- Ruling: BL-1742: confirm CPrivO-28; swipe-down on the Photos primer persists nothing, never triggers Apple's alert, never returns unprompted; only "Not now" records a decline. The "pending founder confirmation" tail in CPrivO-28 is void under CR-176; Karma records the confirmation. BL-1951: CANNOT RULE any option that drops or tidies typed words when a photo commit fails; keep the words as typed, one content line that passes WRITING-GUIDE and `rules.test.ts`. BL-1472 (O-62): one picture first, six deferred (less data). BL-1744 (O-22): lands on Moments scroll 0, For you, no highlight; privacy check added: the notification payload and deep link carry no child name, place, picture or text (CPrivO-9; PRIV-R10, R11); evening lands on Home. BL-1487: presentation call (CDesO); no privacy effect. BL-1491: home place per book id; a place is a coordinate-derived label and so personal; condition: it stays on the phone, out of sync and export until CPrivO-29 gates close, and the metadata scan on every picture send-out stays standing (CPrivO-22).
- Evidence: CPrivO-22, -24, -28, -29, -30, -31 (lines 1054, 1228, 1394-1432). Not read (UNVERIFIED): `eas.json` photo and Moments flags; `moments-motion-spec.md:100`; `store.logic.ts:26`; PRD 28 R249 and 17.1; whether the payload check is already a test.
- Door: two-way, all dark behind flags. Conditions: flags stay off in every store profile until the gates in D-11 close; any Moments event keeps to the analytics allowlist (D-9).
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-36 Store-cut gates, privacy seat: defer Turnstile (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED (privacy seat only; the gate order is the CISO's).
- Ruling: no objection to gating the store cut on BL-595 (per-address wrong-code limit) and BL-581 (stray accounts). On CAPTCHA: defer BL-1041 (Turnstile) to 1.0.1 and let the rate limit plus the code-entry pause gate the cut. Turnstile is a new subprocessor on the sign-in path: it would see the visitor's IP and device signals before any account exists, and it changes the App Privacy answers, `subprocessors.md` (version 2.1.0) and Privacy section 6. Way back: add Turnstile in 1.0.1 with its own row, label update and policy line first. BL-596: supersede is fine. BL-587 (delete alpha staging data): yes, and record it; the deletion covers staging `auth.users`, profiles, letters and `policy_acceptances` of the alpha, and the note says what was deleted and what was not (backups of staging, TestFlight feedback). The act may be a console action (UNVERIFIED), physical if so.
- Evidence: `docs/legal/subprocessors.md` (version 2.1.0, no Cloudflare row in the first lines read); CR-176, CR-178 item 5. Not read (UNVERIFIED): AUTH_SETTINGS row 17, ENVIRONMENTS.md:75, `pending.ts`, CR-47.
- Door: mostly two-way; adding the subprocessor is the slower one to undo. Condition: if the exec team takes BL-1041 into the cut, the same PR carries the `subprocessors.md` row, the Privacy line, the label change and a CSP/host allowlist entry (CISO), and nothing loads Turnstile before the age and region checks pass. Counsel must confirm a bot-check vendor's access to IP and device data against the Apple label (Q7, Q12).
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-37 Production policy rows: 1.0.0 only, read each draft against the production profile (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED in part, NEEDS EVIDENCE in part.
- Ruling: no 0.9.0 row goes to production `policy_versions`: 0.9.0 is a test text for TestFlight builds and a test server, and `privacy-0.9.0.md` section 7 holds the deletion promise we cannot keep (CR-187). Publish only the 1.0.0 rows, per file accept or reject after the exec reading, and only text true of the production profile. Read of the drafts: `privacy-1.0.0.md` line 16 says it is true only for `production` with servers on and `EXPO_PUBLIC_BACKUP`, `EXPO_PUBLIC_ANALYTICS`, photos and Google off; lines 27-32 and 54 say recordings stay on the iPhone, photos are not read, no usage analytics or crash reports; line 108 points to Settings, Your data, Delete account (needs `EXPO_PUBLIC_ACCOUNT_DELETION=on` in `production`, and the drill); line 120 still carries a FOUNDER marker on the security-log period; line 32 flags that analytics later needs a new major version and the `analytics` consent first. That posture is the right one for 1.0.
- Evidence not found: the pack names "labels 2.3.0" among the store-1.0 drafts but the folder holds four files and no label; `app-store-privacy-labels.md` is version 2.2.0 (still Phone Number No, Photos No, Usage and Diagnostics No). UNVERIFIED where 2.3.0 lives.
- NEEDS EVIDENCE, cheapest check: (a) locate or write labels 2.3.0 and confirm its rows against the production profile; (b) the CPrivO read of `privacy-1.0.0` against `eas.json` `production` and the migrations, per line, with `EXPO_PUBLIC_ACCOUNT_DELETION` and analytics as the two swing facts; (c) the marker on line 120 resolved by the exec team (12-month security log, D-021).
- Door: NO for the published row. Conditions: (1) production Privacy says analytics off only while `EXPO_PUBLIC_ANALYTICS` is absent from `allowedOn` production (`store-flags.mjs`, CR-186 BL-2004); (2) the Delete account line is published only if the production profile turns the row on and the drill passed (CR-178 item 5); (3) the SQL insert is a physical act (FOUNDER_QUEUE row 6); (4) sha256 retake by ops at the release tag. Counsel must confirm every legal fact in the four files.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-38 Small legal-text and classification edits, with two exceptions (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED, with two exceptions.
- Ruling: approve BL-1993 (replace "waits on your phone" with the current held-letter meaning, no other 8.1 change) provided the new sentence says the letter is held on the person's phone only if that is where it is held. Approve BL-1994 (two L2 rows in the view table): classification only. Accept BL-1239 (rows 802-806 describe the analytics keys as L2 with the id "never sent anywhere except PostHog (after a yes) and `analytics-forget`"): only true while analytics stays off or consented; the SDK queue row must say the queue holds allowlisted event names and values only, no text. BL-527: accept the open rewrites (LNG-04, 09, 12, 18) as the exec team's reading and record "no licensed lawyer has read them". BL-1188: say in plain words that an issued access token lives out its 15 minutes after a session ends (`jwt_expiry = 900`); no shorter lifetime for 1.0; the wording is shown to the CLO before publish.
- Exceptions: the access token sentence must not read as "signing out ends access at once", and none of this publishes before the exec reading of D-7. The CPrivO has not read `terms-of-service.md:98`, `COUNSEL_LOCKED.md` or `APPLY.md` File 36 (UNVERIFIED), so acceptance of BL-527 rests on the pack's description; if any of the four touches a data promise, it returns to the CPrivO.
- Door: two-way before publish. Condition: classification stays consistent with `DATA_CLASSIFICATION.md` (child name L4, content L4; sync_books member list L3, line 764); counsel must confirm.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-39 Analytics, insights and crash: all stay off; conditional yes per row (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED, collection stays off; each row below is a conditional yes. CANNOT RULE any variant that lets text, transcript, audio or a child name into analytics, logs or crash reports.
- What changes when analytics goes on, in one sentence a parent can read: the app starts sending usage events (which screens, which buttons, how long a step takes, and crash classes if crash is on) tied to a random id, to a processor we did not use before; a new collection, a new vendor and a label change from "Data not linked / no usage data" to Usage Data (Product Interaction) and Diagnostics, Linked until counsel says otherwise. Known mismatch to fix first (CR-185 CPrivO item, gates BL-2003): the tester notice and the consent sheet disagree about crashes; the CPrivO rules that crash is off.
- BL-1128: F-1: PostHog Cloud is acceptable as a processor if geoip stays disabled (`posthog.ts:186`), session replay and autocapture of touches stay off, no person property carries a name, email or child detail, and the project has a signed data processing term (UNVERIFIED that the free plan offers one; if not, a no for production). F-2: EU region, decided before the first event, set by `EXPO_PUBLIC_POSTHOG_REGION=eu` because the code defaults to US (`posthog.ts:264`); region is a minimisation choice, not a legal fix. F-3: treat the pseudonymous id as Linked (the id is per person since CPrivO-15); label rows Usage Data (Product Interaction), Diagnostics only if crash is on, Identifiers, purpose Analytics. F-10: the Privacy promise is backups erased within 38 days (`data-policy.md:217`); D-159's nightly backup copy must expire inside that window; NEEDS EVIDENCE (read the backup job's retention); accept the plan risk only if it shows 38 days or less, or the promise is reworded. The PostHog account and key are physical (FOUNDER_QUEUE row 10).
- BL-1115 (FQ-01): yes to server counts at k of at least 10 from tables that already exist, no new collection; at the current size k = 10 suppresses nearly every cell, so aggregates say "unknown", never zero; no per-person row leaves the database; the reader has no access to content columns; F-9 (a plain Privacy line for server counters) is written before the first read. BL-1607: accept `child_count_bucket` (none, one, two, three_plus), awareness only, never combined with a place, picture id or date of birth. BL-1633: yes, weekly, matured cohorts only, counts only, k at least 10, no id, no child, no text. BL-1147: no crash SDK in 1.0; scrubber and tests first (BL-1139 to 1141); `CRASH_REPORTING.enabled` stays false.
- Evidence read: `packages/analytics/src/crash.ts` lines 1-20; `posthog.ts` lines 185-186, 218, 259-265; `catalog.ts` lines 15, 33; `app-store-privacy-labels.md` lines 41, 62, 63; DATA_CLASSIFICATION 802-806; D-163, D-170; CR-178 items 4a and 5; CR-185, CR-186. Not read (UNVERIFIED): `01-capture-and-first-run.md:12`, `ops.md` F1 and F4, `validate.ts`, the `before_send` reducer tests, whether any log line outside analytics prints a child name.
- Door: two-way while analytics stays off in every profile (CR-186; `store-flags.mjs` with `allowedOn` empty, BL-2004). Conditions: (1) production analytics turns on only when D-163's production gate closes AND Privacy and the label are published for it (a new major Privacy version and the `analytics` consent first, `privacy-1.0.0.md` line 32); (2) the consent default "open" of D-163 stays NEEDS EVIDENCE (Apple 5.1.1(ii)); (3) canary sweep and allowlist tests stay in `npm test` as gates; (4) PostHog host and region decided before the first event; (5) no event, property, id or error reaches a store build with entry text, transcript, audio or a child name.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-40 Photo library read stays off for 1.0 (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED.
- Ruling: 1.0 ships with the photo library read off, flag dark, because the five gates of CPrivO-29 are not green (primer lines not counsel-read, no egress test, photos-out-of-sync not shown, Export gate not done, device rows not done). This is D-169 item 3 doing its default and is the less-collecting side. Build only Export fail-closed (CPrivO-30): while Export says "everything" and writes photos as null, no photo flag; say in Export that photos are not included. Close the four primer lines as PROPOSED under PRIV-R21 and use "we do not receive", never "nothing leaves the phone" (CPrivO-31), because reverse geocoding for places may send coordinates to Apple (NEEDS EVIDENCE, CISO and mobile) and the host sees the IP (Q12). Remove the unused photo strings and fix the four store docs (BL-1858). Way back: flip the flag when all five gates close.
- Evidence: CPrivO-29, -30, -31; D-169; `privacy-1.0.0.md` lines 28, 54; `app-store-privacy-labels.md` line 53. Not read (UNVERIFIED): `flag.ts`, `eas.json` photo variable, `docs/store/compliance/*`, whether Export fail-closed has merged.
- Door: two-way. Conditions: (1) the 1.0 Privacy and label say no photo feature; (2) the listing says nothing about pictures (CPrivO-12); (3) no photo strings reachable in a store build, tested; (4) the Export line passes the content rules. Counsel must confirm the primer lines before any later flip.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-41 Moments legal drafts: draft now, publish nothing (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED.
- Ruling: draft in the PR body, publish nothing, and do not merge the Privacy line, the Terms/Privacy picture lines or the `en.plus.legal` change until BL-1434 G1a-L reports and the flags are decided. The wipe-list line and two table rows are classification and deletion coverage: approve them and merge with BL-1493 part 1, because a wipe list that names where moments data lives is how deletion stays true. Leave `en.plus.legal` unchanged and record why. Do retired-key notes on dated docs now. A published sentence about pictures before the feature exists is a promise we cannot test.
- Evidence: `DATA_CLASSIFICATION.md` view table and sync_books rows (lines 760-775); `privacy-1.0.0.md` lines 28, 54; CPrivO-12. Not read (UNVERIFIED): DATA_CLASSIFICATION 4.6, `data-policy.md` 4.4, the actual wipe list, BL-1434.
- Door: two-way (nothing published). Conditions: the wipe list covers every on-device store a Moments record uses (pictures, place labels, home place, pending state) and a test fails if a new store is missing; CPrivO-11 (pending photo discarded on every change of signed-in person) stays; counsel must confirm the picture lines before they publish.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-42 Static legal pages: all three required, text must match the app (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED.
- Ruling: yes, `/delete-account`, `/privacy-choices` and a separate `/subscription-terms` are required static pages before submission. Apple wants in-app deletion and a URL that says how and how long; the page is the promise's public home. Un-remove `/delete-account` from `REMOVED_ROUTES`. The page describes the same deletion the app does, with the same clocks and exceptions, and nothing the app cannot do. A store URL, once submitted, is a promise.
- Conditions: (1) the page says what is true of the build: where the control is, the 30-day change-of-mind window only if the purge worker runs (D-129), erased from live systems in 31 days, backups 38, processors 45 (`data-policy.md:217`), what survives (D-116 kept record, 3-year consent and deletion records, email provider 30 days); (2) it says billing continues through Apple until cancelled; (3) no sentence promises an email-started deletion (CR-187); (4) `/privacy-choices` states the facts and says nothing about "do not sell" being a toggle if we sell nothing (`privacy-0.9.0.md` line 133).
- Evidence: `docs/legal/delete-account-page.md` exists (contents not read, UNVERIFIED); `privacy-1.0.0.md` line 108; Apple's deletion page as quoted in the CPrivO skill (read 31 Oct 2026): "should not require people to make a phone call, send an email"; say how long it takes and what is retained. `legal.ts:25` not read (UNVERIFIED).
- Door: mostly two-way. Counsel must confirm the page text.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-43 Age gate: hold the retry line, reachability yes (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED, with one hold.
- Ruling: (BL-426) add the compliance-register line and the Keychain evaluation as docs only. Hold "If you answered by mistake, come back tomorrow." until the exec reading of BL-561, because it invites an immediate retry at a legal gate. The age gate stops local-only; reinstall clears it (CCO-18). Keychain storage of the stop would hold across reinstall but is a new on-device store and a new fact about a possible minor: evaluate it, do not build it, keep it on the device. (BL-1785) yes, read, play and Save a copy stay reachable during the 24-hour closure, everything else closed: this is the person's own data, and closing it would be the "deletion that only hides" anti-pattern in reverse.
- Evidence: CCO-18 (line 1436); `cto/RULINGS.md` line 483 (`under_18` closure reasons). Not read (UNVERIFIED): `compliance-register.md`, `strings.en.ts:1629`, `age-gate.test.ts`, LEGAL-REQ-002, CCO-17, `_layout.tsx`.
- Door: two-way. Conditions: the stop never stores an age, birth date or range, only the stop timestamp (D-026); the retry line does not appear until BL-561's answer; the test starts from a phone holding a book. Counsel must confirm.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-44 Age signal: memory-only build; the decision date is not the CPrivO's (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED (build, memory-only).
- Ruling: yes, build the platform age signal as the 1.0.1 lane, memory-only: read it, decide yes or no, store nothing and send nothing. The signal is a category of age, not a birth date, and our design stores only `is_adult` (D-026). It must never reach a log, analytics event, crash report or the server. Whether it is a 1.0.1 must is the CLO and CCO reading of AB 1043. Way back: do not ship; nothing is stored.
- Evidence: CPrivO skill section 4 (D-026) and section 9 (FTC age verification statement: use only for age, delete promptly, clear notice in the privacy policy). Not read (UNVERIFIED): `security.md:61` (NSC-13), ROADMAP risk 13, BL-1045, BL-1046, `apps/mobile/modules/`, the text of AB 1043.
- Door: two-way until shipped. Conditions: (1) the privacy policy names it before the build ships; (2) a test that nothing the module returns reaches storage or a network call; (3) the native module follows `expo-native-module` rules and the iOS compile job; (4) Mac, Xcode and entitlement approval are physical. Counsel must confirm that reading a platform age category is not "collecting" age for COPPA.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-45 Remote push out of 1.0 (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED.
- Ruling: rule remote push out of 1.0 and mark BL-546 deferred. With co-parent parked (D-162) there is no sender and no person to notify. A remote push means a device token at our server, a new collection that links a device to an account, and a payload path that must never carry a child name or text (PRIV-R10, R11; CPrivO-9). Local reminders need none of it. If push is ever built, split it (entitlement, token, sender, consent), with the token stored per person, deleted on sign-out and on account deletion, and the payload neutral. Way back: re-open the row; nothing is collected meanwhile.
- Evidence: CPrivO-9 (`exec/RULINGS.md:196`). Not read (UNVERIFIED): D-162, `app.config.ts`.
- Door: two-way. Condition: if `aps-environment` is declared in the store build with no push feature, the privacy label and Apple's review note should say remote push is not used (CCO). The APNs key is a console act.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-46 sync_books: accept the child name, tighten the member shape, add log gates (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED, accept the child name; NEEDS EVIDENCE on the log side.
- Ruling: accept the child name in the closed `sync_books` answer for the signed-in member. The recipient is a current member and already knows the name; the closed answer is what the account-deletion screen needs (CCO-19; migration `20261123100000` lines 405-420: closed means id, role, name, members' role, `is_me` and `signs_as` only). Tighten: file the row for one `other_parent_signs_as` and a contributor count in place of every member's `signs_as`: each is the other parent's own sign-off, a second person's data shown to someone whose consent is not recorded. The tighter shape is a new migration, never an edit of an applied one.
- The child's name is L4 (PRIV-R19); the rule that keeps it out of logs, analytics, crash reports, URLs and push payloads applies in full, and the closed answer is a path where it can silently fail. NEEDS EVIDENCE, cheapest check (one agent PR, no new collection): (1) a test that feeds a `sync_books` fixture containing the fictional name ("Asha", never a real one) through the analytics validator, the crash `before_send` reducer and the app's error wrapper and fails if the string appears; extend `canary-sweep.test.ts` with the `sync_books` response as a canary source; (2) a grep gate that fails on `console.*` or logger calls that take a `sync_books` response or its `books[*].name`, `members[*].signs_as`; (3) the CISO reads Supabase Edge/Postgres log settings to confirm function bodies and request params are not logged.
- Evidence: `packages/api/src/server/sync.ts` lines 832-880; `catalog.ts` line 15; `crash.ts` header; a grep of `apps/mobile/src/lib/sync` and `lib/account-deletion` found no `console.*` call. Not read (UNVERIFIED): the Supabase function's own server logs; a trace of the response through the HTTP client and error paths.
- Door: two-way. Conditions: (1) the gate applies to `name` and every `signs_as`, `my_signs_as`, `author_signs_as`; (2) `peek_invite` still returns only the inviter's sign-off and role to a non-member (D-111 item 8); (3) the tighter-shape row is filed under a CPrivO entry and owned by data-architect; (4) counsel must confirm presenting the other parent's `signs_as` after consent is withdrawn (BL-1920) and returning the child's name to a person whose consent is not recorded.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-47 Export: recently deleted letters only on the tick (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED.
- Ruling: recently deleted letters go into an export only when "Include recently deleted" is ticked, default unticked (`pack.ts:232`, `schema.ts:357`). A zip is made to be sent, shared or placed in iCloud, where a deleted letter would outlive the 30-day shelf in a place we cannot reach. Conflict to fix: BL-388's "Done when" and "Satisfies" and the export screen's "every letter and recording" promise (BACKLOG 1222-1228, CR-35); BL-388 is edited to say "tick", and the screen line must not claim to include deleted ones ("every letter in your book" unless ticked). The tick covers tombstoned letters of the exporter's own authorship only, never another author's (spec 4.1). Drafts and orphan recordings in a "not in the book" folder are the exporter's own working material: include them always, labelled. Split ZIP64 by year (size handling, no privacy effect). A data-access request to us (not the app) gets what the server still holds, and a deleted letter inside its 30 days is still held, so a request must include it or say we hold it (Route 3 runbook line). Way back: the tick can default to on later, a collection-wider change that needs a new ruling.
- Evidence: `pack.ts:232`, `schema.ts:357`, `schema.ts:728-732`; `DELETION_AND_EXPORT_SPEC.md` 4.1 (line 314), lines 86-106; CR-35; BL-388. Not read (UNVERIFIED): the export screen strings, Privacy section 14 text.
- Door: two-way (tick default). Conditions: (1) the manifest records `include_recently_deleted: true` when ticked; (2) a deleted letter in an export keeps its "Erased on {date}" truth and the export notes that it is deleted; (3) the export test fixture uses the fictional family "Asha"; (4) after the 30-day purge, the tick shows nothing to include; the export never resurrects a purged letter from any cache. Counsel must confirm.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-48 Storage line "A recording is still being removed." (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: RULED as written by the CPrivO. Not adopted by Karma: see CR-199, which keeps CDesO-17's approved key `listen.letGoStuck` ("A recording you let go is still on this phone.") because the CPrivO's line reads like progress and replacing an approved key needs a new ruling.
- Ruling (the CPrivO's own words): approve "A recording is still being removed." as written (plain, no count, no list, no date, no name, no text), then ready the build. It tells the person a deletion is not finished instead of letting a failed file delete go quiet, the truth the deletion promise needs. Remove now retries once. Way back: edit the line.
- Evidence: `docs/design/e2e/C-keeping-and-trust/WORDS.md:663` (`storage.stuck.line`, "never a list or count", NS-09-R6, E28); `DESIGN.md` lines 49, 259, 536, 659; BL-1446 (lines 7100-7106). `strings.en.ts:324-329, 403` and `settings/storage.tsx` not read (UNVERIFIED).
- Door: two-way. Conditions that carry to whichever approved line ships: (1) the screen never names which recording, the book, the child or a date, even in accessibility labels or logs; (2) the retry failure writes only a counter to local state (BL-977), no file name or path to any log or analytics event; (3) a recording that cannot be removed stays visible and is not described as "deleted" anywhere else; (4) the "never a list or count" rule is tested.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-49 Position on CR-187: no hand-started deletion promise (24 Nov 2026, CPrivO via Karma's session; not counsel)
- Verdict: agree. No tester-facing text may promise that we start a deletion by hand until BL-551 exists and has been rehearsed; today nobody can start one from an email.
- Read: `data-requests-by-email.md` line 7 ("Route 1, deleting an account by email, cannot be run at all: the tool it needs, BL-551, is in no migration"), lines 94-111 (Route 1 CLOSED until BL-551), line 140 (Route 2 step 7: deleting what was synced cannot be done by hand; the app hides Delete this book once a phone has signed in); `privacy-0.9.0.md` lines 104, 127, 131; CR-185, CR-184.
- Exposure in 0.9.0 until 0.9.1: (1) section 7 account line: a promise we cannot keep for anyone whose build hides Delete account (the default: `EXPO_PUBLIC_ACCOUNT_DELETION` is not written in `testflight`, on in `preview` only when the staging purge worker secrets exist, CR-186); (2) the 30, 31, 38 and 45 day sentences are marked "planned" in the text but read as a schedule; (3) section 9: withdrawal "by hand" and "we offer to delete what was synced" are not kept today; (4) section 10: the same hole for deletion requests, and access, export and correction by email are written but never run against a live project; (5) the files are hash-pinned (`legal-beta.test.ts`), so the fix is 0.9.1, not an edit. What bounds it: CR-183 ships `testflight` with servers off (Erase everything on the phone is the deletion), and CR-184 limits servers-on builds to the named household.
- Conditions: no text says "we will start the deletion by hand" or gives a number of days for a deletion we cannot open (the CPrivO: say where the control is, and for builds without it that we have no way to start it from an email yet; no date promise on the deletion); section 9 and section 10 get the same switch-based wording in the same 0.9.1; tester documents (`TESTFLIGHT_TESTERS.md` 5.2 build 2 row, CR-185 CMO item) do not tell testers to use a hidden row. Door: two-way; when BL-551 exists and Route 1 is rehearsed, a later version restores the hand-started line. Not read: the CR-187 candidate text itself (UNVERIFIED). Counsel must confirm that "we will do it by hand" in a test text is not an enforceable promise already made; the CPrivO treats it as one.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CCO-21 Erase everything line and the CLO-22 hold lift: conditions (24 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: RULED (with conditions; one part NEEDS EVIDENCE). No CCO approval line, comment or review has been posted anywhere for this batch, and none is implied.
- Ruling: clear "Erased from this phone. Backups and exports you already saved are not changed." as the Erase everything line, drop "for good", and let the CLO-22 store-build hold lift when the conditions below are recorded in one Karma entry. "For good" is wider than the code (the line is reachable only on a never-signed-in phone, where only this phone's copy goes). Keep "We hold no copy." and "Nothing is sent anywhere." only where `localDeletionAllowed` holds. Way back: restore the old string in one PR.
- Conditions: (1) D-169 item 5 says BL-1805's wording stays held and BL-1854 stays out of store and TestFlight builds until cleared; under D-168 and CR-176 the exec team replaces an earlier entry only by a new entry, so Karma records the lift as an entry that names D-169 item 5 and CLO-22, not as a silent edit; the 27 Nov wait date in D-169 was for counsel and D-172 makes counsel the exec team's own review; (2) Q51, Q32 and Q48: no recorded answer to Q51 or Q32 was found, Q48 appears only as "not ruled here" (line 819): NEEDS EVIDENCE; the CLO and CPrivO write the Q51 answer into RULINGS before BL-1857 and BL-979 move; BL-979 stays blocked until then; (3) "Nothing is sent anywhere" must be backed by a test that no network call happens in the erase path (`erase-all.test.ts` not read, UNVERIFIED); if it does not, drop that sentence.
- Other parts: delete-account intro (BL-1857): adopt the sentence that another parent's letters are not deleted with the book and the name and dates are kept only to label them (matches `privacy-policy.md:116`, `delete-account-page.md:57`, `purge_book_keep_authors`). Held deletion (BL-447): "We're still finishing your request" may promise an email only if an email is in fact sent on completion (UNVERIFIED: grep `supabase/functions` and `packages/emails` for the deletion-complete template); the line must not say or hint "legal hold" (`data-policy.md:221`). Terms 8.1 one-sentence reset disclosure and the Keychain count: factual, accepted for the exec reading; legal text, held until Karma records the D-172 reading. BL-471 closes as stale.
- Evidence: BL-1805, BL-1854, BL-1857, BL-447, BL-780; CLO-22; D-144, D-169; `strings.en.ts` lines 964-1002 (the new line is not in the file yet).
- Door: wording two-way; published Terms and policy text slower to retract. Counsel must confirm that the Erase everything line and the Terms 8.1 sentence are not misleading to a signed-in person (packet Q51), and that a Keychain count kept across Erase everything is described honestly.
- Founder-only: no. Signed: Chief Compliance Officer (Claude role, not counsel)

### CCO-22 Production policy rows: 1.0.0 only, per-file acceptance conditional (24 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: RULED (the version question); the per-file acceptance is a condition, not yet given.
- Ruling: no 0.9.0 row goes to the production `policy_versions`: 0.9.0 was published for TestFlight testers at a versioned address (D-138 item 1, D-144 item 3) and stays frozen. Production gets 1.0.0 only, for `terms`, `privacy` and `sensitive-data`, and only after the exec reading records accept or reject per file. The CCO has not read the four drafts in full and accepts nothing on their behalf. A version number is never reused (POLICY_VERSIONING 2.4), so a wrong first row is paid for in a new version and, for terms and sensitive-data, a re-consent.
- CCO-lens conditions per file: (1) every `[EXEC-TEAM COUNSEL ...]` and `[FOUNDER]` mark resolved and removed, the PROPOSED banner and frontmatter review line out; the sha256 is taken on the exact published bytes (the hashes in `policy-1-0-0-rows.md` section 2 are for drafts with banners and will not match); (2) Terms 2.1 (18 or older; keeps only the time of the No answer, on the phone) matches D-026 and the build as CCO-17, -18, -20 left it; Terms 2.4 and section 18 match D-131 (KP, IR, CU, SY, RU, BY at sign-up; the four Ukrainian regions covered by the Terms confirmation only); the Texas bracket in 2.1 is resolved, not deleted, and the text may not promise a Declared Age Range check that is not built; (3) each claim in the claims-to-code table has a code or test reference; a claim with no evidence is a Gap and comes out of the text; (4) Privacy 1.0.0 matches the production build profile (servers and accounts on; analytics, backup, photos and Google off), checked at the release tag; (5) initial versus major (Variant A or B in `policy-1-0-0-rows.md` section 1) depends on whether production holds any 0.9.0 row: NEEDS EVIDENCE (FOUNDER_QUEUE row 6 and `supabase/APPLY.md` suggest Variant A; Karma reads the apply log; the SQL insert is a physical act).
- Platform retakes sha256 on the published bytes at the release tag; the CCO accepts the pack's owner suggestion and asks that the name of the person or agent goes in `CLAIMS.md` or RULINGS.
- Evidence: `policy-1-0-0-rows.md` sections 1-2; `terms-1.0.0.md` lines 1-14, 24, 42, 48, 185; POLICY_VERSIONING 2.4; BL-338, BL-365, BL-1957, BL-1973; D-138, D-144, D-172.
- Door: NO for the published row. Counsel must confirm that the first published text satisfies Apple 5.1.1(i) and the state notice duties, and the initial versus major reading (V-1).
- Founder-only: no. Signed: Chief Compliance Officer (Claude role, not counsel)

### CCO-23 Small legal-text edits: four accepted, LNG-18 held (24 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: RULED (four parts accepted; one part conditional).
- Ruling: accept BL-1993 (replace "waits on your phone" with the current held-letter meaning, nothing else in 8.1), BL-1994 (two L2 rows; the migration exists and the table matches, not diffed), BL-1239 (existing DATA_CLASSIFICATION rows plus one SDK-queue row, privacy to confirm) and BL-1188 (an issued access token lives out its 15 minutes after a session ends; true: `config.toml:42` `jwt_expiry = 900`, AUTH_SETTINGS row 8). Accept BL-527 rows LNG-04, LNG-09 and LNG-12 and record "no licensed lawyer has read them". Hold LNG-18 until the check below. These are factual edits that bring text in line with the build, except where a sentence claims more than the machine's edit types.
- LNG-18 (NEEDS EVIDENCE, cheapest check is reading the `stt_fix` guard): "We only fix small slips, like an um, a repeat or a misheard word". `stt_fix` may only replace a span with a dictionary term (`types.ts` comment; `verify.ts:14`) and Terms 6.1 says "correct a misheard name to one in your names and words list"; "a misheard word" read plainly is wider. BRAND.md lines 27 and 102 set that sentence as the house line, so a possible over-claim spans several surfaces. Not ruled a violation; the fix is a content decision for the CLO and content. Before the rewrite is accepted, the CLO confirms `stt_fix` replacements are in practice limited to words in the person's list (read the verify tests), or the line is narrowed on every surface at once; the registered disclosure text needs its version bump and pinning tests in the same PR.
- Legal-text edits publish only after the D-172 reading is recorded and Karma merges (D-168 item 5). BL-1188: counsel must see the wording before publish.
- Evidence: BL-1993 (10618), BL-1994 (10627), BL-1239 (6223), BL-527 (2524), BL-1188 (5668); `COUNSEL_LOCKED.md` lines 11-22 (LNG-15 already applied); `terms-of-service.md` lines 82, 98 (Terms 8.1 read from the backlog quotation only).
- Door: two-way before publish. Counsel must confirm that "no licensed lawyer has read them" is recorded honestly on each row.
- Founder-only: no. Signed: Chief Compliance Officer (Claude role, not counsel)

### CCO-24 No phone number or SMS in 1.0 or 1.0.x; BL-1909 not ruled by the CCO (24 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: RULED.
- Ruling: take the inflight position. No phone number is collected and no SMS is sent in 1.0 or any 1.0.x. LEGAL-REQ-012's "phone number" stays on the never-collected list, BL-1909 is not ruled by the CCO, and BL-1897 stays needs-decision without a date. CR-062 stays "No" with a dated line that it was re-run on 24 Nov 2026 and there is no SMS in 1.0.x; the re-run before any SMS is still required. The CCO does not adopt the blocked-2 position: approving a field in principle on facts not yet read is the first step toward a one-way door. Way back: when BL-1896's vendor facts are read from the vendors' own pages and BL-1897 is answered, a later entry can approve Phase A (optional, after the first letter).
- Reasons: (1) 18+ gate: a phone number tells us nothing about age; it is a new identifier, widens "actual knowledge" handling and the under-13 runbook gains a data type to delete within 10 days; (2) blocked countries: D-131 blocks by IP country at sign-up, there is no name screening (CCO-5); a calling code is not residence, and an SMS to a handset in a blocked country is an exposure the sign-up hook never saw; (3) facts not read: no vendor price, country list, fraud tool or registration rule; US SMS rules (consent text, carrier registration, TCPA, opt-out words) never read from a source (UNVERIFIED); (4) Apple 5.1.1(v) and (x) (as quoted in card 29, not re-read): contact information only if optional and features not conditional on it; a number still adds Phone Number, linked, collected to the privacy label (BL-1900); (5) D-171 and CR-180 already say the NS-41 "never SMS or a phone number" line changes only after BL-1897 is read and BL-1909 is done.
- If SMS ever proceeds, the CCO's conditions: the Send SMS hook refuses blocked-country calling codes before send, with a content-free count; phone only as an optional factor after the first letter, never a way in (NS-54 non-goal); BL-1899 and BL-1900 first; CR-062 re-run with a recorded reading; sender registration before any real send. The SMS monthly cap is the CFO's; the vendor is a physical act.
- Evidence: the spike sections 1-5; card 29; LEGAL-REQ-012 (line 116); register CR-062 (line 121); BL-1897 (9793), BL-1898 (9799), BL-1899, BL-1900, BL-1909 (9919); D-171; CR-180; D-131.
- Door: two-way while no number is stored; NO once stored. Counsel must confirm: TCPA and carrier-registration duties before any real send; whether a phone number changes the App Privacy answers.
- Founder-only: no. Signed: Chief Compliance Officer (Claude role, not counsel)

### CCO-25 Photo library read off: recorded now; conditions (24 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: NOT A QUESTION for the default (D-169 item 3, CR-178 item 1); RULED for the rest.
- Ruling: ship 1.0 with the photo library read off. D-169 item 3 already decides it and CR-178 item 1 says how an off flag is held (named gate, `allowedOn` empty, never `production`); the code agrees (`scripts/release/store-flags.mjs:21`). It may be recorded now rather than on 27 Nov; the outcome is the same. Way back: change the gate list in one line (CPrivO-29).
- Conditions: the four primer lines are PROPOSED under PRIV-R21 and use "we do not receive" rather than "nothing leaves the phone" (the egress test and `photo_bucket_closed.test.mjs` are listed as not built, `security.md` NSC-11). Export fail-closed: photos written as null and the export says so; before the fix ships, any store or in-app line that says Export includes pictures is untrue and comes out (BL-1858). Nothing in this ruling lets photo content reach analytics, logs or crash reports.
- Evidence: D-169 items 3 and 4; CPrivO-29; `store-flags.mjs:21`; CR-178 item 1; BL-1830, BL-1838, BL-1858 by pack description only (UNVERIFIED). Whether Export fail-closed is merged: UNVERIFIED.
- Door: two-way (a flag). Counsel must confirm the primer lines (PRIV-R21) before the flag ever flips.
- Founder-only: no. Signed: Chief Compliance Officer (Claude role, not counsel)

### CCO-26 Website release to main: claims and legal text conditions (24 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: RULED (cut one web-only release PR to main; one physical act stays in the queue).
- Ruling: cut a web-only release PR to main before build 2 signs anyone in. The emails point at `/open` (BL-510: 14 emails use `{appUrl}`) and the Universal Link path must exist or sign-in links fail; the "Send a new email" correction (BL-509) removes a line naming an error the app never shows. Both are accuracy fixes. Way back: redeploy the previous Vercel deployment.
- Conditions (the CCO gate: store and tester text must match the build): (1) the release diff touches only `apps/web` and its tests; the contents of main (702e7df98 per the pack) are UNVERIFIED, so check with `git diff main..develop --stat`; (2) no legal text publishes by this route unreviewed: if `apps/web/content/legal` or any `/terms`, `/privacy` page differs between main and develop, the diff is exactly the 0.9.0 files already published or it waits for the D-7 reading; (3) the CMO's claims registry (`docs/legal/CLAIMS-1.0.md`) is checked against the site copy in the diff, so the live site does not claim Google, analytics, backup, photos or any feature the production profile has off (D-170 item 1; CR-178); (4) physical act: the Vercel `APPLE_TEAM_ID` and `IOS_BUNDLE_ID` values and the two curl checks are already on the sheet as Q2-06 (`FOUNDER_QUEUE.md:326`); the AASA path is not live until then; whether the production deploy needs a Vercel sign-in beyond that is UNVERIFIED.
- Evidence: BL-509 (2404), BL-510 (2411); FOUNDER_QUEUE line 326; `legal.ts:25`. PRs #807 and #808 and `docs/ops/RELEASE.md` not opened.
- Door: two-way. Counsel must confirm: nothing here is a legal fact beyond the claim-accuracy duty (Apple 2.3; FTC Act deception principles, not read).
- Founder-only: no. Signed: Chief Compliance Officer (Claude role, not counsel)

### CCO-27 Static legal pages: delete-account is D-042; the other two ruled yes (24 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: NOT A QUESTION for `/delete-account` (D-042); RULED for the other two pages.
- Ruling: `/delete-account` is decided by D-042 (Proceed yes) and BL-243 says it must be live before submission (FT-31); un-removing it from `REMOVED_ROUTES` (`legal.ts:25`) is the implementation. D-042's rationale names Google Play (CR-091) and says "Apple requires in-app deletion, which ships", so the page is not an Apple requirement as written there (UNVERIFIED against Apple's page); it is still right because the policy and emails link to it and a store-listed URL is a promise. `/privacy-choices`: yes, a short page on how to exercise rights and withdraw consents and nothing the build cannot do (POLICY_VERSIONING:103). `/subscription-terms`: yes, a separate page, because emails and the StoreKit test file link it (BL-512) and a 404 behind a purchase screen is worse; pointing the links at `/terms` is acceptable only if a Plus section exists there. Way back: remove the route and point links at `/terms`; decide before submission.
- Conditions: (1) `/delete-account` copy describes what the build does when live: in-app deletion, the 30-day change-of-mind window, the retained former-member letters and book label (D-116), and the email route handled by the runbook; it goes live only when the deletion path and drill hold (CR-178 item 5, D-170 item 4); (2) `/subscription-terms` serves the same exec-read text and bytes as the 1.0.0 draft after the D-7 reading, not the older 4.1.0 revision; Apple's auto-renewal disclosure rules (3.1.2, Schedule 2) not read, UNVERIFIED; (3) `delete-account-page.md` says `status: draft-for-counsel` (1.1.0): it needs the D-172 reading before the page publishes.
- Evidence: D-042 (DECISIONS:285); BL-243 (718), BL-512 (2424); `legal.ts:25`; `delete-account-page.md` lines 1-12; `ENGINEERING_REQUIREMENTS.md:243`; POLICY_VERSIONING:103.
- Door: mostly two-way. Counsel must confirm: Apple and (later) Google Play deletion-URL requirements; auto-renewal disclosure requirements; California renewal-notice points open in CCO-3.
- Founder-only: no. Signed: Chief Compliance Officer (Claude role, not counsel)

### CCO-28 Age gate: register lines yes, "come back tomorrow" no, reachability in 1.0.1 (24 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: RULED (BL-426 doc part yes, sentence no; BL-1785 yes in principle, sequenced after submission). This is the age gate; CCO-17, -18, -20, LEGAL-REQ-002 (P0) and D-026 are not changed.
- What the build does today: `answerGate('no')` stores only `ageGate.stoppedAt`; `decideGate` returns `stop` for `BLOCK_MS` (24 hours). During those 24 hours the stop screen shows one line, and "I answered by mistake" appears only after the window passes (`age-gate-screen.tsx:119-135`); it reopens the question with nothing preselected (J02-05). BL-2008 (the e2e-web flow stays on the stop screen) is a QA question this ruling does not touch.
- BL-426: do the doc part now: add to `docs/legal/compliance-register.md` that the stop lives in local settings and uses the device clock, and evaluate the Keychain for the stop (CCO-18 records that a reinstall clears it; packet Q45 and Q46 decide whether that is acceptable). Do NOT add "If you answered by mistake, come back tomorrow." LEGAL-REQ-002 requires the question be neutral ("no pre-selected answer, no hint that one answer is 'right'") and the stop screen is "the only screen in the app allowed no way forward, by law" with "no 'come back tomorrow'" (`EXPERIENCE_PASS_2026-10.md:112`). A sentence that tells a person how to get the question back reads to someone under 18 as the way to try again with a different answer, the retry the anti-retry rule exists to stop, and hints that "No" was wrong. The button after 24 hours is itself the way back. BL-426's Done-when is edited to the register lines only. Way back: counsel (the exec team under D-172) can approve a worded sentence later as one registered line (CCO-17 way back).
- BL-1785: yes, read, play and Save a copy reachable during the closure, everything else closed, which makes CCO-17's "unreachable is a defect" true in the code (run sheet BL-487 found it by code reading only, UNVERIFIED on a device). Sequencing differs from the pack: the `age` consent step appears only "when Terms are current but the attestation is missing" (`machine.logic.ts:19,123-130`), so the affected people are legacy accounts (early family and alpha testers; how many: UNVERIFIED). The change touches the one file path the fence calls CCO-review (`apps/mobile/src/lib/age-gate*`, `components/gate/**`; `compliance/FENCE.json` `cco_review`) and a P0 requirement, days before submission, for a population support can serve by email. So not in the 1.0 submission build; 1.0.1, or earlier only if the check below finds public accounts can reach the step.
- Conditions for 1.0.1: the carve-out is a route that skips the gate for list, read, play and Export only (not recording, a new letter, sign-in, sync, invites, Settings, Plus or deep links; D-026 root-level boot gate); a test starts from a phone holding a book and a passed gate, answers No at the age step, and shows read and Save a copy open and every other screen closed; the stop line is still the first thing shown and any new button is new copy through WRITING-GUIDE and `rules.test.ts`; LEGAL-REQ-002's "they never get first run, recording, a local book" is amended in `docs/legal/` through the D-168 route (a phone that already holds a book is not a fresh install); no new stored field; closure timing and clock-repair rule unchanged; the PR takes the CCO-review tier (no approval line is posted by this entry).
- NEEDS EVIDENCE (owner QA or mobile): read `consent.ts` and the steps computation in `machine.logic.ts:123-130` against a brand-new account to confirm a new account never gets the separate `age` step; if it can, the carve-out moves into 1.0.
- Evidence: BL-426 (1527), BL-561 (2546), BL-1785 (9053), BL-2008 (10713); CCO-17, -18, -20. Counsel must confirm: that a 24-hour local stop meets the neutral-screen and anti-retry expectations (packet Q45, Q46); the FTC COPPA FAQ points D.7 and H.3 are cited from the skill (read 31 Oct), not re-read.
- Door: two-way.
- Founder-only: no. Signed: Chief Compliance Officer (Claude role, not counsel)

### CCO-29 Age signal: build it, default is a 1.0.1 must; FENCE.json gap found (24 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: RULED (build the age signal as a 1.0.1 must unless the AB 1043 reading says otherwise by 1 Dec); AB 1043 primary text NEEDS EVIDENCE; FENCE.json gap for `modules/age-range`.
- Ruling: build it, memory-only, as the first lane after submission, and treat it as a must for a build that ships before 1 Jan 2027 until the exec read of the AB 1043 primary text says it is not. The pack makes the read decide by 1 Dec; the CCO turns it round: the default is must and the read can release it, because of lead time (a Mac with Xcode 26.2, an App ID capability, an entitlement approval, an App Review cycle). Two laws, not one: Texas SB 2420 is already in force for new Texas accounts (register CR-004; Apple's effective date for its tools 4 Jun 2026; CR-004 is a Gap since 3 Oct). So 1.0 ships with a known Texas gap, and the real decision is to accept the residual risk until 1.0.1 (a CCO section 5 class); the CCO recommends accepting it: adults-only, self-attested 18+ gate, nothing stored about age, and the build that can read the signal does not exist; defensible only if the date to ship the signal is held.
- Primary sources not read: AB 1043 and SB 2420 (leginfo did not resolve; the host has to be allowed for the session). What exists is secondary (register CR-005 "Secondary [L15]"; skill section 9, Kelley Drye FAQ, "UNVERIFIED at the primary level"): AB 1043 operative 1 Jan 2027, a developer must request an age signal on download and launch, receiving one is "actual knowledge" of the age range, AG penalties up to $2,500 per affected child (negligent) and $7,500 (intentional). All of that is unverified. ROADMAP:97 marks the risk "Unknown, medium". Cheapest check: Karma allows `leginfo.legislature.ca.gov` in the session network and the CLO and CCO read the operative sections in one sitting before 1 Dec.
- Design conditions: (1) in memory only, one of three strings out of the Swift module (NSC-13, not built; a source scan fails on any return of a range, bound, date or error text), never written to storage, logs, analytics or crash reports; (2) a minor signal ends in the existing stop path without the "I answered by mistake" way back, re-derived at each launch in memory (reusing `ageGate.stoppedAt` is a data-classification call for the CPrivO); (3) no or unknown signal (iOS 17 to 25, declined, error) falls back to the existing 18+ self-attestation; never blocks an adult, never passes a minor on its own; Android later; (4) no parental-consent flows or consent-withdrawal notification: no minors' mode is offered (CR-004 control column); counsel must confirm; (5) FENCE GAP: `compliance/FENCE.json` `cco_review` covers `apps/mobile/src/components/gate/**`, `src/lib/age-gate*`, `src/**/*age-signal*` and `*declared-age*`, but BL-1030 puts the code in `apps/mobile/modules/age-range`, which matches none of them; adding `apps/mobile/modules/age-range/**` is needed, FENCE.json is itself protected, and the change goes in before BL-1030 lands (see CR-197: BLOCKED); (6) whether reading the age range in memory changes the App Privacy answers is the CPrivO's (UNVERIFIED); nothing says the app "verifies age" or "checks age with Apple" until the build does it; (7) a signal that says under 13 triggers the under-13 runbook (delete within 10 days, LEGAL-REQ-002), with the path written before ship.
- Start now what is not physical: BL-1045 and BL-1046 (agent work, both "proposed", Karma sets them ready), and the three physical items queue once as one row in `FOUNDER_QUEUE.md` (Mac with Xcode 26.2, App ID capability, entitlement approval).
- Evidence: BL-1030 (4339), BL-1031 (4346), BL-1045 (4444), BL-1046 (4451); `security.md:61`; ROADMAP:97; register CR-004, CR-005 (lines 59-60); `compliance/FENCE.json`; LEGAL-REQ-002; D-026; skill section 9.
- Door: two-way until shipped; afterwards removing the signal request is a build change plus a possible label change. Counsel must confirm: whether AB 1043 and SB 2420 reach an adults-only app with a self-attested gate, the actual-knowledge effect of receiving a signal, and the iOS 17 to 25 position.
- Founder-only: no. Signed: Chief Compliance Officer (Claude role, not counsel)

### CISO-8 Store-cut gates for sign-in and abuse: the narrow BL-595 (24 Nov 2026, CISO via Karma's session; not an auditor)
- Verdict: RULED (reconciles the BL-1041 versus BL-595 disagreement). Exposure: L3 emails and accounts (A4 account takeover by code guessing, A7 abuse of the email send); live from the day sign-in is public.
- Ruling: the CR-47 trigger is passed: D-157 and D-170 make sign-in public in the store build, so the 9 Nov go/no-go is superseded and its security rows are ruled here. Gate the store cut on BL-595 in a narrow form: 8-digit email codes (the build reads `EXPO_PUBLIC_EMAIL_OTP_LENGTH=8`, the dashboard changes the same day, AUTH_SETTINGS rows 1 and 4), the per-IP verification limit at 15 per 5 minutes, and a dated read-back of the hosted values; plus BL-583 (per-project applied record, before the first production apply BL-1873) and the unverified-24-hours half of BL-581 (the CDO rules the data side). Defer the Turnstile bot check (BL-1041) and a server-side per-address wrong-code count to 1.0.1. Supersede BL-596: an allowlist cannot coexist with public sign-in. Carry BL-596's CAPTCHA part into BL-1041 (one CAPTCHA row, not two), keep BL-248 in v1.2 with T5-10, and file the per-address count as BL-595b (1.0.1).
- Why: today a wrong code is counted only in the phone's memory (`pending.ts`, CISO-4) and the server limits verification per IP only (`config.toml:57`, 30 per 5 minutes). The CISO's arithmetic, not a measurement: with 6 digits and a 15-minute code, one IP gets about 90 guesses a code life, so guessing one code needs on the order of 5,500 IPs for even odds; with 8 digits and 15 per 5 minutes, on the order of 1.1 million. That is a setting, not a new component; Supabase has no native "five wrong tries" setting that could be read (spike section 4, UNVERIFIED). Turnstile is size L with a new subprocessor (Cloudflare has only an R2 row today), a label change and text to read; AUTH_SETTINGS row 17 says turning it on before FP-20 is in a build breaks every email sign-in.
- Objection answered ("O-7, CL-070 and BL-596's own text want CAPTCHA before outside sign-in"): true, and this ruling departs on purpose; the exposure CAPTCHA closes here is email-send abuse (availability and sender reputation), not L4 exposure, and a one-week schedule cannot carry an L-size build plus legal text.
- Residual risk, carried by Karma under CR-176: anyone holding the publishable key can use up the project's `email_sent = 100` an hour (`config.toml:55`) and make us email arbitrary addresses at one per address per minute. Detective control: the weekly limits check (D-159) adds the peak emails-per-hour, count only. Trigger to make BL-1041 a gate for the next build: the hourly cap is hit twice in one week, or a Resend complaint or bounce alert fires.
- Evidence: BACKLOG 2776-2795, 4416, 2755; AUTH_SETTINGS rows 1, 4, 5, 17 and section 4; `config.toml` lines 28-80; `apps/mobile/src/lib/auth/email.ts` lines 17, 28-37; D-157, D-170; CISO-4. UNVERIFIED: every hosted value (AUTH_SETTINGS says all "Hosted now" cells are [U]); whether GoTrue itself locks after N wrong codes.
- Door: two-way for the deferrals. Conditions: (1) a FOUNDER_QUEUE row for the console step (OTP length 8 and verifications 15, same day as the build) with the read-back dated in AUTH_SETUP section 2; (2) a build that carries 8 digits goes out before the dashboard flips (AUTH_SETTINGS section 4 step 1); links keep working in older builds; (3) `auth_config.test.mjs:74,83` and `config.toml` change in one PR after the console step.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-9 Analytics and crash: five security conditions (24 Nov 2026, CISO via Karma's session; not an auditor)
- Verdict: RULED (security conditions; the privacy and data rulings are the CDO's and CPrivO's). Exposure: L2 events plus a pseudonymous id at a new vendor (A6); a crash SDK is the path most likely to carry content by accident; latent while analytics stays off.
- Ruling: analytics and crash capture stay off in production until their own gates close. No crash SDK ships before the scrubber and its tests (BL-1139 to 1141); `CRASH_REPORTING.enabled` stays `false` (`packages/analytics/src/crash.ts:19`) and a test pins it. The PostHog SDK, when it arrives, is added with an exact version, a lockfile entry and an audit entry with an expiry (SEC-R08), with autocapture, session replay and the Apple tracking prompt off (D-163 item 5e). The project key must start `phc_`; a `phx_` personal key in any EAS variable, repo file or build output fails preflight. The one personal API key (`POSTHOG_PERSONAL_API_KEY` for `analytics-forget`, `handler.ts:85`) is scoped to person deletion on one project, typed into the Supabase console only, and its log lines stay counts (`ids.length`, line 171). The weekly insights agent holds read-only keys and no write connector (SEC-R26, AIE-R21).
- Why: the privacy rule (no entry text, transcript, audio or child name in analytics, logs or crash reports) is only as strong as the weakest sender; the SDK and the crash path are where a message string or a path with a name gets in. Keys of the wrong class are the usual leak. Residual risk: a scrubber is a denylist-shaped control; the allowlist in `catalog.ts` is the stronger one, so crash events stay off until the scrubber has fuzz tests with planted names.
- Evidence: `crash.ts` lines 1-30; `analytics-forget/handler.ts` lines 19-24, 85-87, 162-171; D-163 (DECISIONS lines 1194-1215), D-170 (1346-1370: `posthog-react-native` is not yet a dependency); `ENGINEERING-REQUIREMENTS-21nov.md:105` (ER-A10); `FOUNDER_QUEUE.md:63`. UNVERIFIED: the PostHog key scopes available for a person-delete-only key.
- Door: two-way while analytics stays off. Conditions: the preflight `phx_` check and the `enabled:false` pin are two named tests in the build rows (BL-1147, BL-2003); the PostHog account and key are physical (FOUNDER_QUEUE row 10).
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-10 Phone number and SMS: challenger position, no in 1.0 or 1.0.x (24 Nov 2026, CISO via Karma's session; not an auditor)
- Verdict: RULED as challenger position (the CLO, CCO and CPrivO rule the legal side; Karma rules the LEGAL-REQ-012 relaxation).
- Position: no. Rule "no phone number or SMS in 1.0 or 1.0.x", keep LEGAL-REQ-012's "phone number" under never collected (`ENGINEERING_REQUIREMENTS.md:117`), defer BL-1898 (spend) and leave BL-1897 as a reading to do when a build exists. The blocked-2 recommendation (approve a phone as an optional verified field now, then relax LEGAL-REQ-012) is premature: the controls it needs do not exist and the vendor pages were never read (spike section 2).
- Strongest objections, in order: (1) a verified phone is a weak identity proof (SIM swap, number recycling; the spike says never for recovery, step-up or sign-in, 7.9); it buys friction, not account security, and D-6 covers abuse with settings; (2) SMS pumping and spend: one hourly project cap (`sms_sent`, default 30) and a per-IP limit that bursts 30 at once; vendor fraud tools and hard-cap behaviour unread; (3) an enumeration oracle: Native Auth refuses a duplicate number with 422 `phone_exists` before any send (spike 7.10), so NS-54-R23 cannot be met without a new gateway or edge function in the sign-in path; (4) a new identifier and subprocessor: the number lands in `auth.users`, the audit log and the vendor, retention unread; the Send SMS hook sees the number and the code; (5) account takeover paths: the `phone_changed` notice is off in `config.toml` and sends nothing for the first number (spike 7.5); (6) the wrong-code count and code lifetime cannot be met natively and the lifetime figures conflict (UNVERIFIED); (7) a one-way door once numbers are stored; it reverses a written rule (LEGAL-REQ-012; PRD 19 line 845) and sits in tension with CR-180; (8) a required number excludes people with no phone or a foreign one (R30); Phase B or C is not something the CISO would support on the evidence read.
- If it is ever built (conditions for a later ruling): optional factor only, after the first letter; never a way in, recovery or step-up; a gateway allow-list in front of Auth so unauthenticated `/otp`, `/signup` and `/resend` with a phone are refused; server-side counts for wrong tries per account and per number; the vendor's hard cap set and its fraud controls read from its own pages; `phone_changed` notices and a request-time email built; test numbers only in local config with a production pin; the Send SMS hook never logs its payload. The founder's stated preference is a direction for a later phase, not an instruction for 1.0 (CR-176 lets the exec team weigh it).
- Evidence: the spike (all 140 lines); LEGAL-REQ-012; BL-1897 to BL-1910; register line 121; PRD 29 lines 12-16, 47, 58-60, 158; PRD 19 line 845; CR-180. UNVERIFIED: all vendor prices, fraud tools, retention and registration rules.
- Door: two-way only while no number is stored. Still to rule by others: CLO, CCO and CPrivO on consent, TCPA, labels and LEGAL-REQ-012; CFO on a monthly cap if it ever proceeds.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-11 Release gates, CI and EAS: three sub-rulings (24 Nov 2026, CISO via Karma's session; not an auditor)
- Verdict: RULED. Exposure: store and tester builds that carry accounts (L4 reaches the server); workflow and EAS files are the security paths.
- Ruling: (1) B2-13 counts only an end-to-end account-deletion run on staging with `EXPO_PUBLIC_ACCOUNT_DELETION` on and verification that finds no residue; a servers-on build does not reach an external group or Beta App Review until that variable is on and B2-13 has passed. The preflight must stop printing PASS for the Delete account row on a servers-on build it cannot see: at `preflight-testflight.mjs:190` the "hidden" PASS line becomes UNVERIFIED when `SERVER_ON`, and for a store profile with servers on and deletion not on it should FAIL once BL-1867 writes the value. (2) Karma applies the `ci.yml` trace step himself (CR-176 item 5) with one change: pass `github.base_ref` through an `env:` entry and quote `"$BASE_REF"`, never the inline `${{ }}` in the script text (as `migration-guard.yml:36` does). Q8 is answered "ratchet only". (3) The `perf` EAS profile may exist if it is not a store profile in practice: `distribution` internal, no `perf` entry under `submit` in `eas.json`, servers and analytics off in its env, and the perf flag is a row in `store-flags.mjs` with `allowedOn` exactly `['perf']`, so the existing test fails any store profile that carries it.
- Why: account creation is on (D-170), so a build that creates accounts but hides its way out is a data-rights and Apple 5.1.1(v) problem, and the preflight reports a state it says it cannot read. The inline `${{ github.base_ref }}` is the standard Actions script-injection pattern. A profile cloned from `testflight` inherits `distribution: store`, and `storeProfiles()` counts "store or not written" as a store profile.
- Evidence: `ALPHA_GO_NO_GO.md:55` (B2-13 never waived); `TESTFLIGHT.md` lines 150-162; `preflight-testflight.mjs` lines 147, 182-193; `docs/ops/proposed/trace-ns-ratchet.md`; `ci.yml` lines 7-17; `migration-guard.yml:36`; `eas.json`; `store-flags.mjs` lines 1-16, 60-80; BL-507, BL-1869, BL-1047. UNVERIFIED: whether `trace.mjs --check` has a ratchet-only flag (Karma's call; if none, the five v2 ids are fixed or baselined first).
- Door: two-way. Conditions: the preflight change has a test that fails on the old line; the `perf` build row (BL-1047) names the three guards as tests.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-12 Email sign-in link arriving before session restore (24 Nov 2026, CISO via Karma's session; not an auditor)
- Verdict: RULED. Exposure: an email sign-in link (a bearer token) arriving while the saved session is still being restored; A4 and the H1 attack in BL-347.
- Ruling: hold the link in memory until restore settles, then process it once through the same `openEmailLink` path; if restore settles signed in, the existing refusal stands ("a link never replaces a session", F02-U27); if signed out, the pending-request check and PKCE decide as today; if neither settles within a short bound (10 seconds, a proposal), drop the link and show the normal sign-in screen with the typed-code route. Never persist the token hash; never log it.
- Why: today a cold start from the link reads the Keychain (`sessionSavedOnPhone`, `session-provider.tsx:509`) and counts a saved session as signed in, so a link that arrives before a failing refresh is refused and lost. Holding changes timing only: the three layers in `email-link.logic.ts:1-30` (pending record, PKCE verifier, claim screen) still decide, so the H1 protection is unchanged. Dropping a bearer token is the safe failure; keeping it on disk is not.
- Evidence: `email-link.logic.ts` lines 1-30, 76-143; `session-provider.tsx` lines 501-545; ADR 0023; BL-1507. UNVERIFIED: the exact restore states the provider exposes at the moment of the hold.
- Door: two-way. Way back: revert to refuse-and-drop. Conditions: start from a failing test, plus a test that a link arriving during restore with a different account saved is refused after restore, and a test that no storage write holds the token. Residual risk: the bearer token sits in memory for up to ten seconds; the process is the app's own and the token is single use and 15 minutes old at most.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-13 Ratify ADR 0023 (PKCE) with a stated residual (24 Nov 2026, CISO via Karma's session; not an auditor)
- Verdict: RULED.
- Ruling: ratify ADR 0023 (email links: PKCE, and when a link is accepted). The code already runs it (`apps/mobile/src/lib/supabase/client.ts:111`, `flowType: 'pkce'`). Status becomes Accepted with "device check AUTH_SETUP 11.10 pending", not "verified": that check is a physical act (FT-22) and until it is read the ADR's "U" items stay unverified.
- Why: the ADR gives three layers that each stop the H1 attack (a link requested on another phone signing this phone into the sender's account): a pending note, PKCE and a claim screen. The review that drove it was Critical and the code is merged.
- Residual risk accepted: Hermes has no `crypto.subtle`, so auth-js sends the challenge as `plain` (ADR "Challenge method plain"); enough for H1 because the attacker holds a different flow and the challenge travels phone to Supabase over TLS. Revisit when the platform has a real S256 path. Also accepted: a link from another phone opened while this phone's request is pending spends this phone's verifier, denial of service only.
- Evidence: `docs/adr/0023-email-links-pkce.md`; `client.ts` lines 14, 111; `AUTH_SETUP.md` lines 164, 340; BL-347. UNVERIFIED: device behaviour (11.10).
- Door: two-way.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-14 Duplicate-line trigger: the wide trigger (24 Nov 2026, CISO via Karma's session; not an auditor)
- Verdict: RULED.
- Ruling: take the wide trigger: show the "you might already have a book" line to every person who is new on this phone after any provider return (Apple, Google or email), decided on the phone from local state and the provider result alone, with no account lookup and one extra tap. This closes the P0 gap in NS-54-R16 (Apple relay address, then Google) that the narrow trigger leaves with a second account and no warning.
- Why: any rule that shows the line only when the server says an account exists is an account-existence oracle; the wide trigger removes the question and does not depend on the unverified claim that Google always returns a real address (spec 12 line 110). The cost is one tap for a returning Apple relay person.
- Evidence: spec 12 lines 108-112, 221-225; PRD 29 lines 95, 134 (NS-54-R16, R29); BL-1942. UNVERIFIED: Google's behaviour on every sign-in (not needed for this ruling).
- Door: two-way. Way back: narrow the trigger in one function. Conditions: a test named for NS-54-R16 whose trigger function takes no server response as input (a mutant that adds one must fail); the screen and its words are identical under both outcomes; the server's choice after Carry on (same-email link, R15) is not shown before it.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-15 Who may edit scripts/agents/**; the trust rule for counted reviews (24 Nov 2026, CISO via Karma's session; not an auditor)
- Verdict: RULED (concur with the trust rule; the ownership proposal changes).
- Ruling: Karma approves; the CISO agrees. Who edits `scripts/agents/**`: an interactive session Karma directs, never an unattended harness agent. The CISO does not accept "re-point the owner to ai-eng-lead" as written: `.claude/agents/ai-eng-lead.md:49` says harness code it does not own, `scripts/agents/**` named, goes to Karma as a proposal with the exact diff, and `ops.md:17` excludes `scripts/agents/**` from ops; and ai-eng-lead is the domain reviewer for those paths (`ai-eng-lead.md:31-33`, `agents/roster.json` review paths), so an author who also reviews is not an independent lens. If Karma wants the dispatcher able to start BL-132, accept ai-eng-lead as author only if the domain review then comes from `security-architect` and the counted review carries the CR-73 security-lens line. BL-132 itself (add the pilot-log path to the agent read deny list, with a test) tightens agent reach: build it.
- Trust rule (BL-1537, Karma's ruling that counted reviews stay verdict readers with no extra marker): concur. The `<!-- founder -->` marker is a first line any session can type, so adding it to a review would prove nothing about who wrote it. Keep two rules separate and say so in the docs: a founder instruction needs the marker (`scripts/agents/lib.mjs:261-282`, `isFounderComment`); a verdict is read from any trusted identity at the exact 40-character head (`lib.mjs:342`, `isTrusted`; `merge-queue.mjs` header lines 21-25). BL-1537's fix is the code and docs agreeing on "first non-blank line", not a marker on reviews.
- Residual risk: one misled or compromised session can author a PR, post both counted reviews and propose the merge, and the only things in its way are Karma's merge check, the three required CI contexts and the compliance fence, none of which can tell sessions apart (the limit CR-176 states). Two cheap additions recommended, not required: a detective check in `merge-queue.mjs` that flags two counted reviews from the same session fingerprint or posted within seconds with the same body; and a periodic read of the last merges on `.github/**`, `supabase/migrations/**` and `scripts/agents/**` by a different model family (D-127; the CAIO notes independent family review never ran).
- Evidence: BACKLOG lines 8128-8145 (BL-1537, BL-1538) and the BL-132 row; `.github/CODEOWNERS`; `agents/roster.json`; `ai-eng-lead.md` lines 31-33, 49; `ops.md:17`; `OPERATING_MODEL.md:96`; `lib.mjs` lines 253-360; `merge-queue.mjs` lines 21-60; CR-176. UNVERIFIED: the BL-1537 ruling itself (no log entry found); whether unattended agents can currently run.
- Door: two-way.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CDO-26 Moments and photo behaviour: six data calls (24 Nov 2026, CDO via Karma's session; Claude role)
- Verdict: RULED (six calls; one is NOT A QUESTION; none needs a new data element).
- Ruling: (1) BL-1742: confirm CPrivO-28; a swipe down persists nothing, because a stored "declined" for a gesture the person did not mean is a record we do not need; only "Not now" writes the decline; test: swipe writes no settings key, "Not now" writes one. (2) BL-1951: keep the words as typed; they are the parent's own L4 words and dropping them is silent loss (CANNOT RULE rewriting or tidying them); keep byte for byte what was typed (only the existing end-trim and the 140-grapheme cap that applied when they typed, `photos/text.ts`), in a field of the letter's record that exists for typed words, never in `raw_transcript` (immutable); the failure event carries an enum reason only (failed, unreadable, no_space), never the words; if no existing typed-words field fits, the build row names the field before code and the CDO reads it (UNVERIFIED where `carryLateWords` lands, `pending.ts:137`). (3) BL-1472 (O-62): one picture first, defer six; six changes the pending data shape (`PendingPhoto` holds one `PhotoSession`) and writes N media rows (UNVERIFIED that `entry_media` does) and needs its own classification and deletion test per field when built. (4) BL-1744: no data element; the landing writes no day key and no "opened" mark. (5) BL-1487: no data element; no objection. (6) BL-1491 (home place per book): NOT A QUESTION: the file contract already is one value per book (`homePlace: Record<string, string>` keyed by book id, `store.logic.ts` lines 5, 25-26, 70-73) and CDO-23 item 3 already ruled that deleting a book removes its home-place row; the row's premise is stale. Close it as done; `ARCHITECTURE-BRIEF.md` lines 167 and 430 hold the stale type, fixed by data-architect in a docs PR.
- Blind spot: all six are dark behind flags (`eas.json` has no `EXPO_PUBLIC_PHOTOS` or Moments switch), so nothing here has met a real family yet.
- Evidence: BACKLOG rows for the six; `store.logic.ts` lines 1-75; `pending.ts` lines 105-142; `text.ts` lines 1-25; CDO-23 (`RULINGS.md` lines 676-697); CPrivO-28 (line 1394).
- Door: two-way for all six.
- Founder-only: no. Signed: Chief Data Officer (Claude role)

### CDO-27 Stray accounts and alpha staging data: the data halves of BL-581 and BL-587 (24 Nov 2026, CDO via Karma's session; Claude role)
- Verdict: RULED.
- Data element: L3 email addresses in `auth.users` that the owner never proved; alpha-family L4 letters on hosted staging.
- Ruling: BL-581: gate the store cut on deleting never-confirmed email accounts after 24 hours (the first Given of BL-581), one worker, one row; BL-1043 (7 days) closes as a duplicate. The second half (accounts with no Terms record and no content older than 7 days) is 1.0.1. BL-587: delete the alpha staging data, do not move it. Production starts clean (D-157); a move carries real family letters across projects with a pepper and key question and gives nothing the families' phones do not hold; the alpha's consent was for a test.
- Why: public sign-in with `shouldCreateUser: true` (`email.ts:37`) creates an `auth.users` row at code request, before anyone proves the inbox, so an attacker can park a stranger's address on our server; no retention clock exists. A purge worker pattern exists (`purge-worker/daily.ts:18` already sweeps unconfirmed reservations after 24 hours). Deletion is lossless for the person because the phone is local-first and resyncs through the claim step.
- Conditions: BL-581: the worker deletes through the admin API with the service role in an Edge Function secret, guards against any profile with entries, memberships or books, runs in dry-run first, writes a content-free count (no addresses) and an audit row (DQ-R15), and states the 24-hour window in DATA_CLASSIFICATION and Privacy section 7 (legal text: exec reading under D-172, Karma merges). BL-587: delete through the account-deletion path or an audited runbook, never a "quick look" query; record counts before and after, content-free; the tester notice (CR-185) says server copies are removed and the phone keeps the letters; record the delete in `docs/DECISIONS.md` as a new D-entry decided by Karma and the exec team under D-168. The hosted deletion is a physical act (FOUNDER_QUEUE row; UNVERIFIED whether any alpha family data exists on hosted staging; `ENVIRONMENTS.md` still shows `scribe-staging` as "not created yet").
- Evidence: BACKLOG lines 2755-2763, 2916-2925, BL-1043; `docs/release/ENVIRONMENTS.md` lines 60-86; `purge-worker/daily.ts:18`; LEGAL-REQ-001; D-157.
- Door: BL-581 two-way; BL-587 one-way for the server copies (the phone copies remain). Blind spot: a deleted stray cannot be counted as "never signed up".
- Founder-only: no. Signed: Chief Data Officer (Claude role)

### CDO-28 Analytics rows: PostHog region US, counts, bucket, insights, crash (24 Nov 2026, CDO via Karma's session; Claude role)
- Verdict: RULED per row (one is NOT A QUESTION).
- Ruling: BL-1128. F-1 is NOT A QUESTION: PostHog Cloud free was already chosen (`analytics.md:153`: "Chosen by the founder, 20 Nov 2026; no card ever on file"). F-2 (region) is RULED: US. The data-architect's "EU if offered" (`data-architect.md:243`) is tagged [U] and predates later pieces: the app defaults to the US host, `analytics-forget` defaults to `https://us.posthog.com` (`handler.ts:87`), Supabase is US (`BACKUP_RUNBOOK.md:74`, us-west-1), launch is US App Store only (D-013), and `FOUNDER_QUEUE.md:63` already says US. A project cannot be moved between regions that the CDO could find (UNVERIFIED), so the choice is permanent; an EU or UK storefront reopens it with `ask_first` as the default there. F-3 stands: treat the pseudonymous id as Linked on the label until counsel says otherwise. F-10 (Supabase Free plan, no platform backups): D-159 stays; the data-loss residual is accepted for 1.0 on condition that the nightly backup job has a dated successful run and the restore drill (BL-1329, D-5) runs once on the physical queue; trigger to move to a paid plan: any failed restore, or the first time the project holds data that is not also on a phone.
- BL-1115 (FQ-01): server aggregates in, as counts at k of at least 10 with the complement rule, read from the `insights` views over tables that already exist (`20261004300000_insights_aggregates.sql`); no new collection; never read the Supabase Auth logs for funnels (they hold emails and IPs); any new view carries its grants in its migration and in `supabase/tests/grants.mjs`; `insights_aggregates.test.mjs` shows every column L2. Blind spot: letters kept only on a phone are invisible to the server count. BL-1607: accept `child_count_bucket` on the Moments events; it is a client-wide property sent on every event when set (`client.ts` lines 96, 227; `catalog.ts:196`), coarse (none, one, two, three_plus); a Moments-only exception would be a special case in the allowlist for no decision gain; an awareness acceptance, not a new collection; the label wording stays counsel's. BL-1633: publish insights weekly, matured cohorts only (`d7_matured`, `d30_matured`, `20261122200000_insights_first_letter_increments.sql:36-37`), nothing leaves the team until D-163's gate; residual accepted: a null d7 beside a published d1 still signals a gap of 1 to 9; `docs/security/threat-model.md` does not exist on develop, so the record is this ruling. BL-1147: concur with the pack and the CISO: no crash SDK before 1.0; scrubber and tests first (BL-1139 to 1141); counsel on the consent line before any turn-on; `crash.ts:19` enabled stays false.
- Evidence: BACKLOG BL-1128, BL-1115, BL-1607, BL-1633, BL-1147; `data-architect.md` lines 236-252; `analytics.md:153`; `founder-setup-pack.md` lines 124, 145; `ENGINEERING-REQUIREMENTS-21nov.md` lines 105, 220; `01-capture-and-first-run.md` lines 10-14; D-159, D-163, D-170. UNVERIFIED: whether the D-159 nightly backup job is built and running.
- Door: two-way while analytics stays off; the region is one-way once the project exists. Conditions: the build refuses to send if `EXPO_PUBLIC_POSTHOG_REGION` and the Supabase `POSTHOG_HOST` secret disagree (add the mismatch test; ER-A10 already falls back to no SDK for an unknown value). The PostHog account step is physical (FOUNDER_QUEUE row 10).
- Founder-only: no. Signed: Chief Data Officer (Claude role)

### CDO-29 sync_books: accept the child name; file the tighter shape (24 Nov 2026, CDO via Karma's session; Claude role)
- Verdict: RULED.
- Data element: the child's name (L4) and each member's `signs_as` (L3) in the closed `sync_books` shape; the decision it serves is naming the book on the account-deletion "What happens" screen before consent is current.
- Ruling: accept the child name in the closed shape for a member. The recipient already holds the name from the full shape, so this is presenting, not first disclosure, and the deletion screen cannot say which book will be deleted without it (`account-deletion/logic.ts:24-34` reads `b.name`). Tighten `signs_as`: the app reads only the other parent's sign-off and a count of contributors (`logic.ts:31-34`), yet the closed branch returns every member's `signs_as`. File one row: the closed branch returns `other_parent_signs_as` and `contributor_count` per book instead of the member list. Expand then contract: a new migration adds the two fields beside `members`, the app switches to them, and a later migration drops `members` from the closed branch after builds that read it age out (`ENVIRONMENTS.md` promotion path 4). Never edit the applied `20261123100000` file; the new function body carries its own grants and an entry in `supabase/tests/grants.mjs`.
- Evidence: `20261123100000_sync_pull_consent_gate.sql` lines 396-430, 498; `packages/api/src/server/sync.ts` lines 832-880; `account-deletion/logic.ts` lines 14-34; `supabase/tests/sync_pull_consent.test.mjs` lines 112-130; `DATA_CLASSIFICATION.md` lines 152, 160, 377; BL-1920. UNVERIFIED: that statement logging is off on the hosted production project (`ENVIRONMENTS.md` states it for staging only); a console read, physical.
- Door: two-way. Conditions: the child name stays out of logs, analytics and crash reports (the parse failure path returns `{ ok: false, reason: 'invalid' }` and echoes nothing, `sync.ts:884-887`); the row's test updates `sync_pull_consent.test.mjs` to pin the new keys and fails on a mutant that returns contributors' sign-offs. Blind spot: this does not reduce what the named member sees once consent is current. The CPrivO holds the privacy side.
- Founder-only: no. Signed: Chief Data Officer (Claude role)

### CAIO-13 BL-1836: Magic Tap confirmed; "long silence ends the take" not wanted in 1.0 (24 Nov 2026, CAIO via Karma's session; Claude role)
- Verdict: RULED (confirm CDesO-25). Conflict note: the CAIO is a Claude role; none of the three rulings has Claude judging Claude on model choice or on whether to pay for Claude. Challenger: CPO.
- Constitution check: Magic Tap and a visible Finish do not touch a person's words. An automatic stop would decide where a recording ends, a capture choice about her audio, held to the stricter test below.
- Ruling: confirm CDesO-25: Magic Tap pauses and resumes, Finish stays a visible button, and no Voice Control claim is made until the BL-1786 device read. "Long silence ends the take" is NOT wanted for 1.0. Two further limits: no new `EditType` or other machine step strips a spoken command ("Tap Finish") out of `raw_transcript`; if such words land there, the parent removes them in Change words, as the row's scope says; and her audio is never trimmed on her behalf.
- Why: a silence rule is a threshold on a signal, and a parent narrating to a sleeping baby pauses for long stretches; cutting the take early loses words she meant to say, and she would not see it happen. It adds a failure mode to the speech path that the gate for zero invented words on silence does not test. Nothing measured says takes run on after she is done. Revisit when BL-1786's device read and real recordings show how long real pauses are and how often a forgotten take runs on; the bar is written first: no recording that a parent ended herself is shortened, and the stop is offered, never silent.
- Evidence: CDesO-25 (`RULINGS.md` lines 1354-1363); BL-1836; `packages/core/src/types.ts` edit types as listed in the CAIO skill (UNVERIFIED re-read beyond the skill and CLAUDE.md). UNVERIFIED: whether a maximum take length exists today.
- Door: two-way. Way back: add the stop later behind its own ruling and a device read.
- Founder-only: no. Signed: Chief AI Officer (Claude role)

### CAIO-14 Photo library read off; no model reads picture content (24 Nov 2026, CAIO via Karma's session; Claude role)
- Verdict: RULED (concur: photo library read stays off for 1.0) plus NOT A QUESTION for any inference from picture content. Challenger: CPrivO.
- Constitution check: no model touches a picture or a parent's photo words today; typed words are never filled in or suggested (`photos/text.ts:12`; `pending.ts`).
- Ruling: concur with the CPrivO: 1.0 ships with the photo library read off, the flag dark and Export failing closed (photos written as null, and said so). D-169 locks that default unless the five gates close by Fri 27 Nov, and `eas.json` carries no `EXPO_PUBLIC_PHOTOS` value (`flag.ts:6-8`). The CAIO adds a standing rule: no feature may read picture content with a model (faces, scene or object labels, "best photo" ranking, automatic captions or place words); a model deciding something about a family's pictures and offering words is ruled out by AIE-R20 and D-061. It does not wait for the gates.
- Why: the native photo module imports only ImageIO, PhotosUI, UIKit and system types; nothing in `apps/mobile/modules` or `src/lib/photos` uses Vision or Core ML (grep), so the gate list needs no model line today.
- Evidence: `flag.ts`; `text.ts` lines 1-25; `modules/scribe-photo/ios/*.swift` imports; `eas.json`; D-169 (line 1320); CPrivO-29; BL-1830, BL-1838, BL-1858. UNVERIFIED: whether Export fail-closed is merged; whether reverse geocoding sends coordinates to Apple (BL-1838 names it for the CPrivO and CLO).
- Door: two-way (flag).
- Founder-only: no. Signed: Chief AI Officer (Claude role)

### CAIO-15 Speech model integrity check off the capture path (24 Nov 2026, CAIO via Karma's session; Claude role)
- Verdict: RULED (BL-1840). Challenger: CISO.
- Constitution check: the raw transcript is whatever the model returns and `verifyEdits` only checks edits against it, so the model file is the first link in the faithful chain; a corrupted or swapped model is the one failure the verifier cannot see.
- Ruling: hash the installed model at install (already done), after an unclean exit, and on a rare schedule off the capture path (the CAIO suggests: when idle and on power, about weekly, and again after an app update; a proposal for the security architect to set), never at every launch and never between pressing Speak and recording. A failed check quarantines the file, falls back to the words-arrive-later path, keeps the recording and re-fetches from the signed manifest. No spinner and no message in the app's own voice (CDESO-7). The scheduled hash is cancellable and stops at once when a take begins (the adapter takes an abort signal, `expo-adapter.ts:152-166`).
- Why: truncation is caught by the size check; a same-size bit flip after install is not. The streamed native hash exists (`expo-adapter.ts:33-43`); the cost is I/O and battery on a 574 MB file, acceptable off the capture path and not on it. The install path is guarded by the signed manifest and `TRUSTED_SIGNING_KEYS`, which now holds two keys (`packages/api/src/keys.ts:20-23`; the CAIO skill text saying it is empty is out of date).
- Evidence: BL-1840; `expo-adapter.ts` lines 23-45, 150-185; `keys.ts` lines 15-24; `model-files.ts` lines 1-12; CDESO-7 as cited in BACKLOG line 9281. UNVERIFIED: where the load-time size check sits in code; the time and battery of a full hash on the compact tier.
- Door: two-way. Way back: remove the schedule; install-time hashing stays. NEEDS EVIDENCE before the schedule ships: time the native hash of the 190 MB small model and the 574 MB model on an iPhone SE (3rd generation) with the screen off and on power, recorded in the build row; the security architect owns the note and the build row (S size).
- Founder-only: no. Signed: Chief AI Officer (Claude role)

### CDesO-26 BL-371: Undo stays a toast (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED. Challenger for the D-1 bundle: CPO. Consulted: CPrivO for BL-371, CLO for BL-454. The CDesO rules how things look, sit and read; legal claims stay with their owners. Any customer line below is PROPOSED and held for the content owner; none changes a content key until content brings it through `packages/content/test/rules.test.ts`.
- Ruling: Undo stays a toast, as S36 specifies, and the row's Done-when is edited to say so. The toast has no timer, so it stays until Undo, Close or leaving the Book, and behind it sits the 30-day Recently deleted shelf. A full-width Undo button on the page would need a second deleted state on the letter page, which S36 removes on purpose. A11Y-F03 asks for a persistent Undo and no timed navigation, and the build meets both.
- Evidence: `EXPERIENCE_PASS_2026-10.md` lines 962-969 (S36); `docs/tdd/09-accessibility-design-system.md:489` (A11Y-F03); `book.tsx` lines 244-262; `letter/[id].tsx` lines 425-450; BL-954 (the book undo toast does not use the undo-window helper yet, a separate open item).
- Door: two-way. Way back: add a page-level Undo later. Condition: edit the Done-when to "Undo is a toast action that stays until used or dismissed; the letter is in Recently deleted after Back, swipe-back or a kill" (relies on CDesO-15's reachable shelf). Not seen on a device.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-27 BL-376: a no-speech letter keeps "Write the words" (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: a no-speech letter keeps "Write the words" and does not get "Record again" or "Try again". The Scope and Done-when lines that promise them are edited out. Delete stays the lower-emphasis action on a silent recording. A recording with no words may still hold something worth keeping, such as a baby laughing, and the app must not suggest it is a failed take to replace; a "Record again" button on an old letter blurs "this letter" and "a new letter", and a new letter starts from Home, where Speak is first.
- Evidence: `words-card.logic.ts` lines 1-30 (`noWords` shows "Write the words" only, by design); BL-376; `p5-critics.test.ts` is named there as the test (not opened).
- Door: two-way. Way back: add the action; one component. Condition: the "nobody spoke" note above the player stays plain and unsigned. No words ship from this ruling.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-28 BL-396: no root large-title header for 1.0 (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: the root large-title header variant is not wanted for 1.0, and its clauses are retired: the "root large title" variant in Scope and "root titles share one y position across tabs" in Done-when. Only ModalHeader, BackButton and the one Sheet pattern remain the standard. The three tab roots are different compositions on purpose: Book already draws a large title that hands over to an inline bar, and a forced shared y position would flatten the Book cover; the product wants the app's own words small and the letters loud.
- Evidence: `screen-header.tsx` lines 1-20; `(tabs)/_layout.tsx` (`headerShown: false`); `book.tsx` lines 1-20, 90-92. The Home and Me roots were not opened (UNVERIFIED).
- Door: two-way. Way back: reopen the variant with a device read. Condition: the row's remaining test reads "only the modal, back and Sheet patterns remain, and every Sheet has grabber, labelled close and one title style".
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-29 BL-428: the notifications-off card is the status row; the absence line is PROPOSED (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED (the card is accepted; the absence line is PROPOSED).
- Ruling: the notifications-off card stays as the status row for a denied permission, and the Done-when line "the switch is not ON" is retired. The "3 weeks ahead" line is out of date and not wanted: the plan horizon is an internal number. One quiet content line about absence replaces it, if content brings it. The planner now stops evening nudges after day 35 from the anchor, and "no screen says so".
- PROPOSED line, held for the content owner (WRITING-GUIDE section 8, Settings): "Reminders ease off by themselves after a few weeks, and start again when you save a letter." It states what the planner does, counts no gap, names no number of days, blames nobody and says nothing about the child. Placement: the on-state footer under the switch, muted, below "Changes save as you go."
- Evidence: `settings/reminders.tsx` lines 200-232; `reminders.logic.ts` lines 5-30; `planner.ts` lines 31-35, 102-109, 177; `reminders.en.ts` lines 63-65.
- Door: two-way. Conditions: (a) the line ships only if mobile confirms that saving a letter re-plans the reminders, because "start again when you save a letter" must be true (UNVERIFIED; the plan-rebuild trigger was not traced); (b) the line passes `rules.test.ts` and the writing guide, or it is dropped and the Done-when keeps only the card; (c) BL-537 still says "deferred 1.1" while the planner implements the back-off, a stale row for product to correct.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-30 BL-454: raw words on the held card confirmed; `settings.neverRewrite` retired (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED (design half; the claim half stays with the CLO).
- Ruling: (1) the held card showing the stored raw transcript, fillers included, is confirmed as designed: the person's own words exactly as stored, matching Tonight's card; Review is where the marked small fixes appear. (2) `settings.neverRewrite` is retired from Settings: it is rendered nowhere, a test pins its absence from the Settings home, and `settings.tidyHelp` already says "Either way, we never rewrite your words" at the place the parent chooses how letters open. Whether the sentence stays anywhere is the CLO's call on counsel relay item 15, which the CDesO could not read.
- Evidence: `strings.en.ts` lines 873 and 1051; `settings-home.test.ts:51` (`not.toMatch(/neverRewrite/)`); `P6A_CRITICS_PASS_2026-10-28.md` lines 69, 106; BL-454.
- Door: two-way. Way back: restore the key from git. Conditions: the card text is never truncated (D-027); removing the content key is a content change for the content owner with the content tests green and the CLO's nod that no other surface needs the sentence.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-31 BL-1620: keep "Write the first one" (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: the finale button stays "Write the first one" for 1.0. "Tell {child} something" is not adopted now; content may bring it as a replacement through the content rules after the store build and it is not blocked in principle. The finale is the last thing every new parent reads; CDesO-13 already kept "Write the first one" and the key has a test pin. The proposed line echoes the body above it and is neutral between speaking and typing, but it would be an unread change on the most-read path with no parent evidence either way.
- Evidence: `strings.en.ts` lines 203-208 (`onboarding.finish`); CDesO-13 (`RULINGS.md` line 765); WRITING-GUIDE section 0. The row's owner "founder" is void under CR-176.
- Door: two-way. Way back: swap one key and its test pin. Conditions: no change to the key without `rules.test.ts` and a pin update in the same PR; if content brings the new line, the CDesO reads it with the five-parent check (BL-1714).
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-32 BL-1653: Months sheet year order (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: the year rows in the Months sheet are newest first, like the Book and the months below them, with Before You last. Read together from a year still plays that year's letters oldest first. Record that order in the row and in `docs/design/COMPONENTS.md` under MonthsSheet. A grandparent scrolling the sheet should meet the same order in years as in months.
- Evidence: `read-year.logic.ts` (`yearRows`: "newest first like the Book"); `read-year.logic.test.ts` lines 26, 54-56; `months-sheet.tsx` lines 26-32. Not seen on a device.
- Door: two-way. Way back: change one sort and its test. Condition: the label check for y2 to y4 and the real mutant run stay with qa.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-33 BL-1836: no second silence feature (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED (and a clash with D-169 item 5 resolved).
- Ruling: Magic Tap pauses and resumes, as CDesO-25 ruled, and Finish stays a visible button. No Voice Control claim until a phone shows it (BL-1786, a device act; its queue row not found, UNVERIFIED). BL-1836 adds no new silence feature: its "long silence ends the take" is not wanted in 1.0 as a way to stop a take. A different thing is already locked: D-169 item 5 keeps "the long-silence stop as specced", which is BL-1811 in the design backlog: a take that runs very long or stays silent ends kindly, what exists is kept, Review says why, and the numbers come from product. That one is untouched.
- Why: a mother nodding off mid-take needs a safety stop that is long, measured in minutes and never trims her audio; a Voice Control user is served by Magic Tap and a visible Finish. A silence-as-Finish rule would end a take during an ordinary thinking pause or a soothing hush, which costs her words.
- Evidence: `docs/design/review-2026-11-22/DESIGN-BACKLOG.md` lines 359 (BL-1811), 389 and 456 (BL-1836), 486 (item 5 locked); D-169 item 5 (line 1335); CDesO-25 (line 1354); BL-1836. The pack's recorded view that CAIO and CPO do not want it is UNVERIFIED in the repo (read in the CPO's note).
- Door: two-way. Way back: add the option later with device evidence. Condition: whoever records this writes it as "no second silence feature", not "no silence stop in 1.0", or it reads as overturning D-169 item 5. The BL-1811 stop, when built, ends only after a long silence (product sets the number, device-checked at BL-1786), keeps everything recorded, and Review says why in one muted line.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-34 BL-2020: lift the sheet title cap (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: lift the cap on the sheet title. `sheetTitle` becomes uncapped, so the title is never smaller than the body at any text size. Record in `docs/design/COMPONENTS.md` under Sheet: title 22 pt on a 28 pt line, no maximum scale and no line limit; body 18 pt, uncapped; the title stays 1.22 times the body at every size. Today the title tops out at 44 pt (22 times the 2.0 cap) while body keeps growing, so past a ratio of 2.44 the body overtakes the heading. D-027 says letter text is never capped; the same instinct applies to the line that says what the sheet is.
- Evidence: `packages/design-tokens/src/tokens.ts` lines 303 (`sheetTitle`, base 22, maxScale 2.0) and 267 (`body` 18, uncapped); BL-2020; BACKLOG lines 9281-9282 (CDESO-7 quoted, not read). Which text sizes reach 2.44 is UNVERIFIED and not needed.
- Door: two-way. Way back: restore `maxScale` 2.0. Conditions: sheet content scrolls inside the sheet and Close stays pinned and reachable; the existing "never truncates at AX5" test still passes. Other capped headings above uncapped body (title2, cardTitle, title1, hero) have the same overtake; none is ruled here: product files a follow-up row to audit them by the principle that a heading is never smaller than the body under it. No device or simulator run was made.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-35 Erase and Delete account words, placement (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED (words and placement; held for the content owner). Challenger: CLO, who leads. Consulted: CPrivO, CCO, CPO. The CDesO rules only the words a parent reads and where they sit; whether a claim is true is the CLO's, and whether the CLO-22 hold lifts is the CLO's and Karma's.
- Ruling: (1) the Erase line is adopted as drafted, "for good" dropped: "Erased from this phone. Backups and exports you already saved are not changed." The shipped `shelf.eraseNowBody` already reads "The letter and its recording are erased from this phone. Backups and exports you already saved are not changed." The remaining "for good" is `bookEraseNowBody` ("Every letter and recording in it is erased for good."); content sweeps it in the same PR to "Every letter and recording in it is erased from this phone. Backups and exports you already saved are not changed." (PROPOSED). (2) "We hold no copy." and "Nothing is sent anywhere." stay only where the row can show them, a phone that has never signed in; elsewhere the row draws the existing fallback line, never a blank, a lock or a "coming soon". "Your free letters start again." stays as the last, muted note. (3) Delete account, intro: keep the existing first sentence and add one factual sentence under it, muted, before the export row. PROPOSED: "If another parent left a book before you delete it, their letters aren't deleted with it. The book's name and dates are kept only to label them." Never "your letters stay yours", never "nothing is left", no ids or times. (4) Held deletion (BL-447): the scheduled page shows PROPOSED "We're still finishing your request. We'll email you at the address on your account when it's done." in place of a date that has passed; Cancel keeps its prominence; no spinner, progress bar or countdown, because nothing here moves; the line says nothing about why.
- Evidence: `strings.en.ts` lines 925-930, 964, 982-997; `features/account-deletion.en.ts` lines 13-19, 63-69, 82-84; `account-deletion/logic.ts:104`; BL-780, BL-1805, BL-1854, BL-1857, BL-447, BL-979; `delete-account-page.md` lines 55-59; `privacy-policy.md` lines 114-118; D-169 item 5 and "Live text, still held"; CLO-22; WRITING-GUIDE sections 0, 7, 8; `CLAIMS-1.0.md` W-04. The "email you" promise rests on the `account-deleted` email (`docs/emails/CATALOG.md:112`, listed `LB`); whether it is wired and sent from the hosted project is UNVERIFIED.
- Door: two-way for the words; once Terms and the privacy policy are published, slower to retract (the CLO's). Way back: restore the old string; one key per line.
- Conditions: every line passes `rules.test.ts` (fix the copy, not the test). The CLO confirms the "email you" promise and the "kept only to label them" sentence as claims before any build carries them. BL-979 first needs the Q51, Q32 and Q48 answers recorded; none found (UNVERIFIED). Noted for content: `features/screen-states.en.ts:26` says "Sets these words aside for good."; not a deletion line, the same absolute; read it in the same sweep.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-36 BL-1742: Photos primer, swipe persists nothing (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED (design lens confirms CPrivO-28). Challenger for the D-4 bundle: CPO. All six D-4 features are off in every store profile.
- Ruling: on the Photos primer, a swipe down or any other dismissal gesture persists nothing and never starts Apple's alert, and never returns unprompted. Only the visible "Not now" records a decline. Re-entry is a tap on the door row. A sheet swipe is a gesture people make by accident or to peek; the visible button is the only place a "no" is a choice. The confirmation of the edit to NS-53-G05 and NS-53-R73 is an exec record, written by Karma.
- Evidence: CPrivO-28; BL-1742; COMPONENTS.md (Sheet has a visible Close and an escape gesture; `dismissible={false}` exists for priming).
- Door: two-way. Conditions: VoiceOver's escape gesture and the visible Close behave exactly like the swipe (persist nothing), and "Not now" is the one control named for a decline; the test shows swipe-down writes no decline and shows no alert.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-37 BL-1951: the words stay when a photo commit fails (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED, and the alternative is CANNOT RULE.
- Ruling: when a photo commit ends failed, unreadable or no_space, the typed words stay on the letter exactly as typed, with no picture. The existing PROPOSED line already covers it: `book.letter.notSaved` ("The photo didn't come along with this letter. Your words are kept, and you can add it again.") on the letter page and `review.notStored` on Review. CANNOT RULE: dropping the words with the picture; the constitution says no feature may write, rewrite, summarize or shape a person's words, and a failed file must cost her a picture at most, never a word.
- Evidence: `packages/content/src/features/photos.en.ts` lines 76-79, 96-100; BL-1951 (PR #1474); CLAUDE.md constitution.
- Door: two-way (dark behind the photo flag). Condition: `notSaved` promises "Your words are kept", so it ships only with the fix that makes it true: one test per ending (failed, unreadable, no_space) showing the words are kept; until then the key stays unused.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-38 BL-1472: the first Moments door ships with one picture (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: the first Moments door ships with one picture. The multi-picture pending set (six pictures or two videos) is deferred and the row is marked deferred, not proposed. One picture gives a clean first frame, a plain remove, a clear VoiceOver order and an AX5 layout that can be specified now; six is a grid with ordering, remove-one and large-text and Smart Invert cases not designed, in a feature that is dark. The limits in CL-047 and CL-048 are the planned ceiling.
- Evidence: `docs/product/prd/28-moments-tab.md` lines 1495 (O-62), 1518; CPO-58 (line 1212); BL-1472.
- Door: two-way. Condition: when six is wanted, design delivers the grid and the large-text rules before any code.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-39 BL-1744: the landing spec holds (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: the spec holds and the row is rewritten to match. A Moments link or notification lands on Moments at scroll 0 with For you selected and no card highlighted, for typed day, birthday and month age; an evening reminder lands on Home. No wash, no scroll-to, no card moves. App lock comes first. The first-view settle plays only if it has never played. A highlight or a jump to "the day it names" implies the app is pointing at a particular memory, which it has no need to do. O-22 was reasoned and answered; the design backlog wording is the stale one.
- Evidence: `docs/design/moments-motion-spec.md:100`; `moments-design-closure.md` lines 73-77 (O-22), 109 (G-09); BL-1744.
- Door: two-way. Condition: product rewrites the row title and Done-when and sets it ready, or closes it as covered by O-22.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-40 BL-1487: drop the lens thumb frame at mount, never mid-read (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: drop the lens thumbnail frame when a thumbnail is missing, so the card reads as a card with no thumbnail and no error, but the card's height never changes while it is on screen. If the file is known missing when the card mounts, it mounts without the frame. If the load error arrives after mount, the card holds its height as plain paper, with no error mark, and loses the frame at its next mount. The motion spec says a missing list copy "never pops into a card being read; the card's height never changes under the eye (G3)", B-S04 says a missing thumbnail is a card without a thumbnail and no error, and CONFORMANCE F-27 asks for the frame to go; all hold if the frame goes at mount and never mid-read.
- Evidence: `docs/design/e2e/B-book-and-reading/MOTION.md` lines 53 (B-M05), 185 (G3); `CONFORMANCE-21nov.md:171` (F-27); `specs/01-PHOTO-WITH-A-LETTER-11nov.md` lines 127-132; BL-1487.
- Door: two-way. Condition: mobile confirms whether `onMissing` fires after mount (UNVERIFIED; an image error callback) and implements the two cases. No height animation is added.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-41 BL-1491: home place is one value per book id, design lens (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED (design lens; the contract is the CPO's and CDO's).
- Ruling: the home place is one value per book id. R249 already says "one value per book", and the file contract's single `homePlace` should become a value keyed by book id before the file shape ships. A parent with two books would not want one home for both, and a parent who corrects one book's place should not see the other change. (The CDO read the code and found the contract already keyed by book id: see CDO-26.)
- Evidence: `28-moments-tab.md` lines 481, 937, 957-966 (R249, 17.1 `homePlace`); BL-1491. `ARCHITECTURE-BRIEF.md` not read; the file-shape claim rests on the BL row.
- Door: two-way before the file ships; hard to change once shipped. Condition: CPO and CDO own the contract and edit 17.1; this seat states the visible behaviour.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-42 BL-1840: the model integrity check is invisible on the capture path (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED (design lens only).
- Ruling: the speech model integrity check never runs between pressing Speak and recording, and shows no spinner, message or sound in the app's own voice on the capture path. Hash at install, after an unclean exit, and on a rare schedule off the capture path. A failed check falls back to the words-arrive-later path, keeps the recording, and surfaces only through the existing waiting-for-words card with its "Get words ready" action; it re-downloads only through the same consent and Wi-Fi rules as the first download. A parent at 2 a.m. who pressed the red circle must have nothing between her and a live microphone.
- Evidence: BL-1840 (the CDESO-7 constraint as quoted there); `specs/15-FIRST-LETTER-NO-MODEL-20261124.md:56`; `words-card.logic.ts` (`packWait`); `DESIGN_LANGUAGE.md` principle 2. CDESO-7's own text is not in the exec log (UNVERIFIED; relied on the quote).
- Door: two-way. Conditions: the cost and timing choice stays with the security architect and Karma; no new customer words; if a failure ever needs a line, content brings it.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-43 BL-536: reminder cadence and bedtime question stay deferred to 1.1 (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: BL-536 stays deferred to 1.1, after the notification catalogue (BL-297) and after a real-parent test. The shipped ask card stays as built. When it returns, the sleep question is tested against a plain time-chip row as the control, and the screen works with the question skipped. K1 kept the card as built and called the sleep-anchored time a "hypothesis with a test, not a claim"; asking when {child} falls asleep puts a question about the child's routine inside a settings step, and the copy presumes nothing about sleep or the household (BL-532). The test has to be able to say no.
- Evidence: `docs/design/NOTIFICATIONS.md` lines 43-51, 97-100 (K1); BL-536, BL-532, BL-297, BL-547; `planner.ts`; D-172.
- Door: two-way. Conditions: only the resulting time is ever stored (NOTIFICATIONS section 2); the live preview shows only real planned dates and words; the existing cap of two showings holds; the test needs real parents (BL-1714, BL-547). Not seen on a device.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-44 Marketing phone mock: Home, Book, Me and a single-figure icon (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: change the phone mock's tab row to Home, Book, Me, and swap the third icon to a single-figure glyph to match the app's own User icon. The labels are one array (`appTabs`, `site.ts:138`) and the icon is drawn by index in `Tonight.tsx`, so a label change alone would leave a two-person icon over the word Me. The web lane makes the change in one PR; it does not depend on the site mode. D-161 says Family is never a tab; a picture of an app that does not exist is a worse failure than a missing picture.
- Evidence: `site.ts:138`; `Tonight.tsx` lines 109-118; `strings.en.ts` lines 58-64; `(tabs)/_layout.tsx` lines 2-6, 84-95; D-161, D-162. The mock sits only in the scroll film, shown only when `SITE_MODE` is `film`; whether Vercel has that set is UNVERIFIED.
- Door: two-way. Condition: the other mock screens show no Family surface (grepped `app-ui` and `scenes`, none); the film is a public depiction, so the CMO co-signs (CMO-20).
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CMO-19 Website release to main: conditions and two facts to find (24 Nov 2026, CMO via Karma's session; Claude role)
- Verdict: RULED yes, cut one web-only release PR into `main` before the first build with sign-in goes to anyone. NEEDS EVIDENCE for two facts. Consulted: CLO and CCO for claims (their recorded read is a condition), CPrivO for privacy lines. Challenger: CLO.
- Ruling: do it as the website hotfix path that `docs/DEVELOPMENT.md` (lines 10 and 16) already allows, and merge `main` back into `develop` the same day. It carries only `apps/web` and whatever packages the web build imports. It is not the full release PR (BL-1871).
- Why: the `/open` page and its AASA path are missing on `main`, and 14 emails point at `/open` (BL-510), so links in sign-in and notice emails would open nothing. `main` still carries a sentence telling people to tap "Send a new email" if "the app says the code has expired", which the app never says (BL-509). Both fixes shrink or correct what the site says; neither adds a promise.
- Claim consistency afterward (read on `develop`): `/open` has no price, privacy or AI claim, no token, noindex (pass; its PROPOSED words contain nothing that promises anything); the auth confirm line matches the app (pass); the home page: `SITE_MODE` unset on Vercel Production gives the holding page, with registered claims W-01 and W-07; no "exactly as you said it" line is in `site.ts` on `develop`, so if `main` has it this release removes it (D-125 item 9, D-133); `/support` says "A person reads every message.", a claim about people and a mailbox whose route is the open item BL-367 (a physical act; `EMAIL_IDENTITY.md:25` says it "must be true"); `/terms` and `/privacy` are site-only pages and this PR must add none of the 0.9.0 test pages; the welcome email has an unsubscribe link and no postal address (BL-367) and signs off "The Early Letters team", which the brand notes ban: this PR must not make it worse or add a new commercial email.
- Evidence: BL-509, BL-510, BL-565, BL-367; `RELEASE_PR_CARRY_LIST.md` 1.3; `RELEASE.md` lines 334, 318; `DEVELOPMENT.md` lines 10, 16; CR-60; `CLAIMS-1.0.md` section 2; `apps/web/src/lib/support/copy.ts`; `site.ts` lines 274-298; `apple-app-site-association/route.ts`. `main` could not be diffed (no ref in the clone), so what else `apps/web` changed since `702e7df98` is UNVERIFIED.
- Door: two-way: redeploy the previous Vercel version (`RELEASE.md:318`); Apple's CDN can cache a bad AASA for up to about a day, so check the AASA content twice before merging.
- Conditions: (1) the PR's file list is `apps/web` plus the packages the web build imports; no `supabase/`, `apps/mobile`, `.github/workflows` or `docs/legal/**`; read `git diff --name-only origin/main <branch>` before merge; (2) the carry-list 1.3 grep for `0.9.0` and `apps/web/content/legal` prints nothing new; (3) the legal and site-copy diffs are read by the CLO and CCO first, else those files stay at the `main` version in this PR; (4) `/support`: keep "A person reads every message." only after a test mail to hello@ has been seen to arrive and a named person reads it (BL-367, queue row), else cut that sentence and its echo in `metaDescription`; (5) `npm test` in `packages/content` passes on the branch, including `claims-capabilities.test.ts`; (6) no change to `SITE_MODE`, prices, trials or any privacy sentence, no new marketing email, the postal address stays queued; (7) after the merge: `/open` returns the page, `/.well-known/apple-app-site-association` lists `/open` and `/j`, and the holding page still shows; the Vercel values `APPLE_TEAM_ID` and `IOS_BUNDLE_ID` are console acts, already queue row Q2-06.
- NEEDS EVIDENCE: (a) whether the Vercel production deploy from `main` needs any console sign-in or promotion (if so, one queue row); (b) the real diff of `apps/web` between `main` and `develop` (on a full clone: `git diff --stat origin/main origin/develop -- apps/web packages/brand packages/content`, then read every string diff against `CLAIMS-1.0.md`; Karma's session before opening the PR).
- Founder-only: no. Signed: Chief Marketing Officer (Claude role)

### CMO-20 Marketing phone mock: Home, Book, Me, public claim (24 Nov 2026, CMO via Karma's session; Claude role)
- Verdict: RULED.
- Ruling: fix the phone mock tabs to Home, Book, Me, with the matching single-figure icon (CDesO-44), whether or not the site is live. The web lane makes the change; the CMO co-owns it as a public claim. Removing a false depiction is inside the CMO's own list and needs no further exec step. A mock showing a Family tab depicts a screen the store build does not have (D-161, D-162, D-126); the FTC looks at the net impression, and App Review reads screenshots against the build. A fail-closed note would still leave the false array in the repo for the day someone sets `SITE_MODE=film`.
- Evidence: `site.ts:138`; `site-mode.ts`; `apps/web/src/app/page.tsx`; D-161; BL-1856; `CLAIMS-1.0.md` section 2. Whether earlyletters.com is live and what `SITE_MODE` is in Vercel: UNVERIFIED.
- Door: two-way (redeploy). Conditions: Karma records the live state in the row (a fix to `site.ts` and a fail-closed hold are different notes); the D-118 child-name exception in that file is untouched; the change rides in the D-14 web PR if ready, or alone; the in-app strings in the mock keep matching `strings.en.ts` keys.
- Founder-only: no. Signed: Chief Marketing Officer (Claude role)

### CFO-15 Phone and SMS: no spend; a conditional cap if SMS is ever ruled in (24 Nov 2026, CFO via Karma's session; Claude role, not an accountant)
- Verdict: RULED: no SMS spend without a ruling to ship SMS; a conditional cap is stated. NEEDS EVIDENCE on the vendor price. Whether SMS ships at all is for the CLO, CCO, CPrivO and CISO; Karma rules the LEGAL-REQ-012 relaxation. The CFO notes the money logic points the same way as the pack's recommendation for 1.0.
- Ruling: while no ruling to ship SMS exists, nothing is bought: no vendor account, no card, no sender registration, no `[auth.sms]` entry in `supabase/config.toml` (grepped on the clone: none; the mobile auth code has no phone path). The default when nobody answers is no spend. If SMS is ruled in, the opening cap is a hard $25 a month in the vendor console, with an alert at 50 percent ($12.50) and the phone step paused at 80 percent ($20), the pause trigger the PRD card already sets (R37). The cap is the most an attack or a surge can cost in a month, not a forecast; raising it later is a new ruling with the price read.
- Why: (1) monthly cost is A x s x r x p x 30 (accounts a day reaching the phone step, share who start it (a guess of 0.4), sends per start (a guess of 1.3), delivered price of one text); no vendor price was read, so no dollar figure for SMS here is a quote. (2) The return in money is zero: a verified phone is optional, never used for sign-in or recovery, brings no payer. (3) The thing it guards is cheap in money: Supabase Pro lists 100,000 monthly users included, then $0.00325 each (`docs/ARCHITECTURE.md:160`, from the 3 Oct read); any text priced above about a cent costs more than the account it screens, so the case for SMS rests on non-money grounds. (4) The cap is a loss limit; the Supabase hourly cap (`sms_sent`, default 30) only sets how fast an attacker can spend; an attack can exhaust the month's cap and pause an optional step and that is all, because a verified phone is never used for recovery or sign-in (spike section 7 item 9). (5) At a placeholder p of $0.05 (an assumption, not a vendor price) the cap serves about 32 new accounts a day; the step pauses if volume does not fit. (6) $25 is $300 a year, about 7 annual subscribers' net proceeds in a year (7.06 x $42.49 at 85 percent in the Small Business Program) and about 27 percent of the $91 fixed floor (Supabase $25, Sentry $26, Resend $20, Vercel $20; read 3 Oct, re-read before relying). No real runway figures were available, so this is a size argument, not a budget fit.
- Annual figure: at most $300 a year at the opening cap. If nobody cancels, the vendor account stays open and bills up to its console cap each month; to cancel, close the vendor account in its console and remove the key from Supabase secrets (a physical act). The vendor's own terms on billing, overage and auto top-up are unread (UNVERIFIED).
- NEEDS EVIDENCE: the vendor's own price per delivered text for the target countries, its hard spend cap and alerts, its SMS-pumping controls, its retention and its US sender-registration cost, each read from a named page (the spike names Twilio Verify, then Vonage), at BL-1898, in a session whose network allows those hosts; platform; the CFO redoes the cap arithmetic with the real price.
- Evidence: `sms-phone-auth-spike.md` sections 2, 4, 6, 7, 8; PRD 29 section 1; BL-1897, BL-1898, BL-1900, BL-1909; LEGAL-REQ-012 (line 117, not re-read); `docs/ARCHITECTURE.md:160`; `docs/prd/v2/03-goals-and-principles.md` line 88; `supabase/config.toml`; D-127.
- Door: two-way while no vendor account exists and no number is stored; no once numbers are stored (the CLO's and CPrivO's). A vendor account with a card on file is a physical act and a queue row, written only if SMS proceeds. BL-1898's "founder decides spend" is read as: the exec review sets the cap, and the console act is the physical step.
- Conditions: no vendor account, card, key or `[auth.sms]` setting before a ruling to ship SMS and this cap are both recorded; the Supabase `sms_sent` value is set from the real price and pinned in `supabase/tests/auth_config.test.mjs`; alerts carry counts only, never a number or a code. Challenger: CISO, with the CBO if a phone is ever tied to a plan.
- Founder-only: no. Signed: Chief Financial Officer (Claude role, not an accountant)

### CPO-89 PR 638 PRD V2: the baseline, not the live log (24 Nov 2026, CPO via Karma's session; Claude role)
- Verdict: RULED (concur with CR-203). Full text: Project note `infra/exec-rulings-2026-11-24-held-prs.md` section 2.
- Ruling: PRD V2 is the baseline frozen at D-130; later decisions live in `docs/DECISIONS.md` and later requirements in `docs/product/prd/REGISTRY.md`. The rows worth keeping (refused sign-up, the two-document consent sheet) are carried by BL-553 and the sign-in specs. Optional, not urgent: one banner line at the top of `docs/prd/v2/README.md` by the product agent.
- Door: two-way.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-90 PR 733 NX-38 trace: evidence, not a requirement source (24 Nov 2026, CPO via Karma's session; Claude role)
- Verdict: RULED (concur with CR-204). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 3.
- Ruling: land the trace with a banner saying it is a historical record that decides nothing; the NS cards are the requirement source. Do not reopen F1 to F10: they are answered by D-157 to D-172.
- Door: two-way.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-91 PR 767 co-parent rows: keep BL-883 to BL-889 as proposed (24 Nov 2026, CPO via Karma's session; Claude role)
- Verdict: RULED (concur with CR-207). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 6.
- Ruling: the real co-parent feature is post-1.0; groomed rows are not "work shipping dark" (CR-178). The PR's recommended defaults for its nine questions are the conservative starting point for BL-883 (collect less, hide more, release later) and bind nothing until BL-883's threat model and the exec read; if BL-883 disagrees, BL-883 wins. The release is a 1.0.x chosen after BL-883 sizes it. The invitee sees nothing about the child before agreeing (D-111 item 8).
- Door: two-way.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-92 BL-410: the controls to capture are the ones the app says today (24 Nov 2026, CPO via Karma's session; Claude role, with CDesO-45)
- Verdict: RULED (concur with CR-208). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 7.
- Ruling: Reading A. The BL-410 row is stale, not the app. The controls to capture are Add to {child}'s book, With small fixes, Exactly as said, and the tabs Home, Book, Me. No two-up "Sounds like me | Not quite" is wanted: it would be a new surface asking a parent to rate the machine's work.
- Door: two-way.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-93 Wire names: no scope change; PM-file rows superseded (24 Nov 2026, CPO via Karma's session; Claude role)
- Verdict: RULED (concur with CR-213). Full text: `infra/exec-rulings-2026-11-24-wire-names.md`.
- Ruling: dropping 17 held events changes no release scope, date or promise, so it is not a CPO scope call. Where a PM-file row names an event the table now drops, merges or names differently, the table wins; the PM and standard rows are corrected at their next edit by their owner.
- Door: two-way.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CLO-42 PR 760 counsel packet addendum: close (24 Nov 2026, CLO via Karma's session; Claude role, not a lawyer)
- Verdict: RULED (concur with CR-211). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 10.
- Ruling: close. The draft was not read question by question against Q109 to Q132 (stated); the packet's own overlap notes and the topic list map. One pass at retirement catches any topic with no home, each becoming a one-line new row. Q78 to Q106 are retired and never reused. A brief for a feature off in 1.0 would only age; BL-841 is the row that reopens it.
- Door: two-way.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CLO-43 BL-603: docs/legal/evidence accepted as the home (24 Nov 2026, CLO via Karma's session; Claude role, not a lawyer)
- Verdict: RULED (concur with CR-210). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 9.
- Ruling: `docs/legal/evidence/` is accepted; Karma merges it (D-132, D-168). The triage comment's note on `docs/legal/**` was a limit on a triage session, not on the exec team. If the readback shows tokens or addresses in logs, the CLO drafts a Privacy line then.
- Door: two-way.
- Founder-only: no. Signed: Chief Legal Officer (Claude role, not a lawyer)

### CCO-30 NX-38 R2 and R8 need a live check (24 Nov 2026, CCO via Karma's session; Claude role)
- Verdict: RULED. Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 3.
- Ruling: two NX-38 rows have nothing on `develop` and are UNVERIFIED either way: R2 (the "five addresses" the stores and policies name, written down and checked) and R8 (every public contact address receives mail and has a reader). They are claims to the public and must not be assumed; the gap-check PR files a row for each if still missing.
- Door: two-way.
- Founder-only: no. Signed: Chief Compliance Officer (Claude role)

### CISO-16 PR 449 agent runner hardening: concur with closing (24 Nov 2026, CISO via Karma's session; Claude role, not an auditor)
- Verdict: RULED (concur with CR-202). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 1.
- Ruling: CISO-15 already rules that `scripts/agents/**` is edited by an interactive session Karma directs, and that a harness author cannot be its own independent lens. A stack nobody can review inside the limit is a worse control than a small one. The pathguard and open-PR cap gate only labelled bot branches, and every interactive session posts as the founder.
- Door: two-way.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-17 PR 656: the watch reads two numbers through an Edge Function, not a repository secret (24 Nov 2026, CISO via Karma's session; Claude role, not an auditor)
- Verdict: RULED (concur with CR-209). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 8.
- Ruling: option A. A service-role key stays inside Supabase function secrets; GitHub holds only a function URL and a bearer token in an Environment `ops-watch`. Refused against `SECRETS_REVIEW.md` section 9, SEC-R04 and SK-05. Residual: a leaked token tells an attacker whether purge is stale; revoke is one console click.
- Door: two-way.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-18 PR 759 scanner: one narrow exception, one scanner fix, one code fix (24 Nov 2026, CISO via Karma's session; Claude role, not an auditor)
- Verdict: RULED (concur with CR-206). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 5.
- Ruling: allow `hiddenPlaces` by name and file (a persisted key; a rename would un-hide places); match network names on the whole identifier with a mutation test; make the error-code catch report a closed code; keep scanning the Moments library seam hard. No CODEOWNERS line for a non-account; pin the lists with a snapshot test. The scanner's "growing a list" rule is met by a named, file-scoped, reasoned exception.
- Door: two-way.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-19 BL-603: run the log readback on production first (24 Nov 2026, CISO via Karma's session; Claude role, not an auditor)
- Verdict: RULED (concur with CR-210). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 9.
- Ruling: read back the log fields and retention on production, then staging (a founder step, about 10 minutes). If a query-string token is logged with retention over 24 hours, the cheapest fix is the typed-code path, with the link as fallback. Whether `POST /verify` accepts a token hash in a body is UNVERIFIED and nothing is planned on it. Default if not done by the store cut: accept the residual (single use, 15 minutes, PKCE) and record it. What the session's Supabase connector reaches is unknown, so BL-603 acceptance 2 is unproven.
- Door: two-way.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CISO-20 Mail preflight: DMARC at p=none first (24 Nov 2026, CISO via Karma's session; Claude role, not an auditor)
- Verdict: RULED (concur with CR-205). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 4.
- Ruling: DMARC stays `p=none` with a reporting address at launch and moves to `p=quarantine` only after two weeks of clean reports (the path `docs/ops/DOMAINS.md` gives). An early `reject` drops sign-in codes, a lockout and not a safety gain. Residual: spoofed mail from our domain is not blocked until the ramp ends.
- Door: two-way.
- Founder-only: no. Signed: Chief Information Security Officer (Claude role, not an auditor)

### CPrivO-50 PR 759: `hiddenPlaces` is allowed in one file, not renamed (24 Nov 2026, CPrivO via Karma's session; Claude role, not counsel)
- Verdict: RULED (concur with CR-206). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 5.
- Ruling: it is a persisted on-phone key listing cities a parent chose to hide; renaming it without a migration would un-hide places, a privacy regression. Allow it by name in `store.logic.ts` only, pinned by a snapshot test; the same name elsewhere still fails. The catch in `launch.logic.ts` reports a closed code, never a string taken from an error.
- Door: two-way.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-51 BL-603: the evidence file holds no personal data (24 Nov 2026, CPrivO via Karma's session; Claude role, not counsel)
- Verdict: RULED (concur with CR-210). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 9.
- Ruling: the evidence file never holds an email, user id, token, IP or letter text; field names and durations only. If the readback shows tokens or addresses in logs, the Privacy Policy needs a line and the CLO drafts it; until then it gets none.
- Door: two-way.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-52 BL-1255: privacy signs meaning and properties after the table exists (24 Nov 2026, CPrivO via Karma's session; Claude role, not counsel)
- Verdict: RULED (concur with CR-212). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 12.
- Ruling: not signing seven strings that do not exist yet. Advisory on the ER-B02 candidate list: drop `family:invite_create` and `family:invite_accept` from the 1.0 set (no 1.0 build has an invite door, D-161 and D-162). The five that remained were `onboarding:first_letter_complete`, `capture:letter_save`, `capture:take_start`, `plus:offer_view`, `keeping:export_complete`; CPrivO-54 later struck the first. Advisory only; the signature is step 3.
- Door: two-way.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-53 PR 656: the purge freshness check is wanted (24 Nov 2026, CPrivO via Karma's session; Claude role, not counsel)
- Verdict: RULED (concur with CR-209). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 8.
- Ruling: the purge freshness check is the control behind the 30-day deletion promise. Its output stays numbers and fixed text, which both counted reviews checked.
- Door: two-way.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-54 Wire names: four basics candidates; `first_letter_complete` struck (24 Nov 2026, CPrivO via Karma's session; Claude role, not counsel)
- Verdict: RULED (concur with CR-213). Full text: `infra/exec-rulings-2026-11-24-wire-names.md`.
- Ruling: `invite_created` and `invite_accepted` stay in the registry at `consented`, unchanged, and are not basics candidates until the co-parent work ships. `onboarding:first_letter_complete` is struck: the phone cannot see a synced first letter, opt-in comes after the first letter, and a property on `letter_saved` would widen a row for every user, which is its own privacy ruling. Four candidates remain, advisory input to step 3 and not a signature: `capture:letter_save`, `capture:take_start`, `plus:offer_view`, `keeping:export_complete` (the last needs privacy's call on an export event at step 3). No tier changes; the basics set stays pinned to `screen_view`.
- Door: two-way.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CPrivO-55 `letter_deleted`: collect less; locked at T0 by pattern (24 Nov 2026, CPrivO via Karma's session; Claude role, not counsel)
- Verdict: RULED (concur with CR-225). Full text: `infra/exec-rulings-2026-11-24-letter-deleted.md`.
- Ruling: a delete and restore sequence per anonymous id, with `destination` (book or private), is a profile of what a person chose to hide about their own words and whether they changed their mind; two of the call sites also mark that someone left a family book. R-K3 keeps events out of deletion flows. Retire the key, and in step 2a forbid its candidate names (`letter_delete`, `letter_restore`) by pattern so a later registry row cannot bring it back unnoticed. The `me:settings_delete_account_screen_view` basics name is the one deletion-flow screen name still in the table and gets its own ruling before the step 3 signature, default remove. Not counsel; no line is legal advice.
- Door: two-way.
- Founder-only: no. Signed: Chief Privacy Officer (Claude role, not counsel)

### CDO-30 PR 656: `ops_cron_health` returns counts and job names only (24 Nov 2026, CDO via Karma's session; Claude role)
- Verdict: RULED (concur with CR-209). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 8.
- Ruling: the RPC returns counts and `scribe-*` job names only, within the content-free rule; it needs its own grant row in `supabase/tests/grants.mjs` and an access-matrix test that anon and authenticated cannot call it. Point the watch at production (it holds the deletion promise), with the target as a parameter so staging can run too.
- Door: two-way.
- Founder-only: no. Signed: Chief Data Officer (Claude role)

### CDO-31 BL-1255: rename first, sign after (24 Nov 2026, CDO via Karma's session; Claude role)
- Verdict: RULED (concur with CR-212). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 12.
- Ruling: a name that privacy drops costs nothing to remove before the first send; once anything sends, every rename loses history. So: generated table, rename, then the signature PR.
- Door: two-way.
- Founder-only: no. Signed: Chief Data Officer (Claude role)

### CDO-32 Wire names: the 39 rulings (24 Nov 2026, CDO via Karma's session; Claude role)
- Verdict: RULED (concur with CR-213). Full text and table: `infra/exec-rulings-2026-11-24-wire-names.md`.
- Ruling: name a key when a PM row, the registry, a guardrail or the insights engine reads it; merge it into `screen_view` or perf when the signal is already a basics row; drop it when the standard, FR-DAT-26, 27 or 38 or the registry's forbidden list says no event, or when it has no emitter and no reader. Result: 18 named, 4 merged, 17 dropped. Held events never send, so naming or dropping them is free. The category list stays at nine. `letter_deleted` is flagged for a separate CDO and CPrivO look in the step 2a PR.
- Door: two-way.
- Founder-only: no. Signed: Chief Data Officer (Claude role)

### CDO-33 `letter_deleted`: retire; no consumer (24 Nov 2026, CDO via Karma's session; Claude role)
- Verdict: RULED (concur with CR-225). Full text: `infra/exec-rulings-2026-11-24-letter-deleted.md`.
- Ruling: removing a held event is the CDO's own call. No decision reads the key: the insights engine, the registry funnels and the `decision-science.md` guardrails do not, and the three PRD v2 rows ask only a watch-only question. A number that cannot change what we do is not collected. Counts for step 2a: 18 dropped, 51 keys after 2a (47 named); held events 27, registry rows 24. After this nobody can learn from analytics how often people restore from Recently deleted; a later need comes as a new row with a decision.
- Door: two-way.
- Founder-only: no. Signed: Chief Data Officer (Claude role)

### CAIO-16 PR 449: no objection to closing (24 Nov 2026, CAIO via Karma's session; Claude role)
- Verdict: RULED (concur with CR-202). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 1.
- Ruling: the lane is not switched on and no model account exists for it, so a first switch-on is a spend and account decision that is not before us. Closing loses no guarantee, because the PR itself says its deny list guarantees nothing.
- Door: two-way.
- Founder-only: no. Signed: Chief AI Officer (Claude role)

### CDesO-45 BL-410: no rating surface; capture the live controls (24 Nov 2026, CDesO via Karma's session; Claude role)
- Verdict: RULED (concur with CR-208 and CPO-92). Full text: `infra/exec-rulings-2026-11-24-held-prs.md` section 7.
- Ruling: a two-up "Sounds like me | Not quite" would be a new surface asking a parent to rate the machine's work, and the machine does not add meaning. The screens to capture use the words the app says today and the tab labels Home, Book, Me (D-161).
- Door: two-way.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CCO-31 PR #2007 age-gate screen stop announce on Android only: passes the compliance fence (CCO-review tier) for merge into develop (24 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: RULED.
- Ruling: in `age-gate-screen.tsx` the PR adds `Platform` to the react-native import and guards the one `AccessibilityInfo.announceForAccessibility(g.stopTitle)` call with `Platform.OS !== 'android'`. Android already reads the polite live region around the stop title, so it spoke the title twice (BL-467 point 4). It only removes a repeat on one platform. It cannot clear a stop, pass the gate or change who reaches the stop. The 18+ gate, the 24-hour closure (D-026; LEGAL-REQ-002; CCO-17, CCO-18), the stored data and all copy are unchanged. No new data, no new word, no promise changes.
- Evidence (read at head 7ebb7653d430a645a229fc6c2a8c6100c263d17e): the fenced file's diff is two lines, the import and the guard at `apps/mobile/src/components/gate/age-gate-screen.tsx:85`; the stop view is entered only at `:110` (`setView('stop')`), untouched. The Android live region exists at `:178` (`accessibilityLiveRegion="polite"` around the `g.stopTitle` heading at `:179-181`). iOS still announces: the guard is `!== 'android'`, so iOS runs the same call as before, and `apps/mobile/test/age-gate-ns40.test.ts:187` still matches `announceForAccessibility(g.stopTitle)`. `apps/mobile/test/android-double-announce.test.ts` pins that the file has the live region, still has the direct call, and has no unguarded direct call (source-regex pins: they prove the text, not what a phone says). The PR also touches `plain-screen.tsx`, `drawing-boundary.tsx`, tests, `docs/BACKLOG.md` and a content test; those are outside the fence and are not ruled here.
- Not verified: no device, VoiceOver or TalkBack run; this read is of the code and the CI-run tests only. That Android speaks the title once, and that iOS still speaks it, is UNVERIFIED on a phone until the BL-467 device walk says so. No `compliance/` path, store age signal, `policy_acceptances` file or migration is in the diff.
- Way back: revert the one guard (and the `Platform` import) in `age-gate-screen.tsx`, with its pin in `android-double-announce.test.ts`.
- Founder-only: no. Counsel has not read this call; it is a delegated default until counsel confirms, and nothing here is counsel-approved. The CCO approval line is not posted by this entry: it goes on PR #2007 against its own head, and a new push needs a new one.
- Signed: Chief Compliance Officer (Claude role, not counsel)

### CISO-21 BL-491 point 1: the typed word is the gate for Delete account in 1.0 (25 Nov 2026, CISO via Karma's session, stream 6; Claude role, not an auditor)
- Question: step 5 of the deletion spec asks for re-authentication when the session is older than 24 h; the built S64 page gates the request on the typed word alone. Is that enough for the store build?
- Verdict: RULED. Exec review in place of counsel (D-172; CR-176 class: legal and privacy). Lead CISO; challenger CLO; consulted CPrivO and CCO. This turns CISO-5's recommendation into the decision.
- Options considered: (a) the typed word, with the compensating controls below (recommended); (b) build step 5 now (Face ID or passcode through LocalAuthentication, else the `reauthenticate-code` email) before the store build; (c) hide Delete account until (b) exists.
- Ruling: (a). For 1.0 the typed word "delete" is the only gate. This is a recorded departure from step 5 of `docs/legal/DELETION_AND_EXPORT_SPEC.md` 2.6.1; the spec is not edited here (its own legal PR records the departure). Compensating controls: Cancel undoes the request for 30 days, from this phone or by signing in on another; the `account-deletion-scheduled` email goes to the account address; App lock, where the person turned it on, covers the whole app. When BL-782's device owner check (Face ID or passcode before Erase everything) lands, the Delete account confirm uses the same check in that build or the next, which meets step 5's first branch.
- Why: someone holding an unlocked phone can already read every letter and, until BL-782, Erase everything with no check at all; a deletion request is less harmful than that, because it is undone for 30 days and the account owner is emailed. Option (c) removes in-app deletion while servers are on (Apple guideline 5.1.1(v), as quoted in the CLO skill section 9; not re-read this session). Option (b) is new auth UI on a CR-70 path just before the build. Risk and return: a mistaken or hostile request stays possible, and it is reversible with notice.
- Debate (self-challenged only; no separate agent was available to this session): the CLO's strongest objection was "you are departing from the spec you wrote for counsel, and a reader could call that weaker than promised." Answer: the spec is internal and unpublished; the privacy policy draft says nothing about re-authentication (`docs/legal/privacy-policy.md:114`); the departure is on record here. The CISO's own objection: the email is the main control and nobody has seen it sent from the hosted project. Accepted, as the condition below.
- Evidence: `docs/legal/DELETION_AND_EXPORT_SPEC.md:200` (step 5); `packages/content/src/features/account-deletion.en.ts:53-60` (`confirm`); `docs/emails/CATALOG.md:48,110`; `supabase/functions/purge-worker/emails.ts` (sends `account-deletion-scheduled`); `apps/mobile/src/components/app-lock/`; BL-782 (`docs/BACKLOG.md:3174`); `apps/mobile/eas.json` (production has `EXPO_PUBLIC_ACCOUNT_DELETION` on).
- Conditions: before the first store build with Delete account on, a test account (fictional) on staging receives the `account-deletion-scheduled` email, and a reply to it reaches the support mailbox (its safety line says "Reply to this email and we will stop it", `packages/content/src/emails/account.en.ts:62`); both are UNVERIFIED today.
- Door: two-way. Way back: add the step 5 check; no stored data changes.
- Revisit when: BL-782 lands, or anyone reports a request they did not make.
- Founder-only: no. Not legal advice; the exec team reads in place of counsel (D-172). Signed: Chief Information Security Officer (Claude role, not an auditor); concurred: Chief Legal Officer (Claude role, not a lawyer), Chief Privacy Officer (Claude role, not counsel)

### CLO-44 BL-491 point 3: the "photos" intro is gone; `what.intro` ships (25 Nov 2026, CLO via Karma's session, stream 6; Claude role, not a lawyer)
- Question: does the held intro that names "photos" ship, or which line names only what the build holds?
- Verdict: NOT A QUESTION for "photos": that line is no longer in the repo (changed in #735). RULED for the line that ships, as an exec review in place of counsel (D-172; CR-176 class: legal and privacy). Lead CLO; consulted CPrivO and CDesO.
- Ruling: the page draws `accountDeletionCopy.what.intro` (through `HELD.intro`): "Deleting your account removes your letters and books from our servers. You have 30 days to change your mind." It ships as is. It names only what the build holds on our servers: recording backup is off in every build profile, and v1.0 makes no photos. `introProposed`, which named a recording backup, is gone. S64 acceptance box 1, "No mention of photos anywhere in the flow", is met in today's strings: no shown string in `account-deletion.en.ts` names photos (only a code comment does). The per-book lines under the intro say which books stay with a co-parent, so "your letters and books" does not overclaim. The backup window (backups cleared within 38 days) is the privacy policy's to state (section 7), not this screen's.
- Evidence: `packages/content/src/features/account-deletion.en.ts:15-19`; `apps/mobile/src/components/settings/delete-account.logic.ts:13-15`; `apps/mobile/src/app/settings/delete-account.tsx:233`; `apps/mobile/eas.json` (`EXPO_PUBLIC_BACKUP` off in all five profiles); `docs/legal/privacy-policy.md:114`.
- Debate (self-challenged only): "a shared book is not removed, so 'your books' is untrue for a co-parent." Answer: the very next lines on the page name each book's outcome (`staysNone` and the rest), and CDesO-35 point 3 adds the line for a parent who left. Rejected as a reason to change the intro.
- Conditions: before any store profile turns on recording backup or sends photos to our servers, this line names them or that build waits. `exportFirst.body` was not re-read for this ruling.
- Door: two-way. Way back: one string.
- Founder-only: no. Not legal advice (D-172). Signed: Chief Legal Officer (Claude role, not a lawyer)

### CDesO-46 BL-491 point 5: a failed Cancel says the outcome isn't known yet (25 Nov 2026, CDesO via Karma's session, stream 6; Claude role)
- Question: a failed Cancel deletion shows the shared line "Nothing has changed. Deleting an account needs a connection.", which can be read as the deletion being blocked. What does a failed cancel say?
- Verdict: RULED (words and where they go). CR-176 class: legal and privacy. Lead CDesO with the content owner's pen; the CLO reads it as a deletion term in place of counsel (D-172) and concurs. "canceled" is in US spelling, as the WRITING-GUIDE "US or UK spelling" decision (CMO-RULED 21 Nov) rules for every new line. The older lines beside it keep their UK spelling for now (`scheduled.cancelled`, `open.restoringTitle` and `open.cancelling`, `account-deletion.en.ts:76,94,97`): that decision changes new lines only, so they wait for the spelling sweep and are not changed here.
- Ruling: new key `accountDeletionCopy.errors.cancelFailed`: "It's not clear yet if the deletion was canceled. Tap Cancel deletion again." It is shown for a failed Cancel deletion press, offline or failed, on the open-deletion screen and on the Delete account scheduled page (the same press). A failed request keeps `failureLine`. The content test that says every error line contains "Nothing has changed." exempts `cancelFailed` the way it already exempts `loadFailed`, and asserts that it does not say it.
- Why: `cancelDeletion` returns a call failure without reading the status again (`apps/mobile/src/lib/account-deletion/api.ts:122-126`), so after a lost answer the phone cannot know whether the server cancelled. WRITING-GUIDE section 8 (error messages) says to treat an unknown outcome as unknown. The line never suggests the person is out of the woods, names the one thing to do, and pressing again is harmless: the server answers false when nothing is open, and the phone then reads `none` as success.
- Checked against the house rules: no dashes, straight apostrophe, contractions, no fear or loss words, no "safe", the button named by its visible label (`scheduled.cancelButton`).
- Evidence: `apps/mobile/src/components/settings/delete-account.logic.ts:63-66`; `apps/mobile/src/components/settings/open-deletion.tsx:62`; `packages/content/src/features/account-deletion.en.ts:109-115`; `packages/content/WRITING-GUIDE.md` sections 5 and 8.
- Debate (self-challenged only): "offline, the phone knows nothing was sent, so 'not clear' is evasive." Answer: the offline class also covers a connection lost mid-call, and one honest line for both is better than a second key that can be wrong. Rejected.
- Door: two-way. Way back: drop the key; the press falls back to `failureLine`.
- Founder-only: no. Signed: Chief Design Officer (Claude role); concurred: Chief Legal Officer (Claude role, not a lawyer)

### CDesO-47 BL-492 point 1: no no-break space in strings; try a line-break setting, else accept (25 Nov 2026, CDesO via Karma's session, stream 6; Claude role)
- Question: "phone." sits alone on the second line of `errors.crash.body` at 402 and 375 pt. A no-break space in the string, a layout fix, or accept?
- Verdict: RULED.
- Ruling: no U+00A0 in content strings. Design systems draws the crash body with `lineBreakStrategyIOS="push-out"` on iOS and `textBreakStrategy="balanced"` on Android. If the device check at 402 and 375 pt still leaves one word alone, accept it as is: a line break is not a reason to change words.
- Why: an invisible character breaks exact-string pins (`rules.test.ts`, `test/launch-retry.test.ts:462`), search and translation, and it forces a wrap where an accessibility size may need one elsewhere. Both props are in React Native's own types (`node_modules/react-native/types_generated/Libraries/Text/TextProps.d.ts:51,77`). That Apple's push-out strategy avoids a lone last word is from memory and UNVERIFIED this session, hence the device check.
- Debate (self-challenged only): "a string fix is one character and certain; the prop is uncertain." Answer: the cost lands on every future reader of the string, and the fallback is to accept, not to add the character.
- Door: two-way. Way back: remove the prop.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CPO-94 BL-493 point 1: accept the welcome while the first deletion-status read is out (25 Nov 2026, CPO via Karma's session, stream 6; Claude role)
- Question: may a signed-in phone with no book and no note show the welcome while the first deletion-status read is out, or should the paper come first?
- Verdict: RULED: accept. Lead CPO; consulted CDesO and CPrivO; challenger CISO.
- Ruling: keep the welcome. The pins #1757 added (`[BL-493 point 1]` in `apps/mobile/test/account-deletion-gate-hook.test.ts`) stay as the record.
- Why: the paper does not guard the case the row names. With no answer, the cap ends the paper after 3 s and the gate answers welcome (`CHECK_CAP_MS`, `apps/mobile/src/lib/account-deletion/use-first-run-gate.ts:41`; `chooseScreen`, `open-request.ts:232-243`), so an offline fresh install reaches the welcome either way, and every signed-in fresh install would pay up to 3 s for it. The harm is small: a letter started then stays on the phone (CPrivO-19 took BL-486 option (b)), and once the read lands the gate shows the deletion screen with Cancel.
- Debate: the CISO's objection: "with BL-486 at option (b), this is the last guard on a fresh install." Answer: it is not a guard offline, which is the only time it matters; online the read lands in about the time the welcome takes to draw.
- Door: two-way. Way back: answer `checking` for a signed-in phone with no book until the first read.
- Revisit when: S1-35 or a tester shows a letter made during an open request.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPO-95 BL-493 point 2: keep the up-to-3 s paper; no remembered answer (25 Nov 2026, CPO via Karma's session, stream 6; Claude role)
- Question: is a paper of up to 3 s on every Onboarding mount acceptable for a signed-in phone that holds a closed book, or should the last answer be kept for a short time?
- Verdict: RULED: accept as is. Lead CPO; consulted CDesO; challenger CISO.
- Ruling: no cache of the last answer. Only a signed-in phone with a closed book and no visible book sees the paper; with the server reachable it lasts one status read, and 3 s is the ceiling when offline or slow.
- Why: remembering an answer needs a trust window on the deletion gate (a CR-70 path), and a stale "no request" answer would show the welcome to a phone whose account has a request open. The population is small and the cost is seconds.
- Debate: the CDesO's objection: "every return to Onboarding blinks paper." Answer: true and bounded; it is measured on the phone in S1-35 before anyone builds a cache.
- Door: two-way. Way back: none needed; a cache can be added later with its own rule.
- Revisit when: S1-35 shows the paper on more than a cold launch, or a tester reports it.
- Founder-only: no. Signed: Chief Product Officer (Claude role)

### CPrivO-56 BL-494 point 4: after the purge, the step-1 line says the letters stay in Recently deleted (25 Nov 2026, CPrivO via Karma's session, stream 6; Claude role, not counsel)
- Question: PR #2090 finds that after the day-30 purge a phone never learns its letters are gone, so they stay in Recently deleted with no end date and the shelf and card dates stop being true for them. Change the line, have the phone act on its own note, or something else?
- Verdict: RULED. CR-176 class: legal and privacy. Exec review in place of counsel (D-172). Lead CPrivO; the CLO reads the words; consulted CDO and the sync owner (through #2090); challenger CISO.
- Options considered: (a) change `what.onThisPhone` (recommended, with the card fix below); (b) the phone erases these letters once its note's date has passed; (c) both; (d) leave it.
- Ruling: (a). `accountDeletionCopy.what.onThisPhone` becomes "On this phone, your letters stay. The ones already saved to your account move to Recently deleted. After your account is deleted, they stay there until you erase them." The code comment above it, which assumes a later pull erases them, is corrected in the same content PR. With it: the Recently deleted card does not draw "Kept here until {date}" once that date has passed (no new words; a mobile follow-up for Karma to file). On the same condition `shelfHelp` ("Letters you delete wait here for 30 days.", `strings.en.ts:919`) is not drawn while the shelf lists any letter whose 30 days have passed, so the shelf never states a clock that has stopped for the letters it shows. The rule covers every place that draws `shelfHelp`: the shelf itself (`settings/recently-deleted.tsx:150`) and the two rows that open it, where it is the subtitle (the Settings row, `settings/index.tsx:174`, and the first-run row, `onboarding.tsx:647`); a row drops the subtitle and keeps its title. For every other phone it stays as it is, because it is true there. No new words.
- The route to the shelf: today a sole parent whose only book went with the account has no way to these letters after the purge. Read from the code, not run on a phone: the first-run row is drawn only when `listDeletedBooks()` is above 0 (`onboarding.tsx:195`, `first-run/recently-deleted-row.logic.ts`), that list holds only books deleted on the phone (`wipe.listDeleted`), and the pull's `closeBook` (`apps/mobile/src/lib/sync/merge.ts:886-890`) sets `server_state = 'deleted'` and marks no such book, so no row is drawn and nothing else on first run leads to Recently deleted. So the same mobile follow-up also draws the first-run row while the shelf lists any letter (`listDeleted()` above 0), with the same title and no new words, and its test shows a sole parent after the purge sees the row and finds those letters on the shelf with Erase there. The new line ships only in the same PR as that route. If the follow-up finds the letters cannot be listed or erased from there, the third sentence ships as "After your account is deleted, they stay on this phone." instead, and the reason goes in that PR. The privacy policy's Recently deleted line (`docs/legal/privacy-policy.md:113`, section 7, "Then it is erased") has the same gap for these letters; it is legal text, so the exec team's proposed exception rides the next legal PR (BL-783) and is not edited here.
- Why: the line becomes true, and it tells the person the one thing that changes for them. (b) erases on the strength of the phone's own note. With recording backup off, the recordings exist only on that phone, and a note can be stale (a cancel made on another phone while this one was offline), so a wrong erase loses recordings for good: a one-way door on a person's own data. The letters left behind are on the person's own phone, under their control, and gone from our servers; nothing here keeps more on our side.
- Debate: the CISO's objection: "letters of a deleted account stay on a phone forever." Answer: they are the person's own words on their own phone, and the line now says so; on a phone that still shows a book, Erase is one tap in Recently deleted and Erase everything exists. For a sole parent whose only book is gone after the purge there is no route today (the BL-776 row, CDesO-15, needs a deleted book, and the purge leaves none); the route above gives one, and "until you erase them" ships only with it. (b) waits for a proof that the account is gone (for example an auth answer that the user no longer exists), never the date alone.
- Evidence: PR #2090 at f6936f6fef3cf54c86282ecc7fd3a8f89fc7e29d (merged as 18a2087a; its findings are tests, not run on a phone or staging); `packages/content/src/features/account-deletion.en.ts:32-38`; `packages/content/src/strings.en.ts:919,923`; `apps/mobile/src/lib/sync/merge.ts:886-890`; `apps/mobile/src/lib/store.ts:1079-1085,1309-1311`; `apps/mobile/src/app/onboarding.tsx:195,643-650`.
- Second review (Review B on this PR) found the first version kept `shelfHelp` with no reason; accepted, and the shelf rule above was added. Its next pass found the first-run route the Debate leaned on is not there (read from the code); accepted, and the route and the fallback line above were added. Also accepted from the reviews: the gap between `prepare_account_purge` and the auth delete can last as long as the worker retries a failed step (up to 7 days), not seconds, so a phone that syncs a shared book in that gap erases the person's own letter there; the line stays true for the person's own phone in the common case and the gap goes to a follow-up row for the sync owner, which stream 6 files through stream 1 (the backlog owner).
- Conditions: the line ships with #2090's finding on `develop` (merged as 18a2087a). If a later change lets the phone learn of the purge, the line goes back to two sentences.
- Door: two-way for the words. Way back: restore the old string.
- Founder-only: no. Not legal advice (D-172). Signed: Chief Privacy Officer (Claude role, not counsel); concurred: Chief Legal Officer (Claude role, not a lawyer)

### CDesO-48 BL-494 point 6a: the signed-out open-deletion screens stay as they are (25 Nov 2026, CDesO via Karma's session, stream 6; Claude role)
- Question: `open.restoringBody` is drawn while signed out, and the executing screen signed out offers Sign in, which cannot cancel. Accept or change?
- Verdict: RULED: accept. Lead CDesO; consulted CPO and CPrivO.
- Ruling: no change for 1.0. Restoring, signed out: the line sits above Sign in, which is the step that brings the letters back, and the state is reached only when a session ends in the seconds after a cancel. Executing, signed out: the body promises nothing about cancelling ("Your account is being deleted now. This can take up to a day."), the sheet no longer offers a cancel there (#1761), and Sign in keeps the phone usable with another account, so the screen is never a dead end. The dropped `waiting` result of `d.signOut()` stays: the sign-out finishes on its own and the screen has nothing to say.
- Evidence: `apps/mobile/src/lib/account-deletion/open-request.ts:270-282` (`deletionView`); `packages/content/src/features/account-deletion.en.ts:78,92-95`; PR #1761 body, point 6(a).
- Door: two-way. Revisit when: S1-35 shows the restoring screen signed out in normal use.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-49 BL-495 point 7: the export ZIP README says what Export did, and gives the address (25 Nov 2026, CDesO via Karma's session, stream 6; Claude role)
- Question: `errors.launch.readme` says "Nothing here was changed or removed" (claims row E8, unverified) and offers help with no address. Keep, or new words?
- Verdict: RULED (the spec owner's wording, row KEEP lifted). CR-176 class: a claim in shipped words. The CLO reads it as a claim in place of counsel (D-172) and concurs.
- Ruling: `errors.launch.readme` becomes, with `${brand.support.email}` from `packages/brand` (today `publisher.supportEmail`), four lines joined by `\n`:
  "These are the files found on this phone when the book couldn't open.\nThe recordings folder holds your voice recordings; they play in any audio app.\nThe database folder holds the book's own files, copied exactly as they were on this phone.\nKeep this export where you can find it again. For help getting it back into the book, write to us at ${brand.support.email}."
- Why: Export copies the files byte for byte and never opens the store (`apps/mobile/src/lib/resilience/recovery-export.logic.ts:1-7`, `recovery-export.ts:59-89`), so "copied exactly as they were on this phone" is provable; "Nothing here was changed or removed" is not, because Try again runs update steps that delete settings keys (claims row E8). "Somewhere safe" goes ("safe" is on the house never list), and the address is the live support mailbox. The second line is unchanged.
- Debate (self-challenged only): the CLO's objection: "an address in a file that leaves the phone invites mail we cannot answer about a broken database." Answer: support already answers book problems at that address, and a README that says "write to us" with no address is the gap the critics named (L2). Rejected.
- Evidence: `packages/content/src/strings.en.ts:1293-1310`; `packages/brand/index.ts:35,59-61`; `docs/design/EXPERIENCE_PASS_2026-10.md:1243`; WRITING-GUIDE section 0.
- Door: two-way. Way back: one string. The S51 row in the experience pass changes from KEEP to CHG in the content PR.
- Founder-only: no. Signed: Chief Design Officer (Claude role); concurred: Chief Legal Officer (Claude role, not a lawyer)

### CDesO-50 BL-495 point 4: recovery screen actions go inline from AX1, as built (25 Nov 2026, CDesO via Karma's session, stream 6; Claude role)
- Question: PR #1765 puts the recovery screen's buttons inline after the words from AX1. AX1 or AX3?
- Verdict: RULED: AX1, as built.
- Ruling: keep `plainActionsInline` at AX1. It is the threshold the sign-in sheet (`inlineFooter`, `apps/mobile/src/lib/auth/ui.tsx:93`) and StateScreen's pinned action already use (`useIsAccessibilitySize`, AX1 and above, `apps/mobile/src/lib/a11y.logic.ts:15`), so one rule holds across the app and one test covers it. At AX1 the words are short enough that the buttons follow them on screen; at AX3 and above the critics measured the words running past a pinned window on an SE 3.
- Not verified: no device run; S1-34 (e) in `docs/qa/DEVICE_TEST_PLAN.md` is the check.
- Door: two-way. Way back: change the threshold in one place.
- Founder-only: no. Signed: Chief Design Officer (Claude role)

### CDesO-51 BL-2242: the Listen screen reader ready line is approved as written (27 Nov 2026, CDesO via Karma's session; Claude role)
- Question: `en.listen.ready.hintScreenReader` ("Double tap Start recording and talk.") is live on `develop` (`packages/content/src/strings.en.ts:305` at 0082f8e0; added by BL-1827, PR #1708) with no `PROPOSED` marker and no exec reading on record (BL-2242). Does it ship as written?
- Tier and type: T1; clear. The council gave no tier; this one is set by precedent (CPO-1), UNVERIFIED as the council's.
- Options considered: approve as written; change the words; keep it marked PROPOSED until a device walk
- Ruling: approved as written; no word change. The line carries a one-line comment citing this entry (`strings.en.ts:305`, the line above `hintScreenReader`, which moves to `:306`).
- Why: it names the control a screen reader announces ("Start recording", the `en.listen.ready.startA11y` label), it is a plain imperative, and it is glossary-safe. `packages/content/test/spoken-lines.test.ts:24-27` already pins the exact text and that it contains `startA11y`; `:29-32` keeps "the red circle" (BRAND.md:104) on the sighted line only. What VoiceOver speaks on a phone is UNVERIFIED: no device walk was read for this entry.
- Door: two-way
- Way back: a new reading changes the words, the comment and the pin in `spoken-lines.test.ts` together.
- Revisit when: a VoiceOver walk shows the control announced under another name, or `startA11y` changes.

### CPO-96 BL-390: close as agree in substance; the recordings-place words stay (27 Nov 2026, CPO via Karma's session; Claude role)
- Question: BL-390's done-when asks for one identical sentence on where recordings live in the three in-app places. The three places say it in different words, each by an earlier ruling. Is the row done?
- Tier and type: T1; clear. The council gave no tier; this one is set by precedent (CPO-1), UNVERIFIED as the council's.
- Options considered: keep the row open until one sentence is used everywhere; close it as agree in substance; rewrite the three lines now
- Ruling: close BL-390 as "agree in substance". The recordings-place words stay as they are. They are pinned by `packages/content/test/recordings-place.test.ts` (present on `develop` at 0082f8e0), which holds the one fact the places must share (kept on this phone, never "only" or "stays", no backup of ours) rather than one sentence. The BACKLOG done-when edit belongs to the stream that owns `docs/BACKLOG.md`; this entry does not edit it.
- Why: the substance of the row, that no place promises more than the build does, is met and tested; the letter of it, one identical sentence, would undo rulings the test file names in its header (lawyer-2 H4, CCO-8, the 8 Nov CTO ruling). The row's other checks (the claims registry has one row per claim; the website, store listing and Subscription Terms agree) were not re-read for this entry: UNVERIFIED.
- Door: two-way
- Way back: reopen BL-390 and ask for one sentence.
- Revisit when: recording backup ships (`claims-capabilities.test.ts` then gates the backup claim), or any of the three places changes its words.

### CPrivO-57 D-061: the website's Private scene says the full registered promise word for word (27 Nov 2026, CPrivO via Karma's session; Claude role, not counsel)
- Question: the website's Private scene (`site.scenes.s09`, headline "Private by default.", in `apps/web/src/content/site.ts`) says a shortened privacy promise that stops at "never use them for ads". Must it say the registered `en.trust.promise`?
- Tier and type: T1; clear. The council gave no tier; this one is set by precedent (CPO-1), UNVERIFIED as the council's.
- Options considered: keep the shortened line; say the full promise word for word, held equal by a test; drop the line from the scene
- Ruling: the Private scene says the full registered promise `en.trust.promise` word for word, held equal by a test. Carried by open PR #2129 (head fe5089dc1a6ddb0927d4a5f62e60d80733daa3b7): the s09 point in `apps/web/src/content/site.ts`, and a test in `apps/web/test/copy-rules.test.ts` that the scene contains `en.trust.promise` and no shortened copy of it beside it. Not merged when this entry was written.
- Why: D-061 says the privacy promise once, the same way, in a few set places; `packages/content/src/strings.en.ts:1583` says the store listing and website use `trust.promise` word for word. The shortened line leaves out the promise not to train machine learning models on the letters. This is the registered promise, not a new one. Filed as CPrivO, not CCO: `docs/agents/exec/COUNCIL.md:56` has the CMO own website claims and consult the CPrivO on privacy claims, `:62` gives personal data to the CPrivO, and no CCO entry in this file rules on `trust.promise`. Whether the website is live, and in which `SITE_MODE`, is UNVERIFIED (as in CMO-20).
- Door: two-way
- Way back: revert the s09 point and its test in #2129, or redeploy the previous website version.
- Revisit when: `en.trust.promise` changes (the test then fails until the site follows).

### CMO-21 D-139: the website title and brand line take the BRAND.md descriptor; four site lines held as PROPOSED (27 Nov 2026, CMO via Karma's session; Claude role)
- Question: the website still introduces the product with the descriptor D-139 retired ("the baby memory book you fill by talking" and its variants). What changes, and what waits?
- Tier and type: T1; clear. The council gave no tier; this one is set by precedent (CPO-1), UNVERIFIED as the council's.
- Options considered: change every site line now; change the title and brand line to the registered words now and hold the lines that need new words; change nothing until all lines have approved words
- Ruling: the website title (`site.meta.title`) and brand line (`site.brand.line`) take the BRAND.md descriptor word for word ("letters to your child, in your own words and voice"), carried by open PR #2129 with a test that pins both. Four more site lines still say the retired descriptor: `comingSoon.line`, `comingSoon.shareTitle`, `comingSoon.shareText` (`apps/web/src/content/site.ts:72`, `:90`, `:91` on `develop` at 0082f8e0) and `welcomeEmail.intro` (`:280`). Their replacements are new words. They are recorded here as PROPOSED, are not approved by this entry, and are held, not applied, until approved:
  - `welcomeEmail.intro`: `${NAME} keeps letters to your child, in your own words and voice. It is coming to iPhone in the US. You will hear from us once more, at launch.`
  - `comingSoon.line`: "Letters to your child, in your own words and voice. Say what happened today, out loud."
  - `comingSoon.shareTitle`: `${NAME}: letters to your child`
  - `comingSoon.shareText`: `${NAME}: letters to your child, in your own words and voice. A few words at the end of the day, said out loud.`
  #2129's `copy-rules.test.ts` lists the four as the only lines allowed to keep the old descriptor (a shrink-only list); each leaves the list when its words change.
- Why: D-139 replaces the old descriptor everywhere a parent reads first; BRAND.md lines 14 and 89 give one descriptor, with the line standing alone where the name is already on screen. The title and brand line take the registered words unchanged, so they add no new claim; the four lines need new sentences, which are new words. Filed as CMO, not CBO: `docs/agents/exec/COUNCIL.md:14` gives positioning and the website's claims to the CMO; the CBO's `:15` is business model and pricing, and this file has no CBO entry.
- Door: two-way
- Way back: revert the two lines and their test in #2129, or redeploy the previous website version.
- Revisit when: the four PROPOSED lines are approved; each changed line then leaves the shrink-only list in the same PR.

### CLO-45 BL-2128: recommended changes to the /delete-account words in draft PR #2066 (27 Nov 2026, CLO via Karma's session; Claude role, not legal advice)
- Question: draft PR #2066 (head 5d1fe325813f7b6a21379aebcd90d6fced54751c) builds `/delete-account` from the counsel draft `docs/legal/delete-account-page.md` (1.1.0, draft-for-counsel). Which of its words should change before it publishes?
- Tier and type: T1; clear. The council gave no tier; this one is set by precedent (CPO-1), UNVERIFIED as the council's.
- Options considered: publish the draft words unchanged; recommend changes and hold them for counsel; rewrite the page in the PR
- Ruling: recommended changes, all PROPOSED and held for counsel; the legal text merges under D-125. Lines are of `apps/web/src/lib/legal/delete-account-copy.ts` in #2066, with the draft's line in brackets:
  - `next.items[1]` (`:44`; draft `:48`): the backups clause uses the registered data-policy wording on backups within 38 days (`docs/legal/data-policy.md:217`, "from database backups within 38 days"); today it says "from our backups within 38 days".
  - `removed.items[0]` (`:51`; draft `:55`) becomes "Your letters, from every book on your account."
  - `removed.items[3]` (`:54`; draft `:58`), the recording backup line, is dropped.
  - `removed.items[5]` (`:56`; draft `:60`) takes the app's words "A copy you exported stays wherever you saved it." (`packages/content/src/features/account-deletion.en.ts:31`, `copies`).
  - `kept.items[1]` (`:64`; draft `:69`), the activity-logs line, becomes "Activity logs, for 24 months, without your name or email."
  The copy file's header (`:4-6`) says its words are the draft's unchanged, and `apps/web/test/delete-account.test.ts` fails if a word differs, so each change lands in the draft first, then in the copy file. This entry changes neither file.
- Why: each change brings a page line into line with words already registered elsewhere: the data policy's published deletion clocks, and the app's own deletion screen. The council's reasons beyond that were not given for this record. Still blocked, whatever happens to these words: CR-187 and CR-193 Ruling D-15 (`docs/agents/cto/RULINGS.md:1229`, `:1293`; D-15 names draft lines 26 and 74 to 82, the email-started deletion lines); the evidence that backups clear within 38 days; and counsel's read. Not legal advice.
- Door: two-way while the page is noindex and off `main`
- Way back: keep the draft words; each recommendation is a separate line.
- Revisit when: counsel answers on the draft, or CR-187 is applied and the 38-day evidence is recorded.

### CCO-32 PRs #2079, #2117 and #2141 (consent and signed-in surface tests; Firsts mark and label): pass the compliance fence (CCO-review tier) for merge into develop (27 Nov 2026, CCO via Karma's session; not counsel)
- Verdict: RULED.
- Ruling: all three PRs reach the CCO-review tier only through the content marker `record_policy_act` (`compliance/FENCE.json` `content_markers.cco_review`); none touches a protected path or marker. #2079 and #2117 change test files under `supabase/tests/` only: no migration, function, grant, policy row, stored field or copy. #2079 (BL-2146) adds two checks to `sync_pull_consent.test.mjs`: the pull rate limit counts closed pulls too and a limited pull returns nothing, and the consent gate (`content_gate_state`) comes before every read of a book table in the live `sync_pull` source, `held_drafts` and `held_drafts_gone` included, with a mutant that moves the gate down and must fail. #2117 (BL-1921) adds `authenticated_surface.test.mjs` and `authenticated_surface.mjs`: every privilege the `authenticated` role holds in any non-system schema, schema CREATE included, is compared with a written allowlist both ways; six rolled-back mutants must fail it, and a standing check says `authenticated` holds CREATE on no schema; `access_matrix.test.mjs` imports its `sync_private` helper list from the new file. Both make the existing consent and access rules harder to break unseen; neither moves a rule. #2141 (BL-2143, Firsts) adds `supabase/migrations/20261127100000_entries_firsts.sql` (APPLY.md File 51): `entries.first_mark` (L3) and `entries.first_label` (L4, the parent's own typed words, null or 1 to 200 code points). In compliance terms: (1) collection: the label is new free text of the same class as a letter's words, optional, typed by the parent, and `docs/legal/DATA_CLASSIFICATION.md:590` and `:749` already hold both rows (L3, L4) with the reason, so it meets the checklist's DATA_CLASSIFICATION row; the mark is a boolean. (2) Consent before storage: both columns join the content tuple in `entries_family_rules`, so any change of either needs current content consent (SCCON), and an insert was already gated whole. (3) Consent before the other parent's read: the other parent reads the pair only through `book_entries`, which has no client grant, inside `sync_pull`, whose consent gate comes before every book read (the #2079 check); the pair reaches exactly the readers who already read that letter's words. (4) Withdrawal, deletion, restore: withdrawal stops every write of the pair (SCCON) and does not stop a delete; deletion is a row delete, so the pair goes with the letter, and `entry_versions` does not copy it; a tombstoned letter's pair cannot be changed by a client (SCTMB), and restore brings it back with the letter. (5) Grants and RLS: no new table, view, function or grant; the columns take the existing `entries` grants under the unchanged author-only policies, and the file restates the trigger revokes and the view revoke. (6) Meaning: no default, trigger or function writes or changes a label; `first_mark` defaults to false; the server stores exactly what the author sent or refuses it whole. (7) Logging: every refusal is value-free (SQLSTATE 23514, the rule's name, no value, no DETAIL), and the only audit trigger on `entries` records deletes and restores with no content. Nothing reaches a person until the phone flag `EXPO_PUBLIC_FIRSTS` (BL-968) is on. No new collection beyond the class already registered, no new reader, no new recipient, no copy or promise change.
- Evidence (coverage: each PR's own diff against its merge base with develop, `git diff $(git merge-base origin/develop <head>) <head>`, so a merge of develop into a PR does not void this ruling; heads read: #2079 ef5cd20762e1d1b6f8e5068f465e615ee3b082e8, #2117 355ce79ff63d2ce813423c67f801e743c2afc939, #2141 6f7acc5785c657e4e4bc1e16c7b49484e75682a5). #2079 is one file, +66 -0; the marker appears only in the hunk header, which repeats the existing unchanged line 144 of `sync_pull_consent.test.mjs` (`select public.record_policy_act('terms', ...)`), not in any added line. Its mutant rewrites `sync_pull` from `pg_get_functiondef` inside the test's own database (`supabase/tests/harness.mjs` `createDb` builds a fresh PGlite) and restores it, then checks the restored source is byte-equal. `sync_pull` reads `held_drafts` and `held_drafts_gone` after its gate (`20261123100000_sync_pull_consent_gate.sql:136`, `:367`, `:372`), and both tables exist since `20261016000000` (`:300`, `:353`). #2117 is three files, +246 -4; the marker appears only in the allowlist entry `record_policy_act(text,text,text,text,text,text,text,text,timestamp with time zone,bytea,jsonb,text,integer)`, which states the EXECUTE grant `20261108000000_consent_record_fields.sql:196` already gives `authenticated`; the test asserts the grant, it does not make one. The six mutants, each in `withMutant` (begin, rollback): a definer function returning `raw_transcript`, the same in `sync_private`, a PUBLIC-executable function, a SELECT grant on `entry_versions`, a CREATE grant on schema public (m4c, with the schema CREATE query and the standing check, added by commit a0c3bb74), and a revoke of `sync_pull`. The file also proves the first mutant's leak in its own rolled-back transaction and plants a missing allowlist entry in memory; neither changes the database. The moved helper list is the same 17 entries. #2141 is nine files, +590 -5; the marker appears only in four added fixture calls in `supabase/tests/firsts.test.mjs` (`record_policy_act('sensitive-data', ...)`, withdraw and accept, twice), never in the migration. Read in the migration: the two columns and three CHECKs; `entries_validate_limits` with the three value-free refusals; `entries_family_rules` with the pair in both tuples and a contributor's new or changed `first_label` in the approval reset; `entries_guard_immutable` with the pair in the tombstone list; the revoke on all three trigger functions; `book_entries` replaced with the pair appended and its revoke restated. Read elsewhere: the author-only `entries` policies (`20260930000000_scribe_core.sql:264`, `20261002020000_data_governance.sql:203`); `entries_audit` (`20261002020000_data_governance.sql:339`); the `entry_versions` inserts (`20261016000000_sync_v1_server.sql:598`); the non-author branch of `sync_pull` (`20261123100000_sync_pull_consent_gate.sql:229`). `firsts.test.mjs` asserts each rule above, including that no function in public assigns `first_label`, that a write without consent is SCCON, that a deleted letter's pair is SCTMB, that a private letter's label never reaches the other parent's pull, and that `book_entries` takes no client read (42501), each with a mutant. Fixtures in all three use the fictional family "Asha".
- Not verified: the CCO ran no test for this entry; the author reports the full database suite passing at #2141 6f7acc57 (68 files), which this entry did not re-run, and the counted reviews on each PR carry their own runs; CI results were not read here. No hosted database was touched, and #2141's migration is not applied: its check is proven only on PGlite. That the phone sends no label while `EXPO_PUBLIC_FIRSTS` is off, the author's own second phone (the author's own pull does not carry the pair yet), and whether a data export carries the label are BL-968's and not read here. #2079's mutant is not in a transaction: if the test stops between rewrite and restore, only that file's throwaway database holds the mutant (UNVERIFIED that no other file shares it, read from `createDb` only). Raised in this read and closed before this entry: at b9038188 a contributor could add or change a label on their own letter that a parent had already added, and `entries_family_rules` reset the approval only when `final_text` changed. That is a product rule, not a law, and Karma took the default: commit 6f7acc57 adds `first_label` to the reset, so a relative's new or changed label sends the letter back to pending and out of the book, as new words do; a mark alone does not, as a new date does not. `firsts.test.mjs` checks both, with a mutant that drops the label from the reset and must fail.
- Way back: revert any of the three PRs. #2079 and #2117: nothing outside `supabase/tests/` depends on the new files. #2141 before it is applied: revert the PR; after it is applied: the rollback migration its header and APPLY.md File 51 describe (recreate `book_entries` and the three trigger functions; dropping the columns deletes parents' marks and labels, only after a backup and by the data architect's decision). For this entry, revert the one entry.
- Founder-only: no. Counsel has not read this call; it is a delegated default until counsel confirms, and nothing here is counsel-approved. The CCO approval line is not posted by this entry: the CCO posts it on each PR at its own head, after comparing that head's own diff against its merge base with the diff read above, and a new push needs a new one.
- Signed: Chief Compliance Officer (Claude role, not counsel)
