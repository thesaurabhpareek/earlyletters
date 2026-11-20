# Execution tracker for Monday 9 Nov (file 14)

Status: working tracker, docs only, written Sun 8 Nov 2026 (UTC) by chief-of-staff. It decides nothing, assigns no BL, D or CR id, closes nothing and merges nothing. Every "close" below is a recommendation for the founder.
Built from: GitHub REST on 8 Nov (140 open PRs; heads, CI, ages, file lists, behind counts), `13-sequence-and-handout.md`, `08-ranked-backlog.md`, `docs/agents/BOARD.md` on develop plus the six rows PR #682 adds, BL-757 to BL-774 in PR #684, and the computed build queue (issue #659, generated 20:35Z on 8 Nov by the script in PR #660, which this file does not rebuild). Heads move: always re-read the head sha before acting.

How to read it: "Head" is 8 characters of the sha at fetch time. "CI" counts check runs by conclusion; `pend` means queued or running when read, `canc` is usually a superseded run, and the named failing check is given where it matters. Counted reviews (Review A / B) are only taken from the #659 snapshot (20:35Z) and are stale if the head has moved since.

## 1. PRs mapped to ranks 1 to 17 (sorted by rank)

Next-action vocabulary: review evidence (comment, not counted), ready (take out of draft), close as superseded, founder read, founder go with named sha, counsel, waits on a decision, B12 list-only (the Build 12 lane, Karma session 01G82fpt, owns it; nobody else is assigned).

| Rank | PR (head) | State, CI | Single next action | Owner |
|---|---|---|---|---|
| 1 | none (decision entry not written) | n/a | Waits on a decision: F1/F2, then the Build 12 route entry | founder; product drafts |
| 2 | #672 (28ae44e9) store 1.0 Privacy, Terms, Subscription Terms | draft, CI not checked | Counsel: send with the priority-A packet once F3 is done | founder (F3); legal |
| 2 | #678 (e192b8a3) CR-60 hold on 0.9.0 pages, device plan fixes | ready, CI not checked | Review evidence, then founder read (it holds legal pages) | compliance-engineer; founder |
| 3 | #602 (50344809) BL-594 new keys | ready, CI 11 ok, clean, no counted reviews | Founder read (file prepared), then two counted reviews, then founder go naming 50344809 | founder; security-architect |
| 3 | #657 (b01a06b4) BL-597 force re-auth | draft, 11 ok, 1 pend | Ready, then counted reviews | security-architect |
| 3 | #632 (1126c9c1) BL-599 Keychain class test | draft, 10 ok, 1 pend | Ready, then counted reviews | mobile |
| 3 | #633 (d30fbd0c) BL-600 https-only env | draft, 10 ok, 1 pend | Ready, then counted reviews | mobile |
| 4 | none (NX-04 scope being written) | n/a | Waits on W1-1 scope note; booking is F18 | security-architect; founder |
| 5 | #634 (786ef15d) BL-577 consent fields | draft, FAIL compliance-fence and supabase lint | Rerun the database job per #655 (CR-52), then read the lint failure | data-architect |
| 5 | #636 (e484c84b) BL-578 deletion hash | draft, same two FAIL | Same, after #634 | data-architect |
| 5 | #637 (dd95a923) BL-585 audit append-only | draft, FAIL compliance-fence only | Same, after #636 | data-architect |
| 5 | #655 (81b260a5) CR-52 merge order for consent PRs | draft, CI not checked | Founder read (docs; sets order #634, #636, #637) | founder |
| 5 | #656 (f5e820f2) BL-583/584 migrations record, purge alert | draft, 9 ok, 1 canc | Ready, then counted reviews | ops |
| 6 | none | n/a | Waits on rank 5 and F6, F8 (profile flip PR is Tue 10 Nov or later) | mobile, security |
| 7 | #635 (7566abd0) Before you begin | ready, FAIL compliance-fence, counted PASS/PASS at 7566abd0 in #659 | B12 list-only: split plan first, then founder CCO line; counsel Q46, Q48, Q57 | Build 12 lane; founder |
| 8 | none (NX-08 being written) | n/a | Waits on W1-2 requirement; build waits on counsel on the words | privacy |
| 9 | #520 (3ae9eab2) delete a book, erase everything | ready, FAIL compliance-fence, 2 pend, dirty in #659 | B12 list-only: head moved since the counted PASS/PASS at 252eadda, so those two lines no longer apply; founder CCO line after #635 | Build 12 lane; founder |
| 10 | #622 (c304d8ad) BL-566 staging backup | draft, 10 ok | Review evidence; production variant waits on F2, F4 | ops; founder |
| 11 | none | n/a | Waits on rank 5; NX-17 requirement still to write | ops, security |
| 12 | none open (store pack, `/support`, `/subscription-terms`); #666 (1cba10e5) production profile sits next to it | #666 ready, 12 ok, 1 canc | B12 list-only | Build 12 lane |
| 13 | none | n/a | Founder hands and money admin (F3, F4, F19) | founder |
| 14 | #670 (df72953d) slow save opens Review | draft, 11 ok, 2 pend, 1 canc; 6 behind develop | Review evidence (W1-3), then author readies, then founder go | red-team; mobile |
| 14 | #615 (2553f9d6) and #618 (06b9cd02) | ready; #615 FAIL required and tests; #618 B-review FAIL in #659; both dirty | Close as superseded by #670 (recommendation, section 2) | founder; authors |
| 14 | #617 (cd9d3834) BL-568 global error handler | draft, 10 ok, 1 pend | Review evidence | qa |
| 14 | #619 (3610c844) BL-572 queue pause | draft, 11 ok, 2 pend | Review evidence; rebase after #670 (same files) | speech; red-team |
| 14 | #683 (bb362de6) phone-is-full keys | draft, 13 ok, 1 canc | Waits on a decision: words need design-systems and founder approval | design-systems; founder |
| 15 | none. #533 is an issue, not a PR (open: "Web journey J13: local_db_migration_failed under load (flaky)") | n/a | Review evidence: qa reads #533 (W1-4); 08 says "not read" | qa |
| 16 | none | n/a | Waits on ranks 5, 6 and the founder's two phones | qa; founder |
| 17 | #669 (2846bff3) BL-736 alpha allowance test | draft, 10 ok, 1 pend | Review evidence (W1-4) | qa |
| 17 | #665 (a8614c5e) BL-604 hide Family tab in store build | ready, 12 ok, 1 canc | B12 list-only | Build 12 lane |
| 17 | #591 (72e62dce) D-139, BL-604/605, CR-48 | ready, dirty, CI green in #659 | Waits on a decision: founder words for D-139 and numbering order (F13, F17) | founder; product |

