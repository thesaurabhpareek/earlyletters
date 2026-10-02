---
title: Deletion, export and data integrity specification
version: 1.0.0
status: draft-for-counsel
effective_date: TBD
owner: founder (data governance lead role)
implements: data-policy.md v1.0.0
sql_draft: supabase/migrations/drafts/20261002000000_data_governance.sql
sql_tests: supabase/tests/drafts/data_governance.test.mjs (42 checks, passing on 2 Oct 2026 in PGlite on top of the two live migrations; existing rls.test.mjs still passes with the draft applied)
changelog:
  - version: 1.0.0
    date: 2026-10-02
    summary: First draft. Deletion flows with states and timelines, contributor removal decision, account deletion for Apple and Google Play, backups and PITR, processors, receipts, legal holds, export formats and 18-year plan, integrity controls, DATA-REQ-001 to DATA-REQ-066 with acceptance criteria, draft migration and tests.
---

# Deletion, export and data integrity specification

> **AI-drafted for counsel review. Not legal advice.** Sources [D#] are listed in `data-policy.md` and were opened on 2 Oct 2026. **Unverified** marks anything not backed by an opened page.

Technical design agents implement the `DATA-REQ-###` items below. Each has acceptance criteria in Given/When/Then form. Priority: **P0** blocks the iOS launch, **P1** launch quarter, **P2** later.

## 0. Findings in the current schema (fix before launch)

These were found by reading the two applied migrations and are fixed in the draft migration.

| # | Finding | Impact | Fix (draft) | Req |
|---|---|---|---|---|
| F1 | `children.created_by ... on delete cascade` | When the parent who created a book deletes their account, the whole book cascades away, **including the co-parent's and grandparents' letters**. Violates the equals rule (PRD B F8) and Terms 8.4. | FK becomes `on delete set null` | DATA-REQ-012 |
| F2 | `entries_author_update` lets the author set `deleted_at` to any value | A client can back-date a tombstone (`2000-01-01`) and skip the 30-day undo; can clear `deleted_at` and silently resurrect a purged-pending letter on a stale device | Guard forces server time; restore only via `restore_entry()` | DATA-REQ-013 |
| F3 | `photo_path` is free text; `entry_photos_read` grants read to any member of the entry's child for the object named in `photo_path` | An author can point `photo_path` at another family's object path and expose it to their own family | Check constraint: path must start with `{child_id}/{author_id}/` | DATA-REQ-047 |
| F4 | `children_member_update` allows any member (including contributors) to update the child row | Once `children.deleted_at` exists, a contributor could tombstone or restore a book | `children_guard` trigger blocks client changes to deletion columns | DATA-REQ-014 |
| F5 | `child_members_leave` lets the last parent leave | Book orphaned with no parent: nobody can approve, delete or export it as owner | `child_members_guard` (last-parent guard) | DATA-REQ-016 |
| F6 | `entry_versions` records only `final_text` and `in_book` | A change to `machine_edits` alone (undoing a machine fix) is not reversible server-side | Versions also keep `machine_edits` and `superseded_by` | DATA-REQ-041 |
| F7 | `created_at` is not in the immutability guard | History can be re-dated | Added to the guard | DATA-REQ-040 |
| F8 | No `raw_transcript` checksum | Silent corruption between device and server is undetectable | `raw_sha256` set by the server, immutable | DATA-REQ-046 |
| F9 | RLS `entries_select` returns whole rows to book members, including `raw_transcript`, `machine_edits`, `stt_meta` of another author | Co-parents can read what the machine heard before the author's fixes | Not fixed in draft (column-level); open question OQ-8 | |

---

## 1. Inventory governance

**DATA-REQ-001 (P0) Inventory is the source of truth.** Every table, column, Storage bucket, device store, SDK and vendor appears in `data-policy.md` section 4 with class, owner, retention and reason.
- Given a pull request that adds a table, column, bucket, SDK or vendor, When it is reviewed, Then the same PR updates the inventory row, And CI fails if `information_schema.columns` for `public` contains a column not named in the inventory (P1 automation; P0 manual checklist).

**DATA-REQ-002 (P0) Classification drives handling.** Every inventory row has one class (C, S, A, T) and the handling floor in `data-policy.md` section 2 applies.
- Given a C or S element, Then it is never sent to PostHog, Sentry, logs, audit `detail`, push payloads or support prefill.

**DATA-REQ-003 (P0) Ownership is enforced in the database.** Only the author can update, delete, restore or fully export their letter; parents control book composition; only a sole parent deletes a book.
- Given any role other than the author, When it calls any API (PostgREST table write, RPC, PowerSync upload) to change `final_text`, `machine_edits`, `deleted_at` or `photo_path` of a letter, Then it is refused.

**DATA-REQ-004 (P0) No content outside content stores.** Extends CLAUDE.md privacy rules to audit events and deletion receipts.
- Given the analytics allowlist test, the Sentry `beforeSend` test and the `audit_events.detail` check (512-byte JSON object), When fixtures containing the Asha test letter text are pushed through each, Then no fixture string survives.

**DATA-REQ-005 (P0) Region.** Supabase project in us-west-1. PowerSync Cloud instance in a US region (available regions **Unverified**). No new storage location without an inventory update and Privacy Policy section 9 review.

**DATA-REQ-006 (P0) Retention is automated.** Every period in `data-policy.md` section 6 is enforced by `purge_due()` (hourly Supabase Cron [D11]) and the `purge-worker` Edge Function (every 15 minutes), or by a vendor console setting recorded in the runbook.
- Given a safety event 13 months old, When `purge_due()` runs, Then it is gone (draft test passes).
- Given the PostHog and Sentry projects, Then their retention settings match section 6 and a screenshot is in the runbook.

---

## 2. Deletion flows

### 2.1 State model

```
            delete / request                 day 30 (server clock)          day 30 + 7
  LIVE  ───────────────────────▶ TOMBSTONED ─────────────────────▶ PURGED ─────────────▶ OFF BACKUPS
    ▲                               │  restore / cancel                │ processors (≤ day 45)
    └───────────────────────────────┘                                  ▼
                          legal hold at any point ──▶ HELD (purge paused; resumes on release)
```

| Clock | Value | Enforced by |
|---|---|---|
| In-app undo toast | 5 s, after the tombstone is written; Undo calls `restore_entry()` | App |
| Recently deleted | 30 days from server `deleted_at` | `entries_guard_immutable` sets `now()`; `purge_due()` |
| Purge latency | at most 1 hour after day 30 (cron), storage within 15 minutes after that | Cron + worker |
| Backups | 7 days after purge | Supabase Pro daily backups [D1] |
| Processors | requested at execution; complete within 14 days | Worker steps |

### 2.2 Delete one letter

| Step | Where | What happens | State |
|---|---|---|---|
| 1 | Phone | Author taps Delete, confirms (`settings.delete.entryTitle`, "You can undo this for 30 days from Recently deleted.") | |
| 2 | Phone, local transaction | Local row gets `deleted_at`; letter leaves Book and Tonight; toast with Undo | TOMBSTONED (local) |
| 3 | Sync | PowerSync uploads a PATCH of `deleted_at` only. Server overwrites the time with `now()`, sets `deleted_reason='user'`, writes `entry_deleted` audit. Co-members' devices receive the row change and drop it from the book (RLS `in_book and deleted_at is null`) | TOMBSTONED |
| 4 | Any of the author's devices | Recently deleted lists it with "Erased on {date}" (server `deleted_at` + 30 days). Restore calls `restore_entry()` | |
| 5 | Day 30, server | `purge_due()` hard-deletes the row; `entry_versions` cascade; photo path and (when it exists) backup audio object enqueued; wrapped file key row deleted in the same transaction; id written to `purge_ledger` | PURGED |
| 6 | Worker | Deletes Storage objects through the Storage API [D7]; marks queue rows done | |
| 7 | Every device | PowerSync REMOVE arrives; the app deletes the local row, local `audio/<entry_id>.m4a`, photo and any cached decrypted copy. If the app is offline for longer, a launch-time sweep deletes local files whose entry is tombstoned and older than 30 days by its synced `deleted_at` | |
| 8 | Day 30 + 7 | Supabase daily backups containing the row roll off [D1] | OFF BACKUPS |

**DATA-REQ-010 (P0) Single letter delete and restore.**
- Given an author deletes a letter offline, When the phone syncs 3 days later, Then the server `deleted_at` is the sync time, not the tap time, And Recently deleted shows the erase date from the server value.
- Given a letter in Recently deleted, When the author taps Restore, Then `restore_entry()` succeeds, the letter returns to its previous book state, And an `entry_restored` audit event is written.
- Given a co-parent, When they call `restore_entry()` on another author's letter, Then it fails with "entry not found" (draft test).
- Given a letter tombstoned 30 days ago, When `purge_due()` runs, Then the row, its versions and its photo are gone and the id is in `purge_ledger` (draft test).

**DATA-REQ-011 (P0) Purge reaches every copy we control.**
- Given a purged letter with a backed-up recording, When the worker finishes, Then the ciphertext object is gone from Storage, the wrapped file key row is gone, and the author's devices hold no `audio/<entry_id>.m4a` after their next sync.
- Given a co-parent's phone that cached the decrypted audio for Read together, When the tombstone syncs, Then the cached copy is deleted.
- Given a device offline for 60 days, When it next launches, Then the launch sweep deletes local files for letters tombstoned more than 30 days ago before any UI shows them.

**DATA-REQ-012 (P0) No cascade across authors.** Deleting one person (account, membership or profile) never deletes another person's letters. `children.created_by` is `on delete set null` (F1); `entries.author_id` keeps `on delete cascade` because it only reaches that author's own rows.
- Given parent A created Asha's book with co-parent B and contributor Nani, When A's auth user is deleted, Then the book, B's letters and Nani's letters remain and `children.created_by` is null (draft test).
- Given a schema change adding any foreign key to `profiles` or `auth.users`, Then review confirms its `on delete` action cannot remove another author's content.

**DATA-REQ-013 (P0) Tombstones use the server clock and restore is explicit.**
- Given a client update setting `deleted_at='2000-01-01'`, Then the stored value is `now()` (draft test).
- Given a client update setting `deleted_at=null`, Then it fails with SQLSTATE `SCTMB` (draft test).
- Given a client update to `final_text` of a tombstoned letter, Then it fails with `SCTMB` (draft test), And PowerSync `uploadData` treats `SC***` codes as permanent (DATA-REQ-043).

### 2.3 Delete a child's book

Rules (PRD B-REQ-016, F8; Terms 8.3): only a parent can delete; with a co-parent, delete means "remove my letters and leave"; only a sole parent deletes the whole book.

| Case | `request_book_deletion()` result | What happens |
|---|---|---|
| Caller is a contributor | refused (`SCDEL`) | |
| Two or more parents | `left_and_removed_own_letters` | Caller's letters in this book tombstoned (`deleted_reason='book_deletion'`), caller's membership removed. Co-parent's and family letters untouched. Caller can restore their own letters from Recently deleted for 30 days; they return to the book. |
| Sole parent | `book_scheduled` | `children.deleted_at=now()`, `deletion_requests` row (kind `book`). Book disappears from all members' views (`child_is_live`). Each contributor gets "Save a copy of your letters to {child}" with a server export link valid 30 days (DATA-REQ-054). Any parent can cancel within 30 days. Day 30: `purge_due()` deletes the book; cascade removes members, invites, every letter (including contributors'), versions, dictionary terms; whole `{child_id}/` Storage prefix enqueued. |

