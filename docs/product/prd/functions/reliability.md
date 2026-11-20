# Function review: reliability, observability, capacity and recovery (REL)

Owner: `ops` (release and operations engineer), second-wave review. Written 20 Nov 2026 under `docs/product/prd/functions/BRIEF.md` and `/home/claude/review/gap-agents-common.md`. Docs only: this file changes no card, runbook, workflow or code. Karma rules the card changes (section 5) in `GAP-LOG.md`; design needs (section 4) go to the area leads.

I am a Claude role, not a licensed professional (not an SRE on call, not a lawyer). Legal readings say "counsel must confirm". Outside facts carry a URL and the date I read them (20 Nov 2026); anything else is marked UNVERIFIED or cites the repo file that recorded it. `operations.md` (FR-OPS-01 to 36), `privacy.md`, `finance.md` and `support.md` are done and adjacent: I point to their ids and do not repeat them.

## 1. What I reviewed, and what I did not

Reviewed this session (repo `/home/claude/earlyletters`, branch `docs/locked-pack-inputs-20nov`):
- Product: `functions/BRIEF.md`, `functions/operations.md` (whole), `functions/privacy.md` (backup rows, lines 63, 87, 97, 119-120, 253, 273, 280), `functions/finance.md` (lines 96, 100, 126, 214), `functions/support.md` (FR-SUP-21 and the row list), `00-product-frame.md` (sections 3, 9, 10), `README.md`, `18-errata-after-lock.md` (E1 to E22), `GAP-LOG.md` (grep for reliability terms), NS-34 (`11-foundations.md:345-477`), NS-37 (`:770-843`), NS-10 (`08-keeping-and-trust.md:411-520`), NS-06 clock rows (`06-firsts-sealed-letter-quick-capture.md:277-279, 340`), NS-13 and NS-32 time-zone rows (`09-capture.md:36, 90-92, 145`; `11-foundations.md:54, 100`), `19-from-download-to-first-letter.md` only at lines 42, 1230, 1248, 1339, 1435 and the NS-41 lines 604-640.
- Design: area E `DESIGN.md` from `origin/docs/e2e-ux-20nov` (saved to a temp file, 621 lines): journeys J-E12 to J-E21, catalogue E-ST01 to E-ST46, gaps K-E01 to K-E16 and G-E01 to G-E13.
- Ops and engineering: `docs/ops/runbooks/restore-drill.md`, `free-tier-ops.md`, `incident-notification.md` (whole), `docs/ops/proposed/workflows/supabase-backup.yml` (header), `docs/tdd/06-performance-reliability.md` (sections 2, 5.6, 5.7, 6, 7), `docs/prd/v2/06-nfr.md` (sections 4 to 7, 10, 11, 14 to 16), `apps/mobile/src/lib/sync/errors.ts`, `merge.ts` (lines 1-8, 130-160, 620-660), `types.ts:185-205`, `outbox.ts` (grep), `store.ts:650-690`, `capture/free-space.ts`, `lib/dates.ts:1-30`, `app.config.ts:44, 285`, `supabase/migrations/20261016000000_sync_v1_server.sql:60-100`.
- Facts about the code that matter below (grep and reads, 20 Nov): `listConflicts` and `resolveConflict` in `store.ts` have no caller in any screen; only `lib/export/device.ts:146` calls `listConflicts`. `docs/ops/INCIDENT.md` does not exist (`ls`). `scripts/ops/restore-drill.ts` has no `entry_erasures` text (the migration header says the replay records erasures; see FR-REL-13).

Not read or not run:
- No dashboard (Supabase, Vercel, Resend, EAS, App Store Connect, GitHub private repo `earlyletters-backups`). Whether the three D-159 jobs run is UNVERIFIED (frame section 8 says the same).
- No test, drill, device run or measurement. Every budget below is a card or TDD number, not a result.
- NS-38 to NS-45 only at the lines above; NS-01 to NS-09, NS-12 to NS-31 by their rows in `operations.md` and by grep, not in full. Area A to D designs, `WORDS.md`, `MOTION.md` not read. `docs/ops/RELEASE.md` beyond what `operations.md` quotes not re-read.
- The iOS 17 device list: a search returned only titles, no page was read, so the oldest supported phone is UNVERIFIED (the deployment target is `17.0`, `app.config.ts:44`).
- The status pages of Vercel, Resend and Apple's System Status table: not readable here (Apple's page returned navigation only).

Outside sources read this session (20 Nov 2026):

| Fact | Source |
|---|---|
| Supabase pricing: Free "Uptime SLA: Not included in free"; Free backups "Not included in free"; Pro "Daily backups stored for 7 days"; PITR "$100 per month per 7 days retention"; logs Free "1 day", Pro "7-day"; Free egress "5 GB", DB "500 MB per project"; Free "paused after 1 week of inactivity"; Pro has "no SLA" listed | https://supabase.com/pricing |
| Supabase Auth limits: built-in email "2 emails per hour" and not configurable; OTP resend "60 seconds" per user; sign-ups and sign-ins "30 requests per 5 minutes" per IP; token refresh "150 requests per 5 minutes" per IP; the last three configurable | https://supabase.com/docs/guides/auth/rate-limits |
| Supabase has a public status page with Postgres, Auth, Functions, Storage and Data APIs and a "Subscribe to updates" button | https://status.supabase.com |
| Expo status page lists EAS Build, EAS Submit, EAS Update and a Push Notifications Broker; subscription by email, SMS, Slack, webhook, RSS and Atom | https://status.expo.dev |
| Resend Free: "3,000 emails / mo", "100 emails a day", "30-day data retention", "3 domains"; daily quota applies only to Free, resets at midnight UTC, exceeding it returns 429 `daily_quota_exceeded`; API default 10 requests per second per team | https://resend.com/pricing ; https://resend.com/docs/api-reference/rate-limit |
| GitHub: the `schedule` event "can be delayed during periods of high loads"; queued jobs may be dropped; "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days" (the page says nothing about private repositories: UNVERIFIED for ours) | https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows |
| Vercel Hobby: free; "if you exceed your usage limits on the Hobby plan, you will have to wait until 30 days have passed"; runtime logs Hobby "1 hour", Pro "1 day"; Hobby 100 deployments a day. The page I read does not say Hobby is non-commercial, so that is UNVERIFIED | https://vercel.com/docs/plans/hobby |

## 2. Coverage check, missing list and the facts the requirements rest on

### 2.1 What the repo and cards already say

| Topic | Already covered | Where (read this session) |
|---|---|---|
| Availability targets | TDD 06 sets 99.9% for write and read RPCs, 99.5% for Edge Functions, 97% auth; it notes "Supabase Pro has no published uptime SLA" | `tdd/06:86-100` |
| Free plan has no SLA and no backups | Supabase pricing (above); the founder chose Free on 8 Nov | `free-tier-ops.md` top; D-159 |
| Failure by vendor | One table of what the user feels, written for PowerSync, Sentry and RevenueCat that the store build does not have | `tdd/06:382-393` |
| Disaster recovery | RPO 24 h, RTO 4 h; real restore into a new project; ledger replay; `sync_begin_epoch`; monthly Free drill | `restore-drill.md` header and Parts 1-2; `free-tier-ops.md` "A real restore" |
| Incident comms | Notices for a data leak only (templates A and B, counsel approves) | `incident-notification.md` sections 2-4 |
| Observability | Content-free rule; signals list; alerts catalogue that assumes `ops-health` every 5 minutes and external uptime checks | `06-nfr.md:357-373`; `tdd/06:331-348` |
| Error budgets | 28-day windows, 1,000-event minimum, policy "more than 50% spent in 7 days stops feature work"; Sev 1 to 3 | `tdd/06:60-64, 96-101` |
| Old-phone performance | SE 3 numbers: start p50 1.2 s, p90 2.0 s, warm 400 ms, Speak p95 500 ms, 100 ms screen change, 900 ms hand-offs, drain 1% a day, 2% per 10-minute take, 40 MB over idle recording, 150 MB idle, 40 MB download, 50 MB caches, thermal | `11-foundations.md` NS-34 section 3 |
| Offline | A list of what works offline and five gates | `06-nfr.md:151-165` |
| Sync conflicts | Words are compare-and-set; the losing phone keeps a copy until the author picks | `merge.ts:1-8, 634`; `store.ts:650-690` |
| Storage full | 1 GB, 50 MB, 20 MB mid-take rules; screens E-S17 | `06-nfr.md:294-305`; E-ST32 to E-ST34 |
| Free tier capacity | Limits and readings (FR-FIN-03, FR-OPS-10 to 14) | `finance.md:96`; `operations.md` 3.2 |
| Time zones | Reminders (NS-13-R7, NS-32-R6), seals (NS-06 clock rows, NS-36-R3), about-day, birthday | cards above |

