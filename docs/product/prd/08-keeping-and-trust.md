# NS-08 to NS-12: Keeping (letters survive and what we say about them is true)

Status: Draft v1, 19 Nov 2026. Author: Karma with the Chief Product Officer role (one Claude session; not `product`'s own run). Docs only. Index and the shape every card follows: `README.md`, section "How to read a card".
Nothing here was run on a phone. Code facts, sizes, skills and order are in `13-engineering-plan.md`; test cases are in `14-test-plan.md`. Words in quotes that are not an existing `packages/content` key are intent for `content` to write, never final copy. Numbers marked PROPOSED are proposals.
Job served by this whole file: "Never lose what I made" (rank 1, `docs/prd/v2/02-customers.md` section 4).

---

## NS-08. Recording backup: get ready, do not turn it on (candidate C-01, rank 1)

**Who and when.** P1, the evening parent, eight months in, whose phone holds every recording of their voice for {child}. The moment that matters is the day that phone is replaced, lost or broken.

**Why.** The first store release ships with recording backup off. The words come back on a new phone when the parent signs in; the recordings do not. The voice is the keepsake (principle 1 of the design language), so today it lives in one place. That is the largest gap against job 1.

**Why not simply turn it on.** Three facts stop it (exec rulings of 19 Nov, ruling 2): production is on the Free plan by the founder's decision (D-159) and backup would fill its storage; turning it on changes the App Store privacy label and the Privacy Policy, which counsel must read; the escrow and restore drill has never run against production. So this card is the work that costs nothing and makes the later decision a short one.

**What.** Four deliverables, no parent-facing change:
1. A read of the built backup and restore paths against what `docs/ops/BACKUP_RUNBOOK.md` and ADR 0023 say, with every difference listed.
2. A sizing note: recordings per family and bytes per minute from the repo's own format facts, against the storage choices on record.
3. The escrow drill rehearsed on a scratch project, written up as a run sheet the founder can repeat on production.
4. The label and policy difference drafted for counsel (what changes from Audio Data: No).

**Not in scope.** Setting `EXPO_PUBLIC_BACKUP` on in any store profile. Any spend. Any change to a published sentence.

**Happy path (when it is later turned on; recorded here so design and content can prepare).**
1. A signed-in parent keeps a spoken letter.
2. The recording is encrypted on the phone and uploaded in the background; the letter page says where the recording is, truthfully, at each moment.
3. On a new phone, after sign-in, the letter's words appear first; its recording arrives and the page says so when it has.

**Unhappy paths the later build must answer (inputs for design now).**

| Case | What the parent must be able to tell |
|---|---|
| No network for days | The recording is safe on this phone and will be backed up later. No warning tone |
| Upload fails repeatedly | Same as above; nothing asks the parent to act unless they can act |
| New phone, recording not yet arrived | The words are here; the recording is on its way. Never "kept on this phone" (NX-36-S17) |
| Recording never backed up from the old phone | The page does not offer Play, and says the recording was only on the other phone, without blame |
| Parent signs out | What stays on the phone and what does not, before they confirm |
| Storage quota reached on our side | Capture and Keep still work; backup waits; the parent is not charged or blocked |

**Acceptance.**

| Id | Given, When, Then | Test or evidence |
|---|---|---|
| NS-08-R1 | Given the backup client, server and escrow code on develop, When the read is done, Then one note lists each difference between code and `BACKUP_RUNBOOK.md` and ADR 0023, with file and line, or says there is none | the note, reviewed by `security-architect` |
| NS-08-R2 | Given the recording format in ADR 0005 and F08, Then the sizing note states bytes per minute, a low, base and high case for recordings per family per month marked as assumptions, and months until each storage choice on record is full | the note, reviewed by the CFO role |
| NS-08-R3 | Given a scratch project, When the escrow drill is rehearsed, Then the run sheet records each step, what was seen, and what could not be run without production | the run sheet |
| NS-08-R4 | Given the privacy label worksheet and the Privacy Policy draft, Then one page shows each answer and sentence that changes when backup turns on | the page, marked draft for counsel |
| NS-08-R5 | Given any store profile in `eas.json`, Then `EXPO_PUBLIC_BACKUP` stays off until a founder decision turns it on | existing preflight check |

**Design inputs.** None to build. Prepare: the letter-page provenance line needs four truthful states (on this phone; on this phone and backed up; on its way to this phone; not on this phone). Largest text size first. No lock, shield or "bank-level" imagery (VOICE.md).
**Content inputs.** Four state lines as intent above; one sign-out line. None may say or imply a recording cannot be lost. D-102 forbids any claim that only the family's keys can open a backup. Words wait for counsel.
**Legal, privacy, compliance inputs.** Apple's App Privacy definition of "collect" makes Audio Data: Yes and linked once backup ships (read 10 Nov, per the exec record). Privacy Policy sentences on recordings must change first. A baby's voice on a parent's recording is the open COPPA edge (counsel packet Q4(b)). Counsel must confirm each.
**Free or Plus.** Backup is free and never a Plus feature (D-111 item 6).
**Depends on.** Nothing to start. The flip depends on six conditions in the exec record.
**Open questions.** Which storage path (the founder; no date set). Who runs the production drill (the founder with `ops`).

---

## NS-09. Let it go always finishes (candidate N-07, rank 2)

**Who and when.** P1, a second after deciding a take was not worth keeping, or was something they did not want kept: a cough, a wrong start, a private moment.

**Why.** "Let it go" is a promise as much as "kept" is. Today, if the app stops midway through letting a take go, or the phone refuses to remove the file, the take disappears from view and its audio stays on the phone. Discarding while still recording has the same gap. Review does not notice when the removal fails. A parent who let something go believes it is gone.

**What.** Three fixes and one line of words: the launch sweep finishes any draft left `discarding`; Listen uses the same path as Review; Review tells the parent, once and calmly, when a recording could not be removed yet.

**Happy path.** The parent confirms Let it go. The file is deleted, then the row. Nothing is shown except the return to where they were.

**Unhappy paths.**

| Case | What happens | What the parent sees |
|---|---|---|
| App is killed between mark and delete | Next launch finishes it before Home is interactive or in the background, without delaying the first frame | Nothing |
| File delete throws | The row stays marked; next launch retries | One line in Review (intent: "That recording is still on this phone. We will finish removing it.") |
| File is already missing | The row is removed | Nothing |
| Delete keeps failing across launches | Retries each launch; never surfaces the draft again as keepable | Nothing further; `qa` decides whether Storage in Me should show it |

**Acceptance.**

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-09-R1 | Given one draft marked `discarding` with its file present, When the launch sweep runs, Then the file and the row are both gone | `[NS-09-R1] the sweep finishes a discarding draft` |
| NS-09-R2 | Given a `discarding` draft whose delete throws, When the sweep runs, Then the row remains marked and no error reaches the screen | `[NS-09-R2] a failed delete waits for the next launch` |
| NS-09-R3 | Given Discard on Listen and a delete that throws, Then the draft row remains, marked `discarding` | `[NS-09-R3] Listen never removes a row whose file is still there` |
| NS-09-R4 | Given Let it go in Review and a delete that fails, Then the BL-925 line is shown once and announced to VoiceOver | `[NS-09-R4] Review says when a recording is not gone yet` |
| NS-09-R5 | Given 0 `discarding` drafts, Then the sweep adds no measurable work to launch (PROPOSED: under 5 ms on an iPhone SE 3; device) | BL-929 run sheet row |

**Design inputs.** One inline line in Review, the app's own small muted voice, never the letter's serif, no icon, no red. It must not block leaving Review.
**Content inputs.** One key (BL-925). True, calm, no blame, no "failed", no "error". Needs the founder's word approval.
**Legal, privacy inputs.** This is a deletion promise kept on the phone. No server data. No counsel read needed for the fix; the line is a claim and goes in the claims registry.
**Free or Plus.** Not applicable.
**Backlog.** BL-923, BL-924, BL-925, BL-926.

---

## NS-10. A new phone: close the last gap (candidate C-02, rank 6)

**Who and when.** P1 or P2 on the first evening with a new phone, signing in and expecting their book.

**Why.** The app now waits on "Opening your book" while the account's book may be on its way, and no longer says a recording is kept on a phone that does not hold it. One hole remains: a returning account whose consent is outstanding (a Terms version changed, or the app was closed on the Terms sheet) sees the first-run promise step with Continue and no way to agree (BL-922). For a parent that reads as "my book is gone".

**What.** Close that gap, and prove the whole arrival on two real phones.

**Happy path.** Sign in on the new phone. The consent sheet appears if needed. "Opening your book" holds for at most 10 seconds, then the Book shows the letters' words.

**Unhappy paths.**

| Case | What the parent sees |
|---|---|
| Consent outstanding at relaunch | The consent sheet again, or a held screen with Finish setup and Try another way. Never the child step |
| No network | The held screen says the book needs a connection once, with a way to retry. No empty book |
| The account truly has no book | "No book here yet" once, with Start a book once (not twice) |
| Wrong account (signed in with a different method) | A plain route to sign out and try another way |

**Acceptance.**

| Id | Given, When, Then | Test |
|---|---|---|
| NS-10-R0 | Given a returning account with no book on this phone and a consent still to give, When the app is opened, Then the consent sheet or a held screen with two ways forward is shown within 10 seconds, and the first-run child step is never shown | `[NS-10-R0] a returning account never meets the child step` |
| NS-10-R1 | Given two iPhones and one account with 5 or more letters, When the second phone signs in, Then every letter's words appear and no page says a recording is kept on that phone | device row S1-204 |

**Design inputs.** The held screen exists. At the largest text size the two actions stack and stay 44 pt.
**Content inputs.** Reuse the existing keys. The "No book here yet" line must not read as loss.
**Legal, privacy inputs.** The consent sheet records an acceptance (PRIV-R21). Shown, Records, Never and Decline lines are in the first-run journey spec; unchanged here.
**Backlog.** BL-922.

---

## NS-11. Save a copy of the year (candidate C-03, rank 15)

**Who and when.** P1 in {child}'s birthday week, in a reflective mood, or any day they think "I should have this somewhere else". Also P6: the copy is what outlives the app.

**Why.** Export exists and is free (F15), and while backup is off it is the only second copy of the voice. Almost nobody exports without a reason to (HYPOTHESIS; no evidence of our own). A yearly moment the parent chooses turns a setting into a keepsake habit. It also tests, at no server cost, whether families want a second home for the voice.

**What.** A "Save a copy" action in Me, where "Take the book with you" lives, and one slip on Home during the birthday week that leads to it. The copy is the existing export. No notification in the first version. No new file format.

**Not in scope.** Automatic export. Any cloud of ours. A reminder that repeats. Any line that mentions losing anything.

**Happy path.**
1. In the birthday week the Home slip appears (it shares the single Home slip; it never stacks with another).
2. The parent taps it and lands on Save a copy, which says what the copy holds: every letter's words, every recording on this phone, in open formats.
3. They choose where it goes with the system share sheet (Files, iCloud Drive, AirDrop).
4. The slip does not return this year.

**Unhappy paths.**

| Case | What the parent sees |
|---|---|
| The phone is short of space | The existing phone-is-full line; the export does not start half-made |
| Some recordings are not on this phone (new phone) | The screen says which the copy will hold: words for all, recordings for those here. No count of what is missing |
| The parent dismisses the slip | It goes and does not return this year |
| The share sheet is cancelled | Back on Save a copy; nothing is recorded as done |
| No birthday yet (expecting parent, P3) | No slip. The action in Me is always there |
| Two books | The slip names whose book; the copy is of that book |

**Acceptance.**

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-11-R1 | Given Me, Then one action leads to Save a copy and it is reachable in 2 taps from the tab | `[NS-11-R1] Save a copy is two taps from Me` |
| NS-11-R2 | Given a child with a birth date, When today is within 7 days after the birthday (PROPOSED window), Then Home shows the slip at most once per year per book | `[NS-11-R2] the slip shows once a year` |
| NS-11-R3 | Given the slip is dismissed or the copy is saved, Then the slip does not show again until the next birthday | `[NS-11-R3] dismissed means gone for the year` |
| NS-11-R4 | Given another Home slip is due, Then exactly one slip is shown (order: a waiting draft first) | `[NS-11-R4] one slip at a time` |
| NS-11-R5 | Given the screen and the slip, Then no string contains a count of letters, a gap, or a word from the fear list in the content rules | content rules test |
| NS-11-R6 | Given the export it produces, Then it is byte-identical to the export from Take the book with you | `[NS-11-R6] same export, one code path` |
| NS-11-R7 | Given a child with only a due date, Then no slip is shown | `[NS-11-R7] no slip before a birth date` |

**Design inputs.** The slip is the existing Home slip component; no new component. Save a copy is one screen: one sentence of what the copy holds, one primary action in the bottom third, at least 56 pt. At the largest text size the sentence wraps and the action stays visible without scrolling on an iPhone SE 3 (device). No celebration, no confetti, no badge.
**Content inputs.** Two lines and one button. Tone: a keepsake ("a copy of the year, yours to keep"), never protection. Existing keys to stay consistent with: `exportNudge` ("Save a copy of your book in Files or iCloud Drive. It is yours to keep.") and `exportEmpty`. `{child}` only. The founder approves the words.
**Legal, privacy, compliance inputs.** The copy leaves the phone only by the parent's own act through the system sheet; we receive nothing. It contains a child's name and the family's words, so the screen says the copy is as private as where they put it (intent). No label change. Whether that sentence needs a counsel read: CLO role says no new promise is made; counsel must confirm if the wording says anything about safety.
**Data and engineering notes.** Slip state is a local row (book, year, shown, dismissed). No analytics event in the 1.0 line (D-124).
**Free or Plus.** Free. Export is never gated (M1).
**Measure (by hand, analytics off).** Testers answer one question: did you save a copy, and where did it go (Files, iCloud Drive, somewhere else). No content.
**Backlog.** BL-934 writes the remaining rows; build row to follow.
**Open question.** Is the window 7 days after the birthday, or the week around it? Default: after. Owner: CPO role, by Fri 27 Nov.

---

## NS-12. Earlier versions of my own words (candidate C-04, rank 34)

**Who and when.** P1 who edited a letter in Review last month and wants the earlier wording back.

**Why.** The server already keeps earlier versions, and the phone has no reader for them. Value is modest: every machine fix can already be put back, and the words as heard are one tap away. This is for the parent's own edits only.

**What (when it is taken up).** On the letter page, for the author only, a list of that letter's earlier versions by date; tapping one shows it; one action restores it as the current words. The raw transcript is untouched.

**Unhappy paths.** No earlier version: the row is absent, not disabled. Offline: versions on the phone only, or none. The other parent's letter: never shown.

**Acceptance (first three, PROPOSED).**

| Id | Given, When, Then |
|---|---|
| NS-12-R1 | Given a letter with 2 or more versions and the reader is its author, Then the letter page offers the earlier versions, newest first, labelled by date only |
| NS-12-R2 | Given a restore, Then the restored words become a new version; no version is deleted |
| NS-12-R3 | Given any version view, Then `raw_transcript` is never changed and no machine edit is applied on restore |

**Design, content, legal inputs.** One row in the "This letter" list (NS-21). Words: dates, not judgments ("earlier", never "original" for an edited version). Retention of versions is a data-policy matter: `data-steward` confirms the clock before any build. Counsel must confirm any retention sentence.
**Not started.** No requirement beyond this card. It waits for NS-21.