Ranks 18 and above that have an open PR (for completeness): rank 19 #620, #621, #658 (BL-598, 602, 603; drafts, security-architect; review evidence); rank 20 #599 (dirty; merge first per F17 ruling, then #587 renumbers); rank 22 #677 (draft, FAIL required and Deno checks; waits on F11 and counsel Q54); rank 23 #680 (draft; review evidence by qa, W1-4); rank 24 #638 (draft; founder merge); rank 27 #681 (draft; red-team review, core change); rank 28 #587, #593, #548 (ready; product renumbers #587; #548 is a claim row); rank 30 #614 and #521 (held by ruling to 1 Dec; B12 list-only). Titles in #680 and #681 quote older rank numbers (18 and 22); the ranks here follow 08 and file 13.

## 2. Unmapped, stale or superseded PRs: recommendation only

Nothing is closed by this file. "Close" means: the founder decides, and the author session or the founder closes it with a one-line reason.

| PR | Why it is here | Recommend | Reason |
|---|---|---|---|
| #615 | Superseded by #670 (rank 14); FAIL required and tests; dirty; 36 behind | Close | Same fix as #670, which is the pick |
| #618 | Superseded by #670; dirty; B-review FAIL in #659 | Close | Same; first check that nothing in its j22 flow is lost (UNVERIFIED) |
| #26, #30, #32 | 36 days old; #580 is the harvest list "before closing" them | Keep until #580 is read, then close | #580 says they are to be closed; reading the harvest is the gate |
| #51 | 36 days; draft; label review:changes-needed; risk:high db fix | Keep, founder triage | Security-relevant; UNVERIFIED whether a later migration covers it |
| #35, #37, #40, #41, #53 | 36 days; docs/agent drafts (ops runbooks, data map, metric tree, help centre, counsel question pack v0.1) | Keep, founder triage | May be harvested into later docs; UNVERIFIED |
| #87, #88, #89, #90 | 35 days; debate docs Q-013 to Q-016 | Close if each question has a D entry (UNVERIFIED) | Debates normally end in a decision entry |
| #105, #112, #164, #167, #168 | 24 to 26 days; web home restructure, release agents (changes-needed), knowledge leads, reference and decision backfills | Keep, founder triage | Older than the current harness; whether they are superseded was not read |
| #606 | Draft, build 2 readiness; build 12 is next | Close if the build 2 record exists (UNVERIFIED) | Looks historic |
| #653 | Drift sweep (dates, store name, iOS target) | Keep | Small docs fix; ready, clean per #659 |
| #502, #576, #437, #575 | D-133 and D-140 held, web true-promise line | Keep | Held by rulings until after 9 Nov |
| #554 to #590 (HV2 harness v2 stack, about 25 drafts of 1 Nov) | Not older than 14 days; no rank | Keep, founder triage | Harness work, not in the roadmap; nobody should start new harness work on them Monday |
| #675, #679, #623 | Open code PRs with no rank in 08: struggling region, Another thought on Write, web launch flip kit | Keep | Need an owner statement: B12 lane or later (UNVERIFIED) |

