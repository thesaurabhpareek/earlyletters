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
- **Status:** proposed: the ADR header says Proposed; D-065, D-066 and D-068 adopt its pack, content and config parts; the host (F-1, F-2) is decided as D-097 (merged PR #122), though the ADR header still says Proposed
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
- **Status:** parked: v1.0 has no sync (PR #54, D-085)
- **As built:** `apps/mobile/src/lib/sync/outbox.ts`, `apps/mobile/src/lib/sync/engine.ts`, `supabase/migrations/20261004100000_sync_engine.sql`
- **Also:** the D-023 entry appears twice in the source; the later "Decided (founder)" entry is the one recorded

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
