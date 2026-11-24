# Design requirements and proposed words for the council rows (24 Nov 2026)

Owner: design-systems. Status: PROPOSED. For the CDesO, CPO, CPrivO, CMO and content to rule (CR-176); a builder picks each row once ruled.
Sources: `docs/BACKLOG.md` rows named below, `docs/design/COMPONENTS.md`, `MOTION.md`, `EXPERIENCE_PASS_2026-10.md` S36, `CONFORMANCE-21nov.md` F-27, TDD 09 A11Y-F03, `packages/content/WRITING-GUIDE.md`.

Held words: every line marked PROPOSED here is held for the content owner and the council. Nothing here is written to `packages/content/src`, and no string is final until a ruling is recorded. Each proposed line was read against the guide: contractions, no em or en dash, no curly quotes, no emoji, no fear, guilt or loss words, never implies AI writes, `{child}` never a gendered word, no "please", "just", "simply" or "safe", internal terms (take, entry, draft, pack) kept out. Not run: `npm run lint:copy` and `rules.test.ts` do not read this file, so the content owner runs them when a line moves into `strings.en.ts`.

Not verified: nothing here was run on a device or simulator. Figures from the rows (44 pt, 18 pt, 2.44) are arithmetic on token values read in `packages/design-tokens/src/tokens.ts`, not a Dynamic Type run.

Shared rules for every block below: targets 44 pt; Dynamic Type to AX5 with letter text never truncated (D-027); colour never the only signal; both themes; Reduce Motion gives a 200 ms fade or no motion (MOTION section 4); no timers on anything with an action (rule 11.5).

## Summary of recommended rulings

| Row | Ruling in two sentences |
|---|---|
| BL-396 | Retire the root large-title clause for v1.0: tabs carry their own titles and the three built pieces (ModalHeader, BackButton, Sheet Close) already satisfy the rest of the Done-when. Narrow the row to "two header forms and one Sheet" and close it. |
| BL-2020 (and BL-2005) | Lift the sheet title cap so the title scales with the body and is never smaller than the text under it; letter text still never truncates. One token row follows the ruling. |
| BL-1742 | Confirm CPrivO-28 as an exec ruling: swipe-down on the Photos primer persists nothing and only "Not now" records a decline. Karma records it; no founder step under CR-176. |
| BL-1744 | The spec holds (O-22): a Moments link or notification lands on Moments at scroll 0, For you, no highlight; evening lands on Home. Product rewrites the row's title and Done-when to match. |
| BL-1856 | Fix the site phone mock to Home, Book, Me whatever the live state; it is one array and a public claim. The web lane makes the change. |
| BL-371 | Keep Undo as the S36 toast that persists until dismissed (A11Y-F03 holds) and amend the Done-when; a full-width button would repeat the blank page S36 removed. Recently deleted and the 30-day purge are already built. |
| BL-376 | Keep "no Record again on a no-speech letter" by design; the person can write the words or keep the recording, and a new letter belongs on Tonight. Edit the row's Done-when. |
| BL-388 | Recently deleted letters go in the export only when "Include recently deleted" is ticked, which matches `build.logic.ts` (`include_recently_deleted: false`). Then split ZIP64, orphan recordings and the tick into their own rows. |
| BL-1446 | Approve one state line with no count and no list, and a Remove now button that retries once. CPrivO confirms the line makes no promise that removal will finish. |
| BL-1487 | Yes, drop the lens thumb frame on a load error, with no error text; hold the card height where the layout allows and cross-fade the change where it does not. Low stakes: the lens is off in store builds. |
| BL-1472 | One picture first (O-62 default, CPO-58); mark the row deferred. Six pictures return only if a later ruling asks for them. |
| BL-385b (FT-56) | Siblings in first run get a "Same birthday as {child}" switch that is off by default, with a date row per child when off. No silent default (D-087 holds). |

## BL-396 Root large-title ScreenHeader variant

What the person sees: nothing new. Home, Book and Me each draw their own title; pushed screens use the native chevron back; modals use `ModalHeader` with "Close" top right; sheets use the Sheet header (COMPONENTS 2.12, navigation rule at line 423).
Requirement (if ruled as recommended): the row is rewritten to "two header forms (pushed, modal) and one Sheet remain"; the clause "root large title" is deleted from Scope and Done-when; "Root titles share one y position across tabs" moves to a test row (`navigation.logic.ts` tab title top offset), not a new component.
States: no new states. Dynamic Type: tab titles use `title1` (cap 1.8) and wrap, never truncate. VoiceOver: the title is a heading (`asHeading`). Motion: none; no collapsing large title (it would add a scroll-linked animation Reduce Motion must then undo).
If the council wants the variant instead: it needs its own row, a spec for the collapse (MOTION 5), and the cap decision for `title1` at AX5.

