# Next set of requirements, lane D: engineering feasibility and architecture

Status: Draft 1, 8 Nov 2026. Docs only. Owner: lane D of the "next set of requirements" programme. Written from `origin/develop` at `cda0ba83`. This file changes no decision and edits no other file. Build 11 is on TestFlight; the store go/no-go is Mon 9 Nov 2026 (D-130).

Reads: `CLAUDE.md`, `docs/engineering/PRINCIPLES.md`, `docs/ARCHITECTURE.md`, `docs/adr/` (0001, 0002, 0004, 0006, 0007, 0010, 0013, 0016, 0024, 0025), `docs/backlog/FUTURE.md`, `docs/backlog/FUTURE-REBASELINE-2026-10-28.md`, `docs/backlog/future/*`, `docs/prd/v2/05-feature-map.md`, `06-nfr.md`, `08-delivery.md`, `docs/qa/*`, and the code under `apps/mobile`, `apps/web`, `packages/*`, `supabase/*`. The QA bug-hunt note (`product/qe-bug-hunt-2026-11-08.md`) lives in the Claude project, not in the repo; this lane could not open it, so part 3 uses only what the repo and GitHub show. Anything it adds is for the founder to merge in.

Labels: **[F]** fact with a path or a command, **[E]** estimate, **[A]** assumption, **NOT VERIFIED** nothing in the repo or on a fetched page backs it. No performance number in this file was measured; where a number appears it is quoted from a budget in `06-nfr.md` and is a target, not a result.

## 0. The short read

1. **Every change to app code is a store release.** `expo-updates` is not installed [F: absent from `apps/mobile/package.json` and `app.config.ts`; `capabilities.ts` says so in its header]. The only things that move without a store build are signed remote config, content blocks, language packs, Edge Functions, the website and App Store Connect settings (ADR 0016). So "over-the-air safe" in this file means "no app release". Everything else waits for review.
2. **The server half is built and unproven.** Sync (ADR 0025), backup, invites, deletion and the status report exist in code and tests, and none has a committed device or two-phone evidence file [F: `docs/qa/evidence/` holds only `README.md` and `TEMPLATE.md`]. Every family feature on the list stands on that.
3. **The founder is the bottleneck, not the agents.** The plan of record assumes about 12 founder merges a week, 22 minutes for an unfenced PR and 45 for a fenced one [A: `08-delivery.md` 6.1]. Fenced paths (`supabase/**`, `lib/{auth,supabase,billing,backup,sync,db}`, `modules/**`, `packages/api/**`) are where most of the next set lands.
4. **Three architecture decisions block most of it:** the guest and web identity model, shared-voice key distribution with the media pipeline, and the update channel before the store freeze (part 2: AD-1, AD-2, AD-3).
5. **Do the reliability work first** (part 3). 125 PRs are open, no device evidence is committed, and the 28 Oct baseline never counted the staged 1.0.x server releases.

## 1. Item assessments (30 items)

### 1.1 How to read the sizes

- **Size** is person-days of agent build plus the review pass (independent review agent, then the founder). **S** 1 to 3, **M** 4 to 10, **L** 11 to 25, **XL** over 25. [A: one person-day is one agent working day that ends in reviewed, merged PRs under 400 lines and 20 files (CODE-R02). Not calibrated: no throughput has been measured on this repo. To measure, count merged PRs per week from `gh api repos/thesaurabhpareek/earlyletters/pulls?state=closed` for the first two shipped items and rescale every size by the ratio.]
- **Ship path:** **App** = store release (JS only). **Native** = new native code, permission string, entitlement or dependency: needs a dev-client rebuild, a macOS CI compile and a device check on top. **No release** = signed pack, config, content, Edge Function, web or App Store Connect only.
- **Schema/RLS:** whether a migration is needed. Every migration is a new file, reaches production only from CI on a tag (D-041), carries its own grants and a line in `supabase/tests/grants.mjs`, and needs `red-team` review for `supabase/**`.
- **Chapters** are `docs/engineering/NN-*.md` (01 code and change, 02 API, 03 database, 04 data quality, 05 identity and access, 06 security, 07 privacy, 08 data rights, 09 AI-assisted, 10 logging).
- Items group FUTURE.md ids (CVL, FAM, BK, G, T5), the feature map F31 to F49 and the FB items of the 28 Oct re-baseline.

### 1.2 Summary table

