# Founder tasks: everything only you can do, in order

Owner: backlog-consolidation PM for the coordinator. Version 1, 3 Oct 2026. Starts **Mon 5 Oct 2026**.
This is the one list. It collects every founder step from `docs/ops/*`, `supabase/APPLY.md`, `docs/analytics/INSIGHTS_LOOP.md` section 4, ADR 0013 to 0017, `docs/DECISIONS.md`, `docs/agents/DEBATES.md`, the five future-backlog files and the agents' reports. Engineering tasks that wait on these are in `docs/BACKLOG.md` (BL-###); dates come from `docs/ROADMAP.md` 2.1.

How to use it:
- Work top to bottom. Each item says **Time** (your hands-on time, then any waiting), **Cost**, **Steps** (the doc with the exact clicks), **By** (the date the 30-day path needs) and **Blocks** (what waits on it).
- Tick the box, then post one line in the claude.ai Project doc `claude/Early-Letters-Coordination.md` ("FT-06 done, Paid Apps Active") so the build thread sees it.
- **Never paste a secret into a chat, an issue, the repo or an email.** Secrets go into the vendor's secret store and your password manager only (`docs/ops/SECURITY.md`).
- Labels: **[A]** our assumption, **[U]** not checked against a vendor page today. Prices marked [U] are what we believe; check the vendor's page before paying.

---

## This week's top 10 (Mon 5 to Fri 9 Oct)

| # | Task | By | Why it is on top |
|---|---|---|---|
| 1 | FT-01 Apple Developer enrolment (individual) | Mon 5 | Every Apple step waits on it, day for day |
| 2 | FT-03 Engage counsel | Tue 6 | The longest pole; sign-off is due Thu 29 Oct |
| 3 | FT-04 Eight decisions (Q-001 host, Q-002 iOS 17, D-069 two parents, D-045 beta cohort, Q-009 beta policy versions, which Supabase project is production, invite link format, email code length) | Wed 7 | Each unblocks an agent or a setup step below |
| 4 | FT-06 Paid Apps agreement, tax and bank | Wed 7 | Plus products do not load in the sandbox without it [U] |
| 5 | FT-10 Supabase staging: apply every migration in APPLY.md order | Thu 8 | Sign-in, sync and deletion tests in week 2 run against it |
| 6 | FT-07 and FT-12 Sign in with Apple key, then Supabase Auth (providers, Resend SMTP, settings) | Thu 8 | Nobody but you can sign in until both are done |
| 7 | FT-08 and FT-09 App Store Connect app record and the two Plus products | Thu 8 | StoreKit sandbox tests in week 2 |
| 8 | FT-16 Pack signing key and the R2 bucket | Fri 9 | The app trusts no remote config, kill switch or language pack until your public key ships in a build |
| 9 | FT-17 Expo account, `eas init`, first development build on a real iPhone | Fri 9 | Week 1's exit: the app records, transcribes and plays on a phone |
| 10 | FT-18 Send counsel the v1.0 package and the question list | Fri 9 | Past about Fri 23 Oct for comments, submission moves |

If the week runs short (it is about 22 hours of work against the 15 to 20 you planned [A]), move these to Mon 12 Oct in this order: FT-15 Google sign-in (cuttable for v1.0, ROADMAP section 4), FT-20 GitHub settings, FT-19 mailing address (counsel can start without it), FT-28 trademark screen.

## Costs at a glance

| Item | Cost | Label |
|---|---|---|
| Apple Developer Program | US $99 a year | Apple's published fee; confirm on the enrolment page |
| Apple commission | 15% with the Small Business Program (30% without) | V (ASC subscriptions doc) |
| Supabase | Pro plan about US $25 a month per project; production needs Pro for daily backups; staging can start on Free | U (TDD 10 section 5) |
| Cloudflare R2 and DNS | about US $0 to $3 a month at our scale (free tier) | V (ADR 0016 section 3) |
| Resend | Free tier for beta volumes | U |
| PostHog | Free up to 1 million events a month | V (05 T5-23) |
| Expo EAS | Free tier to start; a paid plan if build queues are slow | U |
| Google Cloud (sign-in) | US $0 | A |
| Counsel | Low five figures for about ten documents (estimate, TDD 10 section 5); ask for a fixed fee | A |
| Trademark | US $0 for a knockout search; filing is per class (believed about US $350 per class) | U |
| Native-speaker reviewers | v1.0 spot check about US $1,000 to $1,500; full programme about US $5,000 to $8,000 (CVL-02) | E |
| Test iPhones, if you need to buy | used iPhone SE (3rd gen) about US $150 to $250; used iPhone 12 about US $250 to $350 | A |
| Mailing address for legal documents | PO box or a mail service, about US $10 to $30 a month | A |
| Domains | Porkbun renewals; consider five years ahead | U |

## Hours by week [A]

| Week | Your hours | Note |
|---|---|---|
| 1 (5 to 11 Oct) | about 22 | Over plan: see the "if short" order above |
| 2 (12 to 18 Oct) | about 26 | Device spikes are about 10 of these. Anyone you trust can run the device scripts with you; only consoles, money and legal must be you |
| 3 (19 to 25 Oct) | about 10 | C1 triage 15 minutes a day |
| 4 (26 Oct to 1 Nov) | about 14 | Release-candidate checks and the listing |
| 5 (2 to 6 Nov) | about 2, plus answering App Review within a day | |

---

## Week 1: Mon 5 Oct to Sun 11 Oct

