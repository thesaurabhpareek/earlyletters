---
chapter: 05
title: Identity and access
owner: security-architect
reviewers: [data-steward, compliance-engineer]
status: adopted
last_reviewed: 2026-11-08
applies_to: supabase/migrations/**, supabase/tests/**, supabase/config.toml, supabase/functions/apple-token/**, apps/mobile/src/lib/auth/**, apps/mobile/src/lib/supabase/**, apps/mobile/src/**/sign-in*, any path named auth or session
---

# 05. Identity and access

## Purpose

Early Letters holds a family's spoken letters about a child: the most intimate data a consumer app can hold. This chapter defines who a caller is and what they may do with a book. The database is the only authority; the app is a convenience that can be bypassed by anyone with the publishable key and a JWT.

## Principles

- **The database decides.** RLS and RPC guards are the access control; the app only hides buttons. *Why:* any client can call PostgREST directly.
- **Membership, not identity, grants access.** An auth user sees a book only through a `child_members` row with a role. *Why:* one person can be a parent of one book and a contributor of another.
- **Least privilege by role.** A contributor gets the minimum: own letters, approved book letters when allowed, name and birthday month and day. *Why:* D-039, and the Privacy Policy promises it.
- **No ambient power.** No service key in the app, no anonymous session in the app, no role change by side effect. *Why:* every escalation path in the 2026-10-03 review (DB-01, DB-03, TDD 04 finding 1) was an ambient grant.
- **Every policy has a test that proves the deny.** *Why:* LEGAL-REQ-024; a policy without a failing-case test is a guess.

## Rules

How to read *Enforced by* (checked by grep on `develop` at the commit this PR is based on, 8 Nov 2026): a named test or check is one that fails when the rule is broken; **review** means a steward checks it by hand; **not yet: BL-<n>** names the backlog item that adds the missing check. Server rules are enforced in the embedded Postgres of `npm run test:db`. Whether a hosted project carries them is a separate fact: `.github/migrations-applied.txt` lists only the first two migration files as applied to production, and BL-583 tracks staging's record. This sweep did not read any hosted project. The production and TestFlight build profiles set `EXPO_PUBLIC_SERVER_FEATURES` to `off` (`apps/mobile/eas.json`; only `preview` turns it on), so no store build signs anyone in today (D-121).

### Identity model

**IAM-R01 (MUST)** Code distinguishes three things: an auth user (`auth.users`, `profiles`), a member (`child_members` row for one book) and a role (`parent` or `contributor`, `scribe_core.sql:48-54`); UI says "Co-parent" and "Family". *Why:* one person, many books, a different role in each. *Enforced by:* `MEMBER_ROLES` in `packages/core/src/domain.ts:37`, pinned to the `child_members.role` and `child_invites.role` CHECK constraints by `packages/analytics/test/domain.test.ts:69-70` (enforced on develop); review for the rest.

**IAM-R02 (MUST)** Every authorisation check takes a book id and resolves the caller's role for that book (`is_child_parent`, `my_role_in`, `security_and_family.sql:110`); no check uses a global "is parent" flag. *Why:* roles are per book. *Enforced by:* the six personas in `supabase/tests/access_matrix.test.mjs:94` (parent, co-parent, contributor, outsider, anonymous, anon) run every cell against one book (enforced on develop); review for new checks.

**IAM-R03 (MUST)** No account, invite acceptance or content write happens for a caller without a current `terms` acceptance carrying `age_attested: true` (D-006, D-026, LEGAL-REQ-001, LEGAL-REQ-002). The server check is `require_content_consent()` (`security_and_family.sql:190`). *Why:* the 18+ gate must hold even if the app is bypassed. *Enforced by:* `security_family.test.mjs` and the access matrix for invite acceptance and content writes (enforced on develop). The "no account" half is not met: email sign-in passes `shouldCreateUser: true` (`apps/mobile/src/lib/auth/email.ts:37`), so an auth user exists before Terms; not yet: BL-581.

**IAM-R04 (MUST NOT)** Store an age, birth date or age range of the adult user. Only `ageGate.passed` and, after a No, `ageGate.stoppedAt` on device; `age_attested` in the acceptance context on the server (D-026). *Enforced by:* `apps/mobile/test/age-gate.test.ts` (device); `supabase/tests/classification.test.mjs` (server columns) (enforced on develop).

