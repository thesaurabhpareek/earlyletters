# TestFlight build 9: device check for the founder's phone

Owner: qa. 8 Nov 2026. Fictional family only: use Asha, Avi, Mama, Papa for every name, note and screenshot.
Each line is one action and one expected result. Rows marked **DEVICE** need a real iPhone, a second device type, or a sandbox account; nobody has run them. A fix is in your build only if its pull request merged before the build was cut: tick only the lines for fixes the build contains. Catalog rows: `RT-B9-01` to `RT-B9-13` in `docs/qa/release-test-catalog.csv`.

Result column: write Pass, Fail or Skip. A Fail gets a GitHub issue with `beta` and a severity `S0` to `S3`. S0 (a letter lost or changed, anything stored after an under-18 answer, consent bypassed) stops the session.

| # | Fix | Action | Expected | Mark | Result |
|---|---|---|---|---|---|
| 1 | Install | Install build 9 over build 8 with 2 letters in the book | App opens on Tonight; both letters and the free-letter count are unchanged | DEVICE | |
| 2 | #540 DOB | First run or Add a child: tap Choose a date once | The calendar opens on that one tap | DEVICE | |
| 3 | #540 | Pick a day and tap Done | The saved day is the day you tapped | DEVICE | |
| 4 | #540 | Tap Done without touching the calendar | Today is filled in and Continue is ready | DEVICE | |
| 5 | #540 | Set Settings, Appearance opposite to the phone, open the picker | The picker uses the app's choice, not the phone's | DEVICE | |
| 6 | #540 | Open the picker while the name keyboard is up | The screen does not jump | DEVICE | |
| 7 | #595 Listen | Speak 20 s as Asha's parent, tap Finish | Finishing ends in about 3 s and returns; the draft is on Tonight | DEVICE | |
| 8 | #595 | While it is finishing, look for a Let it go control | There is none | DEVICE | |
| 9 | #532 Listen | Record one 30-minute take on the SE 3 | The clock keeps time, no freeze, Finish saves it | DEVICE | |
| 10 | #523 VoiceOver | VoiceOver on, speaker, quiet room: start a take, stay silent 60 s, pause, resume, finish | The letter has an empty transcript and no synthetic speech | DEVICE | |
| 11 | #523 | Same take, at the pause | "Paused." is spoken once, after the pause | DEVICE | |
| 12 | #523 Primer | Fresh install, tap Speak for the first time | A short primer shows first; the iOS microphone prompt comes after it | DEVICE | |
| 13 | #521 Age gate | On a fresh install tap No, then Continue | A confirm asks "Is that right?" with Yes, I am under 18 and Go back; nothing is stored yet | DEVICE | |
| 14 | #521 | Tap Go back | The question returns with nothing chosen and Continue dimmed | DEVICE | |
| 15 | #521 | Tap No, Continue, then Yes, I am under 18; kill and reopen the app | The stop screen shows and stays for 24 hours | DEVICE | |
| 16 | #508 Tonight | Free phone with 2 letters kept: open Tonight | One plain line above Speak and Type says new letters need Plus; no count, price or button | DEVICE | |
| 17 | #508 | Text size AX5, open Tonight | The line wraps without cutting and the prompt is still reachable | DEVICE | |
| 18 | #508 | Hold 2 letters at the Keep gate, open Tonight | One row "2 letters waiting to be kept"; tap opens both cards, tap again closes | DEVICE | |
| 19 | #510 Notes | Free phone: keep 1 letter and 1 note, then press Keep on a third item | The Keep sheet opens | DEVICE | |
| 20 | #522 Review | Open Review on a spoken draft, put a fix back, switch to Exactly as said and back, Change words and type a sentence | Each change shows on screen | DEVICE | |
| 21 | #522 | Kill the app from the switcher, reopen the draft from Tonight | Same final text, same view, same put-back fix | DEVICE | |
| 22 | #522 | Keep the letter | The draft is gone from Tonight | DEVICE | |
| 23 | #519 Help rows | Settings, If you are struggling, tap a line on the iPhone | The call starts | DEVICE | |
| 24 | #519 | On an iPad or a phone with no SIM, tap the same line | A sheet shows the number as selectable text with Copy | DEVICE | |
| 25 | #519 | Tap Copy | "Number copied" shows and is announced | DEVICE | |
| 26 | #519 | Tap a Write to us row | Mail opens, or a sheet shows the address with Copy | DEVICE | |
| 27 | #544 Book | Book tab with a month age of 10 or more, Light then Dark | The two figures do not touch; kicker, numeral and meta line share one left edge | DEVICE | |
| 28 | #544 | Repeat at AX5 and with Increase Contrast on (full set: DEVICE_TEST_PLAN S1-38) | Numeral stops at its cap, lines wrap, nothing cut | DEVICE | |
| 29 | #520 Erase | Phone never signed in: Settings, a child, Delete this book, type delete | The book leaves every list at once | DEVICE | |
| 30 | #520 | Open Recently deleted, tap Restore the book | The book and its letters return | DEVICE | |
| 31 | #520 | Delete again, tap Erase now | The book is gone for good | DEVICE | |
| 32 | #520 | Settings, Erase everything, confirm, then kill the app at once and reopen | The age question shows; Notification Center holds no reminder; Settings, Storage still lists the speech download | DEVICE | |
| 33 | #517 Plus | Sandbox tester, airplane mode at the Keep sheet: tap See Plus | Our offline line shows; Apple's sheet does not open | DEVICE | |
| 34 | #517 | Same, tap Redeem a code | The same offline line | DEVICE | |
| 35 | #517 | Fresh install, 2 letters kept, slow StoreKit in Xcode Transaction Manager, tap Keep | The letter is held on Tonight; no Plus sheet opens | DEVICE | |
| 36 | #517 | Leave a purchase unfinished, kill the app, relaunch | The purchase finishes and Plus shows within 5 s | DEVICE | |
| 37 | #589 Consent | Server-on build only: open the sign-in consent sheet | Two rows only, Terms of Service and Privacy Policy; both open a live page. With servers off: Skip | DEVICE | |
| 38 | Smoke | Run TF-04 (DEVICE_TEST_PLAN, 15 minutes on the SE 3) | All pass | DEVICE | |

Not covered tonight, by design: Android; the full-disk wording on Listen (BL-567); the 7-day offline Plus grace needs an expired sandbox period and Xcode Transaction Manager, so it is run from `docs/qa/run-sheets/AL-09-storekit-sandbox.md`, not here.
