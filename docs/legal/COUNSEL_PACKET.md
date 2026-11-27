---
title: Counsel packet, Early Letters v1.0 (option B) and after
version: 1.10.0
status: for counsel
date: 2026-11-24
owner: founder
prepared_by: AI (Claude), legal drafting support (stream S17); not legal advice
---

> **This packet was prepared by an AI. It is not legal advice, and no attorney-client relationship exists.** It collects every open legal question about the v1.0 build the founder chose on 15 Oct 2026 (option B), as questions, not conclusions. Each has a default the product follows if counsel has not answered by the date named; dates are milestone ids from PRD V2 `docs/prd/v2/08-delivery.md` section 2.1 (branch `docs/prd-v2`, PR #124). Facts are tagged **V** (verified on a page or file opened, with the date), **S** (secondary) or **U** (unverified). Source checks are in `BENCHMARK.md`. The published drafts contain no notes for counsel by the founder's direction of 15 Oct; everything counsel must confirm is here and in the pull request description.

> **Read under D-172 (23 Nov 2026).** No outside counsel is engaged and none has reviewed or approved anything here. Wherever this packet says "counsel", read the exec-team review (CLO, CCO, Chief Privacy Officer; Claude roles, not licensed lawyers; not legal advice). The calendar dates below that name counsel are superseded (D-172). The packet's wording is otherwise unchanged and is not edited line by line.

## 0. How to use this packet

**New in 1.10.0 (24 Nov 2026).** Adds section 10 (Q133 to Q138, printed book and print sale: FTC Mail Order Rule and returns, card data scope, sales tax, California price display, children's-product rules, the font licence in a PDF). Sections 1 to 9 are unchanged.

**New in 1.9.0 (21 Nov 2026).** Adds section 9 (Q123 to Q132, Moments tab, NS-53) and corrects the Q129 default to the founder's O-44 decision (disclose the iPhone backup in one plain line). Sections 1 to 8 are unchanged.

**New in 1.8.0 (20 Nov 2026).** Section 8 adds Q109 to Q122: the questions the days, cultural background and media cards (NS-46 to NS-52) left as "needs a number from legal" (CUL-Q5, Q6, Q7, Q11, Q14; FR-DAY-23; tradition-reviewer records; L-14 to L-19; C-9 to C-11). CUL-Q6 is widened to inference (CJEU C-184/20); CUL-Q11 (a day note that names a faith day) no longer maps to Q41. Sections 1 to 7 are unchanged.

**New in 1.7.0 (20 Nov 2026).** Section 7 adds the questions raised by the locked new-scope requirements (cards NS-01 to NS-37) and their engineering designs. It merges each repeated question into the existing number, adds two new ones (Q107, Q108), and marks which block the Build 13 store candidate. Sections 1 to 6 are unchanged apart from section 6 items 9 to 12.

**The product, in one paragraph (option B).** Early Letters is an iOS memory book for adults (18 and over only) who speak or type letters to their child. Speech becomes text on the phone; no audio or text goes to any speech or AI service. People can start without an account; signing in (Apple, or an emailed link and code) syncs letters to Supabase in the US after a separate sensitive-data consent, and lets two parents share a child's book as equals. The owner's recordings can be backed up, free, off until turned on, with its own consent: each recording is encrypted on the phone, the encrypted copy is stored in a private Supabase Storage bucket, and we keep an escrow copy of the key. The escrow private key is a function secret in a separate Supabase project (`scribe-escrow`) that runs only the recovery service, and is also on two sealed paper copies. The service writes an append-only log row for every key it opens (reasons: restore, rotation, legal), holds a restore 24 or 72 hours, takes approval only from a device enrolled at least 7 days before the request (D-108), and emails the owner on request, on release and on rotation (D-102 wording). The server side is on `feat/backup-server` (ad222eb, PR #151, not merged); the phone side is not built, so the drafts say backup is not available yet. Plus is the membership after 2 free letters: US $4.99 a month with the first month free, or US $49.99 a year with the first 2 months free, sold only by Apple, shared through Family Sharing. D-080 and D-081 plan a status report (plan, trial end, renewal date, cancelled flag) and a consent record so that we can email the auto-renewal reminders; neither is built (the `subscription-status` handler is a shell), so the drafts say our servers do not receive purchases. Phone reminders and a purchase confirmation with Save a copy are built (D-094). No analytics or crash reporting in v1.0 (D-095). US App Store only. Published by the founder as an individual (D-004).

**Decisions behind it.** Founder, 13 and 14 Oct (PR #128, D-100 to D-108). Delegated, 15 Oct (PR #122, D-093 to D-099). Founder, 15 Oct: option B, backup free for everyone; and the direction for legal pages (plain, short, no internal references, name only services the code uses, no separate health notice pending Q32).

**The calendar (PRD V2 08 section 2.1).** T05 Fri 23 Oct: this packet to the reviewers. T17 Fri 13 Nov: review comments. T19 Mon 23 Nov: switch-on internal TestFlight. T20 Tue 1 Dec: legal pages live as drafts. T22 Mon 7 Dec: first outside families. T27 Mon 18 Jan 2027: backup on for C1 families who opt in. T32 Fri 1 Jan 2027: California AB 1043. T30 by Fri 23 Apr 2027: exec-team review sign-off (D-172). T36 3 to 5 May 2027: submission.

**Priorities.** **A** blocks the first outside family (T22) or submission. **B** before a dated event in the row. **C** before a later feature.

**What is in the packet (branch `docs/legal-v1-server`).** Published drafts: Privacy Policy 3.0.0, Terms of Service 4.1.0 and Subscription Terms 4.1.0 (plain-form texts carrying develop's 4.0.0 content, D-082, D-083), service providers 2.1.0, delete-account page copy 1.1.0. Internal: in-app disclosures 3.4.0, App Privacy answers 2.1.0, ENGINEERING_REQUIREMENTS 2.2.0, POLICY_VERSIONING 1.3.0, compliance register 1.6.0 (facts only), DATA_CLASSIFICATION 1.5.0 (backup tables, section 4.3.1), BENCHMARK 1.1.0. The separate Consumer Health Data Privacy Policy is removed pending Q32; its last text is in git history. **Not yet updated for option B** (S17 follow-ups): `data-policy.md` 1.2.0, `DATA_CLASSIFICATION.md` outside section 4.3.1, `DELETION_AND_EXPORT_SPEC.md` 1.2.0, and the dated memos in `memos/`, which are records of 2 and 3 Oct.

Section references below are to the published drafts: Privacy 2 (what we collect), 3 (who can see), 4 (backup and the recovery key), 5 (use), 6 (providers), 7 (retention and deleting), 8 (children), 9 (health details), 10 (rights), 11 (security), 13 (changes). Terms 3 (account), 4 (books and co-parents), 5 (content), 6 (transcription), 7 (backup), 8 (Plus), 10 (ending), 12 (closing), 14 (liability), 16 (disputes), 18 (Apple).

**Built and not yet built (checked 16 Oct 2026 on `develop` ef79bd3, `feat/backup-server` ad222eb, `feat/db-v1-gate` 3d2d440, `feat/platform-v1-contracts` feea25f, `chore/pack-host-ios17` e55c721).** The published drafts describe only what the code does, or say plainly that a feature is not available yet. These are planned in PRD V2 but have no implementing code, so the drafts leave them out; each is added back, with notice under POLICY_VERSIONING, in the release that builds it:

| Planned | State of the code | How the drafts handle it |
|---|---|---|
| Push notifications (co-parent letter notices, restore alerts on other devices) | Payload shapes only (`packages/api/src/server/push.ts`); no sender, no token table | Not mentioned. Reminders on the phone are local notifications |
| New-device sign-in notice and device records | No `account_sessions_seen` table and no sender; the copy exists only | Not mentioned (Terms 3.2 asks people to tell us) |
| Subscription status report, purchase consent record and reminder emails (D-080, D-081) | `subscription-status` handler is a shell; nothing written; no sender | Our servers do not receive purchases; reminders are on the phone only |
| Recording backup, phone side | Contract only (`packages/api/src/server/recovery-key.ts`); server on `feat/backup-server` | Privacy 4 and Terms 7.2 say not available yet and describe how it will work |
| Email suppression record after unsubscribe | None; the website marks the Resend contact unsubscribed | Not mentioned |
| Sign-in again before account deletion; phones clear their data after deletion | Neither built | Not mentioned |

Cloudflare R2 arrives with PR #126 (signed remote config, pack manifest and content bundle from `packs.earlyletters.app`, D-097) and PR #162 (the upload pipeline). The drafts name R2 for what #126 uses, so this branch merges after #126.

## 1. What option B changed (one page)

| Area | Before (develop drafts of 3 Oct; PR #81 drafts of 4 Oct) | Option B (15 Oct) | Decision | Drafts | Questions |
|---|---|---|---|---|---|
| Accounts and sign-in | 3 Oct: sign-in with sync. #81: none | Optional sign-in after the first letter; Apple, or an email link and code (new-device email planned, not built) | D-100; F02 | Privacy 2, 5, 11; Terms 3 | Q46, Q56 |
| Letters on our server | 3 Oct: synced. #81: none | Synced after a separate sensitive-data consent; not end-to-end encrypted | D-100; F16 | Privacy 2, 3, 9 | Q43, Q48 |
| Co-parent sharing | 3 Oct: co-parent only. #81: not in v1.0 | Two parents per book, equals; the inviting parent can undo a join within 72 hours; after that, no removal between parents | D-100, D-099; F11 | Terms 3.3, 4; Privacy 3 | Q48, Q53 |
| Recording backup | 3 Oct and #81: none; recordings said to stay on the phone | Free, opt-in, own consent; encrypted on the phone; stored in Supabase Storage; escrow in a separate recovery service; log and email per use; holds; Stop link. Not available yet: the drafts say so | D-073, D-100, D-102, D-108; F08 6.5 | Privacy 4, 7; Terms 7; label | Q42, Q45, Q47, Q50 |
| Plus and reminders | 3 Oct: the earlier prices (superseded by D-082), Read together gate, no emails. #81: 2 free letters, no reminders | 2 free letters then Plus; $4.99 and $49.99; reminders on the phone (built); status report, consent record and reminder emails planned, not built | D-080 to D-082, D-103, D-094; F14 | Terms 8; Subscription Terms; Privacy 2, 7 | Q41, Q37, Q52 |
| Analytics | Opt-in PostHog | None in v1.0 | D-095 | Privacy 2; label | Q38 closed; Q7 deferred |
| Health details | Separate Consumer Health Data Privacy Policy | One paragraph in the Privacy Policy (section 9); separate notice removed pending counsel | Founder, 15 Oct | Privacy 9 | Q32 |
| Deletion | 31, 38, 45 day clock | Same clock; adds backup and keys when backup ships; named exceptions | F17 8.4 | Privacy 7; delete-account page | Q51, Q13 |
| Privacy label | 3 Oct 1.3.0: no audio. #81 2.0.0: the no-data answer | 1.4.0: Contact Info, User Content, User ID, Sensitive Info; Audio Data and Device ID when backup ships; Purchase History only if the status report ships; no Usage or Diagnostics | D-100; F17 8.5 | Label 1.4.0 | Q54 |
| Website email list | #81 Q34 | Still collected through Resend | ADR 0010 | Privacy 2; delete-account page | Q34 |

## 2. Questions for option B, in R4's order (PRD V2 `reviews/R4-privacy-trust.md`, 13 Oct)

### Q41 (A). Auto-renewal notices with the status report (R4 question 1; PT-08 to PT-10; F14 Q-C1 to Q-C12)
- **Context.** Apple is the merchant. D-080 and D-081 plan a status report (plan, trial end, renewal date, cancelled flag) and a first-purchase consent record (product, offer type, Subscription Terms version, time) so the server can email the notices; neither is built, and the drafts say our servers do not receive purchases. What is built: the purchasing iPhone schedules local reminders and shows a confirmation with Save a copy. The Subscription Terms say reminders "can arrive late or not at all". Laws were read on 3 Oct (V per the Q-003 memo); none re-read on 15 Oct (blocked).
- **Questions.** (a) May the Terms describe the reminders as best-effort when 17602(b) requires notice for trials over 31 days and terms of a year or more? (b) Is a phone notice enough for a buyer who never signs in, or must the Plus step ask for an email or route through sign-in? (c) After account deletion while Apple still bills, may and must we keep email, plan and next date until the subscription ends (the drafts no longer say so, because nothing is kept today)? (i) Until the status report ships, are phone-only reminders enough for v1.0? (d) Must the scheduler project renewals it has not seen? (e) Is a pseudonymised consent record adequate proof under 17602(a)(6)? (f) What must an offer code say, and may its free period exceed 31 days? (g) Is the confirmation with Save a copy a retained acknowledgment? (h) Does 17602(h)'s annual reminder reach monthly plans (the app sends one)?
- **Update 31 Oct 2026 (Terms 4.1.0 section 8.9; Subscription Terms 4.1.0; review SUB-03, SUB-04).** The app's reminders, in-app note and confirmation name no amount (D-083), and our own emails about Plus are not sent in the first store build (D-121). California 17602(b)(1) (a trial over 31 days, which the 2-month annual trial is) and (b)(2) (initial term of a year or more) are read in `docs/emails/COMPLIANCE.md` 5.1 as requiring a notice with the amount and frequency of charges; (h) asks for an annual reminder with the amount; (a)(3) an acknowledgment with the offer terms. Whether Apple's own receipts and emails reach these buyers in those windows, with the amount, is Unverified, as is whether the duties fall on us when Apple is merchant of record. Two routes: (i) a narrow D-083 exception so those notices show StoreKit's displayed price and period (the amount then comes from Apple, never typed), after which Terms 8.9 changes to say the app's reminders give the price; or (ii) counsel confirms in writing that Apple's messages satisfy (b)(1), (b)(2) and (h). Also Unverified: that Apple's receipt shows the amount charged for these products (check in the TestFlight sandbox pass). Terms 8.11 relies on choosing "keep current price for existing subscribers" in App Store Connect for every price change (avoids New York's 14-day pro-rata refund route, memo C-9); the billing grace period is 16 days (D-048). Federal: ROSCA (15 U.S.C. 8403) applies; the FTC 2024 Negative Option Rule was vacated in July 2025 and an advance notice of rulemaking was published on 13 March 2026 (as noted on 3 Oct 2026; not re-read). Lifetime option (not offered): California AB 2426 licence disclosure. The full 4.0.0 notes are in `CHANGES-2026-10-31.md`, last section.
- **Default.** Phone reminders as built; if the status report ships, the billing-notice record is kept until the subscription ends and the consent record is pseudonymised; no code over 31 days free. **Deadline.** T17. **Drafts.** Terms 8; Subscription Terms; Privacy 2, 7, 10.

### Q42 (A). Recording backup with escrow (R4 question 2; PT-01, PT-02, PT-22, PT-24)
- **Questions.** (a) Is Privacy 4 enough, including its sentence that someone with the recovery key and a copy of our stored data could open backups without the recovery service, a log entry or an email? Supabase hosts every piece: the encrypted files and sealed keys in the main project, and the recovery key as a function secret in the separate escrow project. (f) Privacy 4 says we email the owner on each use except a legal request the law forbids us to disclose; the code emails on restore and rotation, and a legal use has no code path yet. Is that wording right? (b) With us holding a key, is a breach of the backup store a breach of unencrypted personal information for state safe-harbour purposes? (c) Does server-held voice audio make recordings biometric data or consumer health data under MHMDA when no voiceprint is made? (d) Does backup need its own consent act (the build default), or can the sensitive-data consent cover it? (e) Is "We never listen to your recordings" safe as an absolute, given the legal-order use?
- **Default.** As drafted; own consent act; treat a store breach as reportable. **Deadline.** T17; backup consent text before T27.

### Q43 (A). Privacy claims (R4 question 3; PT-03, PT-25, PT-26)
- **Questions.** Approve or replace "Your book is shared only with the co-parent you invite" (sign-in line), "Private by default" (store, app) and the staff line ("We don't look at your letters. The few ways we could are written in our Privacy Policy."). Privacy 3 says letters are not end-to-end encrypted, that we could read them, and when we do; is that enough while dashboard access is not separately logged?
- **Default.** In-app disclosures 3.4.0 section 1. **Deadline.** T17.

### Q44 (A). Real families under draft texts (R4 question 4; PT-31; old Q31)
- **Questions.** May the founding family (T19) and the first outside families (T22) sign in and sync under texts marked draft (published as 0.9.0 per POLICY_VERSIONING 2.4), with 1.0.0 offered later with re-consent? What must the 0.9.0 consent say?
- **Default.** No outside family signs in before T17 comments. **Deadline.** T17.

### Q45 (A). COPPA revisited for backup (R4 question 5; old Q4)
- **Question.** With backup, a baby's voice in the background of a parent's recording reaches our servers, encrypted. Does that change the view that COPPA does not apply?
- **Default.** Does not apply; `child-input` flag off. **Deadline.** T17.

### Q46 (B). Age assurance (R4 question 6; PT-11, PT-12; old Q5)
- **Questions.** Old Q5 (a) to (d); may an age signal be stored with the Terms acceptance as compliance evidence; how are installs made before 1 Jan 2027 handled under AB 1043?
- **Default.** No age signal on the server; request the OS signal at launch from T32. **Deadline.** T17 for AB 1043.

### Q47 (A). Publisher identity and key custody (R4 question 7; PT-30; old Q1, #81 Q36)
- **Questions.** Old Q1 (a) to (e), plus: does the founder's personal custody of the sealed escrow key copies change the entity and insurance advice? If an entity is formed, can the first published texts name it?
- **Default.** Individual with a mailing address; founder decides at T15. **Deadline.** T15.

### Q48 (A). Consent design (R4 question 8; PT-23; D-050; old Q2)
- **Questions.** Is sharing with the other parent "necessary to provide" the shared book, or is a separate sharing consent needed at the first invite (one is built, switched off)? Connecticut: on withdrawal, is stop-and-offer-deletion enough, or must synced letters be erased within 15 days (U)? Does Privacy 9 plus the in-app agreement meet MHMDA's consent content rules?
- **Default.** One consent naming the co-parent; stop and offer deletion. **Deadline.** T17.

### Q49 (B). Death, incapacity and fiduciary access (R4 question 9; PT-17; old Q29)
- **Questions.** The Terms have no fiduciary clause. Should they say that a verified executor, legal representative or the child's guardian may receive one export of a sole parent's book, with no account takeover? What documents should we require (California RUFADAA and similar)? Should "leave my letters for my child" after account deletion be offered?
- **Default.** No clause; runbook before C1. **Deadline.** T17.

### Q50 (B). Safety removal, custody and legal orders (R4 question 10; PT-16; old Q27)
- **Questions.** The evidence standard for limiting a parent's access (Terms 4.4); answering court orders and subpoenas, including a legal-order use of the escrow key (Privacy 4 promises notice unless the law forbids it); CSAM reporting duty (Terms 9) now that recordings can reach our servers; whether a DMCA agent is needed.
- **Default.** Counsel-led runbooks; notice unless forbidden. **Deadline.** T17.

### Q51 (B). Deletion exceptions and retention (R4 question 11; old Q13, Q26)
- **Questions.** Approve the kept records in Privacy 7 and the delete-account page. **Conflict:** D-021 sets key-unwrap logs at 12 months; PRD V2 F08 and F17 set them at 24; the drafts say 24. Also the email provider's 30-day copy of the completion email, the one exception to the 45-day provider clock.
- **Default.** 24 months; the coordinator amends D-021 if counsel agrees. **Deadline.** T17.

### Q52 (C). Grief case and billing notices (R4 question 12; PT-18)
- **Question.** If a family asks us to stop all email after a loss, may billing notices stop while Apple still bills?
- **Default.** They continue. **Deadline.** T30.

## 3. Further questions for option B

### Q53 (A). Two parents per book
- **Question.** Terms 3.3 and 4 make two parents equals: the parent who sent the invite can undo the join within 72 hours (`undo_parent_join`, on `feat/db-v1-gate`), and after that neither can remove the other; leaving has a choice with nothing preselected. Enforceable and fair for separating parents?
- **Default.** As drafted. **Deadline.** T17.

### Q54 (A). App Privacy answers 1.4.0
- **Questions.** (a) Is backed-up audio "collected" and "linked" when we hold a key? (b) Is the random per-install ID a Device ID (only `backup_devices` uses one)? (c) If the status report ships, is it Purchase History for App Functionality? (d) If push ships, do push tokens need a row? (e) Is any row optional to disclose?
- **Default.** Declare what the release build sends, linked (labels 3.2 and 3.4). **Deadline.** T17; final at T30.

### Q55 (B). Export classification with app-level encryption (old Q24)
- **Question.** Backup adds AES-256-GCM and X25519 sealing to protect the user's own data. Is "uses only exempt encryption" still the right App Store Connect answer?
- **Default.** Exempt. **Deadline.** T23.

### Q56 (B). Sign-in codes as sensitive personal information
- **Question.** Sign-in links and codes travel by email through Resend. Are they "account log-in" credentials under the CCPA's sensitive personal information definition, and does that change Resend's contract or the California disclosure?
- **Default.** Treat them as sensitive; no change to the text. **Deadline.** T17.

### Q57 (A). Sanctions: blocked places, and no name screening (D-131, D-137)
- **Context.** We take no payments (Apple sells Plus) and offer the app only on the US storefront. Terms 2.4 asks every user to confirm they are not in an embargoed place and not on a US restricted-party list. Under D-131 a sign-up check (not yet live) refuses requests whose IP address maps to North Korea, Iran, Cuba, Syria, Russia or Belarus; the planned web contribution page also refuses Crimea, Sevastopol, Donetsk and Luhansk. Under D-137 we do not screen names against the SDN List or other restricted-party lists, because it would mean collecting legal names, and in practice dates of birth, that the product otherwise never needs. Our reading rests on A Framework for OFAC Compliance Commitments (a risk-based approach, size and sophistication as factors) and the Enforcement Guidelines (31 CFR 501 Appendix A), read 1 Nov 2026. We know OFAC civil liability is generally strict and that program rules bar services to a blocked person with no payment threshold, so this lowers cost, not exposure. Instead of a sweep, support checks a name on a report or escalation, and a possible match is suspended, never deleted, and brought to you the same day (`docs/ops/runbooks/sanctions-match.md`). Privacy 12 discloses the check (D-136).
- **Questions.** (a) Is the Terms confirmation plus the country block a reasonable programme for a free consumer service with no payments of its own, or must we screen names? If screening, against which lists and with what data. (b) Is the app subject to the EAR at all (15 CFR 734.7, "published")? (c) If it is: the 5D992.c self-classification and any 740.17 reporting; whether License Exception CCD (740.19) covers Russia and Belarus; whether blocking sign-up is enough when US-storefront downloads are not gated by place. (d) Kherson and Zaporizhzhia: block them on the web page too? (e) On a match: is account data or a prepaid subscription "blocked property" needing a report within 10 business days (31 CFR 501.603), and is suspending without deleting right? (f) Is the Privacy 12 wording enough, and is a country derived in memory and not kept "collected" for the App Privacy label (we read it as not collected; label unchanged, CPrivO-2)?
- **Default.** Country block as D-131, no name screening, Privacy 12 as drafted, label unchanged. **Deadline.** Before the sign-up check is switched on, and before any sign-in outside the family (T22).

## 4. Questions carried from PR #81 (Q32 to Q40)

| # | #81 question | Status under option B | Default |
|---|---|---|---|
| Q32 | Is a separate consumer health data policy needed? | **Live, and the main health question.** We now hold letters that may mention health and due dates that show a pregnancy. The founder removed the separate notice pending this answer. Does Washington's MHMDA (RCW 19.373.020, U) require a separate policy with its own homepage and app-store link, or is Privacy 9 enough? Nevada and Connecticut likewise | No separate notice; Privacy 9. If counsel says it is required, restore the notice from git history and add the links |
| Q33 | Is "we do not receive your letters" accurate? | Closed by option B; see Q43 | n/a |
| Q34 | Website email list: CAN-SPAM postal address, consent record, CalOPPA, GDPR for EEA or UK visitors | Live. Are the "it is ready" emails commercial, so that every one needs the postal address? | Postal address in every footer once supplied; no EEA targeting |
| Q35 | Custom licence or Apple's Standard EULA? | Live (old Q18). Terms 18 keeps Apple's minimum terms, so either works | Custom licence from the Terms; a forwarding phone number |
| Q36 | Individual publisher | Merged into Q47 | Mailing address service |
| Q37 | Subscription terms with Apple as merchant | **Restated: the form.** A one-page Subscription Terms linked above Apple's view and from Settings, Plan, plus Terms 8. Is a separate page right, and must the 2-letter allowance sit beside Apple's price? Notices are Q41 | Separate page and Terms 8 |
| Q38 | Usage reports | Closed for v1.0 by D-095; returns in v1.1 with Q6 and Q7 | n/a |
| Q39 | $50 floor, courts, California law | Live. With recordings on our servers, is the cap acceptable for loss of backed-up recordings? | As drafted (Terms 14, 16) |
| Q40 | Narrowed free promises | Restated for Terms 4.1.0. Terms 8.3 ("Past letters are never put behind a payment") and the list in 8.2 cannot be changed for existing users. Is that the right line? Notes carried from the 4.0.0 Terms (31 Oct 2026, D-082): the 8.2 list is keeping the first 2 letters, reading every kept letter and playing its recordings, and exporting everything. Unlimited writing and co-parent writing left the permanent list, because under D-082 a third kept letter needs Plus; the founder decides whether co-parent writing belongs on it (old Q14). Read together and starting a book for each child are free today but stated in 8.4, not in the permanent list. "Two" is a floor: a later decision may raise the allowance, never lower it. "Stays fully usable" became "stays readable", since without Plus a book cannot take a third kept letter. The promise is binding and advertised, and 8.3 makes it non-amendable for existing users, which limits later options; confirm "as long as we operate the Service" as the outer limit and how it binds a buyer of the business (Terms 19). Who Plus covers is settled (8.14: the holder, and a co-parent through Family Sharing or their own plan). | As drafted |

## 5. Questions carried from 1.0.0 (Q1 to Q31)

Full text is in this file's 1.0.0 version (git history). Only the change is shown.

| # | Title | Status |
|---|---|---|
| Q1 | Individual publisher, 5.1.1(ix) | Live; see Q47 (5.1.1(ix) re-read 15 Oct, V) |
| Q2 | MHMDA and Connecticut consent | Live; see Q48 |
| Q3 | Health policy content and homepage links | Folded into Q32 |
| Q4 | COPPA | See Q45 |
| Q5 | Age assurance | See Q46 |
| Q6, Q7 | Analytics language code; label linkage | Deferred to v1.1 (D-095); v1.0 label questions are Q54 |
| Q8 | Subscription notices with no server | Superseded by Q41 |
| Q9 | Speech model training-data terms | Live, unchanged |
| Q10 | Trademark | Live, unchanged |
| Q11 | Processor contracts | Live: Supabase (main and recovery projects; will hold encrypted audio), Cloudflare R2 (app settings, language and speech files, after #126), Resend (sign-in, deletion and backup emails; billing emails if built), Vercel; PostHog not in v1.0. Hugging Face is an independent host |
| Q12 | IP and a language file name at download hosts | Live |
| Q13 | Deletion clock and the email provider's copy | See Q51 |
| Q14 | "Free, always" | Superseded by Q40. Note from develop 1.2.0 (31 Oct 2026, Terms 4.0.0): under D-082 the Terms 13.1 list became keeping the first two letters, reading every kept letter and playing its recordings, and exporting everything; unlimited writing and co-parent writing left the permanent list, for the founder to decide |
| Q15 | Liability cap | See Q39 |
| Q16 | Binding promises | Live; adds "we never listen to your recordings" (Q42 e) |
| Q17 | "Your recordings stay on this phone" | Closed: the microphone string drops it (label 1.4.0 section 5) |
| Q18 | Arbitration, licence, phone | See Q35 |
| Q19 | Pre-account local use | Live, unchanged |
| Q20 | CCPA, CalOPPA, other states | Live; Privacy 10 now gives a short California paragraph instead of the category table. Is that a sufficient notice at collection? |
| Q21 | Staff access, transparency report | Live; the drafts no longer promise a transparency report. Should they? |
| Q22 | Launch geography | Live (US only) |
| Q23 | Security review findings | Live; H1 and H3 are in the gate before any outside sign-in (T16) |
| Q24 | Export classification | See Q55 |
| Q25 | Support resources row | Live, unchanged |
| Q26 | Retention marked "proposed" | See Q51 |
| Q27 | CSAM, legal process, custody, DMCA | See Q50 |
| Q28 | Breach readiness, HBNR | Live; backup adds audio and the escrow key to the incident scope (Q42 b) |
| Q29 | Shared-book deletion; fiduciaries | See Q49 |
| Q30 | Later features | Live |
| Q31 | Draft text for TestFlight testers | See Q44 |

## 6. Not counsel questions, but they block the first outside family or submission

1. **Founder facts.** The published drafts carry bracketed blanks: [legal name], [mailing address], [county], [effective date], [phone number] (the last only if a custom licence is used). Also needed: the Subscription Terms URL, an archive URL for past versions, each provider's privacy contact (for requests under Washington law), and the support mailbox provider.
2. **Services the code uses (checked 16 Oct 2026).** Supabase and Resend: in the code on develop. Cloudflare R2: in #126 (`packs.earlyletters.app` for the signed remote config, pack manifest, content bundle and self-hosted speech files), not yet on develop; the drafts name it for exactly that, and this branch merges after #126. Recording backup: in the private Supabase Storage bucket `entry-audio` on `feat/backup-server`, not R2, so the texts say backups are stored with Supabase. Hugging Face: speech model files still download from it, so the texts name it. Sign in with Google: shown only when the build sets `EXPO_PUBLIC_GOOGLE_*` client IDs; the texts leave it out, so a build that sets them needs one added line. PostHog: the SDK is in `package.json` but never constructed while `EXPO_PUBLIC_ANALYTICS` is off. Website analytics: none. On `main` (0a5a222) `WebAnalytics` is not mounted in the root layout; Vercel production has only `RESEND_API_KEY`, `RESEND_SEGMENT_ID` and `UNSUBSCRIBE_SECRET` (checked by name by the coordinator, 15 Oct), so `NEXT_PUBLIC_ANALYTICS` is not set; and the live Content-Security-Policy is `connect-src 'self'`, which would block it. No analytics line is needed. `apps/web/test/legal.test.ts` on `main` fails if the layout ever mounts it, and `apps/web/e2e/http.e2e.ts` checks `connect-src 'self'`.
3. **The build switch.** Every `eas.json` profile still sets `EXPO_PUBLIC_SERVER_FEATURES` off. These texts describe the switch-on build and must not be published for a build that has it off.
4. **The R-17 gate** (BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322, BL-349) before anyone outside the family signs in (T16).
5. **Strings that contradict the drafts** (in-app disclosures 3.4.0 section 3, requests to S16).
6. **Website.** The site renders `docs/legal` from `main`. Per the comment in `apps/mobile/test/privacy-documents.test.ts` (not checked on `main` here), #169 took `/health-privacy`, `/subprocessors` and `/delete-account` off the website and moved their content into `/privacy`. Before develop is next merged into main, confirm the website loader no longer reads the removed `consumer-health-data-notice.md`, and that the deletion text of `delete-account-page.md` is in the page `/privacy` serves. `/subscription-terms` is still to be added.
7. **Vendor and operations facts in the drafts, not code.** The deletion clock (live systems 31 days, backups 38, providers 45, the email provider's 30-day copy), the quarterly seal check and the two paper copies, two-factor access for the founder, 10 business days to answer a deletion email and 2 years for support email. The founder confirms each; BENCHMARK marks the vendor pages unverified.
8. **S17 follow-ups:** `data-policy.md`, `DATA_CLASSIFICATION.md` outside 4.3.1, `DELETION_AND_EXPORT_SPEC.md`.
9. **The Privacy Policy's build list (added 20 Nov 2026).** `privacy-policy.md:21` says the first App Store build has servers off. `app-store-privacy-labels.md:84` says the first store build, Build 12, has servers on with sign-in required (D-157, D-160). The founder corrects the build list before any servers-on store build links the policy. Q108 depends on it.
10. **Two defects that hold the Build 13 cut (plan #847 Q1 default) and touch what we tell people.** (a) NS-10-R3: on a phone that holds account A's book, account B signs in and sees that book. The gate opens the local book for any session (`apps/mobile/src/lib/first-run/gate.logic.ts:123-125`), and sync only refuses to upload (`apps/mobile/src/lib/sync/ownership.ts:49`). That contradicts the Q43 line "Your book is shared only with the co-parent you invite". The fix is BL-961. (b) NS-10-R7: if an answer is lost and the person retries, the consent step writes a second acceptance row, because each call mints a new key (`apps/mobile/src/lib/auth/consent.ts:117`). The fix is BL-978. Engineering fixes both; neither is a question for counsel.
11. **The invitation text (added 20 Nov 2026).** `privacy-policy.md:90` says an invitation "names the parent who sent it". The message the app composes also names the child (`apps/mobile/src/lib/family/share-text.ts:8`). Co-parent sharing is alpha-only (D-162), so the founder fixes the sentence before NS-25 reaches a store build.
12. **Founder decisions from the privacy design that are not for counsel.** Pictures in the iPhone backup (CR-62 item 7; default yes). The owner backup and pictures (ADR 0028 Q4; default no; needed by the Build 13 freeze). Merge BL-868 before the photo export (CR-62 item 3). The X2 scope (default: our sending features, not the parent's own export). One inventory PR per wave. Each has a default in force.

## 7. Questions from the locked new-scope pack (20 Nov 2026; BL-949)

**Where these come from.**
- **The cards** are the requirements the founder approved on 19 Nov ("I approve all requirements."), locked on 20 Nov. They live in `docs/product/prd/` on branch `docs/prd-lock-v1-20nov` at `450bcb4a` (PR #846) and are cited by NS id, row or section. The council record lists four questions "not fully closed" (`15-council-review.md`): sibling voice, version retention, plan-notice windows and typed-day retention. BL-949 adds a fifth and a sixth: a typed name syncing with a letter, and how long the founder keeps testers' numbers.
- **The engineering designs** of 20 Nov raised the rest. They are not yet in the repo; the target is `docs/tdd/new-scope/`. They are cited by file and section, for example "privacy 6" or "security 8".
- **The plan** is #847 (`17-engineering-project-plan.md` on `docs/engineering-project-plan-20nov` at `94603780`).
- **Code facts** were read on `develop` at `20553b18`, 20 Nov 2026.

**What the reviewers are asked (counsel, read as the exec-team review under D-172).** Each question gives the facts, the questions, the default the product follows until counsel answers, what changes if counsel says no, and what it blocks. Where a card and a design disagree, the card wins, and the entry says so.

**How the numbers work.** A topic that already has a 1.5.0 number keeps it, and its new parts continue its letters. Where a 1.5.0 question has unlettered parts, they count as (a), (b) and so on in the order written. For example, Q46's parts are old Q5, the stored age signal and AB 1043 for earlier installs, so its new part is (d). The two new questions take Q107 and Q108. The numbers in between were claimed by drafts: Q58 to Q74 by #598 and Q75 to Q77 by BL-780. Q78 to Q106 were reserved for a closed draft (#760, closed under CR-211 on 24 Nov 2026; kept on its branch) and are retired, not reused. A search of every remote branch on 20 Nov found no Q107 or higher.

**"Q6" means two things.** In the seal designs and in #847 Q3, "Q6" is ADR 0028's Q6 (`docs/adr/0028-photo-seal-find-on-device-data.md:254`), not this packet's Q6 (deferred analytics). The counsel part of ADR 0028 Q6 is Q107 and Q50(e) below. Whether to build the sealed letter is the founder's decision (#847 Q3).

**How "blocks" is read.**
- **Build 13** is the Build 13 store candidate under the #847 Q1 and Q2 defaults: servers on, the keeping rows in, photo and Find merged with their flags off in `production`.
- **"Flag"** means an `EXPO_PUBLIC_*` flag turning on in `production`.

No Build 13 flag waits on counsel. The Build 13 store candidate waits on Q41, as in 1.5.0, and on Q108(a).

### 7.1 Index

| Q | 1.7.0 | Cards | Raised by | Blocks Build 13 | Gates later |
|---|---|---|---|---|---|
| Q32 | merged | NS-06A, NS-12, NS-13, NS-18, NS-25 | privacy OQ-C10; 08-keeping 6; data-and-sync OQ-C1 | No | NS-06A, NS-12, NS-25 store build |
| Q40 | merged | NS-24; frame 7 | 10-reading 7; council T1, T2 | No | Any public NS-24 line |
| Q41 | merged | NS-32, NS-13, NS-18 | council "not fully closed"; BL-949 item 4; 11-foundations NS-32 | Store candidate (as 1.5.0) | BL-966 store build |
| Q43 | merged | NS-01, NS-05, NS-06B, NS-08, NS-10, NS-11, NS-32 | privacy OQ-C7, OQ-F4; security OQ-S6; 08-keeping OQ-4 | No; lines stay absent until read | Photo flag (Build 14), NS-05, NS-06B, NS-08-R8, NS-11 |
| Q44 | merged | NS-03; frame 3; NS-10 | NS-03 R1; security 3.5 | No | First pilot contact |
| Q45 | merged | NS-16, NS-05, NS-03, NS-08, NS-28, NS-01 | BL-949 item 1; privacy OQ-C1, OQ-F5; security OQ-S4, OQ-S5; 09-capture 11; 10-reading 7; data-and-sync OQ-C1 | No | Share flag outside the founder's family, Arm V, NS-16 flag, NS-08 flip |
| Q46 | merged | NS-16 | 09-capture 11 | No | NS-16 flag |
| Q48 | merged | NS-16, NS-01, NS-05, NS-06A, NS-12, NS-25 | BL-949 item 2; privacy OQ-C2, OQ-C4; 09-capture 11; 10-reading 7; data-and-sync OQ-C1 | No | NS-16 flag, NS-25 store build, NS-06A, NS-12 |
| Q49 | merged | NS-25, NS-06B | privacy OQ-C8; data-and-sync OQ-C1 | No | NS-06B, NS-25 store build |
| Q50 | merged | NS-06B, NS-25 | security OQ-S6, OQ-S8; privacy OQ-C8; 10-reading 7 | No | NS-06B, NS-25 store build |
| Q51 | merged | NS-12, NS-18, frame 3, NS-03, NS-09, NS-08 | BL-949 items 3, 5, 6; privacy OQ-C6, OQ-F7; security OQ-S7; 08-keeping OQ-7, OQ-DS4; 09-capture 11 | No | NS-12, NS-18, pilot start |
| Q54 | merged | NS-16, NS-06B, NS-01, NS-25, NS-26, NS-08 | BL-949 item 2; privacy OQ-C3, OQ-C5; data-and-sync OQ-C1; CR-62 item 2 | No (label unchanged) | NS-16 flag, NS-06B, photo flag |
| Q107 | new | NS-06B | NS-06 B17; privacy OQ-C9; 10-reading 7; data-and-sync OQ-C1; CR-62 item 1 | No | NS-06B |
| Q108 | new | NS-12, NS-36 | privacy F-3, OQ-F9, P-5; security 3.7; 08-keeping 6 | Store candidate, part (a) | NS-12 |

Twelve more questions are cited by the cards but need no new text. They are listed in 7.16.

### 7.2 Q32 (merged). Health details in new places
- **Facts.** Q32's default stands: there is no separate health notice, and Privacy 9 covers health details. The new places a health detail can sit:
  - an earlier version of a letter, kept on our server today; once NS-12 ships, only its author sees it (Q108);
  - a Firsts label ("a first can be a health fact", NS-06 B17), which syncs with the letter and reaches the co-parent;
  - the words of a typed reminder day, such as "baby due" (NS-18 section 5), which stay on the phone;
  - the NS-25 invite sheet, which tells the inviting parent that earlier letters, a due date among them, become visible to the second parent (NS-25-R16).

  Our own notification wording never names a due date (NS-13 section 17; NS-18 section 6).
- **(b)** Does any of these places change the Q32 answer?
- **Default.** Each is letter content or the parent's own words, class L4, covered by Privacy 9.
- **If no.** The separate notice returns from git history (Q32 default) and names these places. NS-06A and NS-12 wait for it.

### 7.3 Q40 (merged). Read the year back, and free features with no public promise
- **Facts.**
  - Ruling T1 (`16-council-review-round-2.md` section 3): Read together, and Read the year back (NS-24), have no session limit and no Plus gate. Public copy may say "Read together is free" only in the form the current listing uses, with no "forever" and no "never limited".
  - Ruling T2: every capability that ships free in 1.0.x stays free (principle 6). Public copy says nothing either way.
  - The closing paragraph of Terms 8.2 says Read together does not need Plus today, but it is not on the 8.2 list itself (`terms-of-service.md:100-105`). T1 and NS-24 cite this as "Terms 8.4"; that is a slip, because 8.4 is "What Plus is".
- **(d)** May NS-24 copy say it is free in the T1 form without joining the 8.2 list?
- **(e)** Does an internal rule that is never published (T2) bind us in any way?
- **Default.** No public line for NS-24 beyond the current listing.
- **If no.** NS-24 copy says nothing about price.

### 7.4 Q41 (merged). Plan notices under the one notification budget (NS-32)
- **Facts.**
  - **The windows are data** in `apps/mobile/src/lib/billing/plan-reminders.logic.ts:65-76`. Each is measured back from the trial or period end:
    - a trial over 31 days: 21 to 16 days before;
    - a shorter trial: 8 to 5 days before;
    - every trial that will convert: 5 to 4 days before;
    - an annual plan that will renew: 31 to 30 days before, and again 8 to 6 days before;
    - a yearly notice on each anniversary of the first purchase, for monthly plans too (lines 28 to 31).
  - **How they fire.** At most 4 are pending (`:48`). Each fires at 10:00 local time when its window allows, never in quiet hours. A missed window is skipped, never sent late (`:23-27`). Only the purchaser's phones get them, and none fire once auto-renew is off (`:17-22`).
  - **The budget (NS-32 section 3).** Plan notices sit outside the one-a-day budget, ranked first, so a day can bring 2 notifications. Every class, plan notices included, uses the interruption level `active`, never `time-sensitive`. Focus and Scheduled Summary can therefore hold them (NS-32 section 5).
  - **When nothing shows.** If notifications are off in iOS Settings, nothing is scheduled, and Settings, Plan shows the date. "Show Previews" is the person's setting (`16-council-review-round-2.md` section 6, Apple pages read 20 Nov).
- **(j)** Do these windows match each state's timing rule, as read in the Q-003 memo, section 5?
- **(k)** Is a local notice enough when iOS may hold it in a Focus or a Scheduled Summary, or never show it because notifications are off? Or must plan notices be `time-sensitive`, or reach the buyer another way?
- **(l)** May a missed window be skipped, or must a late notice go out?
- **Default.** Windows as built, level `active`, missed windows skipped, plan notices outside the budget.
- **If no.**
  - (j): the window data changes in one file, with its tests.
  - (k): `time-sensitive` needs its own entitlement (U), and the 09-capture design adds a preflight check that refuses it (09-capture 1.5), so the change would also need a `security-architect` read. A second route would be the emails of D-080 and D-081, which are not built and are not sent from the first store build (D-121).
  - (l): a late-notice rule in the same file.
- **Blocks.** The store candidate, as Q41 already does (priority A). The NS-32 code (BL-966) does not wait for the answer (11-foundations NS-32).

### 7.5 Q43 (merged). New lines that make a claim
- **Facts.** Each line below is written by `content` as a PROPOSED key and sent to counsel with its rendered text.
  - **Pictures.** "Pictures stay on this phone" and the account-deletion text for pictures (NS-01-R31, R32). Pictures sit in the iPhone backup, and no line says so yet (CR-62 items 4 and 7; `privacy-policy.md:37` names recordings only).
  - **The sealed letter (NS-06 B12, B16).** "Hidden, not locked" and the honest limits. We could read a sealed letter, because letters are not end-to-end encrypted (`privacy-policy.md:55`). An author west of the sealing zone sees the letter open on the evening before the shown day (CR-62 item 5).
  - **Sharing and copies.** NS-05's line on where a shared letter goes. NS-11's "as private as where you put it".
  - **Recordings and backup.** The NS-08-R8 keep-safe line naming iCloud Backup. The backup claims rule allows only "your iPhone's own backup", so the line fails that rule today (`packages/content/test/claims-capabilities.test.ts:206-211`; 08-keeping K6). The NS-10-R13 recording sentence is held back as "counsel-read" (`packages/content/src/features/auth.en.ts:145-147`).
  - **Reminders.** NS-32's "Gentle reminders, at most one a day" (NS-32 section 19).
  - **A defect against a 1.5.0 line.** "Your book is shared only with the co-parent you invite" does not hold today when a second account signs in on a phone that holds the first account's book. The Build 13 cut waits for that fix (section 6 item 10).
- **(c)** Please read each line before its feature is on.
- **(d)** May the NS-08-R8 line name iCloud Backup as a real copy, without implying that a recording cannot be lost?
- **(e)** Is "hidden, not locked", with the evening-before sentence, enough for a letter we could read?
- **Default.** Each line stays absent until counsel has read it (08-keeping OQ-4: the new phone shows only `arrivedPlain`, and there is no R8 line). Picture lines land with the photo flag.
- **If no.** The line stays absent, or counsel's words replace it.

### 7.6 Q44 (merged). People outside the app: pilot parents and testers
- **Facts.**
  - **The pilot (NS-03).** No parent is contacted before a dated counsel read of the consent text and the scripts is on record (NS-03-R1). The parent's recording arm, Arm V, also needs the voice read in Q45(d) (NS-03-R2). The texts come with BL-935, not this packet. #847 puts counsel's read at Fri 27 Nov.
  - **Testers.** They type numbers into their own messages, and the app composes nothing (frame section 3, ruling D5).
- **(c)** Does the pilot consent, in both versions (each with its own hash), say what a study run by message needs, when nothing from the study reaches the app or our servers?
- **(d)** Does a tester's hand-sent message need any notice beyond the fixed question wording?
- **Default.** No pilot arm starts before the read (NS-03 section 5). Tester numbers are handled as D5 sets out.
- **If no.** The pilot texts change before any contact. Nothing changes in the app.

### 7.7 Q45 (merged). A child's voice or picture
- **Facts.**
  - **The X2 rule.** A child's voice or picture that leaves the phone through one of our features needs a security read and a counsel read first (frame section 7). NS-05's own section 3 names only Q45; the frame and the designs require both reads (security K-1), and the frame is followed.
  - **No feature asks a child to speak.** The NS-16 strings are scanned to prove it (NS-16-R5).
  - **NS-16, someone else speaks.** The parent types the speaker's name: 1 to 30 characters, written once (`supabase/migrations/20261002020000_data_governance.sql:95`; `packages/api/src/server/sync.ts:157`). The words sync as the account holder's letter. The recording stays on the phone until a backup flip.
  - **NS-05 Level 1, share a letter.** The parent's own share sheet sends the stored copy of the picture, with its metadata stripped, and we receive nothing. The security read lists conditions P1 to P4 (security 3.3).
  - **NS-03 Arm V.** The parent sends one recording from Export to a relative, and the team never receives it. The security read lists conditions V1 to V4 (security 3.5).
  - **The rule.** 16 CFR 312 (https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312), U: not opened 20 Nov, because the host was blocked in this session.
- **(b)** A sibling or another child may speak a letter on the parent's phone, signed with a typed name. Does that change the 1.5.0 reading that COPPA does not apply? Nothing invites a child, and the letter is the parent's.
- **(c)** A picture of the child may leave through the parent's own share sheet (NS-05 Level 1; NS-03 Arm W once its file shows a picture). Is "the same as Export: the parent's own act, and nothing reaches our servers" right?
- **(d)** Are the voice lines of the Arm V consent and instruction enough, including the residual risks: the relative's messaging provider keeps a copy, and a forward cannot be undone?
- **(e)** NS-05 Level 3 and NS-28 would host copies; no build is planned. What would counsel need to see before any design?
- **Default.**
  - (b): `EXPO_PUBLIC_SIGN_AS_OTHER` stays off in `production` until (b), Q46(d) and Q48(d) are answered.
  - (c): Level 1 ships text only, and the picture PR is held.
  - (d): the pilot runs Arm W only.
  - (e): nothing is hosted.
- **If no.** NS-16 stays off in store builds, Level 1 stays text only, there is no Arm V, and NS-28 stays parked.

### 7.8 Q46 (merged). A speaker whose age we cannot know
- **Facts.** The account holder confirms they are 18 or older (`privacy-policy.md:33`). NS-16 lets anyone the parent hands the phone to speak a letter. The speaker gives no age and makes no attestation, and nothing about them is recorded (ruling D9; NS-16-R18).
- **(d)** Does the 18-and-over rule, or the AB 1043 age signal in Q46, reach a speaker who has no account?
- **Default.** Nothing is asked of the speaker. The NS-16 flag stays off in `production`.
- **If no.** NS-16 stays off.

### 7.9 Q48 (merged). Other adults in a letter, and the second parent
- **Facts.**
  - **The speaker's name.** It is stored in `entries.author_signs_as`, class L3. The co-parent sees it through `book_entries` (`data_governance.sql:210`), and the export carries it as `author.signs_as`. It is never logged and never searched (NS-16-R8). A list of up to 20 names used before stays on the phone and is cleared at sign-out (NS-16-R15).
  - **The Review line.** "Ask before you record someone else" (intent) is an instruction, not an attestation, and no record is kept (ruling D9).
  - **The speaker has no account with us.** We never delete, edit or hide another author's letter on someone else's request (DSR-R04, `docs/engineering/08-data-rights-and-legal-requests.md:35`).
  - **Backup.** At a backup flip, another adult's voice reaches our server (Q42(c)).
  - **Pictures of other adults.** #760 Q84 (open draft) asks this for pictures.
  - **Co-parent sharing.** It stays alpha-only (D-162, `docs/DECISIONS.md:669`).
- **(d)** Is the instruction line, with no record, enough when the account holder records another adult's voice and words and types their name? The name syncs, and the co-parent sees it.
- **(e)** Suppose that adult asks us to delete their words, voice or name. Is it enough to forward the request to the account holder and change nothing?
- **(f)** Does a right to delete reach part of a letter, such as an earlier version (Q108) or a sentence about someone else?
- **(g)** Does the NS-25 invite sheet's notice that earlier letters, a due date among them, become visible (NS-25-R16) meet the consent content asked in (c)?
- **Default.**
  - (d): NS-16 stays off in `production`.
  - (e): we forward the request and change nothing.
  - (f): the author can remove a version (ruling D8) or edit the letter. No one else can delete it; a co-parent can only set a family letter aside from the book (DSR-R04).
  - (g): one consent that names the co-parent, alpha only.
- **If no.**
  - (d): NS-16 stays off, or gains what counsel names.
  - (e): a counsel-led support runbook.
  - (f): a removal path, still to be designed.
  - (g): the separate sharing consent, which is built and switched off.

### 7.10 Q49 (merged). Fiduciary access to sealed letters
- **Facts.** A sealed letter is hidden from every reader except its author until its day (ADR 0028 D3a, CR-62). If the account is deleted before the letter opens, the letter is deleted with it (ruling D6). The Terms have no fiduciary clause (Q49).
- **(d)** If an executor or guardian receives the one export that Q49 proposes, does it include letters sealed until a later day?
- **Default.** As NS-06 B12 and B17: only the author's own export carries a sealed letter, and the runbook comes before C1.
- **If no.** The runbook says what is released.

### 7.11 Q50 (merged). A letter hidden from the other parent, and removing a parent
- **Facts.**
  - **Who can read a sealed letter.** The seal columns are the author's only, class L4. The server's clock decides when the letter opens. Someone with server access could read the words (security 3.6).
  - **What the card says.** NS-06 B17: an author may hide a letter from the other parent unless counsel's Q50 answer says otherwise. The plan and ADR 0028 (CR-62 item 1) say no seal code is written until counsel answers (#847 Q3). The card wins on scope; the plan sets the order.
  - **Removing a parent.** Ruling D11: the Terms' 72-hour undo is the only removal until Q53 is answered.
- **(e)** May an author hide a letter from the other parent until a day? What must happen to it under a custody order or a subpoena before that day?
- **(f)** Is the 72-hour undo enough for a parent who is in danger, or must support be able to remove a parent on evidence (Terms 4.4)?
- **Default.** (e) as NS-06 B12 and B17. (f) ruling D11.
- **If no.** (e) the other parent can see a sealed letter, or the seal is not built. (f) a counsel-led removal runbook and a server path.

### 7.12 Q51 (merged). Retention clocks the new scope sets

| Data | Where | Clock (default) | Source |
|---|---|---|---|
| Earlier versions (`entry_versions`) | Server | Written by a trigger on every change to the words, the in-book flag or the fixes (`supabase/migrations/20261002020000_data_governance.sql:175-185`). Kept for the life of the letter: deleted when the letter is purged (`on delete cascade`, `20260930000000_scribe_core.sql:157`). Once NS-12 ships, the author can remove one (D8); it is deleted at once and leaves backups on the 38-day clock | NS-12-R6, R7 |
| Removing a version under a legal hold | Server | Refused with a plain line, as the purge is (`20261023020000_purge_legal_holds.sql`) | security 3.7, OQ-S7 |
| Typed days (NS-18) | Phone settings and the iOS pending list | Deleted the day after delivery, at sign-out and by Erase everything. Never synced. Not exported (card default) | NS-18 sections 11, 23 |
| Testers' hand-sent numbers | Founder's private sheet | 90 days after the round | Ruling D5, frame section 3 |
| Pilot notes and contacts; consent records | Founder's private store | Notes 30 days after the read-out (2 working days after a withdrawal); consent records 12 months | Ruling D4; NS-03-R4, R5 |
| A let-go draft held on the server | Server | Purged when the discard is acknowledged (D7). Kept if its words changed on another phone, or under a legal hold (`20261016000000_sync_v1_server.sql:782-784`); the draft then comes back as one the parent can keep | 08-keeping K2, OQ-7 |

- **Conflict.** The privacy design says a removed version leaves backups "7 days later" (its section 4 row and OQ-C6), but its own section 1.4 says 38 days. The published clock (Privacy 7: 38 days) is the default.
- **(d)** May earlier versions be kept for the life of the letter until the author removes them, or do they need a clock?
- **(e)** May we refuse to remove a version while a legal hold covers the account?
- **(f)** Must the export, which Terms 8.2 says covers "everything", carry typed days, a setting that stays on the phone?
- **(g)** Are the tester and pilot clocks acceptable?
- **(h)** May the promise behind "Let it go" stand with the two server exceptions, or must they be stated?
- **Default.** As the table.
- **If no.** Each clock is one constant or one runbook line. Typed days would join an export minor.

### 7.13 Q54 (merged). App Privacy answers for the new scope
- **Facts.**
  - **Name and Other User Content** are already declared as collected and linked (`docs/legal/app-store-privacy-labels.md:45, 57`).
  - **Photos or Videos** is "No" (`:54`). That stays true only while pictures never leave the phone (NS-01-R15, R26, R61). The picture label read is BL-841 and #760 Q79.
  - **The seal clock.** `seal_opens_at` is local midnight in the sealing zone, stored in UTC, so it states that zone's UTC offset exactly. It is the author's only, class L4 (CR-62 item 2).
  - **One build.** The label and the privacy manifest change in the same build as the behaviour (PRIV-R18).
- **(f)** Is the typed name of someone who is not a user, synced with a letter, a new Contact Info row, or only a change to the "Why" text? The card says the label "possibly" changes. The privacy design reads it as no change (privacy P-6). The card's default holds: the flag stays off until counsel answers.
- **(g)** Is a stored UTC offset of the sealing zone Coarse Location? Q20 covers state law.
- **Default.** (f) no answer changes, the "Why" text gains the typed name, and the NS-16 flag stays off. (g) not a Location row, and the seal is never described to counsel or in copy as location-free.
- **If no.** (f) the row changes in the NS-16 build. (g) a Location row in the seal build, or an ADR change to store only the day.

### 7.14 Q107 (new). A letter kept for a day, and the child who may read it later
- **Facts.**
  - **How the seal works.** The author picks a day, from tomorrow to the child's 25th birthday (NS-06-B11; founder default OQ-B3). The letter is hidden from every reader but the author, the other parent included, until local midnight of that day in the zone where it was sealed (ADR 0028 D3a). "Open now" ends the seal early and cannot be undone.
  - **Nothing is delivered.** There is no child account and no feature for a child (frame section 7). If the account is deleted first, the letter goes with it (D6).
  - **Banned words.** "for when they turn 18", "delivered to your child", "time capsule", "locked" and "secure" (NS-06 B16, B18).
  - **Whether to build it** is the founder's decision (#847 Q3). Its default is in scope, with no seal code until counsel answers.
- **(a)** Does a seal day tied to the child's age (for example 18) create any duty to the child, such as delivery, notice or access, especially if the parent dies or deletes the account first (see Q49(d))?
- **(b)** May copy ever name an age, as in "open at 18", and in what words?
- **(c)** Does offering a day up to 25 years ahead create any duty to keep the service or the letter that long, beside the 90-day shutdown pledge (Q16)?
- **Default.** Ordinary dates only, no age wording, nothing delivered, and no seal code until counsel answers.
- **If no.** (a) the seal is not built, or is limited as counsel says. (b) counsel's words. (c) a nearer latest day, or a stated limit.
- **Blocks.** NS-06 Part B (wave 5).

### 7.15 Q108 (new). Earlier versions on our server today
- **Facts.**
  - **What is kept.** On every change, a trigger keeps the old words, the in-book flag and the fixes as a row in `entry_versions`, with the id of whoever made the change (`supabase/migrations/20261002020000_data_governance.sql:175-185`).
  - **Who can read it.** No client role has had a grant on that table since 23 Oct (`20261023060000_explicit_grants.sql:49-51`). No screen and no export reads it; the founder could, through the dashboard (Privacy 3).
  - **What the policy says.** Privacy 2 lists "the words you speak or type, the original transcript, each small fix the app made, and the final text" (`privacy-policy.md:35`), with no earlier versions.
  - **What the export carries.** Phone conflict copies (`data/other-versions.json`), but no server versions. The spec says the export carries "every entry_versions row" (`DELETION_AND_EXPORT_SPEC.md:337`).
  - **Where the gap is live.** Servers are on in the store build (`app-store-privacy-labels.md:84`).
- **(a)** Must Privacy 2 and 7 name earlier versions now? Is adding them a clarification of an existing practice (POLICY_VERSIONING 2.2) or a material change (2.1)?
- **(b)** Does a request to see or export (Privacy 10) reach earlier versions, which no export carries today? The California access right is Cal. Civ. Code 1798.110 (https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.110), U: not opened 20 Nov, because the host was blocked in this session.
- **(c)** When NS-12 ships, must the author's own export include them?
- **Default.**
  - (a): the founder names them in the next policy PR, as a minor change (privacy OQ-F9).
  - (b): no rule is written. The founder decides with `privacy`.
  - (c): not exported. That is the card's default (NS-12 section 23), and the card wins. The privacy design rules the other way (P-5), so the spec line goes to the founder.
- **If no.** (a) the line ships as a major change, with notice. (b) a server-side export path. (c) an export minor that adds `history/`.
- **Blocks.** Part (a) blocks the Build 13 store candidate, because it is in the policy that a servers-on store build links. Parts (b) and (c) gate NS-12.

### 7.16 Cited by the cards, no new text

| Q | Now also gates | Source |
|---|---|---|
| Q9, Q12 | NS-17, for each language added | NS-17 section 17; 09-capture 11 |
| Q11, Q47 | NS-07 printable book, NS-30 print sale | NS-07 section 4.17 |
| Q16 | The four open-ended promises (frame section 7) | Frame section 7 |
| Q19 | NS-10 | NS-10 section 17 |
| Q20 | NS-06B, with Q54(g) | NS-06 B17 |
| Q22 | NS-03 relatives abroad | NS-03 section 1 |
| Q28, Q55 | The NS-08 flip | NS-08 section 17 |
| Q42 | The NS-08 flip; NS-16 (another adult's voice, (c)); NS-28 | NS-08, NS-16, NS-28 |
| Q53 | NS-25 store build (D11 until answered; with Q50(f)) | NS-25 section 17; security OQ-S8 |

Questions not for counsel are in section 6, items 9 to 12. The closed #760 draft asked about typed occasions and the wording of local reminders for the Memory Library (its Q103 to Q105). Those topics now sit in Q109 (a ticked or typed day on the phone), Q112 (a local day note, with a parent's typed day in (d)), Q124 (picture-timed reminders) and Q51(f) (typed days and the export). NS-18 raises the same facts, so counsel can answer them together.

## 8. Questions from the days, cultural background and media cards (20 Nov 2026)

**Where these come from.**
- **Cards.** `docs/product/prd/21-days-cultural-photos-home.md` (NS-46 days we mark, NS-47 cultural background, NS-48 notification catalogue, NS-49 picture suggestions, NS-50 Home today) and `docs/product/prd/27-photo-moments-and-media.md` (NS-51 photo moments, NS-52 pictures and videos), read on `develop` 9e4757459dc3, 20 Nov 2026. Function reviews: `functions/cultural-background-data.md` (CUL-Q5 to Q7, Q11, Q14), `functions/days-library.md` (FR-DAY-23, Q-DAY-10, Q-DAY-11), `functions/legal.md` (L-14 to L-19), `functions/compliance.md` (C-9 to C-11 and the second addendum).
- **Why these were stuck.** Each of those files said "needs a number from legal". CUL-Q11 was mapped to Q41, which is about plan notices (NS-32), not about a day note that names a faith day. The card 21 gate ("counsel answers CUL-Q5 to Q7 and Q11 before production; the flag stays off") could not close without numbers.
- **How the numbers work.** These are new questions, Q109 to Q122, because no existing number covers them. Where one extends an earlier question, it says so; counsel may answer them together. Q107 and Q108 are taken (section 7). Open drafts claim Q61 to Q74 (#598) and Q78 to Q106 (#760); nothing open claims Q109 or above (checked 20 Nov 2026).
- **The closed #760 draft.** Its Q103 to Q105 asked about the wording of local reminders for the Memory Library. That topic is carried by Q112 (a day note) and Q124 (picture-timed reminders). Counsel can answer them together.
- **"Deadline."** The cards give order and gates, never dates (ruling T5). So each question's deadline is the gate it blocks: the answer is needed before that flag turns on in `production`. No calendar date is invented here. The dated milestones of section 0 (T30, 23 Apr 2027) still apply to the packet as a whole.
- **Not legal advice.** Every reading below is an engineering reading; counsel must confirm. Facts are tagged V (read this session in a named file or page) or U (not read).

### 8.1 Index

| Q | Topic | Old id | Cards | Priority | Blocks (flag in `production`) |
|---|---|---|---|---|---|
| Q109 | Religion by inference from a day list kept on the phone | CUL-Q6, Q-DAY-11 | NS-47, NS-46 | C | NS-47 ask slip, tradition browse, tradition days, day-name switch (Drop C) |
| Q110 | The day list left out of Save a copy | CUL-Q5 | NS-47-R10 | C | Same; with Q55 |
| Q111 | The label answer and the Privacy Policy sentence for the day list | CUL-Q7 | NS-47-R23 | B | NS-47 Drop C items; in a Drop B candidate the label check is an internal G5 check and the card names no counsel read for it |
| Q112 | A local day note that names a faith day: Apple 4.5.4 and the licence agreement | CUL-Q11 | NS-46-R35, R36; NS-47-R12, R13; NS-48-R9 | B | Part (c) blocks the Drop B days release (card 21 names "the consent line read by counsel" as its gate); the rest blocks the day-name switch (Drop C) |
| Q113 | The right to use calendar and day source tables | FR-DAY-23, Q-DAY-10 | NS-46-R12, R23 | B | Any NS-46 row whose date is copied from a source |
| Q114 | Tradition-reviewer records | NS-46-R23, DL-8 | NS-46-R23 | C | Each tradition's rows (Drop C) |
| Q115 | Does a picture index plus a day list amount to inference | CUL-Q14 | NS-51-R6, R7 | C | NS-51 |
| Q116 | A child's picture or video leaving the phone on the parent's act | L-14 | NS-52, NS-51, NS-05 | C | NS-52 Variant B; any video through a door |
| Q117 | Biometric laws and a design that never matches | L-15 | NS-51-R33, NS-52-R29 | C | Nothing now; any matching feature |
| Q118 | Another adult's voice in a parent's video | L-16 | NS-52 | C | NS-52 video |
| Q119 | Library read on the phone only: "collection" and notice at collection | L-17 | NS-51 | C | NS-51 |
| Q120 | Terms, retention and deletion for hosted media | L-18 | NS-52 Variant B | C | NS-52 Variant B only |
| Q121 | A printed QR code to a hosted video page | L-19 | NS-52 print | C | Nothing; not built |
| Q122 | Apple's platform terms for the library read and the Journaling picker | C-9, C-10, C-11 | NS-49 level 2, NS-51 | C | NS-49 level 2, NS-51 |

### 8.2 Q109 (new). Religion by inference from a day list kept on the phone (CUL-Q6, Q-DAY-11)
- **Facts.**
  - **What is kept.** Only the days a parent ticks, and a date the parent moved, plus a content-free "asked" flag. The tradition and the country picked in the ask are a browse filter held in memory until the sheet closes (NS-47-R1, R2; `cultural-background-data.md` FR-CUL-02). V.
  - **Where.** A file in Application Support outside `scribe.db`, excluded from the iPhone backup, per account, cleared at sign-out; class L4. Never in analytics, logs, crash reports, a server table or Save a copy (NS-47-R4, R6, R8, R9, R10; ADR 0032). V (cards and ADR; no build exists).
  - **We receive nothing.** A network fake sees 0 requests carrying a day id, tradition or country (NS-47-R4). The App Store territory is the United States only (LEGAL-REQ-058, cited by `compliance.md` section 3c, G5). V for the citation.
  - **Inference.** A ticked day that belongs to one faith may reveal that faith. The CJEU held on 1 Aug 2022 (C-184/20) that data from which special-category information can be indirectly inferred are themselves special-category data under GDPR Article 9. U: I read only a commentary page (https://www.thomashelbing.com/en/wissen/dsgvo-hub/rechtsprechung/1.4.15-eugh-vyriausioji), not the judgment or Article 9. Whether C-184/20 reaches religion through a ticked day is for counsel.
  - **Earlier wording.** CUL-Q6 asked only whether Article 9 or a US state rule reaches device-only data. This question widens it, as below.
- **(a)** Is a list of ticked days that includes a faith day "data liable to reveal" religion under Article 9(1) as read after C-184/20, even when it is stored only on the user's phone?
- **(b)** If yes, is a maker that never receives the data a controller or a processor for it, or neither? Does the household exemption for the parent matter (U, not read)?
- **(c)** Does EU or UK law reach an app offered only in the US storefront, for example when the account holder is in the EU? Does the answer to (b) change that?
- **(d)** Which US state laws that name religious belief (or inferred religion) as sensitive data, if any, reach data the maker never receives? U: no state statute was read.
- **(e)** Is a tick an explicit consent act for Article 9(2)(a) and for the door lines of `docs/agents/COORDINATION.md` section 10 (PRIV-R21), or is it a choice that needs no record because nothing leaves the phone? The line before the first tick says the data stays on the phone and how to stop it (NS-46-R35, NS-47-R29).
- **Default.** Design as if the answer to (a) is yes: optional, explicit, withdrawable in one tap, never received, equal-weight "Not now". Until counsel answers, the ask slip, the tradition browse, tradition days and the day-name switch stay off in `production`; the plain browse-and-tick list (the CUL-Q8 fallback, no question about the family) is the only form.
- **If no.** (a) no extra duty beyond the design. If yes with duties on the maker: remove the tradition browse and the ask and keep seasonal, family and civic days only, or add the notice and basis counsel names. (c) EU wording and a territory statement as counsel says.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-47 ask slip, tradition browse, tradition days, day-name switch (Drop C). Does not block Build 13.

### 8.3 Q110 (new). The day list left out of Save a copy (CUL-Q5)
- **Facts.** Save a copy holds no day, tradition or country; one line on the Days page says so (NS-47-R10). The file can be shared on, which is why the list is left out. V (card). Q55 covers export classification.
- **(a)** Is leaving the list out of Save a copy consistent with the access and portability rights the Privacy Policy (section 10) describes, given we hold no copy and the parent sees the list on screen? California access right: Cal. Civ. Code 1798.110, U: not opened.
- **(b)** Must the Privacy Policy or the Days line say that the list is not exported, and where?
- **Default.** Left out; the one line says so; no export section.
- **If no.** Save a copy gains a days section, with the risk that a forwarded file shows a faith day; `privacy` and the founder decide the file's warning.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-47-R10 in Drop C. Read with Q55.

### 8.4 Q111 (new). The label answer and the Privacy Policy sentence for the day list (CUL-Q7)
- **Facts.**
  - Apple's label rule: data processed only on the device is not "collected" (App Privacy Details, read earlier on 20 Nov by `compliance.md` as S2, not re-read now). The card says Apple lists religious or philosophical beliefs as Sensitive Info and that derived data sent off the device is considered separately. U.
  - The cards keep the answer "not collected" while NS-47-R4 holds, add one plain Privacy Policy sentence, and re-run the label per build (NS-47-R23; FR-CUL-23). The sentence, in intent: an optional list of days, kept on the phone only, never sent to us.
  - The law's meaning of "collect" is not Apple's (Q20, Q54).
- **(a)** May the label stay "not collected" for the day list?
- **(b)** Is the Privacy Policy sentence enough, and is adding it a clarification (POLICY_VERSIONING 2.2) or a material change (2.1)?
- **(c)** Does a notice-at-collection duty arise for data we never receive (with Q20)?
- **Default.** Yes to (a) while NS-47-R4 holds; add the sentence as a minor change; tell the parent in plain words either way.
- **If no.** The label row changes in the same build; the ask stays off until it does.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** Drop C needs the answer. For a Drop B candidate the card (21, release line and NS-47 section 22) gates the label by an internal check at G5 (`privacy` re-runs it, NS-47-R23) and lists CUL-Q5 to Q7 and Q11 as "on record or the fallback list"; Drop B uses the fallback list, so this answer is not a Drop B gate by the card's own words. Note: the old cell for CUL-Q7 said "Q57(f)-adjacent"; Q57 is sanctions, and the related question here is Q54.

### 8.5 Q112 (new). A local day note that names a faith day: Apple 4.5.4 and the licence agreement (CUL-Q11)
- **Facts.**
  - **Apple 4.5.4** (read 20 Nov 2026 at https://developer.apple.com/app-store/review/guidelines/; the page text has no last-updated date): push notifications "should not be used to send sensitive personal or confidential information", and "should not be used for promotions or direct marketing purposes unless customers have explicitly opted in ... via consent language displayed in your app's UI, and you provide a method in your app for a user to opt out". V. The text names push; a day note is a local notification.
  - **The licence agreement.** The cards say Developer Program License Agreement Attachment 1 section 2.2 names local notifications used for marketing and requires opt-in consent language and an opt-out (NS-46-R35), and section 2.3 limits excessive local notifications (NS-48 section 17). U: I did not read the agreement.
  - **What the product does.** A ticked day sends a 09:00 local note that sells nothing (NS-46-R27) and advertises no feature, new day, the Days page or an update (NS-46-R35). Its lock-screen title and body are neutral for every family, tradition, culture-led or national day; a day's own name shows only for allowlisted seasonal and civic days, or behind a local switch that is off by default and forced off while App lock is on (NS-46-R36; NS-47-R12, R13, R38; ADR 0033; errata E45). The yearly timing of a note is a residual the cards accept (NS-47-R22). V (cards; nothing is built).
  - **Not Q41.** Q41 is about plan notices (NS-32). CUL-Q11 had been mapped to Q41, which is a different subject; this question replaces that mapping.
- **(a)** Does 4.5.4, or the agreement, reach a local day note?
- **(b)** Is a note that names a faith day "sensitive personal or confidential information" in the sense of 4.5.4 when the parent has turned the day-name switch on? Is a neutral note on a faith day, arriving each year, a disclosure in itself?
- **(c)** Is a day note "promotion or direct marketing"? If a reminder the parent chose by ticking is not, is the line before the first tick plus the opt-out (NS-46-R35, NS-47-R21) still the right design?
- **(d)** A parent's own typed day follows the same switch (E45). Does a parent's typed word on a lock screen differ in any way?
- **Default.** Treat 4.5.4 as applying; neutral title and body; names only behind the local switch; no feature advertised in any day note; one-tap untick and Clear all.
- **If no.** (b) counsel names the fallback: the switch is removed and every day note is neutral. (c) the consent line and the opt-out are written to counsel's words.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** Part (c), the read of the line before the first tick and the opt-out, blocks the Drop B days release: card 21 lists "the consent line read by counsel" among the gates of its Drop B row and of the NS-46 release unit, and a default never substitutes for a read that gates a flag (FR-CMP-12). Parts (a), (b) and (d) block the day-name switch (Drop C).

### 8.6 Q113 (new). The right to use calendar and day source tables (FR-DAY-23, Q-DAY-10)
- **Facts.**
  - Sources the library review names: timeanddate, Hebcal, the Naval Observatory's public service, the Baha'i World Centre. The review read the pages "as a reader", not their terms of use or licence. V (`days-library.md` line 501 and FR-DAY-23). U: I read none of the terms.
  - The design: compute what a rule computes (fixed days, nth weekday, Western and Orthodox Easter by the computus); take only moon-sighting and lunisolar dates, and astronomical instants, from a source whose terms allow it; cite it in the data (NS-46-R12, R23; DL-4). Every table cell is a date or the literal `n/r` (NS-46-R1).
  - The review's view, to be confirmed by counsel: a date is a fact, but a compiled table may be protected and a bulk copy of a commercial list is the risk. U.
  - The federal holiday names come from 5 U.S.C. 6103 (the cards); U: not opened by me.
- **(a)** May we use each named source's dates, and on what terms (licence, attribution, where shown)?
- **(b)** Is computing a rule-based date from a published rule free of any duty?
- **(c)** Does an `authority` field citing the source in our data meet an attribution duty?
- **(d)** Is a refresh of the library (a whole-library fetch, NS-46-R48) any different from a bundled table?
- **Default.** Compute every rule date; cite each table; copy nothing; a source with no confirmed right ships as `n/r`.
- **If no.** That source's rows are removed or licensed; the moving days that depend on it are not offered.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** Any NS-46 row whose date is copied from a source, including the astronomical days (Drop B).

### 8.7 Q114 (new). Tradition-reviewer records (NS-46-R23, DL-8)
- **Facts.**
  - Before a tradition's rows ship, a member of that tradition reviews them. The record names a pseudonymous reviewer id, the tradition id, the date and "read"; the person's name stays outside the repository (NS-46-R23). V (card).
  - Proposed place for the records: `docs/legal/evidence/days/<tradition-id>.md` (PROPOSED in `compliance.md` FR-CMP-32). The repository is public (`gh api repos/thesaurabhpareek/earlyletters --jq .visibility` returned `public`, 21 Nov 2026). V. So the default record form puts a pseudonymous reviewer id paired with a tradition id in a public place.
  - The library names and prefills are also read against App Review 1.1.1 (read 20 Nov: "Defamatory, discriminatory, or mean-spirited content, including references or commentary about religion ... national/ethnic origin"). V.
- **(a)** Does a record that pairs a pseudonymous reviewer with a tradition reveal something about that person's religion, so that it needs a basis, a notice or a different form?
- **(b)** What agreement should sit behind a reviewer's read (confidentiality, no claim that the reviewer speaks for a community, compensation, no right in our texts)? Counsel drafts; we do not sign anything.
- **(c)** May any public line say a tradition's days were reviewed by a member of it? (The card's marketing rule says no tradition is named as an audience, NS-46-R47.)
- **Default.** Record only the four fields in the public repository (pseudonymous reviewer id, tradition id, date, "read"); no name anywhere in it; no public line about the review; the 1.1.1 read date goes in the same record. Counsel should read (a) knowing the default is public.
- **If no.** Counsel names a different record form (for example the review held outside the public repository, with only a hash in it).
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** Each tradition's rows (Drop C).

### 8.8 Q115 (new). Does a picture index plus a day list amount to inference (CUL-Q14)
- **Facts.** The moments index (NS-51) holds picture dates and identifiers only, in its own L4 file; it reads the ticked-day dates in memory to widen a moment and never copies them (NS-51-R6, R7; ADR 0032). Nothing reads faces, people, places or albums by name (NS-51-R5, R33). V (card). The thresholds in R7 are PROPOSED.
- **(a)** Does a date cluster that falls on a day the parent ticked, held in memory, amount to a sensitive inference, in a family context or under Q109?
- **(b)** Does the index alone (dates, counts, clusters of a child's pictures) count as sensitive data?
- **Default.** Both files stay on the phone and are never joined in storage; the in-memory read is the only join; NS-51 stays off in `production`.
- **If no.** NS-51 does not read the ticked-day dates; moments widen on birthdays and month-age days only.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-51.

### 8.9 Q116 (new). A child's picture or video leaving the phone on the parent's act (L-14; extends Q45)
- **Facts.**
  - Variant A (default): no media path in a push, 0 bytes of media uploaded; media stay on the phone and in the iPhone backup, which is Apple's (NS-52-R19). Variant B (not chosen; the founder's decision, Q-PM-3 in card 27, closed as CL-048 with the default accepted: Variant A): media stored on our servers, readable by the second parent (NS-52-R21 to R25). The share sheet carries at most one picture and never a video (NS-52-R37). Save a copy includes every item (NS-52-R17). V (card).
  - 16 CFR 312.2 treats a child's image or voice as personal information when collected online (`compliance.md` source S10, read earlier, not re-read now). U.
  - Q45 already asks about a child's picture and voice through the share sheet and Arm V; this question is about stored, shared, exported and printed pictures and video.
- **(a)** May a child's picture and video leave the phone through Variant B storage, the share sheet, Save a copy or print, on the parent's act?
- **(b)** Is the parent the provider under child-data law, and are we a service that hosts a parent's content about a child, not an operator collecting from a child?
- **(c)** What must counsel see before Variant B (X2 and E23: a security read and a counsel read)?
- **Default.** Variant A first; no video through any door; the flags stay off in `production` until read.
- **If no.** Variant B is not built; the share carries text only (as Q45(c)).
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-52 Variant B; a video through NS-05 or NS-11; NS-05 with a picture.

### 8.10 Q117 (new). Biometric laws and a design that never matches (L-15)
- **Facts.** No face, voice or body measurement exists; nothing reads faces, people or Apple's People data (NS-51-R33), a video's sound is never analysed (NS-52-R6), and no model describes or tags media (NS-52-R29). A source scan fails the build on any such API. V (card). The Illinois definition lists "a retina or iris scan, fingerprint, voiceprint, or scan of hand or face geometry" and does not include photographs (740 ILCS 14/10; the page text was cut, `legal.md` S9); the rest of that act and Texas and Washington law were not read. U.
- **(a)** Confirm that a design with no face, voice or body measurement is outside BIPA, Texas CUBI, RCW 19.375 and GDPR Article 9 biometric data.
- **(b)** Does storing and playing back a video, with no analysis, change the answer?
- **Default.** Nothing is built that matches or measures; counsel confirms.
- **If no.** Counsel names what must change; media features stay off.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** Nothing now. Any face, "same person" or voice-matching feature is a new question first (FR-LEG-24).

### 8.11 Q118 (new). Another adult's voice in a parent's video (L-16; with CR-041)
- **Facts.** A video can record another adult speaking. The Terms section 5.5 (recordings) and the add-media sheet carry an instruction line to add it only with their agreement; there is no attestation tick (D9; FR-LEG-25). The sound stays in the file and is never transcribed (NS-52-R6). V (card, `legal.md`). Recording-consent statutes were not read. U.
- **(a)** Does a parent's own video that records another adult engage recording-consent law, and who bears the exposure?
- **(b)** Is an instruction line enough, or does counsel want a different line?
- **Default.** Instruction line only.
- **If no.** Counsel's words; NS-52 video stays off until they are in.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-52 video.

### 8.12 Q119 (new). Library read on the phone only: "collection" and notice at collection (L-17; extends Q20)
- **Facts.** NS-51, once the parent turns it on, reads each picture's creation date and a system identifier on the phone, and nothing leaves it (NS-51-R5, R26); Apple's label does not count that as collected (S2). The law's meaning of "collect" differs (Q20). The Privacy Policy and the where-it-lives lines say it in plain words (FR-LEG-21; NS-51-R42). V (card).
- **(a)** Is that read "collection" under CCPA or any notice-at-collection duty?
- **(b)** Are the plain-words lines enough?
- **Default.** Tell the parent in plain words anyway.
- **If no.** Counsel's notice wording; NS-51 waits for it.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-51 (with Q122).

### 8.13 Q120 (new). Terms, retention and deletion for hosted media (L-18; extends Q51)
- **Facts.** Only if Variant B is chosen: the Terms licence (section 5.2) would cover hosted media; retention, the deletion clock and media in backups follow the letters' rules (D8). Not built. V (`legal.md`).
- **(a)** Is the same licence, retention and deletion clock right for hosted media of a child?
- **(b)** What must Privacy 2, 3 and 7 and the Terms say for media in a server backup?
- **Default.** Same as letters (D8).
- **If no.** Counsel's clocks and words before any upload.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-52 Variant B only.

### 8.14 Q121 (new). A printed QR code to a hosted video page (L-19)
- **Facts.** A QR code in a printed book could link to a hosted page of a child's video. Anyone holding the book could open the link; signed links cannot be revoked one by one (Supabase signed URLs, `legal.md` S11). Not built and not specced (FR-LEG-27). V (`legal.md`).
- **(a)** May this ever be offered, and under what limits?
- **Default.** Not built.
- **If no.** No change.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** Nothing; a spec would wait for the answer.

### 8.15 Q122 (new). Apple's platform terms for the library read and the Journaling picker (C-9, C-10, C-11; NS-49-R27, R35)
- **Facts.**
  - **5.1.1(iii)** (read 20 Nov 2026): apps "should only request access to data relevant to the core functionality" and, "where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos". V. NS-01 and NS-49 level 1 use the picker with no permission; NS-51 asks for library access after the parent turns it on (NS-51-R1, R3).
  - **5.1.1(ii)**: "Ensure your purpose strings clearly and completely describe your use of the data." V. The string exists only in a profile whose flag is on (NS-51-R2).
  - **NS-49 level 2** uses Apple's Journaling Suggestions picker and an entitlement; no permission string (NS-49-R6, R15). The licence agreement clause 3.3.3(H), as the cards state it, allows the API only "for journaling purposes", with the use clearly evident in marketing text and the interface (NS-49-R35). U: not read by me. The store name is "Early Letters: Baby Journal" (`packages/brand/index.ts`, V), while the brand glossary keeps "journal" out of prose (`BRAND.md`; founder item Q-FD-34).
  - Suggestions can carry Health-derived items; the app reads only photos (NS-49-R10). Whether 5.1.3 applies is U.
- **(a)** Will App Review accept a library read for moments when the out-of-process picker exists (5.1.1(iii))?
- **(b)** Is Photos permission data "sensitive" under any rule the packet lists? (Apple 5.1.3 health data is not it.)
- **(c)** What do the licence agreement's clauses say about Photos library data beyond 3.3.3(H)?
- **(d)** Does the store name plus the button words make the journaling purpose "clearly evident" for 3.3.3(H)? Does 5.1.3 touch a feature that reads only photos?
- **(e)** Is a library permission for a child's pictures acceptable under 5.1.1, and does the purpose string need more than "dates, on this phone"?
- **Default.** NS-51 ships limited-library-first with the Notes for Review explaining it, and the flag stays off if App Review objects; NS-49 level 2 stays off until (d) is read.
- **If no.** NS-51 is dropped or reduced to the picker; level 2 is not shipped; the label is unchanged.
- **Deadline.** Before the flag named under Blocks turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-49 level 2; NS-51.

## 9. Questions from the Moments tab (NS-53; drafted 21 Nov 2026)

> Draft for counsel review. Prepared by an AI (legal drafting support); not legal advice; no attorney-client relationship exists. Every legal conclusion below is marked "counsel must confirm". Nothing here says anything is compliant or legal. The "default if counsel is silent" is what the product does, not a legal view.

**Placement.** This section was first merged (#1316, `ddbf7691`) after the Changelog, with the version line untouched, so it would not collide with the open draft for section 8 (#1057). #1057 has since merged (`ab52389c`). In version 1.9.0 the section sits above the Changelog, and the version line and Changelog row are updated.

**Where it comes from (all heads read on 21 Nov 2026).**
- The spec `docs/product/prd/28-moments-tab.md` on `wip/moments-prd-v3` at `b31a389b8afb3e747f61d19e098f2bc22a65800d`: section 21.3 (the ten questions), 21.2 (money), 21.1 (calendar), G2, section 16.1 (proposed promise text). The spec is PROPOSED; nothing in it is decided, built or in `docs/DECISIONS.md`. Spec rows R135 and R166 were reworded in PR #1314 (branch `docs/moments-prd-v3`, head `f52cd5a2f426951497ebfc145d809d031371127f`) and no longer say "never leaves the phone" or "we hold nothing"; the other spec citations in this section were read at `b31a389b` and are not re-checked against the newer head (UNVERIFIED).
- `docs/product/moments-tab/exec-review/hybrid-legal.md` on `wip/moments-hybrid-review-legal` at `4d001e1da8b3b521b9467d3f4a8aef484913889d` (EXH-LEG-1 to EXH-LEG-15) and `hybrid-privacy.md` on `wip/moments-hybrid-review-privacy` at `0b1218108926ca43dc0602c8be5d1202d4adbb80` (EXH-PRV-1 to EXH-PRV-13). Both are Claude-role reviews, not counsel. Their statements about Apple text are as they report them; I did not re-read Apple's pages, so each Apple quotation is UNVERIFIED here until counsel or `legal` reads it.
- The earlier brief in `docs/product/moments-tab/exec-review/clo.md` on `develop`, "Counsel brief: the ten questions".

**How the numbers work.** The spec numbers its ten questions Q1 to Q10 inside its own table. Those clash with this packet's Q1 to Q10 (1.0.0 questions). So here they take the next free packet numbers, and the spec number is kept in brackets. The repo's id check (`scripts/agents/next-id.mjs`, `id-collisions.mjs`) covers D, ADR, APPLY, BL, CR and S1 ids only, not packet question numbers. I therefore checked by hand: develop's packet ends at Q108; the open drafts claim Q58 to Q74 (#598), Q75 to Q77 (BL-780), Q78 to Q106 (per the #760 title; its branch's separate draft file `docs/legal/COUNSEL_PACKET_MEMORY_LIBRARY_DRAFT.md` has headings from Q78 to Q106, and #760 no longer lists `COUNSEL_PACKET.md` among its files) and Q109 to Q122 (#1057, section 8; its head `f80e67bb` ends at Q122); a scan, on 21 Nov 2026, of the file lists of all 193 open PRs (counted at the same time; this number changes daily) found only #1057, #830 (the develop-into-main release snapshot, which carries develop's file ending at Q108) and this PR touching `docs/legal/COUNSEL_PACKET.md`; no open PR or head read mentions Q123 to Q132 in a docs file; no `wip/moments-*` branch adds a packet number. I did not re-read every `wip/*` branch for this re-check. The next free numbers are Q123 to Q132. Re-run this check at merge; if #1057 grows past Q122, shift this block and nothing else.

**Build profiles used below** (read from `apps/mobile/eas.json` on develop): `development`, `e2e` and `testflight` have `EXPO_PUBLIC_SERVER_FEATURES` off; `preview` and `production` have it on; `EXPO_PUBLIC_BACKUP` is off in all; no profile sets `EXPO_PUBLIC_PHOTOS`. Spec flags: **F1** the picker door (Apple's system picker, no permission), **F2** the library read on the phone (date, time and place of pictures, after a primer), **F3** an Apple geocoder (not planned), **F4** picture-timed reminders (off). The first store build is the `production` profile, so servers are ON in it.

### 9.1 Proposed promise text, before and after (founder approves; counsel must confirm)

Founder-only: what a user is promised. Nothing below is live. O-48 in the spec is the founder's approval; no public line ships before it. Source: spec section 16.1 and R285.

| Surface | Before | After (PROPOSED) | True when |
|---|---|---|---|
| Lead line | "days suggested from your pictures" (the earlier lead the spec replaces; I found no live public copy of it in `packages/content` or the store text on develop, so "before" is the spec's own earlier wording) | "Pictures start the story. Your voice finishes it." Second line: "We never write a word for you." | The second line is true in every build (the constitution in `CLAUDE.md`) |
| First run, library read granted (Full or Limited), F2 on | None found | "Pick pictures from a day, then tell {child} about it. If you like, {app} can suggest days from the date, time and place of your pictures, read on this phone." | F2 on and approved with its gates |
| First run, declined, Not now, Restricted or library off | None found | "Pick pictures from a day you want to remember, then say what was happening." Button: "Choose pictures" | F1 only; every build |
| First run, Limited | None found | "Pick pictures from a day, then tell {child} about it." One calm line says which pictures this tab can use, with a "Choose pictures" button | F1 plus a limited library read |
| Store description and screenshots | None found | "Pick pictures from a day you want to remember, then say what was happening. Your words stay yours. It never adds a word to your letter." | Every build |
| Store promotional text (only after F2 is approved and gates are on record) | None found | "Let the app suggest days from the date, time and place of your pictures, read on this phone, or choose pictures yourself any time." | F2 on |
| Primer, variant A (default, R192) | None found | "{app} reads the date, the time and the place of your pictures, on this phone and only while Moments is open, to suggest days to tell {child} about." | F2 on |
| Primer, variant B (challenger) | None found | "You can choose pictures yourself any time. If you would like suggestions, {app} can read the date, time and place of your pictures, on this phone, while Moments is open." | F2 on |
| Primer, variant C | None found | "To suggest days, {app} reads the date, time and place of your pictures. It happens on this phone, only while Moments is open." | F2 on |

Words the spec bars from every line: the tab name in store text, "stays on your phone", "no account", "private" as a bare headline, "Apple Photos", "memories", "highlights", "daily", "every day", "never ask again", "we only see what you pick" (EXH-LEG-3: true only with no access; false with the library read on), "a better App Review story".

Questions this raises for counsel are inside Q123 (label and consent), Q130 (absolute sentences) and Q128 (Terms). Counsel must confirm that none of the "after" lines is a misleading statement in any build in which it appears.

### 9.2 Index

| Packet Q | Spec Q | Topic | Requirement ids | Profiles it bites | Blocks | Default if silent |
|---|---|---|---|---|---|---|
| Q123 | 1 | Label, consent, purpose string, phone-only primer record | R81, R72, R37, R61, R166, R182, 8.5, EXH-LEG-4, EXH-LEG-7 | `production`, `preview` (F2) | G2, store submission | F2 stays dark; label and policy unchanged |
| Q124 | 2 | Picture-timed reminders (4.5.4, 5.1.2(vi)) | R132 to R135, R191, R181, R80, F4 | none in the first release | Phase 2 | F4 off |
| Q125 | 3 | Naming a city from picture location; the in-memory home place | R61, R63, R64, R117, 7a.2 | `production`, `preview` (F2) | G2, G3 | Place lines off; date-only cards |
| Q126 | 4 | Location in a library or picked picture (DPLA 3.3.3(F)); readable under Limited | R37, R61, R72, R75, EXH-LEG-5, EXH-LEG-6 | F2 and F1 | G2, G3 | Date-only cards |
| Q127 | 5 | Trademark: "Moments" as a tab label (trademark attorney) | R8, R194, O-28 | store listing, screenshots | O-28 | Fallback label in screenshots |
| Q128 | 6 | Terms: other people's children, approximate labels, no scanning, knowledge duty | R93, R97, R103, R104, EXH-LEG-7(d) | F1 and F2 | G2, store submission | Terms 4.2.0 not published; library read waits |
| Q129 | 7 | Deletion promise versus a picture copy in an iPhone backup | R97, R166, R81, R235, O-44, EXH-LEG-14, EXH-PRV-1 | F1 and F2, any build that keeps a picture | G2 | Disclose the iPhone backup of kept pictures in one plain policy line; do not exclude the folder (founder, O-44, 21 Nov 2026) |
| Q130 | 8 | Policy mechanics: material change, Significant Change API, CalOPPA, absolute sentences | R135, R166, R81, R175, R193, H-11, EXH-LEG-3 | `production` | Store submission | Say what we receive, never where it lives |
| Q131 | 9 | Publisher and liability (5.1.1(ix)); entity; cover; public address | G10, O-47 | store submission | G10 | Founder starts an entity in parallel |
| Q132 | 10 | Place dataset licence; later geocoder caching | R61, R62, R117, G8, G11b | F2 places | G11b | No places; geocoder not built |

No eleventh question (EXH-LEG-13). The picker door's questions are lettered sub-items under the numbers above. Per the spec's G2 row, the door is independent of the spec's Q1 to Q4 and Q10 (here Q123 to Q126 and Q132) and not independent of Q5 to Q7 and Q9 (here Q127 to Q129 and Q131). Counsel must confirm that reading.

### 9.3 Q123 (spec Q1). Label and consent for a build that reads dates and places on the phone, servers on
- **Facts.** The F2 read takes the date, time and rounded place of pictures in the parent's library, in memory on the phone, after a primer. Nothing library-derived is meant to leave the phone or be stored (R162). The first store build has servers on. The label of record today answers "Photos or Videos: No" and "Location: No" for a build with no photo feature (`app-store-privacy-labels.md` lines 50 and 54).
- **(a)** Is "Photos or Videos: not collected" and "Precise Location: not collected" a correct answer for a `production` build that reads picture dates and coordinates only on the phone, keeps picture copies on the phone only, and has servers on? The spec's reviewers read Apple's definition of "collect" (data leaves the device and is held beyond the real-time request) as supporting "not collected"; that is UNVERIFIED here and counsel must confirm. Any picture upload or sync (the spec's Variant B) would change it at once.
- **(b)** Is the purpose string (date, time and place named, no claim about analysing the content of pictures) enough? Is a phone-only record of the primer answer enough, with no server consent row?
- **(c)** Apple's first-time picker text (EXH-LEG-4): if the system picker shows its own onboarding text in a state where our primer has told the parent something different (Full access), what does counsel advise about showing both? Until read, the spec holds the inline picker out of the Full-access state. G1a records, per access state, whether the text shows and its exact words.
- **(d)** A picked picture is stored on the phone as a stripped copy after Keep (EXH-LEG-1, EXH-LEG-7). Does that change the "Photos or Videos" row or the sentence "We do not collect ... photos" (Privacy Policy 3.0.0 line 45)?
- **Default.** F2 stays dark; label, policy and in-app text unchanged; the door waits for its own paperwork (see Q128 to Q130).

### 9.4 Q124 (spec Q2). Picture-timed reminders
- **Facts.** A reminder timed from picture dates on the phone, with the same words as the ordinary evening reminder (R133 to R135). F4 is off in the first release.
- **(a)** Is such a reminder "promotions or direct marketing" (App Review 4.5.4) or "use-based data mining" (5.1.2(vi)), under either reading of whether "Photo APIs" there means all photo data or only depth and facial data? Both texts are UNVERIFIED here; counsel must confirm.
- **(b)** Does an identical-words reminder mislead anyone, given that the opt-in discloses it?
- **Default.** F4 off. **Blocks** phase 2 only.

### 9.5 Q125 (spec Q3). Naming a city from picture location, on the phone
- **Facts.** A nearest-place lookup runs against a bundled table on the phone; no request leaves. A single "home place" lives in memory and in `moments.json` as a parent correction (R249).
- **(a)** Is naming a city from picture location metadata on the phone acceptable under App Review 5.1.1(ii) and 5.1.2(ii) and (iii)? Counsel must confirm.
- **(b)** Is the in-memory or stored home place a "profile" that needs its own disclosure under the state precise-geolocation definitions (EX-CLO-15)?
- **Default.** Place lines off; date-only cards.

### 9.6 Q126 (spec Q4). Location data duties for a picture
- **Facts.** The Apple Developer Program License Agreement 3.3.3(F)(ii), as the legal reviewer read it, covers applications that "otherwise obtain a user's location through the use of the Apple Software or Apple Services" and requires notice and consent before location data is "collected, transmitted or otherwise used" (EXH-LEG-5; verbatim reading UNVERIFIED by me).
- **(a)** Does that clause, or any other, treat location embedded in a library picture as location data needing separate notice or consent? Is location readable and usable under Limited access (G1a-L records the technical answer)?
- **(b)** A file the parent picks through the system picker can carry coordinates. If our code opens it only to read a date and then re-encodes it without location, does that count as obtaining or using location data? The spec's default for the door is a date chip only, with no place from a picked picture, and a build test that fails if the picker code touches a location property or tag.
- **(c)** Video: the metadata removal API for a re-encoded video is UNVERIFIED (NS-52-R5); until the spike passes, text says "pictures" only (EXH-LEG-6).
- **Default.** Date-only cards; no place from a picked picture. **Blocks** G2 and G3.

### 9.7 Q127 (spec Q5). "Moments" as a tab label (trademark attorney, not the same counsel)
- **Facts.** The tab label appears in the tab bar and so in screenshots; no filing is planned while the word is in-app only (spec 21.2).
- **Questions.** Is "Moments" clear for this software in classes 9, 42 and 45 (two USPTO-derived records were opened by the CLO role; a wider search was not)? May it appear in screenshots? Which fallback label is lowest risk? Does it change the search for "Early Letters"? Counsel must confirm.
- **Default.** Fallback label in screenshots; in-app label per founder.

### 9.8 Q128 (spec Q6). Terms for pictures, other people's children and approximate labels
- **Facts.** Terms 4.1.0 do not mention pictures (a search of the file finds none). The door is the first place a parent attaches a picture of someone else's child.
- **(a)** Do the draft clauses (the parent confirms they may use the pictures they add, including pictures of other people and their children; dates and place names are computed, not the parent's words; no scanning; optional library read) fit inside Apple's minimum custom EULA terms and California law?
- **(b)** The same question for pictures the parent picks through the system picker, including other people's children (EXH-PRV-10: Apple's People album is inside the picker).
- **(c)** Does reading the library on the phone create any knowledge duty (18 U.S.C. 2258A)? Counsel must confirm.
- **Default.** Terms 4.2.0 not published; the library read and the door wait.

### 9.9 Q129 (spec Q7). Deletion promise versus a picture copy in an iPhone backup
- **Facts.** A kept letter's picture copy sits in the app container and is part of the parent's iPhone backup; `data-policy.md` lines 138 and 145 already say so, and no parent-facing line says so yet (CR-62 item 4). Privacy Policy 3.0.0 line 37 and Terms 7.3 name recordings in the iPhone backup, not pictures.
- **(a)** Does a picture copy in an iPhone backup change our deletion promise, the label, or what we may say in answer to an access or deletion request?
- **(b)** Temporary located originals in `Caches/ImagePicker` and the system's iCloud download after a pick (EXH-LEG-14): do they belong in the answer?
- **(c)** Is a carve-out sentence enough if the folder is not excluded from backup, or does counsel prefer exclusion (the CLO role does, because it makes the promise true)? Founder decision O-44 sits beside this.
- **Default.** Disclose the iPhone backup of kept pictures in one plain line of the policy text; do not exclude the folder from backup. This is the founder's decision of 21 Nov 2026 (O-44), reversing the earlier default of exclusion. Counsel must confirm the wording and whether disclosure is enough. What Apple's backup does with a deleted file is UNVERIFIED. Part (c) above is kept as the question to counsel; the CLO role's preference for exclusion is recorded there as a view, not the default. **Blocks** G2.

### 9.10 Q130 (spec Q8). Policy mechanics and absolute sentences
- **Facts.** The library read and the door change behaviour; the policy and label must change in the same build (R81, R240).
- **(a)** Is the library read a material change needing notice and re-show, including to TestFlight testers? Does Apple's Significant Change API apply (UNVERIFIED)?
- **(b)** Does CalOPPA need anything beyond the build-list fix (Privacy Policy 3.0.0 line 21; see `docs/product/moments-tab/PRIVACY-CONTRADICTIONS.md`)?
- **(c)** Which absolute sentences are unsafe ("never leaves the phone", "we hold nothing", "we only see what you pick")? The spec says sentences state what we receive, never where something lives (H-11), and that every sentence about the picker names its mode: no access, Limited or Full (EXH-LEG-3). Counsel must confirm.
- **Default.** "We do not receive" wording with a version bump and re-show.

### 9.11 Q131 (spec Q9). Publisher and liability
- **Questions.** With Moments, is an individual publisher at risk under App Review 5.1.1(ix)? Should an entity exist before the first submission? What cover is realistic for errors and omissions and cyber for a one-person publisher holding family data? What address may be public? Existing packet Q47 asks the publisher-identity part; this question adds what Moments changes.
- **Default.** The founder starts an entity in parallel (decide-by Fri 27 Nov in the spec's calendar; PROPOSED). **Blocks** G10.

### 9.12 Q132 (spec Q10). Place data licence and any later geocoder
- **Questions.** Does the chosen offline dataset's licence permit bundling in a paid app, and what attribution or share-alike duty follows? If Apple's geocoder is ever wanted, may results be cached, what consent text and label change follow, and does it conflict with Apple's one-request-per-action rule (Attachment 6 UNVERIFIED)?
- **Default.** Offline table only; geocoder not built. **Blocks** G11b.

### 9.12a Topics from the closed #760 draft that had no home (Q139 to Q141)
Added on 24 Nov 2026 under CR-211, after a check of the closed draft's tier A list (Q78 to Q91, Q103) against Q109 to Q132. This is the exec team's own review under D-172, not a lawyer's. The check read the draft's tier A headings and "Ask" lines only; nobody read the whole 513-line draft question by question. Q133 to Q138 are taken by the open print-questions PR (#1923), so these rows start at Q139. Each row is a topic only; the facts, default and "if no" lines are written when counsel asks for them. Topics that do have a home are listed under the table.

| Q | Topic | From the closed draft | Nearest existing question |
|---|---|---|---|
| Q139 | Read together showing a parent's pictures to a child; a future adult's request for childhood images; the 18+ gate | Q85 | Q116 and Q45 (pictures leaving the phone; not showing them) |
| Q140 | Places carried as text in the export, and a print order sending a letter's content to a print processor: does "stays on your phone" survive | Q90 | Q11, Q47 (print), Q121 (a printed QR code) |
| Q141 | The Terms sentence on reports to NCMEC, and whether it stays accurate for an app that keeps pictures on the phone | Q83 (second part) | Q128(c) (any knowledge duty) |

Topics from the closed tier A list that already have a home: Q78 in Q123(a), Q129 and Q130; Q79 in Q123(a); Q80 in Q130; Q81 and Q82 in Q123(b); Q83 (right to add) and Q84 in Q128(a) and (b) and Q117; Q86 in Q118; Q87 in Q125 and Q126; Q88 in Q119; Q89 in Q132; Q91 in Q122; Q103 in Q109, Q112(d) and Q51(f). These mappings are from titles and ask lines; counsel may find a gap.

### 9.13 Capped brief ordering (a proposal for the founder; the cap and the engagement are the founder's, O-40)
Counsel cost is UNVERIFIED and the founder sets the cap. Silence is not a pass: any part counsel does not answer stays dark. If the cap forces cuts, the order below keeps the questions that gate the most shipping first and cuts last the ones whose default is already "off".

| Order | Packet Q | Why here |
|---|---|---|
| 1 | Q123 | Gates the library read and the label for the `production` profile |
| 2 | Q126 | Gates date and place use; its default (date-only) is a real product cost |
| 3 | Q129 | Gates the door and the library; the promise and the label depend on it |
| 4 | Q128 | Gates the door and store submission |
| 5 | Q130 | Policy mechanics for the same release |
| 6 | Q131 | Gates the founder sign-off; may be a separate engagement |
| 7 | Q125 | Default (date-only cards) is acceptable; ask if budget allows |
| 8 | Q127 | A different attorney; separate cap; the fallback label is available |
| 9 | Q124 | Phase 2 only; F4 off |
| 10 | Q132 | No places by default; ask only if the place table is wanted |

A first cut (orders 1 to 6) answers everything the spec says the door and the library need together. Whether that is an adequate or sufficient brief is for counsel and the founder; counsel must confirm.

### 9.14 What counsel is not asked to do
Nothing here asks counsel to approve the product copy in 9.1 as marketing, to set price, or to rule on anything outside these ten topics. The contradictions between published drafts and the hybrid design are listed in `docs/product/moments-tab/PRIVACY-CONTRADICTIONS.md`; they are fixes `legal` drafts as Privacy Policy 3.1.0, Terms 4.2.0, in-app disclosures 3.5.0 and label 2.3.0 (spec R266), held as draft-for-counsel.

## 10. Questions from the printed book and print sale rows (24 Nov 2026)

> Draft for counsel review. Prepared by an AI (legal drafting support); not legal advice; no attorney-client relationship exists. Every reading below is an engineering reading; counsel must confirm. Nothing here says anything is compliant or legal. Read under D-172: "counsel" is the exec-team review. Each question can be answered without relying on my summary of the page named in its facts.

**Where these come from.**
- **The rows.** `docs/product/prd/functions/print-and-fulfilment.md` (CBO role, 20 Nov 2026): Q-PRT-4 (price and shipping, SB 478), Q-PRT-5 (FTC Mail Order Rule), Q-PRT-6 (sales tax), Q-PRT-8 (children's-product rules and the PCI level) and Q-PRT-9 (emoji face licence). Each said "needs a number from legal" or named a register row, and none had a number in this packet. FR-PRT-10, -11, -19, -20, -21 and -46 are the build rows that wait on them.
- **The register.** `docs/legal/compliance-register.md`: CR-054 (printed books: PCI via hosted card fields, FTC Mail Order Rule, returns; marked Unverified), CR-087 (Apple 3.1.3(e) line), CR-120 (sales tax on printed books, Gap), CR-123 (open-source licences). SB 478 and CPSIA have no register row yet; they are listed in the pull request description as rows to add.
- **Existing print entries.** Q11 (processor contracts, which the partner and the payment processor will need) and Q47 (publisher identity; Q-PRT-2 asks whether an entity is the seller) already gate NS-07 and NS-30 (7.16). Q30 (later features) and Q121 (a printed QR to a hosted video) are separate. These six do not repeat them.
- **Why this is not urgent.** Printing is unbuilt. The free file (NS-07) ships without ordering, and Q-PRT-1 keeps it that way until the go/no-go. So each question below blocks nothing today; each blocks the print flag in `production` before it is built.
- **How the numbers work.** Q133 to Q138 are the next free numbers after section 9 (Q132). I checked on 24 Nov 2026: develop's packet ends at Q132; the patches of all open PRs that touch `docs/legal/COUNSEL_PACKET.md` contain no Q133 to Q199; no remote branch head I read adds a heading at Q133 or above. The repo's id check (`scripts/agents/next-id.mjs`) does not cover packet question numbers, so this was by hand. Re-run it at merge.
- **"Deadline."** The gate it blocks, as in section 8 (ruling T5). No calendar date is invented.
- **Facts tags.** V: read on 24 Nov 2026 at the page named. U: not read.

### 10.1 Index

| Q | Topic | Old id | Rows | Priority | Blocks (flag in `production`) |
|---|---|---|---|---|---|
| Q133 | FTC Mail Order Rule and a returns and refund policy for a printed book sold direct | Q-PRT-5 | FR-PRT-46; CR-054 | C | Print order flow (NS-30); nothing now |
| Q134 | Card data scope: a hosted checkout, or Apple's in-app purchase for print | Q-PRT-8 (PCI part) | FR-PRT-19; CR-054, CR-087 | C | Print order flow (NS-30); nothing now |
| Q135 | Sales tax on printed books: the partner's duty or ours | Q-PRT-6 | FR-PRT-21; CR-120 | C | Print order flow (NS-30); nothing now |
| Q136 | California total-price display for a printed book (SB 478) | Q-PRT-4 | FR-PRT-20 | C | Print order flow (NS-30); the price screen; nothing now |
| Q137 | Children's-product rules (CPSIA) for a keepsake book | Q-PRT-8 (CPSIA part) | FR-PRT-46 | C | Print order flow (NS-30); a paid book sold from the app; nothing now |
| Q138 | The licence of the fonts embedded in a printed or shared PDF, and an emoji face | Q-PRT-9; CR-123 | FR-PRT-10, -11 | C | Printable file (NS-07) if it embeds a face we have no record for; an emoji face for print |

Mapping, in the style of 7.16:

| Q | Now also gates | Source |
|---|---|---|
| Q133, Q135, Q136, Q137 | NS-30 print sale | `print-and-fulfilment.md` Q-PRT-5, -6, -4, -8; FR-PRT-46 |
| Q134 | NS-30 print sale (the payment path) | FR-PRT-19; CR-054 |
| Q138 | NS-07 printable book (font records); NS-30 | FR-PRT-10, -11; NS-07 C28-13 |
| Q11, Q47 | NS-07 printable book, NS-30 print sale (unchanged, 7.16) | NS-07 section 4.17 |

### 10.2 Q133 (new). The FTC Mail Order Rule and returns for a printed book sold direct (Q-PRT-5; CR-054)
- **Facts.**
  - **What the page says.** The FTC business guide to the Mail, Internet, or Telephone Order Merchandise Rule (Part 435) says the rule covers most goods ordered by mail, telephone, fax or the internet, whoever starts the contact. If a seller states a shipping time it needs a reasonable basis for it; with none stated, a reasonable expectation of shipping within 30 days of a properly completed order. If it cannot ship on time it must offer the buyer a delay consent or a full refund, with a free way to cancel and a revised date or a reason. Refunds are due within seven working days after cancellation and may not be store credit. V (read on 24 Nov 2026 from https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule; summary, not quoted).
  - **What it does not say.** The page lists exemptions (such as serial deliveries after the first, seeds and plants, C.O.D. orders, services) and does not discuss made-to-order or personalised goods. Whether a book printed from a family's own letters is inside the rule is not answered there. U: I did not read the rule text in the Code of Federal Regulations.
  - **The product.** A book would be made to order by a print partner and shipped to the parent. No partner is chosen; no turnaround is known (`print-and-fulfilment.md` Q-PRT-3). CR-054 lists returns policy and the rule as "Unverified". The partner's own defect and reprint terms are not read.
  - **Returns.** The page read says nothing on a right to return a correct personalised item. Whether any state law or the card networks add a return duty for a made-to-order book is U.
- **(a)** Does the rule apply to a personalised printed book we sell direct to a US parent? If the partner, not we, is the seller of record, does the answer change?
- **(b)** If yes: what must the order page, the Print Terms and the delay notice say, and is "we ship within N days" a statement that creates the "reasonable basis" duty?
- **(c)** Must we accept a return of a correct book (no defect) or may the Print Terms say a made-to-order book is final except for our error or damage? What do California and other states add?
- **(d)** Does the answer change if the seller is the founder as an individual (D-004) rather than an entity (Q47, Q-PRT-2)?
- **Default.** Build as if the rule applies: no shipping time promised that the partner has not confirmed in writing; a delay notice with a revised date and a free cancel; a full refund to the original payment method within seven working days of a cancellation; no store credit. The Print Terms say a correct book is final and a defective or damaged book is reprinted or refunded (FR-PRT-29 as written). The order flow is not built until the Print Terms are drafted and counsel has read them.
- **If no.** The notice and refund timing stay as the default anyway unless counsel says they can be dropped; the Print Terms drop the cancellation text counsel names.
- **Deadline.** Before the print flag turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-30 print sale. Nothing now.

### 10.3 Q134 (new). Card data scope: a hosted checkout, or Apple's in-app purchase for print (Q-PRT-8; CR-054; CR-087)
- **Facts.**
  - **Two routes, not decided.** Route 1: payment on a hosted page opened outside the app (card or Apple Pay), with no card number ever reaching us (FR-PRT-19; CR-054). Route 2: Apple's in-app purchase for the book. App Review 3.1.3(e), as the print file quotes it, says that an app enabling the purchase of physical goods consumed outside the app must use purchase methods other than in-app purchase, such as Apple Pay or card entry. V for the print file's quotation (read 20 Nov 2026 by the CBO role); U: I did not re-read Apple's page on 24 Nov 2026. Whether a printed book is "consumed outside of the app" is a reading for counsel; the print file assumes yes and puts the book on route 1.
  - **PCI.** The PCI Security Standards Council FAQ I read says an e-commerce merchant can use SAQ A if it fully outsources payment processing and does not store, process or transmit cardholder data on its own systems, including by redirecting the customer to a compliant third-party payment page; requirements 2, 6 and 8 still apply to a merchant-managed system that builds the redirect. V (read on 24 Nov 2026 from https://www.pcisecuritystandards.org/faqs/1439/; summary, not quoted). U: I did not read the SAQ A form, the current PCI DSS version or the card-brand rules, and nothing here says which SAQ would apply to us. CR-054 names "SAQ A (Unverified level)".
  - **Payment label.** Whether a hosted page that collects an address and a card number changes the App Privacy answers is U (`print-and-fulfilment.md` lists it as not read; it also touches Q54).
  - **Apple route 2.** Under in-app purchase Apple would be the merchant of record and would collect the money; whether Apple's terms allow a physical, shipped, personalised good there at all, what Apple would take, and whether we could then hold the buyer's shipping address are all U.
- **(a)** Is a printed book "physical goods consumed outside of the app" under 3.1.3(e), so that route 2 is not available? Or may we choose either?
- **(b)** On route 1, which SAQ type, if any, would we complete, and what must we keep (a processor contract, an attestation, the hosted page's own compliance record)? Does the answer change by the processor chosen?
- **(c)** On route 1, does a link or button in the app that opens the hosted page raise any App Review issue beyond 3.1.3(e) (for example the Notes for Review wording in FR-PRT-19)?
- **(d)** Does the page that collects the address change the App Privacy answers or the Privacy Policy's list of providers (Q11, Q54)?
- **Default.** Route 1: a hosted page outside the app; the app never sees a card number; no StoreKit product exists for a book. No route is chosen for the founder here; counsel's answer to (a) decides whether route 2 exists.
- **If no.** If counsel finds route 1 not allowed, print is not sold from the app until the other route is read in full.
- **Deadline.** Before the print flag turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-30 print sale. Nothing now.

### 10.4 Q135 (new). Sales tax on printed books: the partner's duty or ours (Q-PRT-6; CR-120)
- **Facts.**
  - **What the register says.** CR-120: printed books sold by us create sales-tax collection duties where we have nexus; Unverified; accountant before the first order. As an individual publisher the founder would carry the duty personally (D-004; FR-PRT-21). A tax tool's fee is on the processor's pricing page (S6 in the print file).
  - **What I did not read.** U: I read no statute, no state revenue page and no marketplace-facilitator rule. I do not know whether a print partner that ships to the buyer counts as a facilitator for any state, or whether our own sales would pass a nexus threshold in any state.
  - **Apple.** CR-120 says Apple collects and remits tax on in-app purchases (Unverified). This does not cover a book sold outside in-app purchase (Q134 route 1).
- **(a)** For a book we sell and a partner prints and ships, who has the duty to collect tax in each state: the partner (as a facilitator or otherwise), the payment processor, or us? Does it differ by state?
- **(b)** At the pilot size in Q-PRT-13 (50 orders a month), does any state require registration, and does shipping to a state create a duty?
- **(c)** Does a seller that is an individual rather than an entity change the answer (Q47)?
- **(d)** Is a tax tool enough, or must the state list be settled before the first order? Is a book taxable in the states we would ship to, and does a personalised book differ?
- **Default.** The accountant settles the states and the tool before the first order; the pilot ships only to states where that is settled; the order page shows tax as a computed line, never an estimate (FR-PRT-20, -21). If the answer is not in hand, the pilot is closed.
- **If no.** If a state requires registration, the pilot excludes it until done.
- **Deadline.** Before the print flag turns on in `production`; no calendar date (ruling T5). This is also an accountant question; counsel and the accountant may answer it together.
- **Blocks.** NS-30 print sale. Nothing now.

### 10.5 Q136 (new). California total-price display for a printed book (SB 478; Q-PRT-4)
- **Facts.**
  - **What the page says.** The California Attorney General's SB 478 page says advertised or listed prices must include all mandatory fees and charges; government-imposed taxes such as sales tax may be left out of the displayed price; reasonable shipping costs for physical goods may be left out, while handling charges may not; optional fees and fees triggered by later conduct need not be included; card-processing fees need not be included if the buyer can pay another way, but are mandatory if only cards are accepted. It covers most sellers of goods or services for personal use, online or in person. Effective 1 July 2024; Civil Code 1770(a)(29); amended by SB 1524. V (read on 24 Nov 2026 from https://oag.ca.gov/hiddenfees; the Attorney General's summary, not the statute).
  - **Not read.** U: I did not read the statute text on leginfo.legislature.ca.gov (the page did not load in my session on 24 Nov 2026), the Attorney General's FAQ PDF, or SB 1524.
  - **The product.** The proposed order page shows the book, copies, shipping, tax and a total before any payment step, with no strike-through price (FR-PRT-20). The $59 first copy with US shipping and $39 each extra figures are proposals only; no price is fixed (Q-PRT-4).
- **(a)** For a book listed at a price "with shipping", does SB 478 as read by counsel require the displayed price to include any charge we would call shipping or handling, and what is the difference between the two for a print partner's per-order fee?
- **(b)** Does a processing fee, a partner fee or a rush option fall in "mandatory", "optional" or "later conduct"?
- **(c)** Does the statute apply to an app that opens a hosted page, and where must the all-in price appear (the app, the hosted page, or both)?
- **(d)** Does any other state's rule on price display matter for the states we would ship to?
- **Default.** One screen shows the book, copies, shipping (included or the amount), tax and total before any payment step; any price shown before checkout is the price including every mandatory charge and excluding only tax; no price before the parent has seen the preview.
- **If no.** The price screen follows counsel's list of what may sit outside the displayed price.
- **Deadline.** Before the print flag turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-30 print sale and the price screen. Nothing now.

### 10.6 Q137 (new). Children's-product rules (CPSIA) for a keepsake book (Q-PRT-8)
- **Facts.**
  - **What the pages say.** The CPSC's page on children's products describes a children's product as a consumer product designed or intended primarily for children 12 years of age or younger, and says the Commission looks at the maker's stated use and labels, how it is presented in packaging and promotion, whether it is commonly recognised as for young children, and the Age Determination Guidelines. Its FAQ mentions books and magazines once, saying the principles for art materials apply, and that age guidance from librarians, educators and publishers helps. The CPSC's Children's Product Certificate page says manufacturers and importers issue a certificate based on a third-party lab's tests for products subject to a children's product safety rule, and that some products are exempt or excepted but still need a certificate citing the exemption. V (read on 24 Nov 2026 from https://www.cpsc.gov/Business--Manufacturing/Business-Education/Childrens-Products and https://www.cpsc.gov/Business--Manufacturing/Testing-Certification/Childrens-Product-Certificate; summaries, not quoted).
  - **Not read.** U: neither page says whether a printed paper book is subject to any children's product safety rule; I did not read the CPSIA text, any rule on lead in inks or on tracking labels, or any state rule (California and other states have their own chemical rules; none was read).
  - **The product.** The book is named for a baby but is an adult-bought keepsake of a parent's words, made by a print partner; it is not a toy or a baby product. The print file marks CPSIA as UNVERIFIED and lists it under Q-PRT-8.
- **(a)** Is a printed keepsake book of a parent's letters to a baby a "children's product" for CPSIA, given the factors above, and does the name "Year One" or a baby's name matter?
- **(b)** If yes, is any children's product safety rule applicable to a paper book, and who would issue the certificate: the partner as manufacturer, or we as the seller who has the book made (Q47)?
- **(c)** What state rules on inks or paper for a product sold to a baby's parent, if any, should be checked, and does the partner's own compliance statement help?
- **(d)** Does any age statement on the book or the product page (for example "for baby") change (a)?
- **Default.** Assume no children's product rule applies until counsel says; no age statement and no use by or near a baby is claimed on the product page; the partner is asked, in writing, for its own compliance statement for ink and paper before any order.
- **If no.** If a rule applies, the print flag stays off until the certificate route and the partner's duty are settled.
- **Deadline.** Before the print flag turns on in `production`; no calendar date (ruling T5).
- **Blocks.** NS-30 print sale. Nothing now.

### 10.7 Q138 (new). The licence of fonts embedded in a printed or shared PDF, and an emoji face (Q-PRT-9; CR-123)
- **Facts.**
  - **What the page says.** The SIL Open Font License text published on openfontlicense.org lets people use, study, copy, modify and redistribute the font, provided it is not sold by itself; it may be bundled or sold with other software. Each copy of the font must carry the copyright notice and the licence. A modified version may not use a Reserved Font Name without written permission. The font, including modified versions, stays under the OFL. The page says the licence's terms do not apply to documents made with the font; it does not say whether embedding a font in a PDF is "bundling" or "redistribution" (it points to an FAQ I did not see). V (read on 24 Nov 2026 from https://openfontlicense.org/open-font-license-official-text/; summary, not quoted). I did not read scripts.sil.org.
  - **The product.** Literata, Mukta and Tiro Devanagari Hindi are recorded as SIL OFL 1.1 in `packages/design-tokens/src/tokens.ts` (print file, S-list). An Arabic and a Han face for print are UNVERIFIED as bundled, and whether any emoji face would be bundled for print is open (FR-PRT-10, -11). Apple's system fonts are never embedded (FR-PRT-10). A character no allowlisted face covers is left as a blank, with the parent choosing what to change (FR-PRT-11; Q-PRT-9). CR-123 lists the Settings licence screen and a generated notices file as the open-source licence answer.
  - **Not read.** U: the OFL FAQ on embedding in PDFs; the licence of any emoji face (some emoji sets are under other licences; I do not know which one we would use); the font files' own licence notices; whether the notices file lists fonts.
- **(a)** Is embedding an OFL font in the PDF we give a parent (the free file, NS-07) or send to a print partner (NS-30) a use that needs the notice or any other step, beyond what applies to a document made with the font?
- **(b)** Which notice (copyright and licence text) must we keep, and where: the notices file, Settings licences, or inside the book or file?
- **(c)** If an emoji face were bundled for print, is a face under OFL enough, or must a licence be checked face by face? Is there any rule on printing an emoji set that is a trademark or artwork of a platform?
- **(d)** The partner prints our PDF: does it need anything from us about the fonts?
- **Default.** Embed only OFL faces on the allowlist; keep each face's notice in the generated notices file and Settings licences (CR-123); no emoji face for print and no system font; a character no face covers prints as a blank and the parent chooses what to change (FR-PRT-11). A font licence record is kept for each face before the file is built (FR-PRT-10).
- **If no.** If counsel names a notice or a limit for embedded faces, the notices file and the file preflight follow it. If an OFL face cannot be embedded in a PDF, the face is replaced by another counsel clears.
- **Deadline.** Before the printable file (NS-07) embeds any face we have no licence record for, and before any emoji face is bundled; no calendar date (ruling T5).
- **Blocks.** NS-07 if it embeds a face with no record; an emoji face for print; NS-30.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.10.0 | 2026-11-24 | Adds section 10 (Q133 to Q138) for the printed-book rows `print-and-fulfilment.md` Q-PRT-4, -5, -6, -8, -9 and register rows CR-054, CR-120, CR-123, which had no packet number. Source pages read 24 Nov 2026 and unread items are tagged V and U in each question. Sections 1 to 9 unchanged. SB 478 and CPSIA are not in the compliance register; rows proposed in the pull request. Version 1.10.0 because 1.9.0 is used. Legal Drafting (Claude, `legal`), not a lawyer. |
| 1.9.0 | 2026-11-21 | Adds section 9 (Q123 to Q132, Moments tab, NS-53; merged in #1316) above this Changelog, where it was first appended after it. Q129 default corrected to the founder's O-44 decision of 21 Nov 2026 (disclose the iPhone backup in one plain policy line; do not exclude the folder); the 9.2 index row and the C-3 note in `PRIVACY-CONTRADICTIONS.md` follow. Version 1.9.0 because 1.8.0 is used by #1057 (POLICY_VERSIONING 2.4). Legal Drafting (Claude, `legal`), not a lawyer. |
| 1.8.0 | 2026-11-20 | Adds section 8 (Q109 to Q122) for the locked cards NS-46 to NS-52 (`21-days-cultural-photos-home.md`, `27-photo-moments-and-media.md`, `develop` 9e4757459dc3): CUL-Q5, Q6 (widened to religion by inference, with the controller and US-storefront sub-questions), Q7, Q11 (now Q112, not Q41), Q14; FR-DAY-23 (the right to use source tables); tradition-reviewer records; L-14 to L-19; C-9 to C-11 with the Journaling picker terms. Version 1.8.0 because 1.7.0 is used and #598 names 1.6.0 (POLICY_VERSIONING 2.4). Legal Drafting (Claude, `legal`), not a lawyer. |
| 1.7.0 | 2026-11-20 | Adds section 7 (BL-949): the questions raised by the locked new-scope pack (`docs/prd-lock-v1-20nov` at 450bcb4a) and its engineering designs of 20 Nov. Repeated questions are merged into Q32, Q40, Q41, Q43 to Q46, Q48 to Q51 and Q54, with new lettered parts. Two are new: Q107 (a sealed letter and the child who may read it later) and Q108 (earlier versions already on our server, which the policy does not name). Q107 is the first free number, because open drafts claim Q58 to Q106 (#598, BL-780, #760). Twelve cited questions are unchanged (7.16). Section 6 gains items 9 to 12. Version 1.7.0, because #598 names 1.6.0 for its renumbering of Q58 to Q60 (POLICY_VERSIONING 2.4). Legal Drafting (Claude, `legal`), not a lawyer. |
| 1.5.0 | 2026-11-01 | Adds Q57 (sanctions: the D-131 country block, no name screening under D-137, the Privacy 12 country-check wording under D-136). Chief Legal Officer (Claude role, not a lawyer), CLO-3. |
| 1.4.0 | 2026-10-31 | Terms and Subscription Terms are the plain-form 4.1.0 texts. The reviewers' notes that sat inside develop's 4.0.0 texts are carried here: Q41 gains the 31 Oct update (California notices without the amount, the two routes, Unverified items, price-change setting, grace period, federal status); Q40 gains the free-list notes (co-parent writing, the floor, binding promise). Full notes word for word in `CHANGES-2026-10-31.md`, last section. Version 1.4.0 because 1.3.0 is used (POLICY_VERSIONING 2.4). |
| 1.3.0 | 2026-10-31 | Merge of develop (31 Oct) into the rebuilt packet of PR #163. Kept the 1.1.0 structure; the 1.2.0 product-paragraph prices (D-082) were already in it; the Q14 note on the Terms 4.0.0 free list is carried into the superseded-questions table. Version 1.3.0 because 1.1.0 and 1.2.0 are used (POLICY_VERSIONING 2.4). Also: version list in section 0 brought up to date; Privacy Policy 3.0.0 carries the D-116 exception to the 31-day erasure promise and a drafted "never for marketing" bullet, both unconfirmed; the packet's text about Terms 3.1.0 and Subscription Terms 3.1.0 is superseded by develop's 4.0.0 texts, whose content differs from the server-product wording the packet's questions were written against (see the PR body). |
| 1.2.0 | 2026-10-31 | Product paragraph: Plus prices ($4.99, $49.99), plan names and membership scope per D-082 (review SUB-01, SUB-02). Q14: note on the Terms 4.0.0 free list. Version 1.2.0 because 1.1.0 was used by an unmerged draft on another branch (POLICY_VERSIONING 2.4). |
| 1.1.0 | 2026-10-16 | Rebuilt for option B and the founder's 15 Oct direction for legal pages: a one-page table of what changed; R4's twelve questions in R4's order (Q41 to Q52); Q53 to Q56; #81's Q32 to Q40 restated (Q32 is now the health notice question, with the separate notice removed); the 1.0.0 questions with their status; and the code checks of the services the texts name. 16 Oct: the review of PR #163 (two reviews) found claims the code contradicts or has not built; the drafts now describe only built features or say a feature is not available yet, and section 0 lists each. Decision ids follow develop (D-100 to D-108). The 1.1.0 addendum drafted in PR #81 was never merged; its questions are carried here. |
| 1.0.0 | 2026-10-03 | First consolidated packet, prepared with the legal alignment to D-051 to D-070. |
