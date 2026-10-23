# F19 Server-driven content, remote config, kill switches, pack delivery

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 18 (`05-feature-map.md` section 2) |
| Personas | P1 Evening parent, P4 Multilingual family (packs), P2 Co-parent; the founder as publisher |
| Existing IDs | LEGAL-REQ-040, LEGAL-REQ-059, C-NFR-009, A-REQ-002, A-REQ-011, C-REQ-009, PRD-REQ-005, D-035 (superseded), D-046, D-066, D-068, ADR 0016, ADR 0017, DR-14, BL-022 (superseded), BL-335, BL-337, BL-339; security review L3, L10 |
| Depends on | `packages/api` (contracts, signing, standards), F05 (speech and text packs, language gates), F13 (prompts), F14 (free letters allowance), F17 (Settings > Storage), F21 (review notes list every flag; the pack and document host names) |
| Status | Draft V2, 13 Oct 2026. Code checked on `docs/prd-v2` rebased on `origin/develop` at 6482cd3. Revised after critique round 1 (R2 AR-12, AR-18, AR-27, AR-28; R5 EQ-17; R1 PL-03): kill-switch timing that can pass, two signing keys, per-feature build flags and switches for the M14 server features |

> **Not legal advice.** Items marked **[Counsel]** wait on a licensed attorney.

> **Build state.** Server features are on for v1.0 (M14, founder, 13 Oct 2026), reversing commit c1764f9; with them on, remote documents fall back to the Supabase URL (`apps/mobile/src/lib/capabilities.ts`). On 13 Oct every build profile still sets `EXPO_PUBLIC_SERVER_FEATURES` to `off` (`apps/mobile/eas.json`). In that state, which is also the kill path, the app fetches signed documents only from `EXPO_PUBLIC_DOCS_BASE_URL` (`apps/mobile/src/lib/remote/base.logic.ts`), and no build profile or backlog item sets it today. Without either, a store build has no remote config, no kill switches, no content bundle and no pack manifest, so it can install no speech model and no non-English pack (section 6.3, F19-U01).

## 1. Why

- [D] Prompts, tips, onboarding story cards, announcements, remote config, flags, kill switches and pack manifests are server-delivered as typed, schema-validated, signed, cached blocks; the app always works from its last good copy; nothing that changes data collection or the paywall, or that could slip past App Review, is server-driven (B14, brief item 16).
- [D] Remote config has one source: ADR 0016's signed config document. D-035's `app_config` table is superseded and not built (D-068, M12).
- [F] App Review 2.3.1(a) forbids hidden or undocumented features and asks that every feature be described in the review notes; 2.5.2 forbids downloaded code that changes features (R4 section 5, R4-S55). Kill switches that turn a reviewed feature off are allowed; flags that turn an unreviewed one on are not (R4 section 5).
- [F] LEGAL-REQ-040 requires remote, audited switches that take effect within 5 minutes, while local recording, reading and export keep working.
- [D] The app download stays under 40 MB; speech models and every non-English pack download on demand, checked by SHA-256 against a signed manifest (B13, brief item 15). Model files sit on a zero-egress or free-egress host, never Supabase egress (D-046).
- [F] Most of it is built: contracts and Ed25519 signing in `packages/api`, the document client in `apps/mobile/src/lib/remote`, the pack engine in `apps/mobile/src/lib/packs`, four block components in `apps/mobile/src/components/content-blocks`, two Edge Functions (`supabase/functions/config`, `content`) and the offline publisher `scripts/packs/publish.ts`. The trusted key list ships empty (`packages/api/src/keys.ts`), so the app trusts nothing yet (BL-335), and nothing is published (`supabase/functions/config/published.ts` holds `null`).
- [S] Apple's own on-device speech assets failed to download for Arabic in a beta, so a downloaded pack needs a visible state and a retry (R1-S27).
- [F] The 5-minute kill-switch bar cannot pass with today's numbers: remote config is served with `max-age=60, stale-while-revalidate=3600` (`packages/api/src/standards.ts` `CACHE_POLICY.remoteConfig`) and the app asks at most every 4 minutes (`CLIENT_REFRESH_MS.remoteConfig`), so a cache can hand out a stale copy and the app may not ask again for minutes (R2 AR-27). Section 6.2 D sets numbers that can.
- [F] One build switch, `EXPO_PUBLIC_SERVER_FEATURES`, drives sign-in, sync and co-parent together (`apps/mobile/src/lib/capabilities.ts`), and no remote switch exists for backup uploads, escrow or the subscription status report. M14 ships all of them, so each needs its own kill path (R2 AR-12).

## 2. Who

| Who | Moment | What they hold | What F19 must do |
|---|---|---|---|
| P1 Evening parent | Opens the app at night, sometimes offline | A phone, 1 minute | Everything works from what is on the phone; nothing waits on the network |
| P4 Multilingual family | Picks Hindi in first run | Wi-Fi at home, mobile data outside | One clear download with its size; capture never waits for it |
| Founder (publisher) | A Portuguese filler table needs a fix, or something breaks in production | A laptop, the signing key in a password manager | One command to sign; printed upload and deploy steps; a kill switch that reaches open apps within 5 minutes |
| App Review | Reviewing the build | Review notes | Every flag and its reviewed variants named (F21) |

## 3. What we are solving

**Outcome:** words, packs and a small set of switches change without an app release, every byte is signed and checked on the phone, and nothing the server sends can add a feature, change what is collected or change the paywall.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Time from publishing a kill switch to an open app obeying it | 5 minutes or less (LEGAL-REQ-040) | Staging test with a stopwatch and two phones | None |
| Launches that wait on a network call for config or content | 0 | Cold start trace; `startRemote` after first frame | None |
| Documents accepted with a bad signature, unknown key, older version or invalid payload | 0 | `apps/mobile/src/lib/remote/__tests__/documents.test.ts`; `packages/api/test/integrity.test.ts` | None |
| Pack download failures / starts | Under 2% (TRACKING_PLAN 1.3) | `pack_download{stage: failed}` / `{stage: started}` | Consenting only |
| Pack installs that leave a broken file after a kill | 0 | Kill-at-every-step test in `apps/mobile/src/lib/packs/__tests__/engine.test.ts` | None |

