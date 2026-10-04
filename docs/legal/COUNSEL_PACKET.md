---
title: Counsel packet, Early Letters v1.0 and after
version: 1.0.0
status: for counsel
date: 2026-10-03
owner: founder
prepared_by: AI (Claude), legal and privacy counsel support (legal-alignment agent)
---

> **This packet was prepared by an AI. It is not legal advice.** No attorney-client relationship exists. It collects, in one prioritised list, every open legal question in `docs/legal/` (Terms 1.5.0, Subscription Terms 1.4.0, Privacy Policy 1.4.0, Consumer Health Data Privacy Policy 1.2.0, in-app disclosures 1.4.0, privacy labels 1.3.0, subprocessors 1.3.0, data-policy 1.2.0, deletion spec 1.2.0, LEGAL-REQ 1.2.0, compliance register 1.3.0, DATA_CLASSIFICATION 1.4.0, POLICY_VERSIONING 1.1.0, the memos), `docs/agents/DEBATES.md`, `docs/DECISIONS.md` and the future backlog (`docs/backlog/future/01` to `05`). Facts are tagged **V** (verified on an opened page or file), **S** (secondary source) or **U** (unverified). Every question has a default that the product follows if counsel does not answer by the deadline.

## 0. How to use this packet

- **The product, in one paragraph.** Early Letters is an iOS memory book for adults (18+ only) who speak or type letters to their child. Transcription runs on the phone in seven languages. Recordings never leave the phone in v1.0. Letter text syncs to Supabase (US) once the person signs in (Apple, Google or email link) and gives a separate sensitive-data consent. Co-parents share a book; other family members come later. Plus ($3.99 a month or $29.99 a year, with free trials) is sold only through Apple, checked on the phone, shared through Apple Family Sharing, and gates only Read together after 3 free sessions per book and books for more children. Analytics are opt-in PostHog. US App Store only. Published by the founder as an individual. Founder decisions: `docs/DECISIONS.md` D-051 to D-070.
- **The calendar (ROADMAP 2.0).** Package to counsel Fri 9 Oct. External TestFlight beta (15 to 25 families) from Mon 19 Oct. Answers after **Fri 23 Oct** move the submission date. Feature freeze Mon 26 Oct (anything that needs code must be decided before). Counsel sign-off and legal pages published **Thu 29 Oct**. App Privacy answers and store listing Fri 30 Oct. **Submit 2 to 6 Nov.** Release 9 to 20 Nov. First Plus trial reminders from about 2 Dec. California AB 1043 applies from 1 Jan 2027. v1.1 about 6 to 8 weeks after launch.
- **Priorities.** **A** blocks submission (answer by 23 Oct unless stated). **B** needed before release, before the external beta, or before a dated event. **C** needed before a later feature ships.
- **Time estimate for counsel:** tier A about 6 to 8 hours; tier B about 3 hours; tier C as each feature comes.

## 1. The top 10

| Rank | # | Question | Deadline |
|---|---|---|---|
| 1 | Q1 | Individual publisher: personal exposure, notices address, and Apple guideline 5.1.1(ix) | 23 Oct (texts); 27 Nov (entity hedge) |
| 2 | Q8 | Q-003: subscription notices and records with Apple-only billing and no server | 23 Oct (Terms text); 29 Oct (rest) |
| 3 | Q2 | Washington MHMDA consent: one consent or two, a parent's consent for a child's data, other people's health data in a letter | 23 Oct |
| 4 | Q5 | Age: Texas SB 2420 now and California AB 1043 from 1 Jan 2027 | 29 Oct (v1.0); 20 Nov (AB 1043 release plan) |
| 5 | Q7 | Q-005: privacy label "Linked" or "Not linked" for analytics | 29 Oct |
| 6 | Q4 | COPPA: an adults-only app about a child; a baby's voice in a parent's recording | 29 Oct |
| 7 | Q9 | Training-data terms behind the Hindi and Mandarin speech models | 23 Oct |
| 8 | Q10 | Trademark clearance for "Early Letters" given the App Store name collision | 23 Oct (search); before submission (opinion) |
| 9 | Q15 | Liability cap and carve-outs for an individual publisher holding children's letters | 23 Oct |
| 10 | Q6 | Q-004: a spoken-language code in opt-in analytics | 16 Oct (before the external beta) |

## 2. Summary of every question

