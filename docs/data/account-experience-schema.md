# Account and experience data design (1 Dec, 1.0.1, 1.1)

Data Architect (`data-architect`), 1 Nov 2026, against `origin/develop` b79982d0. Design only: no migration, no app code. Every build PR named here still needs its own tests, a red-team review and, for `supabase/**`, the founder's `approve-migration` label (D-041).

**Status.** On track for the 1 Dec rows if the coordinator assigns local schema numbers by Fri 20 Nov (section 1.2). Two findings change the asks: dates cannot be columns on `profiles` and stay owner-only (section 3.3), and F8 keeps them on the phone in 1.1, so the server table is designed but held.

**Sources.** Account program `/home/claude/proposals/account-security/` (legal-consent 3 and 4, security 2, settings-ia 3, journeys, council: F1 to F4, CPO-2, CISO-1, CPrivO-3, CPrivO-4, CPrivO-6, CCO-8). Experience program `/home/claude/proposals/v1-experience/` (memories 2 to 6 and 8, daily-home 2 to 5, auth-emails-profile 5, plus PL-2, council: F5 to F11, CPO-6, CDesO-4, CDesO-5, CPrivO-7, CR-43, release map). Repo: `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/lib/export/schema.ts`, `docs/legal/DATA_CLASSIFICATION.md` 1.1, 2, 4.1, 4.5, 4.6, `docs/legal/DELETION_AND_EXPORT_SPEC.md` 4 and DATA-REQ-024, `docs/engineering/03-database-and-schema.md`, `docs/prd/v2/08-delivery.md` section 4, F13-REQ-004, F15-REQ-018, F14-REQ-039.

## 0. Summary

| # | Item | Store | Release | Schema step | Class | Sync | Export |
|---|---|---|---|---|---|---|---|
| 1 | Agreement record (Terms and Privacy at Before you begin) | New table `agreements` | 1 Dec | Local L-A | L2 | Uploaded once as `policy_acceptances` (1.1, S-1); the local row never syncs | Yes, `account.json` |
| 2 | Age answer | Existing `settings.ageGate.passed` | unchanged | none | L2 | Sent only as `context.age_attested: true` with the Terms act | Yes (exists) |
| 3 | App lock settings | `settings` keys `lock.*` | 1 Dec | none | L2 | Never | No |
| 4 | Memories on Tonight switch, Not today (1 Dec) | `settings` keys `memories.*` | 1 Dec | none | L2, L3 | Never | No |
| 5 | Tonight day record and Not today history | New table `tonight_days` | 1.0.1 | Local L-B | L3, L4 | Never | No |
| 6 | Prompt and small-thought history (CPO-6) | New table `prompt_history` (WP-F13-07) | 1.0.1 | Local L-B | L3, L4 | Never | No |
| 7 | Keep out of memories, hard day | New table `entry_marks`, plus `drafts.hard_day` | 1.0.1 (hard day written from 1.2) | Local L-C | L3, L4 | Never in 1.x (gap, section 6) | Kept-out yes; hard day no |
| 8 | Lighter stretch | `settings` keys `lighter.*` | 1.2 | none | L4 | Never | No |
| 9 | Erase everything | Rules over every store | 1 Dec | none | n/a | Nothing sent | n/a |
| 10 | Waiting letters in export (PL-2) | Export format | 1 Dec | Export minor E-1 | L4 | n/a | `waiting/`, `data/waiting.json` |
| 11 | Parent birthday and anniversary (month-day) | New table `parent_profile` | 1.1 | Local L-D | L3 | Never in 1.1 (F8, CPrivO-7) | Yes, `account.json` |
| 12 | `device_first_run` method | `policy_acceptances` check, `record_policy_act` | 1.1 | Server S-1 | L2 | n/a | Exists (`consent_history`) |
| 13 | Optional name | Existing `profiles.display_name` | 1.1 | Server S-2 (shape check only) | L3 | Exists | Exists (`profile`, 1.4.0) |
| 14 | Dates on the server | New table `profile_dates` | Held until a CPrivO ruling | Server S-3 (designed, not to be built) | L3 | When ruled | Yes |

## 1. Conventions this design follows

### 1.1 Device

