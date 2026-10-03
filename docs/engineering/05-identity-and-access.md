---
chapter: 05
title: Identity and access
owner: security-architect
reviewers: [data-steward, compliance-engineer]
status: adopted
last_reviewed: 2026-10-03
applies_to: supabase/migrations/**, supabase/tests/**, apps/mobile/src/lib/auth*, apps/mobile/src/**/sign-in*, any path named auth or session
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

### Identity model

**IAM-R01 (MUST)** Code distinguishes three things: an auth user (`auth.users`, `profiles`), a member (`child_members` row for one book) and a role (`parent` or `contributor`, `scribe_core.sql:48-54`); UI says "Co-parent" and "Family". *Why:* one person, many books, a different role in each. *Enforced by:* `review` (security-architect); enum parity test in PR #31 (`packages/core/src/domain.ts`) pending.

**IAM-R02 (MUST)** Every authorisation check takes a book id and resolves the caller's role for that book (`is_child_parent`, `my_role_in`, `security_and_family.sql:110`); no check uses a global "is parent" flag. *Why:* roles are per book. *Enforced by:* `review`; access matrix personas in `supabase/tests/access_matrix.test.mjs`.

**IAM-R03 (MUST)** No account, invite acceptance or content write happens for a caller without a current `terms` acceptance carrying `age_attested: true` (D-006, D-026, LEGAL-REQ-001, LEGAL-REQ-002). The server check is `require_content_consent()` (`security_and_family.sql:197`). *Why:* the 18+ gate must hold even if the app is bypassed. *Enforced by:* `npm run test:db` (`security_family.test.mjs`, access matrix), enforced on `develop` in the pending files; live only after files 3 to 7 apply (DB-03).

**IAM-R04 (MUST NOT)** Store an age, birth date or age range of the adult user. Only `ageGate.passed` and, after a No, `ageGate.stoppedAt` on device; `age_attested` in the acceptance context on the server (D-026). *Enforced by:* `apps/mobile/test/age-gate.test.ts` (device); `classification.test.mjs` (server columns).

### Sign-in

**IAM-R05 (MUST)** v1.0 sign-in methods are Sign in with Apple and email link plus 6-digit code (D-044, PRD 1.3). Google sign-in is v1.1 (BRIEF decision 4 lists it; D-044 schedules it). No other provider ships without a decision. *Why:* each provider adds a client id, a test matrix and a Guideline 4.8 check. *Enforced by:* `review`; not yet a test (no auth code exists in `apps/mobile/src` as of 2026-10-03).

**IAM-R06 (MUST NOT)** Offer passwords or a password reset flow (BRIEF decision 4). Passkeys MAY be added after sign-in later (TDD 04 3.13). *Enforced by:* `review`.

**IAM-R07 (MUST NOT)** Call `signInAnonymously` anywhere under `apps/mobile`. Anonymous identities are reserved for the v1.1 web contribution page and created server-side only (TDD 04 3.4.3). *Why:* Supabase gives anonymous users the `authenticated` role; only a claim check stops them. *Enforced by:* not yet: MONO-01 lint ban (WS-12, no PR open). Server backstop on `develop`: restrictive `*_no_anonymous` policies on every client table and `require_user()` in every RPC, both asserted by `access_matrix.test.mjs`.

**IAM-R08 (MUST)** Sign in with Apple uses a SHA-256 nonce and exchanges the authorization code server-side for a refresh token stored encrypted, so it can be revoked on account deletion (TDD 04 3.1.1, LEGAL-REQ-026). *Enforced by:* not yet: the `apple-token` function is not built.

**IAM-R09 (MUST)** Email sign-in responses never reveal whether an address has an account; tokens travel only in `https://` universal links with the secret in the URL fragment, never in the custom scheme (TDD 04 3.1.3, 3.1.6, LEGAL-REQ-014). *Enforced by:* not yet: web `/a` page and link handling not built; WS-11 intent allowlist (PSEC-02) pending.

### Sessions on device