**DATA-REQ-014 (P0) Book deletion follows the equals rule.**
- Given two parents, When parent A deletes the book, Then the book remains for B, B's letters and family letters are untouched, A's letters are tombstoned, and A is no longer a member (draft test).
- Given a sole parent with two contributors, When they delete the book, Then both contributors receive the export notice within 1 hour, And no member sees the book, And the parent can cancel until day 30 (draft test for cancel).
- Given any member, When they update `children.deleted_at` directly, Then it fails with `SCDEL` (draft test).
- Given a book under legal hold, When day 30 passes, Then it is not purged.

**DATA-REQ-015 (P0) Nobody deletes another person's words.**
- Given any parent, When they look for a control to delete a co-parent's or family member's letter, Then none exists in the app, the web or the API; only "Keep it aside" for family letters.
- Given a parent calls `delete_entry()` on another author's letter, Then it fails with "entry not found".

### 2.4 Leave a family (any member)

1. Choice: "Leave my letters in the book" (default) or "Take my letters out" (sets `in_book=false` on own letters; nothing is deleted).
2. `leave_child(p_keep_in_book)` (B's function) removes the membership. The draft adds the last-parent guard: the last parent of a live book cannot leave and is offered Delete the book.
3. After leaving: the leaver still reads, exports and can delete their own letters (`entries_select` by author; draft `delete_entry()` works without membership). They cannot write or read others' letters.
4. Keys: the CCK is rotated for new recordings (ADR 0006); recordings the leaver already played may stay on their phone (Terms 7.2, 8.2).

**DATA-REQ-016 (P0) Leaving never deletes and never orphans.**
- Given a sole parent, When they try to remove their own membership, Then it fails with `SCLPG` (draft test) and the UI offers Delete the book.
- Given a co-parent who left keeping letters in the book, Then the remaining parent still sees those letters, And the leaver can still read, export and delete them.
- Given the leaver later deletes one of those letters, Then it leaves the remaining parent's book within one sync.

### 2.5 Remove a contributor (parents only)

**Decision.** A removed family member's letters **already added to the book stay in the book** by default. The removing parent may tick "Also take their letters out", which sets them aside (`approval='set_aside'`, B's model), never deletes them. The contributor keeps their authorship: they can still read, export and delete their own letters, and if they delete one it leaves the book.

