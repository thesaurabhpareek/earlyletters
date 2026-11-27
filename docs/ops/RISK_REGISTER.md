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
| R-01 | One person holds all access, with no named second person | 3 | 4 | 12 | CISO (decision); founder (physical step) |
| R-02 | Console two-factor is a written rule with no read-back | 2 | 5 | 10 | CISO (decision); founder (physical step) |
| R-03 | Sessions act as the founder, and connectors reach production | 3 | 5 | 15 | CISO |
| R-04 | Repository secrets are readable by every writer | 2 | 4 | 8 | CISO (decision); founder (physical step) |
| R-05 | The dashboard can read every letter, and that access is not logged | 2 | 5 | 10 | `ops`; CISO (decision); founder (physical step) |
| R-06 | Production backups on the Free plan are not proven to run | 3 | 5 | 15 | `ops`; CISO (decision); founder (physical step) |
| R-07 | The backup database credential reads every family's letters | 2 | 5 | 10 | CISO (decision); founder (physical step) |
| R-08 | The hosted schema may not match the tested one | 3 | 4 | 12 | `data-architect`, platform |
| R-09 | Security events are not recorded or alerted yet | 4 | 4 | 16 | `ops` |
| R-10 | The "sign everyone out" lever is unproven | 3 | 4 | 12 | `security` |
| R-11 | Kill switches are wired but not proven to act within 5 minutes | 2 | 3 | 6 | Platform, mobile engineer |
| R-12 | Supply chain checks are not all enforced | 3 | 4 | 12 | `security` |
| R-13 | There is no general threat model file | 3 | 3 | 9 | `security` |
| R-14 | The shared security review (R-17) has not passed | 3 | 4 | 12 | CISO |
| R-15 | Vendor contracts and at-rest encryption are not on file | 2 | 4 | 8 | CISO (decision); founder (physical step) |
| R-16 | What Supabase logs about sign-in, and who reads it, is unknown | 3 | 3 | 9 | `ops`, CISO |
| R-17 | The escrow key opens recordings offline with no log | 1 | 5 | 5 | CISO (decision); founder (physical step) |
| R-18 | Incident steps wait on counsel that does not exist | 3 | 4 | 12 | Exec team (CLO role) |
| R-19 | Sign-in mail can be spoofed until DMARC is enforced | 3 | 3 | 9 | CISO (decision); founder (physical step) |
| R-20 | The founder's computer is lost or compromised | 2 | 5 | 10 | CISO (decision); founder (physical step) |
| R-21 | A session misled by untrusted public text changes and merges code with no human step | 2 | 5 | 10 | CISO, with CTO |

## The risks

### R-01 One person holds all access, with no named second person
- **What:** the founder is the only role with production access, holds every console and the password manager, and recovery is his alone. If he is away or loses his devices, nobody can rotate a key, stop a leak or keep a deletion promise.
- **Source:** [ACCESS.md](ACCESS.md) "Who holds production access today" and "Consoles"; [runbooks/founder-cannot-act.md](runbooks/founder-cannot-act.md) ("Second person: not named"); [06-security-engineering.md](../engineering/06-security-engineering.md) open question 4.
- **Controls:** the founder-cannot-act runbook (procedure); `packages/content/test/access-page.test.ts` keeps ACCESS.md and the Privacy Policy sentence in step (test, but it guards the claim, not the access).
- **Owner:** CISO (decision); founder (physical step). **Next:** name a second person by role, after the Privacy Policy sentence changes (FR-BKO-18; a founder step outside BL-2102). No training exists for anyone (WISP section 3).
- **Review by:** 2027-02-27 (proposed).

### R-02 Console two-factor is a written rule with no read-back
- **What:** every console should have two-factor and offline recovery codes. No file records that this was checked. The recovery paths in ACCESS.md are marked UNVERIFIED. A taken-over Supabase or GitHub account reaches every letter or every secret.
- **Source:** [ACCESS.md](ACCESS.md) "Consoles"; [SECURITY.md](SECURITY.md) section 3; BL-106 (needs-founder, FT-02) in [BACKLOG.md](../BACKLOG.md); [TDD 04](../tdd/04-security-identity.md) section 8.8 gate "MFA evidence for every console (SEC-02)"; chapter 06 SEC-R25 ("Enforced by: not yet").
- **Controls:** procedure only.
- **Owner:** CISO (decision); founder (physical step). **Next:** BL-106: record two-factor evidence per console, as names and dates only.
- **Review by:** 2027-02-27 (proposed).

