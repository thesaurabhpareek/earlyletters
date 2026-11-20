## Review B at 0c6b0989124c05818e3d96bd72c1dcf5f1deb26d: PASS WITH NOTES

Delta review (lens B) against my review at 398c7215 (PASS WITH NOTES, no must-fix). The new head is one docs commit on 398c7215 that takes my notes 1 and 2. No must-fix; the remaining notes are optional. Head sha confirmed equal to the one given.

**What I checked and ran**
- The delta is one file: docs/qa/DEVICE_TEST_PLAN.md, 4 lines added and 4 removed, all inside S1-36 (Needs, steps (m) and (n), Expected). Blob ids of write.tsx, write-session.logic.ts, the three test files, release-catalog.rows.mjs and release-test-catalog.csv are identical to 398c7215, so every code and catalog finding in my earlier reviews stands unchanged.
- `git merge-tree --write-tree origin/develop 0c6b0989` (develop still d4b8f5f1): clean.
- The delta's added lines contain zero non-ASCII characters (no dashes, curly quotes, ellipsis characters, emoji). No copy changed.
- Five tests read DEVICE_TEST_PLAN.md (expo-adapter.guard, billing-plan-reminders-scheduler, qa-kill-harness, qa-release-catalog, sweep.disk). I ran all five plus write-autosave, write-session and review-write at the new head: 8 files, 197 tests, all pass.
- CI at this head when I looked: install, native-files, applied-migrations and compliance-fence success; tests and content rules, typecheck, database rules, Deno, B-8 seam check and the store-profile Release launch still in progress; the required check had not reported. A PASS holds only once required CI is green at this exact head.

**Note 1 (was: (m) can pass vacuously): resolved.**
(m) now says keys must still be arriving when the screen goes black, that the side-button hold takes several seconds, that a half-second gap lets the pause write everything, and that such a run is to be discarded. It also gives the two ways to keep keys arriving (a held key on a Bluetooth keyboard repeats; or a second person presses the buttons). That is exactly the gap I flagged. The force-restart sequence and the Expected ("all but about the last second", nothing older missing, a pre-change build shows nothing) are unchanged and still right.

**Note 2 (was: (a) points to a fixture that may not exist): resolved.**
(a) Needs now says that if the 240-letter book cannot be put on the build, the tester records how many letters it held, and under about 100 the cost was not measured. A pass on a small book can no longer be read as a measurement.

**(n) wording (Review A's nits, read by me): accurate against the code.**
Step (n) now says one "Saved on this phone" is shown and announced once after the first stop, and that during the following 25 s nothing new appears, moves or is announced (the line from the first stop may still be on screen). Expected says the same, and that the next announcement, if any, comes at the next stop at least 10 s after the first. That matches the code: `lastAnnounced` starts at 0 so the first pause announces at once; the status view is keyed and stays mounted, so it does not re-appear; no pause, no `settled`, no announce; the next stop is over 10 s later (15 s plus 25 s), so it announces.

**Optional nits (none blocks)**
1. The Record line for (m) asks for the seconds typed and how much of the end was missing; adding "and whether keys were still arriving at the black screen" would make the discard rule auditable. The Record line for (a) could also say "and the number of letters in the book", since Needs now asks for it.
2. Unchanged by choice and still true: the disclosed cosmetic edge (clear the page, press "Another thought" inside the last 500 ms, and `settled` can show and announce "Saved on this phone" for a draft write.tsx just deleted; no words involved; a `value.trim()` guard in `settled` would remove it), and (n) not testing the 10 s rate limit itself.

**Not verified**: anything on a phone (write cost, hitching, VoiceOver behaviour, the force-restart result, whether a held Bluetooth key keeps repeating through the hold); Hermes timer ordering; develop's own failing-test set; required CI at this head.

Reviewer: independent of the author (CR-44).
