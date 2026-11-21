# Tonight's TestFlight alpha: readiness checklist for the founder's phone (Sun 8 Nov 2026)

Owner: `qa`. For the founder, on the alpha build dispatched after the 23:00 UTC merge cut-off (`testflight` profile, servers off; `/home/claude/proposals/tonight-BRIEF.md`). One pass, in order, about 30 minutes [E]. It replaces TF-04 for alpha builds: TF-04's sign-in and Privacy-switch items do not apply with servers and analytics off (`docs/qa/COMPLETENESS_AUDIT.md` section 7).

**Every line is NOT RUN.** Nobody has run this build, or any build, on a phone yet. Change NOT RUN to PASS or FAIL as you go. Results go in `docs/qa/evidence/2026-11-08-<build>-<phone>.md` (template in `docs/qa/evidence/TEMPLATE.md`).

**Your letters come first.** Your phone holds your family's real letters from build 1. Never delete or reinstall the app on it tonight (run-sheets README, "Drill identities" item 2). Steps 1 and 2 run on your phone as an update. Steps 3 to 14 need a fresh install, so they run on a second phone that holds no real letters. If there is no second phone, run steps 3 to 14 on your own phone over the update, skip step 3, and write "over update" next to each result. Use the fictional child Asha for new letters on the second phone.

Build number: ______  Phone and iOS: ______  Second phone and iOS: ______

## Your phone (update over build 1)

| # | Do | Should see | Case | Result |
|---|---|---|---|---|
| 1 | Install tonight's build from TestFlight over build 1. Open the app | Every letter and recording from build 1 is still there; one plays to the end | TF-03 | NOT RUN |
| 2 | Settings, then Export your book; save it to Files | The ZIP saves. Keep it: it is your copy if anything below goes wrong | S1-21 | NOT RUN |

## Second phone (fresh install), smoke and every fix since build 1

| # | Do | Should see | Fix | Case | Result |
|---|---|---|---|---|---|
| 3 | Airplane mode on. Install and open | The 18+ question, nothing selected; no network needed. Turn airplane mode off afterwards | smoke | S1-03 | NOT RUN |
| 4 | Yes, then first run with Asha; set a birthday | Welcome reads "Plus is not part of this test. Every letter is free while you test." If #540 merged: the date picker opens in one tap and saves the day shown | #552; #540 if merged | S1-37 (a); S1-23 V-02 | NOT RUN |
| 5 | Let English download on Wi-Fi | The card never sits at 0% while nothing moves; the progress track is visible; Try again appears after a stall | #541 | S1-15a | NOT RUN |
| 6 | Speak: talk for 1 minute; pause and resume once; Finish | Recording works. If #532 merged, there is no stutter. If #595 merged, Listen never sticks on finishing | #532, #595 if merged | S1-67 (c) | NOT RUN |
| 7 | On Review, watch the words being written down | The bar moves in step with the parts and is never empty at "Part 1 of 3" | #542 | S1-17a | NOT RUN |
| 8 | Keep the letter. Then Type a letter of about 100 words fast, with one autocorrect and one caret move, and tap Add to Asha's book within half a second of the last key | No character lost or doubled; the caret never jumps; both buttons stay above the keyboard; the last word is kept | #545 | S1-36 (a), (g), (j) | NOT RUN |
| 9 | Keep a third and a fourth letter | Both are kept. No "second free letter" toast and no Keep sheet | #552 | S1-37 (a) | NOT RUN |
| 10 | Book: open a letter, play it, go back. Change a letter's date to an earlier month | The letter plays. It moves to that month and the Book reorders. If #544 merged, month numerals like "18" do not run together | #513; #544 if merged | RT-BK-05; S1-38 if merged | NOT RUN |
| 11 | Settings from the Book gear, from a link, and from Add a child | A back chevron on the first screen every time | #546 | S1-23 V-10 | NOT RUN |
| 12 | Settings: read the Plan row and open Plan. Look for See Plus, Redeem a code and Manage subscription | The alpha line, "Plus is not part of this test. Every letter is free while you test." No See Plus and no Redeem a code. Note any Manage subscription button: BL-720 says two remain | #552 | S1-37 (a) | NOT RUN |
| 13 | Settings, Licenses | The list opens fast, grouped by theme, and scrolls | #550 | S1-30 | NOT RUN |
| 14 | Airplane mode: Export your book, then open the ZIP in Files. Then force-quit while a letter is saving, and relaunch | The export works offline. After the relaunch nothing is lost | smoke | S1-21; AL-03 | NOT RUN |

Not in tonight's build unless Karma merges them before the cut-off: the slide plus grow on opening a letter, the two start haptics, the Storage rows, "Word for word", "early" said three times, the Family copy and the progress track and moon (`docs/qa/COMPLETENESS_AUDIT.md` section 5). If any of them merged, its device row is named there.

A failure that loses or changes a letter is S0: stop and report it (DEVICE_TEST_PLAN, "How to use this plan").