| # | Tier | Title | Deadline | Default if unanswered |
|---|---|---|---|---|
| Q1 | A | Individual publisher and 5.1.1(ix) | 23 Oct / 27 Nov | Publish as an individual; mailing address; entity started only if the founder chooses by 27 Nov |
| Q2 | A | MHMDA and Connecticut consent design | 23 Oct | One sensitive-data consent before first sync; no second consent at co-parent invite; HN-5 runbook |
| Q3 | A | Consumer Health Data policy content and "homepage" links | 23 Oct | Link from the website footer, the App Store description and Settings |
| Q4 | A | COPPA scope | 29 Oct | Does not apply; `child-input` flag off |
| Q5 | A/B | Age assurance (Texas SB 2420, California AB 1043) | 29 Oct / 20 Nov | 18+ gate plus Declared Age Range in memory; a 1.0.x before 1 Jan 2027 that requests the signal |
| Q6 | B | Q-004 language code in analytics | 16 Oct | Ship option (a), the closed seven-code list on two events |
| Q7 | A | Q-005 label linkage | 29 Oct | Declare Linked; tracking section empty |
| Q8 | A | Q-003 subscription notices | 23 Oct / 29 Oct | The memo's position: Apple's receipts plus on-device reminders; no emails; per-release evidence |
| Q9 | A | Speech model training-data terms | 23 Oct | Do not host the Hindi fine-tune; Hindi uses the shared model; Belle stays a candidate |
| Q10 | A | Trademark | 23 Oct / 2 Nov | Proceed under the name; file intent-to-use if the search is clear |
| Q11 | A | Processor contracts (Resend, Cloudflare R2, Vercel, PostHog, Supabase entity) | 23 Oct | Accept the vendors' standard DPAs as listed |
| Q12 | B | IP address plus a language-revealing file name at download hosts | 29 Oct | Disclose (Privacy Policy 8); mirror models to our host later |
| Q13 | A | Deletion clock and the email provider's 30-day copy | 23 Oct | State the exception; keep the completion email |
| Q14 | A | "Free, always" promise scope | 23 Oct | As drafted, co-parent scope only |
| Q15 | A | Liability cap, carve-outs, indemnity | 23 Oct | Greater of 12 months' fees or $50; carve-outs in 21.2; keep the narrow indemnity |
| Q16 | A | Binding promises (no training, never imitate a voice, faithful transcription, 90-day shutdown, successor) | 23 Oct | Keep all |
| Q17 | A | Claims registry: "Your recordings stay on this phone" and the trust lines | 23 Oct | Approve as qualified in the Privacy Policy |
| Q18 | A | Arbitration, custom EULA, support phone number | 23 Oct | Courts plus small claims; custom EULA; a real phone number |
| Q19 | B | Pre-account local use (browsewrap) | 29 Oct | Sign-in-wrap only, plus the 18+ gate |
| Q20 | B | CCPA, CalOPPA and other state laws | 29 Oct | Comply voluntarily; no "Limit" link |
| Q21 | B | Staff-access and transparency commitments | 29 Oct | "Logged through our support tools"; keep the request-count commitment |
| Q22 | C | Launch geography and overseas family | Before family members ship; DPDP by May 2027 | US storefront only |
| Q23 | A | Security review findings with legal effect | Before 19 Oct (H1); before submission (H3) | Fix before the external beta and submission |
| Q24 | B | Export classification (encryption) in App Store Connect | 30 Oct | "Uses only exempt standard encryption" |
| Q25 | B | Support resources row ("If you are struggling") | 16 Oct | Verified national resources; general-information disclaimer |
| Q26 | B | Retention periods marked "proposed" | 29 Oct | Adopt as proposed |
| Q27 | B | CSAM reporting, legal process, custody disputes, DMCA | Before release | Counsel-led runbook; no proactive scanning |
| Q28 | B | Breach readiness: state laws and the FTC Health Breach Notification Rule | Before release | Treat HBNR as applicable for readiness |
| Q29 | C | Account deletion in a shared book; fiduciaries and legacy access | Before v1.1 | Deletion removes the author's letters; executor runbook later |
| Q30 | C | Later features (counsel batch from the future backlog) | Before each feature | Not built until answered |
| Q31 | B | Draft legal text for TestFlight testers (DEBATES Q-009) | 16 Oct | Publish drafts as 0.9.0 to C0 and C1 only; counsel text as 1.0.0 with re-consent |

## 3. Tier A: blocks submission

### Q1. Individual publisher, personal exposure and Apple guideline 5.1.1(ix)
- **Context.** The founder publishes under a personal Apple Developer account with no company (D-004, restated D-064). The founder's legal name is the App Store seller and must appear in the Terms (Apple's minimum EULA terms require the developer's name and address, Terms 26.1(h)) and the privacy notices. There is no liability shield. Apple 5.1.1(ix) (opened 3 Oct 2026): apps that "require sensitive user information should be submitted by a legal entity that provides the services, and not by an individual developer." The app is about a child, declares Sensitive Info (due date) on its label and publishes a Consumer Health Data policy. D-004 rates the rejection risk medium likelihood, high impact; the fallback (entity, D-U-N-S, organisation account, likely a new app record) takes about 2 to 6 weeks (U).
- **Questions.** (a) May "we" refer to an individual throughout, and may the notices use a mailing address (PO box or mail service) rather than a home address, for each notice that needs one (Terms 26.1(h), CAN-SPAM if commercial email ever starts, privacy notices)? (b) Does anything in the drafts increase personal exposure beyond what an entity would face (for example the non-amendable promises in Terms 13 and 17)? (c) Is our 5.1.1(ix) mitigation (Lifestyle category, no health language in metadata, review notes describing a family journal where the due date is optional) reasonable, and should the founder start an entity in parallel now? (d) Which insurance (technology errors and omissions, cyber) is worth pricing for an individual holding children's letters? (e) When an entity is formed later, is moving the Terms and privacy notices to it a "major" change needing re-consent (POLICY_VERSIONING 2.1 item 9)?
- **Default if unanswered.** Publish as an individual with a mailing address; no entity until the founder decides by 27 Nov (D-004 hedge); answer any 5.1.1(ix) question from App Review within a day.
- **Deadline.** 23 Oct for (a) and (b), because the name and address go into the published texts on 29 Oct. 27 Nov for (c), the D-004 hedge date.
- **Documents.** Terms 1.1, 26.1(h), 27.3, 28, counsel note at the top; Privacy Policy 1, 20, CN-1; CHD policy 7, HN-10; Subscription Terms "Questions"; register CR-130; DECISIONS D-004, D-064; ROADMAP 7.

