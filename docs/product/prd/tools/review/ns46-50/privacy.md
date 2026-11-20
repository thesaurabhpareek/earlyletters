# Review of NS-46 to NS-50 through the privacy lens (20 Nov 2026)

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

Reviewer: `privacy` (Privacy Engineer, a Claude role; not counsel, not a regulator). Nothing here is legal advice; every legal or store reading is "counsel must confirm". Docs only: I changed no card, ruling, code or other file, and ran no test or device.

Lens: religion, native country, pictures, child data, lock-screen text, on-device storage, deletion and export, privacy label.

## 1. What I read

Repo (branch `docs/locked-pack-inputs-20nov`): `CLAUDE.md`; `21-days-cultural-photos-home.md` in full (all five cards); `20-founder-direction-20nov.md`; `18-errata-after-lock.md`; `GAP-LOG.md` rulings K, R-IA-1 to 6, N-1 to 8, CB-1 to 6, DL-1 to 10; `functions/BRIEF.md`; function files `privacy.md`, `cultural-background-data.md`, `photos-and-suggestions.md` (sections 1 to 2 and the FR rows), `lifecycle-and-platforms.md` (FR-LCY rows by grep); `FUNCTION-TRACE.md` (FR-CUL, FR-PHS rows); `docs/legal/DATA_CLASSIFICATION.md` (rules 1.1, 7, lock-screen item at line 791); `docs/legal/app-store-privacy-labels.md` (rows and build-state table); `docs/design/NOTIFICATIONS.md` section 4.

Code read (not run): `apps/mobile/src/lib/reminders/prefs.ts` (header), `scheduler.ts` (lines 97, 148-159, 336-339), `lib/packs/app-support.ts:38-39`, `modules/scribe-files/ios/ScribeFilesModule.swift` (backup-exclusion functions), `lib/export/schema.ts` (`ExportPhoneConsent`, about line 271), `app.config.ts:44, 260`, `supabase/migrations/20261002020000_data_governance.sql:253, 1093`.

Not read: `planner.ts` beyond what the function files cite, the e2e DESIGN files, the five WORDS files, App Review Guidelines 5.1.3 (health data), the Developer Program License Agreement, any law text. Those stay UNVERIFIED below.

### Outside facts read this session

| # | Source | What I rely on |
|---|---|---|
| O1 | Apple, App Privacy Details, https://developer.apple.com/app-store/app-privacy-details/ | "Data that is processed only on device is not 'collected' and does not need to be disclosed ... If you derive anything from that data and send it off device, the resulting data should be considered separately." Sensitive Info lists "pregnancy or childbirth information" and "religious or philosophical beliefs". Photos or Videos is "The user's photos or videos" |
| O2 | Apple, Presenting the suggestions picker and processing a selection, https://developer.apple.com/documentation/JournalingSuggestions/presenting-the-suggestions-picker-and-processing-a-selection.md | "the system shares only the details of the chosen suggestion with your app"; the completion handler receives the suggestion and its `items` (photo, workout with route and heart rate, contact, location with coordinates, song, steps, state of mind from Health, event poster and more); the sample reads `suggestion.title` as well; the entitlement is required and is added by "enabling the Journaling Suggestions capability in Xcode"; the consent sheet shows once per device; "Suggestion data requires careful handling" and points to the Developer Program License Agreement |

Everything else I mention from outside the repo is UNVERIFIED.

## 2. Findings

Severity: P0 blocks build; P1 fix before build; P2 note. No P0 found. Row ids are the card's. "New row needed" means no backlog id exists (none above BL-999 invented).

### 2.1 NS-47 Cultural background (and the store it shares with NS-46)

