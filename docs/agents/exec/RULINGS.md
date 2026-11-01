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
- Ruling: added to the 3.0.0 draft on #163 (commit dc1f4fc): section 2 (the IP is also used to work out the country), section 5 (the purpose), section 12 (what we refuse, that the IP is not kept, the daily count, DB-IP named, and that a wrong lookup can be raised without being asked where you are), and a "which builds" line that the part takes effect when the check ships. COUNSEL_PACKET 1.5.0 adds Q57 (the country block, no name screening, the D-131 EAR list, and the label reading). Both stay a founder merge (D-125).
- Why: a separate PR would collide with #163, which rewrites the same files and versions. 3.0.0 already says a part takes effect only when its feature ships, so the line is true before the hook is on. Return: one founder merge carries it. Risk: low; counsel reviews the wording in Q57.
- Door: two-way
- Way back: remove the four edits from the draft before it is published.
- Revisit when: counsel answers Q57, or the blocked list changes in a way the general wording no longer covers.
- Signed: Chief Legal Officer (Claude role, not a lawyer)

### CPrivO-2 The country check does not change the App Privacy label (1 Nov 2026, 05:19 UTC, CPrivO via the compliance session; not counsel)
- Question: once the sign-up hook works out a country from the IP address, do we declare Coarse Location?
- Tier and type: T1; complicated
- Options considered: declare Coarse Location; declare nothing and say why; ask counsel first and hold the hook.
- Ruling: declare nothing. Apple's "collect" is transmitting data off the device "in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time" (developer.apple.com/app-store/app-privacy-details, read 1 Nov 2026). The hook uses the country in memory to answer the sign-up and keeps only an unlinked daily count by country code. Counsel is asked to confirm in Q57 (e). If the hook ever stores the country with an account, this flips to Coarse Location, linked.
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
