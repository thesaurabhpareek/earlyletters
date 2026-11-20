---
title: Next set, lane E: legal, compliance, privacy and risk screen
status: draft-for-counsel
date: 2026-11-08
owner: Claude role (regulatory affairs and compliance screen), not counsel
---

# Next set, lane E: legal, compliance, privacy and risk screen

Engineering reading, confirm with counsel. This is not legal advice. It was written by a Claude role to help the founder and outside counsel decide what to build next. Whether a law applies to Early Letters is a legal judgment; where this file says "applies" it means "we should plan as if it applies, and counsel must confirm". Nothing here changes a founder decision, the register, the Terms, the Privacy Policy or which places are blocked. Docs only.

Product facts used (from the repo, not re-checked against code): adults only (18+); a US App Store first build with server features off (D-121), then server features (sign-in, sync, two-parent sharing, encrypted recording backup with a recovery key we hold, D-100 and D-102) in later 1.0.x releases; on-device transcription; analytics off for the 1.0 line and opt-in and content-free afterwards (D-124); Apple-only billing; individual publisher in California (D-004, D-064); countries blocked at sign-up (D-131); no name screening (D-137).

## 0. How to read this file

Order: section 1 is the source ledger (what I read, when, and what I could not). Section 2 is the set of gates that apply to every theme. Section 3 screens the 13 themes. Section 4 is the risk register (top 20). Section 5 is the stop, go slow, go table. Section 6 is the brief for counsel. Section 7 lists conflicts I found in our own documents.

Ratings: stop = do not start build work except the named prerequisites; go slow = build behind a flag with the named gate passed first; go = fits what the register already covers, with the normal release gate.

## 1. Source ledger

All "read" dates are 8 Nov 2026 (UTC). "Primary" means the regulator, legislature or platform owner. Anything I could not open myself is UNVERIFIED here even where the compliance register (`docs/legal/compliance-register.md`) cites it; I did not re-verify the register's own secondary sources.

| Id | Source | URL | Read | Status and what it was used for |
|---|---|---|---|---|
| S1 | Apple, App Review Guidelines (1.2, 1.3, 2.3.8, 2.3.10, 3.1.1, 3.1.2, 3.1.3(e), 4.5.4, 5.1.1, 5.1.2, start of 5.1.4) | https://developer.apple.com/app-store/review/guidelines/ | 2026-11-08 | Primary. Page shows no "updated" date. My fetch covered the first 100,000 of 121,490 characters, so 5.1.4 was seen only in part. |
| S2 | Apple Developer News, Update for apps distributed in Texas | https://developer.apple.com/news/?id=sg176nne | 2026-11-08 | Primary. Dated 3 Jun 2026; new Texas Apple Accounts covered from 4 Jun 2026; Declared Age Range, Significant Change API (PermissionKit), server notification on consent withdrawal. |
| S3 | Apple, age assurance Q&A | https://developer.apple.com/support/age-assurance | 2026-11-08 | Primary. No date. Names no states. Says the API needs the iOS 26 family SDKs; accounts on iOS 18 or earlier are not affected. Asking for an age range before it is legally required is optional. No App Review change. |
| S4 | Apple, App privacy details on the App Store | https://developer.apple.com/support/app-privacy-on-the-app-store/ | 2026-11-08 | Primary. Definition of "collect"; Photos or Videos, Audio Data and Customer Support types; developer keeps answers accurate and can change them without an app update. The optional-disclosure criteria themselves were not on the page I got. |
| S5 | FTC press release, COPPA and voice recordings | https://www.ftc.gov/news-events/news/press-releases/2017/10/ftc-provides-additional-guidance-coppa-voice-recordings | 2026-11-08 | Primary. Dated 23 Oct 2017, page modified 19 Aug 2024. A photograph, video or audio file with a child's image or voice is personal information (2013 update); non-enforcement only for brief voice-as-text use. |
| S6 | Alston and Bird summary of California AB 1043 | https://www.alstonprivacy.com/california-enacts-digital-age-verification-law/ | 2026-11-08 | Secondary. Signed 13 Oct 2025, effective 1 Jan 2027; developer must request an age signal and treat it as primary unless clear and convincing information differs; up to $2,500 per affected child (negligent) and $7,500 (intentional); Attorney General only, no private action. **The bill text itself was blocked: UNVERIFIED.** |
| S7 | Google Play, account deletion requirements | https://support.google.com/googleplay/android-developer/answer/13327111 | 2026-11-08 | Primary. In-app path plus a web link, and a Data safety deletion declaration. |
| S8 | Google Play, Families policy and target audience | https://support.google.com/googleplay/android-developer/answer/9893335 | 2026-11-08 | Primary. No date. Child imagery or terminology can challenge a declared adult audience. |
| S9 | Google Play, Data safety section | https://support.google.com/googleplay/android-developer/answer/10787469 | 2026-11-08 | Primary. Last change-log entry 5 Dec 2023. Collected means leaves the device; E2E-encrypted data the developer cannot read need not be disclosed; declarations must stay accurate; enforcement is removal or blocked updates. |
| S10 | Google Play, Payments policy | https://support.google.com/googleplay/android-developer/answer/10281818 | 2026-11-08 | Primary. No date. Play Billing for digital goods and subscriptions; physical goods and services are outside it. |
| S11 | Washington RCW 19.373.010 | https://lawfilesext.leg.wa.gov/Law/RCW/RCW%20%2019%20%20TITLE/RCW%20%2019%20.373%20%20CHAPTER/RCW%20%2019%20.373%20.010.htm | 2026-11-08 | Primary, short extract only: "consumer health data" is personal information linked or reasonably linkable to a consumer that identifies past, present or future physical or mental health status; consumer includes a Washington resident acting in an individual or household context. |
| S12 | Washington RCW 19.373.070 (sale authorisation) | https://law.counselstack.com/statute/wa/19.373.070 | 2026-11-08 | Secondary mirror of the statute. Separate signed authorisation to sell. We never sell. |
| S13 | FTC, Business guide to the Mail, Internet or Telephone Order Merchandise Rule | https://ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule | 2026-11-08 | Primary. Reasonable basis for shipping claims; 30 days when no claim; delay notices; refunds generally within 7 working days. Plain-language guide, not the rule text. |