**F1. NS-47-R6 and R7 vs where the asked flag must live. P1.**
- Wrong: R6 says "a restored phone asks again". But `culture.asked` has to survive sign-out (R15: "the flag stays keyed to A") while the store is cleared, so the flag cannot live in the store file. It must live in `settings` in `scribe.db`, which `data-policy.md:144` says is in the iPhone backup (UNVERIFIED in code; the function file says the same). A restored phone then has the flag `done` and an empty list, so it does not ask again. R6 and R7 contradict each other and a test written to R6 fails.
- Evidence: card lines 383, 384, 392, 428 (flag is "L2, per account"); `cultural-background-data.md` section 1.3 on the backup claim.
- Change, R6 wording: "a restored phone opens with an empty Days list and does not ask again; Me, Days is one tap away". Keep the flag in `settings` (it holds no tradition, only that a question was shown). Test: restore fixture has flag `done`, list empty, no ask slip.

**F2. NS-47-R6 backup exclusion must fail closed. P1.**
- Wrong: the whole "only on this phone" call-out rests on the exclusion holding. The primitive exists and can be read back (`app-support.ts:38-39` sets then reads `isExcludedFromBackup`, and records `backupExcluded`). R6 does not require that check, so a failed `setExcludedFromBackup` would silently make the call-out false.
- Change, new clause on R6: "Given the store directory, When it is created or opened, Then the app sets the exclusion and reads it back; if it reads false the store refuses to write, C-S24 shows `days_store_unavailable`, and nothing is ticked". Test: fake the module returning false; assert 0 bytes written. Also assert the exclusion on the directory and on any `-wal` or temp sibling if the store is SQLite.

**F3. NS-47-R8/R12 vs NS-46-R4 and NS-48 section 10: what rides in the notification payload, and how the landing finds the day. P1.**
- Wrong: three places disagree. NS-46-R4 gives the planner item the content key `days.<id>` (a day id such as a faith day). NS-48 section 10 (line 627) says `scheduler.ts:159` "tap payload may carry `key` for debugging". NS-47-R12 says every identifier is opaque and R8 scans `userInfo`. Built today the payload is `{ source, kind }` and the identifier is `p.id` (`scheduler.ts:154-159`). A payload that holds `days.diwali` sits in iOS's pending-notification store and in the delivered notification on a lock-screened phone. Separately, NS-46-R13 says a tap lands on Home "showing the day's name" while NS-47-R12 says no route parameter holds the day. Nothing says how the landing knows which day. If it recomputes from the local date it fails when the tap comes the next day or after a time-zone change.
- Change, NS-47-R12 (add) and NS-46-R13 (add): "The notification identifier and `data` are an allowlist of `source`, `kind` and one random slot token. The token resolves to day ids only inside the days module's store; if it does not resolve (list cleared, signed out, token stale), Home opens as an ordinary Home with no day line and no error. No `days.*` key, day id, tradition or NS-48 catalogue key is in `identifier`, `data`, `userInfo` or a route parameter." Strike "tap payload may carry `key` for debugging" for library-day and neutral notes. Test: build every library-day notification request and assert `JSON.stringify(request)` has no day id, tradition or `days.` substring; tap with a cleared store lands on plain Home.

**F4. NS-47-R15 sign-out: delivered notifications and forced session end. P1.**
- Wrong: R15 clears "scheduled notes". A note already delivered to Notification Center (with the day name if the switch was on) stays until dismissed, and account B on the same phone could see it. The scheduler already dismisses delivered notifications of ours elsewhere (`scheduler.ts:336-339`), so the fix is cheap. Second: FR-CUL-17 and R17 say another phone clears when "its session ends". A session can end without the parent's act (token failure). The card does not say whether that clears the days; as written it does, silently, and the parent loses their list with no line.
- Change, NS-47-R15 (add): "and every delivered library-day notification is dismissed at the same moment". NS-47-R15 (add): "a session ended by the system clears the store the same way; the next time the parent opens Me, Days, one calm line says the list was cleared when the session ended and they may choose days again; no count, no 'you lost'". Test: deliver a fake library-day note, sign out, assert it is dismissed and B reads nothing.

