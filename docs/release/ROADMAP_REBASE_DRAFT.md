# Roadmap rebase draft: what three documents should say after the alpha

Owner: product manager (a draft for the founder and the coordinator). Written 28 Oct 2026 (RB-33), against `develop` 6bfb94a9. **This is a draft. It changes nothing.** `docs/ROADMAP.md`, `docs/backlog/FUTURE.md` and `docs/release/1.0.0.md` stay as they are until after the alpha's go/no-go; this file says what each should say then, so the edit is a copy job and not a research job.

Sources: `docs/qa/ALPHA_GO_NO_GO.md` (status checked 27 Oct 2026, 3:42 PM PT, `develop` bbac5ec), `docs/DECISIONS.md` D-106 to D-117 (D-118 and D-119 also read, they change little), and the three documents themselves. Marks: V = read in the file or the GitHub API for this draft, I = my inference, U = not verified.

## 0. The rules this draft follows

- **No invented dates.** Every date below comes from a source. A date the source calls a proposal is written "proposed, founder confirms" here. Where the source has no date, this draft says "not set" and does not suggest one.
- **The founder's dates are not confirmed in the repo.** The freeze (Tue 3 Nov 2026, 5:00 AM PT, 13:00 UTC; D-089's proposed move) and the go/no-go (Thu 5 Nov) are the coordinator's proposals; build 1's proposed Mon 26 Oct passed with no build; the founder's answer, asked for by Sat 24 Oct 5:00 PM PT, is not recorded in the repo (ALPHA_GO_NO_GO, header; V). D-106's own target for the alpha was Thu 29 Oct 2026, a founder decision that the proposals replace only if the founder confirms.
- **After the go/no-go, every date moves once, on one page.** The three documents should not each carry their own copy of the schedule. Proposed: `ROADMAP.md` holds the dates and the other two point to it.

## 1. Facts that changed since the three documents were written (V unless marked)

