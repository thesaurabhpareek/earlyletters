# Founder decision briefs, 28 Oct 2026

Status: eight of the nine questions are open for the founder (b to i). Brief (a) was answered on 30 Oct for the spend (D-127: no paid inference, the GitHub-hosted harness stays off); its preconditions still hold if one is ever switched on. None of the eight is decided by these files. Each brief gives the question, the options, the evidence, the cost or risk of each option, a recommendation (labelled as one), what happens if nobody answers, and the date it is needed by. When the founder answers, the coordinator records any D-id in `docs/DECISIONS.md`; these briefs are not edited into decisions.

Dates are tied to the alpha go/no-go, Mon 9 Nov 2026. The founder confirmed on 30 Oct the build 2 freeze (Tue 3 Nov 2026) and the go/no-go (Mon 9 Nov 2026) (D-130). The go/no-go had been proposed as Thu 5 Nov, and D-124 in PR [#340](https://github.com/thesaurabhpareek/earlyletters/pull/340) (merged in 46a75a3) first had it as Thu 5 Nov; D-130 superseded that date and D-124 now reads Mon 9 Nov. The two pinned links ([1.0.0.md:14](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/release/1.0.0.md#L14), [1.0.0.md:108](https://github.com/thesaurabhpareek/earlyletters/blob/e7d96d588c37ef1661ec21c6474302125cf2b851/docs/release/1.0.0.md#L108)) show the Thu 5 Nov proposal as it stood on 28 Oct. The needed-by dates below that were Thu 5 Nov are now Mon 9 Nov; if the founder moves the dates again, they move with them.

Read against `develop` at `e7d96d58` (28 Oct, 13:53 UTC). Line links are pinned to that commit so they do not drift. [#340](https://github.com/thesaurabhpareek/earlyletters/pull/340) (open, not decided) also proposes D-121 and D-124, which would answer briefs (d), (f) and (i) if recorded; those briefs say how.

Prepared by retro work package R1-09 (IMP-04, IMP-05, IMP-36, IMP-46, IMP-47, IMP-49, IMP-51, IMP-68). Conflict of interest: the session that commissioned the retro built the agent harness and wrote issue #127, which briefs (a), (b) and (i) are about.

| Brief | Question | Needed by | Default if unanswered |
|---|---|---|---|
| [a](a-harness-actions-lane.md) | How and when to turn on the rebuilt harness (the founder has said keep it and make it strong). Answered 30 Oct for the spend: D-127 | Mon 9 Nov | Rebuild packages proceed; unattended runs stay off |
| [b](b-pr-316-roster-credit.md) | PR #316: five agents onto Claude Code for the API credit expiring 3 Nov | Fri 30 Oct | #316 spends nothing; the credit lapses |
| [c](c-d117-founder-class-merges.md) | D-117: may the coordinator merge founder-class paths after two lens passes | Mon 2 Nov | The coordinator's rule stays, with nothing enforcing it |
| [d](d-analytics-v1.md) | Analytics in v1.0 | Mon 9 Nov | Off in every build; the record stays ambiguous |
| [e](e-sync-conflict-note.md) | Sync conflict note: build it, or descope and tell testers | Fri 30 Oct (build) or Mon 9 Nov (descope) | Build 2 keeps copies nobody can see; testers not told |
| [f](f-plan-backup-gate.md) | `plan.ts` gates backup on Plus against D-111 item 6 | Mon 9 Nov | The gate stays, unreached while backup is off |
| [g](g-task-53-d-id.md) | Record coordinator task #53 (the M17 later-words rule) as a D-id | Mon 9 Nov | The rule lives only in F14 and the go/no-go |
| [h](h-pr-302-website-child-name.md) | PR #302: what is still open after D-118 | Before the site or alpha link is promoted | #302 stays open; the live site keeps the fictional family |
| [i](i-v1-scope-record.md) | Which record states v1.0 scope: #127, D-100, the go/no-go, or `eas.json` | Mon 9 Nov | D-100 governs on paper; #127 stays open and cited |

Not covered: the website analytics PR #309 (another session's memo covers it).
