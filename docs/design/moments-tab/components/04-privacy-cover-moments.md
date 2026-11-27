# PrivacyCover reuse for Moments (scoped app-switcher cover)

Owner: `design-systems` for the component spec; `mobile` builds the gate. Status: PROPOSED, not built. Sources: G-01, DC-5 (FOUNDER-DECIDED), R102, R232, G7, EXP 4.7 items 4 and 5. Existing code: `apps/mobile/src/components/app-lock/privacy-cover.tsx`, `apps/mobile/src/lib/app-lock/machine.ts` (`coverShown`). Shared rules: `README.md`.

Status note (BL-2136, 25 Nov 2026, PROPOSED for `design-systems` and `product`): since BL-1407 (#1442, 22 Nov) the root `AppLockLayer` draws `PrivacyCover` whenever the app is not active, on every route, lock on or off. Every row where this spec asks for a cover is already covered by that one layer, so `MomentsCoverGate` and the focused-route signal of section 3 are not built; `shouldCoverMoments` is in `apps/mobile/src/lib/moments/cover.ts`, and `apps/mobile/test/moments-cover.test.ts` (PC-T1, PC-T3, PC-T6, PC-T8) fails the build if the root cover stops covering a row of the truth table. Build the gate only then. Open against the root layer: PC-T4 as written ("no animated style") is not met, because `app-lock-layer.tsx` always applies an opacity style, reset to 1 before paint and faded only after an unlock; `design-systems` should either accept that reading or ask for a change to the lock layer. PC-T5 and PC-T7 wait for the Moments sheets. The switcher snapshot itself is UNVERIFIED until the device rows D-15 (the Moments tab in the switcher, lock on and off, `docs/security/MEDIA_THREAT_MODEL.md`), D-20 and DM-09 (the picker in the snapshot) and G7 (PC-T9). D-1 runs on the letter page, Home, the Photos lens and Review, not on Moments. Under CR-145 the root cover also covers Home, Book and Me, so section 1's "Home, Book and Me are unchanged" no longer describes the build.

## 1. Purpose
With App lock off, the iOS app switcher still snapshots the screen. A day name, a thumbnail or Apple's picker view must never be in that snapshot of a borrowed unlocked phone. The founder decided: the cover is ON for the Moments tab and every Moments sheet whatever App lock says (DC-5). Home, Book and Me are unchanged (no new promise).

## 2. Reuse, not a second component
- `PrivacyCover` is reused as is: an opaque `bg` page with the mark only, drawn at once with no entrance animation, VoiceOver reads only the app name (`appLock.coverLabel`). It takes no text and no child name. The paper cover of EXP 4.7 item 5 (over Apple's view) IS this component (G-01).
- Move it from `components/app-lock/` to `components/ui/` as its own header already says (C-6 in `README.md`): one file, one import path, no behaviour change. Until then import it from where it is.
- New, small: `MomentsCoverGate` (a wrapper) and a pure function `shouldCoverMoments(route, appState, lockEnabled)`.

## 3. The focused-route signal (Moments-owned)
- Moments owns one signal, `momentsFocused`: true when the focused route is the Moments tab or one of `moments/pick`, the primer, the day sheet, or the enlarge. It is set by the Moments routes themselves (a `useFocusEffect` pair in each, or one provider mounted in the Moments stack layout), not by a global route listener and not by App lock.
- App lock never reads or sets it. `machine.ts` and `coverShown` are untouched (the lock's own cover keeps its behaviour). `shouldCoverMoments` is a second, separate pure function so the two rules cannot drift into one another.
- Truth table (18 rows): route class (Moments, other tab, none) by app state (`active`, `inactive`, `background`) by lock setting (on, off).
  - Moments focused, state not `active`, lock off: cover mounts.
  - Moments focused, state not `active`, lock on: the lock layer governs; the gate mounts nothing (one cover total).
  - Any other route, lock off: no cover.
  - State `active`: no gate cover in any row.

## 4. Behaviour
- The cover mounts in the same frame as `inactive` or `background` is observed, before the OS snapshot, with no fade and no animation (a cut). A brief flash on a notification pull-down is accepted (DC-5).
- On return to `active` it is removed in the next frame with no animation, and VoiceOver focus returns to the element that had it.
- The picker sheet: picks are held in memory while covered. If DM-09 shows the cover cannot hide Apple's view in the snapshot, the sheet dismisses on background and the picks are dropped (G-01); the dismissal path is a hard cut and writes nothing.
- App lock engaging or timing out: the sheet closes, picks and temporary copies are discarded (EXP 4.7 item 5); this is the lock's job, not the gate's.
- Never doubles: with the lock on, exactly one cover is mounted (test by count).

## 5. States
| State | What shows |
|---|---|
| Moments focused, active | Nothing from the gate |
| Moments focused, inactive or background, lock off | `PrivacyCover` |
| Moments focused, lock on | The lock layer's cover only |
| Other tab | Nothing from the gate |
| Returning to active | Cover removed next frame; focus restored |

## 6. Tokens
`bg` (page colour, per scheme), the mark fill the cover already derives per scheme; Increase Contrast swaps the palette through `useTheme`. No `motion` token is used: there is no animation. Reduce Motion, Reduce Transparency and Increase Contrast need no branch.

## 7. Dynamic Type
The cover has no text. Nothing scales. The mark's height is the cover's existing artwork constant (the splash symbol size).

## 8. VoiceOver
One element, role image, label `appLock.coverLabel` (the app name from `packages/brand`). It sits above everything and hides the content beneath from the accessibility tree while mounted. No hint, no day or place name ever.

## 9. Targets
None: it takes no touches that reach content (it is opaque and above all Moments layers, including a modal sheet; the gate is mounted at the root of the Moments stack and, for the host sheet, inside the sheet's root as well, since a transparent modal route sits above the stack's siblings).

## 10. Test list
- PC-T1 L0: `shouldCoverMoments` full 18-row truth table.
- PC-T2 L0: `coverShown` is unchanged (snapshot of its existing tests passes untouched).
- PC-T3 L2: mount count is 1 with the lock on and Moments focused, and 1 with the lock off.
- PC-T4 L2: cover appears in the same render as the state change and has no animated style; removed next frame.
- PC-T5 L2: the signal is true for the tab and for each of the four Moments sheets, false for Home, Book, Me.
- PC-T6 L2: the cover shows no text other than the app name for VoiceOver; no child name, date or place in the tree (a name-leak scan with the Asha fixture).
- PC-T7 L2: with the picker body mounted (Layout C or B) and `inactive`, picks are still held and restored on `active`; with the DM-09 fallback flag on, the sheet is dismissed and picks dropped.
- PC-T8 L1: no analytics or log call in the gate (CLAUDE.md privacy rules).
- PC-T9 L5: G7 row, switcher snapshot with the lock off on the tab, the day sheet and the picker, with a still photo for the record only; DM-09.

## 11. Android later
Android has its own recents snapshot and `FLAG_SECURE`; a different mechanism, specified when Android starts. Not part of this spec.
