# Decisions before "start": executive alignment record (Karma, 20 Nov 2026)

Status: the eleven executive seats (CPO, CDesO, CDO, CISO, CPrivO, CCO, CLO, CMO, CFO, CBO, CAIO) were each given the open-decision list and answered in writing. Their files are in `data-security/council/`. They are Claude roles, not licensed professionals; legal and tax points are "counsel must confirm". Nothing outside the repo was read for money or law unless a file says so ([U] = unverified). Facts marked [V] were reproduced by a reviewer against code.

Update: product finished the requirements pack at `4d33978f` (errata E1 to E73, closures CL-001 to CL-147) and answered all 37 engineering questions in `docs/product/prd/ENGINEERING-QUESTIONS-CLOSED-20nov.md`. CF-1 (E71) and CF-8 (E70) are closed; Q57 stays counsel-only with its default (E72). Plan #847 is merged; pin the plan and briefs to `4d33978f` once.

Status words: RULED = Karma decided (engineering, reversible, T1 or T2 with the way back named); AGREED = the seats concur with the default; PRODUCT = product answers; COUNSEL = counsel must confirm; FOUNDER = founder only. Nothing here sets a date.

Gates: G13 = before the Build 13 cut; GF = before the first family outside the founder's signs in; G10 = before 1.0. Whether Build 13 has servers off (D-121 as of 31 Oct, [U] now) while plan 3a puts the database deploy before it is open (question 1, section 8).

## 1. Money, accounts, hosting
- A1 Supabase Pro: FOUNDER (money). The founder said "later" on 20 Nov: the decision is deferred, and it stays a gate before the first outside family (nothing is bought or assumed). CFO, CISO and CPrivO agree: buy month-to-month before the first outside family or before backup goes on, not for a servers-off store build. $25 a month is the repo's 3 Oct number [U]; Supabase pages were not readable. Gate GF. `data-policy.md:212` says Pro daily backups and is false while production is on Free [V].
- A2 Apply the 29 unapplied migrations (D-041): FOUNDER act. RULED conditions: name the target project first; staging first; dump before applying; record the apply in the same PR; consent order of CR-69 A6. Gap: `APPLY.md`, `DEPLOY.md` and the list name three different projects (`early-letters` with files 1 and 2 applied, `scribe-staging`, `scribe-prod`); founder says which is production (question 2).
- A3 Consent gate: RULED. Add a minimum count of consent acts and a minimum-build or update-line condition to the 14-day zero-null rule (a one-family zero proves nothing). The setting stays the founder's.
- A4 Crash SDK or PostHog: AGREED, not in 1.0.x. Later: dated cost read and a spend cap first.
- A5 Workflow security: RULED. SHA-pin the 17 mutable steps first, then scanning; do not revive PR #30 whole. Proposals only; the founder pastes. The two-job deploy keeps required approval on both jobs (SEC-R04); job 1 runs only from a `db-v*` tag on `main`. A one-click version would be a founder exception or an RFC amendment and is not chosen here.
- A6 Apple Small Business Program: DONE, verified. Apple's welcome email dated 13 Nov 2026 (to the Early Letters mailbox) says the commission on paid apps and in-app purchases is 15 percent, and that the program ends for the rest of a calendar year once proceeds pass 1 million USD; an app transfer pools that year's proceeds across the accounts involved. The Paid Applications Agreement itself was not read. The accountant (CR-120) is still FOUNDER and open. Earlier text: Decides 15% or 30% in year one (about $7.50 per annual subscriber [U]). Do before the store build.
- A7 Publisher type (Apple 5.1.1(ix), D-004 hedge date 27 Nov): FOUNDER and COUNSEL, new.

## 2. Privacy and what leaves the phone
- B1 Remote push: AGREED. "Not in 1.0", not "never"; never for security alerts. [V] entitlement stripped, no token table, no sender.
- B2 Cloud AI for a child's voice, picture or letter text: AGREED, forbidden until X2 (security read and counsel read, `00-product-frame.md` line 91 on develop); letter text also needs a founder decision. CAIO adds: consent design, a named processor with no-training terms in writing, a test that no unlisted outbound host is reachable.
- B3 Variant B (`mediaSync`): AGREED, not chosen. "Not built" is not yet true while the `entry_photos_author_insert/update` policies are live [V]; closed by C4.
- B4 Device backup of `scribe.db`, recordings and pictures: COUNSEL and FOUNDER. Recommend accept for 1.0. Open: are the safety tiers inside `scribe.db`; counsel reads "stays on this phone" (Q17) and the label.
- B5 Backup file `backup-<profile id>.db` (upload URL, token, wrapped key): RULED. Apply the backup exclusion on existing installs, delete on Erase, move the token to Keychain, add tests, and add a preflight gate so `EXPO_PUBLIC_BACKUP` cannot go on until B5, escrow keys and the stop page exist [V: none of these today]. Recovery export does not copy it [V].
- B6 Region hook: AGREED, fail open until counsel answers (Q57, E47, E72); count and alert on lookup failures. Product adds sub-question (g) for the counsel packet; the founder merges it. CF-8 is closed (E70): same wait screen for every address, the phone holds a refusal in memory and shows the refused screen at the code step.
- B7 Retention, holds, processors: COUNSEL (14 questions, exact wording in `council/privacy-cco-clo.md`). Recommend building the key-unwrap log at 12 months to match D-021 before apply. Periods stay "as built, not approved"; nothing is published until counsel and founder answer. Unconfirmed sign-up rows have no purge job [V].
- B8 Audit rows in the export: AGREED, no screen. RULED conditions: key allowlist on `audit_events.detail`; export only the requester's own rows (removal rows name other people).

