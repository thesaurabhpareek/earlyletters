# Function review: messaging and entry points (MSG)

Second-wave review, written 20 Nov 2026 (UTC) under `docs/product/prd/functions/BRIEF.md` and the common gap-agent brief. Branch `docs/locked-pack-inputs-20nov`, working tree head `736a1cf1c`. Docs only: nothing here is built, no string is live, and no decision is recorded. Karma rules the card changes.

The author is a Claude role, not a lawyer. Every legal reading says "counsel must confirm". Words a parent would read are quoted as intent only; `content` writes them and the founder approves them. The only example family is the fictional family Asha.

Scope: everything that reaches a person outside the app screens (email, notifications) and every door into the app from outside (universal links, the invite landing page, deferred links after install, the website, the URLs Apple requires).

---

## 1. What I reviewed, and what I did not

### Read this session

| Source | What I used it for |
|---|---|
| `docs/product/prd/functions/BRIEF.md`, `/home/claude/review/gap-agents-common.md` | Format, linking process |
| `docs/product/prd/18-errata-after-lock.md` (all), `GAP-LOG.md` (grep for email, push, invite, link; line 193 G-D12, 231 K-E11 read) | Rulings already made |
| `00-product-frame.md` (grep: lines 87, 113, 149, 167), cards 02, 04, 06, 08, 10 by grep for link, invite, push, notification | Existing coverage |
| `10-reading-and-family.md` NS-25 sections 4 to 13 (lines 696 to 852), parked NS-26 (lines 885 to 896) | Invite path, link page rules, push parked |
| `19-from-download-to-first-letter.md` NS-38 sections 1 to 5 and 23 (lines 53 to 209), NS-39 section 5 (lines 225 to 246), NS-41 rows R11 to R25 (lines 730 to 745), grep for relay and link rows | Install, first launch, sign-in mail |
| Adjacent function reviews, by grep for bounce, DMARC, universal, push, relay, invite, delete-account: `risk-security.md`, `legal.md`, `compliance.md`, `operations.md`, `privacy.md`, `marketing.md`, `support.md` (first 90 lines read in full) | To point to FR ids, not repeat them |
| `docs/brand/EMAIL_IDENTITY.md` (all 271 lines), `docs/emails/CATALOG.md` (all 211 lines), `supabase/auth-email.md` (all 212 lines) | Email identity, catalog, SMTP and Apple relay runbook |
| `docs/emails/SECURITY.md` and `COMPLIANCE.md`, by grep for DMARC, SPF, DKIM, bounce, suppression, relay (lines 15, 37 to 40, 208 to 222, 243 to 254, 269 to 271, 443 to 451) | Deliverability plan |
| `docs/ops/DOMAINS.md` lines 1 to 80 (DNS records, DMARC stages, `.app` lockdown) | DNS target state |
| Built code: `apps/web/src/app/.well-known/apple-app-site-association/route.ts` (all), `open/page.tsx` (all), `j/page.tsx` (all), `auth/confirm/page.tsx` (head), `apps/web/src/content/site.ts:318-370`, `apps/web/next.config.ts:48-113` (grep), `apps/web/src/app/robots.ts`, directory listings of `apps/web/src/app`, `(legal)`, `lib/legal`; `apps/mobile/app.config.ts:92-125, 182-262`; `packages/emails/src/links.ts` (all), `packages/emails/src/templates/supabase.ts:64-68`; `supabase/templates/magic_link.html` (hrefs); `supabase/functions` listing; `packages/api/src/server/push.ts:1-30`; `packages/brand/index.ts` (grep) | What is built |
| `docs/BACKLOG.md` rows BL-053, BL-100, BL-196, BL-243, BL-364, BL-368, BL-383, BL-510, BL-546 | Backlog links |
| `docs/legal/app-store-privacy-labels.md` lines 30 to 40, 128 to 129; `docs/legal/delete-account-page.md` lines 1 to 60; `docs/ops/RELEASE.md` grep for review and URLs | Store URLs |
| Area D and E design on `origin/docs/e2e-ux-20nov` (fetched this session): `D-family-sharing-reminders/DESIGN.md` screen table lines 226 to 249, D-S14 and J-D32 lines (154 to 170, 520, 800), `E-foundations-and-system-states/DESIGN.md` screen table lines 196 to 224 | Screen ids |

### Outside sources read this session (20 Nov 2026)

| Fact | Source |
|---|---|
| Guideline 4.5.4: push must not be required for the app to function and "should not be used to send sensitive personal or confidential information"; no promotions or direct marketing by push unless people opted in with consent language in the app and an in-app opt-out exists | https://developer.apple.com/app-store/review/guidelines/ (read 20 Nov 2026) |
| Guideline 1.5: "Make sure your app and its Support URL include an easy way to contact you" | same page |
| Guideline 5.1.1(i): a privacy policy link in the App Store Connect metadata field and in the app, which must say what is collected, retention and deletion, and how to revoke consent or request deletion | same page |
| Guideline 5.1.1(v): an app that supports account creation must offer account deletion within the app | same page |
| Guideline 2.1(a): submissions need working URLs; "placeholder text, empty websites, and other temporary content should be scrubbed"; include demo account info and "turn on your back-end service" if the app has a login | same page |
| Private relay: every source domain must be registered and have an SPF TXT record; outbound mail must pass SPF and/or DKIM; the envelope sender domain must match the registered domain exactly; the DKIM domain must match the From domain exactly; unregistered sources produce a bounce; an individual account can register up to 32 email sources | https://developer.apple.com/help/account/configure-app-capabilities/configure-private-email-relay-service/ (read 20 Nov 2026) |
| Associated domains: the file is at `https://<domain>/.well-known/apple-app-site-association`, over HTTPS with a valid certificate and no redirects; each subdomain needs its own entitlement entry and its own file; since iOS 14 devices ask Apple's CDN, not our server; the CDN requests the file within 24 hours and devices recheck about weekly; users without the app "get the same information in a web browser"; a component can exclude a fragment | https://developer.apple.com/documentation/xcode/supporting-associated-domains.md (read 20 Nov 2026) |
| Resend suppressions: a permanent bounce adds the address; a complaint adds it, though Gmail may not send a complaint event; suppressions apply to the whole team across domains; removal in dashboard or API, and a still-bad address is re-suppressed | https://resend.com/docs/dashboard/emails/email-suppressions (read 20 Nov 2026) |

Facts the repo cites from 3 Oct 2026 (Resend SMTP behaviour, DNS values, Gmail and Yahoo bulk-sender rules, CAN-SPAM, BIMI costs) are cited below as "repo evidence". I did not re-open those vendor pages. Where a requirement leans on one it says so.

### Not read, not run

