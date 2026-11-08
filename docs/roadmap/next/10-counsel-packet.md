# Next: counsel packet for the questions that gate the next releases (phase 3, file 10)

Status: DRAFT for the founder to read and send. Nothing here is legal advice.
Date: Sun 8 Nov 2026 (UTC)
Written by: Product Manager (Claude role). Backlog 08 rank 2.
This file is outside `docs/legal/` on purpose. It changes no policy text, no decision and no register row. Counsel's answers, when they come, are filed by the founder in `docs/legal/`.

**I am not counsel.** I am an AI product manager. I have no law licence, there is no attorney-client relationship, and every statement of law below is an engineering reading to be confirmed or corrected by a lawyer. Where I could not open a primary source I say UNVERIFIED. Whether counsel is engaged at all is not known to me (decision F3 in backlog 08 is still the founder's).

Sources. "COUNSEL_PACKET" means `docs/legal/COUNSEL_PACKET.md` version 1.5.0 (dated 1 Nov 2026), which already holds Q41 to Q57; I read it on 8 Nov and repeat only what each question needs. "05" means `05-compliance-risk.md` in this folder (8 Nov), whose source ledger numbers the pages S1 to S13 with the date each was read (all 8 Nov 2026) and the URLs below.

| Id | Source and what 05 says it was used for | URL | Read |
|---|---|---|---|
| S1 | Apple, App Review Guidelines (first 100,000 of 121,490 characters; 5.1.4 only in part). Primary | https://developer.apple.com/app-store/review/guidelines/ | 2026-11-08 |
| S2 | Apple Developer News, apps distributed in Texas (dated 3 Jun 2026). Primary | https://developer.apple.com/news/?id=sg176nne | 2026-11-08 |
| S3 | Apple, age assurance Q&A (needs the iOS 26 family SDKs; iOS 18 and earlier not reached). Primary | https://developer.apple.com/support/age-assurance | 2026-11-08 |
| S4 | Apple, App privacy details (optional-disclosure criteria not on the page I got). Primary | https://developer.apple.com/support/app-privacy-on-the-app-store/ | 2026-11-08 |
| S5 | FTC press release, COPPA and voice recordings (23 Oct 2017, modified 19 Aug 2024). Primary | https://www.ftc.gov/news-events/news/press-releases/2017/10/ftc-provides-additional-guidance-coppa-voice-recordings | 2026-11-08 |
| S6 | Alston and Bird summary of California AB 1043. Secondary; the bill text was blocked | https://www.alstonprivacy.com/california-enacts-digital-age-verification-law/ | 2026-11-08 |
| S11 | Washington RCW 19.373.010 (short extract: consumer health data definition). Primary | https://lawfilesext.leg.wa.gov/Law/RCW/RCW%20%2019%20%20TITLE/RCW%20%2019%20.373%20%20CHAPTER/RCW%20%2019%20.373%20.010.htm | 2026-11-08 |
| S13 | FTC, Mail, Internet or Telephone Order Merchandise Rule business guide. Primary, plain-language guide, not the rule text | https://ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule | 2026-11-08 |

Could not read, so UNVERIFIED everywhere below: the text of Texas SB 2420, California AB 1043, the Utah, Louisiana and Alabama app-store laws, the amended COPPA rule (16 CFR 312) and the FTC COPPA FAQ, the California Automatic Renewal Law and ROSCA, GDPR and UK GDPR Articles 8 and 9, India's DPDP Act and Rules, PIPEDA and CASL, the California gift-certificate statute, Cal. Penal Code 632, 18 U.S.C. 2258A, Apple 5.1.4 in full, and the OFAC and EAR texts COUNSEL_PACKET cites for Q57 (read by its author on 1 Nov, not by me).

---

## Cover note the founder can send (one page)

Subject: Early Letters, 20 questions before we open to outside families and submit to the App Store

Dear [counsel's name],

I am [founder's name], an individual publisher in California. Early Letters is an iPhone app for adults (18 and over only) who talk or type letters to their child. Speech is turned into text on the phone; no audio or text goes to a speech or AI service. In the first release people sign in with Apple or an emailed code and their letters sync to Supabase in the US after a separate consent. We do not sell anything and do not run advertising. Apple is the only seller of the optional paid plan. We plan to turn our servers on for my family's own phones first, so I am asking for your help on the questions below before anyone outside my family signs in.

This packet was prepared by an AI (a Claude role). It is not legal advice and it is not a substitute for yours. Where it states the law it is an engineering reading for you to correct, and where it could not open a source it says UNVERIFIED.

What I am asking for, in order of how much each blocks:

1. **Priority A, by Fri 13 Nov 2026 if you can** (this is the date COUNSEL_PACKET calls T17; I do not yet know your capacity). Nine questions about things already built or about to be: Q44 (real families under draft texts), Q43 (privacy claims), Q48 (consent design), Q41 (renewal notices), Q53 (two parents per book), Q54 (App Privacy answers), Q46 (age assurance), Q47 (publisher identity), Q57 (sanctions). Each has the facts, what we propose, and what we ship if you agree or not.
2. **Part B, later**, eleven questions about features we have not built (relatives, a web page, photos, feedback, gifts, print, Android, sealed letters). We will not build them until you have answered, so there is no date pressure except Item 11 (the dated statutes), which I would like read from the statutes themselves before 1 Jan 2027.

For each question please tell me one of: yes as proposed; yes with these changes; no; or you need more facts. Your confidence in each answer is as useful as the answer.

Files: this packet, and the standing packet `docs/legal/COUNSEL_PACKET.md` (1.5.0) with the draft Privacy Policy, Terms and Subscription Terms. Please tell me your fee basis and whether you want to be sent the text of the in-app screens. Nothing here asks you to approve a launch; I make that call after your answers.

Thank you,
[founder's name]

---

## Part A. Priority A: the nine packet questions, with this release's facts

Order is the founder's order in backlog 08 (F3). "Ships" means what the plan in backlog 08 does next; every row is a proposal, not a decision. The release the facts describe is "build 12" in the plan: servers on, family only, English only, analytics decided separately (F11).

### A1. Q44. Real families under draft texts (priority A, due T17)
- **Facts.** COUNSEL_PACKET Q44: the founding family and first outside families would sign in and sync under texts marked draft, published as version 0.9.0 (POLICY_VERSIONING 2.4), with 1.0.0 offered later with re-consent. Backlog 08 carries the 0.9.0 texts as #616 (the texts) and #652 (served on the website). Default in the packet: no outside family signs in before counsel's comments (T17). Founder decision F5 proposes: family only until Q44 is answered and policy 0.9.0 is live.
- **Proposed answer for you to confirm.** Yes: families may sign in under 0.9.0 if the consent screen says the texts are drafts that may change and asks again when 1.0.0 is published.
- **Sources.** COUNSEL_PACKET section 2 (Q44) and section 0 calendar. No statute read.
- **If yes.** Outside testers can be invited after policy 0.9.0 is live (backlog 08 ranks 5, 6, 10 unblocked for them). **If no, or yes only for family.** Sign-in stays for the founder's own household, build 12 goes ahead for them, and outside families wait for 1.0.0 texts.

### A2. Q43. Privacy claims (priority A, due T17)
- **Facts.** The sign-in line "Your book is shared only with the co-parent you invite", the phrase "Private by default" (store and app), and the staff line "We don't look at your letters. The few ways we could are written in our Privacy Policy." Privacy 3 says letters are not end-to-end encrypted, that we could read them, and when we do. Dashboard access is not separately logged (packet). In build 12 the co-parent feature is proposed hidden (F8), so the first claim is about a feature nobody can use yet. The FTC Act section 5 is the highest register risk (05 gate G-C; register row CR-010).
- **Proposed answer.** Approve the three claims as written for a release in which co-parent is hidden, and rewrite "co-parent you invite" to "you" until the feature is on. Say whether "not end-to-end encrypted, we could read them" is enough while dashboard reads are unlogged.
- **Sources.** COUNSEL_PACKET Q43; 05 section 2 gate G-C, section 7 item 3 (the claim has to be rechecked per release). FTC Act text: UNVERIFIED.
- **If yes.** The strings stay (they are counsel-locked in `docs/reviews/2026-10-31/COUNSEL_LOCKED.md`); store pack (rank 10) proceeds. **If no.** Use counsel's replacement words in the strings and the store page before submission; the content test fails on any other wording.

### A3. Q48. Consent design (priority A, due T17)
- **Facts.** One consent naming the co-parent; on withdrawal, stop and offer deletion. A separate sharing consent exists in code, switched off (packet). Connecticut: whether withdrawal must erase synced letters within 15 days is marked unknown (U) in the packet. The 8 Nov plan adds a "Before you begin" screen: a neutral 18+ question and an agreement on one screen (PR #635, 851 lines, to be split).
- **Proposed answer.** Yes: with co-parent hidden, one consent for the sync of the person's own letters is enough; a separate sharing consent is added when co-parent turns on (1.0.1).
- **Sources.** COUNSEL_PACKET Q48; Washington's definition of consumer health data (S11); statutes for MHMDA content rules and Connecticut: UNVERIFIED.
- **If yes.** #635 splits and ships as built (rank 7). **If no.** Switch on the separate sharing consent now, or require erase-within-15-days on withdrawal; rank 7 grows by one screen and the delete path (rank 8) gets a 15-day clock.

### A4. Q41. Auto-renewal notices with the status report (priority A, due T17)
- **Facts.** Apple is the merchant. The status report and the first-purchase consent record that would let the server send notices are not built. The purchasing phone schedules local reminders and shows a confirmation with Save a copy. The Subscription Terms say reminders "can arrive late or not at all". California 17602(b)(1) (trial over 31 days) and (b)(2) (initial term of a year or more) are read in `docs/emails/COMPLIANCE.md` 5.1 as requiring a notice with the amount; (h) an annual reminder; (a)(3) an acknowledgment. Our own Plus emails are not sent in the first store build (D-121). Plus is $4.99 a month and $49.99 a year (D-082, D-083); the first 2 letters are free; no price is typed in the app, it comes from StoreKit. Whether Apple's receipts satisfy the duties, and whether the duties fall on us when Apple is merchant, is unknown (UNVERIFIED).
- **Proposed answer.** Route (i) of the packet: a narrow exception so the notices show StoreKit's displayed price and period, with phone reminders as the rest; or route (ii): you confirm in writing that Apple's messages meet (b)(1), (b)(2) and (h). Which do you prefer, and may build 12's alpha, which charges nothing, go ahead without either?
- **Sources.** COUNSEL_PACKET Q41 (with its 31 Oct update); S1 (Apple 3.1.1, 3.1.2, read in 05). California Automatic Renewal Law text and ROSCA: UNVERIFIED (05 lists them as not read).
- **If yes.** Plus (rank 14) proceeds with its 10 locked strings and the alpha allowance test (BL-736). **If no.** Plus does not ship in the first public build; the alpha stays free and the Keep sheet shows the alpha note; no price is shown.

### A5. Q53. Two parents per book (priority A, due T17)
- **Facts.** Terms 3.3 and 4: two parents are equals; the inviting parent can undo the join within 72 hours; after that neither can remove the other; leaving has a choice with nothing preselected. Backlog 08 hides the Family tab in the first public release (F8) and plans the co-parent proof for 1.0.1 (rank 23, with Q50).
- **Proposed answer.** Enforceable and fair for separating parents as drafted; if not, say what should change (for example a removal route for a safety order, which Q50 also asks).
- **Sources.** COUNSEL_PACKET Q53 and Q50. No statute read.
- **If yes.** Rank 23 proceeds in 1.0.1 on two phones. **If no.** The Terms 3.3 and 4 change, and the Family tab stays hidden longer. Nothing in build 12 changes either way.

### A6. Q54. App Privacy answers (priority A, due T17, final T30)
- **Facts.** Declared: what the release build sends, linked (labels 3.2 and 3.4 in `docs/legal/app-store-privacy-labels.md`). Open sub-questions (a) to (e) in the packet: backed-up audio linked or not; the per-install ID as Device ID; Purchase History if the status report ships; push tokens; optional disclosure. New facts for this release. (1) Analytics: the founder now wants free, first-party analytics, opt-in, content-free events from an allowlist; the default had been off (D-124); this would need a decision entry and your word on the label (backlog 08 F11). (2) Feedback (build 2): Apple's page names Customer Support as a data type; whether Apple's optional-disclosure exception can ever apply was not readable (S4). (3) Photos: the label doc says "no photo feature in v1.0" while the data inventory lists a private `entry-photos` bucket and a `child-photos` bucket; a compliance-engineer check of the client is pending (05 section 7 item 2).
- **Proposed answer.** Keep the packet's default (declare what the build sends, linked) and add: Customer Support (Linked) when feedback ships; Product Interaction and Other Usage Data (Not Linked) if the analytics sink is switched on; Photos: No only if a client-reference test and a bucket-policy check pass (backlog 08 F14).
- **Sources.** COUNSEL_PACKET Q54; S4 (Apple privacy details, 8 Nov); 05 section 7 items 1 and 2.
- **If yes.** Analytics (rank 15) and feedback (rank 21) can be built against the label. **If no.** Analytics stays off for public builds; the label answers change before submission; Apple lets answers change without an app update (S4), so a late change is possible but not free.

### A7. Q46. Age assurance (priority A for submission, due T17 for AB 1043)
- **Facts.** Texas applies now to new Texas accounts (S2: Declared Age Range, Significant Change API, notification on consent withdrawal). Apple's API needs the iOS 26 family SDKs and does not reach accounts on iOS 18 or earlier (S3); our floor is lower, so on older phones we rely on our own neutral 18+ question. California AB 1043, signed 13 Oct 2025, effective 1 Jan 2027: a developer must request an age signal and treat it as primary, with fines per affected child; Attorney General only (S6, secondary, the bill text blocked: UNVERIFIED). The packet default: no age signal on the server; request the OS signal from T32 (1 Jan 2027).
- **Proposed answer.** (a) Our own question is enough on phones without a signal; (b) the signal may be stored with the Terms acceptance as evidence, as a yes or no only; (c) requesting the signal from 1 Jan 2027 is enough for installs made before.
- **Sources.** S2, S3, S6 (all read 8 Nov); Utah and Louisiana laws: UNVERIFIED.
- **If yes.** The age step in #635 ships as built (rank 7); the signal is added before 1 Jan 2027 (`age_signal_result`, not allowlisted yet). **If no.** The request goes in earlier and a stored result is added to the consent record; rank 7 grows.

### A8. Q47. Publisher identity and key custody (priority A, due T15)
- **Facts.** An individual publisher in California (D-004, D-064); D-134 keeps it. Apple 5.1.1(ix) concerns apps in highly regulated fields and asks for a legal entity (S1, read 8 Nov). The founder holds sealed copies of the escrow key (packet Q47). A mailing address service is planned.
- **Proposed answer.** Individual is acceptable for a free-to-use memory book with Apple as seller; the founder's custody of sealed key copies does not change the entity or insurance advice; if an entity is formed later, the first published texts may name the individual.
- **Sources.** S1; COUNSEL_PACKET Q47; the register's rows CR-054 and CR-122 (not re-read by me).
- **If yes.** Submission proceeds as an individual (rank 10). **If no.** Form an entity before submission, re-key the App Store Connect record, and rewrite the publisher line in the texts; submission slips by the time that takes (unknown).

### A9. Q57. Sanctions: blocked places, and no name screening (priority A, before the sign-up check is switched on and before any sign-in outside the family)
- **Facts.** No payments of our own; US storefront only. Terms 2.4: each user confirms they are not in an embargoed place or on a restricted-party list. D-131: the sign-up check refuses requests whose IP address maps to North Korea, Iran, Cuba, Syria, Russia or Belarus (not yet live); the planned web page also refuses Crimea, Sevastopol, Donetsk and Luhansk. D-137: no name screening. Privacy 12 discloses the check (D-136). A match is suspended, never deleted, and goes to the founder the same day (runbook `docs/ops/runbooks/sanctions-match.md`).
- **Proposed answer.** The Terms confirmation plus the country block is a reasonable programme for a free consumer service with no payments of its own; the country is derived in memory and not kept, so it is not "collected" for the label. Please also answer (b) to (f) in the packet: EAR status, 5D992.c, Kherson and Zaporizhzhia, the 10-day blocked-property report, and the Privacy 12 wording.
- **Sources.** COUNSEL_PACKET Q57 (it cites OFAC's Framework for Compliance Commitments and 31 CFR 501 Appendix A, read by its author on 1 Nov; I did not re-read them: UNVERIFIED).
- **If yes.** The country check ships with #635 (rank 7). **If no.** Name screening is added (against which lists and with what data is your call), which means collecting legal names and probably dates of birth, a new privacy claim and label row; the check is not switched on until then.

---

## Part B. The eleven new or sharpened questions in 05 section 6

Each is for a feature that is not built. Defaults are from 05; "deadline" is the founder's to set and is not set yet. Ratings are from 05 section 5 (an engineering opinion).

### B1. Worldwide reach of the web page and any web reader (go slow; reader link: stop)
- **Facts.** A relative with no app could record or type a letter on a web page reachable from any country. Exposure named in 05: EU and UK GDPR Articles 3(2), 8 and 9; India DPDP section 3(b); Canada. Register position: no targeting, collect only what the notice allows (LEGAL-REQ-010).
- **Proposed answer.** A US family inviting a relative abroad does not make us "offer services" there, provided we collect only what LEGAL-REQ-010 allows and do not target.
- **Sources.** 05 section 3.2 and section 6 item 1. GDPR, UK GDPR and DPDP texts: UNVERIFIED (not read). Needed before the page is public.
- **If yes.** Page goes ahead behind a flag after FAM-01, FAM-03, a CAPTCHA agreement and a pen test. **If no.** Block the page outside the US (a geo gate, which D-131 style IP checks can do) or do not build it.

### B2. A relative's consent and notice
- **Facts.** A relative's voice, name and relationship would be stored. Apple 5.1.2 asks for permission for another person's data (S1). The unaccepted contribution would wait for a short time; the spec has no number I could confirm.
- **Proposed answer.** Notice at collection is enough, with a short expiry (we propose a number once you say what is reasonable).
- **Sources.** S1 (read 8 Nov); 05 section 3.1 and 3.2.
- **If yes.** Relatives as authors (rank 28, family release) can be specified with that notice. **If no.** Add an explicit consent screen for the relative, or do not store their voice until they accept.

### B3. Photos
- **Facts.** The FTC treats a photograph, video or audio file with a child's image or voice as personal information (S5). Users are adults, so we read COPPA as outside scope; a parent-uploaded baby photo is the edge. Metadata (location, time) would be stripped on the phone; no scanning; a report route. Apple requires the Photos or Videos label type when a photo feature uploads (S4). The current label says none.
- **Proposed answer.** A parent-uploaded photo of a baby is not "personal information collected from a child" in practice; stripping metadata and not scanning is acceptable; the report route is enough for 18 U.S.C. 2258A.
- **Sources.** S5, S4 (read 8 Nov); 18 U.S.C. 2258A and COPPA rule text: UNVERIFIED.
- **If yes.** One photo per letter ships as "go slow" with picker only, a strip test, a purge test and the label flipped in the same change. **If no.** No photos; also the label's "No photos" answer must still be checked against the two existing buckets (A6).

### B4. Video, and speaker faces and voices
- **Facts.** Video adds third-party voices and faces and larger files. The product has no face or speaker recognition by design. 05 rates video stop.
- **Proposed answer.** "No face or speaker recognition" is a sufficient answer to biometric statutes, and we have no additional duty beyond photos and audio. (05 gives no default; this is my proposal.)
- **Sources.** 05 section 3.8. Illinois BIPA and Cal. Penal Code 632: UNVERIFIED.
- **If yes.** Video could be specified later (not planned). **If no.** Video stays out of the product.

### B5. Feedback
- **Facts.** The 8 Nov decision: a Settings row, a reference id, a "Shown, Recorded, Never" list, a switch "You may write back to me" (off), an offline queue, a report goes at the earlier of the account purge (day 30) or 90 days from receipt, linked to the account, no screenshots in the first release, its own table, a Google Sheet view with no free text, no email hand-off. Older decision D-088 differs: a resettable random install id plus an optional email, text kept 90 days after closing, screenshots 30 days. The two disagree on account link and on screenshots; the founder has accepted the 8 Nov version (readiness file section 6). The label changes to Data Collected when it ships (D-088).
- **Proposed answer.** Notice text as drafted (three lists, deletion sentence); account-linked is acceptable with the stated retention; Apple's optional-disclosure exception does not apply, so Customer Support is declared and linked.
- **Sources.** 05 section 3.12 and section 7 item 1; S4 (criteria not readable, UNVERIFIED); S11.
- **If yes.** Rank 21 (five tasks, BL-729 to BL-733 as reserved) proceeds in build 2. **If no.** Feedback goes back to an install id or ships text-only with other wording; the Feedback decision entry changes.

### B6. Gift
- **Facts.** A fixed 12-month, non-renewing digital gift. Apple 3.1.1: codes cannot be a way around in-app purchase and cannot be sold (S1). Whether California's gift-certificate law fits an in-app gift is unknown (UNVERIFIED). A share message to a relative: who is the "initiator" under CAN-SPAM is unknown (UNVERIFIED).
- **Proposed answer.** Counsel's gift terms and expiry wording; the gift-certificate statute does not apply to an in-app digital gift; the sender is the initiator. (05 gives no default; these are my guesses to be corrected.)
- **Sources.** S1; 05 section 3.10. FTC Endorsement Guides and 16 CFR 465: UNVERIFIED.
- **If yes.** Digital gift is specified (go slow). **If no.** No gift flow.

### B7. Printed books
- **Facts.** Physical goods use non-IAP payment (Apple 3.1.3(e), S1). The FTC Mail Order Rule needs a reasonable basis for shipping claims, 30 days when none, delay notices and refunds generally within 7 working days (S13, a guide not the rule). We would be the seller; seller registration for an individual is not read (UNVERIFIED). The register says entity before selling physical goods. 05 rates print stop until a June 2027 go or no-go.
- **Proposed answer.** None proposed; we ask for Print Terms, vendor terms, seller registration, shipping claims, and whether to form an entity first. This is the founder's decision with your advice.
- **Sources.** S1, S13 (8 Nov); California seller permit, vendor contracts: UNVERIFIED.
- **If yes or no.** Nothing ships in 2026. Your answer sets whether the June 2027 go or no-go is possible.

### B8. Android
- **Facts.** Google Play requires an 18+ target audience (child imagery can challenge it), accurate Data safety, in-app deletion plus a web link, and Play Billing for digital goods (the Google pages S7 to S10 were read on 8 Nov but are not repeated in my table; URLs in 05 section 1). Apple 2.3.10 bars other platforms' names in iOS metadata. 05 rates Android stop until the entity, web deletion and billing position are settled.
- **Proposed answer.** None proposed. We ask: merchant-of-record and tax duties under Play, Play account type for an individual, whether Google's age-signal duty applies to us.
- **Sources.** S7 to S10 in 05 section 1 (Google pages, 8 Nov); S1.
- **If yes or no.** Nothing ships in 2026; it decides whether the Android gates can be listed at all.

### B9. Existing-subscriber changes
- **Facts.** Changing the price or trial for existing subscribers triggers notice; changing the trial for new subscribers only does not (a note in the register, counsel to confirm). California's renewal law as amended 1 Jul 2025 is read from a secondary summary (UNVERIFIED). Terms 8.11 relies on choosing "keep current price for existing subscribers" in App Store Connect.
- **Proposed answer.** Notice plan for any price or trial change; Apple being merchant of record does not remove our duties. (05 gives no default.)
- **Sources.** 05 section 3.11; COUNSEL_PACKET Q41 update.
- **If yes.** A shorter trial for new subscribers is a go; a price rise for existing subscribers is possible after OPEN-02 and a notice plan. **If no.** No change to existing subscribers.

### B10. Sealed and surviving letters
- **Facts.** Features: "leave my letters for the child" after account deletion, and letters sealed until a date. The packet has Q49 (no fiduciary clause today) and Q50 (legal orders, custody). A letter outliving its author's account needs a licence that survives deletion; California fiduciary-access law is in the register (UNVERIFIED).
- **Proposed answer.** None proposed; we ask what licence, what consent model, and how a sealed letter behaves in export, deletion and legal orders.
- **Sources.** 05 section 3.1 and 3.7; COUNSEL_PACKET Q49 and Q50.
- **If yes or no.** "Leave my letters" stays unbuilt until answered.

### B11. Primary-source check of the dated statutes
- **Facts.** I could read only Apple's description of Texas SB 2420 (S2) and one law firm's note on California AB 1043 (S6). I did not read Utah, Louisiana or Alabama laws.
- **Proposed answer.** Please confirm from the statutes themselves the developer duties and effective dates for Texas SB 2420, California AB 1043, and the Utah and Louisiana laws.
- **Sources.** S2, S6 (8 Nov); statute texts UNVERIFIED.
- **Affects.** Q46 (A7): the age signal work in rank 7, and the 1 Jan 2027 date. If your reading differs from ours, the date moves.

---

## Not verified in this file

- That counsel is engaged, or that the dates T15, T17, T30 and T32 from COUNSEL_PACKET (written 1 Nov) still stand.
- The truth of any "what ships" line: they follow backlog 08 as the founder confirmed it, and each depends on decisions F1 to F17 that are still his.
- All statute text (list at the top). The Google pages S7 to S10 and the register's CR numbers were taken from 05, not re-read.
- The in-app text of the 10 locked Plus strings and of the Before you begin screen: not attached; the founder should send screenshots if counsel asks.

Product Manager (Claude role). Not counsel. Engineering reading, confirm with counsel.
