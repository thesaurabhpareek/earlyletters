# DoorRow

Owner: `design-systems`. Status: PROPOSED, not built. Sources: DC-1 (FOUNDER-DECIDED), DC-7 O-17, R270, R287, R75, R76, R106, EXP 2.2, 3, PRD 8.1, 8.1a. Shared rules: `README.md`.

## 1. Purpose
The door is the quiet text row that opens the host sheet (`07-picker-bars.md`) with Apple's body, so a parent can choose pictures without the library read. One verb family and one component serve the tab, the day sheet's "Choose other pictures" row and capture Add (R270). Opening it is never a permission request and never leads into the primer or the ask card (R279).

## 2. Anatomy
- A `ListRow` text row: title from the door key family (`copy.moments.door.*`, PLACEHOLDER keys; the word family is "Choose pictures", `content` owns it), a chevron (a pressable row shows one). Not a filled button, not red, no count, no "allow".
- An optional one-line purpose from `content`, `subhead`, `textMuted`.
- The Limited-library control is a different component of a different kind: `LimitedManagerRow`, a row with its own label that differs from the door's by more than one word, opens Apple's limited-library manager, with its own one-line purpose. The two are visibly different kinds (O-17, R270).

## 3. Where it sits, by state (DC-1)
| State | Placement |
|---|---|
| ACC-0 never asked | A quiet row below the ask card, never beside it, never inside the primer or ask. At AX1 and above the order is ask card, door, then the example |
| ACC-1 Not now | First row; the re-ask row follows at the same weight and never above it |
| ACC-2 full | Last row of Recent, quiet |
| ACC-3 Limited | Door in the calm line block when few or no cards result (R287: one calm line and the door as a "Choose pictures" button); at the foot of Recent two rows of different kinds: `LimitedManagerRow` then the door |
| ACC-4 Denied | First row, then the calm line with Open Settings (both text rows) |
| ACC-5 Restricted | First row, then one plain line, no button |
| Flag off | First row; no re-ask row. If the whole photos switch (R106) is off, the door is absent |
| Quiet, hidden, hard-stretch, expecting-only book (R253) | The door stays |
| Granted, no days | One calm line and "Tell {child}" then the door |
Never a third button on the ask card, never in the primer, never in a notification.

## 4. States
| State | What shows |
|---|---|
| Default | Row as above |
| Pressed | `ListRow` press feedback |
| Opening | The door's rise into the host sheet (EM-02); Reduce Motion a `motion.fadeMs` cross-fade |
| Hidden | Absent (not disabled); nothing says it is missing |

## 5. Tokens
`ListRow` as built: `text`, `textMuted`, `line`, `accent` (chevron or text emphasis as `ListRow` does), `focus`; `layout.gutter`, `layout.listRowMin`, `target.min`; `Text` `callout`, `subhead`; `motion.fadeMs`, `motion.standard`. No haptic (PRD 14.3: the door is silent).

## 6. Dynamic Type
Default: one line, row at least `layout.listRowMin`. From AX1: the title wraps, the chevron moves to the trailing edge or under the title, row grows; at AX5 never truncates. At AX1 and above in ACC-0 its position follows the table above. The door label never exceeds what wraps: no abbreviation.

## 7. VoiceOver and order
One element per row; name is the visible label; role button; the hint (a content key) says the result, not the label again, and says it opens a picker of Apple's, not that it "allows". The door is after the ask card in reading order in ACC-0, before the re-ask row in ACC-1, ACC-4 and ACC-5. A G4 task (R270) tells the Limited-library control and the door apart on a screenshot; the two accessible names also differ by more than one word.

## 8. Motion
Silent, one rise or fade. Nothing animates in on the tab; the row is present from the first frame of the state.

## 9. Targets
At least `target.min` tall and full width; 8 pt (`space[2]`) clear of a neighbouring control that is not a row.

## 10. Words
All from `packages/content`: the door label (one family, tab, day sheet and capture Add), the optional purpose lines, the `LimitedManagerRow` label and purpose. No "allow", "access" or "settings" in the door family; the ACC-4 Open Settings line is the one allowed place. Counsel and `content` write the final words; the order test of G4 runs both ways with the ask card and primer.

## 11. Shown, Records, Never, Decline (PRIV-R21)
Shown: the row and an optional one-line purpose that says the pictures are chosen in Apple's picker. Records: nothing; choosing pictures is not stored by the door (the picks are held in memory until Start). Never: any event (O-38, O-49 stay No), any measurement of door use, a count. Decline: not opening the door changes nothing; every feature keeps working (R79).

## 12. Test list
- DR-T1 L0: a placement table, state to position, for ACC-0 to ACC-5, flag off, quiet book and no days; matches section 3.
- DR-T2 L2: in ACC-0 the door is not a child of the ask card or primer and not beside it; at AX1 the order is ask card, door, example.
- DR-T3 L2: ACC-1 renders the door above the re-ask row; ACC-4 above the Open Settings line.
- DR-T4 L2: opening the door never calls an authorization request (L1 scan, R70).
- DR-T5 L2: tab door, day sheet row and capture Add use one component and one key family; no two adjacent labels differ by one word.
- DR-T6 L2: `LimitedManagerRow` label differs from the door's by more than one word (content test).
- DR-T7 L3: default and AX5, light and dark; nothing truncates; no red.
- DR-T8 L4: element order, names start with the visible label, hint does not repeat the name.
- DR-T9 L2: no event, log or analytics call in the file (CLAUDE.md privacy rules).
- DR-T10 L5: G4 five-parent task T4 (door shown against hidden, as evidence, not a gate) and the Limited versus door screenshot task.

## 13. Android later
Same code. The Android picker is a separate spec.