### Sign-in

**IAM-R05 (MUST)** v1.0 sign-in methods are Sign in with Apple, Sign in with Google, and email link plus 6-digit code (D-054, which supersedes D-044). Passkeys may be added after sign-in (D-054); they are behind `EXPO_PUBLIC_PASSKEYS`, which no build profile sets. No other provider ships without a decision. *Why:* each provider adds a client id, a test matrix and a Guideline 4.8 check. *Code:* `apps/mobile/src/lib/auth/apple.ts:55`, `google.ts:61`, `email.ts:35`, `passkey.ts:29`. *Enforced by:* review; not yet: BL-727 (a source check that the only `sb.auth.signIn*` calls are these).

**IAM-R06 (MUST NOT)** Offer passwords or a password reset flow (D-054). *Enforced by:* `packages/content/test/emails.test.ts:126` (no email asks for a password; enforced on develop); `supabase/config.toml` notes the CLI cannot turn off email plus password sign-in, so the app never calling it is the control; not yet: BL-727 (a source check that `signInWithPassword` and `resetPasswordForEmail` appear nowhere under `apps/mobile/src`).

**IAM-R07 (MUST NOT)** Call `signInAnonymously` anywhere under `apps/mobile`. Anonymous identities are reserved for the v1.1 web contribution page and created server-side only (TDD 04 3.4.3). *Why:* Supabase gives anonymous users the `authenticated` role; only a claim check stops them. *Enforced by:* `enable_anonymous_sign_ins = false` pinned by `supabase/tests/auth_config.test.mjs` ("sessions and sign-in switches"); server backstop: restrictive `*_no_anonymous` policies on every client table (`access_matrix.test.mjs:677`) and `require_user()` or `is_anonymous()` in every RPC (`access_matrix.test.mjs:649`) (all enforced on develop). The app-side ban is not yet: BL-727 (MONO-01 asked for a lint rule; none exists).