Counts: 2 recommended closes now (#615, #618); 7 conditional (#26, #30, #32 after #580; #87 to #90 and #606 if their decisions or records exist). The 18 PRs older than 14 days are #26, #30, #32, #35, #37, #40, #41, #51, #53, #87 to #90, #105, #112, #164, #167, #168.

Conflicting (dirty) per #659 at 20:35Z or per REST now: #454, #520, #587, #591, #596, #599, #615, #618. Most other PRs report mergeable "unknown" because GitHub had not computed them; do not read that as clean.

## 3. Monday 9 Nov sequence

### Founder, in this order (about two hours of reading, plus the hands items)

1. Go/no-go for the release stream (file 13 section 5, item 1).
2. Decision entry for the Build 12 route (F1, F2). Unblocks ranks 1, 5, 6, 9, 10, 12, 13.
3. F3 counsel engaged and send priority A (#672 goes with it); F4 plan; F5 who may sign in.
4. Read #602, then #655 (CR-52 order). Both are short docs or a prepared file.
5. CCO lines for #635 then #520, only after the Build 12 lane reports the current heads (#520 moved to 3ae9eab2).
6. Named-sha go for any PR that has two evidence reviews and green CI at that exact head. As of this fetch only #601 (build gate record) is shown ready in #659; rank 3 PRs have none yet.
7. Later in the week, not Monday: F10, F11, F18.

### Engineering lanes: what to pick up first

| Lane | First task | Source |
|---|---|---|
| red-team | Evidence review of #670, then #681 (comments only) | W1-3, BOARD row in #682 |
| qa | Evidence review of #669 and #680; read #533 (it is an issue) | W1-4 |
| security-architect | NX-04 scope note; then ready #657 and read #602 | W1-1 |
| privacy | NX-08 requirement | W1-2 |
| content, design-systems | Words in #683 reviewed; no screen | W1-5 |
| product | Land #684 rows; post the 12 numbering comments (rank 24, comments only) | W1-6 |
| data-architect | Rerun the database job on #634 and #636, read the lint failure, fix the migration clash in section 4 | #655 |
| mobile | Ready #632 and #633 when CI settles; rebase #619 once #670 is reviewed | rank 3, 14 |
| ops | Ready #656; hold #622 for F2, F4 | rank 5, 10 |

### Do not start (a claim or open PR exists, or a gate is open)

- Anything in the Build 12 lane: #635, #520, #614, #521, #644, Book page #674, #665, #666, #673, #676, store pack, `/support`. List only.
- A second slow-save fix: #670 is the pick. Do not touch `listen.tsx`, `review.tsx` or `recorder.ts` on a new branch until #670 is reviewed.
- Rank 23 10% same-text fix: wait for #680 review. Rank 14 Finish-screen build: wait for #683 words and #670 merged.
- NX-04 and NX-08 docs: claimed in #682 (merge #682 first so the claims are on develop).
- Consent withdrawal, hosted backend, production sign-in, delete-account drill, alerts: blocked on F1/F2/F4 and rank 5.
- Analytics build (#677): off until F11 and Q54.
- New harness v2 work: the HV2 stack (#551 to #590) is parked.
- Any new id: only from `node scripts/agents/next-id.mjs` at the moment of writing. BL-739 to BL-756 are held for #587's renumber; #684 starts at BL-757.

## 4. Risks: file overlaps and a suggested merge order

Overlaps found from each PR's file list (REST, first 100 files per PR):

| Hot file | Open PRs touching it | Risk |
|---|---|---|
| `apps/mobile/src/app/listen.tsx` | #615, #618, #670 | Three fixes to one screen; only #670 should survive |
| `apps/mobile/src/app/review.tsx` | #670 | None open |
| `apps/mobile/src/lib/capture/recorder.ts` | #619, #670 | Real overlap; also `transcription-queue/index.ts` |
| `packages/content/src/strings.en.ts` | #502, #520, #521, #614, #635, #644, #675, #683 | Eight PRs add to one file; every merge forces a rebase of the rest |
| `supabase/migrations` | #634 (20261108000000), #636 (...010000), #637 (...020000), #677 (20261108000000), plus old #26, #32, #51, #424 | #634 and #677 use the same timestamp: one must renumber. #424, #26, #32, #51 are old and would reorder history if merged late |
| `docs/BACKLOG.md` | #315, #587, #591, #599, #621, #622, #684 | Id ranges: #599 BL-621 to 726, #587 renumbers to BL-739, #684 uses BL-757 on |
| `docs/agents/BOARD.md` | #548, #561, #562, #564, #645, #646, #682 | #564 archives the board; others add rows. Low risk, each a small hunk |
| `docs/qa/DEVICE_TEST_PLAN.md` | #520, #603, #614, #615, #618, #635, #646, #653, #665, #670, #673, #674, #675, #678, #679, #680 | 16 PRs append to one file. Row ids: S1-133 is used by both #520 and #680 (clash); #670 S1-134, #665 S1-140, #673 S1-144, #675 S1-150, #674 S1-151, #679 S1-152 are distinct; row ids of #603, #614 (S1-95), #635 (S1-112), #615 (S1-39), #618 (S1-40), #646 (S1-23, S1-38) differ. #678 edits row S1-31 |
| `apps/mobile/src/app/settings*` | #520, #614, #665, #675 | All in the Build 12 lane; keep them in their order |

Suggested merge order (the founder's named-sha go still applies to each; this is order only):

1. Docs that carry claims and ids: #682, then #599, then #587 (renumbered), then #684, then #664 and #638.
2. Consent chain: #655 (order doc), then #634, #636, #637; renumber #677's migration before it is ever readied.
3. Security small PRs with no shared files: #602, #632, #633, #657, #656.
4. Recording: #670, then #619 (rebase), then #617. #615 and #618 closed.
5. Tests with no shared source: #669, #681, #680; give #680 or #520 a new device-plan row id (second one to land renumbers).
6. Build 12 lane order stays theirs: #635, then #520, then the strings and settings PRs (#644, #614, #521, #675, #683) rebased in turn.

Top risks: (a) the S1-133 and migration-timestamp clashes, which cost a failed CI day if found at merge; (b) counted reviews silently stale because heads move (#520 already moved); (c) the single-file hot spots (strings, device plan) serialising eight to sixteen PRs.

## 5. What I could not verify

- CI for PRs outside the mapped set (marked "not checked" in the appendix), and CI for #672, #678, #655, #664, #638 inside it.
- Counted Review A/B at current heads: only the #659 snapshot (20:35Z) was read, and it predates head changes (#520 confirmed moved).
- Mergeable state: GitHub reported "unknown" for most PRs; "clean" or "dirty" appears only where it was computed.
- Behind-develop counts are against the develop head at fetch; the appendix column is behind, not conflicts.
- Whether the old PRs in section 2 are superseded: titles and labels only, not bodies or diffs. Author lane is clear only where an `agent:` label exists; all PRs share one author login.
- #680 and #681 bodies: ranks follow file 13; not re-read.
- File lists use the first 100 files per PR; #599 and a few large PRs may have more.
- Row ids in `DEVICE_TEST_PLAN.md` were read from added headings only; hunks that edit existing rows were not diffed.
- That #666, #676, #673, #674, #675, #679 belong to the Build 12 lane: inferred from titles and file 13 rule 2.

## Appendix: every open PR (140), read 8 Nov from GitHub REST

Age is days since creation. Behind is commits develop has that the head lacks. Lane is the `agent:` label when present.

| PR | State | Head | Branch | Lane | Age d | Behind | Mergeable | CI (ok/pend/canc/skip/FAIL) | Maps to |
|---|---|---|---|---|---|---|---|---|---|
| #684 | draft | 24a55c5c | docs/backlog-next-8nov | - | 0 | 4 | unknown | pend:2,ok:7 | W1 docs |
| #683 | draft | bb362de6 | feat/content-phone-full-finish-8nov | content | 0 | 4 | unknown | canc:1,pend:1,skip:1,ok:13 | 14 |
| #682 | draft | 6c7393af | docs/board-claims-wave1-8nov | - | 0 | 4 | unknown | ok:10 | W1 docs |
| #681 | draft | 44d2683c | test/bl-names-repeat-suppression | - | 0 | 6 | unknown | pend:1,skip:1,ok:13 | 27 |
| #680 | draft | 4a74c4ef | test/reminders-no-repeat | - | 0 | 6 | unstable | pend:1,skip:1,ok:10 | 23 |
| #679 | ready | 0ad9ad42 | feat/mobile-write-another-thought | mobile | 0 | 2 | unstable | pend:4,skip:1,ok:6 | unmapped |
| #678 | ready | e192b8a3 | docs/cr-60-legal-hold-and-device-plan-nits | - | 0 | 4 | unknown | not checked | 2 |
| #677 | draft | 3a5fd733 | feat/analytics-free-sink | - | 0 | 6 | blocked | FAIL:3,pend:1,skip:1,ok:11 | 22 |
| #676 | ready | f0f9a74d | fix/store-build-signin | security-architect | 0 | 6 | unstable | canc:2,pend:2,ok:10 | B12 lane |
| #675 | ready | 5d1fa193 | feat/mobile-struggling-region | mobile | 0 | 1 | blocked | pend:7,skip:1,ok:6 | unmapped |
| #674 | ready | 36a104e6 | feat/mobile-book-page | mobile | 0 | 1 | blocked | pend:6,skip:1,ok:4 | B12 lane |
| #673 | ready | 234b02de | fix/mobile-qe04-export-schema-url | mobile | 0 | 4 | unknown | canc:1 (compliance-fence); rest not read | B12 lane |
| #672 | draft | 28ae44e9 | docs/legal-store-1-0 | legal | 0 | 4 | unknown | not checked | 2 |
| #670 | draft | df72953d | fix/mobile-bl563-slow-save-review | - | 0 | 6 | unknown | canc:1,pend:2,skip:2,ok:11 | 14 |
| #669 | draft | 2846bff3 | test/bl-736-alpha-allowance | - | 0 | 6 | unknown | pend:1,skip:1,ok:10 | 17 |
| #666 | ready | 1cba10e5 | fix/release-production-profile | ops | 0 | 6 | unknown | canc:1,skip:1,ok:12 | B12 lane |
| #665 | ready | a8614c5e | feat/mobile-bl604-store-family-tab | mobile | 0 | 6 | clean | canc:1,skip:1,ok:12 | 17 |
| #664 | draft | 7a355739 | docs/next-roadmap-8nov | - | 0 | 6 | unknown | not checked | W1 docs |
| #660 | ready | 807babee | chore/status-build-queue | - | 0 | 9 | unknown | ok:9 | unmapped |
| #658 | draft | 6a754710 | docs/ops-bl-603-supabase-logs | security-architect | 0 | 15 | unknown | not checked | 19 |
| #657 | draft | b01a06b4 | feat/auth-bl-597-force-reauth | security-architect | 0 | 6 | unknown | pend:1,skip:1,ok:11 | 3 |
| #656 | draft | f5e820f2 | feat/ops-bl-583-584-migrations-record-purge-alert | ops | 0 | 15 | unknown | canc:1,ok:9 | 5 |
| #655 | draft | 81b260a5 | docs/cto-cr-52-consent-prs | - | 0 | 15 | unknown | not checked | 5 |
| #653 | ready | ab56d011 | docs/drift-sweep-2026-11-08 | - | 0 | 29 | unknown | not checked | unmapped |
| #646 | ready | 78393249 | qa/build-9-readiness | qa | 0 | 40 | unknown | not checked | release record |
| #645 | ready | 54817508 | docs/ops-pipeline-test-2026-11-08 | ops | 0 | 36 | unknown | not checked | release record |
| #644 | ready | 8b00f43f | fix/content-fix-words-in-review | content | 0 | 33 | unknown | canc:1,skip:1,ok:14 | B12 lane |
| #638 | draft | 8f660a2b | docs/prd-v2-readiness-8nov | - | 0 | 15 | unknown | not checked | 24 |
| #637 | draft | dd95a923 | feat/data-bl-585-audit-append-only | data-architect | 0 | 38 | clean | canc:2,FAIL:1,ok:11 | 5 |
| #636 | draft | e484c84b | feat/data-bl-578-deletion-subject-hash | data-architect | 0 | 38 | unstable | canc:2,FAIL:2,ok:10 | 5 |
| #635 | ready | 7566abd0 | feat/mobile-before-you-begin | regulatory-affairs | 0 | 24 | blocked | FAIL:1,skip:3,ok:17 | 7 |
| #634 | draft | 786ef15d | feat/data-bl-577-consent-record-fields | data-architect | 0 | 38 | unstable | canc:1,FAIL:2,ok:10 | 5 |
| #633 | draft | d30fbd0c | fix/mobile-bl-600-https-only-env | mobile | 0 | 6 | unknown | pend:1,skip:1,ok:10 | 3 |
| #632 | draft | 1126c9c1 | fix/mobile-bl-599-keychain-class-test | mobile | 0 | 6 | unknown | pend:1,skip:1,ok:10 | 3 |
| #623 | ready | 74771226 | feat/web-launch-flip-kit | marketing | 0 | 40 | unknown | not checked | B12 lane |
| #622 | draft | c304d8ad | docs/ops-bl-566-staging-backup | ops | 0 | 38 | clean | ok:10 | 10 |
| #621 | draft | d70511f9 | docs/iam-bl-602-chapter-conformance | security-architect | 0 | 38 | unknown | not checked | 19 |
| #620 | draft | 28c5cc4c | docs/ops-bl-598-account-recovery-runbook | security-architect | 0 | 38 | unknown | not checked | 19 |
| #619 | draft | 3610c844 | fix/mobile-bl-572-queue-pause-jetsam | speech | 0 | 4 | unknown | pend:2,skip:2,ok:11 | 14 |
| #618 | ready | 06b9cd02 | fix/mobile-bl-563-564-followups | mobile | 0 | 33 | dirty | skip:1,ok:11 | 14 |
| #617 | draft | cd9d3834 | fix/mobile-bl-568-global-error-handler | mobile | 0 | 5 | unknown | pend:1,skip:1,ok:10 | 14 |
| #615 | ready | 2553f9d6 | fix/mobile-bl-563-finishing-keeps-review | red-team | 0 | 36 | dirty | canc:1,FAIL:2,skip:1,ok:10 | 14 |
| #614 | ready | a87361f2 | feat/mobile-settings-regroup | privacy | 0 | 7 | clean | skip:1,ok:15 | 30 |
| #613 | ready | 4510384a | docs/release-build-9-record | - | 0 | 41 | unknown | not checked | release record |
| #609 | ready | 1bbe9509 | docs/qa-testflight-alpha-checklist | qa | 0 | 39 | unknown | not checked | release record |
| #606 | draft | 2662df3e | docs/build-2-readiness | - | 0 | 41 | unknown | not checked | release record |
| #603 | ready | 7df08a94 | docs/qa-account-experience-cases | qa | 0 | 41 | unknown | not checked | release record |
| #602 | ready | 50344809 | fix/functions-bl-594-new-keys | - | 0 | 46 | unknown | ok:11 | 3 |
| #601 | ready | 00b25af6 | docs/build-gate-2026-11-08 | ops | 0 | 41 | unknown | not checked | release record |
| #599 | ready | 6e8498a4 | docs/backlog-account-experience | - | 7 | 48 | dirty | not checked | 20 |
| #598 | ready | dc799fb9 | docs/compliance-account-experience | regulatory-affairs | 7 | 48 | unknown | not checked | unmapped |
| #597 | ready | 18956e16 | docs/data-account-experience | data-architect | 7 | 48 | unknown | not checked | unmapped |
| #596 | ready | 70d1e9fe | docs/design-account-experience-specs | design-systems | 7 | 43 | unknown | not checked | unmapped |
| #593 | ready | 981e0308 | docs/marketing-store-1-dec | marketing | 7 | 48 | unknown | not checked | 28 |
| #592 | ready | 278448ba | docs/cr-48-merge-path | - | 7 | 46 | unknown | not checked | unmapped |
| #591 | ready | 72e62dce | claude/eloquent-cori-hgq5mj | - | 7 | 51 | unknown | not checked | 17 |
| #590 | draft | ac3f267d | docs/harness-pointer-pass | - | 7 | 41 | unknown | not checked | unmapped |
| #588 | ready | fa9c0fe5 | docs/requirements-customer-voice | - | 7 | 46 | unknown | not checked | unmapped |
| #587 | ready | 1c7dd686 | docs/backlog-store-listing | - | 7 | 48 | dirty | not checked | 28 |
| #586 | draft | 9fec36f5 | fix/web-next-16-4-3 | - | 7 | 48 | unknown | not checked | unmapped |
| #585 | draft | 41a9d746 | docs/harness-release-path-order | - | 7 | 48 | unknown | not checked | unmapped |
| #584 | draft | e10f278a | docs/ops-review-gate-proposal | - | 7 | 50 | unknown | not checked | unmapped |
| #583 | draft | b3207514 | docs/ops-today-page-proposal | - | 7 | 50 | unknown | not checked | unmapped |
| #582 | draft | 7e9084ac | docs/harness-use-now | - | 7 | 48 | unknown | not checked | unmapped |
| #581 | draft | 779ff497 | docs/ops-dependabot-proposal | - | 7 | 50 | unknown | not checked | unmapped |
| #580 | draft | 8dd4893c | docs/ops-harvest-pr-30 | - | 7 | 50 | unknown | not checked | unmapped |
| #578 | draft | bea20a58 | docs/ops-ci-proposals | - | 7 | 51 | unknown | not checked | unmapped |
| #577 | draft | 45aa2197 | feat/harness-decisions-check | - | 7 | 51 | unknown | not checked | unmapped |
| #576 | draft | 92b72116 | docs/d139-alpha-true-line | - | 7 | 41 | unknown | not checked | unmapped |
| #575 | ready | e1476748 | docs/web-launch-markers | - | 7 | 51 | unknown | not checked | unmapped |
| #566 | draft | 99656302 | feat/harness-v2-b09-skip-guard | - | 7 | 59 | unknown | not checked | unmapped |
| #565 | draft | 98f93a66 | feat/harness-v2-b07-today | - | 7 | 59 | unknown | not checked | unmapped |
| #564 | draft | 168619a7 | feat/harness-v2-b04-claims | - | 7 | 59 | unknown | not checked | unmapped |
| #563 | draft | b22d0faa | feat/harness-v2-b03-pipeline-ledger | - | 7 | 59 | unknown | not checked | unmapped |
| #562 | ready | 94391455 | docs/rel-07-secrets | security | 7 | 90 | unknown | not checked | unmapped |
| #561 | ready | 97459790 | docs/rel-10-runbook | ops | 7 | 90 | unknown | not checked | unmapped |
| #560 | draft | 96109d1f | feat/harness-v2-b02-device-kit | qa | 7 | 41 | unknown | not checked | unmapped |
| #559 | draft | b9685f91 | feat/harness-v2-b06-review-gate-core | - | 7 | 59 | unknown | not checked | unmapped |
| #558 | draft | b20c6a3a | feat/harness-v2-b01-build-checklist | - | 7 | 59 | unknown | not checked | unmapped |
| #556 | draft | dfae7bf9 | feat/harness-v2-b10-trace-scope | - | 7 | 59 | unknown | not checked | unmapped |
| #555 | draft | 7a1bd65e | docs/cto-rulings-cr43-cr44 | - | 7 | 41 | unknown | not checked | unmapped |
| #554 | draft | c55bc638 | feat/harness-v2-b15-credentials-text | - | 7 | 59 | unknown | not checked | unmapped |
| #553 | draft | 8afd9458 | feat/harness-v2-b11-workflow-lint | - | 7 | 59 | unknown | not checked | unmapped |
| #551 | draft | 611f1ec9 | docs/harness-v2-design | - | 7 | 60 | unknown | not checked | unmapped |
| #548 | ready | 584cc142 | docs/board-store-listing-claim | - | 7 | 62 | unknown | not checked | 28 |
| #534 | ready | 306215a5 | ci/web-journeys-workflow | - | 7 | 71 | unknown | not checked | unmapped |
| #521 | ready | 462f3b48 | fix/mobile-age-gate-confirm-no | mobile | 7 | 40 | blocked | FAIL:2,skip:1,ok:13 | 30 |
| #520 | ready | 3ae9eab2 | feat/mobile-delete-book-erase-everything | mobile | 7 | 7 | blocked | FAIL:2,pend:2,skip:2,ok:14 | 9 |
| #502 | draft | 15b80d89 | feat/content-d133-true-promise-line | - | 7 | 66 | unknown | not checked | unmapped |
| #500 | draft | 4d107901 | docs/d118-template-line | - | 7 | 176 | unknown | not checked | unmapped |
| #468 | draft | a060ee94 | docs/d118-exception-lines | - | 8 | 194 | unknown | not checked | unmapped |
| #459 | draft | 66bfa857 | feat/web-sample-letter-label | - | 8 | 390 | clean | not checked | unmapped |
| #454 | ready | 87bb255f | docs/exec-rulings-terms-4 | - | 8 | 196 | unknown | not checked | unmapped |
| #449 | draft | 6986bd82 | fix/injection-integrated | - | 8 | 216 | unknown | not checked | unmapped |
| #437 | ready | dc3d3dc6 | fix/web-true-promise-line | - | 8 | 409 | dirty | not checked | unmapped |
| #431 | draft | 4e1d2d79 | docs/claude-md-counts | - | 8 | 211 | unknown | not checked | unmapped |
| #430 | draft | abc48cdb | test/pilot-seeded-tasks-rebased | qa | 8 | 211 | unknown | not checked | unmapped |
| #429 | draft | 607ae7b8 | ci/agent-lane-gates | - | 8 | 216 | clean | not checked | unmapped |
| #424 | draft | ed190f4c | feat/db-compliance-gates | - | 8 | 92 | unknown | not checked | unmapped |
| #398 | ready | 4cd2ba7c | chore/workflows-to-main | - | 9 | 418 | clean | not checked | unmapped |
| #356 | ready | e773be5e | docs/guidelines-ch01-ch10 | - | 11 | 289 | unknown | not checked | unmapped |
| #354 | draft | 9a13b070 | feat/harness-enforced-gates | - | 11 | 289 | unknown | not checked | unmapped |
| #353 | ready | 2d58a2d1 | feat/harness-orchestration | - | 11 | 289 | unknown | not checked | unmapped |
| #352 | draft | 17948068 | feat/harness-task-source | - | 11 | 289 | unknown | not checked | unmapped |
| #351 | draft | c8b5ffd2 | docs/harness-charters-d100 | - | 11 | 289 | unknown | not checked | unmapped |
| #350 | draft | d15f98e6 | test/harness-lane-e2e | - | 11 | 289 | unknown | not checked | unmapped |
| #349 | ready | 44eba198 | feat/harness-agent-identity | - | 11 | 289 | unknown | not checked | unmapped |
| #348 | draft | b35361da | feat/harness-memory-loop | - | 11 | 289 | unknown | not checked | unmapped |
| #347 | draft | ad223ba3 | feat/harness-usage-budget | - | 11 | 289 | unknown | not checked | unmapped |
| #346 | draft | f51d2153 | feat/harness-charter-lint | - | 11 | 289 | unknown | not checked | unmapped |
| #345 | ready | 89d2f882 | chore/pr-size-reporter | - | 11 | 289 | unknown | not checked | unmapped |
| #343 | ready | e0609000 | docs/lessons | - | 11 | 289 | unknown | not checked | unmapped |
| #342 | ready | 80116d33 | docs/threat-model | - | 11 | 289 | unknown | not checked | unmapped |
| #341 | ready | 3f0f9cef | docs/architecture-status | - | 11 | 289 | unknown | not checked | unmapped |
| #338 | ready | cbb08837 | docs/harness-learning-loop | - | 11 | 289 | unknown | not checked | unmapped |
| #326 | ready | 4375860e | fix/brief-review-author | - | 11 | 289 | unknown | not checked | unmapped |
| #325 | ready | 3ba45d2a | docs/cto-rulings-2026-10-28 | - | 11 | 289 | unknown | not checked | unmapped |
| #323 | ready | 5960ce29 | wip/rb-10e-eval-runner-remove | ops | 11 | 289 | unknown | not checked | unmapped |
| #322 | ready | 245d28e6 | wip/rb-15b-rehearsals | ops | 11 | 289 | unknown | not checked | unmapped |
| #321 | ready | 882a8e80 | wip/rb-15a-release-dryrun | ops | 11 | 289 | unknown | not checked | unmapped |
| #320 | ready | fc106450 | wip/rb-33-34-docs | qa | 11 | 289 | unknown | not checked | unmapped |
| #315 | ready | 4a8308c5 | docs/pr-standard | - | 11 | 290 | unknown | not checked | unmapped |
| #168 | ready | 7cb85564 | docs/decision-register-backfill | decision-records | 24 | 301 | unstable | not checked | unmapped |
| #167 | ready | 958ef119 | docs/reference-backfill | reference-docs | 24 | 301 | unstable | not checked | unmapped |
| #164 | ready | b5130568 | docs/knowledge-leads | - | 24 | 427 | unknown | not checked | unmapped |
| #112 | ready | 51dd6c2f | chore/release-agents | - | 25 | 290 | unknown | not checked | unmapped |
| #105 | ready | f6435dd4 | feat/web-home-restructure | - | 26 | 428 | dirty | not checked | unmapped |
| #90 | ready | 5f8a2a91 | docs/debate-in-app-feedback | - | 35 | 449 | unknown | not checked | unmapped |
| #89 | ready | d9fe0ca3 | docs/debate-first-run-defaults | - | 35 | 449 | unknown | not checked | unmapped |
| #88 | ready | bdfe7392 | docs/debate-edit-trust-words | - | 35 | 449 | unknown | not checked | unmapped |
| #87 | ready | 38049fff | docs/debate-data-lifecycle | - | 35 | 449 | unknown | not checked | unmapped |
| #53 | ready | bdd1939e | agent/legal/counsel-question-pack | legal | 36 | 436 | unknown | not checked | unmapped |
| #51 | draft | 64a2f212 | fix/db-search-path-pg-temp | - | 36 | 468 | clean | not checked | unmapped |
| #41 | ready | a83634ce | agent/support/help-centre | support | 36 | 428 | unknown | not checked | unmapped |
| #40 | ready | e63d1852 | agent/decision-science/metric-tree | decision-science | 36 | 428 | unknown | not checked | unmapped |
| #37 | ready | bb2cfd23 | docs/privacy-data-map | - | 36 | 457 | unknown | not checked | unmapped |
| #35 | ready | 2eecd365 | docs/ops-runbooks | - | 36 | 428 | unknown | not checked | unmapped |
| #32 | draft | 660e633c | fix/db-pending-hardening | - | 36 | 468 | unknown | not checked | unmapped |
| #30 | ready | dafb5ff4 | ci/hardening | - | 36 | 430 | unknown | not checked | unmapped |
| #26 | draft | 7048dc1e | test/db-harness-defaults | - | 36 | 468 | unknown | not checked | unmapped |