- I ran nothing: no DNS lookup, no mail sent, no AASA fetch, no phone. Every statement about live DNS, the live DMARC record, the live Resend setting or production Vercel variables is the repo's 3 Oct 2026 reading and is UNVERIFIED today.
- The remainder of `COMPLIANCE.md` and `SECURITY.md` beyond the lines above; `docs/ops/AUTH_SETUP.md`; `docs/ops/WEBSITE_RUNBOOK.md`; the web app's `lib/legal/serve.ts` (so I cannot say whether `/health-privacy`, `/subprocessors` and `/subscription-terms` are served through `legal/[doc]`); `AuthConfirm.tsx`; `apps/web/src/app/api/*`, `signup/*`, `unsubscribe/*` (names only).
- Apple pages not opened: APNs documentation (token handling, error codes, priority and interruption levels), Guideline 3.1.2 (subscription disclosure), Guideline 4.8 timing for Hide My Email beyond the text above, App Store Connect field rules for Marketing URL and Support URL (UNVERIFIED), the Time Sensitive entitlement, the iOS local-notification pending limit, and how iOS delivers a universal link that is typed into Safari or tapped on the same domain (the page I read did not say).
- Google Play's account-deletion web link rule (Android is later; UNVERIFIED).
- No council skill exists for this area (`.claude/skills/` has none for messaging), so the BRIEF's evidence rules apply directly.
- `GAP-LOG.md` and the cards were read by grep and the sections above, not end to end.

---

## 2. Coverage check: what the repo and cards already say

Grep over `docs/product/prd/*.md` found two hits on email deliverability and eleven on deep links, as the brief said. The repo outside the PRD is far fuller; the gap is that the PRD cards do not own it, so no card row tests it.

| Topic | Where it is already written | Verdict |
|---|---|---|
| Sender identity (`Early Letters <hello@earlyletters.com>`, no `no-reply@`, reply goes to a person) | `EMAIL_IDENTITY.md` section 2 (lines 19 to 31) | Written, not in any card row |
| SPF, DKIM, DMARC target state and the staged DMARC path | `DOMAINS.md` section 3 (lines 40 to 79); `SECURITY.md:208-222`; BL-368 | Written; live state UNVERIFIED; the two docs differ (below) |
| Hide My Email registration | `auth-email.md` section 6 (lines 170 to 182); `CATALOG.md` section 11; BL-368; card NS-41-R18 (`19-...md:737`) | Card row exists for the outcome; the setup is a founder step with no check in the release gate |
| Email list and rules | `CATALOG.md` (all); never-send list section 12 | Written. Catalog conflicts with later rulings in three places (section 3 below) |
| Bounces and suppression | `COMPLIANCE.md:241-254`, `CATALOG.md` section 10 rule 4, `SECURITY.md:269` (Resend webhooks named) | Policy written; nothing built: `supabase/functions` has no webhook receiver (listing read: `_shared`, `analytics-forget`, `apple-token`, `config`, `content`, `escrow`, `invite-redeem`, `purge-worker`, `subscription-status`) |
| Templates | `packages/emails` (README, `src/templates`, `generated/resend.ts`); Supabase templates in `supabase/templates/` | Built; their links use the fragment (`supabase.ts:64-68`, `magic_link.html`), which closes the 3 Oct finding |
| Push | `app.config.ts:92-103` strips `aps-environment`; BL-546 blocked; `push.ts:1-30` payload shapes only; frame line 113 "Local notifications only"; NS-26 parked | Decided: no remote push in v1. `CATALOG.md:12` and the `trial-ending-final` row still plan one billing push (conflict) |
| Notification permission and lock-screen privacy | NS-13, NS-18, NS-32, D-S04, D-S05, D-S10, D-S11, E-S28, J-N24, NS-39-R2 | Covered for local notifications |
| Universal links | AASA route (all 70 lines), `app.config.ts:182-262` (entitlement only in sign-in-capable builds), BL-510 | Built; no release check; the store build with servers off carries no associated-domains entitlement |
| Invite landing page | `j/page.tsx`, `site.ts:357-370`, NS-25-R6, D-S14 | Built; differs from D-S14 (no store link) |
| Deferred links after install | NS-39-R14, `19-...md:239` (link held until the age answer); D-S14 copy steps; BL-420 and BL-421 invite link shape | Partly: holding is covered; what the person does after the install is not written as a requirement |
| Website as a product surface | `apps/web/src/app` has `/`, `/privacy`, `/terms`, `/support`, `/legal/[doc]`, `/auth/confirm`, `/auth/callback`, `/j`, `/open`, `/unsubscribe`, `/signup/*`; `links.ts:20` lists `/stop`, `/subscription-terms`, `/delete-account/confirm` as needed; BL-243 and BL-364 | Partly; deletion page status is contradictory (section 3) |
| Apple review URLs | `app-store-privacy-labels.md:36-37, 128-129`, `RELEASE.md:210, 222-225`, `app-review.en.ts` (cited by NS-38) | Partly; no automated check that each URL is live and true |

### Card verdicts for this area

| Card | Verdict | Why |
|---|---|---|
| NS-10 New phone | partly | Sign-in mail and the "wrong account" path depend on mail arriving; no card row names delivery |
| NS-13, NS-18, NS-32 Reminders, typed days, budget | covered | Local, quiet window, lock-screen defaults. Remote push is not built |
| NS-25 The other parent | partly | NS-25-R6 (page names no child) is a row. No row for the not-installed path, the App Store link, link previews, or abuse of a forwarded link beyond FR-SEC-09 and FR-SEC-23 |
| NS-26 Push for the other parent (parked) | covered | Reopen conditions need an APNs key, entitlement and consent (lines 885 to 896); I add the messaging gates in FR-MSG-17 |
| NS-38 App Store page and install | partly | Lists fields; does not list the Support URL, Privacy Policy URL or Marketing URL as live-and-checked fields |
| NS-39 First launch | covered | NS-39-R2 (no OS prompt), R14 (held link). Needs a row for an email link opened with no app (web only) |
| NS-40 Age and region | covered | Held link dropped on No |
| NS-41 Sign up and sign in | partly | R11, R12, R16, R18, R21 cover code, link, relay, cap. Missing: bounce and suppression, sender authentication as a gate, the not-arriving help path, site-down fallback |
| NS-42 and later | not reviewed | Grep only; `19-...md:970` and `:1014` (invitation words in agreements) belong to `legal` and `content` |
| Others (NS-01 to NS-09, NS-11 to NS-24, NS-27 to NS-37) | no messaging surface | None reach email, push or a link |

---

## 3. What is missing, and what conflicts

Missing, in the order a person would meet it:

1. **Nothing proves the mail arrives.** The authentication of the sending domain, the relay registration and the DMARC stage are founder tasks (FT-13, BL-368) with no pass-or-fail check before a store build that signs in. A person who never gets the code never gets a book (core loop).
2. **No bounce or complaint intake.** Policy says a hard bounce stops non-required mail and shows a quiet row. Nothing receives the event, and Resend suppresses account-wide (verified), so one bounce also blocks that person's later required notices.
3. **No "the mail did not come" ladder** tied to the cause (spam folder, typo, relay forwarding off, suppressed address), only generic help lines.
4. **Email, push and link behaviour per build is not one table.** `signInCapable` (`app.config.ts:182-200`) removes the associated-domains entitlement in a store build with servers off. A reader of the cards cannot tell which link works in which build.
5. **The not-installed path is written in three places that disagree.** Card and design D-S14 say the invite page gives the App Store link; the built `/j` page has none (`j/page.tsx`, `site.ts:357-370`); `/open` shows it only in live mode.
6. **Deferred deep link is unwritten.** Apple's CDN note (verified) means a link tapped before install opens the web page, and there is no native deferred link. The repo's answer (copy then paste after install, `site.ts:361`) has no requirement, no privacy ruling on reading the clipboard, and no statement that no attribution tool is used.
7. **Expiry is told in the wrong place.** The page cannot know (G-D12, `DESIGN.md:800`); the app must. The email-link page has the same limit (`site.ts:327`).
8. **No release check for the AASA file and for each store URL**, although Apple's CDN means a mistake takes up to a day to fix and about a week to reach installed devices (verified).
9. **Deletion page status is contradictory** (below), and `deletion-confirm` waits on a page that may not exist.
10. **No owner for the "a person reads every one" promise** as a claim with a response time.
11. **No site-down or Resend-down runbook** for sign-in.

