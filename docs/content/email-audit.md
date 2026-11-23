# Email and message audit, part 1: inventory, voice, visual

Status: audit record, docs only. Owner: `content`. Part 2 (gaps and automation plan): `docs/content/email-audit-gaps-and-plan.md`. This file changes no string, template, sender or test. Any wording marked PROPOSED is a suggestion for the normal reviewed copy path, never live copy.
Read: `WRITING-GUIDE.md`, `VOICE.md`, `BRAND.md`, `test/rules.test.ts`, `docs/emails/{CATALOG,COMPLIANCE,SECURITY}.md`, `docs/ops/{DOMAINS,AUTH_SETUP}.md`, `supabase/auth-email.md`, the lifecycle playbook (`docs/content/lifecycle-playbook/02-email-lifecycle.md`), the senders under `supabase/functions` and `apps/web/src/lib/notify`.
Marker: [UNVERIFIED] means I could not see it from the repo (hosted settings, live DNS, a real inbox).

## 0. Summary

- 45 email messages exist: 43 in the library (`packages/content/src/emails`), Supabase's default text for "sign-in method removed", and the website waitlist hello. 10 have a code path that can send them. 35 are template-only, or are Supabase-side with no app call that triggers them.
- Push and SMS: no server push at 1.0 (E79), no SMS sent by us. Local notifications exist (section 1.4).
- Checks run on a clean `origin/develop` worktree (node_modules from the main checkout, with `@scribe/*` re-pointed at the worktree; the main checkout is 322 commits behind and would have given false failures): `packages/content` vitest 505 passed; `packages/emails` vitest 60 passed; `scripts/content/copy-tells.mjs` 153 findings (baseline total, unchanged). The mechanical rules pass. The tells lint does not look at the email files: its scan only reads files named `copy.ts` or `*.copy.ts` (`scripts/content/copy-tells.mjs:21`). I ran its rules over `packages/content/src/emails/*.en.ts` myself: 55 `uncontracted`, 1 `softener`, 1 `self-narrating`, plus 5 in the website welcome copy. None is in the baseline.
- Top finding: the words are accurate and calm, but they read formal. "did not", "will not", "We will" run through every file, against guide section 6.

## 1. Inventory

Class key: T transactional (no opt-in; must stay free of promotion; CAN-SPAM primary-purpose test, `COMPLIANCE.md` 3), T? transactional by our reading, counsel to confirm, C commercial (needs consent, unsubscribe, postal line). Basis for GDPR-style questions: the product is US-only and 18+ (BRIEF); the transactional rows rely on performing the account or purchase, the one commercial-leaning row is the waitlist hello. All library copy is English only (`*.en.ts`); there is no locale layer, so locale coverage is "en-US" for all 45 and the website hello. Sender for every library email: `Early Letters <hello@earlyletters.com>`, reply-to a person (`CATALOG.md` 1.7). Subject and preheader are quoted from the copy; a body is cited by file and line.

### 1.1 Sign-in and security (copy `packages/content/src/emails/auth.en.ts`; templates `packages/emails/src/templates/auth/<id>.tsx`)