## 4. Scope

**In v1.0**
- Three signed documents: remote config, pack manifest, content bundle (English), served by two Edge Functions with ETag and cache headers, fetched after the first frame and on foreground, cached on the device, used offline.
- Remote config v1 as built: `minSupportedVersion`, `freeLettersAllowance` (raise only), `forceReauthEpoch`, flags `introVariant`, `lockScreenNamesDefault`, `familyTeaser`, kill switches `sync`, `invites`, `photos`, `packDownloads`, `serverContent`. `readTogetherFreeSessions` stays in the schema, deprecated (M2).
- Additive keys sibling specs need (section 6.5), each with a bundled default and a direction it may move.
- Content blocks `prompt`, `tip`, `story`, `announcement`, with per-slot fallback to `packages/content`.
- The pack system: resumable Range downloads, SHA-256 checks, atomic install, Wi-Fi rule over 5 MB, free-space checks, Settings > Storage to list and delete.
- Publishing by the founder from a laptop with an offline key; git history as the audit log (C-NFR-009).
- Pack host: Cloudflare R2 recommended with Hugging Face mirrors for upstream weights (ADR 0016 3.3; founder decides, BL-337).

**Later**
- Apple-hosted Background Assets once the minimum iOS is 26 (F49, DR-14).
- A CDN in front of the two Edge Functions (one env var, no app change; ADR 0016 6).
- Content bundles in other UI locales (F44).
- Story cards in use (the 4-story intro is v1.1, D-043).

**Never**
- Server-driven layout, navigation, new screens, remote images or code (ADR 0016 5.3, 5.4; 2.5.2).
- Any key that turns off recording, typing, saving, reading, playback or export (LEGAL-REQ-040).
- Any key for analytics, consent, sampling or anything else that changes what is collected (B14; F18-REQ-010).
- Any key for paywall layout, prices, copy, triggers or the order of Plus offers (B14). The only Plus-adjacent key is `freeLettersAllowance`, which may only raise the reviewed 2 (M1).
- A flag that enables a feature the reviewed build did not show (2.3.1(a)); a `child-input` flag (LEGAL-REQ-059: no such key exists).
- Machine rewriting turned on by config (F06-REQ-039).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Calm | Daily content updates: music, soundscapes, daily sessions [F] R1-S48 | 4.8 (2M) | n/a | **Match** server-delivered prompts and tips [R] |
| Day One | Daily prompts and templates on the free plan [F] R1-S23 | 4.8 | n/a | **Match** [R] |
| From, Mama | Daily curated Reflect tab [F] R1-S20 | 4.9 (48) | n/a | Neutral |
| Apple SpeechAnalyzer | Apple manages model downloads in system storage; no app size cost [F] R1-S70 | Arabic asset download failures in a beta [S] R1-S27 | n/a | **Match** a visible download state and retry [R] |
| Apple rules | 2.3.1 no hidden features; 2.5.2 no downloaded code that changes features [F] R1-S49 | n/a | n/a | **Match**: words and data only |
| Competitor internals | How competitors deliver remote config | **Unverified** (not observable from public pages, R1 F19) | n/a | n/a |

## 6. Experience

### 6.1 Entry points

| Where | What | Built? |
|---|---|---|
| App start, after the first frame | `startRemote()` loads the three caches, then refreshes | Built (`apps/mobile/src/app/_layout.tsx` `startServices`, `apps/mobile/src/lib/remote/index.ts`) |
| Foreground and every 60 s while open | Refresh; each document keeps its own minimum interval (config 4 min today, 2 min per F19-REQ-026; manifest and content 6 h) | Built (`CLIENT_REFRESH_MS`, `packages/api/src/standards.ts`); interval change not built |
| First run language step, Settings > Spoken language | `ensureLanguage(lang)` asks the pack engine | Built (`apps/mobile/src/lib/packs/index.ts`) |
| Settings > Storage | Installed packs, sizes, Stop, Try again, Remove, mobile data switch | Built (`apps/mobile/src/app/settings/storage.tsx`) |
| Tonight, Review, Book, Settings | Tip and announcement slots | Not built (components exist, no screen renders them) |
| Founder's laptop | `npx tsx scripts/packs/publish.ts <packs, config, content or all>` | Built (`scripts/packs/publish.ts`, `lib.ts`, `lib.test.ts`) |

### 6.2 Happy path

**A. A normal evening, online.**
1. The parent opens the app. The first frame draws from bundled defaults or the cached last good copies, read synchronously (`SignedDocumentClient.current()`).
2. After the first frame, `startRemote` sends conditional GETs with `If-None-Match`, `x-request-id` and the app version; no user data and no credentials.
3. A 304 refreshes the timestamp. A 200 is used only if the Ed25519 signature checks against a key in `TRUSTED_SIGNING_KEYS`, the payload parses and its version is not lower than the last accepted one. The verified payload is cached on disk.
4. Hooks (`useRemoteConfig`, `useContentBundle`) re-render subscribers. Nothing visible changes unless a word or a switch changed.

**B. Hindi in first run.**
1. The parent picks Hindi. The language step shows the size from the manifest (F05 copy).
2. `ensureLanguage('hi')` resolves the required packs: `text-rules.hi` (small, any network) and the speech model the speech plan picks (large, Wi-Fi unless allowed).
3. The engine downloads 16 MiB Range chunks into `staging/`, hashes the file, renames the directory into `installed/`, and removes the older version. Capture never waits: audio is saved first and transcription waits for the model (ADR 0016 9).

**C. The founder fixes a Portuguese filler table.**
1. Edits `packs/text-rules/pt.json`; runs `publish.ts packs`. The script validates the pack, writes `dist/packs/`, signs the manifest with a version one higher, checks the signature the way a phone does, and rewrites `supabase/functions/config/published.ts`.
2. The script prints the R2 upload and function deploy commands; the founder runs them. Git records the change.
3. Phones pick up the manifest within 6 hours and install the new pack in the background.

