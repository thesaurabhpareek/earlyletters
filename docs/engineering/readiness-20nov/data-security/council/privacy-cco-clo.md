# Council return: Chief Privacy Officer, Chief Compliance Officer, Chief Legal Officer
Date: 20 Nov 2026. Re: "Open decisions before start" (Karma, 20 Nov 2026). No posting done. Nothing here is legal advice; every legal or tax reading is "counsel must confirm".

## 0. What I read, and what I could not
Read in full from origin/develop (git fetch origin develop, 20 Nov): docs/agents/exec/COUNCIL.md; .claude/skills/early-letters-privacy/SKILL.md, early-letters-cco/SKILL.md, early-letters-clo/SKILL.md. Read the DECISIONS-LIST. Read pack docs 05 and 06 (PR #999, #1000) and 07.1 to 07.4 (PR #1001) from their branches. Read docs/legal/DATA_CLASSIFICATION.md (DC, saved copy; sections 1 to 4.9 skimmed by grep, not every row re-read) and docs/legal/compliance-register.md 1.6.0 (31 Oct; read sections 0, 1 and the rows cited below; the rest grepped). Also read docs/agents/exec/RULINGS.md CLO-3, CPrivO-2, CCO-5 and DECISIONS D-020, D-021, D-131, D-136.

Outside-world sources read this session (20 Nov 2026):
- Apple App Review Guidelines, https://developer.apple.com/app-store/review/guidelines/ : read 4.5.4, 5.1.1(ii), 5.1.1(v), 5.1.1(ix), 5.1.2(i) as quoted below. The page's "last updated" line was in the part of the page I did not read (the fetch covered 100,000 of 114,384 characters). The skill records 16 Oct 2026 as last updated; I did not re-confirm it.
- Apple App Privacy details, https://developer.apple.com/app-store/app-privacy-details/ : "collect" definition; on-device-only data is not collected; page "does not address" iCloud or user-initiated backup or processors; Sensitive Info lists "pregnancy or childbirth information", "religious or philosophical beliefs", "biometric data"; "You're responsible for keeping your responses accurate and up to date."
- Apple, https://developer.apple.com/support/offering-account-deletion-in-your-app/ : tell people how long deletion takes and "provide a confirmation when the deletion is complete"; "If you're legally required to retain some user information, let people know what information will and won't be retained"; deactivation alone is insufficient; do not require phone, email or chat support flows outside regulated fields; revoke Sign in with Apple tokens.
- npm registry, 20 Nov: jest-expo, @testing-library/react-native, expo-symbols, expo-battery, expo-image, expo-video each report license MIT (package licence only).
- NOT readable this session: www.ftc.gov (the session network does not allow it). So every CAN-SPAM statement below is [U]. Also not read: Supabase plan and backup pages, GitHub terms, OFAC pages, SF Symbols licence. Anything I say about them is [U].
Facts about the repo are the pack authors' [V] unless I say otherwise; I did not re-run code or tests.

## 1. One line per item (verdicts)
B1 push: AGREE (soften "never" to "not in 1.0, and not in any public text")
B2 cloud AI: AGREE (forbidden until X2; add founder decision for letter text; Apple 5.1.2(i) read)
B3 variant B media sync: AGREE, with NEEDS EVIDENCE on photo paths already live (see gap G2)
B4 iPhone device backup: AGREE default for 1.0, NEEDS COUNSEL on the claim wording (Q17) and the label reading
B5 backup-file exclusion: AGREE, CHANGE to add a test and existing-install handling
B6 region hook: AGREE fail-open with conditions; NEEDS COUNSEL (Q57e)
B7a Q51 key-unwrap log 12 vs 24: recommend 12 to match D-021; build keeps 24 as built until counsel answers; NEEDS COUNSEL and NEEDS FOUNDER
B7b released legal holds: AGREE as built, with conditions
B7c GitHub as processor (PQ-3): AGREE (name it); NEEDS COUNSEL; NEEDS EVIDENCE on how "7 days" is enforced
B7d audit rows in an access request (PQ-5): AGREE (in account.json), NEEDS COUNSEL
B7e guideline 4.5.4 and local reminders: AGREE (local only, no promotion); NEEDS COUNSEL
B7f notices after deletion: AGREE (Apple page supports a completion confirmation); NEEDS COUNSEL on CAN-SPAM [U]
B7g other retention periods "as built, not approved": AGREE the marking; NEEDS FOUNDER before any is published
B8 parent sees own audit rows: AGREE (no screen; rows in export)
D1 alert emails: AGREE with CHANGE (A6 confirmation may ship at v1; A1 waits for a label read)
D2 quiet hours and cap: AGREE
D3 email after wrong codes: AGREE (no email); CISO owns server lockout
D4 neutral lock screen and birthday title: AGREE (and make neutral the default even when names are on, unless App lock is off and the parent chose names)
D5 marketing email to app sign-ups: AGREE (no)
A1 Supabase Pro: CHANGE (Pro before the first build that reaches anyone outside the family); NEEDS FOUNDER (money, CFO)
A2 apply 29 migrations, deploy worker: AGREE the default, with conditions (nothing published about deletion or retention until live; verify safety_events)
A3 consent_fields_required gate: AGREE, CHANGE to add a sample-size floor
A4 crash SDK or PostHog: AGREE (not in 1.0.x)
E2 words: NEEDS FOUNDER (one sitting), with legal holds listed in section 5
F1 size exceptions: no legal view on size; CHANGE for the photo slices (privacy read first)
F2 dev dependencies: AGREE (approve the test pair, defer the rest); licence note
F3 workflow pastes: no legal or privacy touch; no view

## 2. Section B (privacy, children's data, what leaves the phone)

### B1. Remote push
- Verdict: AGREE. Default stands: no push in 1.0.
- Why: the pack reads the entitlement as stripped (app.config.ts:103-106, 07.1 R2) [V by author]. Apple 4.5.4 (read today): push "should not be used to send sensitive personal or confidential information" and not for promotions without explicit in-app opt-in and an opt-out. A token table is also new collection.
- CHANGE (small): the list says "never for security alerts". Record it as "not in 1.0". An absolute in a decisions file tends to get copied into public text. Security alerts by push can be argued later by the CISO.
- Conditions: if push is ever decided, the eight steps in 07.3 section 4 hold, the label gets a row first, payloads are kind plus fixed words (LR-10). The stale email-catalogue "one push" line (C1 in 07.1) is fixed so no copy promises it.
- Proposed record (the seat's suggested closure line; nothing is closed until the founder, counsel or product decides): "B1 proposed record, [date] when decided: no remote push in 1.0; revisit only by a new founder decision with the 07.3 section 4 list; CPrivO and CCO agree."

### B2. Cloud AI for a child's voice, picture or letter text
- Verdict: AGREE. Forbidden until X2 (security read plus counsel read); nothing leaves the phone.
- Why: Apple 5.1.2(i) (read today): "You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so." The constitution already bars any feature that writes or shapes words. Doc 06 C10 is right that letter text should also wait for a founder decision, not only audio and pictures; X2 as written does not cover text, so I adopt the pack's recommendation.
- Condition: a code scan for AI endpoints is [U] in doc 06 section 3. Ask Karma for it before a store build (one test: no network call to a model host from a v1 build).
- Pre-staged for counsel only if the founder ever opens the door: whether sending text to a zero-retention processor is "sharing" under the state consumer-health laws in the register (CR-020 to CR-032 rest on secondary sources not re-read: [U]).
- Proposed record line: "B2 proposed record, [date] when decided: no letter text, voice or picture goes to any model provider in 1.0.x; any change needs X2 (security and counsel reads) and a founder decision; CPrivO, CCO and CLO agree."

### B3. Variant B (mediaSync, pictures leave the phone)
- Verdict: AGREE not chosen, not built. NEEDS EVIDENCE first (gap G2).
- Why: doc 06 lists a bucket entry-photos in the retention and deletion tables and doc 05 lists "photo upload policies live" (C4 in the list, finding "entry_photos_author_insert/update" [V]). If those policies are live and any build uploads a picture, then pictures already leave the phone and "variant B not built" is not true as a statement about the system. E23 and C10 say a picture sent to another person needs the same two reads as a child's voice.
- Check and owner: the CTO/mobile owner states, from code, whether any 1.0.x path uploads a photo to entry-photos. If yes, B3 becomes a FOUNDER question with the label, policy and C4 closed first.
- Proposed record line (if the check says no path uploads): "B3 proposed record, [date] when decided: no picture leaves the phone in 1.0.x; the entry-photos policies are narrowed by the S1 migration; label and policy match." If it says yes: reopen as FOUNDER.

### B4. iPhone device backup of scribe.db, recordings and pictures
- Verdict: AGREE the default for 1.0 (no change), with NEEDS COUNSEL on wording.
- Reasoning: for a keepsake, losing a baby's voice is the larger harm, and a person's own iPhone backup is their own storage. Apple's privacy-details page (read today) defines "collect" as transmitting data off the device for us or our partners to access; it "does not address" iCloud or user-initiated backup. So I cannot say from Apple's page that it is outside "collect" or that it is inside. I mark the label reading [U] and put it to counsel.
- The real exposure is the sentence, not the backup. Any "recordings stay on this phone" line (COUNSEL_PACKET Q17; register s.3 rows 1, 15, 16, 20) is untrue if the phone's own backup holds a copy. The deletion side too: Erase on the phone does not delete a copy in the person's iCloud backup.
- Conditions: (1) no sentence says "only on this phone" until Q17 is answered; the safe form is "on this phone and in your own iPhone backup if you have one on" (words are the founder's, E2); (2) the Erase and delete-account screens say that a copy in the person's own phone backup is theirs to delete (Apple's deletion page: say what is retained); (3) B5 closes the one part that is ours.
- Proposed record line: "B4 proposed record, [date] when decided: device backup of the app's data is left as iOS does it; no 'only on this phone' wording until counsel answers Q17; CPrivO and CCO agree; counsel must confirm."

### B5. The backup file backup-<profile id>.db (upload URL, token, wrapped key)
- Verdict: AGREE, CHANGE to tighten.
- Why: a token and a wrapped key sitting in a device backup travels to a place we do not control (G of the C7 point: the escrow key lists are also empty today).
- Conditions: exclude the file from device backup AND apply the exclusion on existing installs at next launch (a flag set only at creation misses files already made); delete it on Erase and on sign-out; one test for the flag and one for deletion; the backup feature flag cannot turn on in a build where either test is missing (CCO gate item).
- Proposed record line: "B5 proposed record, [date] when decided: exclusion and deletion built and tested before the backup flag; CPrivO and CCO agree."

### B6. Region hook fails open or closed (Q57)
- Verdict: AGREE fail-open for now; NEEDS COUNSEL (Q57 e).
- Why: D-131 and D-136 set the blocked countries and the Privacy Policy line; CCO-5 and D-137 already accept no name screening and record that OFAC liability is strict (as recorded there; I did not re-read OFAC today, [U] on my side). The hook is one control among several: US-only storefront (D-083), the Terms 2.4 confirmation, the escalation check. A closed hook would turn every lookup failure into a refused US parent, with no privacy benefit.
- Conditions: lookup failures are counted by result in the existing daily counts (no IP, no country stored with the account; CPrivO-2 flips to Coarse Location if that changes); a failure rate above a set level alerts the founder; the wording at D-136 stays "takes effect when the check ships".
- Counsel question: CQ6.
- Proposed record line: "B6 proposed record, [date] when decided: open on lookup failure, failures counted and alerted; counsel answers Q57 (e); CCO and CLO agree; counsel must confirm."

### B7. Retention periods and related items
Overall: AGREE that the defaults are "as built, marked 'as built, not approved'". Retention promises are the founder's (my skill s.5; Karma s.3). Until he approves, no period appears in the Privacy Policy, the store listing or the app. Nothing here is live: doc 05 reads the live database as migration files 1 and 2 only (APPLY.md:48), so no retention job runs in production today. That makes it cheap to change a period now and costly after (lengthening is one-way).

B7a. Q51: 12 vs 24 months for the key-unwrap log (D-021 says 12 for ops, security and escrow logs; the build keeps escrow_unwraps 24).
- Verdict: CHANGE and NEEDS COUNSEL and NEEDS FOUNDER. This seat recommends the shorter clock (12, matching D-021); the build keeps 24 as built until counsel and the founder answer, and the retention period is the founder's call. The log records who opened a family's recovery key; its use is dispute and access evidence. Counsel says if a longer clock is needed; the founder then amends D-021 on the record. Do not let the build contradict a decision silently.
- Proposed record line: "B7a proposed: escrow_unwraps 12 months as D-021 is recommended; 24 stays as built until counsel answers Q51 and the founder decides; any lengthening is a founder decision."

B7b. Released legal holds.
- Verdict: AGREE as built with conditions. A held scope is skipped by purge and account deletion until released (purge_due, DATA-REQ-035 [V]). On release, normal clocks apply at the next purge_due run.
- Conditions: release writes an audit row (legal_hold_released is defined and never written; finding 1 in doc 05); the legal_holds row carries matter_ref and review_by; data-policy.md section 7 and line 223 stop saying staff read held data "with a logged support_access event" until a writer exists (C05-3 / C06-2). Preservation script (LEGAL-REQ-057) is not built: the first request would be improvised; say so to counsel (CQ9).
- Proposed record line: "B7b proposed record, [date] when decided: holds follow the as-built rule; hold and release rows are written before any hold is relied on; counsel must confirm the duties on release."

B7c. GitHub as processor (PQ-3).
- Verdict: AGREE name GitHub in subprocessors.md and the providers page anyway (C06-4); NEEDS COUNSEL whether it is a processor for an age-encrypted dump it cannot open. I did not read GitHub's terms: [U].
- NEEDS EVIDENCE: the "7 days" is the premise of the 38-day promise (31 + 7). A private git repo keeps old commits. How is the dump removed at day 7 (release assets or artifacts deleted, or history rewritten)? Owner: ops. If it cannot be shown, the 38-day sentence stays unpublished.
- Proposed record line: "B7c proposed record, [date] when decided: GitHub is named as a provider of the encrypted dump; the 7-day removal is shown by a dated drill; counsel must confirm its legal role."

B7d. Audit rows in an access request (PQ-5).
- Verdict: AGREE default (rows about the requester, in account.json); NEEDS COUNSEL.
- Conditions: only rows where the requester is actor or subject, never another member's rows or any staff row naming a staff handle; the export needs a new definer function (audit_events has no reader today: finding 3); detail fields are enums and counts only (so no other person's data leaks into the export).
- Proposed record line: "B7d proposed record, [date] when decided: an access answer includes the requester's own audit and deletion rows via Save a copy; counsel must confirm."

B7e. Guideline 4.5.4 and local reminders.
- Verdict: AGREE default (local reminders only, no promotion), NEEDS COUNSEL.
- Source: 4.5.4, read today, is written about Push Notifications. Whether it governs a local notification is a judgment I do not make. Our design is safe either way: no sensitive content (neutral titles, D4), no promotion, not required to use the app (5.1.2(i) also says an app may not require users to enable push to use it). Counsel confirm (CQ7).
- Proposed record line: "B7e proposed record, [date] when decided: reminders stay local and unpromotional; wording keeps to 4.5.4 either way; counsel must confirm applicability."

B7f. Notices after deletion.
- Verdict: AGREE (a completion email is sent before the auth user is removed and is the last mail to that address).
- Source: Apple's deletion page says to "provide a confirmation when the deletion is complete" and to tell people what is retained. That supports the receipt. CAN-SPAM treatment of transactional mail: [U] (ftc.gov unreachable); counsel confirm (CQ7).
- Privacy cost, stated plainly: Resend holds the address and the email text for 30 days, so that one copy lasts to about day 60. The pack names it as the one exception. Keep it named in the policy and the receipt itself.
- Proposed record line: "B7f proposed record, [date] when decided: one completion receipt, no later mail; the Resend copy is named as the one exception; counsel must confirm."

B7g. Everything else as built (unconfirmed sign-up row 7 days proposed, support mail 2 years proposed, analytics 12 months proposed, crash 90 days proposed, inactive accounts none, tester answers 90 days, deletion receipts 3 years, policy_acceptances life plus 3 years, purge ledger 60 days).
- Verdict: AGREE the marking. NEEDS FOUNDER before any period is published. NEEDS COUNSEL on inactive accounts (OQ-11): the default "no automatic deletion in v1" is a retention choice that keeps children's data indefinitely; privacy view: acceptable because a keepsake is opened years later, if the policy says it plainly and export and delete are always available.
- Gap: unconfirmed sign-up rows have no purge job (FR-PRV-05 not built): an address kept without a purpose. Build before the first outside family.
- Proposed record line: "B7g proposed record, [date] when decided: periods remain 'as built, not approved'; none published until the founder approves; counsel confirms Q26 periods."

### B8. Does a parent ever see their own audit rows on a screen
- Verdict: AGREE: no screen in 1.0; rows go into the export (see B7d). A screen would add a new reader of audit_events and new words. Revisit if counsel says an access request must be answered live.
- Proposed record line: "B8 proposed record, [date] when decided: no audit screen; own rows in Save a copy."

## 3. Section D (customer communication)

### D1. Alert emails at v1
- Verdict: AGREE the sequencing, with CHANGE: A6 (confirmation after "Sign out other devices") may ship at v1 if engineering finds it cheap, because it needs no new data (account id and time, already held). A1 (new device) waits.
- Why A1 waits: it needs a new table of salted device-id hashes (07.2 A1). That is new collection (my skill s.5: any new collection is the founder's). Whether an app-made device hash counts as Apple's "Device ID" data type is [U]: Apple's page (read today) lists types but I did not read its Device ID definition in full. CPrivO read needed before it is built (CQ8). Defaults: hash per account, deleted with the account, never in a log, never in an email, service role only.
- Compliance: I found no row in the register that requires any of A1, A3, A6. LEGAL-REQ-037 (repo requirement) asks to log new-device sign-in; that is a repo rule, not a law I read. The trade-off (an outside family has no new-device warning for a while) is the CISO's and CPO's call.
- CAN-SPAM [U]: classing alert mail as transactional is counsel's (CQ7).
- Conditions: every alert states fixed words, no IP, place, device name, token or sign-in link (07.2 section 3); alerts go only to the inbox owner.
- Proposed record line: "D1 proposed record, [date] when decided: v1 sends only what Supabase Auth and the built senders send, plus A6 if cheap; A1 after a CPrivO label read and a device-hash design; CPrivO and CCO agree."

### D2. Quiet hours and alert cap
- Verdict: AGREE. Alerts exempt from quiet hours; A1, A3 to A9 never capped; A2 capped at 5 per 24 h. The 5 is our number [E], an engineering parameter, not a promise. No law I read sets it.
- Proposed record line: "D2 proposed record, [date] when decided: exempt; security alerts never capped; the cap of 5 for A2 is an engineering estimate."

### D3. Email after repeated wrong codes; server lockout
- Verdict: AGREE no email; phone pause only. Privacy note: a server-side count per address needs the address hash in an ops counter (L3) and must not appear in logs. Server lockout is the CISO's; I flag that the phone pause lives in memory (lost on restart) and the vendor per-IP limit was "read 3 Oct" [U].
- Proposed record line: "D3 proposed record, [date] when decided: no email on repeated wrong codes; server lockout is the CISO's decision."

### D4. Neutral lock-screen body and birthday title
- Verdict: AGREE and strengthen. Child name and birthday are L4. Apple's privacy page lists "religious or philosophical beliefs" and "pregnancy or childbirth information" as Sensitive Info (read today), and library days (L5) can reveal faith. 4.5.4 says push should not carry sensitive information (applicability to local is CQ7).
- Rule: the neutral title is the default for the birthday, month and library-day notifications; a name appears only if the parent turned names on AND App lock is off (LR-01). Add the category and hidden-preview placeholder (NS-32-R13).
- Evidence needed: [U] whether iOS keeps a local notification's title when previews are hidden. A founder device check (NTC-T24) is the proof; the CCO gate holds the claim "nothing shows on your lock screen" until it runs.
- Proposed record line: "D4 proposed record, [date] when decided: neutral birthday title by default; names only on a parent's own switch with App lock off; category and placeholder built; device check run."

### D5. Marketing email to app sign-ups
- Verdict: AGREE: no; transactional only; waitlist addresses kept apart and deletable. A marketing send would be a new use of the address (founder-only for me), needs its own opt-in, the CAN-SPAM rules [U], a policy change and the house rule against win-back mail.
- Proposed record line: "D5 proposed record, [date] when decided: no marketing email to app accounts; waitlist separate; reopen only by a founder decision with counsel."

(D6, budget of 60: no privacy or legal touch; no view.)

## 4. Section A: retention and notice impact only

A1. Supabase Pro.
- Verdict: CHANGE, NEEDS FOUNDER (money; CFO). Recommend Pro before the first build that reaches anyone outside the founder's family, not "stay Free".
- Retention and notice impact: on Free, platform logs last 1 day and Supabase keeps no backups (doc 05 [V as read, U on the dashboard]). Consequences: (1) data-policy.md line 211 describes Pro daily backups (C06-1), so on Free the policy text is false and must not be published; (2) after an incident a 1-day log may not let us count affected people (the register wants that within 24 hours: CR-111, LEGAL-REQ-039); (3) the 31, 38 and 45 day deletion promises depend on the 7-day dump and need Pro's windows written in first if Pro or PITR is bought (DSR-R13). The 24-hour deletion-return limit under Free (restore from dump can bring back a deletion made in the last day) is true and must be stated: I agree with the default of stating it in the incident notice and I add it to counsel's list (CQ12) as the wording is theirs.
- Proposed record line: "A1 proposed: plan decided by the founder; the retention and backup sentences in data-policy.md match the plan; the 24-hour limit is stated where counsel says."

A2. Apply the 29 unapplied migrations and deploy the deletion worker.
- Verdict: AGREE the default (founder applies per APPLY.md in file order after the consent-order step).
- Conditions: (1) until applied and the sole-parent drill passes, no parent-facing sentence about deletion, retention or audit is published (the pack already says so); Apple 5.1.1(v) needs working in-app deletion in any store build; (2) before any outside family, check that the live database no longer holds the core migration's safety_events table or, if it does, that it is empty and dropped; CLAUDE.md says safety tiers have no server table (see G1); (3) after applying, run the access matrix and grants tests against the live project and record the date.
- Proposed record line: "A2 proposed: migrations applied in order on [date], worker deployed, drill passed [date], safety_events absent from the live project."

A3. app.consent_fields_required after the measured gate.
- Verdict: AGREE, CHANGE: add a floor. "Zero null app_build sheet acts for 14 days" is trivially true with one family testing. Require it AND at least a stated minimum count of consent acts (our number, to be set by data-architect, [E]) across more than one device. Consent records are the proof for the register's consent rows (CR-019 and the state consumer-health rows).
- Proposed record line: "A3 proposed: gate measured over at least N acts, zero nulls for 14 days, then the setting turned on [date]."

A4. Crash SDK or PostHog.
- Verdict: AGREE: not in 1.0.x. Notice impact: privacy policy and subprocessors.md say "no analytics or crash reporting" and are true; Apple 5.1.1(ii) (read today) needs consent for usage data "even if such data is considered to be anonymous" and an easy way to withdraw. Any later adoption moves the label first and goes through counsel Q7.
- Proposed record line: "A4 proposed: none in 1.0.x; any later SDK needs a vendor decision, policy, label and consent first."

## 5. E2 words a parent reads
- Verdict: NEEDS FOUNDER (one sitting). I did not read the proposed strings themselves; I read only the keys named in readiness README line 69 and card text for NS-42-R18. My legal conditions for that sitting:
  1. NS-42-R18 notice at collection (two plain sentences): they say what we collect and why and nothing the system does not do; no "only", "never" or "everything" unless a test or code proves it; the first-run build keeps shipping the links with no notice text until the founder approves (E51 already says so). Counsel reads it with the policy (Q3 and Q20); it is a promise in his own name.
  2. Neutral lock body: AGREE with D4. No child name, no date, no count (LR-06).
  3. Find lines: before approving, confirm what "find" searches and where. Doc 06 lists the search index as L4 content; the sentence may not say it stays on the phone unless it does.
  4. Held screen: words must not hint that letters are lost; deletion and consent words are counsel items.
  5. Share verb: must say what leaves the phone and to whom (to a person the parent picked); a picture sent to another person is an X2 item (E23).
  6. Character-limit line: no privacy touch.
  7. Alert wording: fixed subjects and bodies (07.2 s.3); no fear or guilt language (house rule); never "AI" implied; no link that signs in; masked new address (Q-COM-4 default, I agree).
  Every word is written by a person and linted by rules.test.ts; I propose no wording.
- Proposed record line: "E2 proposed [date]: founder approved keys [list] in one sitting; keys that are promises read by counsel first."

## 6. F items that touch legal or privacy
- F1 size exceptions: no legal view on line counts. CHANGE for the photo slices (#835 to #840): they touch L4 pictures. Merge only with (a) the S1 migration closing the live upload policies (C4), (b) a written statement of what leaves the phone in that slice (ties to B3), (c) the label and policy unchanged because nothing leaves, or changed first.
- F2 dev dependencies: AGREE (approve jest-expo and @testing-library/react-native, defer the rest). npm reports MIT for all six (read 20 Nov); that is the package licence only. For expo-symbols the CLO must read Apple's SF Symbols licence terms before any approval ([U], not read). expo-battery adds a device fact (battery state): approve only with a privacy read of what it reads and where it goes. expo-image and expo-video: no new data exit; defer for scope reasons.
- F3: no privacy or legal touch; no view.

## 7. Gaps the list is missing (decisions nobody has named)
G1. What is live versus what we say. Only migrations 1 and 2 are applied (APPLY.md:48), so retention jobs, audit guards and deletion do not run in production; the live schema may still hold the safety_events table (server-side safety tiers) that CLAUDE.md says must not exist. Needs: a query on the live project and a dated line. Owner: founder with data-architect.
G2. Pictures. entry-photos buckets, purge rows and live upload policies exist while "variant B is not built". Name what, if anything, uploads a picture in 1.0.x (B3).
G3. Deletion integrity beyond day 60. SCPRG (permanent purged-id guard) is absent (finding 9); purge_ledger lasts 60 days and, if it sits in the same project as the data, a restore from the dump cannot replay it; the ledger replay (FR-PRV-09) is a card, not code. The restore-from-dump limit is 24 hours of deletions at best.
G4. Legal text that already conflicts with the build: data-policy.md line 211 (Pro backups on a Free project), line 223 (support_access event never written), Privacy Policy lines 159, 179, 235 (kept authors, D-116), and the register's stale facts. CLO holds those sentences unpublished (a fail-closed hold, my own right) and routes them.
G5. No decision on who answers a legal request. There is no repo text for an appeal path or intake wording (doc 06 Q6) and the preservation script is unbuilt. The founder needs a one-page rule before the first request (litigation counsel same day: my skill s.6).
G6. Support mailbox holds L4 (people paste letters). 2-year retention is proposed only; no deletion routine. Policy must say that people should not paste letters.
G7. Registry of claims (LEGAL-REQ-044, PR #37) is still undecided; E2 depends on it.
G8. The register (CR-017, CR-111) assumes we can count affected people within 24 hours; Free-plan logs cannot support that (A1).
G9. Individual publisher: Apple 5.1.1(ix) (read today) says apps that "require sensitive user information should be submitted by a legal entity". D-004's hedge date is 27 Nov: seven days from today. Not on this list. CLO raises it (CQ1).

Top three gaps for the caller: G1 (live system versus promises, including safety_events), G2 (pictures: variant B versus live photo policies), G3 (deletion integrity: SCPRG, ledger and dump retention).

## 8. Conditions I attach across the list
1. No parent-facing sentence about deletion, retention, backup location or audit goes out until the matching code is live and tested (my skill s.7, s.12).
2. Every retention period stays "as built, not approved" until the founder approves it.
3. No new collection (device hash for A1, token tables for push, any media sync) without a CPrivO read and the founder.
4. The App Privacy label is re-checked against the build before each submission; Apple makes us responsible for keeping it current (read today).
5. Fenced compliance paths keep the CCO co-sign (CR-27).

## 9. Counsel question list (one list; exact question each)
CQ1 Entity and 5.1.1(ix). "Apple guideline 5.1.1(ix) says apps that 'require sensitive user information should be submitted by a legal entity'. We are an individual publisher, our label declares Sensitive Info (the due date) and letters may hold health details. Does the app fall under 5.1.1(ix), and should the founder form an entity before submission or by D-004's 27 Nov date?" (packet Q1)
CQ2 Q51. "For a log of every opening of a family's recovery key, is 12 months or 24 months the right retention period, and does a dispute or access request need the longer one?"
CQ3 PQ-3. "Is GitHub a processor for an age-encrypted nightly dump it cannot decrypt, and what must we say in the subprocessor list and the policy?"
CQ4 PQ-5. "Does an access or portability request reach our audit and deletion rows about the requester, and is answering through the Save a copy export enough?"
CQ5 PQ-1. "When a person withdraws sensitive-data consent, what must happen to letters and child data already on our servers (delete, hold, or keep until they delete)?"
CQ6 Q57(e). "Is a sign-up country check that fails open on lookup error acceptable given the blocked-country list and the Terms confirmation, or must it fail closed?"
CQ7 Notices. "(a) Does Apple guideline 4.5.4 apply to local notifications as well as push? (b) Are our security alerts and the single deletion-completion email 'transactional' for CAN-SPAM, so no unsubscribe is needed? (c) May the completion email go after the account is deleted?" (CCO could not read the FTC page this session: [U].)
CQ8 Label. "Does a salted, per-account, app-made device hash stored for new-device alerts make us declare 'Device ID' (linked) in the App Privacy answers? And does Apple's 'collect' cover a copy of app data in a person's own iPhone backup?" (packet Q7)
CQ9 Legal holds and requests. "What must we do on a hold's release, what may we say about staff reading held data, and what is the minimum process for a subpoena or custody-dispute request for letters before a preservation tool exists?" (packet Q27)
CQ10 Notice at collection. "Do the two sentences at sign-up (NS-42-R18) satisfy notice duties together with the policy and the Consumer Health Data notice under Washington and Connecticut law, and may the consumer health notice be linked from them?" (packet Q2, Q3, Q20)
CQ11 Q17 and the device backup. "May we say recordings 'stay on this phone' when a person's own iPhone backup can hold a copy, and what is the least misleading wording?"
CQ12 Free-plan restore. "Where should we state that up to 24 hours of deletions can return after a restore from the nightly dump (privacy policy, or only the incident notice), and does that affect the 31 and 38 day deletion promises?" (PQ-10)
CQ13 Inactive accounts. "Is keeping an inactive account and its letters indefinitely, with no automatic deletion, acceptable if the policy says so, or must a period be set?" (OQ-11, Q26)
CQ14 Pre-staged only if the founder ever opens cloud AI: "Is sending letter text to a zero-retention processor 'sharing' of consumer health data under the state laws in the register, and what consent does it need besides Apple 5.1.2(i)?"

## 10. Signatures
Chief Privacy Officer (Claude role, not counsel)
Chief Compliance Officer (Claude role, not counsel)
Chief Legal Officer (Claude role, not a lawyer)

Closure line for this return: "Council return privacy-cco-clo filed 20 Nov 2026: 24 items answered; 3 FOUNDER (A1, E2, B7g), 14 counsel questions, 4 NEEDS EVIDENCE (B3, B7c, A2 safety_events, D4 device check); nothing posted."
