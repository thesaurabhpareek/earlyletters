---
title: Counsel packet, Early Letters v1.0 (server features on) and after
version: 1.1.0
status: for counsel
date: 2026-10-15
owner: founder
prepared_by: AI (Claude), legal drafting support, stream S17 (not a lawyer)
supersedes: 1.0.0 (2026-10-03, on-device v1.0)
---

> **Draft for counsel review, not legal advice.** This packet was prepared by an AI drafting assistant. It is not legal advice and creates no attorney-client relationship. It describes the v1.0 product as the founder decided it on 13 Oct 2026 (server features on), lists what changed since packet 1.0.0, and asks counsel's questions in the priority order of the independent privacy review (`docs/prd/v2/reviews/R4-privacy-trust.md`, "Questions for counsel"). Facts are tagged **V** (verified on an opened page or file), **S** (secondary source) or **U** (unverified). Every question has a default that the product follows if counsel does not answer by its date. Where a decision is only proposed (D-093), the packet says so and treats the spec default as unconfirmed.

## 0. How to use this packet

- **The product, in one paragraph (server-on v1.0).** Early Letters is an iOS memory book for adults (18+ only) who speak or type letters to their child. Transcription runs on the phone in seven languages; no audio and no letter goes to a speech or AI service. People may start on the phone without an account. Once they sign in (Apple, Google, or an email link with an 8-digit code) and give a separate sensitive-data consent, letter text, transcripts, edit history, the names dictionary and child profiles (name, birthday or due date) sync to our Supabase project in the US, so the book reaches their other phones and one co-parent (at most two parents per book, enforced by the server). Recordings stay on the phone unless the owner turns on **encrypted recording backup**: recordings are encrypted on the phone before upload, and **we hold a recovery key** (server escrow) so the owner can restore after losing every device; every use through our recovery service is logged and emailed to the owner. Plus is a membership sold only through Apple: the first 2 letters a person keeps are free, then keeping new letters needs Plus ($4.99 a month with a 1-month free trial, or $49.99 a year with a 2-month free trial). The app reports **subscription status only** (plan, trial end, renewal date, cancelled flag, plus consent facts on the first report) so the server can send the California auto-renewal reminder emails. Analytics are opt-in PostHog with no content. US App Store only. Published by the founder as an individual (DR-11 open). Decisions: `docs/DECISIONS.md` D-069, D-073, D-080 to D-083, D-089 to D-092 (D-093 proposed only).
- **The calendar (PRD V2 `08-delivery.md` section 2.1, D-090).** This packet to counsel **Fri 23 Oct 2026** (T05). Counsel comments on the delta **Fri 13 Nov** (T17). Legal pages live as versions marked draft before the first outside family signs in, **Tue 1 Dec** (T20). External beta C1 from **Mon 7 Dec** (T22). Recording backup on for opted-in C1 families from **Mon 18 Jan 2027** (T27). California AB 1043 in force **Fri 1 Jan 2027** (T32). Feature freeze **Mon 12 Apr 2027**. Counsel sign-off, 1.0.0 policies published and privacy label final **by Fri 23 Apr 2027** (T30). **Submission in the week of Mon 3 May 2027** (T36, about 40% confidence). Release planned Mon 17 May 2027.
- **Priorities.** **A** blocks the first outside sign-in or submission. **B** needed before release or a dated event. **C** needed before a later feature ships. Section 2 orders the A and B questions by R4's priority; section 4 onward keeps every question's full text.
- **Time estimate for counsel:** section 1 and the twelve ranked questions about 8 to 10 hours; the rest about 3 hours.
- **What is redlined in this delta.** Section 1.2 lists each document, its old and new version, and where the changelog of each document records every change with its decision or finding.

## 1. What M14 and M16 changed (one page)

### 1.1 The change table

Packet 1.0.0 described an on-device v1.0 ("Recordings never leave the phone in v1.0"; "no server of ours sees purchases"; Plus at $3.99 and $29.99 gating Read together). On 13 Oct 2026 the founder turned server features on (M14, D-089), kept full scope and moved the date (M15, D-090), made backup keys recoverable with honest copy (M16, D-091) and changed how free letters count (M17, D-092).