Conflicts for Karma to rule (each repeated as a card change in section 6):

| # | Conflict | Sources |
|---|---|---|
| C-1 | `CATALOG.md:12` and the `trial-ending-final` row plan "one push (the only billing push)", while v1 carries no push entitlement and no token request | `CATALOG.md:12, 92`; `app.config.ts:92-103`; BL-546; frame line 113; NS-32 plan notices are local |
| C-2 | `CATALOG.md` E-3 and `coparent-invite` (an email to a typed co-parent address, D-055) vs NS-25 where the parent shares a link from their own messages | `CATALOG.md:24, 70`; `10-reading-and-family.md:710` |
| C-3 | `/delete-account`: BL-243 says it "must be live before submission (FT-31)"; `app-store-privacy-labels.md:37` says it was removed from the website and moved into the Privacy Policy (#169); `brand.web.deleteAccount` and `links.ts` still name it; no route directory exists; counsel's draft `delete-account-page.md` 1.1.0 is "draft-for-counsel" | cited lines |
| C-4 | DMARC: `AUTH_SETUP.md:128` (not re-read in full) suggests starting at `p=quarantine`; `DOMAINS.md` and `SECURITY.md:216-222` start at `p=none` with reports to `dmarc@`; `SECURITY.md:40` records the 3 Oct live record with `rua=hello@` | cited lines (live state UNVERIFIED) |
| C-5 | `/j` page lacks the App Store link that D-S14 and NS-25 section 4 step 1 promise | `j/page.tsx`; `DESIGN.md:154` |

---

## 4. Function requirements

Priority key: P0 needs an RR-4 reason, (a) promise, (b) legal or store, (c) core loop. Owner lane is the agent handle. Links use `NS-nn-Rn` rows, e2e screen and state ids, and backlog rows; "new" means a row is needed. No BL id above BL-999 is proposed.

### 4.1 Transactional email

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-MSG-01 | Given a store candidate whose build can sign in, When the release gate runs against staging with a test inbox at Gmail, iCloud Mail, Outlook.com and one Apple relay address, Then each raw message shows `dkim=pass header.d=earlyletters.com`, `spf=pass` for the `send.` return path, `dmarc=pass`, TLS on the last hop, and the result (no addresses, no tokens) is recorded in `docs/legal/evidence/` per release | NS-41-R18, NS-41-R11; E-S05, E-S06; BL-053, BL-368 (new gate row needed) | P0 (c) | ops (check), founder (DNS) | `auth-email.md` section 8 checks 1 to 5, 8; `DOMAINS.md` section 3. Live DNS UNVERIFIED today |
| FR-MSG-02 | Given the sending setup, Then the DMARC path is one ruled sequence: `p=none` with reports to a dedicated `dmarc@` inbox, then `quarantine` at `pct=25`, then 100, then `reject`, each stage moving on only after the clean-report rule of `DOMAINS.md`; Then no BIMI or logo programme is started before enforcement | NS-41; E-S05; BL-368 | P1 | ops | `DOMAINS.md:64-77`, `EMAIL_IDENTITY.md:139-150`, `SECURITY.md:213-222`. Counsel not needed; founder rules C-4 |
| FR-MSG-03 | Given a person who chose Hide My Email, When any email is sent to the relay address (sign-in code, deletion receipt, policy notice), Then it reaches their real inbox: `earlyletters.com`, `send.earlyletters.com` and `hello@earlyletters.com` are registered, the return-path domain has an SPF record, and the DKIM domain equals the From domain exactly | NS-41-R18 (P0 c, device test with an Asha Apple test account); E-S02, E-S24; BL-368 | P0 (c) | founder (Apple account), ops | Apple relay page (verified: every source registered, SPF and/or DKIM, exact match, unregistered mail bounces, 32 sources for an individual). Register `send.` exactly as Resend names it |
| FR-MSG-04 | Given the founder replies to a relay user from `hello@`, When the reply is sent through a different mail provider than Resend, Then that provider's sending domain and DKIM also pass Apple's check, or the reply is sent from a registered source | NS-41-R18; E-S06.help; new row needed | P1 | ops | `COMPLIANCE.md:450`, SECURITY Q4 (how replies are sent is open). Apple rules verified as above |
| FR-MSG-05 | Given a Hide My Email address, Then the in-mail "why you got this" line says in plain words that it came to the private address Apple made, and no screen shows the relay address (the method shows instead) | NS-41-R18, NS-41-R17; E-S24 (claim), E-S11; `content` string needed | P1 | content, mobile | `EMAIL_IDENTITY.md:165`; `19-...md:737`. Do not promise a logo on relayed mail (UNVERIFIED per the repo) |
| FR-MSG-06 | Given Resend reports a permanent bounce, a complaint, or a suppression for an address, When a receiver in `supabase/functions` handles the event, Then it writes a content-free record (hash of the address, class, time), alerts `ops` on a complaint rate above 0.1 percent a week or any bounce of a sign-in mail, never logs the address, and the receiver verifies the sender's signature before reading the body | NS-41; E-S06; BL-053 (new row needed: bounce and complaint receiver) | P0 (c) for the alert on sign-in mail; P1 for the record | sync, privacy | `SECURITY.md:269` (names `email.bounced`, `email.complained`; event names UNVERIFIED, the suppression page I read documents only `suppression.added` and `suppression.removed`). Resend scope and removal verified. No receiver exists (function listing) |
| FR-MSG-07 | Given a hard bounce or a relay rejection on an address, Then non-required mail to it stops, required notices still try once, Settings, Account shows one quiet row "We could not reach {email}" with a way to correct the address, and no streak, fear or guilt wording is used | NS-41, NS-10; E-S11 or Me account state (new state needed); `content` string needed (`CATALOG.md:187`) | P1 | mobile, content | `CATALOG.md` section 10 rule 4. Content rules `CLAUDE.md` |
| FR-MSG-08 | Given a person whose sign-in email does not arrive, When they open "Trouble signing in" (E-S06.help), Then the help names, in this order: check the address typed, wait the 60 seconds then send again, look in spam, try Sign in with Apple when the build offers it, and write to us; and for a suppressed address support can look the state up and clear it after the cause is fixed | NS-41-R12, NS-41-R21; E-S06.help, E-S06.noAddress, E-S14; support macro (FR-SUP-07) | P1 | support, content | `auth.troubleButton`, `auth.noEmailHelp` exist (per `support.md:26`). Resend removal verified. Whether Supabase SMTP surfaces a suppressed send as an error is UNVERIFIED: test it on staging |
| FR-MSG-09 | Given any email the product can send in a build, Then a single table in `docs/emails/CATALOG.md` lists it with the build flag that enables it; a store build with servers off sends none (D-121); and a test fails if a template exists that is not on the table | NS-41, NS-39-R2; E-S02; BL-053 (new test row needed) | P0 (b: no dormant surface) | mobile, ops | `links.test.ts` pattern (`links.ts:1-12`); `app.config.ts:182-200`; `CATALOG.md:1-6` ("If an email is not on this page, we do not send it") |
| FR-MSG-10 | Given an exported template (Supabase or `renderForResend`), Then the sign-in link holds its token after `#`, never in the query or path; the code is always shown; there is no image from another host and no tracking; and a link scanner that fetches the page cannot use the token | NS-41-R11, NS-41-R16; E-S06; BL-053 | P0 (b) | mobile, security | `supabase.ts:64-68` and `magic_link.html` link built as `/auth/callback#token_hash=...` (read: this closes the 3 Oct finding at `auth-email.md:116`). Re-run `auth-email.md` check 3 on staging |
| FR-MSG-11 | Given a launch announcement, a press mention, or a public TestFlight link, When it is scheduled, Then the project's hourly email cap and the Resend plan's daily quota are raised and an 80 percent alert is on first, and the app's `email_wait` line plus an open Sign in with Apple path cover the cap (NS-41-R21) | NS-41-R12, NS-41-R21; E-S05.error-email_wait, E-S14; new row needed | P0 (c) | ops | `auth-email.md:97-101` (cap 100 an hour, quota UNVERIFIED for the founder's plan); FR-SEC-11, FR-RSK-05 |
| FR-MSG-12 | Given the footer promise "A person reads every one", Then it is a row in the claims inventory with an owner, a mailbox that is read at least every working day, a reply target stated in the help centre (the catalog's "within 2 working days" is the default), and no auto-reply that says otherwise | NS-33 help path; E-S13 (write to us); FR-SUP-04; claims inventory | P0 (a) | support, marketing | `EMAIL_IDENTITY.md:121`, `CATALOG.md:128-131`; frame line 87 (every public sentence has a row) |
| FR-MSG-13 | Given every email copy file, Then `packages/content/test/rules.test.ts` checks it for em and en dashes, curly quotes, ellipsis characters, emoji, fear, guilt, child names, "AI" wording and the placeholder allowlist | all cards with a mail; `content` | P1 | content | `EMAIL_IDENTITY.md:271` says the email copy was not exported to the rules test on 3 Oct; UNVERIFIED if it still is not. `CLAUDE.md` content rules |
| FR-MSG-14 | Given the question of invite email, Then no email is sent to an address a parent types for someone else in v1: the invite is a link shared from the parent's own messages (NS-25), `coparent-invite` and `welcome-coparent` are marked "not built" in the catalog, and the invite sheet never says "we will email them" | NS-25-R16, NS-25-R2; D-S13, D-S15; BL-196 (n/a); catalog change | P0 (a) | content, legal (counsel must confirm) | `CATALOG.md:24, 70`; `10-reading-and-family.md:710`. Reason: an address owner who never asked for mail, and the provider would hold an address of someone who has not agreed (Privacy Policy lists the mail provider as receiving identifiers; counsel must confirm) |
| FR-MSG-15 | Given a sign-in-capable build, When `earlyletters.com` is down, Resend is down, or the cap is hit, Then Sign in with Apple, a code already sent, and everything on the phone still work, and no first-run path needs a page on the website; a runbook "sign-in mail stopped" exists | NS-41-R21, NS-41-R25; E-S14.outage; new runbook row needed | P0 (c) | ops | `DOMAINS.md:23-37` (a lapsed domain breaks every link); `auth-email.md` check 3 (the code works without the page). Runbook missing: `docs/ops/runbooks/` listing read |

### 4.2 Push and local notifications

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-MSG-16 | Given any v1 build, Then it carries no `aps-environment` entitlement, asks for no push token, and no listing, help text or in-app line says a push can arrive; reminders are described as on this phone | NS-13, NS-32, NS-26; D-S04, E-S28; BL-546 | P0 (b: no dormant surface) | mobile | `app.config.ts:92-103`; BL-546 ("Until this is ruled in, no other task adds the entitlement"); frame line 113. Guideline 2.5.19 is cited by the repo, not re-read |
| FR-MSG-17 | Given the day NS-26 or BL-546 is reopened, Then these are true before any build carries the entitlement: an APNs key with a named owner and rotation (FR-SEC-17), a consent text and an opt-out in the app, a privacy-label row (Q54(d)), payloads limited to a kind and fixed copy with no child name, signature, letter text or id (`push.ts` as written), interruption level passive for letters, the time-sensitive level and its entitlement ruled separately for restore requests, quiet hours matching the local window, a token that is deleted on sign-out and on a dead-token answer from APNs, and the one-per-day budget of NS-32 | NS-26, NS-32-R4b; D-S10, D-S04, E-S28; BL-546 | P1 (gate list, parked) | sync, mobile, privacy | `push.ts:1-30`; Guideline 4.5.4 (verified). APNs token errors, the time-sensitive entitlement and its review rule: UNVERIFIED, not read |
| FR-MSG-18 | Given any notification the product shows, local or later remote, Then it never carries a child name, letter words, a count, a streak, a due-date count or a sealed letter's existence unless the parent has chosen it (typed days, NS-18-R3), the lock-screen default is the placeholder, and the app switcher and lock screen follow E18's one rule | NS-13, NS-18-R3, NS-32; D-S10 (`-hidden` states), D-S11; J-N24, J-N26 | P0 (a) | mobile | `14-test-plan.md:73-75`; `D-S10` row; Guideline 4.5.4 (no sensitive information in push, verified). The email rule is the same (`EMAIL_IDENTITY.md:31`, `CATALOG.md:22`) Extended by FR-MSG-41 on 20 Nov. |
| FR-MSG-19 | Given a fresh install, When the person finishes first run, Then no notification permission has been asked; it is asked once, at the person's own act (the reminder ask D-S04 after a kept letter, or the Plus confirmed screen's ask when never asked), after our sentence, and a "No" or a system "Don't Allow" is never asked again by us | NS-39-R2, NS-13, NS-32; D-S04, D-S05, E-S12.withAsk, E-S28 | P0 (c) | mobile | NS-39-R2 (`19-...md:282`); D-S04 states Extended by FR-MSG-40 on 20 Nov. |
| FR-MSG-20 | Given the permission was refused or later turned off in iOS Settings, When the person opens Me, Reminders, Then one plain line says reminders are off and how to turn them on, nothing nags, the plan date is shown in the app (D-S24) and scheduling that fails is told once (`error-schedule_failed`) | NS-13, NS-32-R4; D-S06.denied, D-S06.error-schedule_failed, D-S24 | P1 | mobile | D-S06, D-S24 in the screen table. The iOS limit on pending local notifications is UNVERIFIED here; NS-13 and E13 use 60 |
| FR-MSG-21 | Given quiet hours, Then local reminders are clamped to 07:00 to 21:30, no email other than sign-in mail and a notice whose legal window would close is sent in 21:30 to 07:00 in the person's time zone, and a time zone change re-plans the schedule | NS-13, NS-32; D-S06.lateClamp, D-S07 | P1 | mobile, ops | `CATALOG.md` section 10 rule 3; NS-13 rows. Time zone fallback US Pacific is the catalog's default |
| FR-MSG-22 | Given any push or email that could count as promotion or direct marketing, Then none is sent in v1; any future marketing message needs explicit opt-in wording in the app and an in-app opt-out, and goes from a separate subdomain | NS-32; E-S28; marketing FR ids | P0 (b) | marketing, content | Guideline 4.5.4 (verified); `CATALOG.md` section 12; `EMAIL_IDENTITY.md:27` |

