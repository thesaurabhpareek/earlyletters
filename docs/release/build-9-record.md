# Alpha build 1, rebuild 1.0.0 (9): release record and checklist

Written 2 Nov 2026, from 07:10 UTC, by the release session earlyletters-d9 on the founder's Mac. Read against `origin/develop` 29dcd7d8 and `origin/main` d4dd76ca. Status words as in `docs/release/1.0.0.md`. This session has EAS access as the project owner and no GitHub write access (no `gh`, SSH key or keychain credential on this Mac), so nothing here is pushed, posted or merged by it.

## 1. Ruling for this session (CR-49)

### CR-49 The next TestFlight build goes from `develop` on the Mac now; the S0 fixes follow in another build; nothing new ships to production today (2 Nov 2026, Karma via release session earlyletters-d9)
- Question: make build 9 now, or wait for the S0 fixes; can this session count as CR-48's second session; what does "production" mean today?
- Tier and type: T1 (servers-off build to the internal Family group, two-way); clear
- Options considered: (a) wait for #595, #589 and BL-594, then build once; (b) build 9 now from `develop`, build 10 when the S0 fixes merge; (c) build from a local merge of unmerged PRs; (d) do nothing.
- Ruling: (b). Build 9 is the `testflight` profile at `develop` 29dcd7d8, only after the full harness, `doctor.ts` and `preflight:testflight` show 0 FAIL, then `eas submit` with the stored key. (c) is refused: a build traces to a commit on `develop`. This session did not author #595 or #589, so it runs two lens reviews on their exact heads; they count only when posted on GitHub against that sha (CR-48 path 1). Here they are evidence the founder can post. BL-594 still needs the founder's own read of the diff (CR-48 item 5). The only production surface live today is the website, deployed from `main` by Vercel; #549 and #573 are on `main`, so "deploy" means verifying the live site serves `main`'s tip. No Supabase production exists, and the store lane waits for 9 Nov (D-106, D-124).
- Why: build 8 has the 0% download stall (#541), which blocks words entirely; build 9 fixes it and is no worse on BL-563. Expo is on the Free plan, 1 of 30 builds used this cycle, no overage (`eas account:usage`, read 2 Nov). Cost of delay is a broken first run for the family each day.
- Stops: any FAIL or red test; any change to EAS env vars, credentials or App Store Connect; staging (spend, S-50); any `ios-v*` tag (setup retro section 0 item 6); the `preview` profile.
- Door: two-way
- Way back: expire build 9 in App Store Connect; build 8 stays.
- Revisit when: #595 and #589 merge (then build 10, before Tue 3 Nov 13:00 UTC).
- Note: CR-48 is used twice on open branches (#592 and #591). This is CR-49; fix the numbering at the next merge.

## 2. Checklist: each in-scope item, its implementation and its evidence

Scope is what this release can carry: alpha build 1's go/no-go rows, the founder's feedback on build 8, the CR-47 S0 freeze exceptions, and production as CR-49 defines it. Build 2 and the store lane are listed for completeness with their blockers.

### 2.1 Build 1 gates (`docs/qa/ALPHA_GO_NO_GO.md`)

| Row | Requirement | Implementation | Evidence (2 Nov) | Status |
|---|---|---|---|---|
| B1-1 | Known `develop` commit, `testflight` profile, server, backup, status report and analytics off | `apps/mobile/eas.json` `testflight` | EAS build 9 from 29dcd7d8; build log lists the profile env; EAS `preview` environment holds no variables (`eas env:list`) | done when build 9 finishes (section 3) |
| B1-2 | Preflight clean except founder items | `apps/mobile/scripts/preflight-testflight.mjs` | `npm run preflight:testflight -w @scribe/mobile`: exit 0, 0 FAIL; 2 WARN (ITMS-91053 email, precompiled ExpoFileSystem framework); 3 UNVERIFIED cleared by hand (manifest equal to the live host; EAS `preview` env empty, so no E2E or Google id) | done |
| B1-2a | Release doctor | `scripts/release/doctor.ts` | exit 0, 0 FAIL; 1 WARN on the `production` channel (RS-07, store lane only) | done |
| B1-3 | `npm test`, typecheck, `test:db` green on that commit | root scripts | 29dcd7d8, Node 26.13: `npm ci` 0; typecheck 0; `npm test` 0 (about 6,460 tests, 1 skipped; trace in report mode); `test:db` 0 (every file ALL PASSED); `test:functions` 0 (200 passed) | done |
| B1-4 to B1-8 | On-phone rows: no server path, first run, record and words, kill subset, export | AL-01 to AL-03, AL-08 | needs a phone and the founder | founder |
| B1-9 | Build says no more than it does; What to test is `whatToTest.build1` | `packages/content/src/release/testflight.en.ts` | content rules green in `npm test`; the text is pasted in App Store Connect by the founder | founder |
| B1-10 | Apple's processing email has no ITMS-91053 warning | privacy manifest | the email after build 9's upload | founder |
| B1-11 | Testers told not to put a child's name or words in feedback | invitation text | unchanged from build 8 | done for build 8, unchanged |
| B1-12 | Download size recorded | TF-01 | App Store Connect after processing | open |
| S-11 | Signed pack manifest live | `publish.ts upload` | `https://packs.earlyletters.app/functions/v1/config/v1/packs` equals `PACK_MANIFEST` in `published.ts` byte for byte (keyId `el-2026-11`, version 1) | done |

### 2.2 Founder feedback on build 8, and what build 9 carries

| Feedback | Fix | In build 9 |
|---|---|---|
| Speech download stuck at 0% | #541 (TF1-DL) | yes |
| Writing-down bar did not follow decode progress | #542 (TF1-DECODE) | yes |
| Write lost the caret, keyboard jumped | #545 | yes |
| No native back on Settings home | #546 | yes |
| Letter date could not be changed | #513 | yes |
| Licences listed what does not ship | #550 | yes |
| Letter limit hit during the alpha | #552 (PL-1) | yes |
| Birthday and due-date picker needs two taps, saves the wrong day | #540 | no: open, not merged |
| Book month numeral and edge | #544 | no: open |

### 2.3 CR-47 S0 freeze exceptions

| Item | PR, head | Review A (correctness) | Review B (tests) | Merge |
|---|---|---|---|---|
| BL-563 Listen stuck on finishing | #595, 8ba2a711e079ebf85a55298e5d726954dbb97135 | PASS; merge clean; new tests fail on base; non-blocking: no "kept" line after a failed or timed-out save | PASS; clean on 29dcd7d8; new tests fail without the fix; typecheck clean | founder go on this sha, or post both reviews (section 4) |
| BL-564 consent sheet 404 link | #589, b981beeb22bd76bbbe9c9cf95886f44e381ce122 | PASS; merge clean; new test fails on base; leftover unused `brand.web.healthPrivacy` | PASS; clean; content 280/280; new BL-564 tests fail without the fix; gap: no content test that `healthLink` is retired | as above |
| BL-594 function keys | branch `fix/functions-bl-594-new-keys` | not reviewed: keys and auth need the founder's own read (CR-48 item 5) | n/a | founder |

### 2.4 Production (CR-49)

| Surface | State | Evidence |
|---|---|---|
| Website, `main` on Vercel | live at `main` d4dd76ca | `/`, `/privacy`, `/terms`, `/auth/callback`, `/j`, `/.well-known/apple-app-site-association` all 200; cache age matches a deploy after #573 (1 Nov 15:52 UTC); none of the phrases #573 bans appear on `/`, `/privacy`, `/terms`, `/pricing`, `/about` |
| Supabase production | does not exist | `docs/release/ENVIRONMENTS.md` |
| App Store `production` profile | after the 9 Nov go/no-go | D-106, D-124; doctor WARN on its `channel` (RS-07) |

### 2.5 Build 2 and beyond (blocked, not this release)

S-50 where staging lives (a spend decision, founder), S-51 to S-54 (staging, auth, EAS `preview` variables, purge worker), D-129 Delete account row (the noon PT Mon 2 Nov drill deadline cannot be met without staging, so the row stays hidden by default).

## 4. The S0 reviews, ready to post (CR-48 path 1)

Run by this session, which did not author either PR, through two separate reviewer agents that saw only the diff and the base files, each told to look for a reason to fail. They share the author's model family: independent in method, not in identity. They count only once posted on the PR against the same head sha; a new push needs new reviews.

#595, BL-563, head 8ba2a711e079ebf85a55298e5d726954dbb97135:
```
## Review A at 8ba2a711e079ebf85a55298e5d726954dbb97135: PASS
Correctness and safety. finishWithin turns a throwing or hanging save into {ok:false}; endTake leaves Listen without deleting anything, so the take survives both paths (sweep on next launch; finalizing map keeps the job). Let it go is gone during finishing. New tests fail on base. Merge with develop: clean. Non-blocking: no "kept" line after a failed save; an open Discard alert when backgrounding starts finishing can still delete (pre-existing).
## Review B at 8ba2a711e079ebf85a55298e5d726954dbb97135: PASS
Tests and regression. Merged onto develop 29dcd7d8 cleanly; mobile tests green apart from a worktree-only licences setup artefact (42/42 in the real checkout); typecheck clean. Reverting the source fix fails "finishing offers no discard" and "the screen waits through finishWithin and never deletes the draft".
```

#589, BL-564, head b981beeb22bd76bbbe9c9cf95886f44e381ce122:
```
## Review A at b981beeb22bd76bbbe9c9cf95886f44e381ce122: PASS
Correctness and content rules. The consent sheet opens only brand.web.terms and brand.web.privacy, both served; /health-privacy is a removed route and the policy docs agree it is not published in v1.0. Content tests 280/280. New test fails on base. Merge with develop: clean. Leftover: brand.web.healthPrivacy and settings.privacy.healthPrivacyLink are defined but unused.
## Review B at b981beeb22bd76bbbe9c9cf95886f44e381ce122: PASS
Tests and regression. Merged onto develop cleanly; content 280/280; typecheck clean. Reverting the fix fails both [BL-564] tests. Gap: no content test asserts healthLink is retired; the guard is the mobile removed-route scan.
```

## 3. Build 9

See section 5 for the build id, submit result and post-release checks.