## BL-2020 and BL-2005 Sheet title against body text at AX3 and above

BL-2005: the id belongs to PR #1851 (BACKLOG line 10693) and is not a row on develop at the time of writing; this block answers the sheet-title question that row is understood to carry. Confirm when #1851 lands; if it asks something else, this block covers BL-2020 only.
Facts read: `sheetTitle` is 22 pt serif, `maxScale` 2.0, so the title stops at 44 pt (`tokens.ts:303`). `body` is 18 pt and uncapped (`tokens.ts:267`). The body passes 44 pt at a scale of 2.44. Above that the body under the title is larger than the title.
Requirement (recommended: lift the cap): `sheetTitle.maxScale` becomes uncapped (null) so title and body scale together and the title stays at least 22/18 of the body at every size. Layout: the title wraps to as many lines as it needs; the sheet scrolls; nothing truncates; the Close button stays at the top right and keeps 44 pt (it grows taller, not clipped). The sheet opens at the large detent from AX3 so the title and first line of body are both in view.
VoiceOver: unchanged (the title is the heading and takes focus on open). Motion: unchanged (native sheet, no content entrance, MOTION 5i).
Tests: a token test that `sheetTitle` size times scale is at least `body` size times scale for scales 1 to 3.12 (AX5); a component test of a sheet with a long title at AX5 that asserts no `numberOfLines`.
Alternative options for the record: keep the cap and accept the overtake (heading no longer reads as larger); cap the body in the sheet (breaks the uncapped body rule, TDD 09 C1). Not recommended.
Done: the ruling and the numbers go into COMPONENTS 2.12 (design-systems writes them after the ruling); then a token row.

## BL-1742 Photos primer: swipe down

What the person sees: the primer sheet before Apple's Photos prompt. "Not now" records a decline. Swiping the sheet down returns to the door row in the unanswered state, with no alert and nothing written. Tapping the door row opens the primer again.
States: empty (never asked): door row; error: if the system prompt cannot show, the primer stays and a calm line appears (content owns it, no new words proposed here); offline: no change (nothing leaves the phone).
Dynamic Type and VoiceOver: the primer is a `Sheet` with `dismissible` true for this case; VoiceOver two-finger Z (escape) is the same as swipe down and writes nothing; the "Not now" button is the only way to record a decline and is labelled "Not now". At AX5 the buttons stack and the sheet scrolls.
Motion: native sheet dismissal; nothing added.
Ruling needed: exec ruling that confirms CPrivO-28 (it edits G-05 and R73). No legal answer needed; no data is written, which is the point.

## BL-1744 Moments link or notification landing

What the person sees: opening a Moments link or notification (`typedDay`, `birthday`, `monthAge`) lands on Moments at the top with For you selected and nothing highlighted; `evening` lands on Home. App lock comes first. No wash, no scroll-to, no card moves (O-22, `moments-motion-spec.md:100`).
States: Moments flag off: the link opens Home (the feature is dark); locked: the lock screen first, then the landing; offline: the same landing from local data, no spinner.
Dynamic Type and VoiceOver: focus lands on the Moments tab title heading, not on a card; no announcement of the day the link named. Motion: tab change only (cross-fade `fadeMs`, no slide); Reduce Motion: instant.
Row edit for product: title "Moments link or notification lands on Moments at the top by kind (O-22)"; Done-when "each kind lands as O-22 says, with App lock first, and no card is highlighted". The design backlog wording "opens the day it names" is stale and is retired.

## BL-1856 Website phone mock tabs

What the visitor sees: a phone mock whose tabs read Home, Book, Me, the same as the app (D-161: Family is never a tab).
Requirement: the array at `apps/web/src/content/site.ts:138` becomes `'Home', 'Book', 'Me'` in the film and the live mode alike; the mock's screen content matches those tabs. A visitor on a screen reader gets the mock as a labelled image whose text says what it shows; the tab labels are not read as live controls.
Ruling: CMO and CPO fix it either way; no need to know `SITE_MODE`. Words: these three are app tab names already in the app's strings; no new line. Public claim: the CMO signs it (D-125 item 9).

