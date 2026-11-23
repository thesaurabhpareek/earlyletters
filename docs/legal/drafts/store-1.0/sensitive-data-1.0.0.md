---
title: Early Letters health and sensitive details agreement
document: sensitive-data
version: 1.0.0
status: PROPOSED, draft for exec-team review (D-168, D-172). Not reviewed yet. The exec team is not a lawyer.
review: PROPOSED draft written by an AI drafting agent (`legal`). It is not legal advice and says nothing is compliant. "Counsel" in this file means the exec team's own review (D-172), which is not a licensed lawyer. Every [EXEC-TEAM COUNSEL Q] mark is open and must be resolved and removed before publishing.
scope: the one-screen agreement a new account answers before its first sync, in the Early Letters app for iPhone, version 1.0 (EAS production profile: servers and accounts on; analytics, backup, photos and Google sign-in off)
source: the words in `packages/content/src/strings.en.ts` `sensitiveConsent` and `packages/content/src/consent-shown.ts` on develop at 079cb892d; the rules in docs/legal/POLICY_VERSIONING.md sections 1, 6 and 7 and docs/legal/in-app-disclosures.md (row "Sensitive-data agreement"). There is no earlier published text for this key.
proposed_url: https://earlyletters.com/legal/sensitive-data/1.0.0
last_updated: 2026-11-23
---

> **PROPOSED. Draft for exec-team review. Not legal advice. Not a lawyer's text.** This banner, the frontmatter `review:` line and every bracketed mark come out before publishing.

# Health and sensitive details agreement

Version 1.0.0. Effective [effective date].

## The words the person sees

This is what the sheet shows today, joined the way the phone joins it before it hashes it (`consentShownText('sensitive')`). `{child}` stays unfilled, so a child's name never enters the record.

> **Before your book syncs**
>
> Letters can hold private things, like health details about you or {child}. To sync your book and share it with the family you choose, we store what you write on our servers.
>
> We use it only to keep and show your book. We never sell it, use it for ads or use it to train machine learning models.
>
> If you keep it on this phone, syncing and sharing stay off.
>
> You can turn them on later in Settings, Account.
>
> Buttons: **Agree and sync** and **Keep on this phone**.

[EXEC-TEAM COUNSEL Q SD-1: "share it with the family you choose" says something the store build cannot do. There is no way to invite or join another parent in a store build (D-162; `apps/mobile/src/lib/family/entry.logic.ts`). `in-app-disclosures.md` already lists this line as a gap (G-21) and proposes "your co-parent", which is also not available. Proposed for `content`: "To sync your book to your other iPhone, we store what you write on our servers." and "If you keep it on this phone, syncing stays off." That is a copy change in `packages/content`, not made here. If it is made, the file and its hash in `docs/ops/proposed/policy-1-0-0-rows.md` change and must be taken again before publishing.]

## What this agreement is for

Letters can mention health, and a due date shows a pregnancy. Before your book first syncs, we ask for your agreement in a separate step, apart from the Terms. The Privacy Policy, section 10, says the same in more detail: https://earlyletters.com/legal/privacy/1.0.0.

## The requirement lines (COORDINATION section 10, PRIV-R21)

- **Shown:** the exact words above, by `packages/content` keys `sensitiveConsent.title`, `.body`, `.use`, `.declineHelp`, `.changeLater`, with the buttons `.agreeButton` and `.declineButton`. The screen links the versioned Privacy Policy (https://earlyletters.com/legal/privacy/1.0.0) [EXEC-TEAM COUNSEL Q SD-2: the sheet as read here shows no link; confirm whether one is required beside the words].
- **Records:** one row by `record_policy_act` (`apps/mobile/src/lib/auth/consent.ts`, `consent-record.ts`): document `sensitive-data`; the version that is newest in `policy_versions` for new people at that moment; action `accept` or `decline`; method `consent_sheet`; surface `auth.consent.sensitive`; server time and the phone's time; app version and build; OS version; platform; text language `en`; the sha256 of the words shown; context `{}`. Nothing more.
- **Never:** no IP address, no user agent text, no free text, no child name, no letter text, no audio. The hash is of the words with `{child}` unfilled.
- **Decline:** "Keep on this phone". Nothing syncs, the letters stay on the phone, and the record is a `decline` row. The person can say yes later in Settings, Account ("Agree and sync"). Recording, reading, playing, export and Delete account keep working (PRIV-R09).
- **Withdraw:** there is no switch in the app to withdraw yet (D-128, BL-485 option (b)). Settings, Privacy shows whether syncing is on. The Privacy Policy says withdrawal is by email, done by hand. The sheet promises no withdrawal control. [EXEC-TEAM COUNSEL Q SD-3 (packet Q32, Q48; OQ-L1): whether email-only withdrawal is enough for the health data rules in Washington and Connecticut, and whether this text must say so on the sheet.]

## What a version change means

Changing the scope of this agreement is a major version and needs fresh agreement (POLICY_VERSIONING 2.4). Turning on backup, analytics, photos or sharing with another parent each changes the scope.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-11-23 | First version, for the App Store app. Records the words the sheet shows on develop at 079cb892d. Proposed, for exec-team review. |
