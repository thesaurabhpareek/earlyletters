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