Could not read this session (all UNVERIFIED by me; the register cites most of them): FTC COPPA FAQ (the page was blocked; the register's [L1] quotes it); 16 CFR 312 text; Texas SB 2420 text (I have only Apple's description, S2); AB 1043 bill text; Utah, Louisiana and Alabama app-store laws; California Automatic Renewal Law text (register [L7] is a Cooley note); ROSCA; FTC click-to-cancel status; CAN-SPAM (the FTC guide did not load; the IAPP page returned only a description); FTC rule on reviews and testimonials (16 CFR 465); FTC Endorsement Guides; GDPR and UK GDPR Article 8 and Article 9; India DPDP Act and Rules; Canada PIPEDA and CASL; the California gift certificate statute; Cal. Penal Code 632; 18 U.S.C. 2258A; Apple 5.1.4 in full; Apple's shipping and tax pages; Lulu, Stripe, Resend and Supabase contract terms; Apple Declared Age Range documentation pages themselves.

## 2. Gates that apply to every theme

These are already in the register. A theme below only adds to them.

| Gate | What it means for any new feature | Where it lives |
|---|---|---|
| G-A Adults only | Age question first, nothing preselected, under-18 means no account, and actual knowledge of under 13 runs the runbook. Every new door (web page, Android, invite landing) needs its own gate and its own test. | LEGAL-REQ-002; `docs/ops/runbooks/underage-account.md` exists in the tree (I did not review it); CR-001, CR-004, CR-005 |
| G-B Age signal | From 1 Jan 2027 California's law may require us to request an OS or store age signal (S6, UNVERIFIED primary). Texas applies now to new Texas accounts (S2). Apple's API needs the iOS 26 family SDK and does not reach accounts on iOS 18 or earlier (S3); our floor is lower, so on older phones we get no signal and rely on our own gate. Counsel Q46. | CR-004, CR-005, packet Q46 |
| G-C Claims registry | Every sentence of privacy or security copy maps to a fact. A new data flow can make a shipped sentence false (for example "only you and the people you invite can read your letters"). FTC Act s.5 is the highest register risk (CR-010). | LEGAL-REQ-044; `docs/reviews/2026-10-31/COUNSEL_LOCKED.md` strings |
| G-D Label and manifest | The App Privacy answers, the privacy manifest and the Privacy Policy must match for the build, and Apple lets us change answers without an app update (S4), so there is no excuse for a stale label. Google needs the Data safety form to stay accurate (S9). | `docs/legal/app-store-privacy-labels.md` section 3.4 |
| G-E Deletion everywhere | Every new store (bucket, table, vendor, log) is in the purge worker, the deletion spec, the account-deletion web route and the processor list before it ships. Apple 5.1.1(v) and Google S7 both need in-app deletion; Google also needs a web link. | DELETION_AND_EXPORT_SPEC; CR-084, CR-091 |
| G-F Sanctions | Any new door obeys D-131 (and the web page extra regions). No name or IP stored to prove it. | D-131, D-137, packet Q57 |
| G-G Subprocessors | A new vendor needs a signed DPA, US data location, a line in `subprocessors.md` and the Privacy Policy, and 30 days' notice in the app before it receives letters or recordings. | `subprocessors.md` 2.1.0; CR-124 |
| G-H Accessibility | New web and print surfaces: WCAG 2.2 AA tested, because ADA and Unruh suits are routine (CR-070, UNVERIFIED). | CR-070 |
| G-I Faithful edit | No feature may write, rewrite or summarise words. This also shuts out "AI organisation" in the search theme. | CLAUDE.md constitution |

## 3. Theme screens

Format for each: Rules that apply and why; Counsel must confirm; Data protection and children; Claims and label; Security (STRIDE headline); Gate; Rating. "FUT" ids are from `docs/backlog/FUTURE.md`.

### 3.1 Family sharing and invites (FAM-01, FAM-03, FAM-04, FAM-07, FAM-11, FAM-12, T5-13)

Today: two parents per book (D-124). Next: relatives as authors, readers, shared voice, invite links through chat apps, a guest author on the parent's phone, "leave my letters for the child".