**Why.**
1. **Author ownership.** Deleting someone's words is the author's right alone (constitution; Privacy Policy section 14 "Each letter belongs to the person who wrote it"). Removal is about access, not about the words.
2. **The child's interest.** A grandparent's letter is a gift to the child. Removal often follows something unrelated to the letter (a forwarded link, a family rift); destroying the gift by default is irreversible and is the outcome users fear most (USER_RESEARCH fear 5 via PRD B goal 4).
3. **Reversibility.** "Set aside" can be undone; deletion cannot. The default should be the reversible one.
4. **Parents still control the book.** Set aside removes the letters from every reader's view, the PDF and print.
5. **Privacy of the removed person.** They keep full control: they can delete their letters at any time from the return link or the app, and the deletion propagates.

| Step | Effect |
|---|---|
| Parent taps Remove | `remove_child_member()` (B) deletes the membership; `member_removed` audit |
| Return links | All of the contributor's return links for this child revoked at once |
| Keys | CCK rotated for new files; old files stay readable on devices that already had them (ADR 0006) |
| Letters | Stay in the book unless "Also take their letters out" was ticked |
| Contributor view | Return link page shows only their own letters, with Export and Delete |

**DATA-REQ-017 (P0) Contributor removal preserves words and access to them.**
- Given Nani is removed without "Also take their letters out", Then her added letters stay visible to parents, she can no longer read others' letters or write, And she can read, export and delete her own (matches PRD B-REQ-010).
- Given the tick box, Then her letters are set aside, not tombstoned, And a parent can add them back later.
- Given Nani deletes one of her letters after removal, Then it is tombstoned and leaves the book within one sync.

**DATA-REQ-018 (P0) Contributors can delete without the app.** The web return-link page offers "Delete this letter" per letter and "Delete everything I sent" (all letters, recordings in `inbox`, return links, and the anonymous identity).
- Given a web contributor, When they choose Delete everything, Then the same 30-day account deletion flow runs for their identity, And the parents' book loses those letters immediately (tombstoned), And the contributor sees the completion date.

### 2.6 Delete account

Apple: apps that support account creation must let users **initiate deletion inside the app**; deletion must cover the account record and associated personal data including content shared with others; a manual or delayed process is acceptable if the user is told how long it takes; apps outside regulated industries must not require a call or email; Sign in with Apple tokens must be revoked through the REST API; users with auto-renewable subscriptions must be told billing continues through Apple and asked to cancel [D2]. **Verified.**

Google Play: apps with account creation must provide an **in-app path** and a **web link resource** where users can request account and associated data deletion; the page must reference the app or developer name as shown on the Play listing, make the deletion path prominent, and any retained data must be disclosed (for example in the privacy policy) [D10]. **Verified.**

#### 2.6.1 Request (phone)

| Step | Screen | Rule |
|---|---|---|
| 1 | Settings > Your data > Delete account | At most 2 taps from Settings (C-REQ-016) |
| 2 | **What happens** | Lists, per book: "Your N letters to {child} will be removed." Books with a co-parent: "{child}'s book stays with {coParent}." Sole-parent books with family: "{child}'s book will be deleted. Family members can save a copy of their letters." Plain line: "Letters already exported or played on family phones stay with them." |
| 3 | **Export first** | `settings.delete.bookExportFirst`. Export everything is the primary button; Continue is secondary. Export runs locally (DATA-REQ-052). |
| 4 | **Subscription** | If RevenueCat shows an active auto-renewing entitlement: "Deleting your account does not cancel Plus. Billing continues through Apple until you cancel." Button opens `showManageSubscription` on iOS 15+ [D2] (Google Play subscriptions deep link on Android). The user may continue without cancelling; we never block deletion on it (C-REQ-019). |
| 5 | **Confirm** | Re-authentication if the session is older than 24 hours (device passcode/Face ID via LocalAuthentication, else email code), then type-to-confirm (C-REQ-019). |
| 6 | Server | `request_account_deletion(source, had_active_subscription)`: one request per account (idempotent); own letters tombstoned with `deleted_reason='account_deletion'`; sole-parent books tombstoned and linked to the request; steps created; audit event. |
| 7 | Phone | Shows "Your account will be deleted on {date}. Sign in before then to cancel." Signs out this device after unsynced writes are uploaded (A sign-out guard). Analytics opt-out takes effect immediately. |
| 8 | Email | Request receipt: request id, completion date, how to cancel, what is kept (consent records pseudonymised 3 years, transaction records 7 years). Transactional, no content. |

