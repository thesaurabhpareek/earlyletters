# AL-01 First run and permissions

| | |
|---|---|
| Proves | The 18+ gate comes first with nothing chosen (PRD-REQ-019, LEGAL-REQ-002, F01-REQ-005); a No stops and writes nothing (F01-REQ-002); no OS prompt before the first Speak (F01-REQ-007, F03-REQ-007, C-REQ-001); first run asks only for a name and a birthday or due date (B-REQ-001); the speech download asks first (DEVICE_TEST_PLAN S1-26); the microphone primer comes before the OS prompt and the denied path recovers (F04-REQ-034, F04-REQ-022). Alpha plan item 8 (journey J1) |
| Builds | Build 1 (servers off) before it goes to Family and Friends; build 2 (servers on) on Wed 28 Oct (F25) |
| Phones | Phone A (SE 3) for the full run; Phone B (current iPhone) for AL-01.1, .2, .7 and .8 |
| Time | about 40 min on Phone A, 15 min on Phone B [E] |
| Needs first | The build installed from TestFlight on a phone where the app was deleted first (a fresh install); App Privacy Report on; Wi-Fi available for AL-01.10 |
| Record in | `docs/qa/evidence/<date>-<build>-se3.md`, rows AL-01.1 to AL-01.12 |

Use only the fictional family: the child is Asha, the signature is Mama.

## Steps

| # | Do | Expected | Capture |
|---|---|---|---|
| AL-01.1 | Airplane mode on. Open the app from its icon. | The splash, then the 18+ question. Nothing is selected and Continue is disabled. No system prompt of any kind. It opens with no network | Screenshot of the gate; seconds from tap to the gate (stopwatch or screen recording) |
| AL-01.2 | Choose No, then confirm. Close the app from the app switcher and open it again. | The stop screen; after the relaunch it is still the stop screen. There is no way to record or write | Screenshot name; yes or no for "still stopped" |
| AL-01.3 | Delete the app, reinstall it from TestFlight, airplane mode still on. Choose Yes, Continue. | The welcome screen. Build 1: Start a book only (no sign-in, no "I was invited": `apps/mobile/src/lib/capabilities.ts` off). Build 2: Start a book, I was invited and Sign in | Which buttons showed |
| AL-01.4 | Start a book. Go through first run: the promise, the child (type `Asha`, choose a birthday about 6 months ago), the signature (`Mama`), the spoken language (English). | Only the name and the date are required; nothing asks for a surname, a gender, a photo or contacts. No paywall and no Plus sheet | Steps seen in order; any field required besides name and date (must be none) |
| AL-01.5 | On the last first-run step read the "Get your words ready" card. Do not tap Download yet. | The card shows a size, "Download on Wi-Fi" and "Not now". Nothing downloads before the tap | The size shown (MB) |
| AL-01.6 | Tap Not now. Finish first run. | Tonight opens with Speak and Type. No notification prompt, no microphone prompt yet | yes or no for "no prompt so far" |
| AL-01.7 | Tonight > Speak. | An in-app primer first, then the iOS microphone alert. The alert text says nothing about where recordings are kept | Screenshot names of the primer and the alert |
| AL-01.8 | Choose Don't Allow. Tap Speak again. | The denied card; no second iOS alert. Type still works | yes or no |
| AL-01.9 | Open iOS Settings > the app > Microphone on. Return to the app. | Within about 1 s the denied card becomes the ready state; Speak works | yes or no; seconds |
| AL-01.10 | Turn airplane mode off, on Wi-Fi. Speak, record 10 s of silence, Finish. Review shows the "Get your words ready" card: tap Download on Wi-Fi. | The download starts only now and shows progress; it survives locking the phone for 30 s or resumes after it. The 10 s take is kept as a letter waiting for its words, or is removed if you choose Let it go | Minutes to finish; whether it resumed after the lock |
| AL-01.11 | Settings > Reminders. Read it and leave it off. | No notification prompt appeared at any point before this screen, and none appears unless you turn Reminders on and accept the priming sheet | yes or no |
| AL-01.12 | At the end, open the App Privacy Report for the app. | Build 1: the pack host `packs.earlyletters.app` (signed config and documents) and the speech model host (`huggingface.co` in `apps/mobile/src/lib/models/catalog.ts` today), the model host only after AL-01.10. Build 2: the same, plus the staging Supabase host only after a sign-in (none in this drill). No analytics or crash-report host on either build (`EXPO_PUBLIC_ANALYTICS=off`) | The list of domains |

## Pass rule

Every row passes on Phone A; AL-01.1, .2, .7 and .8 pass on Phone B. Any OS prompt before AL-01.7, any preselected answer on the gate, or any domain other than those in AL-01.12 is a fail.

## Stop rule

Anything the app keeps after a confirmed No (a child row, a letter, a Keychain token) is S0: stop, keep the phone as it is, file the issue.

## Not proved here

The 23 h 59 min relaunch after a No (Maestro E2E-01a with the clock seam), cold start p50 and p90 over 10 runs (DEVICE_TEST_PLAN S1-03), VoiceOver (S1-23).
