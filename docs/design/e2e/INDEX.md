# End-to-end design: master index (screens, states, transitions, motion), areas A to E

Status: rebuilt 20 Nov 2026 by the area E design lead, by script (`docs/design/e2e/tools/build-index.py`), from the area folders as committed after areas A, C and D were re-keyed to the final pack with Round 2 (A a1e3fe80a, D 6ade48e26, C f0ad5be34; B and E as on disk). DRAFT: counts are machine counts, not reviews. Nothing in the area files was viewed in a browser or on a device. ASCII only. This file lists; it never defines. Where it and an area file differ, the area file wins and the difference is in section 6.

How to read: screen ids `<area>-Snn` and state ids `<area>-Snn.<state>` are from each area `DESIGN.md` (inventory row, a `###` screen heading, and every `.state` the file names, see the script header for the exact rule); motion ids are each area's own scheme (A `MA-nn`, B `B-Mnn`, C `M-Cnn`, D `D-Mnn`, E `E-Mnn`); transitions `T-*` and primitives `m.*` are the system names of `docs/design/system/MOTION.md`. "Card row" is the NS ids named in the screen's inventory card column (or, for a screen with no inventory row, in the first paragraph under its heading). Round 2 ids (NS-51, NS-52 and every id defined under a Round 2 or PROPOSED section) are marked PROPOSED: their cards (`27-photo-moments-and-media.md`) are not in the pack on disk, so they are keyed by card name and wait for a ruling. A state marked `[P]` is named only inside a Round 2 section. A state written as a plain word in prose, with no screen id and no leading dot, is not counted.

## 1. Counts

| Area | Screen ids | of which PROPOSED | State ids | Motion ids | of which PROPOSED | T-* transitions used |
|---|---|---|---|---|---|---|
| A A-capture | 18 | 3 | 136 | 66 | 9 | T-ALERT, T-COVER, T-LAUNCH, T-LOCK, T-MENU, T-RESUME, T-SHEET, T-SLIP, T-SYSLINE |
| B B-book-and-reading | 26 | 2 | 194 | 71 | 12 | T-ALERT, T-COVER, T-KEEP, T-MENU, T-MIN, T-PAGE, T-RESUME, T-SHEET, T-TAB, T-ZOOM |
| C C-keeping-and-trust | 27 | 1 | 208 | 97 | 6 | T-ALERT, T-INLINE, T-PUSH, T-RESUME, T-SHEET, T-SLIP, T-STEP, T-SYSLINE, T-TAB |
| D D-family-sharing-reminders | 27 | 1 | 229 | 85 | 6 | T-ALERT, T-LAUNCH, T-LOCK, T-MENU, T-PUSH, T-RESUME, T-SHEET, T-STEP, T-TAB |
| E E-foundations-and-system-states | 32 | 1 | 223 | 96 | 5 | T-COVER, T-GATE, T-KEEP, T-LAUNCH, T-LOCK, T-MIN, T-PUSH, T-RESUME, T-SHEET, T-STEP, T-SYSLINE, T-TAB |
| Total | 130 | 8 | 990 | 415 | 38 | T-ALERT, T-COVER, T-GATE, T-INLINE, T-KEEP, T-LAUNCH, T-LOCK, T-MENU, T-MIN, T-PAGE, T-PUSH, T-RESUME, T-SHEET, T-SLIP, T-STEP, T-SYSLINE, T-TAB, T-ZOOM |
| E catalogue | 82 system state ids `E-ST..` (section 3), of which 14 PROPOSED | | | | | |

Per-area detail of what the state count is made of is in the script's `--stdout` header comment, not here. A screen id that is only mentioned in prose, with no inventory row and no heading, is counted and marked so in its name.

## 2. Screens and states, by area

### A. A-capture

