# Early Letters v1.0: customer journey, as the app really renders it

Generated from the web end-to-end flows (`apps/mobile/e2e-web/*.flow.ts`), run against the real v1.0 app exported for web with
`EXPO_PUBLIC_SERVER_FEATURES=off` (on this phone only, no accounts, no sync). Chromium emulating an iPhone 17 Pro
(402 x 874 CSS px at 3x). Nothing here is a mock-up: every screen is a screenshot of the running app, and `text` in each step JSON is the
visible text read from the page.

- Journeys: **20**, steps: **118** (happy 87, unhappy 31), screenshots: **118**, plus **28** full-length captures of scrolling screens (`<id>-full.png`).
- Files: `steps/<id>.json` (id, journey, kind, title, note, from, route, viewport, safeArea, scrolls, text, lines), `screens/<id>.png`, `screens/<id>-full.png`.
- Regenerate: `npm run e2e:web:journey -w @scribe/mobile` then `node apps/mobile/e2e-web/support/build-index.mjs`.
- Seeded steps use the fictional family Asha (the web preview switch `EXPO_PUBLIC_WEB_PREVIEW=1`, `?seed=asha`), because the web build has no speech model and cannot produce words from a recording. They are the real screens with data filled in; each such step says so.
- Safe areas: a browser applies 0 to the top and bottom insets. Each step records `safeArea.appliedOnWeb` and the iPhone 17 Pro nominal insets (top 62, bottom 34) the device frame should keep clear.

## J01 First run: age question, promise, child, signature, first letter

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J00-open | happy | **The first thing anyone sees: one plain question.** The same question for everyone (A-REQ-030). |  | [png](screens/J00-open.png) |
| J01-01 | happy | **The age question.** The first screen is one neutral question, with nothing preselected. Continue stays off until the person picks Yes or No. | J00-open | [png](screens/J01-01.png) |
| J01-02 | happy | **Yes is chosen.** The person taps Yes. Continue turns on. Only a yes/no flag is stored on the phone, never an age. | J01-01 | [png](screens/J01-02.png) |
| J01-03 | happy | **Welcome.** The envelope, the name, one line of what the book is. Two buttons: begin, or "I was invited". | J01-02 | [png](screens/J01-03.png) |
| J01-04 | happy | **The promise.** What the app does with words (tidies, never rewrites), that the voice is kept on the phone, that it can mishear, and that it is private by default. | J01-03 | [png](screens/J01-04.png) |
| J01-05 | unhappy | **Child step with no name.** Nothing typed yet. Continue is disabled, so an empty name can never be saved (there is no error message on this step, the button is simply off). | J01-04 | [png](screens/J01-05.png) |
| J01-06 | unhappy | **A very long name is cut at 60 characters.** The person pastes 90 letters. The field keeps the first 60 and stops, so a name can never break the layout of the book. No warning is shown. | J01-05 | [png](screens/J01-06.png) |
| J01-07 | happy | **Name entered, birthday is today.** The name is in. The birthday defaults to today; on a phone the date is a compact picker (the web build shows it as a plain date pill and cannot open the iOS picker). | J01-05 | [png](screens/J01-07.png) |
| J01-08 | happy | **Not born yet: due date instead.** Choosing "Not here yet" turns the date into a due date. The picker only allows dates up to 305 days ahead; a future birthday is not selectable on a phone (not testable on web, where the picker does not open). | J01-07 | [png](screens/J01-08.png) |
| J01-09 | happy | **Add another child (twins or more).** A second name field appears, each with a remove button. Every book made in first run is free. | J01-07 | [png](screens/J01-09.png) |
| J01-10 | happy | **What does Asha call you?.** The name the child will call this parent, which signs every letter. Sign my letters is off until something is chosen or typed. | J01-07 | [png](screens/J01-10.png) |
| J01-11 | happy | **Signature chosen.** Tapping a suggestion fills the field and previews the signature in script. | J01-10 | [png](screens/J01-11.png) |
| J01-12 | happy | **Choose the spoken language.** A sheet lists the languages letters can be spoken in. Choosing one only starts that language's downloads (the download itself is native and cannot run on web). | J01-11 | [png](screens/J01-12.png) |
| J01-13 | happy | **The book is open.** A page with one line. The only action is to write the first letter. | J01-12 | [png](screens/J01-13.png) |
| J01-14 | happy | **Tonight, for the first time.** The home tab: a greeting with the signature name, one gentle prompt, Speak and Type side by side, and "Not much today" for quiet days. | J01-13 | [png](screens/J01-14.png) |