### 2.2 What is MISSING (the reason for this file)

1. Availability is stated as 99.9% budgets that need Pro, instrumentation and a pager that do not exist on Free. No document says which objectives are measurable today, and none says what a parent feels per dependency in the store build.
2. The restore is rehearsed as if the project survives. If the project is gone, `free-tier-ops.md` step 7 says a new project has "a new URL and publishable key, which are inlined in the build", so installed phones cannot reach it until a new build passes App Review. The 4 hour RTO in `restore-drill.md` is then wrong by days.
3. The backup chain has single points no one owns: one encrypted artifact set in one private GitHub repo, a key only the founder holds, scheduled runs GitHub may delay or drop, and ledger files in Storage that the dump does not hold.
4. There is no `INCIDENT.md`, no severity ladder written for what exists, no outage message for families (only leak templates), and the status page `FR-OPS-20` plans sits on the same website that Vercel hosts.
5. The log canary that every card relies on is "not built" (`privacy.md:97`). Error messages are not governed.
6. The sync conflict copy is kept but no screen shows it, so "neither version lost" is true and invisible.
7. The device matrix tests the SE 3 (4 GB) only. The deployment target is iOS 17.0, so a 3 GB class phone may run the app, and the speech model rule treats "phones under 4 GB RAM" specially (`06-nfr.md:288`).
8. Low-memory behaviour and disk-full at the database write are not specified end to end; the 1 GB calm line is not built (G-E04).
9. No capacity model says how many families each Free limit supports.
10. Clock and travel cases cover reminders and seals only. Letter dates, a wrong device clock, device restore and phone-to-phone transfer have no rows.

### 2.3 Dependency register: what a parent feels when each is down (store build, servers on, backup off)

| Dependency | Down means | Tier 0 on the phone (record, type, keep, read, play, Find, Save a copy, reminders) | What waits or fails | Detection today | Source |
|---|---|---|---|---|---|
| Supabase Auth or Data API (outage, pause, 402, read-only) | No sign-in, no sync, no new-phone arrival | Unaffected | First run reaches E-S14 (Start on this phone); signed in: Sync row "Waiting for a connection"; rows queue; `classifyCallError` sends 5xx and codeless 402 to `server` (back off, never drop) | keep-alive and status page by hand | `errors.ts:26-35`; E-ST02, E-ST03; J-E13 |
| Supabase Storage | None for text; ledger file not written | Unaffected | The daily purge ledger copy fails, which weakens restore (FR-REL-13) | `ops-alert` if wired | `free-tier-ops.md` limits table |
| Supabase paused (7 days idle) | Same as an Auth outage, for every parent at once | Unaffected | New installs blocked at sign-in | keep-alive (daily) | pricing; `free-tier-ops.md` |
| Vercel (website, help centre, legal pages, `/auth/confirm`, AASA) | Email-link sign-in lands on a dead page; Terms and Privacy links fail; help centre down | Unaffected | The emailed code still works if the parent types it (E-S06); support URL on the store page dead | none | `DOMAINS.md:12, 115`; NS-41 lines 604-640 |
| Apple: Sign in with Apple | Button fails | Unaffected | Email path remains | none | FR-FIN-07 |
| Apple: App Store, StoreKit, TestFlight, App Review | No new downloads, no purchase, no new build | Unaffected | The gate decision stays local (E design section 9); Plus status "unknown" holds the letter (E-ST26) | Apple's status page (content not readable here) | E-ST26, G-E13 |
| Resend (Free: 100 a day) | Sign-in emails stop at the cap; deletion receipts share the quota | Unaffected | E-S14 outage line, Apple still offered | Resend dashboard by hand | Resend pricing; FR-OPS-10, FR-FIN-07 |
| Expo / EAS | No new build; the installed app is unaffected (no OTA, D-091; local notifications only) | Unaffected | A hotfix cannot ship | status.expo.dev (subscribable) | `package.json` grep; D-091 |
| Cloudflare R2 (packs), the speech-model host | New language pack or model cannot download | Typed letters work; a spoken letter keeps its audio and gets words when the model arrives | Pack rows show `downloads_paused` or an error | none | `06-nfr.md:157-163, 283-292`; E-ST08 |
| GitHub (private repo: backup, keep-alive, limits) | The safety net stops without noise | Unaffected | A missed nightly backup is not an alert (GitHub emails on failed runs, not missing ones) | none | free-tier-ops.md; GitHub docs (above) |
| Domain, DNS, certificate (Porkbun, Vercel) | Website, sign-in email links, support mailbox, Resend sending domain all fail together | Unaffected | `hello@` unreachable | none | `DOMAINS.md:3-12, 48` |

### 2.4 Capacity model (Free tier; assumptions marked [A])

Readings are owned by FR-FIN-03 and FR-OPS-12. This table says where each wall is, so the founder knows before the reading does.

| Limit | Formula and inputs | Families to the wall | Leading indicator |
|---|---|---|---|
| Database 500 MB | 20 letters a month a family (`tdd/06:104-116` [A]); row size is 10 KB by TDD's estimate with `stt_meta` and 0.9 KB by the perf seed (`tdd/06:155-163`); production row size not read | 10 KB: about 2,000 letter-months fill it, about 100 families at a year; 0.9 KB: about 1,100 families at a year. The truth is between; the weekly size reading decides | database size growth per 100 letters |
| Egress 5 GB | Budget "under 5 MB per active user per month" (`06-nfr.md:147`); finance uses 7.5 MB and 12 MB for a full pull | About 660 active families at 7.5 MB (`finance.md:126`), before any new-phone or restore pull | egress reading (not read today) |
| Resend 100 a day | One email a sign-in; deletion receipts share it | 100 sign-ins in one UTC day; a launch push can do this in an hour | Resend dashboard count |
| Auth per IP 30 per 5 minutes | Sign-ups and sign-ins per IP | Many parents behind one carrier or office address, a review team, a launch event | auth logs (1 day kept) |
| MAU 50,000 | 1.5 accounts a family (`06-nfr.md:400`) | Not a wall at this scale | weekly account count |
| Storage 1 GB | Off while backup is off; about 52 family-months fills it if backup flips (NS-08 section 3, as quoted by `operations.md`) | Not reachable until the flip | n/a |
| GitHub artifacts 500 MB | 7 nightly dumps; job warns above 60 MB | the dump file size | job summary |

### 2.5 Coverage verdict per card (reliability view)

| Cards | Verdict | Why | Requirements |
|---|---|---|---|
| NS-01, NS-37 | Partly | Disk-full and memory rows exist per card; no Tier B phone, no memory ladder, copies regenerate but no kill-resume test across all heavy jobs | FR-REL-34, 48, 49 |
| NS-02 Find | Partly | Local; index build during launch has no budget or low-memory case | FR-REL-39, 48, 49 |
| NS-03, NS-04 | Covered | No build, or isolated | none |
| NS-05, NS-11, NS-14, NS-15, NS-18 to NS-24 | Partly | Local; clock and zone rows only for some; rollback is a build | FR-REL-54 to 56 |
| NS-06 | Partly | Clock rows good; seal after restore is FR-OPS-08; conflict note missing | FR-REL-13, 45, 46 |
| NS-07 | Partly | PDF disk-full exists; memory at 1,200 letters not stated | FR-REL-48, 49 |
| NS-08 | Partly | Flip needs key custody, second copy, freshness and ledger home | FR-REL-09 to 12 |
| NS-09 | Partly | Deletion after a restore unproven | FR-REL-12, 13 |
| NS-10 | Partly | Restore plus sign-in covered (R6); clone, egress and project-gone missing | FR-REL-07, 53, 59, 60 |
| NS-12, NS-36 | Partly | Server versions and conflict copies have no screen | FR-REL-45, 47 |
| NS-13, NS-32 | Covered | Zone and DST rows exist; add device rows by hand-set clock | FR-REL-56 |
| NS-16, NS-25 | Partly | Second reader raises restore and conflict stakes | FR-REL-13, 46 |
| NS-17 | Partly | Model by RAM rule untested on 3 GB | FR-REL-50 |
| NS-33, NS-35 | Covered | Device rows; add offline hang cases | FR-REL-40, 41 |
| NS-34 | Partly | Targets set, none measured; one device; no ratchet | FR-REL-31 to 38 |
| NS-26 to NS-31 | Covered (parked) | Nothing to run | none |
| NS-38 to NS-45 | Partly (read only at the lines in section 1) | Outage path exists (E-S14); sign-in link versus code, clock and restore allowance not stated | FR-REL-03, 55, 59 |

