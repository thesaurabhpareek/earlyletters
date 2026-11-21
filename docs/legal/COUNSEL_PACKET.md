---
title: Counsel packet, Early Letters v1.0 (option B) and after
version: 1.7.0
status: for counsel
date: 2026-11-20
owner: founder
prepared_by: AI (Claude), legal drafting support (stream S17); not legal advice
---

> **This packet was prepared by an AI. It is not legal advice, and no attorney-client relationship exists.** It collects every open legal question about the v1.0 build the founder chose on 15 Oct 2026 (option B), as questions, not conclusions. Each has a default the product follows if counsel has not answered by the date named; dates are milestone ids from PRD V2 `docs/prd/v2/08-delivery.md` section 2.1 (branch `docs/prd-v2`, PR #124). Facts are tagged **V** (verified on a page or file opened, with the date), **S** (secondary) or **U** (unverified). Source checks are in `BENCHMARK.md`. The published drafts contain no notes for counsel by the founder's direction of 15 Oct; everything counsel must confirm is here and in the pull request description.

## 0. How to use this packet

**New in 1.7.0 (20 Nov 2026).** Section 7 adds the questions raised by the locked new-scope requirements (cards NS-01 to NS-37) and their engineering designs. It merges each repeated question into the existing number, adds two new ones (Q107, Q108), and marks which block the Build 13 store candidate. Sections 1 to 6 are unchanged apart from section 6 items 9 to 12.

**The product, in one paragraph (option B).** Early Letters is an iOS memory book for adults (18 and over only) who speak or type letters to their child. Speech becomes text on the phone; no audio or text goes to any speech or AI service. People can start without an account; signing in (Apple, or an emailed link and code) syncs letters to Supabase in the US after a separate sensitive-data consent, and lets two parents share a child's book as equals. The owner's recordings can be backed up, free, off until turned on, with its own consent: each recording is encrypted on the phone, the encrypted copy is stored in a private Supabase Storage bucket, and we keep an escrow copy of the key. The escrow private key is a function secret in a separate Supabase project (`scribe-escrow`) that runs only the recovery service, and is also on two sealed paper copies. The service writes an append-only log row for every key it opens (reasons: restore, rotation, legal), holds a restore 24 or 72 hours, takes approval only from a device enrolled at least 7 days before the request (D-108), and emails the owner on request, on release and on rotation (D-102 wording). The server side is on `feat/backup-server` (ad222eb, PR #151, not merged); the phone side is not built, so the drafts say backup is not available yet. Plus is the membership after 2 free letters: US $4.99 a month with the first month free, or US $49.99 a year with the first 2 months free, sold only by Apple, shared through Family Sharing. D-080 and D-081 plan a status report (plan, trial end, renewal date, cancelled flag) and a consent record so that we can email the auto-renewal reminders; neither is built (the `subscription-status` handler is a shell), so the drafts say our servers do not receive purchases. Phone reminders and a purchase confirmation with Save a copy are built (D-094). No analytics or crash reporting in v1.0 (D-095). US App Store only. Published by the founder as an individual (D-004).

**Decisions behind it.** Founder, 13 and 14 Oct (PR #128, D-100 to D-108). Delegated, 15 Oct (PR #122, D-093 to D-099). Founder, 15 Oct: option B, backup free for everyone; and the direction for legal pages (plain, short, no internal references, name only services the code uses, no separate health notice pending Q32).

**The calendar (PRD V2 08 section 2.1).** T05 Fri 23 Oct: this packet to counsel. T17 Fri 13 Nov: counsel comments. T19 Mon 23 Nov: switch-on internal TestFlight. T20 Tue 1 Dec: legal pages live as drafts. T22 Mon 7 Dec: first outside families. T27 Mon 18 Jan 2027: backup on for C1 families who opt in. T32 Fri 1 Jan 2027: California AB 1043. T30 by Fri 23 Apr 2027: counsel sign-off. T36 3 to 5 May 2027: submission.

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

**What counsel is asked.** Each question gives the facts, the questions, the default the product follows until counsel answers, what changes if counsel says no, and what it blocks. Where a card and a design disagree, the card wins, and the entry says so.

**How the numbers work.** A topic that already has a 1.5.0 number keeps it, and its new parts continue its letters. Where a 1.5.0 question has unlettered parts, they count as (a), (b) and so on in the order written. For example, Q46's parts are old Q5, the stored age signal and AB 1043 for earlier installs, so its new part is (d). The two new questions take Q107 and Q108. The numbers in between are claimed by open drafts: Q58 to Q74 by #598, Q75 to Q77 by BL-780, and Q78 to Q106 by #760. A search of every remote branch on 20 Nov found no Q107 or higher.

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

Questions not for counsel are in section 6, items 9 to 12. #760 (open draft) asks about typed occasions and the wording of local reminders for the Memory Library (its Q103 to Q105). NS-18 raises the same facts, so counsel can answer them together.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.7.0 | 2026-11-20 | Adds section 7 (BL-949): the questions raised by the locked new-scope pack (`docs/prd-lock-v1-20nov` at 450bcb4a) and its engineering designs of 20 Nov. Repeated questions are merged into Q32, Q40, Q41, Q43 to Q46, Q48 to Q51 and Q54, with new lettered parts. Two are new: Q107 (a sealed letter and the child who may read it later) and Q108 (earlier versions already on our server, which the policy does not name). Q107 is the first free number, because open drafts claim Q58 to Q106 (#598, BL-780, #760). Twelve cited questions are unchanged (7.16). Section 6 gains items 9 to 12. Version 1.7.0, because #598 names 1.6.0 for its renumbering of Q58 to Q60 (POLICY_VERSIONING 2.4). Legal Drafting (Claude, `legal`), not a lawyer. |
| 1.5.0 | 2026-11-01 | Adds Q57 (sanctions: the D-131 country block, no name screening under D-137, the Privacy 12 country-check wording under D-136). Chief Legal Officer (Claude role, not a lawyer), CLO-3. |
| 1.4.0 | 2026-10-31 | Terms and Subscription Terms are the plain-form 4.1.0 texts. The reviewers' notes that sat inside develop's 4.0.0 texts are carried here: Q41 gains the 31 Oct update (California notices without the amount, the two routes, Unverified items, price-change setting, grace period, federal status); Q40 gains the free-list notes (co-parent writing, the floor, binding promise). Full notes word for word in `CHANGES-2026-10-31.md`, last section. Version 1.4.0 because 1.3.0 is used (POLICY_VERSIONING 2.4). |
| 1.3.0 | 2026-10-31 | Merge of develop (31 Oct) into the rebuilt packet of PR #163. Kept the 1.1.0 structure; the 1.2.0 product-paragraph prices (D-082) were already in it; the Q14 note on the Terms 4.0.0 free list is carried into the superseded-questions table. Version 1.3.0 because 1.1.0 and 1.2.0 are used (POLICY_VERSIONING 2.4). Also: version list in section 0 brought up to date; Privacy Policy 3.0.0 carries the D-116 exception to the 31-day erasure promise and a drafted "never for marketing" bullet, both unconfirmed; the packet's text about Terms 3.1.0 and Subscription Terms 3.1.0 is superseded by develop's 4.0.0 texts, whose content differs from the server-product wording the packet's questions were written against (see the PR body). |
| 1.2.0 | 2026-10-31 | Product paragraph: Plus prices ($4.99, $49.99), plan names and membership scope per D-082 (review SUB-01, SUB-02). Q14: note on the Terms 4.0.0 free list. Version 1.2.0 because 1.1.0 was used by an unmerged draft on another branch (POLICY_VERSIONING 2.4). |
| 1.1.0 | 2026-10-16 | Rebuilt for option B and the founder's 15 Oct direction for legal pages: a one-page table of what changed; R4's twelve questions in R4's order (Q41 to Q52); Q53 to Q56; #81's Q32 to Q40 restated (Q32 is now the health notice question, with the separate notice removed); the 1.0.0 questions with their status; and the code checks of the services the texts name. 16 Oct: the review of PR #163 (two reviews) found claims the code contradicts or has not built; the drafts now describe only built features or say a feature is not available yet, and section 0 lists each. Decision ids follow develop (D-100 to D-108). The 1.1.0 addendum drafted in PR #81 was never merged; its questions are carried here. |
| 1.0.0 | 2026-10-03 | First consolidated packet, prepared with the legal alignment to D-051 to D-070. |
