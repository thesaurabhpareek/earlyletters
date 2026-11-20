## Review A at 1a195814e7db88a9ea21cd8bc5018515c4ba10ea: PASS WITH NOTES

PR #520, delta re-review (lens A) of one commit on 366f8564, my last Review A head (A4). Head read from gh api: 1a195814, one parent 366f8564 (`git rev-list --count 366f8564..1a195814` is 1). I read it in a detached worktree (removed after). No must-fix; one sentence in CCO-6 is inaccurate (note 1) and is worth fixing if the head moves again for any reason.

### The delta is one file
- `git diff --stat 366f8564 1a195814`: `docs/agents/exec/RULINGS.md` only, 6 lines added, 6 removed, all inside the CCO-6 entry. No code, string, test or other doc. The tree is therefore the same as 366f8564 outside that file, so my A4 results on source, strings, merge of develop and tests stand.
- Banned characters: the 6 added lines, and the whole CCO-6 section, have 0 non-ASCII characters (so no em or en dash, curly quote, ellipsis character or emoji), no `...`, no `--`, no tab or CR.

### References in CCO-6, resolved at this head
- `apps/mobile/test/erase-all.test.ts`: the describe at line 728 "Erase everything never ends the 24-hour age stop early" holds (a) at 731 (a stopped person reaches no Settings), (b) at 756 (running stop kept as stored), 767 (same after a kill, finished by the next launch), 782 (an expired stop goes), 790 (no Keychain age answer). `age-gate-erase.test.ts` has the 3 hook tests (lines 48, 59, 72). Both claims in the new sentence ("pins the hook", "pin that a running stop survives an erase") are right.
- `store.ts:1042-1046` is the stop-keeping block (comment 1042-1043, read 1044, `stopRunning` 1045, `removeEverything` 1046). `localDeletionAllowed` is `store.ts:939`; the Erase row shows only under it (`settings/index.tsx:147`).
- `docs/store/app-store-staged-1.0-proposal.md:52` says "delete everything, any time, from Settings". `references/checked-facts.md` is `.claude/skills/regulatory-compliance/references/checked-facts.md`, under a `protected` fence glob (`.claude/skills/regulatory-compliance/**`), and has no row for 5.1.1(v) or 2.3.1. `COUNSEL_PACKET.md` has no Erase entry. Terms 8.1 is the "first 2 letters are free" clause. Issue #654 is open and is the DATA_CLASSIFICATION 4.5 and privacy-policy handoff. DATA_CLASSIFICATION rules 1 and 5 are at 1.1 (lines 53, 57) and the `readTogether.sessions.<book id>` precedent is at line 710.
- compliance/README.md checklist: item 2 is "No new collection ... without a DATA_CLASSIFICATION row and a data-minimisation reason", item 3 is facts in `checked-facts.md`; the ruling's "met by substitution" for items 2 and 3 names the right items, and says so openly. Whether a substitution satisfies the checklist is the CCO's and the founder's call, not a code question.
- Apple: I fetched developer.apple.com/app-store/review/guidelines today. 5.1.1(v) reads "If your app supports account creation, you must also offer account deletion within the app" and 2.3.1(a) says misleading marketing "is grounds for removal"; the quotes match. The page text I received shows no "Last Updated" date.
- D-132, D-129, D-083 exist and say what the ruling uses them for. The council record I hold (outside the repo) matches the new "Promises" and "Why" text: the council default was "#520 does not merge" if the founder did not answer, the seats were privacy, legal, compliance, finance, business, marketing, design, product, and the split on the free-letters sentence is as written.

### Does CCO-6 describe the code as I verified it
- Age-gate hook: yes (`age-gate.ts`, unchanged since my A4: it moves the decision only away from `pass`; `decideGate` and `answerGate` untouched).
- Plus line: "only while Plus will renew and not on a Family Sharing phone", store build only: yes (`erasePlusLineShows`, `wipe.logic.ts`). `doneA11y` exists (`strings.en.ts:911`) and the speech model, plan reminders and saved exports do stay.
- The previous Why line ("two counted reviews at the head, CI green") is replaced by "conditions of posting that line, not facts of this text". That closes my A4 note 1.

### Notes
1. Inaccurate: "each key exists only to carry out a deletion the person asked for (... run the one-time vacuum) and is removed when that ends." True for `book.deletedAt.<id>` (removed on Restore, `wipe.ts:49`, and with the book, `wipe.ts:119`), `book.erasing.<id>` (`wipe.ts:119`) and `erase.everything.pending` (`finishEraseEverything`). Not true for `db.secureDeleteVacuumAt`: it is written after the one-time rebuild at the first open of this build, whether or not anyone asked for a deletion, and then stays until Erase everything removes it (`store.ts:198-207`). The class and "none sent" conclusions hold (one L2 time, device only); only the reason is overstated. Suggested wording: "the vacuum key records that the one-time rebuild ran and stays until Erase everything removes it." Not blocking.
2. "the failed line says a late retry also erases what was written in between": the string says the app finishes it the next time it opens and that erases what you add before then. A late press of Erase also does it (verified in A4), but the string is about the next open. Nit.
3. "A DECISIONS.md entry ... is the founder's to merge (D-125)": D-125 item 5 was amended for DECISIONS.md by D-132 (`docs/DECISIONS.md:1021`: Karma merges entries that record the founder's own words; `docs/legal/**` stays his). Nit on the citation.
4. "a registered spec string (content.md 4.11)": the spec file is not in the repository (`strings.en.ts:880` points at proposals/account-security/content.md), so I could not read it; `doneA11y` is in no `REGISTERED` map. Not verified, nit.

### Ran at this head
- `erase-all` 51, `age-gate-erase` 3, `reminders-erase` 2, `billing-alpha` 16: 72 passed. `packages/content`: 12 files, 281 passed. Nothing else rerun: no executable line changed.
- `git merge-tree --write-tree origin/develop 1a195814` (develop is still 1189fdff) is clean, tree c92cdedd.

### CI at this head
Success so far: typecheck, web (typecheck, test, build), install, edge functions, functions-deploy, migrations unchanged, sizes, native files changed, agent team consistent. In progress or queued when I looked: `tests and content rules`, `database rules`, B-8, `web e2e`, `e2e simulator app`, one `store-profile Release launch` (the other is skipped); no `required` result yet. `compliance-fence`: failure plus a cancelled run (no approval line; expected). A PASS holds only once required CI and the store-profile Release launch are green at this exact head and the fence has its approval line.

### Not verified
Any device or simulator run; the unfinished CI jobs; the council record is outside the repo (I compared it, a reader of the repo cannot); counsel's reading of the absolutes and Terms 8.1.

Reviewer: independent of the author (CR-44).