## BL-371 Delete: Undo as a toast

What the person sees and hears: Delete opens the confirm sheet with "Keep it" as the default. Confirm returns to the Book at once; the card collapses out of its row (height to 0 and fade over `exitMs` 160). One toast sits above the tab bar: "Letter deleted." with Undo and Close. It has an action, so it has no timer and goes when the Book is left (S36, A11Y-F03). Undo restores the card in place with the existing wash. A full-width Undo button on a page that no longer exists is not built.
States: loading: none (local); offline: the same (tombstone queues through the outbox; Undo sends the restore); error: if the restore fails the toast stays and says what the existing failure line says.
Dynamic Type and VoiceOver: the toast stacks its text above its actions from AX1 and never truncates; "Letter deleted. Undo available." is announced; with VoiceOver on the toast is focusable and the 10 s extension in COMPONENTS 2.14 is superseded by "no timer" (rule 11.5); the Undo target is 44 pt. Motion: `enter` y 8 to 0 plus fade; Reduce Motion 200 ms fade; collapse becomes an instant removal.
Row edit: Done-when line "Undo is a button on the page for as long as the page is open" becomes "Undo is a toast action with no timer until the Book is left (S36)"; Scope line likewise. Words: existing `settings.delete.entryToast` "Letter deleted." and `common.undoButton` "Undo" are unchanged; none proposed.
Data answer: CPrivO confirms that the tombstone and 30-day purge behaviour in the row is unchanged by the toast form (it is).

## BL-376 No-speech letter offers no "Record again"

What the person sees: the waiting card and the letter page for a take with no words show "No words in this one" with two ways forward, "Keep the recording" and "Write the words" (words-state.logic.ts, state `noWords`). No "Try again" (the same audio gives the same result) and no "Record again" (a new letter belongs on Tonight).
States: empty-take (0 bytes) keeps "Record again" and "Type it instead" (it says nothing was recorded); failed, unsupported and unreadable are unchanged. Offline: the same, nothing here needs the network.
Dynamic Type and VoiceOver: buttons stack and grow at AX1 and above; the card title is read first, then the two actions in order; the recording stays playable and labelled with its date. Delete is a quiet, lower-emphasis action. Motion: none.
Row edit: Done-when "A no-speech letter offers Record again" becomes "A no-speech letter offers Write the words and Keep the recording; an empty file offers Record again". No new words; the app never fills in words (constitution).

## BL-388 Export and recently deleted letters

