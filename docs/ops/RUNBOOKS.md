# Runbooks

Owner: founder. Written 3 Oct 2026. Every live step here is done by the founder or by CI behind an approval; agents prepare pull requests and drafts only. Environment names and secret names: [ENVIRONMENTS.md](ENVIRONMENTS.md), [SECRETS.md](SECRETS.md). Severity and communication: [INCIDENT.md](INCIDENT.md).

Numbers RB-2, RB-6 and RB-7 are reserved for runbooks not written yet.

Marked **Planned** where the tool a step relies on does not exist yet. Marked **Unverified** where a platform detail was not confirmed against current docs.

---

## RB-0 Bootstrap a new environment

For `scribe-staging` first, then `scribe-prod`. About two hours each.

1. **Organisation.** Supabase dashboard: create the "Early Letters" organisation (not created yet). Turn on MFA enforcement for the organisation if the plan offers it (**Unverified** plan availability). Check the free plan's project limit before creating two projects.
2. **Project.** Create `scribe-staging` (or `scribe-prod`) in the one US region chosen for production (brief decision 17; TDD 02 recommends `us-west-1`). Generate the database password in the password manager.
3. **Plan and backups.** Production on Pro is the recommendation (founder decision). Pro keeps 7 days of daily backups; PITR is a paid add-on that also needs at least the Small compute add-on; Storage objects are not in database backups (Supabase backups docs, read 3 Oct 2026).
4. **Schema from CI, not by hand.** Add the project's connection string as `SUPABASE_DB_URL` in the matching GitHub Environment ([SECRETS.md](SECRETS.md)). Apply every migration from an empty database through RB-1. Do not copy schema from the old development project.
5. **Database settings.** Apply the per-project settings in `supabase/APPLY.md` (step 6 consent pepper; step 11 environment settings, where still relevant after brief decision 3). A new pepper per project; never reuse one.
6. **Scheduled jobs.** Enable Cron and schedule the purge job as in `supabase/APPLY.md` step 7.
7. **Auth.** Providers: Sign in with Apple, email magic link, Google when it ships (brief decision 4; D-044 timing). Redirect allowlist: `https://earlyletters.com/**` and the app scheme only. Custom SMTP through Resend with this environment's key. JWT expiry and refresh settings per TDD 04 section 3.1. Anonymous sign-in stays off until the web contribution page exists (v1.1).
8. **Edge Function secrets.** Set only what that environment's functions use (`supabase secrets set`).
9. **EAS.** Set the environment's public variables with `eas env:set ... --visibility plaintext` and build secrets with `--visibility secret` ([ENVIRONMENTS.md](ENVIRONMENTS.md)).
10. **Remote config.** Seed the config table with the bundled defaults once it exists (D-035, **Planned**).
11. **Verify.** Run the read-only checks in `supabase/APPLY.md` steps 4 and 10 (classification, RLS on every table, no function executable by `anon`), then the Security and Performance Advisors. Anything not on APPLY.md's expected list: stop.
12. **Record.** Update [ENVIRONMENTS.md](ENVIRONMENTS.md) (status, project ref, region, plan) and `.github/migrations-applied.txt` in one pull request.

---

## RB-1 Apply a migration

Decision D-041: migrations reach staging and production only through CI, production only on a release tag. The deploy workflow is **Planned**; until it lands, the old development project keeps using `supabase/APPLY.md`, and nothing reaches production.

1. **Write it.** A new file in `supabase/migrations/` with a timestamp later than the newest applied one. Never edit an applied file (the migration guard fails the PR). Expand-then-contract: the previous app build must keep working (TDD 02 section 6.2).
2. **Prove it.** `npm run test:db` passes locally and in CI. Destructive statements (`drop`, `alter type`, `truncate`) carry a written rollback in the PR description.
3. **Review.** A pull request touching `supabase/**` needs an independent review run and the founder's "approve migration" label (D-041).
4. **Staging.** Merge to `develop`, then to `main`. The deploy workflow runs `supabase db push --db-url "$SUPABASE_DB_URL" --dry-run`, then the real push, against `scribe-staging`. Check the result with the APPLY.md verification queries and the Advisors.
5. **Production.** Push the release tag (pattern set by the deploy workflow; planned `db-v*`). The job waits for the founder's approval on the GitHub Environment `production`, shows the dry run, then applies to `scribe-prod`.
6. **Record.** Add the file name to `.github/migrations-applied.txt` in a pull request.
7. **Never** paste a migration into the production SQL Editor. The one exception is break-glass during a SEV1, recorded in the incident log, followed by a migration file that matches what was run.

---

## RB-3 Restore or roll back the database

Prefer the least drastic option. A restore is the last resort, because it can bring back data people deleted.

1. **Fix forward.** Write a new migration that corrects the change and ship it through RB-1. This is the default.
2. **Neutralise.** For a specific emergency, replace one function body or policy to stop the harm, then fix forward the same day. `supabase/APPLY.md` ("Rolling back files 5 to 7") shows the pattern.
3. **Restore from backup** (only if data was lost or corrupted and 1 and 2 cannot recover it):
   1. Declare a SEV1 ([INCIDENT.md](INCIDENT.md)). Turn sync off with the kill switch if it exists, so devices do not push or pull against a moving target.
   2. Pick the restore point (daily backup on Pro; any second inside the PITR window if the add-on is on).
   3. Restore into a **new project** where possible and verify it before switching (TDD 02 section 6.3). Restoring in place makes the project inaccessible during the restore (Supabase backups docs, read 3 Oct 2026). Restoring to a new project is described in Supabase's separate "restore to a new project" guide (**Unverified** steps).
   4. **Re-apply deletions** that happened after the restore point before anyone reconnects: account and book deletion requests, deleted letters, purge records. A restore must never undo a family's deletion (LEGAL-REQ-031). The replay tool is **Planned** (TDD 04 3.10 `restore_replay`).
   5. Storage objects are not in database backups. Reconcile Storage paths against the restored metadata.
   6. Point the app at the restored project only after the APPLY.md checks pass; turn sync back on.
