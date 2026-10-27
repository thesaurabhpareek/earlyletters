# Data and backend

Supabase, the local database, sync, visibility, remote config, packs hosting and serving, API standards and environments.

### ADR-0004 Sync engine: PowerSync (Cloud) with op-sqlite, writes through Supabase
- **Source:** `docs/adr/0004-sync-engine.md` (Accepted, 2026-10-01; status note 3 Oct pointing to D-023)
- **Decided:** PowerSync Cloud with op-sqlite as the local database, its attachment queue for audio and photos, writes through supabase-js so RLS stays the only authority, and a CI parity test between Sync Streams and RLS.
- **Why:** a hand-rolled sync is the most common way solo projects lose data; less custom code for the riskiest part.
- **Alternatives:** ElectricSQL (no managed write path or file queue); hand-rolled (highest data-loss risk at the time).
- **Door:** two-way: never built; replaced before any data
- **Reversal cost:** low: nothing to undo
- **Revisit when:** scale: 10,000 families, or attachment sync outgrows the simple queue (D-023 update)
- **Review by:** on trigger
- **Status:** superseded by D-023
- **As built:** not built (expo-sqlite is the local database)

### ADR-0006 Encrypted backup: per-child key in iCloud Keychain, server escrow by default, Vault mode opt-in
- **Source:** `docs/adr/0006-encrypted-backup.md` (Accepted, 2026-10-01)
- **Decided:** a random Child Content Key per child wraps a random key per audio file; the child key syncs through iCloud Keychain; family members get it wrapped to their X25519 keys; standard recovery escrows the child key with a server key; Vault mode is opt-in true end-to-end encryption with a printed Recovery Kit. Text entries are not end-to-end encrypted in v1.
- **Why:** parents will lose passwords; grandparents must be able to play shared letters; "you will not lose your child's voice".
- **Alternatives:** server-managed keys only (no E2EE option); pure E2EE only (unacceptable loss risk); password-derived keys (people forget passwords).
- **Door:** one-way after launch: once recordings are encrypted under a key scheme, changing it means re-wrapping every stored key
- **Reversal cost:** high after launch: key migration across every family's backups
- **Revisit when:** platform: v1.1 backup work starts (D-032 had moved Vault mode, per-child keys and X25519 grants to later)
- **Review by:** on trigger
- **Status:** amended by D-102: recoverable escrow keys and honest copy (founder, 13 Oct, merged 16 Oct); D-100 brings backup into v1.0
- **As built:** not built on `develop`; the backup client and server are open PRs #150 and #151

