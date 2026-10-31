# Email templates validation, 2026-10-31

Reviewer: independent email engineer (read-only pass on `develop`, worktree `wt-val`).
Scope: all 43 templates in `packages/emails/src/templates`, their copy in `packages/content/src/emails`, and every sender in the repo (Supabase Auth templates, `supabase/functions/purge-worker`, `supabase/functions/escrow`, other functions).

## What was run

| Check | Result | Status |
|---|---|---|
| `npm run build -w @scribe/emails` | 43 emails rendered, largest HTML 19.6 KB (`annual-renewal-long`), all far under 102 KB | Verified |
| `npx vitest run` (packages/emails) | 34/34 pass (31 emails, 3 escrow export drift) | Verified |
| Playwright Chromium, 375px, `prefers-color-scheme` light and dark, shipped `out/<id>.html` with `cid:el-logo-*` swapped for `packages/brand/assets/email/logo-*.png` | 86 screenshots in `email-shots/`; every logo loads, exactly one logo visible per scheme (swap works), dark body #161412 / heading #F2ECE4 legible in all 43 | Verified |
| Horizontal overflow at 375px | 1 of 43: `policy-update` (TPL-01) | Verified |
| Outlook VML `v:roundrect` | Present once in all 30 templates with a button; absent in the 13 with no action (correct) | Verified |
| Subject and preheader | All present; no `{child}` anywhere; 2 preheaders over the 90-character guideline (TPL-09) | Verified |
| Footer per class | All 43 copies are `kind: transactional`; footer = why line, reply line, Help, Privacy, name line. Matches COMPLIANCE.md 1 and 2 (no unsubscribe or postal line needed at v1.0). `coparent-invite` correctly overrides the why line (recipient has no account) | Verified |
| Child names, letter text | None in any template, fixture or sender value set. Senders fill only dates, references, public links, device class | Verified |
| Plain-text twin | Library twin is complete (heading, body, facts, `Label URL` action, safety, signature, footer). purge-worker's hand-built text matches the library twin word for word for `account-deletion-scheduled` (diffed) | Verified |
| Supabase Auth templates (`supabase/templates/*.html`) | No `{placeholder}` left; links are `{{ .SiteURL }}/auth/callback#token_hash={{ .TokenHash }}&type=email[_change]`; VML in the 3 link templates; only `earlyletters.com` hrefs | Verified |

Screenshots: `docs/reviews/2026-10-31/email-shots/<id>.light.png` and `<id>.dark.png`.

## Coverage

Sender legend: **SB** = Supabase Auth template (committed in `supabase/templates`, applied to the hosted project through `management-api.json`; not referenced from `supabase/config.toml`). **PW** = purge-worker (text only). **ESC** = escrow function (generated HTML+text, text wordmark). **none** = no code sends it. Build columns: B1 = first build with server features (sign-in, sync, co-parent, account deletion; backup and status report flags off). B2 = backup/escrow and the subscription status report. Build relevance is Inferred from `apps/mobile/src/lib/capabilities.ts` and the catalog priorities.

