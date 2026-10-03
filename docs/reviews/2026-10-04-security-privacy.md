# Security and privacy review, wave `auto/2026-10-04-wave`

Reviewer: `security-review` agent (independent; did not write this code). Date: 3 Oct 2026 (UTC), for the 4 Oct wave.
Status: review only. No code was changed. No Critical finding, so the one-line-fix exception was not used.

## 1. Scope, method, results

**Read:** CLAUDE.md, BRIEF-2026-10-03, DECISIONS (D-001 to D-070), LEGAL-REQ 1.1.0, TDD 04 (3.1 to 3.4, 3.11), APPLY.md, AUTH_SETUP, ops SECURITY and README.
**Reviewed code:** all 11 migrations; Edge Functions `purge-worker`, `analytics-forget`, `config`, `content`, `_shared/log`; `packages/api` (canonical JSON, Ed25519 envelopes, manifests, remote config); mobile `lib/{supabase,auth,family,sync,packs,remote,billing,analytics,account-deletion,export}`, `+native-intent.tsx`, `_layout.tsx`, `app/invite`, `app/(auth)/sign-in/verify.tsx`; Swift `scribe-store`, `scribe-audio`, `scribe-files`; `scripts/packs`, `scripts/ops`; `app.config.ts`, `eas.json`.

**Tests run (all green, unchanged code):**
| Suite | Result |
|---|---|
| `npm test` (9 workspaces) | 1,149 passed |
| `npm run test:db` | 12 of 12 files passed |
| `npm run test:functions` (Deno) | 59 passed |
| Proof-of-concept suite (scratch, PGlite, all 11 migrations) | 10 of 10 PoC checks reproduce the findings marked [PoC] |

The PoC script lives in the session scratchpad (`sec/poc.test.mjs`); its steps are in the appendix. It was not added to the repo because each check asserts today's unsafe behaviour; `db-followup` (migrations `20261005*`) should turn the relevant ones into regression tests that assert the fix.

**Other checks:** secret scan of the repo (no keys; only test fixtures), `npm audit --omit=dev`, licence scan of 290 production packages, SECURITY DEFINER inventory (every function pins `search_path`; `anon` can execute 0 public functions; `insights_reader` can execute only `insights_aggregates`), dynamic SQL review (`format` with `%I` and `USING` only).

### Summary
| ID | Severity | Finding | Owner |
|---|---|---|---|
| H1 | High | An email sign-in link from anyone signs the phone into that person's account and uploads every local letter to it | auth owner (`lib/auth`), sync owner |
| H2 | High | Book membership integrity: unlimited parents, stale invites stay valid after the inviter leaves, invites accept without a tap and switch the open book, nobody can remove a member [PoC] | db-followup (SQL), family owner (app) |
| H3 | High | Sign in with Apple tokens are never captured, so account deletion cannot revoke them (App Store 5.1.1(v)) | auth owner, founder |
| M1 | Medium | Family members (contributors) read the child's birth year and due date straight from `children` (D-039) [PoC] | db-followup |
| M2 | Medium | Invite tokens travel in the URL path; the Privacy Policy says they travel where servers do not log | founder (format), legal-alignment (claim), website thread |
| M3 | Medium | Rate limits are advisory or missing: the sync counter is client-resettable, most RPCs have none, append-only tables can be spammed [PoC] | db-followup |
| M4 | Medium | Email code brute force: 6 digits, 1 hour, no CAPTCHA, no detection job | founder (dashboard), auth owner |
| M5 | Medium | `sync_pull` reveals when someone writes a private letter in a shared book [PoC] | sync owner / db-followup |
| L1 to L12 | Low | Op-id squatting, Storage move into foreign folders, unwired forced re-auth, export gaps, dependency advisories, privacy manifest, and others (section 5) | various |

## 2. Critical

None found. Nothing lets a stranger read another family's letters without the victim's action, and nothing in the server leaks raw transcripts to co-parents (section 6).

## 3. High

### H1. Login CSRF through the email sign-in link exfiltrates local letters
**Where:** `apps/mobile/src/app/(auth)/sign-in/verify.tsx:23-31` (verifies any link on open); `apps/mobile/src/lib/auth/session-provider.tsx:330-343` (`verifyEmailLink` accepts a link whatever the current state); `apps/mobile/src/lib/auth/auth-store.ts:43-49` and `apps/mobile/src/lib/sync/index.ts:88-90, 129-131` (`claim()` runs on SIGNED_IN, before consent); `apps/mobile/src/lib/supabase/client.ts:70` (implicit flow; no PKCE).