## 3. Requirements

Priority follows RR-4: P0 only with reason (a) a promise, (b) a legal or store duty, (c) the core loop. Owner lanes are agent handles; "founder" where only he can act. Links give card rows, e2e ids and backlog rows; "new row needed" where none exists.

### 3.1 Availability and dependencies

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-01 | Three tiers, written once. Tier 0 is the phone (record, type, keep, read, play, Find, Save a copy, reminders, local delete): never waits on a server and is an invariant, not an SLO. Tier 1 is server-assisted (sign-in, sync, new-phone arrival, account deletion): an internal objective of 99% a month, "best effort", measured by the probe in FR-REL-28, never a public number. Tier 2 is outside the app (website, help centre, email). Given any public or in-app sentence, Then it states no uptime figure and no recovery time | NS-34, NS-35, NS-10-R8; E-ST01 to E-ST04; BL-999 | P1 | ops | Supabase Free "Uptime SLA: Not included in free"; TDD 06 99.9% needs Pro |
| FR-REL-02 | A dependency register `docs/ops/DEPENDENCIES.md` with section 2.3 as its first table, adding per row: plan and quota, owner, status page URL, who is subscribed, renewal or expiry date, and the e2e state the parent sees. Reviewed at each release candidate | E-ST02, E-ST03, E-S14, E-S16; NS-38 to NS-45; new row needed | P1 | ops | Section 2.3 |
| FR-REL-03 | The emailed code works when the link does not. Given Vercel or the domain is down, When a parent opens the sign-in email, Then the code in the same email still signs them in (typed in E-S06), the email copy says so in plain words, and a device row proves it with the website stubbed to fail | E-S05, E-S06, E-S14.outage; NS-41; `DOMAINS.md:115`; BL-994 | P1 | auth engineer, content | NS-41 (line 616: "a link and a code are on their way") |
| FR-REL-04 | An expiry calendar in the founder's private record, with alerts at 60, 30 and 7 days: the two domains, the certificate (Vercel renews automatically, `DOMAINS.md:48`), the Apple Developer Program membership, distribution certificate and provisioning, the `scribe_backup` password (180 days), the Resend domain, the age key's paper copy check. Apple's consequence of a lapsed membership is UNVERIFIED (not read) | NS-08; `SECRETS_REVIEW.md` section 11 (cited by `free-tier-ops.md`); new row needed | P1 | ops writes; founder holds | `free-tier-ops.md` secrets table |
| FR-REL-05 | The status page does not share a failure with the thing it reports. Given a Vercel, DNS or Supabase outage, When the founder publishes the page of FR-OPS-20, Then it is served from a host that is neither Vercel nor Supabase and is reachable at an address that works without `earlyletters.com` DNS (default: a plain static page on a second provider; the provider is the founder's call). The in-app and store listing support links also name a second contact route (FR-REL-21) | FR-OPS-20; E-ST02, E-ST03; new screen needed (status page) | P1 | ops, web | FR-OPS-20 says "a static page on the website", which fails with the website |
| FR-REL-06 | Status feeds are subscribed: Supabase ("Subscribe to updates") and Expo (email, SMS, RSS) read 20 Nov; Vercel, Resend, GitHub and Apple System Status by their own pages (feature set UNVERIFIED). The register records each subscription date | status.supabase.com; status.expo.dev | P2 | founder | Section 1 sources |

### 3.2 Disaster recovery

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-07 | Recovery objectives per failure class, replacing the single "RPO 24 h, RTO 4 h". Five classes: (A) bad data or migration, project alive; (B) rows deleted by mistake; (C) project paused or restricted; (D) project lost; (E) vendor-wide outage. For each: action, RPO, honest RTO, what a parent feels, who is told. Class D's RTO is "until a build with the new URL passes App Review" unless FR-REL-08 is adopted. No public text quotes any of it | NS-10, NS-08; E-ST47 (proposed, FR-OPS-07); J-E21; BL-976 | P1 | ops | `restore-drill.md` header (RTO 4 h); `free-tier-ops.md` real restore step 7 |
| FR-REL-08 | The server address can move without a new app build. Given the project is replaced, When the founder switches, Then installed phones reach the new project within hours. Options for `security-architect` to read: (a) a custom API domain on Supabase (price and plan UNVERIFIED, not read), (b) a signed remote-config `apiBaseUrl` limited to an allowlist pinned in the binary. Default: (a) if Pro is adopted anyway; otherwise accept days and say so in FR-REL-07. A remote value may never send a phone anywhere not pinned | NS-10, NS-17 (signed config pattern); G-E03; new row needed | P1 | security-architect, platform | `free-tier-ops.md` step 7 |
| FR-REL-09 | Key custody drill. Given backups are encrypted to a key only the founder holds (paper copy kept), When each quarter passes, Then the founder decrypts the newest artifact using only the paper copy and records the date (a pass or fail, no content). A one-page "if I cannot act" sheet says where the key is and who may open it, and it gives that person no access to family data without a second step (the design is a founder and counsel question, Q-REL-3) | NS-08 flip condition; FR-OPS-15; new row needed | P1; P0 (a) at the backup flip | founder, ops | `free-tier-ops.md` founder steps 1 to 2 |
| FR-REL-10 | The backup is checked for absence, not only for failure. Given GitHub may delay or drop scheduled runs and emails only about failed runs, When the keep-alive runs, Then it also checks that the newest artifact in `earlyletters-backups` is under 36 hours old and opens an `ops-alert` issue if not. Whether private-repo schedules are auto-disabled is UNVERIFIED | FR-OPS-11; E-ST02; new row needed | P1 | ops (workflow as a proposal, FR-OPS-34) | GitHub docs read 20 Nov; `free-tier-ops.md` "Alerts are free" |
| FR-REL-11 | A second copy outside GitHub. Given the only copy of the dump is a 7-night artifact set in one private repository, When the founder runs the monthly drill, Then the encrypted file of that night (never a decrypted one) is also copied to one other place the founder controls (not another cloud account of the same company), and the drill log says so. Counsel names the copy a processor question with `privacy.md` PQ-3 | FR-PRV-08, PQ-3; FR-OPS-07 | P1 | ops, founder | Section 2.2 item 3 |
| FR-REL-12 | The purge ledger has a second home. The daily `ops-ledger` files (Storage, not in the dump) are also written to the private repository each day (ids and times only), so a lost project still replays deletions | FR-PRV-09 (same ask); NS-09; BL-566 | P0 (a) a deletion promise | ops, sync | `free-tier-ops.md` "The limit, stated plainly"; `privacy.md:253` |
| FR-REL-13 | Deleted stays deleted after a restore, proven by a canary. Given the drill, When an Asha letter and an Asha account are deleted after the dump time and the restore then runs, Then before any phone syncs both are gone, the canary is checked for held drafts, erased letters and any ledger kind added since (the migration header lists "the restore replay of the new ledger kinds" as left to S02: whether done is UNVERIFIED, `sync_v1_server.sql:90-97`), and a second Asha phone that still holds the deleted letter and re-uploads after the epoch reset does not bring it back. A miss is a Sev 0 finding (FR-REL-17) | FR-PRV-09, FR-OPS-07, FR-OPS-08; NS-09, NS-36; E-ST47; BL-551 | P0 (a) | ops, data-architect, sync | `restore-drill.md` Part 2 steps 3 to 4; `restore-drill.ts` has no `entry_erasures` text (grep) while the migration says the replay records erasures: reconcile in the drill |
| FR-REL-14 | The drill measures what matters and has a yearly "project gone" tabletop. Each monthly Free drill records: backup age, time to restore, tables compared, canary result (FR-REL-13), time to re-create secrets, cron and functions (list from `free-tier-ops.md` step 5). Once a year the tabletop is timed from "project gone" to "a parent can sign in", including the App Review step, and the observed number replaces the guess in FR-REL-07 | FR-OPS-07; E-ST47; new row needed | P1 | ops, founder | `restore-drill.md` drill logs |
| FR-REL-15 | After a restore, re-upload is not a stampede and no letter is lost. Given a new sync epoch, When N synthetic phones re-upload every letter, Then the server takes them without rate-limit refusals that last more than a day (a script run of 300 phones by 240 letters), and the families see only E-ST17 once. The honest gap goes in the notice (FR-REL-18): a letter made after the dump on a phone that was lost or erased in the same window cannot come back | NS-10-R14; E-ST17; J-E21; `sync_begin_epoch`; new row needed | P1 | sync, ops | `restore-drill.md` Part 2 step 4; `errors.ts` `rate_limited` class |

### 3.3 Incident response and comms to families

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-16 | `docs/ops/INCIDENT.md` exists: severities by what a parent feels, one responder (the founder), no pager, and the response each severity gets. It reconciles TDD 06 Sev 1 to 3 with RELEASE's S0 (RB-4, G5). The file says plainly that Claude roles cannot page and that nothing wakes the founder at night | FR-OPS-35; `risk-security.md:275`; new row needed | P1 | ops | `ls docs/ops/INCIDENT.md`: absent; `tdd/06:96-101, 350-362` |
| FR-REL-17 | Sev 0 events skip every budget and need no threshold: a lost or silently changed letter; a letter, name or recording reaching the wrong person; a sealed letter's words served early; a deletion not honoured; any content in a log; a forced lock on reading or export. Each opens the leak or restore runbook the same day | TDD 06 2.1; NS-06, NS-09, NS-36; LEGAL-REQ-040; FR-OPS-04 | P0 (a) | ops | `tdd/06:60-64, 100` |
| FR-REL-18 | Outage and restore messages exist, written by `content`, checked by claims. Four, content-free, no time promised, none implying AI writes, none using fear words: (1) sign-in or sync is down; (2) sync is slow; (3) we restored our servers (everyone signs in again once; the book on the phone is untouched; the last day's letters re-send from the phone that made them); (4) something deleted may have come back (counsel must confirm whether and when this is told, `privacy.md` PQ-10). Intent only: "What is on your phone is not affected." Each sentence has a claims row; a line that says everything is safe is not used because K-E06 shows that is a claim | E-ST02, E-ST03, E-ST47, E-S13; NS-08-R7; FR-OPS-20, FR-SUP-20; new row needed | P1; message 4 P0 (b) pending counsel | content, ops, legal | `incident-notification.md` has templates only for security |
| FR-REL-19 | A channel ladder with times. Given Tier 1 is down more than 30 minutes, Then within 1 hour: the status page (FR-REL-05); the support auto-reply carries message 1; the store listing is not used. In-app, only a line in Me through signed remote content where it exists (`incident-notification.md` section 2 names decision 16: whether it ships is UNVERIFIED), never on Home or as a banner (FR-OPS-19) | E-ST02, E-ST05, K-E07; FR-OPS-19, FR-OPS-20; BL-997 | P1 | ops, content | `incident-notification.md` section 2 |
| FR-REL-20 | A blameless note within 7 days of any Sev 0 to 2: what a parent felt, the counts, the cause, the fix, the budget effect; held in the private repository, never the public one; a repeat cause becomes a backlog row | FR-OPS-17; new row needed | P2 | ops | `incident-notification.md` section 5 (records) |
| FR-REL-21 | A second way to reach us. Given the domain or its mailbox is down, Then the status page names a contact route that does not use `earlyletters.com` mail or DNS (a mailbox on another domain). Default: yes, one | FR-SUP-23; E-S13, E-S14; BL-367 (cited by support) | P1 | founder, support | Section 2.3 last row |

### 3.4 Observability without content

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-22 | One weekly read, "the Monday read": at most ten numbers, each with source and threshold: App Store Connect crash-free sessions and launch time (users who share diagnostics only), limits job reading, backup age, keep-alive result, `ops-alert` issues opened, Resend sends yesterday, auth failures from Supabase logs read the same day (kept 1 day), support tally by category, purge SLA email, deletion requests open. Counts only. This is the reading side of FR-OPS-18 | FR-OPS-18, FR-OPS-12, FR-DAT-17; E-ST02; new row needed | P1 | ops | `tdd/06:331-348` assumes tools not present |
| FR-REL-23 | The log canary is built before any servers-on build reaches people outside the family. It plants a known string through each path (Edge Function logs, scripts, Actions logs in the private repo, thrown errors, the support attachment) and fails if the string appears anywhere | FR-OPS-17, FR-SEC-18; J-N18; NS-01, NS-02, NS-16, NS-18; BL-999 | P0 (a) | privacy, ops, security | `privacy.md:97` "the log canary ... is not built" |
| FR-REL-24 | Error messages are enums. Given any thrown error, reason or log line, Then it holds a code, never a letter, name, query, label, path or a pasted server message; a lint or test fails on string interpolation of user fields into an `Error`. Whether a fatal JS error's message reaches Apple's crash report is UNVERIFIED (`privacy.md:46`): the test plants a canary and reads a Simulator crash log | E-S13, E-ST40; FR-SEC-18; J-N18; new row needed | P0 (a) | mobile, security | `global-errors.logic.ts` exists; message hygiene not read |
| FR-REL-25 | Diagnostics a parent chooses to send. If a parent attaches a diagnostics file to a support email, Then: Shown, the plain list of what is in it (app version, build, phone model, iOS version, error codes, counts, last sync result code) before it is sent; Records, nothing on our side beyond the email the parent sends themselves; Never, letter text, names, prompts, dates of letters, paths, ids; Decline, the parent sends the email without it and support helps anyway. Whether the on-device ring buffer exists is UNVERIFIED (grep found only `store.ts` and `global-errors.logic.ts`) | FR-SUP-09; PRIV-R21; C-S-Me support rows; `06-nfr.md:366`; new row needed | P1 | mobile, privacy, support | Section 1 |
| FR-REL-26 | Server counts beyond one day. Supabase keeps logs 1 day on Free. A daily counts-only view (auth successes and failures, sync push errors by SQLSTATE class, rate-limited calls, rejected writes) is read by the backup role into the private repository's summary, so a week has a trend. No ids, emails or letters | FR-OPS-12, FR-OPS-18; E-ST02; new row needed (data-architect) | P1 | data-architect, ops | pricing page (logs "1 day") |
| FR-REL-27 | Crash and hang numbers are read honestly. Given ASC covers only users who share diagnostics, Then below 1,000 sessions no budget is judged; each crash is read by hand with TestFlight logs; the 99.8% line is quoted only after release (FR-DAT-16) | NS-34; FR-DAT-16; frame section 3 | P1 | ops, qa | `tdd/06:63` (1,000-event rule) |
| FR-REL-28 | An outside probe for Tier 1: a free monitor (product not chosen; features UNVERIFIED) calls the anonymous read the keep-alive uses every 5 minutes and emails the founder, content-free. The probe's pass rate is the only number behind the Tier 1 objective | FR-REL-01; FR-OPS-11; E-ST02; new row needed | P1 | ops, founder | `tdd/06:331` "one external uptime check ... from a free monitor (U)" |

### 3.5 Error budgets

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-29 | A budget table that says what is measurable now. Durability: zero (FR-REL-17). Crash-free sessions 99.8% and users 99.5% (ASC, after 1,000 sessions). Tier 1: probe pass rate 99% a month. Sign-in: a support tally of "cannot get in" weekly. Sync "99.9% within 5 minutes": an objective checked at device runs, not a budget, because Free has no instrumentation. Every objective names its source or is marked "not measurable in 1.0" | FR-DAT-32; NS-34; frame section 3 | P1 | ops, data | `tdd/06:67-86`; `06-nfr.md:170-171` |
| FR-REL-30 | What burning a budget does, for one responder. Given the probe misses 99% in a month, or crash-free drops below the line after 1,000 sessions, Then: no new flag turns on, the release branch takes fixes only, and the founder sees the cause in the note (FR-REL-20). Vendor-wide outages count and trigger a vendor review, not a freeze (as TDD 06) | FR-OPS-26, FR-OPS-29; RELEASE G5 | P1 | ops | `tdd/06:98` |

### 3.6 Performance budgets on old phones

All numbers are the cards' own (NS-34, NS-37, 06-nfr); none has been measured. These rows add tiers, populations and a ratchet.

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-31 | Device tiers named. Tier A, the gate phone: SE 3 (4 GB). Tier B, the oldest supported: whatever the deployment target iOS 17.0 permits (list UNVERIFIED), probably a 3 GB class phone, one spot run of the P0 loop (cold start, Speak, record 10 minutes, Keep, Book scroll, memory). Tier C: a current large phone. If the founder holds no Tier B phone, the run sheet records a waiver, never for a lost letter or a take refused | NS-34, NS-33; BL-929, BL-948; FR-OPS-32; `app.config.ts:44` | P1 | founder, qa | `06-nfr.md:288` (under 4 GB uses the small model) |
| FR-REL-32 | Cold and warm start, with the cases that make them slow: empty book, year-5 fixture (1,200 letters), airplane mode, signed out, first launch after an update with migrations on a 1,000-letter book (E-ST37). Targets stay NS-34's. A migration over 2 s shows the breathing launch state (E design J-E15); a migration that cannot open the book reaches E-S01.recovery | NS-34-R1, R7; NS-35; E-S01, E-ST37, E-ST41, J-E15; BL-929 | P1 | mobile, qa | NS-34 section 3; E design lines 144-145 |
| FR-REL-33 | Record latency under stress, not only cold and warm: Speak while the previous take's words are still being made, at thermal `serious`, in Low Power Mode, with Bluetooth connecting, after a phone call ends. Target stays p95 500 ms to a live microphone; a miss holds the feature (NS-34-R2) | NS-34-R2; NS-35; E-ST35, E-ST36, E-ST38; A-S04 | P0 (c) | mobile, qa | NS-34 section 3; E-ST36 |
| FR-REL-34 | Book scroll in four populations: empty; 1,000 letters and 300 pictures (NS-37-R1); the year-5 fixture; and AX5 with Devanagari. No frame over 16.7 ms, memory under 150 MB with pictures, first decode p95 50 ms (the last two are PROPOSED in NS-37) | NS-37-R1, R6, R7; NS-34 scenario rows; B-area Book screens (ids to assign); BL-929 | P1 | mobile, qa | NS-37 section 7 |
| FR-REL-35 | Battery measured with the phone's state recorded. Targets: idle 1% a day, a 10-minute take 2% or less, a 2-minute transcription 2% or less. Because a used SE 3 may carry a worn battery, the evidence records the battery's maximum capacity as iOS shows it (the setting's name UNVERIFIED) and the charge at start | NS-34 section 3; `06-nfr.md:241-256` | P1 | qa | `tdd/06:428-440` |
| FR-REL-36 | Thermal: after a warm 10-minute take, transcription pauses at `serious`, never starts at `critical`, and no take is ever refused; the evidence records the state at start (a warm start is discarded, NS-34 section 5) | NS-34; E-ST36; F05-REQ-015 | P1 | mobile, qa | NS-34; `06-nfr.md:251` |
| FR-REL-37 | Storage on a full phone. Install under 40 MB (FR-OPS-28); year-1 about 470 MB with listening copies; year-5 about five times that plus three picture files each (NS-37 section 3) plus one speech model of 190 MB to 574 MB. Me, Storage (C-S18) shows each kind with its size and the actions that free space (remove listening copies, remove a model). No budget loops through the phone's own "offload" (behaviour UNVERIFIED, not read) | NS-37, NS-08, NS-34; E-ST32; C-S18; G-E04; BL-929 | P1 | mobile, design | `06-nfr.md:294-305`; `tdd/06:423-427` |
| FR-REL-38 | A ratchet, because absolute targets have no baseline. Every run stores its numbers in `docs/qa/evidence/` (numbers only, Asha install); the next candidate is compared with the last; a p95 more than 15% worse holds the feature unless the founder waives it in the build record | NS-34-R1, R2, R4; FR-OPS-30, FR-OPS-31; new row needed | P1 | qa, ops | NS-34 section 3 ("none has been measured") |
| FR-REL-39 | Background work never starves the screen. Find's index (NS-02), a 200-row sync page, a new-phone arrival of 1,200 letters, listening-copy generation and picture copies run off the UI thread; during each, scroll stays inside NS-34's frame budget and the 300 ms apply budget holds | NS-02, NS-10-R2, NS-37; `06-nfr.md:142`; BL-929 | P1 | mobile, qa | `06-nfr.md:142` (local apply under 300 ms) |

### 3.7 Offline-first guarantees

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-40 | The offline contract is one table that tests read: every Tier 0 action, the five gates of `06-nfr.md:158-165`, and the airplane-mode walk (J-E12) on every candidate. It adds two cases the cards lack: a hung server (the connection opens and never answers) and a captive portal (HTML answered with 200). Neither may show a network line on Home or the Book, or delay a Tier 0 screen | NS-34 offline row, NS-35; E-ST01, J-E12; BL-929 | P0 (c) | mobile, qa | `06-nfr.md:151-165` ("server stubbed to hang" gate) |
| FR-REL-41 | No Tier 0 screen waits on the network. Given the screens and actions of the contract, Then a test lists every awaited network call reachable from them and fails on any that is not behind a timeout and a local fallback (the gate decision is local: G-E13) | NS-35; E-S10, G-E13; E-ST01; new row needed | P0 (c) | mobile | E design section 9 |
| FR-REL-42 | Every server failure is retryable and never a rejection. Given 402, 5xx, a read-only database error, a timeout, a 429, a captive-portal body that is not JSON, Then rows stay queued, back off with jitter (1 s doubling to 5 minutes, `errors.ts:3-5`) and nothing is marked rejected. A test per class; 402 and 5xx reach `server` by the code at `errors.ts:26-35`; the non-JSON body is UNVERIFIED | FR-OPS-14; NS-10, NS-06, NS-09; E-ST02; BL-978 | P0 (a) | sync | `errors.ts:26-35`; `operations.md` FR-OPS-14 left this UNVERIFIED |
| FR-REL-43 | The outbox survives everything: kill, reboot, update, a full disk, months offline. After months offline, return pulls from the watermark and the outbox drains in order. The bound on its size and the longest tested gap are written; "Not sent yet" stays visible (06-nfr gate) | NS-10; `06-nfr.md:165, 147`; E-ST39; new row needed | P0 (a) | sync | `06-nfr.md:147` |
| FR-REL-44 | Load shedding without a stop. Remote config may raise the pull interval for shared books (never lower it, never stop sync), so a capacity wall can be eased without pausing `sync`. Given a raised interval, the Sync row stays "Waiting" never "Paused" | E-ST05, K-E07; FR-OPS-02; `06-nfr.md:147, 400` (15 s pull); new row needed | P2 | platform, ops | The kill-switch key pattern of `kill-switches.ts` (narrow only) |

### 3.8 Sync conflict behaviour

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-45 | The conflict note is built. Given the author's two phones change one letter's words while offline, When the second syncs, Then the letter follows the words the server holds, this phone's words are kept as a copy, and the author sees one calm line on that letter with two actions, intent "Use this phone's version" and "Keep the other one" (the labels appear only in a code comment at `store.ts:653-690`; `content` writes the real words). Nothing is merged, blended or rewritten: both versions are the author's own words. Today `resolveConflict` and `listConflicts` have no screen caller (grep, 20 Nov), so the copy exists on the phone and in the export's `other-versions.json` only | NS-12, NS-21, NS-36; B-area letter page (new state, id to assign); `06-nfr.md:200` ("author sees the note"); new row needed | P0 (a) "neither version lost" is a promise a parent cannot use | mobile, design, content | `store.ts:650-690`; grep of `apps/mobile/src` |
| FR-REL-46 | One conflict table, kept next to the code: words are compare-and-set on the server's version, so the clock never picks a winner; other field groups follow server order (`types.ts:185-205`); a delete from elsewhere wins over queued ops (`merge.ts:636-637`); book settings are per-field last writer. A test sets two phones' clocks a year apart and checks the winner is unchanged | NS-06-A8, NS-36; `outbox.ts:753`; new row needed | P1 | sync, qa | `merge.ts:634-637`; NS-06-A8 |
| FR-REL-47 | Edit against delete: phone A moves a letter to Recently deleted while phone B edits its words offline. Then B's words are kept (as a conflict copy or in the restorable letter) and reach the author on restore; they are never dropped. Whether `merge.ts:636-637` drops B's queued words is UNVERIFIED: write the test first | NS-09, NS-12; NS-10-R6; new row needed | P1 | sync | `merge.ts:636-637` |

### 3.9 Storage full and low memory

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-48 | The disk-full ladder, end to end, one table with a test per row: under 1 GB (a calm line on Listen, not built: G-E04); under 50 MB (no take starts, `free-space.ts` `MIN_FREE_BYTES_TO_RECORD`, type instead); under 20 MB mid-take (take stops and is kept within 30 s: UNVERIFIED in code); 0 bytes during Keep (the row commit fails: the audio file is adopted by the capture sweep and returns as "Recorded before the app closed", nothing lost); picture commit (`no_space`, the letter goes on without it); listening copy; export (space check plus 200 MB); printable PDF (`print_pdf_disk_full`); model and pack download (disk check plus 1 GB); sync pull; Find index. Each ends "nothing lost, one calm line, no count" | NS-34 low-storage row, NS-35, NS-01, NS-07 C28, NS-10; E-S17, E-ST32 to E-ST34, J-E16; G-E04; BL-929 | P0 (a)(c) | mobile, qa | `06-nfr.md:294-305`; `free-space.ts`; E design lines 332-346, 460-465 |
| FR-REL-49 | The memory ladder. Given a memory warning or a jetsam kill, Then: recording is never the first thing shed (memory under 40 MB over idle); the speech model is freed on warning (`whisper-runtime.ts:7, 125`) and the job returns to queued with its partial; no picture decodes while recording (NS-37-R2); export, PDF, pack download, picture copy and index build each resume or restart without loss after a kill. A device row triggers a simulated memory warning in each long operation (the tool's name UNVERIFIED) | NS-34, NS-37-R2, NS-02, NS-01; E-ST38, E-ST39; BL-929 | P0 (c) | mobile, qa | `06-nfr.md:176-180`; `whisper-runtime.ts` header |
| FR-REL-50 | The model choice matches the phone. Given a phone under 4 GB RAM, or after 2 memory kills, Then the small model is used (`06-nfr.md:288`); a device row on a Tier B phone proves it picks the small model and has zero memory-limit exits over 30 runs | NS-17; NS-34; FR-REL-31 | P1 | mobile, qa | `06-nfr.md:176-177, 288` |

### 3.10 Capacity

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-51 | `docs/ops/CAPACITY.md` holds section 2.4 with real readings added each week: the first wall per limit, the leading indicator, the action. It reads production row size once (the 10 KB against 0.9 KB gap is the biggest unknown) and replaces the estimate | FR-FIN-03, FR-OPS-12, FR-OPS-13; E-ST02; BL-976; new row needed | P1 | ops | `tdd/06:155-163` |
| FR-REL-52 | A launch-day check. Before any planned public push (press, a store feature, a social post), the founder reads: Resend sends against 100 a day, Auth limits per IP (30 sign-ins per 5 minutes can block many parents behind one address), and the upgrade decisions of FR-OPS-13, then decides raise, upgrade or delay. The Auth limits are configurable (Supabase page, read 20 Nov) | E-S05, E-S06, E-S14; FR-OPS-10, FR-FIN-07; `finance.md:100` | P1 | ops, founder | Resend and Supabase pages (section 1) |
| FR-REL-53 | Restores and new phones are counted in egress. A restore epoch makes every phone pull again; a new phone pulls about 12 MB (finance `[A]`). The egress forecast for any restore or release that forces a re-pull is written before it runs | NS-10; FR-FIN-03; FR-REL-15 | P1 | ops | `finance.md:126, 214` |

### 3.11 Chaos cases: clock, zone, travel, restore, migration

Each row is a device row on the run sheet; the expected result is the requirement.

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-54 | A wrong device clock never corrupts the book. Given the phone's date is set a year back, a year forward, before the child's birth, or to 2001, When a letter is kept, Then it keeps, its day is shown and can be changed with the "another day" control (NS-15), month chapters and age math use the letter's day, ordering inside a day is stable (by day, then time, then id, so an id built from a wrong clock moves only its own letter), and nothing else reorders. How Keep handles a date before birth (`isBeforeBirth` exists in `dates.ts`) is UNVERIFIED | NS-15, NS-22, NS-23, NS-43-R3; A-S05, B-area; BL-929 | P1 | mobile, qa | `dates.ts:1-30`; NS-43 line 1248 ("a wrong clock makes a bad date") |
| FR-REL-55 | The wrong clock and the network. A wrong clock may break TLS and purchases (mechanism UNVERIFIED, not read): everything server-side then fails while the phone works. Given repeated server failures, the E-S14 and Sync lines do not blame the Wi-Fi, and support has a macro: "check Date and Time is set automatically" with no letter content asked | E-ST02, E-S14; FR-SUP-20; new help article needed | P1 | support, content | Section 2.3 |
| FR-REL-56 | Time zones and the date line. Given the parent keeps a letter at UTC+14 or UTC-12, near midnight, or flies across the date line with auto time zone on or off, Then the letter's day is the phone's local date, the server accepts it (the server range is "to tomorrow", NS-43 line 1230), the age on that day never shifts (`dates.ts` uses noon UTC so "no time zone can shift the date"), and the birthday-week slip uses the local date. Spring-forward and fall-back nights (repeated 01:30): two letters keep distinct, ordered. Run by setting the date, time and zone by hand | NS-13-R7, NS-32-R6, NS-11, NS-23; NS-06 clock rows; J-N5; BL-929 | P1 | mobile, qa | `dates.ts:21-30`; `09-capture.md:90-92`; `08-keeping-and-trust.md:612` |
| FR-REL-57 | Calendar and leap day. Given a phone whose region uses a non-Gregorian calendar (for example a Buddhist year), or a child born on 29 February, Then stored dates stay ISO, displayed dates are correct for the locale and the age math is right in non-leap years. UNVERIFIED how `Intl` and `dateLocale` behave with a calendar extension on the device locale | `dates.ts:14-28`; NS-24, NS-22; BL-929 | P2 | mobile, qa | `dates.ts` |
| FR-REL-58 | The age stop and the clock. Given a parent who is stopped by the 18+ gate and sets the clock forward, Then whatever lockout the gate keeps (K-E10 mentions a 24-hour stop) does not rely on the phone clock alone. Which clock it uses is UNVERIFIED; compliance decides whether it matters (counsel must confirm) | NS-40; E-S03; K-E10; FR-CMP rows (compliance.md) | P1 | security-architect, regulatory-affairs | E design K-E10 |
| FR-REL-59 | Device restore and phone-to-phone transfer, as one matrix kept next to NS-10: what returns (the database and recordings in the iPhone backup, D-033; Keychain items depending on the backup type, UNVERIFIED), what does not (speech models, packs, listening copies, list and page picture copies, caches: NS-37-R4; stored picture copies DO return with the iPhone backup, NS-01-R27. Superseded in part by FR-REL-70 on 20 Nov), and what must be rebuilt (Find index, planned notifications, the Plus decision). Required results: letters appear once (NS-10-R6); the free allowance counts the same (NS-44-R5 "Keychain ledger plus mirror plus letters"); notifications are re-planned at the first launch after a restore as after an update (E-ST37); a stale `server_epoch` takes the `reset` path (`engine.ts:251`) | NS-10-R6, NS-44-R5, NS-37-R4, NS-08-R8; E-ST37, E-ST17; BL-978 | P0 (a) | mobile, sync, qa | NS-10 line 439; NS-44 line 1435 |
| FR-REL-60 | A clone beside the original. Given a restored or transferred copy and the original phone are both signed in for days, When both keep letters and edit one, Then duplicates of an op are harmless (`dup` in `types.ts`), no letter appears twice, and the conflict rule of FR-REL-45 applies. A device row with two Asha phones runs it | NS-10-R14, NS-10-R6; J-E17; FR-REL-45; BL-961 | P1 | sync, qa | `types.ts:185-205` (`dup`) |
| FR-REL-61 | Switching phones with backup off is explained before it hurts, in the help centre and the existing one-time keep-safe line (NS-08-R8), not by a new prompt: the words come back by signing in; recordings come only by the iPhone's own backup or transfer, or a saved copy. No promise we hold a recording | NS-08-R8, NS-10-R13, NS-11; C-S12 new-phone line; FR-SUP-21; FR-SUP-04; new help article needed | P0 (a) | support, content | Frame section 7 claim |

## 4. Design needs

| Where | Change | For |
|---|---|---|
| Letter page (area B; id to assign) | New state: the conflict note, one line and two actions, in the letter's own place, in dark and light, AX5 and VoiceOver; no count, no badge; words from `content`. | FR-REL-45 |
| E-ST47 (proposed by operations) | Add the "Server restored" state with the same render as E-ST17 and the sentence for message 3 | FR-REL-18, 07 |
| E-S14 | Confirm Start on this phone for every outage kind; add the clock hint as help, not as a banner; the sign-in email shows "or type the code" | FR-REL-03, 55 |
| E-S17, A-S04.lowSpace | Draw the under 1 GB line (G-E04) and the 0 bytes at Keep case ("Recorded before the app closed" returns) | FR-REL-48 |
| C-S18 Me, Storage | Show size per kind and the actions that free space | FR-REL-37 |
| Website (new screen needed) | Status page on a second host: what works, what waits, no times, no form; dark, light, AX5 | FR-REL-05, 19 |
| E design section 9 matrix | Add rows: Tier B phone, hung server, captive portal, clock back and forward, DST night, date line, device restore, two-phone clone, memory warning in each long operation | FR-REL-31 to 60 |

## 5. Card changes proposed (for Karma to rule)

| Card row | Change | Why |
|---|---|---|
| NS-34 section 3 | Add Tier B (oldest supported) spot run and the ratchet (15% worse holds the feature); record battery capacity | FR-REL-31, 35, 38 |
| NS-34 section 6 | Offline row adds "hung server" and "captive portal" | FR-REL-40 |
| NS-10 section 5 | Add the clone-beside-original case and the egress count of a restore | FR-REL-59, 60, 53 |
| NS-12 or NS-21 | Add the conflict note as a row (or a new row in NS-36), P0 (a) | FR-REL-45 |
| NS-08 section 2 | Add conditions: key custody drill, second copy outside GitHub, backup freshness alert, ledger second home | FR-REL-09 to 12 |
| NS-09 | Add the canary: a deletion after the dump stays deleted after a restore | FR-REL-13 |
| NS-41 section 5 | Add "email link page unavailable: the code still works" | FR-REL-03 |
| `00-product-frame.md` section 8 | State "no uptime SLA on Free (read 20 Nov)" and "RTO if the project is lost = App Review time unless FR-REL-08" | FR-REL-01, 07 |
| TDD 06 sections 2.3, 5.6, 6.1 | Mark 99.9% budgets, `ops-health`, Sentry and PowerSync rows as written for Pro and a different stack; point to this file | Drift |
| `restore-drill.md` header | Replace "RTO 4 hours" with the per-class table | FR-REL-07 |

## 6. Engineering needs (backlog rows to add or change; no id above BL-999)

| Row | Add or change | FR | Owner |
|---|---|---|---|
| New | Conflict note screen and wiring of `listConflicts` and `resolveConflict` | FR-REL-45, 47 | mobile |
| New | Log canary (J-N18) across functions, scripts, Actions logs, thrown errors, support attachment | FR-REL-23, 24 | privacy, ops |
| New | Backup freshness and second-copy jobs as proposals under `docs/ops/proposed/workflows/` | FR-REL-10, 11, 12 | ops |
| New | `restore-drill.ts` canary for post-dump deletions, held drafts and new ledger kinds; 300-phone re-upload script | FR-REL-13, 15 | ops, data-architect |
| New | Daily counts-only server view; outside probe | FR-REL-26, 28 | data-architect, ops |
| New | Pinned API base alternative or Supabase custom domain read | FR-REL-08 | security-architect |
| New | Timeout and no-network-await test for Tier 0 paths; captive-portal and hung-server stubs | FR-REL-40 to 42 | mobile |
| New | Pull-interval floor in remote config | FR-REL-44 | platform |
| New | Notifications re-planned on first launch after restore; clock and zone device rows | FR-REL-54 to 59 | mobile, qa |
| BL-929, BL-948 | Tier B, ratchet, new system rows | FR-REL-31, 38 | qa |
| BL-976 | Add FR-REL-09 to 12 to the flip evidence page | FR-REL-09 | sync, ops |
| BL-978 | Add the restore-epoch and clone cases | FR-REL-59, 60 | mobile |
| New (docs) | `INCIDENT.md`, `DEPENDENCIES.md`, `CAPACITY.md`, expiry calendar, Monday read | FR-REL-02, 04, 16, 22, 51 | ops |

## 7. Founder and counsel questions (each with a recommended default)

| # | Question | Default | Who |
|---|---|---|---|
| Q-REL-1 | Accept that a lost project means days, not hours, until FR-REL-08 is done, and say nothing public about recovery time? | Yes. Read the Supabase custom-domain option on the day Pro is considered | founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-090, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: monthly second backup copy, second-provider status page, second contact route, borrow a phone |
| Q-REL-2 | Second copy of the backup outside GitHub (FR-REL-11)? | Yes, monthly, to one place the founder controls; name it in the policy's backup sentence if counsel asks | founder; counsel PQ-3 FOUNDER-ANSWERED 20 Nov, default accepted (CL-090, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: monthly second backup copy, second-provider status page, second contact route, borrow a phone |
| Q-REL-3 | Who may open the key and the "if I cannot act" sheet? | One trusted adult holds the sealed sheet; opening it gives the key, not family data access without a second step. Counsel must confirm any access consequence | founder; needs a number from legal FOUNDER-ANSWERED 20 Nov, default accepted (CL-091, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: sealed key sheet holder, Vercel plan check, counsel engagement |
| Q-REL-4 | Host the status page off Vercel (FR-REL-05)? | Yes, a plain static page on a second provider | founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-090, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: monthly second backup copy, second-provider status page, second contact route, borrow a phone |
| Q-REL-5 | Second contact route on another domain (FR-REL-21)? | Yes | founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-090, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: monthly second backup copy, second-provider status page, second contact route, borrow a phone |
| Q-REL-6 | Buy or borrow a 3 GB class phone for the Tier B spot run? | Borrow if possible; otherwise a waiver line, never for a lost letter | founder FOUNDER-ANSWERED 20 Nov, default accepted (CL-090, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: monthly second backup copy, second-provider status page, second contact route, borrow a phone |
| Q-REL-7 | May the founder tell families that deleted items might reappear after a restore? | Yes, in the incident message only, not in the policy (`privacy.md` PQ-10); counsel must confirm | counsel Q51 FOUNDER-ANSWERED 20 Nov, default accepted (CL-091, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: sealed key sheet holder, Vercel plan check, counsel engagement |
| Q-REL-8 | Is Vercel Hobby acceptable for a commercial site? | UNVERIFIED (the page read does not say). Confirm the plan; finance assumes Pro ($20) | founder; counsel must confirm FOUNDER-ANSWERED 20 Nov, default accepted (CL-091, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: sealed key sheet holder, Vercel plan check, counsel engagement |
| Q-REL-9 | Is the age stop's clock a compliance issue? | Ask compliance to read FR-REL-58 | counsel; needs a number from legal FOUNDER-ANSWERED 20 Nov, default accepted (CL-091, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: sealed key sheet holder, Vercel plan check, counsel engagement |

## 8. Totals

61 requirements, FR-REL-01 to 61. Priorities by row: P0 where the Priority cell says P0 (about 15 rows, FR-REL-09 only at the backup flip), P2 on FR-REL-06, 20, 44, 57, the rest P1. Karma should recount when building `FUNCTION-TRACE.md`.

---

## Addendum 20 Nov 2026: photo moments and pictures and videos

Source: `26-founder-direction-photos-library-and-media.md` section 3; NS-51 (Photo moments, level 3) and NS-52 (Pictures and videos with a letter) by name (`27-photo-moments-and-media.md` did not exist when written; align ids when it lands). Lens: `ops`, a Claude role, not an SRE. Outside facts: Apple documentation pages for PHPicker representation modes, `isNetworkAccessAllowed` and `AVAssetExportSession` were fetched 20 Nov 2026 and returned only metadata (JavaScript page) or an error, so every Apple behaviour below is UNVERIFIED and is a spike question, not a fact. Supabase Storage limits page (read 20 Nov): Free file limit 50 MB, Pro up to 500 GB; it does not mention resumable uploads. Repo facts: NS-01 stored copy is JPEG, metadata stripped, upright, at most 4,032 px, in the iPhone backup (NS-01-R27); no background mode and no task manager exists in the app (mobile review of NS-46 to 50, battery paragraph, by grep); NS-37-R2 no picture decodes while recording.

### R1. Existing rows touched

| Existing | Effect |
|---|---|
| FR-REL-37, 39, 48, 49 (storage, background, disk ladder, memory ladder) | Extended to video and to the moment index (FR-REL-62, 64, 65) |
| FR-REL-34 (book scroll populations) | Gains a population with videos (FR-REL-66) |
| FR-REL-53 (restores counted in egress), 59 (restore matrix) | Extended; FR-REL-59 corrected in place (see FR-REL-70) |
| FR-REL-01 tiers | Media is Tier 0 (the phone) first; a hosted copy is Tier 1 and never the only copy |
| FR-REL-13 (purge ledger) | Applies to hosted media objects if Q-PM-3 is yes |

### R2. New requirements

Phone-only rows apply always; rows marked "hosted" apply only if Q-PM-3 is yes (default no).

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-REL-62 | Add never loses the letter. Given a parent attaches pictures or videos while the phone is full, offline, mid-call or the item cannot be read, When the copy fails, Then the letter is kept without the item, one calm line says the item did not come along with Add again, 0 partial files remain, and the original in Photos is untouched (extends NS-01-R17a and R45). Each failure kind has a test: no space, unreadable, unknown type, over the size cap, corrupt | NS-52; NS-01-R17a; FR-REL-48 | P0 (a): never lose | mobile, qa | NS-01 edge-case table |
| FR-REL-63 | iCloud-optimised originals. Given a picture or video whose full file is not on the phone, When the parent picks it, Then the app waits for the system to deliver it with progress the parent can leave and cancel, never freezes the screen, never writes a half file, and a stalled or offline download ends as FR-REL-62 with the letter kept; the spike measures time to first byte, behaviour offline and when cancelled, on 17.0 to 17.2 and 26 and on a slow network (Network Link Conditioner). How the picker and PhotoKit expose network download is UNVERIFIED (Apple pages not readable this session) | NS-51, NS-52; NS-49 spike | P0 (c): core loop | mobile, qa | UNVERIFIED Apple behaviour |
| FR-REL-64 | Formats. Given HEIC, HEIF, JPEG, PNG, wide-colour or HDR pictures, Live Photos, ProRAW-size files and video (HEVC, H.264, variable frame rate, rotated, no audio track, zero length), When stored, Then: pictures become the stored copy of NS-01 (upright, metadata stripped, 4,032 px cap) and a decode failure follows FR-REL-62; a Live Photo stores the still only (default; the motion part is not stored as a video unless the founder rules it in, Q-REL-P2); a video is stored at the limits (default 60 s and size cap, Q-PM-2) after on-phone transcoding to one codec that plays on every supported iOS and in the export (codec and preset are a spike result, PROPOSED H.264 for reach; UNVERIFIED), rotation applied, audio kept as the parent's sound track; the app applies no filter, trim, stabilisation or enhancement unless the parent does it (constitution: repair, never add meaning); a video over the limit is refused with a choice the parent makes, never silently cut | NS-52; NS-01 T3; constitution | P0 (c) | mobile, qa | NS-01 sizes; Apple UNVERIFIED |
| FR-REL-65 | Memory and thermal limits. Given a 60 s video, a 50,000-item library or six pictures added at once, When processing, Then work runs off the UI thread, one item at a time (queue), under the memory ladder (FR-REL-49: recording never the first thing shed; nothing decodes while recording; transcoding pauses on a memory warning and the item returns to queued with its partial deleted), and transcoding stops on thermal pressure or Low Power Mode with the letter kept and the item waiting; scroll stays inside NS-34's frame budget during each | NS-51, NS-52; FR-REL-39, 49; NS-34, NS-37-R2 | P0 (c) | mobile, qa | FR-REL-49 |
| FR-REL-66 | Book with videos. Given the Book with 1,000 letters, 300 pictures and 100 videos on an SE 3 (FR-REL-34 population plus video), Then list thumbnails are made once and cached, no video plays or decodes until the parent taps, no frame over 16.7 ms, memory under 150 MB (PROPOSED in NS-37; the video number is mine, PROPOSED), the list and page copies and a poster frame are excluded from backup (NS-37-R4), and low space deletes caches first, never stored copies | NS-52; FR-REL-34; NS-37 | P1 | mobile, qa | NS-37-R1, R4 |
| FR-REL-67 | Low storage ladder for media. Given free space falls, Then rows are added to FR-REL-48: under the space needed for the transcode scratch (up to 2x the video, PROPOSED) no video add starts and the parent is told once, calmly; under 50 MB no add of any kind starts and Speak and Type stay available; the moment index is dropped first when space is low and rebuilt later; a stored copy is never deleted to make room. Each row ends "nothing lost, one calm line" | NS-52, NS-51; FR-REL-48; C-S18 | P0 (a) | mobile, qa | FR-REL-48 |
| FR-REL-68 | Moment index (NS-51) reliability, phone only. Given a library of any size, Then: the first scan is incremental and resumable, runs in the foreground only (no background mode exists; adding one is a founder and review decision, Q-REL-P3), yields to recording, scroll and low-power mode; a permission change to limited or none (checked at every foreground) removes items from the index on the next scan and never shows a picture the system no longer shares; revoking permission or turning the feature off deletes the index (FR-DAT-39); a library change while scanning is safe (no crash on a vanished item); a corrupt index is deleted and rebuilt, never repaired; a restore or new phone rebuilds it; the feature failing shows nothing, not an error | NS-51; FR-REL-39, 59; FR-DAT-39 | P0 (a): private and calm | mobile, qa | mobile review battery note |
| FR-REL-69 | Hosted upload queue and resume (hosted). Given a letter with media and the network drops, the app is killed, or the phone sleeps, When connectivity returns, Then uploads resume from a persisted queue with a stable per-item key (idempotent: a retry never makes a second object), resume at the last confirmed chunk where the protocol allows (resumable-upload support on our storage is UNVERIFIED: the limits page read does not mention it), back off with jitter, never upload on cellular unless the parent allowed it (Q-REL-P4), never block Keep or the letter's syncing of words, and the words sync before media. A refused or stalled item shows nothing alarming; the letter stays whole on the phone. Without a background mode, uploads progress only while the app is open; the app says so once if a queue is waiting (no count, no deadline). Two phones adding to one letter: media is additive, last writer never removes the other's item | NS-52; FR-REL-12, 38 to 40; mobile review (no background mode) | P1 | sync, mobile | Hosted only |
| FR-REL-70 | Restore and phone-change matrix, media rows (corrects FR-REL-59). Stored picture and video copies return with an iPhone backup (NS-01-R27); list, page and poster copies and the moment index are rebuilt; without a backup, pictures and videos are absent, letters read whole (NS-01 R15 states a Book-level line); if hosted, an egress forecast precedes any forced re-pull (FR-REL-53: a new phone at heavy year 5 pulls about 18.7 GB, `finance.md` addendum); videos can push a parent's own iCloud backup over its quota, which is the parent's storage and only a plain line, if any, is shown (Q-FIN-P4). Required result in the matrix: letters appear once, media slot per letter either filled or calmly absent, no "missing" counter | NS-52, NS-10; FR-REL-53, 59; NS-01-R27 | P0 (a) | mobile, sync, qa | NS-01 line 103, R27 |
| FR-REL-71 | Servers-off builds. Given a TestFlight or any servers-off build, When the new flags are on, Then the feature works fully on the phone with no network call, the pause key is honoured when remote config can be fetched and the feature stays on otherwise (fail-open), and no media upload path is reachable (a test over each build profile, FR-OPS-39). Given Supabase is down or over quota, Then NS-51 and NS-52 on-phone behaviour is unchanged | NS-51, NS-52; FR-OPS-39; E20 | P0 (a) | mobile, ops | FR-OPS-39 |
| FR-REL-72 | Device evidence for media on old phones. Given the matrix (SE 3, iOS 17.0 to 17.2, 26, a second phone), Then the run sheet adds: still, HEIC, Live Photo, a 60 s 4K and a 60 s 1080p video, an iCloud-optimised item on a poor network, a full phone, a library of 20,000 or more fictional items, a Limited library selection, a permission revoked mid-scan, and a second Apple ID or shared device; each records phone, iOS, build, runs, p50 and p95 for add and for first scan, met or missed (FR-DAT-15 shape). Fixtures are fictional Asha only (FR-OPS-43) | NS-34, NS-37, NS-51, NS-52; FR-DAT-15 | P0 (c) | qa | FR-REL-34 pattern |

### R3. Design needs
Strings: "the picture did not come along" with Add again (exists for NS-01, new variants for video), a calm "waiting for the picture to download" line, and a "your phone is full" line for video; none shows a number of waiting items or a deadline. No new screen; states for A-S01 and the Review and letter-page screens.

### R4. Engineering needs
New rows needed: (1) a spike file for FR-REL-63, 64 and 65 on the device matrix before any build of NS-52 video; (2) a transcode queue with a scratch-space check; (3) persisted upload queue with idempotency keys (hosted); (4) moment index scanner, resumable, with permission-change handling; (5) servers-off build-profile test for the new flags; (6) restore matrix rows next to NS-10.

### R5. Questions, with defaults
| Id | Question | Default | Who answers |
|---|---|---|---|
| Q-REL-P1 | Video codec and size cap | H.264 (reach), the cap from Q-PM-2 and the spike | Karma with `mobile`, founder confirms the cap CLOSED 20 Nov, see GAP-LOG Closures CL-092 |
| Q-REL-P2 | Store the motion part of a Live Photo | No, still only | Founder CLOSED 20 Nov, see GAP-LOG Closures CL-092 |
| Q-REL-P3 | Add a background mode so scans and uploads continue | No | Founder with Karma (review and battery cost) CLOSED 20 Nov, see GAP-LOG Closures CL-053 |
| Q-REL-P4 | Upload media over cellular | No unless the parent allows | Founder with design CLOSED 20 Nov, see GAP-LOG Closures CL-092 |

### R6. Cannot assess yet
- Every Apple behaviour named (picker modes, network download of originals, export presets, Live Photo handling, background transfer): Apple's documentation pages were not readable this session; spike on devices.
- Transcode time, battery and thermal cost of a 60 s video on an SE 3: no measurement.
- Resumable-upload support and chunk size on our storage: not on the page read.
- Real library sizes, share of iCloud-optimised items, and how often parents add video: no data.