### R-03 Sessions act as the founder, and connectors reach production
- **What:** every session posts through the founder's GitHub account, so no check can tell him from a session. Connectors are production credentials: the Supabase connector reaches every project in its organisation; Gmail reads the inbox that gets recovery mail.
- **Source:** `.claude/skills/early-letters-ciso/SKILL.md` sections 5 and 9a (read 31 Oct 2026); [SECRETS_REVIEW.md](../security/SECRETS_REVIEW.md) section 7 (SR-12).
- **Controls:** agent jobs may read only model and identity secrets (test, `scripts/ops/test/agent-env.test.ts`); production secrets only in Environments (test for the workflow text; the Environment settings are procedure). [ACCESS.md](ACCESS.md) rule 3 says the scan proves only that a workflow names an environment: a `secrets.X` reference still falls back to a repository secret of the same name, and whether each production secret exists only at Environment level, with reviewers, is procedure. [SECRETS.md](SECRETS.md) "Not verified here" says which secrets exist is not known. Sessions doing support or data work hold no mail, Supabase or Vercel connector (procedure; ACCESS.md rule 4 says nothing in the repo can see connectors). The harness is off (D-127).
- **Owner:** CISO. **Next:** SEC-R26 (no write connectors on unattended runs) is proposed, not accepted (CISO skill section 11). No BL id found. A session that changes and merges code after reading untrusted text is R-21.
- **Review by:** 2027-02-27 (proposed).

### R-04 Repository secrets are readable by every writer
- **What:** anyone with write access, which includes every session, can read every repository-level secret. The `EXPO_TOKEN` reissue from a robot user was still pending at the last log entry.
- **Source:** [SECRETS_REVIEW.md](../security/SECRETS_REVIEW.md) sections 1 and 11 (log last updated 8 Nov 2026); [SECRETS.md](SECRETS.md) "Not verified here" (which secrets exist, and whether push protection is on, is unknown to sessions).
- **Controls:** the value scan `scripts/packs/secret-scan.mjs` in `npm test` (test, tracked tree only, not history); production secrets only in Environments (test for the workflow text; the Environment settings are procedure).
- **Owner:** CISO (decision); founder (physical step). **Next:** the settings read-back in [SECRETS_REVIEW.md](../security/SECRETS_REVIEW.md) section 8, and the section 1 reissue. No BL id found.
- **Review by:** 2027-02-27 (proposed).

### R-05 The dashboard can read every letter, and that access is not logged
- **What:** "No staff tool shows entry text" is true of the tools we built, but the Supabase dashboard signed in as the founder can read any table. Database-level audit of dashboard and service-role sessions is not live, so the texts may not say that every access is logged.
- **Source:** [ACCESS.md](ACCESS.md) matrix, last column ("No. The dashboard role can read them. The rule is procedural"); LEGAL-REQ-025 in [ENGINEERING_REQUIREMENTS.md](../legal/ENGINEERING_REQUIREMENTS.md); [TDD 04](../tdd/04-security-identity.md) row 16 (SEC-10, pgaudit).
- **Controls:** ops scripts write an `ops.audit_log` row before reading anyone's data (built into the scripts, [SECURITY.md](SECURITY.md) section 1.4); runbooks (procedure); the quarterly `ops.audit_log` review (procedure, no run recorded).
- **Owner:** `ops`; CISO (decision); founder (physical step). **Next:** SEC-10 pgaudit and reconciliation (TDD 04 row 16). No BL id found.
- **Review by:** 2027-02-27 (proposed).