### 4.3 Universal links, the invite page and the not-installed path

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-MSG-23 | Given a release candidate whose build can sign in, When the gate runs, Then `https://earlyletters.com/.well-known/apple-app-site-association` answers 200 with JSON, no redirect, listing the production and `.preview` app ids and exactly the paths `/auth/confirm`, `/auth/callback`, `/j`, `/open` (with trailing-slash forms); the Vercel variables `APPLE_TEAM_ID` and `IOS_BUNDLE_ID` are set for the production build (the route answers 404 when either is missing); and the file is changed at least one day before a build that depends on the change | NS-41, NS-25; E-S05, D-S14; BL-510, BL-364 | P0 (c) | ops, mobile | Route read in full; Apple's page (verified: no redirects, CDN fetch within 24 hours, devices recheck about weekly). Live production values UNVERIFIED |
| FR-MSG-24 | Given each way a link can arrive, Then one table states what the person sees, and a device run checks the rows marked D: app installed (opens the app) D; app not installed (web page, no dead link) D; Android or a computer (page says iPhone only for now, no error) ; link opened in a chat or mail app's own browser (fragment may be dropped, page says so, `missing`) ; link opened in a build with no associated-domains entitlement (store build, servers off: web page only) ; link opened before the age answer (held, dropped on No) | NS-25-R6, NS-39-R14, NS-40-R3; D-S14.iphone, .other-device, .missing-token; E-S03; device-check row (new) | P0 (c) | mobile, design | `site.ts:357-370`, `j/page.tsx` header, `19-...md:239`, `app.config.ts:182-200`. How iOS treats a typed or same-domain tap is UNVERIFIED (not stated on the Apple page read) |
| FR-MSG-25 | Given an email sign-in link tapped with the app installed, Then the app opens and the code in the same email is still the fallback; given the app is not installed or the link opens in a scanner, Then `/auth/confirm` signs nobody in, confirms nothing, makes no request that carries the token, and tells the person to type the code in the app | NS-41-R11, NS-41-R16; E-S06; BL-053, BL-510 | P0 (c) | mobile, web | `site.ts:318-327`; `auth-email.md` check 3 |
| FR-MSG-26 | Given `/open` (the link at the end of most emails) with the app absent, Then it shows "Open the app" using the bare scheme, the App Store link only when the site is in launch mode, "iPhone only for now" on Android, no token and no script from another host, and it is never indexed | NS-38, NS-39; E-S27; BL-510, BL-364 | P1 | web | `open/page.tsx` read in full; BL-364 scope (the Android line is a scope item, not yet seen in `site.ts`: UNVERIFIED) |
| FR-MSG-27 | Given the invite link page (D-S14), When the app is not on the phone and the site is in launch mode, Then the page gives the App Store link as D-S14 and NS-25 section 4 promise, with the copy steps beneath it; before launch mode it shows no store link; it names no child, no inviter and no letter | NS-25-R6, NS-25 section 4 step 1; D-S14.iphone, D-S14.other-device; new row needed (BL-420 and BL-421 shipped the link shape only) | P1 | web, design | Built page has no store link (`j/page.tsx`, `site.ts:357-370`); `/open` already has the launch-mode rule. Conflict C-5 |
| FR-MSG-28 | Given the invite page, Then it never states or implies whether the invite is valid or expired (the page cannot know); the expiry and the used or revoked lines appear in the app at the peek step (D-S15.error-expired, .error-used, .error-revoked); and the email-link page says only "if the code does not work, send a new email in the app" | NS-25-R18, NS-25-R2; D-S14, D-S15 | P0 (a) (a page that said "valid" would be a false promise) | web, design | G-D12 (`GAP-LOG.md:193`), `DESIGN.md:800`, `site.ts:327` |
| FR-MSG-29 | Given a forwarded, scraped or guessed invite link, Then: the token is only in the fragment so no server, log or cache sees it; `/j` sends no referrer and is noindex; the page and its link-preview card (the picture and text a chat app shows) are the same generic words for every invite and contain no name; the token is hashed, single use, expires in 7 days, and the invite brake alerts (FR-SEC-09, FR-SEC-10, FR-SEC-23); and an unexpected invite gets one line saying to ignore it with a way to write to us | NS-25-R2, R6, R18; D-S14, D-S15, D-S18.undo-open; BL-420, BL-421 | P0 (a) | web, security | `j/page.tsx`, `next.config.ts:57, 113` (no-referrer on token paths; read by grep), `site.ts:368`. Link-preview content not inspected: UNVERIFIED |
| FR-MSG-30 | Given a person who tapped an invite link before installing, When they come back after the install, Then there is one documented path with no tracking: they tap the original link again (the entitlement now opens the app) or use "I was invited" and paste; the app reads the clipboard only after that tap; no install-attribution or fingerprinting tool is used; in a store build while invites are gated the held token is discarded (D-162) | NS-25, NS-39-R14, NS-40-R3; D-S14.copied, D-S15.signed-out; E-S03; new row needed | P1 | mobile, privacy | `site.ts:361-364`; NS-39 edge row (`19-...md:239`); privacy rules in `CLAUDE.md` (no tracking). iOS has no native deferred link and the paste prompt wording is UNVERIFIED |
| FR-MSG-31 | Given any unknown or malformed link or path, Then the app lands on the calm not-found screen and the website shows its own not-found page, never a developer page, a stack or a blank | NS-22-R6; E-S20; BL-383 | P1 | mobile, web | BL-383 (`BACKLOG.md:1152`), `D-S` router `10-...md:247` |

