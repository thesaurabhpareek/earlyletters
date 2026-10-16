# AL-08 The `EXPO_PUBLIC_SERVER_FEATURES` kill switch and the kill path

> **Drill identities first.** Follow `README.md` "Drill identities". Part B changes staging settings that every account on staging feels, including the family's: run it only while no family member is signing in (before founder step F16, or inside a time box the founder has told the family about first), keep it under 20 minutes, and sign out **only Drill Mama's** sessions. Parts C and D install builds over each other: do the drill-phone check (rule 3) first on each phone; never on a phone with a real book.

| | |
|---|---|
| Proves | A build made with `EXPO_PUBLIC_SERVER_FEATURES=off` has no server code path: no Supabase client, no sign-in, no sync, co-parent entries show coming soon (`apps/mobile/src/lib/capabilities.ts`, D-100); the kill path in `docs/release/TESTFLIGHT.md` "If something goes wrong" (PR #145) works in the order written, and local recording, reading and export keep working while the server side is stopped (LEGAL-REQ-040, F16-REQ-018 intent). 07 G3 "kill switch drill"; alpha go/no-go check 4 (`docs/release/ALPHA_PLAN.md` section 6.1) |
| Builds | Part A on build 1 (switch off) before it goes to Family and Friends (after F12). Parts B and C on rehearsal R1 (switch on) at F19. Part D is optional |
| Plan | Part A: Free, keeping no more than 2 letters. Parts B and C: Drill Mama with Plus on (from AL-05), because they keep more letters |
| Phones and accounts | Drill phones only: Phone A (SE 3) with Drill Mama, Phone B (current iPhone) signed out. An unused drill alias (Mailbox 6) for AL-08.5 |
| Time | Part A 15 min; Part B 20 min; Part C 30 min (two installs); Part D 15 min [E] |
| Needs first | Build 1 on Phone A from TestFlight. For B and C: R1 on both phones, Drill Mama signed in on Phone A with synced letters (AL-04, AL-05), and a switch-off build made from the **same commit** as R1 (the `testflight` profile; #145 keeps it equal to `preview` except that one line) |
| Record in | the session's evidence file, rows AL-08.0 to AL-08.12 |

Remote kill switches (`killSwitches.sync`, `invites`) have no consumers in the alpha builds and no signed remote config reaches a phone before the signing keys are in a build (TESTFLIGHT.md kill path step 5), so they are **n/a** here. Pausing the staging project is the hard stop for exposed data; it is a founder decision and is not rehearsed while family letters are on staging.

## Part A: build 1 has no server path

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-08.0 | The drill-phone check on Phone A and Phone B. | Both pass. If not, **stop** | pass or stop |
| AL-08.1 | Build 1, first run done (AL-01). Welcome, the moment after a save where build 2 offers Keep the book, and Settings. | No sign-in anywhere; Settings has no Account and no Delete account row | yes or no |
| AL-08.2 | Family tab; then open an invite link (one made on R1, or the website's example) from Notes. | The Family tab and the link both show the coming-soon presentation; nothing joins | yes or no |
| AL-08.3 | Use the app for 10 minutes (record, type, Book, export), keeping no more than 2 letters, then read the App Privacy Report. | No Supabase host at all; only the pack host and the speech model host | The list of domains |

## Part B: stop the server side (TESTFLIGHT.md kill path step 1, the part that is safe to rehearse)

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-08.4 | Founder: confirm no family member is signing in now (rule 4). Staging dashboard: Authentication, turn off "Allow new users to sign up". Note the time. | The setting saves | Time (UTC) |
| AL-08.5 | Phone B, signed out: try to sign in with Mailbox 6, which has no account. | Sign-up is refused with a clear message; nothing is lost on the phone; record, type and Book still work | Minutes from AL-08.4 until the refusal; the words shown (paraphrase, no address) |
| AL-08.6 | Phone A, Drill Mama signed in: save a letter. | It saves and syncs as before: turning off sign-ups does not stop existing sessions (that is what signing users out and pausing are for) | yes or no |
| AL-08.7 | Founder: Authentication > Users > the user found by Mailbox 1 (Drill Mama) only > sign out its sessions. On Phone A, wait, then save a letter. | The letter saves on the phone. Sync stops once the access token expires (Supabase's default is about one hour, unverified for this project): the letter stays in its not-sent state (F16-REQ-016's "Not sent yet"; write down the words the screen shows); nothing is lost | Minutes until the not-sent state stayed; letters on the phone before and after |
| AL-08.8 | Founder: turn "Allow new users to sign up" back on, and note the time (Part B must be under 20 minutes). Phone A: sign in as Drill Mama again. | The queued letter syncs once; no duplicate on staging or on the phone | yes or no; minutes sign-ups were off |

## Part C: ship a servers-off build over a servers-on one (kill path step 3)

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-08.9 | Phone A (drill phone): install the switch-off build from the same commit over R1 (TestFlight, or the EAS install link). Open it. | Every letter is still there and opens, plays and exports; no sign-in, no sync, no Account row; the Family tab shows coming soon. Nothing deleted | Letter count before and after (must match); yes or no per part |
| AL-08.10 | Phone A: install R1 again over it. Open it. | Signed in as Drill Mama again (the session in the Keychain), or asked to sign in; letters made in AL-08.9 sync once; nothing doubled | yes or no; count on staging |
| AL-08.11 | Founder, App Store Connect: after every R1 drill row is done, expire the R1 build (TestFlight > the build > Expire build; R1 went only to the "Founder" group). Open the app on Phone B. | No new installs of R1; record whether the installed copy still opens (TESTFLIGHT.md marks this unverified) | What happened, in words |

## Part D (optional): going back to the older build 1

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-08.12 | Repeat the drill-phone check on Phone B; it must hold only drill letters. From TestFlight > Previous Builds install build 1 over R1 or build 2. | The app opens and every drill letter is readable and exportable. The local database is newer than build 1 knows; the migrator leaves a newer file untouched (`newer: true` in `apps/mobile/src/lib/db/migrations.ts`), so this checks build 1 can read it. If anything is missing or the app does not open, testers must **never** be told to go back to an older build: the kill path is a switch-off build from the current commit (Part C) | yes or no; what failed |

## Pass rule

AL-08.0, Part A and Part C pass. Part B passes when sign-ups stop with nothing lost on any phone and sign-ups are back on within 20 minutes. AL-08.11 and Part D record facts the kill path relies on: a surprising result there changes `docs/release/TESTFLIGHT.md` (request to S20), not the pass of this drill.

## Stop rule

Letters lost or doubled in Part C is S0: do not use the switch-off build as the kill path until it is fixed, and tell S20 and the founder the same day. If a family member reports a sign-in problem during Part B, turn sign-ups back on at once and stop.