| Catalog id | Template | Copy | Sender wired | Tested (lib) | B1 | B2 |
|---|---|---|---|---|---|---|
| sign-in-link | yes | auth.en | SB `magic_link.html` | yes + export drift test | needed | needed |
| verify-email | yes | auth.en | SB `confirmation.html` | yes | needed | needed |
| account-create-attempt | yes | auth.en | **none** (README says an Edge Function sends it; none exists) | yes | LB per catalog | |
| welcome | yes | auth.en | **none** | yes | 1.0 | |
| sign-in-trouble | yes | auth.en | **none** | yes | LB per catalog | |
| reauthenticate-code | yes | auth.en | SB `reauthentication.html` | yes | needed (deletion) | |
| apple-account-linked | yes | auth.en | SB `identity_linked.html` (else branch) | yes | 1.0 | |
| google-account-linked | yes | auth.en | SB `identity_linked.html` (google branch) | yes | 1.0 | |
| email-changed-old-address | yes | auth.en | SB `email_changed.html` | yes | latent (no change-email UI) | |
| email-changed-new-address | yes | auth.en | SB `email_change.html` (TPL-04) | yes | latent | |
| new-device-sign-in | yes | auth.en | **none** | yes | 1.0 | |
| passkey-added | yes | auth.en | **none** | yes | 1.0 | |
| welcome-coparent | yes | lifecycle.en | **none** | yes | 1.0 | |
| welcome-family | yes | lifecycle.en | **none** | yes | | 1.1 |
| news-confirm | no | no | none | no | later | later |
| book-printed | no | no | none | no | later | later |
| coparent-invite | yes | family.en | **none** | yes | 1.0 | |
| family-book-closing | yes | family.en | **none**; PW sends an off-catalog substitute instead (TPL-05) | yes | 1.1 | |
| family-book-restored | yes | family.en | **none** | yes | 1.1 | |
| family-digest | no | no | none | no | later | |
| family-export-ready | no | no | none | no | 1.1 | |
| trial-started | yes | billing.en | **none** | yes | LB if Plus sells (TPL-03) | needed |
| plus-started | yes | billing.en | **none** | yes | LB if Plus sells | needed |
| trial-ending-week / -long / -final | yes | billing.en | **none** | yes | LB if Plus sells | needed |
| annual-renewal-long / -short | yes | billing.en | **none** | yes | first fires ~13 months out | needed |
| anniversary-reminder | yes | billing.en | **none** | yes | first fires 12 months out | needed |
| price-increase | yes | billing.en | **none** | yes | later | |
| plus-cancelled, plus-ended | yes | billing.en | **none** | yes | 1.0 | needed |
| plus-quiet | yes | billing.en | **none** | yes | 1.1 | |
| gift-* | no | no | none | no | later | |
| account-deletion-scheduled | yes | account.en | **PW** `sendRequestEmail` (text only) | yes; PW tests | LB | |
| account-deletion-cancelled | yes | account.en | **PW** `sendCancelEmail` (text only) | yes; PW tests | LB | |
| account-deleted | yes | account.en | **PW** `receipt_email` step (text only) | yes; PW tests | LB | |
| book-deletion-scheduled / -cancelled | yes | account.en | **none** (worker query is `kind = 'account'` only) | yes | 1.0 | |
| deletion-request-received | yes | account.en | Ops by hand (no runbook render found) | yes | LB (D-042) | |
| deletion-confirm | yes | account.en | Ops or Fn: **none**; target route not built (TPL-06) | yes | LB (D-042) | |
| coparent-left | yes | account.en | **none** | yes | 1.0 | |
| privacy-request-received | yes | account.en | Ops by hand | yes | 1.0 | |
| export-ready | yes | account.en | **none**; `/open/export/...` route not defined | yes | 1.1 | |
| policy-update | yes | account.en | **none** | yes | before first change | |
| backup-restore-requested | yes (not in CATALOG) | backup.en | **ESC** `restore.ts:116` | yes + ESC tests | | needed |
| backup-key-used | yes (not in CATALOG) | backup.en | **ESC** `restore.ts:173` | yes | | needed |
| backup-key-rotated | yes (not in CATALOG) | backup.en | **ESC** `rotate.ts:102` | yes | | needed |

Totals: 43 templates. Wired: 6 Supabase-sent (7 catalog ids), 3 purge-worker, 3 escrow = 13. Unwired: 30, including 5 marked LB in the catalog (account-create-attempt, sign-in-trouble, deletion-confirm, and the D-022 trial/acknowledgment set).

## Findings

### TPL-01 `policy-update` overflows a 375px phone. Medium. Verified
- Where: `packages/content/src/emails/account.en.ts` (`policy-update` body, the "You can read it in full at {documentUrl}, and see every change at {changesUrl}." paragraph); rendered by `packages/emails/src/components/text.tsx` `Paragraph`.
- Evidence: Playwright at 375px, light and dark: `document.documentElement.scrollWidth > innerWidth`; the overflowing leaf is the sheet `TD` (right edge 392px) because `https://earlyletters.com/privacy/changes,` cannot break. Screenshot `email-shots/policy-update.light.png` is visibly scaled down. The other 42 do not overflow.
- Fix: in `Paragraph` (both variants) add `overflow-wrap:anywhere; word-break:break-word;` to the inline style, and add a test in `test/emails.test.ts` that renders every template at 375px width-equivalent (or asserts no unbreakable token over 30 characters in body text). Better still for copy: drop the raw URLs from the paragraph ("Read it in full, and see every change, at the links below") since the button already carries `{documentUrl}`.

