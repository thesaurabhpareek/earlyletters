# Written information security programme (WISP), short form

Status: **DRAFT for the exec team's CISO read. Not approved. Not reviewed.** Written 27 Nov 2026 for BL-241 (LEGAL-REQ-028). Nothing here was run against a hosted project, a vendor console or a phone. It changes no promise in the Privacy Policy or Terms, and it edits nothing under `docs/legal`.

Companion: [RISK_REGISTER.md](RISK_REGISTER.md) (the risks this programme knows about, with ids R-01 to R-19). Every claim below names the file it comes from. Where something is not built or not known, it says so.

LEGAL-REQ-028 ([ENGINEERING_REQUIREMENTS.md](../legal/ENGINEERING_REQUIREMENTS.md)) asks for a short WISP with: an asset and data inventory that links the data map, roles, access control, key management, vendor review, a secure development checklist, incident response (LEGAL-REQ-037 to -040), and an annual review date. Its acceptance line: at launch readiness, the WISP exists, has an owner and was reviewed within 12 months. Today the first two can be true once this is merged; the third is not, because nobody has reviewed it.

Path note: LEGAL-REQ-028 and [TDD 04](../tdd/04-security-identity.md) (row 26, SEC-20) name `docs/security/WISP.md` and `docs/security/risk-register.md`. BL-241 puts this draft in `docs/ops/`. The CISO read decides which path holds; see question 1 in section 7.

## 1. What the programme covers