**D. Something breaks: invites misbehave [server].**
1. Founder runs `publish.ts config --kill invites`, commits, deploys `config`.
2. Within 5 minutes each open app has the new config. The numbers that make this hold [R] (F19-REQ-026): remote config served with `max-age=60, stale-while-revalidate=30`; the app refreshes it at most every 2 minutes while in the foreground. Worst case: 60 s fresh plus 30 s stale at the cache plus a 2-minute refresh gap, about 3.5 minutes, plus deploy time. Invite entry points show their paused state; writing, reading and export are untouched.
3. Lifting the switch is the same command without `--kill`, signed with a higher version. A replayed or older document can never clear a set switch (F19-REQ-008).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F19-U01 | Store build with server features off (before the M14 flip, or the kill path) and no `EXPO_PUBLIC_DOCS_BASE_URL` | Every document refresh returns `not_configured`; bundled defaults only; the pack engine fails `no_manifest` | No speech model or non-English pack can install; first letter is saved as audio only | Set the env var in the production EAS environment (F19-REQ-005) | Build-config test fails if a store profile has neither a docs base nor server features |
| F19-U02 | `keys.ts` empty (today) | Every fetched document fails verification; fail closed | Same as U01 | BL-335 key ceremony | `integrity.test.ts` |
| F19-U03 | Offline at launch, never fetched before | Bundled defaults, packaged copy, no manifest | Writing and reading work; Settings > Storage shows `packsCopy.failures.offline` "Starts when you are back online." | Automatic on reconnect | `documents.test.ts` offline case |
| F19-U04 | Bad signature, unknown key or wrong kind | Ignored; last good copy stays; outcome code recorded without body | Nothing | Republish | `integrity.test.ts` |
| F19-U05 | Older version served (rollback attempt) | Refused (`rollback`) | Nothing | n/a | `documents.test.ts` |
| F19-U06 | Same version, different body; or an old config kept at a CDN for days (review L10) | Today the same-version body replaces the cache, and nothing bounds age | Possibly a kill switch stays off | F19-REQ-008 fix | New test |
| F19-U07 | One key has a bad value | That key falls back to its bundled default; others apply | Nothing | Republish | `remote-config.test.ts` |
| F19-U08 | Content bundle with an unknown block type or a forbidden character | Block skipped and counted; slot falls back to packaged copy if incomplete | Packaged prompt | Republish | `content.test.ts` |
| F19-U09 | `serverContent` kill switch on | Every slot uses `packages/content` | Packaged words | Unkill | `remote/__tests__/content.test.ts` |
| F19-U10 | Pack download killed mid-file (app killed, network change) | `.part` file kept; next attempt resumes from its size | Progress resumes | Automatic | `engine.test.ts` |
| F19-U11 | SHA-256 mismatch | Download deleted; next mirror from the start | `failures.hash_mismatch` with `retryButton` "Try again" | Try again | `engine.test.ts` |
| F19-U12 | Low storage | Large packs need file size plus 1 GB free; small packs 20 MB; download refused | `failures.no_space` in Settings > Storage | Free space | `engine.test.ts` |
| F19-U13 | Large pack on mobile data | Waits for Wi-Fi unless "Use mobile data" is on or the person taps Download now | `phases.waiting_for_wifi` "Waiting for Wi-Fi" | Switch or Wi-Fi | `engine.test.ts` |
| F19-U14 | `packDownloads` kill switch on | No new downloads; installed packs keep working | `failures.downloads_paused` | Unkill | Packs test |
| F19-U15 | Manifest entry needs a newer app (`minAppVersion`) | Older compatible version kept, or `needs_app_update` | `failures.needs_app_update` | App update | `pack-manifest.test.ts` |
| F19-U16 | `minSupportedVersion` above the running version | Today nothing (no consumer). Required: a gentle update card that never blocks local use | Card on Tonight | App Store update | F19-REQ-012 |
| F19-U17 | `forceReauthEpoch` bumped **[server]** | Today nothing (review L3). Required: local sign-out once per epoch | Sign-in sheet | Sign in | F19-REQ-011 |
| F19-U18 | Announcement with an expired `endsAt`, or dismissed | Not shown; dismissals kept on the phone (`content.dismissed`) | Nothing | n/a | Hooks test |
| F19-U19 | Duplicate taps on Remove pack | One confirmation; second tap ignored while busy | One sheet | n/a | Component test |
| F19-U20 | VoiceOver and AX5 in Settings > Storage and block cards | Rows announce name, size and state; cards wrap without truncation; no motion beyond system | Readable | n/a | A11y snapshot |
| F19-U21 | iPhone SE 3 hashing a 574 MB model in JS | Slices yield to the UI; time unknown (ADR 0016 4.3, U) | `phases.verifying` "Checking the download" | Native `sha256File` (requested) | Device run |
| F19-U22 | Hugging Face mirror rate-limited on a carrier NAT | Next mirror; R2 primary | Progress continues | Automatic | Fake host test |
| F19-U23 | Clock far in the past or future | Announcement windows use the phone clock; config validity is version-based, not time-based | An announcement may show early or late | n/a | Accepted |
| F19-U24 | Remote value would lower the free allowance below 2 | Ignored; `effectiveFreeLetters` clamps to at least 2 | Nothing | n/a | `remote-config.test.ts` |
| F19-U25 | A co-parent's phone on an older config | Each phone applies what it has; no server enforcement depends on config | n/a | Refresh | n/a |

Copy keys in this table are in `packages/content/src/features/packs.en.ts` (`packsCopy`).

### 6.4 What is never server-driven, by construction

There is no key and no block type for: turning off recording, typing, saving, reading, playback or export; analytics, consent or sampling; paywall layout, prices, copy or triggers; layout, navigation or screens; remote images or code; machine edits (`packages/api/src/remote-config.ts` header, `content.ts` header, ADR 0016 5.3). A guard test in `packages/api` fails if a key or block type outside the registry below is added without a matching row here (F19-REQ-009).