### TPL-02 No production sender uses `renderForResend` or the inline logo. Medium. Verified
- Where: `packages/emails/src/send.ts:80-89` (`renderForResend`, `logoAttachments`); `supabase/functions/purge-worker/lib/resend.ts:145-151` posts `text` only; `supabase/functions/escrow/mail.ts:48` posts `html`+`text` with no `attachments`; `scripts/export-escrow.ts:38` and `export-supabase.ts` use `logo: 'text'`.
- Evidence: `grep renderForResend|logoAttachments` outside `packages/emails` finds only a comment in `purge-worker/emails.ts:5`. The `cid:` path, the dark-logo swap and the paper plate are exercised only in tests and the gallery.
- Fix: decide per sender. (a) purge-worker: render the three deletion receipts with `renderForResend(<CopyEmail copy=... values=.../>)` at build time into a generated file (as export-escrow does, since Deno cannot import the React package), and send `html`, `text` and `attachments` (REST snake_case via `toResendApi`). Keep sends unbatched (Resend inline attachments are not supported on batch). (b) escrow and Supabase: document in README that they deliberately ship the text wordmark. Then the README line "Senders call renderForResend" is true.

### TPL-03 Billing notices have templates and no sender. High if B1 sells Plus with a trial; otherwise B2. Inferred
- Where: `docs/emails/CATALOG.md:220-229` (LB rows), `packages/emails/src/templates/billing/*`; `supabase/functions/subscription-status/handler.ts:50` ("nothing is emailed").
- Evidence: no code fills `{manageUrl}`, `{trialEndDate}`, `{cancelByDate}` or sends any billing id. D-022 notices (trial-ending-*, trial-started, plus-started) are legally required reminders under the catalog's own reading.
- Fix: before any build that offers a free trial, add a scheduled function (or a step in subscription-status) that sends `trial-started`/`plus-started` and the D-022 windows, with idempotency keys `billing:<id>:<original_txn>:<period>`, `manageUrl = https://apps.apple.com/account/subscriptions`, dates in D-028 long form. If B1 has `STATUS_REPORT` off, record in CATALOG that B1 must not offer a trial, or that the in-app card is the only reminder and counsel accepts that.

### TPL-04 `email_change` link uses `type=email_change`, which the app does not accept. Low now (no change-email UI), Medium for B2. Verified
- Where: `supabase/templates/email_change.html` href `.../auth/callback#token_hash={{ .TokenHash }}&type=email_change`; `apps/mobile/src/lib/auth/links.logic.ts:26-27` `LINK_TYPES = ['email','magiclink','signup']`.
- Evidence: a link with `type=email_change` falls through to `{ kind: 'auth-code' }` (line 65) and opens the code screen, which is a sign-in screen, not a change-email confirmation.
- Fix: add `'email_change'` to `EmailLinkType`/`LINK_TYPES` and route it to a verify step calling `verifyOtp({ token_hash, type: 'email_change' })`, or turn `[auth.email.template.email_change]` off until a change-email feature exists.