### 4.4 The website as a product surface and the URLs Apple reviews

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-MSG-32 | Given a store submission, Then each of these is live, final and current for the build: Privacy Policy URL (also linked in the app), Support URL with an easy way to contact us, Terms, the Consumer Health Data policy named in the description, the privacy choices URL, and the subscription terms; a script requests each from `packages/brand` and the listing fields, expects 200, no placeholder text, no "draft" banner and the version the build links to | NS-38, NS-42-R13; E-S27; BL-243, BL-364 (new gate row needed) | P0 (b) | ops, web | Guidelines 5.1.1(i), 1.5, 2.1(a) (verified); `app-store-privacy-labels.md:36, 128-129`; `RELEASE.md:210`. A Marketing URL is optional (UNVERIFIED); Terms or licence agreement rule not read |
| FR-MSG-33 | Given the Support URL, Then the page shows the support address, says in one line what we answer and how fast (the figure from FR-MSG-12), and links to the help centre when it exists (FR-SUP-04); it is readable at the largest text size and with VoiceOver | NS-33, NS-38; E-S13; FR-SUP-04, FR-SUP-22; BL-364 | P0 (b) | web, support | Guideline 1.5 (verified); `(legal)/support/page.tsx` and `SupportPage.tsx` (read: the mailto link) |
| FR-MSG-34 | Given the deletion routes, Then one ruling is made (C-3) and then every reference agrees: the in-app Delete account (Guideline 5.1.1(v), verified) is the primary route; a web page that explains deletion and handles a person who lost their phone exists at `/delete-account` or the same words sit in the Privacy Policy with a link from every place that names the path (`brand.web.deleteAccount`, `links.ts`, `delete-account-page.md`, BL-243) | NS-36; C-S20 (delete sheet), D-S18; BL-243, BL-364 | P0 (b) | legal (counsel must confirm), web | BL-243 vs `app-store-privacy-labels.md:37`; `delete-account-page.md:1-60`. Guideline 5.1.1(i) (verified) wants deletion and consent revocation explained in the policy |
| FR-MSG-35 | Given an email that links to a page, Then the page is built before the email ships, or the email is not sent: `/subscription-terms` (billing emails, SUB-10) and `/delete-account/confirm` (deletion-confirm) are the two with a legal effect; `/stop` and the export link follow their own features; a test already fails on an unlisted path | NS-36; D-S18; BL-364, BL-510; `links.ts` `needed` list | P0 (b) | web, mobile | `links.ts:20-48` (read in full); `CATALOG.md:116, 204-210` |
| FR-MSG-36 | Given any page that carries or follows a token (`/auth/*`, `/j`, `/open`, `/stop`, `/delete-account/confirm`), Then it loads no analytics, no third-party script, no font or image from another host, makes no request on load that carries the token, and sends no referrer | NS-41-R16, NS-25-R6; D-S14; BL-364 | P0 (a) | web, privacy | `open/page.tsx` and `j/page.tsx` headers; `next.config.ts:57, 113`; `EMAIL_IDENTITY.md:15` |
| FR-MSG-37 | Given the public pages, Then each meets the accessibility floor of NS-33 (WCAG 2.2 AA, 200 percent text, VoiceOver, Reduce Motion, light and dark) and the web accessibility test covers `/privacy`, `/terms`, `/support`, `/j`, `/open`, `/auth/confirm` and any deletion page | NS-33; FR-CMP-07, FR-A11Y (when written); BL-364 | P1 | web, design | `apps/web/e2e/a11y.e2e.ts` exists (header read); coverage of each path UNVERIFIED |
| FR-MSG-38 | Given a domain, DNS or certificate change, Then a checklist run before and after proves: apex and `www` serve the site, `earlyletters.app` only redirects and cannot send (null MX, `v=spf1 -all`, DMARC reject), CAA allows the site's certificate authority, the registrar lock, 2FA and long auto-renew are on, and a calendar item exists for renewal | NS-41; E-S05; BL-100, BL-368 | P1 | ops, founder | `DOMAINS.md` sections 2 to 4 |