**IAM-R10 (MUST)** Session tokens and pending invite tokens live only in the iOS Keychain with `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, never in SQLite, AsyncStorage, MMKV, logs or analytics (TDD 04 3.2.1, LEGAL-REQ-026). *Why:* a restored backup on another phone must not carry a live session. *Enforced by:* not yet: `expo-secure-store` and `@supabase/supabase-js` are not dependencies today (`apps/mobile/package.json`); the first auth PR must add a test that the storage adapter sets the accessibility option.

**IAM-R11 (SHOULD)** JWT expiry is 15 minutes with refresh rotation and reuse detection on (TDD 04 3.1). Recording and reading never wait on a session (TDD 04 3.2.2). *Enforced by:* not yet: project config (`supabase/config.toml`) arrives with WS-14.

**IAM-R12 (MUST)** Settings offers "Sign out other devices" (`signOut` scope `others`), and a revoked or rejected refresh keeps the upload queue intact (TDD 04 3.2.2, 3.2.3). *Enforced by:* not yet.

### Authorisation in the database

**IAM-R13 (MUST)** RLS on every table is DB-R12; on top of it, any table `authenticated` can reach has a restrictive policy that refuses anonymous sessions. *Enforced by:* `access_matrix.test.mjs` structural checks (enforced on `develop`).

**IAM-R14 (MUST)** Every function callable by `authenticated` is listed in the access matrix, starts with `require_user()` (or checks `is_anonymous()`), and no function is executable by `anon`. *Enforced by:* `access_matrix.test.mjs` lines 253-266 (enforced on `develop`).

**IAM-R15 (MUST)** Views are read-only to clients exactly as DB-R13 states; a view is never an authorisation boundary that grants more than its base tables. *Why:* DB-01 (Critical). *Enforced by:* see DB-R13.

**IAM-R16 (MUST)** Book visibility has one predicate. Until D-024's `book_access` table exists, `book_entries`, Storage read policies and any pull RPC use the same `can_read_book` logic and are covered by the same matrix rows. Once `book_access` lands, all of them read it and nothing else. *Enforced by:* `review` (data-steward, security-architect); not yet for `book_access` (DB-08).

**IAM-R17 (MUST)** Contributors read only the child's name, nickname and birthday month and day, through `book_children`; the base `children` select is parents only (D-039, DB-05). *Enforced by:* pending PR #32 (`book_children` view, access matrix cell `book_children`).

### Invites, removal and role changes

**IAM-R18 (MUST)** Only a parent of a live book creates or revokes an invite; the role is explicit with no default; tokens are stored as SHA-256 hashes and returned once; expiry is 7 days (co-parent) or 14 days (Family); hashes are deleted 90 days after use, revocation or expiry (D-020, DB-03, BL-112). *Enforced by:* `create_child_invite` in `security_and_family.sql:317`, `purge_batching.sql:137`, tests in `security_family.test.mjs`; on `develop` but NOT live until file 5 applies (DB-03).

**IAM-R19 (MUST)** Accepting an invite never changes an existing member's role, and the inviter cannot accept their own invite (`accept_child_invite`, `security_and_family.sql:366`). *Enforced by:* `security_family.test.mjs`.

**IAM-R20 (MUST)** A role change or a removal is an explicit, audited, parent-only RPC; no other path writes `child_members.role` or deletes another member's row. *Why:* PSEC-01 (no remove or role change exists). *Enforced by:* not yet: WS-02 (`remove_member`, `set_member_role`), founder decision pending on whether one parent can remove the other.

**IAM-R21 (MUST)** The last parent of a live book cannot leave (`child_members_guard`, SQLSTATE `SCLPG`). *Enforced by:* `data_governance.test.mjs`.

### Accounts and keys

**IAM-R22 (MUST)** Account deletion goes through `request_account_deletion` and the purge pipeline (chapter 08 owns the process). Deleting a user from the Supabase dashboard is forbidden in production because `profiles.id references auth.users on delete cascade` hard-deletes letters (DB-17). *Enforced by:* not yet: runbook in WS-18; `review`.

**IAM-R23 (MUST NOT)** Give an AI agent, its environment or its connectors a Supabase secret or `service_role` key (PINF-01, PINF-05). Keys in the app are SEC-R03. *Enforced by:* review (security-architect); agents run with no Supabase credentials in `agents.yml`.

**IAM-R24 (MUST)** Every new table, column visible to clients, view, RPC or Storage policy adds rows to the access matrix for every persona (parent, co-parent, contributor, outsider, anonymous, anon) in the same PR, including at least one deny. *Enforced by:* `access_matrix.test.mjs` fails on an unlisted callable function; `review` for tables and views.

## How to apply it

New RPC checklist:
1. `security definer`, `set search_path = pg_catalog, public` (DB-11 order on new or changed functions).
2. First line `v_uid uuid := public.require_user();`
3. Role check for the specific book (`is_child_parent(p_child)` and so on); raise a named SQLSTATE (`SCPAR`, never a bare `P0001`).
4. `perform public.require_content_consent();` before any content write.
5. `revoke execute ... from public, anon;` then grant to `authenticated` only if clients call it.
6. Add an `audit(...)` call for membership, invite and deletion acts.
7. Add matrix cells: allow for the intended role, deny for every other persona.

New view checklist: `security_barrier` or `security_invoker`; column allowlist (never `raw_transcript`, `machine_edits`, `stt_meta`); the IAM-R15 revoke block; matrix cells for select and for each write verb expecting `42501`.

```sql
revoke all on public.book_children from public, anon;
revoke insert, update, delete, truncate, references, trigger on public.book_children from authenticated;
grant select on public.book_children to authenticated;
```
(Pattern from PR #32, `security_and_family.sql:634-636`.)

Mobile auth code: keep it under `apps/mobile/src/lib/auth/` so the fence (`fence.yml`, PR #30) catches it. Never read the session in a screen; go through the auth module.

## Exceptions

Only the founder grants an exception, recorded as a `D-###` in `docs/DECISIONS.md` or, for a one-off, in the PR body with the founder's approving review. Any exception to IAM-R07, R13 to R17, R20 or R23 also needs the `approve-migration` label (D-041). A test that encodes the exception is required; "temporary" exceptions name a removal date.

