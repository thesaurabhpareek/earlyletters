# Proposed harness changes for the requirements feedback loop

Status: PROPOSAL | Owner: product | Replaces: none | Load when: you own `scripts/agents/`, `agents/roster.json`, `.github/`, or the `product` or `chief-of-staff` charter, and want to automate the requirements feedback loop

Written 20 Nov 2026. Nothing under `scripts/`, `.github/`, `agents/roster.json` or any charter is changed by this file. Agents do not edit those paths (`docs/agents/OPERATING_MODEL.md` section 8); Karma merges them under D-132 and the gates in `docs/agents/COORDINATION.md` section 6.

Way back: the process that these proposals would automate is written in `docs/product/prd/FEEDBACK-LOOP.md` and works today by hand with handoff issues, PR comments, the ledger and the digest. If none of this is adopted, nothing breaks. If one is adopted and misbehaves, remove it (each item names its own revert) and the manual process in that file still holds.

Every item is unbuilt and untested. Sizes are guesses (S under a day, M one to three days).

| # | Proposal | Files it would touch (owner) | Why | Size | Revert |
|---|---|---|---|---|---|
| P1 | A `req-question` kind for `handoff.mjs open`. The script rejects a body that lacks the five fields (row id, what is unclear, evidence, what it blocks, proposed answer). Same marker format as other kinds | `scripts/agents/handoff.mjs`, `lib.mjs`, its test (harness owner) | Questions arrive complete; product stops asking for the missing field | S | Remove the kind; `question` still works |
| P2 | A PR label `req-question`, created by `bootstrap.mjs`, plus a dispatcher rule: a trusted PR comment whose first text is `<!-- req-question:<row id> -->` puts `product` in a triage mode ahead of backlog tasks, after `maintain` and `handoff` | `scripts/agents/bootstrap.mjs`, `dispatch.mjs`, tests (harness owner) | Today a review comment is read only if the author remembers to open a handoff | M | Delete the rule; comments are read at the next `product` run as before |
| P3 | A board lane "Requirements questions" on the agent board: open count by class and age, oldest first, lane lateness flags | `scripts/agents/board.mjs` or the board builder (harness owner) | One place to see the loop and where it is stuck | S | Remove the lane |
| P4 | A lens fan-out helper: `node scripts/agents/req-fanout.mjs --issue <n> --lenses design,policy,security,qa,engineering` opens one handoff per lens in one step with the proposed edit attached, and marks a lens late after its target | new script and test (harness owner) | Parallel by default instead of by memory; today an agent opens up to five handoffs by hand | M | Delete the script; open handoffs by hand |
| P5 | Ledger kinds `req-question` and `req-closure` and a read-only script `req-metrics.mjs` that prints the section 6 metrics (closure time by class, repeat rate, errata rate per card, share closed without an exec) | `scripts/agents/ledger.mjs`, new `req-metrics.mjs` (harness owner) | The retro counts from the ledger, not from memory | M | Remove the kinds and script |
| P6 | A digest field: `chief-of-staff` prints one `Requirements feedback:` line (opened, closed by class, waiting on the founder with default and date) | digest brief in `scripts/agents/brief.mjs`; `chief-of-staff` charter (harness owner; charter owner) | The founder reads one line a day and only class E | S | Remove the field |
| P7 | A docs lint, run in `npm test` or a docs check: every new errata row from E33 ends with `Plan delta:`; every file in `docs/product/prd/` has a `Status:` header; every id cited in an errata row exists | new check under `docs/product/prd/tools/` and a test hook (harness owner with `product`) | Keeps the plan delta and the status headers from rotting | S | Delete the check |
| P8 | A weekly standing duty for `product`: the retro in `FEEDBACK-LOOP.md` section 6, posted as a dated entry in `docs/agents/harness-v2/LESSONS-<date>.md` for Karma's review | `.claude/agents/product.md` standing duties; roster standing entry (harness owner; charter owner) | Repeat questions turn into rules without a person remembering to look | S | Remove the standing duty |
| P9 | A founder-queue check: a script that reads class E items and refuses to add one to `docs/release/FOUNDER_QUEUE.md` or the digest without the `Checked:` line (RS-04), a default and a deadline, and groups them into one batch of at most 4 | new script, `docs/release/FOUNDER_QUEUE.md` format note (harness owner; Karma) | Founder asks are never piecemeal and never missing a default | M | Delete the script; Karma checks by hand as today |
| P10 | A short addition to Karma's skill, "10b. Requirements feedback", pointing to `FEEDBACK-LOOP.md` section 3 (the triage order and the worth-asking tests) so the CTO skill and the triage rule cannot drift | `.claude/skills/early-letters-cto/SKILL.md` (Karma) | One rule, one home; Karma already owns the four verdicts (RULED, FOUNDER, NOT A QUESTION, NEEDS EVIDENCE) | S | Remove the section |

## Suggested order

P1 and P7 first (small, no dispatcher change), then P6 and P8 (the founder sees one line; the retro starts), then P2, P3 and P4 (parallel intake), then P5 and P9. P10 any time Karma wants it. None blocks another.

## Open questions for the harness owner

1. Whether `req-question` is a new `kind` or a label on a `question` handoff. A label needs no change to the marker format. Default if no answer: a label.
2. Whether the dispatcher should treat a `req-question` PR comment as a handoff for the PR's author agent as well as for `product`. Default: only `product`; the PR author sees the reply in the PR.
3. Whether the response-time targets in `FEEDBACK-LOOP.md` section 4 become board flags. Default: not until the first four weeks of data exist.

## What was not verified

I did not run any script named here. I read label handling in `scripts/agents/lib.mjs` and the dispatcher notes in `AGENT-COMMS.md` and `OPERATING_MODEL.md`. File names for the board builder and the brief are as I understand them and need confirming by the harness owner.
