---
chapter: 10
title: Logging and observability
owner: principal-architect
reviewers: [compliance-engineer, security-architect]
status: adopted
last_reviewed: 2026-10-03
applies_to: packages/analytics/**, apps/mobile/src/lib/**, supabase/functions/**, supabase/migrations/** (audit and health objects), scripts/**
---

# 10. Logging and observability

## Purpose

We must know when a letter fails to save, sync or purge, without ever seeing the letter, the child's name or whose book it is. Observability here is built from enums, counts, durations, SQLSTATEs and random request ids, never from user content or user ids (TDD 06 introduction). This chapter covers log structure, request ids, levels, what each layer emits, crash reporting plumbing, SLOs and alerts. What may never be logged is owned by chapter 07 (PRIV); security and audit events by chapter 06 (SEC).

## Principles

1. **Allowlist, not blocklist.** A log line can only hold fields a type allows; nothing free-form.
2. **Correlate with a random id, not a person.** A request id joins device, function and database evidence; a person is looked up only through an audited runbook.
3. **Two clocks, two stores.** Product audit rows live in Postgres (`audit_events`, 24 months); operational logs are short-lived streams (D-021).
4. **Few SLOs, each defended.** Alert on what users feel and on legal deadlines (deletion), nothing else.
5. **Durability is an invariant, not a budget.** Any lost or silently changed letter is Sev 1 (TDD 06 2.1).

## Rules

### Structure

**OBS-R01 (MUST)** Server-side code (Edge Functions, scripts, workers) logs only through one typed logger whose record type is the `OpsLog` allowlist in TDD 06 5.3 (`ts`, `fn`, `version`, `req_id`, route template, `outcome`, `status`, `sqlstate`, `duration_ms`, named counts, `provider`, `cold_start`). There is no free-form `message` field. *Why:* types are the first scrubbing layer (TDD 06 5.4). *Enforced by:* not yet: the logger does not exist (PDATA-06); proposed home `packages/analytics/src/ops-log.ts` (OBS-G2).

**OBS-R02 (MUST NOT)** No layer logs request or response bodies, query strings, headers other than the request id and build, SQL text with literals, or `error.message`, `details` and `hint` from Postgres or PostgREST; errors are logged as `{name, sqlstate}` or `{name, code}`. *Why:* Postgres DETAIL echoes the failing row, including letter text (TDD 06 C-2); content-free rule in chapter 07 and LEGAL-REQ-014. *Enforced by:* not yet: logger tests (OBS-G2), BL-021 scrubber.

**OBS-R03 (MUST)** Every request has a random request id (32 lowercase hex, W3C trace-id format) created on the device per outbox batch or RPC call, sent as a header, echoed by Edge Functions, written in every log line for that request, and stored with the device's rejected op so a user report can quote it. It is never derived from a user, device or row id. *Why:* end-to-end correlation without identity; the W3C spec forbids personal data in trace fields. *Enforced by:* not yet (OBS-G1).

**OBS-R04 (MUST)** Levels mean: `error` needs a human (it feeds alerts), `warn` is a degraded but handled path (retry, fallback provider), `info` is one line per request or job run, `debug` is off in production builds and functions. *Why:* alerts read `error`; noisy levels hide incidents. *Enforced by:* review.

### By layer

**OBS-R05 (MUST)** Device: `console.*` is stripped from release builds and banned by lint outside `__DEV__`; local diagnostics hold only L1 and L2 values (TDD 06 5.2). *Why:* the app holds L4 data everywhere. *Enforced by:* not yet: no ESLint config (MONO-01, WS-12). Today one `console` call exists, in a build script (`packages/design-tokens/src/build-css.ts`).

**OBS-R06 (MUST)** Crash reporting (Sentry) is initialised only after analytics consent is granted (D-003), with `sendDefaultPii: false`, `setUser` never called, `beforeSend` and `beforeBreadcrumb` running the BL-021 scrubbers, no console or HTTP breadcrumbs, route templates instead of resolved paths, and no session replay or performance tracing in v1. *Why:* ADR 0008; TDD 06 5.1 (spans capture URLs with L3 ids). *Enforced by:* not yet: Sentry is not wired (MOB-15) and BL-021 is not built; when it is, a test asserts `setUser` is never called (TDD 06 5.4).

**OBS-R07 (MUST)** Postgres keeps two separate record types: `audit_events` (product and dispute evidence, enum-only `detail`, 24 months, DATA-REQ-045) and operational logs (`ops_audit_log`, security events; 12 months) (D-021). Operational job outcomes (purge runs, worker steps) are rows with counts and codes, never object paths or content. *Why:* different purposes and clocks; object paths contain L3 ids (TDD 02 4.2 step 7). *Enforced by:* `audit_events` exists (`supabase/migrations/20261002020000_data_governance.sql`) with its tests; `ops_audit_log` not yet (DOC-11).

**OBS-R08 (MUST)** Analytics events are not logs: they go only through the typed catalogue in `packages/analytics` after opt-in, and an invalid or missing required property drops the event and counts a violation. *Why:* PDATA-03: the validator stripped bad properties and still sent the event. *Enforced by:* pending PR #31.

### Health, SLOs and alerts

**OBS-R09 (MUST)** Server health is computed by SQL views returning L2 counts only (`ops_health` and the metrics in TDD 06 5.5: `tombstones_overdue`, `deletion_requests_stuck`, `storage_purge_backlog`, `purge_last_run_age`, `db_size_bytes`), read every 5 minutes by one `ops-health` job that sends L2-only alerts. *Why:* PDATA-06; the purge pipeline can fail silently (PDATA-02). *Enforced by:* not yet (PDATA-06, OBS-G3).

**OBS-R10 (MUST)** A log canary runs the end-to-end suite at debug level and scans every log stream (Edge Function, Postgres, Sentry test project) for the Asha fixture strings, fixture UUIDs and an oversize-letter case; any hit fails the build. *Why:* LEGAL-REQ-014 names this test; it is the only proof the scrubbers work end to end. *Enforced by:* not yet (TDD 06 5.4 layer 4).

**OBS-R11 (MUST)** The v1 SLO set is the journey table in TDD 06 2.2 and 2.3, measured on 28-day windows with a 1,000-event minimum; release gates use App Store Connect and Xcode Organizer crash rates, not Sentry (consenting users only). New SLOs need a founder decision. *Why:* few, defended SLOs; Sentry sees only opted-in users (TDD 06 P-7). *Enforced by:* review; no SLO is measured yet (PDATA-06).

**OBS-R12 (MUST)** Every alert names its severity, its runbook id (RB-n, TDD 06 5.7) and carries only counts, codes and request ids. Sev 1 (data loss, privacy leak, deletion SLA breach) and Sev 2 page the founder; Sev 3 goes to a daily digest. *Why:* one responder; an alert without a runbook is noise. *Enforced by:* not yet: no alerting exists (PDATA-06); runbooks pending WS-18.

**OBS-R13 (SHOULD)** Internal targets sit tighter than published ones (for example sync upload p95 700 ms internally against the 800 ms budget) so alerts fire before users feel it. *Why:* SRE practice of a safety margin. *Enforced by:* review.

### Reading logs

**OBS-R14 (MUST)** Humans and agents read production logs only through an audited runbook (`ops_audit_log` row first, ticket reference required, TDD 02 2.7) and only by request id, time window, function or SQLSTATE; agents never hold production log or database credentials. *Why:* LEGAL-REQ-025; PINF-01 (agents held prod-capable connectors). *Enforced by:* not yet: the runbook wrapper `scripts/runbook.mjs` does not exist; agent connector removal is a founder decision (workstreams decision 6).

## How to apply it

What each layer emits (target state):

| Layer | Emits | Stored in | Kept |
|---|---|---|---|
| Device (release) | Nothing to console; consenting analytics events; scrubbed crashes | PostHog, Sentry (opt-in) | Sentry 90 days (TDD 06 5.1) |
| Device outbox | Rejected op with SQLSTATE and `req_id` | Local `rejected_writes` | Until the user resolves it |
| Edge Function | One `OpsLog` record per request | Supabase function logs | Platform retention (Unverified) |
| Postgres RPC | SQLSTATE on refusal; `audit_events` row for audited actions | Postgres | 24 months (D-021) |
| Jobs (purge, worker) | Run row with counts and codes; `OpsLog` per run | Postgres, function logs | 12 months (D-021) |
| `ops-health` | L2 metrics, alerts | Alert channel | Channel retention |

Adding logging to an Edge Function:
- [ ] Import the typed logger; never `console.*`.
- [ ] Read `x-request-id` (or create one), put it in every record and in the response header.
- [ ] Log one `info` record per request: route template, outcome, status, sqlstate, duration, counts.
- [ ] On error, log `{name, sqlstate}`; never the message.
- [ ] Add the Asha canary case for any new input field to the logger test.

```ts
// supabase/functions/<fn>/index.ts (pattern; logger from OBS-G2)
const reqId = req.headers.get('x-request-id') ?? randomHex32();
const t0 = performance.now();
try {
  const res = await handle(req);
  log({ fn: 'invite-redeem', req_id: reqId, route: 'POST /invite/redeem',
        outcome: 'ok', status: res.status, duration_ms: performance.now() - t0 });
  return withHeader(res, 'x-request-id', reqId);
} catch (e) {
  log({ fn: 'invite-redeem', req_id: reqId, route: 'POST /invite/redeem',
        outcome: 'server_error', sqlstate: sqlstateOf(e), duration_ms: performance.now() - t0 });
  return problem(reqId); // body: { code, req_id } only
}
```

Answering "why did my letter not sync?": ask for the request id shown with the rejected letter; search function logs by `req_id`; read the SQLSTATE; map it with the chapter 02 registry. No user id is needed.

## Exceptions

The founder grants exceptions, recorded as a `D-###`. Any exception that lets L3 or L4 data into a log stream also needs counsel sign-off through chapter 07 and is never a one-off PR exception.

## Open questions

1. TDD 06 C-1: Supabase platform logs record request paths that contain L3 ids. Counsel decision via chapter 07; this chapter assumes option (a) plus (b) (POST bodies for reads).
2. Alert channel: Sentry alerts (existing processor) or a push or SMS service (new processor, data-map row)? Recommended: Sentry, TDD 06 5.6.
3. Can `log_error_verbosity = terse` be set on the Supabase project? Unverified (TDD 06 C-2).
4. Where does `ops_health` live: an Edge Function on cron or `pg_cron` plus `pg_net`? Unverified which is simpler on Pro.
5. Where does the typed logger live: `packages/analytics/src/ops-log.ts` beside the scrubbers (TDD 06 5.3), or the contract package from chapter 02? Recommended: beside the scrubbers, so one test suite guards both.

## References

Repo: `docs/tdd/06-performance-reliability.md` 2, 5 (SLOs, signal sources, `OpsLog` schema, scrubbing layers, conflicts C-1 to C-4, metrics, alerts, runbooks); `docs/tdd/02-sync-backend.md` 2.7, 4.2; ADR 0008; `docs/legal/DATA_CLASSIFICATION.md` section 2 "Logging" row; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-014, -025, -033; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-045; `docs/BACKLOG.md` BL-021, BL-022; D-003, D-021, D-035; findings PDATA-02, -03, -06, MOB-15, MONO-01, DOC-11, PINF-01; chapters 06 and 07.

External (all checked 2026-10-03):
- W3C Trace Context: https://www.w3.org/TR/trace-context/. trace-id is 16 random bytes in lowercase hex; the privacy section says trace fields must not carry personally identifiable or sensitive data.
- Google SRE book, "Service Level Objectives": https://sre.google/sre-book/service-level-objectives/. Prefer percentiles to means; keep as few SLOs as possible; keep a safety margin between internal and published targets.
- PostgreSQL, Appendix A "Error Codes": https://www.postgresql.org/docs/current/errcodes-appendix.html. SQLSTATE codes are stable across releases and locales, so they are the safe thing to log.