| # | Item (ids) | Size | Ship path | Schema/RLS | Chapters |
|---|---|---|---|---|---|
| 1 | Quick capture: App Shortcuts, widget, lock screen, Action button (CVL-13, CVL-14, BK-11) | L | Native | No | 01, 07 |
| 2 | Photo with a letter; short video (CVL-10, CVL-11, F46, BK-17) | L photo, XL video | Native | Yes | 03, 04, 07 |
| 3 | Voice-note import (CVL-12); Apple Watch (CVL-15) | M import, XL Watch | Native | Import no, Watch no | 01, 07 |
| 4 | Hindi and English in one letter, language chip, transcribe again (CVL-01, 06, 07; F33, F38) | L | App + packs | No | 04, 09 |
| 5 | More languages and native review (CVL-02, 16, 17, 18; FB-02; F45) | M per language, M harness | No release for packs; App for the picker | No | 04 |
| 6 | Prompts v3, prompts in the author's language, names that learn (CVL-08, 09, 03) | M | Content: no release; selection logic: App | No | 01, 04 |
| 7 | Word timings and Read together highlight (CVL-20, BK-01, F34) | L | App | No | 04 |
| 8 | Server transcription fallback with consent (F35, T5-07) | L | App + Edge Function | Yes (consent, quota) | 06, 07, 09 |
| 9 | Safety classifier, clinician-gated (F39, OPEN-01) | M | App | No | 07 |
| 10 | Shared voice: family hear each other's recordings (F31, FAM-03) | XL | Native + server | Yes | 03, 05, 06 |
| 11 | Family contributors in the app, roles, the safety floor, Report a concern (F32, FAM-01, 02, 11, 15; T5-13) | XL | App + server | Yes | 05, 07, 08 |
| 12 | Family notifications, invites by message, reactions, digest, shared prompts (FAM-17, 04, 06, 09; FB-03) | L | Native (push) + server | Yes | 05, 07, 10 |
| 13 | Web contribution page and guest author (F37, FAM-05, FAM-07) | XL | No release (web) + server | Yes | 05, 06, 07 |
| 14 | Continuity: legacy contact, author death, handover at 18, two accounts on a phone, multi-generation (T5-12, FAM-08, 10, 12, 13) | L | App + server | Yes | 05, 08 |
| 15 | Sealed, birthday, milestones, On this day, Year page (BK-03 to BK-07; F41, F47) | M | App | Sealed: yes | 03, 05 |
| 16 | Search, people, occasions (BK-09) | M | App | No (local) | 03, 04 |
| 17 | Save to Photos, year-in-voices audio, keepsake widgets, themes (BK-08, 10, 11, 19) | M | Native for widgets | No | 07 |
| 18 | Web reader, readers who do not write (BK-12, FAM-06) | L | No release (web) | Yes (reader role) | 05, 06 |
| 19 | Print-ready file, printed book, QR, gift editions, Book at 18 (BK-13 to 16, 18; F42; T5-27) | L file, XL fulfilment | App file; web checkout | Yes (orders) | 02, 06, 07 |
| 20 | Rating ask, in-app events, ASO, onboarding tests, lifecycle email (G-03 to 08, 11, 13, 14) | S each | Mostly no release | No | 07 |
| 21 | Plus follows the book (G-09, FAM-16) | L | App + server | Yes | 02, 05 |
| 22 | Gifting, lifetime, win-back, offer codes, price and trial tests (G-10, 15 to 19; F43) | M | App + App Store Connect | Maybe | 02 |
| 23 | Billing trust charter and plan reminder follow-ups (FB-01, G-12) | S | App + content | No | 07 |
| 24 | Android app (F36, T5-16, FAM-14, G-21) | XL | Native (everything) | No | 01, 06 |
| 25 | Web platform and web deletion (T5-17, F37 base) | L | No release (web) + server | Yes | 05, 08 |
| 26 | Vault mode, passkeys, recovery (F48, T5-06, 10, 11) | XL Vault, M passkeys | Native | Yes | 05, 06 |
| 27 | Realtime co-parent updates and sync scale (T5-22) | M | App + server config | No | 02, 03 |
| 28 | Age signals, claims guards, data minimisation (T5-15, 08, 09, 01) | M | App | No | 07 |
| 29 | iPad, UI localisation, accessibility beyond AA, app lock (T5-14, 18, 19, 20; F44) | L as a bundle, M each | App | No | 01 |
| 30 | Operations: remote config matured, support, status page, cost caps, insights loop, assurance, import (T5-02 to 05, 21, 23 to 26) | L as a bundle | Mostly no release | No | 10 |

Items 3, 5, 19 and 26 hold parts we recommend not building now (Watch, languages with no reviewer, print fulfilment, Vault), so the bands are not a total of effort.

### 1.3 Per-item detail

Each item: **Exists** (with path), **Missing**, **Depends**, **Evidence** (tests and devices), **Pre-mortem** (one way it fails). Items 1 to 9 are capture.

**1. Quick capture.** Exists: recorder and kill-safe container (`lib/capture`, ADR 0027), reminders (`lib/reminders`). Missing: any App Intent, WidgetKit target, App Group or Live Activity; no widget code anywhere in `apps/mobile` [F: grep]. Needs a config plugin for an extension target, and a shared container so the extension can start a take without opening the database in a second process. Depends: recorder must be proven safe to start from a cold intent (the lock screen case, CVL-14, is the riskiest). Evidence: Simulator kill harness extended to the new entry; a real iPhone for lock screen and Action button; the data-loss gate (500 of 500 kills, `ALPHA_GO_NO_GO.md` B2-11) re-run. Pre-mortem: a take started from a locked phone is lost on a kill and the 0-lost rule fails; or two processes open the SQLite file and corrupt it.

**2. Photo and video.** Exists: `entries.photo_path` and an `entry-photos` bucket with an author insert policy (`supabase/migrations/20260930000000_scribe_core.sql:137,291-294`), a purge path for photos (`20261028000000_pg_temp_last_and_purged_photos.sql`), export schema fields. Missing: capture UI, picker (no `expo-image-picker` or `expo-camera` in `package.json`), local storage and an upload queue, member read policy (NOT VERIFIED), video bucket and size limits. Depends: the media pipeline in AD-2; item 28 for the child-identity rule (a photo of the child is L4). Evidence: sync of a blob over a dropped connection, deletion and purge of a photo (AL-07 style), storage RLS allow and deny tests, low-space behaviour on an SE 3. Pre-mortem: a photo survives a letter deletion because the purge queue misses a path, which breaks the deletion promise (DSR-R04).

**3. Voice-note import and Apple Watch.** Exists: audio container and enhancement (`lib/audio-enhance`, `lib/capture`). Missing: document picker and share extension for import; a watchOS target for Watch. Import is M because audio is already first-class. Watch is XL: a second app target, its own transfer path, its own kill-safety proof. Recommend Watch is not scheduled. Evidence: imported file with no sound, very long file, a format the recorder cannot read. Pre-mortem: imported audio of someone else (a WhatsApp voice note) enters the book, which raises a consent question for counsel that engineering cannot answer.