| Screen id | Screen | Card row | States named in the area file |
|---|---|---|---|
| A-S01 | Home (Say): whose-book switcher, dateline, greeting, the one slip slot (above the prompt block), prompt, Another [cut] | NS-01, NS-13, NS-14, NS-18, NS-19, NS-35, NS-44, NS-47-R19, NS-49-R1, NS-50 | dayDismissed, daysAsk, daysAskBelow, daysAskGone, dayToday, dayTodayQuiet, dayTodayTwo, default, fromReminder, heldMany, namelessTwo, photoMenu, photoOff, plusLine, quietKept, snapshot, twoBooks, twoBooksNameless, typedDay, waiting, waitingCard, waitingMany |
| A-S02 | Whose book sheet (one Sheet, radio list, current month under each name) | NS-14 | default, open |
| A-S03 | Apple's photo picker and Apple's recent-days picker, and our states around them (iCloud download, cancel, failure, no [cut] | NS-01, NS-49-R5 | appLockDrop, downloading, iCloudProgress, open, suggestions |
| A-S04 | Listen at Ready: from a link or doorway (red circle), with a picture (Speak and Type), with "From your phone" beside a [cut] | NS-01, NS-04, NS-06, NS-35, NS-39-R10, NS-49-R9 | busy, default, denied, doorway, fromDoorway, full, iCloudOffline, lowSpace, mediaTray[P], micDenied, openFailed, photo, photoCouldNotOpen, photoFailed, photoOffline, primer, ready, readyPhoto, suggestionLabel, suggestionNoPhoto, withPicture |
| A-S05 | Listen while recording: listening, still here, paused, finishing | NS-04, NS-06-C9, NS-09 | finishing, interrupted, lowSpace, quietTake, recording, saved |
| A-S06 | Write (Type) | NS-01, NS-35 | default, forTake, photo, withPhoto |
| A-S07 | Review: the letter sheet with To, the day and From; words states; picture; another language; Keep; Let it go | NS-01, NS-09, NS-14, NS-15, NS-16, NS-17, NS-19, NS-20 | anotherLanguageOffer, ask, dateline, dateNotSaved, dateSet, default, fileMissing, from, fromOff, fromSet, fromTooLong, interrupted, keepDisabled, language, mediaCard[P], mediaLimit[P], missingFile, noDraft, noSpeech, noWords, otherLanguage, partUnwritten, photo, photoNeedsWords, photoNotStored, photoUndo, putBack, saveFailed, stoppedBy, stoppedEarly, transcribing, twoBooks, typed, videoTooBig[P], videoTooLong[P], voiceOnly, waitingLong, withPhoto, withPicture, wordsWaiting, writing |
| A-S08 | Day sheet ("When was this?", A day or A month) | NS-15 | day, default |
| A-S09 | From sheet (who is speaking: one field, names used on this phone, the instruction line) | NS-16 | default, empty, recent, recentNames, tooLong |
| A-S10 | Another language: the mark on Review, the words-set-aside state, Type the words yourself | NS-17 | confirm, undo, waiting, withheld, withheldUndo, writeWords |
| A-S11 | Let it go confirmation (from Review and Listen) and the not-removed-yet line | NS-09 | confirm, confirmListen, confirmPhoto, notRemoved |
| A-S12 | Use this picture instead? (replace confirm), and the Undo line after replace or take off | NS-01 | changedUndo, closed, confirm, replaceAsk, undo, undoClosed |
| A-S13 | After Keep: the saved moment, the held letter, and the hand-offs (Keep gate E-S10, reminder ask D-S04) | NS-01 | held, kept, keptVoiceOnly, saved, voiceOnly |
| A-S14 | Doorways outside the app: widget, Control Center control, Action Button, Siri phrase; unlock; App lock | NS-04, NS-06, NS-35 | beforeFirstRun, firstRun, unlock, widget |
| A-S15 | Hands-free states (hypotheses only; NS-04 findings decide) | NS-04 | hypotheses, map |
| A-S16 (PROPOSED) | One photo from a suggestion: a sheet that holds each photo of the suggestion the parent picked, so the parent chooses [cut] | NS-49-R8 | none named |
| A-S17 (PROPOSED) | Moments sheet: the parent's own pictures, grouped by day, as a way to start a letter | see file | limited |
| A-S18 (PROPOSED) | Photos access: the ask, and every access state | see file | none named |

### B. B-book-and-reading

| Screen id | Screen | Card row | States named in the area file |
|---|---|---|---|
| B-S01 | The Book (tab) with the calm header bar (cover band and inline bar) | NS-01, NS-02, NS-06, NS-22, NS-37 | arrived, dark, dayToday, default, empty, findOff, firstUse, firstView, hiddenBook, hiddenReadOnly, increaseContrast, killSwitch, lensBoth, lensFirsts, lensPhotos, many, newPhone, offline, photosOff, planLapsed, quieted, ratingMoment, sealedCard, secondAccount, signedOut, twoBooks, undoDelete, undoDeleted |
| B-S02 | "More for this book" end menu (system menu; fit-to-contents sheet only where the menu cannot carry it, B G-03) | NS-22-R3 | ax, ax3, default, failed, hiddenReadOnly, printOn, quieted, twoParents |
| B-S03 | Lens choice: Months, Photos, Firsts, one radio group | NS-01-R10, NS-06-A3, NS-33-R3 | absent, ax5, default, increaseContrast, threeOptions, twoOptions |
| B-S04 | Photos lens list | NS-01-R11, NS-37 | ax5, backgrounded, dark, default, locked, many, one, thumbMissing, thumbPending |
| B-S05 | Firsts lens list | NS-06-A3 | ax5, default, labelEmpty, many, rtlLabel, sealed |
| B-S06 | Find mode over the Book | NS-02 | afterBack, ax5, cjk, dark, failed, failedGettingReady, idle, increaseContrast, killSwitch, noMatch, offline, planLapsed, results, rtlRow, short, signedOut |
| B-S07 | Go to a month sheet, with year rows | NS-22, NS-24 | ax5, dark, default, expectingOnly, withYears |
| B-S08 | The letter page with the "This letter" list | NS-21, NS-33-R1 | ax5, backgrounded, dark, default, failed, firstMarked, fromNameChange, fromNameFixed, increaseContrast, killSwitch, lowPowerMode[P], mediaDownloading[P], mediaMissing[P], mediaNotStored[P], mediaOffline[P], mediaTooLarge[P], mediaTooLong[P], newPhone, notFound, oneRow, otherParent, otherParentMedia[P], ownNoPicture, ownPrivate, ownSpoken, ownTwoAdults, ownTyped, photoMissing, photoNotStored, planLapsed, readItBack, recordingElsewhere, reduceMotion[P], sealedAuthor, signedOut, videoOnly[P], voiceOver, waiting, withMedia[P], withPicture, withVideo[P], wordsUnreviewed |
| B-S09 | Day sheet from the letter page (the same DateSheet as A-S08) | NS-15, NS-21 | default, failed |
| B-S10 | Who can read it sheet | NS-21 | ax5, default, failed, oneAdult, twoAdults |
| B-S11 | Picture on the letter page: add, replace confirm, take off with Undo, words and place sheet, failure lines | NS-01 | actions, ax5, iCloudDownloading, iCloudOffline, missing, notStored, pickFailed, replaceConfirm, undo, viewer, words |
| B-S12 | Mark a first: the toggle row, label sheet, Undo | NS-06 | atLimit, ax5, failed, labelSheet, marked, off, rtl, undo |
| B-S13 | Hide until a day: date sheet with the honest limits | NS-06 | ax5, dark, daySelected, default, expecting, noDates |
| B-S14 | Open now confirmation | NS-06-B3 | ax5, confirm, offline |
| B-S15 | Delete confirmation and the Book's "Letter deleted." Undo | NS-06-B25, NS-21-R7 | confirm, confirmSealed, overHome, undo |
| B-S16 | A hidden (sealed) letter in the Book: the sealed card | NS-06-B2 | afterOpening, ax5, dark, default, increaseContrast |
| B-S17 | One past letter on Home (slip rank 4, the last) | NS-23, NS-50-R5 | absent, appLockSnapshot, ax5, dark, default, dismissed, flagOff, higherSlip, present, switchOff |
| B-S18 | Seal-opened line on Home (slip rank 2) | NS-06-B4, NS-50-R5 | absent, ax5, default, present |
| B-S19 | Read together (whole book or one year) | NS-24 | ax5, dark, default, interrupted, newPhone, planLapsed, recordingElsewhere, rtl, skippedFailedPage, turning, typed, year |
| B-S20 | Read together: end of the year, end of the book | NS-24 | end, endOfBook, endOfYear, month |
| B-S21 | Me row "Past letters on Home" (switch) | NS-23-R4 | none named |
| B-S22 | Recently deleted: a sealed letter's row with no words | NS-06-B25 | none named |
| B-S23 | Read-along (NS-29): decision record only, not drawn | NS-29 | none named |
| B-S24 | Days and the Book: a decision record, no screen (a day is never shown in the Book; section 12) | NS-46-R22, NS-47-R5, NS-50-R4 | none named |
| B-S25 (PROPOSED) | Reading several pictures and videos with a letter (named in prose only, no inventory row) | NS-01-R40 | none named |
| B-S26 (PROPOSED) | Reading several pictures and videos with a letter (named in prose only, no inventory row) | NS-01-R40 | none named |

### C. C-keeping-and-trust

| Screen id | Screen | Card row | States named in the area file |
|---|---|---|---|
| C-S01 | Me (Look after), the tab root; .default = groups as built plus the Days row under Reminders (the fallback before tree [cut] | NS-11-R1, NS-22-R3, NS-45-R3, NS-46-R3 | ax5, default, deletedElsewhere, killswitch, local, regrouped, second-account, sessionEnded, signedout, updateRequired |
| C-S02 | Account (sign-in method, sign out, sign out of other phones) | NS-08-R6, NS-09-R12 | ax5, dark, default, offline, signedout, suspended, vo, waiting |
| C-S03 | Sign-out sheet (the D1 sheet) | NS-01-R30, NS-08-R6 | appLockOffer, days, default, photos, waiting |
| C-S04 | Save a copy (the one export screen) | NS-07, NS-10-R4, NS-11, NS-36-R2 | ax5, cancelled, dark, default, empty, error-lowSpace, error-other, error-tooBig, killswitch, lapsed, lowPower, newPhone, nothingHere, parts, ready, running, saved, second-account, shared, signedout, stopped, stopped-by-close, vo |
| C-S05 | Making the printable book (PDF) | NS-07 | error, error-print_pdf_disk_full, error-print_pdf_failed, error-share_failed, error-tooBig, lowPower, making, parts, ready, running |
| C-S06 | Home slip: Save a copy in the birthday week | NS-11-R2 | ax5, dark, default, dismissed, expecting, flagOff, quiet, second-account, twins, vo |
| C-S07 | Which book (chooser sheet) | NS-11-R14 | none named |
| C-S08 | Where your letters live | NS-08-R7, NS-10 | ax5, dark, default, flip, local, signedout, vo |
| C-S09 | Letter page: where the recording is (provenance line) | NS-08, NS-10-R1 | arriving, backedUp, notHere, onPhone, otherParent |
| C-S10 | Opening your book (new phone, returning account) | NS-10-R0 | ax5, dark, deletedElsewhere, held, killswitch, loading, noBook, offline, opening, vo, wrongAccount |
| C-S11 | Returning consent sheet and the "not agreed" screen | NS-10-R0 | ax5, backgrounded, dark, declined, default, local, second-account, serversOff, signedout, vo, withdraw, withdrawn |
| C-S12 | Book-level new phone line | NS-10-R13 | arriving, default, dismissed |
| C-S13 | Earlier versions (list) | NS-12-R1 | default, error, error-fetch_failed, loading, offline, offlineNone |
| C-S14 | An earlier version (read-only, Restore, Remove) | NS-12-R2 | confirmRemove, default |
| C-S15 | A book in Me (details, Quiet this book, Hide this book, Delete this book) | NS-22-R3 | ax5, dark, default, error, error-quiet_write_failed, local, oneBook, quiet, vo |
| C-S16 | Hidden books | NS-22 | empty |
| C-S17 | Recently deleted | NS-06-B25, NS-21-R7, NS-36-R1 | default, error-erase_failed, error-eraseKept, sealed |
| C-S18 | Storage (languages, space, and one state line when a recording is still being removed; never a list, never a count) | NS-09-R6, NS-11-R20 | lowSpace, media[P], retrying, stuck, stuckAgain |
| C-S19 | Erase everything on this phone | NS-01-R52, NS-36 | confirm, default, erasing, error-failed, ownerCheck, ownerCheckCancelled, signedin, signedoutSynced |
| C-S20 | Delete account | NS-01-R31, NS-08-R16, NS-10-R4 | cancelled, confirm, default, error-failed, error-offline, executing, loading, notConfigured, scheduled, sending, signedout, what, whatHappens |
| C-S21 | Recording backup (flip-only states; absent today) | NS-08 | absent, consent, escrow, on |
| C-S22 | Delete this book | NS-36 | confirm, exportFirst |
| C-S23 | Privacy (Me, Privacy) and its sheet .withdraw ("Stop syncing letters") | see file | consentOff, consentOn, consentWaiting, withdraw |
| C-S24 | Days (one page: Days you added, Days you chose, Browse days, the day-name switch, Clear all) | NS-18, NS-46-R3, NS-47-R14 | appLock, ax5, backgrounded, clearConfirm, country, dark, dayNames-appLock, dayNames-released, default, empty, fallbackNoQuestion, flagOff, killswitch, noDateNextYear, notificationsDenied, offline, remindersOff, sessionCleared, store-unavailable, typedOnly, vo |
| C-S25 | Browse days (sheet, with the optional tradition and country pickers and the DoorNote) | NS-46-R20, NS-47-R2 | default, fallbackNoQuestion, hemisphere, noDateNextYear, ticked, traditionPicked, unavailable, whichDate |
| C-S26 | Day detail (pushed from C-S24 only: date, Move this date, Remove) | NS-46-R14, NS-47-R21 | authorities, backgrounded, default, moving, noDate, removed |
| C-S27 (PROPOSED) | Photos access | NS-51 (PROPOSED) | albums, consent, denied, full, indexing, limited, lowSpace, off, paused, removed, turnOffConfirm |

### D. D-family-sharing-reminders

| Screen id | Screen | Card row | States named in the area file |
|---|---|---|---|
| D-S01 | Letter page: the Share control | NS-05 | absent, default, present |
| D-S02 | Share preview sheet | NS-05 | ax5, default, error-share_temp_write_failed, exact, long, noPicture, picture-failed, picture-off, picture-on, pictureOff, pictureOn, rtl, switcher, versionExact, versionFixes, wordsOnly |
| D-S03 | iOS share sheet | NS-05 | completed, text, textAndPicture |
| D-S04 | Reminder ask (sheet over the Book) | NS-13 | after-no, after-yes, after-yes-denied, after-yes-failed, default, no, pick-time, picking, pickTime, yes-allowed, yes-denied |
| D-S05 | iOS notification permission alert | NS-13 | after-yes, shown |
| D-S06 | Me, Reminders | NS-13, NS-32, NS-46, NS-48, NS-49 | after-yes-denied, after-yes-failed, appLock, ax5, backedOff, daysRemindersOff, daysRow, denied, error-schedule_failed, journalNote, lateClamp, monthNoBirthDate, named, noBirthDate, off, off-withDays, on, on-appLock, on-named, photoMomentsLimited[P], photoMomentsOff[P], photoMomentsOn[P], preview, quietDelivery, scheduleFailed, signedOut-after, twobooks, typedDays, typedDays-empty, typedDays-flagOff, typedDays-list, typedDays-remindersOff, typedDaysEmpty, typedDaysFlagOff |
| D-S07 | Time picker (system compact, 07:00 to 21:30, 15-minute steps) | NS-13 | default |
| D-S08 | Add a day sheet (also opened from C-S24) | NS-18, NS-46-R3, NS-47-R37 | appLock, dayNamesOff, default, empty, error, error-schedule_failed, error-scheduleFailed, error-typed_day_empty, error-typed_day_past, error-typed_day_too_long, filled, interrupted, notAllowed, showWords, tooLong |
| D-S09 | A typed day: detail and Delete | NS-18 | confirm, default |
| D-S10 | Lock screen and Notification Centre | NS-13, NS-18, NS-32, NS-46, NS-47, NS-48 | appLock, birthday, birthday-neutral, evening, hidden, libraryDay-hidden, libraryDay-named, libraryDay-neutral, libraryDay-quiet, monthAge, named, oneDay, summary, together, twoDays, typedDay |
| D-S11 | Notification landing | NS-13, NS-18, NS-35, NS-46-R32, NS-50 | appLock, birthday, book, evening, home, home-typed-day, libraryDay, libraryDay-cleared, monthAge, photoMoment[P], plan, typedDay, whileCapturing |
| D-S12 | Me, the book's page: "Write this book together" | NS-25 | absent, consent-needed, invited, killswitch, one-parent, oneParent, store, two-parents, twoParents |
| D-S13 | Invite sheet | NS-25 | default, full, loading, offline, paused, paused-invites, sent, signed-out, working |
| D-S14 | Invite link page (web) | NS-25 | copied, expired, iphone, missing-token, missingToken, other-device, otherDevice |
| D-S15 | Join ask: peek (top of the one join sheet) | NS-25 | default, error-expired, error-not_found, error-revoked, error-signed_out, error-used, loading, no-signoff, offline, paused, signed-out, signedout, unknownInviter |
| D-S16 | Accept: the agreement (bottom of the same sheet) | NS-25 | default, error-already_member, error-book_deleted, error-book_full, error-consent_needed, error-family_share_consent, error-join_failed, error-unknown, joining, loading, needs-sync, offline, paused |
| D-S17 | Joined: arrival | NS-25 | arriving, joined, notYet, ready, slow, twobooks, waiting |
| D-S18 | Family page | NS-25 | expired, invited, left, one-parent, oneParent, paused, paused-invites, pending, twoParents, twoParents-undoable, undo-closed, undo-open |
| D-S19 | Undo join confirm | NS-25 | default, done, error-network, error-SCPAR, error-unknown, loading, offline, working |
| D-S20 | The other parent's phone after an undo | NS-25 | default |
| D-S21 | Home: Not much today | NS-07 | default, error-save, error-save_failed, kept |
| D-S22 | Book: the quiet-day row | NS-07 | consecutive, default, menu, removed |
| D-S23 | Pilot artefacts (messages) | NS-03 | close, consentV, consentW, instructionV, instructionW, recruit, scriptA, scriptB, scriptC |
| D-S24 | Me, Plan: plan date when notifications are not allowed | NS-32-R4 | denied, notificationsOff |
| D-S25 | Day reminders: the consent line and the visible opt-out (sentences and rules owned here; drawn on C-S25, C-S24 and [cut] | NS-46-R31, NS-47-R29 | beforeFirstTick, clearAll, denied, firstTickAsk, remindersOffLine, stopOne, systemEnded |
| D-S26 | Reminder catalogue specimens (design artefact, not an app screen): neutral and named renderings, hidden previews, the [cut] | NS-48 | dayPart, expecting, grid, hidden, kind, mockFive, named, recency |
| D-S27 (PROPOSED) | Nudge's lock-screen and in-app artefacts (named in prose only, no inventory row) | NS-13, NS-32, NS-32-R14, NS-46-R30, NS-46-R31, NS-48-R2 | none named |

### E. E-foundations-and-system-states

| Screen id | Screen | Card row | States named in the area file |
|---|---|---|---|
| E-S01 | Launch and boot | see file | ax5, dark, default, error-launch, loading-export, migrating, recovery, recovery-exportFailed, recovery-exporting, recovery-exportNothing, recovery-stillClosed, recovery-trying, vo |
| E-S02 | Welcome (account-first when servers on) | see file | alpha, ax5, default, error-provider, lastMethod, loading, notice, restoring, serversOff, sessionExpired, vo |
| E-S03 | Age gate and stop | see file | agreeOnly, ax5, default, platformMinor, reason-noAnswer, reason-noTick, region, stop, stop-after24h, vo |
| E-S04 | Sign-in sheet after first run (Me, claim path) | see file | ax5, busy, default, error-cancelled, error-network, error-not_available, error-provider, refused-region, vo |
| E-S05 | Sign in: email | see file | ax5, dark, default, error-email_wait, error-invalid_email, error-network, error-not_available, reason-empty, sending, vo |
| E-S06 | Sign in: code and verify (field draws 6 to 10 digits, code.digits with {n}) | see file | ax5, checking, dark, default, error-code, error-expired, error-rate_limited, error-wrong_code, help, noAddress, paused, reason-short, refused, refused-already_signed_in, refused-other_phone, refused-other_phone_spent, verifying, vo |
| E-S07 | Agreements and consent at sign-in | see file | ax5, claim, dark, declined, default, error-consent_unavailable, loading, offline, reconsent, sensitive, vo |
| E-S08 | First book steps | see file | ax5, date, dateFuture, dateWaiting, dueRange, languages, name, name-waiting, nameLimit, open, promise, signsAs, signsAsLimit, signsAsWaiting, twins, vo |
| E-S09 | First-run router (alias of C-S10, C-S11) | see file | none named |
| E-S10 | Keep gate sheet | see file | ax5, dark, default, error-codeFailed, fromLetter, fromLetter-offline, hold, lapsed, needsNewerIos, offline, opening, synced, unavailable, vo |
| E-S11 | Plan in Me | see file | alpha, ax5, dark, ended, ends, free, grace, notificationsOff, on, renews, restored, restoreFailed, restoreNone, restoring, retry, shared, trial, vo |
| E-S12 | Plus confirmed | see file | ax5, dark, default, vo, withAsk |
| E-S13 | Something broke | see file | ax5, boundary, dark, global, noBook, secondFault, vo |
| E-S14 | Sign-in outage and offline (first run) | see file | ax5, backOnline, killswitch, offline, offline-withLocal, outage, outage-withLocal, signInPaused, vo |
| E-S15 | SystemLine in place (new component) | see file | action, ax5, dark, info, offline, paused, vo, waiting |
| E-S16 | App update line in Me | see file | absent, ax5, default, line |
| E-S17 | Low-storage rules (rendered by A-S04, A-S05, C-S04, C-S18) | see file | exportShort, low-1gb, under1gb, under20mbMidTake, under50mb |
| E-S18 | Second account on one phone | see file | second-account, signedInB-arriving, signedInB-localOnly, signedInB-noBook, signedInB-ownerMismatch, signedOutA |
| E-S19 | Interruption and recovery | see file | background, call, killedMidPurchase, killedMidTake, killedOnConsent |
| E-S20 | Not found | see file | ax5, dark, default, noBook |
| E-S21 | Appearance | see file | dark, light, noLetter, system |
| E-S22 | App lock cover | see file | ax5, dark, default, failed, locked |
| E-S23 | Accessibility walk and speed sheet | see file | matrix |
| E-S24 | Claim screen | see file | accountDeleted, ax5, default, hasBook, methodOnly, noEmail, vo, waiting |
| E-S25 | Plan reminder note in the app | see file | ax5, dark, renews, trial, yearly |
| E-S26 | Home Plus line (a rule drawn on A-S01) | see file | alpha, off, on |
| E-S27 | App Store page and install (Apple's; ours only as claims) | see file | default, installed, installing |
| E-S28 | Permission asks map (when each system permission is asked) | see file | matrix |
| E-S29 | Microphone prompt (iOS), after area A's primer at the first Speak | see file | allowed, denied, prompt |
| E-S30 | If you are struggling (new; support SUP-17, SUP-18; id assigned here because support's proposed E-S27 and E-S28 are [cut] | see file | ax5, offline, vo |
| E-S31 | Lines in other countries (new; SUP-17) | see file | ax5, list, offline, vo |
| E-S32 (PROPOSED) | Photos access primer (proposed; screen drawn with area A's moments surface) | see file | none named |

## 3. System state catalogue (area E, `E-STnn`, rendered by every area)

| Id | State |
|---|---|
| E-ST01 | Offline |
| E-ST02 | Service outage, signed in |
| E-ST03 | Sign-in outage, first run |
| E-ST04 | Servers-off build (serverFeaturesEnabled() false) |
| E-ST05 | sync |
| E-ST06 | invites |
| E-ST07 | photos |
| E-ST08 | packDownloads |
| E-ST09 | serverContent |
| E-ST10 | backupUploads |
| E-ST11 | escrow |
| E-ST12 | statusReport |
| E-ST13a | bookSearch |
| E-ST13b | reminders |
| E-ST13c | shareLetter, firsts, seals, printBook, quickCapture, earlierVersions, signAsOther |
| E-ST14 | flags.familyTeaser (coming_soon default) |
| E-ST15 | flags.introVariant |
| E-ST16 | flags.lockScreenNamesDefault |
| E-ST17 | forceReauthEpoch raised |
| E-ST18 | minSupportedVersion above this build |
| E-ST19 | freeLettersAllowance |
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
| E-ST48 | Sign-in paused (killSwitches.signIn, PROPOSED) |
| E-ST49 | Library of days paused (killSwitches.libraryDays, PROPOSED, one boolean, fail-open) |
| E-ST50 | Days store unreadable (days_store_unavailable, local) |
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
| E-ST66 | upgrade_required or gone from the server |
| E-ST67 | Email to the account bounces |
| E-ST68 | Speech download not possible |
| E-ST69 | Photos access limited (iOS "Limited") (PROPOSED, round 2) |
| E-ST70 | Photos access denied or restricted (Screen Time, MDM) (PROPOSED, round 2) |
| E-ST71 | Photos access changed while the app is open (PROPOSED, round 2) |
| E-ST72 | iCloud original not downloaded (PROPOSED, round 2) |
| E-ST73 | No space for media (PROPOSED, round 2) |
| E-ST74 | Large video (PROPOSED, round 2) |
| E-ST75 | Too many items on one letter (PROPOSED, round 2) |
| E-ST76 | Video audio (PROPOSED, round 2) |
| E-ST77 | Media waiting to upload (PROPOSED, round 2) |
| E-ST78 | Moments index off or removed (PROPOSED, round 2) |
| E-ST79 | Media kill switch (PROPOSED, round 2) |
| E-ST80 | Moments nudge on a lock screen (PROPOSED, round 2) |

## 4. Transitions (T-*) and the motion ids that use them

| Transition | Areas and motion ids |
|---|---|
| T-ALERT | A: MA-41; B: B-M11, B-M30, B-M33, B-M34, B-M70; C: M-C38, M-C40, M-C43; D: D-M23, D-M26, D-M31, D-M33, D-M44, D-M73, D-M75, D-M85 |
| T-COVER | A: MA-12, MA-13, MA-14p, MA-23; B: B-M16, B-M43, B-M47, B-M49, B-M63; E: E-M34, E-M36 |
| T-GATE | E: E-M30 |
| T-INLINE | C: M-C75, M-C76 |
| T-KEEP | B: B-M06; E: E-M33 |
| T-LAUNCH | A: MA-01, MA-13; D: D-M19, D-M48, D-M50, D-M52, D-M55, D-M76, D-M84; E: E-M01, E-M02, E-M03, E-M50, E-M51, E-M72 |
| T-LOCK | A: MA-56; D: D-M65; E: E-M70, E-M73 |
| T-MENU | A: MA-51, MA-60; B: B-M09, B-M54; D: D-M66 |
| T-MIN | B: B-M03; E: E-M80 |
| T-PAGE | B: B-M44, B-M46 |
| T-PUSH | C: M-C02, M-C73, M-C92; D: D-M11, D-M20, D-M34, D-M54, D-M68; E: E-M19, E-M27, E-M37, E-M107, E-M108, E-M120 |
| T-RESUME | A: MA-02; B: B-M02, B-M47; C: M-C01, M-C19, M-C81; D: D-M07, D-M10, D-M39, D-M47, D-M49, D-M51, D-M82; E: E-M29, E-M71 |
| T-SHEET | A: MA-06, MA-37, MA-38, MA-50, MA-53, MA-61, MA-62; B: B-M09, B-M15, B-M16, B-M27, B-M29, B-M31, B-M52, B-M54; C: M-C74; D: D-M02, D-M06, D-M08, D-M12, D-M15, D-M17, D-M25, D-M29, D-M31, D-M33, D-M41, D-M42, D-M72, D-M85; E: E-M16, E-M33, E-M38c, E-M90, E-M104, E-M120 |
| T-SLIP | A: MA-48, MA-49, MA-50; C: M-C81 |
| T-STEP | C: M-C56; D: D-M16; E: E-M09, E-M09a, E-M10, E-M13, E-M25, E-M54, E-M55, E-M100, E-M104 |
| T-SYSLINE | A: MA-09; C: M-C80, M-C87; E: E-M40, E-M42, E-M106, E-M107, E-M112 |
| T-TAB | B: B-M02, B-M23; C: M-C01; D: D-M19, D-M47, D-M49, D-M54, D-M76, D-M84; E: E-M15, E-M80 |
| T-ZOOM | B: B-M20, B-M24, B-M25, B-M32, B-M34, B-M38 |

Motion ids with no T-* named in their own row (native, in place, or keyed in prose): A 46 of 66, B 43 of 71, C 82 of 97, D 44 of 85, E 58 of 96.

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
| MA-12 | A-S01, A-S05.recording | T-COVER | m.cover, m.fade, m.tap.glass |
| MA-12a | A-S03.downloading | - | m.progress |
| MA-13 | A-S04.doorway, A-S14 | T-COVER, T-LAUNCH | m.instant |
| MA-14c | A-S04.readyPhoto | - | m.fade |
| MA-14f | A-S04.iCloudOffline, A-S04.photoCouldNotOpen | - | m.move, m.swap |
| MA-14p | A-S03, A-S04.readyPhoto | T-COVER | m.fade |
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
| MA-44 | - | - | - |
| MA-45 | A-S14.widget | - | - |
| MA-46 | A-S14.firstRun, A-S14.unlock, E-S02 | - | - |
| MA-47 | A-S15.map | - | m.instant, m.signal |
| MA-48 | A-S01.dayToday | T-SLIP | m.enter.group, m.list.remove, m.move |
| MA-49 | A-S01.dayTodayQuiet, B-S18 | T-SLIP | - |
| MA-50 | A-S01.daysAsk, C-S25 | T-SHEET, T-SLIP | m.exit, m.move |
| MA-51 | A-S01.default | T-MENU | m.tap.glass |
| MA-52 | A-S03.suggestions | - | - |
| MA-53 (PROPOSED) | A-S03.suggestions, A-S04.suggestionLabel, A-S16 | T-SHEET | m.cover, m.fade |
| MA-54 | A-S04.readyPhoto | - | m.enter, m.exit, m.move, m.swap |
| MA-55 | A-S04.suggestionNoPhoto | - | m.enter |
| MA-56 | A-S01.snapshot | T-LOCK | m.instant |
| MA-57 | A-S01.default | - | m.instant |
| MA-60 (PROPOSED) | A-S01.photoMenu | T-MENU | - |
| MA-61 (PROPOSED) | A-S17.default | T-SHEET | m.fade |
| MA-62 (PROPOSED) | A-S18.primer | T-SHEET | - |
| MA-63 (PROPOSED) | A-S04.mediaTray | - | m.enter, m.list.insert, m.move |
| MA-64 (PROPOSED) | A-S04.mediaTray, A-S07.mediaCard, A-S12 | - | m.exit, m.list.insert, m.list.remove, m.move, m.toast |
| MA-65 (PROPOSED) | A-S07.mediaCard | - | m.cover |
| MA-66 (PROPOSED) | A-S04, A-S07.mediaLimit | - | m.enter, m.swap |
| MA-67 (PROPOSED) | A-S04.mediaTray, A-S17 | - | m.progress |

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
| B-M09 | B-S02.default | T-MENU, T-SHEET | m.sheet.own |
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
| B-M28 | B-S08, B-S09.failed, B-S10.failed | - | m.move, m.swap, m.toast |
| B-M29 | B-S08, B-S12.labelSheet | T-SHEET | m.move, m.swap, m.toast |
| B-M30 | B-S08.withPicture, B-S11.actions | T-ALERT | m.enter, m.exit, m.fade, m.move, m.swap, m.toast |
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
| B-M41 | B-S16.afterOpening, B-S18.default | - | m.enter.group, m.instant, m.mark |
| B-M42 | - | - | - |
| B-M43 | B-S01, B-S08, B-S19.default | T-COVER | m.cover, m.fade |
| B-M44 | B-S19.default | T-PAGE | m.fade, m.page |
| B-M45 | B-S19.interrupted | - | m.instant |
| B-M46 | B-S20.endOfBook | T-PAGE | m.draw, m.fade |
| B-M47 | B-S19, B-S20 | T-COVER, T-RESUME | m.fade |
| B-M48 | B-S23 | - | m.follow |
| B-M49 | B-S11.viewer | T-COVER | m.cover, m.fade, m.glass |
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
| B-M60 (PROPOSED) | B-S08.withMedia | - | m.enter, m.fade |
| B-M61 (PROPOSED) | B-S08 | - | - |
| B-M62 (PROPOSED) | B-S08 | - | m.instant |
| B-M63 (PROPOSED) | B-S26 | T-COVER | m.cover, m.fade, m.glass |
| B-M64 (PROPOSED) | B-S26 | - | - |
| B-M65 (PROPOSED) | B-S08 | - | m.enter, m.exit, m.list.insert, m.list.remove, m.move |
| B-M66 (PROPOSED) | B-S08.mediaDownloading | - | m.fade, m.instant |
| B-M67 (PROPOSED) | B-S08 | - | m.instant |
| B-M68 (PROPOSED) | B-S04 | - | m.instant |
| B-M69 (PROPOSED) | - | - | - |
| B-M70 (PROPOSED) | B-S15.confirm | T-ALERT | m.list.remove |
| B-M71 (PROPOSED) | - | - | m.instant |

### C. C-keeping-and-trust

| Motion id | States keyed | T-* | m.* |
|---|---|---|---|
| M-C01 | C-S01.default | T-RESUME, T-TAB | - |
| M-C02 | C-S01, C-S02, C-S04, C-S08, C-S15, C-S20, C-S22 | T-PUSH | m.push |
| M-C03 | C-S01.default | - | m.instant |
| M-C04 | C-S03.default | - | m.sheet, m.sheet.own |
| M-C05 | C-S01.signedout, C-S03 | - | m.fade |
| M-C06 | C-S02.waiting | - | m.swap |
| M-C07 | C-S03 | - | - |
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
| M-C21 | C-S06.dismissed | - | m.exit, m.list.remove, m.move |
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
| M-C32 | C-S10.opening, C-S11.default | - | m.sheet |
| M-C33 | C-S11.declined | - | m.fade |
| M-C34 | C-S13.default, C-S13.loading | - | m.fade |
| M-C35 | C-S13.default | - | m.instant |
| M-C36 | C-S14.default | - | m.push |
| M-C37 | B-S08, C-S14 | - | m.mark, m.push, m.swap, m.toast |
| M-C38 | C-S13, C-S14.confirmRemove | T-ALERT | m.list.remove |
| M-C39 | C-S15.default | - | m.select, m.swap |
| M-C40 | C-S01, C-S15 | T-ALERT | m.list.remove, m.push |
| M-C41 | C-S16.default | - | m.list.remove |
| M-C42 | C-S17.default | - | m.list.remove, m.mark, m.toast |
| M-C43 | C-S17.default | T-ALERT | m.list.remove, m.toast |
| M-C44 | C-S17.error-erase_failed | - | m.toast |
| M-C45 | B-S22, C-S17 | - | - |
| M-C46 | C-S17 | - | m.instant |
| M-C47 | C-S17.default | - | m.fade |
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
| M-C68 | C-S01.local | - | m.instant |
| M-C69 | C-S03, C-S19.confirm | - | - |
| M-C70 | C-S13.error-fetch | - | m.fade |
| M-C71 | C-S15.error | - | m.enter |
| M-C72 | C-S10.killswitch | - | - |
| M-C73 | C-S01, C-S24, C-S26 | T-PUSH | m.push |
| M-C74 | C-S24, C-S25 | T-SHEET | m.sheet |
| M-C75 | C-S25.ticked | T-INLINE | m.select, m.swap |
| M-C76 | C-S25.whichDate | T-INLINE | m.enter, m.move |
| M-C77 | C-S24, C-S26 | - | m.list.remove |
| M-C78 | C-S24.clearConfirm | - | m.list.remove, m.sheet |
| M-C79 | C-S24 | - | m.select, m.swap |
| M-C80 | C-S24.store-unavailable | T-SYSLINE | m.enter |
| M-C81 | A-S01 | T-RESUME, T-SLIP | m.enter.group, m.fade, m.list.remove |
| M-C82 | A-S01 | - | - |
| M-C83 | C-S23.withdraw | - | m.sheet, m.swap |
| M-C84 | C-S18.retrying | - | m.instant, m.swap |
| M-C85 | C-S03.waiting | - | m.swap |
| M-C86 | C-S19.ownerCheck | - | m.instant |
| M-C87 | C-S01.sessionEnded | T-SYSLINE | m.enter |
| M-C88 | C-S01.regrouped | - | m.instant |
| M-C89 | C-S04.parts | - | m.swap |
| M-C90 | C-S25.traditionPicked | - | m.fade |
| M-C91 | C-S23.consentOff | - | m.swap |
| M-C92 (PROPOSED) | C-S27 | T-PUSH | m.push |
| M-C93 (PROPOSED) | C-S27.consent | - | - |
| M-C94 (PROPOSED) | C-S27.indexing | - | m.swap |
| M-C95 (PROPOSED) | C-S27.paused | - | m.select |
| M-C96 (PROPOSED) | C-S27.turnOffConfirm | - | m.sheet, m.swap |
| M-C97 (PROPOSED) | C-S18.media | - | m.list.remove |

### D. D-family-sharing-reminders

| Motion id | States keyed | T-* | m.* |
|---|---|---|---|
| D-M01 | D-S01 | - | m.tap |
| D-M02 | D-S01.default, D-S02.pictureOff | T-SHEET | m.sheet, m.sheet.own |
| D-M03 | D-S02.pictureOff, D-S02.pictureOn | - | m.select |
| D-M04 | D-S02.pictureOff, D-S02.pictureOn | - | m.select |
| D-M05 | D-S02.error-share_temp_write_failed, D-S02.pictureOn | - | m.swap |
| D-M06 | D-S02, D-S03 | T-SHEET | m.sheet |
| D-M07 | D-S01.default, D-S03.completed | T-RESUME | m.instant |
| D-M08 | D-S01, D-S02 | T-SHEET | m.sheet, m.sheet.own |
| D-M09 | D-S02.long | - | - |
| D-M10 | D-S02 | T-RESUME | m.instant |
| D-M11 | D-S12.one-parent | T-PUSH | m.push, m.tap |
| D-M12 | D-S12, D-S13.default | T-SHEET | m.sheet |
| D-M13 | D-S13.default, D-S13.loading | - | m.swap |
| D-M14 | D-S13.sent, D-S18.pending | - | m.toast |
| D-M15 | D-S15.default, D-S15.loading | T-SHEET | m.sheet |
| D-M16 | D-S15.signed-out, D-S16.joining | T-STEP | m.fade |
| D-M17 | - | T-SHEET | m.fade |
| D-M18 | D-S17.arriving, D-S17.slow | - | m.progress.wait |
| D-M19 | D-S17.joined | T-LAUNCH, T-TAB | - |
| D-M20 | D-S12, D-S18 | T-PUSH | m.push, m.tap |
| D-M21 | D-S18 | - | m.list.insert |
| D-M22 | D-S18 | - | m.mark |
| D-M23 | D-S18 | T-ALERT | m.list.remove, m.toast |
| D-M24 | D-S18 | - | m.toast |
| D-M25 | D-S18.undo-open, D-S19.default | T-SHEET | m.sheet |
| D-M26 | D-S18, D-S19.done, D-S19.working | T-ALERT | m.list.remove, m.toast |
| D-M27 | D-S20.default | - | m.enter |
| D-M28 | D-S04 | - | - |
| D-M29 | D-S04.default | T-SHEET | m.sheet.own |
| D-M30 | D-S04.default, D-S04.pickTime, D-S07 | - | m.move, m.swap |
| D-M31 | D-S04, D-S05 | T-ALERT, T-SHEET | m.sheet |
| D-M32 | D-S04.after-yes, D-S05 | - | m.toast |
| D-M33 | D-S04.after-no | T-ALERT, T-SHEET | m.sheet |
| D-M34 | D-S06 | T-PUSH | m.push |
| D-M35 | D-S06.off, D-S06.on | - | m.fade |
| D-M36 | D-S06.off, D-S06.on | - | m.exit |
| D-M37 | D-S06 | - | m.swap |
| D-M38 | D-S06.denied, D-S06.on | - | m.exit |
| D-M39 | D-S06 | T-RESUME | - |
| D-M40 | D-S04.pickTime, D-S06, D-S07.default | - | - |
| D-M41 | D-S06, D-S08.default | T-SHEET | m.sheet |
| D-M42 | D-S06.typedDays-list, D-S08.filled | T-SHEET | m.list.insert |
| D-M43 | D-S08.error-typed_day_empty | - | m.swap |
| D-M44 | D-S06, D-S09.confirm, D-S09.default | T-ALERT | m.list.remove, m.sheet |
| D-M45 | D-S06.backedOff | - | - |
| D-M46 | D-S10 | - | - |
| D-M47 | D-S10.evening, D-S11.home | T-RESUME, T-TAB | - |
| D-M48 | D-S10.evening, D-S11.home | T-LAUNCH | m.enter.group |
| D-M49 | D-S10.monthAge, D-S11.book | T-RESUME, T-TAB | - |
| D-M50 | D-S10.monthAge, D-S11.book | T-LAUNCH | m.enter.group |
| D-M51 | D-S10.typedDay, D-S11.typedDay | T-RESUME | m.enter, m.move |
| D-M52 | D-S10.typedDay, D-S11.typedDay | T-LAUNCH | m.enter.group |
| D-M53 | D-S11 | - | - |
| D-M54 | D-S10.plan, D-S11.plan, D-S24, E-S11 | T-PUSH, T-TAB | - |
| D-M55 | D-S10.plan, D-S11.plan | T-LAUNCH | m.enter.group |
| D-M56 | D-S21.default, D-S21.kept | - | m.fade |
| D-M57 | D-S21 | - | - |
| D-M58 | D-S21.default, D-S21.kept | - | m.fade |
| D-M59 | D-S21 | - | - |
| D-M60 | D-S22.consecutive, D-S22.default | - | - |
| D-M61 | D-S22 | - | - |
| D-M62 | D-S23 | - | - |
| D-M63 | D-S23 | - | - |
| D-M64 | D-S08.default, D-S08.showWords | - | m.swap |
| D-M65 | D-S11.appLock | T-LOCK | m.fade |
| D-M66 | D-S22.default, D-S22.menu, D-S22.removed | T-MENU | m.list.remove |
| D-M67 | D-S21.default, D-S21.error-save_failed | - | m.swap |
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
| D-M80 (PROPOSED) | D-S06.photoMomentsOff | - | m.select, m.swap |
| D-M81 (PROPOSED) | D-S06.photoMomentsOn | - | m.swap |
| D-M82 (PROPOSED) | D-S06 | T-RESUME | m.enter, m.exit |
| D-M83 (PROPOSED) | D-S10 | - | - |
| D-M84 (PROPOSED) | A-S17, D-S11 | T-LAUNCH, T-TAB | m.enter.group, m.fade |
| D-M85 (PROPOSED) | A-S18 | T-ALERT, T-SHEET | - |

### E. E-foundations-and-system-states

| Motion id | States keyed | T-* | m.* |
|---|---|---|---|
| E-M01 | E-S01.default | T-LAUNCH | m.instant |
| E-M02 | E-S01.migrating | T-LAUNCH | - |
| E-M03 | E-S01.default | T-LAUNCH | m.enter.group |
| E-M04 | E-S01.recovery | - | - |
| E-M05 | E-S01.recovery-trying | - | m.progress.wait, m.swap |
| E-M06 | E-S01.recovery-exporting | - | m.progress.wait, m.swap |
| E-M07 | E-S03.default | - | m.enter, m.fade |
| E-M08 | E-S03.reason-noAnswer | - | m.swap |
| E-M08b | E-S02.restoring | - | m.swap |
| E-M09 | E-S08.open | T-STEP | m.enter |
| E-M09a | E-S03.stop | T-STEP | m.exit, m.fade |
| E-M10 | E-S02.default, E-S03 | T-STEP | - |
| E-M11 | E-S02.default | - | m.enter.group, m.fade |
| E-M12 | E-S02.error-provider | - | m.enter |
| E-M13 | E-S08.name | T-STEP | m.step |
| E-M14 | E-S08.name-waiting | - | m.enter |
| E-M15 | E-S08.open | T-TAB | m.enter.group |
| E-M16 | E-S04.default | T-SHEET | - |
| E-M17 | E-S04.busy | - | m.progress.wait, m.swap |
| E-M18 | E-S04.error-provider | - | m.enter |
| E-M19 | E-S04, E-S05, E-S06 | T-PUSH | - |
| E-M20 | E-S05.sending | - | m.progress.wait, m.swap |
| E-M20o | C-S10.opening | - | m.fade |
| E-M21 | C-S10.slow, C-S11 | - | m.swap |
| E-M21b | E-S06.default | - | m.enter, m.instant |
| E-M22 | E-S06.error-wrong_code | - | m.swap |
| E-M22o | C-S10.offline | - | m.swap |
| E-M23 | E-S06.checking | - | m.fade, m.progress.wait |
| E-M23o | C-S10.arrived, E-S02.serversOff | - | m.exit |
| E-M24 | E-S06.refused-other_phone | - | m.swap |
| E-M25 | E-S07.settingUp | T-STEP | m.fade |
| E-M26 | E-S07.declined | - | m.swap |
| E-M27 | E-S24.default | T-PUSH | - |
| E-M28 | E-S24.waiting | - | m.progress.wait, m.swap |
| E-M29 | E-S07, E-S09, E-S24 | T-RESUME | m.sheet |
| E-M30 | E-S10.default | T-GATE | m.enter, m.sheet |
| E-M31 | E-S10.opening | - | m.progress.wait, m.swap |
| E-M32 | E-S10.offline | - | m.swap |
| E-M33 | E-S10 | T-KEEP, T-SHEET | - |
| E-M34 | E-S10 | T-COVER | m.sheet, m.toast |
| E-M35 | E-S10 | - | m.sheet |
| E-M36 | E-S10 | T-COVER | m.toast |
| E-M37 | E-S11.free | T-PUSH | m.fade |
| E-M38 | E-S11.restoring | - | m.progress.wait, m.swap |
| E-M38c | E-S12.default | T-SHEET | - |
| E-M39 | E-S11.notificationsOff | - | m.instant |
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
| E-M50 | E-S13.boundary | T-LAUNCH | - |
| E-M51 | E-S13 | T-LAUNCH | - |
| E-M52 | E-S14.offline | - | m.fade |
| E-M53 | E-S14.offline | - | m.swap |
| E-M54 | E-S14 | T-STEP | m.enter, m.exit, m.progress.wait |
| E-M55 | E-S08.name, E-S14 | T-STEP | m.enter, m.exit, m.progress.wait |
| E-M56 | E-S20.default | - | m.fade |
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
| E-M90 | E-S25.trial | T-SHEET | - |
| E-M91 | E-S26.on | - | m.enter.group, m.instant |
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
| E-M120 (PROPOSED) | E-S32 | T-PUSH, T-SHEET | - |
| E-M121 (PROPOSED) | - | - | m.swap |
| E-M122 (PROPOSED) | - | - | m.fade |
| E-M123 (PROPOSED) | - | - | m.fade, m.progress.wait, m.swap |
| E-M124 (PROPOSED) | - | - | m.swap |

## 6. Conflicts and gaps found at the last read (flagged, not resolved)

### 6.1 Machine checks over the 15 area files (DESIGN, MOTION, WORDS)

1. Screen ids referenced somewhere but defined in no inventory row, heading or prose mention of their own area: none.
2. State names referenced from another area that the owning area DESIGN.md does not name: 6.
   - `A-S01.first` referenced by E DESIGN.md.
   - `A-S04.blocked` referenced by E DESIGN.md, E WORDS.md.
   - `A-S05.stoppedForSpace` referenced by E DESIGN.md.
   - `C-S10.arrived` referenced by E MOTION.md.
   - `C-S10.slow` referenced by E MOTION.md, E WORDS.md.
   - `C-S11.held` referenced by E WORDS.md.
3. Motion rows that key a state their own area DESIGN.md does not name: 13 keys in 13 rows.
   - A (4 rows): MA-33 A-S07.markOpen; MA-36 A-S07.playing; MA-61 A-S17.default; MA-62 A-S18.primer
   - B (1 rows): B-M07 B-S01.twoParents
   - C (5 rows): M-C15 C-S05.error-print; M-C22 C-S07.default; M-C41 C-S16.default; M-C48 C-S18.default; M-C70 C-S13.error-fetch
   - D (2 rows): D-M54 D-S10.plan; D-M55 D-S10.plan
   - E (1 rows): E-M25 E-S07.settingUp

### 6.2 Contradictions the areas flagged in their own DESIGN.md (copied by the script, cut at 420 characters; the area file wins)

**Area A (DESIGN 11.3, 12, 13)**

- A 11.3 item 1. FR-OPP-03 and FR-PHS-54 say "only the chosen item reaches the app"; RV-12 ruled that wrong. This file follows RV-12 and NS-49-R16; the FR text is amended (20 Nov).
- A 11.3 item 2. FR-OPP-07 ("from {child}" path) against NS-16-R5 (never invite a child to speak): not drawn.
- A 11.3 item 3. FR-OPP-04 ("the same question again") against NS-46-R22 and the "no again" rule in NS-48-R4: not drawn.
- A 11.3 item 4. NS-50-R3 against R15 on one or two renderings of a quiet-tone day (G-22).
- A 11.3 item 5. NS-49-R1 says "one of the equal starts" in section 3 and "never larger than Speak" and "quiet capsule" in R1; the design draws it quiet, third (the section 23 default). The card text is corrected (20 Nov): the third and quiet start.
- A 11.3 item 6. FUNCTION-TRACE 6.1 row for cultural-data says "A-S01 Home strip (today strip, NS-50)": the product ruling is slip, not strip (R-IA-3). The design follows the ruling.
- A 11.3 item 7. NS-47-R29 prescribes `DoorNote` "dismissible" in a list of what it must never be, but its sentence reads "never collapsed, dismissible, behind an info glyph or glass": ambiguous list; this file reads it as "never dismissible"; the card is corrected to say so (20 Nov).
- A 12 (Round 2) Status: PROPOSED. Source: `docs/product/prd/26-founder-direction-photos-library-and-media.md` (committed f8eead016). The cards NS-51 (photo moments, library access) and NS-52 (several pictures and videos with a letter) are being written in `27-photo-moments-and-media.md`, which did not exist when this was written, so everything below is keyed to NS-51 and NS-52 by name, uses PROPOSED ids, and is [cut]
- A 12.5 Direction 26 asks for the app to show the parent their own pictures as an invitation "in the capture area". The pack's rules say a picture suggestion is never a slip or a tile (NS-50-R10, R-IA-3) and Home is not a feed. Default: no new element on Home. The invitation is the third item of the photo start's menu (A-S01.photoMenu), present only when the parent has opted in and a moment exists, plus the neutral [cut]
- A 13 Q-A7: A Home element for photo moments, if the founder wants one (direction 26) / None; the entry is the photo menu's third item and area D's neutral reminder (12.5) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order)
- A 13 Q-A11: Limits of pictures and videos per letter and video length / 6 pictures, 2 videos, 60 seconds (direction 26 defaults; Q-PM-2) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-104: Defaults stand (ask above prompt unless SE 3 check fails; fold waiting set; accept; one card shape; three thumbnails; 6/2/60; added order)

**Area B (DESIGN 14, 15f)**

- B 14 item 1. NS-50-R4 (slip directly above the prompt) against A-S01 and this area's earlier drawing of B-S17 (below "Another thought"). Karma and area A to settle; G-14.
- B 14 item 2. B W-G13 (the seal-opened line carries `en.common.notNowButton`) against NS-50-R7 (that key stays the Days ask's answer). G-20.
- B 14 item 3. IA-AUDIT D-02 and R-IA-6 keep Quiet in the Book's end menu, but BL-938 and BL-985 still place it only in Me (E-01); the cards win, as ruled.
- B 14 item 4. NS-49-R9 stores Apple's title as the parent's text with no marker; privacy and design asked whether that holds under the constitution reading (F49-4). Not mine to rule.
- B 14 item 5. B G-12 now says the seal action is absent until a day is chosen; the prototype and v1 drew it disabled. Changed here to follow the ruling.
- B 15f Q-B11: May "Photo 2 of 4" inside one letter be spoken, as Read together's "Letter n of m" is? / Yes, as a position; Karma extends rule 3 CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone)
- B 15f Q-B12: At the media limit, is a calm line wanted where the row was? / Yes, no number CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone)
- B 15f Q-B13: Does the Photos lens keep its name when videos join? / Keep "Photos"; content may rename CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone)
- B 15f Q-B14: Can the parent reorder media? / No; added order CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone)
- B 15f Q-B15: Does Save a copy hold the video file, or only say it stays on the phone? / Area C and the founder (Q-PM-3); the Book assumes the file is held when it is on the phone CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone)
- B 15f Q-B16: Do a family's own videos need captions under WCAG 1.2 for this private app? / Not drawn; compliance reads; the video's sound is not transcribed (Q-PM-4 default) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-049: No; compliance reads WCAG point
- B 15f Q-B17: Does Read together show media? / Words only, as Q-B3; a later row CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone)
- B 15f Q-B18: Moments inside the Book, as a lens? / No (section 15d) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-105: Defaults stand; Q-B15 resolved by Q-PM-3 Variant A (file held on phone)

**Area C (DESIGN 15 X1 to X7, 18 round 2 rows)**

- C 15 X1: NS-47-R17 and culture.delete.line ("Days you chose stay on your phones and are cleared with your account") against NS-47-R17's own rule ("this phone clears the store at once"), against NS-45-R10 / C-S20.cancelled ("Your letters and books are back, just as they were") / The line says days "stay" on phones; R17 clears this phone at the request; a cancelled deletion cannot bring the days back, so "just as they [cut]
- C 15 X2: FR-LCY-10 (a screen saying "these letters belong to another sign-in", naming the method) against K-E16 ("no block screen"), FR-SEC-04 (no screen names another account or says another book exists) and this file's J-C05 / Disclosing A's existence to B / Not drawn; C-S10.wrongAccount names only the method B used CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-107: Cards win on behaviour (CR-66); X2 no [cut]
- C 15 X3: NS-11-R4 (locked card 08: four slips) against NS-50-R5 (six ranks) / Card 08 lists the older order / Draw the new order; card 21 already lists the NS-11 errata row CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-107: Cards win on behaviour (CR-66); X2 no block screen per K-E16 and FR-SEC-04, counsel reads naming-method wording
- C 15 X4: NS-47-R30 (a decline control of the same style in the same stack for every optional question) against NS-46-R41 / review F47-4 (sheet exit is Done; no second control) / A "Not now" row inside C-S25 is a no-op / C-S25 draws a "Not now" first row per optional group (G23) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-107: Cards win on behaviour (CR-66); X2 no block screen per K-E16 and FR-SEC-04, [cut]
- C 15 X5: NS-46-R3 / R-IA-2 (typed days leave the Reminders page) against built NS-18 where they live on Reminders, and builds with the flag off / Two homes in a flag-off build / C-S24 .flagOff holds typed days; D-S06 keeps a pointer row "Days" (area D) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-107: Cards win on behaviour (CR-66); X2 no block screen per K-E16 and FR-SEC-04, counsel reads naming-method [cut]
- C 15 X6: IA-AUDIT D-10 (one row in Me and one on Reminders) against NS-46-R3 (one row, in Me) / One row or two / One row in Me (card wins); area D may add a pointer on Reminders CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-107: Cards win on behaviour (CR-66); X2 no block screen per K-E16 and FR-SEC-04, counsel reads naming-method wording
- C 15 X7: E28 ("never a list of recordings and never a count") against built storage.tsx and v1 of this file (a row per recording) / v1 contradicted the card / Corrected in v2 CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-107: Cards win on behaviour (CR-66); X2 no block screen per K-E16 and FR-SEC-04, counsel reads naming-method wording
- C 18 OQ-1: Does DoorNote carry a decorative lock glyph? The area's rule is no lock imagery that implies safety. / No glyph; words only. Karma rules. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-2: Does the Me regroup (.regrouped) replace .default after tree test T1, and are the group titles "Days and reminders" and "On this phone" the ones tested? / Yes after T1, working titles as drawn; content names them. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-3: Is the Spoken language row hidden in English-only builds, and is there a Languages list screen in Me? / Neither: the row stays (card 22: no row is deleted); the list is area E. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-4: Is the first tick's iOS permission ask preceded only by the inline reminder line, or by a sheet? / Inline line only (no second sheet over Browse, NS-46-R41). CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-5: "Turn on App lock" on the sign-out sheet: above or below the three buttons? / Directly under the D1 lines, plain; the safe choice stays the first button. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-6: Owner check before Erase on a phone with no passcode. / Skipped. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-7: Does Clear all offer Undo? / No; Browse re-ticks. A quiet confirm already guards it. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-8: Which Me line wins when update-required and session-ended both apply? / Update required. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-9: Is there any print entry (PRT-S01) drawn in 1.0? / No (no order feature in 1.0). CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-10: PQ-6 "Clear the due date" on C-S15. / Not drawn until the founder takes it; the spec is in 13.1. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-11: PDF fonts for Arabic and Chinese, and Hindi line height. / The template embeds the faces it needs; no missing-glyph state is shown; design-systems and mobile decide the size cost. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-12: The Days row for a signed-out phone after a sign-in. / Absent until sign-in (G18). CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-13: Round 2: limited library or full access by default (Q-PM-1), and place names (Q-PM-5). / Limited ("Selected photos") first; place names off; pending NS-51. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults
- C 18 OQ-14: Round 2: do pictures and videos sync (Q-PM-3)? / No: they stay on the phone; C-S20 and C-S08 words follow that default. CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-106: Defaults stand; OQ-13 and OQ-14 follow Q-PM-1 and Q-PM-3 defaults

**Area D (DESIGN 15, 17 round 2 rows)**

- D 15 item 1. **Per-day show-words switch (GAP-LOG D G-D14, DEFAULT) against RV-8 and NS-47-R37**: one switch for every day's words. This file follows the card and RV-8 (later, wider) and shows the fallback in G-D23. Karma rules the NS-18-R3 errata row.
- D 15 item 2. **GAP-LOG D W-G7 (typed-day section on Reminders) against NS-46-R3**: the list moves to C-S24. Followed card 21; G-D25.
- D 15 item 3. **NS-47-R14 (day-name switch "shown only when a day is ticked") against NS-47-R37 (typed words follow it)**: a parent with only typed days would have no switch. G-D24 default.
- D 15 item 4. **NS-46-R17 (no `{child}` in a names-off lock string) against the content review's neutral body text with `{child}`**: G-D26.
- D 15 item 5. **NS-46-R13 and NS-50-R4 (a day is the slip) against NS-18 (a typed day is a line in the prompt block)**: two renderings of "a day" on Home by source, as NS-50 section 3 says (A W9). It departs from IA-AUDIT 5.3 ("same component as the typed-day line"); Karma confirmed per conflict 5. Flagged only.
- D 15 item 6. **NS-32-R4b (up to 64 total) against errata E13 (60 total)**: errata followed.
- D 15 item 7. **GAP-LOG D G-D21 default ("Something for the book today" with names off) against WORDS G3 and the built title "A birthday today"**: the ruling is followed in D-S10 `birthday-neutral`; the founder and CPrivO still decide.
- D 15 item 8. **NS-48-R39 ("Example") against the built "How it will look" label**: the label stays as the section heading; the element is read "Example. {title}. {body}".
- D 15 item 9. **BRAND ban on "journal" in prose against NS-49's `journalNote` (D-S06)**: G-D27.
- D 15 item 10. **FUNCTION-TRACE 6.4 cites "FR-CUL-12: one switch under the names switch on D-S06"**, superseded by RV-13 (Days page). Noted.
- D 17 Q-D-R1: Photo-moment source rank and cap / After a ticked day; one per 7 days; no back-off exemption (G-D31, G-D34) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder)
- D 17 Q-D-R2: Default lock-screen wording for the photo-moment nudge / The card's wording with the plain fallback available; CPrivO decides FOUNDER-ANSWERED 20 Nov, default accepted (CL-054): Founder's example vs neutral; default neutral line, revisit with App lock off and names on
- D 17 Q-D-R3: May the nudge add a reminder on a day with none? / No (G-D32) CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder)
- D 17 Q-D-R4: Does the nudge need Reminders on? / Yes CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-108: Defaults stand; Q-D-4 neutral lock title; Q-D-R2 follows Q-PM-9 (founder)

