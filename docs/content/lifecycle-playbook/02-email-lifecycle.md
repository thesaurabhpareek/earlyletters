# 02. Email lifecycle: every email that must exist, from invite to year five

Status: PROPOSED, 20 Nov 2026. Owner: `content`. Part of the lifecycle playbook (README.md, 01-experience-content-map.md, this file, 03-in-app-and-reminder-logic.md, 04-events-and-festivals-usa.md, 05-backlog-proposed.md). Docs only: this file changes no string, no template, no sender and no test. Every line of new copy is PROPOSED until the founder approves it (G3) and carries an email id as its key.

A playbook may propose and may never contradict the locked pack. Where this file wants something the pack forbids, it writes a "Proposed change" box that names the erratum it would need, and builds nothing on it.

## 0. What I read, and what I could not do

Read in full for this file: `CLAUDE.md`; `packages/content/VOICE.md`, `BRAND.md`, `test/rules.test.ts`, `test/emails.test.ts`; `packages/content/src/emails/*.en.ts` (copy, subjects and the lines I quote); `docs/emails/CATALOG.md`, `BRIEF.md`, `COMPLIANCE.md` (sections 0 to 7 and the tables I cite), `SECURITY.md` (headings and section 5); `docs/product/prd/18-errata-after-lock.md` (E45, E58, E74 to E82); `docs/product/prd/22-final-holistic-spec.md` section 7; `LEGAL-REQ-053` and `-054` in `docs/legal/ENGINEERING_REQUIREMENTS.md`; `docs/design/NOTIFICATIONS.md`; `supabase/templates/README.md`; `packages/emails/src/links.ts`; and the sender folders under `supabase/functions`.

Not done, and no row relies on it:
- The Project docs (`proposals/*`) were not reachable: this session has no Projects tool. Nothing cites them.
- I ran no test and no sender. "Built" means a sender exists in the repo on develop at `e68541d`, found by reading the code, not that it was seen to send.
- Outside facts (CAN-SPAM, California auto-renewal law, Gmail and Yahoo sender rules, Resend behaviour) are cited to `docs/emails/COMPLIANCE.md`, which says it opened its sources on 3 Oct 2026. I did not reopen them. Anything it marks UNVERIFIED stays UNVERIFIED here. Every legal reading ends: counsel must confirm.

## 1. The rules that bind every email

| Rule | Source | What it means here |
|---|---|---|
| No marketing email to an address given in the app, at 1.0. Transactional only: sign-in codes, account and security notices, deletion receipts, legal notices | E75, LEGAL-REQ-053, FR-MKT-44 | No newsletter, product news, tip, re-engagement or Plus offer, and no opt-in for one in the app. The one welcome email stays (once, no promotion) |
| The waitlist is its own list at the mail vendor; never joined to accounts; never used to look one up | E75 | `waitlist-ready` below is the only email to that list. Whether it is commercial is counsel's (Q34) |
| Any later commercial email needs its own row, a separate opt-in that is off by default, a one-click unsubscribe, hashed suppression, and the founder's yes | E75 | Every commercial id in this file is "held" or "later" and says so |
| Only the security emails already built or sent by the sign-in service are sent. No push. A security alert is not held by quiet hours. The old-address notice shows the new address masked (`a***@example.com`); no screen echoes an alert | E76 | Section 4D |
| "Sign out other devices" sends no email; wrong codes send no email; there is no sign-out-everywhere control | E77 | Section 4D |
| The new-device sign-in email is not built for 1.0 and is a hard gate before the backup flip. Once built it fires once per unseen device, never for the first device, never from the client, email only | E78, NS-08-R21 | Section 4D |
| No server push in 1.0: no key, no token table, no entitlement. An email or an in-app line carries what a push would have | E79, LEGAL-REQ-054 | Section 8 lists where each former push now lives |
| Any alert sender added after 1.0: first 5 in an hour one by one, the rest folded into one summary within minutes, 20 alert emails per account per day at most, never applied to sign-in codes | E81 | Section 7 |
| No child name, age, birthday, due date, letter text, audio, photo or counts of letters in any subject, preheader, body, attachment or link text. Allowed: the recipient's own address; an adult display name only to members of the same book; plan, price and dates; device type and approximate time for security notices | COMPLIANCE 7.3, CATALOG E-1 and E-2, LEGAL-REQ-014 | "your book", "the book {parentName} keeps" |
| Every email template declares class `transactional` or `commercial`. Commercial: one-click unsubscribe, postal address, clear identification, hashed suppression kept after deletion. Transactional: no promotion beyond incidental branding, no Plus offer | LEGAL-REQ-053 (the type field in code is `kind`; see section 9) | Section 7 |
| Words: ASCII only; no em or en dash, curly quote, ellipsis or emoji; no fear, guilt or loss; never imply a machine writes; no `{child}`; no streaks or counts of gaps; no exclamation mark in any email; glossary words only | `rules.test.ts`, `emails.test.ts`, CR-25 | Every PROPOSED line below is written to pass them |
| No tracking: no pixels, no tracked links, no remote images or fonts. The logo is an inline attachment. Every email has a plain-text twin | BRIEF hard rules, VOICE.md | |
| Dates, not countdowns: "on Tuesday, September 29, 2026", never "in 3 days" or "48 hours left" | CATALOG principle 6, D-028 | |
| US only, 18 and over | BRIEF; card 19 (F21-REQ-005: US storefront only) | |
| Signed "Warmly," then the brand name; the footer line is the brand name and the tagline | `emailChrome.signature`, `emailChrome.footer.nameLine` | |
| Sender is `Early Letters <hello@earlyletters.com>` for all transactional mail; replies go to a person; never `no-reply@` | BRIEF decisions | |

## 2. The state of the build, read from the repo

