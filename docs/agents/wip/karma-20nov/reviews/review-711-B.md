## Review B at d8b7ace185f6627fd25e5512a85a40c707567df7: PASS

Lens B, delta re-review of PR 711 (one commit on 606531af; one file, `docs/ops/runbooks/data-requests-by-email.md`, still 277 lines; 5 lines changed, 5 added). Both of my last two notes are taken and reviewer A's three small edits are sound. No must-fix, no open note. Line numbers are lines of the runbook at this sha.

**Ran.** `git diff 606531af..d8b7ace1` read in full. At this sha: non-ASCII grep 0 hits (no em or en dashes, curly quotes, ellipsis, emoji); the PR diff lists only `docs/ops/README.md` and the runbook, nothing under `docs/legal`; no secret; "Early Letters" only in the proposed reply (:107); `docs-leak-guard` clean; `packages/content` vitest 367 tests pass; merge-tree with develop (6cd2223b) clean. CI when I looked: B-8, install, applied migrations and a new `compliance-fence` check success; typecheck, Deno, `database rules` and `tests and content rules` still in progress. A PASS holds only once required CI is green at this exact head.

**My two notes.**
1. *Tags are hex, never a word, and values go in last* (:169). This is the right rule, and I tested why. I took the published block, and a name that quotes the published placeholder, `X$<tag3>$;z int:=1;--` (21 characters), then filled it two ways on the repo's PGlite harness. Tags filled first and the id, address and name pasted last (the order the runbook now requires): ok, and the name is stored literally as typed. Values pasted first and then a find-and-replace of `<tag3>`: the replace turns the name's own text into the closing marker, the extra declaration runs, and the stored name becomes `X`. So the "never run a find-and-replace after pasting" sentence closes a real route that the no-dollar-sign rule (:160) would also have caught; having both is correct. PGlite, not hosted; the runbook says so (:192).
2. *A refused attempt is recorded in the log file only* (:189). Clear, and it matches the block: a refused run writes no `ops.audit_log` row (tested last round).

**Reviewer A's edits.** The lawyer, court or police row (:49) now says no action, no disclosure and no reply until counsel says so, which overrides the section 1 first reply for that row (the preface at :42 says "unless a row says otherwise") and keeps the date in `legal_date`. Right: an early acknowledgement to a legal letter could commit the founder before counsel has read it. The Terms 4.4 quote (:50) now starts with a capital "If" and matches `docs/legal/beta/terms-0.9.0.md:68` verbatim (checked with `grep -c`, 1 hit). Row 1 (:46) now takes the kind of the route its request goes on through, so a request that carries a child's name is logged as what it asks, not as `other`.

**Still holds from earlier rounds.** The unfilled block is a syntax error; the id and the verified address are checked together in the transaction; random tags make crafted names inert; the log has no person id; the Route 1 reply is neutral; the safety row sends the pointer to help first.

**Not verified.** The `auth.users.email` join and the block on a hosted project and in the SQL Editor (and whether it keeps history); how the founder sends as hello@; Apple's screens; whether the purge worker is deployed; `tsc` (docs only).

Reviewer: independent of the author (CR-44).
