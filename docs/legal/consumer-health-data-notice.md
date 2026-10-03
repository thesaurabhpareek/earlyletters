---
title: Early Letters Consumer Health Data Privacy Policy
key: health-privacy
version: 1.1.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-03
owner: founder
reviewers: outside privacy counsel (TBD)
---

> **Drafting notice.** Drafted by an AI (Claude) acting as privacy counsel, for review by a licensed attorney. It is not legal advice and must not be published until counsel has reviewed it. Notes for counsel are tagged [HN-1] and so on and collected in Appendix A; remove the tags, Appendix A and this notice before publishing. Placeholders in braces must be filled in. Document key `health-privacy` in `POLICY_VERSIONING.md`; reasoning in `memos/lawyer-2.md` finding H2.

# Consumer Health Data Privacy Policy

Version 1.1.0. Effective date: TBD.

Some state laws protect "consumer health data" with their own rules: Washington's My Health My Data Act, Nevada's consumer health data law (SB 370), and Connecticut's consumer health data provisions. This policy explains how those rules apply to Early Letters. We follow it for everyone in the United States, wherever you live. Our main Privacy Policy at {PRIVACY_POLICY_URL} covers everything else.

## 1. Why a memory book has health data

Early Letters does not ask about anyone's health, and we don't analyze what you write. But letters are free-form, so they can hold health information about you, your child or someone else in the family: a fever, a hospital stay, a pregnancy, how you are feeling. Under these laws, that can be consumer health data. [HN-1]

## 2. What consumer health data we may collect

| Kind | Examples | Where it comes from | Why we have it |
|---|---|---|---|
| Health details inside letters | Words in a letter, its original transcript and its fixes that mention a condition, treatment, symptom, medication, pregnancy or mental health | You, and family members writing to the same child | To keep, sync and show the book you asked for |
| Due date | A due date entered before the child is born, which shows a pregnancy | You | To date letters and sort the "Before You" chapter |
| Recordings and photos | The audio of spoken letters you back up or send from the web page; photos you add | You, and family members | So your family can hear and see them. Some laws list voice recordings and face images as biometric data. We never make a voiceprint or face template from them. [HN-2] |

**What we do not collect.** We don't ask health questions, connect to health apps or devices, use your location, or make guesses about anyone's health on our servers. The app may show a gentle support card if a letter suggests someone could use help. That check runs only on your phone, its result stays on your phone, and nothing about it is sent to us. [HN-3]

Letters you keep only on your phone, without signing in, never reach us.

## 3. How we use it

Only to provide Early Letters: storing your letters, syncing them to your other phones, showing them to the family you choose, transcribing speech, keeping backups, and exporting your book. We never use consumer health data for advertising, marketing, profiling, research or training AI models, and we never sell it.

## 4. Your agreement

Before anything you write is first synced to your account, we ask for your agreement in a separate, plain step. If you say no, you can keep using Early Letters on your phone, and syncing, backup and family sharing stay off. You can withdraw your agreement at any time in Settings, Privacy, Sync and family sharing. Syncing then stops, and we offer to delete what you already synced. [HN-4]

Cloud transcription has its own separate agreement, asked before any audio leaves your phone.

## 5. Who receives it

| Who | What | Why |
|---|---|---|
| Family you invite to a child's book | Letters you add to that book, their recordings if backed up, photos, the child's due date | Because you chose to share the book with them. Co-parents read the book; other family read it only if a parent turns that on. |
| Our service providers (processors) | What each needs to run its part of the service | Hosting, sync, cloud transcription (only if you agree), backups. They act only on our instructions under contract and must delete data when we ask. The list, with contact details, is at {SUBPROCESSORS_URL}. |
| Authorities | Only what a valid legal process requires | See the Privacy Policy, section 7. |

We have no affiliates. [HN-10] We don't share consumer health data with anyone else, and we never sell it. We don't use geofences or any location data. Inside our company, only the founder and named engineers can reach stored letters, and only for support you ask for, security, or a legal requirement. Each access is logged.

## 6. Your rights

You can:

- **Confirm and access.** Ask whether we hold consumer health data about you, get a copy, and get the list of every company that received it, with their contact details. Most people can do this themselves with Export everything in Settings, Your data.
- **Delete.** Delete letters, a book or your account in the app, or ask us. We erase deleted data from our live systems within 31 days, from our backups within 38 days, and our service providers erase it within 45 days. We tell our service providers about your request.
- **Withdraw consent.** In Settings, Privacy, at any time (section 4).
- **Appeal.** If we turn down a request, reply to our answer with "Appeal" in the subject. We respond within 45 days, and if we still say no, we tell you how to contact your state attorney general.

