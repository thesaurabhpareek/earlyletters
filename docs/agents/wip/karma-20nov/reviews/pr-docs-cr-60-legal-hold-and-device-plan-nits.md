## What and why

Docs only. No code, no `docs/legal/**`, no `.github/**`.

**1. CR-60 in `docs/agents/cto/RULINGS.md`, and one line in `docs/ops/RELEASE.md` section 12.** The 0.9.0 beta Terms and Privacy (BL-565, texts in #616, pages in #652) are merged to `develop` at versioned addresses only, and nothing is live because the website deploys from `main`. The ruling records the founder's answers of 8 Nov 2026 (versioned URLs only; the next-build option to merge #616 and #652 and deploy the website, paraphrased, not quoted), and that the deploy to `main` is held by Karma as a recommendation, not by the founder: the texts state facts only he knows, so the default is that the deploy waits for his answer, with a one-line release. It states what the hold costs (no `terms` row in `policy_versions`, so sign-in in the servers-on test build stays closed and go/no-go row B2-9 cannot pass), how the deploy happens (a website-hotfix PR into `main`, not a release PR that carries all of `develop`), the order of the checks, the door (two-way until the first deploy), and a Debate line. Counsel is not a condition: D-138 item 1 decided to publish ahead of counsel's Q31. The merged #652 commit message and body say the release waits until counsel has read the texts; CR-60 corrects that, and the ruling is the authority. The RELEASE.md line asks a release PR either to have the hold released or not to carry the pages.

**2. Device-plan nits from the 8 Nov build 11 reviews (#661, #662, #663), in `docs/qa/DEVICE_TEST_PLAN.md`.** Each was checked against the code or the shipped copy first.

| # | Where | Finding | What changed |
|---|---|---|---|
| 1 | S1-15a step 7 | "Settings > Recordings" no longer exists. The only `SpeechRow` is in `settings/storage.tsx`; Where your letters live has no download line ("Language downloads live only in Storage", `strings.en.ts` `whereLive`). | "Settings > Storage (the English row)". |
| 2 | S1-15b step 6 | "Downloading" shows only until the first whole percent (`shownPercent`, `downloadingLine`), about 45 s at 1 Mbps (1% of 575 MB). The step typed a line and recorded 20 s before Review, so a tester saw only "Getting ready, n%". | Record first, within the first percent (Speak 10 s, Review, Keep, Book), then type a line. Expected says which line to expect when; Record asks which line was seen and when. |
| 3 | V-08 | A due date that has gone by cannot be set up: `checkDueDate` rejects it ("Choose a due date from today up to ten months ahead"). | Due date of tomorrow, then set the phone date two days on. |
| 4 | DL-04 (c) | The default jumped a year ahead; the shelf is 30 days (`SHELF_DAYS`), so any jump of 31 days or more exercises the same rule, and a TestFlight build lasts 90 days. | 40 days forward is the step; Expected says "jumped (40 days ahead)". |
| 5 | S1-36 (l) | "swipe up to Home" has no meaning on the SE 3, the plan's main phone, which has a Home button; a Face ID iPhone has none. | "go to the Home Screen (press the Home button on the SE 3, swipe up from the bottom edge on a Face ID iPhone)". |
| 6 | S1-97b | The row is one button; Stop is its trailing word (`speech-row.tsx`, `recordings.logic.ts` action `stop`), not a separate button. | Steps, Expected and Record say "tap the row (its word is Stop)". Needs: the "Remove English first" route is offered only once the model is installed, so it now says to stop a started download by tapping the row. |
| 7 | S1-31 (c) | Still headed Recordings; the row is in Storage. | Heading and (c) say Settings > Storage, the English row; a tap while it downloads stops it (S1-97b). |
| 8 | S1-133 | Not on `develop`. The section exists only in open PR #520. | Not changed here. The suggested warning is in a note for the #520 branch. |
| 9 | S1-36 (l) | The save must keep the words exactly as typed, trailing whitespace included (`write-session.logic.ts` `unmount` and `background` write `latest` untrimmed). | The sentence ends with one trailing space; the compare is word for word, space included. |

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here (no test changed)

Ran: `apps/mobile` `qa-release-catalog` and `qa-kill-harness` (58 tests passed; the catalog test also reads the device plan, V-08 and the rulings ids), `billing-plan` (reads the rulings), and `packages/content` (13 files, 309 tests passed, content rules and no-real-family-data included). Added lines contain no byte at or above 0x80 (no em or en dash, curly quote, ellipsis character or emoji). The appended ruling is byte for byte `ruling-cr-60.md`.

Not run: anything on a device, `npm test` at the root, `test:db`, `typecheck` (no code changed).

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not applicable, no behaviour changed)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts` (not applicable, no code)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no app copy changed)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (no database change)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