#### 2.6.2 Grace period (30 days)

- The account still exists; the user can sign in, see "Deletion scheduled for {date}", export, or Cancel (`cancel_account_deletion()` restores letters and books).
- Co-members no longer see the user's letters (tombstoned). Sole-parent books are hidden from members; contributors already received their export link.
- No processor deletion yet (so cancellation is complete).

#### 2.6.3 Execution (`purge-worker`, starts within 1 hour of day 30)

Order matters: Supabase refuses to delete a user who owns Storage objects [D6], and the receipt email needs the address before the user is deleted.

| # | Step (`deletion_request_steps.step`) | Action | Success test |
|---|---|---|---|
| 0 | | `purge_due()` moves the request to `executing` (or `held` under legal hold) | status |
| 1 | | `prepare_account_purge(request)`: re-checks holds; tombstones books where the user became sole parent; enqueues all `{child}/{user}/` prefixes and whole prefixes of books deleted with the account; hard-deletes the user's letters and those books; writes the ledger | function returns counts |
| 2 | `storage_objects` | Drain the queue via Storage API (list prefix, delete in batches) | listing each prefix returns 0 objects |
| 3 | `apple_token_revoke` | `POST https://appleid.apple.com/auth/revoke` with the stored refresh token [D2]; `not_applicable` if no Apple identity | HTTP 200 (also returned if already revoked) |
| 4 | `revenuecat` | `DELETE /subscribers/{app_user_id}`, queued asynchronously by RevenueCat; 200 and 404 both mean done [D3]. Does not cancel a store subscription (RevenueCat page does not say it does; treat as **Unverified**, user was told in step 4) | 200 or 404 |
| 5 | `posthog` | `DELETE` person by analytics id with `delete_events=true`; returns 202 queued; events removed off-peak (weekends on Cloud) [D4] | 202, then person lookup 404 within 14 days |
| 6 | `email_provider` | Delete the contact and stored message logs (API **Unverified** until provider chosen). Keep only a suppression hash if the person unsubscribed from commercial email (register CR-060) | provider confirms |
| 7 | `receipt_email` | "Your account and letters have been deleted" with request id and date | sent |
| 8 | `auth_user` | `auth.admin.deleteUser(uid)`: cascades profiles, memberships, dictionary terms, safety events, settings; `children.created_by` set null (F1 fix); `policy_acceptances` pseudonymised by the compliance trigger | `profiles` row absent |
| 9 | | `finalize_account_deletion(request, receipt)`: ledger, audit actor ids nulled, request completed and unlinked | status `completed` |
| 10 | `powersync_verify` | After the next daily compaction [D8], a service query against the PowerSync bucket API for the user's former buckets returns no rows (mechanism **Unverified**; fallback: verify that Postgres has no rows and rely on REMOVE ops) | 0 rows |

Each step is retried with exponential backoff (1 min to 6 h) for 7 days; then the request is `failed` and pages the founder. Steps are idempotent (DATA-REQ-044).

#### 2.6.4 Requirements

**DATA-REQ-019 (P0) In-app account deletion (Apple 5.1.1(v)).**
- Given a signed-in user on iOS, When they open Settings, Then Delete account is reachable in at most 2 taps and completes without email, phone or support contact.
- Given the confirm step, Then the screen states the completion date (30 days) [D2].
- Given an active subscriber, Then the manage-subscription step appears before the final confirm (C-REQ-019) and deletion is not blocked.
- Given an Apple sign-in user, When deletion executes, Then the Apple revoke call returns 200.

**DATA-REQ-020 (P0) Execution order and completeness.**
- Given a due request, When the worker runs, Then steps run in the table order, `auth_user` runs only after `storage_objects` is `done`, And `finalize_account_deletion` refuses to complete while a `profiles` row exists (draft enforces).
- Given the creator of a shared book deletes their account, Then the book, the co-parent's letters and family letters survive (draft test, F1).

**DATA-REQ-021 (P0) Web deletion URL (Google Play).** `https://{brand.company.domain}/delete-account` (POLICY_VERSIONING.md section 4, register CR-091).
- Given the page, Then it names the app as on the Play listing (`brand.storeName`) and the developer (`brand.company.legalName`), and the deletion path is the first action on the page [D10].
- Given a visitor who can still sign in (Apple, Google, email code), When they sign in on the page, Then they get the same What happens, Export (server export, DATA-REQ-054), Subscription and Confirm steps and the same 30-day request (`source='web'`).
- Given a visitor who cannot sign in, Then a form takes the account email; support verifies by sending a sign-in link to that address (Privacy Policy section 14) and files the request with `source='support'`.
- Given the URL, Then it is entered in Play Console before the first Android release, And it works without installing the app.

**DATA-REQ-022 (P0) Subscription notice.**
- Given RevenueCat reports an active auto-renewing subscription on the device, When the user reaches Confirm, Then the notice and manage link have been shown, And `had_active_subscription=true` is stored on the request.
- Given execution while the store subscription is still active, Then the RevenueCat customer is still deleted, And the completion email repeats how to cancel with Apple or Google.

**DATA-REQ-023 (P0) Device data at deletion.**
- Given deletion executes, When any signed-in device of that user next launches or syncs, Then it receives an auth failure, shows "Your account was deleted on {date}", offers one local Export of what is still on the phone, and then wipes the local database, audio, photos, Keychain items for that account and the analytics id.
- Given the user never opens the app again, Then the Privacy Policy states that copies on the phone and in the user's own device backups are under their control.

**DATA-REQ-024 (P1) Delete without an account.** Users who never signed in (A-REQ-014) can "Delete everything on this phone" from Settings > Your data, with export first.
- Given no account, When they confirm, Then all local letters, audio, photos, settings and the analytics id are wiped and nothing is sent to the server.

**DATA-REQ-025 (P0) Receipts.** Three transactional emails (request, cancellation, completion) and an in-app status. The `deletion_requests.receipt` JSON stores counts per category and step outcomes, never content.
- Given completion, Then the receipt includes request id, requested and completed timestamps, counts (letters, books, objects) and each step's status, And the user-facing email includes request id and dates.