### 6.5 Key registry (remote config)

Direction: **up** may only raise, **down** may only lower, **kill** may only stop a server-dependent feature, **variant** picks between reviewed variants.

| Key | Type, default | Direction | Who reads it | Status |
|---|---|---|---|---|
| `minSupportedVersion` | semver, `0.0.0` | Gentle card only | Tonight card (new) | Contract built; no consumer |
| `freeLettersAllowance` | int, 2 (max 100) | up | `apps/mobile/src/lib/billing/gates.ts` via `setFreeLettersAllowanceSource` | Built |
| `readTogetherFreeSessions` | int, 3 | Deprecated (M2) | Nothing | Remove in schema v2 |
| `forceReauthEpoch` | int, 0 | One-way | Auth **[server]** | Contract built; no consumer (L3) |
| `flags.introVariant` | `four`, `three`, `none` | variant | `useStoryCards` | Built; unused at v1.0 (D-043) |
| `flags.lockScreenNamesDefault` | bool, false | variant | F13 notification builder | Contract built; no consumer |
| `flags.familyTeaser` | `coming_soon`, `quiet` | variant (quiet only) | `apps/mobile/src/components/family/coparent-soon.tsx` | Built |
| `killSwitches.sync` | bool, false | kill | Sync **[server]** | Contract built; no consumer |
| `killSwitches.invites` | bool, false | kill | Invites **[server]** | Contract built; no consumer |
| `killSwitches.photos` | bool, false | kill | None (no photo feature) | Contract built |
| `killSwitches.packDownloads` | bool, false | kill | `apps/mobile/src/lib/packs/index.ts` | Built |
| `killSwitches.serverContent` | bool, false | kill | `apps/mobile/src/lib/remote/index.ts` | Built |
| `killSwitches.backupUploads` | bool, false | kill | F08 backup queue **[server]** | Not built (new, R2 AR-12) |
| `killSwitches.escrow` | bool, false | kill | F08 restore client; the `escrow` function, which runs alone in the `scribe-escrow` project (F08 6.5 G2), also reads that project's own switch on every call, so it can be stopped without any phone and without the main project [A: a changed function secret takes effect without a redeploy; checked in WP-F08-B4] **[server]** | Not built (new) |
| `killSwitches.statusReport` | bool, false | kill | F14 status report sender **[server]** | Not built (new) |
| `captureMaxMinutes` (F04 asks `capture_max_minutes`) | int, 30, clamp 5 to 30 | down | F04 recorder | Not built (new) |
| `flags.listeningCopy` | Removed: F08-REQ-006 Rev (D-068) has no remote listening-copy key; the player uses a copy only when its hash matches | n/a | F08 | Not to be built |
| `appLockGraceSeconds` (F17) | int, 60, clamp 0 to 300 | variant | F17 lock | Not built (new) |
| Language gate states (F03, F05) | In the pack manifest, not config: optional `gate` on each entry (`passed`, `early`, `paused`) | A language not named in the reviewed listing may not be moved to `passed` remotely | F03 chips, F05 | Not built (new field in `PackEntrySchema`) |

This table is the one key registry; every spec and `06-nfr.md` cite these exact camelCase names (R5 EQ-17). The old snake_case names from D-035 (`sync_enabled`, `capture_max_minutes`, `app_lock_grace_seconds`) are retired. `sensitive_withdrawal_mode` (F17) is a server setting, not remote config.

**Build flags (not remote).** Each M14 feature gets its own build flag so a release can ship with one of them off (R2 AR-12): `capabilities.signIn`, `capabilities.sync`, `capabilities.coParent` (built, all from `EXPO_PUBLIC_SERVER_FEATURES`), plus new `capabilities.backup` and `capabilities.statusReport`, each true only when server features are on and its own variable (`EXPO_PUBLIC_BACKUP`, `EXPO_PUBLIC_STATUS_REPORT`, new) is on. A build flag removes the feature from that build; a kill switch pauses it in builds that have it.

## 7. Requirements and acceptance criteria

Status: **Built** (file), **Partly built**, **Not built**, checked 13 Oct. **[server]** needs our server and is v1.0 (M14); built code behind the switch is "Built, switch off in release profiles" until the profiles flip.

