# Data, security and lifecycle pack: index (Karma, 20 Nov 2026)

What this is: the engineering reference for how data, keys, access, logs and customer messages work. Docs only; nothing here is built. Every claim is tagged [V] verified against code by a reviewer, [E] estimate or [U] unverified; the founder's decisions are in `../DECISIONS-20nov.md`.

## 1. Reading order
1. `01a`, `01b`: what data exists, its level (L1 to L4 as in `docs/legal/DATA_CLASSIFICATION.md`), and where it can leak.
2. `02a` to `02i`: the schema reference. 02a to 02d server tables and views (41 tables, 10 views, 453 columns [V]); 02e functions (206 [V]); 02f triggers, buckets, storage; 02g the phone database (10 tables, schema version 10 [V]); 02h other phone stores; 02i designed-not-built.
3. `03` access and authorisation; `04` secrets, keys and endpoints.
4. `05` audit, logging and reporting; `06` data use, retention and rights.
5. `07-communication-1` to `-4`: every message the product may send, the security alerts, lifecycle and leak rules, tests and questions.
6. `council/`: the executive seats' written answers (not binding on their own; the record).

## 2. The rules in one place
- Default deny. A column's reader, writer, level, retention, deletion path and test are in its table block.
- No secret value in any document, log, test, bundle or PR. Secrets are named by purpose and holder (`04`).
- The service key reaches Auth admin and Storage as well as the 44 listed functions [V] (`03` section 6).
- Nothing about a child's voice, picture or letter text leaves the phone for a cloud AI provider (X2; `06` C10).
- Words a parent reads are PROPOSED content keys only.

## 3. Numbers a builder may rely on [V by reviewers, test harness only]
31 migrations, 2 recorded applied (`.github/migrations-applied.txt`); 206 functions, 0 executable by PUBLIC or anon, 154 definer; 49 triggers; 3 buckets, 9 storage policies; 44 service-role functions (`supabase/tests/grants.mjs`). The hosted project was not read.

## 4. Open items by owner (each with a default in the file named)
- `data-architect`: SCPRG keyed-hash design (C5); the 14 policies naming a role with no grant; `dictionary_terms` without a grant; sweeps for `held_drafts_gone` and `legal_holds`; map from `DATA_CLASSIFICATION.md` section numbers to the ids in 01a [U, not written].
- `security-architect`: per-function roles (C2); `security_events` and audit writers (C3); drop the `insights_reader` grant to `authenticator`; trusted-ref condition on the two-job deploy.
- `privacy`: audit export allowlist (B8); retention periods to counsel; public deletion and backup wording with `legal`.
- `sync`: alert rules per `DECISIONS-20nov.md` D1, D2, D4 and C10; one calm template shape for every alert.
- `mobile`: backup-file exclusion and delete on Erase (B5); notification category and hidden-preview placeholder (D4); the sign-out-others lever behind the alert line (C10).

## 5. Amendments made because of the council
Tracked as follow-up PRs under `data-security/` by their owners; each PR body lists the decision ids it applies. Until they merge, `../DECISIONS-20nov.md` wins over a pack file where they differ.

## 6. Council record
`council/cpo-design.md`, `council/cdo-ciso.md`, `council/privacy-cco-clo.md`, `council/cmo-cfo-cbo-caio.md`. Claude roles, not licensed professionals; legal and tax points are "counsel must confirm".
