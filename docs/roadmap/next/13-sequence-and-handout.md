# Final sequence and hand-out (file 13)

Status: LOCKED for hand-out by Karma (CTO role, Claude session), Sun 8 Nov 2026 (UTC). Docs only. It changes no decision, sets no price, assigns no BL, D or CR id, merges nothing.
Built on: `08-ranked-backlog.md` (confirmed by the founder as ranked, 8 Nov), `11-ranking-review.md`, `12-engineering-readiness-audit.md`, the Build 12 programme doc `claude/Karma-build-12-store-programme-2026-11-08.md` (Project doc, session 01G82fpt), and the open pull request list read from GitHub REST on 8 Nov.

Karma's ruling (T1, reversible, way back: re-sort this file): work is handed out in waves. A row is handed out only when (a) its requirement exists, (b) no open PR or live claim already covers it, and (c) its gate does not need a founder decision that is still open. Everything else is queued with the trigger that releases it.

## 1. Rules that stop duplicate work and wasted tokens

1. Claim first. One line in `docs/agents/BOARD.md` before any edit (COORDINATION section 2). The wave-1 claims are in one docs PR, so nobody starts without a line.
2. One agent per row. If the row already has an open PR from another session, the agent reviews or readies that PR; it does not open a second one. (Today's examples: #615 and #618 are superseded by #670; #665, #667 and #668 belong to the Build 12 mobile lane.)
3. Do not start store-release lanes. The Build 12 programme (Karma session 01G82fpt) owns the store gate, #635 then #520, #614, the Book page, the store-build mobile PRs, ops readiness and the compliance table. Add a line to that doc instead.
4. Read before writing. An agent reads its row in `08`, its requirement file and `_CONVENTIONS.md`, then runs `gh api` for open PRs that touch its globs.
5. Ids only from `node scripts/agents/next-id.mjs`, run at the moment of writing. Never reuse BL-621, D-139, D-141, D-142.
6. No agent merges, pushes to `develop` or `main`, applies a migration, dispatches a build, signs a CCO line or posts a counted review line. Agents open draft PRs, label them `agent:<handle>`, and stop.
7. Hand-back is one short report: branch, head sha, tests run (with counts), what was not verified. No recap of steps.
8. Banned characters scan (CLAUDE.md content rules) before every push.

## 2. Wave 0: built, waiting for review or a founder word (nothing new to start)

| Item | Where | Next step | Waits on |
|---|---|---|---|
| Recording that waits for the save | #670 (rank 14) | red-team review at head df72953d; then close #615 and #618 | review, author sessions |
| Alpha allowance boundary test | #669 (rank 17) | qa review | review |
| Reminders never repeat across seasons | #680 (rank 23) | qa review; then the 10% same-text fix (wave 2) | review |
| Prompt repeat suppression | #681 (rank 27) | red-team review (core change) | review |
| Free analytics sink | #677 (rank 22) | none until F11 | founder F11, counsel Q54 |
| Key, session, https PRs | #602, #657, #632, #633 (rank 3) | #602 founder read (file prepared); others: counted reviews and a named-sha go | founder |
| Recording extras | #617, #619 (rank 14) | reviews | review |
| Next-set docs | #664 (roadmap), #638 (PRD readiness) | founder merge when he chooses | founder |
| Hosted-backend drafts | branch `docs/ops-hosted-drafts-8nov` | stay drafts until the project exists | founder (project, plan) |
| #635 split plan | branch `docs/635-split-plan-8nov` | the Build 12 lane owns #635; use the plan | Build 12 lane |

## 3. Wave 1: start now (docs, tests and reviews only; safe inside the freeze)

| # | Row | Agent handle | Output | Branch | Gate |
|---|---|---|---|---|---|
| W1-1 | Rank 4: independent security test scope (D-125 item 10) | security-architect | `03-requirements/NX-04-independent-security-test.md`: scope, what the vendor is shown, retest list input, what "outside the first families" means, founder booking steps | `docs/nx-04-security-test-8nov` | docs only |
| W1-2 | Rank 8: withdraw sensitive-data consent (D-128) | privacy | `03-requirements/NX-08-consent-withdrawal.md` in the `_CONVENTIONS.md` shape, with door lines, server function, Settings row, offline case, tests that fail today | `docs/nx-08-consent-withdrawal-8nov` | docs only |
| W1-3 | Review of #670 and #681 (code) | red-team | Review in the strict format as evidence, one PR comment each (not counted) | none (comment) | none |
| W1-4 | Review of #669 and #680 (tests); read #533 and say what it is and whether the flake reproduces | qa | Same format; one paragraph on #533 | none (comment) | none |
| W1-5 | Rank 14: phone-is-full words at Finish | content | PR adding three keys proposed by the recording lane, content tests green, no screen | `feat/content-phone-full-finish-8nov` | design-systems and founder approve words |
| W1-6 | Backlog entries for the confirmed rows | product | Docs PR: BACKLOG rows with ids from `next-id.mjs`, `_ID-MAP.md`, `Satisfies:` lines; only rows whose requirement exists | `docs/backlog-next-8nov` | founder merges |

Everything in wave 1 opens as draft PRs or comments. The counted reviews and merges stay with the founder's named-sha go.

## 4. Wave 2: queued, with the trigger that releases each

| Row | Work | Agent | Trigger |
|---|---|---|---|
| 23 | Fix the 10% identical reminder text after a cadence change | mobile | #680 reviewed. Ruled: in scope of NX-10-R2 ("never repeat"); branch from #680 or wait for its merge, whichever the founder's go allows |
| 14 | Build the Finish-screen phone-is-full state | mobile | W1-5 words approved and #670 merged |
| 8 | Consent withdrawal build | mobile, data-architect | NX-08 merged; counsel on the words |
| 4 | Independent test: book the vendor | founder | NX-04 merged; F18 |
| 5 | Hosted backend: create scribe-prod, apply migrations in order, smoke | data-architect, ops | Founder decision entry for the route, F4 plan, project created by the founder |
| 6 | Sign-in on production (profile flip, Apple key, Resend SMTP) | mobile, security | Rank 5 done; founder-hands steps |
| 7 | Country block (D-131, D-136) and age signal | mobile, data-architect, privacy | #635 landed; counsel Q46, Q48, Q57 |
| 9 | Delete account end to end | mobile, sync | #520 landed; rank 5 for the drill |
| 10 | Production backup, kill, rollback, restore | ops | Rank 5; F4 |
| 11 | Alerts, incident order, rate limits (NX-17) | ops, security | Rank 5 (a project to alert on) |
| 16 | Two-phone proof | qa | Ranks 5 and 6; the founder's two phones |
| 17 | Plus and billing trust beyond BL-736 | payments, content | F10 and counsel Q41 |
| 18 | Support route (NX-16) | support, ops | The `/support` URL decision in Build 12 (BL-605) |
| 19, 20 | Build 1 audit rows; the 1 Dec block | per row | Un-deferred on Mon 9 Nov after go/no-go |
| 22 | Analytics build | analytics | F11 and counsel Q54 |
| 24 | Numbering clean-up: post the 12 author-session comments | product | Any time; docs and comments only |
| 25 to 31 | Tier 2 and 3 | per row | Not before ranks 1 to 17 are shipped or waived |

## 5. Founder batch for Monday 9 Nov (hands and words, in this order)

1. Go/no-go for the release stream.
2. A decision entry recording the Build 12 route: servers on, production directly, automatic release, no staging rehearsal (the Build 12 programme doc records these as his words of 8 Nov; the decision entry itself is not written yet).
3. Supabase plan (F4), counsel engaged (F3), who may sign in to build 12 (F5).
4. CCO lines for #635 then #520, after the Build 12 lane reports the heads.
5. #602 read; named-sha go for each PR that has two evidence reviews and green CI.
6. F11 analytics words; F18 independent test; F10 Plus prices.

## 6. What is not verified

- Counsel is engaged, any hosted project exists, and the Supabase plan cost.
- The recording lane's and QA lane's test counts: reported by the agents, not re-run by me.
- That the wave-2 sizes are anything but estimates.
- Whether other sessions have started on any wave-2 row since 22:50 UTC on 8 Nov; the claim check in section 1 rule 4 catches it.

Karma (CTO role, Claude session)
