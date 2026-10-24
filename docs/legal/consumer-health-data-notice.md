---
title: Early Letters Consumer Health Data Privacy Policy
key: health-privacy
version: 1.3.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-15
owner: founder
reviewers: outside privacy counsel (TBD)
---

> **Draft for counsel review, not legal advice.** Drafted by an AI (Claude) as drafting support for counsel, for review by a licensed attorney. It is not legal advice and must not be published until counsel has reviewed it. Notes for counsel are tagged [HN-1] and so on and collected in Appendix A; remove the tags, Appendix A and this notice before publishing. Placeholders in braces must be filled in. Document key `health-privacy` in `POLICY_VERSIONING.md`, published at https://earlyletters.com/health-privacy (D-063); reasoning in `memos/lawyer-2.md` finding H2; open questions numbered in `COUNSEL_PACKET.md` 1.1.0 (Q2, Q3, Q32). Version 1.3.0 covers the server-on v1.0 (M14, D-089), including opt-in encrypted recording backup with a recovery key we hold (D-073, D-091).

# Consumer Health Data Privacy Policy

Version 1.3.0. Effective date: TBD.

Some state laws protect "consumer health data" with their own rules: Washington's My Health My Data Act, Nevada's consumer health data law (SB 370), and Connecticut's consumer health data provisions. This policy explains how those rules apply to Early Letters. We follow it for everyone in the United States, wherever you live. Our main Privacy Policy at https://earlyletters.com/privacy covers everything else.

## 1. Why a memory book has health data

Early Letters does not ask about anyone's health, and we don't analyze what you write. But letters are free-form, so they can hold health information about you, your child or someone else in the family: a fever, a hospital stay, a pregnancy, how you are feeling. Under these laws, that can be consumer health data. [HN-1]

## 2. What consumer health data we may collect

| Kind | Examples | Where it comes from | Why we have it |
|---|---|---|---|
| Health details inside letters | Words in a letter, its original transcript and its fixes that mention a condition, treatment, symptom, medication, pregnancy or mental health | You, and your co-parent writing to the same child | To keep, sync and show the book you asked for |
| Due date | A due date entered before the child is born, which shows a pregnancy | You | To date letters and sort the "Before You" chapter |
| Recordings (only if you turn on recording backup) | Your voice recordings, which can include health details you or others speak about. Without backup, recordings stay on your phone and do not reach us. With backup, each recording is encrypted on your phone before upload, and we keep a recovery key that could open it (see section 5) | You | To back up your recordings and restore them to you on a new phone. Some laws list voice recordings as biometric data. We never make a voiceprint from them, never use them to identify anyone, and never imitate a voice. [HN-2] |

**What we do not collect.** We don't ask health questions, connect to health apps or devices, use your location, or make guesses about anyone's health, on our servers or on your phone. Settings has a fixed "If you are struggling" list of resources; the app does not scan your letters for it. [HN-3]

Letters you keep only on your phone, without signing in, never reach us. We never transcribe recordings on our servers.

## 3. How we use it

Only to provide Early Letters: storing your letters, syncing them to your other phones, showing them to your co-parent, exporting your book, and, if you turn it on, backing up your recordings and restoring them to you. Speech is transcribed on your phone. We never use consumer health data for advertising, marketing, profiling, research or training AI models, and we never sell it.

## 4. Your agreement

Before anything you write is first synced to your account, we ask for your agreement in a separate, plain step. If you say no, you can keep using Early Letters on your phone, and syncing and writing with a co-parent stay off. You can withdraw your agreement at any time in Settings, Privacy. Syncing then stops, and we offer to delete what you already synced. Letters already synced stay on our server, and in the shared book for your co-parent, until you delete them or your account. [HN-4]

**Recording backup is a separate agreement.** Backup is off until you turn it on. Turning it on is its own agreement, recorded with the date and the version of the text you saw. You can turn it off at any time in Settings, Storage and backup, and choose to keep or delete what is backed up. [HN-11]

## 5. Who receives it

| Who | What | Why |
|---|---|---|
| Your co-parent | Letters you add to the child's book, and the child's due date | Because you chose to write the book together. |
| Our service providers (processors) | What each needs to run its part of the service | Hosting, sync and encrypted recording backup (Supabase, including a separate project that runs only our recovery service). They act only on our instructions under contract and must delete data when we ask. The list, with contact details, is at https://earlyletters.com/subprocessors. |
| Authorities | Only what a valid legal process requires | See the Privacy Policy, section 7. |

We have no affiliates. [HN-10] We don't share consumer health data with anyone else, and we never sell it. We don't use geofences or any location data. Only the founder can reach stored letters, and only for support you ask for, security, or a legal requirement. Access through our support tools is logged; access through our hosting provider's console is not logged by us today.