**Failure scenario:**
1. Attacker requests a sign-in email for their own address and copies the link `https://earlyletters.com/auth/callback#token_hash=<hash>&type=email`. Their account has already accepted Terms and sensitive-data consent.
2. Attacker sends it to a parent who uses the app without an account (local-first; never signed in on this phone): "Your Early Letters sign-in link".
3. Victim taps it. The universal link opens the app, `+native-intent` stores the hash, `/sign-in/verify` calls `verifyOtp` immediately. The phone is now signed in as the attacker.
4. `onSignedIn` fires `takeOwnership()`: the phone's owner becomes the attacker's id, every local letter gets `author_id = attacker`, and all books and letters are queued. `my_sync_gate()` is already satisfied, so the state goes to `ready`, the consent sheet closes by itself and `sync_push` uploads everything (final text, raw transcripts, edits, child names and dates).
5. The attacker signs in on their own phone and reads it all. When the victim later signs into their own account, `AccountMismatchError` stops sync for good: their letters stay hostage to the attacker's account.
Variant: a victim already signed in loses their session to the attacker's (denial of service, no data moves because the owner differs).

**Impact:** full disclosure of a family's L4 content (letters, raw transcripts, child name, birthday, due date) with one tap on a link on the real domain; permanent loss of sync for the victim.

**Fix:**
- Use Supabase PKCE for email links (`auth.flowType: 'pkce'`, template link carries the PKCE code). A link opened on a phone that did not request it then fails; the typed code still works across devices.
- Until then: accept an opened link only while this phone has a pending request (`getPendingEmail()` set by `sendEmailLink` in this session, or a persisted request nonce); otherwise route to "type the code".
- Never claim local data on SIGNED_IN. Run `takeOwnership` only after consent, behind a screen that shows the account email ("Your letters will be kept in the account a***@example.com") and a tap.
- Refuse a link while a different account is signed in.

### H2. Book membership integrity (parents, invites, removal) [PoC F2]
**Where:** `supabase/migrations/20261003000000_security_and_family.sql:317-347` (`create_child_invite`: no parent cap), `:366-392` (`accept_child_invite`: does not check the inviter is still a parent, no cap); `supabase/migrations/20260930000000_scribe_core.sql:255` (only self-leave; no removal path); `apps/mobile/src/app/invite/index.tsx:78-85` (accepts automatically) and `:94` (`setActiveChildId`).

**Failure scenarios:**
1. Third parent (PoC F2c): parent A invites B and S as parents; the book has 3 parents. D-069 (recommended, "before any non-founder data exists") says 2. The app hides the invite card after one co-parent, but the RPC does not.
2. Stale invite (PoC F2a-b): co-parent B mints a parent invite, then leaves the book. Stranger C accepts the old link and becomes a parent with full read access to A's letters. A cannot remove C (PoC F2d: the delete is silently filtered by RLS).
3. Silent join plus book switch: an attacker creates a book with the same child name and sends an invite link. The victim taps it; the invite sheet accepts with no confirmation as soon as the session can sync, and makes the attacker's book the open book. Letters the victim writes next land in a book the attacker reads.

**Impact:** an estranged or malicious co-parent can grant a third person lasting access to the other parent's letters; a phishing link can redirect a parent's writing into an attacker's book. Separation and safety risk (pm-2 FAM-11).

**Fix (SQL, db-followup is already on the cap):** cap parents at 2 in both `create_child_invite` and `accept_child_invite` (row lock on the book); at accept, require `invited_by` to still be a parent of the live book; revoke a member's open invites when they leave or are removed; add `remove_child_member` (parents remove contributors, and a parent removal path through support) with audit. **Fix (app):** show "Join {child}'s book as a parent? Invited by {signs_as}" and require a tap (needs a `peek_invite(token)` RPC that returns only child first name and inviter signature); never change the active book on join without a tap.

### H3. Apple token revocation cannot run (App Store 5.1.1(v), A-NFR-011)
**Where:** `apps/mobile/src/lib/auth/apple.ts:12-14` ("Not built here, needs an Edge Function"); `supabase/migrations/20261004200000_ops_deletion_worker.sql:329-338` (`ops_apple_token_put`, no caller); `supabase/functions/purge-worker/account.ts:179-187` (no token: step marked `not_applicable`, alert `apple_no_token`).