| Fact | Source | Documents it makes stale |
|---|---|---|
| The plan of record changed from "submit the week of 2 Nov" to "alpha first, then re-plan the submission". D-106 (founder, 15 Oct): option B ships as a TestFlight alpha against staging, target Thu 29 Oct; submission re-planned after the alpha | D-106 | ROADMAP (target, sections 2 and 3), FUTURE 1.1, 1.0.0 section 0 (already says "re-planned") |
| Server features are in v1.0: sign-in, sync, co-parent sharing, encrypted recording backup, status report and reminder emails | D-100 (founder, 13 Oct) | ROADMAP section 7 "Not in v1.0" lists backup and restore; FUTURE OPEN-02 |
| Full v1.0 scope kept and the date moves; PRD V2 `08-delivery.md` is the plan of record and the product spec | D-101, D-105 | ROADMAP as a whole (its scope list and 30-day path predate PRD V2) |
| Backup keys are recoverable through server escrow, copy says so; a device enrolled 7 days approves a restore | D-102, D-108 | ROADMAP section 7; FUTURE OPEN-02 |
| A free letter counts only when it is the author's own, has words, and is kept from Review | D-103 | ROADMAP "Read together (3 free sessions per book)" is a different count; check against PRD (U) |
| The coordinator merges app code after two independent reviews and green CI; D-117 (founder: "Everything is approved...") widens it, by the coordinator's operating rule, to database, auth, payments, `.github/**`, release config, engine files and the alpha queue's production deploys. Steps only the founder can do stay the founder's | D-107, D-117 | ROADMAP "coordinator merges" wording, 1.0.0 section 4 "founder merges" |
| Alpha calls: English-only transcription; fictional family only on `main` (item 1 superseded for `apps/web/src/content/site.ts` by D-118); kill test on the runner with a Mac fallback; held-draft sync on in build 2 | D-111, D-118 | ROADMAP's seven languages and "device spikes" |
| Pack release is a build 1 prerequisite; `release` defaults to `--languages en`; a non-English pack ships only when a native reviewer and the founder say so | D-115 | ROADMAP's seven languages "each only if it passes week 2"; FUTURE CVL-02 timing |
| Build 2 hides Leave; left books listed before build 3 (BL-444); the invite text keeps the child's name | D-113 | ROADMAP "co-parent invites"; FUTURE FAM items |
| Former members' letters survive the book purge | D-116 | none stated; for the privacy and deletion rows of FUTURE |
| Database p95 budgets run on the nightly only; a budget-only red is advisory for B2-22 | D-114 | 1.0.0 section 2 "nightly" row |
| Engine open calls: D14 character rule stays; "mm" offered in Review | D-112 | none |
| The recording container is ADTS for every iOS build cut from `develop` from #293 (merged as bbac5ec, Tue 27 Oct 3:38 PM PT); the line goes back to `'m4a'` before Tue 3 Nov 13:00 UTC if DL-06's V1, V3 or V4 fails | ALPHA_GO_NO_GO row B2-11; ADR 0027; D-117 | 1.0.0 sections 1 and 4 say #293 is "in review" |
| The launch crash since 4 Oct was found by the kill harness and fixed (#276); a Release launch check runs on every mobile PR (#284) | ALPHA_GO_NO_GO | ROADMAP's whole "None of it has run on a real iPhone" read |
| Staging and production do not exist as hosted projects; no build exists; no founder step F01 to F05 is visible in the repo | `docs/release/ENVIRONMENTS.md`; B1-1; 1.0.0 section 1 | ROADMAP weeks 1 to 3 (FT items, C0, C1, Beta App Review) |
| The 15 Oct to 29 Oct C0 and C1 beta (Beta App Review Thu 15 Oct, C1 from Mon 19 Oct) did not happen as planned; there is no build (B1-1) | ALPHA_GO_NO_GO | ROADMAP sections 0, 2, 3, 4, 5 (risks 7, 8), 9 |
| Work paused from Sat 24 Oct 5:10 AM PT to Tue 27 Oct 1:00 PM PT (usage limit); the nightly kill runs for 25 and 26 Oct did not happen | ALPHA_GO_NO_GO header | 1.0.0 (uses "twice a week" refresh) |
| Drift after the sources: #296 (words arrive later through Review) merged 28 Oct 01:54 UTC; #129 closed unmerged; #109, #110, #112 and #30 still open (V, GitHub API) | API | 1.0.0 sections 4 and 6; B2-7 row |
| D-118 (website names the child, one file) and D-119 (logo round 4) are decided | D-118, D-119 | FUTURE and ROADMAP do not mention them; ROADMAP 2.1's "fictional family only" guard is narrowed for one file |

## 2. `docs/ROADMAP.md` (version 2.1, 3 Oct 2026) should say

Do not edit it now. After the go/no-go, issue **version 3.0**, with this shape.

**Header.** Version 3.0, date of the go/no-go record, "supersedes 2.1". Replace the 30-day path (Mon 5 Oct to Wed 4 Nov) with a two-lane plan: the alpha (builds 1 and 2) and the store lane (release candidate, submission, review).

**Target (replace the bold target line).** "App Store submission is not dated. It is re-planned from the alpha's go/no-go (D-106). Alpha dates, all proposed, founder confirms: freeze Tue 3 Nov 2026, 5:00 AM PT (13:00 UTC); go/no-go Thu 5 Nov 2026. D-106's founder target was Thu 29 Oct 2026." Once the founder has decided, replace "proposed" with "confirmed on <date> (decision id)". The release date "Mon 16 Nov" and buffer "9 to 20 Nov" must be removed, not carried: they were computed from a 2 Nov submission that no longer stands. **No replacement is proposed here.** The re-plan is the founder's and the coordinator's after the go/no-go, and needs the lead times in the "cannot be compressed" table (still valid, section 2.5 below).

**Section 0, the honest read (rewrite).** Say, from ALPHA_GO_NO_GO and 1.0.0:
- Code is ahead and the date is set by things only the founder, Apple and real phones can do. This sentence holds. The next sentence does not: replace "None of it has run on a real iPhone or against a configured Supabase project yet" with the current truth: still true on 27 Oct (no build, no staging), but the kill harness now runs on a macOS runner and found and fixed a launch crash (#276).
- Build 1 can go to Family and Friends when B1-1 to B1-9 and B1-11 pass. Build 2 is **no-go** as of 27 Oct: R-17 not passed (B2-12), staging does not exist, no build 2 drill has run.
- The largest risk is still 5.1.1(ix) (D-004); keep it. Under D-100 nobody outside the founding family signs in until R-17 passes.
- Drop "The C1 beta is short" and the ten-day arithmetic. There is no C1 beta; the alpha's Family and Friends build 1 and build 2 replace it, and D-045's three weeks with 15 to 25 families is a question the re-plan has to answer (U: whether D-045 still stands after D-106).

**Section 1 (what changed).** Replace with "What changed since 2.1", with the table in section 1 above, cut to the rows that change a decision.

**Sections 2 and 3 (five weeks, critical path).** Remove the FT-numbered week table and the day-by-day chain, which are all dated and all past. Replace with two short lists:
1. The alpha's critical path as 1.0.0 section 6 states it, in order: confirm or move the proposed dates; build 1's five steps in `TESTFLIGHT.md` (pack release D-115 before the build); AF-05 default branch, AF-02 and AF-03; staging (AF-06, AF-07, AF-13) and the R-17 run and sign-off; whether build 1 waits for #293 (now moot: merged); #129 (now closed).
2. The store lane, from 1.0.0 section 5, with "not started" and no dates.

**Section 4 (cannot be compressed).** Keep. It is about lead times, not dates. Edit the "Beta App Review" row (submit Thu 15) and the "C1 real use" row (10 days) to say they apply to the alpha's external build, with no date.

**Section 5 (risks).** Re-rank from the go/no-go rows. Proposed changes, each from a source:
- Add: founder steps F01 to F05 not done, no build; the proposed 26 Oct passed (B1-1).
- Add: the kill-harness gate run belongs to the freeze night; if DL-06 fails the container goes back to M4A and the freeze gate needs a recorded decision to amend 07's playable rule (B2-11).
- Add: staging does not exist, R-17 sign-off is the founder's (B2-12, B2-16).
- Add: AF-05 (default branch) not done, so the nightly never runs (B2-22).
- Remove or restate: risk 4 (security fixes before C1): BL-330, BL-347, BL-322, BL-331, BL-349 are merged (#139, #140, #184, #211), the gate is not passed.
- Restate, do not remove: risk 2 (speech on the SE 3, unmeasured) stays until a device runs it (DL-06, AL-02), with the English-only scope (D-111, D-115).
- Keep risk 6 (5.1.1(ix)), 9 (trademark), 12 (non-English fillers, now moot until D-115's reviewer exists), 13 (age signal).

**Section 6 (cuts).** Keep. Add the cut that already exists in the go/no-go rule (ALPHA_GO_NO_GO section 3): if R-17 or the legal pages fail, friends get build 1 and the family keeps build 2, with no exception (D-100).

**Section 7 (v1.0 scope).** This list must be re-derived from PRD V2, not edited by hand, because D-100 and D-101 put server features, backup and the status report in v1.0 and D-115 and D-111 take non-English transcription out for the alpha. Proposed: replace the list with a pointer to PRD V2 `08-delivery.md` (D-105) and keep only three lines here: what the alpha ships (build 1 servers off, build 2 servers on, backup off in both: B2-6 is n/a for the alpha), what v1.0 adds on top, and what is out. Move "backup and restore" out of "Not in v1.0". Whether other items there (word highlight, Hindi-English, safety classifier) are still out needs the PRD V2 scope read (U).

**Section 8 (after v1.0).** Replace the absolute dates with relative gaps and a pointer to FUTURE (section 3 of this draft).

**Section 9 (decisions the date depends on).** Replace with the founder list in 1.0.0 section 6, plus: confirm or move the freeze and the go/no-go; the R-17 sign-off (F21); whether the alpha's friends get build 2 (the decision rule, ALPHA_GO_NO_GO section 3). Keep "Fri 27 Nov D-004 hedge" only if the founder still wants the date (it was an absolute date set in the old plan: mark "proposed, founder confirms").

**Section 10.** Keep unchanged.

### 2.5 Dates, one by one

| Date in ROADMAP 2.1 | Say after the alpha |
|---|---|
| Submit week of Mon 2 Nov; Fri 6 Nov latest | Remove. Submission is not dated (D-106) |
| Release planned Mon 16 Nov; buffer 9 to 20 Nov | Remove |
| 30 days Mon 5 Oct to Wed 4 Nov | Remove |
| C0 Wed 14 Oct, Beta App Review Thu 15 Oct, C1 from Mon 19 Oct, C1 exit Thu 29 Oct | Remove; they did not happen as planned. If the founder wants an external beta after the alpha, its dates are the re-plan's |
| Feature freeze Mon 26 Oct | Replace with the alpha freeze: Tue 3 Nov 2026, 5:00 AM PT (13:00 UTC), proposed, founder confirms |
| Counsel comments Fri 23 Oct; sign-off Thu 29 Oct | Say "not recorded in the repo" (counsel packet #136 and legal texts #163 are in review; 1.0.0 section 5). Do not guess new dates |
| D-031 Hindi script, Fri 30 Oct | Hindi is out of the alpha (D-111, D-115). Mark the date moot unless the founder keeps it |
| Fri 27 Nov D-004 hedge; Mon 30 Nov Q-011 | Keep as dates the founder set earlier only if the founder confirms; otherwise "proposed, founder confirms" |
| v1.0.1 by Mon 7 Dec 2026 | Remove; it was counted from a 16 Nov release |

## 3. `docs/backlog/FUTURE.md` (3 Oct) should say

Do not edit it now. After the go/no-go:

**Section 0 and 1.1 (dates).** Every release date in it (v1.0 submitted week of 2 Nov, released Mon 16 Nov; v1.0.1 by Mon 7 Dec; v1.1 mid January 2027; v1.2 mid March; v1.3 early May, before Mother's Day Sun 9 May; the G-04 event from about 25 April) is derived from the 16 Nov release. Replace them with the original **gaps** (v1.1 six to eight weeks after v1.0; v1.2 and v1.3 about eight weeks apart, I: read from the old dates) and the line "release dates not set; they follow v1.0's submission, which is re-planned after the alpha (D-106)". Keep Mother's Day (Sun 9 May 2027) as a constraint on v1.3, not as a promise. Also keep "App Review slows in the last two weeks of December [U]" as an assumption.

**Section 0 item 1 and 3.1 (v1.0.1).** "Launch window 16 Nov to Mon 7 Dec" loses its dates. The items stay (G-03 review ask, G-16 offer codes, T5-15 age signal, FAM-14 part 6). T5-15's date driver (1 Jan 2027) is a legal date and stays, still [U].

**OPEN-02 (Plus backup and restore).** D-100, D-102 and D-108 put recording backup in v1.0, with escrow and device-age recovery. OPEN-02 must be reworded from "uncommitted" to "built for v1.0 (#150, #151), off in both alpha builds (B2-6 n/a), AL-06 runs before any build turns it on". The founder's G-19 price review ("recommended only after OPEN-02 backup ships") then depends on backup shipping in v1.0, not later. Check the other lists for items D-100 pulled forward: sign-in, sync, co-parent sharing are not in FUTURE as items; U whether any FAM item (FAM-02 to FAM-06) is now in v1.0 under PRD V2.

**Section 3.1 ops lane.** CVL-02 (native-speaker review of six packs, "recruit in October") now has a hard role: D-115 says a non-English pack ships only when a native reviewer and the founder say so. Mark CVL-02 as the gate on every non-English language, still without a date, and keep the reviewer budget as a founder decision (section 6, item 2).

**Section 6 (decisions this roadmap needs).** Update:
- Q-011 (v1.1 scope): keep "by Mon 30 Nov 2026" only if the founder confirms it; it was computed from a 16 Nov release.
- D-031 Hindi script, "Fri 30 Oct": Hindi is out of the alpha. Mark moot or re-date; the founder decides.
- D-004 entity, "Fri 27 Nov": proposed, founder confirms.
- Counsel's AB 1043 / SB 2420 "in November": no source in the repo says counsel has been engaged (1.0.0 section 5: counsel sign-off "in review"). Say "not recorded".
- Add: Q-010 owners for OPEN-01 and OPEN-02 (the coordinator's list) as decided or open; I did not find a decision (U).

**New short section: "What the alpha taught".** Items now supported by evidence and which FUTURE should link (not restate): ADTS (ADR 0027) versus M4A for DL-01; D-113's left-books listing (BL-444) before build 3; D-116's tombstoned book. These are not new FUTURE items; BL-444 already exists in BACKLOG (V by reference in D-113).

**Section 5 (capacity).** Unchanged until the first post-launch cycle. The alpha shows agents merged a large queue in two weeks (V from the go/no-go PR numbers), but the founder's hours are the limit (U: no measurement in the repo). Do not change the 24 person-weeks per release.

## 4. `docs/release/1.0.0.md` (15 Oct; refreshed 27 Oct) should say

The file is a record kept twice a week by `ops` (BL-438). The refresh itself is `ops`' job; this is what the refresh after the go/no-go must change.

**First line.** New "Status checked against `origin/develop` <sha> on <date>".

**Section 0 (where the train is).**
- Build 1 row: "No build exists" stays true until the founder runs `TESTFLIGHT.md` steps 1 to 5. Its proposed 26 Oct date passed; the new date is "proposed, founder confirms" or "not set". Say that build 1 records ADTS (the flip, #293, merged as bbac5ec, Tue 27 Oct, 3:38 PM PT).
- Build 2 row: after the go/no-go, replace "No-go" with the actual result (go, or no-go with the failing rows), using the decision rule of ALPHA_GO_NO_GO section 3.
- App Store 1.0.0 row: replace "Not started. Re-planned after the alpha (D-106)" with the re-planned dates from ROADMAP 3.0. If none, keep "not set".
- The freeze paragraph: after the confirmation, drop the "27 Oct freeze was not applied" explanation or reduce it to a dated fact: the freeze applied from <confirmed date>.

**Section 1.** Step "build 1's recording container": #293 is merged, not in review. Replace "If it merges before build 1..." with the fact.

**Section 2.** Update each row from the go/no-go: R-17 passed or not (F21), staging exists or not, AF-05 done or not, rehearsal rows B2-14, B2-23 to B2-28 with their evidence files, B2-11 with the freeze-night gate run result (not the rehearsal 40596403809), B2-22 with a scheduled run link.

**Section 4 (open release PRs).** Remove #293 (merged), #152 (closed, already marked), #129 (closed unmerged, V; the PR says it was "superseded in part by D-100": the replacement is RA-16-02's listing rewrite, which is still open per section 5). Keep #109, #110, #112, #30 as held; they are still open on 28 Oct (V). The "after the go/no-go" hold on #109 and #110 ends at the go/no-go: that is when `AUTOMATION.md` section 6 orders them (U for the exact wording). Add #296 to the merged list in section 3 (the B2-7 gate fix).

**Section 5 (store lane).** This is where D-100 and the re-plan show up most. No dates. Each row keeps its owner. Edits: "Counsel sign-off and the 1.0.0 policy versions" row gets the counsel status as the repo shows it; "Export compliance" and "App Privacy" rows stay "changes" until RA-17-01 and RA-17-02 merge.

**Section 6 (what only the founder can move).** Rewrite after the go/no-go. The first item (confirm or move the proposed dates) becomes "dates confirmed" with the decision id, or stays. Remove item 5 ("whether build 1 waits for #293, and what to do with #129"): both resolved.

**Section 7.** Keep. Add: after the go/no-go, create `docs/release/<x.y.z>.md` for the first RC only when the store lane starts, as RELEASE.md 1.2 requires; this file stays the alpha record until then, or is renamed. That is a naming decision for `ops`.

## 5. Founder decisions this draft needs

1. Confirm, move or reject the proposed freeze (Tue 3 Nov 2026, 5:00 AM PT / 13:00 UTC) and go/no-go (Thu 5 Nov 2026). Everything else here waits on this.
2. Say whether D-045 (C1 with 15 to 25 families, three weeks) still stands after D-106, or whether the alpha replaces it.
3. Say whether Hindi (D-031's script default) is still a v1.0 item, given D-111 and D-115.
4. Say which absolute dates in ROADMAP section 9 and FUTURE section 6 (27 Nov, 30 Nov) keep their date.

## 6. Not verified

- I did not read PRD V2 (`docs/prd/v2/`) in full, so which scope items moved into v1.0 is partly U.
- I read ROADMAP, 1.0.0 and the first 100 and last section of FUTURE, and not the five lead files. Items in FUTURE sections 3.2 to 3.5 are unchecked.
- GitHub PR states (#296, #129, #109, #110, #112, #30, #152, #293) were read from the API on 28 Oct (V); everything else in the go/no-go is as of 27 Oct, 3:42 PM PT and may have moved.
- ALPHA_GO_NO_GO row B2-11 contains a few garbled spans ("ThThe", "...).he kill runs") from an earlier edit (V); I did not touch it (not my path) and note it for its owner.
