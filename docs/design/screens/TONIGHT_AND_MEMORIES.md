# Tonight and the memory card: screen spec

Owner: `design-systems`. Status: final for build, 1 Nov 2026. Not run on a device.

Sources: founder decisions F5 (Plus line after the allowance), F6 (one question plus at most one card; memory card on, with Not today and a switch; no Memories tab; no memory push before 1.2), F7 (no facts before a clinician review), F11 (release map, 20 Nov cut-off); rulings CDesO-4 (Tonight model), CDesO-5 (memory card staging), CPrivO-7 (how memories are chosen), CR-43 (selector in `packages/core`, "Not today" a local per-date flag, the card enters on cold launch only). Working proposals: `proposals/v1-experience/daily-home.md`, `memories.md`, `council.md` Part 3.

Strings are slots. Keys marked **N** are new and `content` adds them; no word is typed in a screen.

## 1. Tonight, as ruled (CDesO-4)

Order, top to bottom: dateline, greeting, **one question** (the hero, new each day), "Another thought", **one card or nothing**, Speak and Type, "Not much today". At most six tappable things above the tab bar. No number on Tonight but the child's age. The same room all day (seeded by date).

| Part | 1 Dec | 1.0.1 | Later |
|---|---|---|---|
| Question | Today's prompt (unchanged) | `anytime` and `evening` tags; the closure line replaces the question once a letter is kept today | |
| Card ladder (first match wins) | Drafts as today; else "A month ago" | Pure, table-tested selector in `packages/core`: newest draft with "Also waiting" (no number), occasion, memory, small thought (3 evenings in 7 at most), else none | Facts only after F7 (1.2 at the earliest) |
| Memory card | "A month ago" gains Not today and the Settings switch (section 2) | Keep out of memories, the hard filter, opens via `cardToPage` with its words carried, signature and voice marker | New types and the memory room (1.1); opt-in push (1.2, after BL-547) |
| Plus | One standing line after the allowance is used (section 3) | | |

Nothing else sits on Tonight: no reminder card, tips, "what's new", carousel, badge or dot, including for a memory.

**VoiceOver order (1 Dec):** dateline ("Asha, 7 months"), greeting (heading 1), prompt (hint `t.promptLabel`), Another thought, the card (one element), Speak, Type, Not much today, the Plus line when shown. A prompt change is announced; focus stays on Another thought. The card never announces itself.

**AX5:** Speak and Type ride inline under the prompt (built), so the card falls below them. No `numberOfLines` on the prompt; the card's excerpt keeps the whole text in its element. Every control is at least 44 pt.

**Motion:** cold launch only, dateline, greeting, prompt and the card `enter` at `staggerMs` (MOTION 5a). Warm resume, tab return and return from Listen or a letter move nothing. **Reduce Motion:** one `fadeMs` fade. **Reduce Transparency, Increase Contrast:** plain paper.

**Haptics:** Speak and Type `press`; Another thought `tap`; Not much today `soft`; Not today on the card `soft`. Opening a card is navigation: none.

## 2. The memory card (1 Dec)

The existing `ResurfacedCard` (COMPONENTS 2.31): the newest kept letter dated 28 to 35 days ago, shown only when no draft is waiting, never private, never a quiet mark. Chosen by date and the parent's own marks, never by reading the words (CPrivO-7).

```
+--------------------------------------------+
| A MONTH AGO                         (x)    |
| You found the spoon today and would not    |
| let it go, even in the                     |
+--------------------------------------------+
```

| State | What shows | Motion | VoiceOver |
|---|---|---|---|
| None (nothing qualifies, a draft waits, switch off, or Not today used) | Nothing, no space, nothing said | | |
| Shown | Kicker, two lines in `ExcerptFade`, the (x) | Enters last in the cold-launch stagger; if it qualifies mid-session it waits for the next cold launch | One element: the card's `a11yLabel` (kicker, the whole excerpt, its date), hint `memories.openHint` (**N**), custom action `memories.notToday` (**N**) |
| Not today | The card fades over `exitMs`, then the space closes on `standard`; nothing replaces it today | RM: `fadeMs`, the space closes at once | Announce `memories.notTodayDone` (**N**) once; focus moves to Speak |
| Switch off | No card until the switch is on again | | |
| Stale (deleted or made private since) | The existing stale-link `StateScreen` on open | | |

- **(x) target:** `IconButton` `sm` `plain`, Phosphor X Bold 16 in `textMuted`, hit area 44 pt, label `memories.notToday`. It sits in the kicker row, top right. Two targets only: the card and the (x).
- **Not today is local and per date** (CR-43): a flag for today's date on this phone. It hides today's card only; tomorrow follows the rules again. No server, no analytics.
- **AX5:** the kicker wraps; the (x) becomes a full-width `Button quiet` row reading `memories.notToday` under the excerpt.
- **Opening:** `letter/[id]` moves to `cardToPage` in 1 Dec (MOTION 5n row 1). The card has no `CardText` until 1.0.1, so the page arrives by the hand-off fade, not with carried words.
- **Never:** autoplay, Ken Burns, music, a drawing on the card, a glow, a pulse, a lamp change (CDesO-5, CDesO-7).
- **Themes:** kicker and excerpt on `surfaceRaised` (`textMuted` 5.83 / 7.32); the accent left rule is decorative, the kicker's words carry the meaning.

## 3. The Plus line on Tonight (F5, F14-REQ-040)

Before the free letters are used: no Plus on Tonight. After: one standing line. Words and placement are PR #508's and `content`'s. This spec fixes only the rules: one line, `footnote` `textMuted`, no count, no button, never a card, never in the card slot, the same on Write; VoiceOver reads it last. "{count} letters waiting" is refused (council D4).

## 4. Hand-offs

- `mobile`: the (x), the per-date flag, the switch wiring, the AX5 row, after 9 Nov.
- `content`: `memories.notToday`, `memories.notTodayDone`, `memories.openHint`, `settingsHome.memoriesToggle`, `settingsHome.memoriesHelp`.
- `core` (1.0.1): the slot selector and its tests (CR-43).