| id (copy line) | Trigger and channel | Subject / preheader | Class | Wired? |
|---|---|---|---|---|
| sign-in-link (77) | Email sign-in, Supabase Auth through Resend SMTP, `supabase/templates/magic_link.html`, `supabase/config.toml:99` | "Your sign-in link and code" / "Tap the link on the phone you asked from, or type the code. Both work for {expiresIn}." | T | WIRED: `apps/mobile/src/lib/auth/email.ts:35` (`signInWithOtp`). Hosted SMTP and template state [UNVERIFIED] |
| verify-email (59) | First sign-in with a new address, Supabase `confirmation` template, `config.toml:95` | "Confirm your email to start your book" / "One tap and you are in. The link and the code both work for {expiresIn}." | T | WIRED by the same call (Supabase picks the template for a new address) [UNVERIFIED on the hosted project] |
| reauthenticate-code (251) | Supabase `reauthentication`, `config.toml:107`, before account deletion | "Your code to confirm account deletion" / "Enter it in the app to finish. It works for {expiresIn}. Keep it to yourself." | T | Template only: no `reauthenticate` call in `apps/mobile/src` |
| email-changed-new-address (230) | Supabase `email_change`, `config.toml:103` | "Confirm your new email address" / "One tap and your sign-in links come here from now on. Works for {expiresIn}." | T | Template only: no `updateUser` email call in the app |
| email-changed-old-address (214) | Supabase notification `email_changed`, `config.toml:116` | "Your sign-in email was changed" / "Your account now uses a new address. If this was you, there is nothing to do." | T | Template only (same reason) |
| apple-account-linked (145), google-account-linked (161) | Supabase notification `identity_linked`, `config.toml:111` | "Sign in with Apple is now on your account" and the Google twin | T | Template only: no `linkIdentity` call; first Apple or Google sign-in uses `signInWithIdToken` (`apple.ts:50`, `google.ts:61`) |
| identity_unlinked (no copy) | Supabase notification, `enabled = true` with Supabase's own default text (`supabase/templates/config.toml.snippet`, last block) | Supabase default | T | Supabase-side; we do not control the words; held draft `packages/emails/drafts/sign-in-method-removed.HELD.md` |
| new-device-sign-in (196) | Cron pickup of a pending row; Edge Function `new-device-email` | "A new sign-in to your account" / "If this was you, there is nothing to do. If not, you can look at it here." | T | WIRED: `supabase/functions/new-device-email/handler.ts:124`; dark unless `NEW_DEVICE_EMAIL` is "on" (`handler.ts:50`); cron schedule [UNVERIFIED] |
| passkey-added (177) | Passkey registered; no Supabase template | "A passkey was added to your account" / "You can now sign in with a passkey on {device}. Not you? Reply with Not me." | T | Template only |
| welcome (98) | First successful sign-in | "Welcome to Early Letters" / "A minute of talking is plenty. How to begin, and what we promise." | T? | Template only (no sender; `lifecycle-playbook/02` section 2 agrees) |
| account-create-attempt (40), sign-in-trouble (122) | Deferred; sign-in is one passwordless call, so no event exists (`CATALOG.md` 4) | "You already have a book with us"; "A new sign-in link for you" | T | Template only, by decision; no sender planned |

### 1.2 Account, data and legal (copy `account.en.ts`; sender notes `CATALOG.md` 8)

| id (copy line) | Trigger | Subject / preheader | Class | Wired? |
|---|---|---|---|---|
| account-deletion-scheduled (40) | `request_account_deletion()`; purge-worker drains `request_emails` | "Your account is set to be deleted" / "On {deletionDate}. Until then you can change your mind." | T | WIRED: `purge-worker/emails.ts:50`, `account.ts:163`, `worker.ts:85` |
| account-deletion-cancelled (68) | `cancel_account_deletion()` | "Your account is staying" / "The deletion request is cancelled, and everything is back where it was." | T | WIRED: `emails.ts:58`, `worker.ts:90` |
| account-deleted (87) | Execution step `receipt_email`, before the auth user is removed | "Your account has been deleted" / "Request {requestId} is complete. This is the last email we will send you." | T | WIRED: `emails.ts:63`, `account.ts:267` |
| book-deletion-scheduled (105), book-deletion-cancelled (125) | Sole parent deletes or cancels a book | "A book is set to be deleted"; "The book is staying" | T | Template only: purge-worker has no book-email step |
| deletion-request-received (143), deletion-confirm (164) | Request through the website `/delete-account` (D-042), hand-sent by support | "We have your deletion request"; "Confirm your deletion request" | T | Template only; `/delete-account` and `/delete-account/confirm` are not in `apps/web/src/app` |
| coparent-left (189) | A co-parent's deletion request succeeds | "A change in a book you share" / "{coParentName} is closing their account. Your own letters are not affected." | T | Template only |
| privacy-request-received (207) | Rights request by email, hand-sent | "We have your privacy request" / "A person is on it. We reply within 45 days, and usually much sooner." | T | Template only (support sends by hand) |
| export-ready (224) | Server export finished (v1.1; export runs on the phone at 1.0) | "Your copy is ready to download" / "Every letter and recording, in open formats that work without the app." | T | Template only |
| policy-update (244) | Major policy change, 30 days ahead | "An update to our {documentName}" / "What is changing, in plain words, and the date it takes effect." | T? | Template only |

### 1.3 Family, billing, backup, lifecycle, website

