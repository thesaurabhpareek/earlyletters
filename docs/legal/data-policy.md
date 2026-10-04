---
title: Data policy
product: "{brand.name} (codename scribe)"
version: 2.0.0
status: draft-for-counsel
effective_date: TBD
last_updated: 2026-10-04
owner: founder
approver: outside counsel
companion: DATA_CLASSIFICATION.md, DELETION_AND_EXPORT_SPEC.md
---

# Data policy

What data the first version of the app holds, where, why, who owns it, how long it stays and how it goes. It must say the same as the Privacy Policy (2.0.0). The server design (accounts, sync, co-parent) is not in v1.0; it stays in `DATA_CLASSIFICATION.md` and `DELETION_AND_EXPORT_SPEC.md` and applies only when a later release turns on the build switch `EXPO_PUBLIC_SERVER_FEATURES`.

## 1. Principles

1. The keepsake comes first, then privacy. Nothing a person recorded is lost or silently changed.
2. Words belong to the person who said them. Machine fixes are the typed list in `packages/core` (`EditType`), each checked by `verifyEdits`, and each stored and reversible. The raw transcript never changes.
3. No letter text, transcript, audio or child name in analytics, logs or crash reports.
4. Export is free, works offline, and never needs Plus.

## 2. What is held, and where

| Data | Where | Why | How long |
|---|---|---|---|
| Letters: raw transcript, edits, final text, dates, language | On the phone (local database) | The book | Until the person deletes the letter, or the app |
| Recordings and any listening copy | On the phone (app Documents folder); included in the person's own iPhone backup | The book | Until deleted, or the app |
| Child name or nickname, birthday or due date | On the phone | The book | Until deleted, or the app |
| Settings, reminder times, names and words | On the phone | The app | Until deleted, or the app |
| Plus status | On the phone, from StoreKit | Unlocking Plus | Until Apple reports it ended |
| Age answer | On the phone, a yes only (or a stop time after a no) | The 18+ gate | Life of the app |
| Speech model files | On the phone, excluded from backup, downloaded once | Transcription | Until removed in Settings |
| Usage reports (only if turned on, and a key is set) | PostHog, random ID, counts only | Fixing problems | 12 months at most (proposed) |
| Website email address | Resend | The "it is ready" email | Until the person unsubscribes or asks us to delete it |
| Website visit logs | Vercel | Running the site | Short rolling window set by Vercel |
| Support email | Our inbox | Helping the person | Only as long as needed |

We hold no account, no purchase records, no recordings, no letters and no child details on any server in v1.0.

## 3. Deleting

- A deleted letter stays in Recently deleted on the phone for 30 days, then is erased.
- Deleting the app removes everything the app keeps on the phone. A copy may remain in an old iPhone backup until the phone replaces it.
- Email addresses are deleted on unsubscribe or request.

## 4. Roles

The founder owns this policy and answers every request at hello@earlyletters.com. Counsel approves it before it is published. Any new SDK, server call or data category needs a change here, in the Privacy Policy, in the privacy answers and in `docs/legal/data-map.yaml` (when that lands) before it ships.

## Changelog

| Version | Date | Change |
|---|---|---|
| 2.0.0 | 2026-10-04 | Rewritten for the first version: a one-table inventory of what is on the phone and what is not. Removed Supabase tables, buckets, backup clocks, processor deletion windows and legal-hold text for the server design (still in the companion documents). Nothing is published. Earlier text is in git history. |
| 1.2.0 | 2026-10-03 | Draft for the server version. |