**DATA-REQ-026 (P0) Cancel during grace.**
- Given a scheduled request, When the user signs in and taps Cancel, Then all letters tombstoned by the request and all books deleted by it are restored, the request is `cancelled` (draft test), And a cancellation email is sent.
- Given a request in `executing`, Then Cancel is not offered.

**DATA-REQ-027 (P0) Support-initiated deletion.** Verified requests by email, under-13 discovery (register CR-001(d)), and safety removals (PRD B F8.3) use the same functions under the service role with `source='support'`, a `support_access` audit event and a ticket reference. Under-13 data skips the 30-day grace when counsel requires it.

---

## 3. Backups, processors, verification, holds

**DATA-REQ-030 (P0) Backup windows match the published promise.**
Facts: Supabase Pro keeps 7 days of daily backups; Team 14; Enterprise up to 30; Free none. PITR add-on offers 7, 14 or 28 days. Storage objects are not in database backups and deleted objects are not restored [D1][D9].
- Given production, Then the project is on Pro with daily backups, And PITR is either off or set to 7 days, And any change to these settings requires a prior update of `data-policy.md` section 5 and Privacy Policy section 10.
- Given a database restore to time T, When the restore completes, Then the `restore_replayed` runbook re-applies every id in the `ops-ledger` objects dated after T (entries, books, profiles, storage paths) before the project is reopened to clients, And an audit event records the count.

**DATA-REQ-031 (P1) Restore drill.** Quarterly: restore the latest backup into a branch or scratch project, run `rls.test.mjs` and `data_governance.test.mjs` against it, replay the ledger, compare row counts and `raw_sha256` samples to production. Record duration and result.
- Given a drill, Then RPO observed is at most 24 hours and RTO at most 4 hours, or the gap is written up.

**DATA-REQ-032 (P0) Sync layer deletion.** PowerSync buckets are lists of PUT/REMOVE ops; Cloud compacts every bucket daily, replacing superseded ops with MOVE/CLEAR [D8].
- Given a purged letter, When the next compaction has run, Then a fresh client install of any former member receives no row for it.
- Given the RLS/Sync Streams parity test (ADR 0004), Then it includes fixtures for tombstoned letters, deleted books (`child_is_live`), removed members and leavers.

**DATA-REQ-033 (P0) Third-party deletion.** At execution the worker calls each processor in section 2.6.3.
- Given Apple sign-in, Then at sign-in an Edge Function exchanges the authorization code for a refresh token and stores it encrypted, so revocation is possible later (Apple requires a valid refresh or access token to revoke [D2]); `signInWithIdToken` alone does not yield one (**Unverified** for Supabase; verify in Phase 0).
- Given PostHog uses a random analytics id (ADR 0008), Then the server stores that id in an owner-only column so it can be deleted; it is never joined to events for any other purpose.
- Given Sentry events carry no user identity, Then deletion relies on the 90-day retention setting, And the Privacy Policy says so.
- Given AI providers (Groq with ZDR, DeepInfra, Cloudflare), Then nothing is stored to delete; the provider settings snapshot is checked each release (register CR-124).
- Given print orders (P2), Then order and payment records are retained 7 years (proposed) and disclosed.

**DATA-REQ-034 (P0) Deletion verification.** Before `finalize_account_deletion`, the worker runs checks; failures keep the request `executing`.
- Given a completed request, Then: no row in any `public` table references the former profile id (scan of every uuid column listed in the inventory); Storage listing of every enqueued prefix is empty; RevenueCat GET returns 404; Apple revoke returned 200; PostHog person lookup is 404 within 14 days (follow-up check).

**DATA-REQ-035 (P0) Legal holds.**
- Given a hold on a letter, a book or an account, When `purge_due()` runs after day 30, Then the held scope is not purged and an account request moves to `held` (draft test for letters).
- Given the hold is released, Then the next run purges or executes normally.
- Given any user, Then `legal_holds` is unreadable (draft test).

**DATA-REQ-036 (P0) Published deletion SLA.** Live systems within 31 days of request, backups within 38 days, processors within 45 days (`data-policy.md` section 5); this satisfies CCPA's 45-day response window (Privacy Policy section 14).
- Given the monitoring query, When any tombstone is older than 31 days and not held, Or any request is `executing` for more than 7 days, Then the founder is paged.

---

## 4. Export

### 4.1 What a user can export

| Scope | Own letters | Others' letters | History |
|---|---|---|---|
| Parent | All, including private; Recently deleted only if "Include recently deleted" is ticked | Co-parent's and family letters currently in the book: `final_text`, audio if available on this device or in backup, photo, signature, dates | Own only |
| Contributor | All own | Others' in-book letters only when "Family can read the book" is on | Own only |
| Left or removed member | All own | None | Own only |

Others' raw transcripts, machine edits and version history are never exported (they are the other author's working material).

### 4.2 Package

One ZIP (ZIP64), split into one part per child-year when larger than 2 GB.

```
README.txt                      plain-language guide to every folder and format
index.html                      offline reader: list, text and audio players, no network, no external scripts
manifest.json                   see 4.3
manifest.sha256                 SHA-256 of manifest.json, one line
schema/export-v1.schema.json    JSON Schema for data/*.json
data/children.json              name, birthday or due date, signatures used
data/entries.json               one object per letter (fields below)
letters/<child>/<YYYY-MM>/<YYYY-MM-DD>_<entry_id>.txt   UTF-8, header lines then final text
audio/<entry_id>.m4a            original AAC-LC mono M4A, byte-identical to the recording (ADR 0005)
photos/<entry_id>.<jpg|heic>    original bytes; HEIC also gets a .jpg copy
book/<child>.pdf                the book as rendered by packages/book
history/<entry_id>.json         own letters: every entry_versions row
```

`entries.json` fields per letter: `id`, `child_id`, `author {signs_as, is_exporter}`, `kind`, `occurred_on`, `captured_at`, `capture_mode`, `edit_level`, `language` (when known), `final_text`, `in_book`, `photo`, `audio {path, sha256, bytes, duration_ms, codec}` or `audio_missing {reason}`, and for own letters `raw_transcript`, `raw_sha256`, `machine_edits` (accepted and rejected), `stt_meta.engine`, `alignment`, `engine_version`, `prompt_key`.