### Q2. Washington MHMDA and Connecticut consent design
- **Context.** Letters are free text and can hold health details about the parent, the child or a third person; the due date reveals a pregnancy. MHMDA has no revenue threshold and a private right of action (register CR-031, RCW 19.373 opened 2 Oct). The app asks for one separate "sensitive-data" consent after account creation and before the first sync, and the server refuses content writes without it (`can_write_content()`, SQLSTATE `SCCON`). The live consent text (`sensitiveConsent.body`) still says "share it with the family you choose"; v1.0 is co-parent only (D-055), so the content owner must change it to "your co-parent".
- **Questions.** (a) Is one consent enough, or does sharing with a co-parent need a second "separate and distinct" consent at the first invite (RCW 19.373.030; D-050)? With co-parents only, is sharing "necessary to provide" the book the person requested? (b) The Act has no parent or guardian mechanism: can a parent's consent cover health data about their child? (c) A letter by one author about another adult's health (HN-5): how do we honour that adult's deletion request when only the author may delete their words? (d) Connecticut: does stopping sync and offering deletion satisfy the reported 15-day stop-processing rule on revocation (U), or must synced letters be erased? (e) Is the proposed consent text (CHD policy HN-4) compliant: categories, purpose, recipients, how to withdraw?
- **Default if unanswered.** One consent before first sync with the HN-4 text naming the co-parent; no second consent; the HN-5 runbook (ask the author; if no action in 45 days, take the letter out of the shared book and keep it in the author's private letters); withdrawal stops sync and offers deletion.
- **Deadline.** 23 Oct; a second consent would be code and must be decided before feature freeze on 26 Oct.
- **Documents.** CHD policy 4, HN-4, HN-5; Privacy Policy 13, CN-16; LEGAL-REQ-006; register CR-020, CR-031; `packages/content` `sensitiveConsent`; DECISIONS D-050.

### Q3. Consumer Health Data policy content and "homepage" links
- **Context.** Washington requires a separate CHD privacy policy linked prominently from the "homepage", which includes the app's download page (RCW 19.373.010, .020). `store.en.ts` ends with Terms and Privacy links only; the website thread builds `/health-privacy` (D-063).
- **Questions.** (a) Does the CHD policy 1.2.0 meet RCW 19.373.020's content list? (b) Is a third legal line in the App Store description ("Consumer Health Data Privacy Policy: https://earlyletters.com/health-privacy") plus a website footer link and a Settings link enough? (c) Does MHMDA apply in the same way to an individual "regulated entity"?
- **Default.** Add the store description line (request to the content owner), the website footer link and the Settings > Legal row.
- **Deadline.** 23 Oct (store listing approved 30 Oct; website live 19 Oct).
- **Documents.** CHD policy (all), HN-6, HN-10; in-app disclosures 4; Privacy Policy 2, 13, 16; `packages/content/src/store.en.ts`.

### Q4. COPPA scope
- **Context.** Users are adults; the child never signs in or uses the app; information about the child comes from the parent (FTC COPPA FAQ A.8, opened 2 Oct). Recordings never leave the phone in v1.0. Features that would prompt a child to speak (`together` prompts, sibling letters) sit behind the `child-input` flag, off in production until a written opinion (LEGAL-REQ-059). The amended Rule's compliance date was 22 April 2026 (S).
- **Questions.** (a) Confirm COPPA does not apply to v1.0 as designed. (b) Confirm in writing that a baby's or toddler's voice in the background of a parent's recording is information provided by the parent, not collected from the child. (c) Should we still adopt the written retention policy and security programme the amended Rule describes (we recommend yes; `data-policy.md` is the retention policy)?
- **Default.** COPPA does not apply; flag stays off; adopt the written programme anyway.
- **Deadline.** 29 Oct.
- **Documents.** Privacy Policy 12, CN-2; register CR-001, CR-002; LEGAL-REQ-045, -059; future backlog CVL-19 (Q30).

### Q5. Age assurance: Texas SB 2420 now, California AB 1043 from 1 Jan 2027
- **Context.** The app asks "Are you 18 or older?" before first use, stores only a boolean (D-026), repeats the confirmation at sign-in, and uses Apple's Declared Age Range in memory where available. Texas SB 2420 is reported in effect in 2026 with developer duties to use the store's age category and parental-consent signals (register CR-004, S). California AB 1043 takes effect 1 Jan 2027: a developer must request the age signal "when the developer's app is downloaded and launched", and receiving a signal gives "actual knowledge" of the age range; penalties up to $2,500 (negligent) and $7,500 (intentional) per affected child (Kelley Drye FAQ, S, opened 3 Oct 2026). v1.1 lands after 1 Jan 2027, so a 1.0.x release may be needed (T5-15).
- **Questions.** (a) Is a neutral self-declaration plus Declared Age Range enough for an adults-only general-audience app today? (b) What exactly must change by 1 Jan 2027 for AB 1043 (request the signal at every launch or once; what to do with "unknown")? (c) Is excluding teen parents (under 18) the right call? (d) Is a store signal that a user is a minor "actual knowledge" requiring the `close_underage_account` runbook even when the person said "Yes" at our gate?
- **Default.** v1.0 as built; a 1.0.x in December 2026 that requests the OS or store signal at launch, holds it in memory, and treats any minor signal as actual knowledge; teen parents excluded.
- **Deadline.** 29 Oct for (a) and (c); 20 Nov for (b) and (d) so a 1.0.x can ship before 1 Jan 2027.
- **Documents.** Terms 1.5, 2.1; Privacy Policy 2, 12, CN-2; LEGAL-REQ-002; register CR-004, CR-005; DECISIONS D-026; future backlog T5-15.

### Q7. DEBATES Q-005: privacy label linkage for analytics
- **Context.** Opt-in PostHog uses a random ID per consent period, no IP, no person properties, no IDFA or IDFV; nothing on our servers stores or joins it. The phone keeps retired IDs (at most 20) so it can ask the stateless `analytics-forget` function to delete events at account deletion. Apple: data is linked unless de-identified before collection and never re-linked, and "Personal Information and Personal Data, as defined under relevant privacy laws, are considered linked" (quoted in TRACKING_PLAN 10). Plan-state events (`plan_changed`) make Purchases an analytics data type too. The tracking section is empty either way (no third-party data for ads, no brokers).
- **Question.** Is analytics data "Linked" or "Not linked" on Apple's label, given that a random persistent ID is likely CCPA personal information and that we keep the ability to link IDs for deletion? Should the random ID be declared under Identifiers > User ID with the Analytics purpose?
- **Default.** Declare Usage Data, Diagnostics and Purchases (Analytics) as **Linked**, add Analytics to User ID, keep the public no-reidentification commitment in Privacy Policy section 6 (labels 1.3.0 section 1.3 has the full analysis and both manifests).
- **Deadline.** 29 Oct (App Privacy answers are entered by 30 Oct).
- **Documents.** `app-store-privacy-labels.md` 1.2, 1.3, 1.4, 3.3; Privacy Policy 6, CN-18, CN-21; TRACKING_PLAN 10; DEBATES Q-005; future backlog T5-01.

### Q8. DEBATES Q-003: subscription notices and records with Apple-only billing
- **Context.** Plus is Apple-only and checked on the device; no server of ours sees purchases (D-053, ADR 0013). The earlier Subscription Terms promised acknowledgment, trial, renewal and yearly emails and an emailed consent record. Full analysis, verified law texts and eleven sub-questions: `docs/legal/memos/q-003-subscription-notices.md`. Laws checked 3 Oct 2026: California 17602 (V), New York GBL 527-a (V; "app notification" is an allowed channel), Virginia 59.1-207.46 (V; renewal notice only for renewals of more than 12 months), Utah 13-70 (V; renewal notice only for terms over 45 days; trial notice at least 3 days before), Massachusetts 940 CMR 38.00 (V), NYC rule from 1 Oct 2026 (S), ROSCA (S); the FTC's 2024 rule stays vacated and the March 2026 ANPRM is the latest step (V, S).
- **Questions.** Memo C-1 to C-11, in short: (C-1) do the state duties fall on us with Apple as merchant of record; (C-2) are on-device local notifications plus an in-app note a compliant notice, given they fail if the app is deleted or notifications are off; (C-3) is an in-app confirmation with "Save a copy" a retained acknowledgment; (C-4) Massachusetts monthly receipts; (C-5) proof of consent held only by Apple plus our per-release evidence; (C-6) does California's yearly reminder reach monthly plans; (C-7) Virginia scope; (C-8) NYC scope; (C-9) does "keep current price for existing subscribers" keep the Terms' price promise; (C-10) ROSCA disclosure through Apple's store view; (C-11) the server fallback if C-2 or C-4 is "no".
- **Default.** The memo's position: Apple's receipts and price-change messages; on-device reminders in the D-022 windows on the purchaser's phones; in-app confirmation with Save a copy; existing subscribers keep their price; no emails; per-release evidence instead of per-purchase records.
- **Deadline.** 23 Oct for C-1 to C-3 (Terms and Subscription Terms text, and the scheduler before feature freeze); 29 Oct for C-4 to C-10; C-11 before the first trial reminders (about 2 Dec) if C-2 is "no".
- **Documents.** Terms 14 (all); Subscription Terms (all); in-app disclosures 3; LEGAL-REQ-046 to -050; POLICY_VERSIONING 1, 7.3; register CR-050 to CR-052; DECISIONS D-022, D-049, D-053; ADR 0013; DEBATES Q-003; future backlog G-12.

### Q9. Training-data terms behind the Hindi and Mandarin speech models
- **Context.** ADR 0015 picks per-language models for on-device transcription. The Hindi model is `vasista22/whisper-hindi-small` (Apache-2.0 weights), converted and quantised by us and hosted on our own download host ("ours, not uploaded" yet); its card lists GramVaani, ULCA, Shrutilipi and FLEURS among its training data. The Mandarin candidate `BELLE-2/Belle-whisper-large-v3-turbo-zh` (Apache-2.0) lists AISHELL-2 and HKUST (LDC) data; it is built and hashed but not chosen (ADR 0015 M-1). ADR 0015 notes: "an Apache-2.0 licence on weights does not settle the terms of the data they were trained on." Upstream OpenAI Whisper files (MIT) are downloaded from Hugging Face. A Hindi-English fine-tune is planned for v1.1 (future backlog).
- **Questions.** (a) May we commercially distribute (from our own host, inside a paid app) a converted copy of a model whose weights are Apache-2.0 but whose training sets include data under research-only or restrictive terms (for example LDC corpora or datasets with non-commercial terms)? (b) What attribution and notice must the app's licences screen carry? (c) What diligence is enough (dataset licence review, a written representation from the model author)? (d) The same for any future Hinglish fine-tune: which datasets may we fine-tune on?
- **Default.** Do not upload or ship the Hindi fine-tune until cleared; Hindi uses the shared multilingual model (ADR 0015 says turbo until the Hindi file is hosted). Belle stays a candidate and does not ship.
- **Deadline.** 23 Oct (the Hindi file upload is a founder task before the release build; feature freeze 26 Oct).
- **Documents.** ADR 0015 (training-data caution, M-1, M-2, next steps); register CR-123; `apps/mobile/src/lib/models/catalog.ts`; Settings > Legal > Licences (`packages/content/src/features/licences.en.ts`); future backlog 01 (Hinglish).

### Q10. Trademark clearance and the name collision
- **Context.** "Early Letters" is not cleared (register CR-122; `packages/brand`: "Not yet trademark-cleared"). App Store search for "early letters" returns 19 US apps, all phonics, alphabet or letter-writing apps (pm-4, iTunes Search API, 3 Oct 2026, F). Domains earlyletters.com and earlyletters.app are bought (D-063); the bundle id `com.earlyletters.scribe` is permanent after the first upload.
- **Questions.** (a) Does a clearance search show a registered or common-law mark that blocks "Early Letters" for a memory-journal app (Classes 9 and 42 at least, and 16 if printed books come)? (b) Do the existing letter-learning apps create likelihood-of-confusion risk? (c) Should the founder file an intent-to-use application now as an individual, knowing an entity may hold it later (assignment)? (d) If risk is material, rename before submission rather than after growth?
- **Default.** Proceed under the name; file an intent-to-use application if the search is clear; rename only on a counsel "stop".
- **Deadline.** Search by 23 Oct (store listing approval 30 Oct); opinion before submission (2 Nov).
- **Documents.** `packages/brand/index.ts`; register CR-122; store listing; future backlog G-02.

### Q11. Processor contracts
- **Context.** v1.0 processors: Supabase (database, auth, functions; DPA names Supabase Pte. Ltd.), PostHog (US Cloud), Resend (email; DPA of 31 Dec 2025, no AI-training clause found, keeps sent messages 30 days), Vercel (website; paid Pro needed for the training opt-out), and the download host (Cloudflare R2 candidate; Customer DPA v6.4, 3 Apr 2026). Hugging Face serves public model files directly and is treated as an independent host, not a processor. RevenueCat and PowerSync are not used. Detail: `subprocessors.md` 1.3.0.
- **Questions.** (a) Are these DPAs adequate as CCPA service-provider and MHMDA processor terms? (b) Is Resend's CCPA-style limit enough without an explicit no-training clause, given no letter content goes through it? (c) Does the Singapore contracting entity for Supabase affect our "data lives in the United States" statements? (d) Is Hugging Face correctly outside the processor list?
- **Default.** Accept the standard DPAs as listed; publish the list with contacts at /subprocessors.
- **Deadline.** 23 Oct.
- **Documents.** `subprocessors.md`; Privacy Policy 8, CN-7, CN-11; CHD policy 5, HN-7; register CR-124.

### Q13. Deletion clock and the email provider's 30-day copy
- **Context.** The published promise is erasure from live systems in 31 days, backups in 38 days and processors in 45 days. The deletion worker sends a completion email through Resend when deletion executes (about day 30), and Resend keeps sent messages for 30 days, so that email and its address remain until about day 60. Version 1.4.0 of the Privacy Policy states this as the one exception.
- **Questions.** (a) Is the stated exception acceptable under MHMDA (deletion flow-down to processors) and the CCPA? (b) Or should we drop the completion email (Apple does not require one), or choose a provider with shorter retention?
- **Default.** Keep the email and the stated exception.
- **Deadline.** 23 Oct.
- **Documents.** Privacy Policy 10, CN-12; CHD policy 6; data-policy 5; deletion spec 2.1, DATA-REQ-036; LEGAL-REQ-031.

### Q14. "Free, always" scope
- **Context.** Terms 13 promises writing, reading, playing recordings, export and writing with a co-parent free "for as long as we operate the Service", and 13.3 makes Section 13 non-amendable for existing users. Earlier drafts also promised family members' letters free; v1.0 has co-parents only (D-055), so 1.5.0 narrows the promise to what exists. Which books are free (D-007, D-008) is described as Plus scope in 14.1, not as a permanent promise.
- **Questions.** (a) Is the open-ended promise enforceable and wise (FTC "free" claims, register CR-012)? (b) Does it bind an asset buyer through 17.2 and 27.3? (c) Should the founder extend the permanent promise to other family members when they ship?
- **Default.** As drafted; the founder decides (c) when contributors ship.
- **Deadline.** 23 Oct.
- **Documents.** Terms 13, 14.1, 17.2, 25.4, 27.3; Subscription Terms "What stays free"; store listing subscription paragraph; `billingCopy.store.promise`.

### Q15. Liability cap, carve-outs and indemnity
- **Context.** Terms 21.1 caps liability at the greater of 12 months' fees or $50 and 21.2 carves out fraud, intentional misconduct, gross negligence, violation of law, death or personal injury and anything California Civil Code 1668 forbids. The publisher is an individual with no shield (Q1). Lawyer 1 L2 doubts a $50 floor for lost family recordings (unconscionability, Civil Code 1670.5). In v1.0 recordings never reach our servers, which lowers the data-loss exposure for audio. Terms 22 is a narrow user indemnity.
- **Questions.** (a) Is the cap enforceable for consumers in California? (b) Should a security breach or a breach of the 6.2 promises (no training, no sale, never imitate a voice) sit outside the cap or carry a higher one? (c) Keep or drop the user indemnity? (d) Does Apple's minimum term 5 ("may not limit Your liability to the end user beyond what is permitted by applicable law") change anything?
- **Default.** As drafted; keep the indemnity.
- **Deadline.** 23 Oct.
- **Documents.** Terms 20, 21, 22; memos/lawyer-1.md L2; DECISIONS D-004 point 2.

### Q16. Binding promises
- **Context.** Terms 6.2 (never sold, no ads, no training, never imitate a voice), 11 (faithful transcription, enforced in code by the verifier and an immutable raw transcript), 17 (at least 90 days' notice before closing; export throughout; successor must keep 6, 13 and 17). The trust lines repeat these word for word in the app, the store listing, the website and the welcome email (D-061).
- **Questions.** (a) Can an individual publisher keep these, including in a sale or insolvency (a trustee may reject the contract, Lawyer 1 L5)? (b) Should a wind-down reserve be funded, and in what form (future backlog T5-04)? (c) Is "We never imitate your voice" safe as an absolute (no synthetic voice, no voice cloning, no generative speech enhancement; LEGAL-REQ-019)?
- **Default.** Keep all; reserve decided by the founder later.
- **Deadline.** 23 Oct.
- **Documents.** Terms 6.2, 11, 17, 27.3; Privacy Policy 6, 18; in-app disclosures 3b; register CR-010, CR-011; future backlog T5-04, T5-08.

### Q17. Claims registry: "Your recordings stay on this phone" and the trust lines
- **Context.** The microphone purpose string is now "{app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone." (D-061). The first-recording line says "the recording stays with your letter". In v1.0 nothing uploads audio; the user's own iPhone backup includes recordings (D-033), and the user can export and share them. The claims registry and its content test (LEGAL-REQ-044) are not built yet.
- **Questions.** (a) Are the microphone string and trust lines accurate enough as absolutes, given the Privacy Policy section 9 qualification for the user's own device backup and exports? (b) Must the registry exist before submission, or is a manual review of `packages/content` enough for v1.0?
- **Default.** Approve as qualified; manual claims review for v1.0; the registry in v1.1.
- **Deadline.** 23 Oct.
- **Documents.** in-app disclosures 3b; privacy labels 4; Privacy Policy short version, 9; `packages/content` `trust`, `permissions`; LEGAL-REQ-044; register section 3.

### Q18. Arbitration, EULA and support phone
- **Context.** The Terms default to courts plus small claims (Option B, arbitration, is drafted for counsel). Terms 26.1 tracks Apple's ten minimum EULA terms; 26.1(h) needs a real support phone number.
- **Questions.** (a) Courts or arbitration? (b) Custom EULA in App Store Connect (one document governs) or Apple's Standard EULA plus these Terms? (c) Is a phone number unavoidable for an individual (a forwarding number is fine)?
- **Default.** Courts plus small claims; custom EULA; a forwarding phone number.
- **Deadline.** 23 Oct (App Store Connect fields by 30 Oct).
- **Documents.** Terms 23, 26.1, Appendix B items 1 and 2; memos/lawyer-1.md L3, L4.

### Q23. Security review findings with legal effect
- **Context.** The independent review (`docs/reviews/2026-10-04-security-privacy.md`) found: **H1**, an email sign-in link from anyone signs the phone into that person's account and uploads every local letter to it; **H3**, Sign in with Apple refresh tokens are never captured, so account deletion cannot revoke them (App Store 5.1.1(v)); **M2**, invite tokens travel in the URL path, so the Privacy Policy claim that they travel where servers do not log was false (removed in 1.4.0).
- **Questions.** (a) If H1 happens to a beta family (letters uploaded to a stranger's account), is it a reportable breach under state law or MHMDA? (b) If H3 is not fixed by submission, may we ship with deletion receipts saying `apple: no_token`, or is it a 5.1.1(v) blocker? (c) Anything else in the review that changes a legal text?
- **Default.** H1 fixed before the external beta (19 Oct); H3 fixed before submission; the M2 claim stays removed until the link moves to a fragment.
- **Deadline.** 16 Oct for (a); 23 Oct for (b).
- **Documents.** Privacy Policy 3, 10, 11, CN-23; data-policy 4.1, 4.2; deletion spec 2.6.3; LEGAL-REQ-029; SECURITY.md 5.

## 4. Tier B: before the external beta, release, or a dated event

### Q6. DEBATES Q-004: a spoken-language code in opt-in analytics
- **Context.** PRD 7.10 classifies a person's languages as L4 (a possible proxy for national origin or ethnicity). The analytics catalogue sends `lang`, one of the seven v1.0 codes, on `language_set` and `pack_download` only, after opt-in, never next to letter, family or Plus events. Since migration `20261005000000` each letter's language is also stored on the server (`entries.language`, L4, readable only by its author), and the server view `insights.language_mix` counts families per language with k = 10. pm-1 and pm-5 ask to extend it to a weekly per-language quality event (future backlog CVL-05), and to replace `model = hindi_small` on capture events with a tier.
- **Questions.** (a) Is the closed seven-code `lang` property acceptable as L2 (with the Privacy Policy section 13 disclosure)? (b) Is the k-anonymised server view acceptable without consent? (c) May the weekly per-language quality event and the "my language isn't here" counter (CVL-16, a message the person chooses to send, no person id) follow?
- **Default.** Ship option (a) as coded; the server view as built; (c) waits.
- **Deadline.** 16 Oct (before external TestFlight testers opt in on 19 Oct); (c) before v1.1.
- **Documents.** TRACKING_PLAN 6.2; DATA_CLASSIFICATION 4.7, 4.9, open issue 2; Privacy Policy 3, 13, CN-22; DEBATES Q-004; future backlog CVL-05, CVL-16, T5-26.

### Q12. IP address plus a language-revealing file name at download hosts
- **Context.** When a person picks a language, the app downloads that language's pack and model from the download host (Cloudflare R2 candidate, DEBATES Q-001) or Hugging Face. The host sees an IP address and a file name such as the Hindi model.
- **Questions.** (a) Is that personal information that needs more than the Privacy Policy section 8 disclosure (for example under the CCPA or MHMDA)? (b) Should we mirror every model to our own host so only one disclosed processor sees it?
- **Default.** Disclose; mirror later (D-046).
- **Deadline.** 29 Oct.
- **Documents.** Privacy Policy 3, 8, CN-11; subprocessors 2; privacy labels 1.2; DATA_CLASSIFICATION 4.8.

### Q19. Pre-account local use
- **Context.** People can write and keep letters on the phone before creating an account; Terms acceptance happens at sign-in (A-REQ-034), after the 18+ gate.
- **Question.** Is browsewrap acceptable for pre-account local use, or should the welcome screen link the Terms?
- **Default.** Sign-in-wrap only; the welcome screen gains a quiet Terms and Privacy link if counsel prefers.
- **Deadline.** 29 Oct.
- **Documents.** Terms 1.5 counsel note; in-app disclosures 3a.

### Q20. CCPA, CalOPPA and other state laws
- **Context.** We are likely below every CCPA threshold and do not sell or share (Privacy Policy CN-4). We comply voluntarily. Since 1 Jan 2026 the CCPA regulations treat personal information of consumers under 16 as sensitive where the business knows the age (11 CCR 7001(bbb), S). Connecticut applies to any controller processing sensitive data from 1 Jul 2026 (S).
- **Questions.** (a) Do 7027(m) purposes mean no "Limit" link is needed? (b) When would a risk assessment be due? (c) Is the California notice at collection complete for v1.0?
- **Default.** Voluntary compliance; no "Limit" link; a light risk assessment written now.
- **Deadline.** 29 Oct.
- **Documents.** Privacy Policy 15, 16, CN-4; register CR-013 to CR-022.

### Q21. Staff-access and transparency commitments
- **Context.** Ops scripts write an `ops.audit_log` row before reading anyone's data, but dashboard SQL reads are not logged until database-level auditing exists. The Privacy Policy now says access "through our support tools" is logged. It also commits to publishing legal-request counts.
- **Questions.** (a) Is "through our support tools" accurate and enough? (b) Keep the transparency-report commitment for an individual publisher, and with what wording (future backlog T5-02, CN-9)?
- **Default.** As drafted; keep the commitment.
- **Deadline.** 29 Oct.
- **Documents.** Privacy Policy 7, CN-8, CN-9; CHD policy 5; LEGAL-REQ-025; future backlog T5-02.

### Q24. Export classification (encryption) in App Store Connect
- **Context.** v1.0 uses only TLS and Apple's own platform encryption; there is no app-level encryption of audio in v1.0 (backup is later). App Store Connect asks an export-compliance question.
- **Question.** Is "uses only exempt (standard) encryption" the right answer for v1.0, with no BIS filing?
- **Default.** Answer exempt.
- **Deadline.** 30 Oct.
- **Documents.** Register CR-089, CR-121.

### Q25. The "If you are struggling" support row
- **Context.** The safety classifier is deferred to v1.1 (D-059); v1.0 ships a static, always-available row in Settings with resources. Terms 20.3 says prompts and resource cards are general information only.
- **Question.** Does a static resources list need anything beyond verified, current US resources and the Terms 20.3 disclaimer (no clinician sign-off, which D-034 required only for the classifier)?
- **Default.** Verified national resources, re-checked each release; no clinician sign-off. Re-checked in primary sources (988lifeline.org, postpartum.net), including the 988 language options, before submit (D-087; founder task FT-36).
- **Scope (D-087).** The list is shown as United States only ("They are for people in the United States."). Nothing picks lines by region and no country is stored (LEGAL-REQ-058). When a second storefront opens, extend this question: a verified list per region (a directory such as findahelpline.com or IASP, or national lines checked one by one) and whether the region comes from the device or the storefront. Not needed for v1.0.
- **Deadline.** 16 Oct (before the external beta).
- **Documents.** Terms 20.3; CHD policy 2; Privacy Policy 5, 13; DECISIONS D-034, D-059.

### Q26. Retention periods marked "proposed"
- **Context.** Analytics 12 months, support email 2 years, consent records life of account plus 3 years (pseudonymised), deletion records 3 years, no deletion of inactive accounts (a keepsake is opened years later).
- **Questions.** (a) Approve the periods. (b) Is "no inactivity deletion" consistent with storage-limitation duties (OQ-11)? (c) Do consent records kept 3 years after deletion conflict with MHMDA's narrow deletion exceptions (they hold no health data)?
- **Default.** Adopt as proposed.
- **Deadline.** 29 Oct.
- **Documents.** Privacy Policy 10; data-policy 6; deletion spec 6; POLICY_VERSIONING 7.1; register section 6 questions 7.

### Q27. CSAM reporting, legal process, custody disputes, DMCA
- **Context.** Terms 9.4 (verified court orders), 10.3 (NCMEC reporting of apparent CSAM), Privacy Policy 7 (legal requests). No photos in v1.0 lowers but does not remove the CSAM question (letters and, later, photos). Custody disputes are foreseeable. A DMCA agent is not registered.
- **Questions.** (a) Do we owe 18 U.S.C. 2258A reports as a provider, and what preservation runbook is required? (b) The verification standard and notice rule for court orders and subpoenas in custody disputes (Stored Communications Act)? (c) Register a DMCA agent?
- **Default.** Counsel-led runbooks; no proactive scanning; no DMCA agent until public sharing exists.
- **Deadline.** Before release (9 Nov).
- **Documents.** Terms 9, 10; Privacy Policy 7; LEGAL-REQ-056, -057; register CR-112, CR-113; future backlog T5-13.

### Q28. Breach readiness
- **Context.** State breach laws apply; the FTC Health Breach Notification Rule may arguably apply to a multi-author journal (register CR-030). Recordings never reach our servers in v1.0, which narrows the content at risk to letter text and child profiles.
- **Questions.** (a) Does HBNR apply? (b) Which clock governs our incident plan? (c) Do the notification templates in `docs/ops/runbooks/incident-notification.md` meet the content rules of the main states?
- **Default.** Treat HBNR as applicable for readiness; shortest clock.
- **Deadline.** Before release.
- **Documents.** LEGAL-REQ-039; register CR-017, CR-030, CR-111; incident runbook.

### Q31. Draft legal text for TestFlight testers (DEBATES Q-009)
- **Context.** Sign-in and sync need published `terms` and `sensitive-data` rows (the server refuses content writes without them). External testers start 19 Oct; counsel signs off 29 Oct.
- **Questions.** (a) May friendly-family testers accept the current drafts (notes stripped, the founder's name and a mailing address filled, a pre-release line on top) as version 0.9.0? (b) Is counsel's text then offered as 1.0.0 with re-consent and a short-notice approval, rather than 30 days' notice? (c) Anything in the drafts that must not go to testers even as pre-release text?
- **Default.** As (a) and (b); C0 and C1 only, never the store build.
- **Deadline.** 16 Oct.
- **Documents.** POLICY_VERSIONING 2.4, 3, 6; DEBATES Q-009; FOUNDER_TASKS FT-23, FT-41.

## 5. Tier C: before later features ship

### Q22. Launch geography and overseas family
- **Context.** US storefront only. With no web contribution page in v1.0, overseas grandparents cannot contribute yet. India's DPDP Rules' fiduciary duties are expected around May 2027 (S).
- **Questions.** When family members (including overseas grandparents) can write, does accepting their letters "offer services" in India (DPDP section 3) or target the EU or UK (GDPR Article 3(2))? Geo-limit, add a contributor notice, or comply?
- **Default.** US only; revisit before the family release.
- **Deadline.** Before family members or the web page ship (v1.1 or later); DPDP view by May 2027.
- **Documents.** Privacy Policy 17, CN-14; register CR-100 to CR-102; future backlog T5-28.

### Q29. Account deletion in a shared book; fiduciaries
- **Context.** Account deletion removes the author's letters from every book, including one shared with a co-parent (PRD K-22). A "leave my letters for {child}" option would need a licence that survives deletion. Executors and fiduciaries (California RUFADAA) and a legacy contact are later (future backlog T5-12).
- **Questions.** (a) May a surviving licence let letters stay for the child after the author deletes their account? (b) The proof standard and release scope for executors; the RUFADAA designation tool.
- **Default.** As drafted (removal); no fiduciary release without counsel.
- **Deadline.** Before v1.1.
- **Documents.** Terms 8.4 counsel note; Privacy Policy 10, CN-13; deletion spec OQ-1; register CR-018; future backlog T5-12, FAM items.

### Q30. Later features (counsel batch from the future backlog and DEBATES)
Each is answered before its feature ships; the default is "not built until answered".

| Item | Source | Question |
|---|---|---|
| Server transcription and the AI gateway | T5-07, BL-304; LEGAL-REQ-004, -020 | Consent text naming providers (Apple 5.1.2(i)); Groq zero retention; DeepInfra DPA; is it a "major" policy change (POLICY_VERSIONING 2.1 item 1)? |
| Family hearing each other's recordings, backup | FAM-03, D-032 scheme, ADR 0006; LEGAL-REQ-022(a), -023 | Server-wrapped keys and "encrypted" claims; breach safe harbours with escrow; Privacy Policy and Terms 12 rewrite |
| Other family members and the web page | D-055; LEGAL-REQ-005, -010, -035 | Contributor notice, age confirmation, rights without an account, D-039 (contributors see birthday month and day only), MHMDA sharing consent |
| Plus "follows the book" across Apple families and Android | DEBATES Q-008, G-09 | A purchase-derived date on our server (L3): CCPA "commercial information", Purchases label as App Functionality, privacy policy change |
| The child's own voice and "sounds" moments | CVL-19, T5-08; LEGAL-REQ-059 | Written COPPA opinion before the `child-input` flag turns on |
| Importing a non-user's voice note | CVL-12 | Consent of the person recorded; Penal Code 632; biometric definitions |
| "We never imitate a voice" as a product rule and claim | CVL-04, T5-08 | Wording for the Privacy Policy and the claims registry; CI denylist |
| Native-speaker accuracy reviewers | CVL-02 | Are reviewers processors; what they may see |
| Hinglish fine-tune | 01-capture-voice-languages | Training-data terms (as Q9) |
| Pricing and onboarding experiment arms | G-01, T5-21 | Arm values as L2; label effect |
| Shower-guest recordings | G-10 | Recording consent (Penal Code 632) |
| Account-anniversary email | G-13 | Transactional or commercial (CAN-SPAM) |
| Share-sheet messages | G-14 | CAN-SPAM reading of messages a user sends through the share sheet |
| Translated UI and legal text | T5-19 | California Civil Code 1632 for contracts negotiated in Spanish, Chinese and other languages |
| Printed books | T5-27, Terms 15 | Print Terms, sales tax, PCI scope, EU GPSR if EU sales start |
| Insights agent data | INSIGHTS_LOOP, D-070 | Reports in the repo stay content-free and k-anonymised; confirm no consent is needed for k-anonymised aggregates |

## 6. Not counsel questions, but they block submission

These are listed so counsel sees the whole picture; each has an owner outside legal.

1. **Governance migration applied** (`20261002020000_data_governance.sql` drops `safety_events` and fixes the book-creator cascade): pending on the live project; production must be built from all migrations (D-041) before the Privacy Policy is published (CN-10, CN-13). Owner: founder.
2. **Apple token capture** (security review H3) before submission; **email-link account binding** (H1) before external testers. Owner: auth.
3. **Plus reminder scheduler and confirmation sheet** (Q-003 memo section 9) before feature freeze 26 Oct. Owner: payments, content.
4. **Content strings:** `sensitiveConsent.body` says "the family you choose" (co-parent only, D-055); `plus.legal.renewAnnual` and `renewMonthly` hard-code trial lengths; the store description needs the CHD policy link. Owner: content.
5. **Privacy manifest** in `app.config.ts` (security review L7; labels 3.3). Owner: mobile.
6. **Website pages** at /terms, /privacy, /health-privacy, /subprocessors, /delete-account (and a URL for the Subscription Terms) by 19 Oct, with no logging on `/i/*`. Owner: website thread.
7. **Download host choice** (DEBATES Q-001) and its DPA. Owner: founder.
8. **Founder fields:** {PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}, {SUPPORT_PHONE}, {COUNTY}, the Subscription Terms URL, the policy archive URL.

## 7. Where each question came from

| # | Sources |
|---|---|
| Q1 | D-004, D-064; Terms counsel note and Appendix B 13; register CR-130; CHD HN-10; Privacy CN-1 |
| Q2 | CHD HN-4, HN-5; Privacy CN-16; LEGAL-REQ-006; D-050; memos/lawyer-2.md "Needs a human lawyer" 1 and 4; register section 6 questions 3, 11, 13 |
| Q3 | CHD HN-6, HN-10; Privacy CN-3 |
| Q4 | Privacy CN-2; lawyer-2 M1 and question 5; register questions 2 and 15 |
| Q5 | Terms 2 counsel note; lawyer-1 H4 and question 2; register CR-004, CR-005, question 6; T5-15 |
| Q6 | DEBATES Q-004; DATA_CLASSIFICATION open issue 2; T5-26; pm-1 asks (05 section 7.1) |
| Q7 | DEBATES Q-005; TRACKING_PLAN 10; labels 1.3; T5-01 |
| Q8 | DEBATES Q-003; memos/q-003-subscription-notices.md; lawyer-1 H1, M1, M2, M8, question 1; register question 1; ADR 0013 consequences; G-12 |
| Q9 | ADR 0015 training-data caution; 05 section 7.1 (Hinglish) |
| Q10 | Register CR-122; G-02 |
| Q11 | subprocessors 4; Privacy CN-7 |
| Q12 | Privacy CN-11; DATA_CLASSIFICATION 4.8 |
| Q13 | Privacy CN-12; deletion spec DATA-REQ-036 |
| Q14 | Terms 13 counsel note; lawyer-1 L6; register CR-012 and question 10 |
| Q15 | Terms 21 counsel note; lawyer-1 L2 and question 3; Terms Appendix B 9 |
| Q16 | Terms Appendix B 5; lawyer-1 L5; T5-04, T5-08 |
| Q17 | labels 4; in-app disclosures 3b; D-061 effects ("counsel to confirm privacy labels section 4") |
| Q18 | Terms Appendix B 1 and 2; lawyer-1 L3, L4 and question 4 |
| Q19 | Terms 1.5 counsel note |
| Q20 | Privacy CN-4; lawyer-2 question 6 |
| Q21 | Privacy CN-8, CN-9; lawyer-2 question 7; 05 section 7 (legal owner list) |
| Q22 | Privacy CN-14; register questions 5; T5-28 |
| Q23 | `docs/reviews/2026-10-04-security-privacy.md` H1, H3, M2 |
| Q24 | Register CR-089, CR-121 |
| Q25 | D-034, D-059 |
| Q26 | Privacy CN-12; deletion spec OQ-11; register question 7 |
| Q27 | Terms 9 and 10 counsel notes; Appendix B 8; register question 9; T5-13; 05 section 7 (CSAM applicability) |
| Q28 | Register question 4, CR-030 |
| Q29 | Terms 8 counsel note; Appendix B 6; deletion spec OQ-1; T5-12; 05 section 7 (RUFADAA tool) |
| Q30 | 05 sections 7 and 7.1; DEBATES Q-008; 01, 02, 03, 04 future backlog counsel items |
| Q31 | DEBATES Q-009 (backlog-consolidation) |

Superseded and closed since the 2 Oct memos (no longer questions): PowerSync no-training clause (not used, D-023); RevenueCat terms (not used, D-053); Groq zero retention and DeepInfra DPA for v1.0 (no cloud transcription, D-059; they move to Q30); Standard-mode escrow disclosure and breach safe harbours for v1.0 (no backup; Q30); on-device safety tiering as "collection" (no classifier in v1.0; returns with v1.1); server-side purchase consent rows (D-049 superseded; Q8); store "beta" line (decided, D-060).

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-10-03 | First consolidated packet, prepared with the legal alignment to D-051 to D-070. |