**Failure scenario:** a person signs in with Apple, later deletes the account. The deletion completes, but Apple still lists Early Letters under "Sign in with Apple" for that Apple ID, because no authorization code was ever exchanged for a refresh token. App Review tests this path and Apple's guidance for apps offering Sign in with Apple requires revoking tokens through the REST API at deletion.

**Impact:** likely App Review rejection; deletion receipt says `apple: no_token` for every Apple user; a privacy promise (complete deletion) not kept.

**Fix:** send `credential.authorizationCode` from `signInWithApple` to an `apple-token` Edge Function (JWT verified, user id from the token), exchange it at `https://appleid.apple.com/auth/token`, wrap the refresh token with `wrapAppleToken` and store it via `ops_apple_token_put`. Rate-limit it. Founder sets `APPLE_TEAM_ID`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_PRIVATE_KEY`, `TOKEN_KEK_V1`. Add a device test to the release checklist.

## 4. Medium

### M1. Contributors read birth year and due date directly [PoC F1]
**Where:** `supabase/migrations/20260930000000_scribe_core.sql:248` (`children_member_select` for every member, all columns). `sync_pull` and `sync_books` respect D-039, the table does not.
**Scenario:** a parent invites a family member through the RPC (the database supports contributors even though the app hides them in v1.0). The contributor runs `select date_of_birth, due_date from children` through PostgREST and gets both (PoC returned `2026-03-05` and `2026-03-01`).
**Impact:** due date is consumer health data (K-25); D-039 says contributors never see it or the birth year.
**Fix:** split the select policy: parents read `children`; contributors read a `book_profile` security-barrier view (id, name, nickname, birthday month and day, family_can_read), or revoke column privileges on `date_of_birth`, `due_date` and `photo_path` from `authenticated` and serve parents through an RPC. Also consider refusing `p_role = 'contributor'` in `create_child_invite` while D-055 holds. Owner: db-followup.

### M2. Invite token in the URL path contradicts a published claim
**Where:** `apps/mobile/src/lib/family/invite-link.logic.ts:18, 26` (`https://earlyletters.com/i/<token>`); `docs/ops/AUTH_SETUP.md:190` (known gap); `docs/legal/privacy-policy.md:195` ("travel in the part of the link that servers don't log"); TDD 04 3.4.1 and LEGAL-REQ-026 require the fragment.
**Scenario:** the invitee opens the link on a phone without the app, on a `www.` host (not in `associatedDomains`, but accepted by the parser), or a messaging app fetches a link preview server-side. The full path, with a live parent token, lands in Vercel request logs and in any website analytics. Anyone with log access, or the preview service, can redeem it within 7 days.
**Impact:** parent access to a child's book from a log line; the Privacy Policy statement is false today (deceptive-claim exposure, LEGAL-REQ-044).
**Fix:** move to `https://earlyletters.com/i#t=<token>` (AASA pattern `/i`, parser reads the fragment; keep accepting `/i/<token>` for links already sent for 7 days). Until then: legal-alignment edits the claim; the website thread disables logging and analytics for `/i/*` and sets `Referrer-Policy: no-referrer`.