How to ask: email {PRIVACY_EMAIL}, or use the web page at {WEB_DELETION_URL} for deletion. We answer within 45 days. If we need longer, we tell you within those 45 days and finish within 45 more. Requests are free, at least twice a year. We confirm it is you by sending a sign-in link to the email on your account. You can use an authorized agent; we will ask for proof that you gave them permission. We never treat you differently for using these rights.

**Information about someone else.** A letter may mention another person's health, such as a parent writing about a grandparent's surgery. Each letter belongs to the person who wrote it. If a letter that someone else wrote mentions your health, email us and we will help, including by asking the author or the book's parents to remove it. [HN-5]

## 7. Changes and contact

We will tell you in the app and by email at least 30 days before any change to how we collect, use or share consumer health data, and ask for your agreement again where the law requires.

{PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}. Email {PRIVACY_EMAIL}.

---

## Appendix A. Notes for counsel (remove before publishing)

**HN-1. Decision: yes, letters can contain consumer health data.** Washington's definition covers personal information that identifies a consumer's past, present or future physical or mental health status, including conditions, treatments, medications, bodily functions and symptoms, reproductive or sexual health information, biometric data, and information derived or inferred from non-health data [L1]. It has no revenue threshold and is enforced through the Consumer Protection Act, including a private right of action (register CR-031). Washington's "collect" includes "retain" and "otherwise process", so storing free text that happens to mention health is collection even though we never analyze it. Nevada (SB 370, in force 31 March 2024) and Connecticut define consumer health data by purpose: data the entity "uses to identify" a health status or condition [L2][L3]. We do not use letter text that way, so the Nevada and Connecticut definitions are narrower for letters, but the due date and the safety tier (HN-3) are closer calls. Connecticut also treats data revealing a health condition as "sensitive data", which needs consent (register CR-020). One policy and one consent, written to the strictest law, is cheaper than three. Nevada and Connecticut have no private right of action [L3]. New York's Health Information Privacy Act (S929) was vetoed (reported January 2026) and a revised bill was introduced in 2026 [L4]; status not tracked, watch item.