### 4.3 Integrity

`manifest.json`:
```json
{
  "format": "early-letters-export",
  "format_version": "1.0.0",
  "generated_at": "2026-10-02T10:00:00Z",
  "app_version": "1.0.0",
  "engine_version": 1,
  "scope": {"exporter_role": "parent", "children": 1, "include_recently_deleted": false},
  "counts": {"entries": 412, "audio": 380, "audio_missing": 2, "photos": 57},
  "files": [{"path": "audio/0192b000-....m4a", "bytes": 1048576, "sha256": "…", "media_type": "audio/mp4"}]
}
```
The format string comes from `packages/brand` at build time (CLAUDE.md: name only in the brand package).

**DATA-REQ-050 (P0) Export contents.** As 4.1 and 4.2.
- Given a parent with 400 letters, 2 private, 30 family letters in the book, When they export, Then `entries.json` has 432 objects, family letters have no `raw_transcript`, and own letters do.
- Given a letter whose audio is only on the co-parent's phone and not backed up, Then it appears with `audio_missing.reason = "not_on_this_device"` and README explains it.

**DATA-REQ-051 (P0) Checksums and self-verification.**
- Given an export, Then every file except `manifest.json` and `manifest.sha256` is listed with SHA-256 and byte size, And after writing, the app re-reads every file and compares hashes before showing "Your export is ready."
- Given an audio file whose SHA-256 differs from the hash recorded at capture (`audio_blobs.sha256` or local record), Then the export still includes it, flags `integrity: "mismatch"`, and reports it (DATA-REQ-046).
- Given README, Then it explains how to verify with `shasum -a 256` on macOS and `certutil -hashfile` on Windows.

**DATA-REQ-052 (P0) Always available.**
- Given any plan state (Free, trial, Plus, lapsed, refunded, billing retry), When the user exports, Then it works and no Plus UI appears (C-REQ-017, C-NFR-004).
- Given airplane mode, Then export of everything on the phone completes; backed-up audio not on the phone is listed as `audio_missing.reason = "offline"` with a "Download from backup and export again" action.
- Given a 1-year book (about 230 MB), Then export completes offline in under 2 minutes on iPhone SE (3rd generation) (C-NFR-007).

**DATA-REQ-053 (P0) Export before deletion.**
- Given any delete-book or delete-account flow, Then Export is the primary action on the step before Confirm.
- Given an account in the 30-day grace period, When the user signs in, Then Export works for everything not yet purged, including letters tombstoned by the request.
- Given a sole parent deletes a book with contributors, Then each contributor receives a server export link valid 30 days.

**DATA-REQ-054 (P1) Server-built export.** For the web deletion page, web contributors and members without their phone. An Edge Function builds the same package from Postgres and Storage into `exports/{profile_id}/{export_id}.zip`; Standard-mode audio is decrypted with escrow in the function; Vault-mode audio is listed as `audio_missing.reason = "vault_mode"`.
- Given a request, Then the user receives a signed URL valid 7 days, the object is deleted after 7 days, And an `export_created` audit event stores format, file count, size bucket and manifest hash only.

**DATA-REQ-055 (P1) 18-year durability plan.**

| Risk over 18 years | Control |
|---|---|
| Formats become unreadable | Only open, documented formats: UTF-8 text, JSON with a published JSON Schema, HTML5 with inline CSS, AAC-LC in MP4 (ISO standard, ADR 0005), JPEG, PDF. PDF/A-2b if the renderer supports it (**Unverified** for the on-device renderer). Optional FLAC or Opus archival copy (ADR 0005, v1.x). |
| Export format drifts | `format_version` semver. Readers for every 1.x version are kept in the repo with fixtures; a format change ships a migration note in README. The schema is published at `https://{domain}/export-format`. |
| Company disappears | Pledge: at least 90 days' notice with export working throughout (Privacy Policy section 18; Terms 17). Before shutdown, an app update decrypts Standard-mode backups through escrow so every family can export audio. Vault-mode users hold their own keys. |
| Keys lost | CCK in iCloud Keychain plus escrow (Standard) or Recovery Kit (Vault); yearly "you can still open your backup" check (ARCH R3). |
| Storage provider loss | Supabase Storage is not covered by database backups [D1]. Recommendation (OQ-4): nightly copy of backup ciphertext to a second provider with 35-day versioning. Ciphertext only. |
| Data model changes | `raw_transcript` and audio are never migrated or re-encoded in place; engine upgrades re-derive `final_text` into a new version, keeping old versions. |
| Handing the book to the child | The export is complete and self-describing so a parent can give it to the child at 18; a future in-app handover needs counsel review first. |
| Families forget | One gentle "keep a copy" card at the child's birthday (C owns cadence; no guilt language, CLAUDE.md content rules). |

- Given an export made today, When opened in 2044 with no app, Then `index.html` lists every letter, plays every M4A in a standard browser, and README explains every file.
- Given the export reader fixtures, When CI runs, Then every 1.x fixture parses against the current schema.

**DATA-REQ-056 (P0) Export privacy.** The export is plaintext.
- Given the share sheet, Then a one-line notice says "This file holds your letters and recordings, unlocked. Keep it somewhere private."
- Given the temp copy, When the share sheet closes, Then it is deleted from the app sandbox.

---

## 5. Data integrity controls

**DATA-REQ-040 (P0) Immutability guarantees.** `raw_transcript`, `raw_sha256`, `captured_at`, `created_at`, `author_id`, `child_id`, `engine_version` never change after insert (trigger `entries_guard_immutable`, SQLSTATE `SCIMM`). There is no client delete policy on `entries`; only the purge job hard-deletes.
- Given any role, When it updates an immutable column, Then the update fails (draft tests for `raw_sha256`, `created_at`; live tests for `raw_transcript`, `captured_at`).
- Given any role, When it issues `delete from entries`, Then 0 rows are affected (live test).