**Data.** Every class in [DATA_CLASSIFICATION.md](../legal/DATA_CLASSIFICATION.md) section 1: L1 public, L2 internal, L3 confidential (person ids, email, display name), L4 restricted (letter text, raw transcripts, audio, photos, the child's name and dates, tokens and keys). The handling rules per level are that file's section 2; this page does not repeat them.

**Systems.** The ones these documents describe:
- The Supabase main project: Postgres with RLS, Auth, Storage buckets, Edge Functions ([SECURITY.md](SECURITY.md) sections 1, 3 and 4). Production runs on the Free plan (D-159 in [DECISIONS.md](../DECISIONS.md); [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md)).
- The separate escrow project for recording backup ([BACKUP_RUNBOOK.md](BACKUP_RUNBOOK.md) section 1). Not set up: that runbook says nothing in it has been run against a hosted project, and recording backup is `off` in every build profile (`apps/mobile/eas.json`, `EXPO_PUBLIC_BACKUP`).
- The phone: local SQLite, files and Keychain ([DATA_CLASSIFICATION.md](../legal/DATA_CLASSIFICATION.md) sections 4.5 and 4.6; [MEDIA_THREAT_MODEL.md](../security/MEDIA_THREAT_MODEL.md)).
- Vendors that handle data: Supabase, Cloudflare R2, Resend, Vercel ([subprocessors.md](../legal/subprocessors.md), a draft); Apple and Hugging Face under their own terms (same file).
- The build and agent tooling: the public GitHub repository, its workflows and secrets, the private backup repository, and every Claude session ([ACCESS.md](ACCESS.md) "Agents hold no production power"; [SECRETS.md](SECRETS.md)).

**Data map.** LEGAL-REQ-028 asks the WISP to link the data map. There is no data map file: the `data-map.yaml` that [TDD 10](../tdd/10-red-team-critique.md) names is not in the repository. Until it exists, the inventory is [DATA_CLASSIFICATION.md](../legal/DATA_CLASSIFICATION.md) section 4. Not built.

## 2. Who owns security

Roles only. The repository names no second person ([runbooks/founder-cannot-act.md](runbooks/founder-cannot-act.md): "Second person: not named").

| Role | Holds | Source |
|---|---|---|
| Founder | Every console account, every secret, the password manager, every physical act (secrets typed into consoles, hosted migrations, store submission). The only role with production access today | [ACCESS.md](ACCESS.md) "Who holds production access today"; CLAUDE.md "Approval"; [FOUNDER_QUEUE.md](../release/FOUNDER_QUEUE.md) |
| CISO (exec team, a Claude role, not an auditor) | Owner of this document and the risk register for the draft; security findings, severity, the hold list, reversible containment | `.claude/skills/early-letters-ciso/SKILL.md` sections 1 and 3 |
| CTO and the exec team | Decide and merge; an exec review stands where the founder used to decide; "counsel" means the exec team's own review, which is not legal advice | CLAUDE.md "Approval" (CR-176, D-168); D-172 in [DECISIONS.md](../DECISIONS.md) |
| `ops` (server and privacy-operations engineer) | [SECURITY.md](SECURITY.md), [ACCESS.md](ACCESS.md), the runbooks | Owner lines of those files |
| `security-architect` | Chapter 06, the security engineering rules | [06-security-engineering.md](../engineering/06-security-engineering.md) front matter |
| `security` (security engineer) | Threat models, CI scans | [MEDIA_THREAT_MODEL.md](../security/MEDIA_THREAT_MODEL.md) owner line; BL-2124 and BL-2125 in [BACKLOG.md](../BACKLOG.md) |
| `privacy` | Reviews the data-request runbooks | [runbooks/data-requests-by-email.md](runbooks/data-requests-by-email.md) owner line |

Agents hold no production power (rules 1 to 5 in [ACCESS.md](ACCESS.md)).

## 3. Safeguards

Each row says whether the safeguard is a **test** (CI fails without it), a **setting** (in a vendor console, read back or not), or **procedure** (a written rule nothing enforces). The chapter 06 rule "a control without a test is a hope" applies: procedure is not counted as a control.

| Area | What is in place, and its kind | Where it lives | Gaps (risk ids) |
|---|---|---|---|
| Access control | RLS on every table, tested in `npm run test:db` (test). The `ops` schema is outside the Data API (setting, to read back). Ops scripts need a project ref, a ticket and an audit row (built into the scripts). No staff tool shows L4 content, but the dashboard can read it (procedure) | [SECURITY.md](SECURITY.md) sections 3 and 4; [ACCESS.md](ACCESS.md) matrix | R-01, R-02, R-05, R-08 |
| Accounts and two-factor | Two-factor on every console, recovery codes offline, founder the only member (procedure; no read-back recorded) | [ACCESS.md](ACCESS.md) "Consoles"; [SECURITY.md](SECURITY.md) section 3 | R-02 |
| Secrets and keys | Secrets only in platform stores and the password manager (procedure). The value scan `scripts/packs/secret-scan.mjs` runs in `npm test` (test). GitHub secret scanning and push protection (setting; state per [SECRETS.md](SECRETS.md) "Not verified here"). Rotation steps and a calendar exist; rotation dates are not recorded anywhere | [SECRETS.md](SECRETS.md); [SECURITY.md](SECURITY.md) sections 1, 2 and 5; [SECRETS_REVIEW.md](../security/SECRETS_REVIEW.md) | R-04, R-07 |
| Encryption | TLS in transit, no ATS exception in the app config (LEGAL-REQ-021; checked by review, no lint, per chapter 06 SEC-R16). iOS file protection class set explicitly (test, `apps/mobile/test/config.test.ts`, SEC-R15). Supabase encryption at rest: Unverified in writing (LEGAL-REQ-022(c)). Recording backup is client-encrypted by design, but backup is off | [06-security-engineering.md](../engineering/06-security-engineering.md); [DATA_CLASSIFICATION.md](../legal/DATA_CLASSIFICATION.md) section 2; [BACKUP_RUNBOOK.md](BACKUP_RUNBOOK.md) | R-15, R-17 |
| Backups and restore | Free plan: no automatic backups. A free nightly encrypted dump in a private repository, a keep-alive and a weekly limits check are written (D-138, D-159). Whether they run is not stated (D-159 "Open"; BL-566 is needs-founder). No drill is recorded in the drill log. Storage is not in the dump | [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md); [runbooks/staging-backup-free.md](runbooks/staging-backup-free.md); [runbooks/restore-drill.md](runbooks/restore-drill.md) | R-06, R-07 |
| Logging and monitoring | Content-free function logs and a log canary (test, `supabase/functions/_shared/log/canary.test.ts`). `ops.audit_log` for runbook use. Purge-worker alerts by email. `ops.security_events` is written as a migration but pending, and its sender is not built. The outside purge watch waits on founder steps (FO-1). Supabase keeps logs 1 day on Free | [SECURITY.md](SECURITY.md) section 6; `supabase/migrations/20261111010000_audit_writers_security_events.sql` header; BL-242, BL-584; [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md) | R-09, R-16 |
| Vendor management | A draft subprocessor list. DPAs and retention evidence: needs founder (BL-106, FT-30). No vendor review procedure exists as a file | [subprocessors.md](../legal/subprocessors.md); BL-106 in [BACKLOG.md](../BACKLOG.md) | R-15 |
| Secure development | Engineering rules SEC-R01 to SEC-R25, each with its "Enforced by" (several say "not yet"). `npm ci` from a committed lockfile (CI, SEC-R06). Native packages go through a gate. The PR template has a "Risk and rollback" section; it has no security checklist | [06-security-engineering.md](../engineering/06-security-engineering.md); [NATIVE_MODULE_GATE.md](../security/NATIVE_MODULE_GATE.md); `.github/pull_request_template.md` | R-12, R-13, R-14 |
| Agents and tooling | Agent jobs read only model and identity secrets; production secrets only in Environments (test, `scripts/ops/test/agent-env.test.ts`). Sessions with support or data work hold no mail, Supabase or Vercel connector (procedure) | [ACCESS.md](ACCESS.md) "Agents hold no production power" | R-03, R-04 |
| Incident response | First hours: [runbooks/suspected-data-leak.md](runbooks/suspected-data-leak.md). Notices and clocks: [runbooks/incident-notification.md](runbooks/incident-notification.md), with `scripts/ops/enumerate-affected.ts` (LEGAL-REQ-039). Sessions: [runbooks/sign-everyone-out.md](runbooks/sign-everyone-out.md) (not run). Account takeover: [runbooks/account-recovery.md](runbooks/account-recovery.md). Mail outage: [runbooks/sign-in-mail-stopped.md](runbooks/sign-in-mail-stopped.md) (not run). Founder away: [runbooks/founder-cannot-act.md](runbooks/founder-cannot-act.md). Reporting address in `docs/ops/well-known/security.txt`. No tabletop exercise is recorded | the runbooks named | R-10, R-11, R-18 |
| Training and awareness | Not built. No file read for this draft describes security training. The founder is the only person with access (ACCESS.md); agents get their rules from CLAUDE.md and chapter 06 | none | R-01 |

What this programme does not claim: no certification, no audit, no penetration test (the CISO skill section 6 says a real tester is needed before people outside the founding family store letters, if the founder funds it), and no statement that every staff access is logged (LEGAL-REQ-025 forbids that claim until its three conditions hold).

## 4. Assets with the highest stakes

From [DATA_CLASSIFICATION.md](../legal/DATA_CLASSIFICATION.md) and [SECURITY.md](SECURITY.md); the full list stays in those files.

| Asset | Level | Where | What protects it |
|---|---|---|---|
| Letter text, raw transcripts, the child's name and dates | L4 | Postgres (main project); the phone | RLS and its tests; the dashboard reads it (procedure only, R-05) |
| Recordings and photos | L4 | The phone; `entry-audio` and `entry-photos` buckets once used | Private buckets; backup off; client encryption by design |
| Service role or secret API key | Credential | Supabase; the founder's shell for `scripts/ops` | Platform store; never in the app (SECURITY.md rules) |
| `BACKUP_DB_URL` | Credential | Private repository secret | Narrow role; reads every family's letters (R-07) |
| Escrow private key | Credential | Escrow project secret and two sealed papers, once made | Custody rules in [BACKUP_RUNBOOK.md](BACKUP_RUNBOOK.md) section 4 (R-17) |
| Pack and config signing key | Credential | Password manager and one offline copy | [SECRETS.md](SECRETS.md); [PACKS_HOSTING.md](PACKS_HOSTING.md) |
| The founder's console accounts and password manager | Credential | Vendors | Two-factor (procedure, R-02) |

## 5. Review cadence

| When | What | Source |
|---|---|---|
| Yearly, and at launch readiness | This WISP is reviewed and the date written in section 8. First review: the CISO read. Not done | LEGAL-REQ-028 |
| Quarterly | Restore drill; `ops.audit_log` review; legal hold review; escrow seal check once a ceremony exists | [SECURITY.md](SECURITY.md) section 2.6; [BACKUP_RUNBOOK.md](BACKUP_RUNBOOK.md) section 3 |
| Quarterly | The risk register: every row re-scored, its next action checked | [RISK_REGISTER.md](RISK_REGISTER.md) |
| Monthly | Free backup restore drill from the founder's Mac | [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md) |
| Yearly | `PURGE_WORKER_SECRET`, Resend and PostHog keys, `TOKEN_KEK`, `OPS_HEALTH_TOKEN` | [SECURITY.md](SECURITY.md) sections 2.6 and 2.7 |
| Every 180 days | `BACKUP_DB_URL` password | [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md) |
| Before 2027-09-30 | Renew the `security.txt` Expires line | [SECURITY.md](SECURITY.md) section 2.6 |
| On change | A new console, secret class or role changes [ACCESS.md](ACCESS.md) in the same pull request; a new surface links a threat-model entry (SEC-R01) | [ACCESS.md](ACCESS.md); chapter 06 |

None of these has a recorded run date in the files read for this draft.

## 6. When this page changes

Change it in the same pull request as a new system, vendor, role or console, and add or close the matching row in [RISK_REGISTER.md](RISK_REGISTER.md). Point to the document that holds the detail; do not copy it here.

## 7. Questions for the CISO read

1. Path: keep these files in `docs/ops/` (BL-241) or move them to `docs/security/` (LEGAL-REQ-028, TDD 04)? Either way, the other place needs a pointer, and `docs/legal` is not edited by this draft.
2. Is the CISO role the right owner of record for LEGAL-REQ-028, given the founder holds every account?
3. Does the exec team accept this short form as meeting LEGAL-REQ-028's list, with the data map marked not built?
4. Which risks in the register need an exec-review acceptance before the first person outside the founding family signs in?

## 8. Review log

| Date | What | By (role) |
|---|---|---|
| 2026-11-27 | Draft written for BL-241 | engineer session (Claude) |
| | First review (LEGAL-REQ-028) | not done |
