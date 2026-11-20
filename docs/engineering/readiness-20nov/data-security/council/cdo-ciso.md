# Council return: CDO and CISO seats

Date read: 20 Nov 2026. Two seats, one file. Nothing posted anywhere.
Signed: Chief Data Officer (Claude role) for the CDO items; CISO (Claude role, not an auditor) for the CISO items. Where an item sits in both seats, each position is written and marked.

## 0. What I read, and what I could not

Read in full from origin/develop (fetched this session, head 598226fc at fetch time): docs/agents/exec/COUNCIL.md, .claude/skills/early-letters-cdo/SKILL.md, .claude/skills/early-letters-ciso/SKILL.md. Read the decisions list. Read the pack files under docs/engineering/readiness-20nov/data-security/ from PRs #999 to #1011 (01a, 01b, 02a to 02i, 03, 04, 05, 06, 07-1 to 07-4), their "Questions for the council" sections, and the findings tables of 03 and 04. Code checks ran against a clean worktree of origin/develop (31 migration files).

Could not read: any Supabase page (supabase.com is refused by the session proxy), any hosted project setting, any vendor console. So every statement below about a Supabase plan, log window, backup, rate limit or hosted setting is [U]. Nothing was run against a hosted project. I did not run npm run test:db or test:functions; I read test and source files.

Verified against code this session [V] (not taken from the pack):
- 31 migration files; .github/migrations-applied.txt lists 2; so 29 are not recorded as applied (arithmetic on the repo, not a read of any hosted project).
- request_account_deletion (20261005000000:408-453) has no step-up; the backup RPCs do (SCSTP, 20261023000000:1013-1023); the escrow function has recentSignIn (escrow/jwt.ts:138); no call to reauthenticate anywhere in apps/mobile/src.
- Four functions read the one secret key through secretKeyOf: analytics-forget, invite-redeem, purge-worker, apple-token (grep of supabase/functions).
- audit_events allows export_created, legal_hold_placed, legal_hold_released, support_access (20261002020000:315-320) and no migration writes them; the only inserts are at 20261002020000:334 and 968, 20261003020000:175, 20261015020000:371, 20261108010000:89.
- entry_photos_author_insert and _update exist in the core migration and are restated in 20261003, 20261005 and 20261028; bucket allows jpeg, heic, png at 10 MiB.
- purge housekeeping deletes purge_ledger rows older than 60 days (20261108020000:217) and entries_not_purged consults only purge_ledger (20261004100000:116-126). No SCPRG anywhere under supabase/.
- BUNDLED_ESCROW_KEYS is empty with a TODO (apps/mobile/src/lib/backup/escrow-keys.ts:12-14); EXPO_PUBLIC_BACKUP is "off" in all four eas.json profiles; apps/web/src/app has no stop route; the email CTA "Stop this and sign out" points at {stopUrl} = earlyletters.com/stop (escrow/restore.ts:100, test fixture).
- setExcludedFromBackup is called only for language packs and model files; nothing for scribe.db or backup-<id>.db; erase-everything.ts has no reference to the backup file.
- 17 unpinned action steps (actions/checkout, setup-node, cache, upload-artifact at @v4) and 74 SHA-pinned; no security.yml, no dependabot.yml, no audit-ignore.json under .github (docs/ops/proposed/dependabot.yml exists as a proposal). PR #30 is open, last updated 28 Oct.
- The aps-environment entitlement is stripped in app.config.ts:96-103; no push token call in apps/mobile/src.
- auth.en.ts:199 says "We will sign that device out"; there is no sender or lever for it.
- classification.test.mjs reads schema public only (lines 8-14).
- TRUSTED_SIGNING_KEYS in packages/api/src/keys.ts now lists two keys (el-2026-11 and el-2026-11-backup). The CISO skill says the list is empty. The skill is stale on that point (I note it in my misses line, section 5).
- APPLY.md's status table stops at file 27 and then lists 32; the 20261108 files are described in later sections only (lines 1189, 1202, 1215).

## 1. CDO seat