| ids (copy file:line) | Trigger | Subject lines (preheaders in the file) | Class | Wired? |
|---|---|---|---|---|
| coparent-invite (`family.en.ts:30`) | Parent types a co-parent address | "{inviter} invited you to write together" | T | Template only. The app shares a link through the parent's own Messages instead (`apps/mobile/test/invite-sheet.test.ts`) |
| family-book-closing (50), family-book-restored (69) | Sole parent deletes or restores a shared book (v1.1) | "Save a copy of your letters"; "The book is staying" | T | Template only; purge-worker's contributor step fails closed with `config` (`account.ts:228`) |
| welcome-coparent (`lifecycle.en.ts:41`), welcome-family (21) | First sign-in from an invite | "Welcome to the book"; "Welcome to the family book" | T? | Template only |
| 12 billing ids (`billing.en.ts:72-345`): trial-started, plus-started, trial-ending-week/long/final, annual-renewal-long/short, anniversary-reminder, price-increase, plus-cancelled, plus-ended, plus-quiet | D-022 windows from the D-080 status report | e.g. "Your free trial of Plus has started"; "Your free trial ends on {trialEndDate}"; "Plus renews on {renewalDate}"; "Your Plus plan, and how to stop it" | T (plus-quiet, price-increase T?) | Template only. `subscription-status` answers 503 until its migration is applied and no build sends a report (`index.ts` header); on-phone reminders carry the dates meanwhile (1.4) |
| backup-restore-requested (`backup.en.ts:29`), backup-key-used (51), backup-key-rotated (69) | Escrow function, owner emails | "A new iPhone asked for your recordings"; "We used your recovery key"; "We updated your recovery key" | T | WIRED: `escrow/restore.ts:116,173`, `escrow/rotate.ts:102`; runs only when backup is on (off at 1.0) |
| Website waitlist hello (`apps/web/src/content/site.ts:275`, `welcome-email.ts`, layout `lib/email/layout.ts`) | Address entered at earlyletters.com, new subscriber only | "You are on the list for Early Letters" / "One letter from the book, and what happens next." | C-leaning: a relationship hello with a one-click List-Unsubscribe (`provider.ts:107`); `COMPLIANCE.md` 6.3 and 127 treat a launch announcement as commercial | WIRED: `notify/handler.ts:152`, `provider.ts:113`; Resend key and segment [UNVERIFIED] |

Not consumer mail: the ops alert (`purge-worker/emails.ts` `alertEmail`) and the escrow founder alert go to the founder, counts only.

### 1.4 Push, local, SMS, Apple

| Message | Trigger and channel | Copy | Wired? |
|---|---|---|---|
| Evening reminder, 8 variants plus neutral set | Local notification, `apps/mobile/src/lib/reminders/scheduler.ts:203`; parent opts in | "A minute for {child}?" / "Tell {child} one thing about today. A sentence will do." (`strings.en.ts:738`); neutral twin "A minute to write?" (`reminders.en.ts`) | WIRED, local; no server |
| gentleReturn, monthOpen, birthday | Local | "{child}'s book is right here"; "Month {month} begins"; "Happy birthday to {child}" | WIRED local; names only if "Names in notifications" is on |
| Plan reminders (4 lines) | Local, `apps/mobile/src/lib/billing/plan-reminders.ts:82` | "Plus is free until {date}, then it renews unless you cancel." (`features/billing.en.ts:176`) | WIRED, local |
| familyLetter, familyAdded | Server push, v1.1 | `strings.en.ts:757` | Not at 1.0: no key, token or entitlement (E79) |
| SMS | None sent by us. Invites use the parent's own Messages share sheet | n/a | n/a |
| Apple-generated | Receipts, renewals, billing problems (CATALOG E-6), Sign in with Apple relay, permission prompt text (`permissions.en.ts`, counsel-held), TestFlight | Apple's words | Not ours to edit |

## 2. Voice audit

Grades against the guide: A reads like a friend and passes the tells; B accurate and calm, formal; C has a line to change. No email breaks a mechanical rule (dashes, quotes, ellipsis, emoji, exclamation, child name, AI, streak).