**Area E (DESIGN 17, 18 photo and haptic rows)**

- E 17 X-1: Photos permission: E-S28 and council round 2 say "never a library permission"; 26-founder-direction-photos-library-and-media.md makes level 3 (library read access) a card, reversing NS-49's "level 3 closed" / E-S28 v1 vs 26 section 1 / Section 15a draws the proposed order; the v1 row stays true for levels 1 and 2 CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-109: Guard gets photos string only when [cut]
- E 17 X-2: First Keep haptic: NS-44-R12 says the success haptic plays once; design system MOTION (via E-M09, E-M33) lists no haptic and retires success for first run / card 19 NS-44-R12 vs system/MOTION.md section 9 / Follow the card for A-S13's first Keep (one success); E-M09 stays "none" on E-S08.open. Needs Karma and the system motion lead CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-110: Follow cards [cut]
- E 17 X-3: Refused-region state is keyed E-S04.refused-region (sheet used after first run) but the refusal arrives on the first-run path from the Welcome, not on the sign-in sheet / NS-40-R9 / Drawn as a StateScreen reachable from both; the id is kept as the card writes it CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-110: Follow cards (first Keep haptic per system MOTION, refused-region as StateScreen, name [cut]
- E 17 X-4: Name optional everywhere (NS-43-R1 wording is about "a birthday and no name") vs the servers-off path where nameRequired is built / NS-43-R1, K-E12 / Optional on every path; nameRequired stays for Me, Add a child CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-110: Follow cards (first Keep haptic per system MOTION, refused-region as StateScreen, name optional, F2 variant removed, slip above prompt, [cut]
- E 17 X-5: System F2 variant update required (becomes C8) and MOTION "block over everything" vs NS-45-R13 (never blocks) / system/COMPONENTS.md F2 vs NS-45 / Card wins; the system files need the variant removed CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-110: Follow cards (first Keep haptic per system MOTION, refused-region as StateScreen, name optional, F2 variant removed, slip above prompt, K2 Plus line, [cut]
- E 17 X-6: Home slip position: C9 says "above the prompt"; A-S01 first drew the slip after "Another thought"; design-systems F50-1 recommends directly above the prompt block / system COMPONENTS C9, area A, NS-50-R4 / CLOSED at INDEX time: area A's v2 file now draws the slot above the prompt block, matching section 14.3 CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-110: Follow cards (first Keep haptic per [cut]
- E 17 X-7: The K2 ruling pins one Plus line ("Reading, listening and your copy stay free"); WORDS.md still carries "Recording, reading and export stay free" / GAP-LOG K2 / WORDS.md delta below changes it; flagged for content CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-110: Follow cards (first Keep haptic per system MOTION, refused-region as StateScreen, name optional, F2 variant removed, slip above prompt, [cut]
- E 17 X-8: K9 names C-S23 and E-ST47 only; support's two "struggling" screens still have no ruled id / GAP-LOG K9 / E-S30 and E-S31 assigned here CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-110: Follow cards (first Keep haptic per system MOTION, refused-region as StateScreen, name optional, F2 variant removed, slip above prompt, K2 Plus line, E-S30/31 assigned, E-ST67)
- E 17 X-9: MSG-05 and MSG-07 ask for "E-S11 or the Me account section"; the account row is C-S02 / trace 6.5.1 / Drawn as state E-ST67 (the line), screen left to area C CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-110: Follow cards (first Keep haptic per system MOTION, refused-region as StateScreen, name optional, F2 variant removed, slip above prompt, K2 Plus line, E-S30/31 assigned, E-ST67)
- E 17 X-10: Level 3 needs a Photos permission string; E-S28's "no usage string" guard (G11-3) names photos / E-S28 vs 26 / Guard needs the photos string added only when NS-51 ships behind its flag CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-109: Guard gets photos string only when NS-51 ships behind flag; E-S28 stays until then
- E 17 X-11: killSwitches.libraryDays and killSwitches.signIn are not in kill-switches.ts or ADR 0029; RV-10 and O-19 need the vocabulary change / RV-10, O-19 / Engineering gaps G-E14, G-E15 below CLOSED 20 Nov, see GAP-LOG Closures (product pack) CL-111: mobile adds libraryDays and signIn to kill-switches.ts and ADR 0029
- E 18 D-8: First Keep haptic: the card says success once, the system motion file says none (X-2) / Follow the card; one success haptic on A-S13 only
- E 18 D-9: Place names in photo moments (Q-PM-5) / Off by default; no location permission is ever asked
- E 18 D-10: Where does the Photos access primer start from? / Parent-started from Me, and from the picture start menu only after one kept letter with a picture; never from a nudge, never in first run
- E 18 D-11: Limited access wording and action / "The app can see the pictures you chose" with Change what the app can see; no count, no nag
- E 18 D-12: How is a video limit said? / In words ("up to a minute"), with no counter; the exact cap follows Q-PM-2

### 6.3 Differences between areas that this read found (flagged, not resolved)

1. Round 2 conflict with the earlier packs: area A (12 intro) says its sections 1 to 11 still describe level 3 (library access) as closed and one picture per letter, which founder direction 26 reverses; area E (17 X-1, X-10) says the same of E-S28. Areas A to E each key the Round 2 work to NS-51 and NS-52 by name, because the cards are not on disk.
2. Round 2 invitation on Home: area A (12.5) refuses a slip or tile for the moments invitation (NS-50-R10, R-IA-3) and draws it as the third item of the photo start's menu; area D (16.3) says the tap lands on plain Home and the invitation is A-S17; area B (15d) draws nothing in the Book. These three agree with each other; the founder's "in the capture area" wording is the open point (A Q-A7).
3. Slip position: E DESIGN 17 X-6 is marked closed (area A draws the one slot above the prompt block), but area A keeps Q-A1 open (above, unless an SE 3 check says otherwise) and area E D-6 still says area A to confirm; area B Q-B1 follows whatever A draws. Not closed in one place.
4. First Keep haptic (E DESIGN X-2, D-8): the card (NS-44-R12) says success once; the system motion file says none. Not resolved here.
5. Motion id schemes differ by area (`MA-nn`, `B-Mnn`, `M-Cnn`, `D-Mnn`, `E-Mnn`). Default: leave them, since every area keys to its own; this index maps them.
6. Area D's MOTION.md now keys T-* and m.* in its section 13.1 as a numeric table (`02, 08` for D-M02 and D-M08); the script expands those, so D has a T-* column. A row there that names a number with no D-M row of its own would still count as an id.
7. Ids for "If you are struggling" and "Lines in other countries" are E-S30 and E-S31 (not ruled by K9; E DESIGN D-2).
8. Area D's reminder side of NS-51 keeps its own id D-S27 and states `.photoMomentsOn`, `.photoMomentsOff`, `.photoMomentsLimited`; D-S10 states named `photoMoment`, `photoMoment-plain` and others are written without a leading dot in D DESIGN 16.2, so the script does not count them as D-S10 states (see the unverified list in the run report).
9. Area C 15 X1: the line `culture.delete.line` (days stay on phones) against NS-47-R17 (this phone clears the store at once) and NS-45-R10 ("just as they were"). Area D 15 item 3 (NS-47-R14 against R37) and area A 11.3 item 7 (NS-47-R29 wording) flag neighbouring NS-47 rows.

## 7. Round 2 ids (photo moments and media; PROPOSED, flagged; key to NS-51 and NS-52 row ids when `27-photo-moments-and-media.md` lands)

Read from the area files. Every area now has a Round 2 section (A 12, B 15, C 17, D 16, E 15a).

| Proposed id | Area | What | Where defined |
|---|---|---|---|
| A-S16 | A | One photo from a suggestion: a sheet that holds each photo of the suggestion the parent picked, so [cut] | A DESIGN.md line 33 (table) |
| A-S17 | A | Moments sheet: the parent's own pictures, grouped by day, as a way to start a letter | A DESIGN.md line 993 (table) |
| A-S18 | A | Photos access: the ask, and every access state | A DESIGN.md line 994 (table) |
| B-S25 | B | Reading several pictures and videos with a letter (named in prose only, no inventory row) | B DESIGN.md line 821 (mention) |
| B-S26 | B | Reading several pictures and videos with a letter (named in prose only, no inventory row) | B DESIGN.md line 821 (mention) |
| C-S27 | C | Photos access | C DESIGN.md line 1012 (heading) |
| D-S27 | D | Nudge's lock-screen and in-app artefacts (named in prose only, no inventory row) | D DESIGN.md line 1112 (mention) |
| E-S32 | E | Photos access primer (proposed; screen drawn with area A's moments surface) | E DESIGN.md line 807 (table) |
| A-S04 states `.mediaTray` | A | states named only in a Round 2 section | A DESIGN.md |
| A-S07 states `.mediaCard`, `.mediaLimit`, `.videoTooBig`, `.videoTooLong` | A | states named only in a Round 2 section | A DESIGN.md |
| B-S08 states `.lowPowerMode`, `.mediaDownloading`, `.mediaMissing`, `.mediaNotStored`, `.mediaOffline`, `.mediaTooLarge`, `.mediaTooLong`, `.otherParentMedia`, `.reduceMotion`, `.videoOnly`, `.withMedia`, `.withVideo` | B | states named only in a Round 2 section | B DESIGN.md |
| C-S18 states `.media` | C | states named only in a Round 2 section | C DESIGN.md |
| D-S06 states `.photoMomentsLimited`, `.photoMomentsOff`, `.photoMomentsOn` | D | states named only in a Round 2 section | D DESIGN.md |
| D-S11 states `.photoMoment` | D | states named only in a Round 2 section | D DESIGN.md |
| E-ST69 to E-ST80 | E | system states for media and moments (E-ST48 and E-ST49 are also PROPOSED, but from the final pack, not Round 2) | E DESIGN.md 15a.2 |
| MA-53, MA-60, MA-61, MA-62, MA-63, MA-64, MA-65, MA-66, MA-67 | A | motion rows keyed to a PROPOSED screen, a Round 2 state or a Round 2 E-ST (all ids listed) | A MOTION.md |
| B-M60, B-M61, B-M62, B-M63, B-M64, B-M65, B-M66, B-M67, B-M68, B-M69, B-M70, B-M71 | B | motion rows keyed to a PROPOSED screen, a Round 2 state or a Round 2 E-ST (all ids listed) | B MOTION.md |
| M-C92, M-C93, M-C94, M-C95, M-C96, M-C97 | C | motion rows keyed to a PROPOSED screen, a Round 2 state or a Round 2 E-ST (all ids listed) | C MOTION.md |
| D-M80, D-M81, D-M82, D-M83, D-M84, D-M85 | D | motion rows keyed to a PROPOSED screen, a Round 2 state or a Round 2 E-ST (all ids listed) | D MOTION.md |
| E-M120, E-M121, E-M122, E-M123, E-M124 | E | motion rows keyed to a PROPOSED screen, a Round 2 state or a Round 2 E-ST (all ids listed) | E MOTION.md |
| NS-51, NS-52 | all | the cards are not in the pack on disk; rows key by card name | `docs/product/prd/26-founder-direction-photos-library-and-media.md` |

Overlap to settle (flagged): the Photos permission journey is drawn in four places: A-S18 (the ask, in area A), E-S32 (the primer step and the permission order, E DESIGN 15a.1), C-S27 (where the parent turns moments on, limits it or removes the index) and A-S17 (the Moments sheet the ask leads to). Default in the area files: one `PermissionPrimer` component (E DESIGN 15a.3), one set of door lines; A-S18 and E-S32 describe the same sheet, and which id survives is not ruled here.

## 8. Notes from the last read (manual, beyond the machine checks)

1. This index was generated by reading the area folders as committed on branch `docs/e2e-ux-20nov`; areas may still be editing. Re-run `python3 -I docs/design/e2e/tools/build-index.py` before relying on a count.
2. Counts are machine counts of tokens. A screen heading with no inventory row (C-S27) is read from its `###` heading; an id only named in prose (for example D-S27) is counted and marked. A state named only in words (no `.` prefix, no screen id on the line) is not counted. Table rows that repeat an id in a later integration table do not add states unless the state token is on the row.
3. Motion ids: a row counts when its first cell is one id or a comma list of ids in the area scheme. A moment described only in prose, with no table row and no heading, is not counted. Several areas keep a second key table (area D 13.1, area E 4z) that adds T-* and m.* to ids defined elsewhere; the script merges them.
4. Area B and area E were not re-keyed in this round; their files are as committed earlier (B 8585858e3, E deda71116 plus later edits on disk). Their counts are the same method, not a new review.
5. T-INLINE (C, M-C75 and M-C76) is named only by area C, which marks it PROPOSED; T-SLIP (A, C) is not in `docs/design/system/MOTION.md` either (checked by grep on 20 Nov: the system file names T-ALERT, T-COVER, T-GATE, T-KEEP, T-LAUNCH, T-LOCK, T-MENU, T-MIN, T-PAGE, T-PUSH, T-RESUME, T-RUN, T-SHEET, T-STEP, T-SYSLINE, T-TAB, T-ZOOM). No area row uses T-RUN.
6. Slip order is the same in every area that states it: 1 waiting set, 2 seal-opened, 2b day slip, 3 Save a copy, 3b Days ask, 4 past letter (RV-5, RV-6).
