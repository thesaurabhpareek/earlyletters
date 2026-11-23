# Early Letters lifecycle playbook

Status: PROPOSED (outside the lock) | 20 Nov 2026 | Owner: `product` | Replaces: none | Load when: planning what the product shows, sends and says over a family's life with it, or building a reminder, in-app line, email or day.

## What this is

The founder asked on 20 Nov for one working document that covers four things: what we show in the experience; which emails and consumer lifecycle messages need to exist; the backlog and logic for the variety of push notifications and in-app messages we show for events and festivals in the USA; and how those change by region and religion when a customer gives that. This folder is that playbook.

It sits outside the locked pack (rev 2). It may propose; it never contradicts. Where it wants a locked rule changed, a "Proposed change" box names the erratum it would need (next free: E83 and CL-158). All words in it are proposed until the founder approves them. Facts are sourced, or marked UNVERIFIED.

## The five parts

| Part | File | What it holds |
|---|---|---|
| 1 | [01-experience-content-map.md](01-experience-content-map.md) | What we show in the experience, screen by screen |
| 2 | [02-email-lifecycle.md](02-email-lifecycle.md) | Which emails and lifecycle messages need to exist |
| 3 | [03-in-app-and-reminder-logic.md](03-in-app-and-reminder-logic.md) | Channels, message classes, eligibility, selection, events and festivals logic, parked push, tests, Asha worked example |
| 4 | [04-events-and-festivals-usa.md](04-events-and-festivals-usa.md) | The USA calendar of days and the words around them |
| 5 | [05-backlog-proposed.md](05-backlog-proposed.md) | Proposed backlog rows PB-01 to PB-23, in waves |

Parts 1, 2 and 4 are written by other agents in parallel. Part 3 states what it needs from part 4 (section 11.1) and defers to the locked cards where they differ.

## Status and how it becomes real

1. This playbook is PROPOSED. It is read by the founder and `product` first.
2. Its Proposed changes (PC-1 to PC-5 in part 3 section 14) go to Karma as errata E83 and later. Nothing changes in the lock until the founder rules them.
3. Its backlog rows (PB-01 to PB-23 in part 5) get real BL ids from `product` under the numbering rules at the top of `docs/BACKLOG.md` and `next-id.mjs` (#912). Existing rows BL-295, 296, 297, 966, 982, 963, 985, 961 and 537 already cover the engine and are not duplicated.
4. Words go to the founder by release drop: A, then B, then C (`docs/product/prd/22-final-holistic-spec.md`).

## Founder decisions (real ones only)

| # | Decision | Default if the founder says nothing |
|---|---|---|
| 1 | Adopt this playbook as the working plan, as PROPOSED, until the errata batch (PB-01) is ruled | Yes |
| 2 | Region and religion: keep them as no stored fields, so variants follow ticked days and date choices only (the locked answer, Q-FD-5 and CL-013). If the founder wants fields, each needs a registry row, a Clear control, and counsel Q6 and Q7 first | Keep as locked: no fields |
| 3 | Name a second country for the first non-US drop | None; United States only |
| 4 | Put the "Would you like to know when the other parent made a letter (yes / no)?" question on the first store-build tester sheet (NS-26 reopen evidence) | Yes; no code built |
| 5 | Approve words by drop: A, then B, then C | A first |
| 6 | Whether a family in-app line ("the other parent wrote") gets a Home rank | No; the Book only |
| 7 | Rule the five Proposed changes (PC-1 age-free band, PC-2 one home for day words, PC-3 day lines by year, PC-4 "Not much today" and the anchor, PC-5 parked push) | PC-1 to PC-4 yes as written; PC-5 parked |
| 8 | Send the counsel brief (PB-02) and name tradition reviewers (PB-04) | Brief yes; no tradition ships until a reviewer is recorded |

Counsel and privacy pre-conditions, stated as such: counsel must confirm CUL-Q5, Q6, Q7, Q11, Q-DAY-6, Q-DAY-9, Q-DAY-10, Q-DAY-11, the FR-DAY-23 source licences and the consent line; a privacy read of PC-1 and the lock-screen keys comes before any such string is built. Standing defaults this playbook relies on: E75 (transactional email only at 1.0), E78 (no new-device email at 1.0), E79 (no server push in 1.0), CL-013, CL-015, CL-022.

## What the playbook will never do

No generated text; every word is a content key. No fear, guilt or loss language; no counts, gaps, streaks, points or badges. No guess about a person's region or faith, no ad, no marketing use. No festival campaigns, no festival emails. No server push in 1.0.

## How to run it (checklist for the next cycle)

1. Read part 3 sections 1 to 5 and the founder decisions above.
2. Rule decisions 1 to 8; `product` records them in the journal.
3. Karma drafts the errata from PB-01 and numbers them E83 onward; the errata file changes only in Karma's PR.
4. Counsel brief out (PB-02); privacy read (PB-03); reviewer recruitment (PB-04).
5. `product` turns Wave 0 and Wave 1 rows into BL ids and sets them ready (Drop A).
6. Merge parts 1, 2 and 4 from the parallel agents; check each against part 3 for conflicts (no `{child}` in a day-name body, no age on a names-off lock screen, no festival email).
7. Run the gate harness (PB-08) against the Asha table before any day data ships.
8. Founder approves words for the drop; content merges them; the rules test must pass.
9. Founder device walk (PB-21) before a build leaves for testers.
10. Each October, re-check the days calendar (PB-15). Each tradition ships only with a reviewer record.
11. Update this file's status and the ROADMAP with what merged and what did not.

`product`
