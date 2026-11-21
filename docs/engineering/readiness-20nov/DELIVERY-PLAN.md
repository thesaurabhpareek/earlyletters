# Delivery plan: why we are slow, the critical path, lanes and the founder pack

Status: PROPOSED by `product` for the CTO (Karma). Nothing here is a decision, an approval or a date. Dates and release content are the founder's (`docs/ROADMAP.md`). Live status is the one canonical block at the top of `PROGRESS.md`; this file does not repeat it. Plans `17-engineering-project-plan.md` and `17b-engineering-plan-new-scope.md` hold the row list; this file adds the speed analysis, the dependency map and the founder pack on top of them.

Evidence tags: [V] read from the GitHub REST API or a file on develop while writing; [M] measured by the CTO session (`metrics`, not re-measured here); [E] estimate; [U] not verified. Fictional family Asha only.

## 1. Why we are slow

Demand did not drop: many PRs wait (198 open at read time, 85 of them not draft, 127 numbered below #1000) [V]. Throughput fell because merges stopped being cheap.

| # | Cause | Evidence | Effect |
|---|---|---|---|
| 1 | Merge rate fell about ten times partway through the measured day | About 15 to 22 merges an hour for the first part of the measured day, then 2 or 3 an hour [M]; 12 merged in the later window in a 100-PR sample [V, a floor] | The plan is paced by what stops merges, not by building |
| 2 | CI runs cancelled | CI workflow 31 of 74 runs cancelled (42 percent); Compliance fence 50 of 111 cancelled and 14 failed [M]. Cause besides timeouts: `ci.yml` concurrency group `ci-<pr>` has `cancel-in-progress` on `pull_request`, so a label add, a ready-for-review or an edit cancels the running check [V `ci.yml:13-15`] | Each cancel is a rerun and a wait |
| 3 | `unit` job timeout | 5 minute limit cut 13 of 31 recent runs at about 303 to 317 s, 4 of them on develop pushes; healthy runs 182 to 295 s [M]. The 10 minute limit is merged (#1302) and `ci.yml` now reads `timeout-minutes: 10` on the engine job [V] | Fixed on develop; watch the next runs |
| 4 | macOS "iOS compile" is the longest check | Median 54 minutes per run, max 175 (runner wait included); 10 of 28 cancelled [M]. It runs on every mobile PR change (`ios-compile.yml` path filter: `apps/mobile/**`, `packages/**`, lockfile) [V] | Every pushed head restarts a 54 minute clock |
| 5 | Reviews voided by every push | Two counted reviews are lost on any push (restack, must-fix, doc fix) and cost one more round [M] | One push is about two reviews of rework |
| 6 | Stack restacks | Squash merge of a stack forces a rebuild of every later slice: 3 rebuilds on the photo stack, one silently reverted #1205 and a reviewer caught it [M]. #839 and #840 are still open [V] | Serial chain, each hop a full CI and review |
| 7 | Reviewers re-run the full suite | CI already runs apps/mobile vitest; the sandbox shows 9 known failing files and 79 tests on clean develop, reconciled in every review [M] | Review time spent on noise |
| 8 | Status refresh PRs | #1284, #1300 and #1301 each cost two reviews [M] | Review capacity spent on bookkeeping |
| 9 | Founder gates wait hours | #1302 about 3 hours; CCO comments for #1159 and #1128 much longer [M]; both PRs are still `blocked` [V] | Gated PRs sit while branches behind them go stale |
| 10 | Thin real ready queue | 118 rows say `ready` [M], but about 15 already have an open PR and the analytics rows are one serial chain: BL-1236 waits on BL-1235, BL-1237 on BL-1236, BL-1238 on BL-1236, BL-1237 and BL-1239, BL-1240 (a `pair` row) on BL-1235 and BL-1238, and 8 more on BL-1240 [V BACKLOG] | An agent can show "ready" and still have nothing startable |
| 11 | Dead weight in the open list | 127 open PRs numbered below #1000, 113 drafts overall [V]; the dispatcher stops new agent work when 10 agent PRs are open (`roster.json` limits `max_open_agent_prs`) [V] | Noise in every scan, every id check and every cap |

### Ranked speed actions

| Rank | Action | Owner | Effect | Needs founder |
|---|---|---|---|---|
| 1 | Stop CI cancelling on label, ready and edit events: cancel only on a new push. Carried by the ops CI actions proposal PR in flight (I did not read it; scope and wording are the CTO's brief [U]) | ops | Removes most of the 42 percent cancels; saves a 54 minute rerun each | Yes: founder pastes workflow changes |
| 2 | Raise the `unit` timeout to 10 minutes (#1302) | ops | Removes 13 of 31 timeout cancels | Done, merged [V] |
| 3 | Draft until the final head; after Ready, push only for a must-fix (section 5) | every builder | Stops voiding two reviews per push | No |
| 4 | Reviewers do not re-run the full suite; CI is the authority (section 5) | every reviewer | Cuts a review from a full run to a diff read plus targeted mutants | No |
| 5 | Avoid stacks; where unavoidable merge with the merge method (merge commits are allowed, squash too, rebase not, auto-merge off [V]) so later slices need no rebuild | CTO | Ends rebuild rounds like the photo stack | No |
| 6 | Put the founder pack (section 4) in front of him once, in unblock order | CTO | Removes the longest waits | He answers |
| 7 | Feed the on-path queue first: BL-926, BL-1446 (new row), the NS-32-R12 test and the BL-929 run sheet (section 2) | product, CTO | Agents build what the first store build needs | BL-925 words |
| 8 | Close or label the 127 old open PRs (stale drafts, superseded debates) | CTO | Clean scans, honest caps; no new work lost, each is reopenable | No (CTO) |
| 9 | Refresh PROGRESS.md at wave edges, not hourly; one reviewer pass for a status-only edit (proposed; it touches the review rule, so the CTO decides) | CTO | Frees review passes | No |
| 10 | Small rows fit in one PR without a restack: assign BL-1417 to BL-1419, BL-1424, BL-1425 first | product | Easy merges keep the rate up | No |

## 2. Dependency map and critical path

Reading guide. "First store build" is Build 13 in plan 17. Under plan 17 section 5.5 the founder approved: servers off for Build 13, so the database apply and the new-device email gate the first outside family, not the first build. Plan 17 Q1 (which P0 rows the cut must meet) and Q2 (photo and Find dark) are recommendations the founder has not answered, so the path below follows those recommendations. Marks: CP13 = on the path to the first store build; CPOF = before the first outside family; later = Build 14 or after; no date is given.

### 2.1 The path to the first store build (CP13)

```
founder words BL-925 (#866 merged as PROPOSED, status needs-decision)
   |--> BL-926 (NS-09-R4a, R4b; blocked on BL-925) --> BL-977 (NS-09 rest; blocked)
   |--> BL-1446 NS-09-R6 stuck delete in Storage (NEW row; P1, holds the cut; no other row built it)
NS-32-R12 never-list test (BL-966; test not found merged [U])
BL-928 remainder (two slices merged #892, #893; rest [U])
BL-929 PR 2 perf EAS profile (founder approves the profile) + SE 3 run sheet (not written)
        |
        v
Q1 and Q2 answered (founder) --> release path: #830 conflict named by the founder with its sha
   --> release PR + release branch from main --> RC tag --> release-ios.yml + EAS build (founder approves
   the app-store environment) --> device sheet, P0 rows first (founder names his phones) --> store-build gate
   --> founder submits
```

Already merged and no longer holding the cut [V PROGRESS, plan 17 3a]: BL-922 held screen (#1126, #1167), BL-961 store reads (#879), BL-967, BL-962 test, P-9 tests, the NS-10-R7 fix. BL-978a (#1173) is [U] and first-run rows FP-3, FP-4, FP-7, FP-8, FP-10, FP-13 to FP-15, FP-16a, FP-19, FP-20 have no PR found [U]. Whether first run (plan 17b Drop D) belongs in the first build is not stated in 17 or 17b: see founder ask 1. If it does, #1159 (FP-2) and #1128 (FP-12) are CP13.

### 2.2 Chains, what blocks what, and where each sits

| Chain | Order | Blocked by | Mark |
|---|---|---|---|
| Photo stack (BL-931) | #839 (4c) -> #840 (5) -> BL-1444 photo wiring (pending photos discarded on leave, one adopt at a time, picture cleared on forced sign-out; gaps 1 and 3 must land before `EXPO_PUBLIC_PHOTOS` is on in any build) -> BL-1445 design-conformance swap (XS, after the stack). The deletedAt test (a letter in Recently deleted shows no picture; review mutant M5 survived on #839) is asked on #839 and lands there or in BL-1444 [U which] | #839 waits on its restack; #840 is based on #839's branch [V]; each hop queues a macOS run; plus counsel read of the photo label, photo words, BL-868 export spec #1215, BL-960 #873, ADR Q4 before photo is on | later (photo is dark in Build 13 under Q2) |
| New-device email | #1242 NDA-1 (link sign-in fresh in the report; reviewer notes BL-1442) -> app call for fill (no PR found [U]) -> hosted JWT claim check -> clear the pending table -> founder reads words -> flag `NEW_DEVICE_EMAIL` stays off. Hosted migrations files 33 to 38 are in develop, not applied: the founder applies them and must give an explicit go (founder ask 3). Not-you page not started [U] | Founder go on migrations; sender #1206, #1223 and fill #1224 are merged and dark [V PROGRESS] | CPOF (before the first outside family); not Build 13 |
| B5 backup | BL-1439 (job for an erased or deleted letter drops its Keychain token; test first, low severity) -> B5 PR 3 (no PR found [U]) -> backup flip gate (NS-08-R21 second gate) | BL-1439 is `proposed` | CPOF-adjacent; not CP13 |
| Days | days tick PR (no PR found [U]) -> days code PRs NS-46 to NS-50 (not started [U]) | Counsel packet 1.8.0 and register rows (drafts #1056 to #1058) | later |
| Find part 2 | BL-1440 gates (rowLabel `$&` mangling, query clears on hide, Cancel clears, fallback to content, no-analytics grep) -> Book-header slice mounts Find; Find 8/8; second-account guard #1208 | BL-1440 must land before mount; #799 (docs/legal) and #873 wait on the founder's go | later (Build 14, Q2) |
| Analytics | BL-1235 ER-A00: P1 #1228, P2 #1229, P3 #1232 merged; P4, P4b, P4c are #1259, #1260, #1261 (open) -> BL-1236 -> BL-1237, BL-1239 -> BL-1238 -> BL-1240 (pair; FH-6 approval) -> BL-1241, 1243, 1244, 1245, 1246, 1248, 1251 -> BL-1247, 1249, 1250. Registry side: BL-1254 (merged #1234) -> BL-1255 -> BL-1256 -> BL-1257 to BL-1263 and BL-1264. #1086 is held, `needs:founder` (words, native plugin; BL-1253 removes the unused plugin) | The P4 stack has to merge first; BL-1240 and BL-1235 are `pair` rows, not agent rows | before the production readiness build; not CP13 [U that Build 13 carries PostHog] |
| Content waves | PROPOSED words in drafts #1131, #1133, #1134, #1136 to #1138, #1142, #1170, #1171, #1184, #1268, #1272, #1286 (held for founder and counsel), Explore #1271, guide #1129 | The founder approves words; counsel for #1286; none approved | CP13 only for words a build-1 screen needs (BL-925); the rest later |
| QA ready tasks | BL-1402, BL-1403, BL-442, BL-443, BL-894, BL-409, BL-410 and others; BL-1405 waits on BL-1404 | Mostly none; BL-1403 scripts run on a phone by the founder | BL-929 run sheet and BL-964 ratchet are CP13; the rest no |
| Auth and sign-in | FP-6 #1243 merged; follow-ups BL-1424, BL-1425 (ready, no dependency), BL-449 (#1273), BL-478, BL-450, BL-452; FP6-2 (BL-1441): a refused Apple or Google sign-up on the first-run Welcome shows nothing; needs a design-systems ruling on the words and place; release gate | The ruling is not the founder's; the words in it are PROPOSED until he approves | CP13 if first run is in the first build [U] |
| Moments (NS-53, PROPOSED, nothing approved) | Wave A: PRs 1 to 4 (pure core) and 5 (synthetic table), 6, 8, 12, and the G1a spike -> Wave B: 2, 3, 9, 13, 14, 7 -> C: 10, 11, 15, 16, 18 -> D: 17, 19 to 24 -> E: 25 then the F2 flip. Rows are BL-1432 to BL-1438 in #1296 (proposed) | Core PRs 1 to 5 need no founder answer; PR 9 and native wait for G1a and G3; PR 5b waits for the place dataset licence read; F2 flip waits for G1b to G11 | later (not in the first build) |
| Founder-gated | CCO comments for #1159 and #1128; docs/legal #873, #799, #1117, export spec #1215; DECISIONS rows; GAP-04, F-21, F-08d | Him | Mixed: see section 4 |

Moments waves and their blockers, for the CTO:

| Wave | PRs | Starts with no founder answer | Waits for |
|---|---|---|---|
| A | 1 to 4, 5 (synthetic table), 6, 8, 12 | Yes (pure TypeScript and tab shell behind a flag; BL-1432, BL-1433) | Nothing but the spec reaching develop (#1294 open) |
| A spike | G1a device read-out (BL-1434, pair) | No: needs his phone or a simulator with a script-made Asha library | His phone |
| B | 2, 3, 7, 13, 14 yes; 9 and 5b no | Partly | 9: G1a read-out and G3; 5b: licence read (G11b); 7: O-38 |
| C to D | 10, 11, 15, 16, 17, 18 to 24 | No (native and flows) | Wave B, O-01 tab position, O-39 flag split, O-46 numbers before PR 16 |
| E | 25, read-outs, F2 flip | No | Counsel gates G1 to G11 (written answers from licensed counsel; silence is never a pass), O-37, O-40, O-42, O-47 |

Founder decisions O-01 to O-47 and the ten counsel questions are listed with defaults in `docs/product/moments-tab/FREEZE-CHECKLIST.md` (in #1294) sections 1.1 and 1.2 [V at that head]; they are cited here, not copied.

### 2.3 Not on the path to the first store build

Photo stack, Find part 2, Moments, days, analytics ER stack, content waves 2 and 3, the new-device email flip (CPOF), B5 backup flip, design tokens v2 (#1251), most QA rows. They still need review capacity; section 3 caps it so they do not starve the path.

## 3. Lanes and WIP limits

Roster WIP (per agent, `roster.json`): mobile 3, qa 3, sync 2, analytics 2, content 2, design-systems 2, privacy 2, data-architect 2, security 2, payments 2, speech 2, ops 1; reviewers principal-architect, security-architect, data-steward, compliance-engineer each 1 with 2 runs a day [V]. Each PR needs two counted reviews, so the recommended limit counts non-draft open PRs per lane and treats one stack as one slot. Recommendation [E]: hold a lane at or under its limit; draft PRs do not count and stay draft until the final head. Total target: about 20 non-draft agent PRs open (35 numbered above #1000 now, 85 overall [V]).

"Next 3 ready" are the first startable `ready` rows in `ready-tasks.txt` with no open PR found and no unmet dependency. PR search matched row ids in titles, branches and bodies [V]; a row can still be in flight under another name [U].

| Lane | In flight (open PRs) | Next 3 ready, no open PR | WIP limit |
|---|---|---|---|
| mobile | #1128, #1159 (founder-gated), #1242, #1266, #1273, #1274, #1285, #1290, #798; photo stack #839, #840 (one slot) | BL-1424, BL-1425, BL-1406; then BL-1446 (new, after BL-925 words) | 4 non-draft; the first two founder-gated PRs do not use review time, so 2 more may start |
| sync, backend | #1289 (sync); #1215 export spec (data-architect, founder) | BL-1417, BL-1418, BL-1419 (backup scan, test-only) | 2 |
| analytics | #1259, #1260, #1261 (P4 stack, one slot); #1086 held | none startable until the P4 stack merges (BL-1236 depends on BL-1235); then BL-1236, BL-1237, BL-1239 | 1 stack plus 1 |
| qa | #1151, #1252, #1293 | BL-1402, BL-1403, BL-442 | 3 |
| content | #1129, #1276; 12 drafts (waves, #1286 held) | BL-422, BL-424, BL-462 | 2 non-draft; drafts stay draft |
| design-systems | #1251 (tokens v2); Moments docs #1277, #1278, #1281 (PROPOSED); #1270 draft | BL-418, BL-421, BL-891 (BL-1443 proposed) | 2 |
| ops, platform | #1117 (founder); #1303, #1304 (docs); ops CI proposal in flight | BL-1414, BL-897 (only two ready) | 1 |
| privacy | #873 (founder), #1267 (Moments, PROPOSED) | BL-414, BL-415, BL-850 | 2 |
| product | #1253, #1264, #1280, #1282, #1294, #1296 | n/a | 2 non-draft; the six Moments and split docs are already over it, so no new product PR until two merge |
| other (not asked, for the CTO) | security: BL-1404, BL-1411; payments: BL-1421, BL-441; speech: BL-148, BL-432 | each lane has two or three startable rows | 2 each |

### Ready rows that are stale or already done (status lines to fix)

Fixed in this PR (open PR exists, row still said `ready`; each PR number [V] from its title): BL-449 (#1273), BL-457 (#1290), BL-459 (#1289), BL-473 (#1266), BL-518 (#1274), BL-508 (#1252) are now `in-review (PR #n)`. BL-1254 said `in review` and #1234 merged [V]: now `done (PR #1234, merged)`.

Not changed here, owner or Karma to judge:

| Row | Finding |
|---|---|
| BL-878 | #1204 merged the checklist and a test (`docs/security/NATIVE_MODULE_GATE.md`) [V]; the row's done-when also needs BL-854, BL-871, BL-874 and BL-875 to cite it [U]: probably `partly done` |
| BL-1235 | `ready` but P1, P2 and P3 merged (#1228, #1229, #1232) and P4, P4b, P4c are open (#1259 to #1261) [V]: `partly done` |
| BL-464 | #1293 is open and says partly done: row should say `in-review (PR #1293)` once it is not partly |
| BL-845, BL-862 | draft PR #759 open |
| BL-863, BL-867 | draft PR #757 open |
| BL-841 | draft PR #760 open |
| BL-389 | draft PR #805 open |
| BL-868, BL-960 | PRs #1215 and #873 open, founder go |
| BL-775, BL-781, BL-251, BL-252, BL-278, BL-395 | matched only stale drafts or unrelated PRs (#707, #733, #734, #743, #88): likely old; owner check |

## 4. Founder pack

Every open ask, each with the default that stands until he answers and what it unblocks, in order of unblock value. No approval is claimed; PROPOSED words stay PROPOSED.

| # | Ask | Default if no answer | Unblocks |
|---|---|---|---|
| 1 | Plan 17 Q1 and Q2: which P0 rows the first store build must meet, and whether it waits for photo and Find; plus whether first run (Drop D) is in it | The plan's recommendations: BL-922, BL-925, BL-926, BL-928, BL-961, NS-09-R6 and NS-32-R12 hold the cut; photo and Find ship dark | Fixes the path in section 2.1; every builder's priority |
| 2 | Approve or change the BL-925 line (let-go not finished) | Not approved; BL-926, BL-977 and BL-1446 stay blocked | The keeping floor, the biggest CP13 block |
| 3 | Release path: name #830 with its full sha, say which phones he holds, approve the `app-store` environment, approve the BL-929 perf EAS profile, run the device sheet, submit | Nothing happens without him | Release PR, RC tag, EAS build, submission |
| 4 | CCO approval comments for #1159 (FP-2) and #1128 (FP-12), or say go | Both stay blocked | The consent builder, which lands before any other `consent.ts` change, and the first-run queue behind it |
| 5 | Hosted migrations: explicit go to apply files 33 to 38 to `scribe-staging` first (agents prepare the plan, never apply); hosted state not re-read [U] | Hold; servers off for Build 13 | New-device email chain, S1, C3, C9, fill and re-key (CPOF) |
| 6 | docs/legal PRs: go or hold on #873 (data inventory), #799 (Find index row), #1117 (no model name as author), and export spec #1215 | Hold | BL-960 and Find on, BL-933 export; photo on (Build 14) |
| 7 | Decisions with a recommended default: GAP-04 (taught-names screen in 1.0; product recommends no), F-21 (say plainly there is no per-picture description in 1.0; recommends yes), F-08d (neutral lock-screen body; one fixed string, candidate "Whenever you have a minute." is PROPOSED) | The recommendations, but nothing is decided until he says | Days and reminder words, photo copy |
| 8 | DECISIONS rows he must paste or confirm: E26 delegated D-entry quoting his words, the allowance per phone entry (D-082 amendment), ADRs 0036 to 0038 (PROPOSED) | Stay PROPOSED | Agent readiness, allowance enforcement |
| 9 | Read PROPOSED words: Find (12 lines in #894), photo keys, share words, new-device email and page, content waves 2, 3, C, D, E, #1286 (with counsel), Moments label | None approved | Each feature's flag |
| 10 | Counsel: send the BL-949 packet; engage licensed California counsel (spend, O-40); photo label read; entity and publisher (O-47) | Not engaged; features dark | Photo on, Share, Moments F2 |
| 11 | Moments: O-01 tab position, O-37 to O-47 (defaults in the freeze checklist), the G1a spike on his phone, RV-01 to RV-22 signatures | Defaults in that file; no spend without a signed row | Moments waves C to E; waves A start without him |
| 12 | PostHog adapter #1086: words and native plugin; FH-6 dependency approval for BL-1240 | Held | The analytics ER chain from BL-1240 |
| 13 | Privacy docs owed: DATA_CLASSIFICATION rows (`reminders.onSince`, the new-device tables, `scribe.auth.deviceId`, `app.lastPlannedVersion`) and the new-device doc follow-up | Not drafted here (founder-merged) | Honest data inventory before servers on |
| 14 | Workflow edits for CI (cancel only on push; the ops proposal in flight): he pastes them | Cancels continue | Rank 1 speed action |

Not his, for the record: FP6-2 (BL-1441) needs a design-systems ruling; BL-943-3 and the other "OPEN with product" items in PROGRESS.md are product's; the CTO decides the process rules in section 5.

## 5. Process rules adopted by the CTO

Recorded as given to `product`; the CTO owns them.

1. Draft until the final head. A PR is ready for review only when its head will not move again.
2. After Ready, push only for a must-fix. A push voids two counted reviews and restarts the 54 minute macOS run.
3. CI is the full-suite authority. Reviewers read the diff and run targeted mutants; they do not re-run the full suite.
4. Never trust `git merge-tree`. Check `git diff origin/develop HEAD --stat` and `--diff-filter=D` against a fresh fetch (a clean merge once hid a revert of #1205).
5. Avoid stacks. Where one is unavoidable, merge with the merge method (merge commits are allowed [V]) so later slices are not rebuilt.
6. One status block (PROGRESS.md), refreshed at wave edges; no new status files.
7. Backlog ids: do not renumber. The next free id after develop's highest (BL-1445) and the open PRs' rows (#1253: BL-1366 to BL-1401; #1296: BL-1432 to BL-1438) is BL-1447; this PR adds BL-1446 [V all open PR patches to `docs/BACKLOG.md`].

## Not verified

- The scope and title of the ops CI actions proposal PR: not read; no open PR with that content was found at read time.
- Reviewer counts, hosted migration state, whether BL-925 and the first-run rows are in the first build, the app call for fill, B5 PR 3, the days tick PR and the not-you page (no PR found).
- The CTO measurements in section 1 ([M]) were not re-measured; only repo settings, the workflow files, open PR lists, backlog rows and merge status were re-read.
- #839's current head and whether it holds the deletedAt test.
