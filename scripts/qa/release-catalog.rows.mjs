// Release test catalog rows (docs/qa/RELEASE_TEST_PLAN.md). One source: this file.
// `node scripts/qa/release-catalog.mjs` writes docs/qa/release-test-catalog.csv from it,
// and apps/mobile/test/qa-release-catalog.test.ts fails if the CSV is stale, an id repeats,
// or a cited existing case (E2E, J, S1, S2, TF, DL, AL, D-n) does not exist in its source.
//
// Columns: id, area, title, kind, priority, release, lane, env, devices, covered_by, status, steps, expected
//   kind     happy | unhappy | error | edge | a11y | display | perf | privacy | compliance | upgrade | ops
//   release  B1 (first store build, servers off) | B2 (sign-in, sync, co-parent: 1.0.x) | both
//   lane     unit | web | maestro | kill | device | testflight | production
//   env      local | sim | tf-build1 | tf-build2-staging | sandbox | staging | production
//   devices  matrix tags from RELEASE_TEST_PLAN.md section 3 (ALL = every tier row; REF = SE3 + current)
//   status   covered (an automated case runs in CI today) | automated (an automated case passes when run, no pipeline runs it)
//            | planned (a case is written but has never run)
//            | partial (part of it is written) | gap (no case anywhere) | stale (the written case contradicts a decision)
// Fictional family only: Asha, Avi, Mama, Papa.

