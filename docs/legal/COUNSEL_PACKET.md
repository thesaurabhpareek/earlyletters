---
title: Counsel packet, Early Letters v1.0 (option B) and after
version: 1.1.0
status: for counsel
date: 2026-10-16
owner: founder
prepared_by: AI (Claude), legal drafting support (stream S17); not legal advice
---

> **This packet was prepared by an AI. It is not legal advice, and no attorney-client relationship exists.** It collects every open legal question about the v1.0 build the founder chose on 15 Oct 2026 (option B), as questions, not conclusions. Each has a default the product follows if counsel has not answered by the date named; dates are milestone ids from PRD V2 `docs/prd/v2/08-delivery.md` section 2.1 (branch `docs/prd-v2`, PR #124). Facts are tagged **V** (verified on a page or file opened, with the date), **S** (secondary) or **U** (unverified). Source checks are in `BENCHMARK.md`. The published drafts contain no notes for counsel by the founder's direction of 15 Oct; everything counsel must confirm is here and in the pull request description.

## 0. How to use this packet

**The product, in one paragraph (option B).** Early Letters is an iOS memory book for adults (18 and over only) who speak or type letters to their child. Speech becomes text on the phone; no audio or text goes to any speech or AI service. People can start without an account; signing in (Apple, or an emailed link and code) syncs letters to Supabase in the US after a separate sensitive-data consent, and lets two parents share a child's book as equals. The owner's recordings can be backed up, free, off until turned on, with its own consent: each recording is encrypted on the phone, the encrypted copy is stored in a private Supabase Storage bucket, and we keep an escrow copy of the key. The escrow private key is a function secret in a separate Supabase project (`scribe-escrow`) that runs only the recovery service, and is also on two sealed paper copies. The service writes an append-only log row for every key it opens (reasons: restore, rotation, legal), holds a restore 24 or 72 hours, takes approval only from a device enrolled at least 7 days before the request (D-108), and emails the owner on request, on release and on rotation (D-102 wording). The server side is on `feat/backup-server` (ad222eb, PR #151, not merged); the phone side is not built, so the drafts say backup is not available yet. Plus is the membership after 2 free letters: US $4.99 a month with the first month free, or US $49.99 a year with the first 2 months free, sold only by Apple, shared through Family Sharing. D-080 and D-081 plan a status report (plan, trial end, renewal date, cancelled flag) and a consent record so that we can email the auto-renewal reminders; neither is built (the `subscription-status` handler is a shell), so the drafts say our servers do not receive purchases. Phone reminders and a purchase confirmation with Save a copy are built (D-094). No analytics or crash reporting in v1.0 (D-095). US App Store only. Published by the founder as an individual (D-004).

**Decisions behind it.** Founder, 13 and 14 Oct (PR #128, D-100 to D-108). Delegated, 15 Oct (PR #122, D-093 to D-099). Founder, 15 Oct: option B, backup free for everyone; and the direction for legal pages (plain, short, no internal references, name only services the code uses, no separate health notice pending Q32).

**The calendar (PRD V2 08 section 2.1).** T05 Fri 23 Oct: this packet to counsel. T17 Fri 13 Nov: counsel comments. T19 Mon 23 Nov: switch-on internal TestFlight. T20 Tue 1 Dec: legal pages live as drafts. T22 Mon 7 Dec: first outside families. T27 Mon 18 Jan 2027: backup on for C1 families who opt in. T32 Fri 1 Jan 2027: California AB 1043. T30 by Fri 23 Apr 2027: counsel sign-off. T36 3 to 5 May 2027: submission.

**Priorities.** **A** blocks the first outside family (T22) or submission. **B** before a dated event in the row. **C** before a later feature.

**What is in the packet (branch `docs/legal-v1-server`).** Published drafts: Privacy Policy 2.1.0, Terms of Service 3.1.0, Subscription Terms 3.1.0, service providers 2.1.0, delete-account page copy 1.0.0. Internal: in-app disclosures 3.1.0, App Privacy answers 1.4.0, ENGINEERING_REQUIREMENTS 1.3.0, POLICY_VERSIONING 1.2.0, compliance register 1.4.0 (facts only), DATA_CLASSIFICATION 1.5.0 (backup tables, section 4.3.1), BENCHMARK 1.1.0. The separate Consumer Health Data Privacy Policy is removed pending Q32; its last text is in git history. **Not yet updated for option B** (S17 follow-ups): `data-policy.md` 1.2.0, `DATA_CLASSIFICATION.md` outside section 4.3.1, `DELETION_AND_EXPORT_SPEC.md` 1.2.0, and the dated memos in `memos/`, which are records of 2 and 3 Oct.

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
- **Default.** Phone reminders as built; if the status report ships, the billing-notice record is kept until the subscription ends and the consent record is pseudonymised; no code over 31 days free. **Deadline.** T17. **Drafts.** Terms 8; Subscription Terms; Privacy 2, 7, 10.

### Q42 (A). Recording backup with escrow (R4 question 2; PT-01, PT-02, PT-22, PT-24)
- **Questions.** (a) Is Privacy 4 enough, including its sentence that someone with the recovery key and a copy of our stored data could open backups without the recovery service, a log entry or an email? Supabase hosts every piece: the encrypted files and sealed keys in the main project, and the recovery key as a function secret in the separate escrow project. (f) Privacy 4 says we email the owner on each use except a legal request the law forbids us to disclose; the code emails on restore and rotation, and a legal use has no code path yet. Is that wording right? (b) With us holding a key, is a breach of the backup store a breach of unencrypted personal information for state safe-harbour purposes? (c) Does server-held voice audio make recordings biometric data or consumer health data under MHMDA when no voiceprint is made? (d) Does backup need its own consent act (the build default), or can the sensitive-data consent cover it? (e) Is "We never listen to your recordings" safe as an absolute, given the legal-order use?
- **Default.** As drafted; own consent act; treat a store breach as reportable. **Deadline.** T17; backup consent text before T27.

### Q43 (A). Privacy claims (R4 question 3; PT-03, PT-25, PT-26)
- **Questions.** Approve or replace "Your book is shared only with the co-parent you invite" (sign-in line), "Private by default" (store, app) and the staff line ("We don't look at your letters. The few ways we could are written in our Privacy Policy."). Privacy 3 says letters are not end-to-end encrypted, that we could read them, and when we do; is that enough while dashboard access is not separately logged?
- **Default.** In-app disclosures 3.1.0 section 1. **Deadline.** T17.

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
| Q40 | Narrowed free promises | Restated. Terms 8.4 ("Every letter you keep stays yours to read, play and export") cannot be changed for existing users; Terms 8.1 lists today's free features without that protection. Is that the right line? | As drafted |

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
| Q14 | "Free, always" | Superseded by Q40 |
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
2. **Services the code uses (checked 16 Oct 2026).** Supabase and Resend: in the code on develop. Cloudflare R2: in #126 (`packs.earlyletters.app` for the signed remote config, pack manifest, content bundle and self-hosted speech files), not yet on develop; the drafts name it for exactly that, and this branch merges after #126. Recording backup: in the private Supabase Storage bucket `entry-audio` on `feat/backup-server`, not R2, so the texts say backups are stored with Supabase. Hugging Face: speech model files still download from it, so the texts name it. Sign in with Google: shown only when the build sets `EXPO_PUBLIC_GOOGLE_*` client IDs; the texts leave it out, so a build that sets them needs one added line. PostHog: the SDK is in `package.json` but never constructed while `EXPO_PUBLIC_ANALYTICS` is off. The website on `main` loads Vercel Web Analytics only when `NEXT_PUBLIC_ANALYTICS=vercel`; if production sets it, Privacy 2 and 6 must name it.
3. **The build switch.** Every `eas.json` profile still sets `EXPO_PUBLIC_SERVER_FEATURES` off. These texts describe the switch-on build and must not be published for a build that has it off.
4. **The R-17 gate** (BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322, BL-349) before anyone outside the family signs in (T16).
5. **Strings that contradict the drafts** (in-app disclosures 3.1.0 section 3, requests to S16).
6. **Website.** The site renders `docs/legal` from `main`. Before develop is next merged into main, the website must drop or redirect `/health-privacy` (its loader reads the removed file), point `/delete-account` at `delete-account-page.md`, and add `/subscription-terms`.
7. **Vendor and operations facts in the drafts, not code.** The deletion clock (live systems 31 days, backups 38, providers 45, the email provider's 30-day copy), the quarterly seal check and the two paper copies, two-factor access for the founder, 10 business days to answer a deletion email and 2 years for support email. The founder confirms each; BENCHMARK marks the vendor pages unverified.
8. **S17 follow-ups:** `data-policy.md`, `DATA_CLASSIFICATION.md` outside 4.3.1, `DELETION_AND_EXPORT_SPEC.md`.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.1.0 | 2026-10-16 | Rebuilt for option B and the founder's 15 Oct direction for legal pages: a one-page table of what changed; R4's twelve questions in R4's order (Q41 to Q52); Q53 to Q56; #81's Q32 to Q40 restated (Q32 is now the health notice question, with the separate notice removed); the 1.0.0 questions with their status; and the code checks of the services the texts name. 16 Oct: the review of PR #163 (two reviews) found claims the code contradicts or has not built; the drafts now describe only built features or say a feature is not available yet, and section 0 lists each. Decision ids follow develop (D-100 to D-108). The 1.1.0 addendum drafted in PR #81 was never merged; its questions are carried here. |
| 1.0.0 | 2026-10-03 | First consolidated packet, prepared with the legal alignment to D-051 to D-070. |