Totals: 38 requirements: 23 at P0, 15 at P1 (FR-MSG-06 is counted at its higher priority).

Related first-wave ids this file relies on and does not repeat: FR-SEC-09, FR-SEC-10, FR-SEC-11, FR-SEC-17, FR-SEC-23 (`risk-security.md`), FR-RSK-05, FR-CMP-07, FR-CMP-13 (`compliance.md`), FR-SUP-04, FR-SUP-07, FR-SUP-22 (`support.md`), FR-PRV-13 (`privacy.md`), FR-OPS-04 (`operations.md`).

---

## 5. Design needs

| Where | Need | FR |
|---|---|---|
| E-S06 (code and verify), states `.help`, `.noAddress` | Order the not-arriving help as in FR-MSG-08, add the Hide My Email hint line, keep the "write to us" row at the same weight; check at AX5 | FR-MSG-08, FR-MSG-03 |
| E-S11 or the Me account section (state to add) | The quiet "We could not reach {email}" row with Fix address; a relay-address variant shows the method, not the address | FR-MSG-05, FR-MSG-07 |
| E-S14 (outage and offline) | Confirm it names that Apple sign-in and the local start stay open when mail or the site is down | FR-MSG-15 |
| D-S14 (invite link page) | Add the App Store button in launch mode above the copy steps, with `.iphone` and `.other-device` both keeping the "ignore it" and write-to-us lines; no expiry wording; decide the link-preview card (generic, no name) | FR-MSG-27, FR-MSG-28, FR-MSG-29 |
| D-S15 (peek) | `.error-expired`, `.error-used`, `.error-revoked` carry all the validity language; add the line for a person who pasted an invite after install | FR-MSG-28, FR-MSG-30 |
| `/open` and `/auth/confirm` (web, no e2e id yet: new screen id needed in area E) | Treat both as designed screens: states installed-fallback, not-installed (store link), Android or computer, fragment dropped, prelaunch | FR-MSG-25, FR-MSG-26, FR-MSG-24 |
| New screen needed (area E): the web not-found page and the website Support, deletion and legal pages | Design, copy and accessibility pass in the same frame as the legal pages | FR-MSG-31, FR-MSG-33, FR-MSG-34, FR-MSG-37 |
| D-S04, D-S06.denied, E-S12.withAsk | No change to design; add the rule that "No" is never asked again | FR-MSG-19, FR-MSG-20 |
| Email templates (`packages/emails`) | A relay-address variant of "why you got this" (FR-MSG-05); the bounce-row string; templates for any new email only after the catalog table (FR-MSG-09) | FR-MSG-05, FR-MSG-07, FR-MSG-09 |

---

## 6. Card changes proposed (for Karma to rule)

| Card row | Change | Why |
|---|---|---|
| NS-41, new rows | Add: sender authentication and relay registration checked before a signing build (FR-MSG-01, 03); bounce receiver and alert (FR-MSG-06); not-arriving help order (FR-MSG-08); site-down and mail-down fallback (FR-MSG-15) | NS-41-R18 states the outcome with no gate or monitor |
| NS-25 section 4 step 1 and new row beside NS-25-R6 | Add "the link page gives the App Store link in launch mode" and "the page never states validity" (FR-MSG-27, 28) | The built page differs from the card (C-5) |
| NS-25 section 12 | Add the sentence that no email is sent to a typed address (FR-MSG-14); drop the `coparent-invite` email from the catalog | Conflict C-2 |
| NS-32 and `CATALOG.md` row `trial-ending-final` | Rule that the "one billing push" is replaced by the local plan notice already in NS-32-R4b, so v1 carries no push (FR-MSG-16) | Conflict C-1; Guideline 4.5.4 and no dormant surface |
| NS-26 | Replace the open list in lines 885 to 896 with the gate list of FR-MSG-17 | One gate list for push |
| NS-38 section 3 | Add the Support URL, Privacy Policy URL, Marketing URL (optional) and privacy choices URL as checked fields (FR-MSG-32) | Apple requires working URLs (2.1(a), verified) |
| NS-36 or NS-41 (one owner) | Name the deletion routes after C-3 is ruled (FR-MSG-34) | Three documents disagree |
| NS-39 section 5 | Add the row "an email link opened with no app installed or a build with no entitlement lands on the web page; the code still works" (FR-MSG-24, 25) | Edge case missing |
| `14-test-plan.md` device table | Add the link matrix of FR-MSG-24 as device rows, and AASA and URL checks as release-gate rows | Device-only facts |

---