**HN-2. Voice recordings and photos.** Washington's "biometric data" is data generated by measuring or technologically processing a person's physiological, biological or behavioral characteristics that identifies a consumer, and its examples include imagery of the face and "voice recordings" (the statute's example list, as read on 2 Oct 2026, ties them to an identifier template that can be extracted; confirm against the official text) [L1]. We never extract a template, and the better reading is that a recording kept as a keepsake is not biometric data. We still list recordings and photos here because a stored voice recording of a named person is the example the definition gives, and the cost of listing them is nil. If counsel concludes they are not consumer health data, this row can say so.

**HN-3. On-device safety tiering.** `packages/core/src/safety.ts` tiers letters for self-harm and harm-to-baby language on the phone, stores the tier only in the local database (PRD K-06, LEGAL-REQ-015) and shows a support card. Washington's "collect" includes "infer, derive ... or otherwise process ... in any manner", and the inference is about mental health. Question for counsel: is software we distribute that infers and stores a tier on the user's own device, never transmitted, "collection" by us? If yes, it needs either consent or the "necessary to provide a product or service the consumer requested" exception, and the support card is not something the user requested. Options: (a) take the position that on-device processing we cannot access is not collection by the regulated entity (Apple and Google treat on-device processing as not collected); (b) describe the support card in the sensitive-data consent so the consent covers it; (c) add a Settings switch to turn support cards off. We recommend (a) plus (b) at no product cost, and (c) if counsel is uneasy. Nevada and Connecticut are purpose-based, and a tier is "used to identify" a mental health state, so the same question applies there.

**HN-4. Consent design.** Washington allows collection without consent where necessary to provide the product or service the consumer requested, but sharing needs consent "separate and distinct" from collection consent unless necessary for a requested service [L1]. Two gaps:
1. *Whose request.* The exceptions turn on the consumer "to whom such consumer health data relates". A parent requests the service, but a letter may hold the child's or a grandparent's health data. The Act has no parent-or-guardian mechanism (the definitions do not mention parents, guardians or minors). Counsel to advise whether a parent's request and consent cover a child's data, and how to treat a third adult's data written by someone else.
2. *Separate sharing consent.* The current design (PRD K-15, LEGAL-REQ-006) has one consent before the first sync. We recommend a second, separate affirmative act the first time a user shares a book with family (first invite sent, or first letter added to a book that has other members), with one line: "Letters you add to {child}'s book can be read by the family you invite. That can include health details." Recorded as its own `policy_acceptances` row. This costs one tap once and removes the separate-consent argument.
Consent text must list categories, purpose, recipients and how to withdraw [L1]. Proposed `sensitive-data` text for the content owner (follows VOICE.md; counsel to approve): "Letters can hold private things, like health details about you or {child}. To sync your book and share it with the family you choose, we store what you write on our servers. We use it only to keep and show your book. We never sell it, use it for ads or train AI on it. You can change this any time in Settings, Privacy." Buttons: "Agree and sync", "Keep on this phone". Withdrawal: LEGAL-REQ-006 offers deletion of synced letters; see privacy policy CN-16 on Connecticut's 15-day revocation rule.

**HN-5. Third-party health data and deletion conflicts.** A grandparent's letter about the mother's postpartum mood is the mother's consumer health data, written by someone else. Washington gives the mother a deletion right against us, but our ownership rule says no one deletes another person's words (DATA-REQ-015). Counsel to advise how to reconcile a statutory deletion request with author ownership. Proposed runbook: verify the requester, ask the author to remove or edit the letter, and if they do not within the 45-day window, remove the letter from the book and keep it only in the author's private letters, or delete it if counsel requires. Same tension for Nevada's deletion right.

**HN-6. Homepage links.** Washington requires a prominent link on the "homepage", defined to include any web page where personal information is collected and, for mobile apps, the app's platform or download page [L1]. Links needed: website footer on every page, the family contribution page, the waitlist form, the App Store listing (description legal-links line, Lawyer 1 M4), and Settings, Help and Legal (PRD K-17).

**HN-7. Processors.** Every processor that can see letter text or recordings (Supabase, PowerSync, Groq, DeepInfra, Vercel for encrypted uploads) must be bound to process consumer health data only under a binding contract and to honor deletion requests [L1]. See subprocessors.md section 4. DeepInfra has no DPA yet.

**HN-8. Deletion timing.** Washington allows deletion from backups to be delayed to enable restoration but not beyond six months from authentication of the request [L1]; our 38-day backup clock is well inside it. Nevada allows longer (two years, per FPF [L2]).

**HN-9. Due date in Apple's label.** Apple lists "pregnancy or childbirth information" as Sensitive Info; app-store-privacy-labels.md 1.2.0 declares it.

**HN-10. Affiliates and provider identity (updated 3 Oct 2026).** The founder publishes as an individual with no LLC for now (`docs/DECISIONS.md` D-004), so there are no affiliates to name. Confirm MHMDA duties apply the same way to an individual "regulated entity" (the Act has no revenue threshold), and revisit this note if an entity is formed.

## Appendix B. Sources

Opened 2 October 2026:
- [L1] Washington RCW 19.373.010, .020, .030, .040: https://app.leg.wa.gov/RCW/default.aspx?cite=19.373
- [L2] Future of Privacy Forum, (Health) Data is What (Health) Data Does in Nevada: https://fpf.org/blog/health-data-is-what-health-data-does-in-nevada/
- [L3] Hunton Andrews Kurth, Connecticut and Nevada Legislatures Pass Health Data Laws (Secondary): https://www.hunton.com/privacy-and-cybersecurity-law-blog/connecticut-and-nevada-legislatures-pass-health-data-laws
- [L4] Search results only, not opened: Healthcare Brew, New York's governor vetoes health data privacy bill (12 Jan 2026): https://www.healthcare-brew.com/stories/2026/01/12/new-york-governor-vetoes-health-data-privacy-bill ; Morrison Foerster, NYHIPA returns in 2026: https://www.mofo.com/resources/insights/260316-nyhipa-returns-in-2026-revised-bill

Not opened: Nevada NRS 603A text; Connecticut General Statutes 42-515 ff. text (and the SB 1295 amendments); the Washington Attorney General's MHMDA FAQ.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.1.0 | 2026-10-03 | Provider is the founder as an individual ({PUBLISHER_LEGAL_NAME}, {CONTACT_ADDRESS}); HN-10 updated (no affiliates). Pre-publication draft; no users bound. |
| 1.0.0 | 2026-10-02 | First draft for counsel review (`memos/lawyer-2.md`). |