**4. Hindi-English and per-letter language.** Exists: `packages/core/src/lang/` (engine, script handling), seven text-rule packs in `packs/text-rules/`, `ENGLISH_ONLY` switch (`capabilities.ts`), language hold (`lib/transcription-queue/language-hold.ts` per the header). Missing: mixed-script output with the author's script choice, "not written down" markers, tap-to-hear, re-transcribe flow. Depends: FB-02 harness, CVL-02 native review, and an open question: Hindi on-device speech support has no source either way (re-baseline FB-02). Evidence: per-language recorded test clips on the SE 3 (FB-02), verifier suite with zero accepted meaning changes (never waived), native-speaker review. Pre-mortem: the verifier passes a code-switched edit that changes meaning because the rule tables were written for single-language text.

**5. More languages.** Exists: speech catalog and downloads (`lib/models`, ADR 0015), packs as signed data (`packages/api/src/pack-manifest.ts`). Missing: a repeatable per-language proof (FB-02), native reviewers, Cantonese and Indian-language tables. Packs ship without an app release once the picker and engine support the language; unproven per language. `TRUSTED_SIGNING_KEYS` was empty on `develop` at the 27 Oct check (D-115); re-check before relying on pack delivery. Evidence: FB-02 on the minimum device for each language at each build. Pre-mortem: Apple lists a locale that does not work (the Arabic case, FB-02) and a pack ships on the list alone.

**6. Prompts v3, names that learn.** Exists: `packages/content/src/prompts.ts` (111 prompts), `packages/core/src/prompts.ts`, `followups.ts`, the dictionary (`dictionary_terms`, `lib/db`). Missing: repeat suppression across seasons, opt-in occasion prompts, prompts per spoken language, learning terms from Review edits on the phone. Prompt text can move through server-delivered content blocks (ADR 0016); selection logic is app code. Evidence: unit tests on selection; content rules test (no streaks, no gaps counted). Pre-mortem: "names that learn" stores a child's name in a place the log or analytics path can reach (PRIV-R10).

**7. Word timings and highlight.** Exists: Read together (`app/read-together.tsx`), `whisper.rn` 0.7.4, ADR 0009 plan. Missing: reliable word timing per language (whisper token timestamps are marked experimental in ADR 0001), sentence-level fallback. Depends: item 5 per language. Evidence: timing error measured against hand-aligned clips on the SE 3 (method: play the clip, compare highlight to the audible word; no number exists today). Pre-mortem: highlight drifts on long letters and parents read the app as broken.

**8. Server transcription.** Exists: ADR 0002 (hosted open Whisper), consent concept, `packages/api` envelope. Missing: the Edge Function gateway, quota, consent record, a subprocessor entry, the audio upload path. Cost is budgeted at $0 for v1.0 (`06-nfr.md` 15). Depends: counsel (LEGAL-REQ-004, -005), item 28. Evidence: a function test that no audio or text reaches logs, a consent-denied path, a timeout path. Pre-mortem: audio goes to a provider that logs it for 30 days (ADR 0002 notes a retention window) while the privacy page says otherwise.

**9. Safety classifier.** Exists: `packages/core/src/safety.ts` (deterministic patterns, header says pending perinatal clinician review), tiers stay on the device. Missing: clinician sign-off, which is the real gate; the Help surface exists as a static row (B7). Evidence: pattern tests with Asha fixtures, clinician review record. Pre-mortem: a pattern fires on joy and the app responds with concern copy that breaks the voice rules.

**10. Shared voice.** Exists: backup key model per (child, author) (ADR 0024, `modules/scribe-keys`, `lib/backup`), `escrow` Edge Function with unwrap logging (`escrow_unwraps`), `audio_blobs`, `child_keys`, `child_members`. Missing: any path for a second member to decrypt another author's recording; `book_access` does not exist in any migration [F: grep of `supabase/migrations`]; member playback is explicitly out of v1.0 (`06-nfr.md` 17). The nfr assumes escrow unwraps under 1 per hour at 1k families [A]; per-play unwraps would break that assumption (AD-2). Evidence: two phones on two Apple Accounts, leave and remove-member revoke playback, key rotation test, deny test for a removed member, the D-041 red-team pass. Pre-mortem: a removed co-parent keeps a cached key and can still decrypt.

**11. Contributors.** Exists: `MEMBER_ROLES` of `parent` and `contributor` (`packages/core/src/domain.ts:37`), `child_members`, `child_invites`, invite redeem (`supabase/functions/invite-redeem`), the two-parent cap, co-parent screens hidden in the store build (D-126). Missing: contributor write limits proven by tests, approval flows, report a concern, separation and abuse floor (FAM-11), counsel (D-050). Depends: AD-1, item 12 for notices. Evidence: access matrix rows allow and deny for contributors (`supabase/tests`), AL-05 style two-phone run with a third account. Pre-mortem: a contributor can read letters the parent marked private, because role was checked in the UI only.

**12. Notifications, invites, reactions.** Exists: local reminders (`lib/reminders`, `expo-notifications`), invite links (`lib/family/invite-link.logic.ts`, web `/j`). Missing: remote push at all (no token registration code [F: grep]), a sender, preferences, a digest job. Content-free payloads only (PRIV-R10). Depends: AD-4 (APNs route), AD-1. Evidence: a push payload test proving no names or words, quiet-hours test, device test on a real phone (whether the Simulator can receive APNs pushes is NOT VERIFIED). Pre-mortem: a notification preview shows a child's name on a lock screen.