- [ ] **FT-01 Apple Developer Program enrolment (individual), and accept the latest agreements**
  - Time: 45 minutes, then Apple's identity check (often a day or two for individuals [A]; it can take longer, and nothing Apple-side can start before it).
  - Cost: US $99 a year.
  - Steps: enrol at developer.apple.com/programs/enroll with your two-factor Apple Account as an **individual** (D-004, D-064). Your legal name becomes the seller name on the App Store (D-004 point 1). An individual account can publish this app and future apps. When Active, accept the latest Program License Agreement in the developer account.
  - By: Mon 5 Oct (ROADMAP section 3).
  - Blocks: FT-06 to FT-09, FT-17, FT-25; BL-101, BL-102, BL-103, BL-053, BL-108, BL-280.

- [ ] **FT-02 Password manager and two-factor on every console**
  - Time: 1.5 hours across the week (do each one as you create the account).
  - Cost: US $0.
  - Steps: `docs/ops/SECURITY.md` section 3 "Consoles": Apple Developer and App Store Connect, Supabase (organisation MFA on), Vercel, Porkbun, Resend, PostHog, GitHub, Expo, Google Cloud, Cloudflare, the password manager. An authenticator app or a security key, never SMS where avoidable; recovery codes offline. Never use an `@earlyletters.com` address as the login for Porkbun, Apple or Supabase (`docs/ops/DOMAINS.md` section 9).
  - By: as each account is made; all done Fri 9 Oct.
  - Blocks: BL-106 evidence (LEGAL-REQ-026).

- [ ] **FT-03 Engage counsel**
  - Time: 2 hours (calls, engagement letter).
  - Cost: low five figures for the v1.0 package [A]; ask for a fixed fee and a turnaround date.
  - Steps: book a privacy and consumer-protection lawyer who can do California auto-renewal law, Washington's My Health My Data Act and COPPA questions. Tell them the timeline: package Fri 9 Oct, comments by Fri 23 Oct, sign-off Thu 29 Oct. Legal-alignment is preparing the packet in `docs/legal/`; BL-104 lists the questions.
  - By: Tue 6 Oct.
  - Blocks: FT-18, FT-33, FT-41, the legal pages, submission.