- Local schema steps are append-only entries in `MIGRATIONS` (`migrations.ts`): one transaction per step with the `PRAGMA user_version` bump; `addColumns` and `CREATE TABLE IF NOT EXISTS` so a step is safe on an install that already has the object; no throw on bad legacy data; `ctx.now` and `ctx.newId` injected. A database newer than the build is left untouched (`newer: true`), so an older build that is rolled back to simply ignores a new table or column. That is the rollback story for every local step below: forward-only, and additive so the previous build still opens the file.
- New tables, not new columns on `entries`, for anything that is one person's mark on a letter. `entries` mirrors server columns for synced rows (DB-R25), and holds other people's letters after sync; a mark on a co-parent's letter is mine, not the letter's (CPrivO-7: memories are chosen by "parent marks").
- Settings keys for single values; a key never holds content (DATA_CLASSIFICATION 4.5).
- Erase everything (PR #520 `removeEverything`) deletes every row of every table read from `sqlite_master`, so a new table is covered with no code change. Section 4 lists what must still be decided.

### 1.2 Local schema numbers (coordinator)

`08-delivery.md` section 4 fixes v9 for WP-F13-07 prompt history and v10 for WP-F06-07, "v11 and later in request order", one version per PR. **Collision:** open PR #522 (Review state) adds itself as v9. The coordinator must renumber one of them before either merges. This design asks for four numbers, named here L-A to L-D, in this order:

| Step | Contents | Release | Suggested number |
|---|---|---|---|
| L-A | `agreements` | 1 Dec | next free after #522 and v10 |
| L-B | `prompt_history`, `tonight_days`; moves `memories.notTodayOn` into `tonight_days` | 1.0.1 | v9 if #522 renumbers (it is WP-F13-07), else next |
| L-C | `entry_marks`, `drafts.hard_day` | 1.0.1 | next |
| L-D | `parent_profile` | 1.1 | next |

Every migrator test runs from v0 to head (R5 EQ-23), not from a fixture version.

### 1.3 Server

New files only, timestamped after the newest file in `supabase/migrations/` when written (today `20261028010000` on develop; open PR #424 adds `20261031000000`); never before the newest line of `.github/migrations-applied.txt`. No `begin`/`commit` (DB-R10). Named constraints (DB-R03). Every new table, view, function or sequence carries its own grants in its own file and a line in `supabase/tests/grants.mjs` (CLAUDE.md; default privileges reset since `20261023060000`). Every column has an `L1` to `L4` comment (`classification.test.mjs`). Every policy gets an allow and a deny cell (DB-R12). Rollback is a new forward migration, never an edit.

### 1.4 Classification text belongs to legal

`docs/legal/**` is founder-owned. Section 7 gives the rows to add to DATA_CLASSIFICATION 4.5 and 4.6 and to the export spec; the legal owner adds them in the build PR that ships each item (DATA-REQ-001, DATA-REQ-002). `migrations.ts` already says each new device column needs its 4.5 row.

## 2. On-device SQLite

### 2.1 Agreement record (1 Dec, L-A)

Basis: legal-consent 3 ("record locally, attach later"), F2 (two controls on one screen), CPrivO-3 (local Terms record is L2, never logged), CCO-6 (LEGAL-REQ-002 tests unchanged), D-026 (age is a timeless boolean).

```sql
CREATE TABLE IF NOT EXISTS agreements (
  id TEXT PRIMARY KEY NOT NULL,          -- UUIDv7 from ctx.newId
  document TEXT NOT NULL,                -- 'terms' | 'privacy' (policy_documents keys)
  version TEXT NOT NULL,                 -- build constant, like SUBSCRIPTION_TERMS_DOC_VERSION
  action TEXT NOT NULL,                  -- 'accept' | 'acknowledge' (Q-D decides privacy)
  surface TEXT NOT NULL,                 -- 'first_run.before_you_begin' | 'update.agreement' (matches ^[a-z0-9_.]{1,64}$)
  recorded_at TEXT NOT NULL,             -- device ISO time of the tap
  app_version TEXT NOT NULL,
  rendered_sha256 TEXT NOT NULL,         -- hex SHA-256 of the rendered agreement sentence
  uploaded_at TEXT,                      -- when record_policy_act returned (1.1)
  server_act_id TEXT                     -- policy_acceptances.id returned (1.1)
);
CREATE UNIQUE INDEX IF NOT EXISTS agreements_once ON agreements (document, version, action);
```

- One row per document act. The Before you begin tap writes the Terms row and the Privacy row in one transaction with `ageGate.passed = '1'`. A No writes nothing here (the existing `ageGate.stoppedAt` path). Yes without the tick writes nothing (legal-consent 2).
- **No age column, ever.** The age answer stays `settings.ageGate.passed`, a boolean with no time (D-026, migration v3). The agreement time is the Terms act's time, not an age attestation time. Test: no column of `agreements` matches `/age|birth|dob/`.
- **No backfill.** The step creates the table and zero rows, even when `ageGate.passed = '1'`: a build 1 install that never saw the screen has no acceptance, and the app shows the screen once (legal-consent 3, counsel Q-C). Never fabricate an act from use.
- Append-only: the app never updates `document`, `version`, `action`, `recorded_at` or `rendered_sha256`; only `uploaded_at` and `server_act_id` are set, once.
- Upload (1.1): at the claim step ("Keep in this account", the account that becomes `sync.ownerId`), for each row with `uploaded_at IS NULL` whose version is still current for new users, call `record_policy_act` with `p_method = 'device_first_run'`, `p_client_recorded_at = recorded_at`, `p_rendered_sha256 = rendered_sha256`, `p_surface = surface`, and `context {age_attested: true}` only on the Terms row and only when `ageGate.passed = '1'`. Any other account that signs in on the phone goes through the existing consent sheet: the phone's acceptance was made by whoever set it up. If the version is no longer current, show today's Terms sheet (legal-consent 3).
- Retention: until Erase everything or uninstall. An iCloud device restore brings it back with the rest of `scribe.db` (same person, same book).
- Never logged, never in analytics (CPrivO-3).

### 2.2 App lock settings (1 Dec, no schema step)

Basis: security 2, settings-ia 3, CPO-2 (offered once, off until turned on), CISO-1, CDesO-1, F17-REQ-008 to -011 and -015.

| Key | Values | Level | Note |
|---|---|---|---|
| `lock.enabled` | `'1'` or absent | L2 | Off unless turned on |
| `lock.requireAfter` | `'0'`, `'60'`, `'300'` seconds | L2 | F17-REQ-010 range; security 2 also proposes 900, open for `security` |
| `lock.offered` | `'1'` | L2 | The one end-of-setup offer was shown (CPO-2) |
| `lock.autoOffNotice` | `'1'` | L2 | Passcode was removed, the lock turned itself off; cleared when the one notice is shown (F17-U21) |

- The background time used for the grace period stays in memory only, never written: a cold start always locks (security 2), so nothing needs to survive a kill.
- Lock on forces names off in notifications (F17-REQ-015) at read time: effective names = `notifications.lockScreenNames` and not `lock.enabled`. The stored names setting is never overwritten, so turning the lock off restores the person's own choice.
- Never synced. Not in export (a device preference with no personal content). In `scribe.db`, so an iCloud restore brings it to the new phone; with no passcode there, the lock turns off and says so once.
- Not in Keychain: changing these values needs write access to the app container, which is outside the threat model (security 1, threats a to c).

### 2.3 Memories, 1 Dec (no schema step)

Basis: CDesO-5 and the release map ("1 Dec: the existing A month ago card gains Not today and a Settings switch"), CR-43 ("Not today a local per-date flag").

| Key | Values | Level | Note |
|---|---|---|---|
| `memories.onTonight` | `'0'` or absent (absent = on) | L2 | The Settings switch, on by default (F6) |
| `memories.notTodayOn` | `YYYY-MM-DD` local date | L3 | The day the card was dismissed; the card stays away for that date. A date tied to a person's choice about a memory, so L3 like `celebrations_paused` (rule 1.1.7) |

L-B moves `memories.notTodayOn` into a `tonight_days` row and deletes the key, in the same transaction.

### 2.4 Tonight day record and history (1.0.1, L-B)

Basis: CPO-6 (repeat rule), CDesO-4 (one question, one card, stable all day), CR-43 (slot selector pure in `packages/core`), Karma tie-breaks 1 and 2 (memory once a day, a letter not twice in 7 days, three Not todays in a row drop to weekly for 30 days; thoughts at most 3 evenings in 7), memories 6, F13-REQ-004, WP-F13-07 (`prompt_history(key, child_id, shown_on)`).

Why store the day at all: today the pick is recomputed from `seed: today`, and the "Another thought" press count is held in memory. Once history feeds selection, recording today's prompt as shown would change today's pick on the next render, and a relaunch loses the press. The day's room has to be stored once and read back.

```sql
CREATE TABLE IF NOT EXISTS prompt_history (
  child_id TEXT NOT NULL,
  item_kind TEXT NOT NULL,       -- 'question' | 'thought'
  key TEXT NOT NULL,             -- prompt key or small-thought key (packages/content)
  shown_on TEXT NOT NULL,        -- local YYYY-MM-DD
  PRIMARY KEY (child_id, item_kind, key, shown_on)
);
CREATE INDEX IF NOT EXISTS prompt_history_recent ON prompt_history (child_id, item_kind, shown_on);

CREATE TABLE IF NOT EXISTS tonight_days (
  day TEXT NOT NULL,             -- local YYYY-MM-DD
  child_id TEXT NOT NULL,
  prompt_key TEXT,               -- the question on screen now (after any Another thought); null on a closure-only day
  draws INTEGER NOT NULL DEFAULT 0,  -- Another thought presses today; never shown to anyone (no counts)
  card_kind TEXT,                -- null | 'draft' | 'occasion' | 'memory' | 'thought'
  card_ref TEXT,                 -- entry id (draft, memory), thought key, or occasion key
  memory_type TEXT,              -- memories 2 types: 'week' | 'month' | 'three_months' | 'year' | ...
  card_dismissed_at TEXT,        -- Not today (memory card) or Not this year (occasion)
  created_at TEXT NOT NULL,
  PRIMARY KEY (day, child_id)
);
```

- **Writes.** First Tonight render of a day for a book: the core selector runs once with the history, and the app inserts the `tonight_days` row and one `prompt_history` row (`INSERT OR IGNORE`). Each Another thought: update `prompt_key`, `draws + 1`, and insert the new key into `prompt_history`, so draws count as shown (CPO-6). A shown small thought or memory is written once with the row. Not today sets `card_dismissed_at`; nothing replaces the card.
- **Reads, all bounded and indexed:** keys shown in the last 365 days for a book; least recently shown key with no showing in 120 days (CPO-6); memory cards in the last 7 and 30 days (`card_ref`); thoughts in the last 7 days; the last three memory days and whether each was dismissed (step back); the step-back start (`memories.stepBackUntil`, section 2.5).
- **Per book**, because questions name the child and F13-REQ-004 counts "for the same child". One phone is one author (F16 6.2 G), so no author column.
- **Retention.** `tonight_days`: rows older than 90 days are deleted at launch (the longest window it serves is 30 days; the "first letter, a week on, once" type is bounded by its own 4-day window). `prompt_history`: rows older than 400 days are deleted at launch. A key last shown more than 400 days ago reads as unseen, which can only make it eligible, never break the 365-day rule. Size: about 2 rows a day per book, so under 1,000 rows per book.
- Books removed (#520 `removeBook`) must delete their rows here: `removeBook` deletes by named tables today, so the build PR adds both tables to it, with a test.
- Never synced (a new phone starts its history fresh; low harm). Not in export: it holds what the app showed, not what the person made.

### 2.5 Keep out of memories and the hard day (1.0.1, L-C)

Basis: memories 5 (hard letters never auto-resurface; Keep out of memories per letter; "needs a local `hardDay` flag on the entry, data-architect"), memories 8 step 2, CPrivO-7, daily-home 4 (lighter stretch only when the parent chooses it).

```sql
CREATE TABLE IF NOT EXISTS entry_marks (
  entry_id TEXT PRIMARY KEY NOT NULL,  -- any letter on this phone, mine or a co-parent's
  kept_out_at TEXT,                    -- Keep out of memories; null = not kept out
  hard_day INTEGER NOT NULL DEFAULT 0, -- written on a day the parent chose a lighter stretch or "a long day"
  updated_at TEXT NOT NULL
);
-- plus, on drafts:
ALTER TABLE drafts ADD COLUMN hard_day INTEGER NOT NULL DEFAULT 0;  -- via addColumns
```

- `drafts.hard_day` is set when the draft is created, from the lighter stretch in force then, and copied into `entry_marks` in the Keep transaction. Setting it at creation, not at Keep, gives the right answer for a draft kept days later. No row is written when both values are empty.
- Kept-out is reversible: clearing it sets `kept_out_at = NULL`. The Book never changes.
- `hard_day` is written only once the lighter stretch exists (BL-E4, release map 1.2). In 1.0.1 the hard filter reads the prompt kind (`hard`) and this column, which is then always 0.
- The selector refuses any letter that has `kept_out_at`, `hard_day = 1`, a `hard` prompt kind, is private, a quiet mark, or by an author who left the book (memories 2 and 5, CPrivO-7). Pure and table-tested in `packages/core` (CR-43).
- Purge: when a letter row is deleted (`entries.ts` purge, `merge.ts` pull deletions and held sweep, `removeBook`), delete its `entry_marks` row in the same transaction. SQLite foreign keys are off on this connection (no `PRAGMA foreign_keys` in the repo), so this is code plus a test, not a cascade.

Lighter stretch keys (1.2, BL-E4): `lighter.since`, `lighter.until` (ISO). Both **L4**: a chosen lighter stretch implies the parent's state of mind (rule 1.1.7). Never synced, never exported, never in analytics.

`memories.stepBackUntil` (1.0.1): `YYYY-MM-DD` until which memories are weekly after three Not todays in a row (Karma tie-break 1). L3. Cleared by Erase. `memories.beforeBirth` (1.1, pre-birth letters behind a switch, off by default, CPrivO-7): `'1'` or absent, L3.

### 2.6 Parent profile dates (1.1, L-D)

Basis: F8 (Settings, You; month and day only; on phone only in 1.1; one prompt on the day), CPrivO-7 (month-day, device-only, removable, in Export, never in notifications or email; no relationship field), auth-emails-profile 5.

```sql
CREATE TABLE IF NOT EXISTS parent_profile (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  birthday_md TEXT CHECK (birthday_md IS NULL OR birthday_md GLOB '[01][0-9]-[0-3][0-9]'),
  anniversary_md TEXT CHECK (anniversary_md IS NULL OR anniversary_md GLOB '[01][0-9]-[0-3][0-9]'),
  updated_at TEXT NOT NULL
);
```

- One row for the person this phone belongs to. Month and day only, never a year (no age can be derived). Full validity (month 01 to 12, day within the month, 02-29 allowed) lives in one `packages/core` function used by the picker and a repo guard; `02-29` shows on 28 Feb in other years (core test).
- No name column: the device build asks no name (CPrivO-3); account builds keep the name on the server (`profiles.display_name`).
- Removing a date sets it to NULL; the row is deleted when both are NULL. "Removal deletes it everywhere" is literal in 1.1 because nowhere else holds it.
- Card choices: "Not this year" is a `tonight_days.card_dismissed_at` on that day's occasion row plus `profileCard.<birthday|anniversary>.skipYear = YYYY` (L3); "Don't show this again" is `profileCard.<...>.off = '1'` (L3).
- Never in a notification, an email or analytics (CPrivO-7). Test: no notification builder or email template reads `parent_profile` (a static import check in the mobile test suite).
- Export: yes (section 5, E-3).

## 3. Server (1.1 only)

### 3.1 S-1: `device_first_run` (1.1)

Basis: legal-consent 3 and 6 (backlog row "Upload device acceptance at sign-in: `device_first_run` migration plus grants; DB test with a backdated time"; data-architect, security).

Facts from the repo: `policy_acceptances.method` is an unnamed column check created in `20261002020000_data_governance.sql:632` (Postgres names it `policy_acceptances_method_check`); `record_policy_act` was last replaced in `20261005000000_family_cap_language_idempotency.sql:485`; future device times beyond 5 minutes are nulled, past times are kept with no lower bound; the idempotency key leaves out `p_client_recorded_at`; accepting a superseded version that a newer one requires is refused with a plain exception (SQLSTATE P0001, no named code).

Migration contents:
1. Drop `policy_acceptances_method_check`; add `policy_acceptances_method_allowed` with the eight existing values plus `device_first_run` (DB-R03 name). Existing rows all pass; `validate` runs in the same file.
2. `create or replace function public.record_policy_act(...)` with the same signature (privileges are kept; the file still repeats `revoke execute ... from public, anon` and `grant execute ... to authenticated`, DB-R14). Added rules for `p_method = 'device_first_run'`:
   - `p_document in ('terms', 'privacy')` and `p_action in ('accept', 'acknowledge')`, else 22023;
   - `p_client_recorded_at` and `p_rendered_sha256` both required, else 22023;
   - a device time earlier than the version's `new_users_from` minus 1 day is set to null, like the future clamp: the act is kept with server time only, and a phone with a wrong clock never loses its acceptance;
   - everything else unchanged (age only true, context allowlist, rate limits, superseded-version refusal, idempotency).
3. Give the superseded-version refusal a named SQLSTATE so the app can branch to the Terms sheet without parsing text. Owner of the code list: `packages/api` (API-R09); proposed in the build PR, not invented here.

No new table, view, sequence or function, so `grants.mjs` does not change. Also update: the client method type in `apps/mobile/src/lib/auth/consent.ts`, the method list in `docs/legal/POLICY_VERSIONING.md` (legal owner), and `harness.mjs` if it lists methods (qa).

Rollback: a forward migration that stops new `device_first_run` acts in `record_policy_act` and leaves the value allowed in the check, because rows with it are append-only consent evidence kept 3 years (DATA_CLASSIFICATION 2). The app-side switch is the faster rollback.

Tests, new `supabase/tests/policy_device_first_run.test.mjs`:
- allow: a Terms accept with `device_first_run`, device time 30 days ago, returns an id; the row has `client_recorded_at` as sent and `accepted_at` at server time; `context.age_attested = true`;
- allow: a Privacy acknowledge with the same method;
- deny: missing device time, missing hash, hash not 32 bytes, document `analytics`, action `decline`, `age_attested: false`: all 22023;
- clamp: device time before `new_users_from` minus 1 day stored as null; device time 10 minutes in the future stored as null;
- superseded version that a newer one requires: refused with the new SQLSTATE;
- replay with a different device time returns the first id and inserts nothing;
- anonymous session: SCANO; `anon` role: 42501;
- the constraint is named `policy_acceptances_method_allowed` and lists exactly nine values.
Access matrix (`access_matrix.test.mjs`): one row, `record_policy_act` with `device_first_run`, cells parent ok, coparent ok, contributor ok, outsider ok, anonymous SCANO, anon 42501. `npm run test:db` before push.

Budget: one insert and two indexed counts, as today; no new read path.

### 3.2 S-2: optional name (1.1)

F3 (founder, 1 Nov): one optional "Your name" field, prefilled from Apple or Google, editable. It is the existing `profiles.display_name` (L3, max 60, readable by the person and co-members for "an invitation names the parent who sent it", editable only by the person, exported since 1.4.0). **No new column.**

Proposed small hardening, its own file: a named check `profiles_display_name_shape`: null, or 1 to 60 characters after trimming with no control characters (the name reaches invite emails). Add it `not valid`, set blank values to null in the same file, then `validate`. Tests: blank becomes null; a 61-character name, a newline and a tab are refused 23514; a co-member reads the name (allow) and cannot update it (deny, 0 rows); an outsider reads nothing. Grants unchanged (`profiles: 'SU'`). Rollback: drop the constraint in a new file.

### 3.3 S-3: dates on the server (designed, held)

**Why not columns on `profiles`.** RLS is per row. `profiles_self_or_co_guardian` (`20260930000000_scribe_core.sql:237`) lets every co-member select a person's whole row, and `20261023060000_explicit_grants.sql:107` grants table-wide `select, update`. Dates added there would be readable by the co-parent and every contributor, which breaks "owner-only" (auth-emails-profile 5, CPrivO-7). Column grants could hide them, but only by revoking table SELECT and granting a column list, which breaks every `select *` caller and is easy to undo by accident. A separate table is the safe shape.

**Why held.** F8 says on phone only in 1.1; CPrivO-7 says no sync until a separate CPrivO ruling and a privacy-label review (synced dates would be "collected" under Apple's definition). This migration should not be written until that ruling exists.

Design, for when it is ruled:

```sql
create table public.profile_dates (
  profile_id uuid primary key references public.profiles (id) on delete cascade,  -- same person: no cross-author cascade
  birthday_md text constraint profile_dates_birthday_md_shape
    check (birthday_md is null or public.is_month_day(birthday_md)),
  anniversary_md text constraint profile_dates_anniversary_md_shape
    check (anniversary_md is null or public.is_month_day(anniversary_md)),
  birthday_md_at timestamptz,      -- per-field time for last-writer-wins (auth-emails-profile 5)
  anniversary_md_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.profile_dates enable row level security;
create policy profile_dates_owner on public.profile_dates for all to authenticated
  using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
create policy profile_dates_no_anonymous on public.profile_dates as restrictive for all to authenticated
  using (not (select public.is_anonymous())) with check (not (select public.is_anonymous()));
revoke all on public.profile_dates from public, anon, authenticated;
grant select, insert, update on public.profile_dates to authenticated;
```

- `is_month_day(text)`: immutable SQL function, `revoke execute from public, anon`, listed for `authenticated` in the grants test; one source of the rule, matching the `packages/core` validator.
- Comments: `profile_id` L3 person id; both dates L3 ("month and day, no year"); the `_at` columns and `updated_at` L2.
- No delete grant: removing a date sets it to null; the row goes with the account (cascade from `profiles`).
- `grants.mjs`: `authenticated.profile_dates = 'SIU'`; `service_role` nothing.
- Deletion: add `profile_dates` to the account purge scope and residue checks in the ops deletion worker functions (`ops_deletion_residue`, `prepare_account_purge`) with a test that a purged account leaves no row.
- Export: the device export reads it with `profile` (section 5).
- Never read by an Edge Function: a test in `npm run test:functions` that no file under `supabase/functions` names `profile_dates` (CPrivO-7: never in email).
- Access matrix: `select * from profile_dates where profile_id = <parent>` gives parent 1, coparent 0, contributor 0, outsider 0, anonymous 0, anon 42501; insert for another person's id refused (42501) for every persona; update of own row ok, of the parent's row 0 rows for the others; delete refused for all (no grant).
- Budget: primary-key lookup only; nothing for `perf.test.mjs` beyond a plan check that names the primary key.
- Rollback: revoke the grants in a new file (the data stays until the person removes it or deletes the account); dropping the table deletes user data and needs its own decision.

## 4. Erase everything on this phone (1 Dec)

Basis: DATA-REQ-024 ("all local letters, audio, photos, settings and the analytics id are wiped and nothing is sent to the server", with export first), WP-F17-15, F1 option 1, CPrivO-1 and NAQ-2 (no store claim until Erase ships and is verified), open PR #520.

| Store | What happens | Note |
|---|---|---|
| Every SQLite table | All rows deleted, read from `sqlite_master` (#520) | Covers `agreements`, `tonight_days`, `prompt_history`, `entry_marks`, `parent_profile` with no new code. Test: after erase at head schema, every table has 0 rows |
| `settings` | All keys deleted, except `erase.everything.pending` until the end and an `ageGate.stoppedAt` still inside its 24 hours (#520 `keepSettings`) | `ageGate.passed`, the agreement and `lock.*` all go: the next launch is a first run with Before you begin again |
| Schema version | Kept | No migration on next open |
| Recordings, listening copies, orphan audio, export temp | Deleted before their rows (#520) | |
| Installed packs and speech models | Recommend delete | The list of installed packs reveals languages and is handled as L4 (DATA_CLASSIFICATION 4.6). Cost: a re-download. Decision for `mobile` with `privacy` |
| Keychain, this-device-only items | Delete `scribe.auth` (after a local sign-out), `scribe.auth.appleUser`, `scribe.auth.pendingName`, `scribe.family.pendingInvite` | |
| Keychain, synchronizable book keys (owner backup) | **Never delete on Erase** | They sync through iCloud Keychain; deleting them here deletes them on every device and breaks restore (security 3(b)). Only Delete account removes them. None exist on a phone that never signed in |
| Analytics | Off in 1.0 (D-124). When on: retire the id through `analytics-forget` before the erase, the one network call allowed | |
| Server | Nothing sent. #520 offers Erase only on a phone that never signed in | 1.1, signed in: Erase removes this phone's copy only, not the account; it must first show any letter or held draft not yet on the server (outbox or held rows) |
| StoreKit | Untouched | Plus belongs to the Apple Account; `plus.cache` is re-read |
| iCloud backups made earlier | Not ours to delete | Copy must not say they are erased (CPrivO-1) |

Order and safety (as #520): mark pending, files, rows, Keychain, clear the mark; a relaunch finishes a half-done erase before any screen reads the store. **New ask:** when `lock.enabled`, Erase asks for device authentication first, as Export does (security backlog 2), because Erase cannot be undone. Export is offered before the confirm (DATA-REQ-024).

## 5. Export format changes

Current develop: `EXPORT_SCHEMA_VERSION = '1.4.0'`. Open PR #513 takes 1.5.0. Each change below is an optional field or file, so a minor bump; whichever lands later takes the next number, and the one-way rule in `schema.ts` applies (an older schema rejects the newer file).

| Bump | Release | Change | Source |
|---|---|---|---|
| E-1 | 1 Dec | `waiting/` and `data/waiting.json` (PL-2 P0, F15-REQ-018, F15-U23); `account.json` `consent_on_this_phone.agreements` | PL-2, F14-REQ-039, LEGAL-REQ-034 |
| E-2 | 1.0.1 | `entries[].kept_out_of_memories: true` when set (absent otherwise) | CPrivO-7 |
| E-3 | 1.1 | `account.json` `profile_on_this_phone: {birthday_md, anniversary_md}` | F8, CPrivO-7 |

**E-1 `waiting/`.** Every draft that is not being let go (`state <> 'discarding'`) is a waiting letter: held at the Keep step (`held_kind`), waiting to be read back, or typed and not kept. Files: `waiting/<draft id>.txt` (header lines, then the person's words) and the original recording `waiting/<draft id>.m4a` or `.aac`, byte-identical. `data/waiting.json`:

```json
{ "schema_version": "1.x.0", "format": "early-letters-export", "waiting": [
  { "id": "...", "child_id": "...", "reason": "held_at_keep",
    "kind": "letter", "created_at": "...", "occurred_on": null, "occurred_precision": "day",
    "capture_mode": "spoken", "language": null,
    "typed_text": null, "raw_transcript": "...", "changed_words": null,
    "text_file": "waiting/....txt",
    "audio": { "path": "waiting/....m4a", "sha256": "...", "bytes": 0, "duration_ms": 0,
               "codec": "aac-lc", "media_type": "audio/mp4", "integrity": "ok", "recorded_sha256": "..." },
    "audio_missing": null } ] }
```

- `reason`: `held_at_keep` | `waiting_for_words` | `not_read_back` | `typed_draft` | `unrecoverable` (a take whose file was empty; listed, with `audio_missing`).
- Words: the person's own words only (`typed_text`, and `changed_words` from Review's Change words when #522 lands), plus `raw_transcript` as heard, which own letters already export. Never machine-cleaned text that was not kept, because a draft has no verified edit set yet (constitution, `verifyEdits`).
- The manifest hashes every file; the export check re-reads them. The ready screen counts nothing (F15-U23).
- Free in every plan state (C-NFR-004): the held letter is never held hostage (F5, PL-2).
- `keepGate.heldNote` says "export" only after the hash test below passes (CCO-12).

**Excluded from every export:** `tonight_days`, `prompt_history`, `lighter.*`, `entry_marks.hard_day`, `lock.*`. The hard-day mark is derived from a state of mind, not something the person wrote, and an export is often shared; `privacy` to confirm (section 6).

Tests (mobile): `export-waiting.test.ts` (new): 2 held, 1 not read back, 1 typed: 4 objects, 4 text files, 2 audio files whose hashes equal the originals, works offline and in the lapsed plan state; a `discarding` draft is absent. `export-schema.test.ts`: each bump validates the new fixture, every earlier fixture still validates, the previous schema rejects the new file. Golden export updated for the Asha family.

## 6. Open questions and hand-offs

| To | Question or ask | Recommendation |
|---|---|---|
| Coordinator | #522 and WP-F13-07 both claim local v9; assign L-A to L-D | Give WP-F13-07 (L-B) v9 as 08-delivery fixes; renumber #522 |
| `privacy` | `entries.prompt_key` and `drafts.prompt_key` are L2, but once BL-E4 makes `hard` prompts reachable, a hard key implies a chosen lighter stretch (rule 1.1.7). Same for `prompt_kind: 'hard'` in the analytics catalogue | Raise prompt keys to L4 and map `hard` to a neutral analytics value when BL-E4 ships; this design already classes the new prompt-key columns L4 |
| `privacy`, `sync` | Kept-out marks never sync in 1.x, so after a sign-in-only restore (1.1, no iCloud backup) a letter the parent kept out could come back as a memory | A member-private server table for marks in 1.1, or memories off by default on a phone restored by sync until marks arrive; CPrivO ruling |
| `privacy` | Anniversary as L3 (relationship implied, not a special category) | L3, owner-only; confirm |
| `privacy` | Hard-day mark out of export | Out |
| `privacy`, `mobile` | Packs deleted by Erase | Delete |
| `security` | `lock.requireAfter` 15 minutes | Follow F17-REQ-010 unless security changes it |
| `security`, `mobile` | Device authentication before Erase when the lock is on | Yes |
| `legal` | DATA_CLASSIFICATION 4.5 rows (section 7); POLICY_VERSIONING method list; export spec 4.2 `waiting/`; counsel Q-B, Q-C on a device record uploaded later as evidence | Rows below; counsel per CLO-4 |
| `qa` | Harness: method list in `harness.mjs`, persona cells for S-1 and S-3 | As section 3 |
| `sync` | `ProfileV1` contract and last-writer-wins per date field, only when S-3 is ruled | Hold |

## 7. Proposed classification rows (for the legal owner)

DATA_CLASSIFICATION 4.5, new tables:

| Table.column | Level | Note |
|---|---|---|
| `agreements.id` | L2 | Internal id |
| `agreements.document`, `.version`, `.action`, `.surface` | L2 | Public document keys and enums |
| `agreements.recorded_at`, `.uploaded_at` | L2 | Device and upload times of the act |
| `agreements.app_version` | L2 | |
| `agreements.rendered_sha256` | L2 | Hash of the public agreement sentence (as `policy_acceptances.rendered_sha256`) |
| `agreements.server_act_id` | L2 | `policy_acceptances.id` |
| `prompt_history.child_id` | L3 | Book id |
| `prompt_history.item_kind`, `.shown_on` | L2 | |
| `prompt_history.key` | L4 | A `hard` key implies a chosen lighter stretch (1.1.7) |
| `tonight_days.day`, `.draws`, `.card_kind`, `.memory_type`, `.created_at` | L2 | |
| `tonight_days.child_id` | L3 | Book id |
| `tonight_days.prompt_key` | L4 | As `prompt_history.key` |
| `tonight_days.card_ref` | L3 | Letter id, thought key or occasion key |
| `tonight_days.card_dismissed_at` | L3 | A person's choice about a memory (1.1.7, as `celebrations_paused`) |
| `entry_marks.entry_id` | L3 | Letter id |
| `entry_marks.kept_out_at` | L3 | Keep out of memories |
| `entry_marks.hard_day`, `drafts.hard_day` | L4 | Implies a state of mind (1.1.7) |
| `entry_marks.updated_at` | L2 | |
| `parent_profile.birthday_md`, `.anniversary_md` | L3 | Month and day, no year; owner only; never in notifications or email |
| `parent_profile.id`, `.updated_at` | L2 | |

DATA_CLASSIFICATION 4.5, new settings keys: `lock.enabled`, `lock.requireAfter`, `lock.offered`, `lock.autoOffNotice` L2; `memories.onTonight` L2; `memories.notTodayOn`, `memories.stepBackUntil`, `memories.beforeBirth`, `profileCard.*` L3; `lighter.since`, `lighter.until` L4.

DATA_CLASSIFICATION 4.1 (only when S-3 is ruled): `profile_dates.profile_id` L3, `birthday_md` L3, `anniversary_md` L3, `birthday_md_at`, `anniversary_md_at`, `updated_at` L2.

## 8. Tests by item

| Item | Test file | Proves |
|---|---|---|
| L-A to L-D | `apps/mobile/test/migrations.test.ts` (v0 to head) | Each step is safe on a database that already has the object; L-A creates 0 rows with `ageGate.passed = '1'`; L-B moves `memories.notTodayOn` into `tonight_days` and deletes the key; older build opens the newer file (`newer: true`) |
| Agreement | `apps/mobile/test/agreements.test.ts` (new) | No age column; Yes plus tick writes 2 rows and `ageGate.passed`; No or no tick writes none; append-only; upload only for the claiming account; never logged (log canary for the table name and hash) |
| LEGAL-REQ-002 | `apps/mobile/test/age-gate.test.ts` | Unchanged and green (CCO-6) |
| Tonight | `packages/core/test/tonight.test.ts`, `prompts.test.ts` | CPO-6 two-year property test (no key twice in 365 days while unseen keys remain; never within 120 days; draws count); same room all day across relaunch; memory not twice in 7 days; thoughts at most 3 in 7; step back after three Not todays |
| Marks | `packages/core` selector table test; mobile repo test | Kept-out, hard-day, hard prompt, private, quiet, departed author never chosen; mark deleted with its letter in every purge path |
| Profile dates | `packages/core` month-day test; mobile static check | 02-29 rule; no notification or email code reads `parent_profile` |
| Erase | #520 tests plus one new | Every table empty at head schema; `ageGate.stoppedAt` kept only within 24 hours; no `lock.*`, no agreement; synchronizable Keychain items untouched |
| Export | `export-waiting.test.ts`, `export-schema.test.ts`, golden | Section 5 |
| S-1 | `policy_device_first_run.test.mjs`, access matrix row | Section 3.1 |
| S-2 | `profiles_display_name_shape` cases in the same new file or `security_family.test.mjs` | Section 3.2 |
| S-3 | access matrix rows, `grants.mjs`, `classification.test.mjs`, deletion worker test, functions grep | Section 3.3 |
