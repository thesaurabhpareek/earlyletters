# Theme 17: The team hears about a problem before you do

Readiness: 24 of 28. Author's score, `qa` to confirm. Remains: which sender sends the mail (C14, founder confirms); the exact thresholds that are not yet numbers in `06-nfr.md` are listed in R1 and marked proposed.

| | |
|---|---|
| Working label | NX-17 (working id, see `_CONVENTIONS.md`); backlog rank 11 in `../08-ranked-backlog.md` |
| Refines | `docs/prd/v2/06-nfr.md` section 14 (observability, alerts), F16 section 9, TDD 06 section 5.5 and 5.6, D-135 (the founder's mailbox for hand-offs) |
| Tag | EVIDENCE for the need (06-nfr section 14 lists the alerts and says the founder is the only responder and severity 1 and 2 page his phone). HYPOTHESIS that email is a fast enough pager |
| Size | S |
| Gate | Founder confirms the mailbox and the sender. No external gate. Needs theme 1 (a hosted project to alert on) |
| Order | 17 (provisional) |

## What the parent will see and do

Nothing. When something goes wrong on the servers, a short email reaches the team before a parent has to write to us, and says what, how big, since when, and which runbook to open. It never contains a letter, a name, a recording, an email address of a parent, or a key.

## The check

| Label | Tag | Given, When, Then | Fails on old code because | Source |
|---|---|---|---|---|
| NX-17-R1 | EVIDENCE | Given each rule below, When its threshold is crossed on the throwaway project, Then exactly 1 email reaches the alert address within 10 minutes (proposed) with subject `[Early Letters alert] <rule code> <UTC time>` and a body of only: rule code, measured number, threshold, UTC time, runbook path. Rules and thresholds: oldest running transaction over 30 s (06-nfr); an escrow limit hit, any (06-nfr); purge backlog or a stuck deletion over its runbook limit (`stuck-deletion.md`, `purge-failing.md`); server 5xx above 0.1% over 28 days after 1,000 events (06-nfr); weekly auth success below 93% (06-nfr); database size over 80% of the plan (proposed); a restore request on hold (06-nfr). | The `ops-health` views are specified and the runbooks exist, but no sender, schedule or address is wired (no function or workflow in this tree mails an alert; searched 8 Nov for the address in `supabase/` and `scripts/`). | `06-nfr.md` section 14 |
| NX-17-R2 | EVIDENCE | Given alert bodies built from synthetic events that carry canaries (the name Asha, a parent email, a sentence of a letter, a bearer token, a service key shape), Then 0 canaries appear in any alert subject or body (10 of 10 samples). | No alert builder exists to test. | CLAUDE.md privacy rules; LEGAL-REQ-014 |
| NX-17-R3 | EVIDENCE | Given the repo and the alert builder, Then the address is read from a configuration variable, not typed into code, and a scan finds 0 secret-shaped strings (keys, tokens, connection strings, URLs with credentials) in any alert text or fixture. | Nothing scans. | D-135; secrets rule in `docs/engineering/06-security-engineering.md` (title only read) |
| NX-17-R4 | EVIDENCE | Given a rule that stays crossed, Then it sends at most 1 email per 6 hours (proposed) and 1 "back to normal" email when it clears; 3 crossings in an hour produce 1 email. | Not built. | |
| NX-17-R5 | EVIDENCE | Given a daily heartbeat email at 08:00 UTC saying "all quiet" with the same 5 lines, When no heartbeat arrives for 26 hours, Then a second route tells the founder: a scheduled workflow fails and GitHub mails the owner. 2 of 2 routes proven by switching the first off. | A broken alert pipe is silent today. | Absence-of-signal rule |
| NX-17-R6 | EVIDENCE | Given Monday 08:00 UTC, Then one weekly report email arrives with counts only: auth success per method, purge backlog, deletion requests open, database size, top 5 slow queries by name and time, escrow unwraps per day, function error counts by code. | Not built. | `06-nfr.md` section 14 |

**Shown / Records / Never / Decline:** no person agrees to anything here; no door lines. The founder's mailbox receives only content-free operational data.

## Edge cases

Second project (the throwaway rehearsal sends with a `[rehearsal]` prefix so it is never mistaken for production); sender provider down (R5 catches it); alert storm (R4); address changes (one variable); the founder on holiday (a second address in the same variable, comma separated; proposed).

## Offline behaviour

Not a phone feature. The app never sends an alert; the diagnostics ring buffer stays on the phone.

## What we never do

Put a letter, a name, audio, a parent's email, a token or a key in an alert. Email a stack trace with request bodies. Send alerts from a personal mailbox. Use the alert address for anything but alerts and the hand-offs D-135 already routes there.

## Copy needs

None for parents. The alert text is operator text in `docs/ops/runbooks/` and the sender, not a content key.

## Analytics events

None. Alerts do not use app analytics (off in 1.0, D-124).

## Device rows

None.

## Dependencies

Theme 1 (hosted project, `ops-health` views). Sender: Resend is already a subprocessor and the transactional identity (`packages/brand` email block); a scheduled Edge Function or a GitHub workflow can send. Which one is `ops`'s call, with `security-architect` reading the secret handling.

## Engineering block (G-31 to G-37)

| Line | This theme |
|---|---|
| API contract (`packages/api`) | None. The alert builder is an ops function, not a public route. If it is an Edge Function it is service-only (no user JWT), listed in `packages/api/src/server/` only if it has a request type. |
| Budget (`06-nfr.md`) | Delivery within 10 minutes (proposed). The sender uses no work in the request path of any user call. |
| Accessibility | Plain text email, 5 lines, readable on a phone lock screen. |
| Switch, off behaviour, noticed by | Switch: one variable (`ALERT_EMAIL` or similar, set in the CI/function secret store); unset means no mail and the heartbeat route catches it. Rollback: unset. Noticed by: R5 (heartbeat missing for 26 hours). |
| Data class and retention | Alert content: counts, codes, durations, request ids, rule names: L1/L2 only. The address is the founder's; Gmail is not a subprocessor of user data because no user data is sent (`privacy` confirms). No retention in our systems. |
| Schema and grants | None unless alert state (last sent time per rule, for R4) lives in a table: then one additive migration with grants in `supabase/tests/grants.mjs` and a db test, or keep state in the workflow run. Prefer no table. |
| Analytics events | None. |

## Trace and tests

Id convention: `_CONVENTIONS.md`.

| Id | Refines | Test (layer, file, title) | Device or ops row |
|---|---|---|---|
| NX-17-R1 | `06-nfr.md` section 14 | function or script test with a fake mailer (proposed `supabase/functions/ops-alert/handler.test.ts`); `[NX-17-R1] each rule sends one mail with the five fields` | ops: rehearsal on the throwaway project |
| NX-17-R2 | LEGAL-REQ-014 | same file; `[NX-17-R2] canaries appear in 0 of 10 alert bodies` | none |
| NX-17-R3 | D-135 | repo scan test (proposed `scripts/ops/alert-scan.test.mjs`); `[NX-17-R3] no hardcoded address and no secret shapes` | none |
| NX-17-R4 | | same handler test; `[NX-17-R4] 3 crossings in an hour send 1 mail; clear sends 1` | none |
| NX-17-R5 | | workflow dry run; `[NX-17-R5] missing heartbeat is caught by the second route` | ops: switch off the first route once |
| NX-17-R6 | `06-nfr.md` section 14 | same handler test; `[NX-17-R6] weekly report holds counts only` | none |

Trace: NX-17-R1..R6 -> `06-nfr.md` section 14, F16 section 9, D-135.

## Founder-only decisions

| Decision | Recommended default |
|---|---|
| Confirm earlyletters@gmail.com as the alert address and a second address for holidays | Confirm; one variable holds both |
| Sender | A scheduled Edge Function through Resend (already a subprocessor), with the GitHub workflow as the second route |
| What counts as severity 1 (phone buzz) | Gmail notification rule on the subject prefix `[Early Letters alert] S1`; S1 is any limit-hit and auth success below 93% |

## Not verified

Whether any workflow already mails an alert (the workflow files were not read). The `ops-health` view names in a migration (the list is from `06-nfr.md`). Gmail delivery latency. The Resend sending limits for this volume.