## 3. Security design
- C1 Step-up before `request_account_deletion` and book deletion: RULED, enforced on the server, cancel exempt; product confirms [V: none today].
- C2 One secret key shared by four functions: RULED. One database role per function (the `escrow_svc` pattern), `invite-redeem` first, `purge-worker` keeps the secret key alone. Gate GF. Two reviews on each PR (T2).
- C3 Audit writers and security events: RULED, split. One migration writes `export_created`, `legal_hold_*`, `support_access`. `security_events` is its own service-only 12-month store with a named reader. Detection owner: recommend `ops` reads it on a schedule the founder sets; founder confirms (gap). Gate GF.
- C4 Close the photo upload policies (design S1): RULED. Ship S1 before the first outside family and together with photo slices #835 to #840. Applying it is the founder's step.
- C5 Permanent purged-id guard after day 60 (`SCPRG`) [V: absent]: RULED direction. Store a keyed hash of the id, never a raw list; counsel and CPrivO read the retention wording before apply.
- C6 Recovery custody: FOUNDER. Question: who can act on your accounts if you cannot for 14 days, and where is the recovery material held.
- C7 Backup stays off [V: off in all four profiles, empty escrow key lists, no `/stop` route]. See B5 gate.
- C8 SQLCipher: FOUNDER confirm. Recommend not before 1.0; file-protection read-back on a real device.
- C9 Drop the `insights_reader` grant to `authenticator`: RULED.
- C10 The line "We will sign that device out" (`auth.en.ts:199`) has no lever behind it [V]: RULED, build the lever or remove the line (words PROPOSED).

## 4. Customer communication and lifecycle
- D1 New-device sign-in email: PRODUCT and FOUNDER. PRD V2 F02-REQ-017 is P0 before servers go on; the pack said after the first outside family. Recommendation: build it before the first outside family, no action link, the email carries the in-app path (Me, Account, Sign out other devices) and tells the parent to secure their email account (sign-in is by emailed code and link). Precondition: CPrivO label read of the device-hash table. A5, A7, A8 ship as specified; A3 (recovery) and A6 follow once the BL-598 runbook exists. Cards win over PRD V2 (CR-66); product confirms.
- D2 Alert limits: AGREED that alerts are exempt from quiet hours. No A2 email in 1.0. Recommend PRD V2's rule (first 5 per hour individually, later folded into one summary within minutes) plus a backstop of 20 alert mails per account per day [E, reviewer's number]. Product confirms.
- D3 Wrong codes: AGREED, no email; phone pause only (5 in 15 minutes, memory only). A server lockout may never block the local book.
- D4 Lock screen: AGREED. Neutral title by default; names only if the parent turned them on and App lock is off; add the notification category and hidden-preview placeholder (NS-32-R13). Scope widened by CPO and CDesO: no month number or "A year of letters." with names off (the age leaks). Use placeholder row 18 option A of #870 [PROPOSED]. Device check NTC-T24 before done.
- D5 Marketing email: AGREED, none to app sign-ups; transactional only. COUNSEL: is a welcome email transactional (CAN-SPAM [U]).
- D6 Notification budget: AGREED, 60 in total. The NS-32-R12 test passes before the cut; the two-notes-in-one-day defect (NS-32-R1b) goes in wave 2 unless the founder decides otherwise.