## Open questions

1. Sign-in at v1.0: BRIEF decision 4 lists Google; D-044 moves Google to v1.1. This chapter follows D-044 and PRD 1.3. Founder to confirm.
2. Can one parent remove the other co-parent (WS-02)? Options: yes, only the book creator, or only with both parents' agreement.
3. When a contributor leaves or is removed, are their letters kept in the book or tombstoned?
4. 8-digit email codes instead of 6 (TDD 04 OQ-S1), given the per-IP-only limit on verify.
5. Should `profiles.id` stop cascading from `auth.users` (DB-17) in a pending migration, so dashboard deletion fails closed? Needs data-steward agreement.

## References

Repo: `docs/tdd/04-security-identity.md` sections 3.1 to 3.5 and 8.1; `docs/DECISIONS.md` D-006, D-020, D-024, D-026, D-039, D-041, D-044; `docs/agents/BRIEF-2026-10-03.md` decisions 4 and 17; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-001, -002, -014, -024, -026; `supabase/migrations/20261003000000_security_and_family.sql`; `supabase/tests/access_matrix.test.mjs`; `docs/BACKLOG.md` BL-112, BL-122; architecture review findings DB-01, DB-03, DB-05, DB-08, DB-17, PSEC-01, PSEC-02, PINF-01, PINF-05; workstreams WS-01, WS-02, WS-11, WS-12. Related chapters: 03 (RLS mechanics), 06 (secrets), 08 (deletion process).

External (checked 2026-10-03):
- Supabase, Anonymous Sign-Ins: anonymous users use the `authenticated` role with an `is_anonymous` claim; restrictive policies recommended. https://supabase.com/docs/guides/auth/auth-anonymous.md
- Supabase, Row Level Security: views bypass RLS unless `security_invoker`; grants and policies are separate layers. https://supabase.com/docs/guides/database/postgres/row-level-security.md
- Supabase, API keys: publishable keys are for clients; secret keys bypass RLS and belong only on backends. https://supabase.com/docs/guides/api/api-keys.md
- OWASP MASVS (control groups STORAGE, AUTH, PLATFORM used for this chapter's device rules). https://mas.owasp.org/MASVS/