### R-06 Production backups on the Free plan are not proven to run
- **What:** production runs on the Supabase Free plan, which has no automatic backups. The free nightly dump, keep-alive and limits check are written, but D-159 says whether they run is not verified, BL-566 is needs-founder, and the drill log in restore-drill.md has no row. Storage is not in the dump, so losing the project loses the purge ledger files, and up to 24 hours of deletions could come back after a restore. A paused or read-only project is an outage. Two documents still assume Pro backups: [SECURITY.md](SECURITY.md) section 4 ("Pro plan daily backups, 7 days") and [runbooks/suspected-data-leak.md](runbooks/suspected-data-leak.md) section 2 ("Database > Backups").
- **Source:** D-159 and D-138 in [DECISIONS.md](../DECISIONS.md); [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md); [runbooks/staging-backup-free.md](runbooks/staging-backup-free.md); [runbooks/restore-drill.md](runbooks/restore-drill.md); BL-566.
- **Controls:** the three workflows and `scripts/ops/restore-check.ts` (written; not shown to run); the monthly drill (procedure, none recorded).
- **Owner:** `ops`; CISO (decision); founder (physical step). **Next:** BL-566 founder steps, then a first drill row. Bring SECURITY.md section 4 and suspected-data-leak.md section 2 in line with D-159 (no BL id found).
- **Review by:** 2027-02-27 (proposed).

### R-07 The backup database credential reads every family's letters
- **What:** `BACKUP_DB_URL` can read every family's letters, names, consent records and the consent pepper. It is not proven unable to help sign anyone in. Its set date and due date are not written down.
- **Source:** [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md) "The one database credential, and who shares it"; [SECRETS_REVIEW.md](../security/SECRETS_REVIEW.md) section 11 log (8 Nov 2026: dates "pending the founder").
- **Controls:** a narrowed read role, `docs/ops/backup/backup-role.sql`, tested by `supabase/tests/backup_role.test.mjs` (test); the secret lives only in the private repository (procedure); `alter role scribe_backup nologin` stops it (procedure).
- **Owner:** CISO (decision); founder (physical step). **Next:** run `backup-role.sql` block 3 before relying on it; write the set and due dates (BL-566).
- **Review by:** 2027-02-27 (proposed).

### R-08 The hosted schema may not match the tested one
- **What:** CI proves the migrations in `supabase/migrations`, but `.github/migrations-applied.txt` records 2 of 54 files. Which migrations the hosted projects hold is not recorded, so an access rule tested in CI may not be live.
- **Source:** `.github/migrations-applied.txt`; [bl-583-migrations-record.md](proposed/bl-583-migrations-record.md); BL-583 (partly done); founder queue row FO-4 in [FOUNDER_QUEUE.md](../release/FOUNDER_QUEUE.md).
- **Controls:** `scripts/guards/migrations-record.mjs` and its test (test; the per-project lists are not filled); D-041 (migrations only from CI on a tag, procedure).
- **Owner:** `data-architect`, platform. **Next:** FO-4 read-back, then BL-583's per-project lists.
- **Review by:** 2027-02-27 (proposed).

### R-09 Security events are not recorded or alerted yet
- **What:** LEGAL-REQ-037 and -038 ask for content-free security events and alerts to the founder's phone. `ops.security_events` exists as a migration marked PENDING. One writer is built: `supabase/functions/new-device-email/handler.ts` calls `ops_security_event_write`, and it does nothing unless the `NEW_DEVICE_EMAIL` flag is `on` (its header: dark, takes nothing, unless the flag is on). The sender, the scheduled read of `ops_security_events_check()` that emails the founder, is not built: no file outside the migration and its tests calls it. The outside purge watch waits on founder steps. The external uptime check and 5xx alert are not built. Supabase keeps logs 1 day on Free, so an incident found a day late has no Supabase logs.
- **Source:** `supabase/migrations/20261111010000_audit_writers_security_events.sql` header; `supabase/functions/new-device-email/handler.ts` and `index.ts`; LEGAL-REQ-037 and -038 in [ENGINEERING_REQUIREMENTS.md](../legal/ENGINEERING_REQUIREMENTS.md); BL-242 and BL-584 in [BACKLOG.md](../BACKLOG.md); FO-1 in [FOUNDER_QUEUE.md](../release/FOUNDER_QUEUE.md); [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md) "Free limits".
- **Controls:** purge-worker alert emails, at most one a day per condition (built, BL-242); `supabase/tests/audit_writers_security_events.test.mjs` for the migration (test, not applied); `supabase/functions/new-device-email/test/handler.test.ts` for the one writer (test; the function is off).
- **Owner:** `ops`. **Next:** FO-1; BL-242 remainder; the sender for `security_events` (no BL id found).
- **Review by:** 2027-02-27 (proposed).