## 5. Product scope and words
- E1 Release cut and drops: AGREED plan 3a as a recommendation; founder confirms. Photo and Find ship dark in Build 13; NS-51 in 1.1 (E32). No dates.
- E2 Words a parent reads: FOUNDER, one sitting, Build 13 words first. CDesO changes: held-screen row 7 drop "yet"; share verb "Send this letter"; `find.fieldHint` "Type a word, or part of one, to start looking." Counsel reads rows 7, 10, 15 to 17, 62 and the let-it-go confirmation. NS-42-R18 has no draft text (E51); alert keys do not exist yet.
- E3 Open requirement questions: CLOSED by product (E43 to E59, E69 to E73). Still FOUNDER: NS-44-O13, allowance per phone (E59 default) against D-082 (per account); it is a promise to a user.
- E4 FP-9 owner: RULED `mobile` builds, `sync` reviews.
- E5 Public claims (COUNSEL, founder merges): six gaps listed in `council/cmo-cfo-cbo-caio.md` (analytics wording, backups, deletion time, no deletion page, an AI mention, "exactly as you said it"). Owner `legal` and `privacy`; nothing about server backups goes public until A1 closes. A claims registry (D-123 deferred) is a founder call.

## 6. Engineering gates
- F1 Size exceptions: AGREED. Accept #847 (859 and 96 lines), #835 to #840 and H1 as one concern each; refuse #798 whole. Photo slices merge only with S1 and a plain statement of what leaves the phone.
- F2 Dependencies: AGREED. Approve jest-expo and React Native Testing Library; defer `expo-video`, `expo-symbols`, `expo-battery`, `expo-image`. SF Symbols licence unread [U].
- F3 Workflow pastes: AGREED order: ratchet fetch step, then `RATCHET_BASE_REQUIRED=1`; merge-queue skipped rule and `eas.json` in the `changes` match; label guard; two-job deploy (A5 condition).

## 7. What changed in the pack because of the council
Amendments to the merged pack (docs only, one PR per file group) are listed in `data-security/00-README.md` section 5.

## 8. Questions only you can answer, and the founder's answer
Founder answer, 20 Nov 2026, in chat after the list was shown: "I approve all you asked me." Recorded here as approval of each recommendation and default below. It approves nothing the list does not name, does not approve any PROPOSED word, and does not replace counsel. Acts that only the founder can do (buying, applying, pasting, enrolling) are approved, not yet done. A D-entry for `docs/DECISIONS.md` is the founder's to paste; text is in section 10.

Recorded answers: 1 servers off for Build 13. 2 `scribe-staging` first; agents prepare the apply plan and never apply. 3 Pro plan: later (founder act, open, gate before the first outside family). 4 no custodian named yet (default stands; the question stays open for him). 5 no SQLCipher before 1.0. 6 allowance per phone. 7 new-device sign-in email before the first outside family. 8 Apple Small Business Program: enrolled (verified, 13 Nov email); find an accountant (founder act, open); publisher type goes to counsel. 9 size exceptions F1, test dependencies F2 (jest-expo and React Native Testing Library only) and the workflow pastes F3 in the stated order (the founder pastes; agents only prepare proposals under `docs/ops/proposed/`). 10 the PROPOSED-words sitting and the counsel packet are scheduled and still open: no word is approved yet.

Original questions follow.
1. Is Build 13 a servers-off store build (D-121), or does it need the database deployed? Default: servers off; gates C, D1 and B5 apply to the first outside family.
2. Which hosted project is production, and may agents prepare (not apply) the staging apply plan? Default: `scribe-staging` first.
3. Buy the Supabase Pro plan before the first outside family (A1)? Founder: later; stays a gate before the first outside family.
4. Recovery custody (C6). Default: none named.
5. SQLCipher (C8). Default: no, before 1.0.
6. NS-44-O13 (E59): allowance per phone (card, default) or per account (D-082)?
7. New-device sign-in email before the first outside family (D1)? Default: yes.
8. Apple Small Business Program and an accountant (A6); publisher type (A7).
9. Approve size exceptions, the test dependencies and the workflow pastes (F1 to F3).
10. One sitting on the PROPOSED words (E2), and send the counsel packet (B7, E5).

## 9. Not verified
Hosted settings and plan limits, device behaviour, Apple's hidden-preview behaviour, WCAG 1.4.11, CAN-SPAM, current D-121. Supabase and FTC sites were not readable from the session.

## 10. Proposed D-entry (the founder pastes; Karma does not edit `docs/DECISIONS.md`)
D-xxx (20 Nov 2026): the founder approved the executive-aligned recommendations in `docs/engineering/readiness-20nov/DECISIONS-20nov.md` section 8 at their defaults: Build 13 servers off; staging first; Supabase Pro before the first outside family; no SQLCipher before 1.0; free-letters allowance per phone; new-device sign-in email before the first outside family; Apple Small Business Program and an accountant; size exceptions F1; jest-expo and React Native Testing Library approved, other new dependencies deferred; workflow pastes in order. Not approved: any PROPOSED word, any retention period, anything counsel must confirm.