**13. Web contribution page and guest author.** Exists: `apps/web` (landing, signup, `/j` invite landing, `/auth/confirm`, legal pages, unsubscribe, notify API) on Next 16.3.8 [F: `apps/web/package.json`]. Missing: guest identity, write-only contribution, abuse limits, audio upload from a browser, moderation, the second-product support load (TDD 10 risk 10). Depends: AD-1, item 11 roles, item 25. Evidence: Playwright journeys (the repo has `apps/web/e2e` and a journeys workflow, #534), rate-limit tests, Safari on iPhone and Android Chrome checks, a11y run. Pre-mortem: a public link is guessed or shared widely and strangers add content to a baby book.

**14. Continuity.** Exists: deletion worker (`purge-worker`), legal holds, restore requests. Missing: legacy contact, fiduciary runbook, handover at 18, two accounts per phone. The hard parts are legal (counsel licence before about 1,000 books have family members, FAM-12). Evidence: runbook rehearsals, membership transfer tests. Pre-mortem: handover gives an adult child access to letters the other parent wrote privately.

**15. Sealed, birthday, firsts, On this day, Year page.** Exists: month chapters and shelf (`components/book`), date sheet. Missing: all of the above [F: no sealed or On this day code]. Sealed letters must hide words from the other member on the server too, so they need an `open_at` rule in RLS or the sync view, not just a UI flag (IAM-R02). Evidence: clock-change tests (time zone, manual clock), a sealed letter on the co-parent's phone. Pre-mortem: a sealed letter is readable in the export or the co-parent's sync before its date.

**16. Search.** Exists: nothing [F: no FTS in `lib/db/migrations.ts`]. Local SQLite via `expo-sqlite` 57. Missing: an index and a People/occasions facet. Whether the bundled SQLite has FTS5 is NOT VERIFIED; check the installed `expo-sqlite` source before choosing (AD-6). Evidence: a perf build on year-5 fixture (1,200 letters, `06-nfr.md` 4) with the method written first; local migration test on upgrade (RT-LCH-04). Pre-mortem: the index migration fails on a real library (see J13 flake in part 3).

**17. Keepsake extras.** Exists: the PDF export port (`lib/export/pack.ts` `renderPdf`), `expo-print`, `expo-sharing`. Missing: image card rendering, Photos save permission string, audio concatenation for "the year in voices", widgets (see item 1). Evidence: file opens in Photos and Files on a device; the copy says no machine-written text. Pre-mortem: a keepsake leaks a child's name into a filename shared to another app.

**18. Web reader.** Exists: nothing for reading on the web [F: `apps/web` has no book route]. ADR 0010 says web reads Supabase directly and audio needs an Edge Function that unwraps. Depends: AD-1, AD-2, item 25. Evidence: RLS deny for non-members from a browser session, CSP and cache headers on content pages. Pre-mortem: a cached page holds letter text on a shared computer.

**19. Print.** Exists: on-device PDF (`renderPdf`), export pack, ADR 0007 (Lulu Print API, card checkout). Missing: bleed and trim geometry, fonts embedded, colour handling, imposition for a print vendor, QR resolver that lasts decades, order table, tax, returns, Print Terms, entity (D-004 and D-125). The file can ship without any commerce; fulfilment cannot (AD-5). Evidence: a proof printed and read by a human; PDF preflight with a named tool (NOT VERIFIED which). Pre-mortem: a 200-page book fails on an SE 3 for memory and no print ever completes.

**20. Growth levers.** Exists: nothing needed beyond content and App Store Connect for ASO, events, custom pages. G-03 needs `expo-store-review` (not installed; native). Lifecycle email rules are in `packages/emails`. Analytics are off in every profile (D-088), so any test arm (G-07) has no measurement. Evidence: store-side numbers only. Pre-mortem: a rating prompt appears on a day a parent just recorded something sad.

**21. Plus follows the book.** Exists: `plan.ts` and the free-letter ledger (`lib/billing/letter-ledger*`), `store_subscriptions` and `subscription_status` tables (`20261016001000_subscription_status.sql`), the status report. ADR 0013 chose device-only checks. Missing: a server entitlement that a co-parent outside the Apple Family can use. Decision M17 gives the co-parent their own free letters then Plus, so this item is a pricing change, not a bug. Evidence: StoreKit sandbox runs (AL-09) on three accounts. Pre-mortem: a server ledger returns and brings back the receipt-validation work ADR 0013 removed.

**22. Gifting, lifetime, offers.** Exists: offer-code redemption shipped in v1.0 (FUTURE.md L3), StoreKit config in `apps/mobile/storekit`. Missing: gift flow (Apple has a rule set for gifting in-app purchases; NOT VERIFIED here), lifetime plan written as irrevocable, price tests. Evidence: sandbox for each product, claim registry rows. Pre-mortem: a "lifetime" product conflicts with the Terms and the shutdown pledge.

**23. Billing trust charter.** Exists: plan reminders (`lib/billing/plan-reminders.logic.ts`), `BL-342`. Missing: claim rows, 2-business-day support promise, refund copy. Evidence: S16 claims list. Pre-mortem: copy promises a refund path Apple controls.

**24. Android.** Exists: `app.config.ts` has an `android` block; Kotlin stubs for `scribe-audio` (53 lines) and `scribe-store` (60 lines); no `android` directory in `scribe-keys` or `scribe-files` [F: `find apps/mobile/modules`]. Haptics have an Android file. Missing: key storage and encryption on Android Keystore, file module, Play Billing (Apple-only billing today, ADR 0013), whisper.rn verification on Android, notifications, Play account (entity), Android budgets (parked in `06-nfr.md` 17). Evidence: a physical mid-tier Android phone (none owned, NOT VERIFIED), the whole device test plan again. Pre-mortem: the solo founder inherits a second platform's support and Play policy surface while iOS is unproven.

**25. Web platform and deletion.** Exists: marketing site, legal pages, `/auth/confirm`, `/j`, unsubscribe. Missing: signed-in web session model, web account deletion flow (D-042), `apps/web` auth. Depends: AD-1. Evidence: the deletion drill from the web (AL-07 extended). Pre-mortem: a web session survives "sign everyone out" because the force-reauth epoch (#657, draft) is read by the app only.

**26. Vault, passkeys, recovery.** Exists: escrow key model (ADR 0024). Missing: passkeys need an associated-domains entitlement and server support; Vault means the server cannot recover, which removes web audio and shared playback for those books (ADR 0010). Recommend Vault only on proven demand (F48). Evidence: recovery drill, lost-phone drill. Pre-mortem: a parent chooses Vault, loses the phone, and the book is gone with no recourse.

**27. Realtime and sync scale.** Exists: outbox and cursor sync with a 15 s pull for shared books (ADR 0025, `lib/sync`), watermark rules, `sync_epochs`. Missing: the G4 load run is not shown as done [F: no evidence file]; realtime channels. Targets live in `06-nfr.md` 4 and 16 and are unmeasured. Evidence: the two-client freshness probe and a k6 run exactly as written in `06-nfr.md` 16. Pre-mortem: a long-running transaction stalls the pull watermark and a co-parent sees nothing for minutes (F16-REQ-027 exists for this).

**28. Age signals, claims, minimisation.** Exists: 18+ gate (`lib/age-gate*`), claims tests (`packages/content/test`), data map. Missing: the platform age signal for California AB 1043 and Texas SB 2420 (counsel decides whether 1 Jan 2027 binds, T5-15), a Declared Age Range API integration [NOT VERIFIED which Apple API is final]. #635 (Before you begin) is open at 851 additions over 27 files. Pre-mortem: the signal arrives after the dates and the app is out of compliance on day one.

**29. Polish bundle.** Exists: `uniwind` styles, design tokens, `lib/a11y*`, `app-lock` module (`lib/app-lock`), content only in English (`*.en.ts`). Missing: iPad layouts, string localisation scaffolding, RTL (`06-nfr.md` 9). Each is M; localisation also needs native reviewers. Pre-mortem: Spanish UI copy breaks the voice rules because the content test is English only.

**30. Operations bundle.** Exists: `/ops` health work, runbooks, `config` and `content` Edge Functions, `scripts/status`. Missing: help centre, status page, cost caps, assurance (pen test is a founder purchase). Mostly no release. Pre-mortem: support volume from a second platform or web page arrives before any tool exists.

## 2. Architecture decisions the next set forces

Each: options, a recommendation, and the way back. "Way back" means what it costs to undo.

**AD-1. Identity for guests and the web (blocks items 11, 13, 18, 25, 24 as co-parent route).**
- (a) Guests get a Supabase auth user (anonymous or email). Familiar, but every guest becomes an account, with deletion and data-rights duties, and a roles model that must express "may only add".
- (b) Guests hold a scoped, short-lived token minted by an Edge Function from an invite code: write-only, one book, rate limited, no read, no account. Less surface; needs its own audit and abuse controls.
- (c) No web write at all until the app has contributor roles; guests only read via a reader link.
- Recommend (b) for contribution, with (c) as the first release of the web (read nothing, write one letter). It matches IAM-R02 (membership of a book with one role) if the token maps to a `contributor` row that cannot read.
- Way back: tokens are additive and revocable per book; a server kill switch and the invite table already exist. Cost to unwind is a feature flag, not a migration.

**AD-2. Media pipeline and key distribution (blocks 2, 3, 10, 11, 13, 18, 19).**
- (a) Per-play unwrap through the escrow function. Reuses code, breaks the "under 1 unwrap an hour" assumption [A, `06-nfr.md` 16], and puts the escrow project on the hot path.
- (b) Wrap each child key to each member's device key at join and on rotation. No server hot path; needs a key-sync design, revocation on remove-member and an Android equivalent.
- (c) A separate listening copy for family, stored server-side with member-only signed URLs and no end-to-end claim. Simplest; changes the privacy story that backup is encrypted on the device (D-102).
- Recommend (b) for parents and (a) only for web reads with a hard rate limit, after the security-architect writes the threat model first (PRINCIPLES 16). One media upload queue serves photos, video, voice and audio, and must land before any of them.
- Way back: keep playback behind a flag and a kill switch; wraps are additive rows; dropping them returns to v1.0 behaviour.

**AD-3. Update channel before the store freeze (blocks the cadence of every fix).**
- (a) None, as today. Every fix needs App Review.
- (b) Install `expo-updates` but disabled in config, so a signed JS patch path exists without a native change later. Adds code Apple 2.5.2 and the Notes for Review must describe; the dormant-code paragraph already exists in the store proposal (re-baseline 3b).
- (c) Server-driven only (ADR 0016): copy, prompts, flags and kill switches, which cannot change collection or the paywall (BRIEF decision 16).
- Recommend (c) now and decide (b) with `security-architect` and the founder before the freeze, because adding it afterwards is a native change and most installs would not have it. NOT VERIFIED: whether Expo's update signing is enough for the supply-chain rule (SEC-R10); check the Expo docs before deciding.
- Way back: remove the dependency in the next native build; installs that took an update keep it until replaced.

**AD-4. Push (blocks 12, and so 11, 14).**
- (a) APNs direct from an Edge Function with a token-based key. No new subprocessor, but a secret to rotate and an HTTP/2 client to prove on the Edge runtime (NOT VERIFIED).
- (b) Expo push service. Easy, adds a subprocessor that holds device tokens.
- (c) Local notifications only plus the status email.
- Recommend (c) for the next set, then (a) once item 12 is wanted; payloads are always content-free.
- Way back: tokens in their own table with a purge path; drop the table to stop.

**AD-5. Print (blocks 19).**
- (a) Print-ready PDF only; the family uses any printer or service. No commerce, no entity gate, no tax.
- (b) Card checkout on the web with a print API (ADR 0007: Lulu), physical goods outside in-app purchase. Needs entity, Print Terms, orders, returns, customer support.
- (c) A partner white-label with their checkout.
- Recommend (a) first (BK-13) and measure demand, as the re-baseline's go/no-go on 19 Jan 2027 suggests; (b) only after the entity decision (due Fri 13 Nov per D-125) and counsel.
- Way back: a file export is additive; no payment surface exists until (b).

**AD-6. Search (blocks 16).**
- (a) FTS5 index in the local SQLite, built from entries, rebuilt on demand. Device only, content never leaves.
- (b) Server search: would put letter text into a search index outside the device; conflicts with the content-free rule for logs and the privacy story. Not recommended.
- (c) In-memory filter over the loaded list; fine to a few hundred letters.
- Recommend (c) as a spike first and (a) if the year-5 fixture is slow, after confirming FTS5 in the installed `expo-sqlite`. 
- Way back: the index is derived data; dropping the table loses nothing.

**AD-7. Sharing beyond the co-parent (blocks 17, 18, part of 13).** Options: system share sheet of a rendered card or audio file (device only), links to a web page (server, AD-1), or nothing. Recommend the share sheet first (Save to Photos, BK-10); links wait for the web reader. Way back: feature flag.

**AD-8. Backup and recovery (touches 10, 24, 26).** The built design is a key per (child, author), server escrow, owner-only recovery (ADR 0024, still "Proposed" in its header). Options: keep escrow as the default; add iCloud Keychain family key (ADR 0006's first plan, needs a custom module); Vault opt-in. Recommend keeping escrow and finishing the restore drill (AL-06, `BACKUP_RESTORE_DRILL.md`) before building on it; `scribe-keys` is excluded from autolinking in `apps/mobile/package.json` today, so turning backup on is a native change, which must be one planned build. Way back: the backup flag is a build flag plus a kill switch (`capabilities.ts`).

**AD-9. Sync scale (touches 12, 27).** Options: keep outbox plus cursor on Postgres (D-023); add realtime channels for shared books; move to PowerSync at the D-023 trigger of 10k families. Recommend staying and instrumenting: run G4 first; there is no measurement. Way back: any pull transport is additive to the outbox.

**AD-10. Plus across the family (item 21).** Options: keep device-only checks (ADR 0013); add a server entitlement ledger fed by App Store Server Notifications; use offer codes as a patch. Recommend keeping device-only until Study 3 shows co-parent demand (FAM-16 is a requirement only). Way back: the status tables already exist, so a ledger can be added without touching the phone logic.

**AD-11. Android (item 24).** Options: (a) not before v1.3; (b) full Expo Android build; (c) Android co-parents via the web contribution page and reader. Recommend (c) first, as it answers the FAM-14 counter question with no second platform, then (b) only when G-21's four gates pass (web deletion, G-09, entity, Play account). Way back: cheap for (c); (b) is a permanent platform commitment.

### 2.1 The three that block the most

1. **AD-1 (guest and web identity)** blocks items 11, 13, 18, 25 and the web route for 24, and sets the abuse and data-rights surface.
2. **AD-2 (media pipeline and key distribution)** blocks items 2, 3, 10, 11, 13, 18 and 19.
3. **AD-3 (update channel before the freeze)** changes how every other item can be fixed after release, and is the only one with a deadline this week.

## 3. Technical debt and reliability work to do before features

Every row names where the fact comes from. Priority: **B** blocks any server or schema work, **F** fix before feature work, **C** can wait.

| # | Prio | Item | Evidence | Action and owner |
|---|---|---|---|---|
| R1 | B | No device evidence committed | `docs/qa/evidence/` has `README.md` and `TEMPLATE.md` only. `DEVICE_TEST_PLAN.md` names 52 distinct S1 ids and 21 S2 ids. The catalog has 241 rows: planned 99, gap 83, partial 36, automated 14, covered 7, decision 1 (counted from `docs/qa/release-test-catalog.csv`). The repo may lag runs done on build 11; if so, commit them | `qa`: land evidence files per row before the first store submission; founder runs the S1 rows that need a phone |
| R2 | B | PR backlog | 125 open PRs on 8 Nov: 61 draft, 64 ready; 117 target `develop`, 4 `main`, 4 other bases; 18 created before 25 Oct (GitHub REST). Mergeability is NOT VERIFIED (the list endpoint returns "unknown") | `chief-of-staff` plus founder: one triage pass; each PR gets merge, rebase, split, harvest or close. #580 already harvests older work |
| R3 | B | S0 server key change not merged | #602 BL-594 "Edge Functions read the new Supabase keys, legacy as fallback (S0)", open and ready | `ops`/`security`: merge before any server stage; the legacy-key fallback needs an end date |
| R4 | B | Consent and audit PR chain | #634, #636, #637 are drafts; #655 sets their merge order | `data-architect`: land in that order before new tables; any new feature table copies their pattern |
| R5 | F | Number clashes | BL-621 to BL-638 appear in #587 and #599 (BL-621 to BL-726); D-139 in #576 and #591; `C-NFR-005` duplicated across `F13` and `F17` and `11-*.md` (re-baseline 3b); no script checks duplicate BL, D or ADR ids [F: `scripts/` has none]. Duplicate ADR prefixes on `develop`: none (verified) | `qa`: add a CI check (proposal only, `.github` is the founder's); a single id allocator in the coordinator's hands |
| R6 | F | Local database flake | Issue #533: web journey J13 `local_db_migration_failed` under load | `mobile`: root-cause before any new local migration (items 15, 16, 2 all add one). A failing migration is a data-loss class |
| R7 | F | Backup client unlinkable | `"autolinking": {"exclude": ["scribe-keys"]}` in `apps/mobile/package.json`; ADR 0024 "Proposed"; backup flags off in every profile | `sync`/`security`: decide intent; re-including is a native change and needs the AL-06 restore drill |
| R8 | F | Web dependency | `apps/web` pins Next 16.3.8; #586 (draft) bumps to 16.4.3 for critical advisories | `security`: merge before any web write surface (item 13) |
| R9 | F | Oversized and stale PRs | #635 is 851 additions, 88 deletions, 27 files, over CODE-R02 (400 lines, 20 files). #599 is 552 additions in 1 file | Split before review; reviewers should say so (CODE-R02) |
| R10 | F | Stale gate documents | `ALPHA_GO_NO_GO.md` status line is 27 Oct (no build existed); `FUTURE.md` dates pre-date D-121; `COVERAGE.md` measured 16 Oct; ADR 0024 and 0025 still "Proposed" while built | Owners refresh; `principal-architect` can fix ADR status in a separate docs PR |
| R11 | F | Mobile test depth | `COVERAGE.md`: mobile statements 55.52%, branches 55.91%, floors 53/53/47/54; BL-442 (ten weak tests) and BL-443 (slow flaky tests) | `qa`: pick the 25 least covered files in `lib/{sync,backup,db,billing}` first; these are the fenced paths |
| R12 | F | G4 load run and two-phone sync | `06-nfr.md` 16 defines G4; no evidence file in the repo | `sync`, `qa`, `ops`: run on staging before item 10, 11, 12 or 27 |
| R13 | F | Per-language proof | FB-02 harness not built | `speech`: before any language leaves the English-only gate (D-121) |
| R14 | C | Proposed CI controls waiting for the founder | skip-count guard #566, review gate #584, workflow lint #553, dependabot #581, CI proposals #578 (all draft; workflow edits are the founder's) | Founder: decide in one sitting; each reduces review load later |
| R15 | C | Known doc/code drift | #653 (drift sweep, ready) fixes stale dates, store name and iOS target | Merge |

Sequence of the debt: R3, R4, R6 and R1 first (they gate server work), R2 in parallel (it is the cheapest founder time to recover), then R5 to R13.

## 4. Sequencing constraints (what must land before what)

Notation: `A -> B` means A must be merged and proven before B starts, not only before B ships. Item numbers are from part 1; AD ids from part 2.

```
Gate G0 (9 Nov go/no-go, counsel gates)
  -> store build 1 (English, on-device)
       -> 1.0.x server stages behind flags (sign-in, sync, co-parent, status report, backup, languages)
            [each needs: R3, R4, R6, R12, its AL drill evidence R1]

Reliability R3,R4,R6 -> any migration-bearing item (2, 10, 11, 12, 13, 14, 15, 21, 25, 26)
R12 (G4 + two-phone) -> 10, 11, 12, 27
AD-3 (update channel) -> store freeze (before build 1 if (b) is wanted)

AD-1 (guest/web identity) -> 25 (web platform) -> 13 (contribution page) -> 18 (web reader)
                          -> 11 (roles for contributors) -> 12 (notifications to them)
AD-2 (media + keys)       -> 2 (photos) -> 17 (keepsakes with photos) -> 19 (print with photos)
                          -> 10 (shared voice) -> 18 (reader audio), 3 (import) uses the audio path
25 (web deletion, D-042)  -> 24 (Android, with G-09/21 and entity) 
Entity decision (D-125)   -> 19 fulfilment, 24 (Play account), 21 server entitlement if chosen
Counsel: Print Terms -> 19(b); age signals -> 28; FAM-12 licence -> 14
AD-4 (push)               -> 12 -> reactions, digest
FB-02 harness + CVL-02 native review -> 4, 5, 7
Claims registry T5-08 (28) -> every new public claim (all items)
Clinician sign-off -> 9
Local migration safe (R6) -> 15, 16, 2
Item 7 per language needs item 5 for that language
```

Parallel lanes that do not collide: item 20 and 23 (copy and store), 6 (content), 9 (blocked by a person), 16 and 15 (local only) can run beside the server chain. Items 10, 11, 13 and 18 share `supabase/**` and must serialise on the migration range (one migration author at a time, per CLAUDE.md "never edit an applied migration").

Suggested waves (order only; no dates, because the 1.0.x stage dates are not set and FUTURE.md did not model them):

| Wave | Contents | Why this order |
|---|---|---|
| W0 | Part 3 B rows, AD-3 decision, AD-1 and AD-2 written as ADRs | They unblock everything and cost founder reading, not build |
| W1 | Items 23, 20, 6, 16 (spike), 28 | Small, mostly no release, builds trust and compliance, low fenced load |
| W2 | Items 25, 13 first slice, 15 | Web identity proven with the least data at risk; sealed needs a rule |
| W3 | Media pipeline, then 2, 17, 7 | One queue for all blobs |
| W4 | 10, 11, 12, 18 | The family release; highest fenced load; needs R12 evidence |
| W5 | 4, 5, 8, 19 file, 21, 22 | Languages and money; each has an outside gate |
| Later | 24, 26 Vault, 3 Watch, child's voice (CVL-19) | Large, unproven demand |

## 5. Load on the single founder and on the harness

### 5.1 Method

- **Founder review minutes** = unfenced PRs x 22 + fenced PRs x 45 [A: `08-delivery.md` 6.1, which counts 1.5 founder passes per PR]. PR counts are [E] at one PR per about 400 changed lines; the app lane already runs at 12 founder merges a week in the plan [A].
- **Device load** is counted in sessions. One full scripted session is 8 founder hours (the 30 Oct run sheet budget, `2026-10-30-T11-session-1.md`); a single drill is 15 to 90 minutes (`ALPHA_GO_NO_GO.md` B2-23 to B2-28). The "sessions" column below is a count of how many drills or sessions the item adds [E].
- **Harness load** is agent-days (the size band), CI work (macOS compile for any native item, `ios-compile.yml`), and the review-agent passes. `principal-architect` reviews `packages/**`, `lib/**`, `supabase/functions/**` and `packages/api/**`; `red-team` reviews `supabase/**` and auth (D-041). These are queues, so a fenced item costs two review passes before it reaches the founder.

### 5.2 Per item

"Fenced PRs" counts PRs that touch a path in the never-delegated list. "Outside gates" are things neither the founder's code review nor agents can speed up.

| # | Est. PRs (fenced) | Founder review, approx. | Device/drill sessions | Harness and CI load | Outside gates |
|---|---|---|---|---|---|
| 1 | 6 (3) | about 4 h | 2 sessions + kill re-run | macOS compile each PR | none |
| 2 | 10 (5) | about 6.5 h | 2 | storage tests, db job | counsel on child photo class |
| 3 | 4 (1) | about 2 h | 1 | low | counsel on others' voices |
| 4 | 8 (2) | about 4 h | 1 + native review | verifier suite | native reviewers |
| 5 | 3 per language (0) | about 1 h per language | 1 per language (FB-02) | low | native reviewers |
| 6 | 4 (0) | about 1.5 h | 0 | low | none |
| 7 | 6 (1) | about 3 h | 1 per language | low | none |
| 8 | 7 (4) | about 5 h | 1 | function tests | counsel, subprocessor |
| 9 | 3 (0) | about 1 h | 0 | low | clinician |
| 10 | 14 (10) | about 10 h | 3 (two Apple Accounts) | db job, red-team x2 | security threat model |
| 11 | 14 (9) | about 9.5 h | 3 | db job, red-team x2 | counsel (D-050) |
| 12 | 9 (5) | about 6 h | 2 on real devices | function tests | APNs key custody |
| 13 | 14 (6) | about 8 h | browser matrix | web CI, red-team | abuse review |
| 14 | 8 (5) | about 5.5 h | 1 | db job | counsel |
| 15 | 5 (1) | about 2.5 h | 1 (clock tests) | low | none |
| 16 | 4 (1) | about 2 h | 1 perf check | low | none |
| 17 | 5 (0) | about 2 h | 1 | macOS if widgets | none |
| 18 | 9 (4) | about 6 h | browser matrix | web CI | AD-1 |
| 19 | 8 (1) for file | about 3.5 h | 1 proof print | PDF preflight | entity, Print Terms for fulfilment |
| 20 | 1 each (0) | about 0.4 h each | 0 | none | Apple |
| 21 | 8 (6) | about 6.5 h | 1 StoreKit sandbox | billing path needs two reviews | counsel on pricing |
| 22 | 5 (3) | about 3.5 h | 1 sandbox | low | App Store Connect |
| 23 | 2 (0) | about 0.7 h | 0 | low | counsel on wording |
| 24 | 40+ (20+) | about 30 h+ | many | EAS Android, new CI | entity, Play account |
| 25 | 9 (5) | about 6 h | 1 deletion drill | web CI | AD-1 |
| 26 | 12 (8) | about 8.5 h | 2 recovery drills | security review | external review advised |
| 27 | 4 (3) | about 3 h | k6 run | db job | none |
| 28 | 5 (1) | about 2.5 h | 1 | low | counsel |
| 29 | 10 (0) | about 3.5 h | 1 per surface | low | native reviewers |
| 30 | 6 (0) | about 2 h | 0 | low | outside vendors |

Review hours are [E] from the formula above and carry the same uncertainty as the PR counts. At 12 merges a week, items 10 and 11 alone each take more than a full week of founder merge capacity, before any rework.

### 5.3 What this means

- The next set should not run items 10, 11, 13 and 24 side by side. Their fenced PRs would exceed the four fenced merges a week the plan assumes (`08-delivery.md` 6.1).
- Device sessions are the hard constraint. Items 1, 2, 10, 11 and 12 each need a real phone, and two of them need two Apple Accounts on two phones. Batch them so one session covers several items.
- Fenced work benefits most from the `review/ready` independent review agent and the second `review/security` pass; the proposals for these gates are still drafts (R14).
- What would change these estimates: a measured throughput from the first merged items, and the QA bug-hunt note that this lane could not read.

## 6. Open questions for the founder

1. Does AD-3 get decided before the store freeze, and is a disabled update channel acceptable in the Notes for Review?
2. Is guest write (AD-1 option b) in scope for the web, or is the first web step read-only?
3. Is Android a platform commitment or a co-parent route (AD-11)?
4. Who triages the 125 open PRs, and by when (R2)?
5. Which of the staged 1.0.x server stages comes before the family release, and who owns its dates?

## 7. Sources

- Repo paths cited inline; GitHub REST for PR and issue counts on 8 Nov 2026 (`gh api repos/thesaurabhpareek/earlyletters/pulls` and `issues`), the proxy blocks GraphQL.
- `docs/prd/v2/06-nfr.md` 4, 15, 16, 17 for budgets; `08-delivery.md` 6.1 for founder review assumptions; `FUTURE-REBASELINE-2026-10-28.md` for gates and dates.
- No external pages were fetched for this file. Expo update signing, FTS5 in `expo-sqlite`, APNs from the Edge runtime and Apple's gift rules are marked NOT VERIFIED where used.
