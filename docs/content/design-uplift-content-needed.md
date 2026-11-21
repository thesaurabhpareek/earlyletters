# Design uplift: content review and CONTENT-NEEDED lines (D1)

Status: PROPOSED, 21 Nov 2026. Owner: `content`. Docs only. This file edits no copy file, no test and no design file. A PROPOSED line does not ship (design language v2, "Agents: read this first"; issue #1221 addendum, item 4). Every proposed line below carries a plain fallback that is existing, shipped text or "no text", so a screen can ship on the fallback if a line is not cleared.

Reviewed: `docs/design/DESIGN-LANGUAGE-V2-21nov.md` at `6caeeb4c` (PR #1222 head, branch `docs/design-language-v2-21nov`), issue #1221 and its two comments, the writing guide v1.2 at `origin/docs/content-guide-v1.2` (PR #1183, not merged when read), `CLAUDE.md`, and the current strings in `packages/content/src/strings.en.ts`, `features/auth.en.ts` and `docs/design/e2e/B-book-and-reading/WORDS.md` on `develop` at `5f8a4469`.

## What I could not verify (UNVERIFIED)

1. **The council rulings.** The Project doc `infra/exec-rulings-2026-11-21-design-uplift.md` is not in the repo and I cannot read Projects here. Rulings the design file cites by label (W1, A3, 32, 34, 35) are taken from the design file's own summary. Where a ruling changes a row below, the ruling wins. UNVERIFIED.
2. **The design canvas and phone page** were not opened (the design file says the same). Words on the canvas that differ from the repo are not seen by me. UNVERIFIED.
3. **Render-only words.** The design file quotes "ASHA 7 MONTHS", "A THOUGHT TO START WITH" and "A letter is waiting to be read back." from renders. In the repo, `tonight.promptLabel` ("A thought to start with") is commented "accessibility hint only, never visible", and the nearest string to the slip is `tonight.draftWaiting.title` ("A recording is ready to read back."). I could not find where "7 months" is built. Which wording a device shows today is UNVERIFIED.
4. **No device or simulator run.** Nothing here was seen on a phone. The AX5 and "reads right when it wraps" checks (guide section 10) need a device.
5. **Test runs.** I ran no test. The content rules tests are not affected: this PR touches no string. The proposed lines were checked by eye against the rules in the guide (section 2 and 7) and `CLAUDE.md`, not by `rules.test.ts`. UNVERIFIED by machine.
6. **The guide is not merged.** v1.2 is PR #1183. Where the guide and `develop` disagree, `develop` is what builds.

## 1. Every customer-facing word the uplift adds or changes

Classes: SAME (word unchanged, restyle only), CASE (case or style only, W1), NEW (a word that does not exist yet), CHANGED (a word that differs from the repo), PROTECTED (appendix B of the guide, or CR-73), SPIKE (waits for SDK 58, ships after submission), NONE (no words).

| # | Screen (id) | Element | Today (key) | Uplift | Class |
|---|---|---|---|---|---|
| 1 | First run welcome (E-S02) | Title | `onboarding.welcome.title` "{app}" | Shown in `display` | SAME |
| 2 | First run welcome | Hero object | none | Closed book cover (R5) | NEW (spoken name or decorative: P1) |
| 3 | First run welcome | Subtitle, body | `welcome.subtitle`, `welcome.body` | Design "after" row lists no subtitle or body | OPEN (Q3) |
| 4 | First run welcome | Free letters line | `welcome.freeLine` (founder F5, same words as `billingCopy.membership.line`) | Design "after" row lists no such line | PROTECTED, OPEN (Q3) |
| 5 | First run welcome | Primary pill | `welcome.startButton` "Begin the book" | One prominent pill on the accent | SAME |
| 6 | First run welcome | Second action as plain text | `welcome.signInButton` "I already have a book", `welcome.joinButton` "I was invited" | "The second action": one of two | OPEN (Q4) |
| 7 | First run welcome | Agreement line in `footnote` with links | `authCopy.sheet.agreeLine` "By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy." | Restyle | PROTECTED, SAME |
| 8 | Empty Book (B-S01.empty) | Title | `book.empty.bookTitle` "The first page is waiting." | In `title1` | SAME |
| 9 | Empty Book | Body, button | `book.empty.bookBody` "Tell {child} one thing about today.", `bookCta` "Write a letter" | "One line of body, one prominent button" | SAME |
| 10 | Empty Book | Cover | closed cover already specified in e2e B-S01.empty (NS-22-R4) | Cover at 3:4 on a soft shadow | NEW (spoken name or decorative: P2) |
| 11 | Home (A-S01) | Kickers | `caps` style on `resurfaced.kicker` "A month ago", the child eyebrow, the prompt hint | "Kickers are title case, not all caps" | CASE, CONFLICT (Q2) |
| 12 | Capture, recording (A-S05) | "Listening." | `tonight.states.listening` | In `title2` serif | SAME |
| 13 | Capture | "Say it however it comes." | `tonight.states.listeningHint` | As `subhead` | SAME |
| 14 | Capture | Timer | visual only; VoiceOver `listen.elapsedA11y` "{minutes} min {seconds} s recorded" | New `timer` style; "announced as words, never the digits alone" | NEW (P4) |
| 15 | Capture | "Let it go" quiet button | `listen.discardButton`, confirm `discardTitle`, `discardBodyNoUndo` (PROPOSED, BL-925) | Quiet button | SAME, PROTECTED (counsel reads the confirm) |
| 16 | Capture | Stop control (glass ring around the red disc, ruling A3) | `tonight.states.stopButton` "Finish"; `listen.toggleA11y` | New control shape | NEW (P3) |
| 17 | Capture | Mic prompt | `listen.primer` then the iOS prompt `permissions.microphone` | Not changed | PROTECTED, SAME |
| 18 | Review (A-S07) | "Keep" | `review.keepButton` and `listen.keepButton` "Keep it" | Design text says one prominent "Keep" | CHANGED (D1) |
| 19 | Review | "Let it go" beside it | `listen.discardButton` | Plain text beside | SAME |
| 20 | Review | Dateline, marks | `letterDateline` caps, `editMark` | Dateline above the card, dotted mark kept | SAME |
| 21 | Review | First-note card | `review.firstNote` (registered disclosure, in-app-disclosures.md section 2) | Card shadow only | PROTECTED, SAME |
| 22 | Book home (B-S01) | Title, month rows | `book.title`, `book.chapterTitle`, `chapterLetters` | Large serif title, bigger padding | SAME |
| 23 | Book home | Tab bar | `tabs.tonight` "Home", `tabs.book` "Book", `tabs.you` "Me" | Stays the paper bar for this build | NONE (system tab bar is SPIKE) |
| 24 | Letter reading (B-S08) | Text, signature, play row | `book.signature`, `book.hearLink` | Measure cap, paragraph gap, italic signature | SAME |
| 25 | Letter reading | "Reading Size" | `reader.readingSizeTitle` "Reading size", `readingSizeA11y` | Design writes "Reading Size", "stays" | CASE (see Q2) |
| 26 | Letter reading | Toolbar: standard back and one overflow menu | `entryMenu.*` rows in a "This letter" list on the page; back is the OS control | New overflow trigger | NEW (P5) |
| 27 | Settings home (C-S01) | Section headers | `settings.sections.*` "The book", "Recordings", "Your words", "Family", "Reminders", "Your data", "Plan", "Account" | "Title-case section headers" | CASE, CONFLICT (Q2) |
| 28 | Settings | Row labels | `settings.plan.manageLabel` "Manage subscription" and friends, named by billing and sign-in emails | Taller rows, SF Symbols in muted tint | SAME (symbols are decorative; SPIKE) |
| 29 | System sheets (E-S10, A-S02, B-S07, A-S08) | Cancel leading, Done trailing, grabber, title in `title2` | `common.cancelButton`, `doneButton` | Words unchanged | SPIKE, SAME. The grabber's name comes from the OS. |
| 30 | SF Symbols (all tab roots, A-S05 mic, A-S07 Keep) | Icon labels | `listen.ready.startA11y` "Start recording" | Symbols replace Phosphor | SPIKE, NONE. A symbol beside a word is decorative and says nothing. |
| 31 | Motion, haptics, tokens | None | | | NONE |

Count: 31 rows. New words needed: 5 (P1 to P5). Changed words: 1 (D1). Open decisions: 4 (Q1 to Q4 below). Rows 7, 15, 17, 21 are protected and unchanged.

## 2. Check against the writing guide v1.2 and `CLAUDE.md`

| Rule | Result |
|---|---|
| No em or en dashes, curly quotes, ellipsis characters, emoji | The design file is clean. No new string breaks it. Proposed lines below use none. |
| No gap counting, streaks, points, badges, confetti, progress rings | The design file forbids them and adds none. Row 11: "ASHA 7 MONTHS" is the child's age, not a gap count. The empty-state line counts nothing missing. Row 14: the elapsed timer counts what exists. |
| Never gender the child | Every line uses `{child}`. "Asha" appears only in design examples (the fictional family). |
| Never imply AI writes | No new line mentions writing, fixing or improving. The review card keeps the dotted mark and "Put it back". Row 14 and P4 say "recorded", not "written". |
| Protected text | Rows 4, 7, 15, 17, 21 are unchanged. The design file does not rewrite them. Two risks are in Q3 (the free-letters line may be dropped) and Q1 (nothing in the uplift may move the OS mic prompt). The agreement line may be restyled, not reworded. Changing its words is a new agreement record (strings comment at `beforeBegin`). |
| Sentence case everywhere (guide section 6) | CONFLICT. The design file asks for title-case kickers and section headers (R3, C7, hero 7). The guide says sentence case, proper nouns only. See Q2. |
| Words change only by case (W1) | Mostly held. One word differs: "Keep" against "Keep it" (D1). |
| Buttons start with a verb, one word per action | "Keep it" is the word of the Keep step across `listen`, `review`, `draft` and `tonight.draft.keepButton`. See D1. |
| Accessible names say what a control does; decorative icons say nothing (guide section 10) | New controls (stop ring, overflow trigger, cover) have no name yet. P1 to P5 add them or fall back to decorative. |
| Spell out abbreviations (guide section 10) | `listen.elapsedA11y` says "min" and "s". Existing, not uplift, but the uplift's timer revisits it (P4). |
| No "Please", "just", "unable to", uncontracted negatives | The uplift adds none. Existing lines that break this (for example `review.saveFailed` "That did not save.", `review.firstNote` "Please have a read") are outside the uplift and are not touched here. |

## 3. Decisions for the owners

| # | Question | Recommendation | Owner |
|---|---|---|---|
| D1 | Design hero 3 says one prominent "Keep". Today's button is "Keep it". | A (recommended): keep "Keep it". It is W1 (no word change), matches the glossary step and every existing key, and a test may pin it. B: "Keep" (a changed word, needs a words-packet line, the exact-word tests and CPO sign-off). | `content`, design-systems, CPO |
| Q1 | Does anything in the capture polish change when the iOS mic prompt appears or its words? | No. Hold it. `permissions.microphone` is counsel's and the OS prompt stays after our one-time note. State this in the capture PR. | CLO |
| Q2 | Title case for kickers and Settings headers (R3, C7), against sentence case in the guide. | Sentence case. Reasons: the guide (section 6); the headers are one to three words, so the only visible change is "Your Words" and "Your Data"; billing and sign-in emails name Settings labels exactly ("Manage subscription", "Plan"), and those emails are counsel-held (appendix B), so a label that changes case drifts from the email. The caps style is separate and can still be dropped: the strings do not change and VoiceOver is unaffected. Fallback: today's strings with the caps style removed. | design-systems, `content`, CMO |
| Q3 | The first-run "after" row lists title, pill, a text button and the agreement line. Do the subtitle, body and the free-letters line stay? | They stay. The free-letters line is the founder's F5 wording, said once at setup in the store build and held with the plan wording (CR-73: what users are promised). Dropping it is not a design call. Subtitle and body may sit lower or smaller, not be removed, unless `content` and the CPO rule otherwise. | CPO, CLO, founder |
| Q4 | Which one is "the second action" on first run: "I already have a book" or "I was invited"? Whether "I was invited" shows in the store build is UNVERIFIED. | Keep both as plain text buttons in today's words. Do not merge them into one new line. | design-systems, mobile |

## 4. CONTENT-NEEDED lines (all PROPOSED)

None of these ships until `content` clears it. Key paths are suggestions; the owner of the copy file picks the final key in the PR that wires the screen (one owner per file). Rule column: what the line meets beyond the rules every line meets.

| # | Key (suggested) | Where it shows | PROPOSED words | Plain fallback | Rule | Owner and gate |
|---|---|---|---|---|---|---|
| P1 | `onboarding.welcome.coverA11y` | VoiceOver name of the closed cover on first run (E-S02). No child exists yet, so no name. | "A closed book." | None. The cover is decorative and hidden from VoiceOver (the component's default). The title and pill beside it say everything. | Says what the picture shows, not a feeling (guide section 9, alt text). 14 characters. | `content`, design-systems. No counsel. |
| P2 | `book.empty.coverA11y` | VoiceOver name of the closed cover on the empty Book (B-S01.empty). | "{child}'s book, closed." | None. Decorative, hidden from VoiceOver. | `{child}` only. Matches `book.title` "{child}'s book". No gender, no count. | `content`, design-systems. No counsel. |
| P3 | `listen.stopA11y` | VoiceOver name of the glass-ring stop control on A-S05 (ruling A3, UNVERIFIED). | "Finish recording" | `tonight.states.stopButton` "Finish", as today. | Names the result (guide section 8, buttons) and says what it ends (section 10: "Play recording" not "Play"). The ring has no visible text, so the name cannot clash with WCAG 2.5.3. | `content`, mobile. If a visible word is added later, the name must contain it. |
| P4 | `listen.elapsedSpokenA11y` | VoiceOver reading of the new timer, spoken as words and not digits (design 4.2). `{duration}` is built in code, for example "1 minute 5 seconds" or "40 seconds". | "{duration} recorded" | `listen.elapsedA11y` "{minutes} min {seconds} s recorded", as today. | Spells out the abbreviations (guide section 10). One string with a named placeholder. Plural forms ("1 minute", "2 minutes") need a code formatter; whether the app has one is UNVERIFIED. If it has none, use the fallback. | `content`, mobile |
| P5 | `reader.menuA11y` | VoiceOver name of the one overflow menu in the letter toolbar (B-S08, hero 6). The menu holds the rows that are in the "This letter" list today (`book.entryMenu.*`), words unchanged. | "More options for this letter" | Keep the "This letter" list on the page, as today, and add no menu. | Says what the control opens. 29 characters (a11y name, no button limit). Not pointing words. | `content`, mobile, design-systems |

Count: 5 PROPOSED lines (P1 to P5). The words of the rows moved into the menu are unchanged.

Not needed, checked: no new empty-state line (rows 8 and 9 reuse shipped words; the design's own text for the empty Book is "The first page is waiting." in `title1`, one line of `body`, one button, all existing); no new Settings word; no new first-run word; no new Review word; no new toast. The spike-gated items add no word: SF Symbols beside text are decorative, system sheets use `common.cancelButton` and `doneButton`, and the grabber's name comes from the OS.

## 5. Gate notes for the screens that carry words

1. Per the set rule, first run, empty Book, capture, Review and Keep, Book home and reading a letter ship together on one look or not at all. A cleared P1 to P5 is not required for that set: every line has a fallback that ships today. Only D1 and Q3 can change what a parent reads, and the recommendations keep today's words.
2. Each screen PR states: which of P1 to P5 it uses, or that it used the fallback; that the strings it reads are unchanged; and that `npm test -w @scribe/content` ran (or did not).
3. At AX5, check by hand on a device that "Listening.", "The first page is waiting." and the letter text wrap and are never truncated (guide section 10, S1-23 in `docs/qa/DEVICE_TEST_PLAN.md`). Not done here.
4. Any approved line goes into the words packet or the PR that wires the screen with a before and after. Update the exact-word tests in the same PR.
