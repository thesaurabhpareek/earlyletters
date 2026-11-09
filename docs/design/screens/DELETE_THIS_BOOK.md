# Delete this book, Recently deleted and Restore: screen spec

Owner: `design-systems`. Status: written 9 Nov 2026 from the code at develop `6cd2223b` (the book flow is PR #520, BL-387). Not run on a device. What only a phone can show is marked **Device** and has a row in S1-133 or S1-153 (`docs/qa/DEVICE_TEST_PLAN.md`).

How to read this file:
- **Built** is what the code does. **Spec** is what the screen should do; every place the build differs is in section 11 with file and line.
- **PROPOSED** is a proposal waiting for the person named. **OPEN (owner)** is a design decision nobody has made yet. Words marked PROPOSED WORDING are the founder's to approve.
- File and line numbers are at `6cd2223b`. Paths start at `apps/mobile/src/` unless they start with `packages/` or `docs/`. `delete-book.tsx` is `app/settings/children/delete-book.tsx`.

Sources: F17 6.2 D, DATA-REQ-014, DATA-REQ-053, F17-REQ-080 (as the code names them); D-085 (30 days, Restore, Erase now); EXPERIENCE_PASS S38 and S39 for the letter shelf this extends; BL-776 and the CPO's ruling on it, CPO-2 (open PR #723); the design-systems audit of 9 Nov (rows 5, 6, 14) and the Chief Design Officer's note of 9 Nov (defect 5, the CCO-6 open item). The audit and the note were written in the council round of 9 Nov and are not in the repository, so each verdict this file takes from them is stated where it is used.

Strings are keys in `packages/content/src/strings.en.ts`, `copy.settings.delete.*` unless another prefix is written. No word is typed in a screen. This spec adds no new words except where marked PROPOSED WORDING.

Erase everything on this phone is a different screen: a native alert, no typed word, and it does not use Recently deleted (it erases at once and cannot be undone). It is specified in `screens/SETTINGS_AND_ACCOUNT.md` section 12 once PR #596 lands.

## 1. Purpose

A parent who wants a whole book gone can say so in two calm steps, with a way to save a copy first. The book then waits 30 days in Recently deleted, where Restore puts it back (the code says exactly as it was; S1-133 (b) checks that every letter and the draft come back) and Erase now ends the wait. No server is involved, because this flow exists only on a phone that has never signed in (`localDeletionAllowed`, `lib/store.ts:939`).

The words stay plain and gentle: no loss language, no countdown, no count of what is left (D-085).

## 2. Layout

Where it lives: Settings > {child's name} > Delete this book (`app/settings/children/[id].tsx:156-168`, a destructive `ListRow` in a section of its own, below Hide this book when there is one: Hide shows only with two or more books, `[id].tsx:148`). Recently deleted opens from Settings home (`app/settings/index.tsx:148`) and from Settings > Privacy (`app/settings/privacy.tsx:138`).

Step 1 (`delete-book.tsx:89-115`):

```
  (native header)  Delete this book
  Delete the whole book?                          title2, heading
  Every letter and recording in Asha's book
  will be removed from this phone.                body
  You have 30 days to change your mind.
  After that, it cannot be restored.              body
  +----------------------------------------+
  | (file)  You can export everything      |      Card raised, heading
  |         first, free.                   |
  | [ Export everything ]                  |      Button lg, self-start
  +----------------------------------------+
  [            Continue                    ]      Button outline lg, full width
  [         Keep the book                  ]      Button quiet, full width
```

Step 2 (`delete-book.tsx:41-87`), the same route, the page remounts under `key="confirm"`:

```
  (native header)  Delete this book
  Delete the whole book?                          title2, heading (same words as step 1)
  You have 30 days to change your mind.
  After that, it cannot be restored.              body
  Type delete to confirm                          TextField label
  [                                        ]
  [         Delete the book                ]      Button destructive lg, full width
  [         Keep the book                  ]      Button quiet, full width
```

Recently deleted, with one book waiting (`app/settings/recently-deleted.tsx:110-121`):

```
  Letters you delete wait here for 30 days.       subhead, muted
  +----------------------------------------+
  | Asha's book                            |      headline
  | Deleted October 13. Kept here until    |      footnote
  | November 12.                           |
  | [ Restore the book ]  [ (bin) Erase now ]|    secondary md, destructive md
  +----------------------------------------+
  (letter cards follow)
```

## 3. Parts, library components and tokens

| Part | Component | Notes |
|---|---|---|
| Page | `ScrollView` with `gap-7 px-5 pb-12 pt-4`, `contentInsetAdjustmentBehavior="automatic"` | Step 2 adds `keyboardShouldPersistTaps="handled"`. |
| Header title | `Stack.Screen` title `deleteBookRow` | Native, so it follows the platform's own size and motion. |
| Headings | `Text` `title2` `asHeading` | `title2` caps at 2.0x (`tokens.type.title2`). |
| Body | `Text` `body` | Uncapped. |
| Export card | `Card` raised, radius `md`, padding 4; Phosphor FileText 24 in `accent`; `Text` `headline` `asHeading`; `Button` primary `lg` | `copy.settings.export.button` opens `/settings/export`. |
| Typed word | `TextField` | Label always visible. Auto-capitalize, auto-correct, auto-complete and spell-check are off. `returnKeyType="done"`. |
| Confirm | `Button` destructive `lg` full width | Ready: `bg-destructive` fill from a `className` override (the variant has none, `button.tsx:58`; section 11, item 10), label `onDestructive`. Not ready: 1 pt `input` (controlBorder) edge, label `textMuted`, disabled. |
| Way out | `Button` quiet | Both steps call `router.back()`, which leaves the flow (it does not return to step 1). |
| Result | `Toast` through `useToast`, `haptic('warning')` | See section 7. |
| Shelf card | `Card` raised radius `md` padding 4; `Button` secondary `md`; `Button` destructive `md` with the Trash icon | Erase now shows only where the build can erase everywhere (`shelfActions`, `components/book/shelf.logic.ts:112`). |
| Erase now question | `ConfirmSheet` (`Sheet`, no Close) | "Keep it" is the large default; "Erase now" is the destructive button with the Trash icon. |

The typed word is `bookTypeWord`, matched without regard to case and with spaces around it ignored (`typedWordMatches`, `components/settings/wipe.logic.ts:8`). It is the same rule as account deletion.

## 4. States

| State | What shows |
|---|---|
| Step 1 | As in section 2. Export first is offered, never forced. |
| Step 2, word not typed | Confirm is disabled: edge only, label `textMuted`, VoiceOver says dimmed. Built: nothing tells the person what turns it on (section 11, item 3). |
| Step 2, word typed | Confirm fills with `destructive`; label `onDestructive`. |
| Saving | None. The delete is one local database transaction (`deleteBook`, `lib/store.ts:949`), so there is no loading state to draw. |
| Done | `warning` haptic, a toast with `bookDeletedToast`, and `router.dismissTo('/settings')`. The toast announces itself. |
| Error | Built: none. If `deleteBook` answers false (the book is gone, or the phone signed in while the page was open) the tap does nothing after the haptic. Spec: one line above the buttons, icon plus words plus `announce()`, as Erase everything does. Words OPEN (`content`). |
| Missing book or signed-in phone | Built: a blank page (`return null`, line 37). Spec: `StateScreen` `notFound`. Reached only by a stale screen or a link, because the row is hidden in both cases. Words OPEN (`content`). |
| Recently deleted, a book waiting | One card per deleted book above the letters. The date line is the two existing keys joined: "Deleted October 13. Kept here until November 12." Never a count or days left. |
| Recently deleted, nothing waiting | `StateScreen` empty, art `page`, `shelfEmpty` ("No deleted letters."). Built: the line and `shelfHelp` mention letters only, not books. OPEN (`content`). |
| Restore the book | `tap` haptic, toast `bookRestoredToast`, the card leaves. Every letter, draft and choice is back as it was. Restore is refused once an erase has begun. |
| Erase now | The sheet asks (`bookEraseNowTitle`, `bookEraseNowBody`), `warning` haptic on the confirm, then toast `bookErasedToast`, or `bookEraseFailedToast` when a recording would not go. A failed erase takes the book off the shelf, and the next launch finishes it. |
| Day 30 | The launch purge erases the book for good (`purgeExpired`, `lib/store.ts:886`). Built: nothing in the app warns the person before the purge, and the shelf shows no countdown or days left (D-085; EXPERIENCE_PASS S38). Whether a warning before day 30 is wanted is not decided here: OPEN (CPO). |

### The sole-book problem (ruled: BL-776, option (a); placement OPEN)

Both steps promise 30 days to change your mind, and the toast says the book is in Recently deleted. For a phone with one book, the door to Recently deleted can close behind the person. Facts from the code:

1. Deleting the only book removes the active-book setting (`lib/store.ts:955-959`). No visible book is left, so `getFamily()` is null (`lib/store.ts:379`).
2. The Book tab and Tonight both redirect to first run when no visible book exists (`app/(tabs)/book.tsx:318`, `app/(tabs)/index.tsx:203`).
3. A cold start with no book opens first run as the first route and mounts no tabs (`app/_layout.tsx:72-79`, `lib/transitions.logic.ts:137-139`).
4. First run has no route to Settings (no `/settings` link in `app/onboarding.tsx`). Settings opens only from Tonight and the Book.
5. So after a cold start the person cannot reach Recently deleted until they make a new book. The 30 days still run, and the launch purge erases the old book at day 30 (`lib/store.ts:900`).

What the person sees in the same session right after Delete the book, and whether `dismissTo('/settings')` or the Book tab's redirect to first run wins, only a phone can show (**Device**, S1-153 row (a)).

**Ruling.** The CPO ruled option (a) of BL-776: onboarding shows the existing Recently deleted row while a deleted book waits. No new line: the row and its words (`settings.delete.recentlyDeleted`) already exist, so the founder's approval for new lines (D-144) is not triggered. The CDesO places it on the screen. The acceptance in the ruling: delete the only book, cold start, Restore brings it back, walked on a phone. The ruling is CPO-2 in `docs/agents/exec/RULINGS.md`, in open PR #723 and not merged yet. `docs/BACKLOG.md` BL-776 still reads `needs-decision` until `product` moves it (PR #715 holds that row's edits). The council round that gave the ruling is not in the repository. The other two options in BL-776, (b) the delete step says what to do after a restart and (c) Delete this book is not offered on the only book, were considered and not chosen.

**Spec.** While a deleted book waits (`listDeletedBooks().length > 0`) and the phone has no visible book, first run shows the existing Recently deleted row, which opens the shelf. Nothing else on first run changes, and a new install sees nothing. The root layout adds the tabs as soon as a book exists (`useTabsInStack`), so what the person sees after Restore there is **Device** (S1-153 row (a)).

**OPEN (CDesO, placement).** Which first-run step carries the row, and how it sits. What the code says bears on it: the age question and the agreement box (F2) come first, and the shelf is a route in the Settings stack, which is built to open from Tonight or the Book (`app/settings/_layout.tsx`). Opening it from first run, and the way back from it, are untried.

**PROPOSED WORDING (founder).** The CDesO also suggested, as an interim, that the toast after Delete the book carries "Undo" (`copy.common.undoButton`) and does not time out, like the letter-delete toast (`book.tsx:205-236`); Undo calls `restoreBook`. It is not part of the ruling and covers the same session only. The word exists, but it adds a button to a toast that carries a promise, so it is marked PROPOSED WORDING. Drop it if the row from the ruling is enough.

## 5. Dynamic Type, to AX5

- Every line wraps and nothing truncates. The page is a scroll view, so each control is reachable.
- Buttons grow with their labels; the 44 pt floor is a minimum, not a height (`button.tsx:254`).
- `title2` stops growing at 2.0x. Body, headline and button labels are uncapped.
- Step 1: the export card's heading wraps beside its 24 pt icon; the icon does not scale.
- Step 2 with the keyboard up: the page sets no keyboard inset (`delete-book.tsx:52`), and the Done key hides the keyboard. At AX3 and AX5 the confirm button may sit under the keyboard until it is hidden. **Device** (S1-153 row (b)).
- Recently deleted: the two shelf buttons sit in a wrapping row (`flex-wrap`), so at AX5 they stack. Letter excerpts keep two lines and a fade; every word is in the VoiceOver label (`ExcerptFade`).

## 6. Dark mode and contrast

Token pairs, computed from `packages/design-tokens/src/tokens.ts` with the WCAG 2.x formula. Light / dark.

| Part | Pair | Ratio |
|---|---|---|
| Body and headings | `text` on `bg` | 14.00 / 15.66 (tokens.ts comments) |
| Muted label, disabled confirm | `textMuted` on `bg` | 5.51 / 8.01 |
| Disabled confirm edge | `controlBorder` on `bg` (3:1 needed) | 3.62 / 4.47 |
| Ready confirm label | `onDestructive` on `destructive` | 5.35 / 7.42 |
| Ready confirm fill against the page | `destructive` on `bg` | 5.05 / 7.65 |
| Shelf card text | `text` on `surfaceRaised` | 14.83 / 14.29 |
| Shelf date line | `textMuted` on `surfaceRaised` | 5.83 / 7.32 |
| Restore the book label | `text` on `accentSoft` (`secondary-foreground`, `button.tsx:71-77`) | 12.07 / 11.20 |
| Restore the book fill against its card | `accentSoft` on `surfaceRaised` | 1.23 / 1.28 |
| Erase now label | `destructive` on `surfaceRaised` | 5.35 / 6.99 |

The destructive words carry the meaning, never the colour. Built: the two Erase now buttons carry the Trash icon; the Delete the book button carries none (section 11, item 4).

Restore the book is a `secondary` button on a raised card. Its label passes, and its fill is a tint with no edge (1.23 / 1.28). This is the same weakness the design-systems audit found on Call and Text (`screens/STRUGGLING.md` section 6). The `outline` variant (`controlBorder` on `surfaceRaised`: 3.83 / 4.08) would show its shape. Not decided for this button. **OPEN (design-systems)**: one rule for `secondary` on a card, in `COMPONENTS.md` 2.1.

Increase Contrast swaps to `tokens.highContrast`; the card edge in dark mode is already a 1 pt `line`.

## 7. Reduce Motion, haptics

- Built: the step change is a plain remount, so nothing moves and Reduce Motion needs nothing. The toast and the pop to Settings follow the system.
- Recently deleted: letter cards fade out over `exitMs` (`fadeMs` under Reduce Motion) and the rows below close up on `standard`; book cards are not in that wrapper and leave at once (`recently-deleted.tsx:110-121` against `:153`). Reduce Motion changes only the letter cards' timing.
- Haptics (MOTION 6, COMPONENTS 0.2): `warning` on the tap that deletes; `tap` on Restore the book; `warning` on the Erase now confirm. None on Continue, Keep the book, opening the sheet or opening the page.

## 8. VoiceOver

Order, step 1: back, "Delete this book" (the native title), "Delete the whole book?" (heading), the two body lines, "You can export everything first, free." (heading), Export everything, Continue, Keep the book.

Order, step 2: back, the title, the heading, the second body line, the field "Type delete to confirm", Delete the book (dimmed until the word matches), Keep the book.

Spec:
- On Continue, focus moves to the new step's heading (`useFocusOnMount`, `lib/a11y.ts:77`, keyed on the step), the rule `Sheet` already follows and the one `screens/SETTINGS_AND_ACCOUNT.md` section 1 sets for Settings pages once PR #596 lands. Built: no focus move and no announcement, so focus likely stays on the removed Continue button. **Device** (S1-153 row (b)).
- The heading text is the same in both steps, so the focus move alone may not tell a listener that anything changed. **OPEN (CDesO with `content`)**: give step 2 its own heading words, or send focus to the field. Until then the default is the heading.
- The disabled Delete the book carries a hint that says what turns it on. PROPOSED: reuse `bookTypeToConfirmLabel` ("Type delete to confirm") as the hint, and no hint once the word matches. No new words. Open PR #714 does this.
- The delete result is spoken by the toast. Recently deleted reads each book card as one group (name and date line), then its two buttons. Restore and Erase now each announce their toast.
- The destructive button reads its words; colour is never the signal.

## 9. Copy keys

`settings.delete`: `deleteBookRow`, `bookTitle`, `bookBodyThisPhone`, `bookUndo`, `bookExportFirst`, `bookTypeToConfirmLabel`, `bookTypeWord`, `bookConfirm`, `bookKeep`, `bookDeletedToast`, `bookCardTitle`, `restoreBookButton`, `bookRestoredToast`, `bookEraseNowTitle`, `bookEraseNowBody`, `bookErasedToast`, `bookEraseFailedToast`, `recentlyDeleted`, `shelfHelp`, `shelfEmpty`, `deletedOn`, `erasesOn`, `eraseNow`, `keepButton`. Also `settings.export.button`, `common.continueButton`, `common.undoButton`.

Not used here: `bookBody` and `bookBodyCoParent` are for a signed-in phone, where the server holds the book too. That path is not built (F17 6.2 D step 5).

### The agreement parts (COORDINATION section 10, PRIV-R21; applied by analogy)

COORDINATION section 10 gives a requirement the parts Shown, Records, Never and Decline when it touches sign-in, consent, the age step, account deletion or a support action on an account. Deleting a book is not on that list. Whether it takes them is an open point for the CPrivO (section 12). The parts are written out here as if it did, so the answer costs nothing either way. They are not "the four lines" of D-144, which is the name for the Erase screen's four sentences.

- **Shown** (design-systems and `content`): `bookTitle`, `bookBodyThisPhone`, `bookUndo`, `bookTypeToConfirmLabel`, `bookConfirm`, `bookKeep` (and `bookExportFirst`). The Erase now sheet shows `bookEraseNowTitle` and `bookEraseNowBody`.
- **Records** (PROPOSED, for privacy to confirm; section 10 gives this part to `mobile`, `sync` and `data-architect`): one local settings row for the book with the time it was marked (`lib/db/repos/wipe.ts:39-44`), and one while an erase runs. No server row, no consent row and no analytics event for the book actions: `delete-book.tsx` and the book handlers in `recently-deleted.tsx` (`:93-108`) call no `track`. A letter restore on the same screen does (`recently-deleted.tsx:69`), with no names. Nothing leaves the phone.
- **Never** (PROPOSED, for privacy to confirm): no letter text, recording or child name in a log, crash report or event. The typed word is not stored.
- **Decline** (behaviour as built): Keep the book, Back, or leaving the page changes nothing. Export everything stays available at every step, and Restore stays available for the 30 days.

## 10. Device steps

- S1-133 rows (a) to (c) check the flow, Restore and Erase now (PR #520). Row (h) is the VoiceOver and AX5 pass for Erase everything.
- S1-153 rows (a) and (b) check the sole-book outcome (before the BL-776 row, and after it) and the step 2 focus, keyboard and hint (before and after PR #714).

## 11. Where the build departs from this spec

1. No focus move or announcement on Continue (`delete-book.tsx:111`, `:52`). Fix for `mobile`: `useFocusOnMount` on the step heading. Pin: a source test that the hook is used. Done in open PR #714.
2. The sole-book promise is not kept after a cold start (section 4). Ruled: BL-776 option (a), CPO-2. `mobile` builds it; the CDesO places the row.
3. The disabled confirm has no hint (`delete-book.tsx:72-82`). Fix for `mobile`: `accessibilityHint={d.bookTypeToConfirmLabel}` while the word does not match. Done in open PR #714 (`confirmHint`).
4. Destructive actions carry an icon plus words (DESIGN_LANGUAGE 2), and this one does not: `delete-book.tsx:72-82`. The Delete this book row has none either (`children/[id].tsx:158-164`; `ListRow` draws none, `components/ui/list-row.tsx:83-102`). Erase now already has the Trash icon (`recently-deleted.tsx:118`, `:206`). Fix: pass `icon={TrashIcon}`; give a destructive `ListRow` a leading icon (design-systems).
5. A failed delete does nothing (`delete-book.tsx:46-49`). Needs an error line; words OPEN.
6. A missing book or a signed-in phone shows a blank page (`delete-book.tsx:37`). Fix: `StateScreen` `notFound`.
7. No keyboard inset on step 2 (`delete-book.tsx:52`). **Device** first; then `KeyboardAvoidingView` as Write does (`app/write.tsx:310`).
8. The shelf's help and empty lines name letters only (`strings.en.ts:821-822`, used at `recently-deleted.tsx:149`, `:139`). OPEN (`content` with counsel and the founder: D-085 sent the shelf's 30-day wording to counsel, and D-132 keeps what people are promised with the founder).
9. Book cards leave the shelf without the fade letter cards have (`recently-deleted.tsx:110-121`). Low.
10. The ready confirm gets its fill from a class override on a variant that has none (`delete-book.tsx:78`, `components/ui/button.tsx:58`). COMPONENTS 2.1 now records this page's form as PROPOSED (an edge until the typed word matches, then a `destructive` fill with an `onDestructive` label, only on a confirm page). Until design-systems decides it (OPEN 9) it is a departure. Low.

## 12. OPEN decisions

| # | Question | Owner |
|---|---|---|
| 1 | Where on first run the existing Recently deleted row sits (BL-776 option (a) is ruled, CPO-2) | CDesO |
| 2 | The interim Undo on the delete toast, if the row is not enough | Founder (PROPOSED WORDING); CDesO suggested it |
| 3 | Step 2 heading: its own words, or focus on the field | CDesO with `content` |
| 4 | Words for the error line and for the missing-book page | `content`; the founder approves new lines |
| 5 | Whether the shelf's help and empty lines name books, and what they promise | `content` with counsel; the founder (D-085, D-132) |
| 6 | Whether a warning before the day-30 purge is wanted | CPO |
| 7 | Whether deleting a book takes the agreement parts (Shown, Records, Never, Decline) | CPrivO |
| 8 | One rule for `secondary` buttons on a card (Restore the book here, Call and Text in `STRUGGLING.md`) | design-systems |
| 9 | The confirm page's filled destructive form in COMPONENTS 2.1 | design-systems |