### M3. Rate limits are advisory or missing [PoC F3]
**Where:** `supabase/migrations/20261004100000_sync_engine.sql:187-188` (`sync_rate_windows_own` is FOR ALL on the caller's row); no limit in `record_policy_act`, `delete_entry`, `restore_entry`, `accept_child_invite`, `create_child`, `request_account_deletion`, `sync_books`.
**Scenario:** a client calls `update sync_rate_windows set hits = 0` (or deletes the row) between calls and runs `sync_pull` without limit (PoC F3: 3 to 0). A script loops `record_policy_act` or `delete_entry`/`restore_entry`, filling append-only `policy_acceptances` (rows can never be deleted for account life plus 3 years) and `audit_events`; `p_rendered_sha256` has no size cap.
**Impact:** brief decision 17 and D-067 (rate limit on every endpoint) unmet; cheap database growth and load from one account.
**Fix:** db-followup is closing the sync counter; also make the counter function SECURITY DEFINER with no client policy, add a shared `consume_rate()` to the write RPCs above, cap `p_rendered_sha256` at 32 bytes, and cap acceptances per profile per day.

### M4. Email code brute force
**Where:** `docs/ops/AUTH_SETUP.md:122-128` (6-digit code, 1 hour, verification limit per IP only, no CAPTCHA); `apps/mobile/src/lib/auth/email.ts` (`EMAIL_CODE_LENGTH` 6); the client pause in `pending.ts` does not bind an attacker.
**Scenario:** an attacker who knows a parent's email (the ex-partner case in TDD 04 A1) requests a code and spreads guesses across many IPs; TDD 04 3.1.4 estimates about 1,400 IPs for a 50% chance within the hour. The detection job and sign-in alert email in TDD 04 are not built.
**Impact:** account takeover, then every synced letter.
**Fix:** set OTP length to 8 (dashboard and `EXPO_PUBLIC_EMAIL_OTP_LENGTH` together), lower OTP life to 15 minutes, enable Supabase CAPTCHA on OTP requests if the native flow allows it, build the failure-detection job and the new-session email (TDD 04 3.1.4 items 3 and 4). Owner: founder (dashboard) and auth owner.

### M5. Pull digest reveals private activity [PoC F5]
**Where:** `supabase/migrations/20261004100000_sync_engine.sql:390-404`. The comment at `:50-52` claims the opposite.
**Scenario:** co-parent P2 pulls with a deliberately wrong `have` (`{"n": 999}`). If nothing changed in the book the server echoes 999; if the other parent wrote or edited a private letter (not in the book), `exists(...)` over all rows is true and the real digest comes back (PoC: `{"n":999}` versus `{"n":0}` with zero rows). Polling (120 per minute) gives the time of every private write.
**Impact:** metadata about letters that must stay invisible ("even its id must not leave the server once it is private"); matters in separated families.
**Fix:** compute the changed-since check over the caller's readable set only (own rows plus `book_entries`), or always compute the real digest when `have` does not match.

## 5. Low

| ID | Where | Scenario and impact | Fix | Owner |
|---|---|---|---|---|
| L1 | `20261004100000_sync_engine.sql:161-163, 536` | `sync_op_receipts.op_id` is a global primary key and clients may insert receipts. An account that pre-inserts another person's op id makes that op report `dup` and the write is silently dropped [PoC F4]. Needs the victim's future op id (UUIDv7 from `Crypto.getRandomBytes`), so impractical today. | Key receipts by `(profile_id, op_id)`; revoke client insert and write receipts only inside `sync_push` (SECURITY DEFINER helper). | db-followup |
| L2 | `20261003000000_security_and_family.sql:234-237` | `entry_photos_author_update` checks only folder 2 = caller, not membership of folder 1: a user can move their object into any book's folder [PoC F6]. Not readable there, but it escapes `prepare_account_purge` prefixes (the ownership sweep still catches it) and pollutes another family's prefix. | Add `is_child_member(folder 1)` and `child_is_live` to `with check`. | db-followup |
| L3 | `packages/api/src/remote-config.ts:81`; no consumer in `apps/mobile/src` | `forceReauthEpoch` (LEGAL-REQ-040 "revoke all sessions") is parsed but never acted on. | Sign out locally when the epoch exceeds the stored one; pair with server-side revocation (TDD 04 3.2.3). | auth owner |
| L4 | `apps/mobile/src/lib/export/build.logic.ts:523`, schema | Export lacks consent history and dictionary terms (LEGAL-REQ-034), omits Recently deleted letters, and hardcodes membership `role: 'parent'`. No leak: other people's raw transcripts never reach the phone. | Add `policy_acceptances` (via `my_policy_state` and own rows) and dictionary; use the real role. | export owner |
| L5 | `supabase/functions/analytics-forget/handler.ts:102, 149` | Any signed-in account can ask PostHog to delete any 21 distinct ids a day (no ownership; by design, ids are never stored). Impact limited to analytics integrity, ids are random and never exposed. | Accept as designed; note in TRACKING_PLAN. | analytics |
| L6 | `npm audit --omit=dev` | 35 advisories (23 high) all in Expo build tooling (`node-forge`, `braces`, `uuid` in `xcode`) except `decode-uri-component` 0.2.2 via `expo-router` > `query-string`, which runs in the app (malformed-percent DoS on a crafted link; the app would hang, not leak). `@img/sharp-wasm32` (LGPL-3.0) is extraneous in root `node_modules`; `lightningcss` (MPL-2.0) is build-time only. All runtime licences are permissive. | Track the Expo fix; `npm prune`; keep the licence scan in CI. | platform |
| L7 | `apps/mobile/app.config.ts:72` | No `ios.privacyManifests` (LEGAL-REQ-043). Expo modules ship their own manifests; React Native's required-reason APIs and `whisper.rn` are unverified, so ITMS-91053 is possible at upload. | Add the app-level manifest; inspect `PrivacyInfo.xcprivacy` in the archived `.ipa` before C1. | mobile |
| L8 | every migration | `search_path = public, pg_catalog` puts `public` first; safe only while no API role can create objects in `public`. | Prefer `pg_catalog, public` (or empty with qualified names) in new functions; assert `CREATE` on `public` is revoked from API roles in `ops_schema_health`. | db owners |
| L9 | `modules/scribe-audio/ios/ScribeAudioModule.swift:143`; `modules/scribe-store/ios/PlusStoreSheet.swift:82` | `samples()` traps on NaN or huge ms (`Int(Double)`), crashing the app if the plan ever passes one; `StoreSheet.present` never resumes its continuation if UIKit refuses the presentation (presenter busy), leaving the sheet stuck at `busy` for the process. Memory and threading are otherwise sound (lock-protected cancel set, native buffer freed by its deallocator, only verified transactions finished). | Clamp and `isFinite`-check inputs; time out or detect a failed presentation and resume once. | speech, payments |
| L10 | `apps/mobile/src/lib/remote/documents.ts:169` | Same-version documents replace the cached one, and there is no freshness bound, so a host or CDN can keep serving an old signed config (for example with a kill switch off). Rollback to a lower version is refused correctly. | Ignore same-version different bodies; add `notAfter` or treat `generatedAt` older than N days as stale for kill switches. | platform |
| L11 | `apps/mobile/src/lib/auth/google.ts`; AUTH_SETUP 3 | Google provider runs with "Skip nonce check" (documented trade-off). A leaked Google ID token for our client id can be replayed for an hour. | Keep; revisit when the library exposes a nonce. | auth owner |
| L12 | `20261004300000_insights_aggregates.sql:138-140` | `k_part` checks part versus total, not nested parts: `first_letter_d7 - first_letter_d1` can be 1 to 9. Counts of accounts only, no identities. | Publish increments (d1, d2-7, d8-30) each through `k_part`, or suppress when the difference is below k. | analytics |

## 6. Verified safe
- **RLS and functions:** every public table has RLS; `anon` can execute no public function; all SECURITY DEFINER functions pin `search_path` and start with `require_user()` or answer only for the caller; dynamic SQL uses `%I` and `USING`; `ops` and `insights` schemas have no API grants; `insights_reader` reaches only `insights_aggregates`.
- **Raw transcripts and working material:** `entries` is author-only; others read through `book_entries` (column allowlist without `raw_transcript`, `raw_sha256`, `machine_edits`, `stt_meta`); `sync_pull` builds others' rows from `book_entries`; `entry_versions` is author-only; `sync_push` errors return SQLSTATE only and are caught, so no row text reaches PostgREST error bodies or Postgres error logs from that path.
- **Export ZIP:** raw transcript, its hash and edits are written only for the exporter's own letters (`own` uses the persisted sync owner, which survives sign-out); others' raw text is never on the phone. No member ids or emails are exported.
- **Anonymous sessions:** restrictive policies on every client table and the photo bucket, `require_user()` in RPCs, `book_entries` refuses them; Supabase anonymous sign-in is off (AUTH_SETUP).
- **Consent gate:** enforced server-side for letters, books, prefs, dictionary, invites, acceptances and photo uploads; deletion and withdrawal are never gated.
- **Invites (cryptography):** 244 random bits, SHA-256 stored, single use, 7 or 14 day expiry, revocable, 20 per book and per parent per day, never accepted from the custom scheme, held in the Keychain (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`) and dropped while the 18+ gate is stopped.
- **Email link:** token hash in the fragment; the website never verifies on load; the custom scheme carries no secret.
- **Secrets:** no keys in the repo or `.env.development`; the app holds only the publishable key; session in the Keychain, this device only; `.gitignore` covers `.p8`, `.pem`, `.key`.
- **Signed documents:** Ed25519 over `early-letters/<kind>/v1\n` plus canonical JSON (kind domain separation, key-to-kind allowlist), empty trusted-key list fails closed, lower versions refused, pack files hashed with SHA-256 before install, pack ids and file names regex-bound (no path traversal), signing key never on a server.
- **Edge Functions:** `purge-worker` (`--no-verify-jwt`) needs `PURGE_WORKER_SECRET` compared in constant time, and a missing secret fails closed (500); `analytics-forget` checks the session itself, refuses anonymous users, rate-limits 5 a day and stores no ids; `config` and `content` serve static signed documents with no user data; no SSRF (all outbound hosts fixed or from env); the shared logger has no free-text field and a canary test.
- **Deletion and purge:** account execution deletes every authored letter (including ones written during the 30-day grace), sole-parent books, queued Storage prefixes, person folders and owned objects, revokes Apple tokens when held, deletes the auth user, then scans every uuid column in `public` and `ops` plus Storage for residue before finalizing; consent rows are pseudonymised with a pepper; book purge cascades members, invites, letters and versions; purged ids cannot be re-inserted.
- **Analytics:** PostHog loads only after a yes, memory persistence, no replay, no autocapture, GeoIP off, typed allowlist with `before_send`; Sentry is not installed.
- **Payments:** StoreKit 2 only, verified transactions only, no transaction ids leave the device; Apple's SubscriptionStoreView shows price, trial, restore, terms and privacy (3.1.2).

## 7. App Store review risks
| Guideline | Status |
|---|---|
| 2.5.2 (no downloaded code) | OK: packs are JSON tables and model weights checked by hash; content blocks are a closed vocabulary rendered by native components. |
| 3.1.1, 3.1.2 | OK: StoreKit only, Apple's sheet carries the disclosures and policy links; keep the EULA link in App Store metadata. |
| 5.1.1(v) account deletion | At risk: H3 (Apple revocation). In-app deletion with a 30-day undo and an email receipt is otherwise in place. |
| 5.1.1(ix) individual seller with sensitive data | Known (D-004); unchanged. |
| 5.1.2 data use | OK: analytics opt-in, nothing before consent. |
| 4.8 login services | OK: Sign in with Apple offered wherever Google is. |
| Privacy manifest (ITMS-91053) | Unverified: L7. |

## 8. Residual risks (accepted or outside this repo)
- Supabase logging settings are unverified: if `log_min_duration_statement` or statement logging is enabled, RPC parameters (letter text in `sync_push`) could reach the log store. Founder to confirm both are off.
- The local SQLite database is protected by iOS Data Protection only (no SQLCipher, LEGAL-REQ-022(d) still open); letters by others stay on a phone after sign-out (local-first design).
- A JavaScript fatal error message could appear in Apple crash logs shared with developers.
- Plus is enforced on the device only (ADR 0013, accepted).
- A signing-key compromise needs an app release to revoke (ADR 0016, accepted).
- The website (Vercel) and its logs, the AASA file and `/i/*` handling are outside this repo (M2).
- Many TDD 04 items are not built yet: security events table, forced session revocation, sign-in alert email, detection job, WISP.

## Appendix: PoC steps (PGlite, all 11 migrations, fictional family)
- F1: parent A creates a book (birthday and due date), invites N as `contributor`; as N, `select date_of_birth, due_date from children` returns both.
- F2: A invites B as parent; B creates a parent invite, then `delete from child_members` for itself; stranger C runs `accept_child_invite(<B's token>)` and succeeds; A invites S as parent: 3 parents; A's `delete from child_members where profile_id = C` affects 0 rows.
- F3: A calls `sync_pull` 3 times, then `update sync_rate_windows set hits = 0` and `delete from sync_rate_windows`: both succeed.
- F4: C inserts `sync_op_receipts(op_id = X, profile_id = C)`; S pushes an `entry.upsert` with op X: result `dup: true`, letter not stored.
- F5: S and P2 co-parents; P2 pulls with `have: {"n": 999}`: echoed; S inserts a private letter; the same pull returns the real digest with no rows.
- F6: C uploads `<own book>/<C>/x.jpg`, then updates its name to `<S's book>/<C>/x.jpg`: allowed.