| # | Area | Packet 1.0.0 said | Server-on v1.0 does | Source | What counsel must look at |
|---|---|---|---|---|---|
| 1 | Sign-in and accounts | Sign-in optional; on 4 Oct the build was cut to on-device only (c1764f9) | Accounts live in v1.0: Sign in with Apple, Google, or email link plus 8-digit code valid 15 minutes. A server-observed email on every new session, with a scanner-safe "Not you?" page that cancels and signs out everywhere. In-app account deletion reaches every system. Legal pages describing a server product must be live before sign-in. Nobody outside the family signs in before the security gate (BL-347, BL-330, BL-331 with BL-332, BL-334, BL-322, BL-349) | M14, D-089; F02-REQ-017, A-REQ-018; R4 PT-19, PT-20; R8 R2A-06, R2A-08 | Q31, Q23 |
| 2 | Letters held on our server and synced to the co-parent | Letter text syncs after sign-in and consent | Same, plus: held letters waiting at the Keep step sync as author-only rows (`held_drafts`); a passive push with generic text and no ids tells the other parent a letter entered the book; text is protected by access rules and encryption at rest and is **not** end-to-end encrypted. Withdrawal of the sensitive-data consent stops sync; letters already synced stay until deleted, and the sheet says so | M14; F16 6.2 I; F11-REQ-014; F17 6.2 B step 3; R4 PT-23 | Q2, Q17 |
| 3 | Encrypted recording backup with a recovery key we hold | Recordings never leave the phone in v1.0 | **Opt-in, owner only, its own consent act.** Each recording is encrypted on the phone (AES-256-GCM; a key per recording, wrapped by a book key per child and author). Each book key is also sealed to our escrow public key and stored on our server. Only one function, running alone in a separate project (`scribe-escrow`), can open a book key: for the owner's restore on a new phone (after a 24-hour or 72-hour hold, with email, push and in-app warnings), for a key rotation, or for a recorded legal order with the founder's sign-off. Every use through that function writes an append-only log row (daily copy kept outside database backups) and emails the owner, unless a legal order forbids telling them. **Honest limit:** a person holding the escrow private key (the function secret, or one of two sealed paper copies the founder keeps) together with a copy of the database and storage could open recordings offline with no log row and no email. Family members cannot hear each other's recordings in v1.0. Whether backup is free or Plus is proposed (D-093 item 2, free), not decided | M7, M16, D-073, D-091; F08 6.5 A to G, 6.5 C "honest limit"; F17-REQ-027; R4 PT-01, PT-02, PT-22; R8 R2A-01, R2A-02 | Q32 (new), Q17, Q4, Q28, Q24 |
| 4 | Subscription status report and reminder emails | No server sees purchases; reminders only on the phone; "we do not email you about Plus" | The app reports status only (plan, trial end, renewal date, cancelled flag; `sub_ref`, a salted hash of the original transaction id; `environment`), and on the first report the consent facts (product, offer type, Subscription Terms version shown or `none_outside_app`, time). Never receipts, transaction ids in clear, card data or prices. The server sends reminder emails on the D-022 windows (acknowledgment, trial week, long trial, final trial, annual 30 and 7 days, monthly anniversary, cancelled and ended) and never enforces Plus. On-device reminders and an acknowledgment sheet with Save a copy also ship. Open: buyers who never sign in, subscribers who delete their account while Apple keeps billing (default: a minimal billing-notice record until the subscription ends), and the consent record's retention | M6, D-080, D-081; F14 6.6; R4 PT-07 to PT-10; R8 R2A-20, R2A-21 | Q8 |
| 5 | Co-parent sharing, at most two parents | Co-parent only; family members later | Live in v1.0: one co-parent per child's book, server-enforced cap; invite links expire in 7 days and are stored hashed; either parent can remove the other; leave, take-out and safety removal reach the other phone within one sync. Letters already on the other parent's phone or in an export cannot be taken back. The leave sheet has no preselected choice | M8, D-069; F11; R4 PT-14, PT-15, PT-16 | Q2, Q27, Q29 |
| 6 | Deletion across sync, backup, escrow and analytics | Deletion of letters and accounts; recordings only on the phone | One deletion matrix (F17 8.4) covers letters, held drafts, backup objects, wrapped keys, device keys, restore requests, the recovery-key log, push tokens, the status record, consent records, PostHog, Resend, Supabase Auth, the support mailbox, database backups and restore-drill scratch projects. Clock unchanged: 31 days live, 38 days backups, 45 days processors. Before any backup object is deleted, the phone offers to bring "only in backup" recordings back. Named exceptions: pseudonymised consent records, pseudonymised audit and recovery-key logs (24 months), the deletion receipt, a suppression hash, the email provider's 30-day copy, and, if counsel agrees, the billing-notice record. PostHog deletion that never confirms is shown as unconfirmed | M14; F17 8.4, F17-REQ-029; F08 6.5 D; R4 PT-28, PT-29, PT-34; R8 R2A-03, R2A-04, R2A-16, R2A-17 | Q13 |
| 7 | Membership and prices | Plus gates Read together after 3 sessions and extra books; $3.99 and $29.99 | Plus is the membership: the first 2 letters a person keeps are free (their own letters, once the words exist and they keep them from Review; the other parent's never count); after that, keeping a new letter needs Plus. Capturing, reading, playing, exporting, deleting and Read together are never gated; extra books are free. A letter held at the Keep step stays on the phone (and, signed in, as an author-only server row) until Plus or deletion. $4.99 a month with a 1-month free trial; $49.99 a year with a 2-month free trial. Apple offer codes only | M1, M2, M3, M5, M17; D-082, D-083, D-092; F14 | Q8, Q14 |
| 8 | Date | Submit 2 to 6 Nov 2026 | Submit in the week of Mon 3 May 2027; counsel comments 13 Nov 2026; legal pages live as drafts 1 Dec 2026 | M15, D-090; 08 section 2.1 | Q31 |

### 1.2 Documents in this delta

Each redline is a new version with a changelog row that cites the decision or PRD finding behind every change. No document was edited silently. All are drafts for counsel; none is published.

| Document | Was | Now | What changed, in one line |
|---|---|---|---|
| `COUNSEL_PACKET.md` | 1.0.0 | **1.1.0** | This packet |
| `privacy-policy.md` | 1.4.0 | **1.5.0** | Server product; opt-in encrypted backup with recovery key and honest limit; status report and billing emails; push; deletion matrix and exceptions; CCPA audio row; staff-access wording |
| `terms-of-service.md` | 1.5.0 | **1.6.0** | 6.2 "we cannot listen" deleted; 12.1, 12.2, 12.4 rewritten for backup; 7.1, 11.4, 17.1 updated; 13 and 14 for the membership, prices and reminder emails |
| `subscription-terms.md` | 1.4.0 | **1.5.0** | Membership model, $4.99 and $49.99, offer codes, reminder emails, consent record |
| `consumer-health-data-notice.md` | 1.2.0 | **1.3.0** | Recordings row describes backup and escrow; backup consent; recipients; deletion |
| `in-app-disclosures.md` | 1.4.0 | **1.5.0** | Microphone purpose string drops its second sentence; trust and sign-in lines; backup sheet lines; Plus lines; reminder emails |
| `subprocessors.md` | 1.3.0 | **1.4.0** | Supabase holds encrypted recordings and wrapped keys; separate escrow project; Resend sends billing and security emails; Apple push |
| `data-policy.md` | 1.2.0 | **1.3.0** | Inventory rows for backup, escrow, held drafts, status and consent records, push tokens; retention and deletion |
| `app-store-privacy-labels.md` | 1.3.0 | **1.4.0** | Audio Data, Purchase History and Email Address answers for the server-on build; microphone string; manifest |

Not in this delta, still to follow from S17 (08 section 3, S17 brief): `ENGINEERING_REQUIREMENTS.md` 1.3.0 (LEGAL-REQ-023, -047, -049, -050; R4 PT-06), `DATA_CLASSIFICATION.md` (`entry-audio` is v1.0; rows for every new table and the Keychain items; F08 section 8), `DELETION_AND_EXPORT_SPEC.md` (backup objects and escrow rows; R4 PT-05 lines). Counsel should read the four redlined policies with the understanding that these engineering documents still describe the on-device build.

## 2. Questions for counsel, in R4's priority order

Rank follows `docs/prd/v2/reviews/R4-privacy-trust.md` ("Questions for counsel, in priority order"). Each rank names the packet question that holds its full text (sections 4 to 6).

| Rank | Packet # | Question | Findings | Answer by | Default if unanswered |
|---|---|---|---|---|---|
| 1 | Q8 | **Auto-renewal with the status report.** Do phone notices alone meet 17602(b) for a buyer who never signs in? Must billing notices continue after account deletion while Apple still bills, and may we keep the email for that? Must the server project annual renewals it has not seen? Is a pseudonymised consent record adequate proof? How are offer codes redeemed outside the app handled? Is the acknowledgment sheet with Save a copy enough under 17602(a)(3)? | R4 PT-08, PT-09, PT-10; F14 Q-C1 to Q-C12 | 13 Nov (T17) | Phone notices for unsigned buyers; minimal billing-notice record kept after deletion until the subscription ends; scheduler projects renewals; consent record pseudonymised at deletion (D-081); `terms_shown: none_outside_app`; no offer code with a free period over 31 days |
| 2 | Q32 (new) | **Recording backup with escrow.** What must the Policy, Terms, CHD notice and label say? Does server-held voice audio make recordings "biometric data" or consumer health data under MHMDA even with no voiceprint? Does backup need its own consent? Is Audio Data "collected" for the label? | R4 PT-01, PT-02, PT-22, PT-24; R8 R2A-01, R2A-02; F08 Q4, Q6 | 13 Nov (T17) | The redlines in this delta; its own `backup` consent act; Audio Data declared Linked, App Functionality |
| 3 | Q17 | **Absolute privacy claims.** Approve or replace "Only you and the people you invite can read your book", "Private by default", the staff-access line and the trust promise, against what the system can prove | R4 PT-03, PT-25, PT-26; F17-REQ-027; F21 6.5 rows 17, 18, 22 | 13 Nov (T17) | The replacements in in-app disclosures 1.5.0 section 3b |
| 4 | Q31 | **Real families under draft policies.** May outside families sync before counsel comments, and on what notice? | R4 PT-31 | 13 Nov (T17), before T19 and T22 | No outside family signs in before counsel's comments; pre-release versions marked draft with re-consent at 1.0.0 |
| 5 | Q4 | **COPPA, revisited for M14.** With backup, a baby's voice in a parent's recording reaches our server. Does the analysis change? | R4 PT-01 | 13 Nov (T17) | COPPA still does not apply; written programme adopted anyway |
| 6 | Q5 | **Age assurance.** What does SB 2420 require for Texas accounts on iOS below 26.2 and for declined sharing? May we store `age_signal`? How must AB 1043 be handled from 1 Jan 2027, including earlier installs? | R4 PT-11, PT-12 | Fri 30 Oct (DR-10, as R4 asks); AB 1043 by 13 Nov | No `age_signal` stored; WP-F01-07 in every external build from 1 Jan 2027 |
| 7 | Q1 | **Publisher identity.** Individual or entity, now that children's data and an escrow key sit on a server | R4 PT-30 | Fri 6 Nov (T15, DR-11) | Individual, with a mailing address, unless the founder chooses an entity at T15 |
| 8 | Q2 | **Consent design.** Connecticut's withdrawal rule; whether sharing with a co-parent needs MHMDA's separate sharing consent (D-050) | R4 PT-23; D-050 | 13 Nov (T17) | Withdrawal stops sync and offers deletion first (`offer` mode); no second consent at invite |
| 9 | Q29 | **Death and fiduciary access.** What a verified fiduciary may receive, what documents we require, the Terms clause, and B-REQ-025 | R4 PT-17, PT-13 | 13 Nov (T17); moved from tier C to tier B | Runbook S-9: one export to a verified fiduciary, no account takeover; Terms clause drafted for counsel (Terms 8.6) |
| 10 | Q27 | **Safety removal and custody.** The evidence standard for removing a parent; how to answer court orders and legal process from day one, now that LEGAL-REQ-057 binds at v1.0 | R4 PT-16; F20 S-5 | Before T19 (23 Nov) | Counsel-led runbook S-8; no safety removal by support unless a backup responder is named |
| 11 | Q13 | **Deletion exceptions.** Disclosure when PostHog deletion is unconfirmed; retention of the status, consent, escrow-log and audit records after deletion | R4 PT-28, PT-29, PT-34 | 13 Nov (T17) | The named exceptions in Privacy Policy 1.5.0 section 10 |
| 12 | Q33 (new) | **Grief case.** May billing notices be suppressed when a family asks us to stop all email? | R4 PT-18 | Before release | Billing notices continue, with an explanation and a link to Manage subscription and Apple's refund request |

## 3. Summary of every question

| # | Tier | Title | Answer by | Default if unanswered |
|---|---|---|---|---|
| Q1 | A | Individual publisher and 5.1.1(ix) (rank 7) | 6 Nov (T15) | Publish as an individual; mailing address; entity only if the founder chooses at T15 |
| Q2 | A | MHMDA and Connecticut consent design (rank 8) | 13 Nov | One sensitive-data consent before first sync, naming the co-parent; no second consent at invite; withdrawal offers deletion first |
| Q3 | A | Consumer Health Data policy content and "homepage" links | 13 Nov | Link from the website footer, the App Store description and Settings |
| Q4 | A | COPPA scope with recording backup (rank 5) | 13 Nov | Does not apply; `child-input` flag off |
| Q5 | A/B | Age assurance (rank 6) | 30 Oct / 13 Nov | 18+ gate plus Declared Age Range in memory; WP-F01-07 from 1 Jan 2027 |
| Q6 | B | Q-004 language code in analytics | Before C1 (7 Dec) | Ship option (a), the closed seven-code list on two events |
| Q7 | A | Q-005 label linkage | 13 Nov | Declare Linked; tracking section empty |
| Q8 | A | Subscription notices and records with the status report (rank 1) | 13 Nov | See section 2, rank 1 |
| Q9 | A | Speech model training-data terms | 13 Nov | Do not host the Hindi fine-tune until cleared |
| Q10 | A | Trademark | 13 Nov (search); before submission (opinion) | Proceed under the name; file intent-to-use if the search is clear |
| Q11 | A | Processor contracts, now including the escrow project | 13 Nov | Accept the vendors' standard DPAs as listed |
| Q12 | B | IP address plus a language-revealing file name at download hosts | 13 Nov | Disclose; mirror models to our host later |
| Q13 | A | Deletion clock and named exceptions (rank 11) | 13 Nov | The exceptions in Privacy Policy 1.5.0 section 10 |
| Q14 | A | "Free" claims under the membership model | 13 Nov | "Every letter you write stays yours to read, play and export, with or without Plus" |
| Q15 | A | Liability cap now that recordings can be on our server | 13 Nov | Greater of 12 months' fees or $50; security breach carved out |
| Q16 | A | Binding promises | 13 Nov | Keep all |
| Q17 | A | Claims registry and absolute privacy claims (rank 3; absorbs Q21) | 13 Nov | Replacements in in-app disclosures 1.5.0 |
| Q18 | A | Arbitration, custom EULA, support phone | 13 Nov | Courts plus small claims; custom EULA; a forwarding phone number |
| Q19 | B | Pre-account local use (browsewrap) | 13 Nov | Sign-in-wrap only, plus the 18+ gate |
| Q20 | B | CCPA, CalOPPA and other state laws | 13 Nov | Comply voluntarily; no "Limit" link |
| Q21 | B | Staff access and transparency (folded into Q17) | 13 Nov | See Q17 |
| Q22 | C | Launch geography and overseas family | Before family members ship | US storefront only |
| Q23 | A | Security findings with legal effect, now including account takeover and escrow | Before T19 (23 Nov) | Fix before the switch-on build reaches anyone outside the family |
| Q24 | B | Export classification now that the app encrypts recordings itself | Before T35 | Ask counsel; do not answer "exempt" without advice |
| Q25 | B | Support resources row | Before C1 | Verified national resources; general-information disclaimer |
| Q26 | B | Retention periods marked "proposed" (folded into Q13) | 13 Nov | Adopt as proposed |
| Q27 | B | CSAM, legal process, custody disputes, safety removal, DMCA (rank 10) | Before T19 | Counsel-led runbooks S-8; no proactive scanning |
| Q28 | B | Breach readiness with recordings and wrapped keys on our server | Before T27 (18 Jan 2027) | Treat HBNR as applicable for readiness |
| Q29 | B | Account deletion in a shared book; fiduciaries (rank 9; was C) | 13 Nov | Runbook S-9; Terms 8.6 drafted |
| Q30 | C | Later features | Before each feature | Not built until answered |
| Q31 | A | Real families under draft policies (rank 4) | 13 Nov | No outside sign-in before counsel comments |
| Q32 | A | Recording backup with escrow (rank 2, new) | 13 Nov | The redlines in this delta |
| Q33 | B | Grief case and billing notices (rank 12, new) | Before release | Billing notices continue |

## 4. Tier A: blocks the first outside sign-in or submission

### Q8. Subscription notices and records with the status report (rank 1)
- **Context.** Plus is sold only by Apple (D-053), shown in Apple's own subscription view, and never enforced by our server. D-080 adds a status report: the app reads StoreKit 2 on the purchasing phone and sends plan, trial end, renewal date and a cancelled flag when a purchase or trial completes in the app and on each launch when values change. D-081 adds the consent facts to the first report (product, offer type, Subscription Terms version shown, time), one record per original purchase, kept for the life of the account plus 3 years and pseudonymised at deletion. The purchase is identified by `sub_ref`, a SHA-256 of the original transaction id with a per-account salt the server issues (pseudonymous, not anonymous; R8 R2A-20). The report carries `environment` and the server emails only for production. Only a phone whose transaction is the person's own purchase reports; Family Sharing members get no billing email. Emails follow the D-022 windows: acknowledgment within 1 hour, trial week (free period of 31 days or less, `E-8d` to `E-5d`), long trial (over 31 days, `E-21d` to `E-16d`), final trial (`E-5d` to `E-4d`), annual renewal 30 and 7 days before, monthly anniversary, cancelled and ended (F14 6.6). Notices key on the free period and offer type, not on the product (R4 PT-10). Every reminder says "If you have already cancelled, there is nothing to do." (D-080 rule). The same windows run on the phone as local notifications and an in-app card, with an acknowledgment sheet and Save a copy (BL-342). Never sent: receipts, signed transactions, transaction ids in clear, card data, prices. The full position before D-080 is `memos/q-003-subscription-notices.md`; parts of it (no emails, no consent record) are superseded.
- **Questions.** (a) **Unsigned buyers.** Plus can be bought before any account exists; with no email we can only notify on the phone. Do on-device notices meet 17602(b)(1) and (b)(2) for them, or must See Plus route through sign-in first (check App Review 5.1.1(v)), or should we ask for a billing-only email (F14 Q-C1; R4 PT-08 (a))? (b) **Deletion while Apple bills.** Must billing notices continue after account deletion while Apple still bills, and may we keep a minimal billing-notice record (email, plan, next date) until the subscription ends, disclosed on the deletion screen and the web page (F14 Q-C12; PT-08 (b))? (c) **Projection.** Must the scheduler project annual renewals it has not seen (for someone who deleted the app), sending with the "If you have already cancelled" line (PT-08 (c))? (d) **Proof of consent.** Is a consent record pseudonymised at account deletion adequate proof under 17602(a)(6), or must it stay linked for 1 year after the subscription ends or 3 years, whichever is longer (F14 Q-C3; PT-09)? (e) **Offer codes** redeemed outside the app never show our Subscription Terms; is `terms_shown: none_outside_app` acceptable, and must the free period convert only with the disclosures Apple shows (F14 Q-C11; PT-10)? (f) **Acknowledgment.** Does the acknowledgment sheet with Save a copy meet 17602(a)(3), with the email following within an hour (F14 Q-C2)? (g) Does Apple's view with our text above the plans, and no price or trial typed by us, meet "clear and conspicuous, close to the consent request" (F14 Q-C4)? (h) Is "If you have already cancelled, there is nothing to do." acceptable on a reminder that cannot see a cancel made outside the app (F14 Q-C5)? (i) Does 17602(h)'s annual reminder apply to monthly plans (F14 Q-C6)? (j) Is a 1-month trial outside 17602(b)(1) (F14 Q-C8)? (k) The earlier memo questions that still stand: whether state duties fall on us with Apple as merchant of record (memo C-1); Massachusetts monthly receipts (C-4); Virginia and NYC scope (C-7, C-8); keeping the current price for existing subscribers (C-9); ROSCA disclosure through Apple's store view (C-10).
- **Default if unanswered.** On-device notices for unsigned buyers; the billing-notice record kept after deletion until the subscription ends and then deleted; the scheduler projects renewals; consent record pseudonymised at deletion and kept 3 years; `none_outside_app` recorded; no offer code with a free period over 31 days; existing subscribers keep their price.
- **Answer by.** 13 Nov (T17). (a) and (b) change code and must be answered before the status report endpoint is built.
- **Documents.** Subscription Terms 1.5.0 (all); Terms 1.6.0 section 14; Privacy Policy 1.5.0 sections 3, 5, 8, 10, 15; in-app disclosures 1.5.0 section 3; labels 1.4.0 Purchases and Email rows; LEGAL-REQ-046 to -050 (ENGINEERING_REQUIREMENTS 1.3.0 to follow); F14 6.6, 8, 13; DECISIONS D-022, D-080, D-081.

### Q32. Recording backup with escrow (rank 2, new)
- **Context.** Owner-only encrypted backup of recordings ships in v1.0 (D-073, M14). Design, custody and the honest limit are in PRD V2 F08 section 6.5, which this summary follows and does not restate. Key facts: off until the owner turns it on; one sheet; a `backup` consent act recorded at the tap (F08-REQ-039); each recording encrypted on the phone before upload; a book key per (child, author) in the owner's iCloud Keychain; the book key sealed on the phone to our escrow public key and stored as a wrap on our server; the escrow private key generated offline by the founder, printed as two sealed paper copies kept in two places, and loaded once into a function secret in a separate Supabase project that holds only the `escrow` function. That function opens a key only for (1) the owner's restore on a new phone, after a step-up sign-in, a 24-hour hold (72 hours when another enrolled phone exists and does not approve), an email with a scanner-safe Stop link, a push and an in-app prompt on enrolled phones; (2) a key rotation; or (3) a recorded legal order with the founder's sign-off under a written runbook. It returns the key sealed to the requesting phone, never in clear. Every use writes an append-only `escrow_unwraps` row (copied daily outside database backups) and emails the owner, unless a legal order forbids telling them. Limits: 3 new-device restores per account per 30 days, 20 opened keys per day. **The honest limit (F08 6.5 C):** a person holding the escrow private key (the function secret or a sealed paper copy) plus a copy of the database and storage could open recordings offline with no row and no email; the controls on that path are custody, quarterly seal checks and a release check, and the Privacy Policy names who could do it. Product copy claims only what the system proves: "We use it only through our recovery service, which logs every use and emails you each time" (F17-REQ-027). No copy claims "only your family's keys can open" backups (M16, D-091). Family members cannot hear each other's recordings until v1.1.
- **Questions.** (a) Do Privacy Policy 1.5.0 sections 3, 7, 9, 11, 13 and 15, Terms 1.6.0 sections 6.2 and 12, CHD notice 1.3.0 sections 2 and 5, and label 1.4.0 say enough, and nothing more than is true? In particular, is the honest-limit paragraph (Privacy Policy section 7) clear and adequate, and is naming the founder and the hosting provider's staff as the people who could open recordings outside the service the right disclosure? (b) Does server-held voice audio make recordings "biometric data" under Washington's MHMDA, or consumer health data generally, even though we never extract a template (CHD HN-2; Privacy Policy CN-17)? Does the answer change because we can decrypt them? (c) Does backup need its own consent act, or can the sensitive-data consent cover it (F08 Q6; R4 PT-22)? The spec default is its own act, and the server refuses uploads without it (R8 R2A-26). (d) Is Audio Data "collected" for Apple's label when we hold ciphertext and a recovery key (F08 Q4; R4 PT-24)? Draft 1.4.0 says yes. (e) Must the Policy promise to notify on a legal-order use, subject to a gag, or only "where the law allows"? (f) Breach: are escrow-protected recordings "encrypted" for state breach safe harbours when we hold the means to decrypt (moved here from packet 1.0.0 Q30)?
- **Default if unanswered.** The redlines in this delta; its own `backup` consent act; Audio Data declared Linked, App Functionality; treat backup as not a safe-harbour encryption for breach purposes.
- **Answer by.** 13 Nov (T17). Backup reaches opted-in C1 families from 18 Jan 2027 (T27); the wording must be approved before then.
- **Documents.** F08 6.5, 6.7, 8; F17 8.2 item 6, 8.3, 8.5, F17-REQ-027, -028; Privacy Policy 1.5.0; Terms 1.6.0; CHD 1.3.0; in-app disclosures 1.5.0 section 3c; labels 1.4.0; DECISIONS D-073, D-091.

### Q17. Claims registry and absolute privacy claims (rank 3; absorbs Q21)
- **Context.** Packet 1.0.0 asked counsel to approve "Your recordings stay on this phone" in the microphone purpose string. With backup in v1.0, that sentence becomes false for every user the day the feature ships, because iOS shows the purpose string to everyone (R4 PT-01). The purpose string now keeps only its first sentence (F08-REQ-036). Other lines that do not hold as absolutes: "Only you and the people you invite can read your book" and "your letters" (store listing, `trust.signIn.privacy`; text is not end-to-end encrypted and backup has a recovery key we hold; R4 PT-25); "Your voice stays here" and "the recording stays with your letter" (`trust.firstRecording.*`); the earlier staff line "each one is logged" (dashboard reads are not logged today; R4 PT-03). The claims registry is not built (LEGAL-REQ-044, R4 PT-26).
- **Questions.** (a) Approve or replace each line in in-app disclosures 1.5.0 section 3b, where the proposed replacements are: purpose string "{app} uses the microphone to record the letters you speak to your child."; "Your book is shared only with the co-parent you invite. We don't read it."; "Your voice, kept as you made it"; staff line "We don't look at your letters or listen to your recordings. The few ways we could, and the limits on each, are in our Privacy Policy." (b) Is "Private by default" acceptable with that sentence beside it? (c) Is the trust promise ("Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models.") still acceptable now that we can decrypt backed-up recordings? (d) Is the one scoped logging claim (`backup.sheetBody`, "logs every use and emails you each time") acceptable given the honest limit in Q32? (e) From old Q21: is the transparency-report commitment (publish request counts) worth keeping for an individual? (f) Must the registry exist before submission?
- **Default if unanswered.** The replacements above; "Private by default" kept only with the sentence beside it; the scoped backup line; transparency commitment kept; the registry before C1 (LEGAL-REQ-044).
- **Answer by.** 13 Nov (T17).
- **Documents.** in-app disclosures 1.5.0 sections 3a to 3c; labels 1.4.0 section 4; Privacy Policy 1.5.0 short version, 6, 7; F17 6.2 B, 8.3; F21 6.5; `packages/content` `trust`, `permissions`, `backup` (owned by S16).

### Q31. Real families under draft policies (rank 4)
- **Context.** Sign-in and sync need published `terms` and `sensitive-data` rows (the server refuses content writes without them). The founding family uses the switch-on build from 23 Nov (T19); outside families from 7 Dec (C1, T22); counsel signs off by 23 Apr 2027 (T30). R4 PT-31: no outside family should sign in before counsel's comments on the server-on Policy.
- **Questions.** (a) May outside C1 families accept the redlined drafts (notes stripped, publisher fields filled, a pre-release line on top) as versions marked draft, once counsel has commented (T17) but before sign-off? (b) Is counsel's final text then offered as 1.0.0 with re-consent and short notice, rather than 30 days' notice? (c) Anything in the drafts that must not go to testers even as pre-release text? (d) Backup reaches opted-in testers on 18 Jan 2027: does the backup consent act need counsel's signed text before then?
- **Default.** No outside family signs in before counsel's comments; draft versions to the founding family and C1 only; 1.0.0 with re-consent; backup consent text approved before T27.
- **Answer by.** 13 Nov (T17).
- **Documents.** POLICY_VERSIONING 2.4, 3, 6; DEBATES Q-009; FOUNDER_TASKS FT-23, FT-31, FT-41.

### Q4. COPPA scope, revisited for recording backup (rank 5)
- **Context.** Users are adults; the child never signs in or uses the app; information about the child comes from the parent (FTC COPPA FAQ A.8, opened 2 Oct). Packet 1.0.0 relied partly on recordings never leaving the phone. With backup, a recording that includes a baby's or toddler's voice can reach our server as ciphertext that we can decrypt through escrow. Features that would prompt a child to speak (`together` prompts, sibling letters) stay behind the `child-input` flag, off in production until a written opinion (LEGAL-REQ-059). The amended Rule's compliance date was 22 April 2026 (S).
- **Questions.** (a) Confirm COPPA does not apply to v1.0 as designed, with backup. (b) Confirm in writing that a child's voice in the background of a parent's recording is information provided by the parent about a child, not collected from the child, including when it is stored on our server. (c) Does the amended Rule's biometric language matter when we create no template? (d) Should we adopt the written retention policy and security programme anyway (we recommend yes; `data-policy.md` is the retention policy)?
- **Default.** COPPA does not apply; flag stays off; adopt the written programme.
- **Answer by.** 13 Nov (T17).
- **Documents.** Privacy Policy 1.5.0 section 12, CN-2; register CR-001, CR-002; LEGAL-REQ-045, -059.

### Q5. Age assurance: Texas SB 2420 now, California AB 1043 from 1 Jan 2027 (rank 6)
- **Context.** The app asks "Are you 18 or older?" before first use, stores only a boolean (D-026), repeats the confirmation at sign-in, and uses Apple's Declared Age Range in memory where available. F02 had planned to send `age_signal: 'declared_range'` to the server; it is held until counsel answers (F02 sign-in step 4). Texas SB 2420 asks developers to use the store's age signal (S). California AB 1043 from 1 Jan 2027 requires requesting the age signal at download and launch; a signal is actual knowledge (Kelley Drye FAQ, S, opened 3 Oct 2026). WP-F01-07 puts the OS signal request into every external build from that date (08 T32). The gate's residuals: re-ask after 24 hours and reinstall reset it (R4 PT-12).
- **Questions.** (a) What does SB 2420 require for Texas accounts on iOS below 26.2, and when an eligible user declines sharing? (b) May we store `age_signal` as compliance evidence, and for how long, or must it stay off the server? (c) How must AB 1043 be handled from 1 Jan 2027, including installs made before that date? (d) Is excluding teen parents right? (e) Is a store minor signal "actual knowledge" requiring closure even after a "Yes" at our gate? (f) Are the gate's residuals acceptable for an adults-only app if written down?
- **Default.** No `age_signal` stored; WP-F01-07 from 1 Jan 2027 treating any minor signal as actual knowledge; teen parents excluded; residuals recorded in F01 section 8.
- **Answer by.** Fri 30 Oct for (a), (b) (DR-10 moved earlier at R4's request); 13 Nov for (c) to (f).
- **Documents.** Terms 1.5, 2.1; Privacy Policy 2, 12, CN-2; LEGAL-REQ-002; register CR-004, CR-005; F01, F02.

### Q1. Individual publisher, personal exposure and Apple guideline 5.1.1(ix) (rank 7)
- **Context.** The founder publishes under a personal Apple Developer account with no company (D-004, D-064). The server-on v1.0 puts children's names, dates, letters and, with backup, recordings we can decrypt, plus the escrow key, under one person's name (R4 PT-30). Apple 5.1.1(ix) (opened 3 Oct 2026): apps that "require sensitive user information should be submitted by a legal entity that provides the services, and not by an individual developer." Changing the controller after publication is a major policy change and an app transfer (POLICY_VERSIONING 2.1 item 9). DR-11 is due at T15 (Fri 6 Nov).
- **Questions.** (a) May "we" refer to an individual throughout, and may notices use a mailing address? (b) Does anything in the drafts increase personal exposure beyond what an entity would face, now including the escrow custody (the founder holds the sealed paper copies)? (c) Should the founder form an entity now, so the first published policy names it? (d) Which insurance (technology errors and omissions, cyber) to price? (e) Is a later move to an entity a major change needing re-consent?
- **Default.** Publish as an individual with a mailing address unless the founder chooses an entity at T15; if chosen, start it at once.
- **Answer by.** Fri 6 Nov (T15) for (b) and (c); 13 Nov for the rest.
- **Documents.** Terms 1.1, 26.1(h), 27.3, 28; Privacy Policy 1, 7, 20, CN-1; CHD 7, HN-10; register CR-130.

### Q2. Washington MHMDA and Connecticut consent design (rank 8)
- **Context.** Letters can hold health details; the due date reveals a pregnancy. One separate sensitive-data consent comes after account creation and before the first sync; the server refuses content writes without it (`SCCON`). It is shown to every account whose consent is missing, new or existing (F02 step 5; R4 PT-20). `sensitiveConsent.body` must name the co-parent (gap G-21, owned by S16). Withdrawal: the sheet offers Export first, says "Letters already synced stay on our server, and in {child}'s book for {coParent}, until you delete them or your account.", and puts "Stop syncing and delete my synced letters" above "Stop syncing" (F17 6.2 B step 3, R4 PT-23). Server mode `sensitive_withdrawal_mode` is `offer` at launch; `enforce` waits on counsel.
- **Questions.** (a) Is one consent enough, or does sharing with a co-parent need a second "separate and distinct" consent at the first invite (RCW 19.373.030; D-050)? (b) Can a parent's consent cover health data about their child? (c) A letter by one author about another adult's health (HN-5): how do we honour that adult's deletion request? (d) Connecticut: does stopping sync and offering deletion satisfy the reported 15-day stop-processing rule on revocation (U), or must synced letters be erased (`enforce`)? (e) Is the proposed consent text (CHD HN-4) compliant? (f) Backup: see Q32 (c).
- **Default.** One consent before first sync naming the co-parent; no second consent; HN-5 runbook; `offer` mode.
- **Answer by.** 13 Nov (T17), and before the first outside family signs in.
- **Documents.** CHD 1.3.0 section 4, HN-4, HN-5; Privacy Policy 1.5.0 section 13, CN-16; LEGAL-REQ-006; F17 6.2 B; DECISIONS D-050.

### Q13. Deletion clock and named exceptions (rank 11; absorbs Q26)
- **Context.** The published promise stays: erasure from live systems in 31 days, backups in 38, processors in 45 (K-23). The server-on build adds systems and records (F17 8.4): backup objects, wrapped keys, device keys, restore requests and stop-link tokens (deleted); the recovery-key log (`escrow_unwraps`, profile id pseudonymised, kept 24 months; daily copies with ids only roll off in 60 days); audit records (actor ids pseudonymised, 24 months); consent records including the D-081 purchase consent (pseudonymised, 3 years); the subscription status record (deleted, or kept as a minimal billing-notice record until an active subscription ends, if counsel agrees); the deletion receipt (3 years); a suppression hash at the email provider if unsubscribed; the email provider's 30-day copy of the completion email; restore-drill scratch projects (deleted within 24 hours of a drill). Before any backup object is deleted, the phone shows how many recordings exist only in the backup and offers to bring them back (F08 6.5 D). If PostHog deletion never confirms, the phone keeps the ids and retries, and the receipt shows PostHog `unconfirmed` (F17-REQ-029; R4 PT-28).
- **Questions.** (a) Are these named exceptions acceptable under MHMDA and the CCPA, and must each be listed on the deletion screen, the web page and the Policy (as drafted)? (b) Is pseudonymisation enough for the recovery-key log and audit rows, or must they be deleted at execution (R4 PT-34)? (c) How do we disclose an unconfirmed PostHog deletion, and should PostHog retention drop to 90 days (PT-28)? (d) Keep the completion email with its 30-day copy, or drop it? (e) From old Q26: approve the periods marked "proposed" (analytics 12 months, support email 2 years, consent records life of account plus 3 years) and "no inactivity deletion" (OQ-11).
- **Default.** The exceptions as drafted; pseudonymisation; receipt shows `unconfirmed`; keep the email; periods as proposed.
- **Answer by.** 13 Nov (T17).
- **Documents.** Privacy Policy 1.5.0 section 10, CN-12, CN-13; CHD 1.3.0 section 6; data-policy 1.3.0 sections 5, 6; F17 8.4; deletion spec (1.3.0 to follow).

### Q3. Consumer Health Data policy content and "homepage" links
- **Context.** Washington requires a separate CHD privacy policy linked prominently from the "homepage", which includes the app's download page (RCW 19.373.010, .020). `store.en.ts` ends with Terms and Privacy links only.
- **Questions.** (a) Does CHD policy 1.3.0 meet RCW 19.373.020's content list, now that it covers recording backup? (b) Is a third legal line in the App Store description plus a website footer link and a Settings link enough? (c) Does MHMDA apply the same way to an individual "regulated entity"?
- **Default.** Add the store line, the footer link and the Settings > Legal row.
- **Answer by.** 13 Nov.
- **Documents.** CHD 1.3.0 (all), HN-6, HN-10; in-app disclosures 1.5.0 section 4.

### Q7. DEBATES Q-005: privacy label linkage for analytics
- **Context.** Unchanged from 1.0.0: opt-in PostHog with a random ID per consent period, no IP, no person properties; the phone keeps retired IDs to request deletion. The server-on build adds purchase data to our server (status report), so Purchase History is now App Functionality as well as Analytics, and Linked either way (label 1.4.0).
- **Question.** Is analytics data "Linked" or "Not linked", given that a random persistent ID is likely CCPA personal information and that we keep the ability to link IDs for deletion?
- **Default.** Linked; Analytics added to User ID.
- **Answer by.** 13 Nov.
- **Documents.** labels 1.4.0 sections 1.2, 1.3, 3.3; Privacy Policy 6, CN-21; TRACKING_PLAN 10.

### Q9. Training-data terms behind the Hindi and Mandarin speech models
- **Context, questions and default** are unchanged from 1.0.0: may we distribute a converted copy of a model whose weights are Apache-2.0 but whose training sets include restrictive data (Hindi `vasista22/whisper-hindi-small`; Mandarin candidate Belle, not chosen); attribution; diligence; any later fine-tune. Default: do not host the Hindi file until cleared; Hindi uses the shared model.
- **Answer by.** 13 Nov (before the release build).
- **Documents.** ADR 0015; register CR-123; `apps/mobile/src/lib/models/catalog.ts`; `packages/content/src/features/licences.en.ts`.

### Q10. Trademark clearance and the name collision
- **Unchanged from 1.0.0.** "Early Letters" is not cleared (register CR-122); 19 US apps returned for the search term, all letter-learning apps (3 Oct 2026). Questions: blocking marks (Classes 9, 42, 16); confusion risk; intent-to-use filing as an individual; rename before submission if material. Default: proceed; file if clear.
- **Answer by.** Search by 13 Nov; opinion before submission.

### Q11. Processor contracts, now including the escrow project
- **Context.** v1.0 processors (subprocessors 1.4.0): Supabase (main project: database, auth, functions, storage, now including encrypted recording backups and wrapped keys; second project `scribe-escrow` running only the `escrow` function and its secret), PostHog, Resend (now also billing reminder and security emails), Vercel, the download host (Cloudflare R2 candidate). Apple delivers push notifications from our server (APNs) and is listed as an independent party.
- **Questions.** (a) Are the standard DPAs adequate as CCPA service-provider and MHMDA processor terms, now that Supabase stores recordings (as ciphertext) and the escrow secret? (b) Does running the escrow key in a Supabase project make Supabase staff part of the honest limit (Privacy Policy section 7 says yes)? (c) Resend without an explicit no-training clause, now carrying billing emails with plan and dates (no content)? (d) The Singapore contracting entity for Supabase and our "data lives in the United States" statements. (e) Is Apple's push service correctly outside the processor list?
- **Default.** Accept the standard DPAs; list both Supabase projects; publish the list with contacts.
- **Answer by.** 13 Nov.
- **Documents.** subprocessors 1.4.0; Privacy Policy 1.5.0 section 8, CN-7, CN-11; CHD 1.3.0 section 5, HN-7.

### Q14. "Free" claims under the membership model
- **Context.** Terms 13 promised writing, reading, playing, export and writing with a co-parent free "for as long as we operate the Service", non-amendable for existing users. The membership (M1, D-082) ends free writing after the first 2 kept letters. Terms 1.6.0 replaces section 13 with "What stays free" (letters you made stay yours to read, play and export; capturing, typing, reviewing, deleting, Read together and extra books free; a held letter is never lost) and R4 PT-13's scoped sentence: "Every letter you write stays yours to read, play and export, with or without Plus." The other parent's letters can leave the book when that parent leaves or deletes their account, and the other parent's recordings never play on your phone in v1.0, so "playable" is not claimed for them.
- **Questions.** (a) Is the new section 13 enforceable and not misleading under FTC "free" guidance (CR-012)? (b) Is it acceptable that 13.3 (non-amendable) now covers a narrower promise, given no user is bound yet? (c) Does it bind an asset buyer through 17.2 and 27.3?
- **Default.** As drafted in Terms 1.6.0.
- **Answer by.** 13 Nov.
- **Documents.** Terms 1.6.0 sections 13, 14.1, 17.2, 27.3; Subscription Terms 1.5.0 "What stays free"; in-app disclosures 1.5.0 section 3.

### Q15. Liability cap, carve-outs and indemnity
- **Context.** Terms 21.1 caps liability at the greater of 12 months' fees or $50; 21.2 carves out fraud, intentional misconduct, gross negligence, violation of law, death or personal injury and anything Civil Code 1668 forbids. Packet 1.0.0 noted that recordings never reached our servers, which lowered exposure; with backup they can, and we can decrypt them through escrow.
- **Questions.** (a) Is the cap enforceable for consumers in California? (b) Should a security breach, a misuse of the escrow key, or a breach of the 6.2 promises sit outside the cap or carry a higher one? (c) Keep or drop the user indemnity? (d) Apple minimum term 5?
- **Default.** As drafted; counsel to decide whether to carve out data security.
- **Answer by.** 13 Nov.
- **Documents.** Terms 20, 21, 22; memos/lawyer-1.md L2.

### Q16. Binding promises
- **Unchanged in substance.** Terms 6.2 (never sold, no ads, no training, never imitate a voice), 11 (faithful transcription), 17 (90 days' notice; export; successor keeps 6, 13 and 17). New in 1.6.0: 6.2 no longer says "we cannot listen", and 17.1 says backed-up recordings can be downloaded during the notice period. Questions: can an individual keep these through a sale or insolvency; wind-down reserve; "We never imitate your voice" as an absolute. Default: keep all.
- **Answer by.** 13 Nov.

### Q18. Arbitration, EULA and support phone
- **Unchanged.** Courts or arbitration; custom EULA or Apple's Standard EULA plus these Terms; a forwarding phone number. Default: courts plus small claims; custom EULA; forwarding number.
- **Answer by.** 13 Nov (App Store Connect fields at T35).

### Q23. Security findings with legal effect
- **Context.** The 2026-10-04 review found H1 (an email link signs a phone into another person's account and uploads its letters), H3 (Apple refresh tokens not captured), M2 (invite tokens in the URL path). R4 PT-19 and PT-20 add: account takeover would let an attacker request recordings through escrow; the new-device email must be server-triggered (R8 R2A-06); restore holds and the Stop page (F08 6.5 C).
- **Questions.** (a) If H1 or a takeover happens to a beta family, is it a reportable breach under state law or MHMDA? (b) If H3 is not fixed by submission, is it a 5.1.1(v) blocker? (c) Is the residual takeover risk (lost only phone plus compromised inbox, 24-hour hold only; F08-U27c) acceptable if disclosed?
- **Default.** The security gate (D-089) before anyone outside the family signs in; H3 before submission; residual risk stated in the backup ADR.
- **Answer by.** Before T19 (23 Nov).
- **Documents.** Privacy Policy 1.5.0 sections 3, 10, 11, CN-23; F08 6.5 C; F02-REQ-017; SECURITY.md 5.

## 5. Tier B: before release or a dated event

### Q29. Account deletion in a shared book; fiduciaries and death (rank 9; moved from tier C)
- **Context.** Accounts exist at v1.0, and this is a legacy product. A sole parent's book is reachable only through their sign-in; a surviving partner or guardian cannot reach the letters written to the child (R4 PT-17). Account deletion removes the author's letters from every book, including one shared with a co-parent (K-22). Fiduciary access to digital assets is governed by state law (RUFADAA variants, California included). Terms 1.6.0 adds a draft section 8.6 for counsel.
- **Questions.** (a) What a verified fiduciary may receive (default: one export of the deceased person's letters and, if backed up, recordings, delivered by us; no account takeover), what documents we require, and how fast. (b) Is Terms 8.6 adequate? (c) May a surviving licence let letters stay for the child after the author deletes their account (B-REQ-025, "leave my letters for {child}")? (d) Does the escrow `legal` reason cover a fiduciary request, or only a legal order?
- **Default.** Runbook S-9 as (a); Terms 8.6 as drafted; no surviving licence in v1.0.
- **Answer by.** 13 Nov (T17).
- **Documents.** Terms 1.6.0 sections 8.4, 8.6; Privacy Policy 1.5.0 section 10; F20 6.5; deletion spec OQ-1; register CR-018.

### Q27. CSAM reporting, legal process, custody disputes, safety removal, DMCA (rank 10)
- **Context.** Terms 9.4 (verified court orders), 10.3 (NCMEC reporting), Privacy Policy 7 (legal requests). Safety removal of a parent is v1.0 (M14), but its evidence standard is open and its runbook (S-8) is not written; support is the founder alone (R4 PT-16). LEGAL-REQ-057 binds at v1.0. With escrow, a legal order could reach backed-up recordings; the `legal` reason needs a recorded order and the founder's sign-off (F08 6.5 C).
- **Questions.** (a) The evidence standard for removing a parent; what each parent sees; what is never done. (b) Verification and notice for court orders and subpoenas in custody disputes (Stored Communications Act), including for backed-up recordings. (c) Do we owe 18 U.S.C. 2258A reports? (d) Register a DMCA agent?
- **Default.** Counsel-led runbook S-8 before C1; no safety removal by support unless a backup responder is named (then Help says so); no proactive scanning; no DMCA agent until public sharing exists.
- **Answer by.** Before T19 (23 Nov).
- **Documents.** Terms 9, 10; Privacy Policy 1.5.0 section 7; LEGAL-REQ-056, -057; F20 6.4, 6.5; register CR-112, CR-113.

### Q33. Grief case and billing notices (rank 12, new)
- **Context.** The child-death runbook (F20 S-1) offers to "stop every email from us". Billing notices may be legally required while Apple keeps charging. After a pregnancy loss, the due date (consumer health data) stays on our server under a hidden book (R4 PT-18).
- **Questions.** (a) May billing notices be suppressed when a family asks us to stop all email? (b) Should S-1 offer to delete the due date, and ask before hiding the book for the other parent?
- **Default.** Billing notices continue, with a plain explanation and links to Manage subscription and Apple's refund request; S-1 offers to delete the due date and asks before hiding the book for the other parent.
- **Answer by.** Before release.
- **Documents.** F20 S-1; F12 6.2 D; F14 6.6.

### Q24. Export classification (encryption) in App Store Connect
- **Context.** Packet 1.0.0 assumed only TLS and Apple's platform encryption. The server-on v1.0 encrypts recordings in the app (AES-256-GCM, X25519 sealing through CryptoKit, HKDF-SHA256) for the user's own backup, and the escrow function opens keys on our server (F08 6.5).
- **Question.** What is the right export-compliance answer in App Store Connect, and is any filing (for example an annual self-classification report) needed? (U: not researched in this pass.)
- **Default.** Do not answer "exempt" without counsel's advice.
- **Answer by.** Before T35 (30 Apr 2027).
- **Documents.** Register CR-089, CR-121; F08 6.5.

### Q28. Breach readiness
- **Context.** State breach laws apply; the FTC Health Breach Notification Rule may arguably apply (register CR-030). Packet 1.0.0 said recordings never reached our servers. With backup, our server holds recording ciphertext, wrapped keys and the recovery-key log, and a separate project holds the escrow secret.
- **Questions.** (a) Does HBNR apply? (b) Which clock governs? (c) Does the escrow design change notification duties when ciphertext and wraps are exposed without the escrow secret, and when the secret is exposed (see Q32 (f))? (d) Do the templates in `docs/ops/runbooks/incident-notification.md` meet the main states' content rules?
- **Default.** Treat HBNR as applicable; shortest clock; treat escrow-protected recordings as not safe-harbour encrypted.
- **Answer by.** Before T27 (18 Jan 2027), when backup reaches testers.
- **Documents.** LEGAL-REQ-039; register CR-017, CR-030, CR-111; F08 6.5 G.

### Q6. DEBATES Q-004: a spoken-language code in opt-in analytics
- **Unchanged from 1.0.0** (closed seven-code `lang` on two events; author-only `entries.language`; k = 10 server view). Default: ship option (a).
- **Answer by.** Before C1 (7 Dec).

### Q12. IP address plus a language-revealing file name at download hosts
- **Unchanged.** Default: disclose; mirror later (D-046). **Answer by** 13 Nov.

### Q19. Pre-account local use
- **Unchanged.** People can write and keep letters on the phone before creating an account; Terms acceptance happens at sign-in, after the 18+ gate. Is browsewrap acceptable for pre-account use? Default: sign-in-wrap only. **Answer by** 13 Nov.

### Q20. CCPA, CalOPPA and other state laws
- **Context.** Likely below every CCPA threshold; voluntary compliance. New in the server-on build: commercial information on our server (the status report), and audio (backed-up recordings) in the CCPA table (Privacy Policy 1.5.0 section 15).
- **Questions.** (a) 7027(m) purposes and the "Limit" link; (b) risk assessment timing; (c) is the notice at collection complete for the server-on v1.0? **Default** voluntary compliance; no "Limit" link. **Answer by** 13 Nov.

### Q21. Staff access and transparency
- Folded into Q17 (rank 3). The Privacy Policy 1.5.0 section 7 no longer says "each access through our support tools is logged"; it names the ways we could read letters or open recordings and the limits on each (R4 PT-03; F17 8.2 item 6).

### Q25. The "If you are struggling" support row
- **Unchanged.** Verified national resources, re-checked each release; US-only scope line (D-087). **Answer by** before C1.

### Q26. Retention periods marked "proposed"
- Folded into Q13 (e).

## 6. Tier C: before later features ship

### Q22. Launch geography and overseas family
- **Unchanged.** US storefront only. Revisit before family members or a web page ship; DPDP view by May 2027.

### Q30. Later features (counsel batch)
Each is answered before its feature ships; the default is "not built until answered". Removed from this list in 1.1.0: owner backup (now Q32, v1.0).

| Item | Source | Question |
|---|---|---|
| Server transcription and the AI gateway | T5-07, BL-304; LEGAL-REQ-004, -020 | Consent text naming providers (Apple 5.1.2(i)); zero retention; DPAs; major policy change |
| Family hearing each other's recordings (v1.1) | D-073; ADR 0006; F08 Q5 | Sharing a book key with a co-parent; MHMDA sharing consent for audio; Privacy Policy and Terms 7.1 rewrite |
| A move of the escrow key to a cloud KMS with provider audit logs | F08 6.5 C, Q9 | Whether the logging claim can widen; new ADR |
| Other family members and the web page | D-055; LEGAL-REQ-005, -010, -035 | Contributor notice, age confirmation, rights without an account, MHMDA sharing consent |
| The child's own voice and "sounds" moments | CVL-19, T5-08; LEGAL-REQ-059 | Written COPPA opinion before `child-input` turns on |
| Importing a non-user's voice note | CVL-12 | Consent of the person recorded; Penal Code 632; biometric definitions |
| In-app feedback form | D-088 | Label change to Data Collected for feedback; text and screenshot retention |
| Native-speaker accuracy reviewers | CVL-02 | Are reviewers processors; what they may see |
| Hinglish fine-tune | 01 future backlog | Training-data terms (as Q9) |
| Pricing experiment arms | F14 6.9 | Arm values as L2; label effect |
| Translated UI and legal text | T5-19 | Civil Code 1632 |
| Printed books | T5-27, Terms 15 | Print Terms, sales tax, PCI scope |
| Insights agent data | D-070 | Reports stay content-free and k-anonymised |

## 7. Not counsel questions, but they block the first outside sign-in or submission

1. **Security gate** (D-089; 09 R-17): BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322, BL-349 merged and reviewed before anyone outside the family signs in. Owner: S01, founder.
2. **Migrations** applied to staging, then production, through CI (D-089); the governance migration (`safety_events` drop, cascade fix) included before the Privacy Policy is published (CN-10, CN-13). Owner: founder, S02.
3. **Escrow key ceremony** (WP-F08-B8) and the separate escrow project before backup turns on (T27); the release check that the key exists only there (F08-REQ-034). Owner: founder, S05.
4. **Content strings** that still say recordings stay on the phone, that there is no backup, that co-parent sharing is coming soon, or that we never email about Plus (S16 brief; F21 6.5). Owner: S16.
5. **Website hotfix** on `main` (T06): prices, Plus contents, sample child Asha (R4 PT-04). Owner: S20.
6. **Privacy manifest** in `app.config.ts` matching label 1.4.0 (BL-349). Owner: S20.
7. **Legal pages** live as versions marked draft by T20 (1 Dec), including `/stop` (F08 6.5 C4) and `/delete-account` with the named exceptions. Owner: S20, founder.
8. **Engineering legal documents** to the server-on build: ENGINEERING_REQUIREMENTS 1.3.0, DATA_CLASSIFICATION, DELETION_AND_EXPORT_SPEC (section 1.2). Owner: S17.
9. **Founder fields:** {PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}, {SUPPORT_PHONE}, {COUNTY}, {POLICY_ARCHIVE_URL}.

## 8. Where each question came from

| # | Sources |
|---|---|
| Q1 | D-004, D-064; R4 PT-30; Terms counsel note; register CR-130; CHD HN-10; Privacy CN-1 |
| Q2 | R4 PT-20, PT-23; CHD HN-4, HN-5; Privacy CN-16; LEGAL-REQ-006; D-050; F17 6.2 B |
| Q3 | CHD HN-6, HN-10; Privacy CN-3 |
| Q4 | R4 PT-01 and question 5; Privacy CN-2; lawyer-2 M1 |
| Q5 | R4 PT-11, PT-12 and question 6; F01, F02; register CR-004, CR-005 |
| Q6 | DEBATES Q-004; DATA_CLASSIFICATION open issue 2 |
| Q7 | DEBATES Q-005; TRACKING_PLAN 10; labels 1.3 |
| Q8 | R4 PT-07 to PT-10 and question 1; F14 6.6, Q-C1 to Q-C12; D-080, D-081; memos/q-003-subscription-notices.md |
| Q9 | ADR 0015 |
| Q10 | Register CR-122 |
| Q11 | subprocessors 1.4.0 section 4; F08 6.5 G2; Privacy CN-7 |
| Q12 | Privacy CN-11 |
| Q13 | R4 PT-28, PT-29, PT-34 and question 11; F17 8.4; R8 R2A-16, R2A-17; Privacy CN-12 |
| Q14 | M1, D-082; R4 PT-13; Terms 13 counsel note |
| Q15 | Terms 21 counsel note; lawyer-1 L2; D-073 |
| Q16 | Terms Appendix B 5; lawyer-1 L5 |
| Q17 | R4 PT-01, PT-03, PT-25, PT-26 and question 3; F17-REQ-027; F21 6.5; R8 R2A-01 |
| Q18 | Terms Appendix B 1 and 2; lawyer-1 L3, L4 |
| Q19 | Terms 1.5 counsel note |
| Q20 | Privacy CN-4 |
| Q23 | `docs/reviews/2026-10-04-security-privacy.md` H1, H3, M2; R4 PT-19, PT-20; R8 R2A-06 to R2A-08 |
| Q24 | Register CR-089, CR-121; F08 6.5 |
| Q25 | D-034, D-059, D-087 |
| Q27 | R4 PT-16 and question 10; Terms 9, 10; F20 S-5; LEGAL-REQ-057 |
| Q28 | Register CR-030; F08 6.5 G |
| Q29 | R4 PT-17, PT-13 and question 9; deletion spec OQ-1; T5-12 |
| Q30 | Future backlog; F08 Q5, Q9; D-088 |
| Q31 | R4 PT-31 and question 4; DEBATES Q-009 |
| Q32 | R4 PT-01, PT-02, PT-22, PT-24 and question 2; R8 R2A-01, R2A-02, R2A-26; F08 6.5, Q4, Q6; M16, D-091 |
| Q33 | R4 PT-18 and question 12; F20 S-1 |

Closed or superseded since 1.0.0: "Recordings never leave the phone in v1.0" (M14, D-073); old Q8 default of no emails and no server purchase records (D-080, D-081); old Q14 "free, always" (M1, D-082); old Q17 approval of "Your recordings stay on this phone" (M16, F08-REQ-036); old Q29 "before v1.1" (R4 PT-17); old Q30 owner backup row (now Q32); old calendar (D-090).

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.1.0 | 2026-10-15 | Server-on v1.0 delta for counsel (T05; R4 PT-05; 08 S17 brief). New section 1: one-page table of what M14 to M17 changed (accounts, server-held and co-parent-synced letters, encrypted recording backup with a recovery key we hold and its honest limit, status report and reminder emails, co-parent cap, deletion across sync, backup, escrow and analytics, membership and prices, date) and the list of redlined documents with old and new versions. New section 2: counsel questions in R4's priority order (ranks 1 to 12) mapped to packet numbers. New Q32 (recording backup with escrow; R4 PT-01, PT-02, PT-22, PT-24; R8 R2A-01, R2A-02; F08 Q4, Q6) and Q33 (grief case; R4 PT-18). Rewritten: Q8 (D-080, D-081, F14 Q-C1 to Q-C12), Q17 (absorbs Q21; PT-03, PT-25, PT-26), Q31 (PT-31), Q4 (backup), Q5 (DR-10 by 30 Oct; `age_signal`), Q1 (PT-30; escrow custody), Q2 (PT-20, PT-23), Q13 (absorbs Q26; PT-28, PT-29, PT-34; F17 8.4), Q14 (M1, PT-13), Q15, Q23 (PT-19, PT-20), Q24 (app-level encryption), Q27 (PT-16), Q28, Q29 (tier C to B; PT-17). Q11 adds the escrow project and APNs. Calendar from 08 section 2.1 (D-090). Prices $4.99 and $49.99 (D-082). Removed: every "recordings never leave the phone" statement. Engineering legal documents (ENGINEERING_REQUIREMENTS, DATA_CLASSIFICATION, DELETION_AND_EXPORT_SPEC) listed as still to follow. |
| 1.0.0 | 2026-10-03 | First consolidated packet, prepared with the legal alignment to D-051 to D-070. |
