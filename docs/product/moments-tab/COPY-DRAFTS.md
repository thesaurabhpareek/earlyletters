# Moments tab: proposed words (drafts)

Owner: `content`. Status: PROPOSED. Nothing here is shipped copy. Engineers build behind the flag, the founder approves the words, and only then do they move into `packages/content/src` as keys (`docs/product/prd/13-engineering-plan.md` section 4). Founder-only, because it is what a user is promised: every claim line, the primers, the disclosures. Counsel confirms the claims (`legal`).

Sources read: `docs/product/prd/28-moments-tab.md` (sections 13, 16.1, 17), `EXPERIENCE-AND-MOTION.md` (sections 2 to 4), `FREEZE-CHECKLIST.md` (O-48, O-55, Q8), `FACT-CHECK-PRIVACY-EAS.md`, `packages/content/VOICE.md`, `BRAND.md`, `WRITING-GUIDE.md`, `docs/agents/COORDINATION.md` section 10.

Key names. `en.moments.*` is shorthand. The real home is `momentsCopy` in `packages/content/src/features/moments.en.ts` (not yet created), a nested object, each key marked `TODO(founder): PROPOSED`, and exported through `packages/content/src/features/index.ts`. Do not extend `strings.en.ts`.

How to read a line. `{child}` and `{app}` are placeholders (the name comes from `packages/brand` only). Each line gives Option A and, where there is a real choice, Option B, with a one-line reason each. The first option is my pick unless I say otherwise. Marks: PROPOSED (words wait for the founder), PROPOSED-HELD (do not build until the named question is answered), UNVERIFIED (a fact I could not check in code or Apple's text).

Rules I held every line to: no em or en dashes, curly quotes, ellipsis characters or emoji; no exclamation marks; no fear, guilt or loss words; no "we", "our" or "us" in a parent-facing line (PRD R159); no counts of what is missing; nothing that suggests the app writes; `{child}` never gendered; nothing says "private", "safe", "never", "only you", "stays on your phone" in a primer (PRD 16.1).

---

## 1. Glossary check (BRAND.md glossary and internal-terms table)

Every word a parent reads in this file was checked against the glossary. Terms checked, and the result:

| Term checked | Result |
|---|---|
| letter, note | Used as the glossary says. A letter is what a person makes from a day. "Note" is not used for anything the tab shows. |
| moment, Moments | The glossary bans "moment" for a short piece a person makes ("note"). The tab is named Moments in the PRD. It is not a glossary term, so this is a question for the founder (section 11, Q1). In my lines it appears only as the tab's name, never as a noun for something a person made, and never in a notification. |
| entry, draft, take, pack, chapter, transcript, raw_transcript | Not used anywhere a parent reads. |
| memory, story, journal, diary, album, baby book | Not used. (The O-48 line says "story"; it is held, section 10.) |
| recording, your words, what you said | Not needed here; not used. |
| memory book, the book, "{child}'s book" | Used as "the book" in notifications and "{child}'s book" nowhere that needs it. |
| Month, month | Only "a new month" in one notification option, with no number. Month is the glossary term for a section of the book; this use is the plain word. |
| encrypted backup, "a backup is for you alone" | Banned for this meaning. The glossary row is our own backup. The iPhone line (section 8) says "your iPhone's own backup" and never uses either phrase. |
| Apple Account | Not needed. I do not say "iCloud account" or "Apple ID". |
| Settings (the system's) | Only in the denied line (ACC-4), where PRD 5.x allows it. |
| Plus, price, trial, subscribe | None used (the rules test blocks them in `en.moments.*`). |
| co-parent | Not used. |
| Word for word, small fix, Exactly as said | Not used; none of these surfaces touch edits. |
| picture, pictures, day, date, tab | Not glossary terms. "Pictures" follows the PRD. "Photos" is only Apple's app name and is not used. Flagged for the glossary so they are decided once (Q2). |
| Choose, Start, Continue, Not now, Not this one, Undo | Verbs from the PRD and design spec. Not glossary terms. "Start" is never "Keep": Keep is the Plus gate action and stays on the letter. |
| Hide this day, Keep this day close, Name this day | Sibling menu verbs from PRD section 7; listed so the menu reads whole. Not changed here. |
| remind, reminder | Only in the notification rules ("invite, never remind"); no notification line says "reminder". Glossary: reminder is what we send for billing, months and birthdays. |
| encrypted, private, safe, secure, never, only | Avoided in primers by PRD rule. "Never" and "only" appear in one disclosure (section 7) with the proof named. |

---

## 2. The ask card

The card on the tab that asks whether to show days from the parent's pictures. Shown in the never-asked state (ACC-0) below the real cards, and as a re-ask row after Not now (ACC-1), never above the door. Equal weight for both buttons (EXH-DES-9). It makes no claim about what is read: the primer does that (PRD 3: "the ask card and primer only", and this card stays lighter).

| Key (proposed) | Option A | Option B |
|---|---|---|
| `en.moments.ask.title` | Show days from your pictures? | Start from a day in your pictures? |
| Reason | Matches the design spec wireframe word for word, so design and words agree. | Names the act (start a letter) rather than the suggestion, which fits PRD R295 ("the first value line states the act"). A little longer. |
| `en.moments.ask.accept` | Show days | See my days |
| Reason | Short, a verb, matches the wireframe. | "My" reads warmer but longer at the largest text size. |
| `en.moments.ask.decline` | Not now | Not now |
| Reason | Only one choice: it must be the same word as the card face, the primer and the sheet, and equal in size and style. | |

Accessibility labels: accept "Show days from my pictures"; decline "Not now, show days from my pictures". The ask card has no body line (the primer carries the explanation, so nothing here can over-claim).

Shown / Records / Never / Decline (the ask card is not itself the permission; the primer is, and its lines are in section 5):
- Shown: the three keys above.
- Records: nothing. Tapping Show days opens the primer; tapping Not now writes the "primer answered" flag as in section 5.
- Never: no system alert from this card, no count, no "recommended".
- Decline: Not now closes the card with the same calm move as a grant (160 ms, then the gap closes). The door row becomes the first row (PRD 2.6).

### Not now on the face of a day card, Not this one in the menu, Undo

The decision to promote Not now to the face of the card is the design spec's, left open for `content` as "Not now" or "Not this one" (EXPERIENCE-AND-MOTION 2.3). My answer: the face says **Not now** and the menu says **Not this one**, because they do two different things (PRD 17: Not now holds a card back until tomorrow; Not this one stops that day showing in For you and Recent). Two verbs for two effects, and neither sounds like a verdict on the picture.

| Key (proposed) | Option A | Option B |
|---|---|---|
| `en.moments.card.notNow` (face) | Not now | Maybe later |
| Reason | Same word as the founder's brief, the ask card and the sheet. One verb everywhere. | Softer, but a second verb for the same act, and "later" can sound like a to-do. |
| `en.moments.card.menu.notThisOne` (menu) | Not this one | Don't show this day |
| Reason | Short, and plainly different from Not now. Matches the PRD's name for the verb. | Says the effect outright, but "don't" is a scold at the edge of the screen. |
| `en.moments.card.notNow.toast` | Back tomorrow. | Set aside for now. |
| Reason | States the real effect (until tomorrow, PRD 17). | Safer if the "until tomorrow" timing changes; says less. |
| `en.moments.card.notThisOne.toast` | This day won't show again. | Okay. This one's off the list. |
| Reason | States the real effect, in the plain voice. If the key is later undone in Me, "again" is still true. | Friendly, but "list" implies a list that exists. |
| `en.moments.card.undo` | Undo | Put it back |
| Reason | The design spec names it Undo and it already appears elsewhere in the app. | "Put it back" is VOICE.md's phrase for small fixes (`packages/content/VOICE.md` line 53: "every small fix is marked, and you can put it back"). It is a voice example, not a BRAND.md glossary row. Reusing it here would blur two different undos. I pick A. |

Accessibility labels (VoiceOver): face button "Not now, {dateHeading}"; menu item "Not this one, {dateHeading}"; the toast is announced once, with its action named Undo. Menu items that sit beside it, unchanged: "Name this day", "Hide this day", "Keep this day close" (PRD 17).

Shown / Records / Never / Decline:
- Shown: the keys above.
- Records: a local day key on the phone (`moments.json`, level L4, never sent). Nothing else.
- Never: no picture identifier, no album, no reason, no log or event for either verb (PRD R56 dropped; day key only).
- Decline: Undo restores the card at once. Not this one is listed and removable in Me ("Hide this day" is the separate verb listed there).

---

## 3. The door row

The quiet text row that opens Apple's picker directly. It works in every permission state and never leads into the primer (R270, R279).

| Key (proposed) | Option A | Option B |
|---|---|---|
| `en.moments.door.label` | Choose pictures | Choose pictures yourself |
| Reason | The PRD's one verb family ("Choose pictures"); short enough for the largest text size. | Tells a parent who just said Not now that this route does not need the other. A little long, and "yourself" can sound like a rebuke. |

VoiceOver label: "Choose pictures", read as a button; hint none. It is the same words as the visible label so Voice Control "tap Choose pictures" works.

Where it sits (first row after Not now, below the ask card before it, last row in Recent) is the design spec's call (O-56), not mine. No sub-line. No claim here: Apple's own panel explains what the picker shares, in Apple's words, and we put no copy of ours beside it (EXPERIENCE-AND-MOTION 2.6).

Shown / Records / Never / Decline: Shown is the label. Records nothing. Never: no permission string and no system alert from this row. Decline: not applicable, it is not an agreement.

---

## 4. The picker sheet (our parts only)

Apple's view inside the sheet is Apple's. Ours: the title row, the tray, the limit line, the body swap, Start and Not now. Strings:

| Key (proposed) | Option A | Option B |
|---|---|---|
| `en.moments.pick.title` | the day heading, for example "Saturday 14 June" (from the date, locale-formatted; no new words) | "Choose pictures" |
| Reason | The day is what the parent is working from; no extra word. | Right for the door route where no day is set. Use B only when there is no day. |
| `en.moments.pick.notNow` | Not now | Not now |
| `en.moments.pick.start` | Start | Start a letter |
| Reason | One word, the design spec's name, and never "Keep". | Says what happens next, but wide for the title row at AX sizes. |
| `en.moments.pick.tray` (group name) | Chosen | Your pictures |
| Reason | Plain. | Warmer; a second noun for the same thing. |
| `en.moments.pick.chosen` | {n} chosen | {n} in the letter |
| Reason | Counts what exists, which is allowed. | A picture is not "in the letter" until it is kept. A is accurate; B is not. I pick A. |
| `en.moments.pick.remove` (accessible name) | Remove picture | Put back |
| Reason | Names the act on the chosen picture. | Ambiguous. I pick A. |
| `en.moments.pick.limit` | You can add up to {max} pictures to one letter. | Up to {max} pictures in a letter. |
| Reason | Complete sentence, plain. | Shorter. The number {max} waits for the per-type limits decision (O-54). |
| `en.moments.pick.swap.toAll` | Show all pictures | Browse all pictures |
| `en.moments.pick.swap.toDays` | Back to days | Show days |
| Reason | Plain verbs; "Browse" is an app word and "Show days" repeats the ask card. | |

VoiceOver labels for the picker's controls:

| Control | Label | Notes |
|---|---|---|
| Body swap, to all | "Show all pictures" | Button; the state change is announced as "Showing all pictures". |
| Body swap, to days | "Back to days" | Button; announced as "Showing days". |
| Chosen picture, remove | "Remove picture" | Add the position, "Remove picture 2 of {n}". |
| Start | "Start" | Disabled until one picture is chosen; read as dimmed. |
| Not now | "Not now" | Closes the sheet. |

Shown / Records / Never / Decline for the picker: it is not an agreement. Records nothing until Start. Never: no copy of ours over or beside Apple's panel; no mention of other people in the pictures. Decline: Not now drops the picks and temporary copies with no dialog (EXPERIENCE-AND-MOTION 4.6).

---

## 5. First-run primers A and B

The sheet that rises over the tab when the parent taps Show days. It is the parent's own tap, so it is not an unprompted ask (RV-03). Continue then shows Apple's system alert; nothing of ours moves behind it. Continue and Not now are equal in size, outline and weight (EXPERIENCE-AND-MOTION 2.3).

Hard limit on the claim: counsel has not yet read Q8(b), the location claim (FREEZE-CHECKLIST: "Say what we receive, never where it lives", H-11). So no line that is built to ship may say that place or location is read. Primer A, the PRD's base text, says place, so A is PROPOSED-HELD. Primer B as the PRD wrote it also says place; below I give B without it so a primer can exist that makes no location claim.

### Primer A (PROPOSED-HELD until counsel reads Q8(b))

Text, copied from PRD 16.1 so it can be compared, not edited:

> `en.moments.primer.a.body`: {app} reads the date, the time and the place of your pictures, on this phone and only while Moments is open, to suggest days to tell {child} about.

Why held, in one line each:
- "the place" is a location claim (Q8(b)).
- "on this phone" says where it lives; the freeze note says say what we receive, never where it lives. Counsel decides.
- "only while Moments is open" is a limit with no proof I could check (UNVERIFIED; `mobile` to confirm it is a code fact before any word like "only" is used).
Not for the shipped build and not for review packets until those three are cleared.

### Primer B (the challenger, O-55), written without location

| Key (proposed) | Option 1 | Option 2 |
|---|---|---|
| `en.moments.primer.b.body` | You can choose pictures yourself any time. If you would like suggestions, {app} can read the date and time of your pictures while Moments is open. | Choose pictures yourself any time. Or let {app} read the date and time of your pictures to suggest days to tell {child} about. |
| Reason | Tells the parent the picker exists, which is B's whole point (it is the version that does not feel like a trap). Keeps the PRD's wording where it can. | Shorter, with the purpose (suggest days) stated and no "while open" limit I cannot prove. Gives up the PRD wording. **I now prefer 2.** It has no "Moments" inside a sentence, so the tab's name (Q1) can change without touching this line, and it carries no "while open" limit I cannot prove. Option 1 stays as the fallback only if `mobile` confirms the limit as a code fact. |
| `en.moments.primer.title` | Show days from your pictures? | Suggestions from your pictures |
| Reason | Repeats the ask card, so the sheet feels like the same question. | Names the sheet, but sounds like a setting. I pick the first. |
| `en.moments.primer.continue` | Continue | Show days |
| Reason | The design spec's word; Apple's alert follows. | Names the result but the alert is next, so "Continue" is the more honest verb. I pick the first. |
| `en.moments.primer.decline` | Not now | Not now |

VoiceOver labels for the primer: Continue reads "Continue"; Not now reads "Not now, show days from my pictures later" (matches the ask card pattern); the sheet is announced by its title, `en.moments.primer.title`, then the body in one swipe. Focus lands on the title when the sheet opens and returns to the ask card when it closes.

When counsel clears place, a one-sentence extension is possible ("and the place" after the date and time). I have not written it into a shipped form.

Never in a primer, per PRD 16.1: "allow", "access", "settings", "never", "only you", "safe", "private", "stays on your phone". Checked: none appear in B.

Shown / Records / Never / Decline (this is a thing a person agrees to, so all four, per COORDINATION section 10):
- Shown: `en.moments.primer.title`, `.b.body`, `.continue`, `.decline` exactly as above, plus the version of the Privacy Policy link only if counsel wants one on the sheet (not drafted).
- Records: the "primer answered" flag, on the phone (phone settings, level L2); and the answer from Apple's alert, which the phone holds. PRIV-R21 lists server-side consent rows, and the PRD says the library consent record is on the phone only (R166), so I expect no server row. `privacy` and `compliance-engineer` to confirm that reading; I have not.
- Never: no picture, identifier, date, coordinate or place leaves the phone; none goes in logs, crash reports or analytics (PRD R162); no text beside Apple's alert.
- Decline: Not now is equal in weight, writes the answered flag, and leads to a tab that works fully: real cards, the door row first, Export and Delete untouched (PRD R79). Withdrawal later is in Me, not by a second ask from us. A "Show days from my pictures" row at the same weight is the parent's own way back (ACC-1).

Out of this file, to flag: Apple's purpose string for photo library access (the `NSPhotoLibraryUsageDescription` text) is a separate surface that Apple shows. It needs the same claims check and is not drafted here.

---

## 6. Empty and state lines

One calm line and one action each, no apology, no "nothing yet", no count, no empty header (PRD R14, R69).

| State | Line (A) | Line (B) | Action | Reason |
|---|---|---|---|---|
| Tab heading (always) `en.moments.title` | Moments | Moments | none | Tab name per PRD; see Q1. |
| Job line (ACC-0) `en.moments.job` | Choose a day to tell {child} about. | Pick a day, then tell {child} about it. | none | A is the wireframe's wording. B echoes the PRD 16.1 "act" line. |
| Example card caption `en.moments.example` | An example | An example | none | Text and accessible name (R160). No photograph, no real name, no label in a parent's voice. |
| Recent, nothing to show | Days from your pictures will show here. | Pictures you choose can start a letter. | Choose pictures | A is about the tab, B is about the parent. A avoids "nothing"; both avoid any count. |
| Limited access, few cards (ACC-3) | Choose pictures to start from. | Pick pictures to start a letter. | Choose pictures | Plain; it does not say what the app can or cannot see (PRD KM2 asks for no claim about "only the chosen pictures"). |
| Limited, manager control at the foot | Choose which pictures | Update shared pictures | opens Apple's manager | Must look like a different kind of control from the door. B is more distinct from "Choose pictures"; A is the spec's word. I lean B for clarity (see Q3). |
| Denied (ACC-4) | Suggestions from your pictures are off. | You turned off suggestions from your pictures. | Open Settings | A is neutral. B is true but reads as a past choice the parent might regret. Pick A. Door row comes first. |
| Restricted (ACC-5) | Suggestions from pictures are off by a setting on this phone. | A setting on this phone has turned off suggestions from pictures. | none | No button, no reason named (PRD). Pick A. |
| Flag-off fallback | (no card) | | row: Choose pictures | PRD R270. |
| No kept letters | no "A year ago" card, no header | | none | The absence is the state (R79). No string. |
| Question card fallback | the prompt, from the 111, unchanged | | | `content` already owns these; no new words. |

Every one of these keeps to the PRD rule that "allow", "access" and "settings" appear in Moments only in the denied line and the Me row.

Shown / Records / Never / Decline: not an agreement. Records: nothing. Never: none of these lines is ever shown with a count of missing pictures or days.

---

## 7. The typed day label surface

The parent can name a day (up to 60 characters, typed, PRD 17). The label, and the other phone-held day marks, live in `moments.json` on the phone, outside the database. By the PRD they are excluded from iPhone backup and never sent to our servers (R201, RK-8, ADR 0032 pattern, status Proposed). So they do not come to a new phone. Counsel and `data-architect` to confirm that is how the shipped build behaves (ADR 0032 is still Proposed, and the export duty for these labels is open, G4 in `ALIGNMENT-data.md`).

| Key (proposed) | Option A | Option B |
|---|---|---|
| `en.moments.label.menu` | Name this day | Add a name |
| Reason | PRD verb. Matches Hide this day and Keep this day close. | Shorter, but "a name" could be read as naming a person. I pick A. |
| `en.moments.label.field` (placeholder) | A few words to find it by | A name for this day |
| Reason | Says what it is for and invites a short thing. | Plainer. Neither writes a sentence for the parent. |
| `en.moments.label.limit` | {n} of 60 | {n} left |
| Reason | Counts what has been typed. | "Left" is a countdown. I pick A. |
| `en.moments.label.save` / `.remove` | Save / Remove name | Done / Clear |
| Reason | The verb says the result. | Shorter. |
| `en.moments.label.disclosure` | Day names stay on this phone. They won't be on a new phone. | A name you give a day stays on this phone and doesn't move to a new one. |
| Reason | Two short sentences; says the fact first. Plain "a new phone" matches the instruction ("typed day labels do not move to a new phone"). | One sentence, but longer, and "moves" is a little technical. |

VoiceOver labels for the label surface: the field reads "Name this day, {dateHeading}" with the placeholder as its hint; the counter reads "{n} of 60" and is not announced on every keystroke; Save reads "Save name"; Remove name reads "Remove name, {dateHeading}".

Where the disclosure appears: once, under the field the first time a parent names a day, and again in Me where the names are listed. No fear tone, no "you could lose" wording, and nothing about what to do about it. I considered adding a second line telling the parent their letters are unaffected; I left it out because I have not verified that claim for every restore path. If it is verified, "Your letters aren't affected." is the line, and the reason is that a parent will wonder.

UNVERIFIED: that the marked day itself (the typed day, not only its name) also stays on the phone. The PRD lists "typed day" among phone-held facts, but I did not trace where the date is written. If the date is stored differently from the name, the disclosure covers the name only, and the key's wording must say "names", as above.

Shown / Records / Never / Decline:
- Shown: the keys above.
- Records: the label and its day key in `moments.json` (L4), on the phone.
- Never: the label is never logged, sent, put in a crash report, exported without a label saying so, copied into a letter or put in any notification (PRD R17, R201). A child's name can be in it; it is treated as the parent's own words.
- Decline: a parent can leave a day unnamed; every card works without a name. Removing a name is one tap; Erase and sign-out remove it.

---

## 8. The iPhone backup line for kept pictures

When a parent keeps a letter with pictures, a copy of each picture is stored in the app on the phone. Those copies are not excluded from the iPhone's own backup today (`FACT-CHECK-PRIVACY-EAS` finding 1; ADR 0028). So the copy can travel to the parent's own iPhone or computer backup. That backup is Apple's, run by the parent, and is not our encrypted backup. The decision is O-44: say it in the policy line, or exclude the folder. This line is the "say it" answer. If the folder is excluded, the line is dropped.

| Key (proposed) | Option A | Option B |
|---|---|---|
| `en.moments.keptPictures.backup` | Pictures you keep in a letter are copied into the book on this phone. They can also be in your iPhone's own backup. | A picture you keep in a letter is copied onto this phone, and your iPhone's own backup may include it. |
| Reason | Says what is true without claiming more: "can also be in". Two short sentences. | One sentence, hedged with "may". More hedged than the fact needs. I pick A. |

Status: counsel confirms (UNVERIFIED: Apple's behaviour for this folder). What I could check is that the repo has no exclusion call for the folder. What I could not check is exactly what Apple's iPhone backup does with it on the device. The words say "can", which is the strongest claim the evidence carries.

Terms: "iPhone's own backup" on purpose, because the glossary's "encrypted backup" is our own backup of the owner's recordings, and this line must never be mistaken for it. I avoid "iCloud" because I did not find a rule that allows the word, and because the backup may also be on a computer.

Where it appears: on the sheet where the parent first keeps a letter with a picture (once), and in the Privacy section of Settings with the other lines. Not on the tab.

Shown / Records / Never / Decline:
- Shown: the key above, with the Privacy Policy link counsel supplies.
- Records: nothing new; this is a disclosure, not an agreement.
- Never: no promise that the pictures are or are not encrypted or deletable from the iPhone backup, because deleting a letter does not reach a backup the parent holds.
- Decline: the parent can choose to keep a letter without pictures; the line does not gate Keep.

---

## 9. Notification text

The Moments classes (`typedDay`, `birthday`, `monthAge`) carry no child name and no age or month number on the lock screen, in any setting (PRD 13.3, R234, O-50). This is the stricter reading and I follow it. The planner in `planner.ts` and the keys `notifications.birthday` and `notifications.monthOpen` currently name the child and the month number when names are on; a code and key change is owed (R280). Nothing below uses `{child}`, a digit or a month number.

Further rules held: no word picture, photo, place, day, weekend or the tab's name in any notification (PRD 13.3, R196); the parent's own day label is never in a notification; no count, no "waiting", no urgency; invite, never remind; no exclamation mark; title 40 characters or fewer; body under 60 (the house target), and never over 110.

| Class | Option A (neutral) | Option B (names the class) |
|---|---|---|
| `typedDay` | Title: A date you marked. Body: A minute for the book, if you'd like one. | Title: For the book. Body: You marked this date. A few words, if you'd like. |
| Reason | A reveals only that it is a date; best for a lock screen. | B says "this date", so more of the class shows on the lock screen. Needs `privacy` to rule (O-50). |
| `birthday` | Title: A special date. Body: A few words for the book, whenever suits. | Title: A birthday for the book. Body: A few words, if you'd like. |
| Reason | A reveals nothing about whose or which. | B names the class but still no name or age. Same ruling needed. |
| `monthAge` | Title: A minute for the book. Body: Say a few words, whenever you like. | Title: A new month. Body: A minute for the book, if you'd like. |
| Reason | A is the VOICE.md "no name" example, reusable and says nothing about age. | B says "month" but gives no number. Same ruling needed. |

Evening class: unchanged (existing keys, existing rule). A library-timed nudge, if the founder signs it (O-02), must use an evening-class key word for word. I write no new line for it. The existing `previewPlaceholder` ("Something for the book, whenever you have a minute.") is reused when previews are hidden.

Open for `design-systems`, `product` and `privacy`: where a tap lands (O-22), which is not a copy question.

Shown / Records / Never / Decline (the notification opt-in is the agreement; the notification text above is what it shows when it fires):
- Shown: the opt-in row's words are the existing evening reminder ask; Moments adds no ask of its own in the first release. Library-timed nudges would need a separate opt-in with all four lines (PRD 13.2 item 3). Not drafted.
- Records: the existing notification consent as it is today; nothing new.
- Never: no child name, month number, place, picture, count or library-derived value in title, body or payload.
- Decline: the card the nudge points to is the same card in the tab, so declining notifications loses nothing (PRD 13.5).

---

## 10. Held, not shipped: the O-48 value-proposition pair

Recorded here so it is not lost, and kept out of shipped copy until the founder answers O-48 (FREEZE-CHECKLIST: "No public line uses them before that"). It is not a key and no section above uses it.

Status of both lines below: UNPUBLISHED, pending counsel Q130 (G2 Q1 and Q8). Nothing here may be used on the store page, the website or in the app until counsel answers and the founder approves.

- Line one (recorded, fallback): "Your words finish it"
- Line two (recorded, current): "{app} never adds a word to your letter"
- Superseded, withdrawn, not to be used: "We never write a word for you." Reasons: it says "we", against PRD D5-F3 (`docs/product/prd/28-moments-tab.md`, section 16, line 857), and it is wider than the live line "It never adds a word" (`packages/content/src/site.en.ts`, `store.en.ts`).

Compliance note for whoever writes the final text:
1. The second line must not say "we". It uses {app}, per D5-F3.
2. "{app} never adds a word to your letter" is the recorded form, with fallback line one "Your words finish it" if counsel narrows or declines the claim. It keeps the live promise ("It never adds a word") and adds only "to your letter", which names the place the promise is about. Counsel (Q130, G2 Q1 and Q8) confirms that this width is true: Word for word does remove and repair and does add punctuation and paragraph marks (see the council's finding on D-133 in `WRITING-GUIDE.md` section 1). Anything longer, such as "for you", is not recorded.
3. The earlier line one, "Pictures start the story. Your voice finishes it.", used "story", which the glossary bans in favour of "letter" (and writing-guide principle 11 on slogan rhythm applies). It is replaced by the fallback "Your words finish it". The word and the cadence remain for the founder and the CMO to decide.
4. Store and website only after approval. Not in the app, a notification or an email.

---

## 11. Open questions for the founder and the owners

| # | Question | Owner | Why it matters |
|---|---|---|---|
| Q1 | Is "Moments" the public tab name given that the glossary lists "moment" as banned for a short piece a person makes? Either the glossary gets a row for the tab or the tab gets another name. | founder, `content` | Every key here is `en.moments.*`. A rename costs only keys, now. |
| Q2 | Add "picture", "day", "date" and "tab" to the glossary? "Photo" stays Apple's app name only. | `content` | Decide once, then lint. |
| Q3 | Limited access: keep the spec's "Choose which pictures" for Apple's manager or use "Update shared pictures"? | `design-systems` | Two controls with near-identical words on one screen. |
| Q4 | Does ADR 0032 (moments.json outside the backup) ship as stated, and is the typed day's date held the same way as its name? | `data-architect`, `mobile` | The day-name disclosure (section 7) is only as true as that. |
| Q5 | Counsel: Q8(b) location claim, and "on this phone" and "only while open" wording in primer A. | `legal` | Primer A stays held until answered. |
| Q6 | Counsel: confirm the iPhone-backup line, and whether Apple's behaviour for the folder is what I say (UNVERIFIED). | `legal`, `mobile` | The line says "can", not "is". |
| Q7 | `privacy`: the primer's Records line says phone only, no PRIV-R21 server row. Confirm. | `privacy`, `compliance-engineer` | The agreement lines depend on it. |
| Q8 | `privacy` and `product`: option A or B for Moments-class lock-screen text (O-50, R280). | `privacy`, `product` | Decides how much of the class shows on a locked phone. |
| Q9 | Does "Not now" on a day card return tomorrow as the PRD says? The toast "Back tomorrow." claims it. | `product`, `mobile` | If the timing differs, use the other toast. |

Not in this file: reason lines on cards, the day-sheet heading, the Me rows, the host-sheet strings beyond section 4, and the store and website copy (planned by `marketing`). Those are the rest of BL-925 (12a and 12b).