4. **Drill** on staging once a quarter; record the time taken against the targets in TDD 02 (RPO 24 h, RTO 4 h).

---

## RB-4 Rotate a leaked secret

Applies the moment a secret may have been seen by anyone else: committed, pasted in a chat, shown in a log or screenshot, flagged by secret scanning.

1. **Classify.** Find it in [SECRETS.md](SECRETS.md). A public identifier (publishable key, DSN, project key) is not an incident by itself. A key that bypasses access rules (Supabase secret key, database password, CI connection string) is a SEV1; other secrets SEV2.
2. **Revoke and replace at the source first**, using the "How to rotate" column. Do this before cleaning anything up.
3. **Update every home** of that secret (GitHub Environment, EAS, Supabase settings, Edge Function secrets). Redeploy or rebuild only where the consumer does not read the new value automatically.
4. **Confirm the old value is dead**: a request with it fails.
5. **Look for use** in the window it was exposed: Supabase logs, provider dashboards, GitHub audit log. Note ids and counts only.
6. **Clean up the copy**: delete the message or log line, close the secret-scanning alert as revoked. If it reached git history, rotation is the fix; history rewriting is optional and never a substitute.
7. **Record** the rotation date in [SECRETS.md](SECRETS.md) and, for SEV1 or SEV2, write the incident review.

---

## RB-5 User data deletion request

In-app account deletion (with a 30-day undo) is the main path. This runbook covers requests that arrive by email to `hello@earlyletters.com` or from the static `/delete-account` page (D-042). Service levels from LEGAL-REQ-031: acknowledge within 10 days, complete within 45 days.

1. **Log it** in the private support log: date received, request type, the account email's ticket reference. No letter content.
2. **Acknowledge** within 10 days. Calm and short: we received it, what will be deleted, what is kept and why (legal records), when it will be done, how to cancel within 30 days.
3. **Verify the requester** controls the account: the request must come from the account's email address, or the person confirms from that address. Never act on a request from a different address.
4. **Offer the in-app path first** if they still have the app (Settings, delete account). It is faster and self-service.
5. **Support-assisted deletion** when they cannot use the app: it must run through the same deletion job as in-app deletion (30-day undo, purge, processor deletions, audit), never ad-hoc SQL deleting rows. The audited runbook wrapper for this is **Planned** (TDD 04 3.10 `support_delete`, ROADMAP M9). The current deletion RPC accepts only app and web sources; the support source needs a decision before this path exists.
6. **Co-parents and contributors.** If the person shares a book, the book stays for the other parent (PRD B-REQ-016); tell the requester that copies other people exported may remain (LEGAL-REQ-032).
7. **Processors.** Within 24 hours of the hard delete, deletion calls go to PostHog, Sentry and the email provider (LEGAL-REQ-031). Apple is not our processor for purchases; we delete our own mapping only.
8. **Confirm** to the requester when the hard delete is done. Record completion date and counts only.

---

## RB-8 App Store release and TestFlight

Release tag: `ios-v<major>.<minor>.<patch>` (CLAUDE.md). Beta runs on TestFlight; the store listing never says "beta" (brief decision 10).

**Before the first build ever**
- `publisher.domain` in `packages/brand/index.ts` is the real domain; the bundle ID is permanent after the first upload.
- Individual Apple Developer account active (brief decision 14); app record created in App Store Connect with the production bundle ID; App Store Connect API key in EAS credentials.
- Subscriptions configured in App Store Connect with Family Sharing on and the agreed prices and trials (brief decision 3); Billing Grace Period per D-048.

**Every release**
1. `develop` merged into `main`; CI green; database migrations the build needs already in production (RB-1).
2. Bump `version` in `apps/mobile/app.config.ts` (build numbers auto-increment remotely: `appVersionSource: "remote"`, `autoIncrement: true` in `eas.json`).
3. Build: `eas build --platform ios --profile production`.
4. **Size check:** download size under 40 MB on every release build (brief decision 15). Read it from App Store Connect after processing (where it reports per-device sizes: **Unverified** exact screen); record it in the release notes. Over budget: do not ship; find what grew.
5. Submit to TestFlight: `eas submit --platform ios --profile production`.
6. **Internal testing** (founding family, cohort C0) on the build. Smoke test on a real device: first run, record a letter offline, sync, invite a co-parent, purchase and restore in sandbox, delete account.
7. **External testing** (cohort C1, D-045) needs Beta App Review for the first build of a version (**Unverified** current rule; check App Store Connect).
8. **Store submission.** Review notes describe every feature, including anything controlled by remote config (guideline 2.3.1(a): no hidden, dormant or undocumented features; all new features described with specificity in the Notes for Review). Privacy labels match the data map output for this version (LEGAL-REQ-042). Screenshots use the fictional Asha family only.
9. **Release.** Prefer a phased release for automatic updates (**Unverified** current options). Tag `ios-vX.Y.Z` on the released commit.
10. **Watch** crash-free rate and sync errors for 48 hours (opt-in telemetry only).

**If a release goes wrong:** the App Store has no binary rollback. Use kill switches and remote config (within what App Review saw), raise `min_supported_build` only if an old build is unsafe, ship a fix, and request an expedited review if families are affected ([INCIDENT.md](INCIDENT.md)).