**IAM-R08 (MUST)** Sign in with Apple uses a SHA-256 nonce and exchanges the authorization code server-side for a refresh token stored encrypted, so it can be revoked on account deletion (TDD 04 3.1.1, LEGAL-REQ-026). *Code:* nonce in `apps/mobile/src/lib/auth/nonce.ts:12`; exchange in `supabase/functions/apple-token/handler.ts` (BL-330); revoke in `supabase/functions/purge-worker/account.ts:179`. *Enforced by:* `supabase/functions/apple-token/handler.test.ts` (exchange, wrap under the newest key, refuse another user's token, no log canary), `purge-worker/test/lib.test.ts:15` (AES-GCM wrap bound to the profile) and `purge-worker/test/worker.test.ts:162-181` (revoke step), all under `npm run test:functions` (enforced on develop). The nonce hash itself has no test (`auth-apple-token.test.ts` mocks the digest); review.

**IAM-R09 (MUST)** Email sign-in responses never reveal whether an address has an account; tokens travel only in `https://` universal links with the secret in the URL fragment, never in the custom scheme (TDD 04 3.1.3, 3.1.6, LEGAL-REQ-014). *Enforced by:* `auth_config.test.mjs` (redirect allowlist is exactly `https://earlyletters.com/auth/callback`, no wildcard, no custom scheme; templates build the fragment link, never `ConfirmationURL`); `apps/mobile/test/auth-links.test.ts:11,55`, `deep-link.allowlist.test.ts:43,121,153` and `auth-email-link.test.ts:131,225` (enforced on develop). The no-reveal half rests on `shouldCreateUser: true` (`email.ts:37`), which makes the response the same for a new and a known address; nothing pins it, and BL-581 may change it; not yet: BL-727. BL-603 tracks the link token in a GET query string reaching Supabase logs.

### Sessions on device

**IAM-R10 (MUST)** Session tokens and pending invite tokens live only in the iOS Keychain with `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, never in SQLite, AsyncStorage, MMKV, logs or analytics (TDD 04 3.2.1, LEGAL-REQ-026). *Why:* a restored backup on another phone must not carry a live session. *Code:* `apps/mobile/src/lib/supabase/secure-storage.ts:24`, used by `lib/auth/session-provider.tsx`, `lib/auth/pending.ts` and `lib/auth/apple.ts`. *Enforced by:* not yet: BL-599 (every test that touches it mocks the module, so none checks the accessibility option).

**IAM-R11 (SHOULD)** JWT expiry is 15 minutes with refresh rotation and reuse detection on (TDD 04 3.1). Recording and reading never wait on a session (TDD 04 3.2.2). *Enforced by:* `supabase/config.toml` sets `jwt_expiry = 900`, `enable_refresh_token_rotation = true`, `refresh_token_reuse_interval = 10`; `auth_config.test.mjs` ("sessions and sign-in switches") pins the first two (enforced on develop for the repository file; the test cannot see hosted projects, which `supabase/auth-email.md` section 3 lists). The reuse interval is not pinned; not yet: BL-727. "Never wait on a session": review.

**IAM-R12 (MUST)** Settings offers "Sign out other devices" (`signOut` scope `others`), and a revoked or rejected refresh keeps the upload queue intact (TDD 04 3.2.2, 3.2.3). *Code:* the row in `apps/mobile/src/app/settings/account.tsx:249`; `signOutOtherDevices` in `lib/auth/session-provider.tsx:522-525`. *Enforced by:* `apps/mobile/test/auth-machine.test.ts:211` (a session revoked elsewhere signs out with a calm message) and `account-view.test.ts:142` (enforced on develop). No test pins scope `others`, and none proves the outbox survives `SESSION_LOST`; not yet: BL-727. Ending every session for one person or for everyone is BL-597.

### Authorisation in the database

**IAM-R13 (MUST)** RLS on every table is DB-R12; on top of it, any table `authenticated` can reach has a restrictive policy that refuses anonymous sessions. *Enforced by:* `access_matrix.test.mjs:677` (tables) and the Storage bucket check after it (enforced on develop).

**IAM-R14 (MUST)** Every function callable by `authenticated` is listed in the access matrix, starts with `require_user()` (or checks `is_anonymous()`), and no function is executable by `anon`. *Enforced by:* `access_matrix.test.mjs:640` (listed), `:643` (not `anon`), `:649` (`require_user()`) (enforced on develop).

**IAM-R15 (MUST)** Views are read-only to clients exactly as DB-R13 states; a view is never an authorisation boundary that grants more than its base tables. *Why:* DB-01 (Critical). *Enforced by:* `access_matrix.test.mjs:629` ("no view is writable by anon or authenticated") and the explicit grant list in `supabase/tests/grants.mjs` (enforced on develop). Since `20261023060000`, no client role holds SELECT on `book_entries`; `sync_pull` reads it as its owner.

**IAM-R16 (MUST)** Book visibility has one predicate. Until D-024's `book_access` table exists, `book_entries`, Storage read policies and any pull RPC use the same logic and are covered by the same matrix rows. Once `book_access` lands, all of them read it and nothing else. *Enforced by:* review (data-steward, security-architect); `book_access` is not yet: BL-175 (deferred to v1.2).

**IAM-R17 (MUST)** Contributors read only the child's name, nickname and birthday month and day; the birth date and due date are never selectable by a client role (D-039, DB-05). *How:* column privileges on `children` (`20261015000000`, G-08; the list is `COLUMNS.children` in `supabase/tests/grants.mjs`), and `sync_pull` and `sync_books` return `date_of_birth` only to a parent and `birthday_md` to everyone (`20261015000000_v1_gate_membership_sync_hardening.sql:303-309`). There is no `book_children` view. *Enforced by:* `access_matrix.test.mjs:123-127` and `:543`; `v1_gate_hardening.test.mjs:44-49`; `sync_engine.test.mjs:211-220` (enforced on develop).

### Invites, removal and role changes

**IAM-R18 (MUST)** Only a parent of a live book creates or revokes an invite; the role is explicit with no default; tokens are stored as SHA-256 hashes and returned once; expiry is 7 days (co-parent) or 14 days (Family); hashes are deleted 90 days after use, revocation or expiry (D-020, DB-03, BL-112). *Code:* `create_child_invite` (latest in `20261015020000_v1_gate_coparent_invites_undo.sql`, both signatures), purge in `purge_due`. *Enforced by:* `security_family.test.mjs:46-60` (explicit role, no default, 7 and 14 days, hash only), `v1_gate_coparent.test.mjs:48-50` (32-byte hashes), `purge_batching.test.mjs:67` (90 days) (enforced on develop).

**IAM-R19 (MUST)** Accepting an invite never changes an existing member's role, and the inviter cannot accept their own invite (`accept_child_invite`). *Enforced by:* `security_family.test.mjs:64-69` (enforced on develop).

**IAM-R20 (MUST)** A role change or a removal is an explicit, audited, parent-only RPC; no other path writes `child_members.role` or deletes another member's row. *Code:* `remove_child_member` (`20261005000000`), `undo_parent_join` (72 hours, `20261015020000`), `leave_child`; the `child_members_audit` trigger writes `member_removed`, `member_join_undone` and `left_book`. No role-change RPC exists, and no client role can write `role`. A parent cannot remove the other parent (PRD B F8). *Enforced by:* `db_followup_family_cap.test.mjs:138-158` (who may remove, audit row names the remover), `v1_gate_coparent.test.mjs:189-193` and `:246` (no direct role change or delete), `former_member_purge.test.mjs:80` (enforced on develop).

**IAM-R21 (MUST)** The last parent of a live book cannot leave (`child_members_guard`, SQLSTATE `SCLPG`). *Enforced by:* `data_governance.test.mjs:86`, `db_followup_family_cap.test.mjs:94-96` (enforced on develop).

### Accounts and keys

**IAM-R22 (MUST)** Account deletion goes through `request_account_deletion` and the purge pipeline (chapter 08 owns the process). Deleting a user from the Supabase dashboard is forbidden in production because `profiles.id references auth.users on delete cascade` (`scribe_core.sql:19`) hard-deletes letters (DB-17). *Enforced by:* review; not yet: BL-728 (the cascade still stands, and no runbook or check stops a dashboard deletion). A support-opened deletion is BL-551.

**IAM-R23 (MUST NOT)** Give an AI agent, its environment or its connectors a Supabase secret or `service_role` key (PINF-01, PINF-05). Keys in the app are SEC-R03. *Enforced by:* review: `.github/workflows/agents.yml` names no Supabase secret (grep, 8 Nov 2026); not yet: BL-727 for a check that keeps it so. Interactive sessions with a Supabase connector are outside `agents.yml`; BL-603 asks that no agent session can reach the staging organization.

**IAM-R24 (MUST)** Every new table, column visible to clients, view, RPC or Storage policy adds rows to the access matrix for every persona (parent, co-parent, contributor, outsider, anonymous, anon) in the same PR, including at least one deny. *Enforced by:* `access_matrix.test.mjs:615` (every public table and view has a row) and `:640` (every callable function) (enforced on develop); review for the deny cell and for Storage policies.

## How to apply it

New RPC checklist:
1. `security definer`, `set search_path = pg_catalog, public, pg_temp` (pg_catalog first, pg_temp last; `pg_temp_search_path.test.mjs`).
2. First line `v_uid uuid := public.require_user();`
3. Role check for the specific book (`is_child_parent(p_child)` and so on); raise a named SQLSTATE (`SCPAR`, never a bare `P0001`).
4. `perform public.require_content_consent();` before any content write.
5. `revoke execute ... from public, anon;` then grant to `authenticated` only if clients call it, and add the grant to `supabase/tests/grants.mjs` (default privileges are reset since `20261023060000`).
6. Add an `audit(...)` call for membership, invite and deletion acts.
7. Add matrix cells: allow for the intended role, deny for every other persona.

New view checklist: `security_barrier` or `security_invoker`; column allowlist (never `raw_transcript`, `machine_edits`, `stt_meta`); the DB-R13 revoke block; a grant only where a code path reads it, listed in `grants.mjs`; matrix cells for select and for each write verb expecting `42501`.

```sql
revoke all on public.<view> from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.<view> from authenticated;
-- grant select on public.<view> to authenticated;  -- only if a client reads it directly
```

Mobile auth code: keep it under `apps/mobile/src/lib/auth/` (session storage in `lib/supabase/secure-storage.ts`) so the dispatcher routes the PR to security-architect (`review_paths` in `agents/roster.json`). Never read the session in a screen; go through the auth module (`useAuth`).

Account recovery and suspected takeover: `docs/ops/runbooks/account-recovery.md` (BL-598, pending PR #620). Support never changes a sign-in email or links an identity by hand.

## Exceptions

Only the founder grants an exception, recorded as a `D-###` in `docs/DECISIONS.md` or, for a one-off, in the PR body with the founder's approving review. Any exception to IAM-R07, R13 to R17, R20 or R23 also needs the `approve-migration` label (D-041). A test that encodes the exception is required; "temporary" exceptions name a removal date.

## Open questions

1. 8-digit email codes instead of 6 (TDD 04 OQ-S1), given the per-IP-only limit on verify. BL-595 moves the lockout to the server.
2. Should `profiles.id` stop cascading from `auth.users` (DB-17), so dashboard deletion fails closed? BL-728; needs data-steward agreement.
3. Should support ever suspend sign-in, and who may lift it? BL-552 builds the path; the runbook uses it once it exists.

Answered since 3 Oct: sign-in at v1.0 (D-054: Apple, Google and email); whether one parent can remove the other (no: PRD B F8, `db_followup_family_cap.test.mjs:140`; the inviter can undo a co-parent's join within 72 hours); what happens to a removed member's letters (they stay in the book, DATA-REQ-017, D-069).

## References

Repo: `docs/tdd/04-security-identity.md` sections 3.1 to 3.5 and 8.1; `docs/DECISIONS.md` D-006, D-020, D-024, D-026, D-039, D-041, D-054, D-121; `docs/agents/BRIEF-2026-10-03.md` decisions 4 and 17; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-001, -002, -014, -024, -026; `supabase/config.toml`; `supabase/migrations/20261003000000_security_and_family.sql`, `20261015000000_v1_gate_membership_sync_hardening.sql`, `20261015020000_v1_gate_coparent_invites_undo.sql`, `20261023060000_explicit_grants.sql`; `supabase/tests/access_matrix.test.mjs`, `auth_config.test.mjs`, `grants.mjs`; `docs/BACKLOG.md` BL-112, BL-175, BL-551, BL-552, BL-581, BL-597, BL-599, BL-603, BL-727, BL-728; audit `docs/reviews/2026-11-01-robustness-compliance-audit.md` SEC-09; architecture review findings DB-01, DB-03, DB-05, DB-08, DB-17, PSEC-01, PSEC-02, PINF-01, PINF-05. Related chapters: 03 (RLS mechanics), 06 (secrets), 08 (deletion process).

External, read 8 Nov 2026:
- Supabase, Signing out: scopes `global` (default in JavaScript), `local` and `others`; "Access Tokens of revoked sessions remain valid until their expiry time". https://supabase.com/docs/guides/auth/signout
- Supabase, User sessions: a refresh token is used once; reuse interval 10 seconds by default; reuse outside it revokes the session. https://supabase.com/docs/guides/auth/sessions
- Supabase, Identity linking: automatic linking by email; unconfirmed identities are removed when a new identity links; manual linking is a project setting (ours is off, `enable_manual_linking = false`). https://supabase.com/docs/guides/auth/auth-identity-linking

External, checked 2026-10-03 (not re-read in this sweep):
- Supabase, Anonymous Sign-Ins: anonymous users use the `authenticated` role with an `is_anonymous` claim; restrictive policies recommended. https://supabase.com/docs/guides/auth/auth-anonymous.md
- Supabase, Row Level Security: views bypass RLS unless `security_invoker`; grants and policies are separate layers. https://supabase.com/docs/guides/database/postgres/row-level-security.md
- Supabase, API keys: publishable keys are for clients; secret keys bypass RLS and belong only on backends. https://supabase.com/docs/guides/api/api-keys.md
- OWASP MASVS (control groups STORAGE, AUTH, PLATFORM used for this chapter's device rules). https://mas.owasp.org/MASVS/