- [ ] **FT-04 Eight decisions (about 10 minutes each, all written into the Project doc)**
  - Time: 1.5 hours to read and answer.
  - Cost: US $0.
  - Steps and recommendations:
    1. **Q-001 pack and model hostname** (`docs/agents/DEBATES.md`; ADR 0016 section 8): recommended `packs.earlyletters.app` (only the redirect domain moves to Cloudflare; email DNS for .com stays at Porkbun). Unblocks FT-16 and BL-337.
    2. **Q-002 minimum iOS**: recommended **iOS 17** (Apple's subscription screen needs it; D-040). Unblocks BL-336.
    3. **D-069 at most two parents per book**: recommended yes; db-followup is building it now (BL-331).
    4. **D-045 beta cohorts**: recommended C0 (your family) then C1 (15 to 25 friendly families) before submission; the public TestFlight link only after.
    5. **Q-009 policy versions for the beta**: recommended option (a): publish today's drafts as version 0.9.0 for testers, then 1.0.0 after counsel with re-consent. Unblocks BL-338 and FT-23.
    6. **Which Supabase project is production** (D-041, BL-107): recommended a **clean new `scribe-prod`** built only from migrations, and turn today's `early-letters` (two files applied, your data only) into staging, or make a fresh `scribe-staging` and keep `early-letters` only as an archive. If you prefer to keep `early-letters` as production, APPLY.md works on it as written.
    7. **Invite link format** (security review M2, BL-348): recommended moving the token into the fragment (`https://earlyletters.com/i#t=<token>`), so no server log or link-preview service ever sees it; the Privacy Policy already says so. The alternative is to keep `/i/<token>` and change the policy line.
    8. **Email sign-in code** (security review M4): the review recommends 8 digits and a 15-minute life (today 6 digits, one hour, as PRD A and the email template say). If you agree, the dashboard (FT-12), `EXPO_PUBLIC_EMAIL_OTP_LENGTH` (FT-17) and the email template wording change together.
  - By: Wed 7 Oct (ROADMAP asks Q-001 and Q-002 by Fri 9; earlier saves a day on FT-10 and FT-16).
  - Blocks: FT-10, FT-16, FT-23; BL-331, BL-336, BL-337, BL-338, BL-348.

- [ ] **FT-05 Porkbun account security**
  - Time: 30 minutes.
  - Cost: renewal fees only (consider renewing both domains five years ahead).
  - Steps: `docs/ops/DOMAINS.md` section 2: two-factor; account email not on these domains; API access off; registrar lock on; auto-renew on with a valid card; WHOIS privacy on; ICANN verification done. DNSSEC: turn on for earlyletters.com now if its DNS stays at Porkbun; for earlyletters.app wait for FT-16 if it moves to Cloudflare.
  - By: Tue 6 Oct.
  - Blocks: the safety of every sign-in link, invite and email.

- [ ] **FT-06 Paid Apps agreement, tax and bank (Account Holder only)**
  - Time: 45 minutes, then Apple's bank and tax checks (a day or more).
  - Cost: US $0.
  - Steps: `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 1: App Store Connect > Business > Agreements > Paid Apps > View and Agree; add bank account; complete the US tax form (W-9 for a US person [U]) in your legal name exactly as on the developer account; wait for **Active**.
  - By: Wed 7 Oct (ROADMAP).
  - Blocks: FT-09 sandbox purchases, FT-29 Small Business Program, the Plus device checks (BL-222), submission with in-app purchases.

- [ ] **FT-07 Apple identifiers, Team ID, Sign in with Apple key and email relay**
  - Time: 45 minutes.
  - Cost: US $0.
  - Steps: `docs/ops/AUTH_SETUP.md` 2.1 (App ID `com.earlyletters.scribe` with Sign in with Apple and Associated Domains; also `.preview` and `.dev`), 2.2 (note the 10-character Team ID), 2.4 (create the **Sign in with Apple key**, download the `.p8` **once**, store it with the Key ID and Team ID in the password manager; `docs/ops/SECURITY.md` section 5: one key serves sign-in and token revocation), 2.5 (Sign in with Apple for Email Communication: domain `earlyletters.com`, address `hello@earlyletters.com`). Skip the Services ID (2.3) until web or Android sign-in. Give the Team ID to the website thread so it replaces `<TEAMID>` (six places) in `docs/ops/well-known/apple-app-site-association`.
  - By: Thu 8 Oct (ROADMAP).
  - Blocks: FT-11 Apple secrets, FT-12 Apple provider, FT-15 Google iOS clients, FT-17 builds, FT-31 universal links; BL-330.

- [ ] **FT-08 App Store Connect app record**
  - Time: 30 minutes.
  - Cost: US $0.
  - Steps: App Store Connect > Apps > New App: iOS; name `Early Letters: Memory Book` (`docs/store/app-store.md`); primary language English (U.S.); bundle ID `com.earlyletters.scribe`; SKU of your choice; category **Lifestyle** (never Health or Medical, D-004 point 4). If the name is taken, stop and tell the coordinator (it is also a trademark signal, FT-28).
  - By: Thu 8 Oct (ROADMAP).
  - Blocks: FT-09, FT-15 (App Store ID for the Google iOS client), FT-25 TestFlight; BL-103.

- [ ] **FT-09 The two Plus products**
  - Time: 1 hour (plus the review screenshot later, from a build).
  - Cost: US $0.
  - Steps: `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` steps 3 to 7 and 9: group `Plus`; `plus.monthly` US $3.99 with a free 1-month introductory offer; `plus.annual` US $29.99 with a free 2-month offer; both at the same level; descriptions say only what v1.0 has; **Family Sharing on** for both (cannot be undone); Billing Grace Period 16 days, all renewals, production and sandbox; United States only; three sandbox testers. Do **not** create an App Store Server Notifications URL, an In-App Purchase key or a RevenueCat account (D-053). The old `el_plus_*` ids in earlier docs are superseded.
  - By: Thu 8 Oct (ROADMAP).
  - Blocks: the StoreKit sandbox spike in week 2, BL-222, submission (the first subscription goes in with the app version, step 8).

- [ ] **FT-10 Supabase staging: create, apply, configure**
  - Time: 3 hours.
  - Cost: Free plan or about US $25 a month for Pro [U].
  - Steps, in this order:
    1. Create the staging project in a US region (the live one is us-west-1), organisation MFA on.
    2. On your Mac: `npm install` then `npm run test:db`; every file must pass (`supabase/APPLY.md` "Before you start").
    3. Apply files 3 and 4 and run the checks (APPLY steps 1 to 5).
    4. **Set the consent pepper before anything else runs** (APPLY step 6): `openssl rand -hex 32`, store it in the password manager, never change it. (Today an empty pepper is silently accepted; BL-334 will make that an error.)
    5. Schedule `scribe-purge-due` (APPLY step 7).
    6. Publish the beta policy versions per your Q-009 answer and record your own acceptances (APPLY step 8; see FT-23 for production).
    7. Apply files 5, 6 and 7, run the checks and validations (APPLY steps 9, 10, 12).
    8. Apply files 8 to 11 in filename order, then db-followup's `20261005*` file(s) from the section it appends to APPLY.md (APPLY step 14).
    9. Settings (APPLY step 15 and `docs/ops/SECURITY.md` section 4): exposed schemas `public` only, `scribe-sync-housekeeping` cron, GraphQL off, Realtime off, SSL enforced, network restrictions, PITR off, backups present, **spend cap on during beta** (T5-23). Confirm statement logging is off (`log_statement` none, no `log_min_duration_statement`), so letter text sent to `sync_push` never reaches Postgres logs (security review section 8; ask Supabase support if the dashboard does not show it).
    10. Tell the coordinator which files you applied, so the same PR adds them to `.github/migrations-applied.txt`.
  - By: Thu 8 Oct (ROADMAP).
  - Blocks: FT-11, FT-12, every week-2 sign-in, sync and deletion spike; BL-015, BL-107.

- [ ] **FT-11 Supabase secrets and functions (staging)**
  - Time: 1 hour.
  - Cost: US $0.
  - Steps: `docs/ops/SECURITY.md` section 1.1 and `docs/ops/README.md` "Going live" steps 3 to 6: set `PURGE_WORKER_SECRET` (`openssl rand -hex 32`), `RESEND_API_KEY` (a **second** sending-only key, not the SMTP one, FT-13), `POSTHOG_PERSONAL_API_KEY` (scope `person:write` only) and `POSTHOG_PROJECT_ID` (after FT-24; the worker runs without them until then), `APPLE_TEAM_ID`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_PRIVATE_KEY` (whole `.p8`), `TOKEN_KEK_V1` (`openssl rand -base64 32`). Deploy `purge-worker` (with `--no-verify-jwt`) and `analytics-forget`; run `supabase/cron/purge-worker.sql` with its three placeholders (it fills Vault); check after 20 minutes (`docs/ops/runbooks/purge-failing.md`). Deploy `config` and `content` after FT-16 (ADR 0016 section 7).
  - By: Thu 8 Oct for staging.
  - Blocks: deletion end to end (BL-234, BL-238), Apple token revocation (BL-330).

- [ ] **FT-12 Supabase Auth: providers, SMTP, settings**
  - Time: 1.5 hours.
  - Cost: US $0.
  - Steps: `docs/ops/AUTH_SETUP.md` in order: section 1 (sign-ups on, manual linking on, anonymous sign-ins **off**, confirm email on, JWT expiry 900 s); 2.6 (Apple provider: client IDs `com.earlyletters.scribe,com.earlyletters.scribe.preview,com.earlyletters.scribe.dev`, no secret for native); 3.4 (Google provider after FT-15: web client id first, then iOS ids, web secret, **Skip nonce check on**); 4.2 (custom SMTP: `smtp.resend.com`, port 465, user `resend`, password = the SMTP key from FT-13, sender `hello@earlyletters.com`, 60-second interval); 4.3 (email rate limit about 100 an hour for TestFlight); 4.4 (OTP expiry 3600, length 6); 5.1 (site URL `https://earlyletters.com`; redirect URLs exactly `https://earlyletters.com/auth/callback` and `scribe://auth/callback`); 6 (paste `supabase/templates/magic_link.html` into both Confirm signup and Magic Link, subject `Your sign-in link for Early Letters`). Leave Passkeys and CAPTCHA off for now.
  - By: Thu 8 Oct (ROADMAP).
  - Blocks: all sign-in (AUTH_SETUP 11 device checks), C0 and C1; BL-053.

- [ ] **FT-13 Resend: tracking off, keys, DMARC, aliases**
  - Time: 45 minutes.
  - Cost: free tier [U].
  - Steps: `docs/ops/AUTH_SETUP.md` 4.1 and `docs/ops/DOMAINS.md` sections 3 and 9: confirm `earlyletters.com` is **Verified**; **click tracking off and open tracking off** (our emails promise no tracking; click tracking also breaks the sign-in link); create two sending-only keys, `supabase-auth-smtp` (for FT-12) and one for the purge worker (FT-11); add receive-only aliases `privacy@`, `security@`, `dmarc@` forwarding to you (until `privacy@` exists the policies must say `hello@`). Accept Resend's DPA and save the PDF (FT-30).
  - By: Fri 9 Oct (ROADMAP).
  - Blocks: magic-link deliverability, deletion receipts, the privacy contact in the legal pages.

- [ ] **FT-14 Porkbun DNS records**
  - Time: 1 hour, plus propagation.
  - Cost: US $0.
  - Steps: `docs/ops/DOMAINS.md` sections 3 and 4, then run the checks in section 11. For .com: Vercel A and `www` CNAME (values from the website thread's Vercel card), Resend `send` MX and SPF, `resend._domainkey` DKIM, root MX for receiving, root SPF, DMARC (start `p=none` with `rua=mailto:dmarc@earlyletters.com`, then the staged plan in section 3), CAA (`letsencrypt.org`, `issuewild ";"`, `iodef`). For .app: Vercel redirect records, null MX, `v=spf1 -all`, DMARC reject, CAA. If Q-001 moves .app to Cloudflare, enter the .app records there instead (FT-16).
  - By: Fri 9 Oct (ROADMAP), website records before FT-31.
  - Blocks: email deliverability, the website and universal links, spoofing protection for .app.

- [ ] **FT-15 Google sign-in clients** (cuttable for v1.0: Apple and email alone meet guideline 4.8, ROADMAP section 4)
  - Time: 1 hour, plus Google's brand verification if it asks (days [A]).
  - Cost: US $0.
  - Steps: `docs/ops/AUTH_SETUP.md` section 3: Google Cloud project `early-letters` (two-factor); Google Auth Platform branding (name, `hello@earlyletters.com`, home, privacy and terms URLs, authorized domain `earlyletters.com`), audience External and **Publish app**, scopes `openid`, email, profile only; a **Web** client (redirect `https://<project-ref>.supabase.co/auth/v1/callback`; copy id and secret); an **iOS** client per bundle id (Team ID from FT-07, App Store ID from FT-08); then FT-12 section 3.4 and the EAS variables in FT-17.
  - By: Thu 8 Oct (ROADMAP).
  - Blocks: Google sign-in only.

- [ ] **FT-16 Cloudflare R2 bucket, packs hostname and the pack signing key (Q-001)**
  - Time: 2.5 hours, plus DNS propagation.
  - Cost: about US $0 to $3 a month.
  - Steps:
    1. Cloudflare account with two-factor; accept the DPA (FT-30).
    2. If Q-001 is `packs.earlyletters.app`: add the earlyletters.app zone (Free plan), recreate every .app record from `docs/ops/DOMAINS.md` section 4 (keep Vercel records DNS-only), add Cloudflare's CA to CAA, switch .app's nameservers at Porkbun, turn on DNSSEC in Cloudflare and paste the DS record at Porkbun (DOMAINS section 6 option A, applied to .app).
    3. R2 bucket `early-letters-packs`, public through the custom domain, plus a Cache Everything rule (ADR 0016 section 3.3).
    4. **Signing key, once:** `npx tsx scripts/packs/keygen.ts`. Put the **secret** only in the password manager (never CI, EAS, Supabase or a chat). Send the coordinator the **public key line** for `packages/api/src/keys.ts` (BL-335); it must be in the first TestFlight build.
    5. After that build exists: load `EL_SIGNING_KEY` and `EL_SIGNING_KEY_ID` in your shell, run `npx tsx scripts/packs/publish.ts all`, then run the upload and deploy commands it prints (`wrangler` up to 300 MB, `rclone` above; `supabase functions deploy config` and `content`). Upload the Hindi small model too (ADR 0015 section 9 item 2), so the catalog can mark it hosted (BL-337).
  - By: Fri 9 Oct for steps 1 to 4 (ROADMAP: Q-001 by Fri 9); step 5 by Tue 13 Oct.
  - Blocks: kill switches in C1 (LEGAL-REQ-040), every non-English language pack and the Hindi model on a phone, server prompts and tips; BL-335, BL-337.

- [ ] **FT-17 Expo account, `eas init`, build variables and the first development build**
  - Time: 2 hours, plus build queue time.
  - Cost: free tier to start [U].
  - Steps: create the Expo account (two-factor); `cd apps/mobile && npx eas-cli login && npx eas-cli init`; send the coordinator the `projectId` (BL-339; `app.config.ts` is dynamic, so it is committed by an agent). Set EAS environment variables per profile (`docs/ops/AUTH_SETUP.md` section 8): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable key only, never the service key), `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (the client for that profile's bundle id), `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` (after FT-24), `EXPO_PUBLIC_EMAIL_OTP_LENGTH=6`. Register your phones (`npx eas-cli device:create`), then `npx eas-cli build --profile development --platform ios` with EAS-managed credentials. Install and record one letter.
  - By: Fri 9 Oct (ROADMAP week 1 exit).
  - Blocks: every device test (FT-22), store screenshots (BL-340), TestFlight (FT-25); BL-030, BL-108.

- [ ] **FT-18 Send counsel the v1.0 package and the question list**
  - Time: 1 hour.
  - Cost: inside FT-03.
  - Steps: send what legal-alignment prepares in `docs/legal/` (its `COUNSEL_PACKET.md` lists the numbered questions; Terms 1.5.0, Privacy Policy 1.4.0, Subscription Terms 1.4.0 and in-app disclosures 1.4.0 are already aligned, the Consumer Health Data notice is next) with these questions: Q-003 subscription notices (`docs/legal/memos/q-003-subscription-notices.md` is the default position unless counsel objects by Fri 23 Oct; the app work is BL-342 in v1.0); Q-004 and Q-005 (analytics language code, privacy label "linked"); Q-009 (beta policy versions); D-050, D-039, D-042; guideline 5.1.1(ix) as an individual (D-004); AB 1043 and Texas SB 2420 from 1 Jan 2027 (T5-15); the Hindi model's training-data terms (ADR 0015 section 9); the "we never make a voice" wording (CVL-04); whether native-speaker reviewers are processors (CVL-02); the "If you are struggling" wording. Note for counsel: Plus in v1.0 adds only Read together after 3 free sessions per book and books for more children (Terms 14.1 and the Subscription Terms must not list backup or themes).
  - By: Fri 9 Oct (ROADMAP).
  - Blocks: FT-33, FT-41, submission.

- [ ] **FT-19 Mailing address for legal documents**
  - Time: 30 minutes.
  - Cost: about US $10 to $30 a month [A].
  - Steps: a PO box or a mail service that is not your home (D-004 point 1). The Terms, Privacy Policy and any commercial email need a postal address; counsel confirms per notice. Give it to legal-alignment through the coordinator (never in `packages/brand`; only legal documents carry it).
  - By: Fri 9 Oct, so the counsel package is complete.
  - Blocks: final legal text (FT-41).

- [ ] **FT-20 GitHub: branch protection and labels**
  - Time: 15 minutes.
  - Cost: US $0.
  - Steps: protect `develop` and `main` requiring the CI `required` job; labels `inbox`, `bug`, `idea`, `beta`, `S0` to `S3`, `approve-migration`; keep unattended agent runs paused for `supabase/**` and auth until this is on (D-041).
  - By: Fri 9 Oct.
  - Blocks: BL-005, BL-122; lets scheduled agents take more of the backlog safely.

---

## Week 2: Mon 12 Oct to Sun 18 Oct

- [ ] **FT-21 The 14 test recordings and the Mac experiment**
  - Time: 1.5 hours (ideally Sat 10 or Sun 11 Oct), plus 20 minutes of setup and downloads.
  - Cost: US $0.
  - Steps: `experiments/README.md`: record clips 1 to 14 in Voice Memos (names, Hindi-English, three real letters, 30 seconds of white noise with nobody talking), AirDrop to `experiments/recordings/`, fill `config.local.json`, `./experiments/setup.sh`, `npm run experiment`, optionally the two Hinglish models. Share `report.md` and your `review.md` choices with the build thread. Recordings never leave your Mac.
  - By: Wed 14 Oct.
  - Blocks: the default model tier per phone, D-031 (Hindi script, due Fri 30 Oct), CVL-01's v1.1 gate; BL-043.

- [ ] **FT-22 Device spikes on real iPhones**
  - Time: about 10 hours across the week (a trusted helper can run the scripts with you).
  - Cost: devices if you need them (see costs).
  - Devices: iPhone SE (3rd gen) as the reference, one 6 GB phone (an iPhone 12 or 13), a current iPhone; two phones for co-parent and Family Sharing tests.
  - Steps (qa-e2e is writing the scripts in `docs/qa/`; until then use these):
    1. Transcription per language on the SE 3: time to transcript, memory, heat (BL-043 device part; ROADMAP section 4 says what to cut if a language is too slow).
    2. StoreKit sandbox checks D-1 to D-12 (`docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11) on a TestFlight or production-profile build.
    3. Sign-in checks 1 to 6 and 8 (`docs/ops/AUTH_SETUP.md` section 11): Apple, Google, email link and code, scheme fallback, invite, offline, revocation.
    4. Two-phone co-parent sync: a letter on one phone visible on the other (BL-177).
    5. Deletion end to end on staging, then `scripts/ops/verify-deletion.ts` (`docs/ops/runbooks/stuck-deletion.md` section 5).
    6. Kill during save, 500 times (BL-135), and the data-protection checks (BL-245).
    7. App Thinning size report under 40 MB (`docs/ops/APP_SIZE.md`; `npx tsx scripts/size/measure.ts --thinning-report ...`).
  - By: Fri 16 Oct (ROADMAP week 2).
  - Blocks: C1, the per-language go/no-go (FT-34), the release candidate; BL-030, BL-043, BL-044, BL-135, BL-177, BL-222, BL-245.

- [ ] **FT-23 Supabase production**
  - Time: 3 hours.
  - Cost: about US $25 a month (Pro, for daily backups) [U].
  - Steps: everything in FT-10 and FT-11 again on production (your FT-04 choice), with a **new** pepper, new secrets and the production policy versions (Q-009: 0.9.0 beta text, URLs served by the website). Then sign in from the C0 build and accept the sheets yourself. Production gets no fixture data except the reviewer demo account later (BL-341).
  - By: Tue 13 Oct (C0 on Wed 14 is your family's real letters).
  - Blocks: C0, C1; BL-015, BL-338.

- [ ] **FT-24 PostHog project and keys**
  - Time: 45 minutes.
  - Cost: US $0 (free tier).
  - Steps: create the US Cloud project "Early Letters" (two-factor); copy the **project API key** into EAS (`EXPO_PUBLIC_POSTHOG_KEY`, host `https://us.i.posthog.com` [U: confirm the ingestion host PostHog shows]); create a **personal API key with `person:write` only** for `analytics-forget` (FT-11); create a **separate personal key with Query Read only** for the weekly insights run and keep it for FT-49 (`docs/analytics/INSIGHTS_LOOP.md` section 4); turn off session replay and autocapture extras; data retention 12 months; a billing limit; accept the DPA (FT-30).
  - By: Tue 13 Oct, if analytics is on in the beta build.
  - Blocks: opt-in analytics in C1, the analytics deletion step, the insights loop; BL-250 in a real build.

- [ ] **FT-25 TestFlight C0, then Beta App Review**
  - Time: 2 hours.
  - Cost: US $0.
  - Steps: upload the first preview or production-profile build (`npx eas-cli build --profile production` then `npx eas-cli submit`); add your family as internal testers (C0; internal testers do not need Beta App Review). Fill TestFlight test information (what to test, feedback email `hello@earlyletters.com`, privacy policy URL [U: ASC asks for it for external testing], a sign-in note for the reviewer). Submit the build for **Beta App Review** for the external C1 group. Never call it "beta" in store text; the in-app "early version" note stays (D-060).
  - By: C0 Wed 14 Oct; Beta App Review submitted Thu 15 Oct (ROADMAP: C1 invites go out Mon 19 Oct).
  - Blocks: C1 (FT-32); BL-280.

- [ ] **FT-26 Recruit the C1 families**
  - Time: 3 hours.
  - Cost: US $0 (consider a thank-you: a free year of Plus by offer code once the app is live, G-16).
  - Steps: 15 to 25 families: two or more co-parent pairs, at least one Hindi and one Spanish speaker, someone in another v1.0 language, one VoiceOver or large-text user, one set of twins (BL-109, D-045). Tell them it is pre-release, that letters stay on their phone and in their own backup, and that they can export any time.
  - By: Fri 16 Oct (ROADMAP).
  - Blocks: C1 (FT-32).

- [ ] **FT-27 Native-speaker reviewers**
  - Time: 3 hours (recruiting, a contractor agreement, a research consent).
  - Cost: v1.0 spot check about US $1,000 to $1,500 [E: six languages, about 3 hours each]; the full programme about US $5,000 to $8,000 (CVL-02).
  - Steps: for v1.0, one reviewer per non-English language (Hindi, Spanish, Mandarin, French, Arabic, Portuguese) reads 10 scripted recordings' transcripts and says pass or fail for script, punctuation and names (they see tables and our scripted test text, never user content). Then the full CVL-02 programme (13 reviewers, two per language, Arabic three) signs off the word tables for v1.1. Agreement: confidentiality, IP assignment, no access to user data; counsel confirms they are not processors (FT-18).
  - By: recruited Fri 16 Oct; spot-check results Fri 23 Oct.
  - Blocks: FT-34 (which languages the listing names), CVL-01, CVL-03 and invite translations in v1.1 and v1.2.

- [ ] **FT-28 Trademark knockout search ("Early Letters")**
  - Time: 2 hours.
  - Cost: US $0 for the search; counsel's opinion if anything turns up (FT-35).
  - Steps: compliance register CR-122 and `docs/backlog/future/04-growth-monetisation.md` G-02: search the USPTO trademark search for "EARLY LETTERS" and close variants in classes 9 (software), 42 (online services), 16 (printed books, for later print) and 41 (education, where the phonics apps sit); search the App Store for the name; note any live mark in those classes. If clear, decide whether to file (per class [U]).
  - By: Fri 16 Oct.
  - Blocks: submission under this name (CR-122: before store submission); a rename after launch costs reviews and links.

- [ ] **FT-29 Small Business Program**
  - Time: 10 minutes, after FT-06 is Active.
  - Cost: US $0 (commission 15% instead of 30%).
  - Steps: `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 2. The 15% rate starts 15 days after the end of Apple's fiscal month in which you are approved, so enrol in October.
  - By: Fri 16 Oct (latest Fri 30 Oct).
  - Blocks: margin only.

- [ ] **FT-30 Vendor DPAs and evidence**
  - Time: 1 hour.
  - Cost: US $0.
  - Steps: accept and save dated PDFs of the DPAs for Supabase, PostHog, Resend, Cloudflare and Expo; screenshots of two-factor on every console and PostHog's 12-month retention; Supabase's encryption at rest in writing (BL-106; LEGAL-REQ-022(c), -028). Keep them outside the repo.
  - By: Fri 16 Oct.
  - Blocks: counsel's and the privacy label's evidence trail.

- [ ] **FT-31 Website: legal pages and well-known files live** (built by the website thread; you approve the text going public)
  - Time: 1 hour to review.
  - Cost: inside Vercel's plan.
  - Steps: `/terms`, `/privacy`, `/health-privacy`, `/subprocessors` with the beta text at versioned URLs (Q-009), `/delete-account` (static, D-042), `/.well-known/apple-app-site-association` with your Team ID, `/.well-known/security.txt` **without** the `Policy` line until `/security` exists (`docs/ops/DOMAINS.md` section 8), no logging or analytics under `/i/` and `/auth/`, and `Referrer-Policy: no-referrer` on both (security review M2). Check with the `curl` lines in DOMAINS section 11 and Apple's CDN view in AUTH_SETUP 5.2.
  - By: Wed 14 Oct (testers tap Terms and Privacy from the first sheet; ROADMAP's Mon 19 Oct is too late for Beta App Review).
  - Blocks: universal links (email sign-in, invites), Beta App Review, Google branding, App Review; BL-243.

---

## Week 3: Mon 19 Oct to Sun 25 Oct

- [ ] **FT-32 Start C1 and triage daily**
  - Time: 15 minutes a day, plus 1 hour on Monday.
  - Cost: US $0.
  - Steps: when Beta App Review passes, invite the C1 group by email; read TestFlight feedback and crashes daily; file issues with `beta` and `S0` to `S3` labels. Exit criteria for Thu 29 Oct (ROADMAP): no open S0 or S1, crash-free sessions 99.8% or more, no fidelity complaint traced to an engine edit, the co-parent flow done without help.
  - By: Mon 19 Oct (ROADMAP).
  - Blocks: FT-40.

- [ ] **FT-33 Counsel's comments back and answered**
  - Time: 3 hours.
  - Cost: inside FT-03.
  - Steps: get comments by Fri 23 Oct; send them to legal-alignment through the coordinator; decide anything counsel leaves to you (Q-003 path, Q-005 linked or not linked).
  - By: Fri 23 Oct (ROADMAP: past 23 Oct, submission moves).
  - Blocks: FT-41.

- [ ] **FT-34 Per-language go or no-go**
  - Time: 1 hour.
  - Cost: US $0.
  - Steps: from FT-22's device numbers and FT-27's spot checks, decide for each of the seven languages: ship, ship on the smaller model, or hold for a pack update (ROADMAP section 4). The listing names only shipping languages (`docs/store/app-store.md` checklist; D-056 effects).
  - By: Fri 23 Oct.
  - Blocks: the listing (FT-43).

- [ ] **FT-35 Trademark opinion, only if FT-28 found something**
  - Time: 30 minutes.
  - Cost: counsel time.
  - Steps: send counsel the knockout results (FT-28) and ask for a go, a rename, or a coexistence view.
  - By: Fri 23 Oct.
  - Blocks: submission under this name.

- [ ] **FT-36 Check the "If you are struggling" resources**
  - Time: 15 minutes.
  - Cost: US $0.
  - Steps: confirm the 988 Lifeline and Postpartum Support International entries in `packages/content/src/strings.en.ts` (`struggling`) are current on their own sites; counsel sees the wording in the package (D-059: the classifier waits for v1.1 and a clinician).
  - By: Fri 23 Oct.
  - Blocks: submission (an inaccurate support line is a trust and legal problem).

- [ ] **FT-37 Insurance quotes (optional)**
  - Time: 1 hour.
  - Cost: quotes are free; premiums [U].
  - Steps: tech errors and omissions plus cyber, priced for an individual publisher holding children's and health-adjacent data (D-004 point 2).
  - By: Fri 23 Oct.
  - Blocks: nothing; reduces personal exposure.

- [ ] **FT-38 Review store screenshots from the release build**
  - Time: 1.5 hours.
  - Cost: US $0.
  - Steps: the content agent regenerates the six frames from a preview build (`scripts/brand/screenshots.mts`, `capture-store.cjs`; BL-340); check they show only shipping features and languages, no real family data.
  - By: Fri 23 Oct (draft), final in FT-43.
  - Blocks: FT-43.

---

## Week 4: Mon 26 Oct to Sun 1 Nov

- [ ] **FT-39 Release-candidate device checks**
  - Time: 6 hours.
  - Cost: US $0.
  - Steps: feature freeze is Mon 26 Oct (coordinator). On the release candidate: device budget check on the SE 3 (BL-044); kill during save 500 times (BL-135); StoreKit D-1 to D-12 again (BL-222); the durability drill: iCloud device backup then restore to a second phone, export ZIP and re-read, sign in on a new phone and re-download text (BL-284); size under 40 MB; a staging restore drill if time allows (BL-247, `docs/ops/runbooks/restore-drill.md`). Sign the evidence with date and build number (qa-e2e's template in `docs/qa/`).
  - By: Thu 29 Oct.
  - Blocks: FT-44.

- [ ] **FT-40 C1 exit review**
  - Time: 1 hour.
  - Cost: US $0.
  - Steps: check the exit criteria in FT-32; anything S0 or S1 open means no submission.
  - By: Thu 29 Oct (ROADMAP).
  - Blocks: FT-44, FT-45.

- [ ] **FT-41 Counsel sign-off; publish legal pages and the 1.0.0 policy versions**
  - Time: 2 hours.
  - Cost: inside FT-03.
  - Steps: receive written sign-off; the website publishes the final text at the versions the app links to; insert the 1.0.0 `policy_versions` rows in production (major change with re-consent from the 0.9.0 beta, per Q-009; `supabase/APPLY.md` step 8.2 and `docs/legal/POLICY_VERSIONING.md`).
  - By: Thu 29 Oct (ROADMAP).
  - Blocks: FT-43, FT-45.

- [ ] **FT-42 D-031 Hindi script default**
  - Time: 30 minutes.
  - Cost: US $0.
  - Steps: decide Devanagari, Roman or automatic from FT-21 and FT-27; the default if you do not answer is Devanagari with English in Latin.
  - By: Fri 30 Oct (D-031).
  - Blocks: the Hindi default in v1.0 and CVL-01's plan.

- [ ] **FT-43 Store listing, privacy answers, age rating, review notes**
  - Time: 4 hours.
  - Cost: US $0.
  - Steps: approve `docs/store/app-store.md` (no beta wording, only shipping languages, Lifestyle, United States only); upload FT-38's screenshots; enter App Privacy answers from `docs/legal/app-store-privacy-labels.md` as legal-alignment and counsel settle them (Q-005); answer the age rating questionnaire and **override the rating to 18+**, because the Terms require adults (qa-e2e checked App Store Connect help; not the Kids Category); paste the review notes and demo account (BL-341; `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 8 plus the D-004 positioning: a family memory journal, a due date is optional); answer export compliance (the app uses standard HTTPS and signature checks only [U: answer Apple's questions as asked]); attach both subscriptions with their review screenshot to the version.
  - By: Fri 30 Oct (ROADMAP).
  - Blocks: FT-45; BL-286.

- [ ] **FT-44 Approve the release**
  - Time: 30 minutes.
  - Cost: US $0.
  - Steps: approve the coordinator's release PR from `develop` to `main` and the `ios-v1.0.0` tag; the production build comes only from the tag (COORDINATION 6).
  - By: Fri 30 Oct or Mon 2 Nov.
  - Blocks: FT-45.

---

## Week 5: Mon 2 Nov to Fri 6 Nov

- [ ] **FT-45 Submit for App Review**
  - Time: 30 minutes, then answer any question within a day.
  - Cost: US $0.
  - Steps: choose **manual release** so you pick the day; submit Mon 2 Nov (Fri 6 Nov at the latest). If App Review cites guideline 5.1.1(ix) (individual publisher, sensitive information), answer the same day with the D-004 positioning and tell the coordinator: the fallback is an organisation account (entity, D-U-N-S, enrolment; 2 to 6 weeks [U]).
  - By: Mon 2 Nov (ROADMAP).
  - Blocks: release.

---

## After submission: buffer (9 to 20 Nov) and the launch window

- [ ] **FT-46 Q-003 settled before submission**
  - Time: inside FT-33. Cost: inside FT-03.
  - Steps: counsel confirms or changes legal-alignment's memo (`docs/legal/memos/q-003-subscription-notices.md`). The on-device reminders and "Save a copy" ship in v1.0 (BL-342) because Subscription Terms 1.4.0 promise them; if counsel requires email, that is a server path and a founder decision (D-053).
  - By: Fri 23 Oct. Blocks: the Subscription Terms going public (FT-41), BL-342's final copy.

- [ ] **FT-47 Counsel answer on AB 1043 and Texas SB 2420** (age signals from 1 Jan 2027)
  - Time: 30 minutes. Cost: counsel time.
  - Steps: the question is already in FT-18; ask for the answer in November (`docs/backlog/future/05-trust-platform-insights.md` T5-15).
  - By: Mon 30 Nov. Blocks: BL-345 (a 1.0.x release before 1 Jan 2027 if the duty applies).

- [ ] **FT-48 D-004 hedge: start an entity in parallel, or not**
  - Time: 1 hour to decide; formation is a separate project. Cost: state filing fees and an accountant [U].
  - Steps: `docs/DECISIONS.md` D-004 points 3 to 5 (triggers: the public TestFlight link, paid marketing, 1,000 families, US $2,000 a month in proceeds, a first hire, Android, selling print; Apple's app-transfer conditions).
  - By: Fri 27 Nov. Blocks: the fast fallback if App Review cites 5.1.1(ix); Android (G-21); paid marketing (G-06, T5-03); print (BK-14).

- [ ] **FT-49 Launch-week switches**
  - Time: 1 hour. Cost: US $0 (it caps cost).
  - Steps: Supabase spend cap **off** after launch, with billing alerts at 150% of the monthly model (T5-23; a cap that blocks sign-in or sync is worse than an overage); PostHog billing limit; schedule the weekly insights run for Monday about 07:45 Pacific with the Query Read key from FT-24 and an `insights_reader` token in the scheduler's secret store (`docs/analytics/INSIGHTS_LOOP.md` sections 4 and 6; D-070: the agent writes files, the coordinator commits).
  - By: launch week. Blocks: BL-346; the insights loop (T5-26).

- [ ] **FT-50 Store growth steps once the app is Ready for Sale**
  - Time: 2 hours. Cost: US $0.
  - Steps: founding-family offer codes (G-16, BL-344; codes exist only once the app is Ready for Sale); the three custom product pages and the Spanish (Mexico) listing (G-02, content agent drafts); the App Store featuring nomination [U].
  - By: Mon 30 Nov. Blocks: thanking C1 families; G-02.

- [ ] **FT-51 Decisions for v1.1 planning**
  - Time: 2 hours. Cost: CVL-02 reviewers about US $5,000 to $8,000 [E].
  - Steps: DEBATES Q-011 (v1.1 scope), the CVL-02 reviewer budget, the "never make a voice" constitution line (CVL-04), G-15 annual trial length; later Q-008 (Plus follows the book, by mid February 2027). Detail: `docs/backlog/FUTURE.md` section 6.
  - By: Mon 30 Nov. Blocks: v1.1 planning.

## What waits on what (critical path)

```
FT-01 Apple enrolment -> FT-06 Paid Apps -> FT-09 products -> week-2 StoreKit checks --+
FT-01 -> FT-07 Apple key -> FT-12 Supabase Auth -> sign-in checks -------------------+
FT-01 -> FT-17 eas init + first build -> FT-22 device spikes -------------------------+
FT-04 decisions -> FT-10 staging -> FT-23 production + beta policy versions ----------+
FT-16 signing key -> key in the first TestFlight build (kill switches, packs) ---------+
                                                                                      |
                                                                                      v
              FT-25 C0 (14 Oct) -> Beta App Review (15 Oct) -> FT-32 C1 (19 to 29 Oct) -> FT-40 exit
                                                                                      |
FT-03 counsel -> FT-18 package (9 Oct) -> FT-33 comments (23 Oct) -> FT-41 sign-off (29 Oct)
                                                                                      |
                                                                                      v
                                          FT-43 listing (30 Oct) -> FT-45 submit (2 Nov)
```