### A2. Apply the 29 migrations to hosted projects (D-041), order, deploy the deletion worker
Verdict: CHANGE (add conditions); the act itself is FOUNDER (his accounts, one-way for a project with no backups).
Position: Keep the default (founder applies, in file order, after the consent-order step, nothing applied by agents). Add four conditions:
1. Name the target. The repo says three different things: APPLY.md applies to project `early-letters` (files 1 and 2 applied), DEPLOY.md says `scribe-staging` and `scribe-prod` start empty, the list says "production on Free". I cannot tell which project holds the founding family's data. The founder names it in one line before anything runs. [U for all hosted state]
2. Staging first. Apply all files to scribe-staging (empty project), then run the invariant checks (npm run test:db green; a count of tables and policies against the pack's 36 tables, 64 policies, 206 functions as a smoke check).
3. Snapshot before. Files 4 and 8 drop tables (safety_events; store_notifications, store_subscriptions, app_account_tokens). If the target holds founder data, take a dump first and read row counts of the dropped tables. On Free there is no platform backup [U vendor; the pack and decisions list say so].
4. One PR records the apply: .github/migrations-applied.txt gains the lines in the same PR (the migration guard enforces it). Add the three 20261108 files to the APPLY.md table; the table skips them today.
Also: set no app.* setting during the apply. app.consent_fields_required stays unset until A3's gate.
Blind spot: this ruling rests on the repo; no one has read a hosted database.
Closure line: "A2 closed [date]: founder applied files 3 to 32 to [named project] in file order after a dump; migrations-applied.txt updated in the same PR; worker deployed; CDO invariant checks read back."

### B4. iPhone device backup of scribe.db, recordings and pictures acceptable?
Verdict: NEEDS COUNSEL and NEEDS FOUNDER. Question to counsel (via CPrivO and CLO): "Is L4 content (letters, child identity, recordings, pictures) sitting in a person's own iPhone backup consistent with our statements that these stay on the phone, and does it change the Apple privacy label?" I did not read Apple's label definitions: [U]. Question to founder: accept for 1.0 or not.
CDO recommendation: ACCEPT scribe.db and recordings and pictures in the person's own device backup for 1.0. A keepsake that dies with a lost phone is worse for the family, and excluding it makes recovery depend on our server. [V] today nothing is excluded. Two parts are not covered by that acceptance: backup-<id>.db (B5) and the safety tiers, which the privacy rules say stay on the device: whether they are inside scribe.db, and therefore inside the backup, must be answered by mobile before the word "stays on this phone" is used about them anywhere. The default "no change until counsel and product answer" is fine for engineering but cannot stay open at the first store build: what ships is the answer.
Condition: the Settings words about it are content's, PROPOSED, and say plainly that the phone's own backup holds the book.
Closure line: "B4 closed [date]: device backup of scribe.db, recordings and pictures accepted for 1.0 (counsel read [ref]); safety tiers [in or out] of scribe.db confirmed; Settings words approved."

### B5. backup-<profile id>.db excluded from device backup and deleted on Erase
Verdict: AGREE (CDO and CISO). [V] neither done.
Position: The file holds upload_url, upload_token and wrapped_file_key. Build both, plus: classify the file (inventory G-11), delete it on sign-out of that account as well as on Erase, move upload_token to the Keychain (this-device-only class) or stop persisting it (02h Q-h1: I take the Keychain), and add a test that fails if the file is ever created without the exclusion flag. Make "B5 done" a precondition in the store-flags test for EXPO_PUBLIC_BACKUP so the flag cannot go on first.
Closure line: "B5 closed [date]: backup file excluded from device backup, deleted on Erase and sign-out, token in Keychain; test red without each."

### B8. Does a parent ever see their own audit rows on a screen?
Verdict: AGREE (no screen; rows go into the export) with one change: do not export raw rows yet.
Position: [V] audit_events_own lets a person read rows where actor_id is them, and the inventory's own sentence (DATA_CLASSIFICATION section 2, "users see their own audit rows") disagrees with the grants (C-4): fix the sentence, do not add a grant. Before audit rows go into account.json: (1) key allowlist on audit_events.detail, which is bounded only by size (octet_length <= 512) and "is an object" (20261002020000:326-327), the pack's Q-b3 and G-13; (2) filter to rows where the requester is the subject, because a removal row names another person's id (L3 about someone else); (3) counsel confirms the access-request scope (PQ-5).
Closure line: "B8 closed [date]: no audit screen; account.json carries the requester's own audit and deletion rows after the detail key allowlist shipped; counsel confirmed PQ-5."

### C3. Build security_events and the missing audit writers
Verdict: CHANGE (split in two; both before first outside family, as the default says).
- (a) Audit writers for export_created, legal_hold_placed, legal_hold_released, support_access: AGREE, one migration with tests, written by data-architect; detail keys on an allowlist; content-free. Support and break-glass acts also write ops.audit_log first ("no row, no act", 03 section 9): one row in each, as 03 Q4 proposes. AGREE.
- (b) security_events (SEC-R24): AGREE to build, but as its own store, not a new action in audit_events. audit_events is 24 months, can travel into a person's export, and carries person ids; security_events is service-role only, 12 months (D-021), no person id in clear (a keyed hash), closed enum of kinds, counts. Minimum kinds: wrong-code bursts, global invite pause tripped, step-up failures, restore requests, deletion requests refused, ceiling hit on alert mail.
Condition (CDO): a store nobody reads is not detection. The PR names the reader (the founder, by one ops alert email) and the threshold, or it does not merge.
Closure line: "C3 closed [date]: audit writers and security_events migrated, tested, applied; reader and threshold named in docs/ops/SECURITY.md."

### C4. Close the photo upload policies (S1)
Verdict: AGREE, with one change to the timing (CDO and CISO).
Position: [V] the insert and update policies exist, so a modified client can write a picture to entry-photos under its own folder while the cards say pictures never leave the phone (NS-01-R61). The default ties S1 to builds with EXPO_PUBLIC_PHOTOS on. Change: ship S1 before the first outside family regardless of the flag, because the write path exists in every build, flag or not. Also: on a project that has only files 1 and 2, the live policies are the original, weaker ones; the tightened restatements are in unapplied files. S1 must therefore be tested on a database built from all files and on the A2 path. Delete stays (own folder), but G-03-01 stands: a removed member can still delete objects in their own folder; low harm, record it. Needs the founder's approve-migration label. [Supabase allows or refuses triggers on the storage schema: U; the pack's S1 design says "add a trigger"; confirm before writing it.]
Closure line: "C4 closed [date]: S1 applied; insert and update on entry-photos denied for authenticated, tested; delete rule recorded."

