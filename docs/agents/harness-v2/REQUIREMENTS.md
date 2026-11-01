# Harness v2 requirements (product, 1 Nov 2026)

Cites, never copies: RG- is REVIEW-GATE.md, FP- FOUNDER-PAGE-AND-CLAIMS.md, EG- EVIDENCE-AND-GREEN.md, SM- SECURITY-MODEL.md, ARCH ARCHITECTURE.md, G1 to G11 RETROSPECTIVE.md. If a sibling differs, its check wins and this file is corrected. Nothing was run; U means unverified.

## Principles
1. Free. Anything paid goes to the founder with a number.
2. Machines over prose: a rule that matters is a script with a planted-failure test (prose failed at #460).
3. Honest limits: every gate names what it cannot prove (CR-20, CR-32). Green is never called "approved".
4. The human merge click stays; the harness makes it informed and cheap.
5. Nothing unattended before the SM section 3 preconditions. Lanes stay off; no model in any cron.
6. CR-22: to 9 Nov, no change under `.github/**`, app code or the release path. Workflow changes are proposals in `docs/ops/proposed/`, applied by the founder on or after 10 Nov.

## Requirements
Owner: A agent-doable, F founder-only, C CTO or Karma ruling. "Pre-9" = allowed before 9 Nov under CR-22.

| Id | Maps to | Gap | Statement | Acceptance | Owner | Pre-9 |
|---|---|---|---|---|---|---|
| HV2-001 | RG-1,3,4,8,9 | G1 | `decide(comments, head, now)` succeeds only with counted Review A and B on the head and none failing after; errors fail; never merges | Fixtures #460, #524, #506, #504, #512 pass `node --test` | A | Draft yes, apply no |
| HV2-002 | RG-2 | G1 | A pass counts only with the full 40-char head sha; prefixes report "short sha" | 7-char, 39-char, off-by-one 40-hex fixtures all fail | A | Draft yes |
| HV2-003 | RG-5,6,7,10 | G1 | Owner login only, 180 s pending after a comment, no PR checkout, `statuses: write` only | Lint over the yml; dispatch on 5 open PRs after apply | A drafts, F applies | No |
| HV2-004 | RG sec 7 | G1 | CR-43 and CR-44 are filed in `docs/agents/cto/RULINGS.md` | `grep -c "CR-44" RULINGS.md` is at least 1 | C | Yes |
| HV2-005 | FP-1..4 | G2 | TODAY page, at most 15 lines, line 1 has time and "valid until", no PR titles | FP T1 to T3 | A builds, C rules, F enables | Script yes, cron no |
| HV2-006 | FP-5 | G2 | Other status surfaces become pointers to TODAY | Each file has the pointer; `FOUNDER_QUEUE.md` no longer says 28 Oct | A | Yes |
| HV2-007 | FP-6,7,8 | G6 | `CLAIMS.md` live rows (max 15, 72 h), advisory checker, lossless BOARD archive | FP T5 to T9 | A | Yes |
| HV2-008 | FP-9,10 | G6 | WIP red line (3 per owner, 25 open); sweep printed, never run by an agent | FP T10; list excludes unharvested PRs | A prints, F runs | Yes |
| HV2-009 | FP-11 | G5 | Session end line "decisions given, recorded at" | COORDINATION.md format updated; TODAY line 15 | A | Yes |
| HV2-010 | EG-1,2,3 | G4 | Skip-count guard, expiring allowlist | EG-1 to 3 fixtures; planted `it.skip` turns CI red | A drafts, F applies | Script yes, CI no |
| HV2-011 | EG-4 | G3,G4 | Ledger prints last non-skipped success per release workflow or "never" | EG-4 fixtures; testflight shows `never` | A | Yes (by hand) |
| HV2-012 | EG-5,6 | G4 | `trace.mjs --check` fails on duplicate or undefined ids; B1 P0 uncited count cannot rise | EG-5, EG-6 fixtures | A | Local yes, CI no |
| HV2-013 | EG-7 | G9 | ENFORCEMENT.md rows cite real files; totals true | EG-7 fixture | A | Merge after 9 Nov |
| HV2-014 | EG-8,9; EG sec 6 | G3 | B1 device kit: one sitting, one evidence file ending pass, fail or stop | `evidence-check.mjs` rejects empty rows and name-like strings | A builds, F runs | Yes |
| HV2-015 | ARCH sec 5 | G3 | Build checklist with STOP lines, one-retry rule, build log | Each step has command, expected output, STOP line (script check) | A writes, F runs | Yes |
| HV2-016 | ARCH sec 4 | G3,G10 | Builds used recorded before each build (15 a month; under 3 left is a STOP) | Log has the line before step 6 | F | Yes |
| HV2-017 | SM-4,5 | G7 | Lints: `uses:` is 40-hex; no `pull_request_target` head checkout | SM sec 6 fixture pair, planted failure | A drafts | Script yes, pins no |
| HV2-018 | SM sec 5 | G7 | `dependabot.yml`, `npm audit` job, SHA pins, security updates | Toggle on; files per SM sec 5 | A drafts, F applies | Toggle yes, files no |
| HV2-019 | SM-3,8,9; sec 3 | G8 | No unattended lane until every precondition is ticked | Checklist in `docs/ops/proposed/`; SM-3 lint | F | No |
| HV2-020 | SM-1,2 | G7,G8 | Release secrets only in reviewed environments; credential text adopted | Founder reads environments; text in CLAUDE.md | F | Yes |
| HV2-021 | PRD-3,4,5 | G5 | "Amended by" column and checker; "Capacity" field after a freeze; release-path section first | Checker lists D-100, D-101 until marked | A drafts, F or Karma merges DECISIONS | Yes |
| HV2-022 | PRD-7 | G9 | `ACCEPTANCE.md`: lane checklist, review format, handoff | Page exists and cites HV2 ids | A | No |
| HV2-023 | ARCH sec 9 | G10 | Vercel commercial-use and public-repo questions answered | Founder note in journal | F | Ask yes |
| HV2-024 | SM sec 7 | G7 | CODEOWNERS lines for guards, scripts, release files | Diff reviewed | A drafts, F applies | No |
| HV2-025 | RG sec 9 | G11 | Second identity decision | Decision entry | F | No (10 Nov) |

## Contradictions found, and how resolved
1. Short versus full sha. RG-2 requires 40 characters; the existing grammar and `sameSha` (`page.mjs:36-41`, regex `{7,40}`) accept 7; RG test plan expects #494 (7-char) to succeed. Resolved: full 40 for counting (CR-44 clause 2); #494 becomes an expected "short sha" failure; a FAIL at any matching prefix still blocks.
2. Where TODAY lives. G2 and the retro say `TODAY.md`; FP chooses a pinned issue. Resolved: pinned issue; `TODAY.md` is a pointer.
3. TODAY cron timing. Retro says before 9 Nov; ARCH says no, apply 10 Nov; FP says before if the freeze allows. Resolved: default no (CR-22, CR-5); the founder may ask the CTO for an exception; until then the generator runs by hand.
4. Who files CR-43 and CR-44. Retro implies agents; RG says Karma; `RULINGS.md` is the CTO's. Resolved: Karma or the CTO files; product drafts text from RG section 7 (CR-43 text is U beyond "close #316, hold #326").
5. Review gate required or advisory. Retro: required. ARCH: advisory one week, required 17 Nov. Resolved: advisory first.
6. PR #30. FP's sweep closes it, yet SM cites it as the home of SEC-R03, R08 and R09, and EG says ENFORCEMENT cites it. Resolved: keep #30 (check #26, #32) out of the sweep until harvested.
7. Sweep target. FP line 12 says 0 old PRs after the sweep, but KEEP holds #112, #164, #167, #168 (and #105 needs a look). Target is 4 or 5.
8. `trace --check`: EG puts it in `package.json:11`, ARCH says local first. Resolved: local first.
9. Dependabot: the settings toggle is allowed pre-9 (not a file); the file waits.
