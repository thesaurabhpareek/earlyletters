## Review A at 7d591cb55bed6168385bd43a58abdc66b1e8999f: PASS WITH NOTES

Lens A (is every claim in the diff true; does the backlog still parse and dispatch). This replaces my CHANGES at fa66f486. Head confirmed 7d591cb5: two commits on base a46ae06f, which is still the current origin/develop tip (re-fetched). Diff vs develop is `docs/BACKLOG.md` lines 3008 and 3009 only; the rest of the file is identical to develop (diffed with those lines removed). The delta since fa66f486 is those same two lines.

**My two must-fix items, ruled.**
1. Resolved. "which he accepted" and "subject to the founder" are gone. The body now reads: "Karma recommended S1 on 9 Nov 2026 and the founder accepted S1 (see Status). The reasons are Karma's, and the founder did not see them in the list he answered: ... Karma's plan is to have it fixed before the 1 Dec submission." Acceptance is limited to S1; the reasons and the 1 Dec date are Karma's.
2. Resolved. "ruled" and "decided" appear nowhere about BL-816 now (grep of lines 3007-3032, and repo-wide for "ruled S1" / "founder ruled": no hits). "Accepted" is used in the Status, the Severity field ("accepted by the founder on 9 Nov 2026; see Status"), the release-scope sentence and Satisfies ("the founder accepted S1 on 9 Nov 2026 (see Status)"). The C0 to C1 reading is labelled "Karma's reading of those documents, not something he said", and the text says he "did not name BL-816 or the C0 to C1 step". "with the CPO recommending" is removed.

**My notes, ruled.** D-125 reason: dropped from the body, now just "No D- entry has been made" (true; no hit in DECISIONS.md). B2-18: now named among the gates. CPO phrase: gone. "No object a gate reads": now stated outright (next section). Legend departure and the TestFlight/first-person wording: still as before (nits 4 and 5).

**New text checked.**
- Quoted list item and reply, "(Pacific)", "he did not name BL-816": chat only; I took them from the coordinator and could not check them.
- RELEASE.md 5.4 (line 198) and TF-09 (lines 1123-1124): C0 to C1 needs no open S0; submission needs no open S0 or S1. True, and now labelled as read from those documents.
- "the repo has no `S0` or `S1` label (BL-005, FT-20; checked 10 Nov 2026)": direct lookups `repos/thesaurabhpareek/earlyletters/labels/S0`, `/S1`, `/S2`, `/S3` and `/beta` each return 404 today. BL-005 (BACKLOG.md:129-130) lists "labels `inbox`, `bug`, `idea`, `beta`, `S0` to `S3`, `approve-migration`" as remaining (needs-founder, FT-20; FOUNDER_TASKS.md:221). True. (`inbox`, `bug`, `idea`, `approve-migration` do exist, so BL-005's list is partly done; the row's claim is only about S0 and S1.)
- "no GitHub issue names BL-816": I paged all 763 items (48 issues): 0 issues name BL-816 in title or body; 0 issues carry an S0 or S1 label; the issue search including comments also returns 0. True.
- "a gate check run from the issue list will not see this row": follows from the two facts above.
- "stays an open S1 ... until S1-166 has been walked and passed": labelled as Karma's reading; consistent with the S1-166 Update line (BL-816's phone check closes when the step is walked). "passed" is the stricter wording, which is the safer one.
- Anything beyond the diff that now reads stale: none found. "S1 proposed", "unruled", "until ruled" appear nowhere in the repo.

**Ran at this head.**
- `node scripts/agents/check.mjs`: 397 tasks, consistent, exit 0. Agent and trace tests: 170 pass, 0 fail. `node scripts/qa/release-catalog.mjs --check`: exit 0.
- `parseBacklog`, develop vs head, every key of every record (397 each): one difference, BL-816 `statusText` (1692 to 2496 chars). BL-816 reads status done, owners ['mobile engineer'], mode agent, dependsOn [], blockers []. The text has none of "Mode:", "Owner:", "Milestone:", "Size:", "Depends on:". `eligibility()` over all 397: no differences (125 eligible both).
- Added lines: 2; bytes >= 0x80: 0; no `...` or `--`. `git merge-tree --write-tree origin/develop 7d591cb5`: clean, exit 0.
- PR body (re-read): matches the row. It says "accepted", quotes his words and the list item, says he did not name BL-816 or the C0 to C1 step, labels the C0 to C1 and "open S1" readings as Karma's, gives the label and issue facts above, and lists the removed phrases. Its "no remaining 'S1 proposed' in docs/" is true.

**Must-fix.** None.

**Notes (should fix, none blocking).**
1. The row and body say the gates "(TF-09, B2-18, RT-REL-12) read an issue list with labels". B2-18 ("Issue list with labels") and RT-REL-12 ("the issue list") say so; TF-09's own text (DEVICE_TEST_PLAN.md:1122-1125) does not name an issue list or labels. FOUNDER_TASKS FT-32 (line 336, "file issues with `beta` and `S0` to `S3` labels") and TDD 07 11.3 do. Suggest "(B2-18, RT-REL-12, FT-32; TF-09 is checked from the same list)".
2. The PR title "BL-816 severity is S1 (the founder, 9 Nov)" will become the squash commit title (#753 merged that way) and reads like the ruling the text now avoids. Suggest "(accepted by the founder, 9 Nov)".
3. "the founder did not see them in the list he answered" is scoped to the list and is only as good as the statement that the item was verbatim and complete; I cannot check what else he saw in chat.
4. The legend still puts anything that can lose a word at S0, and the row now holds an S1 against it without saying the acceptance departs from the legend for this item.
5. Carried from #753 and unchanged: "in no TestFlight build yet" is undated and the Status still uses first person ("I found", "I did not check"). Optional: a D- entry with his words verbatim (D-132 lets Karma merge those) would give the record a home outside a backlog row.

**CI at 7d591cb5 when I looked:** agent team consistent, applied migrations unchanged, compliance-fence (one cancelled, two success), edge functions, install, no e2e seam, typecheck: success. database rules and tests and content rules: in progress. No `required` row yet; `mergeable_state` blocked (pending checks, mergeable true). A PASS holds only once required CI is green at this exact head.

**Not verified.** The founder's reply and the status message (chat only); the "(Pacific)" time; whether any alpha gate beyond RELEASE.md 5.4 and TF-09 applies (B2-18's status is `open` in a doc last checked 27 Oct); full `npm test` (docs-only diff); issue comments beyond the search result.

Reviewer: independent of the author (CR-44).