What the person sees: on the Export screen, a switch row "Include recently deleted", off by default. Off: the export holds the book as it stands. On: letters in Recently deleted are in the ZIP in their own folder and in the manifest, marked as deleted.
Proposed words (PROPOSED, content and CPrivO to rule): switch label "Include recently deleted letters"; help when off "They're not in the export." ; help when on "They're in a separate folder, marked as deleted. They stay in Recently deleted for 30 days." The help lines state what the file will hold, nothing more.
States: no recently deleted letters: the row is hidden (nothing to include); building: the existing wait line, no percent; error and offline: the existing export failure line; the switch is not saved between exports.
Dynamic Type and VoiceOver: the row is a native switch with its label and the current help as the value; at AX5 the label wraps and the switch moves below it; never truncated. Motion: switch toggle only; Reduce Motion unchanged.
Split after the ruling: ZIP64, orphan recordings folder and the tick are three rows (the row is L).
Answers needed: CPrivO and CLO (children's data in export; Privacy Policy section 14 and `DELETION_AND_EXPORT_SPEC.md` 4.1 must say the same; if the policy text changes it goes to counsel and the exec review before it publishes). The words above wait for that answer.

## BL-1446 Storage line for a recording still being removed

What the person sees: in Me, Storage, one state line and one button: "A recording is still being removed" with "Remove now" below it. Never a list or a count. The line shows only when a let-go recording has failed to delete on 3 launches.
Proposed words (PROPOSED, held, BL-925 and content): state line "A recording is still being removed." Button "Remove now" and hint "Tries again to remove this recording." (both already in the strings as PROPOSED). If Remove now does not finish: "That didn't finish. We'll try again when you open the app." The existing placeholder "A recording you let go is still on this phone." says the same fact; the council picks one, and this block recommends the new line because it is shorter and names no storage place.
States: empty: no line, the screen is as today; loading: the button shows busy and keeps its label as the accessible name; error: the failure line above and the button returns; offline: unchanged (removal is local).
Dynamic Type and VoiceOver: the line and button stack; the line is read before the button; the button hint is read after a pause; at AX5 the button is full width and grows taller. The line is text, not colour or an icon only. Motion: the line appears and leaves with a 200 ms fade (`fadeMs`); Reduce Motion: instant; no loop.
Answers needed: CPrivO confirms the line does not promise removal will finish (it says "is still being removed", a state, not a promise) and that the stuck-job counter is not logged with a name or a path.

## BL-1487 Lens thumb frame on a load error

What the person sees: a lens card whose thumbnail cannot load shows the card without a thumbnail and without a frame, as B-S04 `.thumbMissing` says: no error text, no broken-image glyph.
Requirement: on `onMissing` the frame is removed (CONFORMANCE F-27). On a phone at default text sizes the thumb is 72 pt beside the text; if the text block is shorter than 72 pt the card gets shorter, so the card height moves once. Rule: the height change is a `LinearTransition` on `standard` (MOTION), and instant under Reduce Motion; the list does not jump the scroll position of rows above it.
Dynamic Type and VoiceOver: at AX the thumb stacks above the text (up to 160 pt); dropping it shortens the card the same way. The card's accessible label is the letter's, never mentions the picture failing; the thumbnail was never read as its own element.
Ruling: recorded yes by the B motion owner unless the height move is not accepted, in which case a follow-up row keeps a 72 pt empty space (not recommended: it reads as a blank). No words. The lens is off in store builds, so risk is low.

## BL-1472 One picture first

What the person sees: a letter holds one picture in the first Moments door (CPO-58, O-62 default). The pending set stays `PendingPhoto` with one `PhotoSession`. Adding a second picture replaces the first after a confirm, in the words the existing Change flow uses.
States and access: unchanged from spec 01 (thumbnail at most 160 pt above the Speak control, Change as a 44 pt quiet button). Dynamic Type and VoiceOver: unchanged.
Ruling: mark BL-1472 deferred to a later release; BL-1447 and BL-1453 do not wait on it unless six pictures are chosen. No words; no legal answer.

## BL-385b Siblings and birthdays in first run (FT-56, D-087)

BL-385 is ready; D-087 settled the no-silent-default part. The sibling part needs a line for a switch the row names ("Same birthday" switch). This block is the requirement and the held words.
What the person sees: on the child step, after a second child is added, each child after the first has a switch "Same birthday as {child}" (the first child's name), off by default. Off: that child shows its own birthday row. On: the row is hidden and the first child's date is used.
Proposed words (PROPOSED, held for content and the council): switch label "Same birthday as {child}"; help when off "Each child can have their own date."; the existing "Twins or more? Each child gets their own book." and `needBirthday` "Choose {child}'s birthday to continue." stay. No line says "twin" at a person who did not say it, and none guesses gender or order.
States: empty: the first child alone shows no switch; error: a missing date uses `needBirthday` naming the child, and Continue shows why it is waiting; offline: nothing needs the network. Changing the first child's date while the switch is on moves the others with it, and a quiet line is not needed.
Dynamic Type and VoiceOver: the switch row is one element, "Same birthday as {child}, off", with a hint "Turn on to use the same date"; at AX5 the label wraps above the switch. Names are read as typed. Motion: the date row for that child expands and collapses with `LinearTransition` on `standard`; Reduce Motion: instant.
Answers needed: none legal. Content owner rules the two lines.

## Open questions for the council

1. BL-2005 is not a row on develop (PR #1851 holds the id). Which question does it carry, and does BL-2020's ruling answer it?
2. BL-388: does the Privacy Policy section 14 text need to change, and does counsel or the exec review see it first? (legal and data answer)
3. BL-1446: CPrivO answer on the "still being removed" state and the counter; which of the two existing lines wins. (data answer)
4. BL-1856: is the live site showing the old mock (row 1856 asks Karma to record `SITE_MODE`)? It does not change the fix.
5. BL-1487: does the B motion owner accept one card height change on a load error?
6. BL-385b: does the switch default off, or does a second child start with the first child's date? The block recommends off, so no date is ever assumed.