| Fact | Where I read it |
|---|---|
| Six Supabase Auth templates exist and are exported: confirmation, magic link (the sign-in link and code), email change, reauthentication, identity linked, email changed | `supabase/templates/README.md` |
| Three account-deletion receipts are sent by the purge worker: `account-deletion-scheduled`, `-cancelled`, `account-deleted` | `supabase/functions/purge-worker/emails.ts:2-3, 50-63`; E58 |
| Three backup emails are sent by the escrow function, which only runs when backup is on; backup is off at 1.0 | `supabase/functions/escrow/mail.ts`; NS-08-R5; IA.md |
| Every other email in the catalog has copy and a template and no sender (billing, co-parent invite, welcome, `book-deletion-*`, `coparent-left`, `policy-update`, `export-ready`, family) | no sender for these ids in `supabase/functions` on develop; `packages/emails/src/templates` |
| Build 1 (the first store build) sends no email at all; the first release with server features is "build 2" | `packages/emails/src/links.ts` ("Build 1 (D-121) sends no email at all"); IA.md "Builds and switches" |
| The website pages on `main`: `/`, `/privacy`, `/terms`, `/auth/callback`, `/auth/confirm`, `/j`, `/open`, `/unsubscribe`. Still needed: `/stop` (before owner backup), `/subscription-terms` (before reminder emails; or point at `/terms`), `/delete-account/confirm` (before the email route for deletion takes requests), `/open/export` (v1.1) | `packages/emails/src/links.ts:18-45`; CATALOG 14 |
| Billing status reporting exists as a function shell (D-080: plan, trial end, renewal date, cancelled flag; no payment data) | `supabase/functions/subscription-status/handler.ts` |
| The on-device plan notice (class `plan`, up to 4 pending, outside the daily budget) is the local carrier for trial and renewal dates | NS-32 (`docs/product/prd/11-foundations.md`), D WORDS D-S10.plan |
| `identity_unlinked` is switched on with Supabase's default text; no copy in our voice exists for it | `supabase/templates/README.md` ("Not used" paragraph) |

UNVERIFIED in this file: how many people use Hide My Email (CATALOG 11 says plan for most); whether Resend includes custom headers in its DKIM-signed set (COMPLIANCE 4.3); whether a server-side "last seen" exists at all (relevant to section 5, stage N).

## 3. The lifecycle at a glance