**F5. NS-47-R12/R13 and NS-46-R17: a faith day name beside a child name on a lock screen. P1.**
- Wrong: with both switches on, nothing forbids a string that carries the day name and `{child}`, which is a lock-screen sentence pairing a child with a tradition. NS-47-R3 forbids exactly that pairing on screens ("your child is {tradition}"), but only for screens. NS-46-R17 bans `{child}` in a names-off lock string, which leaves it allowed with names on. NS-46 landing words `days.landing.bright` also pair `{day}` and `{child}`; that is on the unlocked Home, which I accept.
- Change, NS-47-R12 (add): "No lock-screen title or body, in any switch state, holds both a day name of a family, tradition, culture-led or national day and a child name." Test: the R13 snapshot enumeration renders every key under all four switch combinations and fails on both tokens in one string.

**F6. NS-47-R13 and N-3: which days may name themselves on a lock screen. P1 (conflict flag, not a reopened ruling).**
- Wrong: N-3 (GAP-LOG line 428) says "seasons, civic". DL-1 (line 449) calls the layer "civic and commemorative", and NS-46 puts Memorial Day, Veterans Day, MLK Day and Juneteenth there. Naming Memorial Day or Veterans Day on a lock screen can imply a bereavement or service in the household; Juneteenth and MLK Day can imply heritage. These are the same outing risk NS-47 section 13 names for faith. The card's own conflict 2 leaves this to Karma without a recommendation.
- Evidence: card lines 71, 390; GAP-LOG 428, 449; NS-46-R16 already marks these days `quiet`.
- Change: set `publicTitleOk: true` only for the seasonal and shared layer (seasons, New Year, Thanksgiving, 4 July, Labor Day); `publicTitleOk: false` for the commemorative and civic-remembrance days (Memorial Day, Veterans Day, Juneteenth, MLK Day, Presidents' Day is neutral either way). NS-46-R1 already carries the field, so no new machinery. If Karma reads N-3 as covering them, the card says so and I accept it as the ruling.

**F7. NS-47-R26 and NS-50-R9 vs errata E18. P1.**
- Wrong: E18 ruled one rule: the app-switcher snapshot is blank with or without App lock. NS-50-R9 is written "Given App lock on and the app going to the background", and NS-50 section 5 repeats "App lock on". Read literally it permits a day name in the snapshot when App lock is off.
- Change, NS-50-R9 and section 5 row: "Given the app goes to the background, Then the snapshot of Home and Me shows no day name, with or without App lock (E18)". Test runs both lock states.

**F8. NS-47 call-out and the shared phone. P2.**
- The Days page shows the list to anyone who unlocks the phone and App lock is optional. The call-out says "Only on this phone", which is true, but a parent may read it as "only I can see it".
- Change: one plain line on C-S24 under the call-out, with a claims row: "Anyone who can open this phone can see this list. App lock keeps it private." (intent; `content` writes it; the second sentence only while App lock exists as a switch in Me).

**F9. NS-46 section 10 (table refresh route) vs "nothing leaves the phone". P1.**
- Wrong: the Data section lists "table refresh route (NR-DAY-07)" and leaves "bundle or downloadable pack" open (line 206, 233, 308), while R6 says a corrected table ships with an app update. A download that is chosen per tradition, or sent with the user's ticks, is a request that reveals a tradition even though no "day id" is in the body. NS-47-R4's network fake only looks for a day id, tradition or country.
- Change, NS-46-R6 (add): "The library is one file, identical for every phone; any refresh is a single whole-library fetch that does not vary with the store's contents, with no query, header or path derived from ticks or browse choices. Default: bundled, refreshed by app update (as the card's default)." Test: run the fetch with an empty store and with every day ticked; the requests are byte-identical.

**F10. NS-47 and support. P2.**
- Support will hear "my Eid date is wrong" (card line 133, FR-DAY-21 macro). A "Report a date" link that prefilled the day into a `mailto` would put a tradition in an email. FR-PRV-12 pins the `mailto` builder to a fixed subject plus version; this card does not extend it.
- Change, NS-47-R8 (add to the canary surfaces) and a new row: "No support link, `mailto` or article link carries a day id or name; the macro asks the parent to say it in their own words". Owner `support`, `privacy`.

**F11. NS-47 store versioning and Android line. P2.**
- The store is a new file outside `scribe.db`, so the `user_version` migration tests (FR-LCY-01 to 03) do not cover it. A TestFlight rollback over a newer file could drop or rewrite it. Also FR-LCY-31 asks every new store or native module for a "what Android would do" line; none appears in NS-46 or NS-47.
- Change, NS-47 section 10: the file carries a version number; a higher unknown version is read for the keys it knows, never rewritten or deleted (FR-LCY-03). Add: "Android would read the same file; the store has no iOS-only field."

**F12. Existing `child_member_prefs.celebrations_paused`. P2.**
- `data_governance.sql:253, 1093` holds a server-synced L3 per-member "celebrations paused" setting ("may reflect a hard season"), and `NOTIFICATIONS.md:65` designed an earlier opt-in celebrations list with a separate names switch. NS-46 and NS-47 never say whether a library-day note honours `celebrations_paused`. A parent who paused celebrations for a hard season could still get a Mother's Day note.
- Change, NS-46-R25 (add): "A library-day note obeys `celebrations_paused` for the active member". Default yes. The setting is server-held L3 and read, never written, so NS-47-R4 is unaffected.

**F13. FUNCTION-TRACE cites stale NS-47 row ids. P1 (documentation).**
- Wrong: `FUNCTION-TRACE.md:731-741` maps FR-CUL-02 to "NS-47 R1", FR-CUL-03 to R2, FR-CUL-04 to R3, FR-CUL-05 to R4, FR-CUL-06 to R5, FR-CUL-12 to R11. In the card as written those are R2, R3, R4, R5, R6 and R12 (R1 is the L4 registry row). A trace consumer will test the wrong rows, and `[NS-47-R6]` is a P0 about the backup.
- Change: Karma regenerates the FR-CUL (and FR-PHS, whose card rows moved as well) mappings from the card's final numbering.

### 2.2 NS-46 Days we mark (beyond F3, F6, F9, F12)

**F14. NS-46-R6 and R10: the notification time is itself a mild signal. P2.**
- A neutral "Something for the book today" at 09:00 on 3 or 4 dates a year, apart from the evening reminder slot, shows a pattern to a household member who watches the phone. It reveals no tradition. Accept; one line in the threat table so it is a decision, not an oversight. No card change.

**F15. NS-46 happy path and fixtures. P2.**
- R8 uses real faith days in planner fixtures (14 Feb 2029, 16 May 2027). That is fine for pure date tests. Add: planner fixtures that tick days attach them to no Asha book and no recorded screenshot (FR-CUL-08, NS-47-R8 pattern), so `no-real-family-data` and the E-S27 screenshot rule hold.

### 2.3 NS-48 Notification catalogue

**F16. NS-48-R5 and N-4: a lock-screen body shaped by the kind of the last letter. P1 (conflict flag).**
- Wrong: the kinds are spoke, typed, picture, first and "small" ("not much today"). A visible body that follows from "small" or "first" is a lock-screen line derived from entry metadata about how the parent's day went. `DATA_CLASSIFICATION.md` rule 7 (line 59) makes "anything that could imply a person's mental state" L4 even when it looks like metadata; rule 1.1.2 makes derived data inherit; item 4 at line 791 allows L4 in local notification text only behind the names toggle, default off. N-4 (GAP-LOG 429) allows the body to mention the kind regardless of that switch.
- Evidence: card lines 580, 689; DATA_CLASSIFICATION 59, 791.
- Change (not a reopening of N-4): keep N-4 for spoke, typed and picture, which describe the act of capture. For "small" and "first" the last-letter layer is used only when the names switch is on and App lock is off; otherwise the grid runs. NS-48-R27 already makes unbuilt kinds fall back to the grid, so the code path exists. Test: with names off, no `ntc.kind.small.*` or `ntc.kind.first.*` key is ever selected.

**F17. NS-48 expecting books and the lock screen. P1.**
- Wrong: scenario table (line 567) says an expecting-only plan uses lines "tagged before birth: yes". Apple's Sensitive Info type names "pregnancy or childbirth information" (O1) and `DATA_CLASSIFICATION` rule 7 makes the due date L4. A lock-screen line that says "before the baby arrives" tells a passer-by about a pregnancy with names off.
- Change, new row NS-48-R28 (P0 (a), a promise: zero child names and no health-adjacent fact on a lock screen by default): "Given a book with a due date and no birth date, Then every title and body in either rendering names no pregnancy, due date, 'before birth', 'bump' or 'arrival'; the before-birth variants exist only in the unlocked in-app preview, and the lock-screen rendering is the neutral evening line". Test: lint both renderings of every `before birth: yes` variant for those words.

**F18. NS-48 age bands on the lock screen. P2.**
- The age-band subject ("a toddler question") reveals a stage of a child to a passer-by even with names off. It is derived from the birthday (L4). Month and birthday notes already do something similar. Ask `content` to keep band words out of the title (N-4 already keeps the kind out of the title) and mark each band variant's lock-screen rendering for the device walk NTC-T24.

### 2.4 NS-49 Picture-first and Journaling Suggestions

**F19. "Only the chosen picture reaches the app" is not true. P1.**
- Wrong: O2 says the system shares "the details of the chosen suggestion" and hands the completion handler the suggestion with all its `items` (workout route and heart rate, contact name and photo, location coordinates, state of mind, steps) and its `title`. The app then ignores every item except a photo. The accurate claim is "the app uses only one picture from the suggestion you pick and discards the rest", not "only the picture reaches the app". The card repeats the false form in R16 (the policy wording, line 776), R27 (label line, line 787), section 12 Shown (line 832), section 18 and section 19, and the FR-PHS-54, 55 rows.
- Why it matters: the mission is that the code proves every privacy statement. This sentence is checkable and wrong. It also affects the Notes for Review ("returns only the picture the parent chooses"). On the label: O1 says on-device processing is not "collected", so the label answer very likely stays "no change", but the reasoning must be "received in memory only, one photo kept, nothing sent", not "only a picture arrives".
- Change, R16, R27, section 12, 18, 19: replace with "The phone makes the list. When you pick one, the phone hands the app that one suggestion; the app keeps one picture from it and nothing else, and nothing leaves your phone." Keep R10's scan (no other type read) as the test for "keeps nothing else". Add to R10: "the suggestion object is not stored, copied, logged or passed to any function other than the photo and label reader, and is released when the picker returns".

**F20. NS-49-R9: the phone's title enters `photo_text` by default and syncs. P1.**
- Wrong: R9 shows Apple's `title` and `date` as an editable label and says they are "stored only if the parent keeps the letter, held in the existing editable fields (`photo_text` ...)". Read plainly, a parent who keeps the letter without touching the label stores the phone's machine-generated text (O2 shows `suggestion.title`; titles can name a place or an event) in a field that syncs to the server and the co-parent (NS-01: `photo_text` is L4, synced). Two problems: it is data the parent did not write (constitution: the machine may not add meaning to a person's words; `photo_text` is a parent-words field), and the parent may not realise a place name or a person is in it. NS-49 section 12 Never says "writing a caption ... from a suggestion", which the default store does.
- Change, R9: "the label is never written to `photo_text` or the letter date unless the parent taps 'Use this' on it; kept letters from a parent who did not tap store neither". The date chip stays parent-confirmed (NS-01 OQ-1). Test: keep without tapping, assert `photo_text` is empty and the date unchanged; keep after tapping, assert the stored text equals the edited text.

**F21. NS-49-R7: "the Apple-provided copy is deleted once read". P1.**
- Wrong: A4 (photos function file) says `Photo.photo` is "a URL to an image on disk" in a location Apple chooses; the card does not know whether the app may delete it, or whether it is in our container. The row's test depends on it.
- Change, R7: "the app's own temporary copy is deleted once read and swept at launch; for the Apple-provided file the spike records its location and whether it is in the app's container, and the data inventory row says what we can and cannot delete". Spike step 1 (already named in the card's risk checks) gains this question. If the app cannot delete it, the inventory and Erase scan must say who does.

**F22. Health-sourced items and Apple's rules. P2 (UNVERIFIED).**
- The suggestion can carry Health-derived items (state of mind, workouts, steps; O2). Whether receiving them in memory, unread, engages App Review 5.1.3 or the Developer Program License Agreement's sensitive-data terms is not something I read. Add both to R27's counsel list ("counsel reads 5.1.3 and the DPLA section before the flag turns on"). The card names the DPLA already; add 5.1.3 (Apple's health data guideline). Needs a number from legal.

**F23. NS-49-R20/R21: the suggestion id in a universal link. P2.**
- The id sits in a link on our brand domain. If the link is opened where the app is not the handler (Safari, an uninstalled app), the request reaches our web host and its logs. Add: "the web host answers that path with a static page and does not log the path or query; test on the deployed site". Owner `web`, `privacy`. The card's R21 covers only the app.

**F24. NS-49-R13 test wording. P2.**
- "a level 1 and a level 2 picture of the same input differ in no byte but pixels" cannot hold (the same input has the same pixels). Restate: "the stored copy, its row and its export entry are produced by the same pipeline from the same input and carry no suggestion-derived metadata (no Exif, XMP, title, id or coordinates)". Same intent, testable.

### 2.5 NS-50 Home today

**F25. NS-50 is otherwise clean; one change (F7). P2 note.**
- The slip reads the days store and shows the name only on the day, so it adds no new data. The unlocked-Home exposure is the same one NS-47 section 17 already names. No privacy change beyond F7.

### 2.6 Deletion, export, label and claims (cross-card)

**F26. Label evidence row. P2.**
- `app-store-privacy-labels.md` section 3.2 does not record the on-device religion or origin reasoning. Add one row so the next reviewer does not re-litigate: "Religious or ethnic data (days list): processed on device only, not collected (O1); re-checked each build against NS-47-R4, R6, R11". Owner `privacy` (my file; I add it with the NS-47 build, not now). Also record that the Sensitive Info row stays Yes only for the due date.

**F27. Delete-account sentence. P2.**
- NS-47-R17's line "We keep nothing about the days you chose; it was only ever on your phones" is true for our servers. Keep "it was only ever on your phones" only while R4 and R6 hold. It already sits under R22's claims-row test. No change; noted so `content` does not soften it to "never stored".

## 3. Good enough to leave alone

- NS-46-R2 (nothing pre-ticked, build fails on `preTicked: true`) and NS-47-R20 (no "Eastern", no locale prefill, no cross-suggestion): the right defaults.
- NS-47-R1, R2, R3 (whole store L4, picks are an in-memory filter, nothing on the child): matches CB-1 and the collect-less rule; leaves a smaller store than the founder asked for, and I agree with it.
- NS-47-R4 and R5 (network fake, migration lint, generic prompt, synced-row comparison to a control): this is "the code proves it". Keep.
- NS-47-R9, R10 (analytics allowlist, export leak test): correct; `ExportPhoneConsent` in `schema.ts` carries only two consent fields today, so the leak risk is a future key, which the test covers.
- NS-47-R16, R21 (Erase scan, untick and Clear all): deletion is as easy as choosing.
- NS-47-R19 and CB-6 (ask once, later sitting, "Not now" final, Me stays): no pressure and no first-run field.
- NS-48-R2, R9, R11, R16, R21 (volume unchanged, neutral lock screen honoured, no child name by default, never time-sensitive, quiet book adds nothing): all privacy-positive.
- NS-49-R6, R25, R26 (no permission, no PhotoKit, level 3 closed behind an ADR and a flag that ships off): the right call; a children's-photo library read would change the label and the trust story.
- NS-49-R10 (scan fails the build if any other `JournalingSuggestion` type is referenced): keep; F19 only adds the object-lifetime clause.
- NS-49-R12, R19 (locked return discarded; the file validated, symlinks refused): good.
- NS-50-R2, R8, R11 (only today, quiet book shows none, no feed): good.
- Founder items Q-FD-5 and CUL-Q2 to Q4 defaults (phone only, only ticks, clear at sign-out, exclude from backup): I agree with each.

## 4. Verdicts

| Card | Verdict | Required changes before build |
|---|---|---|
| NS-46 Days we mark | CHANGES | F3 (payload allowlist, landing token), F6 (public title scope), F9 (one library file, no per-tradition fetch), F12 (honour `celebrations_paused`), F10 and F15 (P2) |
| NS-47 Cultural background | CHANGES | F1 (restored-phone rule), F2 (backup exclusion fails closed), F3, F4 (delivered notes, forced session end), F5 (no day name beside a child name), F7, F13 (trace ids); F8, F10, F11 (P2) |
| NS-48 Notification catalogue | CHANGES | F16 (kind "small" and "first" only behind names), F17 (new R28, pregnancy words off the lock screen); F18 (P2) |
| NS-49 Picture-first and suggestions | CHANGES | F19 (the false "only the picture reaches the app" claim, in six places), F20 (title not stored by default), F21 (the Apple file's deletion); F22, F23, F24 (P2). The flag stays off in production until counsel and the entitlement gates pass, so none of this blocks level 1 |
| NS-50 Home today | CHANGES (one row) | F7 (snapshot blank with or without App lock). Otherwise PASS |

No card is BLOCK. No P0 finding: every gap is in intent text that is not yet public or built, which is why F19 is P1: it must be fixed before the sentence reaches the policy, the label notes or the Notes for Review.

## 5. Questions for the founder (each default holds until answered)

1. Should the commemorative and civic-remembrance days (Memorial Day, Veterans Day, Juneteenth, MLK Day) be allowed to name themselves on a lock screen? Default: no, neutral title; only seasons and shared days (New Year, Thanksgiving, 4 July, Labor Day) may. (F6; N-3 is ambiguous, Karma may already read it the other way.)
2. May a lock-screen line follow a last letter that was "small" or "a first"? Default: no unless names are on and App lock is off. (F16)
3. When a session ends without the parent signing out, should the days list be cleared? Default: yes, with one calm line the next time Me, Days opens. (F4)
4. Should the phone's suggestion title ever be saved without the parent tapping it? Default: no. (F20)
5. On a restored phone, the list is empty and the ask does not come back; Me, Days is one tap away. Acceptable? Default: yes. (F1)
6. Should `celebrations_paused` (an existing quiet-season setting) silence library-day notes? Default: yes. (F12)

## 6. Hand-offs

- `legal` and counsel: the claim wording in F19 (policy sentence, Notes for Review); 5.1.3 and the DPLA section (F22, needs a number from legal); the F6 reading of civic and commemorative titles.
- `data-architect`: nothing in the schema; the migration lint stays as NS-47-R4 writes it.
- `mobile`: F2, F3, F4, F21 (read-back of the backup flag, payload allowlist, delivered-note dismissal, the Apple file spike).
- `content`: F8, F16, F17, F18 wording.
- `support`: F10.
- `web`: F23.
- Karma: F13 (regenerate the trace), F6 and conflict 2.

Memory: I have nothing new to add to the user's memory from this task.

Privacy Engineer (Claude role, not counsel)