| Group | Grade | Why |
|---|---|---|
| sign-in-link, verify-email, reauthenticate-code | B | One action, short, code box. "Did not ask for this?" and "We will never ask..." are uncontracted. The code email says "exactly" (`auth.en.ts:262`) |
| welcome (`auth.en.ts:98`) | C | States the privacy promise three times in one email (lines 106, 108, 109 of `auth.en.ts`) and the footer tagline says "It stays in your words." again; VOICE says say it once. Ends on "Ideas are welcome too." (line 110) |
| Security notices | B | Plain and calm. "Not you? Reply with Not me" repeats across five emails. new-device body: "open this link: Not you? {notYouUrl}" (`auth.en.ts:204`) is clumsy and has no button |
| Deletion and cancel receipts | B | Serious tone is right. "Welcome back to your book." (`account.en.ts:76`) and "Thank you for keeping your letters with us." (`account.en.ts:98`) are greeting-card endings under a deletion notice. "We have your request" is the heading on three different emails (143, 40, 105) and does not say which request |
| Billing (12) | B- | Complete and exact, as the law wants. Nine near-identical paragraphs; the key-facts table repeats the body; at 375 px the final reminder is three screens. "Please keep it." (`billing.en.ts:78,104`). plus-quiet ("If you are not using it right now", `billing.en.ts:351`) reacts to inactivity, the one gap-aware email; see Part 2 |
| Backup (3) | B | Honest, but "sealed it under the new one" (`backup.en.ts:76`) and "recovery service" lean technical; "recovery key" itself is allowed (BRAND, D-102) |
| Family and lifecycle | B | "as equals" (`lifecycle.en.ts:44`) is slogan-ish; "Then just talk." (`lifecycle.en.ts:30`) uses "just" |
| account-create-attempt (not sent) | C | "Easy to do on very little sleep." (`auth.en.ts:47`) is a joke at the parent's expense (humour policy: never about tired, late or forgetful) in an account email |
| Sign-off "Warmly," on every email (`chrome.en.ts:62`) | open | Already an OPEN row in the guide (section 1) for deletion and security mail; CMO decides |
| Website hello (`site.ts:275`) | C | A sample letter in a parent's voice ("From Papa", excerpt about the light switch) breaks principle 11. "You are", "will", "is not" uncontracted. Makes two promises ("once more, at launch"; "never sell your data") that counsel should read |
| Local notifications | A- | Short, invitations, neutral twins. `monthOpen` "Month {month} begins" and the `moments` milestones ("10 letters.", "365 letters.") are counts of what exists, not gaps; fine, but keep them off the lock screen |

Subjects are 22 to 45 characters and plain; no clickbait. Preheaders mostly add a fact. One call to action per email holds everywhere except new-device (no button) and billing (button plus long prose).

### Top findings, in order

1. 55 uncontracted forms across the email files, outside the lint's reach. Proposed fix: extend the scan to `emails/*.en.ts` with a baseline, then rewrite ("didn't", "we'll").
2. Three privacy statements inside `welcome` plus the footer tagline.
3. "Easy to do on very little sleep." (not sent; remove before any sender exists).
4. Greeting-card endings in deletion mail ("Welcome back to your book.", "Thank you for keeping your letters with us.").
5. Same heading "We have your request" on three deletion emails.
6. Billing length and duplication (body repeats the key-facts rows; 9 paragraphs); keep every legally needed fact, cut the repeats. Counsel reads any cut.
7. Website hello carries a sample letter in a parent's voice.
8. "Please keep it." in two billing emails; "just" in `welcome-family`.
9. new-device email has a bare link inside a sentence and no button.
10. `identity_unlinked` is on with Supabase's default words, outside our voice.

PROPOSED wording, for the normal review path only: heading for `book-deletion-scheduled`: "A book is set to be deleted". Billing sentence: "Keep this email as your copy of what you agreed to." Both pass the rules test as far as I can read; neither is run.

## 3. Visual audit

Rendered with `npx tsx scripts/render.ts` in `packages/emails` (43 emails to HTML and text, plus a light and dark gallery), then screenshotted in Playwright Chromium at deviceScaleFactor 2: 10 emails (sign-in-link, welcome, trial-ending-final, account-deleted, new-device-sign-in, export-ready, coparent-invite, backup-restore-requested, account-deletion-scheduled, policy-update) at 375 light, 375 dark and 600 light. Files: `scratchpad/launch/email-audit/<id>.<mode>.<width>.png`.

- Tokens and consistency: layout, colours and type come from `packages/emails/src/tokens.ts` and the shared components (paper sheet on a deeper desk, serif heading, pill button, code box). Every one of the 10 looks like the same family. Calm and elegant; I would not change the look.
- Mobile: no horizontal overflow in any of the 30 frames (scroll width equals client width), smallest text 13 px (footer), button full width and 48 px tall.
- Dark: warm near-black desk (`#161412`), light logo swapped in, button turns to a soft clay; legible in the frames I read (sign-in, trial-ending-final). Gmail's forced-dark and Outlook are not covered.
- Accessibility: one `<title>`, logo alt text, `lang="en"`, code digits spaced. Not measured: contrast ratios, screen-reader order.
- Plain text: present for every library email (`out/*.txt`), prints the URL once and keeps the safety note. Supabase Auth templates are HTML only (README TPL-10, accepted). The website hello has its own text part.
- Weak spots: billing emails are long (final reminder is about 1760 px tall at 375, the button sits in the third screen); the headline serif falls back to the system serif here, so real Georgia rendering is unseen; "Help" in the text part shows the mailbox address, in HTML a link.
- Could not render: the Supabase Go-template HTML files (placeholders are Go variables), the website hello (separate layout in `apps/web/src/lib/email/layout.ts`), Apple Mail, Gmail, Outlook, Litmus, and any real inbox. [UNVERIFIED]
