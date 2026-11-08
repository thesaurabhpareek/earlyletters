# Next: numbering clean-up (BL-737), phase 3, file 09

Status: DRAFT, docs only
Date: Sun 8 Nov 2026 (UTC)
Written by: Product Manager (Claude role). Backlog 08 rank 4, confirmed "as ranked" by the founder on 8 Nov.
This file renumbers nothing, assigns nothing, reserves nothing, posts no comment and merges nothing. It lists what clashes, who holds each side, the order that avoids breakage, and the one line each author session should receive.

How I read: `develop` at caba0215 (the head after #661); the open-PR list and file patches through `gh api repos/thesaurabhpareek/earlyletters/pulls/...` on 8 Nov 2026 (125 open PRs listed over two pages; I read the file patches of the 35 PRs named below, and for the other 90 only the patches of files that define decisions or CTO rulings, plus the 30 oldest for BL, CR, D and S1 definitions); `node scripts/agents/next-id.mjs` and `node scripts/agents/id-collisions.mjs` run on 8 Nov.

Free ids as `next-id.mjs` printed them: `{"BL":"BL-740","D":"D-144","ADR":"0028","APPLY":"32"}`. Caution: the tool counts ids mentioned in the readiness file (#638) and in the roadmap files (#664), so it skips BL-739 and D-143, which no PR defines. Re-run it at the moment of each renumber; the numbers below are today's proposal.

"Last pusher" below is the author of the last commit on the PR head and its `Claude-Session` trailer. The REST commits list does not show who ran `git push`, so treat it as a proxy. Every PR here is opened under the founder's account (`thesaurabhpareek`); sessions are told apart by the trailer.

## 1. What `id-collisions.mjs` reports, and what it misses

It prints one COLLISION: D-139 in #591 against develop. It lists #599 (BL-621 to BL-726) and #621 (BL-727, BL-728) as additions without flagging them against each other. It does not see: bullet-form BL ids (#587 and #591 write `- **BL-621 ...`), CR ids, S1 device-row ids, or a D-entry that is only a heading. So every clash below except D-139 was found by reading patches. The script fix is BL-638 in #587's own list (owner `ai-eng-lead` per the readiness file).

## 2. Every clash found

| # | Id | Holders | What is wrong | Proposed fix | Needs the founder's words? |
|---|---|---|---|---|---|
| 1 | D-139 | develop (positioning A, merged via #572 and #594) and #591 (the alpha letter ceiling, a "delegated, 1 Nov" entry) | Two entries, one number. This is the only COLLISION the script prints | #591 takes D-143. Reasons: the readiness file section 1 says "D-143 today"; D-142 is the Feedback entry (council run of `next-id.mjs` on 8 Nov). Run `next-id.mjs` again at renumber time. #591's own text that says "D-139" for the ceiling (the entry heading, the table row, BL-604, BL-605, the CR-48 body) changes with it | No for the number. The entry is delegated, not the founder's, so it needs none; Karma merges per D-132 |
| 2 | D-140 | #576 only | No clash by number. The entry has "Founder's words: to be pasted by the founder before this merges". Its own note says drafts that cite "D-139" for the alpha true-line mean D-140. Under D-132 Karma cannot merge it without his words | Keep D-140. #576 is a draft | **Yes.** He pastes his 1 Nov reply, or says he gave none (then the entry is rewritten as a delegated call and he merges it) |
| 3 | D-141 | Nobody defines it. Mentioned in #638 (`_AUTHORING.md` row M52: "next free is D-141" for #591) and in the roadmap files #664 | Three written numbers for the same moved entry: D-141 (M52), D-143 (section 1), D-144 (what `next-id.mjs` prints). 08 section 0 says D-141 "clashes"; it does not, it is only mentioned | Leave D-141 undefined until a decision needs it, then take what `next-id.mjs` prints. Change M52 in #638 to say D-143. Correct 08 section 0 ("held in prose, not a clash") in #664 | No |
| 4 | D-142 | Nobody defines it. The Feedback entry is drafted in the readiness file section 6; "no `DECISIONS.md` entry yet" | Not a clash. A number held by two drafts that cite it (#638 and #664) | Keep D-142 for Feedback. If someone defines another D-entry first, the Feedback entry takes the next free number then | **Yes.** The Feedback entry needs his words; I have not written "Founder's words" for him |
| 5 | (new) | Rank 1 of 08 (record that build 12 reverses D-121 item 1) | Needs a D-entry: "id: to be assigned" | Take the next free number when the entry is drafted; do not pre-reserve | **Yes**, this is a founder decision (F1) |
| 6 | CR-48 | #591 ("The alpha letter ceiling: four roles, one ruling") and #592 ("How a PR merges when no second session can post counted reviews"). Merged PRs #589 and #595 already cite "CR-48" for the merge path | Two rulings, one number, both appended to `docs/agents/cto/RULINGS.md` | #592 keeps CR-48. #591 takes CR-53 (CR-49 to CR-51 are in #613, CR-52 is in #655). The cross-citation in #591's D-entry and BL-604, BL-605 changes with it. Karma assigns | No (CTO ruling log, Karma) |
| 7 | CR-49 | #613 twice: the ruling in `cto/RULINGS.md` and a copy in `docs/release/build-9-record.md` | Not a clash: the second is the same ruling repeated | Keep. The two texts must stay identical | No |
| 8 | CR-49, CR-52 (as the founder cited them) | #613 CR-49: "The next TestFlight build goes from `develop` on the Mac now ...". #655 CR-52: "The three consent-record PRs: rerun the database job, merge in order after the go/no-go" | 08 section 5 says the founder cited CR-49 and CR-52 as the merge rule ("a go that names the PR and its full head sha"). Neither heading says that. The heading that does is **CR-44** in #555: "One merge owner per PR, and the gate binds to the head sha" (my reading of the headings only; I did not read the bodies) | Do not renumber. Ask the founder which rule he meant and cite that id in 08 | **Yes**, a one-line answer: which CR he means |
| 9 | CR-36, CR-43, CR-44 (and CLO-2, CCO-3) | #454 (CR-36, CLO-2, CCO-3) and #555 (CR-43, CR-44). Develop has CR-37 to CR-42, CR-46, CR-47 and no CR-36, CR-43, CR-44, CLO-2, CCO-3 | Gaps in the log, not clashes | Leave | No |
| 10 | BL-621 to BL-638 | #587 (18 listing follow-ups, bullet form) and #599 (BL-621 to BL-726, 106 headed items). #603 and #638 cite #599's meaning of these ids | Same 18 numbers, two meanings. The script misses #587 | Merge #599 first. #587 renumbers its 18 items to BL-739 through BL-756 (BL-739 is undefined anywhere; `next-id.mjs` prints BL-740 because the readiness file mentions BL-739; if it prints higher at renumber time, use the next 18 it gives). #587 fixes the citations in its own text (20 lines mention these ids; no other file on develop does). #587's "D-139" mentions mean positioning A and stay | No |
| 11 | BL-729 to BL-738 | Reserved in prose by #638 (Feedback BL-729 to BL-733, BL-734 to BL-738), not on develop | Not a clash. They are held, not defined | The BACKLOG rows go in only after #587 and #599 settle (readiness file). Product adds the 08 rows after the #587 renumber so `next-id.mjs` sees BL-757 onward | No |
| 12 | BL-727, BL-728 | #621 | No clash with #599 (ends BL-726) | Leave | No |
| 13 | BL-604, BL-605 | #591 only (bullets). Develop ends at BL-603; #599 starts at BL-621 | No clash. They cite D-139 and CR-48, which change | Text edit only (rows 1 and 6) | No |
| 14 | S1-39 | Develop (from #611, "Full disk and a long take", PR #595) and #615 ("Listen never sticks on finishing ...") | Second `### S1-39` heading at the same place. #618 uses S1-40 for its own row | If #615 survives (Karma picks #615 or #618), it folds its steps into the existing S1-39 or takes a free number. If #618 survives, #615 closes and nothing changes | No |
| 15 | S1-15, S1-17 | Reported as duplicated on develop | **Not reproduced.** At caba0215 `docs/qa/DEVICE_TEST_PLAN.md` has one heading each (lines 209 and 253). No other file defines them; they appear only as citations in the PRD, the run sheets, `release-test-catalog.csv` and `scripts/qa/release-catalog.rows.mjs`. A strict check of `###` headings in `docs/qa/` finds no duplicate | Ask the reporter where the second one is. If no answer, close BL-737's third part as "not found". `qa` adds a heading-only duplicate check so a citation is not counted | No |
| 16 | S1-50 to S1-74, S1-95, S1-112, S1-133 | #603 (S1-50 to S1-74), #614 (S1-95), #635 (S1-112), #520 (S1-133) | No clash with each other or develop. The numbers jump | Leave | No |
| 17 | ADR numbers | Develop ends 0027 (plus an odd 0101); no open PR adds a file under `docs/adr/`. 0027 and 0028 are mentioned in text only | No clash. The roadmap files cite "ADR 0028" only as the tool's printed value | Leave | No |
| 18 | APPLY.md file numbers | Develop ends File 27. #424 adds File 28, #634 File 29, #636 File 30, #637 File 31. `next-id.mjs` prints 32 | No clash. #634, #636, #637 are in the order #655 (CR-52) sets | Leave | No |
| 19 | Text overlap, not ids | #591, #592, #613, #655, #555, #454 each append to the end of `docs/agents/cto/RULINGS.md`. #587, #591, #599 each append to `docs/BACKLOG.md` | Git will report a conflict on every merge after the first, though the ids differ | The rebase is mechanical: keep both blocks. Say so in each comment | No |

PR state on 8 Nov: #587, #591, #599 and #615 report `mergeable_state` dirty (they conflict with develop already); #618 is dirty too.

## 3. Who holds each PR

| PR | Title in short | Head sha | Last commit author | Session (trailer) | Last commit time (UTC) |
|---|---|---|---|---|---|
| #591 | D-139 alpha ceiling, CR-48, CPO-2 | 72e62dce | Claude | session_01NBzZMdFrvcifyquTUAekLF | 1 Nov 15:58 |
| #592 | CR-48 merge path | 278448ba | Claude | session_01G82fpvmhkCHqPdHjs5uFjY | 1 Nov 15:59 |
| #576 | D-140 alpha true line (draft) | 92b72116 | Claude | session_01HU2L2FzMX2YpAWfj6Jfpxt | 1 Nov 15:47 |
| #587 | 18 listing follow-ups | 1c7dd686 | Claude | session_011xCXvx37XsvvmuLFjMVDGJ | 1 Nov 16:07 |
| #599 | M14 account, Settings and experience, BL-621 to BL-726 | 6e8498a4 | Claude | session_01G82fptTnv2meo7WKb4HBUo | 1 Nov 16:07 |
| #603 | QA cases for the 1 Dec items | 7df08a94 | Claude | session_01G82fptTnv2meo7WKb4HBUo | 8 Nov 08:32 |
| #613 | Build 9 record, CR-49 to CR-51 | 4510384a | Saurabh Pareek | no trailer | 2 Nov 07:28 |
| #655 | CR-52 consent PRs | 81b260a5 | Claude | no trailer | 8 Nov 17:07 |
| #615 | BL-563 finishing keeps Review | 2553f9d6 | Claude | session_01VLD3hfmGpx2xBZEd1dKgTa | 8 Nov 08:40 |
| #618 | BL-563 and BL-564 follow-ups | 06b9cd02 | Claude | session_01NBzZMdFrvcifyquTUAekLF | 8 Nov 09:12 |
| #638 | PRD V2 readiness (owns `docs/prd/v2/`) | 8f660a2b | Claude | session_01WsZfAr14RMFfiXXQyKD8VR | 8 Nov 17:11 (the list shows activity at 21:58) |
| #664 | Roadmap files 00 to 08 | 79dd928b | Claude | session_01WsZfAr14RMFfiXXQyKD8VR | 8 Nov 22:18 |
| #520 | Delete a book, erase everything (S1-133) | ae39522a | Karma | session_01NBzZMdFrvcifyquTUAekLF | 8 Nov 21:47 |

Sessions 01NBzZ... (#591, #618, #520), 01G82fpt... (#599, #603, #614) and 01G82fpv... (#592, #621, #634 to #637, #656) each own several of these. Where a session is not running any more the comment waits for the next session that picks the PR up. Before anyone pushes to one of these branches: check the last pusher and the time, and stop if it is not yours and under 30 minutes old (the shared rule). This file pushes to none of them.

## 4. Safe merge order

Numbered; each step lists what must be true first. Nothing here merges anything: each merge needs a go from the founder that names the PR and its full head sha, as he stated it.

1. **#592** (CR-48 keeps its number). No id dependency. Rebase the tail of `cto/RULINGS.md` if #613 or #655 went first.
2. **#613, #555, #454, #655** in any order; all only append to `cto/RULINGS.md` (rebase each; no id changes). #655 needs the consent PRs #634, #636, #637 in order after the 9 Nov go/no-go, so its text, not its merge, is time-bound.
3. **#599** before #587. It is the larger and its items cite each other. It conflicts with develop (dirty): rebase first.
4. **#587** after #599, renumbered to BL-739 through BL-756 in the same PR (a push to the branch by its own session).
5. **#591** after the founder's call on the rows it touches (BL-604 is "ready after Mon 9 Nov"). Renumbered to D-143 and CR-53 first. Merge after #599 and #587 so the three BACKLOG appends are resolved once each.
6. **#576** only after the founder pastes his words (row 2). Independent of the others by number.
7. **#615 or #618**, not both. The loser closes. If #615 is chosen, it fixes the S1-39 heading before merging.
8. After steps 3 to 5, run `node scripts/agents/id-collisions.mjs`: it must print no COLLISION line. Then product adds the 08 rows to `docs/BACKLOG.md` with ids from `next-id.mjs` (BL-757 or higher).

## 5. The comment each author session should receive

One line each. I posted none. Replace the numbers if `next-id.mjs` prints something else on the day.

- **#591:** "Before merge, renumber: your D-139 is taken by positioning A on develop, so use D-143 (run `node scripts/agents/next-id.mjs` first); your CR-48 is taken by #592 (merged PRs #589 and #595 cite it), so use CR-53; change every citation inside this PR (the entry, BL-604, BL-605, the CR body) and keep the founder-words status as it is."
- **#592:** "Keep CR-48; #591 will move to CR-53; if #613 or #655 merge first, rebase the end of docs/agents/cto/RULINGS.md and keep both blocks."
- **#576:** "Keep D-140; do not merge until the founder pastes his 1 Nov words or says he gave none (D-132), and tell any draft that still says D-139 for this line that it means D-140."
- **#587:** "Merge after #599: renumber your 18 items BL-621 to BL-638 to BL-739 to BL-756 (re-run `node scripts/agents/next-id.mjs` first), fix the 20 lines that cite them in this PR, and leave the D-139 mentions alone, they mean positioning A."
- **#599:** "No renumber needed, you merge first among the BACKLOG PRs: rebase on develop (it reports dirty) and keep BL-621 to BL-726 as they are, because #603 and #638 cite them."
- **#603:** "No change: your BL-621 to BL-726 follow #599's numbering, not #587's, so do not follow #587 when it renumbers."
- **#613:** "No clash: CR-49 to CR-51 stay; keep the CR-49 text in build-9-record.md identical to the ruling, and rebase the end of docs/agents/cto/RULINGS.md if #592 merges first."
- **#655:** "CR-52 stays; rebase the end of docs/agents/cto/RULINGS.md if #613, #592, #555 or #454 merge first."
- **#615:** "Your `### S1-39` heading duplicates the S1-39 that #611 put on develop: fold your steps into that row or take a free S1 number before merge; #618 already uses S1-40; only one of #615 and #618 survives."
- **#618:** "Keep S1-40; wait for the pick between #615 and #618, and if #618 is chosen close #615 rather than renumbering."
- **#638:** "In `_AUTHORING.md` row M52 say D-143, not D-141, for #591's moved entry, so it matches section 1 of the readiness file; D-141 is not a clash, only unused; the S1-15 and S1-17 duplicates were not reproduced at caba0215 (one heading each at lines 209 and 253)."
- **#664:** "In 08 section 0 change 'D-139, D-141, D-142 clash' to 'D-139 clashes; D-141 and D-142 are held in prose only', and name CR-44 (#555) if that is the merge rule the founder meant, since neither CR-49 (#613) nor CR-52 (#655) says 'names the PR and its head sha'."

## 6. What needs the founder's own words

1. D-140 (#576): paste his 1 Nov reply, or say he gave none.
2. The Feedback entry (D-142): his words. The draft sits in the readiness file section 6; it says "Founder's words" nowhere and I have not added it.
3. The build 12 route entry (backlog 08 rank 1, F1): a new decision entry.
4. Which CR he meant by "CR-49 and CR-52" for the merge rule (row 8). If he meant CR-44 (#555), say so in one line.
5. Not his words, but his call: which of #615 or #618 survives (Karma may pick).

## 7. What is NOT verified

- Last pusher is the last commit author, not the person who pushed. I did not read the PR bodies of #587, #599 or #615 in full (I counted mentions only).
- The bodies of CR-44, CR-49 and CR-52. I read headings and the first lines of the patches only.
- The open PRs I did not name: `id-collisions.mjs` reads all of them for D, ADR, APPLY and BL headings, and I scanned the first 100 of the list (newest) for `RULINGS` and `DECISIONS` edits and the 30 oldest for new D, CR, BL, ADR and S1 definitions (none found). Bullet-form BL ids and S1 ids in the middle band of the list (about 60 PRs, mostly harness work of 28 Oct to 1 Nov) were not scanned.
- Whether any hosted environment, doc or script cites #587's old ids. Develop has none (searched `*.md`, `*.mjs`, `*.ts`, `*.json`); the Project doc store was not searched.
- Where the S1-15 and S1-17 duplicates were seen.
- Drafts outside the repo (the Project doc store) that still say D-139 for the alpha true line; the bodies of #502, #437 and #459 contain no "D-139".

Product Manager (Claude role). Not a decision; the founder decides.
