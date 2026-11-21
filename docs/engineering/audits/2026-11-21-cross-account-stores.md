# Cross-account stores audit (ledger task 37), 21 Nov 2026

Author: security-architect. Scope: every module-level mutable state and every persisted key in `apps/mobile/src`, on `develop` at `f59e000de`. Question: on a shared phone, one account signs out and another signs in (or the phone is erased). What survives, and should it?

Method: grep for column-0 `let`, module-level `new Map/Set/WeakMap`, `create*Store`, `getSetting/setSetting`, `secureStorage`, `SQLite`; then read each hit and the three end-of-session paths. Fictional family Asha only. No new words, no wiring changed.

## The three ends of an account

| End | Where it runs | What it already clears |
|---|---|---|
| Session end (any sign-out reason) and user change | `publishAuth` (`lib/auth/auth-store.ts:116`), the one place every sign-out passes | `confirmed` claims, `joinWait` (#1317) |
| Same moment, provider effects | `lib/auth/session-provider.tsx:211-238` | reminders and their settings (`lib/reminders/session.ts`), days file, backup state file and upload tokens, pending photo (#1340, `lib/photos/leaving.ts`) |
| Sign-out paths in the provider | `session-provider.tsx:263-268, 343-354, 363-371` | pending email request (Keychain and memory), Apple user id and pending Apple name (all but the Supabase-made path, see F2) |
| Erase everything (signed out only, `lib/erase-everything.ts`) | `eraseEverything`, `resumeEraseAtLaunch` | analytics ids, pending photo, every file, every SQLite row (settings included, so App Lock prefs and `lastLaunchAt`), free-letter count, pending invite, SIGN_IN_LEFTOVERS (incl. device id), backup tokens, reminders, app lock in memory |

The local book itself is per-phone, owned by one account (`sync.owner`), and hidden from any other account by `bookVisibleNow()` (`lib/store.ts:524`, ADR 0031): every list read goes through `shown()`. That gate is why SQLite rows, drafts, the Find index (`lib/store.ts:193`) and the planner need no clear on a switch. Confirmed by `grep`: reads by id stay open on purpose (sweeps).

## Classification

Scope: A = per-account (must end with the account), P = per-phone (belongs to the device, deliberate), I = per-install (Keychain, survives sign-out on purpose), N = no person data (UI or process plumbing).

### Module-level state holding a person's data or identity

| State | file:line | Scope | Ends on session end / user change | Ends on Erase | Verdict |
|---|---|---|---|---|---|
| `joinWait` (child name) | `components/family/join-wait.logic.ts:123` | A | yes, `auth-store.ts:123` | yes (signed out first) | ok |
| `familyNotice` (leave line carries the child's name) | `components/family/family-notice.ts:9` | A | no | no | **F1** (fix PR) |
| `joinedArrival` (a joined book waits) | `components/family/family-notice.ts:30` | A | no | no | **F1** (fix PR) |
| pending photo, adopts queue | `lib/photos/registry.ts:16`, `adopt.ts` | A | yes, `session-provider.tsx:227, 384` | yes, `erase-everything.ts:144` | ok |
| auth `snapshot`, `confirmed`, `announced` | `lib/auth/auth-store.ts:32-39` | A | yes (`confirmed` cleared at sign-out; snapshot replaced) | n/a | ok |
| sync `engine`, `mismatchUser` | `lib/sync/index.ts:55-56` | A | engine stopped on every auth change (`:253`); `mismatchUser` kept unless the phone is empty | n/a | **F4** (low) |
| held consent answers (key, time) | `lib/auth/consent.ts:105` | A | not cleared, but keyed by `[userId, document]` and expire in 23 h; holds no content | n/a | ok (fail-closed by key) |
| backup `host`, `backupDbs`, `endedAccounts`, token vault | `lib/backup/runtime.ts:418-473`, `files.ts:301`, `token-vault.ts` | A | yes: account host, file, tokens (`session-provider.tsx:213-226`) | yes (`deleteBackupFiles`, `removeAllBackupTokens`) | ok |
| days store | `lib/days/index.ts:104` | A | yes, `endDaysSession` first and synchronously (`reminders/session.ts:36`) | yes (`eraseDaysFile`) | ok |
| reminders: scheduler `lastSignature`, notifications, settings | `lib/reminders/scheduler.ts:51-56` | A | yes (`settleReminderSession`, plus the launch mark) | yes (`forgetReminders`) | ok |
| pending email (memory) and Keychain request time | `lib/auth/pending.ts:70`, `PENDING_REQUEST_KEY` | A (sign-in in progress) | Keychain: yes on every provider path; memory `pendingEmail`: cleared on code screen paths, not at session end | Keychain yes | **F3** (low) |
| `pendingLink` (one-shot sign-in token hash) | `lib/auth/pending.ts:69` | A | no; taken once by `/verify`, then null | no | **F3** (low) |
| `wrongCodes` (times per address) | `lib/auth/pending.ts:72` | P | no; this is a rate pause, keeping it is the safe side | no | ok |
| `plan-store` snapshot and plan | `lib/billing/plan-store.ts:22-27` | P (StoreKit is per Apple ID on the phone) | no, by design | cache row erased; in-memory plan kept until relaunch | ok (see note 3) |
| `letter-ledger` `floor` | `lib/billing/letter-ledger.ts:45` | P | no, by design (D-083: the free count belongs to the phone) | yes, `clearLedger` resets `floor` | ok |
| app lock `state` | `lib/app-lock/controller.ts:18` | P | no, by design (device lock) | yes, `reloadAppLock` | ok |
| analytics consent and ids (settings table) | `lib/analytics/index.ts:46-110` | P | no | yes, `stopAnalyticsForErase` | **F5** (latent, analytics off in v1.0) |
| `sampleWords` (transcript words) | `lib/transcription-queue/index.ts:105` | A | no | no | ok: set only for sample (development) transcribers, never stored |
| `transcription-queue` `state` (job per draft id) | `lib/transcription-queue/index.ts:96` | A | jobs hold ids and failure codes, no text; reads of the draft are gated | n/a | ok |
| `askSession`, `lettersAtStart`, `askShownInSession` | `lib/asks/index.ts:43`, `analytics/ask.ts` | P | counts and times only | settings erased | ok |

### Persisted keys

| Key | Store | Scope | Session end / user change | Erase | Verdict |
|---|---|---|---|---|---|
| Supabase session | Keychain (`SESSION_STORAGE_KEY`) | A | removed by `signOut({scope:'local'})` | n/a (signed out) | ok |
| `scribe.family.pendingInvite` | Keychain | P (a link opened before sign-in) | not cleared at sign-out or user change; cleared on accept, a final error, 14 days, age gate, Erase | yes | **F6** (decision) |
| `scribe.auth.appleUser` | Keychain | A | cleared on Sign out, under-18, revoked; **not** when Supabase ends the session itself | yes | **F2** (low) |
| `scribe.auth.pendingName` | Keychain | A | cleared after use | yes | ok |
| device id (`DEVICE_ID_KEY`) | Keychain | I | kept on purpose ("the same phone stays the same device") | yes (new device) | ok |
| backup upload tokens | Keychain, keyed by profile id | A | yes, `removeBackupTokensFor`, `pruneBackupTokensExcept` | yes | ok |
| free-letter count | Keychain + SQLite | P | kept on purpose (D-083) | yes | ok |
| `accountDeletion.openRequest` | settings | A | note carries `userId`; another account's note is not shown (`noteOfAccount`) | yes | ok |
| `reminders.*`, `reminders.session` | settings | A | cleared (`REMINDER_SETTING_KEYS`) | yes | ok |
| `plus.statusReport`, `plus.cache` | settings | P | per phone and Apple ID | yes | ok |
| `appLock.enabled`, `appLock.grace` | settings | P | kept on purpose | yes | ok |
| `auth.lastMethod` | settings | P | kept; tells which button to lead with | yes in rows, in-memory `useState` until relaunch | **F7** (info) |
| `activeChildId`, `asks.*`, `review.defaultView`, `appearance`, speech language keys, `book.seenFromOthers` (letter ids only), `newPhone.arrival` | settings | P | kept; the book itself is hidden by `bookVisibleNow()` so an id with no visible book reads nothing | yes | ok |
| SQLite rows (books, letters, drafts, outbox, Find index) | `scribe` db | owner account | hidden from other accounts by `bookVisibleNow()`; never deleted on switch | yes | ok |

Pure plumbing with no person data and no gap: fonts, haptics, motion, a11y, `capabilities` test overrides, formatters, caches of `Intl`, whisper runtime, pack manager, speech packs, audio mode, perf ring, `litThisSession`, `settledThisSession`, `entered`, `lampMemory` (positions only), `cardPages` and `bookHandoff` (a deleted entry held until the Book takes it, see note 2).

## Findings

Severity is for a shared phone. None is high: no letter, transcript, audio or token reaches another account through any path found.

| # | Severity | Finding | file:line | Minimal fix | Status |
|---|---|---|---|---|---|
| F1 | MEDIUM | The leave line a family sheet leaves for the page under it is `fill(l.done, { child })`, so it holds the child's name in memory until a page takes it. `joinedArrival` is the same one-shot shape. Neither is cleared when the session ends or the account changes, the same hole BL-1424 closed for `joinWait`. | `components/family/family-notice.ts:9, 30`; `app/invite/leave.tsx:110` | `clear()` on both, called beside `joinWait.clear()` in `publishAuth`. | Fix PR with failing test first (`test/auth-family-notice-sign-out.test.ts`). |
| F2 | LOW | When Supabase ends the session itself (`SIGNED_OUT` event: revoked elsewhere, refresh failure) the handler clears the pending email request but not the Apple user id, so account A's Apple identifier stays in the Keychain. The Sign out, under-18 and revoked paths do clear it. Not exploitable: the revocation watch only acts when the current session is an Apple session (`isAppleSession`), and the next Apple sign-in overwrites it. A residue, not a leak. | `lib/auth/session-provider.tsx:263-268` (compare `:351`, `:369`) | `void forgetAppleUser();` next to `void clearPendingEmailRequest();` (Keychain only, safe in the callback). | Proposed; test with the provider paths. |
| F3 | LOW | `pendingEmail` (an address) and `pendingLink` (a one-shot link hash) are not cleared when the session ends. Both are only read in the sign-in flow, and `pendingLink` is single use and expires with the link. | `lib/auth/pending.ts:69-70` | Clear both where `clearPendingEmailRequest` already runs at session end. | Proposed. |
| F4 | LOW | `mismatchUser` outlives the session that set it when the phone holds a book (`releaseEmptyPhone` only clears an empty phone), so `idleStatus()` can say `account_mismatch` with nobody signed in. Display only: the engine stays stopped, the book stays hidden. | `lib/sync/index.ts:56, 63, 232` | Clear it when the session user is null; keep it for a different signed-in user. | Proposed. |
| F5 | LATENT | Analytics consent and ids live in the settings table, per phone. If analytics is on, account B inherits account A's yes and the same random id. Off in v1.0, and Erase everything does stop and forget. Whether consent is per person or per phone is a privacy call, not a code one. | `lib/analytics/index.ts:46-110, 182` | None now. Question for privacy and the founder before analytics ships. | Reported. |
| F6 | DECISION | A saved invite link survives sign-out and a user change (14 days at most). That is the point of A-REQ-028 (it survives sign-in and a kill), but it means a link opened on a shared phone before the next person signs in is offered to that person. Joining still needs their own tap and sign-in; the token is a capability, not an identity. Recommend keep as is: clearing it on sign-out would break "open the link, then sign in as the other account". | `lib/family/pending-invite.ts:9-45` | None. If the founder wants fail-closed, clear on `publishAuth` user change only (not on first sign-in). | Reported for Karma's exec review. |
| F7 | INFO | The last sign-in method is a per-phone hint kept across accounts and, after Erase, in provider memory until relaunch. | `lib/auth/session-provider.tsx:124-171` | None. | Reported. |

## Notes

1. Wiring merged in #1317, #1319 and #1340 was read and is sound: `publishAuth` is the single choke point; the photo discard runs on user change and on a forced sign-out; the typed `pendingUploads` is used by `signOut()`.
2. `bookHandoff` (a deleted `Entry`, including its text, held until the Book takes it) is set only by the letter page when the Book is directly below it and is taken on the Book's focus. A session end between the two would need the account cover to be up; the cover (`components/account/account-layer.tsx`) unmounts both screens. Not raised as a finding; worth a one-line `clear()` if F1's pattern is extended.
3. After Erase, `plan-store` keeps its in-memory plan until relaunch (its cache row is gone). StoreKit entitlements belong to the Apple ID, not the account, so this is correct.
4. Not verified: runtime behaviour on a device (Keychain survival across reinstall, Notification Center). The audit is by reading code on `develop`; each "ok" cites the clearing line.

## Follow-ups (not in this PR)

- F2, F3, F4: three one-concern fixes, each with a test through `publishAuth` or the provider. Low severity, so queued, not rushed.
- F5, F6: privacy and founder decisions.
- Consider a table-driven test that lists every `let` at module level in `src/` against an allow-list with a scope tag, so a new singleton cannot land without a stated scope (enforcement is `not yet`).
