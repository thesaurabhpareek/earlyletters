---
title: Early Letters service providers
version: 2.0.0
status: draft-for-counsel
last_updated: 2026-10-04
effective_date: TBD
owner: founder
published_at_url: https://earlyletters.com/subprocessors
---

# Who helps us run Early Letters

The app keeps your letters, recordings and child details on your phone, so no company holds them for us. These are the companies that handle anything else. Each acts on our instructions, and none may sell the information or use it to train machine learning models.

## 1. Our service providers

| Company | What it does for us | What it sees | Where |
|---|---|---|---|
| Resend | Sends our emails: the welcome email and the "it is ready" email | The email address of people who ask us to write to them, and the emails we send | United States |
| Vercel | Hosts the website, earlyletters.com | The usual details of a visit: IP address, page, browser | United States |
| PostHog | Counts how the app is used, only if you turn on usage reports in the app | A random ID and simple counts, never letters, recordings or names | United States |

## 2. Other companies you deal with directly

- **Apple** runs the App Store, Plus purchases, Family Sharing and your iPhone backup. Apple's own privacy policy applies. We do not receive your purchase records.
- **The speech model file host.** The app downloads speech model files from a public file host, currently Hugging Face. It sees your IP address and which file was asked for, like any website. It is not our provider and acts on its own terms.

## 3. Later

When sign-in, sync or writing with a co-parent arrives, we will add the companies involved here and tell you before they handle anything you wrote.

<!-- TODO(founder): add each provider's privacy contact (web form or email) and confirm that the DPAs are accepted on our accounts (Resend, Vercel, PostHog). Contacts are needed for the Washington consumer health data list, if that notice applies. Remove the PostHog row if usage reports do not ship in v1.0. -->

## Changelog

| Version | Date | Change |
|---|---|---|
| 2.0.0 | 2026-10-04 | Rewritten for the first version. Removed Supabase, Cloudflare, Groq, DeepInfra, Sentry, Lulu, Stripe and CAPTCHA providers, which v1.0 does not use. Vendor review notes moved to COUNSEL_PACKET.md. Nothing is published. Earlier text is in git history. |
| 1.3.0 | 2026-10-03 | Draft for the server version. |