### TPL-05 purge-worker sends an off-catalog contributor email instead of `family-book-closing`. Medium. Verified
- Where: `supabase/functions/purge-worker/copy.ts:12-19` (`contributorNotice`), `emails.ts:89-93`, `account.ts:214-233`.
- Evidence: subject "A book you write in is scheduled for deletion", copy lives outside `packages/content`, no heading, signature or `whyText`, footer says "it is about your Early Letters account". CATALOG.md:140 says an email not on the catalog is not sent; `family-book-closing` (1.1) is the catalogued version, with its template and LetterEmail layout already built.
- Fix: replace `contributorNoticeEmail` with `compose(familyEmails['family-book-closing'], { ...base(), deletionDate, parentName })` (needs the requester's `signs_as` from the RPC; if not available, ask C2 for a variant without `{parentName}`), and delete `workerCopy.contributorNotice`.

### TPL-06 Links that point at routes nobody serves yet. Medium (LB rows), Inferred for the website
- Where: `packages/emails/src/templates/fixtures.ts:315-320,349`; copy `account.en.ts` (`deletion-confirm`, `export-ready`, `policy-update`), `backup.en.ts`.
- Evidence: documented website routes (`docs/web/handoffs/2026-10-03-brand-and-legal-for-web.md:25-27`, `docs/ops/DOMAINS.md:12`) are `/terms /privacy /health-privacy /subprocessors /subscription-terms /delete-account /about /why /contact /auth/callback /auth/confirm /j`. Not in that list: `/delete-account/confirm` (deletion-confirm, LB), `/stop` (backup-restore-requested; F08 says "Not built"), `/open/export/<id>` (export-ready), `/privacy/changes` (policy-update), `/open` (used by 14 emails as `{appUrl}`; the app classifies it as `other` and opens home, the website fallback page is not listed). `/auth/callback` and Apple's `https://apps.apple.com/account/subscriptions` are correct.
- Fix: add `/open` and `/stop` to the website route contract before B1/B2 respectively; keep `deletion-confirm` Ops-only until `/delete-account/confirm` exists; add a test that every URL host+path prefix in fixtures is in a shared route list exported from `packages/brand` (`brand.web`).

### TPL-07 Catalog ids marked LB with no sender: `account-create-attempt`, `sign-in-trouble`. Medium. Verified
- Where: `supabase/templates/README.md` ("our Edge Function sends them"), no such function in `supabase/functions`.
- Evidence: grep for the ids across `supabase/`, `apps/`, `packages/api` finds nothing outside the template package.
- Fix: either downgrade them in CATALOG (Supabase's OTP flow already sends `magic_link` to an existing address, which covers both cases) or build the function. The current docs promise a sender that does not exist.

### TPL-08 purge-worker dates omit the weekday; fixtures use it. Low. Verified
- Where: `supabase/functions/purge-worker/emails.ts:26-29` (`dateStyle: 'long'` gives "November 2, 2026").
- Evidence: fixtures and CATALOG principle 6 use "Monday, November 2, 2026" (D-028).
- Fix: `dateStyle: 'full'` (gives "Monday, November 2, 2026").

### TPL-09 Two preheaders over 90 characters. Low. Verified
- `trial-ending-final` (102 with preview values), `backup-restore-requested` (106). Inbox previews will cut them mid-date.
- Fix: shorten in `billing.en.ts` / `backup.en.ts`, e.g. "Cancel by {cancelByDate} to avoid the charge. Otherwise Plus renews at {price}."

### TPL-10 Supabase Auth mail has no plain-text part. Low. Inferred
- Supabase Auth templates are HTML only (the hosted SMTP path sends what the template holds). The library's text twin exists but cannot ship there. Accept, and note in `supabase/templates/README.md`.

### TPL-11 Fixture `stopUrl` shape differs from the sender. Low. Verified
- `fixtures.ts:349` uses `/stop#t=<token>`; escrow `restore.ts:100` and the API contract `packages/api/src/server/recovery-key.ts:353` use `/stop#<token>`. Fix the fixture to `/stop#` plus a 43-character fake token.

### TPL-12 Supabase templates are not referenced from `supabase/config.toml`. Low. Verified
- `config.toml` `[auth.email]` has only `enable_signup`; `config.toml.snippet` is not pasted. Local stack sends Supabase defaults, so local tests never see our templates. Paste the snippet (paths are relative to the repo root) or record that hosted-only is intended.

## Not verified here
Real-client rendering (Outlook for Windows VML, Gmail iOS/Android forced inversion, Outlook.com logo swap), Resend acceptance of the inline attachments, and whether the hosted Supabase project has `management-api.json` applied. Run Litmus or Email on Acid and a live send to a relay address before launch.