## J02 Under 18: the stop screen and the way back

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J02-01 | unhappy | **No is chosen.** The person says they are under 18. Nothing else is asked. | J01-01 | [png](screens/J02-01.png) |
| J02-02 | unhappy | **The stop screen.** A calm explanation with no way to continue or go back. No child, letter or recording exists, only the time of the No is stored. | J02-01 | [png](screens/J02-02.png) |
| J02-03 | unhappy | **Reopening the app: still stopped.** Relaunching shows the same stop screen. The answer cannot be retried by restarting. | J02-02 | [png](screens/J02-03.png) |
| J02-04 | unhappy | **After 24 hours: "I answered by mistake".** Only once a day has passed does the stop screen offer a way back. (Browser clock moved forward 25 hours; the logic is the app's own.) | J02-03 | [png](screens/J02-04.png) |
| J02-05 | happy | **The question again, nothing preselected.** The age question returns, empty, and the person can answer again. | J02-04 | [png](screens/J02-05.png) |

## J03 More than one child, the switcher, and the Plus gate for a new book

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J03-01 | happy | **Two names in first run.** Twins or more: each name gets a field and a remove button. All books made here are free; they share the date. | J01-06 | [png](screens/J03-01.png) |
| J03-02 | happy | **One signature for both.** The title asks what both children call the parent, so one signature covers every book made here. | J03-01 | [png](screens/J03-02.png) |
| J03-03 | happy | **The book is open, for two.** The closing screen names both children. | J03-02 | [png](screens/J03-03.png) |
| J03-04 | happy | **The Book tab, empty, with a child switcher.** The first book is open. A small switcher at the top left lets the person move between the two books. | J03-03 | [png](screens/J03-04.png) |
| J03-05 | happy | **Whose book? sheet.** A sheet lists every book on this phone with the current one marked. Choosing one switches Tonight, Book and writing to that child. | J03-04 | [png](screens/J03-05.png) |
| J03-06 | happy | **Settings, with both children listed.** Each child has a row; "Add a child" sits below them. | J03-05 | [png](screens/J03-06.png) [full](screens/J03-06-full.png) |
| J03-07 | happy | **One child's settings.** Name, date, signature, a reminders switch, the co-parent row ("Soon") and a "Family can read" switch that stays off in v1.0. Hide this book is offered because there is more than one (its confirm dialog is native and does not appear on web). | J03-06 | [png](screens/J03-07.png) |
| J03-08 | unhappy | **A third book needs Plus.** Starting another book after first run is a Plus feature. The screen says every existing book stays open, and offers Not now. Buying needs StoreKit, which does not exist on web, so the page says Plus is not available on this device. | J03-07 | [png](screens/J03-08.png) |
| J03-09 | happy | **Not now returns to Settings.** Declining the gate changes nothing and goes back. | J03-08 | [png](screens/J03-09.png) [full](screens/J03-09-full.png) |

## J04 Tonight, prompts, and the usage-sharing ask

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J04-01 | happy | **Tonight with a letter waiting.** With a recording waiting on Review, a quiet card says so above Speak and Type. (Seeded fictional family Asha, 7 months.) | J01-14 | [png](screens/J04-01.png) |
| J04-02 | happy | **Another thought.** The prompt card swaps for a different one in place. There is no limit and nothing is counted. | J04-01 | [png](screens/J04-02.png) |
| J04-03 | happy | **Tonight on day 0.** A new book: the dateline reads "Asha, 0 days", no waiting card, one prompt chosen for a newborn. | J04-02 | [png](screens/J04-03.png) |
| J04-04 | happy | **A later session: "Help us make it better?".** Never in the first session. On a later session with at least one letter, a calm sheet asks once whether to share which screens are opened and when something crashes, never any words, recordings or names. "Don't share" and "Share usage" are equal; closing it without choosing asks at most once more. (Shown on a tab screen only, 1.2 seconds after it opens.) | J04-02 | [png](screens/J04-04.png) |
| J04-05 | happy | **Declined: nothing else changes.** Saying no ends the asking for good and changes nothing else; it can be changed in Settings, Privacy. | J04-04 | [png](screens/J04-05.png) |

## J05 Speaking a letter: listening, pause, mic denied, offline, very short, long

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J05-01 | happy | **Listening.** Full-screen and calm: who it is to, "Only you, until you add it to the book", a running clock and a glow that moves with the voice. Microphone permission was granted (on a phone iOS asks once, in its own alert, which a browser cannot show). | J04-03 | [png](screens/J05-01.png) |
| J05-02 | happy | **Paused.** Pause stops the clock and the glow. Keep talking continues the same recording. | J05-01 | [png](screens/J05-02.png) |
| J05-03 | happy | **Finished: Review opens at once.** The take is kept first, then Review opens. It says it is writing down what was said. The web build records with the browser's fake microphone (a steady tone) and has no speech model, so the words never arrive; the real app writes them down on the phone. | J05-02 | [png](screens/J05-03.png) |
| J05-04 | unhappy | **Microphone is off.** A calm card, not an error: it offers to type the letter instead (first), open iOS Settings, or close. The browser denial is simulated by refusing getUserMedia; on a phone it is iOS's permission state, and "Open Settings" is native and does nothing on web. | J05-01 | [png](screens/J05-04.png) |
| J05-05 | happy | **Typing instead.** The person lands on the Write page for the same prompt. | J05-04 | [png](screens/J05-05.png) |
| J05-06 | unhappy | **Listening with no connection.** The device is offline. Nothing changes: recording, words and the book are all on the phone, and there is no "offline" banner anywhere in v1.0. The web build records with the browser's fake microphone (a steady tone) and has no speech model, so the words never arrive; the real app writes them down on the phone. | J05-01 | [png](screens/J05-06.png) |
| J05-07 | unhappy | **Review with no connection.** Review opens as usual; nothing waits on the network. | J05-06 | [png](screens/J05-07.png) |
| J05-08 | unhappy | **Finished at once.** Finish tapped straight after starting. The app keeps whatever was captured and opens Review; it does not refuse a short or empty take. The web build records with the browser's fake microphone (a steady tone) and has no speech model, so the words never arrive; the real app writes them down on the phone. | J05-01 | [png](screens/J05-08.png) |
| J05-09 | happy | **Over a minute in.** The clock keeps counting with no limit (here past a minute). If the level stays below speaking level for 8 seconds the line under the clock becomes a gentle "still here" (on web the fake microphone and the missing level meter make that unreliable, so it is not asserted). On a phone the elapsed time is announced to VoiceOver once a minute. | J05-01 | [png](screens/J05-09.png) |

## J06 Review: tidy-ups, put back, word for word, edit, save or keep private

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J06-01 | happy | **Review, with a first-time note.** The words as spoken, with each tidy-up quietly underlined, a count of small fixes, and a one-time note saying what was and was not done. Words come from the seeded fictional family Asha (the web build has no speech model, so a real recording never gets words). | J05-03 | [png](screens/J06-01.png) [full](screens/J06-01-full.png) |
| J06-02 | happy | **First note dismissed.** "Got it" collapses the note for good. | J06-01 | [png](screens/J06-02.png) [full](screens/J06-02-full.png) |
| J06-03 | happy | **Why was this changed?.** Tapping a tidy-up (the underline or its row) says what kind of fix it was, shows the exact words said and the tidied version, and offers to put it back. | J06-02 | [png](screens/J06-03.png) [full](screens/J06-03-full.png) |
| J06-04 | happy | **Put back.** The original words return, marked for a moment, with Undo beside them. | J06-03 | [png](screens/J06-04.png) [full](screens/J06-04-full.png) |
| J06-05 | happy | **Undo the put-back.** Undo re-applies the tidy-up. Every edit is reversible both ways. | J06-04 | [png](screens/J06-05.png) [full](screens/J06-05-full.png) |
| J06-06 | happy | **Exactly what was said.** The raw words, untouched, with their "um" and repeats, labelled as the original. | J06-05 | [png](screens/J06-06.png) [full](screens/J06-06-full.png) |
| J06-07 | happy | **Word for word.** One tap undoes every tidy-up at once; the screen says nothing was changed. | J06-06 | [png](screens/J06-07.png) |
| J06-08 | happy | **Change words.** The person may edit any word themselves. Save is off while editing; Done returns. | J06-07 | [png](screens/J06-08.png) |
| J06-09 | happy | **Does this sound like you? Not quite.** A private two-button check on how faithful the words sound. "Not quite" shows a kind follow-up line; nothing is stored about the words. | J06-08 | [png](screens/J06-09.png) [full](screens/J06-09-full.png) |
| J06-10 | happy | **Saved to the book.** The letter settles into a card with "Added to Asha's book". Review closes by itself or on tap. | J06-09 | [png](screens/J06-10.png) |
| J06-11 | happy | **Kept private.** The letter is saved outside the book. It is only on this phone and can be added later from the letter page. | J06-02 | [png](screens/J06-11.png) |
| J06-12 | unhappy | **Close without saving.** Closing leaves the draft where it was: the "A letter is waiting to be read back" card is still on Tonight. Nothing is deleted. ("Let it go", the only delete, is a native confirm dialog that does not appear on web.) | J06-02 | [png](screens/J06-12.png) |
| J06-13 | unhappy | **Review with no draft.** If Review is opened with a draft that no longer exists (only reachable by a stale link) the app says the words are safe and offers Close. It is not reachable by tapping. | J06-01 | [png](screens/J06-13.png) |

## J07 Typing a letter: write, autosave, draft, review, save

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J07-01 | happy | **Write, empty.** A page, not a form: the child's name and age, the prompt as a quiet line, and a blank letter. Save is off until something is typed. | J01-14 | [png](screens/J07-01.png) |
| J07-02 | happy | **Typing, autosaved.** After a pause "Saved on this phone" appears. Every pause saves a local draft, so a closed sheet or a crash loses nothing. | J07-01 | [png](screens/J07-02.png) |
| J07-03 | happy | **Review a typed letter.** Typed words are kept exactly as typed: no tidying, no list of changes, no "does this sound like you". The person chooses where it goes. | J07-02 | [png](screens/J07-03.png) |
| J07-04 | happy | **Saved to the book.** The letter settles into a card with a confirmation, then Review closes on its own after a moment (or on tap). | J07-03 | [png](screens/J07-04.png) |
| J07-05 | unhappy | **Closed before finishing.** Closing keeps the words as a draft. Tonight now shows a quiet card to pick the letter back up. | J07-01 | [png](screens/J07-05.png) |
| J07-06 | happy | **Picking the draft back up.** Tapping the card reopens the page with the words exactly as left. | J07-05 | [png](screens/J07-06.png) |
| J07-07 | happy | **Kept private.** Keep private saves the letter outside the book. It stays on the phone and can be added later. | J07-03 | [png](screens/J07-07.png) |

## J08 A quiet day: "Not much today"

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J08-01 | happy | **A day with little to say.** Under Speak and Type sits a quiet link: "Not much today". | J04-01 | [png](screens/J08-01.png) |
| J08-02 | happy | **Kept, with no guilt.** One line of warmth replaces the link. A one-line note is stored for the day (it never appears in the book and is not counted as a letter). | J08-01 | [png](screens/J08-02.png) |
| J08-03 | happy | **The Book is unchanged.** The note is not in the Book and no streak or gap is shown. | J08-02 | [png](screens/J08-03.png) [full](screens/J08-03-full.png) |

## J09 The Book: empty, one letter, many, waiting for words, nobody spoke

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J09-01 | happy | **An empty book.** One drawing, one plain sentence, one action: "Write a letter". No counts, no gaps, nothing to fill in. | J07-04 | [png](screens/J09-01.png) |
| J09-02 | happy | **One letter.** The first letter sits under its month chapter. Read together appears once there is at least one letter in the book. | J09-01 | [png](screens/J09-02.png) |
| J09-03 | happy | **Many letters, by month.** Chapters by month of age, newest first. Each card shows the first words, the signature and a recording length. A private letter carries a "Private" mark. (Seeded fictional family Asha.) Full length capture shows every chapter. | J09-02 | [png](screens/J09-03.png) [full](screens/J09-03-full.png) |
| J09-04 | unhappy | **A voice-only letter waiting for words.** A kept recording whose words have not been written yet shows a calm note on its card instead of text. Nothing is lost; the recording is on the phone. | J09-03 | [png](screens/J09-04.png) [full](screens/J09-04-full.png) |
| J09-05 | unhappy | **A recording in which nobody spoke.** A kept recording that came back with no words shows a gentle "nobody spoke" note instead of an empty card. | J09-03 | [png](screens/J09-05.png) [full](screens/J09-05-full.png) |

## J10 A letter: original words, reading size, private, delete and undo, not found

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J10-01 | happy | **A letter, as a page.** The words large in the letter face, signed "From Mama", with the recording player, how it was made, "Recording on this phone", and the actions below. (Seeded fictional family Asha; the seeded audio files do not exist, so the player is the closest honest state, see the note on the next step.) | J09-03 | [png](screens/J10-01.png) |
| J10-02 | happy | **Show exactly what I said.** The raw words replace the tidied ones, under an "original" label. | J10-01 | [png](screens/J10-02.png) |
| J10-03 | happy | **Reading size sheet.** A small "Aa" sheet changes the letter size live behind it: Standard, Large, Large print. | J10-02 | [png](screens/J10-03.png) |
| J10-04 | happy | **Large print.** The page re-sets at the largest size, cross-fading rather than animating the size. | J10-03 | [png](screens/J10-04.png) [full](screens/J10-04-full.png) |
| J10-05 | happy | **Make private.** The letter leaves the book; a "Private" mark and a toast confirm it. Moving it back is one tap. | J10-04 | [png](screens/J10-05.png) [full](screens/J10-05-full.png) |
| J10-06 | unhappy | **Deleted, with Undo.** Delete is immediate, with no confirm dialog. The screen says so and Undo stays until the person taps Undo, Close or Back (no timer). | J10-05 | [png](screens/J10-06.png) |
| J10-07 | happy | **Undo restores the letter.** The letter is back exactly as it was. | J10-06 | [png](screens/J10-07.png) [full](screens/J10-07-full.png) |
| J10-08 | happy | **A typed letter.** Typed letters have the words and the signature, with "typed" provenance, and no player or recording line. | J10-01 | [png](screens/J10-08.png) |
| J10-09 | unhappy | **A letter waiting for its words.** The page shows a calm italic note instead of an empty page; the recording is there. | J10-01 | [png](screens/J10-09.png) |
| J10-10 | unhappy | **A recording in which nobody spoke.** The page says nobody spoke; the recording is still there and can be kept. | J10-01 | [png](screens/J10-10.png) |
| J10-11 | unhappy | **Letter not found.** A letter that is not on this phone (a stale link) shows a plain title and one button back. | J10-01 | [png](screens/J10-11.png) |

## J11 Read together: free tries, the Plus gate, empty

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J11-01 | happy | **Read together, first letter.** Chrome-free, Large Print by default: one letter at a time, oldest first, with a "Hear Mama" player for the recording on the phone. This opening is free try 1 of 3 for this book. (Seeded family Asha. Playback itself is native audio and is not exercised on web.) | J09-03 | [png](screens/J11-01.png) |
| J11-02 | happy | **Next letter.** Next and Back one move through the book. The date line names who wrote it and the month of age. | J11-01 | [png](screens/J11-02.png) |
| J11-03 | happy | **Play the next one on its own.** A switch turns on autoplay: when a recording ends the page turns and the next voice starts. | J11-02 | [png](screens/J11-03.png) |
| J11-04 | happy | **The end of the book.** After the last letter: an end line, a finish button and "again". | J11-03 | [png](screens/J11-04.png) |
| J11-05 | unhappy | **The fourth opening: the Plus gate.** After the free tries in this book, Read together shows the Plus gate with a plain note that every letter stays readable and playable in the Book. Buying needs StoreKit and Apple's store view, which do not exist on web, so the gate says Plus is not available on this device. | J11-04 | [png](screens/J11-05.png) |
| J11-06 | happy | **Not now returns to the Book.** Declining closes the gate; nothing is lost or locked. | J11-05 | [png](screens/J11-06.png) [full](screens/J11-06-full.png) |
| J11-07 | unhappy | **Read together with no letters.** With no letters in the book, Read together says so and offers Close. The Book hides the button until a letter is in the book, so this is reached only by a stale link. | J11-01 | [png](screens/J11-07.png) |

## J12 Plus: the Plan screen and restore

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J12-01 | happy | **Plan: Plus is off.** The Plan screen says plainly what is free forever (writing, reading, playing recordings, export, writing with a co-parent) and what Plus adds (Read together after 3 free tries per book, books for more children). Apple handles payment; no card details are seen. There is no Buy button on web: the page says Plus is not available on this device (StoreKit exists only in the iOS app). | J11-05 | [png](screens/J12-01.png) |
| J12-02 | unhappy | **Restore purchases cannot reach the App Store.** Restore asks StoreKit. With no store (web) the app answers calmly that the App Store could not be reached and to try again. On a phone with no Plus purchase it would say none was found. | J12-01 | [png](screens/J12-02.png) |

## J13 Reminders

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J13-01 | happy | **Reminders, off.** One switch and one plain line: a gentle nudge a few evenings a week, never late at night. Nothing is asked of the phone until the switch is turned on. | J12-01 | [png](screens/J13-01.png) |
| J13-02 | unhappy | **On, but notifications are not allowed.** With the switch on and the phone's notification permission not granted, the screen explains it and offers "Open Settings" (native; it does nothing on web). The choices below stay editable. On iOS, the first time, a priming sheet comes before the iOS alert; the web build has no notification permission, so it skips straight to this state. | J13-01 | [png](screens/J13-02.png) [full](screens/J13-02-full.png) |
| J13-03 | happy | **Every evening.** Choosing a cadence updates the evenings and the time (7 AM to 9:30 PM; quiet on a day already written). The time picker is a native control and does not open on web. | J13-02 | [png](screens/J13-03.png) [full](screens/J13-03-full.png) |

## J14 Recordings and spoken language

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J14-01 | happy | **Recordings.** Where the voice lives: on this phone and in the iPhone's own backup, and how transcription works (tidying, or word for word). The language row shows the speech model for English as not on this phone, 575 MB (it is downloaded natively; on web there is no model). | J13-01 | [png](screens/J14-01.png) |

## J15 Export

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J15-01 | happy | **Export your book.** What is inside (every letter as text, every recording, a printable book per child, a data file with the words as heard, every tidy-up and the final text) and that nothing is sent anywhere. (Seeded fictional family Asha.) | J14-01 | [png](screens/J15-01.png) |
| J15-02 | unhappy | **The export did not finish.** On a phone Export builds a ZIP in the cache and opens the iOS share sheet. The web build has no file system, so it lands on the honest failure card with "Export again". The card says the phone needs more free space (the web has none to give). | J15-01 | [png](screens/J15-02.png) |
| J15-03 | unhappy | **Export with an empty book.** Nothing has been written yet, so "Export everything" is switched off (greyed) and the page still says what an export would hold. There is no empty-export error to reach. | J15-01 | [png](screens/J15-03.png) |

## J16 Settings, privacy, appearance, help, licences

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J16-01 | happy | **Settings.** Every destination one tap away: Plan, children, spoken language, reminders, appearance, privacy, export, recordings, storage, help, legal, licences and version. No Account or Delete account rows in v1.0, since there are no accounts. An "early version" note stays at the top. | J15-02 | [png](screens/J16-01.png) [full](screens/J16-01-full.png) |
| J16-02 | happy | **Privacy.** The usage-and-crash-report switch (off until the person says yes), what is never done (ads, selling data, training models), and links to the full policies. | J16-01 | [png](screens/J16-02.png) |
| J16-03 | happy | **Appearance.** Theme (Match this phone, Light, Dark) and reading size with a live sample line. | J16-02 | [png](screens/J16-03.png) |
| J16-04 | happy | **Large print reading size.** The sample line grows to the largest size. | J16-03 | [png](screens/J16-04.png) |
| J16-05 | happy | **If you are struggling.** Always available, never behind a flag: free confidential lines with how to reach them. Opens in place. | J16-04 | [png](screens/J16-05.png) [full](screens/J16-05-full.png) |
| J16-06 | happy | **Licences.** Open-source and model licences listed in place. | J16-05 | [png](screens/J16-06.png) [full](screens/J16-06-full.png) |

## J17 Family: co-parent sharing is coming soon

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J17-01 | happy | **Family tab: coming soon.** The tab keeps its place and describes what is coming (one book, two voices; each from their own phone; private to the family) with a promise that every letter stays on this phone until then. There is no invite flow in v1.0. | J16-01 | [png](screens/J17-01.png) [full](screens/J17-01-full.png) |
| J17-02 | happy | **Tell me when it's here.** The one action stores a local "tell me" flag and thanks the person. Nothing is sent anywhere. | J17-01 | [png](screens/J17-02.png) [full](screens/J17-02-full.png) |
| J17-03 | happy | **From a child's settings.** The "Write this book together: Soon" row opens the same coming-soon sheet, with Close. | J17-02 | [png](screens/J17-03.png) [full](screens/J17-03-full.png) |
| J17-04 | unhappy | **I was invited, but invites are not open yet.** Someone who was invited sees the same coming-soon sheet instead of an invite screen: they can write their own book now and the shared book comes later. | J01-03 | [png](screens/J17-04.png) [full](screens/J17-04-full.png) |

## J18 Dark mode

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J18-01 | happy | **Appearance: Dark.** Theme is per phone: Match this phone, Light or Dark. Choosing Dark re-themes every screen at once (the app supports dark mode). | J16-03 | [png](screens/J18-01.png) |
| J18-02 | happy | **Tonight, dark.** The home tab in the dark theme. | J18-01 | [png](screens/J18-02.png) |
| J18-03 | happy | **Book, dark.** Chapters and cards in the dark theme. | J18-02 | [png](screens/J18-03.png) [full](screens/J18-03-full.png) |
| J18-04 | happy | **A letter, dark.** The letter page in the dark theme. | J18-03 | [png](screens/J18-04.png) |
| J18-05 | happy | **Review, dark.** Review with its underlined tidy-ups in the dark theme. | J18-04 | [png](screens/J18-05.png) [full](screens/J18-05-full.png) |
| J18-06 | happy | **Listening, dark.** The listening screen in the dark theme. (Fake microphone tone on web.) | J18-05 | [png](screens/J18-06.png) |

## J19 Errors: unknown route

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J19-01 | unhappy | **Unknown route (404).** A designed not-found screen in the product voice replaces Expo Router's "Unmatched Route" page. It never shows the address, and has one way back: Back to Tonight. Reached by a malformed or old link. | J00-open | [png](screens/J19-01.png) |
| J19-02 | unhappy | **Listen opened without a tap.** Opened by a link, a restored screen or a stale route (not by Speak), Listen waits: "Nothing is recording yet. Tap Start when you want to speak." The microphone is not touched. On a phone the scribe://listen link goes to Tonight instead. | J19-01 | [png](screens/J19-02.png) |

## J20 Crash (fault injected)

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J20-01 | unhappy | **A screen crashes (fault injected).** The root error boundary shows a calm screen instead of a blank page: "Something went wrong on our side. Your letters and recordings are safe on this phone." with Try again and Go to Tonight. No error text, code or stack is shown or logged. Reached only by injecting a fault (Intl.PluralRules made to throw before opening Review); no normal action gets here. | J19-01 | [png](screens/J20-01.png) |
| J20-02 | unhappy | **The book cannot be opened (fault injected).** If opening the database or updating it throws, a recovery screen replaces the app: the letters are safe on the phone, nothing is removed, and there are two actions: Try again and Export what's readable. No delete, reset or rebuild exists here. Reached only by a preview-only switch (?fault=launch-once); on a phone it follows a failed database open or update. | J20-01 | [png](screens/J20-02.png) |

## Not capturable on web

These exist in the iOS app and could not be shown by the web build. Where a closest honest state was captured, the step note says so.

- **Native permission alerts** (microphone, notifications): iOS shows its own alert; Chromium auto-grants the fake microphone. Mic denied is simulated by refusing `getUserMedia` (J05-04).
- **Real speech and level metering**: the browser's fake microphone is a steady tone, there is no speech model and no level meter, so recordings never get words on web (Review stays on "Writing down what you said") and the "still here" quiet line is not reliable. Review with words (J06) uses the seeded family Asha. A silent recording, a recording where nobody spoke and a transcription failure are shown only through seeded data (J09-05, J10-10) or not at all.
- **Audio playback** ("Hear it", the letter player, Read together voices, autoplay): native audio; the players render but playback is not exercised.
- **Alert dialogs**: "Let it go" (discard a recording), "Hide this book", "Cancel invite" use native `Alert`, which does nothing on web.
- **Native pickers**: birthday and due date (including the 305-day limit and no future birthday) and the reminder time are iOS pickers; web shows a date pill or nothing. Future-date and very-old-date validation could not be driven.
- **StoreKit**: buying, the Apple store view, Manage subscription, restore success, trial, grace and an active Plus state. Web shows Plus as not available on this device (J03-08, J11-05, J12).
- **Add a child form** (empty name error, long name): it sits behind the Plus gate for a second book, which cannot be passed without StoreKit. The empty-name and long-name rules are shown in first run instead (J01-05, J01-06).
- **Notifications**: the priming sheet, the schedule, delivery and tapping a reminder. Web lands on the "notifications are off" state (J13-02).
- **Export success**: building the ZIP and the iOS share sheet need the file system; web shows the failure card (J15-02).
- **Spoken language and Storage settings screens, language pack downloads**: these use `expo-file-system`, which throws on web (`this.validatePath is not a function`) and leaves a blank page, so they are not captured. The language picker sheet in first run (J01-12) and the Recordings screen (J14-01) are.
- **Sharing sheets and external links**: Terms, Privacy Policy and the Help mail open Safari or Mail.
- **Haptics, VoiceOver announcements, Dynamic Type, Large Content Viewer, keyboard autocorrect.**
- **Interruptions and recovery**: a phone call or Siri during recording, the app going to the background, a kill mid-recording and the launch sweep that keeps stray takes.
- **iOS chrome**: status bar, Dynamic Island, home indicator and real safe areas (web insets are 0; see `safeArea` in each step).
- **Accounts, sign-in, sync, invites, delete account**: off by design in v1.0 (`EXPO_PUBLIC_SERVER_FEATURES=off`); the screens exist in the code but are not offered. Co-parent entry points show "coming soon" (J17).
- **Real family data**: never used; only the fictional family Asha.
