# Handoff SLA (RB-17)

Code: `scripts/agents/sla.mjs` (pure; tests in `sla.test.mjs`). Spec of handoffs: `docs/agents/AGENT-COMMS.md`.

Failure it prevents: a handoff nobody answers stays open, the board only counts it, and nothing says it is stale.

## Grammar

- A handoff is an open issue, not a PR, whose author is trusted (`isTrusted`) and whose body starts with `<!-- handoff from:<h> to:<h1>,<h2> kind:<k> -->`. A marker further down, or from an untrusted author, is ignored.
- A reply is a trusted comment that starts with `<!-- handoff-reply from:<h> status:<s> -->`. Only that marker settles a recipient. A plain comment such as "Done in #208" is not a reply.
- Each recipient is judged on its own (`to:` labels, else the marker). A recipient is waiting until its reply is newer than the latest trusted non-reply message. Another recipient's reply does not count.
- The wait starts at issue creation, or at the latest trusted non-reply comment (a follow-up restarts it, as in `pendingTargets`).

## Thresholds

Age is whole days (rounded down) from the wait start to `now`.

| Class | Age |
|---|---|
| ok | under 5 days |
| escalate | 5 days or more |
| expire | 14 days or more |

## Output

`handoffSla(items, trust, now)` with `items = [{ issue, comments }]` returns `{ entries, counts }`. Each entry: `issue`, `from`, `to`, `kind`, `waitingSince`, `ageDays`, `class`. Oldest first. It returns data only: no GitHub calls, no comments, no closing.

## Integrator hook (not wired)

The dispatcher would call `handoffSla` once per tick with the open `handoff` issues and their comments it already loads, then:

- `escalate`: add the recipient to the brief's top line and the board's "needs attention" list; one comment per issue per class change, never repeated.
- `expire`: ask the sender (or the founder) to close or re-send. Closing stays a human or sender act; the SLA module never closes.

Open design points for the integrator: the escalation comment must not itself restart the clock (use a marker the module treats as a reply-neutral bot note, or track state outside the issue); and honour `AGENTS_PAUSED`.

## Reading on 2026-10-28 (read-only, via `gh api`)

Nine unanswered recipients across eight open handoffs (#154, #155, #156, #187, #196, #197, #198, #216), all escalate, none expire. None has a `handoff-reply` marker: the "Done in #208" comments are plain founder-account comments, so by this grammar they do not settle. That is the likely cause of the pile-up and is a decision for the founder: reply with the marker, or close the issues.
