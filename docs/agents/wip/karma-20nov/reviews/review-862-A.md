## Review A at f00c2259c841cf460f0eae468f202141ba804028: PASS WITH NOTES
<!-- agent:principal-architect -->
Must fix: none.

Lens A (principal-architect): code shape, contracts, buildability. File `docs/tdd/new-scope/09-capture.md`, 217 lines, ASCII only, TDD 01 tags, no card text copied.

## What I checked
- Facts: I sampled 60 file:line cites against `develop` `d5d12178`. 59 hold; one is mischaracterised (finding 3). Examples that hold: `plannerChildren` maps only `remindersOn` (`lib/reminders/prefs.ts:115-117`); the anchor scans own entries (`prefs.ts:120-131`); sign-out never calls `forgetReminders`, only Erase everything does (`erase-everything.ts:84`); content sets no category or interruption level (`scheduler.ts:153-164`); a cold-start tap lands on Home (`scheduler.ts:256-260`); `review.tsx:599` dates Keep from the draft's creation; `setDraftOccurred` has no caller (`store.ts:1206-1209`); `held_drafts.raw_transcript` is immutable once set (`sync.ts:294`); `toWhisperLanguage` maps unknown to `auto` (`transcribe-language.ts:35-41`); `+native-intent.tsx:49` sends capture routes home.
- Card rows: every NS-13 P0 row (R3 to R6b, R10 to R15, R18, R19, R23, R24, R27, R30, R31) has a test in 1.8 with its file and level. NS-14 P0 (R3, R4, R8, R11) and NS-15 P0 (R4, R11, R16, R18) have tests in their outlines.
- Boundaries: no founder or counsel question is decided. NS-04's start, phones and app group, NS-16 counsel, NS-17 per-language sign-off and NS-20 are OQs with defaults. Words are PROPOSED keys. X2: nothing leaves the phone in NS-13 to NS-18.
- Buildability, wave 2 (NS-13): 1.9 gives six PRs plus P-3 in merge order. Each has rows, files, size, an owner and two lenses, and all are under the limit. The pure `backoff.ts` beside a 377-line planner, and two SQL reads in `db/repos` instead of a row scan (CODE-R11), are the right shape. The session-end settings-prefix list is a registry other cards extend; good.

## Findings (none blocks)
1. Cross-design, one definition: the notification placeholder and categories. 1.3 registers one category with key `notifications.previewPlaceholder` (`privacy.md` agrees). `11-foundations.md` section 2 uses categories `reminder` and `plan` with keys `reminders.previewPlaceholder` and `planReminders.previewPlaceholder`. 1.2 also says every launch re-plans in full (NS-13-R21 by construction), while `11-foundations.md` adds an `app.lastPlannedVersion` key for the same row. NS-32's PR (P-3, BL-966 (c)) lands first, so settle the names there and cite them here.
2. CR-67 AX-1: the native Writing Tools setting is built once under ADR 0039. `mobile` writes it with the `expo-native-module` skill and `design-systems` wires the input. Section 9 K3 names `design-systems` with `mobile` as the owner. CR-67 wins; the "one shared PR before NS-16 to NS-18" order stands.
3. AX-15 (CR-67, next touch): section 6 calls `sync.ts:587` "the push validator". It is `PulledRowSchema` (the pull). `EntryData` (`sync.ts:245`) is a type with no runtime check, so NS-16-R6's 1 to 30 check belongs in the app before enqueue.
4. Section 7, NS-17: the file's rule (a flagged take is not pushed until it has typed words) is CR-67 AX-5's first step. `data-and-sync.md` C8 and S3 now carry the server path, which waits for the founder's reading. The paragraph still says "`held.discard` then a new push"; `data-and-sync.md` S3 withdrew that path because a discard reads as a let-go on the author's other phones (`20261016000000:550-566`). Update on next touch.
5. 1.3: the drafts read "goes through the same account scoping `[X4-R1]` adds". CR-67 AX-12 puts that check in `lib/store` reads (BL-961). Name BL-961 as the dependency of PR 3, not only of the anchor test.

## CI
All checks green at the head, including tests and content rules. The head was older than 10 minutes when I finalised.

## Not verified
- The section 12 platform items (floating triggers across zones, `getLastNotificationResponse` timing, the App Intents and widget paths of NS-04).
- A `held.discard` then a push of the same id.

Reviewer: independent of the author (CR-44).