**DATA-REQ-041 (P0) Version history and reversibility.** Every change to `final_text`, `in_book` or `machine_edits` writes the previous state to `entry_versions` with `superseded_by`. Restoring a version is a new update; history is never rewritten.
- Given an author undoes one machine edit (only `machine_edits` changes), Then a version row is written (draft test).
- Given any version, When the app recomputes `final_text` from `raw_transcript` plus the accepted machine edits plus later author edits, Then it matches that version's `final_text` (core replay test in `packages/core`, P1).

**DATA-REQ-042 (P0) Machine edits stay reversible.** `machine_edits` holds accepted and rejected edits with type, offsets into `raw_transcript`, source and `ENGINE_VERSION`; every accepted edit passed `verifyEdits` (CLAUDE.md).
- Given a letter, When the author taps any machine edit in Review, Then it can be undone, And the undo is versioned.

**DATA-REQ-043 (P0) Sync conflict rules.**

| Situation | Rule |
|---|---|
| Two devices of the same author edit `final_text` offline | Field-level PATCH (only changed columns are uploaded); server applies in arrival order (last writer wins per field); the loser's text is preserved in `entry_versions` and shown in history |
| Delete on one device, edit on another | Deletion wins. The edit upload fails with `SCTMB`; the device keeps the edit text in a local `rejected_writes` table and offers "Restore and apply my edit" |
| Restore on one device, delete on another | Last action wins by server arrival; both are audited |
| Immutable column differs | Impossible by design; any attempt is `SCIMM` |
| Offline create then delete before first sync | Insert arrives with `deleted_at`; the server starts the 30-day clock at arrival |
| Membership revoked while writes are queued | Insert fails RLS; writes move to `rejected_writes`; content stays on the phone and in export; the user is told once |
| `in_book` for family letters | Only via B's `review_family_letter()`; first action wins (PRD B F7) |

- Given PowerSync `uploadData`, When Postgres returns a 4xx with SQLSTATE `SC***`, `23***` or `42501`, Then the op is moved to `rejected_writes` and the queue continues, And no op is ever silently dropped.
- Given a transient error (network, 5xx), Then the op is retried with backoff and the queue order is kept.

**DATA-REQ-044 (P0) Idempotent writes.**
- Given entry ids are UUIDv7 generated on the device, When an insert is retried, Then it is an upsert on `id` and produces one row.
- Given `request_account_deletion()` is called twice, Then the same request id is returned (draft test); `restore_entry()` and `delete_entry()` on an already-restored or already-deleted letter return true (draft test).
- Given a purge or worker step re-runs after a crash, Then deleting an already-deleted object, a RevenueCat 404 [D3] or an Apple "already revoked" 200 [D2] counts as done.

**DATA-REQ-045 (P0) Audit log without content.** `audit_events` records actor, action enum, subject id, child id and a small enum-only `detail`. Logged: letter deleted and restored, book deletion requested, cancelled and purged, leave and removal, account deletion requested, cancelled and completed, export created, holds, support access, purge runs, restore replays. Not logged: reads, edits to text (versions cover them), anything with content.
- Given a user, Then they can read only their own audit rows; nobody can update or delete rows except retention (24 months) and pseudonymisation at account deletion (draft test).
- Given `detail` larger than 512 bytes or not an object, Then the insert fails.

**DATA-REQ-046 (P0) Corruption detection.**
- Text: the server computes `raw_sha256` at insert (draft). After sync the device compares it with its own hash of the local `raw_transcript`; a mismatch is reported (count only) and the device re-downloads the row.
- Audio: SHA-256 is computed when recording stops and stored locally and in `audio_blobs`. It is verified before backup upload, after every download, during export, and by a monthly background scrub on charge. A mismatch never deletes anything: the app keeps both copies and restores from the good one if a backup exists.
- Local database: `PRAGMA integrity_check` after each app update and weekly; on failure, the app stops writes, exports to a recovery ZIP and resyncs.
- Given a flipped byte in a local M4A, When the monthly scrub runs, Then the file is flagged, the backup copy (if any) is downloaded and verified, and the local file replaced.

**DATA-REQ-047 (P0) Cross-family isolation of objects.** `entries.photo_path` must start with `{child_id}/{author_id}/` (draft constraint, F3). Every new bucket follows the same path-prefix rule and gets an access test.
- Given an author sets `photo_path` to another family's object, Then the update fails (draft test).

**DATA-REQ-048 (P0) Atomic local saves.** A letter, its audio file reference and its dictionary updates are saved in one local transaction; the audio file is fsynced and hashed before the row commits.
- Given the app is killed during save, When it relaunches, Then either the full letter exists or the audio is in the recovery queue; never a row pointing to a missing file.

**DATA-REQ-049 (P0) Integrity test suite.** The cases below run in CI (`npm run test:db` plus the drafts test once promoted) and on every restore drill.

| ID | Case | Status |
|---|---|---|
| TC-01 | Raw transcript, raw hash, created_at immutable | Draft test |
| TC-02 | Tombstone uses server clock; direct un-delete refused | Draft test |
| TC-03 | Deleted letter cannot be edited | Draft test |
| TC-04 | Restore only by author, idempotent | Draft test |
| TC-05 | Purge after 30 days removes versions, queues photo, writes ledger | Draft test |
| TC-06 | Legal hold blocks purge | Draft test |
| TC-07 | Book creator's account deletion keeps the shared book | Draft test |
| TC-08 | Co-parent delete-book removes only own letters | Draft test |
| TC-09 | Last parent cannot leave | Draft test |
| TC-10 | Contributor cannot delete or tombstone a book | Draft test |
| TC-11 | Account deletion request idempotent, cancellable, completes, pseudonymises audit | Draft test |
| TC-12 | Photo path scoped to own folder | Draft test |
| TC-13 | Machine-edit-only change is versioned | Draft test |
| TC-14 | Safety events older than 12 months erased | Draft test |
| TC-15 | Sync Streams parity incl. tombstones and deleted books | To build (ADR 0004) |
| TC-16 | PowerSync rejected write goes to `rejected_writes`, queue continues | To build (mobile) |
| TC-17 | Export manifest hashes verify; corrupted file flagged | To build (mobile) |
| TC-18 | Restore drill: ledger replay removes purged ids | To build (runbook script) |
| TC-19 | Worker step retries are idempotent (fake vendors returning 404/200) | To build (Edge Function) |
| TC-20 | Launch sweep deletes local audio of letters tombstoned over 30 days | To build (mobile) |

