# End-to-end design: master index (screens, states, transitions, motion), areas A to E

Status: built 20 Nov 2026 by the area E design lead from the final state of the five area folders (read last, after areas A to D finished their re-keys, files as on disk at the time of the run). ASCII only. This file lists; it never defines. Where it and an area file differ, the area file wins and the difference is in section 6.

How to read: screen ids `<area>-Snn` and state ids `<area>-Snn.<state>` are from each area `DESIGN.md` (inventory row and every `.state` the file names); motion ids are each area's own scheme (A `MA-nn`, B `B-Mnn`, C `M-Cnn`, D `D-Mnn`, E `E-Mnn`); transitions `T-*` and primitives `m.*` are the system names of `docs/design/system/MOTION.md`. "Card row" is the NS ids named in the screen's inventory row. Round 2 ids (NS-51, NS-52) are PROPOSED and flagged where they appear.

## 1. Counts

| Area | Screen ids | State ids | Motion ids | T-* transitions used |
|---|---|---|---|---|
| A A-capture | 18 | 135 | 65 | T-ALERT, T-COVER, T-LAUNCH, T-LOCK, T-MENU, T-RESUME, T-SHEET, T-SLIP, T-SYSLINE |
| B B-book-and-reading | 24 | 98 | 71 | T-ALERT, T-COVER, T-KEEP, T-MENU, T-MIN, T-PAGE, T-RESUME, T-SHEET, T-TAB, T-ZOOM |
| C C-keeping-and-trust | 26 | 117 | 72 | T-ALERT, T-PUSH, T-RESUME, T-STEP, T-TAB |
| D D-family-sharing-reminders | 24 | 57 | 84 | T-ALERT, T-LAUNCH, T-PUSH, T-RESUME, T-SHEET, T-TAB |
| E E-foundations-and-system-states | 32 | 92 | 96 | T-COVER, T-GATE, T-KEEP, T-LAUNCH, T-LOCK, T-MIN, T-PUSH, T-RESUME, T-SHEET, T-STEP, T-SYSLINE, T-TAB |
| E catalogue | 82 system state ids `E-ST..` (section 3) | | | |

## 2. Screens and states, by area

### A. A-capture