## 7. Engineering needs (backlog rows to add or change)

All are "new row needed" unless a row is named. None above BL-999.

| Item | Owner | FR |
|---|---|---|
| Release gate script: AASA, store URLs, DNS and relay registration evidence (extends BL-510, BL-364, BL-368) | ops, web | FR-MSG-01, 23, 32 |
| Resend event receiver in `supabase/functions` with signature check, content-free store, alert; in `DATA_CLASSIFICATION.md` in the same PR | sync | FR-MSG-06, 07 |
| Staging test: does Supabase SMTP surface a suppressed address as an error? | mobile, ops | FR-MSG-08 |
| Test that lists every email template against the catalog table | mobile | FR-MSG-09 |
| Export email copy to `rules.test.ts` if it is still not covered | content | FR-MSG-13 |
| `/j` store link in launch mode; Android line on `/open`; `site.ts` copy updates | web | FR-MSG-26, 27 |
| Web pages: `/subscription-terms`, `/delete-account` and `/delete-account/confirm` (after ruling), `/stop` and `/cancel` when their features ship (BL-364 scope) | web | FR-MSG-34, 35 |
| Runbook "sign-in mail stopped" and renewal calendar | ops | FR-MSG-15, 38 |
| Bounce row in Me account and relay "why you got this" variant | mobile, content | FR-MSG-05, 07 |
| Clipboard paste only on tap, covered by a test (paired with NS-25) | mobile | FR-MSG-30 |
| BL-546 gate list copied into the row | sync | FR-MSG-17 |
| Device-check task for the founder: the link matrix, a relay address, three real inboxes | human | FR-MSG-01, 03, 24 |

---

## 8. Founder and counsel questions (each with a recommended default)

Counsel numbers follow `docs/legal/COUNSEL_PACKET.md` 1.5.0 where one exists (I did not re-open it this session; Q48 and Q54(d) are cited by the cards). New questions need a number from legal.

| # | Question | Who | Default |
|---|---|---|---|
| Q-MSG-1 | Is the live DMARC record still `p=none` with reports to `hello@`, and do we move reports to a `dmarc@` inbox now (C-4)? | founder | Yes: `dmarc@`, stage 1, move on by the clean-report rule |
| Q-MSG-2 | How does the founder reply from `hello@` (which provider), so DMARC and the Apple relay both pass (SECURITY Q4)? | founder | Reply through a provider that signs with a registered domain, or send replies through Resend; register whatever is chosen |
| Q-MSG-3 | Do we send any invite email (C-2)? | founder; counsel must confirm provider and consent effect (needs a number from legal) | No. The parent shares the link from their own messages |
| Q-MSG-4 | Is the one billing push dropped for v1 (C-1)? | founder, Karma | Yes. Local plan notice only; push waits for BL-546 |
| Q-MSG-5 | Deletion page: build `/delete-account` from counsel's draft, or keep the content inside the Privacy Policy (C-3)? | founder, counsel must confirm (needs a number from legal) | Build the page: it is where a person who lost the phone and the `deletion-confirm` email land; the in-app route stays primary |
| Q-MSG-6 | What reply time do we promise at `hello@`? | founder | "Within 2 working days", only if a person reads it each working day |
| Q-MSG-7 | Is a Marketing URL set in App Store Connect, and is it the home page? | founder | Set it to the home page only when the claims are checked (marketing) |
| Q-MSG-8 | Does the email font set stay off (EMAIL_IDENTITY 4.5) and the logo stay inline? | founder | Yes, keep both off to preserve "no request tells us it was opened" |
| Q-MSG-9 | Time Sensitive interruption level for a restore request, when push is reopened | founder, sync | Do not ask for it until NS-08 is live and Apple's rule is read |
| Q-MSG-10 | Is clipboard paste after an invite install acceptable in the invite sheet's words, given iOS shows its own paste prompt (UNVERIFIED)? | founder, privacy | Yes, only on the person's tap, with one line before it |

---

## 9. What I did not do

I did not verify the live state of DNS, Resend, Vercel variables, Apple relay registration or the App Store listing; no file other than this one was changed; I did not run `npm test`, because nothing executable changed. The figures "38 requirements, 23 P0" are my count of the tables above.

## Addendum 20 Nov 2026: photo moments and pictures and videos

Source: `26-founder-direction-photos-library-and-media.md`. Cards NS-51 "Photo moments" and NS-52 "Pictures and videos with a letter" are now in `27-photo-moments-and-media.md` (NS-51-R1 to R42; I read it after drafting, so rows are aligned to it where an "Aligned" note says so). Existing rows are cited, not repeated: NS-01-R22, R23b; NS-32 (one-a-day budget); NS-35 closed start list; NS-48-R5 and RV-2 (kinds kept off the lock screen); NS-49-R1, R2, R4, R20 to R22; NS-50 (one slip slot; R-IA-3 no strip; RV-5, RV-6); FR-MSG-16, 18, 19, 22; FR-NTC-05, 09, 11. No outside source read; Apple limits on notifications and extensions are UNVERIFIED. I am a Claude role.

Principle: add no new class of message and no new place that starts a letter. Every invitation is one more rank in a place that already exists.

### F.1 The map: where the invitation and the nudge appear

| Surface | Moments (NS-51) | Media (NS-52) | Existing home of the rule |
|---|---|---|---|
| Capture cluster, "Start from a photo" (A-S01) | Yes, the newest moment only, as a menu item inside the start (NS-51-R8, R9, R40), no list, no count. Words by `content`; no new Home tile or strip | Attach starts here and on Review | NS-49-R1, R4; NS-50 R-IA-3 |
| Home slip slot (NS-50) | None by default: NS-51-R40 creates no new Home element and R8 offers only the newest moment inside the start menu. A slip rank is an option only if the founder asks (FR-MSG-42) | none | NS-50-R5; NS-51-R8, R40; RV-5, RV-6 |
| Review and letter page (A-S07, B-S08) | none | Add, change, remove media | NS-01 |
| Reminder, lock screen | Existing evening note, existing class and budget; no photo-conditioned note (F.3) | none | NS-32; NS-48-R5; RV-2 |
| Book Photos lens | Never starts anything | Reads only | NS-01-R23b |
| Apple's own suggestion notification | Separate, not ours | none | NS-49-R20 to R22 |
| Widget, share extension, Siri or App Intents, Action Button | Not built in this drop; no donation of any pictures or moments | none | D3; NS-01-R49; NS-04 |
| Email, push | None (no promotional message, no push token) | none | FR-MSG-16, 22 |
| Web pages (invite page, `/open`, AASA) | No change; no media on any page | No media on any link preview | FR-MSG-23 to 30 |

### F.2 Requirements (continue FR-MSG-39 onward)