---

## 6. Short-lived records

**DATA-REQ-060 (P0) Invites.** `child_invites` rows are deleted 90 days after `expires_at` (draft `purge_due`). B's `member_return_links` follow the same rule after revocation.
- Given an invite that expired 91 days ago, When `purge_due()` runs, Then it is gone.

**DATA-REQ-061 (P0) Safety events.** Deleted after 12 months (draft). Counsel note CN-10 recommends storing without `author_id`; if adopted, drop the column in the same migration as promotion of this draft.

**DATA-REQ-062 (P0) Telemetry.** PostHog retention 12 months; Sentry 90 days; set in each console and recorded in the runbook.

**DATA-REQ-063 (P1) Support mail.** Deleted 2 years after the last message in a thread; never copied into tickets with content.

**DATA-REQ-064 (P0) Consent records.** `policy_acceptances` (POLICY_VERSIONING.md) are pseudonymised at account deletion and deleted 3 years after (compliance owns the job; this spec only sets the period).

**DATA-REQ-065 (P1) Transaction records.** Purchase ledger and print orders: 7 years (proposed), transaction fields only.

**DATA-REQ-066 (P0) Operational records.** `audit_events` 24 months; completed or cancelled `deletion_requests` 3 years; `purge_ledger` 60 days; `storage_purge_queue` 7 days after done; `exports` objects 7 days (draft `purge_due` for the first four).

---

## 7. Proposed SQL (summary)

File: `supabase/migrations/drafts/20261002000000_data_governance.sql` (not in the live folder). Tests: `supabase/tests/drafts/data_governance.test.mjs`. Run:
```bash
node supabase/tests/drafts/data_governance.test.mjs supabase/migrations/*.sql supabase/migrations/drafts/20261002000000_data_governance.sql
```

| Object | Kind | Purpose | Req |
|---|---|---|---|
| `children.created_by` FK `on delete set null` | fix | F1 | 012, 020 |
| `children.deleted_at`, `deletion_request_id`, `children_guard`, `child_is_live()` | columns, trigger, fn | Book tombstone | 014 |
| `entries.deleted_reason`, `raw_sha256`, photo path check, `entries_before_insert`, replaced `entries_guard_immutable` | columns, triggers | Tombstones, integrity | 013, 040, 046, 047 |
| `entry_versions.machine_edits`, `superseded_by`, replaced `entries_record_version` | columns, trigger | Reversibility | 041 |
| `entries_select` policy | policy | Hide letters of a deleted book | 014 |
| `legal_holds`, `is_held()`, `entry_is_held()` | table, fns | Holds | 035 |
| `audit_events`, `audit()`, `entries_audit`, `child_members_audit` | table, fn, triggers | Audit | 045 |
| `child_members_guard` | trigger | Last parent | 016 |
| `deletion_requests`, `deletion_request_steps` | tables | Deletion state and receipts | 019 to 027 |
| `request_account_deletion()`, `cancel_account_deletion()` | RPC | Account deletion | 019, 026 |
| `request_book_deletion()`, `cancel_book_deletion()` | RPC | Book deletion | 014 |
| `delete_entry()`, `restore_entry()` | RPC | Letter delete and restore, including after leaving | 010, 016, 017 |
| `storage_purge_queue`, `purge_ledger` | tables | Storage API deletion; restore replay | 011, 030 |
| `purge_due()`, `prepare_account_purge()`, `finalize_account_deletion()` | service-role fns | Purge and execution | 006, 020, 060, 061, 066 |
| RLS on all new tables | policies | Users read only their own audit and deletion rows; holds, queues and ledger are service-only | 003 |

Coordination: B's planned migration also adds `children.deleted_at`, `leave_child`, `remove_child_member`, approval columns; whichever lands first, the other drops duplicates. `policy_acceptances` is owned by POLICY_VERSIONING.md and is not redefined here. Cron schedule lines are commented out because the PGlite harness has no `pg_cron`.

---

## 8. Open questions

| # | Question | Proposed default |
|---|---|---|
| OQ-1 | Account deletion by a co-parent removes their letters from the shared book (Terms 8.4, Privacy section 10). B-REQ-025 "leave my letters for {child}" needs a surviving licence and legal basis. | Ship removal; revisit with counsel (CN-13) |
| OQ-2 | Should parents be told when a family member deletes letters that were in the book? | No notification (the deleter's choice is private); the letter simply leaves |
| OQ-3 | PITR: worth about $100/month for 7 days [D9] at launch? | Off at launch; on at 7 days once paying families exceed 1,000 |
| OQ-4 | Second-provider copy of backup ciphertext (Storage has no backups [D1]) | Yes for Phase 1, 35-day versioning, disclosed as a processor |
| OQ-5 | Supabase auth audit log retention and IP storage | Verify in console; cap at 90 days or disable DB storage |
| OQ-6 | Wipe local data on deletion execution (DATA-REQ-023) vs leaving the user's phone alone | Wipe after offering one local export |
| OQ-7 | Re-authentication before deletion | Device passcode if session older than 24 h |
| OQ-8 | RLS exposes other authors' `raw_transcript`, `machine_edits`, `stt_meta` to book members (F9) | Serve book reads through a security-barrier view without those columns (same mechanism B plans for sealed letters) |
| OQ-9 | Android Auto Backup rules for the database and audio | Decide before Android; Unverified behaviour |
| OQ-10 | Web contributors use an anonymous Supabase session (B F6) while A says no anonymous auth in v1 | A and B to reconcile; deletion works for either identity type |
| OQ-11 | No inactivity deletion for a keepsake vs storage-limitation duties | Counsel to confirm |
| OQ-12 | Under-13 data: skip the 30-day grace? | Yes when counsel requires (DATA-REQ-027) |
