# Your words: screen spec and a naming conflict (GAP-03, GAP-04)

Status: DRAFT, PROPOSED, 21 Nov 2026. Author: `design-systems`. Docs only. Closes GAP-03 and raises GAP-04 of `docs/design/DESIGN-GAPS-21nov.md`. Founder ask, handoff #1181.

## 1. The conflict, stated first

Three files describe `/settings/your-words` three ways.

| Source | What it says the page is |
|---|---|
| `apps/mobile/src/app/settings/your-words.tsx` (built) and `IA-FINAL-20nov.md` 7.4 | The default for new letters: "Small fixes, marked" or "Exactly as said", with a static example. Setting `review.defaultView`. |
| `SCREEN-PATHS-20nov.md` PATH-12 (changed by E80) | A list of names the family taught the app, empty on a new phone, with "Add a name". |
| `SPEC-SYNC-20nov.md` E80, `functions/ai-and-speech.md` FR-AIS-34 | A dictionary of taught names (`DictionaryTerm`) that stays on the phone and is never synced. |

No taught-names screen or route was found on `develop` (the only matches for "taught" in `packages/content/src` and `apps/mobile/src` are page copy and haptics). So PATH-12 describes a page that is not built, under the name of a page that is. This is a ruling for `product`, not a drawing choice: either the names list is a second section on Your words, a new page under another name, or not in 1.0.

| Row | What | Source requirement | Owner | Status |
|---|---|---|---|---|
| YW-1 | Your words as built (default view choice): states below | constitution; NS-09; D-086 (cited in the file) | design-systems | PROPOSED |
| YW-2 | Taught names: where it lives, and whether it exists in 1.0 | E80, FR-AIS-34, PATH-12 | product (ruling), then design-systems | RULING, not drawn |

Until YW-2 is ruled, PATH-12's "Your words" EMP and ERR rows should be read as describing the taught-names list, not this page.

## 2. YW-1: Your words as built

Reached from Me, Writing. Title "Your words". One radio list (two options) with a one-line help under each, a static example card, and a footer. The choice only sets the default for new letters; Review's own control still changes a single letter.

**Shown:** `yourWords.title`, `.marked.label`, `.marked.line`, `.exact.label`, `.exact.line`, `.footer`, `settings.help.mistakes`, and the onboarding sample sentence (all built). **Records:** one phone setting, `review.defaultView`, local. No consent act. **Never:** any claim that the app writes, improves or polishes words; a preview that uses a real person's words (the example is the fixed sample); a third option that rewrites. **Decline and withdraw:** n/a, nothing is agreed; either choice is changed in one tap.

| State | Exact screen | Copy key |
|---|---|---|
| Happy | Two options, the chosen one marked by a filled radio and by its label being read as selected (not by colour alone). Choosing "Small fixes, marked" shows the example with the removed words struck through and muted; choosing "Exactly as said" shows the sentence unmarked. `tap` haptic on change. | built |
| OFF, SLO, FUL, INT | n/a: local setting, written at once, nothing waits on a network, nothing can fill up | n/a |
| DEN, REV, EXP, DEC | n/a: no permission, no expiry, no decline | n/a |
| EMP | n/a: two fixed options | n/a |
| ERR | The setting cannot be saved: the radio stays where it was and one quiet line says so (CONTENT-NEEDED). UNVERIFIED: the built `choose` does not catch a failed write. | CONTENT-NEEDED |
| First view | The saved value is read on open; a missing value shows "Small fixes, marked" (`DEFAULT_VIEW_SETTING` fallback, UNVERIFIED which). | none |
| AX5 (SE 3) | Option labels and helps wrap, never truncate; the example sentence wraps at `letterBody` with the struck words still readable (strike plus muted colour plus the VoiceOver label, never colour alone); radio rows grow to fit; the footer scrolls. | none |
| Dark | Struck-through words keep 4.5:1 for the muted text and 3:1 for the strike line (`editMark`) in both themes. | none |
| Reduce Motion | The example swaps with a cross-fade at most. | none |
| VoiceOver | Radio group announced as one choice among two with the selected one stated. The example is one element: its label reads the removed words as removed ("removed words" key `review.removedWordsA11y`), so the strike is not the only signal. | built |
| Voice Control, Switch Control | Visible labels work as commands; both radios reachable by scanning. | none |

## 3. YW-2: what design needs from product

1. Is a taught-names list in 1.0? If not, PATH-12 and E80's design lines should say "no screen" and the "new phone starts with it empty" line has nothing to describe.
2. If yes: its page name (not "Your words" while that name is taken), where it sits in Me, and whether names come only from the From sheet ("Names used on this phone", A-S09) or also from a teach-a-name field.
3. Whatever the answer, the constitution holds: a taught name changes only a mishearing, never adds meaning (FR-AIS-34), and the screen never offers to "improve" text.

No wireframe for YW-2 is drawn until it is ruled. States it would need once ruled: empty (one calm line, no count, no "0 names"), add, edit, remove with Undo, duplicate, too long (grapheme count, E10), offline (local, none), AX5, dark, VoiceOver custom actions for Remove.

Signed: `design-systems`, 21 Nov 2026.
