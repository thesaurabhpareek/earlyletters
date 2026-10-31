# Early Letters v1.0: customer journey, as the app really renders it

Generated from the web end-to-end flows (`apps/mobile/e2e-web/*.flow.ts`) by `apps/mobile/e2e-web/support/build-index.mjs`, which reads `steps/*.json` only. The flows drive the real app, exported for web in three builds (`apps/mobile/e2e-web/support/global-setup.ts`), in Chromium emulating an iPhone 17 Pro (402 x 874 CSS px at 3x). Nothing here is a mock-up: every screen is a screenshot of the running app, and `text` in each step JSON is the visible text read from the page.

- Builds, and which journeys use which:
  - **Server features off**, a clean phone (`EXPO_PUBLIC_SERVER_FEATURES=off`: on this phone only, no accounts, no sync). J01, J02, J03, J05 and J07 run entirely on it; other journeys begin some of their steps with a first run on it.
  - **Server features off, seeded** (`EXPO_PUBLIC_WEB_PREVIEW=1`, `?seed=asha`): the fictional family Asha with letters filled in, because the web build has no speech model and cannot produce words from a recording. J04, J06 and J08 to J20 use it. They are the real screens with data filled in.
  - **Server features on, against a mock server** (`apps/mobile/e2e-web/support/mock-server.ts`: no real server, no real email, no real Apple account). J21, J22, and the Account step of J16.
- Journeys: **22**, steps: **203** (happy 142, unhappy 61), screenshots: **203**, plus **26** full-length captures of scrolling screens (`<id>-full.png`).
- Files: `steps/<id>.json` (id, journey, kind, title, note, from, route, viewport, safeArea, scrolls, text, lines) and this index are tracked. `screens/<id>.png`, `screens/<id>-full.png` and the PDF are generated output and are not committed: the Screen links below resolve after a local run or inside the packed zip (`apps/mobile/e2e-web/support/pack-journey.sh`), not on GitHub. See `README.md` next to this file.
- Regenerate: not by hand on a feature branch. `README.md` has the safe procedure: a fresh web export, `JOURNEY_SHOTS=1`, `steps/` removed first. This generator refuses to write when a step has no screenshot, and only the journey-record pull request commits `steps/` and this index. `npm run e2e:web:pack -w @scribe/mobile` zips the record, screens and PDF into one artifact.
- Safe areas: a browser applies 0 to the top and bottom insets. Each step records `safeArea.appliedOnWeb` and the iPhone 17 Pro nominal insets (top 62, bottom 34) the device frame should keep clear.

## J01 First run: age question, promise, child, signature, first letter

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J00-open | happy | **The first thing anyone sees: one plain question.** The same neutral question for everyone, in the launch screen's lit room, with nothing preselected (LEGAL-REQ-002, PRD-REQ-019). |  | [png](screens/J00-open.png) |
| J01-01 | happy | **The age question.** The first screen is the launch screen's room: the lamp, the opening quotation pair and one neutral question, with nothing preselected. Continue waits, drawn as an outline, until the person picks Yes or No. | J00-open | [png](screens/J01-01.png) |
| J01-02 | happy | **Yes is chosen.** The person taps Yes. It fills softly with a check, and Continue turns on. Only a yes/no flag is stored on the phone, never an age. | J01-01 | [png](screens/J01-02.png) |
| J01-03 | happy | **Welcome.** The light rises from the gate: the stacked lockup, one serif line of what the book is, one line about the voice, and "Your first two letters are free." (D-082). One button: Begin the book. ("I already have a book" and "I was invited" sit under it in builds with sign-in; this build has server features off, so both are hidden.) | J01-02 | [png](screens/J01-03.png) |
| J01-04 | happy | **The promise.** One promise and one sample: "Exactly as you said it." over a sentence the engine has fixed, with its two small fixes struck through the Review way. The voice is kept on this phone, and the book is private by default. | J01-03 | [png](screens/J01-04.png) |
| J01-05 | unhappy | **Child step with no name.** Nothing typed yet. Continue waits, and a quiet line above it says why: "Add a name to continue." The book cover beside the heading is blank. An empty name can never be saved. | J01-04 | [png](screens/J01-05.png) |
| J01-06 | unhappy | **A very long name stops at 60 characters, and says so.** The person pastes 90 letters. The field keeps the first 60 and a quiet line explains the limit, so nothing is cut without a word. The cover sets the name in three lines and fades it, never an ellipsis. | J01-05 | [png](screens/J01-06.png) |
| J01-07 | unhappy | **Name entered, no birthday chosen yet.** The cover takes the name as typed. The date block arrives with the first letter, empty: on a phone it says "Choose a date", and "Born today" is a chip beside it. Continue waits, with a line saying what is needed. A seven-month-old can no longer be saved as "0 days" by an unseen default. | J01-05 | [png](screens/J01-07.png) |
| J01-08 | unhappy | **A birthday in the future.** On the web the date can be typed; a day after today is refused in words (on a phone the picker simply does not offer it). | J01-05 | [png](screens/J01-08.png) |
| J01-09 | happy | **An older baby: the birthday is chosen.** The person picks the real birthday (about seven months ago). Continue turns on. Letters will be filed by the baby's true age. | J01-05 | [png](screens/J01-09.png) |
| J01-10 | unhappy | **Not born yet: due date not chosen.** Choosing "Not here yet" turns the date into a due date, which is not filled in either. Continue waits and says why. | J01-09 | [png](screens/J01-10.png) |
| J01-11 | unhappy | **A due date too far ahead.** A due date can be at most 305 days away, the same range the phone picker offers. | J01-10 | [png](screens/J01-11.png) |
| J01-12 | unhappy | **A second name left empty.** Twins or more: a second row ("Another child's name") and a second cover fanned behind the first. An empty second field keeps Continue waiting, and the line says to fill it in or remove it. | J01-07 | [png](screens/J01-12.png) |
| J01-13 | happy | **What does Asha call you?.** The name the child will call this parent, which signs every letter. The cover from the last step waits at the top right for its signature. Sign my letters waits until something is chosen or typed. | J01-07 | [png](screens/J01-13.png) |
| J01-14 | happy | **Signature chosen.** Tapping a suggestion fills the field and signs the cover: "From Mama" on its foot line, the one preview of the signature. | J01-13 | [png](screens/J01-14.png) |
| J01-15 | happy | **Choose the spoken language.** A sheet lists the seven languages letters can be spoken in, each in its own script, with one check. Choosing one only stores it: nothing downloads from this sheet (D-087). | J01-14 | [png](screens/J01-15.png) |
| J01-16 | happy | **The book is open, and one ask about the speech download.** The cover opens to its flyleaf, signed "From Mama", and the light comes up. One line, then one quiet card: "Get your words ready", the real size for this phone, a bordered "Download on Wi-Fi" and "Not now". The one filled button is "Write the first one". Nothing downloads until the person taps. The download itself is native and cannot run on web; on a phone this needs a real iPhone check. | J01-15 | [png](screens/J01-16.png) |
| J01-17 | happy | **Not now is a calm answer.** The card folds to one line: "Your voice is kept either way." The first Review will offer the same button if words are waiting. | J01-16 | [png](screens/J01-17.png) |
| J01-18 | happy | **Tonight, for the first time.** The home tab: a greeting with the signature name, one gentle prompt, Speak and Type side by side, and "Not much today" for quiet days. | J01-17 | [png](screens/J01-18.png) |