export const ROWS = [
  // ---------- 1. Install, launch, update ----------
  ['RT-LCH-01', 'Launch', 'Cold start offline to the age question', 'happy', 'P0', 'both', 'device', 'tf-build1', 'REF,D1,D3', 'S1-03;AL-01', 'planned', 'Fresh install, airplane mode, launch 10 times', 'Gate in p50 <= 1.2 s, p90 <= 2.0 s on SE 3; no network needed; splash matches first frame light and dark'],
  ['RT-LCH-02', 'Launch', 'Store-profile Release build launches on a simulator', 'happy', 'P0', 'B1', 'kill', 'sim', 'SIM', 'ios-compile.yml store-profile Release launch', 'covered', 'CI installs the testflight-profile Release app on a simulator and keeps it up 20 s', 'No crash, no e2e seam in the bundle (B-8)'],
  ['RT-LCH-03', 'Launch', 'preview profile (build 2) Release launch in CI', 'happy', 'P0', 'B2', 'kill', 'sim', 'SIM', 'IMP-53', 'gap', 'Same as RT-LCH-02 for the preview profile with servers on', 'Launches; no crash before the gate'],
  ['RT-LCH-04', 'Launch', 'Install over the previous TestFlight build keeps everything', 'upgrade', 'P0', 'both', 'testflight', 'tf-build1', 'REF', 'TF-03', 'planned', 'Build N with 5 letters, 2 recordings, 1 shelf item; install N+1 over it', 'Counts, hashes, settings, Plus state and free-letter count unchanged; database migrates once'],
  ['RT-LCH-05', 'Launch', 'Alpha (.preview) data does not appear in the App Store app', 'upgrade', 'P0', 'B1', 'production', 'production', 'REF', 'none', 'gap', 'Phone with the .preview TestFlight app and letters; install the App Store app (com.earlyletters.scribe)', 'Two separate apps with separate data. Testers are told to Export before switching; nothing claims the letters move over'],
  ['RT-LCH-06', 'Launch', 'Launch with a newer database than the app knows', 'error', 'P1', 'both', 'unit', 'local', 'n/a', 'MOB-09', 'gap', 'Open a store whose schema version is above the app', 'Recovery screen offers Export what is readable; nothing is written'],
  ['RT-LCH-07', 'Launch', 'Crash screen and launch recovery screen', 'error', 'P0', 'both', 'device', 'local', 'REF', 'S1-34;J20', 'planned', 'Development build, inject a render fault and a migration fault', 'Calm screen, Export what is readable works, relaunch recovers'],
  ['RT-LCH-08', 'Launch', 'Unknown route and deep links never open a recording screen', 'unhappy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-26;J19', 'planned', 'Open scribe://listen, scribe://review?draftId=x, https://earlyletters.com/listen', 'Each lands on Tonight; nothing records; unknown routes show not-found with a way home'],
  ['RT-LCH-09', 'Launch', 'Cold start on the oldest and newest supported iOS', 'happy', 'P0', 'both', 'testflight', 'tf-build1', 'D3,D11', 'TF-06', 'planned', 'TF-04 smoke on iOS 17.x (or the lowest a held phone runs) and on iOS 27.x', 'Both pass; Apple subscription view available on both (target is 17.0)'],
  ['RT-LCH-10', 'Launch', 'Portrait only, rotation locked', 'display', 'P2', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Rotate the phone on every tab and sheet with rotation lock off', 'Stays portrait (app.config orientation portrait); no layout jump'],

  // ---------- 2. Age gate ----------
  ['RT-AGE-01', 'Age gate', 'Nothing preselected, Continue disabled', 'happy', 'P0', 'both', 'maestro', 'sim', 'SIM', 'E2E-01b;J01;AL-01', 'planned', 'Fresh install, open', 'Neither answer selected; Continue disabled; VoiceOver reads it dimmed'],
  ['RT-AGE-02', 'Age gate', 'Yes stores a boolean only', 'happy', 'P0', 'both', 'maestro', 'sim', 'SIM', 'E2E-01b', 'planned', 'Answer Yes; inspect the container', 'Only a yes flag; no date of birth or age stored'],
  ['RT-AGE-03', 'Age gate', 'No stops for 24 hours and survives relaunch', 'unhappy', 'P0', 'both', 'web', 'local', 'WEB', 'E2E-01a;J02', 'automated', 'Answer No, relaunch, move the clock 23 h then 25 h', 'Stop screen; no record or write; way back only after 24 h'],
  ['RT-AGE-04', 'Age gate', 'A thumb slip on No asks to confirm first', 'unhappy', 'P0', 'both', 'unit', 'local', 'n/a', 'SR-C-04', 'gap', 'Tap No, Continue', 'Confirm step before the 24 h lock is written (not built today)'],
  ['RT-AGE-05', 'Age gate', 'Clock moved back after a No', 'edge', 'P1', 'both', 'maestro', 'sim', 'SIM', 'E2E-01a', 'planned', 'Answer No, set the clock 2 h back, relaunch', 'Still stopped; lock does not shorten'],
  ['RT-AGE-06', 'Age gate', 'Reinstall after a No', 'edge', 'P1', 'both', 'device', 'tf-build1', 'REF', 'S1-03', 'planned', 'Answer No, delete and reinstall', 'Behaviour recorded: gate shows again (no Keychain lock) or still stopped; matches what the privacy text says'],

  // ---------- 3. Welcome and first run ----------
  ['RT-FR-01', 'First run', 'Welcome, promise, child, signature, language, first letter', 'happy', 'P0', 'both', 'web', 'local', 'WEB', 'J01;AL-01', 'automated', 'Run first run end to end', 'Each step renders; Tonight at the end; no OS prompt before Speak'],
  ['RT-FR-02', 'First run', 'Same first run on the device at every tier', 'happy', 'P0', 'both', 'testflight', 'tf-build1', 'ALL', 'AL-01', 'planned', 'Run first run on each matrix phone', 'No clipped text, overlapping control or hidden primary button on any screen size'],
  ['RT-FR-03', 'First run', 'Empty, 60-character and pasted 90-character names', 'unhappy', 'P0', 'both', 'web', 'local', 'WEB', 'J01', 'automated', 'Leave empty; paste 90 letters', 'Continue waits with the reason; field keeps 60 and says so'],
  ['RT-FR-04', 'First run', 'Birthday: none, future, due date, due date too far', 'unhappy', 'P0', 'both', 'web', 'local', 'WEB', 'J01', 'automated', 'Each date case', 'Refused in words; picker offers only valid dates on a phone'],
  ['RT-FR-05', 'First run', 'Twins, empty second name', 'unhappy', 'P1', 'both', 'maestro', 'sim', 'SIM', 'E2E-02;J01', 'planned', 'Add a second child; leave the name empty; then fill it', 'Continue waits; both books created; no Plus sheet; switcher lists both'],
  ['RT-FR-06', 'First run', 'Devanagari and emoji in a child name', 'edge', 'P1', 'both', 'device', 'tf-build1', 'REF', 'S1-04', 'planned', 'Name the child in Devanagari; try an emoji', 'Devanagari renders with the right font; behaviour for emoji recorded'],
  ['RT-FR-07', 'First run', 'Download card: Wi-Fi, Not now, low space', 'happy', 'P0', 'both', 'device', 'tf-build1', 'REF,D1', 'S1-26', 'planned', 'Read the card; Download on Wi-Fi; repeat with Not now; fill disk', 'Nothing downloads before the tap; size matches the tier; space line and no button when short'],
  ['RT-FR-08', 'First run', 'Kill during first run', 'edge', 'P1', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Kill on each first-run step, relaunch', 'Resumes at a sensible step; no half-made book; no duplicate child'],
  ['RT-FR-09', 'First run', 'Production build shows English only', 'compliance', 'P0', 'B1', 'unit', 'local', 'n/a', 'SR-C-12;#413', 'planned', 'Production profile: open the language sheet', 'Only English is offered (EXPO_PUBLIC_ENGLISH_ONLY on)'],

  // ---------- 4. Tonight ----------
  ['RT-TON-01', 'Tonight', 'Greeting, prompt, Speak, Type, Not much today', 'happy', 'P0', 'both', 'web', 'local', 'WEB', 'J04;J08', 'automated', 'Open Tonight', 'All present in reading order'],
  ['RT-TON-02', 'Tonight', 'Another thought cycles prompts without repeats', 'happy', 'P2', 'both', 'unit', 'local', 'n/a', 'SR-C-13', 'gap', 'Ask for prompts across a simulated year', 'No prompt repeats within 365 days (today: last 10 only)'],
  ['RT-TON-03', 'Tonight', 'Held letters show as one row', 'happy', 'P0', 'both', 'web', 'local', 'WEB', 'SR-C-08', 'gap', 'Hold 3 letters at the Keep gate', 'One collapsed row, not three cards; standing Plus line after the 2 free letters'],
  ['RT-TON-04', 'Tonight', 'A take recovered after a kill is offered on Tonight', 'error', 'P0', 'both', 'kill', 'sim', 'SIM', 'DL-01', 'covered', 'Kill mid-take, relaunch', 'Take offered as waiting; never deleted'],

  // ---------- 5. Speak (Listen) ----------
  ['RT-REC-01', 'Speak', 'Microphone primer then the iOS prompt', 'happy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-10;SR-C-05', 'gap', 'First tap on Speak', 'Our primer first, then the system prompt; purpose string matches counsel wording'],
  ['RT-REC-02', 'Speak', 'Microphone denied, then allowed in Settings', 'unhappy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'J05', 'partial', 'Deny; tap Speak again; allow in iOS Settings; return', 'Clear way to Settings; Type still works; recording works after allowing without a relaunch'],
  ['RT-REC-03', 'Speak', 'Microphone permission revoked while the app is open', 'error', 'P1', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Revoke in Settings with the app in the background, return and Speak', 'iOS relaunches the app; no crash; denied state shown'],
  ['RT-REC-04', 'Speak', 'Record 60 s offline, letter waits for its words', 'happy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-10;E2E-03;AL-02', 'planned', 'Airplane mode, record, Done, keep', 'Kept as waiting; words arrive later once the model is ready; tap-to-live p95 <= 500 ms'],
  ['RT-REC-05', 'Speak', 'Home, lock and Control Center during a take', 'unhappy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-11', 'planned', 'Record, press Home; record, lock; record, open Control Center', 'Stops within 1 s and keeps the take; no background recording; Review on return'],
  ['RT-REC-06', 'Speak', 'Calls, Siri, timers, AirPods, wired headphones', 'unhappy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-12', 'planned', 'Each interruption during a take', 'Pauses and keeps the take; route changes never end it silently'],
  ['RT-REC-07', 'Speak', 'Kill mid-take, 500 runs', 'error', 'P0', 'both', 'kill', 'sim', 'SIM', 'DL-01', 'covered', 'Kill harness dl01', '0 lost; >= 49 of 50 play to within 5 s'],
  ['RT-REC-08', 'Speak', 'Kill mid-take on the phone', 'error', 'P0', 'both', 'device', 'tf-build1', 'D2', 'DL-06;S1-13', 'planned', 'Swipe away 10 times; once force a reboot', 'Every take kept and plays (ADTS)'],
  ['RT-REC-09', 'Speak', 'VoiceOver never speaks into a recording', 'a11y', 'P0', 'both', 'unit', 'local', 'n/a', 'SR-C-02;B2-21', 'gap', 'VoiceOver on, record, change state', '0 announceForAccessibility calls while recording (listen.tsx calls it today)'],
  ['RT-REC-10', 'Speak', 'Very short and very long takes', 'edge', 'P1', 'both', 'device', 'tf-build1', 'REF', 'J05;SR-C-14', 'partial', 'Record 1 s; record 30 min', 'Short take handled kindly; 30 min cap stops and keeps (cap not built)'],
  ['RT-REC-11', 'Speak', 'Low storage and Low Power Mode', 'error', 'P0', 'both', 'device', 'tf-build1', 'D1', 'S1-14', 'planned', 'Under 1 GB, under 50 MB, under 20 MB; Low Power Mode', 'Warning, refusal, auto-finish with the take kept; transcription completes slowly'],
  ['RT-REC-12', 'Speak', 'Screen stays awake only while recording', 'happy', 'P1', 'both', 'device', 'tf-build1', 'REF', 'S1-26', 'planned', 'Let auto-lock run while recording, then paused', 'Awake while recording; may lock when paused'],
  ['RT-REC-13', 'Speak', 'Thermal pressure during transcription', 'perf', 'P2', 'both', 'device', 'tf-build1', 'D2,D5', 'S1-17', 'planned', 'Ten 5-minute transcriptions back to back', 'Completes; thermal state recorded; no crash'],

  // ---------- 6. Words: models and packs ----------
  ['RT-WRD-01', 'Words', 'Signed pack loads; unsigned pack refused', 'happy', 'P0', 'both', 'unit', 'local', 'n/a', 'SR-C-01', 'partial', 'Load a signed manifest; load a tampered one', 'Signed loads; tampered refused with the recording kept'],
  ['RT-WRD-02', 'Words', 'A spoken letter gets words on the device', 'happy', 'P0', 'both', 'testflight', 'tf-build1', 'ALL', 'AL-02;B2-8', 'planned', 'Record, wait for words', 'Words in Review; 2-minute letter in <= 30 s on SE 3'],
  ['RT-WRD-03', 'Words', 'Compact tier on 3 GB phones', 'perf', 'P0', 'both', 'device', 'tf-build1', 'D1,D3', 'S1-17', 'gap', 'Fresh install on an SE 2 or XR (3 GB)', 'Compact model chosen (190 MB); no jetsam kill; size on the card matches'],
  ['RT-WRD-04', 'Words', 'Model download resume, Wi-Fi wait, cellular opt-in', 'unhappy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-15;S1-26', 'planned', 'Kill at 40%; airplane mid-download; Use mobile data', 'Resumes from bytes; waits for Wi-Fi by default; one-off mobile data only'],
  ['RT-WRD-05', 'Words', 'Model removed, letters stay', 'edge', 'P1', 'both', 'device', 'tf-build1', 'REF', 'S1-15', 'planned', 'Remove the model in Settings', 'Space freed; letters and recordings stay; next letter waits for words'],
  ['RT-WRD-06', 'Words', 'Pack host down or kill switch on', 'error', 'P1', 'both', 'testflight', 'tf-build2-staging', 'REF', 'B2-24;E2E-05', 'planned', 'Turn on packDownloads kill switch', 'No new download; installed packs keep working; honest status words'],

  // ---------- 7. Review ----------
  ['RT-REV-01', 'Review', 'Small fixes shown, put back, word for word', 'happy', 'P0', 'both', 'web', 'local', 'WEB', 'J06;AL-02', 'automated', 'Open a seeded letter in Review; put an edit back', 'Every machine edit marked and reversible; raw kept'],
  ['RT-REV-02', 'Review', 'Edits put back survive a kill', 'error', 'P0', 'both', 'unit', 'local', 'n/a', 'SR-C-06', 'gap', 'Put back an edit; kill 100 times at random', 'Final text identical on relaunch'],
  ['RT-REV-03', 'Review', 'Keep private and Add to book', 'happy', 'P0', 'both', 'web', 'local', 'WEB', 'J06', 'automated', 'Choose each', 'Private letter not in the book; added letter in its month'],
  ['RT-REV-04', 'Review', 'Engine never adds meaning (golden corpus)', 'happy', 'P0', 'both', 'unit', 'local', 'n/a', 'verify.r01 tests;nightly fuzz', 'covered', 'npm test and nightly fuzz', 'verifyEdits refuses every adding edit; corpus green'],
  ['RT-REV-05', 'Review', 'Marks render at every text size', 'display', 'P1', 'both', 'device', 'tf-build1', 'D2,D7', 'S1-24', 'planned', 'Default to AX5', 'Marks in the letter serif at letter size; spaces outside strikes'],

  // ---------- 8. Type (Write) ----------
  ['RT-WRT-01', 'Write', 'Type a letter, autosave, save', 'happy', 'P0', 'both', 'maestro', 'sim', 'SIM', 'E2E-04;J07', 'planned', 'Type Devanagari text, Save', 'Text back exactly; one letter'],
  ['RT-WRT-02', 'Write', 'Kill during save, 500 runs', 'error', 'P0', 'both', 'kill', 'sim', 'SIM', 'DL-02;AL-03', 'covered', 'Kill harness dl02', 'Exactly once or still a draft; 0 lost, 0 doubled'],
  ['RT-WRT-03', 'Write', 'Keyboard up at AX5 on the smallest phone', 'display', 'P0', 'both', 'device', 'tf-build1', 'D2,D4', 'S1-24', 'planned', 'Write at AX5 with keyboard up', 'Room to read what is typed recorded; primary reachable'],
  ['RT-WRT-04', 'Write', 'Paste very long text, dictation key, third-party keyboard', 'edge', 'P1', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Paste 20,000 characters; use the iOS dictation key; use Gboard', 'No freeze; text kept; save works'],

  // ---------- 9. Book and letter ----------
  ['RT-BK-01', 'Book', 'Empty, one, many, waiting, nobody spoke', 'happy', 'P0', 'both', 'web', 'local', 'WEB', 'J09', 'automated', 'Each state', 'Each state renders with the right copy'],
  ['RT-BK-02', 'Book', 'A year of letters scrolls smoothly', 'perf', 'P1', 'both', 'device', 'tf-build1', 'D1,D2', 'S1-21', 'gap', 'Seed about 240 letters; scroll the Book', 'No dropped-frame stutter a person notices; memory stable'],
  ['RT-BK-03', 'Letter', 'Play, silent switch, AirPods, lock', 'happy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-20', 'planned', 'Play with silent on; AirPods; lock', 'Audible in silent mode; stops cleanly on lock'],
  ['RT-BK-04', 'Letter', 'Delete, Undo, Recently deleted, Erase now', 'happy', 'P0', 'both', 'maestro', 'sim', 'SIM', 'E2E-08;DL-05;J10', 'planned', 'Delete, Undo, delete, restore from shelf, Erase now', 'Each step as named; erased letter never returns'],
  ['RT-BK-05', 'Letter', 'Change a letter date', 'happy', 'P0', 'both', 'web', 'local', 'WEB', 'SR-C-10', 'gap', 'Move a letter to an earlier month', 'Lands in that month; book reorders (not built)'],
  ['RT-BK-06', 'Letter', 'Time zone and daylight saving change', 'edge', 'P1', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Save near midnight; change time zone; cross a DST change', 'Letter stays in the month it was kept in; no duplicate months'],
  ['RT-BK-07', 'Letter', 'Region formats', 'edge', 'P2', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Set region to UK and India, 24-hour time', 'Dates read correctly; no US-only format'],
  ['RT-BK-08', 'Read together', 'Free with no limit, Large Print, playback', 'happy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-20;J11;D-3', 'planned', 'Read together 5 times in a Free book', 'No gate ever (D-082)'],
  ['RT-BK-09', 'Read together', 'E2E-06 rewritten to D-082', 'happy', 'P0', 'both', 'maestro', 'sim', 'SIM', 'E2E-06', 'stale', 'Flow expects a gate after 3 sessions', 'Rewrite: no gate on the 4th and later sessions'],
  ['RT-BK-10', 'Children', 'Add a second child is free', 'happy', 'P0', 'both', 'maestro', 'sim', 'SIM', 'E2E-07;D-3', 'stale', 'Flow expects a Plus gate on Add a child', 'Rewrite to D-082: no Plus sheet'],
  ['RT-BK-11', 'Children', 'Hide a book and bring it back', 'happy', 'P1', 'both', 'device', 'tf-build1', 'REF', 'S1-32', 'planned', 'Hide, find, unhide', 'Way back is findable; letters intact'],
  ['RT-BK-12', 'Children', 'Delete a book and Erase everything', 'happy', 'P0', 'B1', 'web', 'local', 'WEB', 'SR-C-07', 'gap', 'Delete one book; Erase everything', 'Gone after one confirm; not on the shelf; or copy changed (not built)'],

  // ---------- 10. Plus: gate and sheet ----------
  ['RT-PLS-01', 'Plus', 'Two free letters, third shows the Keep sheet', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-1;S2-01;AL-09', 'planned', 'Keep 3 letters with words', 'After 2nd: notice. 3rd: Keep sheet, letter safe first, See Plus, Leave it waiting, Redeem a code; no price in our words'],
  ['RT-PLS-02', 'Plus', 'Gate logic and ledger', 'happy', 'P0', 'both', 'unit', 'local', 'n/a', 'core plan.ts tests', 'covered', 'npm test', 'plan.ts 100% lines; free count never decreases; remote config only raises it'],
  ['RT-PLS-03', 'Plus', 'Voice-only letter does not count until its words exist', 'edge', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-1b', 'planned', 'Keep a recording with no model', 'Saves with no Keep sheet'],
  ['RT-PLS-04', 'Plus', 'A kept note counts like a letter', 'edge', 'P0', 'B1', 'unit', 'local', 'n/a', 'SR-C-16', 'gap', 'Keep 1 letter and 1 note, finish a third', 'Keep sheet asks for Plus (ledger counts letters only today)'],
  ['RT-PLS-05', 'Plus', 'Free paths never ask', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-3;S2-03', 'planned', 'Free phone: Read together, add child, Export', 'No Plus sheet'],
  ['RT-PLS-06', 'Plus', 'Reinstall keeps the free count', 'edge', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-7;S2-18', 'planned', 'Delete and reinstall with 2 kept', 'Keep sheet on the next letter'],
  ['RT-PLS-07', 'Plus', 'Device backup restore keeps the free count', 'edge', 'P1', 'both', 'device', 'tf-build1', 'REF', 'D-8;S2-19', 'planned', 'Restore a Free phone to another phone', 'Letters back; third Save shows the Keep sheet'],
  ['RT-PLS-08', 'Plus', 'Keep sheet at AX5, VoiceOver, Reduce Motion', 'a11y', 'P0', 'both', 'device', 'tf-build1', 'D2,D7', 'S1-23 V-06;S1-24;S1-33', 'planned', 'Open the sheet at each setting', 'Nothing truncated; focus on title; escape returns with nothing held'],
  ['RT-PLS-09', 'Plus', 'Double tap Keep it here for now', 'edge', 'P1', 'both', 'device', 'tf-build1', 'REF', 'S1-23 V-06', 'planned', 'Double tap quickly', 'One card on Tonight; second tap does not hit the tab bar'],
  ['RT-PLS-10', 'Plus', 'Returning subscriber on a new phone is not gated before StoreKit refresh', 'edge', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'SR-C-08', 'gap', 'New phone, same Apple Account with Plus, keep a third letter immediately', 'No needs-Plus message before the first entitlement refresh'],

  // ---------- 11. Purchase ----------
  ['RT-PAY-01', 'Purchase', 'Buy monthly trial', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-2;S2-02', 'planned', 'See Plus, Plus Monthly, confirm', 'Back to the same Review; confirmation with Save a copy; Plan shows free until date'],
  ['RT-PAY-02', 'Purchase', 'Buy annual trial', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-12', 'partial', 'Choose Plus Annual', 'Plus on; Plan shows annual and trial end'],
  ['RT-PAY-03', 'Purchase', 'Trial already used: no second trial', 'unhappy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'none', 'gap', 'Tester who had a trial in the group buys again', 'Apple shows the paid price; our words never promise a trial'],
  ['RT-PAY-04', 'Purchase', 'Cancel in the Apple sheet', 'unhappy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-1', 'partial', 'Open Apple sheet, Close', 'Back to Keep sheet; letter still held; nothing lost'],
  ['RT-PAY-05', 'Purchase', 'Payment fails or card declined', 'error', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'none', 'gap', 'StoreKit file: fail transactions; sandbox: invalid payment', 'Calm message; letter held; retry works'],
  ['RT-PAY-06', 'Purchase', 'Ask to Buy pending (child account in family)', 'edge', 'P1', 'both', 'device', 'local', 'REF', 'none', 'gap', 'StoreKit file: enable Ask to Buy; approve and decline in Xcode', 'Pending shown honestly; approve turns Plus on without relaunch; decline leaves Free'],
  ['RT-PAY-07', 'Purchase', 'Interrupted purchase (terms or SCA)', 'edge', 'P1', 'both', 'device', 'local', 'REF', 'none', 'gap', 'StoreKit file: interrupted purchase', 'Completes after the interruption resolves; Plus on'],
  ['RT-PAY-08', 'Purchase', 'In-App Purchases off in Screen Time', 'unhappy', 'P1', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Screen Time, disallow purchases, tap See Plus', 'Plain message; nothing lost; no crash'],
  ['RT-PAY-09', 'Purchase', 'Offline at See Plus', 'unhappy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-9;S2-08;S2-20', 'planned', 'Airplane mode, See Plus', 'Offline line; letter safe'],
  ['RT-PAY-10', 'Purchase', 'Plus works offline after purchase', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-9', 'planned', 'Plus on, airplane mode, force quit, reopen, Save', 'Still Plus; letter saves'],
  ['RT-PAY-11', 'Purchase', 'Purchase made on another device while the app is open', 'edge', 'P1', 'both', 'testflight', 'sandbox', 'D2,D5', 'none', 'gap', 'Buy on phone B with phone A open on the same Apple Account', 'Phone A turns Plus on through the transaction listener without restart'],
  ['RT-PAY-12', 'Purchase', 'Switch monthly to annual and back', 'happy', 'P1', 'both', 'testflight', 'sandbox', 'REF', 'none', 'gap', 'Manage subscription, change plan', 'Plan shows the right plan and date after Apple applies it'],
  ['RT-PAY-13', 'Purchase', 'Storefront and currency', 'edge', 'P2', 'both', 'testflight', 'sandbox', 'REF', 'none', 'gap', 'Sandbox tester in UK and India storefronts', 'Prices come from Apple in local currency; our words carry no price'],
  ['RT-PAY-14', 'Purchase', 'Production purchase smoke with real money', 'happy', 'P0', 'B1', 'production', 'production', 'REF', 'none', 'gap', 'After release: buy monthly with a real Apple Account; then request a refund', 'Plus on in production; receipt environment Production; refund revokes it'],

  // ---------- 12. Offer codes ----------
  ['RT-OFC-01', 'Offer codes', 'Redeem a code from Settings', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-10;S2-21', 'planned', 'Settings, Plan, Redeem a code; enter a sandbox code', 'Apple code sheet opens; Plus on without restart'],
  ['RT-OFC-02', 'Offer codes', 'Redeem a code from the Keep sheet', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-1', 'partial', 'Third letter, Keep sheet, Redeem a code', 'After redeeming, back to the same Review; Keep keeps the held letter'],
  ['RT-OFC-03', 'Offer codes', 'Invalid, expired or used code', 'unhappy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'none', 'gap', 'Enter a wrong code, an expired code, a code already used', 'Apple shows its error; app stays Free; nothing lost'],
  ['RT-OFC-04', 'Offer codes', 'Code while already subscribed', 'edge', 'P1', 'both', 'testflight', 'sandbox', 'REF', 'none', 'gap', 'Redeem a code with Plus on', 'Apple decides eligibility; Plan stays correct'],
  ['RT-OFC-05', 'Offer codes', 'Code redeemed outside the app (App Store link)', 'edge', 'P1', 'both', 'testflight', 'sandbox', 'REF', 'none', 'gap', 'Redeem through the App Store redemption URL, then open the app', 'Plus on at next foreground'],
  ['RT-OFC-06', 'Offer codes', 'Cancel the code sheet; offline', 'unhappy', 'P1', 'both', 'testflight', 'sandbox', 'REF', 'none', 'gap', 'Close the sheet; try in airplane mode', 'Back where you were; offline handled by Apple sheet or our line'],
  ['RT-OFC-07', 'Offer codes', 'StoreKit file code in a development build', 'happy', 'P1', 'both', 'device', 'local', 'REF', 'E2E-14', 'planned', 'Xcode with EarlyLetters.storekit (Sandbox code: Plus Monthly, 1 month free)', 'Code sheet works against the file'],
  ['RT-OFC-08', 'Offer codes', 'Production offer code', 'happy', 'P0', 'B1', 'production', 'production', 'REF', 'none', 'gap', 'Generate one production code in App Store Connect; redeem after release', 'Plus on; Plan shows the free period end; record the date'],

  // ---------- 13. Manage, restore, refund, lapse ----------
  ['RT-SUB-01', 'Subscription', 'Restore on a second phone', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'D2,D5', 'D-5;S2-05', 'planned', 'Fresh install, Restore purchases', 'Plus on within 10 s'],
  ['RT-SUB-02', 'Subscription', 'Restore with nothing to restore', 'unhappy', 'P1', 'both', 'testflight', 'sandbox', 'REF', 'E2E-14', 'partial', 'Restore on an account with no purchase', 'Plain message; stays Free'],
  ['RT-SUB-03', 'Subscription', 'Manage and cancel', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-4;S2-04', 'planned', 'Manage subscription, cancel', 'Plan says stays on until date, will not renew'],
  ['RT-SUB-04', 'Subscription', 'Family Sharing', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'D5', 'D-6;S2-06', 'planned', 'Family member phone', 'Plus on, shared line, no refund row'],
  ['RT-SUB-05', 'Subscription', 'Refund sheet and refund revokes', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-11;S2-07', 'planned', 'Request a refund; in StoreKit file refund the transaction', 'Sheet opens; after revoke Plus off; every kept letter still readable'],
  ['RT-SUB-06', 'Subscription', 'Lapse keeps everything working', 'happy', 'P0', 'both', 'testflight', 'sandbox', 'REF', 'D-11;S2-09', 'planned', 'Let a sandbox subscription end', 'Letters, Read together, Export all work; new letters wait'],
  ['RT-SUB-07', 'Subscription', 'Billing retry and grace period', 'edge', 'P1', 'both', 'device', 'local', 'REF', 'plan.logic grace', 'partial', 'StoreKit file: billing retry, grace period on', 'Plus stays on in grace; honest Plan line; off after grace ends'],
  ['RT-SUB-08', 'Subscription', 'Price increase consent', 'edge', 'P2', 'both', 'device', 'local', 'REF', 'none', 'gap', 'StoreKit file: request price increase consent', 'Apple sheet shows; app state correct after accept or decline'],
  ['RT-SUB-09', 'Subscription', 'Plan reminders and confirmation copy', 'happy', 'P1', 'both', 'device', 'tf-build1', 'REF', 'S2-17', 'planned', 'Buy a trial; read reminders', 'Timing per LEGAL-REQ-047; Save a copy works'],
  ['RT-SUB-10', 'Subscription', 'Apple subscription sheet at AX5, VoiceOver, dark', 'a11y', 'P0', 'both', 'testflight', 'sandbox', 'D2', 'S2-10;S2-11', 'planned', 'Open Apple sheet with each setting', 'Prices read with periods; sheet usable'],

  // ---------- 14. Export ----------
  ['RT-EXP-01', 'Export', 'Export offline, ZIP contents and hashes', 'happy', 'P0', 'both', 'maestro', 'sim', 'SIM', 'E2E-10;E2E-17;J15', 'planned', 'Export, inspect the ZIP', 'Manifest hashes match; originals only, byte for byte'],
  ['RT-EXP-02', 'Export', 'Open on Mac and Windows 11', 'happy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-21', 'planned', 'AirDrop to a Mac; copy to Windows', 'Opens with built-in tools; Devanagari names show'],
  ['RT-EXP-03', 'Export', 'Share the book as a PDF', 'happy', 'P0', 'B1', 'web', 'local', 'WEB', 'SR-C-11', 'partial', 'Book, Share as PDF', 'PDF per child in the share sheet'],
  ['RT-EXP-04', 'Export', 'A year of letters in under 2 minutes', 'perf', 'P1', 'both', 'device', 'tf-build1', 'D2', 'S1-21', 'planned', 'Seed about 240 letters, 230 MB', 'Under 2 minutes on SE 3'],
  ['RT-EXP-05', 'Export', 'Cancel the share sheet; low space during export', 'error', 'P1', 'both', 'unit', 'local', 'n/a', 'COVERAGE #2', 'gap', 'Close the share sheet; fill disk mid-export', 'Temp ZIP removed; clear message; nothing left in cache'],

  // ---------- 15. Settings, reminders, privacy ----------
  ['RT-SET-01', 'Settings', 'Every row opens and returns', 'happy', 'P0', 'both', 'web', 'local', 'WEB', 'J16;S1-31', 'automated', 'Open each row', 'Each opens; back works'],
  ['RT-SET-02', 'Settings', 'Help rows work with no phone line or mail account', 'error', 'P0', 'both', 'device', 'tf-build1', 'D10', 'SR-C-09;S1-23 V-10', 'gap', 'iPad or a phone with no SIM; no Mail account; tap each help row', 'Number or address shown with copy within 1 tap'],
  ['RT-SET-03', 'Settings', 'Appearance: system, light, dark', 'display', 'P1', 'both', 'web', 'local', 'WEB', 'J18', 'automated', 'Switch each', 'Applies at once; no flash at launch (MOB-11)'],
  ['RT-SET-04', 'Settings', 'Licenses page', 'happy', 'P2', 'both', 'device', 'tf-build1', 'REF', 'S1-30', 'planned', 'Open Licenses', 'Opens, scrolls, cold start unchanged'],
  ['RT-REM-01', 'Reminders', 'Reminder asked once after the first kept letter', 'happy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S2-15;SR-C-13', 'gap', 'Keep the first letter', 'Prompt shows once (reminderPrimePending is hard-coded false today)'],
  ['RT-REM-02', 'Reminders', 'Notifications denied, then allowed', 'unhappy', 'P1', 'both', 'device', 'tf-build1', 'REF', 'S2-15', 'planned', 'Deny; enable in Settings', 'App says how to turn on; schedules after allowing'],
  ['RT-REM-03', 'Reminders', 'Focus mode and time zone change', 'edge', 'P2', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Focus on; travel time zone', 'Delivered per iOS rules; no duplicates after re-plan'],
  ['RT-PRV-01', 'Privacy', 'No network contact before consent', 'privacy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-24;TF-11;B1-4', 'planned', 'App Privacy Report through first run and a letter', 'Only expected hosts; no analytics or crash hosts'],
  ['RT-PRV-02', 'Privacy', 'Privacy manifest in the archive', 'compliance', 'P0', 'both', 'testflight', 'tf-build1', 'n/a', 'TF-10;B1-10', 'planned', 'Upload; read Apple processing email', 'No ITMS-91053'],
  ['RT-PRV-03', 'Privacy', 'Screenshots and app switcher', 'privacy', 'P2', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Open the app switcher on a letter', 'Behaviour recorded; matches what the privacy text says'],
  ['RT-PRV-04', 'Privacy', 'iCloud device backup contents', 'privacy', 'P0', 'both', 'device', 'tf-build1', 'REF', 'S1-25;DL-03', 'planned', 'Check backup size before and after a model', 'Recordings in backup, models excluded; copy stays true'],

  // ---------- 16. Accessibility and display (full matrix in RELEASE_TEST_PLAN section 4) ----------
  ['RT-A11Y-01', 'Accessibility', 'VoiceOver walk V-01 to V-10', 'a11y', 'P0', 'both', 'device', 'tf-build1', 'D2,D7', 'S1-23;E2E-15', 'planned', 'Script V-01 to V-10', 'No unlabelled element, no trapped focus'],
  ['RT-A11Y-02', 'Accessibility', 'Dynamic Type sweep xS to AX5 on every screen', 'a11y', 'P0', 'both', 'maestro', 'sim', 'SIM', 'E2E-15;a11y-sizes.sh', 'planned', 'Run the size sweep on SE 3 and Pro Max simulators', 'No truncation or overlap; letter text never capped (D-027, MOB-07)'],
  ['RT-A11Y-03', 'Accessibility', 'Bold Text, Increase Contrast, Reduce Transparency', 'a11y', 'P0', 'both', 'device', 'tf-build1', 'D2,D11', 'S1-24', 'partial', 'Each setting, light and dark', 'Contrast holds; system glass surfaces stay readable on iOS 26 and 27'],
  ['RT-A11Y-04', 'Accessibility', 'Reduce Motion', 'a11y', 'P1', 'both', 'device', 'tf-build1', 'REF', 'S1-24', 'planned', 'Reduce Motion on', 'Sheets fade instead of slide'],
  ['RT-A11Y-05', 'Accessibility', 'Voice Control', 'a11y', 'P1', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Say Show names; tap each primary by its name', 'Every primary has a speakable name that matches its label'],
  ['RT-A11Y-06', 'Accessibility', 'Switch Control and Full Keyboard Access', 'a11y', 'P2', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Walk first run and a letter', 'Everything reachable in order'],
  ['RT-A11Y-07', 'Accessibility', 'Display Zoom', 'display', 'P1', 'both', 'device', 'tf-build1', 'D2,D8', 'none', 'gap', 'Display Zoom on (larger text view)', 'SE 3 renders as a 320-point-wide screen; nothing clipped'],
  ['RT-A11Y-08', 'Accessibility', 'Smart Invert and Differentiate Without Color', 'a11y', 'P2', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Each setting', 'Marks and states readable without colour'],
  ['RT-A11Y-09', 'Accessibility', 'Haptics only at named moments', 'a11y', 'P2', 'both', 'device', 'tf-build1', 'REF', 'S1-05', 'planned', 'System Haptics on, then off', 'Only the named moments; none when off'],
  ['RT-DSP-01', 'Display', 'Dark mode on every screen', 'display', 'P0', 'both', 'web', 'local', 'WEB', 'J18', 'automated', 'Dark appearance', 'All screens readable; matches design tokens'],
  ['RT-DSP-02', 'Display', 'System appearance switches while the app is open', 'display', 'P1', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Toggle in Control Center with a sheet open', 'Updates live; no stuck colours'],
  ['RT-DSP-03', 'Display', 'Every screen size, light and dark', 'display', 'P0', 'both', 'maestro', 'sim', 'SIM', 'none', 'gap', 'Screenshot sweep across matrix simulators', 'Human look at each; no overlap with Dynamic Island or home indicator'],
  ['RT-DSP-04', 'Display', 'Fonts render, Devanagari joins', 'display', 'P1', 'both', 'device', 'tf-build1', 'REF', 'S1-04', 'planned', 'Letters in each script', 'Brand fonts from first frame'],
  ['RT-DSP-05', 'Display', 'iPad compatibility mode', 'display', 'P0', 'both', 'testflight', 'tf-build1', 'D10', 'TF-05', 'planned', 'TF-04 on an iPad, portrait and landscape', 'No clipped controls; sheets present; App Review often uses iPad'],

  // ---------- 17. Network, interruptions, OS ----------
  ['RT-NET-01', 'Network', 'IPv6-only network', 'compliance', 'P0', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Mac Internet Sharing with NAT64; model download, packs, store sheet', 'Everything that needs the network works (App Review tests on IPv6)'],
  ['RT-NET-02', 'Network', 'Slow and lossy network', 'unhappy', 'P1', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Network Link Conditioner: 3G, 100% loss', 'Honest waiting states; downloads resume; no hang'],
  ['RT-NET-03', 'Network', 'Low Data Mode and captive portal', 'unhappy', 'P2', 'both', 'device', 'tf-build1', 'REF', 'none', 'gap', 'Low Data Mode on; hotel Wi-Fi portal', 'Treated as metered; no silent failure'],
  ['RT-OS-01', 'OS', 'Memory warning and jetsam while idle in background', 'error', 'P1', 'both', 'device', 'tf-build1', 'D1,D3', 'S1-17', 'partial', 'Open the camera and games to push the app out, return', 'Restores to Tonight; draft text kept'],
  ['RT-OS-02', 'OS', 'Date set far in the future then back', 'edge', 'P1', 'both', 'device', 'tf-build1', 'REF', 'DL-04', 'planned', 'Clock guard steps', 'Nothing erased early'],

  // ---------- 18. Store, release, production ----------
  ['RT-REL-01', 'Release', 'TF-04 smoke on every TestFlight build', 'happy', 'P0', 'both', 'testflight', 'tf-build1', 'D2,D11', 'TF-04', 'planned', '15-minute smoke', 'All 8 items pass'],
  ['RT-REL-02', 'Release', 'Store-profile preflight', 'compliance', 'P0', 'B1', 'unit', 'local', 'n/a', 'SR-B-05', 'gap', 'Run preflight on production', 'Fails on each wrong switch, missing key, manifest or version'],
  ['RT-REL-03', 'Release', 'Every public claim true of the build', 'compliance', 'P0', 'B1', 'unit', 'local', 'n/a', 'SR-B-01;IMP-67', 'gap', 'Claims test keyed to capability flags', '0 false claims in store, site and app strings'],
  ['RT-REL-04', 'Release', 'Legal pages and support URL live', 'compliance', 'P0', 'B1', 'production', 'production', 'n/a', 'B2-9;SR-B-02', 'planned', 'curl the listing URLs', '200, cover the app, match price and gate'],
  ['RT-REL-05', 'Release', 'App Store build install and first run', 'happy', 'P0', 'B1', 'production', 'production', 'REF', 'none', 'gap', 'Day 0: install from the App Store on SE 3 and a current phone', 'TF-04 items 1, 2, 3, 5, 6, 7 pass on the store binary'],
  ['RT-REL-06', 'Release', 'Phased release watch', 'ops', 'P0', 'B1', 'production', 'production', 'n/a', 'none', 'gap', 'Phased release on; read App Store Connect crashes and Xcode Organizer daily for 7 days', 'Pause the rollout on any S0 or a crash cluster; analytics stay off (D-124)'],
  ['RT-REL-07', 'Release', 'Pack host and models reachable in production', 'ops', 'P0', 'B1', 'production', 'production', 'REF', 'P-06', 'gap', 'Fresh store install downloads English model and pack', 'Signed pack verified; words arrive'],
  ['RT-REL-08', 'Release', 'Rollback rehearsals', 'ops', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'n/a', 'B2-23;B2-24;B2-25;B2-26;B2-27;B2-28', 'planned', 'Run AL-10 rehearsals', 'Each rehearsal recorded'],

  // ---------- 19. Build 2: sign-in and account ----------
  ['RT-AUTH-01', 'Sign-in', 'Sign in with Apple, share and hide email', 'happy', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'S1-06;AL-04', 'planned', 'Keep the book, Apple, both email choices', 'Signed in; Terms once; relay email arrives'],
  ['RT-AUTH-02', 'Sign-in', 'Apple sheet cancelled', 'unhappy', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'none', 'gap', 'Cancel the Apple sheet', 'Back to the sheet; letters safe; no error wall'],
  ['RT-AUTH-03', 'Sign-in', 'Email link and code in mail apps', 'happy', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'S1-08;E2E-12', 'planned', 'iOS Mail, Gmail, Outlook, Messages forward, code typed', 'Link opens the app; code works'],
  ['RT-AUTH-04', 'Sign-in', 'Expired link, wrong code 5 times, resend limit', 'unhappy', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'S1-08;S1-27', 'planned', 'Old link; 5 wrong codes; resend', 'Expired message offers code; 15-minute pause line; send limit line'],
  ['RT-AUTH-05', 'Sign-in', 'Terms and sensitive-data consent at AX5', 'a11y', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'D2,D7', 'S1-27', 'planned', 'New account at AX3 and AX5', 'Agree line fully visible; equal buttons'],
  ['RT-AUTH-06', 'Sign-in', 'Keep on this phone, then Agree and sync later', 'happy', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'S1-27', 'planned', 'Choose Keep on this phone; later Agree and sync', 'Nothing synced until the tap'],
  ['RT-AUTH-07', 'Sign-in', 'Blocked country refused at sign-up', 'compliance', 'P0', 'B2', 'unit', 'local', 'n/a', 'D-131;#424', 'gap', 'Sign-up from a blocked storefront or region signal', 'Refused with a plain message; no account row'],
  ['RT-AUTH-08', 'Sign-in', 'Sign out with letters queued; Stay signed in', 'edge', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'S1-27;S2-14', 'planned', 'Queue a letter offline; sign out', 'Waits for the queue; Stay signed in works'],
  ['RT-AUTH-09', 'Sign-in', 'Apple credential revoked; account deleted elsewhere', 'error', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'S2-14;SR-C-20', 'gap', 'Revoke in Apple ID settings; delete on another phone', 'App signs out with a plain message; local letters kept'],
  ['RT-AUTH-10', 'Sign-in', 'Session survives a week and a reinstall', 'edge', 'P1', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'none', 'gap', 'Leave signed in 7 days; reinstall', 'Token refresh works; reinstall asks to sign in again'],
  ['RT-ACC-01', 'Account', 'Delete account, Export first, cancel', 'happy', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'S1-35;S2-13;E2E-09;AL-07', 'planned', 'Delete as sole parent; cancel', 'Scheduled then cancelled; no residue after completion'],

  // ---------- 20. Build 2: co-parent and sync ----------
  ['RT-SYN-01', 'Sync', 'Two phones, one book', 'happy', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'D2,D7', 'S1-22;AL-05', 'planned', 'Mama saves; Papa sees', 'p95 30 s; no raw transcript or private letter on the other phone'],
  ['RT-SYN-02', 'Sync', 'Offline queue survives a kill', 'error', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'S1-22;AL-05', 'planned', 'Save 2 offline, kill, reconnect', 'Both sync once'],
  ['RT-SYN-03', 'Sync', 'Conflict copies are visible', 'edge', 'P0', 'B2', 'unit', 'local', 'n/a', 'IMP-47', 'gap', 'Edit the same letter on two phones offline', 'A screen shows both or testers are told (no UI calls listConflicts today)'],
  ['RT-SYN-04', 'Co-parent', 'Invite link cases a to d', 'happy', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'D2,D7', 'S1-09;E2E-13', 'planned', 'Not installed, cold, warm, long press, paste', 'Each works; no child name on the web page; dropped after an 18+ No'],
  ['RT-SYN-05', 'Co-parent', 'Third parent refused; leave the book', 'unhappy', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'REF', 'B2-5;SR-C-21', 'partial', 'Third invite; leave after 72 h', 'Refused on create and accept; leave works (not built)'],
  ['RT-SYN-06', 'Backup', 'Backup and restore drill', 'happy', 'P0', 'B2', 'testflight', 'tf-build2-staging', 'D2,D5', 'B1-01;AL-06;DL-03', 'planned', 'Back up, restore to a second phone', 'Equal hashes; recordings play'],
  ['RT-SYN-07', 'Server', 'Access rules and leak suite against staging', 'privacy', 'P0', 'B2', 'unit', 'staging', 'n/a', 'B2-16;npm run test:db', 'partial', 'test:db against staging', 'Green; never waived'],
  ['RT-SYN-08', 'Server', 'Every RPC an Edge Function calls exists', 'error', 'P0', 'B2', 'unit', 'local', 'n/a', 'IMP-55', 'gap', 'Contract test over functions and migrations', 'Fails on a missing RPC (catches the invite 503)'],
];