### ADR-0010 Web app: `apps/web` Next.js on Vercel inside the monorepo
- **Source:** `docs/adr/0010-web-app-placement.md` (Accepted, 2026-10-01)
- **Decided:** `apps/web` is a Next.js app on Vercel in the npm workspaces, sharing pure-TS packages; the web reads Supabase directly with RLS; a waitlist table with an insert-only policy.
- **Why:** one book template for PDF and web; shared engine.
- **Alternatives:** Expo web for marketing pages (weaker SEO and design freedom); a separate repo (loses the shared engine).
- **Door:** two-way: hosting and framework can change without user data
- **Reversal cost:** low
- **Revisit when:** cost: Vercel Hobby terms block commercial use (the cost doc names Cloudflare Pages Free instead); platform: the web contribution page starts (v1.1)
- **Review by:** on trigger
- **Status:** in force
- **As built:** not on this branch: the web app lives on the main branch (PR #55); hosting is Vercel per D-063

### ADR-0016 Lean app, on-demand packs, and server-driven content inside native screens
- **Source:** `docs/adr/0016-lean-app-and-server-driven-content.md` (Proposed, 2026-10-03; implements founder decisions 15 and 16; the hosting choice needs the founder)
- **Decided:** one pack system for every downloadable file (resumable download, SHA-256 against a signed manifest, Application Support excluded from backup, Wi-Fi only above 5 MB); one Ed25519 signing scheme for the manifest, remote config and content; recommended hosting on Cloudflare R2 with pinned Hugging Face mirrors; server-driven content is words only, four block types, never anything that changes data collection, the paywall, layout or navigation.
- **Why:** decision 15 (download under 40 MB, packs are data not code under guideline 2.5.2) and decision 16; full server-driven UI fails offline capture, accessibility testing and App Review 2.3.1.
- **Alternatives:** Apple-hosted Background Assets (iOS 26 and later only; revisit then); On-Demand Resources (legacy); Supabase Storage for models (too expensive at scale); Hugging Face as primary (no SLA).
- **Door:** two-way: the host can change behind the signed manifest; the signing public key ships in the app, so rotating it needs an app release
- **Reversal cost:** medium: changing the signing key needs a release; changing the host is a manifest change
- **Revisit when:** platform: the minimum iOS becomes 26 (Apple-hosted packs); cost: Edge Function invocations for documents pass about $60 a month (the ADR's estimate at 220k MAU; no budget is set in any source)
- **Review by:** on trigger
- **Status:** proposed: the ADR header says Proposed; D-065, D-066 and D-068 adopt its pack, content and config parts; the host (F-1, F-2) is decided as D-097 (merged PR #122) and the ADR's F-2 row says so since PR #126 (merged 18 Oct 2026), though the ADR header still says Proposed
- **As built:** `apps/mobile/src/lib/packs/engine.ts`, `packages/api/src/pack-manifest.ts`, `scripts/packs/publish.ts`

### ADR-0017 API and service standards
- **Source:** `docs/adr/0017-api-standards.md` (Proposed, 2026-10-03; implements founder decision 17)
- **Decided:** every endpoint has a p95 budget from its class, an auth rule (public, user JWT or server only), retry safety (UUIDv7 or an idempotency key kept 24 hours), rate limits, content-free logs with request ids and one response envelope; contracts are typed in `packages/api`; one Supabase region (us-west-1); breaking changes ship as a new major path with a 90-day sunset.
- **Why:** founder decision 17; budgets from PRD 7.2 and TDD 06 3.2.
- **Door:** two-way: internal engineering standards, apart from the region (see D-067)
- **Reversal cost:** low: code and contract tests
- **Revisit when:** scale: 50,000 families (the ADR says no multi-region before then)
- **Review by:** on trigger
- **Status:** proposed: the ADR header says Proposed; D-067 records the founder's decision it implements
- **As built:** `packages/api/src/standards.ts`, `packages/api/src/envelope.ts`, `supabase/functions/_shared/log/log.ts`

### D-023 Sync engine for v1.0: outbox push and cursor pull on expo-sqlite and Supabase
- **Source:** `docs/DECISIONS.md` D-023 (Recommended 2026-10-03; then Decided, founder, 2026-10-03, second round "D-023 decided as outbox+cursor on Supabase"; amends ADR 0004)
- **Decided:** keep expo-sqlite. Writes go through an outbox and one idempotent upsert RPC per batch keyed by client UUIDv7; reads pull rows changed since a server cursor through RPCs that use the same visibility predicate as RLS; a membership change triggers a full re-pull of that book; a server restore epoch makes clients re-upload instead of deleting. Revisit PowerSync at 10k families.
- **Why:** data is tiny and entries are author-owned with an immutable raw transcript, so conflicts are nearly impossible; one visibility definition; no op-sqlite swap; PowerSync cannot replicate `book_entries`, held L4 data without a no-training clause, and its resync could delete letters after a restore (TDD 10, TDD 01, TDD 02, TDD 05, TDD 06).
- **Alternatives:** PowerSync with op-sqlite (ADR 0004); ElectricSQL (rejected in ADR 0004).
- **Door:** one-way after launch: once families sync, the local schema, cursor and outbox format live on their phones
- **Reversal cost:** high after launch: a device data migration and a server protocol change
- **Revisit when:** scale: 10,000 families; technology: photo and audio sync outgrow the simple queue (both from the source)
- **Review by:** on trigger
- **Status:** in force: D-100 (founder, 13 Oct, merged 16 Oct) puts sync in v1.0 and supersedes the on-device-only assumption behind D-085 where they conflict, which was the reason this record was parked (PR #54). How it is built for v1.0 is ADR-0025 (proposed)
- **As built:** `apps/mobile/src/lib/sync/outbox.ts`, `apps/mobile/src/lib/sync/engine.ts`, `apps/mobile/src/lib/sync/merge.ts` (the phone side of protocol v1, PR #146, merged 18 Oct 2026), `supabase/migrations/20261004100000_sync_engine.sql`, `supabase/migrations/20261005000000_family_cap_language_idempotency.sql`
- **Also:** the D-023 entry appears twice in the source; the later "Decided (founder)" entry is the one recorded; ADR-0025

### ADR-0025 Sync protocol v1: outbox push, cursor pull, compare and set on words
- **Source:** `docs/adr/0025-sync-protocol-v1.md` (Proposed, 15 Oct 2026, revised the same day; numbered 0025 by the coordinator on 16 Oct; deciders: founder, since D-023 is decided and this records how it is built; decided at T15, or the spec default in PRD V2 F16 stands); PR #146 (merged 18 Oct 2026)
- **Decided:** not decided. Proposed: keep D-023's transport (`sync_push` as security invoker, `sync_pull` as security definer, rate and payload caps, `child_members` authorisation, results with ids, versions and the caller's own words only). v1 adds a compare and set on words: an `entry.upsert` with a `base` whose words changed since `base` is not applied for the `text` group and answers `conflict_groups` and `current`, and a duplicate answers `applied_v`. A words version `entries.text_xid` stamped by trigger is proposed instead of `sync_xid` (S02 may choose otherwise). On the phone: one op per letter per batch, later queued upserts rebased only on the version this phone's words wrote, and a refused edit kept as a conflict copy. Held drafts become author-only server rows (`held.upsert`, `held.discard`), and an API version is added.
- **Why:** last writer wins on words loses the earlier of two offline edits to `entry_versions`, which the author never sees (F16's P0 gap); the wire contract lives only in the app with no API version; held letters live only on one phone and are lost with it. The alpha on Thu 29 Oct 2026 is the first time two phones sync through staging (the ADR's Context).
- **Alternatives:** keep last writer wins (breaks F16-REQ-010; rejected by R2 AR-02); compare on `sync_xid` as F16 6.2 E words it (raises false conflicts from book and date changes; kept as the fallback); a new local `sync_conflicts` table (needs a new local schema number; `rejected_writes` already has the life cycle); merging words (never: TDD 02 3.6, F16 section 4).
- **Door:** one-way after launch: once families sync, the wire fields, the `base` meaning and the receipts live on their phones and in the server's history; the new result fields are optional, so older and newer apps and servers still talk
- **Reversal cost:** high after launch: a server migration plus an app release that every phone must take; low before the alpha, because the server half is not on `develop`
- **Revisit when:** customer: authors see words-conflict notes often (the ADR expects them to be rare, F16 A1); scale: 10,000 families (D-023's PowerSync revisit); team: S02 chooses a per-row words counter or `sync_xid` instead of `text_xid`
- **Review by:** on trigger
- **Status:** proposed: the ADR header says Proposed. The phone side is merged (PR #146) and the server half (WP-F16-14 compare and set, WP-F16-17 `held_drafts`) is merged in #140 and #208 (23 Oct 2026); the ADR itself is still marked Proposed. Open questions in the ADR: book-setting conflicts stay later arrival plus F12's note; whether `held.upsert` needs compare and set in v1.0; when to refuse API version 0. D-111 item 9 ships held-draft sync on in build 2 unless the held-draft table is not green in `sync-two-phone` by Fri 23 Oct 2026, and item 10 says the first keep's raw transcript stands
- **As built:** `apps/mobile/src/lib/sync/outbox.ts`, `apps/mobile/src/lib/sync/merge.ts`, `apps/mobile/src/lib/sync/types.ts`, `apps/mobile/src/lib/db/migrations.ts` (local schema v6); server half: `supabase/migrations/20261016000000_sync_v1_server.sql` (#208)
- **Also:** D-023; supersedes ADR-0004 for v1.0 once accepted (the ADR's header); D-111 items 9 and 10

### D-024 One visibility predicate: trigger-maintained `book_access` table
- **Source:** `docs/DECISIONS.md` D-024 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** a trigger-maintained `book_access(child_id, profile_id, role, sees_book, sees_pending)` table is the one place visibility lives; RLS helpers, the rewritten `book_entries` view, the pull RPCs and the cross-child leak test all read it.
- **Why:** needed under either sync engine; fixes TDD 02 C2 and TDD 07 Q-01.
- **Alternatives:** keep the `book_entries` view predicate alone (drifts from RLS).
- **Door:** one-way after launch: access rules over live family data
- **Reversal cost:** medium: a migration and access-rule tests
- **Revisit when:** platform: v1.1 sharing work starts
- **Review by:** on trigger
- **Status:** parked: sharing and sync are v1.1 (PR #54)
- **As built:** not built: no migration creates `book_access` on this branch; it is described in `supabase/APPLY.md`

### D-035 Remote config and kill switches in a Supabase table
- **Source:** `docs/DECISIONS.md` D-035 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** one `app_config` table with public read of non-secret keys, service-role write and an audit trigger; bundled defaults; cached values; Edge Functions read kill switches with a 60 s cache.
- **Why:** TDD 01 3.9, TDD 02 2.7 and TDD 10 agree; PostHog flags would depend on analytics consent.
- **Door:** two-way: replaced before it was built
- **Reversal cost:** low
- **Revisit when:** none expected: superseded
- **Review by:** on trigger
- **Status:** superseded by D-068
- **As built:** not built

### D-038 `create_child` rules
- **Source:** `docs/DECISIONS.md` D-038 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** `create_child` is idempotent on the client id; `create_first_run_children` accepts at most 6 first-run children once per account; a book created offline while Plus was active is accepted if Plus covered that moment; a refused book is never deleted or hidden.
- **Why:** TDD 01 X-7, TDD 02 finding 4 and 2.5, TDD 08 2.5 and OQ-1.
- **Door:** one-way after launch: rules over live server data once families sync
- **Reversal cost:** medium: a new RPC version under ADR 0017's rule
- **Revisit when:** platform: v1.1 sync starts
- **Review by:** on trigger
- **Status:** parked: server RPCs are v1.1 (PR #54); the Plus parts are moot under D-053 and D-083
- **As built:** `supabase/migrations/20261003010000_children_and_entitlements.sql`, `supabase/migrations/20261005000000_family_cap_language_idempotency.sql`

### D-041 Two Supabase projects, migrations only from CI on a tag; agent fence on `supabase/` and auth
- **Source:** `docs/DECISIONS.md` D-041 (Recommended, proceed: yes, 2026-10-03)
- **Decided:** `scribe-staging` and `scribe-prod` projects; migrations applied only by `supabase db push` from CI on a release tag; unattended agent runs paused for `supabase/**` and auth until CI and branch protection are on; such PRs need an independent review and the founder's "approve migration" label.
- **Why:** TDD 10 risk 6; one project served as dev and live (APPLY.md).
- **Door:** two-way: environments and process
- **Reversal cost:** low
- **Revisit when:** team: a second engineer joins; cost: Supabase Pro becomes due (the cost doc's trigger is the first real letters on a server)
- **Review by:** on trigger
- **Status:** in force
- **As built:** `.github/workflows/deploy-db.yml`, `.github/workflows/migration-guard.yml`

### D-067 API quality: budgets, auth, idempotency, rate limits, content-free logs, one US region, typed contracts
- **Source:** `docs/DECISIONS.md` D-067 (Decided, founder, 2026-10-03)
- **Decided:** p95 latency budget, auth check, idempotency keys and rate limits on every endpoint; content-free logs with request ids; user JWTs only; CDN plus ETag for public config; Supabase RLS and RPCs in one US region; typed contracts in `packages/api`.
- **Why:** not recorded in the source beyond the founder brief (decision 17)
- **Door:** one-way after launch: the region holds live family data once the server release ships; moving it needs a data migration
- **Reversal cost:** medium: standards are code; a region move is a live data migration
- **Revisit when:** scale: 50,000 families (multi-region, ADR 0017); market: launching outside the US
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/api/src/standards.ts`, `packages/api/src/envelope.ts`
- **Also:** BRIEF-20261003-17

### D-068 Remote config has one source: ADR 0016's signed config document
- **Source:** `docs/DECISIONS.md` D-068 (Decided, coordinator, 2026-10-03)
- **Decided:** remote config comes only from ADR 0016's signed config document; D-035's database table is superseded and not built.
- **Why:** pm-5's finding of two mechanisms on paper.
- **Door:** two-way: internal mechanism
- **Reversal cost:** low
- **Revisit when:** none expected
- **Review by:** on trigger
- **Status:** in force
- **As built:** `packages/api/src/remote-config.ts`, `scripts/packs/remote-config.json`, `supabase/functions/config/serve.ts`

### D-102 Recording backup keys are recoverable through escrow, and the copy says so
- **Source:** `docs/DECISIONS.md` D-102 (Decided, founder, 2026-10-13, PRD V2 M16); PR #128 (merged 16 Oct 2026)
- **Decided:** keep server escrow so a family can recover recordings after losing every device. Copy says recordings are encrypted, that we hold a recovery key under strict, logged access, and that recordings are never read, sold or used to train models. No copy claims "only your family's keys can open it". The escrow key runs only in a separate project and one function; custody, rotation, the access log and owner emails on each use are in PRD V2 F08 section 6.5 and F17.
- **Why:** "so a family can recover recordings after losing every device" (the source). The log gives no other reason.
- **Alternatives:** end to end only (the other option the log lists).
- **Door:** one-way after launch: the copy is a public privacy promise, and every family's backup is wrapped to the escrow key once backup ships
- **Reversal cost:** high after launch: moving to end to end only means re-keying every family's backup, new legal text and telling users; low before backup ships
- **Revisit when:** law: counsel advises against holding a recovery key; customer: families ask for end to end only (ADR 0006's Vault mode)
- **Review by:** on trigger
- **Status:** in force
- **As built:** not built on `develop`; the escrow function is in open PR #151
- **Also:** amends ADR-0006

### D-108 Backup recovery: a device enrolled 7 days approves a restore
- **Source:** `docs/DECISIONS.md` D-108 (Decided, founder, 2026-10-15); PR #128 (merged 16 Oct 2026)
- **Decided:** a device must be enrolled for at least 7 days before it can approve a restore request. F08-REQ-034 is amended to the backup server as built: ten functions and nine settings, not four functions and three secrets.
- **Why:** not recorded in the source
- **Door:** two-way: a server setting and spec text
- **Reversal cost:** low: a server setting; no stored data changes
- **Revisit when:** customer: families are locked out of a restore because no enrolled device is 7 days old
- **Review by:** on trigger
- **Status:** in force: the F08-REQ-034 text in `docs/prd/v2/features/F08-recordings.md` is updated in a follow-up, per the log
- **As built:** not built on `develop`; the backup server is open PR #151

### ADR-0023 Email sign-in links: PKCE, a pending request note, and the claim after consent
- **Source:** `docs/adr/0023-email-links-pkce.md` (status line: Proposed, stream S01, 15 Oct 2026; decider: the founder; until decided the code in PR #139 is the spec default); PR #139 (merged 23 Oct 2026)
- **Decided:** three layers, each enough to stop security review finding H1 alone. (1) The phone writes a Keychain note (the time only, never the address) when it asks for an email, and opens a link only while an unexpired note (1 hour) exists. (2) The Supabase client uses the PKCE flow, so a link from another phone's flow fails at the code exchange; `verifyOtp({ token_hash })` is no longer called. (3) A session is released to sync only once consent is complete and, when the phone's letters belong to no account yet, the person has tapped "Keep them here" on a screen showing the masked account email. A link is refused while any account is signed in on the phone; a typed code works on any phone.
- **Why:** before the change one tap on a link made by anyone signed the parent's phone into the sender's account, and the phone's letters, transcripts and child details uploaded to that account (security review H1). Two sends in a row leave only the newest link working. The challenge method is `plain` because the app's runtime has no WebCrypto digest; the ADR says that is enough for H1 and gives the condition for revisiting it.
- **Alternatives:** the pending note alone (a stolen link plus a recent request would still verify); PKCE alone (device behaviour only partly verified); claim on sign-in with an undo (uploads would already have happened); `verifyOtp` with PKCE on (accepts a link from anyone). All rejected in the ADR.
- **Door:** two-way: auth code and copy; no user data depends on the link format
- **Reversal cost:** medium: auth code and tests, plus the device checks AUTH_SETUP 11.3 and 11.10 again
- **Revisit when:** technology: the runtime gets WebCrypto digest or a maintained native shim is adopted (move the challenge to S256; a new native module needs the founder)
- **Review by:** on trigger
- **Status:** in force as the spec default: the ADR is still marked Proposed and its acceptance by the founder is not recorded in the source. Device checks AUTH_SETUP 11.3 and 11.10 must pass before C1 (the ADR's consequences)
- **As built:** `apps/mobile/src/lib/auth/email-link.logic.ts`, `apps/mobile/src/lib/auth/account-claim.logic.ts`, `apps/mobile/src/lib/auth/pending.ts`, `apps/mobile/src/lib/supabase/client.ts`, `apps/mobile/src/app/(auth)/sign-in/verify.tsx`
- **Also:** closes BL-347; F02-REQ-018 to F02-REQ-020

### ADR-0024 Owner backup v1.0: a key per (child, author), a device key per install, a recovery-key access log
- **Source:** `docs/adr/0024-owner-backup-v1.md` (status line: Proposed, 15 Oct 2026; owner S05; decided at T15 or the spec default stands); PR #150 (client, merged 23 Oct 2026, flag off); PR #151 (server half)
- **Decided:** each author backs up and restores only their own recordings. Keys: a random file key per recording, wrapped under a book key that is one random 256-bit key per (child, author, version) in a synchronizable Keychain item; one X25519 device key pair per install and account, kept on that device only. The escrow function seals released keys to an enrolled device, every release is logged, and the object format is written once in TypeScript over a two-call native seal and open. Backup has its own build flag, `capabilities.backup`, off in every profile, and the native module `scribe-keys` is excluded from autolinking until a Mac build has compiled it.
- **Why:** with one key per child (ADR 0006) the second parent cannot open the first parent's key, and creating their own collides with it (review R2 AR-05); D-102 keeps server escrow, so a family that loses every device gets its recordings back, with honest copy. CryptoKit does what backup needs, so no third-party crypto library is added (D-065).
- **Alternatives:** one key per child; `react-native-quick-crypto`; whole-file encryption in Swift; password-derived keys; no escrow (Vault mode, later); an escrow key in a cloud KMS (later ADR); sending a plaintext book key to the server. Each rejected in the ADR with a reason.
- **Door:** one-way after launch: key and object formats cannot change once families hold encrypted backups
- **Reversal cost:** high once recordings are backed up: a new format needs a migration of every stored object and every wrapped key; before the flag turns on, code only
- **Revisit when:** customer: family listening is wanted (v1.1, D-073); technology: a Mac or macOS CI build first compiles `scribe-keys` (remove the autolinking exclusion); platform: the runtime lacks the iOS 17 HPKE floor (D-098)
- **Review by:** on trigger
- **Status:** in force as the spec default: the ADR is still marked Proposed and its section 9 lists items for the coordinator and the founder (the access-log design, the Keychain service name `scribe.backup`, #151's eight deviations from F08 6.5, a counsel question on a `backup` consent act); acceptance is not recorded in the source
- **As built:** `apps/mobile/modules/scribe-keys/`, `apps/mobile/src/lib/backup/`, `apps/mobile/src/app/settings/backup.tsx`, `packages/content/src/features/backup.en.ts`; flag off in every profile
- **Also:** amends ADR-0006 (decision items 1 to 4); implements D-073, D-102, D-104 item 2 and D-108

### D-116 A former member's letters survive the remaining parent's book deletion
- **Source:** `docs/DECISIONS.md` D-116 (Delegated call by the coordinator, founder may reverse, 23 Oct 2026); PR #248 (merged 23 Oct 2026) and review A note N1 on #151
- **Decided:** when the remaining parent deletes the book or their account, the letters, held drafts and recording backups of anyone who left, whose join was undone or who was removed stay theirs. The `children` row stays tombstoned (`purged_at`) with the name and dates for the kept letters' labels, readable by no app role until the left-book listing (BL-444) serves it to kept authors only, and goes once nothing of theirs is left. Current members are purged as before. `undo_parent_join` no longer deletes the removed parent's held drafts on the server.
- **Why:** the constitution (the machine never destroys a person's words without their own ask) and DATA-REQ-014, the equals rule: one parent's delete is never the end of another person's words (source).
- **Door:** one-way after launch: once the policy line promises what is kept, and once kept letters exist, undoing the rule would delete a person's words
- **Reversal cost:** high: counsel wording on three privacy policy lines, a migration, and loss of kept letters
- **Revisit when:** law: counsel words the policy lines (the source names `privacy-policy.md` lines 159, 179 and 235 as still saying everything is removed); technology: BL-444 serves kept books to their authors
- **Review by:** on trigger
- **Status:** in force; waits on counsel for the policy text
- **As built:** migration `20261023010000_s02_purge_and_consent_guards.sql`; `docs/legal/DATA_CLASSIFICATION.md` (L4 retention row) and `docs/legal/DELETION_AND_EXPORT_SPEC.md` section 2.3
- **Also:** relies on D-113; amends the book purge under D-111 item 7