- **Rules and why.**
  - COPPA edge: the amended rule treats a child's voice as personal information (S5; register CR-001 says the amended rule's compliance date was 22 Apr 2026, secondary, UNVERIFIED). Our users are adults writing about a child, so we read it as outside scope, but a sibling or older child speaking into a relative's phone with our knowledge is the edge (G-A).
  - Apple 1.2 user-generated content asks for filtering, a report route, blocking and published contact (S1). Whether Apple treats private family sharing as UGC is unknown. We plan for it: Report a concern, remove member, parent approval (T5-13, B-REQ-009).
  - Apple 5.1.2: personal data of another person (a relative's voice and name) needs that person's permission (S1). Invite acceptance must carry a notice at collection.
  - Washington My Health My Data Act: relatives will mention health in letters; the consumer-health-data policy and processor flow-down stay in force (S11; CR-031).
  - ECPA and subpoenas: shared letters among members may be "communications" and custody disputes are foreseeable (CR-112, UNVERIFIED).
  - 18 U.S.C. 2258A: a report that gives actual knowledge triggers reporting; no duty to scan (CR-113, UNVERIFIED).
  - California fiduciary access law: an 18-year keepsake outlives some authors (CR-018, UNVERIFIED).
- **Counsel must confirm.** (1) A licence that survives account deletion for "leave my letters" (FAM-12), with the author's consent model. (2) The server-wrapped key scheme for shared voice (LEGAL-REQ-022(a), D-050 consent design, packet Q42, Q48). (3) Whether a relative's invite acceptance is enough notice and consent. (4) Safety removal, custody and legal orders (Q50). (5) Whether Apple 1.2 applies.
- **Data protection and children.** Minimise: a relative needs a display name and relationship only. No contacts permission; invites go through the system share sheet (CR-083). Retention: a removed member's contributions follow the deletion spec (section 2.5 of that file). Cross-border: relatives abroad can open invites; with the iPhone-only app they still need an Apple account, but the landing page and any chat preview carry the child's first name, so previews must be generic (FAM-04). The invite token in the URL path is an exposure today; token in the fragment fixes it.
- **Claims and label.** The "private" claim set changes. Counsel's pending rewrites already narrow "the people you invite" to "your co-parent if you invite them" (COUNSEL_LOCKED, LNG-15). When relatives become readers, those rewrites need a second pass. Label: Name and Other User Content already Yes; shared voice makes Audio Data Yes (already planned with backup).
- **STRIDE headline.** Spoofing of a relative through a forwarded link (high); Information disclosure through chat link previews and shared screenshots (high); Elevation of privilege from reader to author; Repudiation of who added a letter (provenance line). 
- **Gate.** FAM-03's `book_access` and purge coverage; FAM-11 floor (visible removals, "private from now on"); Report a concern with the safety runbook; counsel replies on items (1) and (2); the claims pass. Never widen the circle without the floor (FUTURE rule).
- **Rating: go slow.** Start with FAM-03 and FAM-07 behind flags; relatives as authors only after the floor.

### 3.2 Web contribution page (FAM-05, T5-17)

A page where a relative with no app records or types a letter.

- **Rules and why.**
  - COPPA edge: a contributor under 13 is the named register edge (CR-001). Age confirmation must be part of the Send act (LEGAL-REQ-002, LEGAL-REQ-010).
  - Worldwide reach: the page is reachable from any country. EU and UK GDPR (Articles 3(2), 8, 9; UNVERIFIED), India DPDP section 3(b) (CR-101; secondary [L12]) and Canada are the exposure. Register position: no targeting, collect only what the notice allows; counsel to confirm (Q on CR-100, CR-101).
  - Sanctions: page refuses the extra regions in D-131; D-137 means no name screening.
  - Cookie and tracking: no non-essential cookies and no analytics on the page (LEGAL-REQ-010 and -058).
  - CAPTCHA vendor: a new subprocessor that sees the contributor's IP (G-G).
  - Washington: health details in a grandparent's letter (CR-031) need the CHD policy link on the page.
  - ADA and Unruh on a public web form (G-H).
- **Counsel must confirm.** Worldwide reach and whether we "offer services" to relatives abroad; the contributor notice wording; whether a return link is a sufficient access and deletion route (LEGAL-REQ-035); whether a CAPTCHA vendor needs a notice; DPDP verifiable parental consent only if a child of an Indian resident is the subject (CR-101).
- **Data protection and children.** The subject is a child; the contributor is an adult stranger to the system. Collect: audio encrypted in the browser, the relationship name, the 18+ confirmation. No IP-derived location stored. Retention: the unaccepted contribution has a short expiry (propose a number to counsel; the spec has none I could confirm, so UNVERIFIED). The return link is a bearer credential: revocable and rotated.
- **Claims and label.** "No app, no account" claim is true only if no persistent identifier is created before Send. The Apple label covers the app, not the web; the web policy covers the page. Google (later) reads webviews we control (S9).
- **STRIDE headline.** Spoofing and abuse of anonymous upload (spam, malware, illegal content, storage fill); Tampering with a bearer link; Information disclosure of the child's first name on page load; Denial of service on upload; Elevation through anonymous-identity behaviour that TDD 04 marks Unverified. TDD 10 already calls this the riskiest surface.
- **Gate.** T5-17 shell with deletion flow live; FAM-01 approvals and FAM-03 pipeline; CAPTCHA DPA; Report a concern; storage caps; the web E2E tests for LEGAL-REQ-010 and -035; counsel's memo on worldwide reach. Pen test (T5-03) before the link is public.
- **Rating: go slow.** Hard stop on three prerequisites: counsel memo on reach, FAM-01, FAM-03.

### 3.3 Printed books (BK-13 to BK-16, G-10 physical gift)

- **Rules and why.**
  - Apple 3.1.3(e): physical goods use non-IAP payment (S1). Google exempts physical goods from Play Billing (S10). So print checkout is outside the IAP loop and needs its own processor.
  - FTC Mail Order Rule: only claim shipping times with a reasonable basis; 30-day default; delay notices; refunds (S13).
  - Sales tax and merchant of record: Apple and Google collect on IAP; for print we are the seller (CR-120, UNVERIFIED).
  - Individual publisher: Apple 5.1.1(ix) is about regulated fields (S1), not print, but R-07 lists it as a rejection driver and the register says entity before selling physical goods (FUTURE section 3.5, rank 44; CR-054). Counsel and founder.
  - PCI: use hosted checkout so we never touch card data (CR-054).
  - Print vendor holds the child's name, photos and a shipping address: vendor DPA, US location, and an address retention rule (T5-27, UNVERIFIED).
- **Counsel must confirm.** Print Terms and refunds; whether an individual can sell goods in California without a seller's permit or business licence (not read: UNVERIFIED); vendor terms on ownership of uploaded content; a licence for printing family voice transcripts that mention third parties; ARL does not apply to a one-off purchase but a print subscription would.
- **Data protection and children.** Minimise: send only the book file and the address to the printer; delete the file after the vendor confirms fulfilment (propose a short window); keep the address only for order support. QR codes (BK-15) link to audio: a printed code is a permanent bearer link to a child's voice, so it needs revocation and a no-guess token.
- **Claims and label.** "Printed in" and delivery claims need a basis (S13). Label: Purchases and Contact Info (address) additions; payments are by a third party so Financial Info stays No only if the processor is the processor's own page.
- **STRIDE headline.** Information disclosure through the printed QR code and a lost parcel; Spoofing on gifted address; Tampering with the print file; shipping fraud and refunds.
- **Gate.** Founder go or no-go (June 2027 in FUTURE); entity decision; Print Terms from counsel; vendor DPA; QR token design; hosted checkout; address purge in the deletion spec.
- **Rating: stop** until the go/no-go and the entity decision. Allowed now: BK-13 print-ready file export, which is an on-device file.

### 3.4 Android (T5-16, FAM-14, G-09, G-21)

- **Rules and why.** Google Play target audience must be 18+ and the child imagery in our listing could challenge it (S8). Data safety must match behaviour and stay accurate (S9). In-app deletion plus a web link (S7). Play Billing for the digital Plus plan (S10); this reopens the Apple-only billing position and Plus-follows-the-book (G-09, Q-008). Developer account and entity: the register assumes a Play account with the entity (FUTURE gate G-21). Apple guideline 2.3.10 forbids other platforms' names in Apple metadata, so the iOS listing must not advertise Android (S1). Age signal on Android: the register says "when available" (CR-005, UNVERIFIED). Health apps declaration (CR-094, UNVERIFIED).
- **Counsel must confirm.** Merchant-of-record and tax duties under Play (UNVERIFIED); Play account type and verification for an individual; Play's subscription and auto-renewal disclosures against California's law; whether Google's age signal obligation applies to us.
- **Data protection and children.** Same data map, a second set of processors (Google, FCM for push if used). A mixed-platform family means a book is shared across two platforms: key custody and escrow must work identically. Photo picker only (CR-083).
- **Claims and label.** Data safety form is a new representation; every iOS claim must hold on Android ("we never sell"). Google's rule that E2E-encrypted data the developer cannot read need not be declared (S9) does not help: we hold a recovery key, so recordings are declared.
- **STRIDE headline.** Tampering and spoofing from rooted devices and sideloaded builds; Information disclosure through Android backups and screenshots; Elevation via exported components; push token handling.
- **Gate.** G-21's four gates (entity, web deletion live, G-09 decided in Q-008, two retention cohorts), Play account, Data safety form generated from the data map, Families declaration 18+.
- **Rating: stop** until those gates; counting co-parent Android demand (FAM-14 part 6) is allowed and cheap, if its k-anonymised total is cleared by counsel for the label.

### 3.5 Other languages and regions (CVL packs, T5-19 UI localisation, G-20 markets)

Split in two. Spoken-language packs for US families (already planned, on-device) are low legal risk. Non-US storefronts are a different programme.

- **Rules and why.** EU/UK GDPR: Article 3(2) targeting, Article 8 child users, Article 9 health data, DPIA, representative, transfers (CR-100; UNVERIFIED). India DPDP: extraterritorial section 3(b), verifiable parental consent for children's data, 72-hour breach report (CR-101; secondary). Canada PIPEDA and Quebec Law 25 (CR-102; UNVERIFIED). Local email-law equivalents (CASL, PECR; UNVERIFIED). European Accessibility Act (CR-071; UNVERIFIED). Local VAT on IAP is Apple's job; ours is price display. Apple 2.3.7 accurate metadata: a Spanish listing must not imply a Spanish interface (G-02 note).
- **Counsel must confirm.** Whether a US storefront Spanish listing "targets" anyone; what a first non-US market needs (a programme, not a memo); data transfer mechanism for each market.
- **Data protection and children.** A new region means a new child-data age threshold (16 in some EU states, 18 in India), local breach clocks, possibly local storage. Pack data is data not content, downloaded from Cloudflare R2 and Hugging Face, which see an IP and filename (subprocessors.md).
- **Claims and label.** Translated privacy copy is still a claim. Each language needs the claims test, and `COUNSEL_LOCKED` rewrites apply per language. No new label rows from language alone.
- **STRIDE headline.** Tampering with a downloaded pack (signed manifests are the control); Information disclosure through region-specific analytics; spoofed language packs.
- **Gate.** Spoken packs: native-speaker sign-off per pack (R-01 launch gate) and the claims test per language. UI localisation, US only: T5-19 infrastructure plus claim translations reviewed. Regions: a per-market compliance programme and a founder decision in `docs/DECISIONS.md` (storefront choice is founder-only).
- **Rating.** Spoken packs: go (already gated). UI localisation for US: go slow. Non-US storefronts: **stop**.

### 3.6 Cloud backup and export (OPEN-02 restore, BK-17 export splitting, T5-05 import, export formats)

- **Rules and why.** Backup of recordings with a recovery key we hold: FTC Act s.5 claims about keys and privacy (CR-010; R-10); consumer-health-data law for processors and deletion flow-down (S11, CR-031); reasonable security (CR-110, UNVERIFIED); breach notification in all states (CR-111, UNVERIFIED); COPPA edge for a child's voice stored by us (CR-001, packet Q45); export and portability: the register has no statute I read that requires it, but Apple 5.1.1(v) needs deletion (S1) and our shutdown pledge makes export a promise (FTC "unfair or deceptive" theory if it fails). Google Data safety counts backup as collected (S9). Import from other apps: other apps' terms on scraping are unchecked (T5-05 legal note).
- **Counsel must confirm.** Escrow design and disclosure (Q42, Q48); legal-process policy for content held under escrow; whether the `exports` bucket (7 days, P1) changes the label; an import terms-of-use position.
- **Data protection and children.** Minimise: backup is owner-only and off until turned on; byte quota per account (R-12). Retention: backups follow account deletion within the spec's windows (30-day undo; processors within 14 days; Resend copies about 60 days). Cross-border: US storage only. An export is a copy of a child's data on someone else's device or in an email: say so on the export sheet.
- **Claims and label.** The microphone string and every "stays on this phone" sentence must be true for every user (label doc section 5). Label rows: Audio Data and Device ID turn Yes when backup is on. Plus-follows-the-book (G-09) adds a purchase-derived date on the server and probably changes Purchases to Yes.
- **STRIDE headline.** Spoofing and account takeover opening backups (R-19 controls: step-up, email on every unwrap, 24 hour hold, 3 unwraps a month, logged); Tampering with restores; Information disclosure of the recovery key; Repudiation of key use.
- **Gate.** The R-17 and R-19 gates; restore drill (runbook `restore-drill.md` exists); claims pass; the label flipped to match the build; counsel replies on Q42.
- **Rating.** Export: go. Backup and restore: go slow (gate above).

### 3.7 Search and AI-free organisation (BK-09, BK-03 sealed letters, T5-09 drop `entries.search`)

- **Rules and why.** Apple 5.1.1(ii)-(iii): no consent needed for on-device search; keep it on the phone (S1; label says in-app search is local, so Search History stays No). Constitution: no summarising, tagging by machine meaning or "shaping" words. "AI-free" organisation means date, person, occasion and manual tags only. If machine tagging by topic were added, it would infer health and mental state: Washington's definition covers inferences about health status (S11; CR-031), CR-016 warns off health tracking, and CR-085 (Apple 5.1.2(i)) needs explicit permission for third-party AI.
- **Counsel must confirm.** Nothing new for local search. For sealed letters (BK-03): the rule for what a sealed letter means in an export, in a deletion, and under a legal order (the sealed state would need a server view).
- **Data protection and children.** Derived data inherits level L4 (DATA_CLASSIFICATION rule 2), so any server-side index of letters, even a hash, is L4 and in scope for deletion. Keep the index on the device; drop `entries.search` (T5-09).
- **Claims and label.** The claim "search never leaves your phone" is easy to keep and valuable; register it. No label change if local.
- **STRIDE headline.** Information disclosure only through an on-device index left in backups or shared sheets; low.
- **Gate.** No network call in the search path (a test); no server index; sealed-letter semantics from counsel before BK-03.
- **Rating: go** for local search and manual organisation; sealed letters go slow.

### 3.8 Photos and video attached to letters (CVL-10, CVL-11, BK-10)

- **Rules and why.**
  - COPPA: a photograph, video or audio file with a child's image or voice is personal information (S5). Same adult-user reasoning as above, but a photo of a baby uploaded by a relative, or a video with a toddler speaking, strengthens the "actual knowledge or mixed audience" edge (CR-001).
  - Apple 5.1.1(iii): use the out-of-process picker, not full library access (S1; CR-083).
  - Apple label: a feature that uploads photos or videos means that type must be disclosed (S4). The current label says no photo feature in v1.0 while the data inventory lists a live private `entry-photos` bucket and a `child-photos` bucket (see section 7).
  - 18 U.S.C. 2258A: images of babies stored by us make the report route and runbook mandatory (CR-113, UNVERIFIED).
  - Washington: a photo of a child in hospital is consumer health data in context (S11).
  - Biometrics: faces. No face detection, grouping or search (Illinois BIPA and similar, CR-040, UNVERIFIED). Voiceprints likewise: no speaker recognition.
  - Video adds third-party voices (CR-041, Cal. Penal Code 632, UNVERIFIED) and larger exports (3.9 GB cap, BK-17).
- **Counsel must confirm.** Whether photo metadata (location, time) must be stripped on upload (recommended; engineering reading); CSAM reporting posture and no-scanning stance (Q50); whether a child's photo in the book is "personal information collected from a child" when the parent uploads it (COPPA Q45).
- **Data protection and children.** Minimise: strip EXIF and location on the device; one photo per letter at first; photos are L4. Retention and deletion: the purge worker must cover `entry-photos` and `child-photos` (BL-232 scope) and the export. Cross-border: none for US storage.
- **Claims and label.** Add Photos or Videos to the label and manifest when the build ships photos; update the Privacy Policy section 2 and 4; update the camera/photos purpose strings (add-only photo permission for BK-10).
- **STRIDE headline.** Information disclosure through public URLs (signed URLs only, short expiry); Tampering with metadata; Elevation through shared access; abuse content risk (CSAM); Denial through storage fill (quota).
- **Gate.** Picker only; EXIF strip test; purge coverage test; label and policy updated in the same PR (G-D); Report a concern live; counsel reply on CSAM stance.
- **Rating.** One photo with a letter: go slow. Video: **stop** (adds third-party voice and faces, size, and no row in the register's design).

### 3.9 Reminders and notifications (G-08, G-11, FAM-17, G-12 plan reminders)

- **Rules and why.** Apple 4.5.4: not required for the app to function; no sensitive or confidential information in pushes; promotional pushes only after explicit in-app opt-in with an in-app opt-out (S1). Apple 5.1.2: the app may not force notifications on (S1). California ARL notices for trial and renewal (CR-050, secondary): a local notification may not count if notifications are off, so email is the fallback; CAN-SPAM classification (transactional vs commercial) for email (UNVERIFIED; FTC guide did not load). TCPA: no SMS (CR-062; re-run before SMS invites or OTP). The first-week habit loop must not turn into streak or guilt copy (content rules).
- **Counsel must confirm.** Whether a device-local notification satisfies a notice duty; whether a push token needs a label row (default no, Q54); whether a family-letter push to a co-parent reveals the existence of a letter to a lock screen viewer (design rule: no names, no text).
- **Data protection and children.** Server push needs a token table (L3), an APNs or FCM processor, and deletion on logout and account delete. Child's name in a notification is L4: off by default and toggled by the owner (C-REQ-009). Reminders for a grieving or separated family are a harm vector (R-16 below).
- **Claims and label.** "No letter text in notifications" is a claim; test it. Push tokens: default Other Data No per Q54; counsel confirms. Email address purpose adds reminder emails.
- **STRIDE headline.** Information disclosure on a locked screen; Spoofing of push payloads; Repudiation of consent (record when notifications were turned on).
- **Gate.** Payload test (no names or text), token purge test, opt-in and opt-out UI tests, content rules test for reminder copy.
- **Rating.** Local reminders: go. Server push and lifecycle email: go slow.

### 3.10 Gift or milestone-share flow (G-10, G-13, G-14, BK-16, FAM-06 digest)

- **Rules and why.** Gift of a digital year: California gift-certificate law may not fit an in-app purchase (CR-053; UNVERIFIED) and the gift must be a fixed 12-month non-renewing term; Apple 3.1.1: codes cannot be a way around IAP and codes cannot be sold (S1; G-16 note). Gift code redemption by a recipient who becomes an account holder runs through our age gate. A milestone-share (a first, a birthday letter sent to relatives) is a disclosure of a child's content to people outside the book: Apple 5.1.2(i) permission and our own approval model. Email digests: CAN-SPAM (UNVERIFIED); no child name or letter content in any email (emails rules); Tinybeans-style server-hosted images drew a "not secure" reaction (FAM-06 evidence). FTC Endorsement Guides and 16 CFR 465 if any reward is tied to sharing or reviews (UNVERIFIED; offer no reward). Contacts: never read contacts; share via the system sheet (S1 5.1.2(v) bars contacting people from Contacts or Photos except on the user's explicit, individualised initiative).
- **Counsel must confirm.** Gift terms, expiry and refund path; whether a sender is the "initiator" under CAN-SPAM; whether a one-tap milestone share to a relative who is not in the book needs the relative's consent before we send anything; guest-author recording consent line (CR-041).
- **Data protection and children.** A gift recipient is a new person whose email we may hold: collect the minimum, send a transactional message only, delete if unredeemed. A shared milestone must be a copy the owner chose; revocation is limited once it is in someone else's hands, so say so before sending.
- **Claims and label.** "Share" language must not promise control after the share. Purchases and Contact Info may change if we hold a recipient email.
- **STRIDE headline.** Spoofing and gift-code abuse (codes in the wild, resale); Information disclosure through a forwarded share link; email enumeration of recipients.
- **Gate.** Gift is digital only until print is cleared; terms from counsel; recipient data minimised and purged; link design shares the FAM-04 token rules; sandbox test for redemption.
- **Rating: go slow.** A physical gift edition is under printed books (stop).

### 3.11 Subscriptions and trial changes (G-15, G-19, G-09, G-12, Q-008, Q-003)

- **Rules and why.** Apple 3.1.2(a): periods of at least seven days and available on all the user's devices; 3.1.1 IAP only for digital unlocks; Apple 5.1.1(ii): paid functionality must not depend on granting data access (S1). California ARL, as amended effective 1 Jul 2025 (CR-050; secondary): clear terms before purchase, express consent separate from other terms, records for 3 years, annual reminder, price-change notice 7 to 30 days ahead, trial and annual-renewal notice windows, easy online cancellation. ROSCA (UNVERIFIED) and other states' auto-renewal rules (CR-052, from the Q-003 memo, not re-read). FTC click-to-cancel was vacated in July 2025 and an ANPRM followed in 2026 (CR-051; secondary). FTC "free" claims (CR-012). Changing existing subscribers' price or trial triggers notice; changing trial only for new subscribers does not (G-15 note; I, counsel to confirm).
- **Counsel must confirm.** Whether Apple's role as merchant of record shifts any of the ARL duties (CR-050 open question); the Q-003 notice plan; "Free" and "paid once" claims; the "Free, always" promise and what can change without breaking it (Terms; Lawyer 1 L6).
- **Data protection and children.** Mostly none new; the exception is Plus-follows-the-book (G-09), which stores a purchase-derived coverage date on the server (a CCPA "commercial information" argument if CCPA ever applies, CR-014 secondary).
- **Claims and label.** Every price, trial and renewal sentence is a claim; the Terms table and in-app disclosures move together (`in-app-disclosures.md` version bump; pinned strings). Purchases: Yes if the status report or G-09 ships.
- **STRIDE headline.** Spoofing of entitlement (on-device checks can be bypassed on a jailbroken phone); Tampering with the coverage date; Repudiation of consent (record disclosure version).
- **Gate.** ARL disclosure strings registered; D-30 and D-7 notices tested; Terms table updated in the same PR; sandbox pass for trial, cancel, restore.
- **Rating: go slow.** Shorter trial for new subscribers: go. A price rise for existing subscribers: stop until OPEN-02 (FUTURE says wait) and a notice plan.

### 3.12 In-app feedback (Build 2; D-088)

Plan as I was told: retention 90 days, linked to the account. See section 7 item 1, because D-088 says something different.

- **Rules and why.** Apple 5.1.1(ii): consent for collection of user data (S1); S4 says optional feedback forms may qualify for optional disclosure only if every criterion is met, and I could not read the criteria, so I treat feedback as disclosed (UNVERIFIED). Customer Support is an Apple data type (S4). Apple 5.1.1(i): policy must state collection, retention and how to revoke. Screenshots can capture letter text, the child's name or a health detail: Washington's definition is about identifying health status by what is in the data, not the form it arrives in (S11). COPPA: a tester under 13 is out of scope (adult only), but a screenshot could capture a child's voice transcript.
- **Counsel must confirm.** Wording of the feedback notice; whether linking to the account changes the Linked answer and the CCPA/MHMDA position; retention (D-088: text 90 days after closing, screenshots 30); screenshots by email, never into GitHub; deletion of feedback on account deletion; a person's right to see and delete their feedback.
- **Data protection and children.** Minimise: category, free text, optional screenshot with preview and Remove, only on settings and error screens (D-088); no entry text, audio or child name captured automatically (CLAUDE.md privacy rules). Resettable random install id plus optional email, never IDFA, IDFV or the analytics id (D-088). If it is tied to the account instead, the deletion spec, the data map and the label all change. Agents triage on structure only and never contact the reporter.
- **Claims and label.** D-088 says submission keeps Data Not Collected until the form ships, and the founder must accept the label change to Data Collected when it does. Customer Support and Other User Content (screenshots) rows, plus Contact Info if email is kept. Update the label in App Store Connect the same day (S4).
- **STRIDE headline.** Information disclosure through screenshots and logs; Spoofing and spam into the issue tracker; Tampering with triage (prompt injection from free text into an agent: triage agents must treat feedback text as data, never as instructions); Repudiation of deletion.
- **Gate.** Counsel signs text; label flipped; screenshot preview and blocklist screens; 90-day and 30-day purge job with a test; private repo and mailbox exist; deletion on account delete.
- **Rating: go slow.** Text-only feedback with an install id is the lowest-risk start.

### 3.13 Mac or web reader (BK-12, FAM-06, T5-17)

A way to read or listen to the book on a Mac or in a browser, and a family link for relatives.

- **Rules and why.** Same as the web contribution page for the web surface (3.2). Reading is access, so authentication and revocation matter more than collection. Apple 5.1.1(v) account deletion applies to a Mac app that creates accounts (S1). A web reader delivers children's content to a browser the owner does not control: session length, shared computers, cached audio, link forwarding. Printed QR codes (BK-15) make the web reader a permanent landing. Google's Data safety counts webviews we control (S9). ADA and Unruh on a public site (G-H). Worldwide reach again (CR-100, CR-101).
- **Counsel must confirm.** Whether a personal family link for a relative counts as an account for Terms and deletion; the retention and revocation rule; whether key custody for web decrypt (Standard escrow scheme) is disclosed correctly (Q42, Q48).
- **Data protection and children.** Server-side decryption for the web means keys are reachable by the web gateway: a larger blast radius than the phone. Read-only role; no download by default; audit log (content-free); time-limited sessions.
- **Claims and label.** "Only you and the people you invite can read your letters" must hold for a browser on a library computer; add the honest line. Label: no new rows if the web is covered by the same data; the web privacy policy must be linked on the page.
- **STRIDE headline.** Spoofing (link forwarded or shoulder-surfed); Information disclosure (shared computers, caches, referrer leaks, search engine indexing); Elevation (reader to author); Denial of service on decrypt.
- **Gate.** T5-17 shell live with web deletion; FAM-03 and the Reader role; CSP, noindex, no-referrer; pen test (T5-03) before public; revocation test; counsel reply.
- **Rating: stop** for any shareable web link; go slow later for an authenticated owner-only reader.

## 4. Risk register (top 20)

Likelihood (L) and impact (I) are 1 to 5. Score is L times I. L is my estimate of the chance within 12 months of starting the work the register ties it to; I is harm to families first, then to the product. All are engineering opinions for the founder and counsel.

| # | Risk | Area | L | I | Score | Owner role | Mitigation | Trigger |
|---|---|---|---|---|---|---|---|---|
| 1 | A privacy or security claim, or the App Privacy label, becomes false when a feature adds data (feedback, photos, backup, web page, relatives as readers) | Legal, store | 4 | 5 | 20 | Chief Compliance Officer with content owner | Claims registry plus content test on every PR; label and policy change in the same PR as the feature; build-state table in the label doc | A PR adds a bucket, table, SDK, vendor or permission string |
| 2 | Bearer links (invite token, return link, family link, printed QR) leak a child's name or voice | Security, reputational | 3 | 5 | 15 | Security architect | Token in the URL fragment, revocation, rotation, generic previews, no logging under invite routes, pen test | Any shareable URL design is proposed or a link appears in a log or preview |
| 3 | Actual knowledge of an under-13 or under-18 user or contributor (web page, relatives, photo or video of a child speaking) | Legal | 3 | 5 | 15 | Regulatory affairs lead | Age gate on every door; the under-18 runbook; no inference from content; counsel's COPPA opinion before sibling or child-voice features | A support report or contributor says they are a minor |
| 4 | Age-signal duties missed: Texas now, California from 1 Jan 2027, Utah and Louisiana later; old iOS gets no signal | Legal, store | 4 | 4 | 16 | Regulatory affairs lead with mobile | Integrate Declared Age Range; confirm each statute's duties before its date (primary text not read here); keep our own gate as backstop; counsel Q46 | 90 days before an effective date, or Apple changes its age-assurance page |
| 5 | App Review rejection or removal: individual account on a regulated or physical-goods flow, hidden or remote features, 5.1.1(ii) consent, UGC without a report route | Store | 3 | 4 | 12 | Release owner | Review notes with demo account; flags switch only reviewed features; entity decision before print; Report a concern before relatives write | A rejection note, or a new Apple guideline revision |
| 6 | Backup recovery-key escrow abused: account takeover opens a family's recordings, or a legal demand compels access | Security, legal | 2 | 5 | 10 | Security architect | Step-up, email on every unwrap, 24 hour hold, 3 unwraps a month, logged use; legal-process policy | Any unwrap anomaly or a subpoena for content |
| 7 | Auto-renewal law breach on trial, price or gift changes (California as amended 1 Jul 2025; other states) | Legal | 3 | 4 | 12 | Payments engineer with counsel | D-30, D-7, D-3 notices tested; consent record for 3 years; trials only for new subscribers; no price rise without notice plan | Any change to price, trial length, gift or code behaviour |
| 8 | Consumer health data law (Washington and similar states) reaches letters, photos, feedback screenshots or inferred tags | Legal, privacy | 3 | 4 | 12 | Compliance engineer | Never derive health inference server side; CHD policy link; processor flow-down; no machine tagging; staff access limited and logged | Any feature that classifies, tags or counts by health-related content |
| 9 | Legal process or a custody dispute over shared family letters | Legal | 3 | 4 | 12 | Chief Legal Officer | Legal-process policy; notice to the member where lawful; "private from now on"; counsel on ECPA position | A subpoena, court order or safety-removal request |
| 10 | Apparent CSAM or abuse content arrives through photos, video or the web page, with no report path | Legal, reputational | 2 | 5 | 10 | Operations lead with counsel | Report a concern; counsel-led reporting and preservation runbook; no proactive scanning of private photos (counsel to confirm); upload caps | First report, or before any image or anonymous upload ships |
| 11 | Sanctions or export slip: web page, Android or invites reach blocked places; no name screening | Legal | 2 | 4 | 8 | Regulatory affairs lead | D-131 country block on every door; match runbook; counsel Q57; list refreshed against OFAC changes | OFAC program change, or a report from a blocked place |
| 12 | Overseas relatives bring GDPR, UK GDPR or DPDP duties (web page, Android, regions) | Legal, privacy | 3 | 4 | 12 | Chief Legal Officer | Collect only what the notice allows; no targeting; US storefront only; counsel memo before the page is public | Any EU, UK or India pricing, language or marketing; or counsel says the page "offers services" there |
| 13 | Founder capacity: one reviewer, many streams, holidays; checks skipped under pressure | Operational | 5 | 3 | 15 | Founder, delivery lead | Gates are machine checks where possible; cap fenced PRs; stop-rated themes stay stopped | Review queue over a week, or a gate waived |
| 14 | Feedback screenshots or text capture letter content or a child's name | Privacy | 3 | 4 | 12 | Compliance engineer | Screens allowlist (settings and error only), preview and Remove, 30 day screenshot purge, structure-only triage, treat free text as data not instructions to any agent | A screenshot arrives that shows a letter |
| 15 | Print vendor breach, shipping failures, or payment errors; an individual seller handling goods | Operational, legal | 3 | 4 | 12 | Founder with counsel | Hosted checkout; vendor DPA; address purge; Mail Order Rule delay notices; entity first; June 2027 go/no-go | Print is promised in any copy or store text |
| 16 | A reminder or notification hurts: wrong person sees it, a grieving or separated family is nudged | Reputational | 3 | 4 | 12 | Product with content owner | No names or text in pushes; child name toggle off by default; pause and "private from now on"; no streaks or guilt copy | A complaint, or any reminder cadence change |
| 17 | Vendor sprawl: CAPTCHA, push, print, email, feedback mailbox, each a subprocessor without a DPA | Privacy, operational | 4 | 3 | 12 | Compliance engineer | Vendor intake checklist; DPA and US location before use; 30-day in-app notice; subprocessor page updated | A new SDK, API key or webhook appears |
| 18 | Name collision and trademark challenge on App Store search, Play, or a printed book | Reputational, legal | 3 | 3 | 9 | Chief Legal Officer | Clearance and opinion before submission (CR-122); no kids terms | Cease-and-desist, or a rejection on name |
| 19 | Accessibility suit on web page, reader, paywall or emails | Legal | 3 | 3 | 9 | Design lead | WCAG 2.2 AA tests in CI for new web surfaces; accessibility statement and route (LEGAL-REQ-052) | A demand letter or a failed audit |
| 20 | Deletion incompleteness across new stores (photos, inbox, exports, feedback, vendor copies, print files) | Privacy, store | 3 | 4 | 12 | Data architect | Bucket registry and purge coverage test; processor deletion within 14 days; stuck-deletion runbook; web deletion before Android | Any new store lacks a purge test |

## 5. Stop, go slow, go

| Theme | Rating | Why, in one line | What lifts it |
|---|---|---|---|
| Family sharing and invites | Go slow | Highest value, but widens who can read a child's letters | FAM-03 plus the floor (removals, Report a concern); counsel on key custody and licence |
| Web contribution page | Go slow | Riskiest surface; reach is worldwide | Counsel memo on reach; FAM-01 and FAM-03; CAPTCHA DPA; pen test |
| Printed books | **Stop** | Entity, vendor, Print Terms and shipping duties are all unresolved | June 2027 go/no-go and founder decision; counsel; vendor DPA |
| Android | **Stop** | Entity, web deletion, Plus-follows-the-book and Play billing unresolved | G-21's four gates; founder decision on Q-008 |
| Other languages (spoken packs, US UI) | Go / go slow | On-device and US only; claims test per language | Native review per pack; claims copy checked |
| Other regions (non-US storefronts) | **Stop** | Needs a GDPR, DPDP or local programme | Per-market programme and a founder decision recorded in DECISIONS.md |
| Cloud backup and export | Go (export) / go slow (backup restore) | Export is a promise we already make; backup holds recovery keys | R-17 and R-19 gates; counsel Q42 |
| Search and AI-free organisation | Go | Local, no new data; sealed letters go slow | No server index; no machine tagging |
| Photos attached to letters | Go slow | New data type, child images, report path needed | Picker only, EXIF strip, purge test, label and policy flip, Report a concern |
| Video attached to letters | **Stop** | Third-party voices, faces, size, abuse exposure | Counsel on voice and faces; a register row |
| Reminders and notifications | Go (local) / go slow (server push) | Apple 4.5.4 and notice rules; harm if mis-timed | Payload test, token purge, opt-in UI |
| Gift or milestone-share flow | Go slow | Digital gift is fine; sharing a child's content outside the book is not trivial | Gift terms; recipient data minimised; FAM-04 token rules |
| Subscriptions and trial changes | Go slow | Auto-renewal law and Apple rules; new-subscriber trial changes are lighter | Notices tested; Terms table in the same PR; no existing-subscriber price rise yet |
| In-app feedback (build 2) | Go slow | D-088 gate is counsel text and the label flip | Counsel sign-off; label update; screenshot and purge tests |
| Mac or web reader (shareable link) | **Stop** | Bearer-link exposure of a child's data; web decrypt | T5-17 live; Reader role; pen test; authenticated owner-only reader first |

Stop-rated: printed books, Android, non-US regions, video, shareable web reader.

## 6. Brief for counsel (questions to add or sharpen)

Existing packet questions that these themes lean on: Q41 (auto-renewal notices), Q42 (backup with escrow), Q43 (privacy claims), Q45 (COPPA for backup), Q46 (age assurance), Q48 (consent design), Q50 (safety removal, custody, orders), Q54 (push tokens in the label), Q57 (sanctions). New or sharpened, each with a default and a deadline for the founder to set:

1. **Worldwide reach of the web page and any web reader.** Does a US family inviting a relative abroad make us "offer services" there under GDPR, UK GDPR or DPDP? Default: no, with the collection limits in LEGAL-REQ-010. Needed before the page is public.
2. **A relative's consent and notice.** What notice and consent does a relative need before their voice, name and relationship are stored, and for how long may an unaccepted contribution wait? Default: notice at collection, short expiry.
3. **Photos.** Is a parent-uploaded photo of a baby "personal information collected from a child" in practice, given our adult-only model? Do we strip metadata, and may we decline to scan? Default: strip, no scanning, report route.
4. **Video and speaker faces and voices.** Any additional duty for video, and is "no face or speaker recognition" a sufficient answer to biometric statutes?
5. **Feedback.** Notice text, Linked or not, account link versus install id, retention (90 days text, 30 days screenshots), screenshots by email. Does Apple's optional-disclosure exception ever apply?
6. **Gift.** Gift term and expiry wording; whether the California gift-certificate rules apply to an in-app gift; initiator status for a share message.
7. **Printed books.** Print Terms; seller registration for an individual; vendor content ownership; shipping claims; whether to form an entity first (founder decision).
8. **Android.** Merchant-of-record, tax, Play account for an individual, age signal on Android.
9. **Existing-subscriber changes.** Notice plan for any price or trial change; whether Apple being merchant of record shifts duties.
10. **Sealed and surviving letters.** The licence for "leave my letters for the child"; how a sealed letter behaves in export, deletion and legal orders.
11. **Primary-source check of the dated statutes.** Please confirm from the statutes themselves the developer duties and effective dates for Texas SB 2420, California AB 1043, and the Utah and Louisiana app-store laws; I could read only Apple's and one law firm's description.

## 7. Conflicts and gaps found in our own documents

1. **Feedback: account link versus install id.** The brief for this lane says feedback is linked to the account with 90-day retention. D-088 says the person is identified by a resettable random install id plus an optional email, text kept 90 days after closing and screenshots 30 days. Linking to the account changes the label's Linked answer, the deletion spec and the privacy copy. Founder to confirm which one; I assumed D-088 unless told otherwise.
2. **Photos versus the label.** `docs/legal/app-store-privacy-labels.md` says Photos or Videos: No, "no photo feature in v1.0", while `docs/legal/DATA_CLASSIFICATION.md` section 4.4 lists a live private `entry-photos` bucket with an enforced path rule and a v1.0 `child-photos` bucket, and CR-113 says "photos of babies are stored". If either bucket is reachable by a v1.0 client, the label is wrong (S4: a photo upload feature must be disclosed). Needs a check by the compliance engineer; I did not inspect the client code.
3. **"Only the people you invite" copy.** Counsel's pending rewrites narrow the claim to a co-parent. Relatives as readers or authors, a web reader and a milestone share each make the current and the proposed wording false in a different way. The claims pass has to be done per release, not once.
4. **Apple age signal reach.** The age signal needs the iOS 26 SDK family and does not reach accounts on iOS 18 or earlier (S3), while FUTURE.md and R-13 plan around 1 Jan 2027. Phones below the signal level rely on our own gate; counsel should say whether that is enough (packet Q46).
5. **Apple 2.3.10.** The iOS listing and app may not carry names or imagery of other mobile platforms (S1). Android announcements (G-21, the "my co-parent uses Android" choice in the invite sheet) must be worded without naming the platform in store metadata.
6. **Register secondary sources.** Several register rows rest on secondary summaries (CARL, Texas, Utah, CT, DPDP). This file did not re-verify them. Cooley, Privacy Law Map, Consenteo and similar are status only, per the regulatory-affairs rule that a remembered fact is not a source.
7. **Underage runbook exists.** `docs/ops/runbooks/underage-account.md` is in the tree; the regulatory-affairs standing duty says it did not exist. I did not read it. Worth confirming it meets LEGAL-REQ-002 (10-day delete, neutral inviter message).

Sign-off line for the founder: Claude role for the next-set screen. Not counsel. Engineering reading, confirm with counsel.