| Id | Requirement (Given, When, Then) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-MSG-39 | Given the closed list of start paths (NS-35 test), When NS-51 and NS-52 are added, Then the list gains no new start: a moment opens the same capture flow through `startCapture({ source })` with a source value only if the card adds it to the closed list in the same PR, and the navigation test stays green; the Book never starts a letter | NS-51; NS-52; NS-35-R5; NS-49-R2, R4; BL-new (NS-35 test row) | P1 | `mobile` | NS-49-R2 |
| FR-MSG-40 | Given the Photos permission and the notification permission, Then they are never asked in the same sitting, never at first run, never beside the Keep gate or a rating request; the Photos ask follows the parent's own tap on "Show me" with our one sentence before it, "Not now" is final for Home (Me stays), a denied or limited result is never asked again, and limited access counts as success with no nag. The notification ask rule (FR-MSG-19) is unchanged | NS-51; FR-MSG-19, 20; Q-FD-2 pattern; D-S04; new screen needed | P0 (c)(a) | `mobile`; `content` | FR-MSG-19 |
| FR-MSG-41 | Given any reminder or lock-screen text, Then it never states, implies or conditions on the existence, number, content or date of the parent's pictures or videos, and a moment note is planned only at foreground as NS-51-R11 states (an `evening` class source, inside the one a day, skipped for a quiet or hidden book), using the one neutral title and body. The founder's example wording ("Some pictures from the weekend are here") would tell a passer-by that the library holds pictures: this is the card's Q-PM-9; default neutral, and a body that names pictures needs the founder's ruling, counsel's and privacy's read, App lock off and names on, as RV-2 treated last-letter kinds. A note already planned for a date cannot know what the library will hold on that date | NS-51-R11, R12, R25; NS-32; NS-48-R5; RV-2; FR-MSG-18; FR-NTC-05, 09; Q-PM-9 | P0 (a): promise and privacy | `content`; `mobile`; privacy | RV-2; `26-...md` section 2 (nudge never describes pictures) |
| FR-MSG-42 | Given the founder asks for a Home slip for a moment (the card gives none, NS-51-R40), Then there is still exactly one slip on Home among a library day (NS-46), a birthday and the Save a copy slip, and Karma rules the order with these constraints: trust slips first (RV-5), a moment never above Save a copy, at most two showings per moment, a dismissed moment is never shown again, no count, no "unwritten" wording, no thumbnail in the slip, and the slip is gone when the parent has written or spoken any letter that day. Where the app opens, the moment is computed on the phone from dates only (FR-AIS-58) | NS-51; NS-50-R4, R5; RV-5, RV-6; FR-AIS-58, 59 | P1 (P0 (a) for no count, no thumbnail) | `design-systems`; `mobile` | NS-50 |
| FR-MSG-43 | Given the 1.x line forbids a background mode (NS-49-R25) and the app cannot observe the library while closed, Then the moment is evaluated only when the app is open; no background fetch, no processing task, no silent push, no library change observer running in the background is added for NS-51 unless a founder ruling reopens NS-49-R25 with a `security` read, a battery measurement and the App Review reading of the background mode (UNVERIFIED); if reopened, the reminder still carries only neutral words (FR-MSG-41) | NS-51; NS-49-R25; FR-MSG-16; FR-PHS-40 | P0 (b) | `mobile`; `security` | NS-49-R25; PHS section 2 (background tasks run when the system decides, A11 as read there) |
| FR-MSG-44 | Given a proposal for a widget, a share extension (send a picture from the Photos app to the book), Siri or Shortcuts, or a Photos app extension, Then none is built under these cards: each needs its own card with Shown, Records, Never and Decline lines, a data-flow table (a share extension is a second binary that receives a child's picture outside the app), a `security` read and a counsel read; the founder default is no | NS-51; NS-52; NS-04; D3; NS-01-R22, R49 | P0 (b): no dormant surface (2.5.19 as the cards cite it) | Karma; `security` | NS-01-R22 |
| FR-MSG-45 | Given a share of a letter that carries media (NS-05 levels), a link preview, the invite page or any email, Then no picture, video, poster frame, filename or media count appears in the preview, page, email subject or body; what leaves the phone is the parent's own act under X2 and E23, with its own reads; a share of media is never a side effect of attach | NS-05; NS-52; FR-MSG-27 to 30; E23 | P0 (a)(b) | `mobile`; `security`; counsel | Direction section 1 |
| FR-MSG-46 | Given the account-deletion receipt and other transactional mail, Then any line about what was removed names pictures and videos in the parent's words, never a file name, and never says media was removed from places we cannot reach (NS-01-R31); no email is sent about moments, attach or missing media | FR-MSG-09; NS-45; NS-01-R31; FR-LCY-41 | P1 | `content`; `ops` | NS-01-R31 |

### F.3 Design needs

| Where | Need |
|---|---|
| Capture cluster sheet (A-S01 area, new states) | Moments entry inside "Start from a photo"; Photos explainer; limited-access state; denied state silent |
| Home slip (A-S01 slip states) | Moment rank, words only; no thumbnail; "Not now" |
| Me, Reminders (D-S06) | Line that moments do not send reminders; the existing reminder setting unchanged |
| New settings screen in Me (area C) | Moments on, pause, albums that count, remove what the app remembers (shared with the AI addendum) |

### F.4 Card changes proposed (for Karma to rule)

| Card row | Change | Why |
|---|---|---|
| NS-50 section 3 | State that the moment has no Home slip rank (NS-51-R40); add one only on a founder ruling with the constraints of FR-MSG-42 | R-IA-3 conflict (below) |
| NS-48 | Add: no photo-conditioned variant; the `picture` kind stays off the lock screen (RV-2) | FR-MSG-41 |
| NS-32 | Add: moments are not a notification class; the budget counts what it counted | Direction section 2 |
| NS-35 | Add NS-51 and NS-52 to the closed-list test | FR-MSG-39 |

Conflict to rule: the direction wants moments shown "in the capture area"; R-IA-3 refuses a Home strip as a feed. Aligned default (NS-51-R8, R40): inside the start menu only, no strip, no slip; Karma rules.

### F.5 Engineering needs (new rows; none above BL-999 invented)

Closed-list test update; Photos-then-notification sequencing test with an injected state; scan that no notification content takes any library input; moment slip registry entry and showings cap tests; no-background-mode config scan (extends NS-49-R25).

### F.6 Questions, each with a default (who answers)

| Id | Question | To | Recommended default |
|---|---|---|---|
| Q-MSG-11 | The card's Q-PM-9: may a lock-screen line mention pictures? | Founder, privacy, counsel | No; neutral line only; revisit with App lock off and names on |
| Q-MSG-12 | Does a moment get a Home slip at all? | Founder, Karma | No (NS-51-R40); if yes: after the trust slips and the Days ask, never above Save a copy, two showings |
| Q-MSG-13 | The card's Q-PM-8: reopen a background mode for a timely nudge? | Founder, `security` | No in 1.x; moments appear when the app opens |
| Q-MSG-14 | A "send to the book" share extension? | Founder | No |

### F.7 Cannot assess yet

- Whether a library-derived nudge can be timely at all without background work: I did not run it; under the rules above it cannot.
- Whether App Review accepts a note that depends on library content (4.5.4, 5.1.x as the cards cite): not re-read.
- iOS limits on local notification count and timing for this feature: UNVERIFIED (FR-MSG-20 has the same gap).
- Whether the system picker, a share extension or a widget could carry moments with no library permission: not researched; the default is none are built.
- How often a moment would show on a real library: unmeasured.

Totals for this addendum: 8 requirements (FR-MSG-39 to 46): P0 5 (40, 41, 43, 44, 45), P1 3 (39, 42, 46); 4 card changes; 4 questions (Q-MSG-11 to 14).
