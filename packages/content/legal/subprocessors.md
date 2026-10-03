---
title: "Service Providers"
slug: "subprocessors"
effectiveDate: "TBD"
version: "1.4.0"
status: "draft"
summary: "These are the companies that help us run Early Letters and may handle your information for us. Each one acts only on our instructions, under a written contract, and may not sell your information. Apple and Google are not on this list as service providers, because they act on their own terms when you buy or sign in with them."
---

We use a small number of companies to run Early Letters. Each one acts on our instructions, under a written contract, and may use your information only to provide its service to us. We require them to protect it at least as well as our [Privacy Policy](/privacy) does, and to delete it when we ask. None of them may sell it. Supabase, which stores your letters and recordings, has also agreed in writing not to use them to train AI models. We never give your content to anyone to train AI models.

The last column of each table gives the provider's privacy contact, so you can reach them directly. Our [Consumer Health Data Privacy Policy](/health-privacy) explains your right to this list.

We will update this list at least 30 days before adding a provider that handles letters or recordings.

## Providers in use

| Provider | What they do for us | What they handle | Where | Privacy contact |
|---|---|---|---|---|
| Supabase | Database, sign-in (email sign-in link and code, Sign in with Apple and Sign in with Google), file storage and our server functions | Account, profiles, child profiles, letter text and transcripts, names and words, family membership, scrambled invite fingerprints, photos, encrypted recordings and their locked keys, Plus plan status the app reports | United States (California) | privacy@supabase.com |
| PowerSync (Journey Mobile, Inc.) | Keeps the copy on your phone in sync with our database | Copies of the rows you are allowed to see, including letter text, while syncing | United States | dpo@powersync.com |
| PostHog, Inc. | Product analytics without content, only if you agree | App usage as counts and categories, a random analytics ID, app version, device model and OS version | United States | privacy@posthog.com |
| Sentry (Functional Software, Inc.) | Crash and error reports, with content removed, only if you agree | Technical crash data | United States | compliance@sentry.io |
| Vercel Inc. | Hosts our website, these legal pages, the account deletion page and the page that opens sign-in links | Web request logs (such as IP address, browser and page), waitlist email addresses | United States | privacy@vercel.com |
| Resend (Plus Five Five, Inc.) | Sends our emails (sign-in links and codes, Plus reminders, account emails) and receives the email you send to hello@earlyletters.com | Email address, the content of the emails we send, and messages you send us | United States | support@resend.com |
| Porkbun | Forwards email sent to hello@earlyletters.com when our main route is busy | Messages you send us, while forwarding | {forwardingRegion} | {porkbunPrivacyContact} |
| {supportMailboxProvider} | The mailbox where we read and answer your messages | Messages you send us and our replies | {supportMailboxRegion} | {supportMailboxPrivacyContact} |

## Providers for features that arrive later

These providers receive nothing until the feature they support is available.

| Provider | What they do for us | What they handle | Where | Privacy contact |
|---|---|---|---|---|
| Vercel Inc. | Hosts the family contribution page | Web requests; encrypted uploads pass through | United States | privacy@vercel.com |

## Not our service providers

These companies act on their own terms, not as our service providers. Their own privacy policies apply.

| Company | Role |
|---|---|
| Apple | Sells and manages Plus through the App Store, and handles cancellations and refunds; Sign in with Apple; push notifications. Apple does not send us your purchases. The app checks your plan with Apple on your phone and tells us only its status (Privacy Policy section 3). |
| Apple (Declared Age Range) | On iPhone, Apple may tell the app your age range so we can confirm you are an adult. We use it in the moment and do not store it. |
| Google | Sign in with Google, and Google Play once the Android app is available. |
| {modelHost} | Hosts the speech recognition model your phone downloads once. It receives your IP address and request details only, never your letters or recordings. |

## Questions

Email [hello@earlyletters.com](mailto:hello@earlyletters.com) or write to {publisherLegalName}, {postalAddress}.
