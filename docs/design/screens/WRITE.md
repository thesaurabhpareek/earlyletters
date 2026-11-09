# Write: screen spec

Owner: `design-systems`. Status: written 9 Nov 2026 from the code at develop `6cd2223b`. Not run on a device. What only a phone can show is marked **Device** and has a row in S1-36, S1-142, S1-152 or S1-153 (`docs/qa/DEVICE_TEST_PLAN.md`).

How to read this file:
- **Built** is what the code does. **Spec** is what the screen should do; every place the build differs is in section 11 with file and line.
- **PROPOSED** is a proposal waiting for the person named. **OPEN (owner)** is a design decision nobody has made yet. Words marked PROPOSED WORDING are the founder's to approve.
- File and line numbers are at `6cd2223b`. Paths start at `apps/mobile/src/` unless they start with `packages/` or `docs/`.

Sources: EXPERIENCE_PASS S19 and S20 and 5.8 rows 3, 3a and 5a (`docs/design/EXPERIENCE_PASS_2026-10.md`); BL-560, F14-REQ-040, F04-REQ-045 and founder decision F5 for the standing Plus line; BL-E1 for Another thought; the design-systems audit of 9 Nov (rows 1, 16); the Chief Design Officer's note of 9 Nov (defect 2). The code also cites `engagement.md`, which is not in the repo; the rules for the Plus line on Tonight are in `screens/TONIGHT_AND_MEMORIES.md` section 3 once PR #596 lands.

In flight: PRs #701 and #703 make the first book's name optional and edit `app/write.tsx` (the prompt fill). Line numbers here will move; the labels in this spec use `{child}`.

Strings are keys, no word is typed in a screen.

## 1. Purpose

A parent types a letter the way they would say it. It feels like paper, not a form. Every pause in typing saves a draft on the phone, so a closed sheet or a crash loses nothing. Typed words are kept exactly as typed; the machine never touches them (CLAUDE.md constitution). Write also opens from Review for a recording whose words could not be written down (`?draftId=`).

## 2. Layout

Write is a modal page sheet (`lib/transitions.logic.ts:49`). At standard text sizes (`app/write.tsx:304-364`):

```
  [ Saved on this phone ]                         [ Close ]     ModalHeader
  ASHA, 17 MONTHS                                              letterDateline, caps
  What was the funniest thing today?                            prompt, muted
  [ (arrows) Another thought ]                                  quiet, small
  Write it the way you would say it.                            the page (letterBody)
  ...
 ------------------------------------------------------------
   Adding new letters to the book needs Plus. Recording,        PlusLine (when shown)
   reading and export are always free.
  [          Add to Asha's book                  ]              primary, large
  [             Keep private                     ]              quiet
```