| Screen id | Screen | Card row | States named in the area file |
|---|---|---|---|
| A-S01 | Home (Say): whose-book switcher, dateline, greeting, the one slip slot (above the prompt block), prompt, Anoth | NS-01, NS-13, NS-14, NS-18, NS-19, NS-35, NS-44, NS-47-R19 | dayDismissed, dayToday, dayTodayQuiet, dayTodayTwo, daysAsk, daysAskBelow, daysAskGone, default, fromReminder, heldMany, namelessTwo, photoMenu, photoOff, plusLine, quietKept, snapshot, twoBooks, twoBooksNameless, typedDay, waiting, waitingCard, waitingMany |
| A-S02 | Whose book sheet (one `Sheet`, radio list, current month under each name) | NS-14 | default, open |
| A-S03 | Apple's photo picker and Apple's recent-days picker, and our states around them (iCloud download, cancel, fail | NS-01, NS-49-R5 | appLockDrop, downloading, iCloudProgress, open, suggestions |
| A-S04 | Listen at Ready: from a link or doorway (red circle), with a picture (Speak and Type), with "From your phone"  | NS-01, NS-04, NS-06, NS-35, NS-39-R10, NS-49-R9 | busy, default, denied, doorway, fromDoorway, full, iCloudOffline, lowSpace, mediaTray, micDenied, openFailed, photo, photoCouldNotOpen, photoFailed, photoOffline, primer, ready, readyPhoto, suggestionLabel, suggestionNoPhoto, withPicture |
| A-S05 | Listen while recording: listening, still here, paused, finishing | NS-04, NS-06-C9, NS-09 | finishing, interrupted, lowSpace, quietTake, recording, saved |
| A-S06 | Write (Type) | NS-01, NS-35 | default, forTake, photo, withPhoto |
| A-S07 | Review: the letter sheet with To, the day and From; words states; picture; another language; Keep; Let it go | NS-01, NS-09, NS-14, NS-15, NS-16, NS-17, NS-19, NS-20 | anotherLanguageOffer, ask, dateNotSaved, dateSet, dateline, default, fileMissing, from, fromOff, fromSet, fromTooLong, interrupted, keepDisabled, language, mediaCard, mediaLimit, missingFile, noDraft, noSpeech, noWords, otherLanguage, partUnwritten, photo, photoNeedsWords, photoNotStored, photoUndo, putBack, saveFailed, stoppedBy, stoppedEarly, transcribing, twoBooks, typed, videoTooLong, voiceOnly, waitingLong, withPhoto, withPicture, wordsWaiting, writing |
| A-S08 | Day sheet ("When was this?", A day or A month) | NS-15 | day, default |
| A-S09 | From sheet (who is speaking: one field, names used on this phone, the instruction line) | NS-16 | default, empty, recent, recentNames, tooLong |
| A-S10 | Another language: the mark on Review, the words-set-aside state, Type the words yourself | NS-17 | confirm, undo, waiting, withheld, withheldUndo, writeWords |
| A-S11 | Let it go confirmation (from Review and Listen) and the not-removed-yet line | NS-09 | confirm, confirmListen, confirmPhoto, notRemoved |
| A-S12 | Use this picture instead? (replace confirm), and the Undo line after replace or take off | NS-01 | changedUndo, closed, confirm, replaceAsk, undo, undoClosed |
| A-S13 | After Keep: the saved moment, the held letter, and the hand-offs (Keep gate E-S10, reminder ask D-S04) | NS-01 | held, kept, keptVoiceOnly, saved, voiceOnly |
| A-S14 | Doorways outside the app: widget, Control Center control, Action Button, Siri phrase; unlock; App lock | NS-04, NS-06, NS-35 | beforeFirstRun, firstRun, unlock, widget |
| A-S15 | Hands-free states (hypotheses only; NS-04 findings decide) | NS-04 | hypotheses, map |
| A-S16 | One photo from a suggestion: a sheet that holds each photo of the suggestion the parent picked, so the parent  | NS-49, NS-49-R8 | default |
| A-S17 | Moments sheet: the parent's own pictures, grouped by day, as a way to start a letter | see file | limited |
| A-S18 | Photos access: the ask, and every access state | NS-39-R2, NS-47-R33 | default |

### B. B-book-and-reading

| Screen id | Screen | Card row | States named in the area file |
|---|---|---|---|
| B-S01 | The Book (tab) with the calm header bar (cover band and inline bar) | NS-01, NS-02, NS-06, NS-22, NS-37 | arrived, dayToday, default, findOff, firstView, hiddenBook, hiddenReadOnly, lensFirsts, lensPhotos, photosOff, ratingMoment, sealedCard, twoBooks, undoDelete, undoDeleted |
| B-S02 | "More for this book" end menu (system menu; fit-to-contents sheet only where the menu cannot carry it, B G-03) | NS-22-R3 | ax, ax3, default, failed, printOn, quieted |
| B-S03 | Lens choice: Months, Photos, Firsts, one radio group | NS-01-R10, NS-06-A3, NS-33-R3 | absent, default |
| B-S04 | Photos lens list | NS-01-R11, NS-37 | ax5, default, thumbMissing, thumbPending |
| B-S05 | Firsts lens list | NS-06-A3 | default, rtlLabel |
| B-S06 | Find mode over the Book | NS-02 | failed, failedGettingReady, idle, noMatch, results, rtlRow, short |
| B-S07 | Go to a month sheet, with year rows | NS-22, NS-24 | default, withYears |
| B-S08 | The letter page with the "This letter" list | NS-21, NS-33-R1 | default, fromNameChange, fromNameFixed, notFound, otherParent, ownNoPicture, ownPrivate, ownSpoken, ownTwoAdults, ownTyped, photoMissing, photoNotStored, readItBack, recordingElsewhere, sealedAuthor, waiting, withMedia, withPicture, wordsUnreviewed |
| B-S09 | Day sheet from the letter page (the same `DateSheet` as A-S08) | NS-15, NS-21 | default, failed |
| B-S10 | Who can read it sheet | NS-21 | default, failed |
| B-S11 | Picture on the letter page: add, replace confirm, take off with Undo, words and place sheet, failure lines | NS-01 | actions, iCloudDownloading, iCloudOffline, pickFailed, replaceConfirm, undo, viewer, words |
| B-S12 | Mark a first: the toggle row, label sheet, Undo | NS-06 | atLimit, failed, labelSheet, off, undo |
| B-S13 | Hide until a day: date sheet with the honest limits | NS-06 | default |
| B-S14 | Open now confirmation | NS-06-B3 | confirm |
| B-S15 | Delete confirmation and the Book's "Letter deleted." Undo | NS-06-B25, NS-21-R7 | confirm, confirmSealed, undo |
| B-S16 | A hidden (sealed) letter in the Book: the `sealed` card | NS-06-B2 | default |
| B-S17 | One past letter on Home (slip rank 4, the last) | NS-23, NS-50-R5 | absent, default, dismissed, present, switchOff |
| B-S18 | Seal-opened line on Home (slip rank 2) | NS-06-B4, NS-50-R5 | default, present |
| B-S19 | Read together (whole book or one year) | NS-24 | dark, default, interrupted, newPhone, recordingElsewhere, skippedFailedPage, turning, year |
| B-S20 | Read together: end of the year, end of the book | NS-24 | end, endOfBook, endOfYear, month |
| B-S21 | Me row "Past letters on Home" (switch) | NS-23-R4 | default |
| B-S22 | Recently deleted: a sealed letter's row with no words | NS-06-B25 | default |
| B-S23 | Read-along (NS-29): decision record only, not drawn | NS-29 | default |
| B-S24 | Days and the Book: a decision record, no screen (a day is never shown in the Book; section 12) | NS-46-R22, NS-47-R5, NS-50-R4 | default |

### C. C-keeping-and-trust

| Screen id | Screen | Card row | States named in the area file |
|---|---|---|---|
| C-S01 | Me (Look after), the tab root; `.default` = groups as built plus the Days row under Reminders (the fallback be | NS-11-R1, NS-22-R3, NS-45-R3, NS-46-R3 | default, deletedElsewhere, killswitch, local, second-account, sessionEnded, signedout, updateRequired |
| C-S02 | Account (sign-in method, sign out, sign out of other phones) | NS-08-R6, NS-09-R12 | default, signedout, suspended, waiting |
| C-S03 | Sign-out sheet (the D1 sheet) | NS-01-R30, NS-08-R6 | default, waiting |
| C-S04 | Save a copy (the one export screen) | NS-07, NS-10-R4, NS-11, NS-36-R2 | cancelled, default, empty, error-lowSpace, error-other, error-tooBig, lowPower, newPhone, nothingHere, ready, running, saved, shared, stopped, stopped-by-close |
| C-S05 | Making the printable book (PDF) | NS-07 | error, error-print_pdf_disk_full, error-print_pdf_failed, lowPower, making, ready, running |
| C-S06 | Home slip: Save a copy in the birthday week | NS-11-R2 | default, twins |
| C-S07 | Which book (chooser sheet) | NS-11-R14 | default |
| C-S08 | Where your letters live | NS-08-R7, NS-10 | default |
| C-S09 | Letter page: where the recording is (provenance line) | NS-08, NS-10-R1 | arriving, backedUp, notHere, onPhone, otherParent |
| C-S10 | Opening your book (new phone, returning account) | NS-10-R0 | deletedElsewhere, held, killswitch, loading, noBook, offline, opening, wrongAccount |
| C-S11 | Returning consent sheet and the "not agreed" screen | NS-10-R0 | declined, default |
| C-S12 | Book-level new phone line | NS-10-R13 | arriving, default, dismissed |
| C-S13 | Earlier versions (list) | NS-12-R1 | default, error, error-fetch_failed, loading, offline, offlineNone |
| C-S14 | An earlier version (read-only, Restore, Remove) | NS-12-R2 | confirmRemove, default |
| C-S15 | A book in Me (details, Quiet this book, Hide this book, Delete this book) | NS-22-R3 | default, error |
| C-S16 | Hidden books | NS-22 | default |
| C-S17 | Recently deleted | NS-06-B25, NS-21-R7, NS-36-R1 | default, error-eraseKept, error-erase_failed |
| C-S18 | Storage (languages, space, and one state line when a recording is still being removed; never a list, never a c | NS-09-R6, NS-11-R20 | retrying, stuck, stuckAgain |
| C-S19 | Erase everything on this phone | NS-01-R52, NS-36 | confirm, default, erasing, error-failed, ownerCheck, ownerCheckCancelled, signedin, signedoutSynced |
| C-S20 | Delete account | NS-01-R31, NS-08-R16, NS-10-R4 | cancelled, confirm, default, error-failed, error-offline, executing, loading, notConfigured, scheduled, sending, signedout, what, whatHappens |
| C-S21 | Recording backup (flip-only states; absent today) | NS-08 | absent, consent, on |
| C-S22 | Delete this book | NS-36 | confirm, exportFirst |
| C-S23 | Privacy (Me, Privacy) and its sheet `.withdraw` ("Stop syncing letters") | see file | consentOff, consentOn, consentWaiting, withdraw |
| C-S24 | Days (one page: Days you added, Days you chose, Browse days, the day-name switch, Clear all) | NS-18, NS-46-R3, NS-47-R14 | dayNames-appLock, dayNames-released, default, empty, killswitch, notificationsDenied, sessionCleared, store-unavailable |
| C-S25 | Browse days (sheet, with the optional tradition and country pickers and the DoorNote) | NS-46-R20, NS-47-R2 | default, fallbackNoQuestion, traditionPicked, whichDate |
| C-S26 | Day detail (pushed from C-S24 only: date, Move this date, Remove) | NS-46-R14, NS-47-R21 | authorities, default |

### D. D-family-sharing-reminders

| Screen id | Screen | Card row | States named in the area file |
|---|---|---|---|
| D-S01 | Letter page: the Share control | NS-05 | absent |
| D-S02 | Share preview sheet | NS-05 | ax5, error-share_temp_write_failed, pictureOn, rtl, switcher |
| D-S03 | iOS share sheet | NS-05 | default |
| D-S04 | Reminder ask (sheet over the Book) | NS-13 | picking |
| D-S05 | iOS notification permission alert | NS-13 | default |
| D-S06 | Me, Reminders | NS-13, NS-32, NS-46, NS-48, NS-49 | ax5, backedOff, daysRemindersOff, denied, error-schedule_failed, journalNote, lateClamp, preview, typedDays-list |
| D-S07 | Time picker (system compact, 07:00 to 21:30, 15-minute steps) | NS-13 | default |
| D-S08 | Add a day sheet (also opened from C-S24) | NS-18, NS-46-R3, NS-47-R37 | default |
| D-S09 | A typed day: detail and Delete | NS-18 | confirm |
| D-S10 | Lock screen and Notification Centre | NS-13, NS-18, NS-32, NS-46, NS-47, NS-48 | evening, hidden, libraryDay-named, libraryDay-neutral, libraryDay-quiet, oneDay, twoDays, typedDay |
| D-S11 | Notification landing | NS-13, NS-18, NS-35, NS-46-R32, NS-50 | evening, home, plan, typedDay, whileCapturing |
| D-S12 | Me, the book's page: "Write this book together" | NS-25 | default |
| D-S13 | Invite sheet | NS-25 | full, offline, paused, sent, working |
| D-S14 | Invite link page (web) | NS-25 | expired, other-device |
| D-S15 | Join ask: peek (top of the one join sheet) | NS-25 | error-expired, error-revoked, error-signed_out, loading, offline, paused |
| D-S16 | Accept: the agreement (bottom of the same sheet) | NS-25 | error-already_member, error-book_full, error-consent_needed, error-join_failed, joining, needs-sync, offline, paused |
| D-S17 | Joined: arrival | NS-25 | arriving, joined, twobooks |
| D-S18 | Family page | NS-25 | undo-open |
| D-S19 | Undo join confirm | NS-25 | done, error-SCPAR |
| D-S20 | The other parent's phone after an undo | NS-25 | default |
| D-S21 | Home: Not much today | NS-07 | default |
| D-S22 | Book: the quiet-day row | NS-07 | default |
| D-S23 | Pilot artefacts (messages) | NS-03 | default |
| D-S24 | Me, Plan: plan date when notifications are not allowed | NS-32-R4 | default |

### E. E-foundations-and-system-states

| Screen id | Screen | Card row | States named in the area file |
|---|---|---|---|
| E-S01 | Launch and boot | see file | default, error-launch, loading-export, recovery, recovery-exporting |
| E-S02 | Welcome (account-first when servers on) | NS-39, NS-41, NS-42 | default, error-provider, lastMethod, loading, notice, restoring, serversOff |
| E-S03 | Age gate and stop | NS-40, NS-40-R5, NS-42 | default, platformMinor, reason-noAnswer, reason-noTick, region, stop |
| E-S04 | Sign-in sheet after first run (Me, claim path) | NS-40-R9, NS-41 | refused-region |
| E-S05 | Sign in: email | see file | default, error-invalid_email, reason-empty |
| E-S06 | Sign in: code and verify (field draws 6 to 10 digits, `code.digits` with `{n}`) | NS-41-R8 | default, error-code, error-expired, error-rate_limited, error-wrong_code, help, paused, reason-short, refused, refused-, refused-already_signed_in, refused-other_phone, verifying |
| E-S07 | Agreements and consent at sign-in | NS-42-R10 | claim, declined, default, error-consent_unavailable, loading, offline, reconsent, sensitive |
| E-S08 | First book steps | NS-43, NS-43-R1 | dateFuture, dateWaiting, dueRange, languages, open, signsAsWaiting |
| E-S09 | First-run router (alias of C-S10, C-S11) | see file | default |
| E-S10 | Keep gate sheet | see file | default, error-codeFailed, fromLetter, hold, lapsed, needsNewerIos, offline, opening, unavailable |
| E-S11 | Plan in Me | see file | ended, grace, notificationsOff, retry |
| E-S12 | Plus confirmed | see file | default, withAsk |
| E-S13 | Something broke | see file | boundary, global, noBook, secondFault |
| E-S14 | Sign-in outage and offline (first run) | NS-39-R5, NS-41-R12 | killswitch, offline, outage, signInPaused |
| E-S15 | SystemLine in place (new component) | see file | default |
| E-S16 | App update line in Me | NS-45-R13, NS-45-R14 | default, line |
| E-S17 | Low-storage rules (rendered by A-S04, A-S05, C-S04, C-S18) | see file | low-1gb, under1gb, under50mb |
| E-S18 | Second account on one phone | NS-41-R6 | second-account |
| E-S19 | Interruption and recovery | see file | default |
| E-S20 | Not found | see file | default, noBook |
| E-S21 | Appearance | see file | default |
| E-S22 | App lock cover | see file | default, failed, locked |
| E-S23 | Accessibility walk and speed sheet | see file | default |
| E-S24 | Claim screen | NS-41-R5 | accountDeleted, default, hasBook, methodOnly |
| E-S25 | Plan reminder note in the app | see file | default |
| E-S26 | Home Plus line (a rule drawn on A-S01) | see file | on |
| E-S27 | App Store page and install (Apple's; ours only as claims) | see file | default, installed, installing |
| E-S28 | Permission asks map (when each system permission is asked) | see file | default |
| E-S29 | Microphone prompt (iOS), after area A's primer at the first Speak | see file | prompt |
| E-S30 | If you are struggling (new; support SUP-17, SUP-18; id assigned here because support's proposed E-S27 and E-S2 | see file | default |
| E-S31 | Lines in other countries (new; SUP-17) | see file | default |
| E-S32 | Photos access primer (proposed; screen drawn with area A's moments surface) | see file | default |

## 3. System state catalogue (area E, `E-STnn`, rendered by every area)

| Id | State |
|---|---|
| E-ST01 | Offline |
| E-ST02 | Service outage, signed in |
| E-ST03 | Sign-in outage, first run |
| E-ST04 | Servers-off build (`serverFeaturesEnabled()` false) |
| E-ST05 | `sync` |
| E-ST06 | `invites` |
| E-ST07 | `photos` |
| E-ST08 | `packDownloads` |
| E-ST09 | `serverContent` |
| E-ST10 | `backupUploads` |
| E-ST11 | `escrow` |
| E-ST12 | `statusReport` |
| E-ST13a | `bookSearch` |
| E-ST13b | `reminders` |
| E-ST13c | `shareLetter`, `firsts`, `seals`, `printBook`, `quickCapture`, `earlierVersions`, `signAsOther` |
| E-ST14 | `flags.familyTeaser` (`coming_soon` default) |
| E-ST15 | `flags.introVariant` |
| E-ST16 | `flags.lockScreenNamesDefault` |
| E-ST17 | `forceReauthEpoch` raised |
| E-ST18 | `minSupportedVersion` above this build |
| E-ST19 | `freeLettersAllowance` |
| E-ST20 | Free, allowance not used |
| E-ST21 | Second free letter kept |
| E-ST22 | Allowance used, Plus off |
| E-ST23 | Plus on, trial, renews, ends, shared |
| E-ST24 | Plan lapsed |
| E-ST25 | Grace, billing retry |
| E-ST26 | Plus status unknown |
| E-ST27 | Alpha build |
| E-ST28 | Signed out with a book |
| E-ST29 | Second account on the phone |
| E-ST30 | Consent outstanding |
| E-ST31 | Consent declined |
| E-ST32 | Under 1 GB free |
| E-ST33 | Under 50 MB free |
| E-ST34 | Under 20 MB mid-take |
| E-ST35 | Low Power Mode |
| E-ST36 | Thermal serious / critical |
| E-ST37 | First launch after an update |
| E-ST38 | Interrupted (call, Siri, alarm, the baby) |
| E-ST39 | Killed and relaunched |
| E-ST40 | Screen threw / fatal |
| E-ST41 | Database did not open |
| E-ST42 | Link not found |
| E-ST43 | Notifications not allowed |
| E-ST44 | Microphone not allowed / in use |
| E-ST45 | App lock |
| E-ST46 | iPad (App Review runs the iPhone app) |
| E-ST47 | Server restored |
| E-ST48 | Sign-in paused (`killSwitches.signIn`, PROPOSED) |
| E-ST49 | Library of days paused (`killSwitches.libraryDays`, PROPOSED, one boolean, fail-open) |
| E-ST50 | Days store unreadable (`days_store_unavailable`, local) |
| E-ST51 | Suspended account |
| E-ST52 | Quiet day today (Memorial Day, Veterans Day, Good Friday, Yom Kippur) |
| E-ST53 | Day slip hidden by a higher slip |
| E-ST54 | Quiet or hidden book |
| E-ST55 | Suggestions picker unavailable |
| E-ST56 | Suggestions cancelled, declined, empty or off |
| E-ST57 | Notifications not allowed and a day ticked |
| E-ST58 | Day-name switch while App lock is on |
| E-ST59 | Days store cleared |
| E-ST60 | Reminders off, a day ticked |
| E-ST61 | Second account and the days store |
| E-ST62 | Re-consent required |
| E-ST63 | Sign-up refused for the region |
| E-ST64 | Platform says a minor |
| E-ST65 | Account deleted elsewhere |
| E-ST66 | `upgrade_required` or `gone` from the server |
| E-ST67 | Email to the account bounces |
| E-ST68 | Speech download not possible |
| E-ST69 | Photos access limited (iOS "Limited") |
| E-ST70 | Photos access denied or restricted (Screen Time, MDM) |
| E-ST71 | Photos access changed while the app is open |
| E-ST72 | iCloud original not downloaded |
| E-ST73 | No space for media |
| E-ST74 | Large video |
| E-ST75 | Too many items on one letter |
| E-ST76 | Video audio |
| E-ST77 | Media waiting to upload |
| E-ST78 | Moments index off or removed |
| E-ST79 | Media kill switch |
| E-ST80 | Moments nudge on a lock screen |
| E-ST69 to E-ST80 | Round 2 media states (PROPOSED): Photos limited, denied, changed, iCloud original, no space, large video, too many items, video audio, media waiting, moments off, media pause, moments nudge (DESIGN section 15a.2). Key to NS-51 and NS-52 row ids when `27-photo-moments-and-media.md` lands |
| E-S32 | Photos access primer (PROPOSED, round 2) |

## 4. Transitions (T-*) and the motion ids that use them

| Transition | Areas and motion ids |
|---|---|
| T-ALERT | A: MA-41; B: B-M11, B-M30, B-M33, B-M34, B-M70; C: M-C38, M-C40, M-C43; D: D-M73, D-M75, D-M85 |
| T-COVER | A: MA-12, MA-13, MA-14p, MA-23; B: B-M16, B-M43, B-M47, B-M49, B-M63; E: E-M34, E-M36 |
| T-GATE | E: E-M30 |
| T-KEEP | B: B-M06; E: E-M33 |
| T-LAUNCH | A: MA-01, MA-13; D: D-M76, D-M84; E: E-M01, E-M02, E-M03, E-M72 |
| T-LOCK | A: MA-56; E: E-M70, E-M73 |
| T-MENU | A: MA-51, MA-60; B: B-M09, B-M54 |
| T-MIN | B: B-M03; E: E-M80 |
| T-PAGE | B: B-M44, B-M46 |
| T-PUSH | C: M-C02; D: D-M68; E: E-M107, E-M108, E-M120, E-M19, E-M27, E-M37 |
| T-RESUME | A: MA-02; B: B-M02, B-M47; C: M-C01, M-C19; D: D-M82; E: E-M29, E-M71 |
| T-SHEET | A: MA-06, MA-37, MA-38, MA-50, MA-53, MA-61, MA-62; B: B-M09, B-M15, B-M16, B-M27, B-M29, B-M31, B-M52, B-M54; D: D-M72, D-M85; E: E-M104, E-M120, E-M16, E-M33, E-M38c, E-M90 |
| T-SLIP | A: MA-48, MA-49, MA-50 |
| T-STEP | C: M-C56; E: E-M09, E-M09a, E-M10, E-M100, E-M104, E-M13, E-M25 |
| T-SYSLINE | A: MA-09; E: E-M106, E-M107, E-M112, E-M40, E-M42 |
| T-TAB | B: B-M02, B-M23; C: M-C01; D: D-M76, D-M84; E: E-M15, E-M80 |
| T-ZOOM | B: B-M20, B-M24, B-M25, B-M32, B-M34, B-M38 |

## 5. Motion ids, by area

### A. A-capture

| Motion id | States keyed | T-* | m.* |
|---|---|---|---|
| MA-01 | A-S01.default, A-S01.typedDay, A-S01.waiting, E-S19 | T-LAUNCH | m.enter.group |
| MA-02 | A-S01 | T-RESUME | - |
| MA-03 | A-S01.default | - | m.move, m.swap |
| MA-04 | A-S01.default, A-S01.quietKept | - | m.swap |
| MA-05 | A-S01.default, A-S01.quietKept | - | m.swap |
| MA-06 | A-S01.twoBooks, A-S02.default | T-SHEET | m.sheet |
| MA-07 | A-S01.twoBooks, A-S02.default | - | m.fade, m.select, m.sheet, m.swap |
| MA-08 | A-S01 | - | m.exit, m.list.remove, m.move |
| MA-09 | A-S01, E-S15, E-S17 | T-SYSLINE | m.enter, m.exit, m.move |
| MA-10 | A-S01, A-S03.open | - | m.tap.glass |
| MA-11 | A-S01, A-S03.open | - | - |
| MA-12a | A-S03.downloading | - | m.progress |
| MA-12 | A-S01, A-S05.recording | T-COVER | m.cover, m.fade, m.tap.glass |
| MA-13 | A-S04.doorway, A-S14 | T-COVER, T-LAUNCH | m.instant |
| MA-14p | A-S03, A-S04.readyPhoto | T-COVER | m.fade |
| MA-14c | A-S04.readyPhoto | - | m.fade |
| MA-14f | A-S04.iCloudOffline, A-S04.photoCouldNotOpen | - | m.move, m.swap |
| MA-16 | A-S04.primer, A-S04.ready | - | m.fade |
| MA-16a | A-S04.lowSpace, A-S05.lowSpace | - | m.swap |
| MA-17 | A-S04, A-S05, A-S06 | - | - |
| MA-19 | A-S05.recording | - | m.signal |
| MA-20 | A-S05.recording | - | m.instant |
| MA-21 | A-S05.recording | - | m.instant |
| MA-22 | A-S05.recording | - | m.instant, m.signal |
| MA-23 | A-S05.interrupted, A-S07.interrupted | T-COVER | m.instant |
| MA-26 | A-S01, A-S06.default | - | - |
| MA-27 | A-S06.default | - | m.exit, m.move, m.swap |
| MA-28 | A-S06 | - | m.swap |
| MA-29 | A-S06, A-S13 | - | m.keep |
| MA-30 | A-S07.writing | - | m.swap |
| MA-31w | A-S07.default, A-S07.writing | - | m.fade, m.move |
| MA-32 | A-S07.default | - | - |
| MA-33 | A-S07.markOpen | - | m.enter, m.move |
| MA-34 | A-S07.putBack | - | m.mark, m.move, m.swap |
| MA-35 | A-S07.default | - | m.select, m.swap |
| MA-36 | A-S07.playing | - | m.instant, m.progress |
| MA-37 | A-S07.dateSet, A-S07.default, A-S08.day | T-SHEET | m.enter, m.move, m.swap |
| MA-38 | A-S07.default, A-S07.fromSet, A-S09.empty, A-S09.recent | T-SHEET | m.select, m.swap |
| MA-39a | A-S07.anotherLanguageOffer, A-S10.withheld, A-S10.withheldUndo | - | m.fade, m.move |
| MA-39b | A-S06.forTake, A-S10.withheld | - | - |
| MA-40p | A-S07.withPhoto | - | m.fade, m.move |
| MA-41 | A-S07.withPhoto, A-S12.confirm | T-ALERT | m.fade |
| MA-42 | A-S07.photoUndo, A-S07.withPhoto | - | m.exit, m.move |
| MA-43 | A-S07.photoNeedsWords | - | - |
| MA-45 | A-S14.widget | - | - |
| MA-46 | A-S14.firstRun, A-S14.unlock, E-S02 | - | - |
| MA-47 | A-S15.map | - | m.instant, m.signal |
| MA-48 | A-S01.dayToday | T-SLIP | m.enter.group, m.list.remove, m.move |
| MA-49 | A-S01.dayTodayQuiet, B-S18 | T-SLIP | - |
| MA-50 | A-S01.daysAsk, C-S25 | T-SHEET, T-SLIP | m.exit, m.move |
| MA-51 | A-S01.default | T-MENU | m.tap.glass |
| MA-52 | A-S03.suggestions | - | - |
| MA-53 | A-S03.suggestions, A-S04.suggestionLabel, A-S16 | T-SHEET | m.cover, m.fade |
| MA-54 | A-S04.readyPhoto | - | m.enter, m.exit, m.move, m.swap |
| MA-55 | A-S04.suggestionNoPhoto | - | m.enter |
| MA-56 | A-S01.snapshot | T-LOCK | m.instant |
| MA-57 | A-S01.default | - | m.instant |
| MA-60 | A-S01.photoMenu | T-MENU | - |
| MA-61 | A-S17.default | T-SHEET | m.fade |
| MA-62 | A-S18.primer | T-SHEET | - |
| MA-63 | A-S04.mediaTray | - | m.enter, m.list.insert, m.move |
| MA-64 | A-S04.mediaTray, A-S07.mediaCard, A-S12 | - | m.exit, m.list.insert, m.list.remove, m.move, m.toast |
| MA-65 | A-S07.mediaCard | - | m.cover |
| MA-66 | A-S04, A-S07.mediaLimit | - | m.enter, m.swap |
| MA-67 | A-S04.mediaTray, A-S17 | - | m.progress |

### B. B-book-and-reading

| Motion id | States keyed | T-* | m.* |
|---|---|---|---|
| B-M01 | B-S01.default | - | m.enter.group |
| B-M02 | B-S01.default | T-RESUME, T-TAB | - |
| B-M03 | B-S01.default | T-MIN | m.glass, m.swap |
| B-M04 | B-S01.many, B-S04.default | - | m.fade |
| B-M05 | B-S04.thumbMissing | - | m.instant |
| B-M06 | B-S01.default | T-KEEP | m.mark |
| B-M07 | B-S01.twoParents | - | m.mark |
| B-M08 | B-S01.twoBooks | - | m.fade |
| B-M09 | B-S02, B-S02.default | T-MENU, T-SHEET | m.sheet.own |
| B-M10 | B-S02.quieted | - | m.enter, m.toast |
| B-M11 | B-S02, C-S15 | T-ALERT | m.fade |
| B-M12 | B-S03.twoOptions, B-S04, B-S05 | - | m.list.swap, m.select |
| B-M13 | B-S03.absent | - | m.instant, m.list.swap |
| B-M14 | B-S04.many, B-S05.many | - | - |
| B-M15 | B-S01, B-S07.default | T-SHEET | m.list.swap |
| B-M16 | B-S07.withYears, B-S19.year | T-COVER, T-SHEET | m.cover, m.fade |
| B-M17 | B-S06.idle | - | m.glass, m.swap |
| B-M18 | B-S06.results | - | m.enter, m.instant |
| B-M19 | B-S06.noMatch | - | m.instant, m.swap |
| B-M20 | B-S06.results, B-S08.ownSpoken | T-ZOOM | m.fade |
| B-M21 | B-S06.results, B-S08 | - | m.fade |
| B-M22 | B-S01, B-S06 | - | m.glass, m.swap |
| B-M23 | B-S06 | T-TAB | - |
| B-M24 | B-S01, B-S05, B-S08.ownSpoken | T-ZOOM | m.enter, m.fade, m.tap, m.zoom |
| B-M25 | B-S04, B-S08.ownSpoken, B-S16, B-S17, B-S18 | T-ZOOM | m.fade |
| B-M26 | B-S08 | - | - |
| B-M27 | B-S09.default, B-S10.default, B-S11.actions, B-S12.labelSheet, B-S13.default | T-SHEET | m.sheet |
| B-M28 | B-S08, B-S09, B-S09.failed, B-S10, B-S10.failed | - | m.move, m.swap, m.toast |
| B-M29 | B-S08, B-S12.labelSheet | T-SHEET | m.move, m.swap, m.toast |
| B-M30 | B-S08.withPicture, B-S11.actions | T-ALERT | m.enter, m.exit, m.fade, m.move, m.swap, m.toast |
| B-M49 | B-S11.viewer | T-COVER | m.cover, m.fade, m.glass |
| B-M31 | B-S08.sealedAuthor, B-S13.default | T-SHEET | m.swap |
| B-M32 | B-S16.default | T-ZOOM | m.instant |
| B-M33 | B-S08, B-S14.confirm | T-ALERT | m.exit, m.list.remove, m.move |
| B-M34 | B-S01.undoDeleted, B-S15.confirm, B-S15.overHome | T-ALERT, T-ZOOM | m.exit, m.list.insert, m.list.remove, m.mark, m.move, m.toast |
| B-M35 | B-S08 | - | m.swap |
| B-M36 | B-S08.ownSpoken | - | m.instant |
| B-M37 | B-S17.default | - | m.enter.group |
| B-M38 | B-S08, B-S17 | T-ZOOM | m.fade |
| B-M39 | B-S17.dismissed | - | m.exit, m.list.remove, m.move |
| B-M40 | B-S17 | - | m.instant |
| B-M41 | B-S16.afterOpening, B-S18, B-S18.default | - | m.enter.group, m.instant, m.mark |
| B-M42 | - | - | - |
| B-M43 | B-S01, B-S08, B-S19.default | T-COVER | m.cover, m.fade |
| B-M44 | B-S19.default | T-PAGE | m.fade |
| B-M45 | B-S19.interrupted | - | m.instant |
| B-M46 | B-S20.endOfBook | T-PAGE | m.draw, m.fade |
| B-M47 | B-S19, B-S20 | T-COVER, T-RESUME | m.fade |
| B-M48 | B-S23 | - | m.follow |
| B-M50 | B-S17.default, B-S17.higherSlip | - | m.instant |
| B-M51 | B-S01.dayToday | - | - |
| B-M52 | B-S08.fromNameChange | T-SHEET | m.fade, m.sheet, m.swap |
| B-M53 | B-S08.fromNameFixed | - | m.instant |
| B-M54 | B-S02.printOn | T-MENU, T-SHEET | m.sheet.own |
| B-M55 | B-S01.ratingMoment | - | - |
| B-M56 | B-S13.default | - | m.instant |
| B-M57 | B-S18 | - | m.exit, m.list.remove, m.move |
| B-M58 | B-S08.withPicture | - | - |
| B-M59 | - | - | m.instant |
| B-M60 | B-S08.withMedia | - | m.enter, m.fade |
| B-M61 | B-S08 | - | - |
| B-M62 | B-S08 | - | m.instant |
| B-M63 | B-S26 | T-COVER | m.cover, m.fade, m.glass |
| B-M64 | B-S26 | - | - |
| B-M65 | B-S08 | - | m.enter, m.exit, m.list.insert, m.list.remove, m.move |
| B-M66 | B-S08.mediaDownloading | - | m.fade, m.instant |
| B-M67 | B-S08 | - | m.instant |
| B-M68 | B-S04 | - | m.instant |
| B-M69 | - | - | - |
| B-M70 | B-S15.confirm | T-ALERT | m.list.remove |
| B-M71 | - | - | m.instant |

### C. C-keeping-and-trust

| Motion id | States keyed | T-* | m.* |
|---|---|---|---|
| M-C01 | C-S01.default | T-RESUME, T-TAB | - |
| M-C02 | C-S01, C-S02, C-S04, C-S08, C-S15 | T-PUSH | m.push |
| M-C03 | C-S01.default | - | m.instant |
| M-C68 | C-S01.local | - | m.instant |
| M-C04 | C-S03.default | - | m.sheet, m.sheet.own |
| M-C05 | C-S01.signedout, C-S03 | - | m.fade |
| M-C06 | C-S02.waiting | - | m.swap |
| M-C07 | C-S03 | - | - |
| M-C69 | C-S03, C-S19, C-S19.confirm | - | - |
| M-C08 | C-S04.default, C-S04.running | - | m.instant |
| M-C09 | C-S04.running, C-S05.making | - | m.progress |
| M-C10 | C-S04.running, C-S05.making | - | m.swap |
| M-C11 | C-S04.lowPower, C-S05.lowPower | - | m.instant |
| M-C12 | C-S04.ready, C-S04.running, C-S05.making, C-S05.ready | - | m.fade, m.mark |
| M-C13 | C-S04.cancelled, C-S04.ready, C-S04.saved | - | m.fade |
| M-C14 | C-S04.running, C-S04.stopped | - | m.fade |
| M-C15 | C-S04.error-lowSpace, C-S05.error-print | - | m.fade |
| M-C16 | C-S04.running, C-S04.stopped-by-close | - | m.instant |
| M-C17 | C-S05.making | - | - |
| M-C18 | C-S04.empty | - | m.instant |
| M-C19 | C-S06.default | T-RESUME | m.enter.group |
| M-C20 | C-S04, C-S06.default | - | m.push, m.tap |
| M-C21 | C-S06, C-S06.dismissed | - | m.exit, m.list.remove, m.move |
| M-C22 | C-S04, C-S07.default | - | m.sheet |
| M-C23 | C-S08.default | - | m.push |
| M-C24 | C-S09.onPhone | - | m.instant |
| M-C25 | C-S10.opening | - | m.fade |
| M-C26 | B-S01, C-S10.opening, C-S12 | - | m.enter.group, m.fade |
| M-C27 | B-S01, C-S12.arriving | - | m.instant, m.list.insert, m.mark |
| M-C28 | C-S12.arriving, C-S12.default | - | m.swap |
| M-C29 | C-S12.default, C-S12.dismissed | - | m.list.remove |
| M-C30 | C-S10.held | - | m.fade |
| M-C31 | C-S10.offline, C-S10.opening | - | m.fade |
| M-C72 | C-S10.killswitch | - | - |
| M-C32 | C-S10.opening, C-S11.default | - | m.sheet |
| M-C33 | C-S11, C-S11.declined | - | m.fade |
| M-C34 | C-S13.default, C-S13.loading | - | m.fade |
| M-C70 | C-S13.error-fetch | - | m.fade |
| M-C35 | C-S13.default | - | m.instant |
| M-C36 | C-S14.default | - | m.push |
| M-C37 | B-S08, C-S14 | - | m.mark, m.push, m.swap, m.toast |
| M-C38 | C-S13, C-S14.confirmRemove | T-ALERT | m.list.remove |
| M-C39 | C-S15.default | - | m.select, m.swap |
| M-C40 | C-S01, C-S15 | T-ALERT | m.list.remove, m.push |
| M-C41 | C-S16.default | - | m.list.remove |
| M-C71 | C-S15.error | - | m.enter |
| M-C42 | C-S17.default | - | m.list.remove, m.mark, m.toast |
| M-C43 | C-S17.default | T-ALERT | m.list.remove, m.toast |
| M-C44 | C-S17.error-erase_failed | - | m.toast |
| M-C47 | C-S17.default | - | m.fade |
| M-C45 | B-S22, C-S17 | - | - |
| M-C46 | C-S17 | - | m.instant |
| M-C48 | C-S18.default, C-S18.stuck | - | m.list.remove |
| M-C49 | C-S18.stuck, C-S18.stuckAgain | - | m.instant, m.tap |
| M-C50 | C-S19.default | - | m.push |
| M-C51 | C-S19.confirm | - | m.sheet, m.sheet.own |
| M-C52 | C-S19.erasing | - | m.fade |
| M-C53 | C-S19.erasing | - | m.fade |
| M-C54 | C-S19.error-failed | - | m.fade |
| M-C55 | C-S20.loading, C-S20.what | - | m.fade |
| M-C56 | C-S20.confirm, C-S20.what | T-STEP | m.step |
| M-C57 | C-S20.confirm | - | m.instant |
| M-C58 | C-S20.confirm, C-S20.sending | - | m.swap |
| M-C59 | C-S20.scheduled, C-S20.sending | - | m.fade |
| M-C60 | C-S20.cancelled, C-S20.scheduled | - | m.fade, m.toast |
| M-C61 | C-S20.error-failed | - | m.enter |
| M-C62 | C-S20.executing | - | m.fade |
| M-C63 | C-S21.consent | - | m.sheet |
| M-C64 | C-S09, C-S21.on | - | - |
| M-C65 | C-S21.on | - | m.swap |
| M-C66 | C-S22.confirm, C-S22.exportFirst | - | m.instant |
| M-C67 | C-S01, C-S22 | - | m.toast |

### D. D-family-sharing-reminders

| Motion id | States keyed | T-* | m.* |
|---|---|---|---|
| D-M01 | D-S01 | - | - |
| D-M02 | D-S01.default, D-S02.pictureOff | - | - |
| D-M03 | D-S02.pictureOff, D-S02.pictureOn | - | - |
| D-M04 | D-S02.pictureOff, D-S02.pictureOn | - | - |
| D-M05 | D-S02.error-share_temp_write_failed, D-S02.pictureOn | - | - |
| D-M06 | D-S02, D-S03 | - | - |
| D-M07 | D-S01.default, D-S03.completed | - | - |
| D-M08 | D-S01, D-S02 | - | - |
| D-M09 | D-S02.long | - | - |
| D-M10 | D-S02 | - | - |
| D-M11 | D-S12.one-parent | - | - |
| D-M12 | D-S12, D-S13.default | - | - |
| D-M13 | D-S13, D-S13.default, D-S13.loading | - | - |
| D-M14 | D-S13.sent, D-S18.pending | - | - |
| D-M15 | D-S15.default, D-S15.loading | - | - |
| D-M16 | D-S15.signed-out, D-S16.joining | - | - |
| D-M18 | D-S17.arriving, D-S17.slow | - | - |
| D-M19 | D-S17.joined | - | - |
| D-M20 | D-S12, D-S18 | - | - |
| D-M21 | D-S18 | - | - |
| D-M22 | D-S18 | - | - |
| D-M23 | D-S18 | - | - |
| D-M24 | D-S18 | - | - |
| D-M25 | D-S18.undo-open, D-S19.default | - | - |
| D-M26 | D-S18, D-S19.done, D-S19.working | - | - |
| D-M27 | D-S20.default | - | - |
| D-M28 | D-S04 | - | - |
| D-M29 | D-S04.default | - | - |
| D-M30 | D-S04.default, D-S04.pickTime, D-S07 | - | - |
| D-M31 | D-S04, D-S05 | - | - |
| D-M32 | D-S04.after-yes, D-S05 | - | - |
| D-M33 | D-S04, D-S04.after-no | - | - |
| D-M34 | D-S06 | - | - |
| D-M35 | D-S06.off, D-S06.on | - | - |
| D-M36 | D-S06.off, D-S06.on | - | - |
| D-M37 | D-S06 | - | - |
| D-M38 | D-S06.denied, D-S06.on | - | - |
| D-M39 | D-S06 | - | - |
| D-M40 | D-S04.pickTime, D-S06, D-S07.default | - | - |
| D-M41 | D-S06, D-S08.default | - | - |
| D-M42 | D-S06.typedDays-list, D-S08.filled | - | - |
| D-M43 | D-S08.error-typed_day_empty | - | - |
| D-M44 | D-S06, D-S09.confirm, D-S09.default | - | - |
| D-M45 | D-S06.backedOff | - | - |
| D-M64 | D-S08.default, D-S08.showWords | - | - |
| D-M46 | D-S10 | - | - |
| D-M47 | D-S10.evening, D-S11.home | - | - |
| D-M48 | D-S10.evening, D-S11.home | - | - |
| D-M49 | D-S10.monthAge, D-S11, D-S11.book | - | - |
| D-M50 | D-S10.monthAge, D-S11.book | - | - |
| D-M51 | D-S10.typedDay, D-S11.typedDay | - | - |
| D-M52 | D-S10.typedDay, D-S11.typedDay | - | - |
| D-M53 | D-S11 | - | - |
| D-M54 | D-S10.plan, D-S11.plan, D-S24, E-S11 | - | - |
| D-M55 | D-S10.plan, D-S11.plan | - | - |
| D-M65 | D-S11.appLock | - | - |
| D-M56 | D-S21.default, D-S21.kept | - | - |
| D-M57 | D-S21 | - | - |
| D-M58 | D-S21.default, D-S21.kept | - | - |
| D-M59 | D-S21 | - | - |
| D-M60 | D-S22.consecutive, D-S22.default | - | - |
| D-M61 | D-S22 | - | - |
| D-M66 | D-S22.default, D-S22.menu, D-S22.removed | - | - |
| D-M67 | D-S21.default, D-S21.error-save_failed | - | - |
| D-M62 | D-S23 | - | - |
| D-M63 | D-S23 | - | - |
| D-M68 | C-S24, D-S06 | T-PUSH | m.push |
| D-M69 | D-S06.daysRemindersOff | - | m.enter, m.exit, m.move |
| D-M70 | D-S06.journalNote | - | - |
| D-M71 | D-S06 | - | m.swap |
| D-M72 | C-S25, D-S25.beforeFirstTick | T-SHEET | m.sheet |
| D-M73 | D-S25.firstTickAsk | T-ALERT | m.select, m.swap |
| D-M74 | D-S25.denied | - | m.enter |
| D-M75 | D-S25.stopOne | T-ALERT | m.list.remove, m.select |
| D-M76 | D-S11 | T-LAUNCH, T-TAB | m.enter.group, m.fade |
| D-M77 | - | - | m.list.remove |
| D-M78 | C-S24, D-S08 | - | m.swap |
| D-M79 | D-S10 | - | - |
| D-M80 | D-S06.photoMomentsOff | - | m.select, m.swap |
| D-M81 | D-S06.photoMomentsOn | - | m.swap |
| D-M82 | D-S06 | T-RESUME | m.enter, m.exit |
| D-M83 | D-S10 | - | - |
| D-M84 | A-S17, D-S11 | T-LAUNCH, T-TAB | m.enter.group, m.fade |
| D-M85 | A-S18 | T-ALERT, T-SHEET | - |

### E. E-foundations-and-system-states

| Motion id | States keyed | T-* | m.* |
|---|---|---|---|
| E-M01 | E-S01.default | T-LAUNCH | m.instant |
| E-M02 | E-S01.migrating | T-LAUNCH | - |
| E-M03 | E-S01.default | T-LAUNCH | m.enter.group |
| E-M04 | E-S01.recovery | - | - |
| E-M05 | E-S01.recovery-trying | - | - |
| E-M06 | E-S01.recovery-exporting | - | - |
| E-M07 | E-S03.default | - | m.enter, m.fade |
| E-M08 | E-S03.reason-noAnswer | - | m.swap |
| E-M09a | E-S03.stop | T-STEP | m.exit, m.fade |
| E-M10 | E-S02.default, E-S03 | T-STEP | - |
| E-M11 | E-S02.default | - | m.enter.group, m.fade |
| E-M08b | E-S02.restoring | - | m.swap |
| E-M12 | E-S02.error-provider | - | m.enter |
| E-M13 | E-S08.name | T-STEP | m.step |
| E-M14 | E-S08.name-waiting | - | m.enter |
| E-M09 | E-S08.open | T-STEP | m.enter |
| E-M15 | E-S08.open | T-TAB | m.enter.group |
| E-M16 | E-S04.default | T-SHEET | - |
| E-M17 | E-S04.busy | - | m.progress.wait, m.swap |
| E-M18 | E-S04.error-provider | - | m.enter |
| E-M19 | E-S04, E-S05, E-S06 | T-PUSH | - |
| E-M20 | E-S05.sending | - | m.progress.wait, m.swap |
| E-M21b | E-S06.default | - | m.enter, m.instant |
| E-M22 | E-S06.error-wrong_code | - | m.swap |
| E-M23 | E-S06.checking | - | m.fade, m.progress.wait |
| E-M24 | E-S06.refused-other_phone | - | m.swap |
| E-M25 | E-S07.settingUp | T-STEP | m.fade |
| E-M26 | E-S07.declined | - | m.swap |
| E-M27 | E-S24.default | T-PUSH | - |
| E-M28 | E-S24.waiting | - | m.progress.wait, m.swap |
| E-M29 | E-S07, E-S09, E-S24 | T-RESUME | m.sheet |
| E-M20o | C-S10.opening | - | m.fade |
| E-M21 | C-S10.slow, C-S11 | - | m.swap |
| E-M22o | C-S10.offline | - | m.swap |
| E-M23o | C-S10.arrived, E-S02.serversOff | - | m.exit |
| E-M30 | E-S10.default | T-GATE | m.enter, m.sheet |
| E-M31 | E-S10.opening | - | m.progress.wait, m.swap |
| E-M32 | E-S10.offline | - | m.swap |
| E-M33 | E-S10 | T-KEEP, T-SHEET | - |
| E-M34 | E-S10 | T-COVER | m.sheet, m.toast |
| E-M35 | E-S10 | - | m.sheet |
| E-M36 | E-S10 | T-COVER | m.toast |
| E-M37 | E-S11.free | T-PUSH | m.fade |
| E-M38 | E-S11.restoring | - | m.progress.wait, m.swap |
| E-M39 | E-S11.notificationsOff | - | m.instant |
| E-M38c | E-S12.default | T-SHEET | - |
| E-M90 | E-S25.trial | T-SHEET | - |
| E-M91 | E-S26.on | - | m.enter.group, m.instant |
| E-M50 | E-S13.boundary | - | - |
| E-M51 | E-S13 | - | - |
| E-M52 | E-S14.offline | - | m.fade |
| E-M53 | E-S14.offline | - | m.swap |
| E-M54 | E-S14 | - | - |
| E-M55 | E-S08.name, E-S14 | - | - |
| E-M56 | E-S20.default | - | m.fade |
| E-M40 | E-S15.info | T-SYSLINE | m.enter, m.move |
| E-M41 | - | - | m.swap |
| E-M42 | - | T-SYSLINE | m.exit, m.move |
| E-M43 | - | - | m.list.remove |
| E-M44 | E-S16.line | - | - |
| E-M45 | A-S04, E-S17.under1gb | - | - |
| E-M46 | A-S04.full, E-S17.under50mb | - | - |
| E-M47 | E-S17.under20mbMidTake | - | - |
| E-M48 | C-S04, C-S05, E-S17.exportShort | - | - |
| E-M49 | - | - | m.swap |
| E-M57 | C-S10, E-S18.signedInB-noBook | - | m.sheet |
| E-M58 | E-S18.signedOutA | - | m.swap |
| E-M70 | E-S19.call | T-LOCK | m.instant |
| E-M71 | - | T-RESUME | - |
| E-M72 | E-S09, E-S11, E-S19.killedMidTake | T-LAUNCH | - |
| E-M73 | E-S22.locked | T-LOCK | m.fade |
| E-M74 | E-S22.failed | - | m.swap |
| E-M75 | - | - | m.swap |
| E-M76 | E-S21.system | - | m.instant |
| E-M80 | - | T-MIN, T-TAB | - |
| E-M81 | - | - | - |
| E-M82 | - | - | - |
| E-M100 | E-S03.platformMinor | T-STEP | m.exit, m.fade |
| E-M101 | E-S04.refused-region | - | m.swap |
| E-M102 | E-S08.dateWaiting, E-S08.name | - | m.swap |
| E-M103 | E-S08.open | - | m.progress, m.progress.wait, m.swap |
| E-M104 | E-S07.reconsent | T-SHEET, T-STEP | m.fade, m.progress.wait, m.sheet |
| E-M105 | E-S14.signInPaused | - | m.fade |
| E-M106 | E-S16.line | T-SYSLINE | m.swap |
| E-M107 | E-S18.signedInB-ownerMismatch, E-S24.accountDeleted | T-PUSH, T-SYSLINE | m.enter, m.fade |
| E-M108 | E-S30, E-S31 | T-PUSH | - |
| E-M109 | E-S03.default | - | m.select |
| E-M110 | - | - | - |
| E-M111 | - | - | m.fade, m.list.remove |
| E-M112 | - | T-SYSLINE | m.enter, m.exit, m.fade, m.move |
| E-M113 | - | - | m.enter.group |
| E-M120 | E-S32 | T-PUSH, T-SHEET | - |
| E-M121 | - | - | m.swap |
| E-M122 | - | - | m.fade |
| E-M123 | - | - | m.fade, m.progress.wait, m.swap |
| E-M124 | - | - | m.swap |

## 6. Conflicts and gaps found at the last read (flagged, not resolved)

Machine checks run over the five folders at build time:

1. Screen ids referenced somewhere but defined in no inventory table: B-S25, B-S26, C-S27, D-S25, D-S26, D-S27.
2. State names referenced from another area that the owning area DESIGN.md does not name:
   - `A-S01.first` referenced by area E (DESIGN.md); owner area A does not name it.
   - `A-S04.blocked` referenced by area E (DESIGN.md); owner area A does not name it.
   - `A-S04.blocked` referenced by area E (WORDS.md); owner area A does not name it.
   - `A-S05.stoppedForSpace` referenced by area E (DESIGN.md); owner area A does not name it.
   - `C-S10.arrived` referenced by area E (MOTION.md); owner area C does not name it.
   - `C-S10.slow` referenced by area E (MOTION.md); owner area C does not name it.
   - `C-S10.slow` referenced by area E (WORDS.md); owner area C does not name it.
   - `C-S11.held` referenced by area E (WORDS.md); owner area C does not name it.
3. Motion rows that key a state their own area DESIGN.md does not name:
   - B-M04 keys `B-S01.many`.
   - B-M07 keys `B-S01.twoParents`.
   - B-M12 keys `B-S03.twoOptions`.
   - B-M14 keys `B-S04.many`.
   - B-M14 keys `B-S05.many`.
   - B-M32 keys `B-S16.default`.
   - B-M34 keys `B-S15.overHome`.
   - B-M41 keys `B-S16.afterOpening`.
   - B-M50 keys `B-S17.higherSlip`.
   - B-M66 keys `B-S08.mediaDownloading`.
   - D-M02 keys `D-S01.default`.
   - D-M02 keys `D-S02.pictureOff`.
   - D-M03 keys `D-S02.pictureOff`.
   - D-M04 keys `D-S02.pictureOff`.
   - D-M07 keys `D-S01.default`.
   - D-M07 keys `D-S03.completed`.
   - D-M09 keys `D-S02.long`.
   - D-M11 keys `D-S12.one-parent`.
   - D-M12 keys `D-S13.default`.
   - D-M13 keys `D-S13.default`.
   - D-M13 keys `D-S13.loading`.
   - D-M14 keys `D-S18.pending`.
   - D-M15 keys `D-S15.default`.
   - D-M16 keys `D-S15.signed-out`.
   - D-M18 keys `D-S17.slow`.
   - D-M25 keys `D-S19.default`.
   - D-M26 keys `D-S19.working`.
   - D-M27 keys `D-S20.default`.
   - D-M29 keys `D-S04.default`.
   - D-M30 keys `D-S04.default`.
   - D-M30 keys `D-S04.pickTime`.
   - D-M32 keys `D-S04.after-yes`.
   - D-M33 keys `D-S04.after-no`.
   - D-M35 keys `D-S06.off`.
   - D-M35 keys `D-S06.on`.
   - D-M36 keys `D-S06.off`.
   - D-M36 keys `D-S06.on`.
   - D-M38 keys `D-S06.on`.
   - D-M40 keys `D-S04.pickTime`.
   - D-M40 keys `D-S07.default`.
   - D-M41 keys `D-S08.default`.
   - D-M42 keys `D-S08.filled`.
   - D-M43 keys `D-S08.error-typed_day_empty`.
   - D-M44 keys `D-S09.default`.
   - D-M49 keys `D-S10.monthAge`.
   - D-M49 keys `D-S11.book`.
   - D-M50 keys `D-S10.monthAge`.
   - D-M50 keys `D-S11.book`.
   - D-M54 keys `D-S10.plan`.
   - D-M55 keys `D-S10.plan`.
   - D-M56 keys `D-S21.default`.
   - D-M56 keys `D-S21.kept`.
   - D-M58 keys `D-S21.default`.
   - D-M58 keys `D-S21.kept`.
   - D-M60 keys `D-S22.consecutive`.
   - D-M60 keys `D-S22.default`.
   - D-M64 keys `D-S08.default`.
   - D-M64 keys `D-S08.showWords`.
   - D-M65 keys `D-S11.appLock`.
   - D-M66 keys `D-S22.default`.
   - ... and 41 more

## 7. Round 2 ids (photo moments and media; PROPOSED, flagged, key to NS-51 and NS-52 row ids when `27-photo-moments-and-media.md` lands)

Read from the area files at build time. A, B, D and E had written Round 2 sections; C names its proposals (C-S27) but had no Round 2 section yet.
| Proposed id | Area | What | Source section |
|---|---|---|---|
| A-S17 | A | the photo-moments invitation in Home's capture area | C DESIGN names it; A DESIGN section 12 |
| B-S25, B-S26 | B | the letter page with several pictures and videos; the full-screen viewer | B DESIGN 15a |
| B-S08 states `.withMedia`, `.withVideo`, `.videoOnly`, `.mediaDownloading` | B | media on the letter page | B DESIGN 15a |
| C-S27 | C | "Photo moments" in Me: library access, albums, pause, on-phone index and its removal | C DESIGN (round 2) |
| D-S27 | D | the nudge's lock-screen and in-app artefacts | D DESIGN section 16 |
| D-S06 states `.photoMomentsOn`, `.photoMomentsOff`, `.photoMomentsLimited` | D | reminders side of moments | D DESIGN section 16 |
| E-S32 | E | Photos access primer (permission order and the iOS prompt) | E DESIGN 15a |
| E-ST69 to E-ST80 | E | Photos limited, denied, changed, iCloud original, no space, large video, too many, video audio, media waiting, moments off, media pause, nudge | E DESIGN 15a.2 |
| E-M120 to E-M124 | E | motion for the media states | E MOTION 4y |
Overlap to settle (flagged): E-S32 (the permission primer, drawn once) and C-S27 (where the parent turns moments on, limits it or removes the index) and A-S17 (the invitation) are three parts of one journey. Default: E-S32 is the primer step that C-S27 and A-S17 both push; one component (`PermissionPrimer`, E DESIGN 15a.3), one set of door lines.

## 8. Notes from the last read (manual, beyond the machine checks)

1. Motion id schemes differ by area (`MA-nn`, `B-Mnn`, `M-Cnn`, `D-Mnn`, `E-Mnn`). Default: leave them, since every area file keys to its own; this index maps them. A to-be-ruled option is to rename to one scheme.
2. Area D's MOTION.md names no `T-*` transition (it describes each move in words and `m.*` terms), so section 4 shows no D column. Default: D cites the system T-* names in its next pass.
3. Area D and area B key several motion rows to states their DESIGN.md does not name verbatim (section 6, item 3). D writes states as `D-S02.pictureOff -> ...` in prose; B writes `B-S01.many`, `.twoParents`. Default: each area adds the missing state names to its inventory or aliases them, as E did in DESIGN section 12.
4. Screen ids referenced but not in an inventory table at build time: B-S25, B-S26, C-S27, D-S25 to D-S27 (some are Round 2 proposals; D-S25 and D-S26 are in D DESIGN prose as new in v2 and should be added to its inventory).
5. Area E states that others reference: `A-S01.first`, `A-S04.blocked`, `A-S05.stoppedForSpace` (E DESIGN) are not named by area A (A uses `denied` for `blocked`; see A's alias table); `C-S10.slow`, `C-S10.arrived`, `C-S11.held` are not named by C. Default: E re-keys to A's and C's names in the next pass: `A-S04.blocked` -> `A-S04.denied`.
6. Slip order is the same in every area that states it: 1 waiting set, 2 seal-opened, 2b day slip, 3 Save a copy, 3b Days ask, 4 past letter (RV-5, RV-6). A now draws the slot above the prompt block, which matches E DESIGN 14.3 (so E DESIGN section 17 X-6 is closed by A's v2 file).
7. The first Keep haptic (E DESIGN X-2): the card (NS-44-R12) says success once; the system motion file says none. Not resolved here.
8. Ids for "If you are struggling" and "Lines in other countries" are E-S30 and E-S31 (not ruled by K9).
9. This index was generated by reading the five folders as they were when it was built; areas were still editing in parallel at that point. Re-read before relying on a count: screen ids come from `| <id> |` inventory rows, state ids from every `<screen>.<state>` token in the area DESIGN.md, motion ids from each MOTION.md table row, T-* and m.* from those rows.