### R-10 The "sign everyone out" lever is unproven
- **What:** in a takeover, we may not be able to end every session fast. The app now acts on `forceReauthEpoch`: `apps/mobile/src/lib/auth/reauth.logic.ts` decides, and `apps/mobile/src/lib/auth/session-provider.tsx` signs a signed-in phone out once per raised number, after its queued letters are up (PR #657). That is built, not drilled: drills D1 to D4 in the runbook are NOT RUN. The app's sign-out is local, so on its own it does not revoke a refresh token copied off the phone (runbook section 1). SECURITY.md 2.5 says revoking the signing key is not proven to sign anyone out, while BL-249 still says it does. BL-597's problem line and LEGAL-REQ-040 still say nothing in the app reads `forceReauthEpoch`; both are older than PR #657.
- **Source:** [runbooks/sign-everyone-out.md](runbooks/sign-everyone-out.md) sections 1, 2 and 5; `apps/mobile/src/lib/auth/reauth.logic.ts`; `apps/mobile/src/lib/auth/session-provider.tsx`; [SECURITY.md](SECURITY.md) section 2.5; BL-597 (deferred) and BL-249 (deferred) in [BACKLOG.md](../BACKLOG.md); LEGAL-REQ-040.
- **Controls:** the app's `forceReauthEpoch` reader (built; unit tested, no device drill); JWT expiry 900 seconds with refresh rotation (setting, to read back; SECURITY.md section 4); per-person sign-out in the dashboard (procedure).
- **Owner:** `security`. **Next:** BL-597 drills; correct the BL-249 line (no BL id found for that edit).
- **Review by:** 2027-02-27 (proposed).

### R-11 Kill switches are wired but not proven to act within 5 minutes
- **What:** LEGAL-REQ-040 asks for remote, audited switches to sign everyone out, pause sync and pause pack downloads, and in v1.0 also `backupUploads`, `escrow` and `statusReport`, each shown in staging to act within 5 minutes with local features still working offline (its acceptance line; "Test: automated"); and a way to rotate the escrow key. The wiring is in place: the app trusts two signing keys for remote config (`TRUSTED_SIGNING_KEYS` in `packages/api/src/keys.ts`, `el-2026-11` and `el-2026-11-backup`, PR #512; BL-335 is done), and it reads `sync` (`apps/mobile/src/lib/sync/index.ts`), `packDownloads` (`apps/mobile/src/lib/packs/index.ts`), `forceReauthEpoch` (R-10), and `backupUploads`, `escrow` and `statusReport` through `KILL_SWITCH_FLAG` in `apps/mobile/src/lib/capabilities.ts`. The `signIn` switch is read too: FP-6 (#1243) added `apps/mobile/src/lib/first-run/sign-in-pause.ts`, which reads `killSwitches.signIn === true`, and `use-first-run-route.ts` uses it, so BL-1197's "nothing reads" title is out of date. The audit is git history of the published config (`scripts/packs/publish.ts`). What is still missing from LEGAL-REQ-040: no switch has been shown in staging to act within 5 minutes, and no automated test does it (drill D1 in [runbooks/sign-everyone-out.md](runbooks/sign-everyone-out.md) is NOT RUN, and [ENVIRONMENTS.md](../release/ENVIRONMENTS.md) says staging is not created yet); BL-335's own residue, the live host check per [PACKS_HOSTING.md](PACKS_HOSTING.md), is open; escrow key rotation waits on an escrow project that is not set up ([BACKUP_RUNBOOK.md](BACKUP_RUNBOOK.md) section 1).
- **Source:** LEGAL-REQ-040 in [ENGINEERING_REQUIREMENTS.md](../legal/ENGINEERING_REQUIREMENTS.md); `packages/api/src/keys.ts`; `packages/api/src/kill-switches.ts`; the app files named above; BL-335 (done), BL-1197 (proposed) and BL-1346 (proposed) in [BACKLOG.md](../BACKLOG.md); [SECURITY.md](SECURITY.md) section 1.1 (`KILL_SWITCHES`, database settings for backup and escrow); [RELEASE.md](RELEASE.md) (a switch reaches an open app in about 5 minutes, ADR 0016 6, not measured).
- **Controls:** signature check on the remote config with two trusted keys (built); the app readers above, each fail-open or fail-closed as its file says (built, unit tested); server-side switches as function secrets and database settings (setting); backup and escrow off (setting).
- **Re-scored from 3 x 3 = 9 to 2 x 3 = 6:** the reason for likelihood 3 was that the app trusted no signed config and did not read `signIn`. Both are fixed. What is left is proof of timing in staging, not wiring, so the chance that a switch is missing when needed is lower. Impact is unchanged.
- **Owner:** platform, mobile engineer. **Next:** drill D1 and one flip per switch on staging once it exists, with the times written down; BL-1346 (proposed, "every kill switch has a test in its off state"); mark BL-1197 done (no BL id found for that edit).
- **Review by:** 2027-02-27 (proposed).

### R-12 Supply chain checks are not all enforced
- **What:** chapter 06 lists the dependency audit (SEC-R08), Dependabot (SEC-R09) and full SHA pins (SEC-R10) as pending PR #30, with `agents.yml` unpinned. That text is older than the workflows. Read on 27 Nov with `grep -rn "uses:" .github/workflows .github/actions`: every third-party action is pinned to a full 40-character SHA with the version in a comment, `agents.yml` included, so SEC-R10's pin rule is met in practice. SEC-R10's other parts are not all met: 10 jobs still run on `ubuntu-latest` rather than a fixed image, and checksum checks on downloaded binaries were not read. SEC-R08 and SEC-R09 are still pending: `.github/workflows/security.yml`, `.github/dependabot.yml` and `.github/audit-ignore.json` do not exist (only the proposal `docs/ops/proposed/audit-ignore.json` does).
- **Source:** [06-security-engineering.md](../engineering/06-security-engineering.md) SEC-R06 to SEC-R10; the `uses:` and `runs-on:` lines in `.github/workflows/`; BL-2124 and BL-2125 (ready) in [BACKLOG.md](../BACKLOG.md); proposals [npm-audit.md](proposed/npm-audit.md), [osv-scan.md](proposed/osv-scan.md), [sha-pins.md](proposed/sha-pins.md).
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
- **Source:** [REVIEW_R17_CHECKLIST.md](../security/REVIEW_R17_CHECKLIST.md) sections 9 and 10; D-100 in [DECISIONS.md](../DECISIONS.md) (server features "after the security gate"); D-170 in the same file (23 Nov 2026: servers, account creation and sign-in on in every profile that ships to people). `apps/mobile/eas.json` has `EXPO_PUBLIC_SERVER_FEATURES` `on` in `production` and `preview` today (`testflight` stays `off` until BL-1887). So the builds that would carry the residual are configured, while the review D-100 put first has not passed. D-170 does not say the R-17 review is waived, and the CISO skill section 9a says nobody outside the founding family signs in before it passes.
- **Controls:** the access-review fixes and `npm run test:db` (test).
- **Owner:** CISO. **Next:** the shared review; an exec-review decision on the timing residual (CR-176). No BL id found.
- **Review by:** 2027-02-27 (proposed).

### R-15 Vendor contracts and at-rest encryption are not on file
- **What:** DPAs and retention evidence are needs-founder. Supabase encryption at rest is Unverified in writing. The subprocessor list is a draft. No vendor review procedure exists as a file.
- **Source:** BL-106 (FT-30) in [BACKLOG.md](../BACKLOG.md); LEGAL-REQ-022(c); [DATA_CLASSIFICATION.md](../legal/DATA_CLASSIFICATION.md) section 2 ("Supabase at rest Unverified"); [TDD 04](../tdd/04-security-identity.md) section 8.8 gate SEC-01; [subprocessors.md](../legal/subprocessors.md) (status draft-for-counsel).
- **Controls:** narrow vendor keys (Resend sending-only, PostHog `person:write` only; SECURITY.md section 3, setting).
- **Owner:** CISO (decision); founder (physical step). **Next:** BL-106.
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
- **Owner:** CISO (decision); founder (physical step). **Next:** re-score before backup is turned on. Do not turn it on while production is on Free ([runbooks/free-tier-ops.md](runbooks/free-tier-ops.md)).
- **Review by:** 2027-02-27 (proposed).

### R-18 Incident steps wait on counsel that does not exist
- **What:** the incident runbooks say counsel approves every notice and decides which breach clocks apply. Under D-172 there is no outside counsel; the exec team's review is not legal advice. The CISO skill names a 30-day California notice clock, and the FTC rule's 60 days if it applies. Engaging a lawyer is the founder's decision.
- **Source:** [runbooks/incident-notification.md](runbooks/incident-notification.md); [runbooks/suspected-data-leak.md](runbooks/suspected-data-leak.md) section 4; D-172 in [DECISIONS.md](../DECISIONS.md); [runbooks/child-safety-report.md](runbooks/child-safety-report.md); `.claude/skills/early-letters-ciso/SKILL.md` section 9b.
- **Controls:** `scripts/ops/enumerate-affected.ts` prints the clocks and the affected counts (built; its tabletop test on staging is not recorded). No tabletop exercise is recorded.
- **Owner:** exec team (CLO role). **Next:** the LEGAL-REQ-039 tabletop, whose acceptance line runs the script against fixtures on staging. While staging holds the founder's family's real letters, [ENVIRONMENTS.md](../release/ENVIRONMENTS.md) "Staging during the alpha" bans fixture seeding there and says such work waits for a second, synthetic staging; so the tabletop runs on that second staging, or on a local database with the Asha fixtures until one exists. The question of engaging a lawyer for breach notices: no id was found. (CLO-46 in `docs/agents/exec/RULINGS.md` is about abuse-material reports only. The questions for a lawyer once engaged are COUNSEL_PACKET Q28, breach readiness and the FTC rule, and register CR-030, as `docs/legal/COUNSEL_PACKET.md` and the incident-notification runbook cite them.) No BL id found.
- **Review by:** 2027-02-27 (proposed).

### R-19 Sign-in mail can be spoofed until DMARC is enforced
- **What:** the setup record of 1 Nov showed DMARC at `p=none` on the sending domain. Someone could send mail that looks like a sign-in code from us. The live mail check blocks the store cut.
- **Source:** FO-3 in [FOUNDER_QUEUE.md](../release/FOUNDER_QUEUE.md); [MAIL-PREFLIGHT.md](MAIL-PREFLIGHT.md); [DOMAINS.md](DOMAINS.md); chapter 06 SEC-R22 ("not yet").
- **Controls:** `scripts/release/mail-preflight.mjs` (a check the founder runs; it proved nothing from an agent session on 24 Nov).
- **Owner:** CISO (decision); founder (physical step). **Next:** FO-3 (BL-2173); DMARC moves up after two weeks of clean reports.
- **Review by:** 2027-02-27 (proposed).

### R-20 The founder's computer is lost or compromised
- **What:** one computer holds keys that open every family's letters. [runbooks/free-tier-ops.md](runbooks/free-tier-ops.md) "Founder steps" step 1 makes the age private key that decrypts the nightly production dumps at `~/.config/earlyletters/backup-key.txt`, and its monthly restore drill decrypts a full production dump onto that Mac. [SECURITY.md](SECURITY.md) section 1.4 has the founder export `SUPABASE_SERVICE_ROLE_KEY` and, for the restore drill, `PROD_SERVICE_ROLE_KEY` in a shell on the same machine. [SECRETS.md](SECRETS.md) keeps the R2 secret key (`PACKS_S3_SECRET_ACCESS_KEY`) under `~/.config/early-letters/` as well as in the password manager. A stolen or infected computer could therefore give someone the dumps' key, a live service-role key and the pack host's write key at once. [SECRETS_REVIEW.md](../security/SECRETS_REVIEW.md) section 4.2b says to rotate the backup key "after any laptop loss", which assumes a loss is noticed. [TDD 04](../tdd/04-security-identity.md) adversary A5 lists "service-role key never on laptops" as a mitigation, which conflicts with SECURITY.md section 1.4. No file found records disk encryption, a screen lock or any device baseline for that computer (searched `docs/` and `.claude/skills/` for FileVault and disk encryption).
- **Source:** the four files above; TDD 04 section 2.2 row A5; [ACCESS.md](ACCESS.md) "Consoles" (the password manager holds every credential); the CISO skill section 8 (CIS Controls IG1 is the baseline "for the founder's own accounts and laptop").
- **Controls:** procedure only. Delete the decrypted drill copy the same day (free-tier-ops.md, restore-drill step 8); export service keys for one shell session only, never in a dotfile in the repo (SECURITY.md 1.4); rotate the backup key after a loss (SECRETS_REVIEW.md). Disk encryption: not recorded anywhere.
- **Owner:** CISO (decision); founder (physical step). **Next:** record a device baseline for that computer as names and dates only (disk encryption on, screen lock, OS updates, where each key file lives), in the shape BL-106 uses for console two-factor; settle the conflict between TDD 04 A5 and SECURITY.md 1.4 (keep the key off the computer and run `scripts/ops` elsewhere, or change A5 and record why). No BL id found.
- **Review by:** 2027-02-27 (proposed).

### R-21 A session misled by untrusted public text changes and merges code with no human step
- **What:** the repository is public, so issues, PR text, comments and fetched pages are untrusted. A session that reads such text can change code, open a PR and, under CR-73, a Karma session merges it into `develop`. GitHub requires no approving review on `develop`: [COORDINATION.md](../agents/COORDINATION.md) section 11, read live 20 Nov 2026, says approving reviews required is 0 and the only enforced gates are three required checks (`required`, `compliance-fence`, `applied migrations unchanged`), set on 31 Oct (CR-32). CR-20 explains why approvals stay at 0: every session posts as the founder's account, and GitHub does not let an author approve their own PR. The two counted reviews are a written rule (CR-70, CR-73), posted from the same account that merges, so they are independent in method, not identity (CR-73 "Honest limit"). A merge into `develop` runs `deploy-functions.yml` with staging secrets, and CR-73 says whether that Environment has a reviewer is unverified. Chapter 06's principle "untrusted text is data" and SEC-R21 (stop and report text asking to change permissions, secrets, labels or rules) are rules, not checks; `claude.yml`'s `author_association == 'OWNER'` filter cannot tell a session from the founder (CR-20). SEC-R12 (branch protection) is still marked "Enforced by: not yet" in chapter 06. The CISO skill section 9a records the draft threat model's tooling row T9, "merges with no human step", and section 8 the lethal trifecta: a session with private-data access, untrusted content and a way to communicate can be made to leak.
- **Source:** [06-security-engineering.md](../engineering/06-security-engineering.md) Principles ("Agents are untrusted users with a job"), SEC-R12, SEC-R19 to SEC-R21; CR-20, CR-32 and CR-73 in `docs/agents/cto/RULINGS.md`; COORDINATION.md section 11; `.claude/skills/early-letters-ciso/SKILL.md` sections 8 and 9a; `.github/workflows/deploy-functions.yml` (push to `develop`, `environment: staging`).
- **Controls:** the three required checks (setting, as read on 20 Nov 2026 in COORDINATION.md section 11; re-read before relying on it); the two counted reviews and the security-lens condition (procedure, CR-73); `scripts/agents/merge-queue.mjs` reads the review lines (built, but it reads comments from the same account); the `staging` Environment reviewer on `deploy-db.yml` (setting, not read back here).
- **Owner:** CISO, with CTO. **Next:** read back the `staging` Environment's reviewer for `deploy-functions.yml` (CR-73 says unverified); decide with the CTO whether a merge that touches `supabase/functions/**` or `.github/**` waits for an Environment reviewer; revisit with the CR-20 machine-account question. No BL id found.
- **Review by:** 2027-02-27 (proposed).

## Not on this register

- Product access rules (RLS, invites, co-parent visibility): tested in `supabase/tests`; residuals are in R-14.
- Media on the phone: [MEDIA_THREAT_MODEL.md](../security/MEDIA_THREAT_MODEL.md) holds its own rows.
- Privacy promises that cannot be kept by hand today (for example deletion by email, BL-551): [runbooks/data-requests-by-email.md](runbooks/data-requests-by-email.md) section 9. They are compliance risks, not security risks, and belong to `privacy`. One deletion risk stays here: deletions can come back after a restore, because the purge ledger files are in Storage, which the nightly dump does not hold (R-06).

## Change log

| Date | Change | By (role) |
|---|---|---|
| 2026-11-27 | Draft, R-01 to R-19, for BL-241 | engineer session (Claude) |
| 2026-11-27 | Review fixes: R-11 re-scored (BL-335 and the `signIn` reader done); R-03 and R-04 controls marked procedure where they are; R-09, R-10, R-12, R-14, R-18 brought up to date; owners split into decision and physical step; R-20 (the founder's computer) and R-21 (agent merges) added | engineer session (Claude) |
