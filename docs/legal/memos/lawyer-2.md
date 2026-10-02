---
title: Lawyer 2 review, privacy and data protection
date: 2026-10-02
reviewer: AI (Claude), acting as US privacy and data protection counsel
documents: privacy-policy.md 1.1.0, consumer-health-data-notice.md 1.0.0 (new, key health-privacy), app-store-privacy-labels.md 1.1.0, subprocessors.md 1.1.0, compliance-register.md 1.1.0
---

> **AI review, not legal advice.** This memo was prepared by an AI for licensed counsel. No attorney-client relationship exists. A licensed attorney must review and approve every document before publication. Where a source could not be opened, this memo says so ("Unverified" or "Secondary").

# Lawyer 2 review: privacy and data protection

## Summary

The privacy drafts were already honest about the hard parts (text not end-to-end encrypted, escrowed backup keys, opt-in analytics). The main problems were (1) statements that had drifted from decisions made in PRD 1.1 the same day (deletion scope, Plus per account, invite expiry, the deletion clock); (2) a flat "we do not collect biometric information" that is not quite right under the CCPA and Washington definitions, which list voice recordings; (3) the Consumer Health Data Privacy Policy that Washington requires as a separate document did not exist; and (4) a handful of shipped strings that are still broader than the architecture. All four are fixed in my documents or listed for their owners. Versions were bumped per `POLICY_VERSIONING.md`: all are pre-publication drafts, so no notice or re-consent is triggered; the privacy-policy changelog records that the deletion-scope change would be major if 1.0.0 had been published.

## Findings

### High

**H1. Opt-in analytics (Apple 5.1.1(ii)).** Design is right (PRD K-01, LEGAL-REQ-003): PostHog and Sentry initialize only after a choice; declining changes nothing. Residual points: (a) crash reports and usage share one switch (`analyticsConsent.*`, "Share usage and crash reports"); that is acceptable because both are named, but they cannot be split later without a new consent version; (b) the catalogue now sends `child_count_bucket` and child ordinals, so the Privacy Policy no longer says analytics contain no "child details"; it says the only child detail is how many books you keep, as a range; (c) the "not linked" label and deletion conflict: a random analytics ID never stored server-side cannot be found at account deletion. Fix: the in-app deletion call passes the current ID once, in memory (policy CN-18, labels 1.3 condition 6). Email deletion requests cannot reach analytics and the policy says so.

**H2. Consumer health data: yes, letters can contain it.** Washington's MHMDA covers any personal information identifying past, present or future physical or mental health status, has no revenue threshold, treats "retain" as collection, and has a private right of action (RCW 19.373.010, opened). Free text about fevers, NICU stays or postpartum mood, transcripts of it, and the due date are consumer health data. Nevada and Connecticut define it by purpose ("uses to identify"), so letters are a weaker fit there, but the due date and the on-device safety tier are not (Secondary sources). Drafted `consumer-health-data-notice.md` as a short standalone policy (document key `health-privacy`), written to Washington's content list (categories, purposes, sources, categories shared, third-party categories, how to exercise rights). Open points are its notes HN-1 to HN-10; the important ones are below under "Needs a human lawyer". Washington's "homepage" includes every web page that collects personal information and the app's download page, so the link must appear on the site, the contribution page, the waitlist form and the App Store listing.

**H3. Voice recordings and biometrics (BIPA, Texas CUBI, CCPA, MHMDA).** We do not extract voiceprints, and the policy now says so precisely: speech recognition works out words, keeps only text and word timings, and does not identify speakers, tell voices apart or keep any measurement of a voice; no face templates either. Two corrections: (a) 1.0.0 said "we do not collect ... biometric information" flatly. The CCPA lists "voice recordings, from which ... a voiceprint, can be extracted" inside a definition limited to characteristics used or intended to establish identity (Civ. Code 1798.140(c), opened); Washington's "biometric data" lists voice recordings and face imagery. 1.1.0 says we do not use recordings or photos to identify anyone, and the CHD policy lists recordings and photos conservatively. (b) BIPA and CUBI also cover face geometry. Photos are stored, so LEGAL-REQ-019 must extend to photos: no face detection, landmarking or recognition, including OS frameworks used for auto-crop. Register CR-040 updated.

**H4. False or overbroad privacy claims still in `packages/content`.** PRD section 8 fixed the worst ones (register s.3 rows 1 to 10, verified against current files). Remaining, with proposed wording in register s.3 rows 13 to 22:

| Key | Problem | Proposed |
|---|---|---|
| `errors.backupFailed.body` | "Your letters are safe on this phone. We will back up..." Backup is for recordings; letters sync. | "Your recordings are safe on this phone. Backup will continue when you are back online." |
| `settingsMore.signedOutHelp` | "Everything is kept on this phone for now." False the day sign-in ships, and inaccurate for usage data if analytics ships first. | Remove with sign-in; meanwhile "Your letters and recordings are kept on this phone for now." |
| `settingsMore.deleteAccountNotYet` | "deleting the app removes everything on this phone" | Remove with sign-in; meanwhile "removes its letters and recordings from this phone". |
| `settings.recordings.onPhoneBody` | "Recordings live on this phone." Unqualified when backup is on. | Show only with backup off, or "Without backup, recordings live only on this phone." |
| `site.faq` "Who can see my letters?" | Staff read them "to keep the service running": broader than the policy's three cases; "logged" needs the access log (CN-8). | "Our staff look only if you ask for help, to deal with a security problem or serious misuse, or when the law requires it. That access is restricted and logged." |
| `site.privacy.points[4]`, `store` PRIVATE BY DEFAULT | "We never sell or share your data." Plain readers take "share" literally (Lawyer 1 M5). | "No ads. We never sell your data or share it with advertisers." |
| `site.privacy.points[5]` | "export everything as a PDF" | "You can export your book, free, at any time." |
| `site.privacy.points[2]`, `site.faq` recordings | "share them with family" as a separate exit; in-app family playback rides on backup (ADR 0006). | PRD B owner to confirm, then align with Terms 12.1. |
| `settings.privacy.sensitiveLabel` (+ missing consent screen) | "Sync and family sharing" does not name health; Washington and Connecticut consent must name categories. | Add help line and the consent text in CHD policy HN-4. |

Also noted, not false: `onboarding.promise.recordingBody` and `settings.recordings.keepHelp` ("on this phone") are true by default; keep them conditional on backup state. `BRAND.md` "On-device transcription only fixes" needs "by default" (PRD section 8 already lists it). Lawyer 1's M3 ("tidy", "every sentence is one you actually said") is a fidelity claim, not privacy, and stays with Lawyer 1.

**H5. Account deletion and co-parent letter ownership.** The rules are DATA-REQ-003, -012, -015 and PRD K-10, K-22: authors own their words; account deletion removes the author's letters from every book, including a shared one, which stays with the co-parent; a sole parent's book is deleted with everything in it after contributors get an export link. The policy now says exactly that (sections 10, 12, 14). PRD K-10's suggested sentence, "no one can edit or delete another person's words", is not fully true because a sole parent's book deletion removes family letters; section 12 says so and offers the copy. The cascade bug (`children.created_by on delete cascade`, DELETION spec F1) is fixed only in a draft migration; section 10 is inaccurate until it ships.

### Medium

**M1. COPPA.** COPPA should not apply: users are adults, information about the child comes from parents (FTC FAQ A.8), and listing and site are parent-facing after PRD K-20. Two edges, both handled: (a) the `together` prompts, "Write one together" and sibling letters prompt a child to speak into the app, and an audio file with a child's voice is personal information (FAQ F.6); they sit behind the `child-input` flag, off in production (K-19), and the policy says features that ask a child to speak or type are not available; (b) under-13 web contributors are controlled by the 18+ confirmation and the deletion runbook. A baby's voice in the background of a parent's letter is information provided by the parent; counsel should confirm in writing because every recording raises it. Multiple children per account changes nothing here; each child's book has its own family list (PRD-REQ-014), which the policy now states.

**M2. CCPA/CPRA.** Likely not a "business" at launch (revenue far below $26.6M; no sale or sharing), but we comply voluntarily. Fixed: notice at collection now gives a retention period per category (1798.100(a)(3), general knowledge); letter contents are sensitive PI as communications we are not the intended recipient of; child data under 16 treated as sensitive (11 CCR 7001(bbb), from the 1.0.0 sources); request extension of 45 days added. No "Limit" link needed if use stays within service purposes (counsel to confirm 7027(m)).

**M3. Other state laws.** Connecticut applies from 1 July 2026 to any controller processing sensitive data (register CR-020); consent is placed before the first sync (PRD K-15). Revocation: Connecticut reportedly requires processing to stop within 15 days (Unverified); LEGAL-REQ-006 only offers deletion of synced letters. Maryland's strict-necessity rule for sensitive data is met because we only keep and show the book (Secondary). Nevada: see H2. New York's health privacy bill was vetoed and reintroduced (watch item, CR-034). Colorado's biometric amendment is another reason never to start biometric processing (Unverified).