The two buttons are stacked at every size, "Add to Asha's book" full width and "Keep private" quiet under it, so the main action never breaks over two lines (P4 critics' pass S2). EXPERIENCE_PASS S19 still says side by side; the build and this spec say stacked.

At accessibility sizes (AX1 and up), **Spec**:

```
  [ Close ]                                                     ModalHeader
  Saved on this phone                                           its own row, can wrap
  ASHA, 17 MONTHS
  The prompt
  [ (arrows) Another thought ]
  The page ...
  [          Add to Asha's book                  ]              last things on the page,
  [             Keep private                     ]              inside the scroll view
   Adding new letters to the book needs Plus. ...               PlusLine, last
```

## 3. Parts, library components and tokens

| Part | Component | Notes |
|---|---|---|
| Room | `SafeAreaView`, `Lamp` scene `write` | Anchor top, 0.5, still: nothing breathes while someone types. |
| Keyboard | `KeyboardAvoidingView` `padding` on iOS | Offset is the sheet's own top (`sheetKeyboardOffset`), so both buttons sit above the keyboard. The keyboard comes up once the sheet has measured itself (`createFirstFocus`), never by `autoFocus`. |
| Header | `ModalHeader` | Close is a quiet 44 pt button, top right. The autosave status is `leading`, left. |
| Status | `Text` `footnote` with a 14 pt Phosphor Check or WarningCircle in `textMuted` | A live region (polite). Never a status colour: this is lit paper (D-110). |
| Dateline | `Text` `letterDateline` caps | The child's name, a middle dot, then the age ("Asha" and "17 months"). VoiceOver reads the dot as a pause (`spokenSeparator`). |
| Prompt | `Text` `prompt` `tone="muted"` | The one literary line above the page. |
| Another thought | `Button` quiet `sm`, Phosphor ArrowsClockwise | `-ml-4 self-start`. |
| Page | `TextField` `variant="letter"`, label hidden | Uncontrolled (D-057): the keyboard's autocorrect, QuickType, dictation and composing keyboards are never interrupted, and the words are never written back into the field. `scrollEnabled={false}`: the field grows with the words and the sheet scrolls. |
| Footer | `Button` primary `lg` full width; `Button` quiet full width; `PlusLine` | `border-t border-border bg-background px-5 pb-2 pt-3` when pinned; Review's inline shell (`gap-1 pt-2`, `app/review.tsx:793`) when inline. |

Tokens: `motion.fadeMs`, `motion.exitMs`, `motion.enter.durationMs`, `target.min`, `target.primary`. No colour, size or duration is a literal in the screen.

### The footer rule at accessibility sizes (Spec)

`footerPlacement(useIsAccessibilitySize())` decides, as it does on Review and Tonight (`lib/review-layout.logic.ts:14`; `app/review.tsx:199`, `app/(tabs)/index.tsx:123`). `'pinned'` below AX1 (as built). `'inline'` from AX1 up: the Plus line (when shown) and both buttons are the last children of the `ScrollView`'s content, after the page, with no top border and no background of their own.

Why: by a rough count a pinned footer of this size cannot fit with the keyboard up. The Plus line since #668 is 89 characters in `footnote` (14/19 pt). A rough count, not measured:
- AX3 (2.643x): about 18 to 21 characters on a 335 pt line, so 4 to 5 lines of about 50 pt, roughly 210 to 250 pt for the line alone.
- AX5 (3.571x): about 13 to 16 characters a line, so 6 to 8 lines of about 68 pt, roughly 400 to 540 pt for the line alone.
- "Add to Asha's book" and "Keep private" each break over two lines at AX5.

The audit and the CDesO both read this as: from AX3 the footer is taller than the room above the keyboard, so the page can leave the screen and "Add to Asha's book" with it (audit row 1; CDesO defect 2). The size of an SE 3's keyboard and the true heights are **Device** (S1-153 row (c)).

Two rules go with `'inline'`:
- **The caret follows the page, not the footer.** Built, the page scrolls to the end of the content after the text grows, when the caret is at the end (`app/write.tsx:264-269`, `followCaretToEnd`). With the footer inside the content, "the end" is the footer, which at AX5 can be taller than the visible area. The scroll target becomes the bottom of the page field. A pure function for the offset is the pin.
- **Add and Keep private stay reachable with the keyboard up.** `keyboardShouldPersistTaps="handled"` is already set (`write.tsx:313`), so a tap on a button works while the keyboard is open.

### The standing Plus line

The rules are `screens/TONIGHT_AND_MEMORIES.md` section 3 (PR #596): one line, `footnote` `textMuted`, no count, no button, never a card, nothing to press, the same on Write as on Tonight, and VoiceOver reads it last. The words are `billingCopy.tonight.plusLine`; the words and the rule that decides when it shows are `content`'s and #508's, not this file's.

- Shows when `plusLineShows` is true: not an alpha build, letters kept read at least once, and the Keep step would offer Plus (`components/tonight/tonight-plus.logic.ts`). Letters kept is read once when Write opens and never awaited, so until it is read the line is absent and typing never waits on it (`write.tsx:87-99`).
- **Position, Spec (CDesO, 9 Nov, defect 2): under the buttons**, so VoiceOver reads it after the two destinations and the eye reads it as a note on Add, not a gate in front of it. Built: above the buttons (`write.tsx:355-359`), and above Speak and Type on Tonight (`app/(tabs)/index.tsx:254`). BL-560 and S1-142 set "above". The move is one position on two screens. **Founder to confirm** (section 13).
- It wraps at every size and nothing is cut; S1-142 row (b) is where that is checked.

### Another thought

A quiet control under the prompt for a new letter that opened with one (BL-E1, S1-152). A press swaps the line in place from the hand-written library, never one already shown in this sheet until all that fit are used up (`anotherThought`, `components/tonight/prompt.logic.ts`); nothing ever says "no more", and there is no count.

- Offered only for a new letter that opened with a prompt (`anotherThoughtShown`, `prompt.logic.ts:96`): not for a draft being continued, not when the page has words. A letter keeps the question showing when its words are first saved.
- At the first character it fades out over `fadeMs` and holds its space, so nothing moves near the cursor. It fades back in when the page is empty again. While hidden it is not read and takes no touch.
- A press: `tap` haptic; the old line fades out over `exitMs`, the new one fades in where it stood, and the button slides with the height change (`layout` on the prompt and on the button's wrapper, `LinearTransition` over `motion.enter.durationMs`); the new line is announced once; focus stays on the button so a second double-tap swaps again.
- 44 pt target. At AX5 the label wraps under the prompt and is never cut.

## 4. States

| State | What shows |
|---|---|
| Empty, new, with a prompt | Dateline, prompt, Another thought, the placeholder `tonight.typing.placeholder`. Add and Keep private are off (outline style, label `textMuted`). |
| Empty, new, no prompt | No prompt and no Another thought. |
| Continuing a draft, or typing for a recording | The prompt the draft carries; no Another thought; the words so far. |
| Typing | Another thought fades out. Add and Keep private turn on at the first non-blank character. One render when the page goes from empty to words and back, otherwise none per keystroke (`pageEmptinessChanged`). |
| Saved | After a pause: "Saved on this phone" with a check, a live region, announced at most every 10 s. It stays. |
| Not saved | "Not saved yet" with a warning glyph, in the same place, announced each time a write fails. The write is tried again on the next pause. While it shows, Close, Android's back and the swipe down hold the sheet open, so the words are never lost (`writeSwipeAllowed`). |
| Loading | None. The page is a field. Letters kept is read in the background (above). |
| Error | "Not saved yet" is the one error. It names what did not happen and the words stay on screen. |
| Plus line | Shown or absent as above. |
| Keep | One tap on Add or Keep private writes the newest words first, hands the letter to Review's one Keep step (`armKeep`), and replaces Write with Review. The Keep gate decides there as for a spoken letter (D-082, D-083): the saved moment and the Book, or the Plus sheet with the letter waiting on Tonight. |

## 5. Dynamic Type, to AX5

- Nothing truncates. The page grows with the words; the sheet scrolls.
- From AX1 the autosave status has its own row under the header, where it can wrap, instead of running into Close (`write.tsx:246-248`, `:311-312`). Built.
- `letterDateline` stops at 2.4x. The prompt, the page, the footnote and the button labels are uncapped. The letter face follows Dynamic Type and the in-app Reading Size.
- Footer: pinned below AX1, inline from AX1 (Spec, section 3). Buttons are minimum heights and grow with their labels.
- Every control is at least 44 pt: Close, Another thought, both buttons.

## 6. Dark mode and contrast

The footer is opaque `bg`, so its text is on `bg`. Light / dark.

| Part | Pair | Ratio |
|---|---|---|
| Plus line, status, dateline | `textMuted` on `bg` | 5.51 / 8.01 |
| Add to Asha's book | `onAccent` on `accent` | 5.82 / 8.11 |
| Add, Keep private off | label `textMuted` on `bg`; edge `controlBorder` on `bg` | 5.51 / 8.01; 3.62 / 4.47 |
| Keep private | `accent` on `bg` | 5.50 / 8.37 |
| Prompt on the lamp's pool | `textMuted` over the `write` scene | asserted by `test/lamp.test.ts` for every scene (DESIGN_LANGUAGE 2b) |

The status line uses `textMuted` with an icon, never `caution` or `success`: Write is lit paper (D-110). Increase Contrast swaps to `tokens.highContrast`.

## 7. Reduce Motion, haptics

- Reduce Motion: the prompt swaps at once with no slide (`write.tsx:278-280` give `undefined`); Another thought's opacity is set at once; the status line still fades in over `fadeMs` (a fade is allowed); the lamp is still. The sheet itself is the platform's.
- Haptics: `tap` on Another thought. None on typing, on Add, or on Keep private (Review plays the outcome).

## 8. VoiceOver

Order at standard sizes: the status (when shown), Close, the dateline ("Asha, 17 months"), the prompt, Another thought (when offered), the page ("Your letter"), then the footer. Spec: Add to Asha's book, Keep private, the Plus line. Built: the Plus line, Add, Keep private (S1-142 expects this order today).

At AX sizes the order is Close, the status, the dateline, the prompt, Another thought, the page, Add, Keep private, the Plus line (Spec).

- A new prompt is announced once. The saved line is announced at most every 10 s; "Not saved yet" each time a write fails.
- Built: no element on Write is a heading, so the rotor's Headings has nothing on this page; the first text is the dateline (`write.tsx:314-316`). **PROPOSED (design-systems):** the dateline is the page's heading, level 1. **Device** first (S1-153 row (c)).
- The page has a hidden label "Your letter".

## 9. Copy keys

`pendingCopy.write.label`, `write.autosaved` (`pendingCopy.write.savedOnPhone`), `write.notSaved`, `tonight.typing.placeholder`, `tonight.newPromptButton`, `review.destination.addButton`, `review.destination.addButtonShort`, `review.destination.privateButton`, `common.closeButton`, `billingCopy.tonight.plusLine`. Prompts come from `PROMPTS`.

Typed words are stored exactly as typed, trimmed at the ends and nothing else (`writeWords`, `review-view.logic.ts`).

## 10. Device steps

S1-36 (typing at speed), S1-142 (the Plus line on Write, including AX5 with the keyboard up), S1-152 (Another thought), S1-153 row (c) (the footer at AX3 and AX5 with the keyboard up, and the rotor).

S1-142 row (b) expects both buttons above the keyboard at AX5. That is the behaviour this spec changes; its **Update** line points here.

## 11. Where the build departs from this spec

Line numbers at `6cd2223b`.

1. **The footer is pinned at every size and sits outside the scroll view** (`write.tsx:353-362`). Spec: `footerPlacement`, inline from AX1. `write.tsx` does not import it (imports at `:46-64`). Owner `mobile`. Pins: a source test that `write.tsx` uses `footerPlacement`; a logic test of the footer's height at each size. **High.**
2. **The Plus line is above the buttons** (`write.tsx:355-359`; Tonight `app/(tabs)/index.tsx:254`). Spec: below them. Founder to confirm.
3. **Scroll-to-end follows the content's end** (`write.tsx:264-269`). Needed with item 1: target the page field.
4. **No heading on the page** (`write.tsx:314-316`). PROPOSED, **Device** first.
5. **Two documents describe the old footer.** EXPERIENCE_PASS S19 says the buttons sit side by side; S1-142 row (b) expects both above the keyboard at AX5. The docs follow the build once item 1 lands.
6. **The page field has no `layout` transition** (`write.tsx:331-349`; only the prompt and the button wrapper have one, `:319`, `:327`). When a new line has a different height the field may jump, where S1-152 row (a) expects it to slide. **Device** (S1-152 row (a)). Low.
7. After #701 and #703 merge, the dateline (`write.tsx:284`) and the Add label (`addButtonLabel(child.name)`, `:360`) must read well with no name. That is theirs; the check is S1-153 row (c) on a nameless book.

## 12. Hand-offs

- `mobile`: items 1 to 4 and 6.
- `content`: nothing new. The Plus line's words stay as they are.

## 13. OPEN decisions

| # | Question | Owner |
|---|---|---|
| 1 | Plus line under the buttons (CDesO's verdict) or above (BL-560 as built) | Founder to confirm; CDesO |
| 2 | The dateline as the page's heading | design-systems after the Device check |