## J02 Under 18: the stop screen and the way back

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J02-01 | unhappy | **No is chosen.** The person says they are under 18. Nothing else is asked, and the room does not change: the same light, the same mark. | J01-01 | [png](screens/J02-01.png) |
| J02-02 | unhappy | **The stop screen.** One line in the same lit room: the app is currently for adults 18 and over. No way to continue or go back. No child, letter or recording exists; only the time of the No is stored. | J02-01 | [png](screens/J02-02.png) |
| J02-03 | unhappy | **Reopening the app: still stopped.** Relaunching shows the same stop line. The answer cannot be retried by restarting. | J02-02 | [png](screens/J02-03.png) |
| J02-04 | unhappy | **After 24 hours: "I answered by mistake".** Only once a day has passed does the stop screen offer a way back, one quiet pill under the line. (Browser clock moved forward 25 hours; the logic is the app's own.) | J02-03 | [png](screens/J02-04.png) |
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
| J03-07 | happy | **One child's settings.** Name, date, signature, a reminders switch, and the co-parent row ("Coming soon"). The "Family can read" switch is hidden in v1.0 because it cannot be turned on. "Hide this book" is offered because there is more than one, in the plain text colour: nothing is deleted (its confirm dialog is native and does not appear on web). | J03-06 | [png](screens/J03-07.png) |
| J03-08 | happy | **Another book is free.** Starting a book for another child opens the same step as first run, with no Plus gate (D-082, D-083): the first two letters are one pool across every book, and the gate is at Keep, not here. Nothing is chosen for the person: "Add this book" waits, and the line above it says why. | J03-07 | [png](screens/J03-08.png) |
| J03-09 | happy | **Add a child starts with no date.** The birthday starts empty, so a seven-month-old is never saved as a newborn by a default nobody saw. "Born today" is a chip beside the date, one tap. The small book cover takes the name. | J03-08 | [png](screens/J03-09.png) |
| J03-10 | happy | **Back to Settings.** Leaving the page adds nothing and goes back. | J03-09 | [png](screens/J03-10.png) [full](screens/J03-10-full.png) |
| J03-20 | happy | **Child settings: every detail row opens.** Name, birthday and "Sign my letters to Asha as" each open to change. Before this they were read-only. | J03-07 | [png](screens/J03-20.png) |
| J03-21 | unhappy | **An empty name.** Save stays off and a line says why: "Add a name to save." A book can never lose its name. | J03-20 | [png](screens/J03-21.png) |
| J03-22 | unhappy | **A very long name.** The field stops at 60 and says so softly; nothing is cut without a word. | J03-21 | [png](screens/J03-22.png) |
| J03-23 | happy | **Name changed (trimmed).** The new name shows in the row and in the title. Letters already written are not touched. | J03-22 | [png](screens/J03-23.png) |
| J03-24 | unhappy | **An empty signature.** Save stays off with a line saying what is missing. | J03-23 | [png](screens/J03-24.png) |
| J03-25 | happy | **Signature changed.** New letters are signed Papa. Letters already written keep the signature they were written with. | J03-24 | [png](screens/J03-25.png) |
| J03-26 | unhappy | **A birthday in the future.** Refused in words; Save stays off. | J03-25 | [png](screens/J03-26.png) |
| J03-27 | happy | **Birthday corrected.** A baby who was saved as born today is now about seven months old; letters are filed by the true age from here on. | J03-26 | [png](screens/J03-27.png) |
| J03-30 | happy | **Before the due date: no offer.** While the due date is still ahead, settings show the due date and nothing else is asked. | J03-07 | [png](screens/J03-30.png) |
| J03-31 | happy | **After the due date: a gentle card.** One quiet card: "Asha's birthday. Add it when you are ready." with "Set the birthday" and "Hide". A passed due date can be hard news, so it never says Asha was born, never celebrates and never counts days. It is never a notification and never on Tonight. | J03-30 | [png](screens/J03-31.png) |
| J03-32 | happy | **The card, hidden.** "Hide" puts the card away on this phone until the Due date row is opened again. | J03-31 | [png](screens/J03-32.png) |
| J03-33 | unhappy | **A birthday that has not come yet.** Refused in words; the button stays off. Letters written before the birthday stay in Before You. | J03-32 | [png](screens/J03-33.png) |
| J03-34 | happy | **Birthday set.** The due date is replaced by the birthday; the card is gone. The child and every letter keep their place. | J03-33 | [png](screens/J03-34.png) |
| J03-40 | happy | **Hidden books.** Each book hidden on this phone, with "Show this book again". Nothing is deleted by hiding, and nothing here deletes. | J03-07 | [png](screens/J03-40.png) |
| J03-41 | happy | **The book is back.** Avi's book is back on this phone, as it was. With no book hidden, the page says "No hidden books." | J03-40 | [png](screens/J03-41.png) |

## J04 Tonight, prompts, and the usage-sharing ask

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J04-01 | happy | **Tonight with a letter waiting.** One question: the prompt, large, on the lamp-lit paper. Under it, the recording waiting on Review has its own card: the day it was made and its length, the first words as spoken, and "Read it back". (Seeded fictional family Asha, 7 months.) | J01-14 | [png](screens/J04-01.png) |
| J04-02 | happy | **Another thought.** The prompt leaves and a different one rises in its place. There is no limit and nothing is counted. | J04-01 | [png](screens/J04-02.png) |
| J04-03 | happy | **Tonight on day 0.** A new book: the dateline reads "Asha, 0 days", no card, one prompt chosen for a newborn. | J04-02 | [png](screens/J04-03.png) |
| J04-04 | happy | **A later session: no usage-sharing ask.** v1.0 collects no data (D-088, "Data Not Collected"), so the "Help us make it better?" sheet never appears and Settings, Privacy has no usage switch. Analytics returns with consent in v1.1. | J04-02 | [png](screens/J04-04.png) |
| J04-05 | happy | **Two takes after a relaunch.** Both recordings are on Tonight, each on its own card with its day and length, newest first, and "Open". Nothing says how many. (The web build has no speech model, so the words have not come yet; a phone writes them down. A browser keeps a take only in memory, so this flow does not open one after the reload; on a phone the file is on disk.) | J04-03 | [png](screens/J04-05.png) |
| J04-06 | unhappy | **A typed letter left mid-sentence.** Closing keeps the words. Tonight shows them on their own card, newest first, with "Pick it up"; the recording waiting on Review keeps its card below (J07-05). | J04-01 | [png](screens/J04-06.png) |
| J04-07 | happy | **Picking it up.** The page reopens with the words exactly as left. | J04-06 | [png](screens/J04-07.png) |
| J04-08 | happy | **The held letter on Tonight.** The Keep sheet said the letter waits on Tonight, and it does: its own card, with the words as typed, says "Waiting to be kept." and "Keep it". | J04-01 | [png](screens/J04-08.png) |
| J04-09 | happy | **Tonight before the birth.** The dateline reads "Asha", the dot, "Before You", the words Review uses for these letters. The prompt is one of eight written for the weeks of waiting (the name, the home, what is hoped for), not a question about hands or the first day home. (A due date 60 days ahead, no birthday.) | J04-02 | [png](screens/J04-09.png) |
| J04-10 | happy | **Another thought, before the birth.** Fourteen presses: each shows a different prompt from the eight, never the one that was on screen, and never a newborn one. Nothing is counted. | J04-09 | [png](screens/J04-10.png) |

## J05 Speaking a letter: listening, pause, mic denied, offline, very short, long

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J05-01 | happy | **Listening.** Full-screen and calm: who it is to, "Only you, until you add it to the book", a running clock and a glow that moves with the voice. Microphone permission was granted (on a phone iOS asks once, in its own alert, which a browser cannot show). | J04-03 | [png](screens/J05-01.png) |
| J05-02 | happy | **Paused.** Pause stops the clock and the glow. Keep talking continues the same recording. | J05-01 | [png](screens/J05-02.png) |
| J05-03 | happy | **Finished: Review opens at once.** The take is kept first, then Review opens. It says it is writing down what was said. The web build records with the browser's fake microphone (a steady tone) and has no speech model, so the words never arrive; the real app writes them down on the phone. | J05-02 | [png](screens/J05-03.png) |
| J05-04 | unhappy | **Microphone is off.** One calm state with the microphone glyph: "The microphone is off". Type instead first, Open Settings quiet, Close at the top right. Only a refused permission lands here (S13). The browser denial is simulated by refusing getUserMedia; on a phone it is iOS's permission state, and "Open Settings" is native and does nothing on web. | J05-01 | [png](screens/J05-04.png) |
| J05-05 | happy | **Typing instead.** The person lands on the Write page for the same prompt. | J05-04 | [png](screens/J05-05.png) |
| J05-06 | unhappy | **Listening with no connection.** The device is offline. Nothing changes: recording, words and the book are all on the phone, and there is no "offline" banner anywhere in v1.0. The web build records with the browser's fake microphone (a steady tone) and has no speech model, so the words never arrive; the real app writes them down on the phone. | J05-01 | [png](screens/J05-06.png) |
| J05-07 | unhappy | **Review with no connection.** Review opens as usual; nothing waits on the network. | J05-06 | [png](screens/J05-07.png) |
| J05-08 | unhappy | **Finished at once.** Finish tapped straight after starting. The app keeps whatever was captured and opens Review; it does not refuse a short or empty take. The web build records with the browser's fake microphone (a steady tone) and has no speech model, so the words never arrive; the real app writes them down on the phone. | J05-01 | [png](screens/J05-08.png) |
| J05-09 | happy | **Over a minute in.** The clock keeps counting with no limit (here past a minute). If the level stays below speaking level for 8 seconds the line under the clock becomes a gentle "still here" (on web the fake microphone and the missing level meter make that unreliable, so it is not asserted). On a phone the elapsed time is announced to VoiceOver once a minute. | J05-01 | [png](screens/J05-09.png) |
| J05-10 | unhappy | **The microphone is in use.** A start that fails while permission is granted names the real cause: "The microphone is in use. A call or another app has it right now." Try again first, Type instead quiet. It never says the microphone is off, which Settings could not fix (S13). | J05-01 | [png](screens/J05-10.png) |
| J05-11 | happy | **Read it back later.** The moon breathes over "Writing down what you said." and the recording's length. After 8 seconds one line says long recordings take a little more time; after 15 seconds with no progress a quiet "Read it back later" appears (S14). The web build records with the browser's fake microphone (a steady tone) and has no speech model, so the words never arrive; the real app writes them down on the phone. | J05-03 | [png](screens/J05-11.png) |
| J05-12 | happy | **Back on Tonight, waiting for its words.** Review closes and the queue carries on. Tonight shows the recording as a card waiting for its words, with Open. | J05-11 | [png](screens/J05-12.png) |

## J06 Review: small fixes, put back, word for word, change words, save or keep private

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J06-01 | happy | **Review, with a first-time note.** The letter on a sheet with its header, "TO ASHA · MONTH N" and "FROM MAMA", each small fix marked in the words, in the letter's own face (taken-out words struck through, a name spelled your way shown after the word heard), the fixes behind one row (open from the start while a screen reader is on, which the web build always reports), and the registered one-time note. No reassurance line under the title (S17). Words come from the seeded fictional family Asha (the web build has no speech model, so a real recording never gets words). | J05-03 | [png](screens/J06-01.png) [full](screens/J06-01-full.png) |
| J06-02 | happy | **First note dismissed.** "Got it" collapses the note for good. | J06-01 | [png](screens/J06-02.png) |
| J06-03 | happy | **Why was this changed?.** Tapping a mark in the letter, or its row behind "N small fixes", opens a card under the mark's own line: what kind of fix it was, the exact words said and how it reads now, and an offer to put it back. | J06-02 | [png](screens/J06-03.png) [full](screens/J06-03-full.png) |
| J06-04 | happy | **Put back.** The original words return, marked for a moment, with Undo beside them. | J06-03 | [png](screens/J06-04.png) |
| J06-05 | happy | **Undo the put-back.** Undo re-applies the small fix. Every edit is reversible both ways. | J06-04 | [png](screens/J06-05.png) |
| J06-06 | happy | **Exactly as said.** One tap shows the words exactly as spoken, with their "um" and repeats; the screen says so. This is the view and the choice for this letter, until it is saved. | J06-05 | [png](screens/J06-06.png) |
| J06-07 | happy | **Back to small fixes.** The same control returns to the words with each small fix marked. Every choice is reversible both ways. | J06-06 | [png](screens/J06-07.png) |
| J06-08 | happy | **Change words.** The person may change any word themselves, in place on the same sheet: no box inside the letter, the sheet's edge turns to the accent line, and Done sits in the header (S18). | J06-07 | [png](screens/J06-08.png) |
| J06-09 | happy | **Saved: kept in its month.** The save commits first, then the sheet files into its month: "Kept in Month N" under it and "Added to Asha's book." with a check, never ghosted words (S21). | J06-08 | [png](screens/J06-09.png) |
| J06-10 | happy | **On the Book, on the new letter.** Review dissolves onto the Book, which is already on the new letter under its month, with the arrival wash. Tonight is never seen in between (5.8 row 5). | J06-09 | [png](screens/J06-10.png) [full](screens/J06-10-full.png) |
| J06-11 | happy | **Kept private.** The letter is saved outside the book, with the lock chip "Kept just for you.", then lands on the Book with its Private chip, as a kept letter does (S21). | J06-02 | [png](screens/J06-11.png) |
| J06-12 | unhappy | **Close without saving.** Closing leaves the draft where it was: its card is still on Tonight with "Read it back". Nothing is deleted. ("Let it go", the only delete, is a native confirm dialog that does not appear on web.) | J06-02 | [png](screens/J06-12.png) |
| J06-13 | unhappy | **Review with no draft.** Opened by a stale link with nothing to read back: the page drawing, "Nothing to read back here", one way on, "Go to the book", and Close. No error, nothing to try again (S23). | J06-01 | [png](screens/J06-13.png) |
| J06-14 | unhappy | **Keep needs Plus.** Pressing Keep after the first two letters opens one calm sheet: "Keep adding to Asha's book", that the first two letters are kept and always will be, that this letter is safe on the phone, and a way to start Plus. No price, no trial length and no countdown (Apple's own sheet shows those). Nothing was saved yet. On web there is no StoreKit, so the sheet says Plus is not available on this device and has no "See Plus" or "Redeem a code" button. NEEDS A REAL IPHONE: See Plus, Redeem a code, Ask to Buy, offline. | J06-02 | [png](screens/J06-14.png) |
| J06-15 | happy | **Kept here for now.** The letter stays a draft, marked held: its card on Tonight says "Waiting to be kept." with the words exactly as they were and "Keep it". It can be played, read and exported from there, and kept once Plus is on (5.8 row 5c). | J06-14 | [png](screens/J06-15.png) |

## J07 Typing a letter: write, autosave, draft, review, save

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J07-01 | happy | **Write, empty.** A page under the still write lamp, not a form: the child's name and age, the prompt as the literary line, and a blank letter. "Add to Asha's book" and "Keep private" wait above the keyboard, off until something is typed (S19). | J01-14 | [png](screens/J07-01.png) |
| J07-02 | happy | **Typing, autosaved.** After a pause "Saved on this phone" appears and stays. Every pause saves a local draft, so a closed sheet or a crash loses nothing. | J07-01 | [png](screens/J07-02.png) |
| J07-03 | happy | **Saved to the book, no Review.** One tap keeps a typed letter: no "Read it back" screen. The Keep step runs exactly as for a spoken letter, then the letter files into its month (S20, S21). | J07-02 | [png](screens/J07-03.png) |
| J07-04 | happy | **On the Book.** The person lands on the Book, on the new letter in its month (5.8 row 5a). | J07-03 | [png](screens/J07-04.png) |
| J07-05 | unhappy | **Closed before finishing.** Closing keeps the words as a draft. Tonight now shows its card with the first words and "Pick it up". | J07-01 | [png](screens/J07-05.png) |
| J07-06 | happy | **Picking the draft back up.** Tapping the card reopens the page with the words exactly as left. | J07-05 | [png](screens/J07-06.png) |
| J07-07 | happy | **Kept private.** Keep private, from Write, keeps the letter outside the book with the lock chip, then lands on the Book with its Private chip. It can be added to the book later. | J07-03 | [png](screens/J07-07.png) |
| J07-08 | happy | **The second free letter.** The second letter is kept like the first. "That was your second free letter." shows once, as the Book's toast after the landing, with no count of what is left (D-082, S21). | J07-04 | [png](screens/J07-08.png) |
| J07-09 | unhappy | **The third letter is held.** The third Keep, from Write, opens the Plus sheet instead of saving. The typed words are still on the phone as a draft; nothing was lost. (Plus itself needs a real iPhone: Apple's store view does not exist on web.) | J07-08 | [png](screens/J07-09.png) |
| J07-10 | happy | **The held letter waits on Tonight.** Tonight shows the waiting letter with its words as typed (5.8 row 5c). | J07-09 | [png](screens/J07-10.png) |

## J08 A quiet day: "Not much today"

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J08-01 | happy | **A day with little to say.** Under Speak and Type sits a quiet link: "Not much today". Its hint says "Marks today without writing anything." | J04-01 | [png](screens/J08-01.png) |
| J08-02 | happy | **Kept, with no guilt.** The link gives way to the Moon and one line, "A quiet day, kept.", with Undo beside it, and in the evening the lamp lowers to 70 percent: lights down. The app stores a mark for the day with no words at all: it never writes a sentence for the person. The mark is not counted as a letter. | J08-01 | [png](screens/J08-02.png) |
| J08-03 | happy | **A quiet day in the Book.** The Book shows one small row, "A quiet day", with the date: muted, unsigned, not a card and not a button into a letter. It is never counted, printed or read in Read together, and it hides on any day that has a letter. | J08-02 | [png](screens/J08-03.png) [full](screens/J08-03-full.png) |
| J08-04 | unhappy | **Undo on the kept line.** Undo takes the mark back at once: the quiet link returns, the lamp comes back up, and nothing is left behind. | J08-02 | [png](screens/J08-04.png) |
| J08-05 | happy | **An older quiet day, shown as a mark.** A "Not much today" saved by an older build holds a template sentence in the old row. The Book ignores that text and shows the same small "A quiet day" row; on a day that already has a letter no mark is listed. Counts say letters only. (Seeded fictional family Asha, with older-build rows.) | J08-03 | [png](screens/J08-05.png) [full](screens/J08-05-full.png) |
| J08-06 | unhappy | **Remove this mark, with Undo.** Long-press (or the VoiceOver action "Remove this mark") removes the mark and shows "Removed." with Undo, which stays until tapped or closed. | J08-05 | [png](screens/J08-06.png) [full](screens/J08-06-full.png) |

## J09 The Book: empty, one letter, many, waiting for words, nobody spoke

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J09-01 | happy | **An empty book.** The closed cover named and signed in first run, one plain sentence, one action: "Write a letter". No counts, no gaps, nothing to fill in. With one book there is no "For Asha" row: "Asha's book" already says the name. | J07-04 | [png](screens/J09-01.png) |
| J09-02 | happy | **One letter.** The first letter sits under its month, whose opener is lit: "THIS MONTH", the month, "1 letter · From Mama" and its dates. Read together appears once there is at least one letter in the book. | J09-01 | [png](screens/J09-02.png) |
| J09-03 | happy | **Many letters, by month.** Chapters by month of age, newest first, each opened by a kicker, a large numeral, "2 letters · From Mama" and the month's dates, with a hairline between chapters. The current month is lit and stands alone until a letter is kept in it. Each card shows the first words ending in a fade, the signature and a recording length; a private letter carries a "Private" mark. (Seeded fictional family Asha.) Full length capture shows every chapter. | J09-02 | [png](screens/J09-03.png) [full](screens/J09-03-full.png) |
| J09-04 | unhappy | **A voice-only letter waiting for words.** A kept recording whose words have not been written yet shows the app's own small note, with a microphone, instead of words; the card says why it waits beside its length while that is known. Nothing is lost; the recording is on the phone. | J09-03 | [png](screens/J09-04.png) [full](screens/J09-04-full.png) |
| J09-05 | unhappy | **A recording with no words.** A kept recording that came back with no words shows the app's own small note, "No words in this one. The recording is kept just as it is.", muted sans with a microphone: not in the letter's type and with no "From ..." signature under it. The recording may hold laughing or babble, so the note never says nobody spoke. It counts as a letter once kept. | J09-03 | [png](screens/J09-05.png) [full](screens/J09-05-full.png) |

## J10 A letter: original words, reading size, private, delete and undo, not found

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J10-01 | happy | **A letter, as a page.** The page opens in the card's own column: the same dateline and words, then the rest of the letter, signed "From Mama" in italic. One pill player, one provenance line ("Spoken, with small fixes. Recording kept on this phone."), "Exactly as said", and the actions below. No lamp: a voice plays here. (Seeded fictional family Asha; the seeded audio files do not exist, so the player is the closest honest state.) | J09-03 | [png](screens/J10-01.png) |
| J10-02 | happy | **Exactly as said.** The raw words replace the fixed ones, under an "Exactly what you said" label, cross-fading over 150 ms. | J10-01 | [png](screens/J10-02.png) |
| J10-03 | happy | **Reading size sheet.** A small "Aa" sheet changes the letter size live behind it: Standard, Large, Large print. | J10-02 | [png](screens/J10-03.png) |
| J10-04 | happy | **Large print.** The page re-sets at the largest size, cross-fading rather than animating the size. | J10-03 | [png](screens/J10-04.png) |
| J10-05 | happy | **Make private.** The letter leaves the book; a "Private" mark and a toast confirm it. Moving it back is one tap. | J10-04 | [png](screens/J10-05.png) |
| J10-06 | unhappy | **Delete asks first.** Delete opens a small sheet: "Delete this letter?", "It waits in Recently deleted for 30 days." The safe choice, "Keep it", is the large primary button and the default; "Delete letter" is the quiet red one with the Trash icon. No Close in its header: "Keep it" and a swipe down are the ways out. (D-085.) | J10-05 | [png](screens/J10-06.png) |
| J10-07 | unhappy | **Keep it.** Choosing "Keep it" closes the sheet and changes nothing: the letter is still on its page. | J10-06 | [png](screens/J10-07.png) |
| J10-08 | unhappy | **Deleted, with Undo.** After the confirm, the Book is back at once: the card goes back into its row and leaves it, and one toast above the tab bar says "Letter deleted." with Undo and Close. It has no timer; leaving the Book takes it away. The letter waits in Recently deleted for 30 days. | J10-07 | [png](screens/J10-08.png) [full](screens/J10-08-full.png) |
| J10-09 | happy | **Undo restores the letter.** The card is back in its place, exactly as it was, with a soft wash for a moment. | J10-08 | [png](screens/J10-09.png) [full](screens/J10-09-full.png) |
| J10-10 | unhappy | **A recording with no words.** The page shows the app's own small note instead of words, and no "From Mama" signature under it (the signature is only under words a person said); the recording is still there and can be kept, and "Write the words" opens the words sheet so the person can put the words with it. "Record again" is gone from this page: it started a separate letter. | J10-01 | [png](screens/J10-10.png) |
| J10-11 | unhappy | **Letter not found.** A letter that is not on this phone (a stale link) shows "This letter is not in the book" and one way back. Never the id or the route. If it is on the Recently deleted shelf, the page says so and opens the shelf. | J10-01 | [png](screens/J10-11.png) |
| J10-12 | happy | **Recently deleted.** Settings, Recently deleted lists the letter as a card: its first words in the letter face, ending in a fade, "From Mama", and one line: "Deleted October 13. Kept here until November 12." Then Restore and Erase now. No countdown and no count. (Seeded fictional family Asha.) | J10-01 | [png](screens/J10-12.png) |
| J10-13 | happy | **Restored.** Restore lifts the card out and puts the letter back in the book exactly as it was; the toast says "Back in Asha's book." with "Open". The shelf is empty: the page drawing and "No deleted letters.", with no repeated heading. | J10-12 | [png](screens/J10-13.png) |
| J10-14 | unhappy | **Erase now asks first.** Erase now ends the wait, after one question: "The letter and its recording are erased for good." "Keep it" is the default. | J10-13 | [png](screens/J10-14.png) |
| J10-15 | unhappy | **Erased.** The letter and its recording are gone for good, the shelf is empty, and the toast says "Letter erased." (it replaces any toast before it, so no "Back in Asha's book." is left showing). On a phone the recording file is removed first, then the row; the web preview has no recording files. | J10-14 | [png](screens/J10-15.png) |
| J10-16 | happy | **A typed letter.** Typed letters have the words and the signature, with "Typed" provenance, and no player or recording line. | J10-01 | [png](screens/J10-16.png) |
| J10-17 | unhappy | **A letter waiting for its words.** The page shows the app's own small, muted note instead of an empty page, with no signature under it, and "Write the words" opens the words sheet; the recording is there. | J10-01 | [png](screens/J10-17.png) |

## J11 Read together: free tries, the Plus gate, empty

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J11-01 | happy | **Read together, first letter.** Chrome-free, Large print by default: one letter at a time, oldest first. The dateline reads "The first weeks · From Mama" (VoiceOver: "The first weeks, from Mama"); a 2 pt hairline under the top bar shows how far along, never "1 / 5". A "Hear Mama" pill plays the recording on the phone. Read together is free for every letter that exists, with no session limit (D-082, D-083). (Seeded family Asha. Playback itself is native audio and is not exercised on web.) | J09-03 | [png](screens/J11-01.png) |
| J11-02 | happy | **Next letter.** Next letter turns the page sideways (24 pt, a fade, no curl); Back one turns it back, and a swipe does the same. The dateline names the month first, then who wrote it: "Month 2 · From Mama". | J11-01 | [png](screens/J11-02.png) |
| J11-03 | happy | **Keep playing.** A quiet chip under the player, a switch to VoiceOver: when a recording ends the page turns and the next voice starts. It is remembered next time. | J11-02 | [png](screens/J11-03.png) |
| J11-04 | happy | **The end of the book.** After the last letter: the moon draws on once above the line, then nothing moves; "Close the book" and "Read it again". | J11-03 | [png](screens/J11-04.png) |
| J11-05 | happy | **Opened again and again.** The fourth opening and every one after it are the same as the first: no Plus gate, nothing counted. Letters that exist are always readable and playable; membership only decides whether a new letter can be kept. | J11-04 | [png](screens/J11-05.png) [full](screens/J11-05-full.png) |
| J11-07 | unhappy | **Read together with no letters.** With no letters in the book, Read together says so, shows the moon, and offers "Write a letter" (to Tonight) as well as Close. The Book hides the button until a letter is in the book, so this is reached only by a stale link. | J11-01 | [png](screens/J11-07.png) |
| J11-08 | happy | **Read together skips quiet days.** A quiet-day mark is not a letter: it is never a page, never played and never read aloud, even a row an older build moved into the book. Only letters are pages. (Seeded fictional family Asha, with older-build rows.) | J11-01 | [png](screens/J11-08.png) |

## J12 Plus: the Plan screen and restore

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J12-01 | happy | **Plan: Plus is off.** An iOS Settings list. Section Plus: "See what Plus adds" (on web, where there is no StoreKit, the line "Plus is not available on this device yet." in its place), with the promise as the footer, once: every letter kept stays readable, playable and exportable. Then Restore purchases, and the payment line as the footer. No price, no trial length, no count of what is left; Apple's own sheet shows those. Manage subscription shows only once a subscription exists. NEEDS A REAL IPHONE: See what Plus adds, Redeem a code, Manage subscription, and the plan names "Plus Monthly" and "Plus Annual" (held for counsel; "Monthly" and "Yearly" until then). | J11-05 | [png](screens/J12-01.png) |
| J12-02 | unhappy | **Restore purchases cannot reach the App Store.** Restore asks StoreKit; while it checks, the row reads "Checking with the App Store". With no store (web) the answer shows under the row, with the warning mark: the App Store could not be reached, try again in a moment. On a phone with no Plus purchase it would say none was found. | J12-01 | [png](screens/J12-02.png) |

## J13 Reminders

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J13-01 | happy | **Reminders, off.** One switch and one plain line: a gentle nudge a few evenings a week, never late at night. Nothing is asked of the phone until the switch is turned on. | J12-01 | [png](screens/J13-01.png) |
| J13-02 | unhappy | **On, but notifications are not allowed.** With the switch on and the phone's notification permission not granted, a card with the warning mark says "Notifications are off" and offers "Open Settings" (native; it does nothing on web). The choices below stay editable. When the person comes back from Settings with notifications allowed, the card collapses and "Reminders are on." shows (a phone check). On iOS, the first time, a priming sheet comes before the iOS alert; the web build has no notification permission, so it skips straight to this state. There is one switch for reminders: no separate Pause. | J13-01 | [png](screens/J13-02.png) [full](screens/J13-02-full.png) |
| J13-03 | happy | **Every evening.** Choosing a cadence updates the evenings and the time (7 AM to 9:30 PM; quiet on a day already written). The time picker is a native control and does not open on web. | J13-02 | [png](screens/J13-03.png) [full](screens/J13-03-full.png) |

## J14 Recordings and spoken language

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J14-01 | happy | **Recordings.** Where the voice lives: on this phone and in the iPhone's own backup if there is one, said once. With backup in a build the card follows backup's state ("Kept on this phone and backed up" when it is on); those lines wait for counsel (C7), and build 2 has backup off. How transcription works: small fixes, marked, or word for word. The language row reads "English, Not on this phone, 575 MB"; on a phone it ends in "Download" (or "Remove" once it is here) and shows a small ring with "Getting ready, 40%" while it downloads. On web there is no model to fetch. | J13-01 | [png](screens/J14-01.png) |

## J15 Export

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J15-01 | happy | **Export your book.** The book's own cover at the top, so the person sees what they will get. A "Last export" row ("Not exported yet" until a copy has been prepared) with one plain nudge to save a copy in Files or iCloud Drive; no notifications and no reminder. What is inside, each with its glyph: every letter as text, every recording, a printable book per child, a data file with the words as heard, every small fix and the final text. The export is made on this phone and goes only where it is sent. (Seeded fictional family Asha.) | J14-01 | [png](screens/J15-01.png) |
| J15-02 | unhappy | **The export did not finish.** On a phone Export builds a ZIP in the cache and opens the iOS share sheet. The web build has no file system, so it lands on the honest failure card, with the warning mark, and "Export again". Every failure names its cause and has an action that can work: a book too big for one file leads to "Write to us" instead (a phone check). | J15-01 | [png](screens/J15-02.png) [full](screens/J15-02-full.png) |
| J15-03 | unhappy | **Export with an empty book.** Nothing has been written yet, so "Export everything" waits, in the outline style, under the line "You can export once the book has a letter." The page still says what an export would hold. There is no empty-export error to reach. | J15-01 | [png](screens/J15-03.png) [full](screens/J15-03-full.png) |

## J16 Settings, privacy, appearance, help, licences

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J16-01 | happy | **Settings.** Every destination one tap away: Plan, children, spoken language, reminders, appearance, privacy, export, Recently deleted, recordings, storage, help, If you are struggling, legal, Licenses and version. No Account or Delete account rows with server features off. The short privacy line is said once, under Your data, and the "Early version" note is About's footer, word for word, not the first thing on the page. | J15-02 | [png](screens/J16-01.png) [full](screens/J16-01-full.png) |
| J16-02 | happy | **Privacy.** No usage switch in v1.0 (it collects no data), what is never done (ads, selling data, training models), and links to the full policies. | J16-01 | [png](screens/J16-02.png) |
| J16-03 | happy | **Appearance.** Theme (Match this phone, Light, Dark) and reading size with a live sample line. | J16-02 | [png](screens/J16-03.png) |
| J16-04 | happy | **Large print reading size.** The sample line grows to the largest size. | J16-03 | [png](screens/J16-04.png) |
| J16-05 | happy | **If you are struggling.** Always available, never behind a flag, one tap from Settings: its own page with the three free, confidential lines (each row starts a call) and the 911 line, word for word. No drawing, no light, no motion. | J16-04 | [png](screens/J16-05.png) |
| J16-06 | happy | **Licenses.** Its own page: the speech models and icons, the language data word for word, then every bundled library, font and vendored file grouped by licence. A row opens its notice, one at a time. | J16-05 | [png](screens/J16-06.png) [full](screens/J16-06-full.png) |
| J16-20 | happy | **Settings, server features on.** With sign-in in the build, Account sits at the top of the first section (S40). Delete account, in its own section above Help, shows only once the person is signed in, so it is not here while signed out. The early-version note is still only under About. | J16-01 | [png](screens/J16-20.png) [full](screens/J16-20-full.png) |

## J17 Family: co-parent sharing is coming soon

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J17-01 | happy | **Family tab: coming soon.** The tab keeps its place and describes what is coming (one book, two voices; each from their own phone; private to the family) with a promise that every letter stays on this phone until then. With server features off there is no invite flow (J21 is the same app with them on). | J16-01 | [png](screens/J17-01.png) [full](screens/J17-01-full.png) |
| J17-02 | happy | **Tell me when it's here.** The one action stores a local "tell me" flag and says only what is true: "Noted on this phone. When the update arrives, you will see it here." Nothing is sent to us except a count of the tap. (The card on Tonight that fulfils the second sentence ships with co-parent sharing in v1.1.) | J17-01 | [png](screens/J17-02.png) [full](screens/J17-02-full.png) |
| J17-03 | happy | **From a child's settings.** The "Write this book together: Soon" row opens the same coming-soon sheet, with Close. | J17-02 | [png](screens/J17-03.png) [full](screens/J17-03-full.png) |
| J17-04 | happy | **No "I was invited" door.** No invite can exist without a server, so the button that could only open a coming-soon sheet is gone. It is back when server features are on (J21). An invite link that is opened still lands on the coming-soon sheet. | J01-03 | [png](screens/J17-04.png) |

## J18 Dark mode

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J18-01 | happy | **Appearance: Dark.** Theme is per phone: Match this phone, Light or Dark. Choosing Dark re-themes every screen at once, and the reading-size sample under it, the person's own newest words, takes the dark page too. | J16-03 | [png](screens/J18-01.png) |
| J18-02 | happy | **Tonight, dark.** Tonight at night: the dateline, the one question in the letter face, Speak and Type, and the card for the recording waiting on Review with "Read it back". (Seeded fictional family Asha.) | J18-01 | [png](screens/J18-02.png) |
| J18-03 | happy | **Book, dark.** The Book at night: each month opened by its kicker, numeral and dates, with the letters as cards under it, on the dark page. (Seeded fictional family Asha.) | J18-02 | [png](screens/J18-03.png) [full](screens/J18-03-full.png) |
| J18-04 | happy | **A letter, dark.** The letter page at night: the words in the letter face, signed "From Mama", the pill player ("Hear Mama" and its length), the provenance line and the actions. | J18-03 | [png](screens/J18-04.png) |
| J18-05 | happy | **Review, dark.** Review at night: the first-time note, the letter on its sheet with each small fix marked in the words (taken-out words struck through), the two views, the row of small fixes, and "Add to Asha's book". | J18-04 | [png](screens/J18-05.png) [full](screens/J18-05-full.png) |
| J18-06 | happy | **Listening, dark.** The listening screen at night. (Fake microphone tone on web.) | J18-05 | [png](screens/J18-06.png) |

## J19 Errors: unknown route

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J19-01 | unhappy | **Unknown route (404).** A designed not-found screen replaces Expo Router's "Unmatched Route" page: the shared state screen with the window drawing, "Nothing at this link" and "Your book is right where you left it.", inside 20 pt gutters, with Back to Tonight full width at the bottom. It never shows or logs the address. Reached by a malformed or old link. | J00-open | [png](screens/J19-01.png) |
| J19-02 | unhappy | **Listen opened without a tap.** Opened by a link, a restored screen or a stale route (not by Speak), Listen waits at rest: the red circle and "Tap the red circle and talk." (S12). The microphone is not touched until the circle is tapped. On a phone the scribe://listen link goes to Tonight instead. | J19-01 | [png](screens/J19-02.png) |

## J20 Crash (fault injected)

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J20-01 | unhappy | **A screen crashes (fault injected).** The root error boundary shows a calm screen instead of a blank page: a still page drawing, "This page did not open" in Literata and "Your letters and recordings are safe on this phone." in Mukta, with Try again and Go to Tonight as pill buttons. No error text, code or stack is shown or logged. Reached only by injecting a fault (Intl.PluralRules made to throw before opening Review); no normal action gets here. | J19-01 | [png](screens/J20-01.png) |
| J20-02 | unhappy | **The book cannot be opened (fault injected).** If opening the database or updating it throws, a recovery screen replaces the app, in the same plain block as the crash screen: "The book could not open", the letters are safe on this phone, "Try again, or restart the phone.", and two actions: Try again and Export what's readable. No delete, reset or rebuild exists here. Reached only by a preview-only switch (?fault=launch-once); on a phone it follows a failed database open or update. | J20-01 | [png](screens/J20-02.png) |

## J21 Two parents: invite, join, and the Family tab (server features on)

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J21-01 | happy | **Welcome, with "I was invited".** With server features on the door is back (D-100 amends D-087): Begin the book, and a quiet "I was invited" for a parent whose partner already started one. | J01-02 | [png](screens/J21-01.png) |
| J21-02 | happy | **Paste the invite.** The link from the message is pasted here. The clipboard is read only from what is pasted, never on its own (A-REQ-029). Build 2 invites are links only, so a typed code is not read. | J21-01 | [png](screens/J21-02.png) |
| J21-03 | happy | **Invited, not signed in.** A generic line and Sign in. Nothing about the invite is known yet, so nothing is shown and nothing is asked of the server (BL-322): the token waits in the Keychain (A-REQ-028). | J21-02 | [png](screens/J21-03.png) |
| J21-04 | happy | **Ask before joining.** Signed in, the sheet looks first (peek_invite) and shows only who sent it, by the name the child calls them. Never the child's name. Nothing joins until Join is tapped; Not now forgets the link (BL-322, security review H2). | J21-03 | [png](screens/J21-04.png) |
| J21-05 | happy | **Joined.** One accept, after the tap. The book's cover appears for the first time, with the child's name, and opens to the flyleaf: the name is seen here first (BL-322). The book comes with the next sync, under a thin bar with no count; the open book does not change by itself (only "Open the book" opens it). Here sync is held, so it says the book is on its way. | J21-04 | [png](screens/J21-05.png) |
| J21-06 | happy | **Joined, the book is here.** The cover has opened to the flyleaf. What the child calls this parent in the book is filled in with the inviter's suggestion and can be changed; "Open the book" is the one way the open book changes. |  | [png](screens/J21-06.png) |
| J21-07 | happy | **The Book, lit for the second parent.** The sheet closes onto the welcome, which hands over to the Book and leaves first run behind; the Book is on this book, and its light rises from unlit over 1.2 s, the one slow arrival outside first run (5.8 row 12). | J21-06 | [png](screens/J21-07.png) |
| J21-08 | unhappy | **Closed before the book came, sync held.** The joined sheet closes onto first run's welcome. Here sync cannot bring the book, so there is no dead end: the welcome says the book has not reached this phone yet, offers Try again (a sync), and keeps "Begin the book". While sync is running it says the book is on its way and hides "Begin the book" for up to 30 s (J21i); once the book is here, the welcome hands over to the Book. | J21-05 | [png](screens/J21-08.png) |
| J21-10 | unhappy | **The book is full.** At most two parents per book (D-069). The server says SCCAP and the sheet says so in one calm line; the link is forgotten and nothing is retried (F11-REQ-026). | J21-03 | [png](screens/J21-10.png) |
| J21-20 | happy | **Family tab, one parent.** The one lit room, low and still. "Who writes to Asha", and the people as signatures, "From Mama" with "You" under it: no avatar, no initials, no email address, nothing counted. While the book has one parent, the invite card with the closed cover, and the privacy line says who the book is shared with, never who can read it (S57, review A1). Before sign-in, the invite sheet asks for sign-in first and comes back to the invite. |  | [png](screens/J21-20.png) |
| J21-21 | happy | **Invite a co-parent.** The sheet carries the book's cover: the invite is into this book. What the child calls them, in the letter face with the same ideas as first run, signs their letters, and the cover's foot line reads "From Papa" once the typing pauses. The invite is for this book only; the link works once, for 7 days. | J21-20 | [png](screens/J21-21.png) |
| J21-22 | happy | **Invite shared.** The phone made the invite: its id, a 32-byte token for the link, and the token's SHA-256, which is all the server receives (F11 D5, B-NFR-002). The link, which carries no name, goes to the share sheet and is never stored or shown again; the person sends it. When the share sheet closes the sheet closes too, and the tab says where the invite waits, with the pending row in place. | J21-21 | [png](screens/J21-22.png) |
| J21-23 | happy | **Invite open.** The member list shows the open invite with the day it stops working, Share again and Cancel invite (F11-REQ-019). The invite card steps aside while an invite is open. | J21-22 | [png](screens/J21-23.png) |
| J21-30 | happy | **From a child's settings.** With the switch on the row opens the invite itself. "Family can read" (the family-contributor switch) stays hidden: contributors are not in v1.0 (B1). |  | [png](screens/J21-30.png) |

## J22 Sign in and Account (server features on)

| Step | Kind | What the person sees and does | From | Screen |
|---|---|---|---|---|
| J22-01 | happy | **Sign in, "Welcome back".** The welcome's "I already have a book": one title, one sentence (sign in the same way, so no second account is made), the ways in, the registered privacy line and Not now. No book on this phone yet, so no cover (S52). | J01-02 | [png](screens/J22-01.png) |
| J22-02 | unhappy | **Not now.** Not now closes the sheet onto the welcome as it was. Nothing is asked of the server and nothing on this phone changes (local-first). | J22-01 | [png](screens/J22-02.png) |
| J22-03 | happy | **Continue with email.** One field with the email keyboard and AutoFill, the help under it, and Send link outlined until the text looks like an address. Nothing is wrong while the person types (S53). | J22-02 | [png](screens/J22-03.png) |
| J22-04 | unhappy | **An address that does not look right.** Said on submit only, under the field, with a mark beside the words; it goes as soon as the person types again. | J22-03 | [png](screens/J22-04.png) |
| J22-05 | unhappy | **Offline.** The line says the letters are safe before anything else, then what to do (VOICE, the Error row). | J22-04 | [png](screens/J22-05.png) |
| J22-06 | unhappy | **Too many emails.** The letters are safe first, then the cause and a way forward, in the person's words, not the system's. | J22-05 | [png](screens/J22-06.png) |
| J22-07 | happy | **Check your email.** The address the email went to is on screen. Tap the link on this phone, or type the code: a full code goes on its own; Continue stays for VoiceOver and Switch Control (S54). Not now sits top right. | J22-06 | [png](screens/J22-07.png) |
| J22-08 | unhappy | **A wrong code.** Six digits went on their own; the wrong code clears and the field takes focus again, with the line beside a mark. No shake, no red. | J22-07 | [png](screens/J22-08.png) |
| J22-09 | happy | **Trouble signing in?.** The help line opens in place: where the email may be, and the other ways in. | J22-08 | [png](screens/J22-09.png) |
| J22-10 | unhappy | **No book here yet.** Signed in, but this account has no book: the sheet asks whether another way was used last time. "Start a book" closes onto the lit welcome (5.8 row 13). | J22-09 | [png](screens/J22-10.png) |
| J22-20 | happy | **Keep the book on any phone.** After the first kept letter the sheet rises over the Book, 600 ms after the Book is on screen, so the letter is seen in its month first (5.8 row 5b). It is about this book, so its cover sits beside the title. | J07-03 | [png](screens/J22-20.png) |
| J22-21 | unhappy | **Not now, on the Book.** Not now leaves the person on the Book with the new letter, as it was. The ask is made once (PRD-REQ-001). | J22-20 | [png](screens/J22-21.png) |
| J22-30 | happy | **Account, signed out.** The small closed cover, "Not signed in", the sign-in sheet's own sentence and Sign in (S56). |  | [png](screens/J22-30.png) |
| J22-31 | happy | **Sign in, from Account.** The same sheet, about this book: what signing in makes true, in one sentence. | J22-30 | [png](screens/J22-31.png) |
| J22-32 | happy | **The age step.** When Terms are current without the attestation, the gate's own question: the question, Yes and No with nothing selected, and Continue. Nothing else (LEGAL-REQ-002, PRD-REQ-019). | J22-31 | [png](screens/J22-32.png) |
| J22-33 | happy | **Account, signed in.** How the person signed in, with its mark and the address; Sync and sharing; Devices; and Sign out as a plain row, not red: nothing is deleted. The confirm is native (not on the web). | J22-32 | [png](screens/J22-33.png) |
| J22-40 | happy | **Terms.** The registered words as they are, each document a row that opens in the in-app browser, and the agree line right above "Agree and continue" (LEGAL-REQ-001). | J22-31 | [png](screens/J22-40.png) |
| J22-41 | happy | **Sensitive data.** Every registered line, then "Agree and sync" and "Keep on this phone" at the same height and width: a no as easy as a yes (LEGAL-REQ-006). | J22-40 | [png](screens/J22-41.png) |
| J22-42 | happy | **Kept on this phone, still signed in.** The decline is recorded and the person stays signed in with sync off; Account offers "Agree and sync" for later. Nothing synced. | J22-41 | [png](screens/J22-42.png) |
| J22-43 | happy | **Agree and sync, later.** From Account, "Agree and sync" opens the sensitive-data step with every registered line; nothing is recorded until the person answers there (LEGAL-REQ-006). | J22-42 | [png](screens/J22-43.png) |
| J22-50 | happy | **Sign in to invite.** From the Family tab's invite: you both sign in, each on your own phone. About this book, so its cover sits beside the title. |  | [png](screens/J22-50.png) |
| J22-60 | happy | **Sign in to join.** From an invite: "the book", since a book has at most two parents. Nothing about the invite is shown before sign-in (BL-322). | J21-02 | [png](screens/J22-60.png) |
| J22-70 | unhappy | **Not now, from the code step.** Not now, top right where the number pad never covers it, closes the whole sheet onto the welcome as it was, as on the first step (S52's rule). Nothing changes on this phone. | J22-07 | [png](screens/J22-70.png) |
| J22-71 | happy | **Waiting for the email, with a book here.** Under the code field, only when this phone holds a book: "Your letters are safe on this phone." A fresh install has no letters to be safe, so it says nothing there. | J22-70 | [png](screens/J22-71.png) |
| J22-80 | unhappy | **Paused after five wrong codes.** Typing a code waits for 15 minutes. One line, read as one: the letters are safe, when a code can be tried again, and that the link in the newest email and Apple or Google still sign in. "Send a new email", another address and Not now still work. | J22-08 | [png](screens/J22-80.png) |
| J22-81 | happy | **The pause has ended.** Fifteen minutes after the fifth wrong code the field takes a code again and the paused line goes, with nothing to tap (no countdown on screen). |  | [png](screens/J22-81.png) |
| J22-90 | unhappy | **Invite, setup not finished.** The invite sheet says why in its own words, as the Family tab's card does: "Finish setting up your account to invite someone." Account keeps "Not set up yet" as its row value. |  | [png](screens/J22-90.png) |
| J22-91 | unhappy | **Invite, after a decline.** Nothing above "Agree and sync": the decline was the person's own choice, and the step it opens shows every registered line before anything is recorded. | J22-90 | [png](screens/J22-91.png) |

## Not capturable on web

These exist in the iOS app and could not be shown by the web build. Where a closest honest state was captured, the step note says so.

- **Native permission alerts** (microphone, notifications): iOS shows its own alert; Chromium auto-grants the fake microphone. Mic denied is simulated by refusing `getUserMedia` (J05-04).
- **Real speech and level metering**: the browser's fake microphone is a steady tone, there is no speech model and no level meter, so recordings never get words on web (Review stays on "Writing down what you said") and the "still here" quiet line is not reliable. Review with words (J06) uses the seeded family Asha. A silent recording, a recording where nobody spoke and a transcription failure are shown only through seeded data (J09-05, J10-10) or not at all.
- **Audio playback** ("Hear it", the letter player, Read together voices, autoplay): native audio; the players render but playback is not exercised.
- **Alert dialogs**: "Let it go" (discard a recording), "Hide this book", "Cancel invite", the Sign out confirm use native `Alert`, which does nothing on web.
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
- **A real server**: sign-in, Account, invites and joining are captured against a mock server (J21, J22), so a real email link or code, Sign in with Apple, a real sync and a second real phone are not. With server features off, co-parent entry points show "coming soon" (J17).
- **Real family data**: never used; only the fictional family Asha.