**M4. Data retention.** Policy section 10 now matches `data-policy.md` and PRD: 30-day undo; live erase 31 days, backups 38, processors 45 (K-23, DATA-REQ-036, well inside MHMDA's six-month backup limit); invites 7 and 14 days, fingerprints 90 days after use, expiry or revocation (K-18); activity records 24 months; consent records life plus 3 years, pseudonymised. Conflicts for other owners: `data-policy.md` 4.6 says RevenueCat's app user id is the profile uuid, PRD K-28 says random (use random); the draft data-governance migration still purges `safety_events` after 12 months, which contradicts dropping the table.

**M5. Safety events stay on device.** Policy sections 3, 5, 10 and 13 describe tiers computed and stored only on the phone (K-06, LEGAL-REQ-015). The drop migration has not shipped; CN-10 blocks publication until it does. Separate question: whether on-device tiering is "collection" under MHMDA (CHD policy HN-3).

**M6. Subprocessors.** The public list must carry each vendor's contact (Washington access right). Processor contracts must cover consumer health data. PowerSync (holds letter text, no no-training clause) is a launch gate for Privacy Policy section 6; DeepInfra has no DPA. Apple Declared Age Range and a possible CAPTCHA provider for anonymous web sign-in (K-08) added.

### Low

**L1. Device backups.** iOS includes app files in iCloud and computer backups unless excluded. Section 9 now discloses this as the user's own backup; engineering to decide exclusion (CN-19).

**L2. Microphone purpose string** now names cloud transcription as an exit (labels section 4).

**L3. Store labels.** Sensitive Info (pregnancy) and Play Health info declared for the due date, following PRD K-25's decision that it is health data.

**L4. Standard-mode web playback.** The server unlocks a recording briefly when family play it on the web page (ADR 0010). Policy 1.0.0 said web uploads were never readable by our servers; 1.1.0 says they arrive locked and can be unlocked in Standard mode.

## Requested changes for other owners

| Owner | Change |
|---|---|
| packages/content | Register s.3 rows 13 to 21 (table in H4); sensitive-data consent screen and Settings help line (CHD policy HN-4); CHD policy link in Help and Legal and in the store description legal-links line (with Lawyer 1 M4); `BRAND.md` "by default" |
| PRD B owner | Confirm whether family ever get a recording without backup (H4, row 20); optional second consent at first family share (HN-4) |
| Data architect | Ship `safety_events` drop and remove its purge from the draft data-governance migration; ship `children.created_by on delete set null`; withdrawal of sensitive-data consent per CN-16; pass analytics ID at deletion (CN-18) |
| Data owner (`data-policy.md`) | RevenueCat id random, not profile uuid (4.6) |
| Engineering (legal reqs) | Extend LEGAL-REQ-019 to photos; build service-role access log (CN-8) or soften the claim; decide device-backup exclusion (CN-19); public subprocessor page with contacts |
| Founder | PowerSync written no-training clause and DeepInfra DPA before launch; confirm no affiliates when the LLC is formed |

## Needs a human lawyer (target 2 to 3 hours)

1. **MHMDA consent for others' data (about 45 min).** Can a parent consent for a child's health data (the Act has no parent or guardian mechanism)? How to handle a third adult's health data written by another author, given author ownership (CHD HN-4, HN-5)? Is a second separate consent at first family share needed?
2. **On-device inference (about 20 min).** Is on-device safety tiering "collection" under MHMDA, Nevada or Connecticut (HN-3)?
3. **Biometric reading (about 20 min).** Are kept recordings and face photos "biometric data" (MHMDA) or "biometric information" (CCPA) without analysis; confirm BIPA and CUBI do not reach raw recordings.
4. **Connecticut revocation (about 15 min).** Is offering deletion enough, or must synced letters be erased within 15 days?
5. **COPPA (about 15 min).** Written confirmation that background child audio in a parent's letter is not collection from a child; review before the `child-input` flag turns on.
6. **CCPA applicability and SPI (about 15 min).** 7027(m) purposes so no "Limit" link; risk assessment timing.
7. **Staff access and transparency commitments (about 10 min).** Keep "logged" and the request-count commitment (CN-8, CN-9)?
8. **Standard-mode encryption claims (about 10 min).** Escrowed audio and breach safe harbors (register question 8).

## Sources

Opened 2 October 2026: Washington RCW 19.373.010, .020, .030, .040 (https://app.leg.wa.gov/RCW/default.aspx?cite=19.373); Cal. Civ. Code 1798.140 via Justia (https://law.justia.com/codes/california/code-civ/division-3/part-4/title-1-81-5/section-1798-140/); Future of Privacy Forum on Nevada SB 370 (https://fpf.org/blog/health-data-is-what-health-data-does-in-nevada/, Secondary); Hunton on Connecticut SB 3 and Nevada SB 370 (https://www.hunton.com/privacy-and-cybersecurity-law-blog/connecticut-and-nevada-legislatures-pass-health-data-laws, Secondary). Search results only: New York S929 veto and 2026 reintroduction. Relied on from earlier drafts' sources: FTC COPPA FAQ; Apple App Review Guidelines and App Privacy Details; CCPA regulations summaries. Not opened: BIPA, Texas CUBI, Nevada NRS 603A and Connecticut statutory texts, Colorado HB 24-1130. Internal: `docs/prd/PRD.md` 1.1, PRD A to C, `docs/legal/*`, `docs/adr/0006`, `0008`, `0010`, `supabase/migrations/*`, `packages/content/src/*.en.ts`.
