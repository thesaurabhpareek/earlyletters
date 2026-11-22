# Add a book: screen spec (GAP-05)

Status: DRAFT, PROPOSED, 21 Nov 2026. Author: `design-systems`. Docs only. Closes GAP-05 of `docs/design/DESIGN-GAPS-21nov.md`. Founder ask, handoff #1181.

`IA-FINAL-20nov.md` 7.4 lists `/settings/children/new` as "add a child, first-run form reused" with no screen id and no states. The page is BUILT (`apps/mobile/src/app/settings/children/new.tsx` renders `components/child/add-child-form.tsx`; rules in `add-child-form.logic.ts`). This file gives it a proposed id and the states the design requires. Nothing was run on a device.

| Row | Screen id (PROPOSED) | Route | Source requirement | Owner | Status |
|---|---|---|---|---|---|
| AB-1 | C-S28 Add a book | `/settings/children/new` | NS-14 (whose book a letter goes to), NS-43 (setting up the first book), PRD B F2.1 as cited in the file | design-systems | PROPOSED |

Names: the built label is "Add a child"; the Me group rows "Add a book" and "Books" are PROPOSED words with no approved text (IA OI-3, `content`). This spec uses "the page" and does not choose.

## 1. Behaviour the design holds

Reached from Me, the books group. The first-run child step again, for one more book. Order: heading with a small book cover that takes the name after a 300 ms typing pause, the name field, the choice "born" or "expecting", the date (no date is ever chosen for the person; "Born today" is a chip), the reason line, one primary that waits. Free, no Plus gate (D-082, D-083): the free letters are one pool across every book. On Add the book becomes the active one and the person lands on the Book.

**Shown:** `onboarding.child.*`, `children.add.*`, `childrenExtra.*` (built). **Records:** the child on this phone and an analytics event only if analytics was agreed (`child_added`, no name, no date value, no text; PATH-05). **Never:** a pre-filled date; a name inside a placeholder sentence; gendered words (`{child}` only); a count of books or a "you have N"; a Plus prompt. **Decline and withdraw:** Back leaves with nothing written; a book is later hidden or deleted in its own page (C-S15, C-S16, C-S22).

## 2. Happy path

Open the page, the heading takes VoiceOver focus. Type "Asha". The date block arrives once the first letter is in. Choose born, tap "Born today" or pick a date. The reason line disappears, the primary reads "Add Asha's book" (or "Add this book" when the filled label would pass 22 characters). Tap: success haptic, the page closes to the Book showing the new cover.

## 3. States

| State | Exact screen | Copy key |
|---|---|---|
| OFF | Fully local; works offline, no state. | none |
| DEN, REV, EXP | n/a: no system permission, no expiry | n/a |
| EMP (opening) | Name empty, date block absent, primary dim and reads "Add this book", the reason line says a name is needed. Nothing red. | `childrenExtra.nameRequired`, `children.add.ctaShort` |
| Name near the limit | Helper line replaces the twins help once near `CHILD_NAME_MAX`; no counter bar. | `onboarding.child.nameLimit` |
| Name invalid | `checkChildName` fails (for example only spaces): reason line stays, focus stays in the field, typed text kept. | `childrenExtra.nameRequired` |
| Date missing | After a name: born needs a birthday, expecting needs a due date; the reason names the child only once a name is typed. | `onboarding.child.needBirthday`, `.needDueDate` |
| Date out of range | Birthday in the future or due date out of range: reason line says so; the date field keeps its value. | `childrenExtra.edit.birthdayFuture`, `.dueDateRange` |
| Waiting primary tapped | Reason line turns from quiet to raised, VoiceOver reads it, focus moves to the field that is missing. The button is read as dimmed with the reason as its hint. | built |
| ERR (save fails) | The local write fails: the page stays, text kept, ST-NOTICE with Try again; words CONTENT-NEEDED. UNVERIFIED: `addChild` is called without a catch. | CONTENT-NEEDED |
| SLO | n/a: local write | n/a |
| FUL | Phone full on write: use the `errors.phoneFull` pattern (ST-INLINE), the typed values stay. | `errors.phoneFull.*` |
| INT | App killed mid-typing: nothing is kept; the page opens empty (same rule as first run, `PRD 19` row 260). | none |
| DEC | Back with typed text: leaves without a confirm sheet; nothing was saved. UNVERIFIED: no "discard?" sheet in the build; none is required for a form this short. | none |
| Twins | The twins help line is the only mention; a second book with the same name is allowed. | `children.add.twinsHelp` |
| AX5 (SE 3) | The cover moves under the heading (`useCoverPlace`), the keyboard leaving under 480 pt hides it; fields grow; the primary scrolls with the content and is not pinned (ST rule, SCREEN-PATHS section 0); the reason line sits directly above it and is never cut. | built |
| Dark | Date control and chip meet 3:1 outlines; the reason line 4.5:1 in muted tone. | none |
| Reduce Motion | The date block appears with a cross-fade only; the cover takes the name with no per-letter motion. | built |
| VoiceOver | Order: heading, name, born or expecting, date, Born today, reason, primary. Heading takes focus on open. | built |
| Voice Control | "Tap Born today", "Tap Add Asha's book" work from visible labels. | built |

## 4. Gaps this spec leaves

- ERR and FUL lines are CONTENT-NEEDED (`content`).
- Whether Add a book should show the first-run promise line again: not ruled (`product`).
- `mobile`: confirm the UNVERIFIED rows above.

Signed: `design-systems`, 21 Nov 2026.