| ID | P | Requirement | Acceptance criteria | Status | Source |
|---|---|---|---|---|---|
| F19-REQ-001 | P0 | Every remote document is Ed25519-signed over canonical JSON with a kind prefix; the app trusts only keys it ships; fail closed | Given a document signed by an unknown key, of the wrong kind, or altered by one byte, Then it is not used and the last good copy stays | Built (`packages/api/src/integrity.ts`, `canonical.ts`, `test/integrity.test.ts`) | ADR 0016 4.2 |
| F19-REQ-002 Rev (AR-28) | P0 | Two signing keys from the first ceremony: a primary and a cold backup generated at the same time, held offline in separate places; both public keys ship in `keys.ts`; a written rotation runbook | Given a release build, Then `TRUSTED_SIGNING_KEYS` has 2 entries covering all 3 kinds; a document signed with the backup key is accepted; no secret appears in the repo, CI, EAS or Supabase; `docs/runbooks/` holds the rotation steps | Not built (`keys.ts` empty; BL-335) | ADR 0016 7; R2 AR-28 |
| F19-REQ-003 | P0 | Schema validation per key with bundled fallback; unknown keys ignored; one bad value never rejects the document | Given 30 corrupt fixtures, Then each bad key falls back and every good key applies | Built (`packages/api/src/remote-config.ts`, `test/remote-config.test.ts`) | ADR 0016 5.1 |
| F19-REQ-004 | P0 | Offline first: synchronous last good copy, never awaited at launch | Given no network and an empty cache, Then cold start shows Tonight with bundled defaults and 0 network calls before the first frame | Built (`apps/mobile/src/lib/remote/documents.ts`, `index.ts`; `_layout.tsx`) | A-REQ-002, B14 |
| F19-REQ-005 | P0 | Every store build can reach the documents | Given each EAS store profile, Then either server features are on or `EXPO_PUBLIC_DOCS_BASE_URL` is an https origin serving the three paths; a config test fails otherwise | Not built (no profile sets it; BL-339's env list omits it) | ADR 0016 6 |
| F19-REQ-006 | P0 | Kill switches reach an open app within 5 minutes | Given staging with the F19-REQ-026 numbers, When `--kill packDownloads` is published at T, Then two open phones refuse a new download by T+5 min in 10 of 10 runs; repeat with a CDN in front | Partly built: today's `CACHE_POLICY` and `CLIENT_REFRESH_MS` allow more than 5 minutes; staging test not run | LEGAL-REQ-040; R2 AR-27 |
| F19-REQ-007 | P0 | Kill switches stop only server-dependent features; local recording, typing, saving, reading, playback and export keep working | Given every kill switch on and the phone offline, Then the F04, F06, F09, F15 smoke tests pass | Built by construction (no key exists for them, `remote-config.ts`); smoke test not built | LEGAL-REQ-040 |
| F19-REQ-008 Rev (AR-27) | P0 | No stale or replayed config can clear a kill switch; a newer signed one can | Given a same-version document with a different body, Then it is ignored. Given a config whose `generatedAt` is more than 7 days older than the last good server `Date` header, Then its kill switches are ignored and the last good state stays. Given a replayed older document with a switch cleared, Then the switch stays set. Given a newer signed document that clears it, Then it clears | Not built (review L10) | Review L10; R2 AR-27 |
| F19-REQ-009 | P0 | Closed vocabulary with a guard test | Given `RemoteConfigSchema` and the block types, Then a test lists every key and block type and fails on any not in 6.5 or ADR 0016 5.1; no key matches `analytic`, `sampl`, `consent`, `price`, `paywall`, `layout`, `rewrite` | Partly built: closed by construction; no guard test | B14, 2.3.1(a) |
| F19-REQ-010 | P0 | `freeLettersAllowance` may only raise the reviewed 2 | Given a served 0 or 1, Then the effective value is 2; given 5, Then 5 | Built (`effectiveFreeLetters`, `_layout.tsx`) | M1 |
| F19-REQ-011 | P0 | Each kill switch and one-way key has a consumer before the feature it guards ships | Given server features on, Then `sync` pauses the outbox, `invites` disables create and redeem, `forceReauthEpoch` signs out once per epoch after the outbox drains, `backupUploads` stops new uploads, `escrow` stops restores on the phone and in the function, `statusReport` stops reports | Not built for any of these (no consumer found); needed for v1.0 (M14) | LEGAL-REQ-040, L3; R2 AR-12 |
| F19-REQ-012 | P1 | Gentle update card from `minSupportedVersion` | Given the running version below it, Then one dismissible card on Tonight with an App Store link; capture and reading unaffected | Not built | ADR 0016 5.1 |
| F19-REQ-013 | P0 | New keys in 6.5 with their direction rules | Given each new key out of range or moving the wrong way, Then the bundled default applies | Not built | F04, F08, F17 |
| F19-REQ-014 | P0 | Content blocks: 4 types, plain text, only `{child}`, `{app}`, `{signsAs}`, forbidden characters refused | Given fixtures with a curly quote, an unknown placeholder and a newline, Then each block is skipped | Built (`packages/api/src/content.ts`, `test/content.test.ts`) | B14 |
| F19-REQ-015 | P0 | Server prompts replace the packaged library only when complete for every kind and band; story cards only as a full run | Given a bundle missing one band, Then the packaged library is used | Built (`apps/mobile/src/lib/remote/content.logic.ts`, `__tests__/content.test.ts`) | ADR 0016 5.2 |
| F19-REQ-016 | P0 | Screens render the blocks: Tonight prompts through `usePromptLibrary`; tip and announcement slots on Tonight, Review, Book, Settings | Given a signed bundle with one tip for `tonight`, Then it shows there and nowhere else; given `serverContent` killed, Then 0 server words on screen | Not built (Tonight imports `PROMPTS` directly, `apps/mobile/src/app/(tabs)/index.tsx`; no screen imports `@/components/content-blocks`) | F13-REQ-001 |
| F19-REQ-017 | P0 | Every published word passes the full content rules, including `scripts/packs/content-extra.en.json` | Given a planted gendered pronoun in the extra file, Then `publish.ts content` refuses | Not built (rules test reads only `packages/content`; publish runs the cheap checks) | VOICE.md, LEGAL-REQ-044 |
| F19-REQ-018 | P0 | Pack engine: resumable Range, SHA-256, atomic install, one at a time, Wi-Fi over 5 MB, free space rule, delete in Settings | Given a kill at every file operation of an update, Then the old or new version survives intact | Built (`apps/mobile/src/lib/packs/engine.ts`, `__tests__/engine.test.ts`, `settings/storage.tsx`); needs a device run (TestFlight) | B13, ADR 0016 4.3 |
| F19-REQ-019 | P0 | Pack host chosen, bucket and domain live, files uploaded, one host name everywhere | Given the manifest, Then every URL uses one host and returns 206 to a Range request from an iPhone | Not built (BL-337; `SELF_HOST_BASE` says `models.earlyletters.com/speech` while DOMAINS.md says `packs.earlyletters.com`) | D-046, DR-14 |
| F19-REQ-020 | P0 | Language gate field in the manifest (6.5) and the remote rule that no language absent from the reviewed listing can become `passed` | Given a manifest marking a language `passed` that the listing omits, Then the app shows it as unavailable until a release | Not built | F03-REQ-004, F05, 2.3.1(a) |
| F19-REQ-021 | P0 | Endpoints: strong ETag, 304, cache headers per `CACHE_POLICY`, request id, `no-store` errors in the ADR 0017 envelope, 404 until published | Given `serve.test.ts`, Then each header and status holds | Built (`supabase/functions/config/serve.ts`, `serve.test.ts`); not deployed | ADR 0017 |
| F19-REQ-022 | P0 | Requests are content-free: no user id, no token, no cookie, no query beyond `locale` | Given a captured request, Then only `accept`, `if-none-match`, `x-request-id`, the app version header | Built (`documents.ts` `doRefresh`) | B15 |
| F19-REQ-023 | P0 | Publishing leaves an audit trail | Given a publish, Then `published.ts` and `remote-config.json` change in one commit whose message names the change | Partly built: the script writes both; nothing published yet | C-NFR-009 |
| F19-REQ-024 | P0 | Every flag and kill switch is listed in the App Review notes with its reviewed variants | Given the review notes (F21), Then each key in 6.5 that the build reads appears once | Not built | 2.3.1(a) |
| F19-REQ-025 | P0 | Per-feature build flags `capabilities.backup` and `capabilities.statusReport` | Given a build with server features on and `EXPO_PUBLIC_BACKUP` off, Then no backup UI, upload or escrow call exists in that build while sign-in, sync and co-parent work; same for the status report | Not built | R2 AR-12; 08 section 2.4 fallbacks |
| F19-REQ-026 | P0 | Cache and refresh numbers that meet the 5-minute bar | Given `CACHE_POLICY.remoteConfig`, Then it is `public, max-age=60, stale-while-revalidate=30, stale-if-error=604800`; given the app in the foreground, Then remote config is requested at most every 2 minutes and at least every 2 minutes plus one tick | Not built (today 3600 s and 4 minutes) | R2 AR-27 |

### Inherited requirements whose home is this spec (round 2)

These IDs were cited in V2 with no definition row (R9 R2D-06). The text is taken from the source named in the last column; that source still governs the full wording. Each P0 row has a work package and a test in section 12.

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| LEGAL-REQ-040 | P0 | Kill switches: revoke all sessions, pause sync, pause pack downloads, and the M14 switches when their features ship | Given each switch flipped in staging, Then the effect occurs within 5 minutes and local features still work offline | `docs/legal/ENGINEERING_REQUIREMENTS.md` on `develop` LEGAL-REQ-040 |
| LEGAL-REQ-059 | P1 | Child-collection features stay behind a `child-input` flag that is off in production without counsel's linked opinion | Given the flag registry, When CI runs, Then `child-input` flags are off in production config unless an approval link is present | `docs/legal/ENGINEERING_REQUIREMENTS.md` on `develop` LEGAL-REQ-059 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Never |
|---|---|---|---|---|---|
| Signed config, manifest, content bundle | Public | Edge Functions (Supabase), a CDN later; device cache | Anyone | Until replaced | User data of any kind |
| Pack files and models | Public | R2 (recommended), Hugging Face mirrors | Anyone | Versioned, immutable | Our users' data |
| Download requests | IP address and file name at the host | Host logs | Cloudflare, Hugging Face | Host policy | Account ids; a file name reveals a chosen language (COUNSEL_PACKET Q12) **[Counsel]** |
| Dismissed announcement ids | L1 | Device `settings` | The app | Until app deleted | Leaves the phone |
| Installed packs | L1 | `Library/Application Support/packs`, excluded from backup | The app | Until removed | Uploaded |

- Two signing keys (F19-REQ-002) remove the single point of failure: losing the primary means signing with the backup and shipping a release that adds a new backup; a leaked key still needs a release to revoke (ADR 0016 4.2).
- The subprocessor page and Privacy Policy section 8 name the pack host (D-046; F21).
- Today's `stale-while-revalidate=3600` lets a cache serve a stale copy for up to an hour while it revalidates; F19-REQ-026 lowers it to 30 s for remote config only. The 5-minute test (F19-REQ-006) runs with the CDN in place.

## 9. Non-functional requirements

| Item | Budget | Source |
|---|---|---|
| Cold start cost | Cache read under the 30 ms bootstrap budget; no Ed25519 verify at launch | `documents.ts` header, TDD 01 5.3 |
| Document request p95 | 300 ms, 5 s timeout, 3 attempts | `ENDPOINT_CLASSES.public_document` |
| Pack file first byte p95 | 1 s, 60 s per Range request, 6 attempts per host | `ENDPOINT_CLASSES.pack_file` |
| Refresh cost | About 5 document requests per active user per day [E, ADR 0016 6] | ADR 0016 6 |
| Kill switch latency | 5 minutes or less; worst case by arithmetic about 3.5 minutes plus deploy with F19-REQ-026 | LEGAL-REQ-040; R2 AR-27 |
| Refresh cost at 2 minutes in the foreground | About 15 config requests per active user per day [A: 30 foreground minutes a day]; each a 304 when unchanged | ADR 0016 6 |
| Bundle cost of `valibot` and noble libraries | Measured in `docs/ops/APP_SIZE.md` | B13 |
| Accessibility | Storage and block cards pass AX5 and VoiceOver | LEGAL-REQ-051 |

Shared budgets: `06-nfr.md`.

## 10. Analytics

| Event | Exists? | Properties | Question |
|---|---|---|---|
| `pack_download` | Yes (observer in `apps/mobile/src/lib/analytics/observers.ts`) | `pack`, `lang`, `pack_version`, `stage`, `failure`, `network` | Which packs fail, and why? |
| `settings_changed` | Yes | `key: pack_cellular` (and `listening_copy`) | Do people allow mobile data? |
| Announcement shown or dismissed | No; none proposed for v1.0 | n/a | Not needed; counts would not change a decision at this size |

Remote config never changes what is collected (F18-REQ-010). Document fetch outcomes are not analytics events; they stay in memory (`lastRefresh()`).

## 11. How we build it (with the architect)

- **As built (ADR 0016):** `packages/api` contracts (`remote-config.ts`, `content.ts`, `pack-manifest.ts`, `integrity.ts`, `keys.ts`, `standards.ts`); `apps/mobile/src/lib/remote` (`SignedDocumentClient`); `apps/mobile/src/lib/packs` (`PackManager` with Expo ports); `apps/mobile/src/components/content-blocks`; `supabase/functions/config` and `content`; `scripts/packs` publisher. Libraries: `@noble/ed25519` 3.2.0, `@noble/hashes` 2.4.0, `valibot` 1.5.0 (all MIT, per ADR 0016 4.2).
- **To build:** the docs base for store builds; the guard test; the L10 fix in `documents.ts accept()`; new keys with direction clamps; the `gate` field in `PackEntrySchema` (optional, so older apps skip it); screen slots for tips and announcements; Tonight reading `usePromptLibrary`; the update card; full content rules over the extra file in `publish.ts`.
- **Sequencing.** Order only; dates in `08-delivery.md` section 5. The M14 capabilities ADR; the key ceremony with two keys (BL-335), host (BL-337), docs base env var, first signed publish of all three documents from the current `packages/content`. Then the cache numbers, the L10 fix, the new switches and their consumers; then screen slots and new keys; then the 5-minute staging test before C1.
- **ADRs required before build** (numbers per `08-delivery.md` section 8.1; matches R2's list item 5): **M14 capabilities and kill switches (amends ADR 0016)**: per-feature build flags, the remote switch list in 6.5, the cache policy and refresh interval of F19-REQ-026, two signing keys and the rotation runbook. Closes R2 AR-12, AR-27, AR-28; blocks WP-F19-15, -16, -12a to -12r. ADR 0016 itself is still "Proposed" and is accepted with these deltas in the same PR (R2 AR-25).
- **Riskiest unknown.** That an iPhone can download a 574 MB model through R2 and Hugging Face redirects with Range requests and hash it in acceptable time on an SE 3 (ADR 0016 9, U). Spike: one TestFlight build, Hindi chosen on Wi-Fi, timings recorded.

## 12. Work packages

Only for what is missing or partly built.

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode |
|---|---|---|---|---|---|---|
| WP-F19-01 | Key ceremony with a primary and a cold backup key, rotation runbook | Founder, S07 | `packages/api/src/keys.ts`, `docs/runbooks/` (request) | none | `[F19-REQ-002]`; app build trusts both keys | Human then agent |
| WP-F19-02 | Docs base for store builds and a config test | Platform | `apps/mobile/eas.json` (or EAS environment), `apps/mobile/test/capabilities.test.ts` | WP-F19-01, host decision | `[F19-REQ-005]` | Pair (founder sets the EAS variable) |
| WP-F19-03 | Pack host, uploads, one host name | Founder, speech agent | `apps/mobile/src/lib/models/catalog.ts` `SELF_HOST_BASE`, `docs/ops/DOMAINS.md` | BL-337 | `[F19-REQ-019]` Range 206 from an iPhone | Pair |
| WP-F19-04 | First signed publish and deploy | Coordinator with founder's OK | `supabase/functions/*/published.ts`, `scripts/packs/remote-config.json` | WP-F19-01 to 03 | `[F19-REQ-023]`; phones accept all three | Human |
| WP-F19-05 | L10: ignore same-version bodies, staleness rule for kill switches | Platform | `apps/mobile/src/lib/remote/documents.ts`, `__tests__/documents.test.ts` | none | `[F19-REQ-008]`; `[F19-REQ-001]` | Agent |
| WP-F19-06 | Vocabulary guard test | Platform | `packages/api/test/remote-config.test.ts`, `test/content.test.ts` | none | `[F19-REQ-009]` | Agent |
| WP-F19-07 | New keys with clamps; remove reads of `readTogetherFreeSessions` from `scripts/packs/remote-config.json` | Platform | `packages/api/src/remote-config.ts`, its test, `scripts/packs/remote-config.json` | Owners of F04, F08, F17 | `[F19-REQ-013]`; `[F19-REQ-003]`, `[F19-REQ-010]` | Agent |
| WP-F19-08 | Manifest `gate` field and the listing rule | Platform, speech | `packages/api/src/pack-manifest.ts`, its test, `apps/mobile/src/lib/packs/` | F05, F21 listing | `[F19-REQ-020]` | Agent |
| WP-F19-09 | Screen slots: Tonight prompts from `usePromptLibrary`, tip and announcement slots | Mobile | `apps/mobile/src/app/(tabs)/index.tsx`, `review.tsx`, `(tabs)/book.tsx`, `settings/index.tsx` (slot lines only) | WP-F19-04 | `[F19-REQ-016]`; `[F19-REQ-015]` | Agent |
| WP-F19-10 | Update card | Mobile | New `apps/mobile/src/components/content-blocks/update-card.tsx`, copy in feature `copy.ts` | none | `[F19-REQ-012]` | Agent |
| WP-F19-11 | Full content rules in the publisher | Content | `scripts/packs/lib.ts`, `packages/content/test/rules.test.ts` (read the extra file) | none | `[F19-REQ-017]`; `[F19-REQ-014]` | Agent |
| WP-F19-12s | `killSwitches.sync` consumer **[server]** | S03 | `apps/mobile/src/lib/sync/` | WP-F19-16 | `[F19-REQ-011]` sync row; `[F16-REQ-018]` | Agent |
| WP-F19-12f | `killSwitches.invites` consumer **[server]** | S04 | `apps/mobile/src/lib/family/` | WP-F19-16 | `[F19-REQ-011]` invites row | Agent |
| WP-F19-12a | `forceReauthEpoch` consumer **[server]** | S01 | `apps/mobile/src/lib/auth/` | none | `[F19-REQ-011]` epoch row; `[F02-REQ-023]` | Agent |
| WP-F19-12b | `backupUploads` and `escrow` consumers **[server]** | S05 | `apps/mobile/src/lib/backup/`, `supabase/functions/escrow/` | WP-F19-16, WP-F08-B5a | `[F19-REQ-011]` backup rows; `[F08-REQ-041]` | Agent |
| WP-F19-12r | `statusReport` consumer **[server]** | S06 | `apps/mobile/src/lib/billing/` | WP-F19-16 | `[F19-REQ-011]` status row | Agent |
| WP-F19-13 | Staging kill test and local smoke under every switch | QA | `docs/qa/` script | WP-F19-04 | `[F19-REQ-006]`, `[F19-REQ-007]`; `[LEGAL-REQ-040]` (exists in `packages/api/test/remote-config.test.ts`) | Pair (two phones) |
| WP-F19-14 | Review-notes flag list | Release owner | F21 review notes | WP-F19-07 | `[F19-REQ-024]` | Agent |
| WP-F19-15 | Cache and refresh numbers | S07 | `packages/api/src/standards.ts` (`CACHE_POLICY.remoteConfig`, `CLIENT_REFRESH_MS.remoteConfig`), `supabase/functions/config/serve.test.ts` | M14 capabilities ADR | `[F19-REQ-026]`; `serve.test.ts` header assertions; `[F19-REQ-004]`, `[F19-REQ-021]`, `[F19-REQ-022]` | Agent |
| WP-F19-16 | New kill-switch keys in the schema; build flags `capabilities.backup` and `capabilities.statusReport` | S07 (schema), S20 (`capabilities.ts`, `eas.json`) | `packages/api/src/remote-config.ts` and test; `apps/mobile/src/lib/capabilities.ts`, `apps/mobile/eas.json` | M14 capabilities ADR | `[F19-REQ-025]`; schema test lists the three new switches | Agent |

## 13. Open questions and assumptions

| Q | Who, by when | What changes |
|---|---|---|
| Q1 Where do documents live? With server features on (M14) the app falls back to the Supabase origin; a build with the switch off (the kill path) needs `EXPO_PUBLIC_DOCS_BASE_URL`. Supabase functions origin set as that variable too, or a Cloudflare host in front? Default [R]: the Supabase origin now, Cloudflare later with no app change | Founder; 16 Oct | WP-F19-02 |
| Q6 Is a 2-minute foreground refresh acceptable for Edge Function invocation cost at 100k families? Spec default: yes; the alternative is the counsel-approved 10-minute bar R2 AR-27 names | Founder with counsel; before WP-F19-15 | F19-REQ-026, LEGAL-REQ-040 |
| Q2 Pack host and name: R2 on `packs.earlyletters.com` (moves DNS to Cloudflare) or `packs.earlyletters.app` (ADR 0016 F-1, F-2). Answered: D-097 (delegated by the founder, 15 Oct, now on `develop`; confirmed by D-111 item 3) picks `packs.earlyletters.app` on Cloudflare R2 with `earlyletters.com` DNS unmoved. Built in the app by PR #126 (`PACKS_ORIGIN` in `apps/mobile/src/lib/models/catalog.ts`); the R2 bucket and DNS record are founder account steps | Founder; answered 15 Oct (D-097) | WP-F19-03, subprocessor page |
| Q3 Mobile data threshold 5 MB or 0 (ADR 0016 F-3) | Founder; 16 Oct | One constant |
| Q4 Does a file name that reveals a chosen language, seen by the host with an IP, need more than a Privacy Policy line? **[Counsel]** (COUNSEL_PACKET Q12) | Counsel; 29 Oct | Mirror models to our host |
| Q5 Is a remote language `gate` change a feature change under 2.3.1(a)? Spec default: only between states the reviewed listing names **[Counsel]** | Counsel or founder; 23 Oct | F19-REQ-020 |

| A | Assumption | How we validate |
|---|---|---|
| A1 | Supabase does not cache Edge Function responses, so every request is a billed invocation (ADR 0016 6, U) | Usage dashboard after C1 |
| A2 | URLSession follows Hugging Face redirects with Range intact | Spike in WP-F19-03 |
| A3 | With `stale-while-revalidate=30`, a CDN does not push kill latency past 5 minutes | WP-F19-13 |

## 14. Sources

- Brief and rulebook: `docs/agents/BRIEF-2026-10-03.md` items 15 to 17; `_AUTHORING.md` 3 (B13 to B15), 3b (M1, M2, M12, M13).
- Decisions: D-035, D-046, D-066, D-068 in `docs/DECISIONS.md` on develop; commit c1764f9; `_AUTHORING.md` M14 to M16.
- Reviews: `reviews/R2-architect.md` AR-12, AR-18, AR-25, AR-27, AR-28; `reviews/R5-eng-qa.md` EQ-17; `reviews/R1-product-leader.md` PL-03; `docs/reviews/2026-10-04-security-privacy.md` L3, L10.
- Code read 13 Oct 2026: `packages/api/src/standards.ts` (`CACHE_POLICY`, `CLIENT_REFRESH_MS`), `packages/api/src/keys.ts`, `apps/mobile/src/lib/capabilities.ts`.
- ADRs: `docs/adr/0016-lean-app-and-server-driven-content.md` sections 2 to 9; `docs/adr/0017-api-standards.md` sections 1 to 4.
- Code: `packages/api/src/` (`remote-config.ts`, `content.ts`, `pack-manifest.ts`, `integrity.ts`, `keys.ts`, `standards.ts`) and `packages/api/test/`; `apps/mobile/src/lib/remote/`; `apps/mobile/src/lib/packs/`; `apps/mobile/src/lib/models/speech-packs.ts`, `catalog.ts`; `apps/mobile/src/components/content-blocks/`; `apps/mobile/src/lib/capabilities.ts`; `apps/mobile/eas.json`; `apps/mobile/src/app/_layout.tsx`, `(tabs)/index.tsx`, `settings/storage.tsx`; `supabase/functions/config/`, `content/`; `scripts/packs/`.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-040, -044, -059; `docs/legal/COUNSEL_PACKET.md` Q12.
- Review: `docs/reviews/2026-10-04-security-privacy.md` L3, L10.
- Backlog: `docs/BACKLOG.md` BL-022, BL-335, BL-337, BL-339; `docs/backlog/future/06-coparent-sharing-v1-1.md` section 4.
- Research: R1 F19 (R1-S20, R1-S23, R1-S27, R1-S48, R1-S49, R1-S70); R4 sections 5 and 6 (R4-S55, R4-S63 to R4-S65).
- Siblings: F03-REQ-004, F04 `capture_max_minutes`, F05 signed manifest, F08 `listening_copy_enabled`, F13-REQ-001, F16 `sync_enabled`, F17 `app_lock_grace_seconds`.