Status words: **Built** (a sender exists). **Copy built** (copy and template exist, no sender). **To build** (needed at 1.0 or by its gate). **Held** (needs the founder's yes, counsel or a gate). **Later** (not at 1.0; has a founder line). **None** (no email, by rule; the row says where the need is met).

| Stage | Email or none | Class | 1.0 status |
|---|---|---|---|
| A. Invite and waitlist | `waitlist-ready`; `news-confirm`; TestFlight invite (Apple's) | commercial; commercial footer; not ours | Held (Q34, postal address); Later; none |
| B. Sign-up | `verify-email`, `sign-in-link`, `welcome` | transactional | Built (Auth templates); `welcome` copy built, to build |
| C. First letter | none | | None (section 5) |
| D. First week | none | | None |
| E. Habit | none by email | | None; in-app and local reminders (03) |
| F. Co-parent invite and joined | `coparent-invite`, `welcome-coparent`, `coparent-left`; "joined" none | transactional | Copy built, to build |
| G. Relatives and readers | `welcome-family`, `family-book-closing`, `family-book-restored`, `family-export-ready`, `family-digest` | transactional (digest: subscription) | Later (1.1) |
| H. Device and security | `new-device-sign-in`, `email-changed-*`, `reauthenticate-code`, `apple-`, `google-account-linked`, `passkey-added`, `identity-unlinked` | transactional | Built (Auth templates) except new-device (Held, E78), passkey (copy built), identity-unlinked (copy missing) |
| I. Backup and restore | `backup-restore-requested`, `backup-key-used`, `backup-key-rotated` | transactional | Built, off with backup; gated by E78 |
| J. Plus: trial, renewal, cancelled | 12 billing ids | transactional | Copy built, to build; needs servers on and D-080 |
| K. Deletion and export receipts | account three, book two, request two, `coparent-left`, `privacy-request-received`, `export-ready` | transactional | Account three built; rest copy built, to build |
| L. Policy changes | `policy-update` | transactional | Copy built, to build before the first major change |
| M. Support | human reply; `support-ack`; bounce row in the app | transactional | Human built; ack Later |
| N. Re-engagement | `quiet-message`, `emailOptIn` | commercial, opt-in | Later, Held (needs an erratum) |
| O. Print and gift orders | `book-printed`, `gift-*` | transactional | Later; no words until the go or no-go (CL-097) |
| P. Anniversaries | Plus yearly (`anniversary-reminder`); book anniversary; child birthday | transactional; none; none | Copy built; none; Never |

## 4. Stage tables for emails that exist in copy

Subjects are quoted from `packages/content/src/emails/*.en.ts` on develop (BUILT). Class is the field `kind` in code. "May carry" is the data allowed, from section 1. "Rows" names what the email still needs; a "proposed row" is listed in 05-backlog-proposed.md.

### 4A. Sign-up (stage B)

| Id | Trigger | Sender | Timing | Subject (BUILT) | May carry | Suppression | 1.0 status | Rows |
|---|---|---|---|---|---|---|---|---|
| `verify-email` | First sign-in with a new address | Auth (Supabase, through Resend) | At once; link and 6-digit code; resend after 60 s, 5 an hour per address | "Confirm your email to start your book" | the address; code; expiry | none; never suppressed; auth mail | Built | Apple relay registration (CATALOG 11) |
| `sign-in-link` | Email entered on the sign-in sheet | Auth | At once | "Your sign-in link and code" | same | same | Built | same |
| `welcome` | First successful sign-in of a parent who starts a book | Function | Once per account, ever; soon after the first sign-in (PROPOSED: within an hour); not between 21:30 and 07:00 local (waits to 07:00; dropped if the person has been active a week, CATALOG 10.2) | "Welcome. The first page is yours." | the address; the promise word for word (`en.trust.promise`, once) | none; transactional; no Plus, no offer | Copy built; sender to build (E75 keeps this one) | proposed row: welcome sender with branch on invite role (CATALOG E-4) |
| `account-create-attempt` | None: sign-in is one passwordless call, so there is no sign-up branch | none | | "You already have a book with us" | | | Not sent (SIGN-05) | none |
| `sign-in-trouble` | Deferred: the app's "Trouble signing in?" shows help; "Send a new email" sends `sign-in-link` again | none | | "A new sign-in link for you" | | | Later | none |

### 4B. Co-parent (stage F)

| Id | Trigger | Sender | Timing | Subject (BUILT) | May carry | Suppression | 1.0 status | Rows |
|---|---|---|---|---|---|---|---|---|
| `coparent-invite` | A parent types the co-parent's address in the app (D-055). The link works once, for 7 days (D-020) | Function | At once; one per invite | "{inviter} invited you to write together" | the invitee's address; the inviter's adult display name; no child | none; it is addressed to one person at the parent's request; "Not expecting this? You can ignore this email." | Copy built; sender to build (servers-on builds only) | invite sender; Apple relay |
| `welcome-coparent` | First sign-in that came from accepting a co-parent invite; replaces `welcome` | Function | Once per account | "Welcome to the book" | the inviter's display name; no Plus, no gifting | none | Copy built; sender to build | branch on invite role |
| `coparent-left` | A co-parent's account deletion request succeeds; to the remaining parent of each shared book within an hour; none if the leaver cancels within the hour | Function | within 1 hour | "A change in a book you share" | the leaver's display name only; no child; no letter | none; required | Copy built; sender to build | proposed row |
| Co-parent joined | The invitee accepts | none | | | | | None. The inviter sees an in-app line on next open (D-S17); E-5: silence beats a notice inside a family; E79: no push | none |
| Invite reminders, "invite expires soon", declined, removed | | none | | | | | Never (CATALOG E-3, E-5) | none |

### 4C. Relatives and readers (stage G): 1.1, listed so nothing is invented later

| Id | Trigger | Class | Subject (BUILT) | 1.0 status | Founder line |
|---|---|---|---|---|---|
| `welcome-family` | First sign-in from accepting a contributor invite | transactional | "Welcome to the family book" | Later (1.1; D-055) | family beyond the co-parent comes in a later update |
| `family-book-closing` | A sole parent deletes a book that has contributors; to each contributor within an hour | transactional | "Save a copy of your letters" | Later (1.1) | same |
| `family-book-restored` | The parent cancels that deletion within 30 days | transactional | "The book is staying" | Later (1.1) | same |
| `family-export-ready` | Server export link for contributors | transactional | `export-ready` family variant | Later (1.1, BL-309) | same |
| `family-digest` | Opt-in weekly summary of new family letters for a parent who does not want to open the app | transactional under CAN-SPAM; a subscription message for Gmail (needs one-click unsubscribe) | not written | Later; off by default; no counts in the subject; no letter text | founder's yes; needs its own row (E75) |
| Share one letter with someone outside the app (D-S01 to D-S03) | The parent shares from their own Messages | none from us | | None: the parent sends it in their own voice (CATALOG E-3) | none |

### 4D. Device and security (stage H; E76 to E78, E81)

| Id | Trigger | Sender | Timing | Subject (BUILT) | May carry | Suppression | 1.0 status | Rows |
|---|---|---|---|---|---|---|---|---|
| `reauthenticate-code` | Account deletion when the session is older than 24 h and there is no device passcode | Auth | at once; code | "Your code to confirm account deletion" | code; expiry | never suppressed | Built | none |
| `email-changed-old-address` | A person changes the sign-in email | Auth notification | at once; not held by quiet hours (E76) | "Your sign-in email was changed" | the old address; the new address masked `a***@example.com`; if the sender cannot mask, no address (E76) | never suppressed | Built; the copy today shows `{newEmail}` in full. Must change to a masked placeholder (section 10) | content: masked line; test T8 |
| `email-changed-new-address` | Same, to the new address | Auth | at once | "Confirm your new email address" | the new address | never suppressed | Built | none |
| `apple-account-linked`, `google-account-linked` | A sign-in method is added | Auth notification (`identity_linked`) | at once | "Sign in with Apple is now on your account", "Sign in with Google is now on your account" | provider | never suppressed | Built (Auth template branches on provider) | none |
| `passkey-added` | A passkey is added | none (Auth has no passkey template) | | "A passkey was added to your account" | | | Copy built; no sender; to build only if passkeys ship (UNVERIFIED that they do at 1.0) | proposed row |
| `identity-unlinked` | A sign-in method is removed | Auth notification, on with Supabase's default text | at once | none in our voice | provider | never suppressed | Built in Supabase's words; our copy missing (PROPOSED below) | content; test T8 |
| `new-device-sign-in` | The first sign-in on a device the account has not used, never the first device, never from the client | Function (to build) | at once; not held by quiet hours; cap per E81 | "A new sign-in to your account" | device type and approximate time | never suppressed | Held. Not built for 1.0; a hard gate before anyone is asked to turn the backup on (E78, NS-08-R21). The line "We will sign that device out" is not shown until a one-session sign-out lever and the stop page exist | NS-08-R21; proposed rows: sender, device table, stop page, lever |
| Wrong codes, "Sign out other devices", sign-out everywhere | | none | | | | | None (E77): an email an attacker can trigger is an inbox-bombing path (SECURITY 3.9) | none |

**PROPOSED copy, `identity-unlinked`** (class transactional; key `accountEmails['identity-unlinked']`; category auth):
- Subject: "A sign-in method was removed" (28 characters)
- Preheader: "One way to sign in was taken off your account. If it was you, there is nothing to do."
- Heading: "{provider} was removed as a way to sign in"
- Body: "{provider} was removed as a way to sign in to your {app} account, {when}." / "Your letters, recordings and books are all still there. You can sign in with your other ways."
- Safety: "Was this not you? Reply to this email right away, from this address, with Not me in the subject, and we will help you put it right. We will never ask for a code or a password."
- Tone: matter-of-fact. Never: a hint that someone hacked the account; "suspicious"; "breach".
- Note: E76 builds nothing new; this is copy for a notice the sign-in service already sends. `security-architect` and the founder decide whether to switch the notice off instead (section 10).

**PROPOSED amendments, E76 and E78 (copy owed by `content`):**
- `email-changed-old-address` body, line 1: "The email for your {app} account changed from {oldEmail} to {maskedNewEmail}." (replaces `{newEmail}`.)
- `new-device-sign-in` body, last paragraph, until the lever exists: "If it was not, reply to this email with Not me in the subject. We will help you secure your account." (replaces "We will sign that device out and help you secure your account.")

### 4E. Backup and restore (stage I)

| Id | Trigger | Sender | Subject (BUILT) | May carry | 1.0 status | Rows |
|---|---|---|---|---|---|---|
| `backup-restore-requested` | A new iPhone asks for the owner's recordings | Escrow function | "A new iPhone asked for your recordings" | device type, time; a stop link (`/stop`, not on `main`) | Built; off with backup (NS-08-R5) | `/stop` page; E78 gate |
| `backup-key-used` | The recovery key was used | Escrow function | "We used your recovery key" | time | Built; off | same |
| `backup-key-rotated` | The recovery key was updated | Escrow function | "We updated your recovery key" | time | Built; off | same |

Rule: no copy says recordings are backed up while the flag is off (VOICE.md). These stay unsent in the 1.0 store build.

### 4F. Plus: trial, renewal, cancelled (stage J; Apple only)

Plus is the one subscription; payments are Apple-only (D-053, amended by D-080). The app reports status only (plan, trial end, renewal date, cancelled flag); the server never sees payment data and never enforces Plus. Only the device whose transaction is the person's own reports, so Family Sharing members get no billing email (CATALOG 7). Apple sends its own receipts and refunds; we send none (CATALOG E-6). Every notice states the plan, the price from the published price, the billing period, the renewal or trial-end date, the cancel-by date where relevant, that it renews automatically until cancelled, the cancel steps in words, and that letters stay free to read, play and export (COMPLIANCE 5.2). No offer, discount, "are you sure" or "we would hate to see you go" ever appears (California B&P 17602 as amended; COMPLIANCE 5.4; counsel must confirm).

Windows are D-022's: `E` is the trial or period end, `C` the cancel deadline `E - 24h`. A cancelled renewal skips every pending notice for that period. A missed window pages the founder; nothing is sent late.

| Id | Trigger and send time | Subject (BUILT) | Channels | 1.0 status |
|---|---|---|---|---|
| `trial-started` | Trial starts; within 1 h | "Your free trial of Plus has started" | email, in-app sheet | Copy built; to build |
| `plus-started` | Purchase with no trial; within 1 h | "Your Plus plan has started" | email, in-app sheet | same |
| `trial-ending-week` | Trial of 31 days or less that will renew; `E-7d` | "Your free trial ends on {trialEndDate}" | email, card | same |
| `trial-ending-long` | Trial over 31 days; `E-18d` | "Your Plus trial ends on {trialEndDate}" | email, card | same |
| `trial-ending-final` | Every trial that will renew; `E-4d 12h` | "Before your trial ends on {trialEndDate}" | email, card. CATALOG says "and one push": superseded by E79; no push | same; CATALOG amendment owed |
| `annual-renewal-long` | Annual, `E-30d 12h` | "Plus renews on {renewalDate}" | email, card | same (first fires about 13 months after launch) |
| `annual-renewal-short` | Annual, `E-7d` | "Plus renews on {renewalDate}" | email, card | same |
| `anniversary-reminder` | Monthly plans, each subscription anniversary | "Your yearly reminder about Plus" | email only | same (first fires 12 months after launch) |
| `price-increase` | `effective-25d` | "A change to the price of Plus" | email, card | Later; must exist before any price change |
| `plus-cancelled` | A status report shows renewal off; not resent if toggled within 24 h | "Plus will not renew" | email, card | Copy built; to build |
| `plus-ended` | The renewal or trial end date passes with renewal off | "Plus has ended. Your book is all here." | email, card | same |
| `plus-quiet` | Plus with no saves in 60 days (C-REQ-031); at most once every 6 months | "Your Plus plan, and how to stop it" | email only | Later (1.1); copy says cancel only, because Apple offers no pause (UNVERIFIED) |
| `gift-*` | A gift of Plus | not written | | Later; glossary bans "gift" at 1.0 |

Dependencies that decide "to build": servers on (the store build 1 has none: section 2); the status report endpoint wired to a notice engine (the shell exists; no engine found); `/subscription-terms` or `/terms` as the link; a card in the app for every notice (the fallback when a relay address drops mail). The on-device plan notice (class `plan`) is the local carrier meanwhile. Whether email is required at 1.0 in addition to the local notice is a counsel reading of the auto-renewal rules; counsel must confirm (CATALOG 13; COMPLIANCE 5.6). App copy never says "we will email you" about billing (D-083); that stays true whichever way it is decided.

### 4G. Deletion, export and rights receipts (stage K)

| Id | Trigger | Sender | Subject (BUILT) | 1.0 status | Rows |
|---|---|---|---|---|---|
| `account-deletion-scheduled` | `request_account_deletion()` succeeds | Purge worker | "Your account is set to be deleted" | Built | none |
| `account-deletion-cancelled` | `cancel_account_deletion()` | Purge worker | "Your account is staying" | Built | none |
| `account-deleted` | Deletion executes (sent before the auth user is removed; repeats how to cancel with Apple) | Purge worker | "Your account has been deleted" | Built | none |
| `book-deletion-scheduled`, `-cancelled` | A sole parent deletes a book, or cancels | Function | "A book is set to be deleted", "The book is staying" | Copy built; sender not found; to build | proposed row |
| `deletion-request-received` | Deletion asked for by email (`/delete-account`) | Ops (a person with the template) | "We have your deletion request" | Copy built; runbook | none |
| `deletion-confirm` | Right after the above | Ops or Function | "Confirm your deletion request" | Held: not sent until `/delete-account/confirm` exists (TPL-06) | web page row |
| `privacy-request-received` | Access, correction or other rights request by email | Ops | "We have your privacy request" | Copy built; runbook | none |
| `export-ready` | A server export is finished (link valid 7 days) | Function | "Your copy is ready to download" | Later (1.1, BL-309). The in-app export on the phone sends no email | none |

No email for: a letter deleted or restored, an export finished on the phone, consent withdrawn, sync turned off (CATALOG 8). E74: no screen lists the audit rows; they go in the Save a copy file.

### 4H. Policy changes (stage L)

| Id | Trigger | Sender | Timing | Subject (BUILT) | Rows |
|---|---|---|---|---|---|
| `policy-update` | A major change to a policy (POLICY_VERSIONING section 5) | Function | On `published_at`, at least 30 days before `effective_at`; once per major version per account; sent even with news opted out; reaches Apple relay addresses | "An update to our {documentName}" | Copy built; sender to build before the first major change. A policy change is not bundled with a feature announcement; if both exist, the policy part comes first and the feature part is secondary or sent separately (COMPLIANCE 1.1 and the `policy-update` row) |

### 4I. Support (stage M)

| Id | Trigger | Class | Words | 1.0 status |
|---|---|---|---|---|
| Human replies from `hello@` | Any email | not an advertisement | a person | Built (a person) |
| `support-ack` | Optional, if volume needs it (CATALOG 9) | transactional | PROPOSED below | Later |
| "We could not reach {email}" row in Settings, Account | A hard bounce or a relay rejection (CATALOG 10.4) | in-app, not email | PROPOSED in 01-experience-content-map.md 14.11 | to build |

**PROPOSED copy, `support-ack`** (key `accountEmails['support-ack']`; category account; Later):
- Subject: "We have your message"
- Preheader: "This only confirms it arrived. A person will read it and reply."
- Heading: "Your message arrived"
- Body: "A person reads every message and replies within 2 working days." (from CATALOG 9)
- Never: a ticket number as a threat; an auto-offer.

## 5. Stages with no email, and where the need is met

The lifecycle is not a drip. Each row says why there is no email and what carries the need. Silence is a choice (CATALOG principle 1 and section 12).

| Stage | Why no email | Where the need is met |
|---|---|---|
| C. First letter kept | A congratulation email is a nudge and a promotion; "Onboarding drips" are on the never list | In-app: "Kept." and the first-letter moment (01 rows 5.17, 13.1) |
| D. First week | No day-1, day-3, day-7 tips, no "did you know" tours (CATALOG 12; PRD B F1: "never as nags") | The app teaches in place; local reminders under the budget (03) |
| E. Habit | Streaks, "N letters this week", badges, progress bars are banned; "It has been a while" is guilt | Local reminders: one a day at most, back-off after 35 days, silence after (NS-13, NS-32; 03) |
| The other parent wrote | E79: no push; E-5: no notice inside a family | An in-app line on next open (01 row 8.5) |
| A month turns, a birthday | Child dates are never in email (COMPLIANCE 7.3; CATALOG 12; a family may be in its worst week) | Local month and birthday messages the parent controls and can pause per child (NS-13) |
| Letter text, "on this day", memory resurfacing | Letters never leave the app by email | The Home "A month ago" card (in-app only) |
| Trial and renewal, Apple's receipts and refunds | Two emails about one charge read as phishing (CATALOG E-6) | Apple's own mail; the in-app plan reminder (01 row 6.4) |
| Review requests, NPS, referral, "get a free month" | Proof discipline (BRAND.md); gamification | Never |
| Win-back discount, "we would hate to see you go", abandoned paywall | No save offers (CATALOG 12; California rules; COMPLIANCE 5.4); tracking we do not do | Never |

## 6. Stage tables for emails that do not exist in copy yet

These are PROPOSED. None is built, none changes a pack row, and each commercial one is held behind the founder's yes. Placeholders are `{app}` (filled from `packages/brand`) and the camelCase placeholders the email tests allow.

### 6A. `waitlist-ready` (stage A)

| Field | Value |
|---|---|
| Class | commercial (counsel's Q34 reading: announcing the app to people who asked to hear is still promotion; consent is prior and affirmative; the opt-out and the postal address are still needed; COMPLIANCE 1.3 "Not in the catalog" and 6.3; counsel must confirm) |
| Trigger | The app is on the App Store (US storefront only, F21-REQ-005). Once, ever, per waitlist address |
| Sender | `Early Letters <news@news.earlyletters.com>` on the separate subdomain with its own DKIM and return path, registered with Apple's relay (COMPLIANCE 6.2, 9). Never from `hello@` |
| Timing | One weekday, mid-morning US Pacific (PROPOSED; a waitlist address has no known time zone). Not in the quiet window |
| List | The waitlist list only. Never joined to accounts and never used to look one up (E75) |
| May carry | The address. No child, no invitation count, no price |
| Suppression | RFC 8058 one-click headers and the body link to `/unsubscribe`; opt-outs in our own hashed list, never in Resend's account-wide suppression (COMPLIANCE 4.2, 4.5) |
| 1.0 status | Held: counsel's Q34, the postal address (the founder has not chosen one; never the family home), and FR-MKT-06 holds the mail until Q34 is read |
| Rows | postal address; `news.` subdomain DNS and relay registration; the opt-out table; the sender; the notice line on the form (01 row 3.7); a test that the waitlist list and accounts share no key |

PROPOSED words (key `lifecycleEmails['waitlist-ready']`, category lifecycle, kind commercial):
- Subject: "The book is ready when you are" (31 characters)
- Preheader: "You asked us to write when {app} was ready. This is that one email."
- Heading: "{app} is ready"
- Body: "You asked us to write when {app} was ready. It is now on the App Store for iPhone in the United States." / "Talk for a minute, or type a few lines, and each letter goes into your child's book in your own words. We only fix small slips, like an um, a repeat or a misheard word, and mark each one. We never rewrite your words." / "This is the one email we promised. We will not write again unless you ask us to."
- Button: "Get the app" to `{appStoreUrl}`
- Optional last line, only if the founder allows a news opt-in: "Would you like occasional news too? You can say yes here: {newsOptInUrl}" (an opt-in link, never an automatic enrolment; COMPLIANCE 6.3)
- Footer: the commercial footer (`emailChrome.footer.commercial`), with `{unsubscribe}` and `{postalAddress}`
- Tone: warm, plain, once. Never: "limited", "last chance", a count of people, "we missed you", a price, a review or ranking, an exclamation mark.

### 6B. `news-confirm` (stage A, double opt-in; Later)

| Field | Value |
|---|---|
| Class | commercial footer even though it confirms a request (the first message of a commercial list; COMPLIANCE 1.3 row `news-confirm`) |
| Trigger | A person asks for occasional news, on the website or in the optional line of `waitlist-ready`. Never in the app at 1.0 (E75) |
| Sender and timing | `news.` subdomain; at once; the link works 7 days; an unconfirmed address is deleted after 30 days (COMPLIANCE 6.2) |
| Record kept | normalised address, list id, consent text version, where given, time of request, time of confirmation; no IP address unless counsel asks (COMPLIANCE 6.2) |
| 1.0 status | Later. Needs the founder's yes and its own row (E75) |

PROPOSED words (key `lifecycleEmails['news-confirm']`, kind commercial):
- Subject: "Please confirm your email"
- Preheader: "One tap and you are on the list. If it was not you, ignore this."
- Heading: "Confirm your email"
- Body: "You asked to hear occasional news from {app}." / "Tap the button to confirm. The link works for 7 days."
- Button: "Confirm" to `{confirmUrl}`
- Safety: "Did not ask for this? Ignore this email and nothing happens."

### 6C. `quiet-message` and its opt-in: the calm optional note (stage N; Later; Held)

The founder's ask names re-engagement as "a calm optional note (later, commercial, opt-in)". The pack and the catalog forbid re-engagement email today (E75; CATALOG section 12: "We miss you", "It has been a while", "Come back", any re-engagement after inactivity). So this is a proposal, not a plan.

**Proposed change (needs an erratum).** Amend CATALOG section 12 row 2 and FR-MKT-44 to allow one kind of commercial message, after 1.0, if the founder says yes: a calendar message, not a reaction to inactivity. It is sent only to a person who ticked a separate opt-in that is off by default, at most once in the period the founder sets, whatever the person did or did not do in the app. It never mentions letters written, days, a gap, a streak or the child. It would reopen E75's "no opt-in for one in the app" for an opt-in that lives outside the app (the website) or, if the founder allows, in Me. Erratum: next free number after E82 (E83 at this writing), carried by `content`, read by `privacy` and `legal`. Nothing is built on it until it is ruled.

Why a calendar message and not an inactivity message. A message that reacts to inactivity needs the server to know when a person last opened the app or kept a letter. Letters live on the phone, analytics are off by default and nothing in the repo I read says the server holds a "last seen" (UNVERIFIED). Collecting one to send a re-engagement email would add data and break the spirit of the constitution; the calendar message needs none.

| Field | Value |
|---|---|
| Class | commercial (it promotes continued use; counsel must confirm) |
| Trigger | A fixed calendar date, not behaviour. PROPOSED default: at most once every 3 months, and only to a person who opted in. The founder sets the number |
| Sender | `news.` subdomain, `news@` address |
| May carry | The address. No child, no letter, no count, no date the person did anything |
| Suppression | one click; hashed list; honoured at once and never later than 48 hours (COMPLIANCE 4.2) |
| 1.0 status | Later, Held. Not built, not promised anywhere |
| Rows | the erratum; the opt-in control and its consent record; the sender; tests T3, T4, T6, T14, T16 below |

PROPOSED opt-in words (keys `emailOptIn.label`, `emailOptIn.help`; the control is off by default and separate from sign-in and from the agreement):
- Label: "Send me occasional news about {app}. Unsubscribe in one step." (from COMPLIANCE 6.2; the frequency phrase "About once a month" is the founder's if he wants it)
- Help: "Off unless you turn it on. Account emails, like sign-in links and plan reminders, always come."

PROPOSED words (key `lifecycleEmails['quiet-message']`, kind commercial):
- Subject: "A quiet message for you"
- Preheader: "There is no news in it. The book is here whenever you like."
- Heading: "The book is here"
- Body: "There is no news in this message." / "The book is here whenever you have something to say. A sentence is plenty, and Not much today is an answer too."
- Button: "Open {app}" to `{appUrl}`
- Tone: one breath. Never: "we miss you", "it has been", "come back", a count of days or letters, "your streak", "{child}", an offer, an exclamation mark.

### 6D. Print and gift orders (stage O; Later; no words)

`book-printed` and `gift-*` exist as ids in the catalog (CATALOG 5 and 7: `book-printed` "later (D-010)"; `gift-*` "later"). No printed book is in 1.0 (CL-097: entity, partner, price, tax and the Mail Order Rule wait for a go or no-go). The rules test bans the words print, order a copy, ship, hard copy and photo book in every string, and BRAND.md bans "gift" at 1.0, so no line can be written into `packages/content` now without failing the test, and none is proposed here. Reserved ids only: `book-printed` (transactional; order confirmation and delivery; no cross-sell of another book) and `gift-sent`, `gift-received` (transactional; the notice to the parents must not suggest buying more). The founder's line: no words until the go or no-go, then the rules test and glossary change in the same PR.

### 6E. Anniversaries (stage P)

| Anniversary | Email | Why |
|---|---|---|
| Plus, each year | `anniversary-reminder` (copy built, "Your yearly reminder about Plus") | A legal reminder for monthly plans (D-022; COMPLIANCE 5.2). It is the one anniversary email |
| The date the book was opened | None | A celebration is not a thing a person needs to know or keep (CATALOG principle 1). The need is met by a local reminder inside the one-a-day budget (a PROPOSED class owned by 03); if the founder wants an email it is a commercial message under 6C, opt-in |
| The child's birthday, month of age, due date | Never | CATALOG 12; COMPLIANCE 7.3; a family may be in the worst week of its year; the name and the date would sit at the mail vendor (E-1) |

## 7. The send rules

| Rule | Standard | Source |
|---|---|---|
| From and reply-to | Transactional: `Early Letters <hello@earlyletters.com>`, a person reads replies. Commercial: `news@news.earlyletters.com`, its own DKIM and return path. Never mixed | BRIEF; COMPLIANCE 6.2; Gmail and Yahoo ask for separate streams (COMPLIANCE 4.4) |
| Quiet hours | Nothing between 21:30 and 07:00 in the recipient's time zone, except auth mail (the person is waiting for it), a D-022 notice whose hard window would otherwise close, and, by E76, a security alert. A waiting email goes at 07:00. If the zone is unknown, use the device zone last synced; else US Pacific | CATALOG 10.3; E76. `content` owes the one-line amendment of CATALOG 10.3 for E76 (section 10) |
| Frequency, whole product | At most one non-auth email per address per day. Legally required notices (billing except `plus-quiet`, the three deletion receipts) are never suppressed, delayed or batched. If a non-required email collides with a required one, it waits a day, and is dropped if the wait defeats its purpose | CATALOG 10.1, 10.2 |
| Frequency, auth | Resend after 60 s; 5 per address per hour | CATALOG 4 (A-REQ-025) |
| Frequency, alerts (any sender added after 1.0) | The first 5 in an hour one by one; the rest folded into one summary within minutes; 20 alert emails per account per day at most; never applied to sign-in codes; a stopped alert still shows as an in-app line on next open; a parent is told nothing about the limit | E81 |
| Frequency, commercial | `waitlist-ready` once, ever. `quiet-message`: PROPOSED at most once every 3 months, never within 14 days of a billing email, never in a trial (the `plus-quiet` rule) | CATALOG `plus-quiet` row; the 3 months is a proposal, the founder sets it |
| One-click suppression, commercial | RFC 8058 `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers on every commercial email; a body link to `/unsubscribe` that opens a page with one button; the button does the unsubscribe (a POST), never a GET, so a link scanner cannot unsubscribe anyone; the signed URL never expires; honoured at once and never later than 48 hours; a reply of "stop" is processed within 2 business days | COMPLIANCE 4.2, 4.3 |
| Suppression store | Our own `email_list_optouts`: a salted SHA-256 of the normalised address plus a list id and date, kept indefinitely, including after account deletion (counsel to confirm keeping the hash after a deletion request). Never in Resend's account-wide suppression list, which would stop sign-in links and legal notices | COMPLIANCE 4.5 |
| Transactional | Never unsubscribed. No unsubscribe link; the footer line says why (`emailLegal.whyYouGotThis.transactional`). The only way to stop them is to close the account | COMPLIANCE 4.6 |
| Hard bounce or relay rejection | Stops every non-required email to that address; shows "We could not reach {email}" in Me, Account; required notices try once and the in-app card carries the same facts | CATALOG 10.4 |
| Apple private relay | Register the domain, the return-path subdomain (`send.earlyletters.com` by default), `hello@`, and later `news.` and its sender, in the Apple Developer account. Mail to a relay address is delivered only from registered senders. Launch-blocking for billing notices | CATALOG 11; COMPLIANCE 9 |
| Language | English at 1.0. The store build is English only (D-121); letters can be spoken in seven languages but no email quotes a letter, so no email has to carry a script. An email is never machine-translated. When the app is localised, an email follows the app's language for that account: UNVERIFIED that an account language field exists | VOICE.md multilingual rule; `rules.test.ts`; IA.md |
| Dates | The long form, "Monday, November 2, 2026", from `longDate`; never "in 3 days" | CATALOG 14; D-028 |
| Tracking | None: no open or click tracking, no pixels, no remote images or fonts; the logo is an inline attachment | BRIEF; CATALOG 14 |
| Idempotency | Every send carries an idempotency key of event, subject id and period. Nothing is resent because it was not opened; we do not know if it was opened | CATALOG principle 2 |
| Records | The notice send log (account id, notice id, template version, window, scheduled and sent time, Resend message id, delivery status) kept 3 years, or 1 year after the subscription ends if longer; every published version of each legal-sensitive template archived | COMPLIANCE 6.1 |
| Plain text | Every email has a plain-text twin carrying the same facts | VOICE.md |
| Who | 18 and over; US | BRIEF |

## 8. Where each former push now lives (E79)

The catalog and the older planning notes assumed server pushes. With none in 1.0, each need has a new home.

| Was | Now |
|---|---|
| The one billing push at the trial's final notice (D-022) | The on-device plan notice (class `plan`) and the email and the in-app card |
| Co-parent letter push (F11) | An in-app line on next open (01 row 8.5) |
| Backup restore request push (F08 6.5 C3) | An email (`backup-restore-requested`, off with backup) and an in-app line |
| A security alert | An email only (E76) |

## 9. The tests a content test must prove

Names are the tests as they would be titled; "exists" means a test already reads the point in `packages/content/test/emails.test.ts` or `rules.test.ts` (read, not run).

| # | The test must prove | Exists today |
|---|---|---|
| T1 | Every email template declares its class (`kind`: transactional or commercial). LEGAL-REQ-053 calls the field `class`; the type says `kind`; the test asserts the field the type has, and the requirement's wording is aligned in the backlog | `kind` is on every `EmailCopy` by type; no test says every template has one |
| T2 | A transactional template has no `{unsubscribe}` or `{unsubscribeUrl}`, no Plus offer, no "upgrade", "discount", "offer", "% off", "tell a friend", "rate us" or "gift", and its first paragraph is the account fact (COMPLIANCE 1.2 question 3) | not found |
| T3 | A commercial template's footer carries `{unsubscribe}` and `{postalAddress}`; the commercial ids are a closed list; no commercial id is reachable from any send path for an address that came from the app (E75) | not found (COMPLIANCE 2 names the test) |
| T4 | No email string, subject and preheader included, contains `{child}`, `{childName}`, `{dueDate}`, `{birthday}`, `{age}`, `{month}`, a letter or transcript placeholder, or a count of letters; the fictional "Asha" canary is absent from rendered fixtures | not found (COMPLIANCE 7.3 recommends it) |
| T5 | Catalog parity: every id in `CATALOG.md` has a copy key or is marked "no copy", and every copy key is in the catalog ("if an email is not on this page, we do not send it") | not found |
| T6 | The never-send list holds: no email id or heading is about a streak, a birthday, a month of age, "we miss you", "come back", "last chance" or a countdown; no subject has a countdown such as "in 3 days" or "48 hours" | not found |
| T7 | Each billing notice names the plan, the price, the period, the date, the cancel-by date where relevant, that it renews automatically until cancelled, the cancel steps and that letters stay free to read, play and export; none has an offer or "are you sure" | `packages/emails/test/validation-2026-10-31.test.ts` (SUB-03) reads these; not run here |
| T8 | `email-changed-old-address` uses `{maskedNewEmail}` and never `{newEmail}` (E76); `new-device-sign-in` does not say "We will sign that device out" while the lever flag is off (E78); `identity-unlinked` has copy; every email with a code states the expiry and that we never ask for a code | the last two in part (`emails.test.ts` "states expiry", "says we never ask for codes") |
| T9 | No email says "beta", names another phone platform, or mentions print, ordering a book or a gift | "beta" and print: `rules.test.ts` covers EVERY including emails; gift: not found |
| T10 | The plain-text twin of each email carries the same facts and placeholders as the HTML | `packages/emails/test` (read, not run) |
| T11 | Every link an email uses is a built route or listed as needed | `packages/emails/src/links.ts` test, as its header says |
| T12 | The sender never sends an email between 21:30 and 07:00 in the recipient's zone except the closed list of auth, D-022 and security ids; the unknown-zone fallback and daylight saving hold | not found (a property test; owner `backend` and `qa`) |
| T13 | A hashed address in the opt-out list blocks every commercial id and no transactional id, and stays after the account is deleted | not found |
| T14 | A commercial send is refused unless a consent record with the consent text version exists, and for the news list unless the double opt-in is confirmed | not found |
| T15 | A security-alert sender, when one exists, sends 5 in an hour one by one, folds the rest, and stops at 20 a day, and never touches sign-in codes (E81) | not found; a requirement on the sender |
| T16 | The waitlist list and the accounts table share no key and no join (E75) | not found; a data test |
| T17 | App copy never says "we will email you" about billing (D-083) | stated in `features/billing.en.ts` header; the test location was not confirmed |
| T18 | No email line has an exclamation mark | `emails.test.ts` "uses no exclamation marks in auth or account email" and the budget in `rules.test.ts` |

## 10. Proposed changes and amendments `content` owes

| What | Where | Needs an erratum |
|---|---|---|
| Re-engagement as a calm optional note (6C) | CATALOG 12 row 2; FR-MKT-44 | Yes: next free number after E82 |
| Month and birthday messages with names off use a plain neutral reminder (see 01 section 12) | E82's last clause | Yes: same erratum or the next one |
| Masked new address in `email-changed-old-address`; interim last paragraph in `new-device-sign-in` | `emails/auth.en.ts` | No: E76 and E78 already rule it; this is the copy |
| The quiet-hours exemption line for security alerts | `docs/emails/CATALOG.md` 10.3 | No: E76's plan delta names `content` for it |
| Strike the pushes: "one push" on `trial-ending-final`, and the `family-letter` and `family-added` push rows | `docs/emails/CATALOG.md` principle 3, sections 6 and 7 | No: E79 and LEGAL-REQ-054 already say it |
| `kind` and `class` are one thing | LEGAL-REQ-053 wording or the type, `legal` and `content` | A one-word alignment, no ruling |

These doc and copy edits are not in this PR; this PR adds the playbook only.

## 11. Decisions the founder owns

Only the ones that are his. The first two are lines he already holds (E75, E78); I restate them and do not add to them.

| # | Decision | Default |
|---|---|---|
| 1 | Marketing email to app addresses (E75): none at 1.0; any later one needs his yes and a separate opt-in off by default | No marketing email to app addresses at 1.0 |
| 2 | The new-device sign-in email (E78): not built for 1.0; built, tested and read by security before the backup is switched on | Not built for 1.0; a hard gate before the backup flip |
| 3 | Whether `waitlist-ready` is sent, when, and from which postal address. It is commercial in our reading; counsel's Q34 decides; the postal address is his to choose (a PO box or private mailbox, never the home) | One email, held until Q34 is read and the address exists; no newsletter enrolment inside it |
| 4 | Whether the calm optional note (6C) ever exists, and how often. It needs an erratum | No at 1.0; later only as a calendar message to an opt-in, off by default, never a reaction to inactivity |
| 5 | Whether trial and renewal emails ship at 1.0 in addition to the on-device plan notice, or only once servers are on in a store build | As the catalog says (email and card, launch-blocking when servers are on); counsel confirms the windows |
| 6 | Whether to switch off Supabase's default `identity_unlinked` notice or approve `identity-unlinked` copy (4D) | Approve the copy; the notice stays on |
| 7 | Print and gift emails: no words until the printed-book go or no-go (CL-097) | Hold |

Signed, `content`.