**Backed-up recordings.** We use our recovery key only through our recovery service, and only to restore your recordings to a new phone you signed in on, to replace the recovery key, or to answer a legal order we must obey. Each time it opens one of your keys, it keeps a record and we email you, unless a legal order forbids it. A person who held our recovery key and a copy of our database and storage could open recordings without the recovery service; our Privacy Policy, section 7, says who could and how we guard against it. We never listen to your recordings, sell them or use them to train models. Your co-parent cannot hear your backed-up recordings.

## 6. Your rights

You can:

- **Confirm and access.** Ask whether we hold consumer health data about you, get a copy, and get the list of every company that received it, with their contact details. Most people can do this themselves with Export everything in Settings, Your data.
- **Delete.** Delete letters, a book or your account in the app, or ask us. Deleting a letter also deletes its backed-up recording on the same clock, and turning backup off lets you delete everything backed up. We erase deleted data from our live systems within 31 days, from our backups within 38 days, and our service providers erase it within 45 days. We tell our service providers about your request. (Our email provider keeps a copy of each email we send, including the one confirming a deletion, for 30 days after sending; none of them contains your letters or recordings. Our record of when our recovery service used your keys is kept for 24 months without your name or email; it holds no health data.)
- **Withdraw consent.** In Settings, Privacy, at any time (section 4).
- **Appeal.** If we turn down a request, reply to our answer with "Appeal" in the subject. We respond within 45 days, and if we still say no, we tell you how to contact your state attorney general.

How to ask: email hello@earlyletters.com; for deletion, the app or https://earlyletters.com/delete-account. We answer within 45 days. If we need longer, we tell you within those 45 days and finish within 45 more. Requests are free, at least twice a year. We confirm it is you by sending a sign-in link to the email on your account. You can use an authorized agent; we will ask for proof that you gave them permission. We never treat you differently for using these rights.

**Information about someone else.** A letter may mention another person's health, such as a parent writing about a grandparent's surgery. Each letter belongs to the person who wrote it. If a letter that someone else wrote mentions your health, email us and we will help, including by asking the author or the book's parents to remove it. [HN-5]

## 7. Changes and contact

We will tell you in the app and by email at least 30 days before any change to how we collect, use or share consumer health data, and ask for your agreement again where the law requires.

{PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}. Email hello@earlyletters.com.

---

## Appendix A. Notes for counsel (remove before publishing)

**HN-1. Decision: yes, letters can contain consumer health data.** Washington's definition covers personal information that identifies a consumer's past, present or future physical or mental health status, including conditions, treatments, medications, bodily functions and symptoms, reproductive or sexual health information, biometric data, and information derived or inferred from non-health data [L1]. It has no revenue threshold and is enforced through the Consumer Protection Act, including a private right of action (register CR-031). Washington's "collect" includes "retain" and "otherwise process", so storing free text that happens to mention health is collection even though we never analyze it. Nevada (SB 370, in force 31 March 2024) and Connecticut define consumer health data by purpose: data the entity "uses to identify" a health status or condition [L2][L3]. We do not use letter text that way, so the Nevada and Connecticut definitions are narrower for letters, but the due date and the safety tier (HN-3) are closer calls. Connecticut also treats data revealing a health condition as "sensitive data", which needs consent (register CR-020). One policy and one consent, written to the strictest law, is cheaper than three. Nevada and Connecticut have no private right of action [L3]. New York's Health Information Privacy Act (S929) was vetoed (reported January 2026) and a revised bill was introduced in 2026 [L4]; status not tracked, watch item.

