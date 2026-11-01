# AL-09 StoreKit sandbox purchase and trial

> **Drill identities first.** Follow `README.md` "Drill identities": drill phones, drill Apple Accounts and drill app accounts only. A purchase belongs to the Apple Account on the phone, so never buy on the founder's own Apple Account in a drill. Do the drill-phone check (rule 3, with part c) before AL-09.1.

| | |
|---|---|
| Proves | The Keep gate opens Apple's own sheet with neither plan chosen and the trial shown to an eligible account (C-REQ-022, C-REQ-023, F14-REQ-019); a trial purchase turns Plus on and the letter is still kept by the person's own tap; restore, manage, refund and Family Sharing work (C-REQ-020); a lapsed or offline Plus never locks a letter (LEGAL-REQ-050, C-NFR-004); only the person's own letters with words count toward the 2 free letters (D-103, M17; F14-REQ-037); zero purchase data reaches our servers (F14-REQ-014). Alpha plan item 5 |
| Builds | Build 2 at F25. AL-09.1 and AL-09.2 run first on the first build whose products load (products live on the production record only, so no alpha build with the `.preview` bundle id loads them; see the account-wide product id correction in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md`), because they turn Plus on for AL-03, AL-05, AL-06 and AL-08. The StoreKit configuration file in a development build is a fallback only, and every row then says "StoreKit file, not sandbox" |
| Plan | AL-09.1 and AL-09.2: Free, on a phone whose Apple Account has never bought Plus, with **exactly 2** of Drill Mama's own letters kept with words. AL-09.3 to AL-09.9: Plus on (from AL-09.2). AL-09.10: Drill Papa Free on his own phone, with exactly 1 letter of his own kept (AL-05.9). AL-09.11: Plus lapsed |
| Phones and accounts | Drill phones only. Phone A (SE 3) and Phone B (current iPhone) on drill Apple Account A, for restore. Phone C (Drill Papa, from AL-05, on its own Apple Account that never bought Plus) for AL-09.10. **To verify before AL-09 (unverified on 16 Oct):** Apple's TestFlight notes say a TestFlight install buys in the sandbox with the tester's own Apple Account, and the iOS Settings > App Store > Sandbox Account setting is for development-signed builds. On the first TestFlight build, check which account Apple's sheet uses and write the result here. If it is the phone's Apple Account, the trial-eligible account for AL-09.1, AL-09.6 and the Family Sharing pair for AL-09.7 must be drill Apple Accounts (one pair in a Family Sharing group), or those rows run on the StoreKit file |
| Time | about 75 min [E] |
| Needs first | Founder step F14 done: Paid Apps agreement Active, tax and bank, `plus.monthly` and `plus.annual` on the production record (never `.preview`), sandbox testers (FT-06, FT-09); S06's Keep gate (WP-F14-20) merged; the account check in the row above done |
| Record in | the session's evidence file, rows AL-09.0 to AL-09.12, plus the date and build in the step 11 table of `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` |

**The detailed checks are S06's.** The device list is D-1 to D-12 in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11 (on `develop`); S06 is writing the alpha detail for D-1 to D-12 on branch `feat/plus-status-alpha` (not on origin when this sheet was written; https://github.com/thesaurabhpareek/earlyletters/tree/feat/plus-status-alpha once pushed). Where S06's detail and this sheet differ, S06's holds the steps and this sheet holds the alpha pass rule. The step 11 table uses D-7 to D-10 twice; `docs/qa/DEVICE_TEST_PLAN.md` S2-18 to S2-21 give the first four of those their own ids (request to S06 to renumber).

TestFlight installs use the sandbox on their own, and a sandbox subscription renews every day, up to 6 times in a week, whatever its length (Apple, "Testing subscriptions and In-App Purchases in TestFlight", as quoted in DEVICE_TEST_PLAN S2-01). Never write a receipt, a transaction id or a sandbox tester's address into evidence; write the plan name and "shown" or "not shown".

## Steps

| # | Maps to | Do | Expected | Capture |
|---|---|---|---|---|
| AL-09.0 | | The drill-phone check on Phone A, Phone B and Phone C, with part (c). On the first TestFlight build, the account check in the Phones and accounts row. | All pass; the account Apple's sheet uses is written down. If a check fails, **stop** | pass or stop; which account the sheet used |
| AL-09.1 | D-1 | Phone A, Free, exactly 2 of Drill Mama's own letters kept with words. Write a third letter and press Keep. | The Keep sheet (the letter is safe), then See Plus opens Apple's sheet: two plans as two buttons, neither selected; the free trial shown for a trial-eligible account; Restore, Terms, Privacy and Close. The letter is still a draft on Tonight until kept | Screenshot names; yes or no per part |
| AL-09.2 | D-2 | Buy the monthly plan with its trial. | The sheet closes; Plus is on within about 2 s; Review shows again and the person taps Keep (it is never kept for them); Settings > Plan says Plus is on and free until a date | Seconds to Plus on; the "free until" date matches about 1 month |
| AL-09.3 | BL-342 | Settings > Plan after the purchase. | The trial reminder is planned on the phone (the card or line that says when the trial ends) and "Save a copy" of the purchase confirmation is offered (PR #121; DEVICE_TEST_PLAN S2-17 has the full check) | yes or no per part |
| AL-09.4 | D-3 | Phone C (Drill Papa, Free): Read together 5 times; start a second book. | Opens every time, no gate, no Plus sheet; the second book is free (M2) | yes or no |
| AL-09.5 | D-4 | Phone A: Settings > Plan > Manage subscription. Cancel in Apple's sheet. | Apple's sheet in one tap; after cancelling, Plan says it will not renew; the trial reminder is cleared (C-REQ-025) | yes or no per part |
| AL-09.6 | D-5 | Phone B, same Apple Account as the purchase in AL-09.2: Restore purchases. | "Plus is on." within 10 s | Seconds |
| AL-09.7 | D-6 | The second account of the Family Sharing pair (per the account check) on Phone B. | Plus is on through Family Sharing; Plan says so; no refund row | yes or no |
| AL-09.8 | D-7 (second) | Request a refund. | Apple's refund sheet opens | yes or no |
| AL-09.9 | D-8 (second) | Phone A, Plus on: airplane mode, relaunch. | Plus still on; nothing locked | yes or no |
| AL-09.10 | D-103, D-9 (first) | Phone C (Drill Papa, Free, never bought Plus, back in Asha's book with Drill Mama's shared letters synced to this phone: AL-05.15 took him out, so the AL-05 smoke rows at F25 invite him again first). Papa already keeps 1 letter of his own (AL-05.9). Keep one more of Papa's own. Then airplane mode on and keep a third. | Mama's letters on this phone never count toward Papa's 2 free letters: the second of his own keeps with no Keep sheet. The third opens the Keep sheet, which says Plus needs the internet and keeps the letter on the phone; nothing lost | yes or no per part |
| AL-09.11 | D-9 (second) | Let the sandbox subscription lapse (cancelled in AL-09.5; renewals stop after about 6 days, or expire it from the StoreKit file in a development build). | Every book, letter, recording and the export still work; only the Keep step of a new letter asks for Plus | yes or no |
| AL-09.12 | F14-REQ-014 | After the session, read the App Privacy Report for the app (and, if run, the proxy capture from AL-06). | No request to our hosts carries purchase data; StoreKit talks only to Apple | yes or no; domains |

D-10 (AX5 and VoiceOver on Apple's sheet) and D-11 (dark mode) run in the same session if time allows; D-12 is n/a (iOS 17 deployment target, D-098 on PR #126).

## Pass rule

AL-09.0, AL-09.1, AL-09.2, AL-09.5, AL-09.6, AL-09.9, AL-09.10 and AL-09.11 pass on build 2 (AL-09.1 and AL-09.2 may have passed on an earlier build of the same profile; record which). If the Paid Apps agreement is not Active by F25, item 5 fails and the decision rule in `docs/qa/ALPHA_GO_NO_GO.md` applies (alpha plan risk 10).

## Stop rule

A letter locked, lost or hidden behind a paywall, or a purchase that changes anything a person already made, is S0 (LEGAL-REQ-050, the take-back that 03 principle 6 forbids). Stop and tell S06 and the founder.
