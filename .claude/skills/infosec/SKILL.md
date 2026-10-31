---
name: infosec
description: Information security for Early Letters. Use when reviewing or building auth, sign-up, database access rules, Edge Functions, secrets, CI and dependencies, logging, incident response, or any new endpoint, vendor or SDK. Gives the threat-model method, the checks per layer, the open-source tools we use or plan to, and where the existing standards live.
---

# Infosec (Early Letters)

Load this before a security review or any change to auth, `supabase/**`, `supabase/functions/**`, `.github/**`, secrets or a new vendor. The standards already exist; this skill tells you how to apply them and what to check, so do not restate the chapters.

## 1. Sources of truth

| What | Where |
|---|---|
| Security and identity design | `docs/tdd/04-security-identity.md` |
| Engineering security rules | `docs/engineering/05-identity-and-access.md`, `06-security-engineering.md` (owner: `security-architect`); logging in `10-logging-and-observability.md` |
| Auth review and checklist | `docs/security/REVIEW_R17_AUTH.md`, `REVIEW_R17_CHECKLIST.md` |
| Secrets review | `docs/security/SECRETS_REVIEW.md` |
| Incident runbooks | `docs/ops/runbooks/suspected-data-leak.md`, `incident-notification.md` |
| Ops security | `docs/ops/SECURITY.md` |
| Threat model | open PR #342 (`docs/threat-model`); review it before writing a new one |
| CI scanning | open PR #30 (`ci/hardening`): gitleaks, Dependabot, audit gate, `security.yml`. Held for the D-041 independent review. Land it; do not write a second one. |

## 2. Threat-model every new surface (STRIDE, 15 minutes, in the PR body)

For each new screen, endpoint, table, function, vendor or workflow, answer in the PR:
- **Spoofing:** who can call this, and how do we know it is them? (User JWT only; no service key in the app, BRIEF decision 17.)
- **Tampering:** can a caller change data they should not? Which RLS policy or definer check stops it, and which test proves it?
- **Repudiation:** is there a content-free audit row for a consequential action?
- **Information disclosure:** can any letter text, transcript, audio, child name, IP or token reach a log, an error, an analytics event or a third party? (CLAUDE.md privacy rules.)
- **Denial of service:** rate limit, idempotency key, size limit, timeout.
- **Elevation of privilege:** `security definer` functions pin `search_path` with `pg_temp` last, revoke from `public`, `anon` and `authenticated` unless needed, and grant explicitly.

## 3. Checks by layer

**Postgres and Supabase**
- RLS on every table the client can reach; a new table ships its grants in its own migration and in `supabase/tests/grants.mjs` (default privileges were reset in `20261023060000`).
- `security definer` functions: pinned `search_path` (the repo sweep test), no dynamic SQL from user input, explicit grants.
- Never edit an applied migration. `npm run test:db` must pass, including the access matrix.
- Auth hooks run as `supabase_auth_admin`: grant only that role execute, and give it only the table rights the hook needs.
- Use the Supabase advisors (security and performance lints) on any hosted project before and after a migration is applied; applying is the founder's step.

**Edge Functions and APIs**
- Verify the JWT; never trust a user id from the body when the JWT has it.
- Content-free logs with request ids. No IPs stored unless a rule says why and for how long.
- Secrets only from the platform's secret store; never in code, tests, fixtures or logs.

**The iOS app (OWASP MASVS)**
- MASVS-STORAGE: keys and tokens in the Keychain via secure storage, not AsyncStorage.
- MASVS-NETWORK: TLS only; no cleartext exceptions in `app.config.ts`.
- MASVS-AUTH: sessions revocable server-side; sign-out clears local secrets.
- MASVS-PLATFORM: deep links and invite links validated before any action; they reach the 18+ gate first.
- MASVS-CODE: no debug flags or dev menus in store builds.

**Supply chain and CI**
- Actions pinned to a commit SHA. Third-party actions reviewed before adding.
- Lockfile committed; `npm audit --omit=dev` triage per run (severity, exploitability in our use, fix).
- Secret scanning on every push (gitleaks in #30).
- Untrusted text (PR bodies, issues, forks) never reaches an agent prompt as an instruction (OWASP guidance on prompt injection; harness H1 to H12).

## 4. Open-source tools (licences checked before adoption)

| Tool | Use | Licence | Status |
|---|---|---|---|
| gitleaks | Secret scanning in CI | MIT | In PR #30 |
| Dependabot | Dependency updates | GitHub feature, free on public and private repos | In PR #30 |
| OSV-Scanner (Google) | Vulnerabilities from the lockfile against OSV.dev | Apache-2.0 | Proposed after #30 lands |
| Semgrep Community Edition | Static analysis for TS and SQL patterns | Engine LGPL-2.1; registry rules carry their own licence, read it before use | Proposed, rules to be chosen |
| Trivy | Scans for containers and IaC, if we ever add them | Apache-2.0 | Not needed today |
| MobSF | Static and dynamic analysis of the iOS build | GPL-3.0 (we run it, we do not ship it) | Proposed before the first store build, run locally |
| pgaudit | Statement-level database audit on hosted Postgres | PostgreSQL licence | Founder decision (hosted setting, log volume) |

GitHub CodeQL and secret scanning push protection need GitHub Advanced Security on private repos, which costs money: a founder decision once the repo goes private.

## 5. Incidents
Follow `docs/ops/runbooks/suspected-data-leak.md`. Contain first, then scope with `ops_incident_scope`, then notify per `incident-notification.md`. Never run attack tools against live services; test in the embedded Postgres harness or a local stack.

## Never
- Commit a secret, a real token or a real account id.
- Weaken an RLS policy, a grant or a gate to make a test pass.
- Approve your own PR's security review.