**HN-2. Voice recordings and photos.** Washington's "biometric data" is data generated by measuring or technologically processing a person's physiological, biological or behavioral characteristics that identifies a consumer, and its examples include imagery of the face and "voice recordings" (the statute's example list, as read on 2 Oct 2026, ties them to an identifier template that can be extracted; confirm against the official text) [L1]. We never extract a template, and the better reading is that a recording kept as a keepsake is not biometric data. Updated in 1.3.0: owner backup ships in v1.0 (D-073, M14), so recordings can reach us, encrypted, and we can decrypt them through escrow (M16, D-091; F08 6.5). Section 2 therefore lists recordings conservatively, as this note advised for the day audio upload ships, and section 5 describes the recovery key and its honest limit (F08 6.5 C). Question for counsel (COUNSEL_PACKET Q32 (b)): is a stored, decryptable voice recording of a named person "biometric data" or consumer health data under MHMDA when no template is ever extracted? If counsel concludes it is not, the row can say so. There are still no photos in v1.0.

**HN-3. On-device safety tiering (not in v1.0).** D-059 defers the safety classifier to v1.1; v1.0 ships a static "If you are struggling" row and no tiering, so this note applies only when the classifier ships. `packages/core/src/safety.ts` tiers letters for self-harm and harm-to-baby language on the phone, stores the tier only in the local database (PRD K-06, LEGAL-REQ-015) and shows a support card. Washington's "collect" includes "infer, derive ... or otherwise process ... in any manner", and the inference is about mental health. Question for counsel: is software we distribute that infers and stores a tier on the user's own device, never transmitted, "collection" by us? If yes, it needs either consent or the "necessary to provide a product or service the consumer requested" exception, and the support card is not something the user requested. Options: (a) take the position that on-device processing we cannot access is not collection by the regulated entity (Apple and Google treat on-device processing as not collected); (b) describe the support card in the sensitive-data consent so the consent covers it; (c) add a Settings switch to turn support cards off. We recommend (a) plus (b) at no product cost, and (c) if counsel is uneasy. Nevada and Connecticut are purpose-based, and a tier is "used to identify" a mental health state, so the same question applies there.

**HN-4. Consent design.** Washington allows collection without consent where necessary to provide the product or service the consumer requested, but sharing needs consent "separate and distinct" from collection consent unless necessary for a requested service [L1]. Two gaps:
1. *Whose request.* The exceptions turn on the consumer "to whom such consumer health data relates". A parent requests the service, but a letter may hold the child's or a grandparent's health data. The Act has no parent-or-guardian mechanism (the definitions do not mention parents, guardians or minors). Counsel to advise whether a parent's request and consent cover a child's data, and how to treat a third adult's data written by someone else.
2. *Separate sharing consent (D-050, open).* The current design (PRD K-15, LEGAL-REQ-006) has one consent before the first sync. With co-parent only at v1.0 (D-055), the only sharing is with the child's other parent, which is arguably "necessary to provide" the shared book the user requested. We still recommend a second, separate affirmative act the first time a user invites a co-parent, with one line: "Letters you add to {child}'s book can be read by the co-parent you invite. That can include health details." Recorded as its own `policy_acceptances` row. It costs one tap once and removes the separate-consent argument. Default if counsel does not answer: no second consent; the `sensitive-data` text names sharing with a co-parent.
Consent text must list categories, purpose, recipients and how to withdraw [L1]. Proposed `sensitive-data` text for the content owner (follows VOICE.md; counsel to approve): "Letters can hold private things, like health details about you or {child}. To sync your book and share it with your co-parent, we store what you write on our servers. We use it only to keep and show your book. We never sell it, use it for ads or train AI on it. You can change this any time in Settings, Privacy." Buttons: "Agree and sync", "Keep on this phone". Withdrawal: LEGAL-REQ-006 offers deletion of synced letters; see privacy policy CN-16 on Connecticut's 15-day revocation rule.

**HN-5. Third-party health data and deletion conflicts.** A grandparent's letter about the mother's postpartum mood is the mother's consumer health data, written by someone else. Washington gives the mother a deletion right against us, but our ownership rule says no one deletes another person's words (DATA-REQ-015). Counsel to advise how to reconcile a statutory deletion request with author ownership. Proposed runbook: verify the requester, ask the author to remove or edit the letter, and if they do not within the 45-day window, remove the letter from the book and keep it only in the author's private letters, or delete it if counsel requires. Same tension for Nevada's deletion right.

**HN-6. Homepage links.** Washington requires a prominent link on the "homepage", defined to include any web page where personal information is collected and, for mobile apps, the app's platform or download page [L1]. Links needed: website footer on every page (earlyletters.com), any waitlist form, the App Store listing (description legal-links line; `store.en.ts` lists only Terms and Privacy today, request in in-app-disclosures 1.4.0 section 4), and Settings, Help and Legal (PRD K-17). The family contribution page is later than v1.0.

**HN-7. Processors.** In v1.0 the only processor that can see letter text is Supabase (PowerSync is not used, D-023; no cloud transcription or web uploads, D-059). Updated in 1.3.0: Supabase also stores encrypted recordings and wrapped keys, and a separate Supabase project holds the escrow private key (F08 6.5 G2); hosting-provider staff with access to that project are part of the honest limit (COUNSEL_PACKET Q11 (b)). It must be bound to process consumer health data only under a binding contract and to honor deletion requests [L1]; its DPA is GDPR-style and likely sufficient (subprocessors.md section 4). Resend sees email addresses only.

**HN-8. Deletion timing.** Washington allows deletion from backups to be delayed to enable restoration but not beyond six months from authentication of the request [L1]; our 38-day backup clock is well inside it. Nevada allows longer (two years, per FPF [L2]).

**HN-9. Due date in Apple's label.** Apple lists "pregnancy or childbirth information" as Sensitive Info; app-store-privacy-labels.md declares it (1.1.0 onward).

**HN-10. Affiliates and provider identity (updated 3 Oct 2026).** The founder publishes as an individual with no LLC for now (`docs/DECISIONS.md` D-004, D-064), so there are no affiliates to name. Confirm MHMDA duties apply the same way to an individual "regulated entity" (the Act has no revenue threshold), and revisit this note if an entity is formed.

**HN-11. Backup consent (new in 1.3.0).** F08-REQ-039 records a `backup` consent act when the owner turns backup on; the server refuses uploads without it (R8 R2A-26). R4 PT-22: the sensitive-data consent ("Agree and sync") names sync and family sharing, not voice recordings held by us with a recovery key, and MHMDA lists voice recordings among biometric examples. Counsel decides whether one consent could cover both (F08 Q6; COUNSEL_PACKET Q32 (c)); the default is a separate act. The consent text must list categories, purpose, recipients and how to withdraw [L1]; F08 6.7 `backup.sheetBody` and `backup.sheetNotIncluded` are the proposed words (in-app disclosures 1.5.0 section 3c).

## Appendix B. Sources

Opened 2 October 2026:
- [L1] Washington RCW 19.373.010, .020, .030, .040: https://app.leg.wa.gov/RCW/default.aspx?cite=19.373
- [L2] Future of Privacy Forum, (Health) Data is What (Health) Data Does in Nevada: https://fpf.org/blog/health-data-is-what-health-data-does-in-nevada/
- [L3] Hunton Andrews Kurth, Connecticut and Nevada Legislatures Pass Health Data Laws (Secondary): https://www.hunton.com/privacy-and-cybersecurity-law-blog/connecticut-and-nevada-legislatures-pass-health-data-laws
- [L4] Search results only, not opened: Healthcare Brew, New York's governor vetoes health data privacy bill (12 Jan 2026): https://www.healthcare-brew.com/stories/2026/01/12/new-york-governor-vetoes-health-data-privacy-bill ; Morrison Foerster, NYHIPA returns in 2026: https://www.mofo.com/resources/insights/260316-nyhipa-returns-in-2026-revised-bill

Repository sources added for 1.3.0 (15 October 2026): PRD V2 `_AUTHORING.md` 3b (M14, M16); F08 sections 6.5, 6.7, 8; F17 sections 6.2 B, 8.4; R4 PT-01, PT-22, PT-23; R8 R2A-01, R2A-26; DECISIONS D-073, D-089, D-091.

Not opened: Nevada NRS 603A text; Connecticut General Statutes 42-515 ff. text (and the SB 1295 amendments); the Washington Attorney General's MHMDA FAQ.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.3.0 | 2026-10-15 | Server-on v1.0 (M14, D-089). Section 2 Recordings row no longer says recordings never reach us or that we do not back them up: it lists recordings when the owner turns on backup, encrypted on the phone, with a recovery key we hold (D-073, M16, D-091; R4 PT-01; F08 6.5 claims table row "CHD notice section 3"). Section 3 adds backup as a use. Section 4 adds what stays on the server after withdrawal (R4 PT-23; F17 6.2 B step 3) and the separate backup consent (F08-REQ-039; R4 PT-22; HN-11). Section 5: processors include encrypted backup and the separate recovery project; the staff-access sentence narrowed to support tools with console access stated as not logged (R4 PT-03; F17 8.2 item 6); new paragraph on backed-up recordings with the three uses, a record and email per use, and the honest limit (F08 6.5 C; R8 R2A-01; F17-REQ-027), with no claim that only the family's keys can open them. Section 6: deletion reaches backed-up recordings; the recovery-key log is a named exception (F17 8.4; R4 PT-34). HN-2 and HN-7 updated; HN-11 added. Pre-publication draft; no users bound; if 1.2.0 had been published, collecting voice recordings would be a change to how we collect consumer health data needing notice and consent (section 7). |
| 1.2.0 | 2026-10-03 | Alignment with the founder decisions of 3 Oct 2026, second round: co-parent only (sections 2, 5; D-055); no recordings, photos, backups or cloud transcription reach us (sections 2, 3, 4; D-059); no on-device support card or tiering in v1.0, a static resources row instead (section 2, HN-3; D-059); processors reduced to Supabase for content (section 5, HN-7); the email provider's 30-day copy of deletion emails disclosed (section 6); real URLs and hello@earlyletters.com (D-063); HN-4 rewritten for co-parent sharing (D-050); HN-6 links updated. Body version line corrected (it said 1.0.0). Pre-publication draft; no users bound. |
| 1.1.0 | 2026-10-03 | Provider is the founder as an individual ({PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}); HN-10 updated (no affiliates). Pre-publication draft; no users bound. |
| 1.0.0 | 2026-10-02 | First draft for counsel review (`memos/lawyer-2.md`). |