### C5. Permanent purged-id guard (SCPRG) after day 60
Verdict: CHANGE: build it, but ruling on its shape goes through the privacy chief first, and retention of the guard is NEEDS COUNSEL.
Position: [V] real gap: from day 61 a stale phone's outbox can re-insert a letter the person deleted. The data cost is the problem. A permanent table of deleted letter ids outlives the account, so it is a retention promise that D-111 (erasure records kept until the book or account is deleted) does not cover, and device ids are UUIDv7 (they carry a creation time, so a raw id is a timestamp). My design: store only a keyed hash (HMAC with a function secret) of the id, 16 bytes, no other column, no person id, no book id, never joined; guard entries_not_purged and the book purge check against it. The written promise becomes: "we keep an unreadable fingerprint of a deleted letter's id so it cannot come back". Counsel and CPrivO confirm. Engineering can write the migration now; it is not applied until that answer is recorded. Related: 02a Q-a3 (held_drafts_gone sweep) takes its period from the same number: sync states the longest offline period a phone may have, and both clocks use it.
Closure line: "C5 closed [date]: HMAC purged-id guard migrated and tested (stale-phone replay at day 61 refused); retention wording approved by CPrivO and counsel."

### Schema and classification questions (CDO seat; pack Q ids)
- 01a Q-1 (data-map.yaml generated from the catalog): AGREE. Generate, do not revive PR #37 (1,568 lines, predates D-100). The generator reads the pg catalog through the test harness and the phone's migrations.ts; a checker fails on any column without a map row. privacy owns levels.
- 01a Q-2 / 02c Q-c3 (extend classification.test.mjs to ops, insights, sync_private, phone migration comments): AGREE [V: test reads public only]. Add the 10 missing insights comments in a new migration (two internal views, no role reads them, but unlabelled is unlabelled).
- 01a Q-3: same as A2. Q-4: same as B4. Q-5 (server plan state is L3, in scope of the privacy policy's purchases section): AGREE, labelled L3; the conflict with ADR 0013 and DATA_CLASSIFICATION 4.1 goes to CPrivO and counsel. 02c Q-c1 and Q-c2: AGREE (keep as built, rows live with the account); give subscription_report_rates windows an age sweep (G-6).
- 01b (leak register): Q-b2 AGREE (vendor-log gap into 06's vendor table); Q-b3 AGREE (no remote push; if ever, first PR is a rule file); Q-b4 AGREE (ask Supabase in writing for encryption at rest; [U] until the founder has the reply). Q-b1 is B5.
- 02a Q-a1 (four inert policies; the inventory counts 14 in all): AGREE keep and list, and add a test that the set of policies with no matching grant equals a written list, so adding a grant later cannot wake one silently. Q-a2 (dictionary_terms): AGREE leave unreachable; condition: confirm account and book purge cover it. Q-a3: see C5.
- 02b Q-b1 (released legal holds retention): NEEDS COUNSEL; default stands. Q-b2: B8. Q-b3 (jsonb key allowlist): AGREE, after privacy lists the keys, before B8.
- 02d Q-d1 (12 or 24 months for the unwrap log): AGREE 24 as built, marked "as built, not approved". Reason: a log shortened is evidence gone for good; a log kept too long can be cut at any time. Counsel answers Q51. Q-d2 (60-day ops-ledger copy as a named exception to "deleted with the account"): AGREE, list it in 06.
- 02e Q-e1 (AUTHENTICATED_FUNCTIONS list in grants.mjs): AGREE (also CISO). Q-e2 (sync_push stays invoker): AGREE.
- 02f Q-f1: C4. Q-f2 (child-photos): AGREE neither; correct DATA_CLASSIFICATION 4.4, which says "v1.0, private" for a bucket no migration creates; add a test that the worker skips a missing bucket.
- 02g Q-g1: B4. Q-g2 (SQLCipher): NEEDS FOUNDER (CISO view in section 2, C-extra below).
- 02h Q-h1: AGREE Keychain. Q-h2: B5.
- 02i Q-i1 (days store and moments index L4, excluded from backup, never exported): AGREE L4 and excluded; "never exported" needs CPO and counsel: it is the person's own content, and an export that omits it may not answer an access request. NEEDS COUNSEL on that one word. Q-i2 (order of L12 to L15 and S2 to S5): AGREE the order in DS 3.6; no migration starts until the founder says so. Q-i3: AGREE L2 for entry_media kind, ext, bytes (never L1; L1 is public).
- 03 Q4: AGREE (see C3a). 05 Q6 (who writes the missing audit actions): data-architect, one migration with tests; ops the wrappers.
- 06 Q7 (inactive accounts): AGREE none in v1 and say so in the policy; a keepsake is opened years later. Q8 (count of "families with a language" at k = 10 as L2): AGREE as built; blind spot stated: only synced families, only those who set a language; counsel confirms. 06 Q1: B8. Q2 (consent withdrawn): NEEDS COUNSEL, default stands. Q3 (GitHub as processor): AGREE name it anyway.
- 07-4 CPrivO question (device class word plus time in an email, L2 or L3): L3 with the address; I agree with the default.

Blind spot, schema and classification: every number in the pack (36 tables, 453 columns, 206 functions) is from a test database built from files, not from any hosted project.

## 2. CISO seat

### A1. Supabase Pro before the first store build
Verdict: CHANGE; FOUNDER (spend, CFO input).
Position: The default (stay on Free, state the 24-hour deletion-return limit in the incident notice) is honest, and the founding family on Free is a risk I can sign for. I would not carry it past the first person outside the family. Change the trigger from "first store build" to "first person outside the founding family stores a letter on the server": a TestFlight build to the founder alone needs no plan. What Pro buys, if the vendor sheet still says so [U: I could not read it]: 7-day logs, platform backups. What it does not buy: detection. Seven days of logs is still thin for a breach found at day 30, and the California clock runs 30 days from discovery (counsel must confirm applicability). The detection comes from C3(b). Condition: no public or in-app statement about retention of logs or backups that is wider than what is logged (FR-BKO-04).
Residual risk accepted by the founder if he keeps Free: up to 24 hours of deletions return after a restore, and 1 day of platform logs.
Closure line: "A1 closed [date]: founder chose [Free until first outside family, then Pro | Pro now]; incident notice states the deletion-return limit; CFO recorded the cost."

### A5. Revive PR #30, SHA-pin 17 steps, secret scanning (F-12)
Verdict: AGREE, with a change: do not revive PR #30 whole.
Position: [V] 17 unpinned steps, no security.yml, no dependabot.yml, no audit-ignore.json; PR #30 has been open since 3 Oct and was last touched 28 Oct, and carries a trusted-ref migration guard, fence scripts, a setup action and more. It is the wrong size to review. Two small proposals, as the pack's 04 Q6 says: (1) pins: the CI-PIN brief (same-major SHAs; resolve upload-artifact's SHA with ls-remote and paste the output, never from memory) plus the test that fails on any tag-pinned action; (2) scanning: a gitleaks full-history job, npm audit with an audit-ignore.json whose every entry has a reason and an expiry, dependabot.yml as proposed in docs/ops/proposed. Founder pastes each (workflow writes are his, because of the proxy). Pins first; they cost nothing and change no behaviour. Secret scanning and push protection were read as enabled on 31 Oct; Dependabot security updates as disabled: ask for a fresh read-back, because mine is 20 days old. [U now]
Closure line: "A5 closed [date]: pins merged with test; gitleaks and audit jobs merged; dependabot on; settings read back by the founder."

### B1. Remote push ever
Verdict: AGREE. [V] no push token request and the aps-environment entitlement stripped. Never for security alerts (an alert in a push payload is on a lock screen). If it is ever decided: the first PR is a rule file that allows no L3 or L4 field in a payload, before any entitlement, key or table. Closure line: "B1 closed: no remote push in 1.0.x; any later proposal starts with the payload rule file."

### C1. Step-up before request_account_deletion
Verdict: AGREE; extend to request_book_deletion.
Position: [V] no step-up today; a stolen unlocked session starts a 30-day deletion that tombstones every letter and book. Enforce it on the server like the backup RPCs (SCSTP, a sign-in within 10 minutes, read from the token's own authentication time as escrow/jwt.ts does), not in the app: a client check is not a control (SK-08). The app calls the existing reauthentication email code (the template exists; the app never calls it today [V]). Cancel must not need step-up, so a victim can always undo. Condition: the sole-parent drill (D-129) is re-run with step-up in place. Words are content's. It needs a new migration with approve-migration.
Residual: an attacker with the phone and the inbox still gets through; the owner is emailed (A4) and has 30 days.
Closure line: "C1 closed [date]: account and book deletion require a sign-in within 10 minutes, enforced in the database, tested with an old-session case; cancel unaffected."

### C2. Per-function service keys
Verdict: CHANGE: use a database role per function, do not wait for the platform.
Position: [V] four functions share one secret key. The pack's default waits on Supabase (U: I could not read whether it can issue more than one). The repo already has the pattern that does not wait: escrow_svc, a login role with execute on ten functions and nothing else (BACKUP_RUNBOOK.md). Apply it: invite-redeem (internet-facing, one RPC), apple-token (one RPC) and analytics-forget (a quota RPC) get a login role with execute on that one function and no key that opens Auth admin or Storage. purge-worker needs the secret key (it deletes auth users and storage objects) and keeps it, alone. Order: invite-redeem first. Cost: a connection string secret per function (a founder step each), a connection limit per role.
Residual: one key still opens everything for purge-worker; it is cron-only with a bearer in Vault and no public route.
Closure line: "C2 closed [date]: invite-redeem, apple-token, analytics-forget on single-function roles; secret key held by purge-worker only; grants.mjs lists each role."

### C3, C4, C5 (CISO view)
C3: as in section 1: AGREE both parts, security_events as its own service-only store. C4: AGREE; ship before first outside family, not only before PHOTOS on. C5: AGREE the gap is real and high for L4 resurrection; shape and retention as in section 1; keyed hash so the table is not a list of ids.

### C6. Second break-glass person; recovery custody (Q-BKO-6)
Verdict: NEEDS FOUNDER. Exact question: "If you cannot act for 14 days, who can, on GitHub, Apple, Supabase, Expo, Resend and the domain registrar, and where is the recovery material held?" The default (none named, nothing assumed) is a true statement, not a control. For the founding family alone, I can carry it. Before the first outside family a book outlives its operator; I recommend a named person holding a sealed instruction (not live access) plus the escrow key paper bags already in BACKUP_RUNBOOK. Whether and how an estate or a lawyer holds that: counsel must confirm.
Closure line: "C6 closed [date]: [name or none], custody [where]; accepted residual: [one sentence]."

### C7. Dead stop link and empty escrow key lists: backup stays off
Verdict: AGREE, and make it a gate.
Position: [V] eas.json BACKUP off in all four profiles, BUNDLED_ESCROW_KEYS empty, no stop route in apps/web, the email's only defence against a hostile recovery request is a link to a page that does not exist. Add one preflight check that fails any build with EXPO_PUBLIC_BACKUP on unless: key lists non-empty, the stop route returns 200, B5 is done. Dormant today; this keeps it dormant by machine, not by memory.
Closure line: "C7 closed [date]: preflight refuses backup-on builds until keys, stop page and B5 exist."

### D1. Alert emails at v1
Verdict: AGREE the default, with three changes.
- New-device sign-in email (A1): not launch-blocking, in my view (CPO rules priority). The "Sign out other devices" control exists [V]. But auth.en.ts:199 promises "We will sign that device out" and there is no lever [V]: either build the lever or take the sentence out before first outside family.
- Recovery notice (A3): needs the missing recovery runbook first; rule: no recovery act without the notice and an ops.audit_log row first.
- Alert mail carries no action link: AGREE (07.2 rule 3). Device-id hash table: AGREE if keyed (HMAC with a function secret, not a stored salt), L3, service role only, deleted with the account. Any new sender function is a new endpoint: it gets a threat-model row before it ships.
Closure line: "D1 closed [date]: v1 sends what Auth and built senders send; A1, A3, A6 scheduled after first outside family; stale sentence removed or lever built."

### D2. Alerts in quiet hours; the cap
Verdict: CHANGE on the cap only. Quiet hours exempt: AGREE.
Position: The list says A2 is capped at 5 per 24 hours. 07.2 contradicts itself: its table says 1 per 24 hours (A2), its rule 6 says 5. I take 1. And A2 should send no email in 1.0 (see D3): a wrong-code email lets anyone who types a victim's address trigger mail to the victim. "Never capped" for A1 and A3 to A9 is a policy; add a backstop ceiling of 20 alert mails per account per day across all kinds, and log the ceiling being hit to security_events. The number 20 is mine [E, no source].
Closure line: "D2 closed [date]: alerts exempt from quiet hours; A2 not emailed in 1.0; ceiling 20 per account per day with a logged breach."

### D3. Email after repeated wrong codes; server lockout or paging
Verdict: AGREE (no email, no paging in 1.0) with one evidence request.
Position: [V] the phone pause is in memory and lost on restart; the local config has 6-digit codes, 15-minute expiry and token_verifications = 30 (config.toml:53-57, 63-75; local stack only). What the hosted project enforces per address is [U]; the pack and I both lack a read. The founder reads back Auth's rate limits from the dashboard (five minutes) and records them in SECURITY.md; if per-address verify attempts are not limited by the vendor, I want one server-side counter feeding security_events. A 6-digit code at 30 attempts per 5 minutes per IP is a brute-force budget a rented set of addresses can use; the answer is the vendor read, not a guess.
Closure line: "D3 closed [date]: hosted Auth rate limits read back and recorded; per-address server limit [present | counter built]."

### F3. Workflow pastes in order
Verdict: AGREE the order; two security conditions. I read the list line (README section 5, item 6) and the two briefs (CI-PIN, F4); I did not read the ratchet, merge-queue or label-guard patches in full: [U] for those.
- The two-job deploy (F4 brief): job 1 (dry run) reads the production owner-role database URL "without reviewers". That secret opens the whole database. Job 1 must run only from a trusted ref (a tag on main, never a pull request or a fork), and the secret must be one the pull-request path cannot reach. If that cannot be shown, keep the environment protection on both jobs and accept two clicks.
- eas.json in the `changes` match: AGREE (a build-config change should trigger CI).
- Label guard: AGREE; it is a control only once a PR cannot merge without it passing, which needs a required check (CR-20: today GitHub enforces none [31 Oct read; stale, ask for a read-back]).
Closure line: "F3 closed [date]: pastes applied in order; deploy job 1 limited to trusted refs; required-check read-back recorded."

### Secrets and endpoints (04, 03, 02g)
- 04 Q1 (remote push): B1. Q2 (per-function key): C2. Q3 (security_events): C3. Q7 (stop page, backup off): C7.
- 04 Q4 (new-device email required or offered): AGREE offered at v1.0; counsel decides whether it is a duty. Q5 (email to the other parent when a co-parent leaves): AGREE in-app line only. Q6: two PRs, pins then scanning (A5).
- 03 Q1: C1. Q2: C6. Q3 (tell a family when staff looked): AGREE yes by default through the incident runbook; counsel decides, and note this means break-glass acts are logged first. Q5 (insights_reader granted to authenticator, 20261004300000:35-37 [V]): CHANGE: drop it in the next migration pack. Only service_role runs the weekly report; a role a Data API token could be mapped to is cost without a user. Q6: C2.
- 02g Q-g2 (SQLCipher before launch): NEEDS FOUNDER; my recommendation is no, not before 1.0. SQLCipher protects a database file from someone who copies it (an unencrypted device backup on a shared computer is the real case, B4); it adds a native dependency and a key that must live in the Keychain, and it does not help if the key item is allowed into device backup. Instead: read back the file protection class on a real device (MASTG iOS storage test) and record it, since it is checked in config only today [pack and CISO skill]. Residual: someone with an unencrypted iTunes or Finder backup and the phone's computer can read the book. Founder signs it.
- Endpoints: I accept the 04 section 5.2 table as [V] for repository state. The three no-gateway-JWT functions (config, content, purge-worker) and escrow are as designed; the deploy list and its test (functions-deploy.mjs) are a real control. Open: G-04-07 website launch-list limit rests on a Vercel WAF rule nobody has read back (founder, console); G-04-09 hosted exposed-schemas list (public only; ops, insights, sync_private must never be in it) is a checklist, not a read-back.
Closure line (endpoints): "Endpoints closed [date]: exposed schemas, Auth rate limits, Vercel WAF rule and secret presence read back by the founder from the checklist in SECURITY.md and recorded."

## 3. Gaps the list misses (decisions nobody has named)

1. Which project is production, and what is in it. APPLY.md, DEPLOY.md and the list name three different things, and no one has read a hosted database. Everything in A2, A1 and C4 depends on it. Founder, one line.
2. A snapshot before the first apply on a plan with no backups, and a read of the tables files 4 and 8 drop. Not in any default.
3. Detection has no owner. With Free's one-day logs and no security_events, an incident older than a day is invisible. C3(b) names the store; nobody has named who reads it or when.
4. The purged-id guard is a retention promise (C5), not just a migration. Without a keyed hash it also becomes a permanent list of deleted letter ids.
5. Exports of audit rows can name other people (B8 point 2) and audit detail has no key allowlist. Fix before any audit row goes into account.json.
6. Hosted Auth settings, exposed schemas, Vercel WAF, secret presence: all unread. The founder read-back is one sitting; the list has no item for it.
7. New senders are new endpoints. Alerts A1, A3, A6 need a function, a role and a threat-model row; the threat model (PR #342) still waits on D-122's private-repo question.
8. Founder-account recovery (C6) and connectors: the list does not ask which connectors stay attached to sessions (Supabase, Resend, Gmail reach production and recovery mail; CISO skill section 9a). That is a standing founder decision; I have no new read of it.
9. The insights/ops/sync_private classification gap (10 unlabelled columns, test reads public only) is small and has a fix; it is on no list.
10. DATA_CLASSIFICATION.md is a year behind (4.1 stops at 20261004300000; phone schema v4 against v10) and the founder merges docs/legal. Regenerate once the map generator (Q-1) exists, not by hand.

## 4. Conditions I attach (collected)

- Nothing is applied to a hosted project by an agent. The founder applies; each step ends with a read-back he records.
- No hosted fact is quoted as known; each is [U] until the founder's read-back is in the repo.
- Migrations I name are drafted, tested on a database built from all files, and labelled approve-migration before any apply.
- No letter, transcript, audio or child name is read to answer any item here.
- Legal and tax readings are counsel's: California breach clock, FTC HBNR, CCPA scope, label definitions, retention periods. Counsel must confirm.

## 5. Misses (for the skills' own logs)

- CISO skill section 9a says TRUSTED_SIGNING_KEYS is empty; develop now lists two keys. Update the skill line; the signing-key ceremony appears to have been done for the public half.
- CDO skill section 9a says server-on state is 26 migrations; develop has 31.

## 6. Totals

CDO seat: AGREE B5, B8 (with change), C4 (with change); CHANGE A2, C3, C5; NEEDS COUNSEL and FOUNDER B4.
CISO seat: AGREE B1, C7, D3, F3 (with conditions), A5 (with change); CHANGE A1, C2, D1, D2; AGREE C1 (extended to book deletion); NEEDS FOUNDER C6, Q-g2.

Chief Data Officer (Claude role)
CISO (Claude role, not an auditor)
