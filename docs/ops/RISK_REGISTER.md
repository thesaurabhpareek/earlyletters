# Security risk register

Status: **DRAFT for the exec team's CISO read. Not approved. No risk here is accepted.** Written 27 Nov 2026 for BL-241 (LEGAL-REQ-028). Companion: [WISP.md](WISP.md). Nothing here was run against a hosted project, a vendor console or a phone.

Every risk comes from a file in this repository, named in its row. Where a fact may have changed since that file was written, the row says the file's date. The scores are the drafter's, for the CISO read to change.

How to read a row:
- **Likelihood (L)** and **Impact (I)**, 1 (low) to 5 (high). Score = L x I. Impact 5 means L4 content (letters, recordings, the child's details) reaches someone it should not, or a credential that opens them leaks.
- **Controls** say whether each is a test, a setting, or procedure (see WISP section 3). Procedure is not counted as a control.
- **Owner** is a role. **Next** is the next action and its backlog id or founder queue row, if one exists. "No BL id found" means none was found in `docs/BACKLOG.md` for this draft.
- **Review by**: 2027-02-27 for every row, proposed. That is quarterly, the cadence [SECURITY.md](SECURITY.md) section 2.6 sets for the other reviews. The CISO read sets the real dates.
- Accepting a residual risk is an exec-review decision (CR-176; `.claude/skills/early-letters-ciso/SKILL.md` section 4). Until one is recorded, every row is open.

## Summary

| Id | Risk | L | I | Score | Owner |
|---|---|---|---|---|---|
| R-01 | One person holds all access, with no named second person | 3 | 4 | 12 | Founder |
| R-02 | Console two-factor is a written rule with no read-back | 2 | 5 | 10 | Founder |
| R-03 | Sessions act as the founder, and connectors reach production | 3 | 5 | 15 | CISO |
| R-04 | Repository secrets are readable by every writer | 2 | 4 | 8 | Founder |
| R-05 | The dashboard can read every letter, and that access is not logged | 2 | 5 | 10 | Founder, `ops` |
| R-06 | Production backups on the Free plan are not proven to run | 3 | 5 | 15 | Founder, `ops` |
| R-07 | The backup database credential reads every family's letters | 2 | 5 | 10 | Founder |
| R-08 | The hosted schema may not match the tested one | 3 | 4 | 12 | `data-architect`, platform |
| R-09 | Security events are not recorded or alerted yet | 4 | 4 | 16 | `ops` |
| R-10 | The "sign everyone out" lever is unproven | 3 | 4 | 12 | `security` |
| R-11 | Kill switches are only partly wired | 3 | 3 | 9 | Platform, mobile engineer |
| R-12 | Supply chain checks are not all enforced | 3 | 4 | 12 | `security` |
| R-13 | There is no general threat model file | 3 | 3 | 9 | `security` |
| R-14 | The shared security review (R-17) has not passed | 3 | 4 | 12 | CISO |
| R-15 | Vendor contracts and at-rest encryption are not on file | 2 | 4 | 8 | Founder |
| R-16 | What Supabase logs about sign-in, and who reads it, is unknown | 3 | 3 | 9 | `ops`, CISO |
| R-17 | The escrow key opens recordings offline with no log | 1 | 5 | 5 | Founder |
| R-18 | Incident steps wait on counsel that does not exist | 3 | 4 | 12 | Exec team (CLO role) |
| R-19 | Sign-in mail can be spoofed until DMARC is enforced | 3 | 3 | 9 | Founder |

## The risks

### R-01 One person holds all access, with no named second person
- **What:** the founder is the only role with production access, holds every console and the password manager, and recovery is his alone. If he is away or loses his devices, nobody can rotate a key, stop a leak or keep a deletion promise.
- **Source:** [ACCESS.md](ACCESS.md) "Who holds production access today" and "Consoles"; [runbooks/founder-cannot-act.md](runbooks/founder-cannot-act.md) ("Second person: not named"); [06-security-engineering.md](../engineering/06-security-engineering.md) open question 4.
- **Controls:** the founder-cannot-act runbook (procedure); `packages/content/test/access-page.test.ts` keeps ACCESS.md and the Privacy Policy sentence in step (test, but it guards the claim, not the access).
- **Owner:** founder. **Next:** name a second person by role, after the Privacy Policy sentence changes (FR-BKO-18; a founder step outside BL-2102). No training exists for anyone (WISP section 3).
- **Review by:** 2027-02-27 (proposed).

### R-02 Console two-factor is a written rule with no read-back
- **What:** every console should have two-factor and offline recovery codes. No file records that this was checked. The recovery paths in ACCESS.md are marked UNVERIFIED. A taken-over Supabase or GitHub account reaches every letter or every secret.
- **Source:** [ACCESS.md](ACCESS.md) "Consoles"; [SECURITY.md](SECURITY.md) section 3; BL-106 (needs-founder, FT-02) in [BACKLOG.md](../BACKLOG.md); [TDD 04](../tdd/04-security-identity.md) section 8.8 gate "MFA evidence for every console (SEC-02)"; chapter 06 SEC-R25 ("Enforced by: not yet").
- **Controls:** procedure only.
- **Owner:** founder. **Next:** BL-106: record two-factor evidence per console, as names and dates only.
- **Review by:** 2027-02-27 (proposed).

### R-03 Sessions act as the founder, and connectors reach production
- **What:** every session posts through the founder's GitHub account, so no check can tell him from a session. Connectors are production credentials: the Supabase connector reaches every project in its organisation; Gmail reads the inbox that gets recovery mail.
- **Source:** `.claude/skills/early-letters-ciso/SKILL.md` sections 5 and 9a (read 31 Oct 2026); [SECRETS_REVIEW.md](../security/SECRETS_REVIEW.md) section 7 (SR-12).
- **Controls:** agent jobs may read only model and identity secrets, and production secrets live only in Environments (test, `scripts/ops/test/agent-env.test.ts`). Sessions doing support or data work hold no mail, Supabase or Vercel connector (procedure; [ACCESS.md](ACCESS.md) rule 4 says nothing in the repo can see connectors). The harness is off (D-127).
- **Owner:** CISO. **Next:** SEC-R26 (no write connectors on unattended runs) is proposed, not accepted (CISO skill section 11). No BL id found.
- **Review by:** 2027-02-27 (proposed).

### R-04 Repository secrets are readable by every writer
- **What:** anyone with write access, which includes every session, can read every repository-level secret. The `EXPO_TOKEN` reissue from a robot user was still pending at the last log entry.
- **Source:** [SECRETS_REVIEW.md](../security/SECRETS_REVIEW.md) sections 1 and 11 (log last updated 8 Nov 2026); [SECRETS.md](SECRETS.md) "Not verified here" (which secrets exist, and whether push protection is on, is unknown to sessions).
- **Controls:** the value scan `scripts/packs/secret-scan.mjs` in `npm test` (test, tracked tree only, not history); production secrets only in Environments (test for the workflow text; the Environment settings are procedure).
- **Owner:** founder. **Next:** the settings read-back in [SECRETS_REVIEW.md](../security/SECRETS_REVIEW.md) section 8, and the section 1 reissue. No BL id found.
- **Review by:** 2027-02-27 (proposed).

### R-05 The dashboard can read every letter, and that access is not logged
- **What:** "No staff tool shows entry text" is true of the tools we built, but the Supabase dashboard signed in as the founder can read any table. Database-level audit of dashboard and service-role sessions is not live, so the texts may not say that every access is logged.
- **Source:** [ACCESS.md](ACCESS.md) matrix, last column ("No. The dashboard role can read them. The rule is procedural"); LEGAL-REQ-025 in [ENGINEERING_REQUIREMENTS.md](../legal/ENGINEERING_REQUIREMENTS.md); [TDD 04](../tdd/04-security-identity.md) row 16 (SEC-10, pgaudit).
- **Controls:** ops scripts write an `ops.audit_log` row before reading anyone's data (built into the scripts, [SECURITY.md](SECURITY.md) section 1.4); runbooks (procedure); the quarterly `ops.audit_log` review (procedure, no run recorded).
- **Owner:** founder, `ops`. **Next:** SEC-10 pgaudit and reconciliation (TDD 04 row 16). No BL id found.
- **Review by:** 2027-02-27 (proposed).

### R-06 Production backups on the Free plan are not proven to run
- **What:** production runs on the Supabase Free plan, which has no automatic backups. The free nightly dump, keep-alive and limits check are written, but D-159 says whether they run is not verified, BL-566 is needs-founder, and the drill log in restore-drill.md has no row. Storage is not in the dump, so losing the project loses the purge ledger files, and up to 24 hours of deletions could come back after a restore. A paused or read-only project is an outage. Two documents still assume Pro backups: [SECURITY.md](SECURITY.md) section 4 ("Pro plan daily backups, 7 days") and [runbooks/suspected-data-leak.md](runbooks/suspected-data-leak.md) section 2 ("Database > Backups").
- **Source:** D-159 and D-138 in [DECISIONS.md](../DECISIONS.md); [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md); [runbooks/staging-backup-free.md](runbooks/staging-backup-free.md); [runbooks/restore-drill.md](runbooks/restore-drill.md); BL-566.
- **Controls:** the three workflows and `scripts/ops/restore-check.ts` (written; not shown to run); the monthly drill (procedure, none recorded).
- **Owner:** founder, `ops`. **Next:** BL-566 founder steps, then a first drill row. Bring SECURITY.md section 4 and suspected-data-leak.md section 2 in line with D-159 (no BL id found).
- **Review by:** 2027-02-27 (proposed).

### R-07 The backup database credential reads every family's letters
- **What:** `BACKUP_DB_URL` can read every family's letters, names, consent records and the consent pepper. It is not proven unable to help sign anyone in. Its set date and due date are not written down.
- **Source:** [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md) "The one database credential, and who shares it"; [SECRETS_REVIEW.md](../security/SECRETS_REVIEW.md) section 11 log (8 Nov 2026: dates "pending the founder").
- **Controls:** a narrowed read role, `docs/ops/backup/backup-role.sql`, tested by `supabase/tests/backup_role.test.mjs` (test); the secret lives only in the private repository (procedure); `alter role scribe_backup nologin` stops it (procedure).
- **Owner:** founder. **Next:** run `backup-role.sql` block 3 before relying on it; write the set and due dates (BL-566).
- **Review by:** 2027-02-27 (proposed).

### R-08 The hosted schema may not match the tested one
- **What:** CI proves the migrations in `supabase/migrations`, but `.github/migrations-applied.txt` records 2 of 54 files. Which migrations the hosted projects hold is not recorded, so an access rule tested in CI may not be live.
- **Source:** `.github/migrations-applied.txt`; [bl-583-migrations-record.md](proposed/bl-583-migrations-record.md); BL-583 (partly done); founder queue row FO-4 in [FOUNDER_QUEUE.md](../release/FOUNDER_QUEUE.md).
- **Controls:** `scripts/guards/migrations-record.mjs` and its test (test; the per-project lists are not filled); D-041 (migrations only from CI on a tag, procedure).
- **Owner:** `data-architect`, platform. **Next:** FO-4 read-back, then BL-583's per-project lists.
- **Review by:** 2027-02-27 (proposed).

### R-09 Security events are not recorded or alerted yet
- **What:** LEGAL-REQ-037 and -038 ask for content-free security events and alerts to the founder's phone. `ops.security_events` exists as a migration marked PENDING, and its sender and writers' call sites are not built. The outside purge watch waits on founder steps. The external uptime check and 5xx alert are not built. Supabase keeps logs 1 day on Free, so an incident found a day late has no Supabase logs.
- **Source:** `supabase/migrations/20261111010000_audit_writers_security_events.sql` header; LEGAL-REQ-037 and -038 in [ENGINEERING_REQUIREMENTS.md](../legal/ENGINEERING_REQUIREMENTS.md); BL-242 and BL-584 in [BACKLOG.md](../BACKLOG.md); FO-1 in [FOUNDER_QUEUE.md](../release/FOUNDER_QUEUE.md); [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md) "Free limits".
- **Controls:** purge-worker alert emails, at most one a day per condition (built, BL-242); `supabase/tests/audit_writers_security_events.test.mjs` for the migration (test, not applied).
- **Owner:** `ops`. **Next:** FO-1; BL-242 remainder; the sender for `security_events` (no BL id found).
- **Review by:** 2027-02-27 (proposed).

### R-10 The "sign everyone out" lever is unproven
- **What:** in a takeover, we may not be able to end every session fast. The runbook is NOT RUN. SECURITY.md 2.5 says revoking the signing key is not proven to sign anyone out, while BL-249 still says it does.
- **Source:** [runbooks/sign-everyone-out.md](runbooks/sign-everyone-out.md); [SECURITY.md](SECURITY.md) section 2.5; BL-597 (deferred) and BL-249 (deferred) in [BACKLOG.md](../BACKLOG.md); LEGAL-REQ-040.
- **Controls:** JWT expiry 900 seconds with refresh rotation (setting, to read back; SECURITY.md section 4); per-person sign-out in the dashboard (procedure).
- **Owner:** `security`. **Next:** BL-597 drills; correct the BL-249 line (no BL id found for that edit).
- **Review by:** 2027-02-27 (proposed).

### R-11 Kill switches are only partly wired
- **What:** LEGAL-REQ-040 asks for switches that act within 5 minutes. The app trusts no signed config until the founder's signing key ships, and nothing reads the `signIn` switch yet.
- **Source:** LEGAL-REQ-040; BL-022 (superseded by D-068, "the app trusts nothing until the founder's signing key ships (BL-335)") and BL-1197 (proposed) in [BACKLOG.md](../BACKLOG.md); [SECURITY.md](SECURITY.md) section 1.1 (`KILL_SWITCHES`, database settings for backup and escrow).
- **Controls:** server-side switches as function secrets and database settings (setting); backup and escrow off (setting).
- **Owner:** platform, mobile engineer. **Next:** BL-1197; BL-335; BL-1346 (proposed).
- **Review by:** 2027-02-27 (proposed).

### R-12 Supply chain checks are not all enforced
- **What:** chapter 06 lists the dependency audit (SEC-R08), Dependabot (SEC-R09) and full SHA pins (SEC-R10) as pending PR #30, with `agents.yml` unpinned. Chapter 06 was last reviewed 3 Oct 2026 and the CISO skill read on 31 Oct; the current state was not read for this draft.
- **Source:** [06-security-engineering.md](../engineering/06-security-engineering.md) SEC-R06 to SEC-R10; BL-2124 and BL-2125 (ready) in [BACKLOG.md](../BACKLOG.md); proposals [npm-audit.md](proposed/npm-audit.md), [osv-scan.md](proposed/osv-scan.md), [sha-pins.md](proposed/sha-pins.md).
- **Controls:** `npm ci` from a committed lockfile (CI, SEC-R06); the native module gate ([NATIVE_MODULE_GATE.md](../security/NATIVE_MODULE_GATE.md), procedure).
- **Owner:** `security`. **Next:** BL-2124, BL-2125.
- **Review by:** 2027-02-27 (proposed).

### R-13 There is no general threat model file
- **What:** SEC-R01 asks every new surface to link an entry in `docs/security/threat-model.md`. That file does not exist; only [MEDIA_THREAT_MODEL.md](../security/MEDIA_THREAT_MODEL.md) does. The CISO skill notes a draft in PR #342, and D-122 item 3 says design-level detail goes to a private repository.
- **Source:** chapter 06 SEC-R01 ("not yet"); `docs/security/` listing; `.claude/skills/early-letters-ciso/SKILL.md` section 9a; D-122 in [DECISIONS.md](../DECISIONS.md).
- **Controls:** review (procedure); TDD 04 section 2 is the baseline.
- **Owner:** `security`. **Next:** decide where the threat model lives (D-122), then BL-1509 and the rows it names. No BL id found for the file itself.
- **Review by:** 2027-02-27 (proposed).

### R-14 The shared security review (R-17) has not passed
- **What:** the shared R-17 reviewer and the final sign-off are pending, and the transaction-id timing channel (a co-parent can time the other parent's private letters while traffic is low) is an unsigned residual.
- **Source:** [REVIEW_R17_CHECKLIST.md](../security/REVIEW_R17_CHECKLIST.md) sections 9 and 10; D-100 in [DECISIONS.md](../DECISIONS.md) (server features "after the security gate").
- **Controls:** the access-review fixes and `npm run test:db` (test).
- **Owner:** CISO. **Next:** the shared review; an exec-review decision on the timing residual (CR-176). No BL id found.
- **Review by:** 2027-02-27 (proposed).

### R-15 Vendor contracts and at-rest encryption are not on file
- **What:** DPAs and retention evidence are needs-founder. Supabase encryption at rest is Unverified in writing. The subprocessor list is a draft. No vendor review procedure exists as a file.
- **Source:** BL-106 (FT-30) in [BACKLOG.md](../BACKLOG.md); LEGAL-REQ-022(c); [DATA_CLASSIFICATION.md](../legal/DATA_CLASSIFICATION.md) section 2 ("Supabase at rest Unverified"); [TDD 04](../tdd/04-security-identity.md) section 8.8 gate SEC-01; [subprocessors.md](../legal/subprocessors.md) (status draft-for-counsel).
- **Controls:** narrow vendor keys (Resend sending-only, PostHog `person:write` only; SECURITY.md section 3, setting).
- **Owner:** founder. **Next:** BL-106.
- **Review by:** 2027-02-27 (proposed).

### R-16 What Supabase logs about sign-in, and who reads it, is unknown
- **What:** the email-link sign-in sends a token hash in a query string to Supabase. Whether Supabase logs it, for how long, and who can read the logs, has not been read back.
- **Source:** [runbooks/supabase-logs-readback.md](runbooks/supabase-logs-readback.md) (NOT RUN); BL-603 (partly done); FO-2 in [FOUNDER_QUEUE.md](../release/FOUNDER_QUEUE.md).
- **Controls:** `apps/mobile/test/auth-token-in-url.test.ts` pins that no other app path puts a token in a query string (test); the token is single-use (FO-2 text).
- **Owner:** `ops`, CISO. **Next:** FO-2, then the evidence file in `docs/legal/evidence/`.
- **Review by:** 2027-02-27 (proposed).

### R-17 The escrow key opens recordings offline with no log
- **What:** anyone with the escrow private key, a copy of the main database and the bucket could open recordings offline, with no log row and no email. A superuser can also edit the access log. Today recording backup is off in every build profile, so no recording is on the server, which is why the likelihood is 1.
- **Source:** [BACKUP_RUNBOOK.md](BACKUP_RUNBOOK.md) section 1 ("The honest limit") and section 4; `apps/mobile/eas.json` (`EXPO_PUBLIC_BACKUP` off in every profile).
- **Controls:** custody rules and the quarterly seal check (procedure); the separate escrow project and its isolation check (procedure, not set up); the daily ledger copy (built in the purge worker).
- **Owner:** founder. **Next:** re-score before backup is turned on. Do not turn it on while production is on Free ([runbooks/free-tier-ops.md](runbooks/free-tier-ops.md)).
- **Review by:** 2027-02-27 (proposed).

### R-18 Incident steps wait on counsel that does not exist
- **What:** the incident runbooks say counsel approves every notice and decides which breach clocks apply. Under D-172 there is no outside counsel; the exec team's review is not legal advice. The CISO skill names a 30-day California notice clock, and the FTC rule's 60 days if it applies. Engaging a lawyer is the founder's decision.
- **Source:** [runbooks/incident-notification.md](runbooks/incident-notification.md); [runbooks/suspected-data-leak.md](runbooks/suspected-data-leak.md) section 4; D-172 in [DECISIONS.md](../DECISIONS.md); [runbooks/child-safety-report.md](runbooks/child-safety-report.md); `.claude/skills/early-letters-ciso/SKILL.md` section 9b.
- **Controls:** `scripts/ops/enumerate-affected.ts` prints the clocks and the affected counts (built; its tabletop test on staging is not recorded). No tabletop exercise is recorded.
- **Owner:** exec team (CLO role). **Next:** a tabletop on staging with the Asha fixtures (LEGAL-REQ-039 acceptance); the lawyer question (CLO-46). No BL id found.
- **Review by:** 2027-02-27 (proposed).

### R-19 Sign-in mail can be spoofed until DMARC is enforced
- **What:** the setup record of 1 Nov showed DMARC at `p=none` on the sending domain. Someone could send mail that looks like a sign-in code from us. The live mail check blocks the store cut.
- **Source:** FO-3 in [FOUNDER_QUEUE.md](../release/FOUNDER_QUEUE.md); [MAIL-PREFLIGHT.md](MAIL-PREFLIGHT.md); [DOMAINS.md](DOMAINS.md); chapter 06 SEC-R22 ("not yet").
- **Controls:** `scripts/release/mail-preflight.mjs` (a check the founder runs; it proved nothing from an agent session on 24 Nov).
- **Owner:** founder. **Next:** FO-3 (BL-2173); DMARC moves up after two weeks of clean reports.
- **Review by:** 2027-02-27 (proposed).

## Not on this register

- Product access rules (RLS, invites, co-parent visibility): tested in `supabase/tests`; residuals are in R-14.
- Media on the phone: [MEDIA_THREAT_MODEL.md](../security/MEDIA_THREAT_MODEL.md) holds its own rows.
- Privacy promises that cannot be kept by hand today (for example deletion by email, BL-551): [runbooks/data-requests-by-email.md](runbooks/data-requests-by-email.md) section 9. They are compliance risks, not security risks, and belong to `privacy`.

## Change log

| Date | Change | By (role) |
|---|---|---|
| 2026-11-27 | Draft, R-01 to R-19, for BL-241 | engineer session (Claude) |
